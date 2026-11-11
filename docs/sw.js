/* ClayArena · offline (PWA), step 1 (11.11.2026; plan «03 Правила FITASC», wave 4: «на стенді мережі немає»; one service worker for
   all three products — Academy, FITASC rules, glossary). Registered by docs/shared/nav.js (the bar is on every page), scope = the
   site root (/clayaway/ on the preview).

   FRESH FIRST. With a network every request goes to the server, so a new version is seen at once (the preview after a push must
   never show the old page). The saved copy is used only when the network fails, or when the server has not answered within
   WAIT ms and a saved copy exists (a weak signal on the shooting ground); the late answer still updates the copy.
   SAVED: every same-origin page and file the visitor opened (pages: up to MAX_PAGES, files: up to MAX_FILES, oldest dropped),
   plus the PACKS a page asks for (nav.js posts {type:"warm", pack:"rules"} on every rules page: the guide with the search of both
   disciplines and the trainer then work without a network even if only one page was opened).
   NOT SAVED: other sites (FITASC PDF, statistics), non-GET, partial (Range) requests (audio), answers that are not 200.
   OFFLINE, a page never opened: offline.html (what is saved on this device, in the visitor language).

   Updating: change VERSION when PACKS or offline.html change (the old core cache is dropped on activate). To switch the whole
   thing off, replace this file by the "kill switch" at the end of this comment and push: browsers pick it up on their next visit.
     self.addEventListener("install",()=>self.skipWaiting());
     self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.map(n=>caches.delete(n))))
       .then(()=>self.registration.unregister())));
   In production (clayarena.com) this depends on question T-10 to the ClayArena team: may the product sections run a service worker. */
const VERSION = "1";
const CORE = "clayarena-core-" + VERSION, PAGES = "clayarena-pages", FILES = "clayarena-files";
const WAIT = 4000, MAX_PAGES = 400, MAX_FILES = 300;
const BASE = self.registration.scope; // https://juliabezdolna.github.io/clayaway/
const u = p => new URL(p, BASE).href;
const CORE_FILES = ["offline.html", "shared/nav.js", "og/favicon.png"].map(u);
// what a product needs to work offline, beyond the page that was opened (relative to the site root)
const PACKS = {
  rules: ["rules/", "rules/data/sporting.js", "rules/data/compak.js", "rules/terms.js", "shared/rule-terms.js",
    "rules/trainer/", "rules/data/quiz-sporting.js", "rules/data/quiz-compak.js", "shared/terms.js", "shared/sims-text.js",
    "shared/sims.min.js", "rules/categories/", "rules/en/categories/"]
};

self.addEventListener("install", e => { e.waitUntil(caches.open(CORE).then(c => c.addAll(CORE_FILES)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith("clayarena-core-") && k !== CORE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// pack → saved once per VERSION (a missing file is fetched again on the next rules page)
const warming = {};
self.addEventListener("message", e => {
  const d = e.data || {};
  if (d.type === "warm" && PACKS[d.pack] && !warming[d.pack]) {
    warming[d.pack] = (async () => {
      const c = await caches.open(CORE);
      for (const p of PACKS[d.pack]) { const url = u(p); if (await c.match(url)) continue;
        try { const r = await fetch(url, { cache: "no-cache" }); if (r.ok) await c.put(url, r); } catch (err) { /* offline: next time */ } }
    })().finally(() => { warming[d.pack] = null; });
    if (e.waitUntil) e.waitUntil(warming[d.pack]);
  }
});

async function trim(name, max) {
  const c = await caches.open(name), keys = await c.keys();
  for (let i = 0; i < keys.length - max; i++) await c.delete(keys[i]); // oldest first (insertion order)
}
async function saved(req) {
  return (await caches.match(req)) || (await caches.match(req, { ignoreSearch: true })); // /rules/?lang=uk → /rules/
}
function keep(req, res, name, max) {
  if (!res || !res.ok || res.type !== "basic") return;
  const copy = res.clone(), core = res.clone(); // both now: the page reads res right after
  caches.open(name).then(async c => { await c.delete(req); await c.put(req, copy); // re-put = newest
    if (Math.random() < 0.1) trim(name, max); }).catch(() => {});
  // the core pack keeps its own copy fresh too (caches.match() finds the core cache first)
  caches.open(CORE).then(c => c.match(req).then(m => m ? c.put(req, core) : null)).catch(() => {});
}

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || !req.url.startsWith(BASE) || req.headers.has("range")) return;
  if (new URL(req.url).pathname.endsWith("/sw.js")) return;
  const page = req.mode === "navigate";
  e.respondWith((async () => {
    const net = fetch(req).then(res => { keep(req, res, page ? PAGES : FILES, page ? MAX_PAGES : MAX_FILES); return res; });
    const copy = await saved(req);
    if (!copy) {
      try { return await net; }
      catch (err) { if (page) return (await caches.match(u("offline.html"))) || Response.error(); return Response.error(); }
    }
    // a saved copy exists: the network, unless it fails or is slower than WAIT
    let timer;
    const late = new Promise(res => { timer = setTimeout(() => res(copy), WAIT); });
    try { const r = await Promise.race([net, late]); clearTimeout(timer); if (r === copy) e.waitUntil(net.catch(() => {})); return r; }
    catch (err) { clearTimeout(timer); return copy; }
  })());
});
