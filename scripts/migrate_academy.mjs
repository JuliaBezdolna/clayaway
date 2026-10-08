#!/usr/bin/env bun
/* =====================================================================================================
   ClayArena Academy — ONE-TIME migration into the single content source `content/academy/`.

   What it does (project design "Академія ClayArena", §6 data format and §3 lesson mapping):
     reads   archive/legacy-docs/learn/data/*.js                 ClayArena Academy (beginners): 22 modules, 123 lessons, uk + en
             archive/legacy-docs/learn/data/laws-<cc>.json       country law tables of 3 lessons (+ UI strings of law-tables.js)
             archive/legacy-docs/interpreter/src/missions/*.json Interpreter Academy: 12 missions, 63 lessons, uk + en
             archive/legacy-docs/interpreter/src/i18n/<lang>.json  the Interpreter Academy in 9 more languages (de fr it cs pl pt hu fi lt)
             archive/legacy-docs/interpreter/src/ui.json         interface strings of the Interpreter Academy (en + uk)
             docs/learn/index.html                interface strings of the Academy (the `const T = {...}` table)
     writes  content/academy/
             lessons/<id>.json        142 masters (structure + en + uk); every text item has a stable key "k"
             i18n/<lang>/<id>.json    overlays for the 9 extra languages (texts by key + 8-hex SHA-1 of the English source)
             blocks.json routes.json id-map.json ids.lock levels.json badges.json practice.json
             facts.json               shared numbers and facts, one number in one place (empty at first; design §6.5)
             laws/<CC>.json           country law tables (byte copy of archive/legacy-docs/learn/data/laws-<cc>.json), used by body blocks t:"law"
             legacy/modules.json      archive: titles and intros of the old modules and missions (11 languages); not read by the build
             ui/<lang>.json           interface strings for all 11 ClayArena languages
             migration.json           what this run did (counts, warnings) — for the team

   Rules this script keeps (checked again by scripts/check_academy_migration.mjs):
     - Texts are copied BYTE FOR BYTE. Nothing is rewritten here; editors fix audit findings later in the masters.
     - Paragraph key = "<old lesson id>-p<n>" (unique in the whole Academy), so a paragraph keeps its 9 translations
       when an editor moves it to another lesson. Same idea for key points (-kp<n>), quiz (-q<n>), phrases (-ph<n>).
     - A lesson merged into another one is appended to the receiving master as blocks {"t":"draft","from":"<old id>"}.
       The build never publishes a lesson that still has a draft block; editors keep the facts and delete repeats.
     - Every lesson starts with status "draft". Nothing is deleted: the old sources stay until the switch-over release.
     - ClayArena languages only (en uk de fr it cs pl pt hu fi lt). No other language codes are written.

   Run once:   bun scripts/migrate_academy.mjs            (refuses to run if content/academy/lessons already exists)
               bun scripts/migrate_academy.mjs --force    (re-run from the old sources; DESTROYS edits made in content/academy)
               bun scripts/migrate_academy.mjs --dry      (build in memory, print the summary, write nothing)
   Then check: bun scripts/check_academy_migration.mjs

   In production (clayarena.com) these JSON files are imported into the ClayArena database (Lesson, LessonTranslation,
   Block, Route, Badge ...); the keys "k" become stable row ids of lesson items so translations and progress survive edits.
   ===================================================================================================== */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// The old sources were moved out of docs/ (no longer published) to archive/legacy-docs/ on 08.10.2026, byte for byte (owner
// decision: the site names no other clay discipline; they still did). The record texts written below keep the paths of 10.2026.
const SRC_LEARN = path.join(ROOT, "archive/legacy-docs/learn/data");
const SRC_INTERP = path.join(ROOT, "archive/legacy-docs/interpreter/src");
const OUT = path.join(ROOT, "content/academy");
const ARGS = new Set(process.argv.slice(2));
const DRY = ARGS.has("--dry");

/* ---------- languages: exactly the 11 ClayArena site languages; English is the master, uk is written with it ---------- */
const LANGS = ["en", "uk", "de", "fr", "it", "cs", "pl", "pt", "hu", "fi", "lt"];
const OVERLAY_LANGS = LANGS.slice(2);                       // the 9 languages that live in overlays i18n/<lang>/
/* First path segment after /learn/ that a lesson id may never take (design §5.1). */
const RESERVED = ["topics", "routes", "practice", "progress", "app", "data", "assets"];

/* ---------- §3 mapping: every old lesson (123 Academy + 63 Interpreter Academy) and the 13 new lessons ----------
   do: "keep" | "rewrite" | "new" | ">target" (merged into target).  audit: finding codes from the project audit
   that the editor must fix in this lesson (they are copied into the master's todo list). The codes come from the
   design mapping; codes whose place the audit report names more precisely were added by the migration check
   (A-21 health-eyes-vision, A-30 gun-fit, I-06 flight-pairs, I-11 compak-gun-and-call, I-15 *-singles-doubles,
   I-18 gear-chokes, R-10 referee-categories, S-01 lead-why).                                                    */
const PLAN = {
  // ---- learn ----
  "intro-what-is-clay-shooting": {src: "learn", do: "rewrite", audit: ["A-10"]},
  "intro-disciplines": {src: "learn", do: "keep", audit: ["G-07"]},
  "intro-fitasc-and-organisation": {src: "learn", do: "rewrite", audit: ["A-08"]},
  "intro-shooting-ground": {src: "learn", do: "keep"},
  "intro-who-shoots": {src: "learn", do: "rewrite", audit: ["A-20", "A-21"]},
  "intro-how-to-start": {src: "learn", do: "keep"},
  "safety-core-rules": {src: "learn", do: "rewrite"},
  "safety-eye-ear-protection": {src: "learn", do: "rewrite", audit: ["A-02"]},
  "safety-handling-carrying": {src: "learn", do: "keep"},
  "safety-stand-etiquette": {src: "learn", do: "rewrite"},
  "safety-malfunction": {src: "learn", do: ">rules-malfunctions"},
  "safety-spectators": {src: "learn", do: ">watching-at-the-ground"},
  "gun-types": {src: "learn", do: "rewrite", audit: ["A-26"]},
  "gun-parts": {src: "learn", do: "rewrite"},
  "gun-gauge-and-barrels": {src: "learn", do: "keep"},
  "gun-first-gun": {src: "learn", do: "rewrite"},
  "gun-fit": {src: "learn", do: "rewrite", audit: ["A-21", "A-22", "A-30"]},
  "gun-care": {src: "learn", do: "keep", audit: ["A-10"]},
  "gun-transport-documents": {src: "learn", do: "rewrite", audit: ["A-07"]},
  "chokes-what-is-a-choke": {src: "learn", do: "rewrite"},
  "chokes-fixed-and-multichoke": {src: "learn", do: "keep"},
  "chokes-names-and-marks": {src: "learn", do: "keep", audit: ["I-18"]},
  "chokes-choosing-for-distance": {src: "learn", do: "keep", audit: ["A-14"]},
  "chokes-steel-shot": {src: "learn", do: "keep", audit: ["A-12"]},
  "chokes-pattern-testing-and-care": {src: "learn", do: "keep"},
  "cartridges-anatomy": {src: "learn", do: "rewrite"},
  "cartridges-load-weight": {src: "learn", do: "keep", audit: ["A-01", "A-15"]},
  "cartridges-shot-size": {src: "learn", do: "keep", audit: ["A-23"]},
  "cartridges-velocity-recoil": {src: "learn", do: "keep", audit: ["A-16", "A-24"]},
  "cartridges-lead-and-steel": {src: "learn", do: "rewrite", audit: ["A-25"]},
  "cartridges-choosing-and-storage": {src: "learn", do: "keep"},
  "targets-target-types": {src: "learn", do: "rewrite", audit: ["G-05"]},
  "targets-basic-presentations": {src: "learn", do: "rewrite", audit: ["I-20"]},
  "targets-special-presentations": {src: "learn", do: "rewrite", audit: ["G-04", "S-04", "S-05"]},
  "targets-singles-and-doubles": {src: "learn", do: "rewrite", audit: ["S-02"]},
  "targets-compak-layout": {src: "learn", do: "rewrite", audit: ["A-28"]},
  "targets-reading-a-target": {src: "learn", do: "keep"},
  "technique-stance": {src: "learn", do: "rewrite"},
  "technique-gun-mount": {src: "learn", do: "rewrite", audit: ["G-08", "I-03"]},
  "technique-master-eye": {src: "learn", do: "rewrite"},
  "technique-hold-pickup-break-points": {src: "learn", do: "rewrite", audit: ["G-09", "G-11", "I-04", "S-09"]},
  "technique-lead-methods": {src: "learn", do: "rewrite", audit: ["I-05", "S-03"]},
  "technique-follow-through-and-mistakes": {src: "learn", do: "rewrite"},
  "technique-routine-and-coach": {src: "learn", do: ">mind-routine-under-pressure"},
  "competitions-types-of-events": {src: "learn", do: "keep", audit: ["A-13"]},
  "competitions-how-to-enter": {src: "learn", do: "keep", audit: ["A-07"]},
  "competitions-competition-day": {src: "learn", do: "rewrite"},
  "competitions-scoring-basics": {src: "learn", do: ">rules-hit-and-no-bird"},
  "competitions-categories-and-shoot-offs": {src: "learn", do: "rewrite", audit: ["A-19"]},
  "competitions-results-and-protests": {src: "learn", do: "rewrite", audit: ["R-10"]},
  "rules-gun-position": {src: "learn", do: "rewrite", audit: ["A-29"]},
  "rules-call-and-time": {src: "learn", do: "rewrite"},
  "rules-hit-and-no-bird": {src: "learn", do: "rewrite", audit: ["A-18"]},
  "rules-malfunctions": {src: "learn", do: "rewrite", audit: ["I-11"]},
  "rules-doubles": {src: "learn", do: "rewrite", audit: ["I-10"]},
  "rules-cards-and-appeals": {src: "learn", do: "rewrite"},
  "rules-dress-and-safety": {src: "learn", do: "rewrite", audit: ["A-17"]},
  "culture-sportsmanship-referee": {src: "learn", do: "rewrite"},
  "culture-dress-code": {src: "learn", do: ">rules-dress-and-safety"},
  "culture-traditions": {src: "learn", do: "rewrite"},
  "culture-environment": {src: "learn", do: "keep"},
  "culture-club-life": {src: "learn", do: "keep"},
  "culture-spectator-photo": {src: "learn", do: ">watching-at-the-ground"},
  "clayarena-what-is-clayarena": {src: "learn", do: "keep"},
  "clayarena-find-your-results": {src: "learn", do: "keep"},
  "clayarena-profile-numbers": {src: "learn", do: "keep"},
  "clayarena-videos-recaps-calendar": {src: "learn", do: "rewrite"},
  "clayarena-coaches-grounds-tours": {src: "learn", do: "rewrite", audit: ["A-09"]},
  "gear-shooting-vest": {src: "learn", do: "keep"},
  "gear-shooting-glasses": {src: "learn", do: "rewrite"},
  "gear-ear-protection": {src: "learn", do: "rewrite", audit: ["A-02"]},
  "gear-clothing-and-shoes": {src: "learn", do: "keep"},
  "gear-bags-cases-accessories": {src: "learn", do: "keep"},
  "gear-what-to-buy-first": {src: "learn", do: "keep"},
  "training-first-lessons-and-coach": {src: "learn", do: "keep"},
  "training-session-structure": {src: "learn", do: "keep"},
  "training-how-much-how-often": {src: "learn", do: "keep"},
  "training-dry-mount-practice": {src: "learn", do: "keep", audit: ["A-06"]},
  "training-for-competition": {src: "learn", do: "rewrite"},
  "training-diary-and-progress": {src: "learn", do: "keep"},
  "juniors-starting-age": {src: "learn", do: "keep"},
  "juniors-safety-supervision": {src: "learn", do: "keep", audit: ["A-17"]},
  "juniors-documents-licences": {src: "learn", do: "keep"},
  "juniors-equipment-fit": {src: "learn", do: "keep", audit: ["A-31"]},
  "juniors-support-without-pressure": {src: "learn", do: "rewrite"},
  "juniors-competitions-and-costs": {src: "learn", do: "keep"},
  "travel-planning-trip": {src: "learn", do: "keep", audit: ["G-03"]},
  "travel-gun-in-eu": {src: "learn", do: "keep", audit: ["A-07"]},
  "travel-gun-outside-eu": {src: "learn", do: "keep"},
  "travel-flying-with-guns": {src: "learn", do: "keep"},
  "travel-cartridges-at-destination": {src: "learn", do: "keep"},
  "travel-clayaway-tour": {src: "learn", do: "rewrite", audit: ["A-09"]},
  "mind-warm-up-mobility": {src: "learn", do: "keep", audit: ["G-03"]},
  "mind-concentration-focus": {src: "learn", do: "rewrite", audit: ["A-27"]},
  "mind-competition-nerves": {src: "learn", do: "rewrite", audit: ["A-04"]},
  "mind-routine-under-pressure": {src: "learn", do: "rewrite", audit: ["A-05"]},
  "mind-long-day-energy-sleep": {src: "learn", do: "rewrite"},
  "health-hearing": {src: "learn", do: ">gear-ear-protection", audit: ["A-02"]},
  "health-eyes-vision": {src: "learn", do: ">gear-shooting-glasses", audit: ["A-21"]},
  "health-lead-hygiene": {src: "learn", do: "keep", audit: ["A-10"]},
  "health-recoil-shoulder-neck": {src: "learn", do: "rewrite"},
  "health-alcohol-medication-weather": {src: "learn", do: ">mind-anti-doping", audit: ["A-03"]},
  "women-lady-category": {src: "learn", do: ">competitions-categories-and-shoot-offs"},
  "women-gun-fit": {src: "learn", do: ">gun-fit", audit: ["A-21", "A-22"]},
  "women-recoil-management": {src: "learn", do: ">health-recoil-shoulder-neck"},
  "women-clothing-community-start": {src: "learn", do: ">intro-who-shoots", audit: ["A-20"]},
  "budget-what-it-costs": {src: "learn", do: "keep", audit: ["A-07", "A-13"]},
  "budget-rent-or-buy": {src: "learn", do: ">gun-first-gun"},
  "budget-how-to-save": {src: "learn", do: "keep", audit: ["A-06", "A-11"]},
  "budget-first-year-plan": {src: "learn", do: "keep"},
  "history-live-birds-to-clays": {src: "learn", do: "keep", audit: ["A-10"]},
  "history-fitasc-founding": {src: "learn", do: "keep", audit: ["A-10"]},
  "history-birth-of-sporting": {src: "learn", do: "keep", audit: ["A-10"]},
  "history-compak-sporting": {src: "learn", do: "keep", audit: ["A-10"]},
  "history-olympics-and-world": {src: "learn", do: "keep", audit: ["A-10"]},
  "watching-what-to-look-at": {src: "learn", do: "keep"},
  "watching-reading-results": {src: "learn", do: "rewrite"},
  "watching-videos-and-recaps": {src: "learn", do: ">clayarena-videos-recaps-calendar"},
  "watching-at-the-ground": {src: "learn", do: "rewrite"},
  "nextstep-becoming-referee": {src: "learn", do: "keep"},
  "nextstep-becoming-coach": {src: "learn", do: "keep"},
  "nextstep-club-shoot-and-volunteering": {src: "learn", do: "keep"},
  "nextstep-organising-clayaway-tour": {src: "learn", do: ">travel-clayaway-tour", audit: ["A-09"]},
  // ---- interpreter ----
  "sport-what-is-clay": {src: "interpreter", do: ">intro-what-is-clay-shooting"},
  "sport-fitasc": {src: "interpreter", do: ">intro-fitasc-and-organisation"},
  "sport-sporting-layout": {src: "interpreter", do: ">targets-sporting-layout", audit: ["I-07"]},
  "sport-compak-layout": {src: "interpreter", do: ">targets-compak-layout"},
  "sport-competition-day": {src: "interpreter", do: ">competitions-competition-day"},
  "gear-gun-types": {src: "interpreter", do: ">gun-types"},
  "gear-gun-parts": {src: "interpreter", do: ">gun-parts"},
  "gear-chokes": {src: "interpreter", do: ">chokes-what-is-a-choke", audit: ["I-18"]},
  "gear-cartridges": {src: "interpreter", do: ">cartridges-anatomy"},
  "gear-protection-clothes": {src: "interpreter", do: ">rules-dress-and-safety"},
  "targets-types": {src: "interpreter", do: ">targets-target-types"},
  "targets-colours-visibility": {src: "interpreter", do: "keep"},
  "targets-traps": {src: "interpreter", do: "keep"},
  "targets-menu": {src: "interpreter", do: "keep", audit: ["I-02"]},
  "targets-hit-or-lost": {src: "interpreter", do: ">rules-hit-and-no-bird"},
  "flight-crosser": {src: "interpreter", do: ">targets-basic-presentations", audit: ["I-20"]},
  "flight-incomer-going-away": {src: "interpreter", do: "keep", audit: ["S-05"]},
  "flight-quartering": {src: "interpreter", do: ">targets-basic-presentations"},
  "flight-teal-chandelle-looper": {src: "interpreter", do: ">targets-special-presentations", audit: ["G-04", "S-04"]},
  "flight-rabbit": {src: "interpreter", do: "keep"},
  "flight-pairs": {src: "interpreter", do: ">targets-singles-and-doubles", audit: ["I-10", "I-06"]},
  "basics-stance": {src: "interpreter", do: ">technique-stance"},
  "basics-mount": {src: "interpreter", do: ">technique-gun-mount", audit: ["I-03"]},
  "basics-eyes": {src: "interpreter", do: ">technique-master-eye"},
  "basics-three-points": {src: "interpreter", do: ">technique-hold-pickup-break-points", audit: ["I-04"]},
  "basics-follow-through": {src: "interpreter", do: ">technique-follow-through-and-mistakes"},
  "lead-why": {src: "interpreter", do: ">technique-lead-methods", audit: ["I-05", "S-03", "S-01"]},
  "lead-maintained": {src: "interpreter", do: "keep", audit: ["S-01"]},
  "lead-swing-through": {src: "interpreter", do: "keep", audit: ["I-13"]},
  "lead-pull-away": {src: "interpreter", do: "keep", audit: ["I-06", "I-14"]},
  "lead-ambush-instinctive": {src: "interpreter", do: "rewrite", audit: ["I-01"]},
  "lead-how-coaches-say-it": {src: "interpreter", do: "keep", audit: ["I-12"]},
  "faults-behind-in-front": {src: "interpreter", do: "keep"},
  "faults-head-lift-stopping": {src: "interpreter", do: "keep"},
  "faults-mount-errors": {src: "interpreter", do: "keep"},
  "faults-pairs-transition": {src: "interpreter", do: "keep"},
  "faults-reading-the-coach": {src: "interpreter", do: "keep"},
  "sporting-rounds-stands": {src: "interpreter", do: ">targets-sporting-layout"},
  "sporting-gun-position": {src: "interpreter", do: ">rules-gun-position", audit: ["I-03"]},
  "sporting-singles-doubles": {src: "interpreter", do: ">rules-doubles", audit: ["I-15"]},
  "sporting-viewing": {src: "interpreter", do: ">rules-viewing-targets"},
  "sporting-malfunctions": {src: "interpreter", do: ">rules-malfunctions"},
  "sporting-time-and-lateness": {src: "interpreter", do: ">rules-call-and-time"},
  "compak-layout-rotation": {src: "interpreter", do: ">targets-compak-layout"},
  "compak-gun-and-call": {src: "interpreter", do: ">rules-call-and-time", audit: ["I-11"]},
  "compak-singles-doubles": {src: "interpreter", do: ">rules-doubles", audit: ["I-15"]},
  "compak-malfunctions": {src: "interpreter", do: ">rules-malfunctions", audit: ["I-11"]},
  "compak-dress-and-conduct": {src: "interpreter", do: ">rules-dress-and-safety"},
  "referee-calls": {src: "interpreter", do: "keep"},
  "referee-scoring": {src: "interpreter", do: ">watching-reading-results"},
  "referee-cards": {src: "interpreter", do: ">rules-cards-and-appeals"},
  "referee-appeals": {src: "interpreter", do: ">competitions-results-and-protests", audit: ["R-10"]},
  "referee-categories": {src: "interpreter", do: ">competitions-categories-and-shoot-offs", audit: ["R-10"]},
  "etiquette-gun-safety": {src: "interpreter", do: ">safety-core-rules"},
  "etiquette-on-the-stand": {src: "interpreter", do: ">safety-stand-etiquette"},
  "etiquette-squad": {src: "interpreter", do: ">culture-sportsmanship-referee"},
  "etiquette-protection-and-dress": {src: "interpreter", do: ">safety-eye-ear-protection", audit: ["A-13"]},
  "interpreter-role": {src: "interpreter", do: "keep"},
  "interpreter-position": {src: "interpreter", do: "keep"},
  "interpreter-false-friends": {src: "interpreter", do: "keep", audit: ["G-04", "I-09"]},
  "interpreter-numbers-and-units": {src: "interpreter", do: "keep"},
  "interpreter-english-sporting-vs-fitasc": {src: "interpreter", do: "keep"},
  "interpreter-session-script": {src: "interpreter", do: "keep", audit: ["I-03"]},
  // ---- new ----
  "targets-sporting-layout": {src: "new", do: "new"},
  "rules-viewing-targets": {src: "new", do: "new"},
  "mind-breathing": {src: "new", do: "new"},
  "mind-cue-words-self-talk": {src: "new", do: "new"},
  "mind-imagery": {src: "new", do: "new"},
  "mind-pressure-choking": {src: "new", do: "new"},
  "mind-reset-after-miss": {src: "new", do: "new"},
  "mind-process-goals": {src: "new", do: "new"},
  "mind-anti-doping": {src: "new", do: "new", audit: ["A-03"]},
  "travel-jet-lag": {src: "new", do: "new"},
  "stand-talk-shooter-phrases": {src: "new", do: "new"},
  "stand-talk-mental-game": {src: "new", do: "new"},
  "stand-talk-foreign-coach": {src: "new", do: "new"},
};

