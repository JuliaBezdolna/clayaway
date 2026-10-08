# ClayArena Academy — content source (`content/academy/`)

One "Академія ClayArena" for everybody: beginners, shooters before a first competition, interpreters, parents of juniors,
new coaches, organisers and fans. It replaces the ClayArena Academy (`docs/learn/data/*.js`) and the Interpreter Academy
(`docs/interpreter/src/**`); those frozen old sources were moved out of `docs/` to `archive/legacy-docs/` on 08.10.2026 (not published,
see its README). **This folder is the only source of truth.** It lives outside `docs/`, so nothing here is
published as is: the build (`scripts/build_academy.mjs`, called by `scripts/build_seo.mjs`) turns it into pages, `catalog.json` files, redirect
stubs, sitemaps and the Open Graph list.

- Created once by `bun scripts/migrate_academy.mjs` (texts copied byte for byte); checked then by `bun scripts/check_academy_migration.mjs`.
  That check is **historical** now: the editors have changed the texts since, so it prints the differences with a notice and exits 0
  (`--strict` fails on any difference, meaningful only right after a migration). The checks that count are those of the build (§10).
- From now on the old sources are **frozen** until the switch-over release. Edit only `content/academy/`.
- Do not run the migration again: it refuses when `lessons/` exists, and `--force` would overwrite every edit made here.
- English is the master language and has priority; Ukrainian is written together with it in the same master file.
  The 9 other ClayArena languages are overlays that follow later.

## 1. Folder layout

```
content/academy/
  SCHEMA.md                 this file
  blocks.json               13 blocks (topics): the ONLY place where a lesson's block, section and order are set
  routes.json               7 routes (readers): stages, extras ("Хочете глибше"), practice, certificate
  id-map.json               old ids → new places (redirect groups A–G, routers, progress transfer, 301 list)
  ids.lock                  every id ever published (append only)
  levels.json badges.json practice.json   XP and levels, badges, Practice games registry
  migration.json            what the one-time migration did (counts, warnings)
  lessons/<id>.json         141 masters: structure + en + uk (142 published; history-olympics-and-world retired 08.10.2026, §2a)
  i18n/<lang>/<id>.json     overlays for de fr it cs pl pt hu fi lt: texts by key + hash of the English source
  i18n/<lang>/_facts.json   translations of the facts (same ids as the tokens; created with the first translated fact)
  i18n/<lang>/_shared.json  titles of blocks, sections, routes, stages, games, levels and badges in that language (§5a)
  facts.json                shared numbers and facts: one number in one place (design §6.5), used as {{fact:<id>}}
  facts/<file>.json         the same, kept per topic by the editors: fact <id> of facts/basics.json is {{fact:basics.<id>}}
  laws/<CC>.json            country law tables for body blocks t:"law" (ISO 3166 code in capitals: CZ DE ES FR IT), uk + en
  legacy/modules.json       ARCHIVE, not read by the build: titles and intros of the 22 old Academy modules (uk/en)
                            and the 12 Interpreter Academy missions (11 languages) — material for block and route intros
  ui/<lang>.json            interface strings, 11 languages (the build publishes them as docs/learn/data/<lang>/ui.json, §8d)
```

- `laws/<CC>.json` are byte copies of the old `docs/learn/data/laws-<cc>.json` (now in `archive/legacy-docs/learn/data/`; the old `laws-<cc>.js` were generated from them by
  `scripts/build_laws.py`). The file name is the **country** code in capitals, so the language check of the build never takes a
  country (`ES`) for a language code. Fields: `as_of`, `country_uk/en`, `note_uk/en`, and `lead[]`, `travel[]` or `states[]`
  (rows with `*_uk/*_en` texts, `law`, `article`, `url`, `since`, `verified`). Translations into the 9 languages come later as
  `i18n/<lang>/laws/<CC>.json` with the same structure. Laws change: check `as_of` and the official text before every release.
  `law` and `article` are official citations (the title of the law in the language of its country, for example a Spanish decree):
  they are proper names, not text in that language, so the build's language check skips these two fields and their `url`.
- `legacy/modules.json` exists only so that nothing is lost when the old sources are removed at the switch-over (design §5.2,
  group G). Modules and missions themselves are replaced by blocks and routes.

## 2. Ids, URLs and the lock

- A lesson id is a **permanent URL slug**: `/learn/<id>/` (uk) and `/<lang>/learn/<id>/` (other 10 languages). Slugs are
  English kebab-case in every language. The prefix of an id is historical (`health-recoil-shoulder-neck` sits in
  "Technique"); the block is set **only** in `blocks.json`. New lessons get the prefix of their block.
- Reserved first segments after `/learn/` that no lesson id may take: `topics`, `routes`, `practice`, `progress`, `app`, `data`, `assets`.
- Other URLs: `/learn/topics/<block>/`, `/learn/routes/<route>/` (+ `exam/`, noindex), `/learn/practice/<game>/`, `/learn/progress/` (noindex).
- `ids.lock` (JSON) lists every id ever published: the 123 old Academy ids, the 63 old Interpreter Academy ids, the 142
  Academy ids, blocks, routes and practice games. Removing an id that is in the lock without an entry in `id-map.json` is a build error.

