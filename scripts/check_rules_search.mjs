// Quality check of the rules guide search ("Запитайте про правила", docs/rules/index.html), run with Bun or Node from the project root:
//   bun scripts/check_rules_search.mjs            summary + every miss
//   bun scripts/check_rules_search.mjs --all      every question
// The search code is taken from docs/rules/index.html itself (from "const norm=" to "function pdfLink"), so this checks what the
// visitor gets. Questions are written the way a shooter types them on the stand, in their own words (owner, 10.11.2026: "if we
// say «ask in your own words», people will do exactly that"), not copied from the rule titles. Each question lists the rule items
// (ids of docs/rules/data/<book>.js) that answer it; any one of them counts.
// "first" = what the visitor sees first: the FAQ answer when the page shows one (search() → r.lead, used by answerHTML()), and it
// is right when that FAQ cites one of the expected items; otherwise the first rule item. "top4" = an expected item is among the 4 rule items shown under "Правила за темою".
// Two sets: CASES — the questions the search was tuned on (10.11.2026); CONTROL — questions written afterwards and never used for
// tuning, so a tweak that only fits CASES shows up there. Keep tuning on CASES; add new control questions from time to time.
//   --html <file>   check another copy of the page (e.g. git show HEAD~1:docs/rules/index.html > old.html), to compare
import { readFileSync } from "fs";

const hi = process.argv.indexOf("--html");
const html = readFileSync(hi > 0 ? process.argv[hi + 1] : "docs/rules/index.html", "utf8");
const a = html.indexOf("const norm="), b = html.indexOf("function pdfLink");
if (a < 0 || b < a) { console.error("search code not found in docs/rules/index.html"); process.exit(2); }
globalThis.window = {};
for (const k of ["sporting", "compak"]) new Function("window", readFileSync(`docs/rules/data/${k}.js`, "utf8"))(globalThis.window);
const { search } = new Function(html.slice(a, b) + "\nreturn {search};")();
const BOOK = k => window.RULES.find(x => x.key === k);

