/* ClayArena shared simulations — ONE implementation used by several projects:
   the Academy (docs/learn/app/academy.js: lesson animations, Practice games), the FITASC rules trainer (docs/rules/trainer/)
   and the glossary term pages (docs/glossary/<id>/, docs/<lang>/glossary/<id>/, mounted through TERM_SIMS below).
   - flightSim(host, preset, opts): animated target presentation (crosser, incomer, driven, going-away, overhead, quartering,
     teal, chandelle, looper, battue, dropping, rabbit). opts.focus adds a teaching overlay:
       "points" = pick-up point (eyes), hold point (muzzles at the call) and break point; the clay breaks at the break point;
       "stance" = hold point and break point with lines from the stand, labelled "front foot" (to the break point) and "body"
                  (turned back to the hold point);
       "eyes"   = soft focus around the pick-up point, then hard focus on the leading edge of the target.
     Before it plays, the canvas shows a still "poster": the whole flight line dotted and the overlay (for "eyes" both stages:
     soft focus at the pick-up point and hard focus on the target), so a reader who does not play it still sees it.
   - pairSim(host, kind, opts): a pair of targets — report pair, simultaneous pair, rafale (following pair, Sporting™ only).
   - leadLab(host, method, opts): crossing target in slow motion; methods maintained / swing / pullaway / ambush; "watch the method"
     or "your turn"; freeze-frame at the shot with the actual lead in metres and feet. Its still picture (before anything is played,
     and after a change of method, speed or distance) is that freeze-frame of the method: flight line, target, muzzles and lead apart.
     opts.preset: "crosser-rl" = target flies right to left, "rabbit" = target rolls along the ground (default: left to right;
                  a rabbit is slower: 11 m/s by default, 6–18 m/s on the slider; it slows down on the ground, which the lab does
                  not model — simplified physics, see below);
     opts.focus: "perceived-vs-actual" = table of the four methods for the same target, "lead-units" = lead also in target widths,
                 "follow-through" = option to stop the gun at the trigger (opts.stop: true = option on at the start),
                 "mount" = the phase words read “move · mount · shoot” instead of the method's words (kept for old data: the
                 gun-mount lesson now shows the stand scene "mount" below, which draws the shooter, the stock and the cheek).
     The coach's words for the phases of the method are shown in English above the canvas, as the lessons teach them
     (“insert in front · match its speed · shoot · keep moving”, “butt · belly · beak · bang”, “on it · with it · pull away · shoot”);
     the current one is highlighted. They are HTML text, so they stay readable on a phone.
     Teaching physics (simplified; an explanation, not a ballistic calculator): ≈330 m/s average shot speed, 0.15 s from decision
     to shot, effective pattern radius 0.10 m + 1.5 cm per metre of distance, muzzle ≈1 m from the shooter's eye.
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
     the front edge of the stand; downrange the trap, protected inside a trap house behind a screen that faces the stand; a clock.
     Everyone wears safety glasses and ear muffs. SAFETY: nobody is ever drawn in front of the stand, no muzzle ever points at a
     person or the trap house, an unbroken target comes down in the field, not at the stand (see "SAFETY" above SCENES).
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
   Narrow screens: the canvas is 720 px wide and is drawn at about half size on a phone, so every frame measures it (fit()) and
   draws text, label distances and marks (target, crosshair, points) larger by the same factor (text up to ×2.2, marks up to ×1.6);
   the stand scenes with a clock get a band above the scene for a bigger clock. A canvas is never taller than 70 % of the window.
   Languages on the canvas (decision, 10.2026): glossary terms drawn on the canvas (Pick-up point, Hold point, Break point, Soft
   focus, Hard focus) and the coach's phase words stay in English — they are the stand words the course teaches, and the canvas
   has no room for two names; every other word (line, decision, shot, lead, front foot, body, cheek on the comb, the clock, the status
   line, the buttons) is in the page language (ui keys). Tabs show the English stand word of a flight plus its name in the page
   language when the page knows it ("Crosser → · <local>"); pair and scene tabs are in the page language.
   Usage: ClaySims.config({t: key => text, term: id => ({en, local}) | null, onHit: info => {}});   info = {method, v, d}
          ClaySims.mount(host, sim, {autoplay, onAutoplay, onUser, tab, onTab})   sim = {type: "flight", preset, also: [...], pairs: [...], focus}
              | {type: "lead", method, preset, focus, stop} | {type: "pair", kind, also: [...]} | {type: "call", kind, also: [...]}
          ClaySims.hero(host, sim) — the same with a heading ("▶ Watch how the target flies") and a one-line "what to watch" caption
              (ui keys anim_h_<kind> / anim_w_<kind>, kind = ClaySims.kind(sim)); used for the glossary term pages by auto().
   Lesson keys muzzle_start, gun_speed, trigger and follow_through only describe the method in words: the lab takes that behaviour
   from the method itself (see above), so they need no code.
   Text keys (texts from the page; missing keys fall back to the English DEF below): launch, method, m_maintained, m_swing,
   m_pullaway, m_ambush, speed, distance, demo, try, shoot, hit, behind, ahead, no_shot, perceived, actual, at_muzzle, compare,
   how_maintained, how_swing, how_pullaway, how_ambush, stop_gun, clay_widths, lab_note, decision, shot_moment, lead_word,
   unit_m, unit_ft, unit_cm, unit_in, unit_ms, pair_report, pair_sim, pair_rafale, and every key that starts with "anim_".
   The master texts are content/academy/ui/<lang>.json (11 languages); scripts/build_academy.mjs copies them into
   docs/shared/sims-text.js (list SIM_KEYS there) for pages outside the Academy (glossary, rules trainer), together with the names of
   the terms the animations show (window.CLAYSIMS_TERMS = {lang: {id: [en, local]}}).
   In production (ClayArena): keep as one front-end module; texts come from the page's translation strings. */
