/* Checks of the collector and dashboard logic tools/stats/Code.gs with mocks of SpreadsheetApp, Session, ContentService,
   HtmlService, LockService, CacheService and Utilities (no Google account, no network).
   Run from the repo root: bun tools/stats/checks/check_collector.mjs  (or node). Exit code 1 on any failure. */
import { readFileSync } from "node:fs";
import vm from "node:vm";
const CODE = readFileSync(new URL("../Code.gs", import.meta.url), "utf8");
const DASH = readFileSync(new URL("../Dashboard.html", import.meta.url), "utf8");
let fails = 0, passes = 0;
const ok = (c, msg) => { if (c) passes++; else { fails++; console.log("FAIL:", msg); } };

/* ---------- mocks of the Apps Script services ---------- */
function makeEnv(o = {}) {
  const sheets = {}, calls = { getRange: 0, appendRow: 0, formats: [] };
  const cache = {}, clock = () => (o.clock ? o.clock.now : Date.now());
  function makeSheet(name) {
    const rows = [];
    const sh = {
      name, rows,
      appendRow(r) { calls.appendRow++; rows.push(r.map(v => (typeof v === "number" ? v : String(v)))); return sh; },
      getLastRow() { return rows.length; },
      setFrozenRows() {}, deleteRows(start, n) { rows.splice(start - 1, n); },
      getRange(a, col, nr, nc) {
        if (typeof a === "string") return { setNumberFormat(f) { calls.formats.push([a, f]); return this; } };
        calls.getRange++;
        return { getValues() { return rows.slice(a - 1, a - 1 + nr).map(r => r.slice(col - 1, col - 1 + nc)); } };
      },
    };
    return sh;
  }
  const ss = { getSheetByName: n => sheets[n] || null, insertSheet: n => (sheets[n] = makeSheet(n)) };
  const fmt = (date, tz, pattern) => {
    const parts = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" })
      .formatToParts(date).map(p => [p.type, p.value]));
    if (pattern === "Z") {
      const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
      const off = Math.round((asUtc - Math.floor(date.getTime() / 1000) * 1000) / 60000), s = off < 0 ? "-" : "+", a = Math.abs(off);
      return s + String(Math.floor(a / 60)).padStart(2, "0") + String(a % 60).padStart(2, "0");
    }
    return pattern.replace("yyyy", parts.year).replace("MM", parts.month).replace("dd", parts.day).replace("HH", parts.hour);
  };
  const ctx = {
    console, JSON, Math, Date, Object, String, Number, Array, RegExp, Error, isNaN, isFinite, parseInt,
    SpreadsheetApp: { getActiveSpreadsheet: () => ss },
    Session: {
      getActiveUser: () => ({ getEmail: () => (o.active == null ? "" : o.active) }),
      getEffectiveUser: () => ({ getEmail: () => o.effective || "owner@example.com" }),
      getScriptTimeZone: () => o.tz || "Europe/Bratislava",
    },
    ContentService: { MimeType: { TEXT: "TEXT" }, createTextOutput: s => ({ kind: "text", content: s, setMimeType(m) { this.mime = m; return this; } }) },
    HtmlService: { createTemplateFromFile: name => ({ name, evaluate() {
      const html = DASH.replace("<?!= payload ?>", this.payload);
      return { kind: "html", content: html, payload: this.payload, setTitle(t) { this.title = t; return this; }, addMetaTag() { return this; } }; } }) },
    LockService: { getScriptLock: () => ({ tryLock: () => !o.lockFails, waitLock() {}, releaseLock() {} }) },
    // like the platform: a TTL of at most 21600 s (6 h), entries expire (o.clock = fake "now" of the cache), may be evicted or fail
    CacheService: { getScriptCache: () => {
      if (o.cacheFails) throw new Error("Service invoked too many times: cache");
      return {
        get: k => (k in cache && cache[k].exp > clock() ? cache[k].v : null),
        put: (k, v, ttl) => { if (!(ttl >= 1 && ttl <= 21600)) throw new Error("bad ttl " + ttl); cache[k] = { v: String(v), exp: clock() + ttl * 1000 }; },
      }; } },
    Utilities: { formatDate: fmt },
  };
  vm.createContext(ctx);
  vm.runInContext(CODE, ctx, { filename: "Code.gs" });
  return { ctx, sheets, calls, ss, cache };
}
const post = (env, obj, raw) => {
  const body = raw != null ? raw : JSON.stringify(obj);
  return env.ctx.doPost({ postData: { contents: body, length: Buffer.byteLength(body), type: "text/plain" } });
};
const hits = env => (env.sheets.hits ? env.sheets.hits.rows.slice(1) : []);

