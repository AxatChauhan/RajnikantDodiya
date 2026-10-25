import React from 'react';
import {
  PROFESSOR_INFO,
  CAREER_TIMELINE,
  QUALIFICATIONS,
  ELIGIBILITIES,
  ADDITIONAL_QUALIFICATIONS,
  ACADEMIC_ROLES,
  MEMBERSHIPS,
  ACADEMIC_RECOGNITION
} from '../data/professorData';
import { useSiteContent } from '../contexts/SiteContentContext';
import {
  GraduationCap,
  Award,
  Calendar,
  Briefcase,
  Users,
  Download,
  CheckCircle2,
  FileText,
  Building,
  BookmarkCheck,
  Sparkles
} from 'lucide-react';

interface AboutPageProps {
  subSection?: string;
  onOpenCompendium?: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ subSection, onOpenCompendium }) => {
  const { profile } = useSiteContent();
  const professorName = profile.name || PROFESSOR_INFO.name;
  const professorTitle = profile.title || PROFESSOR_INFO.title;
  const professorInstitution = profile.institution || PROFESSOR_INFO.institution;
  const shortBio = profile.shortBio || PROFESSOR_INFO.shortBio;
  const longBio = profile.longBio && profile.longBio.length > 0 ? profile.longBio : PROFESSOR_INFO.longBio;

  return (
    <div className="space-y-12 sm:space-y-16 animate-fade-in pt-2 sm:pt-4">
      
      {/* Page Title & Breadcrumb Header */}
      <div className="pb-4 border-b border-deckle">
        <span className="text-xs font-mono uppercase tracking-widest text-claret font-semibold">Faculty Profile</span>
        <h1 className="font-serif text-3xl sm:text-4xl text-ink font-normal mt-1">About {professorName}</h1>
        <p className="text-xs sm:text-sm text-ink-muted font-reading font-light mt-1">
          {professorTitle} • {professorInstitution}
        </p>
      </div>

      {/* ========================================================= */}
      {/* 1. BIOGRAPHY (SHORT & LONG BIO FROM PDF 1)               */}
      {/* ========================================================= */}
      <section id="bio" className="folio-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 bg-white border border-deckle shadow-book space-y-6">
        
        {/* Short Bio Callout */}
        <div className="p-4 sm:p-5 rounded-2xl bg-parchment-warm/80 border border-deckle space-y-2">
          <div className="flex items-center gap-2 text-claret">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider">Short Bio (For Introductions & Talk Invitations)</span>
          </div>
          <p className="text-xs sm:text-sm text-ink font-reading leading-relaxed">
            {shortBio}
          </p>
        </div>

        {/* Long Bio */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2 text-claret">
            <GraduationCap className="w-5 h-5 shrink-0" />
            <h2 className="font-serif text-xl sm:text-2xl text-ink font-normal">Full Biography</h2>
          </div>
          <div className="space-y-3.5 text-xs sm:text-sm text-ink-muted font-reading font-light leading-relaxed">
            {longBio.map((paragraph, idx) => (
              <p key={idx} className="indent-4 sm:indent-6">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. CAREER JOURNEY (VERTICAL TIMELINE FROM PDF 1)         */}
      {/* ========================================================= */}
      <section id="career" className="space-y-6">
        <div className="pb-2 border-b border-deckle flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-claret shrink-0" />
            <h2 className="font-serif text-xl sm:text-2xl text-ink font-normal">Career Journey</h2>
          </div>
          <span className="text-xs font-mono text-ink-faint">2004 – Present</span>
        </div>

        <p className="text-xs sm:text-sm text-ink-muted font-reading font-light">
          Milestones across nearly two decades of teaching, research, and educational administration.
        </p>

        {/* Mobile Feed (<640px) */}
        <div className="sm:hidden space-y-2.5">
          {CAREER_TIMELINE.map((item, idx) => (
            <div key={idx} className="p-3.5 rounded-xl bg-white border border-deckle shadow-book space-y-1">
              <span className="font-mono text-xs font-bold text-claret block">{item.year}</span>
              <p className="font-reading text-xs text-ink font-normal leading-relaxed">{item.milestone}</p>
            </div>
          ))}
        </div>

        {/* Desktop Table (>=640px) */}
        <div className="hidden sm:block overflow-x-auto rounded-2xl border border-deckle bg-white shadow-book">
          <table className="w-full text-left text-xs text-ink-muted">
            <thead className="bg-parchment-warm text-ink border-b border-deckle font-mono text-[10px] sm:text-[11px] uppercase">
              <tr>
                <th className="py-3 px-4 w-28 sm:w-32">Year</th>
                <th className="py-3 px-4">Milestone</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-deckle/60">
              {CAREER_TIMELINE.map((item, idx) => (
                <tr key={idx} className="hover:bg-parchment-light transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-claret whitespace-nowrap align-top">
                    {item.year}
                  </td>
                  <td className="py-3.5 px-4 font-reading text-ink font-normal leading-relaxed">
                    {item.milestone}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. QUALIFICATIONS & ELIGIBILITY (TABLES FROM PDF 1)       */}
      {/* ========================================================= */}
      <section id="qualifications" className="space-y-8">
        <div className="pb-2 border-b border-deckle flex items-center gap-2">
          <Award className="w-5 h-5 text-claret shrink-0" />
          <h2 className="font-serif text-xl sm:text-2xl text-ink font-normal">Qualifications</h2>
        </div>

        {/* Degrees */}
        <div className="space-y-3">
          <h3 className="text-xs sm:text-sm font-mono font-semibold uppercase text-ink-muted">Degrees</h3>

          {/* Mobile Card Feed (<640px) */}
          <div className="sm:hidden space-y-2.5">
            {QUALIFICATIONS.map((q, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-white border border-deckle shadow-book flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <h4 className="font-serif text-xs font-medium text-ink">{q.degree}</h4>
                  <p className="text-[11px] text-ink-muted font-reading">{q.university}</p>
                </div>
                <span className="font-mono text-xs font-bold text-claret shrink-0">{q.year}</span>
              </div>
            ))}
          </div>

          {/* Desktop Table (>=640px) */}
          <div className="hidden sm:block overflow-x-auto rounded-2xl border border-deckle bg-white shadow-book">
            <table className="w-full text-left text-xs text-ink-muted">
              <thead className="bg-parchment-warm text-ink border-b border-deckle font-mono text-[10px] sm:text-[11px] uppercase">
                <tr>
                  <th className="py-2.5 px-4 w-24">Year</th>
                  <th className="py-2.5 px-4">Degree</th>
                  <th className="py-2.5 px-4">University</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-deckle/60">
                {QUALIFICATIONS.map((q, idx) => (
                  <tr key={idx} className="hover:bg-parchment-light transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-claret">{q.year}</td>
                    <td className="py-3 px-4 font-medium text-ink">{q.degree}</td>
                    <td className="py-3 px-4">{q.university}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Ph.D. Thesis Detail Box */}
          <div className="p-4 rounded-xl bg-parchment-warm/70 border border-deckle space-y-1.5 text-xs font-reading">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-claret block">
              Doctoral Thesis Details
            </span>
            <p className="font-medium text-ink">
              {PROFESSOR_INFO.phdDetails.thesis}
            </p>
            <p className="text-ink-muted font-light">
              Guide: <span className="font-medium text-ink">{PROFESSOR_INFO.phdDetails.guide}</span> • {PROFESSOR_INFO.phdDetails.department}
            </p>
            <p className="text-ink-faint font-mono text-[11px]">
              Result declared: {PROFESSOR_INFO.phdDetails.resultDeclared}
            </p>
          </div>
        </div>

        {/* National and State Eligibility Tests */}
        <div className="space-y-3">
          <h3 className="text-xs sm:text-sm font-mono font-semibold uppercase text-ink-muted">
            National and State Eligibility Tests
          </h3>

          {/* Mobile Card Feed (<640px) */}
          <div className="sm:hidden space-y-2.5">
            {ELIGIBILITIES.map((e, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-white border border-deckle shadow-book flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-claret">{e.exam}</span>
                    <span className="text-[11px] text-ink-muted font-medium">• {e.subject}</span>
                  </div>
                  <p className="text-[11px] text-ink-faint font-reading">{e.conductedBy}</p>
                </div>
                <span className="font-mono text-xs font-bold text-ink-muted shrink-0">{e.year}</span>
              </div>
            ))}
          </div>

          {/* Desktop Table (>=640px) */}
          <div className="hidden sm:block overflow-x-auto rounded-2xl border border-deckle bg-white shadow-book">
            <table className="w-full text-left text-xs text-ink-muted">
              <thead className="bg-parchment-warm text-ink border-b border-deckle font-mono text-[10px] sm:text-[11px] uppercase">
                <tr>
                  <th className="py-2.5 px-4 w-24">Year</th>
                  <th className="py-2.5 px-4">Exam</th>
                  <th className="py-2.5 px-4">Subject</th>
                  <th className="py-2.5 px-4">Conducted by</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-deckle/60">
                {ELIGIBILITIES.map((e, idx) => (
                  <tr key={idx} className="hover:bg-parchment-light transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-claret">{e.year}</td>
                    <td className="py-3 px-4 font-medium text-ink">{e.exam}</td>
                    <td className="py-3 px-4">{e.subject}</td>
                    <td className="py-3 px-4 text-ink-faint">{e.conductedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Additional Qualifications */}
        <div className="space-y-2">
          <h3 className="text-xs sm:text-sm font-mono font-semibold uppercase text-ink-muted">
            Additional Qualifications
          </h3>
          <ul className="space-y-2 text-xs font-reading text-ink-muted bg-white p-4 rounded-xl border border-deckle shadow-book">
            {ADDITIONAL_QUALIFICATIONS.map((item, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. ACADEMIC ROLES (FROM PDF 1)                           */}
      {/* ========================================================= */}
      <section id="roles" className="space-y-6">
        <div className="pb-2 border-b border-deckle flex items-center gap-2">
          <Building className="w-5 h-5 text-claret shrink-0" />
          <h2 className="font-serif text-xl sm:text-2xl text-ink font-normal">Academic Roles</h2>
        </div>

        {/* Roles at HMPIETR */}
        <div className="space-y-3">
          <h3 className="text-xs sm:text-sm font-mono font-semibold uppercase text-ink-muted">
            At H. M. Patel Institute of English Training and Research
          </h3>

          {/* Mobile Grid Cards (<640px) */}
          <div className="sm:hidden grid grid-cols-1 gap-2.5">
            {ACADEMIC_ROLES.map((r, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-white border border-deckle shadow-book flex items-center justify-between gap-3 text-xs">
                <span className="font-medium text-ink font-serif">{r.role}</span>
                <span className="font-mono text-claret text-[11px] font-bold shrink-0">{r.since}</span>
              </div>
            ))}
          </div>

          {/* Desktop Table (>=640px) */}
          <div className="hidden sm:block overflow-x-auto rounded-2xl border border-deckle bg-white shadow-book">
            <table className="w-full text-left text-xs text-ink-muted">
              <thead className="bg-parchment-warm text-ink border-b border-deckle font-mono text-[10px] sm:text-[11px] uppercase">
                <tr>
                  <th className="py-2.5 px-4">Role</th>
                  <th className="py-2.5 px-4 w-40">Since</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-deckle/60">
                {ACADEMIC_ROLES.map((r, idx) => (
                  <tr key={idx} className="hover:bg-parchment-light transition-colors">
                    <td className="py-3 px-4 font-medium text-ink">{r.role}</td>
                    <td className="py-3 px-4 font-mono text-claret text-[11px]">{r.since}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Professional Memberships */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs sm:text-sm font-mono font-semibold uppercase text-ink-muted flex items-center gap-2">
            <Users className="w-4 h-4 text-claret" />
            <span>Professional Memberships</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {MEMBERSHIPS.map((m, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-white border border-deckle shadow-book flex items-center justify-between text-xs">
                <span className="font-medium text-ink">{m.association}</span>
                <span className="px-2 py-0.5 rounded bg-parchment-warm border border-deckle font-mono text-[10px] text-claret font-semibold shrink-0 ml-2">
                  {m.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 5. RECOGNITION (FROM PDF 1 - NOTE: NOT EMPTY AWARDS)     */}
      {/* ========================================================= */}
      <section id="recognition" className="folio-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 bg-white border border-deckle shadow-book space-y-4">
        <div className="flex items-center gap-2 text-claret">
          <BookmarkCheck className="w-5 h-5 shrink-0" />
          <h2 className="font-serif text-xl sm:text-2xl text-ink font-normal">Academic Recognition</h2>
        </div>
        <p className="text-xs text-ink-muted font-reading leading-relaxed">
          Honors, keynote invitations, conference session chairing, and editorial duties across national and international educational forums:
        </p>
        <ul className="space-y-3 pt-2">
          {ACADEMIC_RECOGNITION.map((rec, idx) => (
            <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm font-reading text-ink leading-relaxed">
              <span className="w-1.5 h-1.5 rounded-full bg-claret shrink-0 mt-2" />
              <span>{rec}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* ========================================================= */}
      {/* 6. CURRICULUM VITAE (VIEW + DOWNLOAD PER PDF 2)          */}
      {/* ========================================================= */}
      <section id="cv" className="p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-parchment-warm/80 border border-deckle space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-claret font-bold block">
              Official Document
            </span>
            <h3 className="font-serif text-2xl text-ink font-normal">
              Curriculum Vitae (CV)
            </h3>
            <p className="text-xs text-ink-muted font-reading">
              Complete academic credentials, publication list, lecture records, and accreditation data.
            </p>
            <span className="text-[11px] font-mono text-claret font-semibold block pt-1">
              Last updated: October 2026
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenCompendium && (
              <button
                onClick={onOpenCompendium}
                className="px-4 py-2.5 rounded-xl bg-claret hover:bg-claret-light text-white text-xs font-medium shadow-xs transition-all flex items-center gap-2 min-h-[42px]"
              >
                <Download className="w-4 h-4" />
                <span>View / Download CV</span>
              </button>
            )}
          </div>
        </div>
      </section>

    </div>
  );
};
