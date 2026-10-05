// Glossary in more ClayArena languages + English Academy landing (called from scripts/build_seo.mjs at the end).
//
// Data: docs/glossary/data/i18n/<lang>.js → window.GLOSSARY_I18N[lang].terms[id] = {term_local, short, long, disciplines}
// Output per language: docs/<lang>/glossary/ and docs/<lang>/glossary/<id>/ (DefinedTerm), headword stays English
// (that's how terms are said on the stand), the local usage is shown under it.
// hreflang: every glossary term page (uk, en, de, fr, it, es) lists all available languages; x-default = en.
// Also writes docs/en/learn/index.html — a static English landing of ClayArena Academy (modules + lessons).
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "fs";

const UI = {
  de: { gl: "Glossar", title: t => `${t} — Begriff im Wurfscheibenschießen | ClayArena Glossar`, what: "Was es ist", detail: "Ausführlich", disc: "In Sporting™ und Compak® Sporting", rules: "In den Regeln", learn: "Lernen (Englisch)", rel: "Verwandte Begriffe", local: "So sagt man", list: n => `Glossar des Wurfscheibenschießens — ${n} Begriffe`, intro: n => `${n} Begriffe aus Sporting™ und Compak® Sporting, einfach erklärt, mit Links zu den FITASC-Regeln.`, tm: "Parcours de Chasse – Sporting™ und Compak® Sporting sind Marken der FITASC. Nur der offizielle FITASC-Text ist verbindlich.", locale: "de_DE" },
  fr: { gl: "Glossaire", title: t => `${t} — terme de ball-trap | Glossaire ClayArena`, what: "Définition", detail: "En détail", disc: "En Sporting™ et Compak® Sporting", rules: "Dans le règlement", learn: "Apprendre (anglais)", rel: "Termes liés", local: "Usage", list: n => `Glossaire du ball-trap — ${n} termes`, intro: n => `${n} termes du Sporting™ et du Compak® Sporting expliqués simplement, avec des liens vers les règles FITASC.`, tm: "Parcours de Chasse – Sporting™ et Compak® Sporting sont des marques de la FITASC. Seul le texte officiel de la FITASC fait foi.", locale: "fr_FR" },
  it: { gl: "Glossario", title: t => `${t} — termine del tiro a volo | Glossario ClayArena`, what: "Che cos'è", detail: "In dettaglio", disc: "In Sporting™ e Compak® Sporting", rules: "Nel regolamento", learn: "Impara (inglese)", rel: "Termini correlati", local: "Uso", list: n => `Glossario del tiro a volo — ${n} termini`, intro: n => `${n} termini di Sporting™ e Compak® Sporting spiegati in modo semplice, con link al regolamento FITASC.`, tm: "Parcours de Chasse – Sporting™ e Compak® Sporting sono marchi FITASC. Fa fede solo il testo ufficiale FITASC.", locale: "it_IT" },
  es: { gl: "Glosario", title: t => `${t} — término del tiro al plato | Glosario ClayArena`, what: "Qué es", detail: "En detalle", disc: "En Sporting™ y Compak® Sporting", rules: "En el reglamento", learn: "Aprender (inglés)", rel: "Términos relacionados", local: "Uso", list: n => `Glosario del tiro al plato — ${n} términos`, intro: n => `${n} términos de Sporting™ y Compak® Sporting explicados de forma sencilla, con enlaces al reglamento FITASC.`, tm: "Parcours de Chasse – Sporting™ y Compak® Sporting son marcas de la FITASC. Solo el texto oficial de la FITASC es vinculante.", locale: "es_ES" },
};

