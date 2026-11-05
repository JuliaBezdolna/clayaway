/* ClayArena glossary search — the search box and the category filter of the glossary index pages (all 11 languages).
   ONE helper for the builds and the browser, like docs/shared/terms.js:
   - builds (scripts/build_seo.mjs, build_seo_en.mjs, build_seo_i18n.mjs): ClayGlossarySearch.form(lang, cats, esc) writes the box,
     the category chips and the empty result list straight into the page HTML (no layout shift when the script arrives; the chips
     are plain #cat-<slug> anchors, so they work without JavaScript too), ClayGlossarySearch.CSS goes into the page <style>,
     catSlug(cat) gives the anchor of a category heading. The static list of terms stays as it is: search engines read those links.
   - browser: every term link of the list carries what the search matches (written by the builds):
       data-k  the names of the term, "|"-separated: English headword, display name, the local word of the page language
       data-a  the aliases: English "aka", the search aliases of the language ("alt" in docs/glossary/data/i18n/<lang>.js)
       data-d  the one-sentence definition in the page language (shown in the results, searched last)
     The list section of a category is <h2 id="cat-<slug>"> + <div class="list" data-cat="<slug>">.
   Matching (ClayTerms.flat: no accents, marks or quotes, lower case): names first (exact, start, start of a word, inside), then the
   aliases, then the definition (every word of the query starts a word of it), then the sound (ClayTerms.skel, the consonants: the
   same skeleton, or the start of a longer one from 4 sounds on; a short skeleton also needs the vowels close, ClayTerms.lev of the
   Latin forms), so «но берд» finds No Bird and «батю» finds Battue, but not Butt. Deep links: ?q=<query>&cat=<slug> (kept up to date while typing; the canonical URL of the
   page stays the plain index). Keys: "/" focuses the box, ↓/↑ walk the results, Enter opens the first one, Esc clears.
   Interface strings: STR below (11 ClayArena languages, never others). Production (clayarena.com): the same box in the site
   template, fed by the same data attributes or by the glossary API. */
