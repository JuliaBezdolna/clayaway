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
// Before anything is written, the rules guide and trainer data are checked (scripts/check_rules_data.mjs; errors stop the build).
// Usage: bun scripts/build_seo.mjs [--out <dir>] [--skip-academy] [--quiet]
//   CLAY_BUILD_DATE=YYYY-MM-DD (environment) stamps that date instead of today (reproducible rebuild of a commit)
//   --out <dir>       write the site into another folder (a copy of docs/ for a test build; data is read from the repo);
//                     relative or absolute (it is resolved to an absolute path)
//   --skip-academy    build the rest of the site although the Academy has blocking errors (its files on disk stay unchanged)
//   --draft           full-site preview with the Academy draft lessons (only together with --out; never into docs/)
//   -h, --help        print the flags and exit; any other unknown option stops with an error before anything is built
import { readdirSync, mkdirSync, writeFileSync, readFileSync, existsSync } from "fs";
import { resolve } from "path";
import vm from "node:vm";
import { BASE, LANGS, esc, tm, legal } from "./site_common.mjs";
import { buildAcademy, minifySims } from "./build_academy.mjs";
import { checkRulesData } from "./check_rules_data.mjs";

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
// Absolute: Bun 1.4 on Windows fails mkdirSync("../x/y", {recursive: true}) on an existing folder with EEXIST, so a relative --out
// ("--out ../site") crashed after ~2 min with a half-written folder (handover check 09.10.2026).
const DOCS = resolve(argVal("--out") || "docs").replace(/\\/g, "/"); // site root to write (default docs)
const SKIP_ACADEMY = ARGS.includes("--skip-academy");
// Build date stamped into the pages (sitemap <lastmod>, JSON-LD dateModified, "updated" on the rule pages, "generated" in the data):
// today in the project time zone (CLAUDE.md). CLAY_BUILD_DATE=YYYY-MM-DD overrides it, so a rebuild on another day can reproduce a
// commit byte for byte (otherwise ~1600 files change by their date alone). The Academy's date checks (review-expired, law-old) always
// use the real date (buildAcademy: opt.now).
const TODAY = /^\d{4}-\d{2}-\d{2}$/.test(process.env.CLAY_BUILD_DATE || "") ? process.env.CLAY_BUILD_DATE
  : new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Bratislava" }).format(new Date());
globalThis.window = {};
await import("../docs/rules/data/sporting.js");
// Term labels (owner rule 08.10.2026): a professional term named as a label is "English (local)" in every language, English only on
// English pages. ONE helper for the browser and the builds: docs/shared/terms.js (window.ClayTerms). Here: glossary headwords, titles,
// breadcrumbs, index lists and related terms (uk here, other languages in build_seo_i18n.mjs) and the term links of the rule pages.
await import("../docs/shared/terms.js");
const CT = window.ClayTerms;
// Glossary search of the index pages (all languages): the box is written into the page here, the matching runs in the browser
// (docs/shared/glossary-search.js, window.ClayGlossarySearch: the same file in both places).
await import("../docs/shared/glossary-search.js");
const GS = window.ClayGlossarySearch;
// Glossary terms whose page shows an animation: TERM_SIMS of docs/shared/sims.js, the one list (the term pages mount it below) →
// data-anim on the index links, the "▶ with animation" filter. sims.js runs in a sandbox, as in build_academy.mjs.
const TERM_SIMS = (() => { try { const ctx = { window: {}, console }; vm.createContext(ctx);
  vm.runInContext(readFileSync("docs/shared/sims.js", "utf8"), ctx, { filename: "docs/shared/sims.js" }); return ctx.window.ClaySims.TERM_SIMS || {}; }
  catch (e) { console.log(`WARNING: docs/shared/sims.js could not be read (${e.message}): no "with animation" filter on the glossary index`); return {}; } })();
const ANIM = new Set(Object.keys(TERM_SIMS));
// The height a term animation takes once ClaySims.auto() has drawn it (heading + canvas + tabs + controls + caption), so its host
// reserves the room before the scripts run and the text below it does not jump (Core Web Vitals CLS; Lighthouse 05.11.2026: +0.11
// on the animated pages). Measured on the uk pages at a content width of 324 and 868 px (h324, h868) for every TERM_SIMS entry;
// the host gets min-height = a straight line between them over the real width min(100vw − 32px, 868px), 16 px under it (a gap of
// a few pixels is better than a jump). Another layout of an animation in sims.js: measure again (a wrong pair only brings back a
// small shift or leaves a small gap, never breaks the page).
const simBox = s => s.type === "flight" ? (s.also ? [451, 638] : s.focus === "points" ? [382, 615] : s.focus ? [359, 615] : [359, 592])
  : s.type === "pair" ? (s.also ? [542, 692] : [404, 615])
  : s.type === "lead" ? (s.focus === "perceived-vs-actual" ? [1544, 1028] : [1006, 792])
  : s.type === "call" ? ((s.also || []).length > 1 ? [714, 737] : s.kind === "signal" && s.also ? [668, 737] : s.kind === "gun-ready" ? [594, 714]
    : s.kind === "gun-early" || s.kind === "misfire" ? [482, 668] : s.kind === "mount" ? [502, 699] : [576, 691]) : null;
const simReserve = id => { const s = TERM_SIMS[id], hb = s && simBox(s); if (!hb) return "";
  const a = (hb[1] - hb[0]) / 544, b = hb[0] - a * 324 - 16;
  return ` style="min-height:calc(${a.toFixed(4)} * min(100vw - 32px, 868px) + ${Math.round(b)}px)"`; };
