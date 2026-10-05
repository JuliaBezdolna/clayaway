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
const NAMES = { sporting: "Sporting™", compak: "Compak® Sporting" };
const TXT = {
  uk: {
    title: d => `Правила ${d} FITASC простими словами — ClayAway`,
    h1: d => `Правила ${d} простими словами`,
    desc: (d, n, f) => `Правила ${d} FITASC українською: ${n} пунктів за розділами і ${f} відповідей на часті питання — положення рушниці, No Bird, відмови, протести, перестрілки. З посиланням на сторінку офіційного PDF.`,
    lead: "Наш переказ офіційного регламенту FITASC простими словами: розділ за розділом, з номером пункту і посиланням на сторінку PDF. Терміни англійською, як їх кажуть на стенді.",
    ask: "Запитати про правила", trainer: "Перевірити себе в тренажері", other: "Інша мова", faq: "Часті питання", toc: "Зміст", part: "Частина", ch: "Розділ",
    src: "Джерело", ed: "Редакція", off: "Офіційний PDF FITASC", pdf: "PDF, стор.",
    disc: "Це неофіційний переказ для зручності спортсменів ClayArena. Правила належать FITASC; у разі розбіжностей чинним є лише офіційний текст FITASC. Parcours de Chasse – Sporting™ і Compak® Sporting — торговельні марки FITASC.",
    crumbs: ["ClayAway", "Правила FITASC"], updated: "Оновлено"
  },
  en: {
    title: d => `FITASC ${d} rules in plain English — ClayAway`,
    h1: d => `${d} rules in plain words`,
    desc: (d, n, f) => `FITASC ${d} rules explained: ${n} rule points by chapter and ${f} answers to common questions — gun position, No Bird, malfunctions, appeals, shoot-offs. Each linked to the official PDF page.`,
    lead: "Our plain-language summary of the official FITASC rulebook, chapter by chapter, with the rule reference and a link to the PDF page.",
    ask: "Ask about the rules", trainer: "Test yourself in the trainer", other: "Інша мова", faq: "Common questions", toc: "Contents", part: "Part", ch: "Chapter",
    src: "Source", ed: "Edition", off: "Official FITASC PDF", pdf: "PDF, p.",
    disc: "This is an unofficial summary for ClayArena shooters. The rules belong to FITASC; if anything differs, only the official FITASC text applies. Parcours de Chasse – Sporting™ and Compak® Sporting are trademarks of FITASC.",
    crumbs: ["ClayAway", "FITASC rules"], updated: "Updated"
  }
};
const urlOf = (lang, key) => BASE + (lang === "uk" ? `rules/${key}/` : `rules/en/${key}/`);
const NF = 'rel="nofollow noopener noreferrer" target="_blank"';

const CSS = `:root{color-scheme:dark;--bg:#030712;--surface:rgba(255,255,255,.04);--line:rgba(255,255,255,.1);--ink:#F3F4F6;--soft:#D1D5DB;--muted:#9CA3AF;--em:#34D399;--primary:#059669}
*{box-sizing:border-box}html,body{margin:0}body{background:var(--bg);color:var(--ink);font:16px/1.65 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
a{color:var(--em)}.wrap{max-width:1080px;margin:0 auto;padding-inline:16px;padding-block:20px 72px;display:grid;grid-template-columns:240px minmax(0,1fr);gap:40px}
@media(max-width:860px){.wrap{grid-template-columns:1fr}.toc{position:static!important;max-height:220px!important;border:1px solid var(--line);border-radius:12px;padding:6px 10px}}
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
<p>${esc(tx(it, "summary"))}</p>${(it["points_" + lang] || []).length ? `<ul>${it["points_" + lang].map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}${globalThis.termLinks ? globalThis.termLinks(it, lang) : ""}</article>`).join("\n")}
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
// termLinks(item, lang): HTML links from a rule item to its glossary terms (deduplicated through aliases).
globalThis.termLinks = (it, lang) => {
  if (!GLOSS) return "";
  const ids = [...new Set((it.terms || []).map(t => ALIAS[t] || t).filter(id => GBY[id]))];
  if (!ids.length) return "";
  return `<div class="ref">${lang === "uk" ? "Терміни" : "Terms"}: ${ids.map(id => `<a href="${BASE}glossary/${id}/">${esc(GBY[id].term)}</a>`).join(" · ")}</div>`;
};

function glossaryPages() {
  if (!GLOSS) return [];
  const out = [];
  const css = CSS + `.box{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:12px 14px;margin:10px 0}.list{columns:3 220px;column-gap:24px}.list a{display:block;padding:2px 0;text-decoration:none;color:var(--soft)}`;
  const shell = (title, desc, url, ld, body) => `<!doctype html>
