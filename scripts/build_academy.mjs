/* =====================================================================================================================
   ClayArena Academy build — content/academy/ → static pages, data files, redirect stubs, sitemaps, share-preview list.
   Run with Bun from the project root. Normally called by scripts/build_seo.mjs (one build for the whole site).
   =====================================================================================================================

   ONE "Академія ClayArena" (design §1–§7, content/academy/SCHEMA.md). This script replaces the Academy parts of
   build_seo*.mjs and the retired scripts/build_interpreter.py + build_interpreter_pages.py.

   Inputs (read only):
     content/academy/            the single source of truth: blocks, routes, lessons (masters en+uk), i18n overlays (9 languages),
                                 ui strings (11 languages), facts, laws, id-map, ids.lock, practice, levels, badges
     docs/glossary/data/         the ONE glossary (glossary.js, learn_terms.js, aliases.json, i18n/<lang>.js)
     docs/rules/data/            FITASC rules data (sporting.js, compak.js, categories.js): rule_refs are checked against it
     docs/shared/sims.js         the animation registry (flight presets, pairs, stand scenes, kind()): unknown sim keys are build errors
                                 (audit S-09); a lesson's animation is shown big right after its first paragraph (heroOrder/heroOf)
     rules/pdf/*.txt             local FITASC text cache (never published): the 10-word verbatim check (audit R-01)
     docs/ (or --docs-root)      only to see which old pages still exist (transition: they stay in the sitemap until replaced)

   Output (into --out, default docs/; uk at the root, the other 10 languages under /<lang>/):
     learn/<id>/                 lesson pages (/<lang>/learn/<id>/)            index (preview / fitasc / draft → noindex)
     learn/topics/<block>/       13 block pages (CollectionPage + ItemList)    index
     learn/routes/<route>/       7 route pages (Course, free, no Offer)        index;  …/exam/  noindex
     learn/practice/ + <game>/   Practice (games registry practice.json)       index;  referees-call follows FITASC_INDEX
     learn/progress/             progress, badges, certificates (app)          noindex
     learn/                      home (not written over a hand-written docs/learn/index.html, see --own-home)
     learn/data/<lang>/catalog.json, ui.json, phrases.json, lessons/<id>.json, exams/<route>.json   app data (contract: SCHEMA.md §8)
     learn/data/languages.json   in which languages the Academy home is published (docs/shared/nav.js links there, else to /en/learn/)
     learn/data/redirects.json, learn/data/id-map.json                       301 list for clayarena.com, JS routers
     interpreter/<lang>/<id>/, interpreter/<lang>/, learn/<merged id>/, en/learn/<merged id>/   redirect stubs (groups A–D)
     sitemap-learn-<lang>.xml    one sitemap per language (scripts/build_seo.mjs lists them in the sitemap index)
     og/og-list.json             the share pictures to draw (python scripts/make_og.py reads it)
     shared/sims-text.js         texts of the shared animations, from content/academy/ui/<lang>.json
     shared/sims.min.js          the shared animations as the pages load them: docs/shared/sims.js minified (see minifySims())

   Checks (design §6.6): ERRORS stop the build — nothing is written and the exit code is 1. WARNINGS are listed.
   Content errors of lessons whose status is still "draft" never block: such lessons are not built (normal build) or are built
   as noindex previews (--draft). Structural, SEO and language errors always block.
   Ukrainian output: every apostrophe between two Cyrillic letters is written as ’ (U+2019), whatever the source used (' or ʼ);
   the report counts the replacements once (warning "uk-apostrophe") so editors can fix the sources.

   Flags:
     --out <dir>        site root to write into (default docs). Use a temp folder while developing.
     --draft            also build draft lessons (preview: noindex, marked "Draft", draft blocks visible). Refused for docs/.
     --base <url>       absolute site URL (default the GitHub Pages URL); e.g. http://127.0.0.1:8791/ for a local preview
     --docs-root <dir>  where the old pages are looked up (default docs)
     --report <file>    write every finding as JSON
     --check            run the checks only, write nothing
     --own-home         let the build overwrite a hand-written docs/learn/index.html
     --quiet            print only the summary

   ⚠ FITASC: the rules guide (/rules/) and the rules trainer stay noindex until FITASC gives written permission. The switch is
   FITASC_INDEX in scripts/build_seo.mjs (read from there; never duplicated). Lessons with index:"fitasc" and the Practice game
   "referees-call" follow it. Academy lessons of the "Правила" block are our own short texts (index:"always").

   Production (clayarena.com): the same JSON (catalog, lesson, exam files) comes from the database through the API, the pages
   are server templates with the same markup and checks run in CI; redirects.json becomes real HTTP 301 responses.
   ===================================================================================================================== */
import { mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createHash } from "node:crypto";
import { BASE as SITE_BASE, LANGS, OG_LOCALE, esc, tm, legal, readFitascIndex } from "./site_common.mjs";
import * as lint from "./academy/lint.mjs";

const ROOT = path.resolve(import.meta.dir, "..");
const CONTENT = path.join(ROOT, "content", "academy");
const DOCS = path.join(ROOT, "docs");
const OVERLAY_LANGS = LANGS.filter(l => l !== "en" && l !== "uk");
const RESERVED = ["topics", "routes", "practice", "progress", "app", "data", "assets"]; // first URL segment after /learn/
const GEN = "generated by scripts/build_academy.mjs";
// Redirect stubs (design §5.2): instant meta refresh + location.replace + canonical to the target + Open Graph, and NO noindex
// (canonical and noindex on one page send opposite signals; id-map.json "groups.rules" says the same). Kept as a switch because a
// task note once asked for noindex; change it only together with the design and id-map.json.
const STUB_NOINDEX = false;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const TYPES = new Set(["p", "h", "steps", "tip", "warn", "compare", "rule", "law", "fact", "evidence", "sim", "figure", "draft"]);
const NO_TEXT = new Set(["law", "fact", "evidence", "sim"]); // body types without translatable text of their own
const EV_LEVELS = ["strong", "some", "little", "coaches"];
const DISC_NAME = { sporting: "Parcours de Chasse – Sporting™", compak: "Compak® Sporting" };
const DISC_SHORT = { sporting: "Sporting™", compak: "Compak® Sporting" };
const LANG_NAME = { en: "English", uk: "Українська", de: "Deutsch", fr: "Français", it: "Italiano", cs: "Čeština", pl: "Polski", pt: "Português", hu: "Magyar", fi: "Suomi", lt: "Lietuvių" };
const CHAPTER = { en: "Chapter", uk: "Розділ", de: "Kapitel", fr: "Chapitre", it: "Capitolo" }; // others: glossary ui-<lang>.json "ch"
// Texts of docs/shared/sims.js copied into docs/shared/sims-text.js (for pages outside the Academy: glossary, rules trainer).
// Every ui key that starts with "anim_" is copied too (play / replay / slow motion, hero headings and captions, stand scenes).
const SIM_KEYS = ["launch", "method", "m_maintained", "m_swing", "m_pullaway", "m_ambush", "speed", "distance", "demo", "try", "shoot", "hit", "behind", "ahead",
  "perceived", "actual", "lab_note", "decision", "shot_moment", "lead_word", "unit_m", "unit_ft", "unit_ms", "pair_report", "pair_sim", "pair_rafale", "listen",
  "no_shot", "at_muzzle", "compare", "how_maintained", "how_swing", "how_pullaway", "how_ambush", "stop_gun", "clay_widths", "unit_cm", "unit_in"];
// What docs/shared/sims.js understands (S-09). Lead keys muzzle_start, gun_speed, trigger, follow_through only describe the method
// in words (sims.js header). Flight presets, pair kinds and stand scenes ("call": the call and the release, the Sporting™ ready
// position, a misfire) are read from sims.js itself.
const SIM_SPEC = {
  flight: { keys: ["type", "preset", "also", "pairs", "focus"], focus: ["points", "stance", "eyes"] },
  lead: { keys: ["type", "method", "preset", "focus", "stop", "muzzle_start", "gun_speed", "trigger", "follow_through"],
    method: ["maintained", "swing", "swing-through", "pullaway", "pull-away", "ambush"], preset: ["crosser-lr", "crosser-rl", "rabbit"],
    focus: ["perceived-vs-actual", "lead-units", "follow-through", "mount"] },
  pair: { keys: ["type", "kind", "also"] },
  call: { keys: ["type", "kind", "also"] }
};
const GAME_DESC = { lead: "game_lead_d", flight: "game_flight_d", coach: "game_coach_d", call: "game_call_d", terms: "game_terms_d" }; // ui keys by legacy game id
const P = l => (l === "uk" ? "" : l + "/");
export const sha8 = s => createHash("sha1").update(String(s), "utf8").digest("hex").slice(0, 8);
/* The animation file the pages load (review 08.10.2026). docs/shared/sims.js is the ONE source of the animations (CLAUDE.md "Без
   дублей") and keeps its many comments for the team: about 160 KB, over the size budget of the animation style 10.2026 (+36 KB raw /
   +12 KB gzip over 92 KB). GitHub Pages serves docs/ as it is, so every build writes docs/shared/sims.min.js: the same code minified
   (Bun's transpiler: comments and spaces out, local names shortened; ≈ 76 KB, gzip ≈ 28 KB) with a one-line header. Every page loads
   sims.min.js (the Academy pages here; the glossary pages and the hand-written pages through scripts/build_seo.mjs). Edit only
   sims.js and rebuild; never edit the .min file. Without Bun the source is copied as it is (warning "sims-min"), so a page never
   loads a missing or stale file. The checks of this build (S-09 registry, kind()) read the source. Production (clayarena.com): the
   front-end bundler minifies it the same way. */
export function minifySims(docsRoot = DOCS) {
  const src = readFileSync(path.join(docsRoot, "shared", "sims.js"), "utf8");
  const head = `/* ${GEN} from docs/shared/sims.js (the source, with the comments for the team): the minified copy the pages load. Do not edit: change docs/shared/sims.js and rebuild. */\n`;
  try { if (typeof Bun !== "undefined" && Bun.Transpiler) return { code: head + new Bun.Transpiler({ loader: "js", minify: true }).transformSync(src), minified: true }; } catch (e) {}
  return { code: head + src, minified: false };
}
// The English text a translation hash "h" is taken of (SCHEMA.md §5). Pure: used here and by overlay-writing scripts
// (import { enSrc, sha8 } from "./build_academy.mjs") so a hash is never hand-computed and guessed.
export const enSrc = (part, it) => {
  if (part === "title" || part === "summary") return (it && it.en) || "";
  if (part === "phrase") return it.en + "\n" + ((it.meaning || {}).en || "");
  if (part === "quiz" || part === "pool") return [(it.q || {}).en, ...(it.options || []).map(x => x.en), (it.explain || {}).en].join("\n");
  if (it.t === "steps") return (it.en || []).join("\n");
  if (it.t === "compare") return [(it.sporting || {}).en, (it.compak || {}).en].join("\n");
  return it.en || "";
};
const isFitasc = u => /(^|\/\/|\.)fitasc\.com\b/i.test(u || "");
const CA_MEDIA = /^https:\/\/(?:[a-z0-9-]+\.)*clayarena\.com\//i; // media only from ClayArena (cdn.clayarena.com, storage)
const isObj = x => x && typeof x === "object" && !Array.isArray(x);
const stringsDeep = v => v == null ? [] : typeof v === "string" ? [v] : Array.isArray(v) ? v.flatMap(stringsDeep) : isObj(v) ? Object.values(v).flatMap(stringsDeep) : [];
const nonEmpty = v => Array.isArray(v) ? v.length > 0 && v.every(x => String(x ?? "").trim() !== "") : isObj(v) ? Object.keys(v).length > 0 : String(v ?? "").trim() !== "";
const TOKEN_RE = /\{\{([a-z]+):([^{}]*?)\}\}/g;
// Ukrainian apostrophe: ’ (U+2019) between two Cyrillic letters in every uk output (pages, catalog, lesson and phrase files,
// share list, animation texts). Sources may still have ' (U+0027), ʼ (U+02BC), ` or ‘ — the glossary and the law tables do.
const UK_APOS_RE = /(?<=\p{Script=Cyrillic})['ʼ`‘](?=\p{Script=Cyrillic})/gu;
export const ukApos = s => String(s ?? "").replace(UK_APOS_RE, "’");
// What the stop-word check reads (warning "stop-word"): our own wording only. Left out are tokens with their ids and forms
// ({{term:best-score|Best score}}), short quoted labels ("Best score", «Найкращий результат», “…”, „…“) and, through labelsRe,
// the glossary names of things (ClayArena profile labels such as "Best score" are glossary terms, not a claim that something is best).
const QUOTED_RE = /«[^«»\n]{1,80}»|“[^“”\n]{1,80}”|„[^„“”\n]{1,80}[“”]|"[^"\n]{1,80}"/gu;
export const stopWordText = (s, labelsRe) => { let t = String(s ?? "").replace(TOKEN_RE, " ").replace(QUOTED_RE, " "); return labelsRe ? t.replace(labelsRe, " ") : t; };
const reEsc = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// Lesson status: draft (not built) → review (written; waits for the specialist; published with "Перевіряється") → ready → published.
// "preview" = finished but shown only as a noindex preview (the ClayAway lesson until ClayAway launches; also needs index:"preview").
const STATUSES = ["draft", "review", "ready", "published", "preview"], PUBLISHABLE = ["review", "ready", "published", "preview"];
const uniq = a => [...new Set(a)];

/* =====================================================================================================================
   buildAcademy(options) → {ok, blocking, findings, counts, urls: {lang: [url]}, stubs: Set, sitemaps: [file], learnLinks, newTerms}
   ===================================================================================================================== */
