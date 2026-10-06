/* ClayArena shared simulations — ONE implementation used by several projects:
   Interpreter Academy (docs/interpreter/) and the FITASC rules trainer (docs/rules/trainer/).
   - flightSim(host, preset, opts): animated target presentation (crosser, incomer, teal, chandelle, looper, rabbit, …)
   - pairSim(host, kind): a pair of targets — report pair, simultaneous pair, rafale (following pair)
   - leadLab(host, method): crossing target in slow motion; methods maintained / swing / pullaway / ambush; demo or "your turn";
     freeze-frame at the shot with the actual lead in metres and feet. Teaching physics (≈330 m/s average shot speed,
     0.15 s from decision to shot, pattern radius 0.25 m + 2 cm per metre of distance) — an explanation, not a ballistic calculator.
   Usage: ClaySims.config({t: key => text, term: id => ({en, local}) | null, onHit: () => {}});
          ClaySims.mount(host, {type: "flight", preset, also: [...]} | {type: "lead", method} | {type: "pair", kind});
   Text keys: launch, method, m_maintained, m_swing, m_pullaway, m_ambush, speed, distance, demo, try, shoot, hit, behind, ahead,
   perceived, actual, lab_note, decision, shot_moment, lead_word, unit_m, unit_ft, unit_ms, pair_report, pair_sim, pair_rafale.
   In production (ClayArena): keep as one front-end module; texts come from the page's translation strings. */
(function () {
const CFG = {t: k => k, term: () => null, onHit: null};
const T = k => { const v = CFG.t(k); return v == null ? k : v; };
const TERM = id => CFG.term(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]));
let SIMS = [];
function stopSims(){ SIMS.forEach(s => s.stop && s.stop()); SIMS = []; }
const CSS = `.cs-sim{border:1px solid rgba(255,255,255,.1);border-radius:14px;overflow:hidden;background:#06101d;margin:16px 0}
.cs-sim canvas{display:block;width:100%;height:auto;touch-action:manipulation}
.cs-ctl{display:flex;gap:8px 12px;flex-wrap:wrap;align-items:center;padding:10px 12px;border-top:1px solid rgba(255,255,255,.1);font-size:13.5px;color:#D1D5DB}
.cs-ctl label{display:flex;gap:6px;align-items:center}.cs-ctl input[type=range]{width:110px;accent-color:#34D399}
.cs-ctl select{background:#0B1120;color:#F3F4F6;border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:5px 8px;font:inherit}
.cs-btn{display:inline-flex;align-items:center;gap:6px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);color:#F3F4F6;border-radius:10px;padding:7px 13px;font:inherit;font-size:14px;cursor:pointer}
.cs-btn:hover{border-color:rgba(52,211,153,.5)}.cs-primary{background:#059669;border-color:#059669;color:#fff;font-weight:600}.cs-btn[disabled]{opacity:.45;cursor:default}
.cs-out{padding:0 12px 12px;font-size:14px;color:#D1D5DB}.cs-note{font-size:12.5px;color:#9CA3AF}.cs-hit{color:#34D399}.cs-miss{color:#FB923C}.cs-muted{color:#9CA3AF}
.cs-tabs{display:flex;gap:6px;flex-wrap:wrap;margin:12px 0 -6px}`;
if (typeof document !== "undefined" && !document.getElementById("cs-sims-css")) { const st = document.createElement("style"); st.id = "cs-sims-css"; st.textContent = CSS; document.head.appendChild(st); }

