import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { AuthRequest } from '../middleware/auth';
import { Order, IOrder } from '../models/Order';
import { User } from '../models/User';
import { ApiError } from '../utils/apiError';
import { razorpayInstance } from '../config/razorpay';
import { env } from '../config/env';
import { shiprocketService } from '../services/shiprocketService';
import {
  applyCourierStatus,
  cancelOrder,
  consumeCoupon,
  createGatewayOrder,
  expireStalePendingPayments,
  generateOrderNumber,
  getPaymentDeadline,
  isMockGatewayOrder,
  markOrderPaid,
  priceCart,
  pushHistory,
  reconcileGatewayPayment,
  releaseStock,
  reserveStock,
  verifyGatewaySignature,
} from '../services/orderLifecycleService';
import {
  ORDER_STATUSES,
  OrderStatus,
  PAYMENT_STATUSES,
  STATUS_MESSAGES,
  STATUS_PIPELINE,
  TERMINAL_STATUSES,
  getNextStatus,
  normalizeOrderStatus,
} from '../constants/orderStatus';

// ─── Shared helpers ───────────────────────────────────────────────────────────

const isAdmin = (req: AuthRequest) => req.user?.role === 'admin';

const ownerId = (order: IOrder): string =>
  ((order.user as any)?._id || order.user)?.toString?.() || '';

const assertOwnerOrAdmin = (order: IOrder, req: AuthRequest, action = 'view this order') => {
  if (ownerId(order) !== req.user?._id.toString() && !isAdmin(req)) {
    throw new ApiError(`Not authorized to ${action}`, 403);
  }
};

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const sanitizeAddress = (addr: any) => {
  if (!addr || typeof addr !== 'object') throw new ApiError('Shipping address is required', 400);
  const clean = {
    fullName: String(addr.fullName || '').trim(),
    street: String(addr.street || '').trim(),
    apartment: String(addr.apartment || '').trim(),
    city: String(addr.city || '').trim(),
    state: String(addr.state || '').trim(),
    postalCode: String(addr.postalCode || '').trim(),
    country: String(addr.country || 'India').trim(),
    phone: String(addr.phone || '').trim(),
  };
  const missing = (['fullName', 'street', 'city', 'state', 'postalCode', 'phone'] as const).filter((k) => !clean[k]);
  if (missing.length) throw new ApiError(`Shipping address is incomplete: ${missing.join(', ')}`, 400);
  if (!/^\d{6}$/.test(clean.postalCode)) throw new ApiError('Please enter a valid 6-digit PIN code.', 400);
  if (clean.phone.replace(/\D/g, '').length < 10) throw new ApiError('Please enter a valid 10-digit phone number.', 400);
  return clean;
};

const gatewayPayload = (gateway: { id: string; amount: number; currency: string; isMock?: boolean }) => ({
  id: gateway.id,
  amount: gateway.amount,
  currency: gateway.currency,
  isMock: !!gateway.isMock,
});

// ─── Checkout: Online (Razorpay) ──────────────────────────────────────────────

/**
 * POST /api/orders/razorpay
 * Creates the order FIRST (status "placed", payment "pending", stock reserved),
 * then a Razorpay order. If the customer's network drops during payment the
 * order is safe and can be paid later from "My Orders".
 */
