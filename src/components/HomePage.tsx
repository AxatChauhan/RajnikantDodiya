import React, { useState } from 'react';
import {
  PROFESSOR_INFO,
  BOOKS,
  LATEST_NEWS,
  SOCIAL_LINKS
} from '../data/professorData';
import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  Award,
  Users,
  Calendar,
  Sparkles,
  ExternalLink,
  MessageCircle,
  FileText,
  ChevronRight,
  CheckCircle2,
  Star,
  Check,
  Zap,
  ShieldCheck,
  TrendingUp,
  BrainCircuit,
  Library,
  Flame
} from 'lucide-react';
import { MainTab } from './Navbar';
import { ProfessorCrestIcon } from './common/ProfessorCrestIcon';
import { useSiteContent } from '../contexts/SiteContentContext';

interface HomePageProps {
  onNavigate: (tab: MainTab, subId?: string) => void;
  onOpenCompendium?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onOpenCompendium }) => {
  const { profile, layoutSettings, books } = useSiteContent();
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'all' | 'ugc-net' | 'books' | 'pedagogy'>('all');

  // Featured book: Dynamic lookup from studio catalog first, fallback to BOOKS
  const allAvailableBooks = books && books.length > 0 ? books : BOOKS;
  const featuredBook = allAvailableBooks.find(b => b.title.includes("UGC NET") || b.title.includes("Kalam")) || allAvailableBooks[0] || BOOKS[0];

  return (
    <div className="space-y-12 sm:space-y-16 animate-fade-in pt-2">
      
      {/* ========================================================= */}
      {/* 1. HERO SECTION: MODERN EDTECH WITH AMBIENT GLOW & CHIPS */}
      {/* ========================================================= */}
      <section className="edtech-hero-glow rounded-3xl p-6 sm:p-10 md:p-12 relative overflow-hidden">
        {/* Subtle Decorative Ambient Glow Elements */}
        <div className="absolute -top-24 -left-24 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
          
          {/* Left Column: High-Impact EdTech Intro */}
          <div className="md:col-span-7 space-y-4 sm:space-y-5">
            
            {/* SPU Institutional Live Trust Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-claret-soft/90 border border-claret/20 text-claret text-xs font-mono font-semibold shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Sardar Patel University • HMPIETR | CAIELE & IQAC Lead</span>
            </div>

            {/* Main Headline */}
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-ink font-bold leading-[1.15] tracking-tight break-words">
              Dr. Rajnikant S. Dodiya
            </h1>
            
            <p className="font-sans text-base sm:text-lg text-claret font-semibold leading-snug break-words">
              Assistant Professor · English Language Education & Teacher Education
            </p>

            {/* Short Bio */}
            <p className="text-xs sm:text-sm text-ink-muted font-reading leading-relaxed break-words whitespace-pre-line">
              {profile.shortBio || PROFESSOR_INFO.shortBio}
            </p>

            {/* Quick Category Filter Pills (PW-Style) */}
            <div className="pt-1 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-ink-muted mr-1 font-semibold">
                Explore:
              </span>
              {[
                { id: 'all', label: 'All Batches & Passes' },
                { id: 'ugc-net', label: 'UGC-NET English' },
                { id: 'books', label: 'Kalam Monograph' },
                { id: 'pedagogy', label: 'AI in ELE & NEP' }
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => {
                    setActiveCategoryFilter(pill.id as any);
                    if (pill.id === 'ugc-net') onNavigate('learn');
                    if (pill.id === 'books') onNavigate('bookstore');
                    if (pill.id === 'pedagogy') onNavigate('research');
                  }}
                  className={`text-xs px-3 py-1 rounded-full border transition-all ${
                    activeCategoryFilter === pill.id
                      ? 'bg-claret text-white border-claret shadow-xs font-semibold'
                      : 'bg-white hover:bg-gray-50 text-ink-muted border-gray-200'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {/* Primary Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={() => onNavigate('bookstore')}
                className="w-full sm:w-auto justify-center px-5 py-3 rounded-xl bg-claret hover:bg-claret-light text-white text-xs font-semibold shadow-md hover:shadow-lg transition-all flex items-center gap-2 min-h-[46px]"
              >
                <Zap className="w-4 h-4 text-brass" />
                <span>Explore Study Passes & Books</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </button>

              <a
                href={SOCIAL_LINKS.whatsappChannelEnglish}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto justify-center px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-2xs transition-all flex items-center gap-1.5 min-h-[46px]"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp Mentor</span>
              </a>
            </div>
          </div>

          {/* Right Column: Professor Photo with 4 Floating Achievement Badges */}
          <div className="md:col-span-5 relative w-full max-w-[320px] sm:max-w-[360px] md:max-w-none mx-auto">
            <div className="relative rounded-3xl overflow-hidden border-2 border-claret/20 shadow-2xl bg-white group aspect-square ring-8 ring-claret/5">
              <img
                src={profile.photoUrl || PROFESSOR_INFO.photoUrl}
                alt={profile.name || PROFESSOR_INFO.name}
                fetchPriority="high"
                loading="eager"
                decoding="async"
                width={420}
                height={420}
                className="w-full h-full object-cover object-[center_18%] filter contrast-[1.02] transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-claret/60 via-transparent to-transparent opacity-30" />
            </div>

            {/* 4 Floating Achievement Chips - Desktop Positioned Overlay (Floats along left & right flanks) */}
            <div className="hidden lg:block pointer-events-none">
              {/* Chip 1: Top-Left */}
              <div className="absolute top-4 -left-6 floating-badge px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs font-sans font-semibold text-ink pointer-events-auto">
                <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Award className="w-4 h-4" />
                </span>
                <div>
                  <p className="text-[10px] text-ink-muted uppercase leading-none">Qualified</p>
                  <p className="text-xs font-bold leading-tight">2× NET & GSET</p>
                </div>
              </div>

              {/* Chip 2: Mid-Left (No bottom collision) */}
              <div className="absolute bottom-14 -left-6 floating-badge px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs font-sans font-semibold text-ink pointer-events-auto">
                <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <GraduationCap className="w-4 h-4" />
                </span>
                <div>
                  <p className="text-[10px] text-ink-muted uppercase leading-none">Doctorate</p>
                  <p className="text-xs font-bold leading-tight">Ph.D. Kalam Inquiry</p>
                </div>
              </div>

              {/* Chip 3: Top-Right */}
              <div className="absolute top-4 -right-5 floating-badge px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs font-sans font-semibold text-ink pointer-events-auto">
                <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <BookOpen className="w-4 h-4" />
                </span>
                <div>
                  <p className="text-[10px] text-ink-muted uppercase leading-none">Catalog</p>
                  <p className="text-xs font-bold leading-tight">10 Published Books</p>
                </div>
              </div>

              {/* Chip 4: Mid-Right (No bottom collision) */}
              <div className="absolute bottom-14 -right-5 floating-badge px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs font-sans font-semibold text-ink pointer-events-auto">
                <span className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <Award className="w-4 h-4 text-purple-600" />
                </span>
                <div>
                  <p className="text-[10px] text-ink-muted uppercase leading-none">Experience</p>
                  <p className="text-xs font-bold leading-tight">15+ Yrs Academic Rigor</p>
                </div>
              </div>
            </div>

            {/* Mobile / Tablet Friendly 2x2 Achievement Grid (Clean Spacing, No Overlap) */}
            <div className="lg:hidden grid grid-cols-2 gap-2 mt-4">
              <div className="floating-badge p-2 rounded-xl flex items-center gap-2 text-xs font-sans">
                <Award className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold text-[11px] leading-tight">2× NET & GSET</span>
              </div>
              <div className="floating-badge p-2 rounded-xl flex items-center gap-2 text-xs font-sans">
                <BookOpen className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="font-semibold text-[11px] leading-tight">10 Published Books</span>
              </div>
              <div className="floating-badge p-2 rounded-xl flex items-center gap-2 text-xs font-sans">
                <GraduationCap className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="font-semibold text-[11px] leading-tight">Ph.D. Education (SPU)</span>
              </div>
              <div className="floating-badge p-2 rounded-xl flex items-center gap-2 text-xs font-sans">
                <Award className="w-4 h-4 text-purple-600 shrink-0" />
                <span className="font-semibold text-[11px] leading-tight">15+ Yrs Teaching</span>
              </div>
            </div>

            {/* Dignified Academic Caption Below (Clean Margin, Zero Overlap on All Devices) */}
            <div className="mt-6 text-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 border border-deckle shadow-2xs text-[11px] font-mono font-semibold uppercase tracking-wider text-claret">
                <ProfessorCrestIcon className="w-3.5 h-3.5" />
                <span>Faculty • Academic Researcher • Mentor</span>
              </span>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. "THE DR. DODIYA ADVANTAGE" (PW-STYLE 4 FEATURE PILLARS) */}
      {/* ========================================================= */}
      <section className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-deckle">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-claret font-bold">
              Why Prepare With Dr. Dodiya
            </span>
            <h2 className="font-serif text-xl sm:text-2xl text-ink font-bold">
              The Academic Pedagogy Advantage
            </h2>
          </div>
          <span className="hidden sm:inline-block text-xs font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full font-semibold">
            ✓ Institutional Rigor
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: Award,
              iconBg: 'bg-emerald-100 text-emerald-700',
              title: '2× Qualified Pedagogy',
              subtitle: 'English & Education',
              desc: 'Qualified UGC-NET and GSET in both disciplines, bridging literary analysis with teacher education.'
            },
            {
              icon: GraduationCap,
              iconBg: 'bg-blue-100 text-blue-700',
              title: 'Doctoral Authority',
              subtitle: 'SPU Ph.D. 2018',
              desc: 'Empirical research examining the humanistic educational thoughts of Dr. A.P.J. Abdul Kalam.'
            },
            {
              icon: BrainCircuit,
              iconBg: 'bg-purple-100 text-purple-700',
              title: 'AI in ELE & NEP 2020',
              subtitle: 'CAIELE & ELEF Coordinator',
              desc: 'Pioneering generative AI integration, post-method pedagogy, and translanguaging in Indian classrooms.'
            },
            {
              icon: Library,
              iconBg: 'bg-amber-100 text-amber-700',
              title: '10 Published Volumes',
              subtitle: 'Curriculum & Monograph',
              desc: '6 authored books and 4 edited scholarly collections referenced by universities and researchers.'
            }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="pw-card p-5 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className={`w-10 h-10 rounded-xl ${item.iconBg} flex items-center justify-center font-bold shadow-xs`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-serif text-base font-bold text-ink leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-[11px] font-mono text-claret font-semibold">
                    {item.subtitle}
                  </p>
                  <p className="text-xs text-ink-muted leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. NUMBER BOXES: 4 IMPACT STAT CARDS (PDF 2 REQUIREMENT)  */}
      {/* ========================================================= */}
      {layoutSettings.showTrackRecordBoxes && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-widest text-claret font-bold">
              Academic Track Record
            </span>
            <span className="text-[11px] font-mono text-ink-faint">Source: Official CV 2026</span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {PROFESSOR_INFO.stats.map((stat, idx) => (
              <div
                key={idx}
                className="pw-card p-4 sm:p-5 space-y-1 text-center sm:text-left transition-transform hover:-translate-y-1 border border-gray-200"
              >
                <span className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-claret block leading-tight">
                  {stat.value}
                </span>
                <h4 className="font-sans text-xs sm:text-sm font-semibold text-ink">
                  {stat.label}
                </h4>
                <p className="text-[10px] font-mono text-ink-muted">
                  {stat.sublabel}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* 4. PW-STYLE FEATURED MONOGRAPH / BATCH CARD               */}
      {/* ========================================================= */}
      {layoutSettings.showFeaturedMonograph && (
        <section className="pw-card rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-white via-blue-50/20 to-white border border-claret/20 shadow-xl space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Content Column */}
            <div className="lg:col-span-8 space-y-4">
              
              {/* Badges Ribbon */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider bg-amber-500 text-ink font-bold px-2.5 py-0.5 rounded-full shadow-2xs">
                  <Flame className="w-3.5 h-3.5" />
                  Bestseller Monograph
                </span>
                <span className="text-[11px] font-mono uppercase tracking-wider bg-claret text-white font-semibold px-2.5 py-0.5 rounded-full">
                  SPU Doctoral Series
                </span>
                <span className="text-[11px] font-mono text-ink-muted">
                  ISBN: {featuredBook.isbn} ({featuredBook.year})
                </span>
              </div>

              {/* Title & Description */}
              <div className="space-y-1 min-w-0">
                <h3 className="font-serif text-2xl sm:text-3xl text-ink font-bold leading-tight break-words">
                  {featuredBook.title}
                </h3>
                <p className="text-xs sm:text-sm font-sans text-claret font-semibold break-words">
                  By {profile.name || PROFESSOR_INFO.name} • {featuredBook.publisher}
                </p>
                <p className="text-xs sm:text-sm text-ink-muted leading-relaxed pt-1 break-words">
                  {featuredBook.details || 'Empirical inquiry examining the humanistic vision, educational epistemology, and ethical nation-building philosophy of Dr. A.P.J. Abdul Kalam. Recommended for university scholars, research trainees, and UGC-NET Paper 1 & 2 aspirants.'}
                </p>
              </div>

              {/* PW-Style Deliverable Checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                {[
                  'Complete Doctoral Monograph (180+ Pages)',
                  'Instant Digital 2-Device Pass (Phone + Laptop)',
                  'Direct WhatsApp Author Inquiry & Hard Copy Orders',
                  'Free Public Academic Sample of Chapter 0'
                ].map((feat, i) => (
                  <div key={i} className="flex items-center gap-2 text-ink-muted">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 font-bold" />
                    </span>
                    <span className="font-medium text-[11.5px]">{feat}</span>
                  </div>
                ))}
              </div>

              {/* Pricing & CTA Controls */}
              <div className="pt-3 border-t border-gray-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <div className="flex items-baseline gap-2.5">
                  <span className="text-2xl sm:text-3xl font-serif font-bold text-claret">
                    ₹399
                  </span>
                  <span className="text-sm text-gray-400 line-through font-mono">
                    ₹799
                  </span>
                  <span className="discount-pill text-[11px] px-2 py-0.5 rounded-full font-mono">
                    50% SAVINGS
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => onNavigate('bookstore')}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-claret text-claret hover:bg-claret-soft text-xs font-semibold transition-colors"
                  >
                    Read Free Excerpt
                  </button>
                  <button
                    onClick={() => onNavigate('bookstore')}
                    className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-claret hover:bg-claret-light text-white text-xs font-semibold shadow-md flex items-center justify-center gap-1.5"
                  >
                    <Zap className="w-3.5 h-3.5 text-brass" />
                    <span>Get Instant Pass</span>
                  </button>
                </div>
              </div>

            </div>

            {/* Right Book Visual */}
            <div className="lg:col-span-4 flex justify-center">
              <div className="w-full max-w-[240px] p-5 rounded-2xl bg-white border border-gray-200 shadow-lg text-center space-y-3 group hover:border-claret/40 transition-all">
                <div className="w-16 h-20 mx-auto rounded-lg bg-claret text-white flex flex-col items-center justify-center shadow-md">
                  <BookOpen className="w-7 h-7 text-brass" />
                  <span className="text-[9px] font-mono tracking-widest uppercase mt-1">SPU</span>
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-mono uppercase bg-claret-soft text-claret font-bold px-2 py-0.5 rounded-full inline-block">
                    {featuredBook.type === 'authored' ? 'Authored Monograph' : featuredBook.type === 'edited' ? 'Edited Volume' : 'Book Chapter'}
                  </span>
                  <h4 className="font-serif text-sm font-bold text-ink mt-1.5 leading-snug break-words">
                    {featuredBook.title}
                  </h4>
                  <p className="text-[11px] text-ink-muted mt-1 font-mono break-words">
                    {profile.name || PROFESSOR_INFO.name}
                  </p>
                </div>
                <div className="pt-2 border-t border-gray-100 flex items-center justify-center gap-1 text-[11px] text-emerald-700 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Licensed 2-Device Pass</span>
                </div>
              </div>
            </div>

          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* 5. SCHOLAR REVIEWS & SUCCESS STORIES (PW SOCIAL PROOF)    */}
      {/* ========================================================= */}
      <section className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-deckle">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-claret font-bold">
              Social Proof & Testimonials
            </span>
            <h2 className="font-serif text-xl sm:text-2xl text-ink font-bold">
              What Scholars & NET Candidates Say
            </h2>
          </div>
          <span className="text-xs font-mono text-ink-muted">
            Verified Academic Community
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              name: 'Priya Sharma',
              qualification: 'UGC-NET English Aspirant',
              university: 'Sardar Patel University',
              rating: 5,
              review: 'Dr. Dodiya’s pedagogical frameworks and research methodology breakdowns transformed how I approached critical theory and Paper 1 questions. Highly recommended!'
            },
            {
              name: 'Aarav Patel',
              qualification: 'M.Ed. Research Scholar',
              university: 'HMPIETR, Vallabh Vidyanagar',
              rating: 5,
              review: 'The doctoral treatise on Dr. Kalam’s educational thought offers profound philosophical clarity. The 2-device digital study pass is smooth and instant on phone and laptop.'
            },
            {
              name: 'Meera Trivedi',
              qualification: 'Assistant Professor Trainee',
              university: 'Gujarat University',
              rating: 5,
              review: 'The YouTube lectures on NETVidya combined with the mock test rationales give candidates an authentic competitive edge. Structured and deeply insightful guidance.'
            }
          ].map((item, idx) => (
            <div
              key={idx}
              className="pw-card p-5 rounded-2xl space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <p className="text-xs text-ink leading-relaxed italic">
                  "{item.review}"
                </p>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-ink">{item.name}</h4>
                  <p className="text-[10px] text-claret font-semibold">{item.qualification}</p>
                </div>
                <span className="text-[9px] font-mono text-gray-400 bg-gray-50 px-2 py-0.5 rounded border">
                  Verified
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 6. LATEST NEWS & EVENTS                                   */}
      {/* ========================================================= */}
      {layoutSettings.showHighlights && (
        <section className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-deckle">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-claret" />
              <h2 className="font-serif text-xl sm:text-2xl text-ink font-bold">
                Latest News & Academic Events
              </h2>
            </div>
            <button
              onClick={() => onNavigate('talks')}
              className="text-xs font-mono text-claret hover:underline flex items-center gap-1 font-semibold"
            >
              <span>All Events</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {LATEST_NEWS.map((item, idx) => (
              <div
                key={idx}
                className="pw-card p-5 space-y-2 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-claret font-bold bg-claret-soft px-2 py-0.5 rounded">
                    {item.date}
                  </span>
                  <h4 className="font-serif text-base text-ink font-bold leading-snug">
                    {item.title}
                  </h4>
                  {item.details && (
                    <p className="text-xs text-ink-muted leading-relaxed">
                      {item.details}
                    </p>
                  )}
                </div>
                <div className="pt-2 border-t border-gray-100 text-[10px] font-mono text-ink-faint">
                  {item.category}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* 7. JOIN OFFICIAL STUDY CHANNELS ON WHATSAPP & YOUTUBE     */}
      {/* ========================================================= */}
      <section className="p-6 sm:p-8 rounded-3xl bg-[#0F2036] text-white border border-[#2B4162] shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-xl">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#48CAE4] font-bold block">
              Direct Guidance & Resources
            </span>
            <h3 className="font-serif text-2xl text-white font-bold">
              Join Official UGC-NET Communities
            </h3>
            <p className="text-xs text-[#C4D5EB] font-reading leading-relaxed">
              Receive verified study notes, lecture summaries, UGC-NET syllabus updates, and notification alerts directly on your phone.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            <a
              href={SOCIAL_LINKS.whatsappChannelEnglish}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-sans font-semibold transition-all shadow-sm flex items-center justify-center gap-2 min-h-[42px]"
            >
              <MessageCircle className="w-4 h-4" />
              <span>NETVidya English Channel</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </a>

            <a
              href={SOCIAL_LINKS.youtubeNetVidya}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-sans font-semibold transition-all shadow-sm flex items-center justify-center gap-2 min-h-[42px]"
            >
              <ExternalLink className="w-4 h-4" />
              <span>YouTube Channel</span>
            </a>
          </div>
        </div>
      </section>

    </div>
  );
};
