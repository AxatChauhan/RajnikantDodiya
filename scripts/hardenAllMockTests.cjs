/**
 * Master Test Hardening Script: NetVidya CBT Security, Shield & DRM Suite
 * 
 * Hardens all 50 paid CBT mock tests across GSET and UGC NET packs:
 * 1. Candidate Enrollment Shield (Client-side Session Guard with official Access Restricted screen)
 * 2. Answer & Explanation Obfuscation (stripped from DOM/MOCK, reverse-base64 encrypted, decoded only on finish/review)
 * 3. Candidate Identity Auto-Binding (auto-fills candidate name and email from verified student session)
 * 4. Monotonic Tamper-Resistant Timer (monotonic performance.now tracking, elapsed time persistence, clock-tampering immunity)
 * 5. Anti-Scraping Soft DRM (CSS user-select:none, contextmenu disable, blocks F12/Ctrl+Shift+I/Ctrl+U/Ctrl+S/Ctrl+P)
 * 6. Dynamic Forensic Watermark (dynamic candidate identity & order ID diagonal overlay)
 */

const fs = require('fs');
const path = require('path');

const GSET_DIR = path.resolve('public/study-vault/gset/tests');
const UGC_DIR = path.resolve('public/study-vault/ugc/tests');

// CSS to inject in <style>
const DRM_CSS = `
/* NetVidya Soft DRM & Anti-Scraping */
body, .opt, .qtext, table, #pal, .rescard, label.opt, .stem, table.lt, .card {
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
}
input[type=text], input[type=number] {
  -webkit-user-select: auto;
  user-select: auto;
}
.nv-wm-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9999;
  overflow: hidden;
  opacity: 0.055;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;
  transform: rotate(-25deg) scale(1.15);
  color: #1e3a8a;
  font-family: system-ui, -apple-system, sans-serif;
  font-weight: 700;
  font-size: clamp(14px, 2.2vw, 24px);
  white-space: nowrap;
  line-height: 2.8;
  user-select: none;
}
@media print {
  #testScr, #modal, #startScr, #test, #sumModal, #start { display: none !important; }
  body:after {
    content: "Printing test papers is strictly prohibited. Protected by NET Vidya DRM.";
    display: block;
    padding: 40px;
    font-size: 18px;
    color: #b91c1c;
    text-align: center;
  }
}
`;

function hardenGsetFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const filename = path.basename(filePath);

  // Determine pack
  const isP1 = filename.includes('Paper1');
  const isEng = filename.includes('English');
  const isEdu = filename.includes('Education');

  const packId = isP1 ? 'gset-paper1' : isEng ? 'gset-paper2-english' : 'gset-paper2-education';
  const packTitle = isP1
    ? 'GSET Paper 1: General Aptitude Foundation Pack'
    : isEng
    ? 'GSET Paper 2: English Literature Specialist Pack'
    : 'GSET Paper 2: Education Discipline Master Pack';

  if (content.includes('// --- NET VIDYA CANDIDATE SHIELD & DRM ENGINE ---')) {
    return { filename, questions: 'preserved', packId };
  }

  // 1. Inject meta robots if not present
  if (!content.includes('name="robots"')) {
    content = content.replace('<head>', '<head><meta name="robots" content="noindex, nofollow">');
  }

  // 2. Inject DRM CSS into <style>
  if (!content.includes('nv-wm-overlay')) {
    content = content.replace('</style>', `${DRM_CSS}\n</style>`);
  }

  // 3. Inject body attributes and watermark overlay
  if (!content.includes('id="nvWatermark"')) {
    content = content.replace(
      '<body>',
      '<body oncontextmenu="return false;" ondragstart="return false;">\n<div id="nvWatermark" class="nv-wm-overlay"></div>'
    );
  }

  // 4. Extract MOCK and obfuscate answers
  const mockStart = content.indexOf('const MOCK = [');
  const mockEnd = content.indexOf(';\nconst UNITS =', mockStart);
  if (mockStart === -1 || mockEnd === -1) {
    throw new Error(`MOCK boundary not found in ${filename}`);
  }

  const mockRaw = content.slice(mockStart + 'const MOCK = '.length, mockEnd);
  const mockArr = JSON.parse(mockRaw);

  const answers = mockArr.map(q => ({ a: q.a, e: q.e, k: q.k }));
  mockArr.forEach(q => {
    delete q.a;
    delete q.e;
    delete q.k;
  });

  const encAns = Buffer.from(JSON.stringify(answers), 'utf8').toString('base64').split('').reverse().join('');

  // 5. Construct script prefix: Shield, DRM, Identity, Watermark, Answer Decryption Engine
  const scriptPrefix = `
// --- NET VIDYA CANDIDATE SHIELD & DRM ENGINE ---
const REQUIRED_PACK = "${packId}";
const PACK_NAME = "${packTitle}";
let CANDIDATE_NAME = "Candidate";
let CANDIDATE_EMAIL = "{{BUYER_EMAIL}}";
let CANDIDATE_ORDER = "NV-2026";
let isEnrolled = !CANDIDATE_EMAIL.includes("{{BUYER_EMAIL}}");
const isLocalHost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

try {
  const rawSession = localStorage.getItem("netvidya_student_session") || localStorage.getItem("netvidya_buyer_session_v1");
  if (rawSession) {
    const sess = JSON.parse(rawSession);
    if (sess && (sess.isLoggedIn || sess.isBuyer)) {
      CANDIDATE_NAME = (sess.name || sess.studentName || "Candidate").trim();
      CANDIDATE_EMAIL = (sess.email || "").toLowerCase().trim();
      CANDIDATE_ORDER = sess.orderId || "NV-2026";
      const userPacks = (sess.enrolledPacks || []).slice();
      if (sess.productId) userPacks.push(sess.productId);
      if (sess.isBuyer && !userPacks.length) userPacks.push("ugc-net-english-bundle");
      if (userPacks.includes("gset-english-combo") || userPacks.includes("gset-combo_eng")) {
        userPacks.push("gset-paper1", "gset-paper2-english");
      }
      if (userPacks.includes("gset-education-combo") || userPacks.includes("gset-combo_edu")) {
        userPacks.push("gset-paper1", "gset-paper2-education");
      }
      if (userPacks.includes(REQUIRED_PACK) || CANDIDATE_EMAIL.endsWith("@netvidya.in")) {
        isEnrolled = true;
      }
    }
  }
} catch (err) {}

if (!isEnrolled && !isLocalHost) {
  document.addEventListener("DOMContentLoaded", () => {
    document.body.innerHTML = \`
      <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f1f5f9;font-family:system-ui,-apple-system,sans-serif;padding:20px;">
        <div style="max-width:480px;width:100%;background:#ffffff;border-radius:14px;box-shadow:0 10px 25px -5px rgba(0,0,0,0.1),0 8px 10px -6px rgba(0,0,0,0.1);padding:32px;text-align:center;border:1px solid #e2e8f0;">
          <div style="width:56px;height:56px;background:#fef2f2;color:#dc2626;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:26px;margin-bottom:16px;">🔒</div>
          <h2 style="font-size:20px;font-weight:700;color:#0f172a;margin:0 0 10px;">Candidate Access Restricted</h2>
          <p style="font-size:14px;color:#64748b;line-height:1.6;margin:0 0 20px;">
            This CBT Mock Exam is exclusively available to enrolled candidates with the <b>\${PACK_NAME}</b>.
          </p>
          <div style="display:flex;flex-direction:column;gap:10px;">
            <a href="/#materials" style="padding:11px 18px;background:#1e3a8a;color:#ffffff;border-radius:8px;font-weight:600;font-size:14px;text-decoration:none;">Go to My Materials</a>
            <a href="/#gset-packs" style="padding:10px 18px;background:#f8fafc;color:#334155;border-radius:8px;font-weight:600;font-size:13.5px;text-decoration:none;border:1px solid #cbd5e1;">Browse Course Packs</a>
          </div>
          <p style="font-size:12px;color:#94a3b8;margin:20px 0 0;">Candidate authentication required • NET Vidya Secure Hall</p>
        </div>
      </div>
    \`;
  });
  throw new Error("Access restricted: Candidate not enrolled in " + REQUIRED_PACK);
}

function renderWatermark() {
  const el = document.getElementById("nvWatermark");
  if (!el) return;
  const idLabel = CANDIDATE_EMAIL && !CANDIDATE_EMAIL.includes("{{") 
    ? (CANDIDATE_NAME + " • " + CANDIDATE_EMAIL + " • " + CANDIDATE_ORDER) 
    : "NET VIDYA SECURE EXAM • VERIFIED CANDIDATE";
  const line = "<span>" + idLabel + " • NET Vidya Examination Portal</span>";
  el.innerHTML = line.repeat(16);
}
document.addEventListener("DOMContentLoaded", () => {
  renderWatermark();
  const nameInput = document.getElementById("nameIn");
  if (nameInput && CANDIDATE_NAME !== "Candidate") {
    nameInput.value = CANDIDATE_NAME;
  }
});

// Anti-Scraping & DevTools Protection
document.addEventListener("contextmenu", e => e.preventDefault());
document.addEventListener("keydown", e => {
  if (e.key === "F12" ||
      ((e.ctrlKey || e.metaKey) && (e.key === "u" || e.key === "U" || e.key === "s" || e.key === "S")) ||
      ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "i" || e.key === "I" || e.key === "j" || e.key === "J" || e.key === "c" || e.key === "C"))) {
    e.preventDefault();
  }
});

const _ENC_ANS = "${encAns}";
let _DECODED_ANS = null;
function getDecodedAnswers() {
  if (!_DECODED_ANS) {
    try {
      const bin = atob(_ENC_ANS.split("").reverse().join(""));
      const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
      _DECODED_ANS = JSON.parse(new TextDecoder().decode(bytes));
    } catch(e) {
      _DECODED_ANS = [];
    }
  }
  return _DECODED_ANS;
}
`;

  // Replace MOCK with new stripped MOCK and prepend scriptPrefix
  const newMockDecl = `${scriptPrefix}\nconst MOCK = ${JSON.stringify(mockArr)}`;
  content = content.slice(0, mockStart) + newMockDecl + content.slice(mockEnd);

  // 6. Update fresh(name) to include elapsedSeconds
  content = content.replace(
    'function fresh(name){ return {name, start:Date.now(), ans:Array(N).fill(null)',
    'function fresh(name){ return {name, start:Date.now(), elapsedSeconds:0, ans:Array(N).fill(null)'
  );

  // 7. Update begin() to bind candidate name & email
  content = content.replace(
    'const name = ($("nameIn").value || "").trim() || "Candidate";',
    'const name = ($("nameIn").value || "").trim() || (CANDIDATE_EMAIL && !CANDIDATE_EMAIL.includes("{{") ? (CANDIDATE_NAME + " (" + CANDIDATE_EMAIL + ")") : "Candidate");'
  );

  // 8. Update openTest() to show candidate name & email
  content = content.replace(
    '$("cname").textContent = S.name;',
    '$("cname").textContent = S.name || (CANDIDATE_EMAIL && !CANDIDATE_EMAIL.includes("{{") ? (CANDIDATE_NAME + " (" + CANDIDATE_EMAIL + ")") : "Candidate");'
  );

  // 9. Update remaining() and runTimer() to be monotonic & tamper-resistant
  const oldTimerBlock = `function remaining(){ return Math.max(0, DURATION - Math.floor((Date.now() - S.start)/1000)); }
function runTimer(){
  clearInterval(tick);
  const t = () => { const r = remaining(), m = Math.floor(r/60), s = r%60;
    $("timer").textContent = String(m).padStart(2,"0")+":"+String(s).padStart(2,"0");
    $("timer").classList.toggle("warn", r <= 300);
    if (r <= 0){ clearInterval(tick); finish(); } };
  t(); tick = setInterval(t, 1000);
}`;

  const newTimerBlock = `function remaining(){
  S.elapsedSeconds = S.elapsedSeconds || 0;
  return Math.max(0, DURATION - S.elapsedSeconds);
}
let lastMonoTime = 0;
function runTimer(){
  clearInterval(tick);
  lastMonoTime = performance.now();
  const t = () => {
    const nowMono = performance.now();
    const stepSecs = Math.max(1, Math.round((nowMono - lastMonoTime) / 1000));
    lastMonoTime = nowMono;
    S.elapsedSeconds = (S.elapsedSeconds || 0) + stepSecs;
    if (S.start) {
      const wallElapsed = Math.floor((Date.now() - S.start) / 1000);
      if (wallElapsed > S.elapsedSeconds) S.elapsedSeconds = wallElapsed;
    }
    const r = remaining(), m = Math.floor(r/60), s = r%60;
    $("timer").textContent = String(m).padStart(2,"0")+":"+String(s).padStart(2,"0");
    $("timer").classList.toggle("warn", r <= 300);
    save();
    if (r <= 0){ clearInterval(tick); finish(); }
  };
  t(); tick = setInterval(t, 1000);
}`;

  if (content.includes(oldTimerBlock)) {
    content = content.replace(oldTimerBlock, newTimerBlock);
  } else {
    console.warn(`Timer block signature mismatch in ${filename}, checking regex replacement...`);
    const regexTimer = /function remaining\(\)\{\s*return Math\.max\(0,\s*DURATION\s*-\s*Math\.floor\(\(Date\.now\(\)\s*-\s*S\.start\)\/1000\)\);\s*\}\s*function runTimer\(\)\{[\s\S]*?tick\s*=\s*setInterval\(t,\s*1000\);\s*\}/;
    if (regexTimer.test(content)) {
      content = content.replace(regexTimer, newTimerBlock);
    } else {
      throw new Error(`Failed to replace timer block in ${filename}`);
    }
  }

  // 10. Update finish() to decrypt and attach answers
  const oldFinish = `function finish(){
  clearInterval(tick); $("modal").classList.add("hidden");
  if (!S.done){ if (tStart){ if(!S.tm) S.tm = Array(N).fill(0); S.tm[cur] += Date.now() - tStart; tStart = 0; } S.done = true; S.end = Date.now(); save(); }
  showResult();
}`;

  const newFinish = `function finish(){
  clearInterval(tick); $("modal").classList.add("hidden");
  const _ans = getDecodedAnswers();
  MOCK.forEach((q, i) => { if (_ans[i]) { q.a = _ans[i].a; q.e = _ans[i].e; q.k = _ans[i].k; } });
  if (!S.done){ if (tStart){ if(!S.tm) S.tm = Array(N).fill(0); S.tm[cur] += Date.now() - tStart; tStart = 0; } S.done = true; S.end = Date.now(); save(); }
  showResult();
}`;

  if (content.includes(oldFinish)) {
    content = content.replace(oldFinish, newFinish);
  } else {
    throw new Error(`Failed to locate oldFinish in ${filename}`);
  }

  // 11. Update retryBtn to clean reload
  content = content.replace(
    '$("retryBtn").onclick = () => { try{ localStorage.removeItem(KEY); }catch(e){} S = null;\n  $("resScr").classList.add("hidden"); $("startScr").classList.remove("hidden"); $("timer").textContent = "60:00"; window.scrollTo(0,0); };',
    '$("retryBtn").onclick = () => { try{ localStorage.removeItem(KEY); }catch(e){} location.reload(); };'
  );

  // 12. Update resume IIFE
  const oldResume = `(function(){ const old = load(); if (!old || !Array.isArray(old.ans) || old.ans.length !== N) return;
  S = old; if (S.done) showResult(); else if (remaining() > 0) openTest(); else finish(); })();`;

  const newResume = `(function(){ const old = load(); if (!old || !Array.isArray(old.ans) || old.ans.length !== N) return;
  S = old;
  if (S.done) {
    const _ans = getDecodedAnswers();
    MOCK.forEach((q, i) => { if (_ans[i]) { q.a = _ans[i].a; q.e = _ans[i].e; q.k = _ans[i].k; } });
    showResult();
  } else if (remaining() > 0) openTest(); else finish(); })();`;

  if (content.includes(oldResume)) {
    content = content.replace(oldResume, newResume);
  } else {
    throw new Error(`Failed to locate oldResume in ${filename}`);
  }

  fs.writeFileSync(filePath, content, 'utf8');
  return { filename, questions: mockArr.length, packId };
}

function hardenUgcFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const filename = path.basename(filePath);

  if (content.includes('// --- NET VIDYA CANDIDATE SHIELD & DRM ENGINE ---')) {
    return { filename, packId: 'ugc-net-english-bundle' };
  }

  // 1. Inject meta robots if not present
  if (!content.includes('name="robots"')) {
    content = content.replace('<head>', '<head><meta name="robots" content="noindex, nofollow">');
  }

  // 2. Inject DRM CSS into <style>
  if (!content.includes('nv-wm-overlay')) {
    content = content.replace('</style>', `${DRM_CSS}\n</style>`);
  }

  // 3. Inject body attributes and watermark overlay
  if (!content.includes('id="nvWatermark"')) {
    content = content.replace(
      '<body>',
      '<body oncontextmenu="return false;" ondragstart="return false;">\n<div id="nvWatermark" class="nv-wm-overlay"></div>'
    );
  }

  // 4. Update Candidate Enrollment Shield & DRM into script
  const ugcShield = `
// --- NET VIDYA CANDIDATE SHIELD & DRM ENGINE ---
const REQUIRED_PACK = "ugc-net-english-bundle";
const PACK_NAME = "UGC NET English Study Bundle";
let CANDIDATE_NAME = "Candidate";
let CANDIDATE_EMAIL = "{{BUYER_EMAIL}}";
let CANDIDATE_ORDER = "NV-2026";
let isEnrolled = !CANDIDATE_EMAIL.includes("{{BUYER_EMAIL}}");
const isLocalHost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

try {
  const rawSession = localStorage.getItem("netvidya_student_session") || localStorage.getItem("netvidya_buyer_session_v1");
  if (rawSession) {
    const sess = JSON.parse(rawSession);
    if (sess && (sess.isLoggedIn || sess.isBuyer)) {
      CANDIDATE_NAME = (sess.name || sess.studentName || "Candidate").trim();
      CANDIDATE_EMAIL = (sess.email || "").toLowerCase().trim();
      CANDIDATE_ORDER = sess.orderId || "NV-2026";
      const userPacks = (sess.enrolledPacks || []).slice();
      if (sess.productId) userPacks.push(sess.productId);
      if (sess.isBuyer && !userPacks.length) userPacks.push("ugc-net-english-bundle");
      if (userPacks.includes(REQUIRED_PACK) || CANDIDATE_EMAIL.endsWith("@netvidya.in")) {
        isEnrolled = true;
      }
    }
  }
} catch (err) {}

if (!isEnrolled && !isLocalHost) {
  document.addEventListener("DOMContentLoaded", () => {
    document.body.innerHTML = \`
      <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f1f5f9;font-family:system-ui,-apple-system,sans-serif;padding:20px;">
        <div style="max-width:480px;width:100%;background:#ffffff;border-radius:14px;box-shadow:0 10px 25px -5px rgba(0,0,0,0.1),0 8px 10px -6px rgba(0,0,0,0.1);padding:32px;text-align:center;border:1px solid #e2e8f0;">
          <div style="width:56px;height:56px;background:#fef2f2;color:#dc2626;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:26px;margin-bottom:16px;">🔒</div>
          <h2 style="font-size:20px;font-weight:700;color:#0f172a;margin:0 0 10px;">Candidate Access Restricted</h2>
          <p style="font-size:14px;color:#64748b;line-height:1.6;margin:0 0 20px;">
            This CBT Test is exclusively available to enrolled candidates with the <b>\${PACK_NAME}</b>.
          </p>
          <div style="display:flex;flex-direction:column;gap:10px;">
            <a href="/#materials" style="padding:11px 18px;background:#1e3a8a;color:#ffffff;border-radius:8px;font-weight:600;font-size:14px;text-decoration:none;">Go to My Materials</a>
            <a href="/" style="padding:10px 18px;background:#f8fafc;color:#334155;border-radius:8px;font-weight:600;font-size:13.5px;text-decoration:none;border:1px solid #cbd5e1;">Return to Store</a>
          </div>
          <p style="font-size:12px;color:#94a3b8;margin:20px 0 0;">Candidate authentication required • NET Vidya Secure Hall</p>
        </div>
      </div>
    \`;
  });
  throw new Error("Access restricted: Candidate not enrolled in " + REQUIRED_PACK);
}

function renderWatermark() {
  const el = document.getElementById("nvWatermark");
  if (!el) return;
  const idLabel = CANDIDATE_EMAIL && !CANDIDATE_EMAIL.includes("{{") 
    ? (CANDIDATE_NAME + " • " + CANDIDATE_EMAIL + " • " + CANDIDATE_ORDER) 
    : "NET VIDYA SECURE EXAM • VERIFIED CANDIDATE";
  const line = "<span>" + idLabel + " • NET Vidya Examination Portal</span>";
  el.innerHTML = line.repeat(16);
}
document.addEventListener("DOMContentLoaded", () => {
  renderWatermark();
  const nmInput = document.getElementById("nm");
  if (nmInput && CANDIDATE_NAME !== "Candidate") {
    nmInput.value = CANDIDATE_NAME;
  }
  const cnameEl = document.getElementById("cname");
  if (cnameEl && CANDIDATE_NAME !== "Candidate") {
    cnameEl.textContent = CANDIDATE_NAME + (CANDIDATE_EMAIL && !CANDIDATE_EMAIL.includes("{{") ? " (" + CANDIDATE_EMAIL + ")" : "");
  }
});

// Anti-Scraping & DevTools Protection
document.addEventListener("contextmenu", e => e.preventDefault());
document.addEventListener("keydown", e => {
  if (e.key === "F12" ||
      ((e.ctrlKey || e.metaKey) && (e.key === "u" || e.key === "U" || e.key === "s" || e.key === "S")) ||
      ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "i" || e.key === "I" || e.key === "j" || e.key === "J" || e.key === "c" || e.key === "C"))) {
    e.preventDefault();
  }
});
`;

  // Prepend ugcShield into <script>
  content = content.replace('<script>', `<script>\n${ugcShield}`);

  // 5. Upgrade S from eager parse to on-demand getter
  const sPattern = /const S = JSON\.parse\(atob\("([\s\S]*?)"\.split\(""\)\.reverse\(\)\.join\(""\)\)\);/;
  const sMatch = content.match(sPattern);
  if (sMatch) {
    const rawB64 = sMatch[1];
    const lazyS = `const _ENC_S = "${rawB64}";
let _DECODED_S = null;
function getS() {
  if (!_DECODED_S) {
    try {
      const bin = atob(_ENC_S.split("").reverse().join(""));
      const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
      _DECODED_S = JSON.parse(new TextDecoder().decode(bytes));
    } catch(e) {
      _DECODED_S = { k: [], e: [] };
    }
  }
  return _DECODED_S;
}
const S = {
  get k() { return getS().k; },
  get e() { return getS().e; }
};`;
    content = content.replace(sMatch[0], lazyS);
  } else {
    throw new Error(`S pattern not found in ${filename}`);
  }

  // 6. Upgrade tick() to monotonic tamper-resistant timer
  const oldTick = `let timerId;
function tick(){
  clearInterval(timerId);
  const f = () => {
    const left = Math.max(0, st.end - Date.now());
    const h = Math.floor(left/3600000), m = Math.floor(left%3600000/60000), s = Math.floor(left%60000/1000);
    $("timer").textContent = \`\${String(h).padStart(2,"0")}:\${String(m).padStart(2,"0")}:\${String(s).padStart(2,"0")}\`;
    $("timer").classList.toggle("low", left < 5*60000);
    if (left <= 0 && mode === "test") { clearInterval(timerId); alert("Time is over. Your test will now be submitted."); finish(); }
  };
  f(); timerId = setInterval(f, 1000);
}`;

  const newTick = `let timerId;
let lastMono = 0;
function tick(){
  clearInterval(timerId);
  lastMono = performance.now();
  st.elapsedMs = st.elapsedMs || 0;
  const f = () => {
    const nowMono = performance.now();
    const stepMs = Math.max(1000, Math.round(nowMono - lastMono));
    lastMono = nowMono;
    st.elapsedMs = (st.elapsedMs || 0) + stepMs;
    if (st.start) {
      const wallElapsed = Date.now() - st.start;
      if (wallElapsed > st.elapsedMs) st.elapsedMs = wallElapsed;
    }
    const left = Math.max(0, MIN*60000 - st.elapsedMs);
    const h = Math.floor(left/3600000), m = Math.floor(left%3600000/60000), s = Math.floor(left%60000/1000);
    $("timer").textContent = \`\${String(h).padStart(2,"0")}:\${String(m).padStart(2,"0")}:\${String(s).padStart(2,"0")}\`;
    $("timer").classList.toggle("low", left < 5*60000);
    save();
    if (left <= 0 && mode === "test") { clearInterval(timerId); alert("Time is over. Your test will now be submitted."); finish(); }
  };
  f(); timerId = setInterval(f, 1000);
}`;

  if (content.includes(oldTick)) {
    content = content.replace(oldTick, newTick);
  } else {
    throw new Error(`Failed to locate oldTick in ${filename}`);
  }

  // 7. Update $("go").onclick to record start & elapsedMs
  content = content.replace(
    '$("go").onclick = () => { st = fresh(); st.end = Date.now() + MIN*60000; st.name = $("nm").value.trim() || "Candidate"; save(); begin(); };',
    '$("go").onclick = () => { st = fresh(); st.start = Date.now(); st.elapsedMs = 0; st.end = Date.now() + MIN*60000; st.name = $("nm").value.trim() || (CANDIDATE_EMAIL && !CANDIDATE_EMAIL.includes("{{") ? (CANDIDATE_NAME + " (" + CANDIDATE_EMAIL + ")") : "Candidate"); save(); begin(); };'
  );

  fs.writeFileSync(filePath, content, 'utf8');
  return { filename, packId: 'ugc-net-english-bundle' };
}

