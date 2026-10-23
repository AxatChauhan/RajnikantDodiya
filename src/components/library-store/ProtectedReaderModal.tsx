import React, { useState, useEffect, useRef, useMemo } from 'react';
import { getLicensedBookChapters, BookChapter } from '../../data/storeCatalogData';
import {
  X,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Lock,
  ShieldCheck,
  Maximize2,
  Minimize2,
  PanelLeftClose,
  PanelLeft,
  Bookmark,
  Copy,
  Check,
  Search,
  Volume2,
  Pause,
  ArrowUp,
  SlidersHorizontal,
  Quote
} from 'lucide-react';

interface ProtectedReaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  studentMobile: string;
  orderId: string;
  isUnlocked?: boolean;
  onUnlockRequest?: () => void;
}

type ReadingTheme = 'parchment' | 'sepia' | 'night' | 'sage';
type ColumnWidth = 'focus' | 'optimal' | 'wide';
type FontFamily = 'serif' | 'sans' | 'mono';
type FontSize = 'compact' | 'standard' | 'large' | 'grand';
type LineSpacing = 'standard' | 'relaxed';

// Comprehensive, High-Contrast Theme System
const THEME_CONFIG: Record<ReadingTheme, {
  name: string;
  modalBg: string;
  headerBg: string;
  sidebarBg: string;
  canvasBg: string;
  paperBg: string;
  border: string;
  textTitle: string;
  textBody: string;
  textMuted: string;
  watermarkColor: string;
  tagBg: string;
  surfaceBorder: string;
  blockquoteBg: string;
  btnBg: string;
}> = {
  parchment: {
    name: 'Parchment',
    modalBg: 'bg-[#FAF7F2]',
    headerBg: 'bg-[#FAF7F2]',
    sidebarBg: 'bg-[#F4EFE6]',
    canvasBg: 'bg-[#FAF7F2]', // Unified, seamless academic parchment
    paperBg: 'bg-[#FAF7F2]',
    border: 'border-[#E5DDD0]',
    textTitle: 'text-[#1C1917]',
    textBody: 'text-[#292524]',
    textMuted: 'text-[#78716C]',
    watermarkColor: 'text-[#6B1D2F]/[0.10]',
    tagBg: 'bg-[#6B1D2F]/10 text-[#6B1D2F]',
    surfaceBorder: 'border-[#E5DDD0]',
    blockquoteBg: 'bg-[#F2ECE1]',
    btnBg: 'bg-black/5 hover:bg-black/10 text-[#1C1917]'
  },
  sepia: {
    name: 'Sepia',
    modalBg: 'bg-[#F5EDE0]',
    headerBg: 'bg-[#F5EDE0]',
    sidebarBg: 'bg-[#ECE0CD]',
    canvasBg: 'bg-[#F5EDE0]', // Warm antiquarian page
    paperBg: 'bg-[#F5EDE0]',
    border: 'border-[#DFCDB6]',
    textTitle: 'text-[#2C1C0F]',
    textBody: 'text-[#3D2918]',
    textMuted: 'text-[#7C634E]',
    watermarkColor: 'text-[#8C3D28]/[0.12]',
    tagBg: 'bg-[#8C3D28]/15 text-[#8C3D28]',
    surfaceBorder: 'border-[#DFCDB6]',
    blockquoteBg: 'bg-[#EDE2D1]',
    btnBg: 'bg-[#7C634E]/10 hover:bg-[#7C634E]/20 text-[#2C1C0F]'
  },
  sage: {
    name: 'Sage',
    modalBg: 'bg-[#EDF4EC]',
    headerBg: 'bg-[#EDF4EC]',
    sidebarBg: 'bg-[#DFECE0]',
    canvasBg: 'bg-[#EDF4EC]', // Tranquil herbal tea leaf
    paperBg: 'bg-[#EDF4EC]',
    border: 'border-[#C2D6C0]',
    textTitle: 'text-[#112316]',
    textBody: 'text-[#1B3322]',
    textMuted: 'text-[#486B52]',
    watermarkColor: 'text-[#1B4D2E]/[0.12]',
    tagBg: 'bg-[#1B4D2E]/15 text-[#1B4D2E]',
    surfaceBorder: 'border-[#C2D6C0]',
    blockquoteBg: 'bg-[#DFEDE0]',
    btnBg: 'bg-[#1B4D2E]/10 hover:bg-[#1B4D2E]/20 text-[#112316]'
  },
  night: {
    name: 'Night',
    modalBg: 'bg-[#121212]',
    headerBg: 'bg-[#121212]',
    sidebarBg: 'bg-[#181818]',
    canvasBg: 'bg-[#121212]', // OLED dark
    paperBg: 'bg-[#121212]',
    border: 'border-[#2A2826]',
    textTitle: 'text-[#F5EFEB]',
    textBody: 'text-[#E5DFD5]',
    textMuted: 'text-[#A0988A]',
    watermarkColor: 'text-[#C5A059]/[0.14]',
    tagBg: 'bg-[#C5A059]/20 text-[#E0C070]',
    surfaceBorder: 'border-[#2A2826]',
    blockquoteBg: 'bg-[#1E1C1A]',
    btnBg: 'bg-white/10 hover:bg-white/15 text-[#F5EFEB]'
  }
};

