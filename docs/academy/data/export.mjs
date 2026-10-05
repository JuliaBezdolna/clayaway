globalThis.window = {};
for (const f of ["sporting","compak","guns","technique","organizer"]) { await import("./"+f+".js"); }
const seen = {}; const terms = [];
for (const m of window.ACADEMY.sort((a,b)=>a.order-b.order)) for (const t of m.terms) {
  if (seen[t.id]) { seen[t.id].also_in = [...(seen[t.id].also_in||[]), m.module]; continue; }
  const x = { module: m.module, ...t }; seen[t.id] = x; terms.push(x);
}
await Bun.write("../glossary.json", JSON.stringify({ source: "ClayAway Academy (Vika)", version: "draft-2026-10-05", count: terms.length, terms }, null, 1));
console.log("glossary terms", terms.length);
