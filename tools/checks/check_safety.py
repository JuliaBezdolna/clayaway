"""Per-frame safety check of the animations in docs/shared/sims.js (+ the dog of docs/shared/mascot.js), headless Chromium via Playwright.

Run from the repository root after ANY change of a scene, a gun pose, a flight path TP, the people or the dog (DEVELOPERS.md §4b):
    python tools/checks/check_safety.py                 all passes (about 3-6 minutes)
    python tools/checks/check_safety.py --p1            only the sprite-cache pass P1
Options: --sims <file> (default docs/shared/sims.js) · --mascot <file> (default docs/shared/mascot.js) · --chrome (installed Google
Chrome instead of the Playwright Chromium). Writes nothing. Exit code 0 = "RESULT: OK", 1 = failures (listed with "!").
Owner rules it guards (CLAUDE.md, DEVELOPERS.md §4b, §4j): nobody in front of the stand, the trap house protected, trapper / referee /
dog handler behind the stand, eye + ear protection on every person and visible, only over-and-under guns, closed only on the stand,
the dog behind the stand on a lead, side view with earmuffs, never a bubble on the canvas; lead-lab teaching physics unchanged.
"""
# v3 (08.10.2026, second review of the style 10.2026): the original checks of v1/v2 are kept UNCHANGED (person x < 130; the barrel ray
# beyond the muzzle, on the pose line AND on the drawn bore 8.5 px above it, never crosses a person, the dog or — except the lowering
# sweep after a misfire — the trap house; gun-up scenes point up until the shot; SAFE ground point short of the earth bank; the target
# never enters the stand) and the review's extensions E1–E8 are merged in:
#   E1 the dog's WHOLE drawing (ClayMascot side-view box × scale) and the handler's body stay left of the stand (x < 122, the hip
#      rail) and left of BEHIND_X; the dog only with its handler, the handler only with the dog;
#   E2 no muzzle line (pose line and drawn bore), extended to the canvas BOTTOM (the dog sits nearer the viewer, below the ground
#      line), crosses the dog's box or a person's box; the drawn gun itself never touches the dog / a person;
#   E3 exactly one gun per frame, drawn by gun() for the shooter; any gun not on the stand (x 126–222) must be drawn open;
#   E4 (static) no semi-automatic: gun() draws two stacked barrels (seam on the bore axis), the hinge pin and supports {open};
#      the back views keep their barrel line; no "semi"/"pump" words;
#   E5 protection on every person at the stand: one protection() per head, at that head's eye, AND visible in the pixels (the amber
#      lens and the dark ear cup at each head are not covered by anything drawn later);
#   E6 the dog is drawn with view "side" (always with dog earmuffs) and never with a bubble;
#   E7 reduced motion: no ear flick, no tail wag;
#   E8 without mascot.js: no dog, no handler, no errors.
# Instrumentation (text substitution in a test copy, never written back). Since v3 the stand scenes cache their still people as
# sprites (sims.js sprite()); the geometric and pixel checks above need every person drawn every frame, so the TEST COPY turns the
# cache off (sprite() → paint(c)). A separate pass (P1) then proves that the cache changes nothing: the same scene with the cache on
# and off is drawn frame by frame (every 2nd frame) at 720 px DPR 1, 720 px DPR 2 and 343 px DPR 2 (phone band) and the canvases are
# compared pixel by pixel in the CPU rasterizer (antialiasing only: per frame at most 0.01 % of the pixels, min 60, may differ by more
# than 8 and no channel by more than 80; a sprite box that cuts a person off fails with > 1400 pixels). Options: --p1 = only this pass.
# Moved into the repo from the owner's working session (10.2026): only the paths, the options, the exit code and the static physics
# check (L1) are new; every geometric and pixel check is the one that passed on the published sims.js.
import json, sys, pathlib, re
from playwright.sync_api import sync_playwright
from _common import DOCS, opt, flag, check_args, launch