/* ---------- §1 blocks: a block is a TOPIC. The ONLY place where a lesson's block, section and order are set. ----------
   starters = "Почніть тут" lessons (level 1); all other lessons of the block are "Глибше" (level 2).
   Section ids are also URL anchors (/learn/topics/gear/#chokes) used by the old-link routers (id-map.json).        */
const BLOCKS = [
  { id: "basics", icon: "flag", title: { uk: "Основи", en: "Basics" },
    purpose: { uk: "Що це за спорт, дисципліни, FITASC, стрільбище, хто стріляє, як почати, скільки це коштує і як почати дитині.",
               en: "What the sport is, the disciplines, FITASC, the shooting ground, who shoots, how to start, what it costs and how a child can start." },
    starters: ["intro-what-is-clay-shooting", "intro-disciplines", "intro-how-to-start"], practice: ["term-cards"],
    sections: [
      { id: "what", title: { uk: "Що це за спорт", en: "What the sport is" }, lessons: ["intro-what-is-clay-shooting", "intro-disciplines", "intro-fitasc-and-organisation", "intro-shooting-ground", "intro-who-shoots"] },
      { id: "start", title: { uk: "Як почати", en: "How to start" }, lessons: ["intro-how-to-start", "budget-what-it-costs", "budget-how-to-save", "budget-first-year-plan"] },
      { id: "kids", title: { uk: "Дитині", en: "For a child" }, lessons: ["juniors-starting-age", "juniors-documents-licences"] }] },
  { id: "safety", icon: "shield", title: { uk: "Етикет і безпека", en: "Safety & etiquette" },
    purpose: { uk: "Звички безпеки, захист очей і слуху, свинець, діти; поведінка на стрілецькому місці й у групі, повага до судді, глядачі.",
               en: "Safety habits, eye and ear protection, lead, children; behaviour on the stand and in the group, respect for the referee, spectators." },
    starters: ["safety-core-rules", "safety-eye-ear-protection"], practice: [],
    sections: [
      { id: "safety", title: { uk: "Безпека", en: "Safety" }, lessons: ["safety-core-rules", "safety-handling-carrying", "safety-eye-ear-protection", "health-lead-hygiene", "juniors-safety-supervision"] },
      { id: "etiquette", title: { uk: "Етикет", en: "Etiquette" }, lessons: ["safety-stand-etiquette", "culture-sportsmanship-referee", "watching-at-the-ground"] }] },
  { id: "gear", icon: "tool", title: { uk: "Спорядження", en: "Gear" },
    purpose: { uk: "Рушниця, чоки, патрони, захист і одяг: як це називається, як працює, що і коли купувати.",
               en: "The gun, chokes, cartridges, protection and clothing: what things are called, how they work, what to buy and when." },
    starters: ["gun-parts", "chokes-what-is-a-choke", "cartridges-anatomy", "gear-what-to-buy-first"], practice: ["term-cards"],
    sections: [
      { id: "gun", title: { uk: "Рушниця", en: "The gun" }, lessons: ["gun-types", "gun-parts", "gun-gauge-and-barrels", "gun-first-gun", "gun-fit", "juniors-equipment-fit", "gun-care", "gun-transport-documents"] },
      { id: "chokes", title: { uk: "Чоки", en: "Chokes" }, lessons: ["chokes-what-is-a-choke", "chokes-fixed-and-multichoke", "chokes-names-and-marks", "chokes-choosing-for-distance", "chokes-steel-shot", "chokes-pattern-testing-and-care"] },
      { id: "cartridges", title: { uk: "Патрони", en: "Cartridges" }, lessons: ["cartridges-anatomy", "cartridges-load-weight", "cartridges-shot-size", "cartridges-velocity-recoil", "cartridges-lead-and-steel", "cartridges-choosing-and-storage"] },
      { id: "kit", title: { uk: "Екіпірування", en: "Kit" }, lessons: ["gear-what-to-buy-first", "gear-shooting-glasses", "gear-ear-protection", "gear-shooting-vest", "gear-clothing-and-shoes", "gear-bags-cases-accessories"] }] },
  { id: "targets", icon: "target", title: { uk: "Мішені і траєкторії", en: "Targets & flight lines" },
    purpose: { uk: "Мішені, машинки, майданчики {{tm:sporting}} і {{tm:compak}}, меню, траєкторії, дуплети і як читати мішень.",
               en: "Targets, traps, {{tm:sporting}} and {{tm:compak}} layouts, menus, flight lines, doubles and how to read a target." },
    starters: ["targets-target-types", "targets-basic-presentations"], practice: ["name-the-flight"],
    sections: [
      { id: "clays", title: { uk: "Мішені й машинки", en: "Targets and traps" }, lessons: ["targets-target-types", "targets-colours-visibility", "targets-traps"] },
      { id: "layouts", title: { uk: "Майданчики", en: "Layouts" }, lessons: ["targets-sporting-layout", "targets-compak-layout", "targets-menu"] },
      { id: "flight", title: { uk: "Траєкторії", en: "Flight lines" }, lessons: ["targets-basic-presentations", "flight-incomer-going-away", "targets-special-presentations", "flight-rabbit"] },
      { id: "pairs", title: { uk: "Дуплети і читання мішені", en: "Doubles and reading a target" }, lessons: ["targets-singles-and-doubles", "targets-reading-a-target"] }] },
  { id: "technique", icon: "stance", title: { uk: "Техніка і винос", en: "Technique & lead" },
    purpose: { uk: "Стійка, вкладка, очі, три точки, проводка, віддача; чотири методи виносу; розбір промахів.",
               en: "Stance, gun mount, eyes, the three points, follow-through, recoil; the four lead methods; reading misses." },
    starters: ["technique-stance", "technique-gun-mount", "technique-lead-methods"], practice: ["lead-lab", "name-the-flight"],
    sections: [
      { id: "fundamentals", title: { uk: "Основи пострілу", en: "Fundamentals of a shot" }, lessons: ["technique-stance", "technique-gun-mount", "technique-master-eye", "technique-hold-pickup-break-points", "technique-follow-through-and-mistakes", "health-recoil-shoulder-neck"] },
      { id: "lead", title: { uk: "Винос", en: "Lead" }, lessons: ["technique-lead-methods", "lead-maintained", "lead-swing-through", "lead-pull-away", "lead-ambush-instinctive"] },
      { id: "faults", title: { uk: "Помилки", en: "Faults" }, lessons: ["faults-behind-in-front", "faults-head-lift-stopping", "faults-mount-errors", "faults-pairs-transition"] }] },
  { id: "training", icon: "calendar", title: { uk: "Тренування", en: "Training" },
    purpose: { uk: "Тренер, структура й обсяг тренувань, розминка, сухе тренування вкладки, підготовка до змагань, щоденник.",
               en: "The coach, how to structure and dose training, warm-up, dry mount practice, preparing for a competition, a training diary." },
    starters: ["training-first-lessons-and-coach"], practice: [],
    sections: [
      { id: "main", title: { uk: "Тренування", en: "Training" }, lessons: ["training-first-lessons-and-coach", "training-session-structure", "training-how-much-how-often", "mind-warm-up-mobility", "training-dry-mount-practice", "training-for-competition", "training-diary-and-progress"] }] },
  { id: "mind", icon: "mind", title: { uk: "Психологія і підготовка", en: "Mind & preparation" },
    purpose: { uk: "Передпостріловий ритуал, увага, дихання, слова-підказки, уявна репетиція, хвилювання, тиск, перезапуск після промаху, цілі, день змагань, антидопінг, юніори.",
               en: "Pre-shot routine, attention, breathing, cue words, imagery, nerves, pressure, resetting after a miss, goals, competition day, anti-doping, juniors." },
    starters: ["mind-routine-under-pressure", "mind-reset-after-miss"], practice: [],
    sections: [
      { id: "before", title: { uk: "Перед пострілом", en: "Before the shot" }, lessons: ["mind-routine-under-pressure", "mind-concentration-focus", "mind-breathing", "mind-cue-words-self-talk", "mind-imagery"] },
      { id: "pressure", title: { uk: "Під тиском", en: "Under pressure" }, lessons: ["mind-competition-nerves", "mind-pressure-choking", "mind-reset-after-miss", "mind-process-goals"] },
      { id: "day", title: { uk: "День змагань", en: "Competition day" }, lessons: ["mind-long-day-energy-sleep", "mind-anti-doping"] },
      { id: "juniors", title: { uk: "Юніори", en: "Juniors" }, lessons: ["juniors-support-without-pressure"] }] },
  { id: "rules", icon: "whistle", title: { uk: "Правила", en: "Rules" },
    purpose: { uk: "Правила FITASC простими словами, коротко і своїми словами; у кожного правила позначка {{tm:sporting}} або {{tm:compak}} і посилання на довідник правил.",
               en: "FITASC rules in plain words, short and in our own words; every rule is marked {{tm:sporting}} or {{tm:compak}} and links to the rules guide." },
    starters: ["rules-hit-and-no-bird"], practice: ["referees-call", "rules-exam"],
    sections: [
      { id: "main", title: { uk: "Правила", en: "Rules" }, lessons: ["rules-gun-position", "rules-call-and-time", "rules-viewing-targets", "rules-hit-and-no-bird", "rules-malfunctions", "rules-doubles", "rules-cards-and-appeals", "rules-dress-and-safety"] }] },
  { id: "competitions", icon: "trophy", title: { uk: "Змагання", en: "Competitions" },
    purpose: { uk: "Види змагань, заявка, день змагань, картка і результати, категорії й перестрілки, протести, юніори.",
               en: "Types of competition, entering, competition day, the score card and results, categories and shoot-offs, protests, juniors." },
    starters: ["competitions-competition-day"], practice: [],
    sections: [
      { id: "main", title: { uk: "Змагання", en: "Competitions" }, lessons: ["competitions-types-of-events", "competitions-how-to-enter", "competitions-competition-day", "watching-reading-results", "competitions-categories-and-shoot-offs", "competitions-results-and-protests", "juniors-competitions-and-costs"] }] },
  { id: "travel", icon: "plane", title: { uk: "Подорожі", en: "Travel" },
    purpose: { uk: "Поїздка, рушниця в ЄС і за його межами, літак, набої на місці, зміна часових поясів; тури ClayAway (готується).",
               en: "Planning a trip, the gun in the EU and outside it, flying, cartridges at the destination, jet lag; ClayAway tours (coming soon)." },
    starters: ["travel-planning-trip"], practice: [],
    sections: [
      { id: "main", title: { uk: "Подорожі", en: "Travel" }, lessons: ["travel-planning-trip", "travel-gun-in-eu", "travel-gun-outside-eu", "travel-flying-with-guns", "travel-cartridges-at-destination", "travel-jet-lag", "travel-clayaway-tour"] }] },
  { id: "stand-talk", icon: "speech", title: { uk: "Мова стенду", en: "Stand Talk" },
    purpose: { uk: "Як говорять тренер, суддя і стрільці; робота перекладача; для всіх, хто тренується з тренером, який говорить іншою мовою.",
               en: "How the coach, the referee and shooters talk; the interpreter's work; for everyone who trains with a coach who speaks another language." },
    starters: ["interpreter-role", "referee-calls"], practice: ["translate-the-coach", "phrasebook"],
    sections: [
      { id: "role", title: { uk: "Роль", en: "The role" }, lessons: ["interpreter-role", "interpreter-position"] },
      { id: "said", title: { uk: "Що кажуть на стенді", en: "What is said on the stand" }, lessons: ["referee-calls", "stand-talk-shooter-phrases", "faults-reading-the-coach", "lead-how-coaches-say-it", "stand-talk-mental-game"] },
      { id: "traps", title: { uk: "Пастки перекладу", en: "Translation pitfalls" }, lessons: ["interpreter-false-friends", "interpreter-numbers-and-units", "interpreter-english-sporting-vs-fitasc"] },
      { id: "work", title: { uk: "Робота", en: "On the job" }, lessons: ["stand-talk-foreign-coach", "interpreter-session-script"] }] },
  { id: "watch", icon: "eye", title: { uk: "Дивитися і стежити", en: "Watch & follow" },
    purpose: { uk: "Як дивитися стрільбу і відео; ClayArena: результати, профіль, цифри, каталоги.",
               en: "How to watch shooting and videos; ClayArena: results, profile, numbers, catalogues." },
    starters: ["watching-what-to-look-at"], practice: ["name-the-flight"],
    sections: [
      { id: "watch", title: { uk: "Дивитися", en: "Watching" }, lessons: ["watching-what-to-look-at"] },
      { id: "clayarena", title: { uk: "ClayArena", en: "ClayArena" }, lessons: ["clayarena-what-is-clayarena", "clayarena-find-your-results", "clayarena-profile-numbers", "clayarena-videos-recaps-calendar", "clayarena-coaches-grounds-tours"] }] },
  { id: "community", icon: "people", title: { uk: "Спільнота та історія", en: "Community & history" },
    purpose: { uk: "Історія, традиції, природа, клуб; як стати суддею чи тренером; клубний турнір.",
               en: "History, traditions, nature, the club; how to become a referee or a coach; a club shoot." },
    starters: [], practice: [],
    sections: [
      { id: "history", title: { uk: "Історія", en: "History" }, lessons: ["history-live-birds-to-clays", "history-fitasc-founding", "history-birth-of-sporting", "history-compak-sporting", "history-olympics-and-world"] },
      { id: "culture", title: { uk: "Культура", en: "Culture" }, lessons: ["culture-traditions", "culture-environment", "culture-club-life"] },
      { id: "next", title: { uk: "Наступний крок", en: "The next step" }, lessons: ["nextstep-becoming-referee", "nextstep-becoming-coach", "nextstep-club-shoot-and-volunteering"] }] },
];

