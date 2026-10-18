import React, { useState, useEffect } from 'react';
import { Feather, Menu, X, BookOpen, Sparkles, ChevronRight, Archive, KeyRound, ShieldCheck, Layers } from 'lucide-react';
import { PROFESSOR_INFO } from '../data/professorData';
import { useScholarSession } from '../hooks/useScholarSession';
import { ProfessorCrestIcon } from './common/ProfessorCrestIcon';

export type MainTab = 'home' | 'research' | 'salon' | 'store' | 'leadership' | 'contact' | 'about';

interface NavbarProps {
  activeTab: MainTab;
  setActiveTab: (tab: MainTab, subSection?: string) => void;
  onOpenCompendium: () => void;
  onOpenAuthModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenCompendium,
  onOpenAuthModal
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { session } = useScholarSession();

  const isScholarActive = Boolean(
    session.unlockedItems && session.unlockedItems.length > 0 && session.mobile
  );

  // 6 Primary Academic Spaces with adaptive labels for spacious, non-overlapping layouts
  const primaryNavItems: {
    id: MainTab;
    label: string;
    shortLabel: string;
    icon?: React.ReactNode;
  }[] = [
    { id: 'home', label: 'The Scholar', shortLabel: 'Scholar' },
    { id: 'research', label: 'Research & Books', shortLabel: 'Research' },
    { id: 'salon', label: 'Literary Salon', shortLabel: 'Salon', icon: <Sparkles className="w-3.5 h-3.5 text-brass shrink-0" /> },
    { id: 'store', label: 'The Atheneum', shortLabel: 'Atheneum', icon: <BookOpen className="w-3.5 h-3.5 text-brass shrink-0" /> },
    { id: 'leadership', label: 'Initiatives & Leadership', shortLabel: 'Leadership' },
    { id: 'contact', label: 'Contact', shortLabel: 'Contact' }
  ];

  const handleNavClick = (tabId: MainTab, subId?: string) => {
    setActiveTab(tabId, subId);
    setMobileMenuOpen(false);
  };