<html lang="uk">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="index, follow, max-image-preview:large">
<link rel="canonical" href="${url}">
<meta property="og:type" content="article"><meta property="og:site_name" content="ClayAway · ClayArena">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}"><meta property="og:image" content="${BASE}og/glossary.png">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:type" content="image/png">
<meta property="og:locale" content="uk_UA"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${BASE}og/glossary.png">
<meta name="theme-color" content="#030712"><link rel="icon" type="image/png" href="${BASE}og/favicon.png">
${ld.map(x => `<script type="application/ld+json">${JSON.stringify(x)}</script>`).join("\n")}
<style>${css}</style>
</head>
<body>
<header><div class="in"><a class="logo" href="${BASE}glossary/"><b>ClayArena</b></a><nav class="crumbs"><a href="${BASE}glossary/">Глосарій</a></nav><span style="flex:1"></span><a class="btn" href="${BASE}rules/">Правила FITASC</a></div></header>
<main style="max-width:900px;margin:0 auto;padding:20px 16px 72px">${body}
<div class="disc">Глосарій ClayArena побудовано на нашому переказі регламентів FITASC. Чинним є лише офіційний текст FITASC. Parcours de Chasse – Sporting™ і Compak® Sporting — торговельні марки FITASC.</div></main>
</body></html>`;
  const SET = { "@type": "DefinedTermSet", name: "ClayArena clay shooting glossary", url: BASE + "glossary/" };
  for (const t of GLOSS.terms) {
    const url = `${BASE}glossary/${t.id}/`;
    const title = `${t.term} — термін стендової стрільби | Глосарій ClayArena`;
    const desc = `${t.term}: ${t.short_uk}`.slice(0, 300);
    const refs = (t.rule_refs || []).map(r => `<li><a href="${BASE}rules/${r.book}/#${r.id}">${esc(r.ref)}</a> · ${NAMES[r.book]} · <a href="${esc(BOOKS[r.book].source.url)}#page=${r.page}" ${NF}>PDF ${r.page}</a></li>`).join("");
    const disc = ["sporting", "compak"].filter(k => t.disciplines && t.disciplines[k]).map(k => `<div class="box"><b>${NAMES[k]}</b><p>${esc(t.disciplines[k])}</p>${t.disciplines_en && t.disciplines_en[k] ? `<p lang="en">${esc(t.disciplines_en[k])}</p>` : ""}</div>`).join("");
    const rel = (t.related || []).filter(r => GBY[r]).map(r => `<a class="btn" style="padding:3px 10px;font-size:13px" href="${BASE}glossary/${r}/">${esc(GBY[r].term)}</a>`).join(" ");
    const body = `<div class="src">${esc(t.cat)}</div><h1>${esc(t.term)}</h1>${t.aka?.length ? `<p class="ref">Також: ${esc(t.aka.join(", "))}</p>` : ""}
