"""Share previews (Open Graph) for every page of the ClayAway site.

Builds docs/og/<page>.png (1200x630) + icons and injects og/twitter meta tags into each page's <head>.
Run from the project root after changing titles: python scripts/make_og.py
Tour EXAMPLES (dornsberg, sologne) show real ClayArena people with made-up dates, prices and messages: their preview
says so in og:title / og:description and on the picture (SAMPLE + «Приклад: дати, ціни й повідомлення умовні»).
"""
import re
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / "docs"
BASE = "https://fenix-112323.github.io/clayaway/"
BG, EM, CYAN, CLAY, INK, SOFT = (3, 7, 18), (52, 211, 153), (34, 211, 238), (251, 146, 60), (243, 244, 246), (156, 163, 175)
FONTS = Path("C:/Windows/Fonts")

PAGES = [
    # path, og file, locale, eyebrow, title lines, subtitle lines, og:title, og:description
    ("index.html", "home", "uk_UA", "CLAYARENA · НОВИЙ НАПРЯМ", ["ClayAway"], ["Clay shooting trips with top coaches", "ТЗ · приклади турів · правила FITASC"],
     "ClayAway — тури з тренером у ClayArena", "Новий напрям ClayArena, що готується: організовані тури з тренером. ТЗ, два умовні приклади турів і правила FITASC простими словами."),
    ("concept/index.html", "concept", "uk_UA", "ТЕХНІЧНЕ ЗАВДАННЯ", ["ТЗ ClayAway"], ["Тури з тренером у ClayArena:", "ролі, доступи, спілкування, адмінка, гроші"],
     "ТЗ ClayAway — концепція і технічне завдання", "Тури з тренером у ClayArena: ролі й доступи, відкрите та закрите спілкування, адмінка, комісія, сутності, етапи."),
    ("dornsberg/index.html", "dornsberg", "en_GB", "CLAYAWAY TOUR · GERMANY", ["Dornsberg", "Training Days"], ["with Markus Leibinger · Lake Constance", "Tue 13 – Sat 17 April 2027 · 6 shooters"],
     "Sample tour: Dornsberg Training Days with Markus Leibinger", "Приклад: дати, ціни й повідомлення умовні. Sample ClayAway tour page, not a real offer: five days of Sporting™ and Compak® Sporting at Dornsberg above Lake Constance with Markus Leibinger; organizer and interpreter Lena Weigele."),
    ("sologne/index.html", "sologne", "en_GB", "CLAYAWAY TOUR · FRANCE", ["Sologne Week"], ["with Charles Bardou · Loire Valley", "Mon 10 – Fri 14 May 2027 · Château de Chambord"],
     "Sample tour: Sologne Week with Charles Bardou", "Приклад: дати, ціни й повідомлення умовні. Sample ClayAway tour page, not a real offer: Parcours de Chasse – Sporting™ and Compak® Sporting with Charles Bardou at the Sologne Shooting Club, Loire wines and a Chambord excursion; organizer and interpreter Anna Karpulianskaia."),
    ("rules/index.html", "rules", "uk_UA", "FITASC · SPORTING™ · COMPAK® SPORTING", ["Правила FITASC", "простими словами"], ["Запитайте або читайте за розділами", "з посиланням на сторінку офіційного PDF"],
     "Правила FITASC простими словами — ClayArena", "Parcours de Chasse – Sporting™ і Compak® Sporting: 232 пункти правил і 140 відповідей, українською та англійською, з посиланнями на офіційний PDF FITASC."),
    ("rules/trainer/index.html", "trainer", "uk_UA", "FITASC · ТРЕНАЖЕР", ["Тренажер", "правил FITASC"], ["Рішення судді, цифри, правда чи ні", "Sporting™ і Compak® Sporting · 160 питань"],
     "Тренажер правил FITASC — ClayArena", "Перевірте знання правил Sporting™ і Compak® Sporting: ситуації на стенді, ліміти й цифри. Пояснення з посиланням на офіційний PDF."),
    ("learn/index.html", "learn", "uk_UA", "CLAYARENA ACADEMY", ["Стендова стрільба", "з нуля"], ["Безпека, рушниці, чоки, патрони, мішені,", "техніка, змагання, правила й культура"],
     "Академія ClayArena — стендова стрільба з нуля", "Короткі уроки для початківців: Sporting™ і Compak® Sporting, безпека, рушниці, чоки, патрони, мішені, техніка, змагання, правила FITASC і культура спорту."),
    ("interpreter/index.html", "interpreter", "en_GB", "CLAYARENA · INTERPRETER ACADEMY", ["Clay shooting", "for interpreters"], ["Terms, target flights, lead, FITASC rules,", "referee calls and etiquette · 11 languages"],
     "ClayArena Interpreter Academy", "Gamified course for interpreters: terms, target flights, lead and technique, FITASC rules of Parcours de Chasse – Sporting™ and Compak® Sporting, referee calls and etiquette — in all ClayArena languages."),
    ("glossary/index.html", "glossary", "uk_UA", "CLAYARENA · ГЛОСАРІЙ", ["Глосарій", "стендової стрільби"], ["Sporting™ і Compak® Sporting англійською", "з поясненнями й посиланнями на правила"],
     "Глосарій стендової стрільби — ClayArena", "Терміни Parcours de Chasse – Sporting™ і Compak® Sporting англійською з поясненнями українською та англійською і посиланнями на правила FITASC."),
    ("rules-spec/index.html", "rules-spec", "uk_UA", "ТЕХНІЧНЕ ЗАВДАННЯ", ["ТЗ: правила FITASC", "і глосарій"], ["Логіка, дані, пошук, ШІ-відповіді,", "оновлення регламентів"],
     "ТЗ: довідник правил FITASC і глосарій", "Як працює довідник правил FITASC у ClayArena: джерела, структура даних, пошук, ШІ-відповіді, щотижнева перевірка оновлень."),
]

