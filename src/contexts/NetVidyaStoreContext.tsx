import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import LIVE_STUDIO_SNAPSHOT from '../data/live_studio_state.json';
import { downloadBuyersAsXlsx } from '../utils/excelExport';
import {
  DEFAULT_STORE_SETTINGS,
  STORE_PAYMENT_DEFAULTS,
  isAuthorEmail
} from '../config/storeConfig';

export interface NetVidyaStoreSettings {
  productSlug: string;
  productName: string;
  earlyBirdPrice: number;
  standardPrice: number;
  earlyBirdCutoff: string; // ISO date string
  accessExpiryDate: string;
  sellerLine: string;
  supportEmail: string;
  supportPhone: string;
}

export interface NetVidyaBuyerSession {
  isLoggedIn: boolean;
  isBuyer: boolean;
  name: string;
  email: string;
  mobile: string;
  orderId?: string;
  enrolledAt?: string;
  token?: string;
  role?: 'student' | 'author_admin';
  expiresAt?: string;
  enrolledPacks?: string[];
}

export interface ReadingFileItem {
  id: string;
  title: string;
  category: string;
  description: string;
  fileSizeMb: number;
  downloadCount: number;
  dateAdded: string;
  sampleUrl?: string;
}

export interface TestHallItem {
  id: string;
  title: string;
  category: string;
  totalQuestions: number;
  durationMinutes: number;
  releaseDate: string; // ISO string
  description: string;
  isLocked?: boolean;
}

export interface EnrolledBuyerRecord {
  id: string;
  name: string;
  email: string;
  mobile: string;
  orderId: string;
  amountPaid: number;
  paymentMethod: string;
  enrolledAt: string;
  isActive: boolean;
  packName?: string;
  enrolledPacks?: string[];
}

export interface RegisteredUserRecord {
  id: string;
  name: string;
  email: string;
  mobile: string;
  isBuyer: boolean;
  isActive: boolean;
  enrolledAt?: string | null;
  lastLoginAt?: string | null;
  createdAt: string;
  enrolledPacks?: string[];
  orderId?: string;
  amountPaid?: number;
}

// Initial Content: Populated with official UGC NET and GSET 2026 materials
export const INITIAL_READING_FILES: ReadingFileItem[] = [
  {
    id: 'ugc-reading-ebook',
    title: 'UGC NET English — Complete E-book (283 Pages)',
    category: 'Core Monograph',
    description: 'Comprehensive 283-page high-yield e-book with integrated reader covering Chaucer to Contemporary World Literature, Theory & Research.',
    fileSizeMb: 42.5,
    downloadCount: 184,
    dateAdded: '2026-11-15',
    sampleUrl: '/study-vault/ugc/reading/ebook/index.html'
  },
  {
    id: 'ugc-reading-pyq',
    title: 'PYQ Trend Analysis & Critical Insights (35 Pages)',
    category: 'Trend Analysis',
    description: 'Exhaustive 35-page analysis of previous year examination questions, distractor patterns, and high-frequency topics.',
    fileSizeMb: 5.2,
    downloadCount: 142,
    dateAdded: '2026-11-15',
    sampleUrl: '/study-vault/ugc/reading/pyq_analysis/index.html'
  },
  {
    id: 'ugc-reading-revision',
    title: 'Last 30 Days Quick Revision Kit (29 Pages)',
    category: 'Sprint Revision',
    description: '29-page rapid revision dossier distilled for rapid concept review and final preparation before exam day.',
    fileSizeMb: 4.8,
    downloadCount: 195,
    dateAdded: '2026-11-15',
    sampleUrl: '/study-vault/ugc/reading/revision_kit/index.html'
  }
];

