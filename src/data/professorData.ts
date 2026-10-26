export interface Publication {
  no: number;
  year: number;
  title: string;
  journal: string;
  theme: string;
  issn: string;
  doi?: string;
}

export interface Book {
  year: number;
  title: string;
  publisher: string;
  isbn: string;
  type: 'authored' | 'edited' | 'chapter';
  details?: string;
  buyUrl?: string;
  pageCount?: number;
  previewPages?: number;
  samplePdfUrl?: string;
  manuscriptFileUrl?: string;
}

export interface Engagement {
  id: string;
  date: string;
  year: number;
  topic: string;
  event: string;
  level: 'State' | 'National' | 'International';
  category: 'lecture' | 'paper' | 'chair' | 'fdp';
  typeLabel?: string;
  duration?: string;
}

export interface Qualification {
  year: string;
  degree: string;
  university: string;
  details?: string;
}

export interface Eligibility {
  year: string;
  exam: string;
  subject: string;
  conductedBy: string;
}

export interface CareerMilestone {
  year: string;
  milestone: string;
}

export interface AcademicRole {
  role: string;
  since: string;
}

export interface UpdateItem {
  date: string;
  title: string;
  category: 'News' | 'Events' | 'Achievements' | 'Announcements';
  details?: string;
}

export const SOCIAL_LINKS = {
  instagramPersonal: "https://www.instagram.com/drrajnikantdodiya/",
  instagramNetVidya: "https://www.instagram.com/netvidyaenglish?psln=czdueHFzaTliYng4",
  youtubeNetVidya: "https://www.youtube.com/@NETVidyaEnglish",
  whatsappChannelEnglish: "https://whatsapp.com/channel/0029Vb8X9Wh7DAX0sGIrsC0b",
  whatsappChannelEducation: "https://whatsapp.com/channel/0029VbDNnXwJENy6hnRWQM3i",
  linkedin: "https://www.linkedin.com/in/rajnikantdodiyaphd?utm_source=share_via&utm_content=profile&utm_medium=member_android",
  email: "rajnikantdodiya2@gmail.com",
  orcid: "0009-0001-8558-4839",
  googleScholar: "X92BI1AAAAAJ",
  vidwan: "655426"
};

export const PROFESSOR_INFO = {
  name: "Dr. Rajnikant S. Dodiya",
  title: "Assistant Professor · English Language Education & Teacher Education",
  institution: "H. M. Patel Institute of English Training and Research (HMPIETR)",
  university: "Sardar Patel University",
  location: "Vallabh Vidyanagar, Anand, Gujarat, India",
  email: "rajnikantdodiya2@gmail.com",
  officialEmail: "rajnikantdodiya@hmpenglish.com",
  photoUrl: "/dr-rajnikant-dodiya.jpg",
  cvLastUpdated: "October 2026",
  
  // Word-for-Word from PDF 1 (Short bio ~60 words for Home page & talk invitations)
  shortBio: "Dr. Rajnikant S. Dodiya is Assistant Professor · English Language Education & Teacher Education at H. M. Patel Institute of English Training and Research, Vallabh Vidyanagar, Gujarat. He holds a Ph.D. in Education and has qualified UGC-NET and GSET in both Education and English. His work focuses on English language education, teacher education, AI in education and NEP 2020.",

  // Word-for-Word from PDF 1 (Long bio ~250 words for About page)
  longBio: [
    "Dr. Rajnikant S. Dodiya is Assistant Professor of English Language Pedagogy and Education at H. M. Patel Institute of English Training and Research (HMPIETR), Vallabh Vidyanagar, Anand, Gujarat. He has nearly two decades of experience in education, across teacher-training colleges, government school education and higher education.",
    "He began his career in 2007 as a lecturer of English methodology in teacher-training colleges. He then taught English in a government primary school and later served as its principal (2011–2019). He joined HMPIETR in July 2019.",
    "He holds a Ph.D. in Education from Sardar Patel University (2018). His doctoral study examined the educational thoughts reflected in the writings of Dr. A. P. J. Abdul Kalam. He has qualified UGC-NET in Education and English, and GSET in Education and English.",
    "His academic interests include English language education, teacher education, post-method pedagogy, AI in education, multilingual education and translanguaging, assessment, research methodology, NEP 2020 and Indian Knowledge Systems. He has published 19 research papers, authored 6 books, edited 4 books and contributed a book chapter. He has delivered 22 invited lectures, presented 13 conference papers and chaired sessions at national and international conferences.",
    "At HMPIETR, he coordinates IQAC, NAAC, NCTE PAR and GSIRF work, the Research and Development Cell, and the Centre for AI in English Language Education (CAIELE). He convenes the English Language Education Forum (ELEF) and edits its journal and the IQAC newsletter. He also guides UGC-NET aspirants through his YouTube channel, NETVidya English."
  ],

  // 4 Core Number Boxes for Home Page (PDF 2)
  stats: [
    { label: "Research Papers", value: "19", sublabel: "Peer-Reviewed & Indexed" },
    { label: "Published Books", value: "10", sublabel: "6 Authored · 4 Edited" },
    { label: "Invited Talks", value: "22", sublabel: "National & State Level" },
    { label: "Learners Guided", value: "2,500+", sublabel: "B.Ed. & NET Aspirants" }
  ],

  phdDetails: {
    degree: "Ph.D. in Education",
    university: "Sardar Patel University, Vallabh Vidyanagar",
    year: "2018",
    thesis: "A Study of the Educational Thoughts as Reflected in APJ Abdul Kalam’s Writings",
    guide: "Dr. Alkaben J. Macwan",
    department: "P.G. Department of Education, Sardar Patel University",
    resultDeclared: "25 April 2018"
  },

  researchProfiles: {
    orcid: "0009-0001-8558-4839",
    googleScholar: "X92BI1AAAAAJ",
    vidwan: "655426",
    researchGate: "Rajnikant Dodiya",
    linkedIn: "Rajnikant Dodiya, Ph.D."
  }
};

