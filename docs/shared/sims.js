/* ClayArena shared simulations — ONE implementation used by several projects:
   the Academy (docs/learn/app/academy.js: lesson animations, Practice games), the FITASC rules trainer (docs/rules/trainer/)
   and the glossary term pages (docs/glossary/<id>/, docs/<lang>/glossary/<id>/, mounted through TERM_SIMS below).
   - flightSim(host, preset, opts): animated target presentation (crosser, incomer, driven, going-away, overhead, quartering,
     teal, springing, chandelle, looper, battue, dropping, rabbit, bolting rabbit). opts.focus adds a teaching overlay:
       "points" = pick-up point (eyes), hold point (muzzles at the call) and break point; the clay breaks at the break point;
       "stance" = hold point and break point with lines from the stand, labelled "front foot" (to the break point) and "body"
                  (turned back to the hold point);
       "eyes"   = soft focus around the pick-up point, then hard focus on the leading edge of the target.
     Before it plays, the canvas shows a still "poster": the whole flight line dotted and the overlay (for "eyes" both stages:
     soft focus at the pick-up point and hard focus on the target), so a reader who does not play it still sees it.
     The view is from behind the stand: the shooter is seen from the back at the bottom centre (shooterBack()), gun ready at the
     hold point (with "points" the gun follows the muzzle mark).
   - patternSim(host, opts): a shot at a pattern plate from 36.6 m with a choke picker (cylinder … full): the share of the shot in
     the 76 cm circle (the lesson's Trulock figures) and the target drawn to scale; opts.choke (glossary plan, wave 6, 06.11.2026).
   - missSim(host, kind, opts): where the shot went — behind, in front (crosser), over (dropping target), under (teal), as the
     coach behind the shooter sees it; the cause under the canvas (glossary plan, wave 6, 06.11.2026).
   - tiesSim(host, kind, opts): ties — "countback" (below 3rd: layouts 8 → 1) or "shoot-off" (25 targets, then sudden death),
     a score table that lights up step by step; HTML, no canvas (glossary plan, wave 6, 06.11.2026).
   - stockSim(host, kind, opts): gun fit diagrams — "lop" (length of pull from the side: fits / too short / too long) and "cast"
     (from above: cast off / cast on, exaggerated); no animation (glossary plan, wave 6, 06.11.2026).
   - pairSim(host, kind, opts): a pair of targets — report pair, simultaneous pair, rafale (following pair, Sporting™ only).
   - leadLab(host, method, opts): crossing target in slow motion; methods maintained / swing / pullaway / ambush; "watch the method"
     or "your turn"; freeze-frame at the shot with the actual lead in metres and feet. Its still picture (before anything is played,
     and after a change of method, speed or distance) is that freeze-frame of the method: flight line, target, muzzles and lead apart.
     The canvas also shows where the muzzles have been (cyan rings at equal time steps: they spread out when the gun moves fast,
     they stack when it waits), a dashed ghost of the target where it was at the decision, the shot cloud from the barrels and the
     dashed ring of the shot pattern at the impact (a hit = the target's centre inside the ring; on a miss a white dot marks that
     centre, since the target is drawn larger than life), and a 2 m scale key.
     opts.preset: "crosser-rl" = target flies right to left, "rabbit" = target rolls along the ground (default: left to right;
                  the rabbit's slider starts at 11 m/s, 6–18 m/s — an EXAMPLE value for the lab, no published source gives a
                  typical rabbit speed, so no text may present 11 m/s as typical; it slows down on the ground, which the lab
                  does not model — simplified physics, see below);
     opts.focus: "perceived-vs-actual" = table of the four methods for the same target, "lead-units" = lead also in target widths
                 (the target is then drawn to scale, see "Scale" below),
                 "follow-through" = option to stop the gun at the trigger (opts.stop: true = option on at the start),
                 "mount" = the phase words read “move · mount · shoot” instead of the method's words (kept for old data: the
                 gun-mount lesson now shows the stand scene "mount" below, which draws the shooter, the stock and the cheek).
     The coach's words for the phases of the method are shown in English above the canvas, as the lessons teach them
     (“insert in front · match its speed · shoot · keep moving”, “butt · belly · beak · bang”, “on it · with it · pull away · shoot”);
     the current one is highlighted. They are HTML text, so they stay readable on a phone.
     Teaching physics (simplified; an explanation, not a ballistic calculator; revised 10.2026 after an independent check against
     two drag models calibrated to the Lowry / NRA time-of-flight table for lead shot):
       time of flight  tf = d / 330 · (1 + 0.0115 · (d − 15)) s — the shot slows down as it flies: on average ≈ 330 m/s over 15 m,
                       ≈ 300 m/s over 25 m, ≈ 255 m/s over 40 m (it leaves the barrel at about 360–430 m/s; the old d / 330 gave
                       too little lead at long range: 17 m/s at 40 m needs ≈ 2.65 m, not 2.06 m);
       delay           TR = 0.15 s from the decision to the shot — an average estimate, not a measured constant (shooters differ);
       hit zone        R = 0.25 m + 0.5 cm per metre of distance: the radius of the part of the pattern dense enough to break the
                       target (0.325 m at 15 m, 0.375 m at 25 m, 0.45 m at 40 m); the dashed ring at the impact is drawn with R;
       eye             the muzzle ≈ 1 m from the shooter's eye (the "seen at the muzzle" value).
     Defaults 17 m/s at 25 m: actual lead 1.44 m (4.7 ft, about 13 target widths) with every method. Texts that quote a lab value
     must follow these numbers (none does today: the lessons only describe the methods).
     Scale: 720 px = 28 m (≈ 25.7 px per metre) ALONG the target's line: distances along that line (the 2 m ticks), the lead and
     the ring are to scale. The shooting distance d (15–40 m) itself is not drawn (the shooter stands ≈ 126 px ≈ 5 m below the
     line). The target is drawn larger than life so it can be seen: ≈ 6× on a wide screen (radius 9 px ≈ 0.35 m instead of
     0.055 m), up to ≈ 10× on a phone (× MK, like every mark; the ring and the lead are not multiplied) — except with focus
     "lead-units", where the lead is counted in target widths: there the target is to scale on a wide screen (radius CLAY / 2 =
     1.4 px) and up to ≈ 1.6× on a phone (× MK, so it stays visible), with its normal glow. lab_note under the canvas says the same
     in plain words in the page language.
     Each method moves the muzzle the way the lessons describe it, and every result (hit / behind / in front, lead seen and actual
     lead) is computed from the muzzle and target positions; nothing is scored as a hit by default:
       maintained — the muzzles wait in front and move slower than the target, so the gap closes; at the decision the gun takes the
                    target's speed and holds the gap, so the lead seen equals the actual lead; it hits only if the gap was right;
       swing      — the muzzles start behind on the target's line and move faster; the shooter sees a small gap as the muzzles pass
                    the front, and the extra gun speed during the 0.15 s delay makes the actual lead;
       pullaway   — the muzzles track the target, then accelerate smoothly ahead; the lead seen is smaller than the actual lead;
       ambush     — the muzzles wait still at a point ahead; the shooter must decide before the target gets there (lead seen =
                    actual lead + target speed × 0.15 s); a shot fired as the target arrives goes behind.
   - standSim(host, kind, opts): a stand seen from the side (type "call"): the shooter; behind the shooter the referee and the trapper
     with a hand-held release button (its cable runs along the ground to the trap) — with a sonopull no trapper, but a microphone at
     the front edge of the stand; downrange the trap, protected inside a trap house behind a screen that faces the stand, with an
     earth bank in front of the screen; a clock. Behind the stand, a little nearer the viewer, the ClayArena dog sits on a lead next to
     its handler (drawn only when docs/shared/mascot.js is on the page, see MASCOT below). Everyone wears safety glasses and ear muffs
     (the dog wears dog earmuffs). SAFETY: nobody is ever drawn in front of the stand, no muzzle ever points at a person or the trap
     house, an unbroken target comes down in the field, not at the stand (see "SAFETY" above SCENES). Scale: only the shooter and
     the stand are to scale (1 px ≈ 1 cm). The people behind the stand have real heights, but they stand closer together than in
     life so that everyone fits behind the stand; the field (the trap house is about 4 m from the stand here) and the target's
     flight are shortened. A small caption under the canvas says so (ui key anim_scale, 11 languages; owner's review 10.2026).
     Scenes (SCENES below): "signal" (Sporting™: the referee passes the call back to the trapper behind the stand with a sound
     signal, the trapper presses the release button; the target leaves in time), "signal-late" (it leaves later than the limit: “No Bird”, thrown again; the shooter does not
     fire — the rulebooks do not say how a late target is scored when the shooter fires at it), "manual" (Compak® Sporting, released
     by hand 0–3 s after the call), "sonopull" (Compak® Sporting, a fixed delay after the call), "gun-ready" (Sporting™ ready position:
     stock below the line on the vest until the target appears, then the mount; the line is red only while the stock is above it
     BEFORE the target appears — after the release the raised gun is correct), "gun-early" (called with the gun already up: the
     referee's spoken warning and yellow card; the scene stops there), "misfire" (a click; stay put, gun closed and pointing down the
     range; the referee examines the gun; first malfunction: the target is thrown again), "mount" (the gun mount of the technique
     lesson: gun low; the front hand starts the muzzles along the target's line first, then the stock comes up to the cheek and into
     the shoulder with the head still, marked “cheek on the comb”; the mount is finished as the shot comes; words “move · mount ·
     shoot” above the canvas). The status line under the canvas says the same in words (aria-live), so the scene works with a
     screen reader too.
   Every animation has a big ▶ play button (⏹ stop while it runs — WCAG 2.2.2, an animation that plays by itself can always be
   stopped — then ↻ replay) and a 🐢 slow-motion toggle (one setting for the page: CFG.slow; the clocks of the stand scenes still
   show real seconds). It plays by itself once (opts.autoplay): "view" = when at least half of its canvas is on the screen (or 60 %
   of the window height for a canvas taller than that, e.g. a phone held sideways), never when the reader prefers reduced motion;
   "now" = right away (callers that already asked the reader, e.g. a game); false = only by the button. The first thing the reader
   does inside the animation (a click on a button, a tab or the canvas, a change of a slider, list or box) cancels an autoplay that
   has not started yet, so it never takes over the reader's own run; opts.onUser() is then called once. mount() defaults to "view",
   the direct calls keep their old behaviour ("now" for flights and pairs, false for the lead lab).
   Narrow screens: the canvas is 720 logical px wide and is shown about half size on a phone, so every frame measures it (fit()) and
   draws text, label distances and marks (target, muzzle mark, points) larger by the same factor (text up to ×2.2, marks up to ×1.6);
   every word on the canvas sits on a dark pill; the stand scenes with a clock get a band above the scene for a bigger clock. A canvas
   is never taller than 70 % of the window.
   Languages on the canvas (decision, 10.2026): glossary terms drawn on the canvas (Pick-up point, Hold point, Break point, Soft
   focus, Hard focus) and the coach's phase words stay in English — they are the stand words the course teaches, and the canvas
   has no room for two names; every other word (line, decision, shot, lead, front foot, body, cheek on the comb, the clock, the status
   line, the buttons) is in the page language (ui keys). Tabs show the English stand word of a flight plus its name in the page
   language when the page knows it ("Crosser → · <local>"); pair and scene tabs are in the page language.

   STYLE (10.2026; owner's approval 08.10.2026: concept A "evening field" with grafts from B and C; the drawing code is the block
   "ART (style 10.2026)" below, the scenes keep every number, timing and text they had):
   - One colour = one meaning (ART): ORANGE only the clay (its comet trail, its shards, the dashed ghost at the decision); MINT the
     flight line (dots) and its direction chevron; CYAN the muzzles (muzzle mark, hold point, gun line, muzzle history, shot-pattern
     ring, the referee's sound signal); AMBER attention and the eyes (line on the vest, decision, pick-up point, soft and hard
     focus, cheek on the comb, the lenses of the safety glasses); EMERALD guidance and good (lead bracket, break point, "in time",
     the release pulse); RED a fault (line crossed, late target). VIOLET is never used: on the site it is the colour of
     Compak® Sporting. No stars, birds or specks in any sky: nothing may look like a target or a pellet.
   - Canvas: every sim draws in a fixed LOGICAL space, 720 × 380 (lead lab 720 × 300; a stand scene plus its phone clock band). The
     width/height attributes in the HTML are that logical size; fit() sets the backing store to logical × devicePixelRatio (capped at
     DPR_MAX = 2, never below 720 wide) with one setTransform, so the drawing is crisp on high-DPI phones and no scene number changes.
   - Static backgrounds (sky with an afterglow, hills, tree rows, mown grass, the stand, the trap house) are painted once per size
     into an offscreen canvas (layer(), at most 6 kept) and copied with one drawImage per frame. In a stand scene the people who do
     not move in a frame (the handler, the trapper, the referee while he stands, the dog while it is still) are cached the same way
     as sprites keyed by their state (sprite(): the same picture, checked pixel by pixel by the self-test). Every random element
     (trees, grass, shards, pellets) is seeded (rng), so each replay and each poster is identical (screenshot tests rely on it).
   - The lead lab with the rabbit preset has no stand in its background (the rabbit rolls where the stand's posts would be): the
     gun comes in from the bottom edge as the viewer's own, held by the front hand (flightPaint(…, false), barrelsFromBelow()).
     Seen from behind, an over-and-under shows its lit rib on top (no dark centre line: that would read as a side-by-side).
   - People have real proportions (referee 174 cm, trapper 170 cm, handler 168 cm; tapered limbs placed by two-bone IK). Everyone
     at the stand wears a cap, safety glasses and ear defenders, drawn a little LARGER than true scale on purpose, in colours that
     stand out (amber lenses, dark cups with an emerald rim): a teaching emphasis, not a mistake.
   - Guns: only over-and-under break-action guns are drawn (never a semi-automatic). The gun is closed only on the stand, when it
     is the shooter's turn (after a misfire it stays closed, pointing down the range, until the referee has checked it — correct).
     Anywhere OFF the stand a gun is drawn broken open and empty (gun(c, g, {open: true})); no scene shows one today.
   - Gun frame of the stand scenes: a pose {hx, hy, th} is the point of the butt pad in the shoulder pocket (4 cm below the heel)
     and the angle of the barrels — the "pose line" the safety checks use. The drawn bore runs BORE = 8.5 px above it, parallel (a
     real bore sits about 8.5 cm above that point); the muzzle flash and the smoke use GF(g)(120, −BORE). The shooter's head
     never moves (EYE): "head still, the gun comes to the face"; when mounted the comb touches the cheek (≤ 3 px). "Cheek on the
     comb" is marked by an amber highlight along the top edge of the comb, not a ring (a ring circled the lens and crossed the ear
     cup: the protection must stay visible).
   - Motion: no ambient motion (no parallax, no twinkle, no idle loops); the canvas changes only while a run plays. With
     prefers-reduced-motion: no autoplay, no clay spin, no "Pull!" pop-in, no muzzle smoke, 6 shards without rotation, no dog ear
     flick or tail wag; the teaching motion still runs when the reader presses play (a single ≤ 0.1 s muzzle flash, WCAG 2.3.1).
   - Performance (measured 08.10.2026 in headless Chrome: the full frame = draw calls + raster on the CPU rasterizer, median / p90):
     stand scene 0.8 / 1.1 ms at DPR 1, 1.9 / 2.8 ms at DPR 2, 9 / 11 ms at DPR 2 with the CPU throttled 4× (a slow phone; before the
     people sprites 1.4 / 2.0, 3.0 / 3.8 and 14 / 16 ms); flight with "points" 0.5 / 0.8 ms (1.1 ms at DPR 2), pair 0.3 / 0.4 ms
     (0.7 ms), lead lab 0.4 / 0.6 ms (0.9 ms). If a phone still struggles: lower DPR_MAX to 1.5.
   - Size: the comments are for the team. The pages load docs/shared/sims.min.js, this file minified by every build
     (scripts/build_academy.mjs minifySims(): ≈ 78 KB, gzip ≈ 29 KB, renders pixel for pixel the same); edit only this file.
   - Self-test before a commit (DEVELOPERS.md §4b): frames of every animation type at 720 and 343 px without console errors, the
     per-frame safety check (pose line and drawn bore, people and dog, guns, protection visible in the pixels, the sprite cache
     against direct drawing), cheek–comb gap, the line-on-the-vest colours, the canvas pills in all 11 languages on a phone.
   MASCOT: the ClayArena dog (yellow Labrador, round cartoon; one module docs/shared/mascot.js, window.ClayMascot, DEVELOPERS.md §4j)
   is drawn in the stand scenes ONLY through ClayMascot.draw(ctx, pose, x, y, scale, {view: "side", ear, look, wag}) (with view
   "side" the pose is ignored: there is one side drawing, always in dog earmuffs; dog() passes "safety") when that module is on the
   page (nav.js loads it in the Academy, the glossary and on 404; not in the rules trainer); without it the scenes have no dog and
   no handler. It sits behind the stand on a lead next to its handler (no gun, glasses and ear defenders), with dog
   earmuffs; its ears flick on "Pull!", its head follows the target, its tail wags after a hit. It never speaks on the canvas here
   (owner: the dog is silent or speaks short English bubbles only, never translated; no name is shown until one is chosen).

   Usage: ClaySims.config({t: key => text, term: id => ({en, local}) | null, onHit: info => {}});   info = {method, v, d}
          ClaySims.mount(host, sim, {autoplay, onAutoplay, onUser, tab, onTab})   sim = {type: "flight", preset, also: [...], pairs: [...], focus}
              | {type: "lead", method, preset, focus, stop} | {type: "pair", kind, also: [...]} | {type: "call", kind, also: [...]}
          ClaySims.hero(host, sim) — the same with a heading ("▶ Watch how the target flies") and a one-line "what to watch" caption
              (ui keys anim_h_<kind> / anim_w_<kind>, kind = ClaySims.kind(sim)); used for the glossary term pages by auto().
   Lesson keys muzzle_start, gun_speed, trigger and follow_through only describe the method in words: the lab takes that behaviour
   from the method itself (see above), so they need no code.
   Text keys (texts from the page; missing keys fall back to the English DEF below): launch, method, speed, distance, demo, try,
   shoot, hit, behind, ahead, no_shot, perceived, actual, at_muzzle, compare, how_maintained, how_swing, how_pullaway, how_ambush,
   stop_gun, clay_widths, lab_note, unit_m, unit_ft, unit_cm, unit_in, unit_ms, pair_report, pair_sim, pair_rafale ("{term}" = the
   pair's name), and every key that starts with "anim_" (anim_t_sonopull has "{term}" too).
   TERM NAMES (owner rule 08.10.2026: a professional term is always in English, the local word in brackets: uk "Swing-through
   (протяжка)", "Gun mount (вкладка)"; English pages: English only). Every term this file NAMES comes from the glossary through
   CFG.term(id) = {en, local} and is labelled by the ONE helper docs/shared/terms.js (window.ClayTerms.label; without that file on
   the page the English name is shown): the lead-lab method names (select, compare table, aria-label: glossary ids maintained-lead,
   swing-through, pull-away, ambush; the old ui keys m_* are gone), the flight tabs and the name under a flight ("Crosser (<local>)
   ->"), the pair tabs and captions (double-on-report, simultaneous-double, rafale-double), the stand-scene tabs gun-mount,
   ready-position and sonopull. TERM_IDS (exported) lists them all; the build writes their names into ui.json "terms" (Academy) and
   window.CLAYSIMS_TERMS (other pages). Words drawn ON the canvas stay English in every language, with no brackets (no room on a
   phone; the stand words the course teaches): Pick-up point, Hold point, Break point, Soft focus, Hard focus, and the lab and scene
   pills "decision", "shot", "lead", "line" (CANVAS_EN; until 08.10.2026 these four were translated: ui keys decision, shot_moment,
   lead_word, anim_line, removed 08.10.2026). Plain words on the canvas ("front foot", "body", "cheek on the comb") stay in the page
   language.
   The master texts are content/academy/ui/<lang>.json (11 languages); scripts/build_academy.mjs copies them into
   docs/shared/sims-text.js (list SIM_KEYS there) for pages outside the Academy (glossary, rules trainer), together with the names of
   the terms the animations show (window.CLAYSIMS_TERMS = {lang: {id: [en, local]}}, local = ClayTerms.local(): absent when it is the
   same word as the English). The style 10.2026 added no text key: the only
   new canvas word is the scale key "2 <unit_m>". The ballistics review (10.2026) rewrote lab_note and added anim_scale (the caption
   under the stand scenes; as an "anim_" key the build copies it without a change to SIM_KEYS). Literal canvas words that are never
   translated: "Pull!", "No Bird!", "!", "BANG", "♪", "A" (the trap letter).
   The build (scripts/build_academy.mjs) runs this file in a sandbox without a DOM ({window: {}, console}): top-level code must not
   touch document, matchMedia, devicePixelRatio, Path2D or Intl without a guard; caches and gradients are made inside the drawing
   functions only.
   In production (ClayArena): keep as one front-end module; texts come from the page's translation strings. */
(function () {
const CFG = {t: () => null, term: () => null, onHit: null, slow: false};
/* Anonymous site statistics (docs/shared/stats.js, loaded by nav.js): lead lab results ("lead") and pronunciation ("speak").
   Never throws; does nothing when the statistics are off. */
const stat = (name, value) => { try { if (window.ClayStats) window.ClayStats.event(name, value); } catch (e) {} };
/* English fallback texts (same as the "en" values in content/academy/ui/en.json). Used when a page has no text for a key yet. */
const DEF = {
  launch: "Launch", method: "Method",
  speed: "Target speed", distance: "Distance", demo: "Watch the method", try: "Your turn: press when you would shoot", shoot: "Shoot",
  hit: "Hit! The target breaks.", behind: "Behind — the shot passed behind the target", ahead: "In front — the shot passed ahead of the target",
  no_shot: "No shot fired.", perceived: "Lead you see at the decision", actual: "Actual lead at the shot", at_muzzle: "seen at the muzzle",
  compare: "Same target, four methods: the actual lead is the same, the lead you see is not",
  how_maintained: "The muzzles wait in front and the target closes the gap. Press Shoot when the gap looks right: the gun then moves at the target's speed and holds that lead.",
  how_swing: "The muzzles start behind the target and move faster than it. Press Shoot as the muzzles pass the front of the target: the gun keeps gaining during the delay, so the actual lead is bigger.",
  how_pullaway: "The muzzles move with the target first, then accelerate ahead. Press Shoot while the gun is still accelerating: the lead you see is smaller than the actual lead.",
  how_ambush: "The muzzles wait still at a point ahead. Press Shoot before the target reaches that point: the shot needs time, so a shot fired as the target arrives goes behind.",
  stop_gun: "Stop the gun at the trigger (a fault)", clay_widths: "target widths",
  lab_note: "Slow motion, simplified physics for teaching. The shot slows down as it flies: on average about 330 m/s over 15 m, 300 m/s over 25 m and 255 m/s over 40 m (it leaves the barrel at about 360–430 m/s). It takes about 0.15 s from the decision to the shot (an average estimate). The ring marks the part of the pattern dense enough to break the target: a radius of about 33 cm at 15 m and 45 cm at 40 m. The muzzle is about 1 m from the eye. Distances along the target's line, the lead and the ring are to scale; the target is drawn larger than life so you can see it (about to scale where the lead is counted in target widths). The actual lead depends on the target's speed, distance and angle, the cartridge and the shooter.",
  unit_m: "m", unit_ft: "ft", unit_cm: "cm", unit_in: "in", unit_ms: "m/s",
  pair_report: "{term}: the 2nd target is released at the sound of the 1st shot",
  pair_sim: "{term}: both targets are released together",
  pair_rafale: "{term}: the 2nd target from the same trap, as soon as the trap has reloaded",
  // controls, hero headings and captions, stand scenes (ui keys anim_*)
  anim_play: "Play", anim_replay: "Replay", anim_stop: "Stop", anim_slow: "Slow motion",
  anim_h_flight: "Watch how the target flies", anim_h_points: "Watch the three points", anim_h_eyes: "Watch where the eyes look",
  anim_h_stance: "Watch the stance", anim_h_pair: "Watch how a double is thrown", anim_h_lead: "Watch how the lead works",
  anim_h_mount: "Watch the gun mount", anim_h_follow: "Watch the follow-through", anim_h_call: "Watch the call and the release",
  anim_h_gunpos: "Watch the gun position", anim_h_misfire: "Watch what to do after a misfire",
  anim_w_flight: "Follow the whole flight: where the target comes from, where you see it clearly and where it goes.",
  anim_w_points: "The eyes wait at the pick-up point, the muzzles at the hold point; the target breaks at the break point.",
  anim_w_eyes: "Soft focus around the pick-up point, then hard focus on the front edge of the target.",
  anim_w_stance: "The front foot points at the break point; the body turns back to the hold point.",
  anim_w_pair: "Watch when the second target leaves: after the shot, together with the first, or from the same trap.",
  anim_w_lead: "Watch the gap between the muzzles and the target at the moment of the shot, then try it yourself.",
  anim_w_mount: "The muzzles move with the target first; the mount is finished as the shot comes.",
  anim_w_follow: "The gun keeps moving after the shot; stop it at the trigger and the shot goes behind.",
  anim_w_call: "The clock shows when the target leaves after the call or the referee's signal; a late target is a No Bird.",
  anim_w_gunpos: "In Sporting™ the stock stays below the line on the vest until the target appears.",
  anim_w_misfire: "After a misfire, stay put: gun closed and pointing down the range until the referee has checked it.",
  anim_unit_s: "s", anim_after_call: "after the call", anim_after_signal: "after the signal",
  anim_l_foot: "front foot", anim_l_body: "body", anim_cheek: "cheek on the comb",
  anim_t_signal: "Sporting™: referee's signal", anim_t_late: "Late target", anim_t_manual: "Compak® Sporting: by hand",
  anim_t_sonopull: "Compak® Sporting: {term}", anim_t_early: "Gun up at the call",
  anim_s_in_time: "The target leaves {n} s after the signal: in time (the limit is {max} s).",
  anim_s_late: "The target leaves {n} s after the signal, later than {max} s: the referee calls “No Bird” and the target is thrown again.",
  anim_s_manual: "Released by hand: the target leaves {n} s after the call (allowed: 0 to {max} s).",
  anim_s_sonopull: "Sonopull: the microphone hears the call and the target leaves {n} s later, every time.",
  anim_s_gun_low: "Ready position: the stock touches the body below the line on the vest.",
  anim_s_gun_mount: "The target has appeared: only now does the gun come up to the shoulder.",
  anim_s_early: "Called with the gun already at the shoulder: the first time, a spoken warning and a yellow card.",
  anim_s_click: "Click: the gun did not fire.",
  anim_s_hold: "Stay where you are: gun closed and pointing down the range; do not open it or touch the safety.",
  anim_s_ref: "The referee examines the gun.",
  anim_s_repeat: "First malfunction of the round: the target is thrown again.",
  anim_s_mount_ready: "Ready: the gun is low and the eyes wait for the target.",
  anim_s_move: "Move: the front hand starts the muzzles along the target's line.",
  anim_s_mount: "Mount: the stock comes up to the cheek and into the shoulder; the head stays still.",
  anim_s_shoot: "Shoot: the mount is finished as the shot comes.",
  anim_scale: "Only the shooter and the stand are to scale; the field and the target's flight are shortened.",
  anim_h_pattern: "Watch how the choke changes the pattern",
  anim_w_pattern: "A shot at a plate from 36.6 m (40 yards). Pick a choke: the tighter it is, the more shot lands in the 76 cm circle and the denser it is on the target in the centre.",
  anim_pattern_in: "In the 76 cm circle: ≈ {n}% of the shot",
  anim_h_miss: "Watch where the shot went",
  anim_w_miss: "What a coach standing behind the shooter sees: first where the shot went compared with the clay, then why. Switch the tabs.",
  anim_miss_behind: "Behind: the shot passed behind the target — not enough lead, or the gun slowed down or stopped. Very common on crossers.",
  anim_miss_front: "In front: too much lead, often after over-correcting. Many coaches like this miss: it shows the gun kept moving.",
  anim_miss_over: "Over: common on dropping targets, rabbits and incomers, and often linked to the head coming off the stock.",
  anim_miss_under: "Under: typical on rising targets that are still climbing at the shot.",
  anim_h_ties: "Watch how ties are broken",
  anim_w_ties: "Places 1–3: a shoot-off; below third: countback (in Compak® Sporting the same, from the 8th Compak to the 1st). The numbers are an example: 200 targets, 8 layouts of 25.",
  anim_ties_shooter: "Shooter", anim_ties_total: "Total", anim_ties_place: "Place", anim_ties_layout: "Layout",
  anim_ties_so: "Shoot-off (25)", anim_ties_sd: "Sudden death",
  anim_ties_cb0: "D and E both have 181 of 200: 5th place. Below third there is no shoot-off — countback decides the order on the score sheet.",
  anim_ties_cb_eq: "Layout {n}: {a} : {b} — level, look at the one before.",
  anim_ties_cb_win: "Layout {n}: {a} : {b} — {who} is listed higher. Both keep the same place: 5=.",
  anim_ties_so0: "A and B both have 192 of 200 — a tie for 1st place. A shoot-off decides it: a round of 25 targets.",
  anim_ties_so1: "Shoot-off: {a} : {b} — still level. Now sudden death: the first to miss is out.",
  anim_ties_sd_ok: "Target {n}: both hit.",
  anim_ties_sd_both: "Target {n}: both missed. They have shot the same number of targets, so nobody is out.",
  anim_ties_sd_out: "Target {n}: A hit, B missed — B is out. A takes 1st place.",
  anim_h_stock: "See how a stock is measured",
  anim_w_stock: "A coach or a gun fitter sets the stock dimensions; the numbers here are only a guide.",
  anim_stock_b_fit: "Fits", anim_stock_b_short: "Too short", anim_stock_b_long: "Too long", anim_stock_b_off: "Cast off", anim_stock_b_on: "Cast on",
  anim_stock_fit: "Length of pull is measured from the trigger to the middle of the butt pad. For adults it is often about 36–38 cm (14¼–15 in); many factory competition guns come at about 37.5 cm (14¾ in). This is only a guide.",
  anim_stock_short: "Too short: under recoil the thumb of the trigger hand may hit your nose, and recoil feels stronger.",
  anim_stock_long: "Too long: the stock catches on your clothes as you mount the gun and may land on the arm instead of the shoulder.",
  anim_stock_off: "Cast off: the stock bends slightly to the right, for a right-handed shooter, so that the eye sits exactly over the rib. It is a matter of a few millimetres; the drawing exaggerates it.",
  anim_stock_on: "Cast on: the stock bends to the left, for a left-handed shooter. Without the cast a shooter needs, a gun may keep shooting to one side.",
  anim_pattern_load: "Simplified. 28 g of No. 7½ shot is about 370 pellets; the percentages are a guide for lead shot, and your gun and cartridge may give different ones. The target (110 mm) and the circle are to scale.",
};
const T = k => { const v = CFG.t(k); return v == null || v === "" ? (DEF[k] ?? k) : v; };
const TERM = id => CFG.term(id);
/* Pills drawn on the canvas: English in every language (see TERM NAMES in the header). */
const CANVAS_EN = {decision: "decision", shot: "shot", lead: "lead", line: "line"};
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]));
const sq = x => x * x;
const lerp = (a, b, k) => a + (b - a) * k, clamp01 = x => Math.max(0, Math.min(1, x)), ease = k => k * k * (3 - 2 * k);
const fill = (s, v) => String(s).replace(/\{(\w+)\}/g, (m, k) => (v[k] != null ? v[k] : m));
const pageLang = () => { try { return (document.documentElement.lang || "en").slice(0, 2); } catch (e) { return "en"; } };
const num1 = n => { try { return new Intl.NumberFormat(pageLang(), {minimumFractionDigits: 1, maximumFractionDigits: 1}).format(n); } catch (e) { return n.toFixed(1); } };
const RM = () => { try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; } };
let SIMS = [];
function stopSims(){ SIMS.forEach(s => s.stop && s.stop()); SIMS = []; }
const CSS = `.cs-sim{border:1px solid rgba(255,255,255,.1);border-radius:14px;overflow:hidden;background:#06101d;margin:16px 0}
.cs-sim canvas{display:block;width:100%;height:auto;max-height:70vh;object-fit:contain;touch-action:manipulation}
.cs-words{padding:8px 12px 2px;font-size:14px;line-height:1.45;color:#6B7280}.cs-words b{color:#F3F4F6}
.cs-ctl{display:flex;gap:8px 12px;flex-wrap:wrap;align-items:center;padding:10px 12px;border-top:1px solid rgba(255,255,255,.1);font-size:13.5px;color:#D1D5DB}
.cs-ctl label{display:flex;gap:6px;align-items:center;min-width:0;max-width:100%}.cs-ctl input[type=range]{width:110px;accent-color:#34D399}.cs-ctl input[type=checkbox]{accent-color:#FB923C}
.cs-ctl select{background:#0B1120;color:#F3F4F6;border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:5px 8px;font:inherit;min-width:0;max-width:100%;flex:1 1 auto;text-overflow:ellipsis}
.cs-btn{display:inline-flex;align-items:center;gap:6px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);color:#F3F4F6;border-radius:10px;padding:7px 13px;font:inherit;font-size:14px;cursor:pointer}
.cs-btn:hover{border-color:rgba(52,211,153,.5)}.cs-primary{background:#059669;border-color:#059669;color:#fff;font-weight:600}.cs-btn[disabled]{opacity:.45;cursor:default}
.cs-btn:focus-visible{outline:2px solid #34D399;outline-offset:2px}
.cs-play{min-height:44px;padding:9px 20px;font-size:15.5px}.cs-slow{min-height:44px}
.cs-slow[aria-pressed="true"]{border-color:#34D399;color:#34D399;background:rgba(52,211,153,.12)}
.cs-out{padding:0 12px 12px;font-size:14px;color:#D1D5DB}.cs-out:empty{display:none}.cs-note{font-size:12.5px;color:#9CA3AF}.cs-hit{color:#34D399}.cs-miss{color:#FB923C}.cs-muted{color:#9CA3AF}
.cs-say{padding:10px 12px 12px;font-size:14.5px;line-height:1.5;color:#E5E7EB;min-height:3.2em;border-top:1px solid rgba(255,255,255,.06)}
.cs-scale{margin:0;padding:5px 12px 7px;font-size:12.5px;line-height:1.4;color:#9CA3AF}
.cs-tabs{display:flex;gap:6px;flex-wrap:wrap;margin:12px 0 -6px}.cs-tabs .cs-btn{min-height:40px}
.cs-tie{overflow-x:auto;padding:10px 12px 2px}.cs-tie table{border-collapse:collapse;width:100%;font-size:14px;font-variant-numeric:tabular-nums}.cs-tie caption{text-align:left;padding:0 0 4px}.cs-tie th,.cs-tie td{padding:6px 5px;text-align:center;border-bottom:1px solid rgba(255,255,255,.08);color:#E5E7EB;transition:background .3s}.cs-tie th{font-size:12px;color:#9CA3AF;font-weight:600}.cs-tie .cs-nm{font-weight:700}.cs-tie .cs-tc{background:rgba(34,211,238,.16)}.cs-tie .cs-w{color:#34D399;font-weight:700}.cs-tie .cs-x{color:#F87171;font-weight:700}.cs-tie tr.cs-gone td{opacity:.45}
@media (max-width:440px){.cs-tie{padding:8px 6px 2px}.cs-tie table{font-size:12.5px}.cs-tie th,.cs-tie td{padding:5px 2px}.cs-tie th{font-size:11px}}
.cs-hero{margin:14px 0 20px}.cs-hero-h{font-weight:700;font-size:18px;color:#34D399;margin:0 0 4px}.cs-hero-w{font-size:14px;color:#9CA3AF;margin:4px 0 0}
.cs-hero .cs-sim{margin:10px 0 0}
.cs-cmp{overflow-x:auto}.cs-cmp table{border-collapse:collapse;width:100%;font-size:13px;margin-top:6px}.cs-cmp td,.cs-cmp th{padding:4px 6px;border-bottom:1px solid rgba(255,255,255,.1);text-align:left;vertical-align:top}.cs-cmp th{color:#9CA3AF;font-weight:600}
@media print{.cs-ctl,.cs-tabs,.cs-words,.cs-out:not(.cs-cmp){display:none!important}.cs-sim{break-inside:avoid}}`;
if (typeof document !== "undefined" && !document.getElementById("cs-sims-css")) { const st = document.createElement("style"); st.id = "cs-sims-css"; st.textContent = CSS; document.head.appendChild(st); }

