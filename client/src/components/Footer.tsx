import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  Facebook,
  Headphones,
  Instagram,
  Landmark,
  Linkedin,
  QrCode,
  ShieldCheck,
  Smartphone,
  Truck,
  Youtube,
} from 'lucide-react';

/*
  Deep-ocean teal palette (from the sparkling water reference)
  abyss  #031F26  darkest edge
  deep   #06373F  base water
  teal   #0B5560  mid water
  glow   #1E9AA3  light shafts
  spark  #6fe4e8  sparkle highlights

  Text on this background:
  primary    white
  secondary  #D3EEEE  (body copy, links)
  muted      #A9D4D6  (small print)
*/

const trustItems = [
  { icon: Truck, title: 'Shipping across', subtitle: 'India' },
  { icon: ShieldCheck, title: '100% secure', subtitle: 'Checkout' },
  { icon: Headphones, title: 'Dedicated', subtitle: 'Customer support' },
  { icon: BadgeCheck, title: 'Genuine', subtitle: 'Verified reviews' },
];

const paymentMethods = [
  { icon: Smartphone, label: 'UPI', gradient: 'from-[#FF7A1A] via-[#F59E0B] to-[#16A34A]' },
  { icon: Landmark, label: 'Net Banking', gradient: 'from-[#2563EB] to-[#6D28D9]' },
  { icon: Banknote, label: 'Cash on Delivery', gradient: 'from-[#10B981] to-[#059669]' },
  { icon: QrCode, label: 'Scan & Pay QR', gradient: 'from-[#EC4899] to-[#8B5CF6]' },
];

const socialLinks = [
  { href: 'https://linkedin.com', label: 'LinkedIn', icon: Linkedin },
  { href: 'https://share.google/EVvTaNy0JJHQrcBSc', label: 'Facebook', icon: Facebook },
  { href: 'https://www.instagram.com/hydra24n?xtok=ZDB5MHNxZm9pdmEz', label: 'Instagram', icon: Instagram },
  { href: 'https://youtube.com/@hydra24n?si=JfSpDw6Z4-sw432J', label: 'YouTube', icon: Youtube },
];

const contactItems = [
  { label: 'Email', value: 'care@hydra24n.com', href: 'mailto:care@hydra24n.com' },
  { label: 'Phone', value: '+91 81179 69889', href: 'tel:+918117969889' },
  {
    label: 'Corporate Office',
    value: 'Shop no 3, Sector - 30E, Near Gazania Banquet, Rohtak, HR - 124001 (India)',
  },
  {
    label: 'Branch Office',
    value: 'Plot no. 4270, Ghatikia, Kalinga nagar, Khorda, Odisha - 751029',
  },
];

// Scattered light sparkles on the water surface
const sparkles =
  'radial-gradient(2px 2px at 8% 12%, rgba(190,250,252,0.9), transparent 60%),' +
  'radial-gradient(3px 3px at 22% 6%, rgba(160,240,245,0.8), transparent 60%),' +
  'radial-gradient(2px 2px at 41% 9%, rgba(200,252,255,0.9), transparent 60%),' +
  'radial-gradient(3px 3px at 57% 4%, rgba(170,245,250,0.85), transparent 60%),' +
  'radial-gradient(2px 2px at 66% 14%, rgba(200,252,255,0.8), transparent 60%),' +
  'radial-gradient(4px 4px at 78% 7%, rgba(180,248,252,0.9), transparent 60%),' +
  'radial-gradient(2px 2px at 88% 18%, rgba(200,252,255,0.85), transparent 60%),' +
  'radial-gradient(3px 3px at 95% 5%, rgba(170,245,250,0.8), transparent 60%),' +
  'radial-gradient(2px 2px at 3% 48%, rgba(170,245,250,0.6), transparent 60%),' +
  'radial-gradient(2px 2px at 97% 42%, rgba(170,245,250,0.6), transparent 60%),' +
  'radial-gradient(2px 2px at 14% 88%, rgba(240,200,190,0.45), transparent 60%),' +
  'radial-gradient(2px 2px at 52% 94%, rgba(240,200,190,0.4), transparent 60%),' +
  'radial-gradient(2px 2px at 86% 90%, rgba(240,200,190,0.45), transparent 60%)';