/* ---------- §2 routes: a route is a READER. Only lists of lesson ids; a lesson done once counts in every route. ----------
   stages ≤ 11 lessons / about 60 min, each stage has its badge; extras = "Хочете глибше" (folded, not needed for the certificate). */
const ROUTES = [
  { id: "beginner", primary: true, icon: "seedling", title: { uk: "Новачок", en: "Beginner" },
    for: { uk: "Для того, хто ще не стріляв.", en: "For someone who has never shot." },
    stages: [
      { id: "first-visit", title: { uk: "До першого візиту", en: "Before your first visit" }, lessons: ["intro-what-is-clay-shooting", "intro-disciplines", "intro-shooting-ground", "intro-how-to-start", "budget-what-it-costs", "safety-core-rules", "safety-eye-ear-protection", "safety-handling-carrying", "safety-stand-etiquette", "gear-what-to-buy-first"] },
      { id: "first-shots", title: { uk: "Перші постріли", en: "First shots" }, lessons: ["gun-parts", "targets-target-types", "targets-basic-presentations", "technique-stance", "technique-gun-mount", "technique-master-eye", "technique-hold-pickup-break-points", "technique-lead-methods", "training-first-lessons-and-coach"] }],
    extras: ["intro-who-shoots", "gun-first-gun", "gear-ear-protection", "gear-shooting-glasses", "gear-clothing-and-shoes", "targets-reading-a-target", "technique-follow-through-and-mistakes", "rules-malfunctions", "budget-how-to-save", "budget-first-year-plan"],
    practice: [],
    certificate: { title: { uk: "Перший крок", en: "First step" }, exam: { n: 15, pass_pct: 80 } } },
  { id: "first-competition", primary: true, icon: "trophy", title: { uk: "Перші змагання", en: "First competition" },
    for: { uk: "Для стрільця після кількох занять.", en: "For a shooter after a few sessions." },
    stages: [
      { id: "ready", title: { uk: "Підготовка", en: "Getting ready" }, lessons: ["training-for-competition", "competitions-types-of-events", "competitions-how-to-enter", "targets-sporting-layout", "targets-compak-layout", "targets-menu", "targets-singles-and-doubles"] },
      { id: "rules", title: { uk: "Правила, які треба знати", en: "Rules you need to know" }, lessons: ["rules-gun-position", "rules-call-and-time", "rules-viewing-targets", "rules-hit-and-no-bird", "rules-malfunctions", "rules-doubles", "rules-cards-and-appeals", "rules-dress-and-safety"] },
      { id: "head", title: { uk: "Голова і тіло", en: "Mind and body" }, lessons: ["mind-routine-under-pressure", "mind-process-goals", "mind-competition-nerves", "mind-reset-after-miss", "mind-long-day-energy-sleep", "mind-anti-doping"] },
      { id: "day", title: { uk: "День змагань", en: "Competition day" }, lessons: ["competitions-competition-day", "culture-sportsmanship-referee", "stand-talk-shooter-phrases", "watching-reading-results", "competitions-results-and-protests", "competitions-categories-and-shoot-offs"] }],
    extras: ["mind-concentration-focus", "mind-breathing", "mind-cue-words-self-talk", "mind-imagery", "mind-pressure-choking", "training-diary-and-progress", "cartridges-choosing-and-storage", "gear-shooting-vest", "travel-planning-trip", "clayarena-find-your-results"],
    practice: [{ game: "rules-exam", mode: "short", n: 10, min_pct: 80, discipline: "choose" }],
    checklist: { source: "key_points.checklist", title: { uk: "Чек-лист дня змагань", en: "Competition day checklist" } },
    certificate: { exam: { n: 20, pass_pct: 80 } } },
  { id: "interpreter", primary: true, icon: "speech", notes_open: true, title: { uk: "Перекладач", en: "Interpreter" },
    for: { uk: "Для перекладачів на стенді; замінює Академію перекладача.", en: "For interpreters on the stand; replaces the Interpreter Academy." },
    stages: [
      { id: "day-one", title: { uk: "Перший день на стенді", en: "First day on the stand" }, lessons: ["intro-what-is-clay-shooting", "safety-core-rules", "safety-eye-ear-protection", "safety-stand-etiquette", "culture-sportsmanship-referee", "interpreter-role", "interpreter-position", "referee-calls", "interpreter-false-friends", "gun-parts"] },
      { id: "sport", title: { uk: "Спорт і майданчики", en: "The sport and the layouts" }, lessons: ["intro-fitasc-and-organisation", "targets-sporting-layout", "targets-compak-layout", "targets-traps", "targets-menu", "competitions-competition-day"] },
      { id: "gear-targets", title: { uk: "Рушниця і мішені", en: "Gun and targets" }, lessons: ["gun-types", "chokes-what-is-a-choke", "cartridges-anatomy", "targets-target-types", "targets-colours-visibility", "targets-basic-presentations", "flight-incomer-going-away", "targets-special-presentations", "flight-rabbit", "targets-singles-and-doubles"] },
      { id: "technique", title: { uk: "Техніка", en: "Technique" }, lessons: ["technique-stance", "technique-gun-mount", "technique-master-eye", "technique-hold-pickup-break-points", "technique-follow-through-and-mistakes", "technique-lead-methods"] },
      { id: "lead", title: { uk: "Винос", en: "Lead" }, lessons: ["lead-maintained", "lead-swing-through", "lead-pull-away", "lead-ambush-instinctive", "lead-how-coaches-say-it"] },
      { id: "coach-talk", title: { uk: "Помилки і мова тренера", en: "Faults and coach-speak" }, lessons: ["faults-behind-in-front", "faults-head-lift-stopping", "faults-mount-errors", "faults-pairs-transition", "faults-reading-the-coach", "interpreter-numbers-and-units", "stand-talk-mental-game"] },
      { id: "rules", title: { uk: "Правила на стенді", en: "Rules on the stand" }, lessons: ["rules-gun-position", "rules-call-and-time", "rules-viewing-targets", "rules-hit-and-no-bird", "rules-malfunctions", "rules-doubles"] },
      { id: "referee", title: { uk: "Суддя, картки і результати", en: "Referee, cards and results" }, lessons: ["rules-cards-and-appeals", "rules-dress-and-safety", "competitions-results-and-protests", "competitions-categories-and-shoot-offs", "watching-reading-results", "stand-talk-shooter-phrases"] },
      { id: "mastery", title: { uk: "Майстерність", en: "Mastery" }, lessons: ["interpreter-english-sporting-vs-fitasc", "mind-routine-under-pressure", "stand-talk-foreign-coach", "interpreter-session-script"] }],
    extras: ["targets-reading-a-target", "chokes-names-and-marks", "cartridges-shot-size", "gun-gauge-and-barrels", "gear-ear-protection", "mind-cue-words-self-talk", "mind-reset-after-miss"],
    practice: [{ game: "translate-the-coach", min_pct: 80 }, { game: "referees-call", min_pct: 80 }],
    certificate: { exam: { n: 30, pass_pct: 80 }, legacy: "clayarena-interpreter.exam" } },
  { id: "junior-parent", primary: true, icon: "family", title: { uk: "Батьки юніора", en: "Parents of a junior" },
    for: { uk: "Для батьків, чия дитина хоче стріляти.", en: "For parents whose child wants to shoot." },
    stages: [
      { id: "is-it-for-my-child", title: { uk: "Чи підходить це дитині", en: "Is it right for my child" }, lessons: ["juniors-starting-age", "intro-what-is-clay-shooting", "intro-how-to-start", "juniors-documents-licences", "budget-what-it-costs"] },
      { id: "safe-start", title: { uk: "Безпечний старт", en: "A safe start" }, lessons: ["safety-core-rules", "juniors-safety-supervision", "safety-eye-ear-protection", "health-lead-hygiene", "juniors-equipment-fit", "training-first-lessons-and-coach"] },
      { id: "support", title: { uk: "Підтримка і змагання", en: "Support and competitions" }, lessons: ["juniors-support-without-pressure", "watching-at-the-ground", "competitions-competition-day", "juniors-competitions-and-costs"] }],
    extras: ["intro-who-shoots", "gear-ear-protection", "gear-shooting-glasses", "health-recoil-shoulder-neck", "mind-competition-nerves", "mind-reset-after-miss", "watching-what-to-look-at"],
    practice: [],
    checklist: { source: "key_points.checklist", title: { uk: "Чек-лист для батьків", en: "Checklist for parents" } },
    certificate: { exam: { n: 12, pass_pct: 80 } } },
  { id: "new-coach", primary: false, icon: "whistle", title: { uk: "Тренер-початківець", en: "New coach" },
    for: { uk: "Для того, хто починає тренувати інших.", en: "For someone who is starting to coach others." },
    disclaimer: { uk: "Не є кваліфікацією тренера.", en: "Not a coaching qualification." },
    stages: [
      { id: "role", title: { uk: "Роль тренера", en: "The coach's role" }, lessons: ["nextstep-becoming-coach", "safety-core-rules", "juniors-safety-supervision", "training-first-lessons-and-coach", "training-session-structure", "training-how-much-how-often"] },
      { id: "diagnosis", title: { uk: "Основи і діагностика", en: "Fundamentals and diagnosis" }, lessons: ["technique-master-eye", "gun-fit", "technique-stance", "technique-gun-mount", "technique-hold-pickup-break-points", "technique-lead-methods", "faults-behind-in-front", "faults-head-lift-stopping", "faults-mount-errors", "faults-pairs-transition"] },
      { id: "mental", title: { uk: "Тренування і голова", en: "Training and the mind" }, lessons: ["training-dry-mount-practice", "mind-routine-under-pressure", "mind-cue-words-self-talk", "mind-reset-after-miss", "training-for-competition", "juniors-support-without-pressure", "stand-talk-foreign-coach"] }],
    extras: ["health-recoil-shoulder-neck", "mind-concentration-focus", "mind-imagery", "mind-pressure-choking", "mind-process-goals", "training-diary-and-progress", "mind-warm-up-mobility", "faults-reading-the-coach"],
    practice: [{ game: "lead-lab", require: "hit-with-each-method", enabled_after: "S-01" }],
    certificate: { exam: { n: 20, pass_pct: 80 } } },
  { id: "organiser", primary: false, icon: "calendar", title: { uk: "Організатор", en: "Organiser" },
    for: { uk: "Для організаторів клубних турнірів і поїздок.", en: "For organisers of club shoots and trips." },
    stages: [
      { id: "club-events", title: { uk: "Змагання і клуб", en: "Competitions and the club" }, lessons: ["nextstep-club-shoot-and-volunteering", "competitions-types-of-events", "competitions-competition-day", "competitions-categories-and-shoot-offs", "rules-dress-and-safety", "watching-at-the-ground", "juniors-safety-supervision", "culture-environment"] },
      { id: "trips", title: { uk: "Поїздки і тури", en: "Trips and tours" }, lessons: ["travel-planning-trip", "travel-gun-in-eu", "travel-gun-outside-eu", "travel-flying-with-guns", "travel-cartridges-at-destination", "travel-jet-lag", "mind-long-day-energy-sleep", "interpreter-role", "stand-talk-foreign-coach", "travel-clayaway-tour"] }],
    extras: ["nextstep-becoming-referee", "culture-traditions", "culture-club-life", "clayarena-coaches-grounds-tours", "mind-anti-doping", "competitions-results-and-protests"],
    practice: [],
    certificate: { exam: { n: 15, pass_pct: 80 } } },
  { id: "fan", primary: false, icon: "eye", title: { uk: "Вболівальник і родина", en: "Fan & family" },
    for: { uk: "Для вболівальників, родини й друзів стрільців.", en: "For fans, families and friends of shooters." },
    stages: [
      { id: "watch", title: { uk: "Дивитися і розуміти", en: "Watching and understanding" }, lessons: ["intro-what-is-clay-shooting", "intro-disciplines", "watching-at-the-ground", "watching-what-to-look-at", "targets-basic-presentations", "targets-singles-and-doubles"] },
      { id: "results", title: { uk: "Результати і ClayArena", en: "Results and ClayArena" }, lessons: ["watching-reading-results", "competitions-categories-and-shoot-offs", "clayarena-what-is-clayarena", "clayarena-find-your-results", "clayarena-profile-numbers", "clayarena-videos-recaps-calendar", "culture-sportsmanship-referee"] }],
    extras: ["history-live-birds-to-clays", "history-birth-of-sporting", "history-compak-sporting", "history-olympics-and-world", "culture-traditions"],
    practice: [{ game: "name-the-flight", min_score: 7, of: 10 }],
    certificate: null, badge_only: { quiz: { n: 10, pass_pct: 80 } } },
];

/* Reading time per final lesson (design estimate: today's minutes + 1–2 min per merged lesson, at most 8). */
const MINUTES = {"intro-what-is-clay-shooting":6,"intro-disciplines":5,"intro-fitasc-and-organisation":6,"intro-shooting-ground":4,"intro-who-shoots":6,"intro-how-to-start":5,"safety-core-rules":6,"safety-eye-ear-protection":6,"safety-handling-carrying":4,"safety-stand-etiquette":6,"gun-types":6,"gun-parts":6,"gun-gauge-and-barrels":5,"gun-first-gun":6,"gun-fit":7,"gun-care":5,"gun-transport-documents":6,"chokes-what-is-a-choke":6,"chokes-fixed-and-multichoke":5,"chokes-names-and-marks":6,"chokes-choosing-for-distance":5,"chokes-steel-shot":5,"chokes-pattern-testing-and-care":5,"cartridges-anatomy":6,"cartridges-load-weight":4,"cartridges-shot-size":5,"cartridges-velocity-recoil":4,"cartridges-lead-and-steel":6,"cartridges-choosing-and-storage":5,"targets-target-types":6,"targets-basic-presentations":7,"targets-special-presentations":7,"targets-singles-and-doubles":7,"targets-compak-layout":8,"targets-reading-a-target":5,"technique-stance":6,"technique-gun-mount":7,"technique-master-eye":6,"technique-hold-pickup-break-points":6,"technique-lead-methods":7,"technique-follow-through-and-mistakes":6,"competitions-types-of-events":4,"competitions-how-to-enter":5,"competitions-competition-day":7,"competitions-categories-and-shoot-offs":8,"competitions-results-and-protests":6,"rules-gun-position":6,"rules-call-and-time":7,"rules-hit-and-no-bird":8,"rules-malfunctions":7,"rules-doubles":7,"rules-cards-and-appeals":7,"rules-dress-and-safety":7,"culture-sportsmanship-referee":6,"culture-traditions":5,"culture-environment":4,"culture-club-life":3,"clayarena-what-is-clayarena":3,"clayarena-find-your-results":4,"clayarena-profile-numbers":5,"clayarena-videos-recaps-calendar":5,"clayarena-coaches-grounds-tours":4,"gear-shooting-vest":5,"gear-shooting-glasses":6,"gear-ear-protection":6,"gear-clothing-and-shoes":4,"gear-bags-cases-accessories":5,"gear-what-to-buy-first":4,"training-first-lessons-and-coach":5,"training-session-structure":5,"training-how-much-how-often":4,"training-dry-mount-practice":5,"training-for-competition":5,"training-diary-and-progress":5,"juniors-starting-age":5,"juniors-safety-supervision":5,"juniors-documents-licences":4,"juniors-equipment-fit":5,"juniors-support-without-pressure":5,"juniors-competitions-and-costs":6,"travel-planning-trip":6,"travel-gun-in-eu":5,"travel-gun-outside-eu":5,"travel-flying-with-guns":6,"travel-cartridges-at-destination":5,"travel-clayaway-tour":6,"mind-warm-up-mobility":4,"mind-concentration-focus":5,"mind-competition-nerves":5,"mind-routine-under-pressure":6,"mind-long-day-energy-sleep":6,"health-lead-hygiene":4,"health-recoil-shoulder-neck":6,"budget-what-it-costs":5,"budget-how-to-save":4,"budget-first-year-plan":5,"history-live-birds-to-clays":5,"history-fitasc-founding":4,"history-birth-of-sporting":5,"history-compak-sporting":4,"history-olympics-and-world":5,"watching-what-to-look-at":5,"watching-reading-results":6,"watching-at-the-ground":7,"nextstep-becoming-referee":5,"nextstep-becoming-coach":5,"nextstep-club-shoot-and-volunteering":6,"targets-colours-visibility":5,"targets-traps":5,"targets-menu":5,"flight-incomer-going-away":5,"flight-rabbit":5,"lead-maintained":5,"lead-swing-through":5,"lead-pull-away":5,"lead-ambush-instinctive":5,"lead-how-coaches-say-it":6,"faults-behind-in-front":5,"faults-head-lift-stopping":5,"faults-mount-errors":5,"faults-pairs-transition":5,"faults-reading-the-coach":5,"referee-calls":5,"interpreter-role":5,"interpreter-position":5,"interpreter-false-friends":6,"interpreter-numbers-and-units":5,"interpreter-english-sporting-vs-fitasc":5,"interpreter-session-script":8,"targets-sporting-layout":7,"rules-viewing-targets":6,"mind-breathing":5,"mind-cue-words-self-talk":5,"mind-imagery":5,"mind-pressure-choking":5,"mind-reset-after-miss":5,"mind-process-goals":5,"mind-anti-doping":6,"travel-jet-lag":5,"stand-talk-shooter-phrases":5,"stand-talk-mental-game":5,"stand-talk-foreign-coach":5};

