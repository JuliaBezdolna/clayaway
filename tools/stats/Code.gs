/** @OnlyCurrentDoc */ // access to THIS spreadsheet only (not to all files of the owner)
/* =====================================================================================================================
   ClayArena · own anonymous visit statistics — COLLECTOR + PRIVATE DASHBOARD
   Google Apps Script bound to a Google Sheet (Extensions → Apps Script). PROJECT file: lives in tools/stats/, outside docs/,
   so GitHub Pages never publishes it. Setup for the owner, step by step: tools/stats/README.md. For developers: DEVELOPERS.md §4h.

   HOW IT WORKS
   - The tracker docs/shared/stats.js (loaded on every page by docs/shared/nav.js) POSTs one small JSON "hit" per view, leave
     or event to the web-app URL of this script (deployment "Anyone" = the COLLECTOR URL, public by design).
   - doPost() validates every field against a whitelist, clamps lengths and appends ONE row to the sheet "hits":
       [server ISO time, t, p, s, l, bl, tz, d, r, e, v, sec, sc]
     Nothing else is stored: no IP (Apps Script never sees it), no cookies, no user agent, no identifiers. Rows cannot be linked.
   - Transport: Apps Script runs doPost() on the POST to ".../exec" and then answers with a 302 redirect to
     script.googleusercontent.com only to hand out the text "ok" (doGet() is not called by it). The tracker sends with
     mode "no-cors", so the browser never sees that answer: the ONLY proof that hits arrive is new rows in "hits". Do the go/no-go
     check of DEVELOPERS.md §4h (curl, localhost console, live site) whenever STATS_ENDPOINT is set or changed.
   - doGet() shows the PRIVATE dashboard (Dashboard.html) only to the owner of the script; everybody else gets the text "ok".
     The owner opens the second deployment "Only myself" (= the DASHBOARD URL, never published anywhere).
   - getStats(days) is called by the dashboard (google.script.run) for the period switcher and the "оновити" button.
   - cleanupOldHits() deletes rows older than CFG.KEEP_DAYS (run it by hand or with a monthly time-driven trigger).

   FIELDS (what the tracker sends; anything else is dropped)
     t   view | leave | event
     p   page path without query and hash, max 200
     s   section: learn, glossary, rules, trainer, tours, spec, home, other
     l   page language (<html lang>)         bl  browser language, 2–5 chars (uk, uk-UA)
     tz  browser time zone (region only)     d   phone | tablet | desktop
     r   referrer HOST of a view (empty for same-site and direct visits)
     e   event name, max 40                  v   event value, max 80; on a view "int" = same-site / in-app navigation
     sec seconds the page was visible (leave) sc  max scroll % (first leave of a view only)
   Events: route, lesson_done, quiz, game_start, game_end, exam_pass, exam_fail, cert, lang, disc (Academy),
           trainer_test, lang (rules trainer), lead (lead lab, sims.js), speak (pronunciation, sims.js).

   PRODUCTION (clayarena.com): ClayArena's own analytics replace this; keep the event names and the "no PII" rule.
   ===================================================================================================================== */

var CFG = {
  SHEET: "hits",
  MAX_BODY: 2048,     // bytes; bigger payloads are ignored
  MAX_READ: 200000,   // the dashboard reads at most the last 200 000 rows
  CHUNK: 10000,       // rows per read while scanning back from the newest row
  DAILY_CAP: 50000,   // hits accepted per calendar day in the script time zone (the collector URL is public: protects the sheet
                      // from flooding). Counted from the sheet itself, CacheService only memoises the count (appendHit_)
  KEEP_DAYS: 400,     // cleanupOldHits() keeps this many days
  TZ: "Europe/Bratislava" // used when the script has no time zone (Project Settings → Time zone)
};
var HEADER = ["time", "t", "p", "s", "l", "bl", "tz", "d", "r", "e", "v", "sec", "sc"];
var TYPES = { view: 1, leave: 1, event: 1 };
var SECTIONS = { learn: 1, glossary: 1, rules: 1, trainer: 1, tours: 1, spec: 1, home: 1, other: 1 };
var DEVICES = { phone: 1, tablet: 1, desktop: 1 };
var PERIODS = { 1: 1, 7: 1, 30: 1, 90: 1 };

