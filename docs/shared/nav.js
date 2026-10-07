/* ClayArena project bar — ONE navigation for all projects in this repo (rules guide, rules trainer, glossary,
   Академія ClayArena, ClayAway tours). Include on every page:
     <script src="<relative path>/shared/nav.js" defer></script>
   It finds the site root from its own URL, reads the page language from <html lang>, highlights the current project
   and shows a tooltip (title + aria-description) with what each project is for. Names follow ClayArena wording.
   One "Академія" item (design §7.2): the merged Academy at /learn/ (uk) and /<lang>/learn/ (the other 10 languages) — but only in
   a language the build lists as published (learn/data/languages.json); otherwise it opens /en/learn/ (see learnLang). The old
   Interpreter Academy (/interpreter/) is the Academy's "Interpreter" route now and belongs to the same section.
   API for pages: ClayNav.setResume / clearResume ("where was I"), ClayNav.link(id, lang) (the bar's link of a project) and the
   document event "claynav:update" after every redraw.
   In production this becomes the section menu of clayarena.com (same items, same order, same texts). */
(function () {
  const me = document.currentScript || [...document.scripts].find(s => /shared\/nav\.js/.test(s.src));
  const ROOT = me ? me.src.replace(/shared\/nav\.js.*$/, "") : "/";
  let L = (document.documentElement.lang || "en").slice(0, 2).toLowerCase();
  // [path, short name, tooltip] per language; only ClayArena site languages (en uk de fr it cs pl pt hu fi lt)
  const ITEMS = [
    {id: "rules", path: "rules/", n: {en: "FITASC rules", uk: "Правила FITASC", de: "FITASC-Regeln", fr: "Règles FITASC", it: "Regole FITASC", cs: "Pravidla FITASC", pl: "Przepisy FITASC", pt: "Regras FITASC", hu: "FITASC-szabályok", fi: "FITASC-säännöt", lt: "FITASC taisyklės"},
     d: {en: "Parcours de Chasse – Sporting™ and Compak® Sporting rules in plain words, with search and links to the official pages", uk: "Правила Parcours de Chasse – Sporting™ і Compak® Sporting простими словами, з пошуком і посиланнями на офіційні сторінки", de: "Regeln für Parcours de Chasse – Sporting™ und Compak® Sporting in einfachen Worten, mit Suche und Links zu den offiziellen Seiten", fr: "Les règles du Parcours de Chasse – Sporting™ et du Compak® Sporting en mots simples, avec recherche et liens vers les pages officielles", it: "Le regole di Parcours de Chasse – Sporting™ e Compak® Sporting in parole semplici, con ricerca e link alle pagine ufficiali", cs: "Pravidla Parcours de Chasse – Sporting™ a Compak® Sporting jednoduše, s vyhledáváním a odkazy na oficiální stránky", pl: "Przepisy Parcours de Chasse – Sporting™ i Compak® Sporting prostymi słowami, z wyszukiwarką i linkami do oficjalnych stron", pt: "As regras do Parcours de Chasse – Sporting™ e do Compak® Sporting em palavras simples, com pesquisa e ligações às páginas oficiais", hu: "A Parcours de Chasse – Sporting™ és a Compak® Sporting szabályai egyszerűen, kereséssel és a hivatalos oldalakra mutató hivatkozásokkal", fi: "Parcours de Chasse – Sporting™- ja Compak® Sporting -säännöt selkokielellä, haulla ja linkeillä virallisille sivuille", lt: "Parcours de Chasse – Sporting™ ir Compak® Sporting taisyklės paprastai, su paieška ir nuorodomis į oficialius puslapius"}},
    {id: "trainer", path: "rules/trainer/", n: {en: "Rules trainer", uk: "Тренажер правил", de: "Regeltrainer", fr: "Entraîneur des règles", it: "Allenatore delle regole", cs: "Trenažér pravidel", pl: "Trener przepisów", pt: "Treinador de regras", hu: "Szabálytréner", fi: "Sääntövalmentaja", lt: "Taisyklių treniruoklis"},
     d: {en: "Test yourself: real situations on the stand, the referee's decision and why", uk: "Перевірте себе: реальні ситуації на стенді, рішення судді і чому саме так", de: "Testen Sie sich: echte Situationen am Stand, die Entscheidung des Schiedsrichters und warum", fr: "Testez-vous : situations réelles au poste, la décision de l'arbitre et pourquoi", it: "Mettiti alla prova: situazioni reali in pedana, la decisione dell'arbitro e il perché", cs: "Otestujte se: skutečné situace na stanovišti, rozhodnutí rozhodčího a proč", pl: "Sprawdź się: prawdziwe sytuacje na stanowisku, decyzja sędziego i dlaczego", pt: "Teste-se: situações reais no posto, a decisão do árbitro e porquê", hu: "Tesztelje magát: valós helyzetek a lőálláson, a bíró döntése és miért", fi: "Testaa itsesi: todellisia tilanteita paikalla, tuomarin ratkaisu ja miksi", lt: "Pasitikrinkite: tikros situacijos aikštelėje, teisėjo sprendimas ir kodėl"}},
    {id: "glossary", path: "glossary/", n: {en: "Glossary", uk: "Глосарій", de: "Glossar", fr: "Glossaire", it: "Glossario", cs: "Slovník", pl: "Słownik", pt: "Glossário", hu: "Szójegyzék", fi: "Sanasto", lt: "Žodynas"},
     d: {en: "Clay shooting terms with plain explanations and how shooters say them in each ClayArena language", uk: "Терміни стендової стрільби з поясненнями і тим, як їх кажуть стрільці кожною мовою ClayArena", de: "Begriffe des Wurfscheibenschießens, einfach erklärt, und wie Schützen sie in jeder ClayArena-Sprache sagen", fr: "Les termes du ball-trap expliqués simplement, et comment les tireurs les disent dans chaque langue de ClayArena", it: "I termini del tiro a volo spiegati in modo semplice e come li dicono i tiratori in ogni lingua di ClayArena", cs: "Pojmy brokové střelby jednoduše vysvětlené a jak je střelci říkají v každém jazyce ClayArena", pl: "Pojęcia strzelectwa do rzutków prosto wyjaśnione i jak mówią je strzelcy w każdym języku ClayArena", pt: "Termos do tiro aos pratos explicados de forma simples e como os atiradores os dizem em cada língua da ClayArena", hu: "A korongvadászat kifejezései egyszerűen magyarázva, és hogyan mondják a lövészek a ClayArena minden nyelvén", fi: "Haulikkoammunnan termit selkokielellä ja miten ampujat sanovat ne kullakin ClayArenan kielellä", lt: "Lėkštelių šaudymo terminai paprastai ir kaip juos sako šauliai kiekviena ClayArena kalba"}},
    {id: "learn", path: "learn/", n: {en: "Academy", uk: "Академія", de: "Akademie", fr: "Académie", it: "Accademia", cs: "Akademie", pl: "Akademia", pt: "Academia", hu: "Akadémia", fi: "Akatemia", lt: "Akademija"},
     d: {en: "ClayArena Academy: one place to learn clay shooting — routes for beginners, competitors, interpreters, parents, coaches, organisers and fans; topics, practice games and certificates",
         uk: "Академія ClayArena: усе навчання в одному місці — маршрути для новачків, стрільців, перекладачів, батьків, тренерів, організаторів і вболівальників; теми, практика й сертифікати",
         de: "ClayArena Akademie: alles Lernen an einem Ort — Lernwege für Einsteiger, Wettkampfschützen, Dolmetscher, Eltern, Trainer, Veranstalter und Fans; Themen, Übungsspiele und Zertifikate",
         fr: "Académie ClayArena : tout l'apprentissage au même endroit — parcours pour débutants, compétiteurs, interprètes, parents, entraîneurs, organisateurs et supporters ; thèmes, jeux d'entraînement et certificats",
         it: "Accademia ClayArena: tutto l'apprendimento in un unico posto — percorsi per principianti, tiratori in gara, interpreti, genitori, allenatori, organizzatori e tifosi; temi, giochi di allenamento e certificati",
         cs: "Akademie ClayArena: všechno učení na jednom místě — cesty pro začátečníky, závodníky, tlumočníky, rodiče, trenéry, pořadatele a fanoušky; témata, cvičné hry a certifikáty",
         pl: "Akademia ClayArena: cała nauka w jednym miejscu — ścieżki dla początkujących, zawodników, tłumaczy, rodziców, trenerów, organizatorów i kibiców; tematy, gry treningowe i certyfikaty",
         pt: "Academia ClayArena: toda a aprendizagem num só lugar — percursos para principiantes, atiradores de competição, intérpretes, pais, treinadores, organizadores e adeptos; temas, jogos de treino e certificados",
         hu: "ClayArena Akadémia: minden tanulás egy helyen — útvonalak kezdőknek, versenyzőknek, tolmácsoknak, szülőknek, edzőknek, szervezőknek és szurkolóknak; témák, gyakorlójátékok és tanúsítványok",
         fi: "ClayArena Akatemia: kaikki oppiminen yhdessä paikassa — polut aloittelijoille, kilpailijoille, tulkeille, vanhemmille, valmentajille, järjestäjille ja faneille; aiheet, harjoituspelit ja todistukset",
         lt: "ClayArena akademija: visas mokymasis vienoje vietoje — maršrutai pradedantiesiems, varžybų dalyviams, vertėjams, tėvams, treneriams, organizatoriams ir sirgaliams; temos, treniruočių žaidimai ir sertifikatai"}},
    {id: "tours", path: "", n: {en: "ClayAway tours", uk: "Тури ClayAway", de: "ClayAway Reisen", fr: "Séjours ClayAway", it: "Viaggi ClayAway", cs: "Zájezdy ClayAway", pl: "Wyjazdy ClayAway", pt: "Viagens ClayAway", hu: "ClayAway utak", fi: "ClayAway-matkat", lt: "ClayAway kelionės"},
     d: {en: "ClayAway: clay shooting trips with top coaches — the project, its spec and tour examples", uk: "ClayAway: тури зі стендової стрільби з тренерами — проєкт, ТЗ і приклади турів", de: "ClayAway: Wurfscheiben-Reisen mit Top-Trainern — das Projekt, die Spezifikation und Beispielreisen", fr: "ClayAway : séjours de ball-trap avec de grands entraîneurs — le projet, le cahier des charges et des exemples", it: "ClayAway: viaggi di tiro a volo con grandi allenatori — il progetto, le specifiche ed esempi", cs: "ClayAway: střelecké zájezdy se špičkovými trenéry — projekt, zadání a ukázky", pl: "ClayAway: wyjazdy strzeleckie z czołowymi trenerami — projekt, specyfikacja i przykłady", pt: "ClayAway: viagens de tiro com grandes treinadores — o projeto, a especificação e exemplos", hu: "ClayAway: lövészutak csúcsedzőkkel — a projekt, a specifikáció és példák", fi: "ClayAway: ammuntamatkat huippuvalmentajien kanssa — projekti, määrittely ja esimerkit", lt: "ClayAway: šaudymo kelionės su aukščiausio lygio treneriais — projektas, specifikacija ir pavyzdžiai"}},
  ];
  // Section identity: each project has its own colour and icon, so a visitor sees at once that they changed section.
  const LOOK = {rules: ["#22D3EE", "📘"], trainer: ["#FBBF24", "🎯"], glossary: ["#A78BFA", "📖"], learn: ["#34D399", "🎓"], tours: ["#F472B6", "✈️"]};
  // "where was I" entries written before the merge used the section "interpreter": it is the Academy now
  const secOf = s => s === "interpreter" ? "learn" : s;
  // Short texts of the bar itself (all ClayArena languages).
  const TX = {
    back: {en: "Back to", uk: "Повернутися:", de: "Zurück zu", fr: "Revenir à", it: "Torna a", cs: "Zpět na", pl: "Wróć do", pt: "Voltar a", hu: "Vissza ide:", fi: "Takaisin:", lt: "Grįžti į"},
    close: {en: "Close", uk: "Закрити", de: "Schließen", fr: "Fermer", it: "Chiudi", cs: "Zavřít", pl: "Zamknij", pt: "Fechar", hu: "Bezárás", fi: "Sulje", lt: "Uždaryti"},
    mistakes: {en: "You have {n} mistakes to repeat in the rules trainer", uk: "У тренажері правил на вас чекають {n} помилок для повторення", de: "Im Regeltrainer warten {n} Fehler auf Wiederholung", fr: "{n} erreurs à revoir dans l'entraîneur des règles", it: "Hai {n} errori da ripassare nell'allenatore delle regole", cs: "V trenažéru pravidel máte {n} chyb k zopakování", pl: "W trenerze przepisów czeka {n} błędów do powtórki", pt: "Tem {n} erros para rever no Treinador de regras", hu: "{n} hibát érdemes átismételni a szabálytrénerben", fi: "Sääntövalmentajassa on {n} virhettä kerrattavana", lt: "Taisyklių treniruoklyje laukia {n} klaidų pakartojimui"},
    route: {en: "Continue the Academy route “{r}”: {d} of {t} lessons done", uk: "Продовжте маршрут «{r}» в Академії: пройдено {d} з {t} уроків", de: "Weiter mit dem Lernweg „{r}“ der Akademie: {d} von {t} Lektionen", fr: "Continuez le parcours « {r} » de l'Académie : {d} leçons sur {t}", it: "Continua il percorso “{r}” dell'Accademia: {d} lezioni su {t}", cs: "Pokračujte v cestě „{r}“ v Akademii: hotovo {d} z {t} lekcí", pl: "Kontynuuj ścieżkę „{r}” w Akademii: ukończono {d} z {t} lekcji", pt: "Continue o percurso «{r}» da Academia: {d} de {t} lições", hu: "Folytassa az Akadémia „{r}” útvonalát: {d}/{t} lecke kész", fi: "Jatka Akatemian polkua ”{r}”: {d}/{t} oppituntia tehty", lt: "Tęskite Akademijos maršrutą „{r}“: atlikta {d} iš {t} pamokų"},
    route_any: {en: "Continue your Academy route: {d} of {t} lessons done", uk: "Продовжте свій маршрут в Академії: пройдено {d} з {t} уроків", de: "Weiter mit Ihrem Lernweg in der Akademie: {d} von {t} Lektionen", fr: "Continuez votre parcours de l'Académie : {d} leçons sur {t}", it: "Continua il tuo percorso dell'Accademia: {d} lezioni su {t}", cs: "Pokračujte ve své cestě v Akademii: hotovo {d} z {t} lekcí", pl: "Kontynuuj swoją ścieżkę w Akademii: ukończono {d} z {t} lekcji", pt: "Continue o seu percurso da Academia: {d} de {t} lições", hu: "Folytassa az Akadémián az útvonalát: {d}/{t} lecke kész", fi: "Jatka polkuasi Akatemiassa: {d}/{t} oppituntia tehty", lt: "Tęskite savo maršrutą Akademijoje: atlikta {d} iš {t} pamokų"},
    interp_moved: {en: "The Interpreter Academy is now the “Interpreter” route of the ClayArena Academy; your progress moves with you", uk: "Академія перекладача тепер — маршрут «Перекладач» в Академії ClayArena; ваш прогрес переходить разом із вами", de: "Die Dolmetscher-Akademie ist jetzt der Lernweg „Dolmetscher“ der ClayArena Akademie; Ihr Fortschritt kommt mit", fr: "L'Académie des interprètes est désormais le parcours « Interprète » de l'Académie ClayArena ; votre progression vous suit", it: "L'Accademia per interpreti ora è il percorso “Interprete” dell'Accademia ClayArena; i tuoi progressi ti seguono", cs: "Akademie tlumočníka je teď cesta „Tlumočník“ v Akademii ClayArena; váš pokrok se přenese", pl: "Akademia tłumacza jest teraz ścieżką „Tłumacz” w Akademii ClayArena; twój postęp przechodzi razem z tobą", pt: "A Academia de Intérpretes é agora o percurso «Intérprete» da Academia ClayArena; o seu progresso acompanha-o", hu: "A Tolmácsakadémia mostantól a ClayArena Akadémia „Tolmács” útvonala; a haladása átkerül", fi: "Tulkkiakatemia on nyt ClayArena Akatemian ”Tulkki”-polku; edistymisesi siirtyy mukana", lt: "Vertėjo akademija dabar yra ClayArena akademijos maršrutas „Vertėjas“; jūsų pažanga persikelia kartu"},
    tip_glossary: {en: "Tip: press 🔊 to hear the English term; target flights and pairs are shown as animations.", uk: "Підказка: натисніть 🔊, щоб почути термін англійською; траєкторії й дуплети показано анімацією.", de: "Tipp: 🔊 spielt den englischen Begriff ab; Flugbahnen und Doubletten sind animiert.", fr: "Astuce : 🔊 fait entendre le terme anglais ; les trajectoires et doublés sont animés.", it: "Suggerimento: 🔊 fa sentire il termine inglese; traiettorie e doppietti sono animati.", cs: "Tip: 🔊 přehraje anglický výraz; dráhy terčů a dvojstřely jsou animované.", pl: "Wskazówka: 🔊 odtwarza angielski termin; tory i dublety są pokazane w animacji.", pt: "Dica: 🔊 faz ouvir o termo inglês; trajetórias e duplas aparecem em animação.", hu: "Tipp: a 🔊 lejátssza az angol kifejezést; a röppályák és duplák animációban láthatók.", fi: "Vinkki: 🔊 toistaa englanninkielisen termin; lentoradat ja parit näkyvät animaatioina.", lt: "Patarimas: 🔊 paleidžia angliško termino tarimą; trajektorijos ir dubletai rodomi animacija."},
    tip_trainer: {en: "Tip: choose a level and a mode; after each answer you see why, with a link to the rule.", uk: "Підказка: оберіть рівень і режим; після кожної відповіді — пояснення з посиланням на правило.", de: "Tipp: Niveau und Modus wählen; nach jeder Antwort folgt die Begründung mit Link zur Regel.", fr: "Astuce : choisissez un niveau et un mode ; après chaque réponse, l'explication et le lien vers la règle.", it: "Suggerimento: scegli livello e modalità; dopo ogni risposta trovi la spiegazione e il link alla regola.", cs: "Tip: zvolte úroveň a režim; po každé odpovědi uvidíte vysvětlení s odkazem na pravidlo.", pl: "Wskazówka: wybierz poziom i tryb; po każdej odpowiedzi zobaczysz wyjaśnienie z linkiem do przepisu.", pt: "Dica: escolha o nível e o modo; depois de cada resposta vê a explicação com ligação à regra.", hu: "Tipp: válasszon szintet és módot; minden válasz után jön a magyarázat a szabály hivatkozásával.", fi: "Vinkki: valitse taso ja tila; jokaisen vastauksen jälkeen näet perustelun ja linkin sääntöön.", lt: "Patarimas: pasirinkite lygį ir režimą; po kiekvieno atsakymo – paaiškinimas su nuoroda į taisyklę."},
    tip_rules: {en: "Tip: search in your own words — “double”, “gun malfunction”, “late shooter”.", uk: "Підказка: шукайте своїми словами — «дуплет», «несправність рушниці», «запізнення».", de: "Tipp: Suchen Sie mit eigenen Worten — „Doublette“, „Waffenstörung“, „Verspätung“.", fr: "Astuce : cherchez avec vos mots — « doublé », « incident d'arme », « retard ».", it: "Suggerimento: cerca con parole tue — “doppietto”, “inceppamento”, “ritardo”.", cs: "Tip: hledejte vlastními slovy — „dvojstřel“, „závada zbraně“, „zpoždění“.", pl: "Wskazówka: szukaj własnymi słowami — „dublet”, „zacięcie broni”, „spóźnienie”.", pt: "Dica: pesquise com as suas palavras — “dupla”, “avaria da arma”, “atraso”.", hu: "Tipp: keressen saját szavaival — „dupla”, „fegyverhiba”, „késés”.", fi: "Vinkki: hae omin sanoin — ”pari”, ”asehäiriö”, ”myöhästyminen”.", lt: "Patarimas: ieškokite savais žodžiais — „dubletas“, „ginklo gedimas“, „vėlavimas“."},
    tip_learn: {en: "Tip: choose the route that fits who you are; your progress is saved on this device.", uk: "Підказка: оберіть маршрут під себе; прогрес зберігається на цьому пристрої.", de: "Tipp: Wählen Sie den Lernweg, der zu Ihnen passt; der Fortschritt wird auf diesem Gerät gespeichert.", fr: "Astuce : choisissez le parcours qui vous correspond ; la progression est enregistrée sur cet appareil.", it: "Suggerimento: scegli il percorso adatto a te; i progressi restano su questo dispositivo.", cs: "Tip: vyberte si cestu, která vám sedí; pokrok se ukládá v tomto zařízení.", pl: "Wskazówka: wybierz ścieżkę dla siebie; postęp zapisuje się na tym urządzeniu.", pt: "Dica: escolha o percurso que lhe convém; o progresso fica guardado neste dispositivo.", hu: "Tipp: válassza ki az önnek való útvonalat; a haladás ezen az eszközön mentődik.", fi: "Vinkki: valitse itsellesi sopiva polku; edistyminen tallentuu tälle laitteelle.", lt: "Patarimas: pasirinkite jums tinkantį maršrutą; pažanga išsaugoma šiame įrenginyje."},
  };
  const pick = o => o[L] || o.en;
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]));
  const here = location.href.replace(ROOT, "").replace(/[?#].*$/, "");
  // current section: by path; /<lang>/glossary/ and /<lang>/learn/ are language versions; /interpreter/ (old Interpreter Academy,
  // now a redirect to the Academy's interpreter route) belongs to the Academy; rules-spec/ is the spec of the rules guide;
  // the repo home and the ClayAway pages (concept, tour examples) belong to tours
  const cur = ITEMS.filter(i => i.path && here.startsWith(i.path) || /^[a-z]{2}\/glossary\//.test(here) && i.id === "glossary"
                   || (/^[a-z]{2}\/learn\//.test(here) || /^interpreter\//.test(here)) && i.id === "learn" || /^rules-spec\//.test(here) && i.id === "rules")
                   .sort((a, b) => b.path.length - a.path.length)[0] || (/^(|index\.html|concept\/|dornsberg\/|sologne\/)$/.test(here) ? ITEMS.find(i => i.id === "tours") : null);
  /* Academy languages: the Academy is published language by language (translation waves), so the "Академія" item links
     /<lang>/learn/ only when that home exists. scripts/build_academy.mjs writes the list to learn/data/languages.json
     ({published: ["uk", "en", …], fallback: "en"}). It is fetched only when a language other than uk/en needs it, once per browser
     session (sessionStorage "clayarena-learn-langs"), and the bar is redrawn when it arrives. Until then, or if the file is missing,
     uk → /learn/ and every other language → /en/learn/ (English is the master language): never a guessed page that may not exist.
     In production the section menu comes from the server, which knows the published languages itself. */
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
    if (!LEARN) { if (l !== "uk" && l !== "en") askLearn(); return l === "uk" ? "uk" : "en"; }
    const p = LEARN.published; return p.includes(l) ? l : p.includes(LEARN.fallback) ? LEARN.fallback : p.includes("en") ? "en" : "uk";
  };
  /* Links in a language l: glossary (uk at /glossary/, the other 10 languages at /<lang>/glossary/), Academy (see learnLang),
     rules trainer (?lang=, all 11 languages; from an Academy page also &from=learn, so the trainer offers the way back),
     rules guide (?lang=uk|en: the guide has Ukrainian and English only; rules/index.html reads the parameter). */
  const hrefFor = (i, l) => i.id === "glossary" && l !== "uk" ? `${ROOT}${l}/glossary/`
                  : i.id === "learn" ? `${ROOT}${learnLang(l) === "uk" ? "" : learnLang(l) + "/"}learn/`
                  : i.id === "trainer" ? `${ROOT}rules/trainer/?lang=${l}${cur && cur.id === "learn" ? "&from=learn" : ""}`
                  : i.id === "rules" ? `${ROOT}rules/?lang=${l === "uk" ? "uk" : "en"}` : ROOT + i.path;
  const href = i => hrefFor(i, L);
  const [color, icon] = cur ? LOOK[cur.id] : ["#34D399", ""];
  const css = `.ca-bar{background:#000;border-bottom:1px solid rgba(255,255,255,.1);border-top:3px solid ${color};font:13px/1.2 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;position:relative;z-index:30}
.ca-bar nav{max-width:1100px;margin:0 auto;padding:6px 12px;display:flex;gap:4px;align-items:center;overflow-x:auto;scrollbar-width:none}
.ca-bar nav::-webkit-scrollbar{display:none}
.ca-bar a{color:#D1D5DB;text-decoration:none;padding:5px 10px;border-radius:999px;white-space:nowrap;border:1px solid transparent}
.ca-bar a:hover,.ca-bar a:focus-visible{color:#fff;border-color:rgba(255,255,255,.35);outline:none}
.ca-bar a[aria-current="page"]{background:${color}26;color:${color};font-weight:700;border-color:${color}80}
.ca-bar .ca-home{font-weight:800;margin-right:6px;background:linear-gradient(90deg,#34D399,#22D3EE);-webkit-background-clip:text;background-clip:text;color:transparent}
.ca-hint{background:#0B1120;border-bottom:1px solid rgba(255,255,255,.08);font:13.5px/1.4 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#D1D5DB}
.ca-hint div{max-width:1100px;margin:0 auto;padding:7px 12px;display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.ca-hint a{color:#fff;font-weight:600;text-decoration:none;border:1px solid rgba(255,255,255,.2);border-radius:999px;padding:3px 10px}
.ca-hint a:hover{border-color:${color}}
.ca-hint button{margin-left:auto;background:none;border:0;color:#9CA3AF;font:inherit;cursor:pointer;padding:2px 6px}
.ca-dot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px;vertical-align:middle}`;
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
  const bar = document.createElement("div"); bar.className = "ca-bar";
  const hint = document.createElement("div"); hint.className = "ca-hint"; hint.setAttribute("role", "status");
  const label = {en: "ClayArena projects", uk: "Проєкти ClayArena", de: "ClayArena-Projekte", fr: "Projets ClayArena", it: "Progetti ClayArena", cs: "Projekty ClayArena", pl: "Projekty ClayArena", pt: "Projetos ClayArena", hu: "ClayArena projektek", fi: "ClayArena-projektit", lt: "ClayArena projektai"};
  const ls = {get: k => { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }};

  /* "Where was I?" — apps call ClayNav.setResume({section, label, url}) while a task is in progress (trainer run,
     open lesson) and ClayNav.clearResume(section) when it is finished (run over, module or course done). In another section
     the bar offers the way back for 7 days. Closing that hint hides the way back to this section for 7 days, even if the app
     updates the place in the meantime (each new lesson calls setResume again). */
  const RKEY = "clayarena-resume", DAY = 864e5;
  window.ClayNav = {
    setResume: r => ls.set(RKEY, Object.assign({ts: Date.now(), lang: (document.documentElement.lang || "en").slice(0, 2)}, r)),
    clearResume: section => { const r = ls.get(RKEY); if (r && (!section || r.section === section)) try { localStorage.removeItem(RKEY); } catch (e) {} },
    /* link("learn", "de") → {url, name, lang}: the bar's own link of a project in a language (lang = the language the link really
       opens, e.g. "en" while the German Academy is not published). Used by the rules trainer for its "← Академія" link. Pages that
       render such links listen to the "claynav:update" event (fired after every redraw of the bar) and ask again. */
    link: (id, l) => { const i = ITEMS.find(x => x.id === id); if (!i) return null; l = i.n[l] ? l : L;
      return {url: hrefFor(i, l), name: i.n[l] || i.n.en, lang: id === "learn" ? learnLang(l) : l}; },
  };

  /* Personal hints (one at a time; dismissed hints are remembered on this device). Order: way back > own mistakes >
     unfinished course > first-visit tip of this section. Reads only this browser's own progress (no tracking, no server). */
  /* Hint texts are escaped: labels and URLs come from this browser's storage. Only http(s) and relative URLs are linked. */
  const safeUrl = u => /^(https?:\/\/|\.{0,2}\/|[?#])/i.test(String(u || "")) ? String(u) : "#";
  function hintHTML(){
    const seen = ls.get("clayarena-hints") || {};
    const item = id => ITEMS.find(i => i.id === id);
    const r = ls.get(RKEY), rs = r && secOf(r.section), closed = r && (seen["resume:" + rs] || seen["resume:" + r.section]);
    if (r && cur && rs !== cur.id && Date.now() - r.ts < 7 * DAY && !(closed && Date.now() - closed < 7 * DAY))
      return ["resume:" + rs, `<span class="ca-dot" style="background:${LOOK[rs] ? LOOK[rs][0] : color}"></span>↩ ${esc(pick(TX.back))} <a href="${esc(safeUrl(r.url))}">${LOOK[rs] ? LOOK[rs][1] + " " : ""}${esc(r.lang && r.lang !== L && item(rs) ? pick(item(rs).n) : r.label)}</a>`, Date.now()];
    // rules trainer progress: key "clayarena-trainer" (older builds: "clayaway-trainer")
    const tr = ls.get("clayarena-trainer") || ls.get("clayaway-trainer"), wrong = tr && tr.stats ? Object.values(tr.stats).reduce((s, x) => s + ((x && x.wrong) || []).length, 0) : 0;
    if (wrong >= 3 && cur && cur.id !== "trainer" && !seen["mistakes:" + wrong])
      return ["mistakes:" + wrong, `${LOOK.trainer[1]} <a href="${esc(href(item("trainer")))}">${esc(pick(TX.mistakes).replace("{n}", wrong))}</a>`];
    // Academy route in progress: docs/shared/progress.js keeps a summary in "clayarena-academy".nav = {route, title, lang, d, t, url}
    // (written by docs/learn/app/academy.js; null when there is no current route or its lessons are all done)
    const ac = ls.get("clayarena-academy"), nv = ac && ac.nav, learnUrl = href(item("learn"));
    if (nv && nv.t > 0 && nv.d < nv.t && cur && cur.id !== "learn" && !seen["route:" + nv.route + ":" + nv.d])
      return ["route:" + nv.route + ":" + nv.d, `${LOOK.learn[1]} <a href="${esc(safeUrl(nv.url || learnUrl))}">${esc((nv.lang === L && nv.title ? pick(TX.route).replace("{r}", nv.title) : pick(TX.route_any)).replace("{d}", nv.d).replace("{t}", nv.t))}</a>`];
    // progress of the old Interpreter Academy that the Academy has not moved yet (it moves on the first Academy visit)
    const ia = ls.get("clayarena-interpreter"), iaDone = ia && ia.done ? Object.keys(ia.done).length : 0;
    if (iaDone > 0 && !(ac && ac.migrated && ac.migrated["clayarena-interpreter"]) && cur && cur.id !== "learn" && !seen["interp-moved"])
      return ["interp-moved", `${LOOK.learn[1]} <a href="${esc(learnUrl)}routes/interpreter/">${esc(pick(TX.interp_moved))}</a>`];
    const tip = cur && TX["tip_" + cur.id];
    if (tip && !seen["tip:" + cur.id]) return ["tip:" + cur.id, `${icon} ${esc(pick(tip))}`];
    return null;
  }
  function draw(){
    try { document.dispatchEvent(new CustomEvent("claynav:update", {detail: {lang: L, learn: LEARN ? LEARN.published : null}})); } catch (e) {} // see ClayNav.link
    const ll = learnLang(L); // the Academy item opens English (hreflang="en") while this language is not published
    bar.innerHTML = `<nav aria-label="${pick(label)}"><a class="ca-home" href="https://clayarena.com/" rel="noopener" title="clayarena.com">ClayArena</a>${ITEMS.map(i =>
      `<a href="${href(i)}" title="${pick(i.d).replace(/"/g, "&quot;")}" aria-description="${pick(i.d).replace(/"/g, "&quot;")}"${i.id === "learn" && ll !== L ? ` hreflang="${ll}"` : ""}${cur === i ? ' aria-current="page"' : ""}>${LOOK[i.id][1]} ${pick(i.n)}</a>`).join("")}</nav>`;
    const curA = bar.querySelector("[aria-current]"), nv = bar.querySelector("nav"); // keep the current section visible on narrow screens
    if (curA && nv) requestAnimationFrame(() => { nv.scrollLeft = Math.max(0, curA.offsetLeft - 60); });
    const h = hintHTML();
    if (!h) { hint.remove(); return; }
    hint.innerHTML = `<div>${h[1]}<button type="button" aria-label="${pick(TX.close)}" title="${pick(TX.close)}">✕</button></div>`;
    hint.querySelector("button").onclick = () => { const s = ls.get("clayarena-hints") || {}; s[h[0]] = h[2] || 1; ls.set("clayarena-hints", s); draw(); };
    if (!hint.isConnected) bar.after(hint);
  }
  document.body.insertBefore(bar, document.body.firstChild); draw();
  // apps that switch language without reloading (rules trainer) change <html lang>: follow it
  new MutationObserver(() => { const n = (document.documentElement.lang || "en").slice(0, 2).toLowerCase(); if (n !== L) { L = n; draw(); } })
    .observe(document.documentElement, {attributes: true, attributeFilter: ["lang"]});
})();
