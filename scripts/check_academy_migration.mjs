#!/usr/bin/env bun
/* =====================================================================================================
   ClayArena Academy — check the one-time migration (scripts/migrate_academy.mjs) against the OLD sources.

   Independent of the migration code: it re-reads the old sources (since 08.10.2026 in archive/legacy-docs/: learn/data/*.js and interpreter/src/**) and proves that
     1. every file under content/academy/ parses as JSON (ids.lock too);
     2. there are 142 masters, file name = id, ids are unique, none is a reserved URL word, each sits in exactly
        one section of one block, every route lists existing ids, the interpreter route holds every lesson with
        Interpreter Academy text;
     3. each of the 186 old lessons is listed in exactly one master's "legacy";
     4. every old title, summary, paragraph, key point, "did you know", phrase and quiz (question, options, answer,
        explanation) is present BYTE-IDENTICAL under its stable key, and the counts per lesson match
        (and, as a second net, every old string occurs somewhere in content/academy);
     5. the 9 overlays carry every Interpreter Academy translation byte-identical, and every hash "h" equals the
        first 8 hex of SHA-1 of the English text in the master; h_uk in the masters is right too;
     4c. every old term, rule_ref and source (title, url, rel) is in the master that holds the lesson; every old new_term is
        still pending in new_terms, already in the glossary with the same wording, or kept in todo.term_defs; law blocks keep
        country and part, and laws/<CC>.json are byte copies of archive/legacy-docs/learn/data/laws-<cc>.json; legacy/modules.json keeps
        every module and mission title and intro (missions in 11 languages);
     6. keys "k" are unique in each master and in the whole Academy; quiz answers are given by option key;
     7. ids.lock, id-map.json (redirect groups A–G, 737 stubs), ui/<lang>.json (11 languages, incl. the law-table strings), facts.json;
     8. project language rules: only the 11 ClayArena language codes; no Cyrillic letters that Ukrainian does not use (U+044B, U+044D, U+044A, U+0451); the restricted country
        is not named (the check is built from character codes so this file does not contain the word either).

   ⚠ ONE-TIME, HISTORICAL CHECK. It proved the migration of 10.2026 (result then: OK, byte-identical). Since then the editors
   rewrite content/academy/ on purpose (audit fixes, merged lessons, new texts), so "text differs" and similar findings are
   EXPECTED now and say nothing about the quality of the content. The checks that matter from now on run in
   scripts/build_academy.mjs (--check). Keep this file as the record of how the migration was verified.

   Run:  bun scripts/check_academy_migration.mjs            → prints the findings and a notice; exit code 0 (historical)
         bun scripts/check_academy_migration.mjs --strict   → exit code 1 when anything differs (only meaningful right after a migration)
   ===================================================================================================== */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const A = path.join(ROOT, "content/academy");
const LANGS = ["en", "uk", "de", "fr", "it", "cs", "pl", "pt", "hu", "fi", "lt"];
const OVERLAY_LANGS = LANGS.slice(2);
const RESERVED = ["topics", "routes", "practice", "progress", "app", "data", "assets"];
const BLOCK_IDS = ["basics", "safety", "gear", "targets", "technique", "training", "mind", "rules", "competitions", "travel", "stand-talk", "watch", "community"];
const OPT = "abcdefgh".split("");
const sha8 = (s) => createHash("sha1").update(String(s), "utf8").digest("hex").slice(0, 8);

const errors = [];
const err = (m) => { errors.push(m); };
const stats = { files: 0, strings_checked: 0, keyed_items_checked: 0, overlay_items_checked: 0, hashes_checked: 0 };
const STRICT = process.argv.includes("--strict");
/* Result and exit code (see the header): historical by default (exit 0 with a notice), --strict fails on any difference. */
function finish(head) {
  if (head) console.log(JSON.stringify(head, null, 2));
  if (!errors.length) { console.log("OK: the migration is complete and byte-identical."); process.exit(0); }
  console.log(`\n${errors.length} differences from the one-time migration${STRICT ? " (ERRORS: --strict)" : ""}`);
  for (const e of errors.slice(0, STRICT ? 200 : 20)) console.log("  - " + e);
  if (!STRICT && errors.length > 20) console.log(`  … ${errors.length - 20} more (--strict lists 200)`);
  if (STRICT) process.exit(1);
  console.log("\nNOTICE: this is a one-time, historical check of the 10.2026 migration. content/academy/ has been edited since, so these\n" +
    "differences are expected and do not block anything. Content checks: bun scripts/build_academy.mjs --check. Exit code 0.");
  process.exit(0);
}
// Edited content can have shapes the migration never wrote (a key that is now another kind of item): stop and report, never crash.
process.on("uncaughtException", (x) => { errors.unshift(`the check stopped early (${x && x.message}): the content no longer has the shape the migration wrote`); finish(stats); });

