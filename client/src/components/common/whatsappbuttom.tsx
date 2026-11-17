import React, { useState } from 'react';
import { X, MessageCircle } from 'lucide-react';

interface WhatsAppButtonProps {
  phoneNumber?: string;
  defaultMessage?: string;
}

export const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({
  phoneNumber = '918117969889',
  defaultMessage = 'Hello Hydra Skincare Team! I would like to enquire about your botanical formulations and products.',
}) => {
  const [showTag, setShowTag] = useState(true);

  // Clean WhatsApp enquiry URL
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
  const encodedMessage = encodeURIComponent(defaultMessage);
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;

  return (
    <aside
      aria-label="WhatsApp customer support"
      className="fixed bottom-5 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end pointer-events-none select-none"
    >
      {/* ─── "Chat with us" Tag Bubble (Positioned Above the Button) ─── */}
      {showTag && (
        <div className="pointer-events-auto mb-3 max-w-[260px] animate-fade-in transition-all duration-300">
          <div className="relative rounded-2xl bg-white p-3.5 shadow-2xl border border-[#EDE8E1] text-[#13382B]">
            {/* Dismiss Cross Button */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowTag(false);
              }}
              aria-label="Close Chat with us tag"
              title="Close"
              className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 shadow-sm transition-colors border border-gray-200 cursor-pointer"
            >
              <X className="h-3 w-3 stroke-[2.5]" />
            </button>

            {/* Clickable Card Body linking to WhatsApp */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-2.5 text-left group"
              title="Click to chat with our skincare concierge on WhatsApp"
            >
              {/* Online Presence Indicator */}
              <div className="relative mt-1 flex-shrink-0">
                <span className="flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
              </div>

              <div>
                <p className="text-xs font-bold text-[#13382B] group-hover:text-[#25D366] transition-colors flex items-center gap-1">
                  <span>Chat with us</span>
                  <span className="text-sm">👋</span>
                </p>
                <p className="text-[11px] text-gray-500 leading-tight mt-0.5">
                  Have questions? Connect with our skincare team on WhatsApp.
                </p>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#25D366] mt-1.5 group-hover:underline">
                  <MessageCircle className="h-3 w-3" />
                  <span>Start Enquiry</span>
                </span>
              </div>
            </a>

            {/* Speech bubble downward pointer arrow */}
            <div
              className="absolute -bottom-1.5 right-6 h-3 w-3 rotate-45 bg-white border-b border-r border-[#EDE8E1]"
              aria-hidden="true"
            />
          </div>
        </div>
      )}

      {/* ─── WhatsApp Action Floating Button ─── */}
      <div className="pointer-events-auto relative group">
        {/* Subtle Pulse Ring */}
        <span
          className="absolute inset-0 rounded-full bg-[#25D366] opacity-30 animate-ping group-hover:animate-none"
          aria-hidden="true"
        />

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Enquire on WhatsApp with Hydra Skincare"
          title="Chat with us on WhatsApp for product enquiries"
          className="relative flex h-14 w-14 sm:h-15 sm:w-15 items-center justify-center rounded-full bg-[#25D366] hover:bg-[#20BD5A] text-white shadow-xl shadow-[#25D366]/40 transition-all duration-300 hover:scale-110 active:scale-95"
        >
          {/* Official WhatsApp Logo SVG */}
          <svg
            className="h-8 w-8 sm:h-8 sm:w-8 fill-current drop-shadow-sm"
            viewBox="0 0 32 32"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M16.002 0C7.164 0 0 7.164 0 16.002c0 2.825.738 5.578 2.14 8.01L.07 31.93l8.13-2.132a15.93 15.93 0 0 0 7.802 2.036h.007c8.834 0 15.998-7.164 15.998-16.002 0-4.275-1.666-8.294-4.69-11.317C24.293 1.49 20.274 0 16.002 0zm0 29.336h-.006c-2.43 0-4.815-.653-6.902-1.89l-.496-.294-5.132 1.346 1.37-5.002-.323-.514c-1.36-2.164-2.077-4.67-2.077-7.242 0-7.39 6.014-13.404 13.408-13.404 3.58 0 6.945 1.395 9.476 3.928 2.532 2.532 3.926 5.898 3.926 9.48 0 7.393-6.014 13.408-13.407 13.408zm7.354-9.98c-.403-.202-2.384-1.176-2.754-1.31-.37-.135-.638-.202-.907.202-.27.404-1.042 1.31-1.277 1.58-.235.27-.47.303-.873.101-.404-.202-1.704-.628-3.245-2.003-1.198-1.07-2.007-2.39-2.242-2.794-.236-.404-.025-.622.177-.823.18-.18.403-.47.605-.706.202-.236.27-.404.404-.673.134-.27.067-.505-.034-.706-.101-.202-.907-2.187-1.244-3.003-.327-.792-.66-.684-.908-.696-.234-.012-.504-.015-.773-.015-.27 0-.706.101-1.076.505-.37.404-1.413 1.38-1.413 3.366 0 1.986 1.446 3.904 1.648 4.174.202.27 2.846 4.346 6.896 6.096.963.416 1.715.665 2.302.852.968.308 1.849.265 2.545.161.777-.116 2.384-.975 2.72-1.916.337-.942.337-1.75.236-1.918-.101-.168-.37-.27-.773-.472z" />
          </svg>
        </a>
      </div>
    </aside>
  );
};

export default WhatsAppButton;