(function () {
const CFG = {t: () => null, term: () => null, onHit: null, slow: false};
/* Anonymous site statistics (docs/shared/stats.js, loaded by nav.js): lead lab results ("lead") and pronunciation ("speak").
   Never throws; does nothing when the statistics are off. */
const stat = (name, value) => { try { if (window.ClayStats) window.ClayStats.event(name, value); } catch (e) {} };
/* English fallback texts (same as the "en" values in content/academy/ui/en.json). Used when a page has no text for a key yet. */
const DEF = {
  launch: "Launch", method: "Method", m_maintained: "Maintained lead", m_swing: "Swing-through", m_pullaway: "Pull-away", m_ambush: "Ambush",
  speed: "Target speed", distance: "Distance", demo: "Watch the method", try: "Your turn: press when you would shoot", shoot: "Shoot",
  hit: "Hit! The target breaks.", behind: "Behind — the shot passed behind the target", ahead: "In front — the shot passed ahead of the target",
  no_shot: "No shot fired.", perceived: "Lead you see at the decision", actual: "Actual lead at the shot", at_muzzle: "seen at the muzzle",
  compare: "Same target, four methods: the actual lead is the same, the lead you see is not",
  how_maintained: "The muzzles wait in front and the target closes the gap. Press Shoot when the gap looks right: the gun then moves at the target's speed and holds that lead.",
  how_swing: "The muzzles start behind the target and move faster than it. Press Shoot as the muzzles pass the front of the target: the gun keeps gaining during the delay, so the actual lead is bigger.",
  how_pullaway: "The muzzles move with the target first, then accelerate ahead. Press Shoot while the gun is still accelerating: the lead you see is smaller than the actual lead.",
  how_ambush: "The muzzles wait still at a point ahead. Press Shoot before the target reaches that point: the shot needs time, so a shot fired as the target arrives goes behind.",
  stop_gun: "Stop the gun at the trigger (a fault)", clay_widths: "target widths",
  lab_note: "Slow motion, simplified physics for teaching: about 330 m/s average shot speed, 0.15 s from decision to shot, a pattern radius of about 10 cm plus 1.5 cm per metre of distance, the muzzle about 1 m from the eye. The actual lead depends on target speed, distance, angle and cartridge; the lead you see also depends on the method and the shooter.",
  decision: "decision", shot_moment: "shot", lead_word: "lead", unit_m: "m", unit_ft: "ft", unit_cm: "cm", unit_in: "in", unit_ms: "m/s",
  pair_report: "Report pair (on report): the 2nd target is released at the sound of the 1st shot",
  pair_sim: "Simultaneous pair: both targets are released together",
  pair_rafale: "Rafale (following pair): the 2nd target from the same trap, as soon as the trap has reloaded",
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
  anim_unit_s: "s", anim_after_call: "after the call", anim_after_signal: "after the signal", anim_line: "line",
  anim_l_foot: "front foot", anim_l_body: "body", anim_cheek: "cheek on the comb",
  anim_t_signal: "Sporting™: referee's signal", anim_t_late: "Late target", anim_t_manual: "Compak® Sporting: by hand",
  anim_t_sonopull: "Compak® Sporting: sonopull", anim_t_ready: "Ready position", anim_t_early: "Gun up at the call", anim_t_mount: "Gun mount",
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
};
const T = k => { const v = CFG.t(k); return v == null || v === "" ? (DEF[k] ?? k) : v; };
const TERM = id => CFG.term(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]));
const sq = x => x * x;
const lerp = (a, b, k) => a + (b - a) * k, clamp01 = x => Math.max(0, Math.min(1, x)), ease = k => k * k * (3 - 2 * k);
const fill = (s, v) => String(s).replace(/\{(\w+)\}/g, (m, k) => (v[k] != null ? v[k] : m));
const low = s => String(s || "").trim().toLowerCase();
const pageLang = () => { try { return (document.documentElement.lang || "en").slice(0, 2); } catch (e) { return "en"; } };
const num1 = n => { try { return new Intl.NumberFormat(pageLang(), {minimumFractionDigits: 1, maximumFractionDigits: 1}).format(n); } catch (e) { return n.toFixed(1); } };
const RM = () => { try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; } };
let SIMS = [];
function stopSims(){ SIMS.forEach(s => s.stop && s.stop()); SIMS = []; }
const CSS = `.cs-sim{border:1px solid rgba(255,255,255,.1);border-radius:14px;overflow:hidden;background:#06101d;margin:16px 0}
.cs-sim canvas{display:block;width:100%;height:auto;max-height:70vh;object-fit:contain;touch-action:manipulation}
.cs-words{padding:8px 12px 2px;font-size:14px;line-height:1.45;color:#6B7280}.cs-words b{color:#F3F4F6}
.cs-ctl{display:flex;gap:8px 12px;flex-wrap:wrap;align-items:center;padding:10px 12px;border-top:1px solid rgba(255,255,255,.1);font-size:13.5px;color:#D1D5DB}
.cs-ctl label{display:flex;gap:6px;align-items:center}.cs-ctl input[type=range]{width:110px;accent-color:#34D399}.cs-ctl input[type=checkbox]{accent-color:#FB923C}
.cs-ctl select{background:#0B1120;color:#F3F4F6;border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:5px 8px;font:inherit}
.cs-btn{display:inline-flex;align-items:center;gap:6px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);color:#F3F4F6;border-radius:10px;padding:7px 13px;font:inherit;font-size:14px;cursor:pointer}
.cs-btn:hover{border-color:rgba(52,211,153,.5)}.cs-primary{background:#059669;border-color:#059669;color:#fff;font-weight:600}.cs-btn[disabled]{opacity:.45;cursor:default}
.cs-btn:focus-visible{outline:2px solid #34D399;outline-offset:2px}
.cs-play{min-height:44px;padding:9px 20px;font-size:15.5px}.cs-slow{min-height:44px}
.cs-slow[aria-pressed="true"]{border-color:#34D399;color:#34D399;background:rgba(52,211,153,.12)}
.cs-out{padding:0 12px 12px;font-size:14px;color:#D1D5DB}.cs-out:empty{display:none}.cs-note{font-size:12.5px;color:#9CA3AF}.cs-hit{color:#34D399}.cs-miss{color:#FB923C}.cs-muted{color:#9CA3AF}
.cs-say{padding:10px 12px 12px;font-size:14.5px;line-height:1.5;color:#E5E7EB;min-height:3.2em;border-top:1px solid rgba(255,255,255,.06)}
.cs-tabs{display:flex;gap:6px;flex-wrap:wrap;margin:12px 0 -6px}.cs-tabs .cs-btn{min-height:40px}
.cs-hero{margin:14px 0 20px}.cs-hero-h{font-weight:700;font-size:18px;color:#34D399;margin:0 0 4px}.cs-hero-w{font-size:14px;color:#9CA3AF;margin:4px 0 0}
.cs-hero .cs-sim{margin:10px 0 0}
.cs-cmp{overflow-x:auto}.cs-cmp table{border-collapse:collapse;width:100%;font-size:13px;margin-top:6px}.cs-cmp td,.cs-cmp th{padding:4px 6px;border-bottom:1px solid rgba(255,255,255,.1);text-align:left;vertical-align:top}.cs-cmp th{color:#9CA3AF;font-weight:600}
@media print{.cs-ctl,.cs-tabs,.cs-words,.cs-out:not(.cs-cmp){display:none!important}.cs-sim{break-inside:avoid}}`;
if (typeof document !== "undefined" && !document.getElementById("cs-sims-css")) { const st = document.createElement("style"); st.id = "cs-sims-css"; st.textContent = CSS; document.head.appendChild(st); }

/* Readable on narrow screens (audit: on a 375 px phone the 720 px canvas is drawn about 305 px wide, so 12 px labels became about
   5 px). fit(cv, c) runs before every frame: c._fk = canvas pixels per CSS pixel (1 on wide screens, at most 2.2) for text sizes and
   label distances, c._mk = a gentler factor (at most 1.6) for marks: the target, the crosshair, the points. */
function fit(cv, c){ const w = cv.clientWidth, h = cv.clientHeight, k = w > 0 && h > 0 ? Math.max(cv.width / w, cv.height / h) : 1;
  c._fk = Math.max(1, Math.min(2.2, k)); c._mk = Math.max(1, Math.min(1.6, 1 + (k - 1) * .5)); }
const FK = c => c._fk || 1, MK = c => c._mk || 1;
const font = (c, px, weight) => { c.font = `${weight ? weight + " " : ""}${Math.round(px * FK(c))}px system-ui`; };
/* redraw(): called when the canvas changes width (a phone turned, a window resized), so the still picture keeps readable labels */
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
};
function stageBg(c, W, H){
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#0b2540"); g.addColorStop(.75, "#10314a"); g.addColorStop(.76, "#123d2a"); g.addColorStop(1, "#0a2418");
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.fillStyle = "rgba(255,255,255,.06)"; for (let i = 0; i < 7; i++) { c.beginPath(); c.arc((i*173 % W), H*.76, 30 + (i*37 % 50), Math.PI, 0); c.fill(); } // tree line
  c.fillStyle = "#e5e7eb"; c.beginPath(); c.arc(W/2, H - 22, 7, 0, 7); c.fill(); c.fillRect(W/2 - 6, H - 15, 12, 15); // shooter
  c.fillStyle = "rgba(52,211,153,.8)"; font(c, 11); c.textAlign = "center"; c.fillText("▲", W/2, H - 34);
}
function clay(c, x, y, s, f, t = 0){
  c.save(); c.translate(x, y); c.rotate(f.rot ? f.rot(t) : 0); c.fillStyle = "#FB923C"; c.strokeStyle = "#7c2d12"; c.lineWidth = 1;
  const r = 9*s*MK(c), ar = f.ar ? f.ar(t) : f.rabbit ? .55 : .38; c.beginPath(); c.ellipse(0, 0, r, Math.max(1, r*ar), 0, 0, 7); c.fill(); c.stroke(); c.restore();
}
/* broken target: fragments flying apart and falling; k = seconds since the break */
function burst(c, x, y, k){ const m = MK(c); c.fillStyle = "#FB923C"; for (let i = 0; i < 9; i++) { const a = i*.7, r = 6 + k*120; c.fillRect(x + Math.cos(a)*r, y + Math.sin(a)*r*.6 + k*k*60, 4*m, 3*m); } }
function crosshair(c, x, y, color = "#22D3EE"){ const m = MK(c); c.strokeStyle = color; c.lineWidth = 2*m; c.beginPath(); c.arc(x, y, 7*m, 0, 7); c.moveTo(x - 12*m, y); c.lineTo(x + 12*m, y); c.moveTo(x, y - 12*m); c.lineTo(x, y + 12*m); c.stroke(); c.lineWidth = 1; }
function label(c, text, x, y, color, align = "center"){ c.fillStyle = color; font(c, 12); c.textAlign = align; c.fillText(text, x, y); }
const seg = (c, x1, y1, x2, y2) => { c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); };
const dot = (c, x, y, r) => { c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); };
const box = (c, x, y, w, h, r) => { c.beginPath(); if (c.roundRect) c.roundRect(x, y, w, h, r); else c.rect(x, y, w, h); };
/* Term names on the canvas: the English term (the course teaches the English words), from the page's term list if it has one. */
const TERM_EN = {"pick-up-point": "Pick-up point", "hold-point": "Hold point", "break-point": "Break point", "soft-focus": "Soft focus", "hard-focus": "Hard focus"};
const termName = id => (TERM(id) && TERM(id).en) || TERM_EN[id] || id;