/* ---------- 1. collector ---------- */
{ const env = makeEnv();
  const r = post(env, { t: "view", p: "/clayaway/learn/gun-fit/?x=1#y", s: "learn", l: "uk", bl: "uk-UA", tz: "Europe/Kyiv", d: "phone", r: "www.google.com", ip: "1.2.3.4", ua: "Chrome" });
  ok(r.kind === "text" && r.content === "ok" && r.mime === "TEXT", "doPost answers text ok");
  ok(env.sheets.hits && env.sheets.hits.rows[0].join(",") === "time,t,p,s,l,bl,tz,d,r,e,v,sec,sc", "sheet created with header");
  ok(env.calls.formats.some(f => f[0] === "A:K" && f[1] === "@"), "text columns formatted as plain text");
  const row = hits(env)[0];
  ok(row && row.length === 13, "row has 13 columns");
  ok(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(row[0]), "server ISO time");
  ok(JSON.stringify(row.slice(1)) === JSON.stringify(["view", "/clayaway/learn/gun-fit/", "learn", "uk", "uk-UA", "Europe/Kyiv", "phone", "www.google.com", "", "", "", ""]), "view row: " + JSON.stringify(row.slice(1)));
  ok(!JSON.stringify(row).includes("1.2.3.4") && !JSON.stringify(row).includes("Chrome"), "unknown keys never stored");
  // invalid input
  const n0 = hits(env).length;
  for (const [name, body] of [["bad json", "{x"], ["array", "[1,2]"], ["string", '"view"'], ["null", "null"], ["unknown t", JSON.stringify({ t: "click", p: "/" })],
    ["no path", JSON.stringify({ t: "view" })], ["relative path", JSON.stringify({ t: "view", p: "learn/" })], ["path with quote", JSON.stringify({ t: "view", p: '/a"b' })],
    ["path with <", JSON.stringify({ t: "view", p: "/a<script>" })], ["event without name", JSON.stringify({ t: "event", p: "/" })],
    ["event bad name", JSON.stringify({ t: "event", p: "/", e: "=cmd" })], ["event digit name", JSON.stringify({ t: "event", p: "/", e: "1x" })],
    ["event long name", JSON.stringify({ t: "event", p: "/", e: "a".repeat(41) })], ["leave without sec", JSON.stringify({ t: "leave", p: "/" })],
    ["leave sec text", JSON.stringify({ t: "leave", p: "/", sec: "12s" })], ["too big", JSON.stringify({ t: "view", p: "/", pad: "x".repeat(2100) })],
    ["too big utf8", JSON.stringify({ t: "event", p: "/", e: "speak", v: "ї".repeat(1100) })], ["empty", ""]]) {
    post(env, null, body); ok(hits(env).length === n0, "rejected: " + name);
  }
  ok(env.ctx.doPost({}).content === "ok" && env.ctx.doPost(undefined).content === "ok", "doPost without postData answers ok");
  // clamping and cleaning
  post(env, { t: "view", p: "/x/", s: "__proto__", l: "EN-gb", bl: "fil-PH", tz: "Europe/../../etc", d: "constructor", r: "evil.com/path", v: "hello" });
  let w = hits(env).at(-1);
  ok(w[3] === "other" && w[4] === "en-gb" && w[5] === "" && w[6] === "" && w[7] === "" && w[8] === "" && w[10] === "", "view fields cleaned: " + JSON.stringify(w));
  post(env, { t: "view", p: "/x/", r: "News.Example.COM", v: "int" }); w = hits(env).at(-1);
  ok(w[8] === "news.example.com" && w[10] === "int", "referrer lower-cased, internal flag kept");
  post(env, { t: "event", p: "/learn/", s: "learn", e: "Speak", v: "=HYPERLINK(\"http://x\")\n<b>" + "y".repeat(100), r: "x.com", sec: 5 }); w = hits(env).at(-1);
  ok(w[9] === "speak" && !w[10].startsWith("=") && !/[<>\n]/.test(w[10]) && w[10].length <= 80 && w[8] === "" && w[11] === "", "event value cleaned: " + JSON.stringify(w.slice(8)));
  post(env, { t: "event", p: "/", e: "quiz", v: "+1-2" }); ok(hits(env).at(-1)[10] === "1-2", "leading + stripped (no formula)");
  post(env, { t: "event", p: "/", e: "lead", v: 42 }); ok(hits(env).at(-1)[10] === "42", "numeric value accepted as text");
  post(env, { t: "leave", p: "/x/", sec: 999999, sc: 150 }); w = hits(env).at(-1);
  ok(w[11] === 21600 && w[12] === 100 && w[9] === "" && w[10] === "", "leave clamped: " + JSON.stringify(w.slice(9)));
  post(env, { t: "leave", p: "/x/", sec: -5, sc: "abc" }); w = hits(env).at(-1);
  ok(w[11] === 0 && w[12] === "", "negative sec → 0, bad sc → empty");
  post(env, { t: "leave", p: "/x/", sec: "30", sc: "55" }); w = hits(env).at(-1);
  ok(w[11] === 30 && w[12] === 55, "numeric strings accepted");
  post(env, { t: "view", p: "/" + "a".repeat(300) }); ok(hits(env).at(-1)[2].length === 200, "path clamped to 200");
  post(env, { t: "view", p: "/x/", tz: "America/Argentina/Buenos_Aires", bl: "de" }); w = hits(env).at(-1);
  ok(w[6] === "America/Argentina/Buenos_Aires" && w[5] === "de", "3-part time zone and plain language kept"); }
