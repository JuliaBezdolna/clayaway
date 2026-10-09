/* Data checks of the FITASC rules guide and the rules trainer (docs/rules/data/), run with Bun from the project root:
     bun scripts/check_rules_data.mjs            the checks; exit code 1 on any error (nothing is written)
     bun scripts/check_rules_data.mjs --quiet    print only the errors and the summary line
   scripts/build_seo.mjs runs the same checks first (checkRulesData) and stops before writing anything when they fail.

   What it checks (rules/SCHEMA.md and rules/QUIZ_SCHEMA.md; handover 09.10.2026 — before this script these rules were only written down):
   - rulebooks sporting.js, compak.js: every section and item id is unique (one id = one rule item across both books: the Academy cites
     them as "<book>:<id>"), every item has a page number ≥ 1 and, when the local FITASC text is there, a page inside that PDF; every FAQ
     answer refs only items of its own book;
   - trainer banks quiz-sporting.js, quiz-compak.js: question ids unique across both banks, refs into the book of the same key, 2–4
     options (truefalse: 2), the answer index inside the options; translations docs/rules/data/i18n/quiz-<lang>.json name only
     existing questions (warning);
   - copyright (audit R-01): no 10 or more words in a row equal to the FITASC rulebook text in summary_en, points_en, title_en, the FAQ
     (q_en, a_en) and the trainer (q_en, option en, explain_en). The FITASC text is the local cache rules/pdf/*.txt (not in git:
     `python scripts/fitasc_check.py --fetch` on a fresh clone, needs pdftotext); without it this check is skipped with a warning.
     The cache holds the English rulebooks and quick guides only, so the check covers the English texts (the Ukrainian ones are
     translations of them);
   - other disciplines (owner decision 08.10.2026, DEVELOPERS.md §4k): the build of the Academy never reads these files, so the same
     patterns (lint.otherDiscipline) are checked here in every en/uk text of the books and the banks and in the trainer translations.
   In production the same checks belong in the CI of the rules data. */
