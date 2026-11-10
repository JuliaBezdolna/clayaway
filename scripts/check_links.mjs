// Broken internal links of the three learning products (Правила FITASC, Глосарій, Академія), run with Bun or Node from the project root:
//   bun scripts/check_links.mjs            every generated page under docs/: links into the site (absolute BASE… or relative)
//   bun scripts/check_links.mjs --rules    only links that point into docs/rules/ (quick check after a rules change)
// A link is broken when its page is not on disk (docs/<path>/index.html or the file itself) or, with an #anchor, when the target page
// has no element with that id. Old anchors of the rules book pages (rules/<book>/#<item id>) count as fine only when the item is
// listed in the book contents (the page sends them to the chapter page, scripts/build_seo.mjs). Links that JavaScript writes at run
// time (the guide /rules/, the trainer) are not seen here. Exit code 1 when something is broken (list of the first 40).
import { readFileSync, readdirSync, statSync, existsSync } from "fs";
import { join, sep, posix } from "path";
import { BASE } from "./site_common.mjs";

const ONLY_RULES = process.argv.includes("--rules");
// pages whose #hash is read by their script (a route, not an element id): only the page itself is checked
const JS_HASH = new Set(["rules/", "rules/trainer/"]);
const files = [];
(function walk(d) { for (const n of readdirSync(d)) { const f = join(d, n); const st = statSync(f);
  if (st.isDirectory()) { if (!["data", "audio", "3d", "node_modules"].includes(n) || d !== "docs") walk(f); } else if (n.endsWith(".html")) files.push(f.split(sep).join("/")); } })("docs");

const idCache = new Map();
const idsOf = file => { if (!idCache.has(file)) { const h = readFileSync(file, "utf8"), s = new Set();
  for (const m of h.matchAll(/\sid="([^"]+)"/g)) s.add(m[1]); for (const m of h.matchAll(/\sname="([^"]+)"/g)) s.add(m[1]); idCache.set(file, s); } return idCache.get(file); };
const target = rel => { const p = rel.replace(/^\/+/, ""); const cand = p === "" || p.endsWith("/") ? `docs/${p}index.html` : `docs/${p}`;
  if (existsSync(cand) && statSync(cand).isFile()) return cand; if (existsSync(`docs/${p}/index.html`)) return `docs/${p}/index.html`; return null; };

let n = 0; const bad = [];
for (const f of files) {
  const html = readFileSync(f, "utf8"), dir = posix.dirname(f.slice("docs/".length));
  for (const m of html.matchAll(/<a\b[^>]*?\shref="([^"]+)"/g)) {
    let u = m[1].replace(/&amp;/g, "&");
    if (/^(mailto:|tel:|javascript:|data:)/.test(u) || /\$\{|' \+|" \+/.test(u)) continue; // templates inside page scripts
    let rel;
    if (u.startsWith(BASE)) rel = u.slice(BASE.length);
    else if (/^[a-z]+:\/\//i.test(u) || u.startsWith("//")) continue;
    else if (u.startsWith("#")) rel = f.slice("docs/".length).replace(/index\.html$/, "") + u;
    else rel = posix.normalize(posix.join(dir, u));
    const [pathQ, hash = ""] = rel.split("#"), path = pathQ.replace(/\?.*$/, "");
    if (hash && JS_HASH.has(path.replace(/index\.html$/, ""))) { n++; if (!target(path)) bad.push(`${f}: ${u} — no page`); continue; }
    if (ONLY_RULES && !path.startsWith("rules/")) continue;
    if (path.startsWith("..")) continue; // above the site root (the preview's own repo links)
    n++;
    const t = target(path);
    if (!t) { bad.push(`${f}: ${u} — no page`); continue; }
    if (hash && !/\.(pdf|png|jpg|svg|mp3|json|js|css)$/i.test(path) && !idsOf(t).has(decodeURIComponent(hash))) bad.push(`${f}: ${u} — no #${hash} on ${t}`);
  }
}
console.log(`internal links checked: ${n}${ONLY_RULES ? " (into docs/rules/)" : ""} in ${files.length} pages — broken: ${bad.length}`);
for (const b of bad.slice(0, 40)) console.log("  " + b);
process.exit(bad.length ? 1 : 0);