/* ================================ Collector ================================ */

function doPost(e) {
  try {
    var pd = e && e.postData, body = pd && typeof pd.contents === "string" ? pd.contents : "";
    if (body && !(Number(pd.length) > CFG.MAX_BODY) && utf8Len_(body) <= CFG.MAX_BODY) {
      var row = cleanHit_(JSON.parse(body), new Date());
      if (row) appendHit_(row);
    }
  } catch (err) { /* a broken hit is ignored: the answer is always "ok" */ }
  return text_("ok");
}

/* One hit → one row, or null. Every field is checked against a whitelist; unknown keys are never read. */
function cleanHit_(o, now) {
  if (!o || typeof o !== "object" || Array.isArray(o)) return null;
  var t = str_(o.t, 8);
  if (!has_(TYPES, t)) return null;
  var p = str_(o.p, 400).replace(/[?#].*$/, "").slice(0, 200);
  if (!/^\/[A-Za-z0-9\-._~%!$&()*+,;=:@\/]*$/.test(p)) return null;
  var s = has_(SECTIONS, o.s) ? o.s : "other";
  var l = str_(o.l, 12).toLowerCase();
  if (!/^[a-z]{2,3}(-[a-z0-9]{2,8})?$/.test(l)) l = "";
  var bl = str_(o.bl, 8);
  if (bl.length > 5 || !/^[A-Za-z]{2,3}(-[A-Za-z]{2})?$/.test(bl)) bl = "";
  var tz = str_(o.tz, 41);
  if (tz.length > 40 || !/^[A-Za-z][A-Za-z0-9_+\-]*(\/[A-Za-z0-9_+\-]+){0,2}$/.test(tz)) tz = "";
  var d = has_(DEVICES, o.d) ? o.d : "";
  var r = "", e = "", v = "", sec = "", sc = "";
  if (t === "view") {
    r = str_(o.r, 101).toLowerCase();
    if (r.length > 100 || !/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/.test(r)) r = "";
    if (o.v === "int") v = "int";
  } else if (t === "event") {
    e = str_(o.e, 41).toLowerCase();
    if (!/^[a-z][a-z0-9_:-]{0,39}$/.test(e)) return null;
    v = safeText_(str_(o.v, 200)).slice(0, 80);
  } else {
    sec = int_(o.sec, 0, 21600);
    if (sec === "") return null;
    sc = int_(o.sc, 0, 100);
  }
  return [now.toISOString(), t, p, s, l, bl, tz, d, r, e, v, sec, sc];
}

/* Appends one row under the script lock, unless today's cap is reached.
   DAILY CAP: "today" = the calendar day of the hit in the script time zone (the same days as on the dashboard chart). The SHEET is
   the source of truth: on a cache miss the rows of today are counted from the sheet (column A only, scanning back from the newest
   row, at most DAILY_CAP rows). CacheService keeps that count under a key with the date only as a fast memo: its entries live at
   most 6 hours (platform limit, 21600 s) and may be evicted earlier, so an expiry must never reset the counter — it only triggers
   a recount. Not PropertiesService: its daily read/write quota (50 000 on a free account) is smaller than two calls per hit.
   A new day = a new key = a fresh count. Rows of today deleted by the owner free the cap again once the memo expires. */
function appendHit_(row) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return false;
  try {
    var when = new Date(time_(row[0])), tz = scriptTz_(), key = "hits-" + Utilities.formatDate(when, tz, "yyyy-MM-dd");
    var sh = sheet_(true), cache = null, memo = null;
    try { cache = CacheService.getScriptCache(); memo = cache.get(key); } catch (x) { cache = null; } // no cache → count from the sheet
    var n = typeof memo === "string" && /^\d{1,9}$/.test(memo) ? Number(memo) : countSince_(sh, midnight_(when, tz), CFG.DAILY_CAP);
    if (n >= CFG.DAILY_CAP) {
      if (cache && memo !== String(n)) try { cache.put(key, String(n), 21600); } catch (x) {} // flood: no recount per hit
      return false;
    }
    sh.appendRow(row);
    if (cache) try { cache.put(key, String(n + 1), 21600); } catch (x) {}
    return true;
  } finally {
    lock.releaseLock();
  }
}

/* Number of rows with a time stamp >= since, counted from the newest row back (rows are appended in time order), reading only
   column A in chunks of CFG.CHUNK; stops at the first older row or at max. */
function countSince_(sh, since, max) {
  var n = 0;
  for (var end = sh.getLastRow(); end >= 2; end -= CFG.CHUNK) {
    var start = Math.max(2, end - CFG.CHUNK + 1), vals = sh.getRange(start, 1, end - start + 1, 1).getValues();
    for (var i = vals.length - 1; i >= 0; i--) {
      var ts = time_(vals[i][0]);
      if (isNaN(ts)) continue;
      if (ts < since) return n;
      if (++n >= max) return n;
    }
  }
  return n;
}

/* The sheet "hits" (created with the header when missing). Text columns are formatted as plain text, so a value is never read
   as a date, a number or a formula. */
function sheet_(create) {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), sh = ss.getSheetByName(CFG.SHEET);
  if (!sh && create) {
    sh = ss.insertSheet(CFG.SHEET);
    sh.appendRow(HEADER);
    sh.setFrozenRows(1);
    sh.getRange("A:K").setNumberFormat("@");
  }
  return sh;
}