/* Flight presets: path(t) in a 0..1 screen box (y down), size scale s(t), disc shape. Shooter stands bottom-centre. */
const FLIGHTS = {
  "crosser-lr":   {p: t => [-.05 + 1.1*t, .5 - .22*Math.sin(Math.PI*t)], s: t => .8, term: "crosser"},
  "crosser-rl":   {p: t => [1.05 - 1.1*t, .5 - .22*Math.sin(Math.PI*t)], s: t => .8, term: "crosser"},
  "incomer":      {p: t => [.5 + .05*t, .32 - .45*t*t], s: t => .35 + 1.1*t, term: "incomer"},
  "driven":       {p: t => [.48, .12 - .3*t + .1*t], s: t => .3 + 1.6*t*t, term: "driven"},
  "going-away":   {p: t => [.5 + .04*t, .82 - .5*Math.sqrt(t)], s: t => 1.5 - 1.15*t, term: "going-away"},
  "overhead":     {p: t => [.5, 1.05 - .95*Math.sqrt(t)], s: t => 1.5 - 1.1*t, term: "overhead"},
  "quartering-away": {p: t => [.32 + .5*t, .8 - .5*Math.sqrt(t)], s: t => 1.4 - 1.05*t, term: "quartering-away"},
  "quartering-towards": {p: t => [.9 - .55*t, .3 + .1*t - .25*Math.sin(Math.PI*t)], s: t => .4 + .9*t, term: "quartering-towards"},
  "teal":         {p: t => [.62 + .04*t, .92 - .8*(1 - (1 - t)*(1 - t)) + .12*Math.max(0, t - .75)], s: t => .8, term: "teal"},
  "chandelle":    {p: t => [.18 + .6*t, .85 - 1.6*t + 1.25*t*t], s: t => .8, term: "chandelle"},
  "looper":       {p: t => [.04 + .92*t, .78 - .62*Math.sin(Math.PI*t)], s: t => .8, battue: 1, term: "looper"},
  "dropping":     {p: t => [.28 + .3*t, .08 + .8*t*t], s: t => .8, term: "dropping-target"},
  "rabbit":       {p: t => [1.05 - 1.1*t, .9 - .05*Math.abs(Math.sin(t*9))], s: t => .9, rabbit: 1, term: "rabbit"},
};
function stageBg(c, W, H){
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#0b2540"); g.addColorStop(.75, "#10314a"); g.addColorStop(.76, "#123d2a"); g.addColorStop(1, "#0a2418");
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.fillStyle = "rgba(255,255,255,.06)"; for (let i = 0; i < 7; i++) { c.beginPath(); c.arc((i*173 % W), H*.76, 30 + (i*37 % 50), Math.PI, 0); c.fill(); } // tree line
  c.fillStyle = "#e5e7eb"; c.beginPath(); c.arc(W/2, H - 22, 7, 0, 7); c.fill(); c.fillRect(W/2 - 6, H - 15, 12, 15); // shooter
  c.fillStyle = "rgba(52,211,153,.8)"; c.font = "11px system-ui"; c.textAlign = "center"; c.fillText("▲", W/2, H - 34);
}
function clay(c, x, y, s, f, rot = 0){
  c.save(); c.translate(x, y); c.rotate(rot); c.fillStyle = "#FB923C"; c.strokeStyle = "#7c2d12"; c.lineWidth = 1;
  const r = 9*s; c.beginPath(); c.ellipse(0, 0, r, f.battue ? r*.18 : f.rabbit ? r*.55 : r*.38, 0, 0, 7); c.fill(); c.stroke(); c.restore();
}
function flightSim(host, preset, opts = {}){
  const f = FLIGHTS[preset] || FLIGHTS["crosser-lr"];
  host.innerHTML = `<div class="cs-sim"><canvas width="720" height="380"></canvas><div class="cs-ctl"><button class="cs-btn cs-primary">▶ ${esc(T("launch"))}</button>
  ${opts.hideName ? "" : `<b>${esc(TERM(f.term) ? TERM(f.term).en : preset)}</b>${TERM(f.term) && TERM(f.term).local && TERM(f.term).local !== TERM(f.term).en ? ` <span class="cs-muted">· ${esc(TERM(f.term).local)}</span>` : ""}`}</div></div>`;
  const cv = host.querySelector("canvas"), c = cv.getContext("2d"), W = cv.width, H = cv.height; let raf = 0, t0 = 0;
  const trail = [];
  const frame = ts => { if (!t0) t0 = ts; const t = Math.min(1, (ts - t0) / 2400);
    stageBg(c, W, H); const [x, y] = f.p(t); trail.push([x*W, y*H]);
    c.strokeStyle = "rgba(251,146,60,.45)"; c.setLineDash([3, 6]); c.beginPath(); trail.forEach(([a, b], i) => i ? c.lineTo(a, b) : c.moveTo(a, b)); c.stroke(); c.setLineDash([]);
    clay(c, x*W, y*H, f.s(t), f, f.battue ? t*6 : 0);
    if (t < 1) raf = requestAnimationFrame(frame); };
  const run = () => { cancelAnimationFrame(raf); t0 = 0; trail.length = 0; raf = requestAnimationFrame(frame); };
  host.querySelector("button").onclick = run; stageBg(c, W, H); setTimeout(run, 300);
  const s = {stop: () => cancelAnimationFrame(raf), run}; SIMS.push(s); return s;
}

