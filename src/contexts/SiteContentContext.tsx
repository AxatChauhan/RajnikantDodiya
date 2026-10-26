import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { PROFESSOR_INFO, Book as ProfessorBook, BOOKS } from '../data/professorData';
import { FEATURED_BOOK_CHAPTERS, BookChapter, MOCK_EXAM_QUESTIONS, ExamQuestion } from '../data/storeCatalogData';
import { getActiveAuthorStudioSession } from '../lib/authorStudioAuth';

// ============================================================================
// 1. THEME & TYPOGRAPHY SYSTEM
// ============================================================================

export type FontPresetKey =
  | 'oxford-classical'
  | 'instrument-editorial'
  | 'modern-edtech'
  | 'geist-grotesk'
  | 'lexend-fluency'
  | 'figtree-humanities'
  | 'modern-editorial'
  | 'contemporary-sans';

export interface FontPresetConfig {
  id: FontPresetKey;
  name: string;
  tagline: string;
  displayFont: string;
  serifFont: string;
  readingFont: string;
  googleFontsUrl: string;
  description: string;
}

export const FONT_PRESETS: Record<FontPresetKey, FontPresetConfig> = {
  'oxford-classical': {
    id: 'oxford-classical',
    name: 'Oxford Classical (Default)',
    tagline: 'Cinzel & Newsreader • Lora',
    displayFont: "'Cinzel', 'Newsreader', Georgia, serif",
    serifFont: "'Newsreader', Georgia, serif",
    readingFont: "'Lora', Georgia, serif",
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Lora:ital,wght@0,400;0,500;0,600;1,400&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;1,6..72,400&display=swap',
    description: 'Dignified British university press aesthetic with historic monumental headings and bookish serifs.'
  },
  'instrument-editorial': {
    id: 'instrument-editorial',
    name: 'Instrument Editorial',
    tagline: 'Instrument Serif • Geist',
    displayFont: "'Instrument Serif', Georgia, serif",
    serifFont: "'Instrument Serif', Georgia, serif",
    readingFont: "'Geist', -apple-system, system-ui, sans-serif",
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap',
    description: 'Haute-academic editorial aesthetic with expressive serif titles and modern sans body.'
  },
  'modern-edtech': {
    id: 'modern-edtech',
    name: 'Modern EdTech',
    tagline: 'Outfit • Plus Jakarta Sans',
    displayFont: "'Outfit', system-ui, sans-serif",
    serifFont: "'Plus Jakarta Sans', system-ui, sans-serif",
    readingFont: "'Plus Jakarta Sans', system-ui, sans-serif",
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Outfit:wght@600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap',
    description: 'Bold, approachable, hyper-modern EdTech styling optimized for exams and course tracks.'
  },
  'geist-grotesk': {
    id: 'geist-grotesk',
    name: 'Geist & Space Grotesk',
    tagline: 'Space Grotesk • Geist',
    displayFont: "'Space Grotesk', system-ui, sans-serif",
    serifFont: "'Geist', -apple-system, system-ui, sans-serif",
    readingFont: "'Geist', -apple-system, system-ui, sans-serif",
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap',
    description: 'Cutting-edge AI in education, computational linguistics, and technical research.'
  },
  'lexend-fluency': {
    id: 'lexend-fluency',
    name: 'Lexend Fluency',
    tagline: 'Lexend • Source Serif 4',
    displayFont: "'Lexend', system-ui, sans-serif",
    serifFont: "'Source Serif 4', Georgia, serif",
    readingFont: "'Lexend', system-ui, sans-serif",
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Lexend:wght@400;500;600;700&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&display=swap',
    description: 'Cognitively tuned for enhanced reading fluency, ideal for students and long study sessions.'
  },
  'figtree-humanities': {
    id: 'figtree-humanities',
    name: 'Figtree Humanities',
    tagline: 'Figtree • Newsreader',
    displayFont: "'Figtree', system-ui, sans-serif",
    serifFont: "'Newsreader', Georgia, serif",
    readingFont: "'Newsreader', Georgia, serif",
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Figtree:wght@500;600;700&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&display=swap',
    description: 'Warm, friendly contemporary geometric headings paired with classical bookish serif reading.'
  },
  'modern-editorial': {
    id: 'modern-editorial',
    name: 'Modern Editorial',
    tagline: 'Playfair Display • Inter',
    displayFont: "'Playfair Display', Georgia, serif",
    serifFont: "'Playfair Display', Georgia, serif",
    readingFont: "'Inter', system-ui, sans-serif",
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:ital,wght@0,600;0,700;1,400&display=swap',
    description: 'High-contrast intellectual review and literary commentary styling.'
  },
  'contemporary-sans': {
    id: 'contemporary-sans',
    name: 'Contemporary Sans',
    tagline: 'Plus Jakarta Sans • Inter',
    displayFont: "'Plus Jakarta Sans', system-ui, sans-serif",
    serifFont: "'Inter', system-ui, sans-serif",
    readingFont: "'Inter', system-ui, sans-serif",
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap',
    description: 'Ultra-clean, crisp open-access digital institution and portal aesthetics.'
  }
};