/* Canvas size (style 10.2026). Every sim draws in a fixed LOGICAL space (cv._lw × cv._lh, set once at mount by logical(): 720 × 380,
   the lead lab 720 × 300, a stand scene 380 + its clock band). fit(cv, c) runs before every frame:
   - c._fk = logical px per CSS px (1 on wide screens, at most 2.2) for text sizes and label distances, c._mk = a gentler factor (at
     most 1.6) for marks: the target, the muzzle mark, the points (audit: on a 375 px phone the 720 px canvas is drawn about 305 px
     wide, so 12 px labels became about 5 px). The k measure is object-fit: contain aware (max of the two ratios).
   - the backing store = logical size × s, s = devicePixelRatio / k, between 1 and DPR_MAX (2: more adds memory, not visible
     sharpness), so the canvas is crisp on high-DPI phones; c._s = s and the transform maps logical units to backing pixels. The
     canvas is resized only when s changes (a resize clears it). In production: the same in the ClayArena front end. */
const DPR_MAX = 2;
const logical = (cv, w, h) => { cv._lw = w; cv._lh = h; return cv; };
function fit(cv, c){
  const LW = cv._lw || 720, LH = cv._lh || 380, w = cv.clientWidth, h = cv.clientHeight;
  const k = w > 0 && h > 0 ? Math.max(LW / w, LH / h) : 1;
  c._fk = Math.max(1, Math.min(2.2, k)); c._mk = Math.max(1, Math.min(1.6, 1 + (k - 1) * .5));
  let dpr = 1; try { dpr = window.devicePixelRatio || 1; } catch (e) {}
  const s = Math.max(1, Math.min(DPR_MAX, dpr / k)), bw = Math.round(LW * s), bh = Math.round(LH * s);
  if (cv.width !== bw || cv.height !== bh) { cv.width = bw; cv.height = bh; }
  c._s = bw / LW; c.setTransform(c._s, 0, 0, c._s, 0, 0);
}
const FK = c => c._fk || 1, MK = c => c._mk || 1;
const font = (c, px, weight) => { c.font = `${weight ? weight + " " : ""}${Math.round(px * FK(c))}px system-ui`; };
/* redraw(): called when the canvas changes width (a phone turned, a window resized, a browser zoom), so the still picture keeps
   readable labels and a sharp backing store */
function watchSize(cv, redraw){ if (typeof ResizeObserver !== "function") return () => {}; let w = cv.clientWidth;
  const ro = new ResizeObserver(() => { const n = cv.clientWidth; if (n > 0 && Math.abs(n - w) > 2) { w = n; try { redraw(); } catch (e) {} } });
  ro.observe(cv); return () => ro.disconnect(); }
/* The coach's words above the canvas (English stand words, lang="en"; decorative for screen readers: the status line and the
   result say it). Rewritten only when the highlighted word changes. */
function wordsBar(el){ let key = null; return (ws, cur) => { if (!el) return; const k = ws.join("|") + "#" + cur; if (k === key) return; key = k;
  el.innerHTML = ws.map((w, i) => i === cur ? `<b>“${esc(w)}”</b>` : `“${esc(w)}”`).join(" · "); }; }

/* Shared controls: the big play / stop / replay button, the slow-motion toggle (one setting for the whole page) and the one-time
   autoplay. */
const slowF = () => (CFG.slow ? 2.5 : 1);
const playBtn = key => `<button type="button" class="cs-btn cs-primary cs-play" data-play>▶ ${esc(T(key))}</button>`;
const slowBtn = () => `<button type="button" class="cs-btn cs-slow" data-slow aria-pressed="${CFG.slow ? "true" : "false"}">🐢 ${esc(T("anim_slow"))}</button>`;
/* while it runs the play button stops it (⏹), afterwards it replays it (↻) */
const setPlay = (host, on) => { const b = host.querySelector("[data-play]"); if (!b) return; b.dataset.on = on ? "1" : ""; b.textContent = on ? "⏹ " + T("anim_stop") : "↻ " + T("anim_replay"); };
const syncSlow = () => { try { document.querySelectorAll("[data-slow]").forEach(b => b.setAttribute("aria-pressed", CFG.slow ? "true" : "false")); } catch (e) {} };
function wire(host, run, onSlow, halt){ const p = host.querySelector("[data-play]"); if (p) p.onclick = () => (p.dataset.on && halt ? halt() : run());
  const s = host.querySelector("[data-slow]"); if (s) s.onclick = () => { CFG.slow = !CFG.slow; syncSlow(); (onSlow || run)(); }; }
/* autoStart(host, target, run, mode, done, onUser): the one-time autoplay (see the header). target = the canvas: the visibility is
   measured on it, not on the whole block (a lead lab with its controls and table can be taller than a phone held sideways, so half
   of the block was never on screen). A click, input or change inside host cancels a pending autoplay first (capture phase, before the
   button's own handler) and calls onUser() once. Returns off(), which cancels it (also called by stop()). */
const USER_EVENTS = ["click", "input", "change"];
function autoStart(host, target, run, mode, done, onUser){
  if (!mode || (mode === "view" && RM())) return () => {};
  let io = null, timer = 0, live = true;
  const off = () => { if (!live) return; live = false; if (io) io.disconnect(); clearTimeout(timer); USER_EVENTS.forEach(e => host.removeEventListener(e, user, true)); };
  const user = () => { if (!live) return; off(); if (onUser) { try { onUser(); } catch (e) {} } };
  const go = () => { if (!live) return; off(); run(); if (done) { try { done(); } catch (e) {} } };
  USER_EVENTS.forEach(e => host.addEventListener(e, user, true));
  if (mode === "view" && typeof IntersectionObserver === "function") {
    io = new IntersectionObserver(es => { const e = es[es.length - 1]; if (!e || !e.isIntersecting || timer) return;
      const need = Math.min(e.boundingClientRect.height * .5, (window.innerHeight || 0) * .6);
      if (e.intersectionRect.height >= need - 1) { io.disconnect(); timer = setTimeout(go, 250); } }, {threshold: [0, .1, .2, .3, .4, .5]});
    io.observe(target || host);
  } else timer = setTimeout(go, 300);
  return off;
}

/* Flight presets: p(t) = position in a 0..1 screen box (y down) for t = 0..1, s(t) = size scale, optional ar(t) = disc aspect
   (0.1 = edge-on, 1 = full face; default 0.38) and rot(t) = tilt in radians. The shooter stands bottom centre; the tree line is at
   y ≈ 0.76. Shapes follow the lessons (flight mission) and the glossary definitions. SAFETY: a flight may start beside the stand (a
   trap house there), but it never ends on or next to the stand: it ends in the sky, off the screen or in the field at the tree line
   (y ≤ 0.78), or (rabbit) rolls across at the edge of the wood. */
const FLIGHTS = {
  "crosser-lr":   {p: t => [-.05 + 1.1*t, .5 - .22*Math.sin(Math.PI*t)], s: () => .8, term: "crosser"},
  "crosser-rl":   {p: t => [1.05 - 1.1*t, .5 - .22*Math.sin(Math.PI*t)], s: () => .8, term: "crosser"},
  // incomer: small and far, grows as it comes, climbs a little in view, then drops in front of the shooter (taken out in front)
  "incomer":      {p: t => [.52 - .05*t, .5 - .7*t + .75*t*t], s: t => .3 + 1.3*t*t, term: "incomer"},
  // driven: an incomer that keeps climbing in view and passes over the shooter's head (only this one leaves at the top)
  "driven":       {p: t => [.49 + .02*t, .5 - .66*t*t], s: t => .3 + 1.7*t*t, term: "driven-target"},
  // going-away: leaves from near the shooter, rises and shrinks quickly
  "going-away":   {p: t => [.5 + .04*t, .82 - .5*Math.sqrt(t)], s: t => 1.5 - 1.15*t, term: "going-away"},
  // overhead from behind: comes over the shooter's back, so it is seen late — it enters big at the top and goes away towards the horizon
  "overhead":     {p: t => [.47 + .06*t, -.3 + .8*Math.sqrt(t)], s: t => 1.8 - 1.45*t, term: "overhead"},
  "quartering-away": {p: t => [.32 + .5*t, .8 - .5*Math.sqrt(t)], s: t => 1.4 - 1.05*t, term: "quartering-away"},
  "quartering-towards": {p: t => [.9 - .55*t, .3 + .1*t - .25*Math.sin(Math.PI*t)], s: t => .4 + .9*t, term: "quartering-towards"},
  // teal: almost straight up, stalls at the peak (t ≈ 0.55) and falls back clearly
  "teal":         {p: t => [.6 + .05*t, .9 - .75*(1 - sq((t - .55) / .55))], s: () => .8, term: "teal"},
  // chandelle: steep climb on a slight curve, arcs over at the top, drops almost vertically (a narrow, high arch); it starts beside
  // the stand (a trap house there) and an unbroken target comes down in the field, at the tree line, never on the stand
  "chandelle":    {p: t => [.32 + .13*(1 - Math.cos(Math.PI*t)), .86 - .72*Math.sin(Math.PI*t) - .12*t], s: () => .8, term: "chandelle"},
  // looper: a wide rainbow arc across the sky; drawn as a standard target that shows more of its face as it turns over the top
  "looper":       {p: t => [.04 + .92*t, .78 - .62*Math.sin(Math.PI*t)], s: () => .8, ar: t => .3 + .35*Math.sin(Math.PI*t), rot: t => (t - .5)*.9, term: "looper"},
  // battue: a thin target flying fast and edge-on, then it turns over (shows its face) and drops steeply
  "battue":       {p: t => t < .6 ? [.05 + t, .45 - .12*t] : (u => [.65 + u - 1.1*u*u, .378 - .12*u + 2.6*u*u])(t - .6),
                   s: () => .8, ar: t => t < .55 ? .1 : Math.min(.7, .1 + (t - .55)*4), rot: t => t < .55 ? 0 : (t - .55)*5, term: "battue"},
  // dropping: falls from high up, faster and faster; an unbroken target comes down in the field at the tree line (y .74), never on
  // the stand (audit 08.10.2026: it ended at y .88, beside the shooter's mark)
  "dropping":     {p: t => [.28 + .3*t, .08 + .66*t*t], s: () => .8, term: "dropping-target"},
  // rabbit: rolls and hops along the ground at the edge of the wood (y ≈ 0.76–0.8), clear of the shooter's mark at the bottom
  "rabbit":       {p: t => [1.05 - 1.1*t, .8 - .04*Math.abs(Math.sin(t*9))], s: () => .9, rabbit: 1, term: "rabbit"},
  // springing (glossary: climbs steeply at an angle, like a bird flushing from the ground; 06.11.2026): unlike the teal (almost
  // straight up, near the stand) it leaves from the field at the tree line well to the left of the stand, climbs at a steep angle
  // AWAY from the shooter (it shrinks): about 75° in the first third, slows at the top (t ≈ 0.3) and falls away on a long, shallow
  // slope back to the tree line (review 06.11.2026: a symmetric arch looked like the looper)
  "springing":    {p: t => [.22 + .6*Math.pow(t, 1.6), .76 - .6*Math.sin(Math.PI*Math.pow(t, .6))], s: t => 1 - .45*t, term: "springing-target"},
  // bolting rabbit (glossary: bursts out of cover and runs fast along the ground; 06.11.2026): it comes out of the wood at the tree
  // line (y .76 → .8) right of the stand, then runs right to left with low quick hops, faster than the rabbit (f.dur .7: the same
  // kind of stretch in less time); it rolls along the edge of the wood like the rabbit, clear of the shooter's mark
  "bolting":      {p: t => { const k = Math.min(1, t/.1); return [.78 - .9*t, .76 + .04*k - .03*Math.abs(Math.sin(t*14))*k]; }, s: () => .9, rabbit: 1,
                   dur: .7, term: "bolting-rabbit"},
};

/* ======================= ART (style 10.2026) =======================
   Everything from here to "end of ART" only DRAWS; it decides nothing a lesson teaches. Numbers marked TEACHING are geometry the
   lessons rely on (keep them); every other number is only looks and can be changed freely. Colours: ART (one colour = one meaning,
   see STYLE in the header) and PAL (people, wood, steel). Reference: the owner-approved concept A mockup (08.10.2026) with the
   grafts from B and C; all drawings are our own, made from primitives in code (no traced artwork, no images). */
const TAU = Math.PI * 2;
const easeOut = k => 1 - Math.pow(1 - k, 3);
/* seeded random (Park–Miller): the same trees, grass, shards and pellets on every load and every replay */
const rng = seed => { let s = seed % 2147483647; if (s <= 0) s += 2147483646; return () => (s = s * 16807 % 2147483647) / 2147483647; };
const rgba = (col, a) => { if (typeof col !== "string" || col[0] !== "#") return col; const n = parseInt(col.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
const ART = {
  sky0: "#040b18", sky1: "#081a2f", sky2: "#0d2c43", sky3: "#16485a",                 // evening sky, top → horizon
  hill: "#0f2e46", treeFar: "#0c2738", treeMid: "#081d2b", treeNear: "#05131c",         // depth layers: nearer = darker
  grassHaze: "#1a4a3a", grass: "#133d2d", grassDeep: "#0a2219",
  em: "#34D399",                                     // guidance and good: lead bracket, break point, "in time", the release pulse
  mint: "#6EE7B7", path: "rgba(110,231,183,.55)", path2: "rgba(167,243,208,.38)",   // the flight line (dots, chevron); 2nd target of a pair
  cyan: "#22D3EE",                                   // the muzzles: muzzle mark, hold point, gun line, muzzle history, pattern ring, sound signal
  amber: "#FBBF24",                                  // attention and the eyes: line on the vest, decision, pick-up point, focus, cheek, lenses
  red: "#F87171",                                    // a fault: line crossed, late target
  ink: "#F3F4F6", muted: "#9CA3AF", pill: "rgba(3,9,20,.82)",
  clayHi: "#FFA766", clayTop: "#FF6B1A", clayLo: "#D04E0A", clayRing: "#B8430A", clayRim: "#17110D", clayBody: "#C2410C",   // ORANGE = only the clay
};
const PAL = {   // people, wood and steel (looks only)
  skin: ["#9B6A4F", "#C48E6E", "#E2B494"], skinFar: ["#7E553F", "#A47458", "#B8876A"], hair: "#2a1f17",
  vest: ["#323d29", "#4b5839", "#6a7a51"], vestDark: "#2b3423", vestPad: "#6c4d32",
  shirt: ["#8f8778", "#c3baa7", "#e2dacb"], shirtFar: ["#6d675c", "#958d7d", "#a89f8e"], shirtBack: ["#5f594f", "#8e8676", "#b3aa98"],
  trousers: ["#1b222c", "#2b3542", "#465363"], trousersFar: ["#151b23", "#222a35", "#2f3a48"],
  shoe: ["#24180f", "#3d2a1b", "#5a4029"], shoeFar: ["#1c130c", "#2f2116", "#3e2c1d"],
  capShooter: ["#035e45", "#059669", "#2fbf8f"], visorShooter: "#034a37",                          // the shooter's cap: ClayArena emerald
  ref: ["#1d3557", "#2c5282", "#4a77ad"], refFar: ["#172a45", "#233f66", "#2f5384"], capRef: ["#13306b", "#1d4ed8", "#4f7cf0"], visorRef: "#112a63",
  trap: ["#2d3238", "#474e57", "#666e78"], trapFar: ["#23272c", "#363c43", "#454c55"], capTrap: ["#2a2f36", "#3f4650", "#5b6470"], visorTrap: "#22272d",
  handler: ["#3a2a1f", "#5a4131", "#7a5b45"], handlerFar: ["#2c2018", "#443226", "#5a4535"], capHandler: ["#2b2119", "#4a3a2c", "#66513f"], visorHandler: "#241b14",
  // protection, drawn a little larger than true scale on purpose (teaching emphasis): dark cups with an emerald rim, amber lenses
  muff: "#18212c", muffRim: "#10B981", muffBand: "#121922", lens: "rgba(251,191,36,.92)", frame: "#0f141b",
  lead: "#D39338",                                   // the dog's lead (mascot palette)
};
const seg = (c, x1, y1, x2, y2) => { c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); };
const dot = (c, x, y, r) => { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); };
const box = (c, x, y, w, h, r) => { c.beginPath(); if (c.roundRect) c.roundRect(x, y, w, h, r); else c.rect(x, y, w, h); };
/* smooth closed outline through points (Catmull-Rom → Bézier) */
function spline(c, pts, closed = true){
  const n = pts.length, P = i => pts[closed ? (i + n) % n : Math.max(0, Math.min(n - 1, i))];
  c.moveTo(pts[0][0], pts[0][1]);
  for (let i = 0; i < (closed ? n : n - 1); i++) { const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    c.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]); }
  if (closed) c.closePath();
}
/* soft shading, one light direction (the sky glow from the range side, on the right): dark at the back, the base colour, a thin rim
   of sky light on the front edge. No outlines, no shadowBlur. */
function shade(c, x0, x1, cols){ const g = c.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, cols[0]); g.addColorStop(.6, cols[1]); g.addColorStop(.9, cols[1]); g.addColorStop(1, cols[2]); return g; }
function limbPath(c, x1, y1, r1, x2, y2, r2){ const a = Math.atan2(y2 - y1, x2 - x1);
  c.beginPath(); c.arc(x1, y1, r1, a + Math.PI / 2, a - Math.PI / 2); c.arc(x2, y2, r2, a - Math.PI / 2, a + Math.PI / 2); c.closePath(); }
/* a tapered capsule (arm, leg, neck) */
function limb(c, p1, r1, p2, r2, cols){ limbPath(c, p1[0], p1[1], r1, p2[0], p2[1], r2);
  c.fillStyle = shade(c, Math.min(p1[0] - r1, p2[0] - r2), Math.max(p1[0] + r1, p2[0] + r2), cols); c.fill(); }
/* two-bone reach (shoulder S → elbow → wrist T, bone lengths L1, L2); bend = +1: elbow below the line. A target out of reach
   stretches both bones a little (only the lowered SAFE pose needs it), so the hand stays on the gun. */
function ik(S, T, L1, L2, bend){ const dx = T[0] - S[0], dy = T[1] - S[1], D = Math.hypot(dx, dy), q = Math.max(1, D / (L1 + L2 - .01));
  L1 *= q; L2 *= q; const d = Math.max(1, Math.min(L1 + L2 - .01, D)), a = Math.atan2(dy, dx);
  const A = Math.acos(Math.max(-1, Math.min(1, (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d)))); return [S[0] + L1 * Math.cos(a + bend * A), S[1] + L1 * Math.sin(a + bend * A)]; }
function hand(c, p, a, s, cols, len = 4.8){ c.save(); c.translate(p[0], p[1]); c.rotate(a); c.fillStyle = shade(c, -len, len, cols); c.beginPath(); c.ellipse(len * .45 * s, 0, len * s, 3.3 * s, 0, 0, TAU); c.fill(); c.restore(); }
function shoe(c, ank, s, cols, L){ const x0 = ank[0] - 7 * s;
  c.beginPath(); spline(c, [[x0, GY], [x0 + .4 * s, GY - 6 * s], [ank[0] - 1 * s, GY - 9 * s], [ank[0] + 7 * s, GY - 7.5 * s], [x0 + L - 2.5 * s, GY - 3.6 * s], [x0 + L, GY - 1.2 * s], [x0 + L - 1.2 * s, GY]]);
  c.fillStyle = shade(c, x0, x0 + L, cols); c.fill(); c.fillStyle = "#0d0906"; c.fillRect(x0, GY - 1.6 * s, L, 1.6 * s); }
function leg(c, hip, knee, ank, s, cols){ limb(c, hip, 8.6 * s, knee, 6 * s, cols); limb(c, knee, 6 * s, ank, 4.3 * s, cols); }

/* ---- Words on the canvas ---- */
/* label(c, text, x, y, color, align): a word on a dark rounded pill (1 px border in its colour at 38 %), so it reads over sky, trees
   and grass, also at half size on a phone. y = the text baseline (as before the style). The pill is kept inside the canvas.
   Returns its box {x, y, w, h} (collision checks in the lead lab). o.size / o.weight / o.border: optional. */
function pillBox(c, text, x, y, align, size, weight){
  const k = FK(c), fs = size * k; c.font = `${weight} ${Math.round(fs)}px system-ui`;
  const w = c.measureText(text).width, px = 6.5 * k, h = fs * 1.1 + 8 * k, top = y - fs * .86 - 4 * k, ww = w + 2 * px;
  const x0 = align === "center" ? x - w / 2 - px : align === "right" ? x - w - px : x - px;
  const LW = (c.canvas && c.canvas._lw) || 720, x1 = Math.max(4, Math.min(LW - 4 - ww, x0));
  return {x: x1, y: top, w: ww, h, dx: x1 - x0};
}
function label(c, text, x, y, color, align = "center", o = {}){
  const b = pillBox(c, text, x, y, align, o.size || 12, o.weight || "650");
  c.fillStyle = ART.pill; box(c, b.x, b.y, b.w, b.h, b.h / 2); c.fill();
  c.strokeStyle = o.border || rgba(color, .38); c.lineWidth = 1; c.stroke();
  c.fillStyle = color; c.textAlign = align; c.textBaseline = "alphabetic"; c.fillText(text, x + b.dx, y);
  return b;
}
const overlap = (a, b) => a && b && a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
/* placeLabel(c, text, x, y, r, color, taken, order): a label pill next to a mark at (x, y) of radius r, at the first side in
   order ("a" above, "b" below, "r" right, "l" left) where it covers nothing in taken (boxes of marks and pills already drawn) and
   stays on the canvas; else at the first side. Adds its box to taken. On a phone the words are 2× bigger, so fixed spots collided. */
const markBox = (x, y, rx, ry = rx) => ({x: x - rx, y: y - ry, w: 2 * rx, h: 2 * ry});
function placeLabel(c, text, x, y, r, color, taken, order = "abrl"){
  const k = FK(c), fs = 12 * k, g = 5 * k, px = 6.5 * k, LH = (c.canvas && c.canvas._lh) || 380;
  const spot = s => s === "a" ? [x, y - r - g - fs * .24 - 4 * k, "center"] : s === "b" ? [x, y + r + g + fs * .86 + 4 * k, "center"]
    : s === "r" ? [x + r + g + px, y + fs * .31, "left"] : [x - r - g - px, y + fs * .31, "right"];
  let pick = null;
  for (const s of order) { const [tx, ty, al] = spot(s), b = pillBox(c, text, tx, ty, al, 12, "650");
    const fits = b.y >= 2 && b.y + b.h <= LH - 2 && Math.abs(b.dx) < 1 && !taken.some(o => overlap(o, b));
    if (fits) { pick = [tx, ty, al]; break; } if (!pick) pick = [tx, ty, al]; }
  const b = label(c, text, pick[0], pick[1], color, pick[2]); taken.push(b); return b;
}
/* bubble(c, x, y, text, o): a speech bubble whose tail tip is at (x, y + 10) (as before the style); body centred on x, a soft
   offset shadow (no blur). o.bg / o.fg colours, o.size, o.age = seconds since it appeared: it pops in (scale .86 → 1 in 0.12 s
   about the tail tip), never with reduced motion. */
function bubble(c, x, y, text, o = {}){
  const k = FK(c), fs = (o.size || 16) * k; c.font = `800 ${Math.round(fs)}px system-ui`;
  const w = c.measureText(text).width + 24 * k, h = fs + 16 * k, ty = y + 10, bot = ty - 11 * k, top = bot - h;
  const sc = o.age != null && o.age < .12 && !RM() ? .86 + .14 * easeOut(clamp01(o.age / .12)) : 1;
  c.save(); if (sc !== 1) { c.translate(x, ty); c.scale(sc, sc); c.translate(-x, -ty); }
  const LW = (c.canvas && c.canvas._lw) || 720, bx = Math.max(4, Math.min(LW - 4 - w, x - w / 2)), cx = bx + w / 2; // body kept on the canvas, the tail stays
  const shape = () => { box(c, bx, top, w, h, 12 * k); c.moveTo(x - 7 * k, bot - .5); c.quadraticCurveTo(x - 4 * k, bot + 5 * k, x, ty);
    c.quadraticCurveTo(x + 1 * k, bot + 3 * k, x + 6 * k, bot - .5); c.closePath(); };
  c.save(); c.translate(0, 3 * k); c.fillStyle = "rgba(0,0,0,.38)"; shape(); c.fill(); c.restore();
  c.fillStyle = o.bg || "#F8FAFC"; shape(); c.fill();
  c.fillStyle = o.fg || "#0B1120"; c.textAlign = "center"; c.textBaseline = "alphabetic"; c.fillText(text, cx, top + h / 2 + fs * .36);
  c.restore();
}