<h2>Що це</h2><p><b>${esc(t.short_uk)}</b></p><p lang="en">${esc(t.short_en)}</p>
${t.long_uk ? `<h2>Детально</h2><p>${esc(t.long_uk)}</p><p lang="en">${esc(t.long_en)}</p>` : ""}
${disc ? `<h2>У Sporting і Compak</h2>${disc}` : ""}
${t.uk_usage && t.uk_usage !== "—" ? `<h2>Як кажуть українською</h2><p>${esc(t.uk_usage)}</p>` : ""}
${refs ? `<h2>Де це в правилах</h2><ul>${refs}</ul>` : ""}
${t.source_url ? `<p class="ref">Джерело: <a href="${esc(t.source_url)}" ${NF}>FITASC ↗</a>${t.source_url.includes("categories") ? ` · <a href="${BASE}rules/categories/">Категорії FITASC</a>` : ""}</p>` : ""}
${(t.learn || []).filter(id => LESSON[id]).length ? `<h2>Де вивчити</h2><ul>${t.learn.filter(id => LESSON[id]).slice(0, 6).map(id => `<li><a href="${BASE}learn/${id}/">${esc(LESSON[id].title_uk)}</a> · ${esc(LESSON[id].module.title_uk)}</li>`).join("")}</ul>` : ""}
${rel ? `<h2>Повʼязані терміни</h2><p>${rel}</p>` : ""}`;
    const ld = [{ "@context": "https://schema.org", "@type": "DefinedTerm", name: t.term, alternateName: t.aka || [], description: `${t.short_uk} / ${t.short_en}`, termCode: t.id, url, inDefinedTermSet: SET, inLanguage: ["uk", "en"] },
      { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Глосарій", item: BASE + "glossary/" }, { "@type": "ListItem", position: 2, name: t.term, item: url }] }];
    mkdirSync(`docs/glossary/${t.id}`, { recursive: true });
    writeFileSync(`docs/glossary/${t.id}/index.html`, shell(title, desc, url, ld, body));
    out.push(url);
  }
  const cats = [...new Set(GLOSS.terms.map(t => t.cat))];
  const listBody = `<div class="src">ClayArena</div><h1>Глосарій стендової стрільби</h1><p>${GLOSS.terms.length} термінів Sporting і Compak Sporting англійською — з поясненнями українською та англійською і посиланнями на пункти правил FITASC.</p>
