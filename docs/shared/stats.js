/* ClayArena · own anonymous visit statistics: tracker (ES2018, no dependencies, keep < 6 KB). Loaded on every page by
   docs/shared/nav.js. Empty STATS_ENDPOINT = off (sends nothing, listens to nothing). No cookies, no storage ids, no IP, no
   fingerprint: every hit stands alone. Skips DNT/GPC, automation, bots, localhost and file: (unless CLAY_STATS_DEBUG).
   Hits and fields: tools/stats/README.md, DEVELOPERS.md §4h (view v="int" = same-site or in-app navigation, not a visit;
   leave sec = seconds visible since the last leave, sc = max scroll %). fetch with credentials "omit", sendBeacon as fallback.
   PRODUCTION (clayarena.com): ClayArena's own analytics under its privacy policy; keep the event names. */
(function () {
  "use strict";
  const STATS_ENDPOINT = ""; // off in this working copy — see HANDOVER.md §8; collector: Apps Script web app URL ".../exec" (tools/stats/README.md)
  const W = window, D = document, N = W.navigator || {}, noop = () => {}, host = location.hostname;
  if (W.ClayStats) return;
  W.ClayStats = {on: false, event: noop};
  if (!/^https?:\/\//.test(STATS_ENDPOINT)) return;
  if (N.doNotTrack === "1" || N.doNotTrack === "yes" || W.doNotTrack === "1" || N.globalPrivacyControl === true || N.webdriver) return;
  if (/bot|crawl|spider|slurp|headless|lighthouse/i.test(N.userAgent || "")) return;
  if (!W.CLAY_STATS_DEBUG && (location.protocol === "file:" || /^(localhost|127\.0\.0\.1|\[::1\]|::1|)$|\.(localhost|test)$/.test(host))) return;

  // site root = folder of shared/ (as in nav.js): sections work on github.io/clayaway/ and on any other host
  let root = "/";
  try { root = new URL(D.currentScript.src.replace(/shared\/stats\.js.*$/, "")).pathname; } catch (e) {}
  const section = p => {
    const r = p.indexOf(root) === 0 ? p.slice(root.length) : p.slice(1);
    return /^(|index\.html)$/.test(r) ? "home" : /^rules\/trainer\//.test(r) ? "trainer" : /^rules\//.test(r) ? "rules"
      : /^([a-z]{2}\/)?glossary\//.test(r) ? "glossary" : /^(([a-z]{2}\/)?learn|interpreter)\//.test(r) ? "learn"
      : /^(concept|rules-spec)\//.test(r) ? "spec" : /^(dornsberg|sologne)\//.test(r) ? "tours" : "other";
  };
  const m = /^([a-z]{2,3})(?:[-_]([a-z]{2}))?(?![a-z])/i.exec(N.language || "");
  let bl = m ? m[1].toLowerCase() + (m[2] ? "-" + m[2].toUpperCase() : "") : "";
  if (bl.length > 5) bl = m[1].toLowerCase();
  let tz = "", coarse = false;
  try { tz = (Intl.DateTimeFormat().resolvedOptions().timeZone || "").slice(0, 40); } catch (e) {}
  try { coarse = W.matchMedia("(pointer: coarse)").matches; } catch (e) {}
  // device by the short side of the screen; a touch screen up to 1100 px is a tablet
  const sw = Math.min((W.screen || {}).width || 0, (W.screen || {}).height || 0) || W.innerWidth || 0;
  const dev = sw && sw < 600 ? "phone" : coarse && sw < 1100 ? "tablet" : "desktop";
  const hit = (t, p) => ({t, p: p.slice(0, 200), s: section(p), l: (D.documentElement.lang || "").slice(0, 10), bl, tz, d: dev});
  let count = 0;
  const send = o => {
    if (++count > 300) return; // a runaway page never floods the collector
    const body = JSON.stringify(o);
    try {
      if (typeof fetch === "function") {
        fetch(STATS_ENDPOINT, {method: "POST", mode: "no-cors", credentials: "omit", keepalive: true, body,
          headers: {"Content-Type": "text/plain;charset=UTF-8"}}).catch(noop);
        return;
      }
    } catch (e) {}
    try { N.sendBeacon(STATS_ENDPOINT, body); } catch (e) {}
  };

  let path = location.pathname, visMs = 0, since = 0, maxSc = 0, first = true, tq = 0;
  const visible = () => D.visibilityState !== "hidden";
  const scroll = () => { try {
    const de = D.documentElement, bh = Math.max(de.scrollHeight || 0, D.body ? D.body.scrollHeight : 0);
    const pc = bh ? Math.round(Math.min(1, ((W.pageYOffset || de.scrollTop || 0) + (W.innerHeight || 0)) / bh) * 100) : 100;
    if (pc > maxSc) maxSc = pc; } catch (e) {} };
  const view = (int, ref) => {
    const o = hit("view", path);
    if (ref) o.r = ref.slice(0, 100);
    if (int) o.v = "int";
    visMs = 0; maxSc = 0; first = true; since = visible() ? Date.now() : 0;
    send(o); setTimeout(scroll, 1500);
  };
  const leave = () => {
    if (since) { visMs += Date.now() - since; since = 0; }
    const sec = Math.min(21600, Math.round(visMs / 1000));
    visMs = 0;
    if (!first && sec < 1) return;
    scroll();
    const o = hit("leave", path); o.sec = sec;
    if (first) o.sc = maxSc;
    first = false; send(o);
  };
  const moved = () => { if (location.pathname !== path) { leave(); path = location.pathname; view(true); } }; // in-app navigation

  let ref = "", int = false;
  try { if (D.referrer) { const h = new URL(D.referrer).hostname; if (h === host) int = true; else ref = h; } } catch (e) {}
  view(int, ref);
  D.addEventListener("visibilitychange", () => { if (!visible()) leave(); else if (!since) since = Date.now(); });
  W.addEventListener("pagehide", leave);
  W.addEventListener("pageshow", e => { if (e && e.persisted) { path = location.pathname; view(true); } }); // back/forward cache
  W.addEventListener("scroll", () => { if (!tq) tq = setTimeout(() => { tq = 0; scroll(); }, 300); }, {passive: true});
  W.addEventListener("popstate", () => setTimeout(moved, 0));
  try {
    const hs = W.history, push = hs.pushState, repl = hs.replaceState;
    hs.pushState = function () { const r = push.apply(this, arguments); setTimeout(moved, 0); return r; };
    hs.replaceState = function () { const r = repl.apply(this, arguments); path = location.pathname; return r; }; // same view
  } catch (e) {}

  W.ClayStats = {on: true, event(name, value) {
    try {
      const e = String(name == null ? "" : name).toLowerCase().replace(/[^a-z0-9_:-]/g, "").slice(0, 40);
      if (!/^[a-z]/.test(e)) return;
      const o = hit("event", location.pathname); o.e = e;
      if (value != null && value !== "") o.v = String(value).replace(/[\u0000-\u001f\u007f]+/g, " ").trim().slice(0, 80);
      send(o);
    } catch (x) {}
  }};
})();
