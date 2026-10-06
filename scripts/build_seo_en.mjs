// English versions of the indexable pages (called from scripts/build_seo.mjs after the Ukrainian pages are written).
//
//   docs/en/learn/<lesson-id>/      English lesson pages        ↔ docs/learn/<lesson-id>/
//   docs/en/glossary/ + /<id>/      English glossary            ↔ docs/glossary/ + /<id>/
//   docs/rules/en/categories/       English FITASC categories   ↔ docs/rules/categories/
// Every pair gets <link rel="alternate" hreflang="uk|en|x-default">; x-default = English (international audience).
// The Ukrainian pages are patched in place (hreflang block inserted after their canonical link), so run the whole
// build_seo.mjs, not this file alone. Links to FITASC stay rel="nofollow noopener noreferrer".
import { mkdirSync, writeFileSync, readFileSync } from "fs";

export function buildEnglish() {
  const { BASE, TODAY, BOOKS, NAMES, GLOSS, GBY, LEARN, LESSON, INTERP = {}, CSS, NF, esc, tm, dispTerm, fitTitle, fitDesc, legal, rid, interpUrl } = globalThis.SEO;
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
  const head = ({ title, desc, url, uk, en, ld, img = "rules" }) => `<!doctype html>
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
<style>${CSS}.kp{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:12px 16px;margin:14px 0}.box{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:12px 14px;margin:10px 0}.list{columns:3 220px;column-gap:24px}.list a{display:block;padding:2px 0;text-decoration:none;color:var(--soft)}article p{font-size:17px;line-height:1.75}table{border-collapse:collapse;width:100%;font-size:14.5px}td,th{border-bottom:1px solid var(--line);padding:9px 10px;text-align:left;vertical-align:top}.tw{overflow-x:auto;border:1px solid var(--line);border-radius:12px}</style>
</head>
<body>`;
  const bar = (home, crumbs, ukUrl) => `<header><div class="in"><a class="logo" href="${home}"><b>ClayArena</b></a><nav class="crumbs">${crumbs}</nav><span style="flex:1"></span><a class="btn" href="${ukUrl}" hreflang="uk">Українською</a></div></header>`;

  // ---- lessons
  for (const m of LEARN) m.lessons.forEach((l, i) => {
    const uk = `${BASE}learn/${l.id}/`, en = `${BASE}en/learn/${l.id}/`, next = m.lessons[i + 1];
    const name = tm(l.title_en), sum = tm(l.summary_en);
    const title = fitTitle(`${name} — ClayArena Academy`, `${name} | ClayArena`);
    const ld = [{ "@context": "https://schema.org", "@type": "LearningResource", name, description: sum, url: en, inLanguage: "en",
      learningResourceType: "Lesson", educationalLevel: "Beginner", timeRequired: `PT${l.minutes || 4}M`, isAccessibleForFree: true,
      isPartOf: { "@type": "Course", name: "ClayArena Academy — clay shooting from zero", url: BASE + "learn/" }, provider: { "@type": "Organization", name: "ClayArena", url: "https://clayarena.com/" } }];
    const terms = [...new Set((l.terms || []).map(rid))].filter(id => GBY[id]).map(id => `<a href="${BASE}en/glossary/${id}/">${esc(dispTerm(GBY[id]))}</a>`).join(" · ");
    const refs = (l.rule_refs || []).map(r => { const b = BOOKS[r.book]; const it = b && b.sections.flatMap(s => s.items).find(x => x.id === r.id); return it ? `<li><a href="${BASE}rules/en/${r.book}/#${it.id}">${esc(it.ref)}</a> · ${NAMES[r.book]}</li>` : ""; }).join("");
    const src = (l.sources || []).map(x => `<li><a href="${esc(x.url)}" ${NF}>${esc(x.title_en || x.title)} ↗</a></li>`).join("");
    const html = head({ title, desc: sum, url: en, uk, en, ld, img: "learn" }) + bar(`${BASE}en/learn/`, `<a href="${BASE}en/learn/">ClayArena Academy</a> › ${esc(m.title_en)}`, uk) + `
<main style="max-width:780px;margin:0 auto;padding:20px 16px 72px"><article>
<div class="src">${esc(m.title_en)} · ${i + 1}/${m.lessons.length} · ${l.minutes || 4} min</div>
<h1>${esc(name)}</h1>
${(l.body_en || []).map(p => `<p>${esc(p)}</p>`).join("\n")}
<div class="kp"><b>Key points</b><ul>${(l.key_points_en || []).map(k => `<li>${esc(k)}</li>`).join("")}</ul></div>
${l.did_you_know_en ? `<p><b>Did you know?</b> ${esc(l.did_you_know_en)}</p>` : ""}
${terms ? `<h2>Terms</h2><p>${terms}</p>` : ""}
${refs ? `<h2>Where this is in the rules</h2><ul>${refs}</ul>` : ""}
${l.law_tables && globalThis.lawTablesHtml ? `<h2>Country laws</h2>` + globalThis.lawTablesHtml(l.law_tables, "en", esc, NF) : ""}
${src ? `<h2>Sources and laws</h2><ul>${src}</ul><p class="ref">As of the lesson date; not legal advice — check the current version of the law.</p>` : ""}
<div class="cta"><a class="btn primary" href="${BASE}learn/#${l.id}">Check yourself: 3 questions</a>${next ? `<a class="btn" href="${BASE}en/learn/${next.id}/">Next: ${esc(tm(next.title_en))}</a>` : ""}</div>
</article><div class="disc">ClayArena Academy. ${TM} FITASC rules are our summary; only the official FITASC text applies. Gun and ammunition laws differ by country.</div>${legal("en")}</main></body></html>`;
    mkdirSync(`docs/en/learn/${l.id}`, { recursive: true });
    writeFileSync(`docs/en/learn/${l.id}/index.html`, html);
    patchUk(`docs/learn/${l.id}/index.html`, uk, en);
    out.push(en);
  });

  // ---- glossary
  if (GLOSS) {
    const SET = { "@type": "DefinedTermSet", name: "ClayArena clay shooting glossary", url: BASE + "en/glossary/" };
    for (const t of GLOSS.terms) {
      const uk = `${BASE}glossary/${t.id}/`, en = `${BASE}en/glossary/${t.id}/`;
      const name = dispTerm(t);
      const title = fitTitle(`${name} — clay shooting term | ClayArena glossary`, `${name} | ClayArena glossary`);
      const desc = fitDesc(tm(`${t.term}: ${t.short_en || ""}`), "Clay shooting term — ClayArena glossary.");
      const refs = (t.rule_refs || []).map(r => `<li><a href="${BASE}rules/en/${r.book}/#${r.id}">${esc(r.ref)}</a> · ${NAMES[r.book]} · <a href="${esc(BOOKS[r.book].source.url)}#page=${r.page}" ${NF}>PDF ${r.page}</a></li>`).join("");
      const disc = ["sporting", "compak"].filter(k => t.disciplines_en && t.disciplines_en[k]).map(k => `<div class="box"><b>${NAMES[k]}</b><p>${esc(t.disciplines_en[k])}</p></div>`).join("");
      const rel = (t.related || []).map(rid).filter(r => GBY[r] && r !== t.id).map(r => `<a class="btn" style="padding:3px 10px;font-size:13px" href="${BASE}en/glossary/${r}/">${esc(dispTerm(GBY[r]))}</a>`).join(" ");
      const learn = (t.learn || []).filter(id => LESSON[id]).slice(0, 6).map(id => `<li><a href="${BASE}en/learn/${id}/">${esc(tm(LESSON[id].title_en))}</a> · ${esc(LESSON[id].module.title_en)}</li>`).join("")
        + (t.interp || []).filter(id => INTERP[id]).slice(0, 4).map(id => `<li><a href="${interpUrl("en", id)}">${esc(tm(INTERP[id].title_en))}</a> · ClayArena Interpreter Academy</li>`).join("");
      const ld = [{ "@context": "https://schema.org", "@type": "DefinedTerm", name, alternateName: [...new Set([t.term, ...(t.aka || [])])].filter(a => a !== name), description: tm(t.short_en), termCode: t.id, url: en, inDefinedTermSet: SET, inLanguage: "en" }];
      const html = head({ title, desc, url: en, uk, en, ld, img: "glossary" }) + bar(`${BASE}en/glossary/`, `<a href="${BASE}en/glossary/">Glossary</a>`, uk) + `
<main style="max-width:900px;margin:0 auto;padding:20px 16px 72px">
<div class="src">${esc(t.cat)}</div><h1>${esc(name)}</h1>${t.aka?.length ? `<p class="ref">Also: ${esc(t.aka.join(", "))}</p>` : ""}
<h2>What it is</h2><p><b>${esc(t.short_en)}</b></p>
${t.long_en ? `<h2>In detail</h2><p>${esc(t.long_en)}</p>` : ""}
${disc ? `<h2>In Sporting™ and Compak® Sporting</h2>${disc}` : ""}
${refs ? `<h2>Where it is in the rules</h2><ul>${refs}</ul>` : ""}
${t.source_url ? `<p class="ref">Source: <a href="${esc(t.source_url)}" ${NF}>FITASC ↗</a>${t.source_url.includes("categories") ? ` · <a href="${BASE}rules/en/categories/">FITASC categories</a>` : ""}</p>` : ""}
${learn ? `<h2>Learn it</h2><ul>${learn}</ul>` : ""}
${rel ? `<h2>Related terms</h2><p>${rel}</p>` : ""}
<div class="disc">ClayArena glossary, based on our summary of the FITASC rulebooks. Only the official FITASC text applies. ${TM}</div>${legal("en")}</main></body></html>`;
      mkdirSync(`docs/en/glossary/${t.id}`, { recursive: true });
      writeFileSync(`docs/en/glossary/${t.id}/index.html`, html);
      patchUk(`docs/glossary/${t.id}/index.html`, uk, en);
      out.push(en);
    }
    const cats = [...new Set(GLOSS.terms.map(t => t.cat))];
    writeFileSync("docs/en/glossary/index.html", head({ title: `Clay shooting glossary — ${GLOSS.terms.length} terms | ClayArena`, desc: "Sporting™ and Compak® Sporting terms explained in plain English, with links to the FITASC rules and to beginner lessons.", url: BASE + "en/glossary/", uk: BASE + "glossary/", en: BASE + "en/glossary/",
      ld: [{ "@context": "https://schema.org", ...SET, hasDefinedTerm: GLOSS.terms.map(t => ({ "@type": "DefinedTerm", name: dispTerm(t), url: `${BASE}en/glossary/${t.id}/` })) }], img: "glossary" }) + bar(`${BASE}en/glossary/`, "Glossary", BASE + "glossary/") + `
<main style="max-width:900px;margin:0 auto;padding:20px 16px 72px"><div class="src">ClayArena</div><h1>Clay shooting glossary</h1><p>${GLOSS.terms.length} terms of Sporting™ and Compak® Sporting, explained in plain English with links to the FITASC rules and to ClayArena Academy lessons.</p>
${cats.map(c => `<h2>${esc(c)}</h2><div class="list">${GLOSS.terms.filter(t => t.cat === c).sort((a, b) => a.term.localeCompare(b.term)).map(t => `<a href="${BASE}en/glossary/${t.id}/">${esc(dispTerm(t))}</a>`).join("")}</div>`).join("\n")}
<div class="disc">${TM}</div>${legal("en")}</main></body></html>`);
    patchUk("docs/glossary/index.html", BASE + "glossary/", BASE + "en/glossary/");
    out.push(BASE + "en/glossary/");
  }

  // ---- categories
  const C = globalThis.window && window.FITASC_CATEGORIES;
  if (C) {
    const uk = BASE + "rules/categories/", en = BASE + "rules/en/categories/";
    const from = C.valid_from.split("-").reverse().join(".");
    const rows = C.categories.map(c => `<tr><td><b>${esc(c.name_en)}</b> <span class="ref">(${esc(c.name_fr)})</span></td><td>${c.to_age ? `${c.from_age}–${c.to_age}` : `${c.from_age}+`}</td><td>${esc(c.rule_en)}</td></tr>`).join("");
    const teams = (C.teams || []).map(t => `<tr><td><b>${esc(t.team)}</b></td><td>${esc(t.eligible_en)}</td><td>${esc(String(t.size || ""))}</td><td>${esc(t.note_en || "")}</td></tr>`).join("");
    const faq = C.categories.map(c => ({ "@type": "Question", name: `Who is a ${c.name_en} in clay shooting (FITASC)?`, acceptedAnswer: { "@type": "Answer", text: c.rule_en } }));
    const title = "FITASC categories: Junior, Lady, Men, Senior, Veteran, Master — ages | ClayArena";
    const html = head({ title, desc: `Who is a Junior, Lady, Senior, Veteran or Master in Sporting™ and Compak® Sporting: FITASC age limits from ${from} and national team rules.`, url: en, uk, en,
      ld: [{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq }] }) + bar(`${BASE}rules/en/sporting/`, "FITASC rules › Categories", uk) + `
<main style="max-width:900px;margin:0 auto;padding:20px 16px 72px">
<div class="src">FITASC · Sporting™ · Compak® Sporting</div><h1>FITASC categories: who is a Junior, Lady, Senior, Veteran, Master</h1>
<p>The age categories are the same for Parcours de Chasse – Sporting™, Compak® Sporting and other FITASC disciplines, valid from ${from}. Only the <b>year</b> of birth counts, not the day or month. National and club events may use their own categories — check the competition programme.</p>
<h2>Categories and ages</h2><div class="tw"><table><thead><tr><th>Category</th><th>Age</th><th>Rule</th></tr></thead><tbody>${rows}</tbody></table></div>
${teams ? `<h2>National teams</h2><div class="tw"><table><thead><tr><th>Team</th><th>Eligible</th><th>Size</th><th>Note</th></tr></thead><tbody>${teams}</tbody></table></div>` : ""}
${(C.notes_en || []).length ? `<ul>${C.notes_en.map(n => `<li>${esc(n)}</li>`).join("")}</ul>` : ""}
<p class="src">Source: <a href="${esc(C.source_url)}" ${NF}>FITASC — Catégories, limites d'âge ↗</a> · ${TODAY}</p>
<div class="disc">Our summary of the official FITASC categories; only the FITASC text applies. ${TM}</div>${legal("en")}</main></body></html>`;
    mkdirSync("docs/rules/en/categories", { recursive: true });
    writeFileSync("docs/rules/en/categories/index.html", html);
    patchUk("docs/rules/categories/index.html", uk, en);
    out.push(en);
  }
  return out;
}