/* ---------- 1. every file parses ---------- */
const all = new Map();                                       // rel path → parsed JSON
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { walk(p); continue; }
    const rel = path.relative(A, p).split(path.sep).join("/");
    if (rel.endsWith(".md")) continue;
    if (!rel.endsWith(".json") && rel !== "ids.lock") { err(`unexpected file ${rel}`); continue; }
    stats.files++;
    try { all.set(rel, JSON.parse(fs.readFileSync(p, "utf8"))); } catch (x) { err(`JSON does not parse: ${rel}: ${x.message}`); }
  }
})(A);
const get = (rel) => { const v = all.get(rel); if (v === undefined) err(`missing file ${rel}`); return v; };

/* ---------- old sources ---------- */
const ctx = { window: {} }; vm.createContext(ctx);
// The frozen old sources were moved out of docs/ (not published any more) to archive/legacy-docs/ on 08.10.2026 (owner decision:
// the site names no other clay discipline; these files still did). Byte content unchanged, see archive/legacy-docs/README.md.
const LD = path.join(ROOT, "archive/legacy-docs/learn/data");
for (const f of fs.readdirSync(LD).filter((f) => f.endsWith(".js")).sort()) vm.runInContext(fs.readFileSync(path.join(LD, f), "utf8"), ctx);
const OLD_L = new Map(ctx.window.LEARN.flatMap((m) => m.lessons).map((l) => [l.id, l]));
const ID = path.join(ROOT, "archive/legacy-docs/interpreter/src");
const missions = fs.readdirSync(path.join(ID, "missions")).filter((f) => f.endsWith(".json")).map((f) => JSON.parse(fs.readFileSync(path.join(ID, "missions", f), "utf8")));
const OLD_I = new Map(missions.flatMap((m) => m.lessons).map((l) => [l.id, l]));
const TR = {}, TR_MISSIONS = {};
for (const lg of OVERLAY_LANGS) {
  const d = JSON.parse(fs.readFileSync(path.join(ID, "i18n", lg + ".json"), "utf8"));
  TR[lg] = { ui: d.ui, lessons: {} };
  TR_MISSIONS[lg] = d.missions;
  for (const mm of Object.values(d.missions)) for (const [id, l] of Object.entries(mm.lessons)) TR[lg].lessons[id] = l;
}
const UI_I = JSON.parse(fs.readFileSync(path.join(ID, "ui.json"), "utf8"));
if (OLD_L.size !== 123) err(`expected 123 old Academy lessons, found ${OLD_L.size}`);
if (OLD_I.size !== 63) err(`expected 63 old Interpreter Academy lessons, found ${OLD_I.size}`);

/* ---------- 2. masters, blocks, routes ---------- */
const masters = new Map();
for (const [rel, v] of all) if (rel.startsWith("lessons/")) {
  const id = rel.slice(8, -5);
  if (v.id !== id) err(`${rel}: id "${v.id}" differs from the file name`);
  if (masters.has(v.id)) err(`duplicate lesson id ${v.id}`);
  masters.set(v.id, v);
}
if (masters.size !== 142) err(`expected 142 masters, found ${masters.size}`);
for (const id of masters.keys()) {
  if (RESERVED.includes(id)) err(`lesson id equals a reserved word: ${id}`);
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) err(`lesson id is not kebab-case: ${id}`);
}
const blocks = get("blocks.json") || [];
const where = {};
for (const b of blocks) for (const s of b.sections) for (const l of s.lessons) {
  if (where[l]) err(`lesson ${l} is in two sections (${where[l]} and ${b.id}/${s.id})`);
  where[l] = `${b.id}/${s.id}`;
  if (!masters.has(l)) err(`blocks.json lists ${l}, which has no master`);
}
for (const id of masters.keys()) if (!where[id]) err(`lesson ${id} is in no block`);
if (JSON.stringify(blocks.map((b) => b.id)) !== JSON.stringify(BLOCK_IDS)) err("blocks.json: the 13 blocks or their order differ from the design");
for (const b of blocks) for (const st of b.starters) if (!b.sections.some((s) => s.lessons.includes(st))) err(`starter ${st} not in block ${b.id}`);
for (const b of blocks) for (const s of b.sections) for (const l of s.lessons) {
  const lv = masters.get(l)?.level, star = b.starters.includes(l);
  if (lv !== (star ? 1 : 2)) err(`${l}: level ${lv} does not match starters of ${b.id}`);
}
const routes = get("routes.json") || [];
if (routes.length !== 7) err(`expected 7 routes, found ${routes.length}`);
for (const r of routes) for (const l of [...r.stages.flatMap((s) => s.lessons), ...r.extras]) if (!masters.has(l)) err(`route ${r.id} lists unknown lesson ${l}`);
const interpRoute = new Set((routes.find((r) => r.id === "interpreter")?.stages || []).flatMap((s) => s.lessons));
for (const [id, M] of masters) if (M.legacy?.interpreter?.length && !interpRoute.has(id)) err(`${id} has Interpreter Academy text but is not required in the interpreter route`);
const nStages = routes.reduce((a, r) => a + r.stages.length, 0);
if (nStages !== 25) err(`expected 25 route stages, found ${nStages}`);

