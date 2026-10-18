import React, { useState, useEffect, useRef } from 'react';
import { useScholarSession, ScholarSession } from '../../hooks/useScholarSession';
import { loginAndTransferDevice, registerComplimentaryScholar } from '../../lib/supabase';
import { setupRecaptchaVerifier, sendSmsOtp, confirmSmsOtp } from '../../lib/firebase';
import { validateIndianMobile } from '../../lib/security';
import { ConfirmationResult, RecaptchaVerifier } from 'firebase/auth';
import {
  X,
  ShieldCheck,
  Smartphone,
  BookOpen,
  Laptop,
  CheckCircle2,
  Lock,
  ArrowRight,
  LogOut,
  Sparkles,
  AlertCircle,
  Loader2,
  KeyRound,
  RotateCcw,
  Check,
  Gift
} from 'lucide-react';

interface ScholarAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenReader?: () => void;
  onOpenExam?: () => void;
}

type AuthTab = 'complimentary' | 'restore';
type OtpStep = 'input_details' | 'verify_otp';

export const ScholarAuthModal: React.FC<ScholarAuthModalProps> = ({
  isOpen,
  onClose,
  onOpenReader,
  onOpenExam
}) => {
  const { session, saveSession, clearSession, isBookOwned, isExamOwned, isComplimentaryOwned } = useScholarSession();

  // Active Tab: 'complimentary' (default) or 'restore'
  const [activeTab, setActiveTab] = useState<AuthTab>('complimentary');

  // Complimentary Flow State
  const [nameInput, setNameInput] = useState('');
  const [mobileInput, setMobileInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [otpStep, setOtpStep] = useState<OtpStep>('input_details');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | undefined>(undefined);
  const [isSimulated, setIsSimulated] = useState<boolean>(false);

  // Restore Flow State
  const [restoreMobileInput, setRestoreMobileInput] = useState('');

  // Status & Feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Resend Countdown Timer
  const [resendCooldown, setResendCooldown] = useState(0);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  // Countdown timer effect
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Clean up reCAPTCHA verifier on modal unmount
  useEffect(() => {
    if (!isOpen) {
      setOtpStep('input_details');
      setOtpInput('');
      setErrorMessage(null);
      setSuccessMessage(null);
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch {
          // ignore
        }
        recaptchaVerifierRef.current = null;
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isLoggedIn = session.unlockedItems && session.unlockedItems.length > 0 && Boolean(session.mobile);

  // -------------------------------------------------------------
  // HANDLER 1: Send SMS OTP for Complimentary Scholar Registration
  // -------------------------------------------------------------
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanName = nameInput.trim();
    if (!cleanName || cleanName.length < 2) {
      setErrorMessage('Please enter your full name (at least 2 letters) for your Scholar Pass.');
      return;
    }

    const mobileCheck = validateIndianMobile(mobileInput);
    if (!mobileCheck.isValid) {
      setErrorMessage(mobileCheck.error || 'Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Initialize or get reCAPTCHA verifier
      if (!recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current = setupRecaptchaVerifier('scholar-recaptcha-container');
      }

      const res = await sendSmsOtp(mobileCheck.cleanMobile, recaptchaVerifierRef.current);
      setIsSubmitting(false);

      if (res.success) {
        setConfirmationResult(res.confirmationResult);
        setIsSimulated(Boolean(res.isSimulated));
        setOtpStep('verify_otp');
        setResendCooldown(45);
        if (res.isSimulated) {
          setSuccessMessage('Dev Notice: Test OTP is active. Use 123456 to verify immediately.');
        } else {
          setSuccessMessage(`6-digit SMS verification code dispatched to +91 ${mobileCheck.cleanMobile}.`);
        }
      } else {
        setErrorMessage(res.error || 'Failed to send verification code. Please check your number.');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err?.message || 'Verification service error. Please try again.');
    }
  };

  // -------------------------------------------------------------
  // HANDLER 2: Confirm OTP & Issue Complimentary Scholar Pass
  // -------------------------------------------------------------
  const handleConfirmOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanOtp = otpInput.trim().replace(/\D/g, '');
    if (cleanOtp.length !== 6) {
      setErrorMessage('Please enter the complete 6-digit SMS code.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Verify OTP with Firebase
      const verifyRes = await confirmSmsOtp(confirmationResult, cleanOtp, isSimulated);
      if (!verifyRes.success) {
        setIsSubmitting(false);
        setErrorMessage(verifyRes.error || 'Incorrect verification code. Please check your SMS.');
        return;
      }

      // 2. Firebase verification passed! Register complimentary pass in our database
      const cleanMobile = mobileInput.trim().replace(/\D/g, '').slice(-10);
      const regRes = await registerComplimentaryScholar(nameInput.trim(), cleanMobile);

      setIsSubmitting(false);

      if (regRes.success) {
        const newSession: ScholarSession = {
          name: nameInput.trim(),
          mobile: cleanMobile,
          orderId: regRes.orderId || `FREE-COMP-${Date.now().toString().slice(-6)}`,
          unlockedItems: regRes.unlockedItems || ['complimentary_book', 'book'],
          deviceToken: regRes.deviceToken
        };

        saveSession(newSession);
        setSuccessMessage('Phone verified! Your Complimentary Scholar Pass is active on this device.');
      } else {
        setErrorMessage(regRes.error || 'Failed to initialize session. Please try again.');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err?.message || 'Verification process failed.');
    }
  };

  // -------------------------------------------------------------
  // HANDLER 3: Restore Paid Purchases (Existing Candidates)
  // -------------------------------------------------------------
  const handleRestorePaid = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const mobileCheck = validateIndianMobile(restoreMobileInput);
    if (!mobileCheck.isValid) {
      setErrorMessage(mobileCheck.error || 'Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    const cleanMobile = mobileCheck.cleanMobile;
    setIsSubmitting(true);
    const result = await loginAndTransferDevice(cleanMobile);
    setIsSubmitting(false);

    if (result.success && result.unlockedItems && result.unlockedItems.length > 0) {
      const newSession: ScholarSession = {
        name: result.name || 'Scholar',
        mobile: cleanMobile,
        orderId: result.orderId || `HMP-${Date.now().toString().slice(-6)}`,
        unlockedItems: result.unlockedItems,
        deviceToken: result.deviceToken
      };

      saveSession(newSession);
      setSuccessMessage('1-Device License transferred! Your holdings are active on this device.');
      setRestoreMobileInput('');
    } else {
      setErrorMessage(
        result.error || `No active holdings found for +91 ${cleanMobile}. Claim a Free Pass or purchase at the desk.`
      );
    }
  };

  const handleSignOut = () => {
    clearSession();
    setSuccessMessage(null);
    setErrorMessage(null);
    setOtpStep('input_details');
    setOtpInput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-ink-pure/70 backdrop-blur-xs animate-fade-in">
      <div className="folio-card bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-book-xl border border-deckle relative overflow-hidden">
        
        {/* Invisible Firebase reCAPTCHA Container */}
        <div id="scholar-recaptcha-container" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-parchment-warm hover:bg-parchment-deep text-ink-muted hover:text-ink transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {isLoggedIn ? (
          /* ========================================================= */
          /* LOGGED IN: ACTIVE SCHOLAR HOLDINGS VIEW                   */
          /* ========================================================= */
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-claret text-white flex items-center justify-center shadow-xs">
                <ShieldCheck className="w-6 h-6 text-brass" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-claret font-semibold block">
                  Active Scholar Pass
                </span>
                <h3 className="font-serif text-2xl text-ink font-normal leading-tight">
                  {session.name}
                </h3>
              </div>
            </div>

            {successMessage && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Pass Metadata */}
            <div className="p-4 rounded-xl bg-parchment-warm/70 border border-deckle space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-ink-muted font-reading">Verified WhatsApp Mobile:</span>
                <span className="font-mono text-ink font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  +91 {session.mobile}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-ink-muted font-reading">Accession ID:</span>
                <span className="font-mono text-ink font-semibold">#{session.orderId}</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-deckle/60">
                <span className="text-ink-muted font-reading">Device License:</span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  <span>1-Device Active Here</span>
                </span>
              </div>
            </div>

            {/* Holdings & Direct Launchers */}
            <div className="space-y-3">
              <span className="text-[11px] font-mono uppercase tracking-wider text-ink-muted font-bold block">
                Your Academic Holdings:
              </span>

              {/* Complimentary Reading Room Holding */}
              <div className="p-4 rounded-xl border border-deckle bg-white shadow-2xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-200">
                    <BookOpen className="w-4 h-4 text-emerald-700" />
                  </div>
                  <div>
                    <h5 className="font-serif text-sm font-medium text-ink leading-tight">
                      Complimentary Reading Room (Treatise)
                    </h5>
                    <span className="text-[10px] font-mono text-emerald-700 font-bold block mt-0.5">
                      ✓ Free Scholar Pass Active
                    </span>
                  </div>
                </div>

                {onOpenReader && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenReader();
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-claret hover:bg-claret-light text-white text-xs font-medium shadow-xs transition-all flex items-center gap-1 shrink-0 min-h-[36px]"
                  >
                    <span>Read Book</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* CBT Exam Holding */}
              <div className="p-4 rounded-xl border border-deckle bg-white shadow-2xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-claret-soft text-claret flex items-center justify-center shrink-0">
                    <Laptop className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-serif text-sm font-medium text-ink leading-tight">
                      UGC-NET Paper I CBT Simulator
                    </h5>
                    <span className="text-[10px] font-mono text-ink-muted block mt-0.5">
                      {isExamOwned ? (
                        <span className="text-emerald-700 font-bold">✓ Enrolled Candidate</span>
                      ) : (
                        <span>Candidate License (₹299)</span>
                      )}
                    </span>
                  </div>
                </div>

                {isExamOwned && onOpenExam ? (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenExam();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-claret hover:bg-claret-light text-white text-xs font-medium shadow-xs transition-all flex items-center gap-1 shrink-0 min-h-[36px]"
                  >
                    <span>Launch CBT</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <span className="text-[10px] font-mono text-ink-faint px-2 py-1 rounded bg-parchment-warm border border-deckle">
                    Not Enrolled
                  </span>
                )}
              </div>
            </div>

            {/* Actions: Sign Out */}
            <div className="pt-2 border-t border-deckle flex items-center justify-between">
              <span className="text-[11px] font-reading text-ink-faint">
                Need to release this device?
              </span>
              <button
                onClick={handleSignOut}
                className="px-3 py-1.5 rounded-lg bg-parchment-warm hover:bg-parchment-deep text-xs font-mono text-ink-muted hover:text-ink transition-all flex items-center gap-1.5 min-h-[36px]"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out of Device</span>
              </button>
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /* NOT LOGGED IN: TABS (COMPLIMENTARY PASS vs RESTORE PAID)  */
          /* ========================================================= */
          <div className="space-y-5">
            {/* Tab Selector */}
            <div className="flex rounded-xl bg-parchment-warm p-1 border border-deckle gap-1 text-xs font-sans">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('complimentary');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`flex-1 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'complimentary'
                    ? 'bg-claret text-white shadow-2xs font-semibold'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                <Gift className="w-3.5 h-3.5" />
                <span>Free Scholar Pass</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('restore');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`flex-1 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'restore'
                    ? 'bg-claret text-white shadow-2xs font-semibold'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Restore Paid Purchases</span>
              </button>
            </div>

            {/* Error Message Toast */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">{errorMessage}</p>
              </div>
            )}

            {/* Success Message Toast */}
            {successMessage && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">{successMessage}</p>
              </div>
            )}

            {activeTab === 'complimentary' ? (
              /* ===================================================== */
              /* TAB 1: FREE SCHOLAR PASS (FIREBASE SMS OTP)           */
              /* ===================================================== */
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-claret font-bold block">
                    Complimentary Accession
                  </span>
                  <h3 className="font-serif text-2xl text-ink font-normal mt-0.5">
                    Claim Free Scholar Reading Pass
                  </h3>
                  <p className="text-xs text-ink-muted font-reading leading-relaxed mt-1">
                    Enter your name and mobile number. A 6-digit SMS verification code will be dispatched to confirm your single-device pass.
                  </p>
                </div>

                {otpStep === 'input_details' ? (
                  /* STEP 1: Enter Name & Mobile */
                  <form onSubmit={handleRequestOtp} className="space-y-3.5">
                    <div>
                      <label className="text-xs font-medium text-ink block mb-1">
                        Your Full Name (For Personalized Scholar Watermark) *
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. Arjun Patel"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-parchment-warm/60 border border-deckle text-ink text-sm font-reading placeholder-ink-faint focus:outline-none focus:border-claret min-h-[44px]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-ink block mb-1">
                        Your WhatsApp Mobile Number (For SMS OTP) *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-xs font-mono text-ink-muted">
                          +91
                        </div>
                        <input
                          required
                          type="tel"
                          maxLength={10}
                          placeholder="9876543210"
                          value={mobileInput}
                          onChange={(e) => setMobileInput(e.target.value.replace(/\D/g, ''))}
                          className="w-full pl-12 pr-4 py-2.5 rounded-xl bg-parchment-warm/60 border border-deckle text-ink text-sm font-mono placeholder-ink-faint focus:outline-none focus:border-claret min-h-[44px]"
                        />
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-parchment-warm/60 border border-deckle text-[11px] text-ink-muted space-y-1">
                      <div className="flex items-center gap-1.5 font-medium text-ink">
                        <ShieldCheck className="w-3.5 h-3.5 text-claret" />
                        <span>Genuine Scholar Protection</span>
                      </div>
                      <p className="leading-relaxed">
                        We send a 6-digit SMS code to verify genuine phone ownership. No random numbers or spam allowed.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting || !nameInput.trim() || mobileInput.length !== 10}
                      className="w-full py-3 rounded-xl bg-claret hover:bg-claret-light disabled:opacity-50 text-white text-xs font-medium shadow-xs flex items-center justify-center gap-2 transition-all min-h-[44px]"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Dispatching 6-Digit SMS OTP...</span>
                        </>
                      ) : (
                        <>
                          <Smartphone className="w-4 h-4" />
                          <span>Send 6-Digit SMS Verification Code</span>
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  /* STEP 2: Enter 6-Digit SMS OTP */
                  <form onSubmit={handleConfirmOtp} className="space-y-4 animate-fade-in">
                    <div className="p-3.5 rounded-xl bg-parchment-warm/80 border border-deckle text-xs text-ink flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-mono text-ink-muted block uppercase">Code sent to</span>
                        <span className="font-mono font-bold text-ink">+91 {mobileInput}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setOtpStep('input_details');
                          setOtpInput('');
                          setErrorMessage(null);
                        }}
                        className="text-xs font-mono text-claret hover:underline"
                      >
                        Change Number
                      </button>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-ink block mb-1">
                        Enter the 6-Digit SMS Code *
                      </label>
                      <input
                        required
                        type="text"
                        autoFocus
                        maxLength={6}
                        placeholder="••••••"
                        value={otpInput}
                        onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                        className="w-full text-center tracking-[0.5em] px-4 py-3 rounded-xl bg-parchment-warm/60 border border-deckle text-ink text-xl font-mono placeholder-ink-faint focus:outline-none focus:border-claret min-h-[48px]"
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-ink-muted">Didn't receive SMS?</span>
                      {resendCooldown > 0 ? (
                        <span className="text-ink-faint">Resend in {resendCooldown}s</span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleRequestOtp}
                          disabled={isSubmitting}
                          className="text-claret font-bold hover:underline inline-flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Resend OTP Code</span>
                        </button>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting || otpInput.trim().length !== 6}
                      className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-medium shadow-xs flex items-center justify-center gap-2 transition-all min-h-[44px]"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Verifying Code & Authorizing Device...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Verify Phone & Start Reading</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            ) : (
              /* ===================================================== */
              /* TAB 2: RESTORE PAID PURCHASES (EXISTING CANDIDATES)   */
              /* ===================================================== */
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-claret font-bold block">
                    Candidate Recovery
                  </span>
                  <h3 className="font-serif text-2xl text-ink font-normal mt-0.5">
                    Restore Paid Purchases
                  </h3>
                  <p className="text-xs text-ink-muted font-reading leading-relaxed mt-1">
                    Enter the WhatsApp mobile number used when acquiring Dr. Dodiya’s Monograph or UGC-NET CBT Exam.
                  </p>
                </div>

                <form onSubmit={handleRestorePaid} className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-ink block mb-1.5">
                      Your Registered WhatsApp Mobile Number *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-xs font-mono text-ink-muted">
                        +91
                      </div>
                      <input
                        required
                        type="tel"
                        maxLength={10}
                        placeholder="9876543210"
                        value={restoreMobileInput}
                        onChange={(e) => setRestoreMobileInput(e.target.value.replace(/\D/g, ''))}
                        className="w-full pl-12 pr-4 py-2.5 rounded-xl bg-parchment-warm/60 border border-deckle text-ink text-sm font-mono placeholder-ink-faint focus:outline-none focus:border-claret min-h-[44px]"
                      />
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-parchment-warm border border-deckle text-[11px] text-ink-muted font-reading leading-relaxed space-y-1">
                    <div className="flex items-center gap-1.5 font-medium text-ink">
                      <Lock className="w-3.5 h-3.5 text-claret" />
                      <span>Single-Device Protection</span>
                    </div>
                    <p>
                      Authorizing this device will safely transfer your active holdings here and release other sessions.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || restoreMobileInput.length !== 10}
                    className="w-full py-3 rounded-xl bg-claret hover:bg-claret-light disabled:opacity-50 text-white text-xs font-medium shadow-xs flex items-center justify-center gap-2 transition-all min-h-[44px]"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying Database Licenses...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Restore Holdings to This Device</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