check_args({"--sims", "--mascot"}, {"--p1", "--chrome"})
src = pathlib.Path(opt("--sims", DOCS / "shared" / "sims.js")).read_text(encoding="utf-8")
mp = pathlib.Path(opt("--mascot", DOCS / "shared" / "mascot.js"))
mascot = mp.read_text(encoding="utf-8") if mp.exists() else None
static_fail = []
# ---- L1 (static): the teaching physics of the lead lab (owner decision, ballistics review 10.2026; DEVELOPERS.md §4b):
# time of flight tf = d / 330 · (1 + 0.0115 · (d − 15)), hit zone R = 0.25 + 0.005 · d, decision-to-shot delay TR = 0.15 s
lab = src[src.index("function leadLab("):] if "function leadLab(" in src else ""
for need, what in [("tf = d / 330 * (1 + .0115 * (d - 15))", "time of flight tf"), ("R = .25 + .005 * d", "hit zone R")]:
    if need not in lab: static_fail.append(f"L1 leadLab setup(): {what} is not the approved formula ({need})")
if not re.search(r"\bTR\s*=\s*\.15\b", src): static_fail.append("L1 decision-to-shot delay TR is not 0.15 s")
# ---- E4 (static): the gun painter
SHOOTER_SIG = "function shooter(c, g, line, noPill){" if "function shooter(c, g, line, noPill){" in src else "function shooter(c, g, line){"
gsrc = src[src.index("function gun(c, g, o = {}){"):src.index(SHOOTER_SIG)]
for need, what in [("seg(c, 51.5, -8.5, 120, -8.5)", "seam between the two barrels"), ("dot(c, 50, -7.3", "hinge pin"), ("o.open", "open option")]:
    if need not in gsrc: static_fail.append(f"E4 gun(): missing {what}")
if re.search(r"semi[- ]?auto|pump[- ]?action|magazine tube|autoloader", src, re.I) and not re.search(r"never a semi-automatic", src): static_fail.append("E4 semi-automatic words in sims.js")
code = re.sub(r"//[^\n]*", "", re.sub(r"/\*.*?\*/", "", src, flags=re.S))   # callers in code only, not in comments
if len(re.findall(r"(?<![\w.])(?<!function )gun\(c,", code)) != 1: static_fail.append("E4 gun() is called from more than one place: check every caller")
for fn in ["function shooterBack(", "function barrelsFromBelow("]:
    body = src[src.index(fn):src.index("\n}", src.index(fn))]
    if "seg(c" not in body: static_fail.append(f"E4 {fn} lost its barrel seam")
sb = src[src.index("function shooterBack("):src.index("function barrelsFromBelow(")]
if "PAL.muff" not in sb or "PAL.lens" not in sb: static_fail.append("E5 the back-view shooter lost the ear defenders or the glasses")

subs = [(["function person(c, x, o = {}){"], "window.__F.p.push([x, (o.h || 165 * (o.s || 1)) / 165]); window.__F.P.push({x, h: o.h || 172, dy: c.getTransform().f / (c._s || 1) - (window.__F.band || 0), jacket: o.jacket ? o.jacket[1] : null});"),
        (["function shooter(c, g, line, noPill){", "function shooter(c, g, line){"], "window.__F.g = g;"),
        (["function clay(c, x, y, s, f, t = 0, o = {}){", "function clay(c, x, y, s, f, t = 0){"], "if (!(arguments[6] && arguments[6].ghost)) window.__F.clay.push([x, y]);"),
        (["let r = null; c.save();"], "window.__F.dog.push([x, y, s]);"),
        (["function gun(c, g, o = {}){"], "window.__F.guns.push({hx: g.hx, hy: g.hy, th: g.th, open: !!(o && o.open)});"),
        (["function protection(c, x, y, r){"], "{ const m = c.getTransform(), S = c._s || 1, P = (u, v) => [(m.a * (x + u * r) + m.c * (y + v * r) + m.e), (m.b * (x + u * r) + m.d * (y + v * r) + m.f)]; window.__F.prot.push({eye: P(0, 0).map(q => q / S), lens: P(2.5, 1.2), cup: P(-8.6, 1.4)}); }")]
orig_src = src
SPRITE_SIG = "function sprite(c, key, bx, by, bw, bh, paint){"
if "function sprite(" in src:
    assert src.count(SPRITE_SIG) == 1, "sprite() signature changed: adapt the cache bypass"
    src = src.replace(SPRITE_SIG, SPRITE_SIG + " paint(c); return;")
