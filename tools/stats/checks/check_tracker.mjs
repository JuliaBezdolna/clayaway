/* Headless checks of the tracker docs/shared/stats.js (fake window / navigator / document, no network).
   Run from the repo root: bun tools/stats/checks/check_tracker.mjs  (or node). Exit code 1 on any failure. */
import { readFileSync } from "node:fs";
import vm from "node:vm";
const SRC0 = readFileSync(new URL("../../../docs/shared/stats.js", import.meta.url), "utf8");
const EP = "https://script.google.com/macros/s/TEST/exec";
const MARK = 'const STATS_ENDPOINT = "";';
// docs/shared/stats.js carries the live collector address since 07.10.2026. The checks always start from the OFF state (empty endpoint)
// and put the TEST address in themselves, so they never depend on, and never call, the real collector (handover check 09.10.2026).
const SRC = SRC0.replace(/const STATS_ENDPOINT = "[^"]*";/, MARK);
if (!SRC.includes(MARK)) { console.log("FAIL: STATS_ENDPOINT constant not found"); process.exit(1); }
let fails = 0, passes = 0;
const ok = (c, msg) => { if (c) passes++; else { fails++; console.log("FAIL:", msg); } };

function env(o = {}) {
  const sent = [], beacons = [], timers = [], listeners = {}, dlisteners = {};
  const loc = new URL(o.href || "https://fenix-112323.github.io/clayaway/learn/gun-fit/");
  const ctx = {
    console, URL, JSON, Math, String,
    Intl: o.noIntl ? undefined : { DateTimeFormat: () => ({ resolvedOptions: () => ({ timeZone: o.tz || "Europe/Bratislava" }) }) },
    location: { get hostname() { return o.host != null ? o.host : loc.hostname; }, get pathname() { return loc.pathname; }, get protocol() { return loc.protocol; }, get href() { return loc.href; } },
    navigator: Object.assign({ language: "uk-UA", userAgent: "Mozilla/5.0 Chrome/140", doNotTrack: null }, o.nav || {}),
    screen: o.screen || { width: 1920, height: 1080 }, innerWidth: 1200, innerHeight: 800, pageYOffset: 0,
    matchMedia: () => ({ matches: !!o.coarse }),
    setTimeout: f => { timers.push(f); return timers.length; },
    addEventListener: (t, f) => { (listeners[t] = listeners[t] || []).push(f); },
    history: { pushState(s, t, u) { loc.href = new URL(u, loc.href).href; }, replaceState(s, t, u) { loc.href = new URL(u, loc.href).href; } },
    document: {
      currentScript: { src: o.scriptSrc || "https://fenix-112323.github.io/clayaway/shared/stats.js" },
      referrer: o.referrer || "", visibilityState: "visible",
      documentElement: { lang: o.lang || "uk", scrollHeight: 4000, scrollTop: 0 }, body: { scrollHeight: 4000 },
      addEventListener: (t, f) => { (dlisteners[t] = dlisteners[t] || []).push(f); },
    },
  };
  if (!o.noFetch) ctx.fetch = (url, init) => { sent.push({ url, init, hit: JSON.parse(init.body) }); return Promise.resolve({}); };
  ctx.navigator.sendBeacon = (url, body) => { beacons.push({ url, hit: JSON.parse(body) }); return true; };
  if (o.debug) ctx.CLAY_STATS_DEBUG = true;
  vm.createContext(ctx); ctx.window = ctx; ctx.__now = 1000000;
  vm.runInContext("Date.now = () => globalThis.__now;", ctx);
  vm.runInContext(o.endpoint === "" ? SRC : SRC.replace(MARK, `const STATS_ENDPOINT = ${JSON.stringify(o.endpoint || EP)};`), ctx);
  const flush = () => { while (timers.length) timers.shift()(); };
  const fire = (t, e) => (listeners[t] || []).forEach(f => f(e || {}));
  const dfire = t => (dlisteners[t] || []).forEach(f => f({}));
  return { ctx, sent, beacons, flush, fire, dfire, listeners, dlisteners, loc };
}
const nListeners = e => Object.values(e.listeners).flat().length + Object.values(e.dlisteners).flat().length;

