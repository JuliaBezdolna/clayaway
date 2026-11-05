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
       data-anim  the term page shows an animation (TERM_SIMS of docs/shared/sims.js): ▶ after the name, chip "▶ With animation"
     (data-cat="anim", ?cat=anim), the most telling pages of the glossary.
     The list section of a category is <h2 id="cat-<slug>"> + <div class="list" data-cat="<slug>">.
   Matching (ClayTerms.flat: no accents, marks or quotes, lower case): names first (exact, start, start of a word, inside), then the
   aliases, then the definition (every word of the query starts a word of it), then the sound (ClayTerms.skel, the consonants: the
   same skeleton, or the start of a longer one from 4 sounds on; a short skeleton also needs the vowels close, ClayTerms.lev of the
   Latin forms), so «но берд» finds No Bird and «батю» finds Battue, but not Butt. Deep links: ?q=<query>&cat=<slug> (kept up to date while typing; the canonical URL of the
   page stays the plain index). Keys: "/" focuses the box, ↓/↑ walk the results, Enter opens the first one, Esc clears.
   Term pages (all languages) get the compact box of mini(lang, esc): the same matching in a drop-down list; the search data is the
   index page of the language ("../", data-src), fetched on the first focus or key (one request, the browser caches it), so the term
   pages carry no copy of it; docs/shared/terms.js (the matching) is loaded at the same moment when the page has not got it (only
   the term pages with an animation load it anyway). Without JavaScript the box submits to the index page as ?q=….
   Interface strings: STR below (11 ClayArena languages, never others). Production (clayarena.com): the same box in the site
   template, fed by the same data attributes or by the glossary API. */
