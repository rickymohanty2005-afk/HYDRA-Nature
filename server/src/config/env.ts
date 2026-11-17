import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  PORT: process.env.PORT || '5000',
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hydra_skincare',
  JWT_SECRET: process.env.JWT_SECRET || 'hydra_super_secret_jwt_key_skincare_luxury_2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@hydra.com',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'Admin@Hydra2026',
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || 'rzp_test_hydra_demo_key',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || 'hydra_razorpay_secret_sample',
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || 'hydra-demo',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '123456789012345',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || 'sample_cloudinary_secret_key',
  SHIPROCKET_EMAIL: process.env.SHIPROCKET_EMAIL || '',
  SHIPROCKET_PASSWORD: process.env.SHIPROCKET_PASSWORD || '',
  SHIPROCKET_BASE_URL: process.env.SHIPROCKET_BASE_URL || 'https://apiv2.shiprocket.in/v1/external',
  SHIPROCKET_WEBHOOK_SECRET: process.env.SHIPROCKET_WEBHOOK_SECRET || '',
  /** Optional — enables POST /api/orders/webhook/razorpay (payment.captured / order.paid / payment.failed) */
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || '',
  /** How long an unpaid online order keeps its stock reserved before auto-cancellation */
  PAYMENT_WINDOW_MINUTES: Math.max(5, parseInt(process.env.PAYMENT_WINDOW_MINUTES || '1440', 10) || 1440),
};
