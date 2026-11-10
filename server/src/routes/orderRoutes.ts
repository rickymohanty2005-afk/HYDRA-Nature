import { Router } from 'express';
import {
  createRazorpayOrder,
  verifyPaymentAndCreateOrder,
  createCODOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  createShiprocketShipment,
  assignShiprocketAWB,
  scheduleShiprocketPickup,
  getShiprocketTracking,
  getOrderInvoice,
  shiprocketWebhook,
} from '../controllers/orderController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

// ─── Shiprocket Webhook (no auth — public endpoint for Shiprocket push) ──────
// Configure this URL in Shiprocket Dashboard → Settings → API → Webhooks
// URL: https://yourwebsite.com/api/orders/webhook/tracking-update
router.post('/webhook/tracking-update', shiprocketWebhook);
router.post('/webhook/shiprocket', shiprocketWebhook);

// ─── Customer Authenticated Routes ───────────────────────────────────────────
router.post('/razorpay', protect, createRazorpayOrder);
router.post('/verify-payment', protect, verifyPaymentAndCreateOrder);
router.post('/cod', protect, createCODOrder);
router.get('/my-orders', protect, getMyOrders);
router.get('/:id', protect, getOrderById);
router.get('/:id/shiprocket/track', protect, getShiprocketTracking);
router.get('/:id/invoice', protect, getOrderInvoice);

// ─── Admin Routes ─────────────────────────────────────────────────────────────
router.get('/', protect, authorize('admin'), getAllOrders);
router.put('/:id/status', protect, authorize('admin'), updateOrderStatus);

// Shiprocket order management (admin)
// Step 1: Create full shipment (order + AWB + pickup in one call)
router.post('/:id/shiprocket/create', protect, authorize('admin'), createShiprocketShipment);
// Step 2 (manual): Assign AWB separately if needed
router.post('/:id/shiprocket/assign-awb', protect, authorize('admin'), assignShiprocketAWB);
// Step 3 (manual): Schedule pickup separately if needed
router.post('/:id/shiprocket/schedule-pickup', protect, authorize('admin'), scheduleShiprocketPickup);

export default router;
