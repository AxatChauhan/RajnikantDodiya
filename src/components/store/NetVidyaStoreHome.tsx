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
  GraduationCap
} from 'lucide-react';
import { useNetVidyaStore } from '../../contexts/NetVidyaStoreContext';
import {
  getStoreFaqs,
  STORE_MERCHANT,
  STORE_TIMELINE_ITEMS
} from '../../config/storeConfig';

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
              Final Pack 2026
            </span>
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            The definitive national preparation bundle: authentic NTA computer-based test simulations, comprehensive pedagogical explanations, and downloadable high-yield revision dossiers.
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
              <span>Buy Final Pack — ₹{currentServerPrice}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenSample}
              className="w-full sm:w-auto py-3.5 px-6 rounded-2xl bg-gray-50 hover:bg-gray-100 border border-gray-300 text-gray-800 font-bold text-sm transition-colors flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 text-blue-700 fill-current" />
              <span>Try Free Demo</span>
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
            What You Get Inside Your Dashboard
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Comprehensive Paper II English Preparation
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-white border border-gray-200 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">NTA Computer-Based Mock Tests</h3>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Full 100-question Paper II simulations matching the official NTA UGC-NET screen layout, countdown timer, question palette, and negative marking rules.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-gray-200 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Analytical Model Rationale</h3>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Not just answer keys: complete pedagogical explanations citing critical texts, theoretical authorities, and reasons why tricky distractors are eliminated.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-gray-200 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Downloadable Reading Dossiers</h3>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Instant PDF downloads of high-yield revision summaries: Literary Theory, Post-Method Pedagogy, Cultural Studies, and Research Methodology style sheets.
            </p>
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
