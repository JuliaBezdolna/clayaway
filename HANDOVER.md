# Передача проєкту команді ClayArena

Стан на 09.10.2026 (Europe/Bratislava). Це **проєкт** нового напряму ClayArena: робоча специфікація + працюючі макети, зібрані як
статичний сайт на GitHub Pages (https://fenix-112323.github.io/clayaway/). Програмісти переносять його в ClayArena (backend, БД, адмінка,
авторизація, платежі). Путівник для програмістів — [DEVELOPERS.md](DEVELOPERS.md); правила власника — [CLAUDE.md](CLAUDE.md).

Хто вирішує: **В** — власник проєкту; **Ф** — фахівець (суддя FITASC, лікар, спортивний психолог); **Р** — редактор-носій мови; **П** — програмісти.

---

## 1. Перше, що зробити

1. Встановити інструменти (DEVELOPERS.md §2): Bun 1.4.2, Python 3.12, `python -m pip install -r requirements.txt` (Pillow),
   для перевірок — `python -m pip install -r tools/checks/requirements.txt` і `python -m playwright install chromium`;
   на Linux / macOS — змінна `OG_FONTS` з текою шрифтів Segoe UI. Необов’язково: Poppler (`pdftotext`) і
   `python scripts/fitasc_check.py --fetch` — локальний текст регламентів FITASC для перевірки «10 слів поспіль» (не в git).
2. **Повна пересборка** — зміни 09.10.2026 внесено в джерела (`content/academy/`, глосарій, дані правил, скрипти); якщо після них сайт
   ще не перезібрано, згенеровані сторінки в `docs/` відстають:
   ```bash
   bun scripts/build_academy.mjs --check                                   # 0 помилок, нічого не пише
   bun scripts/build_seo.mjs && python scripts/make_og.py && python scripts/seo_meta.py
   ```
   ```powershell
   # Windows PowerShell 5.1
   bun scripts/build_seo.mjs; if ($?) { python scripts/make_og.py }; if ($?) { python scripts/seo_meta.py }
   ```
3. Перевірки (усі нічого не пишуть у `docs/`; останній рядок — `RESULT: OK` / `0 errors`):
   `bun scripts/check_rules_data.mjs` · `python tools/checks/check_safety.py` · `python tools/checks/render_frames.py` (кадри для огляду очима) ·
   `python tools/checks/check_quiz.py` (15–20 хв; швидко `--langs uk,en --limit 10`) · `bun tools/stats/checks/check_tracker.mjs` і `check_collector.mjs`.
   Ті самі перевірки запускає `.github/workflows/checks.yml` на кожен pull request.

## 2. Де що лежить

| Що | Де |
|---|---|
| Сайт (GitHub Pages, `main /docs`) | `docs/` — частину сторінок пише збірка, рукописні: головні `index.html`, `en/`, `tours/`, ТЗ `concept/`, `rules-spec/`, приклади турів `dornsberg/`, `sologne/`, `404.html`, довідник `rules/index.html`, тренажер `rules/trainer/`, головна Академії `learn/index.html` |
| ТЗ турів ClayAway | `docs/concept/index.html` (головне), коротко — `CONCEPT.md` |
| ТЗ правил, тренажера, глосарію, Академії, SEO, легальності | `docs/rules-spec/index.html` |
| Академія ClayArena — єдине джерело | `content/academy/` (140 уроків en + uk, оверлеї 9 мов, блоки, маршрути, Практика; формат — `content/academy/SCHEMA.md`) |
| Дані правил FITASC і тренажера | `docs/rules/data/` (формат — `rules/SCHEMA.md`, `rules/QUIZ_SCHEMA.md`; версії PDF — `rules/sources.json`; PDF — локально в `rules/pdf/`, не в git) |
| Глосарій 11 мовами | `docs/glossary/data/` (`glossary.js`, `learn_terms.js`, `aliases.json`, `i18n/<мова>.js`); звідки місцеві слова — `content/glossary/sources/` (не публікується) |
| Спільні модулі | `docs/shared/`: `nav.js` (панель, назви розділів 11 мовами), `sims.js` (анімації; сторінки вантажать `sims.min.js`), `terms.js` (підписи термінів), `mascot.js`, `progress.js`, `stats.js` |
| Збірка | `scripts/build_seo.mjs` (сайт) → `check_rules_data.mjs`, `build_academy.mjs`; `make_og.py` (прев’ю), `seo_meta.py` (canonical, JSON-LD) |
| Перевірки | `tools/checks/` (README uk + en), `tools/stats/checks/`, `bun scripts/build_academy.mjs --check`, `bun scripts/check_rules_data.mjs` |
| Статистика відвідувань | `docs/shared/stats.js` (трекер, **увімкнено з 07.10.2026**), `tools/stats/` (збирач і приватна панель, не публікується) |
| Архів (не публікується) | `archive/` (README), `design/mascot/` (ескіз маскота) |

