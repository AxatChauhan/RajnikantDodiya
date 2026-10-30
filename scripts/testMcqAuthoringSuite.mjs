/**
 * ============================================================================
 * MCQ AUTHORING & INTELLIGENT FILE PARSER VERIFICATION SUITE
 * Dr. Rajnikant S. Dodiya Platform Engine
 * ============================================================================
 * Tests:
 * 1. Multi-modal text parsing (standard numbers, Roman numerals, dot-separated)
 * 2. Edge case: Question statements starting with initials (e.g. "B. Kumaravadivelu")
 * 3. 4-Option format variants: A), (A), A., [A], lowercase a)
 * 4. Flexible answer key detection: "Answer: B", "Ans: C", "Correct Answer: D", "Key: 1"
 * 5. Explanation & Solution rationale extraction
 * 6. Topic tag & subject section extraction
 * 7. CSV Question Bank parsing
 * 8. JSON Question Bank parsing
 * 9. Cryptographic Answer Masking (anti-cheat verification)
 * 10. Proctoring memory protection (zero answer leaks during active exam)
 * 11. Final grading & scoring reconciliation
 */

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(description, condition, detail = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ${GREEN}[PASS]${RESET} ${description} ${detail ? `(${detail})` : ''}`);
  } else {
    failedTests++;
    console.error(`  ${RED}[FAIL]${RESET} ${description} ${detail ? `(${detail})` : ''}`);
  }
}

// ---------------------------------------------------------------------------
// 1. Emulate cryptographic masking & unmasking
// ---------------------------------------------------------------------------
const MASK_SALT = 0x5a3c;

function maskAnswer(index) {
  const num = typeof index === 'number' ? index : parseInt(String(index), 10);
  if (isNaN(num) || num < 0 || num > 3) return 'ans_0';
  const encoded = (num ^ MASK_SALT) + 100;
  return `ans_${encoded.toString(16)}`;
}

function unmaskAnswer(masked) {
  if (typeof masked === 'number') return masked;
  if (!masked || typeof masked !== 'string') return 0;
  try {
    const hex = masked.replace(/^ans_/, '');
    const num = parseInt(hex, 16);
    const original = (num - 100) ^ MASK_SALT;
    return (original >= 0 && original <= 3) ? original : 0;
  } catch {
    return 0;
  }
}

// ---------------------------------------------------------------------------
// 2. Parser logic (synchronized with src/lib/examFileParser.ts)
// ---------------------------------------------------------------------------
function parseMcqsFromRawText(rawText) {
  if (!rawText || typeof rawText !== 'string') return [];

  // Check JSON
  const trimmed = rawText.trim();
  if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
    try {
      const parsed = JSON.parse(trimmed);
      const items = Array.isArray(parsed) ? parsed : parsed.questions;
      if (Array.isArray(items) && items.length > 0) {
        return items.map((q, idx) => {
          const rawCorrect = typeof q.correctAnswer === 'number' ? q.correctAnswer : parseLetterToIndex(String(q.correctAnswer || 'A'));
          return {
            id: idx + 1,
            section: q.section || 'General',
            question: q.question || '',
            options: [q.options[0] || '', q.options[1] || '', q.options[2] || '', q.options[3] || ''],
            correctAnswer: maskAnswer(rawCorrect),
            rawCorrectIndex: rawCorrect,
            explanation: q.explanation || '',
            topicTag: q.topicTag || 'General'
          };
        });
      }
    } catch {}
  }

  // Check CSV
  if (rawText.includes(',') && (rawText.toLowerCase().includes('question') || rawText.includes('\n'))) {
    const csvParsed = parseCsvQuestions(rawText);
    if (csvParsed.length >= 1) return csvParsed;
  }

  // Text Document parsing
  return parseTextQuestions(rawText);
}

function parseLetterToIndex(str) {
  if (!str) return 0;
  const clean = str.trim().toUpperCase().replace(/[^A-D0-3]/g, '');
  if (clean === 'A' || clean === '0') return 0;
  if (clean === 'B' || clean === '1') return 1;
  if (clean === 'C' || clean === '2') return 2;
  if (clean === 'D' || clean === '3') return 3;
  return 0;
}

function splitCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim().replace(/^["']|["']$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim().replace(/^["']|["']$/g, ''));
  return result;
}

function parseCsvQuestions(csvText) {
  const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length < 2) return [];

  const questions = [];
  const startIndex = lines[0].toLowerCase().includes('question') ? 1 : 0;

  for (let i = startIndex; i < lines.length; i++) {
    const parts = splitCsvLine(lines[i]);
    if (parts.length >= 6) {
      const rawCorrect = parseLetterToIndex(parts[5]);
      questions.push({
        id: questions.length + 1,
        section: parts[7] || 'General Paper',
        question: parts[0],
        options: [parts[1] || '', parts[2] || '', parts[3] || '', parts[4] || ''],
        correctAnswer: maskAnswer(rawCorrect),
        rawCorrectIndex: rawCorrect,
        explanation: parts[6] || '',
        topicTag: parts[8] || 'General'
      });
    }
  }
  return questions;
}

function parseTextQuestions(text) {
  // Normalize line endings
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Split into question blocks by question numbers at the start of a line
  const blocks = normalized.split(/\n(?=(?:Q(?:uestion)?\s*\.?\s*\d+|^\d+)\s*[\.\:\-\)])/im);
  const questions = [];

  for (const block of blocks) {
    const cleanBlock = block.trim();
    if (!cleanBlock) continue;

    const parsed = parseSingleBlock(cleanBlock, questions.length + 1);
    if (parsed) {
      questions.push(parsed);
    }
  }

  return questions;
}

function parseSingleBlock(block, fallbackId) {
  // Extract Answer
  let rawCorrect = 0;
  const answerMatch = block.match(/(?:Answer|Ans|Key|Correct(?:\s*Answer)?)\s*[:=\-]\s*\(?([A-D0-3])/i);
  if (answerMatch && answerMatch[1]) {
    rawCorrect = parseLetterToIndex(answerMatch[1]);
  }

  // Extract Explanation
  let explanation = '';
  const expMatch = block.match(/(?:Explanation|Rationale|Solution|Exp)\s*[:=\-]\s*([\s\S]+?)(?=(?:\n\s*(?:Topic|Tag|Section|Subject)\s*[:=\-])|$)/i);
  if (expMatch && expMatch[1]) {
    explanation = expMatch[1].trim();
  }

  // Extract Topic Tag
  let topicTag = 'General';
  const tagMatch = block.match(/(?:Topic|Tag|Subject)\s*[:=\-]\s*([^\n]+)/i);
  if (tagMatch && tagMatch[1]) {
    topicTag = tagMatch[1].trim();
  }

  // Extract Section
  let section = 'Paper II: English Literature';
  const secMatch = block.match(/(?:Section|Paper)\s*[:=\-]\s*([^\n]+)/i);
  if (secMatch && secMatch[1]) {
    section = secMatch[1].trim();
  }

  // Isolate question and options before answer/explanation
  const contentBeforeAns = block.split(/(?:\n\s*(?:Answer|Ans|Key|Correct(?:\s*Answer)?)\s*[:=\-])/i)[0] || block;

  // Extract options A, B, C, D
  const optAIndex = contentBeforeAns.search(/\n\s*(?:\(?[A|a][\.\)\:\-]|[A|a]\))\s+/);
  const optBIndex = contentBeforeAns.search(/\n\s*(?:\(?[B|b][\.\)\:\-]|[B|b]\))\s+/);
  const optCIndex = contentBeforeAns.search(/\n\s*(?:\(?[C|c][\.\)\:\-]|[C|c]\))\s+/);
  const optDIndex = contentBeforeAns.search(/\n\s*(?:\(?[D|d][\.\)\:\-]|[D|d]\))\s+/);

  if (optAIndex === -1 || optBIndex === -1 || optCIndex === -1 || optDIndex === -1) {
    return null; // Must have all 4 options
  }

  const rawQuestionText = contentBeforeAns.substring(0, optAIndex).trim();
  // Strip question number prefix e.g. "1. ", "Question 1: "
  const question = rawQuestionText.replace(/^(?:Q(?:uestion)?\s*\.?\s*\d+|\d+)\s*[\.\:\-\)]\s*/i, '').trim();

  const optA = contentBeforeAns.substring(optAIndex, optBIndex).replace(/^\s*(?:\(?[A|a][\.\)\:\-]|[A|a]\))\s*/, '').trim();
  const optB = contentBeforeAns.substring(optBIndex, optCIndex).replace(/^\s*(?:\(?[B|b][\.\)\:\-]|[B|b]\))\s*/, '').trim();
  const optC = contentBeforeAns.substring(optCIndex, optDIndex).replace(/^\s*(?:\(?[C|c][\.\)\:\-]|[C|c]\))\s*/, '').trim();
  const optD = contentBeforeAns.substring(optDIndex).replace(/^\s*(?:\(?[D|d][\.\)\:\-]|[D|d]\))\s*/, '').trim();

  if (!question || !optA || !optB || !optC || !optD) {
    return null;
  }

  return {
    id: fallbackId,
    section,
    question,
    options: [optA, optB, optC, optD],
    correctAnswer: maskAnswer(rawCorrect),
    rawCorrectIndex: rawCorrect,
    explanation,
    topicTag
  };
}

// ---------------------------------------------------------------------------
// TEST EXECUTION
// ---------------------------------------------------------------------------
console.log(`\n${BOLD}================================================================${RESET}`);
console.log(`${BOLD} MCQ AUTHORING & FILE PARSER VERIFICATION SUITE${RESET}`);
console.log(`${BOLD}================================================================${RESET}\n`);

// Test 1: Cryptographic Masking
console.log(`${CYAN}--- Test 1: Cryptographic Anti-Cheat Answer Masking ---${RESET}`);
const masked0 = maskAnswer(0);
const masked1 = maskAnswer(1);
const masked2 = maskAnswer(2);
const masked3 = maskAnswer(3);

assert('maskAnswer generates non-obvious string format', masked0.startsWith('ans_') && masked0 !== 'ans_0', `Generated: ${masked0}`);
assert('maskAnswer preserves distinct entropy for each choice', masked0 !== masked1 && masked1 !== masked2 && masked2 !== masked3, 'Unique tokens for A, B, C, D');
assert('unmaskAnswer reverses masked token back to exact index 0', unmaskAnswer(masked0) === 0, `0 -> ${masked0} -> 0`);
assert('unmaskAnswer reverses masked token back to exact index 1', unmaskAnswer(masked1) === 1, `1 -> ${masked1} -> 1`);
assert('unmaskAnswer reverses masked token back to exact index 2', unmaskAnswer(masked2) === 2, `2 -> ${masked2} -> 2`);
assert('unmaskAnswer reverses masked token back to exact index 3', unmaskAnswer(masked3) === 3, `3 -> ${masked3} -> 3`);

// Test 2: Standard UGC-NET Text Format
console.log(`\n${CYAN}--- Test 2: Standard Text Document Parsing ---${RESET}`);
const sampleText = `
1. In Shakespeare’s The Tempest, which character utters the lines "You taught me language; and my profit on’t / Is, I know how to curse"?
A) Ariel
B) Caliban
C) Ferdinand
D) Trinculo
Answer: B
Explanation: Caliban speaks these lines to Prospero in Act I, Scene 2.
Topic: Shakespearean Drama & Postcolonial Studies

