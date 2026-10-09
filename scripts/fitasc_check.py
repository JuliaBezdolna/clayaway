"""Check FITASC rulebooks for updates.

Reads the FITASC "Règlements sportifs" page, finds the current English rulebooks and referees'
quick guides for Sporting (pc) and Compak Sporting (cs), and compares them with rules/sources.json.
Also fetches the FITASC age-categories page and compares the SHA-256 of the visible text of its
category and national-team tables (key "categories_page"; source of docs/rules/data/categories.js).

Usage:
  python scripts/fitasc_check.py              # report only; exit code 10 if anything changed
  python scripts/fitasc_check.py --download   # also download changed PDFs to rules/pdf/ and extract text
  python scripts/fitasc_check.py --accept     # after rebuilding the guide: write the new state to rules/sources.json
  python scripts/fitasc_check.py --fetch      # fresh clone: download the PDFs of rules/sources.json missing in rules/pdf/ + their text

rules/pdf/ is not in git (FITASC copyright). The Academy build reads its text (rules/pdf/*.txt, made by pdftotext from Poppler)
for the "10 words in a row" check (fitasc-verbatim); without it that check is skipped with the warning fitasc-cache-missing.
"""
import datetime, hashlib, html as htmllib, json, re, subprocess, sys, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCES = ROOT / "rules" / "sources.json"
PDF_DIR = ROOT / "rules" / "pdf"
PAGE = "https://www.fitasc.com/disciplines-sportives/reglements-sportifs"
CATEGORIES_PAGE = "https://www.fitasc.com/competitions/categories"
UA = {"User-Agent": "Mozilla/5.0 (ClayArena rules check)"}
PATTERNS = {
    "sporting_rules": r"https://api\.fitasc\.com/media/[^\"']*rglt-pc-eng[^\"']*\.pdf",
    "compak_rules": r"https://api\.fitasc\.com/media/[^\"']*rglt-cs-eng[^\"']*\.pdf",
    "sporting_quick_guide": r"https?://[^\"']*pc_quick_ref_[^\"']*\.pdf",
    "compak_quick_guide": r"https?://[^\"']*cs_quick_ref_[^\"']*\.pdf",
}


def get(url, method="GET"):
    req = urllib.request.Request(url, headers=UA, method=method)
    return urllib.request.urlopen(req, timeout=60)


def current():
    html = get(PAGE).read().decode("utf-8", "replace")
    found = {}
    for key, pat in PATTERNS.items():
        m = re.search(pat, html)
        if not m:
            found[key] = {"error": "link not found on the FITASC page"}
            continue
        url = m.group(0)
        with get(url, "HEAD") as r:
            found[key] = {"url": url, "file": url.rsplit("/", 1)[-1],
                          "last_modified": r.headers.get("Last-Modified", ""),
                          "size": int(r.headers.get("Content-Length") or 0)}
    return found


def categories_page():
    """Visible text of the age-category and national-team tables (the tables for the combined hunting
    discipline further down the page are left out), tags stripped and spaces normalised."""
    try:
        page = get(CATEGORIES_PAGE).read().decode("utf-8", "replace")
    except Exception as e:
        return {"error": f"categories page not reachable: {e}"}
    first = page.lower().find("<table")
    stop = re.compile(r"COMBIN(?:É|&Eacute;|&#201;|E)\s+DE\s+CHASSE", re.I).search(page, max(first, 0))
    end = stop.start() if stop else len(page)  # the hunting-combined section starts after the first tables
    tables = [m.group(0) for m in re.finditer(r"<table\b.*?</table>", page[:end], re.S | re.I)]
    if not tables:
        return {"error": "categories table not found on the FITASC page"}
    text = " ".join(re.sub(r"\s+", " ", htmllib.unescape(re.sub(r"<[^>]+>", " ", t))).strip() for t in tables)
    return {"url": CATEGORIES_PAGE, "sha256": hashlib.sha256(text.encode("utf-8")).hexdigest(),
            "checked": datetime.date.today().isoformat()}