// Career Journey (Vertical Timeline 2004–2026 Word-for-Word from PDF 1)
export const CAREER_TIMELINE: CareerMilestone[] = [
  { year: "2004", milestone: "B.A. in English, Gujarat University" },
  { year: "2006", milestone: "B.Ed. (English Methodology), Sardar Patel University" },
  { year: "2007", milestone: "M.Ed., Sardar Patel University. Started as Lecturer of Pedagogy of English, Smt. J. N. Patel B.Ed. College, Lunawada" },
  { year: "2008", milestone: "Lecturer of Pedagogy of English, Smt. K. C. M. Shah B.Ed. College, Godhra" },
  { year: "2009", milestone: "Qualified UGC-NET in Education. Lecturer of Pedagogy of English, Shri Umiya College of Education, Ahmedabad" },
  { year: "2011", milestone: "Assistant Teacher of English, Government Primary School, Singarva (Ahmedabad)" },
  { year: "2014", milestone: "Registered for Ph.D. in Education, Sardar Patel University" },
  { year: "2015", milestone: "Principal, Government Primary School, Dholka (Ahmedabad). M.A. in English, BAOU" },
  { year: "2018", milestone: "Ph.D. in Education awarded. Qualified GSET in English. Six authored books published" },
  { year: "2019", milestone: "Qualified GSET in Education. Joined HMPIETR as Assistant Professor (July 2019)" },
  { year: "2020", milestone: "Qualified UGC-NET in English Literature. First edited book: Post-Method Pedagogy and its Reflections in ELT" },
  { year: "2021", milestone: "Became IQAC Coordinator; took up NCTE PAR, GSIRF and Placement roles" },
  { year: "2022", milestone: "Chaired a session at the Academic Studies Congress, Osmaniye Korkut Ata University, Türkiye" },
  { year: "2024–25", milestone: "Orientation and Refresher Courses (UGC-MMTTC). Edited books on UGC NET English and Indian Knowledge Systems" },
  { year: "2026", milestone: "Papers on post-method pedagogy, NEP 2020 multilingualism and blended learning. Lifetime member of AIAER, CTE and ISTD. Paper and session chair at the ELTAI International Conference, Pune (October)" }
];

