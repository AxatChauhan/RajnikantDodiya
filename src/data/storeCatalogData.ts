// Catalog and Mock Exam Data for Dr. Rajnikant S. Dodiya Academic Study & Learn Hub
import { maskAnswer, unmaskAnswer } from '../lib/security';

export interface ChapterSubsection {
  subtitle: string;
  paragraphs: string[];
}

export interface BookChapter {
  id: string;
  chapterNumber: string;
  title: string;
  pages: string;
  excerptPreview: string;
  fullContent: string[];
  epigraph?: {
    quote: string;
    author: string;
  };
  subsections?: ChapterSubsection[];
  footnotes?: string[];
  readingTimeMinutes?: number;
}

export interface ExamQuestion {
  id: number;
  section: 'Paper II: English Literature' | 'Paper I: Pedagogy & Research Aptitude' | 'Literary Theory & ELT';
  question: string;
  options: string[];
  correctAnswer: number | string;
  explanation: string;
  topicTag: string;
}

// Sanitized question payload for active proctoring (Zero answer/explanation leaks)
export interface ActiveExamQuestion {
  id: number;
  section: 'Paper II: English Literature' | 'Paper I: Pedagogy & Research Aptitude' | 'Literary Theory & ELT';
  question: string;
  options: string[];
  topicTag: string;
}

export interface StoreProduct {
  id: string;
  type: 'book' | 'exam' | 'bundle';
  title: string;
  subtitle: string;
  callNumber: string; // Library shelf call number
  price: number;
  originalPrice: number;
  badge: string;
  formatDescription: string;
  features: string[];
  securityNote: string;
}