/* ---- Targets ---- */
/* FITASC-relative sizes (standard target 110 mm): d = diameter factor, h = height / diameter (approximate): midi 90 mm, mini 60 mm,
   battue 108 mm and very thin, rabbit 110 mm with a thick reinforced rim. Midi and mini are here for later (no scene uses them yet). */
const KIND = {standard: {d: 1, h: .23}, midi: {d: .82, h: .25}, mini: {d: .55, h: .37}, battue: {d: .98, h: .085}, rabbit: {d: 1, h: .23, rim: 1.5}};
/* clay(c, x, y, s, f, t, o): the target. s = size scale (radius 9·s logical px × MK, as before the style), f = its flight (f.ar(t) =
   aspect, f.rot(t) = tilt, f.rabbit, f.term "battue" → the battue kind), t = flight time. o (optional): {spin (highlight angle),
   kind (KIND key), look ("dome" = black body + orange painted dome, the common target; "orange" = all-orange body, the battue's look,
   so an edge-on battue never vanishes on the dark sky), ghost (dashed outline only: where the target was at the decision), glow
   (radius of the glow in logical px × MK; default 2.8 × the target's radius: the lead lab's true-scale target in "lead-units" keeps
   the glow of a normal-size one, so a 1.4 px target stays visible)}.
   Order: glow, black body and rim, a light lower edge, the orange dome, its painted ring, a spinning highlight. */
function clay(c, x, y, s, f, t = 0, o = {}){
  f = f || {}; o = o || {};
  const kind = o.kind || (f.rabbit ? "rabbit" : f.term === "battue" ? "battue" : "standard"), K = KIND[kind] || KIND.standard;
  const look = o.look || (kind === "battue" ? "orange" : "dome"), m = MK(c), r = 9 * s * K.d * m;
  const ar = f.ar ? f.ar(t) : f.rabbit ? .55 : .38, ry = Math.max(1, r * ar), rim = Math.max(1.1 * m, r * K.h * 2 * Math.sqrt(Math.max(0, 1 - ar * ar)) * (K.rim || 1));
  c.save(); c.translate(x, y); c.rotate(f.rot ? f.rot(t) : 0);
  if (o.ghost) { c.setLineDash([3 * m, 3 * m]); c.lineWidth = 1.4 * m; c.strokeStyle = "rgba(255,107,26,.8)"; c.fillStyle = "rgba(255,107,26,.15)";
    c.beginPath(); c.ellipse(0, rim / 2, r, ry + rim / 2, 0, 0, TAU); c.fill(); c.stroke(); c.setLineDash([]); c.restore(); return; }
  const gr = o.glow ? o.glow * m : r * 2.8, gl = c.createRadialGradient(0, rim / 2, 0, 0, rim / 2, gr); gl.addColorStop(0, "rgba(255,120,40,.34)"); gl.addColorStop(1, "rgba(255,120,40,0)");
  const ge = o.glow ? gr * 1.08 : r * 3; c.fillStyle = gl; c.fillRect(-ge, -ge, ge * 2, ge * 2);           // glow: the brightest thing on screen
  c.fillStyle = look === "orange" ? ART.clayBody : ART.clayRim; c.beginPath(); c.ellipse(0, rim, r, ry, 0, 0, TAU); c.fill(); c.fillRect(-r, 0, 2 * r, rim);   // body, rim
  c.strokeStyle = "rgba(255,255,255,.16)"; c.lineWidth = .8 * m; c.beginPath(); c.ellipse(0, rim, r, ry, 0, .15 * Math.PI, .85 * Math.PI); c.stroke();
  const g = c.createLinearGradient(-r, -ry, r * .6, ry); g.addColorStop(0, ART.clayHi); g.addColorStop(.45, ART.clayTop); g.addColorStop(1, ART.clayLo);
  c.fillStyle = g; c.beginPath(); c.ellipse(0, 0, r, ry, 0, 0, TAU); c.fill();                            // orange dome
  c.strokeStyle = rgba(ART.clayRing, .8); c.lineWidth = .9 * m; c.beginPath(); c.ellipse(0, 0, r * .58, ry * .58, 0, 0, TAU); c.stroke();   // painted ring
  if (o.spin != null) { c.strokeStyle = "rgba(255,240,220,.7)"; c.lineWidth = 1.1 * m; c.beginPath(); c.ellipse(0, 0, r * .8, ry * .72, 0, o.spin + 3.6, o.spin + 4.5); c.stroke(); }
  c.restore();
}
/* comet trail behind a flying target: 16 tapered, fading segments over the last `span` of the flight (P(t) = position; r ≈ the
   target radius). Orange: it belongs to the clay. Stops at the break (callers do not draw it after). */
function comet(c, P, t, span, r){ const n = 16, m = MK(c); c.lineCap = "round";
  for (let i = n; i >= 1; i--) { const a = P(Math.max(0, t - span * i / n)), b = P(Math.max(0, t - span * (i - 1) / n)), k = 1 - i / n;
    c.strokeStyle = `rgba(255,150,80,${(.05 + .5 * k * k).toFixed(3)})`; c.lineWidth = Math.max(.6, r * 1.25 * k * m); seg(c, a[0], a[1], b[0], b[1]); }
  c.lineCap = "butt"; c.lineWidth = 1; }
/* the flight line: dots every `gap`·MK px of ARC LENGTH (300 samples), so they stay even on curves */
function pathDots(c, P, t0, t1, col, gap = 10){ if (t1 <= t0) return; const m = MK(c), step = gap * m; let acc = step, [px, py] = P(t0); c.fillStyle = col;
  for (let i = 0; i <= 300; i++) { const [x, y] = P(lerp(t0, t1, i / 300)); acc += Math.hypot(x - px, y - py); px = x; py = y; if (acc >= step) { acc = 0; dot(c, x, y, 1.5 * m); } } }
/* direction chevron on the flight line (posters only) */
function chevron(c, P, t, col){ const m = MK(c), [x, y] = P(t), [x2, y2] = P(Math.min(1, t + .01)), a = Math.atan2(y2 - y, x2 - x);
  c.save(); c.translate(x, y); c.rotate(a); c.strokeStyle = col; c.lineWidth = 2 * m; c.lineCap = "round"; c.lineJoin = "round";
  c.beginPath(); c.moveTo(-6 * m, -5 * m); c.lineTo(1 * m, 0); c.lineTo(-6 * m, 5 * m); c.stroke(); c.restore(); }
/* burst(c, x, y, k, o): a broken target, k = seconds since the break (callers keep their own scaling). A puff of target dust (o.flash:
   a "flash" target's bright puff with a grey edge) and 13 seeded shards (o.seed) that fly out, spin and fall; the shards fade out
   between k .5 and .9, so a frozen last frame never shows shards hanging in the air. Reduced motion: 6 shards, no rotation. */
function burst(c, x, y, k, o = {}){ if (!(k >= 0)) return;
  const m = MK(c), R = rng(o.seed || 5), rm = RM(), pr = (8 + 46 * easeOut(Math.min(1, 1.5 * k))) * m, pa = Math.max(0, .45 - .55 * k);
  if (pa > 0) { const g = c.createRadialGradient(x, y, 0, x, y, pr), col = o.flash ? "255,250,240" : "196,176,156";
    g.addColorStop(0, `rgba(${col},${pa})`); g.addColorStop(.6, `rgba(${col},${pa * .45})`); g.addColorStop(1, `rgba(${col},0)`); c.fillStyle = g; c.fillRect(x - pr, y - pr, 2 * pr, 2 * pr);
    if (o.flash) { c.strokeStyle = rgba("#94A3B8", pa); c.lineWidth = m; c.beginPath(); c.arc(x, y, pr * .8, 0, TAU); c.stroke(); } }
  const sa = k < .5 ? 1 : Math.max(0, 1 - (k - .5) / .4); if (sa <= 0) return;
  c.globalAlpha = sa;
  for (let i = 0; i < 13; i++) { const a = R() * TAU, v = (45 + R() * 95) * m, sz = (2.2 + R() * 3.4) * m, sp = (R() - .5) * 14; if (rm && i >= 6) break;
    const fx = x + Math.cos(a) * v * k, fy = y + Math.sin(a) * v * k * .7 + 80 * k * k; c.save(); c.translate(fx, fy); c.rotate(a + (rm ? 0 : sp * k));
    c.fillStyle = i % 3 === 0 ? ART.clayRim : i % 3 === 1 ? ART.clayTop : ART.clayHi; c.beginPath(); c.moveTo(-sz, -sz * .5); c.lineTo(sz, -sz * .2); c.lineTo(-sz * .2, sz * .7); c.closePath(); c.fill(); c.restore(); }
  c.globalAlpha = 1;
}
/* muzzleMark(c, x, y): where the muzzles point (projected to the target's distance): a cyan ring, four short ticks and the white
   bead in the centre, with a soft glow — the bead a shotgunner sees, not a rifle scope. crosshair() = old name. */
function muzzleMark(c, x, y){ const m = MK(c), g = c.createRadialGradient(x, y, 0, x, y, 16 * m); g.addColorStop(0, "rgba(34,211,238,.28)"); g.addColorStop(1, "rgba(34,211,238,0)");
  c.fillStyle = g; c.fillRect(x - 16 * m, y - 16 * m, 32 * m, 32 * m);
  c.strokeStyle = ART.cyan; c.lineWidth = 2 * m; c.beginPath(); c.arc(x, y, 8 * m, 0, TAU); c.stroke();
  c.lineWidth = 1.4 * m; for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; seg(c, x + Math.cos(a) * 10 * m, y + Math.sin(a) * 10 * m, x + Math.cos(a) * 13.5 * m, y + Math.sin(a) * 13.5 * m); }
  c.fillStyle = "#fff"; dot(c, x, y, 2.2 * m); c.lineWidth = 1; }
const crosshair = (c, x, y) => muzzleMark(c, x, y);
/* muzzle flash: a short cone of light along the bore at p (angle th), k = 0…1 fading. Drawn only inside the shot windows. */
function flash(c, p, th, k){ const a = 1 - clamp01(k); if (a <= 0) return; c.save(); c.translate(p[0], p[1]); c.rotate(th); const g = c.createRadialGradient(5, 0, 0, 5, 0, 18);
  g.addColorStop(0, `rgba(255,248,215,${.95 * a})`); g.addColorStop(.4, `rgba(253,200,90,${.6 * a})`); g.addColorStop(1, "rgba(253,200,90,0)");
  c.fillStyle = g; c.beginPath(); c.ellipse(8, 0, 18, 7, 0, 0, TAU); c.fill(); c.restore(); }
/* a little smoke after a shot (stand scenes; never with reduced motion): three puffs at the muzzle p that rise 10 px and grow from 5
   to 14 px over 0.8 s; age = seconds since the shot */
function smoke(c, p, age){ if (RM() || age < 0 || age > 1) return;
  for (let i = 0; i < 3; i++) { const a = age - i * .06; if (a < 0 || a > .8) continue; const k = easeOut(a / .8);
    c.fillStyle = `rgba(226,232,240,${(.3 * (1 - a / .8)).toFixed(3)})`; dot(c, p[0] + i * 4 + 3 * k, p[1] - 10 * k - i * 2, 5 + 9 * k); } }

/* ---- Cached static layers ---- */
/* layer(c, key, LW, LH, paint): the static background, painted once per key, size and backing scale into an offscreen canvas (at
   most 6 kept, the oldest dropped), then copied with one drawImage per frame. The painters draw no FK/MK-scaled things and no text
   (except the fixed 11 px trap letter "A"). Without a DOM it paints straight into c. */
const LAYERS = new Map();
function layer(c, key, LW, LH, paint){
  const s = c._s || 1, id = `${key}|${LW}x${LH}|${s.toFixed(3)}`; let L = LAYERS.get(id);
  if (!L) { try { L = document.createElement("canvas"); } catch (e) { L = null; }
    if (!L || !L.getContext) { paint(c, LW, LH); return; }
    L.width = Math.round(LW * s); L.height = Math.round(LH * s); const o = L.getContext("2d"); o.setTransform(s, 0, 0, s, 0, 0); paint(o, LW, LH);
    LAYERS.set(id, L); if (LAYERS.size > 6) LAYERS.delete(LAYERS.keys().next().value); }
  c.drawImage(L, 0, 0, LW, LH);
}
/* sprite(c, key, bx, by, bw, bh, paint): a STATIC part of a stand scene (the dog's handler, the trapper, the referee while he
   stands still, the dog while it does not move; review 08.10.2026: about 60 shaded limbs per frame cost 1.6 ms at DPR 1 and up to
   12 ms on a throttled phone) painted once into an offscreen canvas and copied with one drawImage per frame. (bx, by, bw, bh) =
   the logical box the part fits in; key = everything that changes its look (its state). The sprite is painted with the same
   transform as the scene, at the same sub-pixel offset (it is keyed by it), and copied at whole device pixels, so a frame looks the
   same as when the part is drawn directly (source-over is associative; only 8-bit rounding of half-transparent pixels can differ).
   paint(c) draws exactly what the direct drawing would (person(), its props, the dog). At most 24 sprites are kept (the oldest
   dropped). Without a DOM, or when the context has no getTransform(), paint(c) draws straight into c. The self-test
   (DEVELOPERS.md §4b) runs the safety checks with the cache off and compares cached and direct frames pixel by pixel. */
const SPRITES = new Map();
function sprite(c, key, bx, by, bw, bh, paint){
  const T = c.getTransform ? c.getTransform() : null; if (!T || T.b || T.c) { paint(c); return; }
  const dx = T.a * bx + T.e, dy = T.d * by + T.f, ix = Math.floor(dx), iy = Math.floor(dy), fx = dx - ix, fy = dy - iy;
  const id = `${key}|${T.a.toFixed(4)}|${T.d.toFixed(4)}|${fx.toFixed(3)}|${fy.toFixed(3)}`; let L = SPRITES.get(id);
  if (!L) { try { L = document.createElement("canvas"); } catch (e) { L = null; }
    if (!L || !L.getContext) { paint(c); return; }
    L.width = Math.ceil(bw * T.a + 2); L.height = Math.ceil(bh * T.d + 2); const o = L.getContext("2d");
    o._s = c._s; o._fk = c._fk; o._mk = c._mk; o.setTransform(T.a, 0, 0, T.d, fx - T.a * bx, fy - T.d * by); paint(o);
    SPRITES.set(id, L); if (SPRITES.size > 24) SPRITES.delete(SPRITES.keys().next().value); }
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(L, ix, iy); c.restore();
}
/* sky: four stops and an afterglow over the horizon (range side); NO stars or specks: nothing in the sky may pass for a target */
function skyPaint(o, W, hy){
  const g = o.createLinearGradient(0, 0, 0, hy); g.addColorStop(0, ART.sky0); g.addColorStop(.42, ART.sky1); g.addColorStop(.8, ART.sky2); g.addColorStop(1, ART.sky3);
  o.fillStyle = g; o.fillRect(0, 0, W, hy + 1);
  o.save(); o.translate(W * .62, hy); o.scale(1, .3); const r = o.createRadialGradient(0, 0, 0, 0, 0, W * .66);
  r.addColorStop(0, "rgba(76,196,170,.30)"); r.addColorStop(.5, "rgba(52,150,140,.10)"); r.addColorStop(1, "rgba(52,150,140,0)");
  o.fillStyle = r; o.fillRect(-W, -hy / .3, W * 2, hy / .3); o.restore();
}
function hills(o, W, base, h, col, seed){ const R = rng(seed), p = [R() * 6, R() * 6, R() * 6]; o.fillStyle = col; o.beginPath(); o.moveTo(0, base);
  for (let x = 0; x <= W + 6; x += 6) o.lineTo(x, base - h * (.5 + .25 * Math.sin(x / 97 + p[0]) + .15 * Math.sin(x / 41 + p[1]) + .1 * Math.sin(x / 23 + p[2])));
  o.lineTo(W, base); o.closePath(); o.fill(); }
function haze(o, W, base, h, a){ const g = o.createLinearGradient(0, base - h, 0, base); g.addColorStop(0, "rgba(70,150,160,0)"); g.addColorStop(1, `rgba(70,150,160,${a})`); o.fillStyle = g; o.fillRect(0, base - h, W, h); }
/* a row of trees: round broadleaf crowns (three circles) and stepped conifers, one colour per row (seeded) */
function treeRow(o, W, base, t){
  const R = rng(t.seed); o.fillStyle = t.col; o.beginPath(); if (t.band) o.rect(-10, base - t.band, W + 20, t.band + 1);
  for (let x = -20 + R() * 10; x < W + 20; x += lerp(t.step[0], t.step[1], R())) {
    const h = lerp(t.h[0], t.h[1], R()) * (t.shape ? t.shape(x / W) : 1); if (h < 5) { R(); R(); R(); continue; }
    if (R() < t.conifer) { const w = h * lerp(.28, .38, R()), top = base - h; o.moveTo(x, top);
      for (let i = 1; i <= 4; i++) { const yy = top + h * i / 4.6, ww = w / 2 * i / 4; o.lineTo(x + ww, yy); if (i < 4) o.lineTo(x + ww * .45, yy); }
      o.lineTo(x + w * .07, base); o.lineTo(x - w * .07, base);
      for (let i = 4; i >= 1; i--) { const yy = top + h * i / 4.6, ww = w / 2 * i / 4; if (i < 4) o.lineTo(x - ww * .45, yy); o.lineTo(x - ww, yy); }
      o.closePath();
    } else { const r = h * lerp(.3, .38, R()), cy = base - h + r, r2 = r * lerp(.62, .8, R()), r3 = r * lerp(.55, .75, R());
      o.moveTo(x + r, cy); o.arc(x, cy, r, 0, TAU); o.moveTo(x - r * .55 + r2, cy + r * .4); o.arc(x - r * .55, cy + r * .4, r2, 0, TAU);
      o.moveTo(x + r * .6 + r3, cy + r * .45); o.arc(x + r * .6, cy + r * .45, r3, 0, TAU); o.rect(x - r * .2, cy, r * .4, base - cy); }
  }
  o.fill();
}
/* the view from behind the stand (flights, pairs, lead lab): horizon at HY = 0.76 H (where FLIGHTS expect the tree line), hills, two
   tree rows, mown stripes converging on the vanishing point, tall near trees only at the outer edges (clear of every flight line),
   the stand seen from behind (plank floor, two front posts, the rail). No ▲ mark: the shooter is drawn by shooterBack().
   stand = false: the same view WITHOUT the stand (layer key "flight-open"): the lead lab's rabbit rolls along the ground at
   y 0.8 H, which is inside the stand's posts and rail (H − 64 … H − 20); with the stand drawn the rabbit would roll through the
   stand next to the gun (review 08.10.2026). There the gun comes in from the bottom edge as the viewer's own (barrelsFromBelow()). */
function flightPaint(o, W, H, stand = true){
  const HY = Math.round(H * .76);
  skyPaint(o, W, HY);
  hills(o, W, HY - 6, 36, ART.hill, 4); haze(o, W, HY - 6, 26, .11);
  treeRow(o, W, HY - 2, {seed: 41, h: [14, 30], step: [8, 14], conifer: .4, col: ART.treeFar, band: 7}); haze(o, W, HY - 2, 14, .09);
  treeRow(o, W, HY, {seed: 52, h: [18, 44], step: [12, 22], conifer: .5, col: ART.treeMid, band: 6, shape: xn => .62 + .38 * Math.abs(Math.sin(xn * 7.3))});
  const g = o.createLinearGradient(0, HY, 0, H); g.addColorStop(0, ART.grassHaze); g.addColorStop(.25, ART.grass); g.addColorStop(1, ART.grassDeep); o.fillStyle = g; o.fillRect(0, HY, W, H - HY);
  o.save(); o.beginPath(); o.rect(0, HY, W, H - HY); o.clip(); const vx = W / 2; o.fillStyle = "rgba(190,255,220,.035)";
  for (let i = -11; i <= 11; i += 2) { o.beginPath(); o.moveTo(vx, HY); o.lineTo(vx + i * 74, H); o.lineTo(vx + (i + 1) * 74, H); o.closePath(); o.fill(); }
  const hz = o.createLinearGradient(0, HY, 0, HY + 22); hz.addColorStop(0, "rgba(90,170,160,.16)"); hz.addColorStop(1, "rgba(90,170,160,0)"); o.fillStyle = hz; o.fillRect(0, HY, W, 22);
  const R = rng(17); o.strokeStyle = "rgba(150,220,170,.10)"; o.lineWidth = 1; o.beginPath();
  for (let i = 0; i < 420; i++) { const y = HY + 3 + Math.pow(R(), .7) * (H - HY - 3), x = R() * W, l = 1 + (y - HY) / (H - HY) * 4.5; o.moveTo(x, y); o.lineTo(x + (R() - .5) * 1.6, y - l); } o.stroke(); o.restore();
  treeRow(o, W, HY + 10, {seed: 63, h: [60, 96], step: [12, 20], conifer: .7, col: ART.treeNear, band: 0, shape: xn => xn < .12 ? 1 - xn / .14 : xn > .88 ? (xn - .86) / .14 : 0});
  if (!stand) return;
  const cx = W / 2; o.fillStyle = "rgba(0,0,0,.35)"; o.beginPath(); o.ellipse(cx, H - 8, 66, 9, 0, 0, TAU); o.fill();
  const fg = o.createLinearGradient(0, H - 22, 0, H); fg.addColorStop(0, "#8f643c"); fg.addColorStop(1, "#4a3020"); o.fillStyle = fg;
  o.beginPath(); o.moveTo(cx - 60, H); o.lineTo(cx - 46, H - 22); o.lineTo(cx + 46, H - 22); o.lineTo(cx + 60, H); o.closePath(); o.fill();
  o.strokeStyle = "rgba(0,0,0,.28)"; o.lineWidth = 1; [H - 16, H - 9].forEach(y => seg(o, cx - 60, y, cx + 60, y));
  const post = x => { const pg = o.createLinearGradient(x, 0, x + 5, 0); pg.addColorStop(0, "#3a281a"); pg.addColorStop(1, "#684a30"); o.fillStyle = pg; o.fillRect(x, H - 64, 5, 44); };
  post(cx - 47); post(cx + 42); o.fillStyle = "#5a3f29"; o.fillRect(cx - 49, H - 47, 98, 4);
}
/* shooterBack(c, cx, H, aim, o): the shooter seen from behind at the bottom centre (vest, cap, the ear-defender band and both cups,
   the arms of the safety glasses with a glint of the amber lens, the trigger elbow out to the side, the front hand on the fore-end)
   with the over-and-under pointing at aim. o.s = size (1 at H 380, .85 in the lead lab); o.mounted 0…1 (0 = ready, watching: the
   butt lower and to the right). The barrels are foreshortened: projected length (16 + 44·(height of aim above the horizon)/(0.8 HY))
   ·s, never past the aim point — pointing at the horizon (a low rabbit) shows short barrels, pointing up long ones. Drawn BEFORE the
   targets and overlays, so a target that starts or rolls low stays on top. Returns the barrel tip [x, y]. */
function shooterBack(c, cx, H, aim, o = {}){
  const s = o.s || 1, mt = o.mounted == null ? 1 : clamp01(o.mounted), HY = Math.round(H * .76);
  c.save(); c.translate(cx, H); c.scale(s, s);
  const ax = (aim[0] - cx) / s, ay = (aim[1] - H) / s, sx = 9 + 4 * (1 - mt), sy = -46 + 12 * (1 - mt);
  const dx = ax - sx, dy = ay - sy, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
  const len = Math.min(L, 16 + 44 * clamp01((HY - aim[1]) / (HY * .8))), tip = [sx + ux * len, sy + uy * len], hf = [sx + ux * len * .56, sy + uy * len * .56];
  limb(c, [-20, -33], 5.4, hf, 4, PAL.shirtFar);                                                                    // front arm → fore-end
  const bw0 = 2.9, bw1 = 1.6, g = c.createLinearGradient(sx - nx * 3, sy - ny * 3, sx + nx * 3, sy + ny * 3); g.addColorStop(0, "#9fb2c4"); g.addColorStop(.35, "#2f3a46"); g.addColorStop(1, "#0f141a");
  c.fillStyle = g; c.beginPath(); c.moveTo(sx - nx * bw0, sy - ny * bw0); c.lineTo(tip[0] - nx * bw1, tip[1] - ny * bw1); c.lineTo(tip[0] + nx * bw1, tip[1] + ny * bw1); c.lineTo(sx + nx * bw0, sy + ny * bw0); c.closePath(); c.fill();
  c.strokeStyle = "rgba(225,236,247,.55)"; c.lineWidth = .6; seg(c, sx, sy, tip[0], tip[1]);                      // the lit rib on top: an over-and-under seen from behind (a dark centre line would read as a side-by-side)
  c.fillStyle = "#fff"; dot(c, tip[0], tip[1], 1.3);                                                               // bead
  limb(c, [hf[0] - ux * 7, hf[1] - uy * 7], 3.2, [hf[0] + ux * 9, hf[1] + uy * 9], 2.6, ["#5a3519", "#8a5a30", "#a46c3d"]);   // fore-end
  hand(c, hf, Math.atan2(uy, ux) + 1.4, 1, PAL.skinFar, 4.6);
  c.beginPath(); spline(c, [[-27, 4], [-28, -16], [-24, -32], [-12, -40], [0, -41.5], [12, -40], [24, -33], [28, -16], [27, 4]]);
  c.fillStyle = shade(c, -28, 28, PAL.vest); c.fill(); c.strokeStyle = "rgba(0,0,0,.25)"; c.lineWidth = 1; seg(c, 0, -40, 0, 0);   // vest back, seam
  c.fillStyle = shade(c, -6, 6, PAL.skin); box(c, -5, -47, 10, 9, 3); c.fill();                                   // neck
  c.save(); c.translate(2, -54); c.rotate(.16);
  c.fillStyle = PAL.hair; c.beginPath(); c.ellipse(0, 1, 8.4, 9.6, 0, 0, TAU); c.fill();                              // back of the head
  c.beginPath(); c.ellipse(0, -2.4, 8.9, 7.6, 0, Math.PI, TAU); c.lineTo(8.9, -1); c.lineTo(-8.9, -1); c.closePath(); c.fillStyle = shade(c, -9, 9, PAL.capShooter); c.fill();   // cap
  c.strokeStyle = "rgba(0,0,0,.35)"; c.lineWidth = 1; c.beginPath(); c.arc(0, -1, 3, Math.PI, TAU); c.stroke();
  c.strokeStyle = PAL.frame; c.lineWidth = 1.2; seg(c, -10, 2.6, -11.6, 3.4); seg(c, 10, 2.6, 11.6, 3.4);             // arms of the safety glasses
  c.fillStyle = PAL.lens; c.beginPath(); c.ellipse(12.4, 3.6, 1.6, 2.4, .2, 0, TAU); c.fill();                       // a glint of the amber lens
  c.strokeStyle = PAL.muffBand; c.lineWidth = 2.8; c.beginPath(); c.arc(0, 0, 11, Math.PI + .22, TAU - .22); c.stroke();   // headband
  for (const sd of [-1, 1]) { c.fillStyle = PAL.muff; c.beginPath(); c.ellipse(sd * 10.2, 2.4, 4, 6.2, 0, 0, TAU); c.fill(); c.strokeStyle = PAL.muffRim; c.lineWidth = 1.3; c.stroke(); }
  c.restore();
  const grip = [11, -43], el = [37, -46];                                                                          // trigger arm, elbow out
  limb(c, [22, -35], 5.8, el, 4.8, PAL.shirtBack); limb(c, el, 4.8, grip, 3.8, PAL.shirtBack); hand(c, grip, Math.PI - .15, 1, PAL.skin, 4.4);
  c.restore();
  return [cx + tip[0] * s, H + tip[1] * s];
}
/* lead lab, rabbit: no figure fits under the ground line, so only the over-and-under comes in from the bottom edge at (x, y), length
   70, toward the aim, as the viewer's own gun (the front hand on the fore-end; the layer has no stand there: flightPaint(…, false));
   returns the tip */
function barrelsFromBelow(c, x, y, aim){
  const dx = aim[0] - x, dy = aim[1] - y, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, nx = -uy, ny = ux, len = Math.max(20, Math.min(70, L - 26)), tip = [x + ux * len, y + uy * len]; // stops short of the muzzle mark
  const g = c.createLinearGradient(x - nx * 4, y - ny * 4, x + nx * 4, y + ny * 4); g.addColorStop(0, "#9fb2c4"); g.addColorStop(.35, "#2f3a46"); g.addColorStop(1, "#0f141a");
  c.fillStyle = g; c.beginPath(); c.moveTo(x - nx * 4.2, y - ny * 4.2); c.lineTo(tip[0] - nx * 2, tip[1] - ny * 2); c.lineTo(tip[0] + nx * 2, tip[1] + ny * 2); c.lineTo(x + nx * 4.2, y + ny * 4.2); c.closePath(); c.fill();
  c.strokeStyle = "rgba(225,236,247,.55)"; c.lineWidth = .7; seg(c, x, y, tip[0], tip[1]);                         // the lit rib on top (over-and-under)
  limb(c, [x + ux * 6, y + uy * 6], 4.4, [x + ux * 26, y + uy * 26], 3.4, ["#5a3519", "#8a5a30", "#a46c3d"]);   // fore-end
  hand(c, [x + ux * 18, y + uy * 18], Math.atan2(uy, ux) + 1.4, 1, PAL.skinFar, 4.6);                               // the front hand holds it
  c.fillStyle = "#fff"; dot(c, tip[0], tip[1], 1.4); return tip;
}
/* the release clock of a stand scene, at the top left, drawn s times bigger (the phone band); v = seconds since the call / signal;
   state "run" | "ok" | "late". The 316 × 72 box, the scale and the 0–4.5 s track are as before the style. */