// Degrees Table (Word-for-Word from PDF 1)
export const QUALIFICATIONS: Qualification[] = [
  { year: "2018", degree: "Ph.D. in Education", university: "Sardar Patel University, Vallabh Vidyanagar" },
  { year: "2015", degree: "M.A. in English", university: "Dr. Babasaheb Ambedkar Open University, Ahmedabad" },
  { year: "2007", degree: "M.Ed.", university: "Sardar Patel University, Vallabh Vidyanagar" },
  { year: "2006", degree: "B.Ed. (English Methodology)", university: "Sardar Patel University, Vallabh Vidyanagar" },
  { year: "2004", degree: "B.A. in English", university: "Gujarat University, Ahmedabad" }
];

// National and State Eligibility Tests (Word-for-Word from PDF 1)
export const ELIGIBILITIES: Eligibility[] = [
  { year: "2020", exam: "UGC-NET", subject: "English Literature", conductedBy: "University Grants Commission" },
  { year: "2019", exam: "GSET", subject: "Education", conductedBy: "The M. S. University of Baroda" },
  { year: "2018", exam: "GSET", subject: "English", conductedBy: "The M. S. University of Baroda" },
  { year: "2009", exam: "UGC-NET", subject: "Education", conductedBy: "University Grants Commission" }
];

// Additional Qualifications (from PDF 1)
export const ADDITIONAL_QUALIFICATIONS = [
  "CCC Plus (Computer) – Dr. Babasaheb Ambedkar Open University, 2024",
  "Hindi Vinit – Gujarat Vidyapith, 2022",
  "CCC Plus (Computer) – SPIPA, Ahmedabad, 2016"
];

// Academic Roles at HMPIETR (Word-for-Word from PDF 1)
export const ACADEMIC_ROLES: AcademicRole[] = [
  { role: "IQAC Coordinator", since: "Since June 2021" },
  { role: "NAAC Coordinator", since: "Current" },
  { role: "NCTE PAR Coordinator", since: "Since 2021" },
  { role: "GSIRF Nodal Officer", since: "Since 2021" },
  { role: "Placement Officer and Career Counselling Coordinator", since: "Since 2021" },
  { role: "Coordinator, Research & Development Cell (RDC)", since: "Current" },
  { role: "Coordinator, Centre for AI in English Language Education (CAIELE)", since: "Current" },
  { role: "Convener, English Language Education Forum (ELEF)", since: "Current" },
  { role: "Editor, ELEF Annual Journal and ELEF Book", since: "Current" },
  { role: "Editor, IQAC Newsletter", since: "Current" },
  { role: "Student Induction Programme Coordinator", since: "Current" },
  { role: "Social Media Convener", since: "Current" },
  { role: "Curriculum Development: B.Ed. (English) pedagogy syllabus", since: "Contribution" }
];

// Professional Memberships (from PDF 1)
export const MEMBERSHIPS = [
  { association: "All India Association for Educational Research (AIAER)", type: "Life Member" },
  { association: "Council for Teacher Education (CTE), Gujarat Chapter", type: "Life Member" },
  { association: "Indian Society for Training & Development (ISTD)", type: "Life Member" },
  { association: "English Language Teachers’ Association of India (ELTAI)", type: "Member (2026–2029)" },
  { association: "AINET Association of English Teachers", type: "Member (2026–2029)" },
  { association: "Anand District Management Association (ADMA)", type: "Member" }
];

// Academic Recognition (Word-for-Word from PDF 1 - Note: client says do not publish empty award lines)
export const ACADEMIC_RECOGNITION = [
  "Session Chair at 10 conferences and seminars, including the Academic Studies Congress, Türkiye (2022) and the ELTAI International Conference, Pune (2026)",
  "Invited resource person for 22 lectures and sessions, including IGNOU, Sardar Patel University, M. K. Bhavnagar University, IITE Gandhinagar and The CVM University",
  "Editor of the ELEF Annual Journal, ELEF Book and IQAC Newsletter",
  "Editor of 4 academic books (2020–2025)"
];

// Research Interests
export const RESEARCH_INTERESTS = [
  "English Language Education (ELE) & ELT",
  "Teacher Education & Professional Development",
  "Post-Method Pedagogy in Indian Classrooms",
  "Artificial Intelligence in English Language Education (CAIELE)",
  "Multilingual Education & Translanguaging",
  "Assessment, Evaluation & Test Design",
  "National Education Policy (NEP 2020) Implementation",
  "Indian Knowledge Systems (IKS) in Pedagogy",
  "Techno-Pedagogy & Blended Learning"
];