  const isTabActive = (tabId: MainTab) => {
    if (activeTab === tabId) return true;
    if (tabId === 'home' && activeTab === 'about') return true;
    return false;
  };

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  return (
    <>
      {/* ========================================================= */}
      {/* TOP DESKTOP & MOBILE HEADER                              */}
      {/* ========================================================= */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#FAF9F5]/95 backdrop-blur-md border-b border-deckle transition-all shadow-xs">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* ===================================================== */}
          {/* ZONE 1: BRAND IDENTITY (PROFESSOR CREST & NAME)       */}
          {/* ===================================================== */}
          <button
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2.5 sm:gap-3 text-left group shrink-0 py-1"
          >
            <ProfessorCrestIcon className="w-9 h-9 sm:w-10 sm:h-10 shrink-0" />
            <div className="min-w-0 pr-1">
              <h1 className="font-serif text-sm sm:text-base font-medium text-ink group-hover:text-claret transition-colors leading-tight truncate">
                {PROFESSOR_INFO.name}
              </h1>
              <p className="text-[10px] sm:text-[11px] font-mono text-ink-muted font-normal tracking-wide truncate max-w-[150px] sm:max-w-none">
                Assistant Professor • HMPIETR, SPU
              </p>
            </div>
          </button>

          {/* ===================================================== */}
          {/* ZONE 2: DESKTOP PRIMARY NAVIGATION (GUARANTEED FIT)   */}
          {/* ===================================================== */}
          <nav
            aria-label="Primary Navigation"
            className="hidden lg:flex items-center gap-1 xl:gap-1.5 2xl:gap-2 px-2 py-1 rounded-2xl bg-white/75 border border-deckle/80 shadow-2xs shrink-0"
          >
            {primaryNavItems.map((item) => {
              const active = isTabActive(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`px-2.5 xl:px-3 py-1.5 rounded-xl text-xs xl:text-[13px] 2xl:text-sm font-sans transition-all flex items-center gap-1.5 whitespace-nowrap min-h-[36px] ${
                    active
                      ? 'bg-claret text-white font-medium shadow-xs'
                      : 'text-ink-muted hover:text-ink hover:bg-parchment-deep/60'
                  }`}
                >
                  {item.icon}
                  <span className="hidden 2xl:inline">{item.label}</span>
                  <span className="2xl:hidden">{item.shortLabel}</span>
                </button>
              );
            })}
          </nav>

          {/* ===================================================== */}
          {/* ZONE 3: DESKTOP ACTION CONTROLS (NEVER CUT OFF)       */}
          {/* ===================================================== */}
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            {/* Scholar Sign-In / Active Pass Button */}
            {onOpenAuthModal && (
              isScholarActive ? (
                <button
                  onClick={onOpenAuthModal}
                  className="px-2.5 xl:px-3 py-1.5 rounded-xl bg-claret-soft border border-claret/30 text-xs font-mono text-claret font-semibold hover:bg-claret hover:text-white transition-all flex items-center gap-1.5 shadow-2xs whitespace-nowrap min-h-[36px]"
                  title="View your active scholar pass & holdings on this personal device"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span className="truncate max-w-[85px] xl:max-w-[110px]">{session.name}</span>
                  <span className="text-[10px] opacity-75 font-normal hidden 2xl:inline">(1-Device)</span>
                </button>
              ) : (
                <button
                  onClick={onOpenAuthModal}
                  className="px-2.5 xl:px-3 py-1.5 rounded-xl bg-white border border-deckle hover:border-claret text-xs font-sans font-medium text-ink-muted hover:text-claret transition-all flex items-center gap-1.5 shadow-2xs whitespace-nowrap min-h-[36px]"
                  title="Sign in to access your purchased books and CBT exams on this device"
                >
                  <KeyRound className="w-3.5 h-3.5 text-claret shrink-0" />
                  <span className="hidden 2xl:inline">Free Pass / Sign In</span>
                  <span className="2xl:hidden">Sign In</span>
                </button>
              )
            )}

            {/* Academic Archive Compendium Button */}
            <button
              onClick={onOpenCompendium}
              className="px-2.5 xl:px-3 py-1.5 rounded-xl bg-white border border-deckle hover:border-claret text-xs font-sans font-medium text-ink-muted hover:text-claret transition-all flex items-center gap-1.5 shadow-2xs whitespace-nowrap min-h-[36px]"
              title="Open comprehensive accreditation qualifications and lecture records"
            >
              <Archive className="w-3.5 h-3.5 text-claret shrink-0" />
              <span className="hidden 2xl:inline">Academic Archive</span>
              <span className="2xl:hidden">Archive</span>
            </button>
          </div>

          {/* ===================================================== */}
          {/* MOBILE HEADER CONTROLS (< 1024px)                     */}
          {/* ===================================================== */}
          <div className="flex items-center gap-2 lg:hidden shrink-0">
            {/* Tablet-only Archive Icon Shortcut (sm to lg) */}
            <button
              onClick={onOpenCompendium}
              className="hidden sm:flex p-2 rounded-xl bg-white border border-deckle text-xs text-claret font-medium items-center gap-1 min-h-[40px] shadow-2xs"
              title="Academic Archive"
            >
              <Archive className="w-4 h-4" />
              <span className="hidden md:inline text-xs font-sans">Archive</span>
            </button>

            {/* Scholar Active Pass Indicator Badge on Mobile */}
            {onOpenAuthModal && isScholarActive && (
              <button
                onClick={onOpenAuthModal}
                className="px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-300 text-xs font-mono text-emerald-900 font-bold flex items-center gap-1.5 min-h-[38px] shadow-2xs shrink-0"
                title="Active Scholar Pass"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse shrink-0" />
                <span className="text-[11px] truncate max-w-[65px]">{session.name.split(' ')[0]}</span>
              </button>
            )}

            {/* Hamburger Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl bg-white border border-deckle text-ink-muted hover:text-ink min-h-[40px] min-w-[40px] flex items-center justify-center shadow-2xs transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-claret" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>

        {/* ===================================================== */}
        {/* MOBILE SLIDE-DOWN DRAWER MENU                         */}
        {/* ===================================================== */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-deckle bg-white/98 backdrop-blur-xl px-4 py-5 space-y-4 shadow-book-lg animate-fade-in max-h-[calc(100vh-5rem)] overflow-y-auto">
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-ink-faint uppercase tracking-wider block px-3 py-1 font-semibold">
                Academic Spaces
              </span>
              {primaryNavItems.map((item) => {
                const active = isTabActive(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-sans transition-all flex items-center justify-between min-h-[44px] ${
                      active
                        ? 'bg-claret text-white font-medium shadow-xs'
                        : 'text-ink-muted hover:bg-parchment-warm hover:text-ink'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      {item.icon}
                      <span>{item.label}</span>
                    </span>
                    <ChevronRight className="w-4 h-4 opacity-50" />
                  </button>
                );
              })}
            </div>

            {/* Secondary Action Drawer Links */}
            <div className="pt-3 border-t border-deckle space-y-2">
              <span className="text-[10px] font-mono text-ink-faint uppercase tracking-wider block px-3 py-1 font-semibold">
                Scholar Services & Accreditation
              </span>

              {onOpenAuthModal && (
                <button
                  onClick={() => { setMobileMenuOpen(false); onOpenAuthModal(); }}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl border text-xs font-sans font-medium flex items-center justify-between min-h-[44px] ${
                    isScholarActive
                      ? 'bg-claret-soft border-claret text-claret font-semibold'
                      : 'bg-white border-deckle text-ink'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    {isScholarActive ? <ShieldCheck className="w-4 h-4 text-emerald-600" /> : <KeyRound className="w-4 h-4 text-claret" />}
                    <span>{isScholarActive ? `Active Scholar Pass: ${session.name}` : 'Scholar Sign-In (Access Books & Exams)'}</span>
                  </span>
                  <ChevronRight className="w-4 h-4 opacity-60" />
                </button>
              )}

              <button
                onClick={() => { setMobileMenuOpen(false); onOpenCompendium(); }}
                className="w-full text-left px-3.5 py-2.5 rounded-xl bg-parchment-warm border border-deckle text-xs font-sans text-claret font-medium flex items-center justify-between min-h-[44px]"
              >
                <span className="flex items-center gap-2.5">
                  <Archive className="w-4 h-4" />
                  <span>Academic Compendium (Degrees, Talks, FDP)</span>
                </span>
                <ChevronRight className="w-4 h-4 text-claret" />
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ========================================================= */}
      {/* MOBILE THUMB-ERGONOMIC BOTTOM NAVIGATION BAR             */}
      {/* ========================================================= */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FAF9F5]/95 backdrop-blur-md border-t border-deckle px-3 py-1.5 flex items-center justify-around shadow-book pb-[max(env(safe-area-inset-bottom),0.5rem)]"
      >
        <button
          onClick={() => handleNavClick('home')}
          className={`flex flex-col items-center justify-center p-1 rounded-xl transition-all min-w-[50px] min-h-[44px] ${
            isTabActive('home') ? 'text-claret font-bold' : 'text-ink-muted hover:text-ink'
          }`}
        >
          <Feather className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] font-sans">Scholar</span>
        </button>

        <button
          onClick={() => handleNavClick('research')}
          className={`flex flex-col items-center justify-center p-1 rounded-xl transition-all min-w-[50px] min-h-[44px] ${
            isTabActive('research') ? 'text-claret font-bold' : 'text-ink-muted hover:text-ink'
          }`}
        >
          <Layers className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] font-sans">Research</span>
        </button>

        <button
          onClick={() => handleNavClick('salon')}
          className={`flex flex-col items-center justify-center p-1 rounded-xl transition-all min-w-[50px] min-h-[44px] ${
            isTabActive('salon') ? 'text-claret font-bold' : 'text-ink-muted hover:text-ink'
          }`}
        >
          <Sparkles className="w-4 h-4 mb-0.5 text-brass" />
          <span className="text-[10px] font-sans">Salon</span>
        </button>

        <button
          onClick={() => handleNavClick('store')}
          className={`flex flex-col items-center justify-center p-1 rounded-xl transition-all min-w-[50px] min-h-[44px] ${
            isTabActive('store') ? 'text-claret font-bold' : 'text-ink-muted hover:text-ink'
          }`}
        >
          <BookOpen className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] font-sans">Atheneum</span>
        </button>

        {onOpenAuthModal && (
          <button
            onClick={onOpenAuthModal}
            className={`flex flex-col items-center justify-center p-1 rounded-xl transition-all min-w-[50px] min-h-[44px] ${
              isScholarActive ? 'text-emerald-700 font-bold' : 'text-ink-muted hover:text-ink'
            }`}
          >
            {isScholarActive ? (
              <ShieldCheck className="w-4 h-4 mb-0.5 text-emerald-600" />
            ) : (
              <KeyRound className="w-4 h-4 mb-0.5 text-claret" />
            )}
            <span className="text-[10px] font-sans truncate max-w-[50px]">
              {isScholarActive ? 'Pass' : 'Sign In'}
            </span>
          </button>
        )}
      </nav>
    </>
  );
};
