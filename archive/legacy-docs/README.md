# archive/legacy-docs/ — frozen old sources (NOT published)

Moved here from `docs/` on **08.10.2026**, byte for byte (`git mv`, history kept). Nothing in this folder is part of the site:
GitHub Pages publishes only `docs/`, and no page, script or data file of the site loads these files (checked before the move:
no `<script src>`, `fetch` or import in `docs/` points here; the `/interpreter/` redirector and `docs/404.html` read
`docs/learn/data/id-map.json`, which the Academy build writes).

Why they were moved: owner decision 08.10.2026 — the whole site is about **Parcours de Chasse – Sporting™ and Compak® Sporting only**;
no other clay discipline and no other shooting federation may appear anywhere, in any language. These frozen files still named
them and were reachable by their direct URL. The live content was already migrated to `content/academy/` (the only source of the
ClayArena Academy, see `content/academy/SCHEMA.md`); these files are kept only as the record of that migration.

| Folder | Was | What it was |
|---|---|---|
| `learn/data/*.js`, `laws-*.json`, `laws-*.js`, `law-tables.js`, `SCHEMA.md` | `docs/learn/data/` | the old ClayArena Academy (beginners): 22 modules, 123 lessons (uk + en), country law tables |
| `interpreter/src/**` | `docs/interpreter/src/` | the old Interpreter Academy sources: 12 missions, 63 lessons, translations in 9 languages, UI strings |
| `interpreter/data/*` | `docs/interpreter/data/` | the generated data of the old Interpreter Academy app (`<lang>.js`, `terms.js`, `urls.json`) |

**Do not edit and do not copy text from here into the site.** Edit lessons only in `content/academy/`, glossary terms only in
`docs/glossary/data/`.

What still reads these files (none of it writes into `docs/`):

- `scripts/check_academy_migration.mjs` — the one-time check that the 10.2026 migration kept every old text byte-identical
  (historical: it reports the edits made since then as differences).
- `scripts/migrate_academy.mjs` — the one-time migration itself (never run again; its record texts keep the 10.2026 paths).
- `scripts/build_seo.mjs` — the "transition safety net" (`LEGACY_LEARN`): a glossary term that only the old lessons used keeps its
  published page until it is moved into `docs/glossary/data/learn_terms.js`. Delete that block together with this folder.
- Retired, refuse to run without `--legacy`: `scripts/build_interpreter.py`, `scripts/build_interpreter_pages.py`; retired
  `scripts/build_laws.py` (regenerates `laws-*.js` here only).

Old URLs: `/interpreter/data/*` and `/interpreter/src/**` were never indexed and now answer 404 (redirect group G in
`content/academy/id-map.json`: "removed at the switch"; done early, 08.10.2026). `/learn/data/<module>.js` were app data, never pages.
The old Interpreter Academy pages `/interpreter/<lang>/<id>/` stay as redirect stubs written by `scripts/build_academy.mjs`.

At the switch-over release (group G) this folder can be deleted together with the scripts above.