// 19 Research Papers (Newest first, APA 7th style)
export const PUBLICATIONS: Publication[] = [
  { no: 1, year: 2026, title: "From Monolingualism to Multilingualism: Reimagining English Language Education in India under NEP 2020", journal: "ELT Quarterly", theme: "ELT & Multilingual Education", issn: "ISSN 0975-0258" },
  { no: 2, year: 2026, title: "Towards Context-Sensitive English Language Teaching: A Post-Method Perspective", journal: "International Journal of Literary Studies", theme: "ELT & Language Pedagogy", issn: "ISSN 2231-4652" },
  { no: 3, year: 2026, title: "Blended Learning: An Innovative Approach in English Language Teaching", journal: "Zankhana – International Peer Reviewed E-Journal, Vol. 12, Issue 10", theme: "ELT & EdTech", issn: "E-ISSN 2350-0271" },
  { no: 4, year: 2024, title: "Teachings from Literature on Pandemics", journal: "Research Guru – International Peer-Reviewed Journal, Vol. 17, Issue 4", theme: "Literature & Education", issn: "E-ISSN 2349-266X" },
  { no: 5, year: 2022, title: "Envisioning New Policy for Examination and Assessment in the Era of Uncertainty", journal: "Research Guru, Vol. 16, Issue 1", theme: "Assessment & Evaluation", issn: "E-ISSN 2349-266X" },
  { no: 6, year: 2021, title: "The Role of Education in the Problems of Emotional Adjustment in Adolescence", journal: "Zankhana, Vol. 8, Issue 1", theme: "Education & Society", issn: "E-ISSN 2350-0271" },
  { no: 7, year: 2020, title: "The Educational Imperatives Implied in Dr APJ Abdul Kalam’s Writings about National Development", journal: "Zankhana, Vol. 6, Issue 12", theme: "Kalam Studies", issn: "E-ISSN 2350-0271" },
  { no: 8, year: 2019, title: "The Contribution of Charles Lamb as an Essayist to the English Literature", journal: "Research Guru, Vol. 13, Issue 1", theme: "English Literature", issn: "E-ISSN 2349-266X" },
  { no: 9, year: 2019, title: "The Contribution of Daniel Defoe to the English Novel with Special Reference to Robinson Crusoe", journal: "Research Guru, Vol. 12, Issue 4", theme: "English Literature", issn: "E-ISSN 2349-266X" },
  { no: 10, year: 2018, title: "Teacher Education: Problems and Remedies", journal: "Research Guru, Vol. 12, Issue 1", theme: "Teacher Education", issn: "E-ISSN 2349-266X" },
  { no: 11, year: 2018, title: "The Developmental Concerns of Education as Expressed in the Reports of the Indian Education Commissions", journal: "JETIR, Vol. 5, Issue 5", theme: "Education Policy", issn: "E-ISSN 2349-5162" },
  { no: 12, year: 2018, title: "APJ Abdul Kalam’s Thoughts on Leadership in Education as Reflected in His Writings", journal: "IJRAR, Vol. 5, Issue 2", theme: "Kalam Studies", issn: "E-ISSN 2348-1269" },
  { no: 13, year: 2018, title: "Dr APJ Abdul Kalam’s Thoughts on Students as Reflected in His Writings", journal: "Vidyawarta, Vol. 8, Issue 22", theme: "Kalam Studies", issn: "ISSN 2319-9318" },
  { no: 14, year: 2018, title: "The Vision of Dr Ambedkar on Building Nation through Education", journal: "Research Guru, Vol. 11, Issue 4", theme: "Indian Thinkers", issn: "E-ISSN 2349-266X" },
  { no: 15, year: 2018, title: "The Factors Affecting the Education System of a Nation", journal: "IJRSML, Vol. 6, Issue 2", theme: "Education & Society", issn: "ISSN 2321-2853" },
  { no: 16, year: 2018, title: "APJ Abdul Kalam’s Thoughts on Education System as Reflected in His Writings", journal: "EduInspire Journal, Vol. 5, Issue 1", theme: "Kalam Studies", issn: "ISSN 2349-7076" },
  { no: 17, year: 2017, title: "Role of Education in Developing Peace and Harmony", journal: "International Education and Research Journal (IERJ), Vol. 3, Issue 5", theme: "Education & Society", issn: "ISSN 2454-9916" },
  { no: 18, year: 2017, title: "APJ Abdul Kalam’s Thoughts on Teacher as Reflected in His Writings", journal: "Social Impact Journal, Vol. 2, Issue 2", theme: "Kalam Studies", issn: "ISSN 2455-670X" },
  { no: 19, year: 2015, title: "The Educational Imperatives Implied in Dr APJ Abdul Kalam’s Writings about Social Development", journal: "Sorath Sudha – Peer-reviewed Journal, Vol. 1, Issue 10", theme: "Kalam Studies", issn: "ISSN 2394-5648" }
];

