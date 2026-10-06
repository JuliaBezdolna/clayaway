"""Canonical links + schema.org JSON-LD for the hand-made pages of the ClayArena projects site (ClayAway tours, rules, academies).

Run from the project root (after make_og.py): python scripts/seo_meta.py
The rules pages get their markup from scripts/build_seo.mjs; this script covers home, specs and tours.
Tour data below mirrors docs/dornsberg and docs/sologne (sample tours: dates, prices, places are examples).
"""
import json, re
from pathlib import Path

DOCS = Path(__file__).resolve().parent.parent / "docs"
B = "https://fenix-112323.github.io/clayaway/"
SITE = {"@type": "WebSite", "name": "ClayArena", "url": B}  # one site of ClayArena projects; ClayAway = the tours service inside it
CLAYARENA = {"@type": "Organization", "name": "ClayArena", "url": "https://clayarena.com/"}


def tour(name, slug, desc, start, end, place, address, country, coach, coach_url, org, org_url, price, guest, left, langs, days, image):
    return {
        "@context": "https://schema.org", "@type": "Event", "name": name, "description": desc,
        "url": f"{B}{slug}/", "image": [f"{B}og/{slug}.png"],
        "startDate": start, "endDate": end,
        "eventStatus": "https://schema.org/EventScheduled",
        "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
        "inLanguage": langs,
        "location": {"@type": "Place", "name": place,
                     "address": {"@type": "PostalAddress", "streetAddress": address, "addressCountry": country}},
        "performer": {"@type": "Person", "name": coach, "url": coach_url, "jobTitle": "Coach"},
        "organizer": {"@type": "Person", "name": org, "url": org_url},
        "offers": [
            {"@type": "Offer", "name": "Shooter", "price": str(price), "priceCurrency": "EUR",
             "availability": "https://schema.org/LimitedAvailability", "url": f"{B}{slug}/",
             "inventoryLevel": {"@type": "QuantitativeValue", "value": left}},
            {"@type": "Offer", "name": "Non-shooting guest", "price": str(guest), "priceCurrency": "EUR", "url": f"{B}{slug}/"}],
        "subEvent": [{"@type": "Event", "name": d, "startDate": s} for s, d in days],
        "isAccessibleForFree": False,
        "provider": CLAYARENA,
        "keywords": "clay shooting, sporting clays, compak sporting, shooting tour, coaching, ClayAway",
    }


PAGES = {
    "index.html": [{"@context": "https://schema.org", **SITE, "description": "Проєкти ClayArena: тури ClayAway, правила FITASC, тренажер правил, глосарій, Академія ClayArena і Академія перекладача.",
                    "publisher": CLAYARENA},
                   {"@context": "https://schema.org", "@type": "ItemList", "itemListElement": [
                       {"@type": "ListItem", "position": i + 1, "url": B + u, "name": n} for i, (u, n) in enumerate([
                           ("rules/", "Правила FITASC простими словами"), ("rules/trainer/", "Тренажер правил FITASC"),
                           ("glossary/", "Глосарій ClayArena"), ("learn/", "Академія ClayArena"), ("interpreter/", "Академія перекладача ClayArena"),
                           ("dornsberg/", "Dornsberg Training Days"), ("sologne/", "Sologne Week"),
                           ("concept/", "ТЗ ClayAway"), ("rules-spec/", "ТЗ: правила FITASC і глосарій")])]}],
    "concept/index.html": [{"@context": "https://schema.org", "@type": "TechArticle", "headline": "ТЗ ClayAway — концепція і технічне завдання",
                            "inLanguage": "uk", "url": B + "concept/", "author": CLAYARENA, "publisher": CLAYARENA, "isPartOf": SITE,
                            "about": "Організовані тури з тренером у ClayArena: ролі, доступи, спілкування, адмінка, комісія"}],
    "rules-spec/index.html": [{"@context": "https://schema.org", "@type": "TechArticle", "headline": "ТЗ: довідник правил FITASC і глосарій",
                               "inLanguage": "uk", "url": B + "rules-spec/", "author": CLAYARENA, "publisher": CLAYARENA, "isPartOf": SITE,
                               "about": "Довідник правил FITASC, тренажер, глосарій, SEO, оновлення регламентів"}],
    "dornsberg/index.html": [tour(
        "Dornsberg Training Days with Markus Leibinger", "dornsberg",
        "Five days of Sporting and Compak at Dornsberg Shooting Ground above Lake Constance with coach Markus Leibinger; organizer and interpreter Lena Weigele. Hotel, transfers, meals, Reichenau and Konstanz.",
        "2027-04-13", "2027-04-17", "Dornsberg Shooting Ground", "Oberer Dornsberg 1, 78253 Eigeltingen", "DE",
        "Markus Leibinger", "https://clayarena.com/en/coaches/markus-leibinger-15/", "Lena Weigele", "https://clayarena.com/en/shooters/9655/",
        1950, 890, 1, ["en", "de", "es"],
        [("2027-04-13", "Arrival, transfer from Zürich, welcome dinner"), ("2027-04-14", "Sporting, lines A–E"),
         ("2027-04-15", "Compak and video review, Reichenau wine evening"), ("2027-04-16", "Sporting, Konstanz evening"),
         ("2027-04-17", "Control round, departure")], "dornsberg")],
    "sologne/index.html": [tour(
        "Sologne Week with Charles Bardou", "sologne",
        "Train with Charles Bardou at the Sologne Shooting Club: hunting course and Compak, Loire wines, Sologne game cuisine and a guided excursion to Château de Chambord. Organizer and interpreter Anna Karpulianskaia.",
        "2027-05-10", "2027-05-14", "Sologne Shooting Club", "Domaine de Courgenou, 4313 Route de Lamotte, 41600 Chaumont-sur-Tharonne", "FR",
        "Charles Bardou", "https://clayarena.com/en/shooters/1789724605508300304/", "Anna Karpulianskaia", "https://clayarena.com/en/shooters/1763048485011/",
        2600, 1100, 3, ["en", "fr", "uk"],
        [("2027-05-10", "Arrival, transfer from Paris CDG, game dinner"), ("2027-05-11", "Hunting course with Charles Bardou"),
         ("2027-05-12", "Compak, Château de Chambord excursion, Loire wine tasting"), ("2027-05-13", "Euro Shooting Cash layouts, farewell dinner"),
         ("2027-05-14", "Departure")], "sologne")],
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
