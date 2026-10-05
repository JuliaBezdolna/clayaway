# ClayArena Academy (for beginners): lesson data format

Part of ClayArena (project ClayAway). Audience: complete beginners, parents of juniors, friends of shooters, spectators.
Separate from "Vika's Academy" (a private organizer/interpreter tool) — do not copy its texts; facts may be checked against it.

One file per module: `docs/learn/data/<module>.js` (UTF-8 JavaScript):

```js
window.LEARN = window.LEARN || [];
window.LEARN.push({
  module: "chokes",                 // intro | safety | gun | chokes | cartridges | targets | technique | competitions | rules | culture | clayarena
  order: 4,
  title_uk: "Чоки", title_en: "Chokes",
  intro_uk: "...", intro_en: "...",            // 1-2 sentences: what the beginner will understand after this module
  lessons: [
    { id: "chokes-what-is-a-choke",            // unique kebab-case, prefixed with the module
      title_uk: "...", title_en: "...",
      minutes: 4,                                // reading time 3-6
      summary_uk: "...", summary_en: "...",      // 1-2 sentences (used as meta description)
      body_uk: ["paragraph", "paragraph", ...],  // 4-8 short paragraphs, plain friendly language for beginners
      body_en: ["...", ...],                     // same content in English
      key_points_uk: ["..."], key_points_en: ["..."],   // 3-5 bullet takeaways
      terms: ["choke", "pattern"],               // glossary ids: use ClayArena glossary ids where they exist
                                                 // (docs/glossary/data/glossary.js); new ids allowed (kebab-case English) — list them in new_terms
      new_terms: [ { id: "pattern", term: "Pattern", short_uk: "...", short_en: "..." } ],
      rule_refs: [ { book: "sporting"|"compak", id: "<rule item id>" } ],   // only where a FITASC rule is relevant (docs/rules/data/*.js)
      quiz: [ { q_uk, q_en, options: [{uk, en}], answer: 0, explain_uk, explain_en } ],   // exactly 3 questions
      did_you_know_uk: "...", did_you_know_en: "..."   // optional fun fact (must be true)
    }
  ]
});
```

Rules
- Accurate and practical. Numbers (choke constrictions, shot sizes, load weights, distances) must be correct; FITASC rule facts must match docs/rules/data/*.js. If something varies by country or maker, say so.
- Beginner tone: explain every term the first time, short sentences, no jargon without explanation. Terms stay in English with Ukrainian explanation (e.g. «чок (choke)», «навіска»).
- Trademarks: write "Sporting™" / "Parcours de Chasse – Sporting™" and "Compak® Sporting" on first mention in each lesson.
- Safety first; never advise anything illegal; remind that gun/ammo laws differ by country.
- Literary Ukrainian, no surzhyk. No Russian language anywhere; never mention Russia.
- Our own words; do not copy texts from websites or rulebooks.