// 1. empty endpoint: nothing at all
{ const e = env({ endpoint: "" }); e.ctx.ClayStats.event("route", "beginner"); e.flush();
  ok(e.sent.length === 0 && e.beacons.length === 0, "empty endpoint sends nothing");
  ok(nListeners(e) === 0, "empty endpoint adds no listeners");
  ok(e.ctx.ClayStats.on === false, "empty endpoint: ClayStats.on false");
  ok(e.ctx.history.pushState.toString().includes("loc.href"), "empty endpoint: history untouched"); }
// 2. privacy signals, automation, local hosts
for (const [name, o] of [["DNT navigator", { nav: { doNotTrack: "1" } }], ["DNT window", { winDnt: true }], ["GPC", { nav: { globalPrivacyControl: true } }],
  ["webdriver", { nav: { webdriver: true } }], ["bot UA", { nav: { userAgent: "Mozilla/5.0 (compatible; Googlebot/2.1)" } }],
  ["headless UA", { nav: { userAgent: "HeadlessChrome/140" } }], ["localhost", { href: "http://localhost:8791/learn/" }],
  ["127.0.0.1", { href: "http://127.0.0.1:8791/learn/" }], ["IPv6 loopback [::1]", { href: "http://[::1]:8791/learn/" }],
  ["IPv6 loopback without brackets", { href: "http://[::1]:8791/learn/", host: "::1" }], ["file:", { href: "file:///D:/x/index.html" }], [".test host", { href: "http://clay.test/learn/" }],
  ["bad endpoint", { endpoint: "javascript:alert(1)" }]]) {
  let e;
  if (o.winDnt) { // window.doNotTrack (old Safari / IE): set before the script runs
    e = env({ endpoint: "" }); e.ctx.ClayStats = undefined; e.ctx.doNotTrack = "1";
    vm.runInContext(SRC.replace(MARK, `const STATS_ENDPOINT = "${EP}";`), e.ctx);
  } else e = env(o);
  e.ctx.ClayStats.event("x", "y"); e.dfire("visibilitychange"); e.fire("pagehide"); e.flush();
  ok(e.sent.length === 0 && e.beacons.length === 0 && nListeners(e) === 0 && e.ctx.ClayStats.on === false, "skip: " + name);
}
// 3. localhost with the debug flag sends
{ const e = env({ href: "http://127.0.0.1:8791/learn/", debug: true, scriptSrc: "http://127.0.0.1:8791/shared/stats.js" });
  ok(e.sent.length === 1 && e.sent[0].hit.s === "learn", "debug on localhost sends a view with section learn"); }
// 3b. the go/no-go console check of DEVELOPERS.md §4h: on localhost set the flag, drop ClayStats, load stats.js again → view, then leave
{ const e = env({ href: "http://127.0.0.1:8791/learn/", scriptSrc: "http://127.0.0.1:8791/shared/stats.js" });
  ok(e.sent.length === 0 && e.ctx.ClayStats.on === false, "localhost first load: off");
  vm.runInContext("window.CLAY_STATS_DEBUG = true; delete window.ClayStats;", e.ctx); // the console snippet, run in the page
  e.ctx.document.currentScript = { src: "http://127.0.0.1:8791/shared/stats.js?debug" };
  vm.runInContext(SRC.replace(MARK, `const STATS_ENDPOINT = "${EP}";`), e.ctx);
  ok(e.sent.length === 1 && e.sent[0].hit.t === "view" && e.sent[0].hit.s === "learn", "console check on localhost sends a view");
  e.fire("pagehide"); ok(e.sent.length === 2 && e.sent[1].hit.t === "leave", "console check: leave on closing the tab"); }