function clock(c, v, sub, state, s = 1){
  const us = T("anim_unit_s"), col = state === "late" ? ART.red : state === "ok" ? ART.em : ART.ink;
  c.save(); c.translate(14, 12); c.scale(s, s);
  c.fillStyle = "rgba(4,10,22,.84)"; box(c, 0, 0, 316, 72, 12); c.fill(); c.strokeStyle = "rgba(255,255,255,.09)"; c.lineWidth = 1; c.stroke();
  c.strokeStyle = col; c.lineWidth = 2.2; c.beginPath(); c.arc(24, 29, 10, 0, TAU); c.stroke(); c.fillStyle = col; c.fillRect(21, 15, 6, 3.2);   // stopwatch
  const a = -Math.PI / 2 + Math.min(v, 4.5) / 4.5 * TAU; c.lineCap = "round"; seg(c, 24, 29, 24 + Math.cos(a) * 6.5, 29 + Math.sin(a) * 6.5); c.lineCap = "butt";
  c.font = "800 28px system-ui"; c.textAlign = "left"; c.textBaseline = "alphabetic"; c.fillText(`${num1(v)} ${us}`, 42, 39);
  c.font = "12.5px system-ui"; c.fillStyle = ART.muted; c.fillText(sub, 12, 62);
  const x0 = 150, x1 = 302, k = (x1 - x0) / 4.5, y = 24, lim = CALL.limit;
  c.fillStyle = "rgba(52,211,153,.32)"; box(c, x0, y, lim * k, 9, 4.5); c.fill(); c.fillStyle = "rgba(248,113,113,.32)"; box(c, x0 + lim * k, y, (4.5 - lim) * k, 9, 4.5); c.fill();
  if (v > 0) { c.fillStyle = ART.em; box(c, x0, y, Math.min(v, lim) * k, 9, 4.5); c.fill(); }
  if (v > lim) { c.fillStyle = ART.red; box(c, x0 + lim * k, y, (Math.min(v, 4.5) - lim) * k, 9, 4.5); c.fill(); }
  const nx = x0 + Math.min(4.5, v) * k; c.fillStyle = "#fff"; box(c, nx - 1.5, y - 6, 3, 21, 1.5); c.fill(); dot(c, nx, y - 6, 3);
  c.fillStyle = ART.muted; c.font = "11px system-ui"; c.textAlign = "center"; c.fillText("0", x0, y + 28); c.fillText(`${lim} ${us}`, x0 + lim * k, y + 28);
  c.restore();
}
/* ======================= end of ART (the side-view people, gun, trap house and stand: next to SCENES below) ======================= */

/* Term names. termName(id): the English term, drawn on the canvas (the course teaches the English words), from the page's term
   list if it has one. termLabel(id, en): the label outside the canvas (tabs, names, the method select): "English (local)" through
   the ONE helper docs/shared/terms.js; English only on English pages or without that helper. TERM_EN = English names used only when
   the page gives no term list (a page without glossary data); the glossary stays the source. */
const TERM_EN = {"length-of-pull": "Length of pull", "cast": "Cast", "countback": "Countback", "shoot-off": "Shoot-off", "choke": "Choke", "miss-behind": "Behind", "miss-in-front": "In front", "miss-over": "Over", "miss-under": "Under", "pick-up-point": "Pick-up point", "hold-point": "Hold point", "break-point": "Break point", "soft-focus": "Soft focus", "hard-focus": "Hard focus",
  "maintained-lead": "Maintained lead", "swing-through": "Swing-through", "pull-away": "Pull-away", "ambush": "Ambush",
  "double-on-report": "Double on report", "simultaneous-double": "Simultaneous double", "rafale-double": "Rafale double",
  "gun-mount": "Gun mount", "ready-position": "Ready position", "sonopull": "Sonopull"};
/* the lead lab's methods → their glossary terms (the names of the method select and the compare table) */
const METHOD_TERM = {maintained: "maintained-lead", swing: "swing-through", pullaway: "pull-away", ambush: "ambush"};
const termName = id => (TERM(id) && TERM(id).en) || TERM_EN[id] || id;
// (CT.label also without a local word: on a page in another language an English headword's own brackets go, "Group (in line)" → "Group")
const termLabel = (id, en) => { const t = TERM(id), e = (t && t.en) || en || TERM_EN[id] || id, CT = typeof window !== "undefined" && window.ClayTerms;
  return CT ? CT.label(e, (t && t.local) || "", pageLang()) : e; };

/* Teaching overlays of a flight (opts.focus). P(t) = canvas position of the target. Points along the flight: pick-up 0.2,
   hold 0.42 (on or just under the line, between pick-up and break), break 0.62. still = the poster (for "eyes": both stages). */
const PK = .2, HD = .42, BR = .62;
/* where the muzzles are in "points" (TEACHING): they wait at the hold point until the eyes have the target, then join its line just
   in front and go with it to the break point; q = how far the gun has joined (the back-view shooter mounts with it) */
const holdAt = P => { const [hx, hy] = P(HD); return [hx, hy + 10]; };
function pointsMz(P, t){ const [hx, hy] = holdAt(P), ahead = P(Math.min(1, Math.min(t, BR) + .03)), q = clamp01((t - PK) / .14);
  return t < PK ? [hx, hy] : t < BR ? [hx + (ahead[0] - hx) * q, hy + (ahead[1] - hy) * q] : P(BR + .03); }
function overlay(c, f, P, t, focus, W, H, still){
  const m = MK(c), k = FK(c);
  if (focus === "points" || focus === "stance") {
    const [bx, by] = P(BR), [hx, hy] = holdAt(P);
    if (focus === "stance") { // from the stand floor between the feet: the front foot points at the break point, the body winds back to the hold point
      const sx = W/2, sy = H - 16; c.lineWidth = 1.4 * m; c.setLineDash([4 * m, 5 * m]); c.strokeStyle = rgba(ART.em, .75); seg(c, sx, sy, bx, by);
      c.strokeStyle = rgba(ART.cyan, .7); seg(c, sx, sy, hx, hy); c.setLineDash([]); c.lineWidth = 1;
      // what the two lines are (page language): "front foot" beside the line to the break point, "body" beside the line to the hold point
      const right = bx >= hx, at = (x, y) => [sx + (x - sx) * .3, sy + (y - sy) * .3], [fx, fy] = at(bx, by), [gx, gy] = at(hx, hy), d = 8 * k;
      label(c, T("anim_l_foot"), fx + (right ? d : -d), fy, ART.em, right ? "left" : "right");
      label(c, T("anim_l_body"), gx + (right ? -d : d), gy, ART.cyan, right ? "right" : "left"); }
    // the marks first, then their names: each name goes to the first free side of its mark (placeLabel), the same in the poster and
    // while it plays (only the fixed marks count), so on a phone no name covers another name or a mark
    const taken = [], [ux, uy] = P(PK);
    if (focus === "points") { // pick-up point: where the eyes first see the target clearly
      c.strokeStyle = ART.amber; c.lineWidth = 1.6 * m; c.beginPath(); c.ellipse(ux, uy, 14 * m, 8 * m, 0, 0, TAU); c.stroke(); c.lineWidth = 1;
      c.fillStyle = ART.amber; dot(c, ux, uy, 3.5 * m); taken.push(markBox(ux, uy, 14 * m, 8 * m)); }
    c.lineWidth = 1.4 * m; c.setLineDash([3 * m, 3 * m]); c.strokeStyle = ART.cyan; c.beginPath(); c.arc(hx, hy, 10 * m, 0, TAU); c.stroke(); c.setLineDash([]); c.lineWidth = 1; // hold point: muzzles at the call
    c.strokeStyle = ART.em; c.lineWidth = 2 * m; c.lineJoin = "round"; c.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, r = (i % 2 ? 4 : 10) * m; c.lineTo(bx + Math.cos(a) * r, by + Math.sin(a) * r); } c.closePath(); c.stroke(); c.lineWidth = 1; c.lineJoin = "miter";
    taken.push(markBox(hx, hy, 10 * m), markBox(bx, by, 12 * m));
    placeLabel(c, termName("break-point"), bx, by, 10 * m, ART.em, taken, "arlb");
    if (focus === "points") placeLabel(c, termName("pick-up-point"), ux, uy, 8 * m, ART.amber, taken, "albr");
    placeLabel(c, termName("hold-point"), hx, hy, 10 * m, ART.cyan, taken, "brla");
    if (focus === "points") { const mz = pointsMz(P, t); muzzleMark(c, mz[0], mz[1]); }
  }
  if (focus === "eyes") {
    const [ux, uy] = P(PK), taken = [];
    if (still) { const [x, y] = P(t); taken.push(markBox(x, y, 9 * f.s(t) * m * 1.4)); } // the target of the poster
    if (still || t < PK + .05) { const g = c.createRadialGradient(ux, uy, 0, ux, uy, 46); g.addColorStop(0, "rgba(251,191,36,.08)"); g.addColorStop(1, "rgba(251,191,36,0)"); c.fillStyle = g; dot(c, ux, uy, 46);
      c.setLineDash([5 * m, 6 * m]); c.lineWidth = 1.2 * m; c.strokeStyle = rgba(ART.amber, .85); c.beginPath(); c.arc(ux, uy, 46, 0, TAU); c.stroke(); c.setLineDash([]); c.lineWidth = 1;
      placeLabel(c, termName("soft-focus"), ux, uy, 46, ART.amber, taken, "alrb"); }
    if (still || t >= PK + .05) { const [x, y] = P(t), [x2, y2] = P(Math.min(1, t + .02)), a = Math.atan2(y2 - y, x2 - x), r = 9 * f.s(t) * m, ex = x + Math.cos(a) * r, ey = y + Math.sin(a) * r * .4;
      c.strokeStyle = ART.amber; c.lineWidth = 2 * m; c.beginPath(); c.arc(ex, ey, 5 * m, 0, TAU); c.stroke(); c.lineWidth = 1;
      placeLabel(c, termName("hard-focus"), x, y, r + 6, ART.amber, taken, "arlb"); }
  }
}
/* opts: focus, hideName (Practice "Name the flight": no name, no label), autoplay ("now" by default here), onAutoplay, onUser.
   Frame order: background layer, flight line dots (poster: the whole line + a direction chevron; playing: the part flown), the shooter
   from behind, the overlay, the comet trail, the target or its burst. */
function flightSim(host, preset, opts = {}){
  const f = FLIGHTS[preset] || FLIGHTS["crosser-lr"], focus = opts.focus || "";
  const name = termLabel(f.term, NAME[preset] || preset); // "Crosser (поперечна мішень)": English, the local word in brackets
  host.innerHTML = `<div class="cs-sim"><canvas width="720" height="380" role="img" aria-label="${esc(opts.hideName ? "" : name)}"></canvas><div class="cs-ctl">${playBtn("launch")}${slowBtn()}
  ${opts.hideName ? "" : `<b>${esc(name)}</b>`}</div></div>`;
  const cv = logical(host.querySelector("canvas"), 720, 380), c = cv.getContext("2d"), W = 720, H = 380; let raf = 0, t0 = 0, dur = 2400 * (f.dur || 1);
  const P = t => { const [x, y] = f.p(t); return [x*W, y*H]; };
  const brk = focus === "points" || focus === "stance" ? BR : null; // with these overlays the clay is broken at the break point
  // the shooter from behind: ready at the hold point; with "points" the gun follows the muzzle mark and is mounted as it joins the line
  const figure = t => focus === "points" ? shooterBack(c, W/2, H, pointsMz(P, t), {mounted: ease(clamp01((t - PK) / .14))}) : shooterBack(c, W/2, H, holdAt(P), {mounted: 0});
  const spin = tf => (RM() ? 0 : tf * 2.4 * 9);
  const frame = ts => { if (!t0) t0 = ts; const t = Math.min(1, (ts - t0) / dur); fit(cv, c);
    layer(c, "flight", W, H, flightPaint); const tf = brk != null ? Math.min(t, brk) : t, [x, y] = P(tf);
    pathDots(c, P, 0, tf, "rgba(110,231,183,.35)"); // the part already flown
    figure(t); if (focus) overlay(c, f, P, t, focus, W, H);
    if (brk != null && t > brk) burst(c, x, y, (t - brk)*2.4); else { comet(c, P, tf, .13, 9 * f.s(tf)); clay(c, x, y, f.s(tf), f, tf, {spin: spin(tf)}); }
    if (t < 1) raf = requestAnimationFrame(frame); else { raf = 0; setPlay(host, false); } };
  // still picture before it plays: the whole flight line (dots, direction chevron), the target half-way (or at the break point; for
  // "eyes" further on, so the soft-focus and hard-focus labels do not overlap), the overlay labels
  // the direction chevron: as late on the line as possible (from 0.9, or just before the break point) where it is on the canvas and
  // clear of every mark of the poster (the target, the break, hold and pick-up points, the soft-focus circle); none when there is no
  // free spot (the going-away "eyes" poster: its soft and hard focus already show where the target goes). Review 08.10.2026: it sat
  // on the poster target and under the hard-focus ring.
  const chevAt = (tp, end) => { const m = MK(c), marks = [[...P(tp), 28 * m]];
    if (focus === "points" || focus === "stance") marks.push([...P(BR), 24 * m], [...holdAt(P), 24 * m]);
    if (focus === "points") marks.push([...P(PK), 28 * m]);
    if (focus === "eyes") marks.push([...P(PK), 46 + 12 * m]);
    for (let u = Math.min(.9, end - .04); u >= .05; u -= .05) { const [x, y] = P(u);
      if (x > 8 && x < W - 8 && y > 8 && y < H - 8 && marks.every(([mx, my, r]) => Math.hypot(x - mx, y - my) > r)) return u; }
    return null; };
  const poster = () => { fit(cv, c); layer(c, "flight", W, H, flightPaint); const tp = brk != null ? brk : focus === "eyes" ? .7 : .5, end = brk != null ? brk : 1;
    pathDots(c, P, 0, end, ART.path); const ct = chevAt(tp, end); if (ct != null) chevron(c, P, ct, rgba(ART.mint, .85));
    figure(tp); if (focus) overlay(c, f, P, tp, focus, W, H, true); const [x, y] = P(tp); clay(c, x, y, f.s(tp), f, tp, {spin: .6}); };
  const run = () => { cancelAnimationFrame(raf); t0 = 0; dur = 2400 * (f.dur || 1) * slowF(); setPlay(host, true); raf = requestAnimationFrame(frame); };
  const halt = () => { cancelAnimationFrame(raf); raf = 0; setPlay(host, false); };
  wire(host, run, null, halt); poster();
  const unwatch = watchSize(cv, () => { if (!raf) poster(); });
  const off = autoStart(host, cv, run, opts.autoplay === undefined ? "now" : opts.autoplay, opts.onAutoplay, opts.onUser);
  const s = {stop: () => { off(); unwatch(); cancelAnimationFrame(raf); raf = 0; }, run}; SIMS.push(s); return s;
}

/* Pattern plate (glossary plan, wave 6, 06.11.2026): what a choke does to the pattern. One shot from 36.6 m (40 yards) at a steel
   pattern plate, seen face-on, with the 76 cm (30 in) circle round the densest part, as in the classic test. Share of the shot inside
   the circle — TEACHING, the lesson chokes-pattern-testing-and-care (Trulock Chokes table): cylinder ≈ 40 %, improved cylinder (1/4)
   ≈ 50 %, modified (1/2) ≈ 60 %, improved modified (3/4) ≈ 65 %, full ≈ 70 %. 370 pellets: 28 g of No. 7½ holds about 350–400
   (lesson cartridges-shot-size; FITASC allows at most 28 g). Simplified on purpose: the pellets spread as a round Gaussian cloud whose
   width is set so that exactly that share lands in the circle (σ = R / √(−2 ln(1 − p))), at stratified radii (so the share is exact)
   and seeded angles (the same picture on every load). Real patterns differ from shot to shot and between cartridges: the note under
   the canvas says so. The target (110 mm) is drawn to scale in the centre so the reader sees how dense the shot is on it.
   300 px = 1 m (the canvas shows about 2.4 × 1.27 m of the plate). Canvas words are English (CANVAS_EN rule); the share is HTML text
   (ui anim_pattern_in), the note ui anim_pattern_load. opts.choke: cyl | ic | m | im | full (default m). */
const CHOKES = [{k: "cyl", label: "Cylinder", p: .40}, {k: "ic", label: "1/4 · IC", p: .50}, {k: "m", label: "1/2 · M", p: .60},
  {k: "im", label: "3/4 · IM", p: .65}, {k: "full", label: "Full", p: .70}];
function patternSim(host, opts = {}){
  const W = 720, H = 380, N = 370, PXM = 300, R = .38 * PXM, CX = W / 2, CY = H / 2 + 4, CLAY = .055 * PXM, M0 = 12;
  let ck = CHOKES.some(x => x.k === opts.choke) ? opts.choke : "m";
  host.innerHTML = `<div class="cs-tabs" role="group" aria-label="${esc(termLabel("choke"))}">${CHOKES.map(x => `<button type="button" class="cs-btn${x.k === ck ? " cs-primary" : ""}" data-ck="${x.k}" aria-pressed="${x.k === ck}">${esc(x.label)}</button>`).join("")}</div>`
    + `<div class="cs-sim"><canvas width="720" height="380" role="img"></canvas><div class="cs-ctl">${playBtn("shoot")}<b data-out aria-live="polite"></b></div>`
    + `<div class="cs-out cs-note">${esc(T("anim_pattern_load"))}</div></div>`;
  const cv = logical(host.querySelector("canvas"), W, H), c = cv.getContext("2d"), out = host.querySelector("[data-out]");
  let raf = 0, t0 = 0, dur = 700, P = [], inside = 0;
  const shot = k => { const ch = CHOKES.find(x => x.k === k), sg = R / Math.sqrt(-2 * Math.log(1 - ch.p)), rnd = rng(7919 + 101 * CHOKES.indexOf(ch));
    const order = [...Array(N).keys()]; for (let i = N - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    // pellet i sits at the radius of quantile (i + .5) / N of the cloud; the shuffled order is only the order in which the marks appear
    P = order.map(i => { const r = sg * Math.sqrt(-2 * Math.log(1 - (i + .5) / N)), a = rnd() * TAU; return [CX + r * Math.cos(a), CY + r * Math.sin(a), r <= R]; });
    inside = P.filter(q => q[2]).length; };
  const say = show => { out.textContent = show ? fill(T("anim_pattern_in"), {n: Math.round(100 * inside / N)}) : ""; };
  const paint = upto => { fit(cv, c);
    c.fillStyle = "#06101d"; c.fillRect(0, 0, W, H);
    const g = c.createRadialGradient(CX, CY, 30, CX, CY, W * .62); g.addColorStop(0, "#3b4756"); g.addColorStop(1, "#1f2833");
    c.fillStyle = g; box(c, M0, M0, W - 2 * M0, H - 2 * M0, 10); c.fill();                            // the plate (painted steel)
    c.save(); box(c, M0, M0, W - 2 * M0, H - 2 * M0, 10); c.clip(); c.fillStyle = "#E5E7EB";
    for (let i = 0; i < upto; i++) { c.beginPath(); c.arc(P[i][0], P[i][1], 1.9, 0, TAU); c.fill(); }   // pellet marks
    c.restore();
    c.save(); c.strokeStyle = ART.cyan; c.lineWidth = 2; c.setLineDash([8, 6]); c.beginPath(); c.arc(CX, CY, R, 0, TAU); c.stroke(); c.restore();
    c.save(); c.strokeStyle = ART.clayTop; c.lineWidth = 2.2; c.beginPath(); c.arc(CX, CY, CLAY, 0, TAU); c.stroke(); c.restore();
    label(c, "76 cm", CX + R * .71 + 4, CY - R * .71 - 6, ART.cyan, "left");
    label(c, "36.6 m · 40 yd", M0 + 14, M0 + 26, ART.ink, "left");
    label(c, "target 110 mm", W - M0 - 14, H - M0 - 14, ART.clayTop, "right");
    const y = H - M0 - 30, x0 = M0 + 16, x1 = x0 + .5 * PXM; c.strokeStyle = ART.ink; c.lineWidth = 2; c.beginPath();
    c.moveTo(x0, y); c.lineTo(x1, y); c.moveTo(x0, y - 5); c.lineTo(x0, y + 5); c.moveTo(x1, y - 5); c.lineTo(x1, y + 5); c.stroke();
    label(c, "50 cm", (x0 + x1) / 2, y + 22, ART.ink); };
  const frame = ts => { if (!t0) t0 = ts; const k = Math.min(1, (ts - t0) / dur); paint(Math.round(N * easeOut(k)));
    if (k < 1) raf = requestAnimationFrame(frame); else { raf = 0; say(true); setPlay(host, false); } };
  const run = () => { cancelAnimationFrame(raf); t0 = 0; dur = 700 * slowF(); say(false);
    if (RM()) { paint(N); say(true); setPlay(host, false); return; } setPlay(host, true); raf = requestAnimationFrame(frame); };
  const halt = () => { cancelAnimationFrame(raf); raf = 0; paint(N); say(true); setPlay(host, false); };
  host.querySelectorAll("[data-ck]").forEach(b => b.onclick = () => { ck = b.dataset.ck;
    host.querySelectorAll("[data-ck]").forEach(x => { const on = x.dataset.ck === ck; x.classList.toggle("cs-primary", on); x.setAttribute("aria-pressed", on ? "true" : "false"); });
    shot(ck); run(); });
  // still picture before it plays: the whole pattern of the chosen choke and its share in the circle
  const poster = () => { paint(N); say(true); };
  shot(ck); wire(host, run, null, halt); poster();
  const unwatch = watchSize(cv, () => { if (!raf) paint(N); });
  const off = autoStart(host, cv, run, opts.autoplay === undefined ? "now" : opts.autoplay, opts.onAutoplay, opts.onUser);
  const s = {stop: () => { off(); unwatch(); cancelAnimationFrame(raf); raf = 0; }, run}; SIMS.push(s); return s;
}

/* Miss directions (glossary plan, wave 6, 06.11.2026): what a coach standing behind the shooter sees — where the shot went compared
   with the clay. The lessons faults-behind-in-front and faults-head-lift-stopping: behind = too little lead or a slowing gun, very
   common on crossers; in front = too much lead; over = common on dropping targets, rabbits and incomers, often a head lift; under =
   typical on targets still rising at the shot. So each miss is shown on the target where the lesson says it is typical: behind and in
   front on a crosser, over on a dropping target (it falls away under the shot), under on a teal still climbing. The view and the
   shooter are those of flightSim; the gun drifts onto the wrong spot before the shot (aim = target + the miss offset), fires at tS,
   follows through; the shot cloud (cyan dashed ring with pellets, the colour of the pattern) reaches the target's distance at tS + .03
   and fades, and the clay flies on unbroken. The offset is 1.9 ring radii, so the ring clearly misses. Canvas words English
   (CANVAS_EN); the cause is HTML text under the canvas (ui anim_miss_<kind>). */
const MISS = {
  behind: {preset: "crosser-lr", tS: .42, off: [-1, 0], word: "behind", term: "miss-behind"},
  front:  {preset: "crosser-lr", tS: .42, off: [1, 0], word: "in front", term: "miss-in-front"},
  over:   {preset: "dropping", tS: .62, off: [0, -1], word: "over", term: "miss-over"},
  under:  {preset: "teal", tS: .3, off: [0, 1], word: "under", term: "miss-under"},
};
function missSim(host, kind, opts = {}){
  const ms = MISS[kind] || MISS.behind, f = FLIGHTS[ms.preset], W = 720, H = 380, RR = 26, D = 1.9 * RR, tI = ms.tS + .03;
  host.innerHTML = `<div class="cs-sim"><canvas width="720" height="380" role="img" aria-label="${esc(termLabel(ms.term))}"></canvas><div class="cs-ctl">${playBtn("launch")}${slowBtn()}</div>`
    + `<div class="cs-out">${esc(T("anim_miss_" + kind))}</div></div>`;
  const cv = logical(host.querySelector("canvas"), W, H), c = cv.getContext("2d"); let raf = 0, t0 = 0, dur = 2400;
  const P = t => { const [x, y] = f.p(t); return [x * W, y * H]; };
  const ring = () => { const [x, y] = P(tI); return [x + ms.off[0] * D, y + ms.off[1] * D]; };
  // the gun: on the target until tS − .25, then it drifts to the miss offset by tS, and keeps that offset as it follows through
  const aimAt = t => { const k = ease(clamp01((Math.min(t, tI + .2) - (ms.tS - .25)) / .25)), [x, y] = P(Math.min(t, tI + .2)); return [x + ms.off[0] * D * k, y + ms.off[1] * D * k]; };
  const mounted = t => ease(clamp01((t - (ms.tS - .32)) / .14));
  const pellets = (() => { const R = rng(4111), a = []; for (let i = 0; i < 26; i++) { const r = RR * Math.sqrt(R()), th = R() * TAU; a.push([r * Math.cos(th), r * Math.sin(th)]); } return a; })();
  const cloud = (k, still) => { if (k < 0 || k > 1) return; const [x, y] = ring(), al = still ? 1 : 1 - k * k, m = MK(c);
    c.save(); c.globalAlpha = al; c.fillStyle = "rgba(34,211,238,.12)"; c.beginPath(); c.arc(x, y, RR, 0, TAU); c.fill();
    c.strokeStyle = ART.cyan; c.lineWidth = 1.6 * m; c.setLineDash([5 * m, 4 * m]); c.beginPath(); c.arc(x, y, RR, 0, TAU); c.stroke(); c.setLineDash([]);
    c.fillStyle = "#E0F7FB"; pellets.forEach(([px, py]) => dot(c, x + px, y + py, 1.3 * m)); c.restore();
    label(c, ms.word, x, ms.off[1] > 0 ? y + RR + 14 + 14 * FK(c) : y - RR - 10, ART.cyan); }; // under: below the ring, clear of the clay above it
  const scene = (t, still) => { fit(cv, c); layer(c, "flight", W, H, flightPaint);
    pathDots(c, P, 0, still ? 1 : t, still ? ART.path : "rgba(110,231,183,.35)");
    const tip = shooterBack(c, W / 2, H, aimAt(t), {mounted: mounted(t)});
    if (!still && t >= ms.tS && t < ms.tS + .06) { const [ax, ay] = aimAt(t); flash(c, tip, Math.atan2(ay - tip[1], ax - tip[0]), (t - ms.tS) / .06); }
    if (still) cloud(0, true); else cloud((t - tI) / .45);
    const [x, y] = P(t); if (!still) comet(c, P, t, .13, 9 * f.s(t)); clay(c, x, y, f.s(t), f, t, {spin: still ? .6 : (RM() ? 0 : t * 21.6)}); };
  const frame = ts => { if (!t0) t0 = ts; const t = Math.min(1, (ts - t0) / dur); scene(t, false);
    if (t < 1) raf = requestAnimationFrame(frame); else { raf = 0; setPlay(host, false); } };
  // still picture before it plays: the whole flight line, the gun at the shot and the shot cloud beside the clay at the impact
  const poster = () => scene(tI, true);
  const run = () => { cancelAnimationFrame(raf); t0 = 0; dur = 2400 * slowF(); setPlay(host, true); raf = requestAnimationFrame(frame); };
  const halt = () => { cancelAnimationFrame(raf); raf = 0; setPlay(host, false); poster(); };
  wire(host, run, null, halt); poster();
  const unwatch = watchSize(cv, () => { if (!raf) poster(); });
  const off = autoStart(host, cv, run, opts.autoplay === undefined ? "now" : opts.autoplay, opts.onAutoplay, opts.onUser);
  const s = {stop: () => { off(); unwatch(); cancelAnimationFrame(raf); raf = 0; }, run}; SIMS.push(s); return s;
}

/* Ties (glossary plan, wave 6, 06.11.2026): how equal scores are separated — a score table that lights up, step by step, what is
   compared. No canvas: the table is HTML (readable, translatable, works with a screen reader). The rules (FITASC Sporting ch. 18,
   18.1–18.3; Compak ch. 14, the same in substance; the rules data docs/rules/data): ties for places 1–3 are settled by a shoot-off,
   a round of 25 targets, and if still level by sudden death — the first zero is out, PROVIDED all have shot the same number of
   targets; below 3rd place there is no shoot-off: the tied shooters share the place and are listed by counting back their scores
   from the 8th layout (Compak: the 8th Compak) to the 1st. The numbers are an EXAMPLE (the caption says so): 200 targets, 8 layouts
   of 25. countback: D and E 181, level on layouts 8 and 7, D 24 : 22 on layout 6 → D listed first, both "5=". shoot-off: A and B
   192, shoot-off 23 : 23, sudden death 1 : 1, 0 : 0 (both missed after the same number of targets: nobody is out), 1 : 0 → B out.
   Steps every 1.6 s (× slow motion); the still picture (before play, after stop, reduced motion) is the last step. */
const TIES = {countback: {term: "countback"}, "shoot-off": {term: "shoot-off"}};
function tiesSim(host, kind, opts = {}){
  const sum = a => a.reduce((x, y) => x + y, 0), L8 = [1, 2, 3, 4, 5, 6, 7, 8];
  const steps = [];
  if (kind === "countback") {
    const R = {D: [22, 23, 21, 24, 22, 24, 22, 23], E: [24, 22, 23, 22, 23, 22, 22, 23]};
    steps.push({order: ["E", "D"], hl: 0, msg: T("anim_ties_cb0")});
    for (let n = 8; n >= 1; n--) { const a = R.D[n - 1], b = R.E[n - 1];
      if (a === b) { steps.push({order: ["E", "D"], hl: n, msg: fill(T("anim_ties_cb_eq"), {n, a, b})}); continue; }
      const w = a > b ? "D" : "E"; steps.push({order: [w, w === "D" ? "E" : "D"], hl: n, win: w, msg: fill(T("anim_ties_cb_win"), {n, a, b, who: w})}); break; }
    const head = `<tr><th>${esc(T("anim_ties_place"))}</th><th>${esc(T("anim_ties_shooter"))}</th>${L8.map(n => `<th data-c="${n}">${n}</th>`).join("")}<th>${esc(T("anim_ties_total"))}</th></tr>`;
    var table = st => `<table><caption class="cs-note">${esc(T("anim_ties_layout"))} 1–8</caption><thead>${head.replace(`data-c="${st.hl}"`, `data-c="${st.hl}" class="cs-tc"`)}</thead><tbody>`
      + st.order.map(k => `<tr><td>5=</td><td class="cs-nm${st.win === k ? " cs-w" : ""}">${k}${st.win === k ? " ↑" : ""}</td>`
        + R[k].map((v, i) => `<td${i + 1 === st.hl ? ` class="cs-tc${st.win ? (st.win === k ? " cs-w" : " cs-x") : ""}"` : ""}>${v}</td>`).join("") + `<td>${sum(R[k])}</td></tr>`).join("") + `</tbody></table>`;
  } else {
    const SO = {A: 23, B: 23}, SD = {A: [1, 0, 1], B: [1, 0, 0]};
    steps.push({so: false, sd: 0, hl: "total", place: {A: "1=", B: "1="}, msg: T("anim_ties_so0")});
    steps.push({so: true, sd: 0, hl: "so", place: {A: "1=", B: "1="}, msg: fill(T("anim_ties_so1"), {a: SO.A, b: SO.B})});
    for (let n = 1; n <= 3; n++) { const a = SD.A[n - 1], b = SD.B[n - 1], out = a !== b;
      steps.push({so: true, sd: n, hl: "sd" + n, place: out ? {A: "1", B: "2"} : {A: "1=", B: "1="}, gone: out ? (a ? "B" : "A") : "",
        msg: fill(T(out ? "anim_ties_sd_out" : a ? "anim_ties_sd_ok" : "anim_ties_sd_both"), {n})}); if (out) break; }
    const c = (st, key) => st.hl === key ? ` class="cs-tc"` : "";
    var table = st => `<table><thead><tr><th>${esc(T("anim_ties_place"))}</th><th>${esc(T("anim_ties_shooter"))}</th><th${c(st, "total")}>${esc(T("anim_ties_total"))}</th><th${c(st, "so")}>${esc(T("anim_ties_so"))}</th>`
      + `<th colspan="3"${st.hl.startsWith && st.hl.startsWith("sd") ? ` class="cs-tc"` : ""}>${esc(T("anim_ties_sd"))}</th></tr></thead><tbody>`
      + ["A", "B"].map(k => `<tr${st.gone === k ? ` class="cs-gone"` : ""}><td>${st.place[k]}</td><td class="cs-nm${st.place[k] === "1" ? " cs-w" : ""}">${k}</td><td${c(st, "total")}>192</td><td${c(st, "so")}>${st.so ? SO[k] : "·"}</td>`
        + [1, 2, 3].map(n => { const v = n <= st.sd ? SD[k][n - 1] : null; return `<td${c(st, "sd" + n)}>${v == null ? "·" : `<span class="${v ? "cs-w" : "cs-x"}">${v}</span>`}</td>`; }).join("") + `</tr>`).join("") + `</tbody></table>`;
  }
  host.innerHTML = `<div class="cs-sim"><div class="cs-tie" data-k="t"></div><div class="cs-say" aria-live="polite" data-k="say"></div><div class="cs-ctl">${playBtn("anim_play")}${slowBtn()}</div></div>`;
  const tb = host.querySelector("[data-k=t]"), say = host.querySelector("[data-k=say]"); let timer = 0, i = 0, on = false;
  const show = k => { const st = steps[k]; tb.innerHTML = table(st); say.textContent = st.msg; };
  const tick = () => { show(i); if (++i < steps.length) timer = setTimeout(tick, 1600 * slowF()); else { timer = 0; on = false; setPlay(host, false); } };
  const halt = () => { clearTimeout(timer); timer = 0; on = false; show(steps.length - 1); setPlay(host, false); };
  const run = () => { clearTimeout(timer); i = 0; if (RM()) { show(steps.length - 1); setPlay(host, false); return; } on = true; setPlay(host, true); tick(); };
  wire(host, run, () => { if (on) { clearTimeout(timer); timer = setTimeout(tick, 1600 * slowF()); } }, halt);
  show(steps.length - 1);
  const off = autoStart(host, host.querySelector(".cs-sim"), run, opts.autoplay === undefined ? "now" : opts.autoplay, opts.onAutoplay, opts.onUser);
  const s = {stop: () => { off(); clearTimeout(timer); timer = 0; }, run, steps: steps.length}; SIMS.push(s); return s;
}

/* The stock (glossary plan, wave 6, 06.11.2026): two diagrams of gun fit, no animation (a drawing is enough; the variant buttons
   redraw it). The lesson gun-fit and the glossary: length of pull is measured from the trigger to the middle of the butt pad; for
   adults it is often about 36–38 cm (14¼–15 in), many factory competition guns come at about 37.5 cm (14¾ in) — only a guide; too
   long: it catches on clothing during the mount and may land on the arm; too short: the thumb of the trigger hand may hit the nose
   and recoil feels stronger. Cast is a sideways bend of a few millimetres so that the eye sits exactly over the rib: cast off (to
   the right) for a right-hander, cast on (to the left) for a left-hander. Drawings (our own, from primitives):
   - "lop": the over-and-under from the side, muzzles to the left, barrels shortened (a break mark), the stock to scale at 5 px per
     cm from the trigger; a dimension line from the trigger to the middle of the butt pad; variants short 33 cm / fit 37.5 cm /
     long 42 cm (short and long are only drawn longer or shorter, no number is claimed for them).
   - "cast": from above, muzzles away from the reader (so the shooter's right is the screen's right); the stock bends at the butt by
     24 px — EXAGGERATED about ten times (the canvas says so); a dotted straight stock for comparison; the rib line runs on to the
     eye, which sits over it; the face on the side of the comb where the cheek goes (left of the stock for a right-hander).
   Canvas words English (CANVAS_EN); the explanation is HTML under the canvas (ui anim_stock_<variant>). The gun is drawn alone (no
   person), as an over-and-under with its seam (E4 in spirit; it does not call gun()). */
const STOCK = {lop: {term: "length-of-pull", vars: ["fit", "short", "long"], def: "fit"}, cast: {term: "cast", vars: ["off", "on"], def: "off"}};
function stockSim(host, kind, opts = {}){
  const sk = STOCK[kind] ? kind : "lop", st = STOCK[sk], W = 720, H = 300; let v = st.vars.includes(opts.variant) ? opts.variant : st.def;
  host.innerHTML = `<div class="cs-tabs" role="group">${st.vars.map(x => `<button type="button" class="cs-btn${x === v ? " cs-primary" : ""}" data-v="${x}" aria-pressed="${x === v}">${esc(T("anim_stock_b_" + x))}</button>`).join("")}</div>`
    + `<div class="cs-sim"><canvas width="720" height="300" role="img" aria-label="${esc(termLabel(st.term))}"></canvas><div class="cs-out" data-k="say"></div></div>`;
  const cv = logical(host.querySelector("canvas"), W, H), c = cv.getContext("2d"), say = host.querySelector("[data-k=say]");
  const WOOD = ["#6b4226", "#8a5a35", "#a8744a"], STEEL = ["#4b5563", "#9aa5b1", "#cbd5e1"], PAD = "#1f2937";
  const poly = (pts, fillCol) => { c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.fillStyle = fillCol; c.fill(); };
  const vgrad = (y0, y1, cols) => { const g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, cols[2]); g.addColorStop(.5, cols[1]); g.addColorStop(1, cols[0]); return g; };
  const hgrad = (x0, x1, cols) => { const g = c.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, cols[0]); g.addColorStop(.5, cols[2]); g.addColorStop(1, cols[1]); return g; };
  const sideView = () => {
    const K = 5, Tx = 300, L = v === "short" ? 33 : v === "long" ? 42 : 37.5, Bx = Tx + L * K - 8, PADW = 9, Ym = 160;
    // barrels (two stacked tubes, the seam between them), shortened with a break mark; the rib on top; the fore-end below
    c.fillStyle = vgrad(100, 124, STEEL); box(c, 24, 100, 232, 24, 3); c.fill();
    c.strokeStyle = "#111827"; c.lineWidth = 1.2; seg(c, 24, 112, 256, 112);                                   // the seam
    c.fillStyle = STEEL[2]; c.fillRect(24, 97, 232, 3);                                                         // the rib
    c.strokeStyle = "#06101d"; c.lineWidth = 6; c.beginPath(); c.moveTo(92, 90); c.lineTo(100, 104); c.lineTo(94, 118); c.lineTo(102, 132); c.stroke(); // break
    c.fillStyle = vgrad(124, 138, WOOD); box(c, 150, 123, 100, 14, 5); c.fill();                               // fore-end
    c.fillStyle = vgrad(96, 150, STEEL); box(c, 254, 96, 58, 54, 5); c.fill();                                  // receiver
    c.strokeStyle = STEEL[0]; c.lineWidth = 3; c.beginPath(); c.ellipse(Tx - 2, 160, 16, 11, 0, 0, Math.PI); c.stroke(); // trigger guard
    c.strokeStyle = ART.amber; c.lineWidth = 3.2; c.beginPath(); c.moveTo(Tx, 150); c.quadraticCurveTo(Tx + 5, 158, Tx - 1, 166); c.stroke(); // trigger
    // the stock: comb from the receiver to the heel, the grip down and back to the toe; the butt pad at the end
    const heel = [Bx, 112], toe = [Bx, 210];
    c.beginPath(); c.moveTo(312, 98); c.lineTo(heel[0], heel[1]); c.lineTo(toe[0], toe[1]);
    c.quadraticCurveTo(Bx - 120, 196, 352, 170); c.quadraticCurveTo(334, 160, 312, 150); c.closePath(); c.fillStyle = vgrad(98, 210, WOOD); c.fill();
    c.fillStyle = PAD; box(c, Bx, 110, PADW, 102, 3); c.fill();                                                 // butt pad
    // the dimension: from the trigger to the middle of the butt pad
    const col = v === "fit" ? ART.em : ART.red, yd = 250, xe = Bx + PADW / 2;
    c.strokeStyle = rgba(ART.ink, .55); c.lineWidth = 1.2; c.setLineDash([4, 4]); seg(c, Tx, 168, Tx, yd + 6); seg(c, xe, Ym + 52, xe, yd + 6); c.setLineDash([]);
    c.fillStyle = ART.em; dot(c, xe, Ym, 4.5);                                                    // the reference point (always green)
     c.strokeStyle = col; c.lineWidth = 2; seg(c, Tx, yd, xe, yd);
    [[Tx, 1], [xe, -1]].forEach(([x, d]) => { c.beginPath(); c.moveTo(x, yd); c.lineTo(x + 9 * d, yd - 5); c.lineTo(x + 9 * d, yd + 5); c.closePath(); c.fillStyle = col; c.fill(); });
    label(c, v === "fit" ? "length of pull · 37.5 cm · 14¾ in" : v === "short" ? "too short" : "too long", (Tx + xe) / 2, yd - 10, col);
    label(c, "trigger", Tx - 24, 196, ART.amber, "right"); c.strokeStyle = rgba(ART.em, .7); c.lineWidth = 1.2; seg(c, xe + 4, Ym - 4, W - 120, 58);                // leader to the label in the free top-right corner
    label(c, "middle of the butt pad", W - 12, 50, ART.em, "right");
    label(c, "barrels shortened", 96, 80, ART.muted);
  };
  const topView = () => {
    const X = 360, d = v === "off" ? 1 : -1, CAST = 24 * d;
    // the stock centre line bends from the grip (y 186) to the butt (y 288): offset ∝ (distance from the grip)²
    const cx0 = (y, k) => X + k * sq(Math.max(0, (y - 186) / 102)), cx = y => cx0(y, CAST), wd = y => 9 + 12 * clamp01((y - 186) / 102);
    const side = (s, k = CAST) => { const a = []; for (let y = 186; y <= 288; y += 6) a.push([cx0(y, k) + s * wd(y), y]); return a; };
    c.save(); c.setLineDash([3, 4]); c.strokeStyle = rgba(ART.ink, .4); c.lineWidth = 1.4; c.beginPath();            // the same stock without cast, for comparison
    [...side(-1, 0), ...side(1, 0).reverse()].forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.stroke(); c.restore();
    poly([...side(-1), ...side(1).reverse()], hgrad(X - 30, X + 30, WOOD));                                          // the stock
    c.fillStyle = PAD; const yb = 286; box(c, cx(yb) - 22, yb, 44, 8, 3); c.fill();                                  // butt pad
    c.fillStyle = hgrad(X - 12, X + 12, STEEL); box(c, X - 12, 18, 24, 136, 4); c.fill();                           // barrels from above (the rib on top)
    c.fillStyle = STEEL[2]; c.fillRect(X - 2, 18, 4, 136);
    c.fillStyle = hgrad(X - 17, X + 17, STEEL); box(c, X - 17, 150, 34, 38, 5); c.fill();                           // receiver
    // the rib line runs on to the eye: the eye sits over it; the face is beside the comb (left of the stock for a right-hander)
    c.strokeStyle = rgba(ART.amber, .8); c.lineWidth = 1.4; c.setLineDash([5, 5]); seg(c, X, 150, X, 232); c.setLineDash([]);
    const fy = 226, fx = X - d * 46; c.fillStyle = rgba(ART.ink, .14); c.beginPath(); c.ellipse(fx, fy, 30, 38, 0, 0, TAU); c.fill();
    c.fillStyle = ART.amber; dot(c, X, 222, 5);
    label(c, "eye over the rib", X - d * 92, 214, ART.amber, d > 0 ? "right" : "left");
    label(c, v === "off" ? "cast off · right-handed" : "cast on · left-handed", X + d * 64, 246, ART.em, d > 0 ? "left" : "right");
    label(c, "exaggerated", X + d * 64, 272, ART.muted, d > 0 ? "left" : "right");
    label(c, "muzzles", X + 22, 32, ART.muted, "left");
  };
  const draw = () => { fit(cv, c); c.fillStyle = "#06101d"; c.fillRect(0, 0, W, H); (sk === "lop" ? sideView : topView)(); say.textContent = T("anim_stock_" + v); };
  host.querySelectorAll("[data-v]").forEach(b => b.onclick = () => { v = b.dataset.v;
    host.querySelectorAll("[data-v]").forEach(x => { const on = x.dataset.v === v; x.classList.toggle("cs-primary", on); x.setAttribute("aria-pressed", on ? "true" : "false"); });
    draw(); if (opts.onUser) opts.onUser(); });
  draw();
  const unwatch = watchSize(cv, draw);
  const s = {stop: () => unwatch(), run: draw}; SIMS.push(s); return s;
}