/* ---------- 3. legacy: each old lesson in exactly one master ---------- */
const owner = {};
for (const [id, M] of masters) {
  if (!M.legacy || !Array.isArray(M.legacy.learn) || !Array.isArray(M.legacy.interpreter)) { err(`${id}: legacy {learn:[], interpreter:[]} missing`); continue; }
  for (const o of M.legacy.learn) { if (!OLD_L.has(o)) err(`${id}: legacy.learn has unknown id ${o}`); if (owner[o]) err(`old lesson ${o} is in two masters: ${owner[o]} and ${id}`); owner[o] = id; }
  for (const o of M.legacy.interpreter) { if (!OLD_I.has(o)) err(`${id}: legacy.interpreter has unknown id ${o}`); if (owner[o]) err(`old lesson ${o} is in two masters: ${owner[o]} and ${id}`); owner[o] = id; }
}
for (const o of [...OLD_L.keys(), ...OLD_I.keys()]) if (!owner[o]) err(`old lesson ${o} is in no master`);

/* ---------- 4./5. byte-identical content by key, counts, overlays, hashes ---------- */
const same = (a, b, what) => { stats.keyed_items_checked++; if (a !== b) err(`${what}: text differs (${JSON.stringify(a)?.slice(0, 60)} ≠ ${JSON.stringify(b)?.slice(0, 60)})`); };
const items = (M) => [...M.body, ...M.note, ...M.phrases, ...M.key_points, ...(M.did_you_know ? [M.did_you_know] : []), ...M.quiz, ...M.exam_pool];
const byKey = (M) => new Map(items(M).map((x) => [x.k, x]));
const hashOf = (x) => x.options ? sha8([x.q.en, ...x.options.map((o) => o.en), x.explain.en].join("\n"))
                    : x.meaning ? sha8(x.en + "\n" + x.meaning.en) : sha8(x.en);
