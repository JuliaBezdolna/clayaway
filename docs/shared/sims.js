/* ClayArena shared simulations — ONE implementation used by several projects:
   Interpreter Academy (docs/interpreter/: the course and its static lesson pages), the FITASC rules trainer (docs/rules/trainer/)
   and the glossary term pages (docs/glossary/<id>/, docs/<lang>/glossary/<id>/, mounted through TERM_SIMS below).
   - flightSim(host, preset, opts): animated target presentation (crosser, incomer, driven, going-away, overhead, quartering,
     teal, chandelle, looper, battue, dropping, rabbit). opts.focus adds a teaching overlay:
       "points" = pick-up point (eyes), hold point (muzzles at the call) and break point; the clay breaks at the break point;
       "stance" = hold point and break point with lines from the stand (the front foot points at the break point);
       "eyes"   = soft focus around the pick-up point, then hard focus on the leading edge of the target.
   - pairSim(host, kind): a pair of targets — report pair, simultaneous pair, rafale (following pair, Sporting™ only).
   - leadLab(host, method, opts): crossing target in slow motion; methods maintained / swing / pullaway / ambush; "watch the method"
     or "your turn"; freeze-frame at the shot with the actual lead in metres and feet.
     opts.preset: "crosser-rl" = target flies right to left, "rabbit" = target rolls along the ground (default: left to right);
     opts.focus: "perceived-vs-actual" = table of the four methods for the same target, "lead-units" = lead also in target widths,
                 "follow-through" = option to stop the gun at the trigger (opts.stop: true = option on at the start),
                 "mount" = the phase words read “move · mount · shoot” (gun-mount lesson) instead of the method's words.
     The canvas shows the coach's words for the phases of the method in English, as the lessons teach them
     (“insert in front · match its speed · shoot · keep moving”, “butt · belly · beak · bang”, “on it · with it · pull away · shoot”).
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
   Usage: ClaySims.config({t: key => text, term: id => ({en, local}) | null, onHit: info => {}});   info = {method, v, d}
          ClaySims.mount(host, {type: "flight", preset, also: [...], pairs: [...], focus} | {type: "lead", method, preset, focus, stop}
                              | {type: "pair", kind});
   Lesson keys muzzle_start, gun_speed, trigger and follow_through only describe the method in words: the lab takes that behaviour
   from the method itself (see above), so they need no code. Types without an animation (e.g. "call") mount nothing.
   Text keys (texts from the page; missing keys fall back to the English DEF below): launch, method, m_maintained, m_swing,
   m_pullaway, m_ambush, speed, distance, demo, try, shoot, hit, behind, ahead, no_shot, perceived, actual, at_muzzle, compare,
   how_maintained, how_swing, how_pullaway, how_ambush, stop_gun, clay_widths, lab_note, decision, shot_moment, lead_word,
   unit_m, unit_ft, unit_cm, unit_in, unit_ms, pair_report, pair_sim, pair_rafale.
   The master texts are docs/interpreter/src/ui.json (+ i18n/<lang>.json "ui"); scripts/build_interpreter.py copies them into
   docs/shared/sims-text.js (list SIM_KEYS there) for pages outside the course.
   In production (ClayArena): keep as one front-end module; texts come from the page's translation strings. */
