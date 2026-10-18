import React, { useState, lazy, Suspense } from 'react';
import { STORE_PRODUCTS, StoreProduct } from '../../data/storeCatalogData';
import { BOOKS } from '../../data/professorData';
import { useScholarSession, ScholarSession } from '../../hooks/useScholarSession';
import { generateSecureDeviceToken } from '../../lib/security';

// Lazily loaded on-demand checkout, reader, and exam portal
const CirculationDeskModal = lazy(() => import('./CirculationDeskModal').then(m => ({ default: m.CirculationDeskModal })));
const ProtectedReaderModal = lazy(() => import('./ProtectedReaderModal').then(m => ({ default: m.ProtectedReaderModal })));
const ExamPortal = lazy(() => import('./ExamPortal').then(m => ({ default: m.ExamPortal })));
import {
  BookOpen,
  Award,
  ShieldCheck,
  Lock,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  Bookmark,
  Laptop,
  RotateCcw,
  Search,
  Eye,
  BookMarked,
  X,
  Copy,
  Check,
  Library,
  Quote,
  FileText,
  Compass
} from 'lucide-react';

// Scholarly synopses for Dr. Dodiya's published oeuvre
const BOOK_SYNOPSES: Record<string, string> = {
  "978-81-937539-0-3": "Dr. Dodiya's definitive doctoral treatise investigating Dr. A.P.J. Abdul Kalam's educational philosophy, synthesizing ethical leadership, experiential learning, and national youth empowerment into a contemporary pedagogical framework.",
  "978-81-937539-1-0": "A focused pedagogical monograph analyzing Dr. Kalam's imperatives for rural education uplift, moral science in schools, and the transformation of teachers into empathetic intellectual guides.",
  "978-93-85037-51-1": "A comprehensive curriculum manual for B.Ed. and M.Ed. teacher trainees, addressing LSRW skill development, post-CLT methodologies, and lesson planning in Indian regional contexts.",
  "978-93-85037-50-4": "A comparative philosophical survey exploring the pedagogical paradigms of Swami Vivekananda, Sri Aurobindo, Mahatma Gandhi, Dr. B.R. Ambedkar, and Dr. Kalam.",
  "978-93-5311-203-5": "A biographical pedagogical sourcebook chronicling key transformative milestones from Rameswaram to the Rashtrapati Bhavan, highlighting principles of resilience and scientific inquiry.",
  "978-93-5311-260-8": "An analytical treatise examining socioeconomic determinants of literacy, institutional quality assurance (IQAC), and systemic policy reforms in Indian teacher education.",
  "978-81-931777-6-1": "An edited university volume examining epistemology, classical Indian darshanas, NEP 2020 IKS mandates, and their dialectic encounter with Western educational theories.",
  "978-93-90256-27-3": "An authoritative examination companion covering British literature chronologies, critical theory, American & postcolonial literatures, and high-yield solved question banks.",
  "978-81-931777-4-7": "An edited research collection focusing on techno-pedagogical integration, AI in language classrooms, blended learning, and task-based language teaching.",
  "978-81-931777-1-6": "A scholarly inquiry into B. Kumaravadivelu's post-method condition (particularity, practicality, possibility) applied to English language classrooms in Gujarat.",
  "978-93-6729-117-7": "A university treatise chapter exploring digital learning architectures, AI-integrated techno-pedagogy, and open educational resources aligned with NEP 2020."
};

// Spine styling palette for the authentic library stacks
const SPINE_PALETTES = [
  { bg: 'from-[#4A0E17] via-[#6B1724] to-[#4A0E17]', border: '#8A2D3C', text: '#FAF5EC', tag: 'SPU-18' },
  { bg: 'from-[#0D1B2A] via-[#1B263B] to-[#0D1B2A]', border: '#2B4162', text: '#E0FBFC', tag: 'NET-24' },
  { bg: 'from-[#1B3022] via-[#2D4A3E] to-[#1B3022]', border: '#3F6656', text: '#F4F1DE', tag: 'IKS-25' },
  { bg: 'from-[#3E2723] via-[#4E342E] to-[#3E2723]', border: '#6D4C41', text: '#FFF8E1', tag: 'ELT-22' },
  { bg: 'from-[#311B92] via-[#4527A0] to-[#311B92]', border: '#5E35B1', text: '#F3E5F5', tag: 'PMP-20' },
  { bg: 'from-[#BF360C] via-[#D84315] to-[#BF360C]', border: '#E64A19', text: '#FBE9E7', tag: 'ENG-18' },
  { bg: 'from-[#263238] via-[#37474F] to-[#263238]', border: '#455A64', text: '#ECEFF1', tag: 'THK-18' },
  { bg: 'from-[#5D4037] via-[#795548] to-[#5D4037]', border: '#8D6E63', text: '#EFEBE9', tag: 'BIO-18' },
  { bg: 'from-[#1A237E] via-[#283593] to-[#1A237E]', border: '#3949AB', text: '#E8EAF6', tag: 'EDU-18' },
  { bg: 'from-[#004D40] via-[#00695C] to-[#004D40]', border: '#00796B', text: '#E0F2F1', tag: 'IMP-18' },
];

export interface LibraryStorePageProps {
  onOpenAuthModal?: () => void;
}