/* Teaching overlays of a flight (opts.focus). P(t) = canvas position of the target. Points along the flight: pick-up 0.2,
   hold 0.42 (on or just under the line, between pick-up and break), break 0.62. still = the poster (for "eyes": both stages). */
const PK = .2, HD = .42, BR = .62;
function overlay(c, f, P, t, focus, W, H, still){
  const m = MK(c), k = FK(c);
  if (focus === "points" || focus === "stance") {
    const [bx, by] = P(BR), [hx, hy0] = P(HD), hy = hy0 + 10;
    if (focus === "stance") { // from the stand: the front foot points at the break point, the body winds back to the hold point
      const sx = W/2, sy = H - 34; c.lineWidth = m; c.setLineDash([4, 5]); c.strokeStyle = "rgba(52,211,153,.7)"; seg(c, sx, sy, bx, by);
      c.strokeStyle = "rgba(34,211,238,.6)"; seg(c, sx, sy, hx, hy); c.setLineDash([]); c.lineWidth = 1;
      // what the two lines are (page language): "front foot" beside the line to the break point, "body" beside the line to the hold point
      const right = bx >= hx, at = (x, y) => [sx + (x - sx) * .3, sy + (y - sy) * .3], [fx, fy] = at(bx, by), [gx, gy] = at(hx, hy), d = 8 * k;
      label(c, T("anim_l_foot"), fx + (right ? d : -d), fy, "#34D399", right ? "left" : "right");
      label(c, T("anim_l_body"), gx + (right ? -d : d), gy, "#22D3EE", right ? "right" : "left"); }
    if (focus === "points") { const [ux, uy] = P(PK); // pick-up point: where the eyes first see the target clearly
      c.strokeStyle = "#FBBF24"; c.lineWidth = 1.5*m; c.beginPath(); c.ellipse(ux, uy, 14*m, 8*m, 0, 0, 7); c.stroke(); c.lineWidth = 1;
      c.fillStyle = "#FBBF24"; dot(c, ux, uy, 3.5*m); label(c, termName("pick-up-point"), ux, uy - 8*m - 8*k, "#FBBF24"); }
    c.lineWidth = m; c.setLineDash([3, 3]); c.strokeStyle = "rgba(34,211,238,.9)"; c.beginPath(); c.arc(hx, hy, 10*m, 0, 7); c.stroke(); c.setLineDash([]); c.lineWidth = 1; // hold point: muzzles at the call
    label(c, termName("hold-point"), hx, hy + 10*m + 4 + 12*k, "#22D3EE");
    c.strokeStyle = "#34D399"; c.lineWidth = 2*m; c.beginPath(); for (let i = 0; i < 8; i++) { const a = i*Math.PI/4, r = (i % 2 ? 4 : 10)*m; c.lineTo(bx + Math.cos(a)*r, by + Math.sin(a)*r); } c.closePath(); c.stroke(); c.lineWidth = 1;
    label(c, termName("break-point"), bx, by - 10*m - 8*k, "#34D399");
    // the muzzles wait at the hold point until the eyes have the target, then join its line just in front and go with it to the break point
    const ahead = P(Math.min(1, Math.min(t, BR) + .03)), q = Math.max(0, Math.min(1, (t - PK) / .14));
    const mz = t < PK ? [hx, hy] : t < BR ? [hx + (ahead[0] - hx)*q, hy + (ahead[1] - hy)*q] : P(BR + .03);
    crosshair(c, mz[0], mz[1]);
  }
  if (focus === "eyes") {
    const [ux, uy] = P(PK);
    if (still || t < PK + .05) { c.setLineDash([5, 6]); c.lineWidth = m; c.strokeStyle = "rgba(251,191,36,.8)"; c.beginPath(); c.arc(ux, uy, 46, 0, 7); c.stroke(); c.setLineDash([]); c.lineWidth = 1;
      label(c, termName("soft-focus"), ux, uy - 46 - 8*k, "#FBBF24"); }
    if (still || t >= PK + .05) { const [x, y] = P(t), [x2, y2] = P(Math.min(1, t + .02)), a = Math.atan2(y2 - y, x2 - x), r = 9*f.s(t)*m, ex = x + Math.cos(a)*r, ey = y + Math.sin(a)*r*.4;
      c.strokeStyle = "#FBBF24"; c.lineWidth = 2*m; c.beginPath(); c.arc(ex, ey, 5*m, 0, 7); c.stroke(); c.lineWidth = 1; label(c, termName("hard-focus"), x, y - r - 6 - 8*k, "#FBBF24"); }
  }
}
/* opts: focus, hideName (Practice "Name the flight": no name, no label), autoplay ("now" by default here), onAutoplay, onUser. */
function flightSim(host, preset, opts = {}){
  const f = FLIGHTS[preset] || FLIGHTS["crosser-lr"], focus = opts.focus || "", tm = TERM(f.term);
  const name = tm ? tm.en : NAME[preset] || preset;
  host.innerHTML = `<div class="cs-sim"><canvas width="720" height="380" role="img" aria-label="${esc(opts.hideName ? "" : name)}"></canvas><div class="cs-ctl">${playBtn("launch")}${slowBtn()}
  ${opts.hideName ? "" : `<b>${esc(name)}</b>${tm && tm.local && tm.local !== tm.en ? ` <span class="cs-muted">· ${esc(tm.local)}</span>` : ""}`}</div></div>`;
  const cv = host.querySelector("canvas"), c = cv.getContext("2d"), W = cv.width, H = cv.height; let raf = 0, t0 = 0, dur = 2400;
  const trail = [], P = t => { const [x, y] = f.p(t); return [x*W, y*H]; };
  const brk = focus === "points" || focus === "stance" ? BR : null; // with these overlays the clay is broken at the break point
  const path = (to, a) => { c.strokeStyle = `rgba(251,146,60,${a})`; c.lineWidth = MK(c); c.setLineDash([3, 6]); c.beginPath(); for (let i = 0; i <= 48; i++) { const [x, y] = P(to * i / 48); i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); c.setLineDash([]); c.lineWidth = 1; };
  const frame = ts => { if (!t0) t0 = ts; const t = Math.min(1, (ts - t0) / dur); fit(cv, c);
    stageBg(c, W, H); const tf = brk != null ? Math.min(t, brk) : t, [x, y] = P(tf); if (brk == null || t <= brk) trail.push([x, y]);
    c.strokeStyle = "rgba(251,146,60,.45)"; c.lineWidth = MK(c); c.setLineDash([3, 6]); c.beginPath(); trail.forEach(([a, b], i) => i ? c.lineTo(a, b) : c.moveTo(a, b)); c.stroke(); c.setLineDash([]); c.lineWidth = 1;
    if (focus) overlay(c, f, P, t, focus, W, H);
    if (brk != null && t > brk) burst(c, x, y, (t - brk)*2.4); else clay(c, x, y, f.s(tf), f, tf);
    if (t < 1) raf = requestAnimationFrame(frame); else { raf = 0; setPlay(host, false); } };
  // still picture before it plays: the whole flight line, the target half-way (or at the break point; for "eyes" further on, so the
  // soft-focus and hard-focus labels do not overlap), the overlay labels
  const poster = () => { fit(cv, c); stageBg(c, W, H); const tp = brk != null ? brk : focus === "eyes" ? .7 : .5; path(brk != null ? brk : 1, .35);
    if (focus) overlay(c, f, P, tp, focus, W, H, true); const [x, y] = P(tp); clay(c, x, y, f.s(tp), f, tp); };
  const run = () => { cancelAnimationFrame(raf); t0 = 0; dur = 2400 * slowF(); trail.length = 0; setPlay(host, true); raf = requestAnimationFrame(frame); };
  const halt = () => { cancelAnimationFrame(raf); raf = 0; setPlay(host, false); };
  wire(host, run, null, halt); poster();
  const unwatch = watchSize(cv, () => { if (!raf) poster(); });
  const off = autoStart(host, cv, run, opts.autoplay === undefined ? "now" : opts.autoplay, opts.onAutoplay, opts.onUser);
  const s = {stop: () => { off(); unwatch(); cancelAnimationFrame(raf); raf = 0; }, run}; SIMS.push(s); return s;
}