/* Lead lab: a crossing target at distance d (m) and speed v (m/s), seen side-on. World x in metres (left to right; the drawing is
   mirrored for a right-to-left target). Shot time of flight tf = d / 330 · (1 + 0.0115 · (d − 15)) (the shot slows down: average
   ≈ 330 m/s over 15 m, ≈ 300 over 25 m, ≈ 255 over 40 m; see "Teaching physics" in the header); decision-to-shot delay TR = 0.15 s
   (an average estimate). The shot hits if |muzzle(ts) − target(ts + tf)| < R, R = 0.25 + 0.005 · d (the radius of the part of the
   pattern dense enough to break the target: 0.325 m at 15 m … 0.45 m at 40 m). Defaults 17 m/s at 25 m: actual lead 1.44 m.
   The method gives the muzzle path muzzle(t, td), td = decision time.
   opts.autoplay (default false): "view" / "now" plays "Watch the method" once. Slow motion: the lab runs at 1/4 speed, 1/8 with 🐢.
   "Watch the method" turns into ⏹ stop while the demonstration runs. */
function leadLab(host, method = "maintained", opts = {}){
  if (!opts || typeof opts !== "object") opts = {};
  const TR = .15, EYE = 1, CLAY = .11, METHODS = ["maintained", "swing", "pullaway", "ambush"];
  const norm = m => ({"swing-through": "swing", "pull-away": "pullaway"})[m] || (METHODS.includes(m) ? m : "maintained");
  const mName = m => termLabel(METHOD_TERM[m]); // the method's glossary term: uk "Swing-through (протяжка)", en "Swing-through"
  const rl = /-rl$/.test(opts.preset || ""), rabbit = opts.preset === "rabbit", focus = opts.focus || "";
  // speed slider: min, max, default (m/s). The rabbit's 11 m/s is an EXAMPLE value for the lab (no published source gives a typical
  // rabbit speed): never quote it as a typical speed in a text
  const VR = rabbit ? [6, 18, 11] : [10, 25, 17];
  host.innerHTML = `<div class="cs-sim"><div class="cs-words" lang="en" aria-hidden="true" data-k="words"></div><canvas width="720" height="300" role="img" aria-label="${esc(T("method") + ": " + mName(norm(method)))}"></canvas>
  <div class="cs-ctl"><label>${esc(T("method"))} <select data-k="m">${METHODS.map(m => `<option value="${m}"${m === norm(method) ? " selected" : ""}>${esc(mName(m))}</option>`).join("")}</select></label>
  <label>${esc(T("speed"))} <input data-k="v" type="range" min="${VR[0]}" max="${VR[1]}" value="${VR[2]}"><span data-k="vv"></span></label>
  <label>${esc(T("distance"))} <input data-k="d" type="range" min="15" max="40" value="25"><span data-k="dv"></span></label>
  ${focus === "follow-through" || opts.stop ? `<label><input data-k="stop" type="checkbox"${opts.stop ? " checked" : ""}> ${esc(T("stop_gun"))}</label>` : ""}</div>
  <div class="cs-ctl"><button type="button" class="cs-btn cs-play" data-k="demo">▶ ${esc(T("demo"))}</button><button type="button" class="cs-btn cs-primary cs-play" data-k="try">🎯 ${esc(T("try"))}</button><button type="button" class="cs-btn cs-play" data-k="shoot" disabled>${esc(T("shoot"))}</button>${slowBtn()}</div>
  <div class="cs-out cs-note" data-k="how"></div><div class="cs-out" data-k="out" aria-live="polite"></div>${focus === "perceived-vs-actual" ? `<div class="cs-out cs-cmp" data-k="cmp"></div>` : ""}
  <div class="cs-out cs-note">${esc(T("lab_note"))}</div></div>`;
  const q = k => host.querySelector(`[data-k="${k}"]`), cv = logical(host.querySelector("canvas"), 720, 300), c = cv.getContext("2d"), W = 720, H = 300;
  const words = wordsBar(q("words"));
  const X0 = -14, X1 = 14, XS = X0 + 1, XD = -3; // the target starts at XS; the planned decision is when it reaches XD (left of centre)
  const px = x => { const u = (x - X0) / (X1 - X0) * W; return rl ? W - u : u; }, TY = rabbit ? H*.8 : H*.42;
  // the target's size (Scale in the header): drawn larger than life so it can be seen (clay scale 1 = radius 9 px ≈ 0.35 m at 25.7
  // px per metre: ≈ 6× on a wide screen, up to ≈ 10× on a phone with × MK); with "lead-units" (the lead in target widths) to scale
  // on a wide screen: radius CLAY / 2 = 1.4 px (clay scale CS ≈ 0.157; × MK on a phone like every mark, up to ≈ 1.6×), with the glow of a normal-size target (GLOW) so it stays visible, a thinner comet trail and
  // a ghost no smaller than 2.2 px (a 1.4 px dashed outline would not show)
  const TRUE = focus === "lead-units", CS = TRUE ? CLAY / 2 / (X1 - X0) * W / 9 : 1, GLOW = TRUE ? 9 * 2.8 : 0, TRAIL = TRUE ? 3 : 7;
  const clayO = o => (GLOW ? Object.assign({glow: GLOW}, o) : o), GHOST = TRUE ? Math.max(CS, 2.2 / 9) : 1;
  // coach's words for the phases of each method (English, as the lessons teach them); the current one is highlighted
  const WORDS = {maintained: ["insert in front", "match its speed", "shoot", "keep moving"], swing: ["butt", "belly", "beak", "bang"],
    pullaway: ["on it", "with it", "pull away", "shoot"], ambush: ["wait at the point", "shoot"]};
  let raf = 0, mode = "idle", sim = null, pending = null, curT = 0, freeze = false, last = null;
  const val = () => { q("vv").textContent = q("v").value + " " + T("unit_ms"); q("dv").textContent = q("d").value + " " + T("unit_m"); };
  function setup(m, plain){
    m = m || q("m").value;
    // TEACHING physics (header): time of flight of a shot that slows down, hit zone R (radius of the part of the pattern dense
    // enough to break the target). L = the actual lead every method aims for (1.44 m at the defaults 17 m/s, 25 m).
    const v = +q("v").value, d = +q("d").value, tf = d / 330 * (1 + .0115 * (d - 15)), L = v * tf, R = .25 + .005 * d;
    const tx = t => XS + v * t, tD = (XD - XS) / v;
    let base, auto, phase;
    if (m === "maintained") { const vc = .75 * v, g0 = L + (v - vc) * tD, pre = t => XS + g0 + vc * t; // gap g0 − (v − vc)·t closes
      base = (t, td) => t <= td ? pre(t) : pre(td) + v * (t - td);                               // after the decision: target speed
      auto = tD; phase = (t, td, ts) => t < td ? 0 : t < ts ? 1 : t < ts + .3 ? 2 : 3; }
    else if (m === "swing") { const p0 = .1 + .1 * L, vm = v + (L - p0) / TR, gb = 1.2 + .3 * L; // small gap seen; gun speed adds the rest
      const t0 = Math.max(.12, tD - (gb + p0) / (vm - v)), tp = t0 + gb / (vm - v);                 // t0: starts overtaking, tp: passes the clay
      base = t => t < t0 ? tx(t) - gb : tx(t0) - gb + vm * (t - t0);
      auto = tp + p0 / (vm - v); phase = (t, td) => t < t0 ? 0 : t < tp ? 1 : t < td ? 2 : 3; }
    else if (m === "pullaway") { const tp = Math.max(.1, tD - Math.min(.35, Math.max(.15, tD - .2))), a = 2 * L / sq(tD - tp + TR), tE = tp + 2 * (tD - tp + TR);
      const g = t => t < tp ? 0 : t < tE ? .5 * a * sq(t - tp) : .5 * a * sq(tE - tp) + a * (tE - tp) * (t - tE); // smooth push ahead, then steady
      base = t => tx(t) + g(t);
      auto = tD; phase = (t, td) => t < tp / 2 ? 0 : t < tp ? 1 : t < td ? 2 : 3; }
    else { const P = XD + L + v * TR; // ambush: still muzzles at the point where shot and target will meet if the decision is on time
      base = () => P; auto = tD; phase = (t, td) => t < td ? 0 : 1; m = "ambush"; }
    const stop = !plain && q("stop") && q("stop").checked;
    const mz = (t, td = Infinity) => stop && t > td ? base(td, td) : base(t, td);
    return {m, v, d, tf, L, R, tx, mz, auto, phase};
  }
  function shotAt(s, td){ const ts = td + TR, ti = ts + s.tf, xM = s.mz(ts, td), xI = s.tx(ti), off = xM - xI;
    return {td, ts, ti, xM, xI, off, hit: Math.abs(off) < s.R, perceived: s.mz(td, td) - s.tx(td), actual: xM - s.tx(ts)}; }
  /* still = the still picture (the method's freeze-frame with the flight line dotted). Draw order (style 10.2026): background,
     ground/flight line, 2 m ruler and scale key, comet trail, muzzle history, shooter (or the rabbit barrels) and the gun line,
     ghost of the target at the decision, shot cloud, target or burst, pattern ring at the impact, muzzle mark, decision, the
     freeze-frame bracket with the lead, muzzle flash. The style changed no number; the ballistics review (10.2026) changed tf and R
     in setup() and the target's size in "lead-units" (CS above); the ring follows R (Rpx); on a miss the target's centre is marked
     (a white dot), because the target is drawn larger than the ring. */
  function draw(t, sh, still){
    last = [t, sh, still, freeze]; fit(cv, c); const m = MK(c), k = FK(c);
    const {tx, mz} = sim, td = sh ? sh.td : Infinity;
    if (rabbit) layer(c, "flight-open", W, H, (o, w, h) => flightPaint(o, w, h, false)); else layer(c, "flight", W, H, flightPaint); // the rabbit: no stand (its ground line is where the stand would be)
    c.lineWidth = 1;
    if (rabbit) { c.strokeStyle = "rgba(255,255,255,.18)"; seg(c, 0, TY + 9, W, TY + 9); } // ground
    else { c.strokeStyle = "rgba(255,255,255,.08)"; seg(c, 0, TY, W, TY); }
    if (still) { c.fillStyle = ART.path; for (let x = 4; x < W; x += 10 * m) dot(c, x, TY, 1.3 * m); } // the target's line
    c.fillStyle = "rgba(255,255,255,.28)"; for (let x = -12; x <= 12; x += 2) c.fillRect(px(x) - .5, TY + (rabbit ? 14 : 26), 1, 6 * m); // 1 tick = 2 m
    { const sb = Math.abs(px(2) - px(0)), x1 = W - 18, x0 = x1 - sb, y = 22 * k; c.strokeStyle = ART.muted; c.lineWidth = 1.5; // scale key "2 m"
      seg(c, x0, y, x1, y); seg(c, x0, y - 4, x0, y + 4); seg(c, x1, y - 4, x1, y + 4); c.lineWidth = 1;
      font(c, 11.5, "600"); c.fillStyle = ART.muted; c.textAlign = "right"; c.textBaseline = "middle"; c.fillText(`2 ${T("unit_m")}`, x0 - 6, y); c.textBaseline = "alphabetic"; }
    const xT = tx(t), xM = mz(t, td), aim = [px(xM), TY], broken = !!(sh && sh.hit && t > sh.ti);
    if (!broken) comet(c, u => [px(tx(u)), TY], t, .22, TRAIL);
    // where the muzzles have been (cyan rings every 0.05 s): spread out when the gun moves fast, stacked when it waits
    c.strokeStyle = ART.cyan; c.lineWidth = 1.3 * m;
    for (let i = 1; i <= 12; i++) { const u = t - .05 * i; if (u < 0) break; c.globalAlpha = .45 * (1 - i / 13); c.beginPath(); c.arc(px(mz(u, td)), TY, 3.2 * m, 0, TAU); c.stroke(); }
    c.globalAlpha = 1; c.lineWidth = 1;
    const tip = rabbit ? barrelsFromBelow(c, W/2 + 12, H + 4, aim) : shooterBack(c, W/2, H, aim, {s: .85, mounted: 1});
    c.strokeStyle = "rgba(34,211,238,.32)"; c.lineWidth = 1.2 * m; c.setLineDash([2 * m, 5 * m]); seg(c, tip[0], tip[1], aim[0], aim[1]); c.setLineDash([]); c.lineWidth = 1; // gun line
    if (sh && t >= sh.td) clay(c, px(tx(sh.td)), TY, GHOST, rabbit ? {rabbit: 1} : {}, 0, {ghost: true}); // where the target was at the decision
    const Rpx = sim.R / (X1 - X0) * W; // the hit zone R to scale (0.375 m = 9.6 px at 25 m): the radius of the shot cloud and the ring
    if (sh && t >= sh.ts) { const u = clamp01((t - sh.ts) / sim.tf), cx = lerp(tip[0], px(sh.xM), u), cy = lerp(tip[1], TY, u), rad = 3 + Rpx * u, Rn = rng(9); // shot cloud
      c.fillStyle = "rgba(226,232,240,.12)"; dot(c, cx, cy, rad * 1.6); c.fillStyle = "rgba(226,232,240,.8)";
      for (let i = 0; i < 20; i++) { const r = rad * Math.sqrt(Rn()), a = Rn() * TAU; dot(c, cx + Math.cos(a) * r, cy + Math.sin(a) * r, m); } }
    if (broken) burst(c, px(sh.xI), TY, t - sh.ti); else clay(c, px(xT), TY, CS, rabbit ? {rabbit: 1} : {}, 0, clayO({spin: RM() ? 0 : t * 9}));
    // the pattern at the impact, drawn over the target and its dust (review 08.10.2026: under the burst it was hidden): a hit = the
    // target's CENTRE inside the ring. On a miss the target's centre is marked with a small white dot from the impact on: the target
    // is drawn larger than life (about as big as the ring at 25–40 m, bigger on a phone), so on a near miss its drawing overlaps the
    // ring while the result says "behind" (review 08.10.2026). Not with "lead-units": there the target itself is to scale.
    if (sh && t >= sh.ti) { c.strokeStyle = "rgba(34,211,238,.85)"; c.lineWidth = 1.2 * m; c.setLineDash([4 * m, 4 * m]); c.beginPath(); c.arc(px(sh.xM), TY, Rpx, 0, TAU); c.stroke(); c.setLineDash([]); c.lineWidth = 1;
      if (!sh.hit && !broken && !TRUE) { c.fillStyle = "#fff"; dot(c, px(xT), TY, 1.4 * m); } }
    muzzleMark(c, aim[0], aim[1]);
    let shotBox = null; const ys = TY - 18 * m - 8 - 14 * k - 4 * k;
    if (sh && freeze) shotBox = pillBox(c, CANVAS_EN.shot, px(sh.xM), ys, "center", 12, "650");
    if (sh && t >= sh.td) { // decision point marker (where the muzzle was when the shooter decided); its pill moves aside if it meets the "shot" pill
      let xd = px(mz(sh.td, sh.td)); const yc = TY - 12 * m, yl = yc - 6 * m - 4 - 4 * k;
      c.strokeStyle = ART.amber; c.lineWidth = 1.8 * m; c.fillStyle = "rgba(251,191,36,.18)";
      c.beginPath(); c.moveTo(xd, yc - 6 * m); c.lineTo(xd + 6 * m, yc); c.lineTo(xd, yc + 6 * m); c.lineTo(xd - 6 * m, yc); c.closePath(); c.fill(); c.stroke(); c.lineWidth = 1;
      const db = pillBox(c, CANVAS_EN.decision, xd, yl, "center", 12, "650");
      if (overlap(db, shotBox)) { const left = db.x + db.w / 2 < shotBox.x + shotBox.w / 2, d = left ? db.x + db.w - shotBox.x : shotBox.x + shotBox.w - db.x; xd += (left ? -1 : 1) * (d + 6 * k); }
      label(c, CANVAS_EN.decision, xd, yl, ART.amber); }
    if (sh && freeze) { // frozen at the moment of the shot: bracket = actual lead between the clay and the muzzle
      const a = px(tx(sh.ts)), b = px(sh.xM), y = rabbit ? TY - 18*m - 26*k - 26 : TY + 26 + 18*m, tk = 5 * m;
      c.strokeStyle = rgba(ART.em, .45); c.lineWidth = m; c.setLineDash([2 * m, 3 * m]); seg(c, a, TY, a, y); seg(c, b, TY, b, y); c.setLineDash([]);
      c.strokeStyle = ART.em; c.lineWidth = 2.2 * m; c.lineCap = "round"; seg(c, a, y, b, y); seg(c, a, y - tk, a, y + tk); seg(c, b, y - tk, b, y + tk); c.lineCap = "butt"; c.lineWidth = 1;
      const txt = `${CANVAS_EN.lead} ${num1(sh.actual)} ${T("unit_m")} · ${num1(sh.actual * 3.281)} ${T("unit_ft")}`, ty = rabbit ? y - 10*k : y + 20*k;
      let vx = (a + b) / 2; const vb = pillBox(c, txt, vx, ty, "center", 13, "750");
      // the line of fire (tip → aim) must not cross the value pill: slide it along the bracket toward the target
      if (aim[1] < vb.y + vb.h && tip[1] > vb.y) { const xl = yy => tip[0] + (aim[0] - tip[0]) * (yy - tip[1]) / (aim[1] - tip[1] || 1), lo = Math.min(xl(vb.y), xl(vb.y + vb.h)), hi = Math.max(xl(vb.y), xl(vb.y + vb.h));
        if (hi > vb.x - 3 && lo < vb.x + vb.w + 3) vx += a < b ? lo - 4 * k - (vb.x + vb.w) : hi + 4 * k - vb.x; }
      label(c, txt, vx, ty, ART.em, "center", {size: 13, weight: "750"});
      label(c, CANVAS_EN.shot, b, ys, ART.ink, "center", {border: "rgba(255,255,255,.3)"}); }
    if (sh && (freeze || (t >= sh.ts && t <= sh.ts + .06))) flash(c, tip, Math.atan2(TY - tip[1], aim[0] - tip[0]), freeze ? .25 : (t - sh.ts) / .06);
    // phase words above the canvas: “butt · belly · beak · bang” etc.; with focus "mount" “move · mount · shoot” (muzzles first, then the stock)
    const ph = sim.phase(t, td, sh ? sh.ts : Infinity), mountW = focus === "mount" && sim.m !== "ambush";
    words(mountW ? ["move", "mount", "shoot"] : WORDS[sim.m], mountW ? [0, 0, 1, 2][ph] : ph);
  }
  const redraw = () => { if (!last) return; const f0 = freeze; freeze = last[3]; draw(last[0], last[1], last[2]); freeze = f0; };
  const demoBtn = on => { const b = q("demo"); b.dataset.on = on ? "1" : ""; b.textContent = on ? "⏹ " + T("anim_stop") : "▶ " + T("demo"); };
  function play(td){
    cancelAnimationFrame(raf); sim = setup(); let start = 0, sh = null, paused = 0; const slow = 4 * (CFG.slow ? 2 : 1), HOLD = 1600 * (CFG.slow ? 1.5 : 1); freeze = false;
    if (td !== undefined) sh = shotAt(sim, td);
    const end = s => { raf = 0; report(s); mode = "idle"; q("shoot").disabled = true; demoBtn(false); };
    const frame = now => { if (!start) start = now; let t = (now - start) / 1000 / slow;
      if (mode === "try" && pending !== null && !sh) { sh = shotAt(sim, pending); pending = null; }
      // freeze-frame at the moment of the shot so the lead picture can be seen, then continue (follow-through)
      if (sh && t >= sh.ts && !paused) paused = now;
      if (paused && now - paused < HOLD) { freeze = true; draw(sh.ts, sh); raf = requestAnimationFrame(frame); return; }
      if (paused && freeze) { freeze = false; start += HOLD; t = (now - start) / 1000 / slow; }
      curT = t; draw(t, sh && t >= sh.td ? sh : null);
      if (sh && t > sh.ti + .25) return end(sh);
      if (!sh && sim.tx(t) > X1 + 1) return end(null); // the target left without a shot
      raf = requestAnimationFrame(frame); };
    raf = requestAnimationFrame(frame);
  }
  const r1 = x => num1(x), ft = x => num1(x * 3.281);
  const atMuzzle = (x, d) => { const cm = x / d * EYE * 100; return `${Math.abs(cm) < 10 ? num1(cm) : Math.round(cm)} ${T("unit_cm")} (${num1(cm / 2.54)} ${T("unit_in")})`; };
  function report(sh){
    const out = q("out");
    if (mode === "try") stat("lead", `${sim.m}:${!sh ? "none" : sh.hit ? "hit" : sh.off < 0 ? "behind" : "ahead"}`); // "your turn" only
    if (!sh) { out.innerHTML = `<b class="cs-muted">${esc(T("no_shot"))}</b>`; return; }
    const res = sh.hit ? T("hit") : `${sh.off < 0 ? T("behind") : T("ahead")} (${r1(Math.abs(sh.off))} ${T("unit_m")})`;
    out.innerHTML = `<b class="${sh.hit ? "cs-hit" : "cs-miss"}">${esc(res)}</b><br>
      ${esc(T("perceived"))}: <b>${r1(sh.perceived)} ${esc(T("unit_m"))}</b> (${ft(sh.perceived)} ${esc(T("unit_ft"))}) · ${esc(T("at_muzzle"))} ≈ ${esc(atMuzzle(sh.perceived, sim.d))}<br>
      ${esc(T("actual"))}: <b>${r1(sh.actual)} ${esc(T("unit_m"))}</b> (${ft(sh.actual)} ${esc(T("unit_ft"))})${focus === "lead-units" ? ` ≈ ${Math.round(sh.actual / CLAY)} ${esc(T("clay_widths"))}` : ""}`;
    if (sh.hit && mode === "try" && CFG.onHit) CFG.onHit({method: sim.m, v: sim.v, d: sim.d});
  }
  function compare(){ const box = q("cmp"); if (!box) return; // the same target with each method, decided on time
    const rows = METHODS.map(m => { const s = setup(m, true), sh = shotAt(s, s.auto); return `<tr><td>${esc(mName(m))}</td><td>${r1(sh.perceived)} ${esc(T("unit_m"))}</td><td>${esc(atMuzzle(sh.perceived, s.d))}</td><td>${r1(sh.actual)} ${esc(T("unit_m"))}</td></tr>`; });
    box.innerHTML = `<b>${esc(T("compare"))}</b><table><tr><th>${esc(T("method"))}</th><th>${esc(T("perceived"))}</th><th>${esc(T("at_muzzle"))}</th><th>${esc(T("actual"))}</th></tr>${rows.join("")}</table>`; }
  const how = () => { q("how").textContent = T("how_" + q("m").value); };
  // the still picture: the method's own freeze-frame at the shot (target, muzzles and the lead between them), flight line dotted
  const poster = () => { cancelAnimationFrame(raf); raf = 0; sim = setup(); const sh = shotAt(sim, sim.auto); freeze = true; draw(sh.ts, sh, true); freeze = false; };
  const idle = () => { if (mode === "idle") poster(); };
  const demo = () => { mode = "demo"; pending = null; q("out").innerHTML = ""; q("shoot").disabled = true; demoBtn(true); sim = setup(); play(sim.auto); };
  const halt = () => { cancelAnimationFrame(raf); raf = 0; mode = "idle"; q("shoot").disabled = true; demoBtn(false); poster(); };
  q("v").oninput = q("d").oninput = () => { val(); compare(); idle(); };
  q("demo").onclick = () => (q("demo").dataset.on ? halt() : demo());
  q("try").onclick = () => { mode = "try"; pending = null; q("out").innerHTML = ""; q("shoot").disabled = false; demoBtn(false); play(); q("shoot").focus(); };
  q("shoot").onclick = () => { if (mode === "try" && pending === null) { pending = curT; q("shoot").disabled = true; } };
  q("m").onchange = () => { mode = "idle"; q("out").innerHTML = ""; q("shoot").disabled = true; demoBtn(false); how(); idle(); };
  if (q("stop")) q("stop").onchange = () => { q("out").innerHTML = ""; };
  wire(host, demo, () => { if (mode === "demo") demo(); }); // 🐢 restarts a running demo at the new speed; "your turn" keeps going
  val(); how(); compare(); poster();
  const unwatch = watchSize(cv, () => { if (!raf) redraw(); });
  const off = autoStart(host, cv, demo, opts.autoplay, opts.onAutoplay, opts.onUser);
  const s = {stop: () => { off(); unwatch(); cancelAnimationFrame(raf); raf = 0; }}; SIMS.push(s); return s;
}