// Published Books (6 Authored + 4 Edited + 1 Chapter)
export const BOOKS: Book[] = [
  { year: 2018, title: "APJ Abdul Kalam on Education", publisher: "Madhuvan Store, Vallabh Vidyanagar", isbn: "978-81-937539-0-3", type: "authored" },
  { year: 2018, title: "Imperatives for Education in Views of APJ Abdul Kalam", publisher: "Madhuvan Store, Vallabh Vidyanagar", isbn: "978-81-937539-1-0", type: "authored" },
  { year: 2018, title: "Teaching of English Language", publisher: "WBG Publication, Ahmedabad", isbn: "978-93-85037-51-1", type: "authored" },
  { year: 2018, title: "Indian Thinkers with Educational Perspective", publisher: "WBG Publication, Ahmedabad", isbn: "978-93-85037-50-4", type: "authored" },
  { year: 2018, title: "Events in APJ Abdul Kalam’s Life", publisher: "Self-published", isbn: "978-93-5311-203-5", type: "authored" },
  { year: 2018, title: "The Key Factors and Concerns of Education", publisher: "Self-published", isbn: "978-93-5311-260-8", type: "authored" },

  { year: 2025, title: "Comparative Studies in Indian and Western Knowledge Systems", publisher: "H. M. Patel Institute of English Training & Research", isbn: "978-81-931777-6-1", type: "edited" },
  { year: 2024, title: "UGC NET English Literature", publisher: "Madhuvan Store, Vallabh Vidyanagar", isbn: "978-93-90256-27-3", type: "edited" },
  { year: 2022, title: "Current ELT Trends and Practices", publisher: "H. M. Patel Institute of English Training & Research", isbn: "978-81-931777-4-7", type: "edited" },
  { year: 2020, title: "Post-Method Pedagogy and its Reflections in ELT", publisher: "H. M. Patel Institute of English Training & Research", isbn: "978-81-931777-1-6", type: "edited" },

  { year: 2025, title: "Transforming Higher Education Through Digital Pedagogy and Resources", publisher: "Department of Education, Sardar Patel University", isbn: "978-93-6729-117-7", type: "chapter", details: "In '21st Century Higher Education: The Nexus of Technology, Pedagogy and Indian Ethos'" }
];

