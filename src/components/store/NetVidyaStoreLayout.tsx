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
  ChevronRight
} from 'lucide-react';
import { useNetVidyaStore } from '../../contexts/NetVidyaStoreContext';
import { NetVidyaStoreHome } from './NetVidyaStoreHome';
import { NetVidyaFreeSample } from './NetVidyaFreeSample';
import { NetVidyaDashboard } from './NetVidyaDashboard';
import { NetVidyaCheckoutModal } from './NetVidyaCheckoutModal';
import { NetVidyaStudentLoginModal } from './NetVidyaStudentLoginModal';
import { NetVidyaPolicies, PolicyTab } from './NetVidyaPolicies';
import { NetVidyaAdminModal } from './NetVidyaAdminModal';
import { NetVidyaWhatsAppWidget } from './NetVidyaWhatsAppWidget';
import { STORE_MERCHANT } from '../../config/storeConfig';
import { StorePolicyLinks } from '../common/StorePolicyLinks';

export type StoreView = 'home' | 'sample' | 'dashboard' | 'policies';

interface NetVidyaStoreLayoutProps {
  onBackToAcademicSite?: () => void;
  onOpenBookstore?: () => void;
  initialView?: StoreView;
  initialPolicyTab?: PolicyTab;
}

export const NetVidyaStoreLayout: React.FC<NetVidyaStoreLayoutProps> = ({
  onBackToAcademicSite,
  onOpenBookstore,
  initialView = 'home',
  initialPolicyTab = 'terms'
}) => {
  const { currentServerPrice, isEarlyBirdActive, buyerSession } = useNetVidyaStore();

  const [currentView, setCurrentView] = useState<StoreView>(initialView);
  const [selectedPolicyTab, setSelectedPolicyTab] = useState<PolicyTab>(initialPolicyTab);

  // Modals
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Discrete Administrative Gateway: URL Hash (#admin, #store-admin), Query (?admin=true), or Secret Keybind (Ctrl+Shift+A)
  useEffect(() => {
    const checkAdminRoute = () => {
      if (typeof window === 'undefined') return;
      const hash = window.location.hash.toLowerCase();
      const search = window.location.search.toLowerCase();
      if (hash === '#admin' || hash === '#store-admin' || search.includes('admin=true')) {
        setIsAdminOpen(true);
      }
    };
    checkAdminRoute();
    window.addEventListener('hashchange', checkAdminRoute);
    window.addEventListener('popstate', checkAdminRoute);
    return () => {
      window.removeEventListener('hashchange', checkAdminRoute);
      window.removeEventListener('popstate', checkAdminRoute);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Secret key combination: Ctrl+Shift+A (or Cmd+Shift+A)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        setIsAdminOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOpenPolicies = (tab: PolicyTab = 'terms') => {
    setSelectedPolicyTab(tab);
    setCurrentView('policies');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-gray-900 font-sans flex flex-col selection:bg-blue-900 selection:text-white">
      
      {/* 1. TOP COMMERCIAL HEADER BAR */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-15 sm:h-18 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Brand Logo & Title */}
          <button
            onClick={() => { setCurrentView('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="flex items-center gap-2 sm:gap-2.5 text-left group min-w-0 flex-1 sm:flex-initial"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-700 to-indigo-900 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
              <GraduationCap className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="font-bold text-xs sm:text-base text-gray-900 group-hover:text-blue-700 transition-colors leading-tight truncate">
                  NET Vidya
                </h1>
                <span className="text-[9px] sm:text-[10px] font-mono uppercase bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded shrink-0">
                  Store
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-gray-500 font-normal truncate hidden sm:block">
                GSET + UGC NET English Final Pack 2026
              </p>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-gray-700">
            <button
              onClick={() => { setCurrentView('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className={`px-3 py-1.5 rounded-xl transition-colors ${
                currentView === 'home' ? 'bg-blue-50 text-blue-800 font-bold' : 'hover:bg-gray-100'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => { setCurrentView('sample'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className={`px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 ${
                currentView === 'sample' ? 'bg-blue-50 text-blue-800 font-bold' : 'hover:bg-gray-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Free Demo Test</span>
            </button>
            {buyerSession.isLoggedIn && (
              <button
                onClick={() => { setCurrentView('dashboard'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className={`px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 ${
                  currentView === 'dashboard' ? 'bg-blue-50 text-blue-800 font-bold' : 'hover:bg-gray-100'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-blue-700" />
                <span>My Dashboard</span>
              </button>
            )}
            {onOpenBookstore && (
              <button
                onClick={onOpenBookstore}
                className="px-3 py-1.5 rounded-xl text-gray-600 hover:text-blue-800 hover:bg-gray-100 transition-colors"
                title="Browse Monographs & Print Editions"
              >
                Bookstore
              </button>
            )}
            {onBackToAcademicSite && (
              <button
                onClick={onBackToAcademicSite}
                className="px-3 py-1.5 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                title="Return to Academic Portfolio"
              >
                Academic Site →
              </button>
            )}
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            
            {/* Student Login / Dashboard Button */}
            {buyerSession.isLoggedIn ? (
              <button
                onClick={() => { setCurrentView('dashboard'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="px-2 sm:px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-300 text-xs font-mono font-bold text-emerald-800 hover:bg-emerald-100 transition-all flex items-center gap-1 sm:gap-1.5 shadow-2xs"
                title="Open Student Dashboard"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="truncate max-w-[65px] sm:max-w-[120px]">{buyerSession.name}</span>
              </button>
            ) : (
              <button
                onClick={() => setIsLoginOpen(true)}
                className="px-2 sm:px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 border border-gray-300 text-xs font-semibold text-gray-800 transition-colors flex items-center gap-1 sm:gap-1.5"
                title="Student Login"
              >
                <KeyRound className="w-3.5 h-3.5 shrink-0" />
                <span className="text-xs">Login</span>
              </button>
            )}

            {/* Buy CTA Button */}
            <button
              onClick={() => setIsCheckoutOpen(true)}
              className="px-2 sm:px-4 py-1.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1 sm:gap-1.5 shrink-0"
            >
              <span className="hidden sm:inline">Buy Final Pack (₹{currentServerPrice})</span>
              <span className="sm:hidden">Buy ₹{currentServerPrice}</span>
              <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
            </button>

            {/* Mobile Hamburger Menu */}
            <button
              onClick={() => setMobileMenuOpen(prev => !prev)}
              aria-label="Toggle Navigation Menu"
              className="md:hidden p-1.5 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors shrink-0"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white p-4 space-y-3 text-xs font-semibold shadow-lg animate-fade-in">
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
                  onClick={() => { setCurrentView('dashboard'); setMobileMenuOpen(false); }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-[11px] shrink-0 hover:bg-emerald-700"
                >
                  Dashboard
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
                  onClick={() => { setCurrentView('dashboard'); setMobileMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className={`w-full text-left p-2.5 rounded-lg flex items-center justify-between transition-colors ${
                    currentView === 'dashboard' ? 'bg-blue-50 text-blue-900 font-bold' : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-blue-700" />
                    <span>My Dashboard (Test Hall & PDFs)</span>
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
                onClick={() => { setIsCheckoutOpen(true); setMobileMenuOpen(false); }}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs"
              >
                <span>Buy Final Pack (₹{currentServerPrice})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </header>

      {/* 2. MAIN STORE VIEW CONTAINER */}
      <main className="flex-1">
        {currentView === 'home' && (
          <NetVidyaStoreHome
            onOpenCheckout={() => setIsCheckoutOpen(true)}
            onOpenSample={() => { setCurrentView('sample'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            onOpenLogin={() => setIsLoginOpen(true)}
            onOpenBookstore={onOpenBookstore}
          />
        )}

        {currentView === 'sample' && (
          <NetVidyaFreeSample
            onOpenCheckout={() => setIsCheckoutOpen(true)}
            onNavigateHome={() => { setCurrentView('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          />
        )}

        {currentView === 'dashboard' && (
          <NetVidyaDashboard
            onOpenCheckout={() => setIsCheckoutOpen(true)}
            onOpenPolicies={() => handleOpenPolicies('terms')}
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
                {STORE_MERCHANT.sellerLine || 'Sold by NET Vidya (proprietor: Nilam Dodiya). Content by Dr Rajnikant Dodiya.'}
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
      {isCheckoutOpen && (
        <NetVidyaCheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          onOpenPolicy={handleOpenPolicies}
          onSuccess={() => {
            setIsCheckoutOpen(false);
            setCurrentView('dashboard');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      {isLoginOpen && (
        <NetVidyaStudentLoginModal
          isOpen={isLoginOpen}
          onClose={() => setIsLoginOpen(false)}
          onOpenCheckout={() => {
            setIsLoginOpen(false);
            setIsCheckoutOpen(true);
          }}
          onLoginSuccess={() => {
            setIsLoginOpen(false);
            setCurrentView('dashboard');
            window.scrollTo({ top: 0, behavior: 'smooth' });
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