/* ================================ Private dashboard ================================ */

function doGet(e) {
  if (!isOwner_()) return text_("ok"); // anonymous visitors of the public collector URL see only this
  var days = days_(e && e.parameter && e.parameter.days);
  var tpl = HtmlService.createTemplateFromFile("Dashboard");
  tpl.payload = json_(stats_(days));
  return tpl.evaluate()
    .setTitle("Статистика · проєкти ClayArena")
    .addMetaTag("viewport", "width=device-width, initial-scale=1");
}

/* Called by Dashboard.html (google.script.run): the same data for another period. Owner only. */
function getStats(days) {
  if (!isOwner_()) throw new Error("forbidden");
  return stats_(days_(days));
}

/* Owner = the user who opens the page is the account the script runs as. In the public "Anyone" deployment Google does not
   reveal the visitor (empty e-mail), so visitors never pass. */
function isOwner_() {
  var a = "", b = "";
  try { a = String(Session.getActiveUser().getEmail() || "").toLowerCase(); } catch (x) {}
  try { b = String(Session.getEffectiveUser().getEmail() || "").toLowerCase(); } catch (x) {}
  return !!a && a === b;
}

function stats_(days) {
  var now = new Date(), tz = scriptTz_(), since = periodStart_(now, tz, days);
  var read = readHits_(since);
  var out = aggregate_(read.rows, { days: days, since: since, now: now.getTime(), tz: tz, key: keyFn_(tz, days === 1) });
  out.scanned = read.scanned;
  out.capped = read.capped;
  return out;
}

/* Rows of the period, newest first. Rows are appended in time order, so the scan goes back from the newest row in chunks and
   stops at the first chunk that reaches older rows; at most CFG.MAX_READ rows are read. */
function readHits_(since) {
  var sh = sheet_(false), rows = [], scanned = 0;
  if (!sh) return { rows: rows, scanned: 0, capped: false };
  var last = sh.getLastRow(), first = Math.max(2, last - CFG.MAX_READ + 1);
  for (var end = last; end >= first; end -= CFG.CHUNK) {
    var start = Math.max(first, end - CFG.CHUNK + 1);
    var vals = sh.getRange(start, 1, end - start + 1, HEADER.length).getValues(), older = false;
    scanned += vals.length;
    for (var i = vals.length - 1; i >= 0; i--) {
      var ts = time_(vals[i][0]);
      if (isNaN(ts)) continue;
      if (ts < since) { older = true; continue; }
      rows.push(vals[i]);
    }
    if (older) return { rows: rows, scanned: scanned, capped: false };
  }
  return { rows: rows, scanned: scanned, capped: first > 2 };
}

