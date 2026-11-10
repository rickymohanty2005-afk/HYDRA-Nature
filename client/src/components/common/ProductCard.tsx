import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Check, Star, Sparkles, Award } from 'lucide-react';
import { Product } from '../../types';
import { useAppDispatch, useAppSelector } from '../../store';
import { addToCart } from '../../store/cartSlice';
import { toggleWishlistItem } from '../../store/wishlistSlice';
import { getImageUrl } from '../../utils/imageUrl';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const dispatch = useAppDispatch();
  const wishlistItems = useAppSelector((state) => state.wishlist.items);
  const isInWishlist = wishlistItems.some((i) => i._id === product._id);
  const [added, setAdded] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (product.stock <= 0) return;

    dispatch(
      addToCart({
        productId: product._id,
        product,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        image: product.images?.[0] || '',
        size: product.size || '50ml',
        quantity: 1,
      })
    );

    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(toggleWishlistItem(product));
  };

  // Badge Color Style for custom/category tags
  const getBadgeStyle = (tag?: string) => {
    switch (tag) {
      case 'Best Seller':
        return 'bg-gradient-to-r from-[#987938] via-[#B59149] to-[#C5A880] text-white border-amber-400/30';
      case 'New':
        return 'bg-[#2E6B48] text-white border-emerald-400/30';
      case 'Trending':
        return 'bg-[#C26D2B] text-white border-orange-400/30';
      case 'Organic':
        return 'bg-[#4A7C59] text-white border-green-400/30';
      case 'Limited':
        return 'bg-neutral-900 text-[#C5A880] border-[#C5A880]/40';
      default:
        return 'bg-[#13382B] text-white border-[#1E4D3B]/60';
    }
  };

  const hasDiscount = product.originalPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;
  const isOutOfStock = product.stock <= 0;

  return (
    <div className="group relative bg-white rounded-3xl p-4 sm:p-5 border border-[#EDE8E1] hover:border-[#C5A880]/80 shadow-[0_4px_24px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_45px_-12px_rgba(19,56,43,0.12)] -translate-y-0 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden">
      {/* 1. TOP BADGE & WISHLIST BAR */}
      <div className="relative w-full flex items-start justify-between gap-2 z-10">
        {/* Attached Tags & Flags (Admin controlled) */}
        <div className="flex flex-wrap items-center gap-1.5 max-w-[80%]">
          {/* Best Seller Flag Badge */}
          {product.isBestSeller && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full bg-gradient-to-r from-[#987938] via-[#AF8B40] to-[#C5A880] text-white shadow-xs">
              <Sparkles className="w-3 h-3 fill-current text-amber-200" />
              Best Seller
            </span>
          )}

          {/* Top Pick / Featured Flag Badge */}
          {product.isFeatured && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full bg-[#13382B] text-[#EAF1EB] border border-[#2E6B48]/50 shadow-xs">
              <Award className="w-3 h-3 text-[#C5A880]" />
              Top Pick
            </span>
          )}

          {/* Custom / Category Tag (only if not duplicate with isBestSeller) */}
          {product.tag && (!product.isBestSeller || product.tag !== 'Best Seller') && (
            <span
              className={`inline-flex items-center text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full border shadow-xs ${getBadgeStyle(
                product.tag
              )}`}
            >
              {product.tag}
            </span>
          )}

          {/* Discount Percentage Pill */}
          {discountPercent > 0 && (
            <span className="inline-flex items-center text-[10px] font-bold tracking-wide px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200/80">
              -{discountPercent}%
            </span>
          )}
        </div>

        {/* Floating Glassmorphic Wishlist Heart */}
        <button
          onClick={handleToggleWishlist}
          aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          className={`w-9 h-9 rounded-full bg-white/90 backdrop-blur-md border border-[#EDE8E1] flex items-center justify-center transition-all duration-200 shadow-sm flex-shrink-0 ${
            isInWishlist
              ? 'text-rose-600 border-rose-200 bg-rose-50/80'
              : 'text-[#687770] hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50/50'
          }`}
        >
          <Heart
            className={`w-4 h-4 transition-transform active:scale-125 ${
              isInWishlist ? 'fill-rose-600 text-rose-600' : 'stroke-current'
            }`}
          />
        </button>
      </div>

      {/* 2. PRODUCT IMAGE STAGE */}
      <Link
        to={`/shop/${product.slug || product._id}`}
        className="block my-3 overflow-hidden rounded-2xl bg-gradient-to-b from-[#FAF8F5] via-[#F8F5F0] to-[#F1ECE5]/70 p-5 aspect-square flex items-center justify-center relative group/stage transition-colors"
      >
        {/* Soft Radial Ambient Glow */}
        <div className="absolute inset-0 bg-radial from-white/60 via-transparent to-transparent opacity-80 pointer-events-none" />

        <img
          src={getImageUrl(product.images?.[0]) || FALLBACK_IMAGE}
          alt={product.name}
          onError={(e) => {
            (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
          }}
          className={`h-full w-full object-contain object-center drop-shadow-[0_12px_22px_rgba(19,56,43,0.13)] group-hover:scale-108 transition-transform duration-700 ease-out ${
            isOutOfStock ? 'opacity-60 grayscale-[30%]' : ''
          }`}
          loading="lazy"
        />

        {/* Out of Stock Frosted Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/25 backdrop-blur-xs flex items-center justify-center">
            <span className="bg-neutral-900/90 text-white font-medium text-xs tracking-wider uppercase px-3.5 py-1.5 rounded-full shadow-lg border border-white/20">
              Out of Stock
            </span>
          </div>
        )}
      </Link>

      {/* 3. PRODUCT DETAILS & SPECS */}
      <div className="pt-1 flex-1 flex flex-col justify-between">
        <div>
          {/* Category & Volume/Size Meta */}
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.16em] text-[#A68962]">
            <span className="truncate">{product.category}</span>
            {product.size && <span className="text-[#8E9E95] font-normal lowercase">{product.size}</span>}
          </div>

          {/* Product Name */}
          <Link to={`/shop/${product.slug || product._id}`} className="block mt-1">
            <h3 className="font-serif text-base sm:text-lg font-bold text-[#1A211D] group-hover:text-[#13382B] transition-colors leading-snug line-clamp-1">
              {product.name}
            </h3>
          </Link>

          {/* Subtitle / Key Benefit */}
          <p className="text-xs text-[#708078] font-sans line-clamp-1 mt-1">
            {product.subtitle || (product.keyBenefits?.[0] ? product.keyBenefits[0] : product.description)}
          </p>

          {/* Star Rating & Review Count */}
          <div className="flex items-center gap-1.5 mt-2">
            <div className="flex items-center text-amber-500">
              <Star className="w-3.5 h-3.5 fill-current" />
            </div>
            <span className="text-xs font-bold text-[#1A211D]">
              {product.rating ? Number(product.rating).toFixed(1) : '5.0'}
            </span>
            <span className="text-[11px] text-[#8E9E95]">
              ({product.reviewCount || 24})
            </span>
          </div>
        </div>

        {/* 4. PRICE & ADD TO BAG ROW */}
        <div className="mt-4 pt-3 border-t border-[#F1ECE5] flex flex-wrap items-center justify-between gap-2">
          {/* Price Container */}
          <div className="flex-auto flex flex-col">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="whitespace-nowrap font-serif text-lg sm:text-xl font-bold text-[#13382B]">
                ₹{product.price.toLocaleString('en-IN')}
              </span>
              {hasDiscount && (
                <span className="whitespace-nowrap text-xs text-[#8E9E95] line-through font-sans">
                  ₹{product.originalPrice.toLocaleString('en-IN')}
                </span>
              )}
            </div>
            {hasDiscount && (
              <span className="text-[10px] font-semibold text-emerald-700">
                Save ₹{(product.originalPrice - product.price).toLocaleString('en-IN')}
              </span>
            )}
          </div>

          {/* Modern Add to Cart Pill Button */}
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`h-11 min-w-28 max-w-full flex-shrink-0 px-3 rounded-full font-semibold text-[13px] sm:text-sm flex items-center justify-center gap-1 whitespace-nowrap transition-all duration-300 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#13382B] ${
              added
                ? 'bg-emerald-700 text-white shadow-emerald-700/20'
                : isOutOfStock
                ? 'bg-gray-100 text-gray-600 cursor-not-allowed border border-gray-200'
                : 'bg-[#13382B] text-white hover:bg-[#1E4D3B] hover:scale-102 active:scale-98 shadow-[#13382B]/15'
            }`}
            title={isOutOfStock ? 'Product is currently sold out' : 'Add formulation to shopping bag'}
          >
            {added ? (
              <>
                <Check className="w-4 h-4 animate-scale-in text-white" />
                <span className="font-semibold">Added</span>
              </>
            ) : isOutOfStock ? (
              <span>Sold Out</span>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Bag</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
