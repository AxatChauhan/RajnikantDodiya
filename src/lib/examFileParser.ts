/**
 * EXAM FILE PARSER & INTELLIGENT MCQ EXTRACTOR
 * Author: Dr. Rajnikant S. Dodiya Platform Engine
 * 
 * Supports:
 * - PDF documents (.pdf) via native browser decompression & text stream extraction
 * - Text documents (.txt, .md, .doc) via File API
 * - CSV spreadsheets (.csv) with standard or custom column layouts
 * - Structured JSON (.json) question arrays
 */

import { maskAnswer } from './security';

export interface ParsedMcqQuestion {
  id: number;
  section: string;
  question: string;
  options: [string, string, string, string];
  correctAnswer: string | number; // Masked string for security or index 0-3
  rawCorrectIndex: number; // 0, 1, 2, or 3
  explanation: string;
  topicTag: string;
}

export interface ParseExamFileResult {
  success: boolean;
  fileName: string;
  fileSizeBytes: number;
  questions: ParsedMcqQuestion[];
  rawTextPreview: string;
  error?: string;
}

/**
 * Main Entry: Parse questions from a user-uploaded File (.pdf, .txt, .csv, .json)
 */
export async function parseExamFromFile(file: File): Promise<ParseExamFileResult> {
  const fileName = file.name || 'exam_questions';
  const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';

  try {
    let extractedText = '';

    if (fileExtension === 'pdf') {
      extractedText = await extractTextFromPdfFile(file);
    } else {
      // Plain text, markdown, CSV, or JSON
      extractedText = await file.text();
    }

    if (!extractedText || extractedText.trim().length === 0) {
      return {
        success: false,
        fileName,
        fileSizeBytes: file.size,
        questions: [],
        rawTextPreview: '',
        error: 'The uploaded file appears to be empty or contains no readable text.'
      };
    }

    // Process extracted text into structured MCQs
    const questions = parseMcqsFromRawText(extractedText);

    if (questions.length === 0) {
      return {
        success: false,
        fileName,
        fileSizeBytes: file.size,
        questions: [],
        rawTextPreview: extractedText.slice(0, 1000),
        error: 'Could not detect MCQ format in the file. Ensure questions have 4 options (A, B, C, D) and an answer key (e.g., "Answer: B").'
      };
    }

    return {
      success: true,
      fileName,
      fileSizeBytes: file.size,
      questions,
      rawTextPreview: extractedText.slice(0, 1500)
    };
  } catch (err: any) {
    return {
      success: false,
      fileName,
      fileSizeBytes: file.size,
      questions: [],
      rawTextPreview: '',
      error: `Error processing file: ${err?.message || 'Unknown error'}`
    };
  }
}

/**
 * Browser-native PDF text extractor without heavy external dependencies.
 * Decompresses stream blocks using Web Streams DecompressionStream or falls back to raw text.
 */
async function extractTextFromPdfFile(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const uint8 = new Uint8Array(arrayBuffer);
  
  // Convert buffer to binary string safely in chunks to avoid stack overflow
  let binaryString = '';
  const chunkSize = 8192;
  for (let i = 0; i < uint8.length; i += chunkSize) {
    const chunk = uint8.subarray(i, Math.min(i + chunkSize, uint8.length));
    binaryString += String.fromCharCode.apply(null, Array.from(chunk));
  }

  let fullExtractedText = '';

  // 1. Find all PDF stream ... endstream blocks
  const streamRegex = /stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g;
  let match: RegExpExecArray | null;

  while ((match = streamRegex.exec(binaryString)) !== null) {
    const rawStreamStr = match[1];
    const streamBytes = new Uint8Array(rawStreamStr.length);
    for (let j = 0; j < rawStreamStr.length; j++) {
      streamBytes[j] = rawStreamStr.charCodeAt(j);
    }

    let streamText = '';

    // Attempt native browser decompression using DecompressionStream
    try {
      if (typeof DecompressionStream !== 'undefined') {
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(streamBytes);
            controller.close();
          }
        });
        const decompressedStream = stream.pipeThrough(new DecompressionStream('deflate'));
        const reader = decompressedStream.getReader();
        const chunks: Uint8Array[] = [];
        let done = false;
        while (!done) {
          const res = await reader.read();
          if (res.value) chunks.push(res.value);
          done = res.done;
        }
        const totalLen = chunks.reduce((acc, c) => acc + c.length, 0);
        const merged = new Uint8Array(totalLen);
        let offset = 0;
        for (const c of chunks) {
          merged.set(c, offset);
          offset += c.length;
        }
        streamText = new TextDecoder('latin1').decode(merged);
      }
    } catch {
      // Fallback: raw stream text
      streamText = rawStreamStr;
    }

    // Extract text from (string) Tj operator
    const tjRegex = /\(([^)]*)\)\s*Tj/g;
    let tjMatch: RegExpExecArray | null;
    while ((tjMatch = tjRegex.exec(streamText)) !== null) {
      fullExtractedText += cleanPdfString(tjMatch[1]) + ' ';
    }

    // Extract text from [(array)] TJ operator
    const arrayRegex = /\[(.*?)\]\s*TJ/g;
    let arrayMatch: RegExpExecArray | null;
    while ((arrayMatch = arrayRegex.exec(streamText)) !== null) {
      const inner = arrayMatch[1];
      const partRegex = /\(([^)]*)\)/g;
      let partMatch: RegExpExecArray | null;
      let linePart = '';
      while ((partMatch = partRegex.exec(inner)) !== null) {
        linePart += cleanPdfString(partMatch[1]);
      }
      if (linePart) {
        fullExtractedText += linePart + '\n';
      }
    }
  }

  // Fallback if streams didn't yield text (e.g. uncompressed or text outside streams)
  if (fullExtractedText.trim().length < 50) {
    const directTj = /\(([^)]*)\)\s*Tj/g;
    let fallbackMatch: RegExpExecArray | null;
    while ((fallbackMatch = directTj.exec(binaryString)) !== null) {
      fullExtractedText += cleanPdfString(fallbackMatch[1]) + ' ';
    }
  }

  return fullExtractedText.trim();
}