/* Everything the dashboard shows, from the rows of the period. o = {days, since, now, tz, key(ts) → bucket key}. */
function aggregate_(rows, o) {
  var T = { views: 0, visits: 0, events: 0, leaves: 0, sec: 0, timed: 0, scSum: 0 };
  var buckets = buckets_(o), bi = {};
  for (var b = 0; b < buckets.length; b++) bi[buckets[b].k] = b;
  var pages = map_(), sections = map_(), langs = map_(), blangs = map_(), regions = map_(), devices = map_(), refs = map_();
  var secBy = map_(), timedBy = map_();
  var ev = {
    route: map_(), lesson: map_(), lessonN: 0, quiz: { n: 0, ok: 0, q: 0 }, games: map_(), exams: map_(), cert: map_(),
    trainer: map_(), lang: map_(), langSec: map_(), disc: map_(), lead: map_(), speak: map_(), speakN: 0, other: map_()
  };
  for (var i = 0; i < rows.length; i++) {
    var row = rows[i], ts = time_(row[0]), t = String(row[1]), p = String(row[2] || ""), s = String(row[3] || "other");
    if (t === "view") {
      var entry = String(row[10]) !== "int";
      T.views++;
      if (entry) T.visits++;
      var k = o.key(ts);
      if (k in bi) { buckets[bi[k]].v++; if (entry) buckets[bi[k]].e++; }
      var pg = pages[p] || (pages[p] = { v: 0, e: 0, sec: 0, n: 0 });
      pg.v++;
      if (entry) pg.e++;
      inc_(sections, s);
      inc_(langs, String(row[4] || "") || "?");
      inc_(blangs, String(row[5] || "").split("-")[0].toLowerCase() || "?");
      inc_(regions, region_(String(row[6] || "")));
      inc_(devices, String(row[7] || "") || "?");
      if (entry) inc_(refs, refHost_(String(row[8] || "")));
    } else if (t === "leave") {
      var sec = num_(row[11]), sc = row[12], pl = pages[p] || (pages[p] = { v: 0, e: 0, sec: 0, n: 0 });
      T.leaves++;
      T.sec += sec;
      pl.sec += sec;
      inc_(secBy, s, sec);
      if (sc !== "" && sc != null && !isNaN(Number(sc))) { T.timed++; T.scSum += Number(sc); pl.n++; inc_(timedBy, s); }
    } else if (t === "event") {
      T.events++;
      event_(ev, String(row[9] || ""), String(row[10] || ""), s);
    }
  }
  var pageList = Object.keys(pages).filter(function (x) { return pages[x].v > 0; }).map(function (x) {
    var q = pages[x];
    return [x, q.v, q.e, q.n ? Math.round(q.sec / q.n) : null];
  }).sort(function (a, c) { return c[1] - a[1] || (a[0] < c[0] ? -1 : 1); });
  var sectionList = top_(sections, 20).map(function (x) {
    return [x[0], x[1], timedBy[x[0]] ? Math.round((secBy[x[0]] || 0) / timedBy[x[0]]) : null];
  });
  return {
    days: o.days, from: new Date(o.since).toISOString(), to: new Date(o.now).toISOString(), tz: o.tz, hourly: o.days === 1,
    rows: rows.length,
    totals: {
      views: T.views, visits: T.visits, events: T.events,
      avgSec: T.timed ? Math.round(T.sec / T.timed) : null,
      avgScroll: T.timed ? Math.round(T.scSum / T.timed) : null
    },
    series: buckets,
    pages: pageList.slice(0, 30), pagesTotal: pageList.length,
    sections: sectionList, langs: top_(langs, 20), blangs: top_(blangs, 20), regions: top_(regions, 25),
    devices: top_(devices, 5), refs: top_(refs, 25),
    events: {
      route: top_(ev.route, 20), lesson: top_(ev.lesson, 20), lessonN: ev.lessonN,
      quiz: { n: ev.quiz.n, pct: ev.quiz.q ? Math.round(ev.quiz.ok / ev.quiz.q * 100) : null },
      games: list_(ev.games, function (k, g) { return [k, g.start, g.end, g.q ? Math.round(g.ok / g.q * 100) : null]; }),
      exams: list_(ev.exams, function (k, x) { return [k, x.pass + x.fail, x.pass, x.n ? Math.round(x.sum / x.n) : null]; }),
      cert: top_(ev.cert, 20),
      trainer: list_(ev.trainer, function (k, x) { return [k, x.n, x.n ? Math.round(x.sum / x.n) : null, x.pass]; }),
      lang: top_(ev.lang, 20), langSec: top_(ev.langSec, 10), disc: top_(ev.disc, 5),
      lead: list_(ev.lead, function (k, x) { return [k, x.n, x.hit, x.behind, x.ahead, x.none]; }),
      speakN: ev.speakN, speak: top_(ev.speak, 20), other: top_(ev.other, 20)
    }
  };
}

