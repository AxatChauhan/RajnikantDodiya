import React, { useState } from 'react';
import { useScholarSession } from '../../hooks/useScholarSession';
import { signInScholar, signUpScholar, signOutScholar } from '../../lib/credentialAuth';
import { detectDeviceType, getDeviceDescription } from '../../lib/deviceSecurity';
import {
  X,
  ShieldCheck,
  Smartphone,
  BookOpen,
  Laptop,
  CheckCircle2,
  ArrowRight,
  LogOut,
  Sparkles,
  AlertCircle,
  Loader2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  Shield,
  KeyRound,
  UserPlus
} from 'lucide-react';

interface ScholarAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenReader?: () => void;
  onOpenExam?: () => void;
}

export const ScholarAuthModal: React.FC<ScholarAuthModalProps> = ({
  isOpen,
  onClose,
  onOpenReader,
  onOpenExam
}) => {
  const { session, saveSession, clearSession, isExamOwned } = useScholarSession();

  // Mode: 'signin' | 'signup'
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status & Feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Prevent background scrolling when modal is open
  React.useEffect(() => {
    if (isOpen) {
      const origOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = origOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isLoggedIn = Boolean(session.email || session.mobile) && session.unlockedItems.length > 0;
  const currentDeviceType = detectDeviceType();

  // -------------------------------------------------------------
  // HANDLER: Sign In
  // -------------------------------------------------------------
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    setIsSubmitting(true);
    const result = await signInScholar({ email, password });
    setIsSubmitting(false);

    if (result.success && result.session) {
      saveSession(result.session);
      setSuccessMessage(result.message || 'Signed in successfully! 2-Device Pass is active.');
      setPassword('');
    } else {
      setErrorMessage(result.error || 'Invalid credentials. Please verify your email and password.');
    }
  };

  // -------------------------------------------------------------
  // HANDLER: Sign Up (Create Pass)
  // -------------------------------------------------------------
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanDigits = phone.replace(/\D/g, '');
    if (cleanDigits.length !== 10 || !/^[6-9]\d{9}$/.test(cleanDigits)) {
      setErrorMessage('Mobile number must be exactly 10 digits starting with 6, 7, 8, or 9.');
      return;
    }

    setIsSubmitting(true);
    const result = await signUpScholar({
      name,
      email,
      phone: cleanDigits,
      password
    });
    setIsSubmitting(false);

    if (result.success && result.session) {
      saveSession(result.session);
      setSuccessMessage(result.message || 'Pass created successfully! Active on this device.');
      setPassword('');
    } else {
      setErrorMessage(result.error || 'Failed to create pass. Please verify your details.');
    }
  };

  // -------------------------------------------------------------
  // HANDLER: Sign Out
  // -------------------------------------------------------------
  const handleSignOut = async () => {
    await signOutScholar();
    clearSession();
    setSuccessMessage(null);
    setErrorMessage(null);
    setEmail('');
    setPassword('');
    setName('');
    setPhone('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-ink-pure/70 backdrop-blur-xs animate-fade-in">
      <div className="folio-card bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-book-xl border border-deckle relative overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-parchment-warm hover:bg-parchment-deep text-ink-muted hover:text-ink transition-colors z-10"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* ========================================================= */}
        {/* VIEW A: LOGGED-IN SCHOLAR / AUTHOR DASHBOARD              */}
        {/* ========================================================= */}
        {isLoggedIn ? (
          <div className="space-y-6 animate-fade-in">
            {/* Header Badge */}
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold font-serif shadow-sm overflow-hidden shrink-0 ${
                session.role === 'author' ? 'bg-brass text-white' : 'bg-claret text-white'
              }`}>
                {session.role === 'author' ? (
                  <Shield className="w-6 h-6 text-amber-200" />
                ) : (
                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className={`text-[10px] font-mono uppercase tracking-widest font-bold flex items-center gap-1 ${
                  session.role === 'author' ? 'text-brass-dark' : 'text-emerald-700'
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {session.role === 'author' ? 'Site Owner & Author Pass' : 'Active 2-Device Scholar Pass'}
                </span>
                <h3 className="font-serif text-xl sm:text-2xl text-ink font-normal truncate">
                  {session.name}
                </h3>
                <span className="text-xs font-mono text-ink-muted truncate block">
                  {session.email} • +91 {session.mobile}
                </span>
              </div>
            </div>

            {/* 2-Device Policy Status Card */}
            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-deckle space-y-3">
              <div className="flex items-center justify-between border-b border-deckle pb-2">
                <span className="text-xs font-mono uppercase tracking-wider text-claret font-bold">
                  Authorized Devices (2-Device Policy)
                </span>
                <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                  1 Phone + 1 Laptop
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-xs font-mono">
                {/* Phone Slot */}
                <div className={`p-3 rounded-xl border flex flex-col justify-between ${
                  currentDeviceType === 'phone'
                    ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-medium'
                    : 'bg-white border-deckle text-ink-muted'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <Smartphone className="w-4 h-4 text-claret" />
                    <span className="text-[10px] font-bold">
                      {currentDeviceType === 'phone' ? 'THIS DEVICE' : 'AUTHORIZED'}
                    </span>
                  </div>
                  <div>
                    <span className="font-sans font-bold block text-ink text-xs">Mobile Phone</span>
                    <span className="text-[10px] text-ink-faint">
                      {currentDeviceType === 'phone' ? getDeviceDescription() : 'Phone Slot Active'}
                    </span>
                  </div>
                </div>

                {/* Laptop Slot */}
                <div className={`p-3 rounded-xl border flex flex-col justify-between ${
                  currentDeviceType === 'laptop'
                    ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-medium'
                    : 'bg-white border-deckle text-ink-muted'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <Laptop className="w-4 h-4 text-claret" />
                    <span className="text-[10px] font-bold">
                      {currentDeviceType === 'laptop' ? 'THIS DEVICE' : 'AUTHORIZED'}
                    </span>
                  </div>
                  <div>
                    <span className="font-sans font-bold block text-ink text-xs">Laptop / PC</span>
                    <span className="text-[10px] text-ink-faint">
                      {currentDeviceType === 'laptop' ? getDeviceDescription() : 'Laptop Slot Active'}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-ink-muted font-reading leading-relaxed">
                You can access your monograph and CBT test simulations simultaneously on both your mobile phone and laptop.
              </p>
            </div>

            {/* Unlocked Study Assets */}
            <div className="space-y-2">
              <span className="text-xs font-mono uppercase tracking-wider text-ink-faint font-semibold block">
                Your Academic Holdings & Entitlements:
              </span>
              <div className="space-y-2">
                {/* Monograph Entry */}
                <div className="p-3.5 rounded-xl bg-parchment-warm border border-deckle flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <BookOpen className="w-4 h-4 text-claret shrink-0" />
                    <div>
                      <strong className="font-serif text-ink text-sm block">Techno-Pedagogical English Monograph</strong>
                      <span className="text-ink-faint text-[11px]">Peer-Reviewed Edition • Watermarked Reader</span>
                    </div>
                  </div>
                  {onOpenReader && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenReader();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-claret text-white font-medium text-xs hover:bg-claret-light transition-all shadow-xs shrink-0 flex items-center gap-1"
                    >
                      <span>Read</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* CBT Exam Engine Entry */}
                <div className="p-3.5 rounded-xl bg-parchment-warm border border-deckle flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-brass-dark shrink-0" />
                    <div>
                      <strong className="font-serif text-ink text-sm block">UGC-NET & GSET CBT Simulation</strong>
                      <span className="text-ink-faint text-[11px]">
                        {isExamOwned || session.role === 'author'
                          ? 'Full 25-Question Licensed Edition'
                          : 'Free 3-Question Diagnostic Preview'}
                      </span>
                    </div>
                  </div>
                  {onOpenExam && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenExam();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-white border border-deckle text-claret font-medium text-xs hover:bg-claret-soft transition-all shadow-2xs shrink-0 flex items-center gap-1"
                    >
                      <span>Open Exam</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Sign Out Button */}
            <div className="pt-2 border-t border-deckle flex items-center justify-between text-xs font-mono">
              <span className="text-ink-faint">Order #{session.orderId}</span>
              <button
                onClick={handleSignOut}
                className="px-3 py-1.5 rounded-lg text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /* VIEW B: CREDENTIAL SIGN-IN & PASS CREATION               */
          /* ========================================================= */
          <div className="space-y-4 animate-fade-in">
            {/* Modal Title */}
            <div>
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-claret mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span>Student & Scholar Portal • Access Pass</span>
              </div>
              <h3 className="font-serif text-2xl sm:text-3xl text-ink font-normal">
                {authMode === 'signin' ? 'Scholar Sign-In' : 'Create Scholar Pass'}
              </h3>
              <p className="text-xs text-ink-muted font-reading leading-relaxed mt-0.5">
                Every pass includes <strong>2 active devices: 1 Mobile Phone + 1 Laptop</strong> simultaneously.
              </p>
            </div>

            {/* Tab Switcher */}
            <div className="grid grid-cols-2 p-1 rounded-xl bg-parchment-warm text-xs font-mono border border-deckle">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signin');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 ${
                  authMode === 'signin'
                    ? 'bg-claret text-white shadow-xs font-bold'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5 shrink-0" />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signup');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 ${
                  authMode === 'signup'
                    ? 'bg-claret text-white shadow-xs font-bold'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5 shrink-0" />
                <span>Create Pass</span>
              </button>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">{errorMessage}</p>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">{successMessage}</p>
              </div>
            )}

            {/* ------------------------------------------------------- */}
            {/* FORM 1: SIGN IN (EMAIL + PASSWORD)                      */}
            {/* ------------------------------------------------------- */}
            {authMode === 'signin' && (
              <form onSubmit={handleSignIn} className="space-y-3 pt-1 animate-fade-in">
                <div>
                  <label className="text-xs font-mono text-ink-faint block mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="you@gmail.com or university email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-deckle bg-white text-base sm:text-xs font-mono text-ink focus:outline-none focus:border-claret min-h-[44px]"
                    />
                    <Mail className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-mono text-ink-faint block mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-deckle bg-white text-base sm:text-xs font-mono text-ink focus:outline-none focus:border-claret min-h-[44px]"
                    />
                    <Lock className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 text-ink-muted hover:text-ink absolute right-3 top-1/2 -translate-y-1/2"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 rounded-xl bg-claret hover:bg-claret-light text-white text-xs font-medium transition-all shadow-xs flex items-center justify-center gap-2 min-h-[46px]"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <KeyRound className="w-4 h-4" />
                  )}
                  <span className="font-semibold">Sign In to 2-Device Pass</span>
                </button>

                <p className="text-center text-xs text-ink-muted pt-1">
                  Don't have a pass?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signup');
                      setErrorMessage(null);
                    }}
                    className="text-claret font-bold hover:underline"
                  >
                    Create your 2-Device Pass
                  </button>
                </p>
              </form>
            )}

            {/* ------------------------------------------------------- */}
            {/* FORM 2: CREATE PASS (NAME + EMAIL + PHONE + PASSWORD)   */}
            {/* ------------------------------------------------------- */}
            {authMode === 'signup' && (
              <form onSubmit={handleSignUp} className="space-y-3 pt-1 animate-fade-in">
                <div>
                  <label className="text-xs font-mono text-ink-faint block mb-1">
                    Full Name *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Rajnikant Dodiya or Priya Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-deckle bg-white text-base sm:text-xs font-sans text-ink focus:outline-none focus:border-claret min-h-[42px]"
                    />
                    <User className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-mono text-ink-faint block mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="you@gmail.com or university email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-deckle bg-white text-base sm:text-xs font-mono text-ink focus:outline-none focus:border-claret min-h-[42px]"
                    />
                    <Mail className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-mono text-ink-faint block">
                      WhatsApp Mobile Number (+91) *
                    </label>
                    <span className="text-[10px] font-mono text-ink-muted">10 digits only</span>
                  </div>
                  <div className="relative">
                    <input
                      type="tel"
                      inputMode="numeric"
                      required
                      maxLength={10}
                      pattern="[6-9][0-9]{9}"
                      placeholder="e.g. 9876543210"
                      value={phone}
                      onChange={(e) => {
                        const cleanDigits = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setPhone(cleanDigits);
                      }}
                      className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-deckle bg-white text-base sm:text-xs font-mono text-ink focus:outline-none focus:border-claret min-h-[42px]"
                    />
                    <Phone className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-mono text-ink-faint block mb-1">
                    Create Password (min 6 characters) *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2 rounded-xl border border-deckle bg-white text-base sm:text-xs font-mono text-ink focus:outline-none focus:border-claret min-h-[42px]"
                    />
                    <Lock className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 text-ink-muted hover:text-ink absolute right-3 top-1/2 -translate-y-1/2"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 rounded-xl bg-claret hover:bg-claret-light text-white text-xs font-medium transition-all shadow-xs flex items-center justify-center gap-2 min-h-[46px]"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                  <span className="font-semibold">Create 2-Device Pass & Enter</span>
                </button>

                <p className="text-center text-xs text-ink-muted pt-1">
                  Already registered?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signin');
                      setErrorMessage(null);
                    }}
                    className="text-claret font-bold hover:underline"
                  >
                    Sign In
                  </button>
                </p>
              </form>
            )}

            {/* Benefits Pill */}
            <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-deckle space-y-1.5 text-xs font-reading">
              <div className="flex items-center gap-2 text-claret font-mono font-bold text-[11px] uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>2-Device Academic Protection:</span>
              </div>
              <ul className="space-y-1 text-ink-muted list-disc list-inside text-[11px]">
                <li>Sign in on both your <strong>Mobile Phone and Laptop</strong> at the same time</li>
                <li>Instant access to Dr. Dodiya's monograph reader & CBT simulation preview</li>
                <li>Encrypted with client-side SHA-256 salted hashing</li>
              </ul>
            </div>

            {/* 2-Device Policy Notice Footer */}
            <div className="pt-2 border-t border-deckle flex items-center justify-between text-[11px] font-mono text-ink-faint">
              <span>Dual-Device Access Active</span>
              <span className="text-claret font-semibold">1 Phone + 1 Laptop</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
