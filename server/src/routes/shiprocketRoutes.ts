import { Router } from 'express';
import { shiprocketWebhook } from '../controllers/orderController';

const router = Router();

router.post('/webhook', shiprocketWebhook);

export default router;