${cats.map(c => `<h2>${esc(c)}</h2><div class="list">${GLOSS.terms.filter(t => t.cat === c).sort((a, b) => a.term.localeCompare(b.term)).map(t => `<a href="${BASE}glossary/${t.id}/">${esc(t.term)}</a>`).join("")}</div>`).join("\n")}`;
  writeFileSync("docs/glossary/index.html", shell(`Глосарій стендової стрільби — ${GLOSS.terms.length} термінів | ClayArena`, `Терміни Sporting і Compak Sporting англійською з поясненнями українською та англійською і посиланнями на правила FITASC.`, BASE + "glossary/",
    [{ "@context": "https://schema.org", ...SET, hasDefinedTerm: GLOSS.terms.map(t => ({ "@type": "DefinedTerm", name: t.term, url: `${BASE}glossary/${t.id}/` })) }], listBody));
  return [BASE + "glossary/", ...out];
}

// ---------------------------------------------------------------------------------------------------
// ClayArena Academy (beginners) — docs/learn/data/<module>.js → static lesson pages docs/learn/<lesson-id>/
// (LearningResource + BreadcrumbList JSON-LD). The interactive app is docs/learn/index.html (#<lesson-id>).
// Lesson new_terms that are not in the rules glossary become extra glossary entries (source "academy")
// so every term chip has a page; they link back to the lesson that explains them.
window.LEARN = [];
for (const m of ["intro", "safety", "gun", "chokes", "cartridges", "targets", "technique", "competitions", "rules", "culture", "clayarena", "gear", "training", "juniors", "travel"]) {
  try { await import(`../docs/learn/data/${m}.js`); } catch (e) { /* module not written yet */ }
}
try { await import("../docs/learn/data/laws-de.js"); } catch (e) {}
// lawTableHtml(code, lang): static version of the country law table used by lessons with `law_table`.
globalThis.lawTableHtml = (code, lang) => { const D = (window.LAWS || {})[code]; if (!D) return ""; const u = lang === "uk";
  return `<h2>${u ? "Німеччина по землях: свинцевий дріб" : "Germany by state: lead shot"}</h2><p class="ref">${esc(u ? D.note_uk : D.note_en)} (${esc(D.as_of)})</p><div class="tw" style="overflow-x:auto;border:1px solid var(--line);border-radius:12px"><table style="border-collapse:collapse;width:100%;font-size:14px"><thead><tr>${(u ? ["Земля", "Норма", "Що заборонено", "З"] : ["State", "Rule", "What is banned", "Since"]).map(h => `<th style="text-align:left;padding:8px 10px;border-bottom:1px solid var(--line)">${h}</th>`).join("")}</tr></thead><tbody>${D.states.map(x => `<tr><td style="padding:8px 10px;border-bottom:1px solid var(--line)"><b>${esc(u ? x.state_uk : x.state_en)}</b> (${esc(x.state_de)})</td><td style="padding:8px 10px;border-bottom:1px solid var(--line)">${x.url ? `<a href="${esc(x.url)}" ${NF}>${esc(x.law)}${x.article ? ", " + esc(x.article) : ""}</a>` : esc(x.law)}</td><td style="padding:8px 10px;border-bottom:1px solid var(--line)">${esc(u ? x.rule_uk : x.rule_en)}</td><td style="padding:8px 10px;border-bottom:1px solid var(--line)">${esc(x.since || "—")}</td></tr>`).join("")}</tbody></table></div>`; };
const LEARN = window.LEARN.sort((a, b) => a.order - b.order);
if (GLOSS) {
  const have = new Set(GLOSS.terms.map(t => t.id));
  for (const m of LEARN) for (const l of m.lessons) for (const n of (l.new_terms || [])) {
    if (have.has(n.id)) { const t = GBY[n.id]; if (t.learn && !t.learn.includes(l.id)) t.learn.push(l.id); continue; }
    const t = { id: n.id, term: n.term, aka: [], cat: "Academy", short_uk: n.short_uk, short_en: n.short_en, long_uk: "", long_en: "", related: [], rule_refs: [], learn: [l.id], source: "academy" };
    GLOSS.terms.push(t); GBY[n.id] = t; have.add(n.id);
  }
  for (const m of LEARN) for (const l of m.lessons) for (const id of (l.terms || [])) { const t = GBY[id]; if (t) { t.learn ||= []; if (!t.learn.includes(l.id)) t.learn.push(l.id); } }
}
// Full entries for the lesson terms (docs/glossary/data/learn_terms.js, window.GLOSSARY_LEARN) replace the thin
// one-line academy entries created above, keeping the computed `learn` links.
try { await import("../docs/glossary/data/learn_terms.js"); } catch (e) { /* not written yet */ }
if (GLOSS && window.GLOSSARY_LEARN) for (const full of window.GLOSSARY_LEARN.terms) {
  const t = GBY[full.id]; if (!t) continue;
  const learn = [...new Set([...(t.learn || []), ...(full.learn || [])])];
  Object.assign(t, full, { learn, source: "academy" });
}
const LESSON = Object.fromEntries(LEARN.flatMap(m => m.lessons.map(l => [l.id, { ...l, module: m }])));

function lessonPages() {
  const out = [];
  for (const m of LEARN) m.lessons.forEach((l, i) => {
    const url = `${BASE}learn/${l.id}/`, next = m.lessons[i + 1];
    const title = `${l.title_uk} — Академія ClayArena`;
    const ld = [{ "@context": "https://schema.org", "@type": "LearningResource", name: l.title_uk, alternateName: l.title_en, description: l.summary_uk, url, inLanguage: ["uk", "en"],
      learningResourceType: "Lesson", educationalLevel: "Beginner", timeRequired: `PT${l.minutes || 4}M`, isAccessibleForFree: true,
      isPartOf: { "@type": "Course", name: "Академія ClayArena — стендова стрільба з нуля", url: BASE + "learn/" }, provider: { "@type": "Organization", name: "ClayArena", url: "https://clayarena.com/" } },
      { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Академія ClayArena", item: BASE + "learn/" },
        { "@type": "ListItem", position: 2, name: m.title_uk, item: `${BASE}learn/#${m.module}` },
        { "@type": "ListItem", position: 3, name: l.title_uk, item: url }] }];
    const terms = (l.terms || []).filter(id => GBY[id]).map(id => `<a href="${BASE}glossary/${id}/">${esc(GBY[id].term)}</a>`).join(" · ");
    const refs = (l.rule_refs || []).map(r => { const b = BOOKS[r.book]; const it = b && b.sections.flatMap(s => s.items).find(x => x.id === r.id); return it ? `<li><a href="${BASE}rules/${r.book}/#${it.id}">${esc(it.ref)}</a> · ${NAMES[r.book]}</li>` : ""; }).join("");
    const html = `<!doctype html>
<html lang="uk">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(l.summary_uk)}">
<meta name="robots" content="index, follow, max-image-preview:large">
<link rel="canonical" href="${url}">
<meta property="og:type" content="article"><meta property="og:site_name" content="ClayArena">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(l.summary_uk)}">
<meta property="og:url" content="${url}"><meta property="og:image" content="${BASE}og/learn.png">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:type" content="image/png">
<meta property="og:locale" content="uk_UA"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${BASE}og/learn.png">
<meta name="theme-color" content="#030712"><link rel="icon" type="image/png" href="${BASE}og/favicon.png">
${ld.map(x => `<script type="application/ld+json">${JSON.stringify(x)}</script>`).join("\n")}
<style>${CSS}.kp{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:12px 16px;margin:14px 0}article p{font-size:17px;line-height:1.75}</style>
</head>
<body>
<header><div class="in"><a class="logo" href="${BASE}learn/"><b>ClayArena</b></a><nav class="crumbs"><a href="${BASE}learn/">Академія</a> › <a href="${BASE}learn/#${m.module}">${esc(m.title_uk)}</a></nav><span style="flex:1"></span><a class="btn primary" href="${BASE}learn/#${l.id}">Пройти урок з тестом</a></div></header>
<main style="max-width:780px;margin:0 auto;padding:20px 16px 72px"><article>
<div class="src">${esc(m.title_uk)} · ${i + 1}/${m.lessons.length} · ${l.minutes || 4} хв</div>
<h1>${esc(l.title_uk)}</h1>
${(l.body_uk || []).map(p => `<p>${esc(p)}</p>`).join("\n")}
<div class="kp"><b>Головне</b><ul>${(l.key_points_uk || []).map(k => `<li>${esc(k)}</li>`).join("")}</ul></div>
${l.did_you_know_uk ? `<p><b>Чи знали ви?</b> ${esc(l.did_you_know_uk)}</p>` : ""}
${terms ? `<h2>Терміни</h2><p>${terms}</p>` : ""}
${refs ? `<h2>Де це в правилах</h2><ul>${refs}</ul>` : ""}
${l.law_table ? globalThis.lawTableHtml(l.law_table, "uk") : ""}
${(l.sources || []).length ? `<h2>Джерела і закони</h2><ul>${l.sources.map(x => `<li><a href="${esc(x.url)}" ${NF}>${esc(x.title)} ↗</a></li>`).join("")}</ul><p class="ref">Станом на дату уроку; не є юридичною консультацією — перевіряйте актуальну редакцію законів.</p>` : ""}
<h2 lang="en">${esc(l.title_en)}</h2>
${(l.body_en || []).map(p => `<p lang="en">${esc(p)}</p>`).join("\n")}
<div class="cta"><a class="btn primary" href="${BASE}learn/#${l.id}">Перевірити себе: 3 питання</a>${next ? `<a class="btn" href="${BASE}learn/${next.id}/">Далі: ${esc(next.title_uk)}</a>` : ""}</div>
</article>
<div class="disc">Академія ClayArena. Parcours de Chasse – Sporting™ і Compak® Sporting — торговельні марки FITASC. Правила FITASC — у нашому переказі; чинним є лише офіційний текст FITASC. Закони про зброю й набої в кожній країні різні.</div>
</main></body></html>`;
    mkdirSync(`docs/learn/${l.id}`, { recursive: true });
    writeFileSync(`docs/learn/${l.id}/index.html`, html);
    out.push(url);
  });
  return LEARN.length ? [BASE + "learn/", ...out] : [];
}

