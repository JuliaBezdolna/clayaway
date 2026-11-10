/* ClayArena · glossary links inside the text of the FITASC rules retelling (Правила FITASC, wave 3, 10.11.2026; Ivan: "terms in the
   texts become links to the glossary").

   The text itself is never changed: only the words already written there are wrapped in a link. Candidates are the glossary terms
   that the rule item lists itself (item.terms, curated in docs/rules/data/), so a word is linked only where the term is really meant.
   Each term is linked once per item, at its first mention (summary first, then the points: pass the same `used` set). A name of a
   term is its English headword, display form and aka (the retelling keeps the English words: «No Bird», «rafale»), plus, in
   Ukrainian, the local word and its alt forms of docs/glossary/data/i18n/uk.js. Ukrainian words of 5+ letters match inflected forms
   (stem = all but the last two letters, then up to four letters: «мішень» → «мішені», «мішеней»); an English last word may take
   -s / -es («doubles»). Longer names are tried first and two links never overlap.

   WHO USES IT: scripts/build_seo.mjs (static rule pages; runs this file in a sandbox, so no DOM here).
   API: ClayRuleTerms.link(text, cands, used, esc) → HTML of the text with the links;
        cands = [{ id, href, names: [..], attrs: ' data-x="…"' (optional, already escaped) }];
        ClayRuleTerms.namer(glossaryTerms, ukI18nTerms) → (term, lang) => names for cands (drops names shared by two terms).
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
  function link(text, cands, used, esc) {
    const s = String(text == null ? "" : text), hits = [];
    const list = [];
    for (const c of cands || []) for (const n of c.names || []) if (n && String(n).trim().length >= 3) list.push({ c, n: String(n).replace(/[™®]/g, "").trim() });
    list.sort((a, b) => b.n.length - a.n.length);
    for (const { c, n } of list) {
      if (used && used.has(c.id)) continue;
      const re = pattern(n);
      // first match that does not overlap a link already placed
      let from = 0, m = null;
      while (from <= s.length) {
        const r = re.exec(s.slice(from)); if (!r) break;
        const a = from + r.index, b = a + r[0].length;
        if (!hits.some(h => a < h.b && b > h.a)) { m = { a, b }; break; }
        from = a + 1;
      }
      if (!m) continue;
      hits.push({ a: m.a, b: m.b, c });
      if (used) used.add(c.id);
    }
    hits.sort((x, y) => x.a - y.a);
    let out = "", at = 0;
    for (const h of hits) { out += esc(s.slice(at, h.a)) + `<a class="gt" href="${h.c.href}"${h.c.attrs || ""}>${esc(s.slice(h.a, h.b))}</a>`; at = h.b; }
    return out + esc(s.slice(at));
  }
  // namer(terms, uk) → (term, lang) => names. Main names: display form, headword, uk local word. Other names (aka, uk alt) are used
  // only when no other glossary term has the same name («лінія» is the local word of Line and an alt of Compak in line → only Line;
  // «команда» is both Call and Team → neither alt). terms = glossary entries, uk = GLOSSARY_I18N.uk.terms (or {}).
  function namer(terms, uk) {
    const low = s => String(s).replace(/[™®]/g, "").trim().toLowerCase(), U = uk || {};
    const main = (t, lang) => [t.display_term, t.term, lang === "uk" && U[t.id] ? U[t.id].term_local : ""].filter(Boolean);
    const more = (t, lang) => [...(t.aka || []), ...(lang === "uk" && U[t.id] ? U[t.id].alt || [] : [])].filter(Boolean);
    const own = {};
    for (const lang of ["uk", "en"]) { own[lang] = new Map();
      for (const t of terms) for (const n of [...main(t, lang), ...more(t, lang)]) { const k = low(n); if (!own[lang].has(k)) own[lang].set(k, new Set()); own[lang].get(k).add(t.id); } }
    return (t, lang) => { const L = lang === "uk" ? "uk" : "en", m = main(t, L);
      return [...m, ...more(t, L).filter(n => own[L].get(low(n)).size === 1 || m.some(p => low(p) === low(n)))]; };
  }
  root.ClayRuleTerms = { link, pattern, namer };
})(typeof window !== "undefined" ? window : globalThis);
