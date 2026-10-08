// SEO build for the ClayArena projects site (rules, trainer, glossary, academies; ClayAway tours) (run with Bun from the project root: bun scripts/build_seo.mjs)
//
// Why: the interactive rules guide renders with JavaScript; search engines rank plain HTML best.
// This script turns docs/rules/data/<key>.js into static, indexable pages:
//   docs/rules/<key>/index.html      Ukrainian
//   docs/rules/en/<key>/index.html   English
// with canonical + hreflang, Open Graph, JSON-LD (WebPage, BreadcrumbList, FAQPage), and writes docs/sitemap.xml.
// Indexing policy (CLAUDE.md): the FITASC rules retelling (guide, rule pages, categories, trainer) stays noindex and out
// of the sitemap until FITASC gives permission (FITASC_INDEX at the top); the glossary and the Academy are indexable;
// specs (concept, rules-spec) and the demo tours stay noindex. Links to FITASC are always rel="nofollow noopener noreferrer".
// Also generated here for every page: FITASC trade marks in names/titles/meta (tm), a © ClayArena + privacy/legal/contacts
// footer line (legal), and noindex redirect stubs for glossary ids merged into another id (aliases.json).
// The ClayArena Academy (content/academy/ → docs/learn/, /<lang>/learn/, redirect stubs, sitemap-learn-<lang>.xml) is built by
// scripts/build_academy.mjs, called from here FIRST: its errors stop the whole build (nothing is written), and the glossary pages
// link to its lessons ("Де вивчити"). The old learn pages of build_seo*.mjs and scripts/build_interpreter*.py are retired.
// Usage: bun scripts/build_seo.mjs [--out <dir>] [--skip-academy] [--quiet]
//   --out <dir>       write the site into another folder (a copy of docs/ for a test build; data is read from the repo)
//   --skip-academy    build the rest of the site although the Academy has blocking errors (its files on disk stay unchanged)
//   --draft           full-site preview with the Academy draft lessons (only together with --out; never into docs/)
//   -h, --help        print the flags and exit; any other unknown option stops with an error before anything is built
import { readdirSync, mkdirSync, writeFileSync, readFileSync, existsSync } from "fs";
import { BASE, LANGS, esc, tm, legal } from "./site_common.mjs";
import { buildAcademy, minifySims } from "./build_academy.mjs";

// ⚠⚠ FITASC_INDEX — the FITASC rules retelling (guide, rule pages UA/EN, categories, trainer) stays `noindex` and out of the sitemap
// and llms.txt until FITASC gives WRITTEN permission (CLAUDE.md, rules-spec "Легальність контенту"). Only the project owner sets it
// to true. ONE switch: the Academy lessons with index:"fitasc" and the Practice game "referees-call" follow it too
// (scripts/build_academy.mjs reads this line).
const FITASC_INDEX = false;
const ARGS = process.argv.slice(2), argVal = k => { const i = ARGS.indexOf(k); return i >= 0 ? ARGS[i + 1] : undefined; };
// Only the flags above are accepted: -h / --help print them, any other unknown option (a typo) or "--out" without a folder stops
// here, before anything is built — it never falls through to a real build into docs/ (review 08.10.2026).
{ const HELP = "bun scripts/build_seo.mjs [--out <dir>] [--skip-academy] [--quiet] [--draft]   (without --out it WRITES INTO docs/)";
  if (ARGS.includes("-h") || ARGS.includes("--help")) { console.log(HELP); process.exit(0); }
  for (let i = 0; i < ARGS.length; i++) {
    if (ARGS[i] === "--out") { if (i + 1 >= ARGS.length || /^--?[a-z]/i.test(ARGS[i + 1])) { console.error("ERROR: --out needs a folder. Nothing was built.\n" + HELP); process.exit(1); } i++; continue; }
    if (!["--skip-academy", "--quiet", "--draft"].includes(ARGS[i])) { console.error(`ERROR: unknown option ${ARGS[i]}. Nothing was built.\n` + HELP); process.exit(1); }
  } }
const DOCS = (argVal("--out") || "docs").replace(/\\/g, "/").replace(/\/$/, ""); // site root to write (default docs)
const SKIP_ACADEMY = ARGS.includes("--skip-academy");
const TODAY = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Bratislava" }).format(new Date()); // project time zone (CLAUDE.md)
globalThis.window = {};
await import("../docs/rules/data/sporting.js");
// Term labels (owner rule 08.10.2026): a professional term named as a label is "English (local)" in every language, English only on
// English pages. ONE helper for the browser and the builds: docs/shared/terms.js (window.ClayTerms). Here: glossary headwords, titles,
// breadcrumbs, index lists and related terms (uk here, other languages in build_seo_i18n.mjs) and the term links of the rule pages.
await import("../docs/shared/terms.js");
const CT = window.ClayTerms;
await import("../docs/rules/data/compak.js");
const BOOKS = Object.fromEntries(window.RULES.map(b => [b.key, b]));