### 2a. Retiring a lesson (taking it off the site)

Used once so far: `history-olympics-and-world`, 08.10.2026 (owner decision: the whole site is about Parcours de Chasse – Sporting™ and
Compak® Sporting only; no other disciplines anywhere, §9). A retired lesson is not "moved": its text goes, its URL keeps working.
1. **ids.lock is not touched** (append only): the id stays in `academy` (and in `learn`, if it was an old Academy id).
2. **id-map.json `learn`:** add `"<id>": {"to": "<nearest lesson>", "retired": "<date>"}` (no `anchor`), and note it in `groups.H`.
   The build sees an id of `ids.lock` "academy" without a master and writes redirect stubs (**group H**) `/<p>learn/<id>/` →
   `/<p>learn/<target>/` in **every** language where the target exists (same language, never another one), lists them in
   `learn/data/redirects.json` (real HTTP 301 on clayarena.com) and `learn/data/id-map.json` (the JS routers and the progress transfer),
   and deletes the stale app file `learn/data/<lang>/lessons/<id>.json` from the output.
3. **Remove the id** from `blocks.json` (its section) and `routes.json` (stages and extras). Its quiz and `exam_pool` questions leave the
   route exams by themselves (the exams are built from the masters).
4. **Delete** `lessons/<id>.json` and `i18n/<lang>/<id>.json` in all 9 languages; then delete facts (`facts/*.json` + `i18n/<lang>/_facts.json`)
   and glossary terms that only this lesson used (a glossary id leaves through `docs/glossary/data/aliases.json`, which turns its pages
   into redirect stubs; see DEVELOPERS.md).
5. **Other lessons:** remove `{{lesson:<id>}}` tokens (the build fails on a dead token) and any text that sent readers there.
6. Progress: a reader's mark on the retired lesson stays in the local progress store but belongs to no block or route any more;
   progress of the old Academy (`clayarena-learn`) that pointed to it moves to the target through the id map, as for a merged lesson.

## 3. The master: `lessons/<id>.json`

| Field | Meaning |
|---|---|
| `id`, `rev` | id = file name. `rev` grows by 1 with every content change readers should notice ("Урок оновлено"). |
| `status` | `draft` (not built) → `review` (written; waits for the specialist; **published** with "Перевіряється") → `ready` (editor done) → `published`; `preview` = finished but noindex until launch (the ClayAway lesson, together with `index: "preview"`). After the migration every lesson was `draft`. Build errors of `review`/`ready`/`published` lessons stop the build; errors of `draft` lessons are only listed. |
| `plan` | what the design asked for: `keep`, `rewrite` or `new`. |
| `level` | 1 = "Почніть тут" (a starter of its block in `blocks.json`), 2 = "Глибше". The build checks both agree. |
| `minutes`, `disciplines` | reading time (at most 8; longer lessons are split under a new id); `["sporting","compak"]` or one of them. |
| `audiences` | reader types the lesson is written for (`beginner shooter interpreter parent coach organiser fan`); editorial. Route membership comes from `routes.json`. |
| `index` | `always` (indexable) · `fitasc` (follows `FITASC_INDEX`) · `preview` (noindex until launch, ClayAway). Lessons of the "Правила" block are `always`: short, practical, in our own words; penalty tables stay in the noindex rules guide. |
| `critical` | true for safety, rules and anti-doping: a stale translation is shown in English with "Переклад оновлюється". |
| `disclaimer` | `medical` for psychology and health lessons: the page ends with "Не є медичною порадою". |
| `review_by` | date by which the content must be checked again (anti-doping: every September against the WADA list). |
| `review` | `{status, specialist, facts, rules_data, editor}`. `status: "pending"` shows "Перевіряється" (blocks "Психологія" and "Правила") until the named specialist has checked the lesson. |
| `legacy` | `{learn: [...], interpreter: [...]}` — every old id whose text lives in this master (its own old id included). Each of the 186 old lessons is in exactly one master, except a retired one (§2a: `history-olympics-and-world`, which only id-map.json keeps). |
| `terms` | glossary ids (`docs/glossary/data/glossary.js` + `learn_terms.js`); unknown ids are a build error. |
| `new_terms` | only after the migration: terms not yet in the glossary. Move them to `learn_terms.js` (+ i18n) and delete the field; a lesson with `new_terms` is not published. |
| `rule_refs` | `[{book: "sporting"\|"compak"\|"categories", id}]`, ids from `docs/rules/data/*.js`. |
| `facts` | ids of facts used by `{{fact:…}}` tokens (filled by the build check). |
| `sources` | `[{title: {en, uk?}, url, rel, checked, license}]`. Only where the text has numbers, laws or research. FITASC links: `rel: "nofollow noopener noreferrer"`. |
| `title`, `summary` | `{en, uk}`; summary is the meta description (1–2 sentences). Names of disciplines with ™/® (use the tokens). |
| `brief` | new and rewritten lessons only: `{title?: {en, uk}, points: {en: [], uk: []}}` — what the author must write. Internal. |
| `body` | list of blocks (section 4). |
| `note` | `[{k, for: "interpreter"\|"coach"\|"parent", en, uk}]` — side notes ("Для перекладача" is open on the interpreter route). |
| `phrases` | Stand Talk: `[{k, speaker: "coach"\|"referee"\|"shooter", core, en, meaning: {en, uk}, say: {uk}}]`. `en` is the English phrase as it is said on the stand (never translated; spoken only with a local voice). `say` = how to say it in your language. |
| `key_points` | "Головне": `[{k, en, uk, checklist?}]`. `checklist: true` puts the point on the printable checklists of the routes. |
| `did_you_know` | `{k, en, uk}` or null. |
| `quiz` | exactly 3 questions shown in the lesson: `{k, disc?, q: {en, uk}, options: [{k: "a", en, uk}, …], correct: "<option key>", explain: {en, uk}, rule_ref?}`. The answer is stored by **option key**, never by position; options are shuffled on screen. |
| `exam_pool` | more questions of the same shape (from merged lessons): used by route exams and Practice. No question is lost. |
| `evidence` | psychology/health: `[{for: "<body key>", level: "strong"\|"some"\|"little"\|"coaches", sources: [url]}]`, shown as "Добре досліджено" / "Є дослідження" / "Мало досліджень" / "Досвід тренерів". null for other lessons. |
| `h_uk` | `{key: hash}` — hash of the English text the Ukrainian was written from (same rule as overlays). The build warns when en changed and uk did not. |
| `todo` | editor's list: `audit` (finding codes, with `from` when they came with a merged lesson; `status: "fixed-in-source"` = already fixed in the old sources before the migration, only check that the fix survives the merge), `moves_out` / `moves_in` (paragraphs that belong to another lesson, design §3.2), `term_defs` (the old lesson's own definition of a term that the glossary already has with other wording: compare, improve the glossary entry if useful, then delete), `uk_terms` (old Ukrainian variants found in the texts, with the approved term to use instead: вкладка, передпостріловий ритуал, точка підхоплення, підгонка рушниці), `tasks`. Delete items when done; the build ignores this field. |