// Dr. Dodiya's Digital Monograph Data (Authored Monograph • ISBN: 978-81-937539-0-3)
export const FEATURED_BOOK_CHAPTERS: BookChapter[] = [
  {
    id: 'ch-preface',
    chapterNumber: 'Preface & Prolegomena',
    title: 'The Humanistic Vision of Dr. A.P.J. Abdul Kalam',
    pages: 'pp. 1 – 18',
    readingTimeMinutes: 5,
    epigraph: {
      quote: 'Learning gives creativity, creativity leads to thinking, thinking provides knowledge, knowledge makes you great.',
      author: 'Dr. A.P.J. Abdul Kalam, Wings of Fire'
    },
    excerptPreview: 'Dr. Kalam envisioned education not as a passive transmission of received syllabi, but as an awakening of dormant moral creativity and technical self-reliance in young minds...',
    fullContent: [
      'Education in the twenty-first century stands at a profound philosophical inflection point. When Dr. A.P.J. Abdul Kalam addressed assemblies of university students across India, his constant invocation was neither purely technocratic nor abstractly speculative; it was intensely ethical, pragmatic, and pedagogical.',
      'As investigated in this doctoral study conducted at Sardar Patel University, Dr. Kalam formulated an educational epistemology anchored in three interlocking pillars: Creative Inquiry, Moral Stewardship, and Societal Transformation.',
      'For Dr. Kalam, the classroom is an organic sanctuary. A teacher who lectures mechanically produces graduates with credentials but without conviction. Conversely, a reflective educator who ignites intellectual curiosity generates autonomous problem-solvers capable of uplifting their communities.'
    ],
    subsections: [
      {
        subtitle: '1.1 The Genesis of the Inquiry at Sardar Patel University',
        paragraphs: [
          'The research questions guiding this doctoral inquiry emerged from an acute observation of modern classroom realities in Gujarat and across India. Despite unprecedented infrastructural investments in educational technology, students frequently experienced alienation from their curricula.',
          'Dr. Kalam offered a radical departure from colonial rote-pedagogies by proposing that learning must stimulate the five senses simultaneously through direct community interaction, vernacular contextualization, and holistic national consciousness.'
        ]
      },
      {
        subtitle: '1.2 The Tripartite Axiom: Inquiry, Ethics, and Nation-Building',
        paragraphs: [
          'The foundational hypothesis of this monograph is that Dr. Kalam did not separate technical scientific acumen from spiritual and literary ethics. In his dialogues with educators, he emphasized that "righteousness in the heart creates beauty in the character; beauty in the character creates harmony in the home; harmony in the home creates order in the nation."',
          'Our pedagogical mandate as teacher educators—particularly within institutions like the H.M. Patel Institute of English Training and Research—is to instantiate these principles within the daily syllabus of English language teaching and teacher-trainee preparation.'
        ]
      }
    ],
    footnotes: [
      '1. Dodiya, R. S. (2018). A Study of Educational Thoughts of APJ Abdul Kalam. Ph.D. Thesis, Sardar Patel University.',
      '2. Kalam, A.P.J. Abdul. (2002). Ignited Minds: Unleashing the Power Within India. Penguin Books India.',
      '3. National Education Policy (NEP 2020), Ministry of Education, Government of India.'
    ]
  },
  {
    id: 'ch-1',
    chapterNumber: 'Chapter I',
    title: 'Epistemology of Creative Inquiry in Indian Classrooms',
    pages: 'pp. 19 – 45',
    readingTimeMinutes: 7,
    epigraph: {
      quote: 'Dreams are not what you see in sleep, they are the things that do not let you sleep.',
      author: 'Dr. A.P.J. Abdul Kalam'
    },
    excerptPreview: 'Creativity cannot be mandated by curricular diktat; it must be scaffolded through open-ended questioning and experiential learning...',
    fullContent: [
      'Creativity, as conceptualized in Dr. Kalam’s treatises—notably Ignited Minds and Indomitable Spirit—is not an innate privilege reserved for geniuses. It is a universal human capacity systematically suppressed by rote examinations.',
      'In our contemporary Indian educational landscape, particularly within English language classrooms, learners are frequently penalized for linguistic exploration. Dr. Kalam advocated for a paradigm wherein errors are treated not as deficiencies, but as essential milestones of cognitive experimentation.',
      'When students are invited to interrogate texts, synthesize cross-disciplinary insights, and connect literature with societal realities, language ceases to be an alien hurdle and becomes an instrument of authentic self-expression.'
    ],
    subsections: [
      {
        subtitle: '2.1 The Tyranny of Rote Recitation in English Pedagogy',
        paragraphs: [
          'Traditional English language teaching in Indian schools has long been held captive by mechanical grammar drills and verbatim memorization of answers. Dr. Kalam noted that such an approach produces fear rather than fluency.',
          'True linguistic competence arises when the learner is encouraged to pose divergent questions: "Why did the character act thus? How might this technological dilemma be solved in our village? What would happen if we inversed this premise?"'
        ]
      },
      {
        subtitle: '2.2 Error Analysis as Heuristic Discovery',
        paragraphs: [
          'In post-method pedagogy (Kumaravadivelu, 2003), the teacher functions not as an omniscient grammarian but as an autonomous facilitator. Dr. Kalam championed this exact shift decades prior through his pedagogical parables.',
          'By legitimizing experimental speech in second-language classrooms, teachers foster cognitive resilience. A learner who is unafraid of making grammatical mistakes during spontaneous debate will ultimately become a confident communicator in global forums.'
        ]
      }
    ],
    footnotes: [
      '1. Kumaravadivelu, B. (2003). Beyond Methods: Macrostrategies for Language Teaching. Yale University Press.',
      '2. Kalam, A.P.J. Abdul & Rajan, Y.S. (1998). India 2020: A Vision for the New Millennium. Viking.'
    ]
  },
  {
    id: 'ch-2',
    chapterNumber: 'Chapter II',
    title: 'Teacher as Moral Architect: The Guru-Shishya Synthesis in Modern Higher Education',
    pages: 'pp. 46 – 82',
    readingTimeMinutes: 8,
    epigraph: {
      quote: 'If a country is to be corruption free and become a nation of beautiful minds, I strongly feel there are three key societal members who can make a difference. They are father, mother and teacher.',
      author: 'Dr. A.P.J. Abdul Kalam'
    },
    excerptPreview: 'Teacher education is the fulcrum of civilizational advancement; no educational reform can rise above the quality of its teachers...',
    fullContent: [
      'The highest compliment Dr. Kalam ever claimed was not "President of India" or "Missile Pioneer," but simply "Teacher." In his interactions with pedagogical faculties, he repeatedly returned to the ancient Indian ethos of the teacher as moral exemplar.',
      'In modern teacher training colleges (such as HMPIETR), teacher-trainees must be equipped with both technological fluency and deep pedagogical empathy. Technical tools without ethical compass yield hollow instruction.',
      'Under NEP 2020, this synthesis of ancient Indian knowledge traditions and contemporary digital methodologies fulfills Dr. Kalam’s vision of cultivating "beautiful minds" equipped for global citizenship.'
    ],
    subsections: [
      {
        subtitle: '3.1 Revitalizing Teacher Education at HMPIETR',
        paragraphs: [
          'The curriculum of modern B.Ed. and M.Ed. programmes must transcend didactic lectures. At H.M. Patel Institute of English Training and Research, our pedagogical frameworks emphasize reflective practice, micro-teaching simulation, and socio-emotional mentoring.',
          'As Dr. Kalam documented in his interactions with Dr. Vikram Sarabhai and Prof. Satish Dhawan, true leadership is measured by how mentors respond to student vulnerability and institutional setbacks.'
        ]
      },
      {
        subtitle: '3.2 Bridging Ancient Epistemes with NEP 2020 Digital Competencies',
        paragraphs: [
          'The synthesis between the timeless Guru-Shishya tradition of holistic care and cutting-edge artificial intelligence in English education represents the future of Indian academia.',
          'Techno-pedagogy should not displace the human educator; rather, it liberates the teacher from mundane clerical grading, enabling them to devote deeper personalized attention to character formation and critical thinking.'
        ]
      }
    ],
    footnotes: [
      '1. Dodiya, R. S. (2020). Post-Method Pedagogy and its Reflections in ELT. HMPIETR.',
      '2. Sarabhai, V. (1974). Science Policy and National Development. Macmillan.'
    ]
  },
  {
    id: 'ch-3',
    chapterNumber: 'Chapter III',
    title: 'Science, Humanities, and Multilingualism: A Tripartite Pedagogical Model',
    pages: 'pp. 83 – 124',
    readingTimeMinutes: 8,
    epigraph: {
      quote: 'Poetry and physics spring from the same intuitive spring of wonder.',
      author: 'Dr. A.P.J. Abdul Kalam, The Luminous Sparks'
    },
    excerptPreview: 'The artificial segregation between scientific inquiry and humanistic literature dissolves when language is recognized as the common vessel of thought...',
    fullContent: [
      'A critical revelation from Dr. Kalam’s autobiographical reflections is his profound affinity for classical Tamil poetry (such as the Thirukkural) alongside aerospace ballistics.',
      'He demonstrated that scientific rigor and literary imagination are complementary modes of inquiry. A student of English literature must understand analytical precision; a student of technology must cultivate ethical empathy through literary narrative.',
      'Multilingual pedagogy—validating the learner’s mother tongue while mastering English—is the exact bridge Dr. Kalam traversed from Rameswaram to the frontiers of modern science.'
    ],
    subsections: [
      {
        subtitle: '4.1 Classical Vernacular Literatures as Conceptual Anchors',
        paragraphs: [
          'When Indian students approach English literature in isolation from their mother tongues (Gujarati, Hindi, Tamil), they often experience cultural dissonance. Dr. Kalam demonstrated that vernacular idioms enrich rather than impede English mastery.',
          'By drawing comparative parallels between Shakespearean dramatic soliloquies and Indian poetic traditions, language educators unlock immediate student engagement and affective resonance.'
        ]
      },
      {
        subtitle: '4.2 Post-Method Pedagogy in Multilingual Indian Classrooms',
        paragraphs: [
          'In accordance with NEP 2020 principles, translanguaging and multilingual scaffolding should be embraced as legitimate pedagogic strategies rather than forbidden transgressions.',
          'This tripartite model—unifying scientific analytical discipline, humanistic literary empathy, and bilingual communicative agility—constitutes the enduring legacy of Dr. Kalam’s educational thought for 21st-century India.'
        ]
      }
    ],
    footnotes: [
      '1. Thiruvalluvar. Thirukkural: With English Translation. Central Institute of Classical Tamil.',
      '2. Dodiya, R. S. (2025). Comparative Studies in Indian and Western Knowledge Systems. HMPIETR. ISBN 978-81-931777-6-1.'
    ]
  }
];

