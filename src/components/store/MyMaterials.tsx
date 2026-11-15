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
  ChevronRight,
  ShieldCheck,
  Search,
  Filter,
  Layers,
  GraduationCap
} from 'lucide-react';
import { useNetVidyaStore, ReadingFileItem, TestHallItem } from '../../contexts/NetVidyaStoreContext';
import { isAuthorEmail } from '../../config/storeConfig';
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
  shortTitle: string;
  badge: string;
  testsCount: number;
  notesCount: number;
  validThrough: string;
}

interface EnrolledPackContent {
  packId: string;
  packTitle: string;
  shortTitle: string;
  badge: string;
  badgeClass: string;
  borderClass: string;
  bgClass: string;
  validThrough: string;
  readingFiles: ReadingFileItem[];
  tests: TestHallItem[];
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
  const [selectedPackId, setSelectedPackId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [ugcTestCategory, setUgcTestCategory] = useState<'all' | 'mock' | 'unit' | 'practice'>('all');

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
    const isAuthor = isAuthorEmail(buyerSession.email);

    const packs: CoursePackSummary[] = [];

    // UGC NET English Bundle
    if (isAuthor || isGeneralBuyer || enrolled.includes('ugc-net-english-bundle') || enrolled.includes('ugc-bundle')) {
      packs.push({
        id: 'ugc-net-english-bundle',
        title: 'UGC NET English Complete Preparation Bundle (2026)',
        shortTitle: 'UGC NET English',
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
        shortTitle: 'GSET Paper 1',
        badge: 'GENERAL APTITUDE',
        testsCount: tests.filter(t => t.category === 'GSET Paper 1').length || 10,
        notesCount: 0,
        validThrough: '31 Dec 2026'
      });
    }

    // GSET Paper 2 English
    if (isAuthor || enrolled.includes('gset-paper2-english') || enrolled.includes('gset-paper2_eng') || enrolled.includes('gset-english-combo')) {
      packs.push({
        id: 'gset-paper2-english',
        title: 'GSET Paper 2: English Literature Specialist Pack',
        shortTitle: 'GSET Paper 2 English',
        badge: 'ENGLISH SPECIALIST',
        testsCount: tests.filter(t => t.category === 'GSET English').length || 9,
        notesCount: 0,
        validThrough: '31 Dec 2026'
      });
    }

    // GSET Paper 2 Education
    if (isAuthor || enrolled.includes('gset-paper2-education') || enrolled.includes('gset-paper2_edu') || enrolled.includes('gset-education-combo')) {
      packs.push({
        id: 'gset-paper2-education',
        title: 'GSET Paper 2: Education Discipline Master Pack',
        shortTitle: 'GSET Paper 2 Education',
        badge: 'EDUCATION SPECIALIST',
        testsCount: tests.filter(t => t.category === 'GSET Education').length || 10,
        notesCount: 0,
        validThrough: '31 Dec 2026'
      });
    }

    return packs;
  }, [buyerSession, tests, readingFiles]);

  // Full content organized per enrolled pack
  const enrolledPackContents = useMemo<EnrolledPackContent[]>(() => {
    const isAuthor = isAuthorEmail(buyerSession.email);
    const result: EnrolledPackContent[] = [];

    // 1. UGC NET English Bundle
    if (isAuthor || userPacks.some(p => p.id === 'ugc-net-english-bundle')) {
      const ugcTests = tests.filter(t =>
        t.category?.includes('NET') ||
        t.category?.includes('Unit') ||
        t.category?.includes('Practice')
      );
      result.push({
        packId: 'ugc-net-english-bundle',
        packTitle: 'UGC NET English Complete Preparation Bundle (2026)',
        shortTitle: 'UGC NET English',
        badge: 'NATIONAL NTA CBT PASS',
        badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
        borderClass: 'border-blue-200',
        bgClass: 'bg-blue-50/20',
        validThrough: '31 Dec 2026',
        readingFiles: readingFiles,
        tests: ugcTests
      });
    }

    // 2. GSET Paper 1: General Aptitude Foundation
    if (isAuthor || userPacks.some(p => p.id === 'gset-paper1')) {
      const p1Tests = tests.filter(t => t.category === 'GSET Paper 1');
      result.push({
        packId: 'gset-paper1',
        packTitle: 'GSET Paper 1: General Aptitude Foundation Pack',
        shortTitle: 'GSET Paper 1',
        badge: 'GENERAL APTITUDE FOUNDATION',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        borderClass: 'border-emerald-200',
        bgClass: 'bg-emerald-50/20',
        validThrough: '31 Dec 2026',
        readingFiles: [],
        tests: p1Tests
      });
    }

    // 3. GSET Paper 2: English Literature Specialist
    if (isAuthor || userPacks.some(p => p.id === 'gset-paper2-english')) {
      const p2EngTests = tests.filter(t => t.category === 'GSET English');
      result.push({
        packId: 'gset-paper2-english',
        packTitle: 'GSET Paper 2: English Literature Specialist Pack',
        shortTitle: 'GSET Paper 2 English',
        badge: 'ENGLISH SPECIALIST',
        badgeClass: 'bg-teal-100 text-teal-800 border-teal-200',
        borderClass: 'border-teal-200',
        bgClass: 'bg-teal-50/20',
        validThrough: '31 Dec 2026',
        readingFiles: [],
        tests: p2EngTests
      });
    }

    // 4. GSET Paper 2: Education Discipline Master
    if (isAuthor || userPacks.some(p => p.id === 'gset-paper2-education')) {
      const p2EduTests = tests.filter(t => t.category === 'GSET Education');
      result.push({
        packId: 'gset-paper2-education',
        packTitle: 'GSET Paper 2: Education Discipline Master Pack',
        shortTitle: 'GSET Paper 2 Education',
        badge: 'EDUCATION SPECIALIST',
        badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
        borderClass: 'border-purple-200',
        bgClass: 'bg-purple-50/20',
        validThrough: '31 Dec 2026',
        readingFiles: [],
        tests: p2EduTests
      });
    }

    return result;
  }, [buyerSession, userPacks, tests, readingFiles]);

  // Filtered packs for display
  const displayedPacks = useMemo(() => {
    let list = enrolledPackContents;

    // Filter by selected pack
    if (selectedPackId !== 'all') {
      list = list.filter(p => p.packId === selectedPackId);
    }

    const query = searchQuery.trim().toLowerCase();

    return list.map(pack => {
      // Filter reading files
      let packReading = pack.readingFiles;
      if (query) {
        packReading = packReading.filter(f =>
          f.title.toLowerCase().includes(query) ||
          f.description.toLowerCase().includes(query) ||
          f.category.toLowerCase().includes(query)
        );
      }

      // Filter tests
      let packTests = pack.tests;
      if (pack.packId === 'ugc-net-english-bundle' && ugcTestCategory !== 'all') {
        if (ugcTestCategory === 'mock') {
          packTests = packTests.filter(t => t.category === 'NET Mock');
        } else if (ugcTestCategory === 'unit') {
          packTests = packTests.filter(t => t.category === 'Unit Test');
        } else if (ugcTestCategory === 'practice') {
          packTests = packTests.filter(t => t.category === 'Practice Mock');
        }
      }

      if (query) {
        packTests = packTests.filter(t =>
          t.title.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.category.toLowerCase().includes(query)
        );
      }

      return {
        ...pack,
        readingFiles: packReading,
        tests: packTests
      };
    });
  }, [enrolledPackContents, selectedPackId, searchQuery, ugcTestCategory]);

  // Aggregate counts for tabs
  const totalDisplayedTests = useMemo(() => {
    return displayedPacks.reduce((acc, p) => acc + p.tests.length, 0);
  }, [displayedPacks]);

  const totalDisplayedNotes = useMemo(() => {
    return displayedPacks.reduce((acc, p) => acc + p.readingFiles.length, 0);
  }, [displayedPacks]);

  const totalAllItems = totalDisplayedTests + totalDisplayedNotes;

  const totalEnrolledItemsCount = useMemo(() => {
    return enrolledPackContents.reduce((acc, p) => acc + p.tests.length + p.readingFiles.length, 0);
  }, [enrolledPackContents]);

  const activePackSummary = useMemo(() => {
    if (selectedPackId === 'all') return null;
    return enrolledPackContents.find(p => p.packId === selectedPackId) || null;
  }, [selectedPackId, enrolledPackContents]);

  const ugcCounts = useMemo(() => {
    const ugcPack = enrolledPackContents.find(p => p.packId === 'ugc-net-english-bundle');
    if (!ugcPack) return { all: 0, mock: 0, unit: 0, practice: 0 };
    return {
      all: ugcPack.tests.length,
      mock: ugcPack.tests.filter(t => t.category === 'NET Mock').length,
      unit: ugcPack.tests.filter(t => t.category === 'Unit Test').length,
      practice: ugcPack.tests.filter(t => t.category === 'Practice Mock').length
    };
  }, [enrolledPackContents]);

  // Legacy compatibility for reading files & tests
  const userReadingFiles = useMemo(() => {
    const isAuthor = isAuthorEmail(buyerSession.email);
    const hasUgc = isAuthor || userPacks.some(p => p.id === 'ugc-net-english-bundle');
    return hasUgc ? readingFiles : [];
  }, [buyerSession, userPacks, readingFiles]);

  const subjectTestGroups = useMemo(() => {
    return enrolledPackContents.map(p => ({
      packId: p.packId,
      subjectTitle: p.packTitle,
      badge: p.badge,
      badgeClass: p.badgeClass,
      tests: p.tests
    }));
  }, [enrolledPackContents]);

  const totalEnrolledTests = useMemo(() => {
    return enrolledPackContents.reduce((acc, p) => acc + p.tests.length, 0);
  }, [enrolledPackContents]);

  // Handle Launch Test (CBT simulation)
  const handleLaunchTest = async (test: TestHallItem) => {
    const now = new Date();
    const releaseTime = new Date(test.releaseDate);
    const formattedDate = releaseTime.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    const isAuthor = isAuthorEmail(buyerSession.email);

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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
              <span>Your Purchased Courses &amp; Packs</span>
              <span className="text-xs font-mono font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                {userPacks.length} Active
              </span>
            </h2>
            {userPacks.length > 1 && (
              <p className="text-xs text-gray-500 mt-0.5">
                Click any pack to view and filter its content below, or click an active pack to show all.
              </p>
            )}
          </div>
          {onOpenCheckout && (
            <button
              onClick={() => onOpenCheckout()}
              className="text-xs font-bold text-blue-700 hover:text-blue-900 hover:underline flex items-center gap-1 self-start sm:self-auto cursor-pointer"
            >
              <span>Explore More Courses</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {userPacks.map((pack) => {
            const isSelected = selectedPackId === pack.id;
            return (
              <div
                key={pack.id}
                onClick={() => {
                  if (isSelected) {
                    setSelectedPackId('all');
                  } else {
                    setSelectedPackId(pack.id);
                  }
                }}
                className={`rounded-2xl p-5 border transition-all space-y-3 flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-blue-50/70 border-blue-600 ring-2 ring-blue-600/30 shadow-xs'
                    : 'bg-white border-gray-200 hover:border-blue-400 hover:shadow-xs shadow-2xs'
                }`}
                title={`Click to ${isSelected ? 'show all packs' : `filter by ${pack.title}`}`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[10px] font-mono uppercase tracking-wider font-bold px-2 py-0.5 rounded ${
                      isSelected ? 'bg-blue-700 text-white' : 'bg-blue-50 text-blue-700'
                    }`}>
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

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-medium">
                  <div className="flex items-center gap-3 text-gray-500">
                    <span>{pack.testsCount} Mock Tests</span>
                    {pack.notesCount > 0 && <span>• {pack.notesCount} E-Books</span>}
                  </div>
                  <span className={`text-[11px] font-semibold flex items-center gap-1 ${
                    isSelected ? 'text-blue-700 font-bold' : 'text-gray-400'
                  }`}>
                    {isSelected ? 'Filtering Content ✓' : 'Filter by Pack →'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: CONTENT FILTERS & ORGANIZED MATERIALS */}
      <div className="space-y-4 pt-2">
        
        {/* Course Pack Filter Bar (When user has more than 1 pack) */}
        {userPacks.length > 1 && (
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-800">
                <Filter className="w-4 h-4 text-blue-700" />
                <span>Filter by Enrolled Pack:</span>
              </div>
              {selectedPackId !== 'all' && (
                <button
                  onClick={() => setSelectedPackId('all')}
                  className="text-xs font-semibold text-blue-700 hover:underline flex items-center gap-1 self-start sm:self-auto cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Show All Packs ({totalEnrolledItemsCount} items)</span>
                </button>
              )}
            </div>

            {/* Pack Filter Buttons */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <button
                onClick={() => setSelectedPackId('all')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  selectedPackId === 'all'
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>All Packs</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                  selectedPackId === 'all' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                }`}>
                  {totalEnrolledItemsCount}
                </span>
              </button>

              {enrolledPackContents.map((p) => {
                const count = p.tests.length + p.readingFiles.length;
                const isSelected = selectedPackId === p.packId;
                return (
                  <button
                    key={p.packId}
                    onClick={() => setSelectedPackId(p.packId)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-blue-700 text-white shadow-xs'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    <span>{p.shortTitle}</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Active Filter Pill Banner */}
        {activePackSummary && (
          <div className="bg-blue-50/80 border border-blue-200 rounded-2xl px-4 py-2.5 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
              <span className="text-gray-600 shrink-0">Viewing Pack:</span>
              <strong className="text-blue-900 font-bold truncate">{activePackSummary.packTitle}</strong>
              <span className="text-gray-400 font-mono hidden md:inline">
                • {activePackSummary.tests.length} Tests {activePackSummary.readingFiles.length > 0 && `• ${activePackSummary.readingFiles.length} E-Books`}
              </span>
            </div>
            <button
              onClick={() => setSelectedPackId('all')}
              className="text-blue-700 hover:text-blue-900 font-bold shrink-0 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Show All Packs</span>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Search & Tabs Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Content Type Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold border-b border-gray-200 sm:border-0 sm:pb-0">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 sm:px-4 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              All Content ({totalAllItems})
            </button>
            <button
              onClick={() => setActiveTab('tests')}
              className={`px-3 sm:px-4 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'tests'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Mock Tests ({totalDisplayedTests})</span>
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`px-3 sm:px-4 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'notes'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Study Notes &amp; E-Books ({totalDisplayedNotes})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative max-w-xs w-full">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tests or notes..."
              className="w-full pl-8 pr-8 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                title="Clear Search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Search Empty State */}
        {searchQuery.trim() !== '' && totalAllItems === 0 && (
          <div className="bg-white rounded-2xl p-8 border border-gray-200 text-center space-y-3">
            <Search className="w-8 h-8 text-gray-400 mx-auto" />
            <h4 className="text-sm font-bold text-gray-900">No materials match "{searchQuery}"</h4>
            <p className="text-xs text-gray-500">
              Try searching with different keywords or reset your pack filter.
            </p>
            <div className="pt-2 flex justify-center gap-2">
              <button
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Clear Search
              </button>
              {selectedPackId !== 'all' && (
                <button
                  onClick={() => { setSelectedPackId('all'); setSearchQuery(''); }}
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Show All Packs
                </button>
              )}
            </div>
          </div>
        )}

        {/* ORGANIZED PACK CONTAINERS */}
        <div className="space-y-8 pt-2">
          {displayedPacks.map((pack) => {
            const hasNotes = pack.readingFiles.length > 0;
            const hasTests = pack.tests.length > 0;
            const showNotes = (activeTab === 'all' || activeTab === 'notes') && hasNotes;
            const showTests = (activeTab === 'all' || activeTab === 'tests') && hasTests;
            
            // If activeTab is 'notes' and this pack has no notes:
            if (activeTab === 'notes' && !hasNotes) {
              if (selectedPackId === pack.packId) {
                return (
                  <div key={pack.packId} className="bg-white rounded-3xl p-8 border border-gray-200 text-center space-y-3">
                    <BookOpen className="w-8 h-8 text-blue-700 mx-auto opacity-70" />
                    <h4 className="text-sm font-bold text-gray-900">{pack.packTitle}</h4>
                    <p className="text-xs text-gray-600 max-w-md mx-auto leading-relaxed">
                      This pack focuses on Computer-Based Mock Test simulations ({pack.tests.length} tests). Reading dossiers and complete study kits are part of the UGC NET English Complete Preparation Bundle.
                    </p>
                    <div className="pt-2 flex items-center justify-center gap-2">
                      <button
                        onClick={() => setActiveTab('tests')}
                        className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold transition-all cursor-pointer"
                      >
                        View CBT Mock Tests ({pack.tests.length})
                      </button>
                      {selectedPackId !== 'all' && (
                        <button
                          onClick={() => setSelectedPackId('all')}
                          className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-all cursor-pointer"
                        >
                          Show All Packs
                        </button>
                      )}
                    </div>
                  </div>
                );
              }
              return null;
            }

            // If neither notes nor tests are shown for this tab:
            if (!showNotes && !showTests) {
              return null;
            }

            return (
              <section
                key={pack.packId}
                className={`rounded-3xl border ${pack.borderClass} ${pack.bgClass} p-4 sm:p-6 lg:p-7 space-y-6 shadow-2xs`}
              >
                {/* Pack Container Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200/80 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border inline-block ${pack.badgeClass}`}>
                        {pack.badge}
                      </span>
                      <span className="text-xs font-mono text-gray-400">
                        Access through: {pack.validThrough}
                      </span>
                    </div>
                    <h3 className="text-base sm:text-xl font-extrabold text-gray-900 tracking-tight">
                      {pack.packTitle}
                    </h3>
                  </div>

                  {/* Pack Quick Action */}
                  <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                    <span className="text-xs font-mono font-semibold text-gray-600 bg-white px-2.5 py-1 rounded-lg border border-gray-200 shadow-2xs">
                      {pack.tests.length} Tests {pack.readingFiles.length > 0 && `• ${pack.readingFiles.length} E-Books`}
                    </span>
                    {userPacks.length > 1 && selectedPackId === 'all' && (
                      <button
                        onClick={() => setSelectedPackId(pack.packId)}
                        className="text-xs font-bold text-blue-700 hover:text-blue-900 bg-white hover:bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 transition-colors flex items-center gap-1 cursor-pointer"
                        title="Filter exclusively to this pack"
                      >
                        <span>Filter this pack</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Sub-Section 1: Study Notes & E-Books (Read Online) */}
                {showNotes && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-blue-700" />
                        <span>Study Notes &amp; E-Books (Read Online)</span>
                      </h4>
                      <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        On-Site Protected Reader
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {pack.readingFiles.map((file) => (
                        <div
                          key={file.id}
                          className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-xs hover:border-gray-300 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                        >
                          <div className="flex items-start gap-3.5 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono uppercase bg-gray-100 text-gray-700 font-bold px-2 py-0.5 rounded">
                                  {file.category}
                                </span>
                                <span className="text-[11px] text-gray-400 font-mono">
                                  {file.fileSizeMb} MB
                                </span>
                              </div>
                              <h5 className="text-sm font-bold text-gray-900 truncate sm:whitespace-normal">
                                {file.title}
                              </h5>
                              <p className="text-xs text-gray-500 leading-relaxed max-w-2xl">
                                {file.description}
                              </p>
                            </div>
                          </div>

                          <div className="w-full sm:w-auto shrink-0">
                            <button
                              onClick={() => handleOpenReader(file)}
                              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
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

                {/* Sub-Section 2: CBT Mock Tests */}
                {showTests && (
                  <div className="space-y-4 pt-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-blue-700" />
                        <span>Computer-Based Mock Tests ({pack.tests.length})</span>
                      </h4>

                      {/* UGC NET Sub-Category Test Filter Pills */}
                      {pack.packId === 'ugc-net-english-bundle' && (
                        <div className="flex items-center gap-1 overflow-x-auto text-[11px] font-semibold">
                          <button
                            onClick={() => setUgcTestCategory('all')}
                            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                              ugcTestCategory === 'all'
                                ? 'bg-blue-700 text-white font-bold'
                                : 'bg-white hover:bg-gray-100 text-gray-600 border border-gray-200'
                            }`}
                          >
                            All ({ugcCounts.all})
                          </button>
                          <button
                            onClick={() => setUgcTestCategory('mock')}
                            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                              ugcTestCategory === 'mock'
                                ? 'bg-blue-700 text-white font-bold'
                                : 'bg-white hover:bg-gray-100 text-gray-600 border border-gray-200'
                            }`}
                          >
                            Full Mocks ({ugcCounts.mock})
                          </button>
                          <button
                            onClick={() => setUgcTestCategory('unit')}
                            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                              ugcTestCategory === 'unit'
                                ? 'bg-blue-700 text-white font-bold'
                                : 'bg-white hover:bg-gray-100 text-gray-600 border border-gray-200'
                            }`}
                          >
                            Unit Tests ({ugcCounts.unit})
                          </button>
                          <button
                            onClick={() => setUgcTestCategory('practice')}
                            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                              ugcTestCategory === 'practice'
                                ? 'bg-blue-700 text-white font-bold'
                                : 'bg-white hover:bg-gray-100 text-gray-600 border border-gray-200'
                            }`}
                          >
                            Practice Mocks ({ugcCounts.practice})
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {pack.tests.map((test) => {
                        const now = new Date();
                        const releaseDate = new Date(test.releaseDate);
                        const isAuthor = isAuthorEmail(buyerSession.email);
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

                              <h5 className="text-sm font-bold text-gray-900 leading-snug">
                                {test.title}
                              </h5>

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
                                  className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
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
              </section>
            );
          })}
        </div>
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
