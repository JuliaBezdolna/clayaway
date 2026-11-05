/* ClayArena project bar — ONE navigation for all projects in this repo. Include on every page:
     <script src="<relative path>/shared/nav.js" defer></script>
   (scripts/build_seo.mjs adds it to every generated page; docs/404.html loads it by an absolute path.)

   STRUCTURE (owner decision 07.10.2026)
   - ONE ClayArena logo, in this bar: it opens the projects home — / (Ukrainian) or /en/ (every other visitor language).
     Page headers show the SECTION name instead of a second logo («📘 Правила FITASC», «📖 Глосарій», «🎓 Академія ClayArena»,
     «✈️ Тури ClayAway»).
   - FOUR sections, in this order: Академія · Правила FITASC · Глосарій · Тури ClayAway. On the projects home nothing is highlighted.
     The rules trainer is NOT a bar item: it lives in the Academy Practice («Тренажер правил») and as a button in the rules guide;
     on /rules/trainer/ the bar highlights «Академія» (the trainer page shows «Академія › Практика › Тренажер правил»).
     The old Interpreter Academy (/interpreter/) is the Academy's "Interpreter" route and belongs to the Academy section;
     /rules-spec/ belongs to the rules; /concept/, /dornsberg/, /sologne/ belong to the tours (ClayAway home: /tours/).
   - Wide screens (≥ 760 px): a row of items; each item shows its short description in a tooltip on hover AND on keyboard focus
     (role="tooltip" + aria-describedby; Esc hides it). Narrow screens (< 760 px): one button «☰ ClayArena · <current section>»
     that opens a list of the sections with their descriptions visible. Touch targets are at least 44 px high.
   - Skip link «Перейти до змісту» as the very first element of <body> (target: <main>, else #app).
   - NO LAYOUT SHIFT (Core Web Vitals CLS, 05.11.2026; Lighthouse had 0.16–0.34 on every page because this deferred script pushed
     the page down after the first paint): the builds (scripts/build_seo.mjs) put an empty <div class="ca-slot"> first in <body> with
     its height in the page CSS (48 px; 60 px under 760 px or on touch screens), and the bar is drawn INTO it. The banners (visitor
     language, hints, "where was I") float at the bottom of the screen (.ca-float, position: fixed) instead of pushing the page; an
     equally tall spacer at the end of <body> keeps the last lines of the page reachable. A page without the slot gets the bar at
     the top as before.
   - ALL names and descriptions of the sections live in NAMES below (11 ClayArena languages, never others): pages ask
     ClayNav.name(id) / ClayNav.link(id) instead of keeping their own copies (one naming table for the whole site).

   VISITOR LANGUAGE (one per browser): localStorage "clayarena-lang" = JSON string, one of the 11 ClayArena languages.
     Written by every language switcher (Academy, glossary, rules guide, trainer, home: links with data-setlang="<l>" or
     ClayNav.setLang(l)), by ?lang=<l> in any address, and, on the first visit, by the language of an Academy or glossary page
     (those sections exist in every language; not when the browser asks for another ClayArena language). The bar uses the visitor language for its texts and links; the page language
     (<html lang>) is only the fallback. Every link into the rules guide and the trainer carries ?lang=<visitor language>
     (the guide shows uk or en and keeps the visitor language). A section that does not exist in the visitor language gets an
     "EN" / "UK" mark in the menu (the language it opens in), and on arrival a one-line banner (dismissible) says so, or links the
     same page in the visitor language when the page lists it in <link rel="alternate" hreflang>. Academy pages show their own banner.
     Production (clayarena.com): the language of the signed-in profile / the site language cookie.

   API for pages (window.ClayNav):
     setResume({section, label, url}) / clearResume(section)   "where was I" (see below)
     link(id, lang?) → {url, name, full, lang}   the bar's link of a section ("learn", "rules", "glossary", "tours") or of
                                                 "trainer", "practice", "home"; lang = the language the link really opens
     name(id, lang?) → short name · full(id, lang?) → full name (e.g. "Академія ClayArena") · desc(id, lang?) → description
     lang() → visitor language · setLang(l) → store it, redraw · langName(l) → native name ("Українська") · LANGS
     section() → {id, sub} of this page ({id: "learn", sub: "trainer"} on the trainer; id null on the home and 404)
   Document events: "claynav:update" after every redraw ({lang, page, learn}), "claynav:lang" when the visitor language changes.
   In production this becomes the section menu of clayarena.com (same items, same order, same texts). */