function main() {
  console.log('================================================================');
  console.log(' NET VIDYA — HARDENING ALL CBT MOCK TESTS & TEST HALL SUITE');
  console.log('================================================================\n');

  // 1. Process GSET Tests
  const gsetFiles = fs.readdirSync(GSET_DIR).filter(f => f.endsWith('.html'));
  console.log(`[1/2] Processing ${gsetFiles.length} GSET tests in ${GSET_DIR}...`);
  let gsetProcessed = 0;
  for (const f of gsetFiles) {
    const res = hardenGsetFile(path.join(GSET_DIR, f));
    gsetProcessed++;
    console.log(`  ✓ [GSET ${gsetProcessed}/${gsetFiles.length}] ${res.filename} (${res.questions} Qs) -> ${res.packId}`);
  }

  // 2. Process UGC NET Tests
  const ugcFiles = fs.readdirSync(UGC_DIR).filter(f => f.endsWith('.html') && f !== 'index.html');
  console.log(`\n[2/2] Processing ${ugcFiles.length} UGC NET tests in ${UGC_DIR}...`);
  let ugcProcessed = 0;
  for (const f of ugcFiles) {
    const res = hardenUgcFile(path.join(UGC_DIR, f));
    ugcProcessed++;
    console.log(`  ✓ [UGC ${ugcProcessed}/${ugcFiles.length}] ${res.filename} -> ${res.packId}`);
  }

  console.log('\n================================================================');
  console.log(` ✓ HARDENING COMPLETE: ${gsetProcessed} GSET + ${ugcProcessed} UGC = ${gsetProcessed + ugcProcessed} TESTS HARDENED`);
  console.log('================================================================\n');
}

main();
