// SEO build for the ClayAway site (run with Bun from the project root: bun scripts/build_seo.mjs)
//
// Why: the interactive rules guide renders with JavaScript; search engines rank plain HTML best.
// This script turns docs/rules/data/<key>.js into static, indexable pages:
//   docs/rules/<key>/index.html      Ukrainian
//   docs/rules/en/<key>/index.html   English
// with canonical + hreflang, Open Graph, JSON-LD (WebPage, BreadcrumbList, FAQPage), and writes docs/sitemap.xml.
// Indexing policy (CLAUDE.md): rules pages and the trainer are indexable; specs (concept, rules-spec)
// and the demo tours stay noindex. Links to FITASC are always rel="nofollow noopener noreferrer".
import { mkdirSync, writeFileSync, readFileSync } from "fs";

const BASE = "https://fenix-112323.github.io/clayaway/";
const TODAY = new Date().toISOString().slice(0, 10);
globalThis.window = {};
await import("../docs/rules/data/sporting.js");
await import("../docs/rules/data/compak.js");
const BOOKS = Object.fromEntries(window.RULES.map(b => [b.key, b]));

const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const NAMES = { sporting: "Sporting", compak: "Compak Sporting" };
const TXT = {
  uk: {
    title: d => `Правила ${d} FITASC простими словами — ClayAway`,
    h1: d => `Правила ${d} простими словами`,
    desc: (d, n, f) => `Правила ${d} FITASC українською: ${n} пунктів за розділами і ${f} відповідей на часті питання — положення рушниці, No Bird, відмови, протести, перестрілки. З посиланням на сторінку офіційного PDF.`,
    lead: "Наш переказ офіційного регламенту FITASC простими словами: розділ за розділом, з номером пункту і посиланням на сторінку PDF. Терміни англійською, як їх кажуть на стенді.",
    ask: "Запитати про правила", trainer: "Перевірити себе в тренажері", other: "Інша мова", faq: "Часті питання", toc: "Зміст", part: "Частина", ch: "Розділ",
    src: "Джерело", ed: "Редакція", off: "Офіційний PDF FITASC", pdf: "PDF, стор.",
    disc: "Це неофіційний переказ для зручності спортсменів ClayArena. Правила належать FITASC; у разі розбіжностей чинним є лише офіційний текст FITASC.",
    crumbs: ["ClayAway", "Правила FITASC"], updated: "Оновлено"
  },
  en: {
    title: d => `FITASC ${d} rules in plain English — ClayAway`,
    h1: d => `${d} rules in plain words`,
    desc: (d, n, f) => `FITASC ${d} rules explained: ${n} rule points by chapter and ${f} answers to common questions — gun position, No Bird, malfunctions, appeals, shoot-offs. Each linked to the official PDF page.`,
    lead: "Our plain-language summary of the official FITASC rulebook, chapter by chapter, with the rule reference and a link to the PDF page.",
    ask: "Ask about the rules", trainer: "Test yourself in the trainer", other: "Інша мова", faq: "Common questions", toc: "Contents", part: "Part", ch: "Chapter",
    src: "Source", ed: "Edition", off: "Official FITASC PDF", pdf: "PDF, p.",
    disc: "This is an unofficial summary for ClayArena shooters. The rules belong to FITASC; if anything differs, only the official FITASC text applies.",
    crumbs: ["ClayAway", "FITASC rules"], updated: "Updated"
  }
};
const urlOf = (lang, key) => BASE + (lang === "uk" ? `rules/${key}/` : `rules/en/${key}/`);
const NF = 'rel="nofollow noopener noreferrer" target="_blank"';

