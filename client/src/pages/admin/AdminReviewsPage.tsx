import React, { useState, useEffect } from 'react';
import {
  Star,
  CheckCircle2,
  Clock,
  Trash2,
  Search,
  Filter,
  Package,
  ExternalLink,
  AlertCircle,
  ThumbsUp,
  RefreshCw,
  Camera,
  ZoomIn,
  X,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { getImageUrl } from '../../utils/imageUrl';

interface ReviewItem {
  _id: string;
  user: {
    _id: string;
    name: string;
    email?: string;
    avatar?: string;
  } | null;
  product: {
    _id: string;
    name: string;
    images?: string[];
    category?: string;
    slug?: string;
    price?: number;
  } | null;
  rating: number;
  title: string;
  comment: string;
  images?: string[];
  isApproved: boolean;
  createdAt: string;
}

interface ProductStat {
  _id: string;
  productName: string;
  productImage?: string;
  productCategory?: string;
  productSlug?: string;
  totalReviews: number;
  approvedReviews: number;
  pendingReviews: number;
  avgRating: number;
}

export const AdminReviewsPage: React.FC = () => {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [productStats, setProductStats] = useState<ProductStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const [selectedProductId, setSelectedProductId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'product-wise' | 'list'>('product-wise');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await adminService.getReviews();
      setReviews(res.data || []);
      setProductStats(res.productStats || []);
    } catch (err) {
      console.error('Error fetching admin reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleToggleApprove = async (id: string, currentStatus: boolean) => {
    try {
      setActionLoadingId(id);
      setActionMessage(null);
      const res = await adminService.approveReview(id, !currentStatus);

      setReviews((prev) =>
        prev.map((r) => (r._id === id ? { ...r, isApproved: !currentStatus } : r))
      );

      // Update product stats locally
      setProductStats((prev) =>
        prev.map((ps) => {
          const rev = reviews.find((r) => r._id === id);
          if (rev && rev.product && rev.product._id === ps._id) {
            return {
              ...ps,
              approvedReviews: !currentStatus
                ? ps.approvedReviews + 1
                : Math.max(0, ps.approvedReviews - 1),
              pendingReviews: !currentStatus
                ? Math.max(0, ps.pendingReviews - 1)
                : ps.pendingReviews + 1,
            };
          }
          return ps;
        })
      );

      setActionMessage(res.message || 'Review status updated successfully');
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to update review status');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this customer review?')) {
      return;
    }
    try {
      setActionLoadingId(id);
      setActionMessage(null);
      await adminService.deleteReview(id);

      const target = reviews.find((r) => r._id === id);

      setReviews((prev) => prev.filter((r) => r._id !== id));

      if (target && target.product) {
        setProductStats((prev) =>
          prev.map((ps) => {
            if (ps._id === target.product?._id) {
              return {
                ...ps,
                totalReviews: Math.max(0, ps.totalReviews - 1),
                approvedReviews: target.isApproved
                  ? Math.max(0, ps.approvedReviews - 1)
                  : ps.approvedReviews,
                pendingReviews: !target.isApproved
                  ? Math.max(0, ps.pendingReviews - 1)
                  : ps.pendingReviews,
              };
            }
            return ps;
          })
        );
      }

      setActionMessage('Review deleted successfully from product and system');
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to delete review');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filter reviews
  const filteredReviews = reviews.filter((r) => {
    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'approved'
        ? r.isApproved
        : !r.isApproved;

    const matchesProduct =
      selectedProductId === 'all'
        ? true
        : r.product && r.product._id === selectedProductId;

    const matchesSearch =
      searchTerm.trim() === ''
        ? true
        : (r.user?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (r.user?.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (r.product?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (r.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (r.comment || '').toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesProduct && matchesSearch;
  });

  // Calculate high-level stats
  const totalReviewsCount = reviews.length;
  const pendingCount = reviews.filter((r) => !r.isApproved).length;
  const approvedCount = reviews.filter((r) => r.isApproved).length;

  // Group filtered reviews product-wise for the product-wise view
  const productGroups = filteredReviews.reduce<Record<string, { product: any; items: ReviewItem[] }>>(
    (acc, rev) => {
      const prodId = rev.product?._id || 'unknown';
      if (!acc[prodId]) {
        acc[prodId] = {
          product: rev.product || { name: 'Unknown Formulation', _id: 'unknown' },
          items: [],
        };
      }
      acc[prodId].items.push(rev);
      return acc;
    },
    {}
  );

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#13382B]">Customer Reviews Management</h1>
          <p className="text-xs text-gray-500 mt-1">
            Moderate customer feedback product-wise. Approving a review publishes it to the storefront product page (maximum 10 reviews per product).
          </p>
        </div>
        <button
          onClick={fetchReviews}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#EDE8E1] rounded-full text-xs font-semibold text-[#13382B] hover:bg-[#FAF8F5] transition-all shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Action Notification Banner */}
      {actionMessage && (
        <div className="p-4 bg-[#EAF1EB] border border-[#B8DAC2] rounded-2xl text-xs font-medium text-[#2E6B48] flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#EDE8E1] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Total Reviews</span>
            <span className="p-2 rounded-xl bg-[#FAF8F5] text-[#13382B]">
              <Package className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-serif font-bold text-[#13382B] mt-2">{totalReviewsCount}</p>
          <p className="text-[11px] text-gray-400 mt-1">Across all skincare products</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-800">Pending Approval</span>
            <span className="p-2 rounded-xl bg-amber-100 text-amber-800">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-serif font-bold text-amber-800 mt-2">{pendingCount}</p>
          <p className="text-[11px] text-amber-700/80 mt-1">Require admin approval</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-800">Approved & Live</span>
            <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-serif font-bold text-emerald-800 mt-2">{approvedCount}</p>
          <p className="text-[11px] text-emerald-700/80 mt-1">Published on product details</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#EDE8E1] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Reviewed Formulations</span>
            <span className="p-2 rounded-xl bg-[#FAF8F5] text-[#13382B]">
              <Star className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-serif font-bold text-[#13382B] mt-2">{productStats.length}</p>
          <p className="text-[11px] text-gray-400 mt-1">Max 10 reviews per product</p>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white p-5 rounded-2xl border border-[#EDE8E1] shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search Box */}
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by customer, product, keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs focus:outline-none focus:border-[#13382B]"
            />
          </div>

          {/* Product Selector Dropdown */}
          <div className="md:col-span-4">
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EDE8E1] rounded-xl text-xs text-[#13382B] font-medium focus:outline-none focus:border-[#13382B]"
            >
              <option value="all">📦 All Formulations ({productStats.length} products)</option>
              {productStats.map((ps) => (
                <option key={ps._id} value={ps._id}>
                  {ps.productName} ({ps.totalReviews}/10 reviews — {ps.pendingReviews} pending)
                </option>
              ))}
            </select>
          </div>

          {/* Status Tabs */}
          <div className="md:col-span-4 flex items-center justify-end gap-1.5 overflow-x-auto">
            {(
              [
                { id: 'all', label: 'All', count: reviews.length },
                { id: 'pending', label: 'Pending', count: pendingCount },
                { id: 'approved', label: 'Approved', count: approvedCount },
              ] as const
            ).map((st) => (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  statusFilter === st.id
                    ? 'bg-[#13382B] text-white shadow-sm'
                    : 'bg-[#FAF8F5] text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span>{st.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    statusFilter === st.id
                      ? 'bg-white/20 text-white'
                      : st.id === 'pending' && pendingCount > 0
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {st.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-gray-500 font-medium">Display Mode:</span>
            <button
              onClick={() => setViewMode('product-wise')}
              className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors ${
                viewMode === 'product-wise'
                  ? 'bg-[#EAF1EB] text-[#13382B] border border-[#B8DAC2]'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Grouped Product-Wise
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors ${
                viewMode === 'list'
                  ? 'bg-[#EAF1EB] text-[#13382B] border border-[#B8DAC2]'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Single Card Grid
            </button>
          </div>
          <span className="text-gray-400 text-[11px]">
            Showing {filteredReviews.length} of {reviews.length} reviews
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-[#EDE8E1]">
          <div className="w-8 h-8 border-4 border-[#13382B] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs text-gray-500 font-medium">Loading customer reviews catalog...</p>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-[#EDE8E1] text-center px-4">
          <div className="w-12 h-12 rounded-full bg-[#FAF8F5] flex items-center justify-center text-gray-400 mb-3">
            <Filter className="w-6 h-6 stroke-current" />
          </div>
          <h3 className="font-serif text-base font-bold text-[#13382B]">No Customer Reviews Found</h3>
          <p className="text-xs text-gray-500 max-w-sm mt-1">
            No reviews match the selected product and status filters. Try clearing your filters or selecting "All Formulations".
          </p>
        </div>
      ) : viewMode === 'product-wise' ? (
        /* PRODUCT-WISE GROUPED VIEW */
        <div className="space-y-8">
          {Object.entries(productGroups).map(([prodId, group]) => {
            const prod = group.product;
            const items = group.items;
            const approvedInGroup = items.filter((i) => i.isApproved).length;
            const pendingInGroup = items.filter((i) => !i.isApproved).length;

            return (
              <div
                key={prodId}
                className="bg-white rounded-2xl border border-[#EDE8E1] shadow-sm overflow-hidden"
              >
                {/* Product Banner Header */}
                <div className="p-5 bg-[#FAF8F5] border-b border-[#EDE8E1] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-white border border-[#EDE8E1] p-1 flex-shrink-0 flex items-center justify-center overflow-hidden">
                      <img loading="lazy" decoding="async"
                        src={
                          prod.images?.[0]
                            ? getImageUrl(prod.images[0])
                            : 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=200&q=80'
                        }
                        alt={prod.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#3F6352] px-2 py-0.5 bg-[#EAF1EB] rounded-full">
                          {prod.category || 'Skincare'}
                        </span>
                        <h2 className="font-serif text-base font-bold text-[#13382B]">
                          {prod.name}
                        </h2>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span>
                          <strong>{items.length}</strong> / 10 Reviews
                        </span>
                        <span>•</span>
                        <span className="text-emerald-700 font-medium">
                          {approvedInGroup} Approved
                        </span>
                        {pendingInGroup > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-amber-700 font-bold">
                              {pendingInGroup} Pending Moderation
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Progress towards 10 review capacity */}
                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <div className="w-28 bg-gray-200 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          items.length >= 10
                            ? 'bg-amber-600'
                            : items.length >= 7
                            ? 'bg-emerald-600'
                            : 'bg-[#13382B]'
                        }`}
                        style={{ width: `${Math.min(100, (items.length / 10) * 100)}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-bold text-[#13382B]">
                      {items.length}/10 Max
                    </span>
                    {prod.slug && (
                      <a
                        href={`/products/${prod.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-[#13382B] transition-colors"
                        title="View product page"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Reviews in this Product */}
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {items.map((rev) => (
                    <ReviewCard
                      key={rev._id}
                      review={rev}
                      actionLoading={actionLoadingId === rev._id}
                      onToggleApprove={() => handleToggleApprove(rev._id, rev.isApproved)}
                      onDelete={() => handleDelete(rev._id)}
                      onPreviewImage={setPreviewImage}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* SINGLE GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredReviews.map((rev) => (
            <ReviewCard
              key={rev._id}
              review={rev}
              showProductHeader
              actionLoading={actionLoadingId === rev._id}
              onToggleApprove={() => handleToggleApprove(rev._id, rev.isApproved)}
              onDelete={() => handleDelete(rev._id)}
              onPreviewImage={setPreviewImage}
            />
          ))}
        </div>
      )}

      {/* Review Image Preview Lightbox */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="bg-white rounded-3xl overflow-hidden max-w-2xl w-full shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 bg-[#FAF8F5] border-b border-[#EDE8E1] flex items-center justify-between">
              <span className="text-xs font-serif font-bold text-[#13382B] flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-[#2E6B48]" /> Customer Uploaded Photo
              </span>
              <button
                onClick={() => setPreviewImage(null)}
                className="p-1.5 rounded-full text-gray-500 hover:bg-gray-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center bg-[#F7F5F0] max-h-[75vh] overflow-auto">
              <img loading="lazy" decoding="async"
                src={previewImage}
                alt="Customer photo enlarged"
                className="max-w-full max-h-[70vh] object-contain rounded-2xl shadow-sm"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface ReviewCardProps {
  review: ReviewItem;
  showProductHeader?: boolean;
  actionLoading?: boolean;
  onToggleApprove: () => void;
  onDelete: () => void;
  onPreviewImage?: (imgUrl: string) => void;
}

const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  showProductHeader = false,
  actionLoading = false,
  onToggleApprove,
  onDelete,
  onPreviewImage,
}) => {
  return (
    <div
      className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
        review.isApproved
          ? 'bg-white border-[#EDE8E1] hover:border-[#13382B]/30'
          : 'bg-amber-50/20 border-amber-200'
      }`}
    >
      <div className="space-y-3">
        {/* Optional Product Header for List View */}
        {showProductHeader && review.product && (
          <div className="flex items-center gap-2.5 pb-2.5 border-b border-gray-100">
            <Package className="w-3.5 h-3.5 text-[#3F6352]" />
            <span className="text-xs font-serif font-bold text-[#13382B] truncate">
              {review.product.name}
            </span>
          </div>
        )}

        {/* Customer & Status Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#EAF1EB] text-[#13382B] font-bold text-xs flex items-center justify-center flex-shrink-0">
              {review.user?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <p className="text-xs font-bold text-[#13382B]">{review.user?.name || 'Customer'}</p>
              <p className="text-[10px] text-gray-400">{review.user?.email || 'Authenticated user'}</p>
            </div>
          </div>

          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
              review.isApproved
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            {review.isApproved ? (
              <>
                <CheckCircle2 className="w-3 h-3" />
                <span>Approved</span>
              </>
            ) : (
              <>
                <Clock className="w-3 h-3" />
                <span>Pending</span>
              </>
            )}
          </span>
        </div>

        {/* Rating Stars */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center text-amber-400">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`w-3.5 h-3.5 ${
                  s <= review.rating ? 'fill-current' : 'text-gray-200'
                }`}
              />
            ))}
          </div>
          <span className="text-[11px] font-bold text-gray-700">({review.rating}.0)</span>
          <span className="text-[10px] text-gray-400 ml-auto">
            {new Date(review.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        </div>

        {/* Review Title & Comment */}
        <div>
          {review.title && (
            <h4 className="font-serif text-xs font-bold text-[#13382B] mb-1">
              "{review.title}"
            </h4>
          )}
          <p className="text-xs text-gray-600 leading-relaxed line-clamp-4">
            {review.comment}
          </p>
        </div>

        {/* Attached Customer Photos */}
        {review.images && review.images.length > 0 && (
          <div className="pt-2 border-t border-gray-100">
            <p className="text-[10px] font-bold text-[#3F6352] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Camera className="w-3 h-3 text-[#2E6B48]" />
              <span>Customer Photos ({review.images.length})</span>
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              {review.images.map((img, idx) => {
                const fullUrl = getImageUrl(img);
                return (
                  <div
                    key={idx}
                    onClick={() => onPreviewImage?.(fullUrl)}
                    className="w-14 h-14 rounded-xl border border-[#EDE8E1] bg-[#FAF8F5] overflow-hidden cursor-pointer hover:border-[#13382B] hover:shadow-sm transition-all relative group flex-shrink-0"
                    title="Click to view full image"
                  >
                    <img loading="lazy" decoding="async"
                      src={fullUrl}
                      alt={`Review photo ${idx + 1}`}
                      className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <ZoomIn className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons: Approve / Unapprove and Delete */}
      <div className="pt-4 mt-3 border-t border-gray-100 flex items-center justify-between gap-2">
        <button
          onClick={onToggleApprove}
          disabled={actionLoading}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50 ${
            review.isApproved
              ? 'bg-[#FAF8F5] text-amber-800 border border-amber-200 hover:bg-amber-100'
              : 'bg-[#13382B] text-white hover:bg-[#1E4D3B]'
          }`}
        >
          {review.isApproved ? (
            <>
              <Clock className="w-3.5 h-3.5" />
              <span>Unapprove</span>
            </>
          ) : (
            <>
              <ThumbsUp className="w-3.5 h-3.5" />
              <span>Approve & Publish</span>
            </>
          )}
        </button>

        <button
          onClick={onDelete}
          disabled={actionLoading}
          className="p-2 border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50"
          title="Delete review"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default AdminReviewsPage;
