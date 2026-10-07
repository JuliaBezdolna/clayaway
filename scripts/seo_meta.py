"""Canonical links + schema.org JSON-LD for the hand-made pages of the ClayArena projects site (ClayAway tours, rules, academies).

Run from the project root (after make_og.py): python scripts/seo_meta.py
The rules pages get their markup from scripts/build_seo.mjs; this script covers home, specs and tours.
Tour EXAMPLES (docs/dornsberg, docs/sologne) show real ClayArena people with made-up dates, prices and messages
(owner decision 06.10.2026): they get a plain WebPage with the sample label and no Event/Offer/price markup, so that
search engines, LLM crawlers and link previews cannot read them as a real sale. Real published tours get Event + Offer
from tour data in production (tour spec, section «SEO, розмітка і превʼю»).
"""
import json, re
from pathlib import Path

DOCS = Path(__file__).resolve().parent.parent / "docs"
B = "https://fenix-112323.github.io/clayaway/"
SITE = {"@type": "WebSite", "name": "ClayArena", "url": B}  # one site of ClayArena projects; ClayAway = the tours service inside it
CLAYARENA = {"@type": "Organization", "name": "ClayArena", "url": "https://clayarena.com/"}


SAMPLE_LABEL = "Приклад: дати, ціни й повідомлення умовні."


def sample_tour(name, slug, desc):
    """Tour example page: WebPage only (no Event, no Offer, no price, no availability)."""
    return {
        "@context": "https://schema.org", "@type": "WebPage", "name": f"Sample tour page: {name}",
        "description": f"{SAMPLE_LABEL} Sample ClayAway tour page, not a real offer. {desc}",
        "url": f"{B}{slug}/", "inLanguage": "en", "image": [f"{B}og/{slug}.png"],
        "isPartOf": SITE, "publisher": CLAYARENA,
    }


PAGES = {
    "index.html": [{"@context": "https://schema.org", **SITE, "description": "Проєкти ClayArena: тури ClayAway, правила FITASC, тренажер правил, глосарій, Академія ClayArena.",
                    "publisher": CLAYARENA},
                   {"@context": "https://schema.org", "@type": "ItemList", "itemListElement": [
                       {"@type": "ListItem", "position": i + 1, "url": B + u, "name": n} for i, (u, n) in enumerate([
                           ("rules/", "Правила FITASC простими словами"), ("rules/trainer/", "Тренажер правил FITASC"),
                           ("glossary/", "Глосарій ClayArena"), ("learn/", "Академія ClayArena"),
                           ("dornsberg/", "Приклад туру: Dornsberg Training Days (умовні дані)"), ("sologne/", "Приклад туру: Sologne Week (умовні дані)"),
                           ("concept/", "ТЗ ClayAway"), ("rules-spec/", "ТЗ: правила FITASC і глосарій")])]}],
    "concept/index.html": [{"@context": "https://schema.org", "@type": "TechArticle", "headline": "ТЗ ClayAway — концепція і технічне завдання",
                            "inLanguage": "uk", "url": B + "concept/", "author": CLAYARENA, "publisher": CLAYARENA, "isPartOf": SITE,
                            "about": "Організовані тури з тренером у ClayArena: ролі, доступи, спілкування, адмінка, комісія"}],
    "rules-spec/index.html": [{"@context": "https://schema.org", "@type": "TechArticle", "headline": "ТЗ: довідник правил FITASC і глосарій",
                               "inLanguage": "uk", "url": B + "rules-spec/", "author": CLAYARENA, "publisher": CLAYARENA, "isPartOf": SITE,
                               "about": "Довідник правил FITASC, тренажер, глосарій, SEO, оновлення регламентів"}],
    "dornsberg/index.html": [sample_tour(
        "Dornsberg Training Days with Markus Leibinger", "dornsberg",
        "How a ClayAway tour page could look: Sporting™ and Compak® Sporting at Dornsberg Shooting Ground above Lake Constance, coach Markus Leibinger, organizer and interpreter Lena Weigele.")],
    "sologne/index.html": [sample_tour(
        "Sologne Week with Charles Bardou", "sologne",
        "How a ClayAway tour page could look: Parcours de Chasse – Sporting™ and Compak® Sporting at the Sologne Shooting Club with Charles Bardou, organizer and interpreter Anna Karpulianskaia, and a Chambord excursion.")],
}

for path, blocks in PAGES.items():
    p = DOCS / path
    s = p.read_text(encoding="utf-8")
    s = re.sub(r"\n<!-- seo -->.*?<!-- /seo -->", "", s, flags=re.S)
    url = B + path[: -len("index.html")]
    block = "\n<!-- seo -->\n" + f'<link rel="canonical" href="{url}">\n' + "\n".join(
        f'<script type="application/ld+json">{json.dumps(b, ensure_ascii=False)}</script>' for b in blocks) + "\n<!-- /seo -->"
    s = s.replace("\n<!-- share-preview -->", block + "\n<!-- share-preview -->", 1)
    p.write_text(s, encoding="utf-8")
    print("ok", path)
