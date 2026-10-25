import React, { useState } from 'react';
import { PROFESSOR_INFO, SOCIAL_LINKS } from '../data/professorData';
import { useSiteContent } from '../contexts/SiteContentContext';
import {
  Mail,
  MapPin,
  Globe,
  Send,
  CheckCircle2,
  Feather,
  Loader2,
  AlertCircle,
  ExternalLink,
  Mic,
  Handshake,
  MessageSquare,
  Building2,
  ShieldCheck
} from 'lucide-react';

interface ContactPageProps {
  subSection?: string;
}

export const ContactPage: React.FC<ContactPageProps> = ({ subSection }) => {
  const { profile } = useSiteContent();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    category: 'Speaker Invitation',
    institution: '',
    message: ''
  });

  const recipientEmail = profile.email || PROFESSOR_INFO.email;
  const professorName = profile.name || PROFESSOR_INFO.name;
  const professorTitle = profile.title || PROFESSOR_INFO.title;
  const professorInstitution = profile.institution || PROFESSOR_INFO.institution;
  const professorLocation = profile.location || PROFESSOR_INFO.location;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Spam honeypot trap
    if (honeypot) {
      setSubmitted(true);
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(recipientEmail)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          institution: formData.institution,
          category: formData.category,
          subject: formData.subject,
          message: formData.message,
          _subject: `[Academic Contact - ${formData.category}] ${formData.subject} (from ${formData.name})`,
          _replyto: formData.email,
          _template: 'table',
          _captcha: 'false'
        })
      });

      const result = await response.json().catch(() => null);

      if (response.ok && (result?.success === true || result?.success === 'true' || response.status === 200)) {
        setSubmitted(true);
      } else {
        const errorText =
          result?.message ||
          'Unable to submit your message at this moment. Please email directly to rajnikantdodiya2@gmail.com.';
        setErrorMessage(errorText);
      }
    } catch (err: unknown) {
      console.error('Contact form submission error:', err);
      setErrorMessage(
        'A network error occurred while sending your message. You can send directly using your email client.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getDirectMailtoUrl = () => {
    const subject = encodeURIComponent(`[${formData.category}] ${formData.subject || 'Academic Correspondence'}`);
    const body = encodeURIComponent(
      `Name: ${formData.name}\nEmail: ${formData.email}\nInstitution: ${formData.institution}\nCategory: ${formData.category}\n\nMessage:\n${formData.message}`
    );
    return `mailto:${recipientEmail}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="space-y-12 sm:space-y-16 animate-fade-in pt-2 sm:pt-4">
      {/* Title Header */}
      <div className="pb-4 border-b border-deckle">
        <span className="text-xs font-mono uppercase tracking-widest text-claret font-semibold">
          Get in Touch
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl text-ink font-normal mt-1">
          Contact & Collaboration
        </h1>
        <p className="text-xs sm:text-sm text-ink-muted font-reading font-light mt-1">
          Invite Dr. Dodiya as a speaker or session chair, discuss academic research collaboration, or send an inquiry.
        </p>
      </div>

      {/* Subtab Navigation Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-xs">
        {[
          { id: 'speaker', label: 'Invite Me as Speaker' },
          { id: 'collaborate', label: 'Academic Collaboration' },
          { id: 'form', label: 'Contact Form' }
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

      {/* Top 2 Action Callouts: Speaker & Collaborate */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Speaker Invitation Info */}
        <div id="speaker" className="p-6 rounded-2xl bg-white border border-deckle shadow-book space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-claret">
              <Mic className="w-5 h-5 shrink-0" />
              <h2 className="font-serif text-lg sm:text-xl text-ink font-medium">
                Invite Dr. Dodiya as a Speaker
              </h2>
            </div>
            <p className="text-xs text-ink-muted font-reading leading-relaxed">
              Dr. Dodiya has delivered 22 invited lectures and chaired 10 conference sessions across state, national, and international forums. Keynote domains include:
            </p>
            <ul className="text-xs text-ink-muted space-y-1 pl-5 list-disc font-reading">
              <li>Post-Method Pedagogy & Context-Sensitive Language Teaching</li>
              <li>Artificial Intelligence in Second-Language Classrooms (CAIELE)</li>
              <li>NEP 2020: Translanguaging & Multilingual Education</li>
              <li>UGC-NET & GSET English / Education Preparation Strategies</li>
              <li>Teacher Education Quality Benchmarks & NAAC Criteria</li>
            </ul>
          </div>

          <a
            href="#form"
            onClick={() => setFormData({ ...formData, category: 'Speaker Invitation' })}
            className="inline-flex items-center gap-1.5 text-xs text-claret font-medium hover:underline pt-2 border-t border-deckle/60"
          >
            Fill Speaker Invitation Details Below ↓
          </a>
        </div>

        {/* Academic Collaboration Info */}
        <div id="collaborate" className="p-6 rounded-2xl bg-white border border-deckle shadow-book space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-claret">
              <Handshake className="w-5 h-5 shrink-0" />
              <h2 className="font-serif text-lg sm:text-xl text-ink font-medium">
                Academic & Research Collaboration
              </h2>
            </div>
            <p className="text-xs text-ink-muted font-reading leading-relaxed">
              Open to collaborative research projects, co-authoring empirical articles, editing thematic book volumes, and organizing joint webinars:
            </p>
            <ul className="text-xs text-ink-muted space-y-1 pl-5 list-disc font-reading">
              <li>Joint research on English language teacher education</li>
              <li>Upcoming edited books and calls for book chapters</li>
              <li>ELEF webinars & institutional colloquia partnerships</li>
              <li>Techno-pedagogical experiments and language lab testing</li>
            </ul>
          </div>

          <a
            href="#form"
            onClick={() => setFormData({ ...formData, category: 'Research Collaboration' })}
            className="inline-flex items-center gap-1.5 text-xs text-claret font-medium hover:underline pt-2 border-t border-deckle/60"
          >
            Submit Collaboration Proposal Below ↓
          </a>
        </div>
      </div>

      {/* Main Contact Section */}
      <div id="form" className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Contact Info Card (NO public phone number per client instructions!) */}
        <div className="lg:col-span-5 folio-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 bg-white border border-deckle shadow-book space-y-6">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-claret font-bold">
              Official Academic Contact
            </span>
            <h3 className="font-serif text-2xl text-ink font-normal">{professorName}</h3>
            <p className="text-xs text-claret font-mono font-semibold">{professorTitle}</p>
          </div>

          <div className="space-y-4 text-xs font-sans text-ink-muted">
            <div className="flex items-start gap-3">
              <Building2 className="w-4 h-4 text-claret shrink-0 mt-0.5" />
              <div>
                <strong className="font-medium text-ink block mb-0.5">Department & Institution:</strong>
                <p className="font-light leading-relaxed">{professorInstitution}</p>
                <p className="font-light leading-relaxed">{PROFESSOR_INFO.university}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-claret shrink-0 mt-0.5" />
              <div>
                <strong className="font-medium text-ink block mb-0.5">Location:</strong>
                <p className="font-light leading-relaxed">{professorLocation}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="w-4 h-4 text-claret shrink-0 mt-0.5" />
              <div>
                <strong className="font-medium text-ink block mb-0.5">Email (Primary for Inquiries):</strong>
                <a
                  href={`mailto:${recipientEmail}`}
                  className="text-claret font-mono underline hover:text-claret-dark block break-all font-medium"
                >
                  {recipientEmail}
                </a>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-parchment-warm/80 border border-deckle space-y-2 text-xs text-ink-muted font-reading">
            <strong className="text-ink font-serif font-medium block">Privacy & Security Note:</strong>
            <p className="leading-relaxed text-[11px]">
              To protect academic privacy and avoid unsolicited spam, telephone contact is shared only upon verified academic appointment. Please use the contact form or primary email for initial correspondence.
            </p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-7 folio-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 bg-white border border-deckle shadow-book">
          <h3 className="font-serif text-xl sm:text-2xl text-ink font-normal mb-5">
            Send an Academic Message
          </h3>

          {submitted ? (
            <div className="p-6 sm:p-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-700 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="font-serif text-xl sm:text-2xl text-ink font-normal">
                Message Dispatched
              </h4>
              <p className="text-xs text-ink-muted max-w-md mx-auto font-reading leading-relaxed">
                Thank you, {formData.name}. Your correspondence regarding{' '}
                <span className="font-medium text-ink">"{formData.subject || formData.category}"</span> has been dispatched to Dr. Dodiya’s email (<span className="font-mono text-ink text-[11px]">{recipientEmail}</span>).
              </p>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setErrorMessage(null);
                  setFormData({
                    name: '',
                    email: '',
                    institution: '',
                    subject: '',
                    category: 'Speaker Invitation',
                    message: ''
                  });
                }}
                className="mt-4 px-6 py-2.5 rounded-xl bg-claret hover:bg-claret-dark text-white text-xs font-medium min-h-[44px] transition-colors"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
              {/* Anti-spam honeypot */}
              <div className="hidden" aria-hidden="true">
                <input
                  id="_honey"
                  type="text"
                  name="_honey"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={e => setHoneypot(e.target.value)}
                />
              </div>

              {errorMessage && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">{errorMessage}</p>
                  </div>
                  <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between flex-wrap gap-2">
                    <span className="text-[11px] text-amber-800">Prefer sending directly from your mailbox?</span>
                    <a
                      href={getDirectMailtoUrl()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-claret hover:bg-claret-dark text-white font-medium text-[11px] transition-colors"
                    >
                      <span>Open in Email App</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-ink font-medium block mb-1">Your Full Name & Designation *</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Prof. / Dr. / Scholar Name"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-parchment-warm/60 border border-deckle text-ink placeholder-ink-faint focus:outline-none focus:border-claret min-h-[44px] text-base sm:text-xs"
                  />
                </div>

                <div>
                  <label className="text-ink font-medium block mb-1">Your Email Address *</label>
                  <input
                    required
                    type="email"
                    placeholder="scholar@university.edu"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-parchment-warm/60 border border-deckle text-ink placeholder-ink-faint focus:outline-none focus:border-claret min-h-[44px] text-base sm:text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-ink font-medium block mb-1">Institution / University</label>
                  <input
                    type="text"
                    placeholder="e.g. Dept. of English, SPU"
                    value={formData.institution}
                    onChange={e => setFormData({ ...formData, institution: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-parchment-warm/60 border border-deckle text-ink placeholder-ink-faint focus:outline-none focus:border-claret min-h-[44px] text-base sm:text-xs"
                  />
                </div>

                <div>
                  <label className="text-ink font-medium block mb-1">Inquiry Purpose</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-parchment-warm/60 border border-deckle text-ink focus:outline-none focus:border-claret min-h-[44px] text-base sm:text-xs"
                  >
                    <option value="Speaker Invitation">Invite as Speaker / Keynote</option>
                    <option value="Conference Session Chair">Conference Session Chairing</option>
                    <option value="Research Collaboration">Academic & Research Collaboration</option>
                    <option value="ELEF / CAIELE Program">ELEF / CAIELE Program Inquiry</option>
                    <option value="Book Chapter / Editorial">Book Chapter / Editorial Inquiry</option>
                    <option value="General Academic Inquiry">General Academic Inquiry</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-ink font-medium block mb-1">Subject *</label>
                <input
                  required
                  type="text"
                  placeholder="Subject of correspondence"
                  value={formData.subject}
                  onChange={e => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-parchment-warm/60 border border-deckle text-ink placeholder-ink-faint focus:outline-none focus:border-claret min-h-[44px] text-base sm:text-xs"
                />
              </div>

              <div>
                <label className="text-ink font-medium block mb-1">Message Details *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Please describe your event, dates, conference theme, or academic proposal..."
                  value={formData.message}
                  onChange={e => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-parchment-warm/60 border border-deckle text-ink placeholder-ink-faint focus:outline-none focus:border-claret font-sans text-base sm:text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-claret hover:bg-claret-dark disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-medium shadow-xs flex items-center justify-center gap-2 transition-all min-h-[44px]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Transmitting Message...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Message to Dr. Dodiya</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