const CITATIONS = {
  apa: `Dodiya, R. S. (2018). APJ Abdul Kalam on Education. Madhuvan Store. ISBN: 978-81-937539-0-3.`,
  mla: `Dodiya, Rajnikant S. APJ Abdul Kalam on Education. Madhuvan Store, 2018. ISBN: 978-81-937539-0-3.`,
  chicago: `Dodiya, Rajnikant S. 2018. APJ Abdul Kalam on Education. Vallabh Vidyanagar: Madhuvan Store.`,
  bibtex: `@book{dodiya2018kalam,\n  title={APJ Abdul Kalam on Education},\n  author={Dodiya, Rajnikant S.},\n  year={2018},\n  publisher={Madhuvan Store},\n  address={Vallabh Vidyanagar},\n  isbn={978-81-937539-0-3}\n}`
};

// ISOLATED MEMOIZED CITATION MODAL: Fixed height & zero-jitter layout
const CitationModal: React.FC<{ isOpen: boolean; onClose: () => void }> = React.memo(({ isOpen, onClose }) => {
  const [format, setFormat] = useState<'apa' | 'mla' | 'chicago' | 'bibtex'>('apa');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(CITATIONS[format]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 transition-opacity"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-deckle space-y-4 text-ink select-text"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-deckle pb-3">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-claret font-bold block">
              Academic Reference
            </span>
            <h3 className="font-serif text-xl font-normal text-ink mt-0.5">Cite This Monograph</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-muted hover:text-claret transition-colors"
            aria-label="Close citation modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stable Format Selector */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-parchment-warm text-xs font-mono">
          {(['apa', 'mla', 'chicago', 'bibtex'] as const).map(fmt => (
            <button
              key={fmt}
              onClick={() => setFormat(fmt)}
              className={`flex-1 py-1.5 rounded-lg uppercase font-medium transition-colors ${
                format === fmt ? 'bg-claret text-white font-bold shadow-xs' : 'text-ink-muted hover:text-ink'
              }`}
            >
              {fmt}
            </button>
          ))}
        </div>

        {/* FIXED HEIGHT CITATION CONTAINER: Prevents modal jumping/jittering */}
        <div className="h-36 p-4 rounded-xl bg-parchment-warm border border-deckle font-mono text-xs leading-relaxed text-ink overflow-y-auto whitespace-pre-wrap select-text">
          {CITATIONS[format]}
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] font-mono text-ink-faint">ISBN: 978-81-937539-0-3</span>
          <button
            onClick={handleCopy}
            className="w-44 py-2.5 rounded-xl bg-claret text-white hover:bg-claret-light text-xs font-sans font-medium flex items-center justify-center gap-2 shadow-xs transition-colors shrink-0"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Citation'}</span>
          </button>
        </div>
      </div>
    </div>
  );
});