# Pictures that must carry the sample label (tour examples with real people; dates, prices and messages are made up).
SAMPLE = {"dornsberg", "sologne"}
SAMPLE_BADGE, SAMPLE_LINE = "SAMPLE · NOT A REAL OFFER", "Приклад: дати, ціни й повідомлення умовні"


def font(name, size):
    for n in (name, "segoeuib.ttf", "arialbd.ttf"):
        if (FONTS / n).exists():
            return ImageFont.truetype(str(FONTS / n), size)
    return ImageFont.load_default()


def clay(d, cx, cy, r):
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=CLAY)
    d.ellipse([cx - r * .68, cy - r * .68, cx + r * .68, cy + r * .68], outline=(110, 62, 30), width=max(2, int(r * .12)))
    d.ellipse([cx - r * .3, cy - r * .3, cx + r * .3, cy + r * .3], fill=(160, 90, 40))


def card(name, eyebrow, title, sub):
    W, H = 1200, 630
    img = Image.new("RGB", (W, H), BG)
    glow = Image.new("RGB", (W, H), BG)
    ImageDraw.Draw(glow).ellipse([-300, -360, 720, 520], fill=(6, 60, 46))
    img = Image.blend(img, glow.filter(ImageFilter.GaussianBlur(120)), 0.9)
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([24, 24, W - 24, H - 24], radius=28, outline=(30, 41, 59), width=2)
    d.rounded_rectangle([80, 70, 262, 116], radius=10, fill=(0, 0, 0))
    d.text((98, 74), "ClayArena", font=font("segoeuib.ttf", 30), fill=CYAN)
    d.text((290, 78), eyebrow, font=font("segoeuib.ttf", 26), fill=EM)
    size = 100 if max(len(t) for t in title) <= 14 else 84
    y = 160
    for t in title:
        d.text((76, y), t, font=font("seguibl.ttf", size), fill=INK)
        y += int(size * 1.15)
    y += 24
    for t in sub:
        d.text((80, y), t, font=font("segoeui.ttf", 34), fill=SOFT)
        y += 46
    clay(d, 1010, 470, 92)
    d.ellipse([1010 - 150, 470 - 150, 1010 + 150, 470 + 150], outline=(30, 41, 59), width=2)
    if name in SAMPLE:  # clearly visible "sample" label: badge top right + Ukrainian line at the bottom
        bf = font("segoeuib.ttf", 24)
        bw = int(d.textlength(SAMPLE_BADGE, font=bf))
        d.rounded_rectangle([W - 80 - bw - 36, 70, W - 80, 116], radius=23, outline=CLAY, width=3, fill=(40, 22, 10))
        d.text((W - 80 - bw - 18, 78), SAMPLE_BADGE, font=bf, fill=CLAY)
        d.text((80, 548), SAMPLE_LINE, font=font("segoeuib.ttf", 30), fill=CLAY)
    (DOCS / "og").mkdir(exist_ok=True)
    img.save(DOCS / "og" / f"{name}.png", optimize=True)


def icons():
    for size, name in ((180, "apple-touch-icon.png"), (32, "favicon.png")):
        img = Image.new("RGB", (size, size), BG)
        clay(ImageDraw.Draw(img), size / 2, size / 2, size * .4)
        img.save(DOCS / "og" / name, optimize=True)


def inject(path, name, locale, og_title, og_desc):
    p = DOCS / path
    s = p.read_text(encoding="utf-8")
    s = re.sub(r"\n<!-- share-preview -->.*?<!-- /share-preview -->", "", s, flags=re.S)
    url = BASE + (path[:-len("index.html")] if path.endswith("index.html") else path)
    img = f"{BASE}og/{name}.png"
    depth = path.count("/")
    rel = "../" * depth
    # ClayAway is the tours service; rules, trainer, glossary and academies are ClayArena tools
    site = "ClayAway · ClayArena" if path.split("/")[0] in ("index.html", "concept", "dornsberg", "sologne") else "ClayArena"
    block = f'''
<!-- share-preview -->
<meta name="description" content="{og_desc}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="{site}">
<meta property="og:title" content="{og_title}">
<meta property="og:description" content="{og_desc}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{img}">
<meta property="og:image:secure_url" content="{img}">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="{locale}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{og_title}">
<meta name="twitter:description" content="{og_desc}">
<meta name="twitter:image" content="{img}">
<meta name="theme-color" content="#030712">
<link rel="icon" type="image/png" href="{rel}og/favicon.png">
<link rel="apple-touch-icon" href="{rel}og/apple-touch-icon.png">
<!-- /share-preview -->'''
    s = re.sub(r"(<title>[^<]*</title>)", lambda m: m.group(1) + block, s, count=1)
    p.write_text(s, encoding="utf-8")


if __name__ == "__main__":
    icons()
    for path, name, locale, eyebrow, title, sub, ogt, ogd in PAGES:
        card(name, eyebrow, title, sub)
        if (DOCS / path).exists() and name != "glossary":  # glossary pages carry their own tags (build_seo.mjs)
            inject(path, name, locale, ogt, ogd)
        print("ok", path)
