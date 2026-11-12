# ClayArena rules trainer: question format

> This file lives in `rules/` (outside `docs/`, so GitHub Pages does not publish it) since 09.10.2026; the banks it describes are
> `docs/rules/data/quiz-<key>.js`. Checks: `bun scripts/check_rules_data.mjs` (unique ids, refs, options, answer index, 10-word
> FITASC check, no other discipline; DEVELOPERS.md §2 and §4).

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
                                   // {term: "zero", en: "ZERO", uk: "…"}: see "Options that name a term" below
      answer: 0,                   // index of the correct option (original order, see "Answer order" below)
      explain_en: "...", explain_uk: "...",   // 1-3 sentences: why, with the exact number/limit
      refs: ["ch6-no-bird-..."],   // ids of items in docs/rules/data/<key>.js (must exist)
      sim: {type: "pair", kind: "report"}     // optional animation, see below
    }
  ]
});
```

## Options that name a term (`term`, optional; owner rule 08.10.2026)

A professional term is always given in English in every language, the local word in brackets. An option whose WHOLE text names one
glossary term ("ZERO", "ONE", "NO BIRD", "ZERO-ZERO", "Zero and zero", "Warning", "The trapper", or the call with an English gloss "Zero
(lost)", "One (hit)") carries `term: "<glossary id>"`. The trainer (`optText()` in `docs/rules/trainer/index.html`, `ClayTerms.of()`) and the
Academy game "Рішення судді" then show "<English> (<local word>)": the English option text without its article and in the glossary headword's
spelling when it is the headword ("ZERO" and "Zero (lost)" → "Zero", "The trapper" → "Trapper"), so uk "Zero (промах)", "Trapper (оператор
машинки)", de "Zero (Null)"; with no local word only the English ("Zero" in fr, never "Zero (lost)"). English pages show the option text as
written ("ZERO", "The trapper"). The `uk` text and the overlay translations of that option are not shown. ONE helper makes the label: `docs/shared/terms.js` (window.ClayTerms); the local words come from the glossary
(`docs/glossary/data/i18n/<lang>.js` term_local) through `docs/shared/sims-text.js` (window.CLAYSIMS_TERMS, written by scripts/build_academy.mjs,
which reads the option terms of these files; an unknown id is a build warning). Not for answers with an explanation ("NO BIRD — a new target is
thrown") or combinations ("ONE-ZERO", "Zero and No Bird", "ZERO (red card)"). DEVELOPERS.md §4l.

## Animation (`sim`, optional)

Drawn by the shared module `docs/shared/sims.js` (the same one the Academy, its Practice game «Рішення судді» and the glossary use).

- `{type: "pair", kind}`: a double. `kind` is `report` (double on report), `simultaneous` or `rafale`
  (rafale exists only in Sporting™, never in a Compak® Sporting question).
- `{type: "flight", preset}`: one target flight. `preset` is a key of `FLIGHTS` in `sims.js`
  (`crosser-lr`, `crosser-rl`, `incomer`, `driven`, `going-away`, `overhead`, `quartering-away`, `quartering-towards`,
  `teal`, `chandelle`, `looper`, `battue`, `dropping`, `rabbit`).
- `{type: "call", kind, also?}`: a scene on the stand (11.11.2026). `kind` is a key of `SCENES` in `sims.js`: `signal`,
  `signal-late` (target later than 3 s after the referee's signal → No Bird), `gun-ready`, `gun-early` (gun up on the call: first
  time a warning with a yellow card) — Sporting™ only; `manual`, `sonopull` — Compak® Sporting release; `misfire` (stay put, gun
  closed, pointing down the range, until the referee has checked it), `mount`. Added 12.11.2026 for the referee's decisions:
  `manual-late` (Compak® only: released by hand 4 s after the call, the referee calls No Bird — use `after: true`),
  `uncalled` (released without a call, no shot), `uncalled-shot` (the same, a late shot that misses), `broken-launch`
  (Sporting™ only: the target leaves the trap broken in two, the larger piece is hit), `nobird-shot` (the referee calls
  No Bird, the shooter fires anyway). Except `manual-late` they show the situation, not the decision.
- `{type: "ties", kind, also?}`: `shoot-off` (places 1–3) or `countback` (below third place, from the last layout / Compak back).
- `{type: "hit", kind}` (12.11.2026): is it a hit — the edge of the pattern touches a crosser, a magnifier follows the clay.
  `dust` (only a puff of dust, the clay flies on whole) or `chip` (one small visible piece breaks away). No verdict is shown.
- `also: [...]`: more kinds of the same type, shown as tabs (the first tab is `kind`).
- `after: true`: the scene is shown under the explanation once the answer is revealed, not above the question. Use it whenever
  the scene or its caption names the answer (a late target is No Bird, the first gun-up is a yellow card, the sonopull delay,
  countback below third place): an animation must never give the answer away.
- `bun scripts/check_rules_data.mjs` checks that every kind exists in `sims.js` and that no Sporting™-only scene or rafale is in
  a Compak® Sporting question.
- The animation must show exactly the double or target the question is about (a question on a double on report gets
  `kind: "report"`, not a simultaneous pair). No animation is better than a wrong one.

## Translations (`docs/rules/data/i18n/quiz-<lang>.json`)

`{ui: {...}, questions: {"<id>": {q, options: [...], explain}}}` for de, fr, it, cs, pl, pt, hu, fi, lt
(uk and en live in the question files). `options` is in the SAME order as `options` in the question file, so the
same `answer` index is valid in every language. Whenever options are reordered, added or removed in `quiz-<key>.js`,
reorder them the same way in all nine overlays. Missing fields fall back to English.

## Answer order

- The trainer (`docs/rules/trainer/index.html`) shuffles the options of every question for each run (true/false stays
  True, False), so a learner cannot guess the answer by its place. The Academy Practice game «Рішення судді» (`referees-call` in `content/academy/practice.json`) uses the same bank,
  so the data order should not give the answer away either: spread the correct answer over all positions.
- `number` options stay in ascending order (24 g, 28 g, 32 g…).
- `truefalse`: `options` is always `[True, False]`; keep roughly as many true statements as false ones.
- The correct option must not stand out by its length: keep all options about the same length and put the details
  into `explain`.

## Rules

- Base every question ONLY on the rules guide data (`docs/rules/data/<key>.js`, our own summaries of the FITASC rulebook).
  Do not invent rules. If an item says the rulebook is ambiguous or silent, don't make a question on that point, and do
  not add a frame the rule does not have (for example "on this Compak" when the rule does not say over what period a
  count runs).
- Our own words only: never copy or closely follow the rulebook wording (no run of 10+ identical words; same check as
  the rules guide: `bun scripts/check_rules_data.mjs`).
- Every question stands alone: the trainer shows questions in random order, so never write "the same shooter",
  "later in the round" or "same layout" as a link to another question; say inside the question what happened before.
- One question per item: a decision question asks one thing ("What is the referee's decision?" or "How can the target
  be scored?"), not two.
- Mix: about 40% "decision" (referee scenarios: dead / lost / no bird / repeat / zero-zero / warning / penalty),
  25% "number" (limits, seconds, counts, distances, fees), 15% "truefalse", 20% "choice".
- Wrong options must be plausible (common misunderstandings), not silly, and each must lead to a different decision
  (not two wordings of the same "Zero").
- Score words follow each rulebook: Sporting™ writes One / Zero / No Bird; Compak® Sporting writes ONE / ZERO / NO BIRD /
  ZERO-ZERO (as in the FITASC Compak rules and in `compak.js`). Use one spelling inside a bank.
- Terms stay in English (No Bird, double on report — glossary headword "Double on report", simultaneous pair, referee, jury, squad…); explanations in natural
  literary Ukrainian and English. Ukrainian terms as in the glossary: дуплет, сигнальний дуплет (double on report, owner decision 09.10.2026), вкладка / вкладати рушницю, перестрілка,
  squad (the squad of up to 6), дріб; apostrophe ’.
- Trademarks: "Parcours de Chasse – Sporting™", "Sporting™" and "Compak® Sporting" in page titles, headings and meta.
- Languages: only ClayArena languages (en, uk, de, fr, it, cs, pl, pt, hu, fi, lt). The restricted country is never
  named and its flag is never shown; athletes from it appear only as AIN / Neutral.
- Ids: "sp-q001…" for sporting, "cs-q001…" for compak. Never reuse or renumber an id (progress and mistakes are
  stored by id).
