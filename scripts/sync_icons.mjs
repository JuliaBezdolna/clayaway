// Writes the copies of the line icons (scripts/icons.mjs) into the runtime files, between the markers
//   /* icons:begin <VAR> <key> <key> … */ … /* icons:end */
// bun scripts/sync_icons.mjs           rewrite the copies
// and into the static HTML: <span|div … data-ico="<key>"></span|div> gets the inline <svg> of that icon.
// bun scripts/sync_icons.mjs --check   exit 1 when a copy differs (run before a push, like check_links)
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { ICONS, svgIcon } from "./icons.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const FILES = ["docs/learn/app/academy.js", "docs/shared/nav.js", "docs/shared/sims.js", "docs/shared/offline-pack.js",
  "docs/rules/index.html", "docs/rules/trainer/index.html", "docs/offline.html"];
const TAG = /(<(span|div)\b[^>]*\sdata-ico="([\w-]+)"[^>]*>)(?:<svg[\s\S]*?<\/svg>)?(<\/\2>)/g;
const RE = /\/\* icons:begin (\w+) ([\w -]+?) \*\/[\s\S]*?\/\* icons:end \*\//g;
const check = process.argv.includes("--check");
let bad = 0;
for (const f of FILES) {
  const p = join(ROOT, f), src = readFileSync(p, "utf8");
  let n = 0;
  const out = src.replace(TAG, (_, open, tag, k, close) => { n++; return open + svgIcon(k) + close; }).replace(RE, (_, v, keys) => {
    n++;
    const ks = keys.trim().split(/\s+/);
    for (const k of ks) if (!ICONS[k]) throw new Error(`${f}: unknown icon "${k}"`);
    return `/* icons:begin ${v} ${ks.join(" ")} */const ${v} = {${ks.map(k => `${JSON.stringify(k)}:'${ICONS[k]}'`).join(",")}};/* icons:end */`;
  });
  if (!n) { console.error(`${f}: no icons:begin marker and no data-ico`); bad++; continue; }
  if (out !== src) {
    if (check) { console.error(`${f}: icons differ from scripts/icons.mjs (run bun scripts/sync_icons.mjs)`); bad++; }
    else { writeFileSync(p, out); console.log(`${f}: icons written`); }
  } else console.log(`${f}: ok`);
}
process.exit(bad ? 1 : 0);
