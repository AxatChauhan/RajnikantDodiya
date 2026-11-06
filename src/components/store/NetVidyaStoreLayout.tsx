import React, { useState } from 'react';
import {
  GraduationCap,
  BookOpen,
  KeyRound,
  ShieldCheck,
  Menu,
  X,
  Lock,
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

export type StoreView = 'home' | 'sample' | 'dashboard' | 'policies';

interface NetVidyaStoreLayoutProps {
  onBackToAcademicSite?: () => void;
}

export const NetVidyaStoreLayout: React.FC<NetVidyaStoreLayoutProps> = ({
  onBackToAcademicSite
}) => {
  const { currentServerPrice, isEarlyBirdActive, buyerSession } = useNetVidyaStore();

  const [currentView, setCurrentView] = useState<StoreView>('home');
  const [selectedPolicyTab, setSelectedPolicyTab] = useState<PolicyTab>('terms');

  // Modals
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleOpenPolicies = (tab: PolicyTab = 'terms') => {
    setSelectedPolicyTab(tab);
    setCurrentView('policies');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-gray-900 font-sans flex flex-col selection:bg-blue-900 selection:text-white">
      
      {/* 1. TOP COMMERCIAL HEADER BAR */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-4">
          
          {/* Brand Logo & Title */}
          <button
            onClick={() => { setCurrentView('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="flex items-center gap-2.5 text-left group shrink-0"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-blue-700 to-indigo-900 text-white flex items-center justify-center font-bold shadow-xs">
              <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-bold text-sm sm:text-base text-gray-900 group-hover:text-blue-700 transition-colors leading-tight">
                  NET Vidya English
                </h1>
                <span className="text-[10px] font-mono uppercase bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded">
                  Store
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-gray-500 font-normal truncate">
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
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Student Login / Dashboard Button */}
            {buyerSession.isLoggedIn ? (
              <button
                onClick={() => { setCurrentView('dashboard'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-300 text-xs font-mono font-bold text-emerald-800 hover:bg-emerald-100 transition-all flex items-center gap-1.5 shadow-2xs"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="truncate max-w-[90px] sm:max-w-[120px]">{buyerSession.name}</span>
              </button>
            ) : (
              <button
                onClick={() => setIsLoginOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 border border-gray-300 text-xs font-semibold text-gray-800 transition-colors flex items-center gap-1.5"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Student Login</span>
                <span className="sm:hidden">Login</span>
              </button>
            )}

            {/* Buy CTA Button */}
            <button
              onClick={() => setIsCheckoutOpen(true)}
              className="px-2.5 sm:px-4 py-1.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1 sm:gap-1.5 shrink-0"
            >
              <span className="hidden min-[400px]:inline">Buy Final Pack (₹{currentServerPrice})</span>
              <span className="min-[400px]:hidden">Buy ₹{currentServerPrice}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {/* Admin Trigger Button */}
            <button
              onClick={() => setIsAdminOpen(true)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors text-xs font-mono"
              title="Dr. Rajnikant Admin Studio"
            >
              <Lock className="w-4 h-4" />
            </button>

            {/* Mobile Hamburger Menu */}
            <button
              onClick={() => setMobileMenuOpen(prev => !prev)}
              className="md:hidden p-1.5 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white p-4 space-y-2 text-xs font-semibold shadow-md animate-fade-in">
            <button
              onClick={() => { setCurrentView('home'); setMobileMenuOpen(false); }}
              className="w-full text-left p-2.5 rounded-lg hover:bg-gray-100 block"
            >
              Overview & Syllabus
            </button>
            <button
              onClick={() => { setCurrentView('sample'); setMobileMenuOpen(false); }}
              className="w-full text-left p-2.5 rounded-lg hover:bg-gray-100 text-emerald-700 font-bold flex items-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Free Demo Test & Samples</span>
            </button>
            {buyerSession.isLoggedIn && (
              <button
                onClick={() => { setCurrentView('dashboard'); setMobileMenuOpen(false); }}
                className="w-full text-left p-2.5 rounded-lg bg-blue-50 text-blue-900 font-bold block"
              >
                My Dashboard (Test Hall & PDFs)
              </button>
            )}
            <button
              onClick={() => { handleOpenPolicies('contact'); setMobileMenuOpen(false); }}
              className="w-full text-left p-2.5 rounded-lg hover:bg-gray-100 block text-gray-600"
            >
              Contact & Support
            </button>
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
              <strong className="text-gray-900 font-bold text-sm block">NET Vidya English</strong>
              <p className="mt-0.5 text-gray-600">
                Sold by NET Vidya (proprietor: Nilam Dodiya). Content by Dr Rajnikant Dodiya.
              </p>
            </div>
          </div>

          {/* Mandatory Policy Links (Razorpay Compliance) */}
          <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center justify-center md:justify-between gap-4 text-[11px]">
            <div className="flex flex-wrap items-center justify-center gap-4 text-gray-600 font-medium">
              <button onClick={() => handleOpenPolicies('contact')} className="hover:text-blue-700 underline">
                Contact Us
              </button>
              <span>•</span>
              <button onClick={() => handleOpenPolicies('terms')} className="hover:text-blue-700 underline">
                Terms & Conditions
              </button>
              <span>•</span>
              <button onClick={() => handleOpenPolicies('privacy')} className="hover:text-blue-700 underline">
                Privacy Policy
              </button>
              <span>•</span>
              <button onClick={() => handleOpenPolicies('refund')} className="hover:text-blue-700 underline">
                Cancellation & Refund
              </button>
              <span>•</span>
              <button onClick={() => handleOpenPolicies('delivery')} className="hover:text-blue-700 underline">
                Digital Delivery Policy
              </button>
            </div>

            <p className="text-gray-400">
              © {new Date().getFullYear()} NET Vidya English. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* 4. MODALS */}
      {isCheckoutOpen && (
        <NetVidyaCheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
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
    </div>
  );
};