/* Pairs (doubles): two clays. report = 2nd released at the sound of the 1st shot (the 1st is shown broken by that shot);
   simultaneous = both released together, from two traps; rafale (following pair) = 2nd from the SAME trap on the same line,
   as soon as the trap has reloaded (FITASC Sporting™ only). Delays are in units of the 2.4 s flight (0.5 ≈ 1.2 s). */
const PAIRS = {
  report:       {a: "crosser-lr", b: "incomer", delay: .45, label: "pair_report", term: "double-on-report", bang: true},
  simultaneous: {a: "crosser-lr", b: "quartering-away", delay: 0, label: "pair_sim", term: "simultaneous-double"},
  rafale:       {a: "crosser-lr", b: "crosser-lr", delay: .5, label: "pair_rafale", term: "rafale-double"},
};
function pairSim(host, kind, opts = {}){
  const P = PAIRS[kind] || PAIRS.report, fa = FLIGHTS[P.a], fb = FLIGHTS[P.b];
  host.innerHTML = `<div class="cs-sim"><canvas width="720" height="380" role="img" aria-label="${esc(pairName(kind))}"></canvas><div class="cs-ctl">${playBtn("launch")}${slowBtn()}<b>${esc(fill(T(P.label), {term: pairName(kind)}))}</b></div></div>`;
  const cv = logical(host.querySelector("canvas"), 720, 380), c = cv.getContext("2d"), W = 720, H = 380; let raf = 0, t0 = 0, dur = 2400;
  const Pa = u => { const [x, y] = fa.p(u); return [x*W, y*H]; }, Pb = u => { const [x, y] = fb.p(u); return [x*W, y*H]; };
  // the shooter from behind: ready at the 1st target's hold point; in a report pair mounted on its break point around the shot
  const figure = t => { let aim = holdAt(Pa), mt = 0;
    if (P.bang) { mt = ease(clamp01((t - (P.delay - .15)) / .08)) * (1 - ease(clamp01((t - (P.delay + .2)) / .08)));
      if (mt > 0) { const b = Pa(P.delay); aim = [lerp(aim[0], b[0], mt), lerp(aim[1], b[1], mt)]; } }
    return shooterBack(c, W/2, H, aim, {mounted: mt}); };
  const spin = u => (RM() ? 0 : u * 2.4 * 9);
  const draw = t => { fit(cv, c); layer(c, "flight", W, H, flightPaint);
    const ta = Math.min(1, t), tb = Math.min(1, Math.max(0, t - P.delay)), tip = figure(t);
    if (P.bang && t >= P.delay) { const [x, y] = Pa(P.delay); if (t < P.delay + .35) burst(c, x, y, (t - P.delay)*2.4); } // 1st target shot at the BANG
    else if (ta < 1) { const [x, y] = Pa(ta); comet(c, Pa, ta, .13, 9 * fa.s(ta)); clay(c, x, y, fa.s(ta), fa, ta, {spin: spin(ta)}); }
    if (t >= P.delay && tb < 1) { const [x, y] = Pb(tb); comet(c, Pb, tb, .13, 9 * fb.s(tb)); clay(c, x, y, fb.s(tb), fb, tb, {spin: spin(tb)}); }
    if (P.bang && t >= P.delay - .02 && t < P.delay + .1) { const b = Pa(P.delay); flash(c, tip, Math.atan2(b[1] - tip[1], b[0] - tip[0]), (t - P.delay + .02) / .12);
      label(c, "BANG", tip[0], tip[1] - 18 * FK(c), ART.ink, "center", {size: 16, weight: "bold", border: "rgba(255,255,255,.3)"}); } };
  const frame = ts => { if (!t0) t0 = ts; const t = (ts - t0) / dur; draw(t); if (t < 1 + P.delay) raf = requestAnimationFrame(frame); else { raf = 0; setPlay(host, false); } };
  // still picture before it plays: both flight lines dotted (the 2nd fainter and sparser), their direction chevrons, the first
  // target near its start, the shooter ready at its hold point
  const poster = () => { fit(cv, c); layer(c, "flight", W, H, flightPaint);
    pathDots(c, Pa, 0, 1, ART.path, 10); pathDots(c, Pb, 0, 1, ART.path2, 14); chevron(c, Pa, .9, rgba(ART.mint, .85)); chevron(c, Pb, .86, rgba(ART.mint, .6));
    figure(0); const [x, y] = Pa(.2); clay(c, x, y, fa.s(.2), fa, .2, {spin: .6}); };
  const run = () => { cancelAnimationFrame(raf); t0 = 0; dur = 2400 * slowF(); setPlay(host, true); raf = requestAnimationFrame(frame); };
  const halt = () => { cancelAnimationFrame(raf); raf = 0; setPlay(host, false); };
  wire(host, run, null, halt); poster();
  const unwatch = watchSize(cv, () => { if (!raf) poster(); });
  const off = autoStart(host, cv, run, opts.autoplay === undefined ? "now" : opts.autoplay, opts.onAutoplay, opts.onUser);
  const s = {stop: () => { off(); unwatch(); cancelAnimationFrame(raf); raf = 0; }, run}; SIMS.push(s); return s;
}

/* ---------------------------------------- Stand scenes (type "call") ----------------------------------------
   Side view, 1 px ≈ 1 cm around the shooter: ground at GY, shoulder axis at y 178, the Sporting™ line on the vest LINE_Y = 25 cm
   lower (fact rules.sporting-jacket-line). Numbers of the rules (seconds): CALL.limit = release within 3 s of the call / the
   referee's signal (fact rules.release-within-3s), CALL.sonopull = the fixed sonopull delay (fact rules.sonopull-delay); both live in
   content/academy/facts/rules.json, and scripts/build_academy.mjs warns when they no longer match these constants.
   A scene = times in seconds (scene clock = real time; 🐢 only stretches the screen time):
     call (the shooter's "Pull!"), signal (referee → trapper), release (the target leaves), mount [from, to] (gun from the ready position
     to the shoulder), up (gun already at the shoulder: Compak® Sporting lets the shooter call gun-up), shot, click (the shot does not
     go off), safe [from, to] (gun lowered, pointing down the range), walk [from, to] (the referee comes over), nobird (the referee's
     call), card (warning + yellow card), line (draw the line on the vest: red while the heel of the stock is above it before the
     target is out), mic (sonopull microphone instead of the trapper), timer ("signal" | "call": the clock counts from that moment),
     move [from, to] (the gun-mount scene: the muzzles turn onto the target's line before the stock comes up), words (the coach's
     words “move · mount · shoot” above the canvas), cheek (mark the cheek on the comb when the mount is finished), end.
   SAFETY (owner, 08.10.2026; a hard rule for every ClayArena animation, not a style choice): nobody is in front of the shooting stand
   while shooting is possible. The shooter faces right, down the range, so every person is drawn LEFT of BEHIND_X (behind the shooter;
   person() moves anyone placed further right back there and warns in the console): the referee behind or beside the shooter (after a
   misfire the referee walks up from behind, never past the muzzles), the trapper behind the referee, the dog's handler (no gun) and
   the dog (dog(), also kept left of BEHIND_X) behind them, a step nearer the viewer. Downrange there are only things: the trap inside
   a trap house behind a solid screen that faces the stand, with an earth bank in front of it (trapHouse(); nobody is drawn there) and
   the flying target. The trapper releases the target with a hand-held release button; its cable runs along the ground to the trap
   house, and the release is drawn as a pulse running along that cable (releaseLine()). In Sporting™ the referee's sound signal goes
   BACK to the trapper behind the stand. A sonopull (Compak® Sporting) is released by the microphone on the stand, at its front edge
   (MIC_X); no trapper is drawn. The muzzles point only down the range: up at the target, or down to the ground in front of the stand
   after a misfire (SAFE, ground at x ≈ 488 for the pose line and ≈ 511 for the drawn bore, short of the earth bank at TH_X − 38) —
   never at a person. They never wait, hold or mount onto the trap house: with the gun up (Compak® Sporting) they wait at the hold
   point and only join the target once it has climbed to the hold height (pose()). The only moment the barrel line crosses the
   (screened, empty) trap house is the ≈ 0.08 s sweep while the gun is lowered after a misfire, from the target down to the ground in
   front. An unbroken target comes down in the field in front of the stand (TP), never at the shooter. Everyone wears safety glasses
   and ear muffs (protection()); the dog wears dog earmuffs. The gun is closed only on the stand at the shooter's turn; anywhere off
   the stand a gun is drawn broken open and empty (gun(…, {open: true}); no scene has one today). Real grounds differ (a release
   console beside the referee, wireless remote controls, a loader sheltering inside the trap house between rounds); the scenes show
   one common safe layout and make no rule claim about it. The scene timings are not affected: the button is pressed at pressT
   (≤ 0.25 s before the release, after the signal) and the target leaves at "release".
   Keep these true when a scene, a pose or TP changes (checked frame by frame, every 1/60 s of every scene, 08.10.2026, again for the
   style 10.2026 on the pose line AND on the drawn bore line): every person (and the dog) stands at x < BEHIND_X; the barrel line
   beyond the muzzle never crosses a person or the dog, and crosses the trap house only during that lowering sweep; with the gun up
   the barrels point up from the start to the shot; the target never enters the stand. */
const CALL = {limit: 3, sonopull: .5};
const SCENES = {
  signal:        {tab: "anim_t_signal",   timer: "signal", line: 1, call: .3, signal: .7, release: 1.7, mount: [1.82, 2.15], shot: 2.5, end: 4.4},
  "signal-late": {tab: "anim_t_late",     timer: "signal", line: 1, call: .3, signal: .7, release: .7 + 3.6, nobird: 4.5, end: 7},
  manual:        {tab: "anim_t_manual",   timer: "call", up: 1, call: .3, release: 1.7, shot: 2.45, end: 4.4},
  sonopull:      {tab: "anim_t_sonopull", term: "sonopull", timer: "call", up: 1, mic: 1, call: .3, release: .3 + CALL.sonopull, shot: 1.5, end: 3.6},
  "gun-ready":   {term: "ready-position", line: 1, call: .9, signal: 1.1, release: 1.5, mount: [1.62, 1.95], shot: 2.3, end: 4.3},
  "gun-early":   {tab: "anim_t_early",    line: 1, mount: [.4, .75], call: 1.2, card: 1.7, end: 4},
  misfire:       {tab: null,              call: .4, release: 1, mount: [1.1, 1.45], shot: 1.85, click: 1, safe: [2.2, 2.6], walk: [3.3, 4.3], end: 6.8},
  mount:         {term: "gun-mount",      words: 1, cheek: 1, call: .3, release: .8, move: [1, 1.4], mount: [1.3, 1.85], shot: 1.9, end: 3.8},
};
const GY = 322, LINE_Y = 203, FLY = 2.2, SH = 380; // SH = scene height; narrow screens get a band for the clock above it
// SAFETY layout (see above): people only left of BEHIND_X (the shooter's back heel is at x ≈ 150, the stand starts at 126); the
// referee stands at REF_X (walks up to 128 after a misfire), the trapper at TRAPPER_X; MIC_X = the sonopull microphone, on the stand
// at its front edge (the stand is x 126–222; audit 08.10.2026: it stood in front of the stand); TH_X = the screen of the trap house
const BEHIND_X = 130, REF_X = 99, TRAPPER_X = 47, MIC_X = 212, TH_X = 582;
// people's heights (cm = px; style 10.2026: the old s .92 / .8 made the referee and the trapper look like children)
const REF_H = 174, TRAPPER_H = 170;
// the dog's handler and the dog (MASCOT), at the left, behind everyone on the range side: the handler stands just behind the
// trapper (a step farther from the viewer, feet dy px higher, drawn first and in the darker "far" colours, so he reads as one step
// back and the trapper's head, button hand and cable stay in front); the dog sits at the handler's feet a step NEARER the viewer
// (feet dy px lower on the grass), left of the trapper's cable, so the release pulse is never hidden. Both left of BEHIND_X like
// every person. DOG.s = the scale passed to ClayMascot.draw (scale 1 ≈ 100 px: a sitting dog about 70 px tall — about a real
// Labrador at 1 px ≈ 1 cm — ≈ 36 CSS px on a 375 px phone).
// Layout of the people behind the stand (re-laid 10.2026: the owner saw the handler and the dog's tail cut by the left canvas edge;
// before: handler 9, trapper 32, referee 84, dog 32 / .66). Every distance is a condition, keep them when a number changes:
//   - nobody is cut at the left edge: the handler's back is at HANDLER.x − 0.08 h ≈ x − 13.4 (≥ 3); the dog's drawing (ClayMascot
//     side box −125…72 units, k = DOG.s · 100 / 219) starts at DOG.x − 125 k ≈ 4 (its tail; the wag moves the tip < 1 px);
//   - the handler's glasses stay visible: his lens ends ≈ HANDLER.x + 17, the trapper's head starts ≈ TRAPPER_X − 8 (≥ 4 px gap);
//   - the dog stays left of the trapper's cable: its right edge DOG.x + 72 k ≈ 67, the cable at the dog's head height ≈ 69
//     (TRAPPER_X + 22);
//   - REF_X − TRAPPER_X = 52 as before: the referee's body (from REF_X − 14) never covers the trapper's button hand (≈ TRAPPER_X + 26),
//     and the sound signal, its "♪" and the dashed line back to the trapper's ear keep the geometry the safety check passed
//     (on a phone the bigger "♪" stays off the trapper's lens);
//   - the English "line" pill is drawn RIGHT of the stand with a dashed leader (09.10.2026), so it never covers the referee;
//     before that it sat left of the vest over the referee's jacket (and most of him on a phone). The score sheet (to REF_X + 29) is left of the shooter (x ≈ 148). On a phone the pill is about twice
//     as big and covers part of the referee's body (it did before too); his head, cap, glasses and ear muffs stay visible (safety
//     check E5). On a phone (FK > 1.35, the clock-band threshold) the pill is NOT drawn during the referee's 0.6 s sound signal:
//     his signalling hand and the sound device (REF_X − 0.10 REF_H, GY − 0.70 REF_H ≈ 81.6, 200) would be under it (review
//     08.10.2026: covered in 9 of 11 languages at 375 CSS px); the stripe on the vest stays (shooter(…, noPill)).
// Measured (10.2026, frame by frame at 720 and 375 CSS px, with and without mascot.js): the leftmost pixel of the handler, the dog
// and the lead is at x ≈ 1 (the handler's shadow on the grass), the handler's back at x ≈ 3.5, the dog's tail at x ≈ 5; nothing
// touches column 0 (before the re-layout: thousands of rows did).
const HANDLER = {x: 17, dy: -3, h: 168}, DOG = {x: 44, dy: 46, s: .7}, DOG_REST = -.12; // DOG_REST = head angle while it waits
// target path from the trap (u = 0…1 over FLY s): it leaves over the screen of the trap house (TH_X…TH_X + 20, top at y 266; at its
// back edge, x 602, the target is ≈ 33 px above it), climbs to the apex (≈ 513, 110) and, if nobody breaks it, comes down on the
// ground in the field in front of the stand (u = 1 → x 392, y GY). SAFETY: an unbroken target never flies at the shooter or the stand
// (audit 08.10.2026: the old path ended at chest height just past the muzzles). Shots of the scenes (u at the shot): signal and
// gun-ready .364 → (542, 125), manual .341 → (548, 131), mount .5 → (510, 110), sonopull .318 → (553, 138), all in the sky.
const TP = u => [628 - 236 * u, 298 - 200 * Math.sin(Math.PI * u) + 24 * u];
// gun poses: LOW = Sporting™ ready position (stock low, muzzles up), SAFE = lowered after a misfire (closed, muzzles down the range to
// the ground at x ≈ 488 (pose line) / ≈ 511 (drawn bore), in front of the stand and short of the earth bank of the trap house),
// AIM0 = the hold point (muzzles at the call)
const LOW = {hx: 190, hy: 214, th: -.42}, SAFE = {hx: 192, hy: 204, th: .38}, AIM0 = [520, 150];
const READY = {hx: 190, hy: 214, th: -.15}; // gun-mount scene: heel low, muzzles near the line where the target will come
const upPose = (ax, ay) => ({hx: 190, hy: 186, th: Math.atan2(ay - 186, ax - 190)});
const mixPose = (a, b, k) => ({hx: lerp(a.hx, b.hx, k), hy: lerp(a.hy, b.hy, k), th: lerp(a.th, b.th, k)});
/* Gun frame (style 10.2026): GF(g)(u, v) → canvas point; u along the barrels, v down when the gun is level, cm = px. The pose point
   (hx, hy) is the point of the butt pad in the shoulder pocket, 4 cm below the heel; the drawn bore axis is v = −BORE (8.5 px above
   the pose line, parallel; documented, not a bug: the safety checks use the pose line, a real bore sits about 8.5 cm above that
   point). The heel of the stock is GF(g)(.4, −4): heelY() is what the line-on-the-vest test reads, so colour and picture agree. */
const BORE = 8.5;
const GF = g => { const co = Math.cos(g.th), si = Math.sin(g.th); return (u, v) => [g.hx + u * co - v * si, g.hy + u * si + v * co]; };
const heelY = g => g.hy + .4 * Math.sin(g.th) - 4 * Math.cos(g.th);
// the shooter's eye: fixed in every pose ("head still, the gun comes to the face"), where it is when mounted at the hold point
let EYE_PT = null;
const eyePt = () => EYE_PT || (EYE_PT = GF(upPose(AIM0[0], AIM0[1]))(16, -13.8));
/* the side-view background (cached layer "side"): evening sky (no stars), hills, two tree rows (lower behind the people), a soft
   light pool behind the people, mown grass, the trap house (static parts) with its earth bank, the stand (plank platform x 126–222,
   the far-side posts and hip rail) */
function sidePaint(o, W, H){
  skyPaint(o, W, GY);
  hills(o, W, GY - 14, 52, ART.hill, 3); haze(o, W, GY - 14, 34, .12);
  treeRow(o, W, GY - 6, {seed: 21, h: [20, 38], step: [8, 15], conifer: .35, col: ART.treeFar, band: 9}); haze(o, W, GY - 6, 20, .1);
  treeRow(o, W, GY - 1, {seed: 33, h: [26, 58], step: [13, 24], conifer: .5, col: ART.treeMid, band: 7, shape: xn => xn < .36 ? .5 : 1}); haze(o, W, GY, 12, .08);
  o.save(); o.translate(140, GY - 70); o.scale(1.6, 1); let lg = o.createRadialGradient(0, 0, 0, 0, 0, 150);
  lg.addColorStop(0, "rgba(190,235,215,.11)"); lg.addColorStop(1, "rgba(190,235,215,0)"); o.fillStyle = lg; o.fillRect(-150, -150, 300, 220); o.restore();
  const g = o.createLinearGradient(0, GY, 0, H); g.addColorStop(0, ART.grassHaze); g.addColorStop(.3, ART.grass); g.addColorStop(1, ART.grassDeep); o.fillStyle = g; o.fillRect(0, GY, W, H - GY);
  for (let i = 0; i < 8; i += 2) { const y0 = GY + (H - GY) * Math.pow(i / 8, 1.5), y1 = GY + (H - GY) * Math.pow((i + 1) / 8, 1.5); o.fillStyle = "rgba(190,255,220,.03)"; o.fillRect(0, y0, W, y1 - y0); }
  const R = rng(11); o.lineWidth = 1; o.strokeStyle = "rgba(150,220,170,.10)"; o.beginPath();
  for (let i = 0; i < 520; i++) { const y = GY + 2 + Math.pow(R(), .8) * (H - GY - 2), x = R() * W, l = 1.2 + (y - GY) / (H - GY) * 4; o.moveTo(x, y); o.lineTo(x + (R() - .5) * 1.6, y - l); } o.stroke();
  o.fillStyle = "rgba(160,230,200,.07)"; o.fillRect(0, GY, W, 1.5);
  trapHouse(o, null);
  // the stand: ground shadow, far-side posts and hip rail (behind the shooter), plank platform (the release cable at GY + 7 stays visible below it)
  o.fillStyle = "rgba(0,0,0,.35)"; o.beginPath(); o.ellipse(174, GY + 7, 70, 4, 0, 0, TAU); o.fill();
  const post = x => { const pg = o.createLinearGradient(x, 0, x + 5, 0); pg.addColorStop(0, "#22170f"); pg.addColorStop(.7, "#33241a"); pg.addColorStop(1, "#47331f"); o.fillStyle = pg; o.fillRect(x, 228, 5, GY - 228); };
  post(126); post(217); o.fillStyle = "#3a2919"; box(o, 122, 225, 104, 4.5, 2); o.fill(); o.fillStyle = "rgba(255,255,255,.06)"; o.fillRect(123, 225, 102, 1);
  const pg = o.createLinearGradient(0, GY - 1, 0, GY + 6); pg.addColorStop(0, "#a8774a"); pg.addColorStop(.3, "#7a5230"); pg.addColorStop(1, "#4a3020"); o.fillStyle = pg; box(o, 126, GY - 1, 96, 7, 2); o.fill();
  o.strokeStyle = "rgba(0,0,0,.3)"; o.lineWidth = 1; for (let x = 142; x < 222; x += 16) seg(o, x, GY, x, GY + 6);
}
/* protection(c, x, y, r): the protection every person in a stand scene wears — compulsory for shooters, referees, staff and anyone
   on or near the stand (lessons gear-ear-protection, gear-shooting-glasses; audit 08.10.2026: the shooter had a black ear dot that
   read as an eye, the referee and the trapper wore nothing). Called by head() in the head's own frame: (x, y) = the eye, r = cm → px,
   facing right, down the range. Ear defenders = a band over the cap and a dark cup with an EMERALD rim over the ear; safety glasses
   = an AMBER lens in front of the eye with its frame, glint and arm to the ear. Both are drawn about 1.2× true size on purpose (a
   teaching emphasis: they must be seen at phone size). */
function protection(c, x, y, r){
  c.save(); c.translate(x, y); c.scale(r, r); c.lineCap = "round";
  c.strokeStyle = PAL.frame; c.lineWidth = 1.2; seg(c, .8, -1.2, -6.2, -.8);                                           // arm of the glasses
  c.beginPath(); spline(c, [[.5, -3.6], [6, -3.4], [7.2, -.4], [6.1, 3], [.8, 2.7]]); c.fillStyle = PAL.lens; c.fill(); c.strokeStyle = PAL.frame; c.lineWidth = 1; c.stroke();   // amber lens
  c.fillStyle = "rgba(255,255,255,.6)"; c.beginPath(); c.ellipse(4.6, -1.4, .8, 1.6, .3, 0, TAU); c.fill();                // glint
  c.strokeStyle = PAL.muffBand; c.lineWidth = 2.8; c.beginPath(); c.moveTo(-8.6, -4.5); c.bezierCurveTo(-9.6, -11.5, -8.8, -16.4, -6.2, -17.4); c.stroke();   // headband
  c.fillStyle = PAL.muff; c.beginPath(); c.ellipse(-8.6, 1.4, 5.3, 6.7, -.1, 0, TAU); c.fill(); c.strokeStyle = PAL.muffRim; c.lineWidth = 1.4; c.stroke();     // cup, emerald rim
  c.fillStyle = "rgba(255,255,255,.18)"; c.beginPath(); c.ellipse(-7.2, -1.2, 1.5, 2.6, -.2, 0, TAU); c.fill();
  c.lineCap = "butt"; c.restore(); c.lineWidth = 1;
}
/* a head in profile in its own frame: origin at the eye, x forward (down the range), y down, cm; cap, then protection() */
const HEAD = {
  skin: [[-7, -12.5], [-1, -11], [2.6, -6.5], [3.4, -2], [3.2, .4], [6.4, 3.8], [4.2, 5.2], [4.7, 7.2], [4.3, 9.1], [4, 11.4], [.5, 13.2], [-6, 10.8], [-10.5, 8.5], [-15.5, 5.5], [-18.2, -.5], [-15, -8.5]],
  hair: [[-18.6, -3], [-18.3, 2], [-15.6, 5.6], [-12, 7.2], [-11, 2], [-12.5, -3]],
  cap: [[-18.9, -2.6], [-18, -9], [-12.5, -14], [-5, -15.4], [.6, -13], [3.3, -8.4], [3.2, -6.2], [-6, -4.6], [-14, -3.4]],
  visor: [[2.2, -7.7], [7.6, -7.9], [12.4, -6.5], [12.8, -5.3], [8, -5.6], [2.8, -5.2]],
};
function head(c, ex, ey, s, tilt, o){
  c.save(); c.translate(ex, ey); c.rotate(tilt); c.scale(s, s);
  c.beginPath(); spline(c, HEAD.skin); c.fillStyle = shade(c, -18, 7, o.skin || PAL.skin); c.fill();
  c.beginPath(); spline(c, HEAD.hair); c.fillStyle = PAL.hair; c.fill();
  c.beginPath(); spline(c, HEAD.cap); c.fillStyle = shade(c, -19, 4, o.cap); c.fill();
  c.beginPath(); spline(c, HEAD.visor); c.fillStyle = o.visor; c.fill();
  protection(c, 0, 0, 1); // safety glasses and ear defenders on everyone
  c.restore();
}
/* person(c, x, o): a person BEHIND the stand (the referee, the trapper, the dog's handler) standing on the ground at x, facing the
   range, with a cap, safety glasses and ear defenders (head() → protection()). Real proportions: o.h = height in cm (= px; default
   172), eye at 0.93 h, hip at 0.52 h, knee at 0.28 h; tapered legs and arms placed by two-bone IK, a shaded torso, the far limbs
   darker. o.jacket / o.far = jacket colours (3 shades), o.capCols / o.visor = cap, o.band = the referee's white armband,
   o.hand = [x, y] of the near hand (returned; props are drawn there by the caller). o.s and o.col are still read for old callers
   (o.col = a one-colour jacket) but o.s no longer sets the height. Safety net: a person is never drawn in front of the stand — x
   right of BEHIND_X is moved back to BEHIND_X and a console warning tells the developer that the scene is wrong. */