(function (root) {
  "use strict";
  const STR = {
    uk: { label: "Пошук у глосарії", ph: "Знайти термін: No Bird, дуплет, чок…", all: "Усі", cats: "Категорії", found: "Знайдено: {n}", none: "Нічого не знайдено. Спробуйте інше слово або англійську назву.", in_cat: "{c}: {n}", clear: "Очистити" },
    en: { label: "Search the glossary", ph: "Find a term: No Bird, double, choke…", all: "All", cats: "Categories", found: "{n} found", none: "Nothing found. Try another word.", in_cat: "{c}: {n}", clear: "Clear" },
    de: { label: "Glossar durchsuchen", ph: "Begriff suchen: No Bird, Doublette, Choke…", all: "Alle", cats: "Kategorien", found: "Gefunden: {n}", none: "Nichts gefunden. Versuchen Sie ein anderes Wort oder den englischen Begriff.", in_cat: "{c}: {n}", clear: "Löschen" },
    fr: { label: "Rechercher dans le glossaire", ph: "Chercher un terme : No Bird, doublé, choke…", all: "Tous", cats: "Catégories", found: "Résultats : {n}", none: "Aucun résultat. Essayez un autre mot ou le terme anglais.", in_cat: "{c} : {n}", clear: "Effacer" },
    it: { label: "Cerca nel glossario", ph: "Cerca un termine: No Bird, doppietto, choke…", all: "Tutti", cats: "Categorie", found: "Risultati: {n}", none: "Nessun risultato. Prova un'altra parola o il termine inglese.", in_cat: "{c}: {n}", clear: "Cancella" },
    cs: { label: "Hledat v glosáři", ph: "Hledat termín: No Bird, dvojstřel, zahrdlení…", all: "Vše", cats: "Kategorie", found: "Nalezeno: {n}", none: "Nic nenalezeno. Zkuste jiné slovo nebo anglický termín.", in_cat: "{c}: {n}", clear: "Vymazat" },
    pl: { label: "Szukaj w słowniku", ph: "Szukaj terminu: No Bird, dublet, czok…", all: "Wszystkie", cats: "Kategorie", found: "Znaleziono: {n}", none: "Nic nie znaleziono. Spróbuj innego słowa lub angielskiej nazwy.", in_cat: "{c}: {n}", clear: "Wyczyść" },
    pt: { label: "Pesquisar no glossário", ph: "Procurar um termo: No Bird, dupla, choke…", all: "Todos", cats: "Categorias", found: "Resultados: {n}", none: "Nada encontrado. Experimente outra palavra ou o termo em inglês.", in_cat: "{c}: {n}", clear: "Limpar" },
    hu: { label: "Keresés a szótárban", ph: "Kifejezés keresése: No Bird, dublé, choke…", all: "Mind", cats: "Kategóriák", found: "Találatok: {n}", none: "Nincs találat. Próbáljon másik szót vagy az angol kifejezést.", in_cat: "{c}: {n}", clear: "Törlés" },
    fi: { label: "Hae sanastosta", ph: "Hae termiä: No Bird, tupla, choke…", all: "Kaikki", cats: "Luokat", found: "Löytyi: {n}", none: "Ei tuloksia. Kokeile toista sanaa tai englanninkielistä termiä.", in_cat: "{c}: {n}", clear: "Tyhjennä" },
    lt: { label: "Ieškoti žodyne", ph: "Ieškoti termino: No Bird, dubletas, choke…", all: "Visi", cats: "Kategorijos", found: "Rasta: {n}", none: "Nieko nerasta. Pabandykite kitą žodį arba anglišką terminą.", in_cat: "{c}: {n}", clear: "Išvalyti" }
  };
  const S = lang => STR[lang] || STR.en;
  const fill = (s, o) => s.replace(/\{(\w+)\}/g, (m, k) => (o[k] != null ? o[k] : m));
  const catSlug = c => String(c).toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const CSS = `.gs{margin:18px 0 8px}.gs-l{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.gs-box{position:relative}.gs-q{width:100%;min-height:50px;padding:12px 46px 12px 16px;font:inherit;font-size:17px;color:var(--ink);background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.18);border-radius:12px;outline:none;-webkit-appearance:none;appearance:none}
.gs-q::placeholder{color:var(--muted)}.gs-q:focus{border-color:var(--em);box-shadow:0 0 0 3px rgba(52,211,153,.2)}.gs-q::-webkit-search-cancel-button{display:none}
.gs-x{position:absolute;right:6px;top:50%;transform:translateY(-50%);width:38px;height:38px;border:0;border-radius:9px;background:transparent;color:var(--muted);font-size:22px;line-height:1;cursor:pointer}.gs-x:hover{color:#fff;background:rgba(255,255,255,.08)}.gs-x[hidden]{display:none}
.gs-cats{display:flex;flex-wrap:wrap;gap:6px;margin:12px 0 0}.gs-c{display:inline-flex;align-items:center;gap:6px;min-height:34px;padding:4px 12px;border:1px solid var(--line);border-radius:999px;font-size:13.5px;color:var(--soft);text-decoration:none;white-space:nowrap}
.gs-c span{font-size:12px;color:var(--muted)}.gs-c:hover{border-color:rgba(255,255,255,.3);color:#fff}.gs-c[aria-current="true"]{background:var(--primary);border-color:var(--primary);color:#fff}.gs-c[aria-current="true"] span{color:#D1FAE5}
@media(max-width:760px){.gs-cats{flex-wrap:nowrap;overflow-x:auto;padding-bottom:6px;margin-inline:-16px;padding-inline:16px;scrollbar-width:thin}}
@media(pointer:coarse){.gs-c{min-height:40px}}
.gs-st{min-height:1.65em;margin:10px 0 0;font-size:13.5px;color:var(--muted)}
.gs-res{list-style:none;margin:6px 0 0;padding:0;display:grid;gap:6px}.gs-res a{display:grid;gap:2px;padding:10px 14px;border:1px solid var(--line);border-radius:12px;background:var(--surface);text-decoration:none;color:var(--soft)}
.gs-res a:hover,.gs-res a:focus-visible{border-color:var(--em);background:rgba(52,211,153,.07);outline:none}.gs-res b{color:var(--ink);font-size:16.5px}.gs-res small{font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:.04em}.gs-res .gs-d{font-size:14.5px;line-height:1.5}
.gs-res[hidden],.gs-hide{display:none!important}`;

  /* form(lang, cats, esc): the static markup of the box. cats = [{slug, name, n}] in page order; n = terms in the category. */
  function form(lang, cats, esc) {
    const s = S(lang), total = cats.reduce((a, c) => a + c.n, 0);
    return `<form class="gs" role="search" data-gsearch data-lang="${esc(lang)}" action="">
<label class="gs-l" for="gsQ">${esc(s.label)}</label><div class="gs-box"><input id="gsQ" class="gs-q" type="search" name="q" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="search" placeholder="${esc(s.ph)}"><button class="gs-x" type="button" aria-label="${esc(s.clear)}" hidden>×</button></div>
<nav class="gs-cats" aria-label="${esc(s.cats)}"><a class="gs-c" href="#gsQ" data-cat="" aria-current="true">${esc(s.all)} <span>${total}</span></a>${cats.map(c => `<a class="gs-c" href="#cat-${esc(c.slug)}" data-cat="${esc(c.slug)}">${esc(c.name)} <span>${c.n}</span></a>`).join("")}</nav>
<p class="gs-st" aria-live="polite"></p><ol class="gs-res" hidden></ol></form>`;
  }

  /* ---- browser ---- */
  function init() {
    const F = document.querySelector("form[data-gsearch]"); if (!F) return;
    const CT = root.ClayTerms || {}, s = S(F.dataset.lang || document.documentElement.lang);
    const flat = CT.flat || (x => String(x || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[-\s]+/g, " ").trim());
    const norm = x => flat(String(x || "").replace(/ʼ/g, "'"));
    const skel = CT.skel || null, latin = CT.latin || (x => norm(x)), lev = CT.lev || ((a, b) => (a === b ? 0 : 9));
    const bare = x => latin(x).replace(/[^a-z]/g, "");
    const Q = F.querySelector(".gs-q"), X = F.querySelector(".gs-x"), ST = F.querySelector(".gs-st"), R = F.querySelector(".gs-res");
    const chips = [...F.querySelectorAll(".gs-c")];
    const lists = [...document.querySelectorAll(".list[data-cat]")];
    const catName = {}; chips.forEach(c => { if (c.dataset.cat) catName[c.dataset.cat] = c.firstChild.textContent.trim(); });
    const split = v => (v || "").split("|").map(x => x.trim()).filter(Boolean);
    const words = v => v.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
    const T = [];
    for (const L of lists) for (const a of L.querySelectorAll("a[data-k]")) {
      const k = split(a.dataset.k).map(norm), al = split(a.dataset.a).map(norm), d = a.dataset.d || "";
      T.push({ a, cat: L.dataset.cat, k, al, d, dw: words(norm(d)), sk: skel ? [...split(a.dataset.k), ...split(a.dataset.a)].map(v => [skel(v), bare(v)]) : [] });
    }
    let cat = "", q = "";

    /* score of one term for the query (lower = better; null = no match) */
    const keyScore = (keys, n, base) => { let best = null;
      for (const key of keys) { const sc = key === n ? 0 : key.startsWith(n) ? 1 : words(key).some(w => w.startsWith(n)) ? 2 : key.includes(n) ? 4 : null;
        if (sc !== null && (best === null || sc < best)) best = sc; }
      return best === null ? null : best + base; };
    const sound = (sk, qs, qb) => sk.some(([x, b]) => x === qs ? (qs.length >= 4 || lev(qb, b.slice(0, qb.length)) <= Math.ceil(qb.length / 3))
      : qs.length >= 4 && x.startsWith(qs));
    function score(t, n, qw, qs, qb) {
      let sc = keyScore(t.k, n, 0); if (sc !== null) return sc;
      sc = keyScore(t.al, n, 1); if (sc !== null) return sc;
      if (n.length >= 3 && qw.every(w => t.dw.some(x => x.startsWith(w)))) return 7;
      if (qs && sound(t.sk, qs, qb)) return 8;
      return null;
    }
    const esc = v => String(v).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

    function render() {
      const n = norm(q);
      chips.forEach(c => c.setAttribute("aria-current", String(c.dataset.cat === cat)));
      { const on = chips.find(c => c.dataset.cat === cat), row = on && on.parentNode; // narrow screens: the chips scroll in one row
        if (row && row.scrollWidth > row.clientWidth) row.scrollLeft = on.offsetLeft - row.offsetLeft - (row.clientWidth - on.offsetWidth) / 2; }
      X.hidden = !q;
      if (!n) { // no query: the static list, one category or all
        R.hidden = true; R.innerHTML = "";
        lists.forEach(L => { const on = !cat || L.dataset.cat === cat; L.classList.toggle("gs-hide", !on); const h = document.getElementById("cat-" + L.dataset.cat); if (h) h.classList.toggle("gs-hide", !on); });
        ST.textContent = cat ? fill(s.in_cat, { c: catName[cat] || cat, n: T.filter(t => t.cat === cat).length }) : "";
        return;
      }
      lists.forEach(L => { L.classList.add("gs-hide"); const h = document.getElementById("cat-" + L.dataset.cat); if (h) h.classList.add("gs-hide"); });
      const qw = words(n), qs = skel && n.replace(/[^\p{L}]/gu, "").length >= 3 ? skel(q) : "", qb = qs ? bare(q) : "";
      const hits = T.filter(t => !cat || t.cat === cat).map(t => [t, score(t, n, qw, qs, qb)]).filter(([, sc]) => sc !== null)
        .sort((x, y) => x[1] - y[1] || x[0].a.textContent.localeCompare(y[0].a.textContent));
      ST.textContent = hits.length ? fill(s.found, { n: hits.length }) : s.none;
      R.innerHTML = hits.slice(0, 80).map(([t]) => `<li><a href="${esc(t.a.getAttribute("href"))}"><b>${t.a.innerHTML}</b>${cat ? "" : `<small>${esc(catName[t.cat] || "")}</small>`}${t.d ? `<span class="gs-d">${esc(t.d)}</span>` : ""}</a></li>`).join("");
      R.hidden = !hits.length;
    }
    let tUrl = 0;
    function syncUrl() { clearTimeout(tUrl); tUrl = setTimeout(() => { try {
      const u = new URL(location.href); q.trim() ? u.searchParams.set("q", q.trim()) : u.searchParams.delete("q"); cat ? u.searchParams.set("cat", cat) : u.searchParams.delete("cat");
      if (u.hash.startsWith("#cat-") || u.hash === "#gsQ") u.hash = ""; history.replaceState(history.state, "", u.pathname + u.search + u.hash);
    } catch (e) { /* file:// or an old browser: no deep link, the search still works */ } }, 300); }

    Q.addEventListener("input", () => { q = Q.value; render(); syncUrl(); });
    F.addEventListener("submit", e => { e.preventDefault(); const first = R.querySelector("a"); if (first) location.href = first.href; });
    X.addEventListener("click", () => { Q.value = q = ""; render(); syncUrl(); Q.focus(); });
    chips.forEach(c => c.addEventListener("click", e => { e.preventDefault(); cat = c.dataset.cat === cat ? "" : c.dataset.cat; render(); syncUrl();
      if (!q && cat) { const h = document.getElementById("cat-" + cat); if (h) h.scrollIntoView({ block: "start", behavior: "smooth" }); } }));
    Q.addEventListener("keydown", e => {
      if (e.key === "Escape" && q) { e.preventDefault(); Q.value = q = ""; render(); syncUrl(); }
      else if (e.key === "ArrowDown") { const first = R.querySelector("a"); if (first) { e.preventDefault(); first.focus(); } } });
    R.addEventListener("keydown", e => {
      const items = [...R.querySelectorAll("a")], i = items.indexOf(document.activeElement); if (i < 0) return;
      if (e.key === "ArrowDown" && items[i + 1]) { e.preventDefault(); items[i + 1].focus(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); (items[i - 1] || Q).focus(); }
      else if (e.key === "Escape") { e.preventDefault(); Q.focus(); } });
    document.addEventListener("keydown", e => {
      if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey) return;
      const el = document.activeElement; if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
      e.preventDefault(); Q.focus(); Q.select(); });

    // the state of a shared link: ?q=…&cat=… (or a #cat-<slug> anchor)
    try { const u = new URL(location.href); q = u.searchParams.get("q") || ""; cat = u.searchParams.get("cat") || "";
      if (!cat && u.hash.startsWith("#cat-")) cat = u.hash.slice(5);
      if (cat && !lists.some(L => L.dataset.cat === cat)) cat = ""; } catch (e) {}
    Q.value = q; if (q || cat) render();
  }

  const API = { STR, CSS, form, catSlug };
  if (root) root.ClayGlossarySearch = API;
  if (typeof module === "object" && module && module.exports) module.exports = API;
  if (typeof document !== "undefined" && document.querySelector) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
  }
})(typeof window !== "undefined" ? window : globalThis);