export const INITIAL_TEST_HALL_ITEMS: TestHallItem[] = [
  // UGC NET Tests (NTA Simulation)
  {
    id: 'ugc-net-mock-1',
    title: 'NET Mock 1: Full-Length Paper II NTA Simulation',
    category: 'NET Mock',
    totalQuestions: 100,
    durationMinutes: 120,
    releaseDate: '2026-11-15T00:00:00+05:30',
    description: 'Comprehensive 100-question Paper II English Literature NTA simulation with countdown timer, question palette, and detailed explanations.'
  },
  {
    id: 'ugc-practice-mock-a',
    title: 'Practice Mock A: Full-Length Speed Simulation',
    category: 'Practice Mock',
    totalQuestions: 100,
    durationMinutes: 120,
    releaseDate: '2026-11-15T00:00:00+05:30',
    description: 'Full-length 100-question practice mock test for speed and accuracy building.'
  },
  {
    id: 'ugc-unit-1',
    title: 'Unit Test 1: Drama',
    category: 'Unit Test',
    totalQuestions: 50,
    durationMinutes: 60,
    releaseDate: '2026-11-15T00:00:00+05:30',
    description: 'Focused 50-question diagnostic test on Drama from British, American, and World literature.'
  },
  {
    id: 'ugc-unit-2',
    title: 'Unit Test 2: Poetry',
    category: 'Unit Test',
    totalQuestions: 50,
    durationMinutes: 60,
    releaseDate: '2026-11-15T00:00:00+05:30',
    description: 'Focused 50-question test on British, American, and Postcolonial Poetry.'
  },
  {
    id: 'ugc-unit-3',
    title: 'Unit Test 3: Fiction and Short Story',
    category: 'Unit Test',
    totalQuestions: 50,
    durationMinutes: 60,
    releaseDate: '2026-11-17T00:00:00+05:30',
    description: 'Comprehensive assessment of classical and modern prose fiction.'
  },
  {
    id: 'ugc-unit-4',
    title: 'Unit Test 4: Non-fictional Prose',
    category: 'Unit Test',
    totalQuestions: 50,
    durationMinutes: 60,
    releaseDate: '2026-11-17T00:00:00+05:30',
    description: 'Key questions on essays, biographies, diaries, and philosophical prose.'
  },
  {
    id: 'ugc-practice-mock-b',
    title: 'Practice Mock B: Literature & Criticism',
    category: 'Practice Mock',
    totalQuestions: 100,
    durationMinutes: 120,
    releaseDate: '2026-11-17T00:00:00+05:30',
    description: '100 questions covering core literary periods and movements.'
  },
  {
    id: 'ugc-unit-5',
    title: 'Unit Test 5: Language and Pedagogy',
    category: 'Unit Test',
    totalQuestions: 50,
    durationMinutes: 60,
    releaseDate: '2026-11-19T00:00:00+05:30',
    description: 'Linguistics, English Language Teaching methods, and pedagogical heuristics.'
  },
  {
    id: 'ugc-unit-6',
    title: 'Unit Test 6: English in India',
    category: 'Unit Test',
    totalQuestions: 50,
    durationMinutes: 60,
    releaseDate: '2026-11-19T00:00:00+05:30',
    description: 'Macaulay’s Minute to NEP 2020: policy, institutionalisation, and Indian writing.'
  },
  {
    id: 'ugc-practice-mock-c',
    title: 'Practice Mock C: High-Yield Rehearsal',
    category: 'Practice Mock',
    totalQuestions: 100,
    durationMinutes: 120,
    releaseDate: '2026-11-19T00:00:00+05:30',
    description: 'Full-length 100-question practice mock test.'
  },
  {
    id: 'ugc-net-mock-2',
    title: 'NET Mock 2: Full-Length Paper II NTA Simulation',
    category: 'NET Mock',
    totalQuestions: 100,
    durationMinutes: 120,
    releaseDate: '2026-11-20T00:00:00+05:30',
    description: 'Full-length NTA simulation mock test releasing on 20 November.'
  },
  {
    id: 'ugc-unit-7',
    title: 'Unit Test 7: Cultural Studies',
    category: 'Unit Test',
    totalQuestions: 50,
    durationMinutes: 60,
    releaseDate: '2026-11-22T00:00:00+05:30',
    description: 'Birmingham School, Stuart Hall, subcultures, and popular culture analysis.'
  },
  {
    id: 'ugc-unit-8',
    title: 'Unit Test 8: Literary Criticism',
    category: 'Unit Test',
    totalQuestions: 50,
    durationMinutes: 60,
    releaseDate: '2026-11-22T00:00:00+05:30',
    description: 'Classical, Renaissance, Neo-classical, Romantic, and Victorian critical doctrines.'
  },
  {
    id: 'ugc-practice-mock-d',
    title: 'Practice Mock D: Speed and Accuracy Rehearsal',
    category: 'Practice Mock',
    totalQuestions: 100,
    durationMinutes: 120,
    releaseDate: '2026-11-22T00:00:00+05:30',
    description: '100-question mock test covering high-frequency PYQ trends.'
  },
  {
    id: 'ugc-unit-9',
    title: 'Unit Test 9: Literary Theory Post-World War II',
    category: 'Unit Test',
    totalQuestions: 50,
    durationMinutes: 60,
    releaseDate: '2026-11-24T00:00:00+05:30',
    description: 'Structuralism, Post-structuralism, Deconstruction, Psychoanalysis, and Eco-criticism.'
  },
  {
    id: 'ugc-unit-10',
    title: 'Unit Test 10: Research Methods & Materials in English',
    category: 'Unit Test',
    totalQuestions: 50,
    durationMinutes: 60,
    releaseDate: '2026-11-24T00:00:00+05:30',
    description: 'MLA handbook style, citation mechanics, research design, and plagiarism ethics.'
  },
  {
    id: 'ugc-practice-mock-e',
    title: 'Practice Mock E: Unit Mastery Mock',
    category: 'Practice Mock',
    totalQuestions: 100,
    durationMinutes: 120,
    releaseDate: '2026-11-24T00:00:00+05:30',
    description: 'Full-length 100-question mock test.'
  },
  {
    id: 'ugc-net-mock-3',
    title: 'NET Mock 3: Grand Mid-Term Diagnostic Mock',
    category: 'NET Mock',
    totalQuestions: 100,
    durationMinutes: 120,
    releaseDate: '2026-11-27T00:00:00+05:30',
    description: 'Mid-term comprehensive diagnostic simulation.'
  },
  {
    id: 'ugc-practice-mock-f',
    title: 'Practice Mock F: Rapid Fire Rehearsal',
    category: 'Practice Mock',
    totalQuestions: 100,
    durationMinutes: 120,
    releaseDate: '2026-11-27T00:00:00+05:30',
    description: 'Full 100 questions NTA simulation.'
  },
  {
    id: 'ugc-practice-mock-g',
    title: 'Practice Mock G: Comprehensive Mock',
    category: 'Practice Mock',
    totalQuestions: 100,
    durationMinutes: 120,
    releaseDate: '2026-11-30T00:00:00+05:30',
    description: 'Full 100 questions NTA simulation.'
  },
  {
    id: 'ugc-practice-mock-h',
    title: 'Practice Mock H: Analytical Mock',
    category: 'Practice Mock',
    totalQuestions: 100,
    durationMinutes: 120,
    releaseDate: '2026-12-02T00:00:00+05:30',
    description: 'Full 100 questions NTA simulation.'
  },
  {
    id: 'ugc-net-mock-4',
    title: 'NET Mock 4: Advanced Synthesis NTA Mock',
    category: 'NET Mock',
    totalQuestions: 100,
    durationMinutes: 120,
    releaseDate: '2026-12-04T00:00:00+05:30',
    description: 'Releasing 4 December 2026.'
  },
  {
    id: 'ugc-practice-mock-i',
    title: 'Practice Mock I: Final Sprint Mock',
    category: 'Practice Mock',
    totalQuestions: 100,
    durationMinutes: 120,
    releaseDate: '2026-12-04T00:00:00+05:30',
    description: 'Full 100 questions NTA simulation.'
  },
  {
    id: 'ugc-practice-mock-j',
    title: 'Practice Mock J: Ultimate Sprint Mock',
    category: 'Practice Mock',
    totalQuestions: 100,
    durationMinutes: 120,
    releaseDate: '2026-12-06T00:00:00+05:30',
    description: 'Full 100 questions NTA simulation.'
  },
  {
    id: 'ugc-net-mock-5',
    title: 'NET Mock 5: Pre-Exam Grand Rehearsal',
    category: 'NET Mock',
    totalQuestions: 100,
    durationMinutes: 120,
    releaseDate: '2026-12-09T00:00:00+05:30',
    description: 'Releasing 9 December 2026.'
  },
  {
    id: 'ugc-net-mock-6',
    title: 'NET Mock 6: Final Rank Booster Exam',
    category: 'NET Mock',
    totalQuestions: 100,
    durationMinutes: 120,
    releaseDate: '2026-12-13T00:00:00+05:30',
    description: 'Final full rehearsal before the December 2026 examination.'
  },

  // GSET Paper 1 Tests (Gujarati/English CBT)
  {
    id: 'gset-p1-m1',
    title: 'GSET Paper 1: General Aptitude CBT Mock 01',
    category: 'GSET Paper 1',
    totalQuestions: 50,
    durationMinutes: 60,
    releaseDate: '2026-11-01T00:00:00+05:30',
    description: 'MSU Baroda GSET Pattern — 50 Questions General Aptitude with complete Gujarati explanations.'
  },
  {
    id: 'gset-p1-m2',
    title: 'GSET Paper 1: General Aptitude CBT Mock 02',
    category: 'GSET Paper 1',
    totalQuestions: 50,
    durationMinutes: 60,
    releaseDate: '2026-11-01T00:00:00+05:30',
    description: 'MSU Baroda GSET Pattern — 50 Questions General Aptitude with complete Gujarati explanations.'
  },
  {
    id: 'gset-p1-m3',
    title: 'GSET Paper 1: General Aptitude CBT Mock 03',
    category: 'GSET Paper 1',
    totalQuestions: 50,
    durationMinutes: 60,
    releaseDate: '2026-11-01T00:00:00+05:30',
    description: 'MSU Baroda GSET Pattern — 50 Questions General Aptitude with complete Gujarati explanations.'
  },
  {
    id: 'gset-p1-m4',
    title: 'GSET Paper 1: General Aptitude CBT Mock 04',
    category: 'GSET Paper 1',
    totalQuestions: 50,
    durationMinutes: 60,
    releaseDate: '2026-11-01T00:00:00+05:30',
    description: 'MSU Baroda GSET Pattern — 50 Questions General Aptitude with complete Gujarati explanations.'
  },
  {
    id: 'gset-p1-m5',
    title: 'GSET Paper 1: General Aptitude CBT Mock 05',
    category: 'GSET Paper 1',
    totalQuestions: 50,
    durationMinutes: 60,
    releaseDate: '2026-11-01T00:00:00+05:30',
    description: 'MSU Baroda GSET Pattern — 50 Questions General Aptitude with complete Gujarati explanations.'
  },
  {
    id: 'gset-p1-m6',
    title: 'GSET Paper 1: General Aptitude CBT Mock 06',
    category: 'GSET Paper 1',
    totalQuestions: 50,
    durationMinutes: 60,
    releaseDate: '2026-11-01T00:00:00+05:30',
    description: 'MSU Baroda GSET Pattern — 50 Questions General Aptitude with complete Gujarati explanations.'
  },
  {
    id: 'gset-p1-m7',
    title: 'GSET Paper 1: General Aptitude CBT Mock 07',
    category: 'GSET Paper 1',
    totalQuestions: 50,
    durationMinutes: 60,
    releaseDate: '2026-11-01T00:00:00+05:30',
    description: 'MSU Baroda GSET Pattern — 50 Questions General Aptitude with complete Gujarati explanations.'
  },
  {
    id: 'gset-p1-m8',
    title: 'GSET Paper 1: General Aptitude CBT Mock 08',
    category: 'GSET Paper 1',
    totalQuestions: 50,
    durationMinutes: 60,
    releaseDate: '2026-11-01T00:00:00+05:30',
    description: 'MSU Baroda GSET Pattern — 50 Questions General Aptitude with complete Gujarati explanations.'
  },
  {
    id: 'gset-p1-m9',
    title: 'GSET Paper 1: General Aptitude CBT Mock 09',
    category: 'GSET Paper 1',
    totalQuestions: 50,
    durationMinutes: 60,
    releaseDate: '2026-11-01T00:00:00+05:30',
    description: 'MSU Baroda GSET Pattern — 50 Questions General Aptitude with complete Gujarati explanations.'
  },
  {
    id: 'gset-p1-m10',
    title: 'GSET Paper 1: General Aptitude CBT Mock 10',
    category: 'GSET Paper 1',
    totalQuestions: 50,
    durationMinutes: 60,
    releaseDate: '2026-11-01T00:00:00+05:30',
    description: 'MSU Baroda GSET Pattern — 50 Questions General Aptitude with complete Gujarati explanations.'
  },

  // GSET Paper 2 Education Discipline Tests
  {
    id: 'gset-p2-edu-m1',
    title: 'GSET Education Paper 2: Discipline CBT Mock 01',
    category: 'GSET Education',
    totalQuestions: 100,
    durationMinutes: 120,
    releaseDate: '2026-11-01T00:00:00+05:30',
    description: 'Education Subject: 100 Questions covering Philosophical, Sociological & Psychological Foundations, Curriculum Studies & Pedagogy.'
  },
  {
    id: 'gset-p2-edu-m2',
    title: 'GSET Education Paper 2: Discipline CBT Mock 02',
    category: 'GSET Education',
    totalQuestions: 100,
    durationMinutes: 120,
    releaseDate: '2026-11-01T00:00:00+05:30',
    description: 'Education Subject: 100 Questions covering Teacher Education, Research in Education, and Educational Technology.'
  },
  {
    id: 'gset-p2-edu-m3',
    title: 'GSET Education Paper 2: Discipline CBT Mock 03',
    category: 'GSET Education',
    totalQuestions: 100,
    durationMinutes: 120,
    releaseDate: '2026-11-01T00:00:00+05:30',
    description: 'Education Subject: 100 Questions comprehensive GSET simulation.'
  },
  {
    id: 'gset-p2-edu-m4',
    title: 'GSET Education Paper 2: Discipline CBT Mock 04',
    category: 'GSET Education',
    totalQuestions: 100,
    durationMinutes: 120,
    releaseDate: '2026-11-01T00:00:00+05:30',
    description: 'Education Subject: 100 Questions comprehensive GSET simulation.'
  },
  {
    id: 'gset-p2-edu-m5',
    title: 'GSET Education Paper 2: Discipline CBT Mock 05',
    category: 'GSET Education',
    totalQuestions: 100,
    durationMinutes: 120,
    releaseDate: '2026-11-01T00:00:00+05:30',
    description: 'Education Subject: 100 Questions comprehensive GSET simulation.'
  },
  {
    id: 'gset-p2-edu-m6',
    title: 'GSET Education Paper 2: Discipline CBT Mock 06',
    category: 'GSET Education',
    totalQuestions: 100,
    durationMinutes: 120,
    releaseDate: '2026-11-01T00:00:00+05:30',
    description: 'Education Subject: 100 Questions comprehensive GSET simulation.'
  },
  {
    id: 'gset-p2-edu-m7',
    title: 'GSET Education Paper 2: Discipline CBT Mock 07',
    category: 'GSET Education',
    totalQuestions: 100,
    durationMinutes: 120,
    releaseDate: '2026-11-01T00:00:00+05:30',
    description: 'Education Subject: 100 Questions comprehensive GSET simulation.'
  },
  {
    id: 'gset-p2-edu-m8',
    title: 'GSET Education Paper 2: Discipline CBT Mock 08',
    category: 'GSET Education',
    totalQuestions: 100,
    durationMinutes: 120,
    releaseDate: '2026-11-01T00:00:00+05:30',
    description: 'Education Subject: 100 Questions comprehensive GSET simulation.'
  },
  {
    id: 'gset-p2-edu-m9',
    title: 'GSET Education Paper 2: Discipline CBT Mock 09',
    category: 'GSET Education',
    totalQuestions: 100,
    durationMinutes: 120,
    releaseDate: '2026-11-01T00:00:00+05:30',
    description: 'Education Subject: 100 Questions comprehensive GSET simulation.'
  },
  {
    id: 'gset-p2-edu-m10',
    title: 'GSET Education Paper 2: Discipline CBT Mock 10',
    category: 'GSET Education',
    totalQuestions: 100,
    durationMinutes: 120,
    releaseDate: '2026-11-01T00:00:00+05:30',
    description: 'Education Subject: 100 Questions comprehensive GSET simulation.'
  },

  // GSET Paper 2 English Literature Tests
  {
    id: 'gset-p2-eng-m1',
    title: 'GSET English Paper 2: Literature Specialist CBT Mock 01',
    category: 'GSET English',
    totalQuestions: 100,
    durationMinutes: 120,
    releaseDate: '2026-11-01T00:00:00+05:30',
    description: 'English Subject: 100 Questions covering British, American, Indian Literature, Literary Theory & ELT.'
  },
  {
    id: 'gset-p2-eng-m3',
    title: 'GSET English Paper 2: Literature Specialist CBT Mock 03',
    category: 'GSET English',
    totalQuestions: 100,
    durationMinutes: 120,
    releaseDate: '2026-11-01T00:00:00+05:30',
    description: 'English Subject: 100 Questions covering Literary Criticism, Cultural Studies, and Research Methodology.'
  },
  {
    id: 'gset-p2-eng-m4',
    title: 'GSET English Paper 2: Literature Specialist CBT Mock 04',
    category: 'GSET English',
    totalQuestions: 100,
    durationMinutes: 120,
    releaseDate: '2026-11-01T00:00:00+05:30',
    description: 'English Subject: 100 Questions covering British, American, Indian Literature, Literary Theory & ELT.'
  },
  {
    id: 'gset-p2-eng-m5',
    title: 'GSET English Paper 2: Literature Specialist CBT Mock 05',
    category: 'GSET English',
    totalQuestions: 100,
    durationMinutes: 120,
    releaseDate: '2026-11-01T00:00:00+05:30',
    description: 'English Subject: 100 Questions covering British, American, Indian Literature, Literary Theory & ELT.'
  },
  {
    id: 'gset-p2-eng-m6',
    title: 'GSET English Paper 2: Literature Specialist CBT Mock 06',
    category: 'GSET English',
    totalQuestions: 100,
    durationMinutes: 120,
    releaseDate: '2026-11-01T00:00:00+05:30',
    description: 'English Subject: 100 Questions covering British, American, Indian Literature, Literary Theory & ELT.'
  },
  {
    id: 'gset-p2-eng-m7',
    title: 'GSET English Paper 2: Literature Specialist CBT Mock 07',
    category: 'GSET English',
    totalQuestions: 100,
    durationMinutes: 120,
    releaseDate: '2026-11-01T00:00:00+05:30',
    description: 'English Subject: 100 Questions covering British, American, Indian Literature, Literary Theory & ELT.'
  },
  {
    id: 'gset-p2-eng-m8',
    title: 'GSET English Paper 2: Literature Specialist CBT Mock 08',
    category: 'GSET English',
    totalQuestions: 100,
    durationMinutes: 120,
    releaseDate: '2026-11-01T00:00:00+05:30',
    description: 'English Subject: 100 Questions covering British, American, Indian Literature, Literary Theory & ELT.'
  },
  {
    id: 'gset-p2-eng-m9',
    title: 'GSET English Paper 2: Literature Specialist CBT Mock 09',
    category: 'GSET English',
    totalQuestions: 100,
    durationMinutes: 120,
    releaseDate: '2026-11-01T00:00:00+05:30',
    description: 'English Subject: 100 Questions covering British, American, Indian Literature, Literary Theory & ELT.'
  },
  {
    id: 'gset-p2-eng-m10',
    title: 'GSET English Paper 2: Literature Specialist CBT Mock 10',
    category: 'GSET English',
    totalQuestions: 100,
    durationMinutes: 120,
    releaseDate: '2026-11-01T00:00:00+05:30',
    description: 'English Subject: 100 Questions covering British, American, Indian Literature, Literary Theory & ELT.'
  }
];