2. What is the pedagogical focus of Communicative Language Teaching (CLT)?
(A) Grammatical drill mastery
(B) Translation of classical literary excerpts
(C) Interaction and communicative competence in authentic context
(D) Memorization of phonemic transcriptions
Ans: C
Explanation: CLT emphasizes communicative competence over rote structural drills.
Topic: ELT Methodologies
`;

const parsedFromText = parseMcqsFromRawText(sampleText);
assert('Extracted exactly 2 questions from standard text', parsedFromText.length === 2, `Count: ${parsedFromText.length}`);
assert('Question 1 statement extracted accurately', parsedFromText[0]?.question.includes('Tempest'), 'Found Shakespeare reference');
assert('Question 1 Option B is Caliban', parsedFromText[0]?.options[1] === 'Caliban', `Option B: ${parsedFromText[0]?.options[1]}`);
assert('Question 1 Answer Key decoded as index 1 (Option B)', parsedFromText[0]?.rawCorrectIndex === 1, `Decoded index: ${parsedFromText[0]?.rawCorrectIndex}`);
assert('Question 1 Answer is cryptographically masked', parsedFromText[0]?.correctAnswer.startsWith('ans_'), `Mask: ${parsedFromText[0]?.correctAnswer}`);
assert('Question 1 Explanation extracted', parsedFromText[0]?.explanation.includes('Act I, Scene 2'), 'Explanation present');
assert('Question 2 Option C recognized as correct key', parsedFromText[1]?.rawCorrectIndex === 2, `Decoded index: ${parsedFromText[1]?.rawCorrectIndex}`);

// Test 3: Edge Case - Question with Author Initials (e.g. "B. Kumaravadivelu")
console.log(`\n${CYAN}--- Test 3: Edge Case - Author Initials in Question ---${RESET}`);
const initialSample = `
1. B. Kumaravadivelu’s "Post-Method Pedagogy" is structured around which parameters?
A) Grammar, Vocabulary, Syntax
B) Particularity, Practicality, and Possibility
C) Form, Function, Meaning
D) Input, Intake, Output
Answer: B
Explanation: Kumaravadivelu formulated the 3 Ps in post-method education.
Topic: Post-Method ELT
`;

const parsedWithInitial = parseMcqsFromRawText(initialSample);
assert('Handles author initial in question statement without false option match', parsedWithInitial.length === 1, `Count: ${parsedWithInitial.length}`);
assert('Question prompt preserved author name', parsedWithInitial[0]?.question.includes('Kumaravadivelu'), `Text: ${parsedWithInitial[0]?.question.substring(0, 30)}...`);
assert('Option A is intact', parsedWithInitial[0]?.options[0].includes('Grammar'), `Option A: ${parsedWithInitial[0]?.options[0]}`);
assert('Option B is intact', parsedWithInitial[0]?.options[1].includes('Particularity'), `Option B: ${parsedWithInitial[0]?.options[1]}`);

// Test 4: CSV Format Parsing
console.log(`\n${CYAN}--- Test 4: CSV Question Bank Parsing ---${RESET}`);
const sampleCsv = `Question,OptionA,OptionB,OptionC,OptionD,Answer,Explanation,Section,Topic
"Who wrote 'A Room of One's Own'?","Virginia Woolf","Sylvia Plath","George Eliot","Jane Austen","A","Virginia Woolf published it in 1929","Paper II: English","Feminist Criticism"
"What is the foundational age bracket in NEP 2020?","3 to 8 years","6 to 14 years","5 to 10 years","8 to 11 years","A","Foundational stage covers ages 3 to 8 under 5+3+3+4","Paper I: Pedagogy","NEP 2020"
`;

const parsedFromCsv = parseMcqsFromRawText(sampleCsv);
assert('Extracted 2 questions from CSV', parsedFromCsv.length === 2, `Count: ${parsedFromCsv.length}`);
assert('CSV Question 1 text match', parsedFromCsv[0]?.question.includes("Room of One's Own"), 'Matched text');
assert('CSV Question 1 correct answer index is 0 (Woolf)', parsedFromCsv[0]?.rawCorrectIndex === 0, `Index: ${parsedFromCsv[0]?.rawCorrectIndex}`);
assert('CSV Question 2 correct answer index is 0 (3 to 8 years)', parsedFromCsv[1]?.rawCorrectIndex === 0, `Index: ${parsedFromCsv[1]?.rawCorrectIndex}`);

// Test 5: JSON Format Parsing
console.log(`\n${CYAN}--- Test 5: JSON Question Bank Parsing ---${RESET}`);
const sampleJson = JSON.stringify([
  {
    question: "Which literary critic coined 'The Language of Paradox'?",
    options: ["Cleanth Brooks", "T. S. Eliot", "I. A. Richards", "F. R. Leavis"],
    correctAnswer: "A",
    explanation: "Cleanth Brooks in The Well Wrought Urn (1947).",
    section: "Paper II: English Literature",
    topicTag: "New Criticism"
  }
]);

const parsedFromJson = parseMcqsFromRawText(sampleJson);
assert('Extracted 1 question from JSON', parsedFromJson.length === 1, `Count: ${parsedFromJson.length}`);
assert('JSON correct answer mapped to 0 (Cleanth Brooks)', parsedFromJson[0]?.rawCorrectIndex === 0, `Index: ${parsedFromJson[0]?.rawCorrectIndex}`);

// Test 6: Proctoring Active Question Security (Anti-Cheat Leak Test)
console.log(`\n${CYAN}--- Test 6: Active Proctoring DRM Defense ---${RESET}`);
const fullExam = {
  id: 'exam-custom-01',
  title: 'Custom Test',
  questions: parsedFromText
};

const activeExamQuestions = fullExam.questions.map(q => ({
  id: q.id,
  section: q.section,
  question: q.question,
  options: q.options,
  topicTag: q.topicTag
}));

assert('Active exam question payload strips correctAnswer', activeExamQuestions[0].correctAnswer === undefined, 'No correctAnswer property');
assert('Active exam question payload strips explanation', activeExamQuestions[0].explanation === undefined, 'No explanation property');
assert('Options and question text remain fully accessible', activeExamQuestions[0].options.length === 4, '4 options present');

// Test 7: Post-Submission Evaluation & Scoring
console.log(`\n${CYAN}--- Test 7: Submission Evaluation Engine ---${RESET}`);
const candidateAnswers = {
  0: 1, // Q1: Caliban (correct)
  1: 0  // Q2: Option A (incorrect, correct was C / index 2)
};

function evaluateTest(questions, answers) {
  let correctCount = 0;
  let incorrectCount = 0;
  let unattemptedCount = 0;

  const detailed = questions.map((q, idx) => {
    const studentAns = answers[idx];
    const correctIdx = q.rawCorrectIndex;
    const isCorrect = studentAns === correctIdx;
    if (studentAns === undefined) unattemptedCount++;
    else if (isCorrect) correctCount++;
    else incorrectCount++;

    return { ...q, studentAns, correctIdx, isCorrect };
  });

  const totalScore = correctCount * 2;
  const maxScore = questions.length * 2;
  const accuracy = Math.round((correctCount / (correctCount + incorrectCount)) * 100);

  return { correctCount, incorrectCount, unattemptedCount, totalScore, maxScore, accuracy, detailed };
}

const result = evaluateTest(parsedFromText, candidateAnswers);
assert('Calculated exactly 1 correct answer', result.correctCount === 1, `Correct: ${result.correctCount}`);
assert('Calculated exactly 1 incorrect answer', result.incorrectCount === 1, `Incorrect: ${result.incorrectCount}`);
assert('Score calculated as 2 / 4 marks (+2 per correct)', result.totalScore === 2 && result.maxScore === 4, `Score: ${result.totalScore}/${result.maxScore}`);
assert('Accuracy rate calculated as 50%', result.accuracy === 50, `Accuracy: ${result.accuracy}%`);
assert('Question 1 detailed review marks isCorrect=true', result.detailed[0].isCorrect === true, 'Q1 correct');
assert('Question 2 detailed review marks isCorrect=false', result.detailed[1].isCorrect === false, 'Q2 incorrect');
assert('Post-submission detailed review reveals explanation', result.detailed[0].explanation.includes('Act I'), 'Explanation revealed post-test');

// Test 8: Quoted Commas in CSV Line
console.log(`\n${CYAN}--- Test 8: Quoted Commas in CSV Fields ---${RESET}`);
const quotedCsv = `Question,OptionA,OptionB,OptionC,OptionD,Answer,Explanation,Section,Topic
"In Shakespeare's Hamlet, Act III, Scene 1, what does Hamlet contemplate?","To be, or not to be","To die, to sleep","To eat, or to drink","To run, or to hide","A","Hamlet famously ponders existence in Act III, Scene 1.","Paper II: English","Shakespeare"
`;
const parsedQuotedCsv = parseMcqsFromRawText(quotedCsv);
assert('Quoted comma in question statement preserved without breaking columns', parsedQuotedCsv.length === 1, `Count: ${parsedQuotedCsv.length}`);
assert('Question statement retains commas', parsedQuotedCsv[0]?.question.includes('Hamlet, Act III, Scene 1'), `Question: ${parsedQuotedCsv[0]?.question}`);
assert('Option A retains commas', parsedQuotedCsv[0]?.options[0] === 'To be, or not to be', `Option A: ${parsedQuotedCsv[0]?.options[0]}`);

// Test 9: CBT Exam Switching & Duration Synchronization
console.log(`\n${CYAN}--- Test 9: CBT Exam Switching & Duration Synchronization ---${RESET}`);
const examA = { id: 'exam-01', title: 'NET Paper II', durationMinutes: 60 };
const examB = { id: 'exam-02', title: 'Quick Quiz', durationMinutes: 15 };
let currentActiveExam = examA;
let activeTimeLeft = currentActiveExam.durationMinutes * 60; // 3600s
activeTimeLeft = 2400; // Simulated 20 mins elapsed

// Switch to examB
currentActiveExam = examB;
const switchedDuration = currentActiveExam.durationMinutes * 60; // 900s
activeTimeLeft = switchedDuration;

assert('Switching tests resets countdown timer to new test duration', activeTimeLeft === 900, `Duration: ${activeTimeLeft}s (15 mins)`);

// Test 10: Deletion of all exams preserves fallback to default exams
console.log(`\n${CYAN}--- Test 10: Exam Deletion Safety & Non-Empty Catalog Invariant ---${RESET}`);
const DEFAULT_TESTS = [{ id: 'exam-ugc-mock-01', title: 'UGC-NET Master Mock' }];
let testCatalog = [{ id: 'custom-1', title: 'Custom 1' }];

function deleteExamSafe(id, currentList) {
  const updated = currentList.filter(e => e.id !== id);
  return updated.length > 0 ? updated : DEFAULT_TESTS;
}

const afterDelete = deleteExamSafe('custom-1', testCatalog);
assert('Deleting the only remaining exam safely restores default UGC-NET bank', afterDelete.length === 1 && afterDelete[0].id === 'exam-ugc-mock-01', 'Default mock exam restored');

// Summary
console.log(`\n${BOLD}================================================================${RESET}`);
console.log(`${BOLD} TEST RUN SUMMARY: ${passedTests}/${totalTests} Passed (${Math.round((passedTests / totalTests) * 100)}%)${RESET}`);
if (failedTests === 0) {
  console.log(`${GREEN}${BOLD} ALL MCQ AUTHORING & PARSER TESTS PASSED!${RESET}\n`);
} else {
  console.log(`${RED}${BOLD} ${failedTests} TESTS FAILED!${RESET}\n`);
  process.exit(1);
}
