import React from 'react';
import { PROFESSOR_INFO, RESEARCH_INTERESTS, SOCIAL_LINKS } from '../data/professorData';
import {
  Search,
  ExternalLink,
  BookOpen,
  Award,
  Layers,
  Sparkles,
  CheckCircle2,
  FileCheck,
  Building2,
  Bookmark
} from 'lucide-react';
import { MainTab } from './Navbar';

interface ResearchPageProps {
  subSection?: string;
  onNavigate?: (tab: MainTab, subId?: string) => void;
}

export const ResearchPage: React.FC<ResearchPageProps> = ({ subSection, onNavigate }) => {
  return (
    <div className="space-y-12 sm:space-y-16 animate-fade-in pt-2 sm:pt-4">
      
      {/* Title Header */}
      <div className="pb-4 border-b border-deckle">
        <span className="text-xs font-mono uppercase tracking-widest text-claret font-semibold">Academic Inquiry</span>
        <h1 className="font-serif text-3xl sm:text-4xl text-ink font-normal mt-1">Research & Epistemic Focus</h1>
        <p className="text-xs sm:text-sm text-ink-muted font-reading font-light mt-1">
          Investigating teacher education, post-method pedagogy, generative AI in language learning, and Indian Knowledge Systems.
        </p>
      </div>

      {/* ========================================================= */}
      {/* 1. RESEARCH IDENTIFIERS (ORCID, SCHOLAR, VIDWAN LOGO BTNS)*/}
      {/* ========================================================= */}
      <section id="ids" className="folio-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 bg-white border border-deckle shadow-book space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-deckle pb-3">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-claret font-bold block">
              Verified Academic Credentials
            </span>
            <h2 className="font-serif text-xl sm:text-2xl text-ink font-normal">
              Digital Research Identifiers
            </h2>
          </div>
          <span className="text-xs font-mono text-ink-faint">Open Access & University Indexed</span>
        </div>

        <p className="text-xs sm:text-sm text-ink-muted font-reading font-light leading-relaxed">
          Access Dr. Dodiya's verified publications, citation metrics, and peer-review profiles across global academic repositories:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* ORCID Button */}
          <a
            href={`https://orcid.org/${SOCIAL_LINKS.orcid}`}
            target="_blank"
            rel="noreferrer"
            className="p-4 rounded-xl border border-deckle bg-parchment-warm/60 hover:bg-parchment-warm hover:border-claret transition-all flex items-center justify-between group shadow-2xs"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
                <span>ORCID ID</span>
              </div>
              <span className="font-mono text-xs text-ink block">{SOCIAL_LINKS.orcid}</span>
            </div>
            <ExternalLink className="w-4 h-4 text-ink-muted group-hover:text-claret transition-colors" />
          </a>

          {/* Google Scholar Button */}
          <a
            href={`https://scholar.google.com/citations?user=${SOCIAL_LINKS.googleScholar}`}
            target="_blank"
            rel="noreferrer"
            className="p-4 rounded-xl border border-deckle bg-parchment-warm/60 hover:bg-parchment-warm hover:border-claret transition-all flex items-center justify-between group shadow-2xs"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#1A73E8]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1A73E8] inline-block" />
                <span>Google Scholar</span>
              </div>
              <span className="font-mono text-xs text-ink block">Verified Profile</span>
            </div>
            <ExternalLink className="w-4 h-4 text-ink-muted group-hover:text-claret transition-colors" />
          </a>

          {/* Vidwan INFLIBNET Button */}
          <a
            href={`https://vidwan.inflibnet.ac.in/profile/${SOCIAL_LINKS.vidwan}`}
            target="_blank"
            rel="noreferrer"
            className="p-4 rounded-xl border border-deckle bg-parchment-warm/60 hover:bg-parchment-warm hover:border-claret transition-all flex items-center justify-between group shadow-2xs"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-claret">
                <span className="w-2.5 h-2.5 rounded-full bg-claret inline-block" />
                <span>Vidwan (INFLIBNET)</span>
              </div>
              <span className="font-mono text-xs text-ink block">Profile #{SOCIAL_LINKS.vidwan}</span>
            </div>
            <ExternalLink className="w-4 h-4 text-ink-muted group-hover:text-claret transition-colors" />
          </a>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. RESEARCH INTERESTS (PDF 2 REQUIREMENT)                 */}
      {/* ========================================================= */}
      <section id="interests" className="space-y-4">
        <div className="pb-2 border-b border-deckle flex items-center gap-2">
          <Layers className="w-5 h-5 text-claret shrink-0" />
          <h2 className="font-serif text-xl sm:text-2xl text-ink font-normal">Primary Research Interests</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {RESEARCH_INTERESTS.map((interest, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-white border border-deckle shadow-book space-y-1.5 hover:border-claret transition-all"
            >
              <div className="w-7 h-7 rounded-lg bg-claret-soft text-claret flex items-center justify-center font-mono text-xs font-bold">
                {idx + 1}
              </div>
              <h4 className="font-serif text-sm font-medium text-ink leading-snug">
                {interest}
              </h4>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. DOCTORAL STUDY SUMMARY                                 */}
      {/* ========================================================= */}
      <section className="folio-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 bg-parchment-warm/70 border border-deckle space-y-3">
        <span className="text-[10px] font-mono uppercase tracking-widest text-claret font-bold block">
          Doctoral Thesis • Sardar Patel University (2018)
        </span>
        <h3 className="font-serif text-xl sm:text-2xl text-ink font-normal">
          "{PROFESSOR_INFO.phdDetails.thesis}"
        </h3>
        <p className="text-xs sm:text-sm font-reading text-ink-muted leading-relaxed font-light">
          An extensive philosophical and empirical study analyzing Dr. A.P.J. Abdul Kalam's educational thoughts, focusing on creative inquiry, moral leadership in classrooms, and multilingual pedagogy. Guided by Dr. Alkaben J. Macwan at the P.G. Department of Education, Sardar Patel University.
        </p>

        {onNavigate && (
          <div className="pt-2">
            <button
              onClick={() => onNavigate('learn', 'books')}
              className="px-4 py-2 rounded-xl bg-claret hover:bg-claret-light text-white text-xs font-medium transition-all shadow-xs flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Read Doctoral Monograph</span>
            </button>
          </div>
        )}
      </section>

      {/* ========================================================= */}
      {/* 4. ONGOING PROJECTS (PDF 2 REQUIREMENT)                   */}
      {/* ========================================================= */}
      <section id="projects" className="space-y-4">
        <div className="pb-2 border-b border-deckle flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-claret shrink-0" />
          <h2 className="font-serif text-xl sm:text-2xl text-ink font-normal">Ongoing Projects & Initiatives</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-deckle shadow-book space-y-2">
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold border border-emerald-200">
              Active Institutional Initiative
            </span>
            <h4 className="font-serif text-base text-ink font-normal">
              Centre for AI in English Language Education (CAIELE)
            </h4>
            <p className="text-xs font-reading text-ink-muted leading-relaxed font-light">
              Coordinating institutional frameworks at HMPIETR to train student-teachers in deploying ethical generative AI, automated language feedback, and blended techno-pedagogy under NEP 2020.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-deckle shadow-book space-y-2">
            <span className="text-[10px] font-mono text-claret bg-claret-soft px-2 py-0.5 rounded font-bold border border-claret/20">
              Curricular Research
            </span>
            <h4 className="font-serif text-base text-ink font-normal">
              Post-Method Translanguaging in Regional ESL Classrooms
            </h4>
            <p className="text-xs font-reading text-ink-muted leading-relaxed font-light">
              Developing context-sensitive materials for Gujarati-English bilingual student teachers, aligning classroom practices with Kumaravadivelu’s post-method parameters.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 5. GRANTS & FUNDING (PDF 2 REQUIREMENT)                   */}
      {/* ========================================================= */}
      <section id="grants" className="space-y-4">
        <div className="pb-2 border-b border-deckle flex items-center gap-2">
          <Building2 className="w-5 h-5 text-claret shrink-0" />
          <h2 className="font-serif text-xl sm:text-2xl text-ink font-normal">Grants & Funding</h2>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-deckle shadow-book space-y-3 text-xs font-reading text-ink-muted">
          <p className="leading-relaxed">
            Institutional quality-assurance proposals, NCTE Performance Appraisal Reports (PAR), and GSIRF university rating coordination conducted under the aegis of HMPIETR and Sardar Patel University.
          </p>
          <div className="p-3.5 rounded-xl bg-parchment-warm/70 border border-deckle text-[11px] font-mono text-ink-faint">
            Institutional grants and departmental project allocations are administered through the Research and Development Cell (RDC), HMPIETR.
          </div>
        </div>
      </section>

    </div>
  );
};