/* One event row into the groups of the dashboard. Values: quiz "lesson:score/n", game_end "game:ok/n", exam "route:score",
   trainer_test "disc:mode:pct", lead "method:hit|behind|ahead|none". */
function event_(ev, e, v, s) {
  var m;
  switch (e) {
    case "route": inc_(ev.route, v || "?"); break;
    case "lesson_done": ev.lessonN++; inc_(ev.lesson, v || "?"); break;
    case "quiz":
      m = /^(.*):(\d+)\/(\d+)$/.exec(v);
      if (m && +m[3] > 0) { ev.quiz.n++; ev.quiz.ok += Math.min(+m[2], +m[3]); ev.quiz.q += +m[3]; }
      break;
    case "game_start": game_(ev, v).start++; break;
    case "game_end":
      m = /^(.*):(\d+)\/(\d+)$/.exec(v);
      var g = game_(ev, m ? m[1] : v);
      g.end++;
      if (m && +m[3] > 0) { g.ok += Math.min(+m[2], +m[3]); g.q += +m[3]; }
      break;
    case "exam_pass": case "exam_fail":
      m = /^(.*):(\d+)$/.exec(v);
      var x = ev.exams[m ? m[1] : v || "?"] || (ev.exams[m ? m[1] : v || "?"] = { pass: 0, fail: 0, n: 0, sum: 0 });
      if (e === "exam_pass") x.pass++; else x.fail++;
      if (m) { x.n++; x.sum += Math.min(100, +m[2]); }
      break;
    case "cert": inc_(ev.cert, v || "?"); break;
    case "trainer_test":
      m = /^([a-z]+):([a-z]+):(\d+)$/.exec(v);
      if (m) {
        var tt = ev.trainer[m[1] + " · " + m[2]] || (ev.trainer[m[1] + " · " + m[2]] = { n: 0, sum: 0, pass: 0 });
        tt.n++; tt.sum += Math.min(100, +m[3]); if (+m[3] >= 80) tt.pass++;
      }
      break;
    case "lang": inc_(ev.lang, v || "?"); inc_(ev.langSec, s); break;
    case "disc": inc_(ev.disc, v || "?"); break;
    case "lead":
      m = /^([a-z]+):(hit|behind|ahead|none)$/.exec(v);
      if (m) { var ld = ev.lead[m[1]] || (ev.lead[m[1]] = { n: 0, hit: 0, behind: 0, ahead: 0, none: 0 }); ld.n++; ld[m[2]]++; }
      break;
    case "speak": ev.speakN++; inc_(ev.speak, v || "?"); break;
    default: inc_(ev.other, e || "?");
  }
}
function game_(ev, id) { id = id || "?"; return ev.games[id] || (ev.games[id] = { start: 0, end: 0, ok: 0, q: 0 }); }

