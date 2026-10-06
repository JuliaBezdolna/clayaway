// Glossary in more ClayArena languages + English Academy landing (called from scripts/build_seo.mjs at the end).
//
// Data: docs/glossary/data/i18n/<lang>.js → window.GLOSSARY_I18N[lang].terms[id] = {term_local, short, long, disciplines}
// Output per language: docs/<lang>/glossary/ and docs/<lang>/glossary/<id>/ (DefinedTerm), headword stays English
// (that's how terms are said on the stand), the local usage is shown under it.
// hreflang (audit G-14): a term page lists only the languages that really have that term (uk and en always; another
// ClayArena language only when its overlay has a translated `short`, i.e. when the page exists); x-default = en.
// Interface strings: de/fr/it below; cs, pl, pt, hu, fi, lt from docs/glossary/data/i18n/ui-<lang>.json
// ({t}/{n} placeholders, "cat", "ch", "pg", "learn", "acad_en", "ia"). Only ClayArena languages — never others.
// Every index page is fully localised (audit G-02): category names come from CAT/ui-<lang>.json ("Academy" included) and
// a category without a translated term is not printed at all.
// Also writes docs/en/learn/index.html — a static English landing of ClayArena Academy (modules + lessons).
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "fs";

const UI = {
  de: { gl: "Glossar", title: "{t} — Begriff im Wurfscheibenschießen | ClayArena Glossar", what: "Was es ist", detail: "Ausführlich", disc: "In Sporting™ und Compak® Sporting", rules: "In den Regeln", learn: "Lernen", acad_en: "ClayArena-Akademie (auf Englisch)", ia: "ClayArena Dolmetscher-Akademie", rel: "Verwandte Begriffe", local: "So sagt man", list: "Glossar des Wurfscheibenschießens — {n} Begriffe", intro: "{n} Begriffe aus Sporting™ und Compak® Sporting, einfach erklärt, mit Links zu den FITASC-Regeln.", tm: "Parcours de Chasse – Sporting™ und Compak® Sporting sind Marken der FITASC. Nur der offizielle FITASC-Text ist verbindlich.", locale: "de_DE" },
  fr: { gl: "Glossaire", title: "{t} — terme de ball-trap | Glossaire ClayArena", what: "Définition", detail: "En détail", disc: "En Sporting™ et Compak® Sporting", rules: "Dans le règlement", learn: "Apprendre", acad_en: "Académie ClayArena (en anglais)", ia: "Académie des interprètes ClayArena", rel: "Termes liés", local: "Usage", list: "Glossaire du ball-trap — {n} termes", intro: "{n} termes du Sporting™ et du Compak® Sporting expliqués simplement, avec des liens vers les règles FITASC.", tm: "Parcours de Chasse – Sporting™ et Compak® Sporting sont des marques de la FITASC. Seul le texte officiel de la FITASC fait foi.", locale: "fr_FR" },
  it: { gl: "Glossario", title: "{t} — termine del tiro a volo | Glossario ClayArena", what: "Che cos'è", detail: "In dettaglio", disc: "In Sporting™ e Compak® Sporting", rules: "Nel regolamento", learn: "Impara", acad_en: "Accademia ClayArena (in inglese)", ia: "Accademia degli interpreti ClayArena", rel: "Termini correlati", local: "Uso", list: "Glossario del tiro a volo — {n} termini", intro: "{n} termini di Sporting™ e Compak® Sporting spiegati in modo semplice, con link al regolamento FITASC.", tm: "Parcours de Chasse – Sporting™ e Compak® Sporting sono marchi FITASC. Fa fede solo il testo ufficiale FITASC.", locale: "it_IT" },
};

// More ClayArena languages: interface strings from ui-<lang>.json (written by translators; no code needed for a new language).
for (const l of ["cs", "pl", "pt", "hu", "fi", "lt"]) {
  const f = `docs/glossary/data/i18n/ui-${l}.json`; if (!existsSync(f)) continue;
  UI[l] = JSON.parse(readFileSync(f, "utf8"));
}
// "{t} — <clay shooting term> | <ClayArena glossary>" → the two parts, used for short titles and short descriptions.
for (const U of Object.values(UI)) {
  const m = U.title.match(/^\{t\}\s+[—–-]\s+(.+?)\s+\|\s+(.+)$/) || [null, U.gl, `ClayArena ${U.gl}`];
  U.kind = m[1]; U.site = m[2];
}
const fill = (s, k, v) => s.replace(`{${k}}`, v);