const CASES = {
  sporting: [
    ["мішень розлетілася ще до того як я вистрілив", "ch6-nobird-target-cases"],
    ["вітер розбив мішень", "ch6-nobird-target-cases"],
    ["мішень вилетіла не з тієї машинки", "ch6-nobird-target-cases"],
    ["вилетіла вже розбита тарілка", "ch6-nobird-target-cases"],
    ["рушниця не вистрілила", "ch6-nobird-gun-rules ch6-malfunction-first-shot ch7-malfunction-procedure"],
    ["вдруге за серію рушниця не стріляє", "ch6-second-malfunction"],
    ["вистрілили обидва стволи одночасно", "ch6-double-discharge ch7-double-discharge"],
    ["можна відкрити рушницю після осічки?", "ch8-malfunction-stay-put ch7-malfunction-procedure"],
    ["коли можна вскидати рушницю до плеча", "ch3-mounting ch3-ready-position"],
    ["де має бути приклад перед командою", "ch3-ready-position ch3-jacket-line ch3-mounting"],
    ["навіщо лінія на жилеті", "ch3-jacket-line"],
    ["чи можна тримати рушницю на плечі між мішенями дуплета", "ch3-between-doubles"],
    ["отримав жовту картку що далі", "ch12-yellow-card ch12-red-card"],
    ["червона картка", "ch12-red-card"],
    ["що буде якщо стріляти по мішені після no bird", "ch12-shooting-nobird"],
    ["запізнився на свій номер", "ch16-late-shooter ch16-late-excuse"],
    ["проспав старт", "ch16-late-shooter"],
    ["автобус запізнився не з моєї вини", "ch16-late-excuse"],
    ["можна поміняти чок під час змагань", "ch7-no-changes-on-stand ch7-borrow-replace"],
    ["зламалася рушниця можна взяти в друга", "ch7-borrow-replace ch7-touching-sharing"],
    ["можна стріляти однією рушницею з другом", "ch7-touching-sharing"],
    ["скільки часу можна чекати між мішенями", "ch7-fifteen-seconds"],
    ["суддя довго не випускає мішень", "ch5-call-and-release ch6-nobird-target-cases"],
    ["який максимальний заряд патрона", "ch7-cartridges"],
    ["чи можна стріляти в шортах", "ch17-dress-code"],
    ["чи можна без окулярів", "ch8-safety-glasses"],
    ["обов'язково навушники?", "ch8-hearing-protection"],
    ["тренер підказує під час стрільби", "ch8-coaching"],
    ["не згоден з рішенням судді", "ch9-how-to-appeal ch9-jury-appeal ch9-consultation"],
    ["скільки коштує протест", "ch9-jury-appeal"],
    ["можна підняти уламок і перевірити влучив чи ні", "ch9-no-checking-targets"],
    ["розбив дві мішені одним пострілом", "ch6-two-with-one-shot"],
    ["скільки патронів можна зарядити", "ch8-loading ch4-doubles-general"],
    ["можна вистрілити двічі в одну мішень", "ch4-single-target ch4-doubles-general"],
    ["однакова кількість балів за перше місце", "ch18-top-three ch18-sudden-death"],
    ["рівний результат у команд", "ch18-team-ties"],
    ["почалась гроза", "ch5-weather-interruption"],
    ["посварився з суддею і кричав", "ch8-loss-of-control ch11-influence"],
    ["хто записує результати", "ch14-who-keeps-score"],
    ["скільки мішеней на чемпіонаті", "ch16-format"],
    ["скільки людей у групі", "ch16-squads"],
    ["можна потренуватися на layout перед стартом", "ch15-no-practice"],
    ["мішень зарахують якщо відлетів маленький шматочок", "ch6-target-one"],
    ["суддя показує мішені перед стрільбою", "ch16-presentation ch16-presentation-doubles"],
    ["можна стріляти з напівавтомата", "ch7-permitted-guns"],
    ["випадково вистрілив", "ch8-mock-shooting"],
    ["відмовився стріляти мішень бо траєкторія інша", "ch5-refusing-target"],
    ["обертатися із закритою рушницею", "ch8-turning-empties"],
    // English, the same guide in English
    ["target broke before I fired", "ch6-nobird-target-cases"],
    ["my gun didn't fire", "ch6-nobird-gun-rules ch6-malfunction-first-shot ch7-malfunction-procedure"],
    ["when can I mount the gun", "ch3-mounting ch3-ready-position"],
    ["red card", "ch12-red-card"],
    ["I was late for my squad", "ch16-late-shooter ch16-late-excuse"],
    ["can I change choke", "ch7-no-changes-on-stand ch7-borrow-replace"],
    ["can I shoot in shorts", "ch17-dress-code"],
    ["how much does a protest cost", "ch9-jury-appeal"],
    ["tie for first place", "ch18-top-three ch18-sudden-death"],
    ["coach giving advice during the round", "ch8-coaching"],
    ["both barrels fired at once", "ch6-double-discharge ch7-double-discharge"],
    ["two targets with one shot", "ch6-two-with-one-shot"],
  ],
  compak: [
    ["мішень розбилася до пострілу", "ch20-target-no-bird-cases"],
    ["рушниця не вистрілила", "ch20-gun-failure-principle ch20-gun-failure-first-shot ch21-malfunction"],
    ["запізнився на групу", "ch9-late-squad ch9-late-inline"],
    ["скільки секунд на команду", "ch17-call-time-and-changeover ch21-firing-time"],
    ["можна поміняти чок", "ch18-gun-change"],
    ["заєць розбився між пострілами", "ch20-rabbit"],
    ["мішень з сусіднього компаку", "ch20-other-compak"],
    ["дощ і вітер no bird", "ch20-bad-weather"],
    ["скільки дробу в патроні", "ch18-cartridge-load"],
    ["можна стріляти з напівавтомата", "ch18-semi-auto ch18-gun"],
    ["як подати скаргу", "ch4-complaint-procedure ch19-protest"],
    ["нічия за третє місце", "ch14-shootoff-medals"],
    ["нічия за десяте місце", "ch14-countback"],
    ["де можна перевірити рушницю", "ch11-testing-guns"],
    ["скільки стрільців у групі", "ch17-squads-groups"],
  ],
};