const restHand = (x, h) => [x + .03 * h, GY - .47 * h];   // where person() puts the near hand when o.hand is not given
function person(c, x, o = {}){
  if (x > BEHIND_X) { if (!person.warned) { person.warned = 1; try { console.warn("ClaySims: a person was placed in front of the stand (x " + x + "); drawn behind the shooter instead"); } catch (e) {} }
    const d = BEHIND_X - x; x = BEHIND_X; if (o.hand) o = Object.assign({}, o, {hand: [o.hand[0] + d, o.hand[1]]}); }
  const h = o.h || 172, s = h / 176, X = f => x + f * h, Y = p => GY - p * h;
  const J = o.jacket || (o.col ? [o.col, o.col, o.col] : PAL.trap), JF = o.far || J;
  c.fillStyle = "rgba(0,0,0,.32)"; c.beginPath(); c.ellipse(x + 3, GY + 2, 22 * s, 3, 0, 0, TAU); c.fill();                 // ground shadow
  leg(c, [X(.012), Y(.515)], [X(-.004), Y(.285)], [X(-.014), Y(.045)], s, PAL.trousersFar); shoe(c, [X(-.014), Y(.045)], s, PAL.shoeFar, 25 * s);
  const shF = [X(.012), Y(.79)], wrF = [X(.006), Y(.47)], elF = ik(shF, wrF, 30 * s, 28 * s, -1);
  limb(c, shF, 5 * s, elF, 4.1 * s, JF); limb(c, elF, 4.1 * s, wrF, 3.3 * s, JF); hand(c, wrF, Math.PI / 2 - .1, s, PAL.skinFar);
  leg(c, [X(-.01), Y(.515)], [X(.008), Y(.285)], [X(.012), Y(.045)], s, PAL.trousers); shoe(c, [X(.012), Y(.045)], s, PAL.shoe, 26 * s);
  const ex = X(.06), ey = GY - h + 12.5 * s;
  limb(c, [X(0), Y(.81)], 5.4 * s, [ex - 9 * s, ey + 9.5 * s], 4.8 * s, PAL.skin);                                        // neck
  const TORSO = [[-.07, .80], [-.08, .72], [-.072, .62], [-.078, .52], [-.07, .468], [0, .462], [.062, .468], [.058, .55], [.056, .63], [.07, .71], [.06, .785], [.034, .822], [-.03, .828]];
  c.beginPath(); spline(c, TORSO.map(([a, b]) => [X(a), Y(b)])); c.fillStyle = shade(c, X(-.08), X(.075), J); c.fill();
  c.strokeStyle = "rgba(0,0,0,.22)"; c.lineWidth = 1; seg(c, X(.045), Y(.78), X(.05), Y(.47));                              // zip
  head(c, ex, ey, s, 0, {cap: o.capCols || PAL.capTrap, visor: o.visor || PAL.visorTrap});
  const shN = [X(-.004), Y(.79)], wrN = o.hand || restHand(x, h), elN = ik(shN, wrN, 30 * s, 28 * s, o.hand ? 1 : -1);
  limb(c, shN, 5.4 * s, elN, 4.3 * s, J); limb(c, elN, 4.3 * s, wrN, 3.4 * s, J);
  if (o.band) { const a = Math.atan2(elN[1] - shN[1], elN[0] - shN[0]), p = [lerp(shN[0], elN[0], .35), lerp(shN[1], elN[1], .35)];   // referee's armband
    c.save(); c.translate(p[0], p[1]); c.rotate(a); c.fillStyle = "#E5E7EB"; c.fillRect(-2.2 * s, -5.2 * s, 4.4 * s, 10.4 * s); c.restore(); }
  c.lineWidth = 1; return wrN;
}
/* trapHouse(c, fire): the trap downrange, protected, seen from the side. Called twice: with fire == null by the cached background
   (the house: concrete side wall, back room and roof, the trap, the timber screen facing the stand — higher than the trap, the target
   leaves over it — with its warning band and the trap letter plate, and the earth bank in front of the screen), then every frame with
   fire = true/false (only the throwing arm: it swings and flashes at the release). Geometry as before the style; nobody is drawn here. */
function trapHouse(c, fire){
  if (fire != null) { c.strokeStyle = fire ? "#FDE68A" : "#9CA3AF"; c.lineWidth = 3; c.lineCap = "round"; seg(c, 628, 306, fire ? 616 : 642, fire ? 298 : 302); c.lineCap = "butt"; c.lineWidth = 1; return; }
  c.fillStyle = "rgba(0,0,0,.3)"; c.beginPath(); c.ellipse(TH_X + 56, GY + 3, 64, 4, 0, 0, TAU); c.fill();
  let g = c.createLinearGradient(TH_X + 16, 0, TH_X + 114, 0); g.addColorStop(0, "#29333f"); g.addColorStop(1, "#465668"); c.fillStyle = g; c.fillRect(TH_X + 16, 296, 98, GY - 296);   // side wall
  c.strokeStyle = "rgba(0,0,0,.25)"; c.lineWidth = 1; seg(c, TH_X + 16, 305, TH_X + 114, 305); seg(c, TH_X + 16, 314, TH_X + 114, 314);
  c.fillStyle = "#33404f"; c.fillRect(TH_X + 64, 282, 50, GY - 282); c.fillStyle = "#56687c"; c.fillRect(TH_X + 60, 277, 58, 6); c.fillStyle = "rgba(255,255,255,.14)"; c.fillRect(TH_X + 60, 277, 58, 1);   // back room, roof
  c.fillStyle = "#1b222b"; box(c, 610, 306, 32, 16, 3); c.fill(); c.fillStyle = "rgba(255,255,255,.1)"; c.fillRect(612, 306, 28, 1);   // the trap
  g = c.createLinearGradient(TH_X, 0, TH_X + 20, 0); g.addColorStop(0, "#3a2b1f"); g.addColorStop(1, "#5d4532"); c.fillStyle = g; c.fillRect(TH_X, 266, 20, GY - 266);   // the screen facing the stand
  c.strokeStyle = "rgba(0,0,0,.35)"; for (let y = 281; y < GY - 3; y += 10) seg(c, TH_X + 1, y, TH_X + 19, y);
  c.fillStyle = "#71553b"; c.fillRect(TH_X - 1, 264, 22, 2);                                                                  // coping
  for (let i = 0; i < 4; i++) { c.fillStyle = i % 2 ? "#111827" : "#FBBF24"; c.fillRect(TH_X + i * 5, 266, 5, 5); }           // warning band
  c.fillStyle = "#E5E7EB"; box(c, TH_X + 4, 285, 12, 15, 2); c.fill(); c.fillStyle = "#111827"; c.font = "bold 11px system-ui"; c.textAlign = "center"; c.textBaseline = "alphabetic"; c.fillText("A", TH_X + 10, 297); // trap letter
  c.fillStyle = "#0f3526"; c.beginPath(); c.moveTo(TH_X - 38, GY + 1); c.bezierCurveTo(TH_X - 22, GY - 3, TH_X - 10, GY - 16, TH_X + 1, GY - 18); c.lineTo(TH_X + 1, GY + 1); c.closePath(); c.fill();   // earth bank
  c.strokeStyle = "rgba(110,231,183,.14)"; c.lineWidth = 1.2; c.beginPath(); c.moveTo(TH_X - 38, GY + 1); c.bezierCurveTo(TH_X - 22, GY - 3, TH_X - 10, GY - 16, TH_X + 1, GY - 18); c.stroke(); c.lineWidth = 1;
}
/* releaseLine(c, x, y, p): the cable of a release device (the trapper's button, the sonopull microphone) from (x, y) down to the
   ground and along it, under the stand, to the trap house. p = null (idle) or 0…1 = how far the release pulse has run (1 = it has
   reached the trap house and the target leaves); the part it has run is lit emerald, its head is a glowing dot. Points and pulse
   logic as before the style; the cable is now solid dark with a faint highlight. */
function releaseLine(c, x, y, p){
  const pts = [[x, y], [x + 6, GY + 7], [TH_X + 8, GY + 7]], tot = pts.reduce((a, q, i) => i ? a + Math.hypot(q[0] - pts[i - 1][0], q[1] - pts[i - 1][1]) : 0, 0);
  const trace = d => { c.beginPath(); c.moveTo(x, y); let at = pts[0];
    for (let i = 1; i < pts.length && d > 0; i++) { const a = pts[i - 1], b = pts[i], L = Math.hypot(b[0] - a[0], b[1] - a[1]), k = Math.min(1, d / L);
      at = [lerp(a[0], b[0], k), lerp(a[1], b[1], k)]; c.lineTo(at[0], at[1]); d -= L; }
    c.stroke(); return at; };
  c.lineJoin = "round"; c.lineWidth = 1.6; c.strokeStyle = "#0e141b"; trace(tot); c.lineWidth = .6; c.strokeStyle = "rgba(255,255,255,.08)"; seg(c, x + 6, GY + 6.6, TH_X + 8, GY + 6.6);
  if (p != null) { c.lineWidth = 6; c.strokeStyle = "rgba(52,211,153,.18)"; trace(p * tot); c.lineWidth = 2.5; c.strokeStyle = ART.em; const h = trace(p * tot);
    if (p < 1) { const m = MK(c), g = c.createRadialGradient(h[0], h[1], 0, h[0], h[1], 9 * m); g.addColorStop(0, "rgba(52,211,153,.95)"); g.addColorStop(1, "rgba(52,211,153,0)");
      c.fillStyle = g; c.fillRect(h[0] - 9 * m, h[1] - 9 * m, 18 * m, 18 * m); c.fillStyle = "#ECFDF5"; dot(c, h[0], h[1], 3 * m); } }
  c.lineWidth = 1; c.lineJoin = "miter";
}
/* gun(c, g, o): the over-and-under (break action — the only kind of gun ClayArena draws) in the gun frame of pose g (GF): walnut
   stock with comb, grip and recoil pad; silver receiver with the hinge pin; trigger guard; two stacked barrels with a lit rib, a
   white bead and the muzzle face; wooden fore-end. About 120 cm long. o.open = broken open and empty (barrels hinged down about the
   pin): the way a gun is carried anywhere OFF the stand (no scene uses it today). Returns the muzzle on the drawn bore. */
function gun(c, g, o = {}){
  c.save(); c.translate(g.hx, g.hy); c.rotate(g.th);
  let gr = c.createLinearGradient(0, -7, 0, 10); gr.addColorStop(0, "#b47a45"); gr.addColorStop(.45, "#7e4c26"); gr.addColorStop(1, "#4a2a14");   // walnut stock
  c.fillStyle = gr; c.beginPath(); c.moveTo(.4, -4); c.quadraticCurveTo(12, -5.4, 25, -6.6); c.quadraticCurveTo(27, -6.7, 29, -6.4); c.lineTo(38, -6);
  c.lineTo(38, -1.8); c.quadraticCurveTo(36.6, -.9, 36.5, .5); c.quadraticCurveTo(36.3, 3, 35.5, 4.6); c.quadraticCurveTo(34, 5.1, 32.5, 4.4);
  c.quadraticCurveTo(30.6, 2, 28.5, .2); c.quadraticCurveTo(21, 1.4, 14, 4.2); c.quadraticCurveTo(7, 7, .4, 10.2); c.closePath(); c.fill();
  c.strokeStyle = "rgba(40,18,6,.35)"; c.lineWidth = .6; c.beginPath(); c.moveTo(3, -1.5); c.quadraticCurveTo(14, -4.5, 26, -5); c.moveTo(3, 3.5); c.quadraticCurveTo(13, .5, 24, -1.6); c.stroke();   // grain
  c.strokeStyle = "rgba(255,222,185,.35)"; c.lineWidth = .7; c.beginPath(); c.moveTo(.6, -4.1); c.quadraticCurveTo(12, -5.5, 25, -6.7); c.stroke();   // comb edge light
  c.fillStyle = "#121214"; box(c, -2.4, -4.2, 2.8, 14.4, 1.2); c.fill();                                                    // recoil pad
  gr = c.createLinearGradient(0, -11.2, 0, -2.8); gr.addColorStop(0, "#eef2f6"); gr.addColorStop(.45, "#aab5c0"); gr.addColorStop(1, "#5f6b77");   // receiver
  c.fillStyle = gr; c.beginPath(); c.moveTo(38, -11.2); c.lineTo(51.5, -11.2); c.lineTo(51.5, -3.6); c.quadraticCurveTo(45, -2.4, 40, -2.8); c.lineTo(38, -3.4); c.closePath(); c.fill();
  c.strokeStyle = "rgba(70,80,92,.55)"; c.lineWidth = .5; c.beginPath(); c.arc(44, -7, 2.3, .4, 4); c.moveTo(48.6, -9); c.arc(47.6, -8.6, 1.3, 0, 3.5); c.stroke();   // engraving
  c.fillStyle = "#4b5663"; dot(c, 50, -7.3, 1.1);                                                                             // hinge pin
  c.strokeStyle = "#2a3139"; c.lineWidth = 1; c.beginPath(); c.arc(43.5, -2.6, 3, .1, Math.PI - .1); c.stroke(); seg(c, 43.8, -3, 43, -.8);   // trigger guard, trigger
  // broken open: the barrels (with the fore-end) drop about the hinge at the lower front of the receiver (51.5, −3.6), so the breech
  // face of both barrels shows below the receiver with its two empty chambers (drawn below, after the barrels)
  if (o.open) { c.translate(51.5, -3.6); c.rotate(.5); c.translate(-51.5, 3.6); }
  gr = c.createLinearGradient(0, -11.4, 0, -5.9); gr.addColorStop(0, "#a9bccd"); gr.addColorStop(.16, "#465565"); gr.addColorStop(.46, "#1d2530"); gr.addColorStop(.5, "#0b0f14"); gr.addColorStop(.56, "#33404d"); gr.addColorStop(1, "#141a21");
  c.fillStyle = gr; c.beginPath(); c.moveTo(51.5, -11.1); c.lineTo(120, -10.8); c.lineTo(120, -6.2); c.lineTo(51.5, -5.9); c.closePath(); c.fill();   // two barrels
  c.strokeStyle = "#0b0f14"; c.lineWidth = .5; seg(c, 51.5, -8.5, 120, -8.5);                                               // their seam (the drawn bore axis)
  c.strokeStyle = "rgba(225,236,247,.85)"; c.lineWidth = .8; seg(c, 50, -11.4, 119.6, -11.2);                                  // rib
  c.fillStyle = "#fff"; dot(c, 119.2, -11.9, .95);                                                                            // bead
  c.fillStyle = "#d7e0e9"; c.fillRect(119.3, -10.8, 1.3, 4.6);                                                                // muzzle face
  gr = c.createLinearGradient(0, -5.9, 0, -2.4); gr.addColorStop(0, "#a46c3d"); gr.addColorStop(1, "#5a3519");                // fore-end
  c.fillStyle = gr; c.beginPath(); c.moveTo(53, -5.9); c.lineTo(78, -5.9); c.quadraticCurveTo(81.5, -5.6, 81, -3.8); c.quadraticCurveTo(80.4, -2.4, 78, -2.4); c.lineTo(56, -2.4); c.quadraticCurveTo(53, -3, 53, -5.9); c.closePath(); c.fill();
  if (o.open) { c.fillStyle = "#c3ccd6"; c.fillRect(50.9, -11.1, 1.2, 5.2); c.fillStyle = "#0b0f14"; dot(c, 51.8, -9.8, 1.1); dot(c, 51.8, -7.2, 1.1); }   // breech face, two empty chambers
  c.restore(); c.lineWidth = 1;
  return GF(g)(120, -BORE);
}
/* shooter(c, g, line, noPill): the shooter on the stand, side view, facing the range (right-handed: the gun on the near, right shoulder).
   g = gun pose {hx, hy, th} (see GF: every pose number is unchanged); line: null | "ok" | "bad" (the Sporting™ line on the vest,
   amber / red); noPill: draw the stripe but not the "line" pill (a phone during the referee's sound signal, see HANDLER). Legs in
   a Sporting™ stance (front foot forward), the far arm to the fore-end and the near arm to the grip by two-bone IK, a vest with
   side panel, shoulder pad and shell pocket, collar, the head fixed at the eye point (cap, glasses, ear defenders), the
   over-and-under. Draw order: far leg, far arm, near leg, hip, neck, vest, collar, head, gun, near arm, the "line" pill.
   Returns the muzzle on the drawn bore (only the muzzle flash and the smoke use it). */
const VEST = [[166, 179], [160, 193], [157.5, 214], [159, 236], [161, 252], [176, 254.5], [191, 251], [193.5, 232], [195, 212], [193, 193], [189.5, 181], [181, 175.5], [172, 175.5]];
function shooter(c, g, line, noPill){
  const F = GF(g), E = eyePt(), tilt = .26;
  leg(c, [176, 240], [190, 278], [197, 314], 1, PAL.trousersFar); shoe(c, [197, 314], 1, PAL.shoeFar, 26);                // far (left) leg forward
  const shF = [193, 182]; let uf = 60, hF = F(uf, -1.4); while (uf > 52 && Math.hypot(hF[0] - shF[0], hF[1] - shF[1]) > 57) { uf -= 1; hF = F(uf, -1.4); }
  const elF = ik(shF, hF, 30, 28, 1); limb(c, shF, 5, elF, 4.2, PAL.shirtFar); limb(c, elF, 4.2, hF, 3.3, PAL.shirtFar); hand(c, hF, g.th + .25, 1, PAL.skinFar, 5.2);   // far arm → fore-end
  leg(c, [168, 240], [162, 280], [155, 314], 1, PAL.trousers); shoe(c, [155, 314], 1, PAL.shoe, 21);                      // near (right) leg back
  c.beginPath(); c.ellipse(172, 244, 14, 10, 0, 0, TAU); c.fillStyle = shade(c, 158, 186, PAL.trousers); c.fill();          // hip
  const R = (x, y) => [E[0] + x * Math.cos(tilt) - y * Math.sin(tilt), E[1] + x * Math.sin(tilt) + y * Math.cos(tilt)];
  limb(c, [178, 178], 5.8, R(-9.5, 9), 5, PAL.skin);                                                                      // neck
  c.beginPath(); spline(c, VEST); c.fillStyle = shade(c, 157, 196, PAL.vest); c.fill();                                   // vest
  c.save(); c.clip();
  c.fillStyle = PAL.vestDark; c.fillRect(150, 170, 14, 90);                                                                // side panel
  c.fillStyle = PAL.vestPad; box(c, 182, 179, 12, 22, 4); c.fill();                                                        // shoulder (recoil) pad
  c.fillStyle = "rgba(0,0,0,.18)"; box(c, 175, 226, 19, 22, 3); c.fill(); c.strokeStyle = "rgba(255,255,255,.12)"; c.lineWidth = 1; seg(c, 175, 231, 194, 231);   // shell pocket
  if (line) { c.fillStyle = line === "bad" ? ART.red : ART.amber; c.fillRect(150, LINE_Y - 1.8, 50, 3.6); }                // the line on the vest
  c.restore();
  c.fillStyle = "#d8d0bf"; c.beginPath(); c.moveTo(172, 176); c.quadraticCurveTo(179, 181, 186, 176.5); c.lineTo(183, 174.5); c.quadraticCurveTo(178, 177, 174, 174.5); c.closePath(); c.fill();   // collar
  head(c, E[0], E[1], 1, tilt, {cap: PAL.capShooter, visor: PAL.visorShooter});
  const muzzle = gun(c, g);
  const wr = F(33.5, 1.5), shN = [181, 187], elN = ik(shN, wr, 30, 28, 1);                                               // near arm → grip
  limb(c, shN, 5.6, elN, 4.4, PAL.shirt); limb(c, elN, 4.4, wr, 3.5, PAL.shirt); hand(c, wr, g.th + 1.25, 1, PAL.skin, 5.4);
  // its pill ends left of the vest (x ≈ 158), so it never covers the line it names (review 08.10.2026; spec §10). noPill: on a
  // phone the pill is hidden while the referee gives the sound signal (it would cover his signalling hand); the stripe stays
  // The "line" pill sits to the RIGHT of the stand (free ground, x ≈ 238…, y ≈ 266) with a dashed leader to the end of the stripe:
  // on the left it covered the referee, on a phone (pill ×2) most of him (owner 09.10.2026). The sonopull microphone (MIC_X) is
  // never in a scene that draws the line.
  if (line && !noPill) { const k = FK(c), col = line === "bad" ? ART.red : ART.amber, px = 238, py = 266 + 2 * k;
    c.strokeStyle = rgba(col, .75); c.lineWidth = 1.2; c.setLineDash([3, 3]); seg(c, 200, LINE_Y, px - 3, py - 5 * k); c.setLineDash([]); c.lineWidth = 1;
    label(c, CANVAS_EN.line, px, py, col, "left"); }
  return muzzle;
}
/* MASCOT: the ClayArena dog through docs/shared/mascot.js (window.ClayMascot.draw(ctx, pose, x, y, scale, state) → {head, collar,
   top}; (x, y) = the ground point, scale 1 ≈ 100 px tall; state {view: "side" (the side view always wears dog earmuffs), ear 0…1
   (flick on "Pull!"), look (rad, from the head to the target; −40°…+10°), wag (tail = sin(wag)), muffs}). dog(c, x, y, s, st)
   draws it facing the range when the module is on the page and returns the collar point (where the lead is clipped on); without
   the module (or if it throws) nothing is drawn, null is returned and the scene works as before. Kept left of BEHIND_X like a
   person (SAFETY). The dog never holds anything and says nothing here. */
let dogBroken = false;
function dog(c, x, y, s, st){
  const M = window.ClayMascot; if (dogBroken || !M || typeof M.draw !== "function") return null;
  if (x > BEHIND_X - 30) x = BEHIND_X - 30;
  let r = null; c.save();
  try { r = M.draw(c, "safety", x, y, s, Object.assign({view: "side", muffs: true}, st)); }
  catch (e) { dogBroken = true; try { console.warn("ClaySims: ClayMascot.draw failed; the stand scenes go on without the dog", e); } catch (e2) {} }
  c.restore(); return r && r.collar ? r.collar : null;
}
/* mascot.js is loaded separately (nav.js adds it, async): if it arrives after a scene drew its still picture, redraw that picture
   on its "claymascot:ready" event */
function whenMascot(cb){ if (typeof document === "undefined" || window.ClayMascot) return () => {};
  const h = () => { try { cb(); } catch (e) {} }; document.addEventListener("claymascot:ready", h, {once: true});
  return () => document.removeEventListener("claymascot:ready", h); }
/* standSim(host, kind, opts): one stand scene (SCENES). Drawn back to front: the background layer (sky, trees, ground, the trap house
   and the stand), the release cable on the ground, the trap arm, the sonopull microphone (front edge of the stand), the target, the
   dog's handler, the trapper (behind the referee), the dog on its lead, the referee with the sound signal back to the trapper / the
   yellow card / “No Bird!”, the shooter, the call, the shot (flash, smoke), the cheek mark; then the clock. The people and the dog
   are sprites in the frames where they do not move (sprite()). People only behind the shooter, and everyone (shooter, referee,
   trapper, handler) wears safety glasses and ear muffs (SAFETY above SCENES). Under the canvas a small caption (ui anim_scale) says
   that only the shooter and the stand are to scale and the field and the target's flight are shortened (kept in print). */