/* Time buckets of the chart: hours for 1 day, else days (keys in the script time zone, every bucket present, also empty ones). */
function buckets_(o) {
  var out = [], seen = {}, step = o.days === 1 ? 36e5 : 6 * 36e5;
  for (var t = o.since; t <= o.now + step; t += step) {
    var k = o.key(Math.min(t, o.now));
    if (!seen[k]) { seen[k] = 1; out.push({ k: k, v: 0, e: 0 }); }
  }
  return out;
}
/* Bucket key of a time stamp; Utilities.formatDate is called once per half hour of time, not once per row. */
function keyFn_(tz, hourly) {
  var cache = {};
  return function (ts) {
    var h = Math.floor(ts / 18e5);
    if (!(h in cache)) cache[h] = Utilities.formatDate(new Date(h * 18e5), tz, hourly ? "yyyy-MM-dd HH" : "yyyy-MM-dd");
    return cache[h];
  };
}
/* 1 day = the last 24 hours; 7/30/90 days = from local midnight (days - 1) days ago up to now. */
function periodStart_(now, tz, days) {
  if (days === 1) return now.getTime() - 864e5;
  return midnight_(now, tz) - (days - 1) * 864e5;
}
/* Local midnight of the day of `now` in the time zone tz, as ms (uses the current UTC offset; on a DST switch day ±1 hour). */
function midnight_(now, tz) {
  var z = Utilities.formatDate(now, tz, "Z"), off = /^[+-]\d{4}$/.test(z) ? z.slice(0, 3) + ":" + z.slice(3) : "Z";
  var ms = Date.parse(Utilities.formatDate(now, tz, "yyyy-MM-dd") + "T00:00:00" + off);
  return isNaN(ms) ? now.getTime() : ms;
}
function scriptTz_() { try { return Session.getScriptTimeZone() || CFG.TZ; } catch (x) { return CFG.TZ; } }
function days_(x) { var n = parseInt(x, 10); return PERIODS[n] ? n : 7; }

