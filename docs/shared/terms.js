/* ClayArena term labels — ONE helper for every place where a professional term is NAMED as a label (owner rule 08.10.2026).

   RULE: a professional shooting term is always given in English, in every language version, with the local word in brackets as
   an explanation: uk «Swing-through (протяжка)», «Rabbit (заєць)», «Gun mount (вкладка)»; de «Rabbit (Rollhase)». English pages show
   the English term only. When the local word is the same as the English (or a plain transliteration: uk «батю» = Battue,
   «сонопул» = Sonopull; or a spelling variant: de «Swing-Through», pl «kategoria» = Category), the term is shown once.
   - English  = the glossary's English term (docs/glossary/data/glossary.js + learn_terms.js: display_term, else term), or the English
                text of a quiz option that names the term. English pages show the option as written ("The wad", "ZERO", "Zero
                (lost)"); other languages drop its article and write it as the headword when it is the headword ("Wad", "Zero"):
                english() below.
   - local    = term_local of the glossary language file docs/glossary/data/i18n/<lang>.js (any confidence). Ukrainian terms of
                learn_terms.js that have no i18n/uk.js entry yet fall back to the first «…» of their `uk_usage` (the same glossary
                entry; the "Як кажуть українською" block). Nothing is typed by hand anywhere else. A wrong or missing local word is
                fixed in the glossary file, never here (no fallback to `alt`: alt holds abbreviations, sizes and English variants,
                review 08.10.2026).
   - label    = "English (local)" or "English". The brackets hold ONLY the local word: inner brackets of term_local are not nested
                ("Pull-away (départ sur le plateau)" gives the local word "départ sur le plateau"; "tiro d'attesa (ambush)" gives
                "tiro d'attesa"; "Point de prise (d'acquisition)" gives "Point de prise", the full form stays on the glossary page),
                and an English headword's own brackets go on pages in other languages: "Fly-over zone (Überflugzone)", not
                "Fly-over zone (ABCD rectangle) (…)"; "Zero (lost)" with no local word is "Zero" in fr, never "Zero (lost)".
   STEP 1 (08.10.2026) uses it for labels only: lead-lab method names, flight / pair / scene tabs and names in the animations,
   glossary headwords, index lists, related terms, term chips of lessons and rule pages, the Academy search, quiz options that
   name a term (option field "term"), Practice "Name the flight". Running text of lessons is step 2. Canvas words stay English
   only (no room for brackets): see docs/shared/sims.js.

   WHO USES IT (one copy of the logic):
   - browser: docs/learn/app/academy.js (window.ClayTerms), docs/shared/sims.js (tabs, method and flight names; falls back to the
     English name when this file is not on the page), the rules trainer (docs/rules/trainer/index.html, quiz options);
   - build (Bun): scripts/build_academy.mjs (lesson pages and data, exams, ui.json "terms", docs/shared/sims-text.js) and
     scripts/build_seo.mjs / build_seo_en.mjs / build_seo_i18n.mjs (glossary pages, the FITASC categories page, term links of the
     rule pages). They run this file in a sandbox ({window: {}}), so it must not touch the DOM.
   Production (ClayArena): keep as one front-end helper and use the same function in the server templates (or let the API send the
   ready `label` field, as the build does in the lesson data). Plain ES2018, no dependencies. */