// daily cap and lock
{ const env = makeEnv(); vm.runInContext("CFG.DAILY_CAP = 3", env.ctx);
  for (let i = 0; i < 6; i++) post(env, { t: "view", p: "/a/" });
  ok(hits(env).length === 3, "daily cap respected: " + hits(env).length); }
{ const env = makeEnv({ lockFails: true }); post(env, { t: "view", p: "/a/" }); ok(hits(env).length === 0, "no lock → hit dropped, no error"); }
// daily cap = calendar day in the script time zone, counted from the sheet: a cache expiry (6 h max) or eviction never resets it
{ const clock = { now: 0 }, env = makeEnv({ tz: "Europe/Bratislava", clock }); vm.runInContext("CFG.DAILY_CAP = 3; CFG.CHUNK = 2;", env.ctx);
  const at = iso => { clock.now = Date.parse(iso); return env.ctx.appendHit_(env.ctx.cleanHit_({ t: "view", p: "/a/" }, new Date(clock.now))); };
  // yesterday (local 06.10 23:30 = 21:30Z) does not count for 07.10
  ok(at("2026-10-06T21:30:00Z") === true, "yesterday hit accepted");
  ok(at("2026-10-07T08:00:00Z") && at("2026-10-07T08:01:00Z") && at("2026-10-07T08:02:00Z"), "3 hits of 07.10 accepted (yesterday's row not counted)");
  ok(at("2026-10-07T08:03:00Z") === false, "4th hit of the day refused");
  ok(at("2026-10-07T15:30:00Z") === false, "cache expired after 7 h: recount from the sheet, still refused");
  for (const k of Object.keys(env.cache)) delete env.cache[k];
  ok(at("2026-10-07T16:00:00Z") === false, "cache evicted: recount from the sheet, still refused");
  ok(env.cache["hits-2026-10-07"] && env.cache["hits-2026-10-07"].v === "3", "recount memoised: " + JSON.stringify(env.cache));
  ok(at("2026-10-07T21:59:00Z") === false, "local 23:59 of 07.10 still refused");
  ok(at("2026-10-07T22:30:00Z") === true, "local 00:30 of 08.10 (still 07.10 in UTC) = new day, accepted");
  ok(hits(env).length === 5, "rows stored: 1 + 3 + 1 = " + hits(env).length);
  ok(Object.values(env.cache).every(c => c.exp - clock.now <= 21600e3), "cache TTL never above 6 h"); }
{ const env = makeEnv({ cacheFails: true }); vm.runInContext("CFG.DAILY_CAP = 2", env.ctx);
  for (let i = 0; i < 5; i++) post(env, { t: "view", p: "/a/" });
  ok(hits(env).length === 2, "cache service failing: cap still respected via the sheet: " + hits(env).length); }
{ const clock = { now: Date.parse("2026-10-07T10:05:00Z") }, env = makeEnv({ clock }); vm.runInContext("CFG.DAILY_CAP = 50000; CFG.CHUNK = 10000;", env.ctx);
  const sh = env.ss.insertSheet("hits"); sh.rows.push(["time"]); const t0 = Date.parse("2026-10-07T10:00:00Z");
  for (let i = 0; i < 60000; i++) sh.rows.push([new Date(t0 + i).toISOString()]);
  env.calls.getRange = 0;
  const r = env.ctx.appendHit_(env.ctx.cleanHit_({ t: "view", p: "/a/" }, new Date(clock.now)));
  ok(r === false && sh.rows.length === 60001 && env.calls.getRange === 5, "a full day: refused after reading 5 chunks of column A: " + env.calls.getRange);
  env.calls.getRange = 0; env.ctx.appendHit_(env.ctx.cleanHit_({ t: "view", p: "/a/" }, new Date(clock.now)));
  ok(env.calls.getRange === 0, "next refused hit uses the memo, no sheet read"); }