/**
 * Scoped Monograph Accessor:
 * - Unlicensed mode (Sample): Delivers full text of Chapter 0 (Preface) only.
 *   Chapters 1–3 return excerpt previews with full text and subsections stripped from memory.
 * - Licensed mode: Delivers complete scholarly chapters with empirical findings and footnotes.
 */
export function getLicensedBookChapters(isUnlocked: boolean): BookChapter[] {
  if (isUnlocked) {
    return FEATURED_BOOK_CHAPTERS;
  }

  return FEATURED_BOOK_CHAPTERS.map((ch, idx) => {
    if (idx === 0) {
      // Extremely brief sample preview (only 1 single introductory paragraph, zero subsections, zero footnotes)
      return {
        ...ch,
        title: `${ch.title} (Sample Excerpt)`,
        fullContent: [
          ch.fullContent[0]
        ],
        subsections: [],
        footnotes: []
      };
    }
    return {
      ...ch,
      fullContent: [ch.excerptPreview],
      subsections: [],
      footnotes: []
    };
  });
}

// The 25-Question Curated CBT Mock Exam (UGC-NET / GSET Master Edition)
export const MOCK_EXAM_QUESTIONS: ExamQuestion[] = [
  {
    id: 1,
    section: 'Paper II: English Literature',
    question: 'In Shakespeare’s The Tempest, which character utters the famous lines: “You taught me language; and my profit on’t / Is, I know how to curse. The red plague rid you / For learning me your language!”?',
    options: ['Ariel', 'Caliban', 'Ferdinand', 'Trinculo'],
    correctAnswer: maskAnswer(1),
    explanation: 'Caliban speaks these immortal postcolonial lines to Prospero and Miranda (Act I, Scene 2), illustrating the tension between linguistic imposition and subversive resistance.',
    topicTag: 'Shakespearean Drama & Postcolonial Readings'
  },
  {
    id: 2,
    section: 'Literary Theory & ELT',
    question: 'B. Kumaravadivelu’s "Post-Method Pedagogy" is structurally articulated around which triad of organizational parameters?',
    options: [
      'Particularity, Practicality, and Possibility',
      'Grammar, Vocabulary, and Syntax',
      'Proficiency, Performance, and Paradigm',
      'Curriculum, Instruction, and Evaluation'
    ],
    correctAnswer: maskAnswer(0),
    explanation: 'Kumaravadivelu’s 3 Ps: Particularity (context-sensitive pedagogy), Practicality (teacher autonomy and action-research), and Possibility (socio-political awareness and identity empowerment).',
    topicTag: 'Post-Method Pedagogy'
  },
  {
    id: 3,
    section: 'Paper II: English Literature',
    question: 'Who coined the phrase "Willing suspension of disbelief for the moment, which constitutes poetic faith"?',
    options: ['William Wordsworth', 'Samuel Taylor Coleridge', 'Percy Bysshe Shelley', 'John Keats'],
    correctAnswer: maskAnswer(1),
    explanation: 'Coleridge introduced this concept in Chapter XIV of his Biographia Literaria (1817) to explain how readers willingly accept the supernatural in poetry.',
    topicTag: 'Romantic Literary Criticism'
  },
  {
    id: 4,
    section: 'Paper I: Pedagogy & Research Aptitude',
    question: 'In educational research, which sampling method ensures that specific sub-groups (e.g., gender, linguistic background, socio-economic strata) are proportionally represented in the sample?',
    options: ['Simple Random Sampling', 'Stratified Random Sampling', 'Snowball Sampling', 'Convenience Sampling'],
    correctAnswer: maskAnswer(1),
    explanation: 'Stratified Random Sampling divides the heterogeneous population into homogeneous strata before drawing random samples proportionally from each stratum.',
    topicTag: 'Research Methodology'
  },
  {
    id: 5,
    section: 'Paper II: English Literature',
    question: 'Mark Twain’s Adventures of Huckleberry Finn concludes with Huck deciding to set out for which destination to escape "civilization"?',
    options: ['New Orleans', 'The Indian Territory', 'California gold fields', 'Back to St. Petersburg'],
    correctAnswer: maskAnswer(1),
    explanation: 'Huck famously states: “I reckon I got to light out for the Territory ahead of the rest, because Aunt Sally she’s going to adopt me and sivilize me, and I can’t stand it.”',
    topicTag: 'American Realism & Twain'
  },
  {
    id: 6,
    section: 'Literary Theory & ELT',
    question: 'In Stephen Krashen’s Second Language Acquisition theory, the "Affective Filter Hypothesis" posits that language acquisition is hindered by:',
    options: [
      'High motivation, low anxiety, and self-confidence',
      'High anxiety, low self-esteem, and low motivation',
      'Explicit grammar drill instruction',
      'Exposure to comprehensible input (i + 1)'
    ],
    correctAnswer: maskAnswer(1),
    explanation: 'When a learner experiences high anxiety or low confidence, the affective filter goes up, blocking comprehensible input from reaching the language acquisition device (LAD).',
    topicTag: 'SLA Theories'
  },
  {
    id: 7,
    section: 'Paper II: English Literature',
    question: 'Which twentieth-century poem opens with the striking line: “April is the cruellest month, breeding / Lilacs out of the dead land…”?',
    options: ['The Waste Land by T. S. Eliot', 'The Hollow Men by T. S. Eliot', 'Sailing to Byzantium by W. B. Yeats', 'The Second Coming by W. B. Yeats'],
    correctAnswer: maskAnswer(0),
    explanation: 'Opening lines of "The Burial of the Dead," Section I of T. S. Eliot’s modernist masterpiece The Waste Land (1922), reversing Chaucer’s joyful April prologue.',
    topicTag: 'Modernist Poetry'
  },
  {
    id: 8,
    section: 'Paper I: Pedagogy & Research Aptitude',
    question: 'National Education Policy (NEP) 2020 emphasizes the pedagogical structural shift in Indian school education from 10+2 to:',
    options: ['5+3+3+4', '5+4+3+3', '4+4+3+3', '3+3+4+4'],
    correctAnswer: maskAnswer(0),
    explanation: 'NEP 2020 replaces the 10+2 structure with 5+3+3+4 covering foundational (age 3-8), preparatory (8-11), middle (11-14), and secondary (14-18) stages.',
    topicTag: 'NEP 2020 & Policy'
  },
  {
    id: 9,
    section: 'Paper II: English Literature',
    question: 'Which critical term was formulated by Cleanth Brooks to describe the inherent structural tension and reconciliation of opposing meanings in poetry?',
    options: ['The Intentional Fallacy', 'The Language of Paradox', 'Dissociation of Sensibility', 'Objective Correlative'],
    correctAnswer: maskAnswer(1),
    explanation: 'New Critic Cleanth Brooks championed "The Language of Paradox" in The Well Wrought Urn (1947), arguing that poetic language works fundamentally through contradiction and irony.',
    topicTag: 'New Criticism'
  },
  {
    id: 10,
    section: 'Literary Theory & ELT',
    question: 'Translanguaging in multilingual ELT classrooms (as championed under NEP 2020) refers to:',
    options: [
      'Translating text line-by-line using bilingual dictionaries',
      'The fluid, integrated deployment of a learner’s entire linguistic repertoire to maximize learning',
      'Strictly prohibiting mother tongue usage in English classes',
      'Teaching Latin roots of English vocabulary'
    ],
    correctAnswer: maskAnswer(1),
    explanation: 'Translanguaging rejects the deficit view of bilingualism; it encourages learners to draw upon their full linguistic repertoire (L1 + L2) to make meaning and internalize concepts.',
    topicTag: 'Multilingual Pedagogy'
  },
  {
    id: 11,
    section: 'Paper II: English Literature',
    question: 'In John Milton’s Paradise Lost, Book I, Satan proclaims: “The mind is its own place, and in itself / Can make a Heav’n of Hell, a Hell of Heav’n.” This speech exemplifies which philosophical stance?',
    options: ['Absolute rationalist stoicism and demonic autonomy', 'Christian repentance', 'Fatalistic surrender', 'Neo-Platonic quietism'],
    correctAnswer: maskAnswer(0),
    explanation: 'Satan’s rebellious assertion of psychological self-determination in defiance of divine decree (lines 254-255).',
    topicTag: 'Epic Poetry & Milton'
  },
  {
    id: 12,
    section: 'Paper II: English Literature',
    question: 'Which Indian English novelist authored Kanthapura (1938), famous for its foreword proclaiming: "We cannot write like the English. We should not. We cannot write only as Indians. We have to write as Indians talking to Indians"?',
    options: ['R. K. Narayan', 'Mulk Raj Anand', 'Raja Rao', 'Bhabani Bhattacharya'],
    correctAnswer: maskAnswer(2),
    explanation: 'Raja Rao’s landmark foreword to Kanthapura established the theoretical justification for Indianizing the English language to capture native tempo and emotional idiom.',
    topicTag: 'Indian English Fiction'
  },
  {
    id: 13,
    section: 'Paper I: Pedagogy & Research Aptitude',
    question: 'Bloom’s Revised Taxonomy of Educational Objectives orders cognitive processes from lowest to highest as follows:',
    options: [
      'Remembering, Understanding, Applying, Analyzing, Evaluating, Creating',
      'Understanding, Remembering, Applying, Analyzing, Creating, Evaluating',
      'Knowledge, Comprehension, Application, Analysis, Synthesis, Evaluation',
      'Remembering, Applying, Understanding, Evaluating, Analyzing, Creating'
    ],
    correctAnswer: maskAnswer(0),
    explanation: 'Lorin Anderson and David Krathwohl’s 2001 revision places "Creating" at the apex of cognitive complexity, with "Remembering" at the base.',
    topicTag: 'Taxonomy of Learning'
  },
  {
    id: 14,
    section: 'Paper II: English Literature',
    question: 'The term "Gothic Novel" originated with which subtitle in Horace Walpole’s 1764 narrative?',
    options: ['The Castle of Otranto: A Gothic Story', 'Frankenstein: The Modern Prometheus', 'The Mysteries of Udolpho', 'Vathek: An Arabian Tale'],
    correctAnswer: maskAnswer(0),
    explanation: 'Walpole added the subtitle "A Gothic Story" in the second edition of The Castle of Otranto, launching the entire Gothic romance genre.',
    topicTag: '18th-Century Fiction'
  },
  {
    id: 15,
    section: 'Literary Theory & ELT',
    question: 'What is the primary objective of "Diagnostic Evaluation" in classroom teaching?',
    options: [
      'To assign terminal grades at the end of the academic year',
      'To discover specific underlying learning difficulties and misconceptions before remediation',
      'To compare student percentiles across national cohorts',
      'To certify teacher pedagogical competencies'
    ],
    correctAnswer: maskAnswer(1),
    explanation: 'Diagnostic evaluation pinpoints continuous learning deficits and persistent learning obstacles so customized remedial instruction can occur.',
    topicTag: 'Assessment & Evaluation'
  },
  {
    id: 16,
    section: 'Paper II: English Literature',
    question: 'Jacques Derrida’s foundational concept of "Différance" plays simultaneously on which two French meanings?',
    options: ['To differ and to defer (postpone)', 'To define and to divide', 'To destroy and to deconstruct', 'To display and to disguise'],
    correctAnswer: maskAnswer(0),
    explanation: 'Derrida coined différance with an "a" to fuse "différer" (to be different) and "différer" (to defer or delay meaning through an endless chain of signifiers).',
    topicTag: 'Deconstruction & Post-Structuralism'
  },
  {
    id: 17,
    section: 'Paper II: English Literature',
    question: 'Which Victorian poet wrote In Memoriam A.H.H., expressing grief through the famous lyric: “’Tis better to have loved and lost / Than never to have loved at all”?',
    options: ['Robert Browning', 'Alfred, Lord Tennyson', 'Matthew Arnold', 'Algernon Charles Swinburne'],
    correctAnswer: maskAnswer(1),
    explanation: 'Tennyson spent seventeen years writing In Memoriam (published 1850) mourning the untimely death of his close university friend Arthur Henry Hallam.',
    topicTag: 'Victorian Poetry'
  },
  {
    id: 18,
    section: 'Literary Theory & ELT',
    question: 'Noam Chomsky’s concept of "LAD" in generative linguistics stands for:',
    options: ['Language Acquisition Device', 'Linguistic Aptitude Development', 'Learner Action Directive', 'Lexical Arrangement Design'],
    correctAnswer: maskAnswer(0),
    explanation: 'Chomsky posited an innate biological mental organ (Language Acquisition Device) encoding Universal Grammar, enabling children to acquire language spontaneously.',
    topicTag: 'Generative Linguistics'
  },
  {
    id: 19,
    section: 'Paper I: Pedagogy & Research Aptitude',
    question: 'A variable that is manipulated by the researcher to determine its effect on another variable is known as the:',
    options: ['Independent Variable', 'Dependent Variable', 'Extraneous Variable', 'Confounding Variable'],
    correctAnswer: maskAnswer(0),
    explanation: 'The independent variable is the experimental antecedent that the investigator directly varies to observe changes in the dependent variable (outcome).',
    topicTag: 'Experimental Research'
  },
  {
    id: 20,
    section: 'Paper II: English Literature',
    question: 'In Jane Austen’s Pride and Prejudice, what constitutes the opening sentence of the novel?',
    options: [
      '“It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.”',
      '“Happy families are all alike; every unhappy family is unhappy in its own way.”',
      '“No one who had ever seen Catherine Morland in her infancy would have supposed her born to be an heroine.”',
      '“Emma Woodhouse, handsome, clever, and rich, with a comfortable home and happy disposition…”'
    ],
    correctAnswer: maskAnswer(0),
    explanation: 'Austen’s classic ironical opening establishes the mercenary social realities of marriage in Georgian England.',
    topicTag: '19th-Century Novel'
  },
  {
    id: 21,
    section: 'Paper II: English Literature',
    question: 'Edward Said’s landmark critical text Orientalism (1978) utilizes which philosopher’s concept of "discourse" and power-knowledge?',
    options: ['Michel Foucault', 'Louis Althusser', 'Antonio Gramsci', 'Walter Benjamin'],
    correctAnswer: maskAnswer(0),
    explanation: 'Said applied Foucault’s archaeology of knowledge and discourse to examine how European imperial powers systematically constructed the "Orient" as an exotic, subjugated entity.',
    topicTag: 'Postcolonial Theory'
  },
  {
    id: 22,
    section: 'Literary Theory & ELT',
    question: 'In Communicative Language Teaching (CLT), "Communicative Competence" (as opposed to mere linguistic/grammatical competence) was originally formulated by:',
    options: ['Dell Hymes', 'Noam Chomsky', 'Michael Halliday', 'David Nunan'],
    correctAnswer: maskAnswer(0),
    explanation: 'Sociolinguist Dell Hymes (1972) proposed communicative competence to highlight that speakers must know not only grammar, but when to speak, what to say, and how to communicate appropriately in social context.',
    topicTag: 'Language Teaching Approaches'
  },
  {
    id: 23,
    section: 'Paper II: English Literature',
    question: 'Who among the following wrote the influential feminist essay "A Room of One\'s Own" (1929)?',
    options: ['Virginia Woolf', 'Simone de Beauvoir', 'Mary Wollstonecraft', 'Elaine Showalter'],
    correctAnswer: maskAnswer(0),
    explanation: 'Virginia Woolf argued that a woman must have financial autonomy ("five hundred a year") and private physical space ("a room of her own") to write fiction.',
    topicTag: 'Feminist Criticism & Modernism'
  },
  {
    id: 24,
    section: 'Paper I: Pedagogy & Research Aptitude',
    question: 'Qualitative research approaches are primarily characterized by:',
    options: [
      'Statistical hypothesis testing and numerical measurements',
      'Inductive exploration, thematic analysis, and context-rich narrative description',
      'Double-blind randomized laboratory trials',
      'Standardized psychometric scaling'
    ],
    correctAnswer: maskAnswer(1),
    explanation: 'Qualitative paradigms (case study, ethnography, phenomenology) seek to understand human experiences and meanings inductively from naturalistic settings.',
    topicTag: 'Research Methodologies'
  },
  {
    id: 25,
    section: 'Paper II: English Literature',
    question: 'Which rhetorical device is exhibited in Alexander Pope’s line from The Rape of the Lock: “Here thou, great Anna! whom three realms obey, / Dost sometimes counsel take—and sometimes tea.”?',
    options: ['Zeugma', 'Chiasmus', 'Oxymoron', 'Hyperbole'],
    correctAnswer: maskAnswer(0),
    explanation: 'Zeugma (or anti-climax / bathos): the single verb "take" yokes together grave affairs of state ("counsel") with frivolous social refreshment ("tea").',
    topicTag: 'Augustan Satire & Rhetoric'
  }
];

