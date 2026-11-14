import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  BookOpen,
  KeyRound,
  ShieldCheck,
  Menu,
  X,
  ArrowRight,
  Clock,
  Sparkles,
  Award,
  Layers,
  ChevronRight,
  Shield
} from 'lucide-react';
import { useNetVidyaStore } from '../../contexts/NetVidyaStoreContext';
import { useSiteContent } from '../../contexts/SiteContentContext';
import { NetVidyaStoreHome } from './NetVidyaStoreHome';
import { NetVidyaFreeSample } from './NetVidyaFreeSample';
import { NetVidyaDashboard } from './NetVidyaDashboard';
import { MyMaterials } from './MyMaterials';
import { NetVidyaCheckoutModal, CHECKOUT_PRODUCTS } from './NetVidyaCheckoutModal';
import { NetVidyaStudentLoginModal } from './NetVidyaStudentLoginModal';
import { NetVidyaPolicies, PolicyTab } from './NetVidyaPolicies';
import { NetVidyaAdminModal } from './NetVidyaAdminModal';
import { NetVidyaWhatsAppWidget } from './NetVidyaWhatsAppWidget';
import { NetVidyaGsetHome } from './gset/NetVidyaGsetHome';
import { STORE_MERCHANT } from '../../config/storeConfig';
import { StorePolicyLinks } from '../common/StorePolicyLinks';

export type StoreView = 'home' | 'sample' | 'dashboard' | 'materials' | 'policies';

interface NetVidyaStoreLayoutProps {
  onBackToAcademicSite?: () => void;
  onOpenBookstore?: () => void;
  initialView?: StoreView;
  initialPolicyTab?: PolicyTab;
  initialExamStore?: 'ugc' | 'gset';
}