for alts, hook in subs:
    hit = [a for a in alts if src.count(a) == 1]
    if not hit:
        assert "dog" in hook or "r = null" in alts[0], alts
        continue
    a = hit[0]
    src = src.replace(a, (hook + " " + a) if a.startswith("let r") else (a + " " + hook))

JS = r"""
async (opt) => {
  const q = []; window.requestAnimationFrame = cb => { q.push(cb); return q.length; }; window.cancelAnimationFrame = () => {};
  const fresh = () => ({p: [], P: [], g: null, clay: [], dog: [], guns: [], prot: [], band: 0});
  window.__F = fresh();
  ClaySims.config({t: () => null});
  // E6: what the scenes ask the mascot module to draw
  const DOGCALLS = []; if (window.ClayMascot) { const d0 = window.ClayMascot.draw; window.ClayMascot.draw = (ctx, pose, x, y, sc, st) => { DOGCALLS.push({pose, view: st && st.view, bubble: st && st.bubble, ear: st && st.ear, wag: st && st.wag}); return d0(ctx, pose, x, y, sc, st); }; }
  const GY = 322, BEHIND_X = 130, HOUSE = [582, 266, 696, 322], STAND = [120, 120, 240, 322], RAIL = 122;
  const SIDE = [-125, -60, 72, 159], SIDEG = 157, SIDEH = 219; // mascot.js BOX.side, GROUND.side, H_SIDE
  const hitBox = (M, u, b, ybot = GY) => { // does the ray M + k·u (k >= 0, until the ground (or ybot) or the canvas edge) cross box b = [x0, y0, x1, y1]?
    for (let k = 0; k < 1200; k += 1) { const x = M[0] + u[0] * k, y = M[1] + u[1] * k;
      if (y > ybot || x > 720 || x < 0 || y < -40) return false;
      if (x >= b[0] && x <= b[2] && y >= b[1] && y <= b[3]) return [Math.round(x), Math.round(y)]; }
    return false; };
  const segHit = (A, B, b) => { for (let i = 0; i <= 80; i++) { const x = A[0] + (B[0] - A[0]) * i / 80, y = A[1] + (B[1] - A[1]) * i / 80; if (x >= b[0] && x <= b[2] && y >= b[1] && y <= b[3]) return true; } return false; };
  const GF = g => (u, v) => [g.hx + u * Math.cos(g.th) - v * Math.sin(g.th), g.hy + u * Math.sin(g.th) + v * Math.cos(g.th)];
  const out = {};
  for (const [kind, sc] of Object.entries(ClaySims.SCENES)) {
    const host = document.createElement("div"); host.style.width = opt.width + "px"; document.body.appendChild(host);
    const s = ClaySims.standSim(host, kind, {autoplay: false}), cv = host.querySelector("canvas"), cx = cv.getContext("2d");
    q.length = 0; s.run(); let cb = q.pop(); window.__F = fresh(); cb(1000);
    const r = {frames: 0, fails: [], dogFrames: 0, groundHitSafeBore: null, maxPersonX: -1e9, maxThBeforeShot: -9, minThBeforeShot: 9, groundHitSafe: null, clayMin: null, clayEnd: null, clayInStand: 0,
      dogMaxX1: null, handlerMaxX1: null, lensHidden: 0, cupHidden: 0, ext: 0};
    const fail = m => { r.fails.push(m); };
    for (let i = 0; ; i++) { const t = Math.min(sc.end, i / 60);
      cb = q.pop(); if (!cb) break; window.__F = fresh(); window.__F.band = cv._lh - 380; cb(1000 + t * 1000); r.frames++;
      const F = window.__F, g = F.g, u = [Math.cos(g.th), Math.sin(g.th)], M = [g.hx + 120 * u[0], g.hy + 120 * u[1]], T = t.toFixed(2), band = cv._lh - 380;
      // ---------- ORIGINAL CHECKS (unchanged) ----------
      const MB = [g.hx + 120 * u[0] + 8.5 * u[1], g.hy + 120 * u[1] - 8.5 * u[0]], LINES = [["pose line", M], ["drawn bore", MB]];
      for (const [x, ps] of F.p) { r.maxPersonX = Math.max(r.maxPersonX, x);
        if (x >= BEHIND_X) fail(`t ${T}: person at x ${x}`);
        for (const [ln, P0] of LINES) { const h = hitBox(P0, u, [x - 14 * ps, GY - 165 * ps, x + 14 * ps, GY]); if (h) fail(`t ${T}: ${ln} crosses a person (x ${x}) at ${h}`); } }
      for (const [x, y, s2] of F.dog) { r.dogFrames++; r.maxPersonX = Math.max(r.maxPersonX, x);
        if (x >= BEHIND_X) fail(`t ${T}: dog at x ${x}`);
        const k = s2 / .56; for (const [ln, P0] of LINES) { const h = hitBox(P0, u, [x - 36 * k, y - 62 * k, x + 22 * k, Math.min(y, GY)]); if (h) fail(`t ${T}: ${ln} crosses the dog (x ${x}) at ${h}`); } }
      const lowering = sc.safe && t > sc.safe[0] && t < sc.safe[1];
      for (const [ln, P0] of LINES) { const hh = hitBox(P0, u, HOUSE); if (hh) { if (lowering) r.sweep = (r.sweep || 0) + 1; else fail(`t ${T}: ${ln} points at the trap house at ${hh} (th ${g.th.toFixed(3)})`); } }
      if (sc.shot != null && t < sc.shot) { r.maxThBeforeShot = Math.max(r.maxThBeforeShot, g.th); r.minThBeforeShot = Math.min(r.minThBeforeShot, g.th);
        if (sc.up && g.th > 0) fail(`t ${T}: gun up but barrels point down (th ${g.th.toFixed(3)})`); }
      if (sc.safe && t >= sc.safe[1]) { const k = (GY - M[1]) / u[1]; r.groundHitSafe = Math.round(M[0] + u[0] * k); const kb = (GY - MB[1]) / u[1]; r.groundHitSafeBore = Math.round(MB[0] + u[0] * kb);
        if (r.groundHitSafeBore >= 582 - 38) fail(`t ${T}: lowered bore reaches the earth bank / trap house (x ${r.groundHitSafeBore})`); }
      for (const [x, y] of F.clay) { r.clayEnd = [Math.round(x), Math.round(y)];
        if (!r.clayMin || x < r.clayMin[0]) r.clayMin = [Math.round(x), Math.round(y)];
        if (x >= STAND[0] && x <= STAND[2] && y >= STAND[1] && y <= STAND[3]) { r.clayInStand++; fail(`t ${T}: target in the stand at ${x | 0},${y | 0}`); } }
      // ---------- EXTENSIONS ----------
      const X = m => { r.ext++; fail("EXT " + m); };
      const handler = F.P.find(p => p.jacket === "#5a4131" || p.jacket === "#443226"), people = F.P;
      // E1
      let db = null;
      for (const [x, y, s2] of F.dog) { const k = s2 * 100 / SIDEH; db = [x + SIDE[0] * k, y + (SIDE[1] - SIDEG) * k, x + SIDE[2] * k, y + (SIDE[3] - SIDEG) * k];
        r.dogMaxX1 = Math.max(r.dogMaxX1 ?? -1e9, db[2]); if (db[2] >= RAIL) X(`E1 t ${T}: the dog's drawing reaches the stand (x1 ${db[2].toFixed(1)})`); }
      if (handler) { const hx1 = handler.x + .09 * handler.h; r.handlerMaxX1 = Math.max(r.handlerMaxX1 ?? -1e9, hx1); if (hx1 >= RAIL || handler.x >= BEHIND_X) X(`E1 t ${T}: handler reaches the stand (x ${handler.x})`); }
      if (!!handler !== (F.dog.length > 0)) X(`E1 t ${T}: dog ${F.dog.length} / handler ${!!handler}`);
      if (!opt.mascot && (F.dog.length || handler)) X(`E8 t ${T}: dog or handler drawn without mascot.js`);
      // E2: rays to the canvas bottom vs the dog and every person (incl. the handler); the drawn gun vs the dog and the people
      const LB = [["pose line", M], ["drawn bore", MB]];
      for (const [ln, P0] of LB) { if (db) { const h = hitBox(P0, u, db, 380); if (h) X(`E2 t ${T}: ${ln} (to the canvas bottom) crosses the dog at ${h}`); }
        for (const p of people) { const b = [p.x - .09 * p.h, GY - p.h + p.dy, p.x + .09 * p.h, GY + p.dy]; const h = hitBox(P0, u, b, 380); if (h) X(`E2 t ${T}: ${ln} (to the canvas bottom) crosses the person at x ${p.x} at ${h}`); } }
      const G0 = GF(g)(-2.4, 0), G1 = GF(g)(120, -8.5);
      if (db && segHit(G0, G1, db)) X(`E2 t ${T}: the gun touches the dog`);
      for (const p of people) if (segHit(G0, G1, [p.x - .09 * p.h, GY - p.h + p.dy, p.x + .09 * p.h, GY + p.dy])) X(`E2 t ${T}: the gun touches the person at x ${p.x}`);
      // E3
      if (F.guns.length !== 1) X(`E3 t ${T}: ${F.guns.length} guns drawn`);
      for (const gg of F.guns) { if (!gg.open && !(gg.hx >= 126 && gg.hx <= 222)) X(`E3 t ${T}: closed gun off the stand (x ${gg.hx})`);
        if (Math.abs(gg.hx - g.hx) > .01 || Math.abs(gg.hy - g.hy) > .01 || Math.abs(gg.th - g.th) > 1e-6) X(`E3 t ${T}: a gun that is not the shooter's`); }
      // E5: one protection per head, at the eye, visible in the pixels
      if (F.prot.length !== people.length + 1) X(`E5 t ${T}: protection ${F.prot.length} for ${people.length + 1} heads`);
      const EYE = [204.4, 170.5 + band];
      const heads = [EYE, ...people.map(p => [Math.min(p.x, BEHIND_X) + .06 * p.h, GY - p.h + 12.5 * p.h / 176 + p.dy + band])];
      for (const hd of heads) if (!F.prot.some(pr => Math.hypot(pr.eye[0] - hd[0], pr.eye[1] - hd[1]) < 1.5)) X(`E5 t ${T}: no protection at the head ${hd.map(Math.round)}`);
      for (const pr of F.prot) { const L = cx.getImageData(Math.round(pr.lens[0]), Math.round(pr.lens[1]), 1, 1).data, C = cx.getImageData(Math.round(pr.cup[0]), Math.round(pr.cup[1]), 1, 1).data;
        const amber = L[0] > 170 && L[1] > 110 && L[2] < 110 && L[0] - L[2] > 90, dark = C[0] < 70 && C[1] < 80 && C[2] < 95;
        if (!amber) { r.lensHidden++; if (r.lensHidden < 6) X(`E5 t ${T}: lens at ${pr.eye.map(Math.round)} not visible (rgb ${L[0]},${L[1]},${L[2]})`); }
        if (!dark) { r.cupHidden++; if (r.cupHidden < 6) X(`E5 t ${T}: ear cup at ${pr.eye.map(Math.round)} not visible (rgb ${C[0]},${C[1]},${C[2]})`); } }
      if (t >= sc.end) break; }
    s.stop(); host.remove(); r.nfails = r.fails.length; r.fails = r.fails.slice(0, 14); out[kind] = r;
  }
  // E6/E7
  const views = [...new Set(DOGCALLS.map(d => d.view))], bubbles = DOGCALLS.filter(d => d.bubble).length, poses = [...new Set(DOGCALLS.map(d => d.pose))];
  const moving = DOGCALLS.filter(d => (d.ear || 0) > 0 || (d.wag || 0) !== 0).length;
  const fl = {};
  for (const [k, f] of Object.entries(ClaySims.FLIGHTS)) { let near = 9, nearAt = null;
    for (let i = 0; i <= 100; i++) { const t = i / 100, [x, y] = f.p(t); if (t < .3) continue; const d = Math.hypot(x - .5, (y - .94) * .53); if (d < near) { near = d; nearAt = [+x.toFixed(2), +y.toFixed(2), t]; } }
    const e = f.p(1); fl[k] = {end: [+e[0].toFixed(3), +e[1].toFixed(3)], nearestToShooterAfter30pct: nearAt, dist: +near.toFixed(3)}; }
  return {scenes: out, flights: fl, dog: {calls: DOGCALLS.length, views, bubbles, poses, moving}};
}
"""