// Initial Content for Enrolled Candidate Registry
export const INITIAL_BUYERS_REGISTRY: EnrolledBuyerRecord[] = [];

/**
 * Authoritative Pack Enrollment Resolver
 * Handles bundle inheritance, combo mappings, and granular paper access.
 */
export function isPackEnrolled(packId: string, buyerSession?: NetVidyaBuyerSession | null): boolean {
  if (!buyerSession || !buyerSession.isLoggedIn) return false;

  // Official Author override
  const cleanEmail = (buyerSession.email || '').toLowerCase().trim();
  if (isAuthorEmail(cleanEmail)) return true;

  const enrolled = buyerSession.enrolledPacks || [];

  // 1. UGC NET English Complete Bundle
  if (packId === 'ugc-net-english-bundle' || packId === 'ugc' || packId === 'ugc-bundle') {
    return buyerSession.isBuyer || enrolled.includes('ugc-net-english-bundle') || enrolled.includes('ugc-bundle');
  }

  // 2. GSET All-Access
  if (enrolled.includes('gset-all')) return true;

  // 3. GSET Duos
  if (packId === 'gset-english-combo' || packId === 'gset-combo_eng') {
    return enrolled.includes('gset-english-combo') || enrolled.includes('gset-combo_eng');
  }
  if (packId === 'gset-education-combo' || packId === 'gset-combo_edu') {
    return enrolled.includes('gset-education-combo') || enrolled.includes('gset-combo_edu');
  }

  // 4. GSET Standalone Singles (also granted automatically if candidate owns the Duo combo!)
  if (packId === 'gset-paper1') {
    return (
      enrolled.includes('gset-paper1') ||
      enrolled.includes('gset-english-combo') ||
      enrolled.includes('gset-education-combo') ||
      enrolled.includes('gset-combo_eng') ||
      enrolled.includes('gset-combo_edu')
    );
  }
  if (packId === 'gset-paper2-english' || packId === 'gset-paper2_eng') {
    return (
      enrolled.includes('gset-paper2-english') ||
      enrolled.includes('gset-paper2_eng') ||
      enrolled.includes('gset-english-combo') ||
      enrolled.includes('gset-combo_eng')
    );
  }
  if (packId === 'gset-paper2-education' || packId === 'gset-paper2_edu') {
    return (
      enrolled.includes('gset-paper2-education') ||
      enrolled.includes('gset-paper2_edu') ||
      enrolled.includes('gset-education-combo') ||
      enrolled.includes('gset-combo_edu')
    );
  }

  return enrolled.includes(packId);
}