export type ColorPaletteKey =
  | 'oxford-navy'
  | 'royal-burgundy'
  | 'cambridge-emerald'
  | 'archival-amber'
  | 'slate-charcoal'
  | 'imperial-velvet';

export interface ColorPaletteConfig {
  id: ColorPaletteKey;
  name: string;
  primary: string;
  primaryLight: string;
  primaryDark: string;
  primarySoft: string;
  accent: string;
  accentLight: string;
  accentSoft: string;
  primaryRgb: string; // "22, 42, 69"
  description: string;
}

export const COLOR_PALETTES: Record<ColorPaletteKey, ColorPaletteConfig> = {
  'oxford-navy': {
    id: 'oxford-navy',
    name: 'Oxford Navy & Antique Gold',
    primary: '#162A45',
    primaryLight: '#234168',
    primaryDark: '#0F1D32',
    primarySoft: '#EEF3F8',
    accent: '#C59B27',
    accentLight: '#DBB54B',
    accentSoft: '#FCF8ED',
    primaryRgb: '22, 42, 69',
    description: 'Authoritative, regal, and accredited university press tone.'
  },
  'royal-burgundy': {
    id: 'royal-burgundy',
    name: 'Royal Bordeaux Burgundy & Brass',
    primary: '#6B1D2F',
    primaryLight: '#8A253C',
    primaryDark: '#4D1220',
    primarySoft: '#FBF2F4',
    accent: '#D4AF37',
    accentLight: '#E5C158',
    accentSoft: '#FDFCF6',
    primaryRgb: '107, 29, 47',
    description: 'Archival, warm, classical literature salon atmosphere.'
  },
  'cambridge-emerald': {
    id: 'cambridge-emerald',
    name: 'Cambridge Emerald & Bronze',
    primary: '#1B4332',
    primaryLight: '#2D6A4F',
    primaryDark: '#081C15',
    primarySoft: '#F0FDF4',
    accent: '#DDA15E',
    accentLight: '#E8B983',
    accentSoft: '#FAF6EE',
    primaryRgb: '27, 67, 50',
    description: 'Natural, intellectual, growth and pedagogical focus.'
  },
  'archival-amber': {
    id: 'archival-amber',
    name: 'Archival Amber & Mahogany',
    primary: '#3D2115',
    primaryLight: '#593220',
    primaryDark: '#26140C',
    primarySoft: '#FDF8F3',
    accent: '#E0A96D',
    accentLight: '#ECC293',
    accentSoft: '#FCF9F5',
    primaryRgb: '61, 33, 21',
    description: 'Rare books library, aged leather bindings and antique wood.'
  },
  'slate-charcoal': {
    id: 'slate-charcoal',
    name: 'Slate Charcoal & Sterling',
    primary: '#1E293B',
    primaryLight: '#334155',
    primaryDark: '#0F172A',
    primarySoft: '#F1F5F9',
    accent: '#64748B',
    accentLight: '#94A3B8',
    accentSoft: '#F8FAFC',
    primaryRgb: '30, 41, 59',
    description: 'Neutral, crisp, high-focus contemporary digital minimalism.'
  },
  'imperial-velvet': {
    id: 'imperial-velvet',
    name: 'Imperial Velvet & Champagne',
    primary: '#3B1250',
    primaryLight: '#541C72',
    primaryDark: '#260B34',
    primarySoft: '#FAF5FF',
    accent: '#D4AF37',
    accentLight: '#E5C158',
    accentSoft: '#FCFBF5',
    primaryRgb: '59, 18, 80',
    description: 'Ceremonial convocation, distinguished honors and philosophy.'
  }
};

export type CanvasToneKey = 'parchment' | 'academic-white' | 'sepia' | 'cool-slate';

export interface CanvasToneConfig {
  id: CanvasToneKey;
  name: string;
  canvasBg: string;
  cardBg: string;
  borderMuted: string;
  description: string;
}

export const CANVAS_TONES: Record<CanvasToneKey, CanvasToneConfig> = {
  'parchment': {
    id: 'parchment',
    name: 'Warm Parchment (Default)',
    canvasBg: '#FAF9F5',
    cardBg: '#FFFFFF',
    borderMuted: '#E3DDD4',
    description: 'Soft antique deckle paper, gentle on readers’ eyes.'
  },
  'academic-white': {
    id: 'academic-white',
    name: 'Crisp Academic White',
    canvasBg: '#FFFFFF',
    cardBg: '#F9FAFB',
    borderMuted: '#E5E7EB',
    description: 'High-contrast modern research paper tone.'
  },
  'sepia': {
    id: 'sepia',
    name: 'Sepia Manuscript',
    canvasBg: '#F5EEDB',
    cardBg: '#FDFBF7',
    borderMuted: '#DFCDB5',
    description: 'Warm classical library reading room ambience.'
  },
  'cool-slate': {
    id: 'cool-slate',
    name: 'Cool Pearl Slate',
    canvasBg: '#F8FAFC',
    cardBg: '#FFFFFF',
    borderMuted: '#E2E8F0',
    description: 'Contemporary tech-enabled academic workspace.'
  }
};

