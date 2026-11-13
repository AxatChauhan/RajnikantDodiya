import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Navbar, MainTab } from './components/Navbar';
import { HomePage } from './components/HomePage';
import { useScholarSession } from './hooks/useScholarSession';
import { PROFESSOR_INFO, SOCIAL_LINKS } from './data/professorData';
import { Feather, ExternalLink } from 'lucide-react';
import { AcademicErrorBoundary } from './components/common/AcademicErrorBoundary';
import { handleGoogleAuthRedirect } from './lib/googleAuth';
import { SiteContentProvider, useSiteContent } from './contexts/SiteContentContext';
import { NetVidyaStoreProvider } from './contexts/NetVidyaStoreContext';
import { NetVidyaWhatsAppWidget } from './components/store/NetVidyaWhatsAppWidget';
import { StorePolicyLinks, PolicyTab } from './components/common/StorePolicyLinks';
import { STORE_MERCHANT } from './config/storeConfig';

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
const NetVidyaStoreLayout = lazy(() => import('./components/store/NetVidyaStoreLayout').then(m => ({ default: m.NetVidyaStoreLayout })));
const NetVidyaPolicies = lazy(() => import('./components/store/NetVidyaPolicies').then(m => ({ default: m.NetVidyaPolicies })));

const POLICY_ROUTE_MAP: Record<string, PolicyTab> = {
  policies: 'terms',
  terms: 'terms',
  'terms-and-conditions': 'terms',
  'policies-terms': 'terms',
  privacy: 'privacy',
  'privacy-policy': 'privacy',
  'policies-privacy': 'privacy',
  refund: 'refund',
  'refund-policy': 'refund',
  'cancellation-refund': 'refund',
  'policies-refund': 'refund',
  delivery: 'delivery',
  'shipping-policy': 'delivery',
  'digital-delivery': 'delivery',
  'policies-delivery': 'delivery',
  'contact-store': 'contact',
  'policies-contact': 'contact'
};

