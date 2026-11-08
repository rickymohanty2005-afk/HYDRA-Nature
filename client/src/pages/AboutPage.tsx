import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Leaf, FlaskConical, Shield, HeartHandshake, Award } from 'lucide-react';

const STATS = [
  { value: '2021', label: 'Founded' },
  { value: '100%', label: 'Cruelty-Free & Vegan' },
  { value: '72h', label: 'Continuous Hydration' },
  { value: '99.4%', label: 'Vitamins Preserved' },
];

const INGREDIENTS = [
  'Plant Squalane',
  'Kakadu Plum',
  'Edelweiss',
  'Hyaluronic Peptides',
  'Ectoin',
  'Matcha',
  'Ceramides',
  'Niacinamide',
];

const PILLARS = [
  {
    icon: Leaf,
    title: 'Bio-Active Botanicals',
    text: 'Cold-pressed, wild-harvested botanicals sourced ethically from certified regenerative farms.',
  },
  {
    icon: FlaskConical,
    title: 'Molecular Efficacy',
    text: 'Peer-reviewed cellular bioavailability with triple-weight hyaluronic peptides and ectoin.',
  },
  {
    icon: Shield,
    title: 'Dermatologically Safe',
    text: 'Zero parabens, phthalates, synthetic colorants, sulfates, or artificial musk.',
  },
  {
    icon: HeartHandshake,
    title: '100% Recyclable',
    text: 'Packaged in pharmaceutical amber glass with FSC-certified post-consumer biodegradable boxes.',
  },
];

const PROCESS = [
  { step: '01', title: 'Source', text: 'Botanicals harvested at peak potency from regenerative partner farms.' },
  { step: '02', title: 'Ferment', text: 'Cold-fermented at low thermal thresholds to keep cellular vitamins intact.' },
  { step: '03', title: 'Test', text: 'Every batch verified in independent third-party dermatological labs.' },
  { step: '04', title: 'Bottle', text: 'Sealed in amber glass to protect actives from light and air.' },
];

const STYLES = `
@keyframes about-marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
.about-marquee { animation: about-marquee 40s linear infinite }
@media (prefers-reduced-motion: reduce) { .about-marquee { animation: none } }
`;

// Deep-ocean teal water, shared with the footer
const HERO_WATER =
  'radial-gradient(ellipse 70% 45% at 50% -5%, #1E9AA3 0%, rgba(30,154,163,0) 70%),' +
  'radial-gradient(ellipse 45% 40% at 85% 10%, rgba(64,190,198,0.55) 0%, rgba(64,190,198,0) 70%),' +
  'radial-gradient(ellipse 50% 50% at 10% 40%, rgba(11,85,96,0.9) 0%, rgba(11,85,96,0) 70%),' +
  'linear-gradient(180deg, #0B5560 0%, #06373F 45%, #031F26 100%)';

// Desktop: each section fills one screen below the sticky navbar (~7.5rem)
const FRAME = 'lg:min-h-[calc(100svh-7.5rem)]';

const Eyebrow: React.FC<{ children: React.ReactNode; light?: boolean }> = ({ children, light }) => (
  <span
    className={`inline-flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.3em] ${
      light ? 'text-[#6FE4E8]' : 'text-[#3F6352]'
    }`}
  >
    <span className={`h-px w-8 ${light ? 'bg-[#6FE4E8]/70' : 'bg-[#3F6352]'}`} />
    {children}
  </span>
);

