import React, { useState } from 'react';
import { BOOKS, Book } from '../data/professorData';
import { BookOpen, X, ExternalLink, Bookmark, Award, Layers, Sparkles } from 'lucide-react';

interface VirtualBookshelfProps {
  onNavigate?: (tab: 'home' | 'research' | 'salon' | 'store' | 'leadership' | 'contact' | 'about') => void;
}

export const VirtualBookshelf: React.FC<VirtualBookshelfProps> = ({ onNavigate }) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'authored' | 'edited'>('all');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  const filteredBooks = BOOKS.filter(b => {
    if (activeFilter === 'authored') return b.type === 'authored';
    if (activeFilter === 'edited') return b.type === 'edited';
    return true;
  });

  // Color schemes for book spine visuals to create authentic shelf diversity
  const spinePalettes = [
    { bg: 'bg-[#162A45]', text: 'text-[#FAF9F5]', accent: 'border-[#C59B27]' },
    { bg: 'bg-[#1C2541]', text: 'text-[#E0FBFC]', accent: 'border-[#48CAE4]' },
    { bg: 'bg-[#2B3A42]', text: 'text-[#EFEFEF]', accent: 'border-[#E0A96D]' },
    { bg: 'bg-[#4A154B]', text: 'text-[#F9F5F8]', accent: 'border-[#F4C542]' },
    { bg: 'bg-[#2E4057]', text: 'text-[#F4F4F9]', accent: 'border-[#F6D55C]' },
    { bg: 'bg-[#1E3F35]', text: 'text-[#F4F9F5]', accent: 'border-[#C59B27]' },
  ];

  return (
    <div className="space-y-6">
      
      {/* Bookshelf Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-3 border-b border-deckle">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-claret font-semibold">Curated Publications</span>
          <h2 className="font-serif text-2xl sm:text-3xl text-ink font-normal mt-0.5">The Virtual Bookshelf</h2>
          <p className="text-xs sm:text-sm text-ink-muted font-reading font-light mt-1">
            Authored monographs, edited scholarship volumes, and curriculum treatises by Dr. Rajnikant S. Dodiya.
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-parchment-warm border border-deckle text-xs">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-sans transition-all ${
              activeFilter === 'all'
                ? 'bg-claret text-white shadow-xs font-medium'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            All Volumes ({BOOKS.length})
          </button>
          <button
            onClick={() => setActiveFilter('authored')}
            className={`px-3 py-1.5 rounded-lg font-sans transition-all ${
              activeFilter === 'authored'
                ? 'bg-claret text-white shadow-xs font-medium'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            Authored (6)
          </button>
          <button
            onClick={() => setActiveFilter('edited')}
            className={`px-3 py-1.5 rounded-lg font-sans transition-all ${
              activeFilter === 'edited'
                ? 'bg-claret text-white shadow-xs font-medium'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            Edited (4)
          </button>
        </div>
      </div>

      {/* Virtual Bookshelf Grid with 3D Book Spines */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredBooks.map((book, idx) => {
          const palette = spinePalettes[idx % spinePalettes.length];
          const isEdited = book.type === 'edited';

          return (
            <div
              key={idx}
              onClick={() => setSelectedBook(book)}
              className="folio-card rounded-2xl p-5 cursor-pointer group flex flex-col justify-between relative overflow-hidden bg-white hover:border-claret/50"
            >
              {/* Top Accent Strip */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded border uppercase tracking-wide ${
                    isEdited
                      ? 'bg-amber-50 text-amber-900 border-amber-300'
                      : 'bg-claret-soft text-claret border-claret/20'
                  }`}>
                    {book.year} • {isEdited ? 'Edited Volume' : 'Authored'}
                  </span>
                  <span className="text-[11px] font-mono text-ink-faint group-hover:text-claret transition-colors">
                    Click to Open &rarr;
                  </span>
                </div>

                {/* Simulated Book Cover preview */}
                <div className={`p-4 rounded-xl ${palette.bg} ${palette.text} border-l-4 ${palette.accent} shadow-inner min-h-[120px] flex flex-col justify-between book-spine relative overflow-hidden`}>
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono tracking-widest uppercase opacity-75 block">HMPIETR Scholarship</span>
                    <h4 className="font-serif text-sm sm:text-base font-normal leading-snug tracking-tight text-white line-clamp-3">
                      {book.title}
                    </h4>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-white/15 text-[10px] font-mono opacity-80">
                    <span>Dr. R. S. Dodiya</span>
                    <span>{book.year}</span>
                  </div>
                </div>

                <div className="pt-1 text-xs space-y-1">
                  <p className="text-ink-muted font-reading font-light line-clamp-2">
                    Published by <strong className="font-medium text-ink">{book.publisher}</strong>
                  </p>
                  <p className="text-ink-faint font-mono text-[10px]">
                    ISBN: {book.isbn}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-deckle/60 mt-3 flex items-center justify-between text-xs text-claret font-medium">
                <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Reading Room Details</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reading Room Modal Drawer */}
      {selectedBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-pure/60 backdrop-blur-sm animate-fade-in">
          <div className="folio-card bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-book-xl border border-deckle max-h-[90vh] overflow-y-auto space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-deckle">
              <div className="space-y-1">
                <span className={`text-xs font-mono font-bold uppercase px-2.5 py-0.5 rounded border inline-block ${
                  selectedBook.type === 'edited' ? 'bg-amber-50 text-amber-900 border-amber-300' : 'bg-claret-soft text-claret border-claret/20'
                }`}>
                  {selectedBook.year} • {selectedBook.type === 'edited' ? 'Edited Volume' : 'Authored Book'}
                </span>
                <h3 className="font-serif text-xl sm:text-2xl text-ink font-normal leading-snug">
                  {selectedBook.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedBook(null)}
                aria-label="Close reading room"
                className="p-2 rounded-xl bg-parchment-warm text-ink-muted hover:text-claret transition-colors shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Bibliographic Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans p-4 rounded-2xl bg-parchment-warm/70 border border-deckle">
              <div>
                <span className="text-ink-faint font-mono block">Publisher:</span>
                <span className="font-medium text-ink mt-0.5 block">{selectedBook.publisher}</span>
              </div>
              <div>
                <span className="text-ink-faint font-mono block">Standard Identification:</span>
                <span className="font-mono text-ink mt-0.5 block">ISBN {selectedBook.isbn}</span>
              </div>
              <div>
                <span className="text-ink-faint font-mono block">Publication Year:</span>
                <span className="font-medium text-ink mt-0.5 block">{selectedBook.year}</span>
              </div>
              <div>
                <span className="text-ink-faint font-mono block">Scholarship Focus:</span>
                <span className="font-medium text-ink mt-0.5 block">
                  {selectedBook.title.toLowerCase().includes('english') ? 'ELT & English Literature' :
                   selectedBook.title.toLowerCase().includes('pedagogy') ? 'Pedagogical Frameworks' : 'Educational Research'}
                </span>
              </div>
            </div>

            {/* Scholarly Context */}
            <div className="space-y-3">
              <h4 className="font-serif text-base text-ink font-medium flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-claret" />
                <span>Scholarly Context & Synopsis</span>
              </h4>
              <p className="text-xs sm:text-sm text-ink-muted font-reading leading-relaxed font-light">
                This academic volume contributes to modern teacher education and English Language Pedagogy at higher education institutions. Designed for university scholars, B.Ed. candidates, and researchers, the text systematically addresses curriculum formulation, pedagogical methodologies, and academic rigor aligned with national educational frameworks.
              </p>
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 border-t border-deckle flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-[11px] font-mono text-ink-faint">
                H.M. Patel Institute of English Training & Research Library Catalog
              </span>
              <div className="flex items-center gap-2">
                {onNavigate && (selectedBook.isbn === '978-81-937539-0-3' || selectedBook.title.toLowerCase().includes('kalam')) && (
                  <button
                    onClick={() => {
                      setSelectedBook(null);
                      onNavigate('store');
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-900 text-white text-xs font-medium hover:bg-emerald-800 transition-all shadow-xs flex items-center gap-1.5"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-emerald-300" />
                    <span>View in Learn Hub</span>
                  </button>
                )}
                <button
                  onClick={() => setSelectedBook(null)}
                  className="px-5 py-2.5 rounded-xl bg-parchment-warm text-ink text-xs font-medium hover:bg-parchment-deep border border-deckle transition-all"
                >
                  Close View
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