await import("../docs/rules/data/compak.js");
const BOOKS = Object.fromEntries(window.RULES.map(b => [b.key, b]));
// Rules guide and trainer data (scripts/check_rules_data.mjs: unique ids, refs, pages, no FITASC text copied word for word, no other
// discipline): its errors stop the build here, before anything is written.
{ const r = await checkRulesData({ quiet: ARGS.includes("--quiet") });
  if (!r.ok) { console.error("STOP: the rules data has errors (listed above), nothing was written. Fix docs/rules/data/ and run again."); process.exit(1); } }

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
// Descriptive subtitles of the uk term pages whose h1 is the English word alone ("Battue" → «мішень, що летить ребром і різко
// падає»): content/glossary/subtitles/uk.json, shown under the h1 and used in <title> (glossary plan, wave 4.3, 05.11.2026).
const SUB_UK = (() => { try { const j = JSON.parse(readFileSync("content/glossary/subtitles/uk.json", "utf8")); delete j._note; return j; } catch (e) { return {}; } })();
// "323 терміни", "325 термінів", "321 термін": the Ukrainian plural after a number (the count changes when terms are merged).
const ukTerms = n => `${n} ${{ one: "термін", few: "терміни", many: "термінів" }[new Intl.PluralRules("uk").select(n)] || "термінів"}`;
function glossaryPages() {
  if (!GLOSS) return [];
  const out = [];
  const css = CSS + `.box{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:12px 14px;margin:10px 0}.list{columns:3 220px;column-gap:24px}.list a{display:block;padding:2px 0;text-decoration:none;color:var(--soft)}.h1-sub{margin:-2px 0 12px;font-size:18px;line-height:1.45;color:var(--soft)}` + JUMP_CSS;
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
<style>${css}${GS.CSS}</style>
</head>
<body>
<header><div class="in">${crumbs("uk", "📖", name ? [{ label: "Глосарій", url: `${BASE}glossary/` }, { label: name }] : [{ label: "Глосарій" }])}<span style="flex:1"></span><a class="btn" data-vl href="${BASE}rules/?lang=uk">📘 Правила FITASC</a>
<!-- langs -->${langSwitch("uk", [{ l: "uk", url }, { l: "en", url: enUrl }])}<!-- /langs --></div></header>
<main style="max-width:900px;margin:0 auto;padding:20px 16px 72px">${body}
<div class="disc">Глосарій ClayArena побудовано на нашому переказі регламентів FITASC. Чинним є лише офіційний текст FITASC. Parcours de Chasse – Sporting™ і Compak® Sporting — торговельні марки FITASC.</div>${legal("uk")}</main>
</body></html>`;
  const SET = { "@type": "DefinedTermSet", name: "Глосарій стендової стрільби ClayArena", url: BASE + "glossary/", inLanguage: "uk" };
  for (const t of GLOSS.terms) {
    const url = `${BASE}glossary/${t.id}/`, name = dispTerm(t), lb = termLabel("uk", t); // lb.label = "Rabbit (заєць)"
    // the subtitle only where the h1 has no local word (lb.local empty); the FITASC marks as in the names (tm)
    const sub = SUB_UK[t.id] && !lb.local ? tm(SUB_UK[t.id]) : "";
    // <title> at most 65 characters (audit W-07): with the subtitle when there is one ("Battue — мішень, що летить ребром і різко
    // падає | Глосарій ClayArena"), else the full title, else "label | site", else "English | site" (the h1 and og:title keep the label)
    const plain = fitTitle(`${lb.label} — термін стендової стрільби | Глосарій ClayArena`, fitTitle(`${lb.label} | Глосарій ClayArena`, `${lb.head} | Глосарій ClayArena`));
    const title = sub ? fitTitle(`${lb.label} — ${sub} | Глосарій ClayArena`, fitTitle(`${lb.label} — ${sub} | ClayArena`, plain)) : plain;
    const desc = fitDesc(tm(`${t.term}: ${t.short_uk}`), "Термін стендової стрільби — глосарій ClayArena.", `glossary/${t.id}/`);
    const refs = (t.rule_refs || []).map(r => `<li><a href="${BASE}rules/${r.book}/#${r.id}">${esc(refUk(r))}</a> · ${NAMES[r.book]} · <a href="${esc(BOOKS[r.book].source.url)}#page=${r.page}" ${NF}>PDF, с. ${r.page}</a></li>`).join("");
    const disc = ["sporting", "compak"].filter(k => t.disciplines && t.disciplines[k]).map(k => `<div class="box"><b>${NAMES[k]}</b><p>${esc(t.disciplines[k])}</p></div>`).join("");
    const rel = (t.related || []).map(rid).filter(r => GBY[r] && r !== t.id).map(r => `<a class="btn" style="padding:3px 10px;font-size:13px" href="${BASE}glossary/${r}/">${termHtml("uk", GBY[r])}</a>`).join(" ");
    // "Де вивчити": Academy lessons that teach the term (final ids through id-map.json; old pages until they are replaced)
    const learn = ACADEMY.learnLinks(t.id, "uk").slice(0, 6).map(x => `<li><a href="${esc(x.url)}">${esc(x.title)}</a> · ${esc(x.context)}</li>`).join("");
    const body = `${GS.mini("uk", esc)}<div class="src">${esc(CAT_UK[t.cat] || t.cat)}</div><h1>${termHtml("uk", t)}</h1>${sub ? `<p class="h1-sub">${esc(sub)}</p>` : ""}${t.aka?.length ? `<p class="ref">Також: ${esc(t.aka.join(", "))}</p>` : ""}${jumpNav("uk", { disc, rules: refs, learn, rel })}
<section class="what-card"><h2 id="what">Що це</h2><p class="def">${esc(t.short_uk)}</p>${t.long_uk ? `<div class="sep"></div><h2>Детально</h2><p class="txt">${esc(t.long_uk)}</p>` : ""}</section>
${disc ? `<h2 id="disc">У Sporting™ і Compak® Sporting</h2><div class="duo">${disc}</div>` : ""}
${ukUsage(t) ? `<h2>Як кажуть українською</h2><p>${esc(ukUsage(t))}</p>` : ""}
${refs ? `<h2 id="rules">Де це в правилах</h2><ul>${refs}</ul>` : ""}
${t.source_url ? `<p class="ref">Джерело: <a href="${esc(t.source_url)}" ${NF}>FITASC ↗</a>${t.source_url.includes("categories") ? ` · <a href="${BASE}rules/categories/">Категорії FITASC</a>` : ""}</p>` : ""}
${learn ? `<h2 id="learn">Де вивчити</h2><ul>${learn}</ul>` : ""}
${rel ? `<h2 id="rel">Повʼязані терміни</h2><p class="rel-row">${rel}</p>` : ""}${catMore("uk", t, GLOSS.terms, { cat: c => CAT_UK[c] || c, url: x => `${BASE}glossary/${x.id}/`, html: x => termHtml("uk", x), list: `${BASE}glossary/`, skip: (t.related || []).map(rid) })}`;
    const ld = [{ "@context": "https://schema.org", "@type": "DefinedTerm", name, alternateName: [...new Set([t.term, ...(t.aka || []), lb.local].filter(Boolean))].filter(a => a !== name), description: tmMeta(t.short_uk, `glossary/${t.id}/`), termCode: t.id, url, inDefinedTermSet: SET, inLanguage: "uk" },
      crumbLd([{ name: "Глосарій", url: BASE + "glossary/" }, { name: lb.label, url }])];
    mkdirSync(`${DOCS}/glossary/${t.id}`, { recursive: true });
    writeFileSync(`${DOCS}/glossary/${t.id}/index.html`, shell(title, desc, url, ld, body, lb.label, `${BASE}en/glossary/${t.id}/`));
    out.push(url);
  }
  { const extra = Object.keys(SUB_UK).filter(id => !GBY[id] || termLabel("uk", GBY[id]).local);
    if (extra.length) console.log(`WARNING: content/glossary/subtitles/uk.json: no term or the h1 already has a local word, subtitle not shown: ${extra.join(", ")}`); }
  const listBody = `<div class="src">ClayArena</div><h1>Глосарій стендової стрільби</h1><p>${ukTerms(GLOSS.terms.length)} Sporting™ і Compak® Sporting англійською — з поясненнями українською і посиланнями на пункти правил FITASC.</p>
${glossaryIndexList("uk", GLOSS.terms, { cat: c => CAT_UK[c] || c, url: t => `${BASE}glossary/${t.id}/`, html: t => termHtml("uk", t), short: t => t.short_uk })}`;
  writeFileSync(`${DOCS}/glossary/index.html`, shell(`Глосарій стендової стрільби — ${ukTerms(GLOSS.terms.length)} | ClayArena`, `Терміни Sporting™ і Compak® Sporting англійською з поясненнями українською і посиланнями на правила FITASC.`, BASE + "glossary/",
    [{ "@context": "https://schema.org", ...SET, hasDefinedTerm: GLOSS.terms.map(t => ({ "@type": "DefinedTerm", name: dispTerm(t), url: `${BASE}glossary/${t.id}/` })) }], listBody, null, `${BASE}en/glossary/`).replace("</head>", `<style>${LIST_CSS}</style>\n</head>`));
  return [BASE + "glossary/", ...out];
}

// ---------------------------------------------------------------------------------------------------
// ClayArena Academy — ONE Academy for everybody: content/academy/ → scripts/build_academy.mjs (pages /learn/…, /<lang>/learn/…,
// data, redirect stubs, sitemap-learn-<lang>.xml). It runs before anything is written: its errors stop the whole build.
// --skip-academy runs its checks without writing (the Academy files on disk stay as they are). Its lessons give the glossary
// pages their "Де вивчити" links (ACADEMY.learnLinks: final ids through id-map.json; old pages until they are replaced).
const ACADEMY = await buildAcademy({ out: DOCS, fitascIndex: FITASC_INDEX, write: !SKIP_ACADEMY, quiet: ARGS.includes("--quiet"), draft: ARGS.includes("--draft"), today: TODAY });
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
// Index list of the glossary in one language (uk below, en in build_seo_en.mjs, the others in build_seo_i18n.mjs): the search box
// (docs/shared/glossary-search.js) and one section per category, <h2 id="cat-<slug>"> + its term links with the search data:
// data-k the names (English headword, display name, the local word of the language), data-a the aliases (English aka, the search
// aliases "alt" of docs/glossary/data/i18n/<lang>.js, uk also the «…» names of uk_usage), data-d the one-sentence definition.
// terms = the terms of the page; o.cat(c) category name, o.url(t) term page, o.html(t) link text (HTML), o.short(t) definition.
const gsKeys = (lang, t) => {
  const tr = lang === "en" ? null : (((window.GLOSSARY_I18N || {})[lang] || {}).terms || {})[t.id];
  const uk = lang === "uk" ? [...String(t.uk_usage || "").matchAll(/«([^»]+)»/g)].map(m => m[1]) : [];
  const seen = new Set(), clean = a => a.filter(Boolean).map(v => String(v).replace(/\|/g, " ").trim()) // once each, case-insensitive
    .filter(v => { const f = CT.flat(v); if (!f || seen.has(f)) return false; seen.add(f); return true; });
  return { k: clean([t.term, t.display_term, tr && CT.termLocal(t, tr, lang)]), a: clean([...(t.aka || []), ...((tr && tr.alt) || []), ...uk]) }; };
// Each list item in two lines (glossary plan, wave 10: design of the index, 07.11.2026): the English term (bold, light) and under it
// the local word of the language (grey). uk: a term with no Ukrainian word in its name shows the subtitle of its page instead
// (content/glossary/subtitles/uk.json, in italics: Jury — «журі змагання»). English pages: the term alone. o.html(t) gives
// '<span lang="en">English</span> (local)' (ClayTerms.html) or plain text on the English pages; it is split here.
// The search drop-down (glossary-search.js) puts them back into one line "English (local)".
const LIST_CSS = ".list{columns:3 230px;column-gap:28px}.list a{padding:6px 8px;margin:0 -8px 2px;border-radius:8px;line-height:1.3}.list a:hover{background:rgba(255,255,255,.05)}"
  + ".list .en{display:block;color:var(--ink);font-weight:600}.list .lc{display:block;color:var(--muted);font-size:13.5px;margin-top:1px}.list .lc.sub{font-style:italic}"
  + ".list a[data-anim]::after{content:none}.list a[data-anim] .en::after{content:\"▶\";margin-left:5px;font-size:.7em;color:var(--em);vertical-align:.14em}";
const twoLine = (lang, t, h) => { const m = /^<span lang="en">([\s\S]*?)<\/span>(?: \(([\s\S]*)\))?$/.exec(h);
  if (!m) return `<span class="en" lang="en">${h}</span>`;
  const sub = !m[2] && lang === "uk" && SUB_UK[t.id] ? esc(tm(SUB_UK[t.id])) : "";
  return `<span class="en" lang="en">${m[1]}</span>${m[2] ? `<span class="lc">${m[2]}</span>` : sub ? `<span class="lc sub">${sub}</span>` : ""}`; };
const glossaryIndexList = (lang, terms, o) => {
  const cats = [...new Set(terms.map(t => t.cat))], inCat = c => terms.filter(t => t.cat === c);
  const box = GS.form(lang, cats.map(c => ({ slug: GS.catSlug(c), name: o.cat(c), n: inCat(c).length })), esc, terms.filter(t => ANIM.has(t.id)).length);
  return box + "\n" + cats.map(c => `<h2 id="cat-${GS.catSlug(c)}">${esc(o.cat(c))}</h2><div class="list" data-cat="${GS.catSlug(c)}">${inCat(c).sort((a, b) => a.term.localeCompare(b.term)).map(t => {
    const g = gsKeys(lang, t), d = o.short(t);
    return `<a href="${o.url(t)}" data-k="${esc(g.k.join("|"))}"${g.a.length ? ` data-a="${esc(g.a.join("|"))}"` : ""}${d ? ` data-d="${esc(d)}"` : ""}${ANIM.has(t.id) ? " data-anim" : ""}>${twoLine(lang, t, o.html(t))}</a>`; }).join("")}</div>`).join("\n"); };
// Breadcrumbs in JSON-LD (BreadcrumbList) of the glossary term pages, all 11 languages (glossary plan, wave 8: markup, 05.11.2026;
// until then only the uk pages had it): the same steps as the visible breadcrumb "Glossary › term", so Google can show them in
// the result instead of the URL. items = [{ name, url }, …].
const crumbLd = items => ({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items.map((x, i) => ({ "@type": "ListItem", position: i + 1, name: x.name, item: x.url })) });
// "More in this category" on every term page, after "Related terms" (glossary plan, wave 8: internal links, 05.11.2026): up to
// CAT_MORE_N other terms of the same category in the page language, then a link to that category on the index (#cat-<slug>, the
// index filters itself to it, docs/shared/glossary-search.js). The terms shown are the alphabetical neighbours of the term in its
// category (the order of the index list), taken in turn after and before it, round the end of the list; "Related terms" are left
// out (already linked). So every term page is linked from the pages of its category neighbours, and a big category (Equipment, 50)
// does not put 50 links on every page. Text in the 11 ClayArena languages below ({c} category name, {n} terms in it).
const CAT_MORE_N = 12;
const CAT_MORE = {
  uk: ["Ще в категорії «{c}»", "Усі терміни категорії ({n}) →"],
  en: ["More in {c}", "All terms in this category ({n}) →"],
  de: ["Mehr in der Kategorie „{c}“", "Alle Begriffe dieser Kategorie ({n}) →"],
  fr: ["Aussi dans la catégorie « {c} »", "Tous les termes de cette catégorie ({n}) →"],
  it: ["Altro nella categoria «{c}»", "Tutti i termini di questa categoria ({n}) →"],
  cs: ["Další v kategorii „{c}“", "Všechny pojmy této kategorie ({n}) →"],
  pl: ["Więcej w kategorii „{c}”", "Wszystkie terminy tej kategorii ({n}) →"],
  pt: ["Mais na categoria «{c}»", "Todos os termos desta categoria ({n}) →"],
  hu: ["Még ebben a kategóriában: {c}", "A kategória összes kifejezése ({n}) →"],
  fi: ["Lisää samasta luokasta: {c}", "Kaikki tämän luokan termit ({n}) →"],
  lt: ["Daugiau kategorijoje „{c}“", "Visi šios kategorijos terminai ({n}) →"]
};
// lang, the term, the terms that have a page in this language, o = { cat(c) category name, url(t), html(t) link text, list index URL,
// skip: ids already linked on the page }. Empty when the category has no other term.
const catMore = (lang, t, terms, o) => {
  const same = terms.filter(x => x.cat === t.cat).sort((a, b) => a.term.localeCompare(b.term)), i = same.findIndex(x => x.id === t.id);
  if (i < 0) return "";
  const pick = new Set(), skip = new Set([t.id, ...(o.skip || [])]);
  for (let k = 1; k < same.length && pick.size < CAT_MORE_N; k++)
    for (const x of [same[(i + k) % same.length], same[(i - k + same.length) % same.length]]) if (pick.size < CAT_MORE_N && !skip.has(x.id)) pick.add(x.id);
  if (!pick.size) return "";
  const [h, all] = CAT_MORE[lang] || CAT_MORE.en, name = o.cat(t.cat);
  return `
<h2>${esc(h.replace("{c}", name))}</h2><p>${same.filter(x => pick.has(x.id)).map(x => `<a href="${o.url(x)}">${o.html(x)}</a>`).join(" · ")}</p>
<p class="ref"><a href="${o.list}#cat-${GS.catSlug(t.cat)}">${esc(all.replace("{n}", same.length))}</a></p>`; };
// "На сторінці:" row under the term header (glossary plan, wave 10, design-mockups/term-choke-new.html): links to the sections the
// page has, the same in all 11 languages; the sections carry the ids what / disc / rules / learn / rel. have = { disc, rules, learn, rel }.
const JUMP = {
  uk: ["На сторінці", "Що це", "У дисциплінах", "Правила", "Уроки", "Повʼязані"],
  en: ["On this page", "What it is", "In disciplines", "Rules", "Lessons", "Related"],
  de: ["Auf dieser Seite", "Was es ist", "In den Disziplinen", "Regeln", "Lektionen", "Verwandte"],
  fr: ["Sur cette page", "Définition", "Disciplines", "Règlement", "Leçons", "Termes liés"],
  it: ["In questa pagina", "Che cos'è", "Discipline", "Regolamento", "Lezioni", "Correlati"],
  cs: ["Na této stránce", "Co to je", "V disciplínách", "Pravidla", "Lekce", "Související"],
  pl: ["Na tej stronie", "Co to jest", "W konkurencjach", "Przepisy", "Lekcje", "Powiązane"],
  pt: ["Nesta página", "O que é", "Nas disciplinas", "Regras", "Lições", "Relacionados"],
  hu: ["Ezen az oldalon", "Mi ez", "A szakágakban", "Szabályok", "Leckék", "Kapcsolódó"],
  fi: ["Tällä sivulla", "Mikä se on", "Lajeissa", "Säännöt", "Oppitunnit", "Liittyvät"],
  lt: ["Šiame puslapyje", "Kas tai", "Disciplinose", "Taisyklės", "Pamokos", "Susiję"]
};
// "У дисциплінах": the Sporting™ and Compak® Sporting boxes side by side (one under the other on a phone), the discipline name
// small in the accent colour (glossary plan, wave 10, design-mockups/term-choke-new.html). Added to JUMP_CSS: the term pages load both.
const DUO_CSS = `.duo{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;margin:10px 0}.duo .box{margin:0}.duo .box>b{display:inline-block;font-size:12.5px;letter-spacing:.04em;color:var(--em);margin-bottom:2px}.duo .box p{margin:4px 0 0}`;
// "Що це" + "Детально" in one card in the style of clayarena.com (variant A of design-mockups/term-choke-what-detail.html, 09.11.2026):
// the card of its competition list (rounded-xl, border white/10, gradient white/10 -> white/5), the two headings as its "pill" badges
// (emerald-300, 12px, uppercase by CSS: the h2 text stays as it is), a thin line between them. The animation goes after the card.
const CARD_CSS = `.what-card{border:1px solid rgba(255,255,255,.1);border-radius:12px;background:linear-gradient(to bottom right,rgba(255,255,255,.1),rgba(255,255,255,.05));padding:16px 18px;margin:20px 0 14px}.what-card h2{display:inline-flex;align-items:center;margin:0 0 8px;padding:2px 10px;border-radius:999px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);color:#6ee7b7;font-size:12px;line-height:1.5;font-weight:600;letter-spacing:.04em;text-transform:uppercase}.what-card p{margin:0;max-width:none}.what-card .def{font-size:19px;line-height:1.5;font-weight:600;color:#fff}.what-card .txt{line-height:1.65;color:var(--soft)}.what-card .sep{height:1px;background:rgba(255,255,255,.1);margin:16px 0 14px}`;
// "Повʼязані терміни": the chips (a.btn) in a wrapping row over the full width. An inline chip broke across two lines with its border
// cut in half ("Electronic refereeing (електронне суддівство)", 09.11.2026); in the flex row a chip moves to the next line whole.
const REL_CSS = `.rel-row{display:flex;flex-wrap:wrap;gap:6px;max-width:none;margin:10px 0}.rel-row .btn{align-content:center;line-height:1.4}`; // on a phone .btn has min-height 44px (touch target): the text in its middle
// (align-content on the block, not inline-flex: flex items would drop the space in "Call (виклик мішені)")
const JUMP_CSS = `.jump{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:22px 0 0;padding-top:14px;border-top:1px solid var(--line);font-size:13px;color:var(--muted)}.jump a{color:var(--soft);text-decoration:none;border:1px solid var(--line);border-radius:999px;padding:4px 11px;min-height:32px;display:inline-flex;align-items:center}.jump a:hover{border-color:var(--em);color:#fff}h2[id]{scroll-margin-top:56px}` + DUO_CSS + CARD_CSS + REL_CSS;
const jumpNav = (lang, have) => { const [lbl, ...n] = JUMP[lang] || JUMP.en;
  const links = [["what", 1], ["disc", have.disc], ["rules", have.rules], ["learn", have.learn], ["rel", have.rel]].map((x, i) => x[1] ? `<a href="#${x[0]}">${n[i]}</a>` : "").join("");
  return `<nav class="jump" aria-label="${lbl}"><span>${lbl}:</span>${links}</nav>`; };
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
    return `<tr id="${esc(c.id)}"><td><b>${g ? termHtml("uk", g) : esc(c.name_en)}</b>${frOwn(c) ? ` <span class="ref">· фр. ${esc(c.name_fr)}</span>` : ""}</td><td>${c.to_age ? `${c.from_age}–${c.to_age}` : `${c.from_age}+`}</td><td>${esc(c.rule_uk)}</td></tr>`; }).join("");
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
globalThis.SEO = { BASE, TODAY, DOCS, BOOKS, NAMES, GLOSS, GBY, ACADEMY, CSS, NF, esc, tm, tmMeta, dispTerm, fitTitle, fitDesc, legal, rid, ALIAS, crumbs, langSwitch, LANG_NAME, termLabel, termHtml, frOwn, GS, glossaryIndexList, LIST_CSS, catMore, crumbLd, jumpNav, JUMP_CSS };
const { buildEnglish } = await import("./build_seo_en.mjs");
urls.push(...buildEnglish());
// Glossary in the other ClayArena languages (when translations exist) (scripts/build_seo_i18n.mjs).
const { buildI18n } = await import("./build_seo_i18n.mjs");
urls.push(...(await buildI18n()));
// Redirect stubs for merged duplicate ids (audit G-06): an old glossary URL that is no longer a term becomes a tiny noindex page that
// sends visitors (and search engines, via canonical) to the canonical term of the same language. Not in the sitemap. Production:
// answer these old URLs with an HTTP 301 instead (the 301 map = GLOSSARY_STUBS below, each → its aliases.json target).
// GLOSSARY_STUBS lists every glossary id that WAS a published page and was merged or retired since (aliases.json says where it goes):
// a clean build (an empty --out folder, or production) writes their stubs from this list. Folders already on disk that are not terms
// are stubbed too. aliases.json also maps rule-item ids that never had a page ("ammunition" → cartridge): those get no stub.
// Retiring a glossary term: delete it from learn_terms.js / glossary.js and the 11 i18n files, add "<id>": "<target>" to aliases.json
// and the id here (DEVELOPERS.md §4k).
const GLOSSARY_STUBS = ["fly-over-rectangle", "hand-signals", "smoke-ball", "super-mini", // merged duplicates (audit G-06)
  "issf", "olympic-trap", "skeet",                                                          // other disciplines, retired 08.10.2026
  "english-sporting", "cpsa", "nsca", "hoa",                                                // other versions of the sport and their bodies, retired 09.10.2026
  "true-pair", "peg"];                                                                       // British words merged into simultaneous-double / shooting-stand, 05.11.2026
