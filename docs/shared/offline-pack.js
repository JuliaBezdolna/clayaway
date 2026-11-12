/* ClayArena · «Зберегти для офлайну» (PWA step 3, 11.11.2026). A block on the glossary home (<l>/glossary/) and the Academy home
   (<l>/learn/), in the page language: one button saves the whole product of that language on the device, so it works without a
   network on the shooting ground (docs/sw.js serves the saved copies when the network fails; with a network everything stays fresh).
   Loaded by docs/shared/nav.js on those two pages only.

   The list of files: docs/offline/<product>-<lang>.json (scripts/build_offline.mjs: pages, data, what they load; v = content hash,
   gz = what the download costs). Saved into the cache "clayarena-pack-<product>-<lang>"; the list itself is put there LAST, as the
   mark of a complete pack (its v, its date). Interrupted (page closed, network lost): «Зберегти» again fetches only what is missing.
   A newer list online (another v) → «Є нова версія · Оновити». «Видалити» drops the cache. The requests carry the header
   X-Clay-Pack, so the service worker passes them straight through (they do not fill the cache of visited pages).
   States: idle (size) · saving (progress, «не закривайте сторінку») · saved (date; update; delete) · failed (retry) · offline. */
(function () {
  "use strict";
  if (window.ClayOffline || !("caches" in window) || !("serviceWorker" in navigator)) return;
  const me = document.currentScript || [...document.scripts].find(s => /shared\/offline-pack\.js/.test(s.src));
  const ROOT = me ? me.src.replace(/shared\/offline-pack\.js.*$/, "") : null;
  if (!ROOT) return;
  const rel = location.href.replace(/[?#].*$/, "").slice(ROOT.length), m = /^(?:([a-z]{2})\/)?(glossary|learn)\/$/.exec(rel);
  if (!m) return;
  const LANG = m[1] || "uk", PRODUCT = m[2] === "learn" ? "academy" : "glossary", NAV_ID = m[2];
  const KEY = `${PRODUCT}-${LANG}`, CACHE = "clayarena-pack-" + KEY, LIST = `${ROOT}offline/${KEY}.json`;
  // {p} = product name (the bar's naming table), {mb} = size, {i}/{n} = progress, {k} = failed files, {d} = date.
  // The name stands alone, in the nominative («Академія ClayArena: …»), never inflected or agreed with («Зберегти Академія» would be
  // wrong; Akademie, Accademia, Akademija are feminine): the button and the «saved» line are written without it.
  const T = {
    uk: { save: "Зберегти для роботи без інтернету", size: "{p}: усі сторінки цією мовою · ≈ {mb} МБ", saving: "Зберігаю… {i} з {n}", keep: "Не закривайте сторінку, доки не завершиться.",
      saved: "Збережено на цьому пристрої: {p} працює без інтернету.", when: "Збережено {d}.", upd: "Є нова версія.", update: "Оновити", del: "Видалити з пристрою",
      fail: "Не вдалося зберегти {k} файлів.", retry: "Спробувати ще раз", off: "Щоб зберегти, потрібен інтернет.", h: "Без інтернету" },
    en: { save: "Save for use without internet", size: "{p}: every page in this language · ≈ {mb} MB", saving: "Saving… {i} of {n}", keep: "Keep this page open until it finishes.",
      saved: "Saved on this device: {p} works without internet.", when: "Saved on {d}.", upd: "A new version is available.", update: "Update", del: "Remove from this device",
      fail: "{k} files could not be saved.", retry: "Try again", off: "Saving needs an internet connection.", h: "Offline" },
    de: { save: "Für die Nutzung ohne Internet speichern", size: "{p}: alle Seiten in dieser Sprache · ≈ {mb} MB", saving: "Wird gespeichert … {i} von {n}", keep: "Bitte die Seite geöffnet lassen, bis es fertig ist.",
      saved: "Auf diesem Gerät gespeichert: {p} funktioniert ohne Internet.", when: "Gespeichert am {d}.", upd: "Eine neue Version ist verfügbar.", update: "Aktualisieren", del: "Vom Gerät entfernen",
      fail: "{k} Dateien konnten nicht gespeichert werden.", retry: "Erneut versuchen", off: "Zum Speichern ist eine Internetverbindung nötig.", h: "Offline" },
    fr: { save: "Enregistrer pour utiliser sans internet", size: "{p} : toutes les pages dans cette langue · ≈ {mb} Mo", saving: "Enregistrement… {i} sur {n}", keep: "Gardez cette page ouverte jusqu’à la fin.",
      saved: "Copie enregistrée sur cet appareil : {p} fonctionne sans internet.", when: "Enregistré le {d}.", upd: "Une nouvelle version est disponible.", update: "Mettre à jour", del: "Supprimer de l’appareil",
      fail: "{k} fichiers n’ont pas pu être enregistrés.", retry: "Réessayer", off: "L’enregistrement nécessite une connexion internet.", h: "Hors ligne" },
    it: { save: "Salva per usare senza internet", size: "{p}: tutte le pagine in questa lingua · ≈ {mb} MB", saving: "Salvataggio… {i} di {n}", keep: "Tieni aperta la pagina finché non finisce.",
      saved: "Copia salvata su questo dispositivo: {p} funziona senza internet.", when: "Salvato il {d}.", upd: "È disponibile una nuova versione.", update: "Aggiorna", del: "Rimuovi dal dispositivo",
      fail: "Non è stato possibile salvare {k} file.", retry: "Riprova", off: "Per salvare serve una connessione internet.", h: "Offline" },
    cs: { save: "Uložit pro použití bez internetu", size: "{p}: všechny stránky v tomto jazyce · ≈ {mb} MB", saving: "Ukládám… {i} z {n}", keep: "Nechte stránku otevřenou, dokud se to nedokončí.",
      saved: "Uloženo v tomto zařízení: {p} funguje bez internetu.", when: "Uloženo {d}.", upd: "Je k dispozici nová verze.", update: "Aktualizovat", del: "Odstranit ze zařízení",
      fail: "{k} souborů se nepodařilo uložit.", retry: "Zkusit znovu", off: "K uložení je potřeba připojení k internetu.", h: "Offline" },
    pl: { save: "Zapisz do użytku bez internetu", size: "{p}: wszystkie strony w tym języku · ≈ {mb} MB", saving: "Zapisywanie… {i} z {n}", keep: "Nie zamykaj strony, dopóki się nie skończy.",
      saved: "Zapisano na tym urządzeniu: {p} działa bez internetu.", when: "Zapisano {d}.", upd: "Dostępna jest nowa wersja.", update: "Zaktualizuj", del: "Usuń z urządzenia",
      fail: "Nie udało się zapisać {k} plików.", retry: "Spróbuj ponownie", off: "Do zapisania potrzebny jest internet.", h: "Offline" },
    pt: { save: "Guardar para usar sem internet", size: "{p}: todas as páginas neste idioma · ≈ {mb} MB", saving: "A guardar… {i} de {n}", keep: "Mantenha a página aberta até terminar.",
      saved: "Cópia guardada neste dispositivo: {p} funciona sem internet.", when: "Guardado em {d}.", upd: "Há uma nova versão.", update: "Atualizar", del: "Remover do dispositivo",
      fail: "Não foi possível guardar {k} ficheiros.", retry: "Tentar de novo", off: "Para guardar é preciso internet.", h: "Offline" },
    hu: { save: "Mentés internet nélküli használatra", size: "{p}: minden oldal ezen a nyelven · ≈ {mb} MB", saving: "Mentés… {i} / {n}", keep: "Ne zárja be az oldalt, amíg el nem készül.",
      saved: "Mentve ezen az eszközön: {p} internet nélkül is működik.", when: "Mentve: {d}.", upd: "Új verzió érhető el.", update: "Frissítés", del: "Eltávolítás az eszközről",
      fail: "{k} fájlt nem sikerült menteni.", retry: "Újra", off: "A mentéshez internetkapcsolat kell.", h: "Offline" },
    fi: { save: "Tallenna käytettäväksi ilman internetiä", size: "{p}: kaikki sivut tällä kielellä · ≈ {mb} Mt", saving: "Tallennetaan… {i}/{n}", keep: "Pidä sivu auki, kunnes tallennus on valmis.",
      saved: "Tallennettu tähän laitteeseen: {p} toimii ilman internetiä.", when: "Tallennettu {d}.", upd: "Uusi versio on saatavilla.", update: "Päivitä", del: "Poista laitteesta",
      fail: "{k} tiedostoa ei voitu tallentaa.", retry: "Yritä uudelleen", off: "Tallentaminen vaatii internetyhteyden.", h: "Offline" },
    lt: { save: "Išsaugoti, kad veiktų be interneto", size: "{p}: visi puslapiai šia kalba · ≈ {mb} MB", saving: "Saugoma… {i} iš {n}", keep: "Neuždarykite puslapio, kol baigsis.",
      saved: "Išsaugota šiame įrenginyje: {p} veikia be interneto.", when: "Išsaugota {d}.", upd: "Yra nauja versija.", update: "Atnaujinti", del: "Pašalinti iš įrenginio",
      fail: "Nepavyko išsaugoti {k} failų.", retry: "Bandyti dar kartą", off: "Norint išsaugoti, reikia interneto.", h: "Neprisijungus" }
  };
  const S = T[LANG] || T.en;
  const pname = () => { try { const N = window.ClayNav; return (N && N.full && N.full(NAV_ID, LANG)) || (N && N.name && N.name(NAV_ID, LANG)) || (PRODUCT === "academy" ? "ClayArena Academy" : "Glossary"); } catch (e) { return ""; } };
  const fmt = (s, o) => s.replace(/\{(\w+)\}/g, (x, k) => (o[k] != null ? o[k] : x));
  const num = (v, d) => { try { return new Intl.NumberFormat(LANG, { maximumFractionDigits: d, minimumFractionDigits: d }).format(v); } catch (e) { return v.toFixed(d); } };
  const date = t => { try { return new Intl.DateTimeFormat(LANG, { day: "numeric", month: "long", year: "numeric" }).format(new Date(t)).replace(/\.$/, ""); } /* «2026 р.» + «.» */ catch (e) { return new Date(t).toISOString().slice(0, 10); } };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  const css = `.ca-off{max-width:900px;margin:28px auto 8px;padding:16px;border:1px solid rgba(255,255,255,.14);border-radius:14px;background:rgba(255,255,255,.04);color:#F3F4F6;font:15px/1.55 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
.ca-off h2{margin:0 0 6px;font-size:13px;letter-spacing:.07em;text-transform:uppercase;color:#9CA3AF;font-weight:700}
.ca-off p{margin:6px 0 0;color:#D1D5DB}.ca-off .m{color:#9CA3AF;font-size:13.5px}
.ca-off .row{display:flex;flex-wrap:wrap;gap:10px 14px;align-items:center;margin-top:10px}
.ca-off button{font:inherit;cursor:pointer;min-height:44px;border-radius:10px;padding:8px 16px}
.ca-off .go{background:#05845D;color:#fff;border:0;font-weight:600}.ca-off .go:hover{background:#047052}
.ca-off .ln{background:none;border:0;color:#9CA3AF;text-decoration:underline;padding:8px 4px}.ca-off .ln:hover{color:#fff}
.ca-off .bar{height:8px;border-radius:99px;background:rgba(255,255,255,.1);overflow:hidden;margin-top:10px}.ca-off .bar i{display:block;height:100%;background:#34D399;width:0;transition:width .2s}
.ca-off .ok{color:#6EE7B7;font-weight:600}
.ca-off button:focus-visible{outline:2px solid #34D399;outline-offset:2px}
@media print{.ca-off{display:none}}`;
  const box = document.createElement("section");
  box.className = "ca-off"; box.setAttribute("aria-live", "polite");
  function place() {
    const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
    const foot = document.getElementById("acFoot"), disc = document.querySelector("main .disc"), main = document.querySelector("main");
    if (foot) foot.before(box); else if (disc) disc.before(box); else if (main) main.append(box); else document.body.append(box);
  }
  let list = null, busy = false;
  async function savedMeta() {
    if (!(await caches.has(CACHE))) return null;
    const r = await (await caches.open(CACHE)).match(LIST); if (!r) return null;
    try { const j = await r.json(); return { v: j.v, at: Number(r.headers.get("x-clay-saved")) || 0 }; } catch (e) { return null; }
  }
  async function getList() { const r = await fetch(LIST, { cache: "no-cache", headers: { "X-Clay-Pack": "1" } }); if (!r.ok) throw new Error(r.status); return r.json(); }
  async function draw(state, o = {}) {
    const P = esc(pname()), head = `<h2>📶 ${esc(S.h)}</h2>`;
    if (state === "saving") { box.innerHTML = `${head}<p>${esc(fmt(S.saving, { i: o.i, n: o.n }))}</p><div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="${o.n}" aria-valuenow="${o.i}"><i style="width:${Math.round(o.i / o.n * 100)}%"></i></div><p class="m">${esc(S.keep)}</p>`; return; }
    if (state === "saved") { box.innerHTML = `${head}<p class="ok">✓ ${fmt(esc(S.saved), { p: P })}</p><p class="m">${esc(fmt(S.when, { d: date(o.at) }))}${o.upd ? " " + esc(S.upd) : ""}</p>
      <div class="row">${o.upd ? `<button class="go" data-a="save">${esc(S.update)}</button>` : ""}<button class="ln" data-a="del">${esc(S.del)}</button></div>`; return; }
    const sz = list ? `<p class="m">${fmt(esc(S.size), { p: P, mb: num(list.gz / 1048576, 1) })}</p>` : "";
    if (state === "fail") { box.innerHTML = `${head}<p>${esc(fmt(S.fail, { k: o.k }))}</p><div class="row"><button class="go" data-a="save">${esc(S.retry)}</button></div>`; return; }
    if (state === "offline") { box.innerHTML = `${head}<p class="m">${esc(S.off)}</p>`; return; }
    box.innerHTML = `${head}<div class="row"><button class="go" data-a="save">⬇ ${fmt(esc(S.save), { p: P })}</button></div>${sz}`;
  }
  async function refresh() {
    const meta = await savedMeta();
    try { list = await getList(); } catch (e) { list = null; }
    if (meta) return draw("saved", { at: meta.at, upd: !!(list && list.v !== meta.v) });
    return draw(list ? "idle" : "offline");
  }
  async function save() {
    if (busy) return; busy = true;
    try {
      if (!list) list = await getList();
      try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}
      const c = await caches.open(CACHE), old = await savedMeta(), fresh = !old || old.v !== list.v;
      const urls = list.files.map(f => ROOT + f), n = urls.length; let i = 0, bad = 0, next = 0;
      draw("saving", { i, n });
      const one = async url => {
        if (!fresh && await c.match(url)) { i++; return; } // resume: only what is missing
        try { const r = await fetch(url, { cache: "no-cache", headers: { "X-Clay-Pack": "1" } }); if (r.ok) await c.put(url, r); else bad++; } catch (e) { bad++; }
        i++; if (i % 5 === 0 || i === n) draw("saving", { i, n });
      };
      await Promise.all(Array.from({ length: 6 }, async () => { while (next < n) await one(urls[next++]); }));
      if (bad) { draw("fail", { k: bad }); return; }
      // the list last: the mark of a complete pack, with the date
      const body = JSON.stringify(list);
      await c.put(LIST, new Response(body, { headers: { "content-type": "application/json", "x-clay-saved": String(Date.now()) } }));
      if (fresh && old) { const keep = new Set(urls.concat(LIST)); for (const k of await c.keys()) if (!keep.has(k.url)) await c.delete(k); } // files gone from the new list
      await refresh();
    } catch (e) { draw(navigator.onLine === false ? "offline" : "fail", { k: "?" }); }
    finally { busy = false; }
  }
  async function drop() { await caches.delete(CACHE); await refresh(); }
  box.addEventListener("click", e => { const b = e.target.closest("button[data-a]"); if (!b) return; if (b.dataset.a === "save") save(); else if (b.dataset.a === "del") drop(); });
  document.addEventListener("claynav:lang", () => { if (!busy) refresh(); });
  const start = () => { place(); refresh(); };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
  window.ClayOffline = { refresh, save, drop, key: KEY };
})();