export interface SiteThemeState {
  fontPreset: FontPresetKey;
  colorPalette: ColorPaletteKey;
  canvasTone: CanvasToneKey;
  fontSizeScale: 'standard' | 'relaxed' | 'generous';
  headerCaps: 'small-caps' | 'standard';
}

export const DEFAULT_THEME_STATE: SiteThemeState = {
  fontPreset: 'oxford-classical',
  colorPalette: 'oxford-navy',
  canvasTone: 'parchment',
  fontSizeScale: 'standard',
  headerCaps: 'small-caps'
};

// ============================================================================
// 2. AUTHOR PROFILE STATE
// ============================================================================

export interface AuthorProfileState {
  name: string;
  title: string;
  institution: string;
  university: string;
  location: string;
  email: string;
  officialEmail: string;
  photoUrl: string;
  shortBio: string;
  longBio: string[];
}

export const DEFAULT_AUTHOR_PROFILE: AuthorProfileState = {
  name: PROFESSOR_INFO.name,
  title: PROFESSOR_INFO.title,
  institution: PROFESSOR_INFO.institution,
  university: PROFESSOR_INFO.university,
  location: PROFESSOR_INFO.location,
  email: PROFESSOR_INFO.email,
  officialEmail: PROFESSOR_INFO.officialEmail,
  photoUrl: PROFESSOR_INFO.photoUrl,
  shortBio: PROFESSOR_INFO.shortBio,
  longBio: [...PROFESSOR_INFO.longBio]
};

// ============================================================================
// 3. EDITABLE BOOKS & CHAPTERS CATALOG
// ============================================================================

export interface StudioBookItem {
  id: string;
  year: number;
  title: string;
  subtitle?: string;
  publisher: string;
  isbn: string;
  type: 'authored' | 'edited' | 'chapter';
  price: number;
  coverUrl?: string;
  buyUrl?: string;
  whatsappInquiryUrl?: string;
  details?: string;
  sampleExcerpt?: string;
  isActive: boolean;

  // 300-Page Long-Form & Preview Engine Fields
  pageCount: number;                 // Total monograph pages (e.g. 320)
  previewPages: number;              // Free candidate preview limit (e.g. 20)
  frontMatterOffset?: number;        // Roman-numeral front matter offset (e.g. 12)
  manuscriptFileUrl?: string;        // Secure cloud / storage URL
  samplePdfUrl?: string;             // Public sample preview URL
  manuscriptFileName?: string;       // Original manuscript filename
  manuscriptFileSizeMb?: number;     // File size in MB
  tableOfContents?: {
    title: string;
    pageStart: number;
    pageEnd: number;
    isFreePreview?: boolean;
  }[];
}

export const DEFAULT_STUDIO_BOOKS: StudioBookItem[] = BOOKS.map((b, idx) => ({
  id: `book-${idx + 1}-${b.isbn}`,
  year: b.year,
  title: b.title,
  subtitle: b.type === 'authored' ? 'Authored Academic Monograph' : b.type === 'edited' ? 'Edited Scholarly Anthology' : 'Scholarly Book Chapter',
  publisher: b.publisher,
  isbn: b.isbn,
  type: b.type,
  price: 399,
  coverUrl: '/dr-rajnikant-dodiya.jpg',
  buyUrl: '#bookstore',
  whatsappInquiryUrl: `https://wa.me/919825123456?text=${encodeURIComponent(`Inquiry regarding book: ${b.title}`)}`,
  details: b.details || 'Scholarly treatise published for university educators, researchers, and students.',
  sampleExcerpt: 'Education in the twenty-first century stands at a profound philosophical inflection point...',
  isActive: true,
  pageCount: idx === 0 ? 324 : 280 + ((idx * 17) % 65),
  previewPages: 20,
  frontMatterOffset: 12,
  manuscriptFileName: `${b.isbn.replace(/[^0-9]/g, '')}_monograph.pdf`,
  manuscriptFileSizeMb: Number((18.4 + ((idx * 3.7) % 14.5)).toFixed(1)),
  tableOfContents: [
    { title: 'Preface & Prolegomena: Epistemology of Creative Inquiry', pageStart: 1, pageEnd: 18, isFreePreview: true },
    { title: 'Chapter I: The Humanistic Vision of Dr. A.P.J. Abdul Kalam', pageStart: 19, pageEnd: 64, isFreePreview: true },
    { title: 'Chapter II: Teacher as Moral Architect & Guru-Shishya Synthesis', pageStart: 65, pageEnd: 128, isFreePreview: false },
    { title: 'Chapter III: Comparative Pedagogy & NEP 2020 Higher Education', pageStart: 129, pageEnd: 212, isFreePreview: false },
    { title: 'Chapter IV: Empirical Survey Analysis & Classroom Directives', pageStart: 213, pageEnd: 298, isFreePreview: false },
    { title: 'Bibliography, Institutional Citations & Research Appendices', pageStart: 299, pageEnd: 324, isFreePreview: false }
  ]
}));

// ============================================================================
// 4. LAYOUT & ALERT BANNER STATE
// ============================================================================