Що пише кожен скрипт, пробні збірки в окрему теку, новий клон, перенесення адреси сайту на clayarena.com — DEVELOPERS.md §2.

## 3. Що зроблено під час підготовки передачі (09.10.2026)

- **Перевірки в репозиторії:** `tools/checks/` — покадрова безпека анімацій (`check_safety.py`, з новою перевіркою фізики лабораторії L1),
  кадри для огляду (`render_frames.py`, з правильною формулою часу польоту), тест уроків у браузері (`check_quiz.py`); `requirements.txt`,
  `.gitattributes` (LF), `.github/workflows/checks.yml`; `scripts/check_rules_data.mjs` — перевірка даних правил і тренажера (викликає й `build_seo.mjs`).
- **Виправлення збірки:** відносний `--out` більше не падає; `make_og.py` зупиняється без шрифтів (змінна `OG_FONTS`); `seo_meta.py --docs`;
  заглушки злитих і знятих термінів глосарію пишуться й у чистій збірці (`GLOSSARY_STUBS`); `CLAY_BUILD_DATE` для відтворюваної збірки;
  `fitasc_check.py --fetch`; перевірка трекера статистики більше не «червона» через живу адресу збирача.
- **Виправлення сайту:** тест уроку не стрибає на 31 px після 3-ї відповіді; рядки таблиці категорій FITASC мають якорі (`#junior`, `#lady`…),
  на які посилаються 44 сторінки уроків; довідник правил не прокручується вбік на 375 px; приклади турів мають `<noscript>` з рядком про марки FITASC;
  `lang="uk"` для прихованої назви мови на англійській головній.
- **Лише Sporting™ і Compak® Sporting, жодної федерації, крім FITASC:** знято урок «Британські й американські слова проти FITASC» (адреси ведуть на
  «Хибні друзі на стрільбищі», куди перенесено фрази тренерів про дуплети з перекладами) і терміни English Sporting, CPSA, NSCA, HOA; прибрано
  ці назви з 7 уроків × 11 мов, глосарію, фактів, джерел, профілів у прикладах турів і таблиці закону Італії; збірка тепер ловить їх сама.
  Виняток `skeet-choke` (рішення 09.10.2026) задокументовано всюди однаково.
- **Терміни англійською:** назви 6 уроків, названих терміном, — «English (місцеве слово): …» у 10 мовах; виправлено конкретні пропуски токенів;
  додано 20 українських місцевих слів (`conf: low`); перекладено підписи 24 анімацій 9 мовами; хибні спрацьовування `term-grammar` прибрано.
- **Документи для команди:** DEVELOPERS.md (§2 збірка й перевірки, §4h стан статистики, §4k, §4l, §5, §6, новий §7 — рішення власника),
  `content/academy/SCHEMA.md`, ТЗ правил, `rules/SCHEMA.md`, `rules/QUIZ_SCHEMA.md`, CLAUDE.md; `CONCEPT.md` і схеми правил винесено з `docs/`
  (GitHub Pages віддавав їх як текст, придатний для індексації); `src` і `note` глосарію — з `docs/` до `content/glossary/sources/`.

## 4. Рішення власника, яких ще немає