// The pronunciation button of the term pages (see the walk below): its name in each language [label, "synthesised voice"], the icon,
// the style, and the recorded files (glossary plan, wave 5: English pronunciation, synthesised voice, Ukrainian pages first).
const SAY_UI = {
  uk: ["Вимова англійською", "синтезований голос"], en: ["English pronunciation", "synthesised voice"],
  de: ["Englische Aussprache", "synthetische Stimme"], fr: ["Prononciation anglaise", "voix de synthèse"],
  it: ["Pronuncia inglese", "voce sintetica"], cs: ["Anglická výslovnost", "syntetický hlas"], pl: ["Wymowa angielska", "głos syntetyczny"],
  pt: ["Pronúncia em inglês", "voz sintetizada"], hu: ["Angol kiejtés", "szintetikus hang"],
  fi: ["Englanninkielinen ääntäminen", "synteettinen ääni"], lt: ["Tarimas anglų kalba", "sintetinis balsas"] };
const SAY_ICON = '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z" fill="currentColor" stroke="none"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path class="w2" d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>';
const SAY_CSS = ".th{display:flex;align-items:center;gap:12px;margin:8px 0 10px}.th h1{margin:0;min-width:0}"
  + ".say{display:inline-flex;align-items:center;justify-content:center;flex:none;width:38px;height:38px;padding:0;border-radius:50%;border:1px solid var(--line);background:transparent;color:var(--muted);cursor:pointer;transition:color .15s,border-color .15s}"
  + ".say:hover,.say:focus-visible{color:var(--em);border-color:rgba(52,211,153,.5)}.say:focus-visible{outline:2px solid var(--em);outline-offset:2px}"
  + ".say.on{color:var(--em);border-color:var(--em)}.say.on .w2{animation:sayw .5s ease-in-out infinite alternate}@keyframes sayw{from{opacity:.25}to{opacity:1}}"
  + "@media (pointer:coarse){.say{width:44px;height:44px}}@media (prefers-reduced-motion:reduce){.say.on .w2{animation:none}}@media print{.say{display:none}}";