export async function buildI18n() {
  const { BASE, BOOKS, NAMES, GLOSS, GBY, LEARN, LESSON, CSS, NF, esc } = globalThis.SEO;
  const out = [];
  const langs = [];
  for (const lang of Object.keys(UI)) { try { await import(`../docs/glossary/data/i18n/${lang}.js`); if (window.GLOSSARY_I18N?.[lang]) langs.push(lang); } catch (e) { /* not translated yet */ } }
  const termUrl = (lang, id) => lang === "uk" ? `${BASE}glossary/${id}/` : `${BASE}${lang}/glossary/${id}/`;
  const listUrl = lang => lang === "uk" ? `${BASE}glossary/` : `${BASE}${lang}/glossary/`;
  const alts = (fn) => ["uk", "en", ...langs].map(l => `<link rel="alternate" hreflang="${l}" href="${fn(l)}">`).join("\n") + `\n<link rel="alternate" hreflang="x-default" href="${fn("en")}">`;
  const patch = (file, fn) => { if (!existsSync(file)) return; let s = readFileSync(file, "utf8");
    s = s.replace(/\n<!-- hreflang -->[\s\S]*?<!-- \/hreflang -->/, "").replace(/\n<link rel="alternate" hreflang="[^"]+" href="[^"]+">/g, "");
    s = s.replace(/(<link rel="canonical" href="[^"]*">)/, `$1\n<!-- hreflang -->\n${alts(fn)}\n<!-- /hreflang -->`); writeFileSync(file, s); };

  if (GLOSS && langs.length) {
    for (const lang of langs) {
      const U = UI[lang], D = window.GLOSSARY_I18N[lang].terms;
      const SET = { "@type": "DefinedTermSet", name: `ClayArena ${U.gl}`, url: listUrl(lang) };
      for (const t of GLOSS.terms) {
        const x = D[t.id]; if (!x) continue;
        const url = termUrl(lang, t.id);
        const refs = (t.rule_refs || []).map(r => `<li><a href="${BASE}rules/en/${r.book}/#${r.id}">${esc(r.ref)}</a> · ${NAMES[r.book]} · <a href="${esc(BOOKS[r.book].source.url)}#page=${r.page}" ${NF}>PDF ${r.page}</a></li>`).join("");
        const disc = Object.entries(x.disciplines || {}).filter(([, v]) => v).map(([k, v]) => `<div class="box"><b>${NAMES[k] || k}</b><p>${esc(v)}</p></div>`).join("");
        const rel = (t.related || []).filter(r => GBY[r] && D[r]).map(r => `<a class="btn" style="padding:3px 10px;font-size:13px" href="${termUrl(lang, r)}">${esc(GBY[r].term)}</a>`).join(" ");
        const learn = (t.learn || []).filter(id => LESSON[id]).slice(0, 4).map(id => `<li><a href="${BASE}en/learn/${id}/">${esc(LESSON[id].title_en)}</a></li>`).join("");
        const ld = [{ "@context": "https://schema.org", "@type": "DefinedTerm", name: t.term, alternateName: x.term_local && x.term_local !== t.term ? [x.term_local] : [], description: x.short, termCode: t.id, url, inDefinedTermSet: SET, inLanguage: lang }];
        const html = `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(U.title(t.term))}</title>
<meta name="description" content="${esc(`${t.term}: ${x.short}`.slice(0, 300))}">
<meta name="robots" content="index, follow, max-image-preview:large">
<link rel="canonical" href="${url}">
<!-- hreflang -->
${alts(l => termUrl(l, t.id))}
<!-- /hreflang -->
<meta property="og:type" content="article"><meta property="og:site_name" content="ClayArena"><meta property="og:title" content="${esc(U.title(t.term))}">
<meta property="og:description" content="${esc(x.short)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${BASE}og/glossary.png">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:locale" content="${U.locale}">
<meta name="twitter:card" content="summary_large_image"><meta name="theme-color" content="#030712"><link rel="icon" type="image/png" href="${BASE}og/favicon.png">
${ld.map(o => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join("\n")}
<style>${CSS}.box{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:12px 14px;margin:10px 0}</style>
</head>
<body>
<header><div class="in"><a class="logo" href="${listUrl(lang)}"><b>ClayArena</b></a><nav class="crumbs"><a href="${listUrl(lang)}">${U.gl}</a></nav><span style="flex:1"></span>${["uk", "en", ...langs].filter(l => l !== lang).map(l => `<a class="btn" style="padding:3px 9px;font-size:12px" hreflang="${l}" href="${termUrl(l, t.id)}">${l.toUpperCase()}</a>`).join(" ")}</div></header>
<main style="max-width:900px;margin:0 auto;padding:20px 16px 72px">
<div class="src">${esc(t.cat)}</div><h1>${esc(t.term)}</h1>${x.term_local && x.term_local !== t.term ? `<p class="ref">${U.local}: ${esc(x.term_local)}</p>` : ""}
<h2>${U.what}</h2><p><b>${esc(x.short)}</b></p>
${x.long ? `<h2>${U.detail}</h2><p>${esc(x.long)}</p>` : ""}
${disc ? `<h2>${U.disc}</h2>${disc}` : ""}
${refs ? `<h2>${U.rules}</h2><ul>${refs}</ul>` : ""}
${learn ? `<h2>${U.learn}</h2><ul>${learn}</ul>` : ""}
${rel ? `<h2>${U.rel}</h2><p>${rel}</p>` : ""}
<div class="disc">${U.tm}</div></main></body></html>`;
        mkdirSync(`docs/${lang}/glossary/${t.id}`, { recursive: true });
        writeFileSync(`docs/${lang}/glossary/${t.id}/index.html`, html);
        out.push(url);
      }
      const cats = [...new Set(GLOSS.terms.map(t => t.cat))];
      writeFileSync(`docs/${lang}/glossary/index.html`, `<!doctype html>
<html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(U.list(GLOSS.terms.length))} | ClayArena</title><meta name="description" content="${esc(U.intro(GLOSS.terms.length))}">
<meta name="robots" content="index, follow"><link rel="canonical" href="${listUrl(lang)}">
<!-- hreflang -->
${alts(listUrl)}
<!-- /hreflang -->
<meta property="og:image" content="${BASE}og/glossary.png"><link rel="icon" type="image/png" href="${BASE}og/favicon.png">
<style>${CSS}.list{columns:3 220px;column-gap:24px}.list a{display:block;padding:2px 0;text-decoration:none;color:var(--soft)}</style></head>
<body><header><div class="in"><a class="logo" href="${listUrl(lang)}"><b>ClayArena</b></a><nav class="crumbs">${U.gl}</nav></div></header>
<main style="max-width:900px;margin:0 auto;padding:20px 16px 72px"><h1>${esc(U.list(GLOSS.terms.length))}</h1><p>${esc(U.intro(GLOSS.terms.length))}</p>
${cats.map(c => `<h2>${esc(c)}</h2><div class="list">${GLOSS.terms.filter(t => t.cat === c && D[t.id]).sort((a, b) => a.term.localeCompare(b.term)).map(t => `<a href="${termUrl(lang, t.id)}">${esc(t.term)}</a>`).join("")}</div>`).join("\n")}
<div class="disc">${U.tm}</div></main></body></html>`);
      out.push(listUrl(lang));
    }
    // refresh hreflang on uk + en glossary pages to include all languages
    for (const t of GLOSS.terms) { patch(`docs/glossary/${t.id}/index.html`, l => termUrl(l, t.id)); patch(`docs/en/glossary/${t.id}/index.html`, l => termUrl(l, t.id)); }
    patch("docs/glossary/index.html", listUrl); patch("docs/en/glossary/index.html", listUrl);
  }

  // English Academy landing (static, indexable): modules with their lessons.
  const enUrl = `${BASE}en/learn/`;
  mkdirSync("docs/en/learn", { recursive: true });
  writeFileSync("docs/en/learn/index.html", `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>ClayArena Academy — clay shooting from zero</title>
<meta name="description" content="Free beginner lessons on clay shooting: Sporting™ and Compak® Sporting, safety, shotguns, chokes, cartridges, targets, technique, competitions, FITASC rules and culture.">
<meta name="robots" content="index, follow"><link rel="canonical" href="${enUrl}">
<link rel="alternate" hreflang="uk" href="${BASE}learn/"><link rel="alternate" hreflang="en" href="${enUrl}"><link rel="alternate" hreflang="x-default" href="${enUrl}">
<meta property="og:title" content="ClayArena Academy — clay shooting from zero"><meta property="og:image" content="${BASE}og/learn.png"><meta property="og:url" content="${enUrl}">
<link rel="icon" type="image/png" href="${BASE}og/favicon.png">
<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@type": "Course", name: "ClayArena Academy — clay shooting from zero", url: enUrl, inLanguage: "en", isAccessibleForFree: true, provider: { "@type": "Organization", name: "ClayArena", url: "https://clayarena.com/" }, hasPart: LEARN.flatMap(m => m.lessons.map(l => ({ "@type": "LearningResource", name: l.title_en, url: `${BASE}en/learn/${l.id}/` }))) })}</script>
<style>${CSS}.mods{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px}.mod{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:14px 16px}.mod ol{margin:6px 0 0;padding-left:20px;font-size:14px}</style></head>
<body><header><div class="in"><a class="logo" href="${enUrl}"><b>ClayArena</b></a><nav class="crumbs">Academy</nav><span style="flex:1"></span><a class="btn" hreflang="uk" href="${BASE}learn/">Українською</a></div></header>
<main style="max-width:1040px;margin:0 auto;padding:20px 16px 72px"><h1>ClayArena Academy — clay shooting from zero</h1>
<p>${LEARN.reduce((s, m) => s + m.lessons.length, 0)} short lessons in ${LEARN.length} modules. Interactive version with quizzes and badges: <a href="${BASE}learn/">open the Academy</a> (switch to EN in the header).</p>
<div class="mods">${LEARN.map(m => `<div class="mod"><b>${m.order}. ${esc(m.title_en)}</b><p class="ref">${esc(m.intro_en)}</p><ol>${m.lessons.map(l => `<li><a href="${BASE}en/learn/${l.id}/">${esc(l.title_en)}</a></li>`).join("")}</ol></div>`).join("")}</div>
<div class="disc">Parcours de Chasse – Sporting™ and Compak® Sporting are trademarks of FITASC. Only the official FITASC text applies.</div></main></body></html>`);
  out.push(enUrl);
  return out;
}
