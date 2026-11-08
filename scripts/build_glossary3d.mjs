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

const DOCS = resolve(import.meta.dirname, "../docs");
const BLOCKS = `${DOCS}/shared/3d/blocks.json`;
export function buildGlossary3d() {
  if (!existsSync(BLOCKS)) { console.log("glossary 3D: no docs/shared/3d/blocks.json, skipped"); return 0; }
  const blocks = JSON.parse(readFileSync(BLOCKS, "utf8"));
  let n = 0;
  for (const [id, b] of Object.entries(blocks)) {
    const f = `${DOCS}/glossary/${id}/index.html`;
    if (!existsSync(f)) { console.log(`WARNING: glossary 3D: no page for ${id}`); continue; }
    let h = readFileSync(f, "utf8");
    if (h.includes('class="l3"') || h.includes('http-equiv="refresh"')) continue;
    const rel = "../../shared/3d/";
    const block = b.html + `\n<script type="module" src="${rel}${b.script}"></script>\n`;
    const sim = h.search(/<div data-clay-term="/);
    if (sim >= 0) {
      // the 2D animation follows «Що це»: the 3D block goes before it, the 2D gets its own heading «Спробуйте самі»
      h = h.slice(0, sim) + block + "<h2>Спробуйте самі</h2>\n" + h.slice(sim);
    } else if (h.includes("<h2>Детально</h2>")) h = h.replace("<h2>Детально</h2>", block + "<h2>Детально</h2>");
    else { console.log(`WARNING: glossary 3D: no place for the block on ${id}`); continue; }
    h = h.replace("</head>", `<link rel="stylesheet" href="${rel}glossary3d.css">\n</head>`);
    writeFileSync(f, h); n++;
  }
  console.log(`glossary 3D: ${n} pages updated, ${Object.keys(blocks).length} terms with 3D`);
  return n;
}
if (import.meta.main || process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) buildGlossary3d();
