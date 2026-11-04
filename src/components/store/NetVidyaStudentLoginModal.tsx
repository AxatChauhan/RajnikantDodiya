import React, { useState } from 'react';
import {
  X,
  KeyRound,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { useNetVidyaStore } from '../../contexts/NetVidyaStoreContext';

interface NetVidyaStudentLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCheckout: () => void;
  onLoginSuccess: () => void;
}

export const NetVidyaStudentLoginModal: React.FC<NetVidyaStudentLoginModalProps> = ({
  isOpen,
  onClose,
  onOpenCheckout,
  onLoginSuccess
}) => {
  const { loginBuyer, buyersRegistry } = useNetVidyaStore();

  const [authMode, setAuthMode] = useState<'password' | 'otp'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePasswordSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!password || password.length < 4) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsSubmitting(true);

    // Check if user is in buyers registry
    const match = buyersRegistry.find(b => b.email.toLowerCase() === cleanEmail);

    setTimeout(() => {
      setIsSubmitting(false);
      if (match && match.isActive) {
        loginBuyer({
          name: match.name,
          email: match.email,
          mobile: match.mobile,
          orderId: match.orderId
        });
        onLoginSuccess();
        onClose();
      } else {
        // Allow general student login or invite to buy
        loginBuyer({
          name: cleanEmail.split('@')[0],
          email: cleanEmail,
          mobile: '9876543210',
          orderId: `NV_SCHOLAR_${Date.now().toString().slice(-6)}`
        });
        onLoginSuccess();
        onClose();
      }
    }, 500);
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Please enter your registered email address.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsOtpSent(true);
      setSuccessMessage(`A 6-digit access code has been generated for ${cleanEmail}. (Demo code: 123456)`);
    }, 600);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (otpCode.trim() !== '123456' && otpCode.trim().length !== 6) {
      setErrorMessage('Invalid verification code. For this preview, use 123456.');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const match = buyersRegistry.find(b => b.email.toLowerCase() === cleanEmail);

    loginBuyer({
      name: match ? match.name : cleanEmail.split('@')[0],
      email: cleanEmail,
      mobile: match ? match.mobile : '9876543210',
      orderId: match ? match.orderId : `NV_OTP_${Date.now().toString().slice(-6)}`
    });

    onLoginSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-gray-200 space-y-6 relative animate-scale-up">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
          title="Close Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1">
          <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mb-3">
            <KeyRound className="w-5 h-5" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
            Student Portal Sign In
          </h2>
          <p className="text-xs text-gray-500">
            Access your Reading Files & Test Hall for the Final Pack 2026.
          </p>
        </div>

        {/* Toggle Mode */}
        <div className="flex rounded-xl bg-gray-100 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setAuthMode('password'); setIsOtpSent(false); setErrorMessage(null); }}
            className={`flex-1 py-2 rounded-lg transition-all ${
              authMode === 'password'
                ? 'bg-white text-blue-900 shadow-2xs font-bold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Password Sign In
          </button>
          <button
            type="button"
            onClick={() => { setAuthMode('otp'); setErrorMessage(null); }}
            className={`flex-1 py-2 rounded-lg transition-all ${
              authMode === 'otp'
                ? 'bg-white text-blue-900 shadow-2xs font-bold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Email OTP
          </button>
        </div>

        {/* Error / Success Notice */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <p className="leading-relaxed">{errorMessage}</p>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
            <p className="leading-relaxed">{successMessage}</p>
          </div>
        )}

        {/* Form Body */}
        {authMode === 'password' ? (
          <form onSubmit={handlePasswordSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Registered Email *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="e.g. aarav@gmail.com"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Password *
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span>Signing In...</span>
                ) : (
                  <>
                    <span>Enter My Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          !isOtpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Registered Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="e.g. priya@gmail.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  <span>Send 6-Digit Code</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Enter 6-Digit Code *
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value)}
                  placeholder="123456"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-center font-mono text-lg tracking-widest focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  <span>Verify Code & Enter</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )
        )}

        {/* Not Enrolled Yet Section */}
        <div className="pt-4 border-t border-gray-200 text-center space-y-2">
          <p className="text-xs text-gray-500">
            Don’t have an active pass for the Final Pack 2026?
          </p>
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenCheckout();
            }}
            className="text-xs font-bold text-blue-700 hover:text-blue-900 underline inline-flex items-center gap-1"
          >
            <span>Enroll Now (Early-Bird ₹799)</span>
            <span>→</span>
          </button>
        </div>

      </div>
    </div>
  );
};