/* Lead lab: a crossing target at distance d (m) and speed v (m/s), seen side-on. World x in metres (left to right; the drawing is
   mirrored for a right-to-left target). Shot time of flight tf = d / 330; decision-to-shot delay TR = 0.15 s. The shot hits if
   |muzzle(ts) − target(ts + tf)| < R (effective pattern radius). The method gives the muzzle path muzzle(t, td), td = decision time.
   opts.autoplay (default false): "view" / "now" plays "Watch the method" once. Slow motion: the lab runs at 1/4 speed, 1/8 with 🐢.
   "Watch the method" turns into ⏹ stop while the demonstration runs. */
function leadLab(host, method = "maintained", opts = {}){
  if (!opts || typeof opts !== "object") opts = {};
  const TR = .15, EYE = 1, CLAY = .11, METHODS = ["maintained", "swing", "pullaway", "ambush"];
  const norm = m => ({"swing-through": "swing", "pull-away": "pullaway"})[m] || (METHODS.includes(m) ? m : "maintained");
  const rl = /-rl$/.test(opts.preset || ""), rabbit = opts.preset === "rabbit", focus = opts.focus || "";
  const VR = rabbit ? [6, 18, 11] : [10, 25, 17]; // speed slider: min, max, default (m/s); a rabbit rolls slower than a crosser flies
  host.innerHTML = `<div class="cs-sim"><div class="cs-words" lang="en" aria-hidden="true" data-k="words"></div><canvas width="720" height="300" role="img" aria-label="${esc(T("method") + ": " + T("m_" + norm(method)))}"></canvas>
  <div class="cs-ctl"><label>${esc(T("method"))} <select data-k="m">${METHODS.map(m => `<option value="${m}"${m === norm(method) ? " selected" : ""}>${esc(T("m_" + m))}</option>`).join("")}</select></label>
  <label>${esc(T("speed"))} <input data-k="v" type="range" min="${VR[0]}" max="${VR[1]}" value="${VR[2]}"><span data-k="vv"></span></label>
  <label>${esc(T("distance"))} <input data-k="d" type="range" min="15" max="40" value="25"><span data-k="dv"></span></label>
  ${focus === "follow-through" || opts.stop ? `<label><input data-k="stop" type="checkbox"${opts.stop ? " checked" : ""}> ${esc(T("stop_gun"))}</label>` : ""}</div>
  <div class="cs-ctl"><button type="button" class="cs-btn cs-play" data-k="demo">▶ ${esc(T("demo"))}</button><button type="button" class="cs-btn cs-primary cs-play" data-k="try">🎯 ${esc(T("try"))}</button><button type="button" class="cs-btn cs-play" data-k="shoot" disabled>${esc(T("shoot"))}</button>${slowBtn()}</div>
  <div class="cs-out cs-note" data-k="how"></div><div class="cs-out" data-k="out" aria-live="polite"></div>${focus === "perceived-vs-actual" ? `<div class="cs-out cs-cmp" data-k="cmp"></div>` : ""}
  <div class="cs-out cs-note">${esc(T("lab_note"))}</div></div>`;
  const q = k => host.querySelector(`[data-k="${k}"]`), cv = host.querySelector("canvas"), c = cv.getContext("2d"), W = cv.width, H = cv.height;
  const words = wordsBar(q("words"));
  const X0 = -14, X1 = 14, XS = X0 + 1, XD = -3; // the target starts at XS; the planned decision is when it reaches XD (left of centre)
  const px = x => { const u = (x - X0) / (X1 - X0) * W; return rl ? W - u : u; }, TY = rabbit ? H*.8 : H*.42;
  // coach's words for the phases of each method (English, as the lessons teach them); the current one is highlighted
  const WORDS = {maintained: ["insert in front", "match its speed", "shoot", "keep moving"], swing: ["butt", "belly", "beak", "bang"],
    pullaway: ["on it", "with it", "pull away", "shoot"], ambush: ["wait at the point", "shoot"]};
  let raf = 0, mode = "idle", sim = null, pending = null, curT = 0, freeze = false, last = null;
  const val = () => { q("vv").textContent = q("v").value + " " + T("unit_ms"); q("dv").textContent = q("d").value + " " + T("unit_m"); };
  function setup(m, plain){
    m = m || q("m").value;
    const v = +q("v").value, d = +q("d").value, tf = d / 330, L = v * tf, R = .1 + .015 * d;
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
  /* still = the still picture (the method's freeze-frame with the flight line dotted) */
  function draw(t, sh, still){
    last = [t, sh, still, freeze]; fit(cv, c); const m = MK(c), k = FK(c);
    const {tx, mz} = sim, td = sh ? sh.td : Infinity; stageBg(c, W, H);
    if (rabbit) { c.strokeStyle = "rgba(255,255,255,.18)"; seg(c, 0, TY + 9, W, TY + 9); } // ground
    else { c.strokeStyle = "rgba(255,255,255,.12)"; seg(c, 0, TY, W, TY); }
    if (still) { c.strokeStyle = "rgba(251,146,60,.45)"; c.lineWidth = m; c.setLineDash([3, 6]); seg(c, 0, TY, W, TY); c.setLineDash([]); c.lineWidth = 1; } // the target's line
    for (let x = -12; x <= 12; x += 2) { c.fillStyle = "rgba(255,255,255,.25)"; c.fillRect(px(x), TY + (rabbit ? 14 : 26), 1, 6); } // 1 tick = 2 m
    const xT = tx(t), xM = mz(t, td);
    c.strokeStyle = "rgba(34,211,238,.35)"; seg(c, W/2, H - 20, px(xM), TY); // gun line
    if (sh && sh.hit && t > sh.ti) burst(c, px(sh.xI), TY, t - sh.ti); else clay(c, px(xT), TY, 1, rabbit ? {rabbit: 1} : {});
    crosshair(c, px(xM), TY);
    if (sh && t >= sh.td) { // decision point marker (where the muzzle was when the shooter decided)
      const xd = px(mz(sh.td, sh.td)), yc = TY - 12*m; c.strokeStyle = "rgba(251,191,36,.9)"; c.lineWidth = m;
      c.beginPath(); c.moveTo(xd, yc - 6*m); c.lineTo(xd + 6*m, yc); c.lineTo(xd, yc + 6*m); c.lineTo(xd - 6*m, yc); c.closePath(); c.stroke(); c.lineWidth = 1;
      label(c, T("decision"), xd, yc - 6*m - 4, "rgba(251,191,36,.9)"); }
    if (sh && freeze) { // frozen at the moment of the shot: bracket = actual lead between the clay and the muzzle
      const a = px(tx(sh.ts)), b = px(sh.xM), y = rabbit ? TY - 18*m - 26*k - 26 : TY + 26 + 18*m; c.strokeStyle = "#34D399"; c.lineWidth = 2;
      c.beginPath(); c.moveTo(a, y - 6); c.lineTo(a, y + 6); c.moveTo(a, y); c.lineTo(b, y); c.moveTo(b, y - 6); c.lineTo(b, y + 6); c.stroke(); c.lineWidth = 1;
      c.fillStyle = "#34D399"; font(c, 13, "bold"); c.textAlign = "center";
      c.fillText(`${T("lead_word")} ${num1(sh.actual)} ${T("unit_m")} · ${num1(sh.actual * 3.281)} ${T("unit_ft")}`, (a + b) / 2, rabbit ? y - 10*k : y + 20*k);
      label(c, T("shot_moment"), b, TY - 18*m - 8 - 14*k, "#e5e7eb"); }
    if (sh && t >= sh.ts) { const u = Math.min(1, (t - sh.ts) / sim.tf); // shot cloud travelling to the aim point
      c.fillStyle = "rgba(229,231,235,.55)"; dot(c, W/2 + (px(sh.xM) - W/2)*u, (H - 20) + (TY - (H - 20))*u, 3 + sim.R / (X1 - X0) * W * u); }
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
    const rows = METHODS.map(m => { const s = setup(m, true), sh = shotAt(s, s.auto); return `<tr><td>${esc(T("m_" + m))}</td><td>${r1(sh.perceived)} ${esc(T("unit_m"))}</td><td>${esc(atMuzzle(sh.perceived, s.d))}</td><td>${r1(sh.actual)} ${esc(T("unit_m"))}</td></tr>`; });
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
  report:       {a: "crosser-lr", b: "incomer", delay: .45, label: "pair_report", bang: true},
  simultaneous: {a: "crosser-lr", b: "quartering-away", delay: 0, label: "pair_sim"},
  rafale:       {a: "crosser-lr", b: "crosser-lr", delay: .5, label: "pair_rafale"},
};
function pairSim(host, kind, opts = {}){
  const P = PAIRS[kind] || PAIRS.report, fa = FLIGHTS[P.a], fb = FLIGHTS[P.b];
  host.innerHTML = `<div class="cs-sim"><canvas width="720" height="380" role="img" aria-label="${esc(pairName(kind))}"></canvas><div class="cs-ctl">${playBtn("launch")}${slowBtn()}<b>${esc(T(P.label))}</b></div></div>`;
  const cv = host.querySelector("canvas"), c = cv.getContext("2d"), W = cv.width, H = cv.height; let raf = 0, t0 = 0, dur = 2400;
  const draw = t => { fit(cv, c); stageBg(c, W, H);
    const ta = Math.min(1, t), tb = Math.min(1, Math.max(0, t - P.delay));
    if (P.bang && t >= P.delay) { const [x, y] = fa.p(P.delay); if (t < P.delay + .35) burst(c, x*W, y*H, (t - P.delay)*2.4); } // 1st target shot at the BANG
    else if (ta < 1) { const [x, y] = fa.p(ta); clay(c, x*W, y*H, fa.s(ta), fa, ta); }
    if (t >= P.delay && tb < 1) { const [x, y] = fb.p(tb); clay(c, x*W, y*H, fb.s(tb), fb, tb); }
    if (P.bang && t >= P.delay - .02 && t < P.delay + .1) { c.fillStyle = "rgba(255,255,255,.85)"; font(c, 16, "bold"); c.textAlign = "center"; c.fillText("BANG", W/2, H - 50); } };
  const frame = ts => { if (!t0) t0 = ts; const t = (ts - t0) / dur; draw(t); if (t < 1 + P.delay) raf = requestAnimationFrame(frame); else { raf = 0; setPlay(host, false); } };
  // still picture before it plays: both flight lines dotted, the first target near its start
  const poster = () => { fit(cv, c); stageBg(c, W, H); c.strokeStyle = "rgba(251,146,60,.35)"; c.lineWidth = MK(c); c.setLineDash([3, 6]);
    for (const f of [fa, fb]) { c.beginPath(); for (let i = 0; i <= 40; i++) { const [x, y] = f.p(i / 40); i ? c.lineTo(x*W, y*H) : c.moveTo(x*W, y*H); } c.stroke(); }
    c.setLineDash([]); c.lineWidth = 1; const [x, y] = fa.p(.2); clay(c, x*W, y*H, fa.s(.2), fa, .2); };
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
   misfire the referee walks up from behind, never past the muzzles), the trapper behind the referee. Downrange there are only
   things: the trap inside a trap house behind a solid screen that faces the stand (trapHouse(); nobody is drawn there) and the flying
   target. The trapper releases the target with a hand-held release button; its cable runs along the ground to the trap house, and
   the release is drawn as a pulse running along that cable (releaseLine()). In Sporting™ the referee's sound signal goes BACK to
   the trapper behind the stand. A sonopull (Compak® Sporting) is released by the microphone on the stand, at its front edge (MIC_X);
   no trapper is drawn. The muzzles point only down the range: up at the target, or down to the ground in front of the stand after a
   misfire (SAFE, ground at x ≈ 487, short of the trap house) — never at a person. They never wait, hold or mount onto the trap
   house: with the gun up (Compak® Sporting) they wait at the hold point and only join the target once it has climbed to the hold
   height (pose()). The only moment the barrel line crosses the (screened, empty) trap house is the ≈ 0.08 s sweep while the gun is
   lowered after a misfire, from the target down to the ground in front. An unbroken target comes down in the field in front of
   the stand (TP), never at the shooter. Everyone wears safety glasses and ear muffs (protection()). Real grounds differ (a release
   console beside the referee, wireless remote controls, a loader sheltering inside the trap house between rounds); the scenes show
   one common safe layout and make no rule claim about it. The scene timings are not affected: the button is pressed at pressT
   (≤ 0.25 s before the release, after the signal) and the target leaves at "release".
   Keep these true when a scene, a pose or TP changes (checked frame by frame, every 1/60 s of every scene, 08.10.2026): every
   person stands at x < BEHIND_X; the barrel line beyond the muzzle never crosses a person, and crosses the trap house only during
   that lowering sweep; with the gun up the barrels point up from the start to the shot; the target never enters the stand. */
const CALL = {limit: 3, sonopull: .5};
const SCENES = {
  signal:        {tab: "anim_t_signal",   timer: "signal", line: 1, call: .3, signal: .7, release: 1.7, mount: [1.82, 2.15], shot: 2.5, end: 4.4},
  "signal-late": {tab: "anim_t_late",     timer: "signal", line: 1, call: .3, signal: .7, release: .7 + 3.6, nobird: 4.5, end: 7},
  manual:        {tab: "anim_t_manual",   timer: "call", up: 1, call: .3, release: 1.7, shot: 2.45, end: 4.4},
  sonopull:      {tab: "anim_t_sonopull", timer: "call", up: 1, mic: 1, call: .3, release: .3 + CALL.sonopull, shot: 1.5, end: 3.6},
  "gun-ready":   {tab: "anim_t_ready",    line: 1, call: .9, signal: 1.1, release: 1.5, mount: [1.62, 1.95], shot: 2.3, end: 4.3},
  "gun-early":   {tab: "anim_t_early",    line: 1, mount: [.4, .75], call: 1.2, card: 1.7, end: 4},
  misfire:       {tab: null,              call: .4, release: 1, mount: [1.1, 1.45], shot: 1.85, click: 1, safe: [2.2, 2.6], walk: [3.3, 4.3], end: 6.8},
  mount:         {tab: "anim_t_mount",    words: 1, cheek: 1, call: .3, release: .8, move: [1, 1.4], mount: [1.3, 1.85], shot: 1.9, end: 3.8},
};
const GY = 322, LINE_Y = 203, FLY = 2.2, SH = 380; // SH = scene height; narrow screens get a band for the clock above it
// SAFETY layout (see above): people only left of BEHIND_X (the shooter's back heel is at x ≈ 150, the stand starts at 126); the
// referee stands at REF_X (walks up to 128 after a misfire), the trapper at TRAPPER_X; MIC_X = the sonopull microphone, on the stand
// at its front edge (the stand is x 126–222; audit 08.10.2026: it stood in front of the stand); TH_X = the screen of the trap house
const BEHIND_X = 130, REF_X = 84, TRAPPER_X = 32, MIC_X = 212, TH_X = 582;
// target path from the trap (u = 0…1 over FLY s): it leaves over the screen of the trap house (TH_X…TH_X + 20, top at y 266; at its
// back edge, x 602, the target is ≈ 33 px above it), climbs to the apex (≈ 513, 110) and, if nobody breaks it, comes down on the
// ground in the field in front of the stand (u = 1 → x 392, y GY). SAFETY: an unbroken target never flies at the shooter or the stand
// (audit 08.10.2026: the old path ended at chest height just past the muzzles). Shots of the scenes (u at the shot): signal and
// gun-ready .364 → (542, 125), manual .341 → (548, 131), mount .5 → (510, 110), sonopull .318 → (553, 138), all in the sky.
const TP = u => [628 - 236 * u, 298 - 200 * Math.sin(Math.PI * u) + 24 * u];
// gun poses: LOW = Sporting™ ready position (stock low, muzzles up), SAFE = lowered after a misfire (closed, muzzles down the range to
// the ground at x ≈ 487, in front of the stand and short of the trap house), AIM0 = the hold point (muzzles at the call)
const LOW = {hx: 190, hy: 214, th: -.42}, SAFE = {hx: 192, hy: 204, th: .38}, AIM0 = [520, 150];
const READY = {hx: 190, hy: 214, th: -.15}; // gun-mount scene: heel low, muzzles near the line where the target will come
const upPose = (ax, ay) => ({hx: 190, hy: 186, th: Math.atan2(ay - 186, ax - 190)});
const mixPose = (a, b, k) => ({hx: lerp(a.hx, b.hx, k), hy: lerp(a.hy, b.hy, k), th: lerp(a.th, b.th, k)});
function sideBg(c, W, H){
  const g = c.createLinearGradient(0, 0, 0, GY); g.addColorStop(0, "#0b2540"); g.addColorStop(1, "#163a52"); c.fillStyle = g; c.fillRect(0, 0, W, GY);
  c.fillStyle = "rgba(255,255,255,.05)"; for (let i = 0; i < 9; i++) { c.beginPath(); c.arc(40 + i * 85, GY - 4, 24 + (i * 37 % 30), Math.PI, 0); c.fill(); } // tree line
  const gg = c.createLinearGradient(0, GY, 0, H); gg.addColorStop(0, "#14532d"); gg.addColorStop(1, "#0a2418"); c.fillStyle = gg; c.fillRect(0, GY, W, H - GY);
  c.fillStyle = "rgba(255,255,255,.12)"; c.fillRect(126, GY, 96, 5); // the shooting stand
}
/* protection(c, x, y, r): the protection every person in a stand scene wears — compulsory for shooters, referees, staff and anyone
   on or near the stand (lessons gear-ear-protection, gear-shooting-glasses; audit 08.10.2026: the shooter had a black ear dot that
   read as an eye, the referee and the trapper wore nothing). Drawn on a head (centre x, y, radius r) that faces right, down the
   range: ear muffs = a band over the head and a cup over the ear; safety glasses = a tinted lens in front of the eye, its arm to the
   ear. Scales with r, so the shooter (r 13) and the people behind the stand (r ≈ 9–10) look the same. */
function protection(c, x, y, r){
  c.lineCap = "round"; c.strokeStyle = "#111827"; c.lineWidth = Math.max(2, r * .24);
  c.beginPath(); c.arc(x, y, r, Math.PI * 1.15, Math.PI * 1.75); c.stroke(); // the band over the head
  c.fillStyle = "#111827"; box(c, x - r * .7, y - r * .46, r * .78, r * 1.08, r * .3); c.fill(); // the cup over the ear
  c.lineWidth = Math.max(1, r * .12); seg(c, x + r * .08, y - r * .23, x + r * .55, y - r * .3); // the arm of the glasses
  c.fillStyle = "#38BDF8"; box(c, x + r * .53, y - r * .62, r * .62, r * .54, r * .15); c.fill(); // the tinted lens
  c.lineCap = "butt"; c.lineWidth = 1;
}
/* person(c, x, o): a person BEHIND the stand (the referee, the trapper) standing on the ground at x, facing the range, with safety
   glasses and ear muffs (protection()); o.hand = [x, y] of the right hand (returned). Safety net: a person is never drawn in front
   of the stand — x right of BEHIND_X is moved back to BEHIND_X and a console warning tells the developer that the scene is wrong. */
function person(c, x, o = {}){
  if (x > BEHIND_X) { if (!person.warned) { person.warned = 1; try { console.warn("ClaySims: a person was placed in front of the stand (x " + x + "); drawn behind the shooter instead"); } catch (e) {} }
    const d = BEHIND_X - x; x = BEHIND_X; if (o.hand) o = Object.assign({}, o, {hand: [o.hand[0] + d, o.hand[1]]}); }
  const s = o.s || 1, top = GY - 160 * s;
  c.strokeStyle = o.col; c.fillStyle = o.col; c.lineCap = "round"; c.lineWidth = 5 * s;
  seg(c, x, top + 22 * s, x, top + 90 * s); seg(c, x, top + 90 * s, x - 11 * s, GY); seg(c, x, top + 90 * s, x + 11 * s, GY);
  const hand = o.hand || [x + 16 * s, top + 70 * s]; seg(c, x, top + 34 * s, hand[0], hand[1]); seg(c, x, top + 34 * s, x - 9 * s, top + 70 * s);
  dot(c, x, top + 10 * s, 11 * s); if (o.cap) { c.fillStyle = o.cap; c.fillRect(x - 12 * s, top - 3 * s, 23 * s, 6 * s); }
  protection(c, x, top + 10 * s, 11 * s); // glasses and ear muffs (over the cap: the band of the muffs goes over it)
  c.lineCap = "butt"; c.lineWidth = 1; return hand;
}
/* trapHouse(c, fire): the trap downrange, protected, seen from the side: a solid screen facing the stand (higher than the trap; the
   target leaves over it), behind it the trap and a low roof and back wall (the throwing side stays open). The trap letter is on a
   plate on the screen. fire = true at the release: the throwing arm swings and flashes. Nobody is drawn here. */
function trapHouse(c, fire){
  c.fillStyle = "#1F2937"; c.fillRect(TH_X + 16, 296, 98, GY - 296); // the low side wall of the house, behind the screen
  c.fillStyle = "#4B5563"; c.fillRect(TH_X + 64, 282, 50, GY - 282); c.fillStyle = "#6B7280"; c.fillRect(TH_X + 60, 277, 58, 6); // back room, its roof
  c.fillStyle = "#374151"; box(c, 610, 306, 32, 16, 3); c.fill(); // the trap
  c.strokeStyle = fire ? "#FDE68A" : "#9CA3AF"; c.lineWidth = 3; c.lineCap = "round"; seg(c, 628, 306, fire ? 616 : 642, fire ? 298 : 302); c.lineCap = "butt"; // its throwing arm
  c.fillStyle = "#6B7280"; box(c, TH_X, 266, 20, GY - 266, 2); c.fill(); // the screen facing the stand (the target clears its top by ≈ 33 px, see TP)
  for (let i = 0; i < 4; i++) { c.fillStyle = i % 2 ? "#111827" : "#FBBF24"; c.fillRect(TH_X + i * 5, 266, 5, 5); } // its warning top band
  c.strokeStyle = "rgba(17,24,39,.45)"; c.lineWidth = 1; for (let y = 281; y < GY - 3; y += 10) seg(c, TH_X + 2, y, TH_X + 18, y); // its boards
  c.fillStyle = "#E5E7EB"; box(c, TH_X + 4, 285, 12, 15, 2); c.fill(); c.fillStyle = "#111827"; c.font = "bold 11px system-ui"; c.textAlign = "center"; c.fillText("A", TH_X + 10, 297); // trap letter
}
/* releaseLine(c, x, y, p): the cable of a release device (the trapper's button, the sonopull microphone) from (x, y) down to the
   ground and along it, under the stand, to the trap house. p = null (idle, dim) or 0…1 = how far the release pulse has run (1 = it
   has reached the trap house and the target leaves); the part it has run is lit, its head is a bright dot. */
function releaseLine(c, x, y, p){
  const pts = [[x, y], [x + 6, GY + 7], [TH_X + 8, GY + 7]], tot = pts.reduce((a, q, i) => i ? a + Math.hypot(q[0] - pts[i - 1][0], q[1] - pts[i - 1][1]) : 0, 0);
  const trace = d => { c.beginPath(); c.moveTo(x, y); let at = pts[0];
    for (let i = 1; i < pts.length && d > 0; i++) { const a = pts[i - 1], b = pts[i], L = Math.hypot(b[0] - a[0], b[1] - a[1]), k = Math.min(1, d / L);
      at = [lerp(a[0], b[0], k), lerp(a[1], b[1], k)]; c.lineTo(at[0], at[1]); d -= L; }
    c.stroke(); return at; };
  c.lineWidth = 1.5; c.strokeStyle = "rgba(255,255,255,.25)"; c.setLineDash([5, 5]); trace(tot); c.setLineDash([]);
  if (p != null) { c.strokeStyle = "#34D399"; c.lineWidth = 2.5; const h = trace(p * tot); if (p < 1) { c.fillStyle = "#ECFDF5"; dot(c, h[0], h[1], 4 * MK(c)); } }
  c.lineWidth = 1;
}
function shooter(c, g, line){ // g = gun pose {hx, hy, th} (heel of the stock, angle); line: null | "ok" | "bad"; returns the muzzle
  c.lineCap = "round"; c.strokeStyle = "#9CA3AF"; c.lineWidth = 8; seg(c, 168, 240, 150, GY); seg(c, 175, 240, 196, GY); // legs
  c.fillStyle = "#4B5563"; box(c, 156, 174, 32, 70, 8); c.fill(); // vest
  if (line) { c.strokeStyle = line === "bad" ? "#F87171" : "#FBBF24"; c.lineWidth = 3; seg(c, 150, LINE_Y, 194, LINE_Y);
    label(c, T("anim_line"), 146, LINE_Y + 4 * FK(c), line === "bad" ? "#F87171" : "#FBBF24", "right"); }
  c.fillStyle = "#E5E7EB"; dot(c, 176, 158, 13); protection(c, 176, 158, 13); // head with safety glasses and ear muffs
  const ux = Math.cos(g.th), uy = Math.sin(g.th);
  c.lineCap = "butt"; c.strokeStyle = "#A16207"; c.lineWidth = 8; seg(c, g.hx, g.hy, g.hx + 36 * ux, g.hy + 36 * uy); // stock
  c.strokeStyle = "#CBD5E1"; c.lineWidth = 4; seg(c, g.hx + 34 * ux, g.hy + 34 * uy, g.hx + 120 * ux, g.hy + 120 * uy); // barrels
  c.lineCap = "round"; c.strokeStyle = "#E5E7EB"; c.lineWidth = 6;
  seg(c, 176, 182, g.hx + 30 * ux, g.hy + 30 * uy + 4); seg(c, 172, 184, g.hx + 74 * ux, g.hy + 74 * uy + 4); // arms
  c.lineCap = "butt"; c.lineWidth = 1; return [g.hx + 120 * ux, g.hy + 120 * uy];
}
function bubble(c, x, y, text, o = {}){ // speech bubble whose tail points down at (x, y + 10)
  const k = FK(c), fs = (o.size || 16) * k; c.font = `bold ${Math.round(fs)}px system-ui`; const w = c.measureText(text).width + 20 * k, h = fs + 14 * k;
  c.fillStyle = o.bg || "#F3F4F6"; box(c, x - w / 2, y - h, w, h, 9 * k); c.fill();
  c.beginPath(); c.moveTo(x - 6 * k, y - 1); c.lineTo(x + 6 * k, y - 1); c.lineTo(x, y + 10); c.closePath(); c.fill();
  c.fillStyle = o.fg || "#0B1120"; c.textAlign = "center"; c.fillText(text, x, y - 9 * k);
}
function clock(c, v, sub, state, s = 1){ // the release clock at the top left, drawn s times bigger; v seconds since the call / signal; state: "run" | "ok" | "late"
  const us = T("anim_unit_s"); c.save(); c.translate(14, 12); c.scale(s, s);
  c.fillStyle = "rgba(3,7,18,.75)"; box(c, 0, 0, 316, 72, 10); c.fill();
  c.fillStyle = state === "late" ? "#F87171" : state === "ok" ? "#34D399" : "#F3F4F6"; c.font = "bold 30px system-ui"; c.textAlign = "left";
  c.fillText(`${num1(v)} ${us}`, 12, 38); c.font = "12.5px system-ui"; c.fillStyle = "#9CA3AF"; c.fillText(sub, 12, 60);
  const x0 = 148, x1 = 304, k = (x1 - x0) / 4.5, y = 20;
  c.fillStyle = "rgba(52,211,153,.4)"; c.fillRect(x0, y, CALL.limit * k, 10); c.fillStyle = "rgba(248,113,113,.4)"; c.fillRect(x0 + CALL.limit * k, y, (4.5 - CALL.limit) * k, 10);
  c.fillStyle = "#F3F4F6"; c.fillRect(x0 + Math.min(4.5, v) * k - 1.5, y - 5, 3, 20);
  c.fillStyle = "#9CA3AF"; c.font = "11px system-ui"; c.textAlign = "center"; c.fillText("0", x0, y + 27); c.fillText(`${CALL.limit} ${us}`, x0 + CALL.limit * k, y + 27);
  c.restore();
}
/* standSim(host, kind, opts): one stand scene (SCENES). Drawn back to front: sky and ground, the release cable on the ground, the
   trap house, the sonopull microphone (front edge of the stand), the target, the trapper (behind the referee), the referee with the
   sound signal back to the trapper / the yellow card / “No Bird!”, the shooter, the call, the shot; then the clock. People only
   behind the shooter, and everyone (shooter, referee, trapper) wears safety glasses and ear muffs (SAFETY above SCENES). */
function standSim(host, kind, opts = {}){
  const sc = SCENES[kind] || SCENES.signal, title = T(sc.tab || "anim_h_misfire");
  host.innerHTML = `<div class="cs-sim">${sc.words ? `<div class="cs-words" lang="en" aria-hidden="true" data-k="words"></div>` : ""}<canvas width="720" height="${SH}" role="img" aria-label="${esc(title)}"></canvas><div class="cs-ctl">${playBtn("anim_play")}${slowBtn()}<b>${esc(title)}</b></div><div class="cs-say" aria-live="polite" data-k="say"></div></div>`;
  const cv = host.querySelector("canvas"), c = cv.getContext("2d"), W = cv.width, out = host.querySelector('[data-k="say"]');
  const words = sc.words ? wordsBar(host.querySelector('[data-k="words"]')) : null;
  const rel = sc.release, t0c = sc.timer === "signal" ? sc.signal : sc.call, hitT = sc.shot != null && !sc.click ? sc.shot : null;
  // the trapper presses the release button at pressT: after the referee's signal (or the call), at most 0.25 s before the release;
  // the pulse runs along the cable from pressT and reaches the trap house at the release (the scene times are unchanged)
  const pressT = rel == null ? null : Math.max(rel - .25, sc.signal != null ? sc.signal + .15 : -1, sc.call != null ? sc.call + .05 : -1);
  const pulse = (t, from) => (t >= from && t < rel + .3 ? clamp01((t - from) / Math.max(.05, rel - from)) : null);
  const TR_HAND = [TRAPPER_X + 15, GY - 86]; // the trapper's hand with the release button
  // narrow screen: a band above the scene for a clock drawn ck times bigger (over the sky it would hide the target and the "Pull!")
  let band = 0, ck = 1;
  const layout = () => { const w = cv.clientWidth, k = w > 0 ? W / w : 1; ck = Math.max(1, Math.min(1.9, k * .95));
    const b = sc.timer && k > 1.35 ? Math.ceil(12 + 72 * ck + 10) : 0; if (b !== band) { band = b; cv.height = SH + band; } };
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
  let lastT = 0;
  const draw = t => {
    lastT = t; fit(cv, c); const m = MK(c), k = FK(c);
    c.setTransform(1, 0, 0, 1, 0, 0); if (band) { c.fillStyle = "#0b2540"; c.fillRect(0, 0, W, band); c.translate(0, band); }
    sideBg(c, W, SH);
    // the release cable on the ground (from the sonopull microphone, or from the trapper's button), then the trap house over its end;
    // nobody downrange: the trapper stands behind the referee (below), the trap is protected by the screen of the trap house
    const pr = rel == null ? null : sc.mic ? pulse(t, rel - .15) : pulse(t, pressT);
    if (sc.mic) releaseLine(c, MIC_X, GY, pr); else releaseLine(c, TR_HAND[0] + 1, TR_HAND[1] + 6, pr);
    trapHouse(c, rel != null && t >= rel && t < rel + .12);
    if (sc.mic) { const on = t >= sc.call && t < rel + .2; // the sonopull microphone on a low post at the front edge of the stand (on the stand, never downrange): it hears the call
      c.strokeStyle = "#9CA3AF"; c.lineWidth = 2; seg(c, MIC_X, GY, MIC_X, 252); c.lineWidth = 1; c.fillStyle = on ? "#34D399" : "#9CA3AF"; dot(c, MIC_X, 246, 6); }
    // the target: in the air, broken by the shot, or (after a click) flying on unbroken
    if (rel != null && t >= rel) { const u = (t - rel) / FLY;
      if (hitT != null && t >= hitT) { if (t < hitT + .9) { const [x, y] = TP((hitT - rel) / FLY); burst(c, x, y, (t - hitT) * .8); } }
      else if (u <= 1) { const [x, y] = TP(u); clay(c, x, y, .75, {}, 0); } }
    // the trapper (not with a sonopull): behind the referee, out of every line of fire, with the hand-held release button; it lights
    // while pressed, and the pulse runs along the cable to the trap house (drawn above)
    if (!sc.mic) { const h = person(c, TRAPPER_X, {s: .8, col: "#9CA3AF", hand: TR_HAND});
      c.fillStyle = "#111827"; box(c, h[0] - 4 * m, h[1] - 9 * m, 10 * m, 15 * m, 2); c.fill(); c.fillStyle = pr != null ? "#34D399" : "#6B7280"; dot(c, h[0] + m, h[1] - 4 * m, 2.8 * m); }
    // referee: behind the shooter; walks up from behind after a misfire (never past the muzzles); gives the sound signal back to the
    // trapper; raises the yellow card
    const rx = sc.walk ? lerp(REF_X, 128, ease(clamp01((t - sc.walk[0]) / (sc.walk[1] - sc.walk[0])))) : REF_X;
    const sig = sc.signal != null && t >= sc.signal && t < sc.signal + .6, card = sc.card != null && t >= sc.card;
    const hand = person(c, rx, {s: .92, col: "#93C5FD", cap: "#1D4ED8", hand: card ? [rx + 12, GY - 176] : sig ? [rx - 18, GY - 122] : null});
    if (card) { c.fillStyle = "#FACC15"; c.fillRect(hand[0] - 6, hand[1] - 26, 14, 20); bubble(c, rx - 4, GY - 196, "!", {bg: "#FEF3C7"}); }
    if (sig) { const q = t - sc.signal, ear = [TRAPPER_X + 5, GY - 120]; c.strokeStyle = "rgba(34,211,238,.9)"; c.lineWidth = 2; // sound signal back to the trapper
      c.fillStyle = "#111827"; dot(c, hand[0], hand[1], 4); // the signal device in the referee's hand
      for (let i = 0; i < 3; i++) { const r = 7 + ((q * 60 + i * 8) % 24); c.beginPath(); c.arc(hand[0], hand[1], r, Math.PI - .7, Math.PI + .7); c.stroke(); }
      c.lineWidth = 1; c.setLineDash([4, 5]); const p = clamp01(q / .2); seg(c, hand[0], hand[1], lerp(hand[0], ear[0], p), lerp(hand[1], ear[1], p)); c.setLineDash([]);
      label(c, "♪", hand[0] - 10, hand[1] - 22, "#22D3EE"); }
    if (sc.nobird != null && t >= sc.nobird) bubble(c, rx + 6, GY - 186, "No Bird!", {bg: "#FEE2E2", fg: "#7F1D1D"});
    // the shooter and the line on the vest: red while the heel of the stock is above it BEFORE the target is out (the mount after the
    // release is correct, so the line turns amber again), the call, the shot
    const g = pose(t), early = g.hy < LINE_Y && (rel == null || t < rel), muzzle = shooter(c, g, sc.line ? (early ? "bad" : "ok") : null);
    if (sc.call != null && t >= sc.call && t < sc.call + .9) bubble(c, 196, 128, "Pull!");
    if (sc.mic && t >= sc.call && t < rel) { c.strokeStyle = "rgba(52,211,153,.8)"; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(206, 166, 10 + i * 8, .2, 1.2); c.stroke(); } } // the call heard by the microphone
    if (hitT != null && t >= hitT && t < hitT + .09) { c.fillStyle = "#FDE68A"; dot(c, muzzle[0], muzzle[1], 9); }
    // gun-mount scene: when the mount is finished, the cheek rests on the comb (the top edge of the stock) and the head is still
    if (sc.cheek && t >= sc.mount[1] - .05) { c.strokeStyle = "#FBBF24"; c.lineWidth = 2 * m; c.beginPath(); c.arc(190, 172, 7 * m, 0, 7); c.stroke(); c.lineWidth = 1;
      label(c, T("anim_cheek"), 150, 145 - 8 - 4 * k, "#FBBF24", "left"); }
    c.setTransform(1, 0, 0, 1, 0, 0);
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
  const off = autoStart(host, cv, run, opts.autoplay === undefined ? "now" : opts.autoplay, opts.onAutoplay, opts.onUser);
  const s = {stop: () => { off(); unwatch(); cancelAnimationFrame(raf); raf = 0; }, run}; SIMS.push(s); return s;
}

/* Tab label of a preset: the English term (the stand word, as the course teaches it) + direction arrow for left/right variants, and
   the term's name in the page language when the page knows it and it differs ("Crosser → · <local>"); of a pair: its name in the page
   language (the text before the colon of its description, e.g. "Report pair (on report)"). */
const DIR = {"crosser-lr": "→", "crosser-rl": "←"};
const NAME = {"crosser-lr": "Crosser", "crosser-rl": "Crosser", "incomer": "Incomer", "driven": "Driven target", "going-away": "Going away", "overhead": "Overhead",
  "quartering-away": "Quartering away", "quartering-towards": "Quartering towards", "teal": "Teal", "chandelle": "Chandelle", "looper": "Looper", "battue": "Battue",
  "dropping": "Dropping target", "rabbit": "Rabbit"};
const tabLabel = p => { const t = TERM(FLIGHTS[p].term), en = t ? t.en : NAME[p] || p, loc = t && t.local && low(t.local) !== low(en) ? t.local : "";
  return `${en}${DIR[p] ? " " + DIR[p] : ""}${loc ? " · " + loc : ""}`; };
const pairName = k => String(T((PAIRS[k] || PAIRS.report).label)).split(/\s*:\s+/)[0];
/* mount(host, sim, o): sim = {type: "flight", preset, also: [...], pairs: [...], focus} | {type: "lead", method, preset, focus, stop}
   | {type: "pair", kind, also: [...]} | {type: "call", kind, also: [...]}. Several presets, pairs or scenes get one tab each.
   o.autoplay: "view" (default) | "now" | false; o.onAutoplay(): called once when it played by itself (the Academy remembers it, so a
   re-render does not play it again); o.onUser(): called once when the reader acted inside it before it played by itself (the
   Academy remembers that too); o.tab: the tab to open ("f:<preset>", "p:<pair>", "c:<scene>"); o.onTab(tab) when the reader picks one. */
function mount(host, sim, o = {}){ if (!host || !sim) return;
  const ap = o.autoplay === undefined ? "view" : o.autoplay, done = o.onAutoplay, onUser = o.onUser;
  if (sim.type === "lead") return leadLab(host, sim.method, Object.assign({}, sim, {autoplay: ap, onAutoplay: done, onUser}));
  let tabs;
  if (sim.type === "flight") tabs = [...[sim.preset, ...(sim.also || [])].filter(p => FLIGHTS[p]).map(p => ({k: "f:" + p, label: tabLabel(p)})),
                                   ...(sim.pairs || []).filter(k => PAIRS[k]).map(k => ({k: "p:" + k, label: pairName(k)}))];
  else if (sim.type === "pair") tabs = [sim.kind, ...(sim.also || [])].filter(k => PAIRS[k]).map(k => ({k: "p:" + k, label: pairName(k)}));
  else if (sim.type === "call") tabs = [sim.kind || "signal", ...(sim.also || [])].filter(k => SCENES[k]).map(k => ({k: "c:" + k, label: T(SCENES[k].tab || "anim_h_misfire")}));
  else return; // a type without an animation mounts nothing
  const show = (el, k, a) => { const x = k.slice(2), op = {autoplay: a, onAutoplay: done, onUser};
    return k.startsWith("p:") ? pairSim(el, x, op) : k.startsWith("c:") ? standSim(el, x, op) : flightSim(el, x, Object.assign({focus: sim.focus}, op)); };
  if (!tabs.length) tabs = [{k: sim.type === "pair" ? "p:report" : sim.type === "call" ? "c:signal" : "f:" + sim.preset}];
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
  "bolting-rabbit": {type: "flight", preset: "rabbit"},
  "pick-up-point": {type: "flight", preset: "quartering-away", focus: "points"}, "hold-point": {type: "flight", preset: "quartering-away", focus: "points"},
  "break-point": {type: "flight", preset: "quartering-away", focus: "points"}, "stance": {type: "flight", preset: "crosser-lr", focus: "stance"},
  "soft-focus": {type: "flight", preset: "going-away", focus: "eyes"}, "hard-focus": {type: "flight", preset: "going-away", focus: "eyes"},
  "leading-edge": {type: "flight", preset: "going-away", focus: "eyes"},
  "double-on-report": {type: "pair", kind: "report"}, "simultaneous-double": {type: "pair", kind: "simultaneous"}, "true-pair": {type: "pair", kind: "simultaneous"},
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
window.ClaySims = {config: o => Object.assign(CFG, o, {_custom: true}), mount, hero, kind, auto, flightSim, leadLab, pairSim, standSim, stopSims,
  FLIGHTS, PAIRS, SCENES, CALL, TERM_SIMS, NAMES: NAME, tabLabel};
/* English pronunciation of a term (British English, Web Speech API). A voice that runs on the device (localService) is preferred;
   if the browser offers only online voices, its default voice is used, and that browser may send the text to its speech service. */
const localVoice = () => { try { const vs = speechSynthesis.getVoices() || [];
  return vs.find(v => v.localService && /^en[-_]GB/i.test(v.lang)) || vs.find(v => v.localService && /^en\b/i.test(v.lang)) || null; } catch (e) { return null; } };
window.ClaySpeak = (t, o = {}) => { stat("speak", t); try { const u = new SpeechSynthesisUtterance(t); u.lang = "en-GB"; u.rate = o.rate || .9; const v = localVoice(); if (v) u.voice = v;
  speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) {} };
})();