/* ---------- 2. access to the dashboard ---------- */
{ for (const [who, o] of [["anonymous", { active: "" }], ["other user", { active: "someone@example.com" }]]) {
    const env = makeEnv(o); const r = env.ctx.doGet({ parameter: { days: "30" } });
    ok(r.kind === "text" && r.content === "ok", "doGet " + who + " → text ok");
    let threw = false; try { env.ctx.getStats(7); } catch (e) { threw = /forbidden/.test(e.message); } ok(threw, "getStats " + who + " → forbidden");
  }
  const env = makeEnv({ active: "Owner@Example.com" });
  const r = env.ctx.doGet({ parameter: { days: "30" } });
  ok(r.kind === "html" && r.title === "Статистика · проєкти ClayArena", "doGet owner → dashboard");
  const data = JSON.parse(r.payload);
  ok(data.days === 30 && data.totals.views === 0 && Array.isArray(data.series) && data.series.length >= 30, "empty sheet → zero totals, 30+ day buckets: " + data.series.length);
  ok(env.ctx.doGet({ parameter: { days: "5" } }) && JSON.parse(env.ctx.doGet({ parameter: { days: "5" } }).payload).days === 7, "unknown period → 7 days");
  ok(JSON.parse(env.ctx.doGet({}).payload).days === 7, "no parameter → 7 days");
  ok(env.ctx.getStats(1).hourly === true && env.ctx.getStats(1).series.length >= 24, "1 day → hourly buckets"); }

