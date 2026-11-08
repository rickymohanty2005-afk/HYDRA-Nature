import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Heart,
  ShoppingBag,
  Check,
  Star,
  Droplets,
  Clock,
  ShieldCheck,
  Sparkles,
  Image as ImageIcon,
  Search,
  Leaf,
  Quote,
  Mail,
  BadgeCheck,
  ArrowUpRight,
} from 'lucide-react';
import {
  NaturalIngredientsIcon,
  LabTestedIcon,
  SafeFormulaIcon,
  FreeShippingIcon,
  CategoryIcon,
} from '../components/common/BotanicalIcons';
import { HomeHeroCarousel, NIGHT_INGREDIENTS, NIGHT_RITUAL } from '../components/HomeHeroCarousel';
import { productService } from '../services/productService';
import { newsletterService } from '../services/newsletterService';
import { useAppDispatch, useAppSelector } from '../store';
import { addToCart } from '../store/cartSlice';
import { toggleWishlistItem } from '../store/wishlistSlice';
import { Product } from '../types';
import { getImageUrl } from '../utils/imageUrl';

// Night cream spotlight content
const NIGHT_BENEFITS = [
  { icon: Sparkles, title: 'Boosts collagen', text: 'Supports firmer, bouncier skin.' },
  { icon: Clock, title: 'Softens fine lines', text: 'Visibly smoother over time.' },
  { icon: Droplets, title: 'Refines texture', text: 'Wake up to an even, rested glow.' },
];

// Deep-ocean teal water, shared with the footer
const BRAND_STORY_WATER =
  'radial-gradient(ellipse 70% 45% at 50% -5%, #1E9AA3 0%, rgba(30,154,163,0) 70%),' +
  'radial-gradient(ellipse 45% 40% at 85% 10%, rgba(64,190,198,0.55) 0%, rgba(64,190,198,0) 70%),' +
  'radial-gradient(ellipse 50% 50% at 10% 40%, rgba(11,85,96,0.9) 0%, rgba(11,85,96,0) 70%),' +
  'linear-gradient(180deg, #0B5560 0%, #06373F 45%, #031F26 100%)';

