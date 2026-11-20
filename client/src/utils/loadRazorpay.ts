declare global {
  interface Window {
    Razorpay: any;
  }
}

const RAZORPAY_SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

let scriptPromise: Promise<boolean> | null = null;

/**
 * Ensures the official Razorpay Checkout script is loaded before opening the modal.
 * Handles cases where the deferred script tag hasn't finished loading yet or was removed.
 */
export const loadRazorpayScript = (): Promise<boolean> => {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);

  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<boolean>((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${RAZORPAY_SCRIPT_SRC}"]`
    );

    const finish = (ok: boolean) => {
      if (!ok) scriptPromise = null;
      resolve(ok);
    };

    const timeout = window.setTimeout(() => {
      finish(Boolean(window.Razorpay));
    }, 10000);

    const onLoad = () => {
      window.clearTimeout(timeout);
      finish(Boolean(window.Razorpay));
    };

    const onError = () => {
      window.clearTimeout(timeout);
      finish(false);
    };

    if (existing) {
      if (window.Razorpay) {
        window.clearTimeout(timeout);
        finish(true);
        return;
      }
      existing.addEventListener('load', onLoad, { once: true });
      existing.addEventListener('error', onError, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = RAZORPAY_SCRIPT_SRC;
    script.async = true;
    script.onload = onLoad;
    script.onerror = onError;
    document.body.appendChild(script);
  });

  return scriptPromise;
};

export const getRazorpayBrandLogo = (): string => {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}/images/home/Logo.png`;
};

export const formatRazorpayContact = (phone?: string): string => {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 10) return digits.slice(-10);
  return digits;
};