const AcademicLoadingFallback: React.FC = () => (
  <div className="min-h-[45vh] flex flex-col items-center justify-center p-8 space-y-3 text-center animate-fade-in">
    <div className="w-11 h-11 rounded-2xl bg-claret-soft border border-claret/30 flex items-center justify-center text-claret animate-pulse shadow-xs">
      <Feather className="w-5 h-5" />
    </div>
    <div className="space-y-1">
      <span className="text-[10px] font-mono uppercase tracking-widest text-claret font-bold">
        NET Vidya English • Learning Portal
      </span>
      <p className="font-sans text-base text-ink">Loading Portal...</p>
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
  const [activePolicyTab, setActivePolicyTab] = useState<PolicyTab>('terms');
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const { session, sessionTransferred, setSessionTransferred, isBookOwned, isExamOwned, isComplimentaryOwned } = useScholarSession();
  const { alertBanner, layoutSettings, profile } = useSiteContent();

  const handleNavigate = (tab: MainTab, subSection?: string) => {
    setActiveTab(tab);
    setActiveSubSection(subSection);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenPolicyModal = (tab: PolicyTab) => {
    setActivePolicyTab(tab);
    setIsPolicyModalOpen(true);
  };

  useEffect(() => {
    handleGoogleAuthRedirect();

    const checkInitialRoute = () => {
      const isStoreHost = typeof window !== 'undefined' && window.location.hostname.startsWith('store.');
      if (isStoreHost) {
        setActiveTab('store');
        return;
      }
      if (typeof window === 'undefined') return;

      const path = window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
      const hash = window.location.hash.replace(/^#+/, '').toLowerCase();
      const route = path || hash;

      if (POLICY_ROUTE_MAP[route]) {
        setActivePolicyTab(POLICY_ROUTE_MAP[route]);
        setActiveTab('policies');
        return;
      }

      if (route === 'admin' || route === 'store-admin') {
        setActiveTab('store');
        return;
      }

      if (route === 'dashboard' || route === 'store-dashboard') {
        setActiveTab('store');
        return;
      }

      const validTabs: MainTab[] = ['home', 'about', 'research', 'publications', 'talks', 'communities', 'learn', 'bookstore', 'contact', 'store', 'policies'];
      if (validTabs.includes(route as MainTab)) {
        setActiveTab(route as MainTab);
      }
    };
    checkInitialRoute();
    window.addEventListener('hashchange', checkInitialRoute);
    window.addEventListener('popstate', checkInitialRoute);
    return () => {
      window.removeEventListener('hashchange', checkInitialRoute);
      window.removeEventListener('popstate', checkInitialRoute);
    };
  }, []);

  useEffect(() => {
    const tabTitles: Record<MainTab, string> = {
      home: `${profile.name || PROFESSOR_INFO.name} | Assistant Professor · English Language Education & NET Vidya English`,
      about: `About Dr. Rajnikant Dodiya | Academic Background, Career & CV`,
      research: `Research & Publications | Dr. Rajnikant Dodiya · APJ Abdul Kalam Monograph`,
      publications: `Published Books & Monographs | Dr. Rajnikant Dodiya (10 Books)`,
      talks: `Invited Talks & Keynotes | Dr. Rajnikant Dodiya`,
      communities: `Communities & Forums | ELEF & CAIELE · Dr. Rajnikant Dodiya`,
      learn: `Study Materials & Examination Prep | NET Vidya English`,
      bookstore: `Academic Bookstore & Study Materials | Dr. Rajnikant Dodiya`,
      contact: `Contact & Collaboration | Dr. Rajnikant Dodiya`,
      store: 'GSET + UGC NET English Final Pack 2026 | NET Vidya English by Dr. Rajnikant Dodiya',
      policies: 'Store Policies, Terms, Privacy & Refunds | NET Vidya English'
    };

    const tabDescriptions: Record<MainTab, string> = {
      home: 'Official learning portal and academic repository of Dr. Rajnikant S. Dodiya, author of 10 books, 2× UGC-NET & GSET qualified scholar, and mentor for NET Vidya English.',
      about: 'Learn about Dr. Rajnikant Dodiya, Assistant Professor of English Language Education, educational researcher, career journey from 2007, and academic credentials.',
      research: 'Explore doctoral research on APJ Abdul Kalam educational epistemology, post-method pedagogy, and peer-reviewed papers by Dr. Rajnikant Dodiya.',
      publications: 'Discover 10 authored and edited books by Dr. Rajnikant Dodiya, including monographs on Abdul Kalam and English language pedagogy.',
      talks: 'Invited lectures, academic keynotes, and national conference addresses delivered by Dr. Rajnikant Dodiya.',
      communities: 'Academic initiatives led by Dr. Rajnikant Dodiya, including the English Language Education Forum (ELEF) and CAIELE.',
      learn: 'Comprehensive UGC NET & GSET English syllabus modules, mock test papers, and learning resources by Dr. Rajnikant Dodiya.',
      bookstore: 'Browse published educational texts, monograph chapters, and research volumes authored by Dr. Rajnikant Dodiya.',
      contact: 'Get in touch with Dr. Rajnikant Dodiya for academic collaboration, lecture invitations, and NET Vidya student inquiries.',
      store: 'Enroll in the GSET + UGC NET English Final Pack 2026. 10 full NTA CBT mocks, model explanations, and revision dossiers curated by Dr. Rajnikant Dodiya.',
      policies: 'Official Terms & Conditions, Privacy Policy, Cancellation & Refund Policy, Digital Delivery Policy, and Merchant Contact for NET Vidya English.'
    };

    document.title = tabTitles[activeTab] || `${profile.name || PROFESSOR_INFO.name} | Assistant Professor & NET Vidya English`;

    // Dynamic Meta Description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && tabDescriptions[activeTab]) {
      metaDesc.setAttribute('content', tabDescriptions[activeTab]);
    }

    // Dynamic Canonical Link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    const canonicalUrl = activeTab === 'home' ? 'https://rajnikantdodiya.com/' : `https://rajnikantdodiya.com/#${activeTab}`;
    canonical.setAttribute('href', canonicalUrl);
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

  if (activeTab === 'store') {
    return (
      <Suspense fallback={<AcademicLoadingFallback />}>
        <NetVidyaStoreLayout
          onBackToAcademicSite={() => handleNavigate('home')}
          onOpenBookstore={() => handleNavigate('bookstore')}
        />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen text-ink font-sans relative selection:bg-claret selection:text-white pb-24 lg:pb-20">
      
      {/* Offline Connectivity Status Alert */}
      {!isOnline && (
        <div className="bg-amber-700 text-white text-xs font-semibold px-4 py-2 text-center flex items-center justify-center gap-2 sticky top-0 z-50 shadow-md">
          <span className="w-2 h-2 rounded-full bg-amber-300 animate-ping" />
          <span>You are currently in offline mode. Previously loaded revision notes remain accessible.</span>
        </div>
      )}

      {/* 8-Tab Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleNavigate}
        onOpenCompendium={() => setIsCompendiumOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenStore={() => handleNavigate('store')}
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
                onOpenPolicy={handleOpenPolicyModal}
              />
            )}
            {activeTab === 'contact' && (
              <ContactPage subSection={activeSubSection} />
            )}
            {activeTab === 'policies' && (
              <NetVidyaPolicies
                initialTab={activePolicyTab}
                isOpen={true}
                onClose={() => handleNavigate('home')}
              />
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
      {isReaderOpen && (
        <Suspense fallback={null}>
          <ProtectedReaderModal
            isOpen={isReaderOpen}
            onClose={() => setIsReaderOpen(false)}
            studentName={session.name || 'Registered Scholar'}
            studentMobile={session.mobile || 'Pass Active'}
            orderId={session.orderId || 'HMP-2026'}
            isUnlocked={isBookOwned}
            onUnlockRequest={() => {
              setIsReaderOpen(false);
              handleNavigate('bookstore');
            }}
          />
        </Suspense>
      )}

      {/* Global UGC-NET CBT Exam Portal */}
      {isExamOpen && (
        <Suspense fallback={null}>
          <ExamPortal
            isOpen={isExamOpen}
            onClose={() => setIsExamOpen(false)}
            studentName={session.name || 'Candidate'}
            orderId={session.orderId || 'HMP-2026'}
            isUnlocked={isExamOwned}
            onUnlockRequest={() => {
              setIsExamOpen(false);
              handleNavigate('bookstore');
            }}
          />
        </Suspense>
      )}

      {/* Global Author Studio Modal (Air-gapped Master Gateway) */}
      <Suspense fallback={null}>
        <AuthorStudioModal />
      </Suspense>

      {/* Global Store Policies Modal (Centralized Legal & Razorpay Compliance Viewer) */}
      {isPolicyModalOpen && (
        <Suspense fallback={null}>
          <NetVidyaPolicies
            initialTab={activePolicyTab}
            isOpen={isPolicyModalOpen}
            asModal={true}
            onClose={() => setIsPolicyModalOpen(false)}
          />
        </Suspense>
      )}

      {/* Academic Footer */}
      <footer className="max-w-7xl mx-auto px-4 md:px-8 mt-20 sm:mt-28 pt-8 border-t border-deckle space-y-4 text-xs text-ink-muted">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-2 text-center sm:text-left">
            <Feather className="w-4 h-4 text-claret shrink-0" />
            <span className="font-serif font-medium text-ink text-sm">{profile.name || PROFESSOR_INFO.name}</span>
            <span className="text-ink-faint">• Assistant Professor · English Language Education</span>
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
          </div>
        </div>

        {/* Centralized Store Policies & Merchant Disclosure Bar (Razorpay Verification Visibility) */}
        <div className="pt-3 border-t border-deckle/60 flex flex-col lg:flex-row items-center justify-between gap-3 text-[11px]">
          <span className="text-ink-muted text-center lg:text-left">
            {STORE_MERCHANT.sellerLine} • {STORE_MERCHANT.supportEmail}
          </span>
          <StorePolicyLinks variant="academic" onSelectPolicy={handleOpenPolicyModal} />
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-deckle/60 text-[11px] text-ink-faint text-center sm:text-left">
          <span>© {new Date().getFullYear()} {profile.name || PROFESSOR_INFO.name} | All Academic Rights Reserved</span>
          <span>{STORE_MERCHANT.storeTitle} · {profile.location || PROFESSOR_INFO.location}</span>
        </div>
      </footer>

      {/* Floating WhatsApp Student Desk (Floats above mobile bottom navigation bar) */}
      <NetVidyaWhatsAppWidget hasBottomNav={true} />

    </div>
  );
}

export function App() {
  return (
    <SiteContentProvider>
      <NetVidyaStoreProvider>
        <AppInner />
      </NetVidyaStoreProvider>
    </SiteContentProvider>
  );
}
