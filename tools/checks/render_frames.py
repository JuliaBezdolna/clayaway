"""Renders PNG frames of every animation type of docs/shared/sims.js for a visual review (style A "evening field", safety, the dog).

Run from the repository root:
    python tools/checks/render_frames.py                      all types, desktop + phone (about 1-2 minutes)
    python tools/checks/render_frames.py --only stand         only the stand scenes (also: flight, pair, lab, pattern)
Options: --nomascot (without docs/shared/mascot.js: no dog, no handler) · --rm (prefers-reduced-motion) · --out <folder>
(default tools/checks/out/frames, ignored by git) · --chrome (installed Google Chrome). Frames: <out>/desktop[...]/ (host 720 px,
DPR 1) and <out>/phone[...]/ (viewport 375, host 343 px, DPR 2), named <animation>__<moment>.png; requestAnimationFrame is a manual
queue (deterministic clock), so two runs give the same pictures. Exit code 1 if the page logged an error or a warning.
What to look at: DEVELOPERS.md §4b (colours, people behind the stand, protection, the gun, the dog) and §4j (the dog).
"""
import base64, sys, pathlib, time
from playwright.sync_api import sync_playwright
from _common import DOCS, OUT as OUT0, opt, flag, check_args, launch

check_args({"--only", "--out"}, {"--nomascot", "--rm", "--chrome"})
ROOT = DOCS / "shared"
OUT = pathlib.Path(opt("--out", OUT0 / "frames"))
MASCOT = not flag("--nomascot")
ONLY = opt("--only")
RMO = flag("--rm")
if ONLY not in (None, "stand", "flight", "pair", "lab", "pattern"):
    sys.exit("ERROR: --only takes stand, flight, pair, lab or pattern")

JS = r"""
async (o) => {
  const q = []; window.requestAnimationFrame = cb => { q.push(cb); return q.length; }; window.cancelAnimationFrame = () => {};
  ClaySims.config({t: () => null});
  const shot = cv => cv.toDataURL("image/png"), res = [], errs = [];
  const host = () => { const h = document.createElement("div"); h.style.width = o.hw + "px"; document.body.appendChild(h); return h; };
  const pump = (cb, ts) => { q.length = 0; cb(ts); return q.pop(); };
  const T0 = 1000;
  // ---- stand scenes
  if (!o.only || o.only === "stand") for (const [kind, sc] of Object.entries(ClaySims.SCENES)) {
    const h = host(), s = ClaySims.standSim(h, kind, {autoplay: false}), cv = h.querySelector("canvas");
    res.push(["stand_" + kind, "poster", shot(cv)]);
    const ev = [];
    const add = (n, t) => { if (t != null && t >= 0 && t <= sc.end) ev.push([n, t]); };
    add("call", sc.call != null ? sc.call + .05 : null); add("signal", sc.signal != null ? sc.signal + .15 : null);
    if (sc.release != null) { add("press", sc.release - .1); add("release", sc.release + .06); add("climb", sc.release + .4); }
    if (sc.mount) add("mount", sc.mount[1]); if (sc.move) add("move", sc.move[1]);
    if (sc.shot != null) add("shot", sc.shot + .03); if (sc.shot != null && !sc.click) add("break", sc.shot + .35);
    if (sc.click) { add("safe", sc.safe[1] + .05); add("walk", (sc.walk[0] + sc.walk[1]) / 2); }
    if (sc.nobird != null) add("nobird", sc.nobird + .2); if (sc.card != null) add("card", sc.card + .3);
    if (sc.release != null && (sc.shot == null || sc.click)) add("fall", Math.min(sc.end, sc.release + 2.2 * .95));
    add("end", sc.end); ev.sort((a, b) => a[1] - b[1]);
    q.length = 0; s.run(); let cb = q.pop(); cb = pump(cb, T0);
    for (const [n, t] of ev) { if (!cb) break; cb = pump(cb, T0 + t * 1000); res.push(["stand_" + kind, `${n}_t${t.toFixed(2)}`, shot(cv)]); }
    s.stop(); h.remove();
  }
  // ---- flights (all presets) and the three overlays
  if (!o.only || o.only === "flight") {
    const fl = Object.keys(ClaySims.FLIGHTS).map(p => [p, ""]).concat([["quartering-away", "points"], ["crosser-lr", "stance"], ["going-away", "eyes"]]);
    for (const [p, focus] of fl) { const h = host(), s = ClaySims.flightSim(h, p, {focus, autoplay: false}), cv = h.querySelector("canvas"), nm = "flight_" + p + (focus ? "_" + focus : "");
      res.push([nm, "poster", shot(cv)]);
      q.length = 0; s.run(); let cb = q.pop(); cb = pump(cb, T0);
      for (const t of [.3, .6, .9]) { if (!cb) break; cb = pump(cb, T0 + t * 2400); res.push([nm, "t" + t.toFixed(2), shot(cv)]); }
      s.stop(); h.remove(); }
  }
  // ---- pattern plate (wave 6, 06.11.2026): every choke, the poster and the marks half-way in
  if (!o.only || o.only === "pattern") for (const ch of ClaySims.CHOKES) { const h = host(), s = ClaySims.patternSim(h, {choke: ch.k, autoplay: false}), cv = h.querySelector("canvas");
    res.push(["pattern_" + ch.k, "poster", shot(cv)]);
    q.length = 0; s.run(); let cb = q.pop(); cb = pump(cb, T0); if (cb) { cb = pump(cb, T0 + 250); res.push(["pattern_" + ch.k, "t0.25s", shot(cv)]); }
    s.stop(); h.remove(); }
  // ---- pairs
  if (!o.only || o.only === "pair") for (const k of Object.keys(ClaySims.PAIRS)) { const h = host(), s = ClaySims.pairSim(h, k, {autoplay: false}), cv = h.querySelector("canvas");
    res.push(["pair_" + k, "poster", shot(cv)]);
    q.length = 0; s.run(); let cb = q.pop(); cb = pump(cb, T0);
    for (const t of [.3, .44, .47, .6, .9, 1.2]) { if (!cb) break; cb = pump(cb, T0 + t * 2400); res.push(["pair_" + k, "t" + t.toFixed(2), shot(cv)]); }
    s.stop(); h.remove(); }
  // ---- lead lab: 4 methods × {lr, rl, rabbit}: poster + demo frames (before decision, freeze, follow-through, end); focus variants
  if (!o.only || o.only === "lab") {
    const cases = [];
    for (const m of ["maintained", "swing", "pullaway", "ambush"]) for (const pr of ["", "crosser-rl", "rabbit"]) cases.push({m, preset: pr});
    cases.push({m: "maintained", focus: "perceived-vs-actual"}, {m: "pullaway", focus: "follow-through", stop: true});
    for (const cs of cases) { const h = host(), s = ClaySims.leadLab(h, cs.m, {preset: cs.preset, focus: cs.focus, stop: cs.stop, autoplay: false}), cv = h.querySelector("canvas");
      const nm = "lab_" + cs.m + (cs.preset ? "_" + cs.preset : "") + (cs.focus ? "_" + cs.focus : "");
      res.push([nm, "poster", shot(cv)]);
      // the same teaching physics as leadLab setup() in sims.js (tf, owner decision 10.2026; check_safety.py L1 guards the source)
      // demo: real ms; sim time = (now - start) / 4000; the freeze lasts 1600 ms at the shot. The shot time ts = decision + .15 s,
      // the decision of each method (default sliders: 17 m/s, rabbit 11 m/s, 25 m) as in leadLab setup():
      const v = cs.preset === "rabbit" ? 11 : 17, d = 25, tf = d / 330 * (1 + .0115 * (d - 15)), L = v * tf, TR = .15, XS = -13, XD = -3, tD = (XD - XS) / v;
      let td = tD; if (cs.m === "swing") { const p0 = .1 + .1 * L, vm = v + (L - p0) / TR, gb = 1.2 + .3 * L, t0 = Math.max(.12, tD - (gb + p0) / (vm - v)), tp = t0 + gb / (vm - v); td = tp + p0 / (vm - v); }
      const tsh = td + TR, iShot = Math.ceil(tsh * 4000 / 16), pick = {[Math.round(iShot * .45)]: "before", [Math.round(iShot * .9)]: "decision", [iShot + 20]: "freeze", [iShot + 100 + Math.round(tf * 4000 / 16) + 12]: "impact"};
      q.length = 0; h.querySelector('[data-k="demo"]').click(); let cb = q.pop(); cb = pump(cb, T0);
      for (let i = 1; i < 3000 && cb; i++) { cb = pump(cb, T0 + i * 16); if (pick[i]) res.push([nm, pick[i] + "_f" + i, shot(cv)]); }
      res.push([nm, "last", shot(cv)]);
      s.stop(); h.remove(); }
  }
  return res;
}
"""

