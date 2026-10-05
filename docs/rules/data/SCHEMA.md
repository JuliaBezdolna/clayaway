# ClayArena Rules Guide: data format

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
- COPYRIGHT: the FITASC rulebooks are FITASC property and may not be reproduced. Never copy paragraphs.
  Write your own explanations. A direct quote is allowed only if it is very short (under 15 words) and essential.
- Keep every number, limit, distance, time and penalty exactly as in the rulebook. Do not invent anything; if the text is ambiguous, say so.
- Cover the whole rulebook: every chapter must have items. Prefer more, smaller items (one rule per item).
- Ukrainian: correct literary Ukrainian, no surzhyk. No Russian language anywhere. Never mention Russia.
  Sport terms stay in English (Sporting, report pair, no bird, referee, layout…), explained in Ukrainian.
- page = the PDF page number. In the provided .txt the pages are separated by the form-feed character (\f): page N = the N-th chunk.
- The app answers questions by searching keywords, titles, summaries and the FAQ, so write keywords and FAQ generously, in English and Ukrainian.
