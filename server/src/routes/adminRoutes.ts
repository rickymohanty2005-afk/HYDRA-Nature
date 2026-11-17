import { Router } from 'express';
import {
  getDashboardAnalytics,
  getAllCustomers,
} from '../controllers/adminAnalyticsController';
import {
  createStoreVisitInvoice,
  getAllStoreVisitInvoices,
  getStoreVisitInvoiceById,
  deleteStoreVisitInvoice,
} from '../controllers/admininvoice';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.use(protect, authorize('admin'));

router.get('/analytics', getDashboardAnalytics);
router.get('/customers', getAllCustomers);

// Physical Store Visit Invoices (POS / Walk-in)
router.post('/store-invoices', createStoreVisitInvoice);
router.get('/store-invoices', getAllStoreVisitInvoices);
router.get('/store-invoices/:id', getStoreVisitInvoiceById);
router.delete('/store-invoices/:id', deleteStoreVisitInvoice);

export default router;
