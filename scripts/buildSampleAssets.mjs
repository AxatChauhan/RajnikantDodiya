import fs from 'fs';
import path from 'path';

/**
 * Robust, standard-compliant PDF 1.4 generator for Node.js
 * Generates genuine multi-page PDFs with fonts, text wrapping, graphics, headers, and footers.
 */
class SimplePdfDoc {
  constructor(title, subject = 'UGC NET English Study Materials') {
    this.title = title;
    this.subject = subject;
    this.author = 'Dr. Rajnikant Dodiya';
    this.pages = []; // Array of stream instructions strings
    this.currentPage = null;
    this.pageWidth = 595.28;  // A4 width in pt
    this.pageHeight = 841.89; // A4 height in pt
  }

  addPage() {
    this.currentPage = {
      commands: [],
      y: 770,
      left: 50,
      right: 545,
      bottom: 50
    };
    this.pages.push(this.currentPage);
    return this.currentPage;
  }

  escapePdfText(text) {
    if (!text) return '';
    return text
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2013\u2014]/g, '-')
      .replace(/•/g, '-')
      .replace(/₹/g, 'INR ')
      .replace(/[^\x20-\x7E]/g, ' '); // Keep printable ASCII
  }

  drawHeader(headerTitle) {
    const esc = this.escapePdfText(headerTitle);
    this.currentPage.commands.push(
      'q',
      '0.086 0.165 0.271 rg', // #162A45 primary oxford navy
      `BT /F2 9 Tf 50 810 Td (${esc}) Tj ET`,
      '0.8 0.8 0.8 RG 0.5 w',
      '50 802 m 545 802 l S',
      'Q'
    );
  }

  drawFooter(pageNum, totalPages) {
    const escLeft = this.escapePdfText('NET Vidya English • Dr. Rajnikant Dodiya • store.rajnikantdodiya.com');
    const escRight = `Page ${pageNum} of ${totalPages}`;
    this.currentPage.commands.push(
      'q',
      '0.8 0.8 0.8 RG 0.5 w',
      '50 45 m 545 45 l S',
      '0.3 0.3 0.3 rg',
      `BT /F1 8 Tf 50 32 Td (${escLeft}) Tj ET`,
      `BT /F1 8 Tf 500 32 Td (${escRight}) Tj ET`,
      'Q'
    );
  }

  drawBanner(x, y, w, h, bgColor, strokeColor) {
    this.currentPage.commands.push(
      'q',
      `${bgColor[0]} ${bgColor[1]} ${bgColor[2]} rg`,
      `${strokeColor[0]} ${strokeColor[1]} ${strokeColor[2]} RG 0.75 w`,
      `${x} ${y} ${w} ${h} re B`,
      'Q'
    );
  }

  addHeading(text, size = 16, color = [0.086, 0.165, 0.271]) {
    if (this.currentPage.y < 90) this.addPage();
    const esc = this.escapePdfText(text);
    this.currentPage.commands.push(
      'q',
      `${color[0]} ${color[1]} ${color[2]} rg`,
      `BT /F2 ${size} Tf ${this.currentPage.left} ${this.currentPage.y} Td (${esc}) Tj ET`,
      'Q'
    );
    this.currentPage.y -= (size + 6);
  }

  addSubHeading(text, size = 12, color = [0.15, 0.25, 0.4]) {
    if (this.currentPage.y < 80) this.addPage();
    const esc = this.escapePdfText(text);
    this.currentPage.commands.push(
      'q',
      `${color[0]} ${color[1]} ${color[2]} rg`,
      `BT /F2 ${size} Tf ${this.currentPage.left} ${this.currentPage.y} Td (${esc}) Tj ET`,
      'Q'
    );
    this.currentPage.y -= (size + 4);
  }

  addParagraph(text, font = 'F1', size = 10, color = [0.1, 0.1, 0.1], lineHeight = 13) {
    const maxWidth = this.currentPage.right - this.currentPage.left;
    const words = text.split(' ');
    let currentLine = '';

    for (let word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      // Approximate character width in points (Helvetica approx 0.52 * size)
      const approxWidth = testLine.length * (size * 0.52);

      if (approxWidth > maxWidth && currentLine) {
        if (this.currentPage.y < 60) this.addPage();
        const esc = this.escapePdfText(currentLine);
        this.currentPage.commands.push(
          'q',
          `${color[0]} ${color[1]} ${color[2]} rg`,
          `BT /${font} ${size} Tf ${this.currentPage.left} ${this.currentPage.y} Td (${esc}) Tj ET`,
          'Q'
        );
        this.currentPage.y -= lineHeight;
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      if (this.currentPage.y < 60) this.addPage();
      const esc = this.escapePdfText(currentLine);
      this.currentPage.commands.push(
        'q',
        `${color[0]} ${color[1]} ${color[2]} rg`,
        `BT /${font} ${size} Tf ${this.currentPage.left} ${this.currentPage.y} Td (${esc}) Tj ET`,
        'Q'
      );
      this.currentPage.y -= lineHeight;
    }
    this.currentPage.y -= 3; // paragraph spacing
  }

  addQuestion(num, text, options, topicTag = '') {
    // Check if question fits (needs ~80pt)
    if (this.currentPage.y < 120) {
      this.addPage();
    }

    // Question header with topic tag
    if (topicTag) {
      const tagEsc = this.escapePdfText(`[Unit / Topic: ${topicTag}]`);
      this.currentPage.commands.push(
        'q',
        '0.1 0.45 0.3 rg',
        `BT /F3 8 Tf ${this.currentPage.left} ${this.currentPage.y} Td (${tagEsc}) Tj ET`,
        'Q'
      );
      this.currentPage.y -= 11;
    }

    // Question text
    this.addParagraph(`Q${num}. ${text}`, 'F2', 10, [0.08, 0.12, 0.2], 13);

    // Options (A, B, C, D)
    const labels = ['(A)', '(B)', '(C)', '(D)'];
    options.forEach((opt, idx) => {
      this.addParagraph(`   ${labels[idx]} ${opt}`, 'F1', 9.5, [0.15, 0.15, 0.15], 12);
    });

    this.currentPage.y -= 4; // Space after question
  }

  addExplanationBlock(num, questionText, correctAnswerLabel, explanation, rationale) {
    if (this.currentPage.y < 140) this.addPage();

    // Box outline
    const startY = this.currentPage.y + 4;
    this.addParagraph(`Question ${num}: ${questionText}`, 'F2', 10, [0.086, 0.165, 0.271], 13);
    this.addParagraph(`Correct Answer: ${correctAnswerLabel}`, 'F2', 9.5, [0.05, 0.5, 0.2], 12);
    this.addParagraph(`Analytical Rationale: ${explanation}`, 'F1', 9, [0.2, 0.2, 0.2], 12);
    if (rationale) {
      this.addParagraph(`Distractor Breakdown: ${rationale}`, 'F3', 8.5, [0.35, 0.35, 0.35], 11);
    }
    this.currentPage.y -= 8;
  }

  build() {
    const totalPages = this.pages.length;
    // Add headers and footers to every page
    this.pages.forEach((p, idx) => {
      this.currentPage = p;
      this.drawHeader(this.title);
      this.drawFooter(idx + 1, totalPages);
    });

    // Generate PDF Objects
    const objects = [];
    let objCount = 0;

    function createObj(content) {
      objCount++;
      objects.push({ id: objCount, content });
      return objCount;
    }

    // 1: Catalog
    const catalogId = createObj('<< /Type /Catalog /Pages 2 0 R >>');

    // 2: Pages (Kids placeholder, we fill after page objs created)
    const pagesObjIndex = objects.length;
    createObj('PAGES_PLACEHOLDER');

    // Fonts: F1 = Helvetica, F2 = Helvetica-Bold, F3 = Helvetica-Oblique
    const f1Id = createObj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
    const f2Id = createObj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');
    const f3Id = createObj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique >>');

    const pageObjIds = [];

    // Create Page objects and their Content streams
    for (let page of this.pages) {
      const streamData = page.commands.join('\n');
      const streamId = createObj(`<< /Length ${Buffer.byteLength(streamData, 'utf-8')} >>\nstream\n${streamData}\nendstream`);

      const pageId = createObj(
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${this.pageWidth} ${this.pageHeight}] ` +
        `/Resources << /Font << /F1 ${f1Id} 0 R /F2 ${f2Id} 0 R /F3 ${f3Id} 0 R >> >> ` +
        `/Contents ${streamId} 0 R >>`
      );
      pageObjIds.push(pageId);
    }

    // Update Pages Object (2 0 R)
    const kidsStr = pageObjIds.map(id => `${id} 0 R`).join(' ');
    objects[pagesObjIndex].content = `<< /Type /Pages /Kids [${kidsStr}] /Count ${pageObjIds.length} >>`;

    // Assembly
    let output = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
    const xrefOffsets = [];

    for (let obj of objects) {
      xrefOffsets[obj.id] = Buffer.byteLength(output, 'binary');
      output += `${obj.id} 0 obj\n${obj.content}\nendobj\n`;
    }

    const startXref = Buffer.byteLength(output, 'binary');
    output += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;

    for (let i = 1; i <= objects.length; i++) {
      const offsetStr = String(xrefOffsets[i]).padStart(10, '0');
      output += `${offsetStr} 00000 n \n`;
    }

    output += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R /Info << /Title (${this.escapePdfText(this.title)}) /Author (${this.escapePdfText(this.author)}) /Subject (${this.escapePdfText(this.subject)}) >> >>\nstartxref\n${startXref}\n%%EOF\n`;

    return Buffer.from(output, 'binary');
  }
}

// -----------------------------------------------------------------------------
// ASSET 1: NetVidya_25_Question_Mini_Mock.pdf
// -----------------------------------------------------------------------------
export function generate25QuestionMiniMockPdf() {
  const doc = new SimplePdfDoc('NET Vidya English — UGC NET & GSET 25-Question Mini Mock');
  doc.addPage();

  // Cover / Header Banner
  doc.addHeading('NET Vidya English: 25-Question Mini Mock Examination', 16, [0.086, 0.165, 0.271]);
  doc.addSubHeading('Paper II English Literature & Cultural Studies • Diagnostic Benchmark Test', 11, [0.2, 0.35, 0.6]);
  doc.addParagraph(
    'Curated by Dr. Rajnikant Dodiya (Ph.D., 2× NET & GSET Qualified). Sold by NET Vidya (Proprietor: Nilam Dodiya). This public sample contains 25 authentic examination-standard multiple-choice questions with answer key representing the actual syllabus domains of UGC NET / GSET 2026.',
    'F3', 8.5, [0.35, 0.35, 0.35], 11
  );
  doc.currentPage.y -= 8;

  const questions = [
    {
      num: 1,
      topic: 'Unit 9: English in India & ELT',
      q: 'B. Kumaravadivelu’s "Post-Method Pedagogy" is structurally articulated around which triad of organizational parameters?',
      opts: [
        'Particularity, Practicality, and Possibility',
        'Grammar, Vocabulary, and Syntax',
        'Proficiency, Performance, and Paradigm',
        'Curriculum, Instruction, and Evaluation'
      ]
    },
    {
      num: 2,
      topic: 'Unit 2: Drama (Shakespearean Poetics)',
      q: 'In Shakespeare’s The Tempest, which character utters the famous lines: “You taught me language; and my profit on’t / Is, I know how to curse. The red plague rid you / For learning me your language!”?',
      opts: ['Ariel', 'Caliban', 'Ferdinand', 'Trinculo']
    },
    {
      num: 3,
      topic: 'Unit 8: Literary Criticism (Romantic)',
      q: 'Who formulated the critical concept "Willing suspension of disbelief for the moment, which constitutes poetic faith"?',
      opts: ['William Wordsworth', 'Samuel Taylor Coleridge', 'Percy Bysshe Shelley', 'John Keats']
    },
    {
      num: 4,
      topic: 'Unit 7: Cultural Studies',
      q: 'Stuart Hall’s seminal 1973 model of television communication identifies which three decoding positions for audiences?',
      opts: [
        'Dominant-Hegemonic, Negotiated, and Oppositional',
        'Linear, Interactive, and Transactional',
        'Cognitive, Affective, and Psychomotor',
        'Literal, Metaphorical, and Allegorical'
      ]
    },
    {
      num: 5,
      topic: 'Unit 1: Poetry (Modern Indian English)',
      q: 'Which Indian English poet authored the autobiographical three-part collection "Rough Passage" (1977)?',
      opts: ['Nissim Ezekiel', 'A.K. Ramanujan', 'R. Parthasarathy', 'Jayanta Mahapatra']
    },
    {
      num: 6,
      topic: 'Unit 8: Literary Theory (New Criticism)',
      q: 'Who defined the "Intentional Fallacy" and "Affective Fallacy" in classic American New Criticism?',
      opts: [
        'T.S. Eliot and I.A. Richards',
        'W.K. Wimsatt Jr. and Monroe C. Beardsley',
        'Cleanth Brooks and Robert Penn Warren',
        'John Crowe Ransom and Allen Tate'
      ]
    },
    {
      num: 7,
      topic: 'Unit 8: Postcolonial Theory',
      q: 'In "Orientalism" (1978), Edward Said explicitly bases his methodology on which French philosopher’s notion of "discourse" and power-knowledge?',
      opts: ['Jacques Derrida', 'Michel Foucault', 'Louis Althusser', 'Roland Barthes']
    },
    {
      num: 8,
      topic: 'Unit 10: Research Methods in English',
      q: 'In the MLA Handbook (9th Edition), what constitutes the fixed sequence of the 9 universal core elements in a container citation?',
      opts: [
        'Author. Title of source. Title of container, Other contributors, Version, Number, Publisher, Publication date, Location.',
        'Author, Year, Title of source, Publisher, City of Publication, Pages.',
        'Title of source, Author, Publisher, Year, Location, DOI.',
        'Author. Title of source. Publisher, Year, Volume, Issue, Pages.'
      ]
    },
    {
      num: 9,
      topic: 'Unit 8: 20th Century Critical Idioms',
      q: 'In "Tradition and the Individual Talent" (1919), T.S. Eliot compares the poet’s mind to which catalyst in a chemical reaction?',
      opts: [
        'A filament of platinum',
        'A rod of incandescent copper',
        'A drop of sulphuric acid',
        'A prism of crystal quartz'
      ]
    },
    {
      num: 10,
      topic: 'Unit 8: Postcolonial Studies',
      q: 'Which postcolonial theorist coined the interrelated concepts of "Mimicry", "Hybridity", and the "Third Space" in The Location of Culture?',
      opts: ['Frantz Fanon', 'Homi K. Bhabha', 'Gayatri Chakravorty Spivak', 'Achille Mbembe']
    },
    {
      num: 11,
      topic: 'Unit 1: Poetry (Middle English)',
      q: 'Geoffrey Chaucer’s General Prologue to The Canterbury Tales famously opens with a depiction of which seasonal month?',
      opts: ['March', 'April', 'May', 'June']
    },
    {
      num: 12,
      topic: 'Unit 1: Poetry (17th Century Epic)',
      q: 'In Milton’s Paradise Lost (Book I), Satan proclaims: “The mind is its own place, and in it self / Can make a Heav’n of Hell, a Hell of Heav’n.” In which verse form is the epic composed?',
      opts: ['Rhymed Iambic Hexameter', 'Heroic Couplets', 'Unrhymed Iambic Pentameter (Blank Verse)', 'Ottava Rima']
    },
    {
      num: 13,
      topic: 'Unit 1: Metaphysical Conceits',
      q: 'In John Donne’s "A Valediction: Forbidding Mourning", the souls of the two lovers are famously compared to which scientific instrument?',
      opts: [
        'A magnetic mariner’s compass',
        'Stiff twin compasses of a draughtsman',
        'An astronomical astrolabe',
        'A Galilean optical telescope'
      ]
    },
    {
      num: 14,
      topic: 'Unit 1: Neoclassical Mock-Epic',
      q: 'In Alexander Pope’s The Rape of the Lock, what is the name of the chief sylph assigned to guard Belinda’s sacred lapdog, Shock?',
      opts: ['Ariel', 'Crispissa', 'Momentilla', 'Brillante']
    },
    {
      num: 15,
      topic: 'Unit 4: Non-Fictional Prose',
      q: 'Mary Wollstonecraft’s foundational treatise A Vindication of the Rights of Woman was published in which pivotal year of Enlightenment debate?',
      opts: ['1789', '1792', '1798', '1802']
    },
    {
      num: 16,
      topic: 'Unit 4: Feminist Literary Theory',
      q: 'In A Room of One’s Own (1929), Virginia Woolf invents which fictional sister of William Shakespeare to illustrate systemic gender oppression?',
      opts: ['Ophelia Shakespeare', 'Judith Shakespeare', 'Cordelia Shakespeare', 'Beatrice Shakespeare']
    },
    {
      num: 17,
      topic: 'Unit 3: Fiction (African Literature)',
      q: 'Chinua Achebe took the title of his historic debut novel Things Fall Apart (1958) from which modernist poem by W.B. Yeats?',
      opts: ['Sailing to Byzantium', 'The Second Coming', 'Easter 1916', 'Leda and the Swan']
    },
    {
      num: 18,
      topic: 'Unit 8: Subaltern Studies',
      q: 'In "Can the Subaltern Speak?" (1988), Gayatri Chakravorty Spivak analyzes the suicide of which young Bengali woman to demonstrate gendered silencing?',
      opts: ['Sarala Devi Chaudhurani', 'Bhubaneswari Bhaduri', 'Torulata Dasi', 'Kadambini Ganguly']
    },
    {
      num: 19,
      topic: 'Unit 7: Cultural Materialism',
      q: 'Which British cultural critic articulated the concept "Structure of Feeling" to describe meanings and values actively lived and felt before formalization?',
      opts: ['Richard Hoggart', 'Raymond Williams', 'E.P. Thompson', 'Terry Eagleton']
    },
    {
      num: 20,
      topic: 'Unit 8: Narrative Poetics',
      q: 'Mikhail Bakhtin introduced the concepts of "Heteroglossia" and "Carnivalesque" in his analysis of which Renaissance author’s novels?',
      opts: ['Miguel de Cervantes', 'Francois Rabelais', 'Giovanni Boccaccio', 'Thomas Nashe']
    },
    {
      num: 21,
      topic: 'Unit 3: Indian English Fiction',
      q: 'Which Indian author authored the celebrated 1938 Foreword asserting: “English is not an alien tongue to us... We cannot write like the English. We should not. We can write only as Indians”?',
      opts: ['Mulk Raj Anand', 'R.K. Narayan', 'Raja Rao', 'Bhabani Bhattacharya']
    },
    {
      num: 22,
      topic: 'Unit 8: Post-Structuralism',
      q: 'Jacques Derrida delivered which landmark lecture at Johns Hopkins University in 1966 that heralded the arrival of Deconstruction in America?',
      opts: [
        'Structure, Sign, and Play in the Discourse of the Human Sciences',
        'Of Grammatology and the Trace',
        'Différance and the Transcendental Signified',
        'The Ends of Man and Humanism'
      ]
    },
    {
      num: 23,
      topic: 'Unit 9: Language History in India',
      q: 'Whose 1835 "Minute on Indian Education" infamously asserted that “a single shelf of a good European library was worth the whole native literature of India and Arabia”?',
      opts: ['Lord William Bentinck', 'Thomas Babington Macaulay', 'Charles Wood', 'Lord Curzon']
    },
    {
      num: 24,
      topic: 'Unit 8: Post-Structural Criticism',
      q: 'In "The Death of the Author" (1967), Roland Barthes concludes with the famous thesis: “The birth of the reader must be ransomed by the...”',
      opts: [
        'Death of the Author',
        'Resurrection of Language',
        'Demise of the Critic',
        'Destruction of the Canon'
      ]
    },
    {
      num: 25,
      topic: 'Unit 10: Academic Integrity & Ethics',
      q: 'Under UGC (Promotion of Academic Integrity and Prevention of Plagiarism in Higher Educational Institutions) Regulations 2018, Level 2 plagiarism corresponds to similarities of what percentage range?',
      opts: ['Up to 10%', 'Above 10% to 40%', 'Above 40% to 60%', 'Above 60%']
    }
  ];

  for (let q of questions) {
    doc.addQuestion(q.num, q.q, q.opts, q.topic);
  }

  // Answer Key Page
  doc.addPage();
  doc.addHeading('OFFICIAL ANSWER KEY & SYLLABUS MAPPING', 15, [0.086, 0.165, 0.271]);
  doc.addParagraph('Complete verified answer key for Questions 1 through 25:', 'F1', 10, [0.2, 0.2, 0.2]);

  const answerKeys = [
    { q: '1', ans: 'A', topic: 'ELT & Pedagogy', unit: 'Unit 9' },
    { q: '2', ans: 'B', topic: 'British Drama', unit: 'Unit 2' },
    { q: '3', ans: 'B', topic: 'Literary Criticism', unit: 'Unit 8' },
    { q: '4', ans: 'A', topic: 'Cultural Studies', unit: 'Unit 7' },
    { q: '5', ans: 'C', topic: 'Indian Poetry', unit: 'Unit 1' },
    { q: '6', ans: 'B', topic: 'New Criticism', unit: 'Unit 8' },
    { q: '7', ans: 'B', topic: 'Postcolonial Theory', unit: 'Unit 8' },
    { q: '8', ans: 'A', topic: 'Research Methodology', unit: 'Unit 10' },
    { q: '9', ans: 'A', topic: 'Modern Criticism', unit: 'Unit 8' },
    { q: '10', ans: 'B', topic: 'Postcolonialism', unit: 'Unit 8' },
    { q: '11', ans: 'B', topic: 'British Poetry', unit: 'Unit 1' },
    { q: '12', ans: 'C', topic: 'Epic Poetics', unit: 'Unit 1' },
    { q: '13', ans: 'B', topic: 'Metaphysical Poetry', unit: 'Unit 1' },
    { q: '14', ans: 'A', topic: 'Neoclassical Satire', unit: 'Unit 1' },
    { q: '15', ans: 'B', topic: 'Feminist Prose', unit: 'Unit 4' },
    { q: '16', ans: 'B', topic: 'Feminist Theory', unit: 'Unit 4' },
    { q: '17', ans: 'B', topic: 'World Literature', unit: 'Unit 3' },
    { q: '18', ans: 'B', topic: 'Subaltern Studies', unit: 'Unit 8' },
    { q: '19', ans: 'B', topic: 'Cultural Materialism', unit: 'Unit 7' },
    { q: '20', ans: 'B', topic: 'Bakhtinian Poetics', unit: 'Unit 8' },
    { q: '21', ans: 'C', topic: 'Indian English Fiction', unit: 'Unit 3' },
    { q: '22', ans: 'A', topic: 'Deconstruction', unit: 'Unit 8' },
    { q: '23', ans: 'B', topic: 'Language in India', unit: 'Unit 9' },
    { q: '24', ans: 'A', topic: 'Structuralism', unit: 'Unit 8' },
    { q: '25', ans: 'C', topic: 'Research Ethics', unit: 'Unit 10' }
  ];

  doc.currentPage.commands.push(
    'q',
    '0.93 0.95 0.98 rg 50 480 495 240 re f',
    '0.2 0.3 0.5 RG 0.5 w 50 480 495 240 re S',
    'Q'
  );

  let col1X = 65;
  let col2X = 230;
  let col3X = 395;
  let startTableY = 700;

  for (let i = 0; i < 25; i++) {
    const item = answerKeys[i];
    let curX = col1X;
    let curY = startTableY - (i % 9) * 22;
    if (i >= 9 && i < 18) curX = col2X;
    if (i >= 18) curX = col3X;

    const rowText = doc.escapePdfText(`Q${item.q.padStart(2, ' ')}: [Option ${item.ans}]  (${item.unit})`);
    doc.currentPage.commands.push(
      'q',
      '0.086 0.165 0.271 rg',
      `BT /F2 9 Tf ${curX} ${curY} Td (${rowText}) Tj ET`,
      'Q'
    );
  }

  doc.currentPage.y = 440;
  doc.addHeading('Unlock the Full Final Pack 2026', 13, [0.086, 0.165, 0.271]);
  doc.addParagraph(
    'Ready for complete Paper II mastery? Enroll in the "GSET + UGC NET English Final Pack 2026" to receive:',
    'F2', 10, [0.1, 0.1, 0.1]
  );
  doc.addParagraph('• 5 Full-Length 100-Question NTA Simulated CBT Mock Tests with real-time countdown timer.', 'F1', 9.5);
  doc.addParagraph('• Unit-wise Diagnostic Question Banks covering British, American, Indian & World literatures.', 'F1', 9.5);
  doc.addParagraph('• 5 Bonus Practice Mocks + Analytical Model Rationales citing key critical editions.', 'F1', 9.5);
  doc.addParagraph('• Complete Downloadable High-Yield Reading Dossiers (PDFs) with permanent retention.', 'F1', 9.5);
  doc.addParagraph('• Continuous online access across phone, tablet, and laptop through 31 December 2026.', 'F1', 9.5);
  doc.currentPage.y -= 8;
  doc.addParagraph('Visit: https://store.rajnikantdodiya.com to register and begin preparation today.', 'F2', 10, [0.1, 0.35, 0.7]);

  return doc.build();
}


// -----------------------------------------------------------------------------
// ASSET 2: NetVidya_Model_Answers_Sample.pdf
// -----------------------------------------------------------------------------
export function generateModelAnswersSamplePdf() {
  const doc = new SimplePdfDoc('NET Vidya English — Model Answers & Pedagogical Rationales');
  doc.addPage();

  doc.addHeading('NET Vidya English: Model Answers & Pedagogical Rationales', 16, [0.086, 0.165, 0.271]);
  doc.addSubHeading('Comprehensive Distractor Analysis & Syllabus Mapping Dossier', 11, [0.2, 0.35, 0.6]);
  doc.addParagraph(
    'Prepared by Dr. Rajnikant Dodiya (Ph.D., 2× NET & GSET Qualified). Sold by NET Vidya (Proprietor: Nilam Dodiya). In NTA examinations, choosing the right answer requires deep theoretical grounding and systematic elimination of subtly flawed distractors. This dossier demonstrates our pedagogical rationale method across key syllabus units.',
    'F3', 8.5, [0.35, 0.35, 0.35], 11
  );
  doc.currentPage.y -= 10;

  // Question 1 Explanation
  doc.addExplanationBlock(
    1,
    'Kumaravadivelu’s "Post-Method Pedagogy" organizational triad.',
    '(A) Particularity, Practicality, and Possibility',
    'In his seminal texts "Toward a Postmethod Pedagogy" (TESOL Quarterly, 2001) and "Beyond Methods: Macrostrategies for Language Teaching" (2003), B. Kumaravadivelu argued that traditional top-down methods (Grammar-Translation, Audio-Lingual, CLT) ignore the complex realities of individual classrooms. He formulated the three operating principles: (1) Particularity: language teaching must be sensitive to a particular group of teachers teaching a particular group of learners pursuing a particular set of goals within a particular institutional context; (2) Practicality: bridges the rupture between professional theories and personal teacher knowledge through reflective action; (3) Possibility: informed by critical pedagogy (Paulo Freire), empowering learners to question sociopolitical inequalities encoded in the target language.',
    'Distractor Analysis: (B) "Grammar, Vocabulary, Syntax" represents archaic structuralist linguistic categories; (C) "Proficiency, Performance, Paradigm" confuses Chomskyan competence-performance with pedagogy; (D) "Curriculum, Instruction, Evaluation" refers to standard Tylerian curriculum design, not post-method parameters.'
  );

  // Question 2 Explanation
  doc.addExplanationBlock(
    2,
    'Shakespeare’s The Tempest: "You taught me language; and my profit on’t / Is, I know how to curse."',
    '(B) Caliban',
    'In Act I, Scene 2, Caliban delivers this response to Prospero and Miranda. This passage serves as the foundational text for postcolonial Shakespearean criticism (notably examined by Aimé Césaire in "Une Tempête", Frantz Fanon in "Black Skin, White Masks", and George Lamming in "The Pleasures of Exile"). It exposes how linguistic hegemony functions in colonial encounters: the colonizer imposes European linguistic structures, yet the subaltern subject appropriates that very tongue to voice anticolonial rebellion.',
    'Distractor Analysis: (A) Ariel represents the willing, collaborative native seeking conditional liberty through compliance; (C) Ferdinand represents the patriarchal, chivalric European order; (D) Trinculo represents the drunken jester embodying domestic plebeian buffoonery.'
  );

  // Question 3 Explanation
  doc.addExplanationBlock(
    3,
    'Coleridge’s "Willing suspension of disbelief for the moment, which constitutes poetic faith".',
    '(B) Samuel Taylor Coleridge',
    'Samuel Taylor Coleridge coined this phrase in Chapter XIV of Biographia Literaria (1817). In describing the division of labor between Wordsworth and himself in "Lyrical Ballads" (1798), Coleridge explained that his own endeavor was directed to persons and characters supernatural, or at least romantic; yet so as to transfer from our inward nature a human interest and a semblance of truth sufficient to procure for these shadows of imagination that willing suspension of disbelief.',
    'Distractor Analysis: (A) Wordsworth formulated the definition of poetry as "the spontaneous overflow of powerful feelings" recollected in tranquility (Preface to Lyrical Ballads, 1800); (C) Shelley wrote "A Defence of Poetry" (1821), calling poets "unacknowledged legislators of the world"; (D) Keats formulated "Negative Capability" in his December 1817 letter to George and Thomas Keats.'
  );

  // Question 4 Explanation
  doc.addExplanationBlock(
    4,
    'Stuart Hall’s 1973 Communication Model: Three hypothetical decoding positions.',
    '(A) Dominant-Hegemonic, Negotiated, and Oppositional',
    'In his groundbreaking Centre for Contemporary Cultural Studies (CCCS) working paper "Encoding and Decoding in the Television Discourse" (1973), Stuart Hall rejected passive audience models. Hall demonstrated that between sender encoding and receiver decoding lies ideological asymmetry: (1) Dominant-Hegemonic: the viewer decodes the message directly inside the dominant ideology; (2) Negotiated: the viewer acknowledges the legitimacy of hegemonic definitions in the abstract, but makes negotiated exceptions for localized conditions; (3) Oppositional: the viewer perfectly understands the literal and connotative inflections, but re-interprets the message within an alternative, oppositional frame of reference.',
    'Distractor Analysis: (B) Linear, Interactive, and Transactional are generic Shannon-Weaver transmission models; (C) Cognitive, Affective, and Psychomotor represent Benjamin Bloom’s taxonomy of educational objectives; (D) Literal, Metaphorical, Allegorical represent medieval hermeneutic levels.'
  );

  // Question 5 Explanation
  doc.addExplanationBlock(
    5,
    'Edward Said’s Orientalism (1978) and Foucault’s Discourse.',
    '(B) Michel Foucault',
    'In the Introduction to "Orientalism", Edward Said explicitly credits Michel Foucault: "I have found it useful here to employ Michel Foucault’s notion of a discourse, as described by him in The Archaeology of Knowledge and in Discipline and Punish, to identify Orientalism. My contention is that without examining Orientalism as a discourse one cannot possibly understand the enormously systematic discipline by which European culture was able to manage—and even produce—the Orient." Said unites Foucault’s power-knowledge nexus with Antonio Gramsci’s concept of cultural hegemony.',
    'Distractor Analysis: (A) Derrida proposed textuality and différance, which Said critiqued as detached from material politics; (C) Althusser formulated Ideological State Apparatuses (ISAs); (D) Barthes analyzed semiotics and mythologies.'
  );

  // Syllabus Mapping Guide on next page
  doc.addPage();
  doc.addHeading('OFFICIAL UGC NET ENGLISH SYLLABUS MAPPING (UNITS 1–10)', 14, [0.086, 0.165, 0.271]);
  doc.addParagraph(
    'Every question in the Final Pack 2026 is tagged with precision against the 10 UGC-NET syllabus modules:',
    'F1', 9.5, [0.2, 0.2, 0.2]
  );
  doc.currentPage.y -= 4;

  const units = [
    { u: 'Unit 1: Drama', desc: 'Elizabethan, Jacobean, Restoration comedy, Irish dramatic movement, Theatre of the Absurd, Kitchen-sink realism, Post-war British & World drama.' },
    { u: 'Unit 2: Poetry', desc: 'Chaucer to Metaphysicals, Augustan verse, Romantics, Victorian masters, Modernists (Eliot, Yeats, Auden), Post-1945 movements, Indian English poetry.' },
    { u: 'Unit 3: Fiction, Short Story', desc: 'Early prose romances, rise of the 18th-century English novel, Victorian social realism, Modernist experimentation, Postmodern metafiction, Dalit & Partition literature.' },
    { u: 'Unit 4: Non-Fictional Prose', desc: 'Renaissance essays (Bacon), 18th-century periodical essays (Addison & Steele), Romantic criticism, Victorian polemics (Carlyle, Ruskin), Life writings & memoirs.' },
    { u: 'Unit 5: Language: Basic Concepts, Theories & Pedagogy', desc: 'Phonetics, morphology, syntax, semantics, pragmatics, SLA theories, Krashen’s hypotheses, Chomskyan Universal Grammar.' },
    { u: 'Unit 6: English in India: History, Evolution & Futures', desc: 'Charter Act 1813, Macaulay’s Minute 1835, Woods Despatch 1854, Radhakrishnan & Kothari Commissions, NEP 2020, World Englishes.' },
    { u: 'Unit 7: Cultural Studies', desc: 'Birmingham School (CCCS), Raymond Williams, Richard Hoggart, Stuart Hall, subcultures, media hegemony, gender, race and intersectionality.' },
    { u: 'Unit 8: Literary Criticism & Theory', desc: 'Classical poetics (Aristotle, Longinus), Neoclassical rules, Romantic poetics, Russian Formalism, New Criticism, Structuralism, Deconstruction, Postcolonialism, Ecocriticism.' },
    { u: 'Unit 9: Research Methods & Materials in English', desc: 'Research design, hypothesis testing, qualitative vs quantitative methods, archives, bibliography, MLA 9th documentation standards, citation ethics.' },
    { u: 'Unit 10: Institutional Evaluation & Test Strategy', desc: 'Item analysis, discrimination index, distractors evaluation, NTA CBT navigation tactics, time management across 100 questions.' }
  ];

  units.forEach(u => {
    doc.addParagraph(u.u, 'F2', 9.5, [0.086, 0.165, 0.271], 12);
    doc.addParagraph(u.desc, 'F1', 8.5, [0.3, 0.3, 0.3], 11);
    doc.currentPage.y -= 3;
  });

  doc.currentPage.y -= 6;
  doc.addHeading('Enroll in NET Vidya English Final Pack 2026', 12, [0.086, 0.165, 0.271]);
  doc.addParagraph(
    'Unlock all 10+ Complete Mock Tests, complete reading dossiers, and interactive NTA CBT hall at https://store.rajnikantdodiya.com. One-time fee, instant activation, access valid through 31 Dec 2026.',
    'F3', 9, [0.1, 0.35, 0.7], 12
  );

  return doc.build();
}

// -----------------------------------------------------------------------------
// ASSET 3: public/sample-materials/demo-test.html
// -----------------------------------------------------------------------------
export function generateDemoTestHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NET Vidya English — Free NTA CBT Demo Mock Test</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      background-color: #f1f5f9;
      color: #0f172a;
      line-height: 1.5;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .font-mono { font-family: 'JetBrains Mono', monospace; font-variant-numeric: tabular-nums; }
    
    /* Top Header */
    header {
      background: #0f1d32;
      color: #ffffff;
      padding: 0.75rem 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid #234168;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }
    .header-brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .brand-badge {
      background: #2563eb;
      color: #fff;
      font-weight: 800;
      font-size: 0.75rem;
      padding: 0.2rem 0.5rem;
      border-radius: 0.375rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .header-title {
      font-size: 0.95rem;
      font-weight: 700;
    }
    .header-meta {
      font-size: 0.75rem;
      color: #94a3b8;
    }
    .timer-badge {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: #1e293b;
      padding: 0.4rem 0.85rem;
      border-radius: 0.5rem;
      border: 1px solid #334155;
      font-weight: 700;
      color: #38bdf8;
      font-size: 0.9rem;
    }

    /* Candidate Info Bar */
    .candidate-bar {
      background: #ffffff;
      border-bottom: 1px solid #e2e8f0;
      padding: 0.5rem 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.8rem;
    }
    .candidate-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .candidate-name { font-weight: 700; color: #0f172a; }
    .exam-tag { background: #e0e7ff; color: #3730a3; padding: 0.15rem 0.5rem; border-radius: 0.25rem; font-weight: 600; font-size: 0.7rem; }

    /* Main Test Layout */
    .test-container {
      display: flex;
      flex: 1;
      height: calc(100vh - 170px);
      min-height: 500px;
    }
    .question-panel {
      flex: 1;
      padding: 1.5rem;
      overflow-y: auto;
      background: #ffffff;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .sidebar {
      width: 320px;
      background: #f8fafc;
      border-left: 1px solid #cbd5e1;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      padding: 1rem;
      gap: 1rem;
    }

    /* Question Styling */
    .question-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 0.75rem;
      border-bottom: 2px solid #e2e8f0;
      margin-bottom: 1.25rem;
    }
    .q-number {
      font-size: 1.1rem;
      font-weight: 800;
      color: #0f2744;
    }
    .marks-badge {
      font-size: 0.75rem;
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
      padding: 0.2rem 0.5rem;
      border-radius: 0.375rem;
      font-weight: 700;
    }
    .question-text {
      font-size: 1.05rem;
      font-weight: 600;
      color: #1e293b;
      line-height: 1.6;
      margin-bottom: 1.5rem;
    }
    .options-group {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
    }
    .option-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.85rem 1rem;
      border: 1.5px solid #cbd5e1;
      border-radius: 0.625rem;
      cursor: pointer;
      font-size: 0.95rem;
      transition: all 0.15s ease-in-out;
      background: #fff;
    }
    .option-item:hover {
      border-color: #2563eb;
      background: #eff6ff;
    }
    .option-item.selected {
      border-color: #2563eb;
      background: #dbeafe;
      font-weight: 600;
      color: #1e40af;
    }
    .option-item input[type="radio"] {
      width: 1.15rem;
      height: 1.15rem;
      accent-color: #2563eb;
    }

    /* Control Buttons */
    .control-actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      padding-top: 1rem;
      border-top: 1px solid #e2e8f0;
    }
    .btn {
      padding: 0.55rem 1rem;
      border-radius: 0.5rem;
      font-size: 0.825rem;
      font-weight: 700;
      cursor: pointer;
      border: 1px solid transparent;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      transition: all 0.15s ease;
    }
    .btn-primary { background: #2563eb; color: #fff; }
    .btn-primary:hover { background: #1d4ed8; }
    .btn-outline { background: #fff; border-color: #cbd5e1; color: #334155; }
    .btn-outline:hover { background: #f1f5f9; }
    .btn-warning { background: #fef3c7; color: #92400e; border-color: #fde68a; }
    .btn-warning:hover { background: #fde68a; }
    .btn-danger { background: #fee2e2; color: #991b1b; }
    .btn-success { background: #10b981; color: #fff; }
    .btn-success:hover { background: #059669; }

    /* Palette Legend */
    .legend-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.5rem;
      font-size: 0.7rem;
      background: #fff;
      padding: 0.75rem;
      border-radius: 0.5rem;
      border: 1px solid #e2e8f0;
    }
    .legend-item { display: flex; align-items: center; gap: 0.4rem; }
    .legend-chip {
      width: 1.35rem;
      height: 1.35rem;
      border-radius: 0.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.7rem;
      color: #fff;
    }
    .chip-answered { background: #10b981; }
    .chip-not-answered { background: #ef4444; }
    .chip-not-visited { background: #94a3b8; }
    .chip-marked-review { background: #8b5cf6; }

    /* Palette Grid */
    .palette-box {
      background: #fff;
      padding: 0.75rem;
      border-radius: 0.5rem;
      border: 1px solid #e2e8f0;
      flex: 1;
    }
    .palette-title { font-size: 0.8rem; font-weight: 700; margin-bottom: 0.6rem; color: #0f2744; }
    .palette-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 0.4rem;
    }
    .p-btn {
      aspect-ratio: 1;
      border-radius: 0.375rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.85rem;
      cursor: pointer;
      border: none;
      color: #fff;
      transition: transform 0.1s;
    }
    .p-btn:hover { transform: scale(1.05); }
    .p-btn.current { outline: 3px solid #2563eb; outline-offset: 1px; }

    /* Bottom Enrollment Promo Bar */
    .promo-banner {
      background: linear-gradient(90deg, #0f1d32 0%, #1e3a8a 100%);
      color: #fff;
      padding: 0.75rem 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      border-top: 1px solid #3b82f6;
    }
    .promo-text strong { color: #60a5fa; }
    .promo-cta {
      background: #10b981;
      color: #fff;
      text-decoration: none;
      font-weight: 800;
      font-size: 0.85rem;
      padding: 0.5rem 1.25rem;
      border-radius: 0.5rem;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.35);
      transition: background 0.2s;
    }
    .promo-cta:hover { background: #059669; }

    /* Score Modal */
    .modal-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.6);
      align-items: center;
      justify-content: center;
      z-index: 100;
      padding: 1rem;
    }
    .modal-overlay.open { display: flex; }
    .modal-card {
      background: #fff;
      border-radius: 1rem;
      max-width: 500px;
      width: 100%;
      padding: 2rem;
      text-align: center;
      box-shadow: 0 20px 25px -5px rgba(0,0,0,0.2);
    }
    .score-circle {
      width: 90px;
      height: 90px;
      border-radius: 50%;
      background: #eff6ff;
      border: 4px solid #2563eb;
      color: #1e3a8a;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.75rem;
      font-weight: 900;
      margin: 1rem auto;
    }

    @media (max-width: 768px) {
      .test-container { flex-direction: column; height: auto; }
      .sidebar { width: 100%; border-left: none; border-top: 1px solid #cbd5e1; }
      .promo-banner { flex-direction: column; text-align: center; }
    }
  </style>
</head>
<body>

  <!-- Top Header -->
  <header>
    <div class="header-brand">
      <span class="brand-badge">NTA CBT</span>
      <div>
        <div class="header-title">NET Vidya English — Free Demo Mock Test</div>
        <div class="header-meta">Paper II English Literature • Official Pattern Simulation</div>
      </div>
    </div>
    <div class="timer-badge">
      <span>⏱</span>
      <span id="timerDisplay" class="font-mono">29:59</span>
    </div>
  </header>

  <!-- Candidate Info Bar -->
  <div class="candidate-bar">
    <div class="candidate-info">
      <div>Candidate: <span class="candidate-name">Guest Scholar (Free Demo)</span></div>
      <span class="exam-tag">UGC-NET / GSET 2026</span>
    </div>
    <div style="font-size: 0.75rem; color: #64748b;">
      Section: <strong>Paper II (English)</strong>
    </div>
  </div>

  <!-- Test Interface -->
  <div class="test-container">
    
    <!-- Question Pane -->
    <div class="question-panel">
      <div>
        <div class="question-header">
          <div class="q-number" id="qNumberLabel">Question 1 of 10</div>
          <span class="marks-badge">+2 Marks (No Negative Marking)</span>
        </div>
        <div class="question-text" id="qText">Loading question...</div>
        <div class="options-group" id="optionsContainer"></div>
      </div>

      <div class="control-actions">
        <div>
          <button class="btn btn-warning" id="btnMarkReview">Mark for Review & Next</button>
          <button class="btn btn-outline" id="btnClearResponse">Clear Response</button>
        </div>
        <div>
          <button class="btn btn-outline" id="btnPrev">« Previous</button>
          <button class="btn btn-primary" id="btnSaveNext">Save & Next »</button>
          <button class="btn btn-success" id="btnSubmitTest">Submit Test</button>
        </div>
      </div>
    </div>

    <!-- Right Sidebar Palette -->
    <div class="sidebar">
      
      <!-- Legend -->
      <div class="legend-grid">
        <div class="legend-item"><div class="legend-chip chip-answered" id="countAnswered">0</div> Answered</div>
        <div class="legend-item"><div class="legend-chip chip-not-answered" id="countNotAnswered">1</div> Not Answered</div>
        <div class="legend-item"><div class="legend-chip chip-marked-review" id="countMarked">0</div> Marked Review</div>
        <div class="legend-item"><div class="legend-chip chip-not-visited" id="countNotVisited">9</div> Not Visited</div>
      </div>

      <!-- Question Palette -->
      <div class="palette-box">
        <div class="palette-title">Question Palette (10 Questions)</div>
        <div class="palette-grid" id="paletteGrid"></div>
      </div>

      <!-- Free Demo Note -->
      <div style="background: #fff; border: 1px solid #cbd5e1; padding: 0.75rem; border-radius: 0.5rem; font-size: 0.75rem; color: #475569;">
        <strong>Free Demo Mode:</strong> Features 10 diagnostic questions from our 100-question full mocks. All 10+ mocks unlock in the Final Pack 2026.
      </div>
    </div>
  </div>

  <!-- Bottom Promo Banner -->
  <div class="promo-banner">
    <div class="promo-text">
      <strong>Enroll in Final Pack 2026:</strong> Unlock 10+ Full Mocks, Unit Tests, Model Rationales & High-Yield PDFs.
    </div>
    <a href="/#store" class="promo-cta">Enroll Now in Final Pack →</a>
  </div>

  <!-- Score Modal -->
  <div class="modal-overlay" id="scoreModal">
    <div class="modal-card">
      <h2 style="font-size: 1.4rem; font-weight: 800; color: #0f2744;">Test Evaluation Complete!</h2>
      <p style="font-size: 0.85rem; color: #64748b; margin-top: 0.25rem;">Diagnostic Scorecard (Paper II English Demo)</p>
      
      <div class="score-circle" id="scoreDisplay">0/20</div>

      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; margin: 1.25rem 0; font-size: 0.8rem;">
        <div style="background: #ecfdf5; padding: 0.5rem; border-radius: 0.5rem;">
          <strong style="color: #059669; font-size: 1.1rem; display: block;" id="correctCount">0</strong>
          <span style="color: #065f46;">Correct</span>
        </div>
        <div style="background: #fee2e2; padding: 0.5rem; border-radius: 0.5rem;">
          <strong style="color: #dc2626; font-size: 1.1rem; display: block;" id="incorrectCount">0</strong>
          <span style="color: #991b1b;">Incorrect</span>
        </div>
        <div style="background: #f1f5f9; padding: 0.5rem; border-radius: 0.5rem;">
          <strong style="color: #475569; font-size: 1.1rem; display: block;" id="accuracyDisplay">0%</strong>
          <span style="color: #475569;">Accuracy</span>
        </div>
      </div>

      <p style="font-size: 0.85rem; color: #334155; line-height: 1.5; margin-bottom: 1.5rem;">
        Comprehensive model rationales and distractor breakdowns are included with our full test series.
      </p>

      <div style="display: flex; gap: 0.75rem; justify-content: center;">
        <button class="btn btn-outline" onclick="location.reload()">Retake Demo</button>
        <a href="/#store" class="btn btn-primary" style="text-decoration: none;">Enroll in Final Pack 2026</a>
      </div>
    </div>
  </div>

  <script>
    const questions = [
      {
        id: 1,
        question: "B. Kumaravadivelu’s 'Post-Method Pedagogy' is structurally articulated around which triad of organizational parameters?",
        options: [
          "Particularity, Practicality, and Possibility",
          "Grammar, Vocabulary, and Syntax",
          "Proficiency, Performance, and Paradigm",
          "Curriculum, Instruction, and Evaluation"
        ],
        correct: 0
      },
      {
        id: 2,
        question: "In Shakespeare’s The Tempest, which character utters the famous lines: 'You taught me language; and my profit on’t / Is, I know how to curse. The red plague rid you / For learning me your language!'?",
        options: ["Ariel", "Caliban", "Ferdinand", "Trinculo"],
        correct: 1
      },
      {
        id: 3,
        question: "Who formulated the critical concept 'Willing suspension of disbelief for the moment, which constitutes poetic faith'?",
        options: ["William Wordsworth", "Samuel Taylor Coleridge", "Percy Bysshe Shelley", "John Keats"],
        correct: 1
      },
      {
        id: 4,
        question: "Stuart Hall’s seminal 1973 model of television communication identifies which three decoding positions for audiences?",
        options: [
          "Dominant-Hegemonic, Negotiated, and Oppositional",
          "Linear, Interactive, and Transactional",
          "Cognitive, Affective, and Psychomotor",
          "Literal, Metaphorical, and Allegorical"
        ],
        correct: 0
      },
      {
        id: 5,
        question: "Which Indian English poet authored the autobiographical three-part collection 'Rough Passage' (1977)?",
        options: ["Nissim Ezekiel", "A.K. Ramanujan", "R. Parthasarathy", "Jayanta Mahapatra"],
        correct: 2
      },
      {
        id: 6,
        question: "Who defined the 'Intentional Fallacy' and 'Affective Fallacy' in classic American New Criticism?",
        options: [
          "T.S. Eliot and I.A. Richards",
          "W.K. Wimsatt Jr. and Monroe C. Beardsley",
          "Cleanth Brooks and Robert Penn Warren",
          "John Crowe Ransom and Allen Tate"
        ],
        correct: 1
      },
      {
        id: 7,
        question: "In 'Orientalism' (1978), Edward Said explicitly bases his methodology on which French philosopher’s notion of 'discourse' and power-knowledge?",
        options: ["Jacques Derrida", "Michel Foucault", "Louis Althusser", "Roland Barthes"],
        correct: 1
      },
      {
        id: 8,
        question: "In the MLA Handbook (9th Edition), what constitutes the fixed sequence of the universal core elements in a container citation?",
        options: [
          "Author. Title of source. Title of container, Other contributors, Version, Number, Publisher, Publication date, Location.",
          "Author, Year, Title of source, Publisher, City of Publication, Pages.",
          "Title of source, Author, Publisher, Year, Location, DOI.",
          "Author. Title of source. Publisher, Year, Volume, Issue, Pages."
        ],
        correct: 0
      },
      {
        id: 9,
        question: "In 'Tradition and the Individual Talent' (1919), T.S. Eliot compares the poet’s mind to which catalyst in a chemical reaction?",
        options: [
          "A filament of platinum",
          "A rod of incandescent copper",
          "A drop of sulphuric acid",
          "A prism of crystal quartz"
        ],
        correct: 0
      },
      {
        id: 10,
        question: "Which postcolonial theorist coined the interrelated concepts of 'Mimicry', 'Hybridity', and the 'Third Space' in The Location of Culture?",
        options: ["Frantz Fanon", "Homi K. Bhabha", "Gayatri Chakravorty Spivak", "Achille Mbembe"],
        correct: 1
      }
    ];

    // State
    let currentIndex = 0;
    const userAnswers = new Array(questions.length).fill(null);
    const reviewStatus = new Array(questions.length).fill(false);
    const visitedStatus = new Array(questions.length).fill(false);
    visitedStatus[0] = true;

    // Timer (30 minutes)
    let totalSeconds = 30 * 60;
    const timerElem = document.getElementById('timerDisplay');
    const timerInterval = setInterval(() => {
      totalSeconds--;
      if (totalSeconds <= 0) {
        clearInterval(timerInterval);
        submitTest();
        return;
      }
      const m = Math.floor(totalSeconds / 60);
      const s = totalSeconds % 60;
      timerElem.textContent = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    }, 1000);

    function renderQuestion(index) {
      currentIndex = index;
      visitedStatus[index] = true;

      const q = questions[index];
      document.getElementById('qNumberLabel').textContent = 'Question ' + (index + 1) + ' of ' + questions.length;
      document.getElementById('qText').textContent = q.question;

      const optsContainer = document.getElementById('optionsContainer');
      optsContainer.innerHTML = '';

      q.options.forEach((optText, optIdx) => {
        const item = document.createElement('label');
        item.className = 'option-item' + (userAnswers[index] === optIdx ? ' selected' : '');

        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'qOption';
        radio.value = optIdx;
        radio.checked = userAnswers[index] === optIdx;
        radio.onchange = () => {
          userAnswers[index] = optIdx;
          renderQuestion(index);
          updatePalette();
        };

        const label = document.createElement('span');
        const letter = String.fromCharCode(65 + optIdx);
        label.textContent = '(' + letter + ') ' + optText;

        item.appendChild(radio);
        item.appendChild(label);
        optsContainer.appendChild(item);
      });

      updatePalette();
    }

    function updatePalette() {
      const grid = document.getElementById('paletteGrid');
      grid.innerHTML = '';

      let answered = 0;
      let notAnswered = 0;
      let marked = 0;
      let notVisited = 0;

      for (let i = 0; i < questions.length; i++) {
        const btn = document.createElement('button');
        btn.className = 'p-btn';
        btn.textContent = i + 1;

        if (i === currentIndex) {
          btn.classList.add('current');
        }

        if (reviewStatus[i]) {
          btn.classList.add('chip-marked-review');
          marked++;
        } else if (userAnswers[i] !== null) {
          btn.classList.add('chip-answered');
          answered++;
        } else if (visitedStatus[i]) {
          btn.classList.add('chip-not-answered');
          notAnswered++;
        } else {
          btn.classList.add('chip-not-visited');
          notVisited++;
        }

        btn.onclick = () => renderQuestion(i);
        grid.appendChild(btn);
      }

      document.getElementById('countAnswered').textContent = answered;
      document.getElementById('countNotAnswered').textContent = notAnswered;
      document.getElementById('countMarked').textContent = marked;
      document.getElementById('countNotVisited').textContent = notVisited;
    }

    // Handlers
    document.getElementById('btnSaveNext').onclick = () => {
      if (currentIndex < questions.length - 1) {
        renderQuestion(currentIndex + 1);
      }
    };
    document.getElementById('btnPrev').onclick = () => {
      if (currentIndex > 0) {
        renderQuestion(currentIndex - 1);
      }
    };
    document.getElementById('btnClearResponse').onclick = () => {
      userAnswers[currentIndex] = null;
      renderQuestion(currentIndex);
    };
    document.getElementById('btnMarkReview').onclick = () => {
      reviewStatus[currentIndex] = !reviewStatus[currentIndex];
      if (currentIndex < questions.length - 1) {
        renderQuestion(currentIndex + 1);
      } else {
        updatePalette();
      }
    };

    function submitTest() {
      clearInterval(timerInterval);
      let correct = 0;
      let incorrect = 0;
      questions.forEach((q, idx) => {
        if (userAnswers[idx] === q.correct) {
          correct++;
        } else if (userAnswers[idx] !== null) {
          incorrect++;
        }
      });

      const totalScore = correct * 2;
      const totalPossible = questions.length * 2;
      const accuracy = (correct + incorrect) > 0 ? Math.round((correct / (correct + incorrect)) * 100) : 0;

      document.getElementById('scoreDisplay').textContent = totalScore + '/' + totalPossible;
      document.getElementById('correctCount').textContent = correct;
      document.getElementById('incorrectCount').textContent = incorrect;
      document.getElementById('accuracyDisplay').textContent = accuracy + '%';

      document.getElementById('scoreModal').classList.add('open');
    }

    document.getElementById('btnSubmitTest').onclick = () => {
      if (confirm('Are you sure you want to submit your Demo Mock Test?')) {
        submitTest();
      }
    };

    // Initial render
    renderQuestion(0);
  </script>
</body>
</html>`;
}

// -----------------------------------------------------------------------------
// Script Entry Point: Build all sample materials
// -----------------------------------------------------------------------------
const outputDir = path.resolve('public/sample-materials');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('Generating sample materials in public/sample-materials/ ...');

// 1. Generate 25-Question Mini Mock PDF
const miniMockBuffer = generate25QuestionMiniMockPdf();
const miniMockPath = path.join(outputDir, 'NetVidya_25_Question_Mini_Mock.pdf');
fs.writeFileSync(miniMockPath, miniMockBuffer);
console.log(`✓ Created ${miniMockPath} (${miniMockBuffer.length} bytes)`);

// 2. Generate Model Answers PDF
const modelAnswersBuffer = generateModelAnswersSamplePdf();
const modelAnswersPath = path.join(outputDir, 'NetVidya_Model_Answers_Sample.pdf');
fs.writeFileSync(modelAnswersPath, modelAnswersBuffer);
console.log(`✓ Created ${modelAnswersPath} (${modelAnswersBuffer.length} bytes)`);

// 3. Generate demo-test.html
const demoHtml = generateDemoTestHtml();
const demoHtmlPath = path.join(outputDir, 'demo-test.html');
fs.writeFileSync(demoHtmlPath, demoHtml, 'utf-8');
console.log(`✓ Created ${demoHtmlPath} (${Buffer.byteLength(demoHtml)} bytes)`);

console.log('🎉 All public free sample assets built successfully!');
