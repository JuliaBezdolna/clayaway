"""Shared helpers of the project checks in tools/checks/ (README.md next to this file).

Every path is relative to the repository: ROOT is two folders above this file, so the checks run the same on any clone,
on any machine and in CI. Nothing here writes into docs/; outputs go to tools/checks/out/ (ignored by git) or to --out.
"""
import functools, http.server, pathlib, socketserver, sys, threading

for _s in (sys.stdout, sys.stderr):   # Windows consoles default to a legacy code page; the checks print 11 languages
    try: _s.reconfigure(encoding="utf-8", errors="replace")
    except Exception: pass

ROOT = pathlib.Path(__file__).resolve().parents[2]   # the repository root
DOCS = ROOT / "docs"                                 # the published site (GitHub Pages: main /docs)
OUT = pathlib.Path(__file__).resolve().parent / "out"


def opt(name, default=None):
    """Value of a "--name value" command-line option."""
    a = sys.argv[1:]
    return a[a.index(name) + 1] if name in a and a.index(name) + 1 < len(a) else default


def flag(name):
    return name in sys.argv[1:]


def check_args(valued, flags):
    """Stop on an unknown option (a typo must never fall through to a different run)."""
    a, i = sys.argv[1:], 0
    while i < len(a):
        if a[i] in valued:
            if i + 1 >= len(a) or a[i + 1].startswith("--"):
                sys.exit(f"ERROR: {a[i]} needs a value")
            i += 2
            continue
        if a[i] in ("-h", "--help"):
            print(sys.modules["__main__"].__doc__)
            sys.exit(0)
        if a[i] not in flags:
            sys.exit(f"ERROR: unknown option {a[i]}")
        i += 1


def launch(p):
    """Headless Chromium. Default: the browser installed by `python -m playwright install chromium`.
    --chrome: the installed Google Chrome instead (the pixel limits of check_safety.py P1 were measured in Chrome on 08.10.2026;
    the Playwright Chromium passes them too, 09.10.2026)."""
    return p.chromium.launch(headless=True, **({"channel": "chrome"} if flag("--chrome") else {}))


def serve(site):
    """Serve a site folder on 127.0.0.1 with a free port. Returns (base_url, stop).
    A test build (bun scripts/build_seo.mjs --out <folder>) holds only the GENERATED files; every other file (the Academy app,
    shared/nav.js, mascot.js, the hand-written pages) is served from docs/, as the real site would have it."""
    roots = [pathlib.Path(site).resolve()] + ([DOCS] if pathlib.Path(site).resolve() != DOCS.resolve() else [])

    class Quiet(http.server.SimpleHTTPRequestHandler):
        extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map,
                          ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8",
                          ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8"}

        def translate_path(self, path):
            for r in roots:                      # first the site folder, then docs/
                self.directory = str(r)
                p = super().translate_path(path)
                f = pathlib.Path(p) / "index.html" if pathlib.Path(p).is_dir() else pathlib.Path(p)
                if f.exists():
                    return p
            self.directory = str(roots[0])
            return super().translate_path(path)

        def log_message(self, *a):
            pass

    class Server(socketserver.ThreadingTCPServer):
        daemon_threads = True
        request_queue_size = 256   # several pages load ~15 files at once; the default backlog of 5 refuses connections on a busy PC

    srv = Server(("127.0.0.1", 0), functools.partial(Quiet, directory=str(roots[0])))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return f"http://127.0.0.1:{srv.server_address[1]}/", srv.shutdown