| # | Питання | Що зараз | Що вирішити | Хто |
|---|---|---|---|---|
| 4.1 | **Індексація правил FITASC** (`/rules/`, сторінки правил uk/en, категорії, тренажер) | `FITASC_INDEX = false` у `scripts/build_seo.mjs`; рішення 06.10.2026: `noindex`, поза sitemap і `llms.txt`. Причини: построковий переказ регламенту, заборона FITASC на відтворення, товарні знаки | Чи просимо в FITASC **письмовий дозвіл**, хто пише й від чийого імені. Перемикач змінює лише власник і лише після дозволу; за ним ідуть уроки з `index: "fitasc"` і гра «Рішення судді» | В |
| 4.2 | **Ім’я собаки-маскота і перевірка марки** | імені немає (DEVELOPERS §4j). Ідеї: Пул / Pull, Арні, Чок | Вибрати ім’я; перед запуском — пошук у реєстрах марок (EUIPO, WIPO, УКРНОІВІ, країни запуску; класи 9, 28, 41), зворотний пошук зображення, авторські права ClayArena на малюнок | В, юрист |
| 4.3 | **Німецька: англійський іменник у середині речення з великої?** | з малої («ein rabbit (Rollhase)») | Лишити або додати `"de"` у `CAP_NOUN_LANGS` (`docs/shared/terms.js`) і перезібрати | В (+ Р de) |
| 4.4 | **Одне правило щільності термінів для всіх мов** | de, fr, it, pt, cs, pl позначають і щоденні слова й короткі описи; uk, hu, fi, lt — рідко | Пропозиція DEVELOPERS §4l: щоденні терміни лише там, де їх позначає англійський майстер або чипи; короткі описи — без токенів. Потім правка оверлеїв 9 мов | В, Р |
| 4.5 | **Українські слова термінів** | 20 слів додано 09.10.2026 з `conf: low`; без слова — poking, recovery, blazed-target; лише англійською (так кажуть на стенді) — show-clear, true-pair, fur-and-feather, smoked-it, peg, gun-up; teal — «чирок» (`conf: low`) | Підтвердити або замінити в `docs/glossary/data/i18n/uk.js` (підписи оновляться самі) | Р uk, В |
| 4.6 | **Мова `CLAUDE.md`** | файл інструкцій власника написано російською (сайт його не використовує) | Перекласти українською чи англійською перед передачею або не передавати разом із репозиторієм | В |
| 4.7 | **CI на pull request** | `.github/workflows/checks.yml` додано (лише pull request і ручний запуск) | Лишити, перенести в CI ClayArena чи вимкнути | В, П |
| 4.8 | **Зняття «англійського спортингу»** | за правилом «лише Sporting™ і Compak® Sporting, жодної федерації, крім FITASC» урок і чотири терміни знято 09.10.2026 (§3) | Якщо власник хоче явний виняток для контексту перекладача (наприклад, британські правила лише в «Мові стенду»), записати його в DEVELOPERS §4k і SCHEMA §9 й повернути урок з `ids.lock` | В |

## 5. Уроки з позначкою «Перевіряється» — потрібні фахівці (29 уроків)

Урок публікується з позначкою «Перевіряється», доки фахівець його не перевірить. Після перевірки в майстрі уроку: `review.status = "done"`,
`review.editor` — хто перевірив, `status = "ready"`; потім збірка.

| Фахівець | Уроки |
|---|---|
| **Сертифікований суддя FITASC** (8 + 2 частково) | rules-call-and-time, rules-cards-and-appeals, rules-doubles, rules-dress-and-safety, rules-gun-position, rules-hit-and-no-bird, rules-malfunctions, rules-viewing-targets; частина про правила — mind-warm-up-mobility, training-for-competition |
| **Спортивний психолог** (12) | juniors-support-without-pressure, mind-breathing, mind-competition-nerves, mind-concentration-focus, mind-cue-words-self-talk, mind-imagery, mind-pressure-choking, mind-process-goals, mind-reset-after-miss, mind-routine-under-pressure, training-diary-and-progress, training-for-competition |
| **Лікар (спортивна медицина)** (3) | mind-anti-doping, mind-long-day-energy-sleep, travel-jet-lag |
| **Лікар** | health-lead-hygiene |
| **Спортивний лікар або фізіотерапевт** | health-recoil-shoulder-neck, mind-warm-up-mobility (розминка) |
| **Сімейний / спортивний лікар** | gear-clothing-and-shoes (спека, сонце, холод) |
| **ЛОР або аудіолог** | gear-ear-protection |
| **Офтальмолог або оптометрист** | gear-shooting-glasses |

