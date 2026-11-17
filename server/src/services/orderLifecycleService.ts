import crypto from 'crypto';
import { Order, IOrder, IOrderItem } from '../models/Order';
import { Product } from '../models/Product';
import { Coupon } from '../models/Coupon';
import { razorpayInstance } from '../config/razorpay';
import { env } from '../config/env';
import { ApiError } from '../utils/apiError';
import { shiprocketService } from './shiprocketService';
import {
  Actor,
  OrderStatus,
  STATUS_MESSAGES,
  getPipelineIndex,
  isCancellable,
  mapCourierStatus,
  normalizeOrderStatus,
} from '../constants/orderStatus';

const isProduction = env.NODE_ENV === 'production';

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const pushHistory = (
  order: IOrder,
  status: string,
  message: string,
  actor: Actor = 'system'
): void => {
  order.trackingHistory.push({ status, message, actor, timestamp: new Date() });
};

export const generateOrderNumber = (): string => {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `HYD-${Date.now().toString().slice(-6)}${randomSuffix}`;
};

export const getPaymentDeadline = (from = new Date()): Date =>
  new Date(from.getTime() + env.PAYMENT_WINDOW_MINUTES * 60 * 1000);

/** Mock gateway orders exist only for local development / sandbox without keys. */
export const isMockGatewayOrder = (razorpayOrderId?: string): boolean =>
  !!razorpayOrderId && razorpayOrderId.startsWith('order_test_');

export const isMockGatewayAllowed = (): boolean => !isProduction;

// ─── Pricing & Stock ──────────────────────────────────────────────────────────

interface CartLine {
  productId: string;
  quantity: number;
  size?: string;
  image?: string;
}

export interface PricedOrder {
  orderItems: IOrderItem[];
  subtotal: number;
  discount: number;
  shippingFee: number;
  tax: number;
  total: number;
  couponId?: string;
  couponCode?: string;
}

/** Server-authoritative pricing — client prices are never trusted. */
export const priceCart = async (items: CartLine[], couponCode?: string): Promise<PricedOrder> => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError('Cart is empty. Cannot initiate checkout.', 400);
  }

  let subtotal = 0;
  const orderItems: IOrderItem[] = [];

  for (const item of items) {
    const quantity = Math.floor(Number(item.quantity));
    if (!item.productId || !Number.isFinite(quantity) || quantity < 1) {
      throw new ApiError('Invalid cart line item.', 400);
    }
    const product = await Product.findById(item.productId);
    if (!product || product.isActive === false) {
      throw new ApiError(`Product is no longer available (${item.productId}).`, 404);
    }
    if (product.stock < quantity) {
      throw new ApiError(`Insufficient stock for ${product.name}. Available: ${product.stock}`, 400);
    }
    subtotal += product.price * quantity;
    orderItems.push({
      productId: product._id as any,
      name: product.name,
      price: product.price,
      quantity,
      image: product.images?.[0] || item.image || '',
      size: item.size || product.size,
    });
  }

  let discount = 0;
  let couponId: string | undefined;
  let appliedCode: string | undefined;
  if (couponCode) {
    const coupon = await Coupon.findOne({
      code: String(couponCode).toUpperCase(),
      isActive: true,
      expiresAt: { $gt: new Date() },
    });
    if (coupon && subtotal >= coupon.minOrderValue && (!coupon.maxUses || coupon.usageCount < coupon.maxUses)) {
      if (coupon.discountType === 'percentage') {
        discount = (subtotal * coupon.discountValue) / 100;
        if (coupon.maxDiscount && discount > coupon.maxDiscount) discount = coupon.maxDiscount;
      } else {
        discount = coupon.discountValue;
      }
      discount = Math.round(discount * 100) / 100;
      couponId = String(coupon._id);
      appliedCode = coupon.code;
    }
  }

  // Free express shipping on all orders & GST inclusive
  const shippingFee = 0;
  const tax = 0;
  const total = Math.max(0, Math.round((subtotal - discount) * 100) / 100);

  return { orderItems, subtotal, discount, shippingFee, tax, total, couponId, couponCode: appliedCode };
};

/**
 * Atomically reserves stock for every line. If any line fails, all previously
 * reserved lines are rolled back — no overselling under concurrent checkouts.
 */
