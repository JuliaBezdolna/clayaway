// English versions of the indexable pages (called from scripts/build_seo.mjs after the Ukrainian pages are written).
// (The English Academy pages /en/learn/… are written by scripts/build_academy.mjs.)
//
//   docs/en/glossary/ + /<id>/      English glossary            ↔ docs/glossary/ + /<id>/
//   docs/rules/en/categories/       English FITASC categories   ↔ docs/rules/categories/
// Every pair gets <link rel="alternate" hreflang="uk|en|x-default">; x-default = English (international audience).
// The Ukrainian pages are patched in place (hreflang block inserted after their canonical link), so run the whole
// build_seo.mjs, not this file alone. Links to FITASC stay rel="nofollow noopener noreferrer".
import { mkdirSync, writeFileSync, readFileSync } from "fs";

export function buildEnglish() {
  const { BASE, TODAY, DOCS = "docs", BOOKS, NAMES, GLOSS, GBY, ACADEMY, CSS, NF, esc, tm, tmMeta, dispTerm, fitTitle, fitDesc, legal, rid, crumbs, langSwitch, frOwn, GS, glossaryIndexList, catMore, crumbLd } = globalThis.SEO;
  const out = [];
  const TM = "Parcours de Chasse – Sporting™ and Compak® Sporting are trademarks of FITASC.";

  const alt = (uk, en) => `<link rel="alternate" hreflang="uk" href="${uk}">\n<link rel="alternate" hreflang="en" href="${en}">\n<link rel="alternate" hreflang="x-default" href="${en}">`;
  // Insert (or refresh) the hreflang block in an existing Ukrainian page.
  const patchUk = (file, uk, en) => {
    let s; try { s = readFileSync(file, "utf8"); } catch (e) { return; }
    s = s.replace(/\n<!-- hreflang -->[\s\S]*?<!-- \/hreflang -->/, "");
    s = s.replace(/(<link rel="canonical" href="[^"]*">)/, `$1\n<!-- hreflang -->\n${alt(uk, en)}\n<!-- /hreflang -->`);
    writeFileSync(file, s);
  };
  const head = ({ title, desc, url, uk, en, ld, img = "rules", css = "" }) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="index, follow, max-image-preview:large">
<link rel="canonical" href="${url}">
${alt(uk, en)}
<meta property="og:type" content="article"><meta property="og:site_name" content="ClayArena">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}"><meta property="og:image" content="${BASE}og/${img}.png">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:type" content="image/png">
<meta property="og:locale" content="en_GB"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${BASE}og/${img}.png">
<meta name="theme-color" content="#030712"><link rel="icon" type="image/png" href="${BASE}og/favicon.png">
${ld.map(x => `<script type="application/ld+json">${JSON.stringify(x)}</script>`).join("\n")}
<style>${CSS}.kp{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:12px 16px;margin:14px 0}.box{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:12px 14px;margin:10px 0}.list{columns:3 220px;column-gap:24px}.list a{display:block;padding:2px 0;text-decoration:none;color:var(--soft)}article p{font-size:17px;line-height:1.75}table{border-collapse:collapse;width:100%;font-size:14.5px}td,th{border-bottom:1px solid var(--line);padding:9px 10px;text-align:left;vertical-align:top}.tw{overflow-x:auto;border:1px solid var(--line);border-radius:12px}${css}</style>
</head>
<body>`;
  // Page header: the section as a breadcrumb (no second logo; the ONE ClayArena logo is in the project bar, docs/shared/nav.js)
  // and the language switcher (glossary pages: between <!-- langs --> markers, build_seo_i18n.mjs fills in every language of the term).
  const bar = (crumbsHtml, enUrl, ukUrl, marked) => `<header><div class="in">${crumbsHtml}<span style="flex:1"></span>${marked ? "<!-- langs -->" : ""}${langSwitch("en", [{ l: "uk", url: ukUrl }, { l: "en", url: enUrl }])}${marked ? "<!-- /langs -->" : ""}</div></header>`;

  // ---- glossary
  if (GLOSS) {
    const SET = { "@type": "DefinedTermSet", name: "ClayArena clay shooting glossary", url: BASE + "en/glossary/", inLanguage: "en" };
    for (const t of GLOSS.terms) {
      const uk = `${BASE}glossary/${t.id}/`, en = `${BASE}en/glossary/${t.id}/`;
      const name = dispTerm(t);
      const title = fitTitle(`${name} — clay shooting term | ClayArena glossary`, `${name} | ClayArena glossary`);
      // meta + og:description: fitDesc() runs tmMeta(), the FITASC-mark safety net of build_seo.mjs (audit legal-02)
      const desc = fitDesc(tm(`${t.term}: ${t.short_en || ""}`), "Clay shooting term — ClayArena glossary.", `en/glossary/${t.id}/`);
      const refs = (t.rule_refs || []).map(r => `<li><a href="${BASE}rules/en/${r.book}/#${r.id}">${esc(r.ref)}</a> · ${NAMES[r.book]} · <a href="${esc(BOOKS[r.book].source.url)}#page=${r.page}" ${NF}>PDF ${r.page}</a></li>`).join("");
      const disc = ["sporting", "compak"].filter(k => t.disciplines_en && t.disciplines_en[k]).map(k => `<div class="box"><b>${NAMES[k]}</b><p>${esc(t.disciplines_en[k])}</p></div>`).join("");
      const rel = (t.related || []).map(rid).filter(r => GBY[r] && r !== t.id).map(r => `<a class="btn" style="padding:3px 10px;font-size:13px" href="${BASE}en/glossary/${r}/">${esc(dispTerm(GBY[r]))}</a>`).join(" ");
      // "Learn it": Academy lessons that teach the term (scripts/build_academy.mjs learnLinks)
      const learn = ACADEMY.learnLinks(t.id, "en").slice(0, 6).map(x => `<li><a href="${esc(x.url)}">${esc(x.title)}</a> · ${esc(x.context)}</li>`).join("");
      const ld = [{ "@context": "https://schema.org", "@type": "DefinedTerm", name, alternateName: [...new Set([t.term, ...(t.aka || [])])].filter(a => a !== name), description: tmMeta(t.short_en, `en/glossary/${t.id}/`), termCode: t.id, url: en, inDefinedTermSet: SET, inLanguage: "en" },
        crumbLd([{ name: "Glossary", url: `${BASE}en/glossary/` }, { name, url: en }])];
      const html = head({ title, desc, url: en, uk, en, ld, img: "glossary", css: GS.CSS }) + bar(crumbs("en", "📖", [{ label: "Glossary", url: `${BASE}en/glossary/` }, { label: name }]), en, uk, true) + `
<main style="max-width:900px;margin:0 auto;padding:20px 16px 72px">
${GS.mini("en", esc)}<div class="src">${esc(t.cat)}</div><h1>${esc(name)}</h1>${t.aka?.length ? `<p class="ref">Also: ${esc(t.aka.join(", "))}</p>` : ""}
<h2>What it is</h2><p><b>${esc(t.short_en)}</b></p>
${t.long_en ? `<h2>In detail</h2><p>${esc(t.long_en)}</p>` : ""}
${disc ? `<h2>In Sporting™ and Compak® Sporting</h2>${disc}` : ""}
${refs ? `<h2>Where it is in the rules</h2><ul>${refs}</ul>` : ""}
${t.source_url ? `<p class="ref">Source: <a href="${esc(t.source_url)}" ${NF}>FITASC ↗</a>${t.source_url.includes("categories") ? ` · <a href="${BASE}rules/en/categories/">FITASC categories</a>` : ""}</p>` : ""}
${learn ? `<h2>Learn it</h2><ul>${learn}</ul>` : ""}
${rel ? `<h2>Related terms</h2><p>${rel}</p>` : ""}${catMore("en", t, GLOSS.terms, { cat: c => c, url: x => `${BASE}en/glossary/${x.id}/`, html: x => esc(dispTerm(x)), list: `${BASE}en/glossary/`, skip: (t.related || []).map(rid) })}
<div class="disc">ClayArena glossary, based on our summary of the FITASC rulebooks. Only the official FITASC text applies. ${TM}</div>${legal("en")}</main></body></html>`;
      mkdirSync(`${DOCS}/en/glossary/${t.id}`, { recursive: true });
      writeFileSync(`${DOCS}/en/glossary/${t.id}/index.html`, html);
      patchUk(`${DOCS}/glossary/${t.id}/index.html`, uk, en);
      out.push(en);
    }
    writeFileSync(`${DOCS}/en/glossary/index.html`, head({ title: `Clay shooting glossary — ${GLOSS.terms.length} terms | ClayArena`, desc: "Sporting™ and Compak® Sporting terms explained in plain English, with links to the FITASC rules and to beginner lessons.", url: BASE + "en/glossary/", uk: BASE + "glossary/", en: BASE + "en/glossary/",
      ld: [{ "@context": "https://schema.org", ...SET, hasDefinedTerm: GLOSS.terms.map(t => ({ "@type": "DefinedTerm", name: dispTerm(t), url: `${BASE}en/glossary/${t.id}/` })) }], img: "glossary", css: GS.CSS }) + bar(crumbs("en", "📖", [{ label: "Glossary" }]), BASE + "en/glossary/", BASE + "glossary/", true) + `
<main style="max-width:900px;margin:0 auto;padding:20px 16px 72px"><div class="src">ClayArena</div><h1>Clay shooting glossary</h1><p>${GLOSS.terms.length} terms of Sporting™ and Compak® Sporting, explained in plain English with links to the FITASC rules and to ClayArena Academy lessons.</p>
${glossaryIndexList("en", GLOSS.terms, { cat: c => c, url: t => `${BASE}en/glossary/${t.id}/`, html: t => esc(dispTerm(t)), short: t => t.short_en })}
<div class="disc">${TM}</div>${legal("en")}</main></body></html>`);
    patchUk(`${DOCS}/glossary/index.html`, BASE + "glossary/", BASE + "en/glossary/");
    out.push(BASE + "en/glossary/");
  }

  // ---- categories
  const C = globalThis.window && window.FITASC_CATEGORIES;
  if (C) {
    const uk = BASE + "rules/categories/", en = BASE + "rules/en/categories/";
    const from = C.valid_from.split("-").reverse().join(".");
    // the FITASC French name only when it is another word (frOwn of build_seo.mjs): "Lady (Dame)", but "Junior" and "Veteran"
    const rows = C.categories.map(c => `<tr id="${esc(c.id)}"><td><b>${esc(c.name_en)}</b>${frOwn(c) ? ` <span class="ref">(${esc(c.name_fr)})</span>` : ""}</td><td>${c.to_age ? `${c.from_age}–${c.to_age}` : `${c.from_age}+`}</td><td>${esc(c.rule_en)}</td></tr>`).join("");
    const teams = (C.teams || []).map(t => `<tr><td><b>${esc(t.team)}</b></td><td>${esc(t.eligible_en)}</td><td>${esc(String(t.size || ""))}</td><td>${esc(t.note_en || "")}</td></tr>`).join("");
    const faq = C.categories.map(c => ({ "@type": "Question", name: `Who is a ${c.name_en} in clay shooting (FITASC)?`, acceptedAnswer: { "@type": "Answer", text: c.rule_en } }));
    const title = "FITASC categories: Junior, Lady, Men, Senior, Veteran, Master — ages | ClayArena";
    const html = head({ title, desc: `Who is a Junior, Lady, Senior, Veteran or Master in Sporting™ and Compak® Sporting: FITASC age limits from ${from} and national team rules.`, url: en, uk, en,
      ld: [{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq }] }) + bar(crumbs("en", "📘", [{ label: "FITASC rules", url: `${BASE}rules/?lang=en`, vl: 1 }, { label: "Categories" }]), en, uk) + `
<main style="max-width:900px;margin:0 auto;padding:20px 16px 72px">
<div class="src">FITASC · Sporting™ · Compak® Sporting</div><h1>FITASC categories: who is a Junior, Lady, Senior, Veteran, Master</h1>
<p>The age categories are the same for Parcours de Chasse – Sporting™ and Compak® Sporting, valid from ${from}. Only the <b>year</b> of birth counts, not the day or month. National and club events may use their own categories — check the competition programme.</p>
<h2>Categories and ages</h2><div class="tw"><table><thead><tr><th>Category</th><th>Age</th><th>Rule</th></tr></thead><tbody>${rows}</tbody></table></div>
${teams ? `<h2>National teams</h2><div class="tw"><table><thead><tr><th>Team</th><th>Eligible</th><th>Size</th><th>Note</th></tr></thead><tbody>${teams}</tbody></table></div>` : ""}
${(C.notes_en || []).length ? `<ul>${C.notes_en.map(n => `<li>${esc(n)}</li>`).join("")}</ul>` : ""}
<p class="src">Source: <a href="${esc(C.source_url)}" ${NF}>FITASC — Catégories, limites d'âge ↗</a> · ${TODAY}</p>
<div class="disc">Our summary of the official FITASC categories; only the FITASC text applies. ${TM}</div>${legal("en")}</main></body></html>`;
    mkdirSync(`${DOCS}/rules/en/categories`, { recursive: true });
    writeFileSync(`${DOCS}/rules/en/categories/index.html`, html);
    patchUk(`${DOCS}/rules/categories/index.html`, uk, en);
    out.push(en);
  }
  return out;
}
