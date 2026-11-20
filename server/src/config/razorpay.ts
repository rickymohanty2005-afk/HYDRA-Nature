import Razorpay from 'razorpay';
import { env } from './env';

const keyId = env.RAZORPAY_KEY_ID.trim();
const keySecret = env.RAZORPAY_KEY_SECRET.trim();

if (keyId && keySecret && keyId === keySecret) {
  console.error(
    '[Razorpay] MISCONFIGURATION: RAZORPAY_KEY_SECRET is identical to RAZORPAY_KEY_ID. ' +
      'Set RAZORPAY_KEY_SECRET to your actual Razorpay Key Secret from the Razorpay Dashboard.'
  );
} else if (env.NODE_ENV === 'production' && (!keyId.startsWith('rzp_live_') || keySecret === 'hydra_razorpay_secret_sample')) {
  console.warn(
    '[Razorpay] WARNING: Production is not configured with live Razorpay credentials (rzp_live_*).'
  );
}

export const razorpayInstance = new Razorpay({
  key_id: keyId,
  key_secret: keySecret,
});
