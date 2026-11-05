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
// Term labels (owner rule 08.10.2026): the headword (h1, title, breadcrumb), the index list and the related terms are "English (local)"
// through the ONE helper docs/shared/terms.js (SEO.termLabel / termHtml of build_seo.mjs); "So sagt man" below the h1 stays.
// "Learn it" links: the Academy lessons that teach the term (scripts/build_academy.mjs learnLinks): the lesson in this language
// when it exists, else the English lesson labelled "(in English)". The Academy pages themselves are written by build_academy.mjs.
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "fs";

const UI = {
  de: { gl: "Glossar", title: "{t} — Begriff im Wurfscheibenschießen | ClayArena Glossar", what: "Was es ist", detail: "Ausführlich", disc: "In Sporting™ und Compak® Sporting", rules: "In den Regeln", learn: "Lernen", acad_en: "ClayArena-Akademie (auf Englisch)", ia: "ClayArena Dolmetscher-Akademie", rel: "Verwandte Begriffe", local: "So sagt man", list: "Glossar des Wurfscheibenschießens — {n} Begriffe", intro: "{n} Begriffe aus Sporting™ und Compak® Sporting, einfach erklärt, mit Links zu den FITASC-Regeln.", tm: "Parcours de Chasse – Sporting™ und Compak® Sporting sind Marken der FITASC. Nur der offizielle FITASC-Text ist verbindlich.", locale: "de_DE" },
  fr: { gl: "Glossaire", title: "{t} — terme de tir aux plateaux | Glossaire ClayArena", what: "Définition", detail: "En détail", disc: "En Sporting™ et Compak® Sporting", rules: "Dans le règlement", learn: "Apprendre", acad_en: "Académie ClayArena (en anglais)", ia: "Académie des interprètes ClayArena", rel: "Termes liés", local: "Usage", list: "Glossaire du tir aux plateaux — {n} termes", intro: "{n} termes du Sporting™ et du Compak® Sporting expliqués simplement, avec des liens vers les règles FITASC.", tm: "Parcours de Chasse – Sporting™ et Compak® Sporting sont des marques de la FITASC. Seul le texte officiel de la FITASC fait foi.", locale: "fr_FR" },
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
// "So sagt man: …" under the h1 only when term_local adds something to the h1 label (review 08.10.2026): not for de "Rabbit (Rollhase)" +
// "Rollhase", fr "Pull-away (départ sur le plateau)" + the same, or a local word the label does not show because it is the English one
// ("Swing-Through"); yes for fr "Point de prise (d'acquisition)" (h1 "Pick-up point (point de prise)").
const flatTL = s => String(s || "").normalize("NFC").toLowerCase().replace(/[™®]/g, "").replace(/\s+/g, " ").trim();
const addsToH1 = (tl, lb) => !!tl && !!lb.local && flatTL(tl) !== flatTL(lb.local) && flatTL(tl) !== flatTL(lb.label);

export async function buildI18n() {
  const { BASE, DOCS = "docs", BOOKS, NAMES, GLOSS, GBY, ACADEMY, CSS, NF, esc, tm, tmMeta, dispTerm, fitTitle, fitDesc, legal, rid, crumbs, langSwitch, termLabel, termHtml, GS, glossaryIndexList } = globalThis.SEO;
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
  const termUrl = (lang, id) => lang === "uk" ? `${BASE}glossary/${id}/` : `${BASE}${lang}/glossary/${id}/`;
  const listUrl = lang => lang === "uk" ? `${BASE}glossary/` : `${BASE}${lang}/glossary/`;
  const ALL = ["uk", "en", ...langs];
  // hreflang block; with `id` only the languages that have that term.
  const alts = (fn, id) => ALL.filter(l => !id || has(l, id)).map(l => `<link rel="alternate" hreflang="${l}" href="${fn(l)}">`).join("\n") + `\n<link rel="alternate" hreflang="x-default" href="${fn("en")}">`;
  const patch = (file, fn, id) => { if (!existsSync(file)) return; let s = readFileSync(file, "utf8");
    s = s.replace(/\n<!-- hreflang -->[\s\S]*?<!-- \/hreflang -->/, "").replace(/\n<link rel="alternate" hreflang="[^"]+" href="[^"]+">/g, "");
    s = s.replace(/(<link rel="canonical" href="[^"]*">)/, `$1\n<!-- hreflang -->\n${alts(fn, id)}\n<!-- /hreflang -->`); writeFileSync(file, s); };
  // ONE language switcher for every glossary page (build_seo.mjs langSwitch): every language that has this term (or, on the
  // index pages, every glossary language), native names, the current language marked. The uk and en pages are written before
  // the other languages are known: their switcher sits between <!-- langs --> markers and is refreshed below (patch).
  const langBtns = (lang, fn, id) => langSwitch(lang, ALL.filter(l => !id || has(l, id)).map(l => ({ l, url: fn(l) })));
  const patchLangs = (file, lang, fn, id) => { if (!existsSync(file)) return; const s = readFileSync(file, "utf8");
    const n = s.replace(/<!-- langs -->[\s\S]*?<!-- \/langs -->/, `<!-- langs -->${langBtns(lang, fn, id)}<!-- /langs -->`); if (n !== s) writeFileSync(file, n); };
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
        const url = termUrl(lang, t.id), name = dispTerm(t), lb = termLabel(lang, t); // lb.label = "Rabbit (Rollhase)"
        // <title> at most 65 characters (audit W-07): full, else "label | site", else "English | site" (h1 and og:title keep the label)
        const title = fitTitle(fill(U.title, "t", lb.label), fitTitle(`${lb.label} | ${U.site}`, `${lb.head} | ${U.site}`));
        // meta + og:description from the translated definition. Declined marks ("Compaku", "Sportingban") are not caught by tm(); the
        // definitions use the base form ("Sporting™", "Compak® Sporting"), and fitDesc() runs tmMeta(), the safety net of build_seo.mjs (audit legal-02).
        const desc = fitDesc(tm(`${t.term}: ${x.short}`), ctx, `${lang}/glossary/${t.id}/`);
        // the rules exist in uk/en: the English rule page, with ?lang so the visitor language stays (docs/shared/nav.js)
        const refs = (t.rule_refs || []).map(r => `<li><a href="${BASE}rules/en/${r.book}/?lang=${lang}#${r.id}" hreflang="en">${CHW[lang]} ${chapOf(r)}</a> · ${NAMES[r.book]} · <a href="${esc(BOOKS[r.book].source.url)}#page=${r.page}" ${NF}>PDF, ${PG[lang]} ${r.page}</a></li>`).join("");
        const disc = Object.entries(x.disciplines || {}).filter(([, v]) => v).map(([k, v]) => `<div class="box"><b>${NAMES[k] || k}</b><p>${esc(v)}</p></div>`).join("");
        const rel = (t.related || []).map(rid).filter(r => GBY[r] && D[r] && r !== t.id).map(r => `<a class="btn" style="padding:3px 10px;font-size:13px" href="${termUrl(lang, r)}">${termHtml(lang, GBY[r])}</a>`).join(" ");
        const learn = ACADEMY.learnLinks(t.id, lang).slice(0, 5).map(x => x.lang === lang ? `<li><a href="${esc(x.url)}">${esc(x.title)}</a> · ${esc(x.context)}</li>`
          : `<li><a href="${esc(x.url)}" hreflang="${x.lang}" lang="${x.lang}">${esc(x.title)}</a> · ${esc(U.acad_en || x.context)}</li>`).join("");
        const ld = [{ "@context": "https://schema.org", "@type": "DefinedTerm", name, alternateName: [...new Set([t.term, x.term_local].filter(Boolean))].filter(a => a !== name), description: tmMeta(x.short, `${lang}/glossary/${t.id}/`), termCode: t.id, url, inDefinedTermSet: SET, inLanguage: lang }];
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
<style>${CSS}.box{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:12px 14px;margin:10px 0}${GS.CSS}</style>
</head>
<body>
<header><div class="in">${crumbs(lang, "📖", [{ label: U.gl, url: listUrl(lang) }, { label: lb.label }])}<span style="flex:1"></span>${langBtns(lang, l => termUrl(l, t.id), t.id)}</div></header>
<main style="max-width:900px;margin:0 auto;padding:20px 16px 72px">
${GS.mini(lang, esc)}<div class="src">${esc((CAT[lang] || {})[t.cat] || t.cat)}</div><h1>${termHtml(lang, t)}</h1>${addsToH1(x.term_local, lb) ? `<p class="ref">${U.local}: ${esc(x.term_local)}</p>` : ""}
<h2>${U.what}</h2><p><b>${esc(x.short)}</b></p>
${x.long ? `<h2>${U.detail}</h2><p>${esc(x.long)}</p>` : ""}
${disc ? `<h2>${U.disc}</h2>${disc}` : ""}
${refs ? `<h2>${U.rules}</h2><ul>${refs}</ul>` : ""}
${learn ? `<h2>${U.learn}</h2><ul>${learn}</ul>` : ""}
${rel ? `<h2>${U.rel}</h2><p>${rel}</p>` : ""}
<div class="disc">${U.tm}</div>${legal(lang)}</main></body></html>`;
        mkdirSync(`${DOCS}/${lang}/glossary/${t.id}`, { recursive: true });
        writeFileSync(`${DOCS}/${lang}/glossary/${t.id}/index.html`, html);
        out.push(url);
      }
      // Index: only categories that have at least one translated term; every heading in the page language.
      const cats = [...new Set(GLOSS.terms.filter(t => D[t.id]).map(t => t.cat))];
      const missing = cats.filter(c => !(CAT[lang] || {})[c]);
      if (missing.length) console.log(`WARNING: glossary ${lang}: no category name for ${missing.join(", ")} (add it to ui-${lang}.json "cat")`);
      const n = GLOSS.terms.filter(t => D[t.id]).length;
      const title = `${fill(U.list, "n", n)} | ClayArena`, desc = fill(U.intro, "n", n), url = listUrl(lang);
      writeFileSync(`${DOCS}/${lang}/glossary/index.html`, `<!doctype html>
<html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}">
<meta name="robots" content="index, follow, max-image-preview:large"><link rel="canonical" href="${url}">
<!-- hreflang -->
${alts(listUrl)}
<!-- /hreflang -->
${og({ lang, title, desc, url, U })}
<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", ...SET, inLanguage: lang, hasDefinedTerm: GLOSS.terms.filter(t => D[t.id]).map(t => ({ "@type": "DefinedTerm", name: dispTerm(t), url: termUrl(lang, t.id) })) })}</script>
<style>${CSS}.list{columns:3 220px;column-gap:24px}.list a{display:block;padding:2px 0;text-decoration:none;color:var(--soft)}${GS.CSS}</style></head>
<body><header><div class="in">${crumbs(lang, "📖", [{ label: U.gl }])}<span style="flex:1"></span>${langBtns(lang, listUrl)}</div></header>
<main style="max-width:900px;margin:0 auto;padding:20px 16px 72px"><div class="src">ClayArena</div><h1>${esc(fill(U.list, "n", n))}</h1><p>${esc(desc)}</p>
${glossaryIndexList(lang, GLOSS.terms.filter(t => D[t.id]), { cat: c => (CAT[lang] || {})[c] || c, url: t => termUrl(lang, t.id), html: t => termHtml(lang, t), short: t => D[t.id].short })}
<div class="disc">${U.tm}</div>${legal(lang)}</main></body></html>`);
      out.push(url);
    }
    // refresh hreflang on uk + en glossary pages: only the languages that have the term
    for (const t of GLOSS.terms) { patch(`${DOCS}/glossary/${t.id}/index.html`, l => termUrl(l, t.id), t.id); patch(`${DOCS}/en/glossary/${t.id}/index.html`, l => termUrl(l, t.id), t.id);
      patchLangs(`${DOCS}/glossary/${t.id}/index.html`, "uk", l => termUrl(l, t.id), t.id); patchLangs(`${DOCS}/en/glossary/${t.id}/index.html`, "en", l => termUrl(l, t.id), t.id); }
    patch(`${DOCS}/glossary/index.html`, listUrl); patch(`${DOCS}/en/glossary/index.html`, listUrl);
    patchLangs(`${DOCS}/glossary/index.html`, "uk", listUrl); patchLangs(`${DOCS}/en/glossary/index.html`, "en", listUrl);
  }

  // (The English Academy home /en/learn/ is written by scripts/build_academy.mjs.)
  return out;
}
