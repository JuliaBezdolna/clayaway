/* ClayArena Academy mascot: ONE source for the dog (PROJECT: moves into ClayArena with the Academy). Owner decision 08.10.2026:
   variant C, a yellow Labrador as a round cartoon (round head, short drop ears, otter tail, emerald collar + clay-disc tag).
   Sketch: design/mascot/sheet.svg + notes.md (not published). Full guide (API, data format, placements, rules, legal): DEVELOPERS.md §4j.
   HARD RULES: no name anywhere (not chosen; trademark + name check before launch) · silent or ONE English bubble from BUBBLES on
   every page language, never translated (svg()/draw() drop other text) · never holds a gun or a cartridge · near shooting: BEHIND
   the stand, on a lead, next to its handler (no gun, eye + ear protection), dog earmuffs (side view always has them) · decorative
   only (aria-hidden, focusable=false) · not on /rules/, /rules-spec/, the rules trainer, the referee's call game · motion only
   without prefers-reduced-motion, a few repeats, no endless loops.
   LOADING: docs/shared/nav.js adds this file (async) on Academy pages (not the trainer), glossary pages and 404. It fills every
   empty slot [data-clay-mascot="<pose>"] (+ data-bubble, data-size, data-anim="0", data-side, data-flip="1") now and, by a
   MutationObserver, later; then fires document event "claymascot:ready". Canvas code must guard: if (window.ClayMascot) ….
   API window.ClayMascot: POSES · BUBBLES · PALETTE · mountAll(root) · mount(el, pose, opts) → el ·
     svg(pose, {size, bubble, anim, side, flip, view, muffs}) → SVG string; size = px height of the SITTING dog (default 96, same
       unit size for every pose; the SVG grows for the bubble); "think" has a "?" cloud (bubble:false hides it); anim:false = still.
     draw(ctx, pose, x, y, scale, state) → {head:[x,y], collar:[x,y], top}: (x, y) = ground point, scale 1 ≈ 100 px tall;
       state {view "side", flip (faces left), ear 0..1 (flick on "Pull!"), look (rad, atan2 from head to target; side view
       −40°…+10°), wag (tail = sin(wag)), blink 0..1, muffs, bubble}; collar = where the lead (PALETTE.shade) is clipped on.
       With view "side" the pose is IGNORED: there is one side drawing (sitting, always with dog earmuffs); ear, look and wag move it.
   DATA: shape lists in sketch units (origin = centre of the head), ONE drawing for the SVG writer and the canvas painter. */
