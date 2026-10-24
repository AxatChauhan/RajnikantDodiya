import React from 'react';
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
  Download
} from 'lucide-react';
import { MainTab } from './Navbar';
import { ProfessorCrestIcon } from './common/ProfessorCrestIcon';

interface HomePageProps {
  onNavigate: (tab: MainTab, subId?: string) => void;
  onOpenCompendium: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onOpenCompendium }) => {
  // Featured book: UGC NET English Literature or Kalam treatise
  const featuredBook = BOOKS.find(b => b.title.includes("UGC NET")) || BOOKS[0];

  return (
    <div className="space-y-12 sm:space-y-16 animate-fade-in pt-2">
      
      {/* ========================================================= */}
      {/* 1. HERO SECTION: SHORT INTRO + PHOTO & BADGES (PDF 1 & 2) */}
      {/* ========================================================= */}
      <section className="folio-card rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-12 bg-white border border-deckle shadow-book relative overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 sm:gap-10 items-center">
          
          {/* Left Column: Short Intro */}
          <div className="md:col-span-7 space-y-4 sm:space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-claret-soft border border-claret/20 text-claret text-xs font-mono font-semibold">
              <ProfessorCrestIcon className="w-4 h-4" />
              <span>{PROFESSOR_INFO.institution}</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-ink font-normal leading-[1.15] tracking-tight">
              {PROFESSOR_INFO.name}
            </h1>
            
            <p className="font-serif text-sm sm:text-base text-claret font-medium leading-snug">
              {PROFESSOR_INFO.title} • Ph.D. in Education
            </p>

            {/* Exact Short Bio from PDF 1 */}
            <p className="text-xs sm:text-sm text-ink-muted font-reading leading-relaxed font-light">
              {PROFESSOR_INFO.shortBio}
            </p>

            {/* Academic Credentials Badges */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-mono">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-parchment-warm text-ink-muted border border-deckle">
                <GraduationCap className="w-3.5 h-3.5 text-claret" />
                <span>Ph.D. Education (SPU, 2018)</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-parchment-warm text-ink-muted border border-deckle">
                <Award className="w-3.5 h-3.5 text-brass" />
                <span>UGC-NET & GSET (Eng & Edu)</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-parchment-warm text-ink-muted border border-deckle">
                <span>IQAC & CAIELE Coordinator</span>
              </span>
            </div>

            {/* Direct Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={() => onNavigate('about')}
                className="w-full sm:w-auto justify-center px-5 py-2.5 rounded-xl bg-claret hover:bg-claret-light text-white text-xs font-medium shadow-xs transition-all flex items-center gap-2 min-h-[44px]"
              >
                <span>Read Full Biography</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={onOpenCompendium}
                className="w-full sm:w-auto justify-center px-5 py-2.5 rounded-xl bg-parchment-warm hover:bg-parchment-deep text-ink text-xs font-medium border border-deckle transition-all flex items-center gap-1.5 min-h-[44px]"
              >
                <Download className="w-3.5 h-3.5 text-claret" />
                <span>Download CV</span>
              </button>

              <button
                onClick={() => onNavigate('learn')}
                className="w-full sm:w-auto justify-center px-5 py-2.5 rounded-xl bg-white hover:bg-parchment-warm text-claret text-xs font-medium border border-claret/30 transition-all flex items-center gap-1.5 min-h-[44px]"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Explore Books & NET Courses</span>
              </button>
            </div>
          </div>

          {/* Right Column: Professor Photo - 1:1 Aspect Ratio (Never Cut Off on Any Device) */}
          <div className="md:col-span-5 relative w-full max-w-[320px] sm:max-w-[360px] md:max-w-none mx-auto">
            <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-deckle shadow-book-lg bg-parchment-warm group aspect-square">
              <img
                src={PROFESSOR_INFO.photoUrl}
                alt={PROFESSOR_INFO.name}
                fetchPriority="high"
                loading="eager"
                decoding="async"
                width={400}
                height={400}
                className="w-full h-full object-cover object-center filter contrast-[1.02] transition-transform duration-700 group-hover:scale-105"
              />
              {/* Subtle top-corner academic seal badge */}
              <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md border border-deckle shadow-2xs text-[10px] font-mono font-semibold uppercase tracking-wider text-claret">
                Academic Profile
              </div>
            </div>

            {/* Dignified Caption Below Portrait (Leaves 100% of Face & Suit Unobscured) */}
            <div className="mt-3 text-center space-y-0.5">
              <span className="text-[10.5px] font-mono uppercase tracking-widest text-claret font-semibold block">
                Faculty • Researcher • Mentor
              </span>
              <p className="text-xs text-ink-muted font-reading font-light">
                {PROFESSOR_INFO.institution}
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. NUMBER BOXES: 4 IMPACT STAT CARDS (PDF 2 REQUIREMENT)  */}
      {/* ========================================================= */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-widest text-claret font-bold">
            Academic Track Record
          </span>
          <span className="text-[11px] font-mono text-ink-faint">Source: CV 2026</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {PROFESSOR_INFO.stats.map((stat, idx) => (
            <div
              key={idx}
              className="p-4 sm:p-5 rounded-2xl bg-white border border-deckle shadow-book space-y-1 text-center sm:text-left transition-transform hover:-translate-y-1"
            >
              <span className="font-serif text-2xl sm:text-3xl lg:text-4xl font-normal text-claret block leading-tight">
                {stat.value}
              </span>
              <h4 className="font-serif text-xs sm:text-sm font-medium text-ink">
                {stat.label}
              </h4>
              <p className="text-[10px] font-mono text-ink-muted">
                {stat.sublabel}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. LATEST NEWS (3 ITEMS PER PDF 2 SPECIFICATION)         */}
      {/* ========================================================= */}
      <section className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-deckle">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-claret" />
            <h2 className="font-serif text-xl sm:text-2xl text-ink font-normal">Latest News & Updates</h2>
          </div>
          <button
            onClick={() => onNavigate('talks')}
            className="text-xs font-mono text-claret hover:underline flex items-center gap-1"
          >
            <span>All Events</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {LATEST_NEWS.map((item, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-white border border-deckle shadow-book space-y-2 flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-claret font-bold bg-claret-soft px-2 py-0.5 rounded">
                  {item.date}
                </span>
                <h4 className="font-serif text-base text-ink font-normal leading-snug">
                  {item.title}
                </h4>
                {item.details && (
                  <p className="text-xs font-reading text-ink-muted leading-relaxed font-light">
                    {item.details}
                  </p>
                )}
              </div>
              <div className="pt-2 border-t border-deckle/60 text-[10px] font-mono text-ink-faint">
                {item.category}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. FEATURED BOOK (PDF 2 REQUIREMENT)                     */}
      {/* ========================================================= */}
      <section className="folio-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-white via-parchment-warm/40 to-white border border-deckle shadow-book">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          
          <div className="md:col-span-8 space-y-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-claret font-bold bg-claret-soft px-2.5 py-0.5 rounded-full inline-block">
              Featured Academic Publication
            </span>
            <h3 className="font-serif text-xl sm:text-2xl text-ink font-normal">
              {featuredBook.title}
            </h3>
            <p className="text-xs sm:text-sm font-reading text-ink-muted leading-relaxed font-light">
              Publisher: <strong className="text-ink">{featuredBook.publisher}</strong> • ISBN: <span className="font-mono">{featuredBook.isbn}</span> ({featuredBook.year})
            </p>
            <p className="text-xs font-reading text-ink-muted leading-relaxed">
              Curated examination sourcebook for university scholars, research trainees, and UGC-NET / GSET candidates.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <button
                onClick={() => onNavigate('bookstore')}
                className="w-full sm:w-auto justify-center px-4 py-2.5 rounded-xl bg-claret hover:bg-claret-light text-white text-xs font-medium transition-all shadow-xs flex items-center gap-1.5 min-h-[42px]"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Open Academic Bookstore</span>
              </button>

              <button
                onClick={() => onNavigate('publications')}
                className="w-full sm:w-auto justify-center px-4 py-2.5 rounded-xl bg-parchment-warm hover:bg-parchment-deep text-ink text-xs font-medium border border-deckle transition-all min-h-[42px] flex items-center"
              >
                <span>View All 10 Books</span>
              </button>
            </div>
          </div>

          <div className="md:col-span-4 flex justify-center">
            <div className="p-4 rounded-2xl bg-parchment-warm/70 border border-deckle text-center space-y-2 max-w-xs w-full">
              <div className="w-12 h-12 rounded-xl bg-claret text-white flex items-center justify-center mx-auto shadow-xs">
                <BookOpen className="w-6 h-6 text-brass" />
              </div>
              <span className="font-serif text-sm font-medium text-ink block">
                {featuredBook.type.toUpperCase()} BOOK
              </span>
              <span className="font-mono text-xs text-claret font-semibold block">
                Dr. Rajnikant S. Dodiya
              </span>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================= */}
      {/* 5. JOIN WHATSAPP CHANNELS (PDF 2 REQUIREMENT)            */}
      {/* ========================================================= */}
      <section className="p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-[#0F2036] text-white border border-[#2B4162] space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-xl">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#48CAE4] font-bold block">
              Direct Academic Guidance
            </span>
            <h3 className="font-serif text-2xl text-white font-normal">
              Join Official Study Channels on WhatsApp
            </h3>
            <p className="text-xs text-[#C4D5EB] font-reading leading-relaxed font-light">
              Receive verified study materials, lecture summaries, UGC-NET syllabus updates, and notification alerts directly on your phone.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            <a
              href={SOCIAL_LINKS.whatsappChannelEnglish}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-sans font-medium transition-all shadow-sm flex items-center justify-center gap-2 min-h-[42px]"
            >
              <MessageCircle className="w-4 h-4" />
              <span>NETVidya English Channel</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </a>

            <a
              href={SOCIAL_LINKS.whatsappChannelEducation}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 rounded-xl bg-[#1E3B63] hover:bg-[#284E82] text-[#E0FBFC] text-xs font-sans font-medium border border-[#3E659A] transition-all flex items-center justify-center gap-2 min-h-[42px]"
            >
              <MessageCircle className="w-4 h-4" />
              <span>NETVidya Education Channel</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </a>
          </div>
        </div>
      </section>

    </div>
  );
};