### Keys `k`

- Every body block, note, phrase, key point, "did you know" and quiz question has a key that is **unique in the whole Academy** and **never reused**.
- Migrated keys: `<old id>-p<n>` (paragraphs), `-kp<n>` (key points), `-q<n>` (quiz), `-ph<n>` (phrases), `-dyk`, `-sim`,
  `-law<n>`, `-title` and `-summary` (headings of merged lessons). New items: `<lesson id>-<anything>`, for example `mind-breathing-p3`.
- Quiz options are keyed `a`, `b`, `c`, … inside their question.
- When an editor moves a paragraph to another lesson, the key moves with it, and so do its 9 translations (copy the overlay entries too).

## 4. Body blocks

Common fields: `k`, `t` (type), `en`, `uk`; optional `core: true` (must be translated before a language page is
published; set on everything that came from the Interpreter Academy, which already has 11 languages), `disc`
(`sporting`\|`compak`\|`both`), `rule_ref` (`"<book>:<id>"`), `anchor` (an `id` for links like `#<old id>`), `critical`.

| `t` | Use |
|---|---|
| `p` | paragraph |
| `steps` | numbered steps: `en`/`uk` are arrays |
| `tip` | practical hint |
| `warn` | safety warning (orange frame) |
| `compare` | columns "{{tm:sporting}} \| {{tm:compak}}": `sporting: {en, uk}`, `compak: {en, uk}`; both labels are mandatory |
| `rule` | one rule of one discipline: `disc` and `rule_ref` are required, and the ref must point into the book of that discipline |
| `law` | country law table: `country` (ISO 3166 code in capitals, for example `DE`, `ES`, `CZ`) and `part` (`lead` \| `travel` \| `states`); the data, with its date (`as_of`) and sources, is `laws/<country>.json` |
| `fact` | card from `facts.json`: `fact: "<id>"` |
| `evidence` | evidence badge: `level` + `for` |
| `sim` | animation: `sim: {type, preset, …}` (the `docs/shared/sims.js` registry: `flight`, `lead`, `pair`, `call` = stand scenes `signal`, `signal-late`, `manual`, `sonopull`, `gun-ready`, `gun-early`, `misfire`, `mount` — the side-view gun mount: muzzles first, then the stock to the cheek, “cheek on the comb”); `ready: false` is never published (all migrated animations start false until findings S-01…S-05, S-09 are checked). `en`/`uk` = one line of what to watch, shown under it; the 9 overlay languages show the generic caption `anim_w_<kind>` until `body[<key>]` is translated from the current English (warning `sim-caption`). The first shown animation is placed right after the first paragraph (on a phone, ≤ 560 px, the app puts it just before it, after the summary) |
| `figure` | ClayArena media only, with author and licence |
| `h` | section heading inside a lesson (`en`/`uk`), shown as `<h2>` on the page and in the app; its `id` is `anchor` when set (give `anchor: "<old id>"` where a merged lesson starts, so old links `#<old id>` land on it), else its key `k` (`#<k>` links to the section). The app still shows types it does not know as a paragraph |
| `draft` | migration only: text of a merged lesson. `from` = old id; `role` = `title`\|`summary`\|`p`\|`did_you_know`\|`sim`\|`law`; the title block has `anchor: "<old id>"`. **A lesson with any `draft` block or any item with `draft: true` is not published.** The editor keeps the facts, deletes repeats and changes `t` to a real type. |

