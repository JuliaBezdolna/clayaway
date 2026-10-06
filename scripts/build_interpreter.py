"""Build ClayArena Interpreter Academy data (docs/interpreter/).

Sources (in the repo, edit these):
  docs/interpreter/src/missions/<mission>.json  master content, every text field {"en": ..., "uk": ...}
  docs/interpreter/src/ui.json                  interface strings {"key": {"en": ..., "uk": ...}}
  docs/interpreter/src/terms.json               terms {"langs": [...], "terms": [{id, en, group, def: {en, ...}, tr: {lang: {term, alt, note, conf, src}}}]}
  docs/interpreter/src/i18n/<lang>.json         translations for the other languages (same ids):
        {"ui": {key: text}, "terms": {id: def}, "term_tr": {id: {term, alt, note, conf}} (for terms missing in terms.json), "missions": {mid: {"title", "intro", "lessons": {lid: {"title", "body": [],
         "key_points": [], "coach_says": [{"meaning", "say"}], "quiz": [{"q", "options": [], "why"}]}}}}}
Output (generated, do not edit):
  docs/interpreter/data/<lang>.js  window.IA = {lang, ui, missions}   — one file per ClayArena language, English fallback per field
  docs/interpreter/data/terms.js   window.IA_TERMS = {langs, terms}

In production the same structure maps to ClayArena CMS entities: Mission, Lesson (translatable fields), CoachPhrase, QuizItem, Term.
Run: python scripts/build_interpreter.py
"""
import json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
D = ROOT / "docs" / "interpreter"
LANGS = ["en", "uk", "de", "fr", "it", "cs", "pl", "pt", "hu", "fi", "lt"]  # ClayArena site languages only
ORDER = ["sport", "gear", "targets", "flight", "basics", "lead", "faults", "sporting", "compak", "referee", "etiquette", "interpreter"]


def rules_titles():
    """Rule item id -> {en, uk} titles, read from the FITASC paraphrase data (used as link labels)."""
    out = {}
    for book in ("sporting", "compak"):
        s = (ROOT / "docs" / "rules" / "data" / f"{book}.js").read_text(encoding="utf-8")
        data = json.loads(re.search(r"window\.RULES\.push\((.*)\);\s*$", s, re.S).group(1))
        for sec in data["sections"]:
            for it in sec["items"]:
                out[(book, it["id"])] = {"en": f'{sec["chapter"]} · {it["title_en"]}', "uk": f'{sec["chapter"]} · {it["title_uk"]}'}
    # FITASC age categories (docs/rules/data/categories.js) — referenced as {"book": "categories", "id": "junior"}
    s = (ROOT / "docs" / "rules" / "data" / "categories.js").read_text(encoding="utf-8")
    cats = json.loads(re.search(r"window\.FITASC_CATEGORIES\s*=\s*(\{.*\})\s*;?\s*$", s, re.S).group(1))
    for c in cats["categories"]:
        out[("categories", c["id"])] = {"en": c["name_en"], "uk": c.get("name_uk", c["name_en"])}
    return out


def pick(v, lang, tr=None):
    """Text in `lang`: master {en, uk} field, else translation `tr`, else English."""
    if isinstance(v, dict):
        return v.get(lang) if v.get(lang) not in (None, "", []) else (tr if tr not in (None, "", []) else v.get("en"))
    return v


