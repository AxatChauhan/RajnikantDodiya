import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Award,
  BookOpen,
  RotateCcw
} from 'lucide-react';

export interface NtaQuestion {
  id: number;
  section: string;
  question: string;
  options: string[];
  correctAnswer: number; // 0-indexed
  explanation: string;
  topicTag: string;
}

// 25 High-Yield Sample Questions representing the UGC-NET / GSET Paper II English Literature pattern
export const SAMPLE_NTA_QUESTIONS: NtaQuestion[] = [
  {
    id: 1,
    section: 'Literary Theory & ELT',
    question: 'B. Kumaravadivelu’s "Post-Method Pedagogy" is structurally articulated around which triad of organizational parameters?',
    options: [
      'Particularity, Practicality, and Possibility',
      'Grammar, Vocabulary, and Syntax',
      'Proficiency, Performance, and Paradigm',
      'Curriculum, Instruction, and Evaluation'
    ],
    correctAnswer: 0,
    explanation: 'Kumaravadivelu’s 3 Ps: Particularity (context-sensitive pedagogy), Practicality (teacher autonomy and action-research), and Possibility (socio-political awareness and identity empowerment).',
    topicTag: 'Post-Method Pedagogy'
  },
  {
    id: 2,
    section: 'British Literature',
    question: 'In Shakespeare’s The Tempest, which character utters the famous lines: “You taught me language; and my profit on’t / Is, I know how to curse. The red plague rid you / For learning me your language!”?',
    options: ['Ariel', 'Caliban', 'Ferdinand', 'Trinculo'],
    correctAnswer: 1,
    explanation: 'Caliban speaks these immortal postcolonial lines to Prospero and Miranda (Act I, Scene 2), illustrating the tension between linguistic imposition and subversive resistance.',
    topicTag: 'Shakespearean Drama & Postcolonial Readings'
  },
  {
    id: 3,
    section: 'Romantic Poetics',
    question: 'Who coined the phrase "Willing suspension of disbelief for the moment, which constitutes poetic faith"?',
    options: ['William Wordsworth', 'Samuel Taylor Coleridge', 'Percy Bysshe Shelley', 'John Keats'],
    correctAnswer: 1,
    explanation: 'Coleridge introduced this concept in Chapter XIV of his Biographia Literaria (1817) to explain how readers willingly accept the supernatural in poetry.',
    topicTag: 'Romantic Literary Criticism'
  },
  {
    id: 4,
    section: 'Cultural Studies',
    question: 'Stuart Hall’s seminal 1973 model of communication identifies which three hypothetical decoding positions for television discourse?',
    options: [
      'Dominant-Hegemonic, Negotiated, and Oppositional',
      'Linear, Interactive, and Transactional',
      'Cognitive, Affective, and Psychomotor',
      'Literal, Metaphorical, and Allegorical'
    ],
    correctAnswer: 0,
    explanation: 'In "Encoding and Decoding in the Television Discourse", Stuart Hall identifies: 1) Dominant-Hegemonic code, 2) Negotiated code, and 3) Oppositional code.',
    topicTag: 'Cultural Studies & Media Theory'
  },
  {
    id: 5,
    section: 'Indian Writing in English',
    question: 'Which Indian English poet authored the autobiographical collection "Rough Passage" (1977)?',
    options: ['Nissim Ezekiel', 'A.K. Ramanujan', 'R. Parthasarathy', 'Jayanta Mahapatra'],
    correctAnswer: 2,
    explanation: 'R. Parthasarathy wrote "Rough Passage", a poetic exploration of the dilemmas of return, cultural dislocation, and the English language in India.',
    topicTag: 'Modern Indian Poetry'
  },
  {
    id: 6,
    section: 'Literary Criticism',
    question: 'Who defined the "Intentional Fallacy" and "Affective Fallacy" in New Critical poetics?',
    options: [
      'T.S. Eliot and I.A. Richards',
      'W.K. Wimsatt Jr. and Monroe Beardsley',
      'Cleanth Brooks and Robert Penn Warren',
      'John Crowe Ransom and Allen Tate'
    ],
    correctAnswer: 1,
    explanation: 'W.K. Wimsatt and Monroe Beardsley published "The Intentional Fallacy" (1946) and "The Affective Fallacy" (1949), emphasizing the autonomy of the poem.',
    topicTag: 'New Criticism'
  },
  {
    id: 7,
    section: 'Postcolonial Studies',
    question: 'In "Orientalism" (1978), Edward Said famously draws upon which philosopher’s concept of "discourse" and power-knowledge nexus?',
    options: ['Jacques Derrida', 'Michel Foucault', 'Louis Althusser', 'Antonio Gramsci'],
    correctAnswer: 1,
    explanation: 'Said uses Michel Foucault’s notion of discourse (from The Archaeology of Knowledge) to analyze how Western institutions systematically created the Orient.',
    topicTag: 'Postcolonial Theory'
  },
  {
    id: 8,
    section: 'Research Methodology',
    question: 'In MLA 9th Edition style, what is the correct core element sequence for a book citation?',
    options: [
      'Author. Title of source. Title of container, Other contributors, Version, Number, Publisher, Publication date, Location.',
      'Title, Author, Year, City of Publication, Publisher.',
      'Author (Year). Title. Publisher: City.',
      'Author. Title. Publisher, Year.'
    ],
    correctAnswer: 0,
    explanation: 'MLA 9th Edition uses the template of 9 universal core elements in a fixed hierarchical sequence.',
    topicTag: 'MLA 9th Citation Standards'
  }
];