## 5. Overlays: `i18n/<lang>/<id>.json`

```json
{"id": "rules-malfunctions", "lang": "de", "base_rev": 1,
 "h": {"title": "9a1f3c0e", "sporting-malfunctions-p1": "bf028222"},
 "review": {"by": null, "date": null, "origin": "interpreter-academy"},
 "title": "…", "summary": "…",
 "body": {"sporting-malfunctions-p1": "…"}, "note": {"…": "…"},
 "phrases": {"sporting-malfunctions-ph1": {"meaning": "…", "say": "…"}},
 "key_points": {"sporting-malfunctions-kp1": "…"}, "did_you_know": "…",
 "quiz": {"sporting-malfunctions-q1": {"q": "…", "options": {"a": "…", "b": "…"}, "explain": "…"}}}
```

- Only the 9 languages de fr it cs pl pt hu fi lt. `quiz` covers both `quiz` and `exam_pool` keys of the master.
- **Hash `h`** = the first 8 hex characters of SHA-1 (UTF-8) of the English source the translation was made from:
  text item → `en`; phrase → `en + "\n" + meaning.en`; quiz question → `q.en`, every `options[].en` and `explain.en` joined with `"\n"`; title/summary → their `en`;
  `steps` → the `en` steps joined with `"\n"`; `compare` → `sporting.en + "\n" + compak.en` (its overlay value is `{sporting, compak}`).
- Language status per lesson: **ready** (all keys, hashes equal) · **stale** (an English text changed) · **incomplete** (keys missing).
- A page in language X is published, and listed in hreflang, when every `core` item is translated and not stale.
  Untranslated non-core paragraphs are not shown; the page ends with "Ще N абзаців — англійською" and a link to en.
  A stale `critical` paragraph is shown in English with "Переклад оновлюється"; other stale ones keep the old translation with a build warning.
- Order of work: audit fixes go into the master first; only then the overlays are updated, so wrong facts are not spread into 9 languages.

### 5a. Shared texts of a language: `i18n/<lang>/_shared.json`

Home, topic, route and Practice pages of language X are built only when X has these titles (en/uk are in `blocks.json`, `routes.json`,
`practice.json`, `levels.json`, `badges.json`). Until then only the lesson pages of X exist (without topic breadcrumbs) and the catalog
has `null` titles. Missing interface strings (`ui/<lang>.json`) fall back to English with a build warning (`ui-fallback`).

```json
{"lang": "de",
 "blocks":   {"basics": {"title": "…", "purpose": "…", "sections": {"what": "…", "start": "…", "kids": "…"}}},
 "routes":   {"beginner": {"title": "…", "for": "…", "disclaimer": "…", "certificate": "…", "checklist": "…", "stages": {"first-visit": "…"}}},
 "practice": {"lead-lab": "…"}, "levels": {"guest": "…"}, "badges": {"block-basics": "…"}}
```

## 6. Tokens inside texts

| Token | Output |
|---|---|
| `{{term:id\|form}}` | link to `/<p>glossary/<id>/` with the glossary's `term_local`; `form` is the inflected form (uk, lt, fi, cs, pl) |
| `{{tm:sporting}}`, `{{tm:compak}}` | "Parcours de Chasse – Sporting™" (later in the same lesson "Sporting™") and "Compak® Sporting" |
| `{{rule:book:id}}` | link to the rules guide item with `?lang=` (the guide itself is noindex) |
| `{{lesson:id}}` | link to that lesson in the same language, with its title in that language |
| `{{fact:id}}` | the text of fact `id` from `facts.json`, or `{{fact:<file>.<id>}}` from `facts/<file>.json` (other languages: `i18n/<lang>/_facts.json`) |

Migrated texts still contain the literal trademark names; use the tokens in everything new.

## 7. Shared files

**`blocks.json`** — `[{id, order, icon, title: {uk, en}, purpose: {uk, en}, starters: [ids], sections: [{id, title, lessons: [ids]}], practice: [game ids], glossary_category}]`.
Section ids are URL anchors (`/learn/topics/gear/#chokes`). Every lesson is in exactly one section of one block.

**`routes.json`** — `[{id, order, primary, icon, notes_open, title, for, stages: [{id, title, lessons, badge, minutes}], extras, practice, certificate, badge, totals, checklist?, disclaimer?, badge_only?}]`.
A route is only a list of ids; a lesson done once counts in every route. Stages ≤ 11 lessons and about 60 minutes.
The certificate needs the required lessons, the route exam (questions from `quiz` + `exam_pool` of the required lessons) and the route's practice items.
The interpreter route contains every lesson with Interpreter Academy text, so old progress and certificates move over.

