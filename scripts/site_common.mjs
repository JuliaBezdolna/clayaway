// Shared constants and helpers of the static site builds (scripts/build_seo.mjs and scripts/build_academy.mjs).
// One place for: the site address, the 11 ClayArena languages, HTML escaping, the FITASC trade marks in names and meta,
// and the © ClayArena footer line. Production (clayarena.com): the site template provides all of this itself.
import { readFileSync } from "node:fs";
import path from "node:path";

// Address of the site (docs/): every generated URL starts with it (canonical, hreflang, sitemap, Open Graph, JSON-LD, links).
// THE ONE PLACE: scripts/make_og.py, seo_meta.py and build_interpreter_pages.py read this line too (read_base()), so the move to
// clayarena.com is this one line + a full rebuild. Now: the working copy on GitHub Pages (JuliaBezdolna/clayaway, switched
// 05.11.2026 from the original fenix-112323.github.io so that the preview links stay on the preview; robots.txt keeps it out of
// search until BASE is a clayarena.com address, scripts/build_seo.mjs).
export const BASE = "https://juliabezdolna.github.io/clayaway/";

// ClayArena site languages, the only ones the project uses (CLAUDE.md). English is the master language.
export const LANGS = ["en", "uk", "de", "fr", "it", "cs", "pl", "pt", "hu", "fi", "lt"];

// Open Graph locale of each language.
export const OG_LOCALE = { en: "en_GB", uk: "uk_UA", de: "de_DE", fr: "fr_FR", it: "it_IT", cs: "cs_CZ", pl: "pl_PL", pt: "pt_PT", hu: "hu_HU", fi: "fi_FI", lt: "lt_LT" };

export const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// FITASC trade marks (CLAUDE.md): every visible name, title, heading, link text and meta text says "Sporting™" and
// "Compak® Sporting". tm() adds the marks and is idempotent; it leaves "English Sporting" (a CPSA discipline, not FITASC),
// "Sporting Clays" (NSCA), declined forms ("Sportingu") and lower-case words alone. Body text keeps its own wording.
export const tm = s => String(s ?? "").replace(/\bCompak(?![®\w])/g, "Compak®")
  .replace(/(?<!\w)(?<!Compak® )(?<!Compak®-)(?<!English )Sporting(?![™\w])(?! [Cc]lays)/g, "Sporting™");

// Footer line on every generated page (audit W-03): © ClayArena + the ClayArena privacy policy, legal information and
// contacts (also the address for rights holders). Production: ClayArena renders its own site footer instead.
export const CA_PATH = { uk: "uk-ua", de: "de-de" }; // clayarena.com locale paths that exist; other languages use /en/
export const LEGAL_TXT = {
  uk: ["Політика конфіденційності", "Правова інформація", "Контакти (зокрема для правовласників)"],
  en: ["Privacy policy", "Legal information", "Contacts (also for rights holders)"],
  de: ["Datenschutzerklärung", "Rechtliche Hinweise", "Kontakt (auch für Rechteinhaber)"],
  fr: ["Politique de confidentialité", "Informations légales", "Contact (y compris pour les ayants droit)"],
  it: ["Informativa sulla privacy", "Note legali", "Contatti (anche per i titolari dei diritti)"],
  cs: ["Zásady ochrany osobních údajů", "Právní informace", "Kontakty (i pro držitele práv)"],
  pl: ["Polityka prywatności", "Informacje prawne", "Kontakt (także dla właścicieli praw)"],
  pt: ["Política de privacidade", "Informação legal", "Contactos (também para titulares de direitos)"],
  hu: ["Adatvédelmi tájékoztató", "Jogi információk", "Kapcsolat (jogtulajdonosoknak is)"],
  fi: ["Tietosuojaseloste", "Oikeudelliset tiedot", "Yhteystiedot (myös oikeudenhaltijoille)"],
  lt: ["Privatumo politika", "Teisinė informacija", "Kontaktai (taip pat teisių turėtojams)"]
};
export const legal = lang => { const p = CA_PATH[lang] || "en", x = LEGAL_TXT[lang] || LEGAL_TXT.en;
  return `<p class="legal">© ${new Date().getFullYear()} ClayArena · <a href="https://clayarena.com/${p}/privacy/">${x[0]}</a> · <a href="https://clayarena.com/${p}/legal/">${x[1]}</a> · <a href="https://clayarena.com/${p}/contacts/">${x[2]}</a></p>`; };

// The FITASC_INDEX switch lives in ONE place: scripts/build_seo.mjs ("const FITASC_INDEX = false;"). Builds that run on
// their own (bun scripts/build_academy.mjs) read it from there, so the switch is never duplicated. Unknown → false (noindex).
export function readFitascIndex(root) {
  try {
    const s = readFileSync(path.join(root, "scripts", "build_seo.mjs"), "utf8");
    const m = s.match(/^\s*const FITASC_INDEX\s*=\s*(true|false)\s*;/m);
    return m ? m[1] === "true" : false;
  } catch (e) { return false; }
}