const count = (M, list, re) => M[list].filter((x) => re.test(x.k)).length;
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function checkQuiz(x, qEn, qUk, optsEn, optsUk, answer, exEn, exUk, w) {
  if (!x) { err(`${w}: quiz item missing`); return; }
  same(x.q.en, qEn, w + ".q.en"); same(x.q.uk, qUk, w + ".q.uk"); same(x.explain.en, exEn, w + ".explain.en"); same(x.explain.uk, exUk, w + ".explain.uk");
  if (x.options.length !== optsEn.length) err(`${w}: ${x.options.length} options instead of ${optsEn.length}`);
  x.options.forEach((o, j) => { if (o.k !== OPT[j]) err(`${w}: option ${j} key ${o.k}`); same(o.en, optsEn[j], `${w}.${o.k}.en`); same(o.uk, optsUk[j], `${w}.${o.k}.uk`); });
  if (x.correct !== OPT[answer]) err(`${w}: correct "${x.correct}" but the old answer index was ${answer}`);
  if (typeof x.correct !== "string" || !x.options.some((o) => o.k === x.correct)) err(`${w}: correct is not an option key`);
}
for (const [o, L] of OLD_L) {
  const M = masters.get(owner[o]); if (!M) continue;
  const K = byKey(M), own = M.id === o;
  const T = own ? M.title : K.get(`${o}-title`), S = own ? M.summary : K.get(`${o}-summary`);
  if (!T || !S) { err(`${o}: title/summary missing in ${M.id}`); continue; }
  same(T.en, L.title_en, `${o} title.en`); same(T.uk, L.title_uk, `${o} title.uk`); same(S.en, L.summary_en, `${o} summary.en`); same(S.uk, L.summary_uk, `${o} summary.uk`);
  if (!own && (K.get(`${o}-title`).t !== "draft" || K.get(`${o}-title`).anchor !== o)) err(`${o}: merged title block must be t:"draft" with anchor "${o}"`);
  const np = count(M, "body", new RegExp(`^${esc(o)}-p\\d+$`));
  if (np !== L.body_en.length) err(`${o}: ${np} paragraphs in ${M.id}, the old lesson had ${L.body_en.length}`);
  L.body_en.forEach((en, i) => { const x = K.get(`${o}-p${i + 1}`); if (!x) return err(`${o}-p${i + 1} missing`);
    same(x.en, en, `${o}-p${i + 1}.en`); same(x.uk, L.body_uk[i], `${o}-p${i + 1}.uk`);
    if (!own && (x.t !== "draft" || x.from !== o)) err(`${o}-p${i + 1}: merged paragraph must be {"t":"draft","from":"${o}"}`); });
  const nk = count(M, "key_points", new RegExp(`^${esc(o)}-kp\\d+$`));
  if (nk !== L.key_points_en.length) err(`${o}: ${nk} key points, the old lesson had ${L.key_points_en.length}`);
  L.key_points_en.forEach((en, i) => { const x = K.get(`${o}-kp${i + 1}`); if (!x) return err(`${o}-kp${i + 1} missing`); same(x.en, en, `${o}-kp${i + 1}.en`); same(x.uk, L.key_points_uk[i], `${o}-kp${i + 1}.uk`); });
  if (L.did_you_know_en || L.did_you_know_uk) { const x = K.get(`${o}-dyk`); if (!x) err(`${o}-dyk missing`); else { same(x.en, L.did_you_know_en, `${o}-dyk.en`); same(x.uk, L.did_you_know_uk, `${o}-dyk.uk`); } }
  const nq = [...M.quiz, ...M.exam_pool].filter((x) => new RegExp(`^${esc(o)}-q\\d+$`).test(x.k)).length;
  if (nq !== L.quiz.length) err(`${o}: ${nq} quiz questions, the old lesson had ${L.quiz.length}`);
  L.quiz.forEach((q, i) => checkQuiz(K.get(`${o}-q${i + 1}`), q.q_en, q.q_uk, q.options.map((x) => x.en), q.options.map((x) => x.uk), q.answer, q.explain_en, q.explain_uk, `${o}-q${i + 1}`));
  const nl = M.body.filter((x) => new RegExp(`^${esc(o)}-law\\d+$`).test(x.k)).length;
  if (nl !== (L.law_tables || []).length) err(`${o}: ${nl} law blocks, the old lesson had ${(L.law_tables || []).length}`);
}
for (const [o, I] of OLD_I) {
  const M = masters.get(owner[o]); if (!M) continue;
  const K = byKey(M), own = M.id === o;
  const T = own ? M.title : K.get(`${o}-title`);
  if (!T) { err(`${o}: title missing in ${M.id}`); continue; }
  same(T.en, I.title.en, `${o} title.en`); same(T.uk, I.title.uk, `${o} title.uk`);
  const np = count(M, "body", new RegExp(`^${esc(o)}-p\\d+$`));
  if (np !== I.body.en.length) err(`${o}: ${np} paragraphs, the old lesson had ${I.body.en.length}`);
  I.body.en.forEach((en, i) => { const x = K.get(`${o}-p${i + 1}`); if (!x) return err(`${o}-p${i + 1} missing`);
    same(x.en, en, `${o}-p${i + 1}.en`); same(x.uk, I.body.uk[i], `${o}-p${i + 1}.uk`);
    if (!own && (x.t !== "draft" || x.from !== o)) err(`${o}-p${i + 1}: merged paragraph must be {"t":"draft","from":"${o}"}`); });
  const nk = count(M, "key_points", new RegExp(`^${esc(o)}-kp\\d+$`));
  if (nk !== I.key_points.en.length) err(`${o}: ${nk} key points, the old lesson had ${I.key_points.en.length}`);
  I.key_points.en.forEach((en, i) => { const x = K.get(`${o}-kp${i + 1}`); if (!x) return err(`${o}-kp${i + 1} missing`); same(x.en, en, `${o}-kp${i + 1}.en`); same(x.uk, I.key_points.uk[i], `${o}-kp${i + 1}.uk`); });
  const nph = count(M, "phrases", new RegExp(`^${esc(o)}-ph\\d+$`));
  if (nph !== I.coach_says.length) err(`${o}: ${nph} phrases, the old lesson had ${I.coach_says.length}`);
  I.coach_says.forEach((c, i) => { const x = K.get(`${o}-ph${i + 1}`); if (!x) return err(`${o}-ph${i + 1} missing`);
    same(x.en, c.en, `${o}-ph${i + 1}.en`); same(x.meaning.en, c.meaning.en, `${o}-ph${i + 1}.meaning.en`); same(x.meaning.uk, c.meaning.uk, `${o}-ph${i + 1}.meaning.uk`);
    same(JSON.stringify(x.say), JSON.stringify(c.say), `${o}-ph${i + 1}.say`); });
  const nq = [...M.quiz, ...M.exam_pool].filter((x) => new RegExp(`^${esc(o)}-q\\d+$`).test(x.k)).length;
  if (nq !== I.quiz.length) err(`${o}: ${nq} quiz questions, the old lesson had ${I.quiz.length}`);
  I.quiz.forEach((q, i) => checkQuiz(K.get(`${o}-q${i + 1}`), q.q.en, q.q.uk, q.options.en, q.options.uk, q.answer, q.why.en, q.why.uk, `${o}-q${i + 1}`));
  if (I.sim) { const x = K.get(`${o}-sim`); if (!x) err(`${o}-sim missing`); else same(JSON.stringify(x.sim), JSON.stringify(I.sim), `${o}-sim`); }
  // overlays: the 9 translations, byte-identical, with the right hashes
  for (const lg of OVERLAY_LANGS) {
    const ov = all.get(`i18n/${lg}/${M.id}.json`), t = TR[lg].lessons[o];
    if (!ov) { err(`overlay i18n/${lg}/${M.id}.json missing (needed for ${o})`); continue; }
    const ck = (a, b, w) => { stats.overlay_items_checked++; if (a !== b) err(`${lg} ${w}: translation differs`); };
    if (own) { ck(ov.title, t.title, `${o} title`); }
    else ck(ov.body[`${o}-title`], t.title, `${o}-title`);
    t.body.forEach((tx, i) => ck(ov.body[`${o}-p${i + 1}`], tx, `${o}-p${i + 1}`));
    if (Object.keys(ov.body).filter((k) => new RegExp(`^${esc(o)}-p\\d+$`).test(k)).length !== t.body.length) err(`${lg} ${o}: paragraph count differs`);
    t.key_points.forEach((tx, i) => ck(ov.key_points[`${o}-kp${i + 1}`], tx, `${o}-kp${i + 1}`));
    t.coach_says.forEach((c, i) => { const p = ov.phrases[`${o}-ph${i + 1}`] || {}; ck(p.meaning, c.meaning, `${o}-ph${i + 1}.meaning`); ck(p.say, c.say, `${o}-ph${i + 1}.say`); });
    t.quiz.forEach((qq, i) => { const x = ov.quiz[`${o}-q${i + 1}`] || {}; ck(x.q, qq.q, `${o}-q${i + 1}.q`); ck(x.explain, qq.why, `${o}-q${i + 1}.explain`);
      qq.options.forEach((op, j) => ck((x.options || {})[OPT[j]], op, `${o}-q${i + 1}.${OPT[j]}`)); });
  }
}