// 22 Invited Lectures (Word-for-Word from CV)
export const INVITED_TALKS: Engagement[] = [
  { id: "it-1", date: "24 Aug 2026", year: 2026, topic: "English Communication Skills for Future Teachers", event: "One-day Workshop on Basic English Language, Sardar Patel College of Education, Vallabh Vidyanagar", level: "State", category: "lecture" },
  { id: "it-2", date: "22 Aug 2026", year: 2026, topic: "English Beyond Graduation: Career Pathways for English Students", event: "Anand Arts College, Anand", level: "State", category: "lecture" },
  { id: "it-3", date: "21 Aug 2026", year: 2026, topic: "Hands-on FinTech Entrepreneurship", event: "World Entrepreneurship Day programme, Anand Commerce College & Infinity Wealth, Anand", level: "State", category: "lecture" },
  { id: "it-4", date: "03 Aug 2026", year: 2026, topic: "Developing Listening and Speaking Skills", event: "English Enrichment Course, Alumni Association, HMPIETR", level: "State", category: "lecture" },
  { id: "it-5", date: "10 Jul 2026", year: 2026, topic: "How to Succeed in B.Ed.: Study Skills, Time Management and Academic Excellence", event: "Waymade College of Education, The CVM University", level: "State", category: "lecture" },
  { id: "it-6", date: "05 May 2026", year: 2026, topic: "Effective Resume Writing", event: "G.J. Patel Institute of Ayurvedic Studies and Research, The CVM University", level: "State", category: "lecture" },
  { id: "it-7", date: "05 Feb 2026", year: 2026, topic: "Resume Writing Workshop", event: "P.G. Department of Education, Sardar Patel University", level: "State", category: "lecture" },
  { id: "it-8", date: "28 Jan 2026", year: 2026, topic: "Career Counselling", event: "Anand College of Education, Anand", level: "State", category: "lecture" },
  { id: "it-9", date: "22 Jan 2026", year: 2026, topic: "Preparation for Competitive Exams", event: "Waymade College of Education, The CVM University", level: "State", category: "lecture" },
  { id: "it-10", date: "23 Aug 2024", year: 2024, topic: "Communicative Approach and Post-CLT Scenario", event: "M.A. (ELT) Expert Session Series, ILSASS, Vallabh Vidyanagar", level: "State", category: "lecture" },
  { id: "it-11", date: "13 Aug 2024", year: 2024, topic: "Programme Evaluation – Course Design IV", event: "PGDHE Extended Contact Programme, IGNOU", level: "National", category: "lecture" },
  { id: "it-12", date: "06 Aug 2024", year: 2024, topic: "Communication Skills: Developing English Proficiency", event: "Orientation Programme, Birla Vishvakarma Mahavidyalaya (BVM)", level: "State", category: "lecture" },
  { id: "it-13", date: "11 Jul 2024", year: 2024, topic: "Language Skills", event: "Orientation Programme, ILSASS, Vallabh Vidyanagar", level: "State", category: "lecture" },
  { id: "it-14", date: "21 May 2024", year: 2024, topic: "Higher Education System", event: "Free Online NET Coaching Programme, Dept. of English, Sardar Patel University", level: "National", category: "lecture" },
  { id: "it-15", date: "21 Aug 2023", year: 2023, topic: "Productive and Receptive Skills", event: "English Enrichment Programme, Alumni Association, HMPIETR", level: "State", category: "lecture" },
  { id: "it-16", date: "10 Jan 2023", year: 2023, topic: "Listening & Speaking Skills", event: "Personality Development Programme – English Communication Skills, BJVM / HMP CDC", level: "State", category: "lecture" },
  { id: "it-17", date: "23 Sep 2022", year: 2022, topic: "Communication Skills", event: "Student Induction Programme, BVM Engineering College", level: "State", category: "lecture" },
  { id: "it-18", date: "19–25 May 2022", year: 2022, topic: "Basic Interpersonal Communication Skills (BICS) for Bilingual Teachers", event: "One-week Training Programme, HMPIETR", level: "State", category: "lecture" },
  { id: "it-19", date: "05 Jul 2021", year: 2021, topic: "Assessment and Evaluation in Education", event: "Ph.D. Course Work Sessions, Waymade College of Education", level: "State", category: "lecture" },
  { id: "it-20", date: "15 Jun 2021", year: 2021, topic: "Teaching of LSRW", event: "ELT Expert Sessions Series, HMPIETR", level: "State", category: "lecture" },
  { id: "it-21", date: "21–22 Sep 2020", year: 2020, topic: "UGC-NET Paper I: Teaching Aptitude and Major Topics", event: "UGC-NET Guidance Sessions, Dept. of English, M.K. Bhavnagar University", level: "National", category: "lecture" },
  { id: "it-22", date: "05, 08 & 10 Sep 2020", year: 2020, topic: "E-Book Design and Development (three sessions)", event: "Online Certificate Course on Multimedia in Education, IITE, Gandhinagar", level: "State", category: "lecture" }
];