/* Lead lab: a crossing target at distance d (m) and speed v (m/s), seen side-on. World x in metres.
   Shot time-of-flight tf = d / 330 (average shot speed, simplified); decision-to-shot delay TR = 0.15 s.
   Hit if |muzzle(ts) - target(ts + tf)| < pattern radius. Methods define the muzzle path. */
function leadLab(host, method = "maintained"){
  const TR = .15;
  host.innerHTML = `<div class="cs-sim"><canvas width="720" height="300"></canvas>
  <div class="cs-ctl"><label>${esc(T("method"))} <select id="lm">${["maintained","swing","pullaway","ambush"].map(m => `<option value="${m}" ${m === method || (method === "swing-through" && m === "swing") || (method === "pull-away" && m === "pullaway") ? "selected" : ""}>${esc(T("m_" + m))}</option>`).join("")}</select></label>
  <label>${esc(T("speed"))} <input id="lv" type="range" min="10" max="25" value="17"><span id="lvv"></span></label>
  <label>${esc(T("distance"))} <input id="ld" type="range" min="15" max="40" value="25"><span id="ldv"></span></label></div>
  <div class="cs-ctl"><button class="cs-btn" id="ldemo">▶ ${esc(T("demo"))}</button><button class="cs-btn cs-primary" id="ltry">🎯 ${esc(T("try"))}</button><button class="cs-btn" id="lshoot" disabled>${esc(T("shoot"))}</button></div>
  <div class="cs-out" id="lout"></div><div class="cs-out cs-note">${esc(T("lab_note"))}</div></div>`;
  const q = s => host.querySelector(s), cv = q("canvas"), c = cv.getContext("2d"), W = cv.width, H = cv.height;
  const X0 = -14, X1 = 14, px = x => (x - X0) / (X1 - X0) * W, TY = H*.42;
  let raf = 0, mode = "idle", sim = null;
  const val = () => { q("#lvv").textContent = q("#lv").value + " " + T("unit_ms"); q("#ldv").textContent = q("#ld").value + " " + T("unit_m"); };
  q("#lv").oninput = q("#ld").oninput = val; val();
  function setup(){
    const v = +q("#lv").value, d = +q("#ld").value, tf = d / 330, L = v * tf, m = q("#lm").value, R = .25 + .02*d;
    const tx = t => X0 + 1 + v*t;
    // muzzle(t) for each method; "auto" = decision time that produces a hit (for the demo)
    let mz, auto;
    if (m === "maintained") { mz = t => tx(t) + L; auto = (0 - X0 - 1) / v; }
    if (m === "swing") { const vm = 1.4*v, t0 = .35; /* catching up from behind, through the target: the trigger is pulled as the muzzle passes the front of the clay (small visible lead); the gun keeps gaining during the 0.15 s delay, so the actual lead at the shot is bigger */ mz = t => t < t0 ? tx(t) - 2.2 : tx(t0) - 2.2 + vm*(t - t0); }
    if (m === "pullaway") { const vm = 1.2*v, tp = (-2 - X0 - 1) / v; mz = t => t < tp ? tx(t) : tx(tp) + vm*(t - tp); }
    if (m === "ambush") { const P = 3; mz = t => P; }
    if (auto === undefined) { // find decision time td so that muzzle(td+TR) == target(td+TR+tf)
      let best = 0, err = 1e9; for (let td = 0; td < 3; td += .002) { const e = Math.abs(mz(td + TR) - tx(td + TR + tf)); if (e < err) { err = e; best = td; } } auto = best; }
    return {v, d, tf, L, m, R, tx, mz, auto};
  }
  function draw(t, sh){
    const {tx, mz} = sim; stageBg(c, W, H);
    c.strokeStyle = "rgba(255,255,255,.12)"; c.beginPath(); c.moveTo(0, TY); c.lineTo(W, TY); c.stroke();
    for (let x = -12; x <= 12; x += 2) { c.fillStyle = "rgba(255,255,255,.25)"; c.fillRect(px(x), TY + 26, 1, 6); } // 1 tick = 2 m
    const xT = tx(t), xM = mz(t);
    c.strokeStyle = "rgba(34,211,238,.35)"; c.beginPath(); c.moveTo(W/2, H - 20); c.lineTo(px(xM), TY); c.stroke(); // gun line
    if (!(sh && sh.hit && t > sh.ti)) clay(c, px(xT), TY, 1, {});
    else { c.fillStyle = "#FB923C"; for (let k = 0; k < 9; k++) { const a = k*0.7, r = 6 + (t - sh.ti)*120; c.fillRect(px(sh.xI) + Math.cos(a)*r, TY + Math.sin(a)*r*.6, 4, 3); } }
    c.strokeStyle = "#22D3EE"; c.lineWidth = 2; c.beginPath(); c.arc(px(xM), TY, 7, 0, 7); c.moveTo(px(xM) - 12, TY); c.lineTo(px(xM) + 12, TY); c.moveTo(px(xM), TY - 12); c.lineTo(px(xM), TY + 12); c.stroke(); c.lineWidth = 1;
    if (sh && t >= sh.td) { // decision point marker (where the muzzle was when the shooter decided)
      const xd = px(mz(sh.td)); c.strokeStyle = "rgba(251,191,36,.9)"; c.beginPath(); c.moveTo(xd, TY - 18); c.lineTo(xd + 6, TY - 12); c.lineTo(xd, TY - 6); c.lineTo(xd - 6, TY - 12); c.closePath(); c.stroke();
      c.fillStyle = "rgba(251,191,36,.9)"; c.font = "11px system-ui"; c.textAlign = "center"; c.fillText(T("decision"), xd, TY - 22); }
    if (sh && freeze) { // frozen at the moment of the shot: bracket = actual lead between the clay and the muzzle
      const a = px(tx(sh.ts)), b = px(sh.xM), y = TY + 44; c.strokeStyle = "#34D399"; c.lineWidth = 2;
      c.beginPath(); c.moveTo(a, y - 6); c.lineTo(a, y + 6); c.moveTo(a, y); c.lineTo(b, y); c.moveTo(b, y - 6); c.lineTo(b, y + 6); c.stroke(); c.lineWidth = 1;
      c.fillStyle = "#34D399"; c.font = "bold 13px system-ui"; c.textAlign = "center";
      c.fillText(`${T("lead_word")} ${sh.actual.toFixed(1)} ${T("unit_m")} · ${(sh.actual * 3.281).toFixed(1)} ${T("unit_ft")}`, (a + b) / 2, y + 20);
      c.fillStyle = "#e5e7eb"; c.font = "12px system-ui"; c.fillText(T("shot_moment"), b, TY - 40); }
    if (sh && t >= sh.ts) { const k = Math.min(1, (t - sh.ts) / sim.tf); // shot cloud travelling to the aim point
      c.fillStyle = "rgba(229,231,235,.55)"; c.beginPath(); c.arc(W/2 + (px(sh.xM) - W/2)*k, (H - 20) + (TY - (H - 20))*k, 3 + sim.R / (X1 - X0) * W * k, 0, 7); c.fill(); }
  }
  function play(td){
    cancelAnimationFrame(raf); sim = setup(); let start = 0, sh = null, paused = 0; const slow = 4, HOLD = 1600; freeze = false;
    if (td !== undefined) sh = shotAt(td);
    const frame = now => { if (!start) start = now; let t = (now - start) / 1000 / slow;
      if (mode === "try" && pending !== null && !sh) { sh = shotAt(pending); pending = null; }
      // freeze-frame at the moment of the shot so the lead picture can be seen, then continue (follow-through)
      if (sh && t >= sh.ts && !paused) { paused = now; }
      if (paused && now - paused < HOLD) { freeze = true; draw(sh.ts, sh); raf = requestAnimationFrame(frame); return; }
      if (paused && freeze) { freeze = false; start += HOLD; t = (now - start) / 1000 / slow; }
      draw(t, sh && t >= sh.td ? sh : null);
      if (sh && t > sh.ti + .25) { report(sh); mode = "idle"; q("#lshoot").disabled = true; return; }
      if (sim.tx(t) > X1 + 1) { if (!sh) report(null); mode = "idle"; q("#lshoot").disabled = true; return; }
      raf = requestAnimationFrame(frame); curT = t; };
    raf = requestAnimationFrame(frame);
  }
  let pending = null, curT = 0, freeze = false;
  function shotAt(td){ const ts = td + TR, ti = ts + sim.tf, xM = sim.mz(ts), xI = sim.tx(ti), off = xM - xI;
    return {td, ts, ti, xM, xI, off, hit: Math.abs(off) < sim.R, perceived: sim.mz(td) - sim.tx(td), actual: xM - sim.tx(ts)}; }
  function report(sh){
    const ft = m => (m * 3.281).toFixed(1);
    if (!sh) { q("#lout").innerHTML = `<b class="cs-miss">${esc(T("behind"))}</b>`; return; }
    q("#lout").innerHTML = `<b class="${sh.hit ? "cs-hit" : "cs-miss"}">${esc(sh.hit ? T("hit") : sh.off < 0 ? T("behind") : T("ahead"))}</b><br>
      ${esc(T("perceived"))}: <b>${sh.perceived.toFixed(1)} ${esc(T("unit_m"))}</b> (${ft(sh.perceived)} ${esc(T("unit_ft"))}) · ${esc(T("actual"))}: <b>${sh.actual.toFixed(1)} ${esc(T("unit_m"))}</b> (${ft(sh.actual)} ${esc(T("unit_ft"))})`;
    if (sh.hit && mode === "try" && CFG.onHit) CFG.onHit();
  }
  q("#ldemo").onclick = () => { mode = "demo"; q("#lout").innerHTML = ""; sim = setup(); play(sim.auto); };
  q("#ltry").onclick = () => { mode = "try"; pending = null; q("#lout").innerHTML = ""; q("#lshoot").disabled = false; play(); };
  q("#lshoot").onclick = () => { if (mode === "try") { pending = curT; q("#lshoot").disabled = true; } };
  q("#lm").onchange = () => { q("#lout").innerHTML = ""; };
  sim = setup(); draw(0, null);
  const s = {stop: () => cancelAnimationFrame(raf)}; SIMS.push(s); return s;
}