const NAMES = { sporting: "Sporting™", compak: "Compak® Sporting" };
// esc(), tm() (FITASC trade marks in names and meta) and legal() (© ClayArena footer line, audit W-03): scripts/site_common.mjs
// Display name of a glossary term: data field `display_term` (glossary.js) or the headword with the marks added.
// The plain `term` stays for sorting, pronunciation (ClaySpeak) and JSON-LD alternateName.
const dispTerm = t => t.display_term || tm(t.term);
// Titles longer than ~65 characters get cut in search results (audit W-07): fall back to "<name> | <site part>".
const fitTitle = (full, short) => full.length <= 65 ? full : short;
// FITASC marks in meta descriptions — safety net (audit legal-02). tm() marks "Sporting" and "Compak" only as whole words, so a
// glossary definition with a declined form ("w Compaku", "a Sportingban", "Sportingo varžybų lygis") would reach the meta and
// og:description without ™/®. The definitions themselves are written with the mark in its base form ("w Sporting™ i Compak® Sporting",
// "Sporting™ varžybų lygis"); when one slips through, tmMeta() adds the mark right after the stem and joins the ending with a hyphen
// ("Compak®-u", "Sporting™-ban", the usual way to decline a marked name in hu/fi) and the build prints a WARNING with the words,
// so the editor can rewrite that definition in docs/glossary/data/i18n/<lang>.js. Left alone, as in tm(): lower-case "sporting"
// (the generic word, e.g. English sporting of the CPSA), "English Sporting", "Sporting Clays" (NSCA) and the "Sporting…" of
// "Compak® Sporting…" (the ® already marks that name). Production: the same rule in the server template of the glossary pages.
const TM_META_RE = /(?<![\p{L}\p{M}\p{N}])(Compak|Sporting)(?![®™])([\p{L}\p{M}]+)/gu;
const tmMetaHits = new Map(); // declined form → first page path where it was marked (for the WARNING at the end of the build)
const tmMeta = (s, where = "") => tm(s).replace(TM_META_RE, (w, stem, end, i, all) => {
  if (stem === "Sporting" && /(?:Compak®[ -]|English )$/.test(all.slice(Math.max(0, i - 8), i))) return w;
  if (!tmMetaHits.has(w)) tmMetaHits.set(w, where);
  return `${stem}${stem === "Compak" ? "®" : "™"}-${end}`;
});
// Short meta descriptions (audit D-31): add the page context so the snippet says what the page is. Cut at 300 characters first,
// then mark (a cut "Compak" at the end still gets its ®).
const fitDesc = (d, ctx, where) => tmMeta((d.length < 110 ? `${d} ${ctx}` : d).slice(0, 300), where);
const TXT = {
  uk: {
    title: d => `Правила ${d} FITASC простими словами — ClayArena`,
    h1: d => `Правила ${d} простими словами`,
    desc: (d, n, f) => `Правила ${d} FITASC українською: ${n} пунктів за розділами і ${f} відповідей на часті питання — положення рушниці, No Bird, відмови, протести, перестрілки. З посиланням на сторінку офіційного PDF.`,
    lead: "Наш переказ офіційного регламенту FITASC простими словами: розділ за розділом, з номером пункту і посиланням на сторінку PDF. Терміни англійською, як їх кажуть на стенді.",
    ask: "Запитати про правила", trainer: "Перевірити себе в тренажері", other: "Інша мова", faq: "Часті питання", toc: "Зміст", part: "Частина", ch: "Розділ",
    src: "Джерело", ed: "Редакція", off: "Офіційний PDF FITASC", pdf: "PDF, стор.",
    disc: "Це неофіційний переказ для зручності спортсменів ClayArena. Правила належать FITASC; у разі розбіжностей чинним є лише офіційний текст FITASC. Parcours de Chasse – Sporting™ і Compak® Sporting — торговельні марки FITASC.",
    crumbs: ["ClayArena", "Правила FITASC"], updated: "Оновлено"
  },
  en: {
    title: d => `FITASC ${d} rules in plain English — ClayArena`,
    h1: d => `${d} rules in plain words`,
    desc: (d, n, f) => `FITASC ${d} rules explained: ${n} rule points by chapter and ${f} answers to common questions — gun position, No Bird, malfunctions, appeals, shoot-offs. Each linked to the official PDF page.`,
    lead: "Our plain-language summary of the official FITASC rulebook, chapter by chapter, with the rule reference and a link to the PDF page.",
    ask: "Ask about the rules", trainer: "Test yourself in the trainer", other: "Other language", faq: "Common questions", toc: "Contents", part: "Part", ch: "Chapter",
    src: "Source", ed: "Edition", off: "Official FITASC PDF", pdf: "PDF, p.",
    disc: "This is an unofficial summary for ClayArena shooters. The rules belong to FITASC; if anything differs, only the official FITASC text applies. Parcours de Chasse – Sporting™ and Compak® Sporting are trademarks of FITASC.",
    crumbs: ["ClayArena", "FITASC rules"], updated: "Updated"
  }
};
const urlOf = (lang, key) => BASE + (lang === "uk" ? `rules/${key}/` : `rules/en/${key}/`);
const NF = 'rel="nofollow noopener noreferrer" target="_blank"';

const CSS = `:root{color-scheme:dark;--bg:#030712;--surface:rgba(255,255,255,.04);--line:rgba(255,255,255,.1);--ink:#F3F4F6;--soft:#D1D5DB;--muted:#9CA3AF;--em:#34D399;--primary:#059669}
*{box-sizing:border-box}html,body{margin:0}body{background:var(--bg);color:var(--ink);font:16px/1.65 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
a{color:var(--em)}.wrap{max-width:1080px;margin:0 auto;padding-inline:16px;padding-block:20px 72px;display:grid;grid-template-columns:240px minmax(0,1fr);gap:40px}
@media(max-width:860px){.wrap{grid-template-columns:1fr}.toc{position:static!important;max-height:220px!important;border:1px solid var(--line);border-radius:12px;padding:6px 10px}}
header{border-bottom:1px solid var(--line)}header .in{max-width:1080px;margin:0 auto;padding:10px 16px;display:flex;gap:12px;align-items:center;flex-wrap:wrap}
nav.crumbs{font-size:13px;color:var(--muted)}nav.crumbs a{color:var(--muted)}
.toc{position:sticky;top:16px;align-self:start;max-height:calc(100vh - 32px);overflow:auto;font-size:13.5px}.toc a{display:block;color:var(--soft);text-decoration:none;padding:3px 0 3px 10px;border-left:2px solid var(--line)}.toc a:hover{border-left-color:var(--em);color:#fff}
.toc .p{font-size:11.5px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--muted);margin:12px 0 4px}
main{min-width:0}h1{font-size:clamp(28px,4.5vw,42px);line-height:1.1;margin:8px 0 10px}h2{font-size:23px;margin:34px 0 10px}h2 small{display:block;font-size:12px;color:var(--muted);letter-spacing:.05em;text-transform:uppercase}
h3{font-size:17px;margin:20px 0 4px}.ref{font-size:12.5px;color:var(--muted)}p,li{color:var(--soft);max-width:72ch}li::marker{color:var(--em)}
.cta{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0}.btn{border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.05);border-radius:10px;padding:8px 14px;font-weight:600;font-size:14px;text-decoration:none;color:var(--ink)}.btn.primary{background:var(--primary);border-color:var(--primary);color:#fff}
.src{font-size:13px;color:var(--muted)}article.item{border-top:1px solid var(--line);padding-top:4px}.faq details{border-top:1px solid var(--line);padding:9px 0}.faq summary{cursor:pointer;font-weight:600}
.disc{margin-top:40px;padding:12px 14px;border:1px solid var(--line);border-radius:12px;font-size:12.5px;color:var(--muted)}
.legal{margin:14px 0 0;font-size:12px;color:var(--muted)}.legal a{color:var(--muted)}
nav.crumbs{font-size:14px;display:flex;flex-wrap:wrap;gap:4px 7px;align-items:center}nav.crumbs a{color:var(--soft);text-decoration:none;min-height:32px;display:inline-flex;align-items:center}nav.crumbs a:hover{color:#fff;text-decoration:underline}nav.crumbs [aria-current]{color:var(--ink);font-weight:600}
a:focus-visible,summary:focus-visible{outline:2px solid var(--em);outline-offset:2px;border-radius:6px}
details.langs{position:relative;font-size:13px}details.langs summary{cursor:pointer;list-style:none;border:1px solid var(--line);border-radius:999px;padding:4px 12px;min-height:34px;display:inline-flex;align-items:center;gap:6px;color:var(--soft)}details.langs summary::-webkit-details-marker{display:none}details.langs summary::after{content:"▾";font-size:11px}
details.langs[open] summary{border-color:var(--em);color:#fff}details.langs nav{position:absolute;right:0;top:calc(100% + 6px);z-index:35;background:#0B1120;border:1px solid var(--line);border-radius:12px;padding:6px;display:grid;min-width:170px;box-shadow:0 10px 30px rgba(0,0,0,.5)}
details.langs nav a{color:var(--soft);text-decoration:none;padding:8px 10px;border-radius:8px;min-height:40px;display:flex;align-items:center}details.langs nav a:hover{background:rgba(255,255,255,.06);color:#fff}details.langs nav a[aria-current]{color:var(--em);font-weight:700}
@media (pointer:coarse){details.langs nav a,details.langs summary,.btn{min-height:44px}}`;
// ---------------------------------------------------------------------------------------------------
// Navigation of the generated pages (owner decision 07.10.2026; one naming table: docs/shared/nav.js, ClayNav):
// - no second ClayArena logo: the ONE logo is in the project bar (nav.js); the page header starts with the SECTION as a
//   breadcrumb («📘 Правила FITASC › Sporting™», «📖 Глосарій › <term>»), localised aria-label, aria-current on the last crumb;
// - ONE language switcher everywhere (langSwitch): native names ("Українська", "English", "Deutsch" …), the current language
//   with aria-current, links to the same page, data-setlang (nav.js stores the visitor language). Glossary pages list every
//   language that has the term (the uk/en pages get the full list from build_seo_i18n.mjs, between <!-- langs --> markers);
// - links into the rules guide and the trainer carry ?lang and data-vl: nav.js puts the visitor language into ?lang.
// Production: the clayarena.com page template renders the same crumbs and the site's language menu.
const LANG_NAME = { en: "English", uk: "Українська", de: "Deutsch", fr: "Français", it: "Italiano", cs: "Čeština", pl: "Polski", pt: "Português", hu: "Magyar", fi: "Suomi", lt: "Lietuvių" };
const BREAD = { en: "Breadcrumbs", uk: "Навігаційний ланцюжок", de: "Navigationspfad", fr: "Fil d'Ariane", it: "Percorso di navigazione", cs: "Drobečková navigace", pl: "Ścieżka nawigacji", pt: "Caminho de navegação", hu: "Morzsamenü", fi: "Murupolku", lt: "Naršymo kelias" };
const LANGW = { en: "Language", uk: "Мова", de: "Sprache", fr: "Langue", it: "Lingua", cs: "Jazyk", pl: "Język", pt: "Língua", hu: "Nyelv", fi: "Kieli", lt: "Kalba" };
// crumbs(lang, icon, [{label, url?}]): the last item is the current page (aria-current="page")
const crumbs = (lang, icon, items) => `<nav class="crumbs" aria-label="${BREAD[lang] || BREAD.en}"><span aria-hidden="true">${icon}</span>${items.map((x, i) => (i ? '<span aria-hidden="true">›</span>' : "")
  + (i === items.length - 1 ? `<span aria-current="page">${esc(x.label)}</span>` : `<a href="${x.url}"${x.vl ? " data-vl" : ""}>${esc(x.label)}</a>`)).join("")}</nav>`;