export const createRazorpayOrder = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { items, shippingAddress, couponCode } = req.body;
    const address = sanitizeAddress(shippingAddress);
    const priced = await priceCart(items, couponCode);

    if (priced.total <= 0) {
      return next(new ApiError('Order total must be greater than zero for online payment.', 400));
    }

    await reserveStock(priced.orderItems);

    let order: IOrder;
    let gateway: Awaited<ReturnType<typeof createGatewayOrder>>;
    try {
      const orderNumber = generateOrderNumber();
      gateway = await createGatewayOrder(priced.total, orderNumber, {
        orderNumber,
        userId: req.user?._id.toString() || '',
      });

      order = await Order.create({
        orderNumber,
        user: req.user?._id,
        items: priced.orderItems,
        shippingAddress: address,
        paymentMethod: 'razorpay',
        paymentStatus: 'pending',
        paymentDetails: {
          razorpayOrderId: gateway.id,
          gatewayOrderHistory: [gateway.id],
          attempts: 1,
          lastAttemptAt: new Date(),
        },
        paymentExpiresAt: getPaymentDeadline(),
        subtotal: priced.subtotal,
        shippingFee: priced.shippingFee,
        discount: priced.discount,
        couponCode: priced.couponCode,
        tax: priced.tax,
        total: priced.total,
        status: 'placed',
        trackingNumber: `TRACK-${orderNumber}`,
        trackingHistory: [
          { status: 'placed', message: 'Order placed — awaiting online payment.', actor: 'customer', timestamp: new Date() },
        ],
      });
    } catch (err) {
      await releaseStock(priced.orderItems);
      throw err;
    }

    await consumeCoupon(priced.couponId);

    res.status(201).json({
      success: true,
      message: 'Order created. Complete the payment to confirm it.',
      data: {
        order,
        razorpayOrder: gatewayPayload(gateway),
        keyId: env.RAZORPAY_KEY_ID,
        paymentWindowMinutes: env.PAYMENT_WINDOW_MINUTES,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/orders/:id/verify-payment
 * Verifies the Razorpay signature for an existing order and confirms it.
 * Idempotent — calling it again for a paid order simply returns the order.
 */
export const verifyOrderPayment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return next(new ApiError('Order not found', 404));
    assertOwnerOrAdmin(order, req, 'pay for this order');

    if (order.paymentMethod === 'cod') {
      return next(new ApiError('Cash on Delivery orders do not require online payment.', 400));
    }
    if (order.paymentStatus === 'paid' || order.paymentStatus === 'refunded') {
      res.status(200).json({ success: true, message: 'Payment already verified.', data: order });
      return;
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const knownGatewayIds = [order.paymentDetails?.razorpayOrderId, ...(order.paymentDetails?.gatewayOrderHistory || [])];

    if (!razorpay_order_id || !knownGatewayIds.includes(razorpay_order_id)) {
      return next(new ApiError('This payment does not belong to the selected order.', 400));
    }

    if (!verifyGatewaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
      order.paymentStatus = 'failed';
      order.paymentDetails = { ...(order.paymentDetails as any), failureReason: 'Signature verification failed' };
      pushHistory(order, 'payment', 'Payment verification failed (signature mismatch).', 'system');
      await order.save();
      return next(new ApiError('Payment verification failed. If money was debited, it will be auto-reconciled or refunded.', 400));
    }

    await markOrderPaid(order, {
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
      source: 'checkout',
    });

    res.status(200).json({
      success: true,
      message:
        order.status === 'cancelled'
          ? 'Payment received, but this order was already cancelled. A full refund has been initiated.'
          : 'Payment verified — your order is confirmed!',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/orders/:id/payment-failed
 * Records a failed gateway attempt (card declined, UPI timeout, ...).
 * The order stays payable until the payment window closes.
 */
export const recordPaymentFailure = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return next(new ApiError('Order not found', 404));
    assertOwnerOrAdmin(order, req, 'update this order');

    if (order.paymentMethod !== 'cod' && order.paymentStatus !== 'paid' && order.status === 'placed') {
      const reason = String(req.body?.reason || 'Payment was not completed').slice(0, 300);
      order.paymentStatus = 'failed';
      order.paymentDetails = { ...(order.paymentDetails as any), failureReason: reason, lastAttemptAt: new Date() };
      pushHistory(order, 'payment', `Payment attempt failed: ${reason}`, 'customer');
      await order.save();
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/orders/:id/pay
 * "Complete Payment" for a pending/failed online order.
 * 1) Reconciles with Razorpay first (avoids double charge after a network drop)
 * 2) Re-uses the existing gateway order when possible, otherwise issues a new one
 */
export const retryOrderPayment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return next(new ApiError('Order not found', 404));
    assertOwnerOrAdmin(order, req, 'pay for this order');

    if (order.paymentMethod === 'cod') {
      return next(new ApiError('Cash on Delivery orders are paid to the courier on delivery.', 400));
    }
    if (order.status === 'cancelled') {
      return next(new ApiError('This order has been cancelled and can no longer be paid.', 400));
    }

    // Step 1 — did the payment actually succeed already?
    if (order.paymentStatus === 'paid' || (await reconcileGatewayPayment(order))) {
      res.status(200).json({
        success: true,
        message: 'Good news — we found your payment. The order is confirmed.',
        data: { alreadyPaid: true, order },
      });
      return;
    }

    // Step 2 — payment window
    if (order.paymentExpiresAt && order.paymentExpiresAt.getTime() <= Date.now()) {
      await cancelOrder(order, { reason: 'Payment not completed within the allowed time window', actor: 'system' });
      return next(new ApiError('The payment window for this order has expired. The order was cancelled and items released.', 410));
    }

    // Step 3 — gateway order (reuse when still valid)
    const amountInPaise = Math.round(order.total * 100);
    let gateway: { id: string; amount: number; currency: string; isMock?: boolean } | null = null;
    const existingId = order.paymentDetails?.razorpayOrderId;

    if (existingId && isMockGatewayOrder(existingId)) {
      gateway = { id: existingId, amount: amountInPaise, currency: 'INR', isMock: true };
    } else if (existingId) {
      try {
        const g: any = await razorpayInstance.orders.fetch(existingId);
        if (g && g.status !== 'paid' && Number(g.amount) === amountInPaise) {
          gateway = { id: g.id, amount: Number(g.amount), currency: g.currency };
        }
      } catch {
        /* fall through and create a fresh gateway order */
      }
    }

    const attempts = (order.paymentDetails?.attempts || 0) + 1;
    if (!gateway) {
      gateway = await createGatewayOrder(order.total, `${order.orderNumber}-R${attempts}`, {
        orderNumber: order.orderNumber,
        userId: ownerId(order),
      });
    }

    const history = new Set(order.paymentDetails?.gatewayOrderHistory || []);
    if (existingId) history.add(existingId);
    history.add(gateway.id);

    order.paymentDetails = {
      ...(order.paymentDetails as any),
      razorpayOrderId: gateway.id,
      gatewayOrderHistory: Array.from(history),
      attempts,
      lastAttemptAt: new Date(),
    };
    await order.save();

    res.status(200).json({
      success: true,
      data: {
        alreadyPaid: false,
        order,
        razorpayOrder: gatewayPayload(gateway),
        keyId: env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Checkout: Cash on Delivery ───────────────────────────────────────────────

export const createCODOrder = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { items, shippingAddress, couponCode } = req.body;

    if (!Array.isArray(items) || !items.length) {
      return next(new ApiError('Cart is empty. Cannot initiate checkout.', 400));
    }

    // COD Validation: 2 or more distinct products OR any product with quantity >= 2
    const isCodEligible = items.length >= 2 || items.some((item: any) => Number(item.quantity) >= 2);
    if (!isCodEligible) {
      return next(
        new ApiError(
          'Cash on Delivery is only available when selecting at least 2 products or any single product with quantity 2 or more.',
          400
        )
      );
    }

    const address = sanitizeAddress(shippingAddress);
    const priced = await priceCart(items, couponCode);
    await reserveStock(priced.orderItems);

    let newOrder: IOrder;
    try {
      const orderNumber = generateOrderNumber();
      newOrder = await Order.create({
        orderNumber,
        user: req.user?._id,
        items: priced.orderItems,
        shippingAddress: address,
        paymentMethod: 'cod',
        paymentStatus: 'pending',
        paymentDetails: { method: 'cod' },
        subtotal: priced.subtotal,
        shippingFee: priced.shippingFee,
        discount: priced.discount,
        couponCode: priced.couponCode,
        tax: priced.tax,
        total: priced.total,
        status: 'placed',
        trackingNumber: `TRACK-${orderNumber}`,
        trackingHistory: [
          {
            status: 'placed',
            message: 'Order placed with Cash on Delivery — awaiting confirmation.',
            actor: 'customer',
            timestamp: new Date(),
          },
        ],
      });
    } catch (err) {
      await releaseStock(priced.orderItems);
      throw err;
    }

    await consumeCoupon(priced.couponId);

    res.status(201).json({
      success: true,
      message: 'Cash on Delivery order placed successfully!',
      data: newOrder,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Customer: Orders ─────────────────────────────────────────────────────────

export const getMyOrders = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await expireStalePendingPayments({ user: req.user?._id });
    const orders = await Order.find({ user: req.user?._id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    await expireStalePendingPayments({ _id: id });
    const order = await Order.findById(id).populate('user', 'name email phone');

    if (!order) return next(new ApiError('Order not found', 404));
    assertOwnerOrAdmin(order, req);

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/orders/:id/cancel   { reason, note? }
 * Customer (owner) or admin. Allowed only before the order is shipped.
 * Restocks items, releases coupon, voids courier manifest, refunds prepaid amount.
 */
export const cancelOrderRequest = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email phone');
    if (!order) return next(new ApiError('Order not found', 404));
    assertOwnerOrAdmin(order, req, 'cancel this order');

    const reason = String(req.body?.reason || '').trim();
    const note = String(req.body?.note || '').trim().slice(0, 500) || undefined;
    if (reason.length < 3) return next(new ApiError('Please select a reason for cancellation.', 400));

    const actor = ownerId(order) === req.user?._id.toString() ? 'customer' : 'admin';
    const wasPaid = order.paymentStatus === 'paid';

    await cancelOrder(order, { reason: reason.slice(0, 200), note, actor });

    let message = 'Your order has been cancelled.';
    if (wasPaid) {
      message =
        order.refund?.status === 'failed'
          ? 'Order cancelled. Our team will process your refund manually within 24 hours.'
          : `Order cancelled. A refund of ₹${order.total.toLocaleString('en-IN')} has been initiated to your original payment method.`;
    }

    res.status(200).json({ success: true, message, data: order });
  } catch (error) {
    next(error);
  }
};

// ─── Admin: Orders ────────────────────────────────────────────────────────────

export const getAllOrders = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, paymentStatus, paymentMethod, q, page = 1, limit = 20 } = req.query as Record<string, string>;
    const query: Record<string, any> = {};

    if (status && status !== 'all' && status !== 'All') {
      const s = String(status).toLowerCase();
      if (!(ORDER_STATUSES as readonly string[]).includes(s)) {
        return next(new ApiError(`Unknown status filter "${status}"`, 400));
      }
      query.status = s;
    }
    if (paymentStatus && (PAYMENT_STATUSES as readonly string[]).includes(paymentStatus)) {
      query.paymentStatus = paymentStatus;
    }
    if (paymentMethod === 'cod') query.paymentMethod = 'cod';
    if (paymentMethod === 'online') query.paymentMethod = { $ne: 'cod' };

    const search = String(q || '').trim();
    if (search) {
      const rx = new RegExp(escapeRegex(search), 'i');
      const users = await User.find({ $or: [{ name: rx }, { email: rx }] }).select('_id').limit(50);
      query.$or = [
        { orderNumber: rx },
        { 'shippingAddress.fullName': rx },
        { 'shippingAddress.phone': rx },
        { 'shippingAddress.city': rx },
        { trackingNumber: rx },
        { 'shiprocket.awbCode': rx },
        { user: { $in: users.map((u) => u._id) } },
      ];
    }

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [total, orders, statusAgg, awaitingPayment] = await Promise.all([
      Order.countDocuments(query),
      Order.find(query).populate('user', 'name email phone').sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Order.countDocuments({ paymentMethod: { $ne: 'cod' }, paymentStatus: { $in: ['pending', 'failed'] }, status: 'placed' }),
    ]);

    const counts: Record<string, number> = { all: 0 };
    ORDER_STATUSES.forEach((s) => (counts[s] = 0));
    statusAgg.forEach((row: { _id: string; count: number }) => {
      const key = normalizeOrderStatus(row._id);
      counts[key] = (counts[key] || 0) + row.count;
      counts.all += row.count;
    });

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      totalPages: Math.max(1, Math.ceil(total / limitNum)),
      currentPage: pageNum,
      counts,
      awaitingPayment,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/orders/:id/status   (admin)
 * body: { status, note?, reason?, courierName?, trackingNumber?, trackingUrl? }
 *
 * Strict, forward-only, one step at a time:
 *   placed → confirmed → processing → shipped → delivered
 * "cancelled" is accepted only before shipping (delegates to cancelOrder).
 */
export const updateOrderStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, note, reason, courierName, trackingNumber, trackingUrl } = req.body || {};

    const order = await Order.findById(id).populate('user', 'name email phone');
    if (!order) return next(new ApiError('Order not found', 404));

    const current = normalizeOrderStatus(order.status);
    const cleanNote = note ? String(note).trim().slice(0, 500) : '';

    if (!status) {
      if (trackingNumber) {
        order.trackingNumber = String(trackingNumber).trim();
        pushHistory(order, current, `Tracking number updated to ${order.trackingNumber}.`, 'admin');
        await order.save();
      }
      res.status(200).json({ success: true, message: 'Order updated', data: order });
      return;
    }

    const target = String(status).toLowerCase() as OrderStatus;
    if (!(ORDER_STATUSES as readonly string[]).includes(target)) {
      return next(new ApiError(`Unknown status "${status}". Allowed: ${ORDER_STATUSES.join(', ')}`, 400));
    }

    if (TERMINAL_STATUSES.includes(current)) {
      return next(
        new ApiError(
          current === 'delivered'
            ? 'This order is already delivered. Its status is permanently locked.'
            : 'This order is cancelled. Its status cannot be modified.',
          400
        )
      );
    }

    // ── Cancellation ────────────────────────────────────────────────────────
    if (target === 'cancelled') {
      const cancelReason = String(reason || cleanNote || '').trim();
      if (cancelReason.length < 3) return next(new ApiError('A cancellation reason is required.', 400));
      await cancelOrder(order, { reason: cancelReason.slice(0, 200), note: cleanNote || undefined, actor: 'admin' });
      res.status(200).json({ success: true, message: 'Order cancelled successfully.', data: order });
      return;
    }

    // ── Forward progression ─────────────────────────────────────────────────
    const allowedNext = getNextStatus(current);
    if (target !== allowedNext) {
      return next(
        new ApiError(
          `Invalid transition "${current}" → "${target}". The next allowed step is "${allowedNext}".`,
          400
        )
      );
    }

    if (target === 'confirmed' && order.paymentMethod !== 'cod' && order.paymentStatus !== 'paid') {
      return next(
        new ApiError('Online payment has not been received yet. Use "Sync payment" to re-check with Razorpay.', 400)
      );
    }

    let message = cleanNote || STATUS_MESSAGES[target];

    if (target === 'shipped') {
      const manualAwb = trackingNumber ? String(trackingNumber).trim() : '';
      if (manualAwb) {
        order.shiprocket = {
          ...((order.shiprocket as any)?.toObject?.() || order.shiprocket || {}),
          awbCode: manualAwb,
          courierName: courierName ? String(courierName).trim() : order.shiprocket?.courierName || 'Courier Partner',
          trackingUrl: trackingUrl ? String(trackingUrl).trim() : order.shiprocket?.trackingUrl,
        };
        order.trackingNumber = manualAwb;
      } else if (!order.shiprocket?.awbCode) {
        const shipment = await shiprocketService.createFullShipment(order);
        order.shiprocket = shipment;
        order.trackingNumber = shipment.awbCode;
      }
      if (order.shiprocket) order.shiprocket.currentStatus = 'Shipped';
      message = `${cleanNote || STATUS_MESSAGES.shipped} Courier: ${order.shiprocket?.courierName || 'Partner'} · AWB: ${
        order.shiprocket?.awbCode || order.trackingNumber
      }`;
    }

    order.status = target;
    pushHistory(order, target, message, 'admin');

    if (order.shiprocket && target !== 'shipped') {
      if (!order.shiprocket.activities) order.shiprocket.activities = [];
      order.shiprocket.activities.push({
        date: new Date().toISOString(),
        status: target,
        activity: message,
        location: order.shippingAddress?.city || 'Hydra Fulfilment Center',
      });
    }

    if (target === 'delivered') {
      if (order.shiprocket) order.shiprocket.currentStatus = 'Delivered';
      // For COD orders, payment remains pending until admin collects money via Collect Money button
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: `Order moved to "${target}".`,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

/** POST /api/orders/:id/sync-payment (admin) — re-check an online payment with Razorpay */
export const syncOrderPayment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email phone');
    if (!order) return next(new ApiError('Order not found', 404));
    if (order.paymentMethod === 'cod') return next(new ApiError('COD orders are settled on delivery.', 400));

    const paid = await reconcileGatewayPayment(order);
    res.status(200).json({
      success: true,
      message: paid ? 'Payment found and order confirmed.' : 'No successful payment found on Razorpay for this order yet.',
      data: { paid, order },
    });
  } catch (error) {
    next(error);
  }
};

/** POST /api/orders/:id/collect-cod (admin) — mark Cash on Delivery payment as received */
export const collectCodPayment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email phone');
    if (!order) return next(new ApiError('Order not found', 404));

    if (order.paymentMethod !== 'cod') {
      return next(new ApiError('This order is not a Cash on Delivery order.', 400));
    }

    if (order.paymentStatus === 'paid') {
      return next(new ApiError('COD payment has already been marked as collected.', 400));
    }

    // Validation: Only allow collecting money once the order is delivered
    const norm = normalizeOrderStatus(order.status);
    if (norm !== 'delivered') {
      return next(
        new ApiError('COD payment can only be marked as collected after the order is delivered.', 400)
      );
    }

    order.paymentStatus = 'paid';
    order.paymentDetails = {
      ...(order.paymentDetails as any),
      method: 'cod',
      paidAt: new Date(),
    };

    pushHistory(
      order,
      'payment',
      `Cash on Delivery payment of ₹${order.total.toLocaleString('en-IN')} marked as received.`,
      'admin'
    );

    await order.save();

    res.status(200).json({
      success: true,
      message: 'COD payment collected successfully!',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/orders/:id/shiprocket/create (admin)
 * Generates a courier manifest + AWB ahead of dispatch. Does NOT change status;
 * use the "Mark as Shipped" command to move the order forward.
 */
export const createShiprocketShipment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email phone');
    if (!order) return next(new ApiError('Order not found', 404));

    const current = normalizeOrderStatus(order.status);
    if (!['confirmed', 'processing', 'shipped'].includes(current)) {
      return next(new ApiError(`Shipments can only be generated for confirmed / processing orders (current: ${current}).`, 400));
    }

    const shipment = await shiprocketService.createFullShipment(order);
    order.shiprocket = shipment;
    order.trackingNumber = shipment.awbCode;
    pushHistory(
      order,
      current,
      `Courier manifest generated with ${shipment.courierName}. AWB: ${shipment.awbCode}`,
      'admin'
    );
    await order.save();

    res.status(200).json({
      success: true,
      message: `Shipment generated — AWB ${shipment.awbCode} (${shipment.courierName}).`,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Tracking ─────────────────────────────────────────────────────────────────

export const getShiprocketTracking = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return next(new ApiError('Order not found', 404));
    assertOwnerOrAdmin(order, req, 'track this order');

    let liveActivities = order.shiprocket?.activities || [];
    if (order.shiprocket?.awbCode && order.status !== 'cancelled') {
      const liveData = await shiprocketService.trackShipment(order.shiprocket.awbCode);
      if (liveData) {
        let dirty = false;
        if (liveData.currentStatus && liveData.currentStatus !== order.shiprocket.currentStatus) {
          order.shiprocket.currentStatus = liveData.currentStatus;
          dirty = true;
          if (applyCourierStatus(order, liveData.currentStatus, 'Live tracking')) dirty = true;
        }
        if (liveData.activities && liveData.activities.length > 0) liveActivities = liveData.activities;
        if (dirty) await order.save();
      }
    }

    res.status(200).json({
      success: true,
      data: {
        orderNumber: order.orderNumber,
        status: order.status,
        trackingNumber: order.trackingNumber,
        shiprocket: {
          ...((order.shiprocket as any)?.toObject?.() || order.shiprocket || {}),
          activities: liveActivities,
        },
        shippingAddress: order.shippingAddress,
        trackingHistory: order.trackingHistory,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Razorpay Webhook ─────────────────────────────────────────────────────────
/**
 * POST /api/orders/webhook/razorpay
 * Configure in Razorpay Dashboard → Settings → Webhooks with events:
 *   payment.captured, payment.failed, order.paid, refund.processed
 * Set RAZORPAY_WEBHOOK_SECRET to the same secret.
 * This is the safety net when the customer's browser never returns after paying.
 */
export const razorpayWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!env.RAZORPAY_WEBHOOK_SECRET) {
      res.status(200).json({ success: true, message: 'Webhook secret not configured — ignored.' });
      return;
    }

    const signature = String(req.headers['x-razorpay-signature'] || '');
    const raw: Buffer = (req as any).rawBody || Buffer.from(JSON.stringify(req.body || {}));
    const expected = crypto.createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET).update(raw).digest('hex');
    const valid =
      signature.length === expected.length && crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    if (!valid) {
      res.status(401).json({ success: false, message: 'Invalid signature' });
      return;
    }

    const event: string = req.body?.event;
    const payment = req.body?.payload?.payment?.entity;
    const refund = req.body?.payload?.refund?.entity;

    const findByGatewayOrder = (gatewayOrderId?: string) =>
      gatewayOrderId
        ? Order.findOne({
            $or: [
              { 'paymentDetails.razorpayOrderId': gatewayOrderId },
              { 'paymentDetails.gatewayOrderHistory': gatewayOrderId },
            ],
          })
        : null;

    if ((event === 'payment.captured' || event === 'order.paid' || event === 'payment.authorized') && payment) {
      const order = await findByGatewayOrder(payment.order_id);
      if (order && order.paymentStatus !== 'paid') {
        await markOrderPaid(order, { paymentId: payment.id, method: payment.method, source: 'Razorpay webhook' });
      }
    } else if (event === 'payment.failed' && payment) {
      const order = await findByGatewayOrder(payment.order_id);
      if (order && order.paymentStatus !== 'paid' && order.status === 'placed') {
        order.paymentStatus = 'failed';
        order.paymentDetails = {
          ...(order.paymentDetails as any),
          failureReason: payment.error_description || 'Payment failed',
        };
        pushHistory(order, 'payment', `Payment attempt failed: ${payment.error_description || 'declined'}`, 'system');
        await order.save();
      }
    } else if (event === 'refund.processed' && refund) {
      const order = await Order.findOne({ 'paymentDetails.razorpayPaymentId': refund.payment_id });
      if (order && order.refund?.status !== 'processed') {
        order.refund = {
          ...((order.refund as any)?.toObject?.() || order.refund || {}),
          refundId: refund.id,
          status: 'processed',
          processedAt: new Date(),
        };
        order.paymentStatus = 'refunded';
        pushHistory(order, 'refund', `Refund ${refund.id} processed successfully.`, 'system');
        await order.save();
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('[Razorpay Webhook] Error:', error);
    res.status(200).json({ success: true });
  }
};

/** Exposed for tooling / tests */
export const ORDER_PIPELINE = STATUS_PIPELINE;

// Customer / Admin: View and Print PDF Invoice
export const getOrderInvoice = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id).populate('user', 'name email phone');

    if (!order) {
      return next(new ApiError('Order not found', 404));
    }

    if (
      (order.user as any)?._id?.toString() !== req.user?._id.toString() &&
      req.user?.role !== 'admin'
    ) {
      return next(new ApiError('Not authorized to access this invoice', 403));
    }

    const invoiceDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const isAutoPrint = req.query.print === 'true';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice #${order.orderNumber} — HYDRA Skincare</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
      color: #1A211D;
      background: #F4F2EE;
      padding: 40px 20px;
      -webkit-font-smoothing: antialiased;
    }
    .invoice-wrapper {
      max-width: 800px;
      margin: 0 auto;
      background: #FFFFFF;
      border-radius: 16px;
      padding: 48px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.06);
      border: 1px solid #E6E1D8;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #13382B;
      padding-bottom: 24px;
      margin-bottom: 28px;
    }
    .brand-title {
      font-family: 'Playfair Display', serif;
      font-size: 32px;
      font-weight: 700;
      color: #13382B;
      letter-spacing: 2px;
    }
    .brand-subtitle {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #7A8B80;
      margin-top: 4px;
    }
    .invoice-badge {
      text-align: right;
    }
    .invoice-badge h2 {
      font-family: 'Playfair Display', serif;
      font-size: 24px;
      color: #13382B;
    }
    .invoice-badge p {
      font-size: 12px;
      color: #555;
      margin-top: 2px;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 24px;
      margin-bottom: 28px;
      padding-bottom: 24px;
      border-bottom: 1px dashed #DDD7CD;
    }
    .meta-box h4 {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #7A8B80;
      margin-bottom: 8px;
    }
    .meta-box p {
      font-size: 13px;
      line-height: 1.6;
      color: #2D3732;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 28px;
    }
    .items-table th {
      background: #FAF8F5;
      color: #13382B;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      padding: 12px 14px;
      text-align: left;
      border-bottom: 1px solid #E6E1D8;
    }
    .items-table td {
      padding: 14px;
      font-size: 13px;
      border-bottom: 1px solid #F0ECE4;
      vertical-align: middle;
    }
    .items-table tr:last-child td {
      border-bottom: none;
    }
    .summary-grid {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 32px;
    }
    .summary-table {
      width: 320px;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 13px;
      color: #555;
    }
    .summary-row.total {
      font-family: 'Playfair Display', serif;
      font-size: 18px;
      font-weight: 700;
      color: #13382B;
      border-top: 2px solid #13382B;
      padding-top: 10px;
      margin-top: 6px;
    }
    .paid-stamp {
      display: inline-block;
      padding: 6px 14px;
      background: #EAF1EB;
      color: #2E6B48;
      border: 1px solid #B8DAC2;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .footer {
      border-top: 1px solid #E6E1D8;
      padding-top: 20px;
      text-align: center;
      font-size: 11px;
      color: #7A8B80;
      line-height: 1.6;
    }
    .btn-bar {
      max-width: 800px;
      margin: 0 auto 20px;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }
    .btn {
      padding: 10px 20px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      border: none;
    }
    .btn-primary { background: #13382B; color: #FFF; }
    @media print {
      body { background: #FFF; padding: 0; }
      .invoice-wrapper { box-shadow: none; border: none; padding: 20px 0; }
      .btn-bar { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="btn-bar">
    <button onclick="window.print()" class="btn btn-primary">🖨️ Print / Save as PDF</button>
  </div>

  <div class="invoice-wrapper">
    <div class="header">
      <div>
        <div class="brand-title">HYDRA</div>
        <div class="brand-subtitle">Nature • Science • Radiance</div>
        <p style="font-size: 11px; color: #7A8B80; margin-top: 6px;">
          Hydra Luxury Botanical Skincare Private Ltd.<br>
          GSTIN: 27AABCH1234F1Z8 | FSSAI: 11522000000000
        </p>
      </div>
      <div class="invoice-badge">
        <h2>TAX INVOICE</h2>
        <p><strong>Invoice No:</strong> INV-${order.orderNumber}</p>
        <p><strong>Order No:</strong> ${order.orderNumber}</p>
        <p><strong>Date:</strong> ${invoiceDate}</p>
        <div style="margin-top: 8px;">
          <span class="paid-stamp">${
            order.paymentStatus === 'refunded'
              ? 'Payment Refunded'
              : order.paymentStatus === 'paid'
              ? order.paymentMethod === 'cod'
                ? 'Paid (Cash on Delivery)'
                : 'Payment Completed (Prepaid)'
              : order.paymentMethod === 'cod'
              ? 'Payable on Delivery (COD)'
              : 'Payment Pending'
          }</span>
        </div>
      </div>
    </div>

    <div class="meta-grid">
      <div class="meta-box">
        <h4>Billed & Shipped To</h4>
        <p><strong>${order.shippingAddress.fullName}</strong></p>
        <p>${order.shippingAddress.street}${order.shippingAddress.apartment ? ', ' + order.shippingAddress.apartment : ''}</p>
        <p>${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.postalCode}</p>
        <p>${order.shippingAddress.country || 'India'}</p>
        <p><strong>Phone:</strong> ${order.shippingAddress.phone}</p>
      </div>

      <div class="meta-box">
        <h4>Shipping & Payment Logistics</h4>
        <p><strong>Payment Method:</strong> ${
          order.paymentMethod === 'cod'
            ? 'Cash on Delivery'
            : `Razorpay${order.paymentDetails?.method ? ' · ' + String(order.paymentDetails.method).toUpperCase() : ''}`
        }</p>
        <p><strong>Payment ID:</strong> ${order.paymentDetails?.razorpayPaymentId || 'Verified Online Payment'}</p>
        <p><strong>Courier Partner:</strong> ${order.shiprocket?.courierName || 'Priority Skincare Air Courier'}</p>
        <p><strong>Shiprocket AWB:</strong> ${order.shiprocket?.awbCode || order.trackingNumber || 'SR-PRIORITY-DISPATCH'}</p>
        <p><strong>Status:</strong> ${order.status}</p>
      </div>
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Formulation / Item</th>
          <th>Volume</th>
          <th>Qty</th>
          <th style="text-align: right;">Unit Price</th>
          <th style="text-align: right;">Total Amount</th>
        </tr>
      </thead>
      <tbody>
        ${order.items
          .map(
            (item, index) => `
          <tr>
            <td>${index + 1}</td>
            <td><strong>${item.name}</strong></td>
            <td>${item.size || '50ml'}</td>
            <td>${item.quantity}</td>
            <td style="text-align: right;">₹${item.price.toLocaleString('en-IN')}</td>
            <td style="text-align: right; font-weight: 600;">₹${(item.price * item.quantity).toLocaleString('en-IN')}</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>

    <div class="summary-grid">
      <div class="summary-table">
        <div class="summary-row">
          <span>Items Subtotal:</span>
          <span>₹${order.subtotal.toLocaleString('en-IN')}</span>
        </div>
        ${
          order.discount > 0
            ? `<div class="summary-row" style="color: #2E6B48;">
          <span>Voucher Discount (${order.couponCode || 'PROMO'}):</span>
          <span>-₹${order.discount.toLocaleString('en-IN')}</span>
        </div>`
            : ''
        }
        <div class="summary-row">
          <span>Express Courier Shipping:</span>
          <span>${order.shippingFee === 0 ? 'FREE' : `₹${order.shippingFee}`}</span>
        </div>
        <div class="summary-row">
          <span>GST (5% Integrated Tax):</span>
          <span>₹${order.tax.toLocaleString('en-IN')}</span>
        </div>
        <div class="summary-row total">
          <span>Grand Total Paid:</span>
          <span>₹${order.total.toLocaleString('en-IN')}</span>
        </div>
      </div>
    </div>

    <div class="footer">
      <p>Thank you for choosing Hydra Luxury Skincare formulations. Pure organic actives backed by clinical dermatology.</p>
      <p>Need support or skincare consultation? Contact us at concierge@hydraskincare.com | +91 (800) 493-7200</p>
      <p style="margin-top: 6px; font-size: 10px; color: #AAA;">This is a computer-generated official tax invoice and requires no physical signature.</p>
    </div>
  </div>

  ${isAutoPrint ? '<script>window.addEventListener("load", () => window.print());</script>' : ''}
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  } catch (error) {
    next(error);
  }
};

// ─── Admin: Assign AWB to an existing Shiprocket shipment ────────────────────
export const assignShiprocketAWB = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return next(new ApiError('Order not found', 404));
    if (order.status === 'cancelled' || order.status === 'delivered') {
      return next(new ApiError(`Cannot assign AWB to a ${order.status} order.`, 400));
    }
    if (!order.shiprocket?.shipmentId) {
      return next(new ApiError('No Shiprocket shipment found for this order. Create a shipment first.', 400));
    }

    const { awbCode, courierName } = await shiprocketService.assignAWB(order.shiprocket.shipmentId);

    order.shiprocket.awbCode = awbCode;
    order.shiprocket.courierName = courierName;
    order.shiprocket.trackingUrl = `https://shiprocket.co/tracking/${awbCode}`;
    order.trackingNumber = awbCode;
    pushHistory(order, order.status, `AWB assigned: ${awbCode} via ${courierName}`, 'admin');
    await order.save();

    res.status(200).json({
      success: true,
      message: `AWB ${awbCode} assigned successfully via ${courierName}`,
      data: { awbCode, courierName, trackingUrl: order.shiprocket.trackingUrl },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Admin: Schedule Courier Pickup ──────────────────────────────────────────
export const scheduleShiprocketPickup = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return next(new ApiError('Order not found', 404));
    if (order.status === 'cancelled' || order.status === 'delivered') {
      return next(new ApiError(`Cannot schedule pickup for a ${order.status} order.`, 400));
    }
    if (!order.shiprocket?.shipmentId) {
      return next(new ApiError('No Shiprocket shipment found. Create a shipment and assign AWB first.', 400));
    }

    const pickupResult = await shiprocketService.schedulePickup(order.shiprocket.shipmentId);
    if (pickupResult.status === 'failed') {
      return next(new ApiError(`Pickup scheduling failed: ${pickupResult.message}`, 400));
    }

    order.shiprocket.pickupScheduledDate = pickupResult.pickupScheduledDate;
    order.shiprocket.pickupTokenNumber = pickupResult.pickupTokenNumber;
    order.shiprocket.currentStatus = 'Pickup Scheduled';
    pushHistory(order, order.status, `Courier pickup scheduled. Token: ${pickupResult.pickupTokenNumber || 'N/A'}`, 'admin');
    await order.save();

    res.status(200).json({
      success: true,
      message: 'Courier pickup scheduled successfully!',
      data: {
        pickupScheduledDate: pickupResult.pickupScheduledDate,
        pickupTokenNumber: pickupResult.pickupTokenNumber,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Shiprocket Webhook Handler ───────────────────────────────────────────────
/**
 * POST /api/orders/webhook/shiprocket
 * Configure in Shiprocket Dashboard → Settings → API → Webhooks.
 * Courier states are applied forward-only (processing → shipped → delivered).
 * RTO / courier cancellations are logged for admin review, never auto-applied.
 */
export const shiprocketWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const webhookSecret = env.SHIPROCKET_WEBHOOK_SECRET;
    if (webhookSecret) {
      const receivedSecret = req.headers['x-api-key'] as string;
      if (!receivedSecret || receivedSecret !== webhookSecret) {
        res.status(401).json({ error: 'Unauthorized webhook request' });
        return;
      }
    }

    const { awb, current_status, shipment_status, etd, location } = req.body || {};

    if (!awb) {
      res.status(200).json({ success: true, message: 'Webhook received successfully' });
      return;
    }

    const courierStatus: string = current_status || shipment_status || '';
    const order = await Order.findOne({ $or: [{ trackingNumber: awb }, { 'shiprocket.awbCode': awb }] });
    if (!order) {
      console.warn(`[Shiprocket Webhook] No order found for AWB: ${awb}`);
      res.sendStatus(200);
      return;
    }

    if (order.shiprocket) {
      order.shiprocket.currentStatus = courierStatus || order.shiprocket.currentStatus;
      if (etd) order.shiprocket.etd = etd;
      if (!order.shiprocket.activities) order.shiprocket.activities = [];
      order.shiprocket.activities.push({
        date: new Date().toISOString(),
        status: courierStatus,
        activity: courierStatus,
        location: location || order.shippingAddress?.city || '',
      });
    }

    const advanced = applyCourierStatus(order, courierStatus, 'Courier update');
    if (!advanced && /rto|cancel|lost|undelivered/i.test(courierStatus)) {
      pushHistory(order, order.status, `Courier reported: ${courierStatus}. Our team is reviewing this shipment.`, 'system');
    }

    await order.save();
    res.sendStatus(200);
  } catch (error) {
    console.error('[Shiprocket Webhook] Error:', error);
    res.sendStatus(200);
  }
};