(function () {
  const me = document.currentScript || [...document.scripts].find(s => /shared\/nav\.js/.test(s.src));
  const ROOT = me ? me.src.replace(/shared\/nav\.js.*$/, "") : "/";
  /* Anonymous visit statistics of this site: docs/shared/stats.js (no cookies, no IP; it does nothing while its STATS_ENDPOINT
     is empty). Loaded from here because this bar is on every page. Collector and private dashboard: tools/stats/ (not published).
     In production clayarena.com uses its own analytics instead (DEVELOPERS.md §4h). */
  if (me && !window.ClayStats) { try { const sj = document.createElement("script"); sj.src = ROOT + "shared/stats.js"; sj.async = true; document.head.appendChild(sj); } catch (e) {} }
  if (window.ClayNav && window.ClayNav.ready) return; // loaded twice (e.g. 404 page): keep the first bar
  const LANGS = ["en", "uk", "de", "fr", "it", "cs", "pl", "pt", "hu", "fi", "lt"]; // ClayArena site languages only
  const NATIVE = {en: "English", uk: "Українська", de: "Deutsch", fr: "Français", it: "Italiano", cs: "Čeština", pl: "Polski", pt: "Português", hu: "Magyar", fi: "Suomi", lt: "Lietuvių"};
  const ls = {get: k => { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }};
  const pageLang = () => { const l = (document.documentElement.lang || "en").slice(0, 2).toLowerCase(); return LANGS.includes(l) ? l : "en"; };
  let PL = pageLang();

  /* ---- Names of the sections: the ONE naming table of the site. n = short name (bar, buttons, crumbs), full = name in page
     headers, d = short description (tooltip, narrow menu). The route word follows the Academy (ui "route_word"/"routes"). */
  const NAMES = {
    learn: {n: {en: "Academy", uk: "Академія", de: "Akademie", fr: "Académie", it: "Accademia", cs: "Akademie", pl: "Akademia", pt: "Academia", hu: "Akadémia", fi: "Akatemia", lt: "Akademija"},
      full: {en: "ClayArena Academy", uk: "Академія ClayArena", de: "ClayArena Akademie", fr: "Académie ClayArena", it: "Accademia ClayArena", cs: "Akademie ClayArena", pl: "Akademia ClayArena", pt: "Academia ClayArena", hu: "ClayArena Akadémia", fi: "ClayArena Akatemia", lt: "ClayArena akademija"},
      d: {en: "Lessons, routes for who you are, practice (with the rules trainer) and certificates", uk: "Уроки, маршрути «для кого», практика (з тренажером правил) і сертифікати", de: "Lektionen, Lernpfade für Ihre Rolle, Übung (mit dem Regeltrainer) und Zertifikate", fr: "Leçons, parcours selon votre profil, pratique (avec l'entraîneur des règles) et certificats", it: "Lezioni, percorsi per chi sei, pratica (con l'allenatore delle regole) e certificati", cs: "Lekce, trasy podle toho, kdo jste, procvičování (s trenažérem pravidel) a certifikáty", pl: "Lekcje, trasy dla Ciebie, ćwiczenia (z trenerem przepisów) i certyfikaty", pt: "Lições, percursos para o seu perfil, prática (com o Treinador de regras) e certificados", hu: "Leckék, útvonalak az Ön szerepéhez, gyakorlás (a szabálytrénerrel) és tanúsítványok", fi: "Oppitunnit, reitit sinulle, harjoittelu (sääntövalmentajan kanssa) ja todistukset", lt: "Pamokos, maršrutai pagal tai, kas esate, praktika (su taisyklių treniruokliu) ir sertifikatai"}},
    rules: {n: {en: "FITASC rules", uk: "Правила FITASC", de: "FITASC-Regeln", fr: "Règles FITASC", it: "Regole FITASC", cs: "Pravidla FITASC", pl: "Przepisy FITASC", pt: "Regras FITASC", hu: "FITASC-szabályok", fi: "FITASC-säännöt", lt: "FITASC taisyklės"},
      d: {en: "Parcours de Chasse – Sporting™ and Compak® Sporting rules in plain words, with search and links to the official pages", uk: "Правила Parcours de Chasse – Sporting™ і Compak® Sporting простими словами, з пошуком і посиланнями на офіційні сторінки", de: "Regeln für Parcours de Chasse – Sporting™ und Compak® Sporting in einfachen Worten, mit Suche und Links zu den offiziellen Seiten", fr: "Les règles du Parcours de Chasse – Sporting™ et du Compak® Sporting en mots simples, avec recherche et liens vers les pages officielles", it: "Le regole di Parcours de Chasse – Sporting™ e Compak® Sporting in parole semplici, con ricerca e link alle pagine ufficiali", cs: "Pravidla Parcours de Chasse – Sporting™ a Compak® Sporting jednoduše, s vyhledáváním a odkazy na oficiální stránky", pl: "Przepisy Parcours de Chasse – Sporting™ i Compak® Sporting prostymi słowami, z wyszukiwarką i linkami do oficjalnych stron", pt: "As regras do Parcours de Chasse – Sporting™ e do Compak® Sporting em palavras simples, com pesquisa e ligações às páginas oficiais", hu: "A Parcours de Chasse – Sporting™ és a Compak® Sporting szabályai egyszerűen, kereséssel és a hivatalos oldalakra mutató hivatkozásokkal", fi: "Parcours de Chasse – Sporting™- ja Compak® Sporting -säännöt selkokielellä, haulla ja linkeillä virallisille sivuille", lt: "Parcours de Chasse – Sporting™ ir Compak® Sporting taisyklės paprastai, su paieška ir nuorodomis į oficialius puslapius"}},
    glossary: {n: {en: "Glossary", uk: "Глосарій", de: "Glossar", fr: "Glossaire", it: "Glossario", cs: "Slovník", pl: "Słownik", pt: "Glossário", hu: "Szójegyzék", fi: "Sanasto", lt: "Žodynas"},
      d: {en: "Clay shooting terms with plain explanations and how shooters say them in each ClayArena language", uk: "Терміни стендової стрільби з поясненнями і тим, як їх кажуть стрільці кожною мовою ClayArena", de: "Begriffe des Wurfscheibenschießens, einfach erklärt, und wie Schützen sie in jeder ClayArena-Sprache sagen", fr: "Les termes du tir aux plateaux expliqués simplement, et comment les tireurs les disent dans chaque langue de ClayArena", it: "I termini del tiro a volo spiegati in modo semplice e come li dicono i tiratori in ogni lingua di ClayArena", cs: "Pojmy brokové střelby jednoduše vysvětlené a jak je střelci říkají v každém jazyce ClayArena", pl: "Pojęcia strzelectwa do rzutków prosto wyjaśnione i jak mówią je strzelcy w każdym języku ClayArena", pt: "Termos do tiro aos pratos explicados de forma simples e como os atiradores os dizem em cada língua da ClayArena", hu: "A korongvadászat kifejezései egyszerűen magyarázva, és hogyan mondják a lövészek a ClayArena minden nyelvén", fi: "Haulikkoammunnan termit selkokielellä ja miten ampujat sanovat ne kullakin ClayArenan kielellä", lt: "Lėkštelių šaudymo terminai paprastai ir kaip juos sako šauliai kiekviena ClayArena kalba"}},
    tours: {n: {en: "ClayAway tours", uk: "Тури ClayAway", de: "ClayAway Reisen", fr: "Séjours ClayAway", it: "Viaggi ClayAway", cs: "Zájezdy ClayAway", pl: "Wyjazdy ClayAway", pt: "Viagens ClayAway", hu: "ClayAway utak", fi: "ClayAway-matkat", lt: "ClayAway kelionės"},
      d: {en: "ClayAway: clay shooting trips with top coaches — the project, its spec and tour examples", uk: "ClayAway: тури зі стендової стрільби з тренерами — проєкт, ТЗ і приклади турів", de: "ClayAway: Wurfscheiben-Reisen mit Top-Trainern — das Projekt, die Spezifikation und Beispielreisen", fr: "ClayAway : séjours de tir aux plateaux avec de grands entraîneurs — le projet, le cahier des charges et des exemples", it: "ClayAway: viaggi di tiro a volo con grandi allenatori — il progetto, le specifiche ed esempi", cs: "ClayAway: střelecké zájezdy se špičkovými trenéry — projekt, zadání a ukázky", pl: "ClayAway: wyjazdy strzeleckie z czołowymi trenerami — projekt, specyfikacja i przykłady", pt: "ClayAway: viagens de tiro com grandes treinadores — o projeto, a especificação e exemplos", hu: "ClayAway: lövészutak csúcsedzőkkel — a projekt, a specifikáció és példák", fi: "ClayAway: ammuntamatkat huippuvalmentajien kanssa — projekti, määrittely ja esimerkit", lt: "ClayAway: šaudymo kelionės su aukščiausio lygio treneriais — projektas, specifikacija ir pavyzdžiai"}},
    // not bar items, but named here too (one table): the trainer (Academy Practice), the Practice page, the projects home
    trainer: {n: {en: "Rules trainer", uk: "Тренажер правил", de: "Regeltrainer", fr: "Entraîneur des règles", it: "Allenatore delle regole", cs: "Trenažér pravidel", pl: "Trener przepisów", pt: "Treinador de regras", hu: "Szabálytréner", fi: "Sääntövalmentaja", lt: "Taisyklių treniruoklis"},
      d: {en: "Test yourself: real situations on the stand, the referee's decision and why", uk: "Перевірте себе: реальні ситуації на стенді, рішення судді і чому саме так", de: "Testen Sie sich: echte Situationen am Stand, die Entscheidung des Schiedsrichters und warum", fr: "Testez-vous : situations réelles au poste, la décision de l'arbitre et pourquoi", it: "Mettiti alla prova: situazioni reali in pedana, la decisione dell'arbitro e il perché", cs: "Otestujte se: skutečné situace na stanovišti, rozhodnutí rozhodčího a proč", pl: "Sprawdź się: prawdziwe sytuacje na stanowisku, decyzja sędziego i dlaczego", pt: "Teste-se: situações reais no posto, a decisão do árbitro e porquê", hu: "Tesztelje magát: valós helyzetek a lőálláson, a bíró döntése és miért", fi: "Testaa itsesi: todellisia tilanteita paikalla, tuomarin ratkaisu ja miksi", lt: "Pasitikrinkite: tikros situacijos aikštelėje, teisėjo sprendimas ir kodėl"}},
    practice: {n: {en: "Practice", uk: "Практика", de: "Übung", fr: "Pratique", it: "Pratica", cs: "Procvičování", pl: "Ćwiczenia", pt: "Prática", hu: "Gyakorlás", fi: "Harjoittelu", lt: "Praktika"}},
    home: {n: {en: "ClayArena", uk: "ClayArena", de: "ClayArena", fr: "ClayArena", it: "ClayArena", cs: "ClayArena", pl: "ClayArena", pt: "ClayArena", hu: "ClayArena", fi: "ClayArena", lt: "ClayArena"},
      full: {en: "ClayArena projects", uk: "Проєкти ClayArena", de: "ClayArena-Projekte", fr: "Projets ClayArena", it: "Progetti ClayArena", cs: "Projekty ClayArena", pl: "Projekty ClayArena", pt: "Projetos ClayArena", hu: "ClayArena projektek", fi: "ClayArena-projektit", lt: "ClayArena projektai"}},
  };
  const BAR = ["learn", "rules", "glossary", "tours"]; // order of the bar (owner decision)
  // Section identity: each section has its own colour and icon, so a visitor sees at once that they changed section.
  const LOOK = {learn: ["#34D399", "🎓"], rules: ["#22D3EE", "📘"], glossary: ["#A78BFA", "📖"], tours: ["#F472B6", "✈️"], trainer: ["#FBBF24", "🎯"], home: ["#34D399", ""]};
  // "where was I" entries written before the merge used the section "interpreter": it is the Academy now
  const secOf = s => s === "interpreter" ? "learn" : s;
  // Short texts of the bar itself (all ClayArena languages).
  const TX = {
    back: {en: "Back to", uk: "Повернутися:", de: "Zurück zu", fr: "Revenir à", it: "Torna a", cs: "Zpět na", pl: "Wróć do", pt: "Voltar a", hu: "Vissza ide:", fi: "Takaisin:", lt: "Grįžti į"},
    close: {en: "Close", uk: "Закрити", de: "Schließen", fr: "Fermer", it: "Chiudi", cs: "Zavřít", pl: "Zamknij", pt: "Fechar", hu: "Bezárás", fi: "Sulje", lt: "Uždaryti"},
    skip: {en: "Skip to content", uk: "Перейти до змісту", de: "Zum Inhalt springen", fr: "Aller au contenu", it: "Vai al contenuto", cs: "Přejít na obsah", pl: "Przejdź do treści", pt: "Saltar para o conteúdo", hu: "Ugrás a tartalomra", fi: "Siirry sisältöön", lt: "Peršokti į turinį"},
    mistakes: {en: "Mistakes to repeat in the rules trainer ({d}): {n}", uk: "Помилок для повторення в тренажері правил ({d}): {n}", de: "Fehler zum Wiederholen im Regeltrainer ({d}): {n}", fr: "Erreurs à revoir dans l'entraîneur des règles ({d}) : {n}", it: "Errori da ripassare nell'allenatore delle regole ({d}): {n}", cs: "Chyby k zopakování v trenažéru pravidel ({d}): {n}", pl: "Błędy do powtórki w trenerze przepisów ({d}): {n}", pt: "Erros para rever no Treinador de regras ({d}): {n}", hu: "Átismétlendő hibák a szabálytrénerben ({d}): {n}", fi: "Kerrattavat virheet sääntövalmentajassa ({d}): {n}", lt: "Klaidos pakartojimui taisyklių treniruoklyje ({d}): {n}"},
    route: {en: "Continue the Academy route “{r}”: {d} of {t} lessons done", uk: "Продовжте маршрут «{r}» в Академії: пройдено {d} з {t} уроків", de: "Weiter mit dem Lernpfad „{r}“ der Akademie: {d} von {t} Lektionen", fr: "Continuez le parcours « {r} » de l'Académie : {d} leçons sur {t}", it: "Continua il percorso “{r}” dell'Accademia: {d} lezioni su {t}", cs: "Pokračujte v trase „{r}“ v Akademii: hotovo {d} z {t} lekcí", pl: "Kontynuuj trasę „{r}” w Akademii: ukończono {d} z {t} lekcji", pt: "Continue o percurso «{r}» da Academia: {d} de {t} lições", hu: "Folytassa az Akadémia „{r}” útvonalát: {d}/{t} lecke kész", fi: "Jatka Akatemian reittiä ”{r}”: {d}/{t} oppituntia tehty", lt: "Tęskite Akademijos maršrutą „{r}“: atlikta {d} iš {t} pamokų"},
    route_any: {en: "Continue your Academy route: {d} of {t} lessons done", uk: "Продовжте свій маршрут в Академії: пройдено {d} з {t} уроків", de: "Weiter mit Ihrem Lernpfad in der Akademie: {d} von {t} Lektionen", fr: "Continuez votre parcours de l'Académie : {d} leçons sur {t}", it: "Continua il tuo percorso dell'Accademia: {d} lezioni su {t}", cs: "Pokračujte ve své trase v Akademii: hotovo {d} z {t} lekcí", pl: "Kontynuuj swoją trasę w Akademii: ukończono {d} z {t} lekcji", pt: "Continue o seu percurso da Academia: {d} de {t} lições", hu: "Folytassa az Akadémián az útvonalát: {d}/{t} lecke kész", fi: "Jatka reittiäsi Akatemiassa: {d}/{t} oppituntia tehty", lt: "Tęskite savo maršrutą Akademijoje: atlikta {d} iš {t} pamokų"},
    interp_moved: {en: "The Interpreter Academy is now the “Interpreter” route of the ClayArena Academy; your progress moves with you", uk: "Академія перекладача тепер — маршрут «Перекладач» в Академії ClayArena; ваш прогрес переходить разом із вами", de: "Die Dolmetscher-Akademie ist jetzt der Lernpfad „Dolmetscher“ der ClayArena Akademie; Ihr Fortschritt kommt mit", fr: "L'Académie des interprètes est désormais le parcours « Interprète » de l'Académie ClayArena ; votre progression vous suit", it: "L'Accademia per interpreti ora è il percorso “Interprete” dell'Accademia ClayArena; i tuoi progressi ti seguono", cs: "Akademie tlumočníka je teď trasa „Tlumočník“ v Akademii ClayArena; váš pokrok se přenese", pl: "Akademia tłumacza jest teraz trasą „Tłumacz” w Akademii ClayArena; twój postęp przechodzi razem z tobą", pt: "A Academia de Intérpretes é agora o percurso «Intérprete» da Academia ClayArena; o seu progresso acompanha-o", hu: "A Tolmácsakadémia mostantól a ClayArena Akadémia „Tolmács” útvonala; a haladása átkerül", fi: "Tulkkiakatemia on nyt ClayArena Akatemian ”Tulkki”-reitti; edistymisesi siirtyy mukana", lt: "Vertėjo akademija dabar yra ClayArena akademijos maršrutas „Vertėjas“; jūsų pažanga persikelia kartu"},
    tip_glossary: {en: "Tip: press 🔊 to hear the English term; target flights and pairs are shown as animations.", uk: "Підказка: натисніть 🔊, щоб почути термін англійською; траєкторії й дуплети показано анімацією.", de: "Tipp: 🔊 spielt den englischen Begriff ab; Flugbahnen und Doubletten sind animiert.", fr: "Astuce : 🔊 fait entendre le terme anglais ; les trajectoires et doublés sont animés.", it: "Suggerimento: 🔊 fa sentire il termine inglese; traiettorie e doppietti sono animati.", cs: "Tip: 🔊 přehraje anglický výraz; dráhy terčů a dvojstřely jsou animované.", pl: "Wskazówka: 🔊 odtwarza angielski termin; tory i dublety są pokazane w animacji.", pt: "Dica: 🔊 faz ouvir o termo inglês; trajetórias e duplas aparecem em animação.", hu: "Tipp: a 🔊 lejátssza az angol kifejezést; a röppályák és duplák animációban láthatók.", fi: "Vinkki: 🔊 toistaa englanninkielisen termin; lentoradat ja parit näkyvät animaatioina.", lt: "Patarimas: 🔊 paleidžia angliško termino tarimą; trajektorijos ir dubletai rodomi animacija."},
    tip_trainer: {en: "Tip: choose a level and a mode; after each answer you see why, with a link to the rule.", uk: "Підказка: оберіть рівень і режим; після кожної відповіді — пояснення з посиланням на правило.", de: "Tipp: Niveau und Modus wählen; nach jeder Antwort folgt die Begründung mit Link zur Regel.", fr: "Astuce : choisissez un niveau et un mode ; après chaque réponse, l'explication et le lien vers la règle.", it: "Suggerimento: scegli livello e modalità; dopo ogni risposta trovi la spiegazione e il link alla regola.", cs: "Tip: zvolte úroveň a režim; po každé odpovědi uvidíte vysvětlení s odkazem na pravidlo.", pl: "Wskazówka: wybierz poziom i tryb; po każdej odpowiedzi zobaczysz wyjaśnienie z linkiem do przepisu.", pt: "Dica: escolha o nível e o modo; depois de cada resposta vê a explicação com ligação à regra.", hu: "Tipp: válasszon szintet és módot; minden válasz után jön a magyarázat a szabály hivatkozásával.", fi: "Vinkki: valitse taso ja tila; jokaisen vastauksen jälkeen näet perustelun ja linkin sääntöön.", lt: "Patarimas: pasirinkite lygį ir režimą; po kiekvieno atsakymo – paaiškinimas su nuoroda į taisyklę."},
    tip_rules: {en: "Tip: search in your own words — “double”, “gun malfunction”, “late shooter”.", uk: "Підказка: шукайте своїми словами — «дуплет», «несправність рушниці», «запізнення».", de: "Tipp: Suchen Sie mit eigenen Worten — „Doublette“, „Waffenstörung“, „Verspätung“.", fr: "Astuce : cherchez avec vos mots — « doublé », « incident d'arme », « retard ».", it: "Suggerimento: cerca con parole tue — “doppietto”, “inceppamento”, “ritardo”.", cs: "Tip: hledejte vlastními slovy — „dvojstřel“, „závada zbraně“, „zpoždění“.", pl: "Wskazówka: szukaj własnymi słowami — „dublet”, „zacięcie broni”, „spóźnienie”.", pt: "Dica: pesquise com as suas palavras — “dupla”, “avaria da arma”, “atraso”.", hu: "Tipp: keressen saját szavaival — „dupla”, „fegyverhiba”, „késés”.", fi: "Vinkki: hae omin sanoin — ”pari”, ”asehäiriö”, ”myöhästyminen”.", lt: "Patarimas: ieškokite savais žodžiais — „dubletas“, „ginklo gedimas“, „vėlavimas“."},
    tip_learn: {en: "Tip: choose the route that fits who you are; your progress is saved on this device.", uk: "Підказка: оберіть маршрут під себе; прогрес зберігається на цьому пристрої.", de: "Tipp: Wählen Sie den Lernpfad, der zu Ihnen passt; der Fortschritt wird auf diesem Gerät gespeichert.", fr: "Astuce : choisissez le parcours qui vous correspond ; la progression est enregistrée sur cet appareil.", it: "Suggerimento: scegli il percorso adatto a te; i progressi restano su questo dispositivo.", cs: "Tip: vyberte si trasu, která vám sedí; pokrok se ukládá v tomto zařízení.", pl: "Wskazówka: wybierz trasę dla siebie; postęp zapisuje się na tym urządzeniu.", pt: "Dica: escolha o percurso que lhe convém; o progresso fica guardado neste dispositivo.", hu: "Tipp: válassza ki az önnek való útvonalat; a haladás ezen az eszközön mentődik.", fi: "Vinkki: valitse itsellesi sopiva reitti; edistyminen tallentuu tälle laitteelle.", lt: "Patarimas: pasirinkite jums tinkantį maršrutą; pažanga išsaugoma šiame įrenginyje."},
    // banner on arrival when this page does not exist in the visitor language ({l} = native name of the language shown)
    only: {en: "This page is not available in English yet. Shown in: {l}.", uk: "Цієї сторінки ще немає українською. Показано мовою: {l}.", de: "Diese Seite gibt es noch nicht auf Deutsch. Angezeigt wird: {l}.", fr: "Cette page n'existe pas encore en français. Langue affichée : {l}.", it: "Questa pagina non è ancora disponibile in italiano. Lingua mostrata: {l}.", cs: "Tato stránka zatím není v češtině. Zobrazený jazyk: {l}.", pl: "Ta strona nie jest jeszcze dostępna po polsku. Wyświetlany język: {l}.", pt: "Esta página ainda não existe em português. Língua apresentada: {l}.", hu: "Ez az oldal még nem érhető el magyarul. Megjelenítés nyelve: {l}.", fi: "Tätä sivua ei vielä ole suomeksi. Näytetään kielellä: {l}.", lt: "Šio puslapio dar nėra lietuvių kalba. Rodoma kalba: {l}."},
    also: {en: "This page is also in English", uk: "Ця сторінка є й українською", de: "Diese Seite gibt es auch auf Deutsch", fr: "Cette page existe aussi en français", it: "Questa pagina è disponibile anche in italiano", cs: "Tato stránka je i v češtině", pl: "Ta strona jest też po polsku", pt: "Esta página também existe em português", hu: "Ez az oldal magyarul is elérhető", fi: "Tämä sivu on myös suomeksi", lt: "Šis puslapis yra ir lietuvių kalba"},
  };
  const pickL = (o, l) => o ? (o[l] || o.en) : "";
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]));

  /* ---- This page: section (and sub-page), from the path relative to the site root. */
  const here = location.href.replace(ROOT, "").replace(/[?#].*$/, "");
  // docs/404.html (<html data-claynav="404">) is served AT the missing address: it belongs to no section, whatever the address says
  const SEC = document.documentElement.getAttribute("data-claynav") === "404" ? {id: null, nf: true}
    : /^(index\.html)?$/.test(here) || /^en\/(index\.html)?$/.test(here) ? {id: null, home: true}
    : /^rules\/trainer\//.test(here) ? {id: "learn", sub: "trainer"}
    : /^(rules|rules-spec)\//.test(here) ? {id: "rules"}
    : /^([a-z]{2}\/)?glossary\//.test(here) ? {id: "glossary"}
    : /^([a-z]{2}\/)?learn\//.test(here) || /^interpreter\//.test(here) ? {id: "learn"}
    : /^(tours|concept|dornsberg|sologne)\//.test(here) ? {id: "tours"} : {id: null};
  const pageKey = SEC.sub || SEC.id || (SEC.home ? "home" : "other"); // what "this place" is for the hints
  /* The Academy mascot (docs/shared/mascot.js → window.ClayMascot; DEVELOPERS.md §4j) is loaded from HERE, like stats.js, and only
     where the dog may appear: Academy pages (not the rules trainer), glossary pages (animations of docs/shared/sims.js may draw it)
     and the 404 page. Never on the rules guide, the rules spec and the rules trainer (owner 08.10.2026: they stay serious), so there
     window.ClayMascot is absent and sims.js draws no dog. A page can also opt out: <html data-mascot="off">. To show the dog in
     another section, add it to the condition below (one place). Production: the same rule in the page templates of clayarena.com. */
  if (me && !window.ClayMascot && (SEC.nf || SEC.id === "glossary" || (SEC.id === "learn" && !SEC.sub)) && document.documentElement.getAttribute("data-mascot") !== "off") {
    try { const mj = document.createElement("script"); mj.src = ROOT + "shared/mascot.js"; mj.async = true; document.head.appendChild(mj); } catch (e) {}
  }

  /* ---- Visitor language (see the header). */
  const VKEY = "clayarena-lang";
  let stored = ls.get(VKEY); if (!LANGS.includes(stored)) stored = null;
  try { const q = new URLSearchParams(location.search).get("lang"); if (LANGS.includes(q)) { stored = q; ls.set(VKEY, q); } } catch (e) {}
  // First visit of an Academy or glossary page (they exist in every language): its language becomes the visitor language, unless the
  // browser asks for another ClayArena language (then the Academy's own banner offers that one, and nothing is stored yet).
  const NAVL = (navigator.language || "").slice(0, 2).toLowerCase();
  if (!stored && (SEC.id === "glossary" || SEC.id === "learn" && !SEC.sub) && (NAVL === PL || !LANGS.includes(NAVL))) { stored = PL; ls.set(VKEY, PL); }
  let VL = stored || PL;
  const pick = o => pickL(o, VL);

  /* Academy languages: the Academy is published language by language (translation waves). scripts/build_academy.mjs writes the
     list to learn/data/languages.json ({published: ["uk", "en", …], fallback: "en"}); all 11 are published now, so the bar assumes
     a language is published until that file (fetched once per browser session for languages other than uk/en, sessionStorage
     "clayarena-learn-langs") says otherwise; then the bar is redrawn. In production the menu comes from the server. */
  const LKEY = "clayarena-learn-langs";
  let LEARN = null, learnAsked = false;
  try { const c = JSON.parse(sessionStorage.getItem(LKEY) || "null"); if (c && Array.isArray(c.published)) LEARN = c; } catch (e) {}
  function askLearn() {
    if (LEARN || learnAsked || typeof fetch !== "function") return; learnAsked = true;
    fetch(ROOT + "learn/data/languages.json", {cache: "no-cache"}).then(r => (r.ok ? r.json() : null)).then(j => {
      if (!j || !Array.isArray(j.published)) return;
      LEARN = {published: j.published.filter(x => typeof x === "string"), fallback: typeof j.fallback === "string" ? j.fallback : "en"};
      try { sessionStorage.setItem(LKEY, JSON.stringify(LEARN)); } catch (e) {}
      draw();
    }).catch(() => {});
  }
  const learnLang = l => {
    if (!LEARN) { if (l !== "uk" && l !== "en") askLearn(); return l; }
    const p = LEARN.published; return p.includes(l) ? l : p.includes(LEARN.fallback) ? LEARN.fallback : p.includes("en") ? "en" : "uk";
  };
  /* The language a section really opens in for the visitor language l: Academy (published list), rules guide and home (uk | en),
     ClayAway tours home (uk), glossary and trainer (all 11). */
  const openLang = (id, l) => id === "learn" || id === "practice" ? learnLang(l) : id === "rules" || id === "home" ? (l === "uk" ? "uk" : "en")
    : id === "tours" ? "uk" : l;
  const pre = l => (l === "uk" ? "" : l + "/");
  /* Links in a visitor language l. The rules guide and the trainer get ?lang=<l> (the guide shows uk or en and keeps l);
     the trainer opened from an Academy page also gets &from=learn (its "← Академія" way back). */
  const hrefFor = (id, l) => { const o = openLang(id, l);
    return id === "home" ? ROOT + (o === "uk" ? "" : "en/")
      : id === "learn" ? `${ROOT}${pre(o)}learn/` : id === "practice" ? `${ROOT}${pre(o)}learn/practice/`
      : id === "glossary" ? `${ROOT}${pre(o)}glossary/`
      : id === "rules" ? `${ROOT}rules/?lang=${l}`
      : id === "trainer" ? `${ROOT}rules/trainer/?lang=${l}${SEC.id === "learn" && !SEC.sub ? "&from=learn" : ""}`
      : id === "tours" ? `${ROOT}tours/` : ROOT; };
  const [color] = LOOK[SEC.id] || LOOK.home;
  const css = `.ca-skip{position:absolute;left:8px;top:-60px;z-index:100;background:#000;color:#fff;padding:10px 14px;border-radius:8px;font:600 14px/1.2 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;text-decoration:none;outline:2px solid ${color}}
.ca-skip:focus{top:8px}
.ca-bar{background:#000;border-bottom:1px solid rgba(255,255,255,.1);border-top:3px solid ${color};font:13px/1.2 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;position:relative;z-index:30}
.ca-bar nav{max-width:1100px;margin:0 auto;padding:6px 12px;display:flex;gap:4px;align-items:center;flex-wrap:wrap}
.ca-bar ul{list-style:none;margin:0;padding:0}
.ca-list{display:flex;gap:4px;align-items:center;flex-wrap:wrap}
.ca-w{position:relative}
.ca-bar a{color:#D1D5DB;text-decoration:none;border-radius:999px;white-space:nowrap;border:1px solid transparent;display:inline-flex;align-items:center;gap:5px;min-height:32px;padding:4px 11px;box-sizing:border-box}
.ca-bar a:hover{color:#fff;border-color:rgba(255,255,255,.35)}
.ca-bar a:focus-visible,.ca-bar button:focus-visible,.ca-hint a:focus-visible,.ca-hint button:focus-visible{outline:2px solid ${color};outline-offset:2px;color:#fff}
.ca-bar a[aria-current]{background:${color}26;color:${color};font-weight:700;border-color:${color}80}
.ca-bar .ca-home{font-weight:800;margin-right:6px;background:linear-gradient(90deg,#34D399,#22D3EE);-webkit-background-clip:text;background-clip:text;color:transparent}
.ca-bar .ca-home[aria-current]{background:linear-gradient(90deg,#34D399,#22D3EE);-webkit-background-clip:text;background-clip:text;color:transparent;border-color:rgba(52,211,153,.5)}
.ca-menu a[aria-current] b{color:#34D399}
.ca-mk{font-size:10.5px;font-weight:700;letter-spacing:.04em;padding:1px 5px;border-radius:5px;border:1px solid rgba(255,255,255,.3);color:#E5E7EB}
.ca-tip{display:none;position:absolute;left:0;top:100%;margin-top:8px;z-index:40;width:max-content;max-width:300px;white-space:normal;background:#0B1120;color:#E5E7EB;border:1px solid ${color}80;border-radius:10px;padding:8px 11px;font-size:12.5px;line-height:1.4;box-shadow:0 10px 30px rgba(0,0,0,.5)}
.ca-tip::before{content:"";position:absolute;left:0;right:0;top:-10px;height:10px}
.ca-w:last-child .ca-tip,.ca-w:nth-last-child(2) .ca-tip{left:auto;right:0}
.ca-w:hover .ca-tip,.ca-w:focus-within .ca-tip{display:block}
.ca-bar.ca-esc .ca-tip{display:none!important}
.ca-sr{position:absolute!important;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.ca-mbtn{display:none;align-items:center;gap:8px;min-height:44px;padding:6px 14px;border-radius:12px;border:1px solid rgba(255,255,255,.2);background:#0B1120;color:#F3F4F6;font:600 15px/1.2 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;cursor:pointer}
.ca-mbtn b{background:linear-gradient(90deg,#34D399,#22D3EE);-webkit-background-clip:text;background-clip:text;color:transparent;font-weight:800}
.ca-mbtn .ca-cs{color:${color}}
.ca-menu{display:none;width:100%;padding:6px 0 8px}
.ca-menu.on{display:block}
.ca-menu a{display:flex;flex-wrap:wrap;gap:2px 8px;align-items:center;min-height:48px;width:100%;white-space:normal;border-radius:12px;padding:8px 12px;font-size:15px;color:#F3F4F6}
.ca-menu a small{flex-basis:100%;font-size:12.5px;line-height:1.35;color:#9CA3AF;font-weight:400}
.ca-menu li+li{margin-top:2px}
@media (max-width:759.98px){.ca-list,.ca-bar .ca-home{display:none}.ca-mbtn{display:inline-flex}}
@media (min-width:760px){.ca-menu,.ca-menu.on{display:none}}
main[tabindex="-1"]:focus{outline:none}
@media (pointer:coarse){.ca-bar a{min-height:44px}}
.ca-hint,.ca-lang{background:#0B1120;border-bottom:1px solid rgba(255,255,255,.08);font:13.5px/1.4 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#D1D5DB}
.ca-hint>div,.ca-lang>div{max-width:1100px;margin:0 auto;padding:7px 12px;display:flex;gap:10px;align-items:center}
.ca-tx{flex:1;min-width:0;display:flex;flex-wrap:wrap;gap:4px 8px;align-items:center}
.ca-hint a,.ca-lang a{color:#fff;font-weight:600;text-decoration:none;border:1px solid rgba(255,255,255,.2);border-radius:999px;padding:3px 10px;min-height:32px;display:inline-flex;align-items:center}
.ca-hint a:hover,.ca-lang a:hover{border-color:${color}}
.ca-hint button,.ca-lang button{margin-left:auto;background:none;border:0;color:#9CA3AF;font:inherit;cursor:pointer;min-width:36px;min-height:36px;border-radius:8px}
@media (pointer:coarse){.ca-hint button,.ca-lang button,.ca-hint a,.ca-lang a{min-height:44px;min-width:44px}}
.ca-dot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px;vertical-align:middle}
.ca-float{position:fixed;left:0;right:0;bottom:0;z-index:35;padding-bottom:env(safe-area-inset-bottom,0px);background:#0B1120;box-shadow:0 -10px 28px rgba(0,0,0,.5)}
.ca-float:empty{display:none}.ca-float .ca-hint,.ca-float .ca-lang{border-bottom:0;border-top:1px solid rgba(255,255,255,.14)}
@media print{.ca-float,.ca-float-sp,.ca-slot{display:none!important}}`;
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
  const bar = document.createElement("div"); bar.className = "ca-bar";
  const hint = document.createElement("div"); hint.className = "ca-hint"; hint.setAttribute("role", "status");
  const lang = document.createElement("div"); lang.className = "ca-lang"; lang.setAttribute("role", "note");
  // the banners float at the bottom (no layout shift); the spacer at the end of <body> is as tall as they are
  const float = document.createElement("div"); float.className = "ca-float";
  const spacer = document.createElement("div"); spacer.className = "ca-float-sp"; spacer.setAttribute("aria-hidden", "true");
  const fit = () => { spacer.style.height = float.offsetHeight ? float.offsetHeight + "px" : "0"; };

  /* "Where was I?" — apps call ClayNav.setResume({section, label, url}) while a task is in progress (trainer run, open lesson,
     Academy game round) and ClayNav.clearResume(section) when it is finished. In another section (or on another page type: the
     trainer is "trainer", the Academy "learn") the bar offers the way back for 7 days. Closing that hint hides the way back to this
     section for 7 days, even if the app updates the place in the meantime (each new lesson calls setResume again). */
  const RKEY = "clayarena-resume", DAY = 864e5;
  const recent = (ts, days) => ts && Date.now() - ts < days * DAY;
  const link = (id, l) => { const N = NAMES[id]; if (!N) return null; l = LANGS.includes(l) ? l : VL;
    return {url: hrefFor(id, l), name: pickL(N.n, l), full: pickL(N.full || N.n, l), lang: openLang(id, l)}; };
  function setLang(l) { if (!LANGS.includes(l)) return; const ch = l !== VL; stored = VL = l; ls.set(VKEY, l); draw();
    if (ch) try { document.dispatchEvent(new CustomEvent("claynav:lang", {detail: {lang: l}})); } catch (e) {} }
  window.ClayNav = {
    ready: true,
    setResume: r => ls.set(RKEY, Object.assign({ts: Date.now(), lang: PL}, r)), // lang = language of the label (the page)
    clearResume: section => { const r = ls.get(RKEY); if (r && (!section || r.section === section)) try { localStorage.removeItem(RKEY); } catch (e) {} },
    /* link("learn", "de") → {url, name, full, lang}: the bar's own link of a section in a language (lang = the language the link
       really opens). Used by the trainer ("← Академія", crumbs), the rules guide, the Academy Practice, the 404 page and the homes.
       Pages that render such links listen to the "claynav:update" event (fired after every redraw of the bar) and ask again. */
    link,
    name: (id, l) => { const x = link(id, l); return x ? x.name : ""; },
    full: (id, l) => { const x = link(id, l); return x ? x.full : ""; },
    desc: (id, l) => pickL((NAMES[id] || {}).d, LANGS.includes(l) ? l : VL),
    icon: id => (LOOK[id] || [])[1] || "",
    lang: () => VL, setLang, langName: l => NATIVE[l] || l, LANGS: LANGS.slice(),
    section: () => ({id: SEC.id, sub: SEC.sub || null}),
  };
  // Every language switcher of the site marks its links with data-setlang="<l>": the choice becomes the visitor language.
  document.addEventListener("click", e => { const a = e.target.closest && e.target.closest("[data-setlang]"); if (a) setLang(a.getAttribute("data-setlang")); }, true);

  /* Personal hints (one at a time; dismissed hints are remembered on this device). Order: way back > own mistakes (per discipline,
     opens the trainer in mistakes mode) > unfinished route > old Interpreter Academy progress > first-visit tip of this section.
     Reads only this browser's own progress (never sent anywhere). Labels and URLs come from storage: escaped, http(s)/relative only. */
  const safeUrl = u => /^(https?:\/\/|\.{0,2}\/|[?#])/i.test(String(u || "")) ? String(u) : "#";
  const DISC = {sporting: "Sporting™", compak: "Compak® Sporting"};
  function hintHTML(){
    const seen = ls.get("clayarena-hints") || {};
    const r = ls.get(RKEY), rs = r && secOf(r.section), closed = r && (seen["resume:" + rs] || seen["resume:" + r.section]);
    if (r && rs !== pageKey && recent(r.ts, 7) && !recent(closed, 7)) {
      const nm = r.lang && r.lang !== VL && NAMES[rs] ? pick(NAMES[rs].full || NAMES[rs].n) : r.label;
      return ["resume:" + rs, `<span class="ca-dot" style="background:${LOOK[rs] ? LOOK[rs][0] : color}"></span>↩ ${esc(pick(TX.back))} <a href="${esc(safeUrl(r.url))}">${LOOK[rs] ? `<span aria-hidden="true">${LOOK[rs][1]}</span>&nbsp;` : ""}${esc(nm)}</a>`, Date.now()];
    }
    // rules trainer mistakes, per discipline: key "clayarena-trainer" (older builds: "clayaway-trainer")
    const tr = ls.get("clayarena-trainer") || ls.get("clayaway-trainer");
    const top = tr && tr.stats ? Object.keys(DISC).map(d => [d, (((tr.stats[d] || {}).wrong) || []).length]).sort((a, b) => b[1] - a[1])[0] : null;
    if (top && top[1] >= 3 && pageKey !== "trainer" && !recent(seen["mistakes:" + top[0]], 7))
      return ["mistakes:" + top[0], `<span aria-hidden="true">${LOOK.trainer[1]}</span> <a href="${esc(hrefFor("trainer", VL).replace(/(\?[^#]*)/, "$1&mode=mistakes") + "#" + top[0])}">${esc(pick(TX.mistakes).replace("{n}", top[1]).replace("{d}", DISC[top[0]]))}</a>`, Date.now()];
    // Academy route in progress: docs/shared/progress.js keeps a summary in "clayarena-academy".nav = {route, title, lang, d, t, url}
    // (written by docs/learn/app/academy.js; null when there is no current route or its lessons are all done)
    const ac = ls.get("clayarena-academy"), nv = ac && ac.nav, learnUrl = hrefFor("learn", VL);
    if (nv && nv.t > 0 && nv.d < nv.t && SEC.id !== "learn" && !seen["route:" + nv.route + ":" + nv.d])
      return ["route:" + nv.route + ":" + nv.d, `<span aria-hidden="true">${LOOK.learn[1]}</span> <a href="${esc(safeUrl(nv.url || learnUrl))}">${esc((nv.lang === VL && nv.title ? pick(TX.route).replace("{r}", nv.title) : pick(TX.route_any)).replace("{d}", nv.d).replace("{t}", nv.t))}</a>`];
    // progress of the old Interpreter Academy that the Academy has not moved yet (it moves on the first Academy visit)
    const ia = ls.get("clayarena-interpreter"), iaDone = ia && ia.done ? Object.keys(ia.done).length : 0;
    if (iaDone > 0 && !(ac && ac.migrated && ac.migrated["clayarena-interpreter"]) && SEC.id !== "learn" && !seen["interp-moved"])
      return ["interp-moved", `<span aria-hidden="true">${LOOK.learn[1]}</span> <a href="${esc(learnUrl)}routes/interpreter/">${esc(pick(TX.interp_moved))}</a>`];
    const tip = TX["tip_" + pageKey];
    if (tip && !seen["tip:" + pageKey]) return ["tip:" + pageKey, `<span aria-hidden="true">${(LOOK[pageKey] || [])[1] || ""}</span> ${esc(pick(tip))}`];
    return null;
  }
  /* Language banner (see the header): only when the page language differs from the visitor language. The Academy app shows its own. */
  function langHTML() {
    if (PL === VL || SEC.id === "learn" && !SEC.sub || !SEC.id && !SEC.home) return null;
    const key = "lang:" + pageKey + ":" + VL, seen = ls.get("clayarena-hints") || {}; if (recent(seen[key], 30)) return null;
    const alt = l => { const a = document.querySelector(`link[rel="alternate"][hreflang="${l}"]`); return a && a.href; };
    if (alt(VL)) return [key, `🌐 <a href="${esc(alt(VL))}" hreflang="${VL}" lang="${VL}" data-setlang="${VL}">${esc(pick(TX.also))} →</a>`];
    const en = PL !== "en" && alt("en");
    return [key, `🌐 <span>${esc(pick(TX.only).replace("{l}", NATIVE[PL]))}</span>${en ? ` <a href="${esc(en)}" hreflang="en" lang="en">English →</a>` : ""}`];
  }
  const isNarrow = () => { try { return matchMedia("(max-width: 759.98px)").matches; } catch (e) { return false; } };
  function focusBar() { const el = isNarrow() ? bar.querySelector(".ca-mbtn") : bar.querySelector(".ca-list a[aria-current]") || bar.querySelector(".ca-home"); if (el) el.focus({preventScroll: true}); } // the banner was at the bottom: no jump to the top
  function dismiss(el, key) { const s = ls.get("clayarena-hints") || {}; s[key] = Date.now(); ls.set("clayarena-hints", s); el.remove(); draw(); focusBar(); } // next hint, focus back to the bar
  const cleanUrl = u => String(u).replace(/[?#].*$/, "").replace(/index\.html$/, "");
  function itemHTML(id, mobile) {
    const N = NAMES[id], url = hrefFor(id, VL), o = openLang(id, VL), cur = SEC.id === id;
    const ac = cur ? (cleanUrl(url) === cleanUrl(location.href) && !SEC.sub ? ' aria-current="page"' : ' aria-current="true"') : "";
    const mk = o !== VL ? ` <span class="ca-mk"><span aria-hidden="true">${o.toUpperCase()}</span><span class="ca-sr">(${NATIVE[o]})</span></span>` : "";
    const hl = o !== VL ? ` hreflang="${o}"` : "";
    if (mobile) return `<li><a href="${esc(url)}"${hl}${ac}><span aria-hidden="true">${LOOK[id][1]}</span> ${esc(pick(N.n))}${mk}<small>${esc(pick(N.d))}</small></a></li>`;
    return `<li class="ca-w"><a class="ca-it" href="${esc(url)}"${hl}${ac} aria-describedby="ca-d-${id}"><span aria-hidden="true">${LOOK[id][1]}</span> ${esc(pick(N.n))}${mk}</a><span class="ca-tip" role="tooltip" id="ca-d-${id}">${esc(pick(N.d))}</span></li>`;
  }
  let menuOpen = false;
  function draw(){
    // the bar speaks the visitor language, which may differ from the page: lang= lets screen readers pronounce it right
    for (const el of [bar, hint, lang, skip]) el.setAttribute("lang", VL);
    const homeUrl = hrefFor("home", VL), homeCur = SEC.home ? ' aria-current="page"' : "";
    const curName = SEC.id ? `<span class="ca-cs"> · <span aria-hidden="true">${LOOK[SEC.id][1]}</span> ${esc(pick(NAMES[SEC.id].n))}</span>` : "";
    bar.innerHTML = `<nav aria-label="${esc(pick(NAMES.home.full))}"><a class="ca-home" href="${esc(homeUrl)}"${homeCur}>ClayArena</a><ul class="ca-list">${BAR.map(id => itemHTML(id, false)).join("")}</ul>
      <button type="button" class="ca-mbtn" aria-expanded="${menuOpen}" aria-controls="ca-menu"><span aria-hidden="true">☰</span> <b>ClayArena</b>${curName}</button>
      <div class="ca-menu${menuOpen ? " on" : ""}" id="ca-menu"><ul><li><a href="${esc(homeUrl)}"${homeCur}><b>ClayArena</b><small>${esc(pick(NAMES.home.full))}</small></a></li>${BAR.map(id => itemHTML(id, true)).join("")}</ul></div></nav>`;
    const btn = bar.querySelector(".ca-mbtn"), menu = bar.querySelector(".ca-menu");
    const setMenu = (on, focus) => { menuOpen = on; btn.setAttribute("aria-expanded", on); menu.classList.toggle("on", on);
      if (on && focus) { const a = menu.querySelector("a[aria-current]") || menu.querySelector("a"); if (a) a.focus(); } };
    btn.onclick = () => setMenu(!menuOpen, !menuOpen);
    bar.onkeydown = e => { if (e.key !== "Escape") return; if (menuOpen) { setMenu(false); btn.focus(); } else bar.classList.add("ca-esc"); };
    bar.onfocusout = e => { if (!bar.contains(e.relatedTarget)) { bar.classList.remove("ca-esc"); if (menuOpen && e.relatedTarget) setMenu(false); } };
    bar.onmouseleave = () => bar.classList.remove("ca-esc");
    for (const [el, html] of [[lang, langHTML()], [hint, hintHTML()]]) {
      if (!html) { el.remove(); continue; }
      el.innerHTML = `<div><span class="ca-tx">${html[1]}</span><button type="button" aria-label="${esc(pick(TX.close))}" title="${esc(pick(TX.close))}">✕</button></div>`;
      el.querySelector("button").onclick = () => dismiss(el, html[0]);
      if (!el.isConnected) { if (el === lang) float.prepend(el); else float.append(el); }
    }
    fit();
    // Links into the rules guide / trainer written by the static builds carry data-vl: they get the visitor language as ?lang.
    document.querySelectorAll("a[data-vl]").forEach(a => { try { const u = new URL(a.href); u.searchParams.set("lang", VL); a.href = u.href; } catch (e) {} });
    try { document.dispatchEvent(new CustomEvent("claynav:update", {detail: {lang: VL, page: PL, learn: LEARN ? LEARN.published : null}})); } catch (e) {} // see ClayNav.link
  }
  document.addEventListener("click", e => { if (menuOpen && !bar.contains(e.target)) { menuOpen = false; const b = bar.querySelector(".ca-mbtn"), m = bar.querySelector(".ca-menu"); if (b) b.setAttribute("aria-expanded", "false"); if (m) m.classList.remove("on"); } });
  /* Skip link: the very first element of <body>, to <main> (else #app). The Academy no longer adds its own. */
  const skip = document.createElement("a"); skip.className = "ca-skip";
  const target = document.querySelector("main") || document.getElementById("app");
  if (target) { if (!target.id) target.id = "ca-main"; if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1"); skip.href = "#" + target.id; }
  const drawSkip = () => { skip.textContent = pick(TX.skip); };
  document.addEventListener("claynav:update", drawSkip);
  const slot = document.querySelector("body > .ca-slot"); // reserved by the build: the bar is drawn into it, nothing moves
  if (slot) slot.appendChild(bar); else document.body.insertBefore(bar, document.body.firstChild);
  if (target) document.body.insertBefore(skip, document.body.firstChild);
  document.body.appendChild(spacer); document.body.appendChild(float);
  addEventListener("resize", fit, {passive: true});
  draw();
  // apps that switch language without reloading (rules guide, trainer) change <html lang>: follow it (they also call setLang)
  new MutationObserver(() => { const n = pageLang(); if (n !== PL) { PL = n; if (!stored) VL = PL; draw(); } })
    .observe(document.documentElement, {attributes: true, attributeFilter: ["lang"]});
})();