/* ---------- §4 the 13 new lessons: title + brief for the author (en is the master, uk is written with it) ----------
   Briefs are internal (content/academy is not published). Plain, cautious wording; check every number against
   docs/rules/data (FITASC rules) or the cited source before it goes into the lesson text.                       */
const NEW_LESSONS = {
  "targets-sporting-layout": {
    title: { en: "How a {{tm:sporting}} layout and round work", uk: "Як влаштовані майданчик і раунд {{tm:sporting}}" },
    brief: {
      en: ["Assembled from sport-sporting-layout and sporting-rounds-stands: their paragraphs (translated into all 11 languages) are the core of this lesson.",
           "The layout and its shooting stands (a 1 m square or circle).",
           "Traps A–D from left to right as seen from the stand.",
           "A round of 25 targets: 15 singles and 5 doubles, singles first (check against docs/rules/data/sporting.js).",
           "A group of up to 6 shooters; the shooting order rotates.",
           "200 targets at international competitions; difficulty classes A, B and C.",
           "Pair lesson: targets-compak-layout."],
      uk: ["Зібрано з sport-sporting-layout і sporting-rounds-stands: їхні абзаци (з перекладами всіма 11 мовами) — ядро уроку.",
           "Майданчик і стрілецькі місця (квадрат або коло 1 м).",
           "Машинки A–D зліва направо, якщо дивитися зі стрілецького місця.",
           "Раунд — 25 мішеней: 15 одиночних і 5 дуплетів, спочатку одиночні (звірити з docs/rules/data/sporting.js).",
           "Група до 6 стрільців, порядок стрільби змінюється.",
           "200 мішеней на міжнародних змаганнях; класи складності A, B і C.",
           "Парний урок: targets-compak-layout."] } },
  "rules-viewing-targets": {
    title: { en: "Viewing the targets", uk: "Показ мішеней перед стрільбою" },
    brief: {
      en: ["Assembled from sporting-viewing and the viewing paragraph of compak-gun-and-call.",
           "{{tm:sporting}}: the targets are shown to the first shooter in the ready position; a repeat on request follows the rule (link to the rules guide).",
           "Report pairs are not shown as pairs; simultaneous pairs and rafales are shown.",
           "Mock shooting is not allowed.",
           "After a break of more than 10 minutes the targets are shown again.",
           "{{tm:compak}}: one viewing in the morning for the first group — the singles A–F, then the simultaneous pairs; after a break of more than 10 minutes the singles are shown again.",
           "A short practical lesson in our own words with key numbers only; details and penalties stay in the rules guide (noindex). Check every point against docs/rules/data."],
      uk: ["Зібрано з sporting-viewing і абзацу про показ із compak-gun-and-call.",
           "{{tm:sporting}}: траєкторії показують першому стрільцеві в положенні готовності; повтор на прохання — за правилом (посилання на довідник правил).",
           "Дуплети за пострілом як дуплет не показують; одночасні дуплети і рафаль показують.",
           "Імітація стрільби заборонена.",
           "Після перерви понад 10 хвилин показ повторюють.",
           "{{tm:compak}}: один показ уранці для першої групи — одиночні A–F, потім одночасні дуплети; після перерви понад 10 хвилин одиночні показують знову.",
           "Короткий практичний урок своїми словами, лише ключові числа; подробиці й штрафи — у довіднику правил (noindex). Кожен пункт звірити з docs/rules/data."] } },
  "mind-breathing": {
    title: { en: "Breathing: what to do and when", uk: "Дихання: що робити і коли" },
    brief: {
      en: ["A table 'moment → what to do'.",
           "On training days: 5–10 minutes of slow breathing, about 6 breaths a minute.",
           "2–5 minutes before the stand: a few slow breaths, with a longer out-breath if that feels comfortable.",
           "At the call: one normal breath out and loose shoulders, no long slow breathing (it may slow the reaction to the target).",
           "After a miss: one slow breath out.",
           "Box breathing and the 'physiological sigh' are options with limited data: present them as something you can try (audit A-04).",
           "Evidence: the physiology is well researched; the effect on the score has little research. Receives the breathing paragraph of mind-competition-nerves."],
      uk: ["Таблиця «момент → що робити».",
           "У тренувальні дні: 5–10 хвилин повільного дихання, приблизно 6 вдихів за хвилину.",
           "За 2–5 хвилин до стрілецького місця: кілька повільних вдихів, видих довший, якщо так зручно.",
           "Перед командою: один звичайний видих і опущені плечі, без довгого повільного дихання (воно може сповільнити реакцію на мішень).",
           "Після промаху: один повільний видих.",
           "Box breathing і «фізіологічне зітхання» — варіанти з обмеженими даними: подавати як те, що можна спробувати (аудит A-04).",
           "Доказовість: фізіологію добре досліджено; вплив на рахунок — мало досліджень. Сюди переходить абзац про дихання з mind-competition-nerves."] } },
  "mind-cue-words-self-talk": {
    title: { en: "Cue words and self-talk", uk: "Слова-підказки і розмова з собою" },
    brief: {
      en: ["2–3 short cue words about the target, chosen with the coach: 'front edge', 'smooth', 'finish'.",
           "Say what to do rather than 'don't stop the gun': cues with 'don't' sometimes bring on the same fault.",
           "Motivational phrases belong between stands.",
           "The interpreter translates the coach's cue the same way every time.",
           "Evidence: some research (moderate)."],
      uk: ["2–3 короткі підказки про мішень, вибрані разом із тренером: «передній край», «плавно», «до кінця».",
           "Казати, що робити, а не «не зупиняй рушницю»: підказки з «не» іноді викликають ту саму помилку.",
           "Мотиваційні фрази — між стрілецькими місцями.",
           "Перекладач перекладає підказку тренера щоразу однаково.",
           "Доказовість: є дослідження (помірна)."] } },
  "mind-imagery": {
    title: { en: "Imagery: rehearse the stand", uk: "Уявна репетиція: пройти стрілецьке місце подумки" },
    brief: {
      en: ["After the viewing, picture the hold, pick-up and break points: through your own eyes, in real time, 1–2 times per target.",
           "Hold the gun only where the rules allow it, and never mount or swing it outside the stand (mock shooting).",
           "Rehearse the reset after a miss as well.",
           "{{tm:compak}}: run through the menu of the next station in your head while you wait.",
           "On average imagery helps, but how much is unclear. Evidence: some research (moderate)."],
      uk: ["Після показу побачити подумки точку утримання, точку підхоплення і точку пострілу: своїми очима, у реальному часі, 1–2 рази на мішень.",
           "Тримати рушницю лише там, де це дозволяють правила, і ніколи не вкладатися й не вести рушницю поза стрілецьким місцем (імітація стрільби).",
           "Відрепетирувати подумки і перезапуск після промаху.",
           "{{tm:compak}}: поки чекаєте, пройти подумки меню наступного номера.",
           "У середньому уявна репетиція допомагає, але наскільки — неясно. Доказовість: є дослідження (помірна)."] } },
  "mind-pressure-choking": {
    title: { en: "Pressure and choking: why easy targets get missed", uk: "Тиск і зрив: чому мажуть легку мішень" },
    brief: {
      en: ["Signs: rushing or delaying the call, consciously checking the gun mount, looking at the bead, watching the score and rivals, tension, misses on easy targets.",
           "What can help: the usual routine and tempo, one simple cue, process goals, training under moderate pressure (link: training-for-competition).",
           "In a shoot-off: the same routine and the same tempo.",
           "Evidence: some research (moderate); research is from lab tasks and other sports, so for {{tm:sporting}} and {{tm:compak}} write 'probably transfers'."],
      uk: ["Ознаки: поспіх або затягування команди, свідома перевірка вкладки, погляд на мушку, стеження за рахунком і суперниками, скутість, промахи по легких мішенях.",
           "Що може допомогти: звичний ритуал і темп, одна проста підказка, цілі процесу, тренування під помірним тиском (посилання: training-for-competition).",
           "У перестрілці — той самий ритуал і той самий темп.",
           "Доказовість: є дослідження (помірна); дослідження проводили в лабораторії та в інших видах спорту, тому про {{tm:sporting}} і {{tm:compak}} писати «імовірно, переноситься»."] } },
  "mind-reset-after-miss": {
    title: { en: "Reset after a miss", uk: "Перезапуск після промаху" },
    brief: {
      en: ["Five steps in 5–10 seconds: the gun safe as the rules require; one slow breath out; one correction in 2–3 words; a short picture of the right shot; the next routine.",
           "Ask 'why' after the round; look at the score when you sign the card.",
           "The same after an unwelcome referee decision: protest at once and in the correct way (link to the rules lesson), then let it go.",
           "A bad stand is not a bad day.",
           "Evidence: little research; coaches' experience."],
      uk: ["П’ять кроків за 5–10 секунд: рушниця в безпечному положенні, як вимагають правила; один повільний видих; одна поправка у 2–3 словах; коротка картинка правильного пострілу; наступний ритуал.",
           "Питання «чому» — після раунду; рахунок — коли підписуєте картку.",
           "Те саме після неприємного рішення судді: протест одразу і правильно (посилання на урок правил), потім відпустити.",
           "Погане стрілецьке місце — це ще не поганий день.",
           "Доказовість: мало досліджень; досвід тренерів."] } },
  "mind-process-goals": {
    title: { en: "Process goals and the score", uk: "Цілі процесу і рахунок" },
    brief: {
      en: ["Process goals ('the full routine on every target') tend to help more than outcome goals ('win'); a personal standard ('22 of 25 on this layout') sits in between.",
           "How to set goals for a first competition.",
           "Look at the score when you sign the card.",
           "Evidence: some research (moderate); the order 'process > standard > outcome' is more reliable than any exact numbers."],
      uk: ["Цілі процесу («повний ритуал на кожній мішені») зазвичай допомагають більше, ніж цілі результату («виграти»); особиста норма («22 із 25 на цьому майданчику») — посередині.",
           "Як поставити цілі на перші змагання.",
           "Рахунок дивитися, коли підписуєте картку.",
           "Доказовість: є дослідження (помірна); порядок «процес > норма > результат» надійніший за будь-які точні числа."] } },
  "mind-anti-doping": {
    title: { en: "Medicines and anti-doping: beta-blockers, TUE, supplements", uk: "Ліки й антидопінг: бета-блокатори, TUE, добавки" },
    brief: {
      en: ["The WADA Prohibited Lists for 2026 and 2027 prohibit beta-blockers in shooting (ISSF, IPC) at all times, in and out of competition. FITASC is not named there; the project rule is to treat them as prohibited for every clay shooter.",
           "Do not stop a prescribed medicine on your own: talk to your doctor and your federation in advance about an alternative or a TUE (Therapeutic Use Exemption).",
           "Check medicines in Global DRO.",
           "Stimulants in some cold and ADHD medicines are prohibited in competition.",
           "THC is prohibited. CBD is not, but CBD products can contain THC.",
           "Supplements only with batch testing. Caffeine is not prohibited.",
           "Alcohol has not been on the WADA list since 2018, but do not shoot after drinking alcohol.",
           "End of the lesson: 'not medical advice'; review_by 2027-01-01; check against the WADA list every September. Replaces the text flagged in audit A-03.",
           "Verify every statement against the current WADA list and cite it in sources before writing."],
      uk: ["Списки заборонених речовин WADA на 2026 і 2027 роки забороняють бета-блокатори у стрільбі (ISSF, IPC) завжди — і на змаганнях, і поза ними. FITASC там не названо; правило проєкту — вважати їх забороненими для кожного стендовика.",
           "Призначені ліки не скасовувати самостійно: заздалегідь поговорити з лікарем і федерацією про альтернативу або TUE (дозвіл на терапевтичне використання).",
           "Перевіряти ліки в Global DRO.",
           "Стимулятори з деяких ліків від застуди і СДУГ заборонені під час змагань.",
           "THC заборонений. CBD не заборонений, але продукти з CBD можуть містити THC.",
           "Добавки — лише з перевіркою партії. Кофеїн не заборонений.",
           "Алкоголю немає у списку WADA з 2018 року, але після алкоголю не стріляють.",
           "Наприкінці уроку: «не є медичною порадою»; review_by 2027-01-01; звіряти зі списком WADA щовересня. Замінює текст, позначений в аудиті A-03.",
           "Перед написанням звірити кожне твердження з чинним списком WADA і дати його в джерелах."] } },
  "travel-jet-lag": {
    title: { en: "Jet lag and the first days at a new ground", uk: "Зміна часових поясів і перші дні на новому стенді" },
    brief: {
      en: ["A rough guide: about one day per time zone.",
           "Flying east: light in the morning and less light in the evening; flying west: the other way round.",
           "A spare day before shooting for score after a long flight east.",
           "The first training: easy targets, to 'see' the new background; check the lens tint on every layout.",
           "Protect sleep: no late dinners and no alcohol before shooting days.",
           "A note for tour organisers.",
           "Evidence: some research (moderate, consensus). Receives the time-zone paragraphs of travel-planning-trip."],
      uk: ["Орієнтир: приблизно день на кожен часовий пояс.",
           "Політ на схід — світло вранці й менше світла ввечері; на захід — навпаки.",
           "Запасний день перед стрільбою на рахунок після довгого перельоту на схід.",
           "Перше тренування — легкі мішені, щоб «побачити» новий фон; відтінок лінз перевірити на кожному майданчику.",
           "Берегти сон: без пізньої вечері й без алкоголю перед днями стрільби.",
           "Примітка для організаторів турів.",
           "Доказовість: є дослідження (помірна, консенсус). Сюди переходять абзаци про часові пояси з travel-planning-trip."] } },
  "stand-talk-shooter-phrases": {
    title: { en: "Phrases a shooter needs on the stand", uk: "Фрази стрільця: тренер, суддя, група" },
    brief: {
      en: ["With the coach: describe where you saw the target and where the miss was; ask to see it again.",
           "With the referee: the call; a protest at once, as the rules require, with a raised hand; a polite question about a No Bird; asking for a viewing where the rules allow it.",
           "With the group and the trapper: a greeting, 'well shot', thanks.",
           "Where an 'attempt to influence the referee' begins.",
           "English phrases are spoken only with a local voice on the device (audit W-08).",
           "Complements referee-calls (what the referee says)."],
      uk: ["З тренером: описати, де бачили мішень і де був промах; попросити показати ще раз.",
           "Із суддею: команда; протест одразу, як вимагають правила, з піднятою рукою; ввічливе питання про No Bird; прохання про показ там, де правила це дозволяють.",
           "З групою й оператором машинки: привітання, «well shot», подяка.",
           "Де починається «спроба вплинути на суддю».",
           "Англійські фрази озвучуються лише локальним голосом пристрою (аудит W-08).",
           "Доповнює referee-calls (що каже суддя)."] } },
  "stand-talk-mental-game": {
    title: { en: "The mental game in coach-speak", uk: "Психологія мовою тренера" },
    brief: {
      en: ["About 20 common coach phrases with their plain meaning: one target at a time, trust it, let it happen, commit to the plan, don't ride it, let it go, reset, two separate shots.",
           "Translate the meaning, not the image, and keep one equivalent for the whole tour.",
           "Do not quote real people as authorities."],
      uk: ["Близько 20 усталених фраз тренера з простим значенням: one target at a time, trust it, let it happen, commit to the plan, don't ride it, let it go, reset, two separate shots.",
           "Перекладати зміст, а не образ, і тримати один відповідник на весь тур.",
           "Не цитувати живих людей як авторитетів."] } },
  "stand-talk-foreign-coach": {
    title: { en: "Training with a coach who speaks another language", uk: "Тренер говорить іншою мовою: з перекладачем і без" },
    brief: {
      en: ["For shooters, coaches and organisers.",
           "With an interpreter: agree on terms, hand signals and a pause sign in advance; short phrases; speak only when the gun is open; check that the shooter understood.",
           "At a competition the interpreter does not coach (it can be treated as coaching) and passes on only official information.",
           "Without an interpreter: about 20 anchor words (behind, in front, over, under, hold, pick-up, break, finish, mount); 'show me' instead of long explanations; video; notes in two languages after the session.",
           "A one-page bilingual handout."],
      uk: ["Для стрільців, тренерів і організаторів.",
           "З перекладачем: заздалегідь домовитися про терміни, знаки руками і знак паузи; короткі фрази; говорити, лише коли рушниця відкрита; перевіряти, чи стрілець зрозумів.",
           "На змаганнях перекладач не тренує (це можуть вважати коучингом) і передає лише офіційне.",
           "Без перекладача: близько 20 опорних слів (behind, in front, over, under, hold, pick-up, break, finish, mount); «покажіть» замість довгих пояснень; відео; нотатки двома мовами після заняття.",
           "Двомовна пам’ятка на одну сторінку."] } },
};

