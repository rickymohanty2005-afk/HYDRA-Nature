import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Package,
  CheckCircle2,
  Clock,
  Truck,
  MapPin,
  ArrowLeft,
  ShieldCheck,
  CreditCard,
  Download,
  ExternalLink,
  ShoppingBag,
  Navigation,
  Gift,
  XCircle,
  AlertCircle,
  RotateCcw,
  Sparkles,
  Lock,
  Phone,
  HelpCircle,
} from 'lucide-react';
import { orderService } from '../services/orderService';
import { downloadOrderInvoicePdf } from '../utils/invoiceGenerator';
import { Order } from '../types';

const STATUS_PIPELINE = ['placed', 'confirmed', 'processing', 'shipped', 'delivered'];

const STATUS_META: Record<
  string,
  { label: string; icon: string; color: string; dot: string; border: string }
> = {
  placed:     { label: 'Order Placed',    icon: '📦', color: 'bg-[#F3E4C8] text-[#B8860B]',     dot: 'bg-[#B8860B]',   border: 'border-[#B8860B]'   },
  confirmed:  { label: 'Confirmed',       icon: '✅', color: 'bg-blue-50 text-blue-600',         dot: 'bg-blue-500',    border: 'border-blue-400'    },
  processing: { label: 'Processing',      icon: '⚙️', color: 'bg-yellow-50 text-yellow-700',     dot: 'bg-yellow-500',  border: 'border-yellow-400'  },
  shipped:    { label: 'Shipped',         icon: '🚚', color: 'bg-purple-50 text-purple-600',     dot: 'bg-purple-500',  border: 'border-purple-400'  },
  delivered:  { label: 'Delivered',       icon: '🎉', color: 'bg-green-50 text-green-700',       dot: 'bg-green-500',   border: 'border-green-400'   },
  cancelled:  { label: 'Cancelled',       icon: '❌', color: 'bg-red-50 text-red-600',           dot: 'bg-red-500',     border: 'border-red-400'     },
};

const paymentBadge: Record<string, string> = {
  pending:  'bg-yellow-50 text-yellow-700',
  paid:     'bg-green-50 text-green-700',
  failed:   'bg-red-50 text-red-600',
  refunded: 'bg-blue-50 text-blue-600',
};

const paymentMethodInfo: Record<string, { icon: string; label: string; color: string }> = {
  upi:        { icon: '📲', label: 'UPI',      color: 'bg-indigo-50 text-indigo-700' },
  card:       { icon: '💳', label: 'Card',     color: 'bg-blue-50 text-blue-700'    },
  netbanking: { icon: '🏦', label: 'Net Bank', color: 'bg-cyan-50 text-cyan-700'    },
  cod:        { icon: '🏠', label: 'COD',      color: 'bg-amber-50 text-amber-700'  },
};

const PIPELINE_DESCRIPTIONS: Record<string, string> = {
  placed: 'Your order has been received into our system.',
  confirmed: 'Order verified and accepted by Hydra skincare lab.',
  processing: 'Formulations being freshly packaged and quality checked.',
  shipped: 'Handed over to priority air courier for transit.',
  delivered: 'Safely delivered to your doorstep. Enjoy your radiant skincare!',
};

const normalizeStatus = (status?: string | null): string => {
  if (!status) return 'placed';
  const s = status.toLowerCase();
  if (s === 'placed' || s === 'order_placed' || s === 'pending') return 'placed';
  if (s === 'confirmed' || s === 'order_confirmed') return 'confirmed';
  if (s === 'processing' || s === 'shiprocket_created' || s === 'pickup_scheduled') return 'processing';
  if (s === 'shipped' || s === 'picked_up' || s === 'in_transit' || s === 'out_for_delivery') return 'shipped';
  if (s === 'delivered') return 'delivered';
  if (s === 'cancelled' || s === 'canceled') return 'cancelled';
  return STATUS_META[s] ? s : 'placed';
};

const normalizePayment = (status?: string | null): 'pending' | 'paid' | 'failed' | 'refunded' => {
  if (!status) return 'pending';
  const s = status.toLowerCase();
  if (s === 'paid' || s === 'completed' || s === 'captured' || s === 'success') return 'paid';
  if (s === 'failed') return 'failed';
  if (s === 'refunded') return 'refunded';
  return 'pending';
};

