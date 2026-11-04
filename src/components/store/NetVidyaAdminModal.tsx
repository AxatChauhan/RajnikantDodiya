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
  Sparkles
} from 'lucide-react';
import { useNetVidyaStore } from '../../contexts/NetVidyaStoreContext';

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
    currentServerPrice,
    isEarlyBirdActive
  } = useNetVidyaStore();

  const [activeTab, setActiveTab] = useState<'upload_pdf' | 'upload_test' | 'pricing' | 'buyers' | 'manual_access'>('upload_pdf');

  // PDF Form State
  const [pdfTitle, setPdfTitle] = useState('');
  const [pdfCategory, setPdfCategory] = useState('Paper II: English');
  const [pdfDescription, setPdfDescription] = useState('');
  const [pdfSizeMb, setPdfSizeMb] = useState(5.0);

  // Test Form State
  const [testTitle, setTestTitle] = useState('');
  const [testCategory, setTestCategory] = useState('Full Mock');
  const [testDuration, setTestDuration] = useState(180);
  const [testQuestions, setTestQuestions] = useState(100);
  const [testReleaseDate, setTestReleaseDate] = useState('2026-11-10T00:00');
  const [testDescription, setTestDescription] = useState('');

  // Manual Buyer Form State
  const [manualName, setManualName] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualMobile, setManualMobile] = useState('');
  const [manualAmount, setManualAmount] = useState(799);

  // Pricing Form State
  const [earlyPriceInput, setEarlyPriceInput] = useState(settings.earlyBirdPrice);
  const [standardPriceInput, setStandardPriceInput] = useState(settings.standardPrice);
  const [cutoffDateInput, setCutoffDateInput] = useState(settings.earlyBirdCutoff.slice(0, 16));

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
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
    updateSettings({
      earlyBirdPrice: Number(earlyPriceInput),
      standardPrice: Number(standardPriceInput),
      earlyBirdCutoff: new Date(cutoffDateInput).toISOString()
    });
    showToast('Pricing and offer deadline updated successfully!');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-gray-200 space-y-6 relative max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-200 pb-4 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase bg-blue-100 text-blue-800 font-bold px-2.5 py-0.5 rounded-full">
                Dr. Rajnikant Dodiya Admin
              </span>
              <span className="text-xs text-emerald-700 font-mono font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Live Server Price: ₹{currentServerPrice} {isEarlyBirdActive ? '(Early-Bird)' : '(Standard)'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
              Store Manager & Content Administration
            </h2>
            <p className="text-xs text-gray-500">
              Manage reading files, test release dates, pricing, and student enrollments without code.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="p-3 bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shrink-0">
            <CheckCircle2 className="w-4 h-4" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs border-b border-gray-200 shrink-0">
          {[
            { id: 'upload_pdf', label: '1. Upload PDF Dossier', icon: FileText },
            { id: 'upload_test', label: '2. Upload Test (With Date)', icon: Clock },
            { id: 'pricing', label: '3. Pricing & Offer Date', icon: DollarSign },
            { id: 'buyers', label: `4. Buyers (${buyersRegistry.length})`, icon: Users },
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
                    ? 'bg-blue-700 text-white shadow-2xs'
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
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Dossier / File Title *</label>
                    <input
                      type="text"
                      required
                      value={pdfTitle}
                      onChange={e => setPdfTitle(e.target.value)}
                      placeholder="e.g. Cultural Studies Rapid Revision Dossier"
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
                      <option value="Literary Theory">Literary Theory</option>
                      <option value="British Literature">British Literature</option>
                      <option value="Pedagogy & ELT">Pedagogy & ELT</option>
                      <option value="Research Methodology">Research Methodology</option>
                      <option value="Indian English Writing">Indian English Writing</option>
                      <option value="General Revision">General Revision</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Estimated Size (MB)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={pdfSizeMb}
                      onChange={e => setPdfSizeMb(Number(e.target.value))}
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-blue-600 outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Description / Key Highlights</label>
                    <textarea
                      rows={2}
                      value={pdfDescription}
                      onChange={e => setPdfDescription(e.target.value)}
                      placeholder="Summary of chapters, theorists, or question banks covered..."
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-blue-600 outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-xs transition-colors"
                >
                  Publish to Student Dashboards
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
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Test Title *</label>
                    <input
                      type="text"
                      required
                      value={testTitle}
                      onChange={e => setTestTitle(e.target.value)}
                      placeholder="e.g. NET Mock 6: Comprehensive Grand Final"
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
                      placeholder="Syllabus focus, question types..."
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-blue-600 outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-xs transition-colors"
                >
                  Schedule Test in Test Hall
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
                Brief requirement: <strong>₹799 until 10 Nov 2026, 11:59 pm IST</strong>, then <strong>₹999</strong> automatically. Decided on server.
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
                className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-colors"
              >
                Save Pricing Rules
              </button>
            </form>
          )}

          {/* TAB 4: Buyers Registry & Excel Export */}
          {activeTab === 'buyers' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Enrolled Student Registry</h3>
                  <p className="text-xs text-gray-500">
                    Total Enrolled: <strong>{buyersRegistry.length} Scholars</strong>
                  </p>
                </div>

                <button
                  onClick={exportBuyersToExcel}
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export to Excel (CSV)</span>
                </button>
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
                      <th className="p-3 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {buyersRegistry.map(b => (
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
                          <button
                            onClick={() => toggleBuyerAccess(b.id)}
                            className="text-[11px] font-semibold text-blue-700 hover:text-blue-900 underline"
                          >
                            {b.isActive ? 'Revoke Access' : 'Restore Access'}
                          </button>
                        </td>
                      </tr>
                    ))}
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
                className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-xs transition-colors"
              >
                Grant Immediate Student Access
              </button>
            </form>
          )}

        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 pt-3 flex items-center justify-between text-xs text-gray-500 shrink-0">
          <span>Dr. Rajnikant Dodiya • Academic Director</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold"
          >
            Close Admin
          </button>
        </div>

      </div>
    </div>
  );
};