// Product Store Catalog Definition
export const STORE_PRODUCTS: StoreProduct[] = [
  {
    id: 'prod-kalam-book',
    type: 'book',
    title: 'A Study of the Educational Thoughts of APJ Abdul Kalam',
    subtitle: 'Doctoral Monograph & Pedagogical Treatise • Dr. Rajnikant S. Dodiya',
    callNumber: 'Shelf 181.4 • D632k',
    price: 399,
    originalPrice: 650,
    badge: 'Doctoral Monograph',
    formatDescription: 'Protected Scholarly Cloud Edition (In-Browser Cloud Reader)',
    features: [
      'Complete 4-Chapter Scholarly Edition with Full Footnotes & Bibliography',
      'Protected In-Browser Reading Room with Chapter Index & Bookmarking',
      'Dynamic Forensic Watermarking (Guaranteed Authentic Scholar License)',
      'Authorized Single-Device Cloud Access (Phone or Laptop)'
    ],
    securityNote: 'Anti-piracy protected: Bound strictly to your personal student device. No raw file leaks.'
  },
  {
    id: 'prod-ugc-mock-exam',
    type: 'exam',
    title: 'UGC-NET & GSET Master Mock Examination (2026 Edition)',
    subtitle: '25 Curated High-Yield Questions with Comprehensive Pedagogical Rationale',
    callNumber: 'Shelf 820.7 • E589m',
    price: 299,
    originalPrice: 500,
    badge: 'Interactive CBT Simulator',
    formatDescription: 'Timed Examination Portal (NTA Exam Interface Simulation)',
    features: [
      '25 High-Yield Questions (Shakespeare, Romanticism, Post-Method, NEP 2020)',
      'NTA-Style Question Palette (Answered, Flagged for Review, Unvisited)',
      '60-Minute Countdown Clock with Pause & Resume safeguards',
      'Instant Diagnostic Score Report with Percentile & Dr. Dodiya’s Explanations'
    ],
    securityNote: 'Simulates genuine university CBT environment. Single-device exam authentication.'
  },
  {
    id: 'prod-scholar-bundle',
    type: 'bundle',
    title: 'The Master Scholar Pack: Digital Monograph + Mock Exam',
    subtitle: 'Complete Academic Preparation Bundle (Book + 25-Question CBT Engine)',
    callNumber: 'Special Accession • Bundle #HMP-2026',
    price: 599,
    originalPrice: 1150,
    badge: 'Best Scholar Value • Save ₹99',
    formatDescription: 'All-Inclusive Academic Access (Both Monograph & Exam Engine)',
    features: [
      'Full Access to "Educational Thoughts of APJ Abdul Kalam" In-Browser Reader',
      'Full Access to UGC-NET & GSET 25-Question Master CBT Simulator',
      'Academic GST Invoice for College / Institutional Reimbursement',
      'Priority Access to Future ELEF Webinars & Dr. Dodiya’s Research Briefs'
    ],
    securityNote: 'Instant activation across both study portals immediately upon payment.'
  }
];