const SAY_AUDIO = new Set(existsSync(`${DOCS}/glossary/audio`) ? readdirSync(`${DOCS}/glossary/audio`).filter(n => n.endsWith(".mp3")).map(n => n.slice(0, -4)) : []);
function redirectStubs() {
  const done = [];
  const bases = ["glossary", ...readdirSync(DOCS, { withFileTypes: true }).filter(e => e.isDirectory() && /^[a-z]{2}$/.test(e.name)).map(e => `${e.name}/glossary`)];
  for (const base of bases) {
    const dir = `${DOCS}/${base}`; if (!existsSync(dir)) continue;
    const names = new Set(GLOSSARY_STUBS.filter(id => !GBY[id]));
    for (const e of readdirSync(dir, { withFileTypes: true })) if (e.isDirectory() && e.name !== "data" && e.name !== "audio" && !GBY[e.name]) names.add(e.name);
    for (const name of [...names].sort()) {
      const to = rid(name), target = GBY[to] && existsSync(`${dir}/${to}/index.html`) ? `${BASE}${base}/${to}/` : `${BASE}${base}/`;
      const lang = base === "glossary" ? "uk" : base.split("/")[0];
      mkdirSync(`${dir}/${name}`, { recursive: true });
      writeFileSync(`${dir}/${name}/index.html`, `<!doctype html>
<html lang="${lang}"><head><meta charset="utf-8"><title>ClayArena</title><meta name="robots" content="noindex, follow"><link rel="canonical" href="${target}"><meta http-equiv="refresh" content="0; url=${target}"></head><body><p><a href="${target}">${target}</a></p></body></html>
`);
      done.push(`${base}/${name}`);
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
// One title and one meta description per glossary page (glossary plan, wave 8: SEO): the pass below collects them on every index and
// term page of the 11 languages (redirect stubs left out) and the end of the build prints a WARNING for any text shared by two pages
// or missing. Two pages with the same snippet compete with each other in search; Google then shows only one of them. Check 05.11.2026:
// 3 586 pages, every title and description unique. A WARNING here usually means two terms with the same definition in
// docs/glossary/data/i18n/<lang>.js (or glossary.js / learn_terms.js): write each its own, or merge them (aliases.json).
const GLOSS_PAGE_RE = /^(?:[a-z]{2}\/)?glossary\/(?:[a-z0-9-]+\/)?index\.html$/;
const glossMeta = { description: new Map(), title: new Map(), missing: [] };
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
    if (GLOSS_PAGE_RE.test(rp)) for (const [k, re] of [["description", /<meta name="description" content="([^"]*)"/], ["title", /<title>([^<]*)<\/title>/]]) {
      const v = (h.match(re) || [])[1], page = rp.replace(/index\.html$/, "");
      if (!v) { glossMeta.missing.push(`${page} (${k})`); continue; }
      glossMeta[k].set(v, [...(glossMeta[k].get(v) || []), page]); }
    let changed = false;
    { const h2 = h.replace(SIMS_SRC_RE, '$1sims.min.js"'); if (h2 !== h) { h = h2; changed = true; } } // the minified animations
    if (h.includes("shared/sims.min.js") && !h.includes("shared/terms.js")) { // the term helper before the animations, same defer
      const h2 = h.replace(/<script\b([^>]*?)\bsrc="([^"]*?)shared\/sims\.min\.js"([^>]*)><\/script>/, (m, a, pre, b) => `<script${a}src="${pre}shared/terms.js"${b}></script>\n${m}`);
      if (h2 !== h) { h = h2; changed = true; } }
    if (!h.includes("shared/nav.js")) { h = h.replace("</head>", `<script src="${rel}shared/nav.js" defer></script>\n</head>`); changed = true; }
    // The room of the project bar, reserved before nav.js runs (deferred): an empty slot first in <body>, its height in the page CSS
    // (the bar is 48 px; 60 px on narrow or touch screens). nav.js draws the bar into it, so the page does not jump (CLS).
    if (!h.includes('class="ca-slot"')) {
      h = h.replace("</head>", `<style>.ca-slot{min-height:48px}@media (max-width:759.98px),(pointer:coarse){.ca-slot{min-height:60px}}@media print{.ca-slot{display:none}}</style>\n</head>`)
        .replace(/<body\b[^>]*>/, m => `${m}<div class="ca-slot"></div>`); changed = true; }
    // Glossary term pages (all languages): English pronunciation (🔊) + the shared animation of the term. Only the terms of TERM_SIMS
    // (docs/shared/sims.js, the set ANIM above: 50 of 325) load the animations (terms.js + sims-text-<lang>.js, the page language only
    // + sims.min.js ≈ 45 KB gzip);
    // the other pages load docs/shared/speak.js alone (≈ 0.5 KB) for the button (glossary plan, wave 2: page weight, 05.11.2026).
    // The button (wave 5, 06.11.2026, variant A of design-mockups/term-voice-button.html): a small round speaker icon right of the
    // h1, outside it (the heading text stays the term alone), the same in all 11 languages; its name (aria-label, tooltip) is in the
    // page language (SAY_UI). Ukrainian pages play the recorded voice when docs/glossary/audio/<id>.mp3 exists (SAY_AUDIO), the
    // other pages and the terms without a file use the browser voice (docs/shared/speak.js).
    const gm = rp.match(/^(?:([a-z]{2})\/)?glossary\/([a-z0-9-]+)\/index\.html$/);
    if (gm && !h.includes('class="say"')) {
      const id = gm[2], term = (GBY[id] || {}).term || id, l = SAY_UI[gm[1] || "uk"] || SAY_UI.en, file = !gm[1] && SAY_AUDIO.has(id);
      const btn = `<button class="say" type="button" data-say="${esc(term)}"${file ? ` data-src="${rel}glossary/audio/${id}.mp3"` : ""} aria-label="${l[0]}" title="${file ? `${l[0]} · ${l[1]}` : l[0]}">${SAY_ICON}</button>`;
      h = h.replace(/<h1>([\s\S]*?)<\/h1>/, m => `<div class="th">${m}${btn}</div>`)
        .replace("</head>", `<style>${SAY_CSS}</style>\n</head>`);
      if (ANIM.has(id)) {
        const card = h.indexOf('<section class="what-card">'), cardEnd = card >= 0 ? h.indexOf("</section>", card) + 10 : -1; // after the "Що це" card
        const second = cardEnd > 9 ? cardEnd : ([...h.matchAll(/<h2[\s>]/g)][1] || { index: -1 }).index; // else before the second h2 (it may carry an id)
        if (second > 0) h = h.slice(0, second) + `<div data-clay-term="${id}"${simReserve(id)}></div>\n` + h.slice(second);
        h = h.replace("</body>", `<script src="${rel}shared/terms.js"></script><script src="${rel}shared/sims-text-${gm[1] || "uk"}.js"></script><script src="${rel}shared/sims.min.js"></script><script>ClaySims.auto()</script>\n</body>`);
      } else h = h.replace("</body>", `<script src="${rel}shared/speak.js" defer></script>\n</body>`);
      changed = true;
    }
    // Glossary pages, index and terms (all languages): the search box (docs/shared/glossary-search.js; ClayTerms of terms.js matches).
    // The index loads terms.js with it; a term page without it gets terms.js from the search on the first search (lazy).
    if (/^(?:[a-z]{2}\/)?glossary\/(?:[a-z0-9-]+\/)?index\.html$/.test(rp) && h.includes("data-gsearch") && !h.includes("shared/glossary-search.js")) {
      h = h.replace("</body>", `${gm || h.includes("shared/terms.js") ? "" : `<script src="${rel}shared/terms.js" defer></script>`}<script src="${rel}shared/glossary-search.js" defer></script>\n</body>`); changed = true; }
    if (changed) writeFileSync(f, h);
  }
}
// robots.txt: open to crawlers only when the site is built for clayarena.com (owner decision 05.11.2026: the products live there).
// Any other address (the GitHub Pages working copy) is a preview: Disallow: /, so it never competes with clayarena.com in search.
writeFileSync(`${DOCS}/robots.txt`, /^https:\/\/(www\.)?clayarena\.com\//.test(BASE) ? `User-agent: *\nAllow: /\nSitemap: ${BASE}sitemap.xml\n`
  : `# Working copy of the ClayArena Academy / Rules / Glossary (preview), kept out of search on purpose: the products are published\n# on clayarena.com. scripts/build_seo.mjs writes "Allow" here only when BASE (scripts/site_common.mjs) is a clayarena.com address.\nUser-agent: *\nDisallow: /\n`);