/* overlays in general: only the 9 languages, keys exist in the master, every hash matches the master's English */
for (const [rel, ov] of all) if (rel.startsWith("i18n/")) {
  const [, lg, file] = rel.split("/");
  if (!OVERLAY_LANGS.includes(lg)) { err(`overlay folder for a language outside the 9: ${lg}`); continue; }
  const M = masters.get(file.slice(0, -5));
  if (!M) { err(`${rel}: no master`); continue; }
  if (ov.id !== M.id || ov.lang !== lg) err(`${rel}: id/lang header wrong`);
  const K = byKey(M);
  const keys = new Set([...Object.keys(ov.body), ...Object.keys(ov.note), ...Object.keys(ov.phrases), ...Object.keys(ov.key_points), ...Object.keys(ov.quiz)]);
  if ("title" in ov) keys.add("title");
  if ("summary" in ov) keys.add("summary");
  for (const k of keys) {
    const src = k === "title" ? M.title : k === "summary" ? M.summary : K.get(k);
    if (!src) { err(`${rel}: key ${k} not in the master`); continue; }
    stats.hashes_checked++;
    const h = k === "title" || k === "summary" ? sha8(src.en) : hashOf(src);
    if (ov.h[k] !== h) err(`${rel}: h[${k}] = ${ov.h[k]}, expected ${h}`);
  }
  for (const k of Object.keys(ov.h)) if (!keys.has(k)) err(`${rel}: h has key ${k} without text`);
}

/* ---------- 6. keys, quiz shape, h_uk, statuses ---------- */
const globalKeys = new Map();
for (const [id, M] of masters) {
  const seen = new Set();
  for (const x of items(M)) {
    if (!x.k) { err(`${id}: an item has no key "k"`); continue; }
    if (seen.has(x.k)) err(`${id}: duplicate key ${x.k}`);
    seen.add(x.k);
    if (globalKeys.has(x.k)) err(`key ${x.k} is used in ${globalKeys.get(x.k)} and ${id}`);
    globalKeys.set(x.k, id);
  }
  for (const q of [...M.quiz, ...M.exam_pool]) {
    const ok = q.options.map((o) => o.k);
    if (new Set(ok).size !== ok.length) err(`${id} ${q.k}: option keys repeat`);
    if (typeof q.correct !== "string" || !ok.includes(q.correct)) err(`${id} ${q.k}: correct must be an option key`);
  }
  for (const [k, h] of Object.entries(M.h_uk || {})) {
    const src = k === "title" ? M.title : k === "summary" ? M.summary : byKey(M).get(k);
    if (!src) { err(`${id}: h_uk key ${k} not found`); continue; }
    stats.hashes_checked++;
    if (h !== (k === "title" || k === "summary" ? sha8(src.en) : hashOf(src))) err(`${id}: h_uk[${k}] is wrong`);
  }
  if (M.status !== "draft") err(`${id}: status must be "draft" after the migration`);
  if (!["always", "fitasc", "preview"].includes(M.index)) err(`${id}: index flag ${M.index}`);
  const blk = where[id]?.split("/")[0];
  if ((blk === "mind" || blk === "rules") && M.review?.status !== "pending") err(`${id}: block ${blk} needs review.status "pending" (перевіряється)`);
  if (M.plan === "new" && !M.brief) err(`${id}: new lesson without a brief`);
  if (M.quiz.length > 3) err(`${id}: more than 3 quiz questions shown`);
}
if (masters.get("travel-clayaway-tour")?.index !== "preview") err("travel-clayaway-tour must be index:preview (noindex until ClayAway launches)");
if ([...masters.values()].filter((M) => M.plan === "new").length !== 13) err("expected 13 new lessons");