(function () {
  "use strict";
  if (typeof window === "undefined" || window.ClayMascot) return;
  /* Palette of the sketch (6 colours) + shine, bubble and text colours. Z/G/w are translucent (ALPHA). */
  const PAL = { F: "#F4C460", S: "#D39338", C: "#FFEAC0", K: "#2A1A10", E: "#10B981", O: "#FB923C", W: "#FFFFFF", M: "#34D399",
    b: "#F3F4F6", e: "#059669", q: "#9CA3AF", Z: "#000000", G: "#10B981", w: "#FFFFFF" };
  const ALPHA = { Z: .35, G: .22, w: .7 };
  const POSES = ["sit", "happy", "think", "point", "safety", "sleep"];
  const BUBBLES = ["Good shot!", "Safety first!", "Look!", "Pull!"]; // ENGLISH ONLY, never translated (owner decision 08.10.2026)
  const FONT = "'Segoe UI',Inter,Roboto,Arial,sans-serif";
  const H_FRONT = 285, H_SIDE = 219; // height in units of the sitting dog (front / side view) = "size" px in svg(), 100 px at scale 1

  /* ---------------- Parts (paths copied from design/mascot/sheet.svg) ---------------- */
  const mir = list => ["G",{ s: [-1,1] },list];
  const EAR = "M-30-54C-48-60-66-50-74-32C-80-14-78 8-68 20C-60 28-50 24-50 14C-50 2-48-10-42-22C-38-34-34-46-30-54Z";
  const ear = r => ["G",{ r: [r,-34,-50] },[["P",EAR,"So"]],"ear"];      // pivot of the ear flick
  const ears = (l,r) => [ear(l),mir([ear(r)])];                                // right ear = mirrored left ear
  const HEAD = [["E",0,0,66,58,"Fo"],["P","M-34 18C-36 2-20-4 0-4C20-4 36 2 34 18C33 36 18 46 0 46C-18 46-33 36-34 18Z","C"]];
  const NOSE = [["P","M-14 2C-14-5 14-5 14 2C14 10 6 16 0 16C-6 16-14 10-14 2Z","K"],["E",-5,-.5,4,2,"w"]];
  const BROWS = ["D",[["L","M-33-29Q-25-34-16-30M33-29Q25-34 16-30",1]]];
  const SMILE = ["L","M0 16V23M-15 24C-10 31-3 31 0 23C3 31 10 31 15 24",1];
  const MOUTH = [["P","M-16 24C-10 30-3 30 0 23C3 30 10 30 16 24C14 40 6 46 0 46C-6 46-14 40-16 24Z","K"],
    ["P","M-9 40C-9 34 9 34 9 40C8 44 4 45.6 0 45.7C-4 45.6-8 44-9 40Z","O"],["L","M0 16V23",1]];
  const MOUTH_BIG = [["P","M-20 22C-12 28-4 28 0 21C4 28 12 28 20 22C19 44 8 52 0 52C-8 52-19 44-20 22Z","K"],
    ["P","M-11 44C-11 37 11 37 11 44C10 49 5 51.6 0 51.7C-5 51.6-10 49-11 44Z","O"],["L","M0 16V21",1]];
  const EYES = [["E",-24,-12,7.5,9.5,"K"],["E",24,-12,7.5,9.5,"K"],["C",-21.5,-15.5,2.8,"W"],["C",26.5,-15.5,2.8,"W"]];
  const EYES_BIG = [["E",-24,-11,10,12.5,"K"],["E",24,-11,10,12.5,"K"],["C",-20.5,-16,3.8,"W"],["C",27.5,-16,3.8,"W"]];
  const MUFFS = ["G",{},[["T","M-60-40C-56-70 56-70 60-40",15,8,"E"],["E",-64,-26,16,21,"Eo"],["E",-64,-27,7.5,12,"M"],
    ["E",64,-26,16,21,"Eo"],["E",64,-27,7.5,12,"M"]],"muffs"];
  const LEG = [["R",-38,112,26,90,"F"],["L","M-38 112V198M-12 132V198",1],["E",-25,204,19,12,"Fo"],["D",[["L","M-30 199V207M-20 199V207",2]]]];
  const BIB = ["P","M-22 74C-22 60 22 60 22 74C22 110 8 140 0 150C-8 140-22 110-22 74Z","C"];
  const COLLAR = [["P","M-44 54C-22 70 22 70 44 54L46 66C22 84-22 84-46 66Z","Eo"],["L","M0 78V84",2],
    ["E",0,91,11,8,"Oo"],["E",0,90,5,3.2,"Nt"]];                       // emerald collar + mini clay-disc tag (signature)
  const TAIL = ["G",{ r: [0,60,177] },[["P","M58 194C104 200 140 178 146 138C148 126 134 122 131 133C124 158 98 166 60 160Z","Fo"]],"tail"];
  const TORSO = ["P","M-38 44C-58 72-64 130-58 172C-52 206 52 206 58 172C64 130 58 72 38 44Z","Fo"];
  const HAUNCH = [["C",-56,160,38,"Fo"],["C",56,160,38,"Fo"]];
  const HPAWS = [["E",-76,202,22,12,"Fo"],["E",76,202,22,12,"Fo"]];
  const SHADOW = ["E",14,214,116,9,"Z"];
  const BODY = [TAIL,...HAUNCH,TORSO,...HPAWS,...LEG,mir(LEG),BIB,...COLLAR];
  const head = (r,parts) => ["G",{ r: [r,0,56] },parts,"head"];             // neck pivot (0,56)
  const SPARK = "M0-7L1.8-1.8L7 0L1.8 1.8L0 7L-1.8 1.8L-7 0L-1.8-1.8Z";
  const spark = (x,y,s) => ["G",{ t: [x,y],s: [s,s] },[["P",SPARK,"M"]]];
  const JHIND = [["T","M-26 170C-32 196-42 212-50 224",32,24,"F"],["E",-55,230,16,10,"Fo",35]];
  const JFRONT = [["T","M-38 92C-54 82-68 64-76 42",31,23,"F"],["C",-78,34,14,"Fo"],["D",[["L","M-84 26L-82 32M-76 24L-76 30",2]]]];
  const CLOUD = ["G",{},[["C",96,-128,30,"b"],["C",124,-114,22,"b"],["C",68,-114,22,"b"],["C",96,-100,22,"b"],
    ["C",58,-78,8,"b"],["C",48,-62,5,"b"],["X",96,-98,46,"?","e"]],"bub"];  // "think": a symbol, not words

  /* ---------------- Poses (front view) ---------------- */
  const P = {
    sit: [SHADOW,...BODY,head(3,[...HEAD,...MOUTH,...NOSE,["Y",0,0],BROWS,...ears(0,0)])],
    happy: [["E",0,275,72,9,"Z"],["L","M-57 250v14M-29 257v14M29 257v14M57 250v14",4,"M"],
      spark(-124,-16,1.6),spark(132,-2,1.3),spark(-112,72,1),
      ["G",{},[["G",{ r: [0,34,160] },[["T","M34 160C62 152 84 126 88 98",26,17,"F"]],"tail"],...JHIND,mir(JHIND),
        ["P","M-36 46C-54 76-56 132-44 168C-34 194 34 194 44 168C56 132 54 76 36 46Z","Fo"],BIB,...JFRONT,mir(JFRONT),...COLLAR,
        head(-4,[...HEAD,...MOUTH_BIG,...NOSE,["L","M-32-9Q-24-23-16-9M16-9Q24-23 32-9",4.8],["G",{ t: [0,-6] },[BROWS]],...ears(58,58)])],"hop"]],
    think: [SHADOW,...BODY,head(-14,[...HEAD,["L","M0 16V22M-12 29C-6 24 0 32 6 27C9 25 12 26 14 28",1],...NOSE,["Y",3,-3],
      ["D",[["L","M-35-34Q-27-45-16-38M16-33Q25-32 33-27",1]]],...ears(0,28)]),CLOUD],
    point: [SHADOW,TAIL,...HAUNCH,TORSO,...HPAWS,...LEG,BIB,
      ["G",{},[["T","M22 116C50 104 80 86 100 68",32,24,"F"],["E",106,63,17,12,"Fo",-38]],"paw"],...COLLAR,
      head(7,[...HEAD,...MOUTH,...NOSE,["Y",6,-1],["G",{ t: [4,-2] },[BROWS]],...ears(0,0)]),
      ["L","M128 34l9-12M136 56l15-3M110 28l2-15",4,"M"]],
    safety: [SHADOW,...BODY,head(0,[...HEAD,SMILE,...NOSE,["Y",0,0],BROWS,...ears(0,0),MUFFS])],
    sleep: [["E",0,52,128,15,"G"],["P","M-50-26C-20-56 64-58 96-18C114 6 106 44 70 46L-40 46C-76 46-84-6-50-26Z","Fo"],
      ["E",58,10,38,32,"Fo"],["E",24,42,22,9,"Fo"],["T","M94 28C106 50 70 56 34 54",22,14,"F"],
      ["G",{ t: [-62,-4],r: [-8,0,0],s: [.84,.84] },[...HEAD,SMILE,...NOSE,["L","M-32-12Q-24-3-16-12M16-12Q24-3 32-12",4.4],...ears(0,0)]],
      ["E",-96,44,20,10,"Fo"],["E",-52,46,20,10,"Fo"],
      ["G",{},[["X",-30,-76,22,"z"],["X",-6,-110,30,"z"],["X",24,-150,40,"Z"]],"z"]] };
  /* Side view, sitting, facing right (stand scenes): ALWAYS with dog earmuffs. Head pivot = neck (0,24), ear flick pivot (2,-28). */
  const SIDE = [["G",{ r: [0,-48,148] },[["T","M-48 148C-76 154-98 148-114 136",22,14,"F"]],"tailS"],
    ["R",0,86,18,64,"So",8],["P","M-22 20C4 22 28 42 32 80L32 148L-52 148C-66 118-54 58-22 20Z","Fo"],
    ["C",-30,112,36,"Fo"],["E",-2,150,22,8,"Fo"],["R",14,84,20,64,"F"],["L","M14 98V148M34 84V148",1],["E",30,151,16,8,"Fo"],
    ["P","M12 40C24 48 31 64 32 84L32 100C22 92 15 72 12 40Z","C"],
    ["P","M-20 18C-6 30 14 32 26 24L28 36C14 46-8 44-22 30Z","Eo"],["E",20,46,7,5,"Oo"],
    ["G",{ r: [-10,0,24] },[
      ["P","M-30 2C-32-20-14-34 4-34C20-34 30-26 33-14C42-12 54-12 62-9C70-6 72 8 67 16C62 24 52 26 40 26C28 27 18 32 4 32C-16 32-30 22-30 2Z","Fo"],
      ["P","M30 12C42 10 58 10 68 11C66 19 60 24 50 25.5C40 26.5 28 27.5 19 30.5C21 22 24 14 30 12Z","C"],
      ["E",65,-4,7,6,"K"],["E",62.5,-6,2.6,1.5,"w"],["L","M65 14C57 19 46 19 38 15C36 14 35 12 36 10",1],
      ["E",24,-14,5,6.5,"K"],["C",25.6,-16.6,1.9,"W"],["D",[["L","M16-25Q23-30 31-26",1]]],
      ["G",{ r: [-4,2,-28] },[["P","M8-30C-6-36-22-28-24-10C-26 8-20 22-10 24C-2 25 2 16 4 4C6-8 12-22 8-30Z","So"]],"earS"],
      ["T","M-6-30C-2-44 14-46 22-38",10,5,"E"],["E",-5,-20,12,14.5,"Eo"],["E",-6,-21,5.5,8.5,"M"]],"headS"]];
  /* Geometry boxes [x0, y0, x1, y1] (units, outline not included), ground line y and bubble anchor [x, y, side] per pose. */
  const BOX = { sit: [-102,-62,146,223],happy: [-135,-98,141,284],think: [-107,-158,146,223],point: [-102,-67,151,223],
    safety: [-102,-70,146,223],sleep: [-133,-186,128,67],side: [-125,-60,72,159] }; // measured with getBBox + tube strokes
  const GROUND = { sit: 216,happy: 275,think: 216,point: 216,safety: 216,sleep: 56,side: 157 };
  const ANCHOR = { sit: [8,-66,1],happy: [0,-74,1],think: [-20,-64,-1],point: [-6,-64,-1],safety: [0,-74,1],sleep: [-50,-56,1],side: [12,-50,-1] };

  /* ---------------- Helpers ---------------- */
  const n = v => Math.round(v * 10) / 10;
  const lw = (w, c) => Math.max(w === 1 ? 3.4 : w === 2 ? 2.4 : w, (w === 2 ? 1 : 1.2) / c.k); // lines stay ≥ ~1 px on screen
  const tw = (x, c) => Math.max(x[2], x[3] + 2 * c.ow);                                          // tube outline = body outline
  const reduce = () => { try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; } };
  /* Width of the bubble text in em (bold sans); the SVG also sets textLength, so the text always fits its bubble. */
  const textW = s => [...s].reduce((w, ch) => w + (/[ijl!.,'|I]/.test(ch) ? .3 : ch === " " ? .28 : /[frt]/.test(ch) ? .4 : /[mwMW]/.test(ch) ? .88 : /[A-Z]/.test(ch) ? .68 : .58), 0);
  /* Speech bubble with its tail as ONE path (any units): f = font size; (ax, ay) = tail tip; dir 1 = bubble to the right. */
  function bub(text, ax, ay, f, dir) {
    const t = textW(text) * f, w = t + f * 1.5, h = f * 2.1, r = h * .42, cx = ax + dir * w * .3, y1 = ay - f * .85, y0 = y1 - h,
      x0 = cx - w / 2, x1 = cx + w / 2, bx = ax + dir * f * .55, a = bx - f * .38, b = bx + f * .38, tip = ax + dir * f * .05;
    const d = `M${n(x0 + r)},${n(y0)}H${n(x1 - r)}Q${n(x1)},${n(y0)} ${n(x1)},${n(y0 + r)}V${n(y1 - r)}Q${n(x1)},${n(y1)} ${n(x1 - r)},${n(y1)}` +
      `H${n(b)}L${n(tip)},${n(ay)}L${n(a)},${n(y1)}H${n(x0 + r)}Q${n(x0)},${n(y1)} ${n(x0)},${n(y1 - r)}V${n(y0 + r)}Q${n(x0)},${n(y0)} ${n(x0 + r)},${n(y0)}Z`;
    return { d, t, cx, ty: y0 + h / 2 + f * .36, box: [x0, y0, x1, ay] };
  }
  const bubStroke = text => text === "Safety first!" ? [PAL.E, 2.5] : ["rgba(42,26,16,.35)", 1]; // [colour, px]
  /* Pose list for the options (think without its cloud, muffs on any front head). */
  function listOf(pose, o) {
    if (o.view === "side") return SIDE;
    let L = P[pose];
    if (pose === "think" && (o.bubble === false || o.bubble === "none")) L = L.filter(x => x !== CLOUD);
    return L;
  }

  /* ---------------- SVG writer ---------------- */
  function paint(st, c) {
    const f = st[0], s = st[1];
    let a = f === "N" ? ' fill="none"' : ` fill="${PAL[f]}"${ALPHA[f] ? ` fill-opacity="${ALPHA[f]}"` : ""}`;
    if (s) a += ` stroke="${PAL.K}" stroke-width="${n(s === "o" ? c.ow : lw(2, c))}" stroke-linejoin="round"`;
    return a;
  }
  function svgOf(list, c) { return list.map(x => svgShape(x, c)).join(""); }
  function svgShape(x, c) {
    switch (x[0]) {
      case "G": { const f = x[1], tf = [f.t ? `translate(${f.t})` : "", f.r && f.r[0] ? `rotate(${f.r.join(" ")})` : "", f.s ? `scale(${f.s})` : ""].join(" ").trim();
        let kids = x[2]; if (x[3] === "head" && c.muffs && !kids.includes(MUFFS)) kids = kids.concat([MUFFS]);
        const in_ = svgOf(kids, c), g = tf ? `<g transform="${tf}">${in_}</g>` : in_;
        return x[3] ? `<g class="cm-${x[3]}">${g}</g>` : tf ? g : `<g>${g}</g>`; }
      case "D": return c.small ? "" : svgOf(x[1], c);
      case "Y": { const e = svgOf(c.small ? EYES_BIG : EYES, c); return x[1] || x[2] ? `<g transform="translate(${x[1]},${x[2]})">${e}</g>` : e; }
      case "P": return `<path d="${x[1]}"${paint(x[2], c)}/>`;
      case "E": return `<ellipse cx="${x[1]}" cy="${x[2]}" rx="${x[3]}" ry="${x[4]}"${x[6] ? ` transform="rotate(${x[6]} ${x[1]} ${x[2]})"` : ""}${paint(x[5], c)}/>`;
      case "C": return `<circle cx="${x[1]}" cy="${x[2]}" r="${x[3]}"${paint(x[4], c)}/>`;
      case "R": return `<rect x="${x[1]}" y="${x[2]}" width="${x[3]}" height="${x[4]}"${x[6] ? ` rx="${x[6]}"` : ""}${paint(x[5], c)}/>`;
      case "T": return `<path d="${x[1]}" fill="none" stroke="${PAL.K}" stroke-width="${n(tw(x, c))}" stroke-linecap="round"/><path d="${x[1]}" fill="none" stroke="${PAL[x[4]]}" stroke-width="${x[3]}" stroke-linecap="round"/>`;
      case "L": return `<path d="${x[1]}" fill="none" stroke="${PAL[x[3] || "K"]}" stroke-width="${n(lw(x[2], c))}" stroke-linecap="round" stroke-linejoin="round"/>`;
      case "X": return `<text x="${x[1]}" y="${x[2]}" font-size="${x[3]}" font-weight="800" text-anchor="middle" fill="${PAL[x[5] || "q"]}">${x[4]}</text>`;
    }
    return "";
  }
  /* Motion: only on wrapper groups (class cm-<name>, never with a transform attribute), only without prefers-reduced-motion. */
  const CSS = ".cm-svg{display:block;overflow:visible;pointer-events:none;user-select:none}" +
    ".cm-hop,.cm-tail,.cm-head,.cm-paw,.cm-bub,.cm-z{transform-box:fill-box}.cm-hop{transform-origin:50% 100%}.cm-tail{transform-origin:0 75%}" +
    ".cm-head{transform-origin:50% 92%}.cm-paw{transform-origin:0 100%}.cm-bub{transform-origin:30% 100%}.cm-z{transform-origin:0 100%}" +
    "@media (prefers-reduced-motion:no-preference){.cm-a .cm-hop{animation:cm-hop .8s ease-out both}" +
    ".cm-a .cm-tail{animation:cm-wag .45s ease-in-out .2s 3}.cm-a.cm-p-think .cm-head{animation:cm-tilt .6s ease-out both}" +
    ".cm-a .cm-paw{animation:cm-paw .4s ease-in-out .3s 4 alternate}.cm-a .cm-bub{animation:cm-pop .35s ease-out .25s both}" +
    ".cm-a .cm-z{animation:cm-z 2.2s ease-in-out 3}}" +
    "@keyframes cm-hop{0%{transform:translateY(6%) scaleY(.9)}40%{transform:translateY(-7%) scaleY(1.02)}70%{transform:translateY(1%) scaleY(.97)}100%{transform:none}}" +
    "@keyframes cm-wag{0%,100%{transform:none}25%{transform:rotate(-10deg)}75%{transform:rotate(10deg)}}" +
    "@keyframes cm-tilt{from{transform:rotate(14deg)}to{transform:none}}@keyframes cm-paw{from{transform:none}to{transform:rotate(-7deg)}}" +
    "@keyframes cm-pop{from{transform:scale(.5);opacity:0}to{transform:none;opacity:1}}" +
    "@keyframes cm-z{0%,100%{transform:none;opacity:1}50%{transform:translateY(-10%);opacity:.5}}";
  function css() { try { if (document.getElementById("cm-css")) return; const s = document.createElement("style"); s.id = "cm-css"; s.textContent = CSS; document.head.appendChild(s); } catch (e) {} }

  function svg(pose, o) {
    o = o || {}; if (!POSES.includes(pose)) pose = "sit";
    const side = o.view === "side", key = side ? "side" : pose, size = +o.size > 0 ? +o.size : 96, k = size / (side ? H_SIDE : H_FRONT);
    const c = { k, small: size < 64, ow: Math.max(4, 1.5 / k), muffs: !!o.muffs && !side }, flip = !!o.flip, B = BOX[key];
    let x0 = flip ? -B[2] : B[0], x1 = flip ? -B[0] : B[2], y0 = B[1], y1 = B[3];
    let body = svgOf(listOf(pose, o), c);
    if (flip) body = `<g transform="scale(-1,1)">${body}</g>`;
    const text = BUBBLES.includes(o.bubble) ? o.bubble : "";
    if (o.bubble && !text && o.bubble !== "none") console.warn("ClayMascot: English bubbles only, ignored:", o.bubble);
    if (text) {
      const A = ANCHOR[key], ax = flip ? -A[0] : A[0], dir = o.side === "left" ? -1 : o.side === "right" ? 1 : flip ? -A[2] : A[2];
      const f = Math.max(12, Math.min(16, size * .16)) / k, bb = bub(text, ax, A[1], f, dir), [sc, sp] = bubStroke(text), sw = sp / k;
      body += `<g class="cm-bub"><path d="${bb.d}" fill="${PAL.b}" stroke="${sc}" stroke-width="${n(sw)}" stroke-linejoin="round"/>` +
        `<text x="${n(bb.cx)}" y="${n(bb.ty)}" font-size="${n(f)}" font-weight="800" text-anchor="middle" fill="#0B1311" textLength="${n(bb.t)}" lengthAdjust="spacingAndGlyphs">${text}</text></g>`;
      x0 = Math.min(x0, bb.box[0] - sw); x1 = Math.max(x1, bb.box[2] + sw); y0 = Math.min(y0, bb.box[1] - sw);
    }
    const pad = c.ow / 2 + 1 / k; x0 -= pad; y0 -= pad; x1 += pad; y1 += pad;
    if (typeof document !== "undefined") css();
    const anim = o.anim !== false && !reduce();
    return `<svg class="cm-svg cm-p-${pose}${anim ? " cm-a" : ""}" xmlns="http://www.w3.org/2000/svg" viewBox="${n(x0)} ${n(y0)} ${n(x1 - x0)} ${n(y1 - y0)}" ` +
      `width="${Math.round((x1 - x0) * k)}" height="${Math.round((y1 - y0) * k)}" aria-hidden="true" focusable="false" font-family="${FONT.replace(/'/g, "")}">${body}</svg>`;
  }

  /* ---------------- Canvas painter ---------------- */
  const P2 = new Map(), path = d => { let p = P2.get(d); if (!p) { p = new Path2D(d); P2.set(d, p); } return p; };
  function cvPaint(g, st, c, p) {
    const f = st[0], s = st[1];
    if (f !== "N") { g.globalAlpha = ALPHA[f] || 1; g.fillStyle = PAL[f]; if (p) g.fill(p); else g.fill(); g.globalAlpha = 1; }
    if (s) { g.strokeStyle = PAL.K; g.lineWidth = s === "o" ? c.ow : lw(2, c); if (p) g.stroke(p); else g.stroke(); }
  }
  function cvOf(g, list, c) { for (const x of list) cvShape(g, x, c); }
  function cvShape(g, x, c) {
    const st = c.st;
    switch (x[0]) {
      case "G": { const f = x[1], nm = x[3]; let r = f.r ? f.r[0] : 0;
        if (nm === "ear") r += 18 * (st.ear || 0);                                   // ears lift outward on "Pull!"
        else if (nm === "earS") r -= 18 * (st.ear || 0);
        else if (nm === "tail") r += 10 * Math.sin(st.wag || 0);
        else if (nm === "tailS") r += 8 * Math.sin(st.wag || 0);
        else if (nm === "head" && c.lk != null) r += 6 * Math.cos(c.lk);
        else if (nm === "headS") r = c.headDeg;
        g.save(); if (f.t) g.translate(f.t[0], f.t[1]);
        if (r && f.r) { g.translate(f.r[1], f.r[2]); g.rotate(r * Math.PI / 180); g.translate(-f.r[1], -f.r[2]); }
        if (f.s) g.scale(f.s[0], f.s[1]);
        let kids = x[2]; if (nm === "head" && c.muffs && !kids.includes(MUFFS)) kids = kids.concat([MUFFS]);
        cvOf(g, kids, c); g.restore(); return; }
      case "D": if (!c.small) cvOf(g, x[1], c); return;
      case "Y": { g.save(); let dx = x[1], dy = x[2]; if (c.lk != null) { dx += 3 * Math.cos(c.lk); dy += 3 * Math.sin(c.lk); }
        g.translate(dx, dy); const b = Math.min(1, st.blink || 0); if (b) { g.translate(0, -12); g.scale(1, Math.max(.1, 1 - b)); g.translate(0, 12); }
        cvOf(g, c.small ? EYES_BIG : EYES, c); g.restore(); return; }
      case "P": cvPaint(g, x[2], c, path(x[1])); return;
      case "E": g.beginPath(); g.ellipse(x[1], x[2], x[3], x[4], (x[6] || 0) * Math.PI / 180, 0, 2 * Math.PI); cvPaint(g, x[5], c); return;
      case "C": g.beginPath(); g.arc(x[1], x[2], x[3], 0, 2 * Math.PI); cvPaint(g, x[4], c); return;
      case "R": g.beginPath(); if (x[6] && g.roundRect) g.roundRect(x[1], x[2], x[3], x[4], x[6]); else g.rect(x[1], x[2], x[3], x[4]); cvPaint(g, x[5], c); return;
      case "T": g.strokeStyle = PAL.K; g.lineWidth = tw(x, c); g.stroke(path(x[1])); g.strokeStyle = PAL[x[4]]; g.lineWidth = x[3]; g.stroke(path(x[1])); return;
      case "L": g.strokeStyle = PAL[x[3] || "K"]; g.lineWidth = lw(x[2], c); g.stroke(path(x[1])); return;
      case "X": g.fillStyle = PAL[x[5] || "q"]; g.font = `800 ${x[3]}px ${FONT}`; g.textAlign = "center"; g.textBaseline = "alphabetic"; g.fillText(x[4], x[1], x[2]); return;
    }
  }
  function draw(ctx, pose, x, y, scale, state) {
    const st = state || {}; if (!POSES.includes(pose)) pose = "sit";
    const side = st.view === "side", key = side ? "side" : pose, flip = !!st.flip, H = side ? H_SIDE : H_FRONT;
    const s = scale == null ? 1 : +scale, k = s * 100 / H, gnd = GROUND[key];
    /* look in the dog's own frame (it faces +x; a dog facing left mirrors the angle) */
    let lk = typeof st.look === "number" && isFinite(st.look) ? (flip ? Math.PI - st.look : st.look) : null;
    if (lk != null) lk = Math.atan2(Math.sin(lk), Math.cos(lk));
    const headDeg = lk == null ? -10 : Math.max(-40, Math.min(10, lk * 180 / Math.PI));
    const c = { k, small: s * 100 < 64, ow: Math.max(4, 1.5 / k), st, lk: side ? null : lk, headDeg, muffs: !!st.muffs && !side && pose !== "sleep" };
    ctx.save(); ctx.translate(x, y); ctx.scale(flip ? -k : k, k); ctx.translate(0, -gnd);
    ctx.lineJoin = "round"; ctx.lineCap = "round";
    cvOf(ctx, listOf(pose, { view: st.view, bubble: st.bubble }), c);
    ctx.restore();
    const sx = flip ? -k : k, at = (ux, uy) => [x + sx * ux, y + (uy - gnd) * k];
    const ra = headDeg * Math.PI / 180, head = side ? at(24 * Math.cos(ra) + 38 * Math.sin(ra), 24 * Math.sin(ra) - 38 * Math.cos(ra) + 24) : at(0, -6);
    const text = BUBBLES.includes(st.bubble) ? st.bubble : "";
    if (text) { // bubble in screen px (never mirrored), same shape as in svg()
      const A = ANCHOR[key], [ax, ay] = at(A[0], A[1]), f = Math.max(12, Math.min(16, s * 16)), bb = bub(text, ax, ay, f, flip ? -A[2] : A[2]), [sc, sp] = bubStroke(text);
      ctx.save(); const p = new Path2D(bb.d); ctx.fillStyle = PAL.b; ctx.fill(p); ctx.strokeStyle = sc; ctx.lineWidth = sp; ctx.lineJoin = "round"; ctx.stroke(p);
      ctx.fillStyle = "#0B1311"; ctx.font = `800 ${f}px ${FONT}`; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"; ctx.fillText(text, bb.cx, bb.ty, bb.t * 1.08); ctx.restore();
    }
    return { head, collar: side ? at(4, 40) : at(0, 84), top: y + (BOX[key][1] - gnd) * k };
  }

  /* ---------------- DOM: slots ---------------- */
  function mount(el, pose, o) {
    if (!el) return el; o = o || {};
    el.innerHTML = svg(pose, o); el.setAttribute("aria-hidden", "true"); if (el.classList) el.classList.add("cm-host"); return el;
  }
  function fromSlot(el) { const d = el.dataset;
    mount(el, d.clayMascot, { size: +d.size || 0, bubble: d.bubble || "", anim: d.anim !== "0", side: d.side, flip: d.flip === "1", view: d.view, muffs: d.muffs === "1" }); }
  function mountAll(root) {
    root = root || document; if (!root.querySelectorAll) return;
    if (root.matches && root.matches("[data-clay-mascot]") && !root.firstElementChild) fromSlot(root);
    root.querySelectorAll("[data-clay-mascot]").forEach(el => { if (!el.firstElementChild) fromSlot(el); });
  }
  window.ClayMascot = { POSES, BUBBLES, PALETTE: { fur: PAL.F, shade: PAL.S, cream: PAL.C, ink: PAL.K, emerald: PAL.E, clay: PAL.O },
    svg, draw, mount, mountAll, ready: true };
  if (typeof document === "undefined") return;
  function init() {
    css(); mountAll(document);
    try { new MutationObserver(recs => { for (const r of recs) for (const nd of r.addedNodes) if (nd.nodeType === 1 && !(nd.closest && nd.closest(".cm-svg"))) mountAll(nd); })
      .observe(document.documentElement, { childList: true, subtree: true }); } catch (e) {}
    try { document.dispatchEvent(new CustomEvent("claymascot:ready")); } catch (e) {}
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
