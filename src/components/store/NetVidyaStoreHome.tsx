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

interface NetVidyaStoreHomeProps {
  onOpenCheckout: () => void;
  onOpenSample: () => void;
  onOpenLogin: () => void;
}

export const NetVidyaStoreHome: React.FC<NetVidyaStoreHomeProps> = ({
  onOpenCheckout,
  onOpenSample,
  onOpenLogin
}) => {
  const { currentServerPrice, isEarlyBirdActive, msUntilCutoff, settings } = useNetVidyaStore();

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

  const faqs = [
    {
      q: 'What is included in the "GSET + UGC NET English Final Pack 2026"?',
      a: 'The pack includes 5 full-length 100-question Paper II NTA simulated mocks, unit-wise diagnostic tests, 5 bonus practice mocks, and complete downloadable high-yield revision dossiers (PDFs) covering Literary Theory, Post-Method Pedagogy, Cultural Studies, and Research Methodology.'
    },
    {
      q: 'How long do I have access to the Test Hall and Reading Files?',
      a: 'Your digital pass is active continuously through 31 December 2026. You can retake practice tests and review explanations anytime from your phone, tablet, or laptop.'
    },
    {
      q: 'How does the online mock test interface work?',
      a: 'The test environment replicates the real NTA computer-based examination screen, including a real-time countdown timer, question palette (Answered, Not Answered, Marked for Review), and instant diagnostic scoring with model explanations for every question.'
    },
    {
      q: 'What is the early-bird pricing deadline?',
      a: 'The early-bird price of ₹799 is valid until 10 November 2026 at 11:59 PM IST. From 11 November onwards, enrollment automatically transitions to the standard price of ₹999.'
    },
    {
      q: 'Can I study on my mobile phone?',
      a: 'Yes, the entire store, student dashboard, reading files, and NTA test hall are 100% responsive and optimized for smartphones, tablets, and desktop browsers.'
    }
  ];

  return (
    <div className="space-y-16 sm:space-y-24 animate-fade-in pb-12">
      
      {/* 1. HERO SECTION */}
      <section className="relative pt-6 sm:pt-12 text-center max-w-4xl mx-auto px-4 space-y-6">
        
        {/* Early-Bird Countdown Badge */}
        {isEarlyBirdActive ? (
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Early-Bird Offer: ₹799</span>
            <span className="text-emerald-700 font-mono">
              (Ends in {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s)
            </span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-900 text-xs font-semibold">
            <span>Standard Enrollment Open • Access till 31 Dec 2026</span>
          </div>
        )}

        {/* Main Headline */}
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight leading-tight">
            GSET + UGC NET English <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 bg-clip-text text-transparent">
              Final Pack 2026
            </span>
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            The definitive all-in-one preparation bundle: NTA-style CBT test simulations, comprehensive analytical explanations, and downloadable high-yield revision dossiers.
          </p>
        </div>

        {/* Pricing Card Banner */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg mx-auto border border-blue-200 shadow-xl space-y-5 relative overflow-hidden">
          <div className="flex items-baseline justify-center gap-3">
            <span className="text-4xl sm:text-5xl font-black text-blue-950">₹{currentServerPrice}</span>
            <span className="text-xs sm:text-sm font-semibold text-gray-400 line-through">₹1,499</span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
              {isEarlyBirdActive ? 'Save ₹700 Today' : 'Best Value'}
            </span>
          </div>

          <p className="text-xs text-gray-500">
            One-time payment • No recurring fees • Access valid through <strong>31 December 2026</strong>
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
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-gray-500 pt-2">
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
              Full 100-question Paper II simulations matching the official UGC-NET / GSET screen layout, countdown timer, question palette, and negative marking rules.
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
          {[
            { date: 'Ready Now', title: 'NET Mock 1, Unit Test 1, 5 Bonus Practice Mocks & Reading Dossiers', status: 'Ready Now', color: 'emerald' },
            { date: '6 Nov 2026', title: 'NET Mock 2 (Full-Length Literature & Theory)', status: 'Upcoming', color: 'blue' },
            { date: '10 Nov 2026', title: 'NET Mock 3 (Mid-Term Diagnostic Mock) • Early-Bird Price Ends (₹799 -> ₹999)', status: 'Upcoming', color: 'blue' },
            { date: '14 Nov 2026', title: 'NET Mock 4 (Cultural Studies & English in India)', status: 'Upcoming', color: 'blue' },
            { date: '21 Nov 2026', title: 'NET Mock 5 (Research Methods & Pedagogy)', status: 'Upcoming', color: 'blue' },
            { date: '28 Nov 2026', title: 'GSET Special Simulation Exam 1', status: 'Upcoming', color: 'blue' },
            { date: '5 Dec 2026', title: 'Grand Final Rank Booster Exam 2026', status: 'Upcoming', color: 'blue' }
          ].map((item, idx) => (
            <div key={idx} className="p-4 sm:p-5 flex items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                  item.status === 'Ready Now' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                }`}>
                  {idx + 1}
                </div>
                <div>
                  <strong className="text-gray-900 block font-semibold">{item.title}</strong>
                  <span className="text-xs text-gray-500 font-mono">Scheduled: {item.date}</span>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 ${
                item.status === 'Ready Now'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-blue-50 text-blue-700'
              }`}>
                {item.status}
              </span>
            </div>
          ))}
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
              Lock in your early-bird enrollment for ₹{currentServerPrice} before the fee increases to ₹999 on 10 November.
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

          <p className="text-[11px] text-blue-300">
            Instant electronic activation • All 10+ Mocks & Reading Files included • Access till 31 Dec 2026
          </p>
        </div>
      </section>

    </div>
  );
};