export const LibraryStorePage: React.FC<LibraryStorePageProps> = ({ onOpenAuthModal }) => {
  const [selectedProduct, setSelectedProduct] = useState<StoreProduct | null>(null);
  const [isCirculationOpen, setIsCirculationOpen] = useState(false);
  const [isReaderOpen, setIsReaderOpen] = useState(false);
  const [isExamOpen, setIsExamOpen] = useState(false);
  const [isReaderSample, setIsReaderSample] = useState(false);
  const [isExamSample, setIsExamSample] = useState(false);

  // Active stack filter drawer
  const [activeFilter, setActiveFilter] = useState<'all' | 'monograph' | 'exam' | 'bundle' | 'published'>('all');

  // Oak Inspection Plinth Modal state (pulling book off the shelf)
  const [inspectedBook, setInspectedBook] = useState<{
    title: string;
    subtitle?: string;
    year: number | string;
    publisher: string;
    isbn: string;
    type: 'authored' | 'edited' | 'chapter' | 'cbt';
    synopsis: string;
    price?: number;
    callNumber?: string;
    isCoreProduct?: 'book' | 'exam' | 'bundle';
  } | null>(null);

  const [copiedCitation, setCopiedCitation] = useState(false);

  // Synchronized active scholar session state across the entire site
  const { session: studentSession, isBookOwned, isExamOwned, isBundleOwned, isComplimentaryOwned, saveSession, clearSession: handleClearSession } = useScholarSession();

  const bookProduct = STORE_PRODUCTS.find(p => p.type === 'book') || STORE_PRODUCTS[0];
  const examProduct = STORE_PRODUCTS.find(p => p.type === 'exam') || STORE_PRODUCTS[1];
  const bundleProduct = STORE_PRODUCTS.find(p => p.type === 'bundle') || STORE_PRODUCTS[2];

  const handleOpenCheckout = (product: StoreProduct) => {
    setSelectedProduct(product);
    setIsCirculationOpen(true);
  };

  const handlePurchaseSuccess = (product: StoreProduct, name: string, mobile: string, orderId: string, deviceToken?: string) => {
    const updatedUnlocks = [...studentSession.unlockedItems];
    if (product.type === 'book' && !updatedUnlocks.includes('book')) updatedUnlocks.push('book');
    else if (product.type === 'exam' && !updatedUnlocks.includes('exam')) updatedUnlocks.push('exam');
    else if (product.type === 'bundle') {
      if (!updatedUnlocks.includes('book')) updatedUnlocks.push('book');
      if (!updatedUnlocks.includes('exam')) updatedUnlocks.push('exam');
    }

    const updatedSession: ScholarSession = {
      name,
      mobile,
      orderId,
      unlockedItems: updatedUnlocks,
      deviceToken: deviceToken || studentSession.deviceToken || generateSecureDeviceToken()
    };

    saveSession(updatedSession);

    // Automatically launch the purchased product in full unlocked mode
    if (product.type === 'book') {
      setIsReaderSample(false);
      setIsReaderOpen(true);
    } else {
      setIsExamSample(false);
      setIsExamOpen(true);
    }
  };

  const handleCopyCitation = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCitation(true);
    setTimeout(() => setCopiedCitation(false), 2400);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pt-1 pb-12 w-full max-w-full overflow-x-hidden">
      
      {/* ========================================================= */}
      {/* SECTION 1: COMPACT FOYER & BORROWER BADGE                */}
      {/* ========================================================= */}
      <div className="relative rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-7 bg-gradient-to-br from-[#1A0E08] via-[#2A160C] to-[#140804] text-white border-2 border-[#5C321E] shadow-xl overflow-hidden">
        {/* Overhead Warm Chandelier Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_50%_at_50%_0%,rgba(212,175,55,0.18),rgba(0,0,0,0))] pointer-events-none" />
        <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-[#E5C158] to-transparent opacity-75" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#3D2012]/90 border border-[#D4AF37]/40 text-[#F5E6B3] text-[10px] sm:text-xs font-mono font-medium shadow-inner">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E5C158] animate-pulse" />
              <span>THE ATHENEUM • SARDAR PATEL UNIVERSITY REPOSITORY</span>
            </div>
            
            <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl text-[#FFFDF9] font-normal tracking-tight leading-snug">
              Classical Academic Library & Acquisitions Desk
            </h1>
            
            <p className="text-xs sm:text-sm text-[#D7C3B0] font-reading font-light leading-relaxed max-w-xl">
              Inspect Dr. Dodiya’s doctoral research monographs, UGC-NET CBT exam ledgers, and published treatises. Pull any tome from the mahogany stacks to examine excerpts or acquire 1-device scholar passes.
            </p>
          </div>

          {/* Vintage Borrower's Library Pass or Guest Mode */}
          <div className="shrink-0 w-full md:w-auto">
            {studentSession.unlockedItems.length > 0 ? (
              <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-[#FFFDF7] text-[#1E1915] border-2 border-[#C5A059] shadow-lg relative overflow-hidden max-w-sm">
                <div className="flex items-center justify-between border-b border-[#E3DDD4] pb-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <Library className="w-3.5 h-3.5 text-[#8A1C2E]" />
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8A1C2E]">
                      Borrower's Pass
                    </span>
                  </div>
                  <span className="text-[8.5px] font-mono px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                    1-Device Active
                  </span>
                </div>

                <div className="space-y-1 text-xs font-sans">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[#6B5E51] text-[10px] font-mono">Scholar:</span>
                    <span className="font-serif font-bold text-ink truncate max-w-[150px]">{studentSession.name}</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-[#6B5E51] text-[10px] font-mono">Accession:</span>
                    <span className="font-mono text-[10px] text-ink font-semibold">#{studentSession.orderId}</span>
                  </div>
                  <div className="flex justify-between items-center pt-0.5">
                    <span className="text-[#6B5E51] text-[10px] font-mono">Holdings:</span>
                    <div className="flex gap-1 flex-wrap">
                      {isBookOwned && (
                        <span className="text-[8.5px] font-mono bg-[#581622] text-[#FDF8EE] px-1.5 py-0.2 rounded font-bold">
                          Monograph
                        </span>
                      )}
                      {isExamOwned && (
                        <span className="text-[8.5px] font-mono bg-[#112038] text-[#E0FBFC] px-1.5 py-0.2 rounded font-bold">
                          CBT Exam
                        </span>
                      )}
                      {isComplimentaryOwned && !isBookOwned && (
                        <span className="text-[8.5px] font-mono bg-emerald-800 text-emerald-100 px-1.5 py-0.2 rounded font-bold">
                          Complimentary Pass
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-[#E3DDD4] flex items-center justify-between">
                  <span className="text-[8.5px] font-mono text-[#8C7A6B]">DRM Active</span>
                  <div className="flex items-center gap-2">
                    {onOpenAuthModal && (
                      <button
                        onClick={onOpenAuthModal}
                        className="text-[9.5px] font-mono text-ink-muted hover:text-ink hover:underline font-medium"
                      >
                        Manage
                      </button>
                    )}
                    <button
                      onClick={handleClearSession}
                      className="text-[9.5px] font-mono text-[#8A1C2E] hover:text-[#5E121E] hover:underline inline-flex items-center gap-1 font-semibold"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                      <span>Reset</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 sm:p-3.5 rounded-xl bg-[#261309]/90 border border-[#8C5332]/50 text-[#EBDBC8] flex items-center justify-between gap-3 max-w-sm">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#521422] text-[#FAF5EB] flex items-center justify-center font-bold font-serif shrink-0 border border-[#D4AF37]/30 shadow-sm">
                    <Compass className="w-4 h-4 text-[#E5C158]" />
                  </div>
                  <div className="text-xs space-y-0.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#D4AF37] block font-bold">
                      Guest Scholar Mode
                    </span>
                    <p className="text-[10.5px] text-[#C4B29F] font-reading leading-snug">
                      Sample reading complimentary. Complete works lock to 1 device.
                    </p>
                  </div>
                </div>
                {onOpenAuthModal && (
                  <button
                    onClick={onOpenAuthModal}
                    className="shrink-0 px-2.5 py-1.5 rounded-lg bg-[#D4AF37] hover:bg-[#E5C158] text-[#1E0F05] text-[11px] font-mono font-bold transition-all shadow-xs"
                    title="Claim your complimentary scholar pass or restore purchases"
                  >
                    Free Pass / Sign In
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Card Catalog Filter Drawers */}
        <div className="mt-4 sm:mt-6 pt-3.5 border-t border-[#4D2816] flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs">
          <span className="text-[10px] sm:text-[11px] font-mono text-[#C5A059] uppercase tracking-wider flex items-center gap-1 mr-1 font-semibold">
            <Search className="w-3 h-3" />
            <span>Catalog:</span>
          </span>

          <button
            onClick={() => setActiveFilter('all')}
            className={`px-2.5 py-1 rounded-md font-mono text-[11px] transition-all ${
              activeFilter === 'all'
                ? 'bg-[#E5C158] text-[#1E0F05] font-bold shadow-sm'
                : 'bg-[#2E160C] text-[#D7C3B0] hover:bg-[#3D1E10] border border-[#5C321E]'
            }`}
          >
            All Stacks
          </button>

          <button
            onClick={() => setActiveFilter('monograph')}
            className={`px-2.5 py-1 rounded-md font-mono text-[11px] transition-all ${
              activeFilter === 'monograph'
                ? 'bg-[#E5C158] text-[#1E0F05] font-bold shadow-sm'
                : 'bg-[#2E160C] text-[#D7C3B0] hover:bg-[#3D1E10] border border-[#5C321E]'
            }`}
          >
            Bay I: Monograph
          </button>

          <button
            onClick={() => setActiveFilter('exam')}
            className={`px-2.5 py-1 rounded-md font-mono text-[11px] transition-all ${
              activeFilter === 'exam'
                ? 'bg-[#E5C158] text-[#1E0F05] font-bold shadow-sm'
                : 'bg-[#2E160C] text-[#D7C3B0] hover:bg-[#3D1E10] border border-[#5C321E]'
            }`}
          >
            Bay II: CBT Exam
          </button>

          <button
            onClick={() => setActiveFilter('bundle')}
            className={`px-2.5 py-1 rounded-md font-mono text-[11px] transition-all ${
              activeFilter === 'bundle'
                ? 'bg-[#E5C158] text-[#1E0F05] font-bold shadow-sm'
                : 'bg-[#2E160C] text-[#D7C3B0] hover:bg-[#3D1E10] border border-[#5C321E]'
            }`}
          >
            Bay III: Slipcase
          </button>

          <button
            onClick={() => setActiveFilter('published')}
            className={`px-2.5 py-1 rounded-md font-mono text-[11px] transition-all ${
              activeFilter === 'published'
                ? 'bg-[#E5C158] text-[#1E0F05] font-bold shadow-sm'
                : 'bg-[#2E160C] text-[#D7C3B0] hover:bg-[#3D1E10] border border-[#5C321E]'
            }`}
          >
            Faculty Bookshelf (10 Volumes)
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION 2: THE 3-BAY MAHOGANY BOOKCASE (CORE VOLUMES)     */}
      {/* ========================================================= */}
      {(activeFilter === 'all' || activeFilter === 'monograph' || activeFilter === 'exam' || activeFilter === 'bundle') && (
        <div className="rounded-2xl sm:rounded-3xl bg-[#130905] border-2 sm:border-4 border-[#3D1D10] shadow-2xl overflow-hidden relative">
          
          {/* Top Carved Mahogany Cornice with Brass Plate */}
          <div className="bg-gradient-to-r from-[#1C0D07] via-[#381B0F] to-[#1C0D07] border-b-2 sm:border-b-4 border-[#0D0502] p-3 sm:p-4 flex items-center justify-between relative shadow-md">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#A57C2B] shadow-inner" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#4A2617]" />
            </div>

            {/* Brass Center Plaque */}
            <div className="px-4 py-1 rounded bg-gradient-to-r from-[#9A7426] via-[#E2C374] to-[#9A7426] text-[#24130A] shadow-sm border border-[#F5DC9A] text-center font-serif uppercase tracking-widest text-[11px] sm:text-xs md:text-sm font-bold flex items-center gap-2">
              <Library className="w-3.5 h-3.5 text-[#3B1F0A]" />
              <span>THE ATHENEUM • UNIVERSITY ACADEMIC STACKS • BAY I – III</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#4A2617]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#A57C2B] shadow-inner" />
            </div>
          </div>

          {/* Bookcase Bays Interior Stacks: Balanced Responsive Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 divide-y-2 lg:divide-y-0 lg:divide-x-2 divide-[#241109] bg-[#180C07] bg-[radial-gradient(#29140B_1px,transparent_1px)] [background-size:16px_16px]">

            {/* ================================================= */}
            {/* BAY I: THE DOCTORAL RESEARCH MONOGRAPH (CRIMSON)   */}
            {/* ================================================= */}
            {(activeFilter === 'all' || activeFilter === 'monograph') && (
              <div className="p-4 sm:p-6 flex flex-col justify-between relative space-y-4">
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[9.5px] font-mono font-bold bg-[#E5C158] text-[#1E0F05] px-2 py-0.5 rounded shadow-xs uppercase tracking-wider">
                      {bookProduct.callNumber}
                    </span>
                    {isBookOwned ? (
                      <span className="text-[10px] font-mono text-emerald-300 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/50 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>Licensed</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-[#D4AF37] font-semibold bg-[#2E160C] px-1.5 py-0.5 rounded border border-[#5C321E]">
                        1-Device Pass
                      </span>
                    )}
                  </div>

                  {/* Physical 3D Leather-Bound Book Spine on Shelf */}
                  <div
                    onClick={() => setInspectedBook({
                      title: bookProduct.title,
                      subtitle: bookProduct.subtitle,
                      year: 2018,
                      publisher: 'Madhuvan Store, Vallabh Vidyanagar',
                      isbn: '978-81-937539-0-3',
                      type: 'authored',
                      synopsis: BOOK_SYNOPSES['978-81-937539-0-3'],
                      price: bookProduct.price,
                      callNumber: bookProduct.callNumber,
                      isCoreProduct: 'book'
                    })}
                    className="cursor-pointer group relative rounded-xl sm:rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-[#380A14] via-[#5C1423] to-[#380A14] text-[#FAF5EB] border-l-[10px] border-[#C5A059] shadow-xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_16px_32px_rgba(0,0,0,0.8)] overflow-hidden min-h-[190px] flex flex-col justify-between"
                  >
                    {/* Spine Ribs */}
                    <div className="absolute top-3 inset-x-0 h-0.5 bg-gradient-to-r from-[#A57C2B] via-[#F3D787] to-[#A57C2B] opacity-75" />
                    <div className="absolute bottom-3 inset-x-0 h-0.5 bg-gradient-to-r from-[#A57C2B] via-[#F3D787] to-[#A57C2B] opacity-75" />

                    <div className="space-y-1.5 relative z-10">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono uppercase tracking-widest text-[#E5C158] font-bold block">
                          Doctoral Research Monograph
                        </span>
                        <span className="text-[9px] font-mono text-[#D4AF37] px-1.5 py-0.2 rounded bg-black/40 border border-[#D4AF37]/30 flex items-center gap-1 group-hover:bg-[#E5C158] group-hover:text-[#1E0F05] transition-colors">
                          <Eye className="w-2.5 h-2.5" />
                          <span>Inspect</span>
                        </span>
                      </div>

                      <h3 className="font-serif text-lg sm:text-xl font-normal text-white leading-snug tracking-tight line-clamp-2">
                        {bookProduct.title}
                      </h3>

                      <p className="text-[11px] font-reading text-[#E6C2BF] font-light italic leading-relaxed line-clamp-2">
                        A quantitative & qualitative investigation into Dr. Kalam’s educational epistemology, creative inquiry, and moral pedagogy.
                      </p>
                    </div>

                    <div className="pt-2 border-t border-white/20 flex items-center justify-between text-[10px] font-mono text-[#F4DDD8] relative z-10">
                      <span className="font-semibold truncate">Dr. R. S. Dodiya</span>
                      <span className="text-[#E5C158]">ISBN 978-81-937539-0-3</span>
                    </div>

                    {isBookOwned && (
                      <div className="absolute -bottom-0.5 right-4 px-2 py-0.5 bg-emerald-600 text-white font-mono text-[8.5px] font-bold rounded-t shadow-md flex items-center gap-1">
                        <Bookmark className="w-2.5 h-2.5" />
                        <span>Issued Copy</span>
                      </div>
                    )}
                  </div>

                  {/* Horizontal Wooden Shelf Ledge */}
                  <div className="h-5 sm:h-6 bg-gradient-to-r from-[#2B160E] via-[#4D2719] to-[#2B160E] border-t-2 border-[#6E3C27] border-b border-[#140804] shadow-[0_6px_12px_rgba(0,0,0,0.7)] flex items-center justify-between px-2.5">
                    <span className="text-[8px] sm:text-[8.5px] font-mono font-bold text-[#D4AF37] tracking-wider uppercase truncate">
                      BAY I • SHELF 181.4 • DOCTORAL TREATISES
                    </span>
                    <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-[#FFF9C4] text-[#423800] font-bold border border-[#E0D88B] shrink-0">
                      ₹{bookProduct.price}
                    </span>
                  </div>

                  {/* Key Features (Concise) */}
                  <div className="space-y-1.5 pt-1 text-[11px] font-sans text-[#D7C3B0]">
                    <div className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37] shrink-0 mt-0.5" />
                      <span className="leading-snug">Full 4-Chapter Scholarly Edition with Footnotes & Citations</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37] shrink-0 mt-0.5" />
                      <span className="leading-snug">Protected In-Browser Reader with 4 themes & watermarking</span>
                    </div>
                  </div>
                </div>

                {/* Actions & Pricing */}
                <div className="pt-3 border-t border-[#3D1E10] flex items-center justify-between gap-2">
                  <div>
                    {isBookOwned ? (
                      <span className="font-serif text-sm font-bold text-emerald-400 block">
                        Licensed Copy
                      </span>
                    ) : (
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-serif text-xl font-bold text-[#E5C158]">₹{bookProduct.price}</span>
                        <span className="text-[10px] font-mono line-through text-[#8C7A6B]">₹{bookProduct.originalPrice}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isBookOwned || isComplimentaryOwned ? (
                      <button
                        onClick={() => {
                          setIsReaderSample(false);
                          setIsReaderOpen(true);
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-sans font-medium transition-all shadow-sm flex items-center gap-1.5 min-h-[36px]"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-emerald-200" />
                        <span>Read Book</span>
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            if (onOpenAuthModal) {
                              onOpenAuthModal();
                            } else {
                              setIsReaderSample(true);
                              setIsReaderOpen(true);
                            }
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-[#2E160C] hover:bg-[#3D1E10] text-[#EBDBC8] border border-[#5C321E] text-[11px] font-sans font-medium transition-all min-h-[36px]"
                        >
                          Free Pass
                        </button>

                        <button
                          onClick={() => handleOpenCheckout(bookProduct)}
                          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#8A1C2E] to-[#A32439] hover:from-[#A32439] hover:to-[#BD2C44] text-white text-[11px] font-sans font-medium transition-all shadow-sm flex items-center gap-1 min-h-[36px]"
                        >
                          <Lock className="w-3 h-3" />
                          <span>Acquire (₹{bookProduct.price})</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* ================================================= */}
            {/* BAY II: UGC-NET & GSET CBT SIMULATOR (NAVY BUCKRAM) */}
            {/* ================================================= */}
            {(activeFilter === 'all' || activeFilter === 'exam') && (
              <div className="p-4 sm:p-6 flex flex-col justify-between relative space-y-4">
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[9.5px] font-mono font-bold bg-[#48CAE4] text-[#0C172B] px-2 py-0.5 rounded shadow-xs uppercase tracking-wider">
                      {examProduct.callNumber}
                    </span>
                    {isExamOwned ? (
                      <span className="text-[10px] font-mono text-emerald-300 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/50 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>Enrolled</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-[#48CAE4] font-semibold bg-[#0F2036] px-1.5 py-0.5 rounded border border-[#1E3B63]">
                        CBT Engine
                      </span>
                    )}
                  </div>

                  {/* Physical 3D Buckram Exam Ledger */}
                  <div
                    onClick={() => setInspectedBook({
                      title: examProduct.title,
                      subtitle: examProduct.subtitle,
                      year: 2026,
                      publisher: 'Madhuvan Store & ELEF Research Portal',
                      isbn: '978-93-90256-27-3',
                      type: 'cbt',
                      synopsis: "An interactive, timed computer-based test simulator featuring 25 curated high-yield questions covering British literature, post-method pedagogy, NEP 2020, and research methodology with Dr. Dodiya's comprehensive faculty explanations and instant percentile grading.",
                      price: examProduct.price,
                      callNumber: examProduct.callNumber,
                      isCoreProduct: 'exam'
                    })}
                    className="cursor-pointer group relative rounded-xl sm:rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-[#0C172B] via-[#162C4E] to-[#0C172B] text-[#E0FBFC] border-l-[10px] border-[#48CAE4] shadow-xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_16px_32px_rgba(0,0,0,0.8)] overflow-hidden min-h-[190px] flex flex-col justify-between"
                  >
                    {/* Spine Ribs */}
                    <div className="absolute top-3 inset-x-0 h-0.5 bg-gradient-to-r from-[#205480] via-[#48CAE4] to-[#205480] opacity-75" />
                    <div className="absolute bottom-3 inset-x-0 h-0.5 bg-gradient-to-r from-[#205480] via-[#48CAE4] to-[#205480] opacity-75" />

                    <div className="space-y-1.5 relative z-10">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono uppercase tracking-widest text-[#48CAE4] font-bold block">
                          CBT Examination Portal
                        </span>
                        <span className="text-[9px] font-mono text-[#BEE1E6] px-1.5 py-0.2 rounded bg-black/40 border border-[#48CAE4]/30 flex items-center gap-1 group-hover:bg-[#48CAE4] group-hover:text-[#0C172B] transition-colors">
                          <Eye className="w-2.5 h-2.5" />
                          <span>Inspect</span>
                        </span>
                      </div>

                      <h3 className="font-serif text-lg sm:text-xl font-normal text-white leading-snug tracking-tight line-clamp-2">
                        {examProduct.title}
                      </h3>

                      <p className="text-[11px] font-reading text-[#BEE1E6] font-light italic leading-relaxed line-clamp-2">
                        25 curated high-yield questions covering British literature, post-method pedagogy, NEP 2020, and research methodology.
                      </p>
                    </div>

                    <div className="pt-2 border-t border-white/20 flex items-center justify-between text-[10px] font-mono text-[#BEE1E6] relative z-10">
                      <span>Timed 60-Min NTA Clock</span>
                      <span className="text-[#48CAE4]">Paper II & I</span>
                    </div>

                    {isExamOwned && (
                      <div className="absolute -bottom-0.5 right-4 px-2 py-0.5 bg-amber-600 text-white font-mono text-[8.5px] font-bold rounded-t shadow-md flex items-center gap-1">
                        <Award className="w-2.5 h-2.5" />
                        <span>Enrolled Candidate</span>
                      </div>
                    )}
                  </div>

                  {/* Horizontal Wooden Shelf Ledge */}
                  <div className="h-5 sm:h-6 bg-gradient-to-r from-[#2B160E] via-[#4D2719] to-[#2B160E] border-t-2 border-[#6E3C27] border-b border-[#140804] shadow-[0_6px_12px_rgba(0,0,0,0.7)] flex items-center justify-between px-2.5">
                    <span className="text-[8px] sm:text-[8.5px] font-mono font-bold text-[#D4AF37] tracking-wider uppercase truncate">
                      BAY II • SHELF 820.7 • CBT EXAM ARCHIVE
                    </span>
                    <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-[#FFF9C4] text-[#423800] font-bold border border-[#E0D88B] shrink-0">
                      ₹{examProduct.price}
                    </span>
                  </div>

                  {/* Key Features (Concise) */}
                  <div className="space-y-1.5 pt-1 text-[11px] font-sans text-[#D7C3B0]">
                    <div className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#48CAE4] shrink-0 mt-0.5" />
                      <span className="leading-snug">25 High-Yield Questions with Dr. Dodiya’s full faculty rationale</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#48CAE4] shrink-0 mt-0.5" />
                      <span className="leading-snug">NTA-Style Question Palette & Instant Percentile Score Diagnostics</span>
                    </div>
                  </div>
                </div>

                {/* Actions & Pricing */}
                <div className="pt-3 border-t border-[#3D1E10] flex items-center justify-between gap-2">
                  <div>
                    {isExamOwned ? (
                      <span className="font-serif text-sm font-bold text-emerald-400 block">
                        Candidate Enrolled
                      </span>
                    ) : (
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-serif text-xl font-bold text-[#48CAE4]">₹{examProduct.price}</span>
                        <span className="text-[10px] font-mono line-through text-[#8C7A6B]">₹{examProduct.originalPrice}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isExamOwned ? (
                      <button
                        onClick={() => {
                          setIsExamSample(false);
                          setIsExamOpen(true);
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-sans font-medium transition-all shadow-sm flex items-center gap-1.5 min-h-[36px]"
                      >
                        <Award className="w-3.5 h-3.5 text-amber-200" />
                        <span>Launch CBT</span>
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setIsExamSample(true);
                            setIsExamOpen(true);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-[#0F2036] hover:bg-[#162D4A] text-[#E0FBFC] border border-[#1E3B63] text-[11px] font-sans font-medium transition-all min-h-[36px]"
                        >
                          Sample 3 Qs
                        </button>

                        <button
                          onClick={() => handleOpenCheckout(examProduct)}
                          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#1B4965] to-[#2B6CB0] hover:from-[#2B6CB0] hover:to-[#3182CE] text-white text-[11px] font-sans font-medium transition-all shadow-sm flex items-center gap-1 min-h-[36px]"
                        >
                          <Award className="w-3 h-3" />
                          <span>Enroll (₹{examProduct.price})</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* ================================================= */}
            {/* BAY III: TWIN-VOLUME SLIPCASE BUNDLE (BEST VALUE)  */}
            {/* ================================================= */}
            {(activeFilter === 'all' || activeFilter === 'bundle') && (
              <div className="p-4 sm:p-6 flex flex-col justify-between relative space-y-4">
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[9.5px] font-mono font-bold bg-[#E5C158] text-[#1E0F05] px-2 py-0.5 rounded shadow-xs uppercase tracking-wider">
                      {bundleProduct.callNumber}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-300 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/50">
                      Save ₹99
                    </span>
                  </div>

                  {/* Physical Twin-Volume Slipcase Visual */}
                  <div
                    onClick={() => setInspectedBook({
                      title: bundleProduct.title,
                      subtitle: bundleProduct.subtitle,
                      year: 2026,
                      publisher: 'Madhuvan & ELEF Joint University Accession',
                      isbn: 'HMP-SCHOLAR-BUNDLE-2026',
                      type: 'authored',
                      synopsis: "The ultimate academic package: Grants instantaneous, authorized single-device access to both Dr. Dodiya's complete doctoral monograph in the protected cloud reader and the 25-question UGC-NET/GSET CBT examination portal with official academic tax invoice.",
                      price: bundleProduct.price,
                      callNumber: bundleProduct.callNumber,
                      isCoreProduct: 'bundle'
                    })}
                    className="cursor-pointer group relative rounded-xl sm:rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-[#29170E] via-[#3D2115] to-[#29170E] text-[#FAF5EB] border-2 border-[#D4AF37] shadow-xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_16px_32px_rgba(0,0,0,0.8)] overflow-hidden min-h-[190px] flex flex-col justify-between"
                  >
                    <div className="absolute -top-1 -right-1 px-2.5 py-0.5 bg-gradient-to-r from-[#D4AF37] to-[#F3D787] text-[#24130A] font-mono text-[8px] font-extrabold uppercase tracking-wider shadow-sm rounded-bl">
                      Twin Slipcase
                    </div>

                    <div className="space-y-1.5 relative z-10">
                      <span className="text-[9px] font-mono uppercase tracking-widest text-[#E5C158] font-bold block">
                        Master Scholar Pack
                      </span>

                      {/* Side-by-side miniature book spines inside the slipcase */}
                      <div className="flex gap-1.5 py-1">
                        <div className="flex-1 p-1.5 rounded bg-[#5C1423] border-l-2 border-[#C5A059] shadow-inner text-center">
                          <span className="text-[7.5px] font-mono uppercase text-[#FAF5EB] block font-bold truncate">
                            Monograph
                          </span>
                          <span className="text-[6.5px] font-mono text-[#E5C158] block">Dr. Kalam</span>
                        </div>
                        <div className="flex-1 p-1.5 rounded bg-[#162C4E] border-l-2 border-[#48CAE4] shadow-inner text-center">
                          <span className="text-[7.5px] font-mono uppercase text-[#E0FBFC] block font-bold truncate">
                            CBT Exam
                          </span>
                          <span className="text-[6.5px] font-mono text-[#48CAE4] block">25 Qs Portal</span>
                        </div>
                      </div>

                      <h3 className="font-serif text-lg sm:text-xl font-normal text-white leading-snug tracking-tight line-clamp-2">
                        {bundleProduct.title}
                      </h3>
                    </div>

                    <div className="pt-2 border-t border-white/20 flex items-center justify-between text-[10px] font-mono text-[#E5C158] relative z-10">
                      <span>Monograph Reader</span>
                      <span>+ CBT Exam Simulator</span>
                    </div>
                  </div>

                  {/* Horizontal Wooden Shelf Ledge */}
                  <div className="h-5 sm:h-6 bg-gradient-to-r from-[#2B160E] via-[#4D2719] to-[#2B160E] border-t-2 border-[#6E3C27] border-b border-[#140804] shadow-[0_6px_12px_rgba(0,0,0,0.7)] flex items-center justify-between px-2.5">
                    <span className="text-[8px] sm:text-[8.5px] font-mono font-bold text-[#D4AF37] tracking-wider uppercase truncate">
                      BAY III • SPECIAL ACCESSION • COLLECTOR SET
                    </span>
                    <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-[#FFF9C4] text-[#423800] font-bold border border-[#E0D88B] shrink-0">
                      ₹{bundleProduct.price}
                    </span>
                  </div>

                  {/* Key Features (Concise) */}
                  <div className="space-y-1.5 pt-1 text-[11px] font-sans text-[#D7C3B0]">
                    <div className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#E5C158] shrink-0 mt-0.5" />
                      <span className="leading-snug">Both Monograph Reader and 25-Question CBT Exam Portal included</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#E5C158] shrink-0 mt-0.5" />
                      <span className="leading-snug">Official academic GST tax invoice for institutional reimbursement</span>
                    </div>
                  </div>
                </div>

                {/* Actions & Pricing */}
                <div className="pt-3 border-t border-[#3D1E10] flex items-center justify-between gap-2">
                  <div>
                    {isBookOwned && isExamOwned ? (
                      <span className="font-serif text-sm font-bold text-emerald-400 block">
                        Full Pack Acquired
                      </span>
                    ) : (
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-serif text-xl font-bold text-[#E5C158]">₹{bundleProduct.price}</span>
                        <span className="text-[10px] font-mono line-through text-[#8C7A6B]">₹{bundleProduct.originalPrice}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isBookOwned && isExamOwned ? (
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setIsReaderSample(false);
                            setIsReaderOpen(true);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white text-[11px] font-medium min-h-[36px]"
                        >
                          Book
                        </button>
                        <button
                          onClick={() => {
                            setIsExamSample(false);
                            setIsExamOpen(true);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-claret hover:bg-claret-light text-white text-[11px] font-medium min-h-[36px]"
                        >
                          Exam
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleOpenCheckout(bundleProduct)}
                        className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#F3D787] hover:from-[#F3D787] hover:to-[#D4AF37] text-[#24130A] font-bold text-[11px] font-sans transition-all shadow-sm flex items-center gap-1 min-h-[36px]"
                      >
                        <span>Acquire Bundle (₹{bundleProduct.price})</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

              </div>
            )}

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 3: LOWER MAHOGANY SHELF: 10 PUBLISHED VOLUMES     */}
      {/* ========================================================= */}
      {(activeFilter === 'all' || activeFilter === 'published') && (
        <div className="rounded-2xl sm:rounded-3xl bg-[#140A06] border-2 sm:border-4 border-[#3D1D10] shadow-2xl overflow-hidden relative space-y-3">
          
          {/* Wooden Shelf Header with Brass Accession Plate */}
          <div className="bg-gradient-to-r from-[#1C0D07] via-[#351A0E] to-[#1C0D07] border-b-2 border-[#542B17] px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <BookMarked className="w-4 h-4 text-[#E5C158]" />
              <div>
                <h3 className="font-serif text-base sm:text-lg text-white font-normal">
                  Faculty Monograph Archives & Published Treatises
                </h3>
                <span className="text-[10px] font-mono text-[#D7C3B0] block">
                  Dr. Rajnikant S. Dodiya's 10 Published Volumes • Sardar Patel University & State Publishers
                </span>
              </div>
            </div>

            <div className="px-2.5 py-0.5 rounded bg-[#2E160C] border border-[#5C321E] text-[9.5px] font-mono text-[#D4AF37] shrink-0 self-start sm:self-auto">
              CLICK ANY TOME TO PULL OFF SHELF
            </div>
          </div>

          {/* Densely Packed Bookshelf: Fully Responsive Across Screen Widths */}
          <div className="p-3 sm:p-5">
            <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2 sm:gap-2.5 pb-2">
              {BOOKS.map((book, index) => {
                const palette = SPINE_PALETTES[index % SPINE_PALETTES.length];
                const isAuthoredMonograph = book.isbn === '978-81-937539-0-3';
                const isUgcNetBook = book.isbn === '978-93-90256-27-3';

                return (
                  <div
                    key={book.isbn}
                    onClick={() => {
                      if (isAuthoredMonograph) {
                        setInspectedBook({
                          title: bookProduct.title,
                          subtitle: bookProduct.subtitle,
                          year: book.year,
                          publisher: book.publisher,
                          isbn: book.isbn,
                          type: book.type,
                          synopsis: BOOK_SYNOPSES[book.isbn] || bookProduct.subtitle,
                          price: bookProduct.price,
                          callNumber: bookProduct.callNumber,
                          isCoreProduct: 'book'
                        });
                      } else if (isUgcNetBook) {
                        setInspectedBook({
                          title: examProduct.title,
                          subtitle: examProduct.subtitle,
                          year: book.year,
                          publisher: book.publisher,
                          isbn: book.isbn,
                          type: 'cbt',
                          synopsis: BOOK_SYNOPSES[book.isbn] || examProduct.subtitle,
                          price: examProduct.price,
                          callNumber: examProduct.callNumber,
                          isCoreProduct: 'exam'
                        });
                      } else {
                        setInspectedBook({
                          title: book.title,
                          subtitle: book.details || `${book.type.toUpperCase()} VOLUME`,
                          year: book.year,
                          publisher: book.publisher,
                          isbn: book.isbn,
                          type: book.type,
                          synopsis: BOOK_SYNOPSES[book.isbn] || "An authentic faculty publication authored/edited by Dr. Rajnikant S. Dodiya in teacher education, English literature, and techno-pedagogy."
                        });
                      }
                    }}
                    className="cursor-pointer group h-36 sm:h-44 lg:h-48 flex flex-col justify-between rounded-t-md sm:rounded-t-lg bg-gradient-to-r shadow-xl relative transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_16px_30px_rgba(0,0,0,0.85)] border-t border-r border-l p-1.5 sm:p-2"
                    style={{
                      backgroundImage: `linear-gradient(to right, ${palette.bg})`,
                      borderColor: palette.border
                    }}
                  >
                    {/* Top Spine Ribs & Year */}
                    <div className="space-y-1 border-b border-white/20 pb-1">
                      <div className="h-0.5 bg-gradient-to-r from-transparent via-[#F3D787] to-transparent opacity-80" />
                      <span className="text-[7.5px] sm:text-[8px] font-mono text-[#FAF5EB]/90 uppercase block tracking-widest text-center font-bold">
                        {book.year}
                      </span>
                    </div>

                    {/* Book Title Centered on Spine */}
                    <div className="flex-1 flex items-center justify-center px-1 overflow-hidden">
                      <div
                        className="font-serif text-[10px] sm:text-[11px] font-medium tracking-tight uppercase text-center line-clamp-3 leading-snug group-hover:scale-105 transition-transform"
                        style={{ color: palette.text }}
                      >
                        {book.title}
                      </div>
                    </div>

                    {/* Bottom Details & Author */}
                    <div className="border-t border-white/20 pt-1 text-center space-y-0.5">
                      <span className="text-[7px] sm:text-[7.5px] font-mono uppercase tracking-tighter text-[#E5C158] block font-bold truncate">
                        {book.type}
                      </span>
                      <span className="text-[6.5px] sm:text-[7px] font-mono text-[#D7C3B0] block truncate">
                        Dr. Dodiya
                      </span>
                    </div>

                    {/* Yellow Accession Call Slip hanging on shelf edge */}
                    <div className="absolute -bottom-4 inset-x-1 flex justify-center z-10 pointer-events-none">
                      <div className="px-1 py-0.2 rounded-b text-[7px] sm:text-[7.5px] font-mono font-bold text-[#423800] bg-[#FFF9C4] border border-[#E0D88B] shadow-xs truncate max-w-full">
                        {palette.tag}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Heavy Wooden Shelf Ledge Beneath All 10 Volumes */}
            <div className="mt-4 h-6 sm:h-7 bg-gradient-to-r from-[#2B160E] via-[#4D2719] to-[#2B160E] border-t-2 border-[#6E3C27] border-b border-[#140804] shadow-[0_10px_20px_rgba(0,0,0,0.8)] flex items-center justify-between px-3">
              <span className="text-[8.5px] sm:text-[9.5px] font-mono font-bold text-[#D4AF37] uppercase tracking-wider truncate">
                LOWER REPOSITORIES • CLASSIFICATION 2:51 • COMPLETE ACADEMIC OEUVRE
              </span>
              <span className="text-[8.5px] sm:text-[9.5px] font-mono text-[#C4B29F] shrink-0">
                10 Volumes
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 4: THE OAK INSPECTION PLINTH MODAL (PULL OFF SHELF)*/}
      {/* ========================================================= */}
      {inspectedBook && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
          <div
            className="w-[94vw] max-w-2xl max-h-[88vh] rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#1C0F08] via-[#2B170D] to-[#140703] border-2 sm:border-4 border-[#C5A059] shadow-2xl text-white relative flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ambient Reading Lamp Glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(243,215,135,0.18),transparent_70%)] pointer-events-none" />
            
            {/* Header & Close Button */}
            <div className="p-4 sm:p-5 border-b border-[#5C321E] flex items-center justify-between relative z-10 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#521422] text-[#E5C158] flex items-center justify-center border border-[#D4AF37]/40 shadow-xs">
                  <BookOpen className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-[9px] font-mono uppercase tracking-widest text-[#E5C158] font-bold block">
                    Oak Reading Plinth • Tome Inspection
                  </span>
                  <h3 className="font-serif text-base sm:text-lg text-[#FFFDF9] font-normal line-clamp-1">
                    {inspectedBook.title}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setInspectedBook(null)}
                className="w-8 h-8 rounded-full bg-[#3D2012] hover:bg-[#542B17] text-[#D7C3B0] hover:text-white flex items-center justify-center transition-all border border-[#5C321E]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="p-4 sm:p-6 space-y-4 relative z-10 overflow-y-auto flex-1">
              
              {/* Publication Metadata Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
                <div className="p-2 sm:p-2.5 rounded-lg bg-[#261309] border border-[#5C321E]">
                  <span className="text-[9px] font-mono text-[#A8988A] block uppercase">Year</span>
                  <span className="font-serif text-sm font-bold text-[#E5C158]">{inspectedBook.year}</span>
                </div>
                <div className="p-2 sm:p-2.5 rounded-lg bg-[#261309] border border-[#5C321E]">
                  <span className="text-[9px] font-mono text-[#A8988A] block uppercase">Type</span>
                  <span className="font-serif text-sm font-bold text-white capitalize truncate block">{inspectedBook.type}</span>
                </div>
                <div className="p-2 sm:p-2.5 rounded-lg bg-[#261309] border border-[#5C321E]">
                  <span className="text-[9px] font-mono text-[#A8988A] block uppercase">ISBN</span>
                  <span className="font-mono text-[10px] font-semibold text-[#D7C3B0] truncate block">{inspectedBook.isbn}</span>
                </div>
                <div className="p-2 sm:p-2.5 rounded-lg bg-[#261309] border border-[#5C321E]">
                  <span className="text-[9px] font-mono text-[#A8988A] block uppercase">Call Class</span>
                  <span className="font-mono text-[10px] font-semibold text-emerald-400">Dewey / SPU</span>
                </div>
              </div>

              {/* Scholarly Abstract / Synopsis */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#E5C158] font-bold block flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  <span>Scholarly Synopsis & Research Scope:</span>
                </span>
                <p className="text-xs sm:text-sm font-reading text-[#EBDBC8] font-light leading-relaxed p-3 sm:p-3.5 rounded-xl bg-[#200E06] border border-[#4A2413]">
                  {inspectedBook.synopsis}
                </p>
              </div>

              {/* Publisher Details */}
              <div className="p-3 rounded-lg bg-[#261309] border border-[#5C321E] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-sans">
                <div>
                  <span className="text-[9px] font-mono text-[#A8988A] block uppercase">Publisher / Repository</span>
                  <span className="font-medium text-white text-[11px]">{inspectedBook.publisher}</span>
                </div>
                <div>
                  <span className="text-[9px] font-mono text-[#A8988A] block uppercase">Author / Faculty</span>
                  <span className="font-medium text-[#E5C158] text-[11px]">Dr. Rajnikant S. Dodiya, Ph.D.</span>
                </div>
              </div>

              {/* 1-Click APA 7th Citation Card */}
              <div className="p-3 rounded-xl bg-[#170904] border border-[#421F10] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[9.5px] font-mono text-[#A8988A] uppercase tracking-wider flex items-center gap-1">
                    <Quote className="w-2.5 h-2.5 text-[#E5C158]" />
                    <span>APA 7th Citation</span>
                  </span>
                  <button
                    onClick={() => handleCopyCitation(`Dodiya, R. S. (${inspectedBook.year}). ${inspectedBook.title}. ${inspectedBook.publisher}. ISBN: ${inspectedBook.isbn}.`)}
                    className="text-[9.5px] font-mono text-[#E5C158] hover:text-[#F3D787] inline-flex items-center gap-1 font-semibold"
                  >
                    {copiedCitation ? (
                      <>
                        <Check className="w-2.5 h-2.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-2.5 h-2.5" />
                        <span>Copy Citation</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[11px] font-mono text-[#C4B29F] bg-black/40 p-2 rounded border border-white/5 break-all select-all">
                  Dodiya, R. S. ({inspectedBook.year}). <em>{inspectedBook.title}</em>. {inspectedBook.publisher}. ISBN: {inspectedBook.isbn}.
                </p>
              </div>

            </div>

            {/* Modal Bottom Actions */}
            <div className="p-4 sm:p-5 border-t border-[#5C321E] bg-[#160B06] flex items-center justify-between gap-2 relative z-10 shrink-0">
              <span className="text-[10px] font-mono text-[#A8988A] hidden sm:inline">
                Single-Device Academic License
              </span>

              <div className="flex items-center gap-1.5 ml-auto">
                {inspectedBook.isCoreProduct === 'book' ? (
                  <>
                    <button
                      onClick={() => {
                        setInspectedBook(null);
                        setIsReaderSample(true);
                        setIsReaderOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#2E160C] hover:bg-[#3D1E10] text-[#EBDBC8] border border-[#5C321E] text-xs font-sans font-medium transition-all"
                    >
                      Sample Excerpt
                    </button>
                    <button
                      onClick={() => {
                        setInspectedBook(null);
                        handleOpenCheckout(bookProduct);
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#8A1C2E] to-[#A32439] hover:from-[#A32439] hover:to-[#BD2C44] text-white text-xs font-sans font-medium transition-all shadow-sm flex items-center gap-1"
                    >
                      <Lock className="w-3 h-3" />
                      <span>Acquire (₹{bookProduct.price})</span>
                    </button>
                  </>
                ) : inspectedBook.isCoreProduct === 'exam' ? (
                  <>
                    <button
                      onClick={() => {
                        setInspectedBook(null);
                        setIsExamSample(true);
                        setIsExamOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#0F2036] hover:bg-[#162D4A] text-[#E0FBFC] border border-[#1E3B63] text-xs font-sans font-medium transition-all"
                    >
                      Sample 3 Qs
                    </button>
                    <button
                      onClick={() => {
                        setInspectedBook(null);
                        handleOpenCheckout(examProduct);
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#1B4965] to-[#2B6CB0] hover:from-[#2B6CB0] hover:to-[#3182CE] text-white text-xs font-sans font-medium transition-all shadow-sm flex items-center gap-1"
                    >
                      <Award className="w-3 h-3" />
                      <span>Enroll (₹{examProduct.price})</span>
                    </button>
                  </>
                ) : inspectedBook.isCoreProduct === 'bundle' ? (
                  <button
                    onClick={() => {
                      setInspectedBook(null);
                      handleOpenCheckout(bundleProduct);
                    }}
                    className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#F3D787] text-[#24130A] font-bold text-xs font-sans transition-all shadow-sm flex items-center gap-1"
                  >
                    <span>Acquire Bundle (₹{bundleProduct.price})</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => setInspectedBook(null)}
                    className="px-4 py-1.5 rounded-lg bg-[#3D2012] hover:bg-[#542B17] text-white text-xs font-sans font-medium transition-all border border-[#5C321E]"
                  >
                    Return Tome to Shelf
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 5: MODALS (CIRCULATION DESK, READER, CBT PORTAL)  */}
      {/* ========================================================= */}
      {isCirculationOpen && (
        <Suspense fallback={null}>
          <CirculationDeskModal
            isOpen={isCirculationOpen}
            onClose={() => setIsCirculationOpen(false)}
            selectedProduct={selectedProduct}
            onPurchaseSuccess={handlePurchaseSuccess}
          />
        </Suspense>
      )}

      {isReaderOpen && (
        <Suspense fallback={null}>
          <ProtectedReaderModal
            isOpen={isReaderOpen}
            onClose={() => setIsReaderOpen(false)}
            studentName={studentSession.name || 'Sample Scholar'}
            studentMobile={studentSession.mobile || '9876543210'}
            orderId={studentSession.orderId || 'HMP-DEMO-01'}
            isUnlocked={!isReaderSample && (isBookOwned || isComplimentaryOwned)}
            onUnlockRequest={() => handleOpenCheckout(bookProduct)}
          />
        </Suspense>
      )}

      {isExamOpen && (
        <Suspense fallback={null}>
          <ExamPortal
            isOpen={isExamOpen}
            onClose={() => setIsExamOpen(false)}
            studentName={studentSession.name || 'Sample Scholar'}
            orderId={studentSession.orderId || 'HMP-DEMO-01'}
            isUnlocked={!isExamSample && isExamOwned}
            onUnlockRequest={() => handleOpenCheckout(examProduct)}
          />
        </Suspense>
      )}

    </div>
  );
};
