import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Shield,
  KeyRound,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Palette,
  Type,
  BookOpen,
  LayoutTemplate,
  Bell,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Save,
  Plus,
  Trash2,
  Edit3,
  ExternalLink,
  Layers,
  ArrowRight,
  ShieldAlert,
  Sliders,
  Check,
  Globe,
  Upload,
  FileUp,
  FileText,
  Sparkles
} from 'lucide-react';
import {
  useSiteContent,
  FONT_PRESETS,
  COLOR_PALETTES,
  CANVAS_TONES,
  FontPresetKey,
  ColorPaletteKey,
  CanvasToneKey,
  StudioBookItem
} from '../../contexts/SiteContentContext';
import {
  authenticateAuthorStudio,
  getActiveAuthorStudioSession,
  clearAuthorStudioSession,
  validateMasterPasswordEntropy,
  changeAuthorMasterPassword,
  getAuthorStudioLockoutStatus,
  AuthorStudioSession
} from '../../lib/authorStudioAuth';
import {
  uploadManuscriptFile,
  validateManuscriptFile,
  MAX_MANUSCRIPT_SIZE_BYTES
} from '../../lib/bookStorageSecurity';
import { PROFESSOR_INFO } from '../../data/professorData';
import { ProfessorCrestIcon } from '../common/ProfessorCrestIcon';

type StudioTab = 'theme' | 'profile' | 'books' | 'layout' | 'security';

