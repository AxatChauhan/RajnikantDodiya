import React, { useState, lazy, Suspense } from 'react';
import { STORE_PRODUCTS, StoreProduct } from '../data/storeCatalogData';
import { BOOKS, SOCIAL_LINKS, PROFESSOR_INFO } from '../data/professorData';
import { useScholarSession, ScholarSession } from '../hooks/useScholarSession';
import { generateSecureDeviceToken } from '../lib/security';
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
  RotateCcw
} from 'lucide-react';
import { MainTab } from './Navbar';

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
  const [selectedProduct, setSelectedProduct] = useState<StoreProduct | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isReaderOpen, setIsReaderOpen] = useState(false);
  const [isExamOpen, setIsExamOpen] = useState(false);
  const [isReaderSample, setIsReaderSample] = useState(false);
  const [isExamSample, setIsExamSample] = useState(false);

  // AI Tutor State
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiConversation, setAiConversation] = useState<
    { role: 'user' | 'assistant'; text: string }[]
  >([
    {
      role: 'assistant',
      text: 'Hello! I am Dr. Dodiya’s virtual pedagogy tutor. Ask me anything about UGC NET English Literature, Teacher Education, Post-Method Pedagogy, or NEP 2020.'
    }
  ]);

  const {
    session: studentSession,
    isBookOwned,
    isExamOwned,
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

  const handleAiAsk = (prompt?: string) => {
    const q = prompt || aiQuestion;
    if (!q.trim()) return;

    const newConvo = [...aiConversation, { role: 'user' as const, text: q }];
    setAiConversation(newConvo);
    if (!prompt) setAiQuestion('');

    // Pre-configured intelligent academic answers based on Dr. Dodiya's publications
    setTimeout(() => {
      let answer =
        'That is an insightful academic query. In the context of English language pedagogy and NEP 2020, research stresses balancing systemic linguistic competence with context-sensitive classroom realities. Feel free to explore Dr. Dodiya’s papers on Post-Method Pedagogy and Multilingualism in the Publications tab!';

      const lower = q.toLowerCase();
      if (lower.includes('post-method') || lower.includes('kumaravadivelu')) {
        answer =
          'Kumaravadivelu’s Post-Method framework comprises three organizing principles: (1) Particularity: language teaching must be sensitive to local socio-cultural, political, and institutional contexts; (2) Practicality: teachers should develop their own context-sensitive theories from practice; and (3) Possibility: education must empower learners to recognize and alter socio-historical identities. See Dr. Dodiya’s 2020 and 2026 papers for classroom applications.';
      } else if (lower.includes('net') || lower.includes('syllabus') || lower.includes('paper 1')) {
        answer =
          'UGC NET English (Subject Code 30) comprises Paper 1 (Teaching & Research Aptitude - 50 questions, 100 marks) and Paper 2 (English Literature - 100 questions, 200 marks covering Drama, Poetry, Fiction, Non-fiction, Language, Cultural Studies, and Literary Theory). Practice regularly with our 25-MCQ simulator right on this page! Disclaimer: Verify all exam notifications and syllabus details with the official UGC/NTA notice.';
      } else if (lower.includes('kalam') || lower.includes('abdul kalam')) {
        answer =
          'Dr. A.P.J. Abdul Kalam’s educational vision emphasizes three core pillars: (1) Value-based moral foundation to produce enlightened citizens; (2) Creative thinking and experiential learning over rote memorization; and (3) Entrepreneurial capacity to make youth job creators rather than job seekers. This was the subject of Dr. Dodiya’s Ph.D. dissertation (SPU, 2018).';
      }

      setAiConversation([...newConvo, { role: 'assistant', text: answer }]);
    }, 600);
  };

  return (
    <div className="space-y-12 sm:space-y-16 animate-fade-in pt-2 sm:pt-4">
      {/* Title Header */}
      <div className="pb-4 border-b border-deckle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-claret font-semibold">
            Student Learning Portal
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-ink font-normal mt-1">
            Learn & Study Hub
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted font-reading font-light mt-1">
            UGC NET guidance, CBT exam practice simulator, digital books, and verified open-access educational resources.
          </p>
        </div>

        {/* Student Pass Badge */}
        {studentSession.unlockedItems.length > 0 ? (
          <div className="p-3.5 rounded-2xl bg-white border border-deckle shadow-book text-xs space-y-1 max-w-xs shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase text-claret">
                Active Student Pass
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                1-Device Active
              </span>
            </div>
            <p className="font-serif text-ink font-semibold truncate">{studentSession.name}</p>
            <p className="text-[11px] font-mono text-ink-muted">Access ID: #{studentSession.orderId}</p>
            <div className="pt-1 flex items-center justify-between text-[10px] font-mono">
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
          <div className="p-3.5 rounded-2xl bg-parchment-warm/80 border border-deckle text-xs space-y-1 max-w-xs shrink-0">
            <span className="text-[10px] font-mono uppercase text-claret font-bold block">
              Student / Scholar Access
            </span>
            <p className="text-ink-muted font-reading text-[11px]">
              Access complimentary sample reading, or sign in with your mobile number to unlock your pass.
            </p>
            <button
              onClick={onOpenAuthModal}
              className="mt-1 text-xs text-claret font-medium hover:underline flex items-center gap-1 font-sans"
            >
              <UserCheck className="w-3.5 h-3.5" /> Student Sign-In / Pass
            </button>
          </div>
        )}
      </div>

      {/* Subtab Navigation Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-xs">
        {[
          { id: 'ugc-net-english', label: 'UGC NET English' },
          { id: 'ugc-net-education', label: 'UGC NET Education' },
          { id: 'gujarat-tet', label: 'Gujarat TET (In Prep)' },
          { id: 'books', label: 'Books (With Buy Links)' },
          { id: 'free-resources', label: 'Free Resources & Portals' },
          { id: 'ai-tutor', label: 'AI Pedagogy Tutor' },
          { id: 'blog', label: 'Pedagogy Blog' }
        ].map(pill => (
          <a
            key={pill.id}
            href={`#${pill.id}`}
            className="px-3 py-1.5 rounded-xl bg-parchment-warm border border-deckle text-ink-muted hover:text-claret hover:border-claret font-medium whitespace-nowrap transition-all shadow-2xs"
          >
            {pill.label}
          </a>
        ))}
      </div>

      {/* ========================================================= */}
      {/* 1. UGC NET ENGLISH                                        */}
      {/* ========================================================= */}
      <section id="ugc-net-english" className="space-y-6">
        <div className="pb-2 border-b border-deckle flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-claret">
            <GraduationCap className="w-5 h-5 shrink-0" />
            <h2 className="font-serif text-xl sm:text-2xl text-ink font-normal">
              UGC NET / GSET in English Literature
            </h2>
          </div>
          <a
            href={SOCIAL_LINKS.whatsappChannelEnglish}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-xl self-start sm:self-auto transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-700" />
            Join UGC NET English WhatsApp Channel
          </a>
        </div>

        {/* Mandatory Statutory Notice */}
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
          <p className="font-reading">
            <strong className="font-semibold">Candidate Notice:</strong> Verify all exam notifications, syllabus details, and dates with the official UGC/NTA notice on{' '}
            <a
              href="https://ugcnet.nta.ac.in"
              target="_blank"
              rel="noreferrer"
              className="underline font-medium hover:text-amber-950"
            >
              ugcnet.nta.ac.in
            </a>.
          </p>
        </div>

        {/* Exam Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* CBT Simulator Card */}
          <div className="p-6 rounded-2xl bg-white border border-deckle shadow-book space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-claret font-bold bg-claret-soft px-2.5 py-1 rounded">
                  Interactive CBT Portal
                </span>
                <span className="font-serif font-bold text-lg text-claret">₹299</span>
              </div>
              <h3 className="font-serif text-xl text-ink font-medium">
                UGC NET English CBT Examination Simulator
              </h3>
              <p className="text-xs text-ink-muted font-reading leading-relaxed">
                Realistic Computer-Based Test (CBT) environment modeled after the official NTA user interface. Features 25 curated high-yield questions with Dr. Dodiya's verified explanations, instant scoring, and single-device DRM protection.
              </p>
              <ul className="text-xs text-ink-muted space-y-1.5 pl-5 list-disc">
                <li>Timed 50-minute exam simulation with live countdown clock.</li>
                <li>Instant score breakdown with comprehensive academic rationales.</li>
                <li>Sample test available for immediate free practice.</li>
              </ul>
            </div>

            <div className="pt-4 border-t border-deckle/60 flex flex-wrap items-center gap-3">
              <button
                onClick={() => {
                  setIsExamSample(true);
                  setIsExamOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-parchment-warm text-ink hover:bg-parchment-warm/60 border border-deckle text-xs font-medium transition-all"
              >
                Free Sample Test
              </button>
              {isExamOwned ? (
                <button
                  onClick={() => {
                    setIsExamSample(false);
                    setIsExamOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-800 text-white hover:bg-emerald-900 text-xs font-medium transition-all shadow-xs flex items-center gap-1.5"
                >
                  <Laptop className="w-3.5 h-3.5" /> Launch Unlocked CBT Exam
                </button>
              ) : (
                <button
                  onClick={() => handleOpenCheckout(examProduct)}
                  className="px-4 py-2 rounded-xl bg-claret text-white hover:bg-claret-dark text-xs font-medium transition-all shadow-xs flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" /> Buy CBT Pass (₹299)
                </button>
              )}
            </div>
          </div>

          {/* Syllabus Breakdown & Guidance Card */}
          <div className="p-6 rounded-2xl bg-white border border-deckle shadow-book space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <span className="text-[10px] font-mono uppercase tracking-wider text-blue-800 font-bold bg-blue-50 px-2.5 py-1 rounded inline-block">
                Syllabus Architecture
              </span>
              <h3 className="font-serif text-xl text-ink font-medium">
                10 Core Units of UGC NET English
              </h3>
              <p className="text-xs text-ink-muted font-reading leading-relaxed">
                Structured unit breakdown covering Drama, Poetry, Fiction, Non-Fictional Prose, Language: Basic Concepts, English in India, Cultural Studies, Literary Criticism, Literary Theory post-World War II, and Research Methods.
              </p>
              <div className="p-3 rounded-xl bg-parchment-warm/70 border border-deckle text-xs space-y-1">
                <span className="font-semibold text-ink block font-mono text-[11px]">
                  Dr. Dodiya’s Proven Preparation Strategy:
                </span>
                <p className="text-ink-muted leading-relaxed font-light">
                  Prioritize Literary Theory, Cultural Studies, and ELT in India. These three domains yield the highest question density relative to syllabus volume.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-deckle/60 flex items-center justify-between text-xs font-mono">
              <span className="text-ink-faint">Subject Code: 30</span>
              <a
                href={SOCIAL_LINKS.youtubeNetVidya}
                target="_blank"
                rel="noreferrer"
                className="text-claret font-sans font-medium hover:underline flex items-center gap-1"
              >
                Watch Video Guidance <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. UGC NET EDUCATION                                      */}
      {/* ========================================================= */}
      <section id="ugc-net-education" className="space-y-6">
        <div className="pb-2 border-b border-deckle flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-claret">
            <BookMarked className="w-5 h-5 shrink-0" />
            <h2 className="font-serif text-xl sm:text-2xl text-ink font-normal">
              UGC NET / GSET in Education
            </h2>
          </div>
          <a
            href={SOCIAL_LINKS.whatsappChannelEducation}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-xl self-start sm:self-auto transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-700" />
            Join UGC NET Education WhatsApp Channel
          </a>
        </div>

        {/* Mandatory Statutory Notice */}
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
          <p className="font-reading">
            <strong className="font-semibold">Notice for Candidates:</strong> Verify all syllabus updates and paper patterns with official UGC notices on{' '}
            <a
              href="https://www.ugc.gov.in"
              target="_blank"
              rel="noreferrer"
              className="underline font-medium hover:text-amber-950"
            >
              ugc.gov.in
            </a>.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-deckle shadow-book space-y-4">
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-800 font-bold bg-emerald-50 px-2.5 py-1 rounded inline-block">
              Mentor Credentials: UGC-NET (2009) & GSET (2019) in Education
            </span>
            <h3 className="font-serif text-xl text-ink font-medium">
              Comprehensive Study Guidance for Education Aspirants
            </h3>
            <p className="text-xs text-ink-muted font-reading leading-relaxed">
              Dr. Dodiya has guided hundreds of M.Ed. students and research scholars preparing for the National Eligibility Test in Education (Subject Code 09). Key focus areas include Educational Philosophy (Sankhya, Vedanta, Pragmatism), Educational Psychology, Teacher Education Models, and Educational Research Methodologies.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-4 rounded-xl bg-parchment-warm/70 border border-deckle space-y-1">
              <span className="font-mono text-xs font-semibold text-ink block">Unit 1 & 2</span>
              <p className="text-xs text-ink-muted">Educational Studies, Philosophy & History of Education</p>
            </div>
            <div className="p-4 rounded-xl bg-parchment-warm/70 border border-deckle space-y-1">
              <span className="font-mono text-xs font-semibold text-ink block">Unit 4 & 6</span>
              <p className="text-xs text-ink-muted">Teacher Education & Research in Education</p>
            </div>
            <div className="p-4 rounded-xl bg-parchment-warm/70 border border-deckle space-y-1">
              <span className="font-mono text-xs font-semibold text-ink block">Unit 7 & 8</span>
              <p className="text-xs text-ink-muted">Pedagogy, Andragogy & Educational Technology</p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. GUJARAT TET / TAT                                      */}
      {/* ========================================================= */}
      <section id="gujarat-tet" className="space-y-4">
        <div className="pb-2 border-b border-deckle flex items-center justify-between">
          <div className="flex items-center gap-2 text-claret">
            <HelpCircle className="w-5 h-5 shrink-0" />
            <h2 className="font-serif text-xl sm:text-2xl text-ink font-normal">
              Gujarat TET & TAT Preparation
            </h2>
          </div>
          <span className="px-3 py-1 rounded-full bg-slate-200 text-slate-700 text-xs font-mono font-bold">
            Coming Soon — In Preparation
          </span>
        </div>

        <div className="p-6 rounded-2xl bg-parchment-warm/60 border border-deckle text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-white border border-deckle flex items-center justify-center mx-auto text-claret shadow-xs">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-lg text-ink font-medium">
            Gujarat TET-I, TET-II, and TAT (Secondary & Higher Secondary)
          </h3>
          <p className="text-xs text-ink-muted font-reading max-w-lg mx-auto leading-relaxed">
            Targeted study modules for Gujarat state teacher recruitment exams are currently under development. Modules will include Gujarati-medium pedagogical primers, educational psychology question banks, and English methodology summaries.
          </p>
          <span className="inline-block text-[11px] font-mono text-claret font-semibold">
            Expected Launch: Academic Session 2026–2027
          </span>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. BOOKS (WITH BUY LINKS & IN-BROWSER READER)            */}
      {/* ========================================================= */}
      <section id="books" className="space-y-6">
        <div className="pb-2 border-b border-deckle flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-claret">
            <BookOpen className="w-5 h-5 shrink-0" />
            <h2 className="font-serif text-xl sm:text-2xl text-ink font-normal">
              Academic Books (Digital Reader & Purchase Links)
            </h2>
          </div>
          <span className="text-xs font-mono text-ink-muted">Single-Device Protected Digital Reader</span>
        </div>

        {/* Featured Book Showcase: UGC NET English Literature */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border-2 border-deckle shadow-book space-y-6">
          <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-claret-soft text-claret text-xs font-mono font-bold border border-claret/20">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Featured Scholarly Work</span>
              </div>
              <h3 className="font-serif text-2xl sm:text-3xl text-ink font-normal leading-snug">
                UGC NET English Literature (Second Edition)
              </h3>
              <p className="text-xs sm:text-sm text-ink-muted font-reading leading-relaxed">
                By Dr. Rajnikant S. Dodiya • Published by Madhuvan Store (ISBN: 978-93-90256-27-3). 
                The definitive companion for NET/GSET candidates featuring period-by-period British literature chronologies, contemporary critical theory matrices, Indian English literature summaries, and model papers.
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-ink-faint pt-1">
                <span>ISBN: 978-93-90256-27-3</span>
                <span>•</span>
                <span>Pages: 420</span>
                <span>•</span>
                <span className="text-emerald-700 font-bold">In-Browser Reader Available</span>
              </div>
            </div>

            {/* Price & Action Box */}
            <div className="p-5 rounded-2xl bg-parchment-warm/80 border border-deckle w-full lg:w-72 shrink-0 space-y-3 text-center sm:text-left">
              <div>
                <span className="text-[10px] font-mono uppercase text-ink-muted block">
                  Digital Reader License
                </span>
                <div className="font-serif text-2xl font-bold text-claret mt-0.5">₹199</div>
                <span className="text-[10px] font-mono text-ink-faint">Locks to 1 Active Device</span>
              </div>

              <div className="space-y-2 pt-2 border-t border-deckle/60">
                <button
                  onClick={() => {
                    setIsReaderSample(true);
                    setIsReaderOpen(true);
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-white hover:bg-white/80 border border-deckle text-xs font-medium text-ink transition-all shadow-2xs"
                >
                  Free Sample Chapters
                </button>

                {isBookOwned ? (
                  <button
                    onClick={() => {
                      setIsReaderSample(false);
                      setIsReaderOpen(true);
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-emerald-800 text-white hover:bg-emerald-900 text-xs font-medium transition-all shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <BookOpen className="w-3.5 h-3.5" /> Read Unlocked Book
                  </button>
                ) : isComplimentaryOwned ? (
                  <div className="flex flex-col gap-2 w-full">
                    <button
                      onClick={() => {
                        setIsReaderSample(true);
                        setIsReaderOpen(true);
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-emerald-800/10 border border-emerald-800/20 text-emerald-900 hover:bg-emerald-800/20 text-xs font-medium transition-all flex items-center justify-center gap-1.5"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-emerald-800" /> Read Complimentary Preface
                    </button>
                    <button
                      onClick={() => handleOpenCheckout(bookProduct)}
                      className="w-full py-2 px-3 rounded-xl bg-claret text-white hover:bg-claret-dark text-xs font-medium transition-all shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <Lock className="w-3.5 h-3.5" /> Buy Reader Pass (₹399)
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleOpenCheckout(bookProduct)}
                    className="w-full py-2 px-3 rounded-xl bg-claret text-white hover:bg-claret-dark text-xs font-medium transition-all shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <Lock className="w-3.5 h-3.5" /> Buy Reader Pass (₹399)
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Other Published Books Grid */}
        <div className="space-y-3">
          <h3 className="font-serif text-lg text-ink font-medium">Other Published Volumes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {BOOKS.filter(b => b.isbn !== '978-93-90256-27-3').map((book, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-white border border-deckle shadow-book space-y-2 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-claret font-semibold capitalize">{book.type}</span>
                    <span className="text-ink-muted">{book.year}</span>
                  </div>
                  <h4 className="font-serif text-base text-ink font-medium leading-snug">
                    {book.title}
                  </h4>
                  <p className="text-xs text-ink-muted font-reading">
                    Publisher: {book.publisher}
                  </p>
                </div>
                <div className="pt-2 border-t border-deckle/60 flex items-center justify-between text-xs font-mono">
                  <span className="text-ink-faint text-[11px]">ISBN: {book.isbn}</span>
                  <a
                    href={`mailto:rajnikantdodiya2@gmail.com?subject=Inquiry%20regarding%20book%20${encodeURIComponent(book.title)}`}
                    className="text-claret font-sans font-medium hover:underline text-xs"
                  >
                    Order Physical Copy
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 5. FREE RESOURCES & OFFICIAL LINKS                        */}
      {/* ========================================================= */}
      <section id="free-resources" className="space-y-6">
        <div className="pb-2 border-b border-deckle flex items-center justify-between">
          <div className="flex items-center gap-2 text-claret">
            <Download className="w-5 h-5 shrink-0" />
            <h2 className="font-serif text-xl sm:text-2xl text-ink font-normal">
              Free Resources & Official Academic Portals
            </h2>
          </div>
          <span className="text-xs font-mono text-ink-muted">Open Access</span>
        </div>

        {/* Official Government & Regulatory Portals */}
        <div className="space-y-3">
          <span className="text-xs font-mono uppercase tracking-wider text-ink-faint block">
            Verified National Education & Exam Portals
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <a
              href="https://www.ugc.gov.in"
              target="_blank"
              rel="noreferrer"
              className="p-4 rounded-xl bg-white border border-deckle hover:border-claret transition-all shadow-2xs space-y-1 block group"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-claret">UGC Official</span>
                <ExternalLink className="w-3.5 h-3.5 text-ink-muted group-hover:text-claret" />
              </div>
              <p className="text-[11px] text-ink-muted">University Grants Commission Notifications & Syllabi</p>
            </a>

            <a
              href="https://ugcnet.nta.ac.in"
              target="_blank"
              rel="noreferrer"
              className="p-4 rounded-xl bg-white border border-deckle hover:border-claret transition-all shadow-2xs space-y-1 block group"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-claret">NTA UGC-NET</span>
                <ExternalLink className="w-3.5 h-3.5 text-ink-muted group-hover:text-claret" />
              </div>
              <p className="text-[11px] text-ink-muted">National Testing Agency Exam Schedules & Admit Cards</p>
            </a>

            <a
              href="https://ncte.gov.in"
              target="_blank"
              rel="noreferrer"
              className="p-4 rounded-xl bg-white border border-deckle hover:border-claret transition-all shadow-2xs space-y-1 block group"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-claret">NCTE Portal</span>
                <ExternalLink className="w-3.5 h-3.5 text-ink-muted group-hover:text-claret" />
              </div>
              <p className="text-[11px] text-ink-muted">National Council for Teacher Education Norms & PAR</p>
            </a>

            <a
              href="https://ncert.nic.in"
              target="_blank"
              rel="noreferrer"
              className="p-4 rounded-xl bg-white border border-deckle hover:border-claret transition-all shadow-2xs space-y-1 block group"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-claret">NCERT Portal</span>
                <ExternalLink className="w-3.5 h-3.5 text-ink-muted group-hover:text-claret" />
              </div>
              <p className="text-[11px] text-ink-muted">School Curriculum Frameworks & NEP Textbooks</p>
            </a>
          </div>
        </div>

        {/* Free Lecture Notes & Downloads */}
        <div className="space-y-3 pt-2">
          <span className="text-xs font-mono uppercase tracking-wider text-ink-faint block">
            Dr. Dodiya’s Open Lecture Notes
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-deckle shadow-book space-y-2">
              <span className="text-[10px] font-mono uppercase text-claret font-bold">PDF Handout</span>
              <h4 className="font-serif text-sm font-medium text-ink">
                Post-Method Pedagogy: The 10 Macrostrategies Summary
              </h4>
              <p className="text-xs text-ink-muted font-reading">
                A concise classroom reference for teacher-trainees detailing Kumaravadivelu's 10 macrostrategies with Indian classroom examples.
              </p>
              <a
                href={SOCIAL_LINKS.whatsappChannelEnglish}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-claret font-medium hover:underline pt-1"
              >
                Download via WhatsApp Channel <ChevronRight className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-deckle shadow-book space-y-2">
              <span className="text-[10px] font-mono uppercase text-blue-800 font-bold">Slide Deck</span>
              <h4 className="font-serif text-sm font-medium text-ink">
                AI in Second-Language Classrooms: Prompts & Rubrics
              </h4>
              <p className="text-xs text-ink-muted font-reading">
                Workshop slide deck prepared for CAIELE teacher development sessions at HMPIETR.
              </p>
              <a
                href={SOCIAL_LINKS.whatsappChannelEnglish}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-claret font-medium hover:underline pt-1"
              >
                Download via WhatsApp Channel <ChevronRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 6. AI PEDAGOGY TUTOR                                      */}
      {/* ========================================================= */}
      <section id="ai-tutor" className="folio-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 bg-white border border-deckle shadow-book space-y-5">
        <div className="flex items-center gap-2 text-claret border-b border-deckle pb-3">
          <Bot className="w-5 h-5 shrink-0" />
          <h2 className="font-serif text-xl sm:text-2xl text-ink font-normal">
            AI Pedagogy & Literature Study Assistant
          </h2>
        </div>

        <p className="text-xs sm:text-sm text-ink-muted font-reading font-light leading-relaxed">
          Ask questions regarding UGC NET English literature topics, teacher-education principles, or Dr. Dodiya's published research areas.
        </p>

        {/* Quick Question Prompts */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-ink-muted font-medium text-[11px]">Quick Prompts:</span>
          {[
            'Explain Post-Method Pedagogy in 3 principles',
            'What are the 10 units of UGC NET English?',
            'Summarize APJ Abdul Kalam on Education'
          ].map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleAiAsk(prompt)}
              className="px-3 py-1 rounded-xl bg-parchment-warm text-ink-muted hover:text-claret border border-deckle text-[11px] transition-all"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Chat Window */}
        <div className="p-4 rounded-2xl bg-parchment-warm/60 border border-deckle space-y-3 max-h-72 overflow-y-auto">
          {aiConversation.map((msg, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-xl text-xs ${
                msg.role === 'user'
                  ? 'bg-claret text-white ml-auto max-w-[80%]'
                  : 'bg-white text-ink border border-deckle max-w-[85%]'
              }`}
            >
              <span className="text-[10px] font-mono uppercase font-bold block mb-1 opacity-75">
                {msg.role === 'user' ? 'You' : 'Academic Assistant'}
              </span>
              <p className="font-reading leading-relaxed">{msg.text}</p>
            </div>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={e => {
            e.preventDefault();
            handleAiAsk();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Type your academic or exam query here..."
            value={aiQuestion}
            onChange={e => setAiQuestion(e.target.value)}
            className="flex-1 px-4 py-2 rounded-xl bg-parchment-warm/70 border border-deckle text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:border-claret"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-claret text-white hover:bg-claret-dark text-xs font-medium transition-all shadow-xs flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" /> Ask
          </button>
        </form>
      </section>

      {/* ========================================================= */}
      {/* 7. PEDAGOGY BLOG                                          */}
      {/* ========================================================= */}
      <section id="blog" className="space-y-6">
        <div className="pb-2 border-b border-deckle flex items-center justify-between">
          <div className="flex items-center gap-2 text-claret">
            <FileText className="w-5 h-5 shrink-0" />
            <h2 className="font-serif text-xl sm:text-2xl text-ink font-normal">
              Pedagogy Blog & Reflective Essays
            </h2>
          </div>
          <span className="text-xs font-mono text-ink-muted">Teacher Education Perspectives</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-deckle shadow-book space-y-2 flex flex-col justify-between">
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-claret font-bold uppercase">ELT & NEP 2020</span>
              <h3 className="font-serif text-base text-ink font-medium leading-snug">
                From Monolingualism to Translanguaging in Indian Classrooms
              </h3>
              <p className="text-xs text-ink-muted font-reading leading-relaxed">
                Why rigid English-only policies fail in regional contexts and how embracing mother-tongue scaffolding accelerates language proficiency.
              </p>
            </div>
            <span className="text-[11px] font-mono text-ink-faint pt-2 border-t border-deckle/60">
              By Dr. Rajnikant S. Dodiya
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-deckle shadow-book space-y-2 flex flex-col justify-between">
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-blue-800 font-bold uppercase">Techno-Pedagogy</span>
              <h3 className="font-serif text-base text-ink font-medium leading-snug">
                Generative AI as a Scaffolding Partner for English Trainees
              </h3>
              <p className="text-xs text-ink-muted font-reading leading-relaxed">
                Reflections from CAIELE workshops on using conversational agents for pronunciation feedback and contextual vocabulary building.
              </p>
            </div>
            <span className="text-[11px] font-mono text-ink-faint pt-2 border-t border-deckle/60">
              By Dr. Rajnikant S. Dodiya
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-deckle shadow-book space-y-2 flex flex-col justify-between">
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-purple-800 font-bold uppercase">Philosophy of Education</span>
              <h3 className="font-serif text-base text-ink font-medium leading-snug">
                Dr. Kalam’s Vision of the Enlightened Teacher
              </h3>
              <p className="text-xs text-ink-muted font-reading leading-relaxed">
                Examining the pedagogical imperatives of teacher empathy, moral mentorship, and curiosity in shaping the nation’s youth.
              </p>
            </div>
            <span className="text-[11px] font-mono text-ink-faint pt-2 border-t border-deckle/60">
              By Dr. Rajnikant S. Dodiya
            </span>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* LAZY MODALS                                               */}
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
            studentName={studentSession.name || 'Sample Reader'}
            studentMobile={studentSession.mobile || '9999999999'}
            orderId={studentSession.orderId || 'SAMPLE-PASS'}
            isUnlocked={!isReaderSample && isBookOwned}
          />
        </Suspense>
      )}

      {isExamOpen && (
        <Suspense fallback={null}>
          <ExamPortal
            isOpen={isExamOpen}
            onClose={() => setIsExamOpen(false)}
            studentName={studentSession.name || 'Candidate'}
            orderId={studentSession.orderId || 'SAMPLE-CBT'}
            isUnlocked={!isExamSample && isExamOwned}
          />
        </Suspense>
      )}
    </div>
  );
};
