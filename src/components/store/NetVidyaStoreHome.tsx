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
  Lock,
  ChevronDown,
  HelpCircle,
  Award,
  Layers,
  GraduationCap,
  ExternalLink,
  Calendar,
  Zap,
  Check,
  Package,
  Monitor
} from 'lucide-react';
import { useNetVidyaStore } from '../../contexts/NetVidyaStoreContext';
import {
  getStoreFaqs,
  STORE_MERCHANT
} from '../../config/storeConfig';

interface NetVidyaStoreHomeProps {
  onOpenCheckout: (productId?: string) => void;
  onOpenSample: () => void;
  onOpenLogin: () => void;
  onNavigateToMaterials?: () => void;
}

export const NetVidyaStoreHome: React.FC<NetVidyaStoreHomeProps> = ({
  onOpenCheckout,
  onOpenSample,
  onOpenLogin,
  onNavigateToMaterials
}) => {
  const { currentServerPrice, isEarlyBirdActive, paymentMode, settings, buyerSession, checkPackEnrolled } = useNetVidyaStore();
  const isEnrolled = checkPackEnrolled('ugc-net-english-bundle');

  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const faqs = getStoreFaqs(currentServerPrice);

  return (
    <div className="animate-fade-in pb-12 space-y-12 sm:space-y-16">
      
      {/* 1. HERO SECTION */}
      <section className="relative pt-10 sm:pt-14 md:pt-16 max-w-5xl mx-auto px-4 space-y-6 sm:space-y-8">
        
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
              <span>Academic Mentor &amp; Content Creator</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              Dr. Rajnikant Dodiya
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-blue-900">
              Ph.D. • 2× UGC NET &amp; GSET Qualified
            </p>
            <p className="text-xs text-gray-600 leading-relaxed max-w-xl">
              Personally curated and validated 100% of the mock questions, analytical model rationales, and high-yield reading files to help candidates excel in the upcoming examinations.
            </p>
          </div>
        </div>

        {/* Pricing & Enrollment Card (Image 1 Redesign: Non-Wrapping, E-Commerce Polish) */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg mx-auto border border-blue-200 shadow-xl space-y-4 relative overflow-hidden">
          {isEnrolled ? (
            /* Active Candidate Pass Card */
            <div className="space-y-4 text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Verified Candidate Pass Active</span>
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-gray-900">
                  UGC NET English Complete Bundle
                </h3>
                <p className="text-xs text-gray-600 mt-1">
                  Candidate access verified • Unlocked through 31 Dec 2026
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 text-xs text-gray-600 flex-wrap pt-1">
                <span className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" /> 31 Dec 2026
                </span>
                <span className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 font-medium">
                  <Clock className="w-3.5 h-3.5 text-blue-600" /> 21 CBT Tests
                </span>
                <span className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 font-medium">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-600" /> 3 Dossiers
                </span>
              </div>
              <div className="space-y-2.5 pt-2">
                <button
                  onClick={onNavigateToMaterials || (() => onOpenCheckout('ugc-net-english-bundle'))}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 hover:scale-[1.01] cursor-pointer"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Open My Materials</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={onOpenSample}
                  className="w-full py-2.5 px-4 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 text-blue-700 fill-current" />
                  <span>Try Free Demo (10 Qs + Sample)</span>
                </button>
              </div>
            </div>
          ) : (
            /* Prospective Candidate E-Commerce Pricing Card */
            <div className="space-y-4 text-center">
              <div className="flex items-center justify-center gap-2">
                {isEarlyBirdActive ? (
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
                    Early-Bird Offer
                  </span>
                ) : (
                  <span className="text-xs font-bold text-blue-800 bg-blue-100 px-3 py-1 rounded-full border border-blue-200">
                    Standard Price
                  </span>
                )}
              </div>

              <div className="flex items-baseline justify-center gap-2.5">
                <span className="text-4xl sm:text-5xl font-black text-blue-950 font-mono">₹{currentServerPrice}</span>
                <span className="text-base sm:text-lg text-gray-400 line-through">₹999</span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  50% OFF
                </span>
              </div>

              <div className="flex items-center justify-center gap-2.5 text-xs text-gray-500 flex-wrap">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-blue-600" /> 21 CBT Tests
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-600" /> 3 Dossiers (347 Pages)
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-gray-500" /> Till 31 Dec 2026
                </span>
              </div>

              <div className="space-y-2.5 pt-2">
                <button
                  onClick={() => onOpenCheckout('ugc-net-english-bundle')}
                  className="w-full py-3.5 px-6 rounded-2xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 hover:scale-[1.01] cursor-pointer"
                >
                  <Lock className="w-4 h-4 text-blue-200" />
                  <span>Enroll in Complete Bundle (₹{currentServerPrice})</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={onOpenSample}
                  className="w-full py-2.5 px-4 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 text-blue-700 fill-current" />
                  <span>Try Free Demo (10 Qs + Sample)</span>
                </button>
              </div>

              <div className="pt-1 text-center text-xs text-gray-500">
                <span>Already enrolled? </span>
                <button
                  onClick={onOpenLogin}
                  className="font-bold text-blue-700 hover:underline cursor-pointer"
                >
                  Student Login here →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mini Trust Row with Icons */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-gray-500 pt-1">
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-emerald-600" />
            <span>Instant Digital Access</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Razorpay Secured</span>
          </div>
          <div className="flex items-center gap-1.5">
            <GraduationCap className="w-4 h-4 text-emerald-600" />
            <span>Curated by Dr. Rajnikant Dodiya</span>
          </div>
        </div>
      </section>

      {/* NEW E-COMMERCE FEATURED PACKAGES CATALOG GRID */}
      <section className="max-w-6xl mx-auto px-4 space-y-6">
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 text-xs font-bold">
            <Package className="w-3.5 h-3.5 text-blue-700" />
            <span>Storefront Catalog</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            Featured Examination Packages
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 max-w-xl mx-auto">
            Choose your target examination below for instant digital activation and continuous access through 31 December 2026.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* 1. UGC NET English Bundle */}
          <div className="p-5 rounded-2xl bg-white border border-blue-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded border border-blue-200">
                  NATIONAL PASS
                </span>
              </div>
              <h3 className="text-sm font-bold text-gray-900 leading-snug">
                UGC NET English Complete Bundle
              </h3>
              <p className="text-[11px] text-gray-500 line-clamp-2">
                21 authentic CBT mock tests + 3 online reading dossiers (347 pages).
              </p>
              <div className="space-y-1.5 pt-1 text-[11px] text-gray-600">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>21 CBT Tests</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>3 Reading Dossiers</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 space-y-2">
              <div className="flex items-baseline justify-between">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-black text-gray-900 font-mono">₹499</span>
                  <span className="text-xs text-gray-400 line-through">₹999</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                  50% OFF
                </span>
              </div>
              {checkPackEnrolled('ugc-net-english-bundle') ? (
                <button
                  onClick={onNavigateToMaterials || (() => onOpenCheckout('ugc-net-english-bundle'))}
                  className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Open Materials</span>
                </button>
              ) : (
                <button
                  onClick={() => onOpenCheckout('ugc-net-english-bundle')}
                  className="w-full py-2 px-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Enroll Now (₹499)</span>
                </button>
              )}
            </div>
          </div>

          {/* 2. GSET English Scholar Duo */}
          <div className="p-5 rounded-2xl bg-white border border-emerald-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-300">
                  FLAGSHIP DUO
                </span>
              </div>
              <h3 className="text-sm font-bold text-gray-900 leading-snug">
                GSET English Scholar Duo
              </h3>
              <p className="text-[11px] text-gray-500 line-clamp-2">
                Paper 1 General Aptitude combined with Paper 2 English Literature.
              </p>
              <div className="space-y-1.5 pt-1 text-[11px] text-gray-600">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>19 CBT Tests (10 P1 + 9 P2)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Paper 1 + English Paper 2</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 space-y-2">
              <div className="flex items-baseline justify-between">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-black text-gray-900 font-mono">₹249</span>
                  <span className="text-xs text-gray-400 line-through">₹799</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                  69% OFF
                </span>
              </div>
              {checkPackEnrolled('gset-english-combo') ? (
                <button
                  onClick={onNavigateToMaterials || (() => onOpenCheckout('gset-english-combo'))}
                  className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Open Materials</span>
                </button>
              ) : (
                <button
                  onClick={() => onOpenCheckout('gset-english-combo')}
                  className="w-full py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Enroll Now (₹249)</span>
                </button>
              )}
            </div>
          </div>

          {/* 3. GSET Education Scholar Duo */}
          <div className="p-5 rounded-2xl bg-white border border-purple-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded border border-purple-300">
                  FLAGSHIP DUO
                </span>
              </div>
              <h3 className="text-sm font-bold text-gray-900 leading-snug">
                GSET Education Scholar Duo
              </h3>
              <p className="text-[11px] text-gray-500 line-clamp-2">
                Paper 1 General Aptitude combined with Paper 2 Education &amp; Pedagogy.
              </p>
              <div className="space-y-1.5 pt-1 text-[11px] text-gray-600">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span>20 CBT Tests (10 P1 + 10 P2)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span>Paper 1 + Education Paper 2</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 space-y-2">
              <div className="flex items-baseline justify-between">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-black text-gray-900 font-mono">₹249</span>
                  <span className="text-xs text-gray-400 line-through">₹799</span>
                </div>
                <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                  69% OFF
                </span>
              </div>
              {checkPackEnrolled('gset-education-combo') ? (
                <button
                  onClick={onNavigateToMaterials || (() => onOpenCheckout('gset-education-combo'))}
                  className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Open Materials</span>
                </button>
              ) : (
                <button
                  onClick={() => onOpenCheckout('gset-education-combo')}
                  className="w-full py-2 px-3 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Enroll Now (₹249)</span>
                </button>
              )}
            </div>
          </div>

          {/* 4. GSET Paper 1 Foundation */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded border border-slate-200">
                  SINGLE PAPER
                </span>
              </div>
              <h3 className="text-sm font-bold text-gray-900 leading-snug">
                GSET Paper 1 Foundation Pack
              </h3>
              <p className="text-[11px] text-gray-500 line-clamp-2">
                10 general units: Teaching, Research, ICT, Logic &amp; Higher Education.
              </p>
              <div className="space-y-1.5 pt-1 text-[11px] text-gray-600">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                  <span>10 CBT Tests (50 Qs each)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                  <span>Paper 1 General Aptitude</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 space-y-2">
              <div className="flex items-baseline justify-between">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-black text-gray-900 font-mono">₹149</span>
                  <span className="text-xs text-gray-400 line-through">₹499</span>
                </div>
                <span className="text-[10px] font-bold text-slate-700 bg-slate-50 px-1.5 py-0.5 rounded">
                  70% OFF
                </span>
              </div>
              {checkPackEnrolled('gset-paper1') ? (
                <button
                  onClick={onNavigateToMaterials || (() => onOpenCheckout('gset-paper1'))}
                  className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Open Materials</span>
                </button>
              ) : (
                <button
                  onClick={() => onOpenCheckout('gset-paper1')}
                  className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Enroll Now (₹149)</span>
                </button>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* 2. DELIVERABLES BREAKDOWN GRID */}
      <section className="max-w-6xl mx-auto px-4 space-y-10">
        <div className="text-center space-y-2">
          <span className="text-xs font-mono uppercase font-bold text-blue-700 tracking-wider">
            Complete Study Bundle Curriculum
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            What You Get Inside the ₹{currentServerPrice} Complete Bundle
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
                <span>21 Computer-Based CBT Tests</span>
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

      {/* 3. FREE PUBLIC DEMO STATION (TRY BEFORE YOU ENROLL) */}
      <section className="max-w-4xl mx-auto px-4">
        <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-white rounded-3xl p-6 sm:p-8 border border-amber-200 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200/60 pb-4">
            <div>
              <span className="text-[10px] font-mono uppercase bg-amber-100 text-amber-900 font-bold px-2.5 py-0.5 rounded-full border border-amber-200">
                Zero Cost • Instant Trial
              </span>
              <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900 mt-1">
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
              {isEnrolled ? "You're Enrolled in the UGC NET Complete Bundle" : "Enroll in the Final Pack 2026 Today"}
            </h2>
            <p className="text-xs sm:text-sm text-blue-200 leading-relaxed">
              {isEnrolled ? `Your candidate account is fully active. Access 21 NTA mock tests and reading dossiers anytime through ${STORE_MERCHANT.accessExpiryFullLabel}.` : `Get immediate access to 21 NTA mock tests and high-yield revision dossiers for ₹${currentServerPrice} through ${STORE_MERCHANT.accessExpiryFullLabel}.`}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {isEnrolled ? (
              <button
                onClick={onNavigateToMaterials || (() => onOpenCheckout('ugc-net-english-bundle'))}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 hover:scale-[1.02] cursor-pointer"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                <span>✓ National Pass Active • Open Student Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => onOpenCheckout('ugc-net-english-bundle')}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 hover:scale-[1.02] cursor-pointer"
              >
                <span>Enroll Now for ₹{currentServerPrice}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onOpenSample}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm transition-colors"
            >
              Try Free Sample First
            </button>
          </div>

          <div className="space-y-2">
            <p className="text-[11px] text-blue-300">
              Instant electronic activation • 21 Mocks &amp; 3 Reading Files included • Access till {STORE_MERCHANT.accessExpiryLabel}
            </p>
          </div>
        </div>
      </section>

    </div>
  );
};