export const ProtectedReaderModal: React.FC<ProtectedReaderModalProps> = ({
  isOpen,
  onClose,
  studentName,
  studentMobile,
  orderId,
  isUnlocked = false,
  onUnlockRequest
}) => {
  const [currentChapterIdx, setCurrentChapterIdx] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [readingTheme, setReadingTheme] = useState<ReadingTheme>('parchment');
  const [columnWidth, setColumnWidth] = useState<ColumnWidth>('optimal');
  const [fontFamily, setFontFamily] = useState<FontFamily>('serif');
  const [fontSize, setFontSize] = useState<FontSize>('standard');
  const [lineSpacing, setLineSpacing] = useState<LineSpacing>('relaxed');
  
  // Reading enhancements
  const [copyWarning, setCopyWarning] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [isCitationOpen, setIsCitationOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [bookmarkedChapters, setBookmarkedChapters] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('rd_monograph_bookmarks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Simulated Scholarly Audio Companion
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioSpeed, setAudioSpeed] = useState<1 | 1.25 | 1.5>(1);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bookChapters = useMemo(() => getLicensedBookChapters(Boolean(isUnlocked)), [isUnlocked]);
  const activeChapter: BookChapter = bookChapters[currentChapterIdx] || bookChapters[0];
  const currentTheme = THEME_CONFIG[readingTheme];

  // Lock background scrolling when reading portal is open
  useEffect(() => {
    if (isOpen) {
      const origOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = origOverflow;
      };
    }
  }, [isOpen]);

  const FONT_FAMILY_MAP: Record<FontFamily, string> = {
    serif: "'Lora', 'Newsreader', Georgia, 'Times New Roman', serif",
    sans: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
    mono: "'Space Mono', 'JetBrains Mono', 'Courier New', monospace"
  };

  const FONT_SIZE_MAP: Record<FontSize, { fontSize: string; lineHeight: string }> = {
    compact: { fontSize: '15px', lineHeight: '1.6' },
    standard: { fontSize: '18px', lineHeight: '1.75' },
    large: { fontSize: '22px', lineHeight: '1.85' },
    grand: { fontSize: '26px', lineHeight: '2.0' }
  };

  const handleDecreaseFontSize = () => {
    const order: FontSize[] = ['compact', 'standard', 'large', 'grand'];
    const idx = order.indexOf(fontSize);
    if (idx > 0) setFontSize(order[idx - 1]);
  };

  const handleIncreaseFontSize = () => {
    const order: FontSize[] = ['compact', 'standard', 'large', 'grand'];
    const idx = order.indexOf(fontSize);
    if (idx < order.length - 1) setFontSize(order[idx + 1]);
  };

  // Intercept right click and print shortcuts for copyright protection
  useEffect(() => {
    if (!isOpen) return;

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      setCopyWarning(true);
      setTimeout(() => setCopyWarning(false), 2500);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P' || e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        setCopyWarning(true);
        setTimeout(() => setCopyWarning(false), 2500);
      }
      if (e.key === 'Escape') {
        if (isCitationOpen) {
          setIsCitationOpen(false);
        } else if (isSearchOpen) {
          setIsSearchOpen(false);
        } else if (isFullscreen) {
          setIsFullscreen(false);
        }
      }
      if (!isCitationOpen && !isSearchOpen) {
        if (e.key === 'ArrowRight' && currentChapterIdx < bookChapters.length - 1) {
          setCurrentChapterIdx(prev => prev + 1);
        }
        if (e.key === 'ArrowLeft' && currentChapterIdx > 0) {
          setCurrentChapterIdx(prev => prev - 1);
        }
      }
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isFullscreen, isCitationOpen, isSearchOpen, currentChapterIdx]);

  // Track scroll progress inside the active reading view
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    if (scrollHeight <= clientHeight) {
      setScrollProgress(100);
      return;
    }
    const percent = Math.min(100, Math.round((scrollTop / (scrollHeight - clientHeight)) * 100));
    setScrollProgress(percent);
  };

  // Reset scroll to top on chapter change
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setScrollProgress(0);
  }, [currentChapterIdx]);

  // Bookmark toggle
  const toggleBookmark = (idx: number) => {
    setBookmarkedChapters(prev => {
      const next = prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx];
      try {
        localStorage.setItem('rd_monograph_bookmarks', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  if (!isOpen) return null;

  // Typography Styling
  const fontClass = {
    serif: 'font-reading',
    sans: 'font-sans',
    mono: 'font-mono'
  }[fontFamily];

  const fontSizeClass = {
    compact: 'text-sm sm:text-[15px]',
    standard: 'text-[15px] sm:text-base',
    large: 'text-base sm:text-lg',
    grand: 'text-lg sm:text-xl'
  }[fontSize];

  const lineSpacingClass = {
    standard: 'leading-relaxed',
    relaxed: 'leading-loose'
  }[lineSpacing];

  const columnWidthClass = {
    focus: 'max-w-2xl',
    optimal: 'max-w-3xl',
    wide: 'max-w-5xl'
  }[columnWidth];

  const isCurrentBookmarked = bookmarkedChapters.includes(currentChapterIdx);

  // Optimized search match highlighter (instant return if empty)
  const renderParagraphWithHighlights = (text: string) => {
    if (!searchQuery.trim()) return text;
    const parts = text.split(new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === searchQuery.toLowerCase() ? (
            <mark key={i} className="bg-amber-300 text-ink font-semibold px-0.5 rounded">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  return (
    <div
      onContextMenu={e => e.preventDefault()}
      onCopy={e => e.preventDefault()}
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-2 bg-black/80 backdrop-blur-md animate-fade-in select-none"
      style={{ overscrollBehavior: 'contain' }}
    >
      
      {/* Container - Expands to 100% edge-to-edge on mobile, or up to max-w-7xl on desktop */}
      <div
        className={`flex flex-col justify-between overflow-hidden shadow-2xl border transition-all duration-300 ${
          isFullscreen
            ? 'fixed inset-0 w-screen h-screen z-50 rounded-none'
            : 'w-full h-full sm:w-[98vw] sm:max-w-7xl sm:h-[95vh] rounded-none sm:rounded-3xl'
        } ${currentTheme.modalBg} ${currentTheme.border}`}
      >
        
        {/* TOP COMPACT ACADEMIC CONTROL BAR */}
        <header className={`px-4 sm:px-6 py-2.5 sm:py-3 border-b flex items-center justify-between gap-3 shrink-0 ${currentTheme.headerBg} ${currentTheme.border}`}>
          
          {/* Left: Sidebar Toggle & Monograph Identity */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => setIsSidebarOpen(prev => !prev)}
              className={`p-2 rounded-xl transition-colors shrink-0 flex items-center gap-1.5 text-xs font-mono ${currentTheme.btnBg}`}
              title={isSidebarOpen ? 'Collapse Table of Contents' : 'Expand Table of Contents'}
              aria-label="Toggle sidebar"
            >
              {isSidebarOpen ? <PanelLeftClose className="w-4 h-4 text-claret" /> : <PanelLeft className="w-4 h-4 text-claret" />}
              <span className="hidden lg:inline text-[11px] font-sans font-medium">Contents</span>
            </button>

            <div className="h-5 w-px bg-black/10 hidden sm:block" />

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-claret font-bold truncate">
                  Dr. Dodiya Monograph • SPU Ph.D.
                </span>
                {isUnlocked ? (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[9px] font-mono bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.2 rounded-full font-bold">
                    <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
                    <span>Unlocked License</span>
                  </span>
                ) : (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[9px] font-mono bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.2 rounded-full font-bold">
                    <Lock className="w-2.5 h-2.5 text-amber-700" />
                    <span>Sample Mode</span>
                  </span>
                )}
              </div>
              <h2 className={`font-serif text-sm sm:text-base font-normal truncate max-w-[200px] sm:max-w-md lg:max-w-xl ${currentTheme.textTitle}`}>
                {activeChapter.title}
              </h2>
            </div>
          </div>

          {/* Right: Quick Action Controls */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            
            {/* Reading Column Width Selector */}
            <div className="hidden md:flex items-center gap-0.5 p-1 rounded-xl bg-black/5 text-[11px] font-mono">
              {(['focus', 'optimal', 'wide'] as const).map(w => (
                <button
                  key={w}
                  onClick={() => setColumnWidth(w)}
                  className={`px-2 py-1 rounded-lg capitalize transition-all ${
                    columnWidth === w ? 'bg-claret text-white shadow-2xs font-bold' : `${currentTheme.textMuted} hover:opacity-100`
                  }`}
                  title={`${w} layout`}
                >
                  {w}
                </button>
              ))}
            </div>

            {/* In-Chapter Search Toggle */}
            <button
              onClick={() => setIsSearchOpen(prev => !prev)}
              className={`p-2 rounded-xl transition-all ${isSearchOpen ? 'bg-claret text-white shadow-2xs' : currentTheme.btnBg}`}
              title="Search Chapter Text"
              aria-label="Search Chapter"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Bookmark Current Chapter */}
            <button
              onClick={() => toggleBookmark(currentChapterIdx)}
              className={`p-2 rounded-xl transition-all ${isCurrentBookmarked ? 'bg-amber-100 text-amber-800 border border-amber-300' : currentTheme.btnBg}`}
              title={isCurrentBookmarked ? 'Bookmarked Chapter' : 'Bookmark this Chapter'}
              aria-label="Bookmark chapter"
            >
              <Bookmark className={`w-4 h-4 ${isCurrentBookmarked ? 'fill-amber-600 text-amber-700' : ''}`} />
            </button>

            {/* Smooth Non-Jittery Cite Button */}
            <button
              onClick={() => setIsCitationOpen(true)}
              className={`p-2 rounded-xl transition-all flex items-center gap-1 min-h-[38px] shrink-0 ${currentTheme.btnBg}`}
              title="Scholarly Citation (APA, MLA, Chicago, BibTeX)"
              aria-label="Cite monograph"
            >
              <Quote className="w-4 h-4 text-claret" />
              <span className="hidden xl:inline text-xs font-sans font-medium">Cite</span>
            </button>

            {/* Quick Font Size Adjusters (A- and A+) */}
            <div className="flex items-center gap-0.5 p-0.5 rounded-xl bg-black/5 text-xs font-mono shrink-0">
              <button
                onClick={handleDecreaseFontSize}
                disabled={fontSize === 'compact'}
                className="px-2 py-1 rounded-lg hover:bg-white/80 disabled:opacity-30 transition-all font-serif font-bold text-xs"
                title="Decrease Font Size (A-)"
                aria-label="Decrease Font Size"
              >
                A-
              </button>
              <button
                onClick={handleIncreaseFontSize}
                disabled={fontSize === 'grand'}
                className="px-2 py-1 rounded-lg hover:bg-white/80 disabled:opacity-30 transition-all font-serif font-bold text-sm"
                title="Increase Font Size (A+)"
                aria-label="Increase Font Size"
              >
                A+
              </button>
            </div>

            {/* Reading Preferences (Themes & Fonts) Popover Toggle */}
            <div className="relative">
              <button
                onClick={() => setIsPreferencesOpen(prev => !prev)}
                className={`p-2 rounded-xl transition-all ${isPreferencesOpen ? 'bg-claret text-white shadow-2xs' : currentTheme.btnBg}`}
                title="Typography & Reading Aesthetics"
                aria-label="Appearance settings"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>

              {/* Preferences Dropdown Panel */}
              {isPreferencesOpen && (
                <div className="absolute right-0 top-12 z-50 w-72 sm:w-80 p-4 rounded-2xl bg-white shadow-2xl border border-deckle space-y-4 animate-fade-in text-ink">
                  <div className="flex items-center justify-between border-b border-deckle pb-2">
                    <span className="text-xs font-mono uppercase font-bold text-claret">Reading Aesthetics</span>
                    <button onClick={() => setIsPreferencesOpen(false)} className="text-xs text-ink-muted hover:text-claret">✕</button>
                  </div>

                  {/* Fully Functional Themes */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-mono text-ink-muted block uppercase">Background Palette</span>
                    <div className="grid grid-cols-4 gap-1.5 text-xs">
                      <button
                        onClick={() => setReadingTheme('parchment')}
                        className={`p-2 rounded-xl text-center border font-serif text-[11px] transition-all flex flex-col items-center gap-1 ${
                          readingTheme === 'parchment' ? 'ring-2 ring-claret border-claret font-bold' : 'border-deckle hover:border-claret/50'
                        } bg-[#FAF7F2] text-[#1C1917]`}
                      >
                        <span className="w-3.5 h-3.5 rounded-full bg-[#FAF7F2] border border-[#E5DDD0]" />
                        <span>Parchment</span>
                      </button>
                      <button
                        onClick={() => setReadingTheme('sepia')}
                        className={`p-2 rounded-xl text-center border font-serif text-[11px] transition-all flex flex-col items-center gap-1 ${
                          readingTheme === 'sepia' ? 'ring-2 ring-amber-700 border-amber-700 font-bold' : 'border-[#DECDB8] hover:border-amber-700/50'
                        } bg-[#F5EDE0] text-[#2C2416]`}
                      >
                        <span className="w-3.5 h-3.5 rounded-full bg-[#F5EDE0] border border-[#DFCDB6]" />
                        <span>Sepia</span>
                      </button>
                      <button
                        onClick={() => setReadingTheme('sage')}
                        className={`p-2 rounded-xl text-center border font-serif text-[11px] transition-all flex flex-col items-center gap-1 ${
                          readingTheme === 'sage' ? 'ring-2 ring-emerald-700 border-emerald-700 font-bold' : 'border-[#CFDDD0] hover:border-emerald-700/50'
                        } bg-[#EDF4EC] text-[#1C2826]`}
                      >
                        <span className="w-3.5 h-3.5 rounded-full bg-[#EDF4EC] border border-[#C2D6C0]" />
                        <span>Sage</span>
                      </button>
                      <button
                        onClick={() => setReadingTheme('night')}
                        className={`p-2 rounded-xl text-center border font-serif text-[11px] transition-all flex flex-col items-center gap-1 ${
                          readingTheme === 'night' ? 'ring-2 ring-amber-400 border-amber-400 font-bold' : 'border-[#2C2622] hover:border-stone-500'
                        } bg-[#121212] text-[#E8E2D8]`}
                      >
                        <span className="w-3.5 h-3.5 rounded-full bg-[#121212] border border-[#2A2826]" />
                        <span>Night</span>
                      </button>
                    </div>
                  </div>

                  {/* Font Family */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-mono text-ink-muted block uppercase">Typography Style</span>
                    <div className="grid grid-cols-3 gap-1.5 text-xs">
                      <button
                        onClick={() => setFontFamily('serif')}
                        className={`p-2 rounded-xl border text-center font-serif transition-all ${fontFamily === 'serif' ? 'bg-claret text-white font-medium' : 'bg-parchment-warm text-ink'}`}
                      >
                        Classic Serif
                      </button>
                      <button
                        onClick={() => setFontFamily('sans')}
                        className={`p-2 rounded-xl border text-center font-sans transition-all ${fontFamily === 'sans' ? 'bg-claret text-white font-medium' : 'bg-parchment-warm text-ink'}`}
                      >
                        Modern Sans
                      </button>
                      <button
                        onClick={() => setFontFamily('mono')}
                        className={`p-2 rounded-xl border text-center font-mono text-[11px] transition-all ${fontFamily === 'mono' ? 'bg-claret text-white font-medium' : 'bg-parchment-warm text-ink'}`}
                      >
                        Draft Mono
                      </button>
                    </div>
                  </div>

                  {/* Font Size & Spacing */}
                  <div className="grid grid-cols-2 gap-3 pt-1 border-t border-deckle">
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-ink-muted block uppercase">Size</span>
                      <div className="flex items-center gap-1 bg-parchment-warm p-1 rounded-xl">
                        {(['compact', 'standard', 'large', 'grand'] as FontSize[]).map(sz => (
                          <button
                            key={sz}
                            onClick={() => setFontSize(sz)}
                            className={`flex-1 py-1 rounded-lg text-xs font-mono uppercase ${fontSize === sz ? 'bg-claret text-white font-bold' : 'text-ink-muted'}`}
                          >
                            {sz[0]}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-ink-muted block uppercase">Spacing</span>
                      <div className="flex items-center gap-1 bg-parchment-warm p-1 rounded-xl text-xs font-sans">
                        <button
                          onClick={() => setLineSpacing('standard')}
                          className={`flex-1 py-1 rounded-lg ${lineSpacing === 'standard' ? 'bg-claret text-white font-medium' : 'text-ink-muted'}`}
                        >
                          Norm
                        </button>
                        <button
                          onClick={() => setLineSpacing('relaxed')}
                          className={`flex-1 py-1 rounded-lg ${lineSpacing === 'relaxed' ? 'bg-claret text-white font-medium' : 'text-ink-muted'}`}
                        >
                          Relax
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </div>

            {/* Zen Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(prev => !prev)}
              className={`p-2 rounded-xl transition-colors shrink-0 ${currentTheme.btnBg}`}
              title={isFullscreen ? 'Exit Zen Fullscreen' : 'Enter Zen Fullscreen'}
              aria-label="Toggle fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Reader */}
            <button
              onClick={onClose}
              className={`p-2 rounded-xl hover:text-claret transition-colors shrink-0 min-h-[38px] min-w-[38px] flex items-center justify-center ${currentTheme.btnBg}`}
              aria-label="Close reader"
            >
              <X className="w-5 h-5" />
            </button>

          </div>
        </header>

        {/* READING PROGRESS BAR */}
        <div className="w-full bg-black/5 h-1 shrink-0 overflow-hidden">
          <div
            className="h-full bg-claret transition-all duration-150 ease-out"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>

        {/* IN-CHAPTER SEARCH DRAWER */}
        {isSearchOpen && (
          <div className={`px-6 py-2.5 border-b flex items-center justify-between gap-3 animate-fade-in shrink-0 ${currentTheme.headerBg} ${currentTheme.border}`}>
            <div className="flex items-center gap-2 flex-1 max-w-lg">
              <Search className="w-4 h-4 text-claret shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Find keyword in active chapter (e.g., Kalam, pedagogy, NEP 2020)..."
                className={`w-full bg-transparent border-0 text-xs focus:outline-none placeholder:opacity-50 ${currentTheme.textBody}`}
                autoFocus
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-xs opacity-60 hover:opacity-100">✕</button>
              )}
            </div>
            <div className={`text-[11px] font-mono shrink-0 ${currentTheme.textMuted}`}>
              {searchQuery ? `Searching chapter...` : `Press Esc to dismiss`}
            </div>
          </div>
        )}

        {/* COPYRIGHT PROTECTION TOAST */}
        {copyWarning && (
          <div className="bg-claret text-white px-4 py-2 text-xs font-sans text-center flex items-center justify-center gap-2 animate-fade-in shrink-0 shadow-md">
            <Lock className="w-3.5 h-3.5" />
            <span>This copyrighted academic monograph is protected under single-device scholarship license. Copying and printing are restricted.</span>
          </div>
        )}

        {/* MAIN BODY VIEWPORT (Sidebar + Wide Reading Canvas) */}
        <div className="flex-1 min-h-0 flex overflow-hidden relative">
          
          {/* Mobile Sidebar Backdrop */}
          {isSidebarOpen && (
            <div
              onClick={() => setIsSidebarOpen(false)}
              className="sm:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-xs animate-fade-in"
            />
          )}

          {/* COLLAPSIBLE CHAPTER SIDEBAR */}
          <aside
            className={`transition-all duration-300 shrink-0 border-r flex flex-col justify-between ${currentTheme.sidebarBg} ${currentTheme.border} ${
              isSidebarOpen
                ? 'fixed inset-y-0 left-0 z-40 w-4/5 max-w-xs p-4 overflow-y-auto sm:relative sm:w-80 shadow-2xl sm:shadow-none'
                : 'w-0 p-0 overflow-hidden border-r-0'
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-claret font-bold">
                  Table of Contents
                </span>
                <span className={`text-[10px] font-mono ${currentTheme.textMuted}`}>
                  4 Chapters • {bookChapters.reduce((acc, c) => acc + (c.readingTimeMinutes || 6), 0)} min total
                </span>
              </div>

              <div className="space-y-2">
                {bookChapters.map((ch, idx) => {
                  const isActive = idx === currentChapterIdx;
                  const isChapterLocked = !isUnlocked && idx > 0;
                  const isBookmarked = bookmarkedChapters.includes(idx);

                  return (
                    <button
                      key={ch.id}
                      onClick={() => {
                        setCurrentChapterIdx(idx);
                        if (typeof window !== 'undefined' && window.innerWidth < 640) {
                          setIsSidebarOpen(false);
                        }
                      }}
                      className={`w-full text-left p-3.5 rounded-2xl text-xs transition-all relative border ${
                        isActive
                          ? 'bg-claret text-white font-medium shadow-xs border-claret'
                          : `hover:bg-black/5 border-transparent opacity-85 ${currentTheme.textBody}`
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono opacity-80 block">{ch.chapterNumber}</span>
                        <div className="flex items-center gap-1.5">
                          {isBookmarked && (
                            <Bookmark className={`w-3 h-3 ${isActive ? 'fill-amber-300 text-amber-300' : 'fill-amber-500 text-amber-500'}`} />
                          )}
                          {isChapterLocked ? (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-mono bg-claret/20 text-claret px-1.5 py-0.5 rounded font-bold">
                              <Lock className="w-2.5 h-2.5" /> Locked
                            </span>
                          ) : (
                            idx === 0 && !isUnlocked && (
                              <span className="text-[9px] font-mono bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                                Sample
                              </span>
                            )
                          )}
                        </div>
                      </div>

                      <span className="font-serif text-sm block leading-snug">{ch.title}</span>
                      
                      <div className="flex items-center justify-between mt-2 text-[10px] font-mono opacity-70">
                        <span>{ch.pages}</span>
                        <span>{ch.readingTimeMinutes || 6} min read</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sidebar Security & Candidate Badge */}
            <div className={`pt-4 border-t border-black/10 mt-6 space-y-2 text-[11px] font-mono ${currentTheme.textMuted}`}>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span className="truncate">Candidate: {studentName || 'Scholar Pass'}</span>
              </div>
              <div className="text-[10px] opacity-75">
                Order #{orderId || 'HMP-2026'} • 1 Device Locked
              </div>
            </div>
          </aside>

          {/* SPATIOUS READING CANVAS: Seamless, distraction-free typography layout */}
          <main
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className={`flex-1 min-h-0 overflow-y-auto px-4 sm:px-8 lg:px-12 py-8 relative transition-colors duration-200 ${currentTheme.canvasBg}`}
            style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
            tabIndex={0}
          >
            {/* Ambient Forensic Security Watermark Overlay */}
            <div
              className="absolute inset-0 pointer-events-none select-none z-0 overflow-hidden flex flex-col justify-around py-12"
              aria-hidden="true"
            >
              {[...Array(10)].map((_, i) => (
                <div key={i} className="whitespace-nowrap -rotate-[18deg] select-none text-center my-16">
                  <span className={`font-mono text-xs tracking-[0.25em] uppercase font-bold select-none ${currentTheme.watermarkColor}`}>
                    LICENSED SCHOLAR COPY • {studentName.toUpperCase() || 'REGISTERED SCHOLAR'} • +91 {studentMobile || '9876543210'} • ORDER #{orderId || 'HMP-2026'} • SPU MONOGRAPH
                  </span>
                </div>
              ))}
            </div>

            {/* Reading Column: Clean Academic Setting */}
            <article className={`w-full ${columnWidthClass} mx-auto space-y-8 relative z-10 pb-16`}>

              {/* Chapter Meta Header */}
              <div className="border-b border-black/10 pb-6 space-y-2 relative z-10">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className={`text-xs font-mono uppercase tracking-widest font-bold ${currentTheme.tagBg} px-2.5 py-0.5 rounded`}>
                    {activeChapter.chapterNumber}
                  </span>
                  <div className={`flex items-center gap-3 text-xs font-mono ${currentTheme.textMuted}`}>
                    <span>{activeChapter.pages}</span>
                    <span>•</span>
                    <span>~{activeChapter.readingTimeMinutes || 6} min read</span>
                    <span>•</span>
                    <span className="text-emerald-700 font-semibold">{scrollProgress}% completed</span>
                  </div>
                </div>

                <h1 className={`font-serif text-2xl sm:text-3xl md:text-4xl font-normal leading-tight ${currentTheme.textTitle}`}>
                  {renderParagraphWithHighlights(activeChapter.title)}
                </h1>

                {/* Chapter Epigraph if available */}
                {activeChapter.epigraph && (
                  <div className="pt-3">
                    <blockquote className={`p-4 rounded-xl border-l-3 border-claret text-xs sm:text-sm font-reading italic leading-relaxed ${currentTheme.blockquoteBg} ${currentTheme.textMuted}`}>
                      "{activeChapter.epigraph.quote}"
                      <footer className="text-right not-italic font-mono text-[11px] text-claret mt-1.5 font-bold">
                        — {activeChapter.epigraph.author}
                      </footer>
                    </blockquote>
                  </div>
                )}
              </div>

              {/* Chapter Content or Lock Callout */}
              {!isUnlocked && currentChapterIdx > 0 ? (
                /* SAMPLE MODE PAYWALL CALLOUT */
                <div className="space-y-6 relative z-10">
                  <div className={`p-5 rounded-2xl border font-reading italic text-sm leading-relaxed ${currentTheme.blockquoteBg} ${currentTheme.border} ${currentTheme.textMuted}`}>
                    "{activeChapter.excerptPreview}"
                  </div>

                  <div className="relative rounded-3xl p-6 sm:p-10 border-2 border-dashed border-claret/30 bg-claret-soft/30 text-center space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-claret text-white flex items-center justify-center mx-auto shadow-md">
                      <Lock className="w-7 h-7" />
                    </div>
                    <div className="space-y-2 max-w-lg mx-auto">
                      <span className="text-xs font-mono uppercase tracking-widest text-claret font-bold bg-claret-soft px-3 py-1 rounded-full border border-claret/20 inline-block">
                        Chapter {currentChapterIdx + 1} Locked • Sample Reader Mode
                      </span>
                      <h3 className={`font-serif text-2xl sm:text-3xl font-normal ${currentTheme.textTitle}`}>
                        Unlock the Full 4-Chapter Scholarly Monograph
                      </h3>
                      <p className={`text-xs sm:text-sm font-reading leading-relaxed ${currentTheme.textMuted}`}>
                        You are viewing the complimentary Preface & Prolegomena sample. Chapters I through III contain complete empirical tables, post-method pedagogy models, and Dr. Kalam's educational epistemologies. Acquire an authorized single-device pass at the Academic Learn Hub to read instantly.
                      </p>
                    </div>

                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                      <button
                        onClick={() => {
                          onClose();
                          onUnlockRequest?.();
                        }}
                        className="px-8 py-3.5 rounded-xl bg-claret hover:bg-claret-light text-white text-xs font-medium shadow-xs transition-all inline-flex items-center gap-2 min-h-[44px]"
                      >
                        <Lock className="w-4 h-4" />
                        <span>Acquire Full Monograph Pass (₹399)</span>
                      </button>
                      <button
                        onClick={() => setCurrentChapterIdx(0)}
                        className={`px-5 py-3 rounded-xl border text-xs font-mono min-h-[44px] ${currentTheme.btnBg} ${currentTheme.border}`}
                      >
                        Back to Sample Preface
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* UNLOCKED FULL CONTENT OR SAMPLE PREFACE */
                <div
                  className={`space-y-6 ${currentTheme.textBody} relative z-10`}
                  style={{
                    fontFamily: FONT_FAMILY_MAP[fontFamily],
                    fontSize: FONT_SIZE_MAP[fontSize].fontSize,
                    lineHeight: lineSpacing === 'relaxed' ? '2.1' : FONT_SIZE_MAP[fontSize].lineHeight
                  }}
                >
                  
                  {/* Lead Section */}
                  <div className="space-y-4 text-justify">
                    {activeChapter.fullContent.map((para, i) => (
                      <p key={i} className="indent-6 sm:indent-8">
                        {renderParagraphWithHighlights(para)}
                      </p>
                    ))}
                  </div>

                  {/* Sample Excerpt Concluded Callout for Chapter 0 in Sample Mode */}
                  {!isUnlocked && (
                    <div className="mt-8 p-6 sm:p-8 rounded-2xl border-2 border-dashed border-claret/30 bg-claret-soft/30 text-center space-y-3">
                      <div className="w-10 h-10 rounded-xl bg-claret text-white flex items-center justify-center mx-auto shadow-xs">
                        <Lock className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-claret font-bold bg-claret-soft px-3 py-1 rounded-full border border-claret/20 inline-block">
                        Sample Excerpt Concluded
                      </span>
                      <h3 className={`font-serif text-lg sm:text-xl font-normal ${currentTheme.textTitle}`}>
                        Unlock the Complete Monograph
                      </h3>
                      <p className={`text-xs font-reading max-w-md mx-auto leading-relaxed ${currentTheme.textMuted}`}>
                        This concludes the complimentary sample preview. Unlock the full edition to access all 4 complete chapters, pedagogy tables, curriculum frameworks, and empirical findings.
                      </p>
                      <div className="pt-2">
                        <button
                          onClick={() => {
                            onClose();
                            onUnlockRequest?.();
                          }}
                          className="px-6 py-2.5 rounded-xl bg-claret hover:bg-claret-light text-white text-xs font-medium shadow-xs transition-all inline-flex items-center gap-2"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>Acquire Full Monograph Pass (₹399)</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Subsections if available */}
                  {activeChapter.subsections && activeChapter.subsections.length > 0 && (
                    <div className="space-y-8 pt-4">
                      {activeChapter.subsections.map((sub, sIdx) => (
                        <section key={sIdx} className="space-y-3.5 pt-4 border-t border-black/5">
                          <h3 className={`font-serif text-lg sm:text-xl font-normal ${currentTheme.textTitle}`}>
                            {renderParagraphWithHighlights(sub.subtitle)}
                          </h3>
                          <div className="space-y-3.5 text-justify">
                            {sub.paragraphs.map((p, pIdx) => (
                              <p key={pIdx} className="indent-6 sm:indent-8">
                                {renderParagraphWithHighlights(p)}
                              </p>
                            ))}
                          </div>
                        </section>
                      ))}
                    </div>
                  )}

                  {/* Scholarly Footnotes Section */}
                  {activeChapter.footnotes && activeChapter.footnotes.length > 0 && (
                    <div className={`pt-8 mt-10 border-t border-black/10 text-xs font-mono space-y-2 ${currentTheme.textMuted}`}>
                      <span className="text-[10px] uppercase font-bold text-claret block tracking-wider">
                        Scholarly Footnotes & Citations
                      </span>
                      {activeChapter.footnotes.map((fn, fIdx) => (
                        <p key={fIdx} className="leading-relaxed">
                          {fn}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* End of Chapter Colophon & Forensic Stamp */}
                  <div className={`pt-8 border-t border-black/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-mono ${currentTheme.textMuted}`}>
                    <span className="italic">
                      End of {activeChapter.chapterNumber} • Dr. Rajnikant S. Dodiya
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px]">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Certified Scholar Stream • #{orderId || 'HMP-2026'}</span>
                    </span>
                  </div>

                  {/* Next Chapter Prompt Button */}
                  {currentChapterIdx < bookChapters.length - 1 && (
                    <div className="pt-4 text-center">
                      <button
                        onClick={() => {
                          setCurrentChapterIdx(prev => prev + 1);
                          scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="px-6 py-2.5 rounded-xl bg-claret text-white hover:bg-claret-light text-xs font-medium transition-all shadow-xs inline-flex items-center gap-2 min-h-[42px]"
                      >
                        <span>Continue to {bookChapters[currentChapterIdx + 1]?.title}</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                </div>
              )}

            </article>
          </main>

        </div>

        {/* BOTTOM ACADEMIC AUDIO COMPANION BAR (Toggleable) */}
        {isAudioPlaying && (
          <div className="px-6 py-2.5 bg-[#521422] text-[#FAF5EB] flex items-center justify-between gap-4 text-xs font-mono shrink-0 animate-fade-in">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsAudioPlaying(false)}
                className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white"
              >
                <Pause className="w-3.5 h-3.5" />
              </button>
              <div className="truncate">
                <span className="text-[10px] uppercase text-[#FAF5EB]/70 block font-sans">Scholarly Audio Narration Companion</span>
                <span className="font-serif font-normal text-white truncate max-w-md block">{activeChapter.title}</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-1">
                {[...Array(12)].map((_, i) => (
                  <span
                    key={i}
                    className="w-1 bg-[#FAF5EB]/60 rounded-full animate-pulse"
                    style={{ height: `${8 + (i % 5) * 4}px`, animationDelay: `${i * 100}ms` }}
                  />
                ))}
              </div>

              <button
                onClick={() => setAudioSpeed(prev => (prev === 1 ? 1.25 : prev === 1.25 ? 1.5 : 1))}
                className="px-2 py-0.5 rounded bg-white/20 hover:bg-white/30 text-[10px] font-mono text-white"
                title="Playback speed"
              >
                {audioSpeed}x
              </button>
            </div>
          </div>
        )}

        {/* FOOTER NAVIGATION & METRICS BAR */}
        <footer className={`px-4 sm:px-8 py-2.5 sm:py-3 border-t flex items-center justify-between shrink-0 text-xs font-mono ${currentTheme.headerBg} ${currentTheme.border}`}>
          
          <button
            disabled={currentChapterIdx === 0}
            onClick={() => setCurrentChapterIdx(prev => Math.max(0, prev - 1))}
            className={`px-3.5 py-1.5 rounded-xl disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1.5 min-h-[38px] transition-colors ${currentTheme.btnBg}`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Previous Chapter</span>
          </button>

          {/* Center Navigation Shortcuts */}
          <div className="flex items-center gap-3 text-[11px] font-sans">
            <span className={`hidden md:inline font-mono ${currentTheme.textMuted}`}>
              Chapter {currentChapterIdx + 1} of {bookChapters.length}
            </span>

            {/* Audio Companion Button */}
            <button
              onClick={() => setIsAudioPlaying(prev => !prev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-sans transition-all flex items-center gap-1.5 ${
                isAudioPlaying ? 'bg-claret text-white shadow-2xs' : currentTheme.btnBg
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isAudioPlaying ? 'Narration Active' : 'Listen'}</span>
            </button>

            {/* Top Scroll Shortcut */}
            <button
              onClick={() => scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
              className={`p-1.5 rounded-xl ${currentTheme.btnBg}`}
              title="Jump to Top"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            disabled={currentChapterIdx === bookChapters.length - 1}
            onClick={() => setCurrentChapterIdx(prev => Math.min(bookChapters.length - 1, prev + 1))}
            className="px-4 py-1.5 rounded-xl bg-claret text-white hover:bg-claret-light disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1.5 min-h-[38px] font-sans font-medium shadow-xs transition-all"
          >
            <span className="hidden sm:inline">Next Chapter</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </footer>

      </div>

      {/* ISOLATED ZERO-JITTER CITATION MODAL */}
      <CitationModal
        isOpen={isCitationOpen}
        onClose={() => setIsCitationOpen(false)}
      />

    </div>
  );
};
