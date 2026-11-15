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
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { useNetVidyaStore } from '../../contexts/NetVidyaStoreContext';
import { useModalEscape } from '../../hooks/useModalEscape';

interface NetVidyaStudentLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCheckout: () => void;
  onLoginSuccess: () => void;
  requiredForEnrollment?: boolean;
  pendingProductName?: string;
}

type TabType = 'login' | 'signup' | 'forgot' | 'activate';

export const NetVidyaStudentLoginModal: React.FC<NetVidyaStudentLoginModalProps> = ({
  isOpen,
  onClose,
  onOpenCheckout,
  onLoginSuccess,
  requiredForEnrollment = false,
  pendingProductName
}) => {
  const {
    login,
    signup,
    verifyOtp,
    resendOtp,
    forgotPassword,
    resetPassword,
    currentServerPrice,
    verifyPaymentAndActivate
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

  // Instant Activation fields
  const [activateInput, setActivateInput] = useState('');

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
  const [resendCooldown, setResendCooldown] = useState(0);

  // Status and messages
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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
      if (result.requiresOtp) {
        setIsOtpStep(true);
        setOtpEmail(result.email || cleanEmail);
        setOtpPurpose((result.purpose as any) || 'first_login');
        setOtpCode('');
        setResendCooldown(30);
        setSuccessMessage(result.message || 'Please enter the 6-digit verification code sent to your email.');
        return;
      }
      onLoginSuccess();
      onClose();
    } else {
      setErrorMessage(result.error || 'Invalid email or password.');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
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
    const result = await verifyOtp(otpEmail, cleanCode, otpPurpose);
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
      setSuccessMessage(result.message || 'A fresh verification code has been dispatched to your email.');
      setResendCooldown(30);
    } else {
      setErrorMessage(result.error || 'Failed to resend code. Please wait a moment and try again.');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
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
      ? { otp: cleanTokenOrCode, email: forgotEmail.trim().toLowerCase(), newPassword }
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

  const handleInstantActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanInput = activateInput.trim();
    if (!cleanInput) {
      setErrorMessage('Please enter your Razorpay Payment ID or registered email.');
      return;
    }

    setIsSubmitting(true);
    const isEmail = cleanInput.includes('@');
    const result = await verifyPaymentAndActivate({
      paymentId: isEmail ? undefined : cleanInput,
      email: isEmail ? cleanInput.toLowerCase() : undefined
    });
    setIsSubmitting(false);

    if (result.success) {
      setSuccessMessage(result.message || 'Payment verified! Your study pass is activated.');
      setTimeout(() => {
        onLoginSuccess();
        onClose();
      }, 1000);
    } else {
      setErrorMessage(result.error || 'Could not verify payment record. Please check your Payment ID or email.');
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onWheel={(e) => {
        if (e.target === e.currentTarget) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-hidden overscroll-contain select-none"
    >
      <div className="relative w-full max-w-md my-auto bg-white rounded-3xl p-4 sm:p-7 md:p-8 shadow-2xl border border-gray-200 space-y-4 sm:space-y-5 animate-scale-up max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain select-text">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 transition-colors z-10 cursor-pointer"
          title="Close Modal (Esc)"
          aria-label="Close Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1 pr-8">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mb-2 sm:mb-3">
            <KeyRound className="w-5 h-5" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
            NET Vidya Student Portal
          </h2>
          <p className="text-xs text-gray-500">
            Access your GSET &amp; UGC NET English Reading Files &amp; CBT Tests.
          </p>
        </div>

        {/* Compulsory Enrollment Login Banner */}
        {requiredForEnrollment && (
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5 shadow-xs animate-scale-up">
            <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <strong className="font-bold text-amber-950 block">Compulsory Candidate Login:</strong>
              <p className="text-amber-800 leading-relaxed">
                Please sign in or create an account to enroll in <strong>{pendingProductName || 'your selected package'}</strong>. Your checkout will open automatically once you are logged in.
              </p>
            </div>
          </div>
        )}

        {/* Error / Success Feedback */}
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

        {/* OTP EMAIL VERIFICATION SCREEN */}
        {isOtpStep ? (
          <form onSubmit={handleVerifyOtp} className="space-y-4 animate-scale-up">
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 text-blue-900 text-xs space-y-1.5 text-center">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mx-auto mb-1">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-blue-950">Verify Your Email Address</h3>
              <p className="text-blue-800 leading-relaxed text-[12px]">
                We sent a 6-digit verification code to <strong className="text-blue-950">{otpEmail}</strong> to verify that your email is genuine.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 text-center">
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
                className="w-full py-3 px-4 text-center tracking-[0.5em] font-mono text-2xl font-bold rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none bg-gray-50/50"
              />
              <p className="text-[11px] text-gray-500 mt-1 text-center">
                Valid for 10 minutes. Required only once to verify genuine candidate email.
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="submit"
                disabled={isSubmitting || otpCode.length < 6}
                className="w-full py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
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

              <div className="flex items-center justify-between text-xs pt-1 px-1">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || isSubmitting}
                  className="text-blue-700 hover:text-blue-900 font-semibold disabled:text-gray-400 disabled:cursor-not-allowed cursor-pointer"
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
                  className="text-gray-500 hover:text-gray-800 cursor-pointer font-medium"
                >
                  ← Change Email / Back
                </button>
              </div>
            </div>
          </form>
        ) : (
          <>
            {/* Navigation Tabs */}
            <div className="flex rounded-xl bg-gray-100 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setActiveTab('login'); setErrorMessage(null); setSuccessMessage(null); }}
            className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'login'
                ? 'bg-white text-blue-900 shadow-2xs font-bold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('signup'); setErrorMessage(null); setSuccessMessage(null); }}
            className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'signup'
                ? 'bg-white text-blue-900 shadow-2xs font-bold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span className="hidden min-[380px]:inline">Create Account</span>
            <span className="min-[380px]:hidden">Register</span>
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('forgot'); setErrorMessage(null); setSuccessMessage(null); }}
            className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'forgot'
                ? 'bg-white text-blue-900 shadow-2xs font-bold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Forgot?</span>
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('activate'); setErrorMessage(null); setSuccessMessage(null); }}
            className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'activate'
                ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Paid?</span>
          </button>
        </div>

        {/* Error / Success Feedback */}
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

        {/* 1. SIGN IN TAB */}
        {activeTab === 'login' && (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Registered Email *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  placeholder="e.g. scholar@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-gray-700">
                  Password *
                </label>
                <button
                  type="button"
                  onClick={() => { setActiveTab('forgot'); setErrorMessage(null); }}
                  className="text-[11px] text-blue-700 hover:text-blue-900 font-medium"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
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
          <form onSubmit={handleSignUp} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Full Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={signupName}
                  onChange={e => setSignupName(e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={signupEmail}
                  onChange={e => setSignupEmail(e.target.value)}
                  placeholder="e.g. priya.sharma@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Mobile Number *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="tel"
                  required
                  value={signupMobile}
                  onChange={e => setSignupMobile(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={signupPassword}
                  onChange={e => setSignupPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
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
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Registered Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    placeholder="e.g. scholar@gmail.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                  />
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                  We will issue a secure 1-hour reset token to update your password.
                </p>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
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
                  className="text-xs text-blue-700 hover:text-blue-900 text-center py-1 font-medium"
                >
                  Already have a reset token? Enter here →
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  6-Digit Reset Code or Link Token *
                </label>
                <input
                  type="text"
                  required
                  value={resetToken}
                  onChange={e => setResetToken(e.target.value)}
                  placeholder="Enter 6-digit code (e.g. 123456) or paste link token"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 font-mono text-xs focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                />
              </div>

              {!forgotEmail && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Your Registered Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    placeholder="e.g. scholar@gmail.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  New Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min. 6 characters)"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
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
                  className="text-xs text-gray-500 hover:text-gray-700 text-center py-1"
                >
                  ← Back to request reset code
                </button>
              </div>
            </form>
          )
        )}

        {/* 4. INSTANT ACTIVATION TAB */}
        {activeTab === 'activate' && (
          <form onSubmit={handleInstantActivate} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
              <p className="font-semibold flex items-center gap-1.5 text-emerald-950">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                Instant Activation for Paid Students
              </p>
              <p className="text-emerald-800 leading-relaxed text-[11px]">
                Paid via Razorpay or UPI but materials are locked? Enter your Razorpay Payment ID (starts with <code>pay_...</code>) or the email you entered during payment to instantly unlock your dashboard.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Razorpay Payment ID or Paid Email *
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={activateInput}
                  onChange={e => setActivateInput(e.target.value)}
                  placeholder="e.g. pay_U01dCsc7irC6LP or email@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-600 focus:border-transparent outline-none"
                />
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                Found in your UPI confirmation SMS, bank app, or Razorpay payment receipt email.
              </p>
              {typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActivateInput('pay_simulated_test');
                    }}
                    className="text-[11px] text-emerald-700 hover:text-emerald-900 font-semibold underline inline-flex items-center gap-1"
                  >
                    <span>🧪 Localhost Demo: Use Simulation ID (₹0 Pass)</span>
                    <span>→</span>
                  </button>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Verifying with Razorpay...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Verify & Unlock Materials Now</span>
                </>
              )}
            </button>
          </form>
        )}
          </>
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
            className="text-xs font-bold text-blue-700 hover:text-blue-900 underline inline-flex items-center gap-1 cursor-pointer"
          >
            <span>Enroll Now (₹{currentServerPrice})</span>
            <span>→</span>
          </button>
          <div>
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-gray-500 hover:text-gray-800 transition-colors py-1.5 px-3 rounded-lg hover:bg-gray-100 font-medium inline-block cursor-pointer mt-1"
            >
              ← Cancel and Return to Store
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