// ---------------------------------------------------------------------------------------------------
// FITASC age categories (not in the discipline rulebooks; source: fitasc.com/competitions/categories).
// Data: docs/rules/data/categories.js (window.FITASC_CATEGORIES). Output: docs/rules/categories/index.html.
// The weekly checker (scripts/fitasc_check.py) watches the source page for changes.
function categoriesPage() {
  try { /* loaded below */ } catch (e) {}
  const C = window.FITASC_CATEGORIES; if (!C) return [];
  const url = BASE + "rules/categories/";
  const title = "Категорії FITASC: Junior, Lady, Men, Senior, Veteran, Master — вік | ClayArena";
  const desc = `Хто такий Junior, Lady, Senior, Veteran і Master у Sporting™ і Compak® Sporting: вікові межі FITASC з ${C.valid_from.split("-").reverse().join(".")}, правила національних команд.`;
  const rows = C.categories.map(c => `<tr><td><b>${esc(c.name_en)}</b> <span class="ref">(${esc(c.name_fr)} · ${esc(c.name_uk)})</span></td><td>${c.to_age ? `${c.from_age}–${c.to_age}` : `${c.from_age}+`}</td><td>${esc(c.rule_uk)}</td></tr>`).join("");
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
<meta property="og:type" content="article"><meta property="og:site_name" content="ClayAway · ClayArena">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}"><meta property="og:image" content="${BASE}og/rules.png">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:type" content="image/png">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${BASE}og/rules.png">
<meta name="theme-color" content="#030712"><link rel="icon" type="image/png" href="${BASE}og/favicon.png">
${ld.map(x => `<script type="application/ld+json">${JSON.stringify(x)}</script>`).join("\n")}
<style>${CSS}table{border-collapse:collapse;width:100%;font-size:14.5px}td,th{border-bottom:1px solid var(--line);padding:9px 10px;text-align:left;vertical-align:top}th{color:var(--muted);font-size:12px;text-transform:uppercase}.tw{overflow-x:auto;border:1px solid var(--line);border-radius:12px}</style>
</head>
<body>
<header><div class="in"><a class="logo" href="${BASE}rules/"><b>ClayArena</b></a><nav class="crumbs"><a href="${BASE}rules/">Правила FITASC</a> › Категорії</nav></div></header>
<main style="max-width:900px;margin:0 auto;padding:20px 16px 72px">
<div class="src">FITASC · Sporting™ · Compak® Sporting</div>
<h1>Категорії FITASC: хто такий Junior, Lady, Senior, Veteran, Master</h1>
<p>Вікові категорії однакові для Parcours de Chasse – Sporting™, Compak® Sporting та інших дисциплін FITASC. Діють з ${C.valid_from.split("-").reverse().join(".")}. Значення має лише <b>рік</b> народження, а не день і місяць. Національні й клубні змагання можуть мати власні категорії — дивіться програму змагань.</p>
<h2>Категорії і вік</h2><div class="tw"><table><thead><tr><th>Категорія</th><th>Вік</th><th>Правило</th></tr></thead><tbody>${rows}</tbody></table></div>
${teams ? `<h2>Національні команди</h2><div class="tw"><table><thead><tr><th>Команда</th><th>Хто може</th><th>Склад</th><th>Примітка</th></tr></thead><tbody>${teams}</tbody></table></div>` : ""}
${(C.notes_uk || []).length ? `<ul>${C.notes_uk.map(n => `<li>${esc(n)}</li>`).join("")}</ul>` : ""}
<p class="src">Джерело: <a href="${esc(C.source_url)}" ${NF}>FITASC — Catégories, limites d'âge ↗</a> · ${TODAY}</p>
<div class="cta"><a class="btn primary" href="${BASE}rules/">Довідник правил</a><a class="btn" href="${BASE}glossary/">Глосарій</a><a class="btn" href="${BASE}learn/">Академія ClayArena</a></div>
<div class="disc">Наш переказ офіційних категорій FITASC. Чинним є лише текст FITASC. Parcours de Chasse – Sporting™ і Compak® Sporting — торговельні марки FITASC.</div>
</main></body></html>`;
  mkdirSync("docs/rules/categories", { recursive: true });
  writeFileSync("docs/rules/categories/index.html", html);
  return [url];
}
try { await import("../docs/rules/data/categories.js"); } catch (e) { console.log("categories data not found yet"); }

const urls = [BASE + "rules/", BASE + "rules/trainer/"];
urls.push(...categoriesPage());
urls.push(...lessonPages());
for (const key of Object.keys(BOOKS)) for (const lang of ["uk", "en"]) urls.push(page(key, lang));
urls.push(...glossaryPages());
// English versions of lessons, glossary and categories + hreflang on both languages (scripts/build_seo_en.mjs).
globalThis.SEO = { BASE, TODAY, BOOKS, NAMES, GLOSS, GBY, LEARN, LESSON, CSS, NF, esc };
const { buildEnglish } = await import("./build_seo_en.mjs");
urls.push(...buildEnglish());
writeFileSync("docs/sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${u}</loc><lastmod>${TODAY}</lastmod></url>`).join("\n")}
</urlset>
`);
writeFileSync("docs/robots.txt", `User-agent: *\nAllow: /\nSitemap: ${BASE}sitemap.xml\n`);
console.log("pages", urls.length, urls.join("\n"));
