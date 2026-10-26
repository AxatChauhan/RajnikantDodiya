import React, { useState, useEffect, lazy, Suspense, useMemo } from 'react';
import { STORE_PRODUCTS, StoreProduct } from '../data/storeCatalogData';
import { BOOKS, SOCIAL_LINKS, PROFESSOR_INFO } from '../data/professorData';
import { STUDY_TRACKS, StudyTrackId, StudyTrack, StudyBundleOption } from '../data/studyMaterialsData';
import { useScholarSession, ScholarSession } from '../hooks/useScholarSession';
import { signInScholar, signUpScholar, signOutScholar } from '../lib/credentialAuth';
import { validateIndianMobile, validateEmail, generateSecureDeviceToken } from '../lib/security';
import {
  BookOpen,
  GraduationCap,
  Sparkles,
  ExternalLink,
  Download,
  CheckCircle2,
  Lock,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Laptop,
  HelpCircle,
  FileText,
  Search,
  BookMarked,
  MessageCircle,
  Send,
  Bot,
  UserCheck,
  RotateCcw,
  Check,
  Eye,
  EyeOff,
  UserPlus,
  KeyRound,
  Shield,
  Smartphone,
  Zap,
  Layers,
  Award,
  Book
} from 'lucide-react';
import { MainTab } from './Navbar';
import { useSiteContent } from '../contexts/SiteContentContext';

// Lazily loaded interactive modals
const CirculationDeskModal = lazy(() =>
  import('./library-store/CirculationDeskModal').then(m => ({ default: m.CirculationDeskModal }))
);
const ProtectedReaderModal = lazy(() =>
  import('./library-store/ProtectedReaderModal').then(m => ({ default: m.ProtectedReaderModal }))
);
const ExamPortal = lazy(() =>
  import('./library-store/ExamPortal').then(m => ({ default: m.ExamPortal }))
);

interface LearnPageProps {
  subSection?: string;
  onOpenAuthModal?: () => void;
  onNavigate?: (tab: MainTab, subId?: string) => void;
}

