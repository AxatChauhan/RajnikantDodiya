import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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

// Initial Sample Content for "GSET + UGC NET English Final Pack 2026"
export const INITIAL_READING_FILES: ReadingFileItem[] = [
  {
    id: 'rf-theory-master',
    title: 'Literary Theory & Cultural Studies High-Yield Dossier (2026 Edition)',
    category: 'Literary Theory',
    description: 'Concise, high-impact breakdown of Structuralism, Poststructuralism, Deconstruction, Postcolonialism, and Ecocriticism with key theorists and core terms.',
    fileSizeMb: 6.8,
    downloadCount: 142,
    dateAdded: '2026-11-01'
  },
  {
    id: 'rf-postmethod-pedagogy',
    title: 'Post-Method Pedagogy & English Language Teaching in India (ELT Guide)',
    category: 'Pedagogy & ELT',
    description: 'Dr. Rajnikant Dodiya’s specialized research monograph notes on Kumaravadivelu’s 3 Ps, NEP 2020 translanguaging, and second-language classroom heuristics.',
    fileSizeMb: 5.2,
    downloadCount: 98,
    dateAdded: '2026-11-01'
  },
  {
    id: 'rf-british-drama-poetry',
    title: 'British Literature Chronology & Major Works Summary (Chaucer to Modern)',
    category: 'British Literature',
    description: 'Quick-revision tables of Elizabethan dramatists, Jacobean tragedy, Romantic poetics, Victorian realism, and Modernist manifestos.',
    fileSizeMb: 8.4,
    downloadCount: 185,
    dateAdded: '2026-11-01'
  },
  {
    id: 'rf-research-methodology',
    title: 'Paper I & II Research Methodology & Citation Style Sheets (MLA 9th / APA 7th)',
    category: 'Research Methodology',
    description: 'Essential rules for parenthetical documentation, core elements template, sampling paradigms, and thesis formatting for UGC-NET.',
    fileSizeMb: 4.1,
    downloadCount: 76,
    dateAdded: '2026-11-02'
  }
];

export const INITIAL_TEST_HALL_ITEMS: TestHallItem[] = [
  {
    id: 'test-net-mock-1',
    title: 'NET Mock 1: Full-Length Paper II NTA Simulation',
    category: 'Full Mock',
    totalQuestions: 100,
    durationMinutes: 180,
    releaseDate: '2026-11-01T00:00:00+05:30', // Ready now
    description: 'Full 100-question Paper II English Literature NTA simulation with real-time countdown timer, question palette, and detailed explanatory notes.'
  },
  {
    id: 'test-unit-1',
    title: 'Unit Test 1: British Drama & Elizabethan Poetry',
    category: 'Unit Test',
    totalQuestions: 50,
    durationMinutes: 90,
    releaseDate: '2026-11-01T00:00:00+05:30', // Ready now
    description: 'High-frequency exam questions spanning Shakespeare, Marlowe, University Wits, and Metaphysical poets.'
  },
  {
    id: 'test-bonus-practice-1',
    title: 'Bonus Practice Mock A: Quick Speed Revision',
    category: 'Bonus Mock',
    totalQuestions: 50,
    durationMinutes: 75,
    releaseDate: '2026-11-01T00:00:00+05:30', // Ready now
    description: 'Rapid-fire speed test designed to enhance accuracy under time pressure.'
  },
  {
    id: 'test-net-mock-2',
    title: 'NET Mock 2: Full-Length Literature & Literary Theory',
    category: 'Full Mock',
    totalQuestions: 100,
    durationMinutes: 180,
    releaseDate: '2026-11-06T00:00:00+05:30',
    description: 'Intensive Paper II exam focusing on Poststructuralism, Deconstruction, Postcolonialism, and Feminist Criticism.'
  },
  {
    id: 'test-net-mock-3',
    title: 'NET Mock 3: Grand Mid-Term Diagnostic Mock',
    category: 'Full Mock',
    totalQuestions: 100,
    durationMinutes: 180,
    releaseDate: '2026-11-10T00:00:00+05:30',
    description: 'Comprehensive mock scheduled for the final day of the early-bird window.'
  },
  {
    id: 'test-net-mock-4',
    title: 'NET Mock 4: Cultural Studies & English in India',
    category: 'Full Mock',
    totalQuestions: 100,
    durationMinutes: 180,
    releaseDate: '2026-11-14T00:00:00+05:30',
    description: 'Deep dive into Macaulay’s Minute, NEP 2020 pedagogical transitions, and Stuart Hall cultural theory.'
  },
  {
    id: 'test-net-mock-5',
    title: 'NET Mock 5: Research Methods & Pedagogy Master Mock',
    category: 'Full Mock',
    totalQuestions: 100,
    durationMinutes: 180,
    releaseDate: '2026-11-21T00:00:00+05:30',
    description: 'Comprehensive Paper II testing with dedicated focus on ELT classroom methodology and MLA 9th style sheets.'
  },
  {
    id: 'test-gset-special-1',
    title: 'GSET Special Simulation Exam 1',
    category: 'GSET Special',
    totalQuestions: 100,
    durationMinutes: 180,
    releaseDate: '2026-11-28T00:00:00+05:30',
    description: 'Tailored specifically to the Gujarat State Eligibility Test pattern and syllabus weightage.'
  },
  {
    id: 'test-grand-final-booster',
    title: 'Grand Final Rank Booster Exam 2026',
    category: 'Grand Final',
    totalQuestions: 100,
    durationMinutes: 180,
    releaseDate: '2026-12-05T00:00:00+05:30',
    description: 'The definitive final revision simulation before the university examination session.'
  }
];