Питання до судді (з поля `todo` уроків):
- **rules-call-and-time**: як зараховують мішень, випущену із запізненням, якщо стрілець вистрілив до «No Bird»? Регламент прямо не каже.
- **rules-cards-and-appeals**: перелік порушень на місці, за які дають червону картку (Sporting 7.5, 12.2, 12.3; Compak 21.1–21.5), і що інші повтори йдуть до журі (Sporting 13.2–13.3, 17.1; Compak 7.2, 21.6, 23).
- **rules-doubles**: «один постріл розбив обидві мішені» (Sporting 6.5.2, 7.9) проти «перша мішень або її уламки розбили другу до другого пострілу» (No Bird, 6.5.2); відмова від дуплета по пострілу з quick guide (5.6, 6.4) — у `sporting.js` такого пункту ще немає.
- **rules-gun-position**: опис лінії плечей і «найвища задня точка приклада» за 3.1.1 для прикладів Monte Carlo і з регульованим гребенем (той самий опис — training-for-competition-p4, watching-what-to-look-at, interpreter-numbers-and-units-p3).
- **rules-malfunctions**: Sporting 6.5.1 («з тих самих причин») проти 6.4 і 7.6 («будь-яка друга несправність»); випадок (2) у sporting-malfunctions-p4.
- **rules-viewing-targets**: підсумок «в лінію» (17.5.1–17.5.3) і формулювання compak-gun-and-call-kp4 (17.4).
- **Сторінка категорій FITASC** (ТЗ правил, «Відкриті питання»): Dame — «À partir du 1er janvier 2007» проти «з 13 років без верхньої межі»; команда Master — «Vétéran ou master». Уточнити у FITASC.

## 6. Перевірка носіями мов

- **Місцеві слова глосарію з низькою довірою** (`conf: low`): найбільше в lt, pl, cs, hu, pt. Редактор міняє `term_local` / `alt` / `conf` у
  `docs/glossary/data/i18n/<мова>.js` і джерело в `content/glossary/sources/<мова>.json`; підписи «English (місцеве слово)» оновляться після збірки.
- **Тексти Академії 9 мовами**, визначення глосарію й банк тренажера ще не вичитував носій: потрібен хоча б вибірковий перегляд кожної мови
  (уроки безпеки, правил і антидопінгу — повністю). Особливо — підписи 24 анімацій і змінені 09.10.2026 абзаци (§3), перекладені без носія.
- **Підказки `term-untokenised`** (568: uk 7 — лише короткі описи, de 44, fr 100, it 120, cs 40, pl 39, pt 128, hu 30, fi 29, lt 31): не помилки,
  а місця, які варто глянути редактору (`bun scripts/build_academy.mjs --check --term-report <тека>` → файл на мову). Частина — хибні збіги.
- **Редакторські задачі в `todo` уроків** — пов’язати вже наявні терміни глосарію в абзацах (англійська зміниться → оновити 9 оверлеїв):
  derogation (competitions-categories-and-shoot-offs), heat-exhaustion (gear-clothing-and-shoes), ladies-cut (gear-shooting-vest),
  lead-hygiene (health-lead-hygiene), gas-operated (health-recoil-shoulder-neck), travel-fatigue (travel-jet-lag), spectator-area
  (watching-at-the-ground), scoreboard (watching-reading-results).
- **Факт без джерела:** `travel.cartridge-box-weight` («близько 1 кг» — оцінка) — додати паспорт виробника або прибрати число.

## 7. Законодавство й регулярні перевірки (календар)

| Коли | Що | Де міняти |
|---|---|---|
| **Після 10.10.2026** | **REACH, свинець у дробі (ЄС):** комітет REACH схвалив ширше обмеження 26.06.2026; строк перевірки Радою й Парламентом — 10.10.2026. Перевірити, чи Комісія ухвалила регламент (EUR-Lex, ECHA), і дати переходу для стрільби по мішенях | cartridges-lead-and-steel-p8, health-lead-hygiene-dyk (+ 9 оверлеїв); `review_by` 2027-04-01 у cartridges-lead-and-steel і culture-environment |
| **Щороку у вересні–жовтні** (список WADA діє з 1 січня) | Список заборонених речовин WADA: бета-блокатори, алкоголь (поза списком з 2018), кофеїн (моніторинг), TUE | mind-anti-doping, mind-long-day-energy-sleep, mind-competition-nerves, `content/academy/facts/mind.json`, глосарій (`beta-blocker`, `anti-doping`); `review_by` 2027-01-01 |
| **Жовтень 2027** | Таблиці законів країн (`content/academy/laws/*.json`, `as_of` 2026-10): збірка попередить `law-old` | ті самі файли |
| **2027-10-01** | `review_by` уроків здоров’я й спорядження: gear-clothing-and-shoes, gear-ear-protection, gear-shooting-glasses, health-lead-hygiene, health-recoil-shoulder-neck, mind-warm-up-mobility, safety-eye-ear-protection, training-diary-and-progress, training-for-competition, travel-jet-lag | майстри уроків |
| **Щотижня (автоматично)** | Нові редакції правил FITASC: `fitasc-check.yml` відкриває задачу → оновити `docs/rules/data/*.js` → `bun scripts/check_rules_data.mjs` → погодити із суддею → `python scripts/fitasc_check.py --accept` | `docs/rules/data/` |
| **Один раз, вручну** | EUR-Lex 2021/555 — чи названо країни Шенгену поза ЄС (competitions-how-to-enter) | майстер уроку |