export const reserveStock = async (items: IOrderItem[]): Promise<void> => {
  const reserved: IOrderItem[] = [];
  for (const item of items) {
    const updated = await Product.findOneAndUpdate(
      { _id: item.productId, stock: { $gte: item.quantity } },
      { $inc: { stock: -item.quantity } },
      { new: true }
    );
    if (!updated) {
      await Promise.all(
        reserved.map((r) => Product.updateOne({ _id: r.productId }, { $inc: { stock: r.quantity } }))
      );
      throw new ApiError(`${item.name} just went out of stock. Please update your cart.`, 409);
    }
    reserved.push(item);
  }
};

export const releaseStock = async (items: IOrderItem[]): Promise<void> => {
  await Promise.all(
    items.map((it) => Product.updateOne({ _id: it.productId }, { $inc: { stock: it.quantity } }))
  );
};

export const consumeCoupon = async (couponId?: string): Promise<void> => {
  if (couponId) await Coupon.updateOne({ _id: couponId }, { $inc: { usageCount: 1 } });
};

// ─── Razorpay ─────────────────────────────────────────────────────────────────

export const createGatewayOrder = async (
  amount: number,
  receipt: string,
  notes: Record<string, string>
): Promise<{ id: string; amount: number; currency: string; isMock?: boolean }> => {
  const amountInPaise = Math.round(amount * 100);
  try {
    const rzpOrder: any = await razorpayInstance.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: receipt.slice(0, 40),
      notes,
    });
    return { id: rzpOrder.id, amount: rzpOrder.amount, currency: rzpOrder.currency };
  } catch (err) {
    if (!isMockGatewayAllowed()) {
      console.error('[Razorpay] order creation failed:', err);
      throw new ApiError('Payment gateway is temporarily unavailable. Please try again shortly.', 502);
    }
    // Development sandbox (demo keys) — simulated gateway order
    return { id: `order_test_${Date.now()}`, amount: amountInPaise, currency: 'INR', isMock: true };
  }
};