interface NtaTestRunnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  testTitle?: string;
  isFreeDemo?: boolean;
  candidateName?: string;
}

type QuestionStatus = 'answered' | 'not_answered' | 'marked' | 'marked_answered' | 'not_visited';

export const NtaTestRunnerModal: React.FC<NtaTestRunnerModalProps> = ({
  isOpen,
  onClose,
  testTitle = 'NET Vidya English CBT Exam Simulation',
  isFreeDemo = false,
  candidateName = 'Scholar'
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<number, boolean>>({});
  const [visited, setVisited] = useState<Record<number, boolean>>({ 0: true });
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(isFreeDemo ? 30 * 60 : 180 * 60); // 30 min for demo, 180 min for full mock
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [paletteFilter, setPaletteFilter] = useState<'all' | 'answered' | 'marked' | 'unanswered'>('all');

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };
  const [isFullscreen, setIsFullscreen] = useState(false);

  const questions = SAMPLE_NTA_QUESTIONS;
  const currentQ = questions[currentIdx] || questions[0];

  // Timer countdown
  useEffect(() => {
    if (!isOpen || isSubmitted) return;
    const interval = setInterval(() => {
      setTimeLeftSeconds(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, isSubmitted]);

  // Format time (HH:MM:SS)
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getQuestionStatus = (idx: number): QuestionStatus => {
    const hasAnswer = selectedAnswers[idx] !== undefined;
    const isMarked = markedForReview[idx] === true;
    const isVis = visited[idx] === true;

    if (isMarked && hasAnswer) return 'marked_answered';
    if (isMarked && !hasAnswer) return 'marked';
    if (hasAnswer) return 'answered';
    if (isVis) return 'not_answered';
    return 'not_visited';
  };

  const handleSelectOption = (optionIdx: number) => {
    setSelectedAnswers(prev => ({ ...prev, [currentIdx]: optionIdx }));
  };

  const handleClearResponse = () => {
    setSelectedAnswers(prev => {
      const next = { ...prev };
      delete next[currentIdx];
      return next;
    });
  };

  const handleSaveAndNext = () => {
    if (currentIdx < questions.length - 1) {
      const nextIdx = currentIdx + 1;
      setVisited(prev => ({ ...prev, [nextIdx]: true }));
      setCurrentIdx(nextIdx);
    }
  };

  const handleMarkForReviewAndNext = () => {
    setMarkedForReview(prev => ({ ...prev, [currentIdx]: true }));
    handleSaveAndNext();
  };

  const handleJumpToQuestion = (idx: number) => {
    setVisited(prev => ({ ...prev, [idx]: true }));
    setCurrentIdx(idx);
  };

  const handleSubmit = () => {
    setShowConfirmSubmit(false);
    setIsSubmitted(true);

    // Save score in local storage
    try {
      let correct = 0;
      questions.forEach((q, idx) => {
        if (selectedAnswers[idx] === q.correctAnswer) correct++;
      });
      const scoreRecord = {
        testTitle,
        totalQuestions: questions.length,
        correctCount: correct,
        scorePercentage: Math.round((correct / questions.length) * 100),
        completedAt: new Date().toISOString()
      };
      localStorage.setItem(`netvidya_test_score_${testTitle.replace(/\s+/g, '_')}`, JSON.stringify(scoreRecord));
    } catch {}
  };

  const stats = useMemo(() => {
    let answered = 0;
    let notAnswered = 0;
    let marked = 0;
    let notVisited = 0;

    questions.forEach((_, idx) => {
      const st = getQuestionStatus(idx);
      if (st === 'answered' || st === 'marked_answered') answered++;
      else if (st === 'not_answered') notAnswered++;
      else if (st === 'marked') marked++;
      else notVisited++;
    });

    return { answered, notAnswered, marked, notVisited };
  }, [selectedAnswers, markedForReview, visited, questions]);

  const scoreResults = useMemo(() => {
    if (!isSubmitted) return null;
    let correct = 0;
    let wrong = 0;
    let unattempted = 0;
    const unitBreakdown: Record<string, { total: number; correct: number; wrong: number; unattempted: number }> = {};

    questions.forEach((q, idx) => {
      const section = q.section || 'General Paper II';
      if (!unitBreakdown[section]) {
        unitBreakdown[section] = { total: 0, correct: 0, wrong: 0, unattempted: 0 };
      }
      unitBreakdown[section].total++;

      const ans = selectedAnswers[idx];
      if (ans === undefined) {
        unattempted++;
        unitBreakdown[section].unattempted++;
      } else if (ans === q.correctAnswer) {
        correct++;
        unitBreakdown[section].correct++;
      } else {
        wrong++;
        unitBreakdown[section].wrong++;
      }
    });

    const totalMarks = correct * 2; // UGC-NET awards 2 marks per question
    const maxMarks = questions.length * 2;
    const accuracy = correct + wrong > 0 ? Math.round((correct / (correct + wrong)) * 100) : 0;

    return { correct, wrong, unattempted, totalMarks, maxMarks, accuracy, unitBreakdown };
  }, [isSubmitted, selectedAnswers, questions]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#F3F4F6] text-[#1F2937] font-sans overflow-hidden">
      
      {/* Subtle Forensic Watermark Layer */}
      <div className="absolute inset-0 pointer-events-none select-none z-10 overflow-hidden flex flex-col justify-around opacity-[0.03] rotate-[-25deg] text-base sm:text-xl font-mono font-black text-gray-900 leading-loose text-center">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="whitespace-nowrap py-3">
            {candidateName} • Candidate Verified Session • NET Vidya English • {candidateName}
          </div>
        ))}
      </div>

      {/* 1. NTA Header Bar */}
      <header className="bg-[#1E3A8A] text-white px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-2 border-b border-[#1E40AF] shadow-sm shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-bold text-xs sm:text-sm shrink-0">
            NTA
          </div>
          <div className="min-w-0">
            <h2 className="text-xs sm:text-base font-bold leading-tight flex items-center gap-1.5 min-w-0">
              <span className="truncate">{testTitle}</span>
              {isFreeDemo && (
                <span className="text-[9px] sm:text-[10px] font-mono uppercase bg-emerald-500 text-white px-1.5 py-0.5 rounded font-bold shrink-0">
                  Demo
                </span>
              )}
            </h2>
            <p className="text-[10px] sm:text-[11px] text-blue-200 truncate">
              Candidate: <strong className="text-white font-medium">{candidateName}</strong> • Paper II: English
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Timer Display */}
          <div className="bg-[#0F172A] border border-blue-400/30 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg flex items-center gap-1.5 font-mono text-emerald-400 text-xs sm:text-base font-bold shadow-inner">
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 animate-pulse shrink-0" />
            <span className="hidden sm:inline">Time Left: </span>
            <span>{formatTime(timeLeftSeconds)}</span>
          </div>

          <button
            onClick={handleToggleFullscreen}
            className="p-1.5 rounded hover:bg-white/10 text-blue-200 hover:text-white transition-colors hidden sm:block"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-white/10 text-blue-200 hover:text-white transition-colors"
            title="Exit Exam"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* 2. Main Exam Body or Submission Review */}
      {isSubmitted && scoreResults ? (
        // Score & Explanations Review View
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6">
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-md text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <Award className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Exam Completed & Evaluated!</h3>
            <p className="text-sm text-gray-600">
              Here is your diagnostic performance summary on {testTitle}.
            </p>

            {/* Scorecard Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                <span className="text-xs text-blue-700 font-semibold block">Total Score</span>
                <span className="text-2xl font-bold text-blue-900">{scoreResults.totalMarks} / {scoreResults.maxMarks}</span>
              </div>
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="text-xs text-emerald-700 font-semibold block">Correct</span>
                <span className="text-2xl font-bold text-emerald-900">{scoreResults.correct}</span>
              </div>
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200">
                <span className="text-xs text-rose-700 font-semibold block">Incorrect</span>
                <span className="text-2xl font-bold text-rose-900">{scoreResults.wrong}</span>
              </div>
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                <span className="text-xs text-amber-700 font-semibold block">Accuracy</span>
                <span className="text-2xl font-bold text-amber-900">{scoreResults.accuracy}%</span>
              </div>
            </div>
          </div>

          {/* Unit-Wise Diagnostic Performance Breakdown */}
          {scoreResults.unitBreakdown && Object.keys(scoreResults.unitBreakdown).length > 0 && (
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
              <h4 className="text-base font-bold text-gray-900 flex items-center gap-2 border-b pb-2.5">
                <Award className="w-5 h-5 text-blue-700" />
                <span>Unit-Wise Diagnostic Mastery (UGC-NET / GSET Paper II Syllabus)</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(scoreResults.unitBreakdown).map(([section, data]) => {
                  const pct = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
                  return (
                    <div key={section} className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-gray-900 truncate">{section}</span>
                        <span className={`text-[11px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          pct >= 70 ? 'bg-emerald-100 text-emerald-800' : pct >= 40 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {pct}%
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px] text-gray-500">
                        <span>Correct: {data.correct}/{data.total}</span>
                        <span>Wrong: {data.wrong}</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Detailed Question Review with Explanations */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-6">
            <h4 className="text-lg font-bold text-gray-900 border-b pb-3 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-700" />
              <span>Question-wise Rationale & Model Explanations</span>
            </h4>

            <div className="space-y-6">
              {questions.map((q, idx) => {
                const userAns = selectedAnswers[idx];
                const isCorrect = userAns === q.correctAnswer;
                const isUnattempted = userAns === undefined;

                return (
                  <div key={q.id} className="p-4 rounded-xl border border-gray-200 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-gray-700">Question {idx + 1} ({q.section})</span>
                      <span className={`px-2 py-0.5 rounded font-semibold ${
                        isCorrect
                          ? 'bg-emerald-100 text-emerald-800'
                          : isUnattempted
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {isCorrect ? 'Correct (+2)' : isUnattempted ? 'Unattempted (0)' : 'Incorrect (0)'}
                      </span>
                    </div>

                    <p className="text-sm font-medium text-gray-900">{q.question}</p>

                    <div className="space-y-1.5 text-xs">
                      {q.options.map((opt, optIdx) => {
                        const isChosen = userAns === optIdx;
                        const isRightAnswer = q.correctAnswer === optIdx;

                        return (
                          <div
                            key={optIdx}
                            className={`p-2.5 rounded-lg border flex items-center justify-between ${
                              isRightAnswer
                                ? 'bg-emerald-50 border-emerald-300 font-medium text-emerald-900'
                                : isChosen
                                ? 'bg-rose-50 border-rose-300 text-rose-900'
                                : 'bg-gray-50 border-gray-200 text-gray-700'
                            }`}
                          >
                            <span>{String.fromCharCode(65 + optIdx)}) {opt}</span>
                            {isRightAnswer && <span className="text-[11px] font-bold text-emerald-700">✓ Correct Key</span>}
                            {isChosen && !isRightAnswer && <span className="text-[11px] font-bold text-rose-700">✗ Your Choice</span>}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanatory Note */}
                    <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-200 text-xs text-blue-950 space-y-1">
                      <strong className="block text-blue-900 font-semibold">Analytical Rationale:</strong>
                      <p className="leading-relaxed">{q.explanation}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        // Active CBT Exam Interface (Question Canvas + Palette)
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          
          {/* LEFT: Question Canvas & Action Buttons */}
          <div className="flex-1 flex flex-col overflow-y-auto bg-white p-4 sm:p-6 border-r border-gray-200">
            {/* Section & Question Header */}
            <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-900 bg-blue-50 px-2.5 py-1 rounded">
                {currentQ.section}
              </span>
              <span className="text-xs text-gray-500 font-mono">
                Marks: <strong className="text-emerald-600">+2.00</strong>, Negative: <strong>0.00</strong>
              </span>
            </div>

            {/* Question Text */}
            <div className="space-y-4 flex-1">
              <div className="text-sm sm:text-base font-medium text-gray-900 leading-relaxed">
                <span className="font-bold mr-2 text-blue-900">Q{currentIdx + 1}.</span>
                {currentQ.question}
              </div>

              {/* Radio Options */}
              <div className="space-y-2.5 pt-2">
                {currentQ.options.map((opt, optIdx) => {
                  const isChecked = selectedAnswers[currentIdx] === optIdx;
                  return (
                    <label
                      key={optIdx}
                      onClick={() => handleSelectOption(optIdx)}
                      className={`flex items-start gap-3 p-3.5 rounded-xl border text-sm cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-blue-50 border-blue-600 text-blue-950 font-medium shadow-xs'
                          : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-800'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question_${currentQ.id}`}
                        checked={isChecked}
                        onChange={() => handleSelectOption(optIdx)}
                        className="mt-0.5 w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span>
                        <strong className="font-semibold mr-1.5">{String.fromCharCode(65 + optIdx)})</strong>
                        {opt}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Bottom Controls Bar */}
            <div className="pt-4 mt-6 border-t border-gray-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleSaveAndNext}
                  className="flex-1 sm:flex-initial px-3 sm:px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs sm:text-sm font-semibold transition-colors shadow-sm text-center"
                >
                  Save & Next
                </button>
                <button
                  onClick={handleClearResponse}
                  className="px-2.5 sm:px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs sm:text-sm font-medium transition-colors border border-gray-300 text-center"
                >
                  Clear
                </button>
                <button
                  onClick={handleMarkForReviewAndNext}
                  className="px-2.5 sm:px-3 py-2 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 text-xs sm:text-sm font-medium transition-colors border border-purple-300 text-center"
                >
                  Review Later
                </button>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => currentIdx > 0 && handleJumpToQuestion(currentIdx - 1)}
                    disabled={currentIdx === 0}
                    className="p-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none"
                    title="Previous Question"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => currentIdx < questions.length - 1 && handleJumpToQuestion(currentIdx + 1)}
                    disabled={currentIdx === questions.length - 1}
                    className="p-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none"
                    title="Next Question"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={() => setShowConfirmSubmit(true)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold transition-colors shadow-sm"
                >
                  Submit Exam
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT: NTA Question Palette */}
          <div className="w-full lg:w-80 bg-[#F9FAFB] p-4 flex flex-col overflow-y-auto shrink-0 border-t lg:border-t-0 border-gray-200">
            {/* Legend */}
            <div className="bg-white p-3 rounded-xl border border-gray-200 text-xs space-y-2 mb-4 shadow-2xs">
              <span className="font-bold text-gray-900 block pb-1 border-b">Palette Legend</span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center">
                    {stats.answered}
                  </span>
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded bg-rose-600 text-white font-bold text-[10px] flex items-center justify-center">
                    {stats.notAnswered}
                  </span>
                  <span>Not Answered</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded bg-purple-600 text-white font-bold text-[10px] flex items-center justify-center">
                    {stats.marked}
                  </span>
                  <span>Marked</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded bg-gray-200 text-gray-700 font-bold text-[10px] flex items-center justify-center">
                    {stats.notVisited}
                  </span>
                  <span>Not Visited</span>
                </div>
              </div>
            </div>

            {/* Question Numbers Grid */}
            <div className="flex-1 bg-white p-3 rounded-xl border border-gray-200 shadow-2xs overflow-y-auto">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-xs text-gray-900">Question Grid</span>
                <span className="text-[10px] text-gray-400 font-mono">Filter:</span>
              </div>

              {/* Status Filter Buttons */}
              <div className="flex items-center gap-1 pb-2 mb-2.5 border-b border-gray-100 text-[10px]">
                {(['all', 'answered', 'marked', 'unanswered'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setPaletteFilter(f)}
                    className={`px-2 py-0.5 rounded font-semibold capitalize transition-all ${
                      paletteFilter === f
                        ? 'bg-blue-800 text-white shadow-2xs'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-5 gap-2">
                {questions.map((_, idx) => {
                  const status = getQuestionStatus(idx);
                  const isCurrent = currentIdx === idx;

                  // Apply palette filter
                  if (paletteFilter === 'answered' && status !== 'answered' && status !== 'marked_answered') return null;
                  if (paletteFilter === 'marked' && status !== 'marked' && status !== 'marked_answered') return null;
                  if (paletteFilter === 'unanswered' && status !== 'not_answered' && status !== 'not_visited') return null;

                  let bgClass = 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300';
                  if (status === 'answered') bgClass = 'bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-700';
                  else if (status === 'not_answered') bgClass = 'bg-rose-600 text-white hover:bg-rose-700 border-rose-700';
                  else if (status === 'marked' || status === 'marked_answered') bgClass = 'bg-purple-600 text-white hover:bg-purple-700 border-purple-700';

                  return (
                    <button
                      key={idx}
                      onClick={() => handleJumpToQuestion(idx)}
                      className={`h-9 rounded-lg font-mono text-xs font-bold border transition-all flex items-center justify-center ${bgClass} ${
                        isCurrent ? 'ring-2 ring-blue-500 ring-offset-1' : ''
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Submit Confirmation Modal */}
      {showConfirmSubmit && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowConfirmSubmit(false);
          }}
          className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white rounded-2xl max-w-md w-full my-auto max-h-[calc(100dvh-2rem)] overflow-y-auto p-6 shadow-2xl border border-gray-200 space-y-4">
            <h4 className="text-lg font-bold text-gray-900">Confirm Exam Submission</h4>
            <p className="text-xs text-gray-600">
              Are you sure you want to conclude and submit your exam? Once submitted, your answers will be evaluated immediately.
            </p>

            <div className="bg-gray-50 rounded-xl p-3 text-xs space-y-1.5 border border-gray-200">
              <div className="flex justify-between">
                <span>Total Questions:</span>
                <strong>{questions.length}</strong>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>Answered Questions:</span>
                <strong>{stats.answered}</strong>
              </div>
              <div className="flex justify-between text-rose-700">
                <span>Unanswered Questions:</span>
                <strong>{stats.notAnswered + stats.notVisited}</strong>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowConfirmSubmit(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100"
              >
                Resume Test
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
              >
                Yes, Submit Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
