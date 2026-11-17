import { Router } from 'express';
import {
  createRazorpayOrder,
  verifyOrderPayment,
  recordPaymentFailure,
  retryOrderPayment,
  createCODOrder,
  getMyOrders,
  getOrderById,
  cancelOrderRequest,
  getAllOrders,
  updateOrderStatus,
  syncOrderPayment,
  collectCodPayment,
  createShiprocketShipment,
  assignShiprocketAWB,
  scheduleShiprocketPickup,
  getShiprocketTracking,
  getOrderInvoice,
  shiprocketWebhook,
  razorpayWebhook,
} from '../controllers/orderController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

// ─── Webhooks (no auth — verified by signature / shared secret) ──────────────
// Shiprocket: Dashboard → Settings → API → Webhooks
router.post('/webhook/tracking-update', shiprocketWebhook);
router.post('/webhook/shiprocket', shiprocketWebhook);
// Razorpay: Dashboard → Settings → Webhooks (payment.captured, payment.failed, order.paid, refund.processed)
router.post('/webhook/razorpay', razorpayWebhook);

// ─── Customer: Checkout ──────────────────────────────────────────────────────
router.post('/razorpay', protect, createRazorpayOrder); // creates pending order + gateway order
router.post('/cod', protect, createCODOrder);

// ─── Customer: Orders ────────────────────────────────────────────────────────
router.get('/my-orders', protect, getMyOrders);
router.get('/:id', protect, getOrderById);
router.post('/:id/verify-payment', protect, verifyOrderPayment);
router.post('/:id/payment-failed', protect, recordPaymentFailure);
router.post('/:id/pay', protect, retryOrderPayment); // "Complete payment" for pending online orders
router.put('/:id/cancel', protect, cancelOrderRequest); // allowed before shipping only
router.get('/:id/shiprocket/track', protect, getShiprocketTracking);
router.get('/:id/invoice', protect, getOrderInvoice);

// ─── Admin ───────────────────────────────────────────────────────────────────
router.get('/', protect, authorize('admin'), getAllOrders);
router.put('/:id/status', protect, authorize('admin'), updateOrderStatus);
router.post('/:id/sync-payment', protect, authorize('admin'), syncOrderPayment);
router.post('/:id/collect-cod', protect, authorize('admin'), collectCodPayment);

// Shiprocket order management (admin)
router.post('/:id/shiprocket/create', protect, authorize('admin'), createShiprocketShipment);
router.post('/:id/shiprocket/assign-awb', protect, authorize('admin'), assignShiprocketAWB);
router.post('/:id/shiprocket/schedule-pickup', protect, authorize('admin'), scheduleShiprocketPickup);

export default router;
