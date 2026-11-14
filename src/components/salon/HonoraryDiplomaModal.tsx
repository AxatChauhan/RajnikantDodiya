import React, { useState } from 'react';
import { X, Award, Printer, Copy, Check, Sparkles, Feather } from 'lucide-react';
import { useModalEscape } from '../../hooks/useModalEscape';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  setUserName: (name: string) => void;
}

export const HonoraryDiplomaModal: React.FC<Props> = ({
  isOpen,
  onClose,
  userName,
  setUserName
}) => {
  const [copied, setCopied] = useState(false);

  // Universal Escape key listener
  useModalEscape(isOpen, onClose);

  if (!isOpen) return null;

  const displayName = userName.trim() || 'Distinguished Salon Scholar';
  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const handlePrint = () => {
    window.print();
  };

  const handleCopyCitation = () => {
    const citation = `🎓 DIPLOMA OF HONORARY FELLOWSHIP 🎓\n\nThe Digital Literary Salon & Athenaeum\nCurated by Dr. Rajnikant Dodiya\n\nThis is to certify that:\n${displayName}\n\nHas been admitted as an HONORARY FELLOW OF THE ATHENAEUM\nIn recognition of demonstrated philosophical wit, contemplative vision, and literary creative spirit.\n\nAttested: Dr. Rajnikant S. Dodiya\nConvener, English Language Education Forum\nDate: ${currentDate}`;
    navigator.clipboard.writeText(citation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-ink/70 backdrop-blur-xs animate-fade-in overflow-y-auto"
    >
      <div className="relative w-full max-w-3xl my-auto max-h-[calc(100dvh-2rem)] overflow-y-auto bg-white rounded-3xl shadow-book-xl border-4 border-deckle-dark p-5 sm:p-8 space-y-5">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-parchment-warm hover:bg-parchment-deep text-ink-muted hover:text-ink transition-colors cursor-pointer"
          title="Close Diploma (Esc)"
          aria-label="Close Diploma (Esc)"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-deckle print:hidden">
          <div className="flex items-center gap-2 text-xs font-mono text-claret font-semibold uppercase">
            <Award className="w-4 h-4 text-brass" />
            <span>Salon Reward: Honorary Fellowship Conferred</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-lg bg-white border border-deckle hover:border-claret text-xs font-medium text-ink shadow-2xs hover:bg-parchment-warm transition-all flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>

            <button
              onClick={handleCopyCitation}
              className="px-3.5 py-1.5 rounded-lg bg-claret hover:bg-claret-light text-white text-xs font-medium shadow-xs transition-all flex items-center gap-1.5"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Citation</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* The Formal Parchment Diploma */}
        <div className="p-8 sm:p-12 rounded-2xl bg-gradient-to-b from-[#FDFBF7] via-[#FAF6EE] to-[#F5EFE3] border-4 border-double border-brass/70 text-center space-y-6 relative overflow-hidden shadow-inner">
          
          {/* Header Heraldry */}
          <div className="space-y-1.5">
            <span className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.25em] text-ink-muted font-bold block">
              The Digital Literary Salon &amp; Athenaeum
            </span>
            <span className="text-[11px] font-mono text-claret tracking-widest uppercase font-semibold block">
              Curated by Dr. Rajnikant Dodiya
            </span>
            <div className="w-16 h-0.5 bg-brass mx-auto my-2" />
          </div>

          <div>
            <h1 className="font-serif text-2xl sm:text-4xl text-ink font-normal tracking-wide">
              Honorary Fellowship of the Athenaeum
            </h1>
            <p className="font-reading text-xs sm:text-sm text-ink-muted italic mt-1">
              For distinguished engagement with rhetorical wit, poetic creation, and visionary wisdom.
            </p>
          </div>

          {/* Recipient */}
          <div className="py-2 space-y-1">
            <span className="text-xs font-mono text-ink-faint uppercase tracking-wider block">
              Be it known to all scholars that
            </span>
            <div className="inline-block relative">
              <input
                type="text"
                placeholder="Enter Your Name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="font-serif text-2xl sm:text-3xl text-claret font-bold text-center border-b-2 border-dashed border-claret/40 bg-transparent focus:outline-none focus:border-claret min-w-[280px] px-2 py-0.5"
              />
            </div>
            <span className="text-xs font-reading text-ink-muted block mt-1">
              has completed the trials of wit, contemplation, and wordcraft in the Salon.
            </span>
          </div>

          {/* Citation Body */}
          <p className="font-reading text-xs sm:text-sm text-ink-muted max-w-lg mx-auto leading-relaxed border-y border-deckle py-3">
            "To think boldly, to pierce pomposity with laughter, to nourish the dream that ignites nations, and to reverence the written word as the timeless sanctuary of human spirit."
          </p>

          {/* Signatures & Seal */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-6 max-w-xl mx-auto text-left text-xs">
            {/* Signature */}
            <div className="space-y-1 text-center sm:text-left">
              <div className="font-serif italic text-base text-ink font-medium">
                Dr. Rajnikant S. Dodiya
              </div>
              <div className="w-32 h-px bg-ink/40 mx-auto sm:mx-0" />
              <span className="text-[10px] font-mono text-ink-muted block">
                Convener, ELEF | Coordinator, CAIELE
              </span>
              <span className="text-[10px] font-mono text-ink-faint block">
                Date: {currentDate}
              </span>
            </div>

            {/* Embossed Medallion Seal */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#24416B] via-[#162A45] to-[#0A1424] border-4 border-brass flex flex-col items-center justify-center text-amber-200 shadow-md rotate-[-8deg] shrink-0">
              <Feather className="w-6 h-6 text-amber-300 mb-0.5" />
              <span className="text-[7px] font-mono uppercase font-bold tracking-tighter text-amber-200">
                OFFICIAL SEAL
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Exit Navigation */}
        <div className="pt-2 text-center print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-parchment-warm hover:bg-parchment-deep text-ink text-xs font-mono font-medium border border-deckle transition-all cursor-pointer"
          >
            ← Close Diploma &amp; Return to Salon
          </button>
        </div>

      </div>
    </div>
  );
};