if (!ARGS.includes("--quiet")) console.log("pages", urls.length, urls.join("\n"));
console.log(`sitemap index: ${SITEMAPS.join(", ")} · site pages ${urls.length} · Academy URLs ${Object.values(ACADEMY.urls || {}).reduce((n, a) => n + a.length, 0)}${SKIP_ACADEMY ? " (Academy skipped: not written)" : ""}`);
// Safety net of tmMeta() (audit legal-02): declined FITASC marks it had to mark in glossary meta descriptions. The pages are correct,
// but the definition should say the mark in its base form: rewrite it in docs/glossary/data/i18n/<lang>.js (or glossary.js / learn_terms.js).
for (const k of ["description", "title"]) {
  const dup = [...glossMeta[k]].filter(([, pages]) => pages.length > 1);
  if (dup.length) console.log(`WARNING: ${dup.length} glossary ${k}s shared by several pages (each page needs its own): ${dup.map(([v, pages]) => `"${v.slice(0, 60)}…" — ${pages.join(", ")}`).join("; ")}`);
}
if (glossMeta.missing.length) console.log(`WARNING: glossary pages without a title or meta description: ${glossMeta.missing.join(", ")}`);
console.log(`glossary snippets: ${glossMeta.description.size} unique descriptions, ${glossMeta.title.size} unique titles`);
if (tmMetaHits.size) console.log(`WARNING: glossary meta descriptions with a declined FITASC mark (marked as "Compak®-…" / "Sporting™-…"; write the base form "Sporting™" / "Compak® Sporting" in the definition): ${[...tmMetaHits].map(([w, p]) => `${w} (${p})`).join(", ")}`);