function standSim(host, kind, opts = {}){
  const sc = SCENES[kind] || SCENES.signal, title = sceneTitle(sc);
  host.innerHTML = `<div class="cs-sim">${sc.words ? `<div class="cs-words" lang="en" aria-hidden="true" data-k="words"></div>` : ""}<canvas width="720" height="${SH}" role="img" aria-label="${esc(title)}"></canvas><p class="cs-scale">${esc(T("anim_scale"))}</p><div class="cs-ctl">${playBtn("anim_play")}${slowBtn()}<b>${esc(title)}</b></div><div class="cs-say" aria-live="polite" data-k="say"></div></div>`;
  const cv = logical(host.querySelector("canvas"), 720, SH), c = cv.getContext("2d"), W = 720, out = host.querySelector('[data-k="say"]');
  const words = sc.words ? wordsBar(host.querySelector('[data-k="words"]')) : null;
  const rel = sc.release, t0c = sc.timer === "signal" ? sc.signal : sc.call, hitT = sc.shot != null && !sc.click ? sc.shot : null;
  // the trapper presses the release button at pressT: after the referee's signal (or the call), at most 0.25 s before the release;
  // the pulse runs along the cable from pressT and reaches the trap house at the release (the scene times are unchanged)
  const pressT = rel == null ? null : Math.max(rel - .25, sc.signal != null ? sc.signal + .15 : -1, sc.call != null ? sc.call + .05 : -1);
  const pulse = (t, from) => (t >= from && t < rel + .3 ? clamp01((t - from) / Math.max(.05, rel - from)) : null);
  const TR_HAND = [TRAPPER_X + .1 * TRAPPER_H, GY - .56 * TRAPPER_H]; // the trapper's hand with the release button
  // narrow screen: a band above the scene for a clock drawn ck times bigger (over the sky it would hide the target and the "Pull!")
  let band = 0, ck = 1;
  const layout = () => { const w = cv.clientWidth, k = w > 0 ? W / w : 1; ck = Math.max(1, Math.min(1.9, k * .95));
    const b = sc.timer && k > 1.35 ? Math.ceil(12 + 72 * ck + 10) : 0; if (b !== band) { band = b; cv._lh = SH + band; } };
  // what the status line says, and from when (scene seconds)
  const says = [];
  if (sc.timer) { const n = rel - t0c; says.push([rel, fill(T(sc.timer === "call" ? (sc.mic ? "anim_s_sonopull" : "anim_s_manual") : n > CALL.limit ? "anim_s_late" : "anim_s_in_time"), {n: num1(n), max: CALL.limit})]); }
  if (kind === "gun-ready") says.push([0, T("anim_s_gun_low")], [sc.mount[0], T("anim_s_gun_mount")]);
  if (sc.move) says.push([0, T("anim_s_mount_ready")], [sc.move[0], T("anim_s_move")], [sc.mount[0], T("anim_s_mount")], [sc.shot, T("anim_s_shoot")]);
  if (sc.card) says.push([sc.card, T("anim_s_early")]);
  if (sc.click) says.push([sc.shot, T("anim_s_click")], [sc.safe[0] + .2, T("anim_s_hold")], [sc.walk[1], T("anim_s_ref")], [sc.walk[1] + 1, T("anim_s_repeat")]);
  let said = null;
  const say = t => { let s = ""; for (const [at, x] of says) if (t >= at) s = x; if (s !== said) { said = s; out.textContent = s; } };
  const pose = t => { // gun pose at time t, and the aim point
    const u = rel != null && t >= rel ? (t - rel) / FLY : null, flying = u != null && u <= 1 && (hitT == null || t < hitT + .25);
    const aim = flying ? TP(Math.min(1, u + .03)) : hitT != null && t >= hitT ? TP((hitT + .25 - rel) / FLY) : AIM0;
    // Compak® Sporting gun-up (sc.up): the muzzles wait at the hold point AIM0 and never dip toward the trap house (a loader may
    // shelter there); they join the target once it has climbed to the hold height (y ≤ AIM0[1]), so before the shot the barrels
    // always point up (audit 08.10.2026: they used to snap down onto the trap at the release). SCENES: the shot comes ≥ 0.15 s later.
    if (sc.up) return aim[1] > AIM0[1] ? upPose(AIM0[0], AIM0[1]) : upPose(aim[0], aim[1]);
    if (sc.move) { // muzzles first: the front hand turns the barrels onto the target's line (km), then the heel rises to the shoulder (ku)
      const km = ease(clamp01((t - sc.move[0]) / (sc.move[1] - sc.move[0]))), ku = ease(clamp01((t - sc.mount[0]) / (sc.mount[1] - sc.mount[0])));
      const hx = lerp(READY.hx, 190, ku), hy = lerp(READY.hy, 186, ku); return {hx, hy, th: lerp(READY.th, Math.atan2(aim[1] - hy, aim[0] - hx), km)}; }
    if (!sc.mount) return LOW;
    let g = mixPose(LOW, upPose(aim[0], aim[1]), ease(clamp01((t - sc.mount[0]) / (sc.mount[1] - sc.mount[0]))));
    if (sc.safe && t >= sc.safe[0]) { const a = TP(Math.min(1, (sc.safe[0] - rel) / FLY + .03)); // from where the gun was when it is lowered
      g = mixPose(upPose(a[0], a[1]), SAFE, ease(clamp01((t - sc.safe[0]) / (sc.safe[1] - sc.safe[0])))); }
    return g;
  };
  // the dog (MASCOT): ears flick on "Pull!" (up in 0.1 s, then a damped settle), the head follows the target (clamped −40°…+10°,
  // a little behind it), the tail wags 4 times in 1 s after a hit; with reduced motion no flick and no wag (the head still follows)
  const dogHead = () => [DOG.x + 11 * DOG.s, GY + DOG.dy - 72 * DOG.s]; // about where its head is (look = angle from there to the target)
  const lookAt = p => { const [x, y] = dogHead(); return Math.max(-.7, Math.min(.17, Math.atan2(p[1] - y, p[0] - x))); };
  const REST = DOG_REST, dogState = t => { const rm = RM();
    let ear = 0; if (!rm && sc.call != null && t >= sc.call) { const a = t - sc.call; ear = a < .1 ? a / .1 : Math.max(0, Math.exp(-(a - .1) * 7) * Math.cos((a - .1) * 11)); if (ear < .02) ear = 0; } // settled: exactly 0 (the still dog is a sprite)
    let look = REST;
    if (rel != null && t >= rel) { const u = (t - rel) / FLY, br = hitT != null && t >= hitT;
      const p = br ? TP((hitT - rel) / FLY) : TP(clamp01(u - .03)), aimL = lookAt(p);
      const back = br ? ease(clamp01((t - hitT - .9) / .4)) : u > 1 ? ease(clamp01((u - 1) * FLY / .5)) : 0;
      look = lerp(REST, aimL, ease(clamp01((t - rel) / .15)) * (1 - back)); }
    const wag = !rm && hitT != null && t >= hitT && t < hitT + 1 ? TAU * 4 * (t - hitT) : 0;
    return {ear: clamp01(ear), look, wag}; };
  let lastT = 0;
  const draw = t => {
    lastT = t; fit(cv, c); const m = MK(c), k = FK(c);
    if (band) { c.fillStyle = ART.sky0; c.fillRect(0, 0, W, band); c.translate(0, band); } // the sky runs on into the clock band, no seam
    layer(c, "side", W, SH, sidePaint);
    // the release cable on the ground (from the sonopull microphone, or from the trapper's button), the trap arm; nobody downrange:
    // the trapper stands behind the referee (below), the trap is protected by the screen of the trap house and its earth bank
    const pr = rel == null ? null : sc.mic ? pulse(t, rel - .15) : pulse(t, pressT);
    if (sc.mic) releaseLine(c, MIC_X, GY, pr); else releaseLine(c, TR_HAND[0] + 1, TR_HAND[1] + 6, pr);
    trapHouse(c, rel != null && t >= rel && t < rel + .12);
    if (sc.mic) { const on = t >= sc.call && t < rel + .2; // the sonopull microphone on a low post at the front edge of the stand (on the stand, never downrange): it hears the call
      c.fillStyle = "#4B5563"; c.fillRect(MIC_X - 1.25, 252, 2.5, GY - 252); c.fillStyle = "#9CA3AF"; c.fillRect(MIC_X + .25, 252, 1, GY - 252);
      if (on) { const g = c.createRadialGradient(MIC_X, 246, 0, MIC_X, 246, 12); g.addColorStop(0, "rgba(52,211,153,.5)"); g.addColorStop(1, "rgba(52,211,153,0)"); c.fillStyle = g; dot(c, MIC_X, 246, 12); }
      c.fillStyle = on ? ART.em : "#1F2937"; box(c, MIC_X - 4, 240, 8, 12, 4); c.fill(); c.strokeStyle = "rgba(255,255,255,.25)"; c.lineWidth = 1; for (let i = 0; i < 3; i++) seg(c, MIC_X - 2.5, 243 + i * 3, MIC_X + 2.5, 243 + i * 3); }
    // the target: in the air (with its comet trail), broken by the shot, or (after a click) flying on unbroken
    if (rel != null && t >= rel) { const u = (t - rel) / FLY;
      if (hitT != null && t >= hitT) { if (t < hitT + .9) { const [x, y] = TP((hitT - rel) / FLY); burst(c, x, y, (t - hitT) * .8); } }
      else if (u <= 1) { comet(c, TP, u, .10, 6.5); const [x, y] = TP(u); clay(c, x, y, .75, {}, 0, {spin: RM() ? 0 : t * 9}); } }
    // the people behind the stand and the dog, back to front: the handler, the trapper, the dog, the referee. A part that does not
    // move in this frame is a cached sprite (sprite(): same picture, one drawImage; review 08.10.2026), the others are drawn directly.
    const withDog = !!window.ClayMascot && !dogBroken, LH = restHand(HANDLER.x, HANDLER.h); LH[1] += HANDLER.dy; // the handler's hand with the lead
    // the dog's handler (no gun; cap, glasses and ear defenders), a step behind the trapper (MASCOT: only with mascot.js)
    if (withDog) sprite(c, "handler", HANDLER.x - 30, GY - HANDLER.h - 16 + HANDLER.dy, 66, HANDLER.h + 28, o => {
      o.save(); o.translate(0, HANDLER.dy); person(o, HANDLER.x, {h: HANDLER.h, jacket: PAL.handlerFar, far: PAL.handlerFar, capCols: PAL.capHandler, visor: PAL.visorHandler}); o.restore(); });
    // the trapper (not with a sonopull): behind the referee, out of every line of fire, with the hand-held release button; it lights
    // while pressed, and the pulse runs along the cable to the trap house (drawn above)
    if (!sc.mic) sprite(c, "trapper|" + (pr != null ? 1 : 0), TRAPPER_X - 30, GY - TRAPPER_H - 16, 66, TRAPPER_H + 28, o => {
      const h = person(o, TRAPPER_X, {h: TRAPPER_H, jacket: PAL.trap, far: PAL.trapFar, capCols: PAL.capTrap, visor: PAL.visorTrap, hand: TR_HAND});
      o.save(); o.translate(h[0] + 3, h[1] - 2); o.rotate(-.35); o.fillStyle = "#0f141b"; box(o, -2.6, -6, 5.2, 13, 1.6); o.fill();
      if (pr != null) { o.fillStyle = "rgba(52,211,153,.35)"; dot(o, 0, -6.2, 5.5); } o.fillStyle = pr != null ? ART.em : "#0f766e"; dot(o, 0, -6.2, 2.1); o.restore();
      hand(o, h, -.2, TRAPPER_H / 176, PAL.skin); });
    // the dog sits at the handler's feet, a step nearer the viewer, in dog earmuffs; the lead from the handler's hand to its collar
    if (withDog) { const st = dogState(t), paintDog = o => { const col = dog(o, DOG.x, GY + DOG.dy, DOG.s, st);
        if (col) { o.strokeStyle = PAL.lead; o.lineWidth = 1.6; o.lineCap = "round"; o.beginPath(); o.moveTo(LH[0], LH[1]);
          o.quadraticCurveTo((LH[0] + col[0]) / 2 - 4, Math.max(LH[1], col[1]) - 6, col[0], col[1]); o.stroke(); o.lineCap = "butt"; o.lineWidth = 1; } };
      // sprite box: the dog (DOG.x − 40 … + 23 at s .7) and its lead from the handler's hand, with a margin
      if (st.ear === 0 && st.wag === 0 && st.look === DOG_REST) sprite(c, "dog", DOG.x - 50, GY + DOG.dy - 140, 86, 150, paintDog); else paintDog(c); }
    // referee: behind the shooter; walks up from behind after a misfire (never past the muzzles); gives the sound signal back to the
    // trapper; raises the yellow card; holds the score sheet otherwise. A sprite while he stands still.
    const walking = !!sc.walk && t > sc.walk[0] && t < sc.walk[1];
    const rx = sc.walk ? lerp(REF_X, 128, ease(clamp01((t - sc.walk[0]) / (sc.walk[1] - sc.walk[0])))) : REF_X;
    const sig = sc.signal != null && t >= sc.signal && t < sc.signal + .6, card = sc.card != null && t >= sc.card;
    const hand0 = card ? [rx + 14, GY - REF_H - 8] : sig ? [rx - .10 * REF_H, GY - .70 * REF_H] : [rx + .085 * REF_H, GY - .47 * REF_H];
    const rh = hand0; // person() returns the hand it is given (rx ≤ 128 < BEHIND_X: the safety clamp never moves the referee)
    const paintRef = o => { person(o, rx, {h: REF_H, jacket: PAL.ref, far: PAL.refFar, capCols: PAL.capRef, visor: PAL.visorRef, band: 1, hand: hand0});
      if (!card && !sig) { o.save(); o.translate(rh[0] + 7, rh[1] - 4); o.rotate(-.22); o.fillStyle = "#7a5a3c"; box(o, -7, -10, 14, 19, 1.5); o.fill(); o.fillStyle = "#EEF2F6"; o.fillRect(-5.5, -7, 11, 14.5); o.fillStyle = "#9CA3AF"; o.fillRect(-3, -11, 6, 2.6);
        o.fillStyle = "rgba(15,23,42,.35)"; for (let i = 0; i < 4; i++) o.fillRect(-4, -4.5 + i * 3.2, 8, .8); o.restore(); }   // score sheet
      hand(o, rh, card ? -1.5 : sig ? Math.PI + .3 : -.4, REF_H / 176, PAL.skin);
      if (card) { o.fillStyle = "#FACC15"; o.save(); o.translate(rh[0], rh[1] - 4); o.rotate(.12); o.fillRect(-7, -20, 14, 20); o.restore(); } };
    if (walking) paintRef(c); else sprite(c, `ref|${rx}|${card ? "card" : sig ? "sig" : "sheet"}`, rx - 34, GY - REF_H - 56, 80, REF_H + 64, paintRef);
    if (card) bubble(c, rx - 12, GY - REF_H - 2 - 10, "!", {bg: "#FEF3C7", age: t - sc.card});
    if (sig) { const q = t - sc.signal, ear = [TRAPPER_X + 2, GY - TRAPPER_H + 14]; // sound signal back to the trapper (arcs open to the left)
      c.fillStyle = "#111827"; dot(c, rh[0], rh[1], 3.2); c.strokeStyle = ART.cyan; c.lineWidth = 2;
      for (let i = 0; i < 3; i++) { const r = 7 + ((q * 60 + i * 8) % 24); c.globalAlpha = Math.max(0, 1 - (r - 7) / 26); c.beginPath(); c.arc(rh[0], rh[1], r, Math.PI - .7, Math.PI + .7); c.stroke(); }
      c.globalAlpha = 1; c.lineWidth = 1.2; c.strokeStyle = rgba(ART.cyan, .8); c.setLineDash([4, 5]); const p = clamp01(q / .2); seg(c, rh[0], rh[1], lerp(rh[0], ear[0], p), lerp(rh[1], ear[1], p)); c.setLineDash([]); c.lineWidth = 1;
      font(c, 15, "800"); c.textAlign = "center"; c.textBaseline = "alphabetic"; c.lineJoin = "round"; c.lineWidth = 3 * k; c.strokeStyle = ART.pill; // "♪": a symbol, not a word —
      c.strokeText("♪", rh[0] - 5, rh[1] - 14); c.fillStyle = ART.cyan; c.fillText("♪", rh[0] - 5, rh[1] - 14); c.lineJoin = "miter"; c.lineWidth = 1; } // no pill, so on a phone it hides no face
    if (sc.nobird != null && t >= sc.nobird) bubble(c, rx + 6, GY - REF_H - 14 - 10, "No Bird!", {bg: "#FEE2E2", fg: "#7F1D1D", age: t - sc.nobird});
    // the shooter and the line on the vest: red while the heel of the stock (as drawn) is above it BEFORE the target is out (the mount
    // after the release is correct, so the line turns amber again), the call, the shot
    const g = pose(t), early = heelY(g) < LINE_Y && (rel == null || t < rel), muzzle = shooter(c, g, sc.line ? (early ? "bad" : "ok") : null); // the "line" pill is right of the stand now: no need to hide it during the signal
    if (sc.call != null && t >= sc.call && t < sc.call + .9) bubble(c, 196, 128, "Pull!", {age: t - sc.call});
    if (sc.mic && t >= sc.call && t < rel) { c.strokeStyle = rgba(ART.em, .8); c.lineWidth = 1.5; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(206, 166, 10 + i * 8, .2, 1.2); c.stroke(); } c.lineWidth = 1; } // the call heard by the microphone
    if (hitT != null && t >= hitT) { if (t < hitT + .09) flash(c, muzzle, g.th, (t - hitT) / .09); smoke(c, GF(pose(hitT))(120, -BORE), t - hitT); }
    // gun-mount scene: when the mount is finished, the cheek rests on the comb (the top edge of the stock) and the head is still. The
    // mark is an amber highlight ALONG the top edge of the comb (gun frame u 8 → 27), not a ring: the comb is only about 6 px below
    // the eye, so a ring circled the amber lens and crossed the ear cup on a phone (review 08.10.2026: eye and ear protection must
    // stay visible). The pill grows to the right; a long text (lt, pl, de on a phone) would reach the target at the shot, so it is
    // then right-aligned just behind the head and grows to the left, over the people's heads (they start at y ≥ 145).
    if (sc.cheek && t >= sc.mount[1] - .05) { const G2 = GF(g), a0 = G2(8, -5.2), a1 = G2(17, -6.4), a2 = G2(27, -6.5);
      c.strokeStyle = ART.amber; c.lineWidth = 2 * m; c.lineCap = "round"; c.beginPath(); c.moveTo(a0[0], a0[1]); c.quadraticCurveTo(a1[0], a1[1], a2[0], a2[1]); c.stroke(); c.lineCap = "butt"; c.lineWidth = 1;
      const yb = 145 - 8 - 4 * k, pb = pillBox(c, T("anim_cheek"), 150, yb, "left", 12, "650"), long = pb.x + pb.w > 400;
      label(c, T("anim_cheek"), long ? 178 : 150, yb, ART.amber, long ? "right" : "left"); }
    c.setTransform(c._s, 0, 0, c._s, 0, 0);
    // the clock (call and release scenes): over the sky on wide screens, in the band above the scene on narrow ones
    if (sc.timer) { const v = t < t0c ? 0 : Math.min(t, rel) - t0c; clock(c, v, T(sc.timer === "signal" ? "anim_after_signal" : "anim_after_call"), t < rel ? "run" : v > CALL.limit ? "late" : "ok", band ? ck : 1); }
    if (words) words(["move", "mount", "shoot"], t < sc.move[0] ? -1 : t < sc.mount[0] ? 0 : t < sc.shot ? 1 : 2);
    say(t);
  };
  let raf = 0, start = 0, f = 1;
  const frame = ts => { if (!start) start = ts; const t = Math.min(sc.end, (ts - start) / 1000 / f); draw(t); if (t < sc.end) raf = requestAnimationFrame(frame); else { raf = 0; setPlay(host, false); } };
  const run = () => { cancelAnimationFrame(raf); start = 0; f = slowF(); said = null; setPlay(host, true); raf = requestAnimationFrame(frame); };
  const halt = () => { cancelAnimationFrame(raf); raf = 0; setPlay(host, false); };
  wire(host, run, null, halt); layout(); draw(0);
  const unwatch = watchSize(cv, () => { layout(); if (!raf) draw(lastT); });
  const unmascot = whenMascot(() => { if (!raf) draw(lastT); });
  const off = autoStart(host, cv, run, opts.autoplay === undefined ? "now" : opts.autoplay, opts.onAutoplay, opts.onUser);
  const s = {stop: () => { off(); unwatch(); unmascot(); cancelAnimationFrame(raf); raf = 0; }, run}; SIMS.push(s); return s;
}

/* Tab label of a preset: its term label (English, the local word in brackets when the page knows it and it differs, owner rule
   08.10.2026) + the direction arrow of the left/right variants: "Crosser (поперечна мішень) →"; of a pair: the label of its glossary
   term ("Double on report (дуплет на постріл)"); of a stand scene: sceneTitle(): the term label of mount / gun-ready, the ui text
   with {term} filled in for sonopull, else the ui text. */
const DIR = {"crosser-lr": "→", "crosser-rl": "←"};
const NAME = {"crosser-lr": "Crosser", "crosser-rl": "Crosser", "incomer": "Incomer", "driven": "Driven target", "going-away": "Going away", "overhead": "Overhead",
  "quartering-away": "Quartering away", "quartering-towards": "Quartering towards", "teal": "Teal", "chandelle": "Chandelle", "looper": "Looper", "battue": "Battue",
  "dropping": "Dropping target", "rabbit": "Rabbit", "springing": "Springing target", "bolting": "Bolting rabbit"};
const tabLabel = p => `${termLabel(FLIGHTS[p].term, NAME[p] || p)}${DIR[p] ? " " + DIR[p] : ""}`;
const pairName = k => termLabel((PAIRS[k] || PAIRS.report).term);
const sceneTitle = sc => sc.tab ? fill(T(sc.tab), {term: sc.term ? termLabel(sc.term) : ""}) : sc.term ? termLabel(sc.term) : T("anim_h_misfire");
/* the glossary ids of every term this file names (the build writes their names for the pages: ui.json "terms", CLAYSIMS_TERMS) */
const TERM_IDS = [...new Set([...Object.values(FLIGHTS).map(f => f.term), ...Object.keys(TERM_EN)])].filter(Boolean);
/* mount(host, sim, o): sim = {type: "flight", preset, also: [...], pairs: [...], focus} | {type: "lead", method, preset, focus, stop}
   | {type: "pair", kind, also: [...]} | {type: "call", kind, also: [...]}. Several presets, pairs or scenes get one tab each.
   o.autoplay: "view" (default) | "now" | false; o.onAutoplay(): called once when it played by itself (the Academy remembers it, so a
   re-render does not play it again); o.onUser(): called once when the reader acted inside it before it played by itself (the
   Academy remembers that too); o.tab: the tab to open ("f:<preset>", "p:<pair>", "c:<scene>"); o.onTab(tab) when the reader picks one. */
function mount(host, sim, o = {}){ if (!host || !sim) return;
  const ap = o.autoplay === undefined ? "view" : o.autoplay, done = o.onAutoplay, onUser = o.onUser;
  if (sim.type === "lead") return leadLab(host, sim.method, Object.assign({}, sim, {autoplay: ap, onAutoplay: done, onUser}));
  if (sim.type === "pattern") return patternSim(host, Object.assign({}, sim, {autoplay: ap, onAutoplay: done, onUser}));
  let tabs;
  if (sim.type === "flight") tabs = [...[sim.preset, ...(sim.also || [])].filter(p => FLIGHTS[p]).map(p => ({k: "f:" + p, label: tabLabel(p)})),
                                   ...(sim.pairs || []).filter(k => PAIRS[k]).map(k => ({k: "p:" + k, label: pairName(k)}))];
  else if (sim.type === "stock") tabs = [sim.kind || "lop", ...(sim.also || [])].filter(k => STOCK[k]).map(k => ({k: "s:" + k, label: termLabel(STOCK[k].term)}));
  else if (sim.type === "ties") tabs = [sim.kind || "countback", ...(sim.also || [])].filter(k => TIES[k]).map(k => ({k: "t:" + k, label: termLabel(TIES[k].term)}));
  else if (sim.type === "miss") tabs = [sim.kind || "behind", ...(sim.also || [])].filter(k => MISS[k]).map(k => ({k: "m:" + k, label: termLabel(MISS[k].term)}));
  else if (sim.type === "pair") tabs = [sim.kind, ...(sim.also || [])].filter(k => PAIRS[k]).map(k => ({k: "p:" + k, label: pairName(k)}));
  else if (sim.type === "call") tabs = [sim.kind || "signal", ...(sim.also || [])].filter(k => SCENES[k]).map(k => ({k: "c:" + k, label: sceneTitle(SCENES[k])}));
  else return; // a type without an animation mounts nothing
  const show = (el, k, a) => { const x = k.slice(2), op = {autoplay: a, onAutoplay: done, onUser};
    return k.startsWith("p:") ? pairSim(el, x, op) : k.startsWith("c:") ? standSim(el, x, op) : k.startsWith("m:") ? missSim(el, x, op) : k.startsWith("t:") ? tiesSim(el, x, op) : k.startsWith("s:") ? stockSim(el, x, op) : flightSim(el, x, Object.assign({focus: sim.focus}, op)); };
  if (!tabs.length) tabs = [{k: sim.type === "pair" ? "p:report" : sim.type === "call" ? "c:signal" : sim.type === "miss" ? "m:behind" : sim.type === "ties" ? "t:countback" : sim.type === "stock" ? "s:lop" : "f:" + sim.preset}];
  if (tabs.length < 2) return show(host, tabs[0].k, ap);
  const first = o.tab && tabs.some(b => b.k === o.tab) ? o.tab : tabs[0].k;
  host.innerHTML = `<div class="cs-tabs" role="group">${tabs.map(b => `<button type="button" class="cs-btn${b.k === first ? " cs-primary" : ""}" data-p="${esc(b.k)}" aria-pressed="${b.k === first}">${esc(b.label)}</button>`).join("")}</div><div></div>`;
  const el = host.lastElementChild; let cur = null;
  const pick = (k, a) => { cur && cur.stop(); host.querySelectorAll("[data-p]").forEach(b => { const on = b.dataset.p === k; b.classList.toggle("cs-primary", on); b.setAttribute("aria-pressed", on ? "true" : "false"); });
    cur = show(el, k, a); };
  host.querySelectorAll("[data-p]").forEach(b => b.onclick = () => { pick(b.dataset.p, RM() ? false : "now"); if (o.onTab) o.onTab(b.dataset.p); });
  cur = show(el, first, ap); return {stop: () => cur && cur.stop()};
}
/* kind(sim): what the animation teaches — picks the heading "▶ <anim_h_kind>" and the generic caption anim_w_<kind>
   (the Academy build and the glossary use the same words). */
function kind(sim){ sim = sim || {};
  if (sim.type === "pair") return "pair";
  if (sim.type === "pattern") return "pattern";
  if (sim.type === "miss") return "miss";
  if (sim.type === "ties") return "ties";
  if (sim.type === "stock") return "stock";
  if (sim.type === "lead") return sim.focus === "mount" ? "mount" : sim.focus === "follow-through" ? "follow" : "lead";
  if (sim.type === "call") { const k = sim.kind || "signal"; return k === "mount" ? "mount" : /^gun-/.test(k) ? "gunpos" : k === "misfire" ? "misfire" : "call"; }
  if ((sim.pairs || []).length) return "pair";
  return ["points", "eyes", "stance"].includes(sim.focus) ? sim.focus : "flight";
}
/* hero(host, sim, o): the animation as the first thing to see — heading, the animation (plays once when on screen), one line of
   what to watch (o.caption, else the generic one of its kind). Glossary term pages get it through auto(). */
function hero(host, sim, o = {}){ if (!host || !sim) return; const k = kind(sim);
  host.classList.add("cs-hero");
  host.innerHTML = `<p class="cs-hero-h"><span aria-hidden="true">▶</span> ${esc(T("anim_h_" + k))}</p><div class="cs-hero-sim"></div><p class="cs-hero-w">${esc(o.caption || T("anim_w_" + k))}</p>`;
  return mount(host.querySelector(".cs-hero-sim"), sim, {autoplay: o.autoplay === undefined ? "view" : o.autoplay});
}
/* Glossary term id -> animation. ONE list used by the glossary pages, the Interpreter Academy and the rules trainer. A term the lessons
   animate gets the same animation here (audit: stance, gun mount, release by hand, gun position, yellow card, double, bolting rabbit,
   miss behind, leading edge and gun speed had empty term pages). */
const TERM_SIMS = {
  "crosser": {type: "flight", preset: "crosser-lr", also: ["crosser-rl"]}, "incomer": {type: "flight", preset: "incomer"}, "going-away": {type: "flight", preset: "going-away"},
  "driven-target": {type: "flight", preset: "driven"}, "overhead": {type: "flight", preset: "overhead"},
  "quartering-away": {type: "flight", preset: "quartering-away"}, "quartering-towards": {type: "flight", preset: "quartering-towards"},
  "teal": {type: "flight", preset: "teal"}, "chandelle": {type: "flight", preset: "chandelle"}, "looper": {type: "flight", preset: "looper"},
  "battue": {type: "flight", preset: "battue"}, "dropping-target": {type: "flight", preset: "dropping"}, "rabbit": {type: "flight", preset: "rabbit"},
  "bolting-rabbit": {type: "flight", preset: "bolting", also: ["rabbit"]}, "springing-target": {type: "flight", preset: "springing", also: ["teal"]},
  "pick-up-point": {type: "flight", preset: "quartering-away", focus: "points"}, "hold-point": {type: "flight", preset: "quartering-away", focus: "points"},
  "break-point": {type: "flight", preset: "quartering-away", focus: "points"}, "stance": {type: "flight", preset: "crosser-lr", focus: "stance"},
  "soft-focus": {type: "flight", preset: "going-away", focus: "eyes"}, "hard-focus": {type: "flight", preset: "going-away", focus: "eyes"},
  "leading-edge": {type: "flight", preset: "going-away", focus: "eyes"},
  "double-on-report": {type: "pair", kind: "report"}, "simultaneous-double": {type: "pair", kind: "simultaneous"},
  "rafale-double": {type: "pair", kind: "rafale"}, "double": {type: "pair", kind: "report", also: ["simultaneous", "rafale"]},
  "lead": {type: "lead", method: "maintained", focus: "perceived-vs-actual"}, "perceived-lead": {type: "lead", method: "swing", focus: "perceived-vs-actual"},
  "gun-speed": {type: "lead", method: "maintained", focus: "perceived-vs-actual"},
  "maintained-lead": {type: "lead", method: "maintained"}, "insertion-point": {type: "lead", method: "maintained"},
  "swing-through": {type: "lead", method: "swing"}, "pull-away": {type: "lead", method: "pullaway"}, "ambush": {type: "lead", method: "ambush"},
  "follow-through": {type: "lead", method: "pullaway", focus: "follow-through"},
  "stopping-the-gun": {type: "lead", method: "pullaway", focus: "follow-through", stop: true},
  "miss-behind": {type: "lead", method: "pullaway", focus: "follow-through", stop: true},
  // stand scenes: the call and the release, the Sporting™ ready position, a misfire, the gun mount
  "call": {type: "call", kind: "signal", also: ["manual", "sonopull"]}, "trapper": {type: "call", kind: "signal", also: ["manual"]},
  "sonopull": {type: "call", kind: "sonopull"}, "no-bird": {type: "call", kind: "signal-late"}, "manual-release": {type: "call", kind: "manual"},
  "ready-position": {type: "call", kind: "gun-ready", also: ["gun-early"]}, "jacket-line": {type: "call", kind: "gun-ready", also: ["gun-early"]},
  "gun-position": {type: "call", kind: "gun-ready", also: ["gun-early"]}, "waiting-position": {type: "call", kind: "gun-ready", also: ["gun-early"]},
  "yellow-card": {type: "call", kind: "gun-early"},
  "malfunction": {type: "call", kind: "misfire"},
  "gun-mount": {type: "call", kind: "mount"}, "move-mount-shoot": {type: "call", kind: "mount"},
  // the pattern plate (wave 6, 06.11.2026): the choke terms open on their own choke; light modified has no figure in the lesson
  "choke": {type: "pattern", choke: "ic"}, "pattern": {type: "pattern", choke: "m"}, "pattern-plate": {type: "pattern", choke: "m"},
  "constriction": {type: "pattern", choke: "m"}, "cylinder": {type: "pattern", choke: "cyl"}, "improved-cylinder": {type: "pattern", choke: "ic"},
  "modified": {type: "pattern", choke: "m"}, "improved-modified": {type: "pattern", choke: "im"}, "full-choke": {type: "pattern", choke: "full"},
  // where the shot went (wave 6, 06.11.2026); miss-behind keeps the lead lab (a stopped gun), the other three get the coach's view
  "miss-in-front": {type: "miss", kind: "front", also: ["behind", "over", "under"]}, "miss-over": {type: "miss", kind: "over", also: ["under", "behind", "front"]},
  "miss-under": {type: "miss", kind: "under", also: ["over", "behind", "front"]}, "head-lift": {type: "miss", kind: "over"},
  // ties (wave 6, 06.11.2026): a score table, step by step
  "countback": {type: "ties", kind: "countback", also: ["shoot-off"]}, "shoot-off": {type: "ties", kind: "shoot-off", also: ["countback"]},
  "sudden-death": {type: "ties", kind: "shoot-off"},
  // the stock (wave 6, 06.11.2026): length of pull and cast, two diagrams
  "length-of-pull": {type: "stock", kind: "lop", also: ["cast"]}, "cast": {type: "stock", kind: "cast", also: ["lop"]},
  "gun-fit": {type: "stock", kind: "lop", also: ["cast"]}, "stock": {type: "stock", kind: "lop", also: ["cast"]},
};
/* auto(): mount every <div data-clay-sim='{"type":...}'> or <div data-clay-term="crosser"> on a static page. A term host (the
   glossary) or a host with data-clay-hero gets the hero layout (heading + caption); a data-clay-sim host only the animation.
   Texts: window.CLAYSIMS_TEXT[lang] (docs/shared/sims-text.js, generated from content/academy/ui/<lang>.json), else DEF; term names
   (tabs, the name under a flight): window.CLAYSIMS_TERMS[lang] (same file), else English. A page that called config() keeps its own. */
function auto(){
  const lang = pageLang(), TX = (window.CLAYSIMS_TEXT || {}), TN = (window.CLAYSIMS_TERMS || {});
  if (!CFG._custom) Object.assign(CFG, {t: k => (TX[lang] || {})[k] ?? (TX.en || {})[k],
    term: id => { const x = (TN[lang] || {})[id] || (TN.en || {})[id]; return x ? {en: x[0], local: lang === "en" ? "" : x[1] || ""} : null; }});
  document.querySelectorAll("[data-clay-sim],[data-clay-term]").forEach(el => {
    let sim = null; try { sim = el.dataset.claySim ? JSON.parse(el.dataset.claySim) : TERM_SIMS[el.dataset.clayTerm]; } catch (e) {}
    if (!sim) return;
    if (el.dataset.clayTerm || el.hasAttribute("data-clay-hero")) hero(el, sim); else mount(el, sim); });
}
window.ClaySims = {config: o => Object.assign(CFG, o, {_custom: true}), mount, hero, kind, auto, flightSim, leadLab, pairSim, standSim, patternSim, CHOKES, missSim, MISS, tiesSim, TIES, stockSim, STOCK, stopSims,
  FLIGHTS, PAIRS, SCENES, CALL, TERM_SIMS, NAMES: NAME, TERM_IDS, tabLabel};
/* English pronunciation (window.ClaySpeak): docs/shared/speak.js, the one source since 05.11.2026. The pages that load the
   animations get it inside sims.min.js (minifySims() in scripts/build_academy.mjs puts speak.js in front of this file). */
})();
