window.RULES_QUIZ = window.RULES_QUIZ || [];
window.RULES_QUIZ.push({
 "key": "sporting",
 "questions": [
  {
   "id": "sp-q001",
   "type": "decision",
   "level": 1,
   "topic": "Scoring",
   "q_en": "Single target. The shooter fires, and the referee sees only a puff of dust come off the clay; no piece breaks away. What is the referee's decision?",
   "q_uk": "Одиночна мішень. Стрілець стріляє, і суддя бачить лише хмарку пилу над мішенню; жоден уламок не відлітає. Яке рішення судді?",
   "options": [
    {
     "en": "One (hit)",
     "uk": "One — мішень зарахована"
    },
    {
     "en": "No Bird, the target is repeated",
     "uk": "No Bird — мішень повторюють"
    },
    {
     "en": "Zero (lost)",
     "uk": "Zero — мішень не зарахована"
    }
   ],
   "answer": 2,
   "explain_en": "Only dust or smoke does not count. A target is 'one' only when at least one visible piece breaks off or it is wholly or partly destroyed.",
   "explain_uk": "Пил чи дим не рахуються. Мішень зараховують (one), лише коли від неї відлітає хоча б один видимий уламок або її повністю чи частково зруйновано.",
   "refs": [
    "ch6-target-zero",
    "ch6-target-one"
   ]
  },
  {
   "id": "sp-q002",
   "type": "decision",
   "level": 1,
   "topic": "Scoring",
   "q_en": "Single target. After the shot one small but clearly visible piece breaks off the clay, and the rest flies on. What is the referee's decision?",
   "q_uk": "Одиночна мішень. Після пострілу від неї відлітає один маленький, але чітко видимий уламок, а решта летить далі. Яке рішення судді?",
   "options": [
    {
     "en": "One (hit)",
     "uk": "One — мішень зарахована"
    },
    {
     "en": "No Bird, the target is repeated",
     "uk": "No Bird — мішень повторюють"
    },
    {
     "en": "Zero (lost)",
     "uk": "Zero — мішень не зарахована"
    }
   ],
   "answer": 0,
   "explain_en": "One visible piece is enough: a properly launched target shot from a correct position is 'one' when at least one piece visibly breaks off.",
   "explain_uk": "Достатньо одного видимого уламка: правильно запущена мішень, по якій стріляли з правильної позиції, зараховується, якщо від неї видимо відлетів хоча б один шматок.",
   "refs": [
    "ch6-target-one"
   ]
  },
  {
   "id": "sp-q003",
   "type": "decision",
   "level": 1,
   "topic": "No Bird",
   "q_en": "The shooter calls 'pull'. The referee relays the signal, but the target only appears about five seconds later. The shooter fires and misses. What is the referee's decision?",
   "q_uk": "Стрілець командує «pull». Суддя передає сигнал, але мішень з’являється лише приблизно через п’ять секунд. Стрілець стріляє й промахується. Яке рішення судді?",
   "options": [
    {
     "en": "Zero (lost)",
     "uk": "Zero — мішень не зарахована"
    },
    {
     "en": "No Bird, the target is repeated",
     "uk": "No Bird — мішень повторюють"
    },
    {
     "en": "Repeat only if the shooter protested before firing",
     "uk": "Повтор, лише якщо стрілець запротестував до пострілу"
    }
   ],
   "answer": 1,
   "explain_en": "The target must be released within 3 seconds of the referee's signal. A target thrown later is a No Bird, whatever the result of the shot.",
   "explain_uk": "Мішень має вилетіти протягом 3 секунд після сигналу судді. Пізніша мішень — No Bird, незалежно від результату пострілу.",
   "refs": [
    "ch5-call-and-release",
    "ch6-nobird-target-cases"
   ]
  },
  {
   "id": "sp-q004",
   "type": "decision",
   "level": 1,
   "topic": "Refusing a target",
   "q_en": "The shooter calls, a correct target is thrown on the right trajectory, but the shooter does not fire and says he did not like the way it came out. What is the referee's decision?",
   "q_uk": "Стрілець командує, мішень вилітає правильно й по правильній траєкторії, але він не стріляє й каже, що вона йому не сподобалася. Яке рішення судді?",
   "options": [
    {
     "en": "No Bird, the target is repeated",
     "uk": "No Bird — мішень повторюють"
    },
    {
     "en": "Zero (lost)",
     "uk": "Zero — мішень не зарахована"
    },
    {
     "en": "Warning, then the target is repeated",
     "uk": "Попередження, потім мішень повторюють"
    }
   ],
   "answer": 1,
   "explain_en": "A called target cannot be refused. Only the referee judges whether the trajectory is correct; a correct target the shooter did not fire at is zero.",
   "explain_uk": "Від мішені, яку стрілець сам викликав, відмовитися не можна. Правильність траєкторії оцінює лише суддя; правильна мішень, по якій не стріляли, — zero.",
   "refs": [
    "ch5-refusing-target",
    "ch6-target-zero"
   ]
  },
  {
   "id": "sp-q005",
   "type": "decision",
   "level": 1,
   "topic": "No Bird",
   "q_en": "While the shooter is still settling into the ready position and has not called, the trapper releases a target. The shooter does not fire. What is the referee's decision?",
   "q_uk": "Стрілець ще стає в готову позицію й нічого не командував, а трапер уже випускає мішень. Стрілець не стріляє. Яке рішення судді?",
   "options": [
    {
     "en": "Yellow card, then the target is repeated",
     "uk": "Жовта картка, потім мішень повторюють"
    },
    {
     "en": "Zero (lost)",
     "uk": "Zero — мішень не зарахована"
    },
    {
     "en": "No Bird, the target is repeated",
     "uk": "No Bird — мішень повторюють"
    }
   ],
   "answer": 2,
   "explain_en": "A target that was not called may be refused and is a No Bird. Refusing is allowed only in this case.",
   "explain_uk": "Від мішені, яку не викликали, можна відмовитися — це No Bird. Відмова дозволена тільки в такому випадку.",
   "refs": [
    "ch5-refusing-target",
    "ch6-nobird-target-cases"
   ]
  },
  {
   "id": "sp-q006",
   "type": "decision",
   "level": 1,
   "topic": "No Bird",
   "q_en": "On a single, the clay leaves the trap already broken into two pieces. The shooter fires at the larger piece and hits it. What is the referee's decision?",
   "q_uk": "На одиночній мішені тарілка вилітає з машинки вже розколотою навпіл. Стрілець влучає у більший уламок. Яке рішення судді?",
   "options": [
    {
     "en": "No Bird, the target is repeated",
     "uk": "No Bird — мішень повторюють"
    },
    {
     "en": "One (hit)",
     "uk": "One — мішень зарахована"
    },
    {
     "en": "Zero (lost)",
     "uk": "Zero — мішень не зарахована"
    }
   ],
   "answer": 0,
   "explain_en": "A broken target thrown by the trap is a No Bird and the single is repeated; hitting a piece does not count.",
   "explain_uk": "Розбита мішень, яку викинула машинка, — No Bird, одиночну мішень повторюють; влучання в уламок не рахується.",
   "refs": [
    "ch6-nobird-target-cases",
    "ch6-nobird-target-single-rabbit"
   ]
  },
  {
   "id": "sp-q007",
   "type": "decision",
   "level": 1,
   "topic": "No Bird",
   "q_en": "Single target from trap B. Just as the shooter fires, a spectator's phone rings loudly right behind the stand, and the shooter clearly flinches and misses. What is the referee's decision?",
   "q_uk": "Одиночна мішень із машинки B. У момент пострілу просто за стендом гучно дзвонить телефон глядача, стрілець помітно здригається й промахується. Яке рішення судді?",
   "options": [
    {
     "en": "Zero (lost)",
     "uk": "Zero — мішень не зарахована"
    },
    {
     "en": "Repeated only if the jury agrees",
     "uk": "Повтор лише за згодою журі"
    },
    {
     "en": "No Bird, the target is repeated",
     "uk": "No Bird — мішень повторюють"
    }
   ],
   "answer": 2,
   "explain_en": "If the shooter was clearly disturbed, the referee declares No Bird and the target is repeated. It is the referee who judges whether the disturbance was clear.",
   "explain_uk": "Якщо стрільцю явно завадили, суддя оголошує No Bird і мішень повторюють. Чи була завада очевидною, вирішує суддя.",
   "refs": [
    "ch6-nobird-target-cases"
   ]
  },
  {
   "id": "sp-q008",
   "type": "decision",
   "level": 2,
   "topic": "No Bird",
   "q_en": "The referee was briefly blinded by low sun and honestly cannot tell whether the single target was hit. What is the referee's decision?",
   "q_uk": "Суддю на мить засліпило низьке сонце, і він чесно не може сказати, чи влучили в одиночну мішень. Яке рішення судді?",
   "options": [
    {
     "en": "Ask the squad and score by majority",
     "uk": "Запитати squad і зарахувати за більшістю голосів"
    },
    {
     "en": "One (hit)",
     "uk": "One — мішень зарахована"
    },
    {
     "en": "No Bird, the target is repeated",
     "uk": "No Bird — мішень повторюють"
    },
    {
     "en": "Zero (lost)",
     "uk": "Zero — мішень не зарахована"
    }
   ],
   "answer": 2,
   "explain_en": "When the referee cannot decide whether a target was hit, it is a No Bird and the target is repeated. The squad may advise only if the referee asks, and never votes.",
   "explain_uk": "Коли суддя не може вирішити, чи була мішень уражена, це No Bird і мішень повторюють. Squad може лише порадити, якщо суддя сам запитає, і ніколи не голосує.",
   "refs": [
    "ch6-nobird-target-cases",
    "ch9-consultation"
   ]
  },
  {
   "id": "sp-q009",
   "type": "decision",
   "level": 2,
   "topic": "Doubles",
   "q_en": "Simultaneous double. The shooter fires once, and that single shot breaks both clays. What is the referee's decision?",
   "q_uk": "Simultaneous double. Стрілець робить один постріл, і він розбиває обидві тарілки. Яке рішення судді?",
   "options": [
    {
     "en": "One and zero",
     "uk": "One та zero"
    },
    {
     "en": "One and one",
     "uk": "One та one"
    },
    {
     "en": "No Bird, double repeated",
     "uk": "No Bird, дуплет повторюють"
    }
   ],
   "answer": 1,
   "explain_en": "Here the shot itself broke both clays, so in any type of double both count: one and one. It is different when a piece of the first clay breaks the second before the second shot (double on report): then the double is repeated and the first result is kept.",
   "explain_uk": "Тут обидві тарілки розбив сам постріл, тож у будь-якому дуплеті зараховують обидві: one та one. Інша річ, коли уламок першої тарілки розбиває другу до другого пострілу (double on report): тоді дуплет повторюють, а результат першої зберігають.",
   "refs": [
    "ch6-two-with-one-shot"
   ],
   "sim": {
    "type": "pair",
    "kind": "simultaneous"
   }
  },
  {
   "id": "sp-q010",
   "type": "decision",
   "level": 2,
   "topic": "Doubles",
   "q_en": "Rafale double. The two clays come out correctly, but the shooter lowers the gun and fires at neither, giving no valid reason. What is the referee's decision?",
   "q_uk": "Rafale double. Обидві тарілки вилітають правильно, але стрілець опускає рушницю й не стріляє жодного разу, без поважної причини. Яке рішення судді?",
   "options": [
    {
     "en": "Zero and zero",
     "uk": "Zero та zero"
    },
    {
     "en": "No Bird, double repeated",
     "uk": "No Bird, дуплет повторюють"
    },
    {
     "en": "Zero on the first target, second repeated",
     "uk": "Zero на першій, другу повторюють"
    }
   ],
   "answer": 0,
   "explain_en": "Not firing at a correct target without a valid reason is zero; for a rafale or simultaneous double that means zero and zero.",
   "explain_uk": "Якщо без поважної причини не стріляти по правильній мішені, це zero; для rafale чи simultaneous double — zero та zero.",
   "refs": [
    "ch6-target-zero"
   ],
   "sim": {
    "type": "pair",
    "kind": "rafale"
   }
  },
  {
   "id": "sp-q011",
   "type": "decision",
   "level": 2,
   "topic": "Doubles",
   "q_en": "Double on report. The first target comes out on an obviously wrong, irregular trajectory. The shooter fires at it anyway and misses. What is the referee's decision?",
   "q_uk": "Double on report. Перша мішень летить явно неправильною, нерегулярною траєкторією. Стрілець усе одно стріляє й промахується. Яке рішення судді?",
   "options": [
    {
     "en": "No Bird on the first target only",
     "uk": "No Bird лише на першу мішень"
    },
    {
     "en": "Zero on the first target, second shot as normal",
     "uk": "Zero на першій, другу стріляють як звичайно"
    },
    {
     "en": "No Bird, the whole double is repeated",
     "uk": "No Bird — весь дуплет повторюють"
    }
   ],
   "answer": 2,
   "explain_en": "On a double on report, an irregular first target means the double is repeated.",
   "explain_uk": "У double on report нерегулярна перша мішень означає, що весь дуплет повторюють.",
   "refs": [
    "ch6-nobird-target-doubles"
   ],
   "sim": {
    "type": "pair",
    "kind": "report"
   }
  },
  {
   "id": "sp-q012",
   "type": "decision",
   "level": 3,
   "topic": "Doubles",
   "q_en": "Double on report. The shooter breaks the first clay, and one of its pieces smashes the second clay before the shooter can fire the second shot. What is the referee's decision?",
   "q_uk": "Double on report. Стрілець розбиває першу тарілку, і її уламок розбиває другу ще до другого пострілу. Яке рішення судді?",
   "options": [
    {
     "en": "Repeat; nothing kept",
     "uk": "Повтор; нічого не зберігають"
    },
    {
     "en": "One and zero, the double stands",
     "uk": "One та zero, дуплет не повторюють"
    },
    {
     "en": "One and one, the double stands",
     "uk": "One та one, дуплет не повторюють"
    },
    {
     "en": "Repeat; the first target's 'one' is kept",
     "uk": "Повтор; «one» за першу мішень зберігають"
    }
   ],
   "answer": 3,
   "explain_en": "Here the second clay was broken by a piece of the first, not by a shot, before the second shot was fired. So it is not 'one and one': the double is repeated and the first target's result is kept. It is different when one shot breaks both clays: then it is one and one.",
   "explain_uk": "Тут другу тарілку розбив уламок першої, а не постріл, і сталося це до другого пострілу. Тому це не «one та one»: дуплет повторюють, а результат першої мішені зберігають. Інша річ, коли один постріл розбиває обидві тарілки: тоді one та one.",
   "refs": [
    "ch6-nobird-target-doubles"
   ],
   "sim": {
    "type": "pair",
    "kind": "report"
   }
  },
  {
   "id": "sp-q013",
   "type": "decision",
   "level": 2,
   "topic": "Doubles",
   "q_en": "Simultaneous double. One of the two clays comes out on an irregular trajectory; the shooter breaks the other one. What is the referee's decision?",
   "q_uk": "Simultaneous double. Одна з двох тарілок летить нерегулярно; другу стрілець розбиває. Яке рішення судді?",
   "options": [
    {
     "en": "Double repeated with no score recorded",
     "uk": "Дуплет повторюють, результат не записують"
    },
    {
     "en": "One and zero",
     "uk": "One та zero"
    },
    {
     "en": "One for the regular target, the irregular one repeated",
     "uk": "One за правильну, неправильну повторюють"
    }
   ],
   "answer": 0,
   "explain_en": "On simultaneous and rafale doubles an irregular target means the double is repeated and no score is established.",
   "explain_uk": "У simultaneous і rafale double нерегулярна мішень означає повтор дуплета без фіксації результату.",
   "refs": [
    "ch6-nobird-target-doubles"
   ],
   "sim": {
    "type": "pair",
    "kind": "simultaneous"
   }
  },
  {
   "id": "sp-q014",
   "type": "decision",
   "level": 3,
   "topic": "Rabbit",
   "q_en": "Rabbit target as a single. The first shot misses, and the rabbit then hits a stone and breaks before the shooter fires the second barrel. What is the referee's decision?",
   "q_uk": "Rabbit як одиночна мішень. Перший постріл — промах, потім «кролик» ударяється об камінь і розбивається ще до другого пострілу. Яке рішення судді?",
   "options": [
    {
     "en": "Zero: the first shot already missed",
     "uk": "Zero: перший постріл уже був промахом"
    },
    {
     "en": "No Bird; on the repeat only the second shot counts",
     "uk": "No Bird; на повторі зараховують лише другий постріл"
    },
    {
     "en": "One: the rabbit broke, so it counts",
     "uk": "One: кролик розбився, тож зараховують"
    }
   ],
   "answer": 1,
   "explain_en": "This is a No Bird and the rabbit is repeated, but on the repeat only a break with the second shot counts; breaking it with the first shot scores zero.",
   "explain_uk": "Це No Bird, «кролика» повторюють, але на повторі зараховується лише розбиття другим пострілом; розбиття першим — zero.",
   "refs": [
    "ch6-nobird-target-single-rabbit"
   ],
   "sim": {
    "type": "flight",
    "preset": "rabbit"
   }
  },
  {
   "id": "sp-q015",
   "type": "decision",
   "level": 2,
   "topic": "Malfunctions",
   "q_en": "First gun problem of the round: on a single the first cartridge misfires. The shooter stays still, gun pointing down range, and does not fire the second barrel. The referee checks the gun. What is the referee's decision?",
   "q_uk": "Перша несправність у раунді: на одиночній мішені перший патрон дає осічку. Стрілець стоїть нерухомо, рушниця спрямована в поле, другим стволом не стріляє. Суддя оглядає рушницю. Яке рішення судді?",
   "options": [
    {
     "en": "No Bird with a warning; the target is repeated",
     "uk": "No Bird із попередженням; мішень повторюють"
    },
    {
     "en": "Zero, and a warning for the misfire",
     "uk": "Zero і попередження за осічку"
    },
    {
     "en": "No Bird, no warning; the target is repeated",
     "uk": "No Bird без попередження; мішень повторюють"
    }
   ],
   "answer": 0,
   "explain_en": "The first gun or ammunition incident in a round brings a warning and a No Bird, and the single is repeated. Further incidents in that round are scored zero.",
   "explain_uk": "Перша несправність рушниці чи набою в раунді — попередження і No Bird, одиночну мішень повторюють. Подальші такі випадки в цьому раунді — zero.",
   "refs": [
    "ch6-nobird-gun-rules",
    "ch6-malfunction-first-shot"
   ]
  },
  {
   "id": "sp-q016",
   "type": "decision",
   "level": 2,
   "topic": "Malfunctions",
   "q_en": "Earlier in this round the shooter already had one misfire on the first shot (first incident, warning). Now the first shot misfires again on a single, and the shooter waits correctly for the referee's check. What is the referee's decision?",
   "q_uk": "Раніше в цій серії стрілець уже мав одну осічку першого пострілу (перший випадок, попередження). Тепер на одиночній мішені перший постріл знову дає осічку, і стрілець правильно чекає огляду судді. Яке рішення судді?",
   "options": [
    {
     "en": "No Bird, the target is repeated",
     "uk": "No Bird — мішень повторюють"
    },
    {
     "en": "Zero (lost)",
     "uk": "Zero — мішень не зарахована"
    },
    {
     "en": "No Bird, but this time with a yellow card",
     "uk": "No Bird, але цього разу з жовтою карткою"
    }
   ],
   "answer": 1,
   "explain_en": "From the second gun or ammunition incident in the same round the target is no longer repeated: it is scored zero.",
   "explain_uk": "Починаючи з другої несправності рушниці чи набою в тому самому раунді мішень уже не повторюють — її зараховують як zero.",
   "refs": [
    "ch6-second-malfunction",
    "ch7-malfunction-procedure"
   ]
  },
  {
   "id": "sp-q017",
   "type": "decision",
   "level": 1,
   "topic": "Malfunctions",
   "q_en": "The cartridge misfires. Annoyed, the shooter immediately breaks the gun open to look at the primer before the referee comes over. What is the referee's decision?",
   "q_uk": "Патрон дає осічку. Роздратований стрілець одразу відкриває рушницю, щоб подивитися на капсуль, ще до того як підійшов суддя. Яке рішення судді?",
   "options": [
    {
     "en": "No Bird, the target is repeated",
     "uk": "No Bird — мішень повторюють"
    },
    {
     "en": "No Bird, if it is the first incident of the round",
     "uk": "No Bird, якщо це перша несправність у раунді"
    },
    {
     "en": "Zero (lost)",
     "uk": "Zero — мішень не зарахована"
    }
   ],
   "answer": 2,
   "explain_en": "After a malfunction the shooter must stay in place with the gun pointing down range and not open it or touch the safety until the referee has checked it. Otherwise the target is zero.",
   "explain_uk": "Після несправності стрілець має стояти на місці, рушниця в бік поля, не відкривати її й не торкатися запобіжника до огляду судді. Інакше мішень — zero.",
   "refs": [
    "ch8-malfunction-stay-put",
    "ch6-target-zero"
   ]
  },
  {
   "id": "sp-q018",
   "type": "decision",
   "level": 3,
   "topic": "Malfunctions",
   "q_en": "Single target, first incident of the round. The first barrel fails, but the shooter manages to fire the second barrel and misses. What is the referee's decision?",
   "q_uk": "Одиночна мішень, перша несправність у раунді. Перший ствол не стріляє, але стрілець встигає вистрілити другим і промахується. Яке рішення судді?",
   "options": [
    {
     "en": "No Bird, the target is repeated",
     "uk": "No Bird — мішень повторюють"
    },
    {
     "en": "The target is repeated with one cartridge",
     "uk": "Мішень повторюють з одним патроном"
    },
    {
     "en": "Zero (lost)",
     "uk": "Zero — мішень не зарахована"
    }
   ],
   "answer": 2,
   "explain_en": "A first-shot failure is normally a No Bird, but if the shooter still fires the second shot, that shot counts and the target is scored as it falls: here zero.",
   "explain_uk": "Відмова першого пострілу зазвичай дає No Bird, але якщо стрілець усе ж зробив другий постріл, він рахується і мішень оцінюють за результатом — тут zero.",
   "refs": [
    "ch6-malfunction-first-shot"
   ]
  },
  {
   "id": "sp-q019",
   "type": "decision",
   "level": 3,
   "topic": "Malfunctions",
   "q_en": "Single target. The first shot misses and the second cartridge misfires (first incident of the round), so the target is repeated. On the repeat the shooter breaks the clay with the first shot. What is the referee's decision?",
   "q_uk": "Одиночна мішень. Перший постріл — промах, другий патрон дає осічку (перша несправність у раунді), тож мішень повторюють. На повторі стрілець розбиває тарілку першим пострілом. Яке рішення судді?",
   "options": [
    {
     "en": "Zero (lost)",
     "uk": "Zero — мішень не зарахована"
    },
    {
     "en": "One (hit)",
     "uk": "One — мішень зарахована"
    },
    {
     "en": "No Bird, repeat again",
     "uk": "No Bird, повторити ще раз"
    }
   ],
   "answer": 0,
   "explain_en": "After a second-shot malfunction on a single, the repeat may only be broken with the second shot. A first-shot break scores zero, so the shooter must miss deliberately first.",
   "explain_uk": "Після несправності другого пострілу на одиночній мішені на повторі зараховують лише розбиття другим пострілом. Розбиття першим — zero, тож перший постріл треба навмисно пропустити повз.",
   "refs": [
    "ch6-malfunction-second-shot"
   ]
  },
  {
   "id": "sp-q020",
   "type": "decision",
   "level": 3,
   "topic": "Malfunctions",
   "q_en": "Rafale double, first incident of the round: both barrels fire together on the first clay. What is the referee's decision?",
   "q_uk": "Rafale double, перша несправність у раунді: на першій тарілці обидва стволи стріляють одночасно. Яке рішення судді?",
   "options": [
    {
     "en": "First target scored, second repeated",
     "uk": "Першу мішень зараховують, другу повторюють"
    },
    {
     "en": "The whole double is repeated, nothing recorded",
     "uk": "Весь дуплет повторюють, нічого не записують"
    },
    {
     "en": "Zero and zero",
     "uk": "Zero та zero"
    }
   ],
   "answer": 1,
   "explain_en": "On the first target of a double on report, and on simultaneous and rafale doubles, a double discharge means the whole double is repeated with no result recorded.",
   "explain_uk": "На першій мішені double on report, а також у simultaneous і rafale double одночасний постріл означає повтор усього дуплета без запису результату.",
   "refs": [
    "ch6-double-discharge"
   ],
   "sim": {
    "type": "pair",
    "kind": "rafale"
   }
  },
  {
   "id": "sp-q021",
   "type": "decision",
   "level": 3,
   "topic": "Malfunctions",
   "q_en": "Simultaneous double. The shooter already had one malfunction earlier in this round. Now the first shot misfires again and he does not fire. What is the referee's decision?",
   "q_uk": "Simultaneous double. У стрільця вже була одна несправність раніше в цьому раунді. Тепер знову осічка першого пострілу, і він не стріляє. Яке рішення судді?",
   "options": [
    {
     "en": "Zero and zero",
     "uk": "Zero та zero"
    },
    {
     "en": "Zero on one target, the other repeated",
     "uk": "Zero на одній мішені, іншу повторюють"
    },
    {
     "en": "Double repeated",
     "uk": "Дуплет повторюють"
    }
   ],
   "answer": 0,
   "explain_en": "From the second incident in a round there is no repeat. On a simultaneous or rafale double, a second failure on the first shot gives zero and zero.",
   "explain_uk": "З другої несправності в раунді повторів немає. У simultaneous чи rafale double повторна відмова першого пострілу дає zero та zero.",
   "refs": [
    "ch6-second-malfunction"
   ],
   "sim": {
    "type": "pair",
    "kind": "simultaneous"
   }
  },
  {
   "id": "sp-q022",
   "type": "decision",
   "level": 1,
   "topic": "Gun position",
   "q_en": "On the first stand of a layout, the shooter calls with the gun already mounted on the shoulder before the target appears. It is his first offence on this layout. What is the referee's decision?",
   "q_uk": "На першому стенді layout стрілець командує, вже приклавши рушницю до плеча до появи мішені. Це його перше порушення на цьому layout. Яке рішення судді?",
   "options": [
    {
     "en": "No action; gun position is free in Sporting",
     "uk": "Нічого; у Sporting положення рушниці вільне"
    },
    {
     "en": "Verbal warning with a yellow card",
     "uk": "Усне попередження з жовтою карткою"
    },
    {
     "en": "Red card and zero",
     "uk": "Червона картка і zero"
    }
   ],
   "answer": 1,
   "explain_en": "Mounting before the target appears or not taking the ready position of 3.1 brings a verbal warning backed by a yellow card the first time.",
   "explain_uk": "Прикладання рушниці до появи мішені або неправильна готова позиція (3.1) уперше караються усним попередженням із жовтою карткою.",
   "refs": [
    "ch12-yellow-card",
    "ch3-mounting",
    "ch3-ready-position"
   ]
  },
  {
   "id": "sp-q023",
   "type": "decision",
   "level": 2,
   "topic": "Gun position",
   "q_en": "Earlier on this layout the shooter got a yellow card for gun position. Two stands later the shooter again calls for a single with the stock above the line on the vest. What is the referee's decision?",
   "q_uk": "Раніше на цьому layout стрілець отримав жовту картку за положення рушниці. Через два стенди він знову викликає одиночну мішень, тримаючи приклад вище лінії на жилеті. Яке рішення судді?",
   "options": [
    {
     "en": "Red card; the target is repeated",
     "uk": "Червона картка; мішень повторюють"
    },
    {
     "en": "Another yellow card",
     "uk": "Ще одна жовта картка"
    },
    {
     "en": "Red card; the target is scored zero",
     "uk": "Червона картка; мішень — zero"
    }
   ],
   "answer": 2,
   "explain_en": "After the first warning, any further offence on the same layout gets a red card, and on a single the target is zero.",
   "explain_uk": "Після першого попередження кожне наступне порушення на тому самому layout — червона картка, на одиночній мішені — zero.",
   "refs": [
    "ch12-red-card",
    "ch3-jacket-line"
   ]
  },
  {
   "id": "sp-q024",
   "type": "decision",
   "level": 3,
   "topic": "Gun position",
   "q_en": "A shooter who already has a yellow card for gun position on this layout starts a double on report with the gun mounted before the first target appears. What is the referee's decision?",
   "q_uk": "Стрілець, який уже має на цьому layout жовту картку за положення рушниці, починає double on report з рушницею біля плеча до появи першої мішені. Яке рішення судді?",
   "options": [
    {
     "en": "Red card: zero on the first target, the second scored as shot",
     "uk": "Червона картка: zero на першій, друга — за результатом"
    },
    {
     "en": "Red card: zero and No Bird",
     "uk": "Червона картка: zero та No Bird"
    },
    {
     "en": "Zero and zero",
     "uk": "Zero та zero"
    }
   ],
   "answer": 1,
   "explain_en": "A repeat offence on the same layout is penalised with a red card: zero on a single, zero and No Bird on a double on report, zero and zero on simultaneous and rafale doubles.",
   "explain_uk": "Повторне порушення на тому самому layout карається червоною карткою: zero на одиночній, zero та No Bird на double on report, zero та zero на simultaneous і rafale double.",
   "refs": [
    "ch12-red-card"
   ],
   "sim": {
    "type": "pair",
    "kind": "report"
   }
  },
  {
   "id": "sp-q025",
   "type": "decision",
   "level": 2,
   "topic": "No Bird",
   "q_en": "The referee calls 'No Bird' on a single, but the shooter fires at the target anyway. It is the first time he has done so. What is the referee's decision?",
   "q_uk": "Суддя оголошує «No Bird» на одиночній мішені, але стрілець усе одно стріляє по ній. Так він робить уперше. Яке рішення судді?",
   "options": [
    {
     "en": "Warning; the target is repeated",
     "uk": "Попередження; мішень повторюють"
    },
    {
     "en": "One if the shooter hits it",
     "uk": "One, якщо стрілець влучив"
    },
    {
     "en": "Zero straight away, no warning",
     "uk": "Одразу zero, без попередження"
    }
   ],
   "answer": 0,
   "explain_en": "A declared No Bird must never be shot at. The first time the shooter gets a warning; only after a warning do the zero penalties of 12.2 apply.",
   "explain_uk": "По оголошеному No Bird стріляти заборонено. Уперше стрілець отримує попередження; штрафи zero за 12.2 застосовують лише після попередження.",
   "refs": [
    "ch12-shooting-nobird",
    "ch13-acceptance"
   ]
  },
  {
   "id": "sp-q026",
   "type": "decision",
   "level": 3,
   "topic": "No Bird",
   "q_en": "Already warned once for shooting at a No Bird, the shooter again fires after the referee called 'No Bird' on a simultaneous double. What is the referee's decision?",
   "q_uk": "Стрілець, якого вже попереджали за стрільбу по No Bird, знову стріляє після оголошення «No Bird» на simultaneous double. Яке рішення судді?",
   "options": [
    {
     "en": "Second warning; double repeated",
     "uk": "Друге попередження; дуплет повторюють"
    },
    {
     "en": "Zero and No Bird",
     "uk": "Zero та No Bird"
    },
    {
     "en": "Zero and zero",
     "uk": "Zero та zero"
    }
   ],
   "answer": 2,
   "explain_en": "After a warning, shooting at a declared No Bird is penalised as in 12.2: on simultaneous and rafale doubles that is zero and zero.",
   "explain_uk": "Після попередження стрільба по оголошеному No Bird карається як у 12.2: у simultaneous і rafale double — zero та zero.",
   "refs": [
    "ch12-shooting-nobird",
    "ch12-red-card"
   ],
   "sim": {
    "type": "pair",
    "kind": "simultaneous"
   }
  },
  {
   "id": "sp-q027",
   "type": "decision",
   "level": 2,
   "topic": "Time limits",
   "q_en": "Between two singles the shooter adjusts his vest, cleans his glasses and takes about 25 seconds before calling. It is the first time today. What is the referee's decision?",
   "q_uk": "Між двома одиночними мішенями стрілець поправляє жилет, протирає окуляри й викликає мішень лише приблизно через 25 секунд. Сьогодні це вперше. Яке рішення судді?",
   "options": [
    {
     "en": "Nothing; there is no time limit",
     "uk": "Нічого; обмеження часу немає"
    },
    {
     "en": "Zero on the next target",
     "uk": "Zero на наступній мішені"
    },
    {
     "en": "Warning",
     "uk": "Попередження"
    }
   ],
   "answer": 2,
   "explain_en": "The limit is 15 seconds between singles or between doubles. Exceeding it first earns a warning; after that the penalties of 12.2 apply.",
   "explain_uk": "Між одиночними мішенями чи дуплетами — не більше 15 секунд. Перше перевищення — попередження, далі застосовують штрафи за 12.2.",
   "refs": [
    "ch7-fifteen-seconds"
   ]
  },
  {
   "id": "sp-q028",
   "type": "decision",
   "level": 2,
   "topic": "Safety",
   "q_en": "When his name is called, a shooter steps onto the stand without safety glasses and says he forgot them in the car. What is the referee's decision?",
   "q_uk": "Коли викликають його ім’я, стрілець виходить на стенд без захисних окулярів і каже, що забув їх в авто. Яке рішення судді?",
   "options": [
    {
     "en": "Treated as absent: rule 16.7 applies",
     "uk": "Вважається відсутнім: діє правило 16.7"
    },
    {
     "en": "Immediate expulsion from the competition",
     "uk": "Негайне виключення зі змагання"
    },
    {
     "en": "May shoot this stand, then fetch them",
     "uk": "Може відстріляти цей стенд, а потім принести їх"
    }
   ],
   "answer": 0,
   "explain_en": "Safety glasses are compulsory with no exceptions. A shooter on the stand without them is treated as absent, and Article 16.7 applies.",
   "explain_uk": "Захисні окуляри обов’язкові без винятків. Стрільця на стенді без них вважають відсутнім і застосовують статтю 16.7.",
   "refs": [
    "ch8-safety-glasses",
    "ch16-late-shooter"
   ]
  },
  {
   "id": "sp-q029",
   "type": "decision",
   "level": 2,
   "topic": "Influencing the referee",
   "q_en": "The referee scores a target zero. Another member of the squad loudly says 'That was clearly hit, I saw a piece!' without being asked. What is the referee's decision?",
   "q_uk": "Суддя оцінює мішень як zero. Інший учасник squad без запиту голосно каже: «Було влучання, я бачив уламок!» Яке рішення судді?",
   "options": [
    {
     "en": "The referee must change the ruling to one",
     "uk": "Суддя має змінити рішення на one"
    },
    {
     "en": "The ruling stands; open criticism counts as influencing",
     "uk": "Рішення залишається; відкрита критика — це спроба впливу"
    },
    {
     "en": "The target becomes No Bird and is repeated",
     "uk": "Мішень стає No Bird і її повторюють"
    }
   ],
   "answer": 1,
   "explain_en": "The referee decides alone. Squad members have no right to step in, and openly criticising a decision without being asked counts as trying to influence the referee (penalties in chapter 13).",
   "explain_uk": "Суддя вирішує одноосібно. Учасники squad не мають права втручатися, а відкрита критика рішення без запиту вважається спробою вплинути на суддю (санкції розділу 13).",
   "refs": [
    "ch6-referee-alone",
    "ch11-influence"
   ]
  },
  {
   "id": "sp-q030",
   "type": "decision",
   "level": 1,
   "topic": "Appeals",
   "q_en": "A shooter thinks his last target was hit, but says nothing, calls for the next target and only then protests about the previous one. What is the referee's decision?",
   "q_uk": "Стрілець вважає, що попередня мішень була уражена, але мовчить, викликає наступну і лише тоді протестує щодо попередньої. Яке рішення судді?",
   "options": [
    {
     "en": "The protest goes to the jury",
     "uk": "Протест передають журі"
    },
    {
     "en": "The protest is heard and the referee reconsiders",
     "uk": "Протест розглядають, суддя переглядає рішення"
    },
    {
     "en": "Too late: by calling the next target he accepted the ruling",
     "uk": "Запізно: викликавши наступну мішень, він прийняв рішення"
    }
   ],
   "answer": 2,
   "explain_en": "A new call means the shooter accepts how the previous target was scored. A shooter who disagrees has to say so before calling again.",
   "explain_uk": "Нова команда означає, що стрілець погоджується з оцінкою попередньої мішені. Хто не згоден, має сказати про це до наступної команди.",
   "refs": [
    "ch9-no-checking-targets",
    "ch9-how-to-appeal"
   ]
  },
  {
   "id": "sp-q031",
   "type": "decision",
   "level": 2,
   "topic": "Appeals",
   "q_en": "A crossing target is broken just behind a tree. The referee rules it was shot behind a natural obstacle and scores zero. The shooter wants to appeal. What is the referee's decision?",
   "q_uk": "Перехресну мішень розбивають одразу за деревом. Суддя вирішує, що постріл зроблено за природною перешкодою, і ставить zero. Стрілець хоче оскаржити. Яке рішення судді?",
   "options": [
    {
     "en": "The target is repeated as No Bird",
     "uk": "Мішень повторюють як No Bird"
    },
    {
     "en": "No appeal is possible against this ruling",
     "uk": "Це рішення оскаржити не можна"
    },
    {
     "en": "Written appeal to the jury with a 40% deposit",
     "uk": "Письмова апеляція до журі із заставою 40%"
    }
   ],
   "answer": 1,
   "explain_en": "It is up to the shooter to break targets where the referee can see them. A ruling that a target was shot behind an obstacle or beyond a limit cannot be appealed.",
   "explain_uk": "Розбивати мішені там, де їх бачить суддя, — обов’язок стрільця. Рішення про постріл за перешкодою чи за межею оскарженню не підлягає.",
   "refs": [
    "ch9-visible-break"
   ],
   "sim": {
    "type": "flight",
    "preset": "crosser-lr"
   }
  },
  {
   "id": "sp-q032",
   "type": "decision",
   "level": 2,
   "topic": "Late shooter",
   "q_en": "A shooter arrives at the layout while his squad is still shooting the singles on stand 1, before his turn has come. What is the referee's decision?",
   "q_uk": "Стрілець приходить на layout, коли його squad ще стріляє одиночні мішені на стенді 1 і його черга ще не настала. Яке рішення судді?",
   "options": [
    {
     "en": "He joins without penalty",
     "uk": "Приєднується без штрафу"
    },
    {
     "en": "His stand 1 singles are scored zero",
     "uk": "Його одиночні мішені на стенді 1 — zero"
    },
    {
     "en": "He must shoot the layout in another squad",
     "uk": "Має стріляти layout в іншому squad"
    }
   ],
   "answer": 0,
   "explain_en": "A late shooter who arrives before missing his turn on the singles of the first stand joins the squad without penalty.",
   "explain_uk": "Стрілець, який запізнився, але прийшов до своєї черги на одиночних мішенях першого стенда, приєднується без штрафу.",
   "refs": [
    "ch16-late-shooter"
   ]
  },
  {
   "id": "sp-q033",
   "type": "decision",
   "level": 2,
   "topic": "Late shooter",
   "q_en": "The referee called a shooter's name and number three times within a minute. He arrives as the squad moves on to stand 2. What is the referee's decision?",
   "q_uk": "Суддя тричі протягом хвилини викликав ім’я та номер стрільця. Той з’являється, коли squad переходить на стенд 2. Яке рішення судді?",
   "options": [
    {
     "en": "He may re-shoot the whole layout in another squad",
     "uk": "Може перестріляти весь layout в іншому squad"
    },
    {
     "en": "He shoots stand 1 after the others, then continues",
     "uk": "Стріляє стенд 1 після інших, потім продовжує"
    },
    {
     "en": "He continues from stand 2; all stand 1 targets are zero",
     "uk": "Продовжує зі стенда 2; усі мішені стенда 1 — zero"
    }
   ],
   "answer": 2,
   "explain_en": "Joining at a later stand, all targets not shot on earlier stands are zero, and a layout with missed stands can never be shot in another squad.",
   "explain_uk": "Якщо стрілець приєднується на наступному стенді, усі невідстріляні мішені попередніх стендів — zero, а layout із пропущеними стендами в іншому squad стріляти не можна.",
   "refs": [
    "ch16-late-shooter"
   ]
  },
  {
   "id": "sp-q034",
   "type": "number",
   "level": 1,
   "topic": "Layouts",
   "q_en": "How many targets does one Sporting layout give, and how are they split?",
   "q_uk": "Скільки мішеней дає один layout Sporting і як вони розподіляються?",
   "options": [
    {
     "en": "25: 15 singles and 5 doubles",
     "uk": "25: 15 одиночних і 5 дуплетів"
    },
    {
     "en": "25: 10 singles and 5 doubles, plus 5 rabbits",
     "uk": "25: 10 одиночних, 5 дуплетів і 5 «кроликів»"
    },
    {
     "en": "20: 10 singles and 5 doubles",
     "uk": "20: 10 одиночних і 5 дуплетів"
    },
    {
     "en": "30: 20 singles and 5 doubles",
     "uk": "30: 20 одиночних і 5 дуплетів"
    }
   ],
   "answer": 0,
   "explain_en": "Every layout type gives 25 targets: 15 singles and 5 doubles (15 + 10 = 25).",
   "explain_uk": "Кожен тип layout дає 25 мішеней: 15 одиночних і 5 дуплетів (15 + 10 = 25).",
   "refs": [
    "ch2-traps-table"
   ]
  },
  {
   "id": "sp-q035",
   "type": "number",
   "level": 1,
   "topic": "Gun position",
   "q_en": "How far below the shoulder axis is the reference line on the shooter's vest drawn?",
   "q_uk": "На якій відстані нижче осі плечей наносять контрольну лінію на жилеті стрільця?",
   "options": [
    {
     "en": "15 cm",
     "uk": "15 см"
    },
    {
     "en": "20 cm",
     "uk": "20 см"
    },
    {
     "en": "25 cm",
     "uk": "25 см"
    },
    {
     "en": "30 cm",
     "uk": "30 см"
    }
   ],
   "answer": 2,
   "explain_en": "The line is 25 cm (9.85 inches) below the shoulder axis, parallel to it and in a contrasting colour.",
   "explain_uk": "Лінія проходить на 25 см (9,85 дюйма) нижче осі плечей, паралельно їй, і має контрастний колір.",
   "refs": [
    "ch3-jacket-line"
   ]
  },
  {
   "id": "sp-q036",
   "type": "number",
   "level": 1,
   "topic": "Calling the target",
   "q_en": "Within how many seconds of the referee's signal must the target be released?",
   "q_uk": "Протягом скількох секунд після сигналу судді мішень має вилетіти?",
   "options": [
    {
     "en": "1 second",
     "uk": "1 секунда"
    },
    {
     "en": "3 seconds",
     "uk": "3 секунди"
    },
    {
     "en": "5 seconds",
     "uk": "5 секунд"
    },
    {
     "en": "10 seconds",
     "uk": "10 секунд"
    }
   ],
   "answer": 1,
   "explain_en": "The target must be thrown within three seconds of the referee's audio signal; a later target is a No Bird.",
   "explain_uk": "Мішень має вилетіти протягом трьох секунд після звукового сигналу судді; пізніша мішень — No Bird.",
   "refs": [
    "ch5-call-and-release"
   ]
  },
  {
   "id": "sp-q037",
   "type": "number",
   "level": 2,
   "topic": "Doubles",
   "q_en": "In a double on report, when is the second target released?",
   "q_uk": "Коли вилітає друга мішень у double on report?",
   "options": [
    {
     "en": "Exactly at the same time as the first",
     "uk": "Одночасно з першою"
    },
    {
     "en": "Between 0 and 3 seconds after the shot at the first",
     "uk": "Від 0 до 3 секунд після пострілу по першій"
    },
    {
     "en": "Between 3 and 5 seconds after the first target is thrown",
     "uk": "Через 3–5 секунд після вильоту першої"
    },
    {
     "en": "When the shooter calls a second time",
     "uk": "Коли стрілець командує вдруге"
    }
   ],
   "answer": 1,
   "explain_en": "In a double on report the shot at the first target sets off the second one: it comes out 0 to 3 seconds after that shot.",
   "explain_uk": "У double on report другу мішень запускає постріл по першій: вона вилітає через 0–3 секунди після цього пострілу.",
   "refs": [
    "ch4-double-on-report"
   ],
   "sim": {
    "type": "pair",
    "kind": "report"
   }
  },
  {
   "id": "sp-q038",
   "type": "number",
   "level": 1,
   "topic": "Time limits",
   "q_en": "What is the maximum time allowed between single targets or between doubles?",
   "q_uk": "Який максимальний час дозволений між одиночними мішенями або між дуплетами?",
   "options": [
    {
     "en": "10 seconds",
     "uk": "10 секунд"
    },
    {
     "en": "15 seconds",
     "uk": "15 секунд"
    },
    {
     "en": "30 seconds",
     "uk": "30 секунд"
    },
    {
     "en": "1 minute",
     "uk": "1 хвилина"
    }
   ],
   "answer": 1,
   "explain_en": "A shooter has at most 15 seconds; the first time over the limit is a warning, then 12.2 penalties apply.",
   "explain_uk": "Стрілець має щонайбільше 15 секунд; перше перевищення — попередження, далі штрафи за 12.2.",
   "refs": [
    "ch7-fifteen-seconds"
   ]
  },
  {
   "id": "sp-q039",
   "type": "number",
   "level": 2,
   "topic": "Refusal to comply",
   "q_en": "After the referee's final decision on a protest, within how many seconds must the shooter resume shooting?",
   "q_uk": "Протягом скількох секунд після остаточного рішення судді щодо протесту стрілець має відновити стрільбу?",
   "options": [
    {
     "en": "5 seconds",
     "uk": "5 секунд"
    },
    {
     "en": "15 seconds",
     "uk": "15 секунд"
    },
    {
     "en": "30 seconds",
     "uk": "30 секунд"
    },
    {
     "en": "60 seconds",
     "uk": "60 секунд"
    }
   ],
   "answer": 1,
   "explain_en": "The shooter must resume within 15 seconds; otherwise it counts as refusal to comply and Chapter 13 penalties apply.",
   "explain_uk": "Стрілець має відновити стрільбу протягом 15 секунд, інакше це відмова виконувати рішення і застосовують штрафи розділу 13.",
   "refs": [
    "ch10-resume-15s"
   ]
  },
  {
   "id": "sp-q040",
   "type": "number",
   "level": 1,
   "topic": "Ammunition",
   "q_en": "What is the maximum shot load of a Sporting cartridge?",
   "q_uk": "Яка максимальна навіска дробу в патроні для Sporting?",
   "options": [
    {
     "en": "24 g",
     "uk": "24 г"
    },
    {
     "en": "28 g",
     "uk": "28 г"
    },
    {
     "en": "32 g",
     "uk": "32 г"
    },
    {
     "en": "36 g",
     "uk": "36 г"
    }
   ],
   "answer": 1,
   "explain_en": "A cartridge may carry at most 28 g of lead shot; a tolerance of up to +2% is accepted.",
   "explain_uk": "Патрон може містити щонайбільше 28 г свинцевого дробу; допускається до +2%.",
   "refs": [
    "ch7-cartridges"
   ]
  },
  {
   "id": "sp-q041",
   "type": "number",
   "level": 2,
   "topic": "Ammunition",
   "q_en": "Which pellet diameter range is permitted?",
   "q_uk": "Який діаметр дробин дозволений?",
   "options": [
    {
     "en": "1.5 to 2.0 mm",
     "uk": "1,5–2,0 мм"
    },
    {
     "en": "2.0 to 2.5 mm (±0.1 mm)",
     "uk": "2,0–2,5 мм (±0,1 мм)"
    },
    {
     "en": "2.5 to 3.0 mm",
     "uk": "2,5–3,0 мм"
    },
    {
     "en": "Any size up to 3.5 mm",
     "uk": "Будь-який до 3,5 мм"
    }
   ],
   "answer": 1,
   "explain_en": "Pellets must be spherical, 2.0 to 2.5 mm in diameter, with a tolerance of ±0.1 mm.",
   "explain_uk": "Дробини мають бути сферичними, діаметром 2,0–2,5 мм, з допуском ±0,1 мм.",
   "refs": [
    "ch7-cartridges"
   ]
  },
  {
   "id": "sp-q042",
   "type": "number",
   "level": 1,
   "topic": "Guns",
   "q_en": "What is the minimum barrel length and the largest calibre allowed?",
   "q_uk": "Яка мінімальна довжина стволів і найбільший дозволений калібр?",
   "options": [
    {
     "en": "60 cm, 10 gauge",
     "uk": "60 см, 10 калібр"
    },
    {
     "en": "66 cm, 12 gauge",
     "uk": "66 см, 12 калібр"
    },
    {
     "en": "71 cm, 12 gauge",
     "uk": "71 см, 12 калібр"
    },
    {
     "en": "76 cm, 20 gauge",
     "uk": "76 см, 20 калібр"
    }
   ],
   "answer": 1,
   "explain_en": "Barrels must be at least 66 cm long and the calibre may not exceed 12 gauge.",
   "explain_uk": "Стволи мають бути не коротші за 66 см, калібр — не більший за 12.",
   "refs": [
    "ch7-permitted-guns"
   ]
  },
  {
   "id": "sp-q043",
   "type": "number",
   "level": 1,
   "topic": "Loading",
   "q_en": "How many cartridges may a semi-automatic hold on the stand?",
   "q_uk": "Скільки набоїв може бути в напівавтоматі на стенді?",
   "options": [
    {
     "en": "1",
     "uk": "1"
    },
    {
     "en": "2",
     "uk": "2"
    },
    {
     "en": "3",
     "uk": "3"
    },
    {
     "en": "As many as the magazine takes",
     "uk": "Скільки вміщує магазин"
    }
   ],
   "answer": 1,
   "explain_en": "A semi-automatic may hold no more than two cartridges, loaded only on the stand with the referee's permission.",
   "explain_uk": "У напівавтоматі може бути не більше двох набоїв; заряджають лише на стенді з дозволу судді.",
   "refs": [
    "ch8-loading"
   ]
  },
  {
   "id": "sp-q044",
   "type": "number",
   "level": 2,
   "topic": "Appeals",
   "q_en": "What deposit must accompany a written appeal to the jury?",
   "q_uk": "Яку заставу треба внести разом із письмовою апеляцією до журі?",
   "options": [
    {
     "en": "20% of the entry fee",
     "uk": "20% стартового внеску"
    },
    {
     "en": "40% of the entry fee",
     "uk": "40% стартового внеску"
    },
    {
     "en": "50% of the entry fee",
     "uk": "50% стартового внеску"
    },
    {
     "en": "The full entry fee",
     "uk": "Увесь стартовий внесок"
    }
   ],
   "answer": 1,
   "explain_en": "An appeal to the jury is made in writing with a deposit equal to 40% of the entry fee.",
   "explain_uk": "Апеляцію до журі подають письмово із заставою в розмірі 40% стартового внеску.",
   "refs": [
    "ch9-jury-appeal"
   ]
  },
  {
   "id": "sp-q045",
   "type": "number",
   "level": 1,
   "topic": "Squads",
   "q_en": "What is the maximum number of shooters in a squad?",
   "q_uk": "Скільки стрільців щонайбільше може бути в одному squad?",
   "options": [
    {
     "en": "4",
     "uk": "4"
    },
    {
     "en": "5",
     "uk": "5"
    },
    {
     "en": "6",
     "uk": "6"
    },
    {
     "en": "8",
     "uk": "8"
    }
   ],
   "answer": 2,
   "explain_en": "A squad has at most six shooters, formed by draw.",
   "explain_uk": "Squad налічує щонайбільше шість стрільців, її формують жеребкуванням.",
   "refs": [
    "ch4-glossary",
    "ch16-squads"
   ]
  },
  {
   "id": "sp-q046",
   "type": "number",
   "level": 1,
   "topic": "Championship",
   "q_en": "How many targets make up an international Sporting competition?",
   "q_uk": "Скільки мішеней становить міжнародне змагання зі Sporting?",
   "options": [
    {
     "en": "100",
     "uk": "100"
    },
    {
     "en": "150",
     "uk": "150"
    },
    {
     "en": "200",
     "uk": "200"
    },
    {
     "en": "250",
     "uk": "250"
    }
   ],
   "answer": 2,
   "explain_en": "An international competition is 200 targets, shot in rounds of 25; only the jury may change this in exceptional cases.",
   "explain_uk": "Міжнародне змагання — 200 мішеней раундами по 25; змінити це може лише журі у виняткових випадках.",
   "refs": [
    "ch16-format"
   ]
  },
  {
   "id": "sp-q047",
   "type": "number",
   "level": 2,
   "topic": "Interruptions",
   "q_en": "After how long an interruption must the referee show the stand's targets to the shooters again?",
   "q_uk": "Після якої тривалості перерви суддя має знову показати стрільцям мішені стенда?",
   "options": [
    {
     "en": "More than 5 minutes",
     "uk": "Понад 5 хвилин"
    },
    {
     "en": "More than 10 minutes",
     "uk": "Понад 10 хвилин"
    },
    {
     "en": "More than 15 minutes",
     "uk": "Понад 15 хвилин"
    },
    {
     "en": "More than 30 minutes",
     "uk": "Понад 30 хвилин"
    }
   ],
   "answer": 1,
   "explain_en": "If a trap breaks down or shooting stops for more than 10 minutes, the targets of that stand are shown again.",
   "explain_uk": "Якщо машинка зламалася або стрільбу зупинено більш ніж на 10 хвилин, мішені стенда показують знову.",
   "refs": [
    "ch16-long-interruption",
    "ch5-weather-interruption"
   ]
  },
  {
   "id": "sp-q048",
   "type": "number",
   "level": 2,
   "topic": "Late shooter",
   "q_en": "How does the referee call a shooter who is not present at the stand?",
   "q_uk": "Як суддя викликає стрільця, якого немає біля стенда?",
   "options": [
    {
     "en": "Name once, then the shooter is absent",
     "uk": "Ім’я один раз, після чого стрільця вважають відсутнім"
    },
    {
     "en": "Name and number 3 times within 1 minute",
     "uk": "Ім’я та номер 3 рази протягом 1 хвилини"
    },
    {
     "en": "Name and number 3 times within 3 minutes",
     "uk": "Ім’я та номер 3 рази протягом 3 хвилин"
    },
    {
     "en": "Through the loudspeaker, waiting 5 minutes",
     "uk": "Через гучномовець з очікуванням 5 хвилин"
    }
   ],
   "answer": 1,
   "explain_en": "The referee calls the shooter's name and number three times within one minute.",
   "explain_uk": "Суддя тричі протягом однієї хвилини називає ім’я та номер стрільця.",
   "refs": [
    "ch16-late-shooter"
   ]
  },
  {
   "id": "sp-q049",
   "type": "number",
   "level": 2,
   "topic": "Presentation",
   "q_en": "At the presentation, how many times can the shooter on the stand ask to see a target again?",
   "q_uk": "Скільки разів під час показу стрілець на стенді може попросити повторно показати мішень?",
   "options": [
    {
     "en": "Once per stand",
     "uk": "Один раз на стенд"
    },
    {
     "en": "Up to 2 per menu target",
     "uk": "До 2 разів на мішень меню"
    },
    {
     "en": "Up to 3 per trap",
     "uk": "До 3 разів на машинку"
    },
    {
     "en": "As often as needed",
     "uk": "Скільки завгодно"
    }
   ],
   "answer": 1,
   "explain_en": "If the shooter on the stand asks, the referee shows the trajectories again, but no more than two targets for each target of the menu.",
   "explain_uk": "Якщо стрілець на стенді попросить, суддя показує траєкторії ще раз, але не більше двох мішеней на кожну мішень меню.",
   "refs": [
    "ch16-presentation"
   ]
  },
  {
   "id": "sp-q050",
   "type": "number",
   "level": 2,
   "topic": "Shoot-offs",
   "q_en": "For an unscheduled shoot-off, within how long of being called must the shooters be ready?",
   "q_uk": "За який час після виклику учасники незапланованої перестрілки мають бути готові стріляти?",
   "options": [
    {
     "en": "5 minutes",
     "uk": "5 хвилин"
    },
    {
     "en": "15 minutes",
     "uk": "15 хвилин"
    },
    {
     "en": "30 minutes",
     "uk": "30 хвилин"
    },
    {
     "en": "1 hour",
     "uk": "1 година"
    }
   ],
   "answer": 1,
   "explain_en": "Shooters must stay in touch with the jury so they can shoot within 15 minutes of being called; anyone absent is disqualified.",
   "explain_uk": "Стрільці мають бути на зв’язку з журі, щоб вийти на стрільбу протягом 15 хвилин після виклику; відсутніх дискваліфікують.",
   "refs": [
    "ch18-squad-and-timing"
   ]
  },
  {
   "id": "sp-q051",
   "type": "number",
   "level": 3,
   "topic": "Organisation",
   "q_en": "A federation wants an international championship on a ground not yet approved. How far in advance must it present the ground to FITASC?",
   "q_uk": "Федерація хоче провести міжнародний чемпіонат на ще не затвердженому стрільбищі. За скільки часу треба представити його FITASC?",
   "options": [
    {
     "en": "At least 3 months",
     "uk": "Щонайменше за 3 місяці"
    },
    {
     "en": "At least 6 months",
     "uk": "Щонайменше за 6 місяців"
    },
    {
     "en": "At least 8 months",
     "uk": "Щонайменше за 8 місяців"
    },
    {
     "en": "At least 12 months",
     "uk": "Щонайменше за 12 місяців"
    }
   ],
   "answer": 2,
   "explain_en": "A FITASC representative must see the ground and the organisation plan no later than eight months before the competition.",
   "explain_uk": "Представник FITASC має побачити стрільбище й план організації не пізніше ніж за вісім місяців до змагання.",
   "refs": [
    "ch15-layout-approval"
   ]
  },
  {
   "id": "sp-q052",
   "type": "number",
   "level": 3,
   "topic": "Layouts",
   "q_en": "What share of targets must an average shooter break for a trajectory to be class B?",
   "q_uk": "Який відсоток мішеней має розбивати середній стрілець, щоб траєкторія належала до класу B?",
   "options": [
    {
     "en": "More than 80%",
     "uk": "Понад 80%"
    },
    {
     "en": "60% to 80%",
     "uk": "60–80%"
    },
    {
     "en": "40% to 60%",
     "uk": "40–60%"
    },
    {
     "en": "Less than 40%",
     "uk": "Менше 40%"
    }
   ],
   "answer": 1,
   "explain_en": "Class A is more than 80%, class B 60% to 80%, class C 40% to 60%. The recommended stand mix is one A, two B and one C.",
   "explain_uk": "Клас A — понад 80%, клас B — 60–80%, клас C — 40–60%. Рекомендований склад стенда: одна A, дві B і одна C.",
   "refs": [
    "ch2-difficulty-classes"
   ]
  },
  {
   "id": "sp-q053",
   "type": "number",
   "level": 3,
   "topic": "Penalties",
   "q_en": "An expulsion is kept on record by FITASC for how long, and within what period can a second expulsion lead to a permanent ban?",
   "q_uk": "Скільки часу FITASC зберігає запис про виключення і протягом якого строку друге виключення може призвести до довічної заборони?",
   "options": [
    {
     "en": "Kept 3 years; second within 1 year",
     "uk": "Зберігають 3 роки; друге протягом 1 року"
    },
    {
     "en": "Kept 5 years; second within 3 years",
     "uk": "Зберігають 5 років; друге протягом 3 років"
    },
    {
     "en": "Kept 10 years; second within 5 years",
     "uk": "Зберігають 10 років; друге протягом 5 років"
    },
    {
     "en": "Kept for life; any second expulsion",
     "uk": "Зберігають довічно; будь-яке друге виключення"
    }
   ],
   "answer": 1,
   "explain_en": "The record is kept for five years; a second expulsion within three years may lead to a permanent ban, decided only by the FITASC Management Committee.",
   "explain_uk": "Запис зберігають п’ять років; друге виключення протягом трьох років може спричинити довічну заборону, яку ухвалює лише Management Committee FITASC.",
   "refs": [
    "ch13-expulsion-record"
   ]
  },
  {
   "id": "sp-q054",
   "type": "truefalse",
   "level": 1,
   "topic": "Definition",
   "q_en": "Because Sporting imitates hunting, shooting at live animals may be included in a Sporting event.",
   "q_uk": "Оскільки Sporting імітує полювання, стрільба по живих тваринах може бути частиною змагання.",
   "options": [
    {
     "en": "True",
     "uk": "Правда"
    },
    {
     "en": "False",
     "uk": "Неправда"
    }
   ],
   "answer": 1,
   "explain_en": "False. Sporting is shot at artificial clay targets, and shooting at live animals is not allowed in this discipline.",
   "explain_uk": "Неправда. У Sporting стріляють по штучних мішенях, а стрільба по живих тваринах у цій дисципліні заборонена.",
   "refs": [
    "ch1-safety-environment",
    "ch1-definition"
   ]
  },
  {
   "id": "sp-q055",
   "type": "truefalse",
   "level": 1,
   "topic": "Guns",
   "q_en": "A pump-action shotgun is allowed in Sporting, as long as it is 12 gauge or smaller.",
   "q_uk": "Помпова рушниця дозволена у Sporting, якщо її калібр 12 або менший.",
   "options": [
    {
     "en": "True",
     "uk": "Правда"
    },
    {
     "en": "False",
     "uk": "Неправда"
    }
   ],
   "answer": 1,
   "explain_en": "False. Any hunting shotgun, including semi-automatics, may be used, but pump-action guns are not allowed.",
   "explain_uk": "Неправда. Можна використовувати будь-яку мисливську рушницю, зокрема напівавтомат, але помпові рушниці заборонені.",
   "refs": [
    "ch7-permitted-guns"
   ]
  },
  {
   "id": "sp-q056",
   "type": "truefalse",
   "level": 1,
   "topic": "Gun position",
   "q_en": "Between the first and the second target of a double, the shooter may hold the gun in any position.",
   "q_uk": "Між першою і другою мішенню дуплета стрілець може тримати рушницю як завгодно.",
   "options": [
    {
     "en": "True",
     "uk": "Правда"
    },
    {
     "en": "False",
     "uk": "Неправда"
    }
   ],
   "answer": 0,
   "explain_en": "True, for doubles on report, simultaneous and rafale. The free position applies only between the two targets; before the first one the ready position is still required.",
   "explain_uk": "Правда — для double on report, simultaneous і rafale. Вільне положення діє лише між двома мішенями; перед першою все одно потрібна готова позиція.",
   "refs": [
    "ch3-between-doubles"
   ]
  },
  {
   "id": "sp-q057",
   "type": "truefalse",
   "level": 1,
   "topic": "Rabbit",
   "q_en": "A rabbit must be shot with the gun at the shoulder, like any other target.",
   "q_uk": "По кролику (rabbit) стріляють, приклавши рушницю до плеча, як і по будь-якій іншій мішені.",
   "options": [
    {
     "en": "True",
     "uk": "Правда"
    },
    {
     "en": "False",
     "uk": "Неправда"
    }
   ],
   "answer": 0,
   "explain_en": "True. Every target, rabbits included, is shot with the gun mounted to the shoulder; shooting from the hip is not allowed.",
   "explain_uk": "Правда. По кожній мішені, і по кролику теж, стріляють із рушницею, прикладеною до плеча; стріляти від стегна не можна.",
   "refs": [
    "ch3-mounting"
   ],
   "sim": {
    "type": "flight",
    "preset": "rabbit"
   }
  },
  {
   "id": "sp-q058",
   "type": "truefalse",
   "level": 1,
   "topic": "Presentation",
   "q_en": "At the presentation, doubles on report are shown to the first shooter of the squad.",
   "q_uk": "Під час показу double on report демонструють першому стрільцю squad.",
   "options": [
    {
     "en": "True",
     "uk": "Правда"
    },
    {
     "en": "False",
     "uk": "Неправда"
    }
   ],
   "answer": 1,
   "explain_en": "False. Doubles on report are not shown; only simultaneous and rafale doubles are presented, with up to two repeats on request.",
   "explain_uk": "Неправда. Double on report не показують; демонструють лише simultaneous і rafale double, на прохання — до двох повторів.",
   "refs": [
    "ch16-presentation-doubles"
   ],
   "sim": {
    "type": "pair",
    "kind": "report"
   }
  },
  {
   "id": "sp-q059",
   "type": "truefalse",
   "level": 1,
   "topic": "Guns",
   "q_en": "A shooter may fire one test shot on the first stand to check that a newly repaired gun works.",
   "q_uk": "Стрілець може зробити один пробний постріл на першому стенді, щоб перевірити щойно відремонтовану рушницю.",
   "options": [
    {
     "en": "True",
     "uk": "Правда"
    },
    {
     "en": "False",
     "uk": "Неправда"
    }
   ],
   "answer": 1,
   "explain_en": "False. Guns may never be tested on a shooting stand; use the special test stand near the clubhouse, before going onto the layout.",
   "explain_uk": "Неправда. Перевіряти рушницю на стенді заборонено; для цього є спеціальний пробний стенд біля клубу, і робити це треба до виходу на layout.",
   "refs": [
    "ch3-testing-guns"
   ]
  },
  {
   "id": "sp-q060",
   "type": "truefalse",
   "level": 2,
   "topic": "Guns",
   "q_en": "During a round, a shooter may change a choke between the singles and the doubles, provided it causes no delay.",
   "q_uk": "Під час раунду стрілець може замінити чок між одиночними мішенями й дуплетами, якщо це не спричиняє затримки.",
   "options": [
    {
     "en": "True",
     "uk": "Правда"
    },
    {
     "en": "False",
     "uk": "Неправда"
    }
   ],
   "answer": 0,
   "explain_en": "True. The gun, a removable choke or a barrel may be changed between stands or between singles and doubles without delay, but never once the shooter is on the stand.",
   "explain_uk": "Правда. Рушницю, змінний чок чи ствол можна міняти між стендами або між одиночними мішенями й дуплетами без затримки, але не тоді, коли стрілець уже на стенді.",
   "refs": [
    "ch7-borrow-replace",
    "ch7-no-changes-on-stand"
   ]
  },
  {
   "id": "sp-q061",
   "type": "truefalse",
   "level": 2,
   "topic": "Guns",
   "q_en": "In an official competition, two shooters of the same squad may share one gun if both agree.",
   "q_uk": "На офіційних змаганнях двоє стрільців одного squad можуть користуватися однією рушницею, якщо обидва згодні.",
   "options": [
    {
     "en": "True",
     "uk": "Правда"
    },
    {
     "en": "False",
     "uk": "Неправда"
    }
   ],
   "answer": 1,
   "explain_en": "False. Two shooters in the same squad may not use or share the same gun in an official competition. Borrowing is only an exception after a breakdown, to finish the round.",
   "explain_uk": "Неправда. На офіційних змаганнях двоє стрільців одного squad не можуть користуватися однією рушницею. Позичити рушницю можна лише як виняток після поломки, щоб завершити раунд.",
   "refs": [
    "ch7-touching-sharing",
    "ch7-borrow-replace"
   ]
  },
  {
   "id": "sp-q062",
   "type": "truefalse",
   "level": 1,
   "topic": "Safety",
   "q_en": "Hearing protection is compulsory not only for shooters but also for referees, staff and spectators on or near a layout.",
   "q_uk": "Засоби захисту слуху обов’язкові не лише для стрільців, а й для суддів, персоналу й глядачів на layout або поруч із ним.",
   "options": [
    {
     "en": "True",
     "uk": "Правда"
    },
    {
     "en": "False",
     "uk": "Неправда"
    }
   ],
   "answer": 0,
   "explain_en": "True. Everyone on or near a layout must wear hearing protection; a shooter without it is treated as absent (16.7).",
   "explain_uk": "Правда. Усі, хто перебуває на layout або поруч, мають носити захист слуху; стрільця без нього вважають відсутнім (16.7).",
   "refs": [
    "ch8-hearing-protection"
   ]
  },
  {
   "id": "sp-q063",
   "type": "truefalse",
   "level": 1,
   "topic": "Penalties",
   "q_en": "A shooter expelled from a competition gets no refund and no compensation for the targets not shot.",
   "q_uk": "Стрілець, якого виключили зі змагання, не отримує ні повернення грошей, ні компенсації за невідстріляні мішені.",
   "options": [
    {
     "en": "True",
     "uk": "Правда"
    },
    {
     "en": "False",
     "uk": "Неправда"
    }
   ],
   "answer": 0,
   "explain_en": "True. An expelled shooter gets no money back and no financial compensation of any kind.",
   "explain_uk": "Правда. Виключений стрілець не отримує назад жодних грошей і жодної фінансової компенсації.",
   "refs": [
    "ch13-no-refund"
   ]
  },
  {
   "id": "sp-q064",
   "type": "truefalse",
   "level": 2,
   "topic": "Shoot-offs",
   "q_en": "In a sudden-death shoot-off, on a double on report 'one-zero' and 'zero-one' count the same.",
   "q_uk": "У перестрілці за системою sudden death на double on report «one-zero» і «zero-one» рахуються однаково.",
   "options": [
    {
     "en": "True",
     "uk": "Правда"
    },
    {
     "en": "False",
     "uk": "Неправда"
    }
   ],
   "answer": 0,
   "explain_en": "True. In sudden death only, a double on report counts as a pair of two targets whichever one was missed.",
   "explain_uk": "Правда. Лише в sudden death double on report рахують як пару з двох мішеней, незалежно від того, яку з них пропущено.",
   "refs": [
    "ch18-sudden-death"
   ],
   "sim": {
    "type": "pair",
    "kind": "report"
   }
  },
  {
   "id": "sp-q065",
   "type": "truefalse",
   "level": 2,
   "topic": "Shoot-offs",
   "q_en": "When two teams tie, they shoot a team shoot-off on a new layout.",
   "q_uk": "Коли дві команди набирають однаковий результат, вони стріляють командну перестрілку на новому layout.",
   "options": [
    {
     "en": "True",
     "uk": "Правда"
    },
    {
     "en": "False",
     "uk": "Неправда"
    }
   ],
   "answer": 1,
   "explain_en": "False. There is no team shoot-off: teams are ranked on their combined score on the 8th layout, then by countback from the 7th to the 1st.",
   "explain_uk": "Неправда. Командної перестрілки немає: команди ранжують за сумою на 8-му layout, далі — у зворотному порядку з 7-го до 1-го.",
   "refs": [
    "ch18-team-ties"
   ]
  },
  {
   "id": "sp-q066",
   "type": "choice",
   "level": 2,
   "topic": "Appeals",
   "q_en": "Which of these referee decisions CAN be appealed to the jury?",
   "q_uk": "Яке з цих рішень судді МОЖНА оскаржити в журі?",
   "options": [
    {
     "en": "Whether a target was 'one' or 'zero'",
     "uk": "Чи була мішень «one» чи «zero»"
    },
    {
     "en": "A red card for gun position",
     "uk": "Червона картка за положення рушниці"
    },
    {
     "en": "Whether a target was a No Bird",
     "uk": "Чи була мішень No Bird"
    },
    {
     "en": "Whether a trajectory was correct",
     "uk": "Чи була траєкторія правильною"
    }
   ],
   "answer": 1,
   "explain_en": "Trajectory, No Bird and one/zero decisions cannot go to the jury. Any other referee decision can be appealed in writing with a 40% deposit.",
   "explain_uk": "Рішення щодо траєкторії, No Bird та one/zero до журі не оскаржують. Будь-яке інше рішення судді можна оскаржити письмово із заставою 40%.",
   "refs": [
    "ch9-jury-appeal"
   ]
  },
  {
   "id": "sp-q067",
   "type": "choice",
   "level": 2,
   "topic": "Appeals",
   "q_en": "The jury rejects a shooter's appeal. What happens to the deposit?",
   "q_uk": "Журі відхиляє апеляцію стрільця. Що відбувається із заставою?",
   "options": [
    {
     "en": "To a charity the FITASC Chairman picks",
     "uk": "На благодійність, яку обирає голова FITASC"
    },
    {
     "en": "It goes to the organising club",
     "uk": "Її отримує клуб-організатор"
    },
    {
     "en": "It is returned to the shooter anyway",
     "uk": "Її все одно повертають стрільцеві"
    },
    {
     "en": "It is added to the prize fund",
     "uk": "Її додають до призового фонду"
    }
   ],
   "answer": 0,
   "explain_en": "If the appeal is upheld the deposit is refunded; if not, it goes to a charity chosen by the FITASC Chairman.",
   "explain_uk": "Якщо апеляцію задоволено, заставу повертають; якщо ні — її передають на благодійність, яку обирає голова FITASC.",
   "refs": [
    "ch9-deposit-outcome"
   ]
  },
  {
   "id": "sp-q068",
   "type": "choice",
   "level": 1,
   "topic": "Appeals",
   "q_en": "How does a shooter correctly protest a ruling on the stand?",
   "q_uk": "Як стрілець правильно протестує проти рішення на стенді?",
   "options": [
    {
     "en": "Walks out to pick up the target and show it to the referee",
     "uk": "Іде підняти мішень і показати її судді"
    },
    {
     "en": "Finishes the stand, then speaks to the referee",
     "uk": "Дострілює стенд, а потім звертається до судді"
    },
    {
     "en": "Immediately raises a hand and says 'appeal' or 'protest'",
     "uk": "Одразу піднімає руку й каже «appeal» або «protest»"
    },
    {
     "en": "Asks the squad to vote",
     "uk": "Просить squad проголосувати"
    }
   ],
   "answer": 2,
   "explain_en": "The protest must be made at once on the stand by raising a hand and saying 'appeal' or 'protest'. Shooters may never leave their place or pick up a target.",
   "explain_uk": "Протестувати треба одразу на стенді: підняти руку й сказати «appeal» або «protest». Покидати місце чи піднімати мішень заборонено.",
   "refs": [
    "ch9-how-to-appeal",
    "ch9-no-checking-targets"
   ]
  },
  {
   "id": "sp-q069",
   "type": "choice",
   "level": 3,
   "topic": "Referees",
   "q_en": "A referee is in doubt about a decision. Whom may he consult, and with what effect?",
   "q_uk": "Суддя сумнівається в рішенні. З ким він може порадитися і що з цього випливає?",
   "options": [
    {
     "en": "Other referee, trapper or squad; advice only",
     "uk": "Інший суддя, трапер чи squad; лише порада"
    },
    {
     "en": "Only the jury; its view is binding",
     "uk": "Лише з журі; його думка обов’язкова"
    },
    {
     "en": "Nobody; a doubtful target is always No Bird",
     "uk": "Ні з ким; сумнівна мішень — завжди No Bird"
    },
    {
     "en": "The shooter's coach, whose view decides",
     "uk": "З тренером стрільця, чия думка вирішальна"
    }
   ],
   "answer": 0,
   "explain_en": "The referee may ask another referee, the trapper or the squad's shooters purely for advice, is not bound by their opinions, and his ruling is then final.",
   "explain_uk": "Суддя може запитати поради в іншого судді, трапера чи стрільців squad, але не зобов’язаний слідувати їхній думці; після цього його рішення остаточне.",
   "refs": [
    "ch9-consultation",
    "ch6-referee-alone"
   ]
  },
  {
   "id": "sp-q070",
   "type": "choice",
   "level": 2,
   "topic": "Layouts",
   "q_en": "How are the traps of a stand labelled?",
   "q_uk": "Як позначають машинки на стенді?",
   "options": [
    {
     "en": "By target colour",
     "uk": "За кольором мішені"
    },
    {
     "en": "Letters from right to left, as seen by the trapper",
     "uk": "Літерами справа наліво, як бачить трапер"
    },
    {
     "en": "Numbers 1–4 in shooting order",
     "uk": "Цифрами 1–4 у порядку стрільби"
    },
    {
     "en": "Letters A, B, C, D from left to right as seen from the stand",
     "uk": "Літерами A, B, C, D зліва направо, якщо дивитися зі стенда"
    }
   ],
   "answer": 3,
   "explain_en": "Traps are identified by letters A, B, C and D, read from left to right as seen from the shooting stand; the menu and scorecard use them.",
   "explain_uk": "Машинки позначають літерами A, B, C і D зліва направо, якщо дивитися зі стенда; ці літери використовують у меню та картці.",
   "refs": [
    "ch2-trap-letters",
    "ch2-target-menu"
   ]
  },
  {
   "id": "sp-q071",
   "type": "choice",
   "level": 3,
   "topic": "Layouts",
   "q_en": "A shooting position has 3 machines and 2 doubles. Which combination is NOT allowed?",
   "q_uk": "На стрілецькому місці 3 машинки і 2 дуплети. Яке поєднання НЕ дозволене?",
   "options": [
    {
     "en": "One simultaneous and one on report",
     "uk": "Один simultaneous і один on report"
    },
    {
     "en": "Two doubles on report",
     "uk": "Два дуплети on report"
    },
    {
     "en": "One rafale and one on report",
     "uk": "Один rafale і один on report"
    },
    {
     "en": "One simultaneous and one rafale",
     "uk": "Один simultaneous і один rafale"
    }
   ],
   "answer": 1,
   "explain_en": "At such a position at least one of the two doubles must be simultaneous or rafale. Two doubles on report are not allowed.",
   "explain_uk": "На такому місці хоча б один із двох дуплетів має бути simultaneous або rafale. Два дуплети on report не дозволені.",
   "refs": [
    "ch2-doubles-three-traps"
   ]
  },
  {
   "id": "sp-q072",
   "type": "choice",
   "level": 3,
   "topic": "Layouts",
   "q_en": "Which rule applies to building doubles on a stand?",
   "q_uk": "Яке правило діє при складанні дуплетів на стенді?",
   "options": [
    {
     "en": "Class C appears at most once in the doubles",
     "uk": "Клас C трапляється в дуплетах щонайбільше раз"
    },
    {
     "en": "Doubles must always be on report",
     "uk": "Дуплети завжди мають бути on report"
    },
    {
     "en": "Doubles may use trajectories not shown as singles",
     "uk": "Дуплети можуть мати траєкторії, яких не було серед одиночних"
    },
    {
     "en": "Two class C targets form the recommended double",
     "uk": "Дві мішені класу C — рекомендований дуплет"
    }
   ],
   "answer": 0,
   "explain_en": "Doubles only use targets already shown as singles from that position; class C may appear only once, preferably paired with an A. B + B and B + A are allowed.",
   "explain_uk": "Дуплети складають лише з мішеней, уже показаних як одиночні з цієї позиції; клас C — лише раз, бажано з A. Дозволено B + B і B + A.",
   "refs": [
    "ch2-doubles-composition"
   ]
  },
  {
   "id": "sp-q073",
   "type": "choice",
   "level": 2,
   "topic": "Penalties",
   "q_en": "A shooter repeats an offence, refuses to comply or tries to influence a referee. Which of these can the jury NOT impose?",
   "q_uk": "Стрілець повторно порушив правила, відмовився виконувати вимоги або намагався вплинути на суддю. Чого з переліченого журі НЕ може призначити?",
   "options": [
    {
     "en": "Expulsion from the competition",
     "uk": "Виключення зі змагання"
    },
    {
     "en": "Loss of one target",
     "uk": "Втрата однієї мішені"
    },
    {
     "en": "Loss of a 25-target round",
     "uk": "Втрата раунду з 25 мішеней"
    },
    {
     "en": "A money fine",
     "uk": "Грошовий штраф"
    }
   ],
   "answer": 3,
   "explain_en": "The jury has three options: take off one target, take off a 25-target round, or remove the shooter from the competition. A money fine is not one of them.",
   "explain_uk": "Журі має три варіанти: зняти одну мішень, зняти серію з 25 мішеней або виключити стрільця зі змагання. Грошового штрафу серед них немає.",
   "refs": [
    "ch13-jury-penalties"
   ]
  },
  {
   "id": "sp-q074",
   "type": "choice",
   "level": 2,
   "topic": "Conduct",
   "q_en": "During a round a coach behind the stand keeps telling his shooter where to hold. What does the referee do?",
   "q_uk": "Під час раунду тренер за стендом постійно підказує своєму стрільцю, де тримати рушницю. Що робить суддя?",
   "options": [
    {
     "en": "Immediate expulsion of the shooter",
     "uk": "Негайне виключення стрільця"
    },
    {
     "en": "Yellow card for the shooter; the coach is sent away",
     "uk": "Жовта картка стрільцю; тренера видаляють"
    },
    {
     "en": "Zero on the shooter's next target, no card",
     "uk": "Zero на наступній мішені стрільця, без картки"
    },
    {
     "en": "Nothing; coaching is allowed between targets",
     "uk": "Нічого; підказки між мішенями дозволені"
    }
   ],
   "answer": 1,
   "explain_en": "Coaching during competition is forbidden: the competitor gets a yellow card (repeat offences go to Chapter 13) and the coach is removed from the shooting area.",
   "explain_uk": "Підказки під час змагання заборонені: стрілець отримує жовту картку (повторні порушення — за розділом 13), а тренера видаляють із зони стрільби.",
   "refs": [
    "ch8-coaching"
   ]
  },
  {
   "id": "sp-q075",
   "type": "choice",
   "level": 2,
   "topic": "Malfunctions",
   "q_en": "A shooter's gun breaks on stand 2 and cannot be repaired quickly. What may he do?",
   "q_uk": "На стенді 2 рушниця стрільця ламається, і швидко її не полагодити. Що він може зробити?",
   "options": [
    {
     "en": "Take any gun on the stand without asking",
     "uk": "Взяти будь-яку рушницю на стенді без дозволу"
    },
    {
     "en": "Skip the stand and have its targets scored as No Bird",
     "uk": "Пропустити стенд, а його мішені вважати No Bird"
    },
    {
     "en": "With the referee's agreement, go on at once with another gun",
     "uk": "За згодою судді одразу продовжити з іншою рушницею"
    },
    {
     "en": "Re-shoot the whole layout later with a squad of choice",
     "uk": "Пізніше перестріляти весь layout із будь-яким squad"
    }
   ],
   "answer": 2,
   "explain_en": "If the gun cannot be fixed, the shooter may stay with the squad, with the referee's agreement, by switching at once to another gun (for example one borrowed with its owner's consent). Otherwise the remaining targets can be shot only in a free place in another squad, with the jury's authorisation.",
   "explain_uk": "Якщо рушницю не полагодити, стрілець за згодою судді може лишитися зі своїм squad, одразу взявши іншу рушницю (наприклад, позичену за згодою власника). Інакше решту мішеней можна дострілити лише на вільному місці в іншому squad з дозволу журі.",
   "refs": [
    "ch7-malfunction-procedure",
    "ch7-borrow-replace"
   ]
  },
  {
   "id": "sp-q076",
   "type": "choice",
   "level": 3,
   "topic": "Release trigger",
   "q_en": "A shooter with a release-pull trigger has the first target declared No Bird. What must he do?",
   "q_uk": "У стрільця з release-pull спуском першу мішень оголошено No Bird. Що він має зробити?",
   "options": [
    {
     "en": "Release the trigger at once and open the gun",
     "uk": "Одразу відпустити спуск і відкрити рушницю"
    },
    {
     "en": "Keep holding the trigger; new target, open gun or safe shot",
     "uk": "Тримати спуск; нова мішень, відкрити рушницю або безпечний постріл"
    },
    {
     "en": "Hand the gun to the referee without opening it",
     "uk": "Передати рушницю судді, не відкриваючи її"
    },
    {
     "en": "Fire into the ground in front of the stand",
     "uk": "Вистрілити в землю перед стендом"
    }
   ],
   "answer": 1,
   "explain_en": "He must keep the trigger pulled and choose one of three safe options: call for a new target, open the gun while holding the trigger, or fire into a safe direction the referee shows.",
   "explain_uk": "Він має тримати спуск натиснутим і вибрати один із трьох безпечних варіантів: викликати нову мішень, відкрити рушницю, не відпускаючи спуску, або вистрілити в безпечному напрямку, указаному суддею.",
   "refs": [
    "ch7-release-pull-nobird",
    "ch7-release-trigger-marking"
   ]
  },
  {
   "id": "sp-q077",
   "type": "choice",
   "level": 2,
   "topic": "Scorecards",
   "q_en": "What must the referee do with the scorecard before the squad moves to the next position?",
   "q_uk": "Що суддя має зробити з карткою результатів, перш ніж squad перейде на наступну позицію?",
   "options": [
    {
     "en": "Send it to the scoreboard by runner",
     "uk": "Передати її на табло через посильного"
    },
    {
     "en": "Have every shooter of the squad sign it",
     "uk": "Дати підписати всім стрільцям squad"
    },
    {
     "en": "Hand it straight to the jury",
     "uk": "Одразу передати її журі"
    },
    {
     "en": "Photograph it and star the name of whoever carries it",
     "uk": "Сфотографувати й позначити зірочкою того, хто її несе"
    }
   ],
   "answer": 3,
   "explain_en": "Before the squad moves on, the referee takes a photo of the card and puts an asterisk before the name of the shooter who carries it. Each stand has its own pencil colour.",
   "explain_uk": "Перш ніж squad піде далі, суддя фотографує картку й ставить зірочку перед прізвищем стрільця, який її несе. Кожне місце має свій колір олівця.",
   "refs": [
    "ch14-who-keeps-score",
    "ch14-model"
   ]
  },
  {
   "id": "sp-q078",
   "type": "choice",
   "level": 1,
   "topic": "Dress",
   "q_en": "Which outfit is acceptable for a competitor?",
   "q_uk": "Який одяг допустимий для учасника?",
   "options": [
    {
     "en": "Bermuda shorts, T-shirt and sandals",
     "uk": "Бермуди, футболка й сандалі"
    },
    {
     "en": "Short running shorts and a T-shirt",
     "uk": "Короткі спортивні шорти й футболка"
    },
    {
     "en": "Bermudas 4 cm above the knee, polo, closed shoes",
     "uk": "Бермуди на 4 см вище коліна, поло, закрите взуття"
    },
    {
     "en": "A skeet vest with nothing underneath",
     "uk": "Жилет для скіту на голе тіло"
    }
   ],
   "answer": 2,
   "explain_en": "Bermuda shorts are fine if they end at most 5 cm above the knee; a shirt needs sleeves (short is enough) and a collar or round neck; no vest on bare skin and no sandals.",
   "explain_uk": "Бермуди можна, якщо вони закінчуються щонайбільше за 5 см над коліном; сорочка має бути з рукавами (досить коротких) і з коміром або круглим вирізом; жилет на голе тіло й сандалі заборонені.",
   "refs": [
    "ch17-dress-code"
   ]
  },
  {
   "id": "sp-q079",
   "type": "choice",
   "level": 2,
   "topic": "Shoot-offs",
   "q_en": "Two shooters tie for 5th place. How is the order between them decided?",
   "q_uk": "Двоє стрільців поділили 5-те місце. Як визначають порядок між ними?",
   "options": [
    {
     "en": "Shared place; listed by countback from layout 8",
     "uk": "Спільне місце; порядок — зворотним відліком від 8-го layout"
    },
    {
     "en": "A sudden-death shoot-off between them",
     "uk": "Перестрілка sudden death між ними"
    },
    {
     "en": "By drawing lots after the event",
     "uk": "Жеребкуванням після змагання"
    },
    {
     "en": "A shoot-off over 25 targets",
     "uk": "Перестрілка на 25 мішеней"
    }
   ],
   "answer": 0,
   "explain_en": "Shoot-offs are held only for the first three places. Below third, tied shooters share the place and are listed by countback from the 8th layout to the 1st.",
   "explain_uk": "Перестрілку проводять лише за перші три місця. Нижче третього стрільці ділять місце, а в списку їх розташовують за результатами у зворотному порядку з 8-го layout до 1-го.",
   "refs": [
    "ch18-top-three"
   ]
  },
  {
   "id": "sp-q080",
   "type": "choice",
   "level": 3,
   "topic": "Organisation",
   "q_en": "A stand referee thinks one trajectory is too easy. Can he change it?",
   "q_uk": "Суддя на стенді вважає одну траєкторію надто легкою. Чи може він її змінити?",
   "options": [
    {
     "en": "No; only a faulty trajectory may be reset, in set cases",
     "uk": "Ні; лише несправну траєкторію можна виправити, і лише в певних випадках"
    },
    {
     "en": "Yes, after informing the chief referee",
     "uk": "Так, повідомивши головного суддю"
    },
    {
     "en": "Yes, if the whole squad agrees to it",
     "uk": "Так, якщо весь squad погоджується"
    },
    {
     "en": "Yes, but only between two rounds",
     "uk": "Так, але лише між двома серіями"
    }
   ],
   "answer": 0,
   "explain_en": "Trajectories set by the jury and course designers are fixed. The referee may only reset a faulty one after a trap malfunction or exceptional weather; a course designer or jury member should check it.",
   "explain_uk": "Траєкторії, встановлені журі й course designer, змінювати не можна. Суддя може лише відновити зіпсовану після поломки машинки чи виняткової погоди; її бажано перевірити course designer або членові журі.",
   "refs": [
    "ch15-trajectory-reset"
   ]
  }
 ]
});
