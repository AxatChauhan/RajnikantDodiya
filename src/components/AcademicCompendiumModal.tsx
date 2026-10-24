import React, { useState } from 'react';
import { QUALIFICATIONS, ELIGIBILITIES, INVITED_TALKS, CONFERENCE_PAPERS, SESSION_CHAIRS, FDP_TRAININGS } from '../data/professorData';
import { X, Award, GraduationCap, Mic, BookOpen, Users, FileText, CheckCircle2 } from 'lucide-react';

interface AcademicCompendiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'qualifications' | 'talks' | 'conferences' | 'chairs' | 'fdp';
}

export const AcademicCompendiumModal: React.FC<AcademicCompendiumModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'qualifications'
}) => {
  const [activeTab, setActiveTab] = useState<'qualifications' | 'talks' | 'conferences' | 'chairs' | 'fdp'>(defaultTab);

  // Prevent background scrolling when modal is open
  React.useEffect(() => {
    if (isOpen) {
      const origOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = origOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-ink-pure/60 backdrop-blur-sm animate-fade-in">
      <div className="folio-card bg-white rounded-2xl sm:rounded-3xl max-w-4xl w-full p-4 sm:p-8 shadow-book-xl border border-deckle max-h-[92dvh] flex flex-col justify-between overflow-hidden">
        
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-deckle shrink-0">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-widest text-claret font-semibold">Institutional Archive</span>
            <h2 className="font-serif text-2xl sm:text-3xl text-ink font-normal mt-0.5">Academic Compendium & Official Record</h2>
            <p className="text-xs text-ink-muted font-reading font-light mt-0.5">
              Comprehensive institutional documentation for NAAC, NCTE, university committees, and scholarly review.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close archive"
            className="p-2 rounded-xl bg-parchment-warm text-ink-muted hover:text-claret transition-colors shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-3 border-b border-deckle shrink-0 scrollbar-none text-xs">
          <button
            onClick={() => setActiveTab('qualifications')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all font-sans ${
              activeTab === 'qualifications' ? 'bg-claret text-white font-medium shadow-xs' : 'bg-parchment-warm text-ink-muted hover:text-ink'
            }`}
          >
            Degrees & Eligibility ({QUALIFICATIONS.length + ELIGIBILITIES.length})
          </button>
          <button
            onClick={() => setActiveTab('talks')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all font-sans ${
              activeTab === 'talks' ? 'bg-claret text-white font-medium shadow-xs' : 'bg-parchment-warm text-ink-muted hover:text-ink'
            }`}
          >
            Invited Lectures ({INVITED_TALKS.length})
          </button>
          <button
            onClick={() => setActiveTab('conferences')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all font-sans ${
              activeTab === 'conferences' ? 'bg-claret text-white font-medium shadow-xs' : 'bg-parchment-warm text-ink-muted hover:text-ink'
            }`}
          >
            Conferences ({CONFERENCE_PAPERS.length})
          </button>
          <button
            onClick={() => setActiveTab('chairs')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all font-sans ${
              activeTab === 'chairs' ? 'bg-claret text-white font-medium shadow-xs' : 'bg-parchment-warm text-ink-muted hover:text-ink'
            }`}
          >
            Session Chairs ({SESSION_CHAIRS.length})
          </button>
          <button
            onClick={() => setActiveTab('fdp')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all font-sans ${
              activeTab === 'fdp' ? 'bg-claret text-white font-medium shadow-xs' : 'bg-parchment-warm text-ink-muted hover:text-ink'
            }`}
          >
            Faculty Training ({FDP_TRAININGS.length})
          </button>
        </div>

        {/* Scrollable Content Container */}
        <div className="overflow-y-auto py-4 pr-1 space-y-6 flex-grow">
          
          {/* TAB 1: Degrees & Eligibility */}
          {activeTab === 'qualifications' && (
            <div className="space-y-6">
              <div className="space-y-3">
                <h4 className="text-xs font-mono uppercase font-semibold text-ink-muted flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-claret" />
                  <span>Formal Academic Qualifications</span>
                </h4>
                <div className="overflow-x-auto rounded-xl border border-deckle bg-white">
                  <table className="w-full text-left text-xs text-ink-muted min-w-[500px]">
                    <thead className="bg-parchment-warm text-ink font-mono text-[11px] uppercase">
                      <tr>
                        <th className="py-2.5 px-3 w-16">Year</th>
                        <th className="py-2.5 px-3">Degree / Programme</th>
                        <th className="py-2.5 px-3">University / Board</th>
                        <th className="py-2.5 px-3">Grade / Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-deckle/60">
                      {QUALIFICATIONS.map((q, idx) => (
                        <tr key={idx} className="hover:bg-parchment-light">
                          <td className="py-2.5 px-3 font-mono font-bold text-claret">{q.year}</td>
                          <td className="py-2.5 px-3 font-medium text-ink">{q.degree}</td>
                          <td className="py-2.5 px-3">{q.university}</td>
                          <td className="py-2.5 px-3 font-mono text-[11px]">{q.details || ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-mono uppercase font-semibold text-ink-muted flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-brass-dark" />
                  <span>National & State Eligibility Tests</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ELIGIBILITIES.map((el, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-parchment-warm/60 border border-deckle text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-serif font-medium text-ink text-sm">{el.exam}</span>
                        <span className="font-mono text-claret font-bold">{el.year}</span>
                      </div>
                      <p className="text-ink-muted">Subject: <strong className="text-ink">{el.subject}</strong></p>
                      <p className="text-ink-faint text-[11px] font-mono">Conducting Body: {el.conductedBy}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Invited Lectures */}
          {activeTab === 'talks' && (
            <div className="space-y-3">
              <h4 className="text-xs font-mono uppercase font-semibold text-ink-muted flex items-center gap-1.5">
                <Mic className="w-4 h-4 text-claret" />
                <span>22 Invited Talks, Resource Lectures & Keynotes</span>
              </h4>
              <div className="overflow-x-auto rounded-xl border border-deckle bg-white">
                <table className="w-full text-left text-xs text-ink-muted min-w-[540px]">
                  <thead className="bg-parchment-warm text-ink font-mono text-[11px] uppercase">
                    <tr>
                      <th className="py-2.5 px-3 w-24">Date</th>
                      <th className="py-2.5 px-3">Topic / Subject</th>
                      <th className="py-2.5 px-3">Organising Institution</th>
                      <th className="py-2.5 px-3 w-24">Level</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-deckle/60">
                    {INVITED_TALKS.map((t) => (
                      <tr key={t.id} className="hover:bg-parchment-light">
                        <td className="py-2.5 px-3 font-mono font-semibold text-claret whitespace-nowrap">{t.date}</td>
                        <td className="py-2.5 px-3 font-medium text-ink">{t.topic}</td>
                        <td className="py-2.5 px-3">{t.event}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-parchment-deep text-ink-muted border border-deckle">
                            {t.level}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: Conference Papers */}
          {activeTab === 'conferences' && (
            <div className="space-y-3">
              <h4 className="text-xs font-mono uppercase font-semibold text-ink-muted flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-claret" />
                <span>12 Conference & Seminar Papers Presented</span>
              </h4>
              <div className="overflow-x-auto rounded-xl border border-deckle bg-white">
                <table className="w-full text-left text-xs text-ink-muted min-w-[540px]">
                  <thead className="bg-parchment-warm text-ink font-mono text-[11px] uppercase">
                    <tr>
                      <th className="py-2.5 px-3 w-24">Date</th>
                      <th className="py-2.5 px-3">Paper Title</th>
                      <th className="py-2.5 px-3">Conference Organiser</th>
                      <th className="py-2.5 px-3 w-24">Level</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-deckle/60">
                    {CONFERENCE_PAPERS.map((p) => (
                      <tr key={p.id} className="hover:bg-parchment-light">
                        <td className="py-2.5 px-3 font-mono font-semibold text-claret whitespace-nowrap">{p.date}</td>
                        <td className="py-2.5 px-3 font-medium text-ink">{p.topic}</td>
                        <td className="py-2.5 px-3">{p.event}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-parchment-deep text-ink-muted border border-deckle">
                            {p.level}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: Session Chairs */}
          {activeTab === 'chairs' && (
            <div className="space-y-3">
              <h4 className="text-xs font-mono uppercase font-semibold text-ink-muted flex items-center gap-1.5">
                <Award className="w-4 h-4 text-brass-dark" />
                <span>9 National & International Session Chair Appointments</span>
              </h4>
              <div className="overflow-x-auto rounded-xl border border-deckle bg-white">
                <table className="w-full text-left text-xs text-ink-muted min-w-[500px]">
                  <thead className="bg-parchment-warm text-ink font-mono text-[11px] uppercase">
                    <tr>
                      <th className="py-2.5 px-3 w-24">Date</th>
                      <th className="py-2.5 px-3">Event & Role Details</th>
                      <th className="py-2.5 px-3 w-24">Level</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-deckle/60">
                    {SESSION_CHAIRS.map((sc) => (
                      <tr key={sc.id} className="hover:bg-parchment-light">
                        <td className="py-2.5 px-3 font-mono font-semibold text-claret whitespace-nowrap">{sc.date}</td>
                        <td className="py-2.5 px-3 font-medium text-ink">{sc.topic} – {sc.event}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-parchment-deep text-ink-muted border border-deckle">
                            {sc.level}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: Faculty Development Programmes */}
          {activeTab === 'fdp' && (
            <div className="space-y-3">
              <h4 className="text-xs font-mono uppercase font-semibold text-ink-muted flex items-center gap-1.5">
                <Users className="w-4 h-4 text-claret" />
                <span>Faculty Development Programmes & UGC Refresher Courses</span>
              </h4>
              <div className="overflow-x-auto rounded-xl border border-deckle bg-white">
                <table className="w-full text-left text-xs text-ink-muted min-w-[580px]">
                  <thead className="bg-parchment-warm text-ink font-mono text-[11px] uppercase">
                    <tr>
                      <th className="py-2.5 px-3 w-24">Date</th>
                      <th className="py-2.5 px-3">Course / Programme Title</th>
                      <th className="py-2.5 px-3">Organiser / University</th>
                      <th className="py-2.5 px-3">Duration</th>
                      <th className="py-2.5 px-3 w-24">Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-deckle/60">
                    {FDP_TRAININGS.map((f) => (
                      <tr key={f.id} className="hover:bg-parchment-light">
                        <td className="py-2.5 px-3 font-mono font-semibold text-claret whitespace-nowrap">{f.date}</td>
                        <td className="py-2.5 px-3 font-medium text-ink">{f.topic}</td>
                        <td className="py-2.5 px-3">{f.event}</td>
                        <td className="py-2.5 px-3 font-mono text-[11px]">{f.duration}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-parchment-deep text-ink-muted border border-deckle font-bold">
                            {f.typeLabel}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-deckle flex items-center justify-between gap-3 text-xs shrink-0">
          <span className="hidden sm:inline font-mono text-ink-faint text-[11px] truncate">
            H. M. Patel Institute of English Training & Research Institutional Portfolio
          </span>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-claret text-white text-xs font-medium hover:bg-claret-light transition-all shadow-xs min-h-[44px] justify-center flex items-center"
          >
            Close Archive
          </button>
        </div>

      </div>
    </div>
  );
};
