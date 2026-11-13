import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Clock,
  BookOpen,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Play,
  FileText,
  Calendar,
  Lock,
  ChevronDown,
  HelpCircle,
  Award,
  Layers,
  GraduationCap,
  ExternalLink
} from 'lucide-react';
import { useNetVidyaStore } from '../../contexts/NetVidyaStoreContext';
import {
  getStoreFaqs,
  STORE_MERCHANT,
  STORE_TIMELINE_ITEMS
} from '../../config/storeConfig';

const UGC_READING_DOSSIERS = [
  {
    id: 'ugc-read-ebook',
    title: 'Complete E-book: UGC NET English Literature',
    pages: 283,
    badge: 'Comprehensive E-book • 283 Pages',
    file: 'ebook/index.html',
    desc: 'Chaucer to Contemporary World Literature, Literary Theory, Criticism, Post-Method Pedagogy & ELT in India with clean digital typography.'
  },
  {
    id: 'ugc-read-pyq',
    title: 'PYQ Trend Analysis & Elimination Master',
    pages: 35,
    badge: 'Strategy Dossier • 35 Pages',
    file: 'pyq_analysis/index.html',
    desc: '10-year question taxonomy, option elimination techniques, distractor patterns, and recurring high-frequency topics.'
  },
  {
    id: 'ugc-read-revkit',
    title: 'Last 30 Days Quick Revision Kit',
    pages: 29,
    badge: 'Revision Sprint • 29 Pages',
    file: 'revision_kit/index.html',
    desc: 'Chronological timeline summaries, major works, critical theory cheat sheets, and high-yield last-minute memory aids.'
  }
];

