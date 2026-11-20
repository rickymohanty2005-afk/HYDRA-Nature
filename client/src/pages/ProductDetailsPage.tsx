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
  ZoomIn,
  X,
  Camera,
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

// 2.jpeg is an exact duplicate of 1.jpeg, so it is skipped
const TRUSTED_LOGOS = [1, 3, 4, 5, 6, 7, 8, 9].map((n) => `/images/trustedlogo/${n}.jpeg`);

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
  const [reviewImages, setReviewImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMessage, setReviewMessage] = useState('');
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);
  const [selectedClinicalImage, setSelectedClinicalImage] = useState<{
    src: string;
    title: string;
    desc: string;
  } | null>(null);

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
      setExistingImages(userExistingReview.images || []);
      setReviewImages([]);
      setImagePreviews([]);
    } else {
      setReviewRating(5);
      setReviewTitle('');
      setReviewComment('');
      setExistingImages([]);
      setReviewImages([]);
      setImagePreviews([]);
    }
    setShowReviewForm(!showReviewForm);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    const availableSlots = 5 - (existingImages.length + reviewImages.length);
    if (availableSlots <= 0) {
      alert('You can attach a maximum of 5 photos per review.');
      return;
    }

    const validFiles: File[] = [];
    const newPreviews: string[] = [];

    for (const file of files.slice(0, availableSlots)) {
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} is not a valid image file.`);
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name} exceeds the 10MB limit.`);
        continue;
      }
      validFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    }

    setReviewImages((prev) => [...prev, ...validFiles]);
    setImagePreviews((prev) => [...prev, ...newPreviews]);
  };

  const handleRemoveNewImage = (index: number) => {
    setReviewImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleRemoveExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    if (!product) return;

    setReviewSubmitting(true);
    setReviewMessage('');

    try {
      const formData = new FormData();
      formData.append('rating', String(reviewRating));
      formData.append('title', reviewTitle);
      formData.append('comment', reviewComment);

      if (existingImages.length > 0) {
        formData.append('images', JSON.stringify(existingImages));
      }

      reviewImages.forEach((file) => {
        formData.append('images', file);
      });

      const res = await reviewService.create(product._id, formData);

      setReviewMessage(
        res.message ||
          'Thank you for sharing your experience! Your review has been submitted and is pending administrator approval before appearing publicly.'
      );
      setReviewTitle('');
      setReviewComment('');
      setReviewImages([]);
      setImagePreviews([]);
      setExistingImages([]);
      setShowReviewForm(false);

      // Refresh reviews
      const updatedRevs = await reviewService.getByProduct(product._id);
      setReviews(updatedRevs || []);
    } catch (err: any) {
      setReviewMessage(err.response?.data?.message || err.message || 'Failed to submit review');
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
                    <img loading="lazy" decoding="async"
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

            {/* Tested & Trusted Logo Carousel / Strip */}
            <div className="pt-4 border-t border-[#EDE8E1]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#13382B] flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#2E6B48]" />
                  Tested & Trusted Standards
                </span>
           
              </div>
              <div className="bg-[#FAF8F5] border border-[#EDE8E1] rounded-2xl p-2.5 shadow-sm">
                <div
                  className="marquee-pause relative overflow-hidden py-1"
                  style={{
                    maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
                    WebkitMaskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
                  }}
                >
                  <div className="animate-marquee-ltr flex w-max items-center">
                    {[...TRUSTED_LOGOS, ...TRUSTED_LOGOS].map((src, i) => (
                      <img
                        key={i}
                        src={src}
                        alt={i < TRUSTED_LOGOS.length ? 'Trusted certification seal' : ''}
                        aria-hidden={i >= TRUSTED_LOGOS.length}
                        loading="lazy"
                        draggable={false}
                        className="mx-2 sm:mx-2.5 h-11 w-11 sm:h-12 sm:w-12 shrink-0 rounded-full object-cover ring-1 ring-[#EDE8E1] shadow-sm transition-transform duration-300 hover:scale-110"
                      />
                    ))}
                  </div>
                </div>
           
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
              onClick={handleOpenReviewForm}
              className="px-5 py-2.5 bg-[#13382B] text-white rounded-full text-xs font-semibold hover:bg-[#1E4D3B] transition-colors shadow-sm flex items-center gap-2"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>
                {showReviewForm
                  ? 'Close Form'
                  : userExistingReview
                  ? 'Edit Your Review'
                  : 'Write a Review & Add Photos'}
              </span>
            </button>
          </div>

          {/* Review Submission Form Drawer */}
          {showReviewForm && (
            <div className="bg-white rounded-2xl p-6 border border-[#EDE8E1] shadow-md mb-8 max-w-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-lg font-bold text-[#13382B]">
                  {userExistingReview ? 'Update Your Skincare Review' : 'Share Your Skincare Experience'}
                </h3>
                <span className="text-[11px] text-gray-500 font-medium">Verified Patrons</span>
              </div>
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

                {/* Upload Photos Section */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-gray-700">
                      Upload Photos (Optional — Up to 5 images)
                    </label>
                    <span className="text-[10px] text-gray-400 font-medium">
                      {existingImages.length + reviewImages.length} / 5 photos
                    </span>
                  </div>

                  {/* Previews of existing and newly selected photos */}
                  {(existingImages.length > 0 || imagePreviews.length > 0) && (
                    <div className="flex flex-wrap gap-2.5 mb-3">
                      {/* Existing images */}
                      {existingImages.map((img, idx) => (
                        <div
                          key={`existing-${idx}`}
                          className="relative w-16 h-16 rounded-xl border border-[#EDE8E1] bg-[#FAF8F5] overflow-hidden group shadow-xs"
                        >
                          <img loading="lazy" decoding="async"
                            src={getImageUrl(img)}
                            alt="Existing attachment"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveExistingImage(idx)}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600/90 text-white flex items-center justify-center hover:bg-red-700 transition-colors shadow-sm"
                            title="Remove photo"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}

                      {/* New local preview images */}
                      {imagePreviews.map((url, idx) => (
                        <div
                          key={`new-${idx}`}
                          className="relative w-16 h-16 rounded-xl border border-[#2E6B48]/50 bg-[#EAF1EB] overflow-hidden group shadow-xs"
                        >
                          <img loading="lazy" decoding="async"
                            src={url}
                            alt="New review upload preview"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveNewImage(idx)}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600/90 text-white flex items-center justify-center hover:bg-red-700 transition-colors shadow-sm"
                            title="Remove photo"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Dropzone / Upload button if under limit */}
                  {existingImages.length + reviewImages.length < 5 && (
                    <label className="border-2 border-dashed border-[#EDE8E1] hover:border-[#13382B]/40 rounded-xl p-3.5 flex items-center justify-center gap-2.5 cursor-pointer bg-[#FAF8F5] hover:bg-[#F5F2EB] transition-colors">
                      <Camera className="w-4 h-4 text-[#2E6B48]" />
                      <span className="text-xs font-medium text-[#13382B]">
                        Click to add photos of your skin / product results
                      </span>
                      <span className="text-[10px] text-gray-400">(JPEG, PNG, WEBP max 10MB)</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageChange}
                      />
                    </label>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowReviewForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-full text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reviewSubmitting}
                    className="px-6 py-2 bg-[#13382B] text-white rounded-full text-xs font-semibold hover:bg-[#1E4D3B] disabled:opacity-50 flex items-center gap-2"
                  >
                    {reviewSubmitting ? (
                      <>
                        <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <span>{userExistingReview ? 'Update Review' : 'Post Review'}</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {reviewMessage && (
            <div className="p-4 mb-6 bg-[#EAF1EB] text-[#2E6B48] rounded-xl text-xs font-medium border border-[#C5DBCB]">
              {reviewMessage}
            </div>
          )}

          {/* Reviews List */}
          {reviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reviews.map((rev) => (
                <div
                  key={rev._id}
                  className="bg-white p-5 rounded-2xl border border-[#EDE8E1] shadow-sm space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#EAF1EB] text-[#13382B] font-bold text-xs flex items-center justify-center">
                          {rev.user?.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-xs font-bold text-[#1A211D]">
                              {rev.user?.name || 'Hydra Customer'}
                            </p>
                            {user && (rev.user?._id === user._id || (rev.user as any)?.email === user.email) && (
                              <span className="text-[9px] bg-[#13382B] text-white px-1.5 py-0.5 rounded-full font-semibold">
                                You
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-emerald-700 font-medium">Verified Buyer</span>
                            {!rev.isApproved && (
                              <span className="text-[9px] text-amber-800 bg-amber-100 font-bold px-1.5 py-0.5 rounded-full">
                                Pending Approval
                              </span>
                            )}
                          </div>
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

                    {/* Customer Review Photos */}
                    {rev.images && rev.images.length > 0 && (
                      <div className="pt-2 border-t border-gray-100/80">
                        <p className="text-[10px] font-bold text-[#3F6352] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Camera className="w-3 h-3 text-[#2E6B48]" />
                          <span>Customer Photos ({rev.images.length})</span>
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          {rev.images.map((img, idx) => {
                            const fullUrl = getImageUrl(img);
                            return (
                              <div
                                key={idx}
                                onClick={() => setSelectedClinicalImage({
                                  src: fullUrl,
                                  title: `Customer Photo — ${rev.title}`,
                                  desc: `Uploaded by ${rev.user?.name || 'Hydra Customer'}`
                                })}
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

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-[10px] text-gray-400">
                    <span>
                      {new Date(rev.createdAt).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    {user && (rev.user?._id === user._id || (rev.user as any)?.email === user.email) && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setReviewRating(rev.rating || 5);
                            setReviewTitle(rev.title || '');
                            setReviewComment(rev.comment || '');
                            setExistingImages(rev.images || []);
                            setReviewImages([]);
                            setImagePreviews([]);
                            setShowReviewForm(true);
                          }}
                          className="text-[#2E6B48] hover:underline font-semibold"
                        >
                          Edit
                        </button>
                        <span>•</span>
                        <button
                          type="button"
                          disabled={deletingReviewId === rev._id}
                          onClick={() => handleDeleteReview(rev._id)}
                          className="text-red-500 hover:underline font-semibold flex items-center gap-0.5"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
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

        {/* Clinically Tested Section */}
        <section id="clinically-tested-section" className="mt-20 pt-14 border-t border-[#EDE8E1]">
          {/* Header & Badges */}
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EAF1EB] text-[#2E6B48] text-xs font-bold tracking-wider uppercase mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Clinically Tested & Dermatologist Supervised
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-[#13382B]">
              Clinically Tested & Certified Safe
            </h2>
           

            {/* Clinical Highlights Strip */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 mt-5">
              <span className="px-3.5 py-1.5 rounded-full bg-[#EAF1EB] text-[#2E6B48] text-xs font-semibold flex items-center gap-1.5 border border-[#C5DBCB]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#2E6B48]" /> Steroid-free
              </span>
              <span className="px-3.5 py-1.5 rounded-full bg-[#EAF1EB] text-[#2E6B48] text-xs font-semibold flex items-center gap-1.5 border border-[#C5DBCB]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#2E6B48]" /> 4 heavy metals not detected
              </span>
              <span className="px-3.5 py-1.5 rounded-full bg-[#FAF8F5] text-[#13382B] text-xs font-semibold flex items-center gap-1.5 border border-[#EDE8E1]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#2E6B48]" /> Dermatologically tested
              </span>
              <span className="px-3.5 py-1.5 rounded-full bg-[#EAF1EB] text-[#2E6B48] text-xs font-semibold flex items-center gap-1.5 border border-[#C5DBCB]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#2E6B48]" /> Non-irritant to varied skin
              </span>
            </div>
          </div>

          {/* 1. First Section: ad.webp Clinical Showcase Banner */}
          <div className="mb-10 rounded-3xl overflow-hidden border border-[#EDE8E1] bg-white shadow-sm hover:shadow-md transition-all group">
            <div
              className="relative cursor-pointer overflow-hidden bg-[#FAF8F5]"
              onClick={() => setSelectedClinicalImage({
                src: '/images/home/ad.webp',
                title: 'Hydra Clinical Formulation Showcase',
                desc: 'Independent laboratory screened & certified skincare formulation.'
              })}
            >
              <img loading="lazy" decoding="async"
                src="/images/home/ad.webp"
                alt="Hydra Skincare Clinical Campaign"
                className="w-full h-auto object-cover max-h-[500px] transition-transform duration-500 group-hover:scale-[1.01]"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
              
              </div>
            </div>
            <div className="p-4 sm:p-5 bg-gradient-to-r from-[#FAF8F5] via-white to-[#FAF8F5] border-t border-[#EDE8E1] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#2E6B48]"></span>
                <span className="font-semibold text-[#13382B]">100% Clean Formulation</span>
                <span className="text-gray-400">•</span>
                <span>Clinically Validated on Varied Skin Types</span>
              </div>
              <span className="text-[11px] text-[#2E6B48] font-semibold bg-[#EAF1EB] px-3 py-1 rounded-full">
                Laboratory Certified
              </span>
            </div>
          </div>

          {/* 2 & 3. Second and Third Sections: Lab Reports & Irritation / Safety Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            {/* Second Section: Verified Lab Reports */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#EDE8E1] shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#EDE8E1]">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#2E6B48]">
                      Independent Laboratories
                    </span>
                    <h3 className="font-serif text-lg sm:text-xl font-bold text-[#13382B]">
                      Verified Lab Reports
                    </h3>
                  </div>
                  <span className="text-xs bg-[#EAF1EB] text-[#2E6B48] font-bold px-3 py-1 rounded-full border border-[#C5DBCB]">
                    4 Verified Reports
                  </span>
                </div>

                <p className="text-xs text-gray-600 leading-relaxed mb-4">
                  Multi-facility testing across NABL-accredited and ISO-certified research centers ensuring 
                  complete absence of steroids and heavy metals, plus in-vivo patch evaluation.
                </p>

                <div
                  className="relative rounded-2xl overflow-hidden border border-[#EDE8E1] bg-[#FAF8F5] cursor-pointer group mb-4"
                  onClick={() => setSelectedClinicalImage({
                    src: '/images/home/clinical-reports.jpg',
                    title: 'Verified Independent Lab Reports',
                    desc: 'Official test reports from Mascot Spincontrol, FARE Labs, and Wave Analytical Labs.'
                  })}
                >
                  <img loading="lazy" decoding="async"
                    src="/images/home/clinical-reports.jpg"
                    alt="Verified Lab Reports - Mascot Spincontrol, FARE Labs, Wave Analytical Labs"
                    className="w-full h-auto object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="px-3.5 py-1.5 bg-white/95 backdrop-blur-sm text-[#13382B] text-xs font-bold rounded-full shadow flex items-center gap-1.5">
                      <ZoomIn className="w-3.5 h-3.5 text-[#2E6B48]" /> Click to Inspect Certificates
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-700">
                  <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EDE8E1]">
                    <p className="font-bold text-[#13382B]">Mascot Spincontrol</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">ISO 9001 In-Vivo Clinical Patch Testing</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EDE8E1]">
                    <p className="font-bold text-[#13382B]">FARE Labs (NABL)</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">Accredited TC-5503 Heavy Metal Detection</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Third Section: Irritation Score & Safety Profile */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#EDE8E1] shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#EDE8E1]">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#2E6B48]">
                      IS 4011:2018 Protocol
                    </span>
                    <h3 className="font-serif text-lg sm:text-xl font-bold text-[#13382B]">
                      Dermatologically tested on real skin
                    </h3>
                  </div>
                  <span className="text-xs bg-[#2E6B48] text-white font-bold px-3 py-1 rounded-full shadow-sm whitespace-nowrap">
                    Non-Irritant
                  </span>
                </div>

                {/* Irritation score */}
                <div className="flex items-center gap-4 sm:gap-5 p-4 rounded-2xl bg-[#FAF8F5] border border-[#EDE8E1] mb-4">
                  <div className="shrink-0 text-center">
                    <div className="font-serif font-bold text-[#13382B] leading-none">
                      <span className="text-4xl sm:text-5xl">0.3</span>
                      <span className="text-lg sm:text-xl text-gray-400"> / 4</span>
                    </div>
                    <div className="mt-2 h-1.5 w-24 rounded-full bg-[#EDE8E1] overflow-hidden">
                      <div className="h-full rounded-full bg-[#2E6B48]" style={{ width: '7.5%' }} />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-[#13382B] mb-1">
                      Mean irritation score — rated Non-Irritant
                    </p>
                    <p className="text-[11px] sm:text-xs text-gray-600 leading-relaxed">
                      Scored 0.3 out of 4 in a dermatologist-supervised patch test — well within the gentle range.
                      The lower the score, the gentler on skin.
                    </p>
                  </div>
                </div>

                <ul className="space-y-2 mb-5">
                  {[
                    <>
                      <strong className="text-[#13382B]">24 human volunteers</strong> (12 male + 12 female), aged 18–56, all skin types.
                    </>,
                    <>
                      <strong className="text-[#13382B]">Dermatologist-supervised</strong>, Ethics Committee-approved protocol (IS 4011:2018).
                    </>,
                    <>
                      <strong className="text-[#13382B]">Clinically & dermatologically tested</strong> — Non-Irritant to varied skin.
                    </>,
                  ].map((line, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-gray-600 leading-relaxed">
                      <CheckCircle2 className="w-4 h-4 text-[#2E6B48] shrink-0 mt-px" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>

                {/* Safety */}
                <div className="pt-4 border-t border-[#EDE8E1] mb-4">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#13382B] flex items-center gap-1.5 mb-3">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#2E6B48]" />
                    Safety — zero harmful substances
                  </h4>
                  <ul className="space-y-2">
                    {[
                      ['Steroid-free.', 'Steroids tested — absent (Wave Analytical Labs).'],
                      ['Heavy metals not detected.', 'Confirmed by two independent labs.'],
                      ['Clean formula.', 'No hormones, no toxins, no shortcuts.'],
                    ].map(([title, text]) => (
                      <li key={title} className="flex items-start gap-2 text-xs text-gray-600 leading-relaxed">
                        <CheckCircle2 className="w-4 h-4 text-[#2E6B48] shrink-0 mt-px" />
                        <span>
                          <strong className="text-[#13382B]">{title}</strong> {text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Heavy metals */}
                <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">
                  Heavy metals
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[11px]">
                  {['Lead', 'Mercury', 'Cadmium', 'Arsenic'].map((metal) => (
                    <div key={metal} className="p-2 rounded-xl bg-emerald-50/80 border border-emerald-100">
                      <span className="block text-[10px] text-gray-500 font-medium">{metal}</span>
                      <span className="font-bold text-emerald-800">Not detected</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
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

        {/* Clinical Image Lightbox Modal */}
        {selectedClinicalImage && (
          <div
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
            onClick={() => setSelectedClinicalImage(null)}
          >
            <div
              className="bg-white rounded-3xl overflow-hidden max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100 bg-[#FAF8F5]">
                <div>
                  <h3 className="font-serif text-base sm:text-lg font-bold text-[#13382B]">
                    {selectedClinicalImage.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {selectedClinicalImage.desc}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedClinicalImage(null)}
                  className="p-2 rounded-full hover:bg-gray-200 text-gray-600 transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-3 sm:p-5 overflow-auto flex items-center justify-center bg-[#F7F5F0] max-h-[calc(92vh-90px)]">
                <img loading="lazy" decoding="async"
                  src={selectedClinicalImage.src}
                  alt={selectedClinicalImage.title}
                  className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-md"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