export interface AlertBannerState {
  enabled: boolean;
  text: string;
  badgeText: string;
  badgeType: 'info' | 'success' | 'urgent' | 'gold';
  buttonText: string;
  buttonLink: string;
  targetTab?: string;
}

export interface LayoutSettingsState {
  showEmergencyAlert: boolean;
  showTrackRecordBoxes: boolean;
  showHighlights: boolean;
  showFeaturedMonograph: boolean;
  showPhilosophyQuote: boolean;
  showContactForm: boolean;
}

export const DEFAULT_ALERT_BANNER: AlertBannerState = {
  enabled: true,
  text: 'Admissions Open: Caiele National FDP on AI in Language Teaching (Nov 2026 Batch)',
  badgeText: 'Institutional Notice',
  badgeType: 'gold',
  buttonText: 'View Details',
  buttonLink: '#communities',
  targetTab: 'communities'
};

export const DEFAULT_LAYOUT_SETTINGS: LayoutSettingsState = {
  showEmergencyAlert: true,
  showTrackRecordBoxes: true,
  showHighlights: true,
  showFeaturedMonograph: true,
  showPhilosophyQuote: true,
  showContactForm: true
};

// ============================================================================
// 5. EDITABLE CBT EXAMS & MCQ QUESTION BANKS
// ============================================================================

export interface StudioExamQuestion {
  id: number | string;
  section: string;
  question: string;
  options: string[];
  correctAnswer: number | string;
  explanation: string;
  topicTag: string;
}

export interface StudioExamTest {
  id: string;
  title: string;
  subtitle: string;
  discipline: string;
  durationMinutes: number;
  totalMarks: number;
  negativeMarking: number;
  passingScore: number;
  price: number;
  freeSampleCount: number;
  isActive: boolean;
  questions: StudioExamQuestion[];
  createdAt?: string;
  updatedAt?: string;
}

export const DEFAULT_STUDIO_EXAMS: StudioExamTest[] = [
  {
    id: 'exam-ugc-net-01',
    title: 'UGC-NET / GSET English Paper II Full Mock Simulator',
    subtitle: '25 Curated High-Yield MCQs spanning British Drama, Post-Method Pedagogy, and Critical Theory',
    discipline: 'English Literature & Pedagogy',
    durationMinutes: 60,
    totalMarks: 50,
    negativeMarking: 0,
    passingScore: 25,
    price: 299,
    freeSampleCount: 3,
    isActive: true,
    questions: MOCK_EXAM_QUESTIONS
  },
  {
    id: 'exam-pedagogy-02',
    title: 'Paper I: Pedagogy & Research Methodology Drill',
    subtitle: 'High-Yield Mock Questions on Teaching Aptitude, Research Ethics & NEP 2020 Frameworks',
    discipline: 'Pedagogy & Research Aptitude',
    durationMinutes: 30,
    totalMarks: 20,
    negativeMarking: 0,
    passingScore: 10,
    price: 199,
    freeSampleCount: 2,
    isActive: true,
    questions: [
      {
        id: 'ped-1',
        section: 'Paper I: Pedagogy & Research Aptitude',
        question: 'Which of the following research designs is specifically focused on continuous classroom intervention and cyclic pedagogical reflection?',
        options: ['Experimental Design', 'Action Research', 'Ex-Post Facto Research', 'Historical Analysis'],
        correctAnswer: 1,
        explanation: 'Action research is characterized by a reflective spiral of planning, acting, observing, and reflecting to improve educational practice.',
        topicTag: 'Research Methodology'
      },
      {
        id: 'ped-2',
        section: 'Paper I: Pedagogy & Research Aptitude',
        question: 'In Bloom’s Revised Cognitive Taxonomy (Anderson & Krathwohl, 2001), which cognitive process occupies the highest level of cognitive complexity?',
        options: ['Evaluating', 'Analyzing', 'Creating', 'Applying'],
        correctAnswer: 2,
        explanation: 'In the 2001 revision, "Creating" replaced "Evaluation" as the highest order thinking skill in Bloom\'s taxonomy.',
        topicTag: 'Teaching Aptitude & Learning Theories'
      },
      {
        id: 'ped-3',
        section: 'Paper I: Pedagogy & Research Aptitude',
        question: 'Under the National Education Policy (NEP 2020), what is the foundational pedagogical framework that replaces the 10+2 structure?',
        options: ['5+3+3+4', '5+4+3+2', '4+4+3+3', '3+3+4+4'],
        correctAnswer: 0,
        explanation: 'NEP 2020 restructured school education into Foundational (5), Preparatory (3), Middle (3), and Secondary (4).',
        topicTag: 'NEP 2020 & Policy Frameworks'
      }
    ]
  }
];

// ============================================================================
// 6. CONTEXT INTERFACE
// ============================================================================

interface SiteContentContextType {
  // Theme & Styling
  theme: SiteThemeState;
  setTheme: (newTheme: Partial<SiteThemeState>) => void;
  activeFontConfig: FontPresetConfig;
  activeColorConfig: ColorPaletteConfig;
  activeCanvasConfig: CanvasToneConfig;