const UGC_TESTS = [
  {
    id: 'ugc-net-mock-1',
    title: 'NET Mock 1: Full-Length Paper II NTA Simulation',
    category: 'grand',
    categoryLabel: 'Grand Mock',
    file: 'NET_Mock_01.html',
    qs: 100,
    mins: 120,
    desc: 'Comprehensive 100-question Paper II English Literature NTA simulation with countdown timer, question palette, and detailed explanations.'
  },
  {
    id: 'ugc-unit-1',
    title: 'Unit Test 1: Drama',
    category: 'units',
    categoryLabel: 'Unit Test',
    file: 'Unit_Test_01_Drama.html',
    qs: 50,
    mins: 60,
    desc: 'British, American, and World Drama from classical Greek tragedy to post-war Absurd theatre.'
  },
  {
    id: 'ugc-unit-2',
    title: 'Unit Test 2: Poetry',
    category: 'units',
    categoryLabel: 'Unit Test',
    file: 'Unit_Test_02_Poetry.html',
    qs: 50,
    mins: 60,
    desc: 'Chaucer to Contemporary World Poetry, poetic forms, prosody, and metaphysical verse.'
  },
  {
    id: 'ugc-unit-3',
    title: 'Unit Test 3: Fiction & Short Story',
    category: 'units',
    categoryLabel: 'Unit Test',
    file: 'Unit_Test_03_Fiction.html',
    qs: 50,
    mins: 60,
    desc: '18th-century rise of the novel, Victorian realism, modernist streams, and postcolonial fiction.'
  },
  {
    id: 'ugc-unit-4',
    title: 'Unit Test 4: Non-fictional Prose',
    category: 'units',
    categoryLabel: 'Unit Test',
    file: 'Unit_Test_04_Prose.html',
    qs: 50,
    mins: 60,
    desc: 'Essays, biographies, autobiographies, diaries, travelogues, and political essays.'
  },
  {
    id: 'ugc-unit-5',
    title: 'Unit Test 5: Language & Pedagogy',
    category: 'units',
    categoryLabel: 'Unit Test',
    file: 'Unit_Test_05_Language.html',
    qs: 50,
    mins: 60,
    desc: 'Linguistics, phonetics, syntax, English Language Teaching (ELT) methods & pedagogy in India.'
  },
  {
    id: 'ugc-unit-6',
    title: 'Unit Test 6: English in India',
    category: 'units',
    categoryLabel: 'Unit Test',
    file: 'Unit_Test_06_English_in_India.html',
    qs: 50,
    mins: 60,
    desc: 'Macaulay’s Minute, colonial language policies, Indian English authors, and multilingualism.'
  },
  {
    id: 'ugc-unit-7',
    title: 'Unit Test 7: Cultural Studies',
    category: 'units',
    categoryLabel: 'Unit Test',
    file: 'Unit_Test_07_Cultural_Studies.html',
    qs: 50,
    mins: 60,
    desc: 'Birmingham Centre, Raymond Williams, Stuart Hall, subcultures, and popular media analysis.'
  },
  {
    id: 'ugc-unit-8',
    title: 'Unit Test 8: Literary Criticism',
    category: 'units',
    categoryLabel: 'Unit Test',
    file: 'Unit_Test_08_Criticism.html',
    qs: 50,
    mins: 60,
    desc: 'Classical Aristotle & Plato, Sidney, Dryden, Dr. Johnson, Coleridge, and New Criticism.'
  },
  {
    id: 'ugc-unit-9',
    title: 'Unit Test 9: Literary Theory',
    category: 'units',
    categoryLabel: 'Unit Test',
    file: 'Unit_Test_09_Theory.html',
    qs: 50,
    mins: 60,
    desc: 'Structuralism, Post-structuralism, Deconstruction, Psychoanalysis, Feminism, and Ecocriticism.'
  },
  {
    id: 'ugc-unit-10',
    title: 'Unit Test 10: Research Methods',
    category: 'units',
    categoryLabel: 'Unit Test',
    file: 'Unit_Test_10_Research.html',
    qs: 50,
    mins: 60,
    desc: 'MLA 9th Edition citations, research design, thesis formulation, and academic ethics.'
  },
  {
    id: 'ugc-pm-a',
    title: 'Practice Mock A: Full-Length Speed Simulation',
    category: 'practice',
    categoryLabel: 'Practice Mock',
    file: 'Practice_Mock_A.html',
    qs: 100,
    mins: 120,
    desc: 'Full-length 100-question practice mock test for speed and accuracy building.'
  },
  {
    id: 'ugc-pm-b',
    title: 'Practice Mock B: Literature & Criticism',
    category: 'practice',
    categoryLabel: 'Practice Mock',
    file: 'Practice_Mock_B.html',
    qs: 100,
    mins: 120,
    desc: '100 questions covering core literary periods and critical movements.'
  },
  {
    id: 'ugc-pm-c',
    title: 'Practice Mock C: Theory & Cultural Studies',
    category: 'practice',
    categoryLabel: 'Practice Mock',
    file: 'Practice_Mock_C.html',
    qs: 100,
    mins: 120,
    desc: '100 questions focused on 20th-century critical theory and cultural perspectives.'
  },
  {
    id: 'ugc-pm-d',
    title: 'Practice Mock D: Comprehensive Speed Test',
    category: 'practice',
    categoryLabel: 'Practice Mock',
    file: 'Practice_Mock_D.html',
    qs: 100,
    mins: 120,
    desc: 'Simulated examination testing time management across high-yield units.'
  },
  {
    id: 'ugc-pm-e',
    title: 'Practice Mock E: Advanced Question Bank',
    category: 'practice',
    categoryLabel: 'Practice Mock',
    file: 'Practice_Mock_E.html',
    qs: 100,
    mins: 120,
    desc: 'Advanced-level analytical questions with distractor explanations.'
  },
  {
    id: 'ugc-pm-f',
    title: 'Practice Mock F: Full-Length Speed Booster',
    category: 'practice',
    categoryLabel: 'Practice Mock',
    file: 'Practice_Mock_F.html',
    qs: 100,
    mins: 120,
    desc: 'Full-length 100-question Paper II mock for accuracy under exam pressure.'
  },
  {
    id: 'ugc-pm-g',
    title: 'Practice Mock G: Contemporary & World Literature',
    category: 'practice',
    categoryLabel: 'Practice Mock',
    file: 'Practice_Mock_G.html',
    qs: 100,
    mins: 120,
    desc: 'Postcolonial, Dalit, Diaspora, and World Literature in translation.'
  },
  {
    id: 'ugc-pm-h',
    title: 'Practice Mock H: Critical Theory Sprint',
    category: 'practice',
    categoryLabel: 'Practice Mock',
    file: 'Practice_Mock_H.html',
    qs: 100,
    mins: 120,
    desc: 'Targeted practice on high-frequency critical paradigms and key terms.'
  },
  {
    id: 'ugc-pm-i',
    title: 'Practice Mock I: NTA Pattern Simulation',
    category: 'practice',
    categoryLabel: 'Practice Mock',
    file: 'Practice_Mock_I.html',
    qs: 100,
    mins: 120,
    desc: 'Authentic assertion-reason, chronological matching, and passage comprehension.'
  },
  {
    id: 'ugc-pm-j',
    title: 'Practice Mock J: Final Pre-Exam Diagnostic',
    category: 'practice',
    categoryLabel: 'Practice Mock',
    file: 'Practice_Mock_J.html',
    qs: 100,
    mins: 120,
    desc: 'The ultimate 100-question diagnostic exam to finalize exam readiness.'
  }
];