**`id-map.json`** — `learn` (merged Academy ids → `{to, anchor}`), `interpreter` (all 63 → `{to}` or `{to, anchor}`),
`modules` and `missions` (old hash links → `topics/<block>#<section>` or `routes/<route>`), `games` (old game ids → `practice/<game>`),
`pages`, and `groups` (A–G, 737 stubs). Used for redirect stubs, `redirects.json` (real 301 on clayarena.com), the JS routers of
`/learn/` and `/interpreter/`, the progress transfer and the glossary's "Де вивчити" links. Never redirect to another language.

**`levels.json`, `badges.json`, `practice.json`** — XP rules and levels (no FITASC category words, no "squad"); 55 badges;
the Practice games with `index` (`referees-call` and `rules-exam` are `fitasc`, i.e. noindex) and `xp: false` while a known audit issue is open.

**`facts.json`** — `{"<id>": {"text": {en, uk}, "evidence"?: "strong", "scope"?: "sporting", "rule_ref"?: "sporting:…", "sources": [url]}}`.
One number in one place: every lesson that needs the number uses `{{fact:<id>}}` instead of writing it again. Ids are kebab-case with a
topic prefix (`gunshot-peak-db`, `sporting-jacket-line-25cm`). Every number is checked against its source (or `docs/rules/data`) before use.

**`ui/<lang>.json`** — `{lang, strings: {key: text}}` for all 11 languages: the old Academy table (`academy_name`, `footer`, …),
the headings and column names of the law tables (`law_*`, from the old `law-tables.js`, now in `archive/legacy-docs/learn/data/`, uk/en),
the Interpreter Academy `ui.json` with its 9 translations, and the new Academy keys (en + uk only for now; the other languages
fall back to en with a build warning until the translation waves).

## 8. CATALOG contract (what the build emits for the app)

Design §7.1: every page is static and complete (text, "Головне", terms, sources and the quiz in `<details>` work without JavaScript);
`academy.js` only adds progress, quiz, XP, animations, voice and the route context. So the app gets **one light catalog per language**
plus its interface strings (both read on every page, fetched together; the catalog is about 26 KB gzipped for uk, 135 KB raw, the
strings about 25 KB raw and cached by the browser), the data of one lesson **on demand**, and the phrase index only on the two phrase
games. Nothing is built twice.

**a) `docs/learn/data/<lang>/catalog.json`** — blocks, routes and lesson *cards*, no lesson text, no interface strings:

```
{lang, rev, generated, base, test?, files: {ui: "ui.json", phrases: "phrases.json"}, fitasc_index, id_map,
 blocks:  [{id, order, icon, title, purpose, url, starters: [ids],
            sections: [{id, title, lessons: [ids]}], practice: [game ids], glossary_category}],
 routes:  [{id, order, primary, icon, notes_open, title, for, url, exam_url,
            stages: [{id, title, lessons: [ids], badge, minutes}], extras: [ids],
            practice, certificate, badge, totals, checklist?, disclaimer?, badge_only?}],
 lessons: {id: {id, rev, block, section, level, minutes, disciplines, status, draft?, index, review_flag, disclaimer,
                title, summary, url, data, alt: [langs]}},
 practice: [{id, legacy, title, description, url, index, xp, known_issues, blocks, external?, later?, …}],
 levels: {xp, levels: [{id, min_xp, title}]}, badges: [{id, kind, ref, rule, title}]}
```

**b) `docs/learn/data/<lang>/lessons/<id>.json`** — the lesson itself (`lessons[id].data` is its URL), fetched when the lesson
page needs the interactive parts:

```
{id, rev, lang, status, review_flag, disclaimer,
 body:       [{k, t, html, disc, rule_ref, anchor?, sim?}],
 notes:      [{k, for, html}],
 phrases:    [{k, speaker, en, meaning, say}],
 key_points: [{k, html, checklist}],
 did_you_know: {k, html} | null,
 quiz:       [{k, q, options: [{k, text}], correct, explain, rule_ref?}],
 terms:      [{id, en, local, url}],
 rule_refs:  [{book, id, label, url}],
 sources:    [{title, url, fitasc}],
 evidence:   [{for, level}],
 more_in_en: n}
```

**c) `docs/learn/data/<lang>/exams/<route>.json`** — the question bank of a route exam (noindex page `/learn/routes/<route>/exam/`):
the `quiz` and `exam_pool` questions of the route's required lessons, same shape as `quiz` above plus `lesson`.

**d) `docs/learn/data/<lang>/ui.json`** — the interface strings of `ui/<lang>.json` with the English fallback filled in
(was `catalog.ui` until 10.2026; the app still accepts a catalog that carries `ui` itself, e.g. an API that keeps one response):

```
{lang, rev, ui: {key: text}, ui_fallback: [keys shown in English]}
```

**e) `docs/learn/data/<lang>/phrases.json`** — the phrase index: every Stand Talk phrase of the lessons published in that language,
in block and lesson order, for the Practice games "Зрозумійте / перекладіть тренера" and "Розмовник" (one request instead of one per
lesson; the app falls back to the lesson files when the index is missing):

```
{lang, rev, phrases: [{k, lesson, block, speaker, en, meaning, say, lang?}]}
```
`meaning`/`say` are plain text in the file's language (`say` is null in en); `lang: "en"` marks a stale critical phrase shown in English.

