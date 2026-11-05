/* ClayArena — English pronunciation of a term (window.ClaySpeak). The ONE source (05.11.2026, moved out of docs/shared/sims.js):
   - glossary term pages WITHOUT an animation load only this file (≈ 0.5 KB) for their 🔊 button (scripts/build_seo.mjs);
   - every page that loads the animations gets it inside docs/shared/sims.min.js: minifySims() (scripts/build_academy.mjs) puts this
     file in front of sims.js, so the Academy (docs/learn/app/academy.js say()), the rules trainer and the animated term pages keep
     ClaySpeak without a second request.
   British English, Web Speech API. A voice that runs on the device (localService) is preferred; if the browser offers only online
   voices, its default voice is used, and that browser may send the text to its speech service. The "speak" event goes to the visit
   statistics (docs/shared/stats.js) when they are on. Production (clayarena.com): recorded voice files (glossary plan, wave 5). */
(function () {
  "use strict";
  const stat = (name, value) => { try { if (window.ClayStats) window.ClayStats.event(name, value); } catch (e) {} };
  const localVoice = () => { try { const vs = speechSynthesis.getVoices() || [];
    return vs.find(v => v.localService && /^en[-_]GB/i.test(v.lang)) || vs.find(v => v.localService && /^en\b/i.test(v.lang)) || null; } catch (e) { return null; } };
  window.ClaySpeak = (t, o = {}) => { stat("speak", t); try { const u = new SpeechSynthesisUtterance(t); u.lang = "en-GB"; u.rate = o.rate || .9; const v = localVoice(); if (v) u.voice = v;
    speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) {} };
})();
