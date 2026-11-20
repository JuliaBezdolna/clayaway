/* Lesson diagrams (body block t:"diagram", 20.11.2026; style C «інфографіка з номерами», chosen by the owner from
   design-mockups/academy-figure.html). Our own drawings, so no media licence is needed (unlike t:"figure").
   A drawing here = geometry only: shapes (classes styled in academy.css and the static CSS of build_academy.mjs, .dg …),
   numbered dots {n, x, y} and text slots {d1}, {d2}… for the dimension texts. Every word comes from
   content/academy/diagrams.json: per language h (heading), cap (caption), labels [n-1] (the numbered legend), dims {d1…}.
   A language without its own text falls back to English (warning "diagram-fallback").
   Every label and number in a diagram must come from the lesson text or the rules data, never from outside. */

const dots = (n, f) => Array.from({ length: n }, (_, i) => f(i)).join("");

export const DIAGRAMS = {
  /* The cartridge cut lengthwise, the head on the left (lesson cartridges-anatomy) */
  "cartridge-cutaway": {
    vb: "40 70 520 250",
    svg: `<rect class="dg-c1" x="96" y="96" width="440" height="138" rx="3"/><rect class="dg-cut" x="104" y="104" width="424" height="122"/>
<path class="dg-c2" d="M58 86h20v6h80v146h-80v6h-20z"/><rect class="dg-c3" x="58" y="148" width="26" height="34" rx="2"/>
<rect class="dg-c4" x="158" y="104" width="54" height="122"/>${dots(28, i => `<circle class="dg-gr" cx="${164 + (i % 7) * 7.5}" cy="${114 + Math.floor(i / 7) * 28 + (i % 2) * 8}" r="1.8"/>`)}
<rect class="dg-c5" x="212" y="104" width="16" height="122"/><path class="dg-c5l" d="M228 112 l11 106 l11 -106 l11 106 l11 -106M272 106h194M272 224h194M272 106v118"/>
${dots(96, i => { const c = i % 16, r = Math.floor(i / 16); return `<circle class="dg-c6" cx="${282 + c * 11.8 + (r % 2) * 5}" cy="${116 + r * 19.5}" r="5"/>`; })}
<path class="dg-c7" d="M468 104 L530 165 L468 226 M498 104 L530 165 L498 226 M528 104 L530 165 L528 226"/>
<g class="dg-dm"><path d="M58 272v18M536 272v18M58 282h478"/><text x="297" y="306" text-anchor="middle">{d1}</text></g>`,
    n: [[360, 98], [70, 92], [71, 165], [185, 120], [245, 216], [400, 150], [515, 165]]
  },
  /* The Compak field from above, the shooters at the bottom (lesson targets-compak-layout); the trap places are an example */
  "compak-field": {
    vb: "88 10 504 440",
    svg: `<rect class="dg-zone" x="190" y="90" width="300" height="200"/>
${[[190, 290, "A"], [190, 90, "B"], [490, 90, "C"], [490, 290, "D"]].map(([x, y, k]) => `<g class="dg-peg"><circle cx="${x}" cy="${y}" r="4"/><path d="M${x} ${y}v-16l10 4-10 4"/><text x="${x + (x < 300 ? -12 : 12)}" y="${y + (y > 200 ? 18 : -6)}" text-anchor="${x < 300 ? "end" : "start"}">${k}</text></g>`).join("")}
<path class="dg-tr dg-tr1" d="M150 158 C 260 110, 420 112, 560 170"/><path class="dg-tr dg-tr2" d="M528 214 C 420 176, 270 180, 120 232"/><path class="dg-tr dg-tr3" d="M340 412 C 342 300, 350 170, 362 40"/>
${[[268, 1], [304, 2], [340, 3], [376, 4], [412, 5]].map(([x, n]) => `<g class="dg-stand"><rect x="${x - 9}" y="342" width="18" height="18" rx="2"/><text x="${x}" y="382" text-anchor="middle">${n}</text></g>`).join("")}
${[[136, 150, "A"], [112, 240, "B"], [340, 424, "C"], [538, 204, "D"], [552, 300, "E"], [250, 30, "F"]].map(([x, y, k]) => `<g class="dg-trap"><rect x="${x - 13}" y="${y - 13}" width="26" height="26" rx="4"/><text x="${x}" y="${y + 5}" text-anchor="middle">${k}</text></g>`).join("")}
<g class="dg-dm"><path d="M190 64v-14M490 64v-14M190 57h300"/><text x="420" y="48" text-anchor="middle">{d1}</text><path d="M158 90h14M158 290h14M165 90v200"/><text x="156" y="194" text-anchor="end">{d2}</text><path d="M232 292v48"/><text x="226" y="322" text-anchor="end">{d3}</text></g>`,
    n: [[480, 250], [452, 351, 421, 351], [575, 334, 556, 312], [556, 168], [505, 206], [356, 96]]
  },
  /* Where the shot went: the target flies to the right (lesson faults-behind-in-front) */
  "miss-directions": {
    vb: "40 10 640 372",
    svg: `<path class="dg-fly" d="M60 190 H592"/><path class="dg-flyh" d="M592 182 l14 8 -14 8z"/>
${[[200, 190], [460, 190], [330, 74], [330, 306]].map(([x, y]) => `<circle class="dg-pat" cx="${x}" cy="${y}" r="52"/>` + dots(22, i => { const a = i * 2.4, r = 10 + (i * 7) % 40; return `<circle class="dg-sh" cx="${(x + Math.cos(a) * r).toFixed(1)}" cy="${(y + Math.sin(a) * r).toFixed(1)}" r="2.2"/>`; })).join("")}
<ellipse class="dg-tg" cx="330" cy="190" rx="16" ry="6"/>
<rect class="dg-inset" x="540" y="262" width="124" height="104" rx="8"/><circle class="dg-pat" cx="585" cy="328" r="34"/><ellipse class="dg-tg" cx="612" cy="298" rx="14" ry="5"/><path class="dg-tg" d="M624 290 l8 -6 2 5z"/>`,
    n: [[160, 160], [500, 160], [300, 40], [288, 330], [628, 290]]
  },
  /* An over-and-under from the side, the muzzles on the right (lesson gun-parts); the numbers stand outside, with leaders */
  "gun-parts": {
    vb: "0 30 760 220",
    svg: `<path class="dg-pad" d="M30 94h14v96h-14z"/>
<path class="dg-wood" d="M44 92 L215 112 Q238 116 252 122 L262 140 L250 160 Q228 156 205 151 L44 190 Z"/>
<path class="dg-wood" d="M340 141 H462 Q474 141 474 150 Q474 159 462 159 H352 Q340 159 340 150 Z"/>
<rect class="dg-metal" x="252" y="108" width="86" height="52" rx="6"/>
<path class="dg-steel" d="M264 104h12v6h-12z"/><path class="dg-steel" d="M300 100 h30 v8 h-30z"/>
<path class="dg-guard" d="M262 160 Q262 192 284 192 Q306 192 306 160"/><path class="dg-steel-l" d="M282 160 q4 14 -2 22"/>
<rect class="dg-steel" x="338" y="112" width="392" height="13" rx="2"/><rect class="dg-steel" x="338" y="127" width="392" height="13" rx="2"/>
<path class="dg-rib" d="M338 109 H730"/><circle class="dg-bead" cx="727" cy="105" r="3.5"/>
<path class="dg-choke" d="M708 112v28"/>`,
    n: [[120, 228, 120, 160], [130, 54, 130, 104], [232, 228, 236, 150], [37, 228, 37, 180], [330, 228, 320, 152],
        [318, 54, 318, 100], [262, 54, 270, 104], [284, 228, 284, 190], [405, 228, 405, 158], [560, 228, 560, 139],
        [600, 54, 600, 109], [727, 54, 727, 101], [716, 228, 720, 136]]
  },
  /* The choke: the bore narrows near the muzzle (exaggerated), and what that does to the cloud of shot (lesson chokes-what-is-a-choke) */
  "choke-constriction": {
    vb: "20 20 680 380",
    svg: `<rect class="dg-steel" x="40" y="40" width="480" height="120" rx="4"/>
<path class="dg-bore" d="M40 60 H380 L460 75 H520 V125 H460 L380 140 H40 Z"/><path class="dg-chz" d="M380 60 L460 75 H520 M380 140 L460 125 H520"/>
<g class="dg-dm"><path d="M90 62v76M84 62h12M84 138h12"/><text x="102" y="105">{d1}</text><path d="M500 77v46M494 77h12M494 123h12"/><text x="540" y="105">{d2}</text></g>
<path class="dg-cone1" d="M60 250 L640 205 L640 295 Z"/>${dots(30, i => `<circle class="dg-sh" cx="${(120 + (i * 37) % 500).toFixed(0)}" cy="${(250 + (((i * 53) % 80) - 40) * ((120 + (i * 37) % 500) - 60) / 580).toFixed(1)}" r="2.4"/>`)}
<path class="dg-cone2" d="M60 350 L640 332 L640 368 Z"/>${dots(30, i => `<circle class="dg-sh" cx="${(120 + (i * 37) % 500).toFixed(0)}" cy="${(350 + (((i * 53) % 32) - 16) * ((120 + (i * 37) % 500) - 60) / 580).toFixed(1)}" r="2.4"/>`)}
<path class="dg-muz" d="M40 236v28M40 336v28"/>`,
    n: [[210, 100], [440, 100], [330, 250], [330, 350]]
  },
  /* One Sporting stand from above: the traps lettered from left to right as seen from the stand (lesson targets-sporting-layout) */
  "sporting-stand": {
    vb: "40 30 600 400",
    svg: `${[[150, 150, 34], [190, 130, 26], [600, 170, 30], [560, 150, 22], [330, 60, 26]].map(([x, y, r]) => `<circle class="dg-bush" cx="${x}" cy="${y}" r="${r}"/>`).join("")}
<path class="dg-tr dg-tr1" d="M170 180 C 260 120, 420 110, 560 120"/><path class="dg-tr dg-tr3" d="M330 92 C 335 70, 345 55, 350 40"/><path class="dg-tr dg-tr2" d="M570 200 C 500 210, 420 230, 360 236"/>
${[[170, 180, "A"], [330, 92, "B"], [570, 200, "C"]].map(([x, y, k]) => `<g class="dg-trap"><rect x="${x - 13}" y="${y - 13}" width="26" height="26" rx="4"/><text x="${x}" y="${y + 5}" text-anchor="middle">${k}</text></g>`).join("")}
<rect class="dg-menu" x="300" y="268" width="60" height="30" rx="3"/><path class="dg-menul" d="M308 277h44M308 284h44M308 291h30"/>
<rect class="dg-standb" x="310" y="312" width="40" height="40" rx="3"/><circle class="dg-man" cx="330" cy="332" r="8"/>
<rect class="dg-wait" x="250" y="370" width="160" height="48" rx="10"/>${[278, 304, 330, 356, 382].map(x => `<circle class="dg-man" cx="${x}" cy="394" r="8"/>`).join("")}
<path class="dg-view" d="M330 312 L170 194 M330 312 L330 106 M330 312 L556 206"/>`,
    n: [[392, 332, 350, 332], [392, 283, 360, 283], [120, 215, 158, 190], [110, 120, 128, 140], [450, 394, 410, 394]]
  },
  /* The stock dimensions: from the side (length of pull, comb height, pitch) and from above (cast, exaggerated) (lesson gun-fit) */
  "gun-fit": {
    vb: "10 30 710 300",
    svg: `<path class="dg-rib" d="M60 92 H520"/><path class="dg-steel" d="M330 96 H520 V122 H330 Z"/>
<path class="dg-wood" d="M66 104 L230 112 Q256 116 268 124 L278 142 L266 160 Q242 156 220 152 L66 196 Z"/><path class="dg-pad" d="M56 100 L68 104 L68 196 L50 204 Z"/>
<rect class="dg-metal" x="268" y="104" width="64" height="50" rx="5"/><path class="dg-guard" d="M276 154 Q276 182 296 182 Q314 182 314 154"/><path class="dg-steel-l" d="M294 154 q4 12 -2 20"/>
<g class="dg-dm"><path d="M58 236 H294 M58 228v16 M294 228v16 M294 182v46"/><text x="176" y="262" text-anchor="middle">{d1}</text>
<path d="M120 92v15 M114 92h12 M114 107h12" /><path class="dg-pitch" d="M60 70 L46 230"/></g>
<path class="dg-steel" d="M640 40 h16 v130 h-16z"/><path class="dg-wood" d="M640 170 h16 l22 140 h-22 z"/><path class="dg-axis" d="M648 40 V318"/>`,
    n: [[176, 292, 176, 236], [160, 56, 120, 99], [30, 262, 47, 222], [700, 230, 670, 250]]
  },
  /* The dominant-eye test from above: a small triangle of the hands, a distant object (lesson technique-master-eye) */
  "master-eye-test": {
    vb: "40 20 620 400",
    svg: `<circle class="dg-obj" cx="320" cy="60" r="16"/><circle class="dg-ghost" cx="370" cy="60" r="16"/>
<path class="dg-sight1" d="M370 360 L320 60"/><path class="dg-sight2" d="M310 360 L370 60"/>
<path class="dg-hands" d="M314 220 L366 220 L340 186 Z" /><path class="dg-arm" d="M300 380 L318 226 M380 380 L362 226"/>
<ellipse class="dg-face" cx="340" cy="378" rx="62" ry="34"/>
<circle class="dg-eye1" cx="370" cy="362" r="9"/><path class="dg-eye2" d="M300 362 h20"/>`,
    n: [[260, 60, 304, 60], [420, 205, 358, 208], [440, 330, 378, 358], [440, 60, 386, 60]]
  }
};

