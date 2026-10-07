// Text checks of the ClayArena Academy build (scripts/build_academy.mjs, design §6.6). Pure functions; the only I/O is
// reading the local FITASC text cache (rules/pdf/*.txt, never published: FITASC copyright, see .gitignore).
//
// Project language rules (CLAUDE.md): only the 11 ClayArena languages; never the language of the restricted country, never
// the name of that country or its flag; no Spanish text. The words the checks look for are written as character codes, so
// they never appear in the repository themselves.
import { readdirSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";

const C = (...c) => String.fromCharCode(...c);
const B = "(?<![\\p{L}\\p{M}])", E = "(?![\\p{L}\\p{M}])"; // word boundaries that also work for Cyrillic and accented letters

/* ---------- restricted country: stems in every ClayArena language + Cyrillic spellings + the flag ---------- */
const COUNTRY_STEMS = [
  C(114, 117, 115, 115, 105),            // en, fr, it (and adjectives)
  C(114, 117, 115, 115, 108),            // de
  C(114, 117, 115, 107),                 // cs
  C(114, 111, 115, 106), C(114, 111, 115, 121, 106), // pl
  C(114, 250, 115, 115, 105),            // pt
  C(111, 114, 111, 115, 122),            // hu
  C(118, 101, 110, 228, 106),            // fi
  C(114, 117, 115, 105, 106), C(114, 117, 115, 371), // lt
  C(1088, 1086, 1089) + "(?:" + C(1110) + "[" + C(1103, 1102, 1111, 1108) + "]|" + C(1110, 1081) + "|" + C(1089, 1080) + ")", // Cyrillic
  C(1088, 1091, 1089, 1089, 1082)
];
export const COUNTRY_RE = new RegExp(B + "(?:" + COUNTRY_STEMS.join("|") + ")", "iu");
export const FLAG_RE = new RegExp(C(0xD83C, 0xDDF7, 0xD83C, 0xDDFA), "u");

/* ---------- the restricted language: letters Ukrainian does not have + common function words ---------- */
export const RU_LETTERS_RE = new RegExp("[" + C(1099, 1101, 1098, 1105, 1067, 1069, 1066, 1025) + "]");
const RU_WORDS = [[1095, 1090, 1086], [1082, 1072, 1082], [1080, 1083, 1080], [1077, 1089, 1083, 1080], [1090, 1086, 1083, 1100, 1082, 1086],
  [1090, 1072, 1082, 1078, 1077], [1086, 1095, 1077, 1085, 1100], [1077, 1075, 1086], [1086, 1085, 1072], [1086, 1085, 1080], [1085, 1077, 1090],
  [1082, 1086, 1075, 1076, 1072], [1075, 1076, 1077], [1089, 1077, 1081, 1095, 1072, 1089], [1080]].map(a => C(...a));
export const RU_WORD_RE = new RegExp(B + "(?:" + RU_WORDS.join("|") + ")" + E + "(?!['’ʼ])", "iu");

/* ---------- Spanish text: a score of markers per text item (strong 2, weak 1; 4 or more = Spanish) ---------- */
const ES_STRONG = [[116, 97, 109, 98, 105, 233, 110], [117, 115, 116, 101, 100], [101, 115, 116, 225, 110], [99, 117, 97, 110, 100, 111],
  [100, 111, 110, 100, 101], [112, 117, 101, 100, 101], [116, 105, 101, 110, 101], [109, 117, 121], [97, 100, 101, 109, 225, 115],
  [100, 101, 115, 112, 117, 233, 115], [115, 105, 101, 109, 112, 114, 101]].map(a => C(...a));
const ES_WEAK = [[108, 111, 115], [108, 97, 115], [101, 108], [121], [112, 101, 114, 111], [104, 97, 121]].map(a => C(...a));
const ES_WEAK_NOT_PL = new Set([C(108, 111, 115), C(108, 97, 115)]); // these two are also Polish words
const wordRe = w => new RegExp(B + w + E, "giu");
const ES_STRONG_RE = ES_STRONG.map(wordRe), ES_WEAK_RE = ES_WEAK.map(w => [w, wordRe(w)]);
const ES_PUNCT_RE = new RegExp("[" + C(191, 161) + "]", "g"), ES_ENYE_RE = new RegExp(C(241), "gi");
export function spanishScore(text, lang) {
  const s = String(text || ""); let n = 0;
  for (const re of ES_STRONG_RE) n += 2 * (s.match(re) || []).length;
  for (const [w, re] of ES_WEAK_RE) if (!(lang === "pl" && ES_WEAK_NOT_PL.has(w))) n += (s.match(re) || []).length;
  n += 2 * (s.match(ES_PUNCT_RE) || []).length + (s.match(ES_ENYE_RE) || []).length;
  return n;
}
export const isSpanish = (text, lang) => spanishScore(text, lang) >= 4;

/* ---------- stop words (warnings): categorical wording the project avoids (audit A-11, A-13…A-16, I-05) ---------- */
// "never" and its translations are fine inside safety rules: the build skips them in t:"warn" blocks and in the safety block.
const sw = (re, never = false) => ({ re: new RegExp(re, "iu"), never });
export const STOP_WORDS = {
  en: [sw("\\bproven\\b"), sw("\\bbest\\b"), sw("\\bideal(?:ly)?\\b"), sw("\\bnever\\b", true), sw("\\bevery\\b"), sw("\\bmost coaches\\b")],
  uk: [sw(B + "перевірен(?:ий|а|е|і|ого|ої|ому|им|их|ими|у|ою)" + E), sw(B + "найкращ\\p{L}*"), sw(B + "ідеальн\\p{L}*"), sw(B + "ніколи" + E, true), sw("більшість тренерів")],
  de: [sw(B + "bewiesen\\p{L}*"), sw(B + "beste[nmrs]?" + E), sw(B + "ideal\\p{L}*"), sw(B + "niemals" + E, true), sw("die meisten trainer")],
  fr: [sw(B + "prouvé\\p{L}*"), sw(B + "meilleur\\p{L}*"), sw(B + "idéal\\p{L}*"), sw(B + "jamais" + E, true), sw("la plupart des entraîneurs")],
  it: [sw(B + "provat[oaie]" + E), sw(B + "miglior\\p{L}*"), sw(B + "ideal\\p{L}*"), sw(B + "mai" + E, true), sw("la maggior parte degli allenatori")],
  cs: [sw(B + "prokázan\\p{L}*"), sw(B + "nejlepší\\p{L}*"), sw(B + "ideální\\p{L}*"), sw(B + "nikdy" + E, true), sw("většina trenérů")],
  pl: [sw(B + "udowodnion\\p{L}*"), sw(B + "najlepsz\\p{L}*"), sw(B + "idealn\\p{L}*"), sw(B + "nigdy" + E, true), sw("większość trenerów")],
  pt: [sw(B + "comprovad\\p{L}*"), sw(B + "melhor(?:es)?" + E), sw(B + "ideal(?:is)?" + E), sw(B + "nunca" + E, true), sw("a maioria dos treinadores")],
  hu: [sw(B + "bizonyított\\p{L}*"), sw(B + "legjobb\\p{L}*"), sw(B + "ideális\\p{L}*"), sw(B + "soha" + E, true), sw("a legtöbb edző")],
  fi: [sw(B + "todistetu\\p{L}*"), sw(B + "parha\\p{L}*|" + B + "paras" + E), sw(B + "ihanteelli\\p{L}*"), sw(B + "ei koskaan" + E, true), sw("useimmat valmentajat")],
  lt: [sw(B + "įrodyt\\p{L}*"), sw(B + "geriausi\\p{L}*"), sw(B + "ideal\\p{L}*"), sw(B + "niekada" + E, true), sw("dauguma trenerių")]
};
export function stopWords(text, lang, { allowNever = false } = {}) {
  const out = [];
  for (const { re, never } of STOP_WORDS[lang] || []) { if (never && allowNever) continue; const m = String(text || "").match(re); if (m) out.push(m[0]); }
  return out;
}

/* ---------- Lithuanian: Russian-origin loanword avoided in the project (binding decision) ---------- */
// "gilzė" (and its case forms) is the Russian-origin loanword for a cartridge case; the project word is "tūtelė".
// Latin script already, so no C() character-code encoding is needed here (unlike the Cyrillic/restricted-country checks above).
const LT_LOANWORD_RE = new RegExp(B + "gilz\\p{L}*" + E, "iu");
export const ltLoanword = text => { const m = String(text || "").match(LT_LOANWORD_RE); return m ? m[0] : null; };

/* ---------- real people (warnings): lessons use fictional people or no names (owner decision) ---------- */
// Names from the project research (psychology_science.md, psychology_practice.md, technique.md: coaches, champions, authors,
// researchers) and the real people of the ClayAway tour mock-ups (allowed only there). Full names or distinctive surnames.
export const PEOPLE = ["Digweed", "Faulds", "Ed Solomons", "Husthwaite", "Matarese", "Gil Ash", "Vicki Ash", "Dan Carlisle", "Bilinski", "Don Currie",
  "Cory Kruse", "Wendell Cherry", "Derrick Mein", "Yardley", "Ian Coley", "Hannah Gibson", "Derek Burnett", "Russell Mark", "Georgina Roberts",
  "Madison Sharpe", "Kayle Browning", "Dawn Grant", "Phil Coley", "Henry Hopking", "Peter Terry", "Jess Thom", "Richard Colo", "Patrick Cohn",
  "Perillan", "Bassham", "Mark H. Taylor", "Chris Batha", "Paul Bentley", "Jeppesen", "Pensgaard", "Gallwey", "Vickers", "Causer", "Wulf",
  "Beilock", "Oudejans", "Janelle", "Markus Leibinger", "Weigele", "Bardou", "Karpulianskaia"];
const PEOPLE_RE = new RegExp("\\b(?:" + PEOPLE.map(p => p.replace(/[.]/g, "\\.")).join("|") + ")\\b");
export const peopleIn = text => { const m = String(text || "").match(PEOPLE_RE); return m ? m[0] : null; };

/* ---------- long sentences (warning): master sentences over 30 words are hard to translate 9 times ---------- */
export function longSentences(text, max = 30) {
  return String(text || "").split(/(?<=[.!?…])\s+(?=[\p{Lu}\d«"“(])/u)
    .filter(s => s.split(/\s+/).filter(w => /[\p{L}\d]/u.test(w)).length > max);
}

/* ---------- FITASC text cache: 10 or more words in a row equal to the official text = error (audit R-01) ---------- */
const words = s => String(s || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[’']/g, "'")
  .match(/[a-z0-9]+(?:'[a-z]+)?/g) || [];
export function loadFitascCache(root, n = 10) {
  const dir = path.join(root, "rules", "pdf");
  if (!existsSync(dir)) return null;
  const files = readdirSync(dir).filter(f => f.endsWith(".txt"));
  if (!files.length) return null;
  const grams = new Set();
  for (const f of files) { const w = words(readFileSync(path.join(dir, f), "utf8")); for (let i = 0; i + n <= w.length; i++) grams.add(w.slice(i, i + n).join(" ")); }
  return { n, grams, files };
}
// Returns the first run of >= n words that is in the FITASC text (extended to its full length), or null.
export function fitascMatch(text, cache) {
  if (!cache) return null;
  const w = words(text), n = cache.n;
  for (let i = 0; i + n <= w.length; i++) {
    if (!cache.grams.has(w.slice(i, i + n).join(" "))) continue;
    let j = i + n; while (j < w.length && cache.grams.has(w.slice(j - n + 1, j + 1).join(" "))) j++;
    return { words: j - i, text: w.slice(i, j).join(" ") };
  }
  return null;
}

/* ---------- trade marks in titles, h1, og and description (error, audit G-07) ---------- */
// Latin names must carry the marks; a Cyrillic spelling of the discipline names in a title is reported too.
const TM_MISSING = [/\bCompak(?![®\w])/, /(?<!\w)(?<!Compak® )(?<!Compak®-)(?<!English )Sporting(?![™\w])(?! [Cc]lays)/,
  new RegExp(B + "(?:" + C(1089, 1087, 1086, 1088, 1090, 1080, 1085, 1075) + "|" + C(1082, 1086, 1084, 1087, 1072, 1082) + "(?!" + C(1090) + "))\\p{L}*", "iu")]; // not the Ukrainian word for "compact"
export const trademarkProblem = s => { for (const re of TM_MISSING) { const m = String(s || "").match(re); if (m) return m[0]; } return null; };
