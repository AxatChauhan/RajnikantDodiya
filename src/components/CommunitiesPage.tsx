import React from 'react';
import { MEMBERSHIPS, PROFESSOR_INFO } from '../data/professorData';
import {
  Users,
  Layers,
  Sparkles,
  BookOpen,
  Award,
  ShieldCheck,
  Building2,
  FileText,
  Handshake,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { MainTab } from './Navbar';

interface CommunitiesPageProps {
  subSection?: string;
  onNavigate?: (tab: MainTab, subId?: string) => void;
}

export const CommunitiesPage: React.FC<CommunitiesPageProps> = ({ subSection, onNavigate }) => {
  // Institutional Publications (strictly kept separate from personal publications)
  const institutionalPublications = [
    {
      title: 'ELEF Annual Journal (English Language Education Forum)',
      role: 'Editor',
      publisher: 'H. M. Patel Institute of English Training and Research',
      frequency: 'Annual Peer-Reviewed Journal',
      desc: 'Dedicated to publishing empirical research, reflective essays, and pedagogical innovations in English language education across Indian institutions.'
    },
    {
      title: 'ELEF Book Series',
      role: 'Editor',
      publisher: 'HMPIETR Publications',
      frequency: 'Edited Academic Anthologies',
      desc: 'Compiling thematic scholarly contributions from national webinars, symposia, and teacher-educator colloquia organized under ELEF.'
    },
    {
      title: 'HMPIETR IQAC Newsletter',
      role: 'Editor',
      publisher: 'Internal Quality Assurance Cell, HMPIETR',
      frequency: 'Quarterly Institutional Bulletin',
      desc: 'Documenting institutional quality initiatives, academic benchmarks, NAAC accreditation progress, faculty publications, and student-teacher achievements.'
    }
  ];

  // Memoranda of Understanding (MoUs) & Institutional Collaborations
  const mous = [
    {
      institution: 'Sardar Patel College of Education, Bakrol',
      type: 'Academic Exchange & Faculty Sharing',
      purpose: 'Conducting teacher enrichment courses, communicative English workshops, and reciprocal guest lectures for B.Ed. trainees.'
    },
    {
      institution: 'English Language Teachers’ Association of India (ELTAI)',
      type: 'Professional Chapter Linkage',
      purpose: 'Joint organization of national conferences on discourse-oriented pedagogy, post-method ELT, and teacher professional development.'
    },
    {
      institution: 'District Teacher Training Institutes & DIETs',
      type: 'Pedagogical Extension & School Outreach',
      purpose: 'Classroom observation protocols, English methodology training for primary and secondary government school teachers.'
    },
    {
      institution: 'Council for Teacher Education (CTE), Gujarat Chapter',
      type: 'Research & Policy Collaboration',
      purpose: 'Policy roundtables on National Education Policy (NEP 2020) teacher-education transformation.'
    }
  ];

  return (
    <div className="space-y-12 sm:space-y-16 animate-fade-in pt-2 sm:pt-4">
      {/* Title Header */}
      <div className="pb-4 border-b border-deckle">
        <span className="text-xs font-mono uppercase tracking-widest text-claret font-semibold">
          Professional Community
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl text-ink font-normal mt-1">
          Communities & Initiatives
        </h1>
        <p className="text-xs sm:text-sm text-ink-muted font-reading font-light mt-1">
          Academic associations, research centres, professional memberships, institutional publications, and institutional partnerships.
        </p>
      </div>

      {/* Subtab Navigation Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-xs">
        {[
          { id: 'associations', label: 'Associations I Lead (ELEF)' },
          { id: 'centres', label: 'Centres I Coordinate (CAIELE, RDC)' },
          { id: 'memberships', label: `Memberships (${MEMBERSHIPS.length})` },
          { id: 'institutional-publications', label: 'Institutional Publications' },
          { id: 'mous', label: 'MoUs & Collaborations' }
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
      {/* 1. ASSOCIATIONS I LEAD (ELEF)                            */}
      {/* ========================================================= */}
      <section id="associations" className="folio-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 bg-white border border-deckle shadow-book space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-deckle pb-3">
          <div className="flex items-center gap-2 text-claret">
            <Layers className="w-5 h-5 shrink-0" />
            <h2 className="font-serif text-xl sm:text-2xl text-ink font-normal">
              English Language Education Forum (ELEF)
            </h2>
          </div>
          <span className="px-3 py-1 rounded-full bg-claret-soft text-claret text-xs font-mono font-bold self-start sm:self-auto border border-claret/20">
            Convener: Dr. Rajnikant S. Dodiya
          </span>
        </div>

        <p className="text-xs sm:text-sm text-ink-muted font-reading font-light leading-relaxed">
          The English Language Education Forum (ELEF) is an academic initiative established at HMPIETR dedicated to fostering professional dialogue among English language educators, researchers, and school practitioners. As Convener, Dr. Dodiya directs academic colloquia, webinar series, and the annual publication program.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-parchment-warm/70 border border-deckle space-y-2">
            <h3 className="font-serif text-sm font-medium text-ink flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-claret" /> Focus & Core Mandate
            </h3>
            <ul className="text-xs text-ink-muted space-y-1.5 pl-6 list-disc">
              <li>Curating national webinars and expert masterclasses in English language pedagogy.</li>
              <li>Providing an academic platform for teacher-educators to share classroom innovations.</li>
              <li>Promoting research on context-sensitive post-method teaching in Indian classrooms.</li>
            </ul>
          </div>

          <div className="p-4 rounded-2xl bg-parchment-warm/70 border border-deckle space-y-2">
            <h3 className="font-serif text-sm font-medium text-ink flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-claret" /> Editorial Publications
            </h3>
            <ul className="text-xs text-ink-muted space-y-1.5 pl-6 list-disc">
              <li>Publication of the peer-reviewed <span className="font-medium text-ink">ELEF Annual Journal</span>.</li>
              <li>Publication of thematic edited volumes under the <span className="font-medium text-ink">ELEF Book Series</span>.</li>
              <li>Dissemination of peer-reviewed ELT research to colleges across Gujarat and India.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. CENTRES I COORDINATE (CAIELE & RDC)                   */}
      {/* ========================================================= */}
      <section id="centres" className="space-y-6">
        <div className="pb-2 border-b border-deckle flex items-center justify-between">
          <div className="flex items-center gap-2 text-claret">
            <Building2 className="w-5 h-5 shrink-0" />
            <h2 className="font-serif text-xl sm:text-2xl text-ink font-normal">
              Centres I Coordinate at HMPIETR
            </h2>
          </div>
          <span className="text-xs font-mono text-ink-muted">Techno-Pedagogy & Research Culture</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* CAIELE Card */}
          <div className="p-6 rounded-2xl bg-white border border-deckle shadow-book space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-claret font-bold bg-claret-soft px-2 py-0.5 rounded">
                  Coordinator
                </span>
                <span className="text-xs font-mono text-ink-muted">HMPIETR Initiative</span>
              </div>
              <h3 className="font-serif text-lg text-ink font-medium">
                Centre for AI in English Language Education (CAIELE)
              </h3>
              <p className="text-xs text-ink-muted font-reading leading-relaxed">
                CAIELE was launched to investigate the transformative role of Artificial Intelligence in language teaching, automated feedback, and teacher education. Dr. Dodiya leads faculty workshops, prompts engineering modules for language teachers, and ethical AI integration frameworks aligned with NEP 2020.
              </p>
            </div>
            <div className="pt-3 border-t border-deckle/60 text-xs text-ink font-mono flex items-center justify-between">
              <span>Status: Active & Expanding</span>
              <span className="text-claret font-medium">Workshops Ongoing</span>
            </div>
          </div>

          {/* RDC Card */}
          <div className="p-6 rounded-2xl bg-white border border-deckle shadow-book space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-blue-800 font-bold bg-blue-50 px-2 py-0.5 rounded">
                  Coordinator
                </span>
                <span className="text-xs font-mono text-ink-muted">Institutional Stewardship</span>
              </div>
              <h3 className="font-serif text-lg text-ink font-medium">
                Research & Development Cell (RDC)
              </h3>
              <p className="text-xs text-ink-muted font-reading leading-relaxed">
                Established under UGC guidelines to nurture an active research ecosystem, promote faculty scholarly publishing, maintain academic integrity standards, and facilitate doctoral and post-graduate inquiry at HMPIETR.
              </p>
            </div>
            <div className="pt-3 border-t border-deckle/60 text-xs text-ink font-mono flex items-center justify-between">
              <span>Status: Institutional Mandate</span>
              <span className="text-blue-800 font-medium">UGC Compliant</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. PROFESSIONAL MEMBERSHIPS (6 ASSOCIATIONS)              */}
      {/* ========================================================= */}
      <section id="memberships" className="space-y-6">
        <div className="pb-2 border-b border-deckle flex items-center justify-between">
          <div className="flex items-center gap-2 text-claret">
            <Award className="w-5 h-5 shrink-0" />
            <h2 className="font-serif text-xl sm:text-2xl text-ink font-normal">
              Professional Memberships ({MEMBERSHIPS.length})
            </h2>
          </div>
          <span className="text-xs font-mono text-ink-muted">National & International Bodies</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MEMBERSHIPS.map((mem, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-white border border-deckle shadow-book space-y-2 flex flex-col justify-between"
            >
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-claret font-bold bg-claret-soft px-2 py-0.5 rounded inline-block">
                  {mem.type}
                </span>
                <h3 className="font-serif text-sm font-medium text-ink leading-snug pt-1">
                  {mem.association}
                </h3>
              </div>
              <div className="pt-2 border-t border-deckle/60 flex items-center gap-1.5 text-[11px] text-ink-faint">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Verified Standing</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. INSTITUTIONAL PUBLICATIONS (SEPARATE FROM PERSONAL)    */}
      {/* ========================================================= */}
      <section id="institutional-publications" className="space-y-6">
        <div className="pb-2 border-b border-deckle flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div className="flex items-center gap-2 text-claret">
            <FileText className="w-5 h-5 shrink-0" />
            <h2 className="font-serif text-xl sm:text-2xl text-ink font-normal">
              Institutional Publications & Newsletters
            </h2>
          </div>
          <span className="text-xs font-mono text-ink-muted">
            Institutional Editorial Stewardship (HMPIETR / ELEF)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {institutionalPublications.map((pub, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-white border border-deckle shadow-book space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-claret font-bold">{pub.role}</span>
                  <span className="text-ink-muted text-[11px]">{pub.frequency}</span>
                </div>
                <h3 className="font-serif text-base text-ink font-medium leading-snug">
                  {pub.title}
                </h3>
                <p className="text-xs text-ink-muted font-reading leading-relaxed">
                  {pub.desc}
                </p>
              </div>
              <div className="pt-2 border-t border-deckle/60 text-[11px] font-mono text-ink-faint">
                Publisher: {pub.publisher}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 5. MOUS & COLLABORATIONS                                  */}
      {/* ========================================================= */}
      <section id="mous" className="space-y-6">
        <div className="pb-2 border-b border-deckle flex items-center justify-between">
          <div className="flex items-center gap-2 text-claret">
            <Handshake className="w-5 h-5 shrink-0" />
            <h2 className="font-serif text-xl sm:text-2xl text-ink font-normal">
              MoUs & Academic Collaborations
            </h2>
          </div>
          <span className="text-xs font-mono text-ink-muted">Institutional Partnerships</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mous.map((mou, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-white border border-deckle shadow-book space-y-2"
            >
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-blue-800 bg-blue-50 px-2 py-0.5 rounded font-semibold text-[11px]">
                  {mou.type}
                </span>
                <span className="text-emerald-700 font-medium text-[11px]">Active</span>
              </div>
              <h3 className="font-serif text-base text-ink font-medium">
                {mou.institution}
              </h3>
              <p className="text-xs text-ink-muted font-reading leading-relaxed">
                {mou.purpose}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