(function (root) {
  "use strict";
  const STR = s => (s == null ? "" : String(s)).trim();
  /* comparison form: no accents, no marks or quotes, lower case, hyphens/dots/spaces as one space */
  const flat = s => STR(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/[™®]/g, "").replace(/[„“”"«»‹›'’‘`]/g, "").replace(/[-‐‑–—_.\s/]+/g, " ").trim();
  /* Ukrainian letters in Latin (for the "plain transliteration" check only, never shown) */
  const UK = { а: "a", б: "b", в: "v", г: "g", ґ: "g", д: "d", е: "e", є: "je", ж: "zh", з: "z", и: "y", і: "i", ї: "ji", й: "j", к: "k", л: "l",
    м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "shch", ь: "", ю: "ju", я: "ja" };
  const CYR = /[Ѐ-ӿ]/;
  const latin = s => [...flat(s)].map(c => (UK[c] != null ? UK[c] : c)).join("");
  /* Sound skeleton: consonants only, similar sounds merged (c/k/q, ch/sh/ts, h/g, w/v, ph/f), double letters once.
     «ж» and «дж» sound like the English j and drop out with it («джетлаг» = Jet lag → "tlg", «ежектор» = Ejector → "ktr"); in a
     Latin word a French final -age sounds «-аж» and a final -x is silent ("chuchotage" = «шушотаж» → "st", "Grand Prix" =
     «Гран-прі»). "battue" and «батю» → "bt"; "sonopull" and «сонопул» → "snpl"; "chandelle" and «шандель» → "sndl". */
  const skel = s => {
    let x = latin(s).replace(/[^a-z]/g, "").replace(/dzh|zh/g, "j");
    if (!CYR.test(s)) x = x.replace(/ge$/, "j").replace(/x$/, "");
    return x.replace(/shch|sch|tch|ch|sh|ts/g, "s").replace(/ck/g, "k").replace(/ph/g, "f").replace(/th/g, "t").replace(/qu/g, "kv")
      .replace(/c(?=[eiy])/g, "s").replace(/[cq]/g, "k").replace(/x/g, "ks").replace(/w/g, "v").replace(/h/g, "g")
      .replace(/[aeiouyj]/g, "").replace(/(.)\1+/g, "$1");
  };
  const lev = (a, b) => { if (a === b) return 0; const d = []; for (let i = 0; i <= a.length; i++) d[i] = [i];
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length]; };
  /* translit(a, b): Cyrillic word a is a plain transliteration of Latin word(s) b (same sound skeleton, or one sound apart at most
     from 4 consonants on with the same first and last sound, voiced = voiceless there: «бета-блокатор» = Beta-blocker, «компак у
     лінію» = Compak in line, «Гран-прі» = Grand Prix, «стандарт» = Standard; «фібровий пиж» is NOT Fibre wad: "fbrvp" / "fbrvd"
     end differently) */
  const dv = c => ({ d: "t", b: "p", g: "k", z: "s", v: "f" })[c] || c;
  const translit = (a, b) => { const x = skel(a), y = skel(b);
    return !!x && (x === y || (Math.min(x.length, y.length) >= 4 && dv(x[0]) === dv(y[0]) && dv(x[x.length - 1]) === dv(y[y.length - 1]) && lev(x, y) <= 1)); };
  /* variant(a, b): Latin word(s) a is a spelling variant of the English b — the Latin-script counterpart of translit() (review
     08.10.2026: uk showed "Category", pl "Category (kategoria)"). Compared without spaces and hyphens after k→c, ck→c, w→v, sz→s,
     cz→c, z→c before i/y, y→i, j→i: equal, or the English + a local ending of at most 2 letters, or (both at least 7 letters) one
     letter apart. pl "kategoria", "trajektoria", "weteran", "antydoping", "beta-bloker"; de "Ejektor", "Zylinder"; hu "antidopping",
     "szenior"; lt "antidopingas"; it/pt "presbiopia"; it "semiautomatico". Short real words stay local words: it "battuta"
     (Battue), de "Runde" (Round). */
  const vform = s => flat(s).replace(/ /g, "").replace(/ck/g, "c").replace(/k/g, "c").replace(/w/g, "v").replace(/sz/g, "s")
    .replace(/cz/g, "c").replace(/z(?=[iy])/g, "c").replace(/[yj]/g, "i");
  const variant = (a, b) => {
    const x = vform(a), y = vform(b); if (!x || !y) return false;
    if (x === y) return true;
    if (y.length >= 4 && x.startsWith(y) && x.length - y.length <= 2) return true;
    return x.length >= 7 && y.length >= 7 && lev(x, y) <= 1;
  };
  /* same(local, english): the local word adds nothing to the English name shown —
     - equal apart from case, accents, hyphens, spaces and quotes ("Swing-Through", "ZÉRO", "No bird", "swing through");
     - only the first word(s) of the English name ("Compak" of Compak® Sporting, "swing" of Swing-through, "full" of Full choke);
     - the one English word with a grammatical ending of at most 2 letters (lt "sportingas", cs "junioři", de "Junioren");
     - (Latin script) a spelling variant of it (variant(): pl "kategoria" = Category, de "Zylinder" = Cylinder);
     - (Cyrillic only) a plain transliteration of it, or of its first word(s) («батю» = Battue, «сонопул» = Sonopull, «рафаль» =
       Rafale double, «джетлаг» = Jet lag). A Latin-script word in another form ("sylinteri", "battue-kiekko", "phonopull") is a
       local word and is shown. */
  function same(local, en) {
    const a = flat(local), b = flat(en); if (!a || !b) return false;
    if (a === b || a.replace(/ /g, "") === b.replace(/ /g, "")) return true;
    const aw = a.split(" "), bw = b.split(" ");
    if (aw.length < bw.length && bw.slice(0, aw.length).join(" ") === a) return true;
    // the English word with a short grammatical ending of the language (lt "sportingas" = Sporting, hu "tempó" is equal already)
    if (aw.length === 1 && bw.length === 1 && b.length >= 4 && a.startsWith(b) && a.length - b.length <= 2) return true;
    if (!CYR.test(local)) return variant(a, b);
    if (translit(a, b)) return true;                       // «антидопінг» = Anti-doping, «джетлаг» = Jet lag (spaces do not count)
    return aw.length < bw.length && translit(a, bw.slice(0, aw.length).join(" "));
  }
  const unquote = s => { const m = /^\s*[„“"«‹]\s*(.*?)\s*[”“"»›]\s*$/.exec(s); return m ? m[1] : s; };
  /* The English part: a headword with its own brackets ("Men (Homme)", "Fly-over zone (ABCD rectangle)") without them. */
  const core = en => STR(en).replace(/\s*\([^()]*\)\s*$/, "") || STR(en);
  const isLocalLang = lang => !!lang && lang !== "en";

  /* local(termLocal, lang, names): the local word to show in brackets, "" when there is none to add. names = the English names that
     are SHOWN or stand for the headword (the English shown, display_term, term) — a local word equal to one of them is not
     repeated. Not the aka: a local word equal to an English alias is still a local word for the English shown («калібр» is
     "calibre", but the label shows "Gauge (калібр)"; fr "Parcours de Chasse" → "Sporting™ (Parcours de Chasse)").
     "X (Y)": Y is the local word only when X is EXACTLY an English name ("Pull-away (départ sur le plateau)" → "départ sur le
     plateau", "Ambush (Erwarten)" → "Erwarten"). A local X that only looks like the English (fr "Groupe (en ligne)", "Classe
     (niveau)") is the local word itself, so its qualifier is never shown as the word: "Groupe" = Group → the label "Group". */
  function local(termLocal, lang, names) {
    if (!isLocalLang(lang)) return "";
    let s = unquote(STR(termLocal)); if (!s) return "";
    const N = (Array.isArray(names) ? names : [names]).map(STR).filter(Boolean);
    const isEn = v => N.some(n => same(v, n) || same(v, core(n)));
    const exact = v => N.some(n => flat(v) === flat(n) || flat(v) === flat(core(n)));
    const m = /^(.*?)\s*\(([^()]*)\)\s*$/.exec(s);           // "X (Y)"
    if (m && m[1]) {
      const x = m[1].trim(), y = m[2].trim();
      s = exact(x) ? (isEn(y) ? "" : y) : x;  // "English (local)" → local; "local (English)" or "local (2nd form)" → local (the 2nd form stays for the glossary page)
    }
    s = unquote(s).trim();
    return !s || isEn(s) ? "" : s;
  }
  /* label(en, loc, lang): "English (local)" | "English" (plain text). loc = the result of local(). On a page in another language the
     brackets hold ONLY the local word: the English headword's own brackets go, also when there is no local word ("Zero (lost)" →
     "Zero", "Group (in line)" → "Group", "Line (new system)" → "Line"). English pages: the English text as written. */
  const label = (en, loc, lang) => (isLocalLang(lang) ? (STR(loc) ? `${core(en)} (${STR(loc)})` : core(en)) : STR(en));
  /* html(en, loc, lang, esc): the same as HTML, the English part marked lang="en" (screen readers say it in English). */
  const html = (en, loc, lang, esc) => (isLocalLang(lang)
    ? `<span lang="en">${esc(core(en))}</span>${STR(loc) ? ` (${esc(STR(loc))})` : ""}`
    : esc(STR(en)));

  /* The local word of a glossary entry: i18n/<lang>.js term_local; for Ukrainian, a term without an i18n/uk.js entry takes the first
     «…» of its uk_usage. entry = the glossary.js / learn_terms.js object, tr = GLOSSARY_I18N[lang].terms[id] (or null). */
  function termLocal(entry, tr, lang) {
    if (tr && STR(tr.term_local)) return STR(tr.term_local);
    if (lang === "uk" && entry && entry.uk_usage) { const q = /«([^«»]{1,60})»/.exec(entry.uk_usage); if (q) return q[1]; }
    return "";
  }
  const namesOf = entry => entry ? [entry.display_term, entry.term].filter(Boolean) : [];
  /* english(entry, en, lang): the English part of a label. en = the English text of a quiz option that names the term (empty: the
     headword display_term || term). On a page in another language (review 08.10.2026):
     - the option's English article goes and the first letter is a capital: "The wad" → "Wad", "A rabbit" → "Rabbit", "A ZZ target"
       → "ZZ target" (the label is "Wad (пиж)", not "The wad (пиж)");
     - an option that IS the headword apart from case, hyphens and its own brackets is written as the headword: "ZERO" and "Zero
       (lost)" → "Zero", "Going-away" → "Going away", "One (hit)" → "One" — one spelling of a term in a game.
     English pages keep the option's text as written ("The wad", "ZERO", "Zero (lost)"). */
  function english(entry, en, lang) {
    const head = STR(entry && (entry.display_term || entry.term));
    let e = STR(en) || head;
    if (!isLocalLang(lang) || !e) return e;
    if (STR(en)) { e = e.replace(/^(?:a|an|the)\s+/i, ""); e = e.charAt(0).toUpperCase() + e.slice(1); }
    if (head && flat(core(e)) === flat(core(head))) e = head;
    return e;
  }
  /* of(entry, tr, lang, opt): {en, local, label} of a glossary term. opt.en = the English to show (default display_term || term;
     a quiz option passes its own English text), opt.mark = a function for the FITASC marks (the build passes tm()).
     A page that has only the names of docs/shared/sims-text.js ([en, local], e.g. the rules trainer) calls
     of({term: en}, {term_local: local}, lang, {en: <option text>}). */
  function of(entry, tr, lang, opt) {
    opt = opt || {}; const mark = typeof opt.mark === "function" ? opt.mark : (s => s);
    const en = mark(english(entry, opt.en, lang));
    const loc = mark(local(termLocal(entry, tr, lang), lang, [...namesOf(entry), STR(opt.en), en].filter(Boolean)));
    return { en, local: loc, label: label(en, loc, lang) };
  }

  const API = { local, label, html, termLocal, of, same, core, english };
  if (root) root.ClayTerms = API;
  if (typeof module === "object" && module && module.exports) module.exports = API;
})(typeof window !== "undefined" ? window : this);
