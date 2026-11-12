// 3D animations of glossary terms (step by step, ClayArena shooter, real clay flight from the game physics).
// Source: the ClayArenaPromo project (src/glossary/*3d.js, three.js), exported here by its scripts/export_clayaway.mjs into
// docs/shared/3d/ (built JS, CSS, models, recorded voice, blocks.json). Do not edit docs/shared/3d/ by hand.
// This script puts the 3D block of each term of blocks.json into its glossary page, Ukrainian only for now
// (docs/glossary/<id>/index.html: the texts and the voice are Ukrainian; other languages when translated).
// The block goes right before the 2D animation (<div data-clay-term>) under its own heading, or before «Детально».
// Idempotent: a page that already has the block (class="l3") is left alone. build_seo.mjs calls it at the end;
// it can also run alone:  bun scripts/build_glossary3d.mjs   (or node)
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";

const DOCS = resolve(import.meta.dirname, "../docs");
const BLOCKS = `${DOCS}/shared/3d/blocks.json`;
export function buildGlossary3d() {
  if (!existsSync(BLOCKS)) { console.log("glossary 3D: no docs/shared/3d/blocks.json, skipped"); return 0; }
  const blocks = JSON.parse(readFileSync(BLOCKS, "utf8"));
  let n = 0;
  // ?v=<hash>: the export keeps the entry names (assets/call3d.js, glossary3d.css), so without it browsers keep the old copy
  const ver = (p) => createHash("sha1").update(readFileSync(`${DOCS}/shared/3d/${p}`)).digest("hex").slice(0, 8);
  const rel = "../../shared/3d/";
  const css = `<link rel="stylesheet" href="${rel}glossary3d.css?v=${ver("glossary3d.css")}">`;
  for (const [id, b] of Object.entries(blocks)) {
    const f = `${DOCS}/glossary/${id}/index.html`;
    if (!existsSync(f)) { console.log(`WARNING: glossary 3D: no page for ${id}`); continue; }
    let h = readFileSync(f, "utf8");
    if (h.includes('http-equiv="refresh"')) continue;
    const block = b.html + `\n<script type="module" src="${rel}${b.script}?v=${ver(b.script)}"></script>\n`;
    if (h.includes('class="l3"')) {   // already there: refresh it in place when the export changed it
      const h0 = h;
      h = h.replace(/<link rel="stylesheet" href="[^"]*shared\/3d\/glossary3d\.css[^"]*">/, css);
      const a = h.indexOf("<h2>Подивіться в 3D</h2>"), m = h.slice(a).match(/<script type="module" src="[^"]*shared\/3d\/[^"]*"><\/script>\n/);
      if (a < 0 || !m) { console.log(`WARNING: glossary 3D: broken block on ${id}`); continue; }
      const end = a + m.index + m[0].length;
      if (h.slice(a, end) !== block || h !== h0) { writeFileSync(f, h.slice(0, a) + block + h.slice(end)); n++; }
      continue;
    }
    const sim = h.search(/<div data-clay-term="/);
    if (sim >= 0) {
      // the 2D animation follows «Що це»: the 3D block goes before it, the 2D gets its own heading «Спробуйте самі»
      h = h.slice(0, sim) + block + "<h2>Спробуйте самі</h2>\n" + h.slice(sim);
    } else if (h.includes("<h2>Детально</h2>")) h = h.replace("<h2>Детально</h2>", block + "<h2>Детально</h2>");
    else { console.log(`WARNING: glossary 3D: no place for the block on ${id}`); continue; }
    if (!h.includes(css)) h = h.replace("</head>", `${css}\n</head>`);
    writeFileSync(f, h); n++;
  }
  console.log(`glossary 3D: ${n} pages updated, ${Object.keys(blocks).length} terms with 3D`);
  return n;
}
if (import.meta.main || process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) buildGlossary3d();