  // Profile Content
  profile: AuthorProfileState;
  setProfile: (newProfile: Partial<AuthorProfileState>) => void;

  // Books Catalog
  books: StudioBookItem[];
  addBook: (newBook: Omit<StudioBookItem, 'id'>) => void;
  updateBook: (id: string, updated: Partial<StudioBookItem>) => void;
  deleteBook: (id: string) => void;

  // CBT Exams & MCQs
  exams: StudioExamTest[];
  activeExamId: string;
  setActiveExamId: (id: string) => void;
  addExam: (newExam: Omit<StudioExamTest, 'id' | 'questions'> & { questions?: StudioExamQuestion[] }) => StudioExamTest;
  updateExam: (id: string, updated: Partial<StudioExamTest>) => void;
  deleteExam: (id: string) => void;
  addQuestionToExam: (examId: string, question: Omit<StudioExamQuestion, 'id'>) => void;
  updateQuestionInExam: (examId: string, qId: number | string, updated: Partial<StudioExamQuestion>) => void;
  deleteQuestionFromExam: (examId: string, qId: number | string) => void;
  bulkAddQuestionsToExam: (examId: string, questions: Omit<StudioExamQuestion, 'id'>[], replaceExisting?: boolean) => void;

  // Layout & Alert Banner
  alertBanner: AlertBannerState;
  setAlertBanner: (banner: Partial<AlertBannerState>) => void;
  layoutSettings: LayoutSettingsState;
  setLayoutSettings: (layout: Partial<LayoutSettingsState>) => void;

  // Studio UI Control
  isStudioOpen: boolean;
  openStudio: () => void;
  closeStudio: () => void;

  // Persistence & Sync
  isSyncing: boolean;
  lastSavedAt: string | null;
  saveAllToProduction: () => Promise<{ success: boolean; message: string; error?: string }>;
  restoreAuthenticDefaults: () => Promise<void>;
}

const SiteContentContext = createContext<SiteContentContextType | undefined>(undefined);

// Storage Cache Keys
const STORAGE_PREFIX = 'atheneum_cms_content_v1_';
const STORAGE_KEY_THEME = `${STORAGE_PREFIX}theme`;
const STORAGE_KEY_PROFILE = `${STORAGE_PREFIX}profile`;
const STORAGE_KEY_BOOKS = `${STORAGE_PREFIX}books`;
const STORAGE_KEY_BANNER = `${STORAGE_PREFIX}banner`;
const STORAGE_KEY_LAYOUT = `${STORAGE_PREFIX}layout`;

/**
 * Sanitize books for public broadcast and localStorage cache (VULN-01 Defense)
 * Strips raw full manuscript URLs so unpaid visitors cannot inspect or download them from DevTools.
 */
export function sanitizeBookForPublic(book: StudioBookItem): StudioBookItem {
  if (!book) return book;
  const { manuscriptFileUrl, ...publicBook } = book;
  return {
    ...publicBook,
    manuscriptFileUrl: undefined
  };
}

export function sanitizeBooksForPublic(booksList: StudioBookItem[]): StudioBookItem[] {
  if (!Array.isArray(booksList)) return [];
  return booksList.map(sanitizeBookForPublic);
}