export const LearnPage: React.FC<LearnPageProps> = ({
  subSection,
  onOpenAuthModal,
  onNavigate
}) => {
  const { profile } = useSiteContent();
  // Determine active track from subSection URL parameter or fallback to English
  const [activeTrackId, setActiveTrackId] = useState<StudyTrackId>(() => {
    if (subSection === 'net-vidya-education') return 'net-vidya-education';
    if (subSection === 'tet-ii-gujarat') return 'tet-ii-gujarat';
    return 'net-vidya-english';
  });

  // Keep track in sync when user clicks navbar subtabs
  useEffect(() => {
    if (subSection === 'net-vidya-education') setActiveTrackId('net-vidya-education');
    else if (subSection === 'tet-ii-gujarat') setActiveTrackId('tet-ii-gujarat');
    else if (subSection === 'net-vidya-english') setActiveTrackId('net-vidya-english');
  }, [subSection]);

  const currentTrack: StudyTrack = useMemo(() => {
    return STUDY_TRACKS[activeTrackId] || STUDY_TRACKS['net-vidya-english'];
  }, [activeTrackId]);

  // Auth & Session
  const {
    session: studentSession,
    isBookOwned,
    isExamOwned,
    isBundleOwned,
    saveSession,
    clearSession: handleClearSession
  } = useScholarSession();

  const isLoggedIn = Boolean(
    (studentSession.email || studentSession.mobile) && studentSession.unlockedItems.length > 0
  );

  // Sign up / Sign in Form State (For non-logged in candidates)
  const [authMode, setAuthMode] = useState<'signup' | 'signin'>('signup');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  // Modals & Reader state
  const [selectedProduct, setSelectedProduct] = useState<StoreProduct | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isReaderOpen, setIsReaderOpen] = useState(false);
  const [isExamOpen, setIsExamOpen] = useState(false);
  const [isReaderSample, setIsReaderSample] = useState(false);
  const [isExamSample, setIsExamSample] = useState(false);

  // Interactive Demo PDF Reader Modal
  const [isDemoViewerOpen, setIsDemoViewerOpen] = useState(false);
  const [demoActiveTab, setDemoActiveTab] = useState<'overview' | 'questions' | 'notes'>('overview');

  // AI Tutor State
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiConversation, setAiConversation] = useState<
    { role: 'user' | 'assistant'; text: string }[]
  >([
    {
      role: 'assistant',
      text: 'Hello! I am Dr. Dodiya’s virtual pedagogy tutor. Ask me anything about UGC NET English Literature, Teacher Education, Post-Method Pedagogy, or Gujarat TET-II.'
    }
  ]);

  // Handle Candidate Sign Up
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    const cleanEmail = email.trim();

    if (!cleanName) {
      setAuthError('Please enter your full name.');
      return;
    }
    if (!validateIndianMobile(cleanPhone)) {
      setAuthError('Please enter a valid 10-digit Indian WhatsApp mobile number.');
      return;
    }
    if (!validateEmail(cleanEmail)) {
      setAuthError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setAuthError('Password must be at least 6 characters long.');
      return;
    }

    setAuthSubmitting(true);
    const result = await signUpScholar({
      name: cleanName,
      phone: cleanPhone,
      email: cleanEmail,
      password
    });
    setAuthSubmitting(false);

    if (result.success && result.session) {
      saveSession(result.session);
      setAuthSuccess('Student account created successfully! Welcome to your Study Dashboard.');
      setPassword('');
    } else {
      setAuthError(result.error || 'Failed to create student account. Please verify details.');
    }
  };

  // Handle Candidate Sign In
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    const cleanEmail = email.trim();
    if (!validateEmail(cleanEmail)) {
      setAuthError('Please enter your registered email address.');
      return;
    }
    if (!password) {
      setAuthError('Please enter your password.');
      return;
    }

    setAuthSubmitting(true);
    const result = await signInScholar({
      email: cleanEmail,
      password
    });
    setAuthSubmitting(false);

    if (result.success && result.session) {
      saveSession(result.session);
      setAuthSuccess('Signed in successfully! Dual-device student pass is active.');
      setPassword('');
    } else {
      setAuthError(result.error || 'Invalid credentials. Please verify your email and password.');
    }
  };

  // Trigger Purchase / Checkout for Study Bundle
  const handleSelectBundle = (bundle: StudyBundleOption) => {
    const product = STORE_PRODUCTS.find(p => p.id === bundle.id) || STORE_PRODUCTS[0];
    setSelectedProduct(product);
    setIsCheckoutOpen(true);
  };

  // Handle Successful Bundle Purchase
  const handlePurchaseSuccess = (
    product: StoreProduct,
    buyerName: string,
    buyerMobile: string,
    orderId: string,
    deviceToken?: string
  ) => {
    const updatedUnlocks = [...studentSession.unlockedItems];
    if (product.type === 'book' && !updatedUnlocks.includes('book')) updatedUnlocks.push('book');
    else if (product.type === 'exam' && !updatedUnlocks.includes('exam')) updatedUnlocks.push('exam');
    else if (product.type === 'bundle') {
      if (!updatedUnlocks.includes('book')) updatedUnlocks.push('book');
      if (!updatedUnlocks.includes('exam')) updatedUnlocks.push('exam');
    }

    const updatedSession: ScholarSession = {
      ...studentSession,
      name: buyerName || studentSession.name,
      mobile: buyerMobile || studentSession.mobile,
      orderId: orderId || studentSession.orderId,
      unlockedItems: updatedUnlocks,
      deviceToken: deviceToken || studentSession.deviceToken || generateSecureDeviceToken()
    };

    saveSession(updatedSession);
    setIsCheckoutOpen(false);

    // Open purchased material immediately
    if (product.type === 'book') {
      setIsReaderSample(false);
      setIsReaderOpen(true);
    } else if (product.type === 'exam') {
      setIsExamSample(false);
      setIsExamOpen(true);
    }
  };

  // Generate / Download Demo PDF file
  const handleDownloadDemoPdf = () => {
    const demo = currentTrack.demoPdf;
    const content = [
      `================================================================`,
      `  ${demo.title.toUpperCase()}`,
      `  ${demo.subtitle}`,
      `  H.M. Patel Institute of English Training and Research (HMPIETR)`,
      `  Sardar Patel University • Vallabh Vidyanagar`,
      `================================================================\n`,
      `COURSE TRACK: ${currentTrack.name} (${currentTrack.examCode})`,
      `TARGET ASPIRANTS: ${currentTrack.targetAspirants}`,
      `OFFICIAL NOTE: ${currentTrack.officialNotificationNote}\n`,
      `----------------------------------------------------------------`,
      `1. OVERVIEW & PEDAGOGICAL DIRECTIVES`,
      `----------------------------------------------------------------`,
      demo.overview,
      `\nKEY TOPICS COVERED IN THIS TRACK:`,
      ...demo.keyTopics.map((t, idx) => `  ${idx + 1}. ${t}`),
      `\n----------------------------------------------------------------`,
      `2. HIGH-YIELD CURRICULAR EXCERPTS`,
      `----------------------------------------------------------------`,
      ...demo.excerptText.map(p => `\n${p}`),
      `\n----------------------------------------------------------------`,
      `3. SOLVED MODEL EXAMINATION QUESTIONS WITH PEDAGOGICAL RATIONALE`,
      `----------------------------------------------------------------`,
      ...demo.sampleQuestions.map((q, idx) => {
        return [
          `\n[QUESTION ${idx + 1}]: ${q.question}`,
          ...q.options.map((opt, oIdx) => `  (${String.fromCharCode(65 + oIdx)}) ${opt}`),
          `CORRECT ANSWER: (${String.fromCharCode(65 + q.correctIndex)})`,
          `RATIONALE: ${q.explanation}`
        ].join('\n');
      }),
      `\n================================================================`,
      `STUDY MATERIALS & ENROLLMENT:`,
      `To unlock complete doctoral monographs, 25-MCQ CBT examination simulators,`,
      `and priority mentorship, access your student portal at:`,
      `https://rajnikantdodiya.com`,
      `================================================================`
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = demo.downloadFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // AI Tutor Ask Handler
  const handleAiAsk = (prompt?: string) => {
    const q = prompt || aiQuestion;
    if (!q.trim()) return;

    const newConvo = [...aiConversation, { role: 'user' as const, text: q }];
    setAiConversation(newConvo);
    if (!prompt) setAiQuestion('');

    setTimeout(() => {
      let answer =
        'That is an insightful query. In Dr. Dodiya’s pedagogical research at HMPIETR, preparing for competitive examinations requires balancing linguistic structure with context-sensitive classroom realities. Feel free to explore the study bundles and sample questions in this portal!';

      const lower = q.toLowerCase();
      if (lower.includes('post-method') || lower.includes('kumaravadivelu')) {
        answer =
          'Kumaravadivelu’s Post-Method framework comprises three organizing principles: (1) Particularity (context-sensitive pedagogy), (2) Practicality (teacher theory developed from practice), and (3) Possibility (empowering socio-historical identities). See Dr. Dodiya’s papers and monograph for classroom applications.';
      } else if (lower.includes('english') || lower.includes('literature') || lower.includes('paper 2')) {
        answer =
          'UGC NET English (Subject Code 30) comprises Paper 1 (General Teaching & Research Aptitude) and Paper 2 (English Literature covering Drama, Poetry, Fiction, Non-fiction, Cultural Studies, and Literary Theory). Regular timed MCQ practice with our CBT simulator is strongly advised.';
      } else if (lower.includes('education') || lower.includes('code 09')) {
        answer =
          'UGC NET Education (Subject Code 09) covers philosophical, sociological, and psychological foundations, alongside research methodology and teacher education. Dr. Dodiya’s doctoral monograph at Sardar Patel University focuses on Dr. Kalam’s educational thought and creative inquiry.';
      } else if (lower.includes('tet') || lower.includes('gujarat')) {
        answer =
          'Gujarat TET-II focuses on upper-primary language methodology (Std 6 to 8). Key emphasis is on LSRW skills development, BICS vs. CALP, and constructive translanguaging for Gujarati-medium trainees.';
      }

      setAiConversation([...newConvo, { role: 'assistant', text: answer }]);
    }, 500);
  };

  return (
    <div className="space-y-10 sm:space-y-14 animate-fade-in pt-2 sm:pt-4">
      
      {/* ========================================================= */}
      {/* 1. PORTAL HEADER & THREE STUDY TRACK SUBTABS              */}
      {/* ========================================================= */}
      <div className="space-y-5 pb-6 border-b border-deckle">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-claret-soft text-claret text-xs font-mono font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Official Academic Study & Examination Portal</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl text-ink font-normal mt-1.5 tracking-tight">
              Study Materials & Course Passes
            </h1>
            <p className="text-xs sm:text-sm text-ink-muted font-reading font-light mt-1">
              Curated lecture notes, free demo PDF samplers, CBT online mock exams, and complete preparation bundles by{' '}
              <span className="font-semibold text-ink">{profile.name || PROFESSOR_INFO.name}</span>.
            </p>
          </div>

          {/* User Account / Pass Status Indicator */}
          {isLoggedIn ? (
            <div className="p-3.5 rounded-2xl bg-white border border-deckle shadow-book text-xs space-y-1.5 max-w-sm shrink-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono font-bold uppercase text-claret flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Student Pass Active</span>
                </span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                  2-Device Cloud Pass
                </span>
              </div>
              <p className="font-serif text-ink font-semibold text-sm truncate">{studentSession.name}</p>
              <p className="text-[11px] font-mono text-ink-muted truncate">
                {studentSession.email || `+91 ${studentSession.mobile}`}
              </p>
              <div className="pt-1 flex items-center justify-between text-[11px] font-mono border-t border-deckle/60">
                <button
                  onClick={onOpenAuthModal}
                  className="text-claret hover:underline font-semibold"
                >
                  Manage Devices
                </button>
                <button
                  onClick={handleClearSession}
                  className="text-ink-muted hover:text-claret hover:underline"
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-parchment-warm/80 border border-deckle text-xs space-y-1.5 max-w-sm shrink-0">
              <span className="text-[10px] font-mono uppercase text-claret font-bold flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5" />
                <span>Candidate Access</span>
              </span>
              <p className="text-ink-muted font-reading text-xs leading-relaxed">
                Download the free demo PDF below, or create your student pass to unlock study bundles.
              </p>
            </div>
          )}
        </div>

        {/* ======================================================= */}
        {/* THREE COURSE SUBTABS: English • Education • TET-II      */}
        {/* ======================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          {(Object.keys(STUDY_TRACKS) as StudyTrackId[]).map((trackId) => {
            const track = STUDY_TRACKS[trackId];
            const isSelected = activeTrackId === trackId;

            return (
              <button
                key={trackId}
                onClick={() => setActiveTrackId(trackId)}
                className={`p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between ${
                  isSelected
                    ? 'bg-claret text-white border-claret shadow-md ring-2 ring-claret/20'
                    : 'bg-white hover:bg-parchment-warm/70 border-deckle text-ink hover:border-claret/50 shadow-2xs'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl shrink-0">{track.icon}</span>
                  <div className="min-w-0">
                    <span className="font-serif text-sm font-semibold block leading-tight truncate">
                      {track.name}
                    </span>
                    <span className={`text-[10px] font-mono block truncate ${
                      isSelected ? 'text-brass-light' : 'text-ink-muted'
                    }`}>
                      {track.examCode}
                    </span>
                  </div>
                </div>
                {isSelected && (
                  <span className="w-2 h-2 rounded-full bg-brass shrink-0 animate-pulse ml-2" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. CANDIDATE EXPERIENCE (IF NOT LOGGED IN)                */}
      {/* Free Demo PDF + Quick Onboarding / Sign-Up Form           */}
      {/* ========================================================= */}
      {!isLoggedIn && (
        <section className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT COLUMN: Free Demo PDF Showcase Card */}
            <div className="lg:col-span-7 folio-card p-6 sm:p-8 rounded-3xl bg-white border border-deckle shadow-book space-y-5">
              <div className="flex items-center justify-between gap-2 border-b border-deckle pb-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-mono font-bold border border-emerald-200">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Free Candidate Demo PDF</span>
                </span>
                <span className="text-xs font-mono text-ink-muted">
                  {currentTrack.demoPdf.pages} • {currentTrack.demoPdf.fileSize}
                </span>
              </div>

              <div>
                <h3 className="font-serif text-2xl text-ink font-normal leading-snug">
                  {currentTrack.demoPdf.title}
                </h3>
                <p className="text-xs font-mono text-claret font-semibold mt-1">
                  {currentTrack.name} • {currentTrack.examCode}
                </p>
                <p className="text-xs sm:text-sm text-ink-muted font-reading leading-relaxed mt-2.5">
                  {currentTrack.demoPdf.overview}
                </p>
              </div>

              {/* Demo PDF Highlights List */}
              <div className="p-4 rounded-2xl bg-parchment-warm/70 border border-deckle space-y-2">
                <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-ink-muted block">
                  What is included in this free demo:
                </span>
                <div className="space-y-1.5 text-xs text-ink font-sans">
                  {currentTrack.demoPdf.keyTopics.map((topic, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{topic}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Two Action Buttons: Read Online & Download Demo */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  onClick={() => setIsDemoViewerOpen(true)}
                  className="flex-1 py-3 px-4 rounded-xl bg-claret hover:bg-claret-light text-white text-xs font-semibold shadow-xs transition-all flex items-center justify-center gap-2 min-h-[44px]"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Read Free Demo PDF (Instant Reader)</span>
                </button>

                <button
                  onClick={handleDownloadDemoPdf}
                  className="py-3 px-4 rounded-xl bg-white hover:bg-parchment-warm border border-deckle text-ink text-xs font-semibold shadow-2xs transition-all flex items-center justify-center gap-2 min-h-[44px]"
                  title="Download offline text and solved questions"
                >
                  <Download className="w-4 h-4 text-claret" />
                  <span>Download Demo PDF</span>
                </button>
              </div>
            </div>

            {/* RIGHT COLUMN: Candidate Account Gate (Sign Up / Sign In Form) */}
            <div className="lg:col-span-5 folio-card p-6 sm:p-7 rounded-3xl bg-[#FCFAF7] border-2 border-claret/30 shadow-book space-y-4">
              <div className="space-y-1 text-center sm:text-left">
                <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-claret uppercase tracking-wider">
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{authMode === 'signup' ? 'Create Student Pass' : 'Student Sign In'}</span>
                </div>
                <h4 className="font-serif text-xl text-ink font-normal">
                  {authMode === 'signup' ? 'Register for Full Study Materials' : 'Access Your Student Account'}
                </h4>
                <p className="text-xs text-ink-muted font-reading">
                  {authMode === 'signup'
                    ? 'Save your progress, access your personalized library, and buy study bundles with 2-device cloud pass.'
                    : 'Sign in to access your purchased study materials and CBT mock tests.'}
                </p>
              </div>

              {/* Auth Mode Toggle */}
              <div className="grid grid-cols-2 p-1 rounded-xl bg-parchment-deep/60 border border-deckle text-xs font-sans font-medium text-center">
                <button
                  type="button"
                  onClick={() => { setAuthMode('signup'); setAuthError(null); }}
                  className={`py-1.5 rounded-lg transition-all ${
                    authMode === 'signup' ? 'bg-white shadow-xs font-bold text-claret' : 'text-ink-muted'
                  }`}
                >
                  Sign Up (New)
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMode('signin'); setAuthError(null); }}
                  className={`py-1.5 rounded-lg transition-all ${
                    authMode === 'signin' ? 'bg-white shadow-xs font-bold text-claret' : 'text-ink-muted'
                  }`}
                >
                  Sign In (Existing)
                </button>
              </div>

              {/* Feedback Alerts */}
              {authError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 animate-fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}
              {authSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{authSuccess}</span>
                </div>
              )}

              {/* FORM */}
              <form onSubmit={authMode === 'signup' ? handleSignUp : handleSignIn} className="space-y-3">
                {authMode === 'signup' && (
                  <div>
                    <label className="text-[11px] font-mono uppercase text-ink-muted font-semibold block mb-1">
                      Full Candidate Name:
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="e.g. Aarav Patel"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-deckle focus:border-claret focus:outline-none text-ink shadow-2xs font-sans"
                    />
                  </div>
                )}

                {authMode === 'signup' && (
                  <div>
                    <label className="text-[11px] font-mono uppercase text-ink-muted font-semibold block mb-1">
                      WhatsApp Mobile Number:
                    </label>
                    <div className="flex gap-2">
                      <span className="px-2.5 py-2 text-xs rounded-xl bg-parchment-warm border border-deckle font-mono text-ink-muted flex items-center">
                        +91
                      </span>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        value={phone}
                        onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder="10-digit mobile"
                        className="flex-1 px-3 py-2 text-xs rounded-xl bg-white border border-deckle focus:border-claret focus:outline-none text-ink shadow-2xs font-mono"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[11px] font-mono uppercase text-ink-muted font-semibold block mb-1">
                    Email Address:
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-deckle focus:border-claret focus:outline-none text-ink shadow-2xs font-sans"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono uppercase text-ink-muted font-semibold block mb-1">
                    Password:
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder={authMode === 'signup' ? 'Create a secure password' : 'Enter your password'}
                      className="w-full px-3 py-2 pr-9 text-xs rounded-xl bg-white border border-deckle focus:border-claret focus:outline-none text-ink shadow-2xs font-sans"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(p => !p)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={authSubmitting}
                  className="w-full py-2.5 px-4 rounded-xl bg-claret hover:bg-claret-light text-white text-xs font-semibold shadow-xs transition-all flex items-center justify-center gap-2 min-h-[42px] disabled:opacity-50 mt-2"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>
                    {authSubmitting
                      ? 'Establishing Pass...'
                      : authMode === 'signup'
                      ? 'Sign Up & Open My Study Dashboard →'
                      : 'Sign In to Student Account →'}
                  </span>
                </button>
              </form>

              <div className="pt-1 text-center">
                <span className="text-[10px] font-mono text-ink-muted">
                  Strict 2-Device Policy (1 Mobile Phone + 1 Laptop) • DRM Watermarked
                </span>
              </div>
            </div>

          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* 3. LOGGED-IN CANDIDATE PORTAL: "MY STUDY MATERIALS"       */}
      {/* Displays currently unlocked/owned materials for this track */}
      {/* ========================================================= */}
      {isLoggedIn && (
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-deckle">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-claret font-bold">
                Student Account Dashboard
              </span>
              <h2 className="font-serif text-2xl text-ink font-normal mt-0.5">
                My Enrolled Study Materials ({currentTrack.name})
              </h2>
            </div>
            <span className="text-xs font-mono text-ink-muted">
              {studentSession.unlockedItems.length} Content Licenses Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* MATERIAL 1: Complimentary Track Demo PDF Sampler */}
            <div className="p-5 rounded-2xl bg-white border border-deckle shadow-book flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    ✓ Enrolled (Free Sampler)
                  </span>
                  <span className="text-ink-muted">{currentTrack.demoPdf.pages}</span>
                </div>
                <h4 className="font-serif text-base text-ink font-medium leading-snug">
                  {currentTrack.demoPdf.title}
                </h4>
                <p className="text-xs text-ink-muted font-reading line-clamp-2">
                  {currentTrack.demoPdf.overview}
                </p>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={() => setIsDemoViewerOpen(true)}
                  className="flex-1 py-2 px-3 rounded-xl bg-claret text-white text-xs font-medium hover:bg-claret-light transition-colors flex items-center justify-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Read Online</span>
                </button>
                <button
                  onClick={handleDownloadDemoPdf}
                  className="p-2 rounded-xl bg-parchment-warm border border-deckle text-claret hover:bg-parchment-deep transition-colors"
                  title="Download offline notes"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* MATERIAL 2: Dr. Dodiya's Monograph & Pedagogical Treatise */}
            <div className="p-5 rounded-2xl bg-white border border-deckle shadow-book flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    isBookOwned || isBundleOwned
                      ? 'text-emerald-800 bg-emerald-50 border border-emerald-200'
                      : 'text-amber-800 bg-amber-50 border border-amber-200'
                  }`}>
                    {isBookOwned || isBundleOwned ? '✓ Enrolled (Full E-Book)' : 'Sample Active (Preface)'}
                  </span>
                  <span className="text-ink-muted">Doctoral Study</span>
                </div>
                <h4 className="font-serif text-base text-ink font-medium leading-snug">
                  Educational Thoughts of APJ Abdul Kalam
                </h4>
                <p className="text-xs text-ink-muted font-reading line-clamp-2">
                  Doctoral treatise investigating creative inquiry, moral leadership in classrooms, and NEP 2020 pedagogy.
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    setIsReaderSample(!isBookOwned && !isBundleOwned);
                    setIsReaderOpen(true);
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-claret text-white text-xs font-medium hover:bg-claret-light transition-colors flex items-center justify-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{isBookOwned || isBundleOwned ? 'Open Full Monograph' : 'Read Sample Chapters'}</span>
                </button>
              </div>
            </div>

            {/* MATERIAL 3: CBT Master Mock Examination Simulator */}
            <div className="p-5 rounded-2xl bg-white border border-deckle shadow-book flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    isExamOwned || isBundleOwned
                      ? 'text-emerald-800 bg-emerald-50 border border-emerald-200'
                      : 'text-amber-800 bg-amber-50 border border-amber-200'
                  }`}>
                    {isExamOwned || isBundleOwned ? '✓ Enrolled (Full CBT Engine)' : 'Sample Test (5 MCQs)'}
                  </span>
                  <span className="text-ink-muted">25 MCQs • 60 Mins</span>
                </div>
                <h4 className="font-serif text-base text-ink font-medium leading-snug">
                  CBT Master Mock Exam Simulator
                </h4>
                <p className="text-xs text-ink-muted font-reading line-clamp-2">
                  Timed NTA-style online test series with instant scorecard, percentile, and Dr. Dodiya’s rationale.
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    setIsExamSample(!isExamOwned && !isBundleOwned);
                    setIsExamOpen(true);
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-emerald-700 text-white text-xs font-medium hover:bg-emerald-600 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isExamOwned || isBundleOwned ? 'Launch Full CBT Exam' : 'Try Sample Test (5 MCQs)'}</span>
                </button>
              </div>
            </div>

          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* 4. STUDY BUNDLES WITH PRICE TAGS (BUY & UNLOCK)           */}
      {/* Available for purchase to all students                    */}
      {/* ========================================================= */}
      <section className="space-y-5">
        <div className="pb-2 border-b border-deckle flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-claret font-bold">
              Study Packages & Enrolment
            </span>
            <h2 className="font-serif text-2xl text-ink font-normal mt-0.5">
              Available Study Bundles for {currentTrack.name}
            </h2>
          </div>
          <span className="text-xs font-mono text-ink-muted">
            Bank-Verified Secure Payment • Instant Access
          </span>
        </div>

        <p className="text-xs sm:text-sm text-ink-muted font-reading leading-relaxed">
          Select a study bundle below to add its complete materials, full-length CBT test simulators, and e-books directly into your student account.
        </p>

        {/* BUNDLE CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-1 auto-rows-fr">
          {currentTrack.bundles.map((bundle) => {
            const isOwned =
              (bundle.productType === 'book' && (isBookOwned || isBundleOwned)) ||
              (bundle.productType === 'exam' && (isExamOwned || isBundleOwned)) ||
              (bundle.productType === 'bundle' && isBundleOwned);

            return (
              <div
                key={bundle.id}
                className={`pw-card p-6 sm:p-7 rounded-3xl flex flex-col justify-between space-y-5 relative transition-all h-full min-w-0 ${
                  bundle.isPopular
                    ? 'border-2 border-claret shadow-xl ring-4 ring-claret/5 bg-gradient-to-b from-white to-[#FAF7F2]'
                    : 'bg-white border border-gray-200'
                }`}
              >
                {/* Popular Badge */}
                {bundle.isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-claret text-white text-[10px] font-mono font-bold uppercase tracking-wider shadow-sm">
                    ★ Most Popular Choice
                  </div>
                )}

                <div className="space-y-3 min-w-0">
                  <div className="flex items-center justify-between text-xs font-mono gap-2 flex-wrap">
                    <span className="text-[11px] font-bold text-claret bg-claret-soft px-2.5 py-0.5 rounded-full shrink-0">
                      {bundle.badge}
                    </span>
                    <span className="discount-pill px-2 py-0.5 rounded-full text-[10px] shrink-0">
                      Save {bundle.discountPercentage}%
                    </span>
                  </div>

                  <div className="min-w-0">
                    <h3 className="font-serif text-xl text-ink font-semibold leading-tight break-words">
                      {bundle.title}
                    </h3>
                    <p className="text-xs text-ink-muted font-reading mt-1 leading-snug break-words">
                      {bundle.subtitle}
                    </p>
                  </div>

                  {/* PRICE TAG */}
                  <div className="pt-2 flex items-baseline gap-2">
                    <span className="font-serif text-3xl sm:text-4xl text-ink font-bold">
                      ₹{bundle.price}
                    </span>
                    <span className="text-xs text-ink-muted line-through font-mono">
                      ₹{bundle.originalPrice}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">
                      One-time fee
                    </span>
                  </div>

                  {/* Features Bullet List */}
                  <div className="pt-2 space-y-2 border-t border-deckle/60">
                    <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-ink-muted block">
                      Included Study Materials:
                    </span>
                    <ul className="space-y-1.5 text-xs text-ink font-sans">
                      {bundle.features.map((feat, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span className="leading-snug">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* BUY / ENROL BUTTON */}
                <div className="pt-3 border-t border-deckle/60">
                  {isOwned ? (
                    <button
                      onClick={() => {
                        if (bundle.productType === 'book') {
                          setIsReaderSample(false);
                          setIsReaderOpen(true);
                        } else {
                          setIsExamSample(false);
                          setIsExamOpen(true);
                        }
                      }}
                      className="w-full py-3 px-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs hover:bg-emerald-100 transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>✓ Enrolled • Open Material</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (!isLoggedIn) {
                          // Scroll to signup box
                          window.scrollTo({ top: 320, behavior: 'smooth' });
                          setAuthError('Please create a free account or sign in above before completing checkout.');
                        } else {
                          handleSelectBundle(bundle);
                        }
                      }}
                      className={`w-full py-3 px-4 rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition-all min-h-[44px] ${
                        bundle.isPopular
                          ? 'bg-claret hover:bg-claret-light text-white'
                          : 'bg-ink hover:bg-black text-white'
                      }`}
                    >
                      <Zap className="w-4 h-4 text-brass" />
                      <span>Buy Study Bundle (₹{bundle.price}) →</span>
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 5. INTERACTIVE DEMO PDF READER MODAL                      */}
      {/* Allows candidates to sample Dr. Dodiya's notes & MCQs     */}
      {/* ========================================================= */}
      {isDemoViewerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-ink-pure/70 backdrop-blur-xs animate-fade-in">
          <div className="folio-card bg-white rounded-2xl sm:rounded-3xl max-w-2xl w-full max-h-[90dvh] overflow-y-auto p-6 sm:p-8 shadow-book-xl border border-deckle relative space-y-5">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-deckle pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                  Free Candidate Sampler
                </span>
                <h3 className="font-serif text-xl sm:text-2xl text-ink font-normal mt-1">
                  {currentTrack.demoPdf.title}
                </h3>
                <span className="text-xs font-mono text-ink-muted">
                  {currentTrack.name} • {currentTrack.demoPdf.pages}
                </span>
              </div>
              <button
                onClick={() => setIsDemoViewerOpen(false)}
                className="p-1.5 rounded-lg bg-parchment-warm hover:bg-parchment-deep text-ink-muted"
                aria-label="Close reader"
              >
                ✕
              </button>
            </div>

            {/* Sub-tabs inside demo modal */}
            <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-parchment-warm/80 border border-deckle text-xs font-medium text-center">
              <button
                onClick={() => setDemoActiveTab('overview')}
                className={`py-1.5 rounded-lg transition-all ${
                  demoActiveTab === 'overview' ? 'bg-white shadow-2xs font-bold text-claret' : 'text-ink-muted'
                }`}
              >
                Overview & Syllabus
              </button>
              <button
                onClick={() => setDemoActiveTab('notes')}
                className={`py-1.5 rounded-lg transition-all ${
                  demoActiveTab === 'notes' ? 'bg-white shadow-2xs font-bold text-claret' : 'text-ink-muted'
                }`}
              >
                Sample Notes Excerpt
              </button>
              <button
                onClick={() => setDemoActiveTab('questions')}
                className={`py-1.5 rounded-lg transition-all ${
                  demoActiveTab === 'questions' ? 'bg-white shadow-2xs font-bold text-claret' : 'text-ink-muted'
                }`}
              >
                Solved MCQs ({currentTrack.demoPdf.sampleQuestions.length})
              </button>
            </div>

            {/* Tab 1: Overview */}
            {demoActiveTab === 'overview' && (
              <div className="space-y-4 text-xs font-sans text-ink leading-relaxed">
                <p className="font-reading text-sm text-ink-muted leading-relaxed">
                  {currentTrack.demoPdf.overview}
                </p>
                <div className="p-4 rounded-xl bg-parchment-warm/60 border border-deckle space-y-2">
                  <span className="font-mono text-[11px] font-bold uppercase text-claret block">
                    Core Exam Competencies:
                  </span>
                  <ul className="space-y-1.5 list-disc pl-4 text-ink-muted font-reading">
                    {currentTrack.demoPdf.keyTopics.map((topic, idx) => (
                      <li key={idx}>{topic}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Tab 2: Sample Notes */}
            {demoActiveTab === 'notes' && (
              <div className="space-y-3 text-xs font-reading text-ink leading-relaxed max-h-72 overflow-y-auto p-1">
                {currentTrack.demoPdf.excerptText.map((paragraph, idx) => (
                  <p key={idx} className={paragraph.startsWith('UNIT') || paragraph.startsWith('PREFACE') ? 'font-bold font-mono text-claret pt-2' : ''}>
                    {paragraph}
                  </p>
                ))}
              </div>
            )}

            {/* Tab 3: Solved MCQs */}
            {demoActiveTab === 'questions' && (
              <div className="space-y-4 text-xs font-sans max-h-72 overflow-y-auto p-1">
                {currentTrack.demoPdf.sampleQuestions.map((q, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-parchment-warm/50 border border-deckle space-y-2">
                    <p className="font-bold text-ink">
                      {idx + 1}. {q.question}
                    </p>
                    <div className="space-y-1 pl-2">
                      {q.options.map((opt, oIdx) => (
                        <div
                          key={oIdx}
                          className={`p-1.5 rounded-lg flex items-center gap-2 ${
                            oIdx === q.correctIndex
                              ? 'bg-emerald-100/70 text-emerald-950 font-semibold'
                              : 'text-ink-muted'
                          }`}
                        >
                          <span className="font-mono font-bold">({String.fromCharCode(65 + oIdx)})</span>
                          <span>{opt}</span>
                          {oIdx === q.correctIndex && <Check className="w-3.5 h-3.5 text-emerald-700 ml-auto" />}
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] text-emerald-900 font-reading pt-1 border-t border-deckle/60">
                      <strong>Pedagogical Rationale:</strong> {q.explanation}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Modal Footer Actions */}
            <div className="pt-2 flex items-center justify-between gap-3 border-t border-deckle">
              <button
                onClick={handleDownloadDemoPdf}
                className="py-2 px-3 rounded-xl bg-parchment-warm hover:bg-parchment-deep text-xs font-sans font-medium text-claret flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Demo File</span>
              </button>
              <button
                onClick={() => setIsDemoViewerOpen(false)}
                className="py-2 px-4 rounded-xl bg-claret text-white text-xs font-semibold"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. AI PEDAGOGY TUTOR (INTERACTIVE ACADEMIC COMPANION)     */}
      {/* ========================================================= */}
      <section id="ai-tutor" className="folio-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 bg-white border border-deckle shadow-book space-y-4">
        <div className="flex items-center gap-2 text-claret">
          <Bot className="w-5 h-5 shrink-0" />
          <h2 className="font-serif text-xl sm:text-2xl text-ink font-normal">
            Dr. Dodiya Virtual Pedagogy Tutor
          </h2>
        </div>

        <p className="text-xs sm:text-sm text-ink-muted font-reading leading-relaxed">
          Ask questions about UGC-NET syllabus requirements, Dr. Kalam’s educational epistemology, or Kumaravadivelu’s post-method parameters.
        </p>

        {/* Conversation Box */}
        <div className="p-4 rounded-2xl bg-parchment-warm/70 border border-deckle space-y-3 max-h-64 overflow-y-auto text-xs font-sans">
          {aiConversation.map((msg, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-xl ${
                msg.role === 'user'
                  ? 'bg-claret text-white ml-auto max-w-[85%]'
                  : 'bg-white text-ink border border-deckle mr-auto max-w-[85%] shadow-2xs font-reading'
              }`}
            >
              <span className="font-mono text-[10px] block opacity-75 mb-0.5">
                {msg.role === 'user' ? 'You' : 'Pedagogy Tutor'}
              </span>
              <p className="leading-relaxed">{msg.text}</p>
            </div>
          ))}
        </div>

        {/* Input Form */}
        <form
          onSubmit={e => {
            e.preventDefault();
            handleAiAsk();
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={aiQuestion}
            onChange={e => setAiQuestion(e.target.value)}
            placeholder="Ask a question about UGC NET English or Education..."
            className="flex-1 px-4 py-2.5 text-xs rounded-xl bg-white border border-deckle focus:border-claret focus:outline-none text-ink shadow-2xs font-sans"
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-claret hover:bg-claret-light text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ask</span>
          </button>
        </form>
      </section>

      {/* ========================================================= */}
      {/* 7. OFFICIAL GOVERNMENT PORTALS & RESOURCE DIRECTORY       */}
      {/* ========================================================= */}
      <section className="folio-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 bg-parchment-warm/60 border border-deckle space-y-4">
        <span className="text-[10px] font-mono uppercase tracking-widest text-claret font-bold block">
          Official University & NTA Directories
        </span>
        <h3 className="font-serif text-lg sm:text-xl text-ink font-normal">
          Official Verification & Government Exam Portals
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs font-sans">
          <a
            href="https://ugcnet.nta.ac.in/"
            target="_blank"
            rel="noreferrer"
            className="p-3.5 rounded-xl bg-white border border-deckle hover:border-claret text-ink flex items-center justify-between group shadow-2xs transition-colors"
          >
            <div>
              <span className="font-semibold block">NTA UGC-NET Portal</span>
              <span className="text-[10px] font-mono text-ink-muted">ugcnet.nta.ac.in</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-ink-muted group-hover:text-claret" />
          </a>

          <a
            href="https://www.gujaratgset.ac.in/"
            target="_blank"
            rel="noreferrer"
            className="p-3.5 rounded-xl bg-white border border-deckle hover:border-claret text-ink flex items-center justify-between group shadow-2xs transition-colors"
          >
            <div>
              <span className="font-semibold block">Gujarat GSET Portal</span>
              <span className="text-[10px] font-mono text-ink-muted">gujaratgset.ac.in</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-ink-muted group-hover:text-claret" />
          </a>

          <a
            href="https://sebexam.org/"
            target="_blank"
            rel="noreferrer"
            className="p-3.5 rounded-xl bg-white border border-deckle hover:border-claret text-ink flex items-center justify-between group shadow-2xs transition-colors"
          >
            <div>
              <span className="font-semibold block">Gujarat SEB (TET-II)</span>
              <span className="text-[10px] font-mono text-ink-muted">sebexam.org</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-ink-muted group-hover:text-claret" />
          </a>
        </div>
      </section>

      {/* ========================================================= */}
      {/* MODALS: Checkout Modal, DRM Reader, CBT Exam Portal       */}
      {/* ========================================================= */}
      {isCheckoutOpen && (
        <Suspense fallback={null}>
          <CirculationDeskModal
            isOpen={isCheckoutOpen}
            onClose={() => setIsCheckoutOpen(false)}
            selectedProduct={selectedProduct}
            onPurchaseSuccess={handlePurchaseSuccess}
          />
        </Suspense>
      )}

      {isReaderOpen && (
        <Suspense fallback={null}>
          <ProtectedReaderModal
            isOpen={isReaderOpen}
            onClose={() => setIsReaderOpen(false)}
            studentName={studentSession.name || 'Scholar Candidate'}
            studentMobile={studentSession.mobile || 'Verified Pass'}
            orderId={studentSession.orderId || 'DEMO-PASS'}
            isUnlocked={isBookOwned || isBundleOwned}
            onUnlockRequest={() => {
              setIsReaderOpen(false);
              const bookProd = STORE_PRODUCTS.find(p => p.type === 'book') || STORE_PRODUCTS[0];
              setSelectedProduct(bookProd);
              setIsCheckoutOpen(true);
            }}
          />
        </Suspense>
      )}

      {isExamOpen && (
        <Suspense fallback={null}>
          <ExamPortal
            isOpen={isExamOpen}
            onClose={() => setIsExamOpen(false)}
            studentName={studentSession.name || 'Scholar Candidate'}
            orderId={studentSession.orderId || 'DEMO-PASS'}
            isUnlocked={isExamOwned || isBundleOwned}
            onUnlockRequest={() => {
              setIsExamOpen(false);
              const examProd = STORE_PRODUCTS.find(p => p.type === 'exam') || STORE_PRODUCTS[1];
              setSelectedProduct(examProd);
              setIsCheckoutOpen(true);
            }}
          />
        </Suspense>
      )}

    </div>
  );
};
