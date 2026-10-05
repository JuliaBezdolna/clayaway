# ClayAway Academy — data format (one file per module)

File: docs/academy/data/<module>.js, plain JavaScript, UTF-8:

window.ACADEMY = window.ACADEMY || [];
window.ACADEMY.push({
  module: "sporting",            // sporting | compak | guns | technique | organizer
  order: 1,
  title_en: "...", title_uk: "...",
  intro_en: "...", intro_uk: "...",          // 2-3 sentences: what this chapter teaches
  story: [                                   // 4-6 scenes, narrative with Vika (organizer + interpreter on her first tours)
    { id: "s1", title_en: "...", title_uk: "...",
      text_en: "...", text_uk: "..." }       // 120-250 words each. Mark every glossary term as [[term-id]] or [[term-id|shown text]];
  ],                                         // shown text in the Ukrainian version is still the ENGLISH term.
  terms: [                                   // 50-80 terms
    { id: "report-pair",                     // kebab-case, unique, English
      term: "Report pair",                   // ALWAYS English
      aka: ["On report"],                    // other English names / abbreviations
      cat: "Targets & pairs",                // category inside the module (English)
      short_en: "...", short_uk: "...",      // one sentence
      long_en: "...", long_uk: "...",        // 3-6 sentences: what it is, how it works, rules, typical numbers, why it matters
      uk_usage: "...",                       // how Ukrainian shooters actually say it (often an anglicism, e.g. «репорт», «дубль»), or "—"
      coach_en: "...", coach_uk: "...",      // a realistic phrase a coach/referee/shooter says with this term + correct Ukrainian interpretation
      tip_uk: "...",                         // tip for the interpreter/organizer in Ukrainian (pitfalls, false friends, what NOT to translate)
      related: ["simultaneous-pair"],        // ids (may point to terms in other modules)
      verify: false                          // true if a rule/number should be double-checked against the official rulebook
    }
  ],
  quiz: [                                    // 12-15 questions
    { q_en: "...", q_uk: "...",
      options: [ {en:"...", uk:"..."}, ... ],  // 3-4 options
      answer: 0,                              // index of the correct option
      explain_en: "...", explain_uk: "..." }
  ],
  practice: [                                // 6-10 "translate the coach" items
    { en: "Keep the gun moving through the bird.", uk: "Не зупиняй рушницю — веди її крізь мішень.", note_uk: "..." }
  ]
});

Rules for all modules:
- Terms are ALWAYS in English (term, aka). Explanations in both English and Ukrainian.
- Ukrainian must be correct literary Ukrainian, no surzhyk. No Russian language anywhere. Never mention Russia.
- Accuracy matters: this becomes the ClayArena glossary. If unsure about an exact rule/number, say so carefully and set verify: true.
- Narrative: Vika is a tour organizer and interpreter, new to clay shooting. She travels with groups and translates coaches.
  Keep it warm, a bit playful, practical.