/* ---------- 4b. second net: every old string occurs somewhere in content/academy ---------- */
const pool = new Set();
(function collect(v) { if (typeof v === "string") pool.add(v); else if (Array.isArray(v)) v.forEach(collect); else if (v && typeof v === "object") Object.values(v).forEach(collect); })([...all.values()]);
const need = (s, w) => { if (typeof s !== "string" || s === "") return; stats.strings_checked++; if (!pool.has(s)) err(`old text not found anywhere (${w}): ${s.slice(0, 70)}`); };
for (const [o, L] of OLD_L) {
  for (const lg of ["en", "uk"]) {
    need(L["title_" + lg], o); need(L["summary_" + lg], o); need(L["did_you_know_" + lg], o);
    L["body_" + lg].forEach((s) => need(s, o)); L["key_points_" + lg].forEach((s) => need(s, o));
    for (const q of L.quiz) { need(q["q_" + lg], o); need(q["explain_" + lg], o); q.options.forEach((x) => need(x[lg], o)); }
  }
}
for (const [o, I] of OLD_I) {
  for (const lg of ["en", "uk"]) {
    need(I.title[lg], o); I.body[lg].forEach((s) => need(s, o)); I.key_points[lg].forEach((s) => need(s, o));
    for (const q of I.quiz) { need(q.q[lg], o); need(q.why[lg], o); q.options[lg].forEach((s) => need(s, o)); }
    for (const c of I.coach_says) { need(c.meaning[lg], o); }
  }
  for (const c of I.coach_says) { need(c.en, o); for (const s of Object.values(c.say || {})) need(s, o); }
  for (const lg of OVERLAY_LANGS) {
    const t = TR[lg].lessons[o]; need(t.title, o); t.body.forEach((s) => need(s, o)); t.key_points.forEach((s) => need(s, o));
    for (const q of t.quiz) { need(q.q, o); need(q.why, o); q.options.forEach((s) => need(s, o)); }
    for (const c of t.coach_says) { need(c.meaning, o); need(c.say, o); }
  }
}

/* ---------- 4c. lesson lists: terms, rule_refs, sources, new_terms; law tables; archive of modules and missions ---------- */
{
  const gctx = { window: {} }; vm.createContext(gctx);
  for (const f of ["glossary/data/glossary.js", "glossary/data/learn_terms.js"]) vm.runInContext(fs.readFileSync(path.join(ROOT, "docs", f), "utf8"), gctx);
  const GLO = new Map([...(gctx.window.GLOSSARY?.terms || []), ...(gctx.window.GLOSSARY_LEARN?.terms || [])].map((t) => [t.id, t]));
  const inGlossary = (nt) => { const g = GLO.get(nt.id); if (!g) return false; const s = JSON.stringify(g); return [nt.short_en, nt.short_uk].every((t) => !t || s.includes(JSON.stringify(t).slice(1, -1))); };
  const sameNT = (a, b) => a && a.term === b.term && a.short_en === b.short_en && a.short_uk === b.short_uk && a.from === b.from;
  const lists = (o, L, M, srcs) => {
    for (const t of L.terms || []) if (!M.terms.includes(t)) err(`${o}: term ${t} lost in ${M.id}`);
    for (const r of L.rule_refs || []) if (!M.rule_refs.some((x) => x.book === r.book && x.id === r.id)) err(`${o}: rule_ref ${r.book}:${r.id} lost in ${M.id}`);
    for (const s of srcs) { const n = M.sources.find((x) => x.url === s.url); stats.keyed_items_checked++;
      if (!n) { err(`${o}: source ${s.url} lost in ${M.id}`); continue; }
      if (n.title.en !== s.en || (s.uk !== undefined && n.title.uk !== s.uk)) err(`${o}: source title of ${s.url} differs`);
      const fit = /(^|\/\/|\.)fitasc\.com\b/i.test(s.url);
      if (n.rel !== (fit ? "nofollow noopener noreferrer" : "noopener noreferrer")) err(`${o}: source ${s.url} has rel "${n.rel}"`); }
  };
  for (const [o, L] of OLD_L) {
    const M = masters.get(owner[o]); if (!M) continue;
    lists(o, L, M, (L.sources || []).map((s) => ({ url: s.url, en: s.title_en || s.title, uk: s.title })));
    for (const nt of L.new_terms || []) {                      // pending in new_terms, already in the glossary, or kept in todo.term_defs
      const x = Object.assign({ from: o }, nt);
      const pending = (M.new_terms || []).find((y) => y.id === nt.id && y.from === o);
      const kept = (M.todo?.term_defs || []).find((y) => y.id === nt.id && y.from === o);
      if (pending) { if (!sameNT(pending, x)) err(`${o}: new_term ${nt.id} changed`); if (GLO.has(nt.id)) err(`${o}: new_term ${nt.id} is already in the glossary`); }
      else if (kept) { if (!sameNT(kept, x)) err(`${o}: term_defs ${nt.id} changed`); }
      else if (!inGlossary(nt)) err(`${o}: the lesson's definition of ${nt.id} is lost (not in new_terms, todo.term_defs or the glossary)`);
    }
    (L.law_tables || []).forEach((lt, i) => { const b = M.body.find((x) => x.k === `${o}-law${i + 1}`);
      if (!b || b.country !== String(lt.code).toUpperCase() || b.part !== lt.part) err(`${o}-law${i + 1}: law block missing or changed`); });
  }
  for (const [o, I] of OLD_I) { const M = masters.get(owner[o]); if (M) lists(o, I, M, (I.sources || []).map((s) => ({ url: s.url, en: s.title }))); }
  // law tables: byte copies of archive/legacy-docs/learn/data/laws-<cc>.json, named by the ISO country code in capitals
  const lawFiles = fs.readdirSync(LD).filter((f) => /^laws-[a-z]{2}\.json$/.test(f));
  for (const f of lawFiles) { const cc = f.slice(5, 7).toUpperCase(), p = path.join(A, "laws", cc + ".json");
    if (!fs.existsSync(p)) { err(`laws/${cc}.json missing`); continue; }
    if (fs.readFileSync(p, "utf8") !== fs.readFileSync(path.join(LD, f), "utf8")) err(`laws/${cc}.json is not a byte copy of archive/legacy-docs/learn/data/${f}`);
    if (JSON.stringify(all.get(`laws/${cc}.json`)) !== JSON.stringify(ctx.window.LAWS?.[cc.toLowerCase()])) err(`laws/${cc}.json differs from the published laws-${cc.toLowerCase()}.js`); }
  for (const rel of all.keys()) if (rel.startsWith("laws/") && !/^laws\/[A-Z]{2}\.json$/.test(rel)) err(`${rel}: law files are named <ISO country code in capitals>.json`);
  for (const M of masters.values()) for (const b of M.body) if ((b.t === "law" || b.role === "law") && !all.has(`laws/${b.country}.json`)) err(`${M.id} ${b.k}: no laws/${b.country}.json`);
  // archive of the module / mission titles and intros (11 languages for missions)
  const arc = get("legacy/modules.json") || {};
  const LM = ctx.window.LEARN || [];
  if ((arc.learn_modules || []).length !== LM.length) err(`legacy/modules.json: ${(arc.learn_modules || []).length} modules, expected ${LM.length}`);
  for (const m of LM) { const a = (arc.learn_modules || []).find((x) => x.id === m.module);
    if (!a) { err(`legacy/modules.json: module ${m.module} missing`); continue; }
    for (const lg of ["en", "uk"]) { same(a.title[lg], m["title_" + lg], `module ${m.module} title.${lg}`); same(a.intro[lg], m["intro_" + lg], `module ${m.module} intro.${lg}`); } }
  if ((arc.interpreter_missions || []).length !== missions.length) err("legacy/modules.json: mission count differs");
  for (const m of missions) { const a = (arc.interpreter_missions || []).find((x) => x.id === m.id);
    if (!a) { err(`legacy/modules.json: mission ${m.id} missing`); continue; }
    for (const lg of ["en", "uk"]) { same(a.title[lg], m.title[lg], `mission ${m.id} title.${lg}`); same(a.intro[lg], m.intro[lg], `mission ${m.id} intro.${lg}`); }
    for (const lg of OVERLAY_LANGS) { const t = TR_MISSIONS[lg][m.id] || {}; same(a.title[lg], t.title, `mission ${m.id} title.${lg}`); same(a.intro[lg], t.intro, `mission ${m.id} intro.${lg}`); } }
}

/* ---------- 7. ids.lock, id-map.json, ui, facts, shared skeletons ---------- */
const lock = get("ids.lock") || {};
for (const [list, src] of [["learn", OLD_L], ["interpreter", OLD_I], ["academy", masters]]) {
  const s = new Set(lock[list] || []);
  if (s.size !== src.size) err(`ids.lock ${list}: ${s.size} ids, expected ${src.size}`);
  for (const id of src.keys()) if (!s.has(id)) err(`ids.lock ${list} misses ${id}`);
}
const idMap = get("id-map.json") || {};
for (const o of OLD_L.keys()) {
  const final = masters.has(o), m = (idMap.learn || {})[o];
  if (!final && !m) err(`id-map: merged Academy lesson ${o} has no redirect`);
  if (final && m) err(`id-map: kept Academy lesson ${o} must not be redirected`);
  if (m && (m.to !== owner[o] || m.anchor !== o)) err(`id-map: ${o} → ${m.to}#${m.anchor}, expected ${owner[o]}#${o}`);
}
for (const o of OLD_I.keys()) {
  const m = (idMap.interpreter || {})[o];
  if (!m) { err(`id-map: Interpreter lesson ${o} has no redirect`); continue; }
  if (m.to !== owner[o]) err(`id-map: ${o} → ${m.to}, expected ${owner[o]}`);
  if (masters.has(o) ? m.anchor : m.anchor !== o) err(`id-map: ${o} anchor ${m.anchor}`);
}
for (const k of ["modules", "missions", "games"]) if (!idMap[k] || !Object.keys(idMap[k]).length) err(`id-map: ${k} map missing`);
if (Object.keys(idMap.modules || {}).length !== 22) err("id-map: expected 22 Academy modules");
if (Object.keys(idMap.missions || {}).length !== 12) err("id-map: expected 12 Interpreter missions");
if (idMap.groups?.total_stubs !== 737) err(`id-map: expected 737 redirect stubs, found ${idMap.groups?.total_stubs}`);
for (const v of [...Object.values(idMap.modules || {}), ...Object.values(idMap.missions || {})]) {
  const [kind, rest] = v.split("/"); const [slug] = (rest || "").split("#");
  if (kind === "topics" && !BLOCK_IDS.includes(slug)) err(`id-map: unknown block in ${v}`);
  if (kind === "routes" && !routes.some((r) => r.id === slug)) err(`id-map: unknown route in ${v}`);
  if (kind === "topics" && v.includes("#") && !blocks.find((b) => b.id === slug)?.sections.some((s) => s.id === v.split("#")[1])) err(`id-map: unknown section anchor in ${v}`);
}
const ui = {};
for (const lg of LANGS) ui[lg] = get(`ui/${lg}.json`);
for (const rel of all.keys()) if (rel.startsWith("ui/") && !LANGS.includes(rel.slice(3, -5))) err(`ui file for a language outside the 11: ${rel}`);
if (ui.en && ui.uk) {
  const ke = Object.keys(ui.en.strings).sort().join(), ku = Object.keys(ui.uk.strings).sort().join();
  if (ke !== ku) err("ui: en and uk must have the same keys");
  for (const [k, v] of Object.entries(UI_I)) {
    if (JSON.stringify(ui.en.strings[k]) !== JSON.stringify(v.en) || JSON.stringify(ui.uk.strings[k]) !== JSON.stringify(v.uk)) err(`ui: interpreter key ${k} changed in en/uk`);
    for (const lg of OVERLAY_LANGS) if (JSON.stringify(ui[lg]?.strings?.[k]) !== JSON.stringify(TR[lg].ui[k])) err(`ui/${lg}: interpreter key ${k} changed`);
  }
}
{ const f = get("facts.json"); if (!f || typeof f !== "object" || Array.isArray(f)) err("facts.json missing or not an object"); }
for (const rel of all.keys()) if (rel.startsWith("facts/")) err(`${rel}: facts live in one file, facts.json (design §6.5)`);
{ // the uk/en interface strings of the law-table renderer (u ? "uk" : "en" and u ? [uk…] : [en…]) are UI keys now
  const LT = fs.readFileSync(path.join(LD, "law-tables.js"), "utf8"), pairs = [];
  for (const m of LT.matchAll(/u \? "([^"]*)" : "([^"]*)"/g)) pairs.push([m[1], m[2]]);
  const strs = (s) => [...s.matchAll(/"([^"]*)"/g)].map((x) => x[1]);
  for (const m of LT.matchAll(/u \? \[([^\]]*)\] : \[([^\]]*)\]/g)) { const a = strs(m[1]), b = strs(m[2]); a.forEach((t, i) => pairs.push([t, b[i]])); }
  if (pairs.length < 10) err("law-tables.js: expected at least 10 uk/en interface strings");
  for (const [uk, en] of pairs) if (ui.en && !Object.keys(ui.en.strings).some((k) => ui.en.strings[k] === en && ui.uk.strings[k] === uk)) err(`ui: law-table string "${en}" / "${uk}" has no key`);
}
const badges = get("badges.json"); if (badges && badges.badges.length !== 55) err(`badges.json: expected 55 badges, found ${badges.badges.length}`);
get("levels.json"); get("practice.json");

