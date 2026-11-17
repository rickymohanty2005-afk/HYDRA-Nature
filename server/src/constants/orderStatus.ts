/**
 * Order lifecycle — single source of truth (server side)
 *
 *   placed → confirmed → processing → shipped → delivered
 *        ↘            ↘             ↘
 *                     cancelled  (allowed only BEFORE "shipped")
 *
 * Mirrors `client/src/constants/orderStatus.ts`. Keep both in sync.
 */

export const STATUS_PIPELINE = ['placed', 'confirmed', 'processing', 'shipped', 'delivered'] as const;

export const ORDER_STATUSES = [...STATUS_PIPELINE, 'cancelled'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** Customer & admin may cancel only while the parcel has not left the warehouse. */
export const CANCELLABLE_STATUSES: readonly OrderStatus[] = ['placed', 'confirmed', 'processing'];

/** Terminal states — no further transitions are permitted. */
export const TERMINAL_STATUSES: readonly OrderStatus[] = ['delivered', 'cancelled'];

export const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const ACTORS = ['customer', 'admin', 'system'] as const;
export type Actor = (typeof ACTORS)[number];

/** Default human readable timeline message for every status. */
export const STATUS_MESSAGES: Record<OrderStatus, string> = {
  placed: 'Order placed successfully.',
  confirmed: 'Order confirmed and accepted for fulfilment.',
  processing: 'Order is being quality-checked and packed at our warehouse.',
  shipped: 'Order handed over to courier partner and is on its way.',
  delivered: 'Order delivered to the customer.',
  cancelled: 'Order cancelled.',
};

/**
 * Legacy (8-step "Flipkart" pipeline + Title-case) → new 5-step lifecycle.
 * Used for migrating historic documents and for defensive normalisation.
 */
const LEGACY_STATUS_MAP: Record<string, OrderStatus> = {
  ORDER_PLACED: 'placed',
  PENDING: 'placed',
  ORDER_CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPROCKET_CREATED: 'processing',
  PICKUP_SCHEDULED: 'processing',
  PICKED_UP: 'shipped',
  IN_TRANSIT: 'shipped',
  OUT_FOR_DELIVERY: 'shipped',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
};

export const LEGACY_STATUS_VALUES = Object.keys(LEGACY_STATUS_MAP);

export const normalizeOrderStatus = (status?: string | null): OrderStatus => {
  if (!status) return 'placed';
  const lower = status.toLowerCase() as OrderStatus;
  if ((ORDER_STATUSES as readonly string[]).includes(lower)) return lower;
  return LEGACY_STATUS_MAP[status.toUpperCase()] || 'placed';
};

export const normalizePaymentStatus = (status?: string | null): PaymentStatus => {
  if (!status) return 'pending';
  const lower = status.toLowerCase();
  if (lower === 'completed' || lower === 'captured' || lower === 'success') return 'paid';
  if ((PAYMENT_STATUSES as readonly string[]).includes(lower)) return lower as PaymentStatus;
  return 'pending';
};

export const getPipelineIndex = (status: OrderStatus): number =>
  (STATUS_PIPELINE as readonly string[]).indexOf(status);

/** The only status an order may advance to next (strict, one step at a time). */
export const getNextStatus = (status: OrderStatus): OrderStatus | null => {
  const idx = getPipelineIndex(status);
  if (idx === -1 || idx >= STATUS_PIPELINE.length - 1) return null;
  return STATUS_PIPELINE[idx + 1];
};

export const isCancellable = (status: OrderStatus): boolean => CANCELLABLE_STATUSES.includes(status);

/**
 * Courier (Shiprocket) status text → our lifecycle.
 * Granular courier states (picked up / in transit / out for delivery) all
 * collapse into "shipped"; the raw text is preserved in `shiprocket.currentStatus`.
 */
export const mapCourierStatus = (courierStatus?: string | null): OrderStatus | null => {
  if (!courierStatus) return null;
  const s = courierStatus.toLowerCase();
  if (s.includes('rto') || s.includes('cancel') || s.includes('lost') || s.includes('destroyed')) return null; // handled manually
  if (s.includes('delivered') && !s.includes('undelivered')) return 'delivered';
  if (
    s.includes('picked') ||
    s.includes('transit') ||
    s.includes('out for delivery') ||
    s.includes('shipped') ||
    s.includes('reached') ||
    s.includes('dispatched')
  ) {
    return 'shipped';
  }
  if (s.includes('pickup') || s.includes('manifest') || s.includes('created') || s.includes('awb')) {
    return 'processing';
  }
  return null;
};
