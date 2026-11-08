import React, { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, ArrowRight, Sparkles } from 'lucide-react';
import { PREDEFINED_BLOGS, BlogItem } from '../data/blogsData';

// Deep-ocean teal water, shared with the footer
const HERO_WATER =
  'radial-gradient(ellipse 70% 45% at 50% -5%, #1E9AA3 0%, rgba(30,154,163,0) 70%),' +
  'radial-gradient(ellipse 45% 40% at 85% 10%, rgba(64,190,198,0.55) 0%, rgba(64,190,198,0) 70%),' +
  'radial-gradient(ellipse 50% 50% at 10% 40%, rgba(11,85,96,0.9) 0%, rgba(11,85,96,0) 70%),' +
  'linear-gradient(180deg, #0B5560 0%, #06373F 45%, #031F26 100%)';

export const BlogPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentCategory = searchParams.get('category') || 'All';
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['All', 'Skincare Tips', 'Ingredients', 'Beauty Trends', 'Wellness'];

  const handleCategoryClick = (cat: string) => {
    const next = new URLSearchParams(searchParams);
    if (cat === 'All') next.delete('category');
    else next.set('category', cat);
    setSearchParams(next);
  };

  const filteredBlogs = useMemo(() => {
    return PREDEFINED_BLOGS.filter((b) => {
      const matchesCat = currentCategory === 'All' || b.category === currentCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        b.title.toLowerCase().includes(q) ||
        b.excerpt.toLowerCase().includes(q) ||
        b.tags.some((t) => t.toLowerCase().includes(q));
      return matchesCat && matchesSearch;
    });
  }, [currentCategory, searchQuery]);

  return (
    <div className="w-full bg-[#FAF8F5] min-h-screen text-[#13382B] selection:bg-[#13382B] selection:text-white pb-24">
      {/* ──────────────────────────────────────────────────────────
          1. HEADER / ARTICLES TITLE BAR
         ────────────────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden bg-[#06373F] py-12 sm:py-16">
        <div className="absolute inset-0 -z-10" style={{ background: HERO_WATER }} aria-hidden="true" />
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.2em] uppercase text-[#6FE4E8] mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#6FE4E8]" />
              <span>Hydra Derma Journal</span>
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-medium text-white tracking-tight">
              Articles
            </h1>
            <p className="text-sm text-[#D3EEEE] mt-2 max-w-xl font-sans">
              Dermatologist-backed skincare education, active ingredient breakdowns, and tropical sun defense strategies.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-[#8E9E95] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search articles or ingredients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white pl-10 pr-4 py-2.5 rounded-full text-xs sm:text-sm border border-white/40 text-[#13382B] placeholder-[#9CAAA1] focus:outline-none focus:ring-2 focus:ring-[#6FE4E8] shadow-[0_12px_30px_-16px_rgba(2,20,25,0.8)] transition-all"
            />
          </div>
        </div>
      </section>

      <section className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {/* 2. CATEGORY PILLS FILTER */}
        <div className="pt-6 flex items-center gap-2 overflow-x-auto scrollbar-none pb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryClick(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all shadow-sm ${
                currentCategory === cat
                  ? 'bg-[#13382B] text-white shadow-md'
                  : 'bg-white text-[#556B60] hover:text-[#13382B] border border-[#EDE8E1] hover:border-[#13382B]/30'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────
          3. ARTICLES GRID (Pixel-matched 2-column card layout)
         ────────────────────────────────────────────────────────── */}
      <section className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        {filteredBlogs.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-[#EDE8E1] shadow-sm max-w-md mx-auto my-12">
            <p className="font-serif text-2xl text-[#13382B]">No articles found</p>
            <p className="text-xs text-[#6B8075] mt-2">
              Try adjusting your search query or selecting "All" categories.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                handleCategoryClick('All');
              }}
              className="mt-5 px-6 py-2 bg-[#13382B] text-white rounded-full text-xs font-semibold hover:bg-[#1E4D3B] transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10">
            {filteredBlogs.map((article: BlogItem) => (
              <article
                key={article._id}
                className="group flex flex-col justify-between space-y-4"
              >
                {/* 1. Large Rounded Graphic Card Banner */}
                <Link
                  to={`/blog/${article.slug}`}
                  className="block relative rounded-2xl sm:rounded-3xl overflow-hidden aspect-[16/10] bg-[#E8EFE9] border border-[#E5EBE6] shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_28px_rgba(19,56,43,0.08)] transition-all duration-500"
                >
                  <img
                    src={article.coverImage}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    onError={(e) => {
                      // Fallback to high quality medical skincare image
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80';
                    }}
                  />
                </Link>

                {/* 2. Text Content */}
                <div className="space-y-2 pt-1">
                  {/* Article Title */}
                  <Link to={`/blog/${article.slug}`} className="block">
                    <h2 className="font-serif text-xl sm:text-2xl lg:text-[26px] font-semibold text-[#13382B] group-hover:text-[#2D634C] transition-colors leading-[1.25]">
                      {article.title}
                    </h2>
                  </Link>

                  {/* Meta: DATE • BRAND / AUTHOR in clean uppercase */}
                  <div className="flex items-center gap-2 text-[11px] sm:text-xs font-medium text-[#7A8C82] uppercase tracking-[0.15em] pt-0.5">
                    <span>
                      {new Date(article.publishedAt).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    <span>•</span>
                    <span className="font-semibold text-[#3F6352]">
                      HYDRA DERMA LABS
                    </span>
                  </div>

                  {/* Excerpt Paragraph */}
                  <p className="text-xs sm:text-sm text-[#556B60] leading-relaxed line-clamp-3 font-sans pt-1">
                    {article.excerpt}
                  </p>

                  {/* Read More Link with Dash */}
                  <div className="pt-2">
                    <Link
                      to={`/blog/${article.slug}`}
                      className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#13382B] group-hover:text-[#2D634C] transition-colors"
                    >
                      <span className="w-5 h-px bg-[#13382B] group-hover:w-7 transition-all" />
                      <span>Read more</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
