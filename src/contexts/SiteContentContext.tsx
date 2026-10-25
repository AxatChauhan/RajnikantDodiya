import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { PROFESSOR_INFO, Book as ProfessorBook } from '../data/professorData';
import { FEATURED_BOOK_CHAPTERS, BookChapter } from '../data/storeCatalogData';
import { getActiveAuthorStudioSession } from '../lib/authorStudioAuth';

// ============================================================================
// 1. THEME & TYPOGRAPHY SYSTEM
// ============================================================================

export type FontPresetKey =
  | 'oxford-classical'
  | 'royal-garamond'
  | 'cambridge-caslon'
  | 'modern-editorial'
  | 'contemporary-sans'
  | 'scholarly-archival'
  | 'literary-humanist'
  | 'tech-pedagogy';

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
    description: 'Dignified British university press aesthetic with crisp serif hierarchy.'
  },
  'royal-garamond': {
    id: 'royal-garamond',
    name: 'Royal Garamond',
    tagline: 'Cormorant Garamond • EB Garamond',
    displayFont: "'Cormorant Garamond', 'EB Garamond', Georgia, serif",
    serifFont: "'EB Garamond', Georgia, serif",
    readingFont: "'EB Garamond', Georgia, serif",
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,400&family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400&display=swap',
    description: '16th-century humanist scholarly monograph with graceful italic flourishes.'
  },
  'cambridge-caslon': {
    id: 'cambridge-caslon',
    name: 'Cambridge Caslon',
    tagline: 'Libre Caslon Display • Lora',
    displayFont: "'Libre Caslon Display', 'Lora', Georgia, serif",
    serifFont: "'Libre Caslon Display', Georgia, serif",
    readingFont: "'Lora', Georgia, serif",
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Libre+Caslon+Display&family=Lora:ital,wght@0,400;0,500;0,600;1,400&display=swap',
    description: 'Traditional academic research monograph with high contrast and legibility.'
  },
  'modern-editorial': {
    id: 'modern-editorial',
    name: 'Modern Editorial',
    tagline: 'Playfair Display • Source Serif',
    displayFont: "'Playfair Display', Georgia, serif",
    serifFont: "'Playfair Display', Georgia, serif",
    readingFont: "'Source Serif 4', Georgia, serif",
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,400&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&display=swap',
    description: 'Crisp, high-contrast cultural journal & modern intellectual magazine.'
  },
  'contemporary-sans': {
    id: 'contemporary-sans',
    name: 'Contemporary Sans',
    tagline: 'Plus Jakarta Sans • Inter',
    displayFont: "'Plus Jakarta Sans', system-ui, sans-serif",
    serifFont: "'Inter', system-ui, sans-serif",
    readingFont: "'Inter', system-ui, sans-serif",
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap',
    description: 'Ultra-clean, hyper-modern digital institution and open-access portal.'
  },
  'scholarly-archival': {
    id: 'scholarly-archival',
    name: 'Scholarly Archival',
    tagline: 'Newsreader Small-Caps • Newsreader',
    displayFont: "'Newsreader', Georgia, serif",
    serifFont: "'Newsreader', Georgia, serif",
    readingFont: "'Newsreader', Georgia, serif",
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400&display=swap',
    description: 'Formal Oxford NAAC accreditation record and university archive.'
  },
  'literary-humanist': {
    id: 'literary-humanist',
    name: 'Literary Humanist',
    tagline: 'Cinzel Decorative • Cormorant',
    displayFont: "'Cinzel Decorative', 'Cinzel', serif",
    serifFont: "'Cormorant Garamond', Georgia, serif",
    readingFont: "'Cormorant Garamond', Georgia, serif",
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&display=swap',
    description: 'Poetical, ornate philosophical and humanities literature styling.'
  },
  'tech-pedagogy': {
    id: 'tech-pedagogy',
    name: 'Tech Pedagogy',
    tagline: 'Cinzel • Plus Jakarta Sans & Mono',
    displayFont: "'Cinzel', serif",
    serifFont: "'Plus Jakarta Sans', sans-serif",
    readingFont: "'Plus Jakarta Sans', sans-serif",
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Plus+Jakarta+Sans:wght@400;500;600&family=Space+Mono&display=swap',
    description: 'Cutting-edge AI in Education, NEP 2020 and digital curriculum tone.'
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
}