/* <figure class="dg"> heading, drawing (numbers on it), the numbered legend, the caption. T = {h, cap, labels, dims}, esc = the
   build's HTML escaper. Returns "" for an unknown diagram (the structure check reports it). */
export function diagramHtml(id, T, esc, anchor) {
  const D = DIAGRAMS[id]; if (!D || !T) return "";
  const hid = `dg-${id}`;
  const svg = D.svg.replace(/\{(d\d+)\}/g, (_, k) => esc((T.dims || {})[k] || ""));
  const nums = D.n.map(([x, y, px, py], i) => `${px != null ? `<path class="dg-ld" d="M${x} ${y}L${px} ${py}"/><circle class="dg-ldd" cx="${px}" cy="${py}" r="3"/>` : ""}<g class="dg-n"><circle cx="${x}" cy="${y}" r="14"/><text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central">${i + 1}</text></g>`).join("");
  return `<figure class="dg"${anchor ? ` id="${esc(anchor)}"` : ""} aria-labelledby="${hid}"><p class="dg-h" id="${hid}">${esc(T.h)}</p>` +
    `<svg class="dg-svg" viewBox="${D.vb}" role="img" aria-labelledby="${hid}" focusable="false">${svg}${nums}</svg>` +
    `<ol class="dg-leg">${T.labels.map((l, i) => `<li><b aria-hidden="true">${i + 1}</b>${esc(l)}</li>`).join("")}</ol>` +
    (T.cap ? `<figcaption>${esc(T.cap)}</figcaption>` : "") + `</figure>`;
}