export const HomePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const wishlistItems = useAppSelector((state) => state.wishlist.items);

  const [products, setProducts] = useState<Product[]>([]);
  const [topPicksLoading, setTopPicksLoading] = useState(true);
  const [topPicksError, setTopPicksError] = useState(false);
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});
  // Newsletter state
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterMessage, setNewsletterMessage] = useState('');
  const [newsletterIsError, setNewsletterIsError] = useState(false);
  const [newsletterLoading, setNewsletterLoading] = useState(false);

  useEffect(() => {
    const fetchTopPicks = async () => {
      try {
        const res = await productService.getAll({ featured: true, limit: 4, sort: 'newest' });
        const fetched = res.data?.products || res.products || res.data || [];
        setProducts(
          Array.isArray(fetched)
            ? fetched.filter((product: Product) => product.isFeatured && product.isActive !== false).slice(0, 4)
            : []
        );
      } catch (err) {
        console.error('Failed to load homepage top picks:', err);
        setTopPicksError(true);
      } finally {
        setTopPicksLoading(false);
      }
    };
    fetchTopPicks();
  }, []);

  const handleAddToCart = (e: React.MouseEvent, item: Product) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(
      addToCart({
        productId: item._id,
        product: item,
        name: item.name,
        price: item.price,
        originalPrice: item.originalPrice,
        image: getImageUrl(item.images?.[0]),
        size: item.size || '50ml',
        quantity: 1,
      })
    );
    setAddedIds((prev) => ({ ...prev, [item._id]: true }));
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [item._id]: false }));
    }, 1500);
  };

  const handleToggleWishlist = (e: React.MouseEvent, item: Product) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(toggleWishlistItem(item));
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setNewsletterLoading(true);
    setNewsletterMessage('');
    try {
      const res = await newsletterService.subscribe(newsletterEmail.trim());
      setNewsletterIsError(false);
      setNewsletterMessage(res?.message || 'Welcome to the Hydra Family!');
      setNewsletterEmail('');
    } catch (err: any) {
      setNewsletterIsError(true);
      setNewsletterMessage(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setNewsletterLoading(false);
    }
  };

  const categories = [
    { name: 'Face Care', path: '/shop?category=Face Care' },
    { name: 'Body Care', path: '/shop?category=Body Care' },
    { name: 'Hair Care', path: '/shop?category=Hair Care' },
    { name: 'Skincare Sets', path: '/shop?category=Skincare Sets' },
    { name: 'Natural Care', path: '/shop?category=Natural Care' },
    { name: 'Organic Range', path: '/shop?category=Organic Range' },
  ];

  return (
    <div className="w-full bg-[#FAF8F5] text-[#13382B] selection:bg-[#13382B] selection:text-white">
      <HomeHeroCarousel />

      {/* ------------------------------------------------------------------
          2. VALUE PROPOSITIONS BAR — thin luxury credential band
         ------------------------------------------------------------------ */}
      <section className="border-y border-[#EDE8E1] bg-white">
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center divide-y divide-[#EDE8E1] sm:divide-y-0 sm:divide-x">
            <div className="flex w-1/2 items-center justify-center gap-2 px-3 py-3.5 sm:w-auto sm:px-6">
              <NaturalIngredientsIcon className="h-4 w-4 flex-shrink-0 text-[#13382B]" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#13382B] sm:text-[11px]">
                100% Natural
              </span>
            </div>
            <div className="flex w-1/2 items-center justify-center gap-2 px-3 py-3.5 sm:w-auto sm:px-6">
              <LabTestedIcon className="h-4 w-4 flex-shrink-0 text-[#13382B]" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#13382B] sm:text-[11px]">
                Dermatologically Tested
              </span>
            </div>
            <div className="flex w-1/2 items-center justify-center gap-2 px-3 py-3.5 sm:w-auto sm:px-6">
              <SafeFormulaIcon className="h-4 w-4 flex-shrink-0 text-[#13382B]" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#13382B] sm:text-[11px]">
                Safe & Effective
              </span>
            </div>
            <div className="flex w-1/2 items-center justify-center gap-2 px-3 py-3.5 sm:w-auto sm:px-6">
              <FreeShippingIcon className="h-4 w-4 flex-shrink-0 text-[#13382B]" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#13382B] sm:text-[11px]">
                Free Shipping India
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------
          THE HYDRA DIFFERENCE - BRAND STORY
         ------------------------------------------------------------------ */}
      <section className="bg-[#FAF8F5] py-10 sm:py-14 lg:py-20">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative isolate overflow-hidden rounded-[28px] bg-[#06373F] shadow-[0_30px_80px_-30px_rgba(3,31,38,0.7)] ring-1 ring-black/5 lg:min-h-[620px]">
            {/* Background: deep teal water */}
            <div className="absolute inset-0 -z-10" style={{ background: BRAND_STORY_WATER }} aria-hidden="true" />

            {/* Image: full-bleed on desktop (subject sits on the right, dark negative space behind the copy) */}
            <div className="relative aspect-[4/3] w-full sm:aspect-[16/10] lg:absolute lg:inset-0 lg:aspect-auto">
              <img
                src="/images/home/care_model.png"
                alt="Woman enjoying a gentle skincare ritual"
                className="absolute inset-0 h-full w-full object-cover object-[78%_center] lg:object-right"
                loading="lazy"
              />
              {/* Mobile: fade image into the copy below */}
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#06373F] to-transparent lg:hidden"
                aria-hidden="true"
              />
              {/* Desktop: teal water washes over the copy side and fades into the image */}
              <div
                className="pointer-events-none absolute inset-0 hidden [mask-image:linear-gradient(to_right,black_0%,rgba(0,0,0,0.85)_35%,transparent_62%)] lg:block"
                style={{ background: BRAND_STORY_WATER }}
                aria-hidden="true"
              />
              <div
                className="pointer-events-none absolute -left-32 top-1/2 hidden h-[480px] w-[480px] -translate-y-1/2 rounded-full bg-[#1E9AA3]/30 blur-[120px] lg:block"
                aria-hidden="true"
              />

            
            </div>

            {/* Copy */}
            <div className="relative z-10 flex flex-col justify-center px-6 pb-10 pt-2 text-white sm:px-10 sm:pb-12 lg:min-h-[620px] lg:max-w-[560px] lg:px-14 lg:py-16">
              <p className="mb-5 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#6FE4E8] sm:text-xs">
                <span className="h-px w-8 bg-[#6FE4E8]/70" aria-hidden="true" />
                The Hydra Difference
              </p>

              <h2 className="font-serif text-4xl font-medium leading-[1.1] tracking-tight sm:text-5xl lg:text-[52px]">
                Skincare, made simple.{' '}
                <span className="bg-gradient-to-r from-[#BEFAFC] to-[#6FE4E8] bg-clip-text italic text-transparent">
                  Rooted in nature.
                </span>
              </h2>

              <p className="mt-5 max-w-md text-sm leading-7 text-[#D3EEEE] sm:text-base">
                Powered by Nature, Perfected by Science. We bring considered botanical ingredients and
                thoughtful formulation together for rituals that feel beautifully uncomplicated.
              </p>

              <ul className="mt-8 grid gap-3">
                {[
                  { icon: Leaf, title: 'Nature-led ingredients', text: 'Botanical ingredients chosen with care.' },
                  {
                    icon: ShieldCheck,
                    title: 'Thoughtfully tested',
                    text: 'Considered formulas, made with your daily routine in mind.',
                  },
                  {
                    icon: Sparkles,
                    title: 'Everyday essentials',
                    text: 'A simpler approach to the care you reach for every day.',
                  },
                ].map(({ icon: Icon, title, text }) => (
                  <li
                    key={title}
                    className="flex items-start gap-4 rounded-2xl border border-white/15 bg-white/[0.07] p-4 shadow-[0_12px_30px_-16px_rgba(2,20,25,0.8)] backdrop-blur-xl transition-colors hover:border-white/30 hover:bg-white/[0.12]"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#031F26] shadow-md">
                      <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-white">{title}</h3>
                      <p className="mt-1 text-xs leading-5 text-[#A9D4D6]">{text}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <Link
                to="/about"
                className="group mt-9 inline-flex w-fit items-center gap-3 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#031F26] transition-all hover:bg-[#D3EEEE] hover:shadow-[0_10px_30px_-10px_rgba(111,228,232,0.8)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#6FE4E8]"
              >
                Meet the Hydra difference
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>


      

      {/* ------------------------------------------------------------------
          3. OUR TOP PICKS
         ------------------------------------------------------------------ */}
      <section className="py-14 sm:py-20 bg-[#FAF8F5]">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
            <div className="flex items-center justify-center gap-3 text-xs font-semibold tracking-[0.2em] uppercase text-[#6B8075] mb-2">
              <span className="w-8 h-px bg-[#C9BEB0]" />
              <span>OUR TOP PICKS</span>
              <span className="w-8 h-px bg-[#C9BEB0]" />
            </div>

            <h2 className="font-serif text-3xl sm:text-4xl lg:text-[40px] font-medium text-[#13382B] tracking-tight">
              Skincare Solutions for Every You
            </h2>

            <p className="text-xs sm:text-sm text-[#556B60] mt-2 font-sans">
              Discover our most loved products for healthy, glowing skin.
            </p>
          </div>

          {topPicksLoading && <p className="mb-6 text-center text-sm text-[#556B60]">Loading featured products…</p>}
          {!topPicksLoading && topPicksError && (
            <p className="mb-6 text-center text-sm text-[#8B3A32]" role="alert">
              Featured products could not be loaded. Please try again later.
            </p>
          )}
          {!topPicksLoading && !topPicksError && products.length === 0 && (
            <p className="mb-6 text-center text-sm text-[#556B60]">Our top picks will be here soon.</p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {products.map((product) => {
              const isInWishlist = wishlistItems.some((i) => i._id === product._id);
              const isAdded = !!addedIds[product._id];
              const hasDiscount = (product.originalPrice ?? 0) > product.price;
              const productBadge = product.isBestSeller ? 'Best Seller' : product.tag;

              return (
                <div
                  key={product._id}
                  className="bg-white rounded-2xl overflow-hidden border border-[#EDE8E1] hover:border-[#C5A880]/60 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_40px_rgba(19,56,43,0.10)] transition-all duration-300 flex flex-col group"
                >
                  {/* ── Image Block ── */}
                  <div className="relative overflow-hidden">
                    {/* Badge */}
                    {productBadge && (
                      <span
                        className={`absolute top-3 left-3 z-10 text-[10px] font-semibold px-2.5 py-0.5 rounded-full text-white ${
                          productBadge === 'Best Seller'
                            ? 'bg-[#8CA448]'
                            : productBadge === 'New'
                            ? 'bg-[#7A9A3B]'
                            : productBadge === 'Trending'
                            ? 'bg-[#D9822B]'
                            : 'bg-[#13382B]'
                        }`}
                      >
                        {productBadge}
                      </span>
                    )}

                    {/* Wishlist Heart */}
                    <button
                      onClick={(e) => handleToggleWishlist(e, product)}
                      aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                      className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm border border-[#EDE8E1] flex items-center justify-center text-[#708078] hover:text-[#B91C1C] hover:border-[#B91C1C]/30 transition-all shadow-sm"
                    >
                      <Heart
                        className={`w-3.5 h-3.5 transition-transform active:scale-125 ${
                          isInWishlist ? 'fill-[#B91C1C] text-[#B91C1C]' : 'stroke-current'
                        }`}
                      />
                    </button>

                    {/* Product Image — edge-to-edge, perfectly square */}
                    <Link
                      to={`/shop/${product.slug || product._id}`}
                      className="relative block w-full overflow-hidden"
                      style={{ paddingBottom: '100%' /* 1:1 square via padding trick */ }}
                    >
                      {/* Neutral background + fallback icon — always rendered beneath the image */}
                      <div className="absolute inset-0 bg-gradient-to-b from-[#F5F2ED] to-[#EDE8E0] flex flex-col items-center justify-center gap-2 text-[#C5BEB5]">
                        <ImageIcon className="h-10 w-10" />
                        <span className="text-[11px]">Image unavailable</span>
                      </div>

                      {/* Actual product image — absolute fill so every card is identical size */}
                      {product.images?.[0] && (
                        <img
                          src={getImageUrl(product.images[0])}
                          alt={product.name}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      )}

                      {/* Quick-look zoom — fades in centered on hover */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/8 transition-colors duration-300 flex items-center justify-center pointer-events-none">
                        <span className="w-10 h-10 rounded-full bg-white/95 shadow-md flex items-center justify-center opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300">
                          <Search className="w-4 h-4 text-[#13382B]" />
                        </span>
                      </div>

                      {/* ADD TO CART bar — slides up from the bottom edge on hover */}
                      <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-auto">
                        <button
                          onClick={(e) => handleAddToCart(e, product)}
                          aria-label={`Add ${product.name} to cart`}
                          className={`w-full py-3.5 text-[11px] font-bold tracking-[0.2em] uppercase flex items-center justify-center gap-2 transition-colors ${
                            isAdded
                              ? 'bg-[#2E6B48] text-white'
                              : 'bg-[#8FB88A] hover:bg-[#13382B] text-white'
                          }`}
                        >
                          {isAdded ? (
                            <><Check className="w-3.5 h-3.5" /> Added</>
                          ) : (
                            <><ShoppingBag className="w-3.5 h-3.5" /> Add to Cart</>
                          )}
                        </button>
                      </div>
                    </Link>
                  </div>

                  {/* ── Info Block ── */}
                  <div className="px-4 py-4 flex flex-col flex-1">
                    <Link to={`/shop/${product.slug || product._id}`} className="block flex-1">
                      <h3 className="font-serif text-sm sm:text-base font-semibold text-[#13382B] group-hover:text-[#2D634C] transition-colors leading-snug">
                        {product.name}
                      </h3>
                      {product.subtitle && (
                        <p className="text-[11px] text-[#6E7F75] mt-0.5 font-sans line-clamp-1">{product.subtitle}</p>
                      )}
                    </Link>

                    {/* Price row */}
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-[#9CAAA1]">MRP</span>
                      <span className="font-serif text-base font-bold text-[#13382B]">
                        ₹{product.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                      {hasDiscount && (
                        <span className="text-xs text-[#9CAAA1] line-through font-sans">
                          ₹{product.originalPrice.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------
          4. NIGHT CREAM SPOTLIGHT — compact editorial teaser
         ------------------------------------------------------------------ */}
      <section className="bg-[#FAF8F5] py-10 sm:py-14 lg:py-20">
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
          <div className="relative isolate overflow-hidden rounded-[28px] bg-[#06373F] px-6 py-12 text-white shadow-[0_30px_80px_-30px_rgba(3,31,38,0.7)] ring-1 ring-black/5 sm:px-10 sm:py-14 lg:px-14 lg:py-16">
            {/* Background: deep teal water + light shafts */}
            <div className="absolute inset-0 -z-20" style={{ background: BRAND_STORY_WATER }} aria-hidden="true" />
            <div
              className="pointer-events-none absolute -bottom-40 -right-24 -z-10 h-[460px] w-[460px] rounded-full bg-[#1E9AA3]/25 blur-[110px]"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute inset-0 -z-10 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,0.9)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.9)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_at_30%_50%,black,transparent_70%)]"
              aria-hidden="true"
            />

            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-10">
              {/* Visual: transparent product on a glowing podium */}
              <div className="lg:col-span-5">
                <div className="relative mx-auto w-full max-w-[420px]">
                  {/* halo */}
                  <div
                    className="absolute left-1/2 top-[44%] aspect-square w-[86%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(127,230,234,0.45)_0%,rgba(30,154,163,0.18)_45%,transparent_70%)]"
                    aria-hidden="true"
                  />
                  <div
                    className="absolute left-1/2 top-[44%] aspect-square w-[74%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/15"
                    aria-hidden="true"
                  />
                  {/* podium */}
                  <div
                    className="absolute bottom-[4%] left-1/2 h-[16%] w-[78%] -translate-x-1/2 rounded-[50%] bg-gradient-to-b from-white/25 to-white/[0.03] ring-1 ring-white/20 backdrop-blur-sm"
                    aria-hidden="true"
                  />
                  <div
                    className="absolute bottom-[8%] left-1/2 h-[6%] w-[52%] -translate-x-1/2 rounded-[50%] bg-[#021419]/60 blur-md"
                    aria-hidden="true"
                  />

                  <img
                    src="/images/home/RadianceFaceWash.png"
                    alt="Hydra 24h Ultra Radiance face wash in a gold-capped white jar"
                    className="relative block h-auto w-full object-contain drop-shadow-[0_30px_40px_rgba(2,20,25,0.55)]"
                    loading="lazy"
                  />

                  <div className="absolute left-0 top-[12%] flex items-center gap-2 rounded-full border border-white/20 bg-white/10 py-1.5 pl-2 pr-4 shadow-lg backdrop-blur-xl sm:-left-6">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#031F26]">
                      <Star className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-white">Best Selling</span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="lg:col-span-7 lg:pr-6">
                <p className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#6FE4E8] sm:text-xs">
                  <span className="h-px w-8 bg-[#6FE4E8]/70" aria-hidden="true" />
                  Signature Formula
                </p>

                <h2 className="mt-4 font-serif text-[34px] font-medium leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-[54px]">
                  Hydra 24n Ultra Radiance{' '}
                  <span className="bg-gradient-to-r from-[#BEFAFC] to-[#6FE4E8] bg-clip-text font-normal italic text-transparent">
                    Face Wash
                  </span>
                </h2>

                <p className="mt-4 max-w-xl text-sm leading-7 text-[#D3EEEE] sm:text-base">
                  A rich overnight treatment designed to rejuvenate and restore your skin while you sleep.
                </p>

                {/* Ingredients as glass chips */}
                <ul className="mt-5 flex max-w-xl flex-wrap gap-2" aria-label="Key ingredients">
                  {NIGHT_INGREDIENTS.map((ing) => (
                    <li
                      key={ing}
                      className="rounded-full border border-white/15 bg-white/[0.07] px-3 py-1 text-[11px] font-medium text-[#D3EEEE] backdrop-blur"
                    >
                      {ing}
                    </li>
                  ))}
                </ul>

                {/* Benefits */}
                <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {NIGHT_BENEFITS.map(({ icon: Icon, title, text }) => (
                    <div
                      key={title}
                      className="rounded-2xl border border-white/15 bg-white/[0.07] p-4 backdrop-blur-xl transition-colors hover:border-white/30 hover:bg-white/[0.12]"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#031F26]">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <h3 className="mt-3 text-sm font-semibold text-white">{title}</h3>
                      <p className="mt-1 text-xs leading-5 text-[#A9D4D6]">{text}</p>
                    </div>
                  ))}
                </div>

                {/* CTAs */}
                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <Link
                    to="/shop?category=Face Care"
                    className="group inline-flex items-center gap-2.5 rounded-full bg-white px-8 py-3.5 text-xs font-semibold tracking-wide text-[#031F26] shadow-lg transition-all hover:bg-[#D3EEEE] hover:shadow-[0_10px_30px_-10px_rgba(111,228,232,0.8)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#6FE4E8] sm:text-sm"
                  >
                    <span>Shop</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </Link>
                  <Link
                    to="/shop"
                    className="inline-flex items-center gap-2 text-xs font-semibold text-[#D3EEEE] underline-offset-4 transition-colors hover:text-white hover:underline sm:text-sm"
                  >
                    View all products
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------
          5. CATEGORIES + TESTIMONIAL + NEWSLETTER — unified editorial band
         ------------------------------------------------------------------ */}
      <section className="bg-[#FAF8F5] py-14 sm:py-20">
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
          {/* Heading */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#1E9AA3] sm:text-xs">
                <span className="h-px w-8 bg-[#1E9AA3]/60" aria-hidden="true" />
                Shop by Category
              </p>
              <h2 className="mt-3 font-serif text-3xl font-medium leading-tight tracking-tight text-[#04282B] sm:text-4xl">
                Find your <em className="text-[#1E9AA3]">ritual.</em>
              </h2>
            </div>
            <Link
              to="/shop"
              className="group inline-flex w-fit items-center gap-2 text-sm font-semibold text-[#04282B] transition-colors hover:text-[#1E9AA3]"
            >
              View all products
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          </div>

          {/* Category tiles */}
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                to={cat.path}
                className="group relative flex flex-col items-center gap-3 rounded-2xl border border-[#04282B]/[0.08] bg-white px-4 py-6 text-center shadow-[0_1px_2px_rgba(4,40,43,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-[#1E9AA3]/40 hover:shadow-[0_18px_40px_-20px_rgba(6,55,63,0.45)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E9AA3]"
              >
                <ArrowUpRight
                  className="absolute right-3 top-3 h-4 w-4 text-[#1E9AA3] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  aria-hidden="true"
                />
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#E6F5F5] transition-colors duration-300 group-hover:bg-gradient-to-br group-hover:from-[#1E9AA3] group-hover:to-[#06373F]">
                  <CategoryIcon
                    name={cat.name}
                    className="h-7 w-7 text-[#0B5560] transition-colors duration-300 group-hover:text-white"
                  />
                </span>
                <span className="text-xs font-semibold text-[#04282B] sm:text-sm">{cat.name}</span>
              </Link>
            ))}
          </div>

          {/* Testimonial + Newsletter */}
          <div className="mt-10 grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-5">
            {/* Testimonial */}
            <figure className="relative flex overflow-hidden rounded-[28px] border border-[#04282B]/[0.08] bg-white shadow-[0_20px_50px_-30px_rgba(6,55,63,0.35)] lg:col-span-3">
              <div className="relative z-10 flex flex-1 flex-col justify-between gap-6 p-6 sm:p-9">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#E6F5F5] text-[#1E9AA3]">
                      <Quote className="h-5 w-5 fill-current" aria-hidden="true" />
                    </span>
                    <div className="flex items-center gap-0.5 text-amber-500" aria-label="Rated 5 out of 5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-current" aria-hidden="true" />
                      ))}
                    </div>
                  </div>
                  <blockquote className="mt-6 font-serif text-xl leading-snug text-[#04282B] sm:text-2xl">
                    “Hydra products have completely transformed my skin. Natural, effective and truly premium!”
                  </blockquote>
                </div>

                <figcaption className="flex items-center gap-3 border-t border-[#04282B]/[0.08] pt-5">
                  <img
                    src="/images/home/sneha_avatar.jpg"
                    alt="Sneha Patel"
                    className="h-11 w-11 rounded-full object-cover ring-2 ring-[#1E9AA3]/30 ring-offset-2"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80';
                    }}
                  />
                  <div>
                    <p className="text-sm font-semibold text-[#04282B]">Sneha Patel</p>
                    <p className="flex items-center gap-1 text-xs text-[#1E9AA3]">
                      <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                      Verified buyer
                    </p>
                  </div>
                </figcaption>
              </div>

              <div className="relative hidden w-[38%] shrink-0 sm:block">
                <img
                  src="/images/home/testimonial_leaf.jpg"
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/home/testimonial_card.jpg';
                  }}
                />
                <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-white to-transparent" aria-hidden="true" />
              </div>
            </figure>

            {/* Newsletter */}
            <div className="relative isolate flex flex-col justify-between overflow-hidden rounded-[28px] bg-[#06373F] p-6 text-white shadow-[0_30px_80px_-30px_rgba(3,31,38,0.7)] sm:p-9 lg:col-span-2">
              <div className="absolute inset-0 -z-10" style={{ background: BRAND_STORY_WATER }} aria-hidden="true" />
              <div
                className="absolute -right-16 -top-16 -z-10 h-56 w-56 rounded-full bg-[#7FE6EA]/20 blur-3xl"
                aria-hidden="true"
              />

              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-[#6FE4E8] ring-1 ring-white/20 backdrop-blur">
                    <Mail className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 font-serif text-2xl font-medium leading-tight sm:text-[28px]">
                    Join the <em className="text-[#6FE4E8]">Hydra</em> family
                  </h3>
                  <p className="mt-2 max-w-xs text-sm leading-relaxed text-[#D3EEEE]">
                    Get exclusive offers, skincare tips and more.
                  </p>
                </div>
                <div className="hidden h-28 w-20 shrink-0 rotate-6 overflow-hidden rounded-2xl bg-white p-1.5 shadow-[0_20px_40px_-15px_rgba(2,20,25,0.9)] sm:block">
                  <img
                    src="/images/home/newsletter_bottle.jpg"
                    alt="Hydra Serum bottle"
                    className="h-full w-full rounded-xl object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/home/newsletter_card.jpg';
                    }}
                  />
                </div>
              </div>

              <form onSubmit={handleNewsletterSubmit} className="mt-8">
                <label htmlFor="newsletter-email" className="sr-only">
                  Email address
                </label>
                <div className="flex items-center rounded-full border border-white/20 bg-white/10 p-1.5 backdrop-blur-xl transition-colors focus-within:border-[#6FE4E8]/70 focus-within:bg-white/[0.14]">
                  <input
                    id="newsletter-email"
                    type="email"
                    required
                    placeholder="Enter your email address"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    className="min-w-0 flex-1 bg-transparent px-4 py-2 text-sm text-white placeholder-[#A9D4D6] focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={newsletterLoading}
                    className="group flex items-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-xs font-semibold text-[#031F26] shadow-sm transition-all hover:bg-[#D3EEEE] hover:shadow-[0_10px_30px_-10px_rgba(111,228,232,0.8)] disabled:opacity-60"
                  >
                    <span>{newsletterLoading ? '...' : 'Subscribe'}</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </button>
                </div>
                {newsletterMessage ? (
                  <p
                    className={`mt-3 text-xs font-medium ${newsletterIsError ? 'text-[#FCA5A5]' : 'text-[#6FE4E8]'}`}
                    role="status"
                  >
                    {newsletterMessage}
                  </p>
                ) : (
                  <p className="mt-3 text-xs text-[#A9D4D6]">No spam, ever. Unsubscribe anytime.</p>
                )}
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;