/* ClayArena Academy — learner progress on this device (PROJECT; the ClayArena team moves this to the user profile).
   ONE module for the progress of the merged "Академія ClayArena" (docs/learn/app/academy.js). Design §7.7 (XP, levels, badges,
   certificates) and §7.8 (moving the progress of the two old academies). Nothing here touches the DOM, so the same file runs in the
   browser (window.ClayProgress) and in Bun/Node tests (module.exports).

   Storage keys (localStorage, this browser only; no tracking, nothing is sent anywhere):
     clayarena-academy        the state below (new, written only by this module)
     clayarena-learn          OLD ClayArena Academy        {lang, done: {lessonId: quizScore}}           read once, never changed
     clayarena-interpreter    OLD Interpreter Academy      {xp, done: {id: 1}, quiz: {id: score}, exam: {score, date}, name, total}
     clayarena-interpreter-lang  OLD Interpreter Academy language                                       read once, never changed
     clayarena-trainer        rules trainer (docs/rules/trainer/), older builds used a legacy key (OLD.trainerOld): READ ONLY here.
                              The trainer is the only writer; this is where the Academy reads its results:
                              {stats: {sporting|compak: {ans, ok, best, wrong: [], short_best?, short_at?}}}
                              "best" = best exam (30 questions) in %; "short_best" = best short test (10 questions, mode "short",
                              opened from a route with &mode=short) in %, "short_at" = its date (YYYY-MM-DD).
                              The exam counts for XP and the badges "Іспит з правил …"; a route requirement with mode "short"
                              (route "Перші змагання") is met by the short test or the exam (trainerPass below).
     clayarena-resume         "where was I" of the project bar (docs/shared/nav.js); section "interpreter" becomes "learn"
   The old keys stay untouched for 6 months (rollback) and are removed by a separate release (design §7.8 step 8).

   State (v1):
   {v: 1, lang, disc: "both"|"sporting"|"compak", xp_floor,
    done:   {lessonId: {q: best quiz score 0–3, q0: first score, at: "YYYY-MM-DD", rev, from?: "learn"|"interpreter", reread?: true}},
    days:   ["YYYY-MM-DD", …]                      days with a finished lesson (badge "Повертаюся"), at most 30 kept
    games:  {gameId: {best, best_pct, correct, plays, xp, day, xp_day, methods?: {maintained: 1, …}}},
    cards:  {termId: {box: 1–5, due: "YYYY-MM-DD"}}  term cards (Leitner boxes)
    badges: {badgeId: "YYYY-MM-DD"},
    routes: {current: routeId|null, <routeId>: {exam?: {score, date, legacy?}, cert?: {date, no, legacy?}}},
    last: lessonId, name: "" (certificate name: ONLY on this device, never exported), nav: {route, title, lang, d, t, url},
    migrated: {"clayarena-learn": date, "clayarena-interpreter": date}, lang_hint_off?: true}
   In production: the same JSON is merged into the ClayArena profile after sign-in with the max rule of merge() below
   (design §7.8 step 10); the certificate gets a server id and a verification link. */
(function (root) {
  "use strict";
  const KEY = "clayarena-academy";
  const OLD = { learn: "clayarena-learn", interp: "clayarena-interpreter", interpLang: "clayarena-interpreter-lang",
    trainer: "clayarena-trainer", trainerOld: "clayaway-trainer", resume: "clayarena-resume" };
  const LANGS = ["en", "uk", "de", "fr", "it", "cs", "pl", "pt", "hu", "fi", "lt"];
  const pad = n => String(n).padStart(2, "0");
  const today = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; // local calendar day
  const isObj = x => x && typeof x === "object" && !Array.isArray(x);
  const num = (x, d = 0) => (typeof x === "number" && isFinite(x) ? x : d);

  function blank(lang) {
    return { v: 1, lang: LANGS.includes(lang) ? lang : null, disc: "both", xp_floor: 0, done: {}, days: [], games: {}, cards: {},
      badges: {}, routes: { current: null }, last: null, name: "", nav: null, migrated: {} };
  }
  /* Repairs a state read from storage or an import: unknown or broken fields fall back to the blank values. */
  function normalize(s, lang) {
    const b = blank(lang); if (!isObj(s)) return b;
    const o = Object.assign(b, s);
    for (const k of ["done", "games", "cards", "badges", "migrated"]) if (!isObj(o[k])) o[k] = {};
    if (!isObj(o.routes)) o.routes = { current: null };
    if (!Array.isArray(o.days)) o.days = [];
    if (!["both", "sporting", "compak"].includes(o.disc)) o.disc = "both";
    o.xp_floor = num(o.xp_floor); o.v = 1;
    for (const [id, d] of Object.entries(o.done)) { if (!isObj(d)) { delete o.done[id]; continue; }
      d.q = Math.max(0, Math.min(3, num(d.q))); d.q0 = Math.max(0, Math.min(3, num(d.q0, d.q))); d.rev = num(d.rev); }
    return o;
  }

  /* ---------- storage (every access in try/catch: private windows and blocked storage must not break the page) ---------- */
  const store = {
    get(k) { try { const v = root.localStorage.getItem(k); return v == null ? null : JSON.parse(v); } catch (e) { return null; } },
    raw(k) { try { return root.localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { root.localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
    remove(k) { try { root.localStorage.removeItem(k); return true; } catch (e) { return false; } },
    probe() { try { const t = "clayarena-probe"; root.localStorage.setItem(t, "1"); root.localStorage.removeItem(t); return true; } catch (e) { return false; } },
  };
  /* load(): {state, persistent}; persistent = false when the browser blocks storage — the app then works in memory and says so. */
  function load(lang) { const persistent = !!(root.localStorage && store.probe()); return { state: normalize(persistent ? store.get(KEY) : null, lang), persistent }; }
  function save(state) { return store.set(KEY, state); }
  /* Reset (audit I-17): never throws; old keys are kept on purpose (rollback period). */
  function reset() { return store.remove(KEY); }
  function readOld() {
    return { learn: store.get(OLD.learn), interp: store.get(OLD.interp), interpLang: store.raw(OLD.interpLang),
      resume: store.get(OLD.resume) };
  }
  const readTrainer = () => store.get(OLD.trainer) || store.get(OLD.trainerOld) || null;
  const needsIdMap = (state, old) => (!!old.learn && !state.migrated[OLD.learn]) || (!!old.interp && !state.migrated[OLD.interp]);

  /* ---------- migration (design §7.8), pure: safe to run any number of times ---------- */
  function addDone(state, id, q, from, day) {
    q = Math.max(0, Math.min(3, Math.round(num(q))));
    const d = state.done[id];
    if (!d) state.done[id] = { q, q0: q, at: day, rev: 0, from };   // rev 0: merged/rewritten lessons show "Урок оновлено"
    else d.q = Math.max(d.q, q);                                     // a lesson marked by both old academies counts once, best score
  }
  /* old = readOld(); idMap = docs/learn/data/id-map.json; lessonIds = Set of the catalog's lesson ids (null = accept all).
     Returns {state, changed, resume}: resume is the rewritten clayarena-resume value (or null when nothing to write). */
  function migrate(state, old, idMap, lessonIds, day = today()) {
    let changed = false; const ok = id => !!id && (!lessonIds || lessonIds.has(id));
    const map = (idMap && idMap.learn) || {}, imap = (idMap && idMap.interpreter) || {};
    if (isObj(old.learn) && !state.migrated[OLD.learn]) {
      for (const [id, sc] of Object.entries(isObj(old.learn.done) ? old.learn.done : {})) {
        const to = map[id] ? map[id].to : id; if (ok(to)) addDone(state, to, sc, "learn", day); }
      state.migrated[OLD.learn] = day; changed = true;
    }
    if (isObj(old.interp) && !state.migrated[OLD.interp]) {
      const I = old.interp, quiz = isObj(I.quiz) ? I.quiz : {};
      for (const id of Object.keys(isObj(I.done) ? I.done : {})) {
        const to = imap[id] && imap[id].to; if (ok(to)) addDone(state, to, quiz[id], "interpreter", day); }
      state.xp_floor = Math.max(state.xp_floor, num(I.xp));           // never show less XP than the old course showed
      if (!state.name && typeof I.name === "string") state.name = I.name.slice(0, 80);
      if (isObj(I.exam) && num(I.exam.score) >= 80) {                 // old final exam passed → interpreter route certificate
        const date = typeof I.exam.date === "string" ? I.exam.date : day, r = state.routes.interpreter = state.routes.interpreter || {};
        if (!r.exam || num(r.exam.score) < num(I.exam.score)) r.exam = { score: num(I.exam.score), date, legacy: true };
        if (!r.cert) r.cert = { date, no: certNo("interpreter", date), legacy: true };
        state.badges["interpreter-academy-2026"] = state.badges["interpreter-academy-2026"] || date;
        state.badges["route-interpreter"] = state.badges["route-interpreter"] || date;
      }
      if (!state.routes.current && Object.keys(I.done || {}).length) state.routes.current = "interpreter";
      state.migrated[OLD.interp] = day; changed = true;
    }
    if (changed) state.days = [...new Set([...state.days, day])].sort().slice(-30);
    // preferred language (design §7.8 step 5, after the URL and ?lang): the interpreter course language, then the old Academy's
    if (changed && !state.lang) state.lang = [old.interpLang, isObj(old.learn) ? old.learn.lang : null].find(l => LANGS.includes(l)) || null;
    let resume = null;
    if (isObj(old.resume) && old.resume.section === "interpreter") resume = Object.assign({}, old.resume, { section: "learn" });
    return { state, changed, resume };
  }
  /* Local certificate number: route + date + 4 random hex digits (production: server id with a verification link). */
  function certNo(route, date) { const r = Math.floor(Math.random() * 65536).toString(16).padStart(4, "0").toUpperCase();
    return `CA-${String(route).slice(0, 3).toUpperCase()}-${String(date).replace(/-/g, "")}-${r}`; }

  /* ---------- lessons and games ---------- */
  /* finishLesson: quiz finished (or "mark as done" for a lesson without quiz). Returns what happened, for the toast. */
  function finishLesson(state, id, score, rev, day = today()) {
    score = Math.max(0, Math.min(3, Math.round(num(score)))); const d = state.done[id];
    let res;
    if (!d) { state.done[id] = { q: score, q0: score, at: day, rev: num(rev) }; res = { first: true }; }
    else { const before = d.q; d.q = Math.max(d.q, score);
      res = { first: false, perfectLater: before < 3 && d.q === 3 && d.q0 < 3 };
      if (num(d.rev) < num(rev)) { d.rev = num(rev); if (!d.reread) { d.reread = true; res.reread = true; } } }
    state.days = [...new Set([...state.days, day])].sort().slice(-30); state.last = id;
    return res;
  }
  /* One answer in a Practice game: 5 XP per right answer, at most 50 XP a day per game, none while the game has an open issue. */
  function gameAnswer(state, game, right, opt = {}) {
    const per = num(opt.per, 5), cap = num(opt.cap, 50), day = opt.day || today();
    const g = state.games[game] = state.games[game] || { best: 0, best_pct: 0, correct: 0, plays: 0, xp: 0, day, xp_day: 0 };
    if (g.day !== day) { g.day = day; g.xp_day = 0; }
    if (!right) return 0;
    g.correct = num(g.correct) + 1;
    const gain = opt.xp === false ? 0 : Math.max(0, Math.min(per, cap - num(g.xp_day)));
    g.xp_day = num(g.xp_day) + gain; g.xp = num(g.xp) + gain; return gain;
  }
  function gameRound(state, game, correct, total) {
    const g = state.games[game] = state.games[game] || { best: 0, best_pct: 0, correct: 0, plays: 0, xp: 0, day: today(), xp_day: 0 };
    g.plays = num(g.plays) + 1; g.best = Math.max(num(g.best), correct);
    if (total > 0) g.best_pct = Math.max(num(g.best_pct), Math.round(correct / total * 100));
    return g;
  }

  /* ---------- derived values (need the catalog: docs/learn/data/<lang>/catalog.json) ---------- */
  const isDone = (state, id) => !!state.done[id];
  const required = route => (route.stages || []).flatMap(s => s.lessons);
  const stageDone = (state, st) => st.lessons.length > 0 && st.lessons.every(id => isDone(state, id));
  const blockLessons = b => b.sections.flatMap(s => s.lessons);
  const blockDone = (state, b) => blockLessons(b).every(id => isDone(state, id));
  /* Rules trainer result of one discipline: the exam (30 questions) by default; mode "short" also accepts the short test (10). */
  const trainerPass = (tr, disc, pct = 80, mode = "exam") => { const s = tr && tr.stats && tr.stats[disc]; if (!s) return false;
    return num(s.best) >= num(pct, 80) || (mode === "short" && s.short_best != null && num(s.short_best) >= num(pct, 80)); };
  const gameOn = (cat, id) => { const g = (cat.practice || []).find(x => x.id === id); return !!(g && g.xp !== false && !g.later); };
  const passPct = r => (r.certificate && r.certificate.exam ? r.certificate.exam.pass_pct : r.badge_only && r.badge_only.quiz ? r.badge_only.quiz.pass_pct : 80);
  const examPassed = (state, r) => { const x = state.routes[r.id] && state.routes[r.id].exam; return !!x && num(x.score) >= passPct(r); };

  /* Practice requirements of a route certificate: [{item, ok, waiting}] (waiting = not required yet, the game has a known issue). */
  function practiceStatus(state, cat, r, tr) {
    return (r.practice || []).map(p => {
      const g = state.games[p.game] || {};
      if (p.enabled_after && !gameOn(cat, p.game)) return { item: p, ok: true, waiting: true };
      if (p.game === "rules-exam") return { item: p, ok: trainerPass(tr, "sporting", p.min_pct, p.mode) || trainerPass(tr, "compak", p.min_pct, p.mode) };
      if (p.require === "hit-with-each-method") return { item: p, ok: ["maintained", "swing", "pullaway", "ambush"].every(m => g.methods && g.methods[m]) };
      if (p.min_score != null) return { item: p, ok: num(g.best) >= p.min_score };
      return { item: p, ok: num(g.best_pct) >= num(p.min_pct, 80) };
    });
  }
  /* Certificate (or the fan badge): all required lessons, the route exam, the practice items. */
  function routeStatus(state, cat, r, tr) {
    const req = required(r), d = req.filter(id => isDone(state, id)).length, prac = practiceStatus(state, cat, r, tr);
    const lessonsOk = d === req.length && req.length > 0, exam = examPassed(state, r), practiceOk = prac.every(x => x.ok);
    return { done: d, total: req.length, lessonsOk, exam, practice: prac, practiceOk, complete: lessonsOk && exam && practiceOk,
      cert: (state.routes[r.id] || {}).cert || null };
  }
  /* Issues certificates whose requirements are met (and the fan badge). Returns the ids of routes that got one now. */
  function issueCertificates(state, cat, tr, day = today()) {
    const out = [];
    for (const r of cat.routes || []) { const s = routeStatus(state, cat, r, tr); if (!s.complete) continue;
      const x = state.routes[r.id] = state.routes[r.id] || {};
      if (!x.cert && r.certificate) { x.cert = { date: day, no: certNo(r.id, day) }; out.push(r.id); }
      if (r.badge_only && !x.badge) { x.badge = day; out.push(r.id); } }
    return out;
  }

  /* XP (design §7.7). Recomputed from the state every time, so nothing can be counted twice; never below xp_floor. */
  function computeXP(state, cat, tr) {
    const X = Object.assign({ lesson_first: 20, quiz_correct: 10, lesson_max: 50, quiz_perfect_later: 10, reread_new_rev: 5,
      stage: 25, block: 50, route_exam: 150, rules_exam_per_discipline: 50 }, (cat.levels && cat.levels.xp) || {});
    const parts = { lessons: 0, games: 0, stages: 0, blocks: 0, exams: 0, rules: 0 };
    for (const d of Object.values(state.done)) {
      parts.lessons += Math.min(X.lesson_max, X.lesson_first + X.quiz_correct * num(d.q0, d.q));
      if (d.q >= 3 && num(d.q0, d.q) < 3) parts.lessons += X.quiz_perfect_later;
      if (d.reread) parts.lessons += X.reread_new_rev; }
    for (const g of Object.values(state.games)) parts.games += num(g.xp);
    for (const r of cat.routes || []) { for (const st of r.stages || []) if (stageDone(state, st)) parts.stages += X.stage;
      if (examPassed(state, r)) parts.exams += X.route_exam; }
    for (const b of cat.blocks || []) if (blockDone(state, b)) parts.blocks += X.block;
    for (const disc of ["sporting", "compak"]) if (trainerPass(tr, disc)) parts.rules += X.rules_exam_per_discipline;
    const sum = Object.values(parts).reduce((a, b) => a + b, 0);
    return { total: Math.max(sum, num(state.xp_floor)), sum, parts };
  }
  function levelOf(xp, cat) {
    const L = ((cat.levels && cat.levels.levels) || [{ id: "guest", min_xp: 0, title: "" }]).slice().sort((a, b) => a.min_xp - b.min_xp);
    let i = 0; L.forEach((l, k) => { if (xp >= l.min_xp) i = k; });
    const cur = L[i], next = L[i + 1] || null;
    return { index: i, level: cur, next, pct: next ? Math.round((xp - cur.min_xp) / (next.min_xp - cur.min_xp) * 100) : 100 };
  }
  /* Badges (badges.json): which are earned now. Earned dates are kept in state.badges (a badge is never taken away). */
  function earnedBadges(state, cat, tr) {
    const out = new Set(Object.keys(state.badges)), routeById = Object.fromEntries((cat.routes || []).map(r => [r.id, r]));
    const blockById = Object.fromEntries((cat.blocks || []).map(b => [b.id, b]));
    const learnt = Object.values(state.cards).filter(c => num(c.box) >= 3).length;
    for (const b of cat.badges || []) {
      const on = !b.enabled_after || gameOn(cat, b.ref);
      let ok = false;
      if (b.kind === "block") ok = !!blockById[b.ref] && blockDone(state, blockById[b.ref]);
      else if (b.kind === "stage") { const [rid, sid] = String(b.ref).split("/"), r = routeById[rid], st = r && r.stages.find(s => s.id === sid); ok = !!st && stageDone(state, st); }
      else if (b.kind === "route") { const x = state.routes[b.ref] || {}; ok = !!(x.cert || x.badge); }
      else if (b.kind === "misc") ok = b.id === "first" ? Object.keys(state.done).length > 0 : b.id === "returning" ? new Set([...state.days, ...Object.values(state.done).map(d => d.at)]).size >= 3 : false;
      else if (b.kind === "practice" && on) { const g = state.games[b.ref] || {};
        ok = b.id === "four-methods" ? ["maintained", "swing", "pullaway", "ambush"].every(m => g.methods && g.methods[m])
          : b.id === "name-the-flight-10" ? num(g.best) >= 10
          : b.id === "coach-translator-20" || b.id === "referees-call-20" ? num(g.correct) >= 20
          : b.id === "terms-50" ? learnt >= 50
          : b.id === "rules-exam-sporting" ? trainerPass(tr, "sporting") : b.id === "rules-exam-compak" ? trainerPass(tr, "compak") : false; }
      if (ok) out.add(b.id);
    }
    return out;
  }
  /* Records newly earned badges with today's date; returns their ids (for the toast). */
  function awardBadges(state, cat, tr, day = today()) {
    const now = earnedBadges(state, cat, tr), fresh = [];
    for (const id of now) if (!state.badges[id]) { state.badges[id] = day; fresh.push(id); }
    return fresh;
  }

  /* ---------- transfer between devices / to clayarena.com (design §7.8 step 9): in the URL HASH only, never in the query ---------- */
  /* merge(a, b): the max rule — best score, earliest date, highest box, all badges; a's lang, disc, name and current route win. */
  function merge(a, b) {
    a = normalize(a); b = normalize(b);
    for (const [id, d] of Object.entries(b.done)) { const x = a.done[id];
      if (!x) a.done[id] = d; else { x.q = Math.max(x.q, d.q); x.at = [x.at, d.at].filter(Boolean).sort()[0] || x.at; x.rev = Math.max(num(x.rev), num(d.rev)); if (d.reread) x.reread = true; } }
    for (const [g, v] of Object.entries(b.games)) { const x = a.games[g];
      if (!x) a.games[g] = v; else { for (const k of ["best", "best_pct", "correct", "plays", "xp"]) x[k] = Math.max(num(x[k]), num(v[k]));
        if (v.methods) x.methods = Object.assign({}, x.methods || {}, v.methods); } }
    for (const [t, c] of Object.entries(b.cards)) { const x = a.cards[t]; if (!x || num(c.box) > num(x.box)) a.cards[t] = c; }
    for (const [id, dt] of Object.entries(b.badges)) if (!a.badges[id] || dt < a.badges[id]) a.badges[id] = dt;
    for (const [r, v] of Object.entries(b.routes)) { if (r === "current") { if (!a.routes.current) a.routes.current = v; continue; }
      const x = a.routes[r] = a.routes[r] || {};
      if (v && v.exam && (!x.exam || num(v.exam.score) > num(x.exam.score))) x.exam = v.exam;
      if (v && v.cert && !x.cert) x.cert = v.cert; if (v && v.badge && !x.badge) x.badge = v.badge; }
    a.days = [...new Set([...a.days, ...b.days])].sort().slice(-30);
    a.xp_floor = Math.max(a.xp_floor, b.xp_floor);
    a.migrated = Object.assign({}, b.migrated, a.migrated);
    return a;
  }
  const b64u = bytes => { let s = ""; for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return (root.btoa ? root.btoa(s) : Buffer.from(s, "binary").toString("base64")).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); };
  const unb64u = str => { const s = String(str).replace(/-/g, "+").replace(/_/g, "/"); const bin = root.atob ? root.atob(s) : Buffer.from(s, "base64").toString("binary");
    const out = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i); return out; };
  async function pipe(bytes, Stream) { const cs = new Stream("deflate-raw"); const w = cs.writable.getWriter(); w.write(bytes); w.close();
    return new Uint8Array(await new Response(cs.readable).arrayBuffer()); }
  /* exportCode(state): "1.<base64url of deflate-raw JSON>" (or "0.<base64url JSON>" without CompressionStream). The name is left out. */
  async function exportCode(state) {
    const { name, nav, ...rest } = state, bytes = new TextEncoder().encode(JSON.stringify(rest));
    if (typeof root.CompressionStream === "function") { try { return "1." + b64u(await pipe(bytes, root.CompressionStream)); } catch (e) {} }
    return "0." + b64u(bytes);
  }
  async function importCode(code) {
    const m = /^([01])\.([A-Za-z0-9_-]+)$/.exec(String(code || "").trim()); if (!m) throw new Error("bad code");
    let bytes = unb64u(m[2]); if (m[1] === "1") bytes = await pipe(bytes, root.DecompressionStream);
    const s = JSON.parse(new TextDecoder().decode(bytes)); if (!isObj(s) || s.v !== 1) throw new Error("bad state");
    delete s.name; return normalize(s);
  }

  const API = { KEY, OLD, LANGS, today, blank, normalize, load, save, reset, readOld, readTrainer, needsIdMap, migrate, certNo,
    finishLesson, gameAnswer, gameRound, required, stageDone, blockLessons, blockDone, trainerPass, gameOn, practiceStatus, routeStatus,
    issueCertificates, computeXP, levelOf, earnedBadges, awardBadges, merge, exportCode, importCode, store };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  root.ClayProgress = API;
})(typeof window !== "undefined" ? window : globalThis);
