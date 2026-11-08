import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, SlidersHorizontal, Search, X, Check, ChevronDown, Sparkles } from 'lucide-react';
import { ProductCard } from '../components/common/ProductCard';
import { productService, ProductQueryParams } from '../services/productService';
import { Product } from '../types';

const ShopPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ name: string; count: number }[]>([]);
  const [subcategories, setSubcategories] = useState<string[]>(['All']);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters from URL or state
  const currentCategory = searchParams.get('category') || 'All Products';
  const currentSubcategory = searchParams.get('subcategory') || 'All';
  const currentSearch = searchParams.get('search') || '';
  const currentSort = searchParams.get('sort') || 'popular';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  const [searchInput, setSearchInput] = useState(currentSearch);
  const [inStockOnly, setInStockOnly] = useState(false);

  // Fetch dynamic categories
  useEffect(() => {
    productService
      .getCategories()
      .then((cats) => {
        if (Array.isArray(cats) && cats.length > 0) {
          setCategories(cats);
        } else {
          // Default fallbacks if database just initialized
          setCategories([
            { name: 'Face Care', count: 0 },
            { name: 'Body Care', count: 0 },
            { name: 'Hair Care', count: 0 },
            { name: 'Skincare Sets', count: 0 },
            { name: 'Natural Care', count: 0 },
            { name: 'Organic Range', count: 0 },
          ]);
        }
      })
      .catch((err) => console.error('Error fetching categories:', err));
  }, []);

  // Fetch dynamic subcategories for currently selected category
  useEffect(() => {
    const catQuery = currentCategory !== 'All Products' ? currentCategory : undefined;
    productService
      .getSubcategories(catQuery)
      .then((subs) => {
        if (Array.isArray(subs) && subs.length > 0) {
          setSubcategories(['All', ...subs]);
        } else {
          setSubcategories(['All', 'Serums', 'Moisturizers', 'Cleansers', 'Sunscreens', 'Essentials']);
        }
      })
      .catch(() => {
        setSubcategories(['All', 'Serums', 'Moisturizers', 'Cleansers', 'Sunscreens', 'Essentials']);
      });
  }, [currentCategory]);

  // Sync search input when URL changes
  useEffect(() => {
    setSearchInput(currentSearch);
  }, [currentSearch]);

  // Fetch products with dynamic filters
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params: ProductQueryParams = {
          page: currentPage,
          limit: 12,
          sort: currentSort,
        };

        if (currentCategory && currentCategory !== 'All Products') {
          params.category = currentCategory;
        }
        if (currentSubcategory && currentSubcategory !== 'All') {
          params.subcategory = currentSubcategory;
        }
        if (currentSearch) {
          params.search = currentSearch;
        }
        if (inStockOnly) {
          params.inStock = true;
        }

        const res = await productService.getAll(params);
        setProducts(res.data || []);
        setTotal(res.total || 0);
        setTotalPages(res.totalPages || 1);
      } catch (err) {
        console.error('Failed to load products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [currentCategory, currentSubcategory, currentSearch, currentSort, currentPage, inStockOnly]);

  const handleCategorySelect = (categoryName: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (categoryName === 'All Products') {
      newParams.delete('category');
    } else {
      newParams.set('category', categoryName);
    }
    newParams.delete('subcategory');
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleSubcategorySelect = (subName: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (subName === 'All') {
      newParams.delete('subcategory');
    } else {
      newParams.set('subcategory', subName);
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('sort', e.target.value);
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (searchInput.trim()) {
      newParams.set('search', searchInput.trim());
    } else {
      newParams.delete('search');
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const clearAllFilters = () => {
    setSearchParams(new URLSearchParams());
    setSearchInput('');
    setInStockOnly(false);
  };

  const hasActiveFilters =
    currentCategory !== 'All Products' ||
    !!currentSearch ||
    (!!currentSubcategory && currentSubcategory !== 'All') ||
    inStockOnly;

  const goToPage = (pageNum: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', pageNum.toString());
    setSearchParams(newParams);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const allCategories = [{ name: 'All Products', count: total }, ...categories];

  const filterChipClass =
    'inline-flex items-center gap-1.5 rounded-full border border-[#E8DFD0] bg-white py-1 pl-3 pr-1.5 text-[11px] font-medium text-[#13382B]';
  const chipCloseClass =
    'flex h-5 w-5 items-center justify-center rounded-full text-[#687770] transition-colors hover:bg-[#13382B] hover:text-white';

  return (
    <div className="w-full bg-[#FAF8F5] pb-24">
      {/* 1. SHOP HERO BANNER */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#F0ECE4] via-[#F4EFEB] to-[#EBE4D8] border-b border-[#EDE8E1] py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid gap-10 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div className="space-y-5 text-center md:text-left">
            <nav
              aria-label="Breadcrumb"
              className="inline-flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#3F6352]"
            >
              <span className="h-px w-8 bg-[#3F6352]" />
              <span>Home</span>
              <span className="text-[#A68962]">/</span>
              <span className={currentCategory === 'All Products' ? 'text-[#13382B]' : ''}>Shop</span>
              {currentCategory !== 'All Products' && (
                <>
                  <span className="text-[#A68962]">/</span>
                  <span className="text-[#13382B]">{currentCategory}</span>
                </>
              )}
            </nav>
            <h1 className="font-serif text-4xl font-normal leading-[1.05] text-[#13382B] sm:text-6xl">
              {currentCategory === 'All Products' ? (
                <>
                  Shop Our <em className="text-[#A68962]">Skincare</em>
                </>
              ) : (
                currentCategory
              )}
            </h1>
            <p className="mx-auto max-w-md text-sm leading-relaxed text-[#56645D] sm:text-base md:mx-0">
              Discover clean, cellular formulations crafted with potent active botanicals and verified clinical purity.
            </p>
            <div className="flex items-center justify-center gap-6 pt-1 md:justify-start">
              <div>
                <p className="font-serif text-2xl text-[#13382B]">{total}</p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#687770]">Formulations</p>
              </div>
              <span className="h-8 w-px bg-[#E0D7C9]" />
              <div>
                <p className="font-serif text-2xl text-[#13382B]">{categories.length}</p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#687770]">Categories</p>
              </div>
            </div>
          </div>

          <div className="relative mx-auto w-64 sm:w-80 md:mx-0">
            <div className="aspect-[4/3] overflow-hidden rounded-2xl border border-white/80 shadow-xl shadow-[#13382B]/10">
              <img
                src="/images/home/productpage.png"
                alt="Hydra Skincare Formulation"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-4 -left-4 flex items-center gap-2 rounded-full border border-[#E8DFD0] bg-white px-4 py-2 shadow-lg">
              <Sparkles className="h-3.5 w-3.5 text-[#A68962]" />
              <span className="text-[11px] font-medium text-[#13382B]">Clean &amp; clinically tested</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. FILTER & CATALOG BODY */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        {/* Mobile Category Chips */}
        <div className="mb-5 lg:hidden">
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#3F6352]">
            <Filter className="h-3.5 w-3.5" /> Categories
          </p>
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none">
            {allCategories.map((cat) => {
              const isSelected = currentCategory.toLowerCase() === cat.name.toLowerCase();
              return (
                <button
                  key={cat.name}
                  onClick={() => handleCategorySelect(cat.name)}
                  className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs font-medium transition-colors ${
                    isSelected
                      ? 'border-[#13382B] bg-[#13382B] text-white'
                      : 'border-[#E8DFD0] bg-white text-[#56645D] hover:border-[#13382B]/40'
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Top Control Bar */}
        <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-[#EDE8E1] bg-white p-3 shadow-sm md:flex-row md:items-center md:justify-between">
          {/* Dynamic Subcategory Pills */}
          <div className="flex w-full items-center gap-1 overflow-x-auto scrollbar-none md:w-auto">
            {subcategories.map((sub) => {
              const isSelected =
                (currentSubcategory === sub) ||
                (currentSubcategory === '' && sub === 'All') ||
                (!currentSubcategory && sub === 'All');

              return (
                <button
                  key={sub}
                  onClick={() => handleSubcategorySelect(sub)}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-[#13382B] text-white shadow-sm'
                      : 'text-[#56645D] hover:bg-[#FAF8F5] hover:text-[#13382B]'
                  }`}
                >
                  {sub}
                </button>
              );
            })}
          </div>

          {/* Search & Sort Controls */}
          <div className="flex w-full items-center justify-end gap-2 md:w-auto">
            <form onSubmit={handleSearchSubmit} className="relative flex-1 md:w-60">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#687770]" />
              <input
                type="text"
                placeholder="Search formulations..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="h-10 w-full rounded-full border border-[#EDE8E1] bg-[#FAF8F5] pl-10 pr-4 text-xs text-[#13382B] placeholder:text-[#8A968F] transition-colors focus:border-[#13382B] focus:bg-white focus:outline-none"
              />
            </form>

            {/* Sort Select */}
            <label className="relative flex h-10 items-center gap-2 rounded-full border border-[#EDE8E1] bg-[#FAF8F5] pl-4 pr-9 text-xs text-[#687770] transition-colors focus-within:border-[#13382B]">
              <SlidersHorizontal className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="sr-only">Sort products</span>
              <select
                value={currentSort}
                onChange={handleSortChange}
                className="cursor-pointer appearance-none bg-transparent text-xs font-medium text-[#13382B] focus:outline-none"
              >
                <option value="popular">Popular</option>
                <option value="newest">Newest Arrivals</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3.5 h-3.5 w-3.5" />
            </label>
          </div>
        </div>

        {/* Content Layout: Categories Sidebar + Product Grid */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          {/* Desktop Left Sidebar: Dynamic Categories & Filters */}
          <aside className="hidden lg:col-span-3 lg:block">
            <div className="sticky top-36 space-y-5">
              {/* Dynamic Categories Box */}
              <div className="rounded-2xl border border-[#EDE8E1] bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-end justify-between border-b border-[#EDE8E1] pb-4">
                  <h3 className="font-serif text-xl font-normal text-[#13382B]">Categories</h3>
                  <span className="text-[10px] uppercase tracking-[0.18em] text-[#687770]">{total} available</span>
                </div>
                <ul className="space-y-0.5 text-[13px]">
                  {allCategories.map((cat) => {
                    const isSelected = currentCategory.toLowerCase() === cat.name.toLowerCase();
                    return (
                      <li key={cat.name}>
                        <button
                          onClick={() => handleCategorySelect(cat.name)}
                          className={`relative flex w-full items-center justify-between rounded-lg py-2.5 pl-4 pr-3 text-left transition-colors ${
                            isSelected
                              ? 'bg-[#EAF1EB] font-semibold text-[#13382B]'
                              : 'text-[#56645D] hover:bg-[#FAF8F5] hover:text-[#13382B]'
                          }`}
                        >
                          <span
                            className={`absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-[#13382B] transition-opacity ${
                              isSelected ? 'opacity-100' : 'opacity-0'
                            }`}
                          />
                          <span className="flex items-center gap-2">
                            {cat.name}
                            {isSelected && <Check className="h-3.5 w-3.5 text-[#A68962]" />}
                          </span>
                          <span
                            className={`min-w-[1.75rem] rounded-full px-2 py-0.5 text-center text-[10px] font-medium ${
                              isSelected ? 'bg-[#13382B] text-white' : 'bg-[#FAF8F5] text-[#687770]'
                            }`}
                          >
                            {cat.count}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* In Stock Toggle */}
              <div className="rounded-2xl border border-[#EDE8E1] bg-white p-5 shadow-sm">
                <label className="flex cursor-pointer items-center justify-between gap-4">
                  <span>
                    <span className="block text-[13px] font-semibold text-[#13382B]">In Stock Only</span>
                    <span className="block text-[11px] text-[#687770]">Hide sold-out formulations</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                    className="peer sr-only"
                  />
                  <span className="relative h-6 w-11 flex-shrink-0 rounded-full bg-[#E8DFD0] transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:bg-[#13382B] peer-checked:after:translate-x-5 peer-focus-visible:ring-2 peer-focus-visible:ring-[#13382B] peer-focus-visible:ring-offset-2" />
                </label>
              </div>

              {/* Botanical Guarantee Banner */}
              <div className="relative overflow-hidden rounded-2xl bg-[#13382B] p-6 text-white shadow-sm">
                <Sparkles className="absolute -right-3 -top-3 h-20 w-20 text-white/5" />
                <div className="flex items-center gap-2 text-[#C5A880]">
                  <Sparkles className="h-4 w-4" />
                  <p className="font-serif text-base">Cellular Purity Guarantee</p>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-[#A2B997]">
                  Zero parabens, artificial dyes, harsh sulfates, or mineral oils. Sustainably packaged in UV-protective glass.
                </p>
              </div>
            </div>
          </aside>

          {/* Right Product Grid */}
          <div className="lg:col-span-9">
            {/* Results header */}
            <div className="mb-6 flex flex-col gap-3 border-b border-[#EDE8E1] pb-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-[#687770]">
                {loading ? (
                  'Loading formulations…'
                ) : (
                  <>
                    Showing <span className="font-semibold text-[#13382B]">{products.length}</span> of{' '}
                    <span className="font-semibold text-[#13382B]">{total}</span> products
                  </>
                )}
              </p>

              {/* In Stock toggle for smaller screens */}
              <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-[#13382B] lg:hidden">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="h-4 w-4 cursor-pointer rounded text-[#13382B] focus:ring-[#13382B]"
                />
                In Stock Only
              </label>
            </div>

            {/* Active Filters display */}
            {hasActiveFilters && (
              <div className="mb-6 flex flex-wrap items-center gap-2">
                <span className="mr-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#3F6352]">Filters</span>
                {currentCategory !== 'All Products' && (
                  <span className={filterChipClass}>
                    {currentCategory}
                    <button onClick={() => handleCategorySelect('All Products')} className={chipCloseClass} aria-label="Remove category filter">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {currentSubcategory && currentSubcategory !== 'All' && (
                  <span className={filterChipClass}>
                    {currentSubcategory}
                    <button onClick={() => handleSubcategorySelect('All')} className={chipCloseClass} aria-label="Remove subcategory filter">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {currentSearch && (
                  <span className={filterChipClass}>
                    "{currentSearch}"
                    <button
                      onClick={() => {
                        const p = new URLSearchParams(searchParams);
                        p.delete('search');
                        setSearchParams(p);
                        setSearchInput('');
                      }}
                      className={chipCloseClass}
                      aria-label="Remove search filter"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {inStockOnly && (
                  <span className={filterChipClass}>
                    In Stock Only
                    <button onClick={() => setInStockOnly(false)} className={chipCloseClass} aria-label="Remove in-stock filter">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                <button
                  onClick={clearAllFilters}
                  className="ml-1 text-[11px] font-semibold text-[#A68962] underline-offset-4 hover:text-[#13382B] hover:underline"
                >
                  Clear all
                </button>
              </div>
            )}

            {/* Products Grid */}
            {loading ? (
              <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse rounded-2xl border border-[#EDE8E1] bg-white p-4">
                    <div className="aspect-square rounded-xl bg-[#F4F0EB]" />
                    <div className="mt-4 h-3 w-1/3 rounded-full bg-[#F4F0EB]" />
                    <div className="mt-3 h-4 w-3/4 rounded-full bg-[#F4F0EB]" />
                    <div className="mt-3 h-4 w-1/4 rounded-full bg-[#F4F0EB]" />
                  </div>
                ))}
              </div>
            ) : products.length > 0 ? (
              <>
                <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                  {products.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="mt-16 flex items-center justify-center gap-2 border-t border-[#EDE8E1] pt-8">
                    <button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage <= 1}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-[#EDE8E1] bg-white text-[#13382B] transition-colors hover:border-[#13382B] disabled:pointer-events-none disabled:opacity-40"
                      aria-label="Previous page"
                    >
                      <ChevronDown className="h-4 w-4 rotate-90" />
                    </button>
                    {[...Array(totalPages)].map((_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => goToPage(pageNum)}
                          aria-current={currentPage === pageNum ? 'page' : undefined}
                          className={`h-10 w-10 rounded-full text-xs font-semibold transition-all ${
                            currentPage === pageNum
                              ? 'bg-[#13382B] text-white shadow-md'
                              : 'border border-[#EDE8E1] bg-white text-[#56645D] hover:border-[#13382B] hover:text-[#13382B]'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-[#EDE8E1] bg-white text-[#13382B] transition-colors hover:border-[#13382B] disabled:pointer-events-none disabled:opacity-40"
                      aria-label="Next page"
                    >
                      <ChevronDown className="h-4 w-4 -rotate-90" />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-2xl border border-[#EDE8E1] bg-white px-6 py-16 text-center shadow-sm">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#EAF1EB] text-[#13382B]">
                  <Search className="h-7 w-7" />
                </div>
                <h3 className="font-serif text-2xl font-normal text-[#13382B]">
                  No Skincare Formulations Found
                </h3>
                <p className="mx-auto mt-2 max-w-sm text-sm text-[#687770]">
                  We couldn't find any products matching your current filters. Try resetting or selecting another category.
                </p>
                <button
                  onClick={clearAllFilters}
                  className="mt-7 rounded-full bg-[#13382B] px-7 py-3 text-xs font-semibold text-white transition-colors hover:bg-[#1E4D3B]"
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopPage;