export const AboutPage: React.FC = () => {
  return (
    <div className="w-full bg-[#FAF8F5] text-[#13382B]">
      <style>{STYLES}</style>

      {/* 1. HERO */}
      <section className="relative isolate bg-[#06373F] text-white">
        <div className="absolute inset-0 -z-10" style={{ background: HERO_WATER }} aria-hidden="true" />
        <div className="mx-auto w-full max-w-[1440px] px-4 pt-14 sm:px-8 sm:pt-20 lg:px-12 lg:pt-10">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-end">
            <div>
              <span className="inline-flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#6FE4E8]">
                <span className="h-px w-8 bg-[#6FE4E8]/70" />
                About Hydra
              </span>
              <h1 className="mt-6 font-serif text-5xl font-normal leading-[1.02] sm:text-6xl xl:text-7xl">
                Nature, refined
                <br />
                by <em className="text-[#6FE4E8]">science.</em>
              </h1>
            </div>
            <div className="space-y-6 lg:pb-3">
              <p className="max-w-md text-sm leading-relaxed text-[#D3EEEE] sm:text-base">
                Our journey towards natural, effective and sustainable skincare. We believe in the power of
                nature and the science of skincare.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href="#our-story"
                  className="group inline-flex items-center gap-2 rounded-md bg-white px-6 py-3 text-sm font-medium text-[#031F26] transition-all hover:bg-[#D3EEEE] hover:shadow-[0_10px_30px_-10px_rgba(111,228,232,0.8)]"
                >
                  Our Story
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </a>
                <Link
                  to="/shop"
                  className="inline-flex items-center gap-2 rounded-md border border-white/30 px-6 py-3 text-sm font-medium text-white transition-colors hover:border-white hover:bg-white/10"
                >
                  Shop the Range
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Wide image with overlapping stats */}
        <div className="mx-auto mt-12 w-full max-w-[1440px] px-4 sm:px-8 lg:mt-10 lg:px-12">
          <div className="relative overflow-hidden rounded-2xl border border-white/15 shadow-[0_30px_80px_-30px_rgba(2,20,25,0.8)]">
            <img
              src="/images/home/skincare%20banner%202.png"
              alt="The Hydra skincare collection on a stone pedestal"
              className="aspect-[16/9] w-full object-cover sm:aspect-[1871/660]"
            />
          </div>
        </div>
        <div className="relative z-10 mx-auto w-full max-w-[1440px] translate-y-1/2 px-4 sm:px-8 lg:px-12">
          <dl className="mx-auto grid max-w-5xl grid-cols-2 overflow-hidden rounded-2xl border border-[#E8DFD0] bg-white text-[#13382B] shadow-xl shadow-[#13382B]/5 sm:grid-cols-4">
            {STATS.map(({ value, label }, i) => (
              <div
                key={label}
                className={`px-5 py-6 text-center sm:py-8 lg:py-6 ${i > 0 ? 'sm:border-l' : ''} ${
                  i % 2 === 1 ? 'border-l' : ''
                } ${i > 1 ? 'border-t sm:border-t-0' : ''} border-[#EDE8E1]`}
              >
                <dt className="sr-only">{label}</dt>
                <dd className="font-serif text-3xl sm:text-4xl">{value}</dd>
                <dd className="mt-1 text-[11px] uppercase tracking-[0.18em] text-[#687770]">{label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* 2. OUR STORY */}
      <section
        id="our-story"
        className={`scroll-mt-32 pb-20 pt-36 sm:pb-28 sm:pt-44 lg:flex lg:items-center lg:pb-16 lg:pt-28 ${FRAME}`}
      >
        <div className="mx-auto grid w-full max-w-[1240px] gap-14 px-4 sm:px-8 lg:grid-cols-2 lg:items-center lg:gap-20">
          {/* Image collage */}
          <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
            <div className="aspect-[4/5] w-[78%] overflow-hidden rounded-2xl lg:aspect-auto lg:h-[min(56svh,540px)]">
              <img src="/images/home/care_model.png" alt="Hydra skincare care ritual" className="h-full w-full object-cover" />
            </div>
            <div className="absolute bottom-[-8%] right-0 aspect-square w-[50%] overflow-hidden rounded-2xl border-[6px] border-[#FAF8F5] shadow-xl">
              <img src="/images/home/petri_dropper.jpg" alt="Formulation research in the Hydra lab" className="h-full w-full object-cover" />
            </div>
            <div className="absolute left-[62%] top-8 hidden rounded-full bg-[#0C241B] px-5 py-5 text-center text-white shadow-xl sm:block">
              <p className="font-serif text-2xl leading-none text-[#C5A880]">3</p>
              <p className="mt-1 text-[9px] uppercase tracking-[0.2em] text-white/70">Years R&amp;D</p>
            </div>
          </div>

          <div className="space-y-6 lg:space-y-5">
            <Eyebrow>Our Foundation</Eyebrow>
            <h2 className="font-serif text-4xl font-normal leading-[1.1] sm:text-5xl lg:text-[44px]">
              Where botanical wisdom meets <em className="text-[#3F6352]">molecular precision.</em>
            </h2>
            <p className="text-sm leading-relaxed text-[#56645D] sm:text-base">
              Founded with a rebel spirit against toxic preservatives and artificial optical fillers, Hydra was
              born in 2021 from a simple yet revolutionary conviction: skincare should neither harm your body's
              endocrine system nor strip the planet's ecosystems.
            </p>
            <p className="text-sm leading-relaxed text-[#56645D] sm:text-base">
              Our team of dermatological chemists and botanical ethnopharmacologists spent 3 years perfecting our
              cold-fermentation technique. By fermenting plant squalane, Kakadu plum, and edelweiss at low thermal
              thresholds, we preserve 99.4% of the cellular vitamins intact—resulting in formulations that absorb
              within seconds and hydrate for 72 continuous hours.
            </p>
            <div className="flex items-start gap-4 rounded-xl border border-[#E8DFD0] bg-white p-5">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#0C241B] text-[#C5A880]">
                <Award className="h-5 w-5" />
              </span>
              <div>
                <p className="font-serif text-lg">The Hydra Promise</p>
                <p className="mt-0.5 text-sm text-[#687770]">
                  Every batch tested in independent third-party dermatological laboratories.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. INGREDIENT MARQUEE */}
      <section className="overflow-hidden border-y border-[#E8DFD0] bg-[#FAF8F5] py-6" aria-label="Key ingredients">
        <div className="about-marquee flex w-max items-center">
          {[...INGREDIENTS, ...INGREDIENTS].map((name, i) => (
            <span key={i} className="flex items-center gap-8 px-4 font-serif text-2xl italic text-[#13382B]/80 sm:text-3xl">
              {name}
              <span className="text-base not-italic text-[#A68962]" aria-hidden="true">✦</span>
            </span>
          ))}
        </div>
      </section>

      {/* 4. PILLARS */}
      <section className={`py-20 sm:py-28 lg:flex lg:items-center lg:py-16 ${FRAME}`}>
        <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <Eyebrow>Our Standards</Eyebrow>
              <h2 className="mt-4 max-w-xl font-serif text-4xl font-normal leading-[1.1] sm:text-5xl">
                The four pillars of every formulation.
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-[#687770]">
              What goes into a Hydra bottle is decided by four non-negotiables — and what stays out matters just
              as much.
            </p>
          </div>

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:mt-10 lg:grid-cols-4">
            {PILLARS.map(({ icon: Icon, title, text }, i) => (
              <article
                key={title}
                className="group relative flex min-h-[300px] flex-col lg:min-h-[min(300px,40svh)] justify-between overflow-hidden rounded-2xl border border-[#E8DFD0] bg-white p-7 transition-all duration-500 hover:-translate-y-1 hover:border-[#C5A880] hover:shadow-xl hover:shadow-[#13382B]/5"
              >
                <div className="flex items-start justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EAF1EB] text-[#13382B] transition-colors duration-500 group-hover:bg-[#13382B] group-hover:text-white">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="font-serif text-sm text-[#A68962]">0{i + 1}</span>
                </div>
                <div>
                  <h3 className="font-serif text-2xl leading-tight text-[#13382B]">
                    {title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#687770]">
                    {text}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 5. PROCESS */}
      <section className={`relative isolate overflow-hidden bg-[#06373F] py-20 text-white sm:py-28 lg:flex lg:items-center lg:py-14 ${FRAME}`}>
        <div className="absolute inset-0 -z-10" style={{ background: HERO_WATER }} aria-hidden="true" />
        <div
          className="absolute -right-24 top-1/3 -z-10 h-[420px] w-[420px] rounded-full bg-[#7FE6EA]/10 blur-3xl"
          aria-hidden="true"
        />
        <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-8">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center lg:gap-20">
            <div>
              <Eyebrow light>From Leaf to Bottle</Eyebrow>
              <h2 className="mt-4 font-serif text-4xl font-normal leading-[1.1] sm:text-5xl">
                A slower process, for skin that <em className="text-[#6FE4E8]">shows it.</em>
              </h2>
              <div className="mt-8 overflow-hidden rounded-2xl border border-white/15 shadow-[0_30px_80px_-30px_rgba(2,20,25,0.8)]">
                <img
                  src="/images/home/banner_nature.jpg"
                  alt="Botanicals used in Hydra formulations"
                  className="aspect-[16/10] w-full object-cover lg:aspect-auto lg:h-[min(36svh,340px)]"
                />
              </div>
            </div>

            <ol className="divide-y divide-white/10 border-y border-white/10">
              {PROCESS.map(({ step, title, text }) => (
                <li key={step} className="group grid grid-cols-[auto_1fr] gap-6 py-8 sm:gap-10 sm:py-10 lg:py-[min(2rem,3.2svh)]">
                  <span className="font-serif text-5xl leading-none text-white/20 transition-colors duration-500 group-hover:text-[#6FE4E8] sm:text-6xl lg:text-5xl">
                    {step}
                  </span>
                  <div>
                    <h3 className="font-serif text-2xl text-white sm:text-3xl lg:text-[28px]">{title}</h3>
                    <p className="mt-2 max-w-md text-sm leading-relaxed text-[#A9D4D6]">{text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* 6 + 7. FOUNDER NOTE + CTA — share one desktop frame */}
      <div className={`lg:flex lg:flex-col lg:justify-center ${FRAME}`}>
        {/* 6. FOUNDER NOTE */}
        <section className="border-t border-[#E8DFD0] bg-[#FAF8F5] py-20 sm:py-28 lg:py-14">
          <figure className="mx-auto max-w-4xl px-4 text-center sm:px-8">
            <span className="font-serif text-7xl leading-none text-[#A68962]" aria-hidden="true">
              “
            </span>
            <blockquote className="-mt-4 font-serif text-2xl font-normal leading-snug text-[#13382B] sm:text-4xl">
              True luxury is not an artificial fragrance or heavy marketing packaging. True luxury is knowing exactly
              what touches your skin every morning.
            </blockquote>
            <figcaption className="mt-8 flex flex-col items-center gap-1">
              <span className="h-px w-10 bg-[#A68962]" />
              <span className="mt-3 font-serif text-lg text-[#1A211D]">Dr. Evelyn Vance</span>
              <span className="text-xs uppercase tracking-[0.2em] text-[#687770]">
                Founder &amp; Chief Formulation Chemist
              </span>
            </figcaption>
          </figure>
        </section>

        {/* 7. CTA */}
        <section className="bg-[#FAF8F5] px-4 pb-20 sm:px-8 sm:pb-28 lg:pb-14">
          <div className="relative isolate mx-auto max-w-[1376px] overflow-hidden rounded-3xl bg-[#06373F] shadow-[0_30px_80px_-30px_rgba(3,31,38,0.7)]">
            <img
              src="/images/home/Hydra%20Skincare%20banner%203.png"
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-right"
            />
            {/* Teal water washes over the copy side and fades into the image */}
            <div
              className="absolute inset-0 [mask-image:linear-gradient(to_right,black_0%,rgba(0,0,0,0.92)_45%,rgba(0,0,0,0.25)_100%)]"
              style={{ background: HERO_WATER }}
              aria-hidden="true"
            />
            <div className="relative max-w-xl px-6 py-16 text-white sm:px-14 sm:py-24 lg:py-16">
              <Eyebrow light>Begin Your Ritual</Eyebrow>
              <h2 className="mt-4 font-serif text-4xl font-normal leading-[1.1] sm:text-5xl">
                Skincare you can read like a label.
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-[#D3EEEE] sm:text-base">
                Explore the complete Hydra range — every ingredient chosen with intention.
              </p>
              <Link
                to="/shop"
                className="group mt-8 inline-flex items-center gap-2 rounded-md bg-white px-7 py-3.5 text-sm font-medium text-[#031F26] transition-all hover:bg-[#D3EEEE] hover:shadow-[0_10px_30px_-10px_rgba(111,228,232,0.8)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#6FE4E8]"
              >
                Explore the Complete Range
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
