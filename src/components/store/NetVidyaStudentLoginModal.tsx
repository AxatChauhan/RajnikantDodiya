import React, { useState, useEffect } from 'react';
import {
  X,
  LogIn,
  UserPlus,
  KeyRound,
  Mail,
  Lock,
  User,
  Phone,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  ShieldCheck
} from 'lucide-react';
import { useNetVidyaStore } from '../../contexts/NetVidyaStoreContext';
import { useModalEscape } from '../../hooks/useModalEscape';

interface NetVidyaStudentLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCheckout?: () => void;
  onLoginSuccess: () => void;
  requiredForEnrollment?: boolean;
  pendingProductName?: string;
}

type TabType = 'login' | 'signup' | 'forgot';

export const NetVidyaStudentLoginModal: React.FC<NetVidyaStudentLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess
}) => {
  const {
    login,
    signup,
    verifyOtp,
    resendOtp,
    forgotPassword,
    resetPassword
  } = useNetVidyaStore();

  const [activeTab, setActiveTab] = useState<TabType>('login');
  
  // Login form fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Sign up form fields
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupMobile, setSignupMobile] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  // Forgot / Reset password fields
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isResetStep, setIsResetStep] = useState(false);

  // Email Verification OTP state (Required once for 1st-time login or registration)
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpEmail, setOtpEmail] = useState('');
  const [otpPurpose, setOtpPurpose] = useState<'signup' | 'first_login' | 'reset_password'>('signup');
  const [otpVerificationTicket, setOtpVerificationTicket] = useState<string | null>(null);
  const [otpExpiresAt, setOtpExpiresAt] = useState<number | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Status and messages
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loginErrorType, setLoginErrorType] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Background body and root scroll lock
  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, [isOpen]);

  // Universal Escape key listener
  useModalEscape(isOpen, onClose, !isSubmitting);

  // Auto-detect reset-password route and token from URL
  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;
    const hash = window.location.hash || '';
    const search = window.location.search || '';
    let extractedToken = '';

    if (search.includes('token=')) {
      const sp = new URLSearchParams(search);
      extractedToken = sp.get('token') || '';
    }
    if (!extractedToken && hash.includes('?')) {
      const hashQuery = hash.split('?')[1];
      const sp = new URLSearchParams(hashQuery);
      extractedToken = sp.get('token') || '';
    }

    if (extractedToken || hash.toLowerCase().includes('reset-password')) {
      setActiveTab('forgot');
      setIsResetStep(true);
      if (extractedToken) {
        setResetToken(extractedToken);
        setSuccessMessage('Reset token verified from email. Please enter your new password.');
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = loginEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!loginPassword || loginPassword.length < 4) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    const result = await login(cleanEmail, loginPassword);
    setIsSubmitting(false);

    if (result.success) {
      setLoginErrorType(null);
      if (result.requiresOtp) {
        setIsOtpStep(true);
        setOtpEmail(result.email || cleanEmail);
        setOtpPurpose((result.purpose as any) || 'first_login');
        setOtpVerificationTicket(result.verificationTicket || null);
        setOtpExpiresAt(result.expiresAt || null);
        setOtpCode('');
        setResendCooldown(30);
        setSuccessMessage(result.message || 'Please enter the 6-digit verification code sent to your email.');
        return;
      }
      onLoginSuccess();
      onClose();
    } else {
      setLoginErrorType(result.errorType || null);
      setErrorMessage(result.error || 'Invalid email or password.');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoginErrorType(null);
    setSuccessMessage(null);

    const cleanName = signupName.trim();
    const cleanEmail = signupEmail.trim().toLowerCase();
    const cleanMobile = signupMobile.trim();

    if (!cleanName) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!cleanMobile || cleanMobile.replace(/\D/g, '').length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!signupPassword || signupPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);
    const result = await signup(cleanName, cleanEmail, cleanMobile, signupPassword);
    setIsSubmitting(false);

    if (result.success) {
      if (result.requiresOtp) {
        setIsOtpStep(true);
        setOtpEmail(result.email || cleanEmail);
        setOtpPurpose('signup');
        setOtpVerificationTicket(result.verificationTicket || null);
        setOtpExpiresAt(result.expiresAt || null);
        setOtpCode('');
        setResendCooldown(30);
        setSuccessMessage(result.message || 'Account created! Please enter the 6-digit verification code sent to your email.');
        return;
      }
      onLoginSuccess();
      onClose();
    } else {
      setErrorMessage(result.error || 'Registration could not be completed.');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanCode = otpCode.trim();
    if (!cleanCode || cleanCode.length < 6) {
      setErrorMessage('Please enter the 6-digit verification code.');
      return;
    }

    setIsSubmitting(true);
    const result = await verifyOtp(
      otpEmail,
      cleanCode,
      otpPurpose,
      otpVerificationTicket || undefined,
      otpExpiresAt || undefined
    );
    setIsSubmitting(false);

    if (result.success) {
      setSuccessMessage(result.message || 'Email verified successfully! Entering your dashboard...');
      setTimeout(() => {
        setIsOtpStep(false);
        setOtpCode('');
        onLoginSuccess();
        onClose();
      }, 700);
    } else {
      setErrorMessage(result.error || 'Invalid verification code. Please check your email and try again.');
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isSubmitting) return;
    setErrorMessage(null);
    setSuccessMessage(null);

    setIsSubmitting(true);
    const result = await resendOtp(otpEmail, otpPurpose);
    setIsSubmitting(false);

    if (result.success) {
      if (result.verificationTicket) setOtpVerificationTicket(result.verificationTicket);
      if (result.expiresAt) setOtpExpiresAt(result.expiresAt);
      setSuccessMessage(result.message || 'A fresh verification code has been dispatched to your email.');
      setResendCooldown(30);
    } else {
      setErrorMessage(result.error || 'Failed to resend code. Please wait a moment and try again.');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoginErrorType(null);
    setSuccessMessage(null);

    const cleanEmail = forgotEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    const result = await forgotPassword(cleanEmail);
    setIsSubmitting(false);

    if (result.success) {
      setIsResetStep(true);
      if (result.token) {
        setResetToken(result.token);
      }
      if (result.verificationTicket) setOtpVerificationTicket(result.verificationTicket);
      if (result.expiresAt) setOtpExpiresAt(result.expiresAt);
      setSuccessMessage(result.message || 'Password reset code and link have been dispatched.');
    } else {
      setErrorMessage(result.error || 'Failed to process password reset request.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanTokenOrCode = resetToken.trim();
    if (!cleanTokenOrCode) {
      setErrorMessage('Please provide the 6-digit reset code or token.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);
    const isNumericOtp = /^\d{6}$/.test(cleanTokenOrCode);
    const payload = isNumericOtp
      ? {
          otp: cleanTokenOrCode,
          email: forgotEmail.trim().toLowerCase(),
          newPassword,
          verificationTicket: otpVerificationTicket || undefined,
          expiresAt: otpExpiresAt || undefined
        }
      : { token: cleanTokenOrCode, newPassword };

    const result = await resetPassword(payload);
    setIsSubmitting(false);

    if (result.success) {
      setSuccessMessage('Password reset successful! You may now sign in.');
      setIsResetStep(false);
      setActiveTab('login');
      setLoginEmail(forgotEmail);
      setLoginPassword('');
      setResetToken('');
      setNewPassword('');
    } else {
      setErrorMessage(result.error || 'Invalid or expired reset code or token.');
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-hidden select-none"
    >
      <div className="relative w-full max-w-[420px] my-auto bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl border border-gray-200 space-y-3 sm:space-y-3.5 animate-scale-up overflow-hidden select-text">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 p-1.5 sm:p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 transition-colors z-10 cursor-pointer"
          title="Close Modal (Esc)"
          aria-label="Close Modal"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 pr-8">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
            <KeyRound className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight truncate">
              NET Vidya Student Portal
            </h2>
            <p className="text-[11px] sm:text-xs text-gray-500 truncate">
              Access your GSET &amp; UGC NET English Materials
            </p>
          </div>
        </div>

        {/* Error Feedback */}
        {errorMessage && (
          <div className="p-2.5 sm:p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <p className="leading-snug flex-1">{errorMessage}</p>
            </div>
            {loginErrorType === 'ACCOUNT_NOT_FOUND' && (
              <div className="mt-2.5 pt-2 border-t border-rose-200 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] text-rose-900 font-medium">New candidate? Create your account:</span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('signup');
                    setSignupEmail(loginEmail.trim().toLowerCase());
                    setErrorMessage(null);
                    setLoginErrorType(null);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-semibold text-[11px] transition-all cursor-pointer shadow-2xs"
                >
                  Create Account with this Email →
                </button>
              </div>
            )}
            {loginErrorType === 'INCORRECT_PASSWORD' && (
              <div className="mt-2.5 pt-2 border-t border-rose-200 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] text-rose-900 font-medium">Forgot your password?</span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('forgot');
                    setForgotEmail(loginEmail.trim().toLowerCase());
                    setErrorMessage(null);
                    setLoginErrorType(null);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-semibold text-[11px] transition-all cursor-pointer shadow-2xs"
                >
                  Reset Password →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Success Feedback (Hidden during OTP step to prevent double alert banners) */}
        {!isOtpStep && successMessage && (
          <div className="p-2.5 sm:p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
            <p className="leading-snug">{successMessage}</p>
          </div>
        )}

        {/* OTP EMAIL VERIFICATION SCREEN */}
        {isOtpStep ? (
          <form onSubmit={handleVerifyOtp} className="space-y-3 animate-scale-up">
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-blue-950 text-xs leading-tight">Verify Your Email Address</p>
                <p className="text-blue-800 text-[11px] truncate">
                  6-digit code sent to <strong className="text-blue-950 font-semibold">{otpEmail}</strong>
                </p>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1 text-center">
                Enter 6-Digit Verification Code *
              </label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                autoFocus
                required
                value={otpCode}
                onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="••••••"
                className="w-full py-2 sm:py-2.5 px-3 text-center tracking-[0.4em] font-mono text-xl sm:text-2xl font-bold rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none bg-gray-50/50"
              />
              <p className="text-[10px] sm:text-[11px] text-gray-400 mt-1 text-center">
                Valid for 10 minutes. Check spam folder if not received.
              </p>
            </div>

            <div className="space-y-2 pt-0.5">
              <button
                type="submit"
                disabled={isSubmitting || otpCode.length < 6}
                className="w-full py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Verifying Code...</span>
                ) : (
                  <>
                    <span>Verify Code &amp; Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-xs px-1">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || isSubmitting}
                  className="text-[11px] text-blue-700 hover:text-blue-900 font-semibold disabled:text-gray-400 disabled:cursor-not-allowed cursor-pointer"
                >
                  {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend Code'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsOtpStep(false);
                    setOtpCode('');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="text-[11px] text-gray-500 hover:text-gray-800 cursor-pointer font-medium"
                >
                  ← Change Email / Back
                </button>
              </div>
            </div>
          </form>
        ) : (
          <>
            {/* Navigation Tabs (Strictly 3 tabs: Sign In | Sign Up | Forgot?) */}
            <div className="flex rounded-xl bg-gray-100 p-1 text-xs font-semibold gap-1 select-none">
              <button
                type="button"
                onClick={() => { setActiveTab('login'); setErrorMessage(null); setLoginErrorType(null); setSuccessMessage(null); }}
                className={`flex-1 py-1.5 sm:py-2 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer touch-manipulation ${
                  activeTab === 'login'
                    ? 'bg-white text-blue-900 shadow-2xs font-bold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <LogIn className="w-3.5 h-3.5 shrink-0" />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('signup'); setErrorMessage(null); setLoginErrorType(null); setSuccessMessage(null); }}
                className={`flex-1 py-1.5 sm:py-2 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer touch-manipulation ${
                  activeTab === 'signup'
                    ? 'bg-white text-blue-900 shadow-2xs font-bold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5 shrink-0" />
                <span>Sign Up</span>
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('forgot'); setErrorMessage(null); setLoginErrorType(null); setSuccessMessage(null); }}
                className={`flex-1 py-1.5 sm:py-2 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer touch-manipulation ${
                  activeTab === 'forgot'
                    ? 'bg-white text-blue-900 shadow-2xs font-bold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Forgot?</span>
              </button>
            </div>

            {/* 1. SIGN IN TAB */}
            {activeTab === 'login' && (
              <form onSubmit={handleSignIn} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                    Registered Email *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)}
                      placeholder="e.g. scholar@gmail.com"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-semibold text-gray-700">
                      Password *
                    </label>
                    <button
                      type="button"
                      onClick={() => { setActiveTab('forgot'); setErrorMessage(null); setLoginErrorType(null); }}
                      className="text-[11px] text-blue-700 hover:text-blue-900 font-medium cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      required
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
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
            )}

            {/* 2. SIGN UP TAB */}
            {activeTab === 'signup' && (
              <form onSubmit={handleSignUp} className="space-y-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={signupName}
                      onChange={e => setSignupName(e.target.value)}
                      placeholder="e.g. Priya Sharma"
                      className="w-full pl-8 pr-3 py-1.5 sm:py-2 rounded-xl border border-gray-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={signupEmail}
                      onChange={e => setSignupEmail(e.target.value)}
                      placeholder="e.g. priya.sharma@gmail.com"
                      className="w-full pl-8 pr-3 py-1.5 sm:py-2 rounded-xl border border-gray-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">
                      Mobile Number *
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                      <input
                        type="tel"
                        required
                        value={signupMobile}
                        onChange={e => setSignupMobile(e.target.value)}
                        placeholder="9876543210"
                        className="w-full pl-7 pr-2 py-1.5 sm:py-2 rounded-xl border border-gray-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">
                      Password *
                    </label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                      <input
                        type="password"
                        required
                        value={signupPassword}
                        onChange={e => setSignupPassword(e.target.value)}
                        placeholder="Min 6 chars"
                        className="w-full pl-7 pr-2 py-1.5 sm:py-2 rounded-xl border border-gray-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span>Registering Account...</span>
                    ) : (
                      <>
                        <span>Create Student Account</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* 3. FORGOT / RESET PASSWORD TAB */}
            {activeTab === 'forgot' && (
              !isResetStep ? (
                <form onSubmit={handleForgotPassword} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                      Registered Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={e => setForgotEmail(e.target.value)}
                        placeholder="e.g. scholar@gmail.com"
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                      />
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-gray-500 mt-1">
                      We will issue a secure 1-hour reset token to update your password.
                    </p>
                  </div>

                  <div className="pt-1 flex flex-col gap-1.5">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <span>Issuing Token...</span>
                      ) : (
                        <>
                          <span>Send Password Reset Token</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsResetStep(true)}
                      className="text-xs text-blue-700 hover:text-blue-900 text-center py-0.5 font-medium cursor-pointer"
                    >
                      Already have a reset token? Enter here →
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">
                      6-Digit Reset Code or Link Token *
                    </label>
                    <input
                      type="text"
                      required
                      value={resetToken}
                      onChange={e => setResetToken(e.target.value)}
                      placeholder="e.g. 123456 or paste token"
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 font-mono text-xs focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                    />
                  </div>

                  {!forgotEmail && (
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">
                        Your Registered Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={e => setForgotEmail(e.target.value)}
                        placeholder="e.g. scholar@gmail.com"
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">
                      New Password *
                    </label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-1 flex flex-col gap-1.5">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <span>Updating Password...</span>
                      ) : (
                        <>
                          <span>Set New Password</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsResetStep(false)}
                      className="text-xs text-gray-500 hover:text-gray-700 text-center py-0.5 cursor-pointer"
                    >
                      ← Back to request reset code
                    </button>
                  </div>
                </form>
              )
            )}
          </>
        )}

        {/* Modal Footer: Cancel / Return */}
        <div className="pt-2 border-t border-gray-100 text-center">
          <button
            type="button"
            onClick={onClose}
            className="text-[11px] sm:text-xs text-gray-500 hover:text-gray-800 transition-colors py-1 px-3 rounded-lg hover:bg-gray-100 font-medium inline-block cursor-pointer"
          >
            ← Cancel and Return to Store
          </button>
        </div>

      </div>
    </div>
  );
};
