import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  ArrowRight,
  Clock,
  CheckCircle2,
  Truck,
  AlertCircle,
  Download,
  CreditCard,
  Banknote,
  MapPin,
  XCircle,
  RotateCcw,
  Sparkles,
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

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Cancellation Modal State
  const [cancellingOrder, setCancellingOrder] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState('Changed my mind');
  const [cancelNote, setCancelNote] = useState('');
  const [submittingCancel, setSubmittingCancel] = useState(false);

  // Online Payment Retry State
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null);
  const [bannerNotice, setBannerNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownload = async (order: Order) => {
    setDownloadingId(order._id);
    try {
      await downloadOrderInvoicePdf(order);
    } finally {
      setDownloadingId(null);
    }
  };

  const fetchOrders = async () => {
    try {
      const data = await orderService.getMyOrders();
      setOrders(data);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCancelConfirm = async () => {
    if (!cancellingOrder) return;
    try {
      setSubmittingCancel(true);
      const res = await orderService.cancelOrder(cancellingOrder._id, cancelReason, cancelNote);
      setOrders((prev) => prev.map((o) => (o._id === cancellingOrder._id ? res.data : o)));
      setCancellingOrder(null);
      setBannerNotice({
        type: 'success',
        text: res.message || 'Order cancelled successfully and stock restored.',
      });
    } catch (err: any) {
      setBannerNotice({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Could not cancel order.',
      });
    } finally {
      setSubmittingCancel(false);
    }
  };

  const handleRetryPayment = async (order: Order) => {
    try {
      setPayingOrderId(order._id);
      setBannerNotice(null);

      const res = await orderService.retryOrderPayment(order._id);
      const { alreadyPaid, order: updatedOrder, razorpayOrder, keyId } = res.data;

      if (alreadyPaid) {
        setOrders((prev) => prev.map((o) => (o._id === order._id ? updatedOrder : o)));
        setBannerNotice({
          type: 'success',
          text: 'Payment has been verified! Order is confirmed.',
        });
        setPayingOrderId(null);
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

              setOrders((prev) => prev.map((o) => (o._id === order._id ? verifyRes.data : o)));
              setBannerNotice({
                type: 'success',
                text: 'Payment received! Your order is confirmed and proceeding to packing.',
              });
            } catch (vErr: any) {
              setBannerNotice({
                type: 'error',
                text: vErr.message || 'Payment verification failed.',
              });
            } finally {
              setPayingOrderId(null);
            }
          },
          prefill: {
            name: order.shippingAddress.fullName,
            contact: order.shippingAddress.phone,
          },
          theme: {
            color: '#13382B',
          },
          modal: {
            ondismiss: function () {
              setPayingOrderId(null);
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', async function (failRes: any) {
          try {
            await orderService.recordPaymentFailure(order._id, failRes?.error?.description);
          } catch {}
          setBannerNotice({
            type: 'error',
            text: failRes.error?.description || 'Payment was unsuccessful. Please retry.',
          });
          setPayingOrderId(null);
        });
        rzp.open();
      } else {
        // Safe Simulation in sandbox mode
        const verifyRes = await orderService.verifyOrderPayment(order._id, {
          razorpay_order_id: razorpayOrder?.id || `order_test_${Date.now()}`,
          razorpay_payment_id: `pay_test_${Date.now()}`,
          razorpay_signature: 'mock_verified_signature',
        });

        setOrders((prev) => prev.map((o) => (o._id === order._id ? verifyRes.data : o)));
        setBannerNotice({
          type: 'success',
          text: 'Payment simulated and verified! Your order is confirmed.',
        });
        setPayingOrderId(null);
      }
    } catch (err: any) {
      setBannerNotice({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Failed to start payment.',
      });
      setPayingOrderId(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 animate-pulse space-y-4">
        <div className="h-6 bg-gray-200 rounded w-1/4" />
        <div className="h-32 bg-gray-200 rounded-2xl" />
        <div className="h-32 bg-gray-200 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="w-full bg-[#FAF8F5] pb-20">
      {/* Header */}
      <div className="bg-white border-b border-[#EDE8E1] py-3.5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-xl font-bold text-[#13382B]">
              Order History & Tracking
            </h1>
            <p className="text-[11px] text-gray-500">Track shipments, manage cancellations, and download tax invoices</p>
          </div>
          <Link
            to="/shop"
            className="text-xs font-semibold text-[#13382B] hover:underline"
          >
            Continue Shopping
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 space-y-4">
        {/* Banner Notification */}
        {bannerNotice && (
          <div
            className={`p-3.5 rounded-2xl text-xs font-medium flex items-center justify-between shadow-xs ${
              bannerNotice.type === 'success'
                ? 'bg-[#EAF1EB] text-[#2E6B48] border border-[#B8DAC2]'
                : 'bg-red-50 text-red-600 border border-red-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {bannerNotice.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{bannerNotice.text}</span>
            </div>
            <button onClick={() => setBannerNotice(null)} className="font-bold ml-2">✕</button>
          </div>
        )}

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-[#EDE8E1] shadow-sm">
            <Package className="w-10 h-10 text-gray-300 mx-auto mb-2.5" />
            <h3 className="font-serif text-lg font-bold text-[#13382B]">No Past Orders Yet</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              You haven't placed any orders with Hydra yet. Discover our pure botanical formulations.
            </p>
            <Link
              to="/shop"
              className="mt-5 inline-block px-5 py-2 bg-[#13382B] text-white rounded-full text-xs font-semibold hover:bg-[#1E4D3B]"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const normStatus = normalizeStatus(order.status);
              const meta = STATUS_META[normStatus] || STATUS_META.placed;
              const normPayment = normalizePayment(order.paymentStatus);
              const payBadgeCls = paymentBadge[normPayment] || paymentBadge.pending;
              const payMethod = paymentMethodInfo[getPaymentKey(order.paymentMethod, order.paymentDetails?.method)] || paymentMethodInfo.upi;

              const isCancellable = canCancelOrder(order.status);
              const isDelivered = normStatus === 'delivered';
              const isCancelled = normStatus === 'cancelled';
              const isOnlinePending = order.paymentMethod !== 'cod' && normPayment !== 'paid' && !isCancelled;

              return (
                <div
                  key={order._id}
                  className="bg-white rounded-2xl p-4 sm:p-5 border border-[#EDE8E1] shadow-sm hover:shadow-md transition-shadow space-y-3.5"
                >
                  {/* Header Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-gray-100 text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-gray-400">Order</span>
                      <strong className="text-gray-900 font-mono text-xs">
                        #{order.orderNumber}
                      </strong>
                      <span className="text-gray-300">•</span>
                      <span className="text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Pipeline Status Badge with STATUS_META */}
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border inline-flex items-center gap-1 ${meta.color} ${meta.border}`}
                      >
                        <span>{meta.icon}</span>
                        <span>{meta.label}</span>
                      </span>

                      {/* Payment Status Badge */}
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${payBadgeCls}`}>
                        {normPayment.toUpperCase()}
                      </span>

                      {/* PDF Invoice Button - Only displayed when Fulfillment Milestone is Delivered */}
                      {normStatus === 'delivered' && (
                        <button
                          type="button"
                          onClick={() => handleDownload(order)}
                          disabled={downloadingId === order._id}
                          className="px-3 py-1 bg-[#FAF8F5] hover:bg-[#13382B] text-[#13382B] hover:text-white rounded-full text-xs font-semibold transition-colors flex items-center gap-1 border border-[#EDE8E1] shadow-2xs disabled:opacity-50"
                          title="Download Tax Invoice (PDF)"
                        >
                          <Download className={`w-3 h-3 ${downloadingId === order._id ? 'animate-bounce' : ''}`} />
                          <span>{downloadingId === order._id ? 'Downloading...' : 'PDF Invoice'}</span>
                        </button>
                      )}

                      {/* Live Track Button */}
                      <Link
                        to={`/orders/${order._id}`}
                        className="px-3.5 py-1 bg-[#13382B] hover:bg-[#1E4D3B] text-white rounded-full text-xs font-semibold transition-colors flex items-center gap-1"
                      >
                        <Truck className="w-3 h-3" />
                        <span>Track</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </Link>

                      {/* Attached Cancel Button (Validates before shipped) */}
                      {isCancellable && (
                        <button
                          type="button"
                          onClick={() => setCancellingOrder(order)}
                          className="px-3 py-1 border border-red-200 hover:bg-red-50 text-red-600 rounded-full text-xs font-semibold transition-colors flex items-center gap-1"
                        >
                          <XCircle className="w-3 h-3" />
                          <span>Cancel</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* ── Network Issue: Complete Payment Card on Order Card ── */}
                  {isOnlinePending && (
                    <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-amber-900">
                            Payment Not Completed (Network / Session Interrupted)
                          </p>
                          <p className="text-[11px] text-amber-700">
                            Your products are reserved. Complete payment online now to confirm this order.
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRetryPayment(order)}
                        disabled={payingOrderId === order._id}
                        className="px-4 py-2 bg-[#13382B] hover:bg-[#1E4D3B] text-white rounded-full text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 flex-shrink-0 disabled:opacity-50"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>
                          {payingOrderId === order._id
                            ? 'Connecting...'
                            : `Pay ₹${order.total.toLocaleString('en-IN')} Now`}
                        </span>
                      </button>
                    </div>
                  )}

                  {/* COD Payment Collected Banner on Order Card */}
                  {order.paymentMethod === 'cod' && normPayment === 'paid' && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
                      <p className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                        <span>✅</span> COD Payment Collected
                      </p>
                      <p className="text-[11px] text-emerald-600 mt-0.5">Cash on Delivery payment has been marked as received.</p>
                    </div>
                  )}

                  {/* Shiprocket Courier Bar if available */}
                  {order.shiprocket?.awbCode && (
                    <div className="bg-[#FAF8F5] rounded-xl px-3 py-1.5 border border-[#EDE8E1] flex flex-wrap items-center justify-between gap-2 text-[11px]">
                      <div className="flex items-center gap-1.5 text-gray-700">
                        <Truck className="w-3.5 h-3.5 text-[#2E6B48]" />
                        <span className="font-semibold">{order.shiprocket.courierName || 'Priority Courier'}</span>
                        <span className="text-gray-400">•</span>
                        <span className="font-mono text-gray-600">AWB: {order.shiprocket.awbCode}</span>
                      </div>
                      {order.shiprocket.etd && (
                        <span className="text-[#2E6B48] font-medium text-[10px]">
                          Est Delivery: {order.shiprocket.etd}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Items Row */}
                  <div className="space-y-2">
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-3 p-2 rounded-xl bg-[#FAF8F5]/60 hover:bg-[#FAF8F5] transition-colors border border-gray-100"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img loading="lazy" decoding="async"
                            src={item.image}
                            alt={item.name}
                            className="w-10 h-10 object-contain rounded-lg bg-white p-0.5 border border-[#EDE8E1] flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-gray-900 truncate">{item.name}</p>
                            <p className="text-[10px] text-gray-500">
                              Qty: {item.quantity} • {item.size || '50ml'}
                            </p>
                          </div>
                        </div>

                        <p className="text-xs font-serif font-bold text-[#13382B] flex-shrink-0">
                          ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Bottom Footer */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100 gap-2">
                    <p className="truncate text-[11px]">
                      To: <strong className="text-gray-800">{order.shippingAddress.fullName}</strong> ({order.shippingAddress.city}, {order.shippingAddress.postalCode})
                    </p>

                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded flex items-center gap-0.5 ${payMethod.color}`}>
                        <span>{payMethod.icon}</span>
                        <span>{payMethod.label}</span>
                      </span>

                      <span className="text-[10px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">
                        Free Express Shipping
                      </span>

                      <p className="font-serif text-sm font-bold text-[#13382B]">
                        ₹{order.total.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Client Side Cancel Order Modal ── */}
      {cancellingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-gray-200 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-red-600">
              <XCircle className="w-6 h-6" />
              <h3 className="font-serif text-lg font-bold text-gray-900">
                Cancel Order #{cancellingOrder.orderNumber}?
              </h3>
            </div>
            <p className="text-xs text-gray-600">
              You can cancel before your order is dispatched. If already paid, a full refund of{' '}
              <strong>₹{cancellingOrder.total.toLocaleString('en-IN')}</strong> will be returned to your payment method.
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
                onClick={() => setCancellingOrder(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-xs font-semibold"
              >
                Keep Order
              </button>
              <button
                type="button"
                onClick={handleCancelConfirm}
                disabled={submittingCancel}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full text-xs font-bold transition-all shadow-sm disabled:opacity-50"
              >
                {submittingCancel ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