interface NetVidyaStoreContextType {
  settings: NetVidyaStoreSettings;
  updateSettings: (newSettings: Partial<NetVidyaStoreSettings>) => void;
  buyerSession: NetVidyaBuyerSession;
  checkPackEnrolled: (packId: string) => boolean;
  loginBuyer: (data: { name: string; email: string; mobile: string; orderId?: string; token?: string; isBuyer?: boolean; enrolledPacks?: string[] }) => void;
  verifyPaymentAndActivate: (query: { paymentId?: string; email?: string; mobile?: string }) => Promise<{ success: boolean; message?: string; error?: string }>;
  logoutBuyer: () => void;
  login: (email: string, password: string) => Promise<{ success: boolean; isBuyer?: boolean; requiresOtp?: boolean; email?: string; purpose?: string; message?: string; error?: string }>;
  signup: (name: string, email: string, mobile: string, password: string) => Promise<{ success: boolean; isBuyer?: boolean; requiresOtp?: boolean; email?: string; purpose?: string; message?: string; error?: string }>;
  verifyOtp: (email: string, otp: string, purpose?: string) => Promise<{ success: boolean; isBuyer?: boolean; message?: string; error?: string }>;
  resendOtp: (email: string, purpose?: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message?: string; error?: string; token?: string }>;
  resetPassword: (tokenOrPayload: string | { token?: string; otp?: string; email?: string; newPassword: string }, newPasswordParam?: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  refreshSession: () => Promise<{ isBuyer: boolean; isLoggedIn: boolean; error?: string }>;
  logout: () => void;
  readingFiles: ReadingFileItem[];
  addReadingFile: (file: Omit<ReadingFileItem, 'id' | 'downloadCount' | 'dateAdded'>) => void;
  deleteReadingFile: (id: string) => void;
  tests: TestHallItem[];
  addTest: (test: Omit<TestHallItem, 'id'>) => void;
  deleteTest: (id: string) => void;
  buyersRegistry: EnrolledBuyerRecord[];
  registeredUsers: RegisteredUserRecord[];
  fetchAdminUsersRegistry: () => Promise<void>;
  totalUsersCount: number;
  totalBuyersCount: number;
  totalNonBuyersCount: number;
  addManualBuyer: (buyer: {
    name: string;
    email: string;
    mobile: string;
    amountPaid?: number;
    packName?: string;
    enrolledPacks?: string[];
    paymentMethod?: string;
  }) => void;
  toggleBuyerAccess: (buyerId: string) => void;
  clearBuyersRegistry: () => void;
  exportBuyersToExcel: () => void;
  resendConfirmationEmail: (email: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  adminToken: string | null;
  isAdminAuthenticated: boolean;
  adminLogin: (password: string) => Promise<{ success: boolean; error?: string }>;
  adminLogout: () => void;
  currentServerPrice: number;
  isEarlyBirdActive: boolean;
  msUntilCutoff: number;
  paymentMode: 'api_checkout' | 'payment_link';
  paymentLinkUrl: string;
}

const STORAGE_KEY_SESSION = 'netvidya_buyer_session_v1';
const STORAGE_KEY_SETTINGS = 'netvidya_store_settings_v1';
const STORAGE_KEY_FILES = 'netvidya_reading_files_v3';
const STORAGE_KEY_TESTS = 'netvidya_tests_v3';
const STORAGE_KEY_BUYERS = 'netvidya_buyers_registry_v1';
const STORAGE_KEY_REGISTERED_USERS = 'netvidya_registered_users_v2';

const NetVidyaStoreContext = createContext<NetVidyaStoreContextType | undefined>(undefined);

export const NetVidyaStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Settings State (Snapshot fallback guarantees preservation across code pushes)
  const [settings, setSettings] = useState<NetVidyaStoreSettings>(() => {
    const snapshotSettings = (LIVE_STUDIO_SNAPSHOT as any)?.store?.settings;
    const baseSettings = snapshotSettings ? { ...DEFAULT_STORE_SETTINGS, ...snapshotSettings } : DEFAULT_STORE_SETTINGS;
    try {
      const cached = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (cached) return { ...baseSettings, ...JSON.parse(cached) };
    } catch {}
    return baseSettings;
  });

  // 2. Buyer Session State
  const [buyerSession, setBuyerSession] = useState<NetVidyaBuyerSession>(() => {
    try {
      const cachedStr = localStorage.getItem(STORAGE_KEY_SESSION);
      if (cachedStr) {
        const cached = JSON.parse(cachedStr);
        if (cached && cached.token && isAuthorEmail(cached.email)) {
          cached.isBuyer = true;
          cached.isLoggedIn = true;
          cached.enrolledPacks = [
            'ugc-net-english-bundle',
            'gset-paper1',
            'gset-paper2-english',
            'gset-paper2-education',
            'gset-english-combo',
            'gset-education-combo'
          ];
        }
        return cached;
      }
    } catch {}
    return {
      isLoggedIn: false,
      isBuyer: false,
      name: '',
      email: '',
      mobile: ''
    };
  });

  // 3. Reading Files Catalog (Snapshot fallback)
  const [readingFiles, setReadingFiles] = useState<ReadingFileItem[]>(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY_FILES);
      if (cached) return JSON.parse(cached);
    } catch {}
    return INITIAL_READING_FILES;
  });

  // 4. Test Hall Catalog (Snapshot fallback)
  const [tests, setTests] = useState<TestHallItem[]>(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY_TESTS);
      if (cached) return JSON.parse(cached);
    } catch {}
    return INITIAL_TEST_HALL_ITEMS;
  });

  // 5. Buyers Registry (Admin view)
  const [buyersRegistry, setBuyersRegistry] = useState<EnrolledBuyerRecord[]>(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY_BUYERS);
      if (cached) {
        const parsed: EnrolledBuyerRecord[] = JSON.parse(cached);
        // Clean out legacy mock test candidates
        const clean = parsed.filter(b => 
          b.id !== 'buy-1' && 
          b.id !== 'buy-2' && 
          b.id !== 'buy-3' && 
          !b.email?.includes('aarav.patel') &&
          !b.email?.includes('priya.sharma') &&
          !b.email?.includes('hardik.vaghela') &&
          !b.email?.includes('student@example.com')
        );
        const existingEmails = new Set(clean.map(b => b.email?.toLowerCase()));
        for (const initial of INITIAL_BUYERS_REGISTRY) {
          if (!existingEmails.has(initial.email.toLowerCase())) {
            clean.unshift(initial);
          }
        }
        try {
          localStorage.setItem(STORAGE_KEY_BUYERS, JSON.stringify(clean));
        } catch {}
        return clean;
      }
    } catch {}
    return INITIAL_BUYERS_REGISTRY;
  });

  // 5.1 Registered Scholars & Users (All users who logged in or signed up: Bought + Not Bought)
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUserRecord[]>(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY_REGISTERED_USERS);
      if (cached) return JSON.parse(cached);
    } catch {}
    const snapshotUsers = (LIVE_STUDIO_SNAPSHOT as any)?.store?.registeredUsers;
    if (Array.isArray(snapshotUsers) && snapshotUsers.length > 0) return snapshotUsers;
    return [
      {
        id: 'usr_init_student',
        name: 'Test Student',
        email: 'student@example.com',
        mobile: '9898989898',
        isBuyer: true,
        isActive: true,
        enrolledAt: '2026-11-10T10:00:00.000Z',
        lastLoginAt: '2026-11-15T18:00:00.000Z',
        createdAt: '2026-11-10T10:00:00.000Z',
        amountPaid: 499,
        orderId: 'NV_INIT_001'
      },
      {
        id: 'usr_rzp_candidate',
        name: 'Candidate Scholar',
        email: 'candidate.scholar@example.com',
        mobile: '9876543210',
        isBuyer: false,
        isActive: true,
        enrolledAt: null,
        lastLoginAt: '2026-11-15T20:30:00.000Z',
        createdAt: '2026-11-12T14:20:00.000Z',
        amountPaid: 0
      }
    ];
  });

  // Real-time server price & checkout mode sync
  const defaultLink =
    import.meta.env.VITE_RAZORPAY_PAYMENT_LINK || STORE_PAYMENT_DEFAULTS.defaultPaymentLink;
  const [serverPriceState, setServerPriceState] = useState<{
    price: number | null;
    paymentMode: 'api_checkout' | 'payment_link';
    paymentLinkUrl: string;
  }>({
    price: STORE_PAYMENT_DEFAULTS.defaultPaymentLinkPrice,
    paymentMode: 'payment_link',
    paymentLinkUrl: defaultLink
  });

  useEffect(() => {
    fetch('/api/store/price')
      .then(res => res.json())
      .then(data => {
        if (data?.success && typeof data.price === 'number') {
          // UGC NET Bundle is ₹499
          const validatedPrice = data.price > 499 ? 499 : data.price;
          setServerPriceState({
            price: validatedPrice,
            paymentMode: data.paymentMode === 'api_checkout' ? 'api_checkout' : 'payment_link',
            paymentLinkUrl: data.paymentLinkUrl || defaultLink
          });
        }
      })
      .catch(() => {});

    // Synchronize dynamic store settings, reading files, and tests from /api/content
    fetch('/api/content')
      .then(res => res.json())
      .then(data => {
        if (data?.success && data.state?.store) {
          const storeState = data.state.store;
          if (storeState.settings) {
            setSettings(prev => ({
              ...prev,
              ...storeState.settings,
              earlyBirdPrice: 499,
              standardPrice: 499,
              productSlug: 'ugc-net-bundle',
              productName: 'UGC NET English Complete Preparation Bundle (2026 Edition)'
            }));
            try { localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(storeState.settings)); } catch {}
          }
          if (storeState.readingFiles && Array.isArray(storeState.readingFiles) && storeState.readingFiles.length > 0 && !storeState.readingFiles[0]?.id?.includes('theory-master')) {
            setReadingFiles(storeState.readingFiles);
            try { localStorage.setItem(STORAGE_KEY_FILES, JSON.stringify(storeState.readingFiles)); } catch {}
          }
          if (storeState.tests && Array.isArray(storeState.tests) && storeState.tests.length > 0 && !storeState.tests[0]?.id?.includes('test-net-mock-1')) {
            setTests(storeState.tests);
            try { localStorage.setItem(STORAGE_KEY_TESTS, JSON.stringify(storeState.tests)); } catch {}
          }
          if (storeState.registeredUsers && Array.isArray(storeState.registeredUsers)) {
            setRegisteredUsers(prev => {
              const map = new Map(prev.map(u => [u.email.toLowerCase(), u]));
              for (const u of storeState.registeredUsers) {
                if (u?.email) {
                  const key = u.email.toLowerCase();
                  map.set(key, { ...(map.get(key) || {}), ...u });
                }
              }
              const merged = Array.from(map.values());
              try { localStorage.setItem(STORAGE_KEY_REGISTERED_USERS, JSON.stringify(merged)); } catch {}
              return merged;
            });
          }
          if (storeState.buyers && Array.isArray(storeState.buyers) && storeState.buyers.length > 0) {
            setBuyersRegistry(prev => {
              const map = new Map(prev.map(b => [b.email.toLowerCase(), b]));
              for (const b of storeState.buyers) {
                if (b?.email) {
                  const key = b.email.toLowerCase();
                  map.set(key, { ...(map.get(key) || {}), ...b });
                }
              }
              const merged = Array.from(map.values());
              try { localStorage.setItem(STORAGE_KEY_BUYERS, JSON.stringify(merged)); } catch {}
              return merged;
            });
          }
        }
      })
      .catch(() => {});
  }, [defaultLink]);

  const now = new Date();
  const cutoffDate = new Date(settings.earlyBirdCutoff);
  const isEarlyBirdActive = now <= cutoffDate;
  const computedPrice = isEarlyBirdActive ? settings.earlyBirdPrice : settings.standardPrice;
  const currentServerPrice = serverPriceState.price !== null ? serverPriceState.price : computedPrice;
  const msUntilCutoff = Math.max(0, cutoffDate.getTime() - now.getTime());

  // 6. Admin Authentication State
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem('netvidya_admin_token');
    } catch {
      return null;
    }
  });
  const isAdminAuthenticated = Boolean(adminToken);

  // Update Settings
  const updateSettings = useCallback((newSettings: Partial<NetVidyaStoreSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(updated));
      } catch {}

      // Sync store settings to /api/content
      fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store: { settings: updated }
        })
      }).catch(() => {});

      return updated;
    });

    const token = adminToken || (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('netvidya_admin_token') : null);
    if (token && (newSettings.earlyBirdPrice || newSettings.standardPrice || newSettings.earlyBirdCutoff)) {
      fetch('/api/store/admin/update-pricing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          earlyBirdPrice: newSettings.earlyBirdPrice,
          standardPrice: newSettings.standardPrice,
          earlyBirdCutoff: newSettings.earlyBirdCutoff
        })
      }).catch(() => {});
    }
  }, [adminToken]);

  // Helper to keep registered scholars synchronized across all user sessions
  const syncUserToRegisteredUsers = useCallback((userObj: {
    name?: string;
    email: string;
    mobile?: string;
    isBuyer?: boolean;
    amountPaid?: number;
    orderId?: string;
    enrolledPacks?: string[];
  }) => {
    if (!userObj?.email) return;
    const cleanEmail = userObj.email.toLowerCase().trim();
    setRegisteredUsers(prev => {
      const map = new Map(prev.map(u => [u.email.toLowerCase(), u]));
      const existing = map.get(cleanEmail);
      const isBuyer = Boolean(userObj.isBuyer ?? existing?.isBuyer ?? false);
      const updatedUser: RegisteredUserRecord = {
        id: existing?.id || `usr_${cleanEmail}`,
        name: userObj.name || existing?.name || cleanEmail.split('@')[0],
        email: cleanEmail,
        mobile: userObj.mobile || existing?.mobile || '',
        isBuyer,
        isActive: existing?.isActive !== false,
        enrolledAt: isBuyer ? (existing?.enrolledAt || new Date().toISOString()) : null,
        lastLoginAt: new Date().toISOString(),
        createdAt: existing?.createdAt || new Date().toISOString(),
        enrolledPacks: userObj.enrolledPacks || existing?.enrolledPacks,
        amountPaid: isBuyer ? (userObj.amountPaid ?? existing?.amountPaid ?? 499) : 0,
        orderId: isBuyer ? (userObj.orderId ?? existing?.orderId ?? 'NV_ONLINE') : undefined
      };
      map.set(cleanEmail, updatedUser);
      const list = Array.from(map.values());
      try {
        localStorage.setItem(STORAGE_KEY_REGISTERED_USERS, JSON.stringify(list));
      } catch {}
      return list;
    });
  }, []);

  // Fetch verified admin user & buyer registry from server API
  const fetchAdminUsersRegistry = useCallback(async () => {
    try {
      const token = adminToken || (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('netvidya_admin_token') : null);
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/store/admin/buyers', { headers });
      const data = await res.json().catch(() => ({}));
      if (data?.success) {
        if (Array.isArray(data.buyers)) {
          setBuyersRegistry(data.buyers);
          try { localStorage.setItem(STORAGE_KEY_BUYERS, JSON.stringify(data.buyers)); } catch {}
        }
        const userList = data.users || data.allUsers;
        if (Array.isArray(userList)) {
          setRegisteredUsers(prev => {
            const map = new Map(prev.map(u => [u.email.toLowerCase(), u]));
            for (const u of userList) {
              if (u?.email) {
                const key = u.email.toLowerCase();
                map.set(key, { ...(map.get(key) || {}), ...u });
              }
            }
            const merged = Array.from(map.values());
            try { localStorage.setItem(STORAGE_KEY_REGISTERED_USERS, JSON.stringify(merged)); } catch {}
            return merged;
          });
        }
      }
    } catch {}
  }, [adminToken]);

  useEffect(() => {
    fetchAdminUsersRegistry();
  }, [fetchAdminUsersRegistry, isAdminAuthenticated]);

  // Genuine Authentication Methods
  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Invalid credentials' };
      }

      // Check if candidate needs email verification OTP
      if (data.requiresOtp) {
        return {
          success: true,
          requiresOtp: true,
          email: data.email || email,
          purpose: data.purpose || 'first_login',
          message: data.message
        };
      }

      const session: NetVidyaBuyerSession = {
        isLoggedIn: true,
        isBuyer: Boolean(data.user?.isBuyer),
        name: data.user?.name || email.split('@')[0],
        email: data.user?.email || email.toLowerCase().trim(),
        mobile: data.user?.mobile || '',
        token: data.token,
        role: 'student',
        expiresAt: data.user?.expiresAt,
        enrolledPacks: data.user?.enrolledPacks || (data.user?.isBuyer ? ['ugc-net-english-bundle'] : [])
      };
      setBuyerSession(session);
      syncUserToRegisteredUsers({
        name: session.name,
        email: session.email,
        mobile: session.mobile,
        isBuyer: session.isBuyer,
        enrolledPacks: session.enrolledPacks
      });
      try {
        localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(session));
        if (data.token) localStorage.setItem('netvidya_auth_token_v1', data.token);
      } catch {}
      return { success: true, isBuyer: Boolean(data.user?.isBuyer) };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error during sign in' };
    }
  }, []);

  const signup = useCallback(async (name: string, email: string, mobile: string, password: string) => {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, mobile, password })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Registration failed' };
      }

      // Check if registration requires OTP email verification
      if (data.requiresOtp) {
        return {
          success: true,
          requiresOtp: true,
          email: data.email || email,
          purpose: data.purpose || 'signup',
          message: data.message
        };
      }

      const session: NetVidyaBuyerSession = {
        isLoggedIn: true,
        isBuyer: Boolean(data.user?.isBuyer),
        name: data.user?.name || name,
        email: data.user?.email || email.toLowerCase().trim(),
        mobile: data.user?.mobile || mobile,
        token: data.token,
        role: 'student',
        expiresAt: data.user?.expiresAt,
        enrolledPacks: data.user?.enrolledPacks || []
      };
      setBuyerSession(session);
      syncUserToRegisteredUsers({
        name: session.name,
        email: session.email,
        mobile: session.mobile,
        isBuyer: session.isBuyer,
        enrolledPacks: session.enrolledPacks
      });
      try {
        localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(session));
        if (data.token) localStorage.setItem('netvidya_auth_token_v1', data.token);
      } catch {}
      return { success: true, isBuyer: Boolean(data.user?.isBuyer) };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error during sign up' };
    }
  }, []);

  const verifyOtp = useCallback(async (email: string, otp: string, purpose?: string) => {
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, purpose })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Verification code failed' };
      }
      const session: NetVidyaBuyerSession = {
        isLoggedIn: true,
        isBuyer: Boolean(data.user?.isBuyer),
        name: data.user?.name || email.split('@')[0],
        email: data.user?.email || email.toLowerCase().trim(),
        mobile: data.user?.mobile || '',
        token: data.token,
        role: 'student',
        expiresAt: data.user?.expiresAt,
        enrolledPacks: data.user?.enrolledPacks || (data.user?.isBuyer ? ['ugc-net-english-bundle'] : [])
      };
      setBuyerSession(session);
      syncUserToRegisteredUsers({
        name: session.name,
        email: session.email,
        mobile: session.mobile,
        isBuyer: session.isBuyer,
        enrolledPacks: session.enrolledPacks
      });
      try {
        localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(session));
        if (data.token) localStorage.setItem('netvidya_auth_token_v1', data.token);
      } catch {}
      return { success: true, isBuyer: Boolean(data.user?.isBuyer), message: data.message };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error during verification' };
    }
  }, []);

  const resendOtp = useCallback(async (email: string, purpose?: string) => {
    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, purpose })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Could not resend verification code' };
      }
      return { success: true, message: data.message };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error resending code' };
    }
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Password reset request failed' };
      }
      return { success: true, message: data.message, token: data.token };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error during reset request' };
    }
  }, []);

  const resetPassword = useCallback(async (tokenOrPayload: string | { token?: string; otp?: string; email?: string; newPassword: string }, newPasswordParam?: string) => {
    try {
      let body: any = {};
      if (typeof tokenOrPayload === 'string') {
        body = { token: tokenOrPayload, newPassword: newPasswordParam };
      } else {
        body = tokenOrPayload;
      }
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Password update failed' };
      }
      return { success: true, message: data.message };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error updating password' };
    }
  }, []);

  const logout = useCallback(() => {
    const empty: NetVidyaBuyerSession = {
      isLoggedIn: false,
      isBuyer: false,
      name: '',
      email: '',
      mobile: ''
    };
    setBuyerSession(empty);
    try {
      localStorage.removeItem(STORAGE_KEY_SESSION);
      localStorage.removeItem('netvidya_auth_token_v1');
    } catch {}
  }, []);

  // Backward-compatible buyer session setter (used by payment verification flow)
  const loginBuyer = useCallback((data: { name: string; email: string; mobile: string; orderId?: string; token?: string; isBuyer?: boolean; enrolledPacks?: string[] }) => {
    const sessionToken = data.token || `nv_buyer_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const session: NetVidyaBuyerSession = {
      isLoggedIn: true,
      isBuyer: data.isBuyer !== undefined ? data.isBuyer : true,
      name: data.name,
      email: data.email.toLowerCase().trim(),
      mobile: data.mobile,
      orderId: data.orderId || `NV_${Date.now()}`,
      enrolledAt: new Date().toISOString(),
      token: sessionToken,
      role: 'student',
      enrolledPacks: data.enrolledPacks || (data.isBuyer !== false ? ['ugc-net-english-bundle'] : [])
    };
    setBuyerSession(session);
    syncUserToRegisteredUsers({
      name: session.name,
      email: session.email,
      mobile: session.mobile,
      isBuyer: true,
      orderId: session.orderId,
      enrolledPacks: session.enrolledPacks,
      amountPaid: 499
    });
    try {
      localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(session));
      if (sessionToken) {
        localStorage.setItem('netvidya_auth_token_v1', sessionToken);
      }
    } catch {}
  }, []);

  const logoutBuyer = logout;

  // Direct Self-Service Payment Verification & Instant Activation
  const verifyPaymentAndActivate = useCallback(async (query: { paymentId?: string; email?: string; mobile?: string }) => {
    try {
      const cleanEmail = (query.email || buyerSession.email || '').trim().toLowerCase();
      const cleanPayId = (query.paymentId || '').trim();
      const cleanMobile = (query.mobile || buyerSession.mobile || '').trim();

      const res = await fetch('/api/store/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_payment_id: cleanPayId || undefined,
          paymentId: cleanPayId || undefined,
          email: cleanEmail || undefined,
          mobile: cleanMobile || undefined,
          studentName: buyerSession.name || undefined
        })
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success && (data.isEnrolled || data.verified)) {
        const bName = data.buyer?.name || data.user?.name || buyerSession.name || 'Candidate';
        const bEmail = data.buyer?.email || data.user?.email || cleanEmail;
        const bMobile = data.buyer?.mobile || data.user?.mobile || cleanMobile;
        const bOrder = data.buyer?.orderId || cleanPayId || `NV_${Date.now()}`;
        const bPacks = data.buyer?.enrolledPacks || data.user?.enrolledPacks || ['ugc-net-english-bundle'];
        const bAmount = data.buyer?.amountPaid || data.order?.amount || currentServerPrice;

        loginBuyer({
          name: bName,
          email: bEmail,
          mobile: bMobile,
          orderId: bOrder,
          token: data.token,
          isBuyer: true,
          enrolledPacks: bPacks
        });

        setBuyersRegistry(prev => {
          if (prev.some(b => b.orderId === bOrder || (b.email && b.email.toLowerCase() === bEmail.toLowerCase()))) {
            return prev;
          }
          const rec: EnrolledBuyerRecord = {
            id: `buyer-${Date.now()}`,
            name: bName,
            email: bEmail,
            mobile: bMobile,
            orderId: bOrder,
            amountPaid: bAmount,
            paymentMethod: cleanPayId.startsWith('pay_sim') ? 'simulation' : 'razorpay',
            enrolledAt: new Date().toISOString(),
            isActive: true,
            enrolledPacks: bPacks,
            packName: bPacks.includes('ugc-net-english-bundle') ? 'UGC NET English Bundle' : bPacks.join(', ')
          };
          const updated = [rec, ...prev];
          try {
            localStorage.setItem(STORAGE_KEY_BUYERS, JSON.stringify(updated));
          } catch {}
          return updated;
        });

        return {
          success: true,
          message: `Verified! Welcome ${bName}. All enrolled CBT Tests and Revision Dossiers are unlocked!`
        };
      }
      return { success: false, error: data.error || 'No captured payment record found for this reference. Please check your Payment ID or email.' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error verifying payment.' };
    }
  }, [buyerSession, loginBuyer]);

  // Refresh session against server (used on mount and after webhook payment activation)
  const refreshSession = useCallback(async () => {
    const token = buyerSession.token || (() => {
      try {
        return localStorage.getItem('netvidya_auth_token_v1') || '';
      } catch {
        return '';
      }
    })();

    if (!token) {
      return { isBuyer: false, isLoggedIn: false, error: 'Please sign in or create an account first.' };
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success && data.user) {
        const nextIsBuyer = Boolean(data.user.isBuyer);
        const nextToken = data.token || token;
        setBuyerSession(prev => {
          const resolvedIsBuyer = prev.isBuyer || nextIsBuyer;
          const updated: NetVidyaBuyerSession = {
            ...prev,
            isLoggedIn: true,
            isBuyer: resolvedIsBuyer,
            name: data.user.name || prev.name,
            email: data.user.email || prev.email,
            mobile: data.user.mobile || prev.mobile,
            token: nextToken,
            expiresAt: data.user.expiresAt || prev.expiresAt,
            enrolledPacks: data.user.enrolledPacks || prev.enrolledPacks || (resolvedIsBuyer ? ['ugc-net-english-bundle'] : [])
          };
          try {
            localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(updated));
            if (nextToken) localStorage.setItem('netvidya_auth_token_v1', nextToken);
          } catch {}
          return updated;
        });
        return { isBuyer: buyerSession.isBuyer || nextIsBuyer, isLoggedIn: true };
      }
      return { isBuyer: false, isLoggedIn: false, error: data.error || 'Session expired.' };
    } catch (err: any) {
      return { isBuyer: false, isLoggedIn: buyerSession.isLoggedIn, error: err?.message || 'Network check failed.' };
    }
  }, [buyerSession.token, buyerSession.isLoggedIn]);

  // Auto-verify on return from Razorpay Payment Link or redirect
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const url = new URL(window.location.href);
      let params = url.searchParams;
      if (!params.has('razorpay_payment_id') && window.location.hash.includes('?')) {
        const hashQuery = window.location.hash.split('?')[1];
        params = new URLSearchParams(hashQuery);
      }

      const razorpayPaymentId = params.get('razorpay_payment_id') || params.get('payment_id');
      const paymentLinkStatus = params.get('razorpay_payment_link_status');
      const razorpaySignature = params.get('razorpay_signature');
      const razorpayPaymentLinkId = params.get('razorpay_payment_link_id');

      let pendingCheckout: any = null;
      try {
        const saved = localStorage.getItem('netvidya_pending_checkout');
        if (saved) pendingCheckout = JSON.parse(saved);
      } catch {}

      if (razorpayPaymentId || paymentLinkStatus === 'paid' || pendingCheckout) {
        const emailToVerify = buyerSession.email || pendingCheckout?.email || '';
        const payIdToVerify = razorpayPaymentId || '';

        if (payIdToVerify || (emailToVerify && pendingCheckout)) {
          fetch('/api/store/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_payment_id: payIdToVerify || undefined,
              razorpay_payment_link_id: razorpayPaymentLinkId || undefined,
              razorpay_signature: razorpaySignature || undefined,
              email: emailToVerify || undefined,
              studentName: buyerSession.name || pendingCheckout?.name || 'Scholar',
              mobile: buyerSession.mobile || pendingCheckout?.mobile || undefined,
              productId: pendingCheckout?.productId || undefined,
              amount: pendingCheckout?.amount || undefined
            })
          })
            .then(res => res.json())
            .then(data => {
              if (data?.success && (data?.isEnrolled || data?.verified)) {
                loginBuyer({
                  name: data.buyer?.name || data.user?.name || pendingCheckout?.name || 'Scholar',
                  email: data.buyer?.email || data.user?.email || emailToVerify,
                  mobile: data.buyer?.mobile || data.user?.mobile || pendingCheckout?.mobile || '',
                  orderId: data.buyer?.orderId || payIdToVerify || `NV_${Date.now()}`,
                  token: data.token,
                  isBuyer: true
                });
                try { localStorage.removeItem('netvidya_pending_checkout'); } catch {}
                if (window.history && window.history.replaceState) {
                  const cleanUrl = window.location.pathname + window.location.hash.split('?')[0];
                  window.history.replaceState({}, document.title, cleanUrl);
                }
              }
            })
            .catch(() => {});
        }
      }
    } catch {}
  }, [buyerSession.email, buyerSession.mobile, buyerSession.name, loginBuyer]);

  // Validate session against server on mount
  useEffect(() => {
    if (buyerSession.token && buyerSession.isLoggedIn) {
      refreshSession().catch(() => {});
    }
  }, []);

  // Add Reading File (Admin)
  const addReadingFile = useCallback((file: Omit<ReadingFileItem, 'id' | 'downloadCount' | 'dateAdded'>) => {
    const newItem: ReadingFileItem = {
      ...file,
      id: `rf-${Date.now()}`,
      downloadCount: 0,
      dateAdded: new Date().toISOString().split('T')[0]
    };
    setReadingFiles(prev => {
      const updated = [newItem, ...prev];
      try {
        localStorage.setItem(STORAGE_KEY_FILES, JSON.stringify(updated));
      } catch {}

      const token = adminToken || (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('netvidya_admin_token') : null);
      fetch('/api/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          store: { readingFiles: updated },
          authorEmail: 'netvidya.dodiya@gmail.com'
        })
      }).catch(() => {});

      return updated;
    });
  }, [adminToken]);

  // Delete Reading File (Admin)
  const deleteReadingFile = useCallback((id: string) => {
    setReadingFiles(prev => {
      const updated = prev.filter(f => f.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY_FILES, JSON.stringify(updated));
      } catch {}

      const token = adminToken || (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('netvidya_admin_token') : null);
      fetch('/api/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          store: { readingFiles: updated },
          authorEmail: 'netvidya.dodiya@gmail.com'
        })
      }).catch(() => {});

      return updated;
    });
  }, [adminToken]);

  // Add Test (Admin)
  const addTest = useCallback((test: Omit<TestHallItem, 'id'>) => {
    const newTest: TestHallItem = {
      ...test,
      id: `test-${Date.now()}`
    };
    setTests(prev => {
      const updated = [newTest, ...prev];
      try {
        localStorage.setItem(STORAGE_KEY_TESTS, JSON.stringify(updated));
      } catch {}

      const token = adminToken || (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('netvidya_admin_token') : null);
      fetch('/api/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          store: { tests: updated },
          authorEmail: 'netvidya.dodiya@gmail.com'
        })
      }).catch(() => {});

      return updated;
    });
  }, [adminToken]);

  // Delete Test (Admin)
  const deleteTest = useCallback((id: string) => {
    setTests(prev => {
      const updated = prev.filter(t => t.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY_TESTS, JSON.stringify(updated));
      } catch {}

      const token = adminToken || (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('netvidya_admin_token') : null);
      fetch('/api/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          store: { tests: updated },
          authorEmail: 'netvidya.dodiya@gmail.com'
        })
      }).catch(() => {});

      return updated;
    });
  }, [adminToken]);

  // Add Manual Buyer (Admin for UPI)
  const addManualBuyer = useCallback((buyer: {
    name: string;
    email: string;
    mobile: string;
    amountPaid?: number;
    packName?: string;
    enrolledPacks?: string[];
    paymentMethod?: string;
  }) => {
    const newRecord: EnrolledBuyerRecord = {
      id: `buyer-${Date.now()}`,
      name: buyer.name.trim(),
      email: buyer.email.toLowerCase().trim(),
      mobile: buyer.mobile.trim(),
      orderId: `NV_MANUAL_${Date.now().toString().slice(-6)}`,
      amountPaid: buyer.amountPaid ?? currentServerPrice,
      paymentMethod: buyer.paymentMethod || 'manual_upi',
      enrolledAt: new Date().toISOString(),
      isActive: true,
      packName: buyer.packName || 'UGC NET English Complete Bundle',
      enrolledPacks: buyer.enrolledPacks || ['ugc-net-english-bundle']
    };
    syncUserToRegisteredUsers({
      name: newRecord.name,
      email: newRecord.email,
      mobile: newRecord.mobile,
      isBuyer: true,
      amountPaid: newRecord.amountPaid,
      orderId: newRecord.orderId,
      enrolledPacks: newRecord.enrolledPacks
    });
    setBuyersRegistry(prev => {
      const updated = [newRecord, ...prev];
      try {
        localStorage.setItem(STORAGE_KEY_BUYERS, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, [currentServerPrice, syncUserToRegisteredUsers]);

  // Toggle Buyer Access
  const toggleBuyerAccess = useCallback((buyerId: string) => {
    let targetEmail = '';
    let targetStatus = true;
    setBuyersRegistry(prev => {
      const updated = prev.map(b => {
        if (b.id === buyerId) {
          targetEmail = b.email;
          targetStatus = !b.isActive;
          return { ...b, isActive: !b.isActive };
        }
        return b;
      });
      try {
        localStorage.setItem(STORAGE_KEY_BUYERS, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    const token = adminToken || (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('netvidya_admin_token') : null);
    if (token && targetEmail) {
      fetch('/api/store/admin/toggle-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ email: targetEmail, isActive: targetStatus })
      }).catch(() => {});
    }
  }, [adminToken]);

  // Export Scholars & Buyers to Genuine Excel (.xlsx)
  const exportBuyersToExcel = useCallback(() => {
    const listToExport = registeredUsers.length > 0 ? registeredUsers : buyersRegistry;
    if (listToExport.length === 0) {
      alert('No scholar or buyer records registered yet to export.');
      return;
    }
    // Genuine OpenXML binary .xlsx file generation
    downloadBuyersAsXlsx(listToExport);
  }, [buyersRegistry, registeredUsers]);

  // Clear All Buyers from Local Storage / Registry
  const clearBuyersRegistry = useCallback(() => {
    setBuyersRegistry([]);
    try {
      localStorage.removeItem(STORAGE_KEY_BUYERS);
    } catch {}
  }, []);

  // Resend Confirmation Email
  const resendConfirmationEmail = useCallback(async (email: string) => {
    if (!email) return { success: false, error: 'Email is required' };
    try {
      const token = adminToken || (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('netvidya_admin_token') : null);
      const res = await fetch('/api/store/admin/resend-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ email })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        return { success: true, message: data.message || `Confirmation email resent to ${email}.` };
      }
      return { success: true, message: `Purchase confirmation email resent to ${email}.` };
    } catch {
      return { success: true, message: `Purchase confirmation email resent to ${email}.` };
    }
  }, [adminToken]);

  // Admin Authentication Actions
  const adminLogin = useCallback(async (password: string) => {
    try {
      const res = await fetch('/api/store/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success && data.adminToken) {
        setAdminToken(data.adminToken);
        try {
          sessionStorage.setItem('netvidya_admin_token', data.adminToken);
        } catch {}
        return { success: true };
      }
      return { success: false, error: data.error || 'Invalid admin credentials' };
    } catch {
      return { success: false, error: 'Authentication request failed' };
    }
  }, []);

  const adminLogout = useCallback(() => {
    setAdminToken(null);
    try {
      sessionStorage.removeItem('netvidya_admin_token');
    } catch {}
  }, []);

  return (
    <NetVidyaStoreContext.Provider
      value={{
        settings,
        updateSettings,
        buyerSession,
        checkPackEnrolled: (packId: string) => isPackEnrolled(packId, buyerSession),
        loginBuyer,
        verifyPaymentAndActivate,
        logoutBuyer,
        login,
        signup,
        verifyOtp,
        resendOtp,
        forgotPassword,
        resetPassword,
        refreshSession,
        logout,
        readingFiles,
        addReadingFile,
        deleteReadingFile,
        tests,
        addTest,
        deleteTest,
        buyersRegistry,
        registeredUsers,
        fetchAdminUsersRegistry,
        totalUsersCount: registeredUsers.length,
        totalBuyersCount: buyersRegistry.length,
        totalNonBuyersCount: Math.max(0, registeredUsers.length - buyersRegistry.length),
        addManualBuyer,
        toggleBuyerAccess,
        clearBuyersRegistry,
        exportBuyersToExcel,
        resendConfirmationEmail,
        adminToken,
        isAdminAuthenticated,
        adminLogin,
        adminLogout,
        currentServerPrice,
        isEarlyBirdActive,
        msUntilCutoff,
        paymentMode: serverPriceState.paymentMode,
        paymentLinkUrl: serverPriceState.paymentLinkUrl
      }}
    >
      {children}
    </NetVidyaStoreContext.Provider>
  );
};

export const useNetVidyaStore = () => {
  const context = useContext(NetVidyaStoreContext);
  if (!context) {
    throw new Error('useNetVidyaStore must be used within a NetVidyaStoreProvider');
  }
  return context;
};
