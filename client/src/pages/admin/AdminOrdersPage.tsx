import React, { useState, useEffect } from 'react';
import {
  Package,
  Truck,
  Download,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  MapPin,
  CreditCard,
  User,
  RefreshCw,
  Search,
  Lock,
  ArrowRight,
  XCircle,
  Clock,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Phone,
  Mail,
  Send,
  Calendar,
  Banknote,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { orderService } from '../../services/orderService';
import { downloadOrderInvoicePdf } from '../../utils/invoiceGenerator';
import { Order } from '../../types';

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

export const normalizeStatus = (status?: string | null): string => {
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

export const normalizePayment = (status?: string | null): 'pending' | 'paid' | 'failed' | 'refunded' => {
  if (!status) return 'pending';
  const s = status.toLowerCase();
  if (s === 'paid' || s === 'completed' || s === 'captured' || s === 'success') return 'paid';
  if (s === 'failed') return 'failed';
  if (s === 'refunded') return 'refunded';
  return 'pending';
};

export const getPaymentKey = (method?: string, detailsMethod?: string): 'upi' | 'card' | 'netbanking' | 'cod' => {
  const m = (detailsMethod || method || '').toLowerCase();
  if (m === 'cod') return 'cod';
  if (m.includes('card') || m.includes('visa') || m.includes('mastercard') || m.includes('debit') || m.includes('credit')) return 'card';
  if (m.includes('netbanking') || m.includes('bank') || m.includes('nb')) return 'netbanking';
  return 'upi';
};

export const getStepIndex = (status?: string | null): number => {
  const norm = normalizeStatus(status);
  const idx = STATUS_PIPELINE.indexOf(norm);
  return idx !== -1 ? idx : 0;
};

export const canCancelOrder = (status?: string | null): boolean => {
  const norm = normalizeStatus(status);
  return norm === 'placed' || norm === 'confirmed' || norm === 'processing';
};

export const AdminOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [syncingPayment, setSyncingPayment] = useState(false);
  const [collectingCod, setCollectingCod] = useState(false);
  const [shiprocketLoading, setShiprocketLoading] = useState(false);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Modal for admin cancellation
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('Customer requested cancellation');
  const [cancelNote, setCancelNote] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Modal for shipping details
  const [showShipModal, setShowShipModal] = useState(false);
  const [customCourier, setCustomCourier] = useState('');
  const [customAwb, setCustomAwb] = useState('');
  const [shippingNote, setShippingNote] = useState('');

  // Invoice Download State
  const [downloadingOrderId, setDownloadingOrderId] = useState<string | null>(null);

  const handleDownloadInvoice = async (orderToDownload?: Order | null) => {
    const o = orderToDownload || selectedOrder;
    if (!o) return;
    setDownloadingOrderId(o._id);
    try {
      await downloadOrderInvoicePdf(o);
    } finally {
      setDownloadingOrderId(null);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await adminService.getOrders({
        status: filter !== 'All' ? filter.toLowerCase() : undefined,
      });
      const orderList = res.data?.orders || res.data || res.orders || [];
      setOrders(orderList);

      if (selectedOrder) {
        const found = orderList.find((o: Order) => o._id === selectedOrder._id);
        if (found) setSelectedOrder(found);
      } else if (orderList.length > 0) {
        setSelectedOrder(orderList[0]);
      }
    } catch (err) {
      console.error('Error fetching admin orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  // Command-wise Next Status Progression
  const getNextStage = (currStatus: string): string | null => {
    const norm = normalizeStatus(currStatus);
    const idx = STATUS_PIPELINE.indexOf(norm);
    if (idx === -1 || idx >= STATUS_PIPELINE.length - 1) return null;
    return STATUS_PIPELINE[idx + 1];
  };

  const handleAdvanceStatus = async (order: Order) => {
    const nextStatus = getNextStage(order.status);
    if (!nextStatus) return;

    if (nextStatus === 'shipped') {
      setCustomCourier(order.shiprocket?.courierName || 'Blue Dart Express');
      setCustomAwb(order.shiprocket?.awbCode || order.trackingNumber || `TRACK-${order.orderNumber}`);
      setShippingNote('');
      setShowShipModal(true);
      return;
    }

    await executeStatusUpdate(order._id, nextStatus);
  };

  const handlePipelineStepUpdate = async (order: Order, targetStatus: string) => {
    const nextStatus = getNextStage(order.status);
    if (!nextStatus || targetStatus !== nextStatus) return;

    await handleAdvanceStatus(order);
  };

  const executeStatusUpdate = async (orderId: string, nextStatus: string, additional?: any) => {
    try {
      setUpdatingId(orderId);
      setActionNotice(null);

      const res = await orderService.updateOrderStatus(orderId, {
        status: nextStatus,
        ...additional,
      });

      const updated = res.data;
      setOrders((prev) => prev.map((o) => (o._id === orderId ? updated : o)));
      if (selectedOrder?._id === orderId) {
        setSelectedOrder(updated);
      }

      try {
        localStorage.setItem(
          'hydra_order_updated',
          JSON.stringify({ orderId, status: nextStatus, ts: Date.now() })
        );
      } catch {}

      setActionNotice({
        type: 'success',
        text: `Order status advanced to "${STATUS_META[nextStatus]?.label || nextStatus}" successfully!`,
      });
    } catch (err: any) {
      setActionNotice({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Failed to advance order status',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleConfirmShipment = async () => {
    if (!selectedOrder) return;
    setShowShipModal(false);
    await executeStatusUpdate(selectedOrder._id, 'shipped', {
      courierName: customCourier,
      trackingNumber: customAwb,
      note: shippingNote || undefined,
    });
  };

  const handleCancelOrder = async () => {
    if (!selectedOrder) return;
    try {
      setCancelling(true);
      setActionNotice(null);
      const res = await orderService.cancelOrder(selectedOrder._id, cancelReason, cancelNote);
      const updated = res.data;

      setOrders((prev) => prev.map((o) => (o._id === selectedOrder._id ? updated : o)));
      setSelectedOrder(updated);
      setShowCancelModal(false);
      setCancelNote('');
      setActionNotice({
        type: 'info',
        text: res.message || 'Order cancelled successfully and stock has been restored.',
      });
    } catch (err: any) {
      setActionNotice({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Failed to cancel order',
      });
    } finally {
      setCancelling(false);
    }
  };

  const handleSyncPayment = async (orderId: string) => {
    try {
      setSyncingPayment(true);
      setActionNotice(null);
      const res = await orderService.syncOrderPayment(orderId);
      const { paid, order: updated } = res.data;

      setOrders((prev) => prev.map((o) => (o._id === orderId ? updated : o)));
      if (selectedOrder?._id === orderId) {
        setSelectedOrder(updated);
      }

      setActionNotice({
        type: paid ? 'success' : 'info',
        text: res.message || (paid ? 'Payment confirmed via Razorpay!' : 'Payment still pending on gateway.'),
      });
    } catch (err: any) {
      setActionNotice({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Payment sync failed',
      });
    } finally {
      setSyncingPayment(false);
    }
  };

  const handleCollectMoney = async (orderId: string) => {
    try {
      setCollectingCod(true);
      setActionNotice(null);
      const res = await orderService.collectCodPayment(orderId);
      const updated = res.data;

      setOrders((prev) => prev.map((o) => (o._id === orderId ? updated : o)));
      if (selectedOrder?._id === orderId) {
        setSelectedOrder(updated);
      }

      setActionNotice({
        type: 'success',
        text: `COD Payment of ₹${updated.total.toLocaleString('en-IN')} marked as received successfully!`,
      });
    } catch (err: any) {
      setActionNotice({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Failed to collect COD payment',
      });
    } finally {
      setCollectingCod(false);
    }
  };

  const handleCreateShiprocket = async (orderId: string) => {
    try {
      setShiprocketLoading(true);
      setActionNotice(null);
      const res = await orderService.createShiprocketOrder(orderId);
      const updated = res.data;

      setOrders((prev) => prev.map((o) => (o._id === orderId ? updated : o)));
      if (selectedOrder?._id === orderId) {
        setSelectedOrder(updated);
      }

      setActionNotice({
        type: 'success',
        text: `Shiprocket consignment ready! Courier: ${updated.shiprocket?.courierName || 'Express'} · AWB: ${
          updated.shiprocket?.awbCode || updated.trackingNumber
        }`,
      });
    } catch (err: any) {
      setActionNotice({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Failed to generate Shiprocket dispatch',
      });
    } finally {
      setShiprocketLoading(false);
    }
  };

  // Filtered orders with search
  const filteredOrders = orders.filter((o) => {
    const norm = normalizeStatus(o.status);
    const matchesFilter = filter === 'All' || norm === filter.toLowerCase();

    const query = searchQuery.trim().toLowerCase();
    if (!query) return matchesFilter;

    const custName = typeof o.user === 'object' ? o.user?.name : '';
    const custEmail = typeof o.user === 'object' ? o.user?.email : '';
    const matchesQuery =
      o.orderNumber?.toLowerCase().includes(query) ||
      o.shippingAddress?.fullName?.toLowerCase().includes(query) ||
      o.shippingAddress?.city?.toLowerCase().includes(query) ||
      o.shippingAddress?.phone?.includes(query) ||
      custName?.toLowerCase().includes(query) ||
      custEmail?.toLowerCase().includes(query) ||
      (o.shiprocket?.awbCode && o.shiprocket.awbCode.toLowerCase().includes(query)) ||
      (o.trackingNumber && o.trackingNumber.toLowerCase().includes(query));

    return matchesFilter && matchesQuery;
  });

  const selectedNormStatus = selectedOrder ? normalizeStatus(selectedOrder.status) : 'placed';
  const selectedMeta = STATUS_META[selectedNormStatus] || STATUS_META.placed;
  const selectedPayNorm = selectedOrder ? normalizePayment(selectedOrder.paymentStatus) : 'pending';
  const selectedPayBadge = paymentBadge[selectedPayNorm] || paymentBadge.pending;
  const selectedPayMethodKey = selectedOrder
    ? getPaymentKey(selectedOrder.paymentMethod, selectedOrder.paymentDetails?.method)
    : 'upi';
  const selectedPayMethod = paymentMethodInfo[selectedPayMethodKey] || paymentMethodInfo.upi;
  const selectedStepIdx = getStepIndex(selectedNormStatus);
  const nextStageForSelected = selectedOrder ? getNextStage(selectedOrder.status) : null;
  const isDelivered = selectedNormStatus === 'delivered';
  const isCancelled = selectedNormStatus === 'cancelled';
  const isOrderCancellable = selectedOrder ? canCancelOrder(selectedOrder.status) : false;
  const isCod = selectedOrder?.paymentMethod === 'cod';
  const isCodDelivered = isCod && isDelivered;
  const isCodPaid = isCod && selectedPayNorm === 'paid';
  const isCodPendingDelivered = isCodDelivered && !isCodPaid;

  return (
    <div className="space-y-6">
      {/* Page Title & Stats Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🌿</span>
            <h1 className="text-2xl font-serif font-bold text-[#13382B]">
              Order Fulfillment & Operations
            </h1>
          </div>
          <p className="text-gray-500 text-xs mt-1">
            Enterprise 5-Step Pipeline: Placed → Confirmed → Processing → Shipped → Delivered
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchOrders}
            className="px-3.5 py-1.5 bg-white text-gray-700 hover:text-[#13382B] rounded-full text-xs font-semibold border border-gray-200 hover:border-gray-300 flex items-center gap-1.5 shadow-sm transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <span className="text-xs font-bold text-[#13382B] bg-[#EAF1EB] px-3.5 py-1.5 rounded-full border border-[#B8DAC2]">
            {filteredOrders.length} {filteredOrders.length === 1 ? 'Order' : 'Orders'}
          </span>
        </div>
      </div>

      {/* Action Notification */}
      {actionNotice && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-medium flex items-center justify-between shadow-sm animate-fade-in ${
            actionNotice.type === 'success'
              ? 'bg-[#EAF1EB] text-[#2E6B48] border border-[#B8DAC2]'
              : actionNotice.type === 'info'
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : 'bg-red-50 text-red-600 border border-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionNotice.type === 'success' && <CheckCircle2 className="w-4 h-4 text-[#2E6B48]" />}
            {actionNotice.type === 'info' && <AlertCircle className="w-4 h-4 text-blue-600" />}
            {actionNotice.type === 'error' && <XCircle className="w-4 h-4 text-red-600" />}
            <span>{actionNotice.text}</span>
          </div>
          <button
            onClick={() => setActionNotice(null)}
            className="text-xs opacity-60 hover:opacity-100 ml-2 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Search Bar & Pipeline Filter Buttons */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Order #, Customer, Phone, City, AWB..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-full focus:outline-none focus:border-[#13382B] bg-white shadow-sm"
          />
        </div>

        {/* Filter Pills with Meta Colors */}
        <div className="flex gap-1.5 flex-wrap overflow-x-auto pb-1 max-w-full">
          {['All', ...STATUS_PIPELINE, 'cancelled'].map((s) => {
            const isAll = s === 'All';
            const meta = STATUS_META[s];
            const isSelected = filter.toLowerCase() === s.toLowerCase();

            return (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#13382B] text-white shadow-sm'
                    : isAll
                    ? 'bg-white text-gray-600 border border-gray-200 hover:border-[#13382B]'
                    : `${meta.color} border ${meta.border} hover:opacity-90`
                }`}
              >
                {!isAll && <span>{meta?.icon}</span>}
                <span>{isAll ? 'All Orders' : meta?.label || s}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Two Column Layout: Orders List (Left) + Command Center Panel (Right) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Orders Table (Left 7 cols) */}
        <div className="xl:col-span-7 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-80">
              <div className="w-8 h-8 border-4 border-[#13382B] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-80 text-gray-400 text-xs">
              <Package className="w-12 h-12 mb-2 opacity-30 text-gray-500" />
              <p className="font-semibold text-gray-600">No orders found</p>
              <p className="text-gray-400 text-[11px] mt-0.5">Try adjusting your filters or search terms</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#FAF8F5] border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                      Order / Date
                    </th>
                    <th className="px-4 py-3 text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-4 py-3 text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="px-4 py-3 text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                      Pipeline Status
                    </th>
                    <th className="px-3 py-3 text-[11px] font-bold text-gray-600 uppercase tracking-wider text-right">
                      Invoice
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {filteredOrders.map((order) => {
                    const isSelected = selectedOrder?._id === order._id;
                    const customerName =
                      typeof order.user === 'object' && order.user?.name
                        ? order.user.name
                        : order.shippingAddress?.fullName || 'Customer';

                    const normStatus = normalizeStatus(order.status);
                    const meta = STATUS_META[normStatus] || STATUS_META.placed;
                    const normPay = normalizePayment(order.paymentStatus);
                    const payBadgeCls = paymentBadge[normPay] || paymentBadge.pending;
                    const payMethod = paymentMethodInfo[getPaymentKey(order.paymentMethod, order.paymentDetails?.method)] || paymentMethodInfo.upi;

                    return (
                      <tr
                        key={order._id}
                        onClick={() => setSelectedOrder(order)}
                        className={`hover:bg-[#FAF8F5] cursor-pointer transition-colors ${
                          isSelected ? 'bg-[#F4F8F5] ring-1 ring-inset ring-[#13382B]/30' : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          <p className="font-mono font-bold text-[#13382B] text-xs">
                            #{order.orderNumber}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {new Date(order.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                        </td>

                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-900 truncate max-w-[130px]">
                            {customerName}
                          </p>
                          <p className="text-[11px] text-gray-500 truncate max-w-[130px]">
                            {order.shippingAddress?.city}
                          </p>
                        </td>

                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-900">
                            ₹{order.total.toLocaleString('en-IN')}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${payBadgeCls}`}>
                              {normPay.toUpperCase()}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-0.5 ${payMethod.color}`}>
                              <span>{payMethod.icon}</span>
                              <span>{payMethod.label}</span>
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold border inline-flex items-center gap-1.5 shadow-2xs ${meta.color} ${meta.border}`}
                          >
                            <span>{meta.icon}</span>
                            <span>{meta.label}</span>
                          </span>
                        </td>

                        <td className="px-3 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                          {normStatus === 'delivered' ? (
                            <button
                              type="button"
                              onClick={() => handleDownloadInvoice(order)}
                              disabled={downloadingOrderId === order._id}
                              title={`Download Delivered Invoice #${order.orderNumber}`}
                              className="p-1.5 bg-[#FAF8F5] hover:bg-[#13382B] text-[#13382B] hover:text-white rounded-lg transition-colors border border-gray-200 inline-flex items-center gap-1 disabled:opacity-50"
                            >
                              <Download className={`w-3.5 h-3.5 ${downloadingOrderId === order._id ? 'animate-bounce' : ''}`} />
                            </button>
                          ) : (
                            <span className="text-[10px] text-gray-300 font-mono">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Selected Order Detailed Command Center (Right 5 cols) */}
        <div className="xl:col-span-5 bg-white rounded-2xl shadow-sm border border-gray-200 p-5 sm:p-6 space-y-5">
          {selectedOrder ? (
            <div className="space-y-5 text-xs">
              {/* Header with PDF Tax Invoice */}
              <div className="flex items-start justify-between border-b border-gray-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">
                      Order Overview
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border inline-flex items-center gap-1 ${selectedMeta.color} ${selectedMeta.border}`}
                    >
                      <span>{selectedMeta.icon}</span>
                      <span>{selectedMeta.label}</span>
                    </span>
                  </div>
                  <h3 className="font-serif text-xl font-bold text-[#13382B] mt-1">
                    #{selectedOrder.orderNumber}
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-gray-400" />
                    <span>Placed on {new Date(selectedOrder.createdAt).toLocaleString('en-IN')}</span>
                  </p>
                </div>

                {/* Tax Invoice PDF Button - Only displayed when Fulfillment Milestone is Delivered */}
                {selectedNormStatus === 'delivered' && (
                  <button
                    type="button"
                    onClick={() => handleDownloadInvoice(selectedOrder)}
                    disabled={downloadingOrderId === selectedOrder._id}
                    className="px-3.5 py-1.5 bg-[#FAF8F5] hover:bg-[#13382B] text-[#13382B] hover:text-white rounded-full text-xs font-semibold flex items-center gap-1.5 border border-[#EDE8E1] transition-all shadow-xs disabled:opacity-50"
                    title="Official Tax Invoice (PDF)"
                  >
                    <Download className={`w-3.5 h-3.5 ${downloadingOrderId === selectedOrder._id ? 'animate-bounce' : ''}`} />
                    <span>{downloadingOrderId === selectedOrder._id ? 'Downloading...' : 'Invoice PDF'}</span>
                  </button>
                )}
              </div>

              {/* Enterprise 5-Step Pipeline Visualizer */}
              {!isCancelled ? (
                <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#EDE8E1] space-y-3">
                  <div className="flex items-center justify-between text-xs gap-2">
                    <span className="font-bold text-gray-800">5-Step Delivery Pipeline</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isDelivered
                          ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                          : 'text-[#13382B] bg-white border-[#EDE8E1]'
                      }`}
                    >
                      {isDelivered
                        ? 'Step 5 of 5: Delivered (Completed)'
                        : `Step ${selectedStepIdx + 1} of 5: ${selectedMeta.label}`}
                    </span>
                  </div>

                  {/* Horizontal Interactive Nodes */}
                  <div className="grid grid-cols-5 gap-1 pt-1 text-center">
                    {STATUS_PIPELINE.map((st, idx) => {
                      const meta = STATUS_META[st];
                      const isPast = idx < selectedStepIdx || isDelivered;
                      const isCurrent = idx === selectedStepIdx && !isDelivered;
                      const isNextStep = idx === selectedStepIdx + 1 && !isDelivered;
                      const isUpdatingThis = updatingId === selectedOrder._id;

                      return (
                        <button
                          key={st}
                          type="button"
                          onClick={() => isNextStep && handlePipelineStepUpdate(selectedOrder, st)}
                          disabled={!isNextStep || isUpdatingThis}
                          title={
                            isNextStep
                              ? `Click to update order status to ${meta.label}`
                              : isPast
                              ? `${meta.label} (Completed)`
                              : isCurrent
                              ? `${meta.label} (Current)`
                              : `Complete ${STATUS_META[STATUS_PIPELINE[idx - 1]]?.label || 'previous step'} first`
                          }
                          className={`flex flex-col items-center group focus:outline-none ${
                            isNextStep && !isUpdatingThis
                              ? 'cursor-pointer hover:opacity-90'
                              : 'cursor-default'
                          }`}
                        >
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                              isPast
                                ? 'bg-[#2E6B48] text-white shadow-xs'
                                : isCurrent
                                ? `${meta.color} border-2 ${meta.border} ring-2 ring-[#13382B]/20 scale-110 shadow-sm`
                                : isNextStep
                                ? 'bg-white text-[#13382B] border-2 border-dashed border-[#13382B]/60 group-hover:border-[#13382B] group-hover:scale-105'
                                : 'bg-gray-100 text-gray-400 border border-gray-200'
                            }`}
                          >
                            {isPast ? '✓' : meta.icon}
                          </div>
                          <span
                            className={`text-[9px] font-bold mt-1.5 leading-tight ${
                              isCurrent
                                ? 'text-[#13382B]'
                                : isPast
                                ? 'text-[#2E6B48]'
                                : isNextStep
                                ? 'text-[#13382B]'
                                : 'text-gray-400'
                            }`}
                          >
                            {meta.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Attached Step-by-Step Update Control inside 5-Step Delivery Pipeline */}
                  {!isDelivered && nextStageForSelected && (
                    <div className="pt-2.5 mt-1 border-t border-[#EDE8E1] flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[10px] text-gray-500">
                        Next step: <strong>{STATUS_META[nextStageForSelected]?.label}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAdvanceStatus(selectedOrder)}
                        disabled={updatingId === selectedOrder._id}
                        className={`px-3.5 py-1.5 text-white rounded-full text-[11px] font-bold flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50 ${
                          nextStageForSelected === 'delivered'
                            ? 'bg-[#2E6B48] hover:bg-[#13382B]'
                            : 'bg-[#13382B] hover:bg-[#1E4D3B]'
                        }`}
                      >
                        {nextStageForSelected === 'delivered' && <CheckCircle2 className="w-3.5 h-3.5" />}
                        <span>
                          {updatingId === selectedOrder._id
                            ? 'Updating...'
                            : nextStageForSelected === 'confirmed'
                            ? 'Update to Confirmed →'
                            : nextStageForSelected === 'processing'
                            ? 'Update to Processing →'
                            : nextStageForSelected === 'shipped'
                            ? 'Update to Shipped 🚚 →'
                            : 'Mark as Delivered 🎉'}
                        </span>
                      </button>
                    </div>
                  )}

                  {/* Milestone Delivered Confirmation & Invoice Download */}
                  {selectedNormStatus === 'delivered' && (
                    <div className="pt-2.5 mt-2 border-t border-emerald-200 flex items-center justify-between text-xs gap-2">
                      <span className="text-emerald-700 font-bold flex items-center gap-1.5 text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Delivery Completed — Milestone: Delivered</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDownloadInvoice(selectedOrder)}
                        disabled={downloadingOrderId === selectedOrder._id}
                        className="px-3 py-1 bg-[#13382B] hover:bg-[#1E4D3B] text-white rounded-full text-[11px] font-semibold flex items-center gap-1 shadow-xs disabled:opacity-50"
                      >
                        <Download className="w-3 h-3" />
                        <span>{downloadingOrderId === selectedOrder._id ? 'Downloading...' : 'Download Invoice'}</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3.5 bg-red-50 text-red-700 rounded-2xl border border-red-200 flex items-start gap-2.5 text-xs">
                  <XCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">This Order is Cancelled</p>
                    <p className="text-[11px] text-red-600 mt-0.5">
                      Reason: {selectedOrder.cancellation?.reason || 'Customer / Admin cancelled'}{' '}
                      {selectedOrder.cancellation?.note ? `(${selectedOrder.cancellation.note})` : ''}
                    </p>
                    {selectedOrder.refund && (
                      <p className="text-[11px] font-semibold mt-1">
                        Refund Status: {selectedOrder.refund.status?.toUpperCase()} (₹
                        {selectedOrder.refund.amount?.toLocaleString('en-IN')})
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Admin Action Command Bar */}
              <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-800 text-xs">Admin Action Center</span>
                  {isDelivered && (
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-emerald-600" />
                      <span>Completed & Locked</span>
                    </span>
                  )}
                </div>

                {/* Primary Forward Command Button */}
                {!isDelivered && !isCancelled && nextStageForSelected && (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => handleAdvanceStatus(selectedOrder)}
                      disabled={updatingId === selectedOrder._id}
                      className="w-full py-2.5 px-4 bg-[#13382B] hover:bg-[#1E4D3B] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                    >
                      <span>
                        {updatingId === selectedOrder._id
                          ? 'Updating Pipeline...'
                          : nextStageForSelected === 'confirmed'
                          ? 'Confirm Order Acceptance →'
                          : nextStageForSelected === 'processing'
                          ? 'Move to Warehouse Processing (Packing) →'
                          : nextStageForSelected === 'shipped'
                          ? 'Dispatch & Mark as Shipped 🚚 →'
                          : 'Mark as Delivered to Customer 🎉 →'}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <p className="text-[10px] text-gray-400 text-center">
                      Command-wise progression: Advances strictly to{' '}
                      <strong>{STATUS_META[nextStageForSelected]?.label}</strong>.
                    </p>
                  </div>
                )}

                {/* Cancel Order Action (Enabled only before shipped) */}
                {isOrderCancellable && (
                  <button
                    type="button"
                    onClick={() => setShowCancelModal(true)}
                    className="w-full py-2 px-3 border border-red-200 hover:bg-red-50 text-red-600 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Cancel Order (Restocks items & refunds if paid)</span>
                  </button>
                )}

                {/* Collect Money Button — only for COD + pending payment after delivery */}
                {isCodPendingDelivered && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => handleCollectMoney(selectedOrder._id)}
                      disabled={collectingCod}
                      className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
                    >
                      <Banknote className="w-4 h-4" />
                      <span>
                        {collectingCod
                          ? 'Recording Payment...'
                          : `Collect Money — ₹${selectedOrder.total.toLocaleString('en-IN')}`}
                      </span>
                    </button>
                    <p className="text-[10px] text-gray-500 text-center mt-1">
                      Order delivered. Click to mark Cash on Delivery as collected.
                    </p>
                  </div>
                )}

                {/* COD Payment Collected Badge */}
                {isCodPaid && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
                    <p className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                      <span>✅</span> COD Payment Collected
                    </p>
                    <p className="text-[11px] text-emerald-600 mt-0.5">Cash on Delivery payment has been marked as received.</p>
                  </div>
                )}

                {!isOrderCancellable && !isCancelled && (
                  <div className="p-2 bg-gray-50 rounded-xl text-[10px] text-gray-500 flex items-center gap-1.5 border border-gray-100">
                    <Lock className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    <span>
                      Order is already <strong>{selectedMeta.label}</strong>. Cancellation is permitted only before dispatch.
                    </span>
                  </div>
                )}
              </div>

              {/* Payment Details & Re-sync Card */}
              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#EDE8E1] space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[#2E6B48]" />
                    <span className="font-bold text-gray-900 text-xs">Payment Information</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${selectedPayBadge}`}>
                    {selectedPayNorm.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div>
                    <span className="text-gray-500 block text-[10px]">Method:</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${selectedPayMethod.color}`}>
                      <span>{selectedPayMethod.icon}</span>
                      <span>{selectedPayMethod.label}</span>
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-500 block text-[10px]">Reference:</span>
                    <strong className="font-mono text-gray-800 text-[11px]">
                      {selectedOrder.paymentMethod === 'cod'
                        ? 'Cash Payable on Delivery'
                        : selectedOrder.paymentDetails?.razorpayPaymentId ||
                          (selectedOrder.paymentDetails?.razorpayOrderId
                            ? `Order: ${selectedOrder.paymentDetails.razorpayOrderId.slice(-8)}`
                            : 'Pending')}
                    </strong>
                  </div>
                </div>

                {/* If online and pending/failed, provide admin sync tool */}
                {selectedOrder.paymentMethod !== 'cod' && selectedPayNorm !== 'paid' && (
                  <button
                    type="button"
                    onClick={() => handleSyncPayment(selectedOrder._id)}
                    disabled={syncingPayment}
                    className="w-full mt-2 py-1.5 bg-white hover:bg-gray-100 text-[#13382B] border border-gray-200 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 text-[#2E6B48] ${syncingPayment ? 'animate-spin' : ''}`} />
                    <span>{syncingPayment ? 'Checking Gateway...' : 'Re-check / Sync Payment with Razorpay'}</span>
                  </button>
                )}

                {/* COD Pending after delivery — Collect Money button */}
                {isCodPendingDelivered && (
                  <button
                    type="button"
                    onClick={() => handleCollectMoney(selectedOrder._id)}
                    disabled={collectingCod}
                    className="w-full mt-2 py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-2xs disabled:opacity-50"
                  >
                    <Banknote className="w-4 h-4" />
                    <span>
                      {collectingCod ? 'Collecting...' : `Collect Money (₹${selectedOrder.total.toLocaleString('en-IN')})`}
                    </span>
                  </button>
                )}

                {/* COD Payment Collected Banner */}
                {isCodPaid && (
                  <div className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
                    <p className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                      <span>✅</span> COD Payment Collected
                    </p>
                    <p className="text-[11px] text-emerald-600 mt-0.5">Cash on Delivery payment has been marked as received.</p>
                  </div>
                )}

                {/* COD Pending before delivery notice */}
                {isCod && !isDelivered && !isCancelled && (
                  <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs">
                    <p className="font-semibold text-amber-800 flex items-center gap-1.5">
                      <span>🏠</span> Cash to be collected upon delivery
                    </p>
                    <p className="text-[11px] text-amber-700 mt-0.5">
                      Collect Money button will become active once order is marked Delivered.
                    </p>
                  </div>
                )}
              </div>

         

              {/* Customer Info & Shipping Destination */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-xl border border-gray-100 bg-gray-50/70 space-y-1">
                  <div className="flex items-center gap-1.5 text-gray-700 font-bold text-[11px]">
                    <User className="w-3.5 h-3.5 text-[#2E6B48]" />
                    <span>Customer Details</span>
                  </div>
                  <p className="font-semibold text-gray-900">
                    {typeof selectedOrder.user === 'object'
                      ? selectedOrder.user?.name
                      : selectedOrder.shippingAddress?.fullName}
                  </p>
                  <p className="text-gray-500 text-[11px]">
                    {typeof selectedOrder.user === 'object' ? selectedOrder.user?.email : '—'}
                  </p>
                  <p className="text-gray-600 font-mono text-[11px]">
                    Ph: {selectedOrder.shippingAddress?.phone}
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-gray-100 bg-gray-50/70 space-y-1">
                  <div className="flex items-center gap-1.5 text-gray-700 font-bold text-[11px]">
                    <MapPin className="w-3.5 h-3.5 text-[#2E6B48]" />
                    <span>Delivery Address</span>
                  </div>
                  <p className="text-gray-700 leading-snug">
                    {selectedOrder.shippingAddress?.street}
                    {selectedOrder.shippingAddress?.apartment
                      ? `, ${selectedOrder.shippingAddress.apartment}`
                      : ''}
                  </p>
                  <p className="text-gray-600 font-medium">
                    {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} -{' '}
                    {selectedOrder.shippingAddress?.postalCode}
                  </p>
                </div>
              </div>

              {/* Ordered Formulations List */}
              <div className="space-y-2 pt-1 border-t border-gray-100">
                <h4 className="font-bold text-gray-800 text-xs">
                  Ordered Formulations ({selectedOrder.items?.length || 0})
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedOrder.items?.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-3 p-2 rounded-xl bg-[#FAF8F5] border border-gray-100"
                    >
                      <div className="flex items-center gap-2.5">
                        <img loading="lazy" decoding="async"
                          src={item.image}
                          alt={item.name}
                          className="w-10 h-10 object-contain bg-white rounded-lg p-0.5 border border-gray-200"
                        />
                        <div>
                          <p className="font-bold text-gray-900 line-clamp-1">{item.name}</p>
                          <p className="text-[10px] text-gray-400">
                            Qty: {item.quantity} • {item.size || '50ml'}
                          </p>
                        </div>
                      </div>
                      <span className="font-semibold text-gray-900">
                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="space-y-1.5 pt-2 border-t border-gray-100 text-gray-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{selectedOrder.subtotal?.toLocaleString('en-IN')}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Discount ({selectedOrder.couponCode || 'PROMO'})</span>
                    <span>-₹{selectedOrder.discount?.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Express Shipping</span>
                  <span className="text-emerald-700 font-bold">FREE (All Purchases)</span>
                </div>
                <div className="flex justify-between">
                  <span>GST (Inclusive)</span>
                  <span className="text-emerald-700 font-semibold">Included in Price (₹0)</span>
                </div>
                <div className="flex justify-between text-sm font-serif font-bold text-[#13382B] pt-2 border-t border-gray-200">
                  <span>Total Amount {selectedOrder.paymentMethod === 'cod' ? 'Due on Delivery' : 'Paid'}</span>
                  <span>₹{selectedOrder.total?.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Audit / Timeline Log */}
              {selectedOrder.trackingHistory && selectedOrder.trackingHistory.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <h4 className="font-bold text-gray-800 text-xs">Lifecycle Audit History</h4>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {selectedOrder.trackingHistory.map((hist, idx) => (
                      <div
                        key={idx}
                        className="text-[11px] p-2 rounded-lg bg-gray-50 border border-gray-100 flex items-start justify-between gap-2"
                      >
                        <div>
                          <p className="text-gray-800 font-medium">{hist.message}</p>
                          <span className="text-[10px] text-gray-400 capitalize">
                            By {hist.actor || 'system'}
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-400 flex-shrink-0">
                          {new Date(hist.timestamp).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-80 text-gray-400 text-xs text-center">
              <Package className="w-10 h-10 mb-2 opacity-30" />
              <p className="font-semibold text-gray-600">Select an order</p>
              <p className="text-gray-400 text-[11px] mt-0.5">
                Click any order in the list to open its detailed operations panel
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Cancel Order Dialog ── */}
      {showCancelModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-gray-200 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-red-600">
              <XCircle className="w-6 h-6" />
              <h3 className="font-serif text-lg font-bold text-gray-900">Cancel Order #{selectedOrder.orderNumber}</h3>
            </div>
            <p className="text-xs text-gray-600">
              Cancelling this order will release reserved inventory back into stock. If the customer has already paid online, an automatic refund will be triggered.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Cancellation Reason *</label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full text-xs p-2.5 border border-gray-300 rounded-xl focus:outline-none focus:border-[#13382B]"
                >
                  <option value="Customer requested cancellation">Customer requested cancellation</option>
                  <option value="Address incomplete or unserviceable">Address incomplete or unserviceable</option>
                  <option value="Payment verification timeout">Payment verification timeout</option>
                  <option value="Item damaged or quality check failed">Item damaged or quality check failed</option>
                  <option value="Suspected fraudulent order">Suspected fraudulent order</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Internal Note (Optional)</label>
                <textarea
                  rows={2}
                  value={cancelNote}
                  onChange={(e) => setCancelNote(e.target.value)}
                  placeholder="Additional context for this cancellation..."
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
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full text-xs font-bold transition-all shadow-sm disabled:opacity-50"
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Dispatch / Shipping Modal ── */}
      {showShipModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-gray-200 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-purple-700">
              <Truck className="w-6 h-6" />
              <h3 className="font-serif text-lg font-bold text-gray-900">Dispatch Order #{selectedOrder.orderNumber}</h3>
            </div>
            <p className="text-xs text-gray-600">
              Confirm courier partner and consignment AWB number to advance status to <strong>Shipped</strong>.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Courier Partner *</label>
                <input
                  type="text"
                  value={customCourier}
                  onChange={(e) => setCustomCourier(e.target.value)}
                  placeholder="e.g. Blue Dart Express, Delhivery, Shadowfax"
                  className="w-full text-xs p-2.5 border border-gray-300 rounded-xl focus:outline-none focus:border-[#13382B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Consignment AWB / Tracking # *</label>
                <input
                  type="text"
                  value={customAwb}
                  onChange={(e) => setCustomAwb(e.target.value)}
                  placeholder="e.g. AWB9876543210"
                  className="w-full text-xs p-2.5 border border-gray-300 rounded-xl font-mono focus:outline-none focus:border-[#13382B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Dispatch Note (Optional)</label>
                <input
                  type="text"
                  value={shippingNote}
                  onChange={(e) => setShippingNote(e.target.value)}
                  placeholder="e.g. Dispatched via Mumbai Central Hub"
                  className="w-full text-xs p-2.5 border border-gray-300 rounded-xl focus:outline-none focus:border-[#13382B]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowShipModal(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-xs font-semibold"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirmShipment}
                disabled={!customCourier || !customAwb || updatingId === selectedOrder._id}
                className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-full text-xs font-bold transition-all shadow-sm disabled:opacity-50"
              >
                {updatingId === selectedOrder._id ? 'Updating...' : 'Mark as Shipped 🚚'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrdersPage;
