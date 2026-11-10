/* ClayArena · glossary links inside the text of the FITASC rules retelling (Правила FITASC, wave 3, 10.11.2026; Ivan: "terms in the
   texts become links to the glossary").

   The text itself is never changed: only the words already written there are wrapped in a link. Candidates are the glossary terms
   that the rule item lists itself (item.terms, curated in docs/rules/data/), so a word is linked only where the term is really meant.
   Each term is linked once per item, at its first mention (summary first, then the points: pass the same `used` set). A name of a
   term is its English headword, display form and aka (the retelling keeps the English words: «No Bird», «rafale»), plus, in
   Ukrainian, the local word and its alt forms of docs/glossary/data/i18n/uk.js. Ukrainian words of 5+ letters match inflected forms
   (stem = all but the last two letters, then up to four letters: «мішень» → «мішені», «мішеней»); an English last word may take
   -s / -es («doubles»). The link goes on the first mention in the text under any of the term's names; at the same starting place
   the longer name wins, and two links never overlap.

   WHO USES IT: scripts/build_seo.mjs (static rule pages; runs this file in a sandbox, so no DOM here).
   API: ClayRuleTerms.link(text, cands, used, esc) → HTML of the text with the links;
        cands = [{ id, href, names: [main names], more: [other names], attrs: ' data-x="…"' (optional, already escaped) }];
        ClayRuleTerms.namer(glossaryTerms, ukI18nTerms) → (term, lang) => { names, more } for cands (drops other names shared by two terms).
   Plain ES2018. */
(function (root) {
  "use strict";
  const LET = "\\p{L}\\p{M}\\p{N}";
  const escR = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const CYR = /[а-яіїєґ]/i;
  const cache = new Map();
  function pattern(name) {
    if (cache.has(name)) return cache.get(name);
    const ws = String(name).trim().split(/\s+/);
    const parts = ws.map((w, i) => {
      if (CYR.test(w) && w.length >= 5) return escR(w.slice(0, w.length - 2)) + `[${LET}]{0,4}`;
      if (i === ws.length - 1 && /^[A-Za-z]+$/.test(w) && w.length >= 3) return escR(w) + "(?:e?s)?";
      return escR(w);
    });
    const re = new RegExp(`(?<![${LET}])${parts.join("\\s+")}(?![${LET}])`, "iu");
    cache.set(name, re);
    return re;
  }
  // Where the link goes (review 10.11.2026: «Sporting (Parcours de Chasse)» linked the aka in brackets, not «Sporting»):
  // 1. the first mention of the term's MAIN name (c.names: headword, display form, uk local word), from left to right; the other
  //    names (c.more: aka, uk alt) only when no main name is in the text («shot load» is not Cartridge when «cartridges» is there);
  // 2. a word that is a name of two terms of the item links to neither («група» where the item lists both Squad and Group);
  // 3. a name inside a longer name of another term is not a mention of its own («Parcours» in «Parcours de Chasse», «дуплет» in
  //    «одночасний дуплет»); at the same starting place the longer name wins; two links never overlap.
  function link(text, cands, used, esc) {
    const s = String(text == null ? "" : text), hits = [], all = [];
    const add = (c, list, tier) => { for (const n0 of list || []) { const n = String(n0 || "").replace(/[™®]/g, "").trim(); if (n.length < 3) continue;
      for (const r of s.matchAll(new RegExp(pattern(n).source, "giu"))) all.push({ a: r.index, b: r.index + r[0].length, c, tier }); } };
    // terms already linked earlier in the item still count for rules 2 and 3 (they only get no second link)
    for (const c of cands || []) { add(c, c.names, 0); add(c, c.more, 1); }
    const key = m => m.a + ":" + m.b, owners = new Map();
    for (const m of all) { const k = key(m); if (!owners.has(k)) owners.set(k, new Set()); owners.get(k).add(m.c.id); }
    const ok = all.filter(m => !(used && used.has(m.c.id)) && owners.get(key(m)).size === 1
      && !all.some(o => o.c.id !== m.c.id && o.a <= m.a && o.b >= m.b && o.b - o.a > m.b - m.a));
    ok.sort((x, y) => x.tier - y.tier || x.a - y.a || (y.b - y.a) - (x.b - x.a));
    const done = new Set();
    for (const m of ok) {
      if (done.has(m.c.id) || hits.some(h => m.a < h.b && m.b > h.a)) continue;
      hits.push(m); done.add(m.c.id); if (used) used.add(m.c.id);
    }
    hits.sort((x, y) => x.a - y.a);
    let out = "", at = 0;
    for (const h of hits) { out += esc(s.slice(at, h.a)) + `<a class="gt" href="${h.c.href}"${h.c.attrs || ""}>${esc(s.slice(h.a, h.b))}</a>`; at = h.b; }
    return out + esc(s.slice(at));
  }
  // namer(terms, uk) → (term, lang) => { names, more }. Main names (names): display form, headword, uk local word, and each of them
  // without its own trailing brackets («Group (in line)» → «Group»). Other names (more: aka, uk alt) are used only when no other
  // glossary term has the same name («лінія» is the local word of Line and an alt of Compak in line → only Line; «команда» is both
  // Call and Team → neither alt); a bracket-less form shared with another term is dropped the same way.
  // terms = glossary entries, uk = GLOSSARY_I18N.uk.terms (or {}).
  function namer(terms, uk) {
    const low = s => String(s).replace(/[™®]/g, "").trim().toLowerCase(), U = uk || {};
    const core = s => String(s).replace(/\s*\([^()]*\)\s*$/, "").trim();
    const main0 = (t, lang) => [t.display_term, t.term, lang === "uk" && U[t.id] ? U[t.id].term_local : ""].filter(Boolean);
    const cores = (t, lang) => main0(t, lang).map(core).filter((c, i, a) => c && a.indexOf(c) === i && !main0(t, lang).some(m => low(m) === low(c)));
    const more = (t, lang) => [...(t.aka || []), ...(lang === "uk" && U[t.id] ? U[t.id].alt || [] : [])].filter(Boolean);
    const own = {};
    for (const lang of ["uk", "en"]) { own[lang] = new Map();
      for (const t of terms) for (const n of [...main0(t, lang), ...cores(t, lang), ...more(t, lang)]) { const k = low(n); if (!own[lang].has(k)) own[lang].set(k, new Set()); own[lang].get(k).add(t.id); } }
    const alone = (L, n) => own[L].get(low(n)).size === 1;
    return (t, lang) => { const L = lang === "uk" ? "uk" : "en", m = [...main0(t, L), ...cores(t, L).filter(c => alone(L, c))];
      return { names: m, more: more(t, L).filter(n => alone(L, n) && !m.some(p => low(p) === low(n))) }; };
  }
  root.ClayRuleTerms = { link, pattern, namer };
})(typeof window !== "undefined" ? window : globalThis);
