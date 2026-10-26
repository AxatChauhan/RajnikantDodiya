/**
 * Intelligent MCQ Parser for Author Studio
 * Dr. Rajnikant S. Dodiya Academic Portal
 * 
 * Supports parsing questions pasted from Microsoft Word, PDF, Google Docs, or CSV.
 * Automatically extracts Question, Options (A-D or 1-4), Correct Answer,
 * Pedagogical Explanation, and Topic Tags.
 */

import { maskAnswer } from './security';
import { StudioExamQuestion } from '../contexts/SiteContentContext';

export interface ParseResult {
  questions: Omit<StudioExamQuestion, 'id'>[];
  errors: string[];
  totalDetected: number;
}

/**
 * Parses raw text containing one or multiple MCQs.
 * Handles formats like:
 *   Q1. / 1. / Question 1:
 *   A) / (A) / A. / [A]
 *   Answer: B / Ans: 2 / Key: C / * (asterisk marks)
 *   Explanation: ... / Rationale: ... / Solution: ...
 *   Topic: ... / Section: ... / Tag: ...
 */
export function parseMCQRawText(rawText: string, defaultSection = 'Paper II: English Literature'): ParseResult {
  const errors: string[] = [];
  const questions: Omit<StudioExamQuestion, 'id'>[] = [];

  if (!rawText || !rawText.trim()) {
    return { questions: [], errors: ['No text provided to parse.'], totalDetected: 0 };
  }

  // Normalize line endings
  const normalized = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();

  // Split into question blocks: look for boundary markers like "Q1.", "Q 1.", "1.", "Question 1", "[1]" at start of line
  // or double newlines before a number
  const rawBlocks = normalized.split(/\n\s*(?=(?:(?:Q(?:uestion)?\s*\.?\s*\d+[\.:\)]|\b\d+[\.:\)]))\s+)/i);

  // Fallback: If no Q1. style markers found, try splitting by double blank lines
  const blocks = rawBlocks.length > 1
    ? rawBlocks
    : normalized.split(/\n\s*\n\s*(?=[A-Za-z0-9])/).filter(b => b.trim().length > 0);

  blocks.forEach((block, blockIdx) => {
    const trimmed = block.trim();
    if (!trimmed) return;

    const lines = trimmed.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) return;

    let questionStem = '';
    const rawOptions: { letter: string; text: string; isMarkedCorrect: boolean }[] = [];
    let detectedAnswer: number | null = null;
    let explanation = '';
    let topicTag = 'General Pedagogy & Literature';
    let section = defaultSection;

    // Line parser state
    let isParsingStem = true;
    let currentOptionLetter: string | null = null;
    let currentOptionText = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // 1. Check for Answer line (e.g., "Answer: B", "Ans: (2)", "Correct Option: A", "Key: C")
      const ansMatch = line.match(/^(?:Answer|Ans|Correct(?:\s+Option|\s+Answer)?|Key)\s*[:=\-–]\s*\(?([A-Da-d1-4])\)?/i);
      if (ansMatch) {
        const keyChar = ansMatch[1].toUpperCase();
        if (keyChar === 'A' || keyChar === '1') detectedAnswer = 0;
        else if (keyChar === 'B' || keyChar === '2') detectedAnswer = 1;
        else if (keyChar === 'C' || keyChar === '3') detectedAnswer = 2;
        else if (keyChar === 'D' || keyChar === '4') detectedAnswer = 3;
        continue;
      }

      // 2. Check for Explanation / Rationale line
      const expMatch = line.match(/^(?:Explanation|Rationale|Solution|Note|Feedback)\s*[:=\-–]\s*(.*)$/i);
      if (expMatch) {
        explanation = expMatch[1].trim();
        // Accumulate any following lines that aren't Topic or Section
        for (let j = i + 1; j < lines.length; j++) {
          if (!lines[j].match(/^(?:Topic|Section|Tag)\s*[:=\-–]/i)) {
            explanation += ' ' + lines[j].trim();
            i = j;
          } else {
            break;
          }
        }
        continue;
      }

      // 3. Check for Topic / Tag line
      const topicMatch = line.match(/^(?:Topic|Tag)\s*[:=\-–]\s*(.*)$/i);
      if (topicMatch) {
        topicTag = topicMatch[1].trim();
        continue;
      }

      // 4. Check for Section line
      const sectionMatch = line.match(/^(?:Section|Paper)\s*[:=\-–]\s*(.*)$/i);
      if (sectionMatch) {
        section = sectionMatch[1].trim();
        continue;
      }

      // 5. Check for Option line (e.g. "A) ...", "(A) ...", "A. ...", "*B) ...", "1. ...")
      const optMatch = line.match(/^(\*)?\s*\(?([A-Da-d1-4])[\.\)\:\-]\s*(.*)$/);
      if (optMatch) {
        isParsingStem = false;
        if (currentOptionLetter) {
          rawOptions.push({
            letter: currentOptionLetter,
            text: currentOptionText.trim(),
            isMarkedCorrect: false
          });
        }
        const hasAsterisk = Boolean(optMatch[1]);
        currentOptionLetter = optMatch[2].toUpperCase();
        currentOptionText = optMatch[3].trim();

        // Check if line has [Correct] or [Ans] appended at end
        let isMarked = hasAsterisk;
        if (/\[(?:correct|answer|ans|\*)\]/i.test(currentOptionText)) {
          isMarked = true;
          currentOptionText = currentOptionText.replace(/\[(?:correct|answer|ans|\*)\]/i, '').trim();
        }

        if (isMarked) {
          if (currentOptionLetter === 'A' || currentOptionLetter === '1') detectedAnswer = 0;
          else if (currentOptionLetter === 'B' || currentOptionLetter === '2') detectedAnswer = 1;
          else if (currentOptionLetter === 'C' || currentOptionLetter === '3') detectedAnswer = 2;
          else if (currentOptionLetter === 'D' || currentOptionLetter === '4') detectedAnswer = 3;
        }
        continue;
      }

      // If we are still before any options, accumulate question stem
      if (isParsingStem) {
        // Strip leading Question number like "Q1.", "1.", "Question 1:"
        let cleanLine = line;
        if (!questionStem) {
          cleanLine = cleanLine.replace(/^(?:Q(?:uestion)?\s*\.?\s*\d+[\.:\)]|\b\d+[\.:\)])\s*/i, '');
        }
        questionStem = questionStem ? `${questionStem} ${cleanLine}` : cleanLine;
      } else if (currentOptionLetter) {
        // Continuation of current option text
        currentOptionText += ' ' + line;
      }
    }

    // Flush last option
    if (currentOptionLetter) {
      rawOptions.push({
        letter: currentOptionLetter,
        text: currentOptionText.trim(),
        isMarkedCorrect: false
      });
    }

    // Validation for this question block
    const questionNum = blockIdx + 1;
    if (!questionStem || questionStem.length < 5) {
      errors.push(`Question #${questionNum}: Question text is too short or missing.`);
      return;
    }

    if (rawOptions.length < 2) {
      errors.push(`Question #${questionNum} ("${questionStem.slice(0, 30)}..."): Found only ${rawOptions.length} option(s). At least 4 options are expected.`);
      return;
    }

    // Normalize to 4 options
    const finalOptions: string[] = rawOptions.map(o => o.text);
    while (finalOptions.length < 4) {
      finalOptions.push(`Option ${String.fromCharCode(65 + finalOptions.length)}`);
    }

    const answerIdx = detectedAnswer !== null && detectedAnswer >= 0 && detectedAnswer < finalOptions.length
      ? detectedAnswer
      : 0; // Default to Option A if unspecified

    if (detectedAnswer === null) {
      errors.push(`Question #${questionNum} ("${questionStem.slice(0, 30)}..."): No correct answer specified (defaulted to Option A).`);
    }

    questions.push({
      section,
      question: questionStem.trim(),
      options: finalOptions.slice(0, 4),
      correctAnswer: maskAnswer(answerIdx),
      explanation: explanation || 'Detailed pedagogical explanation curated by Dr. Rajnikant S. Dodiya.',
      topicTag: topicTag.trim()
    });
  });

  return {
    questions,
    errors,
    totalDetected: questions.length
  };
}

