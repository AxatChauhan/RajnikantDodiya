import React, { useState, useMemo } from 'react';
import { PUBLICATIONS, BOOKS, CONFERENCE_PAPERS, Publication, Book, Engagement } from '../data/professorData';
import { useSiteContent } from '../contexts/SiteContentContext';
import {
  BookOpen,
  FileText,
  Search,
  Filter,
  Bookmark,
  Layers,
  Sparkles,
  Download,
  ExternalLink,
  ChevronRight,
  Mail,
  Send
} from 'lucide-react';
import { MainTab } from './Navbar';

interface PublicationsPageProps {
  subSection?: string;
  onNavigate?: (tab: MainTab, subId?: string) => void;
}

export const PublicationsPage: React.FC<PublicationsPageProps> = ({ subSection, onNavigate }) => {
  const { books } = useSiteContent();
  const allBooks = books && books.length > 0 ? books : BOOKS;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('All');

  // Extract distinct themes from research papers
  const themes = useMemo(() => {
    const set = new Set<string>();
    PUBLICATIONS.forEach(p => set.add(p.theme));
    return ['All', ...Array.from(set)];
  }, []);

  // Filtered research papers
  const filteredPapers = useMemo(() => {
    return PUBLICATIONS.filter(p => {
      const matchesSearch =
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.journal.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.year.toString().includes(searchTerm);
      const matchesTheme = selectedTheme === 'All' || p.theme === selectedTheme;
      return matchesSearch && matchesTheme;
    });
  }, [searchTerm, selectedTheme]);

  const authoredBooks = allBooks.filter(b => b.type === 'authored');
  const editedBooks = allBooks.filter(b => b.type === 'edited');
  const bookChapters = allBooks.filter(b => b.type === 'chapter');

  return (
    <div className="space-y-12 sm:space-y-16 animate-fade-in pt-2 sm:pt-4">
      {/* Title Header */}
      <div className="pb-4 border-b border-deckle">
        <span className="text-xs font-mono uppercase tracking-widest text-claret font-semibold">
          Scholarly Output
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl text-ink font-normal mt-1">
          Publications & Books
        </h1>
        <p className="text-xs sm:text-sm text-ink-muted font-reading font-light mt-1">
          Peer-reviewed journal articles, authored and edited academic books, book chapters, conference papers, and calls for chapters.
        </p>
      </div>

      {/* Subtab Navigation Pills with Edge-to-Edge Bleed on Mobile */}
      <div className="-mx-3 px-3 sm:mx-0 sm:px-0 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-xs">
        {[
          { id: 'papers', label: `Research Papers (${PUBLICATIONS.length})` },
          { id: 'authored', label: `Authored Books (${authoredBooks.length})` },
          { id: 'edited', label: `Edited Books (${editedBooks.length})` },
          { id: 'chapters', label: `Book Chapters (${bookChapters.length})` },
          { id: 'conferences', label: `Conference Papers (${CONFERENCE_PAPERS.length})` },
          { id: 'calls', label: 'Calls for Chapters' }
        ].map(pill => (
          <a
            key={pill.id}
            href={`#${pill.id}`}
            className="px-3 py-1.5 rounded-xl bg-parchment-warm border border-deckle text-ink-muted hover:text-claret hover:border-claret font-medium whitespace-nowrap transition-all shadow-2xs"
          >
            {pill.label}
          </a>
        ))}
      </div>

      {/* ========================================================= */}
      {/* 1. RESEARCH PAPERS (APA 7th STYLE)                       */}
      {/* ========================================================= */}
      <section id="papers" className="space-y-6">
        <div className="pb-2 border-b border-deckle flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-claret">
            <FileText className="w-5 h-5 shrink-0" />
            <h2 className="font-serif text-xl sm:text-2xl text-ink font-normal">
              Peer-Reviewed Journal Papers ({PUBLICATIONS.length})
            </h2>
          </div>
          <span className="text-xs font-mono text-ink-muted">Standard APA 7th Edition Citations</span>
        </div>

        {/* Search & Theme Filter Bar */}
        <div className="p-4 rounded-2xl bg-white border border-deckle shadow-book space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search paper title, journal, or year..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-parchment-warm/60 border border-deckle text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:border-claret"
              />
            </div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="text-xs text-claret hover:underline self-end sm:self-center"
              >
                Clear Search
              </button>
            )}
          </div>

          {/* Theme Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
            <span className="text-ink-muted font-medium shrink-0 flex items-center gap-1">
              <Filter className="w-3 h-3 text-claret" /> Theme:
            </span>
            {themes.map(t => (
              <button
                key={t}
                onClick={() => setSelectedTheme(t)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all whitespace-nowrap ${
                  selectedTheme === t
                    ? 'bg-claret text-white shadow-2xs'
                    : 'bg-parchment-warm/80 text-ink-muted hover:bg-parchment-warm'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Papers List */}
        <div className="space-y-3">
          {filteredPapers.map(paper => (
            <div
              key={paper.no}
              className="p-4 sm:p-5 rounded-2xl bg-white border border-deckle shadow-2xs hover:border-claret/50 transition-all space-y-2 group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-baseline gap-2">
                  <span className="w-6 h-6 rounded-full bg-parchment-warm text-claret text-xs font-mono font-bold flex items-center justify-center shrink-0">
                    {paper.no}
                  </span>
                  <h3 className="font-serif text-sm sm:text-base text-ink group-hover:text-claret transition-colors leading-snug">
                    {paper.title}
                  </h3>
                </div>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-claret-soft text-claret shrink-0">
                  {paper.year}
                </span>
              </div>

              {/* Journal and Metadata */}
              <div className="pl-8 text-xs text-ink-muted font-reading space-y-1">
                <p className="italic text-ink">{paper.journal}</p>
                <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] font-mono">
                  <span className="px-2 py-0.5 rounded bg-parchment-warm border border-deckle text-ink-muted">
                    {paper.issn}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                    {paper.theme}
                  </span>
                  <span className="text-emerald-700 font-medium">✓ Peer-Reviewed</span>
                </div>
              </div>
            </div>
          ))}

          {filteredPapers.length === 0 && (
            <div className="p-8 text-center bg-white rounded-2xl border border-deckle text-xs text-ink-muted space-y-2">
              <p>No papers match the current search or theme filter.</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedTheme('All');
                }}
                className="text-claret underline font-medium"
              >
                Reset all filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. AUTHORED BOOKS (6 BOOKS)                              */}
      {/* ========================================================= */}
      <section id="authored" className="space-y-6">
        <div className="pb-2 border-b border-deckle flex items-center justify-between">
          <div className="flex items-center gap-2 text-claret">
            <BookOpen className="w-5 h-5 shrink-0" />
            <h2 className="font-serif text-xl sm:text-2xl text-ink font-normal">
              Authored Books ({authoredBooks.length})
            </h2>
          </div>
          <span className="text-xs font-mono text-ink-muted">Monographs & Textbooks</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {authoredBooks.map((book, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-white border border-deckle shadow-book flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-claret font-bold bg-claret-soft px-2 py-0.5 rounded">
                    Sole Author
                  </span>
                  <span className="text-xs font-mono text-ink-muted">{book.year}</span>
                </div>
                <h3 className="font-serif text-base sm:text-lg text-ink font-medium leading-snug">
                  {book.title}
                </h3>
                <p className="text-xs text-ink-muted font-reading">
                  Publisher: <span className="font-medium text-ink">{book.publisher}</span>
                </p>
              </div>

              <div className="pt-2 border-t border-deckle/60 flex items-center justify-between text-xs font-mono">
                <span className="text-ink-faint text-[11px]">ISBN: {book.isbn}</span>
                {onNavigate && (
                  <button
                    onClick={() => onNavigate('bookstore')}
                    className="text-claret font-sans font-medium hover:underline flex items-center gap-1"
                  >
                    View in Bookstore <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. EDITED BOOKS (4 BOOKS)                                 */}
      {/* ========================================================= */}
      <section id="edited" className="space-y-6">
        <div className="pb-2 border-b border-deckle flex items-center justify-between">
          <div className="flex items-center gap-2 text-claret">
            <Layers className="w-5 h-5 shrink-0" />
            <h2 className="font-serif text-xl sm:text-2xl text-ink font-normal">
              Edited Academic Books ({editedBooks.length})
            </h2>
          </div>
          <span className="text-xs font-mono text-ink-muted">Scholarly Anthologies & Volumes</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {editedBooks.map((book, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-white border border-deckle shadow-book flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-blue-800 font-bold bg-blue-50 px-2 py-0.5 rounded">
                    Editor
                  </span>
                  <span className="text-xs font-mono text-ink-muted">{book.year}</span>
                </div>
                <h3 className="font-serif text-base sm:text-lg text-ink font-medium leading-snug">
                  {book.title}
                </h3>
                <p className="text-xs text-ink-muted font-reading">
                  Publisher: <span className="font-medium text-ink">{book.publisher}</span>
                </p>
              </div>

              <div className="pt-2 border-t border-deckle/60 flex items-center justify-between text-xs font-mono">
                <span className="text-ink-faint text-[11px]">ISBN: {book.isbn}</span>
                {onNavigate && (
                  <button
                    onClick={() => onNavigate('bookstore')}
                    className="text-claret font-sans font-medium hover:underline flex items-center gap-1"
                  >
                    View in Bookstore <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. BOOK CHAPTERS (1 CHAPTER)                             */}
      {/* ========================================================= */}
      <section id="chapters" className="space-y-6">
        <div className="pb-2 border-b border-deckle flex items-center justify-between">
          <div className="flex items-center gap-2 text-claret">
            <Bookmark className="w-5 h-5 shrink-0" />
            <h2 className="font-serif text-xl sm:text-2xl text-ink font-normal">
              Book Chapters in Edited Volumes ({bookChapters.length})
            </h2>
          </div>
          <span className="text-xs font-mono text-ink-muted">Contributed Scholarly Chapters</span>
        </div>

        <div className="space-y-3">
          {bookChapters.map((chapter, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-white border border-deckle shadow-book space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-purple-800 font-bold bg-purple-50 px-2 py-0.5 rounded">
                  Book Chapter
                </span>
                <span className="text-xs font-mono text-ink-muted">{chapter.year}</span>
              </div>
              <h3 className="font-serif text-base sm:text-lg text-ink font-medium">
                "{chapter.title}"
              </h3>
              <p className="text-xs sm:text-sm text-ink-muted font-reading">
                Published in:{' '}
                <span className="italic text-ink font-medium">
                  {chapter.details}
                </span>
              </p>
              <div className="pt-2 border-t border-deckle/60 flex flex-wrap items-center gap-4 text-xs font-mono text-ink-faint">
                <span>Publisher: {chapter.publisher}</span>
                <span>•</span>
                <span>ISBN: {chapter.isbn}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 5. CONFERENCE PAPERS (13 PAPERS)                         */}
      {/* ========================================================= */}
      <section id="conferences" className="space-y-6">
        <div className="pb-2 border-b border-deckle flex items-center justify-between">
          <div className="flex items-center gap-2 text-claret">
            <Sparkles className="w-5 h-5 shrink-0" />
            <h2 className="font-serif text-xl sm:text-2xl text-ink font-normal">
              Conference Papers Presented ({CONFERENCE_PAPERS.length})
            </h2>
          </div>
          <span className="text-xs font-mono text-ink-muted">National & International</span>
        </div>

        {/* Mobile Card Feed (<640px) */}
        <div className="sm:hidden space-y-3">
          {CONFERENCE_PAPERS.map(paper => (
            <div key={paper.id} className="p-4 rounded-xl bg-white border border-deckle shadow-book space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs text-ink-muted">{paper.date}</span>
                <span
                  className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                    paper.level === 'International'
                      ? 'bg-claret-soft text-claret'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {paper.level}
                </span>
              </div>
              <h4 className="font-reading font-medium text-ink text-xs leading-snug">
                {paper.topic}
              </h4>
              <p className="text-[11px] text-ink-muted font-reading">
                {paper.event}
              </p>
            </div>
          ))}
        </div>

        {/* Desktop Table (>=640px) */}
        <div className="hidden sm:block overflow-x-auto rounded-2xl border border-deckle bg-white shadow-book">
          <table className="w-full text-left text-xs text-ink min-w-[620px]">
            <thead className="bg-parchment-warm/80 text-ink-muted border-b border-deckle font-mono text-[11px] uppercase">
              <tr>
                <th className="py-3 px-4 w-32">Date</th>
                <th className="py-3 px-4">Paper Title / Theme</th>
                <th className="py-3 px-4">Conference / Host Institution</th>
                <th className="py-3 px-4 w-28 text-right">Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-deckle/60">
              {CONFERENCE_PAPERS.map(paper => (
                <tr key={paper.id} className="hover:bg-parchment-warm/40 transition-colors">
                  <td className="py-3 px-4 font-mono text-ink-muted align-top">{paper.date}</td>
                  <td className="py-3 px-4 font-reading font-medium text-ink align-top">
                    {paper.topic}
                  </td>
                  <td className="py-3 px-4 text-ink-muted font-reading align-top">
                    {paper.event}
                  </td>
                  <td className="py-3 px-4 text-right align-top">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        paper.level === 'International'
                          ? 'bg-claret-soft text-claret'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {paper.level}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 6. CALLS FOR CHAPTERS (EDITORIAL INVITATIONS)             */}
      {/* ========================================================= */}
      <section id="calls" className="folio-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 bg-white border border-deckle shadow-book space-y-5">
        <div className="flex items-center gap-2 text-claret border-b border-deckle pb-3">
          <Mail className="w-5 h-5 shrink-0" />
          <h2 className="font-serif text-xl sm:text-2xl text-ink font-normal">
            Calls for Book Chapters & Research Submissions
          </h2>
        </div>

        <p className="text-xs sm:text-sm text-ink-muted font-reading font-light leading-relaxed">
          Dr. Rajnikant S. Dodiya regularly edits academic volumes focusing on contemporary issues in language teaching, educational psychology, and Indian Knowledge Systems. Researchers and faculty members are invited to submit chapter proposals.
        </p>

        <div className="p-5 rounded-2xl bg-parchment-warm/80 border border-deckle space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-claret font-bold">
                Upcoming Edited Volume (2026–2027)
              </span>
              <h3 className="font-serif text-base sm:text-lg text-ink font-medium mt-0.5">
                Artificial Intelligence & Post-Method Pedagogy in English Classrooms
              </h3>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-mono font-bold self-start sm:self-auto">
              Open for Abstracts
            </span>
          </div>

          <p className="text-xs text-ink-muted font-reading leading-relaxed">
            Inviting empirical and theoretical chapters exploring generative AI in English language education, translanguaging in Indian classrooms, and context-sensitive pedagogy under NEP 2020. Chapters undergo double-blind peer review and will be published with an assigned ISBN.
          </p>

          <div className="pt-2 border-t border-deckle/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <span className="text-ink font-mono text-[11px]">
              Submission Queries:{' '}
              <a
                href="mailto:rajnikantdodiya2@gmail.com?subject=Call%20for%20Chapters%20Proposal"
                className="text-claret font-semibold hover:underline"
              >
                rajnikantdodiya2@gmail.com
              </a>
            </span>
            <a
              href="mailto:rajnikantdodiya2@gmail.com?subject=Chapter%20Proposal%20Submission"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-claret text-white hover:bg-claret-dark transition-all font-medium shadow-xs text-xs self-start sm:self-auto"
            >
              <Send className="w-3.5 h-3.5" /> Submit Chapter Abstract
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};
