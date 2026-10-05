"""Check FITASC rulebooks for updates.

Reads the FITASC "Règlements sportifs" page, finds the current English rulebooks and referees'
quick guides for Sporting (pc) and Compak Sporting (cs), and compares them with rules/sources.json.

Usage:
  python scripts/fitasc_check.py              # report only; exit code 10 if anything changed
  python scripts/fitasc_check.py --download   # also download changed PDFs to rules/pdf/ and extract text
  python scripts/fitasc_check.py --accept     # after rebuilding the guide: write the new state to rules/sources.json
"""
import hashlib, json, re, subprocess, sys, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCES = ROOT / "rules" / "sources.json"
PDF_DIR = ROOT / "rules" / "pdf"
PAGE = "https://www.fitasc.com/disciplines-sportives/reglements-sportifs"
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


def main():
    old = json.loads(SOURCES.read_text(encoding="utf-8")) if SOURCES.exists() else {}
    new = current()
    changed = []
    for key, info in new.items():
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
                "потім `python scripts/fitasc_check.py --accept`.\n")
        report.write_text(text, encoding="utf-8")
        print(text)
    else:
        print("FITASC rulebooks: no changes")
    if "--accept" in sys.argv:
        for key, info in new.items():
            if "error" not in info and not info.get("sha256"):
                p = PDF_DIR / info["file"]
                if p.exists():
                    info["sha256"] = hashlib.sha256(p.read_bytes()).hexdigest()
        SOURCES.write_text(json.dumps(new, ensure_ascii=False, indent=2), encoding="utf-8")
        print("rules/sources.json updated")
        return 0
    return 10 if changed else 0


if __name__ == "__main__":
    sys.exit(main())