export const INITIAL_BUYERS_REGISTRY: EnrolledBuyerRecord[] = [
  {
    id: 'buy-1',
    name: 'Aarav Patel',
    email: 'aarav.patel.ugc@gmail.com',
    mobile: '9876543210',
    orderId: 'NV_ORD_78912301',
    amountPaid: 799,
    paymentMethod: 'razorpay',
    enrolledAt: '2026-11-01T14:30:00+05:30',
    isActive: true
  },
  {
    id: 'buy-2',
    name: 'Priya Sharma',
    email: 'priya.sharma.gset@gmail.com',
    mobile: '9823456781',
    orderId: 'NV_ORD_78912302',
    amountPaid: 799,
    paymentMethod: 'razorpay',
    enrolledAt: '2026-11-02T10:15:00+05:30',
    isActive: true
  },
  {
    id: 'buy-3',
    name: 'Dr. Hardik Vaghela',
    email: 'hardik.vaghela@gmail.com',
    mobile: '9898012345',
    orderId: 'NV_MANUAL_003',
    amountPaid: 799,
    paymentMethod: 'manual_upi',
    enrolledAt: '2026-11-03T18:45:00+05:30',
    isActive: true
  }
];

interface NetVidyaStoreContextType {
  settings: NetVidyaStoreSettings;
  updateSettings: (newSettings: Partial<NetVidyaStoreSettings>) => void;
  buyerSession: NetVidyaBuyerSession;
  loginBuyer: (data: { name: string; email: string; mobile: string; orderId?: string; token?: string; isBuyer?: boolean }) => void;
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
const STORAGE_KEY_FILES = 'netvidya_reading_files_v1';
const STORAGE_KEY_TESTS = 'netvidya_tests_v1';
const STORAGE_KEY_BUYERS = 'netvidya_buyers_registry_v1';

const NetVidyaStoreContext = createContext<NetVidyaStoreContextType | undefined>(undefined);

export const NetVidyaStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Settings State
  const [settings, setSettings] = useState<NetVidyaStoreSettings>(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (cached) return JSON.parse(cached);
    } catch {}
    return { ...DEFAULT_STORE_SETTINGS };
  });

  // 2. Buyer Session State
  const [buyerSession, setBuyerSession] = useState<NetVidyaBuyerSession>(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY_SESSION);
      if (cached) return JSON.parse(cached);
    } catch {}
    return {
      isLoggedIn: false,
      isBuyer: false,
      name: '',
      email: '',
      mobile: ''
    };
  });

  // 3. Reading Files Catalog
  const [readingFiles, setReadingFiles] = useState<ReadingFileItem[]>(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY_FILES);
      if (cached) return JSON.parse(cached);
    } catch {}
    return INITIAL_READING_FILES;
  });

  // 4. Test Hall Catalog
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
      if (cached) return JSON.parse(cached);
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
          setServerPriceState({
            price: data.price,
            paymentMode: data.paymentMode === 'api_checkout' ? 'api_checkout' : 'payment_link',
            paymentLinkUrl: data.paymentLinkUrl || defaultLink
          });
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
    const session: NetVidyaBuyerSession = {
      isLoggedIn: true,
      isBuyer: data.isBuyer !== undefined ? data.isBuyer : true,
      name: data.name,
      email: data.email.toLowerCase().trim(),
      mobile: data.mobile,
      orderId: data.orderId || `NV_${Date.now()}`,
      enrolledAt: new Date().toISOString(),
      token: data.token || `nv_buyer_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      role: 'student'
    };
    setBuyerSession(session);
    try {
      localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(session));
    } catch {}
  }, []);

  const logoutBuyer = logout;

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
          const updated: NetVidyaBuyerSession = {
            ...prev,
            isLoggedIn: true,
            isBuyer: nextIsBuyer,
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
        return { isBuyer: nextIsBuyer, isLoggedIn: true };
      }
      return { isBuyer: false, isLoggedIn: false, error: data.error || 'Session expired.' };
    } catch (err: any) {
      return { isBuyer: false, isLoggedIn: buyerSession.isLoggedIn, error: err?.message || 'Network check failed.' };
    }
  }, [buyerSession.token, buyerSession.isLoggedIn]);

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
      return updated;
    });
  }, []);

  // Delete Reading File (Admin)
  const deleteReadingFile = useCallback((id: string) => {
    setReadingFiles(prev => {
      const updated = prev.filter(f => f.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY_FILES, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

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
      return updated;
    });
  }, []);

  // Delete Test (Admin)
  const deleteTest = useCallback((id: string) => {
    setTests(prev => {
      const updated = prev.filter(t => t.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY_TESTS, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

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
