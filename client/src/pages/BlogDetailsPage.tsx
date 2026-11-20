import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Share2,
  CheckCircle2,
  Bookmark,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  Check,
} from 'lucide-react';
import { getStaticBlogBySlug, getRelatedBlogs, BlogItem } from '../data/blogsData';
import { useAppDispatch } from '../store';
import { addToCart } from '../store/cartSlice';

export const BlogDetailsPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [copied, setCopied] = useState(false);
  const [productAdded, setProductAdded] = useState(false);

  // Retrieve static blog by slug
  const blog: BlogItem | undefined = slug ? getStaticBlogBySlug(slug) : undefined;
  const relatedBlogs: BlogItem[] = slug ? getRelatedBlogs(slug, 2) : [];

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  if (!blog) {
    return (
      <div className="w-full bg-[#FAF8F5] min-h-[70vh] flex items-center justify-center px-4 py-20 text-center">
        <div className="max-w-md bg-white rounded-3xl p-8 sm:p-10 border border-[#EDE8E1] shadow-sm">
          <p className="font-serif text-3xl font-bold text-[#13382B]">Article Not Found</p>
          <p className="text-sm text-[#6B8075] mt-2">
            The article you are looking for may have been updated or moved.
          </p>
          <Link
            to="/blog"
            className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 bg-[#13382B] text-white rounded-full text-xs font-semibold hover:bg-[#1E4D3B] transition-colors shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Articles</span>
          </Link>
        </div>
      </div>
    );
  }

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAddRecommended = () => {
    if (!blog.recommendedProduct) return;
    dispatch(
      addToCart({
        productId: blog.recommendedProduct.slug,
        name: blog.recommendedProduct.name,
        price: blog.recommendedProduct.price,
        originalPrice: blog.recommendedProduct.price + 500,
        image: blog.recommendedProduct.image,
        size: '50ml',
        quantity: 1,
      })
    );
    setProductAdded(true);
    setTimeout(() => setProductAdded(false), 1500);
  };

  return (
    <div className="w-full bg-[#FAF8F5] min-h-screen text-[#13382B] selection:bg-[#13382B] selection:text-white pb-24">
      {/* ──────────────────────────────────────────────────────────
          1. NAVIGATION & ARTICLE HEADER
         ────────────────────────────────────────────────────────── */}
      <div className="max-w-[960px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
        {/* Back link */}
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#13382B] hover:text-[#2E6B48] mb-6 group transition-colors"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to Articles</span>
        </Link>

        {/* Category & Meta pills */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-[#6B8075] mb-4">
          <span className="px-3 py-1 bg-[#EAF1EB] text-[#2E6B48] font-bold rounded-full">
            {blog.category}
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <Clock className="w-3.5 h-3.5" />
            {blog.readTime}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5 font-medium">
            <Calendar className="w-3.5 h-3.5" />
            {new Date(blog.publishedAt).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </div>

        {/* Title */}
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-[46px] font-medium text-[#13382B] leading-[1.18] tracking-tight mb-4">
          {blog.title}
        </h1>

        {blog.subtitle && (
          <p className="text-base sm:text-lg text-[#556B60] font-sans leading-relaxed mb-6">
            {blog.subtitle}
          </p>
        )}

        {/* Author & Share Bar */}
        <div className="flex items-center justify-between py-4 border-y border-[#EDE8E1] mb-8">
          <div className="flex items-center gap-3.5">
            <img loading="lazy" decoding="async"
              src={blog.author.avatar}
              alt={blog.author.name}
              className="w-11 h-11 rounded-full object-cover border-2 border-[#C5A880]"
            />
            <div>
              <p className="text-xs sm:text-sm font-bold text-[#13382B]">
                {blog.author.name}
              </p>
              <p className="text-[11px] text-[#6B8075]">
                {blog.author.role}
              </p>
            </div>
          </div>

          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-[#EDE8E1] text-xs font-semibold text-[#13382B] hover:border-[#13382B]/40 transition-all shadow-sm"
          >
            <Share2 className="w-3.5 h-3.5 text-[#3F6352]" />
            <span>{copied ? 'Link Copied!' : 'Share Article'}</span>
          </button>
        </div>

        {/* ──────────────────────────────────────────────────────────
            2. FEATURED COVER IMAGE BANNER
           ────────────────────────────────────────────────────────── */}
        <div className="rounded-2xl sm:rounded-3xl overflow-hidden aspect-[16/10] sm:aspect-[16/9] bg-[#E8EFE9] border border-[#EDE8E1] shadow-lg mb-10">
          <img loading="lazy" decoding="async"
            src={blog.coverImage}
            alt={blog.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1200&q=80';
            }}
          />
        </div>

        {/* ──────────────────────────────────────────────────────────
            3. KEY TAKEAWAYS BOX (Dermatologist Summary)
           ────────────────────────────────────────────────────────── */}
        {blog.keyTakeaways && blog.keyTakeaways.length > 0 && (
          <div className="bg-[#FAF7F2] rounded-3xl p-6 sm:p-8 border border-[#E8DFCFC] shadow-sm mb-10">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#2E6B48] mb-3">
              <Sparkles className="w-4 h-4 text-[#C5A880]" />
              <span>Dermatologist Key Takeaways</span>
            </div>
            <ul className="space-y-2.5">
              {blog.keyTakeaways.map((takeaway, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#13382B]">
                  <CheckCircle2 className="w-4 h-4 text-[#2E6B48] flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{takeaway}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ──────────────────────────────────────────────────────────
            4. ARTICLE BODY SECTIONS
           ────────────────────────────────────────────────────────── */}
        <div className="space-y-8 text-sm sm:text-base text-[#3A4E44] leading-relaxed font-sans">
          {/* Excerpt intro */}
          <p className="text-base sm:text-lg text-[#13382B] font-serif italic border-l-4 border-[#C5A880] pl-4 sm:pl-6 py-1 leading-relaxed">
            {blog.excerpt}
          </p>

          {/* Render structured sections */}
          {blog.sections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-4 pt-2">
              <h2 className="font-serif text-2xl sm:text-[28px] font-semibold text-[#13382B] leading-snug">
                {section.heading}
              </h2>

              {section.body.map((p, pIdx) => (
                <p key={pIdx} className="text-[#3A4E44] leading-relaxed">
                  {p}
                </p>
              ))}

              {/* Subpoints breakdown */}
              {section.subpoints && (
                <ul className="space-y-2 pl-4 sm:pl-6 border-l-2 border-[#D9E5DC] my-4">
                  {section.subpoints.map((sub, subIdx) => (
                    <li key={subIdx} className="text-xs sm:text-sm text-[#243B30] leading-relaxed">
                      • {sub}
                    </li>
                  ))}
                </ul>
              )}

              {/* Highlight Quote */}
              {section.quote && (
                <div className="my-6 bg-gradient-to-r from-[#EAF1EB]/70 to-[#F2EFE9]/50 rounded-2xl p-5 sm:p-6 border-l-4 border-[#13382B]">
                  <p className="font-serif text-base sm:text-lg text-[#13382B] italic">
                    “{section.quote}”
                  </p>
                </div>
              )}

              {/* Takeaway bullet */}
              {section.takeaway && (
                <div className="bg-[#FAF7F2] border border-[#EDE8E1] rounded-xl px-4 py-3 text-xs sm:text-sm font-semibold text-[#2D634C] flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#2D634C] flex-shrink-0" />
                  <span>{section.takeaway}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ──────────────────────────────────────────────────────────
            5. RECOMMENDED FORMULA PRODUCT CARD
           ────────────────────────────────────────────────────────── */}
        {blog.recommendedProduct && (
          <div className="mt-12 bg-white rounded-3xl p-6 sm:p-8 border border-[#EDE8E1] shadow-md flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-[#FAF8F5] p-2 border border-[#EDE8E1] flex-shrink-0">
                <img loading="lazy" decoding="async"
                  src={blog.recommendedProduct.image}
                  alt={blog.recommendedProduct.name}
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#2E6B48] tracking-widest">
                  Featured Formula
                </span>
                <h3 className="font-serif text-lg font-bold text-[#13382B]">
                  {blog.recommendedProduct.name}
                </h3>
                <p className="text-sm font-serif font-bold text-[#13382B] mt-0.5">
                  ₹{blog.recommendedProduct.price.toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Link
                to={`/shop/${blog.recommendedProduct.slug}`}
                className="flex-1 sm:flex-none text-center px-6 py-2.5 border border-[#13382B] text-[#13382B] rounded-full text-xs font-semibold hover:bg-[#FAF8F5] transition-colors"
              >
                View Product
              </Link>
              <button
                onClick={handleAddRecommended}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#13382B] text-white rounded-full text-xs font-semibold hover:bg-[#1E4D3B] transition-colors shadow-sm"
              >
                {productAdded ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-white" />
                    <span>Added!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Add to Bag</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ──────────────────────────────────────────────────────────
            6. TAGS CLOUD
           ────────────────────────────────────────────────────────── */}
        <div className="pt-8 pb-12 border-b border-[#EDE8E1] flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-[#6B8075] mr-1">Tags:</span>
          {blog.tags.map((tag, idx) => (
            <span
              key={idx}
              className="px-3 py-1 bg-white border border-[#EDE8E1] rounded-full text-xs text-[#4A5D53] font-medium"
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* ──────────────────────────────────────────────────────────
            7. RELATED ARTICLES SECTION (2 Cards matching design)
           ────────────────────────────────────────────────────────── */}
        {relatedBlogs.length > 0 && (
          <div className="pt-12">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#13382B]">
                Related Articles
              </h2>
              <Link
                to="/blog"
                className="text-xs font-semibold text-[#13382B] hover:text-[#2E6B48] flex items-center gap-1 group"
              >
                <span>View All Articles</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
              {relatedBlogs.map((rel) => (
                <article
                  key={rel._id}
                  className="group flex flex-col justify-between space-y-3 bg-white rounded-2xl p-4 sm:p-5 border border-[#EDE8E1] shadow-sm hover:shadow-md transition-all"
                >
                  <Link
                    to={`/blog/${rel.slug}`}
                    className="block aspect-[16/10] rounded-xl overflow-hidden bg-[#FAF8F5]"
                  >
                    <img loading="lazy" decoding="async"
                      src={rel.coverImage}
                      alt={rel.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </Link>

                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-[#2E6B48] uppercase tracking-wider">
                      {rel.category}
                    </span>
                    <Link to={`/blog/${rel.slug}`} className="block">
                      <h3 className="font-serif text-base font-semibold text-[#13382B] group-hover:text-[#2E6B48] transition-colors line-clamp-2 leading-snug">
                        {rel.title}
                      </h3>
                    </Link>
                    <p className="text-xs text-[#6B8075] line-clamp-2 leading-relaxed">
                      {rel.excerpt}
                    </p>
                  </div>

                  <div className="pt-2">
                    <Link
                      to={`/blog/${rel.slug}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#13382B] group-hover:text-[#2D634C]"
                    >
                      <span>Read more</span>
                      <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
