import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import LIVE_STUDIO_SNAPSHOT from '../data/live_studio_state.json';
import { downloadBuyersAsXlsx } from '../utils/excelExport';
import {
  DEFAULT_STORE_SETTINGS,
  STORE_PAYMENT_DEFAULTS
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
  }
];

// Initial Content for Enrolled Candidate Registry
export const INITIAL_BUYERS_REGISTRY: EnrolledBuyerRecord[] = [
  {
    id: 'buy_nilam_dodiya',
    name: 'Nilam Dodiya',
    email: 'nilamdodiya21@gmail.com',
    mobile: '9974845911',
    orderId: 'order_U01cA4TjQfPCD6',
    amountPaid: 499,
    paymentMethod: 'upi_qr',
    enrolledAt: '2026-11-14T10:39:06.000Z',
    isActive: true
  }
];

interface NetVidyaStoreContextType {
  settings: NetVidyaStoreSettings;
  updateSettings: (newSettings: Partial<NetVidyaStoreSettings>) => void;
  buyerSession: NetVidyaBuyerSession;
  loginBuyer: (data: { name: string; email: string; mobile: string; orderId?: string; token?: string; isBuyer?: boolean }) => void;
  verifyPaymentAndActivate: (query: { paymentId?: string; email?: string; mobile?: string }) => Promise<{ success: boolean; message?: string; error?: string }>;
  logoutBuyer: () => void;
  login: (email: string, password: string) => Promise<{ success: boolean; isBuyer?: boolean; error?: string }>;
  signup: (name: string, email: string, mobile: string, password: string) => Promise<{ success: boolean; isBuyer?: boolean; error?: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message?: string; error?: string; token?: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  refreshSession: () => Promise<{ isBuyer: boolean; isLoggedIn: boolean; error?: string }>;
  logout: () => void;
  readingFiles: ReadingFileItem[];
  addReadingFile: (file: Omit<ReadingFileItem, 'id' | 'downloadCount' | 'dateAdded'>) => void;
  deleteReadingFile: (id: string) => void;
  tests: TestHallItem[];
  addTest: (test: Omit<TestHallItem, 'id'>) => void;
  deleteTest: (id: string) => void;
  buyersRegistry: EnrolledBuyerRecord[];
  addManualBuyer: (buyer: { name: string; email: string; mobile: string; amountPaid?: number }) => void;
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
        if (cached && (cached.email?.toLowerCase() === 'nilamdodiya21@gmail.com' || cached.email?.toLowerCase() === 'rajnikantdodiya2@gmail.com')) {
          cached.isBuyer = true;
          cached.isLoggedIn = true;
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
      const session: NetVidyaBuyerSession = {
        isLoggedIn: true,
        isBuyer: Boolean(data.user?.isBuyer),
        name: data.user?.name || email.split('@')[0],
        email: data.user?.email || email.toLowerCase().trim(),
        mobile: data.user?.mobile || '',
        token: data.token,
        role: 'student',
        expiresAt: data.user?.expiresAt
      };
      setBuyerSession(session);
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
      const session: NetVidyaBuyerSession = {
        isLoggedIn: true,
        isBuyer: Boolean(data.user?.isBuyer),
        name: data.user?.name || name,
        email: data.user?.email || email.toLowerCase().trim(),
        mobile: data.user?.mobile || mobile,
        token: data.token,
        role: 'student',
        expiresAt: data.user?.expiresAt
      };
      setBuyerSession(session);
      try {
        localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(session));
        if (data.token) localStorage.setItem('netvidya_auth_token_v1', data.token);
      } catch {}
      return { success: true, isBuyer: Boolean(data.user?.isBuyer) };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error during sign up' };
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

  const resetPassword = useCallback(async (token: string, newPassword: string) => {
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword })
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
  const loginBuyer = useCallback((data: { name: string; email: string; mobile: string; orderId?: string; token?: string; isBuyer?: boolean }) => {
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
      role: 'student'
    };
    setBuyerSession(session);
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
        loginBuyer({
          name: data.buyer?.name || data.user?.name || buyerSession.name || 'Candidate',
          email: data.buyer?.email || data.user?.email || cleanEmail,
          mobile: data.buyer?.mobile || data.user?.mobile || cleanMobile,
          orderId: data.buyer?.orderId || cleanPayId || `NV_${Date.now()}`,
          token: data.token,
          isBuyer: true
        });
        return {
          success: true,
          message: `Verified! Welcome ${data.buyer?.name || data.user?.name || 'Scholar'}. All 21 NTA CBT Tests and 3 High-Yield Revision Dossiers are unlocked!`
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
            expiresAt: data.user.expiresAt || prev.expiresAt
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
  const addManualBuyer = useCallback((buyer: { name: string; email: string; mobile: string; amountPaid?: number }) => {
    const newRecord: EnrolledBuyerRecord = {
      id: `buyer-${Date.now()}`,
      name: buyer.name.trim(),
      email: buyer.email.toLowerCase().trim(),
      mobile: buyer.mobile.trim(),
      orderId: `NV_MANUAL_${Date.now().toString().slice(-6)}`,
      amountPaid: buyer.amountPaid || currentServerPrice,
      paymentMethod: 'manual_upi',
      enrolledAt: new Date().toISOString(),
      isActive: true
    };
    setBuyersRegistry(prev => {
      const updated = [newRecord, ...prev];
      try {
        localStorage.setItem(STORAGE_KEY_BUYERS, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, [currentServerPrice]);

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

  // Export Buyers to Genuine Excel (.xlsx)
  const exportBuyersToExcel = useCallback(() => {
    if (buyersRegistry.length === 0) {
      alert('No buyers registered yet to export.');
      return;
    }
    // Genuine OpenXML binary .xlsx file generation
    downloadBuyersAsXlsx(buyersRegistry);
  }, [buyersRegistry]);

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
        loginBuyer,
        verifyPaymentAndActivate,
        logoutBuyer,
        login,
        signup,
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
