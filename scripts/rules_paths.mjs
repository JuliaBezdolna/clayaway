// Addresses of the static rules pages (Правила FITASC, wave 3, 10.11.2026): one page per chapter.
//   rules/<book>/                    contents of the book + common questions        (uk)
//   rules/<book>/<chapter-slug>/     one chapter: its rule items, its questions      (uk)
//   rules/en/<book>/…                the same in English
// The slug comes from the English chapter title without the number ("Target refereeing" → target-refereeing), the same for both
// languages (as the glossary ids), so a renumbering by FITASC does not change the address. Rule item ids start with their chapter
// id ("ch6-referee-alone" is in ch6): the old anchors rules/<book>/#<item id> still work — the book page sends them on to the
// chapter page (see the redirect in scripts/build_seo.mjs) and, without JavaScript, lands on the item's line in the contents.
// Used by scripts/build_seo.mjs (+ _en, _i18n: the glossary "Де це в правилах") and scripts/build_academy.mjs (lesson rule links).
export const chapterSlug = s => String(s.title_en || s.id).replace(/[™®]/g, "").normalize("NFD").replace(/[̀-ͯ]/g, "")
  .toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

// ruleIndex(books): Map "<book>:<item or chapter id>" → { slug, chapter: <chapter id> }. Stops on a duplicate slug in one book.
export function ruleIndex(books) {
  const idx = new Map();
  for (const b of books) {
    const seen = new Map();
    for (const s of b.sections) {
      const slug = chapterSlug(s);
      if (!slug) throw new Error(`rules ${b.key}: chapter ${s.id} has no English title for its address`);
      if (seen.has(slug)) throw new Error(`rules ${b.key}: chapters ${seen.get(slug)} and ${s.id} would get the same address "${slug}/"`);
      seen.set(slug, s.id);
      idx.set(`${b.key}:${s.id}`, { slug, chapter: s.id });
      for (const it of s.items) idx.set(`${b.key}:${it.id}`, { slug, chapter: s.id });
    }
  }
  return idx;
}

// rulePath(idx, lang, book, id, query): path after the site root, e.g. "rules/sporting/target-refereeing/#ch6-referee-alone".
// A chapter id gives the chapter page without an anchor; an unknown id falls back to the book page with the anchor.
// lang: "uk" → rules/…, anything else → rules/en/… (the rules exist in uk and en only). query: "" or "?lang=pl".
export const rulePath = (idx, lang, book, id, query = "") => {
  const root = `rules/${lang === "uk" ? "" : "en/"}${book}/`, at = idx.get(`${book}:${id}`);
  if (!at) return `${root}${query}#${id}`;
  return `${root}${at.slug}/${query}${at.chapter === id ? "" : "#" + id}`;
};
