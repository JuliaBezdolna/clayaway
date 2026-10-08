# Mascot sketch, variant C: yellow Labrador, round cartoon

Files in this folder:
- `sheet.svg`: the sketch sheet (1600×1000, one file, no external assets). Every body part is a separate shape in `<defs>`.
- `sheet.png`: headless Chrome render of the sheet.
- `notes.md`: this file.

The sheet shows the main pose (sitting, friendly), 5 variants (happy jump, head tilt, pointing, dog earmuffs with "Safety first!", sleeping), the 48 px avatar (also shown at 32 and 24 px, on dark and light), the stand scene in side view, the construction shapes, the character rules and the palette.
No name appears anywhere on the sheet because the name has not been chosen yet.

## Character in one line
A rounder cartoon version of a yellow Labrador. The head is about the same size as the body, with simple geometric parts and a very readable face. It stays calm and kind, so it still suits adult learners. Its own signature details are the **emerald collar** (ClayArena colour) and a **mini clay-disc tag** (an orange target on the collar).

## Palette (6 colours)
| Role | Hex | Used for |
|---|---|---|
| Fur | `#F4C460` | head, body, legs, tail |
| Shade | `#D39338` | ears, far legs in side view, lead (leash) |
| Cream | `#FFEAC0` | muzzle, chest bib, lower jaw |
| Ink | `#2A1A10` | outline, eyes, nose, mouth (a warm dark brown, not black) |
| Emerald | `#10B981` | collar, dog earmuffs (ClayArena accent) |
| Clay | `#FB923C` | collar tag (a mini clay target), tongue (the site's clay orange) |

Extras that are not new colours: white for the eye shine, `#34D399` (the site's light emerald) for the shine on the earmuffs.
I checked it on `#0B1311`, `#121D1A`, `#0b2540` and on light `#F3F4F6`. The yellow fur stands out on every dark background, and the ink outline keeps the shapes apart on light backgrounds.

## Shapes (front view; origin = centre of the head; the head is 132 × 116 units)
- **Head:** a wide oval, `rx 66, ry 58`.
- **Ears:** short drop ears, each a rounded triangle that hangs to cheek level. A Labrador's ears are short and sit close to the head, so they should not hang long like a spaniel's.
- **Muzzle:** a cream "bean" with a big rounded-triangle nose. The eyes are dark ovals with one white shine each.
- **Body:** a pear shape with a cream chest bib. The front legs are two straight columns, the haunches are two circles and the paws are flat ovals.
- **Tail:** a thick, tapering otter tail, the most typical Labrador feature.
- **Outline:** 4 units at sheet size, round joins. Features inside the head (muzzle, eyes) have no outline, which keeps the face clean.
- **Small sizes:** below about 64 px, drop the brows and toe lines and use the bigger avatar eyes (`#eyesAv`). The outline stays at about 2 px on screen (9 units at scale 0.25).

## Why it fits clay shooting
- The Labrador is the classic shooting-ground dog. It is a retriever that waits calmly at heel. This matches what we teach: patience, routine, safety.
- In the stand scene the dog follows the clay with its eyes, just as a learner should. It reacts to "Pull!" and never runs out.
- The colours come from the sport and the site: yellow fur next to the orange clay and the emerald ClayArena accent.
- **Safety is part of the character.** Near shooting it sits behind the stand, on a lead, next to its handler, with dog earmuffs on. It is never in front of the guns and never carries a gun or a cartridge. The people in the scene wear ear defenders, and the shooter also wears glasses.

## Speech
- It speaks **English only, or not at all**, whatever the page language. This is the owner's decision: one set of drawings for all 11 site languages.
- Bubbles are short: "Pull!", "Good shot!", "Safety first!". A "?" or "z z Z" works without words.
- Developer note: the bubble text is part of the picture and is not translated. The image `alt` / `aria-label` is ordinary UI text and follows the page language like every other UI string.

## Originality checks (keep it 100 % our own)
- No spots, no bone-shaped tag, no human clothes, no gloves, no famous long-snout or droopy-face cartoon style, no red collar.
- The signature details stay fixed: round head, short drop ears, emerald collar, clay-disc tag.
- Before publishing, run a quick reverse-image search of the final art.

## Animation in canvas (each `<defs>` part = one layer; draw with `Path2D` from the same path strings)
Draw order (front view): tail → haunches → torso → hind paws → front legs → chest bib → collar → head (head, mouth, nose, eyes, brows) → ears → earmuffs.

| Motion | Layer and pivot | How |
|---|---|---|
| **Ear flick on "Pull!"** | front-view ears: pivot (−34,−50) and (34,−50); side view: pivot (2,−28) in head space | On the "Pull!" event, rotate the ears up and back by −18° within 100 ms, then let them settle with a damped spring (about 350 ms, one small overshoot). Start the second ear 40 ms later. With earmuffs on, only the flap below the cup moves. |
| **Head follows the target** | side-view head: pivot = neck (0,24) | `target = atan2(clay.y − head.y, clay.x − head.x)`, clamped to −40°…+10°. Smooth it (`angle += (target − angle) * 0.15` per frame). The eyes move 2–3 px ahead of the head, and the head stops when the clay breaks or lands. |
| **Tail wag** | front-view tail: pivot (60,177) | Idle: sine ±10° at about 2 Hz. Correct answer: ±16° at 4 Hz for 1.2 s. Side view: the tail sweeps along the ground. |
| Blink | eyes | Every 3–6 s, chosen at random, squash `scaleY` to 0.1 for 120 ms. |
| Breathing | torso and bib | `scaleY` 1.00 ↔ 1.02, about 0.25 Hz. In sleep, the whole body breathes and the "z" letters float up and fade. |
| Happy jump | whole body | Squash `scaleY` 0.92 (80 ms), hop up 30 units with ease-out (220 ms), ears rotate out to the 58° flap pose, land with a small squash. |
| Head tilt | head | Rotate −14° around the neck (0,56) over 250 ms, and lift one ear by −28°. |

With `prefers-reduced-motion`, show only the static pose for each state, with no loops.

## Where it appears in the Academy
- Correct answer: happy jump + "Good shot!".
- Wrong answer: head tilt + "?". It is gentle and never mocks the learner.
- Tips: pointing with a paw at the thing to look at.
- Safety notes and gun-safety lessons: earmuffs + "Safety first!".
- Empty states (no progress yet, nothing found): sleeping.
- Avatar: progress, notifications, the Academy home.

## Open points for the owner
- The name (not chosen; nothing written on the sheet).
- Should the dog always wear earmuffs in stand scenes? This sketch says yes; the ears still show the "alert" flick below the cups.
- Which variant (A/B/C) goes forward, and then a clean master file for the site.
