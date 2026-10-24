import React, { useState, lazy, Suspense } from 'react';
import { STORE_PRODUCTS, StoreProduct } from '../../data/storeCatalogData';
import { BOOKS, SOCIAL_LINKS, PROFESSOR_INFO } from '../../data/professorData';
import { useScholarSession, ScholarSession } from '../../hooks/useScholarSession';
import { generateSecureDeviceToken } from '../../lib/security';
import { loginAndTransferDevice } from '../../lib/supabase';
import {
  BookOpen,
  Laptop,
  Lock,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Library,
  ExternalLink,
  MessageCircle,
  Copy,
  Check,
  Search,
  FileText,
  ChevronRight,
  UserCheck,
  RotateCcw,
  Info,
  AlertCircle,
  Layers,
  GraduationCap,
  X
} from 'lucide-react';
import { MainTab } from '../Navbar';

// Lazily loaded checkout modal, DRM reader modal, and CBT exam portal
const CirculationDeskModal = lazy(() =>
  import('./CirculationDeskModal').then(m => ({ default: m.CirculationDeskModal }))
);
const ProtectedReaderModal = lazy(() =>
  import('./ProtectedReaderModal').then(m => ({ default: m.ProtectedReaderModal }))
);
const ExamPortal = lazy(() =>
  import('./ExamPortal').then(m => ({ default: m.ExamPortal }))
);

// Scholarly synopses for Dr. Dodiya's published catalog
const BOOK_SYNOPSES: Record<string, string> = {
  "978-81-937539-0-3": "Dr. Dodiya's definitive doctoral treatise investigating Dr. A.P.J. Abdul Kalam's educational philosophy, synthesizing ethical leadership, experiential learning, and national youth empowerment into a contemporary pedagogical framework.",
  "978-81-937539-1-0": "A focused pedagogical monograph analyzing Dr. Kalam's imperatives for rural education uplift, moral science in schools, and the transformation of teachers into empathetic intellectual guides.",
  "978-93-85037-51-1": "A comprehensive curriculum manual for B.Ed. and M.Ed. teacher trainees, addressing LSRW skill development, post-CLT methodologies, and lesson planning in Indian regional contexts.",
  "978-93-85037-50-4": "A comparative philosophical survey exploring the pedagogical paradigms of Swami Vivekananda, Sri Aurobindo, Mahatma Gandhi, Dr. B.R. Ambedkar, and Dr. Kalam.",
  "978-93-5311-203-5": "A biographical pedagogical sourcebook chronicling key transformative milestones from Rameswaram to the Rashtrapati Bhavan, highlighting principles of resilience and scientific inquiry.",
  "978-93-5311-260-8": "An analytical treatise examining socioeconomic determinants of literacy, institutional quality assurance (IQAC), and systemic policy reforms in Indian teacher education.",
  "978-81-931777-6-1": "An edited university volume examining epistemology, classical Indian darshanas, NEP 2020 IKS mandates, and their dialectic encounter with Western educational theories.",
  "978-93-90256-27-3": "An authoritative examination companion covering British literature chronologies, critical theory, American & postcolonial literatures, and high-yield solved question banks.",
  "978-81-931777-4-7": "An edited research collection focusing on techno-pedagogical integration, AI in language classrooms, blended learning, and task-based language teaching.",
  "978-81-931777-1-6": "A scholarly inquiry into B. Kumaravadivelu's post-method condition (particularity, practicality, possibility) applied to English language classrooms in Gujarat.",
  "978-93-6729-117-7": "A university treatise chapter exploring digital learning architectures, AI-integrated techno-pedagogy, and open educational resources aligned with NEP 2020."
};

export interface AcademicStorePageProps {
  onOpenAuthModal?: () => void;
  onNavigate?: (tab: MainTab, subId?: string) => void;
}

