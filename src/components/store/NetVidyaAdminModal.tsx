import React, { useState } from 'react';
import {
  X,
  Upload,
  FileText,
  Clock,
  DollarSign,
  Users,
  Download,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Shield,
  KeyRound,
  Calendar,
  Lock,
  Unlock,
  RotateCcw,
  Sparkles,
  Mail,
  Search,
  LogOut
} from 'lucide-react';
import { useNetVidyaStore } from '../../contexts/NetVidyaStoreContext';
import { useSiteContent } from '../../contexts/SiteContentContext';
import { useModalEscape } from '../../hooks/useModalEscape';

interface NetVidyaAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NetVidyaAdminModal: React.FC<NetVidyaAdminModalProps> = ({ isOpen, onClose }) => {
  const {
    settings,
    updateSettings,
    readingFiles,
    addReadingFile,
    deleteReadingFile,
    tests,
    addTest,
    deleteTest,
    buyersRegistry,
    addManualBuyer,
    toggleBuyerAccess,
    exportBuyersToExcel,
    resendConfirmationEmail,
    adminToken,
    isAdminAuthenticated,
    adminLogin,
    adminLogout,
    currentServerPrice,
    isEarlyBirdActive
  } = useNetVidyaStore();
  const { openStudio } = useSiteContent();

  const [activeTab, setActiveTab] = useState<'upload_pdf' | 'upload_test' | 'pricing' | 'buyers' | 'manual_access'>('upload_pdf');