def run(width, dpr, rm, with_mascot):
    with sync_playwright() as p:
        b = launch(p)
        pg = b.new_context(viewport={"width": 800, "height": 1000}, device_scale_factor=dpr, reduced_motion="reduce" if rm else "no-preference").new_page()
        msgs = []; pg.on("console", lambda m: msgs.append(f"{m.type}: {m.text}") if m.type in ("error", "warning") and "willReadFrequently" not in m.text else None)
        pg.on("pageerror", lambda e: msgs.append(f"pageerror: {e}"))
        pg.set_content('<!doctype html><html lang="en"><head><meta charset="utf-8"></head><body style="margin:0"></body></html>')
        if with_mascot and mascot: pg.add_script_tag(content=mascot)
        pg.add_script_tag(content=src)
        res = pg.evaluate(JS, {"width": width, "mascot": bool(with_mascot and mascot)}); b.close()
    return res, msgs

total = len(static_fail)
for f in static_fail: print("STATIC !", f)
for tag, width, dpr, rm, wm in ([] if flag("--p1") else [("720 css, DPR 1", 720, 1, False, True), ("343 css (phone), DPR 2", 343, 2, False, True), ("720, reduced motion", 720, 1, True, True), ("343, no mascot.js", 343, 2, False, False)]):
    res, msgs = run(width, dpr, rm, wm); bad = 0
    print(f"===== {tag}")
    for k, r in res["scenes"].items():
        bad += r["nfails"]
        print(f"{k:12s} frames {r['frames']:4d}  fails {r['nfails']} (ext {r['ext']})  maxPersonX {r['maxPersonX']}  th before shot [{r['minThBeforeShot']:.3f}, {r['maxThBeforeShot']:.3f}]"
              f"  safe->ground x {r['groundHitSafe']} (bore {r['groundHitSafeBore']})  dog frames {r['dogFrames']} dog x1 {r['dogMaxX1'] and round(r['dogMaxX1'], 1)} handler x1 {r['handlerMaxX1'] and round(r['handlerMaxX1'], 1)}"
              f"  lens hidden {r['lensHidden']} cup hidden {r['cupHidden']}  sweep {r.get('sweep', 0)}  target leftmost {r['clayMin']} last {r['clayEnd']}")
        for f in r["fails"]: print("     !", f)
    d = res["dog"]; print("dog calls:", d)
    if wm and (d["views"] not in ([], ["side"]) or d["bubbles"]): print("     ! E6 dog not in side view or with a bubble"); bad += 1
    if rm and d["moving"]: print("     ! E7 ear flick / tail wag under reduced motion"); bad += 1
    print("console:", msgs); bad += len(msgs); total += bad