**f) `docs/learn/data/languages.json`** (one file for the site) — where the Academy is published, for the project bar
(`docs/shared/nav.js`): its "Академія" item opens `/<p>learn/` only in a published language, otherwise `/en/learn/`:

```
{_note, generated, langs: [11], published: [languages whose home /<p>learn/ is built], fallback: "en", lessons: {lang: number of lesson pages}}
```

Rules:
- All strings are in the file's language. Every `html` string is **already escaped text** in which the build has rendered the
  tokens (`{{term}}`, `{{tm}}`, `{{rule}}`, `{{lesson}}`, `{{fact}}`) as links or text; the app inserts it as is and never builds
  HTML from raw text. `en` of a phrase is the English stand phrase (spoken only with a local voice).
- `block` and `section` come from `blocks.json`; `routes` are `routes.json` with titles in the language; `rev` is the master's `rev`
  (the app shows "Урок оновлено" when a reader finished an older `rev`).
- `status`: `published`, `preview` (noindex, ClayAway), `draft` (not built) or `untranslated` (no ready version in this language: no
  `data` file, and `alt` names the languages where the lesson exists). `review_flag`: `"pending"` (show "Перевіряється") or null.
  `disclaimer: "medical"` → the page ends with "Не є медичною порадою".
- `body` contains only publishable blocks (never `draft`, never `sim` with `ready: false`); `sim` is the animation config for
  `t: "sim"`; `disc` and `rule_ref` as in the master; `anchor` is the `#<old id>` target of a merged lesson.
  `more_in_en` = the number of non-core paragraphs not yet translated ("Ще N абзаців — англійською").
- `quiz` holds the 3 questions of the lesson (options in master order; the app shuffles). `exam_pool` is never in the lesson file.
- `url` is the lesson URL in this language; `alt` lists only languages where the lesson is published (the same set as hreflang; `x-default` = en).
  Never point to a page in another language as if it were this one.
- `sources`: `fitasc: true` → the app writes `rel="nofollow noopener noreferrer"`; all other links get `rel="noopener noreferrer"`.
- `practice`, `levels`, `badges`: `practice.json`, `levels.json`, `badges.json` with titles in the language.
- In production (clayarena.com) the server returns the same JSON from the database; the shapes stay the same.
- What the build writes (scripts/build_academy.mjs): `rev` = hash of the catalog content; `title`/`purpose`/`for` are `null` when that text
  has no version in the language (§5a); `data` is relative to the catalog (`lessons/<id>.json`); `alt` is the list of languages with a page
  (`/<p>learn/<id>/`); `index` = `index` | `noindex` of the built page; `url` = `null` for pages that are not built. A `--draft` preview build
  sets `test: true` and gives the built draft lessons `status: "published"` (or `preview`) with `draft: true`, so the app can show them.

How the app (`docs/learn/app/academy.js`, DEVELOPERS.md §4e) reads the parts the shapes above leave open — the build must write them so:
- **Plain-text fields** (`title`, `summary`, `purpose`, `for`, quiz `q` / `options[].text` / `explain`, phrase `meaning` / `say`,
  term and rule labels) are plain text with the tokens already rendered as text (`{{tm:sporting}}` → "Parcours de Chasse – Sporting™",
  `{{fact:…}}` → its text). The app escapes them. A token that slips through is shown as plain text, never as HTML.
- **`html` by block type:** `p`, `tip`, `warn`, `rule`, `fact`, `law` (the whole country table: heading, note with `as_of`, a
  `<div class="table-wrap"><table>…</table></div>`), `figure` (`<img …>` + `<figcaption>` with author and licence) and `sim`
  (the text alternative of the animation, may be empty): one string. `steps`: an array of strings, one per step.
  `compare`: an object `{sporting, compak}`, one string per column (the app writes the column labels itself, both mandatory).
  `evidence` blocks carry `level` and `for` (no `html`); `rule` and `compare` blocks always carry `disc`.
- **URLs** may be absolute (`https://fenix-112323.github.io/clayaway/…`) or relative to the site root; the app builds its own Academy
  links from the ids (`/<p>learn/<id>/`, `topics/<block>/`, `routes/<route>/`, `practice/<game>/`), so `url` fields are for the
  pages and SEO. `alt` may be `{lang: url}` or a list of language codes (a list keeps the catalog near the ~30 KB target).
- Phrases have no `core` flag in the lesson file: the phrasebook shows every phrase of the lessons of the chosen block (from `phrases.json`).
- **Languages inside the animations** (decision 10.2026, `docs/shared/sims.js` header): glossary terms drawn on the canvas (Pick-up point,
  Hold point, Break point, Soft focus, Hard focus) and the coach's phase words above it (“move · mount · shoot”, “butt · belly · beak · bang”)
  stay in English — the stand words the course teaches; every other word (buttons, status line, clock, “line”, “decision”, “shot”, “lead”,
  “front foot”, “body”, “cheek on the comb”, scene and pair tabs) is in the page language (ui keys `anim_*` and the lab keys, 11 languages).
  Flight tabs show the English stand word plus the local term when it differs (“Crosser → · <local>”). Outside the Academy the local term
  names come from `docs/shared/sims-text.js` (`window.CLAYSIMS_TERMS`, written by the build next to `window.CLAYSIMS_TEXT`).
