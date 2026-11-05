/* =====================================================================================================================
   Академія ClayArena — the ONE Academy app (PROJECT: to be moved into ClayArena and finished by the dev team).
   Replaces the two old apps (docs/learn/index.html "ClayArena Academy" and docs/interpreter/index.html "Interpreter Academy").
   Design: content/academy/SCHEMA.md (data contract) and DEVELOPERS.md §4e (this app). Comments that cite "design §N" refer to the
   owner's working design notes of 10.2026, which are not part of the repository: the rule each of them stands for is in SCHEMA.md and
   DEVELOPERS.md (§4d–§4l), which are the reference for the team (HANDOVER.md).

   WHAT IT DOES
   - Renders every Academy view from JSON (no text is ever built from raw strings: lesson "html" fields come escaped from the build):
       /<p>learn/                      home: "Хто ви?" route picker, continue card, 13 topics, Practice, search, "Моя дисципліна"
       /<p>learn/topics/<block>/       block page (sections: "Почніть тут" first, then the sections of the block)
       /<p>learn/routes/<route>/       route page: stages, progress, "Хочете глибше", certificate block, printable checklist
       /<p>learn/routes/<route>/exam/  route exam (noindex)
       /<p>learn/<lesson-id>/          lesson: every body block type, Stand Talk phrases, notes, terms, rule refs, quiz, "Далі"
       /<p>learn/practice/[<game>/]    Practice: lead lab, name the flight, translate the coach, referee's call, term cards, phrasebook
       /<p>learn/progress/             XP, level, badges, certificates, transfer, reset (noindex)
     <p> = "" for Ukrainian (root) and "<lang>/" for en de fr it cs pl pt hu fi lt (design §5.1). URL slugs are English.
   - Progress, XP, levels, badges and certificates: docs/shared/progress.js (ClayProgress), key "clayarena-academy", on this device.
     The old keys clayarena-learn / clayarena-interpreter are moved over once (design §7.8), the rules trainer key is read only.
   - Animations: docs/shared/sims.js (ClaySims). A lesson's animation is shown big right after its first paragraph (simHero; on a
     phone, ≤ 560 px, right after the summary, so it is near the first screen): heading, play / stop / replay, slow motion, one line of
     what to watch; it plays once when on screen, never with prefers-reduced-motion, never after the reader started it by hand.
     The lesson's meta line links to it ("▶ with animation"). If the lesson data cannot load, the static page stays and its
     animation is mounted from the static markup (staticSims).
   - English stand phrases: ClaySpeak (sims.js) and ONLY with a voice that runs on the device (audit W-08).
   - Project bar: docs/shared/nav.js (ClayNav.setResume / clearResume, section "learn"; the bar's hint reads state.nav).

   DATA (the build writes it: scripts/build_academy.mjs → content/academy/SCHEMA.md §8; the app never changes it)
     <data>/<lang>/catalog.json          blocks, routes, lesson cards, practice, levels, badges (read on every page)
     <data>/<lang>/ui.json               interface strings (read on every page, together with the catalog; cached by the browser)
     <data>/<lang>/phrases.json          Stand Talk phrases of all published lessons (Practice: translate the coach, phrasebook)
     <data>/<lang>/lessons/<id>.json     one lesson (fetched when its page is shown; body blocks incl. "h" = heading with anchor)
     <data>/<lang>/exams/<route>.json    question bank of a route exam
     <data>/id-map.json                  old ids → new places (old hash links /learn/#<id>, progress transfer)
     <data> = <site>/learn/data/ (override: window.ACADEMY_CONFIG = {dataBase: "…/"} before this script, e.g. on clayarena.com)
   Other ClayArena data used on demand: rules trainer bank docs/rules/data/quiz-*.js (+ i18n/quiz-<lang>.json) for "Рішення судді";
   glossary docs/glossary/data/glossary.js + learn_terms.js + i18n/<lang>.js for term cards, search and flight names.
   TERM LABELS (owner rule 08.10.2026, step 1 = labels): a professional term NAMED as a label is "English (local)" in every language,
   English only on English pages: term chips of a lesson (data terms[].en/local/label), the search results for terms, the answers of
   "Назви траєкторію", the options of "Рішення судді" that carry "term", the names the animations show (ui.json "terms" + sims.js).
   ONE helper makes them: docs/shared/terms.js (window.ClayTerms); this file never builds "en (local)" itself.
   RUNNING TEXT (step 2, 09.10.2026): a term token {{term:<id>|<local form>}} in a lesson text is "<English> (<local form>)" at its
   first mention on the lesson page and "<English>" later. The build renders it (lesson data html / text, exams, phrases.json: see
   scripts/build_academy.mjs view() and quizItem(), DEVELOPERS.md §4l); this app shows that data as it comes. Only a raw token that
   slipped into a string goes through ClayTerms.mention() here (plainTok()).

   PAGE CONTRACT (what every Academy page needs; the build writes the static pages, docs/learn/index.html is the uk home):
     <html lang="<lang>"> · <link rel="stylesheet" href="…/learn/app/academy.css">
     <header id="acTop"></header> <main id="app"> static content for no-JS readers and crawlers </main> <footer id="acFoot"></footer>
     scripts (defer, in this order): shared/nav.js, shared/terms.js, shared/sims.js, shared/progress.js, learn/app/academy.js
   The app replaces the static content of #app when its data has loaded; if the data cannot load, the static content stays
   (and on the shell page the <noscript> summary is shown instead), so a page never ends up empty.

   NAVIGATION: links are real URLs (clean canonical, shareable, work without JS once the build has written the pages). Inside one
   language the app moves with history.pushState and re-renders; a link to another language is a normal page load. The current
   route ("маршрут") is kept in the progress state, never in the URL (design §7.1). No automatic language redirects by browser
   language (that would send search crawlers away from the Ukrainian pages): the app offers the preferred language in a banner.

   PRODUCTION (clayarena.com): the server returns the same JSON from the database and renders the same pages; progress lives in the
   user profile (merge with the max rule of ClayProgress.merge after sign-in), exams are graded on the server, certificates get an id
   with a verification link. Keep the views and texts; replace fetch() of static files by the API.
   ===================================================================================================================== */
