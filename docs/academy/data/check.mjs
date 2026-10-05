globalThis.window = {};
for (const f of ["sporting","compak","guns","technique","organizer"]) { await import("./"+f+".js"); }
const M = window.ACADEMY;
const ids = {}; const dups = [];
for (const m of M) for (const t of m.terms) { if (ids[t.id]) dups.push(t.id+" ("+ids[t.id]+" & "+m.module+")"); else ids[t.id]=m.module; }
const missing = {};
for (const m of M) {
  for (const t of m.terms) for (const r of (t.related||[])) if (!ids[r]) (missing[r]=missing[r]||new Set()).add(m.module);
  for (const s of m.story) for (const k of ["text_en","text_uk"]) for (const mm of s[k].matchAll(/\[\[([a-z0-9-]+)/gi)) if (!ids[mm[1]]) (missing[mm[1]]=missing[mm[1]]||new Set()).add(m.module+":story");
}
console.log(M.map(m=>`${m.module}: terms ${m.terms.length}, story ${m.story.length}, quiz ${m.quiz.length}, practice ${m.practice.length}, verify ${m.terms.filter(t=>t.verify).length}`).join("\n"));
console.log("total unique terms", Object.keys(ids).length);
console.log("DUPLICATES", dups);
console.log("MISSING", Object.fromEntries(Object.entries(missing).map(([k,v])=>[k,[...v].join(",")])));
const all = JSON.stringify(M);
console.log("ru letters", (all.match(/[ыэъё]/gi)||[]).length, "Росі/Russia", (all.match(/Росі|Росси|Russia|русизм|русськ|російськ/gi)||[]));