export async function buildAcademy(o = {}) {
  const opt = {
    out: path.resolve(o.out || DOCS), docsRoot: path.resolve(o.docsRoot || DOCS),
    base: String(o.base || SITE_BASE).replace(/\/?$/, "/"),
    draft: !!o.draft, write: o.write !== false, quiet: !!o.quiet, ownHome: !!o.ownHome, report: o.report || null,
    fitascIndex: typeof o.fitascIndex === "boolean" ? o.fitascIndex : readFitascIndex(ROOT),
    today: o.today || new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Bratislava" }).format(new Date()) // project time zone (CLAUDE.md)
  };
  if (opt.draft && opt.write && opt.out === path.resolve(DOCS))
    throw new Error("--draft builds a preview of unfinished lessons: write it into another folder (--out <dir>), never into docs/");
  const BASE = opt.base;

  /* ---------- findings ---------- */
  const findings = [];
  const add = (level, type, msg, ctx = {}) => findings.push({ level, type, msg, ...ctx });
  const err = (type, msg, ctx) => add("error", type, msg, ctx);
  const warn = (type, msg, ctx) => add("warning", type, msg, ctx);
  const once = new Set(); const warnOnce = (key, type, msg, ctx) => { if (!once.has(key)) { once.add(key); warn(type, msg, ctx); } };
  // Ukrainian pages: apostrophes written as ’ (see UK_APOS_RE); counted once for the report (warning "uk-apostrophe")
  let ukAposN = 0; const ukOut = s => String(s).replace(UK_APOS_RE, () => (ukAposN++, "’"));

  /* =================================================================================================================
     1. Load the content source
     ================================================================================================================= */
  const J = rel => { try { return JSON.parse(readFileSync(path.join(CONTENT, rel), "utf8")); } catch (e) { err("json", `content/academy/${rel}: ${e.message}`); return null; } };
  const ls = rel => existsSync(path.join(CONTENT, rel)) ? readdirSync(path.join(CONTENT, rel)) : [];
  const blocks = (J("blocks.json") || []).slice().sort((a, b) => a.order - b.order);
  const routes = (J("routes.json") || []).slice().sort((a, b) => a.order - b.order);
  const games = (J("practice.json") || { games: [] }).games || [];
  const levels = J("levels.json") || { xp: {}, levels: [] };
  const badges = (J("badges.json") || { badges: [] }).badges || [];
  const idmap = J("id-map.json") || {};
  const lock = J("ids.lock") || {};
  // Facts (design §6.5): facts.json ({{fact:<id>}}) and, as the editors keep them, facts/<file>.json ({{fact:<file>.<id>}}).
  const facts = { ...(J("facts.json") || {}) };
  for (const f of ls("facts").filter(f => f.endsWith(".json"))) { const j = J(`facts/${f}`) || {}; for (const [id, v] of Object.entries(j)) if (!id.startsWith("_")) facts[`${f.replace(/\.json$/, "")}.${id}`] = v; }
  const learnMap = idmap.learn || {}, interpMap = idmap.interpreter || {};
  const ui = {};
  for (const f of ls("ui")) {
    const l = f.replace(/\.json$/, "");
    if (!LANGS.includes(l)) { err("lang-code", `content/academy/ui/${f}: language code outside the 11 ClayArena languages`); continue; }
    const j = J(`ui/${f}`); ui[l] = (j && j.strings) || {};
    if (j && j.lang !== l) err("lang-code", `content/academy/ui/${f}: "lang" is "${j.lang}"`);
  }
  for (const l of LANGS) if (!ui[l]) { ui[l] = {}; warn("ui-missing", `content/academy/ui/${l}.json is missing: interface strings fall back to English`, { lang: l }); }
  const laws = {};
  for (const f of ls("laws").filter(f => f.endsWith(".json"))) {
    const cc = f.replace(/\.json$/, "");
    if (!/^[A-Z]{2}$/.test(cc)) { err("law-file", `content/academy/laws/${f}: the file name must be an ISO 3166 country code in capitals`); continue; }
    laws[cc] = J(`laws/${f}`);
  }
  const lessons = new Map();
  for (const f of ls("lessons").filter(f => f.endsWith(".json")).sort()) {
    const m = J(`lessons/${f}`); if (!m) continue;
    if (`${m.id}.json` !== f) err("lesson-id", `lessons/${f}: "id" is "${m.id}", not the file name`);
    lessons.set(m.id, m);
  }
  const overlays = {}, shared = {}, factsI18n = {};
  for (const L of OVERLAY_LANGS) overlays[L] = new Map();
  for (const d of ls("i18n")) {
    if (!OVERLAY_LANGS.includes(d)) { err("lang-code", `content/academy/i18n/${d}/: overlays exist only for the 9 languages ${OVERLAY_LANGS.join(" ")}`); continue; }
    for (const f of ls(`i18n/${d}`).filter(f => f.endsWith(".json"))) {
      const j = J(`i18n/${d}/${f}`); if (!j) continue;
      if (f === "_facts.json") { factsI18n[d] = j; continue; }
      if (f === "_shared.json") { shared[d] = j; continue; }
      if (f.startsWith("_")) { warn("overlay-unknown-file", `i18n/${d}/${f}: unknown file`); continue; }
      const id = f.replace(/\.json$/, "");
      if (j.lang !== d) err("lang-code", `i18n/${d}/${f}: "lang" is "${j.lang}"`);
      if (!lessons.has(id)) { warn("overlay-orphan", `i18n/${d}/${f}: no master lessons/${id}.json`, { lang: d }); continue; }
      overlays[d].set(id, j);
    }
  }
  const status = id => (lessons.get(id) || {}).status;
  const isDraftLesson = id => !!id && lessons.has(id) && !PUBLISHABLE.includes(status(id));

  /* =================================================================================================================
     2. Load the shared data the Academy depends on (sandboxed: the same files the browser loads)
     ================================================================================================================= */
  const runScripts = files => { const ctx = { window: {}, console }; vm.createContext(ctx); for (const f of files) if (existsSync(f)) vm.runInContext(readFileSync(f, "utf8"), ctx, { filename: f }); return ctx.window; };
  const GD = path.join(DOCS, "glossary", "data");
  const gw = runScripts([path.join(GD, "glossary.js"), path.join(GD, "learn_terms.js"), ...LANGS.map(l => path.join(GD, "i18n", `${l}.js`))]);
  const GBY = {};
  for (const t of [...((gw.GLOSSARY || {}).terms || []), ...((gw.GLOSSARY_LEARN || {}).terms || [])]) GBY[t.id] = Object.assign(GBY[t.id] || {}, t);
  const GI = gw.GLOSSARY_I18N || {};
  let ALIAS = {}; try { ALIAS = JSON.parse(readFileSync(path.join(GD, "aliases.json"), "utf8")); } catch (e) { warn("glossary", "docs/glossary/data/aliases.json not readable"); }
  const GUI = {}; for (const l of OVERLAY_LANGS) { try { GUI[l] = JSON.parse(readFileSync(path.join(GD, "i18n", `ui-${l}.json`), "utf8")); } catch (e) { GUI[l] = {}; } }
  // Glossary names that contain a stop word of their language ("Best score", «найкращий результат»): names of things, skipped by
  // the stop-word check (see stopWordText). en: term, display_term, aka; other languages: term_local + alt of i18n/<lang>.js;
  // uk also the «…» names of "uk_usage" (terms of learn_terms.js have no i18n/uk.js entry).
  const LABELS_RE = {};
  for (const L of LANGS) {
    const names = L === "en" ? Object.values(GBY).flatMap(t => [t.term, t.display_term, ...(t.aka || [])]) : Object.values((GI[L] || {}).terms || {}).flatMap(x => [x.term_local, ...(x.alt || [])]);
    if (L === "uk") for (const t of Object.values(GBY)) for (const q of String(t.uk_usage || "").matchAll(/«([^«»]{2,60})»/g)) names.push(q[1]);
    const hits = uniq(names.filter(n => typeof n === "string" && n.trim()).filter(n => lint.stopWords(n, L).length)).sort((a, b) => b.length - a.length);
    LABELS_RE[L] = hits.length ? new RegExp(`(?<![\\p{L}\\p{M}])(?:${hits.map(reEsc).join("|")})(?![\\p{L}\\p{M}])`, "giu") : null;
  }
  // Terms that exist only as `new_terms` of a master (not yet in learn_terms.js): build_seo.mjs gives them thin uk/en glossary pages.
  const THIN = new Map();
  for (const m of lessons.values()) for (const n of m.new_terms || []) if (n && n.id && !GBY[n.id] && !THIN.has(n.id)) THIN.set(n.id, { ...n, lesson: m.id });
  const termId = id => GBY[id] ? id : (ALIAS[id] && GBY[ALIAS[id]] ? ALIAS[id] : null); // glossary id (aliases resolved) or null
  const anyTermId = id => termId(id) || (THIN.has(id) ? id : null);
  const enTerm = id => (GBY[id] ? (GBY[id].display_term || tm(GBY[id].term)) : THIN.has(id) ? tm(THIN.get(id).term) : id);
  // Name of a glossary term in language L, as shown on lesson pages: term chips ("Терміни"), the JSON-LD `about` DefinedTerm names,
  // `terms[].local` of the lesson data file and the text of {{term:id}} links without a form. It goes through tm() like the English
  // name (audit legal-01): local names such as "Compak Sporting" or "Percorso di Caccia (Sporting)" get the FITASC marks
  // ("Compak® Sporting", "Percorso di Caccia (Sporting™)"), as on the glossary pages. Declined forms written by the author
  // ({{term:id|form}}) stay as written.
  const localTerm = (L, id) => {
    if (L === "en") return enTerm(id);
    const x = ((GI[L] || {}).terms || {})[id];
    return x && x.term_local && x.conf !== "low" ? tm(x.term_local) : enTerm(id);
  };
  const glossUrl = (L, id) => { // a glossary page in that language, or null (uk/en: every term; others: terms with a translated definition)
    if (L === "uk" || L === "en") return GBY[id] || THIN.has(id) ? `${BASE}${L === "uk" ? "" : "en/"}glossary/${id}/` : null;
    return (((GI[L] || {}).terms || {})[id] || {}).short ? `${BASE}${L}/glossary/${id}/` : null;
  };
  const rw = runScripts(["sporting", "compak", "categories"].map(b => path.join(DOCS, "rules", "data", `${b}.js`)));
  const RULES = {};
  for (const b of rw.RULES || []) { RULES[b.key] = new Map(); for (const s of b.sections) for (const it of s.items) RULES[b.key].set(it.id, { chapter: s.chapter, en: it.title_en, uk: it.title_uk }); }
  RULES.categories = new Map(((rw.FITASC_CATEGORIES || {}).categories || []).map(c => [c.id, { chapter: null, en: c.name_en, uk: c.name_uk || c.name_en }]));
  let SIMREG = null;
  try { const s = runScripts([path.join(DOCS, "shared", "sims.js")]).ClaySims;
    SIMREG = { FLIGHTS: new Set(Object.keys(s.FLIGHTS)), PAIRS: new Set(Object.keys(s.PAIRS)), SCENES: new Set(Object.keys(s.SCENES || {})), CALL: s.CALL || null, kind: s.kind || null,
      TERMS: [...new Set(Object.values(s.FLIGHTS).map(f => f.term).filter(Boolean))] }; } // glossary ids of the flights (names for docs/shared/sims-text.js)
  catch (e) { warn("sims-registry", `docs/shared/sims.js could not be read (${e.message}): animation presets are not checked`); }
  // What an animation teaches (sims.js kind(): flight, points, eyes, stance, pair, lead, mount, follow, call, gunpos, misfire): it picks
  // the heading "▶ <ui anim_h_<kind>>" and the generic caption anim_w_<kind> of the lesson's animation (see heroOf below).
  const simKind = sim => { try { return (SIMREG && SIMREG.kind && SIMREG.kind(sim)) || "flight"; } catch (e) { return "flight"; } };
  // The stand scenes draw two rule numbers (sims.js CALL); they must say what the facts the lessons use say (one number in one place).
  if (SIMREG && SIMREG.CALL) {
    const fx = id => (((facts[id] || {}).text || {}).en || "").trim(), lim = fx("rules.release-within-3s"), sono = fx("rules.sonopull-delay");
    const sv = ({ "half a second": .5, "one second": 1 })[sono.toLowerCase()] ?? parseFloat(sono);
    if (!new RegExp(`(^|\\D)${SIMREG.CALL.limit}(\\D|$)`).test(lim)) warn("sim-facts", `docs/shared/sims.js CALL.limit is ${SIMREG.CALL.limit} s, but the fact rules.release-within-3s says "${lim}": change one of them`);
    if (sv !== SIMREG.CALL.sonopull) warn("sim-facts", `docs/shared/sims.js CALL.sonopull is ${SIMREG.CALL.sonopull} s, but the fact rules.sonopull-delay says "${sono}": change one of them`);
  }
  const FC = lint.loadFitascCache(ROOT);
  if (!FC) warn("fitasc-cache-missing", "rules/pdf/*.txt not found: the 10-words-in-a-row FITASC check was skipped (keep the local cache; it is never published)");

  /* ---------- ui strings: S(L, key) with English fallback (recorded, one warning per language) ---------- */
  const uiFallback = {}; for (const l of LANGS) uiFallback[l] = new Set();
  const S = (L, key, vars) => {
    let s = ui[L] && ui[L][key];
    if (s == null || s === "") { s = ui.en[key]; if (s != null) uiFallback[L].add(key); else { s = key; warnOnce("ui:" + key, "ui-key-missing", `ui string "${key}" is missing in en.json`); } }
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
    return s;
  };
  const academyName = L => S(L, "academy_name");

  /* =================================================================================================================
     3. Structure checks (always blocking)
     ================================================================================================================= */
  const blockById = Object.fromEntries(blocks.map(b => [b.id, b]));
  const routeById = Object.fromEntries(routes.map(r => [r.id, r]));
  const gameById = Object.fromEntries(games.map(g => [g.id, g]));
  const badgeIds = new Set(badges.map(b => b.id));
  const place = new Map(); const seen = new Map();
  for (const b of blocks) {
    if (!SLUG.test(b.id)) err("id-format", `blocks.json: block id "${b.id}" is not a kebab-case slug`);
    for (const s of b.sections || []) {
      if (!SLUG.test(s.id)) err("id-format", `blocks.json: section id "${b.id}/${s.id}" is not a kebab-case slug`);
      (s.lessons || []).forEach((id, i) => {
        seen.set(id, (seen.get(id) || 0) + 1);
        if (!lessons.has(id)) err("block-unknown-lesson", `blocks.json: ${b.id}/${s.id} lists "${id}", which has no master in lessons/`);
        else if (!place.has(id)) place.set(id, { block: b.id, section: s.id, i });
      });
    }
    for (const id of b.starters || []) if (!(b.sections || []).some(s => s.lessons.includes(id))) err("block-starter", `blocks.json: starter "${id}" is not a lesson of block ${b.id}`);
    for (const g of b.practice || []) if (!gameById[g]) err("block-practice", `blocks.json: ${b.id} lists the unknown game "${g}"`);
  }
  for (const [id, m] of lessons) {
    const n = seen.get(id) || 0;
    if (n !== 1) err("lesson-sections", `${id}: listed in ${n} sections of blocks.json (must be exactly one section of one block)`);
    if (!SLUG.test(id)) err("id-format", `${id}: a lesson id must be a kebab-case slug`);
    if (RESERVED.includes(id)) err("id-reserved", `${id}: the lesson id equals a reserved URL word (${RESERVED.join(", ")})`);
    const pl = place.get(id);
    if (pl) { const starter = (blockById[pl.block].starters || []).includes(id); if ((m.level === 1) !== starter) err("level-mismatch", `${id}: level ${m.level} but ${starter ? "it is" : "it is not"} a starter ("Почніть тут") of block ${pl.block}`); }
  }
  for (const r of routes) {
    if (!SLUG.test(r.id)) err("id-format", `routes.json: route id "${r.id}" is not a kebab-case slug`);
    for (const st of r.stages || []) {
      for (const id of st.lessons || []) if (!lessons.has(id)) err("route-unknown-id", `routes.json: ${r.id}/${st.id} lists "${id}", which does not exist`);
      if ((st.lessons || []).length > 11) warn("route-stage-long", `routes.json: ${r.id}/${st.id} has ${st.lessons.length} lessons (at most 11 per stage)`);
      if (st.badge && !badgeIds.has(st.badge)) warn("badge-unknown", `routes.json: ${r.id}/${st.id} badge "${st.badge}" is not in badges.json`);
    }
    for (const id of r.extras || []) if (!lessons.has(id)) err("route-unknown-id", `routes.json: ${r.id} extras list "${id}", which does not exist`);
    for (const p of r.practice || []) if (!gameById[p.game]) err("route-unknown-id", `routes.json: ${r.id} practice game "${p.game}" is not in practice.json`);
    if (r.badge && !badgeIds.has(r.badge)) warn("badge-unknown", `routes.json: ${r.id} badge "${r.badge}" is not in badges.json`);
  }
  for (const g of games) if (!SLUG.test(g.id)) err("id-format", `practice.json: game id "${g.id}" is not a kebab-case slug`);
  // ids.lock: an id once published never disappears without an id-map.json entry
  for (const id of lock.learn || []) if (!lessons.has(id) && !learnMap[id]) err("id-removed", `ids.lock: old Academy id "${id}" has no master and no id-map.json "learn" entry`);
  for (const id of lock.interpreter || []) if (!lessons.has(id) && !interpMap[id]) err("id-removed", `ids.lock: Interpreter Academy id "${id}" has no master and no id-map.json "interpreter" entry`);
  for (const id of lock.academy || []) if (!lessons.has(id) && !learnMap[id] && !interpMap[id]) err("id-removed", `ids.lock: lesson id "${id}" has no master and no id-map.json entry`);
  for (const id of lock.blocks || []) if (!blockById[id]) err("id-removed", `ids.lock: block "${id}" is gone (keep it or map it)`);
  for (const id of lock.routes || []) if (!routeById[id]) err("id-removed", `ids.lock: route "${id}" is gone (keep it or map it)`);
  for (const id of lock.practice || []) if (!gameById[id]) err("id-removed", `ids.lock: game "${id}" is gone (keep it or map it)`);
  for (const id of lessons.keys()) if (!(lock.academy || []).includes(id)) warn("ids-lock-missing", `${id} is not in ids.lock "academy" yet (append it when it is first published)`);
  for (const [old, e] of [...Object.entries(learnMap), ...Object.entries(interpMap)]) if (!e || !lessons.has(e.to)) err("id-map-target", `id-map.json: "${old}" → "${e && e.to}", which has no master`);
  const checkHashTarget = (where, t) => { // "topics/<block>#<section>" | "routes/<route>[#certificate]" | "practice/<game>"
    const m = String(t || "").match(/^(topics|routes|practice)\/([a-z0-9-]+)(?:#([a-z0-9-]+))?$/); if (!m) { err("id-map-target", `id-map.json ${where}: "${t}" is not topics/…, routes/… or practice/…`); return; }
    if (m[1] === "topics" && (!blockById[m[2]] || (m[3] && !blockById[m[2]].sections.some(s => s.id === m[3])))) err("id-map-target", `id-map.json ${where}: "${t}" — no such block or section`);
    if (m[1] === "routes" && (!routeById[m[2]] || (m[3] && m[3] !== "certificate" && !routeById[m[2]].stages.some(s => s.id === m[3])))) err("id-map-target", `id-map.json ${where}: "${t}" — no such route or stage`);
    if (m[1] === "practice" && !gameById[m[2]]) err("id-map-target", `id-map.json ${where}: "${t}" — no such game`);
  };
  for (const k of ["modules", "missions", "games"]) for (const [id, t] of Object.entries(idmap[k] || {})) checkHashTarget(`${k}.${id}`, t);

  /* =================================================================================================================
     4. Lesson content checks (attributed to the lesson: blocking only for lessons that are "review", "ready" or "published")
     ================================================================================================================= */
  const keyOwner = new Map();
  const hashMemo = new WeakMap(); // English-source hash of an item, computed once
  const hashOf = (part, it) => { if (!it || typeof it !== "object") return sha8(""); let h = hashMemo.get(it); if (h == null) { h = sha8(enSrc(part, it)); hashMemo.set(it, h); } return h; };
  const itemsOf = m => {
    const out = [{ part: "title", k: "title", it: m.title }, { part: "summary", k: "summary", it: m.summary }];
    for (const b of m.body || []) out.push({ part: "body", k: b.k, it: b, core: !!b.core, draft: b.t === "draft" });
    for (const x of m.note || []) out.push({ part: "note", k: x.k, it: x, core: !!x.core, draft: !!x.draft });
    for (const x of m.phrases || []) out.push({ part: "phrase", k: x.k, it: x, core: !!x.core, draft: !!x.draft });
    for (const x of m.key_points || []) out.push({ part: "kp", k: x.k, it: x, core: !!x.core, draft: !!x.draft });
    if (m.did_you_know) out.push({ part: "dyk", k: m.did_you_know.k, it: m.did_you_know, draft: !!m.did_you_know.draft });
    for (const x of m.quiz || []) out.push({ part: "quiz", k: x.k, it: x });
    for (const x of m.exam_pool || []) out.push({ part: "pool", k: x.k, it: x });
    return out;
  };
  const hasText = x => !(x.part === "body" && (NO_TEXT.has(x.it.t) || (x.it.t === "draft" && !nonEmpty(x.it.en))));
  // Every text string of one language of an item (for the language, token and wording checks).
  const stringsOf = (x, v) => {
    if (v == null) return [];
    if (typeof v === "string") return [v];
    if (Array.isArray(v)) return v.map(String);
    if (x.part === "phrase") return [v.meaning, v.say].filter(Boolean);
    if (x.part === "quiz" || x.part === "pool") return [v.q, v.explain, ...Object.values(v.options || {})].filter(Boolean);
    return Object.values(v).filter(s => typeof s === "string");
  };
  // Text of item x of master m in language L: {v, st: ok | stale | missing}. en/uk from the master; other languages from the overlay.
  function valOf(m, x, L) {
    const { part, it } = x;
    if (L === "en" || L === "uk") {
      let v;
      if (part === "title" || part === "summary") v = it && it[L];
      else if (part === "phrase") v = { meaning: (it.meaning || {})[L], say: L === "uk" ? (it.say || {}).uk : null };
      else if (part === "quiz" || part === "pool") v = { q: (it.q || {})[L], options: Object.fromEntries((it.options || []).map(op => [op.k, op[L]])), explain: (it.explain || {})[L] };
      else if (it.t === "compare") v = { sporting: (it.sporting || {})[L], compak: (it.compak || {})[L] };
      else v = it[L];
      const ok = part === "phrase" ? nonEmpty(v.meaning) : (part === "quiz" || part === "pool") ? nonEmpty(v.q) && nonEmpty(v.explain) && Object.values(v.options).every(nonEmpty)
        : it && it.t === "compare" ? nonEmpty(v.sporting) && nonEmpty(v.compak) : nonEmpty(v);
      if (!ok) return { st: "missing" };
      if (L === "uk" && m.h_uk && m.h_uk[x.k] && m.h_uk[x.k] !== hashOf(part, it)) return { v, st: "stale" };
      return { v, st: "ok" };
    }
    const ov = overlays[L] && overlays[L].get(m.id); if (!ov) return { st: "missing" };
    const v = part === "title" ? ov.title : part === "summary" ? ov.summary : part === "body" ? (ov.body || {})[x.k] : part === "note" ? (ov.note || {})[x.k]
      : part === "phrase" ? (ov.phrases || {})[x.k] : part === "kp" ? (ov.key_points || {})[x.k] : part === "dyk" ? ov.did_you_know : (ov.quiz || {})[x.k];
    if (v == null) return { st: "missing" };
    if (part === "quiz" || part === "pool") { if (!isObj(v) || !nonEmpty(v.q) || !nonEmpty(v.explain) || !(it.options || []).every(op => nonEmpty((v.options || {})[op.k]))) return { st: "missing" }; }
    else if (part === "phrase") { if (!isObj(v) || !nonEmpty(v.meaning)) return { st: "missing" }; }
    else if (it && it.t === "compare") { if (!isObj(v) || !nonEmpty(v.sporting) || !nonEmpty(v.compak)) return { st: "missing" }; }
    else if (!nonEmpty(v)) return { st: "missing" };
    if ((ov.h || {})[x.k] !== hashOf(part, it)) return { v, st: "stale" };
    return { v, st: "ok" };
  }
  // Token check: {{term:id|form}} {{tm:sporting|compak}} {{rule:book:id}} {{lesson:id}} {{fact:id}}
  const tokenProblem = (kind, arg) => {
    if (kind === "tm") return ["sporting", "compak"].includes(arg) ? null : `unknown trade mark "${arg}"`;
    if (kind === "term") { const id = arg.split("|")[0]; return anyTermId(id) ? null : `term "${id}" is not in the glossary`; }
    if (kind === "rule") { const i = arg.indexOf(":"), book = arg.slice(0, i), id = arg.slice(i + 1); return RULES[book] && RULES[book].has(id) ? null : `rule "${arg}" is not in docs/rules/data`; }
    if (kind === "lesson") return lessons.has(arg) ? null : `lesson "${arg}" does not exist`;
    if (kind === "fact") return facts[arg] ? null : `fact "${arg}" is not in facts.json`;
    return `unknown token "{{${kind}:…}}"`;
  };
  const refOk = (ref, disc, where, ctx) => { // "<book>:<id>" of a block or question
    const i = String(ref).indexOf(":"), book = String(ref).slice(0, i), id = String(ref).slice(i + 1);
    if (!RULES[book] || !RULES[book].has(id)) { err("rule-ref-unknown", `${where}: rule_ref "${ref}" is not in docs/rules/data`, ctx); return; }
    if ((disc === "sporting" || disc === "compak") && book !== disc && book !== "categories") err("rule-ref-book", `${where}: a ${disc} rule points into the ${book} rulebook (${ref})`, ctx);
  };
  const simProblem = sim => {
    if (!isObj(sim)) return "no sim config";
    const spec = SIM_SPEC[sim.type]; if (!spec) return `unknown animation type "${sim.type}"`;
    const bad = Object.keys(sim).filter(k => !spec.keys.includes(k)); if (bad.length) return `keys ${bad.join(", ")} are not read by sims.js (${sim.type})`;
    if (sim.type === "flight" && SIMREG) {
      for (const p of [sim.preset, ...(sim.also || [])]) if (!SIMREG.FLIGHTS.has(p)) return `flight preset "${p}" is not in sims.js`;
      for (const k of sim.pairs || []) if (!SIMREG.PAIRS.has(k)) return `pair "${k}" is not in sims.js`;
      if (sim.focus && !spec.focus.includes(sim.focus)) return `flight focus "${sim.focus}" is not in sims.js`;
    }
    if (sim.type === "lead") {
      if (sim.method && !spec.method.includes(sim.method)) return `lead method "${sim.method}" is not in sims.js`;
      if (sim.preset && !spec.preset.includes(sim.preset)) return `lead preset "${sim.preset}" is not in sims.js`;
      if (sim.focus && !spec.focus.includes(sim.focus)) return `lead focus "${sim.focus}" is not in sims.js`;
    }
    if (sim.type === "pair" && SIMREG) for (const k of [sim.kind, ...(sim.also || [])]) if (!SIMREG.PAIRS.has(k)) return `pair kind "${k}" is not in sims.js`;
    if (sim.type === "call" && SIMREG) for (const k of [sim.kind || "signal", ...(sim.also || [])]) if (!SIMREG.SCENES.has(k)) return `stand scene "${k}" is not in sims.js (SCENES)`;
    return null;
  };
  const quizStats = { pos: {}, n: 0 };
  const inSafety = id => (place.get(id) || {}).block === "safety";

  function checkLesson(m) {
    const id = m.id, ctx = { lesson: id };
    const E = (t, msg) => err(t, `${id}: ${msg}`, ctx), W = (t, msg, extra = {}) => warn(t, `${id}: ${msg}`, { ...ctx, ...extra });
    // whole-file language scan: the restricted country, its flag and letters Ukrainian does not have (also in todo, brief and notes)
    const raw = JSON.stringify(m);
    if (lint.COUNTRY_RE.test(raw)) E("lang-country", "names the restricted country");
    if (lint.FLAG_RE.test(raw)) E("lang-country", "contains the flag of the restricted country");
    if (lint.RU_LETTERS_RE.test(raw)) E("lang-letters", "contains letters Ukrainian does not use (U+044B U+044D U+044A U+0451)");
    // fields
    if (!STATUSES.includes(m.status)) E("lesson-field", `status "${m.status}" (${STATUSES.join(" | ")})`);
    if (!["always", "fitasc", "preview"].includes(m.index)) E("lesson-field", `index "${m.index}" (always | fitasc | preview)`);
    if (id === "travel-clayaway-tour" && m.index !== "preview") E("clayaway-index", "the ClayAway lesson must stay index:\"preview\" (noindex) until ClayAway launches");
    if (m.disclaimer != null && m.disclaimer !== "medical") E("lesson-field", `disclaimer "${m.disclaimer}" (null | medical)`);
    for (const d of m.disciplines || []) if (!["sporting", "compak"].includes(d)) E("lesson-field", `discipline "${d}"`);
    if ((m.minutes || 0) > 8) W("lesson-too-long", `${m.minutes} minutes (more than 8: split it under a new id)`);
    if (m.review_by && m.review_by < opt.today) W("review-expired", `review_by ${m.review_by} has passed`);
    if (!m.title || !nonEmpty(m.title.en)) E("en-missing", "no English title");
    if (!m.summary || !nonEmpty(m.summary.en)) W("summary-missing", "no English summary (meta description falls back to the first paragraph)");
    for (const k of Object.keys(m.title || {}).concat(Object.keys(m.summary || {}))) if (!["en", "uk"].includes(k)) E("lang-code", `title/summary key "${k}" (masters hold en + uk; other languages are overlays)`);
    // glossary terms
    if ((m.new_terms || []).length) E("new-terms-left", `${m.new_terms.length} new_terms still in the lesson (${m.new_terms.map(n => n.id).join(", ")}): move them to docs/glossary/data/learn_terms.js (+ i18n) and delete the field`);
    for (const t of m.terms || []) {
      const r = termId(t);
      if (!r) E("term-unknown", `term "${t}" is not in the glossary${THIN.has(t) ? ` (only a new_term of ${THIN.get(t).lesson})` : ""}`);
      else if (r !== t) W("term-alias", `term "${t}" is an alias: use "${r}"`);
    }
    for (const r of m.rule_refs || []) if (!RULES[r.book] || !RULES[r.book].has(r.id)) E("rule-ref-unknown", `rule_refs ${r.book}:${r.id} is not in docs/rules/data`);
    for (const s of m.sources || []) {
      if (!s.url) E("source", "a source without url");
      if (isFitasc(s.url) && !/nofollow/.test(s.rel || "")) W("source-rel", `FITASC source ${s.url} without rel="nofollow noopener noreferrer" in the data (the page sets it anyway)`);
      if (!s.license) W("source-license", `source ${s.url} has no license field`);
    }
    // body blocks
    let drafts = 0;
    for (const b of m.body || []) {
      if (!TYPES.has(b.t)) E("block-type", `body block ${b.k} has the unknown type "${b.t}"`);
      if (b.t === "draft") drafts++;
      const disc = b.disc;
      if (disc != null && !["sporting", "compak", "both"].includes(disc)) E("rule-no-disc", `block ${b.k}: disc "${disc}" (sporting | compak | both)`);
      if (b.t === "rule") {
        if (disc !== "sporting" && disc !== "compak") E("rule-no-disc", `rule block ${b.k} needs disc "sporting" or "compak"`);
        if (!b.rule_ref) E("rule-no-disc", `rule block ${b.k} needs a rule_ref`);
      }
      if (b.t === "compare") {
        if (!isObj(b.sporting) || !isObj(b.compak) || !nonEmpty(b.sporting.en) || !nonEmpty(b.compak.en)) E("rule-no-disc", `compare block ${b.k} needs both columns: sporting {en, uk} and compak {en, uk}`);
        if (disc != null && disc !== "both") E("rule-no-disc", `compare block ${b.k} compares both disciplines (disc "both" or none)`);
      }
      if (b.rule_ref) refOk(b.rule_ref, disc, `block ${b.k}`, ctx);
      if (b.t === "law") { const D = laws[b.country]; if (!D || !Array.isArray(D[b.part])) E("law-unknown", `law block ${b.k}: no table laws/${b.country}.json "${b.part}"`); }
      if (b.t === "fact" && !facts[b.fact]) E("token-dead", `fact block ${b.k}: fact "${b.fact}" is not in facts.json`);
      if (b.t === "evidence" && !EV_LEVELS.includes(b.level)) E("evidence-level", `evidence block ${b.k}: level "${b.level}"`);
      if (b.t === "figure") {
        if (!CA_MEDIA.test(b.src || "")) E("figure-media", `figure ${b.k}: only ClayArena media (cdn.clayarena.com), not ${b.src}`);
        if (!b.author || !b.license) E("figure-media", `figure ${b.k}: author and license are required`);
      }
      if (b.sim) { const p = simProblem(b.sim); if (p) E("sim-unknown", `animation ${b.k}: ${p} (audit S-09)`); }
    }
    if ((m.body || []).filter(b => b.t === "sim" && b.ready).length > 1) W("sim-many", "more than one animation: the first is shown big near the top, the others stay where they are (one animation per lesson reads best)");
    const draftItems = [...(m.key_points || []), ...(m.phrases || []), ...(m.note || [])].filter(x => x.draft).length + (m.did_you_know && m.did_you_know.draft ? 1 : 0);
    if (drafts || draftItems) E("draft-block", `${drafts} draft blocks and ${draftItems} items with draft:true are left: merge them (design §3.3)`);
    for (const ev of m.evidence || []) {
      if (!EV_LEVELS.includes(ev.level)) E("evidence-level", `evidence for ${ev.for}: level "${ev.level}"`);
      if (!(m.body || []).some(b => b.k === ev.for)) E("evidence-level", `evidence points to "${ev.for}", which is not a body block`);
    }
    if ((m.disclaimer === "medical" || (place.get(id) || {}).block === "mind") && !(m.evidence || []).length && !(m.body || []).some(b => b.t === "evidence"))
      W("evidence-missing", "psychology/health lesson without evidence badges (\"Добре досліджено\" … \"Досвід тренерів\")");
    // quiz
    if ((m.quiz || []).length !== 3) E("quiz-count", `${(m.quiz || []).length} quiz questions shown (must be exactly 3; the rest go to exam_pool)`);
    for (const [list, name] of [[m.quiz || [], "quiz"], [m.exam_pool || [], "exam_pool"]]) for (const q of list) {
      const keys = (q.options || []).map(x => x.k);
      if (typeof q.correct !== "string" || !keys.includes(q.correct)) E("quiz-answer-position", `${name} ${q.k}: the answer must be an option key (${keys.join("/")}), not "${q.correct}"`);
      if (new Set(keys).size !== keys.length) E("quiz-options-repeat", `${name} ${q.k}: option keys repeat`);
      for (const l of ["en", "uk"]) { const t = (q.options || []).map(x => String(x[l] || "").trim().toLowerCase()).filter(Boolean); if (new Set(t).size !== t.length) E("quiz-options-repeat", `${name} ${q.k}: two options have the same ${l} text`); }
      if (q.disc != null && !["sporting", "compak", "both"].includes(q.disc)) E("rule-no-disc", `${name} ${q.k}: disc "${q.disc}"`);
      if (q.rule_ref) refOk(q.rule_ref, q.disc, `${name} ${q.k}`, ctx);
    }
    (m.quiz || []).forEach(q => {
      const i = (q.options || []).findIndex(x => x.k === q.correct); if (i < 0) return;
      quizStats.n++; quizStats.pos[i] = (quizStats.pos[i] || 0) + 1;
      const len = (q.options || []).map(x => String(x.en || "").length), c = len[i], others = len.filter((_, j) => j !== i);
      if (others.length && c > 1.5 * Math.max(...others) && c - Math.max(...others) > 15) W("quiz-answer-length", `quiz ${q.k}: the correct option is much longer than the others (${c} vs ${Math.max(...others)} characters; audit R-05)`);
    });
    if ((m.quiz || []).length === 3 && new Set((m.quiz || []).map(q => (q.options || []).findIndex(x => x.k === q.correct))).size === 1) W("quiz-answer-position", "the 3 shown questions have the correct answer in the same position (audit R-05; the app shuffles, but vary it in the data)");
    // keys and texts
    let hasDigits = false;
    const items = itemsOf(m);
    for (const x of items) {
      if (x.part !== "title" && x.part !== "summary") {
        if (!x.k) E("key-missing", `an item of ${x.part} has no key "k"`);
        else if (keyOwner.has(x.k) && keyOwner.get(x.k) !== id) E("key-duplicate", `key "${x.k}" is also used in ${keyOwner.get(x.k)} (keys are unique in the whole Academy)`);
        else if (keyOwner.get(x.k) === id) E("key-duplicate", `key "${x.k}" is used twice in the lesson`);
        else keyOwner.set(x.k, id);
      }
      if (!hasText(x)) continue;
      if (!x.draft && !["summary"].includes(x.part) && valOf(m, x, "en").st === "missing") E("en-missing", `${x.part} ${x.k}: no English text (English is the master)`);
      const allowNever = x.it && (x.it.t === "warn" || inSafety(id));
      for (const L of LANGS) {
        const r = valOf(m, x, L); if (!r.v) continue;
        const strings = stringsOf(x, r.v);
        if (x.part === "phrase" && L === "en") strings.push(x.it.en);
        for (const s of strings) {
          for (const tk of String(s).matchAll(TOKEN_RE)) { const p = tokenProblem(tk[1], tk[2]); if (p) E("token-dead", `${x.part} ${x.k} (${L}): ${p}`); }
          if (lint.RU_WORD_RE.test(s)) E("lang-words", `${x.part} ${x.k} (${L}): words of the restricted language`);
          if (lint.isSpanish(s, L)) E("lang-spanish", `${x.part} ${x.k} (${L}): looks like Spanish text`);
          if (L === "lt") { const bad = lint.ltLoanword(s); if (bad) W("lt-loanword", `${x.part} ${x.k} (lt): "${bad}" — use "tūtelė", not the Russian-origin loanword`, { lang: "lt" }); }
          if (x.draft) continue; // wording warnings only for finished text
          for (const w of lint.stopWords(stopWordText(s, LABELS_RE[L]), L, { allowNever })) W("stop-word", `${x.part} ${x.k} (${L}): "${w}" — use plain, cautious wording ("many coaches suggest", "you can try")`, { lang: L });
          const who = lint.peopleIn(s); if (who) W("living-people", `${x.part} ${x.k} (${L}): names "${who}" (lessons use fictional people or no names)`, { lang: L });
          if ((L === "en" || L === "uk") && x.part !== "pool") for (const sn of lint.longSentences(s)) W("long-sentence", `${x.part} ${x.k} (${L}): a sentence of ${sn.split(/\s+/).length} words (max 30): "${sn.slice(0, 70)}…"`, { lang: L });
          if (L === "en" && /\d/.test(s) && x.part === "body") hasDigits = true;
          if (L === "en" && FC) { const f = lint.fitascMatch(s, FC); if (f) E("fitasc-verbatim", `${x.part} ${x.k}: ${f.words} words in a row equal to the FITASC text ("${f.text.slice(0, 80)}…"; audit R-01)`); }
        }
        if (L === "en" && strings.some(s => /ClayAway/.test(s)) && m.index !== "preview" && !strings.some(s => /coming|will|planned|being prepared/i.test(s)))
          W("clayaway-wording", `${x.part} ${x.k}: ClayAway is not launched — write about it in the future tense ("coming soon")`);
      }
      if (OVERLAY_LANGS.length && x.k) for (const L of OVERLAY_LANGS) { const r = valOf(m, x, L); if (r.st === "stale" && (x.core || x.part === "title")) W("overlay-stale", `${x.part} ${x.k} (${L}): the English text changed after the translation`, { lang: L }); }
      if (valOf(m, x, "uk").st === "stale") W("uk-stale", `${x.part} ${x.k}: English changed after the Ukrainian was written (h_uk)`, { lang: "uk" });
    }
    if (hasDigits && !(m.sources || []).length && !(m.rule_refs || []).length) W("numbers-no-sources", "numbers or dates in the text but no sources (audit A-10)");
    // overlay keys that are not in the master any more
    const masterKeys = new Set(items.map(x => x.k));
    for (const L of OVERLAY_LANGS) {
      const ov = overlays[L].get(id); if (!ov) continue;
      for (const sec of ["body", "note", "phrases", "key_points", "quiz"]) for (const k of Object.keys(ov[sec] || {})) if (!masterKeys.has(k)) W("overlay-orphan", `i18n/${L}/${id}.json ${sec}.${k}: the key is not in the master any more`, { lang: L });
      if (lint.COUNTRY_RE.test(JSON.stringify(ov)) || lint.FLAG_RE.test(JSON.stringify(ov))) E("lang-country", `i18n/${L}: names the restricted country`);
      if (lint.RU_LETTERS_RE.test(JSON.stringify(ov))) E("lang-letters", `i18n/${L}: letters Ukrainian does not use`);
    }
    // Glossary forms (audit I-08, I-09), warning "term-local-missing". Kept quiet on purpose: only terms that THIS lesson links
    // with a {{term:…}} token, only languages whose glossary has a term_local (conf not "low"), only items whose English text links
    // the term with a token. A translation that links the same term with a token is fine (the token prints the glossary form);
    // otherwise the translation must contain the English term or a stem of term_local / alt. One warning per term, language and lesson.
    const termTok = new Map(); // glossary id → regex of its tokens ({{term:<id or alias>|…}} / {{term:<id>}})
    for (const s of stringsDeep([m.title, m.summary, m.body, m.note, m.phrases, m.key_points, m.did_you_know, m.quiz, m.exam_pool]))
      for (const tk of s.matchAll(TOKEN_RE)) if (tk[1] === "term") { const t = termId(tk[2].split("|")[0]); if (t && GBY[t] && !termTok.has(t)) {
        const ids = [t, ...Object.keys(ALIAS).filter(a => ALIAS[a] === t)]; termTok.set(t, new RegExp(`\\{\\{term:(?:${ids.map(reEsc).join("|")})(?:\\|[^{}]*)?\\}\\}`)); } }
    for (const [t, tokRe] of termTok) {
      const enForms = uniq([GBY[t].term, ...(GBY[t].aka || [])].filter(Boolean));
      for (const L of ["uk", ...OVERLAY_LANGS]) {
        const g = ((GI[L] || {}).terms || {})[t]; if (!g || !g.term_local || g.conf === "low") continue;
        const forms = uniq([g.term_local, ...(g.alt || []), ...enForms].flatMap(f => String(f).split(/[(),;/]/)).map(s => s.trim()).filter(s => s.length > 1));
        const stems = forms.map(f => { const w = f.toLowerCase().split(/\s+/).sort((a, b) => b.length - a.length)[0]; return w.length > 5 ? w.slice(0, -2) : w.length > 3 ? w.slice(0, -1) : w; });
        for (const x of items) {
          if (!hasText(x) || x.draft) continue;
          const en = valOf(m, x, "en"), tr = valOf(m, x, L); if (!en.v || !tr.v) continue;
          if (!stringsOf(x, en.v).some(s => tokRe.test(s))) continue;
          const trs = stringsOf(x, tr.v); if (trs.some(s => tokRe.test(s))) continue;
          const txt = trs.map(s => s.replace(TOKEN_RE, (_, k, a) => k === "term" ? (a.split("|")[1] || localTerm(L, termId(a.split("|")[0]) || a)) : " ")).join(" ").toLowerCase();
          if (!stems.some(st => txt.includes(st))) { W("term-local-missing", `${x.k} (${L}): links "${GBY[t].term}" in English, but the translation has neither a {{term:${t}}} token, the English term nor the glossary form «${g.term_local}»`, { lang: L }); break; }
        }
      }
    }
  }
  for (const m of lessons.values()) checkLesson(m);
  { const top = Object.entries(quizStats.pos).sort((a, b) => b[1] - a[1])[0]; if (top && quizStats.n && top[1] / quizStats.n > 0.5) warn("quiz-answer-position", `${Math.round(100 * top[1] / quizStats.n)}% of all shown quiz answers are option ${"abcdefgh"[top[0]]} (audit R-05)`); }
  // language rules for ui, laws, shared overlays, facts
  for (const [L, s] of Object.entries(ui)) for (const [k, v] of Object.entries(s)) {
    const t = String(v);
    if (lint.COUNTRY_RE.test(t) || lint.FLAG_RE.test(t)) err("lang-country", `ui/${L}.json ${k}: names the restricted country`);
    if (lint.RU_LETTERS_RE.test(t) || lint.RU_WORD_RE.test(t)) err("lang-words", `ui/${L}.json ${k}: text of the restricted language`);
    if (lint.isSpanish(t, L)) err("lang-spanish", `ui/${L}.json ${k}: looks like Spanish text`);
    if (L === "lt") { const bad = lint.ltLoanword(t); if (bad) warn("lt-loanword", `ui/lt.json ${k}: "${bad}" — use "tūtelė", not the Russian-origin loanword`, { lang: "lt" }); }
  }
  for (const [cc, D] of Object.entries(laws)) {
    if (!D) continue;
    const texts = []; const walk = (v, k) => { if (typeof v === "string") { if (!["law", "article", "url"].includes(k)) texts.push(v); } else if (Array.isArray(v)) v.forEach(x => walk(x, k)); else if (isObj(v)) for (const [kk, vv] of Object.entries(v)) walk(vv, kk); };
    walk(D, "");
    for (const t of texts) {
      if (lint.COUNTRY_RE.test(t) || lint.FLAG_RE.test(t)) err("lang-country", `laws/${cc}.json: names the restricted country`);
      if (lint.RU_LETTERS_RE.test(t) || lint.RU_WORD_RE.test(t)) err("lang-words", `laws/${cc}.json: text of the restricted language`);
      if (lint.isSpanish(t)) err("lang-spanish", `laws/${cc}.json: Spanish text outside the "law"/"article" citations: "${t.slice(0, 60)}"`);
    }
    if (D.as_of && /^\d{4}-\d{2}/.test(D.as_of) && D.as_of.slice(0, 7) < String(Number(opt.today.slice(0, 4)) - 1) + opt.today.slice(4, 7)) warn("law-old", `laws/${cc}.json as_of ${D.as_of} is more than a year old: check the official texts`);
  }
  for (const [L, j] of [...Object.entries(shared), ...Object.entries(factsI18n)]) {
    const t = JSON.stringify(j);
    if (lint.COUNTRY_RE.test(t) || lint.FLAG_RE.test(t) || lint.RU_LETTERS_RE.test(t)) err("lang-country", `i18n/${L}: shared texts break the language rule`);
    if (L === "lt") { const bad = lint.ltLoanword(t); if (bad) warn("lt-loanword", `i18n/lt: shared/facts text uses "${bad}" — use "tūtelė"`, { lang: "lt" }); }
  }
  for (const [id, f] of Object.entries(facts)) { if (!/^(?:[a-z0-9-]+\.)?[a-z0-9]+(?:-[a-z0-9]+)+$/.test(id)) warn("fact-id", `fact "${id}": ids are kebab-case with a topic prefix`); if (f.rule_ref) refOk(f.rule_ref, f.scope, `facts.json ${id}`, {}); if (!(f.sources || []).length && !f.rule_ref) warn("numbers-no-sources", `facts.json "${id}" has no sources`); }

  /* =================================================================================================================
     5. What gets built: lessons per language, then blocks, routes, home, practice
     ================================================================================================================= */
  const buildable = m => PUBLISHABLE.includes(m.status) || (opt.draft && m.status === "draft");
  const reviewFlag = m => m.status === "review" || (m.review && m.review.status === "pending") ? "pending" : null;
  const isCore = x => x.core && (!x.draft || opt.draft) && hasText(x);
  const avail = new Map(); // id -> {L: {ok, reason, title, fallback}}
  const plainOf = (text, L) => plain(text, { L, tmSeen: new Set() });
  for (const m of lessons.values()) {
    const A = {};
    for (const L of LANGS) {
      if (!buildable(m)) { A[L] = { ok: false, reason: m.status === "draft" ? "draft" : "status" }; continue; }
      const t = valOf(m, { part: "title", k: "title", it: m.title }, L);
      if (L === "en" || L === "uk") { A[L] = t.v ? { ok: true, title: t.v } : { ok: false, reason: "no-title" }; continue; }
      if (!overlays[L].get(m.id)) { A[L] = { ok: false, reason: "no-overlay" }; continue; }
      let title = t.st === "ok" ? t.v : null, fallback = false;
      if (!title && opt.draft) { // preview only: the translated heading of the absorbed core lesson stands in for the missing title
        const b = (m.body || []).find(b => b.t === "draft" && b.role === "title" && b.core && valOf(m, { part: "body", k: b.k, it: b }, L).st === "ok");
        if (b) { title = valOf(m, { part: "body", k: b.k, it: b }, L).v; fallback = true; }
      }
      if (!title) { A[L] = { ok: false, reason: t.st === "stale" ? "title-stale" : "no-title" }; continue; }
      const bad = itemsOf(m).filter(isCore).find(x => valOf(m, x, L).st !== "ok");
      if (bad) { A[L] = { ok: false, reason: `core-${valOf(m, bad, L).st}`, key: bad.k }; continue; }
      A[L] = { ok: true, title, fallback };
      if (fallback) warn("draft-title-fallback", `${m.id} (${L}): preview uses the heading of the absorbed lesson as the title (the overlay has no title yet)`, { lesson: m.id, lang: L });
    }
    avail.set(m.id, A);
  }
  const lessonBuilt = (id, L) => !!(avail.get(id) && avail.get(id)[L] && avail.get(id)[L].ok);
  const anyLesson = (ids, L) => ids.some(id => lessonBuilt(id, L));
  // shared texts (blocks, sections, routes, stages, games, levels, badges): en/uk in the JSON files, others in i18n/<L>/_shared.json
  const SH = {
    block: (L, b, f) => L === "en" || L === "uk" ? (b[f] || {})[L] || null : ((((shared[L] || {}).blocks || {})[b.id] || {})[f]) || null,
    section: (L, b, s) => L === "en" || L === "uk" ? (s.title || {})[L] || null : (((((shared[L] || {}).blocks || {})[b.id] || {}).sections || {})[s.id]) || null,
    route: (L, r, f) => L === "en" || L === "uk" ? (r[f] || {})[L] || null : ((((shared[L] || {}).routes || {})[r.id] || {})[f]) || null,
    stage: (L, r, st) => L === "en" || L === "uk" ? (st.title || {})[L] || null : (((((shared[L] || {}).routes || {})[r.id] || {}).stages || {})[st.id]) || null,
    cert: (L, r) => L === "en" || L === "uk" ? ((r.certificate || {}).title || {})[L] || null : ((((shared[L] || {}).routes || {})[r.id] || {}).certificate) || null,
    checklist: (L, r) => L === "en" || L === "uk" ? ((r.checklist || {}).title || {})[L] || null : ((((shared[L] || {}).routes || {})[r.id] || {}).checklist) || null,
    game: (L, g) => L === "en" || L === "uk" ? (g.title || {})[L] || null : (((shared[L] || {}).practice || {})[g.id]) || null,
    level: (L, v) => L === "en" || L === "uk" ? (v.title || {})[L] || null : (((shared[L] || {}).levels || {})[v.id]) || null,
    badge: (L, b) => L === "en" || L === "uk" ? (b.title || {})[L] || null : (((shared[L] || {}).badges || {})[b.id]) || null
  };
  for (const L of OVERLAY_LANGS) if (!shared[L] && [...lessons.keys()].some(id => lessonBuilt(id, L)))
    warn("shared-missing", `${L}: no i18n/${L}/_shared.json (titles of blocks, routes and games): home, topic, route and Practice pages are not built in ${L}`, { lang: L });
  const blockLessons = b => b.sections.flatMap(s => s.lessons);
  const routeLessons = r => r.stages.flatMap(s => s.lessons);
  const built = { block: {}, route: {}, home: {}, practice: {}, game: {}, exam: {}, progress: {} };
  for (const b of blocks) built.block[b.id] = Object.fromEntries(LANGS.map(L => [L, !!(SH.block(L, b, "title") && SH.block(L, b, "purpose") && b.sections.every(s => SH.section(L, b, s)) && anyLesson(blockLessons(b), L))]));
  for (const r of routes) built.route[r.id] = Object.fromEntries(LANGS.map(L => [L, !!(SH.route(L, r, "title") && SH.route(L, r, "for") && r.stages.every(st => SH.stage(L, r, st)) && anyLesson(routeLessons(r), L))]));
  for (const L of LANGS) {
    built.home[L] = (L === "en" || L === "uk" || !!shared[L]) && [...lessons.keys()].some(id => lessonBuilt(id, L));
    built.practice[L] = built.home[L]; built.progress[L] = built.home[L];
  }
  for (const g of games) built.game[g.id] = Object.fromEntries(LANGS.map(L => [L, built.practice[L] && !g.external && !g.later && !!SH.game(L, g)]));
  for (const r of routes) built.exam[r.id] = Object.fromEntries(LANGS.map(L => [L, built.route[r.id][L] && !!((r.certificate || {}).exam || (r.badge_only || {}).quiz)]));
  const homeFile = path.join(opt.out, "learn", "index.html");
  const homeKept = !opt.ownHome && existsSync(homeFile) && !readFileSync(homeFile, "utf8").includes(GEN);
  if (homeKept) warn("home-kept", "docs/learn/index.html is hand-written (the Academy app): the build leaves it as it is (use --own-home to let the build write the static home)");
  const idx = flag => flag === "always" ? true : flag === "fitasc" ? opt.fitascIndex : false;
  const lessonIndexed = m => idx(m.index) && m.status !== "draft" && m.status !== "preview";

  /* =================================================================================================================
     6. Rendering helpers
     ================================================================================================================= */
  const U = {
    home: L => `${BASE}${P(L)}learn/`, lesson: (L, id) => `${BASE}${P(L)}learn/${id}/`, block: (L, id) => `${BASE}${P(L)}learn/topics/${id}/`,
    route: (L, id) => `${BASE}${P(L)}learn/routes/${id}/`, exam: (L, id) => `${BASE}${P(L)}learn/routes/${id}/exam/`,
    practice: (L, g) => `${BASE}${P(L)}learn/practice/${g ? g + "/" : ""}`, progress: L => `${BASE}${P(L)}learn/progress/`,
    data: (L, f) => `${BASE}learn/data/${L}/${f}`,
    rule: (L, book, id) => book === "categories" ? `${BASE}rules/${L === "uk" ? "" : "en/"}categories/#${id}`
      : `${BASE}rules/${L === "uk" ? "" : "en/"}${book}/${L === "uk" || L === "en" ? "" : "?lang=" + L}#${id}`,
    trainer: L => `${BASE}rules/trainer/?lang=${L}&from=learn`,
    contacts: L => `https://clayarena.com/${({ uk: "uk-ua", de: "de-de" })[L] || "en"}/contacts/`
  };
  const fileOf = url => url.slice(BASE.length).replace(/[?#].*$/, "") + "index.html";
  const upOf = rel => "../".repeat(rel.split("/").length - 1);
  const ruleLabel = (L, book, id) => {
    const r = RULES[book] && RULES[book].get(id); if (!r) return id;
    const word = CHAPTER[L] || (GUI[L] || {}).ch || CHAPTER.en, name = L === "uk" ? r.uk : r.en;
    return r.chapter ? (L === "uk" || L === "en" ? `${word} ${r.chapter} · ${name}` : `${word} ${r.chapter}`) : name;
  };
  const lessonTitle = (L, id) => { const A = (avail.get(id) || {})[L]; if (A && A.ok) return plainOf(A.title, L); const m = lessons.get(id); if (!m) return id;
    if (L === "en" || L === "uk") return m.title && m.title[L] ? plainOf(m.title[L], L) : null; const ov = overlays[L].get(id); return ov && ov.title ? plainOf(ov.title, L) : null; };
  const factText = (id, L) => { const f = facts[id]; if (!f) return null; if (L === "en" || L === "uk") return (f.text || {})[L] || null; const t = (factsI18n[L] || {})[id]; return t ? (typeof t === "string" ? t : t.text) : null; };
  // token → HTML (or plain text with R.plain): see SCHEMA.md §6
  function token(kind, arg, R) {
    const L = R.L;
    if (kind === "tm") { const full = arg === "sporting" && !R.plain && !R.tmSeen.has("sporting"); if (!R.plain) R.tmSeen.add(arg); /* full name once per page, then short */ const n = arg === "sporting" ? (full ? DISC_NAME.sporting : DISC_SHORT.sporting) : arg === "compak" ? DISC_NAME.compak : arg; return R.plain ? n : esc(n); }
    if (kind === "term") { const [id0, form] = arg.split("|"); const id = anyTermId(id0) || id0; const label = form || localTerm(L, id), u = glossUrl(L, id); return R.plain ? label : u ? `<a class="term" href="${esc(u)}">${esc(label)}</a>` : esc(label); }
    if (kind === "rule") { const i = arg.indexOf(":"), book = arg.slice(0, i), id = arg.slice(i + 1), label = ruleLabel(L, book, id); return R.plain ? label : `<a class="rule" href="${esc(U.rule(L, book, id))}">${esc(label)}</a>`; }
    if (kind === "lesson") {
      const t = lessonTitle(L, arg);
      if (lessonBuilt(arg, L)) return R.plain ? t : `<a href="${esc(U.lesson(L, arg))}">${esc(t)}</a>`;
      if (t) return R.plain ? t : esc(t);
      const en = lessonTitle("en", arg) || arg; warnOnce(`lessontok:${R.m && R.m.id}:${L}:${arg}`, "lesson-link-other-lang", `${R.m ? R.m.id : ""} (${L}): {{lesson:${arg}}} has no version in ${L} yet; the English title is shown`, { lesson: R.m && R.m.id, lang: L });
      return R.plain ? en : `<span lang="en">${esc(en)}</span>`;
    }
    if (kind === "fact") { const t = factText(arg, L); if (t != null) return R.plain ? t : esc(t); const en = factText(arg, "en") || ""; warnOnce(`facttok:${L}:${arg}`, "fact-untranslated", `fact "${arg}" has no ${L} text yet`, { lang: L }); return R.plain ? en : `<span lang="en">${esc(en)}</span>`; }
    return R.plain ? "" : "";
  }
  function inline(text, R) { const s = String(text ?? ""); let out = "", last = 0; for (const t of s.matchAll(TOKEN_RE)) { out += esc(s.slice(last, t.index)) + token(t[1], t[2], R); last = t.index + t[0].length; } return out + esc(s.slice(last)); }
  function plain(text, R) { const s = String(text ?? ""); const Rp = { ...R, plain: true }; return s.replace(TOKEN_RE, (_, k, a) => token(k, a, Rp)); }
  const evBadge = (L, level) => `<span class="st-ev st-ev-${level}" title="${esc(S(L, "evidence"))}">${esc(S(L, "ev_" + level))}</span>`;
  const evAfter = (m, k, L) => (m.evidence || []).filter(e => e.for === k && EV_LEVELS.includes(e.level)).map(e => `<p class="st-ev-line">${evBadge(L, e.level)}</p>`).join("");
  const discBadges = m => (m.disciplines || []).map(d => `<span class="st-badge st-b-disc">${esc(DISC_SHORT[d])}</span>`).join("");
  function lawHtml(b, L) {
    const D = laws[b.country]; if (!D || !Array.isArray(D[b.part])) return "";
    const u = L === "uk", lc = u ? "uk" : "en", T = k => S(L, k), name = D[`country_${lc}`] || "";
    const link = x => x.url ? `<a href="${esc(x.url)}" rel="${isFitasc(x.url) ? "nofollow noopener noreferrer" : "noopener noreferrer"}">${esc(x.law)}${x.article && x.article !== "—" ? ", " + esc(x.article) : ""} ↗</a>` : esc(x.law || "—");
    const unv = x => x.verified === false ? ` <span class="st-unv">${esc(T("law_unverified"))}</span>` : "";
    let title, head, rows;
    if (b.part === "states") { title = T("law_title_de_states"); head = [T("law_col_state"), T("law_col_norm"), T("law_col_banned"), T("law_col_since")];
      rows = D.states.map(x => `<tr><td><b>${esc(x[`state_${lc}`])}</b><br><small>${esc(x.state_de || "")}</small></td><td>${link(x)}</td><td>${esc(x[`rule_${lc}`])}${unv(x)}</td><td>${esc(x.since || "—")}</td></tr>`); }
    else if (b.part === "lead") { title = `${name}: ${T("law_title_lead")}`; head = [T("law_col_where"), T("law_col_norm"), T("law_col_applies"), T("law_col_since")];
      rows = D.lead.map(x => `<tr><td><b>${esc(x[`scope_${lc}`])}</b></td><td>${link(x)}</td><td>${esc(x[`rule_${lc}`])}${unv(x)}</td><td>${esc(x.since || "—")}</td></tr>`); }
    else { title = `${name}: ${T("law_title_travel")}`; head = [T("law_col_topic"), T("law_col_norm"), T("law_col_applies")];
      rows = D.travel.map(x => `<tr><td><b>${esc(x[`topic_${lc}`] || x[`scope_${lc}`] || "")}</b></td><td>${link(x)}</td><td>${esc(x[`rule_${lc}`])}${unv(x)}</td></tr>`); }
    return `<section class="st-law"><h3>${esc(title)}</h3><p class="st-small">${esc(D[`note_${lc}`] || "")} (${esc(D.as_of || "")})</p><div class="table-wrap st-tw"><table><thead><tr>${head.map(h => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${rows.join("")}</tbody></table></div></section>`;
  }
  // Inner HTML of a body block: what the lesson JSON carries in "html" (docs/learn/app/academy.js blockHtml() adds the wrapper).
  // steps → [html], compare → {sporting, compak}, law → the whole table, figure → <img> + <figcaption>, other types → inline HTML.
  function blockInner(b, v, R) {
    switch (b.t) {
      case "steps": return (Array.isArray(v) ? v : [v]).map(s => inline(s, R));
      case "compare": return { sporting: inline(v.sporting, R), compak: inline(v.compak, R) };
      case "figure": return `<img src="${esc(b.src)}" alt="${esc(plain(v, R))}" loading="lazy" decoding="async"${b.width ? ` width="${+b.width}" height="${+b.height}"` : ""}><figcaption>${inline(v, R)} · © ${esc(b.author)} · ${esc(b.license)}</figcaption>`;
      default: return inline(v, R);
    }
  }
  const refLink = (L, ref) => { const i = ref.indexOf(":"), book = ref.slice(0, i), rid = ref.slice(i + 1); return `<p class="st-ref"><a href="${esc(U.rule(L, book, rid))}">${esc(S(L, "rules_where"))}: ${esc(ruleLabel(L, book, rid))}</a></p>`; };
  // The same block as static HTML of the page (readable without JavaScript; the app re-renders #app from the JSON).
  function blockStatic(b, inner, R, o = {}) {
    const L = R.L, id = b.anchor ? ` id="${esc(b.anchor)}"` : "", lg = o.lang ? ` lang="${o.lang}"` : "", ref = b.rule_ref ? refLink(L, b.rule_ref) : "";
    const disc = b.disc === "sporting" || b.disc === "compak" ? `<div class="st-disc">${esc(DISC_NAME[b.disc])}</div>` : "";
    let h;
    switch (b.t) {
      case "h": h = `<h2 id="${esc(b.anchor || b.k)}"${lg}>${inner}</h2>`; break; // heading: anchor (old lesson id) or its key
      case "steps": h = `<ol class="st-steps"${id}${lg}>${inner.map(s => `<li>${s}</li>`).join("")}</ol>`; break;
      case "tip": h = `<aside class="st-tip"${id}${lg}>${disc}<p><b>${esc(S(L, "tip"))}</b> ${inner}</p>${ref}</aside>`; break;
      case "warn": h = `<aside class="st-warn" role="note"${id}${lg}>${disc}<p><b>${esc(S(L, "warn"))}</b> ${inner}</p>${ref}</aside>`; break;
      case "rule": h = `<div class="st-rule"${id}${lg}>${disc}<p>${inner}</p>${ref}</div>`; break;
      case "compare": h = `<div class="st-compare"${id}${lg}><div><div class="st-disc">${esc(DISC_NAME.sporting)}</div><p>${inner.sporting}</p></div><div><div class="st-disc">${esc(DISC_NAME.compak)}</div><p>${inner.compak}</p></div></div>${ref}`; break;
      case "figure": h = `<figure${id}${lg}>${inner}</figure>`; break;
      case "draft": h = `<div class="st-draft"${b.role === "title" ? "" : id}><div class="st-draft-h">Draft · ${esc(b.role || "")} · ${esc(b.from || "")}${b.core ? " · core" : ""}</div>${b.role === "title" ? `<h2${id}${lg}>${inner}</h2>` : `<p${lg}>${inner}</p>`}</div>`; break;
      default: h = `<p${id}${lg}>${disc ? `<span class="st-badge st-b-disc">${esc(DISC_SHORT[b.disc])}</span> ` : ""}${inner}</p>${ref}`;
    }
    return o.upd ? `<div class="st-upd" lang="en"><p class="st-upd-note" lang="${L}">${esc(S(L, "translation_updating"))}</p>${h}</div>` : h;
  }

  /* ---------- the lesson's animation, shown big near the top (owner's decision, 10.2026) ----------
     simShown(b): a sim block that is published (ready:true and a type, preset and keys that docs/shared/sims.js knows).
     heroOrder(m): the body in display order — the first shown animation moves to just after the first paragraph (t:"p"); with no
     paragraph it opens the lesson. The master keeps the editors' order; the page, the lesson JSON and the app all get this order.
     Other animations of the same lesson (warning "sim-many") stay where they are.
     heroOf(m, b, L, R): its heading ("▶ " + ui anim_h_<kind>, kind = sims.js kind()) and its one line of "what to watch": en/uk from the
     master (b.en / b.uk); the 9 other languages from the overlay body[k] when it was translated from the current English (its hash),
     else the generic caption of that kind (ui anim_w_<kind>, 11 languages). A caption that falls back to the generic one is counted
     (SIM_CAP) and reported once per language as the warning "sim-caption" (missing or stale overlay entries, with the lesson ids), so
     the 24 captions go into the next translation wave; they are not `core`, so an untranslated caption never holds a page back.
     The page markup: figure.st-anim > p.st-anim-h + div.st-sim (data-clay-sim) + figcaption; the app (academy.js simHero) draws the
     same from the lesson JSON (hero, kind, heading, html). Without JavaScript the static CSS hides the figure (its div stays empty);
     when the lesson data cannot load, academy.js mounts it from data-clay-sim (staticSims). */
  const simShown = b => b.t === "sim" && !!b.ready && !simProblem(b.sim);
  const heroOrder = m => { const body = (m.body || []).slice(), i = body.findIndex(simShown); if (i < 0) return body;
    const [s] = body.splice(i, 1), p = body.findIndex(x => x.t === "p"); body.splice(p < 0 ? 0 : p + 1, 0, s); return body; };
  const SIM_CAP = {}; // language → {missing: [lesson ids], stale: [lesson ids]} of animation captions shown as the generic caption
  function heroOf(m, b, L, R) {
    const kind = simKind(b.sim), heading = S(L, "anim_h_" + kind);
    let cap = L === "en" || L === "uk" ? b[L] : null;
    if (!nonEmpty(cap) && OVERLAY_LANGS.includes(L) && nonEmpty(b.en)) { const ov = overlays[L].get(m.id), v = ov && (ov.body || {})[b.k];
      if (nonEmpty(v) && (ov.h || {})[b.k] === sha8(b.en)) cap = v;
      else { const sc = SIM_CAP[L] = SIM_CAP[L] || { missing: [], stale: [] }; (nonEmpty(v) ? sc.stale : sc.missing).push(m.id); } }
    const capHtml = nonEmpty(cap) ? inline(cap, R) : esc(S(L, "anim_w_" + kind)), hid = `anim-${b.k}`;
    const html = `<figure class="st-anim" aria-labelledby="${esc(hid)}"${b.anchor ? ` id="${esc(b.anchor)}"` : ""}><p class="st-anim-h" id="${esc(hid)}"><span aria-hidden="true">▶</span> ${esc(heading)}</p><div class="st-sim" data-clay-sim="${esc(JSON.stringify(b.sim))}"></div><figcaption>${capHtml}</figcaption></figure>`;
    return { kind, heading, cap: capHtml, html };
  }
  const animMark = L => `<span class="st-badge st-b-anim">▶ ${esc(S(L, "anim_marker"))}</span>`; // lesson cards of topic and route pages

  /* ---------- view(m, L): everything a lesson shows in language L (shared by the page and the lesson JSON) ---------- */
  const views = new Map();
  function view(m, L) {
    const key = m.id + "|" + L; if (views.has(key)) return views.get(key);
    const R = { L, m, tmSeen: new Set() }, A = avail.get(m.id)[L];
    const V = { L, title: plain(A.title, R), body: [], notes: [], phrases: [], kps: [], dyk: null, quiz: [], more: 0, hasSim: false, anchors: new Set(), quizHidden: false };
    const vis = x => { // visible text of item x, or null (counted in "more in English")
      const r = valOf(m, x, L);
      if (r.st === "missing") { if (L !== "en") V.more++; return null; }
      if (r.st === "stale" && OVERLAY_LANGS.includes(L)) {
        if (m.critical || (x.it && x.it.critical)) return { v: valOf(m, x, "en").v, lang: "en", upd: true };
        warnOnce(`stale:${m.id}:${L}:${x.k}`, "overlay-stale", `${m.id} ${x.k} (${L}): shown in the old translation; the English text changed`, { lesson: m.id, lang: L });
      }
      return { v: r.v };
    };
    const push = (b, inner, html, t = {}) => { V.body.push({ b, inner, html, text: t.v, lang: t.lang || null, upd: !!t.upd, hero: t.hero || null }); if (b.anchor) V.anchors.add(b.anchor); };
    const sum = valOf(m, { part: "summary", k: "summary", it: m.summary }, L);
    for (const b of heroOrder(m)) { // display order: the animation right after the first paragraph
      if (b.t === "draft" && !opt.draft) continue;
      if (b.t === "sim") { if (simShown(b)) { const h = heroOf(m, b, L, R); V.hasSim = true; push(b, h.cap, h.html, { hero: h }); } continue; }
      if (b.t === "law") { if (L === "en" || L === "uk") { const h = lawHtml(b, L); push(b, h, h); } else V.more++; continue; }
      if (b.t === "evidence") { push(b, "", `<p class="st-ev-line">${evBadge(L, b.level)}</p>`); continue; }
      if (b.t === "fact") { const t = factText(b.fact, L); if (t == null) { V.more++; continue; } const h = inline(t, R); push(b, h, `<div class="st-fact"${b.anchor ? ` id="${esc(b.anchor)}"` : ""}><p>${h}</p></div>`); continue; }
      if (b.t === "draft" && !nonEmpty(b.en)) { // animation or law table of an absorbed lesson (preview only)
        const inner = b.sim ? `<code>${esc(JSON.stringify(b.sim))}</code>` : b.country && (L === "en" || L === "uk") ? lawHtml(b, L) : "";
        push(b, inner, `<div class="st-draft"><div class="st-draft-h">Draft · ${esc(b.role || "")} · ${esc(b.from || "")}</div>${inner}</div>`); continue;
      }
      const t = vis({ part: "body", k: b.k, it: b }); if (!t) continue;
      const inner = blockInner(b, t.v, R);
      push(b, inner, blockStatic(b, inner, R, t) + evAfter(m, b.k, L), t);
    }
    for (const x of m.note || []) { if (x.draft && !opt.draft) continue; const t = vis({ part: "note", k: x.k, it: x }); if (t) V.notes.push({ x, html: inline(t.v, R), lang: t.lang }); }
    for (const x of m.phrases || []) { if (x.draft && !opt.draft) continue; const t = vis({ part: "phrase", k: x.k, it: x });
      if (t) V.phrases.push({ x, meaning: inline(t.v.meaning, R), say: t.v.say ? inline(t.v.say, R) : null, meaningText: plain(t.v.meaning, R), sayText: t.v.say ? plain(t.v.say, R) : null, lang: t.lang }); }
    for (const x of m.key_points || []) { if (x.draft && !opt.draft) continue; const t = vis({ part: "kp", k: x.k, it: x }); if (t) V.kps.push({ x, html: inline(t.v, R), lang: t.lang }); }
    if (m.did_you_know && (!m.did_you_know.draft || opt.draft)) { const t = vis({ part: "dyk", k: m.did_you_know.k, it: m.did_you_know }); if (t) V.dyk = { k: m.did_you_know.k, html: inline(t.v, R), lang: t.lang }; }
    const qs = (m.quiz || []).map(q => ({ q, r: valOf(m, { part: "quiz", k: q.k, it: q }, L) }));
    if (qs.length && qs.every(({ r }) => r.st === "ok" || (r.st === "stale" && !m.critical))) V.quiz = qs.map(({ q, r }) => ({ q, v: r.v }));
    else V.quizHidden = qs.length > 0;
    const firstP = V.body.find(x => x.text && typeof x.text === "string");
    // Stale summary of a critical lesson (safety, rules, anti-doping): use the English summary for meta description/OG/Twitter/
    // JSON-LD, same rule as critical body paragraphs above (vis()) — never show an outdated critical summary in the old language.
    V.desc = sum.st === "ok" ? plain(sum.v, R)
      : sum.st === "stale" ? plain((m.critical ? valOf(m, { part: "summary", k: "summary", it: m.summary }, "en") : sum).v, R)
      : firstP ? plain(firstP.text, R) : `${V.title} — ${academyName(L)}`;
    if (sum.st !== "ok" && sum.st !== "stale") warnOnce(`sum:${m.id}:${L}`, "summary-missing", `${m.id} (${L}): no summary; the meta description uses the first paragraph`, { lesson: m.id, lang: L });
    if (V.desc.length > 300) V.desc = V.desc.slice(0, 297).replace(/\s+\S*$/, "") + "…";
    V.terms = uniq((m.terms || []).map(anyTermId).filter(Boolean)).map(id => ({ id, en: enTerm(id), local: localTerm(L, id), url: glossUrl(L, id) }));
    V.refs = uniq((m.rule_refs || []).map(r => r.book + ":" + r.id)).map(s => { const i = s.indexOf(":"), book = s.slice(0, i), id = s.slice(i + 1); return { book, id, label: ruleLabel(L, book, id), url: U.rule(L, book, id) }; }).filter(r => RULES[r.book] && RULES[r.book].has(r.id));
    V.sources = (m.sources || []).filter(s => s.url).map(s => { const t = isObj(s.title) ? (s.title[L] || s.title.en) : s.title; return { title: t || s.url, lang: isObj(s.title) && !s.title[L] ? "en" : null, url: s.url, fitasc: isFitasc(s.url), checked: s.checked || null, license: s.license || null }; });
    V.R = R;
    views.set(key, V);
    return V;
  }

  /* ---------- page shell: the page contract of docs/learn/app/academy.js ----------
     <link academy.css> · <header id="acTop"> · <main id="app"> static content </main> · <footer id="acFoot"> · #acLive · #acToast · scripts (defer):
     shared/nav.js, shared/sims.min.js (= shared/sims.js minified, minifySims()), shared/progress.js, learn/app/academy.js. The app replaces #app when its data has loaded;
     without JavaScript (and for crawlers and share previews) the static content below is the page. Static classes are st-*,
     the app's are ac-*: the inline CSS below styles only the static content. The animation box (figure.st-anim) is hidden while its
     div.st-sim is empty: without JavaScript there is nothing to play, so no "▶ Watch …" heading over an empty box; academy.js replaces
     the static content, or mounts the box from data-clay-sim when the lesson data cannot load (staticSims). */
  const CSS = `body{background:#030712;color:#F3F4F6}
.st-top{max-width:1040px;margin:0 auto;padding:10px 16px;display:flex;gap:8px 14px;align-items:center;flex-wrap:wrap;font-size:13px;border-bottom:1px solid rgba(255,255,255,.1)}
.st-crumbs{color:#9CA3AF}.st-crumbs a{color:#9CA3AF}.st-crumbs a:hover{color:#F3F4F6}.st-sp{flex:1}
.st-langs{display:flex;gap:6px;flex-wrap:wrap}.st-langs a{font-size:12px;padding:3px 9px;border:1px solid rgba(255,255,255,.1);border-radius:999px;text-decoration:none;color:#D1D5DB}.st-langs a[aria-current]{border-color:#34D399;color:#34D399}
.st{max-width:780px;margin:0 auto;padding:20px 16px 40px;overflow-wrap:break-word}.st.st-wide{max-width:1040px}.st p,.st li{color:#D1D5DB}.st h2{margin:30px 0 10px}
.st-body p{font-size:17px;line-height:1.75;max-width:72ch}.st-lead{font-size:18px}.st-small,.st-ref{font-size:13px;color:#9CA3AF!important}.st-ref a{color:#9CA3AF}
.st-meta{font-size:13px;color:#9CA3AF;display:flex;gap:6px 10px;flex-wrap:wrap;align-items:center;margin:4px 0}
.st-badge{display:inline-block;font-size:12px;font-weight:600;line-height:1.5;padding:1px 9px;border-radius:999px;border:1px solid rgba(255,255,255,.18);color:#D1D5DB;text-decoration:none}
.st-b-disc{border-color:rgba(34,211,238,.45);color:#22D3EE}.st-b-review{border-color:rgba(251,191,36,.55);color:#FBBF24}.st-b-soon{border-color:rgba(251,146,60,.55);color:#FB923C}.st-b-star{border-color:rgba(52,211,153,.55);color:#34D399}
.st-box,.st-kp,.st-dyk,.st-fact,.st-rule,.st-compare>div,.st-list>li,.st-card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:12px 16px;margin:16px 0}
.st-rule{border-left:4px solid #22D3EE}.st-warn{border:1px solid rgba(251,146,60,.55);border-left:4px solid #FB923C;background:rgba(251,146,60,.07);border-radius:12px;padding:10px 14px;margin:16px 0}
.st-tip{border-left:4px solid #34D399;background:rgba(52,211,153,.06);border-radius:12px;padding:10px 14px;margin:16px 0}
.st-compare{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:10px;margin:16px 0}.st-compare>div{margin:0}@media(max-width:640px){.st-compare{grid-template-columns:minmax(0,1fr)}}
.st-disc{font-size:12px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:#22D3EE;margin-bottom:4px}
.st-ev{display:inline-block;font-size:12px;font-weight:600;padding:1px 9px;border-radius:999px;border:1px solid currentColor}.st-ev-strong{color:#34D399}.st-ev-some{color:#22D3EE}.st-ev-little{color:#FBBF24}.st-ev-coaches{color:#C4B5FD}.st-ev-line{margin:-8px 0 14px}
.st-upd{border-left:3px solid #FBBF24;padding-left:12px}.st-upd-note{font-size:12px;color:#FBBF24!important;margin:0}.st-unv{color:#FB923C;font-size:12px}
.st-draft{border:2px dashed rgba(251,191,36,.6);border-radius:12px;padding:6px 12px;margin:14px 0;background:rgba(251,191,36,.05)}.st-draft-h{font:600 11px/1.5 ui-monospace,Consolas,monospace;color:#FBBF24;text-transform:uppercase;letter-spacing:.05em}
.st-banner{border:1px solid rgba(251,191,36,.55);background:rgba(251,191,36,.08);color:#FBBF24!important;border-radius:12px;padding:10px 14px;margin:12px 0;font-size:14px}
.st details{border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:2px 16px;margin:16px 0;background:rgba(255,255,255,.04)}.st details>summary{cursor:pointer;font-weight:700;padding:9px 0}.st details details{background:transparent;padding:0 12px}
.st-ph{margin:0}.st-ph q{font-weight:700;color:#F3F4F6;quotes:none}.st-q{margin:14px 0}.st-opts{list-style:upper-alpha;padding-left:22px}
.st-tw{overflow-x:auto;border:1px solid rgba(255,255,255,.1);border-radius:12px;margin:10px 0}.st table{border-collapse:collapse;width:100%;font-size:14px}.st td,.st th{border-bottom:1px solid rgba(255,255,255,.1);padding:8px 10px;text-align:left;vertical-align:top}.st th{font-size:12px;color:#9CA3AF}
.st-chips{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0;padding:0;list-style:none}.st-chips a,.st-chips span{font-size:13px;padding:3px 10px;border:1px solid rgba(255,255,255,.1);border-radius:999px;text-decoration:none;color:#D1D5DB}
.st-list{list-style:none;padding:0;margin:0;display:grid;gap:10px}.st-list>li{margin:0}.st-list>li>a{font-weight:700;text-decoration:none;font-size:17px}.st-list p{margin:4px 0 0;font-size:14.5px}
.st-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(230px,100%),1fr));gap:12px;margin:12px 0}.st-card{display:block;margin:0;text-decoration:none;color:#F3F4F6}a.st-card:hover{border-color:rgba(52,211,153,.6)}.st-card b{display:block;font-size:17px;margin-bottom:2px}.st-card span{display:block;font-size:13.5px;color:#9CA3AF}
.st-stages>li{margin:18px 0}.st-soon{color:#9CA3AF}
.st-cta{display:flex;gap:8px;flex-wrap:wrap;margin:24px 0}.st-btn{border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.05);border-radius:10px;padding:8px 14px;font-weight:600;font-size:14px;text-decoration:none;color:#F3F4F6}.st-btn.st-primary{background:#059669;border-color:#059669;color:#fff}
.st figure{margin:16px 0}.st figure img{max-width:100%;height:auto;border-radius:12px}.st figcaption{font-size:12.5px;color:#9CA3AF}.st-more{font-size:14px;color:#9CA3AF!important}
.st figure.st-anim{margin:22px 0;padding:14px 16px;border:1px solid rgba(52,211,153,.35);border-radius:14px;background:rgba(52,211,153,.05)}.st-anim-h{font-size:19px;font-weight:700;color:#34D399!important;margin:0 0 6px}.st-anim figcaption{font-size:14.5px;color:#D1D5DB}.st-b-anim{border-color:rgba(52,211,153,.55);color:#34D399}
.st figure.st-anim:has(.st-sim:empty){display:none}
.st-foot{max-width:1040px;margin:0 auto;padding:14px 16px 56px;border-top:1px solid rgba(255,255,255,.1)}.st-foot p{font-size:12.5px;color:#9CA3AF}.st-foot a{color:#9CA3AF}
@media print{.st-top,.st-langs,.st-cta{display:none}}`;
  const PAGES = new Map(); // site-relative file → {url, L, kind, html, title, h1, desc, index, alts, lesson, img}
  const footer = L => `<p>${esc(ui[L].footer ? S(L, "footer") : ui[L].disclaimer ? S(L, "disclaimer") : S(L, "footer"))}</p>${legal(L)}`;
  function shell(pg) { // pg: {L, url, title, desc, index, alts:[{l,url}], ogType, img, ld:[], crumbs:[{name,url}], body, wide, data, kind, lesson}
    const rel = fileOf(pg.url), up = upOf(rel), L = pg.L;
    if (L === "uk") for (const k of ["title", "desc", "h1", "ogTitle"]) if (pg[k] != null) pg[k] = ukApos(pg[k]); // ’ (redirect stubs reuse these)
    const alts = pg.alts || [];
    const hreflang = alts.length ? alts.map(a => `<link rel="alternate" hreflang="${a.l}" href="${esc(a.url)}">`).join("\n") + (alts.some(a => a.l === "en") ? `\n<link rel="alternate" hreflang="x-default" href="${esc(alts.find(a => a.l === "en").url)}">` : "") : "";
    const crumbs = (pg.crumbs || []).map((c, i, a) => i < a.length - 1 && c.url ? `<a href="${esc(c.url)}">${esc(c.name)}</a>` : `<span>${esc(c.name)}</span>`).join(" › ");
    const langs = alts.length > 1 ? `<nav class="st-langs" aria-label="${esc(S(L, "language"))}">${alts.map(a => `<a href="${esc(a.url)}" hreflang="${a.l}" lang="${a.l}" data-setlang="${a.l}"${a.l === L ? ' aria-current="true"' : ""}>${esc(LANG_NAME[a.l])}</a>`).join("")}</nav>` : "";
    const robots = pg.index ? "index, follow, max-image-preview:large" : "noindex, follow";
    const html = `<!doctype html>
<html lang="${L}">
<head>
<meta charset="utf-8">
<!-- ${GEN}: do not edit; edit content/academy/ and run the build -->
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(pg.title)}</title>
<meta name="description" content="${esc(pg.desc)}">
<meta name="robots" content="${robots}">
<link rel="canonical" href="${esc(pg.url)}">
${hreflang}
<meta property="og:type" content="${pg.ogType || "article"}"><meta property="og:site_name" content="ClayArena">
<meta property="og:title" content="${esc(pg.ogTitle || pg.title)}"><meta property="og:description" content="${esc(pg.desc)}">
<meta property="og:url" content="${esc(pg.url)}"><meta property="og:image" content="${esc(pg.img)}">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:type" content="image/png">
<meta property="og:locale" content="${OG_LOCALE[L]}">${alts.filter(a => a.l !== L).map(a => `<meta property="og:locale:alternate" content="${OG_LOCALE[a.l]}">`).join("")}
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(pg.ogTitle || pg.title)}"><meta name="twitter:description" content="${esc(pg.desc)}"><meta name="twitter:image" content="${esc(pg.img)}">
<meta name="theme-color" content="#030712"><link rel="icon" type="image/png" href="${up}og/favicon.png"><link rel="apple-touch-icon" href="${up}og/apple-touch-icon.png">
${(pg.ld || []).map(x => `<script type="application/ld+json">${JSON.stringify(x).replace(/</g, "\\u003c")}</script>`).join("\n")}
<link rel="stylesheet" href="${up}learn/app/academy.css">
<style>${CSS}</style>
</head>
<body data-academy="${esc(JSON.stringify(pg.data || {}))}">
<header id="acTop"><div class="st-top"><nav class="st-crumbs" aria-label="${esc(S(L, "breadcrumbs"))}">${crumbs}</nav><span class="st-sp"></span>${langs}</div></header>
<main id="app"><div class="st${pg.wide ? " st-wide" : ""}">
${pg.body}
</div></main>
<footer id="acFoot"><div class="st-foot">${footer(L)}</div></footer>
<div id="acLive" class="ac-sr" aria-live="polite"></div>
<div id="acToast" class="ac-toast" role="status" aria-live="polite"></div>
<script src="${up}shared/nav.js" defer></script>
<script src="${up}shared/sims.min.js" defer></script>
<script src="${up}shared/progress.js" defer></script>
<script src="${up}learn/app/academy.js" defer></script>
</body>
</html>
`;
    PAGES.set(rel, { ...pg, rel, html: L === "uk" ? ukOut(html) : html, robots });
  }
  const fitTitle = (t, L, ctx) => { const full = ctx ? `${t} · ${ctx} — ${academyName(L)}` : `${t} — ${academyName(L)}`; return full.length <= 65 ? full : (ctx && `${t} — ${academyName(L)}`.length <= 65 ? `${t} — ${academyName(L)}` : `${t} | ClayArena`); };
  const homeCrumb = L => built.home[L] ? { name: academyName(L), url: U.home(L) } : null;
  // plural forms from ui keys <base>_one|_few|_many|_other (the same keys the app uses), else "<n> <word>"
  const plural = (L, base, n, word) => { let c = "other"; try { c = new Intl.PluralRules(L).select(n); } catch (e) {} const k = `${base}_${c}`;
    return ui[L][k] || ui[L][`${base}_other`] ? S(L, ui[L][k] ? k : `${base}_other`, { n }) : ui.en[`${base}_other`] && L === "en" ? S(L, `${base}_other`, { n }) : `${n} ${S(L, word)}`; };
  const nLessons = (L, n) => plural(L, "n_lessons", n, "lessons_n");
  const ld = {
    org: { "@type": "Organization", name: "ClayArena", url: "https://clayarena.com/" },
    crumbs: list => { const it = list.filter(Boolean); return it.length >= 2 ? { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: it.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: c.url })) } : null; }
  };

  // From here on the shared texts are shown: render their tokens ({{tm:…}} etc.) as plain text (catalog strings and headings are plain).
  for (const k of Object.keys(SH)) { const raw = SH[k]; SH[k] = (...a) => { const v = raw(...a); return v == null ? null : plainOf(v, a[0]); }; }

  /* ---------- OG pictures: 22 per language (home, practice, 13 blocks, 7 routes); a lesson uses its block picture ---------- */
  const OG = new Map(); // "L|key" → {file, ...card}
  const wrap = (s, n, max) => { const out = []; let line = ""; for (const w of String(s).split(/\s+/)) { if ((line + " " + w).trim().length > n && line) { out.push(line); line = w; } else line = (line + " " + w).trim(); } if (line) out.push(line); if (out.length > max) { out.length = max; out[max - 1] = out[max - 1].replace(/\s*\S*$/, "") + "…"; } return out; };
  for (const L of LANGS) {
    if (!built.home[L]) continue;
    const fx = L === "uk" ? ukApos : s => s; // ’ in the Ukrainian pictures too
    const eye = fx(academyName(L).toUpperCase()), card = (key, kind, title, sub) => OG.set(`${L}|${key}`, { file: `og/${L}/learn-${key}.png`, lang: L, kind, eyebrow: eye, title: wrap(fx(tm(title)), 16, 3), sub: wrap(fx(tm(sub)), 42, 2) });
    card("home", "home", S(L, "home_hero_h1"), routes.filter(r => r.primary).map(r => SH.route(L, r, "title")).filter(Boolean).join(" · "));
    card("practice", "practice", S(L, "practice"), games.filter(g => !g.later && !g.external).map(g => SH.game(L, g)).filter(Boolean).join(" · "));
    for (const b of blocks) if (SH.block(L, b, "title")) card(b.id, "block", SH.block(L, b, "title"), SH.block(L, b, "purpose") || "");
    for (const r of routes) if (SH.route(L, r, "title")) card(`route-${r.id}`, "route", SH.route(L, r, "title"), SH.route(L, r, "for") || "");
  }
  const ogImg = (L, key) => { const x = OG.get(`${L}|${key}`) || OG.get(`en|${key}`); if (x && !OG.has(`${L}|${key}`)) warnOnce(`og:${L}`, "og-fallback", `${L}: no localised share pictures yet (no home in ${L}): pages use the English pictures`, { lang: L }); return x ? BASE + x.file : `${BASE}og/learn.png`; };

  /* =================================================================================================================
     7. Pages
     ================================================================================================================= */
  const routesOf = id => routes.filter(r => routeLessons(r).includes(id) || (r.extras || []).includes(id));
  const nextInBlock = (id, L) => { const pl = place.get(id); if (!pl) return null; const ids = blockLessons(blockById[pl.block]); for (let i = ids.indexOf(id) + 1; i < ids.length; i++) if (lessonBuilt(ids[i], L)) return ids[i]; return null; };
  // lesson pages
  for (const m of lessons.values()) for (const L of LANGS) {
    if (!lessonBuilt(m.id, L)) continue;
    const V = view(m, L), R = V.R, pl = place.get(m.id), b = blockById[pl.block], sec = b.sections.find(s => s.id === pl.section);
    const url = U.lesson(L, m.id), alts = LANGS.filter(l => lessonBuilt(m.id, l)).map(l => ({ l, url: U.lesson(l, m.id) }));
    const bt = SH.block(L, b, "title"), st = SH.section(L, b, sec), blockUrl = built.block[b.id][L] ? U.block(L, b.id) : null;
    const isDraft = m.status === "draft", index = lessonIndexed(m), review = reviewFlag(m) === "pending";
    const title = tm(V.title);
    const crumbs = [homeCrumb(L), blockUrl ? { name: tm(bt), url: blockUrl } : null, blockUrl && st && st !== bt ? { name: tm(st), url: `${blockUrl}#${sec.id}` } : null, { name: title, url }].filter(Boolean);
    const next = nextInBlock(m.id, L);
    const terms = V.terms.map(t => `<li>${t.url ? `<a href="${esc(t.url)}" title="${esc(t.en)}">${esc(t.local)}</a>` : `<span title="${esc(t.en)}">${esc(t.local)}</span>`}</li>`).join("");
    const notesBy = {}; for (const n of V.notes) (notesBy[n.x.for || "interpreter"] ||= []).push(n);
    const noteLabel = f => S(L, f === "interpreter" ? "for_interpreter" : `for_${f}`);
    const qref = q => { if (!q.rule_ref) return ""; const i = q.rule_ref.indexOf(":"), bk = q.rule_ref.slice(0, i), rid = q.rule_ref.slice(i + 1); return `<p class="st-ref"><a href="${esc(U.rule(L, bk, rid))}">${esc(ruleLabel(L, bk, rid))}</a></p>`; };
    const quiz = V.quiz.length ? `<details class="st-quiz"><summary>${esc(S(L, "quiz"))} · ${plural(L, "n_questions", V.quiz.length, "question")}</summary><ol>${V.quiz.map(({ q, v }) => `<li class="st-q" data-k="${esc(q.k)}"><p>${inline(v.q, R)}</p><ol class="st-opts">${(q.options || []).map(op => `<li>${inline(v.options[op.k], R)}</li>`).join("")}</ol><details><summary>${esc(S(L, "answer"))}</summary><p><b>${inline(v.options[q.correct], R)}</b></p><p>${inline(v.explain, R)}</p>${qref(q)}</details></li>`).join("")}</ol></details>` : "";
    const brief = opt.draft && m.brief && m.brief.points && (m.brief.points[L] || m.brief.points.en) ? `<div class="st-draft"><div class="st-draft-h">${esc(S(L, "brief"))} · ${esc(m.plan || "")}</div><ul>${(m.brief.points[L] || m.brief.points.en).map(p => `<li>${esc(p)}</li>`).join("")}</ul></div>` : "";
    const hasLaw = (m.body || []).some(x => x.t === "law");
    const body = `<article class="st-body" id="lesson">
<div class="st-meta">${bt ? `<span>${esc(tm(bt))}</span>` : ""}<span>${m.minutes || 5} ${esc(S(L, "min"))}</span>${m.level === 1 ? `<span class="st-badge st-b-star">★ ${esc(S(L, "start_here"))}</span>` : `<span class="st-badge">${esc(S(L, "go_deeper"))}</span>`}${discBadges(m)}${review ? `<span class="st-badge st-b-review" title="${esc(S(L, "review_pending_d"))}">${esc(S(L, "review_pending"))}</span>` : ""}${m.index === "preview" ? `<span class="st-badge st-b-soon">${esc(S(L, "clayaway_coming"))}</span>` : ""}</div>
<h1>${esc(title)}</h1>
${isDraft ? `<p class="st-banner">${esc(S(L, "draft_banner"))}</p>` : ""}${m.index === "preview" ? `<p class="st-banner">${esc(S(L, "clayaway_preview"))}</p>` : ""}${brief}
${V.body.map(x => x.html).join("\n")}
${V.kps.length ? `<section class="st-kp"><h2>${esc(S(L, "key_points"))}</h2><ul>${V.kps.map(k => `<li${k.lang ? ` lang="${k.lang}"` : ""}>${k.x.draft ? '<span class="st-draft-h">Draft · </span>' : ""}${k.html}</li>`).join("")}</ul></section>` : ""}
${V.dyk ? `<aside class="st-dyk"${V.dyk.lang ? ` lang="${V.dyk.lang}"` : ""}><h2>${esc(S(L, "did_you_know"))}</h2><p>${V.dyk.html}</p></aside>` : ""}
${V.phrases.length ? `<details class="st-talk"${pl.block === "stand-talk" ? " open" : ""}><summary>${esc(S(L, "stand_talk"))}</summary><ul>${V.phrases.map(p => `<li><p class="st-ph"><span class="st-badge">${esc(S(L, `speaker_${p.x.speaker || "coach"}`))}</span> <q lang="en">${esc(p.x.en)}</q></p><p${p.lang ? ` lang="${p.lang}"` : ""}><b>${esc(S(L, "meaning"))}:</b> ${p.meaning}</p>${p.say && L !== "en" ? `<p><b>${esc(S(L, "say_it"))}:</b> ${p.say}</p>` : ""}</li>`).join("")}</ul></details>` : ""}
${Object.entries(notesBy).map(([f, list]) => `<details class="st-notes"><summary>${esc(noteLabel(f))}</summary><ul>${list.map(n => `<li${n.lang ? ` lang="${n.lang}"` : ""}>${n.html}</li>`).join("")}</ul></details>`).join("\n")}
${terms ? `<section><h2>${esc(S(L, "terms"))}</h2><ul class="st-chips">${terms}</ul></section>` : ""}
${V.refs.length ? `<section><h2>${esc(S(L, "rules_where"))}</h2><ul>${V.refs.map(r => `<li><a href="${esc(r.url)}">${esc(r.label)}</a> · ${esc(DISC_SHORT[r.book] || "FITASC")}</li>`).join("")}</ul></section>` : ""}
${V.sources.length ? `<section><h2>${esc(S(L, hasLaw ? "sources_laws" : "sources"))}</h2><ul>${V.sources.map(s => `<li><a href="${esc(s.url)}" rel="${s.fitasc ? "nofollow noopener noreferrer" : "noopener noreferrer"}"${s.lang ? ' lang="en"' : ""}>${esc(s.title)} ↗</a>${s.checked ? ` <span class="st-small">· ${esc(s.checked)}</span>` : ""}</li>`).join("")}</ul>${hasLaw ? `<p class="st-small">${esc(S(L, "laws_disclaimer"))}</p>` : ""}</section>` : ""}
${V.more ? `<p class="st-more">${esc(S(L, "more_in_en", { n: V.more }))} · <a href="${esc(U.lesson("en", m.id))}" hreflang="en" lang="en">English</a></p>` : ""}
${quiz}
${m.disclaimer === "medical" ? `<p class="st-small"><b>${esc(S(L, "not_medical_advice"))}</b></p>` : ""}${review ? `<p class="st-small"><b>${esc(S(L, "review_pending"))}.</b> ${esc(S(L, "review_pending_d"))}</p>` : ""}
<nav class="st-cta" aria-label="${esc(S(L, "lesson_nav"))}">${next ? `<a class="st-btn st-primary" href="${esc(U.lesson(L, next))}">${esc(S(L, "next"))}: ${esc(tm(lessonTitle(L, next)))}</a>` : ""}${blockUrl ? `<a class="st-btn" href="${esc(blockUrl)}">${esc(S(L, "to_topic"))}</a>` : ""}<a class="st-btn" href="${esc(U.contacts(L))}" rel="noopener noreferrer">${esc(S(L, "report_error"))}</a></nav>
</article>`;
    const ldl = [{ "@context": "https://schema.org", "@type": "LearningResource", name: title, description: tm(V.desc), url, inLanguage: L, learningResourceType: "Lesson",
      educationalLevel: m.level === 1 ? "Beginner" : "Intermediate", timeRequired: `PT${m.minutes || 5}M`, isAccessibleForFree: true, dateModified: opt.today,
      ...(blockUrl ? { isPartOf: { "@type": "CollectionPage", name: tm(bt), url: blockUrl } } : {}),
      // `about`: the glossary terms of the lesson; t.local already carries the FITASC marks (localTerm → tm, audit legal-01)
      ...(V.terms.length ? { about: V.terms.map(t => ({ "@type": "DefinedTerm", name: tm(t.local), termCode: t.id, ...(t.url ? { url: t.url } : {}) })) } : {}),
      provider: ld.org }, ld.crumbs([homeCrumb(L), blockUrl ? { name: tm(bt), url: blockUrl } : null, { name: title, url }])].filter(Boolean);
    shell({ kind: "lesson", lesson: m.id, L, url, title: fitTitle(title, L), h1: title, desc: tm(V.desc), index, alts, ogType: "article", img: ogImg(L, b.id), ld: ldl, crumbs, body,
      data: { page: "lesson", lang: L, id: m.id, rev: m.rev, block: b.id } });
  }
  // block pages: "Почніть тут" first in every section, then "Глибше"; route badges; games of the block (design §7.4)
  const mins = (L, n) => n < 60 ? `${n} ${S(L, "min")}` : `${Math.floor(n / 60)} ${S(L, "hours_short")}${n % 60 ? ` ${n % 60} ${S(L, "min")}` : ""}`;
  const sumMin = ids => ids.reduce((n, id) => n + (lessons.get(id).minutes || 5), 0);
  const lessonCard = (L, id, starter) => { const m = lessons.get(id), V = view(m, L);
    return `<li><a href="${esc(U.lesson(L, id))}">${esc(tm(V.title))}</a><div class="st-meta"><span>${m.minutes || 5} ${esc(S(L, "min"))}</span>${starter ? `<span class="st-badge st-b-star">★ ${esc(S(L, "start_here"))}</span>` : ""}${V.hasSim ? animMark(L) : ""}${discBadges(m)}${routesOf(id).filter(r => built.route[r.id][L]).map(r => `<a class="st-badge" href="${esc(U.route(L, r.id))}">${esc(tm(SH.route(L, r, "title")))}</a>`).join("")}</div><p>${esc(tm(V.desc))}</p></li>`; };
  for (const b of blocks) for (const L of LANGS) {
    if (!built.block[b.id][L]) continue;
    const url = U.block(L, b.id), t = tm(SH.block(L, b, "title")), purpose = tm(SH.block(L, b, "purpose"));
    const alts = LANGS.filter(l => built.block[b.id][l]).map(l => ({ l, url: U.block(l, b.id) }));
    const ids = blockLessons(b).filter(id => lessonBuilt(id, L));
    const sections = b.sections.map(s => { const list = s.lessons.filter(id => lessonBuilt(id, L)); if (!list.length) return ""; const starters = list.filter(id => (b.starters || []).includes(id)), deeper = list.filter(id => !(b.starters || []).includes(id));
      return `<section id="${s.id}"><h2>${esc(tm(SH.section(L, b, s)))}</h2><ol class="st-list">${[...starters, ...deeper].map(id => lessonCard(L, id, starters.includes(id))).join("")}</ol></section>`; }).join("\n");
    const gm = (b.practice || []).map(g => gameById[g]).filter(g => g && (built.game[g.id][L] || g.external)).map(g => `<li>${g.external ? `<a href="${esc(U.trainer(L))}">${esc(S(L, "rules_trainer"))}</a>` : `<a href="${esc(U.practice(L, g.id))}">${esc(tm(SH.game(L, g)))}</a>`}</li>`).join("");
    const crumbs = [homeCrumb(L), { name: t, url }].filter(Boolean);
    const body = `<h1>${esc(t)}</h1><p class="st-lead">${esc(purpose)}</p><p class="st-meta"><span>${esc(nLessons(L, ids.length))}</span><span>≈ ${esc(mins(L, sumMin(ids)))}</span></p>
${sections}
${gm ? `<section><h2>${esc(S(L, "practice"))}</h2><ul class="st-chips">${gm}</ul></section>` : ""}
${b.glossary_category ? `<p><a href="${esc(BASE + (L === "uk" ? "" : L + "/") + "glossary/")}">${esc(S(L, "glossary"))}</a></p>` : ""}`;
    shell({ kind: "block", L, url, title: fitTitle(t, L, S(L, "topics")), h1: t, desc: purpose, index: true, alts, ogType: "website", img: ogImg(L, b.id),
      ld: [{ "@context": "https://schema.org", "@type": "CollectionPage", name: t, description: purpose, url, inLanguage: L, ...(built.home[L] ? { isPartOf: { "@type": "WebSite", name: academyName(L), url: U.home(L) } } : {}),
        mainEntity: { "@type": "ItemList", itemListElement: ids.map((id, i) => ({ "@type": "ListItem", position: i + 1, url: U.lesson(L, id), name: tm(view(lessons.get(id), L).title) })) } }, ld.crumbs(crumbs)].filter(Boolean),
      crumbs, body, data: { page: "block", lang: L, id: b.id } });
  }
  // route pages (Course, free, no Offer) + exam pages (noindex)
  const checklistOf = (r, L) => routeLessons(r).filter(id => lessonBuilt(id, L)).flatMap(id => view(lessons.get(id), L).kps.filter(k => k.x.checklist && !k.x.draft).map(k => ({ id, html: k.html })));
  for (const r of routes) for (const L of LANGS) {
    if (!built.route[r.id][L]) continue;
    const url = U.route(L, r.id), t = tm(SH.route(L, r, "title")), forT = tm(SH.route(L, r, "for")), alts = LANGS.filter(l => built.route[r.id][l]).map(l => ({ l, url: U.route(l, r.id) }));
    const req = routeLessons(r), minutes = sumMin(req), disclaimer = SH.route(L, r, "disclaimer");
    const item = id => lessonBuilt(id, L) ? `<li><a href="${esc(U.lesson(L, id))}">${esc(tm(view(lessons.get(id), L).title))}</a> <span class="st-small">· ${lessons.get(id).minutes || 5} ${esc(S(L, "min"))}</span>${view(lessons.get(id), L).hasSim ? " " + animMark(L) : ""}</li>`
      : (() => { const tl = lessonTitle(L, id); return `<li class="st-soon"${tl ? "" : ' lang="en"'}>${esc(tm(tl || lessonTitle("en", id) || id))} <span class="st-badge st-b-soon" lang="${L}">${esc(S(L, "draft_soon"))}</span></li>`; })();
    const stages = r.stages.map((st, i) => `<li id="${st.id}"><h2>${esc(S(L, "stage"))} ${i + 1}. ${esc(tm(SH.stage(L, r, st)))}</h2><p class="st-meta"><span>${esc(nLessons(L, st.lessons.length))}</span><span>≈ ${esc(mins(L, st.minutes || sumMin(st.lessons)))}</span></p><ol>${st.lessons.map(item).join("")}</ol></li>`).join("");
    const extras = (r.extras || []).length ? `<details><summary>${esc(S(L, "go_deeper"))}</summary><ul>${r.extras.map(item).join("")}</ul></details>` : "";
    const ex = (r.certificate || {}).exam || (r.badge_only || {}).quiz;
    // the rules trainer's short test (route "Перші змагання": mode "short", 10 questions, 80 %) opens with &mode=short
    const pr = (r.practice || []).map(p => { const g = gameById[p.game]; if (!g) return ""; const name = g.external ? S(L, "rules_trainer") : SH.game(L, g); const u = g.external ? U.trainer(L) + (p.mode ? `&mode=${encodeURIComponent(p.mode)}` : "") : built.game[g.id][L] ? U.practice(L, g.id) : null;
      const need = g.external && p.mode === "short" ? ` · ${S(L, "req_rules_short", { n: p.n || 10, p: p.min_pct || 80 })}` : p.min_pct ? ` · ${p.min_pct}%` : p.min_score ? ` · ${p.min_score}/${p.of}` : ""; return `<li>${u ? `<a href="${esc(u)}">${esc(tm(name || g.id))}</a>` : esc(tm(name || g.id))}${esc(need)}</li>`; }).join("");
    const certTitle = SH.cert(L, r) || (r.certificate ? S(L, "cert_route", { route: t }) : S(L, "badge_only"));
    const cert = `<section id="certificate" class="st-box"><h2>${esc(tm(certTitle))}</h2>${ex ? `<p>${esc(S(L, "route_exam"))}: ${esc(S(L, "exam_conditions", { n: ex.n, pct: ex.pass_pct }))}</p>` : ""}${pr ? `<ul>${pr}</ul>` : ""}${r.certificate ? `<p class="st-small">${esc(S(L, "cert_disclaimer"))}${disclaimer ? " " + esc(disclaimer) : ""}</p>` : ""}${ex && built.exam[r.id][L] ? `<p><a class="st-btn" href="${esc(U.exam(L, r.id))}">${esc(S(L, "route_exam"))}</a></p>` : ""}</section>`;
    const cl = r.checklist ? checklistOf(r, L) : [], clTitle = r.checklist ? SH.checklist(L, r) : null;
    const crumbs = [homeCrumb(L), { name: t, url }].filter(Boolean);
    const body = `<div class="st-meta"><span>${esc(S(L, "routes"))}</span></div><h1>${esc(t)}</h1><p class="st-lead">${esc(forT)}</p>${disclaimer ? `<p class="st-banner">${esc(disclaimer)}</p>` : ""}
<p class="st-meta"><span>${esc(S(L, "required_lessons"))}: ${req.length}</span><span>≈ ${esc(mins(L, minutes))}</span></p>
<ol class="st-stages">${stages}</ol>
${extras}
${cert}
${cl.length && clTitle ? `<section class="st-box" id="checklist"><h2>${esc(tm(clTitle))}</h2><ul>${cl.map(c => `<li>${c.html}</li>`).join("")}</ul><p class="st-small">${esc(S(L, "checklist_print"))}</p></section>` : ""}`;
    shell({ kind: "route", L, url, title: fitTitle(t, L, S(L, "routes")), h1: t, desc: tm(`${forT} ${nLessons(L, req.length)} · ≈ ${mins(L, minutes)}.`), index: true, alts, ogType: "website", img: ogImg(L, `route-${r.id}`),
      ld: [{ "@context": "https://schema.org", "@type": "Course", name: t, description: forT, url, inLanguage: L, isAccessibleForFree: true, provider: ld.org, timeRequired: `PT${minutes}M`,
        ...(r.certificate ? { educationalCredentialAwarded: tm(certTitle) } : {}),
        hasPart: req.filter(id => lessonBuilt(id, L)).map(id => ({ "@type": "LearningResource", name: tm(view(lessons.get(id), L).title), url: U.lesson(L, id) })) }, ld.crumbs(crumbs)].filter(Boolean),
      crumbs, body, data: { page: "route", lang: L, id: r.id } });
    if (built.exam[r.id][L]) {
      const eu = U.exam(L, r.id), et = `${S(L, "route_exam")} · ${t}`;
      shell({ kind: "exam", L, url: eu, title: fitTitle(et, L), h1: et, desc: S(L, "exam_d"), index: false, alts: LANGS.filter(l => built.exam[r.id][l]).map(l => ({ l, url: U.exam(l, r.id) })), ogType: "website", img: ogImg(L, `route-${r.id}`),
        ld: [], crumbs: [homeCrumb(L), { name: t, url }, { name: S(L, "route_exam"), url: eu }].filter(Boolean),
        body: `<h1>${esc(et)}</h1><p class="st-lead">${esc(S(L, "exam_conditions", { n: ex.n, pct: ex.pass_pct }))}</p><noscript><p class="st-banner">${esc(S(L, "requires_js"))}</p></noscript>${r.certificate ? `<p class="st-small">${esc(S(L, "cert_disclaimer"))}</p>` : ""}`,
        data: { page: "exam", lang: L, id: r.id } });
    }
  }
  // Practice: the games registry practice.json; "rules-exam" is the rules trainer (external, noindex), "routine" comes later
  for (const L of LANGS) {
    if (!built.practice[L]) continue;
    const pu = U.practice(L), pt = S(L, "practice"), alts = LANGS.filter(l => built.practice[l]).map(l => ({ l, url: U.practice(l) }));
    const list = games.filter(g => !g.later && (built.game[g.id][L] || g.external));
    const gameDesc = g => g.legacy && GAME_DESC[g.legacy] ? S(L, GAME_DESC[g.legacy]) : "";
    // the rules trainer is part of this Practice (owner decision 07.10.2026): «Тренажер правил», same name as the project bar
    // (docs/shared/nav.js NAMES.trainer = ui "rules_trainer"), no "↗"
    const card = g => g.external ? `<a class="st-card" href="${esc(U.trainer(L))}"><b>${esc(S(L, "rules_trainer"))}</b><span>${esc(S(L, "game_rules_exam_d"))}</span></a>`
      : `<a class="st-card" href="${esc(U.practice(L, g.id))}"><b>${esc(tm(SH.game(L, g)))}</b><span>${esc(tm(gameDesc(g)))}</span></a>`;
    const crumbs = [homeCrumb(L), { name: pt, url: pu }].filter(Boolean);
    const exams = routes.filter(r => built.exam[r.id][L]);
    shell({ kind: "practice", L, url: pu, title: fitTitle(pt, L), h1: pt, desc: S(L, "practice_d"), index: true, alts, ogType: "website", img: ogImg(L, "practice"), wide: true,
      ld: [{ "@context": "https://schema.org", "@type": "CollectionPage", name: pt, description: S(L, "practice_d"), url: pu, inLanguage: L, mainEntity: { "@type": "ItemList", itemListElement: list.filter(g => !g.external).map((g, i) => ({ "@type": "ListItem", position: i + 1, url: U.practice(L, g.id), name: tm(SH.game(L, g)) })) } }, ld.crumbs(crumbs)].filter(Boolean),
      crumbs, body: `<h1>${esc(pt)}</h1><p class="st-lead">${esc(S(L, "practice_d"))}</p><div class="st-cards">${list.map(card).join("")}</div>
${exams.length ? `<h2>${esc(S(L, "route_exam"))}</h2><ul class="st-chips">${exams.map(r => `<li><a href="${esc(U.exam(L, r.id))}">${esc(tm(SH.route(L, r, "title")))}</a></li>`).join("")}</ul>` : ""}`,
      data: { page: "practice", lang: L } });
    for (const g of games) {
      if (!built.game[g.id][L]) continue;
      const gu = U.practice(L, g.id), gt = tm(SH.game(L, g)), d = tm(gameDesc(g)) || S(L, "practice_d");
      const gc = [homeCrumb(L), { name: pt, url: pu }, { name: gt, url: gu }].filter(Boolean);
      const gb = (g.blocks || []).filter(bid => built.block[bid] && built.block[bid][L]);
      shell({ kind: "game", L, url: gu, title: fitTitle(gt, L, pt), h1: gt, desc: d, index: idx(g.index), alts: LANGS.filter(l => built.game[g.id][l]).map(l => ({ l, url: U.practice(l, g.id) })), ogType: "website", img: ogImg(L, "practice"),
        ld: [{ "@context": "https://schema.org", "@type": "LearningResource", name: gt, description: d, url: gu, inLanguage: L, learningResourceType: "Exercise", interactivityType: "active", isAccessibleForFree: true, provider: ld.org }, ld.crumbs(gc)].filter(Boolean),
        crumbs: gc, body: `<h1>${esc(gt)}</h1><p class="st-lead">${esc(d)}</p>${!g.xp && (g.known_issues || []).length ? `<p class="st-banner">${esc(S(L, "practice_known_issue"))}</p>` : ""}<noscript><p class="st-banner">${esc(S(L, "requires_js"))}</p></noscript>
${gb.length ? `<ul class="st-chips">${gb.map(bid => `<li><a href="${esc(U.block(L, bid))}">${esc(tm(SH.block(L, blockById[bid], "title")))}</a></li>`).join("")}</ul>` : ""}`,
        data: { page: "game", lang: L, id: g.id } });
    }
    const gu = U.progress(L), gt = S(L, "progress");
    shell({ kind: "progress", L, url: gu, title: fitTitle(gt, L), h1: gt, desc: S(L, "progress_d"), index: false, alts: LANGS.filter(l => built.progress[l]).map(l => ({ l, url: U.progress(l) })), ogType: "website", img: ogImg(L, "home"),
      ld: [], crumbs: [homeCrumb(L), { name: gt, url: gu }].filter(Boolean),
      body: `<h1>${esc(gt)}</h1><p class="st-lead">${esc(S(L, "progress_d"))}</p><noscript><p class="st-banner">${esc(S(L, "requires_js"))}</p></noscript>`,
      data: { page: "progress", lang: L } });
  }
  // home ("Хто ви?" routes, topics, Practice); the uk home docs/learn/index.html belongs to the app (see homeKept)
  for (const L of LANGS) {
    if (!built.home[L] || (L === "uk" && homeKept)) continue;
    const url = U.home(L), t = academyName(L), alts = LANGS.filter(l => built.home[l]).map(l => ({ l, url: U.home(l) }));
    const rcard = r => { const req = routeLessons(r); return `<a class="st-card" href="${esc(U.route(L, r.id))}"><b>${esc(tm(SH.route(L, r, "title")))}</b><span>${esc(tm(SH.route(L, r, "for")))}</span><span>${esc(nLessons(L, req.length))} · ≈ ${esc(mins(L, sumMin(req)))}</span></a>`; };
    const bcard = b => { const ids = blockLessons(b).filter(id => lessonBuilt(id, L)); return `<a class="st-card" href="${esc(U.block(L, b.id))}"><b>${esc(tm(SH.block(L, b, "title")))}</b><span>${esc(tm(SH.block(L, b, "purpose")))}</span><span>${esc(nLessons(L, ids.length))}</span></a>`; };
    const rs = routes.filter(r => built.route[r.id][L]), bs = blocks.filter(b => built.block[b.id][L]);
    const gl = games.filter(g => !g.later && (built.game[g.id][L] || g.external));
    const desc = tm(S(L, "home_desc"));
    const body = `<h1>${esc(S(L, "home_hero_h1"))}</h1><p class="st-lead">${esc(tm(S(L, "home_hero_lead")))}</p>
<section id="h-who"><h2>${esc(S(L, "who_are_you"))}</h2><div class="st-cards">${rs.filter(r => r.primary).map(rcard).join("")}</div>${rs.some(r => !r.primary) ? `<h3>${esc(S(L, "more_routes"))}</h3><div class="st-cards">${rs.filter(r => !r.primary).map(rcard).join("")}</div>` : ""}</section>
<section id="topics"><h2>${esc(S(L, "topics"))}</h2><div class="st-cards">${bs.map(bcard).join("")}</div></section>
${built.practice[L] ? `<section id="h-prac"><h2><a href="${esc(U.practice(L))}">${esc(S(L, "practice"))}</a></h2><ul class="st-chips">${gl.map(g => `<li>${g.external ? `<a href="${esc(U.trainer(L))}">${esc(S(L, "rules_trainer"))}</a>` : `<a href="${esc(U.practice(L, g.id))}">${esc(tm(SH.game(L, g)))}</a>`}</li>`).join("")}</ul></section>` : ""}
<p class="st-small">${esc(S(L, "saved_local"))}</p>`;
    shell({ kind: "home", L, url, title: tm(S(L, "home_title")), h1: S(L, "home_hero_h1"), desc, index: true, alts, ogType: "website", img: ogImg(L, "home"), wide: true,
      ld: [{ "@context": "https://schema.org", "@type": "CollectionPage", name: t, description: desc, url, inLanguage: L, publisher: ld.org,
        mainEntity: { "@type": "ItemList", itemListElement: [...rs.map(r => ({ url: U.route(L, r.id), name: tm(SH.route(L, r, "title")) })), ...bs.map(b => ({ url: U.block(L, b.id), name: tm(SH.block(L, b, "title")) }))].map((x, i) => ({ "@type": "ListItem", position: i + 1, ...x })) } }],
      crumbs: [{ name: t, url }], body, data: { page: "home", lang: L } });
  }
  // anchors of merged lessons: an old link /…/<old id>/ → /…/<target>/#<old id> must land on a heading (design §3.3 p.7)
  for (const [old, e] of [...Object.entries(learnMap), ...Object.entries(interpMap)]) {
    if (!e || !e.anchor || !lessons.has(e.to)) continue;
    for (const L of LANGS) if (lessonBuilt(e.to, L) && !view(lessons.get(e.to), L).anchors.has(e.anchor))
      err("dead-anchor", `${e.to} (${L}): no block with anchor "${e.anchor}" — the redirect from "${old}" would land nowhere`, { lesson: e.to, lang: L });
  }

  /* =================================================================================================================
     8. Data files for the app (SCHEMA.md §8), redirect stubs, sitemaps, share list, animation texts
     ================================================================================================================= */
  const FILES = new Map(); // site-relative path → string
  const json = (rel, obj) => { const s = JSON.stringify(obj) + "\n"; FILES.set(rel, rel.startsWith("learn/data/uk/") ? ukApos(s) : s); }; // uk: ’
  // catalog status (SCHEMA.md §8): published | preview (ClayAway, noindex) | draft (not built) | untranslated (no version in this language).
  // In a --draft preview the built draft lessons are "published"/"preview" with draft:true, and the catalog has test:true (the app labels it).
  const lessonStatus = (m, L) => lessonBuilt(m.id, L) ? (m.index === "preview" ? "preview" : "published") : (buildable(m) ? "untranslated" : "draft");
  for (const L of LANGS) {
    // Interface strings: their own file ui.json (about 17 KB; changes rarely, so the browser keeps it cached), not inside the catalog
    // that every page reads. The app fetches both at once; "files" in the catalog names them (paths relative to the catalog).
    const uiL = Object.fromEntries(Object.keys(ui.en).map(k => [k, S(L, k)]));
    json(`learn/data/${L}/ui.json`, { lang: L, rev: sha8(JSON.stringify(uiL)), ui: uiL, ui_fallback: [...uiFallback[L]].sort() });
    const cat = {
      lang: L, generated: opt.today, base: BASE, ...(opt.draft ? { test: true } : {}), files: { ui: "ui.json", phrases: "phrases.json" }, fitasc_index: opt.fitascIndex,
      blocks: blocks.map(b => ({ id: b.id, order: b.order, icon: b.icon, title: SH.block(L, b, "title"), purpose: SH.block(L, b, "purpose"), url: built.block[b.id][L] ? U.block(L, b.id) : null,
        starters: b.starters || [], sections: b.sections.map(s => ({ id: s.id, title: SH.section(L, b, s), lessons: s.lessons })), practice: b.practice || [], glossary_category: b.glossary_category || null })),
      routes: routes.map(r => ({ id: r.id, order: r.order, primary: !!r.primary, icon: r.icon, notes_open: !!r.notes_open, title: SH.route(L, r, "title"), for: SH.route(L, r, "for"),
        url: built.route[r.id][L] ? U.route(L, r.id) : null, exam_url: built.exam[r.id][L] ? U.exam(L, r.id) : null,
        stages: r.stages.map(st => ({ id: st.id, title: SH.stage(L, r, st), lessons: st.lessons, badge: st.badge || null, minutes: st.minutes || null })), extras: r.extras || [],
        practice: r.practice || [], certificate: r.certificate ? { ...r.certificate, title: SH.cert(L, r) } : null, badge: r.badge || null, totals: r.totals || null,
        ...(r.checklist ? { checklist: { source: r.checklist.source, title: SH.checklist(L, r) } } : {}), ...(r.disclaimer ? { disclaimer: SH.route(L, r, "disclaimer") } : {}), ...(r.badge_only ? { badge_only: r.badge_only } : {}) })),
      lessons: Object.fromEntries([...lessons.values()].map(m => { const pl = place.get(m.id) || {}, b = lessonBuilt(m.id, L), st = lessonStatus(m, L);
        return [m.id, { id: m.id, rev: m.rev, block: pl.block || null, section: pl.section || null, level: m.level, minutes: m.minutes, disciplines: m.disciplines || [], status: st, ...(b && m.status === "draft" ? { draft: true } : {}),
          index: b ? (lessonIndexed(m) ? "index" : "noindex") : null, review_flag: reviewFlag(m), disclaimer: m.disclaimer || null,
          title: b ? tm(view(m, L).title) : (lessonTitle(L, m.id) ? tm(lessonTitle(L, m.id)) : null), summary: b ? tm(view(m, L).desc) : null,
          url: b ? U.lesson(L, m.id) : null, data: b ? `lessons/${m.id}.json` : null, // data: relative to this catalog
          ...(b && view(m, L).hasSim ? { anim: true } : {}), // the lesson opens with an animation: "▶ з анімацією" on its cards
          alt: LANGS.filter(l => lessonBuilt(m.id, l)) }]; })), // languages with a page (same set as hreflang); URL = /<p>learn/<id>/
      practice: games.map(g => ({ id: g.id, legacy: g.legacy || null, title: SH.game(L, g), description: g.legacy && GAME_DESC[g.legacy] ? S(L, GAME_DESC[g.legacy]) : null,
        url: g.external ? U.trainer(L) : built.game[g.id][L] ? U.practice(L, g.id) : null, index: g.index, xp: !!g.xp, known_issues: g.known_issues || [], blocks: g.blocks || [],
        ...(g.external ? { external: true, storage_key: g.storage_key, storage_key_old: g.storage_key_old } : {}), ...(g.later ? { later: true } : {}), ...(g.modes ? { modes: g.modes } : {}), ...(g.timers_s ? { timers_s: g.timers_s } : {}) })),
      levels: { xp: levels.xp, levels: (levels.levels || []).map(v => ({ id: v.id, min_xp: v.min_xp, title: SH.level(L, v) })) },
      badges: badges.map(b => ({ id: b.id, kind: b.kind, ref: b.ref || null, rule: b.rule || null, title: SH.badge(L, b) })),
      id_map: `${BASE}learn/data/id-map.json`
    };
    cat.rev = sha8(JSON.stringify({ ...cat, generated: null })); // changes only when the content changes
    json(`learn/data/${L}/catalog.json`, cat);
    for (const m of lessons.values()) {
      if (!lessonBuilt(m.id, L)) continue;
      const V = view(m, L), R = V.R;
      // "html" fields: escaped text with the tokens rendered as links (inner HTML; the app adds the wrapper of the block type).
      // Every other string is plain text with the tokens rendered as text (the app escapes it): quiz, phrases, titles.
      json(`learn/data/${L}/lessons/${m.id}.json`, { id: m.id, rev: m.rev, lang: L, status: lessonStatus(m, L), ...(m.status === "draft" ? { draft: true } : {}), review_flag: reviewFlag(m), disclaimer: m.disclaimer || null,
        title: tm(V.title), summary: tm(V.desc),
        body: V.body.map(x => ({ k: x.b.k, t: x.b.t, html: x.inner, disc: x.b.disc || null, rule_ref: x.b.rule_ref || null, ...(x.b.anchor ? { anchor: x.b.anchor } : {}),
          ...(x.b.t === "sim" ? { sim: x.b.sim, ...(x.hero ? { hero: true, kind: x.hero.kind, heading: x.hero.heading } : {}) } : {}), ...(x.b.t === "evidence" ? { for: x.b.for, level: x.b.level } : {}), ...(x.b.t === "draft" ? { role: x.b.role || null, from: x.b.from || null } : {}), ...(x.lang ? { lang: x.lang, updating: true } : {}) })),
        notes: V.notes.map(n => ({ k: n.x.k, for: n.x.for || "interpreter", html: n.html })),
        phrases: V.phrases.map(p => ({ k: p.x.k, speaker: p.x.speaker || null, en: p.x.en, meaning: p.meaningText, say: L === "en" ? null : p.sayText })),
        key_points: V.kps.map(k => ({ k: k.x.k, html: k.html, checklist: !!k.x.checklist })),
        did_you_know: V.dyk ? { k: V.dyk.k, html: V.dyk.html } : null,
        quiz: V.quiz.map(({ q, v }) => ({ k: q.k, q: plain(v.q, R), options: (q.options || []).map(op => ({ k: op.k, text: plain(v.options[op.k], R) })), correct: q.correct, explain: plain(v.explain, R), ...(q.rule_ref ? { rule_ref: q.rule_ref } : {}), ...(q.disc ? { disc: q.disc } : {}) })),
        terms: V.terms, rule_refs: V.refs, sources: V.sources.map(s => ({ title: s.title, url: s.url, fitasc: s.fitasc })),
        evidence: (m.evidence || []).map(e => ({ for: e.for, level: e.level })), more_in_en: V.more });
    }
    // Phrase index (SCHEMA.md §8d): every Stand Talk phrase of the lessons published in L, in block and lesson order, for the
    // Practice games "Зрозумійте / перекладіть тренера" and "Розмовник" (one request instead of one per lesson of the block).
    const phr = [];
    for (const b of blocks) for (const id of blockLessons(b)) {
      if (!lessonBuilt(id, L)) continue;
      for (const p of view(lessons.get(id), L).phrases) phr.push({ k: p.x.k, lesson: id, block: b.id, speaker: p.x.speaker || null, en: p.x.en, meaning: p.meaningText, say: L === "en" ? null : p.sayText, ...(p.lang ? { lang: p.lang } : {}) });
    }
    json(`learn/data/${L}/phrases.json`, { lang: L, rev: sha8(JSON.stringify(phr)), phrases: phr });
    for (const r of routes) {
      if (!built.exam[r.id][L]) continue;
      const ex = (r.certificate || {}).exam || (r.badge_only || {}).quiz, qs = [];
      for (const id of routeLessons(r)) { if (!lessonBuilt(id, L)) continue; const m = lessons.get(id), R = view(m, L).R;
        for (const [list, part] of [[m.quiz || [], "quiz"], [m.exam_pool || [], "pool"]]) for (const q of list) { const v = valOf(m, { part, k: q.k, it: q }, L); if (v.st !== "ok") continue;
          qs.push({ lesson: id, k: q.k, q: plain(v.v.q, R), options: (q.options || []).map(op => ({ k: op.k, text: plain(v.v.options[op.k], R) })), correct: q.correct, explain: plain(v.v.explain, R), ...(q.rule_ref ? { rule_ref: q.rule_ref } : {}), ...(q.disc ? { disc: q.disc } : {}) }); } }
      json(`learn/data/${L}/exams/${r.id}.json`, { route: r.id, lang: L, n: ex.n, pass_pct: ex.pass_pct, questions: qs });
      if (qs.length < ex.n) warn("exam-bank-small", `${r.id} (${L}): ${qs.length} questions in the bank, the exam asks ${ex.n}`, { lang: L });
    }
  }
  // redirect stubs (groups A–D); E (the /interpreter/ app router) and F (/learn/#… on the home) are JavaScript routers of the app
  const stubs = new Map(), pending = [];
  const byUrl = new Map([...PAGES.values()].map(p => [p.url, p])), pageInfo = url => byUrl.get(url);
  function stub(fromRel, group, L, target, anchor, page) {
    const to = target + (anchor ? `#${anchor}` : ""), from = BASE + fromRel.replace(/index\.html$/, "");
    if (PAGES.has(fromRel)) { err("stub-collision", `${from}: a redirect stub would overwrite a page`); return; }
    const info = page || pageInfo(target) || {};
    const title = info.title || academyName(L), desc = info.desc || "";
    stubs.set(fromRel, { from, to, group, lang: L, html: `<!doctype html><html lang="${L}"><head><meta charset="utf-8">
<!-- ${GEN}: redirect stub, group ${group} (design §5.2; id-map.json) -->
<title>${esc(title)}</title>
${STUB_NOINDEX ? '<meta name="robots" content="noindex, follow">\n' : ""}<link rel="canonical" href="${esc(target)}">
<meta property="og:type" content="article"><meta property="og:site_name" content="ClayArena"><meta property="og:title" content="${esc(info.ogTitle || title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${esc(target)}">
<meta property="og:image" content="${esc(info.img || BASE + "og/learn.png")}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:locale" content="${OG_LOCALE[L]}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${esc(info.img || BASE + "og/learn.png")}">
<meta http-equiv="refresh" content="0; url=${esc(to)}">
<script>location.replace(${JSON.stringify(to)})</script>
</head><body><p><a href="${esc(to)}">${esc(title)}</a></p></body></html>
` });
  }
  for (const [old, e] of Object.entries(learnMap)) for (const L of ["uk", "en"]) {
    if (lessons.has(old)) { err("stub-collision", `id-map.json learn "${old}" is still a master`); continue; }
    if (lessonBuilt(e.to, L)) stub(`${L === "uk" ? "" : "en/"}learn/${old}/index.html`, "A", L, U.lesson(L, e.to), e.anchor);
    else pending.push({ from: `${BASE}${L === "uk" ? "" : "en/"}learn/${old}/`, to: U.lesson(L, e.to) + (e.anchor ? "#" + e.anchor : ""), group: "A", lang: L });
  }
  for (const [old, e] of Object.entries(interpMap)) for (const L of LANGS) {
    const g = e.anchor ? "C" : "B";
    if (lessonBuilt(e.to, L)) stub(`interpreter/${L}/${old}/index.html`, g, L, U.lesson(L, e.to), e.anchor);
    else pending.push({ from: `${BASE}interpreter/${L}/${old}/`, to: U.lesson(L, e.to) + (e.anchor ? "#" + e.anchor : ""), group: g, lang: L });
  }
  for (const L of LANGS) {
    if (built.route.interpreter && built.route.interpreter[L]) stub(`interpreter/${L}/index.html`, "D", L, U.route(L, "interpreter"), null);
    else pending.push({ from: `${BASE}interpreter/${L}/`, to: U.route(L, "interpreter"), group: "D", lang: L });
  }
  json("learn/data/redirects.json", { _note: "Old URL → new URL. Active = a stub exists now (GitHub Pages: meta refresh + canonical); on clayarena.com answer them with HTTP 301. Pending = the target is not published in that language yet, so the old page stays. Never redirect to another language.",
    generated: opt.today, active: [...stubs.values()].map(s => ({ from: s.from, to: s.to, group: s.group, lang: s.lang })), pending });
  json("learn/data/id-map.json", { _note: "Public copy of content/academy/id-map.json for the JS routers of /learn/ (#<old id>, #<module>) and /interpreter/ (?lang, #l/<id>, #m/<mission>, #g/<game>). Use `published` to check that the target exists in the language; never redirect to another language.",
    langs: LANGS, prefix: idmap.prefix || { uk: "", other: "<lang>/" }, learn: learnMap, interpreter: interpMap, modules: idmap.modules || {}, missions: idmap.missions || {}, games: idmap.games || {}, pages: idmap.pages || {},
    published: Object.fromEntries(LANGS.map(L => [L, [...lessons.keys()].filter(id => lessonBuilt(id, L))])),
    routes: Object.fromEntries(LANGS.map(L => [L, routes.filter(r => built.route[r.id][L]).map(r => r.id)])), home: Object.fromEntries(LANGS.map(L => [L, built.home[L]])) });
  // Published languages of the Academy (a few hundred bytes, read by docs/shared/nav.js on every page of the site): the project bar's
  // "Академія" link goes to /<p>learn/ only when that home is published, else to /en/learn/ (never to a missing page, never guessed).
  json("learn/data/languages.json", { _note: `${GEN}: languages whose Academy home /<p>learn/ is published (uk at /learn/, others at /<lang>/learn/). docs/shared/nav.js links the Academy item there, else to English.`,
    generated: opt.today, langs: LANGS, published: LANGS.filter(L => built.home[L]), fallback: built.home.en ? "en" : "uk",
    lessons: Object.fromEntries(LANGS.map(L => [L, [...lessons.keys()].filter(id => lessonBuilt(id, L)).length])) });
  // texts of the shared animations (docs/shared/sims-text.js), and the names of the terms they show: the flights (tab labels "Crosser →
  // · <local>", the name under a flight) and the points drawn on the canvas (English there: the stand words the course teaches).
  // window.CLAYSIMS_TERMS = {lang: {id: [en, local]}} — local only when it differs from the English name (glossary term_local, conf not low).
  { const keys = uniq([...SIM_KEYS, ...Object.keys(ui.en).filter(k => k.startsWith("anim_"))]);
    const st = Object.fromEntries(LANGS.map(L => [L, Object.fromEntries(keys.filter(k => ui.en[k] != null).map(k => [k, L === "uk" ? ukApos(ui[L][k] || ui.en[k]) : ui[L][k] || ui.en[k]]))]));
    const termIds = uniq([...((SIMREG && SIMREG.TERMS) || []), "pick-up-point", "hold-point", "break-point", "soft-focus", "hard-focus"]).filter(id => GBY[id]);
    const tn = Object.fromEntries(LANGS.map(L => [L, Object.fromEntries(termIds.map(id => { const en = enTerm(id), lo = L === "en" ? "" : localTerm(L, id);
      return [id, lo && lo.trim().toLowerCase() !== en.trim().toLowerCase() ? [en, L === "uk" ? ukApos(lo) : lo] : [en]]; }))]));
    FILES.set("shared/sims-text.js", `/* ${GEN} from content/academy/ui/<lang>.json and the glossary — texts of docs/shared/sims.js (all 11 ClayArena languages; English where a translation is missing) and the names of the terms the animations show. Do not edit. */\nwindow.CLAYSIMS_TEXT = ${JSON.stringify(st)};\nwindow.CLAYSIMS_TERMS = ${JSON.stringify(tn)};\n`); }
  // canvas words without room (review 08.10.2026): the "line" pill of the stand scenes sits between the referee and the shooter's vest
  // (sims.js shooter()); a long word covers the people beside the shooter on a phone (the German "Markierung" did; now "Linie")
  for (const L of LANGS) { const w = (ui[L] || {}).anim_line; if (w && [...w].length > 7) warn("canvas-word", `${L}: ui anim_line "${w}" has more than 7 letters: on a phone its pill covers the people beside the shooter; use the short word for "line"`, { lang: L }); }
  // the animations as the pages load them (minifySims(): docs/shared/sims.js minified; the source is read from the repo, not from --out)
  { const m = minifySims(); FILES.set("shared/sims.min.js", m.code);
    if (!m.minified) warn("sims-min", "docs/shared/sims.min.js is an unminified copy of docs/shared/sims.js: run the build with Bun (bun scripts/build_seo.mjs)"); }
  // lesson animation captions that the 9 overlay languages show as the generic caption (see heroOf): one warning per language
  for (const L of OVERLAY_LANGS) { const sc = SIM_CAP[L]; if (!sc) continue; const mi = uniq(sc.missing), stl = uniq(sc.stale);
    if (mi.length || stl.length) warn("sim-caption", `${L}: ${mi.length + stl.length} lesson animation captions show the generic caption (anim_w_<kind>) — ${mi.length} not translated${stl.length ? `, ${stl.length} translated from an older English text (${stl.join(", ")})` : ""}: translate body["<key>-sim"] of i18n/${L}/<lesson>.json in the next wave`, { lang: L }); }
  // share pictures to draw (python scripts/make_og.py)
  json("og/og-list.json", { _note: `${GEN}: the Academy share pictures (1200×630) that scripts/make_og.py draws. Do not edit.`, generated: opt.today, images: [...OG.values()] });
  // sitemaps per language: indexable built pages + old pages that still exist and are not replaced yet (transition)
  const stubUrls = new Set([...stubs.values()].map(s => s.from));
  const pageUrls = new Set([...PAGES.values()].map(p => p.url));
  const legacy = Object.fromEntries(LANGS.map(L => [L, []]));
  const legacyOk = url => { if (pageUrls.has(url) || stubUrls.has(url)) return false; const f = path.join(opt.docsRoot, fileOf(url)); if (!existsSync(f)) return false; const h = readFileSync(f, "utf8"); return !/http-equiv="refresh"/i.test(h) && !/<meta name="robots" content="noindex/i.test(h); };
  for (const [L, u] of [["uk", BASE + "learn/"], ["en", BASE + "en/learn/"], ["en", BASE + "interpreter/"]]) if (legacyOk(u)) legacy[L].push(u);
  for (const id of lock.learn || []) for (const L of ["uk", "en"]) { const u = `${BASE}${L === "uk" ? "" : "en/"}learn/${id}/`; if (legacyOk(u)) legacy[L].push(u); }
  for (const L of LANGS) { const u = `${BASE}interpreter/${L}/`; if (legacyOk(u)) legacy[L].push(u); for (const id of lock.interpreter || []) { const v = `${BASE}interpreter/${L}/${id}/`; if (legacyOk(v)) legacy[L].push(v); } }
  const urls = {}, sitemaps = [];
  for (const L of LANGS) {
    urls[L] = [...[...PAGES.values()].filter(p => p.L === L && p.index).map(p => p.url), ...legacy[L]];
    for (const u of urls[L]) if (stubUrls.has(u)) err("stub-in-sitemap", `${u} is a redirect stub and must not be in the sitemap`);
    if (!urls[L].length) continue;
    const name = `sitemap-learn-${L}.xml`; sitemaps.push(name);
    FILES.set(name, `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls[L].map(u => `  <url><loc>${esc(u)}</loc><lastmod>${opt.today}</lastmod></url>`).join("\n")}\n</urlset>\n`);
  }

  /* =================================================================================================================
     9. Output checks (SEO, trade marks, language codes, language rules on the rendered result)
     ================================================================================================================= */
  const titles = {}, ogUrls = new Set([...[...OG.values()].map(x => BASE + x.file), `${BASE}og/learn.png`]);
  for (const p of PAGES.values()) {
    const ctx = { lesson: p.lesson, lang: p.L };
    for (const [what, s] of [["title", p.title], ["h1", p.h1], ["og:title", p.ogTitle || p.title], ["description", p.desc]]) { const bad = lint.trademarkProblem(s); if (bad) err("trademark", `${p.url}: ${what} has "${bad}" without ™/® (audit G-07)`, ctx); }
    for (const a of p.alts || []) if (!pageUrls.has(a.url) && !(a.url === U.home("uk") && homeKept)) err("hreflang-dead", `${p.url}: hreflang ${a.l} → ${a.url}, which is not built`, ctx);
    for (const mm of p.html.matchAll(/\b(?:lang|hreflang)="([^"]+)"/g)) if (!LANGS.includes(mm[1]) && mm[1] !== "x-default") err("lang-code", `${p.url}: language code "${mm[1]}" outside the 11`, ctx);
    if (lint.COUNTRY_RE.test(p.html) || lint.FLAG_RE.test(p.html)) err("lang-country", `${p.url}: names the restricted country`, ctx);
    if (lint.RU_LETTERS_RE.test(p.html)) err("lang-letters", `${p.url}: letters Ukrainian does not use`, ctx);
    if (!ogUrls.has(p.img)) warn("og-image", `${p.url}: og:image ${p.img} is not in og-list.json`, ctx);
    (titles[p.L] ||= new Map()); const k = p.title.trim().toLowerCase(); if (titles[p.L].has(k)) err("title-duplicate", `${p.L}: "${p.title}" is the title of ${titles[p.L].get(k)} and ${p.url}`, ctx); else titles[p.L].set(k, p.url);
  }
  for (const [rel, s] of FILES) if (lint.COUNTRY_RE.test(s) || lint.FLAG_RE.test(s) || lint.RU_LETTERS_RE.test(s)) err("lang-country", `${rel}: breaks the language rule`);
  if (ukAposN) warn("uk-apostrophe", `uk: ${ukAposN} apostrophes between Cyrillic letters are ' or ʼ in the sources (mostly glossary names and law tables): the pages and data write them as ’ (U+2019); fix the sources when you edit them`, { lang: "uk" });
  for (const L of LANGS) if (uiFallback[L].size && [...PAGES.values()].some(p => p.L === L)) warn("ui-fallback", `${L}: ${uiFallback[L].size} interface strings fall back to English (${[...uiFallback[L]].slice(0, 8).join(", ")}${uiFallback[L].size > 8 ? ", …" : ""}): add them to content/academy/ui/${L}.json`, { lang: L });

  /* =================================================================================================================
     10. Report, then write (only when nothing blocks)
     ================================================================================================================= */
  // Lesson errors block only lessons that are meant to be published (review, ready, published). In a --draft preview no lesson
  // error blocks (the preview is never published): they are counted as "would block a real build".
  for (const f of findings) if (f.lesson) { if (isDraftLesson(f.lesson)) f.draft = true; else if (opt.draft && f.level === "error") f.preview = true; }
  const blockingList = findings.filter(f => f.level === "error" && !f.draft && !f.preview);
  const counts = { blocking: {}, preview_errors: {}, draft_errors: {}, warnings: {} };
  for (const f of findings) { const g = f.level === "warning" ? counts.warnings : f.draft ? counts.draft_errors : f.preview ? counts.preview_errors : counts.blocking; g[f.type] = (g[f.type] || 0) + 1; }
  const pagesBy = {}; for (const p of PAGES.values()) { (pagesBy[p.L] ||= {})[p.kind] = ((pagesBy[p.L] || {})[p.kind] || 0) + 1; }
  const stats = {
    lessons: { total: lessons.size, by_status: [...lessons.values()].reduce((a, m) => (a[m.status] = (a[m.status] || 0) + 1, a), {}) },
    lesson_pages: Object.fromEntries(LANGS.map(L => [L, [...lessons.keys()].filter(id => lessonBuilt(id, L)).length])),
    pages: pagesBy, stubs: [...stubs.values()].reduce((a, s) => (a[s.group] = (a[s.group] || 0) + 1, a), {}), stubs_pending: pending.length,
    sitemap_urls: Object.fromEntries(Object.entries(urls).map(([L, u]) => [L, u.length])), legacy_urls_kept: Object.values(legacy).reduce((n, a) => n + a.length, 0),
    og_images: OG.size, data_files: FILES.size
  };
  let written = false; // learnLinks() links to new pages only once they are on disk
  const result = { ok: !blockingList.length, blocking: blockingList.length, findings, counts, stats, urls, stubs: stubUrls, sitemaps, newTerms: [...THIN.values()], options: { ...opt } };
  result.learnLinks = learnLinksFactory();
  if (!opt.quiet || blockingList.length) printReport(result, opt);
  if (opt.report) { mkdirSync(path.dirname(path.resolve(opt.report)), { recursive: true }); writeFileSync(opt.report, JSON.stringify({ stats, counts, findings }, null, 1)); }
  if (blockingList.length || !opt.write) return result;
  const out = (rel, s) => { const f = path.join(opt.out, rel); mkdirSync(path.dirname(f), { recursive: true }); writeFileSync(f, s); };
  for (const p of PAGES.values()) out(p.rel, p.html);
  for (const [rel, s] of stubs) out(rel, s.html);
  for (const [rel, s] of FILES) out(rel, s);
  written = true;
  if (!opt.quiet) console.log(`written into ${opt.out}: ${PAGES.size} pages, ${stubs.size} redirect stubs, ${FILES.size} data files`);
  return result;

  /* ---------- glossary "Де вивчити" links (scripts/build_seo.mjs): final ids through id-map.json; old pages until replaced ---------- */
  function learnLinksFactory() {
    const byTerm = new Map(); // term id → [lesson id]
    const push = (t, id) => { if (!t || !lessons.has(id)) return; const a = byTerm.get(t) || []; if (!a.includes(id)) a.push(id); byTerm.set(t, a); };
    for (const m of lessons.values()) for (const t of m.terms || []) push(anyTermId(t), m.id);
    for (const t of Object.values(GBY)) for (const old of t.learn || []) push(t.id, lessons.has(old) ? old : (learnMap[old] || interpMap[old] || {}).to);
    for (const t of Object.values(GBY)) for (const old of t.interp || []) push(t.id, (interpMap[old] || {}).to);
    const order = id => { const pl = place.get(id) || {}; return (blockById[pl.block] || {}).order * 1000 + (lessons.get(id).level === 1 ? 0 : 500) + (pl.i || 0); };
    const onDisk = rel => { const f = path.join(opt.docsRoot, rel); return existsSync(f) && !/http-equiv="refresh"/i.test(readFileSync(f, "utf8")); };
    return (term, L) => {
      const ids = (byTerm.get(anyTermId(term) || term) || []).slice().sort((a, b) => order(a) - order(b)), out = [];
      for (const id of ids) {
        const m = lessons.get(id), pl = place.get(id) || {}, b = blockById[pl.block];
        const live = l => lessonBuilt(id, l) && m.status !== "draft" && (written || onDisk(fileOf(U.lesson(l, id))));
        if (live(L)) { out.push({ id, url: U.lesson(L, id), title: tm(view(m, L).title), context: tm(SH.block(L, b, "title") || academyName(L)), lang: L }); continue; }
        if (OVERLAY_LANGS.includes(L) && live("en")) { out.push({ id, url: U.lesson("en", id), title: tm(view(m, "en").title), context: (GUI[L] || {}).acad_en || academyName("en"), lang: "en" }); continue; }
        // transition: the old page of this lesson is still on the site (before the switch-over release)
        if ((L === "uk" || L === "en") && ((m.legacy || {}).learn || []).includes(id) && onDisk(`${L === "uk" ? "" : "en/"}learn/${id}/index.html`)) { out.push({ id, url: `${BASE}${L === "uk" ? "" : "en/"}learn/${id}/`, title: tm(plainOf((m.title || {})[L] || (m.title || {}).en || id, L)), context: academyName(L), lang: L, legacy: true }); continue; }
        const io = ((m.legacy || {}).interpreter || []).find(x => onDisk(`interpreter/${L}/${x}/index.html`));
        if (io) { const own = io === id, tb = (m.body || []).find(b => b.k === `${io}-title`);
          const t = own ? (L === "en" || L === "uk" ? (m.title || {})[L] : (overlays[L].get(id) || {}).title) : tb ? valOf(m, { part: "body", k: tb.k, it: tb }, L).v : null;
          if (t) out.push({ id, url: `${BASE}interpreter/${L}/${io}/`, title: tm(plainOf(t, L)), context: (GUI[L] || {}).ia || (L === "uk" ? "Академія перекладача ClayArena" : "ClayArena Interpreter Academy"), lang: L, legacy: true }); }
      }
      return L === "uk" ? out.map(x => ({ ...x, title: ukApos(x.title), context: ukApos(x.context) })) : out;
    };
  }
}

/* ---------- console report: counts by type (errors that block, errors of draft lessons, warnings) ---------- */
function printReport(r, opt) {
  const line = (title, obj) => { const e = Object.entries(obj).sort((a, b) => b[1] - a[1]); console.log(`${title}: ${e.reduce((n, x) => n + x[1], 0)}`); for (const [k, v] of e) console.log(`   ${String(v).padStart(5)}  ${k}`); };
  console.log(`\nClayArena Academy build — ${opt.today}${opt.draft ? " — DRAFT PREVIEW (draft lessons built, noindex)" : ""} — FITASC_INDEX=${opt.fitascIndex}`);
  console.log(`lessons: ${r.stats.lessons.total} ${JSON.stringify(r.stats.lessons.by_status)} · lesson pages per language: ${JSON.stringify(r.stats.lesson_pages)}`);
  console.log(`pages: ${JSON.stringify(r.stats.pages)}`);
  console.log(`redirect stubs: ${JSON.stringify(r.stats.stubs)} · pending (target not published yet): ${r.stats.stubs_pending} · sitemap URLs: ${JSON.stringify(r.stats.sitemap_urls)} (old pages kept: ${r.stats.legacy_urls_kept}) · share pictures: ${r.stats.og_images}`);
  line("ERRORS (block the build)", r.counts.blocking);
  if (opt.draft) line("errors in review/ready lessons (would block a real build; not blocking in the --draft preview)", r.counts.preview_errors);
  line("errors in draft lessons (" + (opt.draft ? "built only in this preview" : "not built") + ", do not block)", r.counts.draft_errors);
  line("warnings", r.counts.warnings);
  const show = r.findings.filter(f => f.level === "error" && !f.draft).slice(0, 40);
  if (show.length) { console.log(`\n${opt.draft ? "errors that would block a real build" : "blocking errors"} (first 40):`); for (const f of show) console.log(`  - [${f.type}] ${f.msg}`); }
  if (!r.ok) console.log("\nBUILD STOPPED: nothing was written. Fix the errors above.");
}

/* ---------- command line ---------- */
if (import.meta.main) {
  const a = process.argv.slice(2), val = k => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : undefined; };
  try {
    const r = await buildAcademy({ out: val("--out"), docsRoot: val("--docs-root"), base: val("--base"), report: val("--report"), draft: a.includes("--draft"),
      write: !a.includes("--check"), quiet: a.includes("--quiet"), ownHome: a.includes("--own-home") });
    process.exit(r.ok ? 0 : 1);
  } catch (e) { console.error("ERROR: " + e.message); process.exit(2); }
}