/* Region by the browser time zone (approximate: a time zone, not a location). Unknown zones are shown as they are. */
var TZ_COUNTRY = {
  "Europe/Kyiv": "Україна", "Europe/Kiev": "Україна", "Europe/Uzhgorod": "Україна", "Europe/Zaporozhye": "Україна", "Europe/Simferopol": "Україна",
  "Europe/Bratislava": "Словаччина", "Europe/Prague": "Чехія", "Europe/Vienna": "Австрія", "Europe/Berlin": "Німеччина", "Europe/Busingen": "Німеччина",
  "Europe/Paris": "Франція", "Europe/Rome": "Італія", "Europe/Vatican": "Ватикан", "Europe/San_Marino": "Сан-Марино", "Europe/Madrid": "Іспанія",
  "Atlantic/Canary": "Іспанія", "Africa/Ceuta": "Іспанія", "Europe/Lisbon": "Португалія", "Atlantic/Madeira": "Португалія", "Atlantic/Azores": "Португалія",
  "Europe/London": "Велика Британія", "Europe/Belfast": "Велика Британія", "Europe/Guernsey": "Велика Британія", "Europe/Jersey": "Велика Британія",
  "Europe/Isle_of_Man": "Велика Британія", "Europe/Dublin": "Ірландія", "Europe/Amsterdam": "Нідерланди", "Europe/Brussels": "Бельгія",
  "Europe/Luxembourg": "Люксембург", "Europe/Zurich": "Швейцарія", "Europe/Vaduz": "Ліхтенштейн", "Europe/Monaco": "Монако", "Europe/Andorra": "Андорра",
  "Europe/Malta": "Мальта", "Europe/Gibraltar": "Гібралтар", "Europe/Warsaw": "Польща", "Europe/Budapest": "Угорщина", "Europe/Bucharest": "Румунія",
  "Europe/Chisinau": "Молдова", "Europe/Sofia": "Болгарія", "Europe/Athens": "Греція", "Europe/Istanbul": "Туреччина", "Asia/Istanbul": "Туреччина",
  "Europe/Nicosia": "Кіпр", "Asia/Nicosia": "Кіпр", "Asia/Famagusta": "Кіпр", "Europe/Belgrade": "Сербія", "Europe/Zagreb": "Хорватія",
  "Europe/Ljubljana": "Словенія", "Europe/Sarajevo": "Боснія і Герцеговина", "Europe/Podgorica": "Чорногорія", "Europe/Skopje": "Північна Македонія",
  "Europe/Tirane": "Албанія", "Europe/Vilnius": "Литва", "Europe/Riga": "Латвія", "Europe/Tallinn": "Естонія", "Europe/Helsinki": "Фінляндія",
  "Europe/Mariehamn": "Фінляндія", "Europe/Stockholm": "Швеція", "Europe/Oslo": "Норвегія", "Arctic/Longyearbyen": "Норвегія",
  "Europe/Copenhagen": "Данія", "Atlantic/Faroe": "Данія", "Atlantic/Reykjavik": "Ісландія", "Europe/Minsk": "Білорусь",
  "Asia/Tbilisi": "Грузія", "Asia/Yerevan": "Вірменія", "Asia/Baku": "Азербайджан", "Asia/Almaty": "Казахстан", "Asia/Tashkent": "Узбекистан",
  "Asia/Dubai": "ОАЕ", "Asia/Qatar": "Катар", "Asia/Riyadh": "Саудівська Аравія", "Asia/Jerusalem": "Ізраїль", "Asia/Tel_Aviv": "Ізраїль",
  "Asia/Tokyo": "Японія", "Asia/Seoul": "Південна Корея", "Asia/Shanghai": "Китай", "Asia/Hong_Kong": "Гонконг", "Asia/Taipei": "Тайвань",
  "Asia/Singapore": "Сінгапур", "Asia/Kolkata": "Індія", "Asia/Calcutta": "Індія", "Asia/Bangkok": "Таїланд", "Asia/Manila": "Філіппіни",
  "Asia/Jakarta": "Індонезія", "Asia/Kuala_Lumpur": "Малайзія", "Pacific/Auckland": "Нова Зеландія",
  "America/Toronto": "Канада", "America/Vancouver": "Канада", "America/Edmonton": "Канада", "America/Winnipeg": "Канада", "America/Halifax": "Канада",
  "America/St_Johns": "Канада", "America/Regina": "Канада", "America/Montreal": "Канада", "America/Mexico_City": "Мексика",
  "America/Sao_Paulo": "Бразилія", "America/Santiago": "Чилі", "America/Bogota": "Колумбія", "America/Lima": "Перу",
  "Africa/Johannesburg": "Південна Африка", "Africa/Cairo": "Єгипет", "Africa/Casablanca": "Марокко", "Africa/Tunis": "Туніс",
  "Africa/Lagos": "Нігерія", "Africa/Nairobi": "Кенія", "UTC": "UTC", "Etc/UTC": "UTC", "Etc/GMT": "UTC"
};
var TZ_PREFIX = [["Australia/", "Австралія"], ["America/Argentina/", "Аргентина"], ["America/Indiana/", "США"], ["America/Kentucky/", "США"],
  ["America/North_Dakota/", "США"], ["America/New_York", "США"], ["America/Chicago", "США"], ["America/Denver", "США"], ["America/Los_Angeles", "США"],
  ["America/Phoenix", "США"], ["America/Anchorage", "США"], ["America/Detroit", "США"], ["America/Boise", "США"], ["Pacific/Honolulu", "США"]];
