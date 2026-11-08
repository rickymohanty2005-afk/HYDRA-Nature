import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

export const NIGHT_INGREDIENTS = ['Retinol', 'Peptides', 'Ceramide', 'Ylang Ylang Oil'];

export const NIGHT_RITUAL = [
  { step: '01', text: 'Cleanse and pat dry.' },
  { step: '02', text: 'Apply a pea-sized amount.' },
  { step: '03', text: 'Start 2–3 nights a week.' },
];

// Both banners are transparent PNGs that sit on the shared hero backdrop.
const SLIDES = [
  {
    label: 'Day Cream',
    eyebrow: 'Natural Skincare',
    title: 'Hydra Day Cream',
    accent: 'Nourish. Protect. Glow.',
    text: 'Infused with the power of nature and advanced skincare science for healthy, radiant skin.',
    src: '/images/home/Hydra%20Day%20Cream%20Natural%20Glow.png',
    alt: 'Hydra Day Cream jar held in hand with a water splash and green leaves',
    watermark: 'Glow',
  },
  {
    label: 'The Collection',
    eyebrow: 'The Hydra 24h Collection',
    title: 'Five Steps.',
    accent: 'One Considered Ritual.',
    text: 'Face wash, day cream, matcha toner, night cream and SPF 50 — made to work together.',
    src: '/images/home/Hydra24n%20Skincare%20Collection%20Layout.png',
    alt: 'Hydra 24h face wash, day cream, matcha face toner, night cream and sunscreen',
    watermark: 'Ritual',
  },
];

const TOTAL = SLIDES.length;
const AUTOPLAY_MS = 7000;
const SWIPE_PX = 50;

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E9AA3]';

const STYLES = `
@keyframes hhc-fill { from { transform: scaleX(0) } to { transform: scaleX(1) } }
@keyframes hhc-float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-10px) } }
.hhc-slide { transition: opacity 1s cubic-bezier(.22,1,.36,1), transform 1.2s cubic-bezier(.22,1,.36,1), filter 1s ease }
.hhc-slide[data-active="false"] { opacity: 0; transform: translateY(18px) scale(.97); filter: blur(6px); pointer-events: none }
.hhc-slide[data-active="true"] { opacity: 1; transform: none; filter: none }
.hhc-copy > * { transition: opacity .8s ease, transform .9s cubic-bezier(.22,1,.36,1) }
.hhc-slide[data-active="false"] .hhc-copy > * { opacity: 0; transform: translateY(12px) }
.hhc-slide[data-active="true"] .hhc-copy > :nth-child(2) { transition-delay: .08s }
.hhc-slide[data-active="true"] .hhc-copy > :nth-child(3) { transition-delay: .16s }
.hhc-slide[data-active="true"] .hhc-copy > :nth-child(4) { transition-delay: .24s }
.hhc-float { animation: hhc-float 7s ease-in-out infinite }
.hhc-fill { transform-origin: left; animation: hhc-fill ${AUTOPLAY_MS}ms linear both }
@media (prefers-reduced-motion: reduce) {
  .hhc-slide, .hhc-copy > * { transition-duration: 1ms !important; transition-delay: 0s !important }
  .hhc-float { animation: none }
  .hhc-fill { animation: none; transform: scaleX(1) }
}
`;

