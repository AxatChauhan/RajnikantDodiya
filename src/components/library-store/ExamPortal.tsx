import React, { useState, useEffect, useMemo } from 'react';
import {
  getActiveExamQuestions,
  evaluateExamSubmission,
  ActiveExamQuestion,
  ExamEvaluationResult
} from '../../data/storeCatalogData';
import { unmaskAnswer } from '../../lib/security';
import { Clock, CheckCircle2, AlertCircle, Bookmark, Award, X, RotateCcw, ChevronRight, ChevronLeft, ShieldCheck, FileText, Lock } from 'lucide-react';

interface ExamPortalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  orderId: string;
  isUnlocked?: boolean;
  onUnlockRequest?: () => void;
}

type QuestionStatus = 'unvisited' | 'not_answered' | 'answered' | 'marked_review';

export const ExamPortal: React.FC<ExamPortalProps> = ({
  isOpen,
  onClose,
  studentName,
  orderId,
  isUnlocked = false,
  onUnlockRequest
}) => {
  const sessionKey = `cbt_exam_draft_${orderId || 'demo'}`;

  // Restore draft state on mount if available
  const [currentIdx, setCurrentIdx] = useState<number>(() => {
    try {
      const saved = sessionStorage.getItem(sessionKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.currentIdx === 'number') return parsed.currentIdx;
      }
    } catch {}
    return 0;
  });

  const [answers, setAnswers] = useState<Record<number, number>>(() => {
    try {
      const saved = sessionStorage.getItem(sessionKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.answers && typeof parsed.answers === 'object') return parsed.answers;
      }
    } catch {}
    return {};
  });

  const [statuses, setStatuses] = useState<Record<number, QuestionStatus>>(() => {
    try {
      const saved = sessionStorage.getItem(sessionKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.statuses && typeof parsed.statuses === 'object') return parsed.statuses;
      }
    } catch {}
    return {};
  });

  const [timeLeft, setTimeLeft] = useState<number>(() => {
    try {
      const saved = sessionStorage.getItem(sessionKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.timeLeft === 'number' && parsed.timeLeft > 0) return parsed.timeLeft;
      }
    } catch {}
    return 60 * 60; // 60 minutes
  });

  const [examSubmitted, setExamSubmitted] = useState<boolean>(() => {
    try {
      const saved = sessionStorage.getItem(sessionKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.examSubmitted === 'boolean') return parsed.examSubmitted;
      }
    } catch {}
    return false;
  });

  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [isMobilePaletteOpen, setIsMobilePaletteOpen] = useState(false);
  const [focusLossWarnings, setFocusLossWarnings] = useState<number>(0);

  // CBT Anti-Cheat: Monitor Tab/Window Visibility
  useEffect(() => {
    if (!isOpen || examSubmitted) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setFocusLossWarnings(prev => prev + 1);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isOpen, examSubmitted]);

  // Autosave progress to sessionStorage
  useEffect(() => {
    if (!isOpen) return;
    try {
      sessionStorage.setItem(sessionKey, JSON.stringify({
        currentIdx,
        answers,
        statuses,
        timeLeft,
        examSubmitted
      }));
    } catch {}
  }, [isOpen, sessionKey, currentIdx, answers, statuses, timeLeft, examSubmitted]);

  // Initialize status of first question
  useEffect(() => {
    if (isOpen && !examSubmitted) {
      setStatuses(prev => ({
        ...prev,
        [0]: prev[0] === 'answered' || prev[0] === 'marked_review' ? prev[0] : 'not_answered'
      }));
    }
  }, [isOpen, currentIdx, examSubmitted]);

  // Exam Countdown Timer
  useEffect(() => {
    if (!isOpen || examSubmitted) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setExamSubmitted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, examSubmitted]);

  // Lock background scrolling when CBT Exam Portal is open
  useEffect(() => {
    if (isOpen) {
      const origOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = origOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Scoped active questions (Zero answers/explanations exposed in active state)
  const activeQuestions: ActiveExamQuestion[] = getActiveExamQuestions(isUnlocked);
  const totalQuestions = activeQuestions.length;

  const currentQ: ActiveExamQuestion = activeQuestions[currentIdx] || activeQuestions[0];

  // Helper formatting
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = (optIdx: number) => {
    if (examSubmitted) return;
    setAnswers(prev => ({ ...prev, [currentIdx]: optIdx }));
  };

  const handleSaveAndNext = () => {
    const hasAnswered = answers[currentIdx] !== undefined;
    setStatuses(prev => ({
      ...prev,
      [currentIdx]: hasAnswered ? 'answered' : 'not_answered'
    }));

    if (currentIdx + 1 < totalQuestions) {
      const nextIdx = currentIdx + 1;
      setCurrentIdx(nextIdx);
      if (!statuses[nextIdx] || statuses[nextIdx] === 'unvisited') {
        setStatuses(prev => ({ ...prev, [nextIdx]: 'not_answered' }));
      }
    } else {
      // Reached the final question -> trigger submission confirmation
      setShowConfirmSubmit(true);
    }
  };

  const handleMarkReview = () => {
    setStatuses(prev => ({ ...prev, [currentIdx]: 'marked_review' }));
    if (currentIdx + 1 < totalQuestions) {
      setCurrentIdx(prev => prev + 1);
    }
  };

  const handleClearResponse = () => {
    setAnswers(prev => {
      const next = { ...prev };
      delete next[currentIdx];
      return next;
    });
    setStatuses(prev => ({ ...prev, [currentIdx]: 'not_answered' }));
  };

  const handleJumpTo = (idx: number) => {
    setCurrentIdx(idx);
    if (!statuses[idx] || statuses[idx] === 'unvisited') {
      setStatuses(prev => ({ ...prev, [idx]: 'not_answered' }));
    }
  };

  // Evaluation computed strictly upon submission
  const evaluation: ExamEvaluationResult | null = useMemo(() => {
    if (!examSubmitted) return null;
    return evaluateExamSubmission(answers, isUnlocked);
  }, [examSubmitted, answers, isUnlocked]);

  const correctCount = evaluation?.correctCount || 0;
  const incorrectCount = evaluation?.incorrectCount || 0;
  const unattemptedCount = evaluation?.unattemptedCount || 0;
  const answeredCount = evaluation?.answeredCount || 0;
  const totalScore = evaluation?.totalScore || 0;
  const maxScore = evaluation?.maxScore || (totalQuestions * 2);
  const accuracy = evaluation?.accuracy || 0;
  const percentile = evaluation?.percentile || 0;

  const handleRestart = () => {
    try {
      sessionStorage.removeItem(sessionKey);
    } catch {}
    setAnswers({});
    setStatuses({});
    setTimeLeft(60 * 60);
    setCurrentIdx(0);
    setExamSubmitted(false);
    setReviewMode(false);
    setShowConfirmSubmit(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-ink-pure/80 backdrop-blur-md animate-fade-in select-none">
      <div className="folio-card rounded-none sm:rounded-3xl max-w-6xl w-full h-full sm:h-[95vh] flex flex-col justify-between overflow-hidden shadow-book-xl border-0 sm:border border-deckle bg-white">
        
        {/* Top NTA Examination Header */}
        <div className="p-3 sm:px-6 bg-[#FAF7F2] border-b border-deckle flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-claret text-white flex items-center justify-center font-bold font-serif text-xs sm:text-sm shrink-0">
              CBT
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-claret font-bold block">
                NTA UGC-NET / GSET Simulation
              </span>
              <h3 className="font-serif text-xs sm:text-base text-ink font-normal truncate max-w-[150px] xs:max-w-[200px] sm:max-w-md">
                UGC-NET & GSET 2026
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-6 text-xs font-mono">
            {/* Mobile Palette Trigger */}
            {!examSubmitted && (
              <button
                onClick={() => setIsMobilePaletteOpen(true)}
                className="lg:hidden px-2 py-1 rounded-lg bg-white border border-deckle text-xs font-mono text-ink flex items-center gap-1 shadow-2xs"
                title="Open Question Palette"
              >
                <FileText className="w-3.5 h-3.5 text-claret" />
                <span className="font-bold">Q{currentIdx + 1}/{totalQuestions}</span>
              </button>
            )}

            {isUnlocked ? (
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-full font-bold">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>Full Licensed Edition</span>
              </span>
            ) : (
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-0.5 rounded-full font-bold">
                <Lock className="w-3 h-3 text-amber-700" />
                <span>Demo (3 Qs)</span>
              </span>
            )}

            {focusLossWarnings > 0 && !examSubmitted && (
              <span
                className="inline-flex items-center gap-1 text-[10px] font-mono bg-rose-100 text-rose-800 border border-rose-300 px-2 py-0.5 rounded-full font-bold animate-pulse"
                title="Academic Integrity Proctor: Window or tab blur detected"
              >
                <AlertCircle className="w-3 h-3 text-rose-600" />
                <span>Tab Switches: {focusLossWarnings}</span>
              </span>
            )}

            {/* Countdown Clock */}
            {!examSubmitted ? (
              <div className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl border flex items-center gap-1 font-bold text-xs ${
                timeLeft < 300 ? 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse' : 'bg-white text-ink border-deckle'
              }`}>
                <Clock className="w-3.5 h-3.5 text-claret" />
                <span>{formatTime(timeLeft)}</span>
              </div>
            ) : (
              <span className="font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-xl text-xs">
                Evaluated
              </span>
            )}

            <div className="hidden sm:block text-ink-faint">
              Candidate: <strong className="text-ink">{studentName}</strong>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-ink-muted hover:text-claret transition-colors"
              aria-label="Exit exam"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        {!examSubmitted ? (
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
            
            {/* Left Column: Active Question */}
            <div
              className="flex-1 flex flex-col justify-between overflow-hidden select-none"
              onContextMenu={e => e.preventDefault()}
              onCopy={e => e.preventDefault()}
            >
              <div className="flex-1 p-4 sm:p-8 overflow-y-auto space-y-5">
                {!isUnlocked && currentIdx >= 3 ? (
                  <div className="space-y-6 my-auto text-center max-w-lg mx-auto py-8">
                    <div className="w-14 h-14 rounded-2xl bg-claret text-white flex items-center justify-center mx-auto shadow-md">
                      <Lock className="w-7 h-7" />
                    </div>
                    <div className="space-y-2">
                      <span className="text-xs font-mono uppercase tracking-widest text-claret font-bold bg-claret-soft px-3 py-1 rounded-full border border-claret/20 inline-block">
                        Question {currentIdx + 1} Locked • Demo Mode
                      </span>
                      <h4 className="font-serif text-2xl sm:text-3xl text-ink font-normal">
                        Full 25-Question UGC-NET/GSET CBT Simulation
                      </h4>
                      <p className="text-xs sm:text-sm text-ink-muted font-reading leading-relaxed">
                        Questions 4 through 25 contain high-yield problems on British Literature, Post-Method Pedagogy, NEP 2020 frameworks, and Research Methodology. Enroll in the full exam to unlock all 25 questions, the 60-minute NTA countdown, and complete faculty rationales.
                      </p>
                    </div>
                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                      <button
                        onClick={() => {
                          onClose();
                          onUnlockRequest?.();
                        }}
                        className="px-6 py-3 rounded-xl bg-claret hover:bg-claret-light text-white text-xs font-medium shadow-xs transition-all inline-flex items-center gap-2 min-h-[44px]"
                      >
                        <Lock className="w-4 h-4" />
                        <span>Enroll in Full Exam (₹299)</span>
                      </button>
                      <button
                        onClick={() => setCurrentIdx(0)}
                        className="px-5 py-3 rounded-xl bg-white border border-deckle text-xs font-mono text-ink-muted hover:text-ink min-h-[44px]"
                      >
                        Back to Question 1
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      {/* Question Metadata */}
                      <div className="flex items-center justify-between border-b border-deckle pb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-claret bg-claret-soft px-2.5 py-0.5 rounded border border-claret/20">
                            Question {currentIdx + 1} of {totalQuestions} {!isUnlocked && '(Demo)'}
                          </span>
                          <span className="text-xs font-mono text-ink-faint hidden sm:inline">
                            • Marks: +2.0, -0.0
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-ink-muted bg-parchment-warm px-2 py-0.5 rounded border border-deckle">
                          {currentQ.section}
                        </span>
                      </div>

                      {/* Question Text */}
                      <h4 className="font-serif text-base sm:text-xl text-ink font-normal leading-relaxed">
                        {currentQ.question}
                      </h4>

                      {/* 4 Options */}
                      <div className="space-y-2.5 sm:space-y-3 pt-2">
                        {currentQ.options.map((opt, i) => {
                          const isSelected = answers[currentIdx] === i;
                          return (
                            <button
                              key={i}
                              onClick={() => handleSelectOption(i)}
                              className={`w-full text-left p-3 sm:p-4 rounded-xl border text-xs sm:text-sm font-sans transition-all flex items-center gap-3 min-h-[46px] ${
                                isSelected
                                  ? 'bg-claret-soft border-claret text-claret font-medium shadow-xs ring-1 ring-claret/30'
                                  : 'bg-white border-deckle hover:border-claret/40 text-ink-muted hover:bg-parchment-light'
                              }`}
                            >
                              <span className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-mono shrink-0 ${
                                isSelected ? 'bg-claret text-white border-claret' : 'border-deckle text-ink-faint'
                              }`}>
                                {String.fromCharCode(65 + i)}
                              </span>
                              <span className="leading-snug">{opt}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Sticky Bottom Question Controls */}
              {!(currentIdx >= 3 && !isUnlocked) && (
                <div className="p-3 sm:px-6 bg-white/95 backdrop-blur-xs border-t border-deckle flex items-center justify-between gap-2 text-xs font-sans shrink-0">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <button
                      onClick={handleMarkReview}
                      className="px-2.5 sm:px-3.5 py-2 rounded-xl bg-purple-50 text-purple-900 border border-purple-200 hover:bg-purple-100 transition-all min-h-[40px] flex items-center gap-1.5"
                      title="Mark for Review"
                    >
                      <Bookmark className="w-3.5 h-3.5 shrink-0" />
                      <span className="hidden sm:inline">Mark for Review</span>
                      <span className="sm:hidden">Review</span>
                    </button>

                    <button
                      onClick={handleClearResponse}
                      disabled={answers[currentIdx] === undefined}
                      className="px-2.5 sm:px-3.5 py-2 rounded-xl bg-parchment-warm text-ink-muted hover:text-ink disabled:opacity-40 transition-all min-h-[40px]"
                    >
                      Clear
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <button
                      disabled={currentIdx === 0}
                      onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
                      className="p-2 sm:px-3 sm:py-2 rounded-xl bg-parchment-warm text-ink disabled:opacity-40 min-h-[40px] flex items-center gap-1"
                      aria-label="Previous question"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span className="hidden sm:inline">Prev</span>
                    </button>

                    <button
                      onClick={handleSaveAndNext}
                      className={`px-3.5 sm:px-5 py-2 rounded-xl transition-all min-h-[40px] font-medium flex items-center gap-1.5 shadow-xs ${
                        currentIdx + 1 < totalQuestions
                          ? 'bg-claret text-white hover:bg-claret-light'
                          : 'bg-emerald-700 text-white hover:bg-emerald-800 ring-2 ring-emerald-500/30 font-semibold'
                      }`}
                    >
                      <span>{currentIdx + 1 < totalQuestions ? 'Save & Next' : 'Save & Finish'}</span>
                      {currentIdx + 1 < totalQuestions ? (
                        <ChevronRight className="w-4 h-4" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Desktop Right Column: Question Palette (NTA Style) */}
            <div className="hidden lg:flex lg:w-80 bg-[#FAF7F2] border-l border-deckle p-4 sm:p-5 flex-col justify-between shrink-0">
              <div className="space-y-4">
                <span className="text-xs font-mono uppercase tracking-wider text-claret font-bold block">
                  Question Palette ({totalQuestions} MCQs)
                </span>

                {/* Legend */}
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-ink-muted border-b border-deckle pb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                    <span>Answered ({Object.values(statuses).filter(s => s === 'answered').length})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-500 shrink-0" />
                    <span>Not Answered</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-purple-500 shrink-0" />
                    <span>Marked Review</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-slate-300 shrink-0" />
                    <span>Not Visited</span>
                  </div>
                </div>

                {/* Question Buttons Grid */}
                <div className="grid grid-cols-5 gap-2 max-h-56 overflow-y-auto pr-1">
                  {activeQuestions.map((_, i) => {
                    const status = statuses[i] || 'unvisited';
                    const isCurrent = i === currentIdx;
                    const isLocked = !isUnlocked && i >= 3;

                    let bgStyle = 'bg-slate-200 text-slate-700';
                    if (isLocked) {
                      bgStyle = 'bg-stone-100 text-stone-400 border border-deckle';
                    } else if (status === 'answered') {
                      bgStyle = 'bg-emerald-500 text-white font-bold';
                    } else if (status === 'marked_review') {
                      bgStyle = 'bg-purple-600 text-white font-bold';
                    } else if (status === 'not_answered') {
                      bgStyle = 'bg-rose-500 text-white font-bold';
                    }

                    return (
                      <button
                        key={i}
                        onClick={() => handleJumpTo(i)}
                        className={`h-9 rounded-lg text-xs font-mono transition-all flex items-center justify-center gap-0.5 ${bgStyle} ${
                          isCurrent ? 'ring-2 ring-ink-pure scale-105' : ''
                        }`}
                        title={isLocked ? `Question ${i + 1} (Locked - Full Edition)` : `Question ${i + 1}`}
                      >
                        {isLocked ? <Lock className="w-2.5 h-2.5" /> : null}
                        <span>{i + 1}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit Exam Button */}
              <div className="pt-4 border-t border-deckle">
                <button
                  onClick={() => setShowConfirmSubmit(true)}
                  className="w-full py-3 rounded-xl bg-claret hover:bg-claret-light text-white text-xs font-medium transition-all shadow-xs min-h-[44px]"
                >
                  Submit Examination
                </button>
              </div>
            </div>

            {/* Mobile Question Palette Bottom Sheet / Modal */}
            {isMobilePaletteOpen && (
              <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end bg-ink-pure/60 backdrop-blur-xs animate-fade-in">
                <div
                  className="fixed inset-0"
                  onClick={() => setIsMobilePaletteOpen(false)}
                  aria-hidden="true"
                />
                <div className="relative bg-[#FAF7F2] border-t-2 border-brass/50 rounded-t-3xl p-5 shadow-2xl max-h-[85vh] flex flex-col justify-between z-10 space-y-4 animate-slide-up">
                  <div className="w-12 h-1 bg-stone-300 rounded-full mx-auto" />
                  <div className="flex items-center justify-between pb-2 border-b border-deckle">
                    <span className="text-xs font-mono uppercase tracking-wider text-claret font-bold">
                      Question Palette ({totalQuestions} MCQs)
                    </span>
                    <button
                      onClick={() => setIsMobilePaletteOpen(false)}
                      className="p-1 rounded-lg text-ink-muted hover:text-ink"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Legend */}
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-ink-muted border-b border-deckle pb-3">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                      <span>Answered ({Object.values(statuses).filter(s => s === 'answered').length})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-rose-500 shrink-0" />
                      <span>Not Answered</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-purple-500 shrink-0" />
                      <span>Marked Review</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-slate-300 shrink-0" />
                      <span>Not Visited</span>
                    </div>
                  </div>

                  {/* Buttons Grid */}
                  <div className="grid grid-cols-5 gap-2 max-h-56 overflow-y-auto pr-1">
                    {activeQuestions.map((_, i) => {
                      const status = statuses[i] || 'unvisited';
                      const isCurrent = i === currentIdx;
                      const isLocked = !isUnlocked && i >= 3;

                      let bgStyle = 'bg-slate-200 text-slate-700';
                      if (isLocked) {
                        bgStyle = 'bg-stone-100 text-stone-400 border border-deckle';
                      } else if (status === 'answered') {
                        bgStyle = 'bg-emerald-500 text-white font-bold';
                      } else if (status === 'marked_review') {
                        bgStyle = 'bg-purple-600 text-white font-bold';
                      } else if (status === 'not_answered') {
                        bgStyle = 'bg-rose-500 text-white font-bold';
                      }

                      return (
                        <button
                          key={i}
                          onClick={() => {
                            handleJumpTo(i);
                            setIsMobilePaletteOpen(false);
                          }}
                          className={`h-10 rounded-lg text-xs font-mono transition-all flex items-center justify-center gap-0.5 ${bgStyle} ${
                            isCurrent ? 'ring-2 ring-ink-pure scale-105' : ''
                          }`}
                        >
                          {isLocked ? <Lock className="w-2.5 h-2.5" /> : null}
                          <span>{i + 1}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Mobile Submit Exam Button */}
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setIsMobilePaletteOpen(false);
                        setShowConfirmSubmit(true);
                      }}
                      className="w-full py-3 rounded-xl bg-claret hover:bg-claret-light text-white text-xs font-medium transition-all shadow-xs min-h-[44px]"
                    >
                      Submit Examination
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        ) : (
          /* Diagnostic Score Report */
          <div className="flex-1 p-6 sm:p-10 overflow-y-auto space-y-8">
            <div className="text-center space-y-2 max-w-xl mx-auto">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-claret bg-claret-soft px-3 py-1 rounded-full border border-claret/20">
                {isUnlocked ? 'Official Examination Diagnostic Report' : 'Sample Diagnostic Preview Report (3 Questions)'}
              </span>
              <h3 className="font-serif text-3xl sm:text-4xl text-ink font-normal">
                {isUnlocked ? 'UGC-NET & GSET Performance Summary' : 'UGC-NET & GSET 3-Question Diagnostic Evaluation'}
              </h3>
              <p className="text-xs text-ink-muted font-reading">
                Candidate: <strong className="text-ink">{studentName}</strong> • {isUnlocked ? `Order #${orderId}` : 'Free Demo Preview Session'}
              </p>
            </div>

            {/* Score Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              <div className="p-5 rounded-2xl bg-[#FAF5EB] border border-brass/40 text-center">
                <span className="font-serif text-3xl sm:text-4xl font-bold text-claret block">
                  {totalScore} / {maxScore}
                </span>
                <span className="text-xs font-mono text-ink-muted mt-1 block">Marks Awarded (+2/-0)</span>
              </div>

              <div className="p-5 rounded-2xl bg-parchment-warm border border-deckle text-center">
                <span className="font-serif text-3xl sm:text-4xl font-bold text-emerald-800 block">
                  {correctCount}
                </span>
                <span className="text-xs font-mono text-ink-muted mt-1 block">Correct Answers</span>
              </div>

              <div className="p-5 rounded-2xl bg-parchment-warm border border-deckle text-center">
                <span className="font-serif text-3xl sm:text-4xl font-bold text-ink block">
                  {accuracy}%
                </span>
                <span className="text-xs font-mono text-ink-muted mt-1 block">Accuracy Rate</span>
              </div>

              <div className="p-5 rounded-2xl bg-parchment-warm border border-deckle text-center">
                <span className="font-serif text-3xl sm:text-4xl font-bold text-brass-dark block">
                  {percentile}th
                </span>
                <span className="text-xs font-mono text-ink-muted mt-1 block">Estimated Percentile</span>
              </div>
            </div>

            {/* Comprehensive Answer Key with Explanations */}
            <div className="space-y-4 max-w-4xl mx-auto">
              <div className="flex items-center justify-between pb-2 border-b border-deckle">
                <h4 className="font-serif text-xl text-ink font-normal flex items-center gap-2">
                  <FileText className="w-5 h-5 text-claret" />
                  <span>Question-by-Question Pedagogical Review</span>
                </h4>
                <button
                  onClick={handleRestart}
                  className="px-4 py-2 rounded-xl bg-parchment-warm hover:bg-parchment-deep text-xs font-mono font-medium text-ink flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retake Exam</span>
                </button>
              </div>

              <div className="space-y-4">
                {(evaluation?.detailedQuestions || []).map((q, idx) => {
                  const studentAns = q.studentAns;
                  const isCorrect = q.isCorrect;
                  const isAttempted = studentAns !== undefined;

                  return (
                    <div key={q.id} className="p-5 rounded-2xl bg-parchment-warm/60 border border-deckle space-y-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-claret">Q{idx + 1}. {q.topicTag}</span>
                        <span className={`px-2.5 py-0.5 rounded font-mono text-[10px] font-bold ${
                          !isAttempted ? 'bg-slate-200 text-slate-700' :
                          isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {!isAttempted ? 'Unattempted' : isCorrect ? 'Correct (+2)' : 'Incorrect (0)'}
                        </span>
                      </div>

                      <p className="font-serif text-sm sm:text-base text-ink font-normal leading-snug">
                        {q.question}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-sans">
                        {q.options.map((opt, i) => {
                          const isOptionCorrect = i === q.correctIdx;
                          const isSelectedByStudent = studentAns === i;

                          let badgeStyle = 'bg-white border-deckle text-ink-muted';
                          if (isOptionCorrect) badgeStyle = 'bg-emerald-100 border-emerald-400 text-emerald-950 font-bold';
                          else if (isSelectedByStudent && !isCorrect) badgeStyle = 'bg-rose-100 border-rose-300 text-rose-950';

                          return (
                            <div key={i} className={`p-2.5 rounded-lg border ${badgeStyle}`}>
                              <strong className="mr-1">{String.fromCharCode(65 + i)}.</strong> {opt}
                            </div>
                          );
                        })}
                      </div>

                      <div className="p-3.5 rounded-xl bg-white border border-deckle space-y-1">
                        <span className="font-mono font-bold text-[10px] uppercase text-claret block">
                          Dr. Dodiya's Pedagogical Explanation:
                        </span>
                        <p className="font-reading text-ink-muted leading-relaxed">
                          {q.explanation}
                        </p>
                      </div>
                    </div>
                  );
                })}

                {/* Locked Questions Callout if in Demo Mode */}
                {!isUnlocked && (
                  <div className="p-6 sm:p-8 rounded-2xl border-2 border-dashed border-claret/40 bg-claret-soft/30 text-center space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-claret text-white flex items-center justify-center mx-auto shadow-md">
                      <Lock className="w-6 h-6" />
                    </div>
                    <div className="space-y-1.5 max-w-lg mx-auto">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-claret font-bold bg-claret-soft px-3 py-1 rounded-full border border-claret/20 inline-block">
                        Questions 4 – 25 Locked • Demo Mode Complete
                      </span>
                      <h4 className="font-serif text-xl sm:text-2xl text-ink font-normal">
                        Unlock All 25 UGC-NET/GSET Questions & Explanations
                      </h4>
                      <p className="text-xs text-ink-muted font-reading leading-relaxed">
                        You have reviewed the 3 free diagnostic questions. The remaining 22 questions cover Post-Method Pedagogy, Shakespearean Drama, Romanticism, Research Aptitude, and NEP 2020. Enroll in the Full CBT Exam Portal to practice with all 25 questions and unlock Dr. Dodiya's complete rationales.
                      </p>
                    </div>
                    <div className="pt-2">
                      <button
                        onClick={() => {
                          onClose();
                          onUnlockRequest?.();
                        }}
                        className="px-6 py-3 rounded-xl bg-claret hover:bg-claret-light text-white text-xs font-medium shadow-xs transition-all inline-flex items-center gap-2"
                      >
                        <Lock className="w-4 h-4" />
                        <span>Enroll in Full 25-Question CBT Exam (₹299)</span>
                      </button>
                    </div>
                  </div>
                )}
                {/* Bottom Exit & Retake Controls */}
                <div className="pt-6 pb-4 flex flex-col sm:flex-row items-center justify-center gap-3 border-t border-deckle">
                  <button
                    onClick={handleRestart}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-parchment-warm hover:bg-parchment-deep text-xs font-mono font-medium text-ink flex items-center justify-center gap-2 min-h-[44px]"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Retake 25-Question Exam</span>
                  </button>
                  <button
                    onClick={onClose}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#2C1810] hover:bg-[#3D2012] text-white text-xs font-mono font-medium shadow-xs flex items-center justify-center gap-2 min-h-[44px]"
                  >
                    <span>Return to Library Desk</span>
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Confirmation Modal before Submit */}
        {showConfirmSubmit && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-ink-pure/75 backdrop-blur-xs animate-fade-in">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-book-xl border border-deckle space-y-4">
              <h4 className="font-serif text-xl text-ink font-normal">Confirm Exam Submission?</h4>
              <p className="text-xs text-ink-muted font-reading leading-relaxed">
                You have answered <strong className="text-emerald-700">{answeredCount} of {totalQuestions} questions</strong>. Unanswered questions will receive 0 marks.
              </p>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmSubmit(false)}
                  className="px-4 py-2.5 rounded-xl bg-parchment-warm hover:bg-parchment text-ink text-xs min-h-[44px] font-medium transition-all"
                >
                  Back to Exam
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowConfirmSubmit(false);
                    setExamSubmitted(true);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-claret hover:bg-claret-light text-white text-xs font-medium shadow-xs min-h-[44px] transition-all"
                >
                  Yes, Submit Exam
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