/* Pairs (doubles): two clays. report = 2nd released at the sound of the 1st shot; simultaneous = both released together;
   rafale (following pair) = 2nd from the SAME trap as quickly as possible after the 1st (FITASC Sporting™). */
const PAIRS = {
  report:       {a: "crosser-lr", b: "incomer", delay: .45, label: "pair_report", bang: true},
  simultaneous: {a: "crosser-lr", b: "quartering-away", delay: 0, label: "pair_sim"},
  rafale:       {a: "crosser-lr", b: "crosser-lr", delay: .2, label: "pair_rafale"},
};
function pairSim(host, kind){
  const P = PAIRS[kind] || PAIRS.report, fa = FLIGHTS[P.a], fb = FLIGHTS[P.b];
  host.innerHTML = `<div class="cs-sim"><canvas width="720" height="380"></canvas><div class="cs-ctl"><button class="cs-btn cs-primary">▶ ${esc(T("launch"))}</button><b>${esc(T(P.label))}</b></div></div>`;
  const cv = host.querySelector("canvas"), c = cv.getContext("2d"), W = cv.width, H = cv.height; let raf = 0, t0 = 0;
  const frame = ts => { if (!t0) t0 = ts; const t = (ts - t0) / 2400; stageBg(c, W, H);
    const ta = Math.min(1, t), tb = Math.min(1, Math.max(0, t - P.delay));
    if (ta < 1) { const [x, y] = fa.p(ta); clay(c, x*W, y*H, fa.s(ta), fa); }
    if (t >= P.delay && tb < 1) { const [x, y] = fb.p(tb); clay(c, x*W, y*H, fb.s(tb), fb); }
    if (P.bang && t >= P.delay - .02 && t < P.delay + .1) { c.fillStyle = "rgba(255,255,255,.85)"; c.font = "bold 16px system-ui"; c.textAlign = "center"; c.fillText("BANG", W/2, H - 50); }
    if (t < 1 + P.delay) raf = requestAnimationFrame(frame); };
  const run = () => { cancelAnimationFrame(raf); t0 = 0; raf = requestAnimationFrame(frame); };
  host.querySelector("button").onclick = run; stageBg(c, W, H); setTimeout(run, 300);
  const s = {stop: () => cancelAnimationFrame(raf)}; SIMS.push(s); return s;
}

