/* Shared law-table renderer (Academy app + static build). */
/* Law tables for lessons: lesson.law_tables = [{code, part}], data window.LAWS[code] (scripts/build_laws.py).
   part "states" = German federal states; "lead" = country lead-shot rules; "travel" = bringing a shotgun to a competition. */
function lawTablesHtml(list, lang, esc, nf){
  const u = lang === "uk", cell = 'style="padding:8px 10px;border-bottom:1px solid rgba(255,255,255,.1);vertical-align:top"';
  const th = h => `<th style="text-align:left;padding:8px 10px;border-bottom:1px solid rgba(255,255,255,.1);font-size:12px;opacity:.75">${h}</th>`;
  const link = x => x.url ? `<a href="${esc(x.url)}" ${nf}>${esc(x.law)}${x.article && x.article !== "—" ? ", " + esc(x.article) : ""} ↗</a>` : esc(x.law || "—");
  const unv = x => x.verified === false ? ` <span style="color:#FB923C;font-size:12px">${u ? "(не підтверджено офіційним текстом)" : "(not confirmed by an official text)"}</span>` : "";
  return (list || []).map(t => { const D = (window.LAWS || {})[t.code]; if (!D) return "";
    const box = (title, head, rows) => `<h3 style="margin:18px 0 6px">${title}</h3><p style="font-size:13px;opacity:.8;margin:0 0 6px">${esc(u ? D.note_uk : D.note_en)} (${esc(D.as_of)})</p><div style="overflow-x:auto;border:1px solid rgba(255,255,255,.1);border-radius:12px"><table style="border-collapse:collapse;width:100%;font-size:14px"><thead><tr>${head.map(th).join("")}</tr></thead><tbody>${rows}</tbody></table></div>`;
    if (t.part === "states") return box(u ? "Німеччина по землях: свинцевий дріб" : "Germany by state: lead shot", u ? ["Земля", "Норма", "Що заборонено", "З"] : ["State", "Rule", "What is banned", "Since"],
      D.states.map(x => `<tr><td ${cell}><b>${esc(u ? x.state_uk : x.state_en)}</b><br><span style="font-size:12px;opacity:.7">${esc(x.state_de)}</span></td><td ${cell}>${link(x)}</td><td ${cell}>${esc(u ? x.rule_uk : x.rule_en)}${unv(x)}</td><td ${cell}>${esc(x.since || "—")}</td></tr>`).join(""));
    const name = u ? D.country_uk : D.country_en;
    if (t.part === "lead") return box(`${name}: ${u ? "свинцевий дріб" : "lead shot"}`, u ? ["Де", "Норма", "Правило", "З"] : ["Where", "Rule", "What applies", "Since"],
      (D.lead || []).map(x => `<tr><td ${cell}><b>${esc(u ? x.scope_uk : x.scope_en)}</b></td><td ${cell}>${link(x)}</td><td ${cell}>${esc(u ? x.rule_uk : x.rule_en)}${unv(x)}</td><td ${cell}>${esc(x.since || "—")}</td></tr>`).join(""));
    if (t.part === "travel") return box(`${name}: ${u ? "рушниця на змагання" : "bringing a shotgun to a competition"}`, u ? ["Питання", "Норма", "Правило"] : ["Topic", "Rule", "What applies"],
      (D.travel || []).map(x => `<tr><td ${cell}><b>${esc(u ? x.topic_uk : x.topic_en)}</b></td><td ${cell}>${link(x)}</td><td ${cell}>${esc(u ? x.rule_uk : x.rule_en)}${unv(x)}</td></tr>`).join(""));
    return ""; }).join("");
}

if (typeof globalThis !== 'undefined') globalThis.lawTablesHtml = lawTablesHtml;