// Written after the tuning, never used for it (10.11.2026).
const CONTROL = {
  sporting: [
    ["мішень вилетіла пізно після команди", "ch6-nobird-target-cases ch5-call-and-release"],
    ["дві мішені вилетіли одночасно замість однієї", "ch6-nobird-target-cases"],
    ["мені завадив глядач", "ch6-nobird-target-cases"],
    ["клацнуло але не вистрілило", "ch6-malfunction-first-shot ch6-nobird-gun-rules"],
    ["друга осічка за раунд", "ch6-second-malfunction"],
    ["чи можна позичити рушницю якщо моя зламалась", "ch7-borrow-replace"],
    ["чи потрібен номер на спині", "ch17-competitor-number"],
    ["можна стріляти в джинсах", "ch17-dress-code"],
    ["суддя не впевнений чи я влучив", "ch9-consultation"],
    ["де подати письмовий протест", "ch9-jury-appeal ch9-how-to-appeal"],
    ["хто входить у журі", "ch15-jury-composition"],
    ["скільки разів можна отримати жовту картку", "ch12-yellow-card ch12-red-card"],
    ["вигнали зі змагань чи повернуть гроші", "ch13-no-refund"],
    ["можна заряджати рушницю до того як зайшов на номер", "ch8-loading"],
    ["чи можна зробити пробний постріл", "ch3-testing-guns"],
    ["rafale що це", "ch4-rafale-double"],
    ["simultaneous double rules", "ch4-simultaneous-double"],
    ["shoot-off format", "ch18-sudden-death ch18-top-three"],
    ["do I have to wear glasses", "ch8-safety-glasses"],
    ["late arrival penalty", "ch16-late-shooter"],
  ],
  compak: [
    ["скільки мішеней в раунді", "ch17-round-combinations"],
    ["яка вага дробу", "ch18-cartridge-load"],
    ["мішень вилетіла з іншої машинки", "ch20-target-no-bird-cases"],
    ["чи можна заряджати два патрони в напівавтомат", "ch18-semi-auto"],
    ["куди викидати гільзи", "ch18-empty-cases"],
    ["хто підписує протокол", "ch15-signing"],
  ],
};

const all = process.argv.includes("--all");
function run(name, SET) {
  let n = 0, first = 0, top4 = 0;
  for (const [key, list] of Object.entries(SET)) {
    const book = BOOK(key);
    for (const [q, ids] of list) {
      const gold = new Set(ids.split(" ")), r = search(book, q); n++;
      const top = r && r.faq[0], ti = r && r.items[0];
      const faqShown = r ? ("lead" in r ? r.lead : !!(top && (!ti || top.sc >= ti.sc * 0.4 || top.cov >= 0.6))) : false;
      const okFirst = faqShown ? (top.d.f.refs || []).some(id => gold.has(id)) : !!(ti && gold.has(ti.d.it.id));
      const ok4 = !!(r && r.items.slice(0, 4).some(x => gold.has(x.d.it.id)));
      first += okFirst; top4 += ok4;
      if (all || !okFirst) {
        const shown = faqShown ? `FAQ «${top.d.f.q_uk || top.d.f.q_en}»` : ti ? `пункт ${ti.d.it.id}` : "нічого";
        console.log(`${okFirst ? "✓" : "✕"} ${ok4 ? "·" : "✕"} [${name} · ${key}] ${q}\n      перше: ${shown}\n      пункти: ${r ? r.items.slice(0, 4).map(x => x.d.it.id).join(", ") : "—"}  · чекали: ${ids}`);
      }
    }
  }
  const pct = x => Math.round(x / n * 100);
  return `${name}: ${n} questions · first answer right ${first} (${pct(first)}%) · right item among the 4 shown ${top4} (${pct(top4)}%)`;
}
const lines = [run("tuning", CASES), run("control", CONTROL)];
console.log("\n" + lines.join("\n"));
