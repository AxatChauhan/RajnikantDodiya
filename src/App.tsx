import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Navbar, MainTab } from './components/Navbar';
import { HomePage } from './components/HomePage';
import { useScholarSession } from './hooks/useScholarSession';
import { PROFESSOR_INFO, SOCIAL_LINKS } from './data/professorData';
import { Feather, ExternalLink, Archive, Download, UserCheck, Shield, Sparkles } from 'lucide-react';
import { AcademicErrorBoundary } from './components/common/AcademicErrorBoundary';
import { handleGoogleAuthRedirect } from './lib/googleAuth';
import { SiteContentProvider, useSiteContent } from './contexts/SiteContentContext';

// Lazily loaded 8 main tab views (Optimized for instant Initial Paint)
const AboutPage = lazy(() => import('./components/AboutPage').then(m => ({ default: m.AboutPage })));
const ResearchPage = lazy(() => import('./components/ResearchPage').then(m => ({ default: m.ResearchPage })));
const PublicationsPage = lazy(() => import('./components/PublicationsPage').then(m => ({ default: m.PublicationsPage })));
const TalksEventsPage = lazy(() => import('./components/TalksEventsPage').then(m => ({ default: m.TalksEventsPage })));
const CommunitiesPage = lazy(() => import('./components/CommunitiesPage').then(m => ({ default: m.CommunitiesPage })));
const LearnPage = lazy(() => import('./components/LearnPage').then(m => ({ default: m.LearnPage })));
const AcademicStorePage = lazy(() => import('./components/library-store/AcademicStorePage').then(m => ({ default: m.AcademicStorePage })));
const ContactPage = lazy(() => import('./components/ContactPage').then(m => ({ default: m.ContactPage })));

// Lazily loaded standalone modals (Loaded on demand only when opened)
const AcademicCompendiumModal = lazy(() => import('./components/AcademicCompendiumModal').then(m => ({ default: m.AcademicCompendiumModal })));
const ScholarAuthModal = lazy(() => import('./components/library-store/ScholarAuthModal').then(m => ({ default: m.ScholarAuthModal })));
const DeviceTransferredModal = lazy(() => import('./components/library-store/DeviceTransferredModal').then(m => ({ default: m.DeviceTransferredModal })));
const ProtectedReaderModal = lazy(() => import('./components/library-store/ProtectedReaderModal').then(m => ({ default: m.ProtectedReaderModal })));
const ExamPortal = lazy(() => import('./components/library-store/ExamPortal').then(m => ({ default: m.ExamPortal })));
const AuthorStudioModal = lazy(() => import('./components/studio/AuthorStudioModal').then(m => ({ default: m.AuthorStudioModal })));

const AcademicLoadingFallback: React.FC = () => (
  <div className="min-h-[45vh] flex flex-col items-center justify-center p-8 space-y-3 text-center animate-fade-in">
    <div className="w-11 h-11 rounded-2xl bg-claret-soft border border-claret/30 flex items-center justify-center text-claret animate-pulse shadow-xs">
      <Feather className="w-5 h-5" />
    </div>
    <div className="space-y-1">
      <span className="text-[10px] font-mono uppercase tracking-widest text-claret font-bold">
        HMPIETR • Sardar Patel University
      </span>
      <p className="font-serif text-base text-ink">Loading Academic Profile...</p>
    </div>
  </div>
);