(function (root) {
  "use strict";
  // the folder of this file (docs/shared/), for loading terms.js on demand on the term pages
  const ME = typeof document !== "undefined" ? document.currentScript : null;
  const HERE = ME && ME.src ? ME.src.replace(/glossary-search\.js(?:[?#].*)?$/, "") : "";
  const STR = {
    uk: { label: "Пошук у глосарії", ph: "Знайти термін: No Bird, дуплет, чок…", all: "Усі", cats: "Категорії", found: "Знайдено: {n}", none: "Нічого не знайдено. Спробуйте інше слово або англійську назву.", in_cat: "{c}: {n}", clear: "Очистити", ph2: "Знайти інший термін…", more: "Усі результати в глосарії", anim: "З анімацією" },
    en: { label: "Search the glossary", ph: "Find a term: No Bird, double, choke…", all: "All", cats: "Categories", found: "{n} found", none: "Nothing found. Try another word.", in_cat: "{c}: {n}", clear: "Clear", ph2: "Find another term…", more: "All results in the glossary", anim: "With animation" },
    de: { label: "Glossar durchsuchen", ph: "Begriff suchen: No Bird, Doublette, Choke…", all: "Alle", cats: "Kategorien", found: "Gefunden: {n}", none: "Nichts gefunden. Versuchen Sie ein anderes Wort oder den englischen Begriff.", in_cat: "{c}: {n}", clear: "Löschen", ph2: "Anderen Begriff suchen…", more: "Alle Ergebnisse im Glossar", anim: "Mit Animation" },
    fr: { label: "Rechercher dans le glossaire", ph: "Chercher un terme : No Bird, doublé, choke…", all: "Tous", cats: "Catégories", found: "Résultats : {n}", none: "Aucun résultat. Essayez un autre mot ou le terme anglais.", in_cat: "{c} : {n}", clear: "Effacer", ph2: "Chercher un autre terme…", more: "Tous les résultats dans le glossaire", anim: "Avec animation" },
    it: { label: "Cerca nel glossario", ph: "Cerca un termine: No Bird, doppietto, choke…", all: "Tutti", cats: "Categorie", found: "Risultati: {n}", none: "Nessun risultato. Prova un'altra parola o il termine inglese.", in_cat: "{c}: {n}", clear: "Cancella", ph2: "Cerca un altro termine…", more: "Tutti i risultati nel glossario", anim: "Con animazione" },
    cs: { label: "Hledat v glosáři", ph: "Hledat termín: No Bird, dvojstřel, zahrdlení…", all: "Vše", cats: "Kategorie", found: "Nalezeno: {n}", none: "Nic nenalezeno. Zkuste jiné slovo nebo anglický termín.", in_cat: "{c}: {n}", clear: "Vymazat", ph2: "Hledat jiný termín…", more: "Všechny výsledky v glosáři", anim: "S animací" },
    pl: { label: "Szukaj w słowniku", ph: "Szukaj terminu: No Bird, dublet, czok…", all: "Wszystkie", cats: "Kategorie", found: "Znaleziono: {n}", none: "Nic nie znaleziono. Spróbuj innego słowa lub angielskiej nazwy.", in_cat: "{c}: {n}", clear: "Wyczyść", ph2: "Szukaj innego terminu…", more: "Wszystkie wyniki w słowniku", anim: "Z animacją" },
    pt: { label: "Pesquisar no glossário", ph: "Procurar um termo: No Bird, dupla, choke…", all: "Todos", cats: "Categorias", found: "Resultados: {n}", none: "Nada encontrado. Experimente outra palavra ou o termo em inglês.", in_cat: "{c}: {n}", clear: "Limpar", ph2: "Procurar outro termo…", more: "Todos os resultados no glossário", anim: "Com animação" },
    hu: { label: "Keresés a szótárban", ph: "Kifejezés keresése: No Bird, dublé, choke…", all: "Mind", cats: "Kategóriák", found: "Találatok: {n}", none: "Nincs találat. Próbáljon másik szót vagy az angol kifejezést.", in_cat: "{c}: {n}", clear: "Törlés", ph2: "Másik kifejezés keresése…", more: "Összes találat a szótárban", anim: "Animációval" },
    fi: { label: "Hae sanastosta", ph: "Hae termiä: No Bird, tupla, choke…", all: "Kaikki", cats: "Luokat", found: "Löytyi: {n}", none: "Ei tuloksia. Kokeile toista sanaa tai englanninkielistä termiä.", in_cat: "{c}: {n}", clear: "Tyhjennä", ph2: "Hae toista termiä…", more: "Kaikki tulokset sanastossa", anim: "Animaatiolla" },
    lt: { label: "Ieškoti žodyne", ph: "Ieškoti termino: No Bird, dubletas, choke…", all: "Visi", cats: "Kategorijos", found: "Rasta: {n}", none: "Nieko nerasta. Pabandykite kitą žodį arba anglišką terminą.", in_cat: "{c}: {n}", clear: "Išvalyti", ph2: "Ieškoti kito termino…", more: "Visi rezultatai žodyne", anim: "Su animacija" }
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
.gs-res[hidden],.gs-hide{display:none!important}
.list a{break-inside:avoid}.list a[data-anim]::after,.gs-an::after{content:"▶";margin-left:5px;font-size:.7em;color:var(--em);vertical-align:.14em}.gs-c-an{border-color:rgba(52,211,153,.45)}
.gs-mini{position:relative;margin:2px 0 16px}.gs-mini .gs-q{min-height:44px;font-size:16px;padding-block:9px}
.gs-pop{position:absolute;left:0;right:0;top:calc(100% + 6px);z-index:40;background:#0B1120;border:1px solid var(--line);border-radius:12px;padding:6px;max-height:min(62vh,460px);overflow:auto;box-shadow:0 14px 34px rgba(0,0,0,.55)}
.gs-pop[hidden]{display:none}.gs-pop .gs-st{margin:4px 8px 6px;min-height:0}.gs-pop .gs-st[hidden]{display:none}.gs-pop .gs-res{margin:0}.gs-pop .gs-res a{border-color:transparent;background:transparent;padding:8px 10px}.gs-more{font-size:14px;font-weight:600;color:var(--em)!important}`;

  /* form(lang, cats, esc, anim): the static markup of the box. cats = [{slug, name, n}] in page order; n = terms in the category;
     anim = how many terms of the page have an animation (the chip is left out when there are none). */
  function form(lang, cats, esc, anim) {
    const s = S(lang), total = cats.reduce((a, c) => a + c.n, 0);
    return `<form class="gs" role="search" data-gsearch data-lang="${esc(lang)}" action="">
<label class="gs-l" for="gsQ">${esc(s.label)}</label><div class="gs-box"><input id="gsQ" class="gs-q" type="search" name="q" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="search" placeholder="${esc(s.ph)}"><button class="gs-x" type="button" aria-label="${esc(s.clear)}" hidden>×</button></div>
<nav class="gs-cats" aria-label="${esc(s.cats)}"><a class="gs-c" href="#gsQ" data-cat="" aria-current="true">${esc(s.all)} <span>${total}</span></a>${anim ? `<a class="gs-c gs-c-an" href="?cat=anim" data-cat="anim"><span aria-hidden="true">▶</span> ${esc(s.anim)} <span>${anim}</span></a>` : ""}${cats.map(c => `<a class="gs-c" href="#cat-${esc(c.slug)}" data-cat="${esc(c.slug)}">${esc(c.name)} <span>${c.n}</span></a>`).join("")}</nav>
<p class="gs-st" aria-live="polite"></p><ol class="gs-res" hidden></ol></form>`;
  }

  /* mini(lang, esc): the compact box of a term page; the data is the index page "../" of the same language (data-src). */
  function mini(lang, esc) {
    const s = S(lang);
    return `<form class="gs gs-mini" role="search" data-gsearch data-lang="${esc(lang)}" data-src="../" action="../">
<label class="gs-l" for="gsQ">${esc(s.label)}</label><div class="gs-box"><input id="gsQ" class="gs-q" type="search" name="q" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="search" placeholder="${esc(s.ph2)}"><button class="gs-x" type="button" aria-label="${esc(s.clear)}" hidden>×</button></div>
<div class="gs-pop" hidden><p class="gs-st" aria-live="polite"></p><ol class="gs-res" hidden></ol></div></form>`;
  }

  /* ---- browser ---- */
  function init() {
    const F = document.querySelector("form[data-gsearch]"); if (!F) return;
    const s = S(F.dataset.lang || document.documentElement.lang);
    const C = () => root.ClayTerms || {}; // read when used: a term page loads terms.js only on the first search
    const flat = x => (C().flat ? C().flat(x) : String(x || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[-\s]+/g, " ").trim());
    const norm = x => flat(String(x || "").replace(/ʼ/g, "'"));
    const skel = v => C().skel(v), hasSkel = () => !!C().skel;
    const latin = x => (C().latin ? C().latin(x) : norm(x)), lev = (a, b) => (C().lev ? C().lev(a, b) : (a === b ? 0 : 9));
    const bare = x => latin(x).replace(/[^a-z]/g, "");
    const Q = F.querySelector(".gs-q"), X = F.querySelector(".gs-x"), ST = F.querySelector(".gs-st"), R = F.querySelector(".gs-res");
    const MINI = F.dataset.src != null, POP = F.querySelector(".gs-pop"), SRC = MINI ? new URL(F.dataset.src, location.href).href : "";
    const chips = [...F.querySelectorAll(".gs-c")];
    const lists = MINI ? [] : [...document.querySelectorAll(".list[data-cat]")];
    const catName = {};
    const split = v => (v || "").split("|").map(x => x.trim()).filter(Boolean);
    const words = v => v.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
    const T = [];
    function collect(doc) { // the term links of an index page (this one, or the one a term page fetched)
      doc.querySelectorAll(".gs-c").forEach(c => { if (c.dataset.cat) catName[c.dataset.cat] = c.dataset.cat === "anim" ? s.anim : c.firstChild.textContent.trim(); });
      for (const L of doc.querySelectorAll(".list[data-cat]")) for (const a of L.querySelectorAll("a[data-k]")) {
        const k = split(a.dataset.k).map(norm), al = split(a.dataset.a).map(norm), d = a.dataset.d || "";
        T.push({ a, cat: L.dataset.cat, anim: a.hasAttribute("data-anim"), k, al, d, dw: words(norm(d)), sk: hasSkel() ? [...split(a.dataset.k), ...split(a.dataset.a)].map(v => [skel(v), bare(v)]) : [] });
      } }
    let loading = null;
    const terms = () => (C().flat || !HERE ? Promise.resolve() : new Promise(ok => { const j = document.createElement("script");
      j.src = HERE + "terms.js"; j.onload = j.onerror = () => ok(); document.head.appendChild(j); })); // a failed load: plain matching
    const load = () => loading || (loading = terms().then(() => fetch(SRC)).then(r => (r.ok ? r.text() : Promise.reject(r.status)))
      .then(h => collect(new DOMParser().parseFromString(h, "text/html"))).catch(() => { loading = null; }));
    if (!MINI) collect(document);
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

    const inCat = t => !cat || (cat === "anim" ? t.anim : t.cat === cat);
    const rank = n => { const qw = words(n), qs = hasSkel() && n.replace(/[^\p{L}]/gu, "").length >= 3 ? skel(q) : "", qb = qs ? bare(q) : "";
      return T.filter(inCat).map(t => [t, score(t, n, qw, qs, qb)]).filter(([, sc]) => sc !== null)
        .sort((x, y) => x[1] - y[1] || x[0].a.textContent.localeCompare(y[0].a.textContent)); };
    const item = (t, withCat) => `<li><a href="${esc(t.a.getAttribute("href"))}"><b>${t.a.innerHTML}${t.anim ? `<span class="gs-an" aria-hidden="true"></span>` : ""}</b>${withCat ? `<small>${esc(catName[t.cat] || "")}</small>` : ""}${t.d ? `<span class="gs-d">${esc(t.d)}</span>` : ""}</a></li>`;
    function renderMini() { // term page: the best 8 in a drop-down, then "all results" on the index page
      const n = norm(q); X.hidden = !q;
      if (!n) { POP.hidden = true; R.innerHTML = ""; return; }
      if (!T.length) { load().then(() => { if (T.length && norm(Q.value) === n) renderMini(); }); return; }
      const hits = rank(n), more = new URL(SRC); more.searchParams.set("q", q.trim());
      ST.textContent = hits.length ? "" : s.none; ST.hidden = !!hits.length;
      R.innerHTML = hits.slice(0, 8).map(([t]) => item(t, true)).join("") + (hits.length > 8 ? `<li><a class="gs-more" href="${esc(more.href)}">${esc(s.more)} (${hits.length}) →</a></li>` : "");
      R.hidden = !hits.length; POP.hidden = false;
    }
    function render() {
      if (MINI) return renderMini();
      const n = norm(q);
      chips.forEach(c => c.setAttribute("aria-current", String(c.dataset.cat === cat)));
      { const on = chips.find(c => c.dataset.cat === cat), row = on && on.parentNode; // narrow screens: the chips scroll in one row
        if (row && row.scrollWidth > row.clientWidth) row.scrollLeft = on.offsetLeft - row.offsetLeft - (row.clientWidth - on.offsetWidth) / 2; }
      X.hidden = !q;
      if (!n) { // no query: the static list, one category or all
        R.hidden = true; R.innerHTML = "";
        const A = cat === "anim"; // "with animation": every category, only its animated terms
        lists.forEach(L => { let on = !cat || L.dataset.cat === cat;
          if (A) { let any = false; L.querySelectorAll("a").forEach(a => { const y = a.hasAttribute("data-anim"); a.classList.toggle("gs-hide", !y); any = any || y; }); on = any; }
          else L.querySelectorAll("a.gs-hide").forEach(a => a.classList.remove("gs-hide"));
          L.classList.toggle("gs-hide", !on); const h = document.getElementById("cat-" + L.dataset.cat); if (h) h.classList.toggle("gs-hide", !on); });
        ST.textContent = cat ? fill(s.in_cat, { c: catName[cat] || cat, n: T.filter(inCat).length }) : "";
        return;
      }
      lists.forEach(L => { L.classList.add("gs-hide"); const h = document.getElementById("cat-" + L.dataset.cat); if (h) h.classList.add("gs-hide"); });
      const hits = rank(n);
      ST.textContent = hits.length ? fill(s.found, { n: hits.length }) : s.none;
      R.innerHTML = hits.slice(0, 80).map(([t]) => item(t, !cat)).join("");
      R.hidden = !hits.length;
    }
    let tUrl = 0;
    function syncUrl() { if (MINI) return; clearTimeout(tUrl); tUrl = setTimeout(() => { try {
      const u = new URL(location.href); q.trim() ? u.searchParams.set("q", q.trim()) : u.searchParams.delete("q"); cat ? u.searchParams.set("cat", cat) : u.searchParams.delete("cat");
      if (u.hash.startsWith("#cat-") || u.hash === "#gsQ") u.hash = ""; history.replaceState(history.state, "", u.pathname + u.search + u.hash);
    } catch (e) { /* file:// or an old browser: no deep link, the search still works */ } }, 300); }

    Q.addEventListener("input", () => { q = Q.value; render(); syncUrl(); });
    // Enter: the first result; on a term page whose data has not arrived yet the form goes to the index page as ?q=…
    F.addEventListener("submit", e => { const first = R.querySelector("a"); if (first) { e.preventDefault(); location.href = first.href; } else if (!MINI) e.preventDefault(); });
    if (MINI) { // data on the first focus; the drop-down closes on Esc, a click elsewhere, or when the focus leaves the box
      Q.addEventListener("focus", () => { load(); if (q) renderMini(); });
      document.addEventListener("click", e => { if (!F.contains(e.target)) POP.hidden = true; });
      F.addEventListener("focusout", e => { if (!F.contains(e.relatedTarget)) POP.hidden = true; }); }
    X.addEventListener("click", () => { Q.value = q = ""; render(); syncUrl(); Q.focus(); });
    chips.forEach(c => c.addEventListener("click", e => { e.preventDefault(); cat = c.dataset.cat === cat ? "" : c.dataset.cat; render(); syncUrl();
      if (!q && cat) { const h = document.getElementById("cat-" + cat); if (h) h.scrollIntoView({ block: "start", behavior: "smooth" }); } }));
    Q.addEventListener("keydown", e => {
      if (e.key === "Escape" && MINI && !POP.hidden) { e.preventDefault(); POP.hidden = true; }
      else if (e.key === "Escape" && q) { e.preventDefault(); Q.value = q = ""; render(); syncUrl(); }
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

    // the state of a shared link: ?q=…&cat=… (or a #cat-<slug> anchor); index pages only
    if (!MINI) try { const u = new URL(location.href); q = u.searchParams.get("q") || ""; cat = u.searchParams.get("cat") || "";
      if (!cat && u.hash.startsWith("#cat-")) cat = u.hash.slice(5);
      if (cat && !(cat === "anim" ? T.some(t => t.anim) : lists.some(L => L.dataset.cat === cat))) cat = ""; } catch (e) {}
    if (!MINI) { Q.value = q; if (q || cat) render(); }
  }

  const API = { STR, CSS, form, mini, catSlug };
  if (root) root.ClayGlossarySearch = API;
  if (typeof module === "object" && module && module.exports) module.exports = API;
  if (typeof document !== "undefined" && document.querySelector) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
  }
})(typeof window !== "undefined" ? window : globalThis);