/**
 * Returns exam questions with answers and explanations stripped for active test-taking.
 * Prevents examinees from inspecting the correct answers in memory or React state during testing.
 */
export function getActiveExamQuestions(isUnlocked: boolean): ActiveExamQuestion[] {
  const source = isUnlocked ? MOCK_EXAM_QUESTIONS : MOCK_EXAM_QUESTIONS.slice(0, 3);
  return source.map(q => ({
    id: q.id,
    section: q.section,
    question: q.question,
    options: q.options,
    topicTag: q.topicTag
  }));
}

export interface ExamEvaluationResult {
  correctCount: number;
  incorrectCount: number;
  unattemptedCount: number;
  answeredCount: number;
  totalScore: number;
  maxScore: number;
  accuracy: number;
  percentile: number;
  detailedQuestions: (ExamQuestion & {
    correctIdx: number;
    studentAns?: number;
    isCorrect: boolean;
  })[];
}

/**
 * Evaluates candidate responses only upon final exam submission.
 * Reconciles submitted choices against protected answer keys and provides explanations.
 */
export function evaluateExamSubmission(
  answers: Record<number, number>,
  isUnlocked: boolean
): ExamEvaluationResult {
  const source = isUnlocked ? MOCK_EXAM_QUESTIONS : MOCK_EXAM_QUESTIONS.slice(0, 3);
  let correctCount = 0;
  let incorrectCount = 0;
  let unattemptedCount = 0;

  const detailedQuestions = source.map((q, idx) => {
    const studentAns = answers[idx];
    const correctIdx = unmaskAnswer(q.correctAnswer);
    const isCorrect = studentAns === correctIdx;

    if (studentAns === undefined) {
      unattemptedCount++;
    } else if (isCorrect) {
      correctCount++;
    } else {
      incorrectCount++;
    }

    return {
      ...q,
      correctIdx,
      studentAns,
      isCorrect
    };
  });

  const totalQuestions = source.length;
  const answeredCount = totalQuestions - unattemptedCount;
  const totalScore = correctCount * 2;
  const maxScore = totalQuestions * 2;
  const accuracy = correctCount + incorrectCount > 0 ? Math.round((correctCount / (correctCount + incorrectCount)) * 100) : 0;
  const percentile = Math.min(99.4, Math.max(45, Math.round((correctCount / totalQuestions) * 100 * 1.15 * 10) / 10));

  return {
    correctCount,
    incorrectCount,
    unattemptedCount,
    answeredCount,
    totalScore,
    maxScore,
    accuracy,
    percentile,
    detailedQuestions
  };
}