/* Problems of a diagram text set (structure check): the legend must have one label per numbered dot */
export function diagramProblem(id, T) {
  const D = DIAGRAMS[id]; if (!D) return `unknown diagram "${id}" (scripts/academy/diagrams.mjs)`;
  if (!T || !T.h || !Array.isArray(T.labels)) return `no English text for "${id}" in content/academy/diagrams.json`;
  if (T.labels.length !== D.n.length) return `"${id}": ${T.labels.length} labels for ${D.n.length} numbers`;
  const need = [...D.svg.matchAll(/\{(d\d+)\}/g)].map(m => m[1]).filter(k => !(T.dims || {})[k]);
  return need.length ? `"${id}": no dimension text ${need.join(", ")}` : null;
}

/* The CSS of a diagram: the same rules for the app (#app, academy.css) and for the static page (.st, build_academy.mjs) */
export const DIAGRAM_CSS = `figure.dg{margin:20px 0 26px;padding:16px;border-radius:16px;background:#111827;border:1px solid rgba(255,255,255,.08);min-width:0}
figure.dg .dg-h{font-size:19px;font-weight:700;color:#F3F4F6;margin:0 0 10px;max-width:none;line-height:1.35}
.dg-svg{display:block;width:100%;max-width:680px;height:auto;margin:0 auto;font-family:inherit}
figure.dg .dg-leg{margin:12px 0 0;padding:0;list-style:none;columns:2 240px;column-gap:20px}
figure.dg .dg-leg li{display:flex;gap:10px;align-items:baseline;font-size:15px;line-height:1.45;color:#D1D5DB;margin:0 0 6px;break-inside:avoid}
figure.dg .dg-leg b{flex:none;display:inline-grid;place-items:center;width:22px;height:22px;border-radius:50%;font-size:12.5px;font-weight:700;background:#34D399;color:#06101d}
figure.dg figcaption{font-size:14px;color:#9CA3AF;margin-top:10px;line-height:1.5}
.dg text{fill:#E5E7EB;font-size:14px}
.dg-n circle{fill:#34D399;stroke:#06101d;stroke-width:2}.dg .dg-n text{fill:#06101d;font-size:15px;font-weight:700}
.dg-dm path{stroke:#9CA3AF;stroke-width:1;fill:none}.dg .dg-dm text{fill:#9CA3AF;font-size:13px}
.dg-c1{fill:#2563EB;stroke:#0b0f14;stroke-width:2}.dg-cut{fill:#0f172a}.dg-c2{fill:#D4A373;stroke:#0b0f14;stroke-width:2}.dg-c3{fill:#F59E0B;stroke:#0b0f14;stroke-width:2}
.dg-c4{fill:#475569}.dg-gr{fill:#1f2937}.dg-c5{fill:#10B981}.dg-c5l{fill:none;stroke:#10B981;stroke-width:3}.dg-c6{fill:#E5E7EB;stroke:#0f172a;stroke-width:1}.dg-c7{fill:none;stroke:#60A5FA;stroke-width:3}
.dg-zone{fill:#14532D;stroke:#22C55E;stroke-width:2}.dg-peg circle{fill:#fff}.dg-peg path{fill:#EF4444;stroke:#fff}.dg .dg-peg text{font-weight:700;font-size:15px}
.dg-stand rect{fill:#E5E7EB}.dg .dg-stand text{font-weight:700}.dg-trap rect{fill:#F59E0B}.dg .dg-trap text{fill:#111827;font-weight:800}
.dg-tr{fill:none;stroke-width:5;stroke-linecap:round}.dg-tr1{stroke:#38BDF8}.dg-tr2{stroke:#A78BFA}.dg-tr3{stroke:#F472B6}
.dg-fly{stroke:#475569;stroke-width:3}.dg-flyh{fill:#475569}.dg-pat{fill:rgba(56,189,248,.18);stroke:#38BDF8;stroke-width:2}.dg-sh{fill:#38BDF8}.dg-tg{fill:#F97316}.dg-inset{fill:#0f172a}
.dg-ld{stroke:#E5E7EB;stroke-width:1.5;fill:none}.dg-ldd{fill:#E5E7EB}
.dg-wood{fill:#B07A4A;stroke:#0b0f14;stroke-width:2}.dg-pad{fill:#374151;stroke:#0b0f14;stroke-width:2}.dg-metal{fill:#9CA3AF;stroke:#0b0f14;stroke-width:2}.dg-steel{fill:#64748B;stroke:#0b0f14;stroke-width:1.5}
.dg-steel-l{fill:none;stroke:#CBD5E1;stroke-width:3;stroke-linecap:round}.dg-guard{fill:none;stroke:#94A3B8;stroke-width:4}.dg-rib{stroke:#E5E7EB;stroke-width:4}.dg-bead{fill:#FBBF24}.dg-choke{stroke:#60A5FA;stroke-width:4}
.dg-bore{fill:#0f172a}.dg-chz{fill:none;stroke:#60A5FA;stroke-width:4}.dg-muz{stroke:#94A3B8;stroke-width:6}.dg-cone1{fill:rgba(56,189,248,.16);stroke:#38BDF8;stroke-width:2}.dg-cone2{fill:rgba(167,139,250,.2);stroke:#A78BFA;stroke-width:2}
.dg-bush{fill:#166534}.dg-menu{fill:#F3F4F6}.dg-menul{stroke:#374151;stroke-width:2}.dg-standb{fill:none;stroke:#E5E7EB;stroke-width:3}.dg-man{fill:#FBBF24}.dg-wait{fill:rgba(255,255,255,.06);stroke:#6B7280;stroke-dasharray:6 5}.dg-view{fill:none;stroke:#6B7280;stroke-width:1.5;stroke-dasharray:3 5}
.dg-pitch{stroke:#F472B6;stroke-width:3;stroke-dasharray:6 4}.dg-axis{stroke:#6B7280;stroke-dasharray:4 4}
.dg-obj{fill:#F97316}.dg-ghost{fill:none;stroke:#F97316;stroke-width:2;stroke-dasharray:4 4}.dg-sight1{stroke:#34D399;stroke-width:2.5}.dg-sight2{stroke:#9CA3AF;stroke-width:2;stroke-dasharray:6 5}
.dg-hands{fill:rgba(212,163,115,.25);stroke:#D4A373;stroke-width:5;stroke-linejoin:round}.dg-arm{stroke:#D4A373;stroke-width:8;stroke-linecap:round}.dg-face{fill:#374151}.dg-eye1{fill:#F3F4F6;stroke:#34D399;stroke-width:3}.dg-eye2{stroke:#F3F4F6;stroke-width:3;stroke-linecap:round}
@media (max-width:560px){.dg-n circle{r:19px}.dg .dg-n text{font-size:20px}.dg .dg-trap text,.dg .dg-stand text,.dg .dg-peg text{font-size:18px}figure.dg{margin-left:-16px;margin-right:-16px;border-radius:0;border-left:0;border-right:0}}`;
