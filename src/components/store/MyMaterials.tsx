import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  FileText,
  Clock,
  Play,
  Lock,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Sparkles,
  KeyRound,
  ArrowRight,
  X,
  Maximize2,
  ChevronRight,
  ShieldCheck,
  Search,
  ExternalLink
} from 'lucide-react';
import { useNetVidyaStore, ReadingFileItem, TestHallItem } from '../../contexts/NetVidyaStoreContext';
import { NtaTestRunnerModal } from './NtaTestRunnerModal';
import { NetVidyaInvoiceModal } from './NetVidyaInvoiceModal';

interface MyMaterialsProps {
  onOpenCheckout?: (productId?: string) => void;
  onOpenPolicies?: () => void;
  onOpenLogin?: () => void;
}

interface CoursePackSummary {
  id: string;
  title: string;
  badge: string;
  testsCount: number;
  notesCount: number;
  validThrough: string;
}

export const MyMaterials: React.FC<MyMaterialsProps> = ({
  onOpenCheckout,
  onOpenPolicies,
  onOpenLogin
}) => {
  const {
    buyerSession,
    logoutBuyer,
    readingFiles,
    tests,
    verifyPaymentAndActivate
  } = useNetVidyaStore();

  const [activeTab, setActiveTab] = useState<'all' | 'tests' | 'notes'>('all');
  const [activeTestToRun, setActiveTestToRun] = useState<TestHallItem | null>(null);
  const [activeReaderItem, setActiveReaderItem] = useState<ReadingFileItem | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'alert'; message: string } | null>(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  // Instant Activation form state
  const [activationInput, setActivationInput] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const [activationFeedback, setActivationFeedback] = useState<string | null>(null);

  const showToast = (message: string, type: 'success' | 'alert' = 'success') => {
    setNotice({ type, message });
    setTimeout(() => setNotice(null), 4000);
  };

  // Determine which course packs the student owns
  const userPacks = useMemo<CoursePackSummary[]>(() => {
    if (!buyerSession.isLoggedIn) return [];

    const enrolled = buyerSession.enrolledPacks || [];
    const isGeneralBuyer = buyerSession.isBuyer;
    const isAuthor = buyerSession.email?.toLowerCase().trim() === 'rajnikantdodiya2@gmail.com';

    const packs: CoursePackSummary[] = [];

    // UGC NET English Bundle
    if (isAuthor || isGeneralBuyer || enrolled.includes('ugc-net-english-bundle') || enrolled.includes('ugc-bundle')) {
      packs.push({
        id: 'ugc-net-english-bundle',
        title: 'UGC NET English Complete Preparation Bundle (2026)',
        badge: 'NATIONAL NTA PASS',
        testsCount: tests.filter(t => t.category?.includes('NET') || t.category?.includes('Unit') || t.category?.includes('Practice')).length || 21,
        notesCount: readingFiles.length || 3,
        validThrough: '31 Dec 2026'
      });
    }

    // GSET Paper 1
    if (isAuthor || enrolled.includes('gset-paper1') || enrolled.includes('gset-english-combo') || enrolled.includes('gset-education-combo')) {
      packs.push({
        id: 'gset-paper1',
        title: 'GSET Paper 1: General Aptitude Foundation Pack',
        badge: 'GENERAL APTITUDE',
        testsCount: tests.filter(t => t.category === 'GSET Paper 1').length || 3,
        notesCount: 0,
        validThrough: '31 Dec 2026'
      });
    }

    // GSET Paper 2 English
    if (isAuthor || enrolled.includes('gset-paper2-english') || enrolled.includes('gset-paper2_eng') || enrolled.includes('gset-english-combo')) {
      packs.push({
        id: 'gset-paper2-english',
        title: 'GSET Paper 2: English Literature Specialist Pack',
        badge: 'ENGLISH SPECIALIST',
        testsCount: tests.filter(t => t.category === 'GSET English').length || 2,
        notesCount: 0,
        validThrough: '31 Dec 2026'
      });
    }

    // GSET Paper 2 Education
    if (isAuthor || enrolled.includes('gset-paper2-education') || enrolled.includes('gset-paper2_edu') || enrolled.includes('gset-education-combo')) {
      packs.push({
        id: 'gset-paper2-education',
        title: 'GSET Paper 2: Education Discipline Master Pack',
        badge: 'EDUCATION SPECIALIST',
        testsCount: tests.filter(t => t.category === 'GSET Education').length || 3,
        notesCount: 0,
        validThrough: '31 Dec 2026'
      });
    }

    return packs;
  }, [buyerSession, tests, readingFiles]);

  // Handle Launch Test (CBT simulation)
  const handleLaunchTest = async (test: TestHallItem) => {
    const now = new Date();
    const releaseTime = new Date(test.releaseDate);
    const formattedDate = releaseTime.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    const isAuthor = buyerSession.email?.toLowerCase().trim() === 'rajnikantdodiya2@gmail.com';

    if (now < releaseTime && !isAuthor) {
      showToast(`This test opens on ${formattedDate}`, 'alert');
      return;
    }

    try {
      const res = await fetch(`/api/store/serve-test?testId=${encodeURIComponent(test.id)}`, {
        headers: {
          Authorization: `Bearer ${buyerSession.token || ''}`
        }
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        if (data.isLocked || res.status === 403) {
          showToast(data.error || `Opens on ${formattedDate}`, 'alert');
          return;
        }
        throw new Error(data.error || 'Unable to launch CBT test.');
      }

      const runnerUrl = data.runnerUrl || `/test-hall/runner.html?testId=${encodeURIComponent(test.id)}`;
      window.open(runnerUrl, '_blank');
      showToast(`Launching ${test.title}`, 'success');
      setActiveTestToRun(test);
    } catch (err: any) {
      showToast(`Error: ${err.message}`, 'alert');
    }
  };

  // Handle Read Online (Strictly In-Browser, No Downloads)
  const handleOpenReader = (file: ReadingFileItem) => {
    setActiveReaderItem(file);
    showToast(`Opening reader for "${file.title}"`, 'success');
  };

  // Handle Missing Order Activation
  const handleManualActivation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activationInput.trim()) return;

    setIsActivating(true);
    setActivationFeedback(null);

    const isPayId = activationInput.trim().startsWith('pay_');
    const query = isPayId
      ? { paymentId: activationInput.trim() }
      : { email: activationInput.trim() };

    const res = await verifyPaymentAndActivate(query);
    setIsActivating(false);

    if (res.success) {
      setActivationFeedback(res.message || 'Payment confirmed! Your materials have been updated.');
      showToast('Account refreshed with your purchases!', 'success');
      setActivationInput('');
    } else {
      setActivationFeedback(res.error || 'No matching completed order found. Please check your payment ID or email.');
      showToast('Order lookup failed', 'alert');
    }
  };

  // 1. NOT LOGGED IN STATE
  if (!buyerSession.isLoggedIn) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16 space-y-8 animate-fade-in text-center">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-gray-200 shadow-sm max-w-xl mx-auto space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mx-auto shadow-xs">
            <KeyRound className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Sign In to Access My Materials
            </h1>
            <p className="text-sm text-gray-600 leading-relaxed max-w-md mx-auto">
              Please sign in with your registered candidate email to access your enrolled course packs, CBT mock tests, and online study notes.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => {
                if (onOpenLogin) onOpenLogin();
                else window.location.hash = '#login';
              }}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 mx-auto"
            >
              <KeyRound className="w-4 h-4" />
              <span>Student Login</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Missing order fallback */}
          <div className="pt-6 border-t border-gray-100 text-left">
            <p className="text-xs font-semibold text-gray-700 mb-2">
              Already paid via UPI or QR code?
            </p>
            <form onSubmit={handleManualActivation} className="flex gap-2">
              <input
                type="text"
                value={activationInput}
                onChange={(e) => setActivationInput(e.target.value)}
                placeholder="Enter Email or Razorpay ID (pay_...)"
                className="flex-1 px-3 py-2 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <button
                type="submit"
                disabled={isActivating || !activationInput.trim()}
                className="px-4 py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50 shrink-0"
              >
                {isActivating ? 'Checking...' : 'Activate'}
              </button>
            </form>
            {activationFeedback && (
              <p className="text-xs text-blue-700 font-medium mt-2">
                {activationFeedback}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 2. LOGGED IN BUT NO ENROLLED COURSES YET
  if (userPacks.length === 0 && !buyerSession.isBuyer) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16 space-y-8 animate-fade-in">
        {/* User Profile Bar */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900">{buyerSession.name || 'Scholar'}</h2>
              <span className="text-[10px] font-mono font-bold uppercase bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                Registered
              </span>
            </div>
            <p className="text-xs text-gray-500 font-mono">{buyerSession.email}</p>
          </div>
          <button
            onClick={logoutBuyer}
            className="px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5 text-gray-500" />
            <span>Logout</span>
          </button>
        </div>

        {/* Empty State Card */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-gray-200 text-center space-y-6 shadow-xs max-w-xl mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
            <BookOpen className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-gray-900">No Enrolled Courses Yet</h3>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              You are signed in, but you haven't enrolled in any exam packs yet. Choose a preparation pack to unlock your computer-based tests and study materials.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {onOpenCheckout && (
              <button
                onClick={() => onOpenCheckout()}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2"
              >
                <span>Browse Preparation Courses</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Missing purchase recovery */}
          <div className="pt-6 border-t border-gray-100 text-left max-w-md mx-auto">
            <p className="text-xs font-semibold text-gray-700 mb-2">
              Recently paid via UPI or card?
            </p>
            <form onSubmit={handleManualActivation} className="flex gap-2">
              <input
                type="text"
                value={activationInput}
                onChange={(e) => setActivationInput(e.target.value)}
                placeholder="Enter Razorpay ID (pay_...) or Email"
                className="flex-1 px-3 py-2 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <button
                type="submit"
                disabled={isActivating || !activationInput.trim()}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50 shrink-0"
              >
                {isActivating ? 'Checking...' : 'Refresh Access'}
              </button>
            </form>
            {activationFeedback && (
              <p className="text-xs text-blue-700 font-medium mt-2">
                {activationFeedback}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 3. AUTHENTICATED STUDENT WITH ACTIVE HOLDINGS
  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-10 space-y-8 animate-fade-in">
      
      {/* Toast Notice */}
      {notice && (
        <div
          className={`fixed top-20 right-4 z-50 px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-medium animate-fade-in border ${
            notice.type === 'success'
              ? 'bg-blue-900 text-white border-blue-700'
              : 'bg-amber-900 text-white border-amber-700'
          }`}
        >
          {notice.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-300 shrink-0" />
          )}
          <span>{notice.message}</span>
        </div>
      )}

      {/* TOP USER PROFILE BAR */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900">{buyerSession.name || 'Scholar Candidate'}</h1>
            <span className="text-[11px] font-mono font-bold uppercase bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              <span>Active Student</span>
            </span>
          </div>
          <p className="text-xs text-gray-500 font-mono">{buyerSession.email}</p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-start">
          <button
            onClick={() => setIsInvoiceOpen(true)}
            className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-gray-500" />
            <span>Fee Receipt</span>
          </button>
          <button
            onClick={logoutBuyer}
            className="px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5 text-red-500" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: YOUR PURCHASED COURSES & PACKS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
            <span>Your Purchased Courses &amp; Packs</span>
            <span className="text-xs font-mono font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
              {userPacks.length} Active
            </span>
          </h2>
          {onOpenCheckout && (
            <button
              onClick={() => onOpenCheckout()}
              className="text-xs font-bold text-blue-700 hover:text-blue-900 hover:underline flex items-center gap-1"
            >
              <span>Explore More Courses</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {userPacks.map((pack) => (
            <div
              key={pack.id}
              className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs hover:border-blue-300 transition-all space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                    {pack.badge}
                  </span>
                  <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Enrolled</span>
                  </span>
                </div>
                <h3 className="text-sm font-bold text-gray-900 leading-snug">
                  {pack.title}
                </h3>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-medium">
                <div className="flex items-center gap-3">
                  <span>{pack.testsCount} Mock Tests</span>
                  {pack.notesCount > 0 && <span>• {pack.notesCount} E-Books</span>}
                </div>
                <span className="text-[11px] font-mono text-gray-400">Valid: {pack.validThrough}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: CONTENT TABS */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-2 border-b border-gray-200 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            All Materials ({tests.length + readingFiles.length})
          </button>
          <button
            onClick={() => setActiveTab('tests')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'tests'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Mock Tests ({tests.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'notes'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Study Notes &amp; E-Books ({readingFiles.length})</span>
          </button>
        </div>

        {/* STUDY NOTES & E-BOOKS LIST (STRICTLY ON-SITE READING ONLY) */}
        {(activeTab === 'all' || activeTab === 'notes') && readingFiles.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                Study Notes &amp; E-Books (Read Online)
              </h3>
              <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                On-Site Protected Reader
              </span>
            </div>

            <div className="space-y-3">
              {readingFiles.map((file) => (
                <div
                  key={file.id}
                  className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-xs hover:border-gray-300 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono uppercase bg-gray-100 text-gray-700 font-bold px-2 py-0.5 rounded">
                          {file.category}
                        </span>
                        <span className="text-[11px] text-gray-400 font-mono">
                          {file.fileSizeMb} MB
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-gray-900">{file.title}</h4>
                      <p className="text-xs text-gray-500 leading-relaxed max-w-2xl">{file.description}</p>
                    </div>
                  </div>

                  {/* Strictly Read Online Button (No Downloads) */}
                  <div className="w-full sm:w-auto">
                    <button
                      onClick={() => handleOpenReader(file)}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>Read Online</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MOCK TESTS LIST */}
        {(activeTab === 'all' || activeTab === 'tests') && (
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
              Computer-Based Mock Tests
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {tests.map((test) => {
                const now = new Date();
                const releaseDate = new Date(test.releaseDate);
                const isAuthor = buyerSession.email?.toLowerCase().trim() === 'rajnikantdodiya2@gmail.com';
                const isAvailable = now >= releaseDate || isAuthor;
                const formattedDate = releaseDate.toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                });

                return (
                  <div
                    key={test.id}
                    className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-xs hover:border-blue-200 transition-all flex flex-col justify-between gap-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono uppercase bg-gray-100 text-gray-700 font-bold px-2 py-0.5 rounded">
                          {test.category}
                        </span>
                        {isAvailable ? (
                          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Available Now</span>
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            <span>Opens on {formattedDate}</span>
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-gray-900 leading-snug">
                        {test.title}
                      </h4>

                      <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                        {test.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                      <div className="text-[11px] text-gray-500 font-medium">
                        <span>{test.totalQuestions} Questions</span> • <span>{test.durationMinutes} Mins</span>
                      </div>

                      {isAvailable ? (
                        <button
                          onClick={() => handleLaunchTest(test)}
                          className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Start Test</span>
                        </button>
                      ) : (
                        <button
                          disabled
                          className="px-3.5 py-2 rounded-xl bg-gray-100 text-gray-400 text-xs font-semibold flex items-center gap-1.5 cursor-not-allowed"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>Locked</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 3: MISSING A PURCHASE? */}
      <div className="mt-12 bg-gray-50 rounded-2xl p-5 sm:p-6 border border-gray-200 space-y-3">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-gray-900">
            Missing a recent purchase or paid via UPI?
          </h3>
          <p className="text-xs text-gray-600 leading-relaxed">
            If you recently completed a payment or used a different email, enter your Razorpay Payment ID (starts with <code>pay_...</code>) or registered email to refresh your enrolled materials immediately.
          </p>
        </div>

        <form onSubmit={handleManualActivation} className="flex flex-col sm:flex-row gap-2 max-w-xl">
          <input
            type="text"
            value={activationInput}
            onChange={(e) => setActivationInput(e.target.value)}
            placeholder="Enter Razorpay ID (pay_...) or Email"
            className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
          />
          <button
            type="submit"
            disabled={isActivating || !activationInput.trim()}
            className="px-5 py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50 shrink-0"
          >
            {isActivating ? 'Verifying...' : 'Check & Refresh Access'}
          </button>
        </form>

        {activationFeedback && (
          <p className="text-xs text-blue-700 font-medium">
            {activationFeedback}
          </p>
        )}
      </div>

      {/* BUILT-IN ON-SITE PROTECTED READER MODAL (NO DOWNLOADS ALLOWED) */}
      {activeReaderItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-2 sm:p-4 animate-fade-in">
          <div
            className="bg-white w-full max-w-5xl h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-300"
            onContextMenu={(e) => e.preventDefault()}
          >
            {/* Modal Header */}
            <div className="px-4 py-3 bg-gray-900 text-white flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <BookOpen className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-bold text-xs sm:text-sm truncate">
                  {activeReaderItem.title}
                </span>
                <span className="hidden sm:inline-block text-[10px] uppercase font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded">
                  Protected On-Site Reader
                </span>
              </div>
              <button
                onClick={() => setActiveReaderItem(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                title="Close Reader"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Embedded Sandboxed Reader (Zero Downloads) */}
            <div className="flex-1 bg-gray-100 relative overflow-hidden">
              <iframe
                src={activeReaderItem.sampleUrl || '/study-vault/ugc/reading/ebook/index.html'}
                title={activeReaderItem.title}
                className="w-full h-full border-0"
                sandbox="allow-scripts allow-same-origin"
              />
            </div>

            {/* Reader Footer Notice */}
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-[11px] text-gray-500 flex items-center justify-between">
              <span>Candidate: {buyerSession.name} ({buyerSession.email})</span>
              <span className="text-gray-400 font-mono">Protected Academic Material • On-Site Only</span>
            </div>
          </div>
        </div>
      )}

      {/* TEST RUNNER MODAL */}
      {activeTestToRun && (
        <NtaTestRunnerModal
          isOpen={Boolean(activeTestToRun)}
          onClose={() => setActiveTestToRun(null)}
          testTitle={activeTestToRun.title}
          candidateName={buyerSession.name || 'Scholar'}
        />
      )}

      {/* FEE RECEIPT MODAL */}
      {isInvoiceOpen && (
        <NetVidyaInvoiceModal
          isOpen={isInvoiceOpen}
          onClose={() => setIsInvoiceOpen(false)}
          buyerSession={buyerSession}
        />
      )}

    </div>
  );
};
