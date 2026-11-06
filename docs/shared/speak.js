/* ClayArena — English pronunciation of a term (window.ClaySpeak). The ONE source (05.11.2026, moved out of docs/shared/sims.js):
   - glossary term pages WITHOUT an animation load only this file (≈ 1 KB) for their 🔊 button (scripts/build_seo.mjs);
   - every page that loads the animations gets it inside docs/shared/sims.min.js: minifySims() (scripts/build_academy.mjs) puts this
     file in front of sims.js, so the Academy (docs/learn/app/academy.js say()), the rules trainer and the animated term pages keep
     ClaySpeak without a second request.
   Recorded voice (glossary plan, wave 5, 06.11.2026): ClaySpeak(term, {src}) plays the recorded file (docs/glossary/audio/<id>.mp3,
   a synthesised voice); if the file cannot play, the browser voice below speaks instead.
   Browser voice: British English, Web Speech API. A voice that runs on the device (localService) is preferred; if the browser offers
   only online voices, its default voice is used, and that browser may send the text to its speech service.
   The term pages' button is <button class="say" data-say="<term>" data-src="<file, if any>">: one click listener below; the button
   carries the class "on" while the word sounds. The "speak" event goes to the visit statistics (docs/shared/stats.js) when they are on. */
(function () {
  "use strict";
  const stat = (name, value) => { try { if (window.ClayStats) window.ClayStats.event(name, value); } catch (e) {} };
  const localVoice = () => { try { const vs = speechSynthesis.getVoices() || [];
    return vs.find(v => v.localService && /^en[-_]GB/i.test(v.lang)) || vs.find(v => v.localService && /^en\b/i.test(v.lang)) || null; } catch (e) { return null; } };
  let audio = null;
  const voice = (t, o, done) => { try { const u = new SpeechSynthesisUtterance(t); u.lang = "en-GB"; u.rate = o.rate || .9; const v = localVoice(); if (v) u.voice = v;
    u.onend = u.onerror = done; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) { done(); } };
  window.ClaySpeak = (t, o = {}) => { stat("speak", t);
    const done = typeof o.done === "function" ? o.done : () => {};
    try { if (audio) audio.pause(); speechSynthesis.cancel(); } catch (e) {}
    if (!o.src || typeof Audio !== "function") return voice(t, o, done);
    let fell = false; const fall = () => { if (!fell) { fell = true; voice(t, o, done); } };
    try { const a = audio = new Audio(o.src); a.onended = done; a.onerror = fall; const p = a.play(); if (p && p.catch) p.catch(fall); } catch (e) { fall(); } };
  if (window.ClaySayBound) return; window.ClaySayBound = true; // one listener even if a page loads speak.js and sims.min.js
  document.addEventListener("click", e => { const b = e.target.closest && e.target.closest("button.say[data-say]"); if (!b) return;
    b.classList.add("on"); clearTimeout(b._off); const off = () => b.classList.remove("on"); b._off = setTimeout(off, 4000);
    window.ClaySpeak(b.dataset.say, { src: b.dataset.src || "", done: off }); });
})();
