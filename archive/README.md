# archive/ — не публікується

Тека поза `docs/`: GitHub Pages її не віддає, збірка сайту її не читає (крім «страховки переходу» в `scripts/build_seo.mjs`,
яка читає `legacy-docs/learn/data/*.js`, і історичних `scripts/migrate_academy.mjs`, `check_academy_migration.mjs`, `build_laws.py`).

| Що | Звідки | Навіщо зберігаємо |
|---|---|---|
| `legacy-docs/` | заморожені джерела двох старих академій, перенесені з `docs/` 08.10.2026 (опис — `legacy-docs/README.md`) | історія міграції в `content/academy/`; не редагувати |
| `glossary-sources-removed.json` | адреси-джерела місцевих слів глосарію, прибрані з опублікованих файлів 08.10.2026, бо їхній шлях називав інші дисципліни | походження слів для редакторів; на сайт не повертати |

Нові джерела місцевих слів (з 09.10.2026) лежать не тут, а в `content/glossary/sources/<мова>.json` (DEVELOPERS.md §4k).

---

# archive/ — not published

Outside `docs/`: GitHub Pages does not serve it. `legacy-docs/` holds the frozen sources of the two old academies (moved out of `docs/` on
08.10.2026, see its README); `glossary-sources-removed.json` holds glossary source addresses removed from the site because their path
named other disciplines. Current provenance of glossary words: `content/glossary/sources/<lang>.json`.