(function () {
const CFG = {t: () => null, term: () => null, onHit: null};
/* English fallback texts (same as the "en" values in docs/interpreter/src/ui.json). Used when a page has no text for a key yet. */
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
};
const T = k => { const v = CFG.t(k); return v == null || v === "" ? (DEF[k] ?? k) : v; };
const TERM = id => CFG.term(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]));
const sq = x => x * x;
let SIMS = [];
function stopSims(){ SIMS.forEach(s => s.stop && s.stop()); SIMS = []; }
const CSS = `.cs-sim{border:1px solid rgba(255,255,255,.1);border-radius:14px;overflow:hidden;background:#06101d;margin:16px 0}
.cs-sim canvas{display:block;width:100%;height:auto;touch-action:manipulation}
.cs-ctl{display:flex;gap:8px 12px;flex-wrap:wrap;align-items:center;padding:10px 12px;border-top:1px solid rgba(255,255,255,.1);font-size:13.5px;color:#D1D5DB}
.cs-ctl label{display:flex;gap:6px;align-items:center}.cs-ctl input[type=range]{width:110px;accent-color:#34D399}.cs-ctl input[type=checkbox]{accent-color:#FB923C}
.cs-ctl select{background:#0B1120;color:#F3F4F6;border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:5px 8px;font:inherit}
.cs-btn{display:inline-flex;align-items:center;gap:6px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);color:#F3F4F6;border-radius:10px;padding:7px 13px;font:inherit;font-size:14px;cursor:pointer}
.cs-btn:hover{border-color:rgba(52,211,153,.5)}.cs-primary{background:#059669;border-color:#059669;color:#fff;font-weight:600}.cs-btn[disabled]{opacity:.45;cursor:default}
.cs-out{padding:0 12px 12px;font-size:14px;color:#D1D5DB}.cs-out:empty{display:none}.cs-note{font-size:12.5px;color:#9CA3AF}.cs-hit{color:#34D399}.cs-miss{color:#FB923C}.cs-muted{color:#9CA3AF}
.cs-tabs{display:flex;gap:6px;flex-wrap:wrap;margin:12px 0 -6px}
.cs-cmp{overflow-x:auto}.cs-cmp table{border-collapse:collapse;width:100%;font-size:13px;margin-top:6px}.cs-cmp td,.cs-cmp th{padding:4px 6px;border-bottom:1px solid rgba(255,255,255,.1);text-align:left;vertical-align:top}.cs-cmp th{color:#9CA3AF;font-weight:600}`;
if (typeof document !== "undefined" && !document.getElementById("cs-sims-css")) { const st = document.createElement("style"); st.id = "cs-sims-css"; st.textContent = CSS; document.head.appendChild(st); }

/* Flight presets: p(t) = position in a 0..1 screen box (y down) for t = 0..1, s(t) = size scale, optional ar(t) = disc aspect
   (0.1 = edge-on, 1 = full face; default 0.38) and rot(t) = tilt in radians. The shooter stands bottom centre; the tree line is at
   y ≈ 0.76. Shapes follow the lessons (flight mission) and the glossary definitions. */
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
  // chandelle: steep climb on a slight curve, arcs over at the top, drops almost vertically (a narrow, high arch)
  "chandelle":    {p: t => [.32 + .13*(1 - Math.cos(Math.PI*t)), .86 - .72*Math.sin(Math.PI*t)], s: () => .8, term: "chandelle"},
  // looper: a wide rainbow arc across the sky; drawn as a standard target that shows more of its face as it turns over the top
  "looper":       {p: t => [.04 + .92*t, .78 - .62*Math.sin(Math.PI*t)], s: () => .8, ar: t => .3 + .35*Math.sin(Math.PI*t), rot: t => (t - .5)*.9, term: "looper"},
  // battue: a thin target flying fast and edge-on, then it turns over (shows its face) and drops steeply
  "battue":       {p: t => t < .6 ? [.05 + t, .45 - .12*t] : (u => [.65 + u - 1.1*u*u, .378 - .12*u + 2.6*u*u])(t - .6),
                   s: () => .8, ar: t => t < .55 ? .1 : Math.min(.7, .1 + (t - .55)*4), rot: t => t < .55 ? 0 : (t - .55)*5, term: "battue"},
  "dropping":     {p: t => [.28 + .3*t, .08 + .8*t*t], s: () => .8, term: "dropping-target"},
  "rabbit":       {p: t => [1.05 - 1.1*t, .9 - .05*Math.abs(Math.sin(t*9))], s: () => .9, rabbit: 1, term: "rabbit"},
};
function stageBg(c, W, H){
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#0b2540"); g.addColorStop(.75, "#10314a"); g.addColorStop(.76, "#123d2a"); g.addColorStop(1, "#0a2418");
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.fillStyle = "rgba(255,255,255,.06)"; for (let i = 0; i < 7; i++) { c.beginPath(); c.arc((i*173 % W), H*.76, 30 + (i*37 % 50), Math.PI, 0); c.fill(); } // tree line
  c.fillStyle = "#e5e7eb"; c.beginPath(); c.arc(W/2, H - 22, 7, 0, 7); c.fill(); c.fillRect(W/2 - 6, H - 15, 12, 15); // shooter
  c.fillStyle = "rgba(52,211,153,.8)"; c.font = "11px system-ui"; c.textAlign = "center"; c.fillText("▲", W/2, H - 34);
}
function clay(c, x, y, s, f, t = 0){
  c.save(); c.translate(x, y); c.rotate(f.rot ? f.rot(t) : 0); c.fillStyle = "#FB923C"; c.strokeStyle = "#7c2d12"; c.lineWidth = 1;
  const r = 9*s, ar = f.ar ? f.ar(t) : f.rabbit ? .55 : .38; c.beginPath(); c.ellipse(0, 0, r, Math.max(1, r*ar), 0, 0, 7); c.fill(); c.stroke(); c.restore();
}
/* broken target: fragments flying apart and falling; k = seconds since the break */
function burst(c, x, y, k){ c.fillStyle = "#FB923C"; for (let i = 0; i < 9; i++) { const a = i*.7, r = 6 + k*120; c.fillRect(x + Math.cos(a)*r, y + Math.sin(a)*r*.6 + k*k*60, 4, 3); } }
function crosshair(c, x, y, color = "#22D3EE"){ c.strokeStyle = color; c.lineWidth = 2; c.beginPath(); c.arc(x, y, 7, 0, 7); c.moveTo(x - 12, y); c.lineTo(x + 12, y); c.moveTo(x, y - 12); c.lineTo(x, y + 12); c.stroke(); c.lineWidth = 1; }
function label(c, text, x, y, color, align = "center"){ c.fillStyle = color; c.font = "12px system-ui"; c.textAlign = align; c.fillText(text, x, y); }
/* Term names on the canvas: the English term (the course teaches the English words), from the page's term list if it has one. */
const TERM_EN = {"pick-up-point": "Pick-up point", "hold-point": "Hold point", "break-point": "Break point", "soft-focus": "Soft focus", "hard-focus": "Hard focus"};
const termName = id => (TERM(id) && TERM(id).en) || TERM_EN[id] || id;