def run(width_css, host_w, dpr, tag):
    out = OUT / tag; out.mkdir(parents=True, exist_ok=True)
    for f in out.glob("*.png"): f.unlink()
    with sync_playwright() as p:
        b = launch(p)
        ctx = b.new_context(viewport={"width": width_css, "height": 900}, device_scale_factor=dpr, reduced_motion="reduce" if RMO else "no-preference")
        pg = ctx.new_page()
        msgs = []; pg.on("console", lambda m: msgs.append(f"{m.type}: {m.text}") if m.type in ("error", "warning") else None)
        pg.on("pageerror", lambda e: msgs.append(f"pageerror: {e}"))
        pg.set_content('<!doctype html><html lang="en"><head><meta charset="utf-8"></head><body style="margin:0;padding:16px;background:#030712"></body></html>')
        if MASCOT: pg.add_script_tag(content=(ROOT / "mascot.js").read_text(encoding="utf-8"))
        pg.add_script_tag(content=(ROOT / "sims.js").read_text(encoding="utf-8"))
        t = time.time(); res = pg.evaluate(JS, {"hw": host_w, "only": ONLY}); el = time.time() - t
        for grp, name, url in res: (out / f"{grp}__{name}.png").write_bytes(base64.b64decode(url.split(",", 1)[1]))
        b.close()
    print(tag, len(res), "frames", f"{el:.1f}s", "console:", msgs[:10])
    return msgs

SUF = ("" if MASCOT else "_nomascot") + ("_rm" if RMO else "")
m1 = run(800, 720, 1, "desktop" + SUF)
m2 = run(375, 343, 2, "phone" + SUF)
print("frames in", OUT)
print("RESULT:", "OK" if not m1 and not m2 else "console messages")
sys.exit(0 if not m1 and not m2 else 1)