export const verifyGatewaySignature = (
  razorpayOrderId: string,
  razorpayPaymentId: string,
  signature: string
): boolean => {
  if (!razorpayOrderId || !razorpayPaymentId || !signature) return false;

  if (isMockGatewayOrder(razorpayOrderId)) {
    return isMockGatewayAllowed() && signature === 'mock_verified_signature';
  }

  const expected = crypto
    .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

const fetchPaymentMethod = async (paymentId?: string): Promise<string | undefined> => {
  if (!paymentId || paymentId.startsWith('pay_test_')) return undefined;
  try {
    const payment: any = await razorpayInstance.payments.fetch(paymentId);
    return payment?.method;
  } catch {
    return undefined;
  }
};

/**
 * Idempotently marks an order as paid and advances it from "placed" → "confirmed".
 */
export const markOrderPaid = async (
  order: IOrder,
  details: { paymentId: string; signature?: string; method?: string; source: string }
): Promise<IOrder> => {
  if (order.paymentStatus === 'paid') return order;

  const method = details.method || (await fetchPaymentMethod(details.paymentId)) || 'upi';

  order.paymentStatus = 'paid';
  order.paymentDetails = {
    ...(order.paymentDetails as any),
    razorpayPaymentId: details.paymentId,
    razorpaySignature: details.signature || order.paymentDetails?.razorpaySignature,
    method,
    paidAt: new Date(),
    failureReason: undefined,
  };
  order.paymentExpiresAt = undefined;

  pushHistory(order, 'payment', `Payment of ₹${order.total.toLocaleString('en-IN')} received via ${method.toUpperCase()} (${details.source}).`, 'system');

  if (order.status === 'placed') {
    order.status = 'confirmed';
    pushHistory(order, 'confirmed', 'Payment verified — order confirmed automatically.', 'system');
  }

  // Edge case: payment arrived after the order was auto-cancelled → refund it.
  if (order.status === 'cancelled') {
    pushHistory(order, 'payment', 'Payment received for a cancelled order — initiating automatic refund.', 'system');
    await initiateRefund(order);
  }

  await order.save();
  return order;
};

/**
 * Asks Razorpay whether a captured/authorized payment already exists for the
 * order's gateway order. Protects customers from double-charging when the
 * browser lost connectivity after paying but before our verify call.
 */
export const reconcileGatewayPayment = async (order: IOrder): Promise<boolean> => {
  if (order.paymentMethod === 'cod' || order.paymentStatus === 'paid') return order.paymentStatus === 'paid';

  const gatewayIds = Array.from(
    new Set([order.paymentDetails?.razorpayOrderId, ...(order.paymentDetails?.gatewayOrderHistory || [])])
  ).filter((id): id is string => !!id && !isMockGatewayOrder(id));

  for (const rzpOrderId of gatewayIds) {
    try {
      const res: any = await razorpayInstance.orders.fetchPayments(rzpOrderId);
      const items: any[] = res?.items || [];
      const success = items.find((p) => p.status === 'captured' || p.status === 'authorized');
      if (success) {
        await markOrderPaid(order, { paymentId: success.id, method: success.method, source: 'gateway reconciliation' });
        return true;
      }
    } catch (err) {
      console.warn(`[Razorpay] reconcile failed for ${order.orderNumber}:`, (err as any)?.message || err);
    }
  }
  return false;
};

// ─── Refunds ──────────────────────────────────────────────────────────────────

export const initiateRefund = async (order: IOrder): Promise<void> => {
  const paymentId = order.paymentDetails?.razorpayPaymentId;
  if (order.paymentMethod === 'cod' || !paymentId) return;
  if (order.refund?.status === 'processed' || order.refund?.status === 'pending') return;

  const amount = order.total;
  order.refund = { amount, status: 'pending', initiatedAt: new Date() };

  // Simulated payments (dev sandbox) are refunded instantly
  if (paymentId.startsWith('pay_test_') || isMockGatewayOrder(order.paymentDetails?.razorpayOrderId)) {
    order.refund = { ...order.refund, refundId: `rfnd_test_${Date.now()}`, status: 'processed', processedAt: new Date() };
    order.paymentStatus = 'refunded';
    pushHistory(order, 'refund', `Refund of ₹${amount.toLocaleString('en-IN')} processed to original payment method.`, 'system');
    return;
  }

  try {
    const refund: any = await razorpayInstance.payments.refund(paymentId, {
      amount: Math.round(amount * 100),
      notes: { orderNumber: order.orderNumber, reason: order.cancellation?.reason || 'Order cancelled' },
    } as any);
    order.refund = {
      ...order.refund,
      refundId: refund?.id,
      status: refund?.status === 'processed' ? 'processed' : 'pending',
      processedAt: refund?.status === 'processed' ? new Date() : undefined,
    };
    order.paymentStatus = 'refunded';
    pushHistory(
      order,
      'refund',
      `Refund of ₹${amount.toLocaleString('en-IN')} initiated (Ref: ${refund?.id}). It will reflect in 5–7 business days.`,
      'system'
    );
  } catch (err: any) {
    order.refund = { ...order.refund, status: 'failed', failureReason: err?.error?.description || err?.message || 'Refund failed' };
    pushHistory(order, 'refund', 'Automatic refund could not be initiated — our team will process it manually.', 'system');
    console.error(`[Razorpay] refund failed for ${order.orderNumber}:`, err);
  }
};

// ─── Cancellation ─────────────────────────────────────────────────────────────

export const cancelOrder = async (
  order: IOrder,
  opts: { reason: string; note?: string; actor: Actor }
): Promise<IOrder> => {
  const status = normalizeOrderStatus(order.status);

  if (status === 'cancelled') throw new ApiError('This order is already cancelled.', 400);
  if (!isCancellable(status)) {
    throw new ApiError(
      status === 'delivered'
        ? 'Delivered orders cannot be cancelled. Please raise a return request instead.'
        : 'This order has already been shipped and can no longer be cancelled.',
      400
    );
  }

  order.status = 'cancelled';
  order.cancellation = {
    reason: opts.reason,
    note: opts.note,
    cancelledBy: opts.actor,
    cancelledAt: new Date(),
  };
  order.paymentExpiresAt = undefined;

  const by = opts.actor === 'customer' ? 'by customer' : opts.actor === 'admin' ? 'by Hydra support' : 'automatically';
  pushHistory(order, 'cancelled', `Order cancelled ${by}. Reason: ${opts.reason}`, opts.actor);

  // Restock (idempotent)
  if (!order.stockRestored) {
    await releaseStock(order.items);
    order.stockRestored = true;
  }

  // Release coupon usage (idempotent)
  if (order.couponCode && !order.couponReleased) {
    await Coupon.updateOne({ code: order.couponCode.toUpperCase(), usageCount: { $gt: 0 } }, { $inc: { usageCount: -1 } });
    order.couponReleased = true;
  }

  // Void courier manifest if one was generated
  if (order.shiprocket?.shiprocketOrderId) {
    const voided = await shiprocketService.cancelOrder(order.shiprocket.shiprocketOrderId);
    if (voided) {
      order.shiprocket.currentStatus = 'CANCELLED';
      pushHistory(order, 'cancelled', 'Courier shipment voided.', 'system');
    }
  }

  // Refund prepaid orders
  if (order.paymentStatus === 'paid') {
    await initiateRefund(order);
  }

  await order.save();
  return order;
};

// ─── Courier status sync ──────────────────────────────────────────────────────

/**
 * Forward-only application of a courier status (webhook or live tracking).
 * Never confirms an order and never moves backwards.
 */
export const applyCourierStatus = (order: IOrder, courierStatus: string, source: string): boolean => {
  const current = normalizeOrderStatus(order.status);
  if (current === 'cancelled' || current === 'delivered') return false;

  const mapped = mapCourierStatus(courierStatus);
  if (!mapped) return false;
  if (getPipelineIndex(current) < getPipelineIndex('processing')) return false; // must be at least processing

  if (getPipelineIndex(mapped) <= getPipelineIndex(current)) return false;

  order.status = mapped as OrderStatus;
  pushHistory(order, mapped, `${STATUS_MESSAGES[mapped]} (${source}: ${courierStatus})`, 'system');

  return true;
};

// ─── Expiry of unpaid online orders ──────────────────────────────────────────

/**
 * Cancels (and restocks) online orders that were never paid within the payment
 * window. Always reconciles with the gateway first so a paid order is never lost.
 */
export const expireStalePendingPayments = async (filter: Record<string, any> = {}): Promise<number> => {
  const stale = await Order.find({
    ...filter,
    paymentMethod: { $ne: 'cod' },
    paymentStatus: { $in: ['pending', 'failed'] },
    status: 'placed',
    paymentExpiresAt: { $lte: new Date() },
  }).limit(100);

  let expired = 0;
  for (const order of stale) {
    try {
      const paid = await reconcileGatewayPayment(order);
      if (paid) continue;
      await cancelOrder(order, {
        reason: 'Payment not completed within the allowed time window',
        actor: 'system',
      });
      expired += 1;
    } catch (err) {
      console.warn(`[Orders] expiry skipped for ${order.orderNumber}:`, (err as any)?.message || err);
    }
  }
  return expired;
};

/** One-time migration of historic statuses into the 5-step lifecycle. */
export const migrateLegacyOrderStatuses = async (): Promise<void> => {
  const legacyMap: Record<string, OrderStatus> = {
    ORDER_PLACED: 'placed',
    Pending: 'placed',
    ORDER_CONFIRMED: 'confirmed',
    Processing: 'processing',
    SHIPROCKET_CREATED: 'processing',
    PICKUP_SCHEDULED: 'processing',
    PICKED_UP: 'shipped',
    IN_TRANSIT: 'shipped',
    OUT_FOR_DELIVERY: 'shipped',
    Shipped: 'shipped',
    DELIVERED: 'delivered',
    Delivered: 'delivered',
    Cancelled: 'cancelled',
  };

  try {
    let migrated = 0;
    for (const [legacy, next] of Object.entries(legacyMap)) {
      const res = await Order.collection.updateMany({ status: legacy }, { $set: { status: next } });
      migrated += res.modifiedCount;
    }
    const pay = await Order.collection.updateMany({ paymentStatus: 'completed' }, { $set: { paymentStatus: 'paid' } });
    migrated += pay.modifiedCount;
    if (migrated > 0) console.info(`[Orders] Migrated ${migrated} legacy order field(s) to the 5-step lifecycle.`);
  } catch (err) {
    console.error('[Orders] Legacy status migration failed:', err);
  }
};

let expiryTimer: NodeJS.Timeout | null = null;
export const startPaymentExpiryJob = (): void => {
  if (expiryTimer) return;
  const run = () =>
    expireStalePendingPayments()
      .then((n) => n > 0 && console.info(`[Orders] Auto-cancelled ${n} unpaid order(s).`))
      .catch((err) => console.error('[Orders] expiry job error:', err));
  expiryTimer = setInterval(run, 5 * 60 * 1000);
  expiryTimer.unref?.();
  run();
};