export const Footer: React.FC = () => {
  const cardClass =
    'rounded-2xl border border-white/15 bg-white/[0.07] p-8 shadow-[0_20px_50px_-20px_rgba(2,20,25,0.8)] backdrop-blur-xl';
  const policyLinkClass = 'text-sm text-[#D3EEEE] hover:text-white transition-colors';

  return (
    <footer className="relative isolate overflow-hidden bg-[#06373F] text-white pt-20 pb-8">
      {/* ---------- Background: deep sparkling water ---------- */}
      <div
        className="absolute inset-0 -z-30"
        style={{
          background:
            'radial-gradient(ellipse 70% 45% at 50% -5%, #1E9AA3 0%, rgba(30,154,163,0) 70%),' +
            'radial-gradient(ellipse 45% 40% at 85% 10%, rgba(64,190,198,0.55) 0%, rgba(64,190,198,0) 70%),' +
            'radial-gradient(ellipse 50% 50% at 10% 40%, rgba(11,85,96,0.9) 0%, rgba(11,85,96,0) 70%),' +
            'linear-gradient(180deg, #0B5560 0%, #06373F 45%, #031F26 100%)',
        }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 -z-20 opacity-90" style={{ background: sparkles }} aria-hidden="true" />
      {/* Soft caustic glows */}
      <div
        className="absolute -top-32 left-1/4 -z-20 h-[280px] w-[520px] rounded-full bg-[#7FE6EA]/20 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-32 right-0 -z-20 h-[260px] w-[480px] rounded-full bg-[#C98F86]/10 blur-3xl"
        aria-hidden="true"
      />
      {/* Edge vignette keeps the cards readable */}
      <div
        className="absolute inset-0 -z-10"
        style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(3,31,38,0.55) 100%)' }}
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ---------- Trust strip ---------- */}
        <ul className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pb-10">
          {trustItems.map(({ icon: Icon, title, subtitle }) => (
            <li
              key={title}
              className="group flex items-center gap-3 rounded-2xl border border-white/15 bg-white/[0.07] px-4 py-4 backdrop-blur-xl shadow-[0_12px_30px_-16px_rgba(2,20,25,0.8)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/[0.12] hover:border-white/30"
            >
              <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-white text-[#031F26] shadow-md transition-transform duration-300 group-hover:scale-105">
                <Icon className="h-5 w-5" strokeWidth={2} />
              </span>
              <span className="leading-tight">
                <span className="block text-sm font-bold text-white">{title}</span>
                <span className="block text-xs text-[#D3EEEE]">{subtitle}</span>
              </span>
            </li>
          ))}
        </ul>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 lg:gap-10">
          {/* ---------- Brand ---------- */}
          <div className={`${cardClass} lg:col-span-4 flex flex-col`}>
            <Link to="/" className="inline-flex" aria-label="Hydra home">
              <img
                src="/images/home/Logo.png"
                alt="Hydra Professional Beauty"
                className="h-auto w-44 object-contain [filter:brightness(0)_invert(1)] sm:w-52"
              />
            </Link>
            <p className="mt-6 text-[15px] leading-relaxed text-white/95 max-w-sm">
              We don't just manufacture products, we create confidence and serve solutions through innovation,
              care, quality, and excellence in every drop
            </p>
            <div className="mt-8 flex items-center gap-4">
              {socialLinks.map(({ href, label, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#031F26] shadow-md transition-transform hover:-translate-y-0.5 hover:scale-105"
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* ---------- Careers ---------- */}
          <div className={`${cardClass} lg:col-span-3 flex flex-col`}>
            <h4 className="text-2xl font-bold tracking-wide text-white">Careers</h4>
            <Link
              to="/career"
              className="mt-6 inline-flex w-fit items-center gap-2 rounded-md bg-white px-6 py-3 text-sm font-bold text-[#031F26] shadow-md transition-colors hover:bg-[#E3F7F7]"
            >
              Apply For Jobs
              <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="mt-6 text-[15px] leading-relaxed text-[#D3EEEE]">
              Passionate about skincare? Join our growing team and build your future with us.
            </p>
           
          </div>

          {/* ---------- Get In Touch ---------- */}
          <div className={`${cardClass} md:col-span-2 lg:col-span-5`}>
            <h4 className="text-2xl font-bold tracking-wide text-white">Get In Touch</h4>
            <dl className="mt-6 space-y-5">
              {contactItems.map(({ label, value, href }) => (
                <div key={label}>
                  <dt className="text-[15px] font-bold text-white">{label}:</dt>
                  <dd className="mt-1 text-[15px] leading-relaxed text-[#D3EEEE]">
                    {href ? (
                      <a href={href} className="hover:text-white transition-colors">
                        {value}
                      </a>
                    ) : (
                      value
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* ---------- Payments ---------- */}
        <div className="mt-10 flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-8">
          <div className="flex items-center justify-between gap-4 lg:flex-col lg:items-start lg:gap-1 flex-shrink-0">
            <h4 className="text-lg font-bold tracking-wide text-white">We Accept</h4>
            <span className="flex items-center gap-1.5 text-xs text-[#D3EEEE]">
              <ShieldCheck className="h-3.5 w-3.5 text-[#7FE6EA]" />
              100% secure payments
            </span>
          </div>
          <ul className="grid flex-1 grid-cols-2 sm:grid-cols-4 gap-3">
            {paymentMethods.map(({ icon: Icon, label, gradient }) => (
              <li
                key={label}
                className="flex items-center gap-2.5 rounded-xl bg-white px-3 py-2.5 shadow-[0_8px_24px_-12px_rgba(2,20,25,0.8)] transition-transform duration-300 hover:-translate-y-0.5"
              >
                <span
                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${gradient} text-white shadow-sm`}
                >
                  <Icon className="h-4 w-4" strokeWidth={2.2} />
                </span>
                <span className="text-xs font-semibold leading-tight text-[#031F26]">{label}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* ---------- Bottom bar ---------- */}
        <div className="mt-10 pt-6 border-t border-white/15 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#A9D4D6]">
          <p>© 2026 HYDRA24n. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <Link to="/privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <span aria-hidden="true">•</span>
            <Link to="/shipping" className="hover:text-white transition-colors">
              Shipping Policy
            </Link>
            <span aria-hidden="true">•</span>
              <Link to="/returns" className={policyLinkClass}>
                Return and Refund Policy
              </Link>
              <span aria-hidden="true">•</span>
              <Link to="/terms" className={policyLinkClass}>
                Terms and Conditions
              </Link>
          
          </div>
        </div>
      </div>
    </footer>
  );
};