// 13 Conference Papers
export const CONFERENCE_PAPERS: Engagement[] = [
  { id: "cp-1", date: "09 Mar 2026", year: 2026, topic: "Digitizing Wisdom: Technology-Integrated Education Rooted in Indian Knowledge Systems for India-2026", event: "International Seminar 'India 2026: One Nation, One Destiny', N.H. Patel College of Education, Anand", level: "International", category: "paper" },
  { id: "cp-2", date: "07 Feb 2026", year: 2026, topic: "Effect of Translanguaging Pedagogy on English Reading Comprehension among Secondary School ESL Learners", event: "International Conference on Interdisciplinary Approaches to English, CLASS–CHARUSAT", level: "International", category: "paper" },
  { id: "cp-3", date: "29–31 Jan 2026", year: 2026, topic: "Postmethod Pedagogy in Indian Higher Education: Towards Context-Sensitive Classroom Practices", event: "National Seminar on Decolonizing ELT, Shri Govind Guru University, Godhra", level: "National", category: "paper" },
  { id: "cp-4", date: "23 Dec 2025", year: 2025, topic: "Digital Education as a Catalyst for Inclusive Nation Building: A Vision for Viksit Bharat 2047", event: "National Seminar, KCG & N.H. Patel College of Education, Anand", level: "National", category: "paper" },
  { id: "cp-5", date: "20 Feb 2025", year: 2025, topic: "Exploring the Synergy of Jain Philosophy and Indian Knowledge Systems in the Context of NEP 2020", event: "National Seminar, Sardar Patel University", level: "National", category: "paper" },
  { id: "cp-6", date: "08 Feb 2025", year: 2025, topic: "Digital Tools and Evolution of Indian Traditional Storytelling for Language Learning", event: "National Conference on Indian Knowledge Systems and Language Education, HMPIETR", level: "National", category: "paper" },
  { id: "cp-7", date: "25 Feb 2023", year: 2023, topic: "A Study of the Socio-cultural Dimensions of English Studies in Indian Classrooms", event: "International Conference on Sociocultural Dimensions of English Studies, HMPIETR", level: "International", category: "paper" },
  { id: "cp-8", date: "25–26 Feb 2022", year: 2022, topic: "Implementing Discourse-based Approaches in English Language Teaching in India", event: "National Conference on Discourse Oriented Pedagogy for Language Classroom, HMPIETR & ELTAI", level: "National", category: "paper" },
  { id: "cp-9", date: "19–21 Aug 2020", year: 2020, topic: "Media Tools for Effective English Language Teaching", event: "National Web-conference on English Studies in India, HMPIETR", level: "National", category: "paper" },
  { id: "cp-10", date: "27–28 Apr 2020", year: 2020, topic: "ICT Enabled Teaching-Learning Process Education in Era of Pandemic", event: "Online National Seminar, IITE, Gandhinagar", level: "National", category: "paper" },
  { id: "cp-11", date: "07–08 Feb 2020", year: 2020, topic: "Pedagogical Uses of Blogs in English Language Teaching Classroom", event: "National Conference on Post Method Pedagogy in English Classroom, HMPIETR & ELTAI", level: "National", category: "paper" },
  { id: "cp-12", date: "02–03 Dec 2018", year: 2018, topic: "Harmony through Education", event: "International Conference on Harmony Through Education & Inclusive Education, BAOU & GERA", level: "International", category: "paper" },
  { id: "cp-13", date: "Oct 2026", year: 2026, topic: "Paper Presentation and Session Chairing", event: "ELTAI International Conference, Pune", level: "International", category: "paper" }
];