/**
 * Generates a clean CSV Template that the professor can download and open in Excel.
 */
export function generateMCQTemplateCSV(): string {
  const headers = ['Section', 'Question', 'Option A', 'Option B', 'Option C', 'Option D', 'Correct Answer (A/B/C/D)', 'Explanation', 'Topic Tag'];
  const sampleRow1 = [
    'Paper II: English Literature',
    'In Shakespeare\'s The Tempest, which character speaks: "You taught me language; and my profit on\'t / Is, I know how to curse"?',
    'Ariel',
    'Caliban',
    'Ferdinand',
    'Trinculo',
    'B',
    'Caliban speaks these lines to Prospero in Act I, Scene 2, reflecting postcolonial resistance.',
    'Shakespearean Drama'
  ];
  const sampleRow2 = [
    'Literary Theory & ELT',
    'B. Kumaravadivelu\'s Post-Method Pedagogy is organized around which triad of parameters?',
    'Particularity, Practicality, and Possibility',
    'Grammar, Vocabulary, and Syntax',
    'Proficiency, Performance, and Paradigm',
    'Curriculum, Instruction, and Evaluation',
    'A',
    'Kumaravadivelu\'s 3 Ps: Particularity (context sensitivity), Practicality (teacher autonomy), and Possibility (socio-political awareness).',
    'Post-Method Pedagogy'
  ];

  const escapeCsv = (str: string) => `"${str.replace(/"/g, '""')}"`;

  return [
    headers.map(escapeCsv).join(','),
    sampleRow1.map(escapeCsv).join(','),
    sampleRow2.map(escapeCsv).join(',')
  ].join('\n');
}

