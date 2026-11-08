import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Star,
  Heart,
  ShoppingBag,
  Plus,
  Minus,
  CheckCircle2,
  Truck,
  RotateCcw,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowRight,
  Trash2,
  Clock,
} from 'lucide-react';
import { productService } from '../services/productService';
import { reviewService } from '../services/reviewService';
import { ProductCard } from '../components/common/ProductCard';
import { useAppDispatch, useAppSelector } from '../store';
import { addToCart, toggleCartDrawer } from '../store/cartSlice';
import { toggleWishlistItem } from '../store/wishlistSlice';
import { Product, Review } from '../types';
import { getImageUrl } from '../utils/imageUrl';

const FALLBACK_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80';

export const ProductDetailsPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const wishlistItems = useAppSelector((state) => state.wishlist.items);

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeImage, setActiveImage] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);

  // Accordion state
  const [openSection, setOpenSection] = useState<'ingredients' | 'benefits' | 'howTo' | 'specs'>(
    'ingredients'
  );

  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMessage, setReviewMessage] = useState('');
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);

  const isInWishlist = product ? wishlistItems.some((i) => i._id === product._id) : false;

  useEffect(() => {
    const loadProductData = async () => {
      if (!slug) return;
      setLoading(true);
      try {
        const data = await productService.getByIdOrSlug(slug);
        if (data && data.product) {
          setProduct(data.product);
          setRelatedProducts(data.relatedProducts || []);
          const firstImg =
            data.product.images && data.product.images.length > 0
              ? data.product.images[0]
              : FALLBACK_PRODUCT_IMAGE;
          setActiveImage(firstImg);

          // Fetch reviews
          try {
            const revs = await reviewService.getByProduct(data.product._id);
            setReviews(revs || []);
          } catch {
            setReviews([]);
          }
        }
      } catch (err) {
        console.error('Error fetching product details:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProductData();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 animate-pulse space-y-8">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="h-96 bg-gray-200 rounded-3xl" />
          <div className="space-y-4">
            <div className="h-10 bg-gray-200 rounded w-3/4" />
            <div className="h-6 bg-gray-200 rounded w-1/2" />
            <div className="h-24 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-md mx-auto text-center py-24 px-4">
        <h2 className="font-serif text-2xl font-bold text-[#13382B]">Formulation Not Found</h2>
        <p className="text-xs text-gray-500 mt-2">
          The formulation you are looking for is unavailable, draft, or discontinued.
        </p>
        <Link
          to="/shop"
          className="mt-6 inline-block px-6 py-2.5 bg-[#13382B] text-white rounded-full text-xs font-semibold shadow hover:bg-[#1E4D3B]"
        >
          Return to Shop
        </Link>
      </div>
    );
  }

  const primaryImage = activeImage || (product.images?.[0] ?? FALLBACK_PRODUCT_IMAGE);
  const productImages = product.images?.length > 0 ? product.images : [FALLBACK_PRODUCT_IMAGE];
  const safeIngredients = product.ingredients || [];
  const safeBenefits = product.keyBenefits || [];
  const safeHowToUse = product.howToUse || [];
  const safeSkinType = product.skinType || ['All Skin Types'];

  const handleAddToCart = () => {
    dispatch(
      addToCart({
        productId: product._id,
        product,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice || product.price,
        image: primaryImage,
        size: product.size || '50ml',
        quantity,
      })
    );
    dispatch(toggleCartDrawer(true));
  };

  const handleBuyNow = () => {
    dispatch(
      addToCart({
        productId: product._id,
        product,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice || product.price,
        image: primaryImage,
        size: product.size || '50ml',
        quantity,
      })
    );
    navigate('/checkout');
  };

  const userExistingReview = user
    ? reviews.find(
        (r) =>
          r.user?._id === user._id ||
          (user.email && (r.user as any)?.email === user.email)
      )
    : null;

  const handleOpenReviewForm = () => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    if (userExistingReview) {
      setReviewRating(userExistingReview.rating || 5);
      setReviewTitle(userExistingReview.title || '');
      setReviewComment(userExistingReview.comment || '');
    }
    setShowReviewForm(!showReviewForm);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    setReviewSubmitting(true);
    setReviewMessage('');

    try {
      const res = await reviewService.create(product._id, {
        rating: reviewRating,
        title: reviewTitle,
        comment: reviewComment,
      });

      setReviewMessage(
        res.message ||
          'Thank you for sharing your experience! Your review has been submitted and is pending administrator approval before appearing publicly.'
      );
      setReviewTitle('');
      setReviewComment('');
      setShowReviewForm(false);

      // Refresh reviews
      const updatedRevs = await reviewService.getByProduct(product._id);
      setReviews(updatedRevs || []);
    } catch (err: any) {
      setReviewMessage(err.message || 'Failed to submit review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      setDeletingReviewId(reviewId);
      await reviewService.delete(reviewId);
      setReviews((prev) => prev.filter((r) => r._id !== reviewId));
      if (product) {
        setProduct({
          ...product,
          reviewCount: Math.max(0, (product.reviewCount || 1) - 1),
        });
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete review');
    } finally {
      setDeletingReviewId(null);
    }
  };

  return (
    <div className="w-full bg-[#FAF8F5] pb-24">
      {/* Breadcrumbs */}
      <div className="border-b border-[#EDE8E1] bg-white py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-xs text-gray-500 flex items-center gap-2">
          <Link to="/" className="hover:text-[#13382B]">Home</Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-[#13382B]">Shop</Link>
          <span>/</span>
          <Link to={`/shop?category=${encodeURIComponent(product.category)}`} className="hover:text-[#13382B]">
            {product.category}
          </Link>
          <span>/</span>
          <span className="text-[#13382B] font-medium truncate">{product.name}</span>
        </div>
      </div>

      {/* Main Details Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left: Product Images Gallery */}
          <div className="lg:col-span-6 space-y-4">
            {/* Main Stage */}
            <div className="relative aspect-square w-full rounded-3xl bg-white border border-[#EDE8E1] p-8 flex items-center justify-center shadow-sm overflow-hidden">
              <img
                src={getImageUrl(primaryImage) || FALLBACK_PRODUCT_IMAGE}
                alt={product.name}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = FALLBACK_PRODUCT_IMAGE;
                }}
                className="w-full h-full object-contain max-h-[460px] drop-shadow-xl transition-all duration-300"
              />

              {product.tag && (
                <span className="absolute top-6 left-6 text-xs font-semibold tracking-wide px-3 py-1 bg-[#13382B] text-white rounded-full shadow-sm">
                  {product.tag}
                </span>
              )}

              <button
                onClick={() => dispatch(toggleWishlistItem(product))}
                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-gray-600 hover:text-red-600 transition-colors"
                aria-label="Wishlist"
              >
                <Heart
                  className={`w-5 h-5 ${
                    isInWishlist ? 'fill-red-600 text-red-600' : 'stroke-current'
                  }`}
                />
              </button>
            </div>

            {/* Thumbnail Row */}
            {productImages.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {productImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(img)}
                    className={`w-20 h-20 rounded-2xl bg-white p-2 border-2 transition-all flex-shrink-0 ${
                      activeImage === img ? 'border-[#13382B] shadow-sm' : 'border-[#EDE8E1] opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={getImageUrl(img) || FALLBACK_PRODUCT_IMAGE}
                      alt=""
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = FALLBACK_PRODUCT_IMAGE;
                      }}
                      className="w-full h-full object-contain"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Product Buy Info */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#3F6352]">
                {product.category} {product.subcategory ? `• ${product.subcategory}` : ''}
              </p>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#13382B] mt-1">
                {product.name}
              </h1>
              {product.subtitle && (
                <p className="text-sm text-gray-500 mt-1 font-serif italic">{product.subtitle}</p>
              )}

              {/* Rating & Review Count */}
              <div className="flex items-center gap-3 mt-3">
                <div className="flex items-center text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(product.rating || 5) ? 'fill-current' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs font-bold text-gray-800">{product.rating || '5.0'}</span>
                <span className="text-xs text-gray-400">•</span>
                <a href="#reviews-section" className="text-xs text-[#2E6B48] font-medium hover:underline">
                  {reviews.length || product.reviewCount || 0} Reviews
                </a>
              </div>
            </div>

            {/* Price & Stock Badge */}
            <div className="flex items-baseline gap-4 py-3 border-y border-[#EDE8E1]">
              <span className="font-serif text-3xl font-bold text-[#13382B]">
                ₹{product.price.toLocaleString('en-IN')}
              </span>
              {product.originalPrice > product.price && (
                <>
                  <span className="text-base text-gray-400 line-through">
                    ₹{product.originalPrice.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs font-bold bg-[#EAF1EB] text-[#2E6B48] px-2.5 py-1 rounded-full">
                    Save {product.discountPercentage || Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                  </span>
                </>
              )}

              <div className="ml-auto text-xs font-semibold">
                {product.stock > 10 ? (
                  <span className="text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> In Stock ({product.stock})
                  </span>
                ) : product.stock > 0 ? (
                  <span className="text-amber-700 font-bold">Only {product.stock} left in stock!</span>
                ) : (
                  <span className="text-red-600 font-bold">Temporarily Sold Out</span>
                )}
              </div>
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed whitespace-pre-line">
              {product.description}
            </p>

            {/* Size & Skin Type Pill Badges */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="text-gray-500 font-medium">Volume:</span>
              <span className="px-3 py-1 bg-white border border-[#EDE8E1] rounded-lg font-bold text-[#13382B]">
                {product.size || '50ml'}
              </span>

              <span className="text-gray-500 font-medium ml-2">Suitable for:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {safeSkinType.map((st) => (
                  <span
                    key={st}
                    className="px-2.5 py-0.5 bg-[#FAF8F5] border border-[#EDE8E1] rounded-full text-[11px] text-[#3F6352]"
                  >
                    {st}
                  </span>
                ))}
              </div>
            </div>

            {/* Quantity Selector & Action Buttons */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-4">
                <span className="text-xs font-semibold text-gray-700">Quantity</span>
                <div className="flex items-center border border-[#EDE8E1] rounded-xl bg-white shadow-sm">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="p-2.5 text-gray-600 hover:text-black disabled:opacity-30"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-4 text-xs font-bold text-gray-900">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    disabled={quantity >= product.stock}
                    className="p-2.5 text-gray-600 hover:text-black disabled:opacity-30"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock <= 0}
                  className="w-full py-3.5 bg-[#13382B] text-white rounded-full text-xs font-bold tracking-wider hover:bg-[#1E4D3B] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#13382B]/10 disabled:opacity-50"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>ADD TO BAG</span>
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={product.stock <= 0}
                  className="w-full py-3.5 bg-[#C5A880] text-[#13382B] rounded-full text-xs font-bold tracking-wider hover:bg-[#B7996F] transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                >
                  <span>BUY NOW</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Trust Assurances */}
            <div className="grid grid-cols-3 gap-2 pt-4 border-t border-[#EDE8E1] text-center">
              <div className="p-2.5 bg-white rounded-xl border border-[#EDE8E1]">
                <Truck className="w-4 h-4 mx-auto text-[#13382B] mb-1" />
                <p className="text-[10px] font-semibold text-gray-800">Free Express Delivery</p>
                
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-[#EDE8E1]">
                <RotateCcw className="w-4 h-4 mx-auto text-[#13382B] mb-1" />
                <p className="text-[10px] font-semibold text-gray-800">14-Day Returns</p>
               
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-[#EDE8E1]">
                <ShieldCheck className="w-4 h-4 mx-auto text-[#13382B] mb-1" />
                <p className="text-[10px] font-semibold text-gray-800">100% Authentic</p>
           
              </div>
            </div>

            {/* Accordion Tabs */}
            <div className="space-y-3 pt-4">
              {/* Tab 1: Key Ingredients */}
              <div className="border border-[#EDE8E1] bg-white rounded-2xl overflow-hidden shadow-sm">
                <button
                  onClick={() => setOpenSection(openSection === 'ingredients' ? ('' as any) : 'ingredients')}
                  className="w-full px-5 py-4 flex items-center justify-between text-left"
                >
                  <span className="font-serif text-sm font-bold text-[#13382B]">
                    Key Botanical Ingredients
                  </span>
                  {openSection === 'ingredients' ? (
                    <ChevronUp className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  )}
                </button>
                {openSection === 'ingredients' && (
                  <div className="px-5 pb-5 text-xs text-gray-600 border-t border-gray-100 pt-3">
                    <ul className="space-y-1.5 list-disc list-inside">
                      {safeIngredients.length > 0 ? (
                        safeIngredients.map((ing, i) => <li key={i}>{ing}</li>)
                      ) : (
                        <li>Natural botanical squalane, hyaluronic acid, cold-pressed plant extracts.</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>

              {/* Tab 2: Clinical Benefits */}
              <div className="border border-[#EDE8E1] bg-white rounded-2xl overflow-hidden shadow-sm">
                <button
                  onClick={() => setOpenSection(openSection === 'benefits' ? ('' as any) : 'benefits')}
                  className="w-full px-5 py-4 flex items-center justify-between text-left"
                >
                  <span className="font-serif text-sm font-bold text-[#13382B]">
                    Clinical & Skin Benefits
                  </span>
                  {openSection === 'benefits' ? (
                    <ChevronUp className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  )}
                </button>
                {openSection === 'benefits' && (
                  <div className="px-5 pb-5 text-xs text-gray-600 border-t border-gray-100 pt-3">
                    <ul className="space-y-1.5 list-disc list-inside">
                      {safeBenefits.length > 0 ? (
                        safeBenefits.map((ben, i) => <li key={i}>{ben}</li>)
                      ) : (
                        <li>Deeply hydrates, locks moisture for up to 72 hours, and restores youthful radiance.</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>

              {/* Tab 3: How to Use */}
              <div className="border border-[#EDE8E1] bg-white rounded-2xl overflow-hidden shadow-sm">
                <button
                  onClick={() => setOpenSection(openSection === 'howTo' ? ('' as any) : 'howTo')}
                  className="w-full px-5 py-4 flex items-center justify-between text-left"
                >
                  <span className="font-serif text-sm font-bold text-[#13382B]">
                    How to Apply (Routine Ritual)
                  </span>
                  {openSection === 'howTo' ? (
                    <ChevronUp className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  )}
                </button>
                {openSection === 'howTo' && (
                  <div className="px-5 pb-5 text-xs text-gray-600 border-t border-gray-100 pt-3 space-y-2">
                    {safeHowToUse.length > 0 ? (
                      safeHowToUse.map((step, idx) => (
                        <div key={idx} className="flex gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-[#EAF1EB] text-[#2E6B48] flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                            {idx + 1}
                          </span>
                          <p>{step}</p>
                        </div>
                      ))
                    ) : (
                      <p>Warm 2-3 drops between clean palms and press gently into face and neck daily.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Customer Reviews Section */}
        <section id="reviews-section" className="mt-20 pt-12 border-t border-[#EDE8E1]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#13382B]">
                Customer Reviews
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Verified feedback from authenticated Hydra skincare patrons.
              </p>
            </div>
            <button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="px-5 py-2.5 bg-[#13382B] text-white rounded-full text-xs font-semibold hover:bg-[#1E4D3B] transition-colors"
            >
              {showReviewForm ? 'Close Form' : 'Write a Review'}
            </button>
          </div>

          {/* Review Submission Form Drawer */}
          {showReviewForm && (
            <div className="bg-white rounded-2xl p-6 border border-[#EDE8E1] shadow-md mb-8 max-w-2xl">
              <h3 className="font-serif text-lg font-bold text-[#13382B] mb-4">
                Share Your Skincare Experience
              </h3>
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Your Rating (1 to 5 Stars)
                  </label>
                  <div className="flex items-center gap-1.5 text-amber-500">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setReviewRating(star)}
                        className="p-1"
                      >
                        <Star
                          className={`w-5 h-5 ${
                            star <= reviewRating ? 'fill-current' : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Review Headline
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Incredible glow and lightweight texture!"
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs border border-[#EDE8E1] rounded-xl focus:outline-none focus:border-[#13382B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Detailed Review
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Describe how your skin felt, absorption rate, visible radiance changes..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs border border-[#EDE8E1] rounded-xl focus:outline-none focus:border-[#13382B]"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowReviewForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-full text-xs font-semibold text-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reviewSubmitting}
                    className="px-6 py-2 bg-[#13382B] text-white rounded-full text-xs font-semibold hover:bg-[#1E4D3B] disabled:opacity-50"
                  >
                    {reviewSubmitting ? 'Submitting...' : 'Post Review'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {reviewMessage && (
            <div className="p-4 mb-6 bg-[#EAF1EB] text-[#2E6B48] rounded-xl text-xs font-medium">
              {reviewMessage}
            </div>
          )}

          {/* Reviews List */}
          {reviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reviews.map((rev) => (
                <div
                  key={rev._id}
                  className="bg-white p-5 rounded-2xl border border-[#EDE8E1] shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#EAF1EB] text-[#13382B] font-bold text-xs flex items-center justify-center">
                        {rev.user?.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#1A211D]">{rev.user?.name || 'Hydra Customer'}</p>
                        <span className="text-[10px] text-emerald-700 font-medium">Verified Buyer</span>
                      </div>
                    </div>
                    <div className="flex items-center text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < rev.rating ? 'fill-current' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <h4 className="font-serif text-sm font-semibold text-[#1A211D]">{rev.title}</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">{rev.comment}</p>
                  <p className="text-[10px] text-gray-400">
                    {new Date(rev.createdAt).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-white rounded-2xl border border-[#EDE8E1]">
              <p className="text-xs text-gray-500">
                Be the first to review {product.name}!
              </p>
            </div>
          )}
        </section>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-20 pt-12 border-t border-[#EDE8E1]">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#13382B] mb-8 text-center sm:text-left">
              You May Also Love
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((rel) => (
                <ProductCard key={rel._id} product={rel} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