// Session Chairs (10 Conferences)
export const SESSION_CHAIRS: Engagement[] = [
  { id: "sc-10", date: "Oct 2026", year: 2026, topic: "English Language Teaching and Pedagogy", event: "ELTAI International Conference, Pune", level: "International", category: "chair" },
  { id: "sc-1", date: "29–31 Jan 2026", year: 2026, topic: "Decolonizing ELT: A Postmethod Approach for Higher Education in India", event: "National Seminar, Shri Govind Guru University, Godhra", level: "National", category: "chair" },
  { id: "sc-2", date: "23 Dec 2025", year: 2025, topic: "Viksit Bharat 2047: The Role of Education in Nation Building", event: "National Seminar, KCG & N.H. Patel College of Education", level: "National", category: "chair" },
  { id: "sc-3", date: "08 Feb 2025", year: 2025, topic: "Indian Knowledge Systems and Language Education", event: "National Conference, HMPIETR", level: "National", category: "chair" },
  { id: "sc-4", date: "25 Feb 2023", year: 2023, topic: "Socio-cultural Dimensions of English Studies", event: "International Conference, HMPIETR", level: "International", category: "chair" },
  { id: "sc-5", date: "13–16 May 2022", year: 2022, topic: "Academic Studies Congress", event: "Osmaniye Korkut Ata University, Türkiye", level: "International", category: "chair" },
  { id: "sc-6", date: "25–26 Feb 2022", year: 2022, topic: "Discourse Oriented Pedagogy for Language Classroom", event: "National Conference, HMPIETR & ELTAI", level: "National", category: "chair" },
  { id: "sc-7", date: "28 Aug 2021", year: 2021, topic: "Teaching Science through Real Life Examples", event: "Science Symposium, Waymade College of Education", level: "State", category: "chair" },
  { id: "sc-8", date: "19–21 Aug 2020", year: 2020, topic: "English Studies in India: Challenges, Policies and Possibilities", event: "National Web-conference, HMPIETR", level: "National", category: "chair" },
  { id: "sc-9", date: "07–08 Feb 2020", year: 2020, topic: "Post Method Pedagogy in English Classroom", event: "National Conference, HMPIETR & ELTAI", level: "National", category: "chair" }
];

// FDPs & Refresher Courses
export const FDP_TRAININGS: Engagement[] = [
  { id: "fdp-1", date: "16–28 Feb 2026", year: 2026, topic: "Refresher Course on 'Teaching, Research and Technology' (Online)", event: "UGC-MMTTC, Central University of Kerala", level: "National", category: "fdp", typeLabel: "RC", duration: "2 weeks" },
  { id: "fdp-2", date: "18–23 Aug 2025", year: 2025, topic: "Faculty Development Programme", event: "UGC-HRDC, Dept. of Education, Sardar Patel University", level: "State", category: "fdp", typeLabel: "FDP", duration: "1 week" },
  { id: "fdp-3", date: "01–06 Jul 2025", year: 2025, topic: "Faculty Development Programme", event: "H. M. Patel Institute of English Training & Research", level: "State", category: "fdp", typeLabel: "FDP", duration: "1 week" },
  { id: "fdp-4", date: "15 May–11 Jun 2025", year: 2025, topic: "Orientation Programme / Faculty Induction Programme", event: "UGC-MMTTC, Gujarat University, Ahmedabad", level: "State", category: "fdp", typeLabel: "OP/FIP", duration: "4 weeks" },
  { id: "fdp-5", date: "15–28 Apr 2025", year: 2025, topic: "Refresher Course on Research Methodology and Data Analysis", event: "UGC-MMTTC, Bhagat Phool Singh Mahila Vishwavidyalaya, Sonipat", level: "National", category: "fdp", typeLabel: "RC", duration: "2 weeks" },
  { id: "fdp-6", date: "17–21 Mar 2025", year: 2025, topic: "FDP on 'Enhancing Professional Skills and Capabilities of Teaching Fraternity'", event: "Aspire Square & S.M. Patel College of Home Science", level: "State", category: "fdp", typeLabel: "FDP", duration: "1 week" },
  { id: "fdp-7", date: "24 Feb–03 Mar 2025", year: 2025, topic: "Short-Term Programme on 'Education and Indian Knowledge System'", event: "UGC-MMTTC, Indian Institute of Teacher Education, Gandhinagar", level: "State", category: "fdp", typeLabel: "STP", duration: "1 week" }
];

// Latest News (3 items for Home Page as required in PDF 2)
export const LATEST_NEWS: UpdateItem[] = [
  { date: "October 2026", title: "Paper Presentation & Session Chair at ELTAI International Conference", category: "Events", details: "Chaired technical session on English Language Teaching and presented paper in Pune." },
  { date: "September 2026", title: "Centre for AI in English Language Education (CAIELE) Initiatives", category: "News", details: "Coordinating faculty workshops on integrating generative AI tools in second-language classrooms." },
  { date: "August 2026", title: "New Academic Session at HMPIETR & UGC-NET Guidance", category: "Announcements", details: "Guiding B.Ed., M.Ed., and UGC-NET English aspirants through interactive sessions and NETVidya English." }
];

export const LATEST_UPDATES = LATEST_NEWS;