def download(key, info):
    PDF_DIR.mkdir(parents=True, exist_ok=True)
    path = PDF_DIR / info["file"]
    data = get(info["url"]).read()
    path.write_bytes(data)
    info["sha256"] = hashlib.sha256(data).hexdigest()
    try:
        subprocess.run(["pdftotext", "-layout", str(path), str(path.with_suffix(".txt"))], check=True)
    except Exception as e:  # pdftotext missing on the machine
        print(f"  text extraction skipped: {e}")
    return path


def fetch_missing(old):
    """--fetch (a fresh clone): rules/pdf/ is not in git (FITASC copyright). Download every document of rules/sources.json that is
    missing here, compare its SHA-256 with the stored one and extract its text (pdftotext, Poppler) for the build's
    10-words-in-a-row check (scripts/academy/lint.mjs). Never published. Exit code 1 if a file is not the one in sources.json."""
    differ = 0
    for key, info in old.items():
        if key == "categories_page" or "url" not in info:
            continue
        pdf = PDF_DIR / info["file"]
        if pdf.exists() and pdf.with_suffix(".txt").exists():
            continue
        got = download(key, dict(info))
        sha = hashlib.sha256(got.read_bytes()).hexdigest()
        if info.get("sha256") and sha != info["sha256"]:
            differ += 1
            print(f"  WARNING {key}: {info['url']} is not the file of rules/sources.json (sha256 {sha[:12]} != {info['sha256'][:12]}): run the update check")
        print("  fetched", got)
    return 1 if differ else 0


def main():
    old = json.loads(SOURCES.read_text(encoding="utf-8")) if SOURCES.exists() else {}
    if "--fetch" in sys.argv:
        return fetch_missing(old)
    new = current()
    changed = []
    cat = categories_page()
    prev_cat = old.get("categories_page", {})
    if "error" in cat:
        changed.append(f"- **categories_page**: {cat['error']}")
        new["categories_page"] = prev_cat or cat  # keep the stored baseline
    else:
        if cat["sha256"] != prev_cat.get("sha256"):
            changed.append(f"- **categories_page**: the text of the age-category tables changed "
                           f"({prev_cat.get('sha256', '-')[:12]} -> {cat['sha256'][:12]})\n  {cat['url']}")
        new["categories_page"] = cat
    for key, info in new.items():
        if key == "categories_page":
            continue
        prev = old.get(key, {})
        if "error" in info:
            changed.append(f"- **{key}**: {info['error']}")
            continue
        if (info["url"], info["last_modified"], info["size"]) != (prev.get("url"), prev.get("last_modified"), prev.get("size")):
            changed.append(f"- **{key}**: {prev.get('file', '—')} ({prev.get('last_modified', '—')}) → "
                           f"{info['file']} ({info['last_modified']}, {info['size']} bytes)\n  {info['url']}")
            if "--download" in sys.argv:
                print("  downloaded", download(key, info))
        else:
            info["sha256"] = prev.get("sha256", "")
    report = ROOT / "rules" / "update_report.md"
    if changed:
        text = ("# Оновився регламент FITASC\n\nЗмінилися документи:\n\n" + "\n".join(changed) +
                "\n\nЩо зробити: завантажити нові PDF (`python scripts/fitasc_check.py --download`), "
                "оновити `docs/rules/data/*.js` за новим текстом (номери сторінок, цифри, нові статті), "
                "потім `python scripts/fitasc_check.py --accept`.\n"
                "Якщо змінилася таблиця категорій (categories_page): звірити сторінку FITASC і оновити "
                "`docs/rules/data/categories.js`, терміни категорій у глосарії та уроки Академії, потім `--accept`.\n")
        report.write_text(text, encoding="utf-8")
        print(text)
    else:
        print("FITASC rulebooks and categories page: no changes")
    if "--accept" in sys.argv:
        for key, info in new.items():
            if key != "categories_page" and "error" not in info and not info.get("sha256"):
                p = PDF_DIR / info["file"]
                if p.exists():
                    info["sha256"] = hashlib.sha256(p.read_bytes()).hexdigest()
        SOURCES.write_text(json.dumps(new, ensure_ascii=False, indent=2), encoding="utf-8")
        print("rules/sources.json updated")
        return 0
    return 10 if changed else 0


if __name__ == "__main__":
    sys.exit(main())
