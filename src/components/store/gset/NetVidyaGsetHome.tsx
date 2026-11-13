import React, { useState } from 'react';
import {
  GraduationCap,
  Award,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  Sparkles,
  ShieldCheck,
  Clock,
  Layers,
  ChevronRight,
  HelpCircle,
  MessageCircle,
  FileText
} from 'lucide-react';
import { STORE_MERCHANT } from '../../../config/storeConfig';

export interface GsetProductItem {
  id: string;
  name: string;
  stream: 'english' | 'education' | 'general';
  price: number;
  originalPrice: number;
  badge?: string;
  description: string;
  features: string[];
  isCombo?: boolean;
}

interface NetVidyaGsetHomeProps {
  onOpenCheckout: (productId?: string) => void;
  onOpenDemoTest: () => void;
  currentServerPrice: number;
}

export const NetVidyaGsetHome: React.FC<NetVidyaGsetHomeProps> = ({
  onOpenCheckout,
  onOpenDemoTest,
  currentServerPrice
}) => {
  const [selectedStream, setSelectedStream] = useState<'english' | 'education'>('english');
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const englishCombo: GsetProductItem = {
    id: 'gset-english-combo',
    name: 'GSET English Scholar Duo (Paper 1 + English)',
    stream: 'english',
    price: 249,
    originalPrice: 799,
    badge: 'MOST POPULAR • COMPLETE ENGLISH PASS',
    description: 'The definitive all-in-one preparation package for GSET English aspirants: comprehensive Paper 1 General Aptitude combined with specialized Paper 2 English Literature & ELT.',
    features: [
      'Full Paper 1: 3 Computer-Based CBT Tests (General Aptitude)',
      'Full Paper 2: 2 Computer-Based CBT Tests (English Literature, Theory & ELT)',
      '5 Complete GSET Simulation Mock Exams with instant scoring',
      '100% MSU Baroda GSET Syllabus Aligned & Verified Rationales',
      'Watermarked Digital Access valid till 31 Dec 2026',
      'Priority WhatsApp Academic Guidance with Mentor'
    ],
    isCombo: true
  };

  const educationCombo: GsetProductItem = {
    id: 'gset-education-combo',
    name: 'GSET Education Scholar Duo (Paper 1 + Education)',
    stream: 'education',
    price: 249,
    originalPrice: 799,
    badge: 'MOST POPULAR • COMPLETE EDUCATION PASS',
    description: 'The definitive dual-paper preparation package for GSET Education candidates: complete Paper 1 General Aptitude combined with specialized Teacher Education & Pedagogy.',
    features: [
      'Full Paper 1: 3 Computer-Based CBT Tests (General Aptitude)',
      'Full Paper 2: 3 Computer-Based CBT Tests (Teacher Education & Pedagogy)',
      '6 Complete GSET Simulation Mock Exams with instant scoring',
      'Philosophical, Sociological & Psychological Foundations + Pedagogy',
      'Watermarked Digital Access valid till 31 Dec 2026',
      'Priority WhatsApp Academic Guidance with Mentor'
    ],
    isCombo: true
  };

  const standalonePacks: GsetProductItem[] = [
    {
      id: 'gset-paper1',
      name: 'GSET Paper 1: General Aptitude Foundation Pack',
      stream: 'general',
      price: 149,
      originalPrice: 499,
      badge: 'COMMON TO ALL STREAMS',
      description: 'Master all 10 general units: Teaching Aptitude, Research Methodology, Comprehension, Mathematical & Logical Reasoning, ICT, and Higher Education.',
      features: [
        '3 Full Computer-Based CBT Mock Exams (50 Qs each)',
        '10 Core Foundation Units High-Yield Coverage',
        'Bilingual Gujarati/English interface & explanations',
        'Digital Access valid till 31 Dec 2026'
      ]
    },
    ...(selectedStream === 'english'
      ? [
          {
            id: 'gset-paper2-english',
            name: 'GSET Paper 2: English Literature Specialist Pack',
            stream: 'english' as const,
            price: 149,
            originalPrice: 499,
            badge: 'ENGLISH SUBJECT SPECIALIST',
            description: 'Focused exclusively on Paper 2 English Literature, Literary Criticism & Theory, Post-Method Pedagogy, and ELT in India.',
            features: [
              '2 Full Literature & Pedagogy CBT Mock Exams (100 Qs each)',
              'Chaucer to Contemporary World Literature Breakdown',
              'Literary Theory, Structuralism & Cultural Studies Guide',
              'Digital Access valid till 31 Dec 2026'
            ]
          }
        ]
      : [
          {
            id: 'gset-paper2-education',
            name: 'GSET Paper 2: Education Discipline Master Pack',
            stream: 'education' as const,
            price: 149,
            originalPrice: 499,
            badge: 'EDUCATION SUBJECT SPECIALIST',
            description: 'Focused exclusively on Paper 2 Education: Philosophy, Psychology, Learner Development, Teacher Training, and Educational Research.',
            features: [
              '3 Full Education Discipline CBT Mock Exams (100 Qs each)',
              'Western & Indian Philosophical Systems in Education',
              'Teacher Education Models & Policy Reforms (NEP 2020)',
              'Digital Access valid till 31 Dec 2026'
            ]
          }
        ])
  ];

  const activeCombo = selectedStream === 'english' ? englishCombo : educationCombo;

  const gsetFaqs = [
    {
      q: 'Which syllabus does the GSET 2026 pack follow?',
      a: 'The pack is 100% compliant with the official Gujarat State Eligibility Test (GSET) syllabus governed by The Maharaja Sayajirao University of Baroda (MSU), covering both Paper 1 General Aptitude and Paper 2 Subject specializations.'
    },
    {
      q: 'Can I purchase Paper 1 or Paper 2 individually?',
      a: 'Yes! While the Complete Scholar Duo (₹249) offers the greatest qualifying value, you can also enroll in standalone packs: Paper 1 Foundation Pack (₹149), Paper 2 Education Master Pack (₹149), or Paper 2 English Specialist Pack (₹149).'
    },
    {
      q: 'Are English and Education the same exam?',
      a: 'No. In GSET, English Literature and Teacher Education are two entirely different subject streams with completely different Paper 2 examinations. Paper 1 General Aptitude is common to both streams. Choose your respective stream above to get the matching tests.'
    },
    {
      q: 'How do I access the CBT mock exams?',
      a: 'Immediately upon checkout via Razorpay, your account is activated. Simply log in with your email to access your personal dashboard and launch the authentic computer-based CBT test hall with real timer and question palette.'
    },
    {
      q: 'How long is my access valid?',
      a: 'Your digital enrollment provides continuous access until 31 December 2026, covering the upcoming examination cycle.'
    }
  ];

  return (
    <div className="space-y-16 sm:space-y-24 animate-fade-in pb-12">
      {/* 1. HERO SECTION */}
      <section className="relative pt-6 sm:pt-10 max-w-5xl mx-auto px-4 space-y-8">
        {/* State Eligibility Badge */}
        <div className="text-center px-2">
          <div className="inline-flex flex-wrap items-center justify-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-2xl sm:rounded-full bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold">Gujarat State Eligibility Test (GSET 2026)</span>
            <span className="text-emerald-700 font-mono hidden sm:inline">• MSU Baroda Syllabus Aligned</span>
          </div>
        </div>

        {/* Main Headline & Subtitle */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight">
            GSET 2026 <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-emerald-700 via-teal-800 to-blue-900 bg-clip-text text-transparent">
              Examination Storefront
            </span>
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Specialized state-level qualifying preparation for Gujarat scholars: authentic pedagogical explanations, bilingual foundation guidance, and comprehensive Paper 1, English, and Education dossiers.
          </p>
        </div>

        {/* Author Spotlight & Credentials */}
        <div className="bg-gradient-to-br from-emerald-50/70 via-white to-blue-50/50 rounded-3xl p-5 sm:p-7 border border-emerald-100 shadow-sm max-w-3xl mx-auto flex flex-col sm:flex-row items-center gap-5 sm:gap-6 text-center sm:text-left">
          <div className="relative shrink-0">
            <img
              src="/dr-rajnikant-dodiya.jpg"
              alt="Dr. Rajnikant Dodiya"
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-emerald-200 shadow-md ring-4 ring-white"
            />
            <div className="absolute -bottom-2 -right-2 bg-emerald-600 text-white p-1 rounded-lg shadow-xs" title="Verified Author">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100/80 text-emerald-800 text-[11px] font-bold tracking-wide uppercase">
              <GraduationCap className="w-3.5 h-3.5 text-emerald-700" />
              <span>Academic Mentor & Content Creator</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              Dr. Rajnikant Dodiya
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-emerald-900">
              Ph.D. in English • 2× UGC NET & GSET Qualified Scholar
            </p>
            <p className="text-xs text-gray-600 leading-relaxed max-w-xl">
              Assistant Professor of English & Doctoral Researcher in Language Education. Personally qualified GSET and UGC-NET, curating authoritative subject materials for Gujarat candidates.
            </p>
          </div>
        </div>

        {/* 2. DISCIPLINE / STREAM SELECTOR */}
        <div className="max-w-2xl mx-auto pt-4 space-y-3">
          <div className="text-center space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-800 font-bold">
              Step 1: Choose Your Examination Subject Stream
            </span>
            <p className="text-xs text-gray-500">
              Select your subject to view tailored Paper 1 and Paper 2 package offerings
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 p-1.5 bg-gray-100/80 rounded-2xl border border-gray-200">
            <button
              onClick={() => setSelectedStream('english')}
              className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-2 ${
                selectedStream === 'english'
                  ? 'bg-white text-emerald-900 shadow-sm border border-emerald-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
              }`}
            >
              <BookOpen className="w-4 h-4 text-emerald-700" />
              <span>English Literature Stream</span>
            </button>
            <button
              onClick={() => setSelectedStream('education')}
              className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-2 ${
                selectedStream === 'education'
                  ? 'bg-white text-emerald-900 shadow-sm border border-emerald-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-teal-700" />
              <span>Education (Pedagogy) Stream</span>
            </button>
          </div>

          {/* Stream Distinction Notice */}
          <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-center gap-2.5">
            <span className="shrink-0 w-2 h-2 rounded-full bg-amber-500" />
            <p className="leading-relaxed">
              <strong>Distinct Subject Streams:</strong> English Literature and Teacher Education are two separate qualification disciplines with completely different Paper 2 examinations. Paper 1 General Aptitude is common to both.
            </p>
          </div>
        </div>
      </section>

      {/* 3. PACKAGES & PRICING DISPLAY */}
      <section className="max-w-5xl mx-auto px-4 space-y-8">
        <div className="text-center space-y-1">
          <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-800 font-bold">
            Step 2: Select Your Preferred Package
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            {selectedStream === 'english' ? 'GSET English Preparation Options' : 'GSET Education Preparation Options'}
          </h2>
        </div>

        {/* A. FLAGSHIP COMBO CARD (FEATURED) */}
        <div className="bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-white rounded-3xl p-6 sm:p-8 border-2 border-emerald-500 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] font-mono font-bold tracking-widest uppercase px-4 py-1.5 rounded-bl-xl shadow-xs">
            {activeCombo.badge}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="space-y-1.5">
                <span className="text-xs font-mono uppercase text-emerald-800 font-bold tracking-wider">
                  Complete Qualifying Duo
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                  {activeCombo.name}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  {activeCombo.description}
                </p>
              </div>

              <div className="space-y-2 pt-2">
                {activeCombo.features.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-gray-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-emerald-200 text-center space-y-4 shadow-sm">
              <div className="space-y-1">
                <span className="text-[11px] font-mono text-gray-500 uppercase tracking-wider block">
                  Limited Enrollment Price
                </span>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-4xl font-extrabold text-emerald-900">₹{activeCombo.price}</span>
                  <span className="text-base text-gray-400 line-through">₹{activeCombo.originalPrice}</span>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full inline-block">
                  Save ₹{activeCombo.originalPrice - activeCombo.price} (20% Off)
                </span>
              </div>

              <button
                onClick={() => onOpenCheckout(activeCombo.id)}
                className="w-full py-3 px-5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                <span>Enroll in Complete Duo (₹{activeCombo.price})</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-4 text-[11px] text-gray-500 font-mono">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Instant Activation
                </span>
                <span>•</span>
                <span>Access till 31 Dec 2026</span>
              </div>
            </div>
          </div>
        </div>

        {/* B. STANDALONE PACKS (MODULAR OPTIONS) */}
        <div className="space-y-4 pt-4">
          <div className="text-center sm:text-left">
            <h3 className="text-base sm:text-lg font-bold text-gray-900">
              Need Only a Single Paper? Choose Standalone Packs
            </h3>
            <p className="text-xs text-gray-500">
              Modular options for candidates seeking targeted preparation in either Paper 1 or Paper 2
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {standalonePacks.map(pack => (
              <div
                key={pack.id}
                className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase bg-gray-100 text-gray-700 font-bold px-2 py-0.5 rounded">
                      {pack.badge}
                    </span>
                    <div className="text-right">
                      <span className="text-xl font-bold text-gray-900">₹{pack.price}</span>
                      <span className="text-xs text-gray-400 line-through ml-1.5">₹{pack.originalPrice}</span>
                    </div>
                  </div>

                  <h4 className="text-base font-bold text-gray-900 leading-snug">
                    {pack.name}
                  </h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {pack.description}
                  </p>

                  <div className="space-y-1.5 pt-2">
                    {pack.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-xs text-gray-600">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => onOpenCheckout(pack.id)}
                  className="w-full py-2.5 px-4 rounded-xl bg-gray-900 hover:bg-emerald-800 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Enroll in Pack (₹{pack.price})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. FREQUENTLY ASKED QUESTIONS */}
      <section className="max-w-3xl mx-auto px-4 space-y-6">
        <div className="text-center space-y-1">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-2">
            <HelpCircle className="w-5 h-5" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            Frequently Asked Questions about GSET 2026
          </h2>
          <p className="text-xs text-gray-500">
            Clear details regarding curriculum, formats, and digital delivery
          </p>
        </div>

        <div className="space-y-3">
          {gsetFaqs.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden transition-colors shadow-2xs"
              >
                <button
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-semibold text-xs sm:text-sm text-gray-900 hover:text-emerald-800"
                >
                  <span>{faq.q}</span>
                  <ChevronRight
                    className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0 text-xs text-gray-600 leading-relaxed border-t border-gray-100 mt-1">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