- **Ukrainian:** every uk file and page writes the apostrophe as ’ (U+2019) between Cyrillic letters, whatever the source used.
- **Rules trainer result** (not a build file): the trainer `docs/rules/trainer/` writes `localStorage["clayarena-trainer"].stats[disc]`
  `{best, short_best, short_at, …}`; the app reads it through `docs/shared/progress.js` (`trainerPass`). A route practice item
  `{game: "rules-exam", mode: "short", n: 10, min_pct: 80}` links `/rules/trainer/?lang=<l>&from=learn&mode=short` and is met by the short
  test (10 questions) or the exam (30); XP and the badges "Іспит з правил …" need the exam.

## 9. Content rules (checked by the build where possible)

- **Disciplines (owner decision 08.10.2026, firm):** the whole site is about Parcours de Chasse – Sporting™ and Compak® Sporting **only**. No other clay
  discipline is named or described anywhere, in any language: not in lessons, overlays, quizzes, exam pools, phrases, key points, facts,
  glossary terms, aliases and notes, the rules guide and trainer, interface strings, specs, tour pages, llms.txt or share texts. No
  comparisons with other disciplines, no research examples from them and no “… and other disciplines”. **No shooting federation other
  than FITASC is named** either (owner, again on 08.10.2026): not ISSF, not its old name UIT — e.g. anti-doping says “the WADA list
  prohibits beta-blockers in shooting; it does not name Sporting™ or Compak® Sporting separately, so treat them as prohibited there”
  (WADA stays as the source; sources of other federations are removed whole, a source title is never altered). Chokes are named by constriction (cylinder, 1/8, improved
  cylinder, …), never after another discipline. The English word **trap** (and *trapper*) is the FITASC word for the **throwing machine** and
  its operator (“trap A”, the trapper) and is used only in that meaning; in Ukrainian no word may begin with the Cyrillic spelling of that word (not even the verbs meaning “to happen”; write «буває», «стається»): the machine is
  «машинка», the person «оператор машинки» (also in the glossary `term_local`/`alt`). Checked by the build: error `other-discipline` (§10).
- **Languages:** only en uk de fr it cs pl pt hu fi lt. No other language code anywhere, no Spanish text. Never use the language of
  the restricted country and never name that country or show its flag; its athletes appear only as neutral (AIN).
- **FITASC:** retelling in our own words only, never verbatim text or PDFs; links `rel="nofollow noopener noreferrer"`.
  **⚠ The FITASC rules guide (`/rules/`) and the rules trainer stay `noindex` and out of the sitemap and `llms.txt` until FITASC gives written
  permission (`FITASC_INDEX = false` in `scripts/build_seo.mjs`; the same switch drives `index: "fitasc"` here). Only the project owner turns it on.**
  Academy lessons, including the "Правила" block, are our own teaching texts and are indexed: keep them short and practical; penalty tables only in the guide.
- **Trademarks:** "Parcours de Chasse – Sporting™" / "Sporting™" and "Compak® Sporting" in titles, headings, meta and previews (`{{tm:…}}`).
- **Wording:** plain and cautious (no proven / best / ideal / never outside safety rules): "many coaches suggest", "you can try".
  A professional term plus a short plain explanation. Ukrainian terms: вкладка (gun mount), заєць (rabbit, owner decision 07.10.2026), дуплет, точка пострілу, точка підхоплення,
  точка утримання (hold point), провідне око (master eye), передпостріловий ритуал, стрілецьке місце (у Compak® — номер),
  імітація стрільби (mock shooting), Європейський вогнепальний паспорт, підгонка рушниці, наважка (load weight, as in the official
  rules translation), шушотаж (chuchotage). Ukrainian apostrophe: ’ (U+2019) everywhere (the build writes it so in every uk output).
- **Psychology and health:** an evidence badge for every claim, "не є медичною порадою" at the end, `review_by` for anti-doping;
  the research comes from lab tasks and other sports, not from Sporting™ or Compak®, so write "probably transfers". Cite general-sport
  studies; a study done only on shooters of other disciplines is not cited (owner decision 08.10.2026, see "Disciplines" below).
  Lessons of "Психологія", anti-doping and "Правила" carry "Перевіряється" until a specialist (sport psychologist, doctor, certified referee) has checked them.
- **People:** no real people in lessons (fictional names or none); no living people quoted as authorities.
- **ClayAway:** not launched — future tense ("готується"), no commission mechanics; `travel-clayaway-tour` is `preview` (noindex) until launch.
- **Sources:** only where the text has numbers, laws or research; source and licence always. Media only from ClayArena.

## 10. Build checks (design §6.6) — `scripts/build_academy.mjs`