// 4. page view from an external referrer, leave hits, events
{ const e = env({ referrer: "https://www.google.com/search?q=clay" });
  const v = e.sent[0];
  ok(e.sent.length === 1 && v.hit.t === "view", "view sent on load");
  ok(v.url === EP && v.init.method === "POST" && v.init.mode === "no-cors" && v.init.keepalive === true && v.init.credentials === "omit", "fetch init: POST no-cors keepalive omit");
  ok(/^text\/plain/.test(v.init.headers["Content-Type"]) && typeof v.init.body === "string", "text/plain JSON string body");
  ok(v.hit.p === "/clayaway/learn/gun-fit/" && v.hit.s === "learn" && v.hit.l === "uk" && v.hit.bl === "uk-UA" && v.hit.tz === "Europe/Bratislava" && v.hit.d === "desktop", "view fields: " + JSON.stringify(v.hit));
  ok(v.hit.r === "www.google.com" && v.hit.v === undefined, "external referrer: host only, not internal");
  const keys = Object.keys(v.hit).sort().join(",");
  ok(keys === "bl,d,l,p,r,s,t,tz", "only whitelisted keys: " + keys);
  ok(!JSON.stringify(v.hit).includes("search?q"), "no referrer path or query leaks");
  e.ctx.__now += 30000; e.ctx.pageYOffset = 1600; e.fire("scroll"); e.flush();
  e.ctx.document.visibilityState = "hidden"; e.dfire("visibilitychange");
  const l = e.sent[1];
  ok(l && l.hit.t === "leave" && l.hit.sec === 30 && l.hit.sc === 60, "leave: sec 30 sc 60 " + JSON.stringify(l && l.hit));
  e.ctx.__now += 100000; e.fire("pagehide");
  ok(e.sent.length === 2, "pagehide right after hidden sends nothing more (hidden time not counted)");
  e.ctx.document.visibilityState = "visible"; e.dfire("visibilitychange"); e.ctx.__now += 12000;
  e.ctx.document.visibilityState = "hidden"; e.dfire("visibilitychange");
  ok(e.sent.length === 3 && e.sent[2].hit.sec === 12 && e.sent[2].hit.sc === undefined, "later leave: incremental sec, no sc");
  e.ctx.ClayStats.event("Lesson_Done!", "gun-fit\n<script>" + "x".repeat(200));
  const ev = e.sent[3].hit;
  ok(ev.t === "event" && ev.e === "lesson_done" && ev.v.length === 80 && !/\n/.test(ev.v), "event name sanitized, value clamped: " + JSON.stringify(ev).slice(0, 120));
  e.ctx.ClayStats.event("", "x"); e.ctx.ClayStats.event("9bad", "x"); e.ctx.ClayStats.event(null);
  ok(e.sent.length === 4, "invalid event names dropped");
  e.ctx.ClayStats.event("speak", 42); ok(e.sent[4].hit.v === "42", "non-string value stringified");
  e.ctx.ClayStats.event("speak"); ok(e.sent[5].hit.v === undefined, "event without value"); }
// 5. same-site referrer → internal view; in-app navigation → leave + internal view
{ const e = env({ referrer: "https://fenix-112323.github.io/clayaway/learn/" });
  ok(e.sent[0].hit.v === "int" && e.sent[0].hit.r === undefined, "same-site referrer: v=int, no r");
  e.ctx.__now += 5000; e.ctx.history.pushState(null, "", "/clayaway/learn/routes/beginner/"); e.flush();
  const [, lv, vw] = e.sent;
  ok(lv && lv.hit.t === "leave" && lv.hit.p === "/clayaway/learn/gun-fit/" && lv.hit.sec === 5, "pushState: leave for the old path");
  ok(vw && vw.hit.t === "view" && vw.hit.p === "/clayaway/learn/routes/beginner/" && vw.hit.v === "int", "pushState: internal view for the new path");
  e.ctx.history.replaceState(null, "", "/clayaway/learn/routes/beginner/?lang=de"); e.flush();
  ok(e.sent.length === 3, "replaceState on the same path: no hit");
  e.ctx.history.pushState(null, "", "/clayaway/learn/routes/beginner/#x"); e.flush();
  ok(e.sent.length === 3, "pushState to the same path (hash): no hit");
  e.loc.href = "https://fenix-112323.github.io/clayaway/learn/"; e.fire("popstate"); e.flush();
  ok(e.sent.length === 5 && e.sent[4].hit.p === "/clayaway/learn/", "popstate: leave + view"); }