/* Teaching overlays of a flight (opts.focus). P(t) = canvas position of the target. Points along the flight: pick-up 0.2,
   hold 0.42 (on or just under the line, between pick-up and break), break 0.62. */
const PK = .2, HD = .42, BR = .62;
function overlay(c, f, P, t, focus, W, H){
  if (focus === "points" || focus === "stance") {
    const [bx, by] = P(BR), [hx, hy0] = P(HD), hy = hy0 + 10;
    if (focus === "stance") { // from the stand: the front foot points at the break point, the body winds back to the hold point
      const sx = W/2, sy = H - 34; c.setLineDash([4, 5]); c.strokeStyle = "rgba(52,211,153,.7)"; c.beginPath(); c.moveTo(sx, sy); c.lineTo(bx, by); c.stroke();
      c.strokeStyle = "rgba(34,211,238,.6)"; c.beginPath(); c.moveTo(sx, sy); c.lineTo(hx, hy); c.stroke(); c.setLineDash([]); }
    if (focus === "points") { const [ux, uy] = P(PK); // pick-up point: where the eyes first see the target clearly
      c.strokeStyle = "#FBBF24"; c.lineWidth = 1.5; c.beginPath(); c.ellipse(ux, uy, 14, 8, 0, 0, 7); c.stroke(); c.lineWidth = 1;
      c.fillStyle = "#FBBF24"; c.beginPath(); c.arc(ux, uy, 3.5, 0, 7); c.fill(); label(c, termName("pick-up-point"), ux, uy - 16, "#FBBF24"); }
    c.setLineDash([3, 3]); c.strokeStyle = "rgba(34,211,238,.9)"; c.beginPath(); c.arc(hx, hy, 10, 0, 7); c.stroke(); c.setLineDash([]); // hold point: muzzles at the call
    label(c, termName("hold-point"), hx, hy + 26, "#22D3EE");
    c.strokeStyle = "#34D399"; c.lineWidth = 2; c.beginPath(); for (let i = 0; i < 8; i++) { const a = i*Math.PI/4, r = i % 2 ? 4 : 10; c.lineTo(bx + Math.cos(a)*r, by + Math.sin(a)*r); } c.closePath(); c.stroke(); c.lineWidth = 1;
    label(c, termName("break-point"), bx, by - 18, "#34D399");
    // the muzzles wait at the hold point until the eyes have the target, then join its line just in front and go with it to the break point
    const ahead = P(Math.min(1, Math.min(t, BR) + .03)), k = Math.max(0, Math.min(1, (t - PK) / .14));
    const m = t < PK ? [hx, hy] : t < BR ? [hx + (ahead[0] - hx)*k, hy + (ahead[1] - hy)*k] : P(BR + .03);
    crosshair(c, m[0], m[1]);
  }
  if (focus === "eyes") {
    const [ux, uy] = P(PK);
    if (t < PK + .05) { c.setLineDash([5, 6]); c.strokeStyle = "rgba(251,191,36,.8)"; c.beginPath(); c.arc(ux, uy, 46, 0, 7); c.stroke(); c.setLineDash([]); label(c, termName("soft-focus"), ux, uy - 54, "#FBBF24"); }
    else { const [x, y] = P(t), [x2, y2] = P(Math.min(1, t + .02)), a = Math.atan2(y2 - y, x2 - x), r = 9*f.s(t), ex = x + Math.cos(a)*r, ey = y + Math.sin(a)*r*.4;
      c.strokeStyle = "#FBBF24"; c.lineWidth = 2; c.beginPath(); c.arc(ex, ey, 5, 0, 7); c.stroke(); c.lineWidth = 1; label(c, termName("hard-focus"), x, y - 14 - r, "#FBBF24"); }
  }
}
function flightSim(host, preset, opts = {}){
  const f = FLIGHTS[preset] || FLIGHTS["crosser-lr"], focus = opts.focus || "", tm = TERM(f.term);
  const name = tm ? tm.en : NAME[preset] || preset;
  host.innerHTML = `<div class="cs-sim"><canvas width="720" height="380" role="img" aria-label="${esc(opts.hideName ? "" : name)}"></canvas><div class="cs-ctl"><button class="cs-btn cs-primary">▶ ${esc(T("launch"))}</button>
  ${opts.hideName ? "" : `<b>${esc(name)}</b>${tm && tm.local && tm.local !== tm.en ? ` <span class="cs-muted">· ${esc(tm.local)}</span>` : ""}`}</div></div>`;
  const cv = host.querySelector("canvas"), c = cv.getContext("2d"), W = cv.width, H = cv.height; let raf = 0, t0 = 0, timer = 0;
  const trail = [], P = t => { const [x, y] = f.p(t); return [x*W, y*H]; };
  const brk = focus === "points" || focus === "stance" ? BR : null; // with these overlays the clay is broken at the break point
  const frame = ts => { if (!t0) t0 = ts; const t = Math.min(1, (ts - t0) / 2400);
    stageBg(c, W, H); const tf = brk != null ? Math.min(t, brk) : t, [x, y] = P(tf); if (brk == null || t <= brk) trail.push([x, y]);
    c.strokeStyle = "rgba(251,146,60,.45)"; c.setLineDash([3, 6]); c.beginPath(); trail.forEach(([a, b], i) => i ? c.lineTo(a, b) : c.moveTo(a, b)); c.stroke(); c.setLineDash([]);
    if (focus) overlay(c, f, P, t, focus, W, H);
    if (brk != null && t > brk) burst(c, x, y, (t - brk)*2.4); else clay(c, x, y, f.s(tf), f, tf);
    if (t < 1) raf = requestAnimationFrame(frame); };
  const run = () => { cancelAnimationFrame(raf); t0 = 0; trail.length = 0; raf = requestAnimationFrame(frame); };
  host.querySelector("button").onclick = run; stageBg(c, W, H); timer = setTimeout(run, 300);
  const s = {stop: () => { clearTimeout(timer); cancelAnimationFrame(raf); }, run}; SIMS.push(s); return s;
}