export async function buildI18n() {
  const { BASE, BOOKS, NAMES, GLOSS, GBY, LEARN, LESSON, INTERP = {}, CSS, NF, esc, tm, dispTerm, fitTitle, fitDesc, legal, rid, interpUrl } = globalThis.SEO;
  // Localised category names and the word "chapter" (rules and lessons exist only in UA/EN, so references show
  // "Kapitel 9" etc. and link to the English rules page; English rule headings are not printed on these pages).
  const CAT = {
    de: { "Appeals": "Proteste", "Discipline": "Disziplin", "Equipment": "Ausrüstung", "Ground & layout": "Gelände und Stände", "Organisation": "Organisation", "Penalties": "Strafen", "Refereeing": "Schiedsrichter", "Results": "Ergebnisse", "Safety & conduct": "Sicherheit und Verhalten", "Scoring": "Wertung", "Sequences & doubles": "Abfolgen und Doubletten", "Shooting rules": "Schießregeln", "Targets": "Wurfscheiben" },
    fr: { "Appeals": "Réclamations", "Discipline": "Discipline", "Equipment": "Équipement", "Ground & layout": "Terrain et postes", "Organisation": "Organisation", "Penalties": "Sanctions", "Refereeing": "Arbitrage", "Results": "Résultats", "Safety & conduct": "Sécurité et comportement", "Scoring": "Décompte", "Sequences & doubles": "Séquences et doublés", "Shooting rules": "Règles de tir", "Targets": "Plateaux" },
    it: { "Appeals": "Reclami", "Discipline": "Disciplina", "Equipment": "Attrezzatura", "Ground & layout": "Campo e pedane", "Organisation": "Organizzazione", "Penalties": "Sanzioni", "Refereeing": "Arbitraggio", "Results": "Risultati", "Safety & conduct": "Sicurezza e comportamento", "Scoring": "Punteggio", "Sequences & doubles": "Sequenze e doppietti", "Shooting rules": "Regole di tiro", "Targets": "Piattelli" } };
  const CHW = { de: "Kapitel", fr: "Chapitre", it: "Capitolo" }, PG = { de: "S.", fr: "p.", it: "p." };
  for (const l of Object.keys(UI)) { // categories / chapter words from ui-<lang>.json extend the built-in ones
    const f = `docs/glossary/data/i18n/ui-${l}.json`; if (!existsSync(f)) continue; const j = JSON.parse(readFileSync(f, "utf8"));
    CAT[l] = { ...(CAT[l] || {}), ...(j.cat || {}) }; if (j.ch) CHW[l] = j.ch; if (j.pg) PG[l] = j.pg; }
  const chapOf = r => { const b = BOOKS[r.book]; const sec = b && b.sections.find(x => x.items.some(i => i.id === r.id)); return sec ? sec.chapter : (r.ref.match(/\d+/) || [""])[0]; };
  const out = [];
  const langs = []; // only ClayArena site languages (en, uk, de, fr, it, cs, pl, pt, hu, fi, lt)
  for (const lang of Object.keys(UI)) { try { await import(`../docs/glossary/data/i18n/${lang}.js`); if (window.GLOSSARY_I18N?.[lang]) langs.push(lang); } catch (e) { /* not translated yet */ } }
  // Which terms each language really has (a page needs a translated definition). uk/en have every term.
  const HAS = Object.fromEntries(langs.map(l => [l, new Set(Object.entries(window.GLOSSARY_I18N[l].terms).filter(([, x]) => x.short).map(([id]) => id))]));
  const has = (l, id) => l === "uk" || l === "en" || (HAS[l] && HAS[l].has(id));
  // Interpreter Academy lesson titles per language (docs/interpreter/src/i18n/<lang>.json; English master as fallback).
  const IT = {};
  for (const l of langs) { try { const j = JSON.parse(readFileSync(`docs/interpreter/src/i18n/${l}.json`, "utf8")); IT[l] = {};
    for (const m of Object.values(j.missions || {})) for (const [id, x] of Object.entries(m.lessons || {})) if (x.title) IT[l][id] = x.title; } catch (e) { IT[l] = {}; } }
  const termUrl = (lang, id) => lang === "uk" ? `${BASE}glossary/${id}/` : `${BASE}${lang}/glossary/${id}/`;
  const listUrl = lang => lang === "uk" ? `${BASE}glossary/` : `${BASE}${lang}/glossary/`;
  const ALL = ["uk", "en", ...langs];
  // hreflang block; with `id` only the languages that have that term.
  const alts = (fn, id) => ALL.filter(l => !id || has(l, id)).map(l => `<link rel="alternate" hreflang="${l}" href="${fn(l)}">`).join("\n") + `\n<link rel="alternate" hreflang="x-default" href="${fn("en")}">`;
  const patch = (file, fn, id) => { if (!existsSync(file)) return; let s = readFileSync(file, "utf8");
    s = s.replace(/\n<!-- hreflang -->[\s\S]*?<!-- \/hreflang -->/, "").replace(/\n<link rel="alternate" hreflang="[^"]+" href="[^"]+">/g, "");
    s = s.replace(/(<link rel="canonical" href="[^"]*">)/, `$1\n<!-- hreflang -->\n${alts(fn, id)}\n<!-- /hreflang -->`); writeFileSync(file, s); };
  const langBtns = (lang, fn, id) => ALL.filter(l => l !== lang && (!id || has(l, id))).map(l => `<a class="btn" style="padding:3px 9px;font-size:12px" hreflang="${l}" href="${fn(l)}">${l.toUpperCase()}</a>`).join(" ");
  const og = ({ lang, title, desc, url, U }) => `<meta property="og:type" content="article"><meta property="og:site_name" content="ClayArena">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${url}">
<meta property="og:image" content="${BASE}og/glossary.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:type" content="image/png">
<meta property="og:locale" content="${U.locale}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${BASE}og/glossary.png">
<meta name="theme-color" content="#030712"><link rel="icon" type="image/png" href="${BASE}og/favicon.png">`;

  if (GLOSS && langs.length) {
    for (const lang of langs) {
      const U = UI[lang], D = Object.fromEntries(Object.entries(window.GLOSSARY_I18N[lang].terms).filter(([, x]) => x.short)); // a page needs a translated definition
      const SET = { "@type": "DefinedTermSet", name: `ClayArena ${U.gl}`, url: listUrl(lang) };
      const ctx = `${U.kind.charAt(0).toUpperCase() + U.kind.slice(1)} · ${U.site}.`;
      for (const t of GLOSS.terms) {
        const x = D[t.id]; if (!x) continue;
        const url = termUrl(lang, t.id), name = dispTerm(t);
        const title = fitTitle(fill(U.title, "t", name), `${name} | ${U.site}`);
        const desc = fitDesc(tm(`${t.term}: ${x.short}`), ctx);
        const refs = (t.rule_refs || []).map(r => `<li><a href="${BASE}rules/en/${r.book}/#${r.id}">${CHW[lang]} ${chapOf(r)}</a> · ${NAMES[r.book]} · <a href="${esc(BOOKS[r.book].source.url)}#page=${r.page}" ${NF}>PDF, ${PG[lang]} ${r.page}</a></li>`).join("");
        const disc = Object.entries(x.disciplines || {}).filter(([, v]) => v).map(([k, v]) => `<div class="box"><b>${NAMES[k] || k}</b><p>${esc(v)}</p></div>`).join("");
        const rel = (t.related || []).map(rid).filter(r => GBY[r] && D[r] && r !== t.id).map(r => `<a class="btn" style="padding:3px 10px;font-size:13px" href="${termUrl(lang, r)}">${esc(dispTerm(GBY[r]))}</a>`).join(" ");
        const learn = (t.learn || []).filter(id => LESSON[id]).slice(0, 4).map(id => `<li><a href="${BASE}en/learn/${id}/" hreflang="en" lang="en">${esc(tm(LESSON[id].title_en))}</a> · ${esc(U.acad_en)}</li>`).join("")
          + (t.interp || []).filter(id => INTERP[id]).slice(0, 3).map(id => `<li><a href="${interpUrl(lang, id)}">${esc(tm(IT[lang][id] || INTERP[id].title_en))}</a> · ${esc(U.ia)}</li>`).join("");
        const ld = [{ "@context": "https://schema.org", "@type": "DefinedTerm", name, alternateName: [...new Set([t.term, x.term_local].filter(Boolean))].filter(a => a !== name), description: tm(x.short), termCode: t.id, url, inDefinedTermSet: SET, inLanguage: lang }];
        const html = `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="index, follow, max-image-preview:large">
<link rel="canonical" href="${url}">
<!-- hreflang -->
${alts(l => termUrl(l, t.id), t.id)}
<!-- /hreflang -->
${og({ lang, title, desc, url, U })}
${ld.map(o => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join("\n")}
<style>${CSS}.box{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:12px 14px;margin:10px 0}</style>
</head>
<body>
<header><div class="in"><a class="logo" href="${listUrl(lang)}"><b>ClayArena</b></a><nav class="crumbs"><a href="${listUrl(lang)}">${U.gl}</a></nav><span style="flex:1"></span>${langBtns(lang, l => termUrl(l, t.id), t.id)}</div></header>
<main style="max-width:900px;margin:0 auto;padding:20px 16px 72px">
<div class="src">${esc((CAT[lang] || {})[t.cat] || t.cat)}</div><h1>${esc(name)}</h1>${x.term_local && x.term_local !== t.term ? `<p class="ref">${U.local}: ${esc(x.term_local)}</p>` : ""}
<h2>${U.what}</h2><p><b>${esc(x.short)}</b></p>
${x.long ? `<h2>${U.detail}</h2><p>${esc(x.long)}</p>` : ""}
${disc ? `<h2>${U.disc}</h2>${disc}` : ""}
${refs ? `<h2>${U.rules}</h2><ul>${refs}</ul>` : ""}
${learn ? `<h2>${U.learn}</h2><ul>${learn}</ul>` : ""}
${rel ? `<h2>${U.rel}</h2><p>${rel}</p>` : ""}
<div class="disc">${U.tm}</div>${legal(lang)}</main></body></html>`;
        mkdirSync(`docs/${lang}/glossary/${t.id}`, { recursive: true });
        writeFileSync(`docs/${lang}/glossary/${t.id}/index.html`, html);
        out.push(url);
      }
      // Index: only categories that have at least one translated term; every heading in the page language.
      const cats = [...new Set(GLOSS.terms.filter(t => D[t.id]).map(t => t.cat))];
      const missing = cats.filter(c => !(CAT[lang] || {})[c]);
      if (missing.length) console.log(`WARNING: glossary ${lang}: no category name for ${missing.join(", ")} (add it to ui-${lang}.json "cat")`);
      const n = GLOSS.terms.filter(t => D[t.id]).length;
      const title = `${fill(U.list, "n", n)} | ClayArena`, desc = fill(U.intro, "n", n), url = listUrl(lang);
      writeFileSync(`docs/${lang}/glossary/index.html`, `<!doctype html>
<html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}">
<meta name="robots" content="index, follow, max-image-preview:large"><link rel="canonical" href="${url}">
<!-- hreflang -->
${alts(listUrl)}
<!-- /hreflang -->
${og({ lang, title, desc, url, U })}
<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", ...SET, inLanguage: lang, hasDefinedTerm: GLOSS.terms.filter(t => D[t.id]).map(t => ({ "@type": "DefinedTerm", name: dispTerm(t), url: termUrl(lang, t.id) })) })}</script>
<style>${CSS}.list{columns:3 220px;column-gap:24px}.list a{display:block;padding:2px 0;text-decoration:none;color:var(--soft)}</style></head>
<body><header><div class="in"><a class="logo" href="${url}"><b>ClayArena</b></a><nav class="crumbs">${U.gl}</nav><span style="flex:1"></span>${langBtns(lang, listUrl)}</div></header>
<main style="max-width:900px;margin:0 auto;padding:20px 16px 72px"><div class="src">ClayArena</div><h1>${esc(fill(U.list, "n", n))}</h1><p>${esc(desc)}</p>
${cats.map(c => `<h2>${esc((CAT[lang] || {})[c] || c)}</h2><div class="list">${GLOSS.terms.filter(t => t.cat === c && D[t.id]).sort((a, b) => a.term.localeCompare(b.term)).map(t => `<a href="${termUrl(lang, t.id)}">${esc(dispTerm(t))}</a>`).join("")}</div>`).join("\n")}
<div class="disc">${U.tm}</div>${legal(lang)}</main></body></html>`);
      out.push(url);
    }
    // refresh hreflang on uk + en glossary pages: only the languages that have the term
    for (const t of GLOSS.terms) { patch(`docs/glossary/${t.id}/index.html`, l => termUrl(l, t.id), t.id); patch(`docs/en/glossary/${t.id}/index.html`, l => termUrl(l, t.id), t.id); }
    patch("docs/glossary/index.html", listUrl); patch("docs/en/glossary/index.html", listUrl);
  }

  // English Academy landing (static, indexable): modules with their lessons.
  const enUrl = `${BASE}en/learn/`;
  const lt = "ClayArena Academy — clay shooting from zero";
  const ld = "Free beginner lessons on clay shooting: Sporting™ and Compak® Sporting, safety, shotguns, chokes, cartridges, targets, technique, competitions, FITASC rules and culture.";
  mkdirSync("docs/en/learn", { recursive: true });
  writeFileSync("docs/en/learn/index.html", `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${lt}</title>
<meta name="description" content="${ld}">
<meta name="robots" content="index, follow, max-image-preview:large"><link rel="canonical" href="${enUrl}">
<link rel="alternate" hreflang="uk" href="${BASE}learn/"><link rel="alternate" hreflang="en" href="${enUrl}"><link rel="alternate" hreflang="x-default" href="${enUrl}">
<meta property="og:type" content="website"><meta property="og:site_name" content="ClayArena"><meta property="og:title" content="${lt}"><meta property="og:description" content="${ld}"><meta property="og:url" content="${enUrl}">
<meta property="og:image" content="${BASE}og/learn.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:type" content="image/png">
<meta property="og:locale" content="en_GB"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${BASE}og/learn.png">
<meta name="theme-color" content="#030712"><link rel="icon" type="image/png" href="${BASE}og/favicon.png">
<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@type": "Course", name: lt, description: ld, url: enUrl, inLanguage: "en", isAccessibleForFree: true, provider: { "@type": "Organization", name: "ClayArena", url: "https://clayarena.com/" }, hasPart: LEARN.flatMap(m => m.lessons.map(l => ({ "@type": "LearningResource", name: tm(l.title_en), url: `${BASE}en/learn/${l.id}/` }))) })}</script>
<style>${CSS}.mods{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px}.mod{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:14px 16px}.mod ol{margin:6px 0 0;padding-left:20px;font-size:14px}</style></head>
<body><header><div class="in"><a class="logo" href="${enUrl}"><b>ClayArena</b></a><nav class="crumbs">ClayArena Academy</nav><span style="flex:1"></span><a class="btn" hreflang="uk" href="${BASE}learn/">Українською</a></div></header>
<main style="max-width:1040px;margin:0 auto;padding:20px 16px 72px"><h1>${lt}</h1>
<p>${LEARN.reduce((s, m) => s + m.lessons.length, 0)} short lessons in ${LEARN.length} modules. Interactive version with quizzes and badges: <a href="${BASE}learn/">open the Academy</a> (switch to EN in the header).</p>
<div class="mods">${LEARN.map(m => `<div class="mod"><b>${m.order}. ${esc(tm(m.title_en))}</b><p class="ref">${esc(m.intro_en)}</p><ol>${m.lessons.map(l => `<li><a href="${BASE}en/learn/${l.id}/">${esc(tm(l.title_en))}</a></li>`).join("")}</ol></div>`).join("")}</div>
<div class="disc">Parcours de Chasse – Sporting™ and Compak® Sporting are trademarks of FITASC. Only the official FITASC text applies.</div>${legal("en")}</main></body></html>`);
  out.push(enUrl);
  return out;
}