function AppInner() {
  const [activeTab, setActiveTab] = useState<MainTab>('home');
  const [activeSubSection, setActiveSubSection] = useState<string | undefined>(undefined);
  const [isCompendiumOpen, setIsCompendiumOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isReaderOpen, setIsReaderOpen] = useState(false);
  const [isExamOpen, setIsExamOpen] = useState(false);

  const { session, sessionTransferred, setSessionTransferred, isBookOwned, isExamOwned, isComplimentaryOwned } = useScholarSession();
  const { alertBanner, layoutSettings, openStudio, profile } = useSiteContent();

  const handleNavigate = (tab: MainTab, subSection?: string) => {
    setActiveTab(tab);
    setActiveSubSection(subSection);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    handleGoogleAuthRedirect();
  }, []);

  // Keyboard shortcut for Author Studio: Ctrl + Shift + S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        openStudio();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openStudio]);

  useEffect(() => {
    const tabTitles: Record<MainTab, string> = {
      home: `${profile.name || PROFESSOR_INFO.name} | Assistant Professor & Academic Researcher`,
      about: `About Dr. Rajnikant Dodiya | ${profile.name || PROFESSOR_INFO.name}`,
      research: `Research | ${profile.name || PROFESSOR_INFO.name}`,
      publications: `Publications & Books | ${profile.name || PROFESSOR_INFO.name}`,
      talks: `Talks & Events | ${profile.name || PROFESSOR_INFO.name}`,
      communities: `Communities & Initiatives | ${profile.name || PROFESSOR_INFO.name}`,
      learn: `Learn & Study Hub | ${profile.name || PROFESSOR_INFO.name}`,
      bookstore: `Academic Bookstore & Study Passes | ${profile.name || PROFESSOR_INFO.name}`,
      contact: `Contact & Collaboration | ${profile.name || PROFESSOR_INFO.name}`
    };
    document.title = tabTitles[activeTab] || `${profile.name || PROFESSOR_INFO.name} | Assistant Professor & Academic Researcher`;
  }, [activeTab, profile.name]);

  useEffect(() => {
    if (activeSubSection) {
      setTimeout(() => {
        const el = document.getElementById(activeSubSection);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, [activeTab, activeSubSection]);

  return (
    <div className="min-h-screen text-ink font-sans relative selection:bg-claret selection:text-white pb-24 lg:pb-20">
      
      {/* 8-Tab Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleNavigate}
        onOpenCompendium={() => setIsCompendiumOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Main Container */}
      <main className={`max-w-7xl mx-auto px-3 sm:px-6 md:px-8 min-h-[75vh] ${
        layoutSettings?.showEmergencyAlert && alertBanner?.enabled
          ? 'pt-28 sm:pt-32 lg:pt-40'
          : 'pt-20 sm:pt-24 lg:pt-36'
      }`}>
        <AcademicErrorBoundary fallbackTitle="Academic Section Interrupted">
          <Suspense fallback={<AcademicLoadingFallback />}>
            {activeTab === 'home' && (
              <HomePage
                onNavigate={handleNavigate}
                onOpenCompendium={() => setIsCompendiumOpen(true)}
              />
            )}
            {activeTab === 'about' && (
              <AboutPage
                subSection={activeSubSection}
                onOpenCompendium={() => setIsCompendiumOpen(true)}
              />
            )}
            {activeTab === 'research' && (
              <ResearchPage
                subSection={activeSubSection}
                onNavigate={handleNavigate}
              />
            )}
            {activeTab === 'publications' && (
              <PublicationsPage
                subSection={activeSubSection}
                onNavigate={handleNavigate}
              />
            )}
            {activeTab === 'talks' && (
              <TalksEventsPage
                subSection={activeSubSection}
                onNavigate={handleNavigate}
              />
            )}
            {activeTab === 'communities' && (
              <CommunitiesPage
                subSection={activeSubSection}
                onNavigate={handleNavigate}
              />
            )}
            {activeTab === 'learn' && (
              <LearnPage
                subSection={activeSubSection}
                onOpenAuthModal={() => setIsAuthModalOpen(true)}
                onNavigate={handleNavigate}
              />
            )}
            {activeTab === 'bookstore' && (
              <AcademicStorePage
                onOpenAuthModal={() => setIsAuthModalOpen(true)}
                onNavigate={handleNavigate}
              />
            )}
            {activeTab === 'contact' && (
              <ContactPage subSection={activeSubSection} />
            )}
          </Suspense>
        </AcademicErrorBoundary>
      </main>

      {/* Global Academic Profile & CV Modal */}
      {isCompendiumOpen && (
        <Suspense fallback={null}>
          <AcademicCompendiumModal
            isOpen={isCompendiumOpen}
            onClose={() => setIsCompendiumOpen(false)}
          />
        </Suspense>
      )}

      {/* Global Student Sign-In & Single-Device Pass Modal */}
      {isAuthModalOpen && (
        <Suspense fallback={null}>
          <ScholarAuthModal
            isOpen={isAuthModalOpen}
            onClose={() => setIsAuthModalOpen(false)}
            onOpenReader={() => setIsReaderOpen(true)}
            onOpenExam={() => setIsExamOpen(true)}
          />
        </Suspense>
      )}

      {/* Security Eviction Notice: Session Transferred to Another Device */}
      {sessionTransferred && (
        <Suspense fallback={null}>
          <DeviceTransferredModal
            isOpen={sessionTransferred}
            onClose={() => setSessionTransferred(false)}
            onReLogin={() => {
              setSessionTransferred(false);
              setIsAuthModalOpen(true);
            }}
          />
        </Suspense>
      )}

      {/* Global Protected Reader Modal */}
      {(isBookOwned || isComplimentaryOwned) && isReaderOpen && (
        <Suspense fallback={null}>
          <ProtectedReaderModal
            isOpen={isReaderOpen}
            onClose={() => setIsReaderOpen(false)}
            studentName={session.name}
            studentMobile={session.mobile}
            orderId={session.orderId}
            isUnlocked={true}
          />
        </Suspense>
      )}

      {/* Global UGC-NET CBT Exam Portal */}
      {isExamOwned && isExamOpen && (
        <Suspense fallback={null}>
          <ExamPortal
            isOpen={isExamOpen}
            onClose={() => setIsExamOpen(false)}
            studentName={session.name}
            orderId={session.orderId}
            isUnlocked={true}
          />
        </Suspense>
      )}

      {/* Global Author Studio Modal (Air-gapped Master Gateway) */}
      <Suspense fallback={null}>
        <AuthorStudioModal />
      </Suspense>

      {/* Academic Footer */}
      <footer className="max-w-7xl mx-auto px-4 md:px-8 mt-20 sm:mt-28 pt-8 border-t border-deckle space-y-4 text-xs text-ink-muted">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-2 text-center sm:text-left">
            <Feather className="w-4 h-4 text-claret shrink-0" />
            <span className="font-serif font-medium text-ink text-sm">{profile.name || PROFESSOR_INFO.name}</span>
            <span className="text-ink-faint">• Assistant Professor • {profile.institution || PROFESSOR_INFO.institution}</span>
          </div>

          {/* Social / Research Profile Links */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-[11px] font-mono text-ink-muted">
            <a
              href={`https://orcid.org/${PROFESSOR_INFO.researchProfiles.orcid}`}
              target="_blank"
              rel="noreferrer"
              className="hover:text-claret underline flex items-center gap-1"
            >
              ORCID <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href={`https://scholar.google.com/citations?user=${PROFESSOR_INFO.researchProfiles.googleScholar}`}
              target="_blank"
              rel="noreferrer"
              className="hover:text-claret underline flex items-center gap-1"
            >
              Google Scholar <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href={`https://vidwan.inflibnet.ac.in/profile/${PROFESSOR_INFO.researchProfiles.vidwan}`}
              target="_blank"
              rel="noreferrer"
              className="hover:text-claret underline flex items-center gap-1"
            >
              Vidwan <ExternalLink className="w-3 h-3" />
            </a>
            <button
              onClick={() => setIsCompendiumOpen(true)}
              className="hover:text-claret font-sans font-medium text-claret flex items-center gap-1"
            >
              <Download className="w-3 h-3" />
              <span>Download CV</span>
            </button>
            <button
              onClick={openStudio}
              className="hover:text-claret font-sans font-medium text-claret flex items-center gap-1 border border-claret/30 px-2 py-0.5 rounded-lg bg-claret-soft"
              title="Professor Studio (Ctrl+Shift+S)"
            >
              <Shield className="w-3 h-3 text-brass" />
              <span>Professor Studio</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-deckle/60 text-[11px] text-ink-faint text-center sm:text-left">
          <span>© {new Date().getFullYear()} {profile.name || PROFESSOR_INFO.name} | All Academic Rights Reserved</span>
          <span>{profile.institution || PROFESSOR_INFO.institution}, {profile.location || PROFESSOR_INFO.location}</span>
        </div>
      </footer>

    </div>
  );
}

export function App() {
  return (
    <SiteContentProvider>
      <AppInner />
    </SiteContentProvider>
  );
}