const CSS = `:root{color-scheme:dark;--bg:#030712;--surface:rgba(255,255,255,.04);--line:rgba(255,255,255,.1);--ink:#F3F4F6;--soft:#D1D5DB;--muted:#9CA3AF;--em:#34D399;--primary:#059669}
*{box-sizing:border-box}html,body{margin:0}body{background:var(--bg);color:var(--ink);font:16px/1.65 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
a{color:var(--em)}.wrap{max-width:1080px;margin:0 auto;padding-inline:16px;padding-block:20px 72px;display:grid;grid-template-columns:240px minmax(0,1fr);gap:40px}
@media(max-width:860px){.wrap{grid-template-columns:1fr}.toc{position:static!important;max-height:none!important}}
header{border-bottom:1px solid var(--line)}header .in{max-width:1080px;margin:0 auto;padding:10px 16px;display:flex;gap:12px;align-items:center;flex-wrap:wrap}
.logo{background:#000;border-radius:8px;padding:2px 11px;font-weight:700;text-decoration:none}.logo b{background:linear-gradient(90deg,#34D399,#22D3EE);-webkit-background-clip:text;background-clip:text;color:transparent}
nav.crumbs{font-size:13px;color:var(--muted)}nav.crumbs a{color:var(--muted)}
.toc{position:sticky;top:16px;align-self:start;max-height:calc(100vh - 32px);overflow:auto;font-size:13.5px}.toc a{display:block;color:var(--soft);text-decoration:none;padding:3px 0 3px 10px;border-left:2px solid var(--line)}.toc a:hover{border-left-color:var(--em);color:#fff}
.toc .p{font-size:11.5px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--muted);margin:12px 0 4px}
main{min-width:0}h1{font-size:clamp(28px,4.5vw,42px);line-height:1.1;margin:8px 0 10px}h2{font-size:23px;margin:34px 0 10px}h2 small{display:block;font-size:12px;color:var(--muted);letter-spacing:.05em;text-transform:uppercase}
h3{font-size:17px;margin:20px 0 4px}.ref{font-size:12.5px;color:var(--muted)}p,li{color:var(--soft);max-width:72ch}li::marker{color:var(--em)}
.cta{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0}.btn{border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.05);border-radius:10px;padding:8px 14px;font-weight:600;font-size:14px;text-decoration:none;color:var(--ink)}.btn.primary{background:var(--primary);border-color:var(--primary);color:#fff}
.src{font-size:13px;color:var(--muted)}article.item{border-top:1px solid var(--line);padding-top:4px}.faq details{border-top:1px solid var(--line);padding:9px 0}.faq summary{cursor:pointer;font-weight:600}
.disc{margin-top:40px;padding:12px 14px;border:1px solid var(--line);border-radius:12px;font-size:12.5px;color:var(--muted)}`;