  // PIN Gate State
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);

  // PDF Form State
  const [pdfTitle, setPdfTitle] = useState('');
  const [pdfCategory, setPdfCategory] = useState('Paper II: English');
  const [pdfDescription, setPdfDescription] = useState('');
  const [pdfSizeMb, setPdfSizeMb] = useState(5.0);
  const [selectedPdfFile, setSelectedPdfFile] = useState<File | null>(null);

  // Test Form State
  const [testTitle, setTestTitle] = useState('');
  const [testCategory, setTestCategory] = useState('Full Mock');
  const [testDuration, setTestDuration] = useState(180);
  const [testQuestions, setTestQuestions] = useState(100);
  const [testReleaseDate, setTestReleaseDate] = useState('2026-11-10T00:00');
  const [testDescription, setTestDescription] = useState('');
  const [selectedTestFile, setSelectedTestFile] = useState<File | null>(null);

  // Manual Buyer Form State
  const [manualName, setManualName] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualMobile, setManualMobile] = useState('');
  const [manualAmount, setManualAmount] = useState(currentServerPrice);

  // Pricing Form State
  const [earlyPriceInput, setEarlyPriceInput] = useState(settings.earlyBirdPrice);
  const [standardPriceInput, setStandardPriceInput] = useState(settings.standardPrice);
  const [cutoffDateInput, setCutoffDateInput] = useState(settings.earlyBirdCutoff.slice(0, 16));

  // Buyer Search State
  const [buyerSearch, setBuyerSearch] = useState('');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Universal Escape key listener
  useModalEscape(isOpen, onClose);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim()) return;
    setIsVerifyingPin(true);
    setPinError(null);
    const result = await adminLogin(pinInput.trim());
    setIsVerifyingPin(false);
    if (!result.success) {
      setPinError(result.error || 'Invalid Admin PIN or credentials.');
    } else {
      setPinInput('');
      showToast('Admin Studio unlocked successfully.');
    }
  };

  const handlePdfFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedPdfFile(file);
      if (!pdfTitle.trim()) {
        setPdfTitle(file.name.replace(/\.pdf$/i, '').replace(/[-_]/g, ' '));
      }
      const mb = Number((file.size / (1024 * 1024)).toFixed(1));
      setPdfSizeMb(mb > 0 ? mb : 4.5);
    }
  };

  const handleTestFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedTestFile(file);
      if (!testTitle.trim()) {
        setTestTitle(file.name.replace(/\.html$/i, '').replace(/[-_]/g, ' '));
      }
    }
  };

  const handleAddPdfSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfTitle.trim()) return;

    addReadingFile({
      title: pdfTitle.trim(),
      category: pdfCategory,
      description: pdfDescription.trim() || 'Official study materials for GSET + UGC NET English Final Pack 2026.',
      fileSizeMb: Number(pdfSizeMb) || 4.5
    });

    setPdfTitle('');
    setPdfDescription('');
    setSelectedPdfFile(null);
    showToast('New PDF Reading Dossier published successfully! Visible to all buyers.');
  };

  const handleAddTestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testTitle.trim()) return;

    const releaseIso = new Date(testReleaseDate).toISOString();

    addTest({
      title: testTitle.trim(),
      category: testCategory,
      totalQuestions: Number(testQuestions) || 100,
      durationMinutes: Number(testDuration) || 180,
      releaseDate: releaseIso,
      description: testDescription.trim() || 'NTA-style computer-based exam module.'
    });

    setTestTitle('');
    setTestDescription('');
    setSelectedTestFile(null);
    showToast('New NTA Test added! It will open automatically on the chosen release date.');
  };

  const handleAddManualBuyerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualEmail.trim() || !manualName.trim()) return;

    addManualBuyer({
      name: manualName,
      email: manualEmail,
      mobile: manualMobile,
      amountPaid: Number(manualAmount)
    });

    setManualName('');
    setManualEmail('');
    setManualMobile('');
    showToast(`Access pass granted manually to ${manualEmail}!`);
  };

  const handleSavePricing = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedCutoff = new Date(cutoffDateInput).toISOString();
    updateSettings({
      earlyBirdPrice: Number(earlyPriceInput),
      standardPrice: Number(standardPriceInput),
      earlyBirdCutoff: updatedCutoff
    });
    showToast('Pricing and offer deadline updated successfully! Server pricing synchronized.');
  };

  // 1. PIN / Password Gate for unauthenticated visitors
  if (!isAdminAuthenticated) {
    return (
      <div
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      >
        <div className="bg-white rounded-3xl max-w-md w-full my-auto p-5 sm:p-7 shadow-2xl border border-gray-200 space-y-5 relative animate-fade-in text-center max-h-[calc(100dvh-2rem)] overflow-y-auto">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
            title="Close (Esc)"
            aria-label="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mx-auto border border-blue-200">
            <KeyRound className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-mono font-bold uppercase">
              <Lock className="w-3 h-3" />
              <span>Admin Authentication Required</span>
            </div>
            <h2 className="text-xl font-extrabold text-gray-900">Dr. Rajnikant Admin Studio</h2>
            <p className="text-xs text-gray-500 leading-relaxed">
              Protected management environment for course dossiers, mock tests, and student records. Enter admin credentials to proceed.
            </p>
          </div>

          {pinError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{pinError}</span>
            </div>
          )}

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 text-left mb-1.5">Admin Security PIN / Password</label>
              <input
                type="password"
                required
                autoFocus
                value={pinInput}
                onChange={e => setPinInput(e.target.value)}
                placeholder="Enter PIN (e.g. 2026)"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 text-center text-sm font-mono tracking-widest focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={isVerifyingPin}
              className="w-full py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isVerifyingPin ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4" />
                  <span>Unlock Admin Studio</span>
                </>
              )}
            </button>
          </form>

          {/* Direct Link to Unified Author Studio */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-left space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
              <Shield className="w-3.5 h-3.5 text-blue-700" />
              <span>Unified Author Studio</span>
            </div>
            <p className="text-[11px] text-blue-700 leading-snug">
              Store administration, mock test scheduling, and student dossiers have been merged into the main Author Studio.
            </p>
            <button
              type="button"
              onClick={() => {
                onClose();
                openStudio('store');
              }}
              className="w-full py-2 px-3 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <span>Open Unified Author Studio</span>
            </button>
          </div>

          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
            <span>Author Management Portal</span>
            <button
              onClick={onClose}
              className="hover:text-gray-700 font-medium transition-colors"
            >
              Cancel and Return
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Authenticated Admin Studio
  const filteredBuyers = buyersRegistry.filter(b => {
    if (!buyerSearch.trim()) return true;
    const q = buyerSearch.toLowerCase().trim();
    return (
      (b.name && b.name.toLowerCase().includes(q)) ||
      (b.email && b.email.toLowerCase().includes(q)) ||
      (b.mobile && b.mobile.includes(q)) ||
      (b.orderId && b.orderId.toLowerCase().includes(q))
    );
  });

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
    >
      <div className="bg-white rounded-3xl max-w-5xl w-full my-auto p-5 sm:p-8 shadow-2xl border border-gray-200 space-y-5 relative max-h-[92dvh] flex flex-col animate-fade-in">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-200 pb-4 shrink-0">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono uppercase bg-blue-100 text-blue-800 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Shield className="w-3 h-3 text-blue-700" />
                <span>Dr. Rajnikant Dodiya Admin Studio</span>
              </span>
              <span className="text-xs text-emerald-700 font-mono font-bold bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                Live Server Price: ₹{currentServerPrice} {isEarlyBirdActive ? '(Early-Bird)' : '(Standard)'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
              Store Manager & Content Administration
            </h2>
            <p className="text-xs text-gray-500">
              Manage reading files, test release dates, pricing, and student enrollments without editing code.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={adminLogout}
              className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors flex items-center gap-1.5 text-xs font-semibold"
              title="Lock Admin Studio"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Lock</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
              title="Close Admin Studio (Esc)"
              aria-label="Close Admin Studio (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="p-3 bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shrink-0 animate-fade-in shadow-md">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs border-b border-gray-200 shrink-0">
          {[
            { id: 'upload_pdf', label: '1. Upload PDF Dossier', icon: FileText },
            { id: 'upload_test', label: '2. Upload Test (With Date)', icon: Clock },
            { id: 'pricing', label: '3. Pricing & Offer Date', icon: DollarSign },
            { id: 'buyers', label: `4. Buyers Registry (${buyersRegistry.length})`, icon: Users },
            { id: 'manual_access', label: '5. Manual UPI Grant', icon: Plus }
          ].map(t => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`px-3.5 py-2 rounded-xl font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-1">
          
          {/* TAB 1: Upload PDF */}
          {activeTab === 'upload_pdf' && (
            <div className="space-y-6">
              <form onSubmit={handleAddPdfSubmit} className="bg-gray-50 p-5 rounded-2xl border border-gray-200 space-y-4">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-blue-700" />
                  <span>Publish New Reading PDF for All Buyers</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Genuine File Picker */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Select PDF File (.pdf)</label>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handlePdfFileChange}
                      className="w-full text-xs text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border border-gray-300 rounded-xl p-1.5 bg-white"
                    />
                    {selectedPdfFile && (
                      <span className="text-[11px] text-emerald-700 font-medium mt-1 block">
                        Selected: <strong>{selectedPdfFile.name}</strong> ({(selectedPdfFile.size / (1024 * 1024)).toFixed(2)} MB)
                      </span>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Dossier / File Title *</label>
                    <input
                      type="text"
                      required
                      value={pdfTitle}
                      onChange={e => setPdfTitle(e.target.value)}
                      placeholder="e.g. Unit 3: Cultural Studies Master Dossier"
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-blue-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Subject Category</label>
                    <select
                      value={pdfCategory}
                      onChange={e => setPdfCategory(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-blue-600 outline-none"
                    >
                      <option value="High-Yield Dossier">High-Yield Dossier</option>
                      <option value="Literary Theory">Literary Theory</option>
                      <option value="British Literature">British Literature</option>
                      <option value="Pedagogy & ELT">Pedagogy & ELT</option>
                      <option value="Research Methodology">Research Methodology</option>
                      <option value="Indian English Writing">Indian English Writing</option>
                      <option value="General Revision">General Revision</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">File Size (MB)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={pdfSizeMb}
                      onChange={e => setPdfSizeMb(Number(e.target.value))}
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-blue-600 outline-none font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Description / Key Highlights</label>
                    <textarea
                      rows={2}
                      value={pdfDescription}
                      onChange={e => setPdfDescription(e.target.value)}
                      placeholder="Summary of chapters, theorists, or high-frequency formulas covered..."
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-blue-600 outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Publish to Student Dashboards</span>
                </button>
              </form>

              {/* Current List */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-gray-900 block">Existing Reading Files ({readingFiles.length})</span>
                {readingFiles.map(file => (
                  <div key={file.id} className="p-3.5 rounded-xl border border-gray-200 bg-white flex items-center justify-between text-xs">
                    <div>
                      <strong className="text-gray-900 block">{file.title}</strong>
                      <span className="text-gray-500 font-mono text-[11px]">{file.category} • {file.fileSizeMb} MB</span>
                    </div>
                    <button
                      onClick={() => deleteReadingFile(file.id)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Remove File"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: Upload Test (With Release Date) */}
          {activeTab === 'upload_test' && (
            <div className="space-y-6">
              <form onSubmit={handleAddTestSubmit} className="bg-gray-50 p-5 rounded-2xl border border-gray-200 space-y-4">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-700" />
                  <span>Upload & Schedule a New NTA Test Module</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Genuine HTML File Picker */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Select Ready-Made Test HTML File (.html)</label>
                    <input
                      type="file"
                      accept=".html"
                      onChange={handleTestFileChange}
                      className="w-full text-xs text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border border-gray-300 rounded-xl p-1.5 bg-white"
                    />
                    {selectedTestFile && (
                      <span className="text-[11px] text-emerald-700 font-medium mt-1 block">
                        Selected: <strong>{selectedTestFile.name}</strong>
                      </span>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Test Title *</label>
                    <input
                      type="text"
                      required
                      value={testTitle}
                      onChange={e => setTestTitle(e.target.value)}
                      placeholder="e.g. NET Mock 7: Contemporary Literary Theory"
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-blue-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
                    <select
                      value={testCategory}
                      onChange={e => setTestCategory(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-blue-600 outline-none"
                    >
                      <option value="Full Mock">Full Mock (100 Qs / 180 Min)</option>
                      <option value="Unit Test">Unit Test (50 Qs / 90 Min)</option>
                      <option value="Bonus Mock">Bonus Mock (50 Qs / 75 Min)</option>
                      <option value="GSET Special">GSET Special</option>
                      <option value="Grand Final">Grand Final</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Release Date & Time (Opens on [date]) *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={testReleaseDate}
                      onChange={e => setTestReleaseDate(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-blue-600 outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Total Questions</label>
                    <input
                      type="number"
                      value={testQuestions}
                      onChange={e => setTestQuestions(Number(e.target.value))}
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-blue-600 outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Duration (Minutes)</label>
                    <input
                      type="number"
                      value={testDuration}
                      onChange={e => setTestDuration(Number(e.target.value))}
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-blue-600 outline-none font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Short Description</label>
                    <textarea
                      rows={2}
                      value={testDescription}
                      onChange={e => setTestDescription(e.target.value)}
                      placeholder="Syllabus coverage, question structure, key notes..."
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-blue-600 outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Schedule Test in Test Hall</span>
                </button>
              </form>

              {/* Current Test Hall Schedule */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-gray-900 block">Scheduled Test Hall Modules ({tests.length})</span>
                {tests.map(test => {
                  const isLocked = new Date() < new Date(test.releaseDate);
                  const releaseText = new Date(test.releaseDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  });

                  return (
                    <div key={test.id} className="p-3.5 rounded-xl border border-gray-200 bg-white flex items-center justify-between text-xs">
                      <div>
                        <strong className="text-gray-900 block">{test.title}</strong>
                        <span className="text-gray-500 font-mono text-[11px]">
                          {test.category} • {test.totalQuestions} Qs • {isLocked ? `Opens ${releaseText}` : 'Active / Ready Now'}
                        </span>
                      </div>
                      <button
                        onClick={() => deleteTest(test.id)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Test"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: Pricing & Offer Controls */}
          {activeTab === 'pricing' && (
            <form onSubmit={handleSavePricing} className="bg-gray-50 p-5 rounded-2xl border border-gray-200 space-y-4">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-700" />
                <span>Price Rule & Offer End Date Configuration</span>
              </h3>
              <p className="text-xs text-gray-600">
                Authoritative requirement: <strong>₹799 until 10 Nov 2026, 11:59 pm IST</strong>, then <strong>₹999</strong> automatically. Server-side enforced.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Early-Bird Price (INR)</label>
                  <input
                    type="number"
                    value={earlyPriceInput}
                    onChange={e => setEarlyPriceInput(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-blue-600 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Standard Price After Offer (INR)</label>
                  <input
                    type="number"
                    value={standardPriceInput}
                    onChange={e => setStandardPriceInput(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-blue-600 outline-none font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Early-Bird Cutoff Date & Time (Auto-Switch Point)
                  </label>
                  <input
                    type="datetime-local"
                    value={cutoffDateInput}
                    onChange={e => setCutoffDateInput(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-blue-600 outline-none font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Save Pricing Rules</span>
              </button>
            </form>
          )}

          {/* TAB 4: Buyers Registry & True Excel (.xlsx) Export */}
          {activeTab === 'buyers' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Enrolled Student Registry</h3>
                  <p className="text-xs text-gray-500">
                    Total Enrolled: <strong>{buyersRegistry.length} Scholars</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={exportBuyersToExcel}
                    className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
                    title="Generate genuine OpenXML .xlsx spreadsheet"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export to Excel (.xlsx)</span>
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={buyerSearch}
                  onChange={e => setBuyerSearch(e.target.value)}
                  placeholder="Search students by name, email, phone, or order ID..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-100 text-gray-700 border-b border-gray-200">
                    <tr>
                      <th className="p-3 font-semibold">Candidate</th>
                      <th className="p-3 font-semibold">Contact</th>
                      <th className="p-3 font-semibold">Order ID</th>
                      <th className="p-3 font-semibold">Amount</th>
                      <th className="p-3 font-semibold">Status</th>
                      <th className="p-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredBuyers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-gray-500 text-xs">
                          No student records matched your search query.
                        </td>
                      </tr>
                    ) : (
                      filteredBuyers.map(b => (
                        <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                          <td className="p-3 font-medium text-gray-900">{b.name}</td>
                          <td className="p-3 font-mono text-[11px] text-gray-600">
                            {b.email}<br />{b.mobile}
                          </td>
                          <td className="p-3 font-mono text-[11px] text-gray-600">{b.orderId}</td>
                          <td className="p-3 font-bold text-gray-900">₹{b.amountPaid}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              b.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {b.isActive ? 'Active' : 'Revoked'}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-3">
                              <button
                                onClick={async () => {
                                  const res = await resendConfirmationEmail(b.email);
                                  showToast(res.message || `Confirmation email resent to ${b.email}`);
                                }}
                                className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 hover:underline"
                                title="Resend Purchase Confirmation Email with Dashboard Link"
                              >
                                <Mail className="w-3.5 h-3.5" />
                                <span>Resend Email</span>
                              </button>
                              <button
                                onClick={() => toggleBuyerAccess(b.id)}
                                className={`text-[11px] font-semibold underline ${
                                  b.isActive ? 'text-rose-700 hover:text-rose-900' : 'text-blue-700 hover:text-blue-900'
                                }`}
                              >
                                {b.isActive ? 'Revoke Access' : 'Grant Access'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: Manual UPI Grant */}
          {activeTab === 'manual_access' && (
            <form onSubmit={handleAddManualBuyerSubmit} className="bg-gray-50 p-5 rounded-2xl border border-gray-200 space-y-4">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-700" />
                <span>Grant Access Manually (Direct UPI / Bank Transfer)</span>
              </h3>
              <p className="text-xs text-gray-600">
                If a candidate paid directly via Google Pay, PhonePe, or bank transfer, enter their details to immediately grant full Test Hall & Reading File access.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Student Full Name *</label>
                  <input
                    type="text"
                    required
                    value={manualName}
                    onChange={e => setManualName(e.target.value)}
                    placeholder="e.g. Ramesh Patel"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Student Email Address *</label>
                  <input
                    type="email"
                    required
                    value={manualEmail}
                    onChange={e => setManualEmail(e.target.value)}
                    placeholder="e.g. ramesh@gmail.com"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Mobile Number</label>
                  <input
                    type="tel"
                    value={manualMobile}
                    onChange={e => setManualMobile(e.target.value)}
                    placeholder="9876543210"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-blue-600 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Amount Received (INR)</label>
                  <input
                    type="number"
                    value={manualAmount}
                    onChange={e => setManualAmount(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-blue-600 outline-none font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Grant Immediate Student Access</span>
              </button>
            </form>
          )}

        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 pt-3 flex items-center justify-between text-xs text-gray-500 shrink-0">
          <span>Sold by NET Vidya. Content curated by Dr. Rajnikant Dodiya.</span>
          <div className="flex items-center gap-2">
            <button
              onClick={adminLogout}
              className="px-3.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-colors"
            >
              Sign Out Admin
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-gray-900 hover:bg-black text-white font-semibold transition-colors"
            >
              Close Studio
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