def main():
    RT = rules_titles()
    ui = json.loads((D / "src" / "ui.json").read_text(encoding="utf-8"))
    terms = json.loads((D / "src" / "terms.json").read_text(encoding="utf-8"))
    missions = {}
    for f in sorted((D / "src" / "missions").glob("*.json")):
        m = json.loads(f.read_text(encoding="utf-8")); missions[m["id"]] = m
    ms = [missions[k] for k in ORDER if k in missions] + [m for k, m in missions.items() if k not in ORDER]
    i18n = {}
    for l in LANGS:
        p = D / "src" / "i18n" / f"{l}.json"
        i18n[l] = json.loads(p.read_text(encoding="utf-8")) if p.exists() else {}
    (D / "data").mkdir(exist_ok=True)
    report = {}
    for l in LANGS:
        T = i18n[l]; TM = T.get("missions", {}); miss = 0
        out_ms = []
        for m in ms:
            tm = TM.get(m["id"], {}); tl = tm.get("lessons", {})
            lessons = []
            for les in m["lessons"]:
                x = tl.get(les["id"], {})
                if l not in ("en", "uk") and not x: miss += 1
                cs = []
                for k, c in enumerate(les.get("coach_says", [])):
                    xc = (x.get("coach_says") or [{}] * 99)[k] if k < len(x.get("coach_says") or []) else {}
                    say = c.get("say", {}) if isinstance(c.get("say"), dict) else {}
                    cs.append({"en": c["en"], "meaning": pick(c.get("meaning", {}), l, xc.get("meaning")),
                               "say": None if l == "en" else (say.get(l) or xc.get("say"))})
                qz = []
                for k, q in enumerate(les.get("quiz", [])):
                    xq = (x.get("quiz") or [])[k] if k < len(x.get("quiz") or []) else {}
                    qz.append({"q": pick(q["q"], l, xq.get("q")), "options": pick(q["options"], l, xq.get("options")),
                               "answer": q["answer"], "why": pick(q.get("why", {}), l, xq.get("why"))})
                lessons.append({"id": les["id"], "minutes": les.get("minutes", 5), "title": pick(les["title"], l, x.get("title")),
                                "body": pick(les["body"], l, x.get("body")), "key_points": pick(les.get("key_points", {}), l, x.get("key_points")) or [],
                                "terms": les.get("terms", []), "sources": les.get("sources", []), "sim": les.get("sim"),
                                "rule_refs": [dict(r, label=RT.get((r["book"], r["id"]), {}).get("uk" if l == "uk" else "en", r["id"]))
                                              for r in les.get("rule_refs", []) if (r["book"], r["id"]) in RT],
                                "coach_says": cs, "quiz": qz})
            out_ms.append({"id": m["id"], "icon": m.get("icon", ""), "title": pick(m["title"], l, tm.get("title")),
                           "intro": pick(m.get("intro", {}), l, tm.get("intro")), "lessons": lessons})
        u = {k: pick(v, l, T.get("ui", {}).get(k)) for k, v in ui.items()}
        (D / "data" / f"{l}.js").write_text(
            f"/* Generated by scripts/build_interpreter.py — do not edit; edit docs/interpreter/src/. Language: {l} */\n"
            f"window.IA = " + json.dumps({"lang": l, "ui": u, "missions": out_ms}, ensure_ascii=False) + ";\n", encoding="utf-8")
        report[l] = miss
    # terms: mission new_terms (EN/UK) join the shared list; translations add the local term ("term_tr") and the definition ("terms")
    known = {t["id"] for t in terms["terms"]}
    for m in ms:
        for nt in m.get("new_terms", []):
            if nt["id"] not in known:
                known.add(nt["id"]); terms["terms"].append({"id": nt["id"], "en": nt["en"], "group": nt.get("group", m["id"]),
                    "def": {k: v for k, v in (("en", nt.get("def_en")), ("uk", nt.get("def_uk"))) if v}, "tr": {"uk": {"term": nt["uk"], "conf": "medium"}} if nt.get("uk") else {}})
    for t in terms["terms"]:
        for l in LANGS:
            x = i18n[l].get("term_tr", {}).get(t["id"])
            if x and x.get("term") and l not in t["tr"]: t["tr"][l] = x
    # terms: add translated definitions from i18n
    for t in terms["terms"]:
        t.setdefault("def", {})
        for l in LANGS:
            d = i18n[l].get("terms", {}).get(t["id"])
            if d: t["def"][l] = d
    (D / "data" / "terms.js").write_text("/* Generated by scripts/build_interpreter.py — do not edit. */\nwindow.IA_TERMS = "
                                         + json.dumps(terms, ensure_ascii=False) + ";\n", encoding="utf-8")
    n = sum(len(m["lessons"]) for m in ms)
    print(f"missions {len(ms)}, lessons {n}, terms {len(terms['terms'])}; untranslated lessons per lang: {report}")


if __name__ == "__main__":
    main()
