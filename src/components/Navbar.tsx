import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  X,
  ChevronDown,
  Download,
  KeyRound,
  ShieldCheck,
  ExternalLink,
  GraduationCap,
  BookOpen,
  Layers,
  Sparkles,
  Users,
  Mail,
  FileText,
  ChevronRight,
  Shield
} from 'lucide-react';
import { PROFESSOR_INFO, SOCIAL_LINKS } from '../data/professorData';
import { useScholarSession } from '../hooks/useScholarSession';
import { useSiteContent } from '../contexts/SiteContentContext';
import { ProfessorCrestIcon } from './common/ProfessorCrestIcon';

export type MainTab =
  | 'home'
  | 'about'
  | 'research'
  | 'publications'
  | 'talks'
  | 'communities'
  | 'learn'
  | 'contact'
  | 'bookstore';

export interface NavItemConfig {
  id: MainTab;
  label: string;
  subtabs?: { id: string; label: string }[];
}

export const MAIN_NAV_ITEMS: NavItemConfig[] = [
  { id: 'home', label: 'Home' },
  {
    id: 'about',
    label: 'About',
    subtabs: [
      { id: 'bio', label: 'Bio (Short & Long)' },
      { id: 'career', label: 'Career Journey (2007–Now)' },
      { id: 'qualifications', label: 'Qualifications' },
      { id: 'roles', label: 'Academic Roles' },
      { id: 'recognition', label: 'Recognition' },
      { id: 'cv', label: 'Curriculum Vitae' }
    ]
  },
  {
    id: 'research',
    label: 'Research',
    subtabs: [
      { id: 'interests', label: 'Research Interests' },
      { id: 'projects', label: 'Ongoing Projects' },
      { id: 'grants', label: 'Grants & Funding' },
      { id: 'ids', label: 'Research IDs (ORCID, Scholar)' }
    ]
  },
  {
    id: 'publications',
    label: 'Publications',
    subtabs: [
      { id: 'papers', label: 'Research Papers (APA 7)' },
      { id: 'authored', label: 'Authored Books' },
      { id: 'edited', label: 'Edited Books' },
      { id: 'chapters', label: 'Book Chapters' },
      { id: 'conferences', label: 'Conference Papers' },
      { id: 'calls', label: 'Calls for Chapters' }
    ]
  },
  {
    id: 'talks',
    label: 'Talks & Events',
    subtabs: [
      { id: 'lectures', label: 'Invited Lectures' },
      { id: 'conferences-chaired', label: 'Conferences (Chaired)' },
      { id: 'events-organised', label: 'Events Organised' },
      { id: 'media', label: 'Media & Press' },
      { id: 'gallery', label: 'Photo Gallery' }
    ]
  },
  {
    id: 'communities',
    label: 'Communities & Initiatives',
    subtabs: [
      { id: 'associations', label: 'Associations I Lead (ELEF)' },
      { id: 'centres', label: 'Centres I Coordinate (CAIELE, RDC)' },
      { id: 'memberships', label: 'Memberships (ELTAI, CTE)' },
      { id: 'institutional-publications', label: 'Institutional Publications' },
      { id: 'mous', label: 'MoUs & Collaborations' }
    ]
  },
  {
    id: 'learn',
    label: 'Learn',
    subtabs: [
      { id: 'ugc-net-english', label: 'UGC NET English' },
      { id: 'ugc-net-education', label: 'UGC NET Education' },
      { id: 'gujarat-tet', label: 'Gujarat TET (In Prep)' },
      { id: 'books', label: 'Books (With Buy Links)' },
      { id: 'free-resources', label: 'Free Resources & Official Links' },
      { id: 'ai-tutor', label: 'AI Tutor' },
      { id: 'blog', label: 'Pedagogy Blog' }
    ]
  },
  {
    id: 'contact',
    label: 'Contact',
    subtabs: [
      { id: 'speaker', label: 'Invite Me as Speaker' },
      { id: 'collaborate', label: 'Collaborate' },
      { id: 'form', label: 'Contact Form' }
    ]
  }
];

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
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { session } = useScholarSession();
  const { openStudio, profile } = useSiteContent();

  const isScholarActive = Boolean(
    session.unlockedItems && session.unlockedItems.length > 0 && session.mobile
  );

  const handleNavClick = (tabId: MainTab, subId?: string) => {
    setActiveTab(tabId, subId);
    setMobileMenuOpen(false);
    setOpenDropdown(null);
  };

  const handleMouseEnter = (tabId: string) => {
    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    setOpenDropdown(tabId);
  };

  const handleMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 150);
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
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#FAF9F5]/98 backdrop-blur-md border-b border-deckle transition-all shadow-xs">
        
        {/* ROW 1: Brand Identity & Utility Bar */}
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-3">
          
          {/* Brand Logo & Name */}
          <button
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2.5 sm:gap-3 text-left group shrink-0 py-1"
          >
            <ProfessorCrestIcon className="w-9 h-9 sm:w-10 sm:h-10 shrink-0" />
            <div className="min-w-0 pr-1">
              <h1 className="font-serif text-sm sm:text-base font-semibold text-ink group-hover:text-claret transition-colors leading-tight truncate">
                {profile.name || PROFESSOR_INFO.name}
              </h1>
              <p className="text-[10px] sm:text-[11px] font-mono text-ink-muted font-normal tracking-wide truncate max-w-[170px] sm:max-w-none">
                Assistant Professor • {profile.institution || PROFESSOR_INFO.institution}
              </p>
            </div>
          </button>

          {/* Social Links (Same-Color Icons as per brief) & Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Social Media Cluster (Desktop) */}
            <div className="hidden xl:flex items-center gap-1.5 px-2 py-1 rounded-xl bg-parchment-warm/70 border border-deckle text-ink-muted text-xs">
              <a
                href={SOCIAL_LINKS.youtubeNetVidya}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded-lg hover:text-claret hover:bg-white transition-colors"
                title="YouTube: NETVidya English"
                aria-label="YouTube Channel"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>

              <a
                href={SOCIAL_LINKS.instagramPersonal}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded-lg hover:text-claret hover:bg-white transition-colors"
                title="Instagram: @drrajnikantdodiya"
                aria-label="Instagram Profile"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>

              <a
                href={SOCIAL_LINKS.whatsappChannelEnglish}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded-lg hover:text-claret hover:bg-white transition-colors"
                title="WhatsApp Channel (NETVidya English)"
                aria-label="WhatsApp Channel"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.072-2.128-.521-1.615-.67-2.66-2.307-2.74-2.414-.08-.107-.649-.864-.649-1.65 0-.786.409-1.174.554-1.334.145-.16.319-.2.426-.2.106 0 .213 0 .307.006.101.005.234-.038.366.28.139.333.473 1.154.514 1.238.04.085.067.185.011.296-.056.111-.085.18-.168.277-.083.097-.175.217-.25.291-.083.082-.17.172-.073.339.097.166.432.714.928 1.155.638.568 1.177.744 1.344.827.167.083.266.069.366-.046.101-.115.433-.505.549-.677.116-.173.232-.144.39-.086.158.058 1.002.472 1.175.558.173.086.289.129.332.202.043.073.043.424-.101.829z"/>
                </svg>
              </a>

              <a
                href={SOCIAL_LINKS.linkedin}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded-lg hover:text-claret hover:bg-white transition-colors"
                title="LinkedIn Profile"
                aria-label="LinkedIn"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>
            </div>

            {/* BUTTON 0: [Academic Bookstore] - Desktop only to declutter mobile/tablet header */}
            <button
              onClick={() => handleNavClick('bookstore')}
              className={`hidden lg:flex px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-sans font-medium transition-all items-center gap-1.5 shadow-2xs shrink-0 min-h-[38px] ${
                activeTab === 'bookstore'
                  ? 'bg-claret text-white border border-claret-dark shadow-xs'
                  : 'bg-white hover:bg-parchment-warm border border-deckle hover:border-claret text-ink hover:text-claret'
              }`}
              title="Official Academic Bookstore & Study Passes"
            >
              <BookOpen className="w-3.5 h-3.5 text-claret" />
              <span className="font-serif">Bookstore</span>
            </button>

            {/* BUTTON 1: [Download CV] - Desktop only to preserve mobile breathing room */}
            <button
              onClick={onOpenCompendium}
              className="hidden lg:flex px-2.5 sm:px-3 py-1.5 rounded-xl bg-white border border-deckle hover:border-claret text-xs font-sans font-medium text-ink-muted hover:text-claret transition-all items-center gap-1.5 shadow-2xs shrink-0 min-h-[38px]"
              title="View or Download Dr. Dodiya's Curriculum Vitae"
            >
              <Download className="w-3.5 h-3.5 text-claret" />
              <span>Download CV</span>
            </button>

            {/* BUTTON 2: [Student Login] */}
            {onOpenAuthModal && (
              isScholarActive ? (
                <button
                  onClick={onOpenAuthModal}
                  className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-300 text-xs font-mono text-emerald-900 font-semibold hover:bg-emerald-100 transition-all flex items-center gap-1.5 shadow-2xs shrink-0 h-10 min-h-[40px]"
                  title="View your active student pass"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="truncate max-w-[85px] sm:max-w-[110px]">{session.name}</span>
                </button>
              ) : (
                <button
                  onClick={onOpenAuthModal}
                  className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-claret hover:bg-claret-light text-white text-xs font-sans font-medium transition-all flex items-center gap-1.5 shadow-xs shrink-0 h-10 min-h-[40px]"
                  title="Sign in with your verified WhatsApp number"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Student Login</span>
                  <span className="sm:hidden">Login</span>
                </button>
              )
            )}

            {/* BUTTON 3: [🏛️ Author Studio] */}
            <button
              onClick={openStudio}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-claret-soft hover:bg-claret hover:text-white border border-claret/30 text-claret text-xs font-serif font-semibold transition-all flex items-center gap-1.5 shadow-2xs shrink-0 h-10 min-h-[40px]"
              title="Dedicated Author Studio for Dr. Rajnikant Dodiya"
            >
              <Shield className="w-3.5 h-3.5 text-brass shrink-0" />
              <span className="hidden sm:inline">Studio</span>
            </button>

            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(prev => !prev)}
              className="lg:hidden p-2 rounded-xl bg-parchment-warm border border-deckle text-ink-muted hover:text-ink transition-colors h-10 w-10 min-h-[40px] min-w-[40px] flex items-center justify-center shrink-0"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-claret" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* ROW 2: Primary 8-Tab Desktop Navigation with Dropdowns */}
        <div className="hidden lg:block border-t border-deckle/60 bg-[#FAF9F5]/90">
          <nav
            aria-label="Main Menu"
            className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between"
          >
            <div className="flex items-center gap-0.5 xl:gap-1 py-1">
              {MAIN_NAV_ITEMS.map((item) => {
                const isActive = activeTab === item.id;
                const hasSubtabs = item.subtabs && item.subtabs.length > 0;
                const isDropdownOpen = openDropdown === item.id;

                return (
                  <div
                    key={item.id}
                    className="relative"
                    onMouseEnter={() => hasSubtabs && handleMouseEnter(item.id)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <button
                      onClick={() => handleNavClick(item.id)}
                      className={`px-2.5 xl:px-3 py-2 rounded-lg text-xs xl:text-[13px] font-sans transition-all flex items-center gap-1 whitespace-nowrap min-h-[38px] ${
                        isActive
                          ? 'bg-claret text-white font-medium shadow-xs'
                          : 'text-ink-muted hover:text-ink hover:bg-parchment-deep/50'
                      }`}
                    >
                      <span>{item.label}</span>
                      {hasSubtabs && (
                        <ChevronDown className={`w-3 h-3 transition-transform opacity-70 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                      )}
                    </button>

                    {/* Dropdown Menu */}
                    {hasSubtabs && isDropdownOpen && (
                      <div
                        className="absolute left-0 top-full z-50 min-w-[220px] p-1.5 rounded-2xl bg-white shadow-xl border border-deckle space-y-0.5 animate-fade-in text-left"
                        onMouseEnter={() => handleMouseEnter(item.id)}
                        onMouseLeave={handleMouseLeave}
                      >
                        {item.subtabs!.map((sub) => (
                          <button
                            key={sub.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNavClick(item.id, sub.id);
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl text-xs font-sans text-ink-muted hover:text-claret hover:bg-parchment-warm/70 transition-colors flex items-center justify-between group"
                          >
                            <span>{sub.label}</span>
                            <span className="text-[10px] text-ink-faint opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </nav>
        </div>

        {/* ===================================================== */}
        {/* MOBILE COLLAPSIBLE DRAWER (8 TABS + ACCORDIONS)       */}
        {/* ===================================================== */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-deckle bg-white/98 backdrop-blur-lg px-4 py-4 max-h-[calc(100dvh-130px)] pb-24 overflow-y-auto space-y-4 animate-fade-in shadow-2xl">
            
            {/* Quick Actions in Mobile Drawer */}
            <div className="grid grid-cols-2 gap-2 pb-3 border-b border-deckle">
              <button
                onClick={() => { setMobileMenuOpen(false); onOpenCompendium(); }}
                className="py-2.5 px-3 rounded-xl bg-parchment-warm border border-deckle text-xs font-sans font-medium text-claret flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download CV</span>
              </button>
              {onOpenAuthModal && (
                <button
                  onClick={() => { setMobileMenuOpen(false); onOpenAuthModal(); }}
                  className="py-2.5 px-3 rounded-xl bg-claret text-white text-xs font-sans font-medium flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>{isScholarActive ? 'My Pass' : 'Student Login'}</span>
                </button>
              )}
            </div>

            {/* Featured Academic Bookstore Card in Mobile Drawer */}
            <button
              onClick={() => handleNavClick('bookstore')}
              className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                activeTab === 'bookstore'
                  ? 'bg-claret text-white border-claret-dark shadow-xs'
                  : 'bg-parchment-warm/70 border-deckle hover:border-claret text-ink shadow-2xs'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl ${activeTab === 'bookstore' ? 'bg-white/20 text-white' : 'bg-claret-soft text-claret'}`}>
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-serif text-sm font-semibold block leading-tight">Academic Bookstore</span>
                  <span className={`text-[10px] font-mono ${activeTab === 'bookstore' ? 'text-brass' : 'text-ink-muted'}`}>
                    Study Passes • CBT Simulator • Books
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 opacity-70" />
            </button>

            {/* Main Tabs Accordion List */}
            <nav className="space-y-1">
              {MAIN_NAV_ITEMS.map((item) => {
                const isActive = activeTab === item.id;
                const hasSubtabs = item.subtabs && item.subtabs.length > 0;
                const isExpanded = openDropdown === item.id;

                return (
                  <div key={item.id} className="rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => handleNavClick(item.id)}
                        className={`flex-1 text-left px-3.5 py-2.5 rounded-xl text-sm font-sans transition-colors ${
                          isActive
                            ? 'bg-claret text-white font-medium'
                            : 'text-ink-muted hover:text-ink hover:bg-parchment-warm'
                        }`}
                      >
                        {item.label}
                      </button>

                      {hasSubtabs && (
                        <button
                          onClick={() => setOpenDropdown(isExpanded ? null : item.id)}
                          className="p-2.5 text-ink-muted hover:text-claret"
                          aria-label={`Toggle subtabs for ${item.label}`}
                        >
                          <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                      )}
                    </div>

                    {/* Subtabs Drawer */}
                    {hasSubtabs && isExpanded && (
                      <div className="pl-4 pr-2 py-1 space-y-1 bg-parchment-warm/40 rounded-b-xl">
                        {item.subtabs!.map((sub) => (
                          <button
                            key={sub.id}
                            onClick={() => handleNavClick(item.id, sub.id)}
                            className="w-full text-left py-1.5 px-3 rounded-lg text-xs font-sans text-ink-muted hover:text-claret transition-colors"
                          >
                            • {sub.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            {/* Professor Studio Button in Mobile Drawer */}
            <div className="pt-2 border-t border-deckle">
              <button
                onClick={() => { setMobileMenuOpen(false); openStudio(); }}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-claret to-claret-light text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs min-h-[44px]"
              >
                <Shield className="w-4 h-4 text-brass" />
                <span>🏛️ Professor Studio (Themes & Content)</span>
              </button>
            </div>

            {/* Social Channels in Mobile Menu */}
            <div className="pt-3 border-t border-deckle space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-ink-faint block font-semibold">
                Official Channels:
              </span>
              <div className="flex flex-wrap gap-2 text-xs font-sans">
                <a
                  href={SOCIAL_LINKS.youtubeNetVidya}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1.5 rounded-lg bg-parchment-warm border border-deckle text-ink-muted hover:text-claret"
                >
                  YouTube (NETVidya)
                </a>
                <a
                  href={SOCIAL_LINKS.whatsappChannelEnglish}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1.5 rounded-lg bg-parchment-warm border border-deckle text-ink-muted hover:text-claret"
                >
                  WhatsApp Channel (English)
                </a>
                <a
                  href={SOCIAL_LINKS.whatsappChannelEducation}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1.5 rounded-lg bg-parchment-warm border border-deckle text-ink-muted hover:text-claret"
                >
                  WhatsApp Channel (Education)
                </a>
              </div>
            </div>

          </div>
        )}
      </header>

      {/* ========================================================= */}
      {/* MOBILE THUMB-ERGONOMIC BOTTOM NAVIGATION BAR             */}
      {/* ========================================================= */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FAF9F5]/96 backdrop-blur-xl border-t border-deckle/80 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] min-h-[64px] pb-[max(env(safe-area-inset-bottom),0.625rem)] pt-1 px-1 flex items-stretch justify-between"
      >
        <button
          onClick={() => handleNavClick('home')}
          className="flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all"
          aria-label="Navigate to Home"
        >
          <span className={`p-1 rounded-xl transition-all flex items-center justify-center ${
            activeTab === 'home' ? 'bg-claret/10 text-claret' : 'text-ink-muted'
          }`}>
            <ProfessorCrestIcon className="w-5 h-5" />
          </span>
          <span className={`text-[10px] font-sans transition-colors ${
            activeTab === 'home' ? 'text-claret font-bold' : 'text-ink-muted font-normal'
          }`}>
            Home
          </span>
        </button>

        <button
          onClick={() => handleNavClick('about')}
          className="flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all"
          aria-label="Navigate to About"
        >
          <span className={`p-1 rounded-xl transition-all flex items-center justify-center ${
            activeTab === 'about' ? 'bg-claret/10 text-claret' : 'text-ink-muted'
          }`}>
            <GraduationCap className="w-5 h-5" />
          </span>
          <span className={`text-[10px] font-sans transition-colors ${
            activeTab === 'about' ? 'text-claret font-bold' : 'text-ink-muted font-normal'
          }`}>
            About
          </span>
        </button>

        <button
          onClick={() => handleNavClick('bookstore')}
          className="flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all"
          aria-label="Navigate to Official Academic Bookstore"
        >
          <span className={`p-1 rounded-xl transition-all flex items-center justify-center ${
            activeTab === 'bookstore' ? 'bg-claret/10 text-claret' : 'text-ink-muted'
          }`}>
            <BookOpen className="w-5 h-5" />
          </span>
          <span className={`text-[10px] font-sans transition-colors ${
            activeTab === 'bookstore' ? 'text-claret font-bold' : 'text-ink-muted font-normal'
          }`}>
            Store
          </span>
        </button>

        <button
          onClick={() => handleNavClick('learn')}
          className="flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all"
          aria-label="Navigate to Learn & LMS"
        >
          <span className={`p-1 rounded-xl transition-all flex items-center justify-center ${
            activeTab === 'learn' ? 'bg-claret/10 text-claret' : 'text-ink-muted'
          }`}>
            <Sparkles className="w-5 h-5" />
          </span>
          <span className={`text-[10px] font-sans transition-colors ${
            activeTab === 'learn' ? 'text-claret font-bold' : 'text-ink-muted font-normal'
          }`}>
            Learn
          </span>
        </button>

        <button
          onClick={() => setMobileMenuOpen(prev => !prev)}
          className="flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all"
          aria-label="Toggle Full Menu Drawer"
        >
          <span className={`p-1 rounded-xl transition-all flex items-center justify-center ${
            mobileMenuOpen ? 'bg-claret/10 text-claret' : 'text-ink-muted'
          }`}>
            <Menu className="w-5 h-5" />
          </span>
          <span className={`text-[10px] font-sans transition-colors ${
            mobileMenuOpen ? 'text-claret font-bold' : 'text-ink-muted font-normal'
          }`}>
            Menu
          </span>
        </button>
      </nav>
    </>
  );
};