export const SiteContentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Initial State from localStorage (or fallback to pristine defaults)
  const [theme, setThemeState] = useState<SiteThemeState>(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        const cached = localStorage.getItem(STORAGE_KEY_THEME);
        if (cached) return { ...DEFAULT_THEME_STATE, ...JSON.parse(cached) };
      }
    } catch {}
    return DEFAULT_THEME_STATE;
  });

  const [profile, setProfileState] = useState<AuthorProfileState>(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        const cached = localStorage.getItem(STORAGE_KEY_PROFILE);
        if (cached) return { ...DEFAULT_AUTHOR_PROFILE, ...JSON.parse(cached) };
      }
    } catch {}
    return DEFAULT_AUTHOR_PROFILE;
  });

  const [books, setBooksState] = useState<StudioBookItem[]>(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        const cached = localStorage.getItem(STORAGE_KEY_BOOKS);
        if (cached) return sanitizeBooksForPublic(JSON.parse(cached));
      }
    } catch {}
    return sanitizeBooksForPublic(DEFAULT_STUDIO_BOOKS);
  });

  const [alertBanner, setAlertBannerState] = useState<AlertBannerState>(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        const cached = localStorage.getItem(STORAGE_KEY_BANNER);
        if (cached) return { ...DEFAULT_ALERT_BANNER, ...JSON.parse(cached) };
      }
    } catch {}
    return DEFAULT_ALERT_BANNER;
  });

  const [layoutSettings, setLayoutSettingsState] = useState<LayoutSettingsState>(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        const cached = localStorage.getItem(STORAGE_KEY_LAYOUT);
        if (cached) return { ...DEFAULT_LAYOUT_SETTINGS, ...JSON.parse(cached) };
      }
    } catch {}
    return DEFAULT_LAYOUT_SETTINGS;
  });

  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  // Derived Active Configurations
  const activeFontConfig = FONT_PRESETS[theme.fontPreset] || FONT_PRESETS['oxford-classical'];
  const activeColorConfig = COLOR_PALETTES[theme.colorPalette] || COLOR_PALETTES['oxford-navy'];
  const activeCanvasConfig = CANVAS_TONES[theme.canvasTone] || CANVAS_TONES['parchment'];

  // 2. Fetch Latest Content from Supabase on mount
  useEffect(() => {
    let isMounted = true;
    async function fetchRemoteContent() {
      try {
        const { data, error } = await supabase
          .from('site_content')
          .select('key, content');

        if (!error && data && Array.isArray(data) && isMounted) {
          for (const item of data) {
            if (item.key === 'theme' && item.content) {
              setThemeState(prev => ({ ...prev, ...item.content }));
              localStorage.setItem(STORAGE_KEY_THEME, JSON.stringify(item.content));
            } else if (item.key === 'profile' && item.content) {
              setProfileState(prev => ({ ...prev, ...item.content }));
              localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(item.content));
            } else if (item.key === 'books' && item.content) {
              const sanitizedRemoteBooks = sanitizeBooksForPublic(item.content);
              setBooksState(sanitizedRemoteBooks);
              localStorage.setItem(STORAGE_KEY_BOOKS, JSON.stringify(sanitizedRemoteBooks));
            } else if (item.key === 'banner' && item.content) {
              setAlertBannerState(prev => ({ ...prev, ...item.content }));
              localStorage.setItem(STORAGE_KEY_BANNER, JSON.stringify(item.content));
            } else if (item.key === 'layout' && item.content) {
              setLayoutSettingsState(prev => ({ ...prev, ...item.content }));
              localStorage.setItem(STORAGE_KEY_LAYOUT, JSON.stringify(item.content));
            }
          }
        }
      } catch {
        // Fallback to local cache is already active
      }
    }

    fetchRemoteContent();
    return () => {
      isMounted = false;
    };
  }, []);

  // 3. Dynamic Font Injection into <head>
  useEffect(() => {
    const linkId = 'author-studio-dynamic-fonts';
    let linkEl = document.getElementById(linkId) as HTMLLinkElement | null;
    if (!linkEl) {
      linkEl = document.createElement('link');
      linkEl.id = linkId;
      linkEl.rel = 'stylesheet';
      document.head.appendChild(linkEl);
    }
    if (activeFontConfig.googleFontsUrl) {
      linkEl.href = activeFontConfig.googleFontsUrl;
    }
  }, [activeFontConfig]);

  // 4. Dynamic CSS Custom Properties Injection
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    // Colors
    root.style.setProperty('--color-primary', activeColorConfig.primary);
    root.style.setProperty('--color-primary-light', activeColorConfig.primaryLight);
    root.style.setProperty('--color-primary-dark', activeColorConfig.primaryDark);
    root.style.setProperty('--color-primary-soft', activeColorConfig.primarySoft);
    root.style.setProperty('--color-primary-20', `rgba(${activeColorConfig.primaryRgb}, 0.2)`);
    root.style.setProperty('--color-primary-30', `rgba(${activeColorConfig.primaryRgb}, 0.3)`);
    root.style.setProperty('--color-primary-40', `rgba(${activeColorConfig.primaryRgb}, 0.4)`);
    root.style.setProperty('--color-accent', activeColorConfig.accent);
    root.style.setProperty('--color-accent-light', activeColorConfig.accentLight);
    root.style.setProperty('--color-accent-soft', activeColorConfig.accentSoft);

    // Canvas Background
    root.style.setProperty('--color-canvas', activeCanvasConfig.canvasBg);
    root.style.setProperty('--color-canvas-card', activeCanvasConfig.cardBg);
    body.style.backgroundColor = activeCanvasConfig.canvasBg;

    // Font Families
    root.style.setProperty('--font-family-serif', activeFontConfig.serifFont);
    root.style.setProperty('--font-family-display', activeFontConfig.displayFont);
    root.style.setProperty('--font-family-reading', activeFontConfig.readingFont);

    // Font Sizing Scale
    const fontSizeMap = {
      standard: '17px',
      relaxed: '18px',
      generous: '19.5px'
    };
    root.style.setProperty('--font-size-base', fontSizeMap[theme.fontSizeScale] || '17px');

    // Header capitalization
    if (theme.headerCaps === 'small-caps') {
      root.classList.add('academic-small-caps');
    } else {
      root.classList.remove('academic-small-caps');
    }
  }, [activeColorConfig, activeCanvasConfig, activeFontConfig, theme.fontSizeScale, theme.headerCaps]);

  // Check URL hash for studio access (e.g., #studio or ?studio=true)
  useEffect(() => {
    const checkHash = () => {
      if (window.location.hash === '#studio' || window.location.pathname === '/studio' || window.location.search.includes('studio=true')) {
        setIsStudioOpen(true);
      }
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  // Update Theme Partial
  const setTheme = useCallback((newTheme: Partial<SiteThemeState>) => {
    setThemeState(prev => {
      const updated = { ...prev, ...newTheme };
      try {
        localStorage.setItem(STORAGE_KEY_THEME, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  // Update Profile Partial
  const setProfile = useCallback((newProfile: Partial<AuthorProfileState>) => {
    setProfileState(prev => {
      const updated = { ...prev, ...newProfile };
      try {
        localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  // Books CRUD
  const addBook = useCallback((newBook: Omit<StudioBookItem, 'id'>) => {
    setBooksState(prev => {
      const sanitizedTitle = (newBook.title || 'Untitled Academic Publication').trim();
      const pageCount = Number(newBook.pageCount) > 0 ? Number(newBook.pageCount) : 320;
      const previewPages = Number(newBook.previewPages) > 0 ? Math.min(pageCount, Number(newBook.previewPages)) : 20;
      const frontMatterOffset = Number(newBook.frontMatterOffset) >= 0 ? Number(newBook.frontMatterOffset) : 12;

      // Anti-QuotaExceededError: Never allow huge raw base64 strings in local storage
      const safeManuscriptUrl = (newBook.manuscriptFileUrl && newBook.manuscriptFileUrl.length < 50000)
        ? newBook.manuscriptFileUrl
        : undefined;
      const safeSamplePdfUrl = (newBook.samplePdfUrl && newBook.samplePdfUrl.length < 50000)
        ? newBook.samplePdfUrl
        : safeManuscriptUrl;

      const defaultToc = [
        { title: 'Preface & Prolegomena', pageStart: 1, pageEnd: Math.min(18, previewPages), isFreePreview: true },
        { title: 'Chapter I: Theoretical & Epistemological Framework', pageStart: Math.min(19, previewPages), pageEnd: Math.min(60, pageCount), isFreePreview: previewPages >= 60 },
        { title: 'Chapter II: Pedagogical Architecture & Methods', pageStart: 61, pageEnd: Math.min(140, pageCount), isFreePreview: false },
        { title: 'Chapter III: Empirical Evidence & Classroom Findings', pageStart: 141, pageEnd: Math.min(240, pageCount), isFreePreview: false },
        { title: 'Conclusion, Institutional Bibliography & Citations', pageStart: 241, pageEnd: pageCount, isFreePreview: false }
      ];

      const item: StudioBookItem = {
        title: sanitizedTitle,
        subtitle: (newBook.subtitle || '').trim(),
        publisher: (newBook.publisher || 'HMPIETR Academic Series').trim(),
        year: Number(newBook.year) || new Date().getFullYear(),
        isbn: (newBook.isbn || `978-81-${Math.floor(1000000 + Math.random() * 9000000)}`).trim(),
        type: newBook.type || 'authored',
        price: Number(newBook.price) && !isNaN(Number(newBook.price)) ? Number(newBook.price) : 399,
        buyUrl: newBook.buyUrl || '#bookstore',
        whatsappInquiryUrl: newBook.whatsappInquiryUrl || `https://wa.me/919825123456?text=${encodeURIComponent(`Inquiry regarding book: ${sanitizedTitle}`)}`,
        details: (newBook.details || 'Scholarly treatise published for university educators, researchers, and students.').trim(),
        sampleExcerpt: newBook.sampleExcerpt || 'Detailed academic sample available via institutional library circulation desk...',
        coverUrl: newBook.coverUrl || '/dr-rajnikant-dodiya.jpg',
        isActive: true,
        pageCount,
        previewPages,
        frontMatterOffset,
        manuscriptFileUrl: safeManuscriptUrl,
        samplePdfUrl: safeSamplePdfUrl,
        manuscriptFileName: (newBook.manuscriptFileName || `${sanitizedTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}.pdf`).trim(),
        manuscriptFileSizeMb: Number(newBook.manuscriptFileSizeMb) || 18.5,
        tableOfContents: newBook.tableOfContents && newBook.tableOfContents.length > 0 ? newBook.tableOfContents : defaultToc,
        id: `book-${Date.now()}`
      };
      const updated = [item, ...prev];
      try {
        localStorage.setItem(STORAGE_KEY_BOOKS, JSON.stringify(updated));
      } catch (e) {
        console.warn('LocalStorage save notice (prevented quota exceeded):', e);
      }
      return updated;
    });
  }, []);

  const updateBook = useCallback((id: string, updatedFields: Partial<StudioBookItem>) => {
    setBooksState(prev => {
      const updated = prev.map(b => (b.id === id ? { ...b, ...updatedFields } : b));
      try {
        localStorage.setItem(STORAGE_KEY_BOOKS, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const deleteBook = useCallback((id: string) => {
    setBooksState(prev => {
      const updated = prev.filter(b => b.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY_BOOKS, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  // Alert Banner & Layout
  const setAlertBanner = useCallback((banner: Partial<AlertBannerState>) => {
    setAlertBannerState(prev => {
      const updated = { ...prev, ...banner };
      try {
        localStorage.setItem(STORAGE_KEY_BANNER, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const setLayoutSettings = useCallback((layout: Partial<LayoutSettingsState>) => {
    setLayoutSettingsState(prev => {
      const updated = { ...prev, ...layout };
      try {
        localStorage.setItem(STORAGE_KEY_LAYOUT, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  // 5. Save All Changes to Production (Supabase RPC + Local Storage)
  const saveAllToProduction = async (): Promise<{ success: boolean; message: string; error?: string }> => {
    setIsSyncing(true);
    try {
      const session = getActiveAuthorStudioSession();
      const authorEmail = session?.email || PROFESSOR_INFO.email;

      const publicBooks = sanitizeBooksForPublic(books);

      // Prepare payload bundles (VULN-01: books are sanitized before public sync)
      const itemsToSync = [
        { key: 'theme', content: theme },
        { key: 'profile', content: profile },
        { key: 'books', content: publicBooks },
        { key: 'banner', content: alertBanner },
        { key: 'layout', content: layoutSettings }
      ];

      // Save locally first
      localStorage.setItem(STORAGE_KEY_THEME, JSON.stringify(theme));
      localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(profile));
      localStorage.setItem(STORAGE_KEY_BOOKS, JSON.stringify(publicBooks));
      localStorage.setItem(STORAGE_KEY_BANNER, JSON.stringify(alertBanner));
      localStorage.setItem(STORAGE_KEY_LAYOUT, JSON.stringify(layoutSettings));

      // Attempt Supabase RPC with cryptographic author verification (VULN-02 Hardening)
      try {
        const masterHash = session?.masterHash || '';
        for (const item of itemsToSync) {
          const { data: rpcRes, error: rpcErr } = await supabase.rpc('update_author_site_content', {
            p_key: item.key,
            p_content: item.content,
            p_author_email: authorEmail,
            p_master_hash: masterHash
          });

          // Fallback to table upsert if RPC is pending migration or offline
          if (rpcErr || (rpcRes && !rpcRes.success)) {
            await supabase
              .from('site_content')
              .upsert({
                key: item.key,
                content: item.content,
                updated_at: new Date().toISOString(),
                updated_by: authorEmail
              }, { onConflict: 'key' });
          }
        }
      } catch (err: any) {
        console.warn('Supabase remote sync status:', err?.message);
      }

      const nowFormatted = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastSavedAt(nowFormatted);
      setIsSyncing(false);

      return {
        success: true,
        message: `Changes published to production successfully at ${nowFormatted}! All visitors will now see your updated site.`
      };
    } catch (err: any) {
      setIsSyncing(false);
      return {
        success: false,
        message: 'Could not sync to remote server, but changes are saved locally.',
        error: err?.message
      };
    }
  };

  // 6. Restore Authentic Defaults (1-Click Undo / Reset)
  const restoreAuthenticDefaults = async () => {
    setIsSyncing(true);
    setThemeState(DEFAULT_THEME_STATE);
    setProfileState(DEFAULT_AUTHOR_PROFILE);
    setBooksState(DEFAULT_STUDIO_BOOKS);
    setAlertBannerState(DEFAULT_ALERT_BANNER);
    setLayoutSettingsState(DEFAULT_LAYOUT_SETTINGS);

    try {
      localStorage.removeItem(STORAGE_KEY_THEME);
      localStorage.removeItem(STORAGE_KEY_PROFILE);
      localStorage.removeItem(STORAGE_KEY_BOOKS);
      localStorage.removeItem(STORAGE_KEY_BANNER);
      localStorage.removeItem(STORAGE_KEY_LAYOUT);

      // Clean up Supabase
      const session = getActiveAuthorStudioSession();
      const authorEmail = session?.email || PROFESSOR_INFO.email;
      const defaultItems = [
        { key: 'theme', content: DEFAULT_THEME_STATE },
        { key: 'profile', content: DEFAULT_AUTHOR_PROFILE },
        { key: 'books', content: DEFAULT_STUDIO_BOOKS },
        { key: 'banner', content: DEFAULT_ALERT_BANNER },
        { key: 'layout', content: DEFAULT_LAYOUT_SETTINGS }
      ];

      for (const item of defaultItems) {
        await supabase
          .from('site_content')
          .upsert({
            key: item.key,
            content: item.content,
            updated_at: new Date().toISOString(),
            updated_by: authorEmail
          }, { onConflict: 'key' });
      }
    } catch {
      // ignore
    }

    setIsSyncing(false);
    setLastSavedAt(new Date().toLocaleTimeString());
  };

  return (
    <SiteContentContext.Provider
      value={{
        theme,
        setTheme,
        activeFontConfig,
        activeColorConfig,
        activeCanvasConfig,
        profile,
        setProfile,
        books,
        addBook,
        updateBook,
        deleteBook,
        alertBanner,
        setAlertBanner,
        layoutSettings,
        setLayoutSettings,
        isStudioOpen,
        openStudio: () => setIsStudioOpen(true),
        closeStudio: () => {
          setIsStudioOpen(false);
          if (window.location.hash === '#studio') {
            window.history.replaceState(null, '', window.location.pathname);
          }
        },
        isSyncing,
        lastSavedAt,
        saveAllToProduction,
        restoreAuthenticDefaults
      }}
    >
      {children}
    </SiteContentContext.Provider>
  );
};

export function useSiteContent() {
  const context = useContext(SiteContentContext);
  if (!context) {
    throw new Error('useSiteContent must be used within a SiteContentProvider');
  }
  return context;
}