# ---------- P1: the sprite cache draws the same picture ----------
PJS = r"""
async (opt) => {
  const q = []; window.requestAnimationFrame = cb => { q.push(cb); return q.length; }; window.cancelAnimationFrame = () => {};
  const A = window.__SA, B = window.__SB, out = {}, fresh = () => ({p: [], P: [], g: null, clay: [], dog: [], guns: [], prot: [], band: 0});
  window.__F = fresh(); // the hooks of the checked copy write here
  for (const S of [A, B]) S.config({t: () => null});
  for (const kind of Object.keys(A.SCENES)) { const sc = A.SCENES[kind];
    const mk = S => { const h = document.createElement("div"); h.style.width = opt.width + "px"; document.body.appendChild(h); const s = S.standSim(h, kind, {autoplay: false}); return [h, s, h.querySelector("canvas")]; };
    const [ha, sa, ca] = mk(A), [hb, sb, cb2] = mk(B);
    const cmp = () => { if (ca.width !== cb2.width || ca.height !== cb2.height) return [999, 1e9];
      const a = ca.getContext("2d").getImageData(0, 0, ca.width, ca.height).data, b = cb2.getContext("2d").getImageData(0, 0, cb2.width, cb2.height).data; let mx = 0, n = 0;
      const a32 = new Uint32Array(a.buffer), b32 = new Uint32Array(b.buffer);
      for (let w = 0; w < a32.length; w++) { if (a32[w] === b32[w]) continue;
        for (let i = w * 4; i < w * 4 + 4; i++) { const d = Math.abs(a[i] - b[i]); if (d > mx) mx = d; if (d > 8) n++; } } return [mx, n]; };
    const r = {frames: 0, max: 0, maxN: 0, bad: 0, worst: null, still: null}; let [m0, n0] = cmp(); r.max = m0; r.maxN = n0; r.still = [m0, n0]; if (n0 > opt.limitN || m0 > opt.limitMax) r.bad++; // the still picture
    q.length = 0; sa.run(); let fa = q.pop(); sb.run(); let fb = q.pop(); q.length = 0;
    for (let i = 0; ; i += 2) { const t = Math.min(sc.end, i / 60), ts = 1000 + t * 1000;
      if (!fa || !fb) break; window.__F = fresh(); fa(ts); fa = q.pop(); q.length = 0; window.__F = fresh(); fb(ts); fb = q.pop(); q.length = 0;
      const [mx, n] = cmp(); r.frames++; if (mx > r.max) { r.max = mx; r.worst = +t.toFixed(2); } if (n > r.maxN) r.maxN = n; if (n > opt.limitN || mx > opt.limitMax) r.bad++;
      if (t >= sc.end) break; }
    sa.stop(); sb.stop(); ha.remove(); hb.remove(); out[kind] = r; }
  return out;
}
"""
def pixel_pass(width, dpr):
    with sync_playwright() as p:
        b = launch(p)
        pg = b.new_context(viewport={"width": 800, "height": 1000}, device_scale_factor=dpr).new_page()
        msgs = []; pg.on("console", lambda m: msgs.append(f"{m.type}: {m.text}") if m.type in ("error", "warning") and "willReadFrequently" not in m.text else None)
        pg.on("pageerror", lambda e: msgs.append(f"pageerror: {e}"))
        pg.set_content('<!doctype html><html lang="en"><head><meta charset="utf-8"></head><body style="margin:0"></body></html>')
        # every canvas of this page (scene and sprites) on the CPU rasterizer: the many read-backs of this pass would otherwise switch
        # only the scene canvases from GPU to CPU raster mid-run, and GPU-painted sprites would then differ from CPU-drawn people by
        # antialiasing alone (in a browser both are painted the same way)
        pg.evaluate("(() => { const g0 = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (t, o) { return g0.call(this, t, Object.assign({willReadFrequently: true}, o || {})); }; })()")
        if mascot: pg.add_script_tag(content=mascot)
        pg.add_script_tag(content=orig_src); pg.evaluate("window.__SA = window.ClaySims")          # sprite cache ON (as shipped)
        pg.add_script_tag(content=src); pg.evaluate("window.__SB = window.ClaySims")               # cache OFF (the checked copy)
        res = pg.evaluate(PJS, {"width": width, "limitN": 60 if dpr == 1 else 110, "limitMax": 80}); b.close()
    return res, msgs
