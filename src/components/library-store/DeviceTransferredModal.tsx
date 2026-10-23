import React from 'react';
import { ShieldAlert, X, RotateCcw, Smartphone, Laptop } from 'lucide-react';
import { detectDeviceType } from '../../lib/deviceSecurity';

interface DeviceTransferredModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReLogin: () => void;
}

export const DeviceTransferredModal: React.FC<DeviceTransferredModalProps> = ({
  isOpen,
  onClose,
  onReLogin
}) => {
  if (!isOpen) return null;

  const currentType = detectDeviceType();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-pure/75 backdrop-blur-xs animate-fade-in">
      <div className="folio-card bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-book-xl border-2 border-amber-300 text-center space-y-5 relative overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-parchment-warm hover:bg-parchment-deep text-ink-muted hover:text-ink transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Warning Icon */}
        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 mx-auto flex items-center justify-center shadow-xs">
          <ShieldAlert className="w-7 h-7" />
        </div>

        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-amber-800 font-bold block mb-1">
            2-Device Licensing Policy
          </span>
          <h3 className="font-serif text-2xl text-ink font-normal">
            Session Transferred
          </h3>
          <p className="text-xs text-ink-muted font-reading leading-relaxed mt-2">
            Your scholar account allows <strong>2 active devices: 1 Phone and 1 Laptop</strong>. This session was transferred because a newer {currentType === 'phone' ? 'mobile phone' : 'laptop / computer'} signed into your account.
          </p>
        </div>

        {/* 2-Device Policy Visual Pill */}
        <div className="p-3.5 rounded-2xl bg-parchment-warm border border-deckle text-[11px] text-ink-muted font-reading leading-relaxed text-left space-y-2">
          <span className="font-medium text-ink block font-sans">Dual-Device Entitlement:</span>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className={`p-2 rounded-xl border flex items-center gap-1.5 ${
              currentType === 'phone' ? 'bg-amber-100/70 border-amber-300 text-amber-900 font-bold' : 'bg-white border-deckle text-emerald-800'
            }`}>
              <Smartphone className="w-3.5 h-3.5" />
              <span>Phone {currentType === 'phone' ? '(Transferred)' : '(Active)'}</span>
            </div>
            <div className={`p-2 rounded-xl border flex items-center gap-1.5 ${
              currentType === 'laptop' ? 'bg-amber-100/70 border-amber-300 text-amber-900 font-bold' : 'bg-white border-deckle text-emerald-800'
            }`}>
              <Laptop className="w-3.5 h-3.5" />
              <span>Laptop {currentType === 'laptop' ? '(Transferred)' : '(Active)'}</span>
            </div>
          </div>
          <p className="text-[10px] text-ink-faint">
            You can keep your phone and laptop active together. Signing into a second {currentType} replaces the previous {currentType} slot.
          </p>
        </div>

        <div className="pt-2 flex flex-col gap-2">
          <button
            onClick={() => {
              onClose();
              onReLogin();
            }}
            className="w-full py-3 rounded-xl bg-claret hover:bg-claret-light text-white text-xs font-medium shadow-xs flex items-center justify-center gap-2 transition-all min-h-[44px]"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Transfer {currentType === 'phone' ? 'Phone' : 'Laptop'} Slot Back to This Device</span>
          </button>

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-white border border-deckle hover:border-claret text-ink-muted hover:text-ink text-xs font-medium transition-all min-h-[40px]"
          >
            Continue as Guest Scholar
          </button>
        </div>

      </div>
    </div>
  );
};
