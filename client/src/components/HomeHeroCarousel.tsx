import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const NIGHT_INGREDIENTS = ['Retinol', 'Peptides', 'Ceramide', 'Ylang Ylang Oil'];

export const NIGHT_RITUAL = [
  { step: '01', text: 'Cleanse and pat dry.' },
  { step: '02', text: 'Apply a pea-sized amount.' },
  { step: '03', text: 'Start 2â€“3 nights a week.' },
];

const SLIDES = [
  
  {
    id: 1,
    src: '/images/home/banner1.webp',
    alt: 'Hydra Skincare Formulation Banner 1',
    link: '/shop',
  },
  {
    id: 2,
    src: '/images/home/banner2.webp',
    alt: 'Hydra Skincare Formulation Banner 2',
    link: '/shop',
  },
  {
    id: 3,
    src: '/images/home/banner3.webp',
    alt: 'Hydra Skincare Formulation Banner 3',
    link: '/shop',
  },
   {
    id: 4,
    src: '/images/home/banner4.webp',
    alt: 'Hydra Skincare Formulation Banner 4',
    link: '/shop',
  },
   {
    id: 5,
    src: '/images/home/banner5.webp',
    alt: 'Hydra Skincare Formulation Banner 5',
    link: '/shop',
  },
];

const TOTAL = SLIDES.length;
const AUTOPLAY_MS = 5000;
const SWIPE_PX = 45;

export const HomeHeroCarousel: React.FC = () => {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);

  const go = (target: number) => setActive((target + TOTAL) % TOTAL);
  const next = () => go(active + 1);
  const prev = () => go(active - 1);

  useEffect(() => {
    if (paused) return;
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    const timer = window.setInterval(() => {
      setActive((i) => (i + 1) % TOTAL);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [paused]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') prev();
    if (e.key === 'ArrowRight') next();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(delta) > SWIPE_PX) {
      if (delta < 0) next();
      else prev();
    }
  };

  return (
    <section
      className="relative w-full bg-[#FAF8F5] pt-28 sm:pt-32 lg:pt-[7.5rem] pb-4 sm:pb-8"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      role="region"
      aria-roledescription="carousel"
      aria-label="Hydra Skincare featured banners"
    >
      <div className="mx-auto w-full max-w-[1536px] px-3 sm:px-6 lg:px-8 mt-6">
        {/* Carousel Frame - Clean, rounded, no text overlays */}
        <div className="group relative overflow-hidden rounded-2xl sm:rounded-3xl border border-[#EDE8E1] bg-white shadow-sm">
          {/* Slides Stack */}
          <div className="relative w-full h-[200px] xs:h-[260px] sm:h-[360px] md:h-[450px] lg:h-[530px] xl:h-[600px] 2xl:h-[640px]">
            {SLIDES.map((slide, index) => {
              const isActive = active === index;
              return (
                <div
                  key={slide.id}
                  className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                    isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                  }`}
                  aria-hidden={!isActive}
                >
                  <Link
                    to={slide.link}
                    tabIndex={isActive ? 0 : -1}
                    className="block w-full h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#13382B]"
                    aria-label={`View collection: banner ${index + 1}`}
                  >
                    <img
                      src={slide.src}
                      alt={slide.alt}
                      className="w-full h-full object-cover object-center select-none"
                      loading={index === 0 ? 'eager' : 'lazy'}
                      fetchPriority={index === 0 ? 'high' : 'auto'}
                      decoding="async"
                      draggable={false}
                    />
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Navigation Arrows - Accessible on hover/focus */}
          <button
            type="button"
            onClick={prev}
            aria-label="Previous banner"
            className="absolute left-2.5 sm:left-4 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-white/80 hover:bg-white text-[#13382B] shadow-md border border-[#EDE8E1] transition-all duration-200 hover:scale-105 opacity-80 group-hover:opacity-100 focus:opacity-100"
          >
            <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>

          <button
            type="button"
            onClick={next}
            aria-label="Next banner"
            className="absolute right-2.5 sm:right-4 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-white/80 hover:bg-white text-[#13382B] shadow-md border border-[#EDE8E1] transition-all duration-200 hover:scale-105 opacity-80 group-hover:opacity-100 focus:opacity-100"
          >
            <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>

          {/* Bottom Indicators - Subtle dot pills */}
          <div
            className="absolute bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 sm:gap-2.5 bg-black/25 backdrop-blur-md px-3 py-1.5 rounded-full"
            role="tablist"
            aria-label="Choose banner slide"
          >
            {SLIDES.map((slide, i) => {
              const isActive = active === i;
              return (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => go(i)}
                  role="tab"
                  aria-selected={isActive}
                  aria-label={`Slide ${i + 1}`}
                  className={`transition-all duration-300 rounded-full ${
                    isActive
                      ? 'w-6 sm:w-8 h-2 sm:h-2.5 bg-white shadow-xs'
                      : 'w-2 sm:w-2.5 h-2 sm:h-2.5 bg-white/60 hover:bg-white/90'
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