/* Lead lab: a crossing target at distance d (m) and speed v (m/s), seen side-on. World x in metres (left to right; the drawing is
   mirrored for a right-to-left target). Shot time of flight tf = d / 330; decision-to-shot delay TR = 0.15 s. The shot hits if
   |muzzle(ts) − target(ts + tf)| < R (effective pattern radius). The method gives the muzzle path muzzle(t, td), td = decision time. */
function leadLab(host, method = "maintained", opts = {}){
  if (!opts || typeof opts !== "object") opts = {};
  const TR = .15, EYE = 1, CLAY = .11, METHODS = ["maintained", "swing", "pullaway", "ambush"];
  const norm = m => ({"swing-through": "swing", "pull-away": "pullaway"})[m] || (METHODS.includes(m) ? m : "maintained");
  const rl = /-rl$/.test(opts.preset || ""), rabbit = opts.preset === "rabbit", focus = opts.focus || "";
  host.innerHTML = `<div class="cs-sim"><canvas width="720" height="300" role="img" aria-label="${esc(T("method") + ": " + T("m_" + norm(method)))}"></canvas>
  <div class="cs-ctl"><label>${esc(T("method"))} <select data-k="m">${METHODS.map(m => `<option value="${m}"${m === norm(method) ? " selected" : ""}>${esc(T("m_" + m))}</option>`).join("")}</select></label>
  <label>${esc(T("speed"))} <input data-k="v" type="range" min="10" max="25" value="17"><span data-k="vv"></span></label>
  <label>${esc(T("distance"))} <input data-k="d" type="range" min="15" max="40" value="25"><span data-k="dv"></span></label>
  ${focus === "follow-through" || opts.stop ? `<label><input data-k="stop" type="checkbox"${opts.stop ? " checked" : ""}> ${esc(T("stop_gun"))}</label>` : ""}</div>
  <div class="cs-ctl"><button class="cs-btn" data-k="demo">▶ ${esc(T("demo"))}</button><button class="cs-btn cs-primary" data-k="try">🎯 ${esc(T("try"))}</button><button class="cs-btn" data-k="shoot" disabled>${esc(T("shoot"))}</button></div>
  <div class="cs-out cs-note" data-k="how"></div><div class="cs-out" data-k="out" aria-live="polite"></div>${focus === "perceived-vs-actual" ? `<div class="cs-out cs-cmp" data-k="cmp"></div>` : ""}
  <div class="cs-out cs-note">${esc(T("lab_note"))}</div></div>`;
  const q = k => host.querySelector(`[data-k="${k}"]`), cv = host.querySelector("canvas"), c = cv.getContext("2d"), W = cv.width, H = cv.height;
  const X0 = -14, X1 = 14, XS = X0 + 1, XD = -3; // the target starts at XS; the planned decision is when it reaches XD (left of centre)
  const px = x => { const u = (x - X0) / (X1 - X0) * W; return rl ? W - u : u; }, TY = rabbit ? H*.8 : H*.42;
  // coach's words for the phases of each method (English, as the lessons teach them); the current one is highlighted
  const WORDS = {maintained: ["insert in front", "match its speed", "shoot", "keep moving"], swing: ["butt", "belly", "beak", "bang"],
    pullaway: ["on it", "with it", "pull away", "shoot"], ambush: ["wait at the point", "shoot"]};
  let raf = 0, mode = "idle", sim = null, pending = null, curT = 0, freeze = false;
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
  function draw(t, sh){
    const {tx, mz} = sim, td = sh ? sh.td : Infinity; stageBg(c, W, H);
    if (rabbit) { c.strokeStyle = "rgba(255,255,255,.18)"; c.beginPath(); c.moveTo(0, TY + 9); c.lineTo(W, TY + 9); c.stroke(); } // ground
    else { c.strokeStyle = "rgba(255,255,255,.12)"; c.beginPath(); c.moveTo(0, TY); c.lineTo(W, TY); c.stroke(); }
    for (let x = -12; x <= 12; x += 2) { c.fillStyle = "rgba(255,255,255,.25)"; c.fillRect(px(x), TY + (rabbit ? 14 : 26), 1, 6); } // 1 tick = 2 m
    const xT = tx(t), xM = mz(t, td);
    c.strokeStyle = "rgba(34,211,238,.35)"; c.beginPath(); c.moveTo(W/2, H - 20); c.lineTo(px(xM), TY); c.stroke(); // gun line
    if (sh && sh.hit && t > sh.ti) burst(c, px(sh.xI), TY, t - sh.ti); else clay(c, px(xT), TY, 1, rabbit ? {rabbit: 1} : {});
    crosshair(c, px(xM), TY);
    if (sh && t >= sh.td) { // decision point marker (where the muzzle was when the shooter decided)
      const xd = px(mz(sh.td, sh.td)); c.strokeStyle = "rgba(251,191,36,.9)"; c.beginPath(); c.moveTo(xd, TY - 18); c.lineTo(xd + 6, TY - 12); c.lineTo(xd, TY - 6); c.lineTo(xd - 6, TY - 12); c.closePath(); c.stroke();
      label(c, T("decision"), xd, TY - 22, "rgba(251,191,36,.9)"); }
    if (sh && freeze) { // frozen at the moment of the shot: bracket = actual lead between the clay and the muzzle
      const a = px(tx(sh.ts)), b = px(sh.xM), y = rabbit ? TY - 70 : TY + 44; c.strokeStyle = "#34D399"; c.lineWidth = 2;
      c.beginPath(); c.moveTo(a, y - 6); c.lineTo(a, y + 6); c.moveTo(a, y); c.lineTo(b, y); c.moveTo(b, y - 6); c.lineTo(b, y + 6); c.stroke(); c.lineWidth = 1;
      c.fillStyle = "#34D399"; c.font = "bold 13px system-ui"; c.textAlign = "center";
      c.fillText(`${T("lead_word")} ${sh.actual.toFixed(1)} ${T("unit_m")} · ${(sh.actual * 3.281).toFixed(1)} ${T("unit_ft")}`, (a + b) / 2, rabbit ? y - 10 : y + 20);
      label(c, T("shot_moment"), b, TY - 40, "#e5e7eb"); }
    if (sh && t >= sh.ts) { const k = Math.min(1, (t - sh.ts) / sim.tf); // shot cloud travelling to the aim point
      c.fillStyle = "rgba(229,231,235,.55)"; c.beginPath(); c.arc(W/2 + (px(sh.xM) - W/2)*k, (H - 20) + (TY - (H - 20))*k, 3 + sim.R / (X1 - X0) * W * k, 0, 7); c.fill(); }
    // phase words: “butt · belly · beak · bang” etc.; for the gun-mount lesson “move · mount · shoot” (muzzles first, then the stock)
    const ph = sim.phase(t, td, sh ? sh.ts : Infinity), mountW = focus === "mount" && sim.m !== "ambush";
    const ws = mountW ? ["move", "mount", "shoot"] : WORDS[sim.m], cur = mountW ? [0, 0, 1, 2][ph] : ph; let x = 12; c.font = "12.5px system-ui"; c.textAlign = "left";
    ws.forEach((w, i) => { const s = (i ? " · " : "") + "“" + w + "”"; c.fillStyle = i === cur ? "#F3F4F6" : "rgba(156,163,175,.55)"; c.fillText(s, x, 20); x += c.measureText(s).width; });
  }
  function play(td){
    cancelAnimationFrame(raf); sim = setup(); let start = 0, sh = null, paused = 0; const slow = 4, HOLD = 1600; freeze = false;
    if (td !== undefined) sh = shotAt(sim, td);
    const end = s => { report(s); mode = "idle"; q("shoot").disabled = true; };
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
  const r1 = x => x.toFixed(1), ft = x => (x * 3.281).toFixed(1);
  const atMuzzle = (x, d) => { const cm = x / d * EYE * 100; return `${Math.abs(cm) < 10 ? cm.toFixed(1) : Math.round(cm)} ${T("unit_cm")} (${(cm / 2.54).toFixed(1)} ${T("unit_in")})`; };
  function report(sh){
    const out = q("out");
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
  const idle = () => { if (mode === "idle") { cancelAnimationFrame(raf); sim = setup(); draw(0, null); } };
  q("v").oninput = q("d").oninput = () => { val(); compare(); idle(); };
  q("demo").onclick = () => { mode = "demo"; pending = null; q("out").innerHTML = ""; q("shoot").disabled = true; sim = setup(); play(sim.auto); };
  q("try").onclick = () => { mode = "try"; pending = null; q("out").innerHTML = ""; q("shoot").disabled = false; play(); q("shoot").focus(); };
  q("shoot").onclick = () => { if (mode === "try" && pending === null) { pending = curT; q("shoot").disabled = true; } };
  q("m").onchange = () => { mode = "idle"; q("out").innerHTML = ""; q("shoot").disabled = true; how(); idle(); };
  if (q("stop")) q("stop").onchange = () => { q("out").innerHTML = ""; };
  val(); how(); compare(); sim = setup(); draw(0, null);
  const s = {stop: () => cancelAnimationFrame(raf)}; SIMS.push(s); return s;
}

/* Pairs (doubles): two clays. report = 2nd released at the sound of the 1st shot (the 1st is shown broken by that shot);
   simultaneous = both released together, from two traps; rafale (following pair) = 2nd from the SAME trap on the same line,
   as soon as the trap has reloaded (FITASC Sporting™ only). Delays are in units of the 2.4 s flight (0.5 ≈ 1.2 s). */
const PAIRS = {
  report:       {a: "crosser-lr", b: "incomer", delay: .45, label: "pair_report", bang: true},
  simultaneous: {a: "crosser-lr", b: "quartering-away", delay: 0, label: "pair_sim"},
  rafale:       {a: "crosser-lr", b: "crosser-lr", delay: .5, label: "pair_rafale"},
};
function pairSim(host, kind){
  const P = PAIRS[kind] || PAIRS.report, fa = FLIGHTS[P.a], fb = FLIGHTS[P.b];
  host.innerHTML = `<div class="cs-sim"><canvas width="720" height="380" role="img" aria-label="${esc(pairName(kind))}"></canvas><div class="cs-ctl"><button class="cs-btn cs-primary">▶ ${esc(T("launch"))}</button><b>${esc(T(P.label))}</b></div></div>`;
  const cv = host.querySelector("canvas"), c = cv.getContext("2d"), W = cv.width, H = cv.height; let raf = 0, t0 = 0, timer = 0;
  const frame = ts => { if (!t0) t0 = ts; const t = (ts - t0) / 2400; stageBg(c, W, H);
    const ta = Math.min(1, t), tb = Math.min(1, Math.max(0, t - P.delay));
    if (P.bang && t >= P.delay) { const [x, y] = fa.p(P.delay); if (t < P.delay + .35) burst(c, x*W, y*H, (t - P.delay)*2.4); } // 1st target shot at the BANG
    else if (ta < 1) { const [x, y] = fa.p(ta); clay(c, x*W, y*H, fa.s(ta), fa, ta); }
    if (t >= P.delay && tb < 1) { const [x, y] = fb.p(tb); clay(c, x*W, y*H, fb.s(tb), fb, tb); }
    if (P.bang && t >= P.delay - .02 && t < P.delay + .1) { c.fillStyle = "rgba(255,255,255,.85)"; c.font = "bold 16px system-ui"; c.textAlign = "center"; c.fillText("BANG", W/2, H - 50); }
    if (t < 1 + P.delay) raf = requestAnimationFrame(frame); };
  const run = () => { cancelAnimationFrame(raf); t0 = 0; raf = requestAnimationFrame(frame); };
  host.querySelector("button").onclick = run; stageBg(c, W, H); timer = setTimeout(run, 300);
  const s = {stop: () => { clearTimeout(timer); cancelAnimationFrame(raf); }, run}; SIMS.push(s); return s;
}

/* Tab label of a preset: term name (if the page knows it) + direction arrow for left/right variants; of a pair: its name
   (the text before the colon of its description, e.g. "Report pair (on report)"). */
const DIR = {"crosser-lr": "→", "crosser-rl": "←"};
const NAME = {"crosser-lr": "Crosser", "crosser-rl": "Crosser", "incomer": "Incomer", "driven": "Driven target", "going-away": "Going away", "overhead": "Overhead",
  "quartering-away": "Quartering away", "quartering-towards": "Quartering towards", "teal": "Teal", "chandelle": "Chandelle", "looper": "Looper", "battue": "Battue",
  "dropping": "Dropping target", "rabbit": "Rabbit"};
const tabLabel = p => { const t = TERM(FLIGHTS[p].term); return `${t ? t.en : NAME[p] || p}${DIR[p] ? " " + DIR[p] : ""}`; };
const pairName = k => String(T((PAIRS[k] || PAIRS.report).label)).split(/\s*:\s+/)[0];
/* mount(host, sim): sim = {type: "flight", preset, also: [...], pairs: [...], focus} | {type: "lead", method, preset, focus, stop}
   | {type: "pair", kind}. A flight with several presets and/or pairs gets one tab per animation. */
function mount(host, sim){ if (!host || !sim) return;
  if (sim.type === "pair") return pairSim(host, sim.kind);
  if (sim.type === "lead") return leadLab(host, sim.method, sim);
  if (sim.type === "flight") {
    const tabs = [...[sim.preset, ...(sim.also || [])].filter(p => FLIGHTS[p]).map(p => ({k: "f:" + p, label: tabLabel(p)})),
                  ...(sim.pairs || []).filter(k => PAIRS[k]).map(k => ({k: "p:" + k, label: pairName(k)}))];
    const show = (box, k) => k.startsWith("p:") ? pairSim(box, k.slice(2)) : flightSim(box, k.slice(2), {focus: sim.focus});
    if (tabs.length < 2) return show(host, tabs.length ? tabs[0].k : "f:" + sim.preset);
    host.innerHTML = `<div class="cs-tabs">${tabs.map((b, i) => `<button class="cs-btn ${i ? "" : "cs-primary"}" data-p="${esc(b.k)}">${esc(b.label)}</button>`).join("")}</div><div></div>`;
    const box = host.lastElementChild; let cur = null;
    const pick = k => { cur && cur.stop(); host.querySelectorAll("[data-p]").forEach(b => b.classList.toggle("cs-primary", b.dataset.p === k)); cur = show(box, k); };
    host.querySelectorAll("[data-p]").forEach(b => b.onclick = () => pick(b.dataset.p));
    cur = show(box, tabs[0].k); return {stop: () => cur && cur.stop()}; }
}
/* Glossary term id -> animation. ONE list used by the glossary pages, the Interpreter Academy and the rules trainer. */
const TERM_SIMS = {
  "crosser": {type: "flight", preset: "crosser-lr", also: ["crosser-rl"]}, "incomer": {type: "flight", preset: "incomer"}, "going-away": {type: "flight", preset: "going-away"},
  "driven-target": {type: "flight", preset: "driven"}, "overhead": {type: "flight", preset: "overhead"},
  "quartering-away": {type: "flight", preset: "quartering-away"}, "quartering-towards": {type: "flight", preset: "quartering-towards"},
  "teal": {type: "flight", preset: "teal"}, "chandelle": {type: "flight", preset: "chandelle"}, "looper": {type: "flight", preset: "looper"},
  "battue": {type: "flight", preset: "battue"}, "dropping-target": {type: "flight", preset: "dropping"}, "rabbit": {type: "flight", preset: "rabbit"},
  "pick-up-point": {type: "flight", preset: "quartering-away", focus: "points"}, "hold-point": {type: "flight", preset: "quartering-away", focus: "points"},
  "break-point": {type: "flight", preset: "quartering-away", focus: "points"},
  "soft-focus": {type: "flight", preset: "going-away", focus: "eyes"}, "hard-focus": {type: "flight", preset: "going-away", focus: "eyes"},
  "double-on-report": {type: "pair", kind: "report"}, "simultaneous-double": {type: "pair", kind: "simultaneous"}, "true-pair": {type: "pair", kind: "simultaneous"},
  "rafale-double": {type: "pair", kind: "rafale"},
  "lead": {type: "lead", method: "maintained", focus: "perceived-vs-actual"}, "perceived-lead": {type: "lead", method: "swing", focus: "perceived-vs-actual"},
  "maintained-lead": {type: "lead", method: "maintained"}, "insertion-point": {type: "lead", method: "maintained"},
  "swing-through": {type: "lead", method: "swing"}, "pull-away": {type: "lead", method: "pullaway"}, "ambush": {type: "lead", method: "ambush"},
  "follow-through": {type: "lead", method: "pullaway", focus: "follow-through"},
  "stopping-the-gun": {type: "lead", method: "pullaway", focus: "follow-through", stop: true},
};
/* auto(): mount every <div data-clay-sim='{"type":...}'> or <div data-clay-term="crosser"> on a static page.
   Texts: window.CLAYSIMS_TEXT[lang] (docs/shared/sims-text.js, generated from the Interpreter Academy ui strings), else DEF. */
function auto(){
  const lang = (document.documentElement.lang || "en").slice(0, 2), TX = (window.CLAYSIMS_TEXT || {});
  if (!CFG._custom) Object.assign(CFG, {t: k => (TX[lang] || {})[k] ?? (TX.en || {})[k]});
  document.querySelectorAll("[data-clay-sim],[data-clay-term]").forEach(el => {
    let sim = null; try { sim = el.dataset.claySim ? JSON.parse(el.dataset.claySim) : TERM_SIMS[el.dataset.clayTerm]; } catch (e) {}
    if (sim) mount(el, sim); });
}
window.ClaySims = {config: o => Object.assign(CFG, o, {_custom: true}), mount, auto, flightSim, leadLab, pairSim, stopSims, FLIGHTS, PAIRS, TERM_SIMS, NAMES: NAME, tabLabel};
/* English pronunciation of a term (British English, Web Speech API). A voice that runs on the device (localService) is preferred;
   if the browser offers only online voices, its default voice is used, and that browser may send the text to its speech service. */
const localVoice = () => { try { const vs = speechSynthesis.getVoices() || [];
  return vs.find(v => v.localService && /^en[-_]GB/i.test(v.lang)) || vs.find(v => v.localService && /^en\b/i.test(v.lang)) || null; } catch (e) { return null; } };
window.ClaySpeak = (t, o = {}) => { try { const u = new SpeechSynthesisUtterance(t); u.lang = "en-GB"; u.rate = o.rate || .9; const v = localVoice(); if (v) u.voice = v;
  speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) {} };
})();