function cleanPdfString(str: string): string {
  return str
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\\\/g, '\\')
    .replace(/\\([0-7]{1,3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)));
}

/**
 * Universal text parser that processes MCQ question strings from documents, PDFs, or CSVs.
 */
export function parseMcqsFromRawText(rawText: string): ParsedMcqQuestion[] {
  const text = rawText.trim();
  if (!text) return [];

  // Format 1: Direct JSON Array
  if (text.startsWith('[') && text.endsWith(']')) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].question) {
        return parsed.map((item, idx) => {
          const rawAns = typeof item.correctAnswer === 'number'
            ? item.correctAnswer
            : parseAnswerLetter(item.correctAnswer || item.answer);
          return {
            id: idx + 1,
            section: item.section || 'Paper II: English Literature',
            question: String(item.question || '').trim(),
            options: [
              String(item.options?.[0] || item.optionA || 'Option A').trim(),
              String(item.options?.[1] || item.optionB || 'Option B').trim(),
              String(item.options?.[2] || item.optionC || 'Option C').trim(),
              String(item.options?.[3] || item.optionD || 'Option D').trim()
            ],
            correctAnswer: maskAnswer(rawAns),
            rawCorrectIndex: rawAns,
            explanation: String(item.explanation || item.rationale || 'Verified scholarly rationale.').trim(),
            topicTag: String(item.topicTag || item.topic || 'General Pedagogy').trim()
          };
        });
      }
    } catch {}
  }

  // Format 2: CSV / Tab-Separated
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length > 1 && (lines[0].toLowerCase().includes('question') && lines[0].includes(','))) {
    const csvParsed = parseCsvMcqs(lines);
    if (csvParsed.length > 0) return csvParsed;
  }

  // Format 3: Natural Academic Document format (Word/PDF/TXT)
  const questions: ParsedMcqQuestion[] = [];
  
  // Split on newlines followed by a question number (e.g. "\n1. ", "\n2. ", "\nQ1: ")
  const rawBlocks = text.split(/\n\s*(?=(?:Q(?:uestion)?\s*[\.:#\-]?\s*)?\d+[\.:\)\-]\s+)/i);

  let currentId = 1;
  for (const block of rawBlocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    const parsed = parseSingleQuestionBlock(trimmed, currentId);
    if (parsed) {
      questions.push(parsed);
      currentId++;
    }
  }

  return questions;
}

function parseSingleQuestionBlock(block: string, id: number): ParsedMcqQuestion | null {
  // Strip question number prefix e.g. "1. " or "Q1: "
  const cleanedBlock = block.replace(/^(?:Q(?:uestion)?\s*[\.:#\-]?\s*)?\d+\s*[\.:\)\-]\s+/i, '').trim();

  // Find option A first: it must appear as A) or (A) or A. preceded by newline or start
  const optARegex = /(?:^|\n)\s*(?:\(?([A1])\)|\b([A1])[\.\:\)])\s+/i;
  const matchA = cleanedBlock.match(optARegex);
  if (!matchA || matchA.index === undefined) return null;

  const optAIndex = matchA.index + (matchA[0].startsWith('\n') ? 1 : 0);
  const questionText = cleanedBlock.substring(0, optAIndex).replace(/\n+/g, ' ').trim();
  const optionsAndAfter = cleanedBlock.substring(optAIndex);

  // Parse options A, B, C, D in order
  const optionRegex = /(?:^|\n)\s*(?:\(?([A-Da-d1-4])\)|\b([A-Da-d1-4])[\.\:\)])\s+([^\n\r]+)/g;
  const optionsMap: Record<string, string> = {};
  let optMatch: RegExpExecArray | null;

  while ((optMatch = optionRegex.exec(optionsAndAfter)) !== null) {
    const letter = (optMatch[1] || optMatch[2]).toUpperCase();
    const optText = optMatch[3].trim();
    if (!optionsMap[letter]) {
      optionsMap[letter] = optText;
    }
  }

  if (!questionText) return null;

  const optA = optionsMap['A'] || optionsMap['1'] || '';
  const optB = optionsMap['B'] || optionsMap['2'] || '';
  const optC = optionsMap['C'] || optionsMap['3'] || '';
  const optD = optionsMap['D'] || optionsMap['4'] || '';

  // Extract Answer
  let rawCorrectIndex = 0;
  const ansMatch = cleanedBlock.match(/(?:Answer|Ans|Correct\s*Option|Key)\s*[\.:\=\-]?\s*\(?([A-Da-d1-4])\)?/i);
  if (ansMatch) {
    rawCorrectIndex = parseAnswerLetter(ansMatch[1]);
  }

  // Extract Explanation / Rationale
  let explanation = 'Verified scholarly rationale.';
  const expMatch = cleanedBlock.match(/(?:Explanation|Rationale|Note|Reason|Solution)\s*[\.:\=\-]?\s*([\s\S]+?)(?=(?:\n\s*(?:Tag|Topic|Subject|Unit)\s*[\.:\=\-]|$))/i);
  if (expMatch) {
    explanation = expMatch[1].replace(/\n+/g, ' ').trim();
  }

  // Extract Topic / Tag
  let topicTag = 'General English Literature';
  const tagMatch = cleanedBlock.match(/(?:Tag|Topic|Subject|Unit)\s*[\.:\=\-]?\s*([^\n\r]+)/i);
  if (tagMatch) {
    topicTag = tagMatch[1].trim();
  }

  // Determine section
  let section = 'Paper II: English Literature';
  if (topicTag.toLowerCase().includes('pedagogy') || topicTag.toLowerCase().includes('teaching') || topicTag.toLowerCase().includes('research')) {
    section = 'Paper I: Pedagogy & Research Aptitude';
  } else if (topicTag.toLowerCase().includes('theory') || topicTag.toLowerCase().includes('criticism') || topicTag.toLowerCase().includes('elt')) {
    section = 'Literary Theory & ELT';
  }

  // Ensure we have at least 2 valid options to be an authentic MCQ
  const optionsList = [optA, optB, optC, optD].filter(Boolean);
  if (optionsList.length < 2) return null;

  return {
    id,
    section,
    question: questionText,
    options: [
      optA || 'Option A',
      optB || 'Option B',
      optC || 'Option C',
      optD || 'Option D'
    ],
    correctAnswer: maskAnswer(rawCorrectIndex),
    rawCorrectIndex,
    explanation,
    topicTag
  };
}

function parseAnswerLetter(letter: string | undefined): number {
  if (!letter) return 0;
  const upper = String(letter).trim().toUpperCase();
  if (upper === 'A' || upper === '1') return 0;
  if (upper === 'B' || upper === '2') return 1;
  if (upper === 'C' || upper === '3') return 2;
  if (upper === 'D' || upper === '4') return 3;
  return 0;
}

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
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

function parseCsvMcqs(lines: string[]): ParsedMcqQuestion[] {
  const results: ParsedMcqQuestion[] = [];
  for (let i = 1; i < lines.length; i++) {
    const rawCols = splitCsvLine(lines[i]);
    if (rawCols.length < 5) continue;
    const rawAns = parseAnswerLetter(rawCols[5]);
    results.push({
      id: i,
      section: rawCols[7] || 'Paper II: English Literature',
      question: rawCols[0] || `Question ${i}`,
      options: [
        rawCols[1] || 'Option A',
        rawCols[2] || 'Option B',
        rawCols[3] || 'Option C',
        rawCols[4] || 'Option D'
      ],
      correctAnswer: maskAnswer(rawAns),
      rawCorrectIndex: rawAns,
      explanation: rawCols[6] || 'Verified scholarly rationale.',
      topicTag: rawCols[8] || 'English Pedagogy'
    });
  }
  return results;
}