export const AuthorStudioModal: React.FC = () => {
  const {
    isStudioOpen,
    closeStudio,
    theme,
    setTheme,
    profile,
    setProfile,
    books,
    addBook,
    updateBook,
    deleteBook,
    alertBanner,
    setAlertBanner,
    layoutSettings,
    setLayoutSettings,
    isSyncing,
    lastSavedAt,
    saveAllToProduction,
    restoreAuthenticDefaults
  } = useSiteContent();

  // Authentication State
  const [session, setSession] = useState<AuthorStudioSession | null>(() => getActiveAuthorStudioSession());
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [lockoutRemaining, setLockoutRemaining] = useState<number>(0);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number>(5);

  // Active Studio Tab
  const [activeTab, setActiveTab] = useState<StudioTab>('theme');
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Book Editing Modal State
  const [editingBook, setEditingBook] = useState<StudioBookItem | null>(null);
  const [isAddingNewBook, setIsAddingNewBook] = useState(false);

  // 300-Page Manuscript Upload State
  const [isUploadingManuscript, setIsUploadingManuscript] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatusText, setUploadStatusText] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newBookForm, setNewBookForm] = useState<Omit<StudioBookItem, 'id'>>({
    title: '',
    subtitle: '',
    publisher: 'HMPIETR Academic Series',
    year: new Date().getFullYear(),
    isbn: '978-81-',
    type: 'authored',
    price: 399,
    coverUrl: '/dr-rajnikant-dodiya.jpg',
    buyUrl: '#bookstore',
    whatsappInquiryUrl: 'https://wa.me/919825123456',
    details: '',
    sampleExcerpt: '',
    isActive: true,
    pageCount: 320,
    previewPages: 20,
    frontMatterOffset: 12,
    manuscriptFileUrl: '',
    samplePdfUrl: '',
    manuscriptFileName: '',
    manuscriptFileSizeMb: 0
  });

  const handleFileUpload = async (file: File) => {
    setUploadError(null);
    const validation = validateManuscriptFile(file);
    if (!validation.valid) {
      setUploadError(validation.error || 'Invalid file');
      return;
    }

    setIsUploadingManuscript(true);
    setUploadProgress(10);
    setUploadStatusText('Preparing secure manuscript upload...');

    const res = await uploadManuscriptFile(file, newBookForm.isbn, (percent, status) => {
      setUploadProgress(percent);
      setUploadStatusText(status);
    });

    setIsUploadingManuscript(false);

    if (res.success) {
      const suggestedTitle = newBookForm.title || file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setNewBookForm(prev => ({
        ...prev,
        title: prev.title || suggestedTitle,
        manuscriptFileUrl: res.manuscriptFileUrl,
        samplePdfUrl: res.samplePdfUrl,
        manuscriptFileName: res.fileName,
        manuscriptFileSizeMb: res.fileSizeMb
      }));
    } else {
      setUploadError(res.error || 'Upload failed. Please try again.');
    }
  };

  // Password Change State
  const [currentPassChange, setCurrentPassChange] = useState('');
  const [newPassChange, setNewPassChange] = useState('');
  const [confirmPassChange, setConfirmPassChange] = useState('');
  const [passChangeSuccess, setPassChangeSuccess] = useState<string | null>(null);
  const [passChangeError, setPassChangeError] = useState<string | null>(null);

  // Dialog ref for light dismiss and accessibility
  const dialogRef = useRef<HTMLDivElement>(null);

  // Check lockout status periodically
  useEffect(() => {
    const updateLockout = () => {
      const status = getAuthorStudioLockoutStatus();
      if (status.isLocked) {
        setLockoutRemaining(Math.ceil(status.remainingMs / 1000));
      } else {
        setLockoutRemaining(0);
        setAttemptsRemaining(status.attemptsRemaining);
      }
    };
    updateLockout();
    const interval = setInterval(updateLockout, 1000);
    return () => clearInterval(interval);
  }, []);

  // Sync session on mount / modal open
  useEffect(() => {
    if (isStudioOpen) {
      const active = getActiveAuthorStudioSession();
      setSession(active);
      setAuthError(null);
    }
  }, [isStudioOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isStudioOpen) {
        closeStudio();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isStudioOpen, closeStudio]);

  if (!isStudioOpen) return null;

  // Handle Login Submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsAuthenticating(true);

    try {
      const result = await authenticateAuthorStudio(emailInput, passwordInput);
      if (result.success && result.session) {
        setSession(result.session);
        setPasswordInput('');
      } else {
        setAuthError(result.error || 'Authentication failed. Please verify your credentials.');
        if (result.lockoutRemainingMs) {
          setLockoutRemaining(Math.ceil(result.lockoutRemainingMs / 1000));
        }
        if (typeof result.attemptsRemaining === 'number') {
          setAttemptsRemaining(result.attemptsRemaining);
        }
      }
    } catch (err: any) {
      setAuthError(err?.message || 'Security gateway communication error.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Handle Sign Out
  const handleSignOut = () => {
    clearAuthorStudioSession();
    setSession(null);
    setPasswordInput('');
  };

  // Handle Save All to Production
  const handleSaveAll = async () => {
    const res = await saveAllToProduction();
    if (res.success) {
      setSaveToast(res.message);
      setTimeout(() => setSaveToast(null), 4000);
    } else {
      setSaveToast(`Error: ${res.message}`);
      setTimeout(() => setSaveToast(null), 5000);
    }
  };

  // Handle Password Change Submission
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassChangeError(null);
    setPassChangeSuccess(null);

    if (newPassChange !== confirmPassChange) {
      setPassChangeError('The new passwords entered do not match.');
      return;
    }

    const entropy = validateMasterPasswordEntropy(newPassChange);
    if (!entropy.isValid) {
      setPassChangeError(entropy.errors[0]);
      return;
    }

    const res = await changeAuthorMasterPassword(session?.email || PROFESSOR_INFO.email, currentPassChange, newPassChange);
    if (res.success) {
      setPassChangeSuccess('Master author password updated successfully! Please note your new credentials securely.');
      setCurrentPassChange('');
      setNewPassChange('');
      setConfirmPassChange('');
    } else {
      setPassChangeError(res.error || 'Password update failed.');
    }
  };

  const passwordEntropy = validateMasterPasswordEntropy(passwordInput);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="authorStudioTitle"
      className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-ink/75 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          closeStudio();
        }
      }}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-5xl h-[92vh] max-h-[850px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-[#D5CDC2]"
      >
        {/* ================================================================= */}
        {/* TOP BAR / INSTITUTIONAL HEADER */}
        {/* ================================================================= */}
        <header className="px-5 py-3.5 bg-claret text-white flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-brass-light shrink-0">
              <ProfessorCrestIcon className="w-5 h-5 text-brass" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 id="authorStudioTitle" className="font-serif text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                  Author Studio
                  <span className="text-[10px] font-mono tracking-widest uppercase bg-brass text-ink font-bold px-2 py-0.5 rounded-full">
                    Direct CMS
                  </span>
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Live on rajnikantdodiya.com
                </span>
              </div>
              <p className="text-[11px] text-white/75 font-sans truncate">
                Dr. Rajnikant S. Dodiya • Instant Production Content & Theme Management
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {session && (
              <button
                onClick={handleSignOut}
                className="text-xs text-white/80 hover:text-white px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors flex items-center space-x-1"
                title="Lock Author Studio Session"
              >
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Lock Gate</span>
              </button>
            )}
            <button
              onClick={closeStudio}
              aria-label="Close Studio"
              className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/15 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* ================================================================= */}
        {/* VIEW A: MASTER SECURITY LOGIN GATE (AIR-GAPPED FROM SCHOLARS) */}
        {/* ================================================================= */}
        {!session ? (
          <div className="flex-1 overflow-y-auto p-6 sm:p-10 flex flex-col items-center justify-center bg-[#FAF9F5]">
            <div className="w-full max-w-md bg-white p-7 sm:p-9 rounded-2xl border border-[#E3DDD4] shadow-lg space-y-6">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-claret-soft border border-claret/30 flex items-center justify-center text-claret shadow-inner">
                  <Shield className="w-7 h-7" />
                </div>
                <h2 className="font-serif text-2xl font-bold text-ink">
                  Author Security Gate
                </h2>
                <p className="text-xs text-ink-muted leading-relaxed">
                  Dedicated, air-gapped access for <strong className="text-ink">Dr. Rajnikant S. Dodiya</strong>. Changes made here apply instantly to the live production website.
                </p>
              </div>

              {/* Security Shield Indicator */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-950">Brute-Force & Integrity Protection</p>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    Isolated master cryptographic salt. Rate-limited to 5 attempts before a 15-minute lock.
                  </p>
                </div>
              </div>

              {/* Lockout Warning */}
              {lockoutRemaining > 0 ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-center space-y-1">
                  <p className="text-sm font-bold text-red-800">Security Lockout Active</p>
                  <p className="text-xs text-red-700">
                    Maximum failed attempts reached. Studio is locked for:
                  </p>
                  <div className="font-mono text-xl font-bold text-red-900 pt-1">
                    {Math.floor(lockoutRemaining / 60)}m {lockoutRemaining % 60}s
                  </div>
                </div>
              ) : (
                <form onSubmit={handleLogin} className="space-y-4">
                  {authError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <span>{authError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1">
                      Author Verified Email
                    </label>
                    <input
                      type="email"
                      required
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="rajnikantdodiya2@gmail.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-deckle text-sm font-sans focus:outline-none focus:ring-2 focus:ring-claret/20 focus:border-claret"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted">
                        Master Studio Password
                      </label>
                      <span className="text-[11px] text-ink-muted font-mono">
                        {attemptsRemaining} attempts left
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        placeholder="Enter master password"
                        className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-deckle text-sm font-sans focus:outline-none focus:ring-2 focus:ring-claret/20 focus:border-claret"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Password Strength Feedback */}
                    {passwordInput && (
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-ink-muted">Password Strength:</span>
                          <span
                            className={`font-semibold ${
                              passwordEntropy.label === 'Institutional Grade'
                                ? 'text-emerald-700'
                                : passwordEntropy.label === 'Strong'
                                ? 'text-blue-700'
                                : passwordEntropy.label === 'Moderate'
                                ? 'text-amber-700'
                                : 'text-red-600'
                            }`}
                          >
                            {passwordEntropy.label} ({passwordEntropy.score}%)
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              passwordEntropy.score >= 85
                                ? 'bg-emerald-600'
                                : passwordEntropy.score >= 65
                                ? 'bg-blue-600'
                                : passwordEntropy.score >= 40
                                ? 'bg-amber-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${passwordEntropy.score}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isAuthenticating}
                    className="w-full py-3 px-4 rounded-xl bg-claret text-white font-sans text-sm font-semibold hover:bg-claret-light transition-all shadow-md flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {isAuthenticating ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Verifying Cryptographic Credentials...
                      </span>
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4 text-brass" />
                        <span>Unlock Author Studio</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        ) : (
          /* ================================================================= */
          /* VIEW B: MAIN AUTHOR STUDIO DASHBOARD (5 VISUAL MANAGEMENT TABS)   */
          /* ================================================================= */
          <div className="flex-1 flex flex-col min-h-0 bg-[#FAF9F5]">
            {/* Tab Navigation Header */}
            <div className="bg-white border-b border-[#E3DDD4] px-4 sm:px-6 flex items-center justify-between shrink-0 overflow-x-auto">
              <nav className="flex space-x-1 sm:space-x-2 py-2" aria-label="Studio Tabs">
                {[
                  { id: 'theme', label: 'Colors & Typography', icon: Palette },
                  { id: 'profile', label: 'About Me & Bio', icon: Type },
                  { id: 'books', label: 'My Books & Store', icon: BookOpen },
                  { id: 'layout', label: 'Layout & Alert Bar', icon: Bell },
                  { id: 'security', label: 'Master Password', icon: Shield }
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id as StudioTab)}
                      className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center space-x-2 whitespace-nowrap ${
                        isActive
                          ? 'bg-claret text-white shadow-xs font-semibold'
                          : 'text-ink-muted hover:text-ink hover:bg-gray-100'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-brass-light' : 'text-ink-muted'}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="hidden md:flex items-center space-x-2 text-xs text-ink-muted">
                <span className="font-mono">Author: {session.email}</span>
              </div>
            </div>

            {/* Tab Contents (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8">
              {/* TAB 1: COLORS & TYPOGRAPHY */}
              {activeTab === 'theme' && (
                <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
                  <div>
                    <h3 className="font-serif text-xl font-bold text-ink">
                      1. Academic Typography Presets (8 Curated Pairs)
                    </h3>
                    <p className="text-xs text-ink-muted mt-1">
                      Click any typography card below to instantly transform all headers and reading text across your entire website.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-4">
                      {(Object.keys(FONT_PRESETS) as FontPresetKey[]).map((key) => {
                        const preset = FONT_PRESETS[key];
                        const isSelected = theme.fontPreset === key;
                        return (
                          <button
                            key={key}
                            onClick={() => setTheme({ fontPreset: key })}
                            className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                              isSelected
                                ? 'bg-claret-soft/40 border-claret ring-2 ring-claret/30 shadow-sm'
                                : 'bg-white border-[#E3DDD4] hover:border-claret/40 hover:shadow-xs'
                            }`}
                          >
                            {isSelected && (
                              <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-claret text-white flex items-center justify-center text-[10px]">
                                <Check className="w-3 h-3" />
                              </span>
                            )}
                            <div>
                              <p className="text-[11px] font-mono uppercase tracking-wider text-claret font-semibold">
                                {preset.name}
                              </p>
                              <p
                                className="text-lg font-bold text-ink mt-2 leading-tight"
                                style={{ fontFamily: preset.displayFont }}
                              >
                                Dr. Dodiya
                              </p>
                              <p
                                className="text-xs text-ink-muted mt-1 leading-snug line-clamp-2"
                                style={{ fontFamily: preset.readingFont }}
                              >
                                English Language Pedagogy & NEP 2020 Research
                              </p>
                            </div>
                            <p className="text-[10px] text-ink-faint mt-3 border-t border-deckle/60 pt-2">
                              {preset.description}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 6 Academic Color Palettes */}
                  <div className="pt-6 border-t border-deckle">
                    <h3 className="font-serif text-xl font-bold text-ink">
                      2. Academic Accent Palettes (6 Distinct Atmospheres)
                    </h3>
                    <p className="text-xs text-ink-muted mt-1">
                      Choose an accent tone that defines the dignified, scholarly identity of your portal.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-4">
                      {(Object.keys(COLOR_PALETTES) as ColorPaletteKey[]).map((key) => {
                        const palette = COLOR_PALETTES[key];
                        const isSelected = theme.colorPalette === key;
                        return (
                          <button
                            key={key}
                            onClick={() => setTheme({ colorPalette: key })}
                            className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                              isSelected
                                ? 'bg-claret-soft/30 border-claret ring-2 ring-claret/30 shadow-sm'
                                : 'bg-white border-[#E3DDD4] hover:border-claret/40'
                            }`}
                          >
                            {isSelected && (
                              <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-claret text-white flex items-center justify-center text-[10px]">
                                <Check className="w-3 h-3" />
                              </span>
                            )}
                            <div>
                              <div className="flex items-center space-x-2">
                                <span
                                  className="w-5 h-5 rounded-full border border-black/10 shadow-xs"
                                  style={{ backgroundColor: palette.primary }}
                                />
                                <span
                                  className="w-5 h-5 rounded-full border border-black/10 shadow-xs"
                                  style={{ backgroundColor: palette.accent }}
                                />
                                <span
                                  className="w-5 h-5 rounded-full border border-black/10 shadow-xs"
                                  style={{ backgroundColor: palette.primarySoft }}
                                />
                              </div>
                              <p className="text-sm font-serif font-bold text-ink mt-2.5">
                                {palette.name}
                              </p>
                              <p className="text-xs text-ink-muted mt-1">
                                {palette.description}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 4 Canvas Background Tones */}
                  <div className="pt-6 border-t border-deckle">
                    <h3 className="font-serif text-xl font-bold text-ink">
                      3. Canvas Background Tone & Reading Atmosphere
                    </h3>
                    <p className="text-xs text-ink-muted mt-1">
                      Adjust the site background hue for long-form scholarly reading comfort.
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                      {(Object.keys(CANVAS_TONES) as CanvasToneKey[]).map((key) => {
                        const tone = CANVAS_TONES[key];
                        const isSelected = theme.canvasTone === key;
                        return (
                          <button
                            key={key}
                            onClick={() => setTheme({ canvasTone: key })}
                            className={`p-3.5 rounded-xl border text-left transition-all ${
                              isSelected
                                ? 'border-claret ring-2 ring-claret/20 font-semibold shadow-xs'
                                : 'border-[#E3DDD4] hover:border-claret/40'
                            }`}
                            style={{ backgroundColor: tone.canvasBg }}
                          >
                            <p className="text-xs font-bold text-ink">{tone.name}</p>
                            <p className="text-[10px] text-ink-muted mt-1 line-clamp-2">
                              {tone.description}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sizing & Capitalization */}
                  <div className="pt-6 border-t border-deckle grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-2">
                        Reading Font Sizing
                      </label>
                      <div className="flex gap-2">
                        {[
                          { id: 'standard', label: 'Standard (16px)' },
                          { id: 'relaxed', label: 'Relaxed (17px)' },
                          { id: 'generous', label: 'Generous (18.5px)' }
                        ].map((sz) => (
                          <button
                            key={sz.id}
                            onClick={() => setTheme({ fontSizeScale: sz.id as any })}
                            className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium border transition-colors ${
                              theme.fontSizeScale === sz.id
                                ? 'bg-claret text-white border-claret'
                                : 'bg-white text-ink border-deckle hover:bg-gray-50'
                            }`}
                          >
                            {sz.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-2">
                        Header Case Style
                      </label>
                      <div className="flex gap-2">
                        {[
                          { id: 'small-caps', label: 'Oxford Small-Caps' },
                          { id: 'standard', label: 'Standard Title Case' }
                        ].map((cs) => (
                          <button
                            key={cs.id}
                            onClick={() => setTheme({ headerCaps: cs.id as any })}
                            className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium border transition-colors ${
                              theme.headerCaps === cs.id
                                ? 'bg-claret text-white border-claret'
                                : 'bg-white text-ink border-deckle hover:bg-gray-50'
                            }`}
                          >
                            {cs.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: ABOUT ME & BIO */}
              {activeTab === 'profile' && (
                <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
                  <div>
                    <h3 className="font-serif text-xl font-bold text-ink">
                      Personal Bio & Institutional Coordinates
                    </h3>
                    <p className="text-xs text-ink-muted mt-1">
                      Update your academic title, institutional coordinates, and bio text. Changes will reflect across both the Home and About pages.
                    </p>
                  </div>

                  <div className="space-y-4 bg-white p-6 rounded-2xl border border-deckle shadow-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-ink-muted mb-1">
                          Full Academic Name
                        </label>
                        <input
                          type="text"
                          value={profile.name}
                          onChange={(e) => setProfile({ name: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl border border-deckle text-sm focus:ring-2 focus:ring-claret/20 focus:border-claret"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-ink-muted mb-1">
                          Academic Title
                        </label>
                        <input
                          type="text"
                          value={profile.title}
                          onChange={(e) => setProfile({ title: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl border border-deckle text-sm focus:ring-2 focus:ring-claret/20 focus:border-claret"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-ink-muted mb-1">
                          Institution
                        </label>
                        <input
                          type="text"
                          value={profile.institution}
                          onChange={(e) => setProfile({ institution: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl border border-deckle text-sm focus:ring-2 focus:ring-claret/20 focus:border-claret"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-ink-muted mb-1">
                          University Affiliation
                        </label>
                        <input
                          type="text"
                          value={profile.university}
                          onChange={(e) => setProfile({ university: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl border border-deckle text-sm focus:ring-2 focus:ring-claret/20 focus:border-claret"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-ink-muted mb-1">
                        Short Bio (Featured on Homepage & Introductions)
                      </label>
                      <textarea
                        rows={3}
                        value={profile.shortBio}
                        onChange={(e) => setProfile({ shortBio: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-deckle text-sm focus:ring-2 focus:ring-claret/20 focus:border-claret"
                      />
                      <span className="text-[11px] text-ink-faint">
                        {profile.shortBio.split(/\s+/).filter(Boolean).length} words
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-semibold text-ink-muted">
                          Long Academic Bio (Paragraphs for About Page)
                        </label>
                        <button
                          type="button"
                          onClick={() => setProfile({ longBio: [...profile.longBio, 'New academic paragraph...'] })}
                          className="text-xs text-claret hover:underline flex items-center gap-1 font-semibold"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Paragraph</span>
                        </button>
                      </div>

                      <div className="space-y-3">
                        {profile.longBio.map((p, idx) => (
                          <div key={idx} className="relative group bg-parchment-warm/40 p-3 rounded-2xl border border-deckle space-y-1.5">
                            <div className="flex items-center justify-between text-xs text-ink-muted">
                              <span className="font-mono font-semibold text-claret">Paragraph {idx + 1}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-mono text-ink-faint">
                                  {p.split(/\s+/).filter(Boolean).length} words
                                </span>
                                {profile.longBio.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = profile.longBio.filter((_, i) => i !== idx);
                                      setProfile({ longBio: updated });
                                    }}
                                    className="p-1 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                                    title="Remove Paragraph"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                            <textarea
                              rows={3}
                              value={p}
                              onChange={(e) => {
                                const updated = [...profile.longBio];
                                updated[idx] = e.target.value;
                                setProfile({ longBio: updated });
                              }}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-deckle text-sm focus:ring-2 focus:ring-claret/20 focus:border-claret min-h-[85px] bg-white resize-y"
                              placeholder="Write academic paragraph..."
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: MY BOOKS & STORE */}
              {activeTab === 'books' && (
                <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-serif text-xl font-bold text-ink">
                        My Books & Monograph Catalog
                      </h3>
                      <p className="text-xs text-ink-muted mt-1">
                        Add, modify descriptions, pricing, or WhatsApp direct-buy links for your authored books.
                      </p>
                    </div>

                    <button
                      onClick={() => setIsAddingNewBook(true)}
                      className="px-3.5 py-2 rounded-xl bg-claret text-white text-xs font-semibold hover:bg-claret-light transition-all flex items-center space-x-1.5 shadow-xs"
                    >
                      <Plus className="w-4 h-4 text-brass" />
                      <span>Add New Book</span>
                    </button>
                  </div>

                  {/* Add New Book Modal Form */}
                  {isAddingNewBook && (
                    <div className="bg-claret-soft/30 p-5 rounded-2xl border border-claret/30 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-serif text-base font-bold text-claret flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-brass" />
                          <span>Add New Monograph (Long-Form & Preview Enabled)</span>
                        </h4>
                        <button
                          onClick={() => setIsAddingNewBook(false)}
                          className="text-gray-500 hover:text-gray-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* DIRECT PDF MANUSCRIPT DROPZONE */}
                      <div className="space-y-2">
                        <label className="block text-ink font-semibold text-xs flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Upload className="w-3.5 h-3.5 text-claret" />
                            <span>Direct PDF Manuscript Upload (200–350+ Pages)</span>
                          </span>
                          <span className="text-[10px] font-mono text-ink-muted">Up to 75 MB • Cloud Vault</span>
                        </label>

                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="application/pdf"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleFileUpload(e.target.files[0]);
                            }
                          }}
                        />

                        {newBookForm.manuscriptFileName ? (
                          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 flex items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                              <div className="min-w-0">
                                <p className="font-semibold text-emerald-950 truncate">
                                  {newBookForm.manuscriptFileName}
                                </p>
                                <p className="text-[11px] text-emerald-700 font-mono">
                                  {newBookForm.manuscriptFileSizeMb} MB • Ready for Cloud Storage & Preview
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="px-2.5 py-1 rounded-lg bg-white border border-emerald-300 text-emerald-800 text-[11px] font-medium hover:bg-emerald-100 transition-colors shrink-0"
                            >
                              Replace PDF
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              e.preventDefault();
                              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                                handleFileUpload(e.dataTransfer.files[0]);
                              }
                            }}
                            className="p-5 border-2 border-dashed border-claret/30 rounded-xl hover:border-claret bg-white/70 hover:bg-claret-soft/20 transition-all text-center cursor-pointer space-y-2 group"
                          >
                            <div className="w-10 h-10 mx-auto rounded-full bg-claret-soft flex items-center justify-center text-claret group-hover:scale-105 transition-transform">
                              <FileUp className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-ink">
                                Click or drag & drop full book PDF manuscript here
                              </p>
                              <p className="text-[11px] text-ink-muted mt-0.5">
                                Automatically streams to Supabase vault with zero client-side paywall leak
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Upload Progress Bar */}
                        {isUploadingManuscript && (
                          <div className="space-y-1.5 p-3 rounded-xl bg-white border border-deckle">
                            <div className="flex items-center justify-between text-xs font-mono">
                              <span className="text-claret font-semibold">{uploadStatusText}</span>
                              <span className="text-ink-muted">{uploadProgress}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-claret transition-all duration-300 rounded-full"
                                style={{ width: `${uploadProgress}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {uploadError && (
                          <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                            <span>{uploadError}</span>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                        <div>
                          <label className="block text-ink-muted font-semibold mb-1">Book Title *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Modern Pedagogies in English"
                            value={newBookForm.title}
                            onChange={(e) => setNewBookForm({ ...newBookForm, title: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-deckle"
                          />
                        </div>
                        <div>
                          <label className="block text-ink-muted font-semibold mb-1">Subtitle</label>
                          <input
                            type="text"
                            placeholder="e.g. A Reflective Framework"
                            value={newBookForm.subtitle || ''}
                            onChange={(e) => setNewBookForm({ ...newBookForm, subtitle: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-deckle"
                          />
                        </div>
                        <div>
                          <label className="block text-ink-muted font-semibold mb-1">Publisher</label>
                          <input
                            type="text"
                            value={newBookForm.publisher}
                            onChange={(e) => setNewBookForm({ ...newBookForm, publisher: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-deckle"
                          />
                        </div>
                        <div>
                          <label className="block text-ink-muted font-semibold mb-1">ISBN</label>
                          <input
                            type="text"
                            value={newBookForm.isbn}
                            onChange={(e) => setNewBookForm({ ...newBookForm, isbn: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-deckle"
                          />
                        </div>
                        <div>
                          <label className="block text-ink-muted font-semibold mb-1">Publication Year</label>
                          <input
                            type="number"
                            value={newBookForm.year}
                            onChange={(e) => setNewBookForm({ ...newBookForm, year: Number(e.target.value) })}
                            className="w-full px-3 py-2 rounded-lg border border-deckle"
                          />
                        </div>
                        <div>
                          <label className="block text-ink-muted font-semibold mb-1">Price (₹)</label>
                          <input
                            type="number"
                            value={newBookForm.price}
                            onChange={(e) => setNewBookForm({ ...newBookForm, price: Number(e.target.value) })}
                            className="w-full px-3 py-2 rounded-lg border border-deckle"
                          />
                        </div>

                        {/* 300-PAGE SPECIALIZED FIELDS */}
                        <div>
                          <label className="block text-ink-muted font-semibold mb-1">
                            Total Monograph Pages (e.g. 320)
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={newBookForm.pageCount}
                            onChange={(e) => setNewBookForm({ ...newBookForm, pageCount: Number(e.target.value) || 320 })}
                            className="w-full px-3 py-2 rounded-lg border border-deckle"
                          />
                        </div>
                        <div>
                          <label className="block text-ink-muted font-semibold mb-1">
                            Free Preview Pages Limit (e.g. 20)
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={newBookForm.previewPages}
                            onChange={(e) => setNewBookForm({ ...newBookForm, previewPages: Number(e.target.value) || 20 })}
                            className="w-full px-3 py-2 rounded-lg border border-deckle"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-ink-muted font-semibold mb-1">Book Synopsis / Academic Description</label>
                          <textarea
                            rows={2}
                            placeholder="Enter a brief synopsis or overview of this volume..."
                            value={newBookForm.details || ''}
                            onChange={(e) => setNewBookForm({ ...newBookForm, details: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-deckle text-xs"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-claret/20">
                        <button
                          type="button"
                          onClick={() => setIsAddingNewBook(false)}
                          className="px-3 py-1.5 rounded-lg border border-deckle text-xs"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!newBookForm.title) return;
                            addBook(newBookForm);
                            setIsAddingNewBook(false);
                            setNewBookForm({
                              title: '',
                              subtitle: '',
                              publisher: 'HMPIETR Academic Series',
                              year: new Date().getFullYear(),
                              isbn: '978-81-',
                              type: 'authored',
                              price: 399,
                              coverUrl: '/dr-rajnikant-dodiya.jpg',
                              buyUrl: '#bookstore',
                              whatsappInquiryUrl: 'https://wa.me/919825123456',
                              details: '',
                              sampleExcerpt: '',
                              isActive: true,
                              pageCount: 320,
                              previewPages: 20,
                              frontMatterOffset: 12,
                              manuscriptFileUrl: '',
                              samplePdfUrl: '',
                              manuscriptFileName: '',
                              manuscriptFileSizeMb: 0
                            });
                          }}
                          className="px-4 py-1.5 rounded-lg bg-claret text-white text-xs font-semibold shadow-xs"
                        >
                          Add to Catalog & Store
                        </button>
                      </div>
                    </div>
                  )}

                  {/* List of Books */}
                  <div className="space-y-3">
                    {books.map((b) => (
                      <div
                        key={b.id}
                        className="bg-white p-4 sm:p-5 rounded-2xl border border-deckle hover:border-claret/40 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 min-w-0"
                      >
                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-mono uppercase bg-claret-soft text-claret font-bold px-2 py-0.5 rounded-full shrink-0">
                              {b.year} • {b.type}
                            </span>
                            <span className="text-[10px] font-mono bg-amber-50 text-amber-900 border border-amber-200 font-bold px-2 py-0.5 rounded-full shrink-0">
                              {b.pageCount || 320} Pages • {b.previewPages || 20}p Preview
                            </span>
                            <span className="text-xs font-mono text-ink-muted">
                              ISBN: {b.isbn}
                            </span>
                            {b.manuscriptFileName && (
                              <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <FileText className="w-3 h-3 text-emerald-600" />
                                <span>PDF Vault Active ({b.manuscriptFileSizeMb || 18.4} MB)</span>
                              </span>
                            )}
                          </div>
                          <h4 className="font-serif text-base font-bold text-ink break-words leading-snug">
                            {b.title}
                          </h4>
                          {b.subtitle && (
                            <p className="text-xs text-ink-muted break-words">{b.subtitle}</p>
                          )}
                          <p className="text-xs text-ink-faint break-words">
                            {b.publisher} • <strong className="text-claret font-mono">₹{b.price}</strong>
                          </p>
                          {b.details && (
                            <p className="text-xs text-ink-muted font-reading line-clamp-2 break-words pt-1 border-t border-deckle/40">
                              {b.details}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center flex-wrap">
                          <button
                            onClick={() => {
                              const newPrice = prompt('Enter new price (₹):', String(b.price));
                              if (newPrice && !isNaN(Number(newPrice))) {
                                updateBook(b.id, { price: Number(newPrice) });
                              }
                            }}
                            className="px-3 py-1.5 text-xs rounded-xl border border-deckle hover:bg-gray-50 flex items-center gap-1.5 font-medium transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-claret" />
                            <span>Edit Price</span>
                          </button>
                          {books.length > 1 && (
                            <button
                              onClick={() => {
                                if (confirm(`Remove "${b.title}" from catalog?`)) {
                                  deleteBook(b.id);
                                }
                              }}
                              className="p-2 text-gray-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition-colors"
                              title="Delete Book"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: LAYOUT & ALERT BAR */}
              {activeTab === 'layout' && (
                <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
                  {/* Top Live Alert Banner */}
                  <div className="bg-white p-6 rounded-2xl border border-deckle shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-serif text-lg font-bold text-ink flex items-center gap-2">
                          <Bell className="w-4 h-4 text-brass" />
                          Top Announcement Alert Bar
                        </h4>
                        <p className="text-xs text-ink-muted mt-0.5">
                          Displays a live, highlighted notification strip at the very top of rajnikantdodiya.com.
                        </p>
                      </div>

                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={alertBanner.enabled}
                          onChange={(e) => setAlertBanner({ enabled: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-claret"></div>
                      </label>
                    </div>

                    {alertBanner.enabled && (
                      <div className="space-y-3 pt-3 border-t border-deckle text-xs">
                        <div>
                          <label className="block text-ink-muted font-semibold mb-1">
                            Announcement Message Text
                          </label>
                          <input
                            type="text"
                            value={alertBanner.text}
                            onChange={(e) => setAlertBanner({ text: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-deckle text-sm"
                            placeholder="e.g. UGC-NET Education Mock Portal is now live..."
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-ink-muted font-semibold mb-1">Badge Text</label>
                            <input
                              type="text"
                              value={alertBanner.badgeText}
                              onChange={(e) => setAlertBanner({ badgeText: e.target.value })}
                              className="w-full px-3 py-2 rounded-xl border border-deckle text-sm"
                              placeholder="e.g. Institutional Notice"
                            />
                          </div>

                          <div>
                            <label className="block text-ink-muted font-semibold mb-1">Badge Tone</label>
                            <select
                              value={alertBanner.badgeType}
                              onChange={(e) => setAlertBanner({ badgeType: e.target.value as any })}
                              className="w-full px-3 py-2 rounded-xl border border-deckle text-sm"
                            >
                              <option value="gold">Antique Gold (Distinguished)</option>
                              <option value="info">Oxford Navy (Informational)</option>
                              <option value="success">Cambridge Emerald (Success)</option>
                              <option value="urgent">Burgundy (Urgent Notice)</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-ink-muted font-semibold mb-1">Button Text</label>
                            <input
                              type="text"
                              value={alertBanner.buttonText}
                              onChange={(e) => setAlertBanner({ buttonText: e.target.value })}
                              className="w-full px-3 py-2 rounded-xl border border-deckle text-sm"
                              placeholder="e.g. View Details"
                            />
                          </div>
                          <div>
                            <label className="block text-ink-muted font-semibold mb-1">Target Tab / Link</label>
                            <input
                              type="text"
                              value={alertBanner.buttonLink}
                              onChange={(e) => setAlertBanner({ buttonLink: e.target.value })}
                              className="w-full px-3 py-2 rounded-xl border border-deckle text-sm"
                              placeholder="#communities or #bookstore"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Section Visibility Toggles */}
                  <div className="bg-white p-6 rounded-2xl border border-deckle shadow-xs space-y-4">
                    <div>
                      <h4 className="font-serif text-lg font-bold text-ink flex items-center gap-2">
                        <LayoutTemplate className="w-4 h-4 text-claret" />
                        Homepage Section Visibility Controls
                      </h4>
                      <p className="text-xs text-ink-muted mt-0.5">
                        Turn individual sections on or off with 1 click.
                      </p>
                    </div>

                    <div className="space-y-3 pt-2">
                      {[
                        { key: 'showTrackRecordBoxes', label: 'Academic Track Record Metric Boxes (4 Boxes)' },
                        { key: 'showHighlights', label: 'Latest Scholarly Highlights & Events' },
                        { key: 'showFeaturedMonograph', label: 'Featured Monograph Spotlight (Kalam Study)' },
                        { key: 'showPhilosophyQuote', label: 'Pedagogical Philosophy & Vision Quote' },
                        { key: 'showContactForm', label: 'Direct Academic Inquiry & Contact Form' }
                      ].map((item) => (
                        <div
                          key={item.key}
                          className="flex items-center justify-between py-2 border-b border-deckle/60 last:border-0"
                        >
                          <span className="text-xs font-semibold text-ink">{item.label}</span>
                          <input
                            type="checkbox"
                            checked={(layoutSettings as any)[item.key]}
                            onChange={(e) => setLayoutSettings({ [item.key]: e.target.checked })}
                            className="w-4 h-4 text-claret rounded border-gray-300 focus:ring-claret"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: MASTER SECURITY & BACKUP */}
              {activeTab === 'security' && (
                <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
                  <div>
                    <h3 className="font-serif text-xl font-bold text-ink">
                      Author Master Password Management
                    </h3>
                    <p className="text-xs text-ink-muted mt-1">
                      Change your air-gapped master studio password. This password is never shared with student login accounts.
                    </p>
                  </div>

                  <form onSubmit={handleChangePassword} className="bg-white p-6 rounded-2xl border border-deckle shadow-xs space-y-4">
                    {passChangeSuccess && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{passChangeSuccess}</span>
                      </div>
                    )}
                    {passChangeError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                        <span>{passChangeError}</span>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-ink-muted mb-1">
                        Current Master Password
                      </label>
                      <input
                        type="password"
                        required
                        value={currentPassChange}
                        onChange={(e) => setCurrentPassChange(e.target.value)}
                        placeholder="Enter current password"
                        className="w-full px-3.5 py-2 rounded-xl border border-deckle text-sm focus:ring-2 focus:ring-claret/20 focus:border-claret"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-ink-muted mb-1">
                        New Master Password (Min 10 chars, uppercase, lowercase, number, symbol)
                      </label>
                      <input
                        type="password"
                        required
                        value={newPassChange}
                        onChange={(e) => setNewPassChange(e.target.value)}
                        placeholder="Enter new strong password"
                        className="w-full px-3.5 py-2 rounded-xl border border-deckle text-sm focus:ring-2 focus:ring-claret/20 focus:border-claret"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-ink-muted mb-1">
                        Confirm New Master Password
                      </label>
                      <input
                        type="password"
                        required
                        value={confirmPassChange}
                        onChange={(e) => setConfirmPassChange(e.target.value)}
                        placeholder="Re-enter new password"
                        className="w-full px-3.5 py-2 rounded-xl border border-deckle text-sm focus:ring-2 focus:ring-claret/20 focus:border-claret"
                      />
                    </div>

                    <button
                      type="submit"
                      className="py-2.5 px-4 rounded-xl bg-claret text-white text-xs font-semibold hover:bg-claret-light transition-all flex items-center space-x-1.5 shadow-xs"
                    >
                      <KeyRound className="w-4 h-4 text-brass" />
                      <span>Update Master Password</span>
                    </button>
                  </form>

                  {/* 1-Click Restore Authentic Defaults */}
                  <div className="bg-red-50/50 p-6 rounded-2xl border border-red-200/80 space-y-3">
                    <div className="flex items-center space-x-2 text-red-900 font-serif font-bold text-base">
                      <RotateCcw className="w-4 h-4 text-red-600" />
                      <h4>Restore Authentic SPU Defaults (1-Click Undo)</h4>
                    </div>
                    <p className="text-xs text-red-800 leading-relaxed">
                      If you ever want to revert all changes, clicking this button restores the pristine Oxford Navy palette, Oxford Classical typography, and original CV texts.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Are you sure you want to revert all customization back to pristine institutional defaults?')) {
                          restoreAuthenticDefaults();
                        }
                      }}
                      className="px-4 py-2 rounded-xl bg-red-700 text-white text-xs font-semibold hover:bg-red-800 transition-colors flex items-center space-x-1.5 shadow-xs"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restore Pristine Defaults</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Sticky Bottom Actions Bar */}
            <footer className="px-5 py-3.5 bg-white border-t border-[#E3DDD4] flex items-center justify-between shrink-0 shadow-lg">
              <div className="flex items-center space-x-2 text-xs text-ink-muted">
                {saveToast ? (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1.5 animate-fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    {saveToast}
                  </span>
                ) : lastSavedAt ? (
                  <span>Last synced to production: {lastSavedAt}</span>
                ) : (
                  <span>Ready to save changes</span>
                )}
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={closeStudio}
                  className="px-3.5 py-2 rounded-xl border border-deckle text-xs font-semibold text-ink-muted hover:text-ink hover:bg-gray-50 transition-colors"
                >
                  Close & View Site
                </button>
                <button
                  onClick={handleSaveAll}
                  disabled={isSyncing}
                  className="px-5 py-2 rounded-xl bg-claret text-white text-xs font-semibold hover:bg-claret-light transition-all flex items-center space-x-1.5 shadow-md disabled:opacity-50"
                >
                  {isSyncing ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Publishing to Production...
                    </span>
                  ) : (
                    <>
                      <Save className="w-4 h-4 text-brass" />
                      <span>Save & Publish Live</span>
                    </>
                  )}
                </button>
              </div>
            </footer>
          </div>
        )}
      </div>
    </div>
  );
};