/* ---------- 3. aggregation ---------- */
{ const env = makeEnv({ active: "owner@example.com", tz: "Europe/Bratislava" });
  const now = Date.now(), iso = ms => new Date(ms).toISOString(), D = 864e5;
  const H = ["time", "t", "p", "s", "l", "bl", "tz", "d", "r", "e", "v", "sec", "sc"];
  const sh = env.ss.insertSheet("hits"); sh.rows.push(H);
  const add = (ago, t, p, s, extra = {}) => sh.rows.push([iso(now - ago), t, p, s, extra.l || "uk", extra.bl || "uk-UA", extra.tz || "Europe/Kyiv", extra.d || "desktop", extra.r || "", extra.e || "", extra.v || "", extra.sec ?? "", extra.sc ?? ""]);
  // 200 old rows (40 days ago) — must not count in 7 days
  for (let i = 0; i < 200; i++) add(40 * D, "view", "/old/", "other");
  // recent data (rows in time order: oldest first)
  add(3 * D, "view", "/clayaway/learn/", "learn", { r: "www.google.com" });
  add(3 * D - 1000, "leave", "/clayaway/learn/", "learn", { sec: 40, sc: 80 });
  add(2 * D, "view", "/clayaway/learn/gun-fit/", "learn", { v: "int", d: "phone", tz: "Europe/Bratislava", bl: "sk-SK" });
  add(2 * D - 1000, "leave", "/clayaway/learn/gun-fit/", "learn", { sec: 20, sc: 100 });
  add(2 * D - 2000, "leave", "/clayaway/learn/gun-fit/", "learn", { sec: 10 });
  add(1 * D, "view", "/clayaway/rules/trainer/", "trainer", { r: "l.facebook.com", tz: "America/Indiana/Knox", l: "en", bl: "en-US" });
  add(1 * D, "view", "/clayaway/glossary/choke/", "glossary", { tz: "Asia/Unknown_City" });
  add(3600e3, "event", "/clayaway/learn/", "learn", { e: "route", v: "beginner" });
  add(3500e3, "event", "/clayaway/learn/gun-fit/", "learn", { e: "lesson_done", v: "gun-fit" });
  add(3400e3, "event", "/clayaway/learn/gun-fit/", "learn", { e: "quiz", v: "gun-fit:2/3" });
  add(3300e3, "event", "/clayaway/learn/gun-fit/", "learn", { e: "quiz", v: "gun-fit:3/3" });
  add(3200e3, "event", "/clayaway/learn/practice/lead-lab/", "learn", { e: "game_start", v: "lead-lab" });
  add(3100e3, "event", "/clayaway/learn/practice/name-the-flight/", "learn", { e: "game_end", v: "name-the-flight:8/10" });
  add(3000e3, "event", "/clayaway/learn/practice/term-cards/", "learn", { e: "game_end", v: "term-cards" });
  add(2900e3, "event", "/clayaway/learn/routes/beginner/exam/", "learn", { e: "exam_pass", v: "beginner:90" });
  add(2800e3, "event", "/clayaway/learn/routes/beginner/exam/", "learn", { e: "exam_fail", v: "beginner:60" });
  add(2700e3, "event", "/clayaway/learn/routes/beginner/exam/", "learn", { e: "cert", v: "beginner" });
  add(2600e3, "event", "/clayaway/rules/trainer/", "trainer", { e: "trainer_test", v: "sporting:exam:83" });
  add(2500e3, "event", "/clayaway/rules/trainer/", "trainer", { e: "trainer_test", v: "sporting:exam:70" });
  add(2400e3, "event", "/clayaway/rules/trainer/", "trainer", { e: "lang", v: "de" });
  add(2300e3, "event", "/clayaway/learn/practice/lead-lab/", "learn", { e: "lead", v: "maintained:hit" });
  add(2200e3, "event", "/clayaway/learn/practice/lead-lab/", "learn", { e: "lead", v: "maintained:behind" });
  add(2100e3, "event", "/clayaway/glossary/choke/", "glossary", { e: "speak", v: "Choke" });
  add(2000e3, "event", "/clayaway/learn/", "learn", { e: "disc", v: "compak" });
  add(1900e3, "event", "/clayaway/learn/", "learn", { e: "custom_x", v: "1" });
  env.calls.getRange = 0;
  const d = env.ctx.getStats(7);
  ok(d.totals.views === 4 && d.totals.visits === 3, "views 4, visits 3: " + JSON.stringify(d.totals));
  ok(d.totals.avgSec === 35 && d.totals.avgScroll === 90, "avg seconds (70 s / 2 timed views) and scroll: " + JSON.stringify(d.totals));
  ok(d.totals.events === 18, "events 18: " + d.totals.events);
  ok(d.rows === 25 && !d.capped, "only rows of the period: " + d.rows);
  ok(env.calls.getRange === 1, "one chunk read for a small sheet: " + env.calls.getRange);
  const pg = Object.fromEntries(d.pages.map(p => [p[0], p]));
  ok(pg["/clayaway/learn/gun-fit/"][1] === 1 && pg["/clayaway/learn/gun-fit/"][2] === 0 && pg["/clayaway/learn/gun-fit/"][3] === 30, "page row: views, entries, avg sec " + JSON.stringify(pg["/clayaway/learn/gun-fit/"]));
  ok(!pg["/old/"], "old page not in the period");
  ok(JSON.stringify(d.sections[0]) === JSON.stringify(["learn", 2, 35]), "sections with avg time: " + JSON.stringify(d.sections));
  const reg = Object.fromEntries(d.regions);
  ok(reg["Україна"] === 1 && reg["Словаччина"] === 1 && reg["США"] === 1 && reg["Asia/Unknown_City"] === 1, "regions: " + JSON.stringify(d.regions));
  const refs = Object.fromEntries(d.refs);
  ok(refs["google.com"] === 1 && refs["facebook.com"] === 1 && refs[""] === 1 && Object.keys(refs).length === 3, "referrers of entries only: " + JSON.stringify(d.refs));
  ok(Object.fromEntries(d.devices).phone === 1, "devices");
  ok(Object.fromEntries(d.blangs).sk === 1 && Object.fromEntries(d.blangs).uk === 2, "browser languages by primary tag: " + JSON.stringify(d.blangs));
  ok(Object.fromEntries(d.langs).en === 1, "page languages");
  const E = d.events;
  ok(JSON.stringify(E.route) === '[["beginner",1]]' && E.lessonN === 1 && JSON.stringify(E.lesson) === '[["gun-fit",1]]', "route and lessons");
  ok(E.quiz.n === 2 && E.quiz.pct === 83, "quiz 5/6 = 83 %: " + JSON.stringify(E.quiz));
  const G = Object.fromEntries(E.games.map(g => [g[0], g]));
  ok(G["lead-lab"][1] === 1 && G["name-the-flight"][2] === 1 && G["name-the-flight"][3] === 80 && G["term-cards"][2] === 1 && G["term-cards"][3] === null, "games: " + JSON.stringify(E.games));
  ok(JSON.stringify(E.exams) === '[["beginner",2,1,75]]', "exams [route, tries, passed, avg]: " + JSON.stringify(E.exams));
  ok(JSON.stringify(E.cert) === '[["beginner",1]]', "certificates");
  ok(JSON.stringify(E.trainer) === '[["sporting · exam",2,77,1]]', "trainer: " + JSON.stringify(E.trainer));
  ok(JSON.stringify(E.lang) === '[["de",1]]' && JSON.stringify(E.langSec) === '[["trainer",1]]', "language switches");
  ok(JSON.stringify(E.lead) === '[["maintained",2,1,1,0,0]]', "lead lab: " + JSON.stringify(E.lead));
  ok(E.speakN === 1 && JSON.stringify(E.speak) === '[["Choke",1]]', "pronunciation");
  ok(JSON.stringify(E.disc) === '[["compak",1]]' && JSON.stringify(E.other) === '[["custom_x",1]]', "disc and other events");
  const sum = d.series.reduce((a, b) => a + b.v, 0), sumE = d.series.reduce((a, b) => a + b.e, 0);
  ok(sum === 4 && sumE === 3 && d.series.length === 7, "daily series: 7 buckets with all views: " + d.series.length + " " + sum);
  ok(new Set(d.series.map(b => b.k)).size === d.series.length, "bucket keys unique");
  // 90 days: includes the old rows
  const d90 = env.ctx.getStats(90);
  ok(d90.totals.views === 204 && d90.series.length === 90, "90 days include old rows: " + d90.totals.views + " / " + d90.series.length);
  // 1 day: only the last 24 hours
  const d1 = env.ctx.getStats(1);
  ok(d1.totals.views === 0 && d1.totals.events === 18, "1 day: events of the last hours only: " + JSON.stringify(d1.totals));
  // read cap
  vm.runInContext("CFG.MAX_READ = 20; CFG.CHUNK = 7;", env.ctx); env.calls.getRange = 0;
  const dc = env.ctx.getStats(90);
  ok(dc.capped === true && dc.scanned === 20 && env.calls.getRange === 3, "read cap 20 rows in chunks of 7: " + JSON.stringify([dc.capped, dc.scanned, env.calls.getRange]));
  vm.runInContext("CFG.MAX_READ = 200000; CFG.CHUNK = 10;", env.ctx); env.calls.getRange = 0;
  const ds = env.ctx.getStats(7);
  ok(ds.totals.views === 4 && env.calls.getRange <= 4, "chunked scan stops at older rows: " + env.calls.getRange + " reads");
  // payload escaping in the template
  sh.rows.push([iso(now - 1000), "event", "/x/", "other", "uk", "", "", "", "", "speak", "</script><script>alert(1)</script>", "", ""]);
  const html = env.ctx.doGet({ parameter: { days: "7" } });
  ok(!html.payload.includes("</script>") && !html.payload.includes("<") && JSON.parse(html.payload).events.speak.some(x => x[0].includes("</script>")), "payload escaped for <script>");
  ok((html.content.match(/<\/script>/g) || []).length === 2, "template has exactly its own two script blocks");
  // cleanup
  vm.runInContext("CFG.KEEP_DAYS = 30;", env.ctx);
  const before = sh.rows.length, removed = env.ctx.cleanupOldHits();
  ok(removed === 200 && sh.rows.length === before - 200 && sh.rows[0][0] === "time", "cleanupOldHits removed the 200 old rows, header kept"); }
{ const env = makeEnv({ active: "intruder@example.com" }); let threw = false; try { env.ctx.cleanupOldHits(); } catch (e) { threw = true; } ok(threw, "cleanupOldHits refused for another signed-in user"); }

/* ---------- 4. end-to-end: the tracker's own hits go through the collector ---------- */
{ const env = makeEnv({ active: "owner@example.com" });
  const sample = [{ t: "view", p: "/clayaway/learn/", s: "learn", l: "uk", bl: "uk-UA", tz: "Europe/Kyiv", d: "desktop", r: "www.google.com" },
    { t: "leave", p: "/clayaway/learn/", s: "learn", l: "uk", bl: "uk-UA", tz: "Europe/Kyiv", d: "desktop", sec: 42, sc: 75 },
    { t: "event", p: "/clayaway/learn/gun-fit/", s: "learn", l: "uk", bl: "uk-UA", tz: "Europe/Kyiv", d: "desktop", e: "quiz", v: "gun-fit:3/3" }];
  sample.forEach(h => post(env, h));
  const d = env.ctx.getStats(7);
  ok(hits(env).length === 3 && d.totals.views === 1 && d.totals.visits === 1 && d.totals.avgSec === 42 && d.events.quiz.pct === 100, "tracker hits → collector → dashboard: " + JSON.stringify(d.totals)); }

console.log(`Code.gs: ${passes} passed, ${fails} failed`); process.exit(fails ? 1 : 0);