/* Tab label of a preset: term name (if the page knows it) + direction arrow for left/right variants. */
const DIR = {"crosser-lr": "→", "crosser-rl": "←"};
const NAME = {"crosser-lr": "Crosser", "crosser-rl": "Crosser", "incomer": "Incomer", "driven": "Driven", "going-away": "Going away", "overhead": "Overhead",
  "quartering-away": "Quartering away", "quartering-towards": "Quartering towards", "teal": "Teal", "chandelle": "Chandelle", "looper": "Looper", "dropping": "Dropping", "rabbit": "Rabbit"};
const tabLabel = p => { const t = TERM(FLIGHTS[p].term); return `${t ? t.en : NAME[p] || p}${DIR[p] ? " " + DIR[p] : ""}`; };
/* mount(host, sim): sim = {type: "flight", preset, also: [...]} | {type: "lead", method} | {type: "pair", kind} */
function mount(host, sim){ if (!host || !sim) return;
  if (sim.type === "pair") return pairSim(host, sim.kind);
  if (sim.type === "lead") return leadLab(host, sim.method);
  if (sim.type === "flight") { const ps = [sim.preset, ...(sim.also || [])].filter(p => FLIGHTS[p]);
    if (ps.length < 2) return flightSim(host, sim.preset);
    host.innerHTML = `<div class="cs-tabs">${ps.map((p, i) => `<button class="cs-btn ${i ? "" : "cs-primary"}" data-p="${p}">${esc(tabLabel(p))}</button>`).join("")}</div><div></div>`;
    const box = host.lastElementChild, pick = p => { stopSims(); host.querySelectorAll("[data-p]").forEach(b => b.classList.toggle("cs-primary", b.dataset.p === p)); flightSim(box, p); };
    host.querySelectorAll("[data-p]").forEach(b => b.onclick = () => pick(b.dataset.p)); return flightSim(box, ps[0]); }
}
/* Glossary term id -> animation. ONE list used by the glossary pages, the Interpreter Academy and the rules trainer. */
const TERM_SIMS = {
  "crosser": {type: "flight", preset: "crosser-lr", also: ["crosser-rl"]}, "incomer": {type: "flight", preset: "incomer"}, "going-away": {type: "flight", preset: "going-away"},
  "driven-target": {type: "flight", preset: "driven"}, "overhead": {type: "flight", preset: "overhead"},
  "quartering-away": {type: "flight", preset: "quartering-away"}, "quartering-towards": {type: "flight", preset: "quartering-towards"},
  "teal": {type: "flight", preset: "teal"}, "chandelle": {type: "flight", preset: "chandelle"}, "looper": {type: "flight", preset: "looper"},
  "battue": {type: "flight", preset: "looper"}, "dropping-target": {type: "flight", preset: "dropping"}, "rabbit": {type: "flight", preset: "rabbit"},
  "double-on-report": {type: "pair", kind: "report"}, "simultaneous-double": {type: "pair", kind: "simultaneous"}, "true-pair": {type: "pair", kind: "simultaneous"},
  "rafale-double": {type: "pair", kind: "rafale"},
  "lead": {type: "lead", method: "maintained"}, "perceived-lead": {type: "lead", method: "swing"}, "maintained-lead": {type: "lead", method: "maintained"},
  "swing-through": {type: "lead", method: "swing"}, "pull-away": {type: "lead", method: "pullaway"}, "ambush": {type: "lead", method: "ambush"},
  "follow-through": {type: "lead", method: "pullaway"},
};
/* auto(): mount every <div data-clay-sim='{"type":...}'> or <div data-clay-term="crosser"> on a static page.
   Texts: window.CLAYSIMS_TEXT[lang] (docs/shared/sims-text.js, generated from the Interpreter Academy ui strings). */
function auto(){
  const lang = (document.documentElement.lang || "en").slice(0, 2), TX = (window.CLAYSIMS_TEXT || {});
  if (!CFG._custom) Object.assign(CFG, {t: k => (TX[lang] || {})[k] ?? (TX.en || {})[k]});
  document.querySelectorAll("[data-clay-sim],[data-clay-term]").forEach(el => {
    const sim = el.dataset.claySim ? JSON.parse(el.dataset.claySim) : TERM_SIMS[el.dataset.clayTerm]; if (sim) mount(el, sim); });
}
window.ClaySims = {config: o => Object.assign(CFG, o, {_custom: true}), mount, auto, flightSim, leadLab, pairSim, stopSims, FLIGHTS, PAIRS, TERM_SIMS};
/* English pronunciation of a term (British English, Web Speech API — no external service). */
window.ClaySpeak = t => { try { const u = new SpeechSynthesisUtterance(t); u.lang = "en-GB"; u.rate = .9; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) {} };
})();
