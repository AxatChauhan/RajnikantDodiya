import React, { useState } from 'react';
import {
  BookOpen,
  FileText,
  Clock,
  Play,
  Download,
  Lock,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Sparkles,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { useNetVidyaStore, ReadingFileItem, TestHallItem } from '../../contexts/NetVidyaStoreContext';
import { NtaTestRunnerModal } from './NtaTestRunnerModal';

interface NetVidyaDashboardProps {
  onOpenCheckout: () => void;
  onOpenPolicies: () => void;
  onOpenLogin?: () => void;
}

export const NetVidyaDashboard: React.FC<NetVidyaDashboardProps> = ({
  onOpenCheckout,
  onOpenPolicies,
  onOpenLogin
}) => {
  const { buyerSession, logoutBuyer, readingFiles, tests, currentServerPrice } = useNetVidyaStore();

  const [activeTab, setActiveTab] = useState<'reading' | 'tests'>('tests');
  const [activeTestToRun, setActiveTestToRun] = useState<TestHallItem | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);
  const [testNotice, setTestNotice] = useState<string | null>(null);

  // 1. Unauthenticated Visitor Prompt
  if (!buyerSession.isLoggedIn) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6 animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Student Dashboard is Restricted
        </h2>
        <p className="text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
          The Reading Files and NTA Test Hall are reserved exclusively for enrolled candidates of the <strong>"GSET + UGC NET English Final Pack 2026"</strong>.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {onOpenLogin && (
            <button
              onClick={onOpenLogin}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gray-900 hover:bg-black text-white text-xs sm:text-sm font-bold shadow-md transition-colors"
            >
              Sign In to Account
            </button>
          )}
          <button
            onClick={onOpenCheckout}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs sm:text-sm font-bold shadow-md transition-colors"
          >
            Enroll Now (Early-Bird ₹{currentServerPrice})
          </button>
        </div>
      </div>
    );
  }

  // 2. Authenticated Non-Buyer Barrier
  if (!buyerSession.isBuyer) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-8 animate-fade-in">
        {/* Candidate Profile Bar */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 border border-amber-400/30 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>Registered Candidate • Enrollment Required</span>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Welcome, {buyerSession.name}!
            </h1>
            <p className="text-xs text-slate-300">
              Account: <strong className="text-white">{buyerSession.email}</strong>
            </p>
          </div>

          <button
            onClick={logoutBuyer}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-semibold transition-all flex items-center gap-2 border border-white/20"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Locked Feature Card */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-gray-200 shadow-md text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center mx-auto shadow-xs">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <h2 className="text-2xl font-bold text-gray-900">
              Complete Your Enrollment to Unlock Content
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Your student account is active. To access the <strong>High-Yield Reading Dossiers</strong> and <strong>NTA CBT Test Hall</strong>, enroll in the <strong>"GSET + UGC NET English Final Pack 2026"</strong>.
            </p>
          </div>

          {/* Included Features List */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto text-left pt-2">
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-1">
              <span className="text-xs font-bold text-gray-900 block flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Revision Dossiers</span>
              </span>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                4+ Curated high-yield PDFs with 10-minute temporary signed links.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-1">
              <span className="text-xs font-bold text-gray-900 block flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>NTA Test Hall</span>
              </span>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                10 Mock tests & unit quizzes with real countdown and timer.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-1">
              <span className="text-xs font-bold text-gray-900 block flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Enrolled till Dec 2026</span>
              </span>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Access valid through 31 Dec 2026 with no monthly renewal.
              </p>
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={onOpenCheckout}
              className="px-8 py-3.5 rounded-2xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all inline-flex items-center gap-2"
            >
              <span>Enroll Now for ₹{currentServerPrice}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-[11px] text-gray-400 mt-2">
              Instant activation • 100% digital access delivered immediately.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 3. Authenticated Active Paying Buyer: Unlocked Content
  const handleDownloadFile = async (file: ReadingFileItem) => {
    setDownloadingId(file.id);
    setDownloadNotice(null);

    try {
      const res = await fetch(`/api/store/download-file?fileId=${file.id}`, {
        headers: {
          Authorization: `Bearer ${buyerSession.token || ''}`
        }
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Could not verify download entitlement.');
      }

      if (!data.downloadUrl) {
        throw new Error('Signed download URL not provided by server.');
      }

      // Download file using genuine signed URL
      const a = document.createElement('a');
      a.href = data.downloadUrl;
      a.download = `${file.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setDownloadNotice(`Generated secure download for "${file.title}" (Link valid for 10 minutes).`);
      setTimeout(() => setDownloadNotice(null), 4000);
    } catch (err: any) {
      setDownloadNotice(`Download error: ${err.message}`);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleLaunchTest = async (test: TestHallItem) => {
    setTestNotice(null);
    const now = new Date();
    const releaseTime = new Date(test.releaseDate);
    const formattedDate = releaseTime.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    if (now < releaseTime) {
      setTestNotice(`Opens on ${formattedDate}`);
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
          setTestNotice(data.error || `Opens on ${formattedDate}`);
          return;
        }
        throw new Error(data.error || 'Unable to launch CBT test.');
      }

      const runnerUrl = data.runnerUrl || `/test-hall/runner.html?testId=${encodeURIComponent(test.id)}`;
      window.open(runnerUrl, '_blank');
      setActiveTestToRun(test);
    } catch (err: any) {
      setTestNotice(`Error: ${err.message}`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-10 space-y-8 animate-fade-in">
      
      {/* Toast Notice */}
      {downloadNotice && (
        <div className="fixed top-20 right-4 z-50 bg-blue-900 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-medium animate-fade-in border border-blue-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{downloadNotice}</span>
        </div>
      )}

      {testNotice && (
        <div className="fixed top-20 right-4 z-50 bg-amber-900 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-medium animate-fade-in border border-amber-700">
          <AlertCircle className="w-4 h-4 text-amber-300" />
          <span>{testNotice}</span>
        </div>
      )}

      {/* 1. Candidate Passport / Header */}
      <div className="bg-gradient-to-r from-[#1E3A8A] via-[#1E40AF] to-[#0F172A] rounded-3xl p-6 sm:p-8 text-white shadow-lg border border-blue-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase bg-emerald-500 text-white font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span>Verified Student Account Active</span>
            </span>
            <span className="text-xs text-blue-200 font-mono">
              Order #{buyerSession.orderId || 'NV_VERIFIED'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome, {buyerSession.name}!
          </h1>
          <p className="text-xs sm:text-sm text-blue-200">
            Registered Email: <strong className="text-white font-medium">{buyerSession.email}</strong> • Valid through <strong>31 Dec 2026</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={logoutBuyer}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-blue-100 hover:text-white text-xs font-semibold transition-all flex items-center gap-2 border border-white/20"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* 2. Primary Tabs: Test Hall vs Reading Files */}
      <div className="flex items-center gap-3 border-b border-gray-200 pb-3">
        <button
          onClick={() => setActiveTab('tests')}
          className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'tests'
              ? 'bg-blue-700 text-white shadow-sm'
              : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>NTA Test Hall ({tests.length} Modules)</span>
        </button>

        <button
          onClick={() => setActiveTab('reading')}
          className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'reading'
              ? 'bg-blue-700 text-white shadow-sm'
              : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Reading Files ({readingFiles.length} Dossiers)</span>
        </button>
      </div>

      {/* 3. TAB CONTENT: Test Hall */}
      {activeTab === 'tests' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold text-gray-900">NTA Computer-Based Mock Tests</h2>
              <p className="text-xs text-gray-500">
                Self-contained NTA simulation environment with full question palette, real-time timer, and instant explanations.
              </p>
            </div>
            <span className="text-xs font-mono text-blue-700 font-semibold bg-blue-50 px-3 py-1 rounded-full border border-blue-200 self-start sm:self-auto">
              Paper II: English Literature
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tests.map(test => {
              const now = new Date();
              const releaseTime = new Date(test.releaseDate);
              const isLocked = now < releaseTime;
              const formattedDate = releaseTime.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              });

              return (
                <div
                  key={test.id}
                  className={`bg-white rounded-3xl p-6 border shadow-sm flex flex-col justify-between transition-all ${
                    isLocked
                      ? 'border-gray-200 opacity-90'
                      : 'border-blue-200 hover:shadow-md hover:border-blue-400'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded">
                        {test.category}
                      </span>
                      {isLocked ? (
                        <span className="text-[11px] font-mono text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-semibold flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          <span>Opens {formattedDate}</span>
                        </span>
                      ) : (
                        <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Ready Now</span>
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-gray-900 leading-snug">
                      {test.title}
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">
                      {test.description}
                    </p>

                    <div className="pt-2 flex items-center gap-4 text-xs text-gray-600 font-mono">
                      <span>{test.totalQuestions} Questions</span>
                      <span>•</span>
                      <span>{test.durationMinutes} Minutes</span>
                    </div>
                  </div>

                  <div className="pt-6">
                    {isLocked ? (
                      <button
                        disabled
                        className="w-full py-2.5 rounded-xl bg-gray-100 text-gray-400 text-xs font-semibold cursor-not-allowed flex items-center justify-center gap-2 border border-gray-200"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Opens on {formattedDate}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleLaunchTest(test)}
                        className="w-full py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold transition-colors shadow-xs flex items-center justify-center gap-2"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Launch CBT Test</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. TAB CONTENT: Reading Files */}
      {activeTab === 'reading' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Protected Reading Materials & Dossiers</h2>
              <p className="text-xs text-gray-500">
                Authoritative revision PDFs curated by Dr. Rajnikant Dodiya. Delivered via secure 10-minute temporary signed links.
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-700 font-semibold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
              Downloadable for Enrolled Scholars
            </span>
          </div>

          <div className="space-y-4">
            {readingFiles.map(file => (
              <div
                key={file.id}
                className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-200 shadow-xs hover:shadow-sm transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                    <FileText className="w-6 h-6" />
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
                    <h3 className="text-sm sm:text-base font-bold text-gray-900">
                      {file.title}
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed max-w-2xl">
                      {file.description}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleDownloadFile(file)}
                  disabled={downloadingId === file.id}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
                >
                  {downloadingId === file.id ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Signing Link...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Download PDF</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. NTA Test Runner Modal */}
      {activeTestToRun && (
        <NtaTestRunnerModal
          isOpen={Boolean(activeTestToRun)}
          onClose={() => setActiveTestToRun(null)}
          testTitle={activeTestToRun.title}
          isFreeDemo={false}
          candidateName={buyerSession.name}
        />
      )}
    </div>
  );
};
