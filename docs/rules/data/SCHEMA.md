# ClayArena rules guide: data format

One file per rulebook: `docs/rules/data/<key>.js` (plain JavaScript, UTF-8):

```js
window.RULES = window.RULES || [];
window.RULES.push({
  key: "sporting",                       // sporting | compak
  title_en: "Sporting (Parcours de Chasse)", title_uk: "Sporting (Parcours de Chasse)",
  source: {
    publisher: "FITASC",
    doc_title: "International Rules Parcours de Chasse - Sporting",
    edition: "01/01/2025",               // date printed in the rulebook
    file: "20260203-rglt-pc-eng-....pdf",
    url: "https://api.fitasc.com/media/....pdf",
    last_modified: "2026-03-29",
    quick_guide_url: "https://.../quick_ref_quide.pdf"   // optional
  },
  sections: [                             // follow the rulebook: Part (I, II, III) -> Chapter -> topic
    { id: "ch3", part: "I", chapter: 3, title_en: "Shooting rules", title_uk: "Правила стрільби",
      items: [
        { id: "ch3-gun-position",          // unique, kebab-case
          ref: "Chapter 3, Gun position",  // how to cite it (chapter/article/sub-heading exactly as in the PDF)
          page: 6,                         // PDF page number (1-based, as the PDF viewer shows)
          title_en: "...", title_uk: "...",
          summary_en: "...", summary_uk: "...",   // OUR OWN plain-language explanation, 2-6 sentences. Keep exact numbers.
          points_en: ["..."], points_uk: ["..."], // 2-6 short key points (numbers, limits, who decides, penalties)
          terms: ["gun-position", "referee"],      // English term ids (glossary ids, English, kebab-case)
          keywords: ["low gun", "vest", "marker", "mount", "ready position"], // EN + UA words people would type
          quick_guide: false                        // true if the referees' quick guide covers this
        }
      ]
    }
  ],
  faq: [                                  // 40-70 real questions a shooter, organizer or interpreter would ask
    { q_en: "...", q_uk: "...", a_en: "...", a_uk: "...", refs: ["ch3-gun-position"] }
  ]
});
```

Rules:
- COPYRIGHT: the FITASC rulebooks are FITASC property and may not be reproduced. Never copy paragraphs and never follow
  the rulebook sentence by sentence. Write your own explanation: practical meaning first, keep the numbers, change the
  order and the wording. A direct quote is allowed only if it is very short (under 15 words), essential, and in quotation marks.
  Check: no run of 10 or more words identical to the rulebook text (n-gram check against the local PDF text in rules/pdf/,
  EN and FR; see the developer notes). Lists of facts (target types, table letters) are fine.
- Keep every number, limit, distance, time and penalty exactly as in the rulebook. Do not invent anything; if the text is
  ambiguous or silent, say so in the summary ("the rulebook does not say ...").
- Cover the whole rulebook: every chapter must have items. Prefer more, smaller items (one rule per item).
- Trademarks: "Parcours de Chasse – Sporting™", "Sporting™" and "Compak® Sporting" in titles, headings, meta and buttons.
- Languages: only ClayArena languages (en, uk, de, fr, it, cs, pl, pt, hu, fi, lt). The rules guide itself is uk + en.
  The restricted country is never named and its flag is never shown; athletes from it appear only as AIN / Neutral.
- Ukrainian: correct literary Ukrainian, no surzhyk, apostrophe ’ (U+2019). Sport terms stay in English (Sporting,
  report pair, no bird, referee, layout, squad…), explained in Ukrainian. Fixed Ukrainian terms (same as the glossary and
  both Academies): дуплет (double; not «дублет», «дубль»), вкладка / вкладати рушницю (gun mount; not «вскидання»,
  «вкидка»), перестрілка (shoot-off), squad (the squad of up to 6; «група» only for the Compak in-line group), дріб (shot).
- Plain and cautious wording: no "always works / guaranteed / best / ideal" claims; a professional term plus a short plain explanation.
- page = the PDF page number. In the provided .txt the pages are separated by the form-feed character (\f): page N = the N-th chunk.
- The app answers questions by searching keywords, titles, summaries and the FAQ, so write keywords and FAQ generously, in English and Ukrainian.