import { readFileSync, existsSync, readdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as lint from "./academy/lint.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA = path.join(ROOT, "docs", "rules", "data");

export async function checkRulesData({ quiet = false } = {}) {
  const errors = [], warnings = [];
  const E = m => errors.push(m), W = m => warnings.push(m);
  globalThis.window = globalThis.window || {};
  const prevRules = window.RULES, prevQuiz = window.RULES_QUIZ;
  window.RULES = []; window.RULES_QUIZ = [];
  for (const f of ["sporting.js", "compak.js", "quiz-sporting.js", "quiz-compak.js"])
    new Function("window", readFileSync(path.join(DATA, f), "utf8"))(window); // plain data files (window.RULES / RULES_QUIZ push)
  const books = window.RULES, banks = window.RULES_QUIZ;
  window.RULES = prevRules; window.RULES_QUIZ = prevQuiz;
  const FC = lint.loadFitascCache(ROOT);
  if (!FC) W("rules/pdf/*.txt not found: the 10-words-in-a-row FITASC check was skipped (python scripts/fitasc_check.py --fetch)");
  const pagesOf = file => { const t = path.join(ROOT, "rules", "pdf", String(file || "").replace(/\.pdf$/i, ".txt"));
    return existsSync(t) ? readFileSync(t, "utf8").split("\f").length : null; };
  const verbatim = (where, s) => { if (!FC || !s) return; const f = lint.fitascMatch(s, FC);
    if (f) E(`${where}: ${f.words} words in a row equal to the FITASC text ("${f.text.slice(0, 90)}…") — retell it in other words (audit R-01)`); };
  const other = (where, s) => { const m = lint.otherDiscipline(s); if (m) E(`${where}: another discipline or federation is named ("${m}"; owner decision 08.10.2026, DEVELOPERS.md §4k)`); };
  const texts = (where, o, keys) => { for (const k of keys) { const v = o[k]; for (const s of Array.isArray(v) ? v : [v]) if (typeof s === "string") other(`${where} ${k}`, s); } };

  // ---- rulebooks
  const itemBook = new Map(), sectionIds = new Set();
  for (const b of books) {
    const pages = pagesOf(b.source && b.source.file);
    if (FC && pages == null) W(`${b.key}: the text of ${b.source && b.source.file} is not in rules/pdf/: page numbers not checked`);
    texts(`${b.key}`, b, ["title_en", "title_uk"]);
    for (const s of b.sections || []) {
      if (sectionIds.has(`${b.key}:${s.id}`)) E(`${b.key}: section id ${s.id} twice`); sectionIds.add(`${b.key}:${s.id}`);
      texts(`${b.key} ${s.id}`, s, ["title_en", "title_uk"]);
      for (const it of s.items || []) {
        const w = `${b.key} ${it.id}`;
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(it.id || "")) E(`${w}: id is not kebab-case`);
        if (itemBook.has(it.id)) E(`${w}: item id also in ${itemBook.get(it.id)}`); itemBook.set(it.id, b.key);
        if (!Number.isInteger(it.page) || it.page < 1) E(`${w}: page ${it.page} is not a PDF page number`);
        else if (pages && it.page > pages) E(`${w}: page ${it.page} is beyond the ${pages} pages of ${b.source.file}`);
        for (const k of ["summary_en", "title_en"]) verbatim(`${w} ${k}`, it[k]);
        (it.points_en || []).forEach((p, i) => verbatim(`${w} points_en[${i}]`, p));
        texts(w, it, ["title_en", "title_uk", "summary_en", "summary_uk", "points_en", "points_uk", "keywords"]);
      }
    }
  }
  for (const b of books) (b.faq || []).forEach((q, i) => {
    const w = `${b.key} faq[${i}]`;
    if (!(q.refs || []).length) W(`${w}: no refs`);
    for (const r of q.refs || []) if (itemBook.get(r) !== b.key) E(`${w}: ref ${r} is ${itemBook.has(r) ? "an item of " + itemBook.get(r) : "not an item"}`);
    for (const k of ["q_en", "a_en"]) verbatim(`${w} ${k}`, q[k]);
    texts(w, q, ["q_en", "q_uk", "a_en", "a_uk"]);
  });

  // ---- trainer banks
  const qids = new Map();
  for (const bank of banks) {
    if (!books.some(b => b.key === bank.key)) E(`quiz-${bank.key}.js: no rulebook "${bank.key}"`);
    for (const q of bank.questions || []) {
      const w = `quiz-${bank.key} ${q.id}`;
      if (qids.has(q.id)) E(`${w}: question id also in quiz-${qids.get(q.id)}`); qids.set(q.id, bank.key);
      const n = (q.options || []).length;
      if (q.type === "truefalse" ? n !== 2 : n < 2 || n > 4) E(`${w}: ${n} options for type ${q.type}`);
      if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= n) E(`${w}: answer ${q.answer} is not an option index`);
      if (!(q.refs || []).length) E(`${w}: no refs`);
      for (const r of q.refs || []) if (itemBook.get(r) !== bank.key) E(`${w}: ref ${r} is ${itemBook.has(r) ? "an item of " + itemBook.get(r) : "not an item"}`);
      for (const k of ["q_en", "explain_en"]) verbatim(`${w} ${k}`, q[k]);
      (q.options || []).forEach((o, i) => { verbatim(`${w} option ${i}`, o.en); texts(`${w} option ${i}`, o, ["en", "uk"]); });
      texts(w, q, ["q_en", "q_uk", "explain_en", "explain_uk"]);
    }
  }
  const i18n = path.join(DATA, "i18n");
  if (existsSync(i18n)) for (const f of readdirSync(i18n).filter(f => /^quiz-[a-z]{2}\.json$/.test(f))) {
    let d; try { d = JSON.parse(readFileSync(path.join(i18n, f), "utf8")); } catch (e) { E(`i18n/${f}: not valid JSON (${e.message})`); continue; }
    const qs = d.questions || {};
    const orphan = Object.keys(qs).filter(id => !qids.has(id));
    if (orphan.length) W(`i18n/${f}: translations of questions that are not in the banks: ${orphan.join(", ")}`);
    for (const [id, t] of Object.entries(qs)) { const m = lint.otherDiscipline(JSON.stringify(t)); if (m) E(`i18n/${f} ${id}: another discipline or federation is named ("${m}")`); }
    for (const [k, v] of Object.entries(d.ui || {})) if (typeof v === "string") other(`i18n/${f} ui.${k}`, v);
  }

  if (!quiet || errors.length) for (const m of errors) console.log("ERROR rules data:", m);
  if (!quiet) for (const m of warnings) console.log("WARNING rules data:", m);
  console.log(`rules data (docs/rules/data): ${itemBook.size} items, ${qids.size} trainer questions — ${errors.length} errors, ${warnings.length} warnings${FC ? "" : " (FITASC text check skipped)"}`);
  return { ok: !errors.length, errors, warnings };
}

if (import.meta.main || process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.includes("-h") || args.includes("--help")) { console.log("bun scripts/check_rules_data.mjs [--quiet]   (writes nothing; exit code 1 on errors)"); process.exit(0); }
  const bad = args.filter(a => a !== "--quiet");
  if (bad.length) { console.error(`ERROR: unknown option ${bad[0]}`); process.exit(1); }
  const r = await checkRulesData({ quiet: args.includes("--quiet") });
  process.exit(r.ok ? 0 : 1);
}
