"""Quiz test of every Academy lesson in every published language, in headless Chromium (Playwright).

What it does for each lesson page (/learn/<id>/ in uk, /<lang>/learn/<id>/ in the 10 other languages), exactly as a reader would:
  1. opens the page and waits until the Academy app has drawn the quiz (section.ac-quiz);
  2. answers the questions: 1st and 3rd with the right option, 2nd with a wrong one (so both paths are tested);
  3. after each answer checks: the pressed option has aria-pressed="true" (and only it), the right option is marked .right and the
     pressed wrong one .wrong, all options are locked (aria-disabled), the explanation starts with the "correct"/"wrong" word of the
     page language and contains the explanation from the lesson data, and the pressed option did not jump on screen by more than
     20 px (layout shift: e.g. the dog moving from one explanation to the next);
  4. at the end checks the score line ("2 of 3 correct" in the page language) and that the page logged no error and no warning.
Before the lessons, P0 opens /rules/, /rules/trainer/ and /rules-spec/ and checks that the dog (docs/shared/mascot.js) is not there
(owner rule, DEVELOPERS.md §4j).

Run from the repository root (serves docs/ itself on 127.0.0.1, no other server needed, nothing is sent anywhere: the statistics
tracker is off on 127.0.0.1):
    python tools/checks/check_quiz.py                         every lesson × every published language (about 15-30 minutes)
    python tools/checks/check_quiz.py --langs uk,en --limit 10    quick run
Options: --site <folder> (a test build, e.g. bun scripts/build_seo.mjs --out <folder>; default docs) · --langs uk,de,… ·
--lessons id1,id2 · --limit N (first N lessons per language) · --workers N (pages in parallel, default 4) · --phone (375 × 812, a
touch phone; also checks that the page does not scroll sideways) · --shots (a screenshot of every failed page into --out, default
tools/checks/out/quiz) · --chrome (installed Google Chrome). Exit code 0 = "RESULT: OK", 1 = failures (each listed).
"""
import asyncio, json, pathlib, re, sys, time
from playwright.async_api import async_playwright
from _common import DOCS, OUT, opt, flag, check_args, serve

check_args({"--site", "--langs", "--lessons", "--limit", "--workers", "--out"}, {"--phone", "--shots", "--chrome"})
SITE = pathlib.Path(opt("--site", DOCS)).resolve()
SHOTS = pathlib.Path(opt("--out", OUT / "quiz"))
JUMP = 20                      # px: the pressed option may not move more than this on screen
WORKERS = int(opt("--workers", "4"))
VIEW = {"viewport": {"width": 375, "height": 812}, "is_mobile": True, "has_touch": True, "device_scale_factor": 2} if flag("--phone") \
    else {"viewport": {"width": 1000, "height": 900}}
norm = lambda s: re.sub(r"\s+", " ", s or "").strip()


def jread(p):
    return json.loads(p.read_text(encoding="utf-8"))


def plan():
    """[(lang, lesson id, path on the site, lesson data, ui strings)] from the build's own data files."""
    langs = jread(SITE / "learn" / "data" / "languages.json")["published"]
    if opt("--langs"):
        want = opt("--langs").split(",")
        bad = [l for l in want if l not in langs]
        if bad: sys.exit(f"ERROR: not published: {bad} (published: {langs})")
        langs = [l for l in langs if l in want]
    only = set(opt("--lessons").split(",")) if opt("--lessons") else None
    cases = []
    for L in langs:
        d = SITE / "learn" / "data" / L
        cat, ui = jread(d / "catalog.json"), jread(d / "ui.json")["ui"]
        ids = [i for i, x in cat["lessons"].items() if x.get("data") and (not only or i in only)]
        for i in ids[: int(opt("--limit"))] if opt("--limit") else ids:
            x = cat["lessons"][i]
            cases.append((L, i, x["url"].replace(cat["base"], "/", 1), jread(d / x["data"]), ui))
    return cases