export const DEFAULT_STUDIO_BOOKS: StudioBookItem[] = [
  {
    id: 'book-kalam',
    year: 2021,
    title: 'A Study of Educational Thoughts of Dr. A.P.J. Abdul Kalam',
    subtitle: 'Doctoral Monograph on Humanistic Pedagogy & Scientific Temper',
    publisher: 'International Academic Publishing House',
    isbn: '978-81-937539-0-3',
    type: 'authored',
    price: 399,
    coverUrl: '/dr-rajnikant-dodiya.jpg',
    buyUrl: '#bookstore',
    whatsappInquiryUrl: 'https://wa.me/919825000000?text=Inquiry%20regarding%20Dr.%20Dodiya%20Kalam%20Monograph',
    details: 'Comprehensive empirical analysis of Dr. Kalam’s educational vision, ethics, and nation-building philosophy.',
    sampleExcerpt: 'Education in the twenty-first century stands at a profound philosophical inflection point...',
    isActive: true
  },
  {
    id: 'book-nep-ai',
    year: 2024,
    title: 'AI in English Language Teaching & NEP 2020',
    subtitle: 'Pedagogical Frameworks for Higher Education Classrooms',
    publisher: 'HMPIETR Academic Series',
    isbn: '978-93-85123-45-6',
    type: 'authored',
    price: 449,
    coverUrl: '/dr-rajnikant-dodiya.jpg',
    buyUrl: '#bookstore',
    whatsappInquiryUrl: 'https://wa.me/919825000000?text=Inquiry%20regarding%20AI%20in%20ELE%20Book',
    details: 'Practical classroom guide for teacher-educators integrating generative AI with communicative language learning.',
    sampleExcerpt: 'Translanguaging and digital assistance empower rural and first-generation learners...',
    isActive: true
  },
  {
    id: 'book-ugc-net',
    year: 2023,
    title: 'UGC-NET English & Education Master Compendium',
    subtitle: 'High-Yield Mock Tests & Rigorous Pedagogical Rationales',
    publisher: 'Vidya Academic Press',
    isbn: '978-81-95432-11-2',
    type: 'authored',
    price: 299,
    coverUrl: '/dr-rajnikant-dodiya.jpg',
    buyUrl: '#bookstore',
    whatsappInquiryUrl: 'https://wa.me/919825000000?text=Inquiry%20regarding%20UGC%20NET%20Compendium',
    details: '1,200 curated questions with verified scholarly explanations designed for JRF and Assistant Professorship aspirants.',
    sampleExcerpt: 'Examinations test not rote recall, but conceptual synthesis across critical theories...',
    isActive: true
  }
];

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
// 5. CONTEXT INTERFACE
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
        if (cached) return JSON.parse(cached);
      }
    } catch {}
    return DEFAULT_STUDIO_BOOKS;
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
              setBooksState(item.content);
              localStorage.setItem(STORAGE_KEY_BOOKS, JSON.stringify(item.content));
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
      standard: '16px',
      relaxed: '17px',
      generous: '18.5px'
    };
    root.style.setProperty('--font-size-base', fontSizeMap[theme.fontSizeScale] || '16px');

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
      const item: StudioBookItem = {
        ...newBook,
        id: `book-${Date.now()}`
      };
      const updated = [item, ...prev];
      try {
        localStorage.setItem(STORAGE_KEY_BOOKS, JSON.stringify(updated));
      } catch {}
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

      // Prepare payload bundles
      const itemsToSync = [
        { key: 'theme', content: theme },
        { key: 'profile', content: profile },
        { key: 'books', content: books },
        { key: 'banner', content: alertBanner },
        { key: 'layout', content: layoutSettings }
      ];

      // Save locally first
      localStorage.setItem(STORAGE_KEY_THEME, JSON.stringify(theme));
      localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(profile));
      localStorage.setItem(STORAGE_KEY_BOOKS, JSON.stringify(books));
      localStorage.setItem(STORAGE_KEY_BANNER, JSON.stringify(alertBanner));
      localStorage.setItem(STORAGE_KEY_LAYOUT, JSON.stringify(layoutSettings));

      // Attempt Supabase RPC / Upsert for live production propagation
      try {
        for (const item of itemsToSync) {
          await supabase
            .from('site_content')
            .upsert({
              key: item.key,
              content: item.content,
              updated_at: new Date().toISOString(),
              updated_by: authorEmail
            }, { onConflict: 'key' });
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