/**
 * Parses CSV content into structured MCQs.
 */
export function parseMCQCSV(csvText: string): ParseResult {
  const errors: string[] = [];
  const questions: Omit<StudioExamQuestion, 'id'>[] = [];

  const lines = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n');
  if (lines.length < 2) {
    return { questions: [], errors: ['CSV contains no question rows.'], totalDetected: 0 };
  }

  // Simple CSV line parser respecting quotes
  const parseLine = (text: string): string[] => {
    const entries: string[] = [];
    let entry = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === '"') {
        if (inQuotes && text[i + 1] === '"') {
          entry += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === ',' && !inQuotes) {
        entries.push(entry.trim());
        entry = '';
      } else {
        entry += c;
      }
    }
    entries.push(entry.trim());
    return entries;
  };

  // Skip header row if contains "question" or "option"
  const startIdx = lines[0].toLowerCase().includes('question') ? 1 : 0;

  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = parseLine(line);
    if (cols.length < 7) {
      errors.push(`Row ${i + 1}: Insufficient columns (expected at least 7, found ${cols.length}).`);
      continue;
    }

    const section = cols[0] || 'Paper II: English Literature';
    const question = cols[1];
    const options = [cols[2], cols[3], cols[4], cols[5]];
    const rawAns = (cols[6] || 'A').toUpperCase().trim();
    const explanation = cols[7] || 'Detailed pedagogical rationale.';
    const topicTag = cols[8] || 'General English Literature';

    let answerIdx = 0;
    if (rawAns === 'A' || rawAns === '1') answerIdx = 0;
    else if (rawAns === 'B' || rawAns === '2') answerIdx = 1;
    else if (rawAns === 'C' || rawAns === '3') answerIdx = 2;
    else if (rawAns === 'D' || rawAns === '4') answerIdx = 3;

    if (!question || question.length < 5) {
      errors.push(`Row ${i + 1}: Question text is missing or too short.`);
      continue;
    }

    questions.push({
      section,
      question,
      options,
      correctAnswer: maskAnswer(answerIdx),
      explanation,
      topicTag
    });
  }

  return {
    questions,
    errors,
    totalDetected: questions.length
  };
}
