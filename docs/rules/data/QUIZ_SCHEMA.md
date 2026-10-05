# ClayAway rules trainer: question format

One file per discipline: `docs/rules/data/quiz-<key>.js` (UTF-8 JavaScript):

```js
window.RULES_QUIZ = window.RULES_QUIZ || [];
window.RULES_QUIZ.push({
  key: "sporting",                 // sporting | compak  (same keys as the rules guide)
  questions: [
    { id: "sp-q001",
      type: "decision",            // decision | number | truefalse | choice
      level: 1,                    // 1 basic (every shooter), 2 advanced (organizer/interpreter), 3 referee level
      topic: "No bird",            // short English topic label
      q_en: "...", q_uk: "...",    // the question; for "decision" a short concrete situation on the stand ending with
                                   // "What is the referee's decision?" / «Яке рішення судді?»
      options: [ {en: "Dead", uk: "Dead — мішень зарахована"}, ... ],   // 2 options for truefalse, 3-4 otherwise
      answer: 0,                   // index of the correct option
      explain_en: "...", explain_uk: "...",   // 1-3 sentences: why, with the exact number/limit
      refs: ["ch6-no-bird-..."]    // ids of items in docs/rules/data/<key>.js (must exist)
    }
  ]
});
```

Rules
- Base every question ONLY on the rules guide data (`docs/rules/data/<key>.js`, our own summaries of the FITASC rulebook). Do not invent rules. If an item says the rulebook is ambiguous, don't make a question on that point.
- Mix: about 40% "decision" (referee scenarios: dead / lost / no bird / repeat / zero-zero / warning / penalty), 25% "number" (limits, seconds, counts, distances, fees), 15% "truefalse", 20% "choice".
- Wrong options must be plausible (common misunderstandings), not silly.
- Terms stay in English (Dead, Lost, No Bird, report pair, simultaneous pair, referee, jury…); explanations in natural literary Ukrainian and English.
- No Russian language anywhere; never mention Russia.
- Ids: "sp-q001…" for sporting, "cs-q001…" for compak.
