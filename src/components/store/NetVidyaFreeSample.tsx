import React, { useState } from 'react';
import {
  Sparkles,
  BookOpen,
  FileText,
  CheckCircle2,
  Download,
  ArrowRight,
  ShieldCheck,
  Clock,
  Play
} from 'lucide-react';
import { NtaTestRunnerModal } from './NtaTestRunnerModal';
import { useNetVidyaStore } from '../../contexts/NetVidyaStoreContext';

interface NetVidyaFreeSampleProps {
  onOpenCheckout: () => void;
  onNavigateHome: () => void;
}

export const NetVidyaFreeSample: React.FC<NetVidyaFreeSampleProps> = ({
  onOpenCheckout,
  onNavigateHome
}) => {
  const { currentServerPrice, isEarlyBirdActive } = useNetVidyaStore();
  const [isDemoRunning, setIsDemoRunning] = useState(false);
  const [downloadToast, setDownloadToast] = useState<string | null>(null);

  const handleDownloadSamplePdf = (filename: string, label: string) => {
    // Download real static PDF file directly from /sample-materials/
    const filePath = `/sample-materials/${filename}`;
    const a = document.createElement('a');
    a.href = filePath;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setDownloadToast(`Downloaded ${label}!`);
    setTimeout(() => setDownloadToast(null), 3000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12 space-y-10 animate-fade-in">
      
      {/* Toast Alert */}
      {downloadToast && (
        <div className="fixed top-20 right-4 z-50 bg-emerald-700 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-semibold animate-fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>{downloadToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>100% Free Public Sample • No Login Required</span>
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
          Experience the NTA Test Hall & Sample Materials
        </h1>
        <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
          Test-drive the actual online computer-based exam environment, inspect our analytical answer explanations, and download free revision study samples before enrolling.
        </p>
      </div>

      {/* Core Sample Deliverables Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* CARD 1: Interactive CBT Demo Test */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-blue-200 shadow-md flex flex-col justify-between hover:shadow-lg transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-blue-500/10 rounded-bl-full pointer-events-none" />
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Play className="w-6 h-6 ml-0.5" />
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase font-bold text-blue-600">Live Simulation</span>
              <h3 className="text-lg font-bold text-gray-900 mt-0.5">Free Demo NTA Mock Test</h3>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Experience the actual NTA screen interface with question palette, 30-minute timer, color legends, and instant diagnostic score review.
            </p>
            <ul className="text-xs text-gray-500 space-y-1.5 pt-1">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>10 Authentic Paper II English MCQs</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>NTA CBT Interface with Palette & 30-min Timer</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Instant Scorecard + Zero login required</span>
              </li>
            </ul>
          </div>

          <div className="pt-6 space-y-2">
            <button
              onClick={() => window.open('/sample-materials/ugc-demo/Free_Demo_Test.html', '_blank')}
              className="w-full py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Launch Free Demo CBT Test</span>
            </button>
            <button
              onClick={() => window.open('/sample-materials/ugc-demo/sample_notes/index.html', '_blank')}
              className="w-full py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              <span>Read Free Sample Notes (15 Pages)</span>
            </button>
          </div>
        </div>

        {/* CARD 2: Free 25-Question Mini Mock PDF */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-emerald-200 shadow-md flex flex-col justify-between hover:shadow-lg transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/10 rounded-bl-full pointer-events-none" />
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase font-bold text-emerald-700">Printable PDF</span>
              <h3 className="text-lg font-bold text-gray-900 mt-0.5">25-Question Mini Mock PDF</h3>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Curated diagnostic questions covering British Drama, Postcolonialism, Research Methodology, and Indian Writing in English.
            </p>
            <ul className="text-xs text-gray-500 space-y-1.5 pt-1">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Standard UGC-NET Paper II Format</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Offline study & print-friendly</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Instant 1-click download</span>
              </li>
            </ul>
          </div>

          <div className="pt-6">
            <button
              onClick={() => handleDownloadSamplePdf('NetVidya_25_Question_Mini_Mock.pdf', '25-Question Mini Mock PDF')}
              className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Download Free Mini Mock (PDF)</span>
            </button>
          </div>
        </div>

        {/* CARD 3: Free Model Answers & Explanations PDF */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-amber-200 shadow-md flex flex-col justify-between hover:shadow-lg transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-amber-500/10 rounded-bl-full pointer-events-none" />
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase font-bold text-amber-700">Analytical Rationale</span>
              <h3 className="text-lg font-bold text-gray-900 mt-0.5">Model Answers & Explanations</h3>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Detailed analytical rationale prepared by Dr. Rajnikant Dodiya explaining why specific distractors are incorrect and citing theoretical authorities.
            </p>
            <ul className="text-xs text-gray-500 space-y-1.5 pt-1">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Theory & Historical Citations</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Elimination strategies for tricky options</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Sample of our paid reading dossiers</span>
              </li>
            </ul>
          </div>

          <div className="pt-6">
            <button
              onClick={() => handleDownloadSamplePdf('NetVidya_Model_Answers_Sample.pdf', 'Model Answers & Explanations PDF')}
              className="w-full py-3 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Download Model Answers (PDF)</span>
            </button>
          </div>
        </div>

      </div>

      {/* Sticky Bottom Conversion Bar */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6 border border-blue-800">
        <div className="space-y-2 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-mono text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Enrollment Open • Access through 31 Dec 2026</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold">
            Ready to Unlock the Full Final Pack 2026?
          </h3>
          <p className="text-xs sm:text-sm text-blue-200 max-w-xl">
            Get all 5 Full Mocks + Unit-wise Tests + 5 Bonus Practice Mocks + Complete Reading Files for just <strong>₹{currentServerPrice}</strong> {isEarlyBirdActive ? '(Early-Bird Price until 10 Nov)' : ''}.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full sm:w-auto">
          <button
            onClick={onNavigateHome}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs sm:text-sm font-medium transition-colors"
          >
            Review Syllabus
          </button>
          <button
            onClick={onOpenCheckout}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs sm:text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2 hover:scale-[1.02]"
          >
            <span>Buy Final Pack — ₹{currentServerPrice}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Embedded NTA Test Runner in Free Demo Mode */}
      {isDemoRunning && (
        <NtaTestRunnerModal
          isOpen={isDemoRunning}
          onClose={() => setIsDemoRunning(false)}
          testTitle="NET Vidya Free Demo Test (Paper II Sample)"
          isFreeDemo={true}
          candidateName="Guest Scholar"
        />
      )}
    </div>
  );
};