const getPaymentKey = (method?: string, detailsMethod?: string): 'upi' | 'card' | 'netbanking' | 'cod' => {
  const m = (detailsMethod || method || '').toLowerCase();
  if (m === 'cod') return 'cod';
  if (m.includes('card') || m.includes('visa') || m.includes('mastercard') || m.includes('debit') || m.includes('credit')) return 'card';
  if (m.includes('netbanking') || m.includes('bank') || m.includes('nb')) return 'netbanking';
  return 'upi';
};

const canCancelOrder = (status?: string | null): boolean => {
  const norm = normalizeStatus(status);
  return norm === 'placed' || norm === 'confirmed' || norm === 'processing';
};

export const OrderTrackingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  // Client-side cancellation state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('Changed my mind');
  const [cancelNote, setCancelNote] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelMessage, setCancelMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Online Payment Retry State
  const [retryingPayment, setRetryingPayment] = useState(false);
  const [paymentNotice, setPaymentNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Invoice Download State
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);

  const handleDownloadInvoice = async (targetOrder?: Order | null) => {
    const o = targetOrder || order;
    if (!o) return;
    setDownloadingInvoice(true);
    try {
      await downloadOrderInvoicePdf(o);
    } finally {
      setDownloadingInvoice(false);
    }
  };

  const fetchOrder = useCallback(
    async (silent = false) => {
      if (!id) return;
      if (!silent) setLoading(true);
      try {
        const data = await orderService.getOrderById(id);
        setOrder(data);
      } catch (err) {
        console.error('Error fetching order:', err);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [id]
  );

  useEffect(() => {
    fetchOrder(false);

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'hydra_order_updated' && e.newValue) {
        try {
          const payload = JSON.parse(e.newValue);
          if (!payload.orderId || payload.orderId === id) {
            fetchOrder(true);
          }
        } catch {
          fetchOrder(true);
        }
      }
    };

    const handleFocus = () => fetchOrder(true);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchOrder(true);
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchOrder, id]);

  const handleCancel = async () => {
    if (!order) return;
    try {
      setCancelling(true);
      setCancelMessage(null);
      const res = await orderService.cancelOrder(order._id, cancelReason, cancelNote);
      setOrder(res.data);
      setShowCancelModal(false);
      setCancelMessage({
        type: 'success',
        text: res.message || 'Your order has been cancelled successfully and reserved items restored.',
      });
    } catch (err: any) {
      setCancelMessage({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Could not cancel order.',
      });
    } finally {
      setCancelling(false);
    }
  };

  const handleRetryPayment = async () => {
    if (!order) return;
    try {
      setRetryingPayment(true);
      setPaymentNotice(null);

      const res = await orderService.retryOrderPayment(order._id);
      const { alreadyPaid, order: updatedOrder, razorpayOrder, keyId } = res.data;

      if (alreadyPaid) {
        setOrder(updatedOrder);
        setPaymentNotice({
          type: 'success',
          text: 'Payment has been successfully verified! Your order is now confirmed.',
        });
        setRetryingPayment(false);
        return;
      }

      if (window.Razorpay && razorpayOrder && !razorpayOrder.isMock) {
        const options = {
          key: keyId,
          amount: razorpayOrder.amount,
          currency: 'INR',
          name: 'Hydra Skincare',
          description: `Order Payment #${order.orderNumber}`,
          image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=120&q=80',
          order_id: razorpayOrder.id,
          handler: async function (response: any) {
            try {
              const verifyRes = await orderService.verifyOrderPayment(order._id, {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });

              setOrder(verifyRes.data);
              setPaymentNotice({
                type: 'success',
                text: 'Payment received successfully! Your order is now confirmed and being processed.',
              });
            } catch (vErr: any) {
              setPaymentNotice({
                type: 'error',
                text: vErr.message || 'Payment verification failed. Please try again.',
              });
            } finally {
              setRetryingPayment(false);
            }
          },
          prefill: {
            name: order.shippingAddress.fullName,
            email: typeof order.user === 'object' ? order.user?.email : undefined,
            contact: order.shippingAddress.phone,
          },
          theme: {
            color: '#13382B',
          },
          modal: {
            ondismiss: function () {
              setRetryingPayment(false);
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', async function (failRes: any) {
          try {
            await orderService.recordPaymentFailure(order._id, failRes?.error?.description);
          } catch {}
          setPaymentNotice({
            type: 'error',
            text: failRes.error?.description || 'Payment was unsuccessful. Please check your bank or retry.',
          });
          setRetryingPayment(false);
        });
        rzp.open();
      } else {
        // Safe Development / Sandbox Simulation fallback
        const verifyRes = await orderService.verifyOrderPayment(order._id, {
          razorpay_order_id: razorpayOrder?.id || `order_test_${Date.now()}`,
          razorpay_payment_id: `pay_test_${Date.now()}`,
          razorpay_signature: 'mock_verified_signature',
        });

        setOrder(verifyRes.data);
        setPaymentNotice({
          type: 'success',
          text: 'Payment simulated and verified successfully! Order is confirmed.',
        });
        setRetryingPayment(false);
      }
    } catch (err: any) {
      setPaymentNotice({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Failed to initiate payment retry.',
      });
      setRetryingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="h-56 bg-gray-200 rounded-3xl" />
        <div className="h-64 bg-gray-200 rounded-3xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto text-center py-20 px-4">
        <h2 className="font-serif text-2xl font-bold text-[#13382B]">Order Not Found</h2>
        <p className="text-xs text-gray-500 mt-1">We couldn't locate the order details requested.</p>
        <Link
          to="/orders"
          className="mt-5 inline-block px-6 py-2.5 bg-[#13382B] text-white rounded-full text-xs font-semibold"
        >
          View Order History
        </Link>
      </div>
    );
  }

  const normStatus = normalizeStatus(order.status);
  const statusMeta = STATUS_META[normStatus] || STATUS_META.placed;
  const normPayment = normalizePayment(order.paymentStatus);
  const payBadgeStyle = paymentBadge[normPayment] || paymentBadge.pending;
  const payMethodKey = getPaymentKey(order.paymentMethod, order.paymentDetails?.method);
  const payMethodMeta = paymentMethodInfo[payMethodKey] || paymentMethodInfo.upi;

  const currentStepIdx = STATUS_PIPELINE.indexOf(normStatus);
  const isDelivered = normStatus === 'delivered';
  const isCancelled = normStatus === 'cancelled';
  const isCancellable = canCancelOrder(order.status);

  // Online payment pending check (network drop during checkout)
  const isOnlinePaymentPending = order.paymentMethod !== 'cod' && normPayment !== 'paid' && !isCancelled;

  return (
    <div className="w-full bg-[#FAF8F5] pb-24">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-[#EDE8E1] py-4">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link
            to="/orders"
            className="text-xs text-gray-500 hover:text-[#13382B] flex items-center gap-1 font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Orders</span>
          </Link>

          <div className="flex items-center gap-3">
            {/* Tax Invoice PDF Button - Only displayed when Fulfillment Milestone is Delivered */}
            {normStatus === 'delivered' && (
              <button
                type="button"
                onClick={() => handleDownloadInvoice(order)}
                disabled={downloadingInvoice}
                className="px-3.5 py-1.5 bg-[#FAF8F5] hover:bg-[#13382B] text-[#13382B] hover:text-white rounded-full text-xs font-semibold flex items-center gap-1.5 border border-[#EDE8E1] transition-all shadow-xs disabled:opacity-50"
                title="Official PDF Tax Invoice"
              >
                <Download className={`w-3.5 h-3.5 ${downloadingInvoice ? 'animate-bounce' : ''}`} />
                <span>{downloadingInvoice ? 'Downloading...' : 'Tax Invoice (PDF)'}</span>
              </button>
            )}

            <span className="text-xs font-mono font-bold text-[#13382B] hidden sm:inline bg-gray-50 px-2.5 py-1 rounded-md border border-gray-200">
              #{order.orderNumber}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* Banner Alert for Cancellation / Payment Notice */}
        {cancelMessage && (
          <div
            className={`p-4 rounded-2xl text-xs font-medium flex items-center justify-between ${
              cancelMessage.type === 'success'
                ? 'bg-[#EAF1EB] text-[#2E6B48] border border-[#B8DAC2]'
                : 'bg-red-50 text-red-600 border border-red-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {cancelMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{cancelMessage.text}</span>
            </div>
            <button onClick={() => setCancelMessage(null)} className="font-bold ml-2">✕</button>
          </div>
        )}

        {paymentNotice && (
          <div
            className={`p-4 rounded-2xl text-xs font-medium flex items-center justify-between ${
              paymentNotice.type === 'success'
                ? 'bg-[#EAF1EB] text-[#2E6B48] border border-[#B8DAC2]'
                : 'bg-red-50 text-red-600 border border-red-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {paymentNotice.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{paymentNotice.text}</span>
            </div>
            <button onClick={() => setPaymentNotice(null)} className="font-bold ml-2">✕</button>
          </div>
        )}

        {/* COD Payment Collected Banner */}
        {order.paymentMethod === 'cod' && normPayment === 'paid' && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 shadow-2xs">
            <p className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
              <span>✅</span> COD Payment Collected
            </p>
            <p className="text-[11px] text-emerald-600 mt-0.5">Cash on Delivery payment has been marked as received.</p>
          </div>
        )}

        {/* ── Network Issue Online Payment Recovery Card ── */}
        {isOnlinePaymentPending && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-5 rounded-3xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                <RotateCcw className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif font-bold text-amber-900 text-sm">
                    Online Payment Pending / Incomplete
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200/80 text-amber-900">
                    Awaiting Payment
                  </span>
                </div>
                <p className="text-xs text-amber-800 mt-1 max-w-xl leading-relaxed">
                  Due to network disconnection during checkout, your online payment was not recorded. Complete the payment now to confirm your order and keep your reserved formulations.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRetryPayment}
              disabled={retryingPayment}
              className="py-3 px-6 bg-[#13382B] hover:bg-[#1E4D3B] text-white rounded-full text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 flex-shrink-0"
            >
              <CreditCard className="w-4 h-4" />
              <span>
                {retryingPayment
                  ? 'Connecting to Gateway...'
                  : `Complete Payment (₹${order.total.toLocaleString('en-IN')})`}
              </span>
            </button>
          </div>
        )}

        {/* Main Delivery Tracking Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EDE8E1] shadow-sm space-y-6">
          {/* Top Info Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-100">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border inline-flex items-center gap-1.5 ${statusMeta.color} ${statusMeta.border}`}
                >
                  <span>{statusMeta.icon}</span>
                  <span>{statusMeta.label}</span>
                </span>
                {isDelivered && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Completed</span>
                  </span>
                )}
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${payBadgeStyle}`}>
                  {normPayment.toUpperCase()}
                </span>
              </div>

              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#13382B] mt-2">
                {isCancelled
                  ? 'Order Cancelled'
                  : isDelivered
                  ? 'Current Milestone: Delivered (Completed)'
                  : `Current Milestone: ${statusMeta.label}`}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Consignment #{order.orderNumber} • Placed on{' '}
                {new Date(order.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>

            {/* Courier Details / Actions */}
            <div className="flex flex-col sm:items-end gap-2">
              {order.shiprocket?.awbCode && (
                <div className="bg-[#FAF8F5] p-3 rounded-2xl border border-[#EDE8E1] text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-gray-700 font-semibold">
                    <Truck className="w-4 h-4 text-[#2E6B48]" />
                    <span>{order.shiprocket.courierName || 'Priority Skincare Air Express'}</span>
                  </div>
                  <p className="font-mono text-[11px] text-gray-500">
                    AWB: <strong>{order.shiprocket.awbCode}</strong>
                  </p>
                  {order.shiprocket.trackingUrl && (
                    <a
                      href={order.shiprocket.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-[#2E6B48] font-semibold hover:underline flex items-center gap-1 pt-0.5"
                    >
                      <span>Live Courier Tracking</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}

              {/* Client-side Cancel Button (Validated Before Shipped) */}
              {isCancellable && (
                <button
                  type="button"
                  onClick={() => setShowCancelModal(true)}
                  className="px-4 py-2 border border-red-200 hover:bg-red-50 text-red-600 rounded-full text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Cancel Order</span>
                </button>
              )}

              {!isCancellable && !isCancelled && (
                <span className="text-[11px] text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-100 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  <span>Order in transit/delivered · Non-cancellable</span>
                </span>
              )}
            </div>
          </div>

          {/* 5-Step Pipeline Timeline (Desktop Horizontal, Mobile Vertical) */}
          {!isCancelled ? (
            <div className="py-3">
              {/* Desktop Stepper */}
              <div className="hidden md:block">
                <div className="relative">
                  {/* Connecting Line */}
                  <div className="absolute top-5 left-10 right-10 h-1 bg-gray-200 -z-0">
                    <div
                      className="h-full bg-[#2E6B48] transition-all duration-500"
                      style={{
                        width: `${Math.min(100, (Math.max(0, currentStepIdx) / (STATUS_PIPELINE.length - 1)) * 100)}%`,
                      }}
                    />
                  </div>

                  {/* Step Nodes */}
                  <div className="grid grid-cols-5 gap-2 relative z-10 text-center">
                    {STATUS_PIPELINE.map((st, idx) => {
                      const meta = STATUS_META[st];
                      const isCompleted = idx < currentStepIdx || isDelivered;
                      const isCurrent = idx === currentStepIdx && !isDelivered;

                      return (
                        <div key={st} className="flex flex-col items-center px-1">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                              isCompleted
                                ? 'bg-[#2E6B48] text-white shadow-md'
                                : isCurrent
                                ? `${meta.color} border-2 ${meta.border} ring-4 ring-[#13382B]/15 shadow-lg scale-110`
                                : 'bg-white border-2 border-gray-300 text-gray-400'
                            }`}
                          >
                            {isCompleted ? <CheckCircle2 className="w-5 h-5 text-white" /> : meta.icon}
                          </div>

                          <span
                            className={`text-xs font-bold mt-2.5 leading-tight ${
                              isCurrent ? 'text-[#13382B]' : isCompleted ? 'text-[#2E6B48]' : 'text-gray-400'
                            }`}
                          >
                            {meta.label}
                          </span>

                          <span className="text-[10px] text-gray-400 mt-0.5 line-clamp-2 max-w-[130px]">
                            {PIPELINE_DESCRIPTIONS[st]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Mobile Stepper */}
              <div className="block md:hidden space-y-4 pt-2">
                {STATUS_PIPELINE.map((st, idx) => {
                  const meta = STATUS_META[st];
                  const isCompleted = idx < currentStepIdx || isDelivered;
                  const isCurrent = idx === currentStepIdx && !isDelivered;

                  return (
                    <div key={st} className="flex items-start gap-3.5 relative">
                      {idx < STATUS_PIPELINE.length - 1 && (
                        <div
                          className={`absolute left-4 top-8 bottom-0 w-0.5 -ml-px ${
                            idx < currentStepIdx ? 'bg-[#2E6B48]' : 'bg-gray-200'
                          }`}
                        />
                      )}

                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 relative z-10 ${
                          isCompleted
                            ? 'bg-[#2E6B48] text-white shadow-xs'
                            : isCurrent
                            ? `${meta.color} border-2 ${meta.border} ring-2 ring-[#13382B]/20 shadow-md`
                            : 'bg-white border-2 border-gray-300 text-gray-400'
                        }`}
                      >
                        {isCompleted ? '✓' : meta.icon}
                      </div>

                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-center justify-between">
                          <p
                            className={`text-xs font-bold ${
                              isCurrent ? 'text-[#13382B]' : isCompleted ? 'text-[#2E6B48]' : 'text-gray-400'
                            }`}
                          >
                            {meta.label}
                          </p>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              isCurrent
                                ? 'bg-amber-100 text-amber-800'
                                : isCompleted
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-gray-100 text-gray-400'
                            }`}
                          >
                            {isCurrent ? 'Current' : isCompleted ? 'Completed' : 'Upcoming'}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5">{PIPELINE_DESCRIPTIONS[st]}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-5 bg-red-50 rounded-2xl border border-red-200 flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-red-900 text-sm">Order Cancelled</h3>
                <p className="text-xs text-red-700 mt-1">
                  Reason: {order.cancellation?.reason || 'Cancelled upon request'}{' '}
                  {order.cancellation?.note ? `(${order.cancellation.note})` : ''}
                </p>
                {order.refund && (
                  <p className="text-xs text-emerald-800 font-semibold mt-1">
                    ✓ Refund Status: {order.refund.status?.toUpperCase()} — ₹
                    {order.refund.amount?.toLocaleString('en-IN')} returned to original payment source.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Milestone Verification Table */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EDE8E1] shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h3 className="font-serif text-lg font-bold text-[#13382B]">
                Fulfillment Milestones
              </h3>
              <p className="text-xs text-gray-500">
                Detailed progression log for consignment #{order.orderNumber}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {!isCancelled && (
                <span className="text-xs font-bold text-[#2E6B48] bg-[#EAF1EB] px-3 py-1 rounded-full border border-[#B8DAC2] inline-flex items-center gap-1.5">
                  {isDelivered ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>All 5 Steps Completed</span>
                    </>
                  ) : (
                    <span>Step {Math.max(1, currentStepIdx + 1)} of 5</span>
                  )}
                </span>
              )}
              {normStatus === 'delivered' && (
                <button
                  type="button"
                  onClick={() => handleDownloadInvoice(order)}
                  disabled={downloadingInvoice}
                  className="px-3.5 py-1.5 bg-[#13382B] hover:bg-[#1E4D3B] text-white rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50"
                  title="Download Delivered Tax Invoice (PDF)"
                >
                  <Download className={`w-3.5 h-3.5 ${downloadingInvoice ? 'animate-bounce' : ''}`} />
                  <span>{downloadingInvoice ? 'Downloading...' : 'Download Invoice (PDF)'}</span>
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] border-b border-gray-200 text-gray-600 uppercase text-[10px] tracking-wider font-bold">
                <tr>
                  <th className="px-3.5 py-3">Step</th>
                  <th className="px-3.5 py-3">Status</th>
                  <th className="px-3.5 py-3">Operational Activity</th>
                  <th className="px-3.5 py-3">Status State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {STATUS_PIPELINE.map((st, idx) => {
                  const meta = STATUS_META[st];
                  const isCompleted = idx < currentStepIdx || isDelivered;
                  const isCurrent = idx === currentStepIdx && !isDelivered;

                  return (
                    <tr
                      key={st}
                      className={`transition-colors ${
                        isCurrent
                          ? 'bg-[#F7FAF8] font-semibold'
                          : isCompleted
                          ? 'bg-white hover:bg-gray-50/70'
                          : 'bg-white opacity-50'
                      }`}
                    >
                      <td className="px-3.5 py-3 font-mono font-bold text-gray-500">
                        {idx + 1}
                      </td>

                      <td className="px-3.5 py-3">
                        <span
                          className={`font-semibold text-[11px] px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1 ${meta.color} ${meta.border}`}
                        >
                          <span>{meta.icon}</span>
                          <span>{meta.label}</span>
                        </span>
                      </td>

                      <td className="px-3.5 py-3 text-gray-700">
                        {PIPELINE_DESCRIPTIONS[st]}
                      </td>

                      <td className="px-3.5 py-3">
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Completed</span>
                          </span>
                        ) : isCurrent ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 animate-pulse">
                            <Clock className="w-3.5 h-3.5" />
                            <span>In Progress</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-gray-400">Pending</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Shipping Destination & Payment Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Shipping Address */}
          <div className="bg-white rounded-3xl p-6 border border-[#EDE8E1] shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-[#13382B] font-bold text-sm">
              <MapPin className="w-4 h-4 text-[#2E6B48]" />
              <h3 className="font-serif">Delivery Destination</h3>
            </div>
            <div className="text-xs text-gray-600 space-y-1">
              <p className="font-bold text-gray-900 text-sm">{order.shippingAddress.fullName}</p>
              <p>{order.shippingAddress.street}</p>
              {order.shippingAddress.apartment && <p>{order.shippingAddress.apartment}</p>}
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state} -{' '}
                {order.shippingAddress.postalCode}
              </p>
              <p>{order.shippingAddress.country || 'India'}</p>
              <p className="pt-2 text-gray-800 font-semibold flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-gray-500" />
                <span>{order.shippingAddress.phone}</span>
              </p>
            </div>
          </div>

          {/* Payment & Invoice Breakdown */}
          <div className="bg-white rounded-3xl p-6 border border-[#EDE8E1] shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#13382B] font-bold text-sm">
                <CreditCard className="w-4 h-4 text-[#2E6B48]" />
                <h3 className="font-serif">Payment & Invoice Summary</h3>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${payBadgeStyle}`}>
                {normPayment.toUpperCase()}
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-gray-600">
              <div className="flex justify-between items-center">
                <span>Payment Channel</span>
                <span className={`font-semibold px-2 py-0.5 rounded inline-flex items-center gap-1 text-[11px] ${payMethodMeta.color}`}>
                  <span>{payMethodMeta.icon}</span>
                  <span>{payMethodMeta.label}</span>
                </span>
              </div>
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{order.subtotal.toLocaleString('en-IN')}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Voucher Discount</span>
                  <span>-₹{order.discount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Express Courier Shipping</span>
                <span className="text-emerald-700 font-bold">FREE (All Purchases)</span>
              </div>
              <div className="flex justify-between">
                <span>GST (Inclusive)</span>
                <span className="text-emerald-700 font-semibold">Included in Price (₹0)</span>
              </div>
              <div className="flex justify-between font-serif text-sm font-bold text-[#13382B] pt-2 border-t border-gray-100">
                <span>Total {order.paymentMethod === 'cod' ? 'Due on Delivery' : 'Paid'}</span>
                <span>₹{order.total.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* COD Status Banner */}
            {order.paymentMethod === 'cod' && normPayment === 'paid' && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 mt-3 shadow-2xs">
                <p className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                  <span>✅</span> COD Payment Collected
                </p>
                <p className="text-[11px] text-emerald-600 mt-0.5">Cash on Delivery payment has been marked as received.</p>
              </div>
            )}

            {order.paymentMethod === 'cod' && normPayment !== 'paid' && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 mt-3 text-xs">
                <p className="font-bold text-amber-800 flex items-center gap-1.5">
                  <span>🏠</span> Cash on Delivery
                </p>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  {normStatus === 'delivered'
                    ? 'Order delivered — payment collection being reconciled by courier.'
                    : `Please keep ₹${order.total.toLocaleString('en-IN')} in cash or UPI ready upon delivery.`}
                </p>
              </div>
            )}

            {/* Official PDF Invoice Direct Download Button - Only displayed when Fulfillment Milestone is Delivered */}
            {normStatus === 'delivered' && (
              <button
                type="button"
                onClick={() => handleDownloadInvoice(order)}
                disabled={downloadingInvoice}
                className="w-full mt-3 py-2 px-3 bg-[#FAF8F5] hover:bg-[#13382B] text-[#13382B] hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border border-[#EDE8E1] transition-all disabled:opacity-50"
              >
                <Download className={`w-3.5 h-3.5 ${downloadingInvoice ? 'animate-bounce' : ''}`} />
                <span>{downloadingInvoice ? 'Downloading Official PDF...' : 'Download Official Tax Invoice (PDF)'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Ordered Formulations List */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EDE8E1] shadow-sm space-y-4">
          <h3 className="font-serif text-lg font-bold text-[#13382B] border-b border-gray-100 pb-3">
            Purchased Botanical Formulations ({order.items.length})
          </h3>

          <div className="space-y-3">
            {order.items.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-4 p-3.5 bg-[#FAF8F5] rounded-2xl border border-gray-100"
              >
                <div className="flex items-center gap-3">
                  <img loading="lazy" decoding="async"
                    src={item.image}
                    alt={item.name}
                    className="w-14 h-14 object-contain rounded-xl bg-white p-1 border border-[#EDE8E1]"
                  />
                  <div>
                    <h4 className="font-serif text-sm font-bold text-gray-900">{item.name}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Quantity: {item.quantity} • Volume: {item.size || '50ml'}
                    </p>
                  </div>
                </div>

                <p className="font-serif text-sm font-bold text-[#13382B]">
                  ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Client Side Cancel Order Modal ── */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-gray-200 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-red-600">
              <XCircle className="w-6 h-6" />
              <h3 className="font-serif text-lg font-bold text-gray-900">Cancel Your Order?</h3>
            </div>
            <p className="text-xs text-gray-600">
              You can cancel before your formulations are dispatched. If paid online, an automatic refund of{' '}
              <strong>₹{order.total.toLocaleString('en-IN')}</strong> will be initiated to your payment source.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Reason for Cancellation *
                </label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full text-xs p-2.5 border border-gray-300 rounded-xl focus:outline-none focus:border-[#13382B]"
                >
                  <option value="Changed my mind">Changed my mind</option>
                  <option value="Ordered incorrect formulation or size">Ordered incorrect formulation or size</option>
                  <option value="Need to change delivery address">Need to change delivery address</option>
                  <option value="Delivery duration is longer than expected">Delivery duration is longer than expected</option>
                  <option value="Found alternative product">Found alternative product</option>
                  <option value="Other reason">Other reason</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Additional Note (Optional)
                </label>
                <textarea
                  rows={2}
                  value={cancelNote}
                  onChange={(e) => setCancelNote(e.target.value)}
                  placeholder="Tell us a little more..."
                  className="w-full text-xs p-2.5 border border-gray-300 rounded-xl focus:outline-none focus:border-[#13382B]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-xs font-semibold"
              >
                Keep Order
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={cancelling}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full text-xs font-bold transition-all shadow-sm disabled:opacity-50"
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderTrackingPage;
