export const STATUS_PIPELINE = ['placed', 'confirmed', 'processing', 'shipped', 'delivered'] as const;

export type OrderStatus = (typeof STATUS_PIPELINE)[number] | 'cancelled';

export interface StatusMetaItem {
  label: string;
  icon: string;
  color: string;
  dot: string;
  border: string;
}

export const STATUS_META: Record<string, StatusMetaItem> = {
  placed:     { label: 'Order Placed',    icon: '📦', color: 'bg-[#F3E4C8] text-[#B8860B]',     dot: 'bg-[#B8860B]',   border: 'border-[#B8860B]'   },
  confirmed:  { label: 'Confirmed',       icon: '✅', color: 'bg-blue-50 text-blue-600',         dot: 'bg-blue-500',    border: 'border-blue-400'    },
  processing: { label: 'Processing',      icon: '⚙️', color: 'bg-yellow-50 text-yellow-700',     dot: 'bg-yellow-500',  border: 'border-yellow-400'  },
  shipped:    { label: 'Shipped',         icon: '🚚', color: 'bg-purple-50 text-purple-600',     dot: 'bg-purple-500',  border: 'border-purple-400'  },
  delivered:  { label: 'Delivered',       icon: '🎉', color: 'bg-green-50 text-green-700',       dot: 'bg-green-500',   border: 'border-green-400'   },
  cancelled:  { label: 'Cancelled',       icon: '❌', color: 'bg-red-50 text-red-600',           dot: 'bg-red-500',     border: 'border-red-400'     },
};

export const paymentBadge: Record<string, string> = {
  pending:  'bg-yellow-50 text-yellow-700',
  paid:     'bg-green-50 text-green-700',
  failed:   'bg-red-50 text-red-600',
  refunded: 'bg-blue-50 text-blue-600',
};

export const paymentMethodInfo: Record<string, { icon: string; label: string; color: string }> = {
  upi:        { icon: '📲', label: 'UPI',      color: 'bg-indigo-50 text-indigo-700' },
  card:       { icon: '💳', label: 'Card',     color: 'bg-blue-50 text-blue-700'    },
  netbanking: { icon: '🏦', label: 'Net Bank', color: 'bg-cyan-50 text-cyan-700'    },
  cod:        { icon: '🏠', label: 'COD',      color: 'bg-amber-50 text-amber-700'  },
};

/**
 * Normalizes any legacy or case-variant status string into the canonical 5+1 statuses.
 */
export const normalizeOrderStatus = (status?: string | null): OrderStatus => {
  if (!status) return 'placed';
  const s = status.toLowerCase();
  if (s === 'placed' || s === 'order_placed' || s === 'pending') return 'placed';
  if (s === 'confirmed' || s === 'order_confirmed') return 'confirmed';
  if (s === 'processing' || s === 'shiprocket_created' || s === 'pickup_scheduled') return 'processing';
  if (s === 'shipped' || s === 'picked_up' || s === 'in_transit' || s === 'out_for_delivery') return 'shipped';
  if (s === 'delivered') return 'delivered';
  if (s === 'cancelled' || s === 'canceled') return 'cancelled';
  return (STATUS_PIPELINE as readonly string[]).includes(s) ? (s as OrderStatus) : 'placed';
};

/**
 * Normalizes payment status strings (e.g. 'completed' -> 'paid').
 */
export const normalizePaymentStatus = (status?: string | null): 'pending' | 'paid' | 'failed' | 'refunded' => {
  if (!status) return 'pending';
  const s = status.toLowerCase();
  if (s === 'paid' || s === 'completed' || s === 'captured' || s === 'success') return 'paid';
  if (s === 'failed') return 'failed';
  if (s === 'refunded') return 'refunded';
  return 'pending';
};

/**
 * Identifies payment method type (upi, card, netbanking, cod) for styling.
 */
export const getPaymentMethodKey = (method?: string, detailsMethod?: string): 'upi' | 'card' | 'netbanking' | 'cod' => {
  const m = (detailsMethod || method || '').toLowerCase();
  if (m === 'cod') return 'cod';
  if (m.includes('upi') || m.includes('gpay') || m.includes('phonepe') || m.includes('paytm')) return 'upi';
  if (m.includes('netbanking') || m.includes('bank') || m.includes('nb')) return 'netbanking';
  if (m.includes('card') || m.includes('visa') || m.includes('mastercard') || m.includes('debit') || m.includes('credit')) return 'card';
  return method === 'cod' ? 'cod' : 'upi';
};

/**
 * Order can be cancelled ONLY BEFORE it is confirmed/shipped:
 * Allowed when: 'placed', 'confirmed', 'processing'
 * Forbidden when: 'shipped', 'delivered', 'cancelled'
 */
export const canCancelOrder = (status?: string | null): boolean => {
  const norm = normalizeOrderStatus(status);
  return norm === 'placed' || norm === 'confirmed' || norm === 'processing';
};

/**
 * Returns pipeline step index (0 = placed, 1 = confirmed, 2 = processing, 3 = shipped, 4 = delivered)
 */
export const getPipelineStepIndex = (status?: string | null): number => {
  const norm = normalizeOrderStatus(status);
  const idx = STATUS_PIPELINE.indexOf(norm as any);
  return idx !== -1 ? idx : 0;
};