/* ---------- §4 rewritten psychology and training lessons: the planned new title and scope (the text is written later) ---------- */
const REWRITE_PLANS = {
  "mind-routine-under-pressure": {
    title: { en: "Pre-shot routine: the same steps in the same order", uk: "Передпостріловий ритуал: ті самі кроки в тому самому порядку" },
    brief: {
      en: ["Six short steps: feet set to the break point; the gun in the ready position (in {{tm:sporting}} the stock below the line on the jacket); eyes to the pick-up point with a soft focus; a breath out and a cue word; the call; hard focus on the target.",
           "The routine has to fit the time limits: 15 s in {{tm:sporting}} and 10 s in {{tm:compak}} (check against docs/rules/data).",
           "The order matters, not the exact seconds (audit A-05).",
           "Build it in training; do not change it at a competition.",
           "For a double, plan both targets before the call.",
           "Receives technique-routine-and-coach (the routine part)."],
      uk: ["Шість коротких кроків: ноги — під точку пострілу; рушниця в положенні готовності (у {{tm:sporting}} приклад нижче лінії на жилеті); очі — на точку підхоплення, м’який фокус; видих і слово-підказка; команда; жорсткий фокус на мішені.",
           "Ритуал має вкладатися в ліміт часу: 15 с у {{tm:sporting}} і 10 с у {{tm:compak}} (звірити з docs/rules/data).",
           "Важливий порядок, а не секунди (аудит A-05).",
           "Будувати на тренуванні; на змаганнях не змінювати.",
           "Для дуплета план на обидві мішені — до команди.",
           "Сюди переходить technique-routine-and-coach (частина про ритуал)."] } },
  "mind-concentration-focus": {
    title: { en: "Eyes and attention: soft focus, hard focus and the quiet eye", uk: "Очі й увага: м’який фокус, жорсткий фокус, «тихе око»" },
    brief: {
      en: ["Switching on for the target and switching off between stands.",
           "The quiet eye: an earlier and steadier final look; it tends to be longer in experienced shooters and on hits, but there is no magic number of milliseconds.",
           "The barrels stay in peripheral vision (audit A-27).",
           "Receives the soft and hard focus paragraphs of basics-eyes."],
      uk: ["Вмикатися на мішень і вимикатися між стрілецькими місцями.",
           "«Тихе око» — раніший і стійкіший останній погляд; у досвідчених стрільців і при влучаннях він зазвичай довший, але магічного числа мілісекунд немає.",
           "Стволи — на периферії зору (аудит A-27).",
           "Сюди переходять абзаци про м’який і жорсткий фокус із basics-eyes."] } },
  "mind-competition-nerves": {
    title: { en: "Nerves and your own zone", uk: "Хвилювання і ваша зона" },
    brief: {
      en: ["Nerves are normal; the useful level differs from shooter to shooter: rate it 0–10 after rounds.",
           "Read a racing heart as readiness ('I am ready').",
           "Confidence comes from preparation.",
           "When to see a sport psychologist or a doctor.",
           "No 'inverted-U law' and no 'box breathing calms you' (audit A-04); the breathing part moves to mind-breathing."],
      uk: ["Хвилювання — це нормально; корисний рівень у кожного свій: оцінювати 0–10 після раундів.",
           "Сприймати серцебиття як готовність («я готовий»).",
           "Упевненість — від підготовки.",
           "Коли звернутися до спортивного психолога або лікаря.",
           "Без «закону перевернутої U» і без «box breathing заспокоює» (аудит A-04); частина про дихання переходить у mind-breathing."] } },
  "mind-long-day-energy-sleep": {
    title: { en: "Competition day: sleep, coffee, water and food", uk: "День змагань: сон, кава, вода і їжа" },
    brief: {
      en: ["The evening before: the usual bedtime, a 7–9 hour window, kit packed, the plan written down.",
           "Poor sleep before an important event is common; if you cannot sleep, rest quietly.",
           "Coffee in your usual amount, no special 'competition dose', and not late in the day.",
           "Drink a little and often (losing more than about 2% of body weight in fluid can affect attention; cite the source).",
           "The usual breakfast 2–3 hours before; snacks every 60–90 minutes.",
           "No alcohol before or during shooting (receives the alcohol paragraph of health-alcohol-medication-weather)."],
      uk: ["Вечір напередодні: звичний час сну, вікно 7–9 годин, спорядження зібране, план записаний.",
           "Поганий сон перед важливим стартом — часта річ; якщо не спиться, просто спокійно відпочивайте.",
           "Кава у звичній кількості, без особливої «дози для змагань» і не пізно.",
           "Пити потроху і часто (втрата рідини понад приблизно 2 % ваги тіла може погіршити увагу; дати джерело).",
           "Звичний сніданок за 2–3 години; перекуси кожні 60–90 хвилин.",
           "Без алкоголю до і під час стрільби (сюди переходить абзац про алкоголь із health-alcohol-medication-weather)."] } },
  "juniors-support-without-pressure": {
    title: { en: "Juniors and parents: support without pressure", uk: "Юніори і батьки: підтримка без тиску" },
    brief: {
      en: ["The coach teaches, the parent supports.",
           "Praise effort and the routine, not the score.",
           "The child starts the conversation afterwards.",
           "Do not prompt from behind the stand (it can count as coaching) and do not comment on referee decisions.",
           "The same warmth after a good and a bad round.",
           "Evidence: some research (moderate; youth sport in general)."],
      uk: ["Тренер навчає, батьки підтримують.",
           "Хвалити зусилля і ритуал, а не рахунок.",
           "Розмову потім починає дитина.",
           "Не підказувати з-за стрілецького місця (це можуть вважати коучингом) і не коментувати рішень судді.",
           "Однакове тепло після доброго і поганого раунду.",
           "Доказовість: є дослідження (помірна; дитячий спорт загалом)."] } },
  "training-for-competition": {
    title: { en: "Training for competition", uk: "Тренування під змагання" },
    brief: {
      en: ["Add training under moderate pressure that grows step by step: '5 in a row', a practice round and a shoot-off run as in competition, spectators, a time limit.",
           "How to fit this into normal training without disturbing technique.",
           "Time limits per discipline (link to the rules lessons)."],
      uk: ["Додати тренування під помірним тиском, який зростає поступово: «5 поспіль», тренувальний раунд і перестрілка як на змаганнях, глядачі, ліміт часу.",
           "Як вставити це у звичайне тренування, не заважаючи техніці.",
           "Ліміти часу за дисциплінами (посилання на уроки правил)."] } },
};

/* ---------- §3.2 lessons whose parts go to different places. The old URL goes to the main topic (id-map.json);
   the other paragraphs move with their translations, by key, when the editor works on the masters.        ---------- */
const MOVES = [
  ["gear-cartridges", "gauge", "gun-gauge-and-barrels"], ["gear-cartridges", "shot size number", "cartridges-shot-size"], ["gear-cartridges", "28 g load limit", "cartridges-load-weight"],
  ["compak-gun-and-call", "gun position", "rules-gun-position"], ["compak-gun-and-call", "viewing the targets", "rules-viewing-targets"], ["compak-gun-and-call", "loading", "safety-core-rules"],
  ["compak-dress-and-conduct", "conduct", "culture-sportsmanship-referee"], ["compak-dress-and-conduct", "lateness", "rules-call-and-time"],
  ["gear-protection-clothes", "line on the jacket", "gear-shooting-vest"], ["gear-protection-clothes", "protection for everyone", "safety-eye-ear-protection"],
  ["etiquette-squad", "lateness", "rules-call-and-time"], ["etiquette-squad", "shooting order", "targets-sporting-layout"], ["etiquette-squad", "shooting order", "targets-compak-layout"],
  ["basics-eyes", "soft and hard focus", "mind-concentration-focus"],
  ["referee-scoring", "shoot-offs and countback", "competitions-categories-and-shoot-offs"],
  ["targets-hit-or-lost", "'smoked it'", "interpreter-false-friends"],
  ["competitions-scoring-basics", "score card", "watching-reading-results"],
  ["technique-routine-and-coach", "why you need a coach", "training-first-lessons-and-coach"],
  ["health-eyes-vision", "master eye with age", "technique-master-eye"],
  ["health-alcohol-medication-weather", "alcohol", "mind-long-day-energy-sleep"], ["health-alcohol-medication-weather", "heat, cold and sun", "gear-clothing-and-shoes"], ["health-alcohol-medication-weather", "thunderstorm", "safety-core-rules"],
  ["women-clothing-community-start", "clothing", "gear-clothing-and-shoes"], ["women-clothing-community-start", "vest", "gear-shooting-vest"],
  ["targets-basic-presentations", "incomers and going-away targets", "flight-incomer-going-away"],
  ["targets-special-presentations", "rabbit", "flight-rabbit"],
  ["gun-transport-documents", "European Firearms Pass", "travel-gun-in-eu"], ["gun-transport-documents", "flying", "travel-flying-with-guns"],
  ["rules-cards-and-appeals", "protest", "competitions-results-and-protests"],
  ["competitions-results-and-protests", "checking the score", "watching-reading-results"],
  ["culture-traditions", "shoot-offs", "competitions-categories-and-shoot-offs"],
  ["culture-dress-code", "dress at the ceremony", "culture-traditions"], ["rules-dress-and-safety", "dress at the ceremony", "culture-traditions"],
  ["travel-planning-trip", "time zones", "travel-jet-lag"],
  ["mind-competition-nerves", "breathing", "mind-breathing"],
  ["technique-follow-through-and-mistakes", "faults", "faults-behind-in-front"], ["technique-follow-through-and-mistakes", "faults", "faults-head-lift-stopping"],
  ["technique-follow-through-and-mistakes", "faults", "faults-mount-errors"], ["technique-follow-through-and-mistakes", "faults", "faults-pairs-transition"],
];

/* Lessons that need the evidence badges and the line "не є медичною порадою" (psychology and health). */
const HEALTH = new Set(["mind-warm-up-mobility", "health-lead-hygiene", "health-recoil-shoulder-neck", "gear-ear-protection", "gear-shooting-glasses", "travel-jet-lag"]);
/* Blocks whose lessons carry the review status "перевіряється" until a specialist checks them (owner decision). */
const REVIEW_BY_SPECIALIST = { mind: "sport psychologist", rules: "certified FITASC referee" };
const SPECIALIST_OVERRIDE = { "mind-anti-doping": "doctor (sports medicine)" };
/* "critical": a stale translation of these lessons is shown in English with "Переклад оновлюється" (design §6.3). */
const CRITICAL_BLOCKS = new Set(["safety", "rules"]);
const CRITICAL_LESSONS = new Set(["mind-anti-doping"]);
/* ClayAway is not launched yet: its lesson is a "preview" (noindex) and is written in the future tense. */
const PREVIEW = new Set(["travel-clayaway-tour"]);
const REVIEW_BY = { "mind-anti-doping": "2027-01-01" };
/* Urgent findings that were already fixed in the old sources (all 11 languages) before the migration, so the migrated
   text already carries the fix (owner decision 1, commit 799d53c5). The todo keeps the code with this status: the editor
   only checks that the fix survives the merge, then deletes the item. */
const FIXED_IN_SOURCE = new Set(["I-01", "I-02", "I-03"]);
/* Ukrainian terms fixed by the owner (вкладка, дуплет, точка пострілу, точка підхоплення, передпостріловий ритуал, стрілецьке місце /
   у Compak® номер, імітація стрільби, Європейський вогнепальний паспорт, підгонка рушниці). The migration does not rewrite texts;
   it only lists the old variants it finds (todo.uk_terms) so the editor replaces them. Only unambiguous variants are searched. */