function region_(tz) {
  if (!tz) return "?";
  if (Object.prototype.hasOwnProperty.call(TZ_COUNTRY, tz)) return TZ_COUNTRY[tz];
  for (var i = 0; i < TZ_PREFIX.length; i++) if (tz.indexOf(TZ_PREFIX[i][0]) === 0) return TZ_PREFIX[i][1];
  return tz;
}
/* Referrer host for grouping: without "www." / "m." / "l." / "lm." (Facebook and others wrap outgoing links that way). */
function refHost_(r) { return r ? r.replace(/^(www|m|l|lm|mobile)\./, "") : ""; }

/* ================================ Maintenance ================================ */

/* Deletes rows older than CFG.KEEP_DAYS (rows are in time order, so it is one deleteRows call). Run it from the editor or with a
   time-driven trigger (README.md). Not callable by anybody else: a signed-in user who is not the owner is refused. */
function cleanupOldHits() {
  var a = "";
  try { a = String(Session.getActiveUser().getEmail() || "").toLowerCase(); } catch (x) {}
  if (a && !isOwner_()) throw new Error("forbidden");
  var sh = sheet_(false);
  if (!sh || sh.getLastRow() < 2) return 0;
  var limit = Date.now() - CFG.KEEP_DAYS * 864e5, times = sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues(), n = 0;
  while (n < times.length && time_(times[n][0]) < limit) n++;
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try { if (n > 0) sh.deleteRows(2, n); } finally { lock.releaseLock(); }
  return n;
}

/* ================================ Small helpers ================================ */

function text_(s) { return ContentService.createTextOutput(s).setMimeType(ContentService.MimeType.TEXT); }
function has_(m, k) { return typeof k === "string" && Object.prototype.hasOwnProperty.call(m, k); }
function str_(x, max) {
  if (typeof x === "string") return x.slice(0, max);
  if (typeof x === "number" && isFinite(x)) return String(x).slice(0, max);
  return "";
}
function int_(x, min, max) {
  var n = typeof x === "number" ? x : typeof x === "string" && /^\d{1,7}$/.test(x) ? Number(x) : NaN;
  if (!isFinite(n)) return "";
  return Math.max(min, Math.min(max, Math.round(n)));
}
/* Free text (event values): no control characters, no markup brackets, never starts like a spreadsheet formula. */
function safeText_(s) {
  return String(s).replace(/[\u0000-\u001f\u007f-\u009f<>]+/g, " ").replace(/\s+/g, " ").trim().replace(/^[=+\-@'\s]+/, "");
}
function utf8Len_(s) {
  var n = 0;
  for (var i = 0; i < s.length; i++) {
    var c = s.charCodeAt(i);
    n += c < 0x80 ? 1 : c < 0x800 ? 2 : c >= 0xd800 && c <= 0xdbff ? (i++, 4) : 3;
  }
  return n;
}
function time_(x) {
  if (Object.prototype.toString.call(x) === "[object Date]") return x.getTime();
  return typeof x === "string" ? Date.parse(x) : NaN;
}
function num_(x) { var n = Number(x); return isFinite(n) && n > 0 ? n : 0; }
function map_() { return Object.create(null); }
function inc_(m, k, n) { m[k] = (m[k] || 0) + (n == null ? 1 : n); }
function top_(m, n) {
  return Object.keys(m).map(function (k) { return [k, m[k]]; })
    .sort(function (a, b) { return b[1] - a[1] || (a[0] < b[0] ? -1 : 1); }).slice(0, n);
}
/* Rows [key, count, …] of a group, most frequent first (then by the second number, then by key). */
function list_(m, fn) {
  return Object.keys(m).map(function (k) { return fn(k, m[k]); })
    .sort(function (a, b) { return b[1] - a[1] || (b[2] || 0) - (a[2] || 0) || (a[0] < b[0] ? -1 : 1); }).slice(0, 25);
}
/* JSON for a <script> block of the template: "<" and line separators escaped, so stored text can never close the script. */
function json_(o) {
  return JSON.stringify(o).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
}
