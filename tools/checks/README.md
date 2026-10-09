# Перевірки проєкту · Project checks (`tools/checks/`)

**Українською** · [English below](#english)

Три автоматичні перевірки, якими до передачі проєкту перевіряли кожну зміну анімацій і уроків (DEVELOPERS.md §4b, §4j, §4l).
Вони нічого не пишуть у `docs/` і нічого не надсилають в інтернет: сайт роздається локально на `127.0.0.1`, статистика там вимкнена.
Кадри й знімки — у `tools/checks/out/` (git її ігнорує).

## Встановити (один раз)

Потрібні Python 3.12 і Bun 1.4 (для збірки сайту; самі перевірки — лише Python).

```bash
python -m pip install -r tools/checks/requirements.txt
python -m playwright install chromium
```

## Команди (з кореня репозиторію)

| Команда | Що перевіряє | Коли запускати | Час* |
|---|---|---|---|
| `python tools/checks/check_safety.py` | Покадрово (кожні 1/60 с) кожна сцена анімацій `docs/shared/sims.js`: ніхто не стоїть перед стрілецьким місцем; лінія стволів не перетинає людей, собаку й будиночок машинки; оператор, суддя, провідник і собака — позаду місця; окуляри й навушники видно на кожній голові; одна рушниця, лише вертикалка, закрита лише на місці; собака збоку, у навушниках, без бульбашки; фізика лабораторії виносу `tf = d / 330 · (1 + 0.0115 · (d − 15))`, `R = 0.25 + 0.005 · d`; кеш спрайтів малює те саме, що й пряме малювання | після **кожної** зміни `docs/shared/sims.js` або `docs/shared/mascot.js` | 1,5–5 хв |
| `python tools/checks/render_frames.py` | Кадри всіх анімацій (сцени, траєкторії, дуплети, лабораторія) на 720 px і на телефоні 343 px — для огляду очима (стиль A «вечірнє поле», безпека, собака) | разом із попередньою; кадри — `tools/checks/out/frames/` | ~1 хв |
| `python tools/checks/check_quiz.py` | Кожен урок кожною опублікованою мовою: відкрити, відповісти на 3 питання (1-ше і 3-тє правильно, 2-ге хибно), натиснута кнопка `aria-pressed`, правильна позначена, пояснення мовою сторінки, рядок результату «2 з 3», кнопка не стрибає більше ніж на 20 px, без помилок у консолі; і що собаки немає на `/rules/`, у тренажері й у ТЗ правил | після збірки Академії (`bun scripts/build_seo.mjs`) | 15–20 хв; швидко: `--langs uk,en --limit 10` |

\* Виміряно 09.10.2026 на ПК власника (Windows 11). Результат — останній рядок `RESULT: OK` і код виходу 0. Інакше — список рядків із «!» і код виходу 1.

Корисні ключі: `--chrome` — встановлений Google Chrome замість Chromium від Playwright (межі P1 у `check_safety.py` виміряно в Chrome 08.10.2026; у Chromium від Playwright перевірка теж проходить);
`check_safety.py --p1` — лише прохід кешу спрайтів; `render_frames.py --only stand|flight|pair|lab`, `--nomascot`, `--rm` (зменшений рух);
`check_quiz.py --phone` — телефон 375 × 812 (і перевірка, що сторінка не прокручується вбік), `--shots` — знімок кожної сторінки з помилкою,
`--lessons id1,id2`, `--workers N`. Усі ключі — `--help` у кожному скрипті.

## Перевірити пробну збірку, а не `docs/`

```bash
bun scripts/build_seo.mjs --out C:/Temp/clay-site          # абсолютний шлях
python tools/checks/check_quiz.py --site C:/Temp/clay-site
```
Пробна збірка містить лише згенеровані файли; застосунок Академії, `shared/nav.js`, `mascot.js` і рукописні сторінки перевірка бере з `docs/`.

## Коли перевірка «червона»

- `check_safety.py`: рядок `! t 1.23: ...` каже, у якій сцені й на якій секунді. Виправляють `docs/shared/sims.js` (числа розстановки — коментар над
  `HANDLER`, правило SAFETY над `SCENES`), а **не** межі перевірки. `E1…E8`, `L1`, `P1` — пояснення на початку скрипта.
- Скрипт міняє лише тестову копію `sims.js` у пам’яті (вимикає кеш спрайтів і додає «гачки»). Якщо змінили підпис функції `person()`,
  `gun()`, `shooter()`, `clay()`, `protection()` чи `sprite()`, перевірка зупиниться з `AssertionError` — тоді оновіть рядки підстановки в `subs`.
- `check_quiz.py`: `jumped +31 px` — щось над тестом змінило висоту після відповіді (див. `onAnswer()` у `docs/learn/app/academy.js`);
  `explanation …` — пояснення не тією мовою або без тексту з даних уроку; `pageerror` / `error:` — помилка JavaScript.

---

<a id="english"></a>
## English

Three automated checks that guarded every change of the animations and lessons before the hand-over (DEVELOPERS.md §4b, §4j, §4l).
They never write into `docs/` and send nothing to the internet (the site is served on `127.0.0.1`, where the statistics tracker is off).
Frames and screenshots go to `tools/checks/out/` (ignored by git).

**Install once:** Python 3.12, then `python -m pip install -r tools/checks/requirements.txt` and `python -m playwright install chromium`.

**Run from the repository root:**
- `python tools/checks/check_safety.py` — per-frame safety of every stand scene and flight in `docs/shared/sims.js` (nobody in front of the stand,
  muzzle lines never cross people, the dog or the trap house; trapper, referee, dog handler and dog behind the stand; eye and ear protection visible on
  every head; one over-and-under gun, closed only on the stand; the dog in side view with earmuffs, no bubble; the lead-lab physics formulas; the sprite
  cache draws exactly what direct drawing draws). Run after **every** change of `sims.js` or `mascot.js`. 1.5–5 min.
- `python tools/checks/render_frames.py` — PNG frames of every animation at 720 px and on a 343 px phone for a visual review. ~1 min.
- `python tools/checks/check_quiz.py` — every lesson in every published language: answers the 3 questions, checks the pressed option, the right/wrong
  marks, the explanation, the score line, no jump > 20 px, no console errors; and that the dog is absent from `/rules/`, the trainer and the rules
  spec. Run after an Academy build. 15–20 min; quick: `--langs uk,en --limit 10`; a test build: `--site <folder>`.

Each prints `RESULT: OK` and exits with 0, or lists the failures (lines with `!`) and exits with 1. `--help` lists the options of each script.
Fix the site, not the limits of the checks.
