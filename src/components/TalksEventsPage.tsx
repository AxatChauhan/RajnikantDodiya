import React, { useState } from 'react';
import {
  INVITED_TALKS,
  SESSION_CHAIRS,
  FDP_TRAININGS,
  Engagement,
  PROFESSOR_INFO
} from '../data/professorData';
import {
  Mic,
  Award,
  Calendar,
  Filter,
  Sparkles,
  Newspaper,
  Image as ImageIcon,
  MapPin,
  Building2,
  Users,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { MainTab } from './Navbar';

interface TalksEventsPageProps {
  subSection?: string;
  onNavigate?: (tab: MainTab, subId?: string) => void;
}

export const TalksEventsPage: React.FC<TalksEventsPageProps> = ({ subSection, onNavigate }) => {
  const [selectedLevel, setSelectedLevel] = useState<string>('All');
  const [selectedYear, setSelectedYear] = useState<string>('All');

  const years = ['All', '2026', '2025', '2024', '2023', '2022', '2021', '2020'];

  const filterEngagements = (list: Engagement[]) => {
    return list.filter(item => {
      const matchesLevel = selectedLevel === 'All' || item.level === selectedLevel;
      const matchesYear = selectedYear === 'All' || item.year.toString() === selectedYear;
      return matchesLevel && matchesYear;
    });
  };

  const filteredLectures = filterEngagements(INVITED_TALKS);
  const filteredChairs = filterEngagements(SESSION_CHAIRS);

  // Events Organised at HMPIETR & Partner Institutions
  const eventsOrganised = [
    {
      title: 'National Workshop on AI in English Language Education (CAIELE)',
      role: 'Convener & Coordinator',
      year: '2026',
      venue: 'H. M. Patel Institute of English Training and Research',
      desc: 'Hands-on faculty and scholar training on generative AI prompting, language pedagogy evaluation, and automated feedback tools.'
    },
    {
      title: 'ELEF National Webinar & Colloquium Series',
      role: 'Convener, English Language Education Forum',
      year: '2025–2026',
      venue: 'Virtual & Hybrid Sessions, HMPIETR',
      desc: 'Curated national lecture series bringing together English pedagogy experts, teacher-educators, and research scholars across India.'
    },
    {
      title: 'Student Induction Programme (SIP) for Teacher-Trainees',
      role: 'SIP Coordinator',
      year: '2024–2026',
      venue: 'HMPIETR, Sardar Patel University',
      desc: 'Coordinating academic orientation, micro-teaching foundation modules, and library/techno-pedagogy immersion for incoming B.Ed. English trainees.'
    },
    {
      title: 'Internal Quality Assurance Cell (IQAC) Quality Benchmark Seminars',
      role: 'IQAC Coordinator',
      year: '2021–2026',
      venue: 'HMPIETR, Vallabh Vidyanagar',
      desc: 'Annual institutional quality audits, NAAC criteria benchmarks, documentation workshops, and academic planning sessions.'
    },
    {
      title: 'One-Week Training: Basic Interpersonal Communication Skills (BICS) for Bilingual Teachers',
      role: 'Organiser & Resource Person',
      year: '2022',
      venue: 'HMPIETR',
      desc: 'Intensive communicative language training workshop for primary and secondary bilingual school teachers.'
    }
  ];

  // Media & Press Features
  const mediaCoverage = [
    {
      date: 'October 2026',
      outlet: 'ELTAI Newsletter & Conference Gazette',
      title: 'Dr. Rajnikant Dodiya Chairs ELTAI Pune Technical Session on English Pedagogy',
      desc: 'Coverage of scholarly presentations on post-method pedagogy in Indian teacher-education classrooms at the Pune International Conference.'
    },
    {
      date: 'August 2026',
      outlet: 'University Press / Local Media, Anand',
      title: 'Sardar Patel College of Education Hosts Workshop on English Communication Skills',
      desc: 'Dr. Dodiya delivered expert address to teacher-trainees on developing receptive and productive language competencies.'
    },
    {
      date: 'May 2022',
      outlet: 'Academic Studies Congress Gazette (Türkiye)',
      title: 'International Academic Studies Congress: Global Session Chair Appointments',
      desc: 'Dr. Rajnikant S. Dodiya appointed session chair for educational sciences and language methodology panels.'
    },
    {
      date: '2020–2025',
      outlet: 'HMPIETR Quarterly & Sardar Patel University Bulletin',
      title: 'Editorial Release of ELEF Journal and Comparative Studies Volume',
      desc: 'Highlighting faculty publications and academic book releases edited by Dr. Dodiya.'
    }
  ];

  // Photo Gallery Album Items
  const galleryItems = [
    {
      title: 'ELTAI International Conference, Pune',
      year: '2026',
      category: 'Conference Chairing',
      caption: 'Chairing session and presenting paper on Decolonizing English Language Pedagogy.'
    },
    {
      title: 'Academic Studies Congress, Osmaniye Korkut Ata University, Türkiye',
      year: '2022',
      category: 'International Session Chair',
      caption: 'Virtual session chairing for international educational researchers.'
    },
    {
      title: 'HMPIETR Faculty Development & CAIELE Workshops',
      year: '2026',
      category: 'Workshops Organised',
      caption: 'Teacher-educators exploring AI tools and curriculum design in the language laboratory.'
    },
    {
      title: 'Student Induction & Career Mentorship Programme',
      year: '2025–2026',
      category: 'Student Mentorship',
      caption: 'Guiding B.Ed. English pedagogy students at HMPIETR on academic career pathways.'
    },
    {
      title: 'UGC-MMTTC Orientation & Refresher Programmes',
      year: '2025–2026',
      category: 'Faculty Training',
      caption: 'Participation in UGC-HRDC and MMTTC national refresher courses.'
    },
    {
      title: 'Book Release: Comparative Studies in Knowledge Systems',
      year: '2025',
      category: 'Editorial Launch',
      caption: 'Release of the edited volume published by HMPIETR.'
    }
  ];

  return (
    <div className="space-y-12 sm:space-y-16 animate-fade-in pt-2 sm:pt-4">
      {/* Title Header */}
      <div className="pb-4 border-b border-deckle">
        <span className="text-xs font-mono uppercase tracking-widest text-claret font-semibold">
          Academic Outreach
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl text-ink font-normal mt-1">
          Talks & Events
        </h1>
        <p className="text-xs sm:text-sm text-ink-muted font-reading font-light mt-1">
          Invited expert lectures, conference session chairing, institutional events organised, media coverage, and photo gallery.
        </p>
      </div>

      {/* Subtab Navigation Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-xs">
        {[
          { id: 'lectures', label: `Invited Lectures (${INVITED_TALKS.length})` },
          { id: 'conferences-chaired', label: `Conferences Chaired (${SESSION_CHAIRS.length})` },
          { id: 'events-organised', label: `Events Organised (${eventsOrganised.length})` },
          { id: 'media', label: `Media & Press (${mediaCoverage.length})` },
          { id: 'gallery', label: 'Photo Gallery' }
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

      {/* Interactive Filter Bar */}
      <div className="p-4 rounded-2xl bg-white border border-deckle shadow-book space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono text-ink font-semibold uppercase">
          <Filter className="w-4 h-4 text-claret shrink-0" />
          <span>Filter Lectures & Sessions by Level and Year</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          {/* Level Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-ink-muted font-medium">Level:</span>
            {['All', 'State', 'National', 'International'].map(lvl => (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  selectedLevel === lvl
                    ? 'bg-claret text-white shadow-xs'
                    : 'bg-parchment-warm/80 text-ink-muted hover:bg-parchment-warm'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          {/* Year Filter */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-ink-muted font-medium">Year:</span>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
              className="px-3 py-1 rounded-lg bg-parchment-warm/80 border border-deckle text-ink text-xs focus:outline-none focus:border-claret font-mono"
            >
              {years.map(y => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. INVITED LECTURES (22 TALKS)                           */}
      {/* ========================================================= */}
      <section id="lectures" className="space-y-6">
        <div className="pb-2 border-b border-deckle flex items-center justify-between">
          <div className="flex items-center gap-2 text-claret">
            <Mic className="w-5 h-5 shrink-0" />
            <h2 className="font-serif text-xl sm:text-2xl text-ink font-normal">
              Invited Lectures & Resource Person Sessions ({filteredLectures.length})
            </h2>
          </div>
          <span className="text-xs font-mono text-ink-muted">State & National Universities</span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-deckle bg-white shadow-book">
          <table className="w-full text-left text-xs text-ink min-w-[620px]">
            <thead className="bg-parchment-warm/80 text-ink-muted border-b border-deckle font-mono text-[11px] uppercase">
              <tr>
                <th className="py-3 px-4 w-28">Date</th>
                <th className="py-3 px-4">Topic / Subject</th>
                <th className="py-3 px-4">Event & Host Institution</th>
                <th className="py-3 px-4 w-24 text-right">Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-deckle/60">
              {filteredLectures.map(talk => (
                <tr key={talk.id} className="hover:bg-parchment-warm/40 transition-colors">
                  <td className="py-3 px-4 font-mono text-ink-muted align-top whitespace-nowrap">
                    {talk.date}
                  </td>
                  <td className="py-3 px-4 font-reading font-medium text-ink align-top">
                    {talk.topic}
                  </td>
                  <td className="py-3 px-4 text-ink-muted font-reading align-top">
                    {talk.event}
                  </td>
                  <td className="py-3 px-4 text-right align-top">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        talk.level === 'National'
                          ? 'bg-blue-50 text-blue-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {talk.level}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. CONFERENCES CHAIRED (10 SESSIONS)                     */}
      {/* ========================================================= */}
      <section id="conferences-chaired" className="space-y-6">
        <div className="pb-2 border-b border-deckle flex items-center justify-between">
          <div className="flex items-center gap-2 text-claret">
            <Award className="w-5 h-5 shrink-0" />
            <h2 className="font-serif text-xl sm:text-2xl text-ink font-normal">
              Conferences Chaired & Presided ({filteredChairs.length})
            </h2>
          </div>
          <span className="text-xs font-mono text-ink-muted">National & International</span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-deckle bg-white shadow-book">
          <table className="w-full text-left text-xs text-ink min-w-[620px]">
            <thead className="bg-parchment-warm/80 text-ink-muted border-b border-deckle font-mono text-[11px] uppercase">
              <tr>
                <th className="py-3 px-4 w-28">Date</th>
                <th className="py-3 px-4">Session Theme</th>
                <th className="py-3 px-4">Conference / Host Institution</th>
                <th className="py-3 px-4 w-28 text-right">Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-deckle/60">
              {filteredChairs.map(chair => (
                <tr key={chair.id} className="hover:bg-parchment-warm/40 transition-colors">
                  <td className="py-3 px-4 font-mono text-ink-muted align-top whitespace-nowrap">
                    {chair.date}
                  </td>
                  <td className="py-3 px-4 font-reading font-medium text-ink align-top">
                    {chair.topic}
                  </td>
                  <td className="py-3 px-4 text-ink-muted font-reading align-top">
                    {chair.event}
                  </td>
                  <td className="py-3 px-4 text-right align-top">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        chair.level === 'International'
                          ? 'bg-claret-soft text-claret'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {chair.level}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. EVENTS ORGANISED (WORKSHOPS & WEBINARS)               */}
      {/* ========================================================= */}
      <section id="events-organised" className="space-y-6">
        <div className="pb-2 border-b border-deckle flex items-center justify-between">
          <div className="flex items-center gap-2 text-claret">
            <Calendar className="w-5 h-5 shrink-0" />
            <h2 className="font-serif text-xl sm:text-2xl text-ink font-normal">
              Events Organised & Curated ({eventsOrganised.length})
            </h2>
          </div>
          <span className="text-xs font-mono text-ink-muted">HMPIETR & Academic Forums</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {eventsOrganised.map((evt, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-white border border-deckle shadow-book space-y-2 flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-claret font-semibold">{evt.role}</span>
                  <span className="text-ink-muted">{evt.year}</span>
                </div>
                <h3 className="font-serif text-base sm:text-lg text-ink font-medium leading-snug">
                  {evt.title}
                </h3>
                <p className="text-xs text-ink-muted font-reading leading-relaxed">
                  {evt.desc}
                </p>
              </div>
              <div className="pt-2 border-t border-deckle/60 flex items-center gap-1.5 text-[11px] text-ink-faint">
                <MapPin className="w-3.5 h-3.5 text-claret shrink-0" />
                <span>{evt.venue}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. MEDIA & PRESS                                          */}
      {/* ========================================================= */}
      <section id="media" className="space-y-6">
        <div className="pb-2 border-b border-deckle flex items-center justify-between">
          <div className="flex items-center gap-2 text-claret">
            <Newspaper className="w-5 h-5 shrink-0" />
            <h2 className="font-serif text-xl sm:text-2xl text-ink font-normal">
              Media Coverage & Institutional Press
            </h2>
          </div>
          <span className="text-xs font-mono text-ink-muted">Academic Reporting</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mediaCoverage.map((item, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-white border border-deckle shadow-book space-y-2"
            >
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-blue-800 bg-blue-50 px-2 py-0.5 rounded font-semibold text-[11px]">
                  {item.outlet}
                </span>
                <span className="text-ink-muted">{item.date}</span>
              </div>
              <h3 className="font-serif text-base text-ink font-medium leading-snug">
                {item.title}
              </h3>
              <p className="text-xs text-ink-muted font-reading leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 5. PHOTO GALLERY                                          */}
      {/* ========================================================= */}
      <section id="gallery" className="space-y-6">
        <div className="pb-2 border-b border-deckle flex items-center justify-between">
          <div className="flex items-center gap-2 text-claret">
            <ImageIcon className="w-5 h-5 shrink-0" />
            <h2 className="font-serif text-xl sm:text-2xl text-ink font-normal">
              Photo Gallery & Academic Albums
            </h2>
          </div>
          <span className="text-xs font-mono text-ink-muted">Milestone Archives</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {galleryItems.map((item, idx) => (
            <div
              key={idx}
              className="group rounded-2xl bg-white border border-deckle shadow-book overflow-hidden hover:border-claret/50 transition-all flex flex-col"
            >
              {/* Photo Card Visual Header */}
              <div className="h-36 bg-gradient-to-br from-parchment-warm via-[#F0EBE1] to-claret-soft/30 flex items-center justify-center p-4 relative border-b border-deckle/60">
                <div className="w-12 h-12 rounded-2xl bg-white/80 border border-deckle flex items-center justify-center text-claret shadow-xs group-hover:scale-105 transition-transform">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <span className="absolute top-3 right-3 text-[10px] font-mono font-bold bg-white/90 text-claret px-2 py-0.5 rounded-full border border-deckle">
                  {item.year}
                </span>
              </div>

              {/* Photo Information */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted block">
                    {item.category}
                  </span>
                  <h3 className="font-serif text-sm font-medium text-ink leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs text-ink-muted font-reading leading-relaxed">
                    {item.caption}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