export const AcademicStorePage: React.FC<AcademicStorePageProps> = ({
  onOpenAuthModal,
  onNavigate
}) => {
  const [selectedProduct, setSelectedProduct] = useState<StoreProduct | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isReaderOpen, setIsReaderOpen] = useState(false);
  const [isExamOpen, setIsExamOpen] = useState(false);
  const [isReaderSample, setIsReaderSample] = useState(false);
  const [isExamSample, setIsExamSample] = useState(false);

  // Quick Pass Restoration state
  const [restorePhone, setRestorePhone] = useState('');
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Inspection modal for physical books
  const [inspectedBook, setInspectedBook] = useState<{
    title: string;
    subtitle?: string;
    year: number | string;
    publisher: string;
    isbn: string;
    type: 'authored' | 'edited' | 'chapter';
    synopsis: string;
  } | null>(null);

  const [copiedCitation, setCopiedCitation] = useState(false);

  // Synchronized active scholar session
  const {
    session: studentSession,
    isBookOwned,
    isExamOwned,
    isBundleOwned,
    isComplimentaryOwned,
    saveSession,
    clearSession: handleClearSession
  } = useScholarSession();

  const bookProduct = STORE_PRODUCTS.find(p => p.type === 'book') || STORE_PRODUCTS[0];
  const examProduct = STORE_PRODUCTS.find(p => p.type === 'exam') || STORE_PRODUCTS[1];
  const bundleProduct = STORE_PRODUCTS.find(p => p.type === 'bundle') || STORE_PRODUCTS[2];

  const handleOpenCheckout = (product: StoreProduct) => {
    setSelectedProduct(product);
    setIsCheckoutOpen(true);
  };

  const handlePurchaseSuccess = (
    product: StoreProduct,
    name: string,
    mobile: string,
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
      name,
      mobile,
      orderId,
      unlockedItems: updatedUnlocks,
      deviceToken: deviceToken || studentSession.deviceToken || generateSecureDeviceToken()
    };

    saveSession(updatedSession);

    if (product.type === 'book') {
      setIsReaderSample(false);
      setIsReaderOpen(true);
    } else {
      setIsExamSample(false);
      setIsExamOpen(true);
    }
  };

  const handleQuickRestore = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = restorePhone.replace(/\D/g, '').slice(-10);
    if (!clean || clean.length !== 10) {
      setRestoreMessage({ text: 'Please enter a valid 10-digit Indian mobile number.', isError: true });
      return;
    }

    setRestoreLoading(true);
    setRestoreMessage(null);

    try {
      const res = await loginAndTransferDevice(clean);
      if (res.success) {
        const newSession: ScholarSession = {
          name: res.name || 'Scholar',
          mobile: clean,
          orderId: res.orderId || 'PASS-RESTORED',
          unlockedItems: res.unlockedItems || ['complimentary_book'],
          deviceToken: res.deviceToken || generateSecureDeviceToken()
        };
        saveSession(newSession);
        setRestoreMessage({
          text: `Pass verified! Welcome back, ${res.name || 'Scholar'}. Active holdings: ${(res.unlockedItems || []).join(', ')}`,
          isError: false
        });
        setRestorePhone('');
      } else {
        setRestoreMessage({
          text: res.error || 'No active passes found for this number. If you just acquired one, please allow a moment or verify your number.',
          isError: true
        });
      }
    } catch {
      setRestoreMessage({ text: 'Unable to connect to verification server. Please try again.', isError: true });
    } finally {
      setRestoreLoading(false);
    }
  };

  const handleCopyCitation = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCitation(true);
    setTimeout(() => setCopiedCitation(false), 2400);
  };

  return (
    <div className="space-y-12 sm:space-y-16 animate-fade-in pt-2 sm:pt-4 pb-16">
      
      {/* ========================================================= */}
      {/* 1. HEADER: DIGNIFIED SCHOLARLY REPOSITORY                */}
      {/* ========================================================= */}
      <div className="pb-6 border-b border-deckle flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-claret-soft border border-claret/20 text-claret text-[10px] sm:text-xs font-mono font-semibold">
            <Library className="w-3.5 h-3.5" />
            <span>SARDAR PATEL UNIVERSITY • ACADEMIC STUDY REPOSITORY</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl text-ink font-normal tracking-tight">
            Academic Bookstore & Study Passes
          </h1>

          <p className="text-xs sm:text-sm text-ink-muted font-reading font-light leading-relaxed">
            Authorized digital monographs, interactive UGC-NET examination simulators, and published research volumes by <strong className="font-medium text-ink">Dr. Rajnikant S. Dodiya</strong>. Protected by single-device academic licensing and dynamic forensic watermarking.
          </p>
        </div>

        {/* Active Student Pass Status Box */}
        {studentSession.unlockedItems.length > 0 ? (
          <div className="p-4 rounded-2xl bg-white border border-deckle shadow-book text-xs space-y-2 max-w-xs shrink-0 w-full md:w-auto">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase text-claret flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" /> Active Student Pass
              </span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                1-Device Active
              </span>
            </div>
            <div>
              <p className="font-serif text-ink font-semibold text-sm truncate">{studentSession.name}</p>
              <p className="text-[11px] font-mono text-ink-muted">Access ID: #{studentSession.orderId}</p>
            </div>
            <div className="flex flex-wrap gap-1 pt-1">
              {isBookOwned && (
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                  ✓ Full Monograph
                </span>
              )}
              {isExamOwned && (
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 font-bold">
                  ✓ CBT Simulator
                </span>
              )}
              {isComplimentaryOwned && !isBookOwned && (
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-bold">
                  Complimentary Preview
                </span>
              )}
            </div>
            <div className="pt-2 border-t border-deckle flex items-center justify-between text-[11px] font-mono">
              <button
                onClick={onOpenAuthModal}
                className="text-claret hover:underline font-semibold"
              >
                Switch Device
              </button>
              <button
                onClick={handleClearSession}
                className="text-ink-muted hover:text-claret hover:underline"
              >
                Log Out
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-parchment-warm/80 border border-deckle text-xs space-y-2 max-w-xs shrink-0 w-full md:w-auto">
            <span className="text-[10px] font-mono uppercase text-claret font-bold flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5" /> Scholar Access Desk
            </span>
            <p className="text-ink-muted font-reading text-[11px] leading-relaxed">
              Acquired passes activate instantly on this device. Sign in or enter your mobile number below to restore previous holdings.
            </p>
            {onOpenAuthModal && (
              <button
                onClick={onOpenAuthModal}
                className="text-xs text-claret font-medium hover:underline flex items-center gap-1 font-sans pt-1"
              >
                <span>Open Student Login Portal</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 2. BAY I: DIGITAL STUDY PASSES & SIMULATORS (3 TIERS)    */}
      {/* ========================================================= */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-deckle">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-claret font-bold">
              Instant Cloud Access
            </span>
            <h2 className="font-serif text-2xl text-ink font-normal mt-0.5">
              Digital Study Passes & Examination Portals
            </h2>
          </div>
          <span className="text-xs font-mono text-ink-muted">Single-Device DRM Protected</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          
          {/* PRODUCT 1: DIGITAL MONOGRAPH */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white border-2 border-deckle shadow-book flex flex-col justify-between space-y-6 transition-all hover:border-claret/50">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-claret font-bold bg-claret-soft px-2.5 py-1 rounded">
                  {bookProduct.badge}
                </span>
                <div className="text-right">
                  <span className="font-serif font-bold text-2xl text-ink">₹{bookProduct.price}</span>
                  <span className="text-[11px] font-mono text-ink-muted line-through ml-1.5">₹{bookProduct.originalPrice}</span>
                </div>
              </div>

              <div>
                <h3 className="font-serif text-xl text-ink font-medium leading-snug">
                  {bookProduct.title}
                </h3>
                <p className="text-xs text-claret font-serif mt-1 italic">
                  {bookProduct.subtitle}
                </p>
              </div>

              <p className="text-xs text-ink-muted font-reading leading-relaxed">
                Complete doctoral inquiry synthesizing Dr. Kalam’s educational thought into modern English pedagogy, experiential learning, and NEP 2020 frameworks.
              </p>

              <div className="p-3 rounded-xl bg-parchment-warm/60 border border-deckle/60 space-y-1.5 text-xs text-ink-muted">
                <div className="flex items-center gap-1.5 text-ink font-medium font-serif text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Cloud Reader Features:</span>
                </div>
                <ul className="space-y-1 pl-5 list-disc text-[11px] font-reading">
                  <li>Full 4 Scholarly Chapters & Epigraphs</li>
                  <li>In-Browser Reader with Parchment & Sepia themes</li>
                  <li>Dynamic Name & Mobile Forensic Watermark</li>
                  <li>Search & Paragraph Indentation controls</li>
                </ul>
              </div>
            </div>

            <div className="pt-4 border-t border-deckle/60 space-y-2">
              <button
                onClick={() => {
                  setIsReaderSample(true);
                  setIsReaderOpen(true);
                }}
                className="w-full py-2 px-3 rounded-xl bg-parchment-warm hover:bg-parchment-deep text-ink text-xs font-medium border border-deckle transition-all"
              >
                Read Free Sample Preface
              </button>

              {isBookOwned ? (
                <button
                  onClick={() => {
                    setIsReaderSample(false);
                    setIsReaderOpen(true);
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-800 text-white hover:bg-emerald-900 text-xs font-medium transition-all shadow-xs flex items-center justify-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5" /> Read Unlocked Monograph
                </button>
              ) : (
                <button
                  onClick={() => handleOpenCheckout(bookProduct)}
                  className="w-full py-2.5 px-3 rounded-xl bg-claret text-white hover:bg-claret-dark text-xs font-medium transition-all shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5 text-brass" /> Acquire Reader Pass (₹{bookProduct.price})
                </button>
              )}
            </div>
          </div>

          {/* PRODUCT 2: CBT MOCK EXAM SIMULATOR */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white border-2 border-deckle shadow-book flex flex-col justify-between space-y-6 transition-all hover:border-blue-900/40">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-blue-900 font-bold bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
                  {examProduct.badge}
                </span>
                <div className="text-right">
                  <span className="font-serif font-bold text-2xl text-ink">₹{examProduct.price}</span>
                  <span className="text-[11px] font-mono text-ink-muted line-through ml-1.5">₹{examProduct.originalPrice}</span>
                </div>
              </div>

              <div>
                <h3 className="font-serif text-xl text-ink font-medium leading-snug">
                  {examProduct.title}
                </h3>
                <p className="text-xs text-blue-900 font-serif mt-1 italic">
                  {examProduct.subtitle}
                </p>
              </div>

              <p className="text-xs text-ink-muted font-reading leading-relaxed">
                Rigorous simulation of the official NTA computer-based examination. Features curated high-yield questions spanning Literary Theory, Cultural Studies, and English in India.
              </p>

              <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100 space-y-1.5 text-xs text-ink-muted">
                <div className="flex items-center gap-1.5 text-ink font-medium font-serif text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-800" />
                  <span>Exam Engine Highlights:</span>
                </div>
                <ul className="space-y-1 pl-5 list-disc text-[11px] font-reading">
                  <li>Timed 50-Minute Session with Live Clock</li>
                  <li>Realistic NTA Question Palette & Flags</li>
                  <li>Dr. Dodiya's Comprehensive Explanations</li>
                  <li>Instant Diagnostic Score & Review Report</li>
                </ul>
              </div>
            </div>

            <div className="pt-4 border-t border-deckle/60 space-y-2">
              <button
                onClick={() => {
                  setIsExamSample(true);
                  setIsExamOpen(true);
                }}
                className="w-full py-2 px-3 rounded-xl bg-parchment-warm hover:bg-parchment-deep text-ink text-xs font-medium border border-deckle transition-all"
              >
                Try 3-Question Free Diagnostic
              </button>

              {isExamOwned ? (
                <button
                  onClick={() => {
                    setIsExamSample(false);
                    setIsExamOpen(true);
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-blue-900 text-white hover:bg-blue-950 text-xs font-medium transition-all shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Laptop className="w-3.5 h-3.5" /> Launch CBT Simulator
                </button>
              ) : (
                <button
                  onClick={() => handleOpenCheckout(examProduct)}
                  className="w-full py-2.5 px-3 rounded-xl bg-blue-900 text-white hover:bg-blue-950 text-xs font-medium transition-all shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5 text-blue-200" /> Acquire CBT Pass (₹{examProduct.price})
                </button>
              )}
            </div>
          </div>

          {/* PRODUCT 3: THE SCHOLAR BUNDLE (BEST VALUE) */}
          <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-[#1C140E] to-[#2E1810] text-white border-2 border-brass/50 shadow-book flex flex-col justify-between space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brass/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-brass font-bold bg-brass/15 border border-brass/30 px-2.5 py-1 rounded">
                  {bundleProduct.badge}
                </span>
                <div className="text-right">
                  <span className="font-serif font-bold text-2xl text-brass">₹{bundleProduct.price}</span>
                  <span className="text-[11px] font-mono text-[#D7C3B0] line-through ml-1.5">₹{bundleProduct.originalPrice}</span>
                </div>
              </div>

              <div>
                <h3 className="font-serif text-xl text-[#FFFDF9] font-medium leading-snug">
                  {bundleProduct.title}
                </h3>
                <p className="text-xs text-brass/90 font-serif mt-1 italic">
                  {bundleProduct.subtitle}
                </p>
              </div>

              <p className="text-xs text-[#D7C3B0] font-reading leading-relaxed">
                The all-inclusive academic pass providing unrestricted single-device access to both Dr. Dodiya’s complete doctoral treatise and the full 25-question UGC-NET CBT exam engine.
              </p>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1.5 text-xs text-[#E8DCCF]">
                <div className="flex items-center gap-1.5 text-brass font-medium font-serif text-[11px]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Everything Included:</span>
                </div>
                <ul className="space-y-1 pl-5 list-disc text-[11px] font-reading text-[#D7C3B0]">
                  <li>Full Access to Monograph In-Browser Reader (₹399 value)</li>
                  <li>Full Access to CBT 25-Q Mock Exam Engine (₹299 value)</li>
                  <li>Combined savings of ₹99</li>
                  <li>Priority updates on future UGC NET question revisions</li>
                </ul>
              </div>
            </div>

            <div className="pt-4 border-t border-white/15 relative z-10">
              {isBundleOwned || (isBookOwned && isExamOwned) ? (
                <div className="w-full py-2.5 px-3 rounded-xl bg-emerald-800 text-white text-xs font-medium text-center shadow-xs flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-200" /> Complete Bundle Active
                </div>
              ) : (
                <button
                  onClick={() => handleOpenCheckout(bundleProduct)}
                  className="w-full py-3 px-3 rounded-xl bg-gradient-to-r from-brass to-brass-light hover:brightness-105 text-[#1C140E] text-xs font-semibold transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Acquire Master Bundle (₹{bundleProduct.price})
                </button>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. QUICK PASS RESTORATION DESK                            */}
      {/* ========================================================= */}
      <section className="p-6 sm:p-8 rounded-3xl bg-parchment-warm/70 border border-deckle shadow-book">
        <div className="max-w-2xl space-y-4">
          <div className="flex items-center gap-2 text-claret">
            <RotateCcw className="w-4 h-4" />
            <h3 className="font-serif text-lg text-ink font-normal">
              Restore Previous Purchases on this Device
            </h3>
          </div>
          <p className="text-xs text-ink-muted font-reading leading-relaxed">
            Already acquired a study pass on another phone or laptop? Enter your 10-digit Indian mobile number to transfer your active session to this device under our 1-device academic license policy.
          </p>

          <form onSubmit={handleQuickRestore} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-md pt-1">
            <input
              type="tel"
              value={restorePhone}
              onChange={e => setRestorePhone(e.target.value)}
              placeholder="Enter 10-digit mobile (+91)"
              className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-deckle text-xs font-mono text-ink placeholder:text-ink-faint focus:outline-none focus:border-claret min-h-[44px]"
              maxLength={14}
            />
            <button
              type="submit"
              disabled={restoreLoading}
              className="px-5 py-2.5 rounded-xl bg-claret text-white hover:bg-claret-dark text-xs font-medium transition-all shadow-xs disabled:opacity-50 shrink-0 min-h-[44px] flex items-center justify-center"
            >
              {restoreLoading ? 'Verifying...' : 'Restore Pass'}
            </button>
          </form>

          {restoreMessage && (
            <div className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
              restoreMessage.isError ? 'bg-rose-50 border border-rose-200 text-rose-900' : 'bg-emerald-50 border border-emerald-200 text-emerald-900'
            }`}>
              {restoreMessage.isError ? <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> : <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />}
              <p className="font-reading">{restoreMessage.text}</p>
            </div>
          )}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. BAY II: PUBLISHED PRINT EDITIONS & PUBLISHER ORDERS   */}
      {/* ========================================================= */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-deckle">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-claret font-bold">
              Physical Library & University Press
            </span>
            <h2 className="font-serif text-2xl text-ink font-normal mt-0.5">
              Published Print Volumes (10 Books)
            </h2>
          </div>
          <span className="text-xs font-mono text-ink-muted">6 Authored • 4 Edited Works</span>
        </div>

        <p className="text-xs text-ink-muted font-reading leading-relaxed">
          Physical copies of Dr. Dodiya’s books are published across university presses and institutional distributors (Madhuvan Store, Sardar Patel University, and National Academic Publishers). Click any volume to review its synopsis, ISBN metadata, or place an inquiry with the publisher.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {BOOKS.map((book, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-white border border-deckle shadow-book flex flex-col justify-between space-y-3 transition-all hover:border-claret/50 group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[10px] font-bold text-claret bg-claret-soft px-2 py-0.5 rounded capitalize">
                    {book.type} Book
                  </span>
                  <span className="text-ink-muted">{book.year}</span>
                </div>

                <h4 className="font-serif text-base text-ink font-medium leading-snug group-hover:text-claret transition-colors">
                  {book.title}
                </h4>

                <p className="text-xs text-ink-muted font-reading line-clamp-2">
                  {BOOK_SYNOPSES[book.isbn] || 'Scholarly treatise published for university educators, researchers, and students.'}
                </p>

                <div className="text-[11px] font-mono text-ink-faint space-x-2 pt-1">
                  <span>Publisher: {book.publisher}</span>
                  <span>•</span>
                  <span>ISBN: {book.isbn}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-deckle/60 flex items-center justify-between">
                <button
                  onClick={() =>
                    setInspectedBook({
                      title: book.title,
                      year: book.year,
                      publisher: book.publisher,
                      isbn: book.isbn,
                      type: book.type,
                      synopsis: BOOK_SYNOPSES[book.isbn] || 'Comprehensive scholarly research monograph.'
                    })
                  }
                  className="text-xs font-mono text-claret hover:underline flex items-center gap-1"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Book Details & Citation</span>
                </button>

                <a
                  href={`https://wa.me/919825123456?text=${encodeURIComponent(
                    `Hello Dr. Dodiya, I am interested in ordering a physical print copy of your book: "${book.title}" (ISBN: ${book.isbn}, Publisher: ${book.publisher}). Please guide me on availability.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-sans font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-lg transition-colors"
                >
                  <MessageCircle className="w-3 h-3 text-emerald-700" />
                  <span>Order Print Copy</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 5. PHYSICAL BOOK DETAIL & CITATION MODAL                  */}
      {/* ========================================================= */}
      {inspectedBook && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-deckle shadow-2xl p-6 sm:p-7 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 border-b border-deckle pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-claret font-bold bg-claret-soft px-2 py-0.5 rounded">
                  {inspectedBook.type.toUpperCase()} BOOK • {inspectedBook.year}
                </span>
                <h3 className="font-serif text-xl sm:text-2xl text-ink font-medium mt-1 leading-snug">
                  {inspectedBook.title}
                </h3>
              </div>
              <button
                onClick={() => setInspectedBook(null)}
                className="p-1.5 rounded-full hover:bg-parchment-warm text-ink-muted hover:text-ink transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-semibold text-ink block font-mono text-[11px]">Scholarly Synopsis:</span>
                <p className="text-ink-muted font-reading leading-relaxed mt-1">
                  {inspectedBook.synopsis}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-parchment-warm border border-deckle space-y-1 font-mono text-[11px]">
                <div><strong className="text-ink">Author:</strong> Dr. Rajnikant S. Dodiya</div>
                <div><strong className="text-ink">Publisher:</strong> {inspectedBook.publisher}</div>
                <div><strong className="text-ink">Publication Year:</strong> {inspectedBook.year}</div>
                <div><strong className="text-ink">ISBN:</strong> {inspectedBook.isbn}</div>
              </div>

              <div>
                <div className="flex items-center justify-between pb-1">
                  <span className="font-semibold text-ink font-mono text-[11px]">APA 7th Edition Citation:</span>
                  <button
                    onClick={() =>
                      handleCopyCitation(
                        `Dodiya, R. S. (${inspectedBook.year}). ${inspectedBook.title}. ${inspectedBook.publisher}. ISBN: ${inspectedBook.isbn}.`
                      )
                    }
                    className="text-claret hover:underline flex items-center gap-1 font-mono text-[10px]"
                  >
                    {copiedCitation ? <Check className="w-3 h-3 text-emerald-700" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCitation ? 'Copied' : 'Copy Citation'}</span>
                  </button>
                </div>
                <div className="p-3 rounded-xl bg-white border border-deckle text-[11px] font-reading text-ink italic leading-relaxed">
                  Dodiya, R. S. ({inspectedBook.year}). <em>{inspectedBook.title}</em>. {inspectedBook.publisher}. ISBN: {inspectedBook.isbn}.
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-deckle flex items-center justify-end gap-2">
              <button
                onClick={() => setInspectedBook(null)}
                className="px-4 py-2 rounded-xl bg-parchment-warm text-ink text-xs font-medium hover:bg-parchment-deep transition-colors"
              >
                Close
              </button>
              <a
                href={`https://wa.me/919825123456?text=${encodeURIComponent(
                  `Hello Dr. Dodiya, I would like to inquire about ordering a copy of: "${inspectedBook.title}" (ISBN: ${inspectedBook.isbn}).`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-emerald-800 text-white text-xs font-medium hover:bg-emerald-900 transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <MessageCircle className="w-3.5 h-3.5" /> Order Print Edition
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. MODALS: CHECKOUT, DRM READER, & CBT EXAM PORTAL        */}
      {/* ========================================================= */}
      {isCheckoutOpen && selectedProduct && (
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
            studentName={studentSession.name || 'Sample Scholar'}
            studentMobile={studentSession.mobile || '9876543210'}
            orderId={studentSession.orderId || 'HMP-DEMO-01'}
            isUnlocked={!isReaderSample && isBookOwned}
            onUnlockRequest={() => handleOpenCheckout(bookProduct)}
          />
        </Suspense>
      )}

      {isExamOpen && (
        <Suspense fallback={null}>
          <ExamPortal
            isOpen={isExamOpen}
            onClose={() => setIsExamOpen(false)}
            studentName={studentSession.name || 'Sample Scholar'}
            orderId={studentSession.orderId || 'HMP-DEMO-01'}
            isUnlocked={!isExamSample && isExamOwned}
            onUnlockRequest={() => handleOpenCheckout(examProduct)}
          />
        </Suspense>
      )}

    </div>
  );
};
