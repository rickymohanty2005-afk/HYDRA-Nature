import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Tag,
  Plus,
  Trash2,
  Power,
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Percent,
} from 'lucide-react';
import { couponService } from '../../services/couponService';

interface Coupon {
  _id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderValue?: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  maxUses: number;
  usageCount: number;
  usedCount?: number;
  isActive: boolean;
  expiresAt?: string;
  createdAt?: string;
}

const emptyForm = {
  code: '',
  discountType: 'percentage' as 'percentage' | 'fixed',
  discountValue: 10,
  minOrderValue: 0,
  maxDiscount: '',
  maxUses: 100,
  isActive: true,
  expiresAt: '',
};

const AdminCouponsPage: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await couponService.getAll();
      const list = Array.isArray(res) ? res : res?.coupons || res?.data || [];
      setCoupons(list);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanCode = form.code.trim().toUpperCase();
    if (!cleanCode) {
      toast.error('Coupon code is required');
      return;
    }

    if (form.discountValue <= 0) {
      toast.error('Discount value must be greater than 0');
      return;
    }

    // Explicit check for mandatory maxUses
    if (form.maxUses === undefined || form.maxUses === null || form.maxUses < 1 || isNaN(Number(form.maxUses))) {
      toast.error('Max Uses is a mandatory field and must be at least 1');
      return;
    }

    if (!form.expiresAt) {
      toast.error('Expiry date is mandatory');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        code: cleanCode,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        minOrderValue: Number(form.minOrderValue || 0),
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
        maxUses: Number(form.maxUses),
        expiresAt: form.expiresAt,
        isActive: form.isActive,
      };

      await couponService.create(payload);
      toast.success(`Coupon '${cleanCode}' created successfully!`);
      setShowForm(false);
      setForm(emptyForm);
      fetchCoupons();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Error creating coupon');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (coupon: Coupon) => {
    try {
      const updatedStatus = !coupon.isActive;
      await couponService.update(coupon._id, { isActive: updatedStatus });
      setCoupons(prev =>
        prev.map(c => (c._id === coupon._id ? { ...c, isActive: updatedStatus } : c))
      );
      toast.success(`Coupon '${coupon.code}' ${updatedStatus ? 'activated' : 'deactivated'}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update coupon status');
    }
  };

  const handleDelete = async (coupon: Coupon) => {
    if (!confirm(`Are you sure you want to delete coupon '${coupon.code}'?`)) return;
    try {
      await couponService.delete(coupon._id);
      toast.success(`Coupon '${coupon.code}' deleted`);
      setCoupons(prev => prev.filter(c => c._id !== coupon._id));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete coupon');
    }
  };

  // Summary statistics
  const totalCoupons = coupons.length;
  const activeCoupons = coupons.filter(c => c.isActive).length;
  const totalUsesRecorded = coupons.reduce(
    (sum, c) => sum + (c.usageCount ?? c.usedCount ?? 0),
    0
  );
  const exhaustedCoupons = coupons.filter(c => {
    const usage = c.usageCount ?? c.usedCount ?? 0;
    return c.maxUses && usage >= c.maxUses;
  }).length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-playfair font-bold text-hydra-dark flex items-center gap-2">
            <Tag className="w-6 h-6 text-hydra-gold" />
            Coupon Management
          </h1>
          <p className="text-hydra-muted text-sm mt-1">
            Create promotional discount codes and monitor real-time coupon redemptions
          </p>
        </div>
        <button
          onClick={() => {
            setForm(emptyForm);
            setShowForm(true);
          }}
          className="btn-primary flex items-center gap-2 text-sm self-start sm:self-auto shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Create Coupon
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-hydra-muted">Total Coupons</span>
            <Tag className="w-4 h-4 text-hydra-dark/40" />
          </div>
          <p className="text-2xl font-bold font-playfair text-hydra-dark mt-2">{totalCoupons}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-hydra-muted">Active Codes</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold font-playfair text-emerald-600 mt-2">{activeCoupons}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-hydra-muted">Total Redemptions</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold font-playfair text-blue-600 mt-2">{totalUsesRecorded}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-hydra-muted">Limit Reached</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold font-playfair text-amber-600 mt-2">{exhaustedCoupons}</p>
        </div>
      </div>

      {/* Create Coupon Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-fadeIn">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-hydra-cream flex items-center justify-center text-hydra-dark">
                  <Tag className="w-4 h-4" />
                </div>
                <h2 className="font-playfair font-bold text-hydra-dark text-lg">Create New Coupon</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-hydra-muted hover:text-hydra-dark transition-colors p-1 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
              {/* Code */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-hydra-dark mb-1">
                  Coupon Code <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={form.code}
                  onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm font-mono uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-hydra-dark transition"
                  placeholder="e.g. GLOW50, HYDRA20"
                />
              </div>

              {/* Discount Type & Value */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-hydra-dark mb-1">
                    Discount Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.discountType}
                    onChange={e =>
                      setForm(p => ({ ...p, discountType: e.target.value as 'percentage' | 'fixed' }))
                    }
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-hydra-dark transition"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-hydra-dark mb-1">
                    Discount Value {form.discountType === 'percentage' ? '(%)' : '(₹)'}{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="number"
                    min={1}
                    value={form.discountValue}
                    onChange={e => setForm(p => ({ ...p, discountValue: Math.max(1, +e.target.value) }))}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-hydra-dark transition"
                  />
                </div>
              </div>

              {/* Max Uses (Mandatory) & Min Order */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/80">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-amber-900">
                      Max Uses <span className="text-red-600">*</span>
                    </label>
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-200/60 text-amber-900">
                      Mandatory
                    </span>
                  </div>
                  <input
                    required
                    type="number"
                    min={1}
                    value={form.maxUses}
                    onChange={e =>
                      setForm(p => ({ ...p, maxUses: Math.max(1, parseInt(e.target.value) || 1) }))
                    }
                    className="w-full bg-white border border-amber-300 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                    placeholder="e.g. 100"
                  />
                  <p className="text-[11px] text-amber-800/80 mt-1">
                    Coupon deactivates once this usage limit is reached.
                  </p>
                </div>

                <div className="p-3 bg-gray-50/70 rounded-xl border border-gray-200/80">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-hydra-dark mb-1">
                    Min Order Value (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.minOrderValue}
                    onChange={e => setForm(p => ({ ...p, minOrderValue: Math.max(0, +e.target.value) }))}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hydra-dark transition"
                    placeholder="0 for no minimum"
                  />
                  <p className="text-[11px] text-hydra-muted mt-1">
                    Minimum subtotal required to apply.
                  </p>
                </div>
              </div>

              {/* Max Discount (Cap for Percentage) & Expiry */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-hydra-dark mb-1">
                    Max Discount Cap (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.maxDiscount}
                    onChange={e => setForm(p => ({ ...p, maxDiscount: e.target.value }))}
                    placeholder="Optional (e.g. 500)"
                    disabled={form.discountType === 'fixed'}
                    className={`w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-hydra-dark transition ${
                      form.discountType === 'fixed' ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-hydra-dark mb-1">
                    Expiry Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="date"
                    value={form.expiresAt}
                    onChange={e => setForm(p => ({ ...p, expiresAt: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-hydra-dark transition"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-3 pt-1">
                <input
                  type="checkbox"
                  id="formIsActive"
                  checked={form.isActive}
                  onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))}
                  className="w-4 h-4 accent-hydra-dark rounded cursor-pointer"
                />
                <label htmlFor="formIsActive" className="text-sm font-medium text-hydra-dark cursor-pointer">
                  Activate coupon immediately upon creation
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 btn-primary text-sm flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    'Create Coupon'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Coupons Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl border border-gray-100">
          <div className="w-8 h-8 border-4 border-hydra-dark border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm text-hydra-muted">Loading coupons...</p>
        </div>
      ) : coupons.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl border border-gray-100 text-hydra-muted text-center p-6">
          <div className="w-12 h-12 rounded-full bg-hydra-cream flex items-center justify-center text-hydra-dark mb-3">
            <Tag className="w-6 h-6" />
          </div>
          <p className="text-base font-medium text-hydra-dark mb-1">No Coupons Created Yet</p>
          <p className="text-sm text-hydra-muted mb-4 max-w-sm">
            Set up coupon codes with usage caps and minimum spend requirements to drive sales.
          </p>
          <button onClick={() => setShowForm(true)} className="btn-primary text-sm">
            Create First Coupon
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {coupons.map(coupon => {
            const usage = coupon.usageCount ?? coupon.usedCount ?? 0;
            const max = coupon.maxUses || 0;
            const percentUsed = max > 0 ? Math.min(100, Math.round((usage / max) * 100)) : 0;
            const isExhausted = max > 0 && usage >= max;
            const isExpired = coupon.expiresAt ? new Date(coupon.expiresAt) < new Date() : false;
            const remaining = Math.max(0, max - usage);
            const minOrder = coupon.minOrderValue ?? coupon.minOrderAmount ?? 0;

            return (
              <div
                key={coupon._id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between"
              >
                {/* Coupon Header Card Effect */}
                <div>
                  <div
                    className={`p-5 border-b-2 border-dashed ${
                      !coupon.isActive
                        ? 'border-gray-200 bg-gray-50/80 opacity-75'
                        : isExhausted
                        ? 'border-red-200 bg-red-50/30'
                        : isExpired
                        ? 'border-amber-200 bg-amber-50/30'
                        : 'border-hydra-dark/20 bg-hydra-cream/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-mono font-bold text-lg tracking-wider px-2.5 py-1 rounded-lg border ${
                            coupon.isActive && !isExhausted && !isExpired
                              ? 'bg-white border-hydra-dark/20 text-hydra-dark shadow-xs'
                              : 'bg-white/80 border-gray-200 text-gray-500'
                          }`}
                        >
                          {coupon.code}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        {/* Exhausted Badge */}
                        {isExhausted && (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-100 text-red-700 border border-red-200">
                            Limit Reached
                          </span>
                        )}

                        {/* Expired Badge */}
                        {isExpired && !isExhausted && (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                            Expired
                          </span>
                        )}

                        {/* Active / Inactive Badge */}
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            coupon.isActive
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {coupon.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>

                    {/* Discount Value */}
                    <div className="mt-3 flex items-baseline gap-2">
                      <p className="text-2xl font-playfair font-bold text-hydra-dark">
                        {coupon.discountType === 'percentage'
                          ? `${coupon.discountValue}% OFF`
                          : `₹${coupon.discountValue} OFF`}
                      </p>
                      {coupon.discountType === 'percentage' && coupon.maxDiscount && (
                        <span className="text-xs text-hydra-muted font-medium">
                          (Up to ₹{coupon.maxDiscount})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Body & Usage Metrics */}
                  <div className="p-5 space-y-4">
                    {/* Real-time Usage Progress Card */}
                    <div
                      className={`p-3.5 rounded-xl border transition-colors ${
                        isExhausted
                          ? 'bg-red-50/50 border-red-200'
                          : percentUsed >= 80
                          ? 'bg-amber-50/50 border-amber-200'
                          : 'bg-gray-50/80 border-gray-100'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <div className="flex items-center gap-1.5 font-semibold text-hydra-dark">
                          <Users className="w-3.5 h-3.5 text-hydra-muted" />
                          <span>Usage Redemptions</span>
                        </div>
                        <span
                          className={`font-mono font-bold text-xs ${
                            isExhausted
                              ? 'text-red-600'
                              : percentUsed >= 80
                              ? 'text-amber-700'
                              : 'text-hydra-dark'
                          }`}
                        >
                          {usage} / {max} uses
                        </span>
                      </div>

                      {/* Visual Progress Bar */}
                      <div className="w-full bg-gray-200/80 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isExhausted
                              ? 'bg-red-500'
                              : percentUsed >= 80
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${percentUsed}%` }}
                        />
                      </div>

                      {/* Remaining Redemptions Subtext */}
                      <div className="flex items-center justify-between text-[11px] mt-2">
                        <span
                          className={
                            isExhausted
                              ? 'text-red-700 font-semibold'
                              : percentUsed >= 80
                              ? 'text-amber-700 font-medium'
                              : 'text-emerald-700 font-medium'
                          }
                        >
                          {isExhausted
                            ? '🚫 No uses left'
                            : `✓ ${remaining} redemption${remaining === 1 ? '' : 's'} left`}
                        </span>
                        <span className="text-hydra-muted font-medium">{percentUsed}% claimed</span>
                      </div>
                    </div>

                    {/* Metadata: Min Order & Expiry */}
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center text-hydra-muted">
                        <span>Minimum Spend</span>
                        <span className="font-medium text-hydra-dark">
                          {minOrder > 0 ? `₹${minOrder.toLocaleString('en-IN')}` : 'No minimum'}
                        </span>
                      </div>

                      {coupon.expiresAt && (
                        <div className="flex justify-between items-center text-hydra-muted">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-hydra-muted" />
                            Expires
                          </span>
                          <span
                            className={`font-medium ${
                              isExpired ? 'text-amber-600 font-semibold' : 'text-hydra-dark'
                            }`}
                          >
                            {new Date(coupon.expiresAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="px-5 pb-5 pt-0">
                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => handleToggle(coupon)}
                      className={`flex-1 flex items-center justify-center gap-1.5 text-xs rounded-xl py-2 font-medium transition-colors border ${
                        coupon.isActive
                          ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                          : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                      {coupon.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(coupon)}
                      className="px-3 text-xs border border-red-200 text-red-500 rounded-xl py-2 font-medium hover:bg-red-50 transition-colors flex items-center justify-center gap-1"
                      title="Delete Coupon"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminCouponsPage;
