import React, { useState } from 'react';
import { Phone, Mail, MapPin, ArrowRight, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

const WEB3FORMS_ACCESS_KEY = 'c4703339-dfac-4280-9bfe-d11f69b2605a';

// Deep-ocean teal water, shared with the footer
const HERO_WATER =
  'radial-gradient(ellipse 70% 45% at 50% -5%, #1E9AA3 0%, rgba(30,154,163,0) 70%),' +
  'radial-gradient(ellipse 45% 40% at 85% 10%, rgba(64,190,198,0.55) 0%, rgba(64,190,198,0) 70%),' +
  'radial-gradient(ellipse 50% 50% at 10% 40%, rgba(11,85,96,0.9) 0%, rgba(11,85,96,0) 70%),' +
  'linear-gradient(180deg, #0B5560 0%, #06373F 45%, #031F26 100%)';

export const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const [loading, setLoading]         = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage]     = useState('');

  // FAQ Accordion
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const form = new FormData();
      form.append('access_key', WEB3FORMS_ACCESS_KEY);
      form.append('name',    formData.name);
      form.append('email',   formData.email);
      form.append('phone',   formData.phone);
      form.append('subject', formData.subject || 'General Skincare Inquiry — Hydra');
      form.append('message', formData.message);
      // Optional: bot-trap honeypot (Web3Forms built-in support)
      form.append('botcheck', '');

      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: form,
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage(
          'Thank you! Your message has been sent. Our skincare experts will reply within 24 hours.'
        );
        setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      } else {
        setErrorMessage(
          data.message || 'Submission failed. Please check your details and try again.'
        );
      }
    } catch {
      setErrorMessage('Network error — please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const faqs = [
    {
      q: 'Are Hydra formulations suitable for extremely sensitive skin?',
      a: 'Yes. All our products are formulated strictly without parabens, synthetic fragrances, phthalates, or harsh sulfates. They undergo dermatological patch testing on sensitive skin panels before release.',
    },
    {
      q: 'How long does express shipping take across India?',
      a: 'Orders placed before 2 PM IST are dispatched on the same business day. Delivery takes 2–4 business days for major metro cities and 4–6 days for non-metro destinations.',
    },
    {
      q: 'Can I use Hydra Glow Serum with Hydra Sunscreen Gel together?',
      a: 'Absolutely! In fact, we recommend layering the Hydra Glow Serum onto clean skin first, followed by Hydra Nourish Cream, and finishing with Hydra Sunscreen Gel as your daily daytime shield.',
    },
    {
      q: 'What is your return policy?',
      a: 'We offer an unconditional 14-day return and exchange policy if an item arrives damaged or causes an adverse dermal reaction. Contact us with your order number to initiate a return.',
    },
  ];

  return (
    <div className="w-full bg-[#FAF8F5] pb-24">
      {/* ── CONTACT HERO BANNER ───────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden bg-[#06373F] py-14 sm:py-20">
        <div className="absolute inset-0 -z-10" style={{ background: HERO_WATER }} aria-hidden="true" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center md:text-left">
          <span className="inline-flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#6FE4E8]">
            <span className="h-px w-8 bg-[#6FE4E8]/70" />
            Contact Hydra
          </span>
          <h1 className="mt-4 font-serif text-4xl font-medium leading-tight text-white sm:text-5xl lg:text-6xl">
            We're here to <em className="text-[#6FE4E8]">help.</em>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-[#D3EEEE] sm:text-base md:mx-0">
            Questions about our formulations, your skin, or an existing order? Reach out and our team will
            get back to you.
          </p>
        </div>
      </section>

      {/* ── CONTACT MAIN SECTION ──────────────────────────────────────── */}
      <section className="py-14 sm:py-20 relative overflow-hidden">
        {/* Soft background glow */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-[#EAF1EB] rounded-full blur-3xl opacity-60 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="bg-white rounded-3xl p-8 sm:p-14 border border-[#EDE8E1] shadow-xl grid grid-cols-1 lg:grid-cols-12 gap-12">

            {/* ── Left: Business Info ───────────────────────────────── */}
            <div className="lg:col-span-5 space-y-6">
              <div>
                <span className="text-xs font-semibold uppercase tracking-widest text-[#3F6352]">
                  Get In Touch
                </span>
                <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#13382B] mt-1">
                  We'd love to hear from you. Let's connect!
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-2 leading-relaxed">
                  Have questions about our botanical formulations, skin compatibility, or an
                  existing order? Our dermatological consultants are here to guide you.
                </p>
              </div>

              {/* Contact cards */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#FAF8F5] border border-[#EDE8E1]">
                  <div className="w-10 h-10 rounded-xl bg-[#EAF1EB] text-[#13382B] flex items-center justify-center flex-shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400 uppercase font-semibold">Phone Support</p>
                    <p className="text-xs sm:text-sm font-bold text-[#13382B]">+91 81179 69889</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#FAF8F5] border border-[#EDE8E1]">
                  <div className="w-10 h-10 rounded-xl bg-[#EAF1EB] text-[#13382B] flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400 uppercase font-semibold">Customer Care</p>
                    <p className="text-xs sm:text-sm font-bold text-[#13382B]"> care@hydra24n.com</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-2xl bg-[#FAF8F5] border border-[#EDE8E1]">
                  <div className="w-10 h-10 rounded-xl bg-[#EAF1EB] text-[#13382B] flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-[11px] text-gray-400 uppercase font-semibold">Corporate Office</p>
                      <a
                        href="https://www.google.com/maps/search/?api=1&query=Shop%20no%203%2C%20Sector%20-%2030E%2C%20Near%20Gazania%20Banquet%2C%20Rohtak%2C%20HR%20-%20124001%2C%20India"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs sm:text-sm font-bold text-[#13382B] hover:underline"
                      >
                        Shop no 3, Sector - 30E, Near Gazania Banquet, Rohtak, HR - 124001 (India)
                      </a>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400 uppercase font-semibold">Branch Office</p>
                      <a
                        href="https://www.google.com/maps/search/?api=1&query=Plot%20no.%204270%2C%20Ghatikia%2C%20Kalinga%20nagar%2C%20Khorda%2C%20Odisha%20-%20751029"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs sm:text-sm font-bold text-[#13382B] hover:underline"
                      >
                        Plot no. 4270, Ghatikia, Kalinga nagar, Khorda, Odisha - 751029
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Response time badge */}
              <div className="p-4 rounded-xl bg-[#EAF1EB] text-xs text-[#2E6B48] flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>Our advisors reply within 24 business hours.</span>
              </div>
            </div>

            {/* ── Right: Web3Forms Contact Form ────────────────────── */}
            <div className="lg:col-span-7 bg-[#FAF8F5] p-6 sm:p-10 rounded-2xl border border-[#EDE8E1] flex flex-col justify-between">
              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Honeypot — hidden from humans, traps bots */}
                <input type="checkbox" name="botcheck" className="hidden" aria-hidden="true" />

                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="e.g. Sneha Patel"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 text-xs bg-white border border-[#EDE8E1] rounded-xl focus:outline-none focus:border-[#13382B] transition-colors"
                  />
                </div>

                {/* Email + Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Your Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="e.g. sneha@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 text-xs bg-white border border-[#EDE8E1] rounded-xl focus:outline-none focus:border-[#13382B] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Phone Number (Optional)
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      placeholder="e.g. +91 98765 00000"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 text-xs bg-white border border-[#EDE8E1] rounded-xl focus:outline-none focus:border-[#13382B] transition-colors"
                    />
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Subject / Concern *
                  </label>
                  <input
                    type="text"
                    name="subject"
                    required
                    placeholder="e.g. Skincare routine recommendation for dry skin"
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 text-xs bg-white border border-[#EDE8E1] rounded-xl focus:outline-none focus:border-[#13382B] transition-colors"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Your Message *
                  </label>
                  <textarea
                    rows={4}
                    name="message"
                    required
                    placeholder="Please write your questions or feedback..."
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 text-xs bg-white border border-[#EDE8E1] rounded-xl focus:outline-none focus:border-[#13382B] transition-colors resize-none"
                  />
                </div>

                {/* Success alert */}
                {successMessage && (
                  <div className="p-3 bg-[#EAF1EB] text-[#2E6B48] rounded-xl text-xs font-medium flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{successMessage}</span>
                  </div>
                )}

                {/* Error alert */}
                {errorMessage && (
                  <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-medium">
                    {errorMessage}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-[#13382B] text-white rounded-full text-xs font-bold tracking-wider hover:bg-[#1E4D3B] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <span>{loading ? 'SENDING INQUIRY...' : 'SEND MESSAGE'}</span>
                  {!loading && <ArrowRight className="w-3.5 h-3.5" />}
                </button>

           
              </form>
            </div>

          </div>
        </div>
      </section>

      {/* ── FREQUENTLY ASKED QUESTIONS ────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <h2 className="font-serif text-2xl font-bold text-[#13382B] text-center mb-8">
          Frequently Asked Questions
        </h2>
        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-[#EDE8E1] overflow-hidden shadow-sm transition-all"
            >
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full px-6 py-4 flex items-center justify-between text-left"
              >
                <span className="font-serif text-sm font-bold text-[#13382B]">{faq.q}</span>
                {openFaq === idx ? (
                  <ChevronUp className="w-4 h-4 text-gray-500 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
                )}
              </button>
              {openFaq === idx && (
                <div className="px-6 pb-5 pt-2 text-xs text-gray-600 leading-relaxed border-t border-gray-100">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
