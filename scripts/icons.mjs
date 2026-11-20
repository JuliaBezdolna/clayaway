// The ONE set of line icons of the learning product (Academy, FITASC rules, Glossary, shared bar and animations).
// Decision 20.11.2026 (variant B of design-mockups/academy-icons.html): emoji used as icons are replaced by line icons
// 24×24, stroke 2, round caps, colour = currentColor (the section colour or the text colour). One icon = one meaning in all
// three products. Several icons follow the Lucide set (ISC licence, https://lucide.dev): plane, hands, wrench.
//
// Runtime files (academy.js, nav.js, sims.js, offline-pack.js, rules/index.html, rules/trainer/index.html) carry a COPY of the
// icons they use between the markers  /* icons:begin <VAR> <key> <key> … */ … /* icons:end */ ; the copy is written by
//   bun scripts/sync_icons.mjs          (rewrites the copies)
//   bun scripts/sync_icons.mjs --check  (fails when a copy differs from this file)
// Edit icons HERE, never in the copies.
//
// Meanings (keep them unique):
//   cap Academy, certificate · rbook FITASC rules, topic "Rules" · gbook Glossary · plane Tours, topic "Travel" · pad trainer,
//   Practice · globe language switch · search search · compass route · medal badge, route "First competitions" · lock locked ·
//   print print · check checklist · timer lesson duration · exam lesson without a topic, rules exam · bulb tip · warn warning ·
//   med not medical advice · wrench in preparation · chat stand talk · users rules categories · help questions and answers ·
//   slow slow motion · aim aiming (topic "Technique", "Your turn") · signal offline · down save
export const ICONS = {
  // topics (blocks.json "icon")
  flag: '<path d="M5 21V4"/><path d="M5 4h12l-2.5 4L17 12H5"/>',
  shield: '<path d="M12 3 4.5 6v5.5c0 4.6 3.2 8 7.5 9.5 4.3-1.5 7.5-4.9 7.5-9.5V6z"/><path d="m9 12 2 2 4-4"/>',
  tool: '<rect x="3" y="8" width="18" height="12" rx="2"/><path d="M9 8V5h6v3M3 13h18M10 13v2h4v-2"/>',
  clay: '<ellipse cx="14" cy="15" rx="8" ry="2.6"/><path d="M6.3 14.4C7.3 11 10.3 9 14 9s6.7 2 7.7 5.4"/><ellipse cx="14" cy="9.6" rx="2.6" ry=".9"/><path d="M2 9.5h3M1.5 13h2.5"/>',
  aim: '<circle cx="12" cy="12" r="7.5"/><circle cx="12" cy="12" r="1.2"/><path d="M12 2v5M12 17v5M2 12h5M17 12h5"/>',
  dumbbell: '<path d="M6.5 6.5v11M17.5 6.5v11M3 9.5v5M21 9.5v5M6.5 12h11"/>',
  focus: '<path d="M3 8V5a2 2 0 0 1 2-2h3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3"/><circle cx="12" cy="12" r="3.5"/>',
  rbook: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/><path d="M9 7h7M9 11h5"/>',
  trophy: '<path d="M8 21h8M12 17v4"/><path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4.5a3 3 0 0 0 3 4.5M17 6h2.5a3 3 0 0 1-3 4.5"/>',
  plane: '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.3c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
  chat: '<path d="M21 12a8.5 8.5 0 0 1-12.2 7.6L3 21l1.5-5A8.5 8.5 0 1 1 21 12z"/><path d="M8.5 12h.01M12 12h.01M15.5 12h.01"/>',
  tv: '<rect x="2.5" y="6" width="19" height="13" rx="2"/><path d="m8 2 4 4 4-4"/><path d="m10 10 4 2.5-4 2.5z"/>',
  hands: '<path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.9-3.9a2 2 0 0 0-2.8 0l-.9.9a1 1 0 1 1-3-3l2.8-2.8a2.9 2.9 0 0 1 3.6-.4l.5.3a2 2 0 0 0 1.4.3L21 4l1 7-2 2"/><path d="M5 3 2 4l1 7 6.5 6.5a1 1 0 1 0 3-3"/><path d="M3 4h8"/>',
  // routes (routes.json "icon")
  sprout: '<path d="M12 22V11"/><path d="M12 11C12 6.5 8.5 4 3.5 4c0 4.8 3.5 7 8.5 7z"/><path d="M12 14c0-3.8 2.8-6 7.5-6 0 3.8-2.8 6-7.5 6z"/>',
  medal: '<circle cx="12" cy="15" r="6"/><path d="M7.5 2 10 9.3M16.5 2 14 9.3"/><path d="m12 12.5.9 1.8 2 .3-1.5 1.4.4 2-1.8-1-1.8 1 .4-2-1.5-1.4 2-.3z"/>',
  mic: '<rect x="9" y="2.5" width="6" height="11" rx="3"/><path d="M5 10.5a7 7 0 0 0 14 0M12 17.5V21M8.5 21h7"/>',
  parent: '<circle cx="8" cy="6" r="3"/><path d="M3 21v-3.5a5 5 0 0 1 10 0V21"/><circle cx="17.5" cy="11" r="2.2"/><path d="M14.5 21v-2a3 3 0 0 1 6 0v2"/>',
  whistle: '<circle cx="9" cy="14" r="6"/><circle cx="9" cy="14" r="1.6"/><path d="M13.5 10H21V7H9"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/><path d="M8 14h2M14 14h2M8 17.5h2"/>',
  heart: '<path d="M12 20.5s-8-4.8-8-10.7A4.6 4.6 0 0 1 12 7a4.6 4.6 0 0 1 8 2.8c0 5.9-8 10.7-8 10.7z"/>',
  // practice games (practice.json id)
  ruler: '<path d="M3 21V3l18 18z"/><path d="M7 17v-4.5l4.5 4.5z"/><path d="M3 8h2M3 12h2"/>',
  flight: '<path d="M3 20C6.5 11 12 7 20.5 6.5"/><path d="m17 3.5 3.5 3-3 3.5"/><circle cx="4" cy="19" r="1"/>',
  phones: '<path d="M3.5 18v-6a8.5 8.5 0 0 1 17 0v6"/><rect x="3" y="14" width="4.5" height="7" rx="1.5"/><rect x="16.5" y="14" width="4.5" height="7" rx="1.5"/>',
  scale: '<path d="M12 3v18M6 21h12M5 7h14"/><path d="m5 7-3 7a3 3 0 0 0 6 0z"/><path d="m19 7-3 7a3 3 0 0 0 6 0z"/>',
  cards: '<rect x="3" y="7" width="12" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"/>',
  note: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 3v18M12.5 8h3M12.5 12h3"/>',
  exam: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="m8.5 15 2.5 2.5 4.5-5"/>',
  repeat: '<path d="m17 2 4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15"/><path d="m7 22-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/>',
  // sections, navigation and small marks
  cap: '<path d="m2 9 10-5 10 5-10 5z"/><path d="M6 11v5c3 2.2 9 2.2 12 0v-5"/><path d="M22 9v5"/>',
  gbook: '<path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"/>',
  pad: '<rect x="2" y="7" width="20" height="11" rx="5.5"/><path d="M6.5 12.5h4M8.5 10.5v4"/><path d="M15.5 12h.01M18 13.5h.01"/>',
  compass: '<circle cx="12" cy="12" r="9.5"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
  layers: '<path d="m12 3 9.5 5L12 13 2.5 8z"/><path d="m2.5 12.5 9.5 5 9.5-5"/><path d="m2.5 16.5 9.5 5 9.5-5"/>',
  globe: '<circle cx="12" cy="12" r="9.5"/><path d="M2.5 12h19"/><path d="M12 2.5a14.5 14.5 0 0 1 0 19 14.5 14.5 0 0 1 0-19z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  print: '<path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><rect x="7" y="14" width="10" height="7" rx="1"/>',
  check: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="m8 12 3 3 5-6"/>',
  timer: '<circle cx="12" cy="14" r="8"/><path d="M12 10v4l2.5 2.5M9.5 2h5M12 2v4"/>',
  slider: '<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
  bulb: '<path d="M9 18h6M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/>',
  warn: '<path d="M10.3 3.9 2 18a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
  med: '<path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z"/>',
  wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 21a6.5 6.5 0 0 1 13 0"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M21.5 21a6.5 6.5 0 0 0-3.5-5.8"/>',
  help: '<circle cx="12" cy="12" r="9.5"/><path d="M9.5 9a2.5 2.5 0 1 1 3.6 2.3c-.7.3-1.1 1-1.1 1.7v.5M12 17h.01"/>',
  slow: '<path d="M3.5 18a8.5 8.5 0 1 1 17 0"/><path d="m12 18-4-4.5"/><path d="M12 18h.01"/>',
  signal: '<path d="M3 20h.01M8 20v-4M13 20v-8M18 20V7"/>',
  down: '<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>'
};
// Section colours (the same as LOOK in docs/shared/nav.js)
export const SECTION_COLOR = { learn: "#34D399", rules: "#22D3EE", glossary: "#A78BFA", tours: "#F472B6", trainer: "#FBBF24" };
// svgIcon(key[, color]): the inline icon, 1em square, decorative. The same markup as ico() in the runtime files.
export const svgIcon = (key, color) => {
  if (!ICONS[key]) throw new Error(`icons.mjs: unknown icon "${key}"`);
  return `<svg class="ico" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"${color ? ` style="color:${color}"` : ""}>${ICONS[key]}</svg>`;
};