export const HomeHeroCarousel: React.FC = () => {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);

  const go = (target: number) => setActive((target + TOTAL) % TOTAL);
  const next = () => go(active + 1);
  const prev = () => go(active - 1);

  useEffect(() => {
    if (paused) return;
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setTimeout(() => setActive((i) => (i + 1) % TOTAL), AUTOPLAY_MS);
    return () => window.clearTimeout(id);
  }, [active, paused]);

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
    if (Math.abs(delta) > SWIPE_PX) (delta < 0 ? next : prev)();
  };

  return (
    // Top padding clears the fixed, transparent navbar that floats over this section
    <section className="relative isolate overflow-hidden bg-white pt-[7.5rem] text-[#04282B] sm:pt-[8.5rem] lg:flex lg:h-[100svh] lg:min-h-[640px] lg:flex-col lg:pt-[8.25rem]">
      <style>{STYLES}</style>
      <h1 className="sr-only">Hydra Day Cream: Nourish. Protect. Glow.</h1>

      {/* ---------- BACKDROP: soft aqua + mint light behind the transparent banners ---------- */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#EAF7F7_0%,#F7FCFC_45%,#FFFFFF_100%)]" />
        <div className="absolute -right-32 -top-40 h-[38rem] w-[38rem] rounded-full bg-[#9FE3E7]/35 blur-[110px]" />
        <div className="absolute -left-40 top-1/3 h-[30rem] w-[30rem] rounded-full bg-[#D6EFD9]/60 blur-[110px]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white to-transparent" />
        {SLIDES.map(({ watermark }, i) => (
          <span
            key={watermark}
            className={`absolute bottom-6 left-1/2 -translate-x-1/2 select-none whitespace-nowrap font-serif text-[22vw] italic leading-none text-[#1E9AA3]/[0.06] transition-opacity duration-1000 ${
              active === i ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {watermark}
          </span>
        ))}
      </div>

      <div
        className="relative mx-auto w-full max-w-[1440px] px-4 sm:px-8 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col lg:px-12"
        role="region"
        aria-roledescription="carousel"
        aria-label="Hydra skincare highlights"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        onKeyDown={handleKeyDown}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* ---------- STAGE: slides stacked in one grid cell and crossfaded ---------- */}
        <div className="grid lg:min-h-0 lg:flex-1">
          {/* Slide 1 — the banner carries its own copy on tablet/desktop */}
          <div
            className="hhc-slide [grid-area:1/1] lg:self-center"
            data-active={active === 0}
            role="group"
            aria-roledescription="slide"
            aria-label={`Slide 1 of ${TOTAL}: ${SLIDES[0].label}`}
            aria-hidden={active !== 0}
          >
            <SlideCopy slide={SLIDES[0]} className="sm:hidden" tabbable={active === 0} />
            <Link
              to="/shop"
              tabIndex={active === 0 ? 0 : -1}
              aria-label="Explore the Hydra Day Cream"
              className={`relative mt-6 block rounded-3xl sm:mt-0 ${focusRing}`}
            >
              <img
                src={SLIDES[0].src}
                alt={SLIDES[0].alt}
                className="hhc-float mx-auto aspect-[5/4] w-full object-cover object-[82%_center] drop-shadow-[0_30px_40px_rgba(4,40,43,0.12)] sm:aspect-[1951/806] sm:object-contain lg:max-h-[calc(100svh-15rem)] lg:w-auto"
                {...{ fetchpriority: 'high' }}
                draggable={false}
              />
            </Link>
          </div>

          {/* Slide 2 — collection image has no copy, so the headline sits above it */}
          <div
            className="hhc-slide flex flex-col items-center [grid-area:1/1] lg:self-center"
            data-active={active === 1}
            role="group"
            aria-roledescription="slide"
            aria-label={`Slide 2 of ${TOTAL}: ${SLIDES[1].label}`}
            aria-hidden={active !== 1}
          >
            <SlideCopy slide={SLIDES[1]} centered tabbable={active === 1} />
            <Link
              to="/shop"
              tabIndex={-1}
              aria-hidden="true"
              className="relative mt-4 block w-full max-w-[1100px] sm:-mt-2 lg:mt-2 lg:w-auto"
            >
              <img
                src={SLIDES[1].src}
                alt={SLIDES[1].alt}
                loading="lazy"
                className="w-full object-contain drop-shadow-[0_30px_40px_rgba(4,40,43,0.14)] lg:max-h-[calc(100svh-27rem)] lg:w-auto"
                draggable={false}
              />
              {/* Soft floor shadow to ground the products */}
              <span
                className="absolute inset-x-[8%] -bottom-3 -z-10 h-10 rounded-[100%] bg-[#04282B]/15 blur-2xl"
                aria-hidden="true"
              />
            </Link>
          </div>
        </div>

        {/* ---------- CONTROLS: numbered tabs with progress + arrows ---------- */}
        <div className="relative z-10 mt-6 flex items-center justify-between gap-4 pb-10 sm:mt-8 lg:mt-4 lg:pb-8">
          <div className="flex flex-1 gap-3 sm:max-w-md sm:gap-5" role="group" aria-label="Choose a carousel slide">
            {SLIDES.map(({ label }, i) => {
              const isActive = active === i;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => go(i)}
                  aria-label={`Show slide ${i + 1}: ${label}`}
                  aria-current={isActive ? 'true' : undefined}
                  className={`group flex-1 rounded-md pt-1 text-left ${focusRing}`}
                >
               
              
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={prev}
              aria-label="Previous slide"
              className={`flex h-11 w-11 items-center justify-center rounded-full border border-[#04282B]/15 bg-white/70 text-[#04282B] shadow-sm backdrop-blur transition-all hover:border-[#1E9AA3] hover:bg-[#1E9AA3] hover:text-white ${focusRing}`}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next slide"
              className={`flex h-11 w-11 items-center justify-center rounded-full bg-[#04282B] text-white shadow-lg shadow-[#04282B]/20 transition-all hover:bg-[#1E9AA3] ${focusRing}`}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

const SlideCopy: React.FC<{
  slide: (typeof SLIDES)[number];
  centered?: boolean;
  tabbable: boolean;
  className?: string;
}> = ({ slide, centered, tabbable, className = '' }) => (
  <div className={`hhc-copy ${centered ? 'mx-auto max-w-2xl text-center' : ''} ${className}`}>
    <p
      className={`flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.32em] text-[#1E9AA3] sm:text-[11px] ${
        centered ? 'justify-center' : ''
      }`}
    >
      <span className="h-px w-8 bg-[#1E9AA3]/60" aria-hidden="true" />
      {slide.eyebrow}
      {centered && <span className="h-px w-8 bg-[#1E9AA3]/60" aria-hidden="true" />}
    </p>
    <h2 className="mt-4 font-serif text-[2.1rem] leading-[1.05] text-[#04282B] sm:text-5xl lg:mt-3 lg:text-[2.75rem] xl:text-5xl">
      {slide.title} <em className="block font-serif font-normal italic text-[#1E9AA3] lg:inline">{slide.accent}</em>
    </h2>
 
 
  </div>
);