const UK_TERMS = [
  ["вкладка / вкладати рушницю (gun mount)", /(?<!\p{L})вс?кид[\p{L}’ʼ']*/giu],
  ["передпостріловий ритуал (pre-shot routine)", /(?<!\p{L})(?:передпострільн|рутин)[\p{L}’ʼ']*/giu],
  ["точка підхоплення (pick-up point)", /(?<!\p{L})точк\p{L}*\s+зустріч\p{L}*/giu],
  ["підгонка рушниці (gun fit)", /(?<!\p{L})припасуван\p{L}*/giu],
];
/* every Ukrainian text of a master (title, summary, body, notes, phrases, key points, did you know, quiz, exam pool) */
function ukStrings(M) {
  const out = [];
  const walk = (v, inUk) => { if (typeof v === "string") { if (inUk) out.push(v); }
    else if (Array.isArray(v)) v.forEach((x) => walk(x, inUk));
    else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) walk(x, inUk || k === "uk"); };
  walk([M.title, M.summary, M.body, M.note, M.phrases, M.key_points, M.did_you_know, M.quiz, M.exam_pool], false);
  return out;
}
/* Phrases of these interpreter missions are mostly said by the referee; the rest default to the coach (editors check). */
const REFEREE_MISSIONS = new Set(["referee", "sporting", "compak"]);
/* Route → reader type written to "audiences" at migration (editorial field; routes.json stays the source for routes). */
const AUDIENCE = { "beginner": "beginner", "first-competition": "shooter", "interpreter": "interpreter", "junior-parent": "parent", "new-coach": "coach", "organiser": "organiser", "fan": "fan" };

/* =====================================================================================================
   Helpers
   ===================================================================================================== */
const sha8 = (s) => createHash("sha1").update(String(s), "utf8").digest("hex").slice(0, 8);
/* What the 8-hex hash "h" is taken of (documented in content/academy/SCHEMA.md):
   plain text item → its English text; phrase → en + "\n" + meaning.en; quiz → q.en, every option.en, explain.en joined by "\n". */
const hashPhrase = (p) => sha8(p.en + "\n" + p.meaning.en);
const hashQuiz = (q) => sha8([q.q.en, ...q.options.map((o) => o.en), q.explain.en].join("\n"));
const OPT_KEYS = "abcdefgh".split("");
const warnings = [];
const warn = (msg) => warnings.push(msg);
const fail = (msg) => { console.error("ERROR: " + msg); process.exit(1); };
const isFitasc = (url) => /(^|\/\/|\.)fitasc\.com\b/i.test(url || "");
const relFor = (url) => (isFitasc(url) ? "nofollow noopener noreferrer" : "noopener noreferrer");

/* ---------- read the old sources (they are NOT changed) ---------- */
function loadLearn() {
  const ctx = { window: {} };
  vm.createContext(ctx);
  for (const f of fs.readdirSync(SRC_LEARN).filter((f) => f.endsWith(".js")).sort())
    vm.runInContext(fs.readFileSync(path.join(SRC_LEARN, f), "utf8"), ctx, { filename: f });
  const modules = ctx.window.LEARN || [];
  const lessons = new Map();
  for (const m of modules) for (const l of m.lessons) {
    if (lessons.has(l.id)) fail("duplicate Academy lesson id " + l.id);
    lessons.set(l.id, Object.assign({ _module: m.module }, l));
  }
  return { modules, lessons };
}
function loadInterpreter() {
  const missions = fs.readdirSync(path.join(SRC_INTERP, "missions")).filter((f) => f.endsWith(".json")).sort()
    .map((f) => JSON.parse(fs.readFileSync(path.join(SRC_INTERP, "missions", f), "utf8")));
  const lessons = new Map();
  for (const m of missions) for (const l of m.lessons) {
    if (lessons.has(l.id)) fail("duplicate Interpreter Academy lesson id " + l.id);
    lessons.set(l.id, Object.assign({ _mission: m.id }, l));
  }
  const tr = {};                                       // tr[lang][lessonId] = translated lesson
  const trMissions = {};                               // trMissions[lang][missionId] = {title, intro} (archived in legacy/modules.json)
  const ui = {};                                       // ui[lang] = translated interface strings
  for (const lg of OVERLAY_LANGS) {
    const d = JSON.parse(fs.readFileSync(path.join(SRC_INTERP, "i18n", lg + ".json"), "utf8"));
    tr[lg] = {};
    trMissions[lg] = {};
    for (const [mid, mm] of Object.entries(d.missions || {})) {
      trMissions[lg][mid] = { title: mm.title, intro: mm.intro };
      for (const [id, l] of Object.entries(mm.lessons || {})) tr[lg][id] = l;
    }
    ui[lg] = d.ui || {};
  }
  const uiMaster = JSON.parse(fs.readFileSync(path.join(SRC_INTERP, "ui.json"), "utf8"));
  return { missions, lessons, tr, trMissions, ui, uiMaster };
}
/* The Academy interface table `const T={uk:{...},en:{...}};` and a few inline uk/en strings of docs/learn/index.html. */
function loadLearnUi() {
  const html = fs.readFileSync(path.join(ROOT, "docs/learn/index.html"), "utf8");
  const m = html.match(/const T=(\{uk:\{[\s\S]*?\}\s*,\s*en:\{[\s\S]*?\}\});/);
  if (!m) fail("could not find the T{} interface table in docs/learn/index.html");
  const T = vm.runInNewContext("(" + m[1] + ")");
  const inline = [...html.matchAll(/L\(\)==="uk"\?"([^"]*)":"([^"]*)"/g)].map((x) => ({ uk: x[1], en: x[2] }));
  return { T, inline };
}

/* =====================================================================================================
   Build
   ===================================================================================================== */
/* Glossary ids (one term store: glossary.js + learn_terms.js + aliases.json) and FITASC rule item ids (docs/rules/data),
   used only to warn about unknown references; nothing is changed in them. */
function loadRefs() {
  const ctx = { window: {} };
  vm.createContext(ctx);
  for (const f of ["glossary/data/glossary.js", "glossary/data/learn_terms.js", "rules/data/sporting.js", "rules/data/compak.js", "rules/data/categories.js"])
    vm.runInContext(fs.readFileSync(path.join(ROOT, "docs", f), "utf8"), ctx, { filename: f });
  const entries = new Map([...(ctx.window.GLOSSARY?.terms || []), ...(ctx.window.GLOSSARY_LEARN?.terms || [])].map((t) => [t.id, t]));
  const ids = new Set(entries.keys());
  const aliases = JSON.parse(fs.readFileSync(path.join(ROOT, "docs/glossary/data/aliases.json"), "utf8"));
  const rules = new Set();
  for (const b of ctx.window.RULES || []) for (const s of b.sections) for (const it of s.items) rules.add(b.key + ":" + it.id);
  for (const c of ctx.window.FITASC_CATEGORIES?.categories || []) rules.add("categories:" + c.id);
  return { ids, entries, aliases, rules };
}
const REFS = loadRefs();
const GLOSSARY_IDS = REFS.ids, GLOSSARY_ENTRIES = REFS.entries, GLOSSARY_ALIASES = REFS.aliases, RULE_IDS = REFS.rules;
/* A lesson's own definition of a term that the glossary already has. It is "kept" when the glossary entry contains
   the same English and Ukrainian text (short or long); otherwise it is copied into the master's todo.term_defs so the
   editor can compare it with the glossary entry — nothing the authors wrote is dropped. */
const glossaryHasDef = (nt) => { const g = GLOSSARY_ENTRIES.get(nt.id); if (!g) return false; const s = JSON.stringify(g);
  return [nt.short_en, nt.short_uk].every((t) => !t || s.includes(JSON.stringify(t).slice(1, -1))); };

/* ---------- country law tables (lesson blocks t:"law") ----------
   archive/legacy-docs/learn/data/laws-<cc>.json is the edited source of the law tables (laws-<cc>.js is generated from it by
   scripts/build_laws.py). They are copied BYTE FOR BYTE to content/academy/laws/<CC>.json; the file name is the ISO 3166
   country code in capitals, so the language check of the build never mistakes a country (ES) for a language code.   */
function loadLaws() {
  const out = new Map();
  for (const f of fs.readdirSync(SRC_LEARN).filter((f) => /^laws-[a-z]{2}\.json$/.test(f)).sort()) {
    const raw = fs.readFileSync(path.join(SRC_LEARN, f), "utf8");
    JSON.parse(raw);                                                   // must parse
    out.set(f.slice(5, 7).toUpperCase(), raw);
  }
  return out;
}
const LAWS = loadLaws();
/* Interface strings of the law-table renderer archive/legacy-docs/learn/data/law-tables.js (uk/en), kept as UI keys. Each text must
   occur in law-tables.js exactly, so nothing is retyped. */
const LAW_UI = {
  law_unverified: { uk: "(не підтверджено офіційним текстом)", en: "(not confirmed by an official text)" },
  law_title_de_states: { uk: "Німеччина по землях: свинцевий дріб", en: "Germany by state: lead shot" },
  law_title_lead: { uk: "свинцевий дріб", en: "lead shot" },
  law_title_travel: { uk: "рушниця на змагання", en: "bringing a shotgun to a competition" },
  law_col_state: { uk: "Земля", en: "State" },
  law_col_norm: { uk: "Норма", en: "Rule" },
  law_col_banned: { uk: "Що заборонено", en: "What is banned" },
  law_col_since: { uk: "З", en: "Since" },
  law_col_where: { uk: "Де", en: "Where" },
  law_col_applies: { uk: "Правило", en: "What applies" },
  law_col_topic: { uk: "Питання", en: "Topic" },
};
{
  const src = fs.readFileSync(path.join(SRC_LEARN, "law-tables.js"), "utf8");
  for (const [k, v] of Object.entries(LAW_UI)) for (const t of [v.uk, v.en]) if (!src.includes(`"${t}"`)) fail(`law UI string of ${k} not found in law-tables.js: ${t}`);
}

const learn = loadLearn();
const interp = loadInterpreter();
const learnUi = loadLearnUi();

// --- plan sanity: every old lesson is in the plan exactly once, every merge target is a final lesson ---
const OLD_LEARN = [...learn.lessons.keys()], OLD_INTERP = [...interp.lessons.keys()];
for (const id of OLD_LEARN) if (!PLAN[id] || PLAN[id].src !== "learn") fail("plan: Academy lesson missing or wrong source: " + id);
for (const id of OLD_INTERP) if (!PLAN[id] || PLAN[id].src !== "interpreter") fail("plan: Interpreter lesson missing or wrong source: " + id);
for (const [id, p] of Object.entries(PLAN)) {
  if (p.src === "learn" && !learn.lessons.has(id)) fail("plan names an unknown Academy lesson " + id);
  if (p.src === "interpreter" && !interp.lessons.has(id)) fail("plan names an unknown Interpreter lesson " + id);
  if (p.src === "new" && (learn.lessons.has(id) || interp.lessons.has(id))) fail("new lesson id already used by an old lesson: " + id);
}
const FINAL = Object.keys(PLAN).filter((id) => !PLAN[id].do.startsWith(">"));
const FINAL_SET = new Set(FINAL);
const mergedInto = {};                                  // target → [old ids] in plan order
for (const [id, p] of Object.entries(PLAN)) if (p.do.startsWith(">")) {
  const to = p.do.slice(1);
  if (!FINAL_SET.has(to)) fail(`plan: ${id} merges into ${to}, which is not a final lesson`);
  (mergedInto[to] = mergedInto[to] || []).push(id);
}
for (const id of FINAL) if (RESERVED.includes(id)) fail("lesson id equals a reserved word: " + id);
// --- blocks: every final lesson in exactly one section of one block ---
const placed = {};
BLOCKS.forEach((b, i) => { b.order = i + 1; for (const s of b.sections) for (const l of s.lessons) {
  if (placed[l]) fail(`lesson ${l} is placed twice (${placed[l].block}/${placed[l].section} and ${b.id}/${s.id})`);
  placed[l] = { block: b.id, section: s.id };
} for (const st of b.starters) if (!b.sections.some((s) => s.lessons.includes(st))) fail(`starter ${st} is not in block ${b.id}`); });
for (const id of FINAL) if (!placed[id]) fail("final lesson not placed in any block: " + id);
for (const id of Object.keys(placed)) if (!FINAL_SET.has(id)) fail("block lists a lesson that is not final: " + id);
for (const id of FINAL) if (!MINUTES[id]) fail("no minutes for " + id);
const STARTERS = new Set(BLOCKS.flatMap((b) => b.starters));
// --- routes: every id exists ---
const inRoutes = {};
ROUTES.forEach((r, i) => { r.order = i + 1; const all = [...r.stages.flatMap((s) => s.lessons), ...r.extras];
  for (const l of all) { if (!FINAL_SET.has(l)) fail(`route ${r.id} lists unknown lesson ${l}`); (inRoutes[l] = inRoutes[l] || new Set()).add(r.id); }
  if (new Set(all).size !== all.length) fail(`route ${r.id} lists a lesson twice`);
  for (const s of r.stages) if (s.lessons.length > 11) warn(`route ${r.id} stage ${s.id} has ${s.lessons.length} lessons (> 11)`); });

/* ---------- convert one old lesson into keyed items ---------- */
// Accumulators for one master: the master object + its 9 overlays.
function newOverlay(id, lg) { return { id, lang: lg, base_rev: 1, h: {}, review: { by: null, date: null, origin: "interpreter-academy" }, body: {}, note: {}, phrases: {}, key_points: {}, quiz: {} }; }

function quizFromLearn(lid, q, i) {
  const options = q.options.map((o, j) => ({ k: OPT_KEYS[j], en: o.en, uk: o.uk }));
  if (q.answer == null || !options[q.answer]) fail(`quiz answer out of range in ${lid} q${i + 1}`);
  return { k: `${lid}-q${i + 1}`, q: { en: q.q_en, uk: q.q_uk }, options, correct: OPT_KEYS[q.answer], explain: { en: q.explain_en, uk: q.explain_uk } };
}
function quizFromInterp(lid, q, i) {
  if (q.options.en.length !== q.options.uk.length) fail(`option count en/uk differs in ${lid} q${i + 1}`);
  const options = q.options.en.map((t, j) => ({ k: OPT_KEYS[j], en: t, uk: q.options.uk[j] }));
  if (q.answer == null || !options[q.answer]) fail(`quiz answer out of range in ${lid} q${i + 1}`);
  return { k: `${lid}-q${i + 1}`, q: { en: q.q.en, uk: q.q.uk }, options, correct: OPT_KEYS[q.answer], explain: { en: q.why.en, uk: q.why.uk } };
}

/* Add an old Academy (learn) lesson to master M. mode "own" = this master IS the lesson; "draft" = merged into M. */
function addLearn(M, L, mode) {
  const own = mode === "own", from = own ? undefined : L.id;
  if (L.body_en.length !== L.body_uk.length) fail("paragraph count en/uk differs in " + L.id);
  if (L.key_points_en.length !== L.key_points_uk.length) fail("key point count en/uk differs in " + L.id);
  if (own) {
    M.title = { en: L.title_en, uk: L.title_uk };
    M.summary = { en: L.summary_en, uk: L.summary_uk };
  } else {
    M.body.push({ k: `${L.id}-title`, t: "draft", from, role: "title", anchor: L.id, en: L.title_en, uk: L.title_uk });
    M.body.push({ k: `${L.id}-summary`, t: "draft", from, role: "summary", en: L.summary_en, uk: L.summary_uk });
  }
  L.body_en.forEach((en, i) => M.body.push(own ? { k: `${L.id}-p${i + 1}`, t: "p", en, uk: L.body_uk[i] }
                                                : { k: `${L.id}-p${i + 1}`, t: "draft", from, role: "p", en, uk: L.body_uk[i] }));
  (L.law_tables || []).forEach((lt, i) => {
    const country = String(lt.code).toUpperCase();          // country code (ISO 3166), never a language code
    M.body.push(own ? { k: `${L.id}-law${i + 1}`, t: "law", country, part: lt.part }
                    : { k: `${L.id}-law${i + 1}`, t: "draft", from, role: "law", country, part: lt.part });
  });
  if (L.did_you_know_en || L.did_you_know_uk) {
    const dyk = { k: `${L.id}-dyk`, en: L.did_you_know_en || "", uk: L.did_you_know_uk || "" };
    if (own) M.did_you_know = dyk; else M.body.push(Object.assign({ k: dyk.k, t: "draft", from, role: "did_you_know" }, { en: dyk.en, uk: dyk.uk }));
  }
  L.key_points_en.forEach((en, i) => M.key_points.push(Object.assign({ k: `${L.id}-kp${i + 1}`, en, uk: L.key_points_uk[i] }, own ? {} : { from, draft: true })));
  const qs = L.quiz.map((q, i) => Object.assign(quizFromLearn(L.id, q, i), own ? {} : { from }));
  if (own) M.quiz.push(...qs); else if (M.quiz.length === 0) M.quiz.push(...qs); else M.exam_pool.push(...qs);
  mergeLists(M, L.terms, L.rule_refs, (L.sources || []).map((s) => ({ title: { en: s.title_en || s.title, uk: s.title }, url: s.url })));
  for (const nt of L.new_terms || []) M._newTerms.push(Object.assign({ from: L.id }, nt));
  M.legacy.learn.push(L.id);
  M._disc.add("sporting"); M._disc.add("compak");
}

/* Add an old Interpreter Academy lesson to master M (+ its 9 translations to the overlays). */
function addInterp(M, I, mode, OV) {
  const own = mode === "own", from = own ? undefined : I.id;
  if (I.body.en.length !== I.body.uk.length) fail("paragraph count en/uk differs in " + I.id);
  const T = (lg) => interp.tr[lg][I.id];
  for (const lg of OVERLAY_LANGS) if (!T(lg)) fail(`no ${lg} translation for ${I.id}`);
  if (own) {
    M.title = { en: I.title.en, uk: I.title.uk };
    M.summary = { en: "", uk: "" };                      // the Interpreter Academy had no summaries: write one (en + uk)
    M._todo.push("Write the summary (en + uk); the Interpreter Academy lesson had none.");
    for (const lg of OVERLAY_LANGS) { OV[lg].title = T(lg).title; OV[lg].h.title = sha8(I.title.en); }
  } else {
    M.body.push({ k: `${I.id}-title`, t: "draft", from, role: "title", anchor: I.id, core: true, en: I.title.en, uk: I.title.uk });
    for (const lg of OVERLAY_LANGS) { OV[lg].body[`${I.id}-title`] = T(lg).title; OV[lg].h[`${I.id}-title`] = sha8(I.title.en); }
  }
  I.body.en.forEach((en, i) => {
    const k = `${I.id}-p${i + 1}`;
    M.body.push(own ? { k, t: "p", core: true, en, uk: I.body.uk[i] } : { k, t: "draft", from, role: "p", core: true, en, uk: I.body.uk[i] });
    for (const lg of OVERLAY_LANGS) {
      const tx = T(lg).body[i];
      if (typeof tx !== "string") fail(`${lg} translation of ${k} is missing`);
      OV[lg].body[k] = tx; OV[lg].h[k] = sha8(en);
    }
  });
  if (I.sim) M.body.push(own ? { k: `${I.id}-sim`, t: "sim", sim: I.sim, ready: false }
                             : { k: `${I.id}-sim`, t: "draft", from, role: "sim", sim: I.sim, ready: false });
  I.key_points.en.forEach((en, i) => {
    const k = `${I.id}-kp${i + 1}`;
    M.key_points.push(Object.assign({ k, core: true, en, uk: I.key_points.uk[i] }, own ? {} : { from, draft: true }));
    for (const lg of OVERLAY_LANGS) { OV[lg].key_points[k] = T(lg).key_points[i]; OV[lg].h[k] = sha8(en); }
  });
  I.coach_says.forEach((c, i) => {
    const k = `${I.id}-ph${i + 1}`;
    const ph = Object.assign({ k, speaker: REFEREE_MISSIONS.has(I._mission) ? "referee" : "coach", core: true, en: c.en,
                               meaning: { en: c.meaning.en, uk: c.meaning.uk }, say: Object.assign({}, c.say) }, own ? {} : { from });
    M.phrases.push(ph);
    for (const lg of OVERLAY_LANGS) {
      const o = T(lg).coach_says[i];
      OV[lg].phrases[k] = { meaning: o.meaning, say: o.say }; OV[lg].h[k] = hashPhrase(ph);
    }
  });
  const qs = I.quiz.map((q, i) => Object.assign(quizFromInterp(I.id, q, i), own ? {} : { from }));
  qs.forEach((q, i) => { for (const lg of OVERLAY_LANGS) {
    const o = T(lg).quiz[i];
    if (o.options.length !== q.options.length) fail(`${lg} option count differs in ${q.k}`);
    OV[lg].quiz[q.k] = { q: o.q, options: Object.fromEntries(q.options.map((op, j) => [op.k, o.options[j]])), explain: o.why };
    OV[lg].h[q.k] = hashQuiz(q);
  } });
  if (own) M.quiz.push(...qs); else if (M.quiz.length === 0) M.quiz.push(...qs); else M.exam_pool.push(...qs);
  mergeLists(M, I.terms, I.rule_refs, (I.sources || []).map((s) => ({ title: { en: s.title }, url: s.url })));
  M.legacy.interpreter.push(I.id);
  if (I._mission === "sporting") M._disc.add("sporting"); else if (I._mission === "compak") M._disc.add("compak");
  else { M._disc.add("sporting"); M._disc.add("compak"); }
}

/* terms, rule_refs and sources are merged without repeats (design §3.3.7). */
function mergeLists(M, terms, ruleRefs, sources) {
  for (const t of terms || []) if (!M.terms.includes(t)) M.terms.push(t);
  for (const r of ruleRefs || []) if (!M.rule_refs.some((x) => x.book === r.book && x.id === r.id)) M.rule_refs.push(Object.assign({}, r));
  for (const s of sources || []) if (s.url && !M.sources.some((x) => x.url === s.url))
    M.sources.push({ title: s.title, url: s.url, rel: relFor(s.url), checked: null, license: "link only" });
}

/* ---------- build the 142 masters in block order ---------- */
const masters = new Map(), overlays = new Map();
const NEW_TERM_IDS = new Set([...learn.lessons.values()].flatMap((l) => (l.new_terms || []).map((nt) => nt.id)));
const ORDER = BLOCKS.flatMap((b) => b.sections.flatMap((s) => s.lessons));
for (const id of ORDER) {
  const p = PLAN[id];
  const blockId = placed[id].block;
  const M = {
    id, rev: 1, status: "draft", plan: p.do, level: STARTERS.has(id) ? 1 : 2, minutes: MINUTES[id],
    disciplines: [], audiences: [...(inRoutes[id] || [])].map((r) => AUDIENCE[r]),
    index: PREVIEW.has(id) ? "preview" : "always",
    critical: CRITICAL_BLOCKS.has(blockId) || CRITICAL_LESSONS.has(id),
    disclaimer: (blockId === "mind" || HEALTH.has(id)) ? "medical" : null,
    review_by: REVIEW_BY[id] || null,
    review: { status: REVIEW_BY_SPECIALIST[blockId] ? "pending" : "none", specialist: SPECIALIST_OVERRIDE[id] || REVIEW_BY_SPECIALIST[blockId] || null,
              facts: null, rules_data: null, editor: null },
    legacy: { learn: [], interpreter: [] },
    terms: [], rule_refs: [], facts: [], sources: [],
    title: { en: "", uk: "" }, summary: { en: "", uk: "" },
    body: [], note: [], phrases: [], key_points: [], did_you_know: null, quiz: [], exam_pool: [],
    evidence: (blockId === "mind" || HEALTH.has(id)) ? [] : null,
    _disc: new Set(), _todo: [], _newTerms: [],
  };
  const OV = Object.fromEntries(OVERLAY_LANGS.map((lg) => [lg, newOverlay(id, lg)]));
  if (p.src === "learn") addLearn(M, learn.lessons.get(id), "own");
  else if (p.src === "interpreter") addInterp(M, interp.lessons.get(id), "own", OV);
  else {                                                   // a new lesson: skeleton + brief for the author
    const n = NEW_LESSONS[id];
    if (!n) fail("no brief for new lesson " + id);
    M.title = n.title;
    M.brief = { points: n.brief };
    M._todo.push("New lesson: check the title, then write the summary, body, key points and 3 quiz questions (en + uk) from the brief.");
  }
  if (REWRITE_PLANS[id]) M.brief = { title: REWRITE_PLANS[id].title, points: REWRITE_PLANS[id].brief };
  for (const old of mergedInto[id] || []) {
    if (PLAN[old].src === "learn") addLearn(M, learn.lessons.get(old), "draft");
    else addInterp(M, interp.lessons.get(old), "draft", OV);
  }
  M.disciplines = ["sporting", "compak"].filter((d) => M._disc.has(d));
  if (!M.disciplines.length) M.disciplines = ["sporting", "compak"];
  // h_uk: hash of the English text the Ukrainian was written from (warns when en changes and uk does not)
  M.h_uk = {};
  if (M.title.en) M.h_uk.title = sha8(M.title.en);
  if (M.summary.en) M.h_uk.summary = sha8(M.summary.en);
  for (const b of M.body) if (typeof b.en === "string") M.h_uk[b.k] = sha8(b.en);
  for (const x of M.key_points) M.h_uk[x.k] = sha8(x.en);
  if (M.did_you_know) M.h_uk[M.did_you_know.k] = sha8(M.did_you_know.en);
  for (const x of M.phrases) M.h_uk[x.k] = hashPhrase(x);
  for (const q of [...M.quiz, ...M.exam_pool]) M.h_uk[q.k] = hashQuiz(q);
  // editor's to-do list (English; the content team works from it)
  const audit = [];
  for (const old of [id, ...(mergedInto[id] || [])]) for (const code of (PLAN[old].audit || []))
    audit.push(Object.assign({ code }, old === id ? {} : { from: old }, FIXED_IN_SOURCE.has(code) ? { status: "fixed-in-source" } : {}));
  const moves_out = MOVES.filter(([from]) => M.legacy.learn.includes(from) || M.legacy.interpreter.includes(from)).map(([from, topic, to]) => ({ from, topic, to }));
  const moves_in = MOVES.filter(([, , to]) => to === id).map(([from, topic]) => ({ from, topic }));
  const tasks = [...M._todo];
  if (M.body.some((b) => b.t === "draft")) tasks.push("Merge the draft blocks: keep the facts, delete repeats, then change t to p/tip/warn/rule/compare (design §3.3).");
  if (M.exam_pool.length) tasks.push("Choose the 3 quiz questions shown in the lesson; the rest stay in exam_pool for route exams and Practice.");
  if (M.key_points.some((x) => x.draft)) tasks.push("Merge the key points of the absorbed lessons (draft:true) into 3–5 points.");
  if (M.phrases.length) tasks.push("Check the speaker of each phrase (coach / referee / shooter); move interpreter advice paragraphs to note[] with for:\"interpreter\".");
  if (M.body.some((b) => b.sim || b.role === "sim")) tasks.push("Animations are ready:false: check each against audit findings S-01…S-05 and S-09 before setting ready:true.");
  if (blockId === "rules" || M.rule_refs.length) tasks.push("Give every rule paragraph disc (sporting|compak|both) and rule_ref; check numbers against docs/rules/data.");
  if (M.disclaimer === "medical") tasks.push("Add an evidence badge to every psychology/health claim (strong|some|little|coaches) and the line 'not medical advice'.");
  if (PREVIEW.has(id)) tasks.push("ClayAway is not launched: future tense only, no commission mechanics; index stays 'preview' (noindex) until launch.");
  else if (JSON.stringify([M.title, M.summary, M.body, M.key_points, M.did_you_know]).includes("ClayAway")) tasks.push("Mentions ClayAway: keep it to one line in the future tense ('coming soon').");
  // new_terms: keep only those the glossary does not have yet (the rest already live in the glossary)
  const pendingNT = M._newTerms.filter((nt) => !GLOSSARY_IDS.has(nt.id));
  if (pendingNT.length) {
    M.new_terms = pendingNT;
    tasks.push("Move new_terms to docs/glossary/data/learn_terms.js (+ i18n), then delete new_terms here.");
  }
  // the glossary already has these ids, but with a different definition than the old lesson wrote: keep the lesson's text
  const termDefs = M._newTerms.filter((nt) => GLOSSARY_IDS.has(nt.id) && !glossaryHasDef(nt));
  if (termDefs.length) tasks.push("todo.term_defs: the old lesson defined these glossary terms in its own words. Compare with the glossary entry, " +
    "improve the entry (docs/glossary/data, + i18n) if the lesson's text is better, then delete term_defs.");
  // Ukrainian terms fixed by the owner: list the old variants found in this master so the editor replaces them
  const ukText = ukStrings(M).join("\n"), ukTerms = [];
  for (const [use, re] of UK_TERMS) { const found = ukText.match(re); if (found) ukTerms.push({ use, found: [...new Set(found.map((x) => x.toLowerCase()))], n: found.length }); }
  if (ukTerms.length) tasks.push("Ukrainian terms (owner decision): replace the variants listed in todo.uk_terms with the approved term.");
  for (const b of M.body) if ((b.t === "law" || b.role === "law") && !LAWS.has(b.country)) fail(`${id}: law block ${b.k} names ${b.country}, but there is no archive/legacy-docs/learn/data/laws-${b.country.toLowerCase()}.json`);
  M.todo = Object.assign({ audit, moves_out, moves_in, tasks }, termDefs.length ? { term_defs: termDefs } : {}, ukTerms.length ? { uk_terms: ukTerms } : {});
  for (const t of M.terms) if (!GLOSSARY_IDS.has(t) && !GLOSSARY_ALIASES[t] && !NEW_TERM_IDS.has(t)) warn(`${id}: term "${t}" is not in the glossary or in any new_terms`);
  for (const r of M.rule_refs) if (!RULE_IDS.has(r.book + ":" + r.id)) warn(`${id}: rule_ref ${r.book}:${r.id} not found in docs/rules/data`);
  delete M._disc; delete M._todo; delete M._newTerms;
  masters.set(id, M);
  const ovs = {};
  for (const lg of OVERLAY_LANGS) { const o = OV[lg]; if (Object.keys(o.h).length) ovs[lg] = o; }
  overlays.set(id, ovs);
}

/* =====================================================================================================
   Shared files
   ===================================================================================================== */
// --- blocks.json (design §6.5): the only place where block, section and order of a lesson are set ---
const blocksJson = BLOCKS.map((b) => ({
  id: b.id, order: b.order, icon: b.icon, title: b.title, purpose: b.purpose, starters: b.starters,
  sections: b.sections.map((s) => ({ id: s.id, title: s.title, lessons: s.lessons })),
  practice: b.practice, glossary_category: null,
}));

// --- routes.json ---
const routesJson = ROUTES.map((r) => {
  const required = r.stages.flatMap((s) => s.lessons);
  return Object.assign({
    id: r.id, order: r.order, primary: r.primary, icon: r.icon, notes_open: !!r.notes_open, title: r.title, for: r.for,
    stages: r.stages.map((s) => ({ id: s.id, title: s.title, lessons: s.lessons, badge: `stage-${r.id}-${s.id}`,
                                    minutes: s.lessons.reduce((a, l) => a + MINUTES[l], 0) })),
    extras: r.extras, practice: r.practice,
    certificate: r.certificate, badge: `route-${r.id}`,
    totals: { required: required.length, minutes: required.reduce((a, l) => a + MINUTES[l], 0) },
  }, r.checklist ? { checklist: r.checklist } : {}, r.disclaimer ? { disclaimer: r.disclaimer } : {}, r.badge_only ? { badge_only: r.badge_only } : {});
});
// The interpreter route must hold every lesson that has Interpreter Academy text (old progress and certificates move over).
{
  const req = new Set(ROUTES.find((r) => r.id === "interpreter").stages.flatMap((s) => s.lessons));
  for (const [id, M] of masters) if (M.legacy.interpreter.length && !req.has(id)) fail(`lesson ${id} has Interpreter Academy text but is not required in the interpreter route`);
}

// --- id-map.json: redirects (groups A–F), progress transfer, hash routers, 301s in production, glossary links ---
const idMap = {
  _note: "Old ids → new places. Built once by scripts/migrate_academy.mjs from the design mapping. Never delete an entry: " +
         "build_academy.mjs turns it into redirect stubs (GitHub Pages), redirects.json (real 301 on clayarena.com), " +
         "the hash routers of /learn/ and /interpreter/, and the progress migration (clayarena-learn, clayarena-interpreter).",
  langs: LANGS, prefix: { uk: "", other: "<lang>/" },
  learn: {}, interpreter: {}, modules: {}, missions: {}, games: {}, pages: {}, groups: {},
};
for (const id of OLD_LEARN) { const d = PLAN[id].do; if (d.startsWith(">")) idMap.learn[id] = { to: d.slice(1), anchor: id }; }
for (const id of OLD_INTERP) { const d = PLAN[id].do; idMap.interpreter[id] = d.startsWith(">") ? { to: d.slice(1), anchor: id } : { to: id }; }
idMap.modules = {
  intro: "topics/basics", budget: "topics/basics", women: "topics/basics", safety: "topics/safety", health: "topics/safety",
  gun: "topics/gear#gun", chokes: "topics/gear#chokes", cartridges: "topics/gear#cartridges", gear: "topics/gear#kit",
  targets: "topics/targets", technique: "topics/technique", training: "topics/training", mind: "topics/mind", rules: "topics/rules",
  competitions: "topics/competitions", travel: "topics/travel", culture: "topics/community#culture", history: "topics/community#history",
  nextstep: "topics/community#next", clayarena: "topics/watch#clayarena", watching: "topics/watch", juniors: "routes/junior-parent",
};
idMap.missions = {
  sport: "topics/basics", gear: "topics/gear", targets: "topics/targets", flight: "topics/targets#flight",
  basics: "topics/technique#fundamentals", lead: "topics/technique#lead", faults: "topics/technique#faults",
  sporting: "topics/rules", compak: "topics/rules", referee: "topics/rules", etiquette: "topics/safety", interpreter: "topics/stand-talk",
};
idMap.games = { lead: "practice/lead-lab", flight: "practice/name-the-flight", coach: "practice/translate-the-coach",
                call: "practice/referees-call", terms: "practice/term-cards", exam: "routes/interpreter#certificate" };
idMap.pages = { "interpreter-home": "routes/interpreter", "interpreter-app-nojs": "en/learn/routes/interpreter" };
const nMergedLearn = Object.keys(idMap.learn).length;
const nKeptInterp = Object.values(idMap.interpreter).filter((x) => !x.anchor).length;
const nMergedInterp = Object.values(idMap.interpreter).filter((x) => x.anchor).length;
idMap.groups = {
  A: { from: "/learn/<merged id>/ and /en/learn/<merged id>/", to: "/<p>learn/<target>/#<old id>", stubs: nMergedLearn * 2 },
  B: { from: "/interpreter/<lang>/<id>/ (kept lesson)", to: "/<p>learn/<id>/", stubs: nKeptInterp * LANGS.length },
  C: { from: "/interpreter/<lang>/<id>/ (merged lesson)", to: "/<p>learn/<target>/#<old id>", stubs: nMergedInterp * LANGS.length },
  D: { from: "/interpreter/<lang>/", to: "/<p>learn/routes/interpreter/", stubs: LANGS.length },
  E: { from: "/interpreter/ (app)", to: "JS router: ?lang, #l/<id> → interpreter map, #m/<mission> → missions, #g/<game> → games; no JS: meta refresh to /en/learn/routes/interpreter/", stubs: 1 },
  F: { from: "/learn/#<lesson id> and /learn/#<module>", to: "JS on the new /learn/ home: learn map (identity when absent), then modules", stubs: 0 },
  G: { from: "/interpreter/data/*, /interpreter/src/**", to: "removed at the switch (never indexed; content moved to content/academy)", stubs: 0 },
  total_stubs: nMergedLearn * 2 + (nKeptInterp + nMergedInterp) * LANGS.length + LANGS.length + 1,
  rules: ["<p> is empty for uk and '<lang>/' for the other 10 languages.", "Never redirect to another language.",
          "Stub = instant meta refresh + location.replace + canonical to the target + Open Graph tags; no noindex."],
};
for (const [id, x] of Object.entries({ ...idMap.learn, ...idMap.interpreter })) if (!FINAL_SET.has(x.to)) fail(`id-map target ${x.to} of ${id} is not a final lesson`);

// --- ids.lock: every id ever published. Deleting an id without an id-map entry is a build error. ---
const PRACTICE_IDS = ["lead-lab", "name-the-flight", "translate-the-coach", "referees-call", "term-cards", "phrasebook", "rules-exam", "routine"];
const idsLock = {
  _note: "Every id ever published. Append only. The build fails if an id listed here has no page and no entry in id-map.json.",
  learn: [...OLD_LEARN].sort(), interpreter: [...OLD_INTERP].sort(), academy: [...ORDER],
  blocks: BLOCKS.map((b) => b.id), routes: ROUTES.map((r) => r.id), practice: PRACTICE_IDS, reserved: RESERVED,
};

// --- levels.json, badges.json, practice.json (design §7.6–7.7; skeletons the app reads) ---
const levelsJson = {
  _note: "XP and levels of the Academy. No FITASC category words (Junior, Lady, Senior, Veteran, Master) and no 'squad' in level names. " +
         "No streaks that can be broken and no leaderboards until there are accounts and consent.",
  xp: { lesson_first: 20, quiz_correct: 10, lesson_max: 50, quiz_perfect_later: 10, reread_new_rev: 5,
        game_correct: 5, game_day_cap: 50, stage: 25, block: 50, route_exam: 150, rules_exam_per_discipline: 50,
        no_xp_while_known_issue: true },
  levels: [
    { id: "guest", min_xp: 0, title: { uk: "Гість", en: "Guest" } },
    { id: "learner", min_xp: 150, title: { uk: "Учень", en: "Learner" } },
    { id: "practitioner", min_xp: 500, title: { uk: "Практик", en: "Practitioner" } },
    { id: "specialist", min_xp: 1200, title: { uk: "Знавець", en: "Specialist" } },
    { id: "expert", min_xp: 2500, title: { uk: "Експерт", en: "Expert" } },
    { id: "mentor", min_xp: 4500, title: { uk: "Наставник", en: "Mentor" } }],
};
const q = (s) => `«${s}»`;
const badges = [];
for (const b of BLOCKS) badges.push({ id: `block-${b.id}`, kind: "block", ref: b.id, rule: "all lessons of the block done (quiz answered)",
  title: { uk: `Блок ${q(b.title.uk)}`, en: `${b.title.en} block` } });
for (const r of ROUTES) badges.push({ id: `route-${r.id}`, kind: "route", ref: r.id, rule: r.certificate ? "route certificate earned" : "route badge test passed",
  title: { uk: `Маршрут ${q(r.title.uk)}`, en: `${r.title.en} route` } });
for (const r of ROUTES) for (const s of r.stages) badges.push({ id: `stage-${r.id}-${s.id}`, kind: "stage", ref: `${r.id}/${s.id}`, rule: "all lessons of the stage done",
  title: { uk: `${r.title.uk}: ${s.title.uk}`, en: `${r.title.en}: ${s.title.en}` } });
badges.push(
  { id: "four-methods", kind: "practice", ref: "lead-lab", rule: "a hit with each of the four lead methods", enabled_after: "S-01", title: { uk: "Чотири методи", en: "Four methods" } },
  { id: "name-the-flight-10", kind: "practice", ref: "name-the-flight", rule: "10 of 10 in one game", enabled_after: "S-04, S-05", title: { uk: "Назви траєкторію 10/10", en: "Name the flight 10/10" } },
  { id: "coach-translator-20", kind: "practice", ref: "translate-the-coach", rule: "20 correct answers", title: { uk: "Перекладач тренера 20", en: "Coach translator 20" } },
  { id: "referees-call-20", kind: "practice", ref: "referees-call", rule: "20 correct answers", title: { uk: "Рішення судді 20", en: "Referee's call 20" } },
  { id: "terms-50", kind: "practice", ref: "term-cards", rule: "50 terms learnt", title: { uk: "50 термінів", en: "50 terms" } },
  { id: "rules-exam-sporting", kind: "practice", ref: "rules-exam", rule: "rules exam Sporting™ passed with 80 %", title: { uk: "Іспит з правил Sporting™", en: "Rules exam Sporting™" } },
  { id: "rules-exam-compak", kind: "practice", ref: "rules-exam", rule: "rules exam Compak® Sporting passed with 80 %", title: { uk: "Іспит з правил Compak® Sporting", en: "Rules exam Compak® Sporting" } },
  { id: "first", kind: "misc", ref: null, rule: "first lesson done", title: { uk: "Перший урок", en: "First lesson" } },
  { id: "returning", kind: "misc", ref: null, rule: "lessons done on 3 different days", title: { uk: "Повертаюся", en: "Coming back" } },
  { id: "interpreter-academy-2026", kind: "legacy", ref: "clayarena-interpreter.exam", rule: "passed the old Interpreter Academy final exam (score ≥ 80)", title: { uk: "Академія перекладача 2026", en: "Interpreter Academy 2026" } },
);
const badgesJson = { _note: "Badges of the Academy (design §7.7): 13 blocks, 7 routes, 25 stages, 7 practice, 2 general, 1 transferred.", badges };
const practiceJson = {
  _note: "Registry of Practice games (/learn/practice/<id>/). xp:false while a known issue from the audit is open. " +
         "index 'fitasc' follows the FITASC_INDEX switch (false until written FITASC permission).",
  games: [
    { id: "lead-lab", legacy: "lead", title: { uk: "Лабораторія виносу", en: "Lead lab" }, index: "always", xp: false, known_issues: ["S-01", "S-03", "S-11", "S-12"], blocks: ["technique"] },
    { id: "name-the-flight", legacy: "flight", title: { uk: "Назви траєкторію", en: "Name the flight" }, index: "always", xp: false, known_issues: ["S-04", "S-05"], blocks: ["targets", "technique", "watch"] },
    { id: "translate-the-coach", legacy: "coach", title: { uk: "Зрозумійте / перекладіть тренера", en: "Understand / translate the coach" }, index: "always", xp: true,
      modes: ["meaning", "translate"], source: "phrases of all lessons (filter by block)", known_issues: [], blocks: ["stand-talk"] },
    { id: "referees-call", legacy: "call", title: { uk: "Рішення судді", en: "Referee's call" }, index: "fitasc", xp: true,
      source: "question bank of the rules trainer (docs/rules/data/quiz-*.js), filter by discipline", known_issues: ["R-03", "R-04", "R-05"], blocks: ["rules"] },
    { id: "term-cards", legacy: "terms", title: { uk: "Картки термінів", en: "Term cards" }, index: "always", xp: true, source: "glossary terms of the lessons done; Leitner boxes on the device", known_issues: [], blocks: ["basics", "gear"] },
    { id: "phrasebook", legacy: null, title: { uk: "Розмовник", en: "Phrasebook" }, index: "always", xp: false, source: "phrases with core:true; print and local voice only", known_issues: [], blocks: ["stand-talk"] },
    { id: "rules-exam", legacy: null, title: { uk: "Іспит з правил", en: "Rules exam" }, index: "fitasc", xp: true,
      external: "/rules/trainer/?lang={lang}&from=learn", storage_key: "clayarena-trainer", storage_key_old: "clayaway-trainer", known_issues: ["R-02"], blocks: ["rules"] },
    { id: "routine", legacy: null, title: { uk: "Мій ритуал", en: "My routine" }, index: "always", xp: false, later: true, timers_s: { sporting: 15, compak: 10 }, known_issues: [], blocks: ["mind"] },
  ],
};

// --- ui/<lang>.json: the Academy table T{} (uk/en) + the Interpreter Academy ui.json (en/uk + 9 languages) + new keys (en/uk) ---
const T_KEYS = { svc: "academy_name", svcS: "academy_tagline", h1: "home_h1", lead: "home_lead", lessons: "lessons_n", min: "min",
  soon: "module_soon", back: "back_all", backM: "back_block", kp: "key_points", dyk: "did_you_know", terms: "terms", rules: "rules_where",
  check: "quiz", next: "next_lesson", done: "lesson_done", right: "correct", wrong: "wrong", badges: "badges", prog: "done_of",
  foot: "footer", glossary: "glossary", rulesLink: "rules_link", trainer: "rules_trainer" };
const INLINE_KEYS = { "Country laws": "country_laws", "Sources and laws": "sources_laws", "ClayArena Academy · ": "academy_prefix",
  "Information as of the lesson date, not legal advice. Laws change — check the current version.": "laws_disclaimer" };
/* New interface strings of the joint Academy. Only en + uk for now; the 9 languages come with the translation waves (design §7.9). */
const NEW_UI = {
  who_are_you: { en: "Who are you?", uk: "Хто ви?" },
  routes: { en: "Routes", uk: "Маршрути" },
  more_routes: { en: "More routes", uk: "Ще маршрути" },
  topics: { en: "Topics", uk: "Теми" },
  start_here: { en: "Start here", uk: "Почніть тут" },
  go_deeper: { en: "Want to go deeper", uk: "Хочете глибше" },
  my_discipline: { en: "My discipline", uk: "Моя дисципліна" },
  disc_both: { en: "Both", uk: "Обидві" },
  disc_sporting: { en: "Sporting™", uk: "Sporting™" },
  disc_compak: { en: "Compak® Sporting", uk: "Compak® Sporting" },
  continue_route: { en: "Continue: {lesson} · {route} route, stage {n}/{t} · {min} min", uk: "Продовжити: {lesson} · маршрут «{route}», етап {n}/{t} · {min} хв" },
  stage: { en: "Stage", uk: "Етап" },
  start_stage: { en: "Start the stage", uk: "Почати етап" },
  step_of: { en: "Step {n} of {t}", uk: "Крок {n} з {t}" },
  to_route: { en: "Back to the route", uk: "До маршруту" },
  in_routes: { en: "Part of these routes", uk: "Входить у маршрути" },
  route_for: { en: "Who it is for", uk: "Для кого" },
  route_will_learn: { en: "What you will be able to do", uk: "Що ви вмітимете" },
  report_error: { en: "Report a mistake", uk: "Повідомити про помилку" },
  lesson_updated: { en: "Lesson updated", uk: "Урок оновлено" },
  for_interpreter: { en: "For the interpreter", uk: "Для перекладача" },
  stand_talk: { en: "Stand Talk", uk: "Мова стенду" },
  review_pending: { en: "Under review", uk: "Перевіряється" },
  review_pending_d: { en: "A specialist has not checked this lesson yet.", uk: "Цей урок ще не перевірив фахівець." },
  not_medical_advice: { en: "This is not medical advice.", uk: "Не є медичною порадою." },
  evidence: { en: "How well this is researched", uk: "Наскільки це досліджено" },
  ev_strong: { en: "Well researched", uk: "Добре досліджено" },
  ev_some: { en: "Some research", uk: "Є дослідження" },
  ev_little: { en: "Little research", uk: "Мало досліджень" },
  ev_coaches: { en: "Coaches' experience", uk: "Досвід тренерів" },
  more_in_en: { en: "{n} more paragraphs in English", uk: "Ще {n} абзаців — англійською" },
  translation_updating: { en: "Translation is being updated", uk: "Переклад оновлюється" },
  clayaway_coming: { en: "coming soon", uk: "готується" },
  route_exam: { en: "Route exam", uk: "Іспит маршруту" },
  rules_exam: { en: "Rules exam", uk: "Іспит з правил" },
  cert_route: { en: "Certificate of completion of the route {route} of the ClayArena Academy", uk: "Сертифікат проходження маршруту «{route}» Академії ClayArena" },
  cert_disclaimer: { en: "Not a federation qualification, a referee licence, or a coaching or interpreting qualification.", uk: "Не є кваліфікацією федерації, суддівською ліцензією, кваліфікацією тренера чи перекладача." },
  cert_missing: { en: "What you still need for the certificate", uk: "Чого ще бракує для сертифіката" },
  cert_means: { en: "What this certificate means and what it does not mean", uk: "Що цей сертифікат означає і чого не означає" },
  checklist_print: { en: "Printable checklist", uk: "Чек-лист для друку" },
  progress: { en: "Progress", uk: "Прогрес" },
  progress_not_saved: { en: "Progress is not being saved on this device.", uk: "Прогрес не зберігається на цьому пристрої." },
  progress_transfer: { en: "Transfer progress", uk: "Перенести прогрес" },
  search: { en: "Search lessons and terms", uk: "Пошук уроків і термінів" },
  back_academy: { en: "← Academy", uk: "← Академія" },
  practice_known_issue: { en: "No XP for this game until a known issue is fixed.", uk: "За цю гру XP не нараховується, доки не виправлено відому помилку." },
};
const uiOut = {};
{
  const U = interp.uiMaster;
  const strings = Object.fromEntries(LANGS.map((lg) => [lg, {}]));
  for (const [k, v] of Object.entries(U)) { strings.en[k] = v.en; strings.uk[k] = v.uk; for (const lg of OVERLAY_LANGS) if (k in interp.ui[lg]) strings[lg][k] = interp.ui[lg][k]; }
  for (const [tk, nk] of Object.entries(T_KEYS)) {
    const en = learnUi.T.en[tk], uk = learnUi.T.uk[tk];
    if (en == null || uk == null) fail("Academy UI key missing in T: " + tk);
    if (nk in strings.en && (strings.en[nk] !== en || strings.uk[nk] !== uk)) fail(`UI key clash ${tk} → ${nk}: texts differ`);
    strings.en[nk] = en; strings.uk[nk] = uk;
  }
  for (const x of learnUi.inline) { const nk = INLINE_KEYS[x.en]; if (!nk) continue; strings.en[nk] = x.en; strings.uk[nk] = x.uk; }
  for (const [k, v] of Object.entries(LAW_UI)) { if (k in strings.en) fail("law UI key already exists: " + k); strings.en[k] = v.en; strings.uk[k] = v.uk; }
  for (const [k, v] of Object.entries(NEW_UI)) { if (k in strings.en) fail("new UI key already exists: " + k); strings.en[k] = v.en; strings.uk[k] = v.uk; }
  for (const lg of LANGS) uiOut[lg] = { lang: lg, strings: strings[lg] };
}

// --- legacy/modules.json: an ARCHIVE of the titles and intros of the 22 old Academy modules (uk/en) and the 12 Interpreter
//     Academy missions (11 languages), byte for byte. Modules and missions are replaced by blocks and routes, so the build does
//     not read this file; it keeps the texts (and their 9 translations) as material for block and route intros, because the
//     old sources are removed at the switch-over release (design §5.2, group G).
const legacyModules = {
  _note: "Archive, not read by the build: titles and intros of the old Academy modules and Interpreter Academy missions, copied " +
         "byte for byte from docs/learn/data/*.js and docs/interpreter/src/{missions,i18n}. 'now' = where the old hash link goes (id-map.json).",
  learn_modules: learn.modules.map((m) => ({ id: m.module, order: m.order, now: idMap.modules[m.module] || null,
    title: { en: m.title_en, uk: m.title_uk }, intro: { en: m.intro_en, uk: m.intro_uk }, lessons: m.lessons.map((l) => l.id) })),
  interpreter_missions: interp.missions.map((m) => {
    const title = { en: m.title.en, uk: m.title.uk }, intro = { en: m.intro.en, uk: m.intro.uk };
    for (const lg of OVERLAY_LANGS) { const t = interp.trMissions[lg][m.id]; if (!t) fail(`no ${lg} translation of mission ${m.id}`); title[lg] = t.title; intro[lg] = t.intro; }
    return { id: m.id, order: m.order, icon: m.icon, now: idMap.missions[m.id] || null, title, intro, lessons: m.lessons.map((l) => l.id) };
  }).sort((a, b) => a.order - b.order),
};
for (const m of legacyModules.learn_modules) if (!m.now) fail("module without a router target in id-map.json: " + m.id);
for (const m of legacyModules.interpreter_missions) if (!m.now) fail("mission without a router target in id-map.json: " + m.id);

/* =====================================================================================================
   Write
   ===================================================================================================== */
const MASTER_ORDER = ["id", "rev", "status", "plan", "level", "minutes", "disciplines", "audiences", "index", "critical", "disclaimer", "review_by", "review",
  "legacy", "terms", "new_terms", "rule_refs", "facts", "sources", "title", "summary", "brief", "body", "note", "phrases", "key_points", "did_you_know",
  "quiz", "exam_pool", "evidence", "h_uk", "todo"];
const ordered = (o, keys) => { const r = {}; for (const k of keys) if (k in o) r[k] = o[k]; for (const k of Object.keys(o)) if (!(k in r)) r[k] = o[k]; return r; };
const OV_ORDER = ["id", "lang", "base_rev", "h", "review", "title", "summary", "body", "note", "phrases", "key_points", "did_you_know", "quiz"];
const json = (o) => JSON.stringify(o, null, 2) + "\n";
const files = new Map();                                 // relative path → content
for (const [id, M] of masters) files.set(`lessons/${id}.json`, json(ordered(M, MASTER_ORDER)));
for (const [id, ovs] of overlays) for (const [lg, o] of Object.entries(ovs)) files.set(`i18n/${lg}/${id}.json`, json(ordered(o, OV_ORDER)));
files.set("blocks.json", json(blocksJson));
files.set("routes.json", json(routesJson));
files.set("id-map.json", json(idMap));
files.set("ids.lock", json(idsLock));
files.set("levels.json", json(levelsJson));
files.set("badges.json", json(badgesJson));
files.set("practice.json", json(practiceJson));
files.set("facts.json", json({}));                       // design §6.5: one number in one place, ids used as {{fact:<id>}}
for (const [cc, raw] of LAWS) files.set(`laws/${cc}.json`, raw);   // byte for byte (see loadLaws)
files.set("legacy/modules.json", json(legacyModules));
for (const lg of LANGS) files.set(`ui/${lg}.json`, json(uiOut[lg]));

const counts = {
  old_lessons: { learn: OLD_LEARN.length, interpreter: OLD_INTERP.length },
  masters: masters.size, new_lessons: Object.values(PLAN).filter((p) => p.do === "new").length,
  merged: { learn: nMergedLearn, interpreter: nMergedInterp }, merge_targets: Object.keys(mergedInto).length,
  lessons_with_overlays: [...overlays.values()].filter((o) => Object.keys(o).length).length,
  overlay_files: [...overlays.values()].reduce((a, o) => a + Object.keys(o).length, 0),
  draft_blocks: [...masters.values()].reduce((a, M) => a + M.body.filter((b) => b.t === "draft").length, 0),
  new_terms_pending: [...masters.values()].reduce((a, M) => a + (M.new_terms || []).length, 0),
  term_defs_to_compare: [...masters.values()].reduce((a, M) => a + (M.todo.term_defs || []).length, 0),
  law_tables: LAWS.size,
  redirect_stubs: idMap.groups.total_stubs, badges: badges.length,
};
files.set("migration.json", json({
  _note: "Record of the one-time migration (scripts/migrate_academy.mjs). The old sources docs/learn/data and docs/interpreter/src are frozen from now on: edit content/academy only.",
  date: new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Bratislava" }).format(new Date()),   // project service time zone
  counts, warnings,
}));

if (masters.size !== 142) fail(`expected 142 masters, got ${masters.size}`);

if (DRY) {
  console.log(JSON.stringify(counts, null, 2));
  console.log(`${files.size} files would be written; ${warnings.length} warnings`);
  for (const w of warnings) console.log("  warn: " + w);
  process.exit(0);
}
if (fs.existsSync(path.join(OUT, "lessons")) && !ARGS.has("--force"))
  fail("content/academy/lessons already exists. The migration runs once; after it, edit content/academy directly. Use --force only to start over (it overwrites edits).");
if (ARGS.has("--force"))                                   // start over: drop the generated folders (SCHEMA.md is kept)
  for (const d of ["lessons", "i18n", "ui", "facts", "laws", "legacy"]) fs.rmSync(path.join(OUT, d), { recursive: true, force: true });
for (const [rel, content] of files) {
  const p = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content, "utf8");
}
console.log(JSON.stringify(counts, null, 2));
console.log(`wrote ${files.size} files to ${path.relative(ROOT, OUT)}; ${warnings.length} warnings (see migration.json)`);