## 8. Статистика відвідувань

- **Трекер увімкнено з 07.10.2026:** у `docs/shared/stats.js` — адреса збирача власника, кожне відвідування github.io пишеться в його таблицю.
  Під час переїзду на clayarena.com — спорожнити `STATS_ENDPOINT` або замінити аналітикою ClayArena (ті самі назви подій, DEVELOPERS §4h);
  `tools/stats/` не переносити.
- Підтвердити (В): перевірку «go / no-go» (DEVELOPERS §4h, кроки 1–3 і крок 5 `tools/stats/README.md`) виконано; тестові рядки `stats_check` з аркуша
  `hits` видалено. Без цього цифрам панелі довіряти не можна.
- Посилання на панель статистики ніде не публікується (ні в репозиторії, ні в листах команді) — так і лишається.

## 9. Перед публічним запуском (юридичне)

- **Реальні люди в прикладах турів** (Markus Leibinger, Lena Weigele, Charles Bardou, Anna Karpulianskaia): письмова згода кожного на показ імені,
  фото й ролі в макеті. Дати, ціни й повідомлення умовні, сторінки `noindex`, з позначкою «Приклад».
- **Політика конфіденційності, умови й контакти** на clayarena.com (`/<мова>/privacy/`, `/legal/`, `/contacts/` — на них веде рядок у футері кожної
  сторінки), з абзацом про анонімну статистику відвідувань.
- **Медіа** — лише ClayArena (`cdn.clayarena.com`, сховище ClayArena); фото від стендів чи готелів — лише з письмовим дозволом і через сховище ClayArena.
- **Урок ClayAway** (`travel-clayaway-tour`) — `preview` і `noindex`, у майбутньому часі, доки ClayAway не запущено; на запуску переписати.

## 10. Технічний борг для програмістів

- Тестів Bun для `docs/shared/progress.js` і переадресатора `/interpreter/` у репозиторії немає — ручний чек-лист у DEVELOPERS §4e; у продакшені —
  справжні тести.
- Адреса сайту записана в кількох файлах, назва ClayAway — у текстах макетів (DEVELOPERS §2 «Перенесення на clayarena.com»): у продакшені — по одній
  змінній конфігурації.
- `make_og.py` малює шрифтом Segoe UI (є лише у Windows): для однакових картинок на будь-якій ОС можна перейти на відкритий шрифт (наприклад
  Noto Sans, OFL) у `scripts/fonts/` — тоді один раз зміняться всі 256 картинок.
- Кожна сторінка глосарію мовою X вантажить увесь файл `i18n/<X>.js` (200–360 КБ): за потреби — ділити дані за термінами або вантажити після показу.
- Коментарі «design §N» і коди аудиту в коді — робочі нотатки власника, яких у репозиторії немає; правила — у SCHEMA.md і DEVELOPERS.md.

## 11. Що з переліку зауважень свідомо не зроблено

| Зауваження | Чому |
|---|---|
| «Злити термін fur-and-feather у rabbit» | Термін лишився, як true-pair і show-pair: його визначення тепер «сленг британських тренерів», без назви іншої дисципліни; урок flight-rabbit має про нього питання тесту |
| Переклад `CLAUDE.md` | Це інструкції власника; рішення — §4.6 |
| Ділити дані глосарію за термінами | Зауваження саме каже «зараз не потрібно»; записано в §10 |
| Розібрати всі 568 підказок `term-untokenised` до нуля | Це редакторська робота носіїв мов; конкретні пропуски з переліку виправлено, залишок прийнято й записано (DEVELOPERS §4l, §6 тут) |
| Документ дизайну Академії в репозиторій | Оригінал — російською, його мовою проєкт не користується; правила з нього вже в SCHEMA.md і DEVELOPERS.md, посилання пояснено (DEVELOPERS, вступ) |