# Limits of P1 (measured 08.10.2026 in the CPU rasterizer: at most 26 (DPR 1) / 71 (DPR 2) pixels per frame differ by more than 8, at most 37 per channel,
# all of them antialiased edges — e.g. the tip of the dog's tail at the canvas edge; a part cut off by a too small sprite box, a wrong
# state key or a missing person changes hundreds of pixels by much more): per frame at most 0.01 % of the pixels (min 60) may differ by
# more than 8, and no channel by more than 80.
if "function sprite(" in orig_src:
    for tag, width, dpr in [("720 css, DPR 1", 720, 1), ("720 css, DPR 2", 720, 2), ("343 css (phone band), DPR 2", 343, 2)]:
        res, msgs = pixel_pass(width, dpr); bad = 0
        print(f"===== P1 sprite cache = direct drawing, {tag}")
        for k, r in res.items():
            ok = not r["bad"]
            print(f"{k:12s} frames {r['frames']:4d}  max channel diff {r['max']} (t {r['worst']})  most pixels > 8 in one frame: {r['maxN']}  still picture {r['still']}  frames over the limit: {r['bad']}" + ("" if ok else "   !"))
            bad += 0 if ok else 1
        print("console:", msgs); bad += len(msgs); total += bad
print("RESULT:", "OK" if total == 0 else f"{total} failures")
sys.exit(0 if total == 0 else 1)
