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
   STEP 1 (08.10.2026) uses it for labels: lead-lab method names, flight / pair / scene tabs and names in the animations,
   glossary headwords, index lists, related terms, term chips of lessons and rule pages, the Academy search, quiz options that
   name a term (option field "term"), Practice "Name the flight". Canvas words stay English only (no room for brackets): see
   docs/shared/sims.js.
   STEP 2 (09.10.2026): RUNNING TEXT of lessons, the tokens {{term:<id>|<local form>}}: the first mention on a page is
   "<English> (<local form>)", later ones "<English>" — mention(), scope(), atStart(), casedEn() at the end of this file.

   WHO USES IT (one copy of the logic):
   - browser: docs/learn/app/academy.js (window.ClayTerms; plainTok() renders a raw token with mention()), docs/shared/sims.js (tabs, method and flight names; falls back to the
     English name when this file is not on the page), the rules trainer (docs/rules/trainer/index.html, quiz options);
   - build (Bun): scripts/build_academy.mjs (lesson pages and data, exams, ui.json "terms", docs/shared/sims-text.js; running text
     of lessons through mention() and scope()) and
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
     - the same English words in another order (pt "double rafale" = Rafale double);
     - (Latin script) a spelling variant of it (variant(): pl "kategoria" = Category, de "Zylinder" = Cylinder);
     - (Cyrillic only) a plain transliteration of it, or of its first word(s) («батю» = Battue, «сонопул» = Sonopull, «рафаль» =
       Rafale double, «джетлаг» = Jet lag). A Latin-script word in another form ("sylinteri", "battue-kiekko", "phonopull") is a
       local word and is shown. */
  function same(local, en) {
    const a = flat(local), b = flat(en); if (!a || !b) return false;
    if (a === b || a.replace(/ /g, "") === b.replace(/ /g, "")) return true;
    const aw = a.split(" "), bw = b.split(" ");
    if (aw.length < bw.length && bw.slice(0, aw.length).join(" ") === a) return true;
    // the same English words in another order (pt "double rafale" = Rafale double; review 09.10.2026)
    if (aw.length > 1 && aw.length === bw.length && aw.slice().sort().join(" ") === bw.slice().sort().join(" ")) return true;
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

  /* ============ STEP 2 (owner rule 08.10.2026): RUNNING TEXT of lessons, tokens {{term:<id>|<local form>}} ============
     On a page in another language than English (English pages are unchanged: the form, else the headword):
     - the FIRST mention of a term on a page → "<English> (<local form>)", every later mention → "<English>"; the glossary link
       stays on the whole text (the build wraps it). Which mention is the first is kept by scope() below; the build decides what a
       "page" is (reading order and parts that count on their own: scripts/build_academy.mjs, SCHEMA.md §6, DEVELOPERS.md §4l).
     - English = of().en (the glossary headword with the FITASC marks, its own brackets dropped as in the labels: core()).
     - local form = the form written in the text (outer quotes dropped: «заєць» → заєць), else the glossary local word (of().local).
       Not repeated when it adds nothing to the English (local(): the same word, a spelling variant or a plain transliteration),
       also when it is an inflected form of a glossary local word that is one: uk «сонопулом» of «сонопул» (= Sonopull), «рафалем»
       of «рафаль» (= Rafale double): the English is shown once. A form that is EXACTLY the English headword or an English alias
       (aka: «Empties», cs "Rabbit", uk «behind») is not a local word: the brackets show the glossary local word instead.
     - Case (casedEn): a normal noun is lower case mid-sentence ("swing-through", "rabbit", "break point") and gets a capital only
       when the local form starts a sentence: the token stands at a sentence start (atStart) AND the form begins with a capital (a
       token without a form: the sentence start alone). Proper names, acronyms and calls stay as written (keepCase: FITASC, No Bird,
       ZZ target, Grand Prix, names with ™/®, Compak in line, the calls Zero / One / Cease fire …, the FITASC category names
       Junior / Lady / Men / Senior / Veteran / Master). A local form that had its capital
       only because it started the sentence goes to lower case in the brackets when the glossary writes the word in lower case
       («Віддача штовхає…» → "Recoil (віддача) штовхає…"; de «Rollhase» keeps its capital).
       German writes every noun with a capital; the rule above still writes the English noun in lower case mid-sentence (owner rule
       as given 08.10.2026). Should German keep the capital of English nouns, add "de" to CAP_NOUN_LANGS (one place).
     - A form that is the English name itself (also with the "!" / "?" of a call: "Protest!", "Smoked it!") standing alone in quotes
       («Protest!», „Cease fire“!, «Peg») is a quoted English word, as said on the stand: shown exactly as written inside the quotes
       (review 09.10.2026: it was «protest» for «Protest!», „Smoked it“ without "!", „trap (Wurfmaschine)“ inside the quotes). At the
       first mention the local word goes AFTER the closing quote: „behind“ (za terčem). The caller says that the token is in quotes
       (o.quoted = quoted(before, after)), puts mention().after behind the closing quote, and does not count the mention as the first
       one when the author wrote an own bracket right after the quote („Smoked it!“ (oder „inked it“…)): then o.first = false.
     - A form that is the English name with a case ending (fi "FITASCille", "No Birdiksi", "Zero-Zeroksi", hu "English
       Sportingnak"; the ending: 1–5 lower-case letters; in other languages than fi and hu only after ":" "'" or "-": pl
       "FITASC-u") is English already: shown as written, once, no brackets (review 09.10.2026: "FITASC (FITASCille)").
     - Plural (review 09.10.2026): the English headword is singular, but a local form can be plural ("les cartridge (cartouches)",
       "Os barrel têm…"). o.plural = true writes the English in the plural (pluralEn(): the last word, or the word before "on / of /
       in …": "doubles on report"; +s, +es after s/x/z/ch/sh, consonant + y → ies; a word in -s that is not -ss/-us/-is is plural
       already: "Empties", "Shooting glasses"); a name, acronym or call (keepCase) never changes; the glossary field en_plural
       overrides the rule. The build decides when a form is plural (scripts/build_academy.mjs termMention(): fr and pt by the word
       ending, any language by {{term:id|form|pl}}; |sg turns it off).
     WHO USES IT: scripts/build_academy.mjs (token(): static pages and the lesson / exam / phrase data) and docs/learn/app/academy.js
     (plainTok(): a raw token that slipped into a catalog or lesson string). One copy of the rule, here. */
  const CAP_NOUN_LANGS = [];                                // languages that keep the capital of an English noun mid-sentence
  /* calls and commands said on the stand, written as written ("Zero", "No Bird", "Cease fire", "Gun up"), by glossary id */
  const KEEP_IDS = ["no-bird", "one", "zero", "zero-zero", "cease-fire", "show-clear", "gun-up", "smoked-it", "move-mount-shoot",
    /* the FITASC category names (Junior, Lady, Men, Senior, Veteran, Master), written as on the categories page */
    "junior", "lady", "men-category", "senior", "veteran", "master-category"];
  /* proper names that start a headword without another capital ("Compak in line") */
  const PROPER_RE = /^(?:Compak|Sporting|Parcours|FITASC|ClayArena|ClayAway|English|European|Global|Grand)(?![a-z])/;
  /* keepCase(en, id): the English is a name, an acronym or a call: written as it is, whatever the sentence */
  const keepCase = (en, id) => { const c = core(en);
    return !c || /[™®]/.test(c) || /\p{Lu}/u.test(c.slice(1)) || PROPER_RE.test(c) || KEEP_IDS.indexOf(String(id || "")) >= 0; };
  const startsUpper = s => /^[^\p{L}]*\p{Lu}/u.test(STR(s));
  const firstTo = (s, up) => s.replace(/\p{L}/u, c => (up ? c.toUpperCase() : c.toLowerCase()));
  /* casedEn(en, opt): the English as it stands in running text. opt = {id, lang, start, form} (see the rule above). */
  function casedEn(en, opt) {
    opt = opt || {}; const c = core(en);
    if (keepCase(c, opt.id)) return c;
    const cap = !!opt.start && (STR(opt.form) ? startsUpper(unquote(STR(opt.form))) : true);
    if (cap) return firstTo(c, true);
    return CAP_NOUN_LANGS.indexOf(opt.lang) >= 0 ? c : firstTo(c, false);
  }
  /* atStart(before): the text of the same string before the token (plain text, other tokens replaced by a letter) ends a sentence:
     nothing but spaces, quotes, brackets, dashes or list marks before it, or ". ! ? …" (closing quotes or brackets after them
     allowed); a new line counts as a start. A colon does not ("Порада: протяжка…" goes on in lower case). Every quote mark counts
     as an opening one right before the token: fi opens a quote with ” (”fur and feather”), de with » (review 09.10.2026). */
  function atStart(before) {
    const s = String(before == null ? "" : before);
    if (/\n[\s«»„“”"‘’(\[—–•*-]*$/.test(s)) return true;
    const t = s.replace(/[\s«»„“”"‘’(\[—–•*-]+$/, "");
    return !t || /[.!?…][»”"’)\]]*$/.test(t);
  }
  /* quoted(before, after): the token stands alone inside quotes — an opening quote right before it, a closing quote right after it
     (after the "!" "?" "." of a call written outside the token: „{{term:cease-fire|Cease fire}}!“). before / after = the text of
     the same string around the token. */
  const OPEN_Q = /[«„“"‘‹‚]\s*$/, CLOSE_Q = /^[!?.…]*\s*[»“”"’›‘]/;
  const quoted = (before, after) => OPEN_Q.test(String(before == null ? "" : before)) && CLOSE_Q.test(String(after == null ? "" : after));
  /* englishForm(form, names, aka): the form is the English name itself (headword, display name, their core, an alias), maybe with
     the "!" "?" "." of a call; accents count (fr "séries" is French), Cyrillic never. */
  const flatA = s => STR(s).toLowerCase().replace(/[™®]/g, "").replace(/[„“”"«»‹›'’‘`]/g, "").replace(/[-‐‑–—_.\s/]+/g, " ").trim();
  function englishForm(form, names, aka) {
    const f = unquote(STR(form)).trim().replace(/[!?.…]+$/, "").trim(); if (!f || CYR.test(f)) return false;
    const N = (Array.isArray(names) ? names : [names]).map(STR).filter(Boolean);
    return [...N, ...N.map(core), ...(Array.isArray(aka) ? aka : [])].some(a => flatA(a) === flatA(f));
  }
  /* pluralEn(en, over): the English name in the plural (see "Plural" above). over = the glossary en_plural (wins). */
  const PL_SPLIT = /^(.*?\S)(\s+(?:on|of|in|at|for|to|from|with|by)\s.*)$/;
  function pluralEn(en, over) {
    if (STR(over)) return STR(over);
    const c = core(en), m = PL_SPLIT.exec(c), head = m ? m[1] : c, tail = m ? m[2] : "";
    const w = /([A-Za-z]+)([^A-Za-z]*)$/.exec(head); if (!w) return c;
    const word = w[1]; let p;
    if (/^(?:away|through|off|up|down|out|over|on|in|by|around|back)$/i.test(word)) return c; // "Going away", "Swing-through": no plural
    // uncountable English nouns stay as they are ("Hearing protection", "Steel shot", "Recoil")
    if (/^(?:protection|shot|steel|lead|recoil|safety|practice|coaching|hydration|ammunition|equipment|training|advice|clothing|footwear|eyewear|weather|fit|etiquette|conduct|accuracy|velocity|stance|hygiene|mobility|nutrition|sleep)$/i.test(word)) return c;
    if (/[^aeiou]y$/i.test(word)) p = word.slice(0, -1) + "ies";
    else if (/(?:ss|us|is|x|z|ch|sh)$/i.test(word)) p = word + "es";
    else if (/s$/i.test(word)) return c;                   // "Empties", "Shooting glasses": plural already
    else p = word + "s";
    return head.slice(0, w.index) + p + w[2] + tail;
  }
  /* inflected(form, raw): form is a case form of the glossary word raw («сонопулом» / «сонопул», «рафалем» / «рафаль»): the same
     beginning up to the last one or two letters of raw, and at most four letters more */
  function inflected(form, raw) {
    const a = flat(form), b = flat(raw); if (!a || !b) return false; if (a === b) return true;
    const st = b.length > 6 ? b.slice(0, -2) : b.length > 4 ? b.slice(0, -1) : b;
    return st.length >= 3 && a.indexOf(st) === 0 && a.length - st.length <= 4;
  }
  /* mention(o): one token of running text.
     o = {en, local, raw, form, names, id, lang, first, start, esc, plural, enPlural}
       en    English to show (of().en)        local  glossary local word for the brackets (of().local; "" = none to add)
       raw   term_local as the glossary writes it (termLocal(); for the case of the brackets and the inflected-form test)
       form  the form written in the token ("" when none)   names  other English names of the term (display_term, term)
       aka   English aliases of the term (glossary aka). A Latin-script form that is EXACTLY the English headword or one of these
             aliases («Empties» of Empty cases, cs "Rabbit", uk «behind») is English, not a local word: the brackets show the glossary
             local word instead ("Empty cases (порожні гільзи)", "Rabbit (zajíc)", "behind (позаду мішені)"). A look-alike local word
             (it "macchine" ~ Machine, de "Kategorie" ~ Category) stays the form.
       id    glossary id (calls: KEEP_IDS)                  first  first mention on the page   start  at a sentence start (atStart)
       esc   HTML escaper (the build's esc; default: none)
       plural  the form is plural: the English goes into the plural (pluralEn(); not for keepCase names)   enPlural  glossary en_plural
       quoted  the token stands alone in quotes (quoted()): an English form is then shown as written; the brackets of the first
               mention come back as after / afterHtml, for the caller to put behind the closing quote
     → {en, local, text, html[, after, afterHtml]}: local = what the brackets show ("" for a later mention or nothing to add), text = plain text,
       html = '<span lang="en">English</span> (local)' (the caller wraps the glossary link around it). English pages: the form,
       else the English, as before step 2. */
  function mention(o) {
    o = o || {}; const lang = o.lang, esc = typeof o.esc === "function" ? o.esc : (s => s);
    if (!isLocalLang(lang)) { const t = STR(o.form) || STR(o.en); return { en: t, local: "", text: t, html: esc(t) }; }
    const names = [STR(o.en), ...(Array.isArray(o.names) ? o.names : [])].map(STR).filter(Boolean);
    const form0 = unquote(STR(o.form)).trim(), raw = STR(o.raw);
    // exactly the headword or an alias (accents count: fr "séries" is French, not the alias "Series"), not a look-alike local word;
    // the "!" of a call does not count ("Protest!" = Protest)
    const enForm = englishForm(form0, names, o.aka), tailP = enForm ? (/[!?.…]+$/.exec(form0) || [""])[0] : "";
    // a quoted English word («Protest!», „Smoked it!“): as written; the local word of the first mention goes after the closing quote
    if (enForm && o.quoted) { const lq = o.first ? STR(o.local) : "";
      return { en: form0, local: lq, text: form0, html: `<span lang="en">${esc(form0)}</span>`, after: lq ? ` (${lq})` : "", afterHtml: lq ? ` (${esc(lq)})` : "" }; }
    const form = enForm ? "" : form0;                          // an English form: as if the token had no form (glossary local word)
    // the English name with a case ending (fi "FITASCille", "No Birdiksi", pl "FITASC-u"): English already, as written
    // (fi and hu add the ending to the word itself; other languages only after ":" "'" or "-", e.g. pl "FITASC-u": de "Doublette"
    // and "Proteste" are German words, not "Double" + ending)
    if (form && !CYR.test(form) && names.some(n => { const c = core(n).replace(/[™®]/g, "").trim();
      return c.length >= 3 && form.toLowerCase().indexOf(c.toLowerCase()) === 0
        && (lang === "fi" || lang === "hu" ? /^[:'’-]?\p{Ll}{1,5}$/u : /^[:'’-]\p{Ll}{1,5}$/u).test(form.slice(c.length)); }))
      return { en: form, local: "", text: form, html: `<span lang="en">${esc(form)}</span>` };
    let loc = form ? local(form, lang, names) : STR(o.local);
    if (form && loc && raw && !local(raw, lang, names) && inflected(form, raw)) loc = "";
    let en = casedEn(o.en, { id: o.id, lang, start: o.start, form: enForm ? "" : form0 });
    if (o.plural && !keepCase(o.en, o.id)) en = pluralEn(en, o.enPlural);
    en += tailP;                                               // the "!" of a call written in the form ("Smoked it!")
    if (loc && o.start && startsUpper(loc) && raw && !startsUpper(raw)) loc = firstTo(loc, false);
    if (!o.first) loc = "";
    return { en, local: loc, text: loc ? `${en} (${loc})` : en, html: `<span lang="en">${esc(en)}</span>${loc ? ` (${esc(loc)})` : ""}` };
  }
  /* scope(parent): the terms a page (or a part of it) has explained already. first(id, key) is true for the first mention of id;
     key = the text item and the place of the token in it, so the same item rendered again (HTML, then plain text) gets the same
     answer. A child scope sees its parent's mentions, not the other way round (a block of one discipline, folded for readers of the
     other, explains its terms again later in the common text). mark(id) counts a mention without a key (a quiz option label);
     ids() lists the ids this scope explained. */
  function scope(parent) {
    const seen = new Map();
    const S = {
      parent: parent || null,
      has: id => seen.has(id),
      first(id, key) {
        if (seen.has(id) && key != null && seen.get(id) === key) return true;   // the same item again: the same answer
        for (let p = S.parent; p; p = p.parent) if (p.has(id)) return false;
        if (seen.has(id)) return false;
        seen.set(id, key == null ? null : key); return true;
      },
      mark(id) { if (!seen.has(id)) seen.set(id, null); },
      ids: () => [...seen.keys()]
    };
    return S;
  }

  const API = { local, label, html, termLocal, of, same, core, english, mention, scope, atStart, casedEn, keepCase, pluralEn, quoted, englishForm };
  if (root) root.ClayTerms = API;
  if (typeof module === "object" && module && module.exports) module.exports = API;
})(typeof window !== "undefined" ? window : this);