/* ---------- 8. project language rules ---------- */
const C = (...c) => String.fromCharCode(...c);
const COUNTRY = new RegExp(C(114, 117, 115, 115, 105) + "|(?<![\\p{L}])" + C(1088, 1086, 1089) + "(" + C(1110) + "[" + C(1103, 1102, 1111, 1108) + "]|" + C(1110, 1081) + "|" + C(1089, 1080) + ")", "iu");
const LETTERS = new RegExp("[" + C(1099, 1101, 1098, 1105, 1067, 1069, 1066, 1025) + "]");
const scan = (txt, w) => { if (COUNTRY.test(txt)) err(`${w}: names the restricted country`); if (LETTERS.test(txt)) err(`${w}: contains Cyrillic letters that Ukrainian does not use (U+044B U+044D U+044A U+0451)`); };
for (const [rel, v] of all) scan(JSON.stringify(v), rel);
for (const f of ["SCHEMA.md"]) if (fs.existsSync(path.join(A, f))) scan(fs.readFileSync(path.join(A, f), "utf8"), f);
for (const f of ["scripts/migrate_academy.mjs", "scripts/check_academy_migration.mjs"]) scan(fs.readFileSync(path.join(ROOT, f), "utf8"), f);
for (const rel of all.keys()) { const m = rel.match(/^(i18n|ui)\/([a-z-]+)/); if (m && !LANGS.includes(m[2].replace(/\.json$/, ""))) err(`language code outside the 11: ${rel}`); }

/* ---------- result ---------- */
finish({ masters: masters.size, old_lessons: OLD_L.size + OLD_I.size, ...stats });