Run: `bun scripts/build_academy.mjs --check` (checks only) · `--out <dir> --draft` (preview with the draft lessons, never into docs/) ·
`--report <file.json>` (every finding) · `-h`/`--help` (the flags; an unknown option is an error and builds nothing). The real build runs from `bun scripts/build_seo.mjs`. Each finding has a type (shown in brackets);
the console prints the counts per type: errors that block, errors of draft lessons (not built, do not block) and warnings.

Errors: a lesson not in exactly one section (`lesson-sections`); unknown id in a route (`route-unknown-id`); id equal to a reserved
word (`id-reserved`); id removed without an `id-map.json` entry (`id-removed`, `id-map-target`); unknown `sim` type or a key/preset that
`docs/shared/sims.js` does not read (`sim-unknown`, S-09); dead token link (`token-dead`); term not in the glossary (`term-unknown`);
`new_terms` left (`new-terms-left`); a `draft` block left (`draft-block`); a shown quiz with other than 3 questions (`quiz-count`), an
answer by position (`quiz-answer-position`) or repeated options (`quiz-options-repeat`); `rule`/`compare` without discipline
(`rule-no-disc`) or with a ref into the other book (`rule-ref-book`, `rule-ref-unknown`); forbidden letters or words of the language
rule (`lang-letters`, `lang-words`); language codes outside the 11 (`lang-code`); the restricted country or flag (`lang-country`);
Spanish text (`lang-spanish`; the `law`/`article` citations of `laws/*.json` are skipped); 10+ words in a row equal to the cached
FITASC text in `rules/pdf/*.txt` (`fitasc-verbatim`; skipped with a warning when the local cache is missing); missing ™/® in title,
h1, og or description (`trademark`); hreflang to a missing version (`hreflang-dead`); the same title on two pages of one language
(`title-duplicate`); a redirect stub in the sitemap (`stub-in-sitemap`). Also: the old link of a merged lesson must land on an
`anchor` of the target (`dead-anchor`); `travel-clayaway-tour` must be `index: "preview"` (`clayaway-index`); media only from
ClayArena with author and licence (`figure-media`); the name of another clay discipline (`other-discipline`, §9: skeet, olymp… / olimp… / олімп…,
down-the-line, double trap, Doppeltrap, universal trench, trench, ball-trap, fosse/fossa olimpica/universale, Lithuanian
"skitas", DTL and ABT in capitals, Ukrainian words starting with «трап» and «скіт»/«скит»; also ISSF / ІССФ / ИССФ and UIT in capitals) in the visible text of masters (en, uk),
the 9 overlays, facts and their translations, `_shared.json`, `ui/*.json`, blocks/routes/practice/levels/badges and every glossary
entry (`glossary.js`, `learn_terms.js`, `i18n/<lang>.js`, `i18n/ui-<lang>.json`); ids, token ids, URLs, `src`, `sources` and
aliases are not checked. The plain English "trap"/"trapper" (the machine and its operator) is allowed. Patterns:
`OTHER_DISCIPLINE_RE` in `scripts/academy/lint.mjs`.

Warnings: stop words in all 11 languages (`stop-word`: proven, best, ideal, never, every, most coaches, «перевірений», «найкращий»,
«ідеальний», …; "never" is fine in `warn` blocks and the safety block; the check reads our own wording only: tokens with their ids and
forms (`{{term:best-score|Best score}}`), short quoted labels ("Best score", «Найкращий результат», “…”, „…“) and glossary names of
that language (term, aka; term_local, alt; uk also the «…» of `uk_usage`) are left out); a sentence longer than 30 words in a master (`long-sentence`);
numbers or dates without `sources` or `rule_refs` (`numbers-no-sources`); `term-local-missing` — kept quiet on purpose: only for a term
the lesson links with a `{{term:…}}` token, only in a language whose glossary has a `term_local` (conf not low), only for an item whose
English links the term with a token, and only when the translation has neither a token for that term, nor the English term, nor a form of
`term_local`/`alt` (one warning per term, language and lesson); `uk-apostrophe` (once: how many ' or ʼ between Cyrillic letters the
sources still have; the output writes ’); the correct answer too often in one position or
clearly longer (`quiz-answer-position`, `quiz-answer-length`); a lesson longer than 8 minutes (`lesson-too-long`); names of real people
from the research or the tour mock-ups (`living-people`); stale or orphan overlay keys (`overlay-stale`, `overlay-orphan`, `uk-stale`);
an expired `review_by` (`review-expired`); lesson animation captions that a language shows as the generic caption because the overlay
entry is missing or was translated from an older English text (`sim-caption`, one warning per language with the lesson ids; captions are
not `core`, so they never hold a page back — translate them in the next wave); interface strings shown in English (`ui-fallback`); no `_shared.json` for a language with
lessons (`shared-missing`); missing summary (`summary-missing`); psychology/health lesson without evidence badges (`evidence-missing`).

Redirect stubs (design §5.2): groups A–D (and H, retired lessons, §2a) are written only when the target page exists in **the same language** (else the old page stays
and the pair is listed as `pending` in `docs/learn/data/redirects.json`). E (`/interpreter/` app) and F (`/learn/#…`) are JavaScript
routers of the app, fed by `docs/learn/data/id-map.json` (with `published` per language). Stubs have canonical + OG and no noindex.