interface NetVidyaStoreHomeProps {
  onOpenCheckout: () => void;
  onOpenSample: () => void;
  onOpenLogin: () => void;
  onOpenBookstore?: () => void;
}

export const NetVidyaStoreHome: React.FC<NetVidyaStoreHomeProps> = ({
  onOpenCheckout,
  onOpenSample,
  onOpenLogin,
  onOpenBookstore
}) => {
  const { currentServerPrice, isEarlyBirdActive, paymentMode, settings } = useNetVidyaStore();

  // Live Countdown state
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [activeTestCategory, setActiveTestCategory] = useState<'all' | 'grand' | 'units' | 'practice'>('all');

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const cutoff = new Date(settings.earlyBirdCutoff);
      const diff = cutoff.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [settings.earlyBirdCutoff]);

  const faqs = getStoreFaqs(currentServerPrice);
  const nowTimestamp = Date.now();

  return (
    <div className="space-y-16 sm:space-y-24 animate-fade-in pb-12">
      
      {/* 1. HERO SECTION */}
      <section className="relative pt-6 sm:pt-10 max-w-5xl mx-auto px-4 space-y-8">
        
        {/* Offer / Access Status Badge */}
        <div className="text-center px-2">
          {isEarlyBirdActive ? (
            <div className="inline-flex flex-wrap items-center justify-center gap-1.5 sm:gap-2.5 px-3 sm:px-4 py-1.5 rounded-2xl sm:rounded-full bg-emerald-50 border border-emerald-300 text-emerald-900 text-[11px] sm:text-xs font-semibold shadow-xs max-w-full">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Early-Bird Offer: ₹{currentServerPrice}</span>
              </div>
              <span className="text-emerald-700 font-mono font-bold">
                (Ends in {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s)
              </span>
            </div>
          ) : (
            <div className="inline-flex flex-wrap items-center justify-center gap-2 px-3 sm:px-4 py-1.5 rounded-2xl sm:rounded-full bg-blue-50 border border-blue-200 text-blue-900 text-xs font-semibold">
              <span>
                {paymentMode === 'payment_link' && currentServerPrice < settings.standardPrice
                  ? `Direct Enrollment Offer: ₹${currentServerPrice} • Access till ${STORE_MERCHANT.accessExpiryLabel}`
                  : `Enrollment Open • Access till ${STORE_MERCHANT.accessExpiryLabel}`}
              </span>
            </div>
          )}
        </div>

        {/* Main Headline & Subtitle */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight">
            UGC NET English <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 bg-clip-text text-transparent">
              Complete Study Bundle 2026
            </span>
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            The definitive national preparation bundle: 21 authentic NTA computer-based CBT test simulations, 3 complete high-yield online reading dossiers, and comprehensive pedagogical explanations.
          </p>
        </div>

        {/* Author Spotlight & Verified Credentials Card */}
        <div className="bg-gradient-to-br from-blue-50/70 via-white to-indigo-50/50 rounded-3xl p-5 sm:p-7 border border-blue-100 shadow-sm max-w-3xl mx-auto flex flex-col sm:flex-row items-center gap-5 sm:gap-6 text-center sm:text-left">
          <div className="relative shrink-0">
            <img
              src="/dr-rajnikant-dodiya.jpg"
              alt="Dr. Rajnikant Dodiya"
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-blue-200 shadow-md ring-4 ring-white"
            />
            <div className="absolute -bottom-2 -right-2 bg-emerald-600 text-white p-1 rounded-lg shadow-xs" title="Verified Author">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-100/80 text-blue-800 text-[11px] font-bold tracking-wide uppercase">
              <GraduationCap className="w-3.5 h-3.5 text-blue-700" />
              <span>Academic Mentor & Content Creator</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              Dr. Rajnikant Dodiya
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-blue-900">
              Ph.D. in English • 2× UGC NET & GSET Qualified
            </p>
            <p className="text-xs text-gray-600 leading-relaxed max-w-xl">
              Personally curated and validated 100% of the mock questions, analytical model rationales, and high-yield reading files to help candidates excel in the upcoming examinations.
            </p>
          </div>
        </div>

        {/* Pricing & Enrollment Card */}
        <div className="bg-white rounded-3xl p-5 sm:p-8 max-w-lg mx-auto border border-blue-200 shadow-xl space-y-5 relative overflow-hidden">
          <div className="flex flex-col items-center justify-center gap-2 text-center">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
              <span className="text-4xl sm:text-5xl font-black text-blue-950 font-mono">₹{currentServerPrice}</span>
              {isEarlyBirdActive ? (
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
                  Early-Bird Price (Standard ₹{settings.standardPrice} after 10 Nov)
                </span>
              ) : paymentMode === 'payment_link' && currentServerPrice < settings.standardPrice ? (
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
                  Direct Link Offer (Standard ₹{settings.standardPrice})
                </span>
              ) : (
                <span className="text-xs font-bold text-blue-800 bg-blue-100 px-3 py-1 rounded-full">
                  Standard Enrollment Fee
                </span>
              )}
            </div>
          </div>

          <p className="text-xs text-gray-500 text-center">
            One-time enrollment fee • Server-verified pricing • Continuous access through <strong>31 December 2026</strong>
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={onOpenCheckout}
              className="w-full sm:w-auto flex-1 py-3.5 px-6 rounded-2xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 hover:scale-[1.02]"
            >
              <span>Enroll in Complete Bundle (₹{currentServerPrice})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenSample}
              className="w-full sm:w-auto py-3.5 px-6 rounded-2xl bg-gray-50 hover:bg-gray-100 border border-gray-300 text-gray-800 font-bold text-sm transition-colors flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 text-blue-700 fill-current" />
              <span>Try Free Demo (10 Qs + Sample)</span>
            </button>
          </div>

          {/* Already Enrolled Link */}
          <div className="pt-2 text-center text-xs text-gray-500">
            <span>Already enrolled? </span>
            <button
              onClick={onOpenLogin}
              className="font-bold text-blue-700 hover:underline"
            >
              Student Login here →
            </button>
          </div>
        </div>

        {/* Mini Trust Row */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-gray-500 pt-1">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Instant Digital Access</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Razorpay Secured</span>
          </div>
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-emerald-600" />
            <span>Curated by Dr. Rajnikant Dodiya</span>
          </div>
        </div>
      </section>

      {/* 2. DELIVERABLES BREAKDOWN GRID */}
      <section className="max-w-6xl mx-auto px-4 space-y-10">
        <div className="text-center space-y-2">
          <span className="text-xs font-mono uppercase font-bold text-blue-700 tracking-wider">
            All-In-One Study Bundle Breakdown
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            What You Get Inside the ₹499 Complete Bundle
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 max-w-2xl mx-auto">
            Everything you need for UGC NET English Paper II: authentic NTA computer-based CBT mock tests and complete high-yield online reading dossiers.
          </p>
        </div>

        {/* Deliverables Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-white border border-blue-200 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">21 NTA Computer-Based Tests</h3>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              1 Full NET Mock (100 Qs), 10 Practice Mocks A–J (100 Qs each), and 10 Unit Tests (50 Qs each) with official question palette and real-time timer.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-emerald-200 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">3 Online Reading Dossiers (347 Pages)</h3>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Complete E-book (283 pages), PYQ Trend Analysis (35 pages), and Last 30 Days Revision Kit (29 pages) with continuous online access till 31 Dec 2026.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-amber-200 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Free Public Demo Available</h3>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Test-drive the real NTA test simulator with our 10-Question Demo Test and read the 15-page sample notes viewer right now with zero login required.
            </p>
          </div>
        </div>

        {/* Detailed Modules Grid */}
        <div className="bg-slate-50/80 rounded-3xl p-6 sm:p-8 border border-slate-200/80 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <span className="text-[11px] font-mono uppercase text-blue-700 font-bold">Curriculum Inventory</span>
              <h3 className="text-xl font-bold text-gray-900">Included Study Modules & Tests</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenSample}
                className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Try Free Demo (No Login)</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Column 1: Reading Dossiers */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <span>3 High-Yield Reading Dossiers (Online Readers)</span>
              </div>
              <ul className="text-xs text-gray-600 space-y-2.5">
                <li className="flex items-start gap-2 p-2 rounded-lg bg-emerald-50/50 border border-emerald-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-gray-900 block font-semibold">1. Complete E-book (283 Pages)</strong>
                    <span className="text-gray-500 text-[11px]">Comprehensive coverage: Chaucer to Contemporary World Literature, Literary Theory & ELT.</span>
                  </div>
                </li>
                <li className="flex items-start gap-2 p-2 rounded-lg bg-emerald-50/50 border border-emerald-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-gray-900 block font-semibold">2. PYQ Trend Analysis (35 Pages)</strong>
                    <span className="text-gray-500 text-[11px]">Analytical question patterns, distractor elimination methods, and recurring author themes.</span>
                  </div>
                </li>
                <li className="flex items-start gap-2 p-2 rounded-lg bg-emerald-50/50 border border-emerald-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-gray-900 block font-semibold">3. Last 30 Days Quick Revision Kit (29 Pages)</strong>
                    <span className="text-gray-500 text-[11px]">Sprint revision summaries, key dates, works, theories, and critical terms.</span>
                  </div>
                </li>
              </ul>
            </div>

            {/* Column 2: Computer-Based CBT Tests */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-blue-800 font-bold text-sm">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>21 Computer-Based Tests (CBT Test Hall)</span>
              </div>
              <ul className="text-xs text-gray-600 space-y-2.5">
                <li className="flex items-start gap-2 p-2 rounded-lg bg-blue-50/50 border border-blue-100">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-gray-900 block font-semibold">Grand NET Mock 1 (100 Qs • 120 min)</strong>
                    <span className="text-gray-500 text-[11px]">Full-length Paper II simulation with question palette and model solutions.</span>
                  </div>
                </li>
                <li className="flex items-start gap-2 p-2 rounded-lg bg-blue-50/50 border border-blue-100">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-gray-900 block font-semibold">10 Unit Tests (50 Qs each • 60 min)</strong>
                    <span className="text-gray-500 text-[11px]">Drama, Poetry, Fiction, Prose, Language, English in India, Cultural Studies, Criticism, Theory, Research.</span>
                  </div>
                </li>
                <li className="flex items-start gap-2 p-2 rounded-lg bg-blue-50/50 border border-blue-100">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-gray-900 block font-semibold">10 Practice Mocks A to J (100 Qs each • 120 min)</strong>
                    <span className="text-gray-500 text-[11px]">Speed and stamina boosters replicating the real computer-based exam.</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 2.5 UGC NET 2026 INTERACTIVE READING & CBT TEST HALL */}
      <section className="max-w-6xl mx-auto px-4 space-y-12">
        
        {/* SECTION A: 3 HIGH-YIELD ONLINE READING DOSSIERS */}
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Online Reading Dossiers (347 Pages)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              Interactive Digital Reading Library
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Carefully designed online readers with clean academic typography, structured page navigation, and zero heavy PDF loading delays. Read anywhere on desktop or mobile.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {UGC_READING_DOSSIERS.map(dossier => (
              <div
                key={dossier.id}
                className="p-6 rounded-3xl bg-white border border-emerald-200 shadow-sm flex flex-col justify-between space-y-5 hover:border-emerald-300 hover:shadow-md transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      {dossier.badge}
                    </span>
                    <span className="text-xs font-mono font-bold text-gray-500">{dossier.pages} Pages</span>
                  </div>
                  <h3 className="text-base font-bold text-gray-900 leading-snug">{dossier.title}</h3>
                  <p className="text-xs text-gray-600 leading-relaxed">{dossier.desc}</p>
                </div>

                <button
                  onClick={() => window.open(`/study-vault/ugc/reading/${dossier.file}`, '_blank')}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Open Online Reader</span>
                  <ExternalLink className="w-3 h-3 opacity-80" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION B: 21 NTA COMPUTER-BASED CBT TESTS */}
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5" />
              <span>NTA CBT Test Hall (21 Exams)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              UGC NET Computer-Based Test Simulators
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Exact NTA exam interface: real-time countdown timer, color-coded question palette (Answered, Not Answered, Marked for Review), and instant result diagnosis.
            </p>
          </div>

          {/* Test Category Filter Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 bg-gray-100/80 p-1.5 rounded-2xl max-w-xl mx-auto border border-gray-200 text-xs font-semibold">
            <button
              onClick={() => setActiveTestCategory('all')}
              className={`py-2 px-3.5 rounded-xl transition-all cursor-pointer ${
                activeTestCategory === 'all'
                  ? 'bg-white text-blue-900 shadow-2xs font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All Tests (21)
            </button>
            <button
              onClick={() => setActiveTestCategory('grand')}
              className={`py-2 px-3.5 rounded-xl transition-all cursor-pointer ${
                activeTestCategory === 'grand'
                  ? 'bg-white text-blue-900 shadow-2xs font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Grand Mock (1)
            </button>
            <button
              onClick={() => setActiveTestCategory('units')}
              className={`py-2 px-3.5 rounded-xl transition-all cursor-pointer ${
                activeTestCategory === 'units'
                  ? 'bg-white text-blue-900 shadow-2xs font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              10 Unit Tests (500 Qs)
            </button>
            <button
              onClick={() => setActiveTestCategory('practice')}
              className={`py-2 px-3.5 rounded-xl transition-all cursor-pointer ${
                activeTestCategory === 'practice'
                  ? 'bg-white text-blue-900 shadow-2xs font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              10 Practice Mocks (1,000 Qs)
            </button>
          </div>

          {/* Test Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {UGC_TESTS.filter(t => activeTestCategory === 'all' || t.category === activeTestCategory).map(test => (
              <div
                key={test.id}
                className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between space-y-4 hover:border-blue-300 hover:shadow-xs transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full ${
                      test.category === 'grand'
                        ? 'bg-purple-100 text-purple-800 border border-purple-200'
                        : test.category === 'units'
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}>
                      {test.categoryLabel}
                    </span>
                    <span className="text-[10px] font-mono text-gray-500 font-semibold">
                      {test.qs} Qs • {test.mins} Min
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-gray-900 leading-snug">{test.title}</h4>
                  <p className="text-[11px] text-gray-600 leading-relaxed">{test.desc}</p>
                </div>

                <button
                  onClick={() => window.open(`/study-vault/ugc/tests/${test.file}`, '_blank')}
                  className="w-full py-2.5 px-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Launch CBT Exam</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION C: FREE PUBLIC DEMO STATION */}
        <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-white rounded-3xl p-6 sm:p-8 border border-amber-200 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200/60 pb-4">
            <div>
              <span className="text-[10px] font-mono uppercase bg-amber-100 text-amber-900 font-bold px-2.5 py-0.5 rounded-full border border-amber-200">
                Zero Cost • Instant Trial
              </span>
              <h3 className="text-xl font-extrabold text-gray-900 mt-1">
                Free Public Demo Station (Try Before You Enroll)
              </h3>
            </div>
            <span className="text-xs text-amber-800 font-semibold">No Registration Required</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-amber-200/80 shadow-2xs space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                  <Play className="w-4 h-4 fill-current text-amber-600" />
                  <span>10-Question Interactive CBT Demo</span>
                </div>
                <h4 className="text-sm font-bold text-gray-900">Experience Authentic NTA CBT Interface</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Experience the genuine NTA countdown timer, question palette navigation, and instant diagnostic rationales with 10 representative Paper II questions.
                </p>
              </div>
              <button
                onClick={() => window.open('/sample-materials/ugc-demo/Free_Demo_Test.html', '_blank')}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Launch Free Demo Test</span>
                <ExternalLink className="w-3 h-3 opacity-80" />
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-amber-200/80 shadow-2xs space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                  <BookOpen className="w-4 h-4 text-amber-600" />
                  <span>15-Page Sample Notes Reader</span>
                </div>
                <h4 className="text-sm font-bold text-gray-900">Sample High-Yield Notes & Author Pedagogy</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Inspect our high-yield curriculum notes, literary theory charts, and analytical frameworks across 15 sample pages right in your browser.
                </p>
              </div>
              <button
                onClick={() => window.open('/sample-materials/ugc-demo/sample_notes/index.html', '_blank')}
                className="w-full py-2.5 px-4 rounded-xl bg-gray-900 hover:bg-black text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Open Sample Notes Reader</span>
                <ExternalLink className="w-3 h-3 opacity-80" />
              </button>
            </div>
          </div>
        </div>

      </section>

      {/* 3. RELEASE SCHEDULE TIMELINE */}
      <section className="max-w-4xl mx-auto px-4 space-y-6">
        <div className="text-center space-y-2">
          <span className="text-xs font-mono uppercase font-bold text-blue-700 tracking-wider">
            Structured Release Schedule
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Systematic Phase-by-Phase Preparation
          </h2>
          <p className="text-xs sm:text-sm text-gray-500">
            Ready materials are unlocked immediately; upcoming modules unlock automatically on scheduled dates.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm divide-y divide-gray-100 overflow-hidden text-xs sm:text-sm">
          {STORE_TIMELINE_ITEMS.map((item, idx) => {
            const isReleased =
              !item.releaseDateIso || nowTimestamp >= new Date(item.releaseDateIso).getTime();
            const statusLabel = isReleased ? 'Ready Now' : 'Upcoming';
            return (
              <div key={idx} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                    isReleased ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="min-w-0">
                    <strong className="text-gray-900 block font-semibold text-xs sm:text-sm">{item.title}</strong>
                    <span className="text-[11px] sm:text-xs text-gray-500 font-mono">Scheduled: {item.date}</span>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold self-start sm:self-auto shrink-0 ${
                  isReleased
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-blue-50 text-blue-700'
                }`}>
                  {statusLabel}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. FAQ ACCORDION */}
      <section className="max-w-3xl mx-auto px-4 space-y-6">
        <div className="text-center space-y-2">
          <span className="text-xs font-mono uppercase font-bold text-blue-700 tracking-wider">
            Got Questions?
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = expandedFaq === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs transition-all"
              >
                <button
                  onClick={() => setExpandedFaq(isOpen ? null : idx)}
                  className="w-full p-4 sm:p-5 text-left font-semibold text-xs sm:text-sm text-gray-900 flex items-center justify-between gap-3"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-4 sm:px-5 pb-5 text-xs sm:text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. FINAL BOTTOM CTA BANNER */}
      <section className="max-w-4xl mx-auto px-4">
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 rounded-3xl p-8 sm:p-12 text-white text-center space-y-6 shadow-2xl border border-blue-800">
          <div className="space-y-2 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Enroll in the Final Pack 2026 Today
            </h2>
            <p className="text-xs sm:text-sm text-blue-200 leading-relaxed">
              Get immediate access to all 10+ mock tests and high-yield revision dossiers for ₹{currentServerPrice} through {STORE_MERCHANT.accessExpiryFullLabel}.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onOpenCheckout}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 hover:scale-[1.02]"
            >
              <span>Enroll Now for ₹{currentServerPrice}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenSample}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm transition-colors"
            >
              Try Free Sample First
            </button>
          </div>

          <div className="space-y-2">
            <p className="text-[11px] text-blue-300">
              Instant electronic activation • All 10+ Mocks & Reading Files included • Access till {STORE_MERCHANT.accessExpiryLabel}
            </p>
            {onOpenBookstore && (
              <button
                onClick={onOpenBookstore}
                className="text-xs text-blue-200 hover:text-white underline font-medium"
              >
                Looking for Digital Monographs & Printed Research Books? Visit Bookstore →
              </button>
            )}
          </div>
        </div>
      </section>

    </div>
  );
};