async def lesson(ctx, base, case, fails):
    L, lid, path, data, ui = case
    tag, msgs, page = f"{L} {lid}", [], await ctx.new_page()
    page.on("console", lambda m: msgs.append(f"{m.type}: {m.text}") if m.type in ("error", "warning") else None)
    page.on("pageerror", lambda e: msgs.append(f"pageerror: {e}"))
    bad = lambda m: fails.append(f"{tag}: {m}")
    try:
        await page.goto(base + path.lstrip("/"), wait_until="load")
        qs = data.get("quiz") or []
        if not qs:                                         # a lesson without a quiz shows "mark as done"
            await page.wait_for_selector('[data-act="markdone"], .ac-ok', timeout=20000)
            return
        await page.wait_for_selector('section.ac-quiz button.ac-opt[data-act="ans"]', timeout=20000)
        n = await page.locator("section.ac-quiz fieldset.ac-q").count()
        if n != len(qs): bad(f"{n} questions on the page, {len(qs)} in the data")
        right = 0
        for i, q in enumerate(qs):
            keys = [o["k"] for o in q["options"]]
            pick = q["correct"] if i % 2 == 0 else next(k for k in keys if k != q["correct"])
            sel = f'section.ac-quiz button.ac-opt[data-q="{q["k"]}"][data-v="{pick}"]'
            btn = page.locator(sel)
            await btn.scroll_into_view_if_needed()
            y0 = await btn.evaluate("b => b.getBoundingClientRect().top")
            await btn.click()
            await page.wait_for_timeout(450)             # rerender + the dog of docs/shared/mascot.js (async)
            y1 = await page.locator(sel).evaluate("b => b.getBoundingClientRect().top")
            if abs(y1 - y0) > JUMP: bad(f"q{i + 1}: the pressed option jumped {y1 - y0:+.0f} px")
            fs = page.locator(f'section.ac-quiz fieldset.ac-q:has(button[data-q="{q["k"]}"])')
            st = await fs.evaluate("""f => ({pressed: [...f.querySelectorAll('.ac-opt[aria-pressed="true"]')].map(b => b.dataset.v),
              right: [...f.querySelectorAll('.ac-opt.right')].map(b => b.dataset.v), wrong: [...f.querySelectorAll('.ac-opt.wrong')].map(b => b.dataset.v),
              open: [...f.querySelectorAll('.ac-opt')].filter(b => b.getAttribute('aria-disabled') !== 'true').length,
              ex: (() => { const e = f.querySelector('.ac-explain-q'); if (!e) return ''; const c = e.cloneNode(true);
                c.querySelectorAll('svg, [data-clay-mascot], .ac-mascot, .ac-mascot-ex').forEach(x => x.remove()); return c.textContent; })()})""")  # without the dog's bubble
            if st["pressed"] != [pick]: bad(f"q{i + 1}: aria-pressed on {st['pressed']}, pressed {pick}")
            if st["right"] != [q["correct"]]: bad(f"q{i + 1}: .right on {st['right']}, correct is {q['correct']}")
            if st["wrong"] != ([] if pick == q["correct"] else [pick]): bad(f"q{i + 1}: .wrong on {st['wrong']}")
            if st["open"]: bad(f"q{i + 1}: {st['open']} options still open after the answer")
            word = ui["correct"] if pick == q["correct"] else ui["wrong"]
            ex = norm(st["ex"])
            if not ex.startswith(norm(word)): bad(f"q{i + 1}: explanation does not start with {word!r}: {ex[:60]!r}")
            if norm(q.get("explain"))[:40] not in ex: bad(f"q{i + 1}: explanation text of the data is missing: {ex[:80]!r}")
            right += pick == q["correct"]
        res = norm(await page.locator("section.ac-quiz .ac-qres").inner_text()) if await page.locator("section.ac-quiz .ac-qres").count() else ""
        score = norm(ui["quiz_score"].replace("{n}", str(right)).replace("{t}", str(len(qs))))
        if score not in res: bad(f"score line {res[:60]!r} lacks {score!r}")
        if "{{" in await page.locator("section.ac-quiz").inner_text(): bad("a raw {{token}} in the quiz")
        if flag("--phone"):
            sw = await page.evaluate("[document.documentElement.scrollWidth, innerWidth]")
            if sw[0] > sw[1]: bad(f"page scrolls sideways at 375 px ({sw[0]} > {sw[1]})")
    except Exception as e:
        bad(f"{type(e).__name__}: {str(e).splitlines()[0][:160]}")
    finally:
        for m in msgs: bad(m)
        if flag("--shots") and any(f.startswith(tag + ":") for f in fails):
            SHOTS.mkdir(parents=True, exist_ok=True)
            await page.screenshot(path=str(SHOTS / f"{L}_{lid}.png"), full_page=True)
        await page.close()


async def no_dog(ctx, base, fails):
    """P0: the dog never on the rules guide, the rules trainer and the rules spec."""
    for path in ("rules/", "rules/trainer/", "rules-spec/"):
        page, msgs = await ctx.new_page(), []
        page.on("pageerror", lambda e: msgs.append(f"pageerror: {e}"))
        await page.goto(base + path, wait_until="load"); await page.wait_for_timeout(1500)
        st = await page.evaluate("[!!window.ClayMascot, document.querySelectorAll('[data-clay-mascot] svg, .cm-svg').length, [...document.scripts].some(s => /mascot\\.js/.test(s.src))]")
        if any(st): fails.append(f"P0 /{path}: the dog is on this page (ClayMascot {st[0]}, drawings {st[1]}, script {st[2]})")
        fails.extend(f"P0 /{path}: {m}" for m in msgs)
        await page.close()


async def main():
    cases = plan()
    base, stop = serve(SITE)
    fails, done, t0 = [], 0, time.time()
    async with async_playwright() as p:
        b = await p.chromium.launch(headless=True, **({"channel": "chrome"} if flag("--chrome") else {}))
        ctx0 = await b.new_context(**VIEW)
        await no_dog(ctx0, base, fails); await ctx0.close()
        for L in dict.fromkeys(c[0] for c in cases):      # one fresh browser profile per language (progress, language choice)
            todo = [c for c in cases if c[0] == L]
            ctxs = [await b.new_context(locale=L, **VIEW) for _ in range(min(WORKERS, len(todo)))]
            q = asyncio.Queue(); [q.put_nowait(c) for c in todo]

            async def worker(ctx):
                nonlocal done
                while not q.empty():
                    await lesson(ctx, base, q.get_nowait(), fails); done += 1
            await asyncio.gather(*(worker(c) for c in ctxs))
            for c in ctxs: await c.close()
            print(f"{L}: {len(todo)} lessons, failures so far {len(fails)} ({time.time() - t0:.0f} s)", flush=True)
        await b.close()
    stop()
    for f in fails: print("  !", f)
    print(f"{done} lesson pages, {len(fails)} failures")
    print("RESULT:", "OK" if not fails else f"{len(fails)} failures")
    sys.exit(0 if not fails else 1)


if __name__ == "__main__":
    asyncio.run(main())