export const NetVidyaStoreLayout: React.FC<NetVidyaStoreLayoutProps> = ({
  onBackToAcademicSite,
  onOpenBookstore,
  initialView = 'home',
  initialPolicyTab = 'terms',
  initialExamStore = 'ugc'
}) => {
  const { currentServerPrice, isEarlyBirdActive, buyerSession } = useNetVidyaStore();
  const { openStudio } = useSiteContent();

  const [activeExamStore, setActiveExamStore] = useState<'ugc' | 'gset'>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.toLowerCase();
      const pathname = window.location.pathname.toLowerCase();
      if (hash.includes('gset') || pathname.includes('gset')) {
        return 'gset';
      }
    }
    return initialExamStore;
  });

  const [currentView, setCurrentView] = useState<StoreView>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.toLowerCase();
      const search = window.location.search.toLowerCase();
      if (
        hash === '#materials' ||
        hash === '#my-materials' ||
        hash === '#dashboard' ||
        hash === '#store-dashboard' ||
        search.includes('view=materials') ||
        search.includes('view=dashboard')
      ) {
        return 'materials';
      }
    }
    return initialView;
  });
  const [selectedPolicyTab, setSelectedPolicyTab] = useState<PolicyTab>(initialPolicyTab);

  // Modals & Checkout Config
  const [checkoutConfig, setCheckoutConfig] = useState<{
    isOpen: boolean;
    initialExam: 'ugc' | 'gset';
    initialProductId?: string;
  }>({
    isOpen: false,
    initialExam: 'ugc'
  });
  const [pendingCheckout, setPendingCheckout] = useState<{
    productId?: string;
    exam: 'ugc' | 'gset';
    productName?: string;
  } | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleOpenCheckout = (productId?: string, exam?: 'ugc' | 'gset') => {
    let targetExam = exam || activeExamStore;
    if (productId?.startsWith('gset-')) targetExam = 'gset';
    else if (productId?.startsWith('ugc-')) targetExam = 'ugc';

    const targetProduct = CHECKOUT_PRODUCTS.find(p => p.id === productId) ||
      (targetExam === 'gset' ? CHECKOUT_PRODUCTS[0] : CHECKOUT_PRODUCTS.find(p => p.id === 'ugc-net-english-bundle'));

    // Compulsory candidate login required before proceeding to checkout / buying
    if (!buyerSession.isLoggedIn) {
      setPendingCheckout({
        productId,
        exam: targetExam,
        productName: targetProduct?.name || (targetExam === 'gset' ? 'GSET 2026 Examination Pack' : 'UGC NET English Bundle')
      });
      setIsLoginOpen(true);
      return;
    }

    setCheckoutConfig({
      isOpen: true,
      initialExam: targetExam,
      initialProductId: productId
    });
  };

  // Discrete Administrative Gateway: URL Direct Entry Only (#admin, #studio, #store-admin, ?admin=true)
  useEffect(() => {
    const checkAdminRoute = () => {
      if (typeof window === 'undefined') return;
      const hash = window.location.hash.toLowerCase();
      const pathname = window.location.pathname.toLowerCase();
      const search = window.location.search.toLowerCase();
      if (
        hash === '#admin' ||
        hash === '#store-admin' ||
        hash === '#store-studio' ||
        hash === '#studio' ||
        pathname === '/admin' ||
        pathname === '/admin/' ||
        pathname === '/studio' ||
        pathname === '/studio/' ||
        search.includes('admin=true') ||
        search.includes('studio=true')
      ) {
        openStudio('store');
      }
      if (
        hash === '#materials' ||
        hash === '#my-materials' ||
        hash === '#dashboard' ||
        hash === '#store-dashboard' ||
        search.includes('view=materials') ||
        search.includes('view=dashboard')
      ) {
        setCurrentView('materials');
      }
      if (hash === '#login' || hash === '#signin' || hash === '#student-login' || search.includes('login=true')) {
        setIsLoginOpen(true);
      }
      if (hash === '#gset' || hash.startsWith('#gset') || search.includes('store=gset')) {
        setActiveExamStore('gset');
      } else if (hash === '#ugc' || hash === '#ugc-net' || hash === '#store') {
        setActiveExamStore('ugc');
      }
    };
    checkAdminRoute();
    window.addEventListener('hashchange', checkAdminRoute);
    window.addEventListener('popstate', checkAdminRoute);
    return () => {
      window.removeEventListener('hashchange', checkAdminRoute);
      window.removeEventListener('popstate', checkAdminRoute);
    };
  }, [openStudio]);

  const handleOpenPolicies = (tab: PolicyTab = 'terms') => {
    setSelectedPolicyTab(tab);
    setCurrentView('policies');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-gray-900 font-sans flex flex-col selection:bg-blue-900 selection:text-white">
      
      {/* 1. TOP COMMERCIAL HEADER BAR */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-2.5 sm:px-4 lg:px-6 h-14 flex items-center justify-between gap-1.5 sm:gap-2.5">
          
          {/* Brand Logo & Title */}
          <button
            onClick={() => { setCurrentView('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="flex items-center gap-1.5 sm:gap-2 text-left group min-w-0 shrink-0"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-700 to-indigo-900 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
              <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex items-center gap-1.5">
              <span className="font-bold text-sm sm:text-base text-gray-900 group-hover:text-blue-700 transition-colors leading-none whitespace-nowrap">
                NET Vidya
              </span>
              <span className="text-[9px] font-mono uppercase bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded shrink-0 leading-none">
                Store
              </span>
            </div>
          </button>

          {/* Dual Storefront Switcher */}
          <div className="hidden sm:flex items-center bg-gray-100/90 p-0.5 rounded-xl border border-gray-200 text-xs font-semibold shrink-0">
            <button
              onClick={() => { setActiveExamStore('ugc'); setCurrentView('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className={`px-2 lg:px-2.5 py-1 rounded-lg transition-all whitespace-nowrap ${
                activeExamStore === 'ugc'
                  ? 'bg-white text-blue-900 shadow-2xs font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="hidden xl:inline">UGC NET English</span>
              <span className="xl:hidden">UGC NET</span>
            </button>
            <button
              onClick={() => { setActiveExamStore('gset'); setCurrentView('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className={`px-2 lg:px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 whitespace-nowrap ${
                activeExamStore === 'gset'
                  ? 'bg-white text-emerald-900 shadow-2xs font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span>GSET</span>
              <span className="hidden xl:inline"> 2026</span>
              <span className="text-[9px] font-mono uppercase bg-emerald-100 text-emerald-800 px-1 py-0.2 rounded font-bold hidden xl:inline">
                NEW
              </span>
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center gap-1.5 text-xs font-semibold text-gray-700 shrink-0">
            <button
              onClick={() => { setCurrentView('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className={`px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                currentView === 'home' ? 'bg-blue-50 text-blue-800 font-bold' : 'hover:bg-gray-100'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => { setCurrentView('sample'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className={`px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                currentView === 'sample' ? 'bg-blue-50 text-blue-800 font-bold' : 'hover:bg-gray-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Free Demo</span>
            </button>
            {buyerSession.isLoggedIn && (
              <button
                onClick={() => { setCurrentView('materials'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className={`px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  currentView === 'materials' ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200' : 'text-emerald-700 hover:bg-emerald-50 font-semibold'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 shrink-0" />
                <span>My Materials</span>
              </button>
            )}
            {onOpenBookstore && (
              <button
                onClick={onOpenBookstore}
                className="px-2.5 py-1.5 rounded-lg text-gray-600 hover:text-blue-800 hover:bg-gray-100 transition-colors whitespace-nowrap shrink-0"
                title="Browse Monographs & Print Editions"
              >
                Bookstore
              </button>
            )}
            {onBackToAcademicSite && (
              <button
                onClick={onBackToAcademicSite}
                className="px-2.5 py-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors flex items-center gap-1 whitespace-nowrap shrink-0"
                title="Return to Academic Portfolio"
              >
                <span>Academic Site</span>
                <ArrowRight className="w-3.5 h-3.5 shrink-0" />
              </button>
            )}
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            
            {/* Student Login / Dashboard Button */}
            {buyerSession.isLoggedIn ? (
              <button
                onClick={() => { setCurrentView('materials'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="px-2 sm:px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-300 text-xs font-mono font-bold text-emerald-800 hover:bg-emerald-100 transition-all flex items-center gap-1.5 shadow-2xs whitespace-nowrap shrink-0"
                title="Open My Materials"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="truncate max-w-[65px] sm:max-w-[85px] xl:max-w-[110px]">{buyerSession.name}</span>
              </button>
            ) : (
              <button
                onClick={() => setIsLoginOpen(true)}
                className="px-2 sm:px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 border border-gray-300 text-xs font-semibold text-gray-800 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
                title="Student Login"
              >
                <KeyRound className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Student Login</span>
                <span className="sm:hidden">Login</span>
              </button>
            )}

            {/* Buy CTA Button */}
            <button
              onClick={() => handleOpenCheckout(undefined, activeExamStore)}
              className={`px-2.5 sm:px-3.5 py-1.5 rounded-lg text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                activeExamStore === 'gset'
                  ? 'bg-emerald-700 hover:bg-emerald-800'
                  : 'bg-blue-700 hover:bg-blue-800'
              }`}
            >
              {activeExamStore === 'gset' ? (
                <>
                  <span className="hidden min-[400px]:inline">Enroll GSET (from ₹149)</span>
                  <span className="min-[400px]:hidden">GSET ₹149</span>
                </>
              ) : (
                <>
                  <span className="hidden min-[400px]:inline">Buy Final Pack (₹{currentServerPrice})</span>
                  <span className="min-[400px]:hidden">Buy ₹{currentServerPrice}</span>
                </>
              )}
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </button>

            {/* Mobile & Tablet Hamburger Menu */}
            <button
              onClick={() => setMobileMenuOpen(prev => !prev)}
              aria-label="Toggle Navigation Menu"
              className="xl:hidden p-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors shrink-0"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile & Tablet Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="xl:hidden border-t border-gray-200 bg-white p-4 space-y-3 text-xs font-semibold shadow-lg animate-fade-in">
            {/* Student Account Card inside Mobile Drawer */}
            {buyerSession.isLoggedIn ? (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <div className="min-w-0">
                    <p className="font-bold text-emerald-950 truncate">{buyerSession.name}</p>
                    <p className="text-[11px] text-emerald-700 font-mono truncate">{buyerSession.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => { setCurrentView('materials'); setMobileMenuOpen(false); }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-[11px] shrink-0 hover:bg-emerald-700"
                >
                  My Materials
                </button>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-gray-900 text-xs">Enrolled Candidate?</p>
                  <p className="text-[11px] text-gray-500 truncate">Sign in to open your Test Hall & PDFs.</p>
                </div>
                <button
                  onClick={() => { setIsLoginOpen(true); setMobileMenuOpen(false); }}
                  className="px-3 py-1.5 rounded-lg bg-blue-700 text-white font-bold text-xs shrink-0 flex items-center gap-1.5 shadow-xs hover:bg-blue-800"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Student Login</span>
                </button>
              </div>
            )}

            {/* Mobile Store Switcher */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl text-xs font-semibold">
              <button
                onClick={() => { setActiveExamStore('ugc'); setCurrentView('home'); setMobileMenuOpen(false); }}
                className={`py-2 px-3 rounded-lg text-center transition-all ${
                  activeExamStore === 'ugc'
                    ? 'bg-white text-blue-900 font-bold shadow-2xs'
                    : 'text-gray-600'
                }`}
              >
                UGC NET English
              </button>
              <button
                onClick={() => { setActiveExamStore('gset'); setCurrentView('home'); setMobileMenuOpen(false); }}
                className={`py-2 px-3 rounded-lg text-center transition-all flex items-center justify-center gap-1 ${
                  activeExamStore === 'gset'
                    ? 'bg-white text-emerald-900 font-bold shadow-2xs'
                    : 'text-gray-600'
                }`}
              >
                <span>GSET 2026</span>
                <span className="text-[8px] bg-emerald-100 text-emerald-800 px-1 rounded font-bold">
                  NEW
                </span>
              </button>
            </div>

            {/* Drawer Navigation Links */}
            <div className="space-y-1 pt-1">
              <button
                onClick={() => { setCurrentView('home'); setMobileMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className={`w-full text-left p-2.5 rounded-lg flex items-center justify-between transition-colors ${
                  currentView === 'home' ? 'bg-blue-50 text-blue-900 font-bold' : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <span>Overview & Syllabus</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
              <button
                onClick={() => { setCurrentView('sample'); setMobileMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className={`w-full text-left p-2.5 rounded-lg flex items-center justify-between transition-colors ${
                  currentView === 'sample' ? 'bg-blue-50 text-blue-900 font-bold' : 'hover:bg-gray-100 text-emerald-700 font-bold'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Free Demo Test & Samples</span>
                </span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
              {buyerSession.isLoggedIn && (
                <button
                  onClick={() => { setCurrentView('materials'); setMobileMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className={`w-full text-left p-2.5 rounded-lg flex items-center justify-between transition-colors ${
                    currentView === 'materials' ? 'bg-emerald-50 text-emerald-900 font-bold' : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
                    <span>My Materials (Tests &amp; Study Notes)</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              )}
              <button
                onClick={() => { handleOpenPolicies('contact'); setMobileMenuOpen(false); }}
                className="w-full text-left p-2.5 rounded-lg hover:bg-gray-100 flex items-center justify-between text-gray-600"
              >
                <span>Contact & Support Desk</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
              {onOpenBookstore && (
                <button
                  onClick={() => { onOpenBookstore(); setMobileMenuOpen(false); }}
                  className="w-full text-left p-2.5 rounded-lg hover:bg-gray-100 flex items-center justify-between text-gray-700"
                >
                  <span>Bookstore &amp; Printed Editions</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              )}
              {onBackToAcademicSite && (
                <button
                  onClick={() => { onBackToAcademicSite(); setMobileMenuOpen(false); }}
                  className="w-full text-left p-2.5 rounded-lg hover:bg-gray-100 flex items-center justify-between text-blue-700"
                >
                  <span>Academic Portfolio ({STORE_MERCHANT.curatorShort})</span>
                  <ChevronRight className="w-4 h-4 text-blue-500" />
                </button>
              )}
            </div>

            {/* Quick Action in Drawer */}
            <div className="pt-2 border-t border-gray-100">
              <button
                onClick={() => { handleOpenCheckout(undefined, activeExamStore); setMobileMenuOpen(false); }}
                className={`w-full py-2.5 px-4 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs ${
                  activeExamStore === 'gset' ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-blue-700 hover:bg-blue-800'
                }`}
              >
                <span>{activeExamStore === 'gset' ? 'Enroll GSET 2026 (from ₹149)' : 'Enroll UGC NET Bundle (₹499)'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </header>

      {/* 2. MAIN STORE VIEW CONTAINER */}
      <main className="flex-1">
        {currentView === 'home' && (
          activeExamStore === 'ugc' ? (
            <NetVidyaStoreHome
              onOpenCheckout={() => handleOpenCheckout('ugc-net-english-bundle', 'ugc')}
              onOpenSample={() => { setCurrentView('sample'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              onOpenLogin={() => setIsLoginOpen(true)}
              onOpenBookstore={onOpenBookstore}
            />
          ) : (
            <NetVidyaGsetHome
              onOpenCheckout={(packId) => handleOpenCheckout(packId, 'gset')}
              onOpenDemoTest={() => { setCurrentView('sample'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              currentServerPrice={currentServerPrice}
            />
          )
        )}

        {currentView === 'sample' && (
          <NetVidyaFreeSample
            onOpenCheckout={() => handleOpenCheckout()}
            onNavigateHome={() => { setCurrentView('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          />
        )}

        {currentView === 'materials' && (
          <MyMaterials
            onOpenCheckout={(packId) => handleOpenCheckout(packId)}
            onOpenPolicies={() => handleOpenPolicies('terms')}
            onOpenLogin={() => setIsLoginOpen(true)}
          />
        )}

        {currentView === 'dashboard' && (
          <MyMaterials
            onOpenCheckout={(packId) => handleOpenCheckout(packId)}
            onOpenPolicies={() => handleOpenPolicies('terms')}
            onOpenLogin={() => setIsLoginOpen(true)}
          />
        )}

        {currentView === 'policies' && (
          <NetVidyaPolicies
            initialTab={selectedPolicyTab}
            isOpen={true}
            onClose={() => { setCurrentView('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          />
        )}
      </main>

      {/* 3. STORE FOOTER (Mandatory Legal & Brand Isolation) */}
      <footer className="bg-white border-t border-gray-200 mt-16 py-8 sm:py-10 text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
            <div>
              <strong className="text-gray-900 font-bold text-sm block">{STORE_MERCHANT.storeTitle}</strong>
              <p className="mt-0.5 text-gray-600">
                {STORE_MERCHANT.sellerLine || 'Sold by NET Vidya. Content curated by Dr. Rajnikant Dodiya.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4">
              {onOpenBookstore && (
                <button
                  onClick={onOpenBookstore}
                  className="text-xs font-semibold text-blue-700 hover:text-blue-900 hover:underline flex items-center gap-1"
                >
                  <span>Academic Bookstore (Monographs &amp; Print Books)</span>
                </button>
              )}
              {onBackToAcademicSite && (
                <button
                  onClick={onBackToAcademicSite}
                  className="text-xs font-semibold text-blue-700 hover:text-blue-900 hover:underline flex items-center gap-1"
                >
                  <span>← Back to Academic Portfolio ({STORE_MERCHANT.curatorShort})</span>
                </button>
              )}
            </div>
          </div>

          {/* Mandatory Policy Links (Razorpay Compliance) */}
          <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center justify-center md:justify-between gap-4 text-[11px]">
            <StorePolicyLinks onSelectPolicy={handleOpenPolicies} variant="store" />

            <p className="text-gray-400">
              © {new Date().getFullYear()} {STORE_MERCHANT.storeTitle}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* 4. MODALS */}
      {checkoutConfig.isOpen && (
        <NetVidyaCheckoutModal
          isOpen={checkoutConfig.isOpen}
          onClose={() => setCheckoutConfig(prev => ({ ...prev, isOpen: false }))}
          onOpenPolicy={handleOpenPolicies}
          initialExam={checkoutConfig.initialExam}
          initialProductId={checkoutConfig.initialProductId}
          onSuccess={() => {
            setCheckoutConfig(prev => ({ ...prev, isOpen: false }));
            setCurrentView('materials');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      {isLoginOpen && (
        <NetVidyaStudentLoginModal
          isOpen={isLoginOpen}
          requiredForEnrollment={Boolean(pendingCheckout)}
          pendingProductName={pendingCheckout?.productName}
          onClose={() => {
            setIsLoginOpen(false);
            setPendingCheckout(null);
          }}
          onOpenCheckout={() => {
            setIsLoginOpen(false);
            handleOpenCheckout(pendingCheckout?.productId, pendingCheckout?.exam || activeExamStore);
          }}
          onLoginSuccess={() => {
            setIsLoginOpen(false);
            if (pendingCheckout) {
              const pending = pendingCheckout;
              setPendingCheckout(null);
              setCheckoutConfig({
                isOpen: true,
                initialExam: pending.exam,
                initialProductId: pending.productId
              });
            } else {
              setCurrentView('materials');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
        />
      )}

      {isAdminOpen && (
        <NetVidyaAdminModal
          isOpen={isAdminOpen}
          onClose={() => setIsAdminOpen(false)}
        />
      )}

      {/* Floating WhatsApp Support Desk for Store */}
      <NetVidyaWhatsAppWidget hasBottomNav={false} />
    </div>
  );
};