function page(key, lang) {
  const b = BOOKS[key], T = TXT[lang], d = NAMES[key], o = lang === "uk" ? "en" : "uk";
  const items = b.sections.flatMap(s => s.items);
  const url = urlOf(lang, key), title = T.title(d), desc = T.desc(d, items.length, b.faq.length);
  const tx = (x, k) => x[`${k}_${lang}`] || x[`${k}_en`] || "";
  const ld = [
    { "@context": "https://schema.org", "@type": "WebPage", name: title, description: desc, url, inLanguage: lang, dateModified: TODAY,
      isPartOf: { "@type": "WebSite", name: "ClayAway · ClayArena", url: BASE },
      isBasedOn: { "@type": "CreativeWork", name: b.source.doc_title, author: { "@type": "Organization", name: "FITASC" }, url: b.source.url } },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: T.crumbs[0], item: BASE },
      { "@type": "ListItem", position: 2, name: T.crumbs[1], item: BASE + "rules/" },
      { "@type": "ListItem", position: 3, name: d, item: url }] },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: b.faq.map(f => ({ "@type": "Question", name: tx(f, "q"), acceptedAnswer: { "@type": "Answer", text: tx(f, "a") } })) }
  ];
  const parts = [...new Set(b.sections.map(s => s.part))];
  const html = `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="index, follow, max-image-preview:large">
<link rel="canonical" href="${url}">
<link rel="alternate" hreflang="uk" href="${urlOf("uk", key)}">
<link rel="alternate" hreflang="en" href="${urlOf("en", key)}">
<link rel="alternate" hreflang="x-default" href="${urlOf("en", key)}">
<meta property="og:type" content="article"><meta property="og:site_name" content="ClayAway · ClayArena">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}"><meta property="og:image" content="${BASE}og/rules.png">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:type" content="image/png">
<meta property="og:locale" content="${lang === "uk" ? "uk_UA" : "en_GB"}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${BASE}og/rules.png">
<meta name="theme-color" content="#030712">
<link rel="icon" type="image/png" href="${BASE}og/favicon.png">
${ld.map(x => `<script type="application/ld+json">${JSON.stringify(x)}</script>`).join("\n")}
<style>${CSS}</style>
</head>
<body>
<header><div class="in"><a class="logo" href="${BASE}rules/#${key}"><b>ClayArena</b></a>
<nav class="crumbs" aria-label="Breadcrumbs"><a href="${BASE}rules/">${T.crumbs[1]}</a> › ${esc(d)}</nav>
<span style="flex:1"></span><a class="btn" href="${urlOf(o, key)}" hreflang="${o}">${o === "uk" ? "Українською" : "English"}</a></div></header>
<div class="wrap">
<nav class="toc" aria-label="${T.toc}">${parts.map(p => `<div class="p">${T.part} ${esc(p)}</div>` + b.sections.filter(s => s.part === p).map(s => `<a href="#${s.id}">${s.chapter ? s.chapter + ". " : ""}${esc(tx(s, "title"))}</a>`).join("")).join("")}<div class="p">FAQ</div><a href="#faq">${T.faq}</a></nav>
<main>
<div class="src">FITASC · ${esc(d)}</div>
<h1>${esc(T.h1(d))}</h1>
<p>${T.lead}</p>
<p class="src">${T.src}: <a href="${esc(b.source.url)}" ${NF}>${T.off} ↗</a> · ${T.ed}: ${esc(b.source.edition)} · ${T.updated}: ${TODAY}</p>
<div class="cta"><a class="btn primary" href="${BASE}rules/#${key}">${T.ask}</a><a class="btn" href="${BASE}rules/trainer/#${key}">${T.trainer}</a></div>
${b.sections.map(s => `<section id="${s.id}"><h2><small>${T.part} ${esc(s.part)}${s.chapter ? " · " + T.ch + " " + s.chapter : ""}</small>${esc(tx(s, "title"))}</h2>
${s.items.map(it => `<article class="item" id="${it.id}"><h3>${esc(tx(it, "title"))}</h3><div class="ref">${esc(it.ref || "")} · <a href="${esc(b.source.url)}#page=${it.page}" ${NF}>${T.pdf} ${it.page}</a></div>
<p>${esc(tx(it, "summary"))}</p>${(it["points_" + lang] || []).length ? `<ul>${it["points_" + lang].map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}</article>`).join("\n")}
</section>`).join("\n")}
<section id="faq" class="faq"><h2>${T.faq}</h2>${b.faq.map(f => `<details><summary>${esc(tx(f, "q"))}</summary><p>${esc(tx(f, "a"))}</p></details>`).join("\n")}</section>
<div class="disc">${T.disc}</div>
</main></div>
</body>
</html>`;
  const dir = lang === "uk" ? `docs/rules/${key}` : `docs/rules/en/${key}`;
  mkdirSync(dir, { recursive: true });
  writeFileSync(`${dir}/index.html`, html);
  return url;
}

const urls = [BASE + "rules/", BASE + "rules/trainer/"];
for (const key of Object.keys(BOOKS)) for (const lang of ["uk", "en"]) urls.push(page(key, lang));
writeFileSync("docs/sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${u}</loc><lastmod>${TODAY}</lastmod></url>`).join("\n")}
</urlset>
`);
writeFileSync("docs/robots.txt", `User-agent: *\nAllow: /\nSitemap: ${BASE}sitemap.xml\n`);
console.log("pages", urls.length, urls.join("\n"));