(function () {
  "use strict";
  if (typeof document === "undefined") return; // loaded by a test runner without DOM: nothing to do

  /* ================================ 0. Config ================================ */
  const LANGS = ["en", "uk", "de", "fr", "it", "cs", "pl", "pt", "hu", "fi", "lt"]; // ClayArena site languages only
  const LANG_NAMES = { en: "English", uk: "Українська", de: "Deutsch", fr: "Français", it: "Italiano", cs: "Čeština", pl: "Polski",
    pt: "Português", hu: "Magyar", fi: "Suomi", lt: "Lietuvių" };
  const PROD_BASE = "https://juliabezdolna.github.io/clayaway/"; // links the build writes; rewritten to this site when previewed elsewhere
  const ME = document.currentScript || [...document.scripts].find(s => /learn\/app\/academy\.js/.test(s.src));
  const SITE = ME ? ME.src.replace(/learn\/app\/academy\.js.*$/, "") : PROD_BASE;
  const CFG = Object.assign({ dataBase: SITE + "learn/data/" }, window.ACADEMY_CONFIG || {});
  const DATA = new URL(CFG.dataBase, location.href).href; // absolute, ends with "/"
  const RESERVED = ["topics", "routes", "practice", "progress", "app", "data", "assets"];
  /* Anonymous site statistics (docs/shared/stats.js, loaded by docs/shared/nav.js; tools/stats/README.md): Academy events
     route · lesson_done · quiz (lesson:score/n) · game_start · game_end (game:ok/n) · exam_pass / exam_fail (route:score %) ·
     cert (route) · lang · disc. Never throws; does nothing when the statistics are off. Production: ClayArena analytics. */
  const stat = (name, value) => { try { if (window.ClayStats) window.ClayStats.event(name, value); } catch (e) {} };
  /* clayarena.com locale paths for the footer links (same table as scripts/build_seo.mjs, audit W-03) */
  const CA_PATH = { uk: "uk-ua", de: "de-de" };
  const LEGAL = {
    uk: ["Політика конфіденційності", "Правова інформація", "Контакти (зокрема для правовласників)"],
    en: ["Privacy policy", "Legal information", "Contacts (also for rights holders)"],
    de: ["Datenschutzerklärung", "Rechtliche Hinweise", "Kontakt (auch für Rechteinhaber)"],
    fr: ["Politique de confidentialité", "Informations légales", "Contact (y compris pour les ayants droit)"],
    it: ["Informativa sulla privacy", "Note legali", "Contatti (anche per i titolari dei diritti)"],
    cs: ["Zásady ochrany osobních údajů", "Právní informace", "Kontakty (i pro držitele práv)"],
    pl: ["Polityka prywatności", "Informacje prawne", "Kontakt (także dla właścicieli praw)"],
    pt: ["Política de privacidade", "Informação legal", "Contactos (também para titulares de direitos)"],
    hu: ["Adatvédelmi tájékoztató", "Jogi információk", "Kapcsolat (jogtulajdonosoknak is)"],
    fi: ["Tietosuojaseloste", "Oikeudelliset tiedot", "Yhteystiedot (myös oikeudenhaltijoille)"],
    lt: ["Privatumo politika", "Teisinė informacija", "Kontaktai (taip pat teisių turėtojams)"] };
  /* Icons: the data carries a word (blocks.json / routes.json "icon"), the app shows an emoji (decorative, aria-hidden). */
  const ICON = { flag: "🏁", shield: "🛡️", tool: "🧰", target: "🎯", stance: "🧍", calendar: "📅", mind: "🧠", whistle: "📣", trophy: "🏆",
    plane: "✈️", speech: "🗣️", eye: "👁️", people: "👥", family: "👨‍👩‍👧", seedling: "🌱", medal: "🏅", child: "🧒", clipboard: "📋", heart: "💚", coach: "🧑‍🏫",
    "lead-lab": "📐", "name-the-flight": "〰️", "translate-the-coach": "🗣️", "referees-call": "🧑‍⚖️", "term-cards": "🃏", phrasebook: "📒",
    "rules-exam": "📝", routine: "⏱️" };
  const icon = k => ICON[k] || "•";
  const SIM_TYPES = ["flight", "lead", "pair", "call"]; // what ClaySims.mount can draw ("call" = stand scenes: call and release, gun position, misfire)

  /* ================================ 1. Helpers ================================ */
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const P = window.ClayProgress;
  const today = () => P.today();
  const pre = l => (l === "uk" ? "" : l + "/");
  const reduceMotion = () => { try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; } };
  const norm = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  /* URL inside the Academy for a language: path "" | "<id>/" | "topics/<b>/" | "routes/<r>/" | "practice/<g>/" | "progress/" */
  const href = (path, l = LANG) => SITE + pre(l) + "learn/" + path;
  /* Absolute links written by the build point at the production site; when previewed elsewhere they are rewritten to this site. */
  const fixUrl = u => { u = String(u || ""); if (u.startsWith(PROD_BASE) && SITE !== PROD_BASE) return SITE + u.slice(PROD_BASE.length);
    if (/^[a-z][a-z0-9+.-]*:/i.test(u) || u.startsWith("/") || u.startsWith("#")) return u; return SITE + u; };
  const rulesUrl = (book, id, l = LANG) => `${SITE}rules/${l === "uk" ? "" : "en/"}${book}/?lang=${l}#${encodeURIComponent(id)}`; // guide: uk + en pages
  const glossaryUrl = (id, l = LANG) => `${SITE}${pre(l)}glossary/${id}/`;
  /* Term label as HTML: "<span lang=en>English</span> (local)" through docs/shared/terms.js (owner rule 08.10.2026); x = {en, local}
     of the build data or of GLO.term(). Without the helper (an old cached page) the English name only. */
  const termHtml = x => { const CT = window.ClayTerms; if (!x) return ""; if (!CT) return esc(x.en || x.label || "");
    return CT.html(x.en, CT.local(x.local || "", LANG, [x.en]), LANG, esc); };
  function loadScript(src) { return new Promise((res, rej) => { if ([...document.scripts].some(s => s.src === src)) return res();
    const s = document.createElement("script"); s.src = src; s.onload = () => res(); s.onerror = () => rej(new Error(src)); document.head.appendChild(s); }); }
  const JSON_CACHE = new Map();
  function getJSON(url) { if (!JSON_CACHE.has(url)) JSON_CACHE.set(url, fetch(url).then(r => { if (!r.ok) throw new Error(r.status + " " + url); return r.json(); })
    .catch(e => { JSON_CACHE.delete(url); throw e; })); return JSON_CACHE.get(url); }

  /* ================================ 2. Language, location ================================ */
  /* Page language = language of the URL (/learn/ = uk, /<lang>/learn/ = that language). ?lang=<l> on a page of another language
     moves to the same page in <l> (links from the trainer and the old Interpreter Academy carry it). */
  function parseLoc(url) {
    const u = new URL(url, location.href), rel = (u.origin + u.pathname).startsWith(SITE) ? (u.origin + u.pathname).slice(SITE.length) : u.pathname.replace(/^\//, "");
    const m = /^(?:([a-z]{2})\/)?learn\/(.*)$/.exec(rel);
    const lang = m && m[1] && LANGS.includes(m[1]) ? m[1] : "uk";
    const seg = (m ? m[2] : "").replace(/index\.html$/, "").split("/").filter(Boolean);
    let v = { view: "home", id: null };
    if (seg[0] === "topics") v = seg[1] ? { view: "block", id: seg[1] } : { view: "home", id: null, hash: "topics" };
    else if (seg[0] === "routes") v = seg[1] ? (seg[2] === "exam" ? { view: "exam", id: seg[1] } : { view: "route", id: seg[1] }) : { view: "home", id: null, hash: "routes" };
    else if (seg[0] === "practice") v = seg[1] ? { view: "game", id: seg[1] } : { view: "practice", id: null };
    else if (seg[0] === "progress") v = { view: "progress", id: null };
    else if (seg[0] && !RESERVED.includes(seg[0])) v = { view: "lesson", id: seg[0] };
    v.lang = lang; v.uk_prefix = m && m[1] === "uk"; v.query = u.searchParams; return v;
  }
  const pathOf = v => v.view === "home" ? "" : v.view === "block" ? `topics/${v.id}/` : v.view === "route" ? `routes/${v.id}/` : v.view === "exam" ? `routes/${v.id}/exam/`
    : v.view === "practice" ? "practice/" : v.view === "game" ? `practice/${v.id}/` : v.view === "progress" ? "progress/" : `${v.id}/`;

  let LANG = "uk", CAT = null, U = {}, UT = {}, LOC = null, PERSIST = true, S = null, TRAINER = null; // UT = ui.json "terms" (names the animations show)
  /* Interface string; {name} placeholders are filled from vars. Missing keys fall back to the key itself (visible in tests). */
  const u = (k, vars) => { let s = U[k]; if (s == null) s = k; s = String(s); if (vars) s = s.replace(/\{(\w+)\}/g, (m, x) => (vars[x] != null ? vars[x] : m)); return s; };
  const t = (k, vars) => esc(u(k, vars));
  /* Plural forms: keys <base>_one|_few|_many|_other (Intl.PluralRules of the page language), {n} inside. */
  const plural = (base, n) => { let c = "other"; try { c = new Intl.PluralRules(LANG).select(n); } catch (e) {} return t(U[base + "_" + c] != null ? base + "_" + c : base + "_other", { n }); };
  const mins = m => { m = Math.round(m || 0); if (m < 60) return `${m} ${t("min")}`; const h = Math.floor(m / 60), r = m % 60; return `${h} ${t("hours_short")}${r ? ` ${r} ${t("min")}` : ""}`; };
  const discName = d => d === "compak" ? t("disc_compak") : d === "sporting" ? t("disc_sporting") : t("disc_both");

  /* ================================ 3. State ================================ */
  function save() { if (PERSIST) P.save(S); }
  const trainer = () => (TRAINER = P.readTrainer());
  function refreshProgress() { // certificates and badges that became due; returns {certs, badges} for the toast
    const certs = P.issueCertificates(S, CAT, trainer()), badges = P.awardBadges(S, CAT, TRAINER); save();
    for (const id of certs) stat("cert", id); // certificate (or the badge of a badge-only route) issued just now
    return { certs, badges }; }
  const xp = () => P.computeXP(S, CAT, TRAINER || trainer());

  /* ================================ 4. Catalog helpers ================================ */
  const L = id => CAT.lessons[id] || null;
  const avail = id => { const c = L(id); return !!c && (c.status === "published" || c.status === "preview"); };
  const altLangs = c => !c || !c.alt ? [] : Array.isArray(c.alt) ? c.alt : Object.keys(c.alt);
  const blockById = id => CAT.blocks.find(b => b.id === id) || null;
  const routeById = id => CAT.routes.find(r => r.id === id) || null;
  const gameById = id => (CAT.practice || []).find(g => g.id === id) || null;
  const badgeById = id => (CAT.badges || []).find(b => b.id === id) || null;
  const blocksSorted = () => CAT.blocks.slice().sort((a, b) => a.order - b.order);
  const routesSorted = () => CAT.routes.slice().sort((a, b) => a.order - b.order);
  const done = id => !!S.done[id];
  const required = r => P.required(r);
  const routesOf = id => routesSorted().filter(r => required(r).includes(id));
  const currentRoute = () => (S.routes.current && routeById(S.routes.current)) || null;
  const blockMinutes = b => P.blockLessons(b).reduce((s, id) => s + ((L(id) || {}).minutes || 0), 0);
  /* Where a lesson can be read from this language: its own page, else the English page (shown with an "EN" label), else nowhere. */
  function lessonHref(id) { const c = L(id); if (!c) return null; if (avail(id)) return { url: href(id + "/"), en: false };
    if (LANG !== "en" && altLangs(c).includes("en")) return { url: href(id + "/", "en"), en: true }; return null; }
  function stageOf(r, id) { const i = r.stages.findIndex(s => s.lessons.includes(id)); return i < 0 ? null : { index: i, stage: r.stages[i] }; }
  function nextInRoute(r, id) {
    const req = required(r), i = req.indexOf(id); if (i >= 0) return req[i + 1] || null;
    const ex = r.extras || [], j = ex.indexOf(id); return j >= 0 ? ex[j + 1] || null : null; }
  function prevInRoute(r, id) { const req = required(r), i = req.indexOf(id); if (i > 0) return req[i - 1]; const ex = r.extras || [], j = ex.indexOf(id); return j > 0 ? ex[j - 1] : null; }
  const blockOrder = () => blocksSorted().flatMap(b => P.blockLessons(b));
  function nextInBlocks(id) { const o = blockOrder(), i = o.indexOf(id); return i >= 0 ? o[i + 1] || null : null; }
  function firstUndone(r) { return required(r).find(id => !done(id)) || null; }

  /* ================================ 5. Head (title, description, canonical, robots, hreflang) ================================ */
  function setMeta(name, content) { let m = document.querySelector(`meta[name="${name}"]`); if (!m) { m = document.createElement("meta"); m.name = name; document.head.appendChild(m); } m.content = content; }
  function setHead({ title, desc, index, langs }) {
    document.title = title; if (desc) setMeta("description", desc);
    setMeta("robots", index ? "index, follow, max-image-preview:large" : "noindex, follow");
    let c = document.querySelector('link[rel="canonical"]'); if (!c) { c = document.createElement("link"); c.rel = "canonical"; document.head.appendChild(c); }
    c.href = href(pathOf(LOC));
    document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(x => x.remove());
    if (index && langs && langs.length) { const add = (hl, l) => { const a = document.createElement("link"); a.rel = "alternate"; a.hreflang = hl; a.href = href(pathOf(LOC), l); document.head.appendChild(a); };
      langs.forEach(l => add(l, l)); if (langs.includes("en")) add("x-default", "en"); }
  }

  /* ================================ 6. Shell: header, footer, banners ================================ */
  function renderTop() {
    const x = xp(), lv = P.levelOf(x.total, CAT);
    let sk = document.querySelector(".ac-skip"); // outside the sticky header (its backdrop-filter would hold a fixed child)
    // the project bar (docs/shared/nav.js) puts ONE skip link first in <body>; this one is only a fallback without the bar
    if (!sk && !document.querySelector(".ca-skip")) { sk = document.createElement("a"); sk.className = "ac-skip"; sk.href = "#app"; document.body.insertBefore(sk, $("acTop")); }
    if (sk) sk.textContent = u("skip_link");
    $("acTop").innerHTML = `<div class="ac-top-in">
      <a class="ac-brand" href="${href("")}" data-nav><span aria-hidden="true">🎓</span> <span>${t("academy_name")}</span></a>
      <span class="ac-spacer"></span>
      <a class="ac-level" href="${href("progress/")}" data-nav title="${t("progress")}"><span>${esc(lv.level.title)}</span>
        <span class="ac-bar" role="progressbar" aria-label="${t("level")}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${lv.pct}"><i style="width:${lv.pct}%"></i></span>
        <span>${x.total} ${t("xp")}</span></a>
      <label class="ac-langsel"><span class="ac-sr">${t("language")}</span><select id="acLang">${LANGS.map(l => `<option value="${l}" lang="${l}"${l === LANG ? " selected" : ""}>${LANG_NAMES[l]}</option>`).join("")}</select></label>
      <button type="button" class="ac-btn ac-langgo" data-act="langgo" style="display:none" aria-label="${esc(un("nav_lang_go", u("language")))}" title="${esc(un("nav_lang_go", u("language")))}">→</button>
    </div>`;
  }
  /* ---- Language select: changes the page only on a confirmed choice (audit ia-code-22). A pick with the mouse or finger is a
     choice; with the keyboard the arrows only move inside the list: Enter (or the "→" button that appears) opens the page. */
  function langSelKey(e) { const sel = e.target; if (sel.id !== "acLang") return;
    if (e.key === "Enter") { e.preventDefault(); goLang(sel.value); return; }
    if (e.key.length === 1 || /^(Arrow|Page|Home|End)/.test(e.key)) sel.dataset.kbd = "1"; }
  function langSelChange(sel) { const b = document.querySelector(".ac-langgo"); // shown with style.display (.ac-btn sets display)
    if (sel.value === LANG) { if (b) b.style.display = "none"; return; }
    if (sel.dataset.kbd) { if (b) b.style.display = ""; return; }
    goLang(sel.value); }
  /* The reader chose a language (header select, footer list, banner): remember it here (S.lang) and as the visitor language of the
     whole site (docs/shared/nav.js, localStorage "clayarena-lang"), then open the same page in it. */
  const visitorLang = l => { try { if (window.ClayNav && ClayNav.setLang) ClayNav.setLang(l); else localStorage.setItem("clayarena-lang", JSON.stringify(l)); } catch (e) {} };
  function goLang(l) { if (!LANGS.includes(l) || l === LANG) return; S.lang = l; save(); stat("lang", l); visitorLang(l); location.href = urlInLang(l); }
  /* Same page in another language. A lesson that is not published there opens its block page there (no 404, never a page in a
     third language posing as that language). */
  function urlInLang(l) { if (LOC.view === "lesson" && !altLangs(L(LOC.id)).includes(l)) { const c = L(LOC.id); return c ? href(`topics/${c.block}/`, l) : href("", l); }
    return href(pathOf(LOC), l); }
  function renderFoot() {
    const p = CA_PATH[LANG] || "en", lg = LEGAL[LANG] || LEGAL.en;
    $("acFoot").innerHTML = `<div class="ac-foot-in">
      <p>${t("footer")}</p>
      <p class="ac-legal">© ${new Date().getFullYear()} ClayArena · <a href="https://clayarena.com/${p}/privacy/">${esc(lg[0])}</a> · <a href="https://clayarena.com/${p}/legal/">${esc(lg[1])}</a> · <a href="https://clayarena.com/${p}/contacts/">${esc(lg[2])}</a></p>
      <nav aria-label="${t("language")}"><ul class="ac-langs">${LANGS.map(l => `<li><a href="${urlInLang(l)}" hreflang="${l}" lang="${l}"${l === LANG ? ' aria-current="true"' : ""}>${LANG_NAMES[l]}</a></li>`).join("")}</ul></nav>
      <p class="ac-saved">${PERSIST ? t("saved_local") : `<b>${t("progress_not_saved")}</b>`} · <a href="${href("progress/")}" data-nav>${t("progress_link")}</a></p></div>`;
  }
  /* The language the reader prefers (state, old academies, browser), if it differs from this page: one banner, never a redirect. */
  function langBanner() {
    if (S.lang_hint_off) return "";
    // preference: the visitor language of the site (nav.js, localStorage "clayarena-lang": the LAST choice made by any language
    // switcher of the site, the Academy's included) > the Academy's own older choice (S.lang) > the browser
    let vl = null; try { vl = JSON.parse(localStorage.getItem("clayarena-lang") || "null"); } catch (e) {}
    let pref = (LANGS.includes(vl) ? vl : null) || S.lang; if (!pref) { const n = (navigator.language || "").slice(0, 2).toLowerCase(); pref = n === "cz" ? "cs" : n; }
    if (!LANGS.includes(pref) || pref === LANG) return "";
    return `<div class="ac-banner" lang="${pref}"><span aria-hidden="true">🌐</span> <a href="${urlInLang(pref)}" hreflang="${pref}">${LANG_NAMES[pref]} →</a>
      <button type="button" class="ac-x" data-act="langoff" aria-label="${t("close")}">✕</button></div>`;
  }
  let toastT = 0;
  function toast(msg) { const el = $("acToast"); if (!el) return; el.textContent = msg; el.classList.add("on"); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove("on"), 2600); }
  const announce = msg => { const el = $("acLive"); if (el) { el.textContent = ""; setTimeout(() => { el.textContent = msg; }, 30); } };
  function celebrate(res) { const parts = [];
    for (const id of res.badges || []) { const b = badgeById(id); if (b) parts.push("🏅 " + b.title); }
    for (const id of res.certs || []) { const r = routeById(id); if (r) parts.push("🎓 " + r.title); }
    if (parts.length) setTimeout(() => toast(parts.join(" · ")), 900); }

  /* ================================ 7. Small components ================================ */
  /* ---- The Academy mascot (docs/shared/mascot.js → window.ClayMascot, loaded by docs/shared/nav.js; DEVELOPERS.md §4j).
     dog(pose, {bubble, size, anim, cls}) writes an EMPTY decorative slot (<span data-clay-mascot …>, aria-hidden); mascot.js fills it
     as soon as it is in the page (MutationObserver), also when mascot.js loads after the view. Without mascot.js the slot stays empty
     and takes no space (.ac-mascot:empty). BUBBLES ARE ENGLISH ONLY on every page language ("Good shot!" for a right answer or a pass,
     "Safety first!" on the Safety block lessons): they are part of the picture, never translated, never UI text; "think" (a wrong
     answer, a failed round, nothing found) and "sleep" (nothing done yet) have no words. Placements (owner 08.10.2026): lesson quiz
     (next to the explanation of the last answer), route exam result, Practice games except the referee's call and the rules trainer
     (kept serious: NO_DOG), top of the Safety block lessons, empty progress page, search without results, certificate corner.
     anim:false = no entrance motion (the same state drawn again by a re-render). The dog is never shown in the rules guide or trainer. */
  const GOOD = "Good shot!", SAFE = "Safety first!", NO_DOG = ["referees-call", "rules-exam"];
  // When mascot.js is already loaded the slot is written FILLED (same SVG as ClayMascot.mount): a re-render (after every quiz answer)
  // then never shows an empty slot for a moment, which made the browser's scroll anchoring move the page (quiz test 10.2026).
  const dog = (pose, o = {}) => { const M = window.ClayMascot, fill = M && M.svg ? M.svg(pose, { size: o.size || 0, bubble: o.bubble || "", anim: o.anim !== false }) : "";
    return `<span class="ac-mascot${o.cls ? " " + o.cls : ""}${fill ? " cm-host" : ""}" data-clay-mascot="${pose}"${o.bubble ? ` data-bubble="${esc(o.bubble)}"` : ""}${o.size ? ` data-size="${o.size}"` : ""}${o.anim === false ? ' data-anim="0"' : ""} aria-hidden="true">${fill}</span>`; };
  const dogFor = (right, o = {}) => dog(right ? "happy" : "think", Object.assign({ bubble: right ? GOOD : "" }, o)); // right / wrong
  const dogOk = g => !!g && !g.external && !NO_DOG.includes(g.id);                       // Practice games that may show the dog
  /* Text of an element for the screen reader announcement, without decorative parts (the dog's SVG has the bubble text in it). */
  const plainText = el => { const c = el.cloneNode(true); c.querySelectorAll('[aria-hidden="true"]').forEach(x => x.remove()); return c.textContent; };
  const ring = (d, n) => { const pct = n ? d / n : 0, C = 2 * Math.PI * 16;
    return `<svg class="ac-ring" viewBox="0 0 40 40" role="img" aria-label="${d} / ${n}"><circle cx="20" cy="20" r="16" class="bg"/><circle cx="20" cy="20" r="16" class="fg" stroke-dasharray="${(pct * C).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 20 20)"/><text x="20" y="24" text-anchor="middle">${d}</text></svg>`; };
  const bar = (d, n, label) => `<span class="ac-pbar" role="progressbar" aria-label="${esc(label || "")}" aria-valuemin="0" aria-valuemax="${n}" aria-valuenow="${d}"><i style="width:${n ? Math.round(d / n * 100) : 0}%"></i></span>`;
  const discChips = ds => (ds || []).map(d => `<span class="ac-chip ac-disc-${d}">${discName(d)}</span>`).join("");
  // The lesson page reads it once per view (VIEW.upd): finishing the quiz must not remove the chip under the reader's eyes (the header
  // got shorter and the page jumped, quiz test 10.2026); it is gone the next time the lesson is opened. The same for the "✓ lesson done"
  // chip (VIEW.done0): finishing the quiz must not ADD it under the reader's eyes (the meta line wrapped, the header grew by 31 px and the
  // whole quiz jumped on 1126 of 1551 lesson pages at 1000 px; tools/checks/check_quiz.py, 09.10.2026). The score line says it already.
  const updated = id => { const d = S.done[id], c = L(id); return !!(d && c && (d.rev || 0) < (c.rev || 0)); };
  /* "▶ з анімацією" on a lesson card (topic and route lists, search): the catalog marks lessons that open with an animation (anim). */
  const animMark = c => c && c.anim ? `<span class="ac-animark">▶ ${t("anim_marker")}</span>` : "";
  /* One lesson in a list. opts.route: the route the list belongs to (a click makes it the current route); opts.n: step number. */
  function lessonRow(id, opts = {}) {
    const c = L(id); if (!c) return "";
    const h = lessonHref(id), d = done(id), num = opts.n != null ? opts.n : "";
    const meta = [`${c.minutes || 4} ${t("min")}`, c.level === 1 ? `★ ${t("start_here")}` : "", animMark(c), c.review_flag === "pending" ? t("review_pending") : "",
      updated(id) ? `● ${t("lesson_updated")}` : "", c.status === "preview" ? t("clayaway_coming") : ""].filter(Boolean).join(" · ");
    const inner = `<span class="ac-ck" aria-hidden="true">${d ? "✓" : esc(num)}</span><span class="ac-les-t"><b>${esc(c.title)}</b>${opts.summary && c.summary ? `<span class="ac-les-s">${esc(c.summary)}</span>` : ""}<span class="ac-les-m">${meta}${c.disciplines && c.disciplines.length === 1 ? " · " + discName(c.disciplines[0]) : ""}</span></span>`;
    const sr = d ? `<span class="ac-sr">${t("lesson_done")}</span>` : "";
    if (!h) return `<li><span class="ac-les is-off" aria-disabled="true">${inner}<span class="ac-tag">${t(c.status === "untranslated" ? "untranslated_short" : "draft_soon")}</span></span></li>`;
    return `<li><a class="ac-les${d ? " is-done" : ""}" href="${opts.route ? withRoute(h.url, opts.route) : h.url}"${h.en ? ' hreflang="en"' : " data-nav"}${opts.route ? ` data-route="${esc(opts.route)}"` : ""}>${inner}${sr}${h.en ? `<span class="ac-tag" lang="en">EN</span>` : ""}</a></li>`;
  }
  const lessonList = (ids, opts = {}) => `<ol class="ac-lessons">${ids.map((id, i) => lessonRow(id, Object.assign({ n: i + 1 }, opts))).join("")}</ol>`;
  function routeCard(r, big) {
    const req = required(r), d = req.filter(done).length, cur = S.routes.current === r.id;
    const pl = pageLink(r, `routes/${r.id}/`);
    return `<a class="ac-card ac-route${big ? " big" : ""}${cur ? " is-current" : ""}" href="${pl.url}"${pl.en ? ' hreflang="en"' : " data-nav"} data-route="${esc(r.id)}">
      <span class="ac-ic" aria-hidden="true">${icon(r.icon)}</span><h3>${esc(r.title)}${pl.en ? ' <span class="ac-tag" lang="en">EN</span>' : ""}</h3><p>${esc(r.for)}</p>
      <span class="ac-meta">${plural("n_lessons", req.length)} · ~${mins((r.totals && r.totals.minutes) || req.reduce((s, id) => s + ((L(id) || {}).minutes || 0), 0))} · ${r.certificate ? "🎓 " + t("cert_title") : "🏅 " + t("badge_word")}</span>
      ${d ? `<span class="ac-meta">${bar(d, req.length, r.title)} ${d}/${req.length}</span>` : ""}</a>`;
  }
  function blockCard(b) {
    const ids = P.blockLessons(b), d = ids.filter(done).length;
    const pl = pageLink(b, `topics/${b.id}/`);
    return `<a class="ac-card ac-block" href="${pl.url}"${pl.en ? ' hreflang="en"' : " data-nav"}><span class="ac-ic" aria-hidden="true">${icon(b.icon)}</span>
      <span class="ac-block-t"><h3>${esc(b.title)}</h3><span class="ac-meta">${plural("n_lessons", ids.length)} · ~${mins(blockMinutes(b))}</span></span>${ring(d, ids.length)}</a>`;
  }
  /* External game (the rules trainer): the build writes external:true + url; practice.json writes the URL template itself. */
  const extUrl = g => g.url && g.external === true ? fixUrl(g.url) : typeof g.external === "string" ? fixUrl(g.external.replace("{lang}", LANG).replace(/^\//, "")) : `${SITE}rules/trainer/?lang=${LANG}&from=learn`;
  const gameDesc = g => g.description || (U["game_" + g.legacy + "_d"] != null ? u("game_" + g.legacy + "_d") : U["game_" + g.id.replace(/-/g, "_") + "_d"] != null ? u("game_" + g.id.replace(/-/g, "_") + "_d") : "");
  /* A page the build did not write in this language (catalog url: null) opens in English, marked "EN" (never a 404, never a
     page of another language posing as this one). */
  const pageLink = (x, path) => x && x.url === null && LANG !== "en" ? { url: href(path, "en"), en: true } : { url: href(path), en: false };
  /* The rules trainer is part of this Practice (owner decision 07.10.2026): same site, so no "↗"; its name comes from the ONE
     naming table of the project bar (docs/shared/nav.js, ClayNav.name("trainer"): «Тренажер правил», "Rules trainer" …). */
  const gameTitle = g => (g.external && window.ClayNav && ClayNav.name && ClayNav.name("trainer", LANG)) || g.title;
  function gameCard(g) {
    const desc = gameDesc(g);
    if (g.later) return `<div class="ac-card ac-game is-off" aria-disabled="true"><span class="ac-ic" aria-hidden="true">${icon(g.id)}</span><h3>${esc(g.title)}</h3><p>${esc(desc)}</p><span class="ac-tag">${t("practice_soon")}</span></div>`;
    const pl = pageLink(g, `practice/${g.id}/`), url = g.external ? extUrl(g) : pl.url, nav = !g.external && !pl.en;
    return `<a class="ac-card ac-game" href="${esc(url)}"${nav ? " data-nav" : pl.en ? ' hreflang="en"' : ""}><span class="ac-ic" aria-hidden="true">${icon(g.id)}</span><h3>${esc(gameTitle(g))}${pl.en && !g.external ? ' <span class="ac-tag" lang="en">EN</span>' : ""}</h3><p>${esc(desc)}</p>
      ${g.xp === false && (g.known_issues || []).length ? `<span class="ac-meta">${t("practice_known_issue")}</span>` : ""}${g.external ? `<span class="ac-meta">${t("practice_external")}</span>` : ""}</a>`;
  }
  function discSwitch() {
    return `<div class="ac-seg" role="group" aria-label="${t("my_discipline")}"><span class="ac-seg-l">${t("my_discipline")}:</span>${["both", "sporting", "compak"].map(d =>
      `<button type="button" data-act="disc" data-v="${d}" aria-pressed="${S.disc === d}">${discName(d)}</button>`).join("")}</div>`;
  }
  const crumbs = items => `<nav class="ac-crumbs" aria-label="${t("breadcrumbs")}"><ol>${items.map((x, i) => `<li>${x.url && i < items.length - 1 ? `<a href="${x.url}" data-nav>${esc(x.label)}</a>` : `<span${i === items.length - 1 ? ' aria-current="page"' : ""}>${esc(x.label)}</span>`}</li>`).join("")}</ol></nav>`;
  const home = () => ({ label: u("academy_name"), url: href("") });
  /* ---- Where a lesson was opened from (audit ia-code-07): route pages add ?route=<id> to their lesson links (and the lesson's
     own route links keep it); then the crumbs (Академія › <route> › Етап n › <lesson>, the levels of the route page crumbs), the
     step strip, "Далі" and "До маршруту" follow that route. Without it (topic page, search, glossary, a shared link) the crumbs
     follow the topic path (Академія › <topic> › <section> › <lesson>: the SAME levels as the static lesson pages written by
     scripts/build_academy.mjs) and the current route of this device is offered only as a chip «Також у маршруті «…»: крок n з m».
     The canonical URL never carries ?route. Production: the same rule on the server (crumbs by the route parameter). */
  const withRoute = (url, rid) => { if (!rid || !url) return url; const i = url.indexOf("#"), base = i < 0 ? url : url.slice(0, i), h = i < 0 ? "" : url.slice(i);
    return base + (base.includes("?") ? "&" : "?") + "route=" + encodeURIComponent(rid) + h; };
  function lessonCtx(id) {
    const inR = r => !!r && (required(r).includes(id) || (r.extras || []).includes(id));
    const q = LOC && LOC.query && LOC.query.get("route"), qr = q ? routeById(q) : null;
    if (inR(qr)) return { route: qr, also: null };
    const cur = currentRoute(); return { route: null, also: cur && required(cur).includes(id) ? cur : null };
  }
  function lessonCrumbs(c, b, sec, inRoute, so) {
    if (inRoute) { const ru = pageLink(inRoute, `routes/${inRoute.id}/`).url;
      return [home(), { label: inRoute.title, url: ru }, so ? { label: `${u("stage")} ${so.index + 1}. ${so.stage.title}`, url: ru + "#stage-" + so.stage.id } : null, { label: c.title }].filter(Boolean); }
    const bu = b && pageLink(b, `topics/${b.id}/`).url;
    return [home(), b ? { label: b.title, url: bu } : null, sec ? { label: sec.title, url: bu + "#" + sec.id } : null, { label: c.title }].filter(Boolean);
  }
  function alsoRoute(r, id) { const req = required(r), n = req.indexOf(id); if (n < 0) return "";
    const h = lessonHref(id), url = h && !h.en ? withRoute(h.url, r.id) : pageLink(r, `routes/${r.id}/`).url;
    return `<p class="ac-meta ac-also"><a class="ac-chip" href="${esc(url)}" data-nav data-route="${esc(r.id)}">${esc(un("nav_also_route", `${r.title} · ${u("step_of", { n: n + 1, t: req.length })}`, { route: r.title, n: n + 1, t: req.length }))}</a></p>`; }

  /* ================================ 8. Views ================================ */
  let VIEW = {};       // transient state of the current view (quiz answers, game round…); reset on every navigation
  let AFTER = [];      // functions to run after the view's HTML is in the page (sims, games, focus)
  let APP_DONE = false; // true once the app has replaced the static content of #app (until then a data error keeps the static page)
  const after = fn => AFTER.push(fn);

  /* ---------- 8.1 Home ---------- */
  function viewHome() {
    const r = currentRoute(), anyDone = Object.keys(S.done).length > 0;
    let cont = "";
    if (r) { const st = P.routeStatus(S, CAT, r, TRAINER), nx = firstUndone(r);
      if (nx) { const so = stageOf(r, nx), c = L(nx), h = lessonHref(nx);
        cont = `<a class="ac-continue" href="${h ? withRoute(h.url, r.id) : pageLink(r, `routes/${r.id}/`).url}"${h && !h.en ? " data-nav" : ""} data-route="${esc(r.id)}"><span class="ac-eyebrow">${t("continue")}</span>
          <b>${t("continue_route", { lesson: c ? c.title : nx, route: r.title, n: so ? so.index + 1 : 1, t: r.stages.length, min: c ? c.minutes : "" })}</b>${bar(st.done, st.total, r.title)}</a>`; }
      else cont = `<a class="ac-continue" href="${pageLink(r, `routes/${r.id}/`).url}#certificate" data-nav><span class="ac-eyebrow">${esc(r.title)}</span><b>${t("route_complete_go")}</b></a>`;
    } else if (anyDone && S.last && L(S.last)) { const nx = nextInBlocks(S.last), id = nx && !done(nx) ? nx : S.last, h = lessonHref(id);
      if (h) cont = `<a class="ac-continue" href="${h.url}"${h.en ? "" : " data-nav"}><span class="ac-eyebrow">${t("continue")}</span><b>${t("continue_last", { lesson: L(id).title })}</b></a>`; }
    const prim = routesSorted().filter(x => x.primary), more = routesSorted().filter(x => !x.primary);
    setHead({ title: u("home_title"), desc: u("home_desc"), index: true, langs: LANGS });
    return `${langBanner()}${demoNote()}
    <section class="ac-hero"><div class="ac-eyebrow">ClayArena · ${t("disc_sporting")} · ${t("disc_compak")}</div><h1 tabindex="-1">${t("home_hero_h1")}</h1><p>${t("home_hero_lead")}</p></section>
    ${cont}
    <section aria-labelledby="h-who"><h2 id="h-who">${t("who_are_you")}</h2><p class="ac-muted">${t("who_hint")}</p>
      <div class="ac-grid ac-grid-routes">${prim.map(x => routeCard(x, true)).join("")}</div>
      <h3 class="ac-h3">${t("more_routes")}</h3><div class="ac-grid ac-grid-more">${more.map(x => routeCard(x, false)).join("")}</div></section>
    <section aria-labelledby="h-search" class="ac-search"><h2 id="h-search" class="ac-sr">${t("search")}</h2>
      <label for="acQ" class="ac-sr">${t("search")}</label><input id="acQ" type="search" autocomplete="off" placeholder="${t("search")}" value="${esc(VIEW.q || "")}">
      <div id="acQR" aria-live="polite"></div></section>
    <section aria-labelledby="h-topics" id="topics"><div class="ac-h2row"><h2 id="h-topics">${t("topics")}</h2>${discSwitch()}</div>
      <div class="ac-grid ac-grid-blocks">${blocksSorted().map(blockCard).join("")}</div></section>
    <section aria-labelledby="h-prac"><div class="ac-h2row"><h2 id="h-prac">${t("practice")}</h2><a href="${href("practice/")}" data-nav>${t("practice_all")} →</a></div>
      <div class="ac-grid ac-grid-games">${(CAT.practice || []).filter(g => !g.later).map(gameCard).join("")}</div></section>`;
  }
  const demoNote = () => CAT.test ? `<p class="ac-test">PREVIEW BUILD — draft lessons are shown; not for publishing.</p>` : "";

  /* Search: lessons from the catalog at once; glossary terms after the glossary data has loaded (on the first search). */
  function searchResults(q) {
    const n = norm(q).trim(); if (n.length < 2) return "";
    const ls = Object.values(CAT.lessons).filter(c => c.status !== "draft" && (norm(c.title).includes(n) || norm(c.summary).includes(n))).slice(0, 8);
    const terms = GLO.ready ? GLO.search(n).slice(0, 6) : [];
    if (!ls.length && !terms.length) { if (!GLO.ready) return `<p class="ac-muted">${t("loading")}</p>`;
      const again = VIEW.qNone; VIEW.qNone = true; // the "think" dog moves only the first time, not on every key press
      return `<div class="ac-empty">${dog("think", { size: 56, anim: !again })}<p class="ac-muted">${t("search_none")}</p></div>`; }
    VIEW.qNone = false;
    return `${ls.length ? `<h3 class="ac-h3">${t("search_lessons")}</h3><ul class="ac-lessons">${ls.map(c => lessonRow(c.id, { summary: true })).join("")}</ul>` : ""}
      ${terms.length ? `<h3 class="ac-h3">${t("search_terms")}</h3><ul class="ac-terms">${terms.map(x => `<li><a href="${x.url}"><b>${termHtml(x)}</b><span class="ac-les-s">${esc(x.short)}</span></a></li>`).join("")}</ul>` : ""}`;
  }

  /* ---------- 8.2 Block ---------- */
  function viewBlock(id) {
    const b = blockById(id); if (!b) return viewNotFound();
    const ids = P.blockLessons(b), d = ids.filter(done).length;
    const routes = routesSorted().filter(r => required(r).some(x => ids.includes(x)));
    setHead({ title: `${b.title} — ${u("academy_name")}`, desc: b.purpose, index: true, langs: LANGS });
    const games = (b.practice || []).map(gameById).filter(Boolean);
    return `${langBanner()}${crumbs([home(), { label: u("topics"), url: href("") + "#topics" }, { label: b.title }])}
    <header class="ac-head"><div class="ac-eyebrow"><span aria-hidden="true">${icon(b.icon)}</span> ${t("topics")}</div><h1 tabindex="-1">${esc(b.title)}</h1><p class="ac-lead">${esc(b.purpose)}</p>
      <p class="ac-meta">${plural("n_lessons", ids.length)} · ~${mins(blockMinutes(b))} · ${bar(d, ids.length, b.title)} ${d}/${ids.length}</p>
      ${routes.length ? `<p class="ac-meta">${t("in_routes")}: ${routes.map(r => `<a class="ac-chip" href="${pageLink(r, `routes/${r.id}/`).url}" data-nav>${esc(r.title)}</a>`).join(" ")}</p>` : ""}</header>
    ${discSwitch()}
    <section aria-labelledby="h-start"><h2 id="h-start">★ ${t("start_here")}</h2>${lessonList(b.starters || [], { summary: true })}</section>
    ${b.sections.map(s => `<section id="${esc(s.id)}" aria-labelledby="h-${esc(s.id)}"><h2 id="h-${esc(s.id)}">${esc(s.title)}</h2>${lessonList(s.lessons, { summary: true })}</section>`).join("")}
    ${games.length ? `<section aria-labelledby="h-bg"><h2 id="h-bg">${t("block_games")}</h2><div class="ac-grid ac-grid-games">${games.map(gameCard).join("")}</div></section>` : ""}
    ${b.glossary_category ? `<p><a href="${SITE}${pre(LANG)}glossary/#${esc(b.glossary_category)}">${t("block_glossary")} →</a></p>` : ""}`;
  }

  /* ---------- 8.3 Route ---------- */
  function viewRoute(id) {
    const r = routeById(id); if (!r) return viewNotFound();
    const st = P.routeStatus(S, CAT, r, TRAINER), nx = firstUndone(r), h = nx && lessonHref(nx), legacy = st.cert && st.cert.legacy;
    setHead({ title: `${u("route_title", { route: r.title })} — ${u("academy_name")}`, desc: r.for, index: true, langs: LANGS });
    const pass = r.certificate && r.certificate.exam ? r.certificate.exam : r.badge_only && r.badge_only.quiz;
    const reqs = [
      { ok: st.lessonsOk, text: `${u("route_required")}: ${st.done}/${st.total}` },
      pass ? { ok: st.exam, text: `${u("route_exam")}: ${u("exam_rule", { n: pass.n, p: pass.pass_pct })}`, link: st.lessonsOk || st.exam ? href(`routes/${r.id}/exam/`) : null } : null,
      ...st.practice.map(p => ({ ok: p.ok, waiting: p.waiting, text: practiceReqText(p.item), link: practiceReqLink(p.item) })) ].filter(Boolean);
    return `${langBanner()}${crumbs([home(), { label: u("routes"), url: href("") + "#h-who" }, { label: r.title }])}
    <header class="ac-head"><div class="ac-eyebrow"><span aria-hidden="true">${icon(r.icon)}</span> ${t("route_word")}</div><h1 tabindex="-1">${esc(r.title)}</h1>
      <p class="ac-lead"><b>${t("route_for")}:</b> ${esc(r.for)}</p>
      <p class="ac-meta">${plural("n_lessons", st.total)} · ~${mins((r.totals && r.totals.minutes) || 0)} · ${bar(st.done, st.total, r.title)} ${st.done}/${st.total}</p>
      ${r.disclaimer ? `<p class="ac-note">${esc(r.disclaimer)}</p>` : ""}
      <p>${nx ? `<a class="ac-btn primary" href="${h ? withRoute(h.url, r.id) : "#"}"${h && !h.en ? " data-nav" : ""} data-route="${esc(r.id)}">${st.done ? t("continue") : t("start_stage")} →</a>`
        : `<a class="ac-btn primary" href="#certificate">${t("route_done")} →</a>`}
        ${S.routes.current === r.id ? `<span class="ac-chip is-on">${t("route_current")}</span>` : `<button type="button" class="ac-btn" data-act="setroute" data-v="${esc(r.id)}">${t("route_choose")}</button>`}</p></header>
    <ol class="ac-stages">${r.stages.map((s, i) => { const sd = s.lessons.filter(done).length, all = sd === s.lessons.length;
      return `<li class="ac-stage${all ? " is-done" : ""}" id="stage-${esc(s.id)}"><details${(!all && (i === 0 || r.stages[i - 1].lessons.every(done))) || (nx && s.lessons.includes(nx)) ? " open" : ""}>
        <summary><span class="ac-stage-n" aria-hidden="true">${all ? "✓" : i + 1}</span><span class="ac-stage-t"><b>${t("stage")} ${i + 1}. ${esc(s.title)}</b>
        <span class="ac-meta">${plural("n_lessons", s.lessons.length)} · ~${mins(s.minutes)} · ${sd}/${s.lessons.length}${all ? " · 🏅 " + esc((badgeById(s.badge) || {}).title || "") : ""}</span></span></summary>
        ${lessonList(s.lessons, { route: r.id })}</details></li>`; }).join("")}</ol>
    ${(r.extras || []).length ? `<details class="ac-extras"><summary><h2>${t("go_deeper")}</h2></summary>${lessonList(r.extras, { route: r.id, summary: true })}</details>` : ""}
    <section class="ac-certbox" id="certificate" aria-labelledby="h-cert"><h2 id="h-cert">${r.certificate ? "🎓 " + t("cert_title") : "🏅 " + t("badge_word")}${r.certificate && r.certificate.title ? ` «${esc(r.certificate.title)}»` : ""}</h2>
      ${st.complete || st.cert ? (r.certificate ? certHtml(r, st.cert) + `<p><button type="button" class="ac-btn primary" data-act="printcert" data-v="${esc(r.id)}">🖨 ${t("cert_print")}</button> <a class="ac-btn" href="${href("progress/")}#name" data-nav>${t("cert_name")}</a></p>` : `<p class="ac-ok">🏅 ${t("badge_earned")}</p>`) : `<p>${t("cert_missing")}:</p>`}
      <ul class="ac-reqs">${reqs.map(x => `<li class="${x.ok ? "ok" : x.waiting ? "wait" : ""}"><span aria-hidden="true">${x.ok && !x.waiting ? "✓" : x.waiting ? "…" : "○"}</span> ${x.link ? `<a href="${x.link}"${x.link.startsWith(href("")) ? " data-nav" : ""}>${esc(x.text)}</a>` : esc(x.text)}${x.waiting ? ` <span class="ac-muted">(${t("req_waiting")})</span>` : ""}</li>`).join("")}</ul>
      ${legacy ? `<p class="ac-muted">${t("cert_legacy")}</p>` : ""}
      <details class="ac-means"><summary>${t("cert_means")}</summary><p>${t("cert_means_p")}</p><p><b>${t("cert_disclaimer")}</b>${r.disclaimer ? " " + esc(r.disclaimer) : ""}</p></details></section>
    ${r.checklist ? `<section aria-labelledby="h-chk"><h2 id="h-chk">📋 ${esc(r.checklist.title)}</h2><p class="ac-muted">${t("checklist_d")}</p><button type="button" class="ac-btn" data-act="checklist" data-v="${esc(r.id)}">🖨 ${t("checklist_print")}</button></section>` : ""}`;
  }
  function practiceReqText(p) { const g = gameById(p.game), name = g ? gameTitle(g) : p.game;
    if (p.game === "rules-exam") return `${name}: ${u(p.mode === "short" && U.req_rules_short != null ? "req_rules_short" : "req_rules_exam", { n: p.n || 10, p: p.min_pct || 80 })}`;
    if (p.require === "hit-with-each-method") return `${name}: ${u("req_four_methods")}`;
    if (p.min_score != null) return `${name}: ${u("req_score", { n: p.min_score, t: p.of || 10 })}`;
    return `${name}: ${u("req_pct", { p: p.min_pct || 80 })}`; }
  /* The rules trainer opens its short test (10 questions, pass mark 80 %; route "Перші змагання") with &mode=short. */
  function practiceReqLink(p) { const g = gameById(p.game); if (!g) return null;
    if (!g.external) return pageLink(g, `practice/${g.id}/`).url;
    const x = extUrl(g); return p.mode ? x + (x.includes("?") ? "&" : "?") + "mode=" + encodeURIComponent(p.mode) : x; }
  /* Certificate sheet (printable, A4). Name only from this device; no federation logos; the disclaimer is always on it (design §7.7). */
  function certHtml(r, cert) {
    const ex = (S.routes[r.id] || {}).exam;
    return `<div class="ac-cert" id="cert-${esc(r.id)}">${dog("happy", { size: 56, anim: false, cls: "ac-cert-dog" })}<div class="ac-cert-logo">ClayArena</div><div class="ac-cert-k">${t("cert_title")}</div>
      <div class="ac-cert-name">${esc(S.name || "—")}</div><p>${t("cert_route", { route: r.title })}</p>
      <p class="ac-cert-meta">${cert ? esc(cert.date) : ""}${ex ? ` · ${t("route_exam")}: ${esc(ex.score)} %` : ""}${cert && cert.no ? ` · ${t("cert_no", { no: cert.no })}` : ""}</p>
      <p class="ac-cert-d">${t("cert_disclaimer")}${r.disclaimer ? " " + esc(r.disclaimer) : ""}</p>${cert && cert.legacy ? `<p class="ac-cert-d">${t("cert_legacy")}</p>` : ""}</div>`;
  }

  /* ---------- 8.4 Lesson ---------- */
  function viewLesson(id) {
    const c = L(id); if (!c) return viewNotFound();
    if (!avail(id)) return viewUntranslated(c);
    const D = VIEW.data; // loaded by render() before this runs
    if (!D) return `<p class="ac-muted" aria-busy="true">${t("loading")}</p>`;
    const b = blockById(c.block), sec0 = b && b.sections.find(s => s.id === c.section), sec = sec0 && sec0.title !== b.title && b.sections.length > 1 ? sec0 : null, lc = lessonCtx(id), inRoute = lc.route;
    const so = inRoute && stageOf(inRoute, id), req = inRoute ? required(inRoute) : [], step = req.indexOf(id);
    setHead({ title: `${c.title} — ${u("academy_name")}`, desc: c.summary || D.summary || "", index: c.index ? c.index === "index" : c.status === "published" && !c.draft, langs: altLangs(c) });
    const next = inRoute ? nextInRoute(inRoute, id) : nextInBlocks(id), prev = inRoute ? prevInRoute(inRoute, id) : null;
    const notesOpen = !!(inRoute && inRoute.notes_open), standOpen = notesOpen || c.block === "stand-talk";
    const cr = lessonCrumbs(c, b, sec, inRoute, so); // by where the reader came from (?route), else the topic path
    VIEW.phr = D.phrases || [];
    if (c.block === "safety") after(() => { VIEW.safeDog = 1; }); // Safety block: "Safety first!" dog moves once, not on re-renders
    const ev = {}; for (const e of D.evidence || []) (ev[e.for] = ev[e.for] || []).push(e.level);
    for (const x of D.body || []) if (x.t === "evidence" && x.for) (ev[x.for] = ev[x.for] || []).push(x.level);
    const hero = heroBlock(D.body || []);
    const body = foldRuns((narrow() ? heroUp(D.body || [], hero) : D.body || []).map(x => blockHtml(x, ev, D)));
    const navLink = (lid, cls, label) => { if (!lid) return ""; const h = lessonHref(lid); if (!h) return "";
      return `<a class="ac-btn ${cls}" href="${inRoute ? withRoute(h.url, inRoute.id) : h.url}"${h.en ? ' hreflang="en"' : " data-nav"}${inRoute ? ` data-route="${esc(inRoute.id)}"` : ""}>${label}: ${esc(L(lid).title)}${h.en ? " (EN)" : ""}</a>`; };
    return `${langBanner()}${crumbs(cr.filter(Boolean))}${lc.also ? alsoRoute(lc.also, id) : ""}
    ${inRoute && step >= 0 ? `<div class="ac-strip"><span>${esc(inRoute.title)} · ${t("step_of", { n: step + 1, t: req.length })}</span>${bar(req.filter(done).length, req.length, inRoute.title)}
      <span class="ac-strip-nav">${prev && lessonHref(prev) ? `<a href="${withRoute(lessonHref(prev).url, inRoute.id)}" data-nav aria-label="${t("prev_lesson")}">←</a>` : ""}${next && lessonHref(next) ? `<a href="${withRoute(lessonHref(next).url, inRoute.id)}" data-nav aria-label="${t("next_lesson")}">→</a>` : ""}</span></div>` : ""}
    <article class="ac-lesson" lang="${LANG}">
    <header class="ac-head">${c.block === "safety" ? dog("safety", { bubble: SAFE, size: 60, anim: !VIEW.safeDog, cls: "ac-mascot-head" }) : ""}<div class="ac-eyebrow">${b ? `<span aria-hidden="true">${icon(b.icon)}</span> ${esc(b.title)}` : ""}${sec ? " · " + esc(sec.title) : ""}</div>
      <h1 tabindex="-1">${esc(c.title)}</h1>
      <p class="ac-meta">⏱ ${c.minutes || 4} ${t("min")} · ${c.level === 1 ? "★ " + t("start_here") : t("go_deeper")} ${discChips(c.disciplines)}
        ${hero ? `<a class="ac-chip ac-animark" href="#anim-${esc(hero.k)}">▶ ${t("anim_marker")}</a>` : ""}
        ${D.review_flag === "pending" || c.review_flag === "pending" ? `<span class="ac-chip ac-review">${t("review_pending")}</span>` : ""}
        ${(VIEW.upd === undefined ? (VIEW.upd = updated(id)) : VIEW.upd) ? `<span class="ac-chip ac-upd" title="${t("lesson_updated_d")}">● ${t("lesson_updated")}</span>` : ""}
        ${(VIEW.done0 === undefined ? (VIEW.done0 = done(id)) : VIEW.done0) ? `<span class="ac-chip is-on">✓ ${t("lesson_done")}</span>` : ""}</p>
      ${D.summary ? `<p class="ac-lead">${esc(D.summary)}</p>` : ""}</header>
    ${c.status === "preview" ? `<p class="ac-note">🛠 ${t("clayaway_preview")}</p>` : ""}
    ${c.draft || D.draft ? `<p class="ac-note ac-draft-n">Draft preview — ${t("draft_soon_p")}</p>` : ""}
    ${D.review_flag === "pending" || c.review_flag === "pending" ? `<p class="ac-note ac-review-n"><b>${t("review_pending")}.</b> ${t("review_pending_d")}</p>` : ""}
    ${(c.disciplines || []).length > 1 ? discSwitch() : ""}
    <div class="ac-body">${body}</div>
    ${D.more_in_en ? `<p class="ac-note">${plural("more_in_en", D.more_in_en)}${altLangs(c).includes("en") && LANG !== "en" ? ` — <a href="${href(id + "/", "en")}" hreflang="en" lang="en">English</a>` : ""}</p>` : ""}
    ${(D.key_points || []).length ? `<section class="ac-kp" aria-labelledby="h-kp"><h2 id="h-kp">${t("key_points")}</h2><ul>${D.key_points.map(k => `<li${k.checklist ? ' class="chk"' : ""}>${k.html}</li>`).join("")}</ul></section>` : ""}
    ${D.did_you_know ? `<aside class="ac-dyk"><b>${t("did_you_know")}</b> ${D.did_you_know.html}</aside>` : ""}
    ${(D.phrases || []).length ? `<details class="ac-panel ac-stand"${standOpen ? " open" : ""}><summary><h2>🗣 ${t("stand_talk")}</h2></summary>${D.phrases.map((p, i) => phraseHtml(p, i)).join("")}</details>` : ""}
    ${notesHtml(D.notes || [], notesOpen)}
    ${(D.terms || []).length ? `<section aria-labelledby="h-terms"><h2 id="h-terms">${t("terms")}</h2><ul class="ac-chips">${D.terms.map(x => `<li><a class="ac-chip" href="${esc(fixUrl(x.url || glossaryUrl(x.id)))}">${termHtml(x)}</a></li>`).join("")}</ul></section>` : ""}
    ${(D.rule_refs || []).length ? `<section aria-labelledby="h-rules"><h2 id="h-rules">${t("rules_where")}</h2><ul class="ac-chips">${D.rule_refs.map(x => `<li><a class="ac-chip" href="${esc(fixUrl(x.url || rulesUrl(x.book, x.id)))}">${esc(x.label || x.id)}</a></li>`).join("")}</ul><p class="ac-muted ac-small">${t("rules_note")}</p></section>` : ""}
    ${(D.sources || []).length ? `<section aria-labelledby="h-src"><h2 id="h-src">${t("sources")}</h2><ul class="ac-src">${D.sources.map(s => `<li><a href="${esc(s.url)}" target="_blank" rel="${s.fitasc || /fitasc\.com/i.test(s.url) ? "nofollow noopener noreferrer" : "noopener noreferrer"}">${esc(s.title)} ↗</a></li>`).join("")}</ul></section>` : ""}
    ${D.disclaimer === "medical" || c.disclaimer === "medical" ? `<p class="ac-disclaimer">⚕ ${t("not_medical_advice")}</p>` : ""}
    <section class="ac-quiz" aria-labelledby="h-quiz" id="quiz"><h2 id="h-quiz">${t("quiz")}</h2>${quizHtml(id, D)}</section>
    <nav class="ac-endnav" aria-label="${t("lesson_nav")}">${navLink(next, "primary", t("next_lesson"))}
      ${inRoute ? `<a class="ac-btn" href="${pageLink(inRoute, `routes/${inRoute.id}/`).url}" data-nav>${t("to_route")}</a>` : b ? `<a class="ac-btn" href="${pageLink(b, `topics/${b.id}/`).url}" data-nav>${esc(b.title)}</a>` : ""}
      <a class="ac-btn ac-ghost" href="https://clayarena.com/${CA_PATH[LANG] || "en"}/contacts/" title="${esc(id)}">${t("report_error")}</a></nav>
    </article>`;
  }
  /* Body block → HTML. "html" is already escaped by the build (tokens rendered as links); the app only wraps it. */
  function blockHtml(x, ev, D) {
    const id = x.anchor ? ` id="${esc(x.anchor)}"` : "", evid = (ev[x.k] || []).map(lv => `<span class="ac-ev ac-ev-${esc(lv)}">${t("ev_" + lv)}</span>`).join(" ");
    const evs = evid ? `<div class="ac-evrow"><span class="ac-muted">${t("evidence")}:</span> ${evid}</div>` : "";
    let h = "";
    switch (x.t) {
      case "p": h = `<p${id}>${x.html}</p>`; break;
      /* Section heading inside a lesson: id = its anchor (an old lesson id: /…/<target>/#<old id> lands here), else its key k */
      case "h": h = `<h2 class="ac-bh" id="${esc(x.anchor || x.k)}">${x.html}</h2>`; break;
      case "draft": h = `<div class="ac-draft"${id}><div class="ac-tag">Draft · ${esc(x.role || "")} · ${esc(x.from || "")}</div><p>${x.html || ""}</p></div>`; break; // preview builds only
      case "steps": h = Array.isArray(x.html) ? `<ol class="ac-steps"${id}>${x.html.map(s => `<li>${s}</li>`).join("")}</ol>` : `<div class="ac-steps"${id}>${x.html}</div>`; break;
      case "tip": h = `<aside class="ac-tip"${id}><b>💡 ${t("tip")}</b> ${x.html}</aside>`; break;
      case "warn": h = `<aside class="ac-warn" role="note"${id}><b>⚠ ${t("warn")}</b> ${x.html}</aside>`; break;
      case "compare": { const col = (d, html) => `<div class="ac-col ac-disc-${d}"><div class="ac-col-h">${discName(d)}</div>${html || ""}</div>`;
        const H = x.html && typeof x.html === "object" ? x.html : { sporting: x.sporting || "", compak: x.compak || "" };
        const side = d => S.disc !== "both" && S.disc !== d ? `<details class="ac-other"><summary><b class="ac-other-d">${discName(d)}</b> · ${esc(foldPrev({ html: H[d] }))}</summary>${col(d, H[d])}</details>` : col(d, H[d]);
        h = `<div class="ac-compare"${id}>${side("sporting")}${side("compak")}</div>`; break; }
      case "rule": { const ref = x.rule_ref ? String(x.rule_ref).split(":") : null, rr = ref && (D.rule_refs || []).find(r => r.book === ref[0] && r.id === ref[1]);
        const link = ref ? `<a class="ac-rule-ref" href="${esc(fixUrl(rr && rr.url ? rr.url : rulesUrl(ref[0], ref[1])))}">${t("rules_where")}: ${esc(rr && rr.label ? rr.label : ref[1])} →</a>` : "";
        h = `<div class="ac-rule ac-disc-${esc(x.disc || "both")}"${id}><div class="ac-col-h">${discName(x.disc)}</div><p>${x.html}</p>${link}</div>`; break; }
      case "law": h = `<div class="ac-law"${id}>${x.html}<p class="ac-muted ac-small">${t("laws_disclaimer")}</p></div>`; break;
      case "fact": h = `<div class="ac-fact"${id}>${x.html}</div>`; break;
      case "evidence": return ""; // attached to the block it is for (see ev)
      case "sim": h = simHero(x, id); if (!h) return ""; break; // the lesson's animation, big (see simHero)
      case "figure": h = `<figure class="ac-figure"${id}>${x.html}</figure>`; break;
      default: h = x.html && typeof x.html === "string" ? `<p${id}>${x.html}</p>` : ""; // unknown type from a newer build: show its text
    }
    /* A stale critical paragraph (rules, safety, anti-doping) comes in English with "Переклад оновлюється" (SCHEMA.md §5) */
    if (x.updating || (x.lang && x.lang !== LANG)) h = `<div class="ac-upd" lang="${esc(x.lang || "en")}"><p class="ac-tag" lang="${LANG}">${t("translation_updating")}</p>${h}</div>`;
    /* "Моя дисципліна": a block of the other discipline is folded, never removed (design §7.3) */
    // Folded blocks come back as {fold, html, prev}; foldRuns() merges a run of them into ONE <details> whose summary says what is
    // inside: "Sporting™ · <start of the first block>… +N" (owner 10.2026: four identical "▶ Sporting™" lines told the reader nothing).
    if (x.t !== "compare" && (x.disc === "sporting" || x.disc === "compak") && S.disc !== "both" && S.disc !== x.disc)
      return { fold: x.disc, html: h + evs, prev: foldPrev(x) };
    return h + evs;
  }
  /* Start of a folded block for its summary: the block's own text (tip / warning with their label), cut at a word near 80 characters */
  function foldPrev(x) {
    const div = document.createElement("div"); div.innerHTML = Array.isArray(x.html) ? x.html.join(" ") : typeof x.html === "string" ? x.html : "";
    let s = ((x.t === "tip" ? t("tip") + " " : x.t === "warn" ? t("warn") + " " : "") + div.textContent).replace(/\s+/g, " ").trim();
    return s.length > 80 ? s.slice(0, 80).replace(/\s+\S*$/, "").replace(/[\s.,;:!?…–—-]+$/, "") + "…" : s;
  }
  /* Join rendered blocks; a run of folded blocks of the same discipline (empty strings between them do not break the run) becomes one
     <details class="ac-other">: the discipline, the start of the first block and "+N" for the others. Anchors inside still work:
     render() opens the <details> that holds the #anchor before scrolling to it. */
  function foldRuns(parts) {
    let out = "", run = null;
    const flush = () => { if (!run) return; const n = run.items.length;
      out += `<details class="ac-other"><summary><b class="ac-other-d">${discName(run.d)}</b> · ${esc(run.items[0].prev)}${n > 1 ? ` <span class="ac-other-n">+${n - 1}</span>` : ""}</summary>${run.items.map(p => p.html).join("")}</details>`;
      run = null; };
    for (const p of parts) {
      if (p && typeof p === "object") { if (run && run.d === p.fold) run.items.push(p); else { flush(); run = { d: p.fold, items: [p] }; } }
      else if (p) { flush(); out += p; }
    }
    flush(); return out;
  }
  /* The lesson's animation (owner's rule: animations prominent). The build puts it right after the first paragraph
     (scripts/build_academy.mjs heroOrder/heroOf) and sends hero, kind, heading and html (the one line of "what to watch").
     Here: the heading "▶ …" (x.heading, else ui anim_h_<kind>), the animation itself and the caption. docs/shared/sims.js gives it
     a big play / stop / replay button and a slow-motion toggle and plays it once by itself when half of its canvas is on the screen
     (never when the reader prefers reduced motion). It is mounted after render (AFTER); VIEW.simPlayed keeps a re-render (a quiz
     answer, the discipline switch) from playing it again — set when it played by itself, when the reader picked a tab and when the
     reader did anything inside it first (onUser: ▶, 🐢, "Your turn", a slider…), so a re-render never starts it over the reader's own
     run; VIEW.simTab keeps the open tab. */
  function simHero(x, id) {
    if (!x.sim || !SIM_TYPES.includes(x.sim.type)) return x.html ? `<p${id}>${x.html}</p>` : "";
    const k = x.k, kind = x.kind || (window.ClaySims && ClaySims.kind ? ClaySims.kind(x.sim) : "flight"), hid = "anim-" + esc(k);
    VIEW.sims = VIEW.sims || {}; VIEW.sims[k] = x.sim; VIEW.simPlayed = VIEW.simPlayed || {}; VIEW.simTab = VIEW.simTab || {};
    after(() => { const host = $("sim-" + k); if (!host || !window.ClaySims) return;
      ClaySims.mount(host, x.sim, { autoplay: VIEW.simPlayed[k] ? false : "view", onAutoplay: () => { VIEW.simPlayed[k] = 1; },
        onUser: () => { VIEW.simPlayed[k] = 1; }, tab: VIEW.simTab[k], onTab: tb => { VIEW.simTab[k] = tb; VIEW.simPlayed[k] = 1; } }); });
    const cap = x.html || (U["anim_w_" + kind] != null ? t("anim_w_" + kind) : "");
    return `<figure class="ac-anim"${id} aria-labelledby="${hid}"><p class="ac-anim-h" id="${hid}"><span aria-hidden="true">▶</span> ${esc(x.heading || u("anim_h_" + kind))}</p>
      <div class="ac-sim-host" id="sim-${esc(k)}"></div>${cap ? `<figcaption class="ac-anim-w">${cap}</figcaption>` : ""}</figure>`;
  }
  /* The lesson's big animation: the block the build marked as hero (else the first animation the app can draw). */
  const heroBlock = body => body.find(x => x.t === "sim" && x.hero && x.sim && SIM_TYPES.includes(x.sim.type))
    || body.find(x => x.t === "sim" && x.sim && SIM_TYPES.includes(x.sim.type)) || null;
  /* Phone (≤ 560 px): above the first paragraph there are the project bar, the header, crumbs, the title, the summary and the
     discipline switch, so an animation after the first paragraph was never on the first screen (audit: 0 of 24 lessons at 375 × 812).
     There it moves up to just before the first paragraph, i.e. right after the summary. Wider screens keep the build's order. */
  const narrow = () => { try { return matchMedia("(max-width: 560px)").matches; } catch (e) { return false; } };
  function heroUp(body, hero) {
    const i = hero ? body.indexOf(hero) : -1, p = body.findIndex(x => x.t === "p");
    if (i < 0 || p < 0 || i < p) return body;
    const out = body.slice(); out.splice(i, 1); out.splice(p, 0, hero); return out;
  }
  /* No lesson data (offline, a failed request): the static page stays and its animation (figure.st-anim > div.st-sim[data-clay-sim],
     written by scripts/build_academy.mjs) is mounted by ClaySims.auto() with the texts of docs/shared/sims-text-<lang>.js (the page
     language only; the all-language sims-text.js if that file cannot be loaded).
     Without JavaScript the empty figure is hidden by the static CSS of the build (:has(.st-sim:empty)). */
  function staticSims() {
    const app = $("app"); if (!app || !window.ClaySims || !app.querySelector("[data-clay-sim]")) return;
    const go = () => { try { ClaySims.auto(); } catch (e) {} };
    if (window.CLAYSIMS_TEXT && window.CLAYSIMS_TEXT[LANG]) go();
    else loadScript(SITE + `shared/sims-text-${LANG}.js`).catch(() => loadScript(SITE + "shared/sims-text.js")).then(go, go);
  }
  function phraseHtml(p, i) {
    return `<div class="ac-phrase"><div class="ac-phrase-h"><span class="ac-tag">${t("speaker_" + (p.speaker || "coach"))}</span>
      <q lang="en">${esc(p.en)}</q>${"speechSynthesis" in window ? `<button type="button" class="ac-btn ac-say" data-act="say" data-v="${i}" aria-label="${t("listen")}: ${esc(p.en)}">🔊 ${t("listen")}</button>` : ""}</div>
      <dl>${p.meaning ? `<dt>${t("meaning")}</dt><dd>${esc(p.meaning)}</dd>` : ""}${p.say ? `<dt>${t("say_it")}</dt><dd>${esc(p.say)}</dd>` : ""}</dl></div>`;
  }
  function notesHtml(notes, openForInterp) {
    if (!notes.length) return ""; const by = {}; notes.forEach(n => (by[n.for] = by[n.for] || []).push(n));
    return Object.entries(by).map(([f, list]) => `<details class="ac-panel ac-notes"${f === "interpreter" && openForInterp ? " open" : ""}><summary><h2>${t(f === "interpreter" ? "for_interpreter" : "for_" + f)}</h2></summary>
      <ul>${list.map(n => `<li>${n.html}</li>`).join("")}</ul></details>`).join("");
  }
  /* Quiz: 3 questions, options shuffled on screen (answer stored by option key, audit R-05), explanation after each answer. */
  function quizHtml(id, D) {
    const qs = D.quiz || [];
    if (!qs.length) return done(id) ? `<p class="ac-ok">✓ ${t("lesson_done")}</p>` : `<p><button type="button" class="ac-btn primary" data-act="markdone">${t("mark_done")}</button></p>`;
    VIEW.order = VIEW.order || {}; VIEW.ans = VIEW.ans || {};
    const html = qs.map((q, qi) => { const ord = VIEW.order[q.k] = VIEW.order[q.k] || shuffle(q.options.map(o => o.k)), a = VIEW.ans[q.k];
      return `<fieldset class="ac-q"><legend>${qi + 1}. ${esc(q.q)}</legend><div class="ac-opts">${ord.map(k => { const o = q.options.find(x => x.k === k);
        const cls = a == null ? "" : k === q.correct ? " right" : k === a ? " wrong" : "";
        return `<button type="button" class="ac-opt${cls}" data-act="ans" data-q="${esc(q.k)}" data-v="${esc(k)}"${a != null ? ' aria-disabled="true"' : ""} aria-pressed="${a === k}">${esc(o ? o.text : k)}</button>`; }).join("")}</div>
        <div class="ac-explain ac-explain-q" aria-live="polite">${a != null ? `${VIEW.lastQ === q.k ? dogFor(a === q.correct, { size: 66, anim: VIEW.dogAnim === q.k, cls: "ac-mascot-ex" }) : ""}<b>${a === q.correct ? t("correct") : t("wrong")}</b> ${esc(q.explain || "")}${q.rule_ref ? ` <a href="${esc(rulesUrl(...String(q.rule_ref).split(":")))}">${t("rules_where")} →</a>` : ""}` : ""}</div></fieldset>`; }).join("");
    const all = qs.every(q => VIEW.ans[q.k] != null), score = qs.filter(q => VIEW.ans[q.k] === q.correct).length;
    if (VIEW.dogAnim) after(() => { VIEW.dogAnim = null; }); // the dog of the last answer moves once (onAnswer), then stays still
    return html + (all ? `<p class="ac-qres"><b>${t("quiz_score", { n: score, t: qs.length })}</b> <button type="button" class="ac-btn" data-act="quizagain">${t("quiz_again")}</button></p>`
      : done(id) ? `<p class="ac-muted">✓ ${t("lesson_done")} · ${t("quiz_best", { n: S.done[id].q, t: qs.length })}</p>` : "");
  }
  function viewUntranslated(c) {
    setHead({ title: `${c.title} — ${u("academy_name")}`, desc: c.summary || "", index: false });
    const alts = altLangs(c);
    return `${crumbs([home(), { label: c.title }])}<header class="ac-head"><h1 tabindex="-1">${esc(c.title)}</h1></header>
      <p class="ac-note">${t(c.status === "draft" ? "draft_soon_p" : "untranslated_h")}</p>
      ${alts.length ? `<p>${t("untranslated_p")}</p><ul class="ac-chips">${alts.map(l => `<li><a class="ac-chip" href="${href(c.id + "/", l)}" hreflang="${l}" lang="${l}">${LANG_NAMES[l]}</a></li>`).join("")}</ul>` : ""}
      <p><a class="ac-btn" href="${href(`topics/${c.block}/`)}" data-nav>← ${esc((blockById(c.block) || {}).title || u("topics"))}</a></p>`;
  }

  /* ---------- 8.5 Route exam (noindex) ---------- */
  function viewExam(id) {
    const r = routeById(id); if (!r) return viewNotFound();
    const cfg = r.certificate && r.certificate.exam ? r.certificate.exam : r.badge_only && r.badge_only.quiz; if (!cfg) return viewNotFound();
    const st = P.routeStatus(S, CAT, r, TRAINER), E = VIEW.exam;
    setHead({ title: `${u("route_exam")}: ${r.title} — ${u("academy_name")}`, desc: r.for, index: false });
    const head = `${crumbs([home(), { label: r.title, url: pageLink(r, `routes/${r.id}/`).url }, { label: u("route_exam") }])}<header class="ac-head"><div class="ac-eyebrow">${t("route_exam")}</div><h1 tabindex="-1">${esc(r.title)}</h1>
      <p class="ac-meta">${plural("n_questions", cfg.n)} · ${t("exam_pass_mark", { p: cfg.pass_pct })}</p></header>`;
    if (!st.lessonsOk && !st.exam) return `${head}<p class="ac-note">${t("exam_locked", { d: st.done, t: st.total })}</p><p><a class="ac-btn primary" href="${pageLink(r, `routes/${r.id}/`).url}" data-nav>${t("to_route")}</a></p>`;
    if (!E) return `${head}${st.exam ? `<p class="ac-ok">✓ ${t("exam_passed", { score: S.routes[r.id].exam.score })}</p>` : ""}<p>${t("exam_intro")}</p><p><button type="button" class="ac-btn primary" data-act="examstart" data-v="${esc(r.id)}">${t("exam_start")}</button></p>`;
    if (E.loading) return `${head}<p class="ac-muted" aria-busy="true">${t("loading")}</p>`;
    if (E.error) return `${head}<p class="ac-note">${t("data_error")}</p>`;
    if (E.i < E.qs.length) { const q = E.qs[E.i], a = E.ans[E.i];
      return `${head}${bar(E.i, E.qs.length, u("route_exam"))}<fieldset class="ac-q"><legend>${t("question")} ${E.i + 1} ${t("of")} ${E.qs.length}. ${esc(q.q)}</legend>
        <div class="ac-opts">${E.ord[E.i].map(k => `<button type="button" class="ac-opt${a === k ? " picked" : ""}" data-act="exans" data-v="${esc(k)}" aria-pressed="${a === k}">${esc((q.options.find(o => o.k === k) || {}).text || k)}</button>`).join("")}</div></fieldset>
        <p><button type="button" class="ac-btn primary" data-act="exnext"${a == null ? " disabled" : ""}>${E.i + 1 < E.qs.length ? t("next") : t("exam_finish")} →</button></p>`; }
    const ok = E.qs.filter((q, i) => E.ans[i] === q.correct).length, score = Math.round(ok / E.qs.length * 100), pass = score >= cfg.pass_pct;
    const wrong = E.qs.map((q, i) => ({ q, a: E.ans[i] })).filter(x => x.a !== x.q.correct);
    return `${head}<div class="ac-result ${pass ? "pass" : "fail"}">${dogFor(pass, { size: 84 })}<div class="ac-score">${ok} / ${E.qs.length}</div><p>${pass ? t("exam_passed", { score }) : t("exam_failed", { score, p: cfg.pass_pct })}</p></div>
      ${wrong.length ? `<h2>${t("exam_review")}</h2>${wrong.map(x => `<div class="ac-q is-review"><p><b>${esc(x.q.q)}</b></p><p class="ac-muted">${t("exam_your")}: ${esc((x.q.options.find(o => o.k === x.a) || {}).text || "—")}</p><p class="ac-ok">✓ ${esc((x.q.options.find(o => o.k === x.q.correct) || {}).text || "")}</p><p>${esc(x.q.explain || "")}</p>${x.q.lesson && L(x.q.lesson) && lessonHref(x.q.lesson) ? `<p><a href="${lessonHref(x.q.lesson).url}" data-nav>${esc(L(x.q.lesson).title)} →</a></p>` : ""}</div>`).join("")}` : ""}
      <p><a class="ac-btn primary" href="${pageLink(r, `routes/${r.id}/`).url}#certificate" data-nav>${t("to_route")}</a> <button type="button" class="ac-btn" data-act="examstart" data-v="${esc(r.id)}">${t("play_again")}</button></p>`;
  }
  async function startExam(rid) {
    const r = routeById(rid), cfg = r.certificate && r.certificate.exam ? r.certificate.exam : r.badge_only.quiz;
    VIEW.exam = { loading: true }; rerender();
    try { const bank = await getJSON(`${DATA}${LANG}/exams/${rid}.json`), all = (bank.questions || []).filter(q => q.options && q.options.length > 1).map(q => plainQuiz(q));
      let pool = S.disc === "both" ? all : all.filter(q => !q.disc || q.disc === "both" || q.disc === S.disc); if (pool.length < cfg.n) pool = all;
      const qs = shuffle(pool).slice(0, Math.min(cfg.n, pool.length));
      VIEW.exam = { qs, ord: qs.map(q => shuffle(q.options.map(o => o.k))), ans: {}, i: 0, rid }; }
    catch (e) { VIEW.exam = { error: true }; }
    rerender(); focusMain();
  }
  function finishExam() {
    const E = VIEW.exam, r = routeById(E.rid), cfg = r.certificate && r.certificate.exam ? r.certificate.exam : r.badge_only.quiz;
    const ok = E.qs.filter((q, i) => E.ans[i] === q.correct).length, score = Math.round(ok / E.qs.length * 100), x0 = xp().total;
    const R = S.routes[r.id] = S.routes[r.id] || {};
    if (!R.exam || R.exam.score < score) R.exam = { score, date: today() };
    stat(score >= cfg.pass_pct ? "exam_pass" : "exam_fail", `${r.id}:${score}`);
    const res = refreshProgress(), gain = xp().total - x0; if (gain > 0) toast(u("xp_gain", { n: gain }));
    celebrate(res); if (score >= cfg.pass_pct && P.routeStatus(S, CAT, r, TRAINER).complete && window.ClayNav) ClayNav.clearResume("learn");
  }

  /* ---------- 8.6 Practice hub and games ---------- */
  function viewPractice() {
    setHead({ title: `${u("practice")} — ${u("academy_name")}`, desc: u("practice_lead"), index: true, langs: LANGS });
    const certs = routesSorted().filter(r => (S.routes[r.id] || {}).cert);
    return `${langBanner()}${crumbs([home(), { label: u("practice") }])}<header class="ac-head"><h1 tabindex="-1">${t("practice")}</h1><p class="ac-lead">${t("practice_lead")}</p></header>
      <div class="ac-grid ac-grid-games">${(CAT.practice || []).map(gameCard).join("")}</div>
      <section aria-labelledby="h-rex"><h2 id="h-rex">${t("route_exams")}</h2><ul class="ac-lessons">${routesSorted().filter(r => (r.certificate && r.certificate.exam) || r.badge_only).map(r => { const st = P.routeStatus(S, CAT, r, TRAINER);
        return `<li><a class="ac-les${st.exam ? " is-done" : ""}" href="${href(`routes/${r.id}/exam/`)}" data-nav><span class="ac-ck" aria-hidden="true">${st.exam ? "✓" : icon(r.icon)}</span><span class="ac-les-t"><b>${esc(r.title)}</b><span class="ac-les-m">${st.lessonsOk || st.exam ? t("exam_open") : t("exam_locked_short", { d: st.done, t: st.total })}</span></span></a></li>`; }).join("")}</ul></section>
      <section aria-labelledby="h-certs"><h2 id="h-certs">${t("certificates")}</h2>${certs.length ? `<ul class="ac-chips">${certs.map(r => `<li><a class="ac-chip" href="${pageLink(r, `routes/${r.id}/`).url}#certificate" data-nav>🎓 ${esc(r.title)}</a></li>`).join("")}</ul>` : `<p class="ac-muted">${t("cert_none")}</p>`}</section>`;
  }
  function viewGame(id) {
    const g = gameById(id); if (!g) return viewNotFound();
    setHead({ title: `${gameTitle(g)} — ${u("practice")} — ${u("academy_name")}`, desc: gameDesc(g) || u("practice_lead"), index: g.index === "always", langs: LANGS });
    const head = `${crumbs([home(), { label: u("practice"), url: href("practice/") }, { label: gameTitle(g) }])}<header class="ac-head"><div class="ac-eyebrow"><span aria-hidden="true">${icon(g.id)}</span> ${t("practice")}</div><h1 tabindex="-1">${esc(gameTitle(g))}</h1>
      ${gameDesc(g) ? `<p class="ac-lead">${esc(gameDesc(g))}</p>` : ""}
      ${g.xp === false && (g.known_issues || []).length ? `<p class="ac-note">${t("practice_known_issue")}</p>` : ""}</header>`;
    if (g.external) return `${head}<p><a class="ac-btn primary" href="${esc(extUrl(g))}">🎯 ${esc(gameTitle(g))} →</a></p>${trainerStatus()}`;
    if (g.later) return `${head}<p class="ac-note">${t("practice_soon")}</p>`;
    after(() => { if (!GAMES[id]) return; if (!VIEW.statGame) { VIEW.statGame = 1; stat("game_start", id); } gameStart(g); GAMES[id]($("acGame"), g); });
    return `${head}<div id="acGame" class="ac-game-host"><p class="ac-muted" aria-busy="true">${t("loading")}</p></div>`;
  }
  function trainerStatus() { const tr = trainer(); if (!tr || !tr.stats) return "";
    return `<ul class="ac-reqs">${["sporting", "compak"].map(d => { const s = tr.stats[d]; return s ? `<li class="${P.trainerPass(tr, d) ? "ok" : ""}"><span aria-hidden="true">${P.trainerPass(tr, d) ? "✓" : "○"}</span> ${discName(d)}: ${t("trainer_best", { p: s.best || 0 })}${s.short_best != null && U.trainer_short_best != null ? " · " + t("trainer_short_best", { p: s.short_best }) : ""}</li>` : ""; }).join("")}</ul>`; }

  /* ---------- 8.7 Progress (noindex): XP, badges, certificates, name, transfer, reset ---------- */
  function viewProgress() {
    setHead({ title: `${u("progress")} — ${u("academy_name")}`, desc: u("progress"), index: false });
    const x = xp(), lv = P.levelOf(x.total, CAT), earned = P.earnedBadges(S, CAT, TRAINER);
    const groups = [["misc", "badges_general"], ["practice", "practice"], ["route", "routes"], ["block", "topics"], ["stage", "badges_stages"], ["legacy", "badges_legacy"]];
    const badge = b => { const on = earned.has(b.id), wait = b.enabled_after && !P.gameOn(CAT, b.ref);
      return `<li class="ac-badge${on ? " is-on" : ""}" title="${esc(b.rule || "")}"><span aria-hidden="true">${on ? "🏅" : "○"}</span> ${esc(b.title)}${on && S.badges[b.id] ? ` <span class="ac-muted">${esc(S.badges[b.id])}</span>` : wait ? ` <span class="ac-muted">(${t("badge_after_fix")})</span>` : ""}<span class="ac-sr">${on ? t("badge_earned") : t("badge_locked")}</span></li>`; };
    const certs = routesSorted().filter(r => (S.routes[r.id] || {}).cert);
    return `${crumbs([home(), { label: u("progress") }])}<header class="ac-head"><h1 tabindex="-1">${t("progress")}</h1>
      <p class="ac-lead"><b>${esc(lv.level.title)}</b> · ${x.total} ${t("xp")}${lv.next ? ` · ${t("xp_to_next", { n: lv.next.min_xp - x.total, level: lv.next.title })}` : ""}</p>${bar(lv.pct, 100, u("level"))}
      <p class="ac-meta">${t("progress_lessons", { n: Object.keys(S.done).length, t: Object.keys(CAT.lessons).length })}</p>
      ${!Object.keys(S.done).length && !certs.length && !x.total ? `<div class="ac-empty">${dog("sleep", { size: 110 })}</div>` : ""}
      ${!PERSIST ? `<p class="ac-note">${t("progress_not_saved")}</p>` : ""}</header>
    <section aria-labelledby="h-certs"><h2 id="h-certs">🎓 ${t("certificates")}</h2>${certs.length ? certs.map(r => certHtml(r, S.routes[r.id].cert) + `<p><button type="button" class="ac-btn" data-act="printcert" data-v="${esc(r.id)}">🖨 ${t("cert_print")}</button></p>`).join("") : `<p class="ac-muted">${t("cert_none")}</p>`}
      <p id="name"><label for="acName"><b>${t("cert_name")}</b></label><br><input id="acName" type="text" maxlength="80" autocomplete="name" value="${esc(S.name)}"> <button type="button" class="ac-btn" data-act="savename">${t("save")}</button><br><span class="ac-muted ac-small">${t("name_device_only")}</span></p></section>
    <section aria-labelledby="h-badges"><h2 id="h-badges">🏅 ${t("badges")} <span class="ac-muted">${[...earned].length}/${(CAT.badges || []).length}</span></h2>
      ${groups.map(([k, title]) => { const list = (CAT.badges || []).filter(b => b.kind === k); return list.length ? `<h3 class="ac-h3">${t(title)}</h3><ul class="ac-badges">${list.map(badge).join("")}</ul>` : ""; }).join("")}
      <p class="ac-muted ac-small">${t("no_streaks")}</p></section>
    <section aria-labelledby="h-tr"><h2 id="h-tr">${t("progress_transfer")}</h2><p>${t("transfer_d")}</p>
      <p><button type="button" class="ac-btn" data-act="export">${t("transfer_make")}</button></p><div id="acExport"></div>
      <p><label for="acImport">${t("import_paste")}</label><br><input id="acImport" type="text" inputmode="url" autocomplete="off"> <button type="button" class="ac-btn" data-act="import">${t("import_btn")}</button></p></section>
    <section aria-labelledby="h-reset"><h2 id="h-reset">${t("reset")}</h2><p class="ac-muted">${t("reset_d")}</p><p><button type="button" class="ac-btn ac-danger" data-act="reset">${t("reset")}</button></p></section>`;
  }
  function viewNotFound() { setHead({ title: `${u("not_found")} — ${u("academy_name")}`, index: false });
    return `<header class="ac-head"><h1 tabindex="-1">${t("not_found")}</h1></header><p><a class="ac-btn primary" href="${href("")}" data-nav>${t("back_academy")}</a></p>`; }

  /* ================================ 9. Practice games ================================ */
  /* Glossary on demand (term cards, search, flight names): the ONE term store of ClayArena, never copied into the Academy.
     Names and labels through docs/shared/terms.js (loaded here too when a page lacks it). */
  const GLO = { ready: false, p: null, T: {},
    load() { if (this.p) return this.p; const base = SITE + "glossary/data/";
      this.p = Promise.all([loadScript(base + "glossary.js"), loadScript(base + "learn_terms.js"), LANG !== "en" ? loadScript(base + `i18n/${LANG}.js`).catch(() => {}) : null,
        window.ClayTerms ? null : loadScript(SITE + "shared/terms.js").catch(() => {})])
        .then(() => { for (const x of [...((window.GLOSSARY || {}).terms || []), ...((window.GLOSSARY_LEARN || {}).terms || [])]) this.T[x.id] = this.T[x.id] || x; this.ready = true; })
        .catch(e => { this.p = null; throw e; }); return this.p; },
    i18n(id) { return ((window.GLOSSARY_I18N || {})[LANG] || { terms: {} }).terms[id] || null; },
    /* term(id, en): {id, en, local, label, raw, short, url}; en = the English to show (default the headword; an option passes its
       own English text), local = the local word to show in brackets ("" when it is the English word), raw = term_local as written. */
    term(id, en) { const x = this.T[id]; if (!x) return null; const o = this.i18n(id), CT = window.ClayTerms;
      const n = CT ? CT.of(x, o, LANG, { en }) : { en: en || x.display_term || x.term, local: "", label: en || x.display_term || x.term };
      const raw = CT ? CT.termLocal(x, o, LANG) : (o && o.term_local) || "";
      const short = LANG === "uk" ? x.short_uk : LANG === "en" ? x.short_en : (o && o.short) || x.short_en;
      const own = LANG === "uk" || LANG === "en" || !!(o && o.short); // audit G-14: pages exist only where the term is translated
      return { id, en: n.en, local: n.local, label: n.label, raw, short: short || "", url: own ? glossaryUrl(id) : glossaryUrl(id, "en") }; },
    label(id, en) { const x = this.term(id, en); return x ? x.label : en || id; },
    /* Matches the English name, the local name as written (term_local, also when the label shows it once: uk «батю» finds Battue),
       and the search aliases of the language ("alt" in docs/glossary/data/i18n/<lang>.js, e.g. uk «кролик» → rabbit, whose local
       name is «заєць»). Direct matches keep their order (by the position in the label); alias-only matches come last. */
    search(n) { const rank = x => { if (norm(x.en).includes(n) || norm(x.raw).includes(n)) { const i = norm(x.label).indexOf(n); return i < 0 ? 500 : i; }
        const o = this.i18n(x.id); return ((o && o.alt) || []).some(a => norm(a).includes(n)) ? 1e6 : null; };
      return Object.keys(this.T).map(id => this.term(id)).filter(Boolean).map(x => [x, rank(x)]).filter(([, r]) => r !== null)
        .sort((a, b) => a[1] - b[1]).map(([x]) => x); } };
  /* Data paths in the catalog ("data" of a lesson, "files") are relative to the catalog, or absolute URLs. */
  const dataUrl = d => /^https?:/i.test(d) ? fixUrl(d) : new URL(d, `${DATA}${LANG}/catalog.json`).href;
  /* Lesson data of many lessons (terms of done lessons, checklists): fetched in parallel, cached for the page's life. */
  const lessonData = id => getJSON(dataUrl(L(id).data));
  async function lessonsData(ids) { const out = await Promise.all(ids.filter(id => avail(id) && L(id).data).map(id => lessonData(id).then(d => [id, d]).catch(() => null))); return out.filter(Boolean); }
  const gameXP = g => g.xp !== false && !g.later;
  const xpCfg = () => (CAT.levels && CAT.levels.xp) || {};
  function answerXP(g, right) { const gain = P.gameAnswer(S, g.id, right, { xp: gameXP(g), per: xpCfg().game_correct || 5, cap: xpCfg().game_day_cap || 50 }); save(); if (gain) { toast(u("xp_gain", { n: gain })); renderTop(); } }
  function roundEnd(g, ok, n) { stat("game_end", n ? `${g.id}:${ok}/${n}` : g.id); P.gameRound(S, g.id, ok, n); const res = refreshProgress(); renderTop(); celebrate(res); }
  /* ---- A game round survives leaving the page (audit "newbie-practice-no-resume"), like a test of the rules trainer: a reader who
     follows "Де це в правилах" and comes back continues the same round. Kept per game for 24 h in localStorage
     "clayarena-academy-round" = {<game id>: {lang, ts, sig, k, ok, picked, view, items}} — only in the language it was played in;
     sig = the game's filters (discipline, topic, mode: another filter starts a new round), view = those filters to restore,
     k = current question, ok = right answers so far, picked = the answer to question k (null = not answered yet), items = the
     questions as built by the game (HTML, options, answer, explanation) with "sd", a descriptor of their animation
     ({flight: <ClaySims.FLIGHTS key>} | {mount: <sim>}), instead of the function "before". Term cards use the same entry with
     items = the card ids of the session, k = current card, flip = card turned, own = cards from the reader's lessons. The end of
     the round and "Ще раз" clear it. From the start of a game the project bar offers the way back (ClayNav.setResume, section "learn").
     Production: the same JSON in the user profile (or the session), never a server round-trip per answer. */
  const ROUNDS = "clayarena-academy-round";
  const rounds = {
    all() { try { return JSON.parse(localStorage.getItem(ROUNDS) || "{}") || {}; } catch (e) { return {}; } },
    get(id, sig) { const r = this.all()[id];
      return r && r.lang === LANG && Date.now() - r.ts < 864e5 && (sig == null || r.sig === sig) && Array.isArray(r.items) && r.k < r.items.length ? r : null; },
    set(id, v) { if (!PERSIST) return; try { const a = this.all(); a[id] = Object.assign({ lang: LANG, ts: Date.now() }, v); localStorage.setItem(ROUNDS, JSON.stringify(a)); } catch (e) {} },
    clear(id) { try { const a = this.all(); if (a[id]) { delete a[id]; localStorage.setItem(ROUNDS, JSON.stringify(a)); } } catch (e) {} } };
  /* interface strings added for the navigation (content/academy/ui/<lang>.json "nav_*"); a build without them shows the fallback */
  const un = (k, fb, vars) => (U[k] != null ? u(k, vars) : fb);
  const simBefore = sd => !sd || !window.ClaySims ? null
    : sd.flight ? box => { box.innerHTML = `<button type="button" class="ac-btn">▶ ${t("animation_show")}</button>`; const go = () => ClaySims.flightSim(box, sd.flight, { hideName: true }); if (reduceMotion()) box.firstChild.onclick = go; else go(); }
    : sd.mount ? box => { box.innerHTML = `<button type="button" class="ac-btn">▶ ${t("animation_show")}</button>`; box.firstChild.onclick = () => ClaySims.mount(box, sd.mount); } : null;
  const gameResume = (g, k, n) => { if (window.ClayNav) ClayNav.setResume({ section: "learn", label: `${u("academy_name")} · ${gameTitle(g)}${n ? ` · ${u("question")} ${k + 1}/${n}` : ""}`, url: location.href.replace(/#.*$/, "") }); };
  /* Start of a game page: restore the filters of a saved round (so the game rebuilds the same round) and set the way back. */
  function gameStart(g) { const r = rounds.get(g.id); if (r && r.view) Object.assign(VIEW, r.view); gameResume(g, 0, 0); }
  /* Generic multiple-choice round: items [{q (html), options [text], answer index, why (html), before?(host), sd?}];
     opts {again, sig, view}: see "rounds" above. */
  function mcRound(host, g, items, opts = {}) {
    const sig = opts.sig == null ? "" : String(opts.sig), sv = rounds.get(g.id, sig);
    if (sv) { items = sv.items.map(it => Object.assign({}, it, { before: simBefore(it.sd) })); if (sv.k || sv.picked != null) toast(un("nav_round_resumed", `${u("question")} ${sv.k + 1} ${u("of")} ${items.length}`, { n: sv.k + 1, t: items.length })); }
    let k = sv ? sv.k : 0, ok = sv ? sv.ok : 0, picked = sv && sv.picked != null ? sv.picked : null;
    delete host.dataset.locked;
    const keep = () => rounds.set(g.id, { sig, k, ok, picked, view: opts.view || null,
      items: items.map(it => ({ q: it.q, options: it.options, answer: it.answer, why: it.why || "", sd: it.sd || null })) });
    /* show the answer j to question k; fresh = given just now (counts, XP, saved), else restored from the saved round */
    const reveal = (b, j, fresh) => { const it = items[k], right = j === it.answer; host.dataset.locked = "1";
      if (fresh) { if (right) ok++; answerXP(g, right); picked = j; keep(); }
      host.querySelectorAll(".ac-opt").forEach(x => { x.setAttribute("aria-disabled", "true"); if (+x.dataset.j === it.answer) x.classList.add("right"); }); if (!right && b) b.classList.add("wrong");
      host.querySelector(".ac-explain").innerHTML = `${dogOk(g) ? dogFor(right, { size: 66, anim: fresh, cls: "ac-mascot-ex" }) : ""}<b>${right ? t("correct") : t("wrong")}</b> ${it.why || ""}<p><button type="button" class="ac-btn primary" data-k="next">${k + 1 < items.length ? t("next") : t("game_finish")} →</button></p>`;
      const nb = host.querySelector('[data-k="next"]'); if (fresh) nb.focus();
      nb.onclick = () => { delete host.dataset.locked; try { ClaySims.stopSims(); } catch (e) {} k++; picked = null; if (k < items.length) { keep(); draw(); } else end(); }; };
    const draw = () => { const it = items[k]; gameResume(g, k, items.length);
      host.innerHTML = `${bar(k, items.length, g.title)}<div class="ac-q"><p class="ac-meta">${t("question")} ${k + 1} ${t("of")} ${items.length}</p>${it.before ? '<div class="ac-qsim"></div>' : ""}<p class="ac-qtext">${it.q}</p>
        <div class="ac-opts">${it.options.map((o, j) => `<button type="button" class="ac-opt" data-j="${j}">${esc(o)}</button>`).join("")}</div><div class="ac-explain" aria-live="polite"></div></div>`;
      if (it.before) it.before(host.querySelector(".ac-qsim"));
      host.querySelectorAll(".ac-opt").forEach(b => b.onclick = () => { if (host.dataset.locked) return; reveal(b, +b.dataset.j, true); });
      if (picked != null) reveal(host.querySelector(`.ac-opt[data-j="${picked}"]`), picked, false);
    };
    const end = () => { rounds.clear(g.id); if (window.ClayNav) ClayNav.clearResume("learn"); roundEnd(g, ok, items.length);
      const passed = ok / items.length >= .8; // same mark as the green result box
      host.innerHTML = `<div class="ac-result ${passed ? "pass" : ""}">${dogOk(g) ? dogFor(passed, { size: 84 }) : ""}<div class="ac-score">${ok} / ${items.length}</div></div><p><button type="button" class="ac-btn primary" data-k="again">${t("play_again")}</button> <a class="ac-btn" href="${href("practice/")}" data-nav>${t("practice")}</a></p>`;
      host.querySelector('[data-k="again"]').onclick = () => { rounds.clear(g.id); (opts.again || (() => GAMES[g.id](host, g)))(); }; };
    if (!items.length) { host.innerHTML = `<p class="ac-note">${t("game_need_more")}</p>`; return; }
    keep(); draw();
  }
  /* Texts and term names of the animations: the lesson's own terms (data terms[]), else ui.json "terms" (every term sims.js names:
     flights, lead-lab methods, pairs, scene tabs), else the glossary when it is loaded. sims.js labels them with docs/shared/terms.js. */
  function simsConfig(termsList) {
    if (!window.ClaySims) return;
    const tm = {}; for (const x of termsList || []) tm[x.id] = x;
    ClaySims.config({ t: k => U[k], term: id => { const x = tm[id] || UT[id] || (GLO.ready && GLO.term(id)); return x ? { en: x.en, local: LANG === "en" ? "" : x.local || "" } : null; }, onHit: null });
  }
  /* Block filter for phrase games: lessons of one block (default "Мова стенду"), loaded on demand. */
  function blockFilter(sel) { return `<label class="ac-inline">${t("filter_block")} <select data-k="block">${blocksSorted().map(b => `<option value="${b.id}"${b.id === sel ? " selected" : ""}>${esc(b.title)}</option>`).join("")}</select></label>`; }
  /* Phrases of one block: from the phrase index phrases.json (SCHEMA.md §8d: ONE request for the whole language, cached), in block
     and lesson order. Fallback for a server without the index: the lesson files of the block (one request per lesson). */
  async function phrasesOf(blockId) {
    const b = blockById(blockId); if (!b) return [];
    const ids = P.blockLessons(b), inBlock = new Set(ids);
    try { const ix = await getJSON(dataUrl((CAT.files && CAT.files.phrases) || "phrases.json"));
      if (ix && Array.isArray(ix.phrases)) return ix.phrases.filter(p => (p.block ? p.block === blockId : inBlock.has(p.lesson)) && avail(p.lesson)).map(p => Object.assign({}, p, { meaning: plainTok(p.meaning), say: plainTok(p.say) })).filter(p => p.en && p.meaning); }
    catch (e) {}
    const data = await lessonsData(ids);
    return data.flatMap(([id, d]) => (d.phrases || []).map(p => Object.assign({ lesson: id }, p))).filter(p => p.en && p.meaning); }
  const GAMES = {
    /* Lead lab (sims.js leadLab). No XP while practice.json says xp:false (S-01 …). Each method hit is remembered for "Чотири методи". */
    "lead-lab"(host, g) { if (!window.ClaySims) { host.innerHTML = `<p class="ac-note">${t("data_error")}</p>`; return; }
      /* After each hit of "Your turn" (sims.js calls onHit only for hits, right after it has written the result line; a miss shows
         nothing) a small "happy" dog with "Good shot!" at the start of that result line ([data-k="out"]), floated right. The next run
         clears the line, so the dog goes with it. Review 08.10.2026: as a sticky overlay at the bottom right it covered the label of
         the "Your turn" button on a 375 px phone for 3.5 s, just when the learner looks for the next action. */
      host.innerHTML = '<div class="ac-labhost"></div>'; simsConfig([]);
      ClaySims.config({ t: k => U[k], onHit: info => { const m = info && info.method; if (!m) return;
        const G = S.games[g.id] = S.games[g.id] || { best: 0, best_pct: 0, correct: 0, plays: 0, xp: 0, day: today(), xp_day: 0 };
        G.methods = G.methods || {}; const fresh = !G.methods[m]; G.methods[m] = 1; answerXP(g, fresh); refreshProgress();
        const out = host.querySelector('[data-k="out"]'); if (out && dogOk(g)) out.insertAdjacentHTML("afterbegin", dog("happy", { bubble: GOOD, size: 56, cls: "ac-mascot-ex" })); } });
      ClaySims.leadLab(host.firstChild, "maintained", { focus: "perceived-vs-actual" }); },
    /* Name the flight: 10 animated presentations, 4 names each (badge "10/10"). */
    async "name-the-flight"(host, g) { if (!window.ClaySims) { host.innerHTML = `<p class="ac-note">${t("data_error")}</p>`; return; }
      await GLO.load().catch(() => {}); simsConfig([]);
      // answers: the term label of each flight ("Crosser (поперечна мішень)", English only in English), docs/shared/terms.js
      const F = ClaySims.FLIGHTS, keys = Object.keys(F), name = k => GLO.ready ? GLO.label(F[k].term, null) : (ClaySims.NAMES || {})[k] || k;
      const names = [...new Set(keys.map(name))];
      const items = shuffle(keys).slice(0, 10).map(k => { const right = name(k), opts = shuffle([right, ...shuffle(names.filter(n => n !== right)).slice(0, 3)]);
        const x = GLO.ready && GLO.term(F[k].term);
        return { q: t("which_flight"), options: opts, answer: opts.indexOf(right), why: x ? esc(x.short) : "", sd: { flight: k }, before: box => { box.innerHTML = `<button type="button" class="ac-btn" data-k="launch">▶ ${t("animation_show")}</button>`;
          const go = () => { ClaySims.flightSim(box, k, { hideName: true }); }; if (reduceMotion()) box.firstChild.onclick = go; else go(); } }; });
      mcRound(host, g, items, { sig: "" }); },
    /* Understand / translate the coach: phrases of the lessons of one block; "meaning" (shooter) or "translate" (interpreter). */
    async "translate-the-coach"(host, g) {
      const sel = VIEW.block || "stand-talk", mode = LANG === "en" ? "meaning" : VIEW.mode || (S.routes.current === "interpreter" ? "translate" : "meaning");
      host.innerHTML = `<div class="ac-filters">${blockFilter(sel)}${LANG !== "en" ? `<label class="ac-inline">${t("game_mode")} <select data-k="mode"><option value="meaning"${mode === "meaning" ? " selected" : ""}>${t("mode_meaning")}</option><option value="translate"${mode === "translate" ? " selected" : ""}>${t("mode_translate")}</option></select></label>` : ""}</div><div class="ac-round"><p class="ac-muted" aria-busy="true">${t("loading")}</p></div>`;
      host.querySelector('[data-k="block"]').onchange = e => { VIEW.block = e.target.value; GAMES[g.id](host, g); };
      const ms = host.querySelector('[data-k="mode"]'); if (ms) ms.onchange = e => { VIEW.mode = e.target.value; GAMES[g.id](host, g); };
      const all = await phrasesOf(sel), field = mode === "translate" ? "say" : "meaning", pool = all.filter(p => p[field]);
      const vals = [...new Set(pool.map(p => p[field]))];
      const items = vals.length < 4 ? [] : shuffle(pool).slice(0, 10).map(p => { const opts = shuffle([p[field], ...shuffle(vals.filter(v => v !== p[field])).slice(0, 3)]);
        return { q: `<span class="ac-tag">${t("speaker_" + (p.speaker || "coach"))}</span> <q lang="en">${esc(p.en)}</q> ${"speechSynthesis" in window ? `<button type="button" class="ac-btn ac-say" data-say="${esc(p.en)}">🔊 ${t("listen")}</button>` : ""}<br>${t(mode === "translate" ? "which_say" : "which_meaning")}`,
          options: opts, answer: opts.indexOf(p[field]), why: esc(mode === "translate" ? p.meaning : p.say || "") }; });
      mcRound(host.querySelector(".ac-round"), g, items, { again: () => GAMES[g.id](host, g), sig: sel + ":" + mode, view: { block: sel, mode } }); },
    /* Referee's call: "decision" questions of the rules trainer bank (one bank for the trainer and the Academy), with its
       translations and animations; discipline filter. Options are shuffled by index (the i18n overlays keep the data order). */
    async "referees-call"(host, g) {
      const disc = VIEW.rdisc || S.disc;
      host.innerHTML = `<div class="ac-filters"><label class="ac-inline">${t("my_discipline")} <select data-k="disc">${["both", "sporting", "compak"].map(d => `<option value="${d}"${d === disc ? " selected" : ""}>${discName(d)}</option>`).join("")}</select></label></div><div class="ac-round"><p class="ac-muted" aria-busy="true">${t("loading")}</p></div>`;
      host.querySelector('[data-k="disc"]').onchange = e => { VIEW.rdisc = e.target.value; stat("disc", e.target.value); GAMES[g.id](host, g); };
      try { await loadScript(SITE + "rules/data/quiz-sporting.js"); await loadScript(SITE + "rules/data/quiz-compak.js"); } catch (e) { host.querySelector(".ac-round").innerHTML = `<p class="ac-note">${t("data_error")}</p>`; return; }
      let ov = { questions: {} }; if (!["uk", "en"].includes(LANG)) { try { ov = await getJSON(`${SITE}rules/data/i18n/quiz-${LANG}.json`); } catch (e) {} }
      const bank = (window.RULES_QUIZ || []).filter(b => disc === "both" || b.key === disc).flatMap(b => b.questions.filter(q => q.type === "decision").map(q => Object.assign({ book: b.key }, q)));
      const OQ = (ov && ov.questions) || {}, tr = (q, k) => q[k + "_" + LANG] || ((OQ[q.id] || {})[k === "q" ? "q" : "explain"]) || q[k + "_en"];
      await GLO.load().catch(() => {}); simsConfig([]);
      // an option that names a glossary term ("term", rules/QUIZ_SCHEMA.md) shows its label: "ZERO" → uk "Zero (промах)"
      const items = shuffle(bank).slice(0, 10).map(q => { const ord = shuffle(q.options.map((o, i) => i)), txt = i => (q.options[i].term && GLO.ready && GLO.T[q.options[i].term] ? GLO.label(q.options[i].term, q.options[i].en) : null) || q.options[i][LANG] || ((OQ[q.id] || {}).options || [])[i] || q.options[i].en;
        const refs = (q.refs || []).map(id => { const ch = /^ch(\d+)/.exec(id); return `<a href="${rulesUrl(q.book, id)}">${discName(q.book)}${ch ? " · " + t("rule_chapter", { n: ch[1] }) : ""}</a>`; }).join(", ");
        return { q: `<span class="ac-chip ac-disc-${q.book}">${discName(q.book)}</span> ${esc(tr(q, "q"))}`, options: ord.map(txt), answer: ord.indexOf(q.answer),
          why: `${esc(tr(q, "explain"))}${refs ? `<br><span class="ac-muted">${t("rules_where")}:</span> ${refs}` : ""}`,
          sd: q.sim && SIM_TYPES.includes(q.sim.type) ? { mount: q.sim } : null, before: q.sim && SIM_TYPES.includes(q.sim.type) ? box => { box.innerHTML = `<button type="button" class="ac-btn">▶ ${t("animation_show")}</button>`; box.firstChild.onclick = () => ClaySims.mount(box, q.sim); } : null }; });
      mcRound(host.querySelector(".ac-round"), g, items, { again: () => GAMES[g.id](host, g), sig: disc, view: { rdisc: disc } }); },
    /* Term cards: Leitner boxes on this device (box 1 = every day … box 5 = every 16 days). Terms of the lessons done
       (else of all glossary terms); "50 термінів" = 50 cards in box 3 or higher.
       The session (12 card ids, current card k, card turned or not) is kept in the same "rounds" store as the quiz games
       (items = the card ids): a reader who opens "Сторінка в глосарії →" of a card and comes back by the project bar continues
       at the same card. The box/due date of each card is saved separately in S.cards (progress.js), as before. */
    async "term-cards"(host, g) {
      host.innerHTML = `<p class="ac-muted" aria-busy="true">${t("loading")}</p>`;
      try { await GLO.load(); } catch (e) { host.innerHTML = `<p class="ac-note">${t("data_error")}</p>`; return; }
      const learnt = Object.values(S.cards).filter(c => c.box >= 3).length, DAYS = [0, 1, 2, 4, 8, 16];
      const sv = rounds.get(g.id, "");
      let session, own, k = 0;
      if (sv) { session = sv.items.filter(id => typeof id === "string"); own = !!sv.own; k = Math.min(sv.k || 0, session.length);
        if (k || sv.flip) toast(un("nav_round_resumed", `${k + 1}/${session.length}`, { n: k + 1, t: session.length })); }
      else { const doneIds = Object.keys(S.done).filter(avail).slice(-40), data = await lessonsData(doneIds);
        let ids = [...new Set(data.flatMap(([, d]) => (d.terms || []).map(x => x.id)))].filter(id => GLO.T[id]); own = ids.length >= 8;
        if (!own) ids = Object.keys(GLO.T);
        const day = today(), due = ids.filter(id => S.cards[id] && S.cards[id].due <= day), fresh = shuffle(ids.filter(id => !S.cards[id]));
        session = shuffle(due).concat(fresh).slice(0, 12); }
      const keep = flip => rounds.set(g.id, { sig: "", k, flip: !!flip, own, items: session });
      const show = flip => { const id = session[k], x = GLO.term(id), c = S.cards[id];
        if (!x) { k++; return k < session.length ? show(false) : fin(); }
        keep(flip); gameResume(g, k, session.length);
        host.innerHTML = `<p class="ac-meta">${t(own ? "cards_source" : "cards_source_all")} · ${t("cards_learnt", { n: learnt })} · ${k + 1}/${session.length}${c ? ` · ${t("cards_box", { n: c.box })}` : ""}</p>
          <div class="ac-flash"><p class="ac-flash-en" lang="en">${esc(x.en)}</p>${"speechSynthesis" in window ? `<button type="button" class="ac-btn ac-say" data-say="${esc(x.en)}">🔊 ${t("listen")}</button>` : ""}
          ${flip ? `${x.local ? `<p class="ac-flash-local"><b>${esc(x.local)}</b></p>` : ""}<p>${esc(x.short)}</p><p><a href="${x.url}">${t("glossary_page")} →</a></p>
            <p><button type="button" class="ac-btn primary" data-k="know">✓ ${t("card_know")}</button> <button type="button" class="ac-btn" data-k="again">${t("card_again")}</button></p>`
          : `<p><button type="button" class="ac-btn primary" data-k="flip">${t("card_show")}</button></p>`}</div>`;
        const q = s => host.querySelector(`[data-k="${s}"]`);
        if (!flip) { q("flip").onclick = () => show(true); q("flip").focus(); return; }
        const grade = know => { const cur = S.cards[id] || { box: 0 }, box = know ? Math.min(5, cur.box + 1) : 1, d = new Date(); d.setDate(d.getDate() + (know ? DAYS[box] : 0));
          S.cards[id] = { box, due: P.today(d) }; answerXP(g, know); k++; if (k < session.length) show(false); else fin(); };
        q("know").onclick = () => grade(true); q("again").onclick = () => grade(false); q("know").focus(); };
      const fin = () => { rounds.clear(g.id); if (window.ClayNav) ClayNav.clearResume("learn"); roundEnd(g, 0, 0);
        host.innerHTML = `<div class="ac-empty">${dogOk(g) ? dog("happy", { size: 64 }) : ""}<p class="ac-ok">✓ ${t("cards_done")}</p></div><p><button type="button" class="ac-btn primary" data-k="more">${t("play_again")}</button></p>`; host.querySelector('[data-k="more"]').onclick = () => { rounds.clear(g.id); GAMES[g.id](host, g); }; };
      if (!session.length) { rounds.clear(g.id); host.innerHTML = `<p class="ac-ok">✓ ${t("cards_done")}</p>`; return; }
      show(!!(sv && sv.flip)); },
    /* Phrasebook: the phrases of one block as a list to listen to and print. No XP. */
    async phrasebook(host, g) { const sel = VIEW.block || "stand-talk";
      host.innerHTML = `<div class="ac-filters">${blockFilter(sel)} <button type="button" class="ac-btn" data-k="print">🖨 ${t("print")}</button></div><div class="ac-pb"><p class="ac-muted" aria-busy="true">${t("loading")}</p></div>`;
      host.querySelector('[data-k="block"]').onchange = e => { VIEW.block = e.target.value; GAMES[g.id](host, g); };
      const list = await phrasesOf(sel), box = host.querySelector(".ac-pb");
      VIEW.phr = list; const by = {}; list.forEach((p, i) => (by[p.lesson] = by[p.lesson] || []).push([p, i]));
      box.innerHTML = Object.keys(by).length ? Object.entries(by).map(([id, ps]) => `<h2 class="ac-h3">${esc(L(id).title)}</h2>${ps.map(([p, i]) => phraseHtml(p, i)).join("")}`).join("") : `<p class="ac-note">${t("game_need_more")}</p>`;
      host.querySelector('[data-k="print"]').onclick = () => printHtml(`<h1>${esc(g.title)} · ${esc((blockById(sel) || {}).title || "")}</h1>${box.innerHTML}`); },
  };

  /* ================================ 10. Printing (certificate, checklists, phrasebook) ================================ */
  function printHtml(html) { let el = $("acPrint"); if (!el) { el = document.createElement("div"); el.id = "acPrint"; document.body.appendChild(el); }
    el.innerHTML = html; document.body.classList.add("ac-printing");
    const done = () => { document.body.classList.remove("ac-printing"); el.innerHTML = ""; window.removeEventListener("afterprint", done); };
    window.addEventListener("afterprint", done); setTimeout(() => { try { window.print(); } catch (e) {} }, 50); }
  /* Route checklist: key points marked "checklist" in the route's lessons (the text is never written twice, design §2.2). */
  async function printChecklist(rid) { const r = routeById(rid); toast(u("loading"));
    const data = await lessonsData(required(r)), items = data.flatMap(([id, d]) => (d.key_points || []).filter(k => k.checklist).map(k => [id, k]));
    printHtml(`<h1>${esc(r.checklist.title)}</h1><p>${t("academy_name")} · ${t("route_title", { route: r.title })}</p><ul class="ac-check">${items.map(([id, k]) => `<li>☐ ${k.html} <small>(${esc(L(id).title)})</small></li>`).join("")}</ul><p class="ac-small">${t("cert_disclaimer")}</p>`); }

  /* ================================ 11. Speech (local voices only, audit W-08) ================================ */
  const localVoice = () => { try { return (speechSynthesis.getVoices() || []).some(v => v.localService && /^en/i.test(v.lang)); } catch (e) { return false; } };
  function say(text) { if (!("speechSynthesis" in window)) return; if (!localVoice()) { toast(u("no_local_voice")); return; } if (window.ClaySpeak) ClaySpeak(text, { rate: .95 }); }
  try { speechSynthesis.getVoices(); speechSynthesis.onvoiceschanged = () => {}; } catch (e) {}

  /* ================================ 12. Render & navigation ================================ */
  function focusMain() { const h = document.querySelector("#app h1"); if (h) { try { h.focus({ preventScroll: true }); } catch (e) { h.focus(); } } }
  async function render(opts = {}) {
    try { if (window.ClaySims) ClaySims.stopSims(); speechSynthesis.cancel(); } catch (e) {}
    AFTER = [];
    if (LOC.view === "lesson" && L(LOC.id) && avail(LOC.id) && !VIEW.data) {
      $("app").setAttribute("aria-busy", "true");
      try { VIEW.data = plainLesson(await lessonData(LOC.id)); } catch (e) { VIEW.data = null; const app = $("app"); app.removeAttribute("aria-busy");
        // first page of the visit: keep the static lesson the build wrote (text, quiz in <details>, its animation) under the notice
        if (!APP_DONE && app.querySelector(":scope > .st")) { if (!app.querySelector(".ac-data-err")) app.insertAdjacentHTML("afterbegin", `<p class="ac-note ac-data-err" role="alert">${t("data_error")}</p>`); staticSims(); return; }
        app.innerHTML = `<p class="ac-note">${t("data_error")}</p>`; return; }
      $("app").removeAttribute("aria-busy");
      simsConfig(VIEW.data.terms || []);
    }
    const html = LOC.view === "home" ? viewHome() : LOC.view === "block" ? viewBlock(LOC.id) : LOC.view === "route" ? viewRoute(LOC.id) : LOC.view === "exam" ? viewExam(LOC.id)
      : LOC.view === "lesson" ? viewLesson(LOC.id) : LOC.view === "practice" ? viewPractice() : LOC.view === "game" ? viewGame(LOC.id) : LOC.view === "progress" ? viewProgress() : viewNotFound();
    $("app").innerHTML = html; APP_DONE = true; fixLinks($("app"));
    renderTop(); renderFoot(); document.documentElement.lang = LANG;
    AFTER.forEach(fn => { try { fn(); } catch (e) { console.error(e); } });
    if (LOC.view === "lesson") lessonSideEffects();
    if (LOC.view === "home" && VIEW.q) { const r = $("acQR"); if (r) r.innerHTML = searchResults(VIEW.q); }
    if (opts.scroll !== false) { const h = decodeURIComponent(location.hash.slice(1)); const el = h && !h.startsWith("import=") && document.getElementById(h);
      if (el) { const d = el.closest("details"); if (d) d.open = true; el.scrollIntoView(); } else if (opts.top) window.scrollTo(0, 0); }
    if (opts.focus) { focusMain(); announce(document.title); }
  }
  const rerender = () => render({ scroll: false });
  /* External links get rel="noopener noreferrer", FITASC links also nofollow (CLAUDE.md); build links to the production site are
     rewritten to this site when previewed elsewhere. */
  function fixLinks(root) {
    root.querySelectorAll("img[src]").forEach(i => { const v = i.getAttribute("src"); if (v.startsWith(PROD_BASE) && SITE !== PROD_BASE) i.setAttribute("src", fixUrl(v)); });
    root.querySelectorAll("a[href]").forEach(a => { const h = a.getAttribute("href");
    if (h.startsWith(PROD_BASE) && SITE !== PROD_BASE) a.setAttribute("href", fixUrl(h));
    if (/^https?:/i.test(a.href) && !a.href.startsWith(SITE)) { const rel = new Set((a.rel || "").split(/\s+/).filter(Boolean)); rel.add("noopener"); rel.add("noreferrer");
      if (/(^|\.)fitasc\.com$/i.test(new URL(a.href).hostname)) rel.add("nofollow"); a.rel = [...rel].join(" "); } }); }
  function lessonSideEffects() {
    const c = L(LOC.id); if (!c || !avail(LOC.id)) return;
    S.last = LOC.id; const r = currentRoute();
    if (r) { const st = P.routeStatus(S, CAT, r, TRAINER);
      S.nav = st.lessonsOk ? null : { route: r.id, title: r.title, lang: LANG, d: st.done, t: st.total, url: pageLink(r, `routes/${r.id}/`).url }; }
    save();
    if (!window.ClayNav) return;
    const b = blockById(c.block), finished = r ? P.routeStatus(S, CAT, r, TRAINER).lessonsOk : b && P.blockDone(S, b);
    if (finished) ClayNav.clearResume("learn"); // audit S-07: nothing to come back to
    else ClayNav.setResume({ section: "learn", label: `${u("academy_name")} · ${c.title}`, url: location.href });
  }
  function go(url, { replace = false } = {}) {
    const v = parseLoc(url); if (v.lang !== LANG) { location.href = url; return; }
    try { history[replace ? "replaceState" : "pushState"](null, "", url); } catch (e) { location.href = url; return; }
    LOC = v; VIEW = {}; render({ top: true, focus: true });
  }
  window.addEventListener("popstate", () => { const v = parseLoc(location.href); if (v.lang !== LANG) { location.reload(); return; }
    const same = LOC && pathOf(v) === pathOf(LOC); LOC = v; if (!same) { VIEW = {}; render({ focus: true }); } else render({ scroll: true }); });

  /* ================================ 13. Events ================================ */
  document.addEventListener("click", e => {
    const a = e.target.closest("a[href]");
    if (a && a.dataset.route) { if (S.routes.current !== a.dataset.route) stat("route", a.dataset.route); S.routes.current = a.dataset.route; save(); }
    if (a && a.closest(".ac-langs, .ac-banner") && LANGS.includes(a.getAttribute("hreflang"))) { S.lang = a.getAttribute("hreflang"); save(); stat("lang", S.lang); visitorLang(S.lang); } // the reader chose a language
    if (a && a.hasAttribute("data-nav") && !e.defaultPrevented && e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey && !a.target) {
      const url = new URL(a.href, location.href);
      if (url.origin === location.origin && url.href.startsWith(SITE) && parseLoc(url.href).lang === LANG && /\/learn\//.test(url.pathname)) {
        if (url.pathname === location.pathname && url.hash) return; // in-page anchor: default behaviour
        e.preventDefault(); go(url.href); return; } }
    const b = e.target.closest("[data-act],[data-say]"); if (!b) return;
    if (b.dataset.say) { say(b.dataset.say); return; }
    if (b.getAttribute("aria-disabled") === "true") return;
    const act = b.dataset.act, v = b.dataset.v;
    if (act === "disc") { if (S.disc !== v) stat("disc", v); S.disc = v; save(); rerender(); const nb = document.querySelector(`[data-act="disc"][data-v="${v}"]`); if (nb) nb.focus(); return; }
    if (act === "langoff") { S.lang_hint_off = true; save(); b.closest(".ac-banner").remove(); return; }
    if (act === "langgo") { const sel = $("acLang"); if (sel) goLang(sel.value); return; }
    if (act === "setroute") { if (S.routes.current !== v) stat("route", v); S.routes.current = v; save(); rerender(); toast(u("route_current")); return; }
    if (act === "say") { const p = (VIEW.phr || [])[+v]; if (p) say(p.en); return; }
    if (act === "sim") { const sim = VIEW.sims && VIEW.sims[v], host = $("sim-" + v); if (sim && host && window.ClaySims) { b.remove(); ClaySims.mount(host, sim); } return; }
    if (act === "ans") { onAnswer(b.dataset.q, v); return; }
    if (act === "quizagain") { VIEW.ans = {}; VIEW.order = {}; VIEW.lastQ = VIEW.dogAnim = null; rerender(); const q = $("quiz"); if (q) q.scrollIntoView(); return; }
    if (act === "markdone") { finish(LOC.id, 0); rerender(); return; }
    if (act === "examstart") { startExam(v); return; }
    if (act === "exans") { VIEW.exam.ans[VIEW.exam.i] = v; rerender(); const n = document.querySelector('[data-act="exnext"]'); if (n) n.focus(); return; }
    if (act === "exnext") { VIEW.exam.i++; if (VIEW.exam.i >= VIEW.exam.qs.length) finishExam(); rerender(); focusMain(); window.scrollTo(0, 0); return; }
    if (act === "printcert") { const r = routeById(v); if (r && S.routes[v] && S.routes[v].cert) printHtml(certHtml(r, S.routes[v].cert)); return; }
    if (act === "checklist") { printChecklist(v).catch(() => toast(u("data_error"))); return; }
    if (act === "savename") { S.name = String($("acName").value || "").slice(0, 80); save(); toast(u("saved")); return; }
    if (act === "export") { P.exportCode(S).then(code => { const link = href("progress/") + "#import=" + code;
      $("acExport").innerHTML = `<p><input type="text" readonly value="${esc(link)}" id="acExpLink" aria-label="${t("progress_transfer")}"> <button type="button" class="ac-btn" data-act="copy">${t("transfer_copy")}</button></p>`; }); return; }
    if (act === "copy") { const i = $("acExpLink"); i.select(); try { navigator.clipboard.writeText(i.value).then(() => toast(u("copied")), () => document.execCommand("copy")); } catch (er) { try { document.execCommand("copy"); toast(u("copied")); } catch (e2) {} } return; }
    if (act === "import") { const val = String($("acImport").value || ""), m = /#import=([^\s]+)/.exec(val); doImport(m ? m[1] : val.trim()); return; }
    if (act === "reset") { if (!confirm(u("reset_confirm"))) return;
      P.reset(); S = P.normalize(null, LANG); S.migrated = { "clayarena-learn": today(), "clayarena-interpreter": today() }; save(); // old keys are not moved again after a reset
      if (window.ClayNav) ClayNav.clearResume("learn"); rerender(); toast(u("reset_done")); return; }
  });
  document.addEventListener("input", e => { if (e.target.id === "acQ") { VIEW.q = e.target.value; const r = $("acQR"); if (r) r.innerHTML = searchResults(VIEW.q);
      if (!GLO.ready && VIEW.q.trim().length >= 2) GLO.load().then(() => { const r2 = $("acQR"); if (r2) r2.innerHTML = searchResults(VIEW.q); }).catch(() => {}); } });
  document.addEventListener("change", e => { if (e.target.id === "acLang") langSelChange(e.target); });
  document.addEventListener("keydown", langSelKey);
  document.addEventListener("pointerdown", e => { if (e.target.id === "acLang") delete e.target.dataset.kbd; });
  document.addEventListener("focusin", e => { if (e.target.id === "acLang") delete e.target.dataset.kbd; });
  function onAnswer(qk, ok) {
    VIEW.ans = VIEW.ans || {}; if (VIEW.ans[qk] != null) return; VIEW.ans[qk] = ok;
    VIEW.lastQ = qk; VIEW.dogAnim = qk; // the mascot stands next to the explanation of THIS answer (quizHtml)
    const qs = (VIEW.data && VIEW.data.quiz) || [];
    if (qs.every(q => VIEW.ans[q.k] != null)) finish(LOC.id, qs.filter(q => VIEW.ans[q.k] === q.correct).length);
    rerender();
    const btn = document.querySelector(`[data-act="ans"][data-q="${CSS.escape(qk)}"][data-v="${CSS.escape(ok)}"]`); if (btn) btn.focus(); // keep the keyboard place
    const fs = btn && btn.closest(".ac-q"); if (fs) { const ex = fs.querySelector(".ac-explain"); if (ex) announce(plainText(ex)); } // without the dog's bubble
  }
  function finish(id, score) {
    const c = L(id), x0 = xp().total, res = P.finishLesson(S, id, score, c.rev), nq = ((VIEW.data && VIEW.data.quiz) || []).length;
    if (res.first) stat("lesson_done", id);
    if (nq) stat("quiz", `${id}:${score}/${nq}`);
    const pr = refreshProgress(), gain = xp().total - x0;
    if (res.first) toast(`${u("lesson_done")} · ${u("quiz_score", { n: score, t: ((VIEW.data && VIEW.data.quiz) || []).length || 0 })}${gain ? " · " + u("xp_gain", { n: gain }) : ""}`);
    else if (gain) toast(u("xp_gain", { n: gain }));
    celebrate(pr); lessonSideEffects(); renderTop();
  }
  async function doImport(code) {
    try { const s = await P.importCode(code); S = P.merge(S, s); refreshProgress(); toast(u("import_done")); rerender(); }
    catch (e) { toast(u("import_bad")); }
  }

  /* ================================ 14. Boot ================================ */
  const idMapUrl = () => (CAT && CAT.id_map ? fixUrl(CAT.id_map) : DATA + "id-map.json");
  async function boot() {
    LOC = parseLoc(location.href); LANG = LOC.lang;
    const q = LOC.query.get("lang");
    if (LOC.uk_prefix) { location.replace(href(pathOf(LOC), "uk") + location.hash); return; }       // /uk/learn/… is /learn/…
    if (q && LANGS.includes(q) && q !== LANG) { location.replace(href(pathOf(LOC), q) + location.hash); return; }
    const ld = P.load(LANG); S = ld.state; PERSIST = ld.persistent;
    document.documentElement.lang = LANG;
    /* catalog.json and ui.json (interface strings, SCHEMA.md §8) load together; an older build or an API that still puts "ui"
       inside the catalog works too. Without any strings the keys themselves are shown (visible, never an empty button). */
    let UIF = null;
    try { [CAT, UIF] = await Promise.all([getJSON(`${DATA}${LANG}/catalog.json`), getJSON(`${DATA}${LANG}/ui.json`).catch(() => null)]); }
    catch (e) { return bootFailed(); }
    if (!UIF && !CAT.ui && CAT.files && CAT.files.ui && dataUrl(CAT.files.ui) !== `${DATA}${LANG}/ui.json`) { try { UIF = await getJSON(dataUrl(CAT.files.ui)); } catch (e) {} }
    U = (UIF && UIF.ui) || CAT.ui || {}; UT = (UIF && UIF.terms) || {}; plainCatalog(CAT);
    /* Progress of the two old academies (design §7.8), once per device; the id map is fetched only when there is something to move. */
    const old = P.readOld();
    if (P.needsIdMap(S, old) || (old.resume && old.resume.section === "interpreter")) {
      let map = null; try { map = await getJSON(idMapUrl()); } catch (e) {}
      if (map || !P.needsIdMap(S, old)) { const m = P.migrate(S, old, map, new Set(Object.keys(CAT.lessons)));
        if (m.resume) P.store.set(P.OLD.resume, m.resume); if (m.changed) { refreshProgress(); toast(u("progress_moved")); } }
    }
    refreshProgress(); // S.lang is set only by the reader's own choice (switcher, footer, banner) or by the moved old progress
    /* Transfer link (#import=…): merged with the max rule, then the code is removed from the address bar. */
    const hm = /^#import=([A-Za-z0-9._-]+)/.exec(location.hash);
    if (hm) { try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {} await doImport(hm[1]); }
    /* Old hash links of the two old apps on the home page (/learn/#<lesson id>, /learn/#<module>; redirect group F). */
    if (LOC.view === "home" && /^#[a-z0-9-]+$/.test(location.hash) && !["topics", "h-who", "h-topics", "h-prac"].includes(location.hash.slice(1))) {
      const h = location.hash.slice(1); let map = null; try { map = await getJSON(idMapUrl()); } catch (e) {}
      const m = map && map.learn && map.learn[h];
      const target = m ? `${m.to}/` + (m.anchor ? "#" + m.anchor : "") : CAT.lessons[h] ? `${h}/` : map && map.modules && map.modules[h] ? map.modules[h].replace(/^([^#]+?)\/?(#|$)/, "$1/$2") : null;
      if (target) { const url = href(target); LOC = parseLoc(url); try { history.replaceState(null, "", url); } catch (e) {} }
    }
    if (LOC.hash === "topics" || LOC.hash === "routes") { try { history.replaceState(null, "", href("") + (LOC.hash === "topics" ? "#topics" : "#h-who")); } catch (e) {} LOC = parseLoc(location.href); }
    for (const [id, cls, role] of [["acLive", "ac-sr", null], ["acToast", "ac-toast", "status"]]) if (!$(id)) { // the page may not have them
      const d = document.createElement("div"); d.id = id; d.className = cls; d.setAttribute("aria-live", "polite"); if (role) d.setAttribute("role", role); document.body.appendChild(d); }
    if (!$("acTop")) { const h = document.createElement("header"); h.id = "acTop"; document.body.insertBefore(h, $("app")); }
    if (!$("acFoot")) { const f = document.createElement("footer"); f.id = "acFoot"; $("app").after(f); }
    document.body.classList.add("ac-ready");
    await render({ scroll: true });
  }
  /* Catalog strings are plain text with the tokens already rendered by the build (SCHEMA.md §8). If a token slipped through
     (an editor's new summary before a rebuild), show it as text instead of "{{tm:sporting}}" (never as HTML).
     A term token follows the term rule, step 2 (owner rule 08.10.2026; docs/shared/terms.js mention() — the same function the build
     uses for the pages): on a page in another language than English "<English> (<local form>)" at its first mention in the string,
     "<English>" later; English pages show the form. The English name comes from `terms` (the lesson data terms[]), ui.json "terms"
     or the glossary when it is loaded; without any of them, or without terms.js (an old cached page), the form as written. */
  function plainTok(s, terms) { if (typeof s !== "string" || s.indexOf("{{") < 0) return s; let seen = false;
    const CT = window.ClayTerms, sc = CT && CT.mention && CT.scope ? CT.scope() : null;
    const termOf = id => (Array.isArray(terms) ? terms : []).find(x => x && x.id === id) || UT[id] || (GLO.ready && GLO.term(id)) || null;
    return s.replace(/\{\{tm:(sporting|compak)\}\}/g, (m, d) => d === "compak" ? "Compak® Sporting" : seen ? "Sporting™" : (seen = true, "Parcours de Chasse – Sporting™"))
      .replace(/\{\{term:([a-z0-9-]+)(?:\|([^}|]*))?(?:\|([a-z]+))?\}\}/g, (m, id, form, flag, at, str) => { const x = termOf(id);
        if (!sc || !x || !x.en) return form || (x && x.en) || id;
        // a quoted English word («Protest!»): as written; its local word after the closing quote (terms.js mention(), "quoted")
        const rest = str.slice(at + m.length), q = !!CT.quoted && CT.quoted(str.slice(0, at), rest) && CT.englishForm(form, [x.en], []);
        const own = q && /^[!?.…]*\s*[»“”"’›‘]\s*\(/.test(rest);
        const r = CT.mention({ en: x.en, local: x.local || "", raw: x.raw || "", form: form || "", names: [x.en], id, lang: LANG, plural: flag === "pl",
          quoted: q, first: !own && sc.first(id, at), start: CT.atStart(str.slice(0, at).replace(/\{\{[^{}]*\}\}/g, "x")) });
        return r.after ? `${r.text}\u0000${r.after}\u0001` : r.text; })
      .replace(/\u0000([^\u0001]*)\u0001([!?.…]*\s*[»“”"’›‘])/g, "$2$1").replace(/[\u0000\u0001]/g, "")
      .replace(/\{\{(?:rule|lesson|fact):([^}|]*)[^}]*\}\}/g, (m, x) => x.split(":").pop()); }
  function plainQuiz(q, terms) { q.q = plainTok(q.q, terms); q.explain = plainTok(q.explain, terms); (q.options || []).forEach(o => { o.text = plainTok(o.text, terms); }); return q; }
  function plainLesson(D) { const T = D.terms || []; (D.quiz || []).forEach(q => plainQuiz(q, T)); (D.phrases || []).forEach(p => { p.meaning = plainTok(p.meaning, T); p.say = plainTok(p.say, T); }); D.summary = plainTok(D.summary, T); return D; }
  /* A title the build has not got in this language yet (null) falls back to the readable id, so no heading or link is empty. */
  const pretty = id => { const s = String(id || "").replace(/-/g, " "); return s.charAt(0).toUpperCase() + s.slice(1); };
  function plainCatalog(C) {
    for (const c of Object.values(C.lessons || {})) { c.title = plainTok(c.title) || pretty(c.id); c.summary = plainTok(c.summary) || ""; }
    for (const b of C.blocks || []) { b.title = plainTok(b.title) || pretty(b.id); b.purpose = plainTok(b.purpose) || "";
      for (const sc of b.sections || []) sc.title = plainTok(sc.title) || pretty(sc.id); }
    for (const r of C.routes || []) { r.title = plainTok(r.title) || pretty(r.id); r.for = plainTok(r.for) || "";
      (r.stages || []).forEach(st => { st.title = plainTok(st.title) || pretty(st.id); });
      if (r.checklist && !r.checklist.title) r.checklist.title = pretty(r.id); }
    for (const g of C.practice || []) g.title = plainTok(g.title) || pretty(g.id);
    for (const l of (C.levels && C.levels.levels) || []) l.title = l.title || pretty(l.id);
    for (const b of C.badges || []) b.title = b.title || pretty(b.id);
  }
  /* Data did not load: keep the static content of the page; on the shell show its <noscript> summary instead of an empty page. */
  function bootFailed() {
    const app = $("app"), ns = app && app.querySelector("noscript");
    const msg = { uk: "Не вдалося завантажити дані Академії. Перевірте з’єднання й оновіть сторінку.", en: "The Academy could not load its data. Check your connection and reload the page." };
    if (app && ns && !app.querySelector(":scope > :not(noscript)")) app.insertAdjacentHTML("beforeend", ns.textContent);
    if (app) app.insertAdjacentHTML("afterbegin", `<p class="ac-note" role="alert">${esc(msg[LANG] || msg.en)}</p>`);
    staticSims(); // the static lesson's animation still works (texts from docs/shared/sims-text.js)
  }
  boot();
})();
