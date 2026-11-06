import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';

interface NetVidyaWhatsAppWidgetProps {
  phoneNumber?: string;
  defaultMessage?: string;
  hasBottomNav?: boolean;
}

export const NetVidyaWhatsAppWidget: React.FC<NetVidyaWhatsAppWidgetProps> = ({
  phoneNumber = '919638716634',
  defaultMessage = 'Hello NET Vidya, I am preparing for GSET / UGC NET English 2026 and have a query about the Final Pack.',
  hasBottomNav = true
}) => {
  const [isPromptDismissed, setIsPromptDismissed] = useState(false);
  const [isWidgetHidden, setIsWidgetHidden] = useState(() => {
    try {
      return sessionStorage.getItem('netvidya_wa_widget_hidden') === 'true';
    } catch {
      return false;
    }
  });

  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(defaultMessage)}`;

  const handleDismissWidget = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWidgetHidden(true);
    try {
      sessionStorage.setItem('netvidya_wa_widget_hidden', 'true');
    } catch {}
  };

  if (isWidgetHidden) return null;

  // Float above the mobile bottom nav bar (min-h-[64px] + safe-area) when hasBottomNav is true
  const positionClasses = hasBottomNav
    ? 'bottom-[calc(4.85rem+env(safe-area-inset-bottom,0px))] lg:bottom-6 right-3.5 sm:right-6'
    : 'bottom-4 sm:bottom-6 right-3.5 sm:right-6';

  return (
    <div className={`fixed ${positionClasses} z-40 flex flex-col items-end print:hidden max-w-[calc(100vw-2rem)] animate-fade-in`}>
      {/* Floating Prompt Card */}
      {!isPromptDismissed && (
        <div className="mb-2 bg-white rounded-xl shadow-lg border border-emerald-100 p-3 max-w-[270px] sm:max-w-xs flex items-start gap-2.5 animate-bounce-subtle">
          <div className="p-1.5 rounded-full bg-emerald-100 text-emerald-700 shrink-0">
            <MessageCircle className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <p className="font-bold text-gray-900">Have a Question?</p>
            <p className="text-gray-500 text-[11px] leading-tight mt-0.5">
              Chat directly with the NET Vidya student support desk.
            </p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-1.5 font-bold text-emerald-700 hover:text-emerald-800 text-[11px] underline"
            >
              Open WhatsApp Chat →
            </a>
          </div>
          <button
            onClick={() => setIsPromptDismissed(true)}
            className="text-gray-400 hover:text-gray-600 p-0.5 -mr-1 -mt-1"
            title="Dismiss message"
            aria-label="Dismiss message"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main WhatsApp Button with Dismiss/Cancel Badge */}
      <div className="relative group flex items-center">
        {/* Cancel / Dismiss Button on phone and desktop */}
        <button
          onClick={handleDismissWidget}
          aria-label="Hide WhatsApp button"
          title="Dismiss WhatsApp button"
          className="absolute -top-1.5 -left-1.5 z-50 w-5 h-5 rounded-full bg-gray-700 hover:bg-gray-900 text-white flex items-center justify-center text-[10px] shadow-md border border-white transition-all hover:scale-110 active:scale-95"
        >
          <X className="w-3 h-3" />
        </button>

        {/* WhatsApp Action Link */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat on WhatsApp with NET Vidya Support"
          className="relative flex items-center gap-2 sm:gap-2.5 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
          </span>

          {/* WhatsApp Icon */}
          <svg
            className="w-5 h-5 fill-current"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
          </svg>

          <span className="text-xs font-bold tracking-wide">WhatsApp Desk</span>
        </a>
      </div>
    </div>
  );
};