// langSwitch(cur, [{l, url}]): disclosure «🌐 Українська ▾» with the languages in the order of LANGS (works without JS)
const langSwitch = (cur, items) => { const list = LANGS.map(l => items.find(x => x.l === l)).filter(Boolean);
  return `<details class="langs"><summary lang="${cur}"><span aria-hidden="true">🌐</span> ${LANG_NAME[cur]}<span class="sr" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)"> · ${LANGW[cur]}</span></summary><nav aria-label="${LANGW[cur]}">${list.map(x => `<a href="${x.url}" hreflang="${x.l}" lang="${x.l}" data-setlang="${x.l}"${x.l === cur ? ' aria-current="true"' : ""}>${LANG_NAME[x.l]}</a>`).join("")}</nav></details>`; };

function page(key, lang) {
  const b = BOOKS[key], T = TXT[lang], d = NAMES[key], o = lang === "uk" ? "en" : "uk";
  const items = b.sections.flatMap(s => s.items);
  const url = urlOf(lang, key), title = T.title(d), desc = T.desc(d, items.length, b.faq.length);
  const tx = (x, k) => x[`${k}_${lang}`] || x[`${k}_en`] || "";
  const ld = [
    { "@context": "https://schema.org", "@type": "WebPage", name: title, description: desc, url, inLanguage: lang, dateModified: TODAY,
      isPartOf: { "@type": "WebSite", name: "ClayArena", url: BASE },
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
<meta property="og:type" content="article"><meta property="og:site_name" content="ClayArena">
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
<header><div class="in">${crumbs(lang, "📘", [{ label: T.crumbs[1], url: `${BASE}rules/?lang=${lang}#${key}`, vl: 1 }, { label: d }])}
<span style="flex:1"></span>${langSwitch(lang, [{ l: lang, url }, { l: o, url: urlOf(o, key) }])}</div></header>
<div class="wrap">
<nav class="toc" aria-label="${T.toc}">${parts.map(p => `<div class="p">${T.part} ${esc(p)}</div>` + b.sections.filter(s => s.part === p).map(s => `<a href="#${s.id}">${s.chapter ? s.chapter + ". " : ""}${esc(tx(s, "title"))}</a>`).join("")).join("")}<div class="p">FAQ</div><a href="#faq">${T.faq}</a></nav>
<main>
<div class="src">FITASC · ${esc(d)}</div>
<h1>${esc(T.h1(d))}</h1>
<p>${T.lead}</p>
<p class="src">${T.src}: <a href="${esc(b.source.url)}" ${NF}>${T.off} ↗</a> · ${T.ed}: ${esc(b.source.edition)} · ${T.updated}: ${TODAY}</p>
<div class="cta"><a class="btn primary" data-vl href="${BASE}rules/?lang=${lang}#${key}">${T.ask}</a><a class="btn" data-vl href="${BASE}rules/trainer/?lang=${lang}#${key}">🎯 ${T.trainer}</a></div>
${b.sections.map(s => `<section id="${s.id}"><h2><small>${T.part} ${esc(s.part)}${s.chapter ? " · " + T.ch + " " + s.chapter : ""}</small>${esc(tx(s, "title"))}</h2>
${s.items.map(it => `<article class="item" id="${it.id}"><h3>${esc(tx(it, "title"))}</h3><div class="ref">${esc(it.ref || "")} · <a href="${esc(b.source.url)}#page=${it.page}" ${NF}>${T.pdf} ${it.page}</a></div>
<p>${esc(tx(it, "summary"))}</p>${(it["points_" + lang] || []).length ? `<ul>${it["points_" + lang].map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}${globalThis.termLinks ? globalThis.termLinks(it, lang) : ""}</article>`).join("\n")}
</section>`).join("\n")}
<section id="faq" class="faq"><h2>${T.faq}</h2>${b.faq.map(f => `<details><summary>${esc(tx(f, "q"))}</summary><p>${esc(tx(f, "a"))}</p></details>`).join("\n")}</section>
<div class="disc">${T.disc}</div>${legal(lang)}
</main></div>
</body>
</html>`;
  const dir = lang === "uk" ? `${DOCS}/rules/${key}` : `${DOCS}/rules/en/${key}`;
  mkdirSync(dir, { recursive: true });
  writeFileSync(`${dir}/index.html`, html);
  return url;
}

// ---------------------------------------------------------------------------------------------------
// ClayArena glossary (part of ClayArena, built from the rules guide only — NOT from the separate Academy).
// Data: docs/glossary/data/glossary.js (window.GLOSSARY.terms) + aliases.json (rule-item term id → canonical id).
// Output: docs/glossary/index.html and docs/glossary/<id>/index.html (Ukrainian with English, DefinedTerm),
// and term links under every rule item on the static rules pages (see termLinks()).
let GLOSS = null, ALIAS = {};
try {
  await import("../docs/glossary/data/glossary.js");
  GLOSS = window.GLOSSARY;
  ALIAS = JSON.parse(readFileSync("docs/glossary/data/aliases.json", "utf8"));
} catch (e) { console.log("glossary data not found yet — skipping glossary pages"); }
const GBY = GLOSS ? Object.fromEntries(GLOSS.terms.map(t => [t.id, t])) : {};
// One concept = one id (audit G-06). A merged duplicate id lives on only in aliases.json (old id → canonical id):
// lessons, Interpreter Academy missions and rule items that still use the old id are resolved here, and the old page
// URL becomes a noindex redirect stub (see redirectStubs() at the end). An id that exists in the glossary is never remapped.
try { await import("../docs/glossary/data/learn_terms.js"); } catch (e) { /* not written yet */ }
const KNOWN = new Set([...Object.keys(GBY), ...((window.GLOSSARY_LEARN || {}).terms || []).map(t => t.id)]);
const rid = id => KNOWN.has(id) ? id : (ALIAS[id] && KNOWN.has(ALIAS[id]) ? ALIAS[id] : id);
// Ukrainian pages are Ukrainian only: English text lives on /en/... (linked via the "English" button + hreflang).
// Glossary category names in Ukrainian (data keeps the English key `cat`).
const CAT_UK = { "Appeals": "Протести", "Discipline": "Дисципліна", "Equipment": "Спорядження", "Ground & layout": "Майданчик і стенди",
  "Organisation": "Організація", "Penalties": "Покарання", "Refereeing": "Суддівство", "Results": "Результати", "Safety & conduct": "Безпека і поведінка",
  "Scoring": "Зарахування", "Sequences & doubles": "Послідовності й дуплети", "Shooting rules": "Правила стрільби", "Targets": "Мішені", "Academy": "Академія",
  "Ammunition": "Набої", "ClayArena": "ClayArena", "Competition": "Змагання", "Gun": "Рушниця", "Juniors": "Юніори", "Technique": "Техніка", "Training": "Тренування", "Travel": "Подорожі", "Interpreting": "Робота перекладача" };
// Rule reference in Ukrainian: "Розділ 18 · <item title_uk>" (r.ref in the data is the English PDF heading).
const refUk = r => { const b = BOOKS[r.book]; const sec = b && b.sections.find(s => s.items.some(x => x.id === r.id)); const it = sec && sec.items.find(x => x.id === r.id);
  return it ? `Розділ ${sec.chapter} · ${it.title_uk}` : r.ref.replace(/^Chapter (\d+)/, "Розділ $1"); };
// termLinks(item, lang): HTML links from a rule item to its glossary terms (deduplicated through aliases).
globalThis.termLinks = (it, lang) => {
  if (!GLOSS) return "";
  const ids = [...new Set((it.terms || []).map(t => ALIAS[t] || t).filter(id => GBY[id]))];
  if (!ids.length) return "";
  return `<div class="ref">${lang === "uk" ? "Терміни" : "Terms"}: ${ids.map(id => `<a href="${BASE}${lang === "uk" ? "" : "en/"}glossary/${id}/">${termHtml(lang, GBY[id])}</a>`).join(" · ")}</div>`;
};
function glossaryPages() {
  if (!GLOSS) return [];
  const out = [];
  const css = CSS + `.box{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:12px 14px;margin:10px 0}.list{columns:3 220px;column-gap:24px}.list a{display:block;padding:2px 0;text-decoration:none;color:var(--soft)}`;
  const shell = (title, desc, url, ld, body, name, enUrl) => `<!doctype html>
<html lang="uk">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="index, follow, max-image-preview:large">
<link rel="canonical" href="${url}">
<meta property="og:type" content="article"><meta property="og:site_name" content="ClayArena">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}"><meta property="og:image" content="${BASE}og/glossary.png">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:type" content="image/png">
<meta property="og:locale" content="uk_UA"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${BASE}og/glossary.png">
<meta name="theme-color" content="#030712"><link rel="icon" type="image/png" href="${BASE}og/favicon.png">
${ld.map(x => `<script type="application/ld+json">${JSON.stringify(x)}</script>`).join("\n")}
<style>${css}</style>
</head>
<body>
<header><div class="in">${crumbs("uk", "📖", name ? [{ label: "Глосарій", url: `${BASE}glossary/` }, { label: name }] : [{ label: "Глосарій" }])}<span style="flex:1"></span><a class="btn" data-vl href="${BASE}rules/?lang=uk">📘 Правила FITASC</a>
<!-- langs -->${langSwitch("uk", [{ l: "uk", url }, { l: "en", url: enUrl }])}<!-- /langs --></div></header>
<main style="max-width:900px;margin:0 auto;padding:20px 16px 72px">${body}
<div class="disc">Глосарій ClayArena побудовано на нашому переказі регламентів FITASC. Чинним є лише офіційний текст FITASC. Parcours de Chasse – Sporting™ і Compak® Sporting — торговельні марки FITASC.</div>${legal("uk")}</main>
</body></html>`;
  const SET = { "@type": "DefinedTermSet", name: "ClayArena clay shooting glossary", url: BASE + "glossary/" };
  for (const t of GLOSS.terms) {
    const url = `${BASE}glossary/${t.id}/`, name = dispTerm(t), lb = termLabel("uk", t); // lb.label = "Rabbit (заєць)"
    // <title> at most 65 characters (audit W-07): the full title, else "label | site", else "English | site" (the h1 and og:title keep the label)
    const title = fitTitle(`${lb.label} — термін стендової стрільби | Глосарій ClayArena`, fitTitle(`${lb.label} | Глосарій ClayArena`, `${lb.head} | Глосарій ClayArena`));
    const desc = fitDesc(tm(`${t.term}: ${t.short_uk}`), "Термін стендової стрільби — глосарій ClayArena.", `glossary/${t.id}/`);
    const refs = (t.rule_refs || []).map(r => `<li><a href="${BASE}rules/${r.book}/#${r.id}">${esc(refUk(r))}</a> · ${NAMES[r.book]} · <a href="${esc(BOOKS[r.book].source.url)}#page=${r.page}" ${NF}>PDF, с. ${r.page}</a></li>`).join("");
    const disc = ["sporting", "compak"].filter(k => t.disciplines && t.disciplines[k]).map(k => `<div class="box"><b>${NAMES[k]}</b><p>${esc(t.disciplines[k])}</p></div>`).join("");
    const rel = (t.related || []).map(rid).filter(r => GBY[r] && r !== t.id).map(r => `<a class="btn" style="padding:3px 10px;font-size:13px" href="${BASE}glossary/${r}/">${termHtml("uk", GBY[r])}</a>`).join(" ");
    // "Де вивчити": Academy lessons that teach the term (final ids through id-map.json; old pages until they are replaced)
    const learn = ACADEMY.learnLinks(t.id, "uk").slice(0, 6).map(x => `<li><a href="${esc(x.url)}">${esc(x.title)}</a> · ${esc(x.context)}</li>`).join("");
    const body = `<div class="src">${esc(CAT_UK[t.cat] || t.cat)}</div><h1>${termHtml("uk", t)}</h1>${t.aka?.length ? `<p class="ref">Також: ${esc(t.aka.join(", "))}</p>` : ""}
<h2>Що це</h2><p><b>${esc(t.short_uk)}</b></p>
${t.long_uk ? `<h2>Детально</h2><p>${esc(t.long_uk)}</p>` : ""}
${disc ? `<h2>У Sporting™ і Compak® Sporting</h2>${disc}` : ""}
${ukUsage(t) ? `<h2>Як кажуть українською</h2><p>${esc(ukUsage(t))}</p>` : ""}
${refs ? `<h2>Де це в правилах</h2><ul>${refs}</ul>` : ""}
${t.source_url ? `<p class="ref">Джерело: <a href="${esc(t.source_url)}" ${NF}>FITASC ↗</a>${t.source_url.includes("categories") ? ` · <a href="${BASE}rules/categories/">Категорії FITASC</a>` : ""}</p>` : ""}
${learn ? `<h2>Де вивчити</h2><ul>${learn}</ul>` : ""}
${rel ? `<h2>Повʼязані терміни</h2><p>${rel}</p>` : ""}`;
    const ld = [{ "@context": "https://schema.org", "@type": "DefinedTerm", name, alternateName: [...new Set([t.term, ...(t.aka || []), lb.local].filter(Boolean))].filter(a => a !== name), description: tmMeta(t.short_uk, `glossary/${t.id}/`), termCode: t.id, url, inDefinedTermSet: SET, inLanguage: "uk" },
      { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Глосарій", item: BASE + "glossary/" }, { "@type": "ListItem", position: 2, name: lb.label, item: url }] }];
    mkdirSync(`${DOCS}/glossary/${t.id}`, { recursive: true });
    writeFileSync(`${DOCS}/glossary/${t.id}/index.html`, shell(title, desc, url, ld, body, lb.label, `${BASE}en/glossary/${t.id}/`));
    out.push(url);
  }
  const cats = [...new Set(GLOSS.terms.map(t => t.cat))];
  const listBody = `<div class="src">ClayArena</div><h1>Глосарій стендової стрільби</h1><p>${GLOSS.terms.length} термінів Sporting™ і Compak® Sporting англійською — з поясненнями українською і посиланнями на пункти правил FITASC.</p>
${cats.map(c => `<h2>${esc(CAT_UK[c] || c)}</h2><div class="list">${GLOSS.terms.filter(t => t.cat === c).sort((a, b) => a.term.localeCompare(b.term)).map(t => `<a href="${BASE}glossary/${t.id}/">${termHtml("uk", t)}</a>`).join("")}</div>`).join("\n")}`;
  writeFileSync(`${DOCS}/glossary/index.html`, shell(`Глосарій стендової стрільби — ${GLOSS.terms.length} термінів | ClayArena`, `Терміни Sporting™ і Compak® Sporting англійською з поясненнями українською і посиланнями на правила FITASC.`, BASE + "glossary/",
    [{ "@context": "https://schema.org", ...SET, hasDefinedTerm: GLOSS.terms.map(t => ({ "@type": "DefinedTerm", name: dispTerm(t), url: `${BASE}glossary/${t.id}/` })) }], listBody, null, `${BASE}en/glossary/`));
  return [BASE + "glossary/", ...out];
}

// ---------------------------------------------------------------------------------------------------
// ClayArena Academy — ONE Academy for everybody: content/academy/ → scripts/build_academy.mjs (pages /learn/…, /<lang>/learn/…,
// data, redirect stubs, sitemap-learn-<lang>.xml). It runs before anything is written: its errors stop the whole build.
// --skip-academy runs its checks without writing (the Academy files on disk stay as they are). Its lessons give the glossary
// pages their "Де вивчити" links (ACADEMY.learnLinks: final ids through id-map.json; old pages until they are replaced).
const ACADEMY = await buildAcademy({ out: DOCS, fitascIndex: FITASC_INDEX, write: !SKIP_ACADEMY, quiet: ARGS.includes("--quiet"), draft: ARGS.includes("--draft") });
if (!ACADEMY.ok && !SKIP_ACADEMY) {
  console.error("\nSTOP: the Academy has blocking errors (listed above), nothing was written. Fix them (or set the lesson back to status \"draft\"),"
    + "\nor run `bun scripts/build_seo.mjs --skip-academy` to build the rest of the site without touching the Academy.");
  process.exit(1);
}
// Academy terms that are not in the glossary data yet (`new_terms` of lessons) get a thin uk/en entry, so every term chip of a lesson
// has a page. Such a lesson is not published (build error "new-terms-left") until the term is in learn_terms.js (+ i18n).
if (GLOSS) for (const n0 of ACADEMY.newTerms) {
  const n = { ...n0, id: rid(n0.id) }; // a merged duplicate id goes to its canonical entry (aliases.json)
  if (GBY[n.id]) continue;
  const t = { id: n.id, term: n.term, aka: [], cat: "Academy", short_uk: n.short_uk, short_en: n.short_en, long_uk: "", long_en: "", related: [], rule_refs: [], source: "academy" };
  GLOSS.terms.push(t); GBY[n.id] = t;
}
// Full entries for the lesson terms (docs/glossary/data/learn_terms.js, window.GLOSSARY_LEARN) replace thin entries or are added.
try { await import("../docs/glossary/data/learn_terms.js"); } catch (e) { /* not written yet */ }
if (GLOSS && window.GLOSSARY_LEARN) for (const full of window.GLOSSARY_LEARN.terms) {
  const t = GBY[full.id];
  if (!t) { const n = { ...full, source: "glossary" }; GLOSS.terms.push(n); GBY[full.id] = n; continue; }
  Object.assign(t, full, { source: "academy" });
}
// TRANSITION SAFETY NET (delete after the switch-over release): a thin Academy term that the lessons no longer list would turn its
// published glossary page into a redirect stub. While the frozen old Academy sources exist, such a term is kept from there and
// listed in a warning: move it into docs/glossary/data/learn_terms.js (+ i18n) and this block finds nothing. The old sources were
// moved out of docs/ (not published any more) to archive/legacy-docs/learn/data/ on 08.10.2026 (owner decision: the site names no
// other clay discipline; those files still did) — see archive/legacy-docs/README.md.
const LEGACY_LEARN = "archive/legacy-docs/learn/data";
if (GLOSS && existsSync(LEGACY_LEARN)) {
  window.LEARN = []; const kept = [];
  for (const f of readdirSync(LEGACY_LEARN).filter(f => f.endsWith(".js") && !/^law/.test(f))) { try { await import(`../${LEGACY_LEARN}/${f}`); } catch (e) { /* frozen source */ } }
  for (const m of window.LEARN || []) for (const l of m.lessons || []) for (const n0 of l.new_terms || []) {
    const id = rid(n0.id), page = `${DOCS}/glossary/${id}/index.html`;
    if (GBY[id] || !existsSync(page) || /http-equiv="refresh"/.test(readFileSync(page, "utf8"))) continue; // only terms whose page is live now
    const t = { id, term: n0.term, aka: [], cat: "Academy", short_uk: n0.short_uk, short_en: n0.short_en, long_uk: "", long_en: "", related: [], rule_refs: [], source: "academy-legacy" };
    GLOSS.terms.push(t); GBY[id] = t; kept.push(id);
  }
  if (kept.length) console.log(`WARNING: ${kept.length} glossary terms are kept only through the frozen old Academy sources (archive/legacy-docs/learn/data): add them to learn_terms.js (+ i18n) before the switch-over: ${kept.join(", ")}`);
}
// Ukrainian usage: researched local forms (docs/glossary/data/i18n/uk.js: term_local + alt, conf) win over the older uk_usage text.
try { await import("../docs/glossary/data/i18n/uk.js"); } catch (e) {}
// termLabel(lang, t): {en, local, label, head} of glossary entry t in lang (docs/shared/terms.js; the FITASC marks through tm()); head =
// the English part alone as the page shows it ("Attempt to influence"; the last fallback of a long <title>). termHtml: the same as HTML,
// "<span lang=en>English</span> (local)". English pages: English only. The i18n files of the other languages are loaded by
// build_seo_i18n.mjs before it uses them; uk is loaded just below.
const termLabel = (lang, t) => { const n = CT.of(t, (((window.GLOSSARY_I18N || {})[lang] || {}).terms || {})[t.id], lang, { en: dispTerm(t), mark: tm });
  return { ...n, head: CT.label(n.en, "", lang) }; };
const termHtml = (lang, t) => { const n = termLabel(lang, t); return CT.html(n.en, n.local, lang, esc); };
const ukUsage = t => { const x = ((window.GLOSSARY_I18N || {}).uk || {terms: {}}).terms[t.id];
  if (x && x.term_local && x.conf !== "low") return [x.term_local, ...(x.alt || [])].filter(v => v !== t.term).slice(0, 3).map(v => `«${v}»`).join(", ");
  return t.uk_usage && t.uk_usage !== "—" ? t.uk_usage : ""; };
// Build check (audit G-06): one concept = one id. Two ids with the same headword give two pages with one title.
{ const seen = {}; for (const t of GLOSS ? GLOSS.terms : []) (seen[t.term.trim().toLowerCase()] ||= []).push(t.id);
  const dup = Object.entries(seen).filter(([, ids]) => ids.length > 1);
  if (dup.length) console.log("WARNING: the same glossary term under several ids — merge them and add the old id to aliases.json:", dup.map(([k, ids]) => `${k}: ${ids.join(", ")}`).join("; ")); }

// ---------------------------------------------------------------------------------------------------
// FITASC age categories (not in the discipline rulebooks; source: fitasc.com/competitions/categories).
// Data: docs/rules/data/categories.js (window.FITASC_CATEGORIES). Output: docs/rules/categories/index.html.
// The weekly checker (scripts/fitasc_check.py) watches the source page for changes.
// FITASC category id (categories.js) → glossary id (the names and their local words come from the glossary, not from categories.js)
const CAT_GLOSS = { men: "men-category", master: "master-category" };
// the FITASC French name only when it is another word, not the English with accents ("Dame", "Homme"; not "Vétéran", "Junior")
const frOwn = c => { const f = s => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim(); return !!c.name_fr && f(c.name_fr) !== f(c.name_en); };
function categoriesPage() {
  try { /* loaded below */ } catch (e) {}
  const C = window.FITASC_CATEGORIES; if (!C) return [];
  const url = BASE + "rules/categories/";
  const title = "Категорії FITASC: Junior, Lady, Men, Senior, Veteran, Master — вік | ClayArena";
  const desc = `Хто такий Junior, Lady, Senior, Veteran і Master у Sporting™ і Compak® Sporting: вікові межі FITASC з ${C.valid_from.split("-").reverse().join(".")}, правила національних команд.`;
  // the category name is the glossary term label (docs/shared/terms.js, owner rule 08.10.2026): "Lady (жінки)", "Junior"; the FITASC
  // French name is added only when it differs from the English ("фр. Dame"). The glossary is the one source of the names (CAT_GLOSS).
  const rows = C.categories.map(c => { const g = GBY[CAT_GLOSS[c.id] || c.id];
    return `<tr><td><b>${g ? termHtml("uk", g) : esc(c.name_en)}</b>${frOwn(c) ? ` <span class="ref">· фр. ${esc(c.name_fr)}</span>` : ""}</td><td>${c.to_age ? `${c.from_age}–${c.to_age}` : `${c.from_age}+`}</td><td>${esc(c.rule_uk)}</td></tr>`; }).join("");
  const teams = (C.teams || []).map(t => `<tr><td><b>${esc(t.team)}</b></td><td>${esc(t.eligible_uk)}</td><td>${esc(String(t.size || ""))}</td><td>${esc(t.note_uk || "")}</td></tr>`).join("");
  const faq = C.categories.map(c => ({ "@type": "Question", name: `Хто такий ${c.name_en} у стендовій стрільбі (FITASC)?`, acceptedAnswer: { "@type": "Answer", text: c.rule_uk } }));
  const ld = [{ "@context": "https://schema.org", "@type": "WebPage", name: title, description: desc, url, inLanguage: "uk", isBasedOn: { "@type": "WebPage", name: "FITASC — Catégories, limites d'âge", url: C.source_url } },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq }];
  const html = `<!doctype html>
<html lang="uk">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="index, follow, max-image-preview:large">
<link rel="canonical" href="${url}">
<meta property="og:type" content="article"><meta property="og:site_name" content="ClayArena">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}"><meta property="og:image" content="${BASE}og/rules.png">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:type" content="image/png">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${BASE}og/rules.png">
<meta name="theme-color" content="#030712"><link rel="icon" type="image/png" href="${BASE}og/favicon.png">
${ld.map(x => `<script type="application/ld+json">${JSON.stringify(x)}</script>`).join("\n")}
<style>${CSS}table{border-collapse:collapse;width:100%;font-size:14.5px}td,th{border-bottom:1px solid var(--line);padding:9px 10px;text-align:left;vertical-align:top}th{color:var(--muted);font-size:12px;text-transform:uppercase}.tw{overflow-x:auto;border:1px solid var(--line);border-radius:12px}</style>
</head>
<body>
<header><div class="in">${crumbs("uk", "📘", [{ label: "Правила FITASC", url: `${BASE}rules/?lang=uk`, vl: 1 }, { label: "Категорії" }])}<span style="flex:1"></span>${langSwitch("uk", [{ l: "uk", url }, { l: "en", url: BASE + "rules/en/categories/" }])}</div></header>
<main style="max-width:900px;margin:0 auto;padding:20px 16px 72px">
<div class="src">FITASC · Sporting™ · Compak® Sporting</div>
<h1>Категорії FITASC: хто такий Junior, Lady, Senior, Veteran, Master</h1>
<p>Вікові категорії однакові для Parcours de Chasse – Sporting™ і Compak® Sporting. Діють з ${C.valid_from.split("-").reverse().join(".")}. Значення має лише <b>рік</b> народження, а не день і місяць. Національні й клубні змагання можуть мати власні категорії — дивіться програму змагань.</p>
<h2>Категорії і вік</h2><div class="tw"><table><thead><tr><th>Категорія</th><th>Вік</th><th>Правило</th></tr></thead><tbody>${rows}</tbody></table></div>
${teams ? `<h2>Національні команди</h2><div class="tw"><table><thead><tr><th>Команда</th><th>Хто може</th><th>Склад</th><th>Примітка</th></tr></thead><tbody>${teams}</tbody></table></div>` : ""}
${(C.notes_uk || []).length ? `<ul>${C.notes_uk.map(n => `<li>${esc(n)}</li>`).join("")}</ul>` : ""}
<p class="src">Джерело: <a href="${esc(C.source_url)}" ${NF}>FITASC — Catégories, limites d'âge ↗</a> · ${TODAY}</p>
<div class="cta"><a class="btn primary" data-vl href="${BASE}rules/?lang=uk">📘 Правила FITASC</a><a class="btn" href="${BASE}glossary/">📖 Глосарій</a><a class="btn" href="${BASE}learn/">🎓 Академія ClayArena</a></div>
<div class="disc">Наш переказ офіційних категорій FITASC. Чинним є лише текст FITASC. Parcours de Chasse – Sporting™ і Compak® Sporting — торговельні марки FITASC.</div>${legal("uk")}
</main></body></html>`;
  mkdirSync(`${DOCS}/rules/categories`, { recursive: true });
  writeFileSync(`${DOCS}/rules/categories/index.html`, html);
  return [url];
}
try { await import("../docs/rules/data/categories.js"); } catch (e) { console.log("categories data not found yet"); }

const urls = [BASE + "rules/", BASE + "rules/trainer/"];
urls.push(...categoriesPage());
for (const key of Object.keys(BOOKS)) for (const lang of ["uk", "en"]) urls.push(page(key, lang));
urls.push(...glossaryPages());
// /interpreter/ (the old Interpreter Academy app) is a noindex forwarder to the Academy's interpreter route now
// (docs/interpreter/index.html, design §5.2 group E): it is not listed in the sitemap.
// The Academy lessons and the old Interpreter Academy pages that still exist are in the Academy sitemaps (sitemap-learn-<lang>.xml).
// English versions of the glossary and categories + hreflang on both languages (scripts/build_seo_en.mjs).
globalThis.SEO = { BASE, TODAY, DOCS, BOOKS, NAMES, GLOSS, GBY, ACADEMY, CSS, NF, esc, tm, tmMeta, dispTerm, fitTitle, fitDesc, legal, rid, ALIAS, crumbs, langSwitch, LANG_NAME, termLabel, termHtml, frOwn };
const { buildEnglish } = await import("./build_seo_en.mjs");
urls.push(...buildEnglish());
// Glossary in the other ClayArena languages (when translations exist) (scripts/build_seo_i18n.mjs).
const { buildI18n } = await import("./build_seo_i18n.mjs");
urls.push(...(await buildI18n()));
// Redirect stubs for merged duplicate ids (audit G-06): an old glossary URL that is still on disk but is no longer a term
// becomes a tiny noindex page that sends visitors (and search engines, via canonical) to the canonical term of the same
// language. Not in the sitemap. Production: answer these old URLs with an HTTP 301 instead.
function redirectStubs() {
  const done = [];
  const bases = ["glossary", ...readdirSync(DOCS, { withFileTypes: true }).filter(e => e.isDirectory() && /^[a-z]{2}$/.test(e.name)).map(e => `${e.name}/glossary`)];
  for (const base of bases) {
    const dir = `${DOCS}/${base}`; if (!existsSync(dir)) continue;
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (!e.isDirectory() || e.name === "data" || GBY[e.name]) continue;
      const to = rid(e.name), target = GBY[to] && existsSync(`${dir}/${to}/index.html`) ? `${BASE}${base}/${to}/` : `${BASE}${base}/`;
      const lang = base === "glossary" ? "uk" : base.split("/")[0];
      writeFileSync(`${dir}/${e.name}/index.html`, `<!doctype html>
<html lang="${lang}"><head><meta charset="utf-8"><title>ClayArena</title><meta name="robots" content="noindex, follow"><link rel="canonical" href="${target}"><meta http-equiv="refresh" content="0; url=${target}"></head><body><p><a href="${target}">${target}</a></p></body></html>
`);
      done.push(`${base}/${e.name}`);
    }
  }
  if (done.length) console.log("glossary redirect stubs (merged or removed ids):", done.join(" "));
}
redirectStubs();
// FITASC rules retelling (guide, rule pages UA/EN, categories, trainer) stays `noindex` and out of the sitemap
// until FITASC gives written permission (see CLAUDE.md and rules-spec, "Легальність контенту"). The switch FITASC_INDEX is at the top.
if (!FITASC_INDEX) {
  const walk = d => readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? (e.name === "data" ? [] : walk(`${d}/${e.name}`)) : e.name === "index.html" ? [`${d}/${e.name}`] : []);
  for (const f of walk(`${DOCS}/rules`)) writeFileSync(f, readFileSync(f, "utf8").replace(/<meta name="robots" content="[^"]*">/, '<meta name="robots" content="noindex, follow">'));
  urls.splice(0, urls.length, ...urls.filter(u => !u.startsWith(BASE + "rules/")));
}
// Sitemaps (design §5.1): docs/sitemap.xml is a sitemap INDEX — sitemap-site.xml (rules, glossary, …: the pages of this script) and one
// sitemap-learn-<lang>.xml per language from the Academy build (with --skip-academy: the Academy sitemaps already on disk).
writeFileSync(`${DOCS}/sitemap-site.xml`, `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${u}</loc><lastmod>${TODAY}</lastmod></url>`).join("\n")}
</urlset>
`);
const SITEMAPS = ["sitemap-site.xml", ...(SKIP_ACADEMY ? readdirSync(DOCS).filter(f => /^sitemap-learn-[a-z]{2}\.xml$/.test(f)).sort() : ACADEMY.sitemaps)];
writeFileSync(`${DOCS}/sitemap.xml`, `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${SITEMAPS.map(f => `  <sitemap><loc>${BASE}${f}</loc><lastmod>${TODAY}</lastmod></sitemap>`).join("\n")}
</sitemapindex>
`);
// ClayArena project bar (docs/shared/nav.js): one navigation for every page of every project; added here so new pages get it too.
// The animations: every page loads docs/shared/sims.min.js, the minified copy of docs/shared/sims.js (the one source, with the
// comments for the team; review 08.10.2026: 160 KB with comments, ≈ 76 KB minified). It is written here too (the Academy build writes
// it as well; with --skip-academy it would be stale), and every <script src="…shared/sims.js"> of a page (hand-written ones such as
// docs/learn/index.html and docs/rules/trainer/index.html, older generated pages) is pointed at it. Every page that loads the
// animations also loads docs/shared/terms.js (the term labels of the tabs and the lead-lab methods) right before them.
{
  const sm = minifySims(); mkdirSync(`${DOCS}/shared`, { recursive: true }); writeFileSync(`${DOCS}/shared/sims.min.js`, sm.code);
  if (!sm.minified) console.log("WARNING: docs/shared/sims.min.js is an unminified copy of docs/shared/sims.js (run this build with Bun)");
  const SIMS_SRC_RE = /(<script\b[^>]*\bsrc="[^"]*shared\/)sims\.js"/g;
  const walk = d => readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? (["data", "src", "shared", "og"].includes(e.name) ? [] : walk(`${d}/${e.name}`)) : e.name.endsWith(".html") ? [`${d}/${e.name}`] : []);
  for (const f of walk(DOCS)) {
    const rp = f.slice(DOCS.length + 1); // path inside the site root
    let h = readFileSync(f, "utf8"); const depth = rp.split("/").length - 1, rel = depth ? "../".repeat(depth) : "";
    if (h.includes('http-equiv="refresh"')) continue; // redirect stubs stay bare
    let changed = false;
    { const h2 = h.replace(SIMS_SRC_RE, '$1sims.min.js"'); if (h2 !== h) { h = h2; changed = true; } } // the minified animations
    if (h.includes("shared/sims.min.js") && !h.includes("shared/terms.js")) { // the term helper before the animations, same defer
      const h2 = h.replace(/<script\b([^>]*?)\bsrc="([^"]*?)shared\/sims\.min\.js"([^>]*)><\/script>/, (m, a, pre, b) => `<script${a}src="${pre}shared/terms.js"${b}></script>\n${m}`);
      if (h2 !== h) { h = h2; changed = true; } }
    if (!h.includes("shared/nav.js")) { h = h.replace("</head>", `<script src="${rel}shared/nav.js" defer></script>\n</head>`); changed = true; }
    // Glossary term pages (all languages): English pronunciation + the shared animation for target / pair / lead terms
    // (docs/shared/sims.js → sims.min.js, TERM_SIMS decides which terms get one; other terms get an empty, invisible host).
    const gm = rp.match(/^(?:([a-z]{2})\/)?glossary\/([a-z0-9-]+)\/index\.html$/);
    if (gm && !h.includes("data-clay-term")) {
      const id = gm[2], term = (GBY[id] || {}).term || id, ui = gm[1] ? "English" : "Вимова англійською";
      h = h.replace(/<\/h1>/, `</h1><p><button class="btn" type="button" onclick="ClaySpeak(${JSON.stringify(term).replace(/"/g, "&quot;")})" title="en-GB">🔊 ${ui}</button></p>`);
      const first = h.indexOf("<h2>"), second = first >= 0 ? h.indexOf("<h2>", first + 4) : -1;
      if (second > 0) h = h.slice(0, second) + `<div data-clay-term="${id}"></div>\n` + h.slice(second);
      h = h.replace("</body>", `<script src="${rel}shared/terms.js"></script><script src="${rel}shared/sims-text.js"></script><script src="${rel}shared/sims.min.js"></script><script>ClaySims.auto()</script>\n</body>`);
      changed = true;
    }
    if (changed) writeFileSync(f, h);
  }
}
writeFileSync(`${DOCS}/robots.txt`, `User-agent: *\nAllow: /\nSitemap: ${BASE}sitemap.xml\n`);
if (!ARGS.includes("--quiet")) console.log("pages", urls.length, urls.join("\n"));
console.log(`sitemap index: ${SITEMAPS.join(", ")} · site pages ${urls.length} · Academy URLs ${Object.values(ACADEMY.urls || {}).reduce((n, a) => n + a.length, 0)}${SKIP_ACADEMY ? " (Academy skipped: not written)" : ""}`);
// Safety net of tmMeta() (audit legal-02): declined FITASC marks it had to mark in glossary meta descriptions. The pages are correct,
// but the definition should say the mark in its base form: rewrite it in docs/glossary/data/i18n/<lang>.js (or glossary.js / learn_terms.js).
if (tmMetaHits.size) console.log(`WARNING: glossary meta descriptions with a declined FITASC mark (marked as "Compak®-…" / "Sporting™-…"; write the base form "Sporting™" / "Compak® Sporting" in the definition): ${[...tmMetaHits].map(([w, p]) => `${w} (${p})`).join(", ")}`);