// 6. sections
const sec = p => env({ href: "https://fenix-112323.github.io" + p }).sent[0].hit.s;
for (const [p, s] of [["/clayaway/", "home"], ["/clayaway/index.html", "home"], ["/clayaway/learn/", "learn"], ["/clayaway/de/learn/gun-fit/", "learn"],
  ["/clayaway/interpreter/", "learn"], ["/clayaway/glossary/choke/", "glossary"], ["/clayaway/fi/glossary/", "glossary"], ["/clayaway/rules/", "rules"],
  ["/clayaway/rules/en/categories/", "rules"], ["/clayaway/rules/trainer/", "trainer"], ["/clayaway/concept/", "spec"], ["/clayaway/rules-spec/", "spec"],
  ["/clayaway/dornsberg/", "tours"], ["/clayaway/sologne/", "tours"], ["/clayaway/og/x.png", "other"]]) ok(sec(p) === s, `section ${p} → ${sec(p)} (want ${s})`);
{ const e = env({ href: "https://clayarena.example/rules/trainer/", scriptSrc: "https://clayarena.example/shared/stats.js" }); ok(e.sent[0].hit.s === "trainer", "root on another host"); }
// 7. devices, languages
ok(env({ screen: { width: 390, height: 844 }, coarse: true }).sent[0].hit.d === "phone", "phone");
ok(env({ screen: { width: 820, height: 1180 }, coarse: true }).sent[0].hit.d === "tablet", "tablet");
ok(env({ screen: { width: 1366, height: 768 } }).sent[0].hit.d === "desktop", "laptop = desktop");
ok(env({ nav: { language: "fil-PH" } }).sent[0].hit.bl === "fil", "long tag shortened to 2-5 chars");
ok(env({ nav: { language: "de" } }).sent[0].hit.bl === "de", "plain language");
ok(env({ nav: { language: "zh-Hant-TW" } }).sent[0].hit.bl === "zh", "script subtag dropped");
ok(env({ nav: { language: "" } }).sent[0].hit.bl === "", "no language");
ok(env({ noIntl: true }).sent[0].hit.tz === "", "no Intl: empty tz, no throw");
// 8. fallback to sendBeacon when fetch is missing
{ const e = env({ noFetch: true }); ok(e.sent.length === 0 && e.beacons.length === 1 && e.beacons[0].hit.t === "view" && e.beacons[0].url === EP, "sendBeacon fallback"); }
// 9. cap of 300 hits per page
{ const e = env(); for (let i = 0; i < 400; i++) e.ctx.ClayStats.event("speak", "t" + i); ok(e.sent.length === 300, "cap 300 hits, got " + e.sent.length); }
// 10. loaded twice: the second copy does nothing
{ const e = env(); const n = e.sent.length; vm.runInContext(SRC.replace(MARK, `const STATS_ENDPOINT = "${EP}";`), e.ctx); ok(e.sent.length === n, "second load is a no-op"); }
// 11. back/forward cache restore → internal view
{ const e = env(); e.fire("pageshow", { persisted: true }); ok(e.sent.length === 2 && e.sent[1].hit.v === "int", "bfcache restore counts an internal view"); }
// 12. fetch throwing synchronously → beacon fallback, never throws
{ const e = env(); e.ctx.fetch = () => { throw new Error("boom"); }; e.ctx.ClayStats.event("route", "x"); ok(e.beacons.length === 1, "fetch throws → beacon"); }
// 13. no storage, no cookies used
ok(!/localStorage|sessionStorage|document\.cookie|indexedDB/.test(SRC), "no storage or cookie access in stats.js");
console.log(`stats.js: ${passes} passed, ${fails} failed`); process.exit(fails ? 1 : 0);
