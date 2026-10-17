# Presentation V1 / Stage 1: design direction study

**Status:** design study only. Not final, not approved, not committed. Nothing here is applied to the
lecture beyond the eight blocker fixes (and one map-reveal fix) of §3. Owner + external reviewer choose the direction before
Stage 2.
- **Baseline:** `presentation-v1` at `9a30489` (the capture-audit state).
- **Date:** 2026-10-17.
- **Captured:** production build, Chrome 155 headless, ANGLE D3D11 on Intel Iris Plus, **Low**, LT,
  deterministic 1/30 s steps (the capture-audit harness), stills at settle + 2 s.

**Start here**
1. Live, in the real app: **`http://localhost:5173/?designStudy=1`** (§1).
2. `contact-sheets/all-directions-by-state.png`: A / B / C side by side, five states.
3. `typography/typography-comparison-1080p.png`: the three faces on identical content.
4. `motion/`: the four prototypes (1080p30 H.264).
5. §12: the recommendation and the seven report answers.

## 1. Live review mode (localhost)

A temporary review route inside the existing app. It plays the real 3D scene, the real overlay, real
typography and the real choreography; only a small panel is added.

| | |
|---|---|
| Start | `npm run dev` (a dev server already running on 5173 picks the change up), then open **`http://localhost:5173/?designStudy=1`** |
| Production build | `npm run build && npx vite preview`, then `http://localhost:4173/?designStudy=1` (same behaviour) |
| Deep links | `&dir=a\|b\|c` direction, `&state=1..5` state, `&typography=1` board on, `&panel=0` no panel. The URL follows the panel, so a reload keeps the place |
| Scripted (no panel) | `?study=a\|b\|c` (used for every capture in this folder) |

| Key | Action |
|---|---|
| `1` `2` `3` | Direction **A Precision / B Editorial cinematic / C Technical documentary**: the same state, at once |
| `←` `→` | Previous / next representative state: **1 Opening, 2 Lithuania / 50 %, 3 Facts / 24–36 months, 4 Safety / 7 days, 5 Closing**, entered with its real transition from the settled beat before it |
| `P` | Replay the current state's transition |
| `6` `7` `8` `9` | Motion prototypes A metric reveal, B shared object, C fission reset, D safety rhythm (D auto-presses at the clip's timings) |
| `T` | Typography A/B/C board over the frame (identical content, real fonts) |
| `H` | Hide / show the panel: the full frame alone |
| `Space`, `PageDown`, `PageUp` | Unchanged: the talk's own next / previous beat (walk on from any state) |

- The panel names the current direction, state and live beat, and the stage size. The stage is
  always 16:9; composition is the 1920×1080 composition at any window size (full screen: F11).
- Keys are matched by physical position (`event.code`), so the Lithuanian keyboard layout works.
- **Normal mode is untouched:** without `?designStudy` / `?study` nothing of the study loads or runs
  (stylesheet, fonts and review chunk are separate lazy assets).
- **Portable build:** the study is compiled out (`import.meta.env.MODE !== 'portable'` at every call
  site). Verified on a portable build: no study stylesheet, fonts, patches, panel or strings
  ("designStudy", "Study Sans C", "QR size test", "study-" classes: 0 matches). The package grows
  1,660,936 → 1,664,230 B (+3.3 KB): the lecture fixes plus inert, generic overlay support
  (leader-line labels, a cue-driven `--p`).
- `review-mode/` has screenshots of the panel.

## 2. Diagnosis (from the capture audit)

The 3D world, the continuity and the content are strong; the finish is not. In order of visible impact:
1. **Typography without a system.** ~15 sizes, Light (300) on every large element, 14–15 px small
   print, Segoe UI Variable from the system only.
2. **One accent does everything.** `#e8a33d` marks kickers, units, rules, dots, pins, alerts, the
   counter bar and a TODO.
3. **Empty frames, one exterior.** 61–84 % flat dark area on exteriors; ch1/4/6/12 are near-identical crops.
4. **Everything on one left gutter**, far from what it describes (safety: headline left, counter
   1,400 px away).
5. **Text before picture**, 0.3 s text overlaps, `~0 MW`, long transitions, fly-throughs, a black
   fission seam, a plinth floating in a void on every plant ↔ map move.

**Principle used throughout: show / transform the idea first, then let the text confirm it.**

## 3. Blocker fixes applied to the lecture (§7 of the brief)

The only changes to the normal presentation. Each is small, documented and regression-checked (§10).
Before/after frames: `blocker-fixes/`.

| # | Defect (audit ref.) | Cause | Fix (file) | Result |
|---|---|---|---|---|
| 1 | "Tai vyksta kure" off-screen (A.1) | anchored 2.4 m above the vessel floor; the warm spot is at mid core | anchor = the inset's own `FISSION_ANCHOR` (`chapters.ts`) | on screen at y 589 (was 1269) |
| 2 | "vanduo kyla" off-screen (A.1) | anchor at vessel floor + 6 m | + 7.5 m, still in the core (`chapters.ts`) | y 984–1012 (was 1107) |
| 3 | "separatoriai" clipped (A.2) | anchor at −7.6 m, pushed down by the camera rise | −6.6 m, still on the separators (`chapters.ts`) | y 957–985, whole (was cut) |
| 4 | Orphan "*" (A.4) | the counter's last step was "7 paros", the copy key "7 paros*" unused | last step = `copy['safety.days']` (`TalkOverlay.tsx`) | "7 paros*" ties to its note |
| 5 | Low-contrast small print on light scenes (A.3) | 14–15 px `#a7adb3` with no backing | a soft dark halo on the chapter label, notes and counter note everywhere, plus a quiet 0.72 backing on the five light-scene beats (`lightScene` flag: Darlington, control ×3, scram) (`talk.css`, `TalkOverlay.tsx`, `chapters.ts`, `types.ts`) | Darlington label 2.17 → 6.63, note 2.55 → 6.92; control 3.72 → 7.53, note 4.15 → 7.63; scram 2.88 → 7.33 |
| 6 | Stale map pin after the map closes (E.6) | pins kept full scale until the whole map group hid | pins (and the Darlington ping) shrink with the closing map: `smoothstep(m.world, 0.5, 0.85)`; untouched while open (`Maps.tsx`) | they shrink away 1.2–1.8 s into the close, before the plant is back |
| 7 | `~0 MW` before the count (E.4) | the stat appeared at the press, the count started 1.4 s later | the stat fades in on its own count cue (`chapters.ts`) | first visible value is mid-count |
| 8 | Scram fly-through (E.8), in the sampled safety transition | a direct path from the overview through pools, pipes and the containment wall | one key in front of the cut vessel (`P.scramApproach`, 1.7 s); same end pose and timing (`chapters.ts`) | the cut vessel stays in view; settled frame identical |

Also fixed because the continuity prototype exposed it: **map glyphs appearing early.** The map's
radial-reveal shader ignored the instance matrix, so every instanced glyph (wind turbines, solar
fields, city glows) was revealed as if it stood at the origin and floated over the dark ground before
the map reached it (also visible in the audit's 1 → 2 transition). One `#ifdef USE_INSTANCING` line in
`Maps.tsx`; settled frames unchanged.

Not fixed (out of scope, recorded): the `close/return` fly-through, site-ground speckle, the 283 ms
first-press stall, Clinch River's status coding.

## 4. Typography A / B / C

`typography/typography-comparison-1080p.png` is a screenshot of the live board (`T` in review mode):
the same five samples in each face, at their real 1080p sizes, in each direction's tokens.

**Candidates tested.** Lithuanian coverage was checked on the glyph tables (every character in the LT
and EN copy, plus Ą Č Ę Ė Į Š Ų Ū Ž, „ “ – — … × ≈ ≠ → ~): all four faces cover everything. Rendering
was compared in `typography/lt-specimen-segoe-inter-plex-manrope.png`.
- **C: IBM Plex Sans over Manrope.** Both render Lithuanian correctly. Plex is chosen: sturdier colour
  at 16–18 px (projector), clearer ogoneks and carons at small sizes, a technical voice that fits the
  documentary direction, and a width axis for condensed labels. Manrope is geometric and friendlier,
  lighter at small sizes, and its ≈ / ≠ sit small. It is the smaller file (29.5 KB), the only point in
  its favour.
- **Inter finding:** its `tnum` feature also respaces `-`, `.` and `*` ("2026 - 01 - 28", "mėn. *").
  Tabular figures must be applied only to numbers that count up, never globally (the current overlay
  sets them globally).

**Normalized scale: 8 roles instead of ~15 sizes** (px at 1080p · weight; every weight is a real instance)

| Role | Use | A Segoe UI Variable | B Inter Variable | C IBM Plex Sans | Floor on small stages |
|---|---|---|---|---|---|
| display | opening title, closing thesis | 76 · 600, −0.01em | 80 · 600, −0.03em | 72 · 500, −0.015em | — |
| metric | 50 %, ~300, 24–36, 7 paros | 100 · 350 (Semilight) | 108 · 500 | 96 · 400 | — |
| h1 | claim / safety headline | 48 · 400 | 52 · 600 | 46 · 500 | — |
| h2 | metric unit, "Jūsų klausimai" | 30 · 400 | 32 · 500 | 28 · 500 | — |
| body | supporting line, names (600) | 23 · 400 | 24 · 400 | 22 · 400 | 13 px |
| label | anchored technical / map label | 19 · 600 | 19 · 500 | 18 · 500 | 12 px |
| source | source, qualifier, footnote, e-mail | 17 · 400 | 17 · 400 | 16 · 400 | 12 px |
| micro | chapter label, kicker (caps, tracked) | 16 · 600, +0.16em | 16 · 600, +0.12em | 16 · 600, +0.10em | 12 px |

- No 200 anywhere: today's metrics ask for 200 and Segoe renders 300. Large type moves to 350–500
  (A keeps the lightest, as the "refined current" option).
- Sizes are stage-relative (`cqh`); 1280×800 and 1024×768 keep the composition and floor the small
  print (§7).

**Licensing, offline, lecture PC, portable**

| | A Segoe UI Variable | B Inter | C IBM Plex Sans |
|---|---|---|---|
| Licence | Microsoft, ships with Windows; **may not be redistributed or bundled** | SIL OFL 1.1, no Reserved Font Name | SIL OFL 1.1, **Reserved Font Name "Plex"**: a subset is a Modified Version, so it was renamed ("BWRX Study Sans C"; copyright and licence records kept). Alternative: IBM's unmodified WOFF2 |
| Offline | only if the PC has it | bundled (`src/presentation/study/fonts/`) | bundled |
| Lecture PC | Windows 11 only. Windows 10 has static Segoe UI (other metrics, no Display optical size); macOS / Linux fall back to system-ui: **the look depends on the machine** | identical everywhere | identical everywhere |
| Portable single file | nothing to embed (and nothing guaranteed) | embedded as data URI | embedded as data URI |
| Subset (this study) | — | 104,260 B WOFF2 (from 876,576 B TTF; opsz 14–32, wght 100–900) | 78,136 B WOFF2 (from 537,244 B; wght 100–700, wdth 75–100) |

Subset: Basic Latin, Latin-1, Latin Extended-A, the punctuation and symbols above; all axes and
layout features kept; hinting dropped. Provenance: `src/presentation/study/fonts/README.md`.
Only the winning face stays in production (the others and the study folder are removed in Stage 2).

## 5. Package size and performance impact

| | Portable `BWRX300.html` | Δ |
|---|---|---|
| `9a30489` baseline (rebuilt here) | 1,660,936 B | — |
| This pass (fixes + study compiled out) | 1,664,230 B | +3.3 KB |
| Direction A in production | ≈ 1.66 MB | +0 (system font) |
| Direction B in production | ≈ 1.80 MB | + ≈ 139 KB (104 KB WOFF2 as base64) |
| Direction C in production | ≈ 1.77 MB | + ≈ 104 KB |

- The normal build adds one cached WOFF2 request (B 104 KB / C 78 KB), and the study chunk splits
  the talk code into its own file (`talk-*.js`, ~100 KB; the same code as before).
- Runtime: no measurable cost from a web font (one decode at load). Stage 2 must load it before the
  ready gate opens (`document.fonts.load`) so the opening never flashes a fallback face.
- Fission prototype C draws a second particle / sprite pair only during its ~0.8 s cross-dissolve
  (same shader programs: no new compile). Performance: §9.

## 6. Palette

One disciplined palette, shared by all directions; directions differ in how much of it they use.
**Amber means one thing: the current concept** (at most one amber element per frame). Process colours
(cool, steam, copper) belong to the 3D processes and their labels' dots, never to decoration.

| Token | Value | Job |
|---|---|---|
| background / charcoal | `#0d0f12` | page, stage, scrims |
| primary text | A `#f2f1ed` (off-white) · B `#f7f8f8` · C `#eef1f4` | everything readable |
| secondary text (brighter than today's `#c5cacf`) | `#d1d5d9` | supporting lines, units |
| source / qualifier (today `#a7adb3`) | `#b8bec4` | sources, notes, e-mails; always with a halo |
| amber: active attention | `#e8a33d` | the one current concept: A kicker, timeline band, "Jūsų klausimai", the C link dot |
| cool: water, cooling, passive flow | `#78b4da` (UI tint of the scene's `#5c9cc3`) | C counter bar, water dots |
| neutral white: steam | `#e8edf0` | steam dots |
| muted copper: heat, fission | `#d38c5c` | heat dots, "≠ 0" |
| steel gray: inactive, context | `#8a939c` | rules, inactive status, placeholders; never body text on panels |
| label panel | `rgba(13,15,18,0.60–0.74)` | role 1 backing on light scenes |

**Contrast of the tokens** (WCAG; `validation/palette-contrast.md`)

| Token | on charcoal | on map sea `#121a22` | on mid scene `#4c535b` | on light scene `#8a8f95` | light scene + 0.72 panel |
|---|---|---|---|---|---|
| primary text (B) | 18.0 | 16.5 | 7.3 | **3.1** | 11.9 |
| secondary text | 13.0 | 11.9 | 5.3 | **2.2** | 8.6 |
| source / qualifier | 10.2 | 9.4 | 4.2 | **1.7** | 6.8 |
| amber | 8.9 | 8.1 | 3.6 | **1.5** | 5.9 |
| cool | 8.5 | 7.8 | 3.5 | **1.5** | 5.7 |
| copper | 7.0 | 6.4 | 2.9 | **1.2** | 4.6 |
| steel | 6.2 | 5.6 | 2.5 | **1.1** | 4.1 |
| today's qualifier `#a7adb3` | 8.5 | 7.8 | 3.4 | 1.4 | 5.6 |

Reading: no colour survives a light scene area on its own, so **small text over light 3D must have a
backing** (panel ≥ 0.6, or a halo on mid tones). That rule is part of the label system.

## 7. Label system: four roles (replacing tag / value / word / micro)

| Role | Spec | Replaces |
|---|---|---|
| **1 Anchored technical label** | a 10 px dot on the thing (dark 2 px ring), a 1 px leader `rgba(236,239,242,.62)` of 30–90 px, text beyond its end (label role, 18–19 px); backing: halo on dark / mid, panel on light. Status or process colour lives in the **dot**, never in a border | tag (amber rule), micro labels floating 130 px away |
| **2 Chapter / claim text** | h1 / body, no card, no rule; placed next to what it claims (editorial placement), with a scrim only where the scene is busy | caption + alert rule |
| **3 Source / qualifier** | 16–17 px source role, `#b8bec4` + halo; **directly under what it qualifies**, not a page footer | 14–15 px note at the bottom edge |
| **4 Metric** | large number + quiet unit (h2, secondary colour) + one supporting line + its source | stat + amber unit + footer note |

Rules: no amber borders; one amber element per frame; leaders never cross text; labels arrive with
(or after) the visual change they name.

## 8. The three directions on five states

Full-resolution stills: `stills/` (`A-1-opening.png` … `C-5-closing.png`, plus `*-s-world-map-tags.png`
for the map-tag contrast check). Contact sheets: `contact-sheets/`. Same state, same copy, same
moment in every direction.

| State | A Precision | B Editorial cinematic | C Technical documentary |
|---|---|---|---|
| **1 Opening** | current 3/4 view, plant +35 % taller / +32 % wider on screen; amber kicker; small round placeholders; QR 200 px | low hero camera (fov 30), plant +53 % taller / +17 % wider (the low angle adds height), right of centre, title in the dark sky; names only, divided by a hairline; QR 173 px | mid technical 3/4 (fov 32), plant +28 % taller / +33 % wider; kicker with an amber hairline; credits under a rule |
| **2 Lithuania / 50 %** | the table moved right; the metric column sits on the open sea; source under the line | lower, closer table; bigger, heavier metric on a gradient scrim | as A, plus a leader from the country to the number |
| **3 Facts / 24–36** | the number tied to a construction timeline (0–36 months, 24–36 band) next to **a second, identical unit going up beside ours** (`k.modules` 0 → 1) | the same, the timeline as a long editorial bar along the bottom | the same, a technical scale (6-month ticks) |
| **4 Safety / 7 days** | one eye path: reactor (left) → riser → condenser → one right column (headline, then "7 paros*" and its note) | the same path, heavier type, no label backing | the same path, longer angled leaders, process-coloured dots, label panels |
| **5 Closing** | the opening camera again (visible echo); thesis at display size in two balanced lines; "Jūsų klausimai" in amber; QR 270 px | the same, B's low camera | the same, C's camera |

Notes:
- The QR is a **real, scannable size test** (version 3-M, the same version a short Pages URL needs).
  It encodes plain text, "QR size test - BWRX-300 study, URL TBD", never a link; the lecture keeps its
  placeholder until the public URL exists. At 270 px on a 3 m wide image the code is ~0.42 m wide:
  scannable from roughly 4 m (rule of thumb 10:1). Front rows only; the speech must also say the URL.
- Presenter placeholders are 56 px round head-and-shoulders marks (A, C) or none (B), not 31 %-high
  figures; final likeness is still open.
- The 24–36 visual keeps the claim honest: one unit's construction window, first nuclear concrete to
  fuel load, vendor estimate for a series unit (the qualifier sits under the number).

**Projector check (recommended direction B):** `projector/1920x1080`, `1280x800`, `1024x768`.

| | 1920×1080 | 1280×800 (stage 1280×720 at y 40) | 1024×768 (stage 1024×576 at y 96) |
|---|---|---|---|
| Composition | reference | identical (stage-relative) | identical (stage-relative) |
| Metric / display | 108 / 80 px | 72 / 53 px | 58 / 43 px |
| Body / label / source / micro | 24 / 19 / 17 / 16 px | 16 / 12.7 / 12 / 12 px (source, micro at their floor) | 13 / 12 / 12 / 12 px (all at their floor) |
| Smallest text | 16 px (chapter label) | 12 px | 12 px (today: 11 px) |
| Text outside the stage | 0 of 5 states | 0 | 0 |
| Overlapping text boxes | 0 | 0 | 0 |

A and C at 1080p: also 0 outside, 0 overlaps (`validation/projector-check.txt`). The floors only
matter for glyph rendering: physically, a 1024×768 projector throws the same picture size, so text
keeps its share of the screen.

**Contrast audit** (WCAG ratio of each text colour against the pixels actually under it, halo and
panels included; lowest per role; `validation/contrast.json`)

| Role | A (1080p) | B (1080p) | C (1080p) | B 1280×800 | B 1024×768 |
|---|---|---|---|---|---|
| Source / qualifier notes | 8.8 | 10.2 | 8.9 | 10.2 | 10.2 |
| Chapter labels | 8.0 | 10.6 | 7.8 | 10.6 | 10.6 |
| Map tags (world map, supplementary still) | 9.9 | 8.5 | 9.9 | — | — |
| Technical labels (safety loop) | 10.8 | 11.7 | 15.6 | 10.0 | 10.8 |
| Opening / closing contacts | 11.1 | 12.6 | 11.0 | 12.6 | 12.5 |
| … the TODO e-mail placeholder (steel, deliberately muted) | 5.2 | 5.8 | 5.4 | 5.8 | 5.8 |
| Headlines, metrics, captions | 6.5 | 9.1 | 6.4 | 9.1 | 9.1 |

Every audited role passes WCAG AA (4.5:1) at every size; the capture audit's lowest values were 2.17
(chapter label on Darlington), 2.55 (note), 2.88 (scram label). B's scrims make it the most robust.

## 9. Motion prototypes (not retimed globally)

`motion/`: 1080p30 H.264 (High, yuv420p, BT.709), deterministic 1/30 s steps at real speed, real key
presses, direction B, Low. Each has a filmstrip (`motion/*-filmstrip.png`).

| Clip | What it proves | Timing |
|---|---|---|
| **A `A-metric-reveal.mp4`** (12.0 s, two shots, hard cut between) | Power: the comparison sinks away (still ghosted), the hall lights and the line carries power out (0.6–2.6 s); "~300 MW" counts in **already visible** (2.3–3.6 s), never a static `~0`. Months: a second unit rises while the timeline fills 0 → 24 (0.9–4.9 s); the 24–36 band lights and the number lands with it (4.5–5.1 s) | text after picture by 1.7–3.6 s |
| **B `B-shared-object-transition.mp4`** (7.4 s) | Plant → Lithuania: the map spreads out from under the plant (the ground literally becomes the table, 0–2.6 s), then the plant shrinks into its node on it (1.1–4.0 s); no plinth, no void, no glyph popping (instanced reveal fixed); "50 %" when the country is alive (4.1 s) | one continuous move |
| **C `C-fission-reset.mp4`** (12 s) | One full chain, then the next starts while the last fragments dissolve: loops overlap by 1.6 τ, a 0.8 s cross-dissolve, **no near-black seam** (the lecture goes fully dark at ~11.5–12.3 s, `C-fission-seam-current-vs-prototype.png`) | period unchanged |
| **D `D-safety-rhythm.mp4`** (12.4 s; 0.4 s over the 12 s target so the counter's last step is seen) | power loss → reaction stops → heat remains → passive cooling → 7 days: one change per press, then a hold; text 0.9–1.6 s after the change; two camera moves only, both through open space (no collisions); the loop labels follow the flow (steam 1.7 s → pool 2.3 s → return 2.9 s) | presses at 0 / 2.2 / 4.4 / 6.6 / 9.4 s (2.5× the spoken tempo: holds are presenter-paced in the talk) |

Findings: the 0.3 s text overlap disappears when text is cued to the picture instead of the press;
the dissolve in C is slightly muddy while both loops are half-transparent (shortened to 0.8 s; the
alternative "one chain, then a stable hold" freezes the particles and was not preferred).

**Performance (Low, real time)**

Lecture (default mode), Low, 1920×1080, real presses through all 32 beats, final build
(`validation/perf-lecture-low-1080p-run2.json`; a GPU sampler ran alongside):

| Chapter | avg fps | lowest beat | worst frame ms | frames > 20 ms |
|---|---|---|---|---|
| hook | 58.1 | 58.1 | 249.3 (the known first-press stall, audit A.12) | 2 |
| lithuania | 60.0 | 59.9 (calm) | 33.4 | 2 |
| scale, facts, projects, handoff | 60.0–60.1 | ≥ 59.9 | ≤ 33.0 | ≤ 1 |
| fission | 60.1 | 60.1 | 17.2 | 0 |
| control | 60.1 | 60.1 | 17.0 | 0 |
| energy | 60.1 | 60.1 | 17.3 | 0 |
| safety | 60.1 | 59.9 (ics) | 33.2 | 2 |
| limits, close | 60.1 | 60.1 | ≤ 17.8 | 0 |
| **all** | **60.0** | | | |

- A first run (`perf-lecture-low-1080p.json`) showed control at 49.1 fps. Interleaved A/B on the
  control and boil beats (`perf-ab-control.txt`, 2 rounds) gave this build 60.1 fps on every beat
  (the baseline 59–60.1). The sampler showed Firefox (the owner's browser, untouched) using up to
  59 % of the GPU 3D engine during the session (`gpu-lecture-run2.csv`): the same outside contention
  the capture audit recorded. Not caused by this pass.

Study, direction B, Low (`perf-study-b-low-1080p.json`): every state and prototype 59.9–60.1 fps
average; fission over 16.4 s including the first overlap: 60.1 fps, worst frame 17.2 ms, 60 draw
calls; worst single frames 49.8 ms (opening, first entry) and 33.2 ms (map transition), as in the
lecture.

## 10. Validation

| Check | Result |
|---|---|
| `npm run check` (typecheck, lint, production build) | PASS. Final build `index-B0Ba_RMq.js`; `vite preview` serves the same file (`validation/build-id.txt`) |
| Portable build (`vite.portable.config.ts`, into scratch; the shipped package was not touched) | builds; 1,664,230 B (baseline 1,660,936 B); 0 matches for 15 study markers; the lecture fixes are present (`validation/portable-check.txt`) |
| Lecture regression vs `9a30489` (default mode, Low, clock pinned, both builds served side by side) | 32/32 beats: camera, world state and timing identical; WebGL frames identical except the three moved labels (fixes 1–3); overlay differences are exactly fixes 4–5 (`validation/regress-compare.txt`) |
| 48 s legacy cinematic | 10/10 sampled frames (0.5–47.9 s) pixel-identical to `9a30489` |
| Determinism (prototype C, the only scene-code prototype) | two independent captures: 121/121 frames pixel-identical |
| Every beat reachable by real presses | 32/32 (both Low walks; the walk aborts otherwise) |
| Console / page errors | none; only the known `THREE.Clock` deprecation warning |
| External requests | none in any run (lecture, study, review mode; fonts are local) |
| Projector sizes (B) | 0 text outside the stage, 0 overlaps; smallest 12 px (§8) |
| Study captures | clip D, the typography sheet and all lecture before/after frames: the final build. Clips A–C, the stills, projector stills and review-mode screenshots: the build just before the last three changes (lecture scram path, light-scene backing, typography-board rows), none of which touches what those files show (study mode patches the scram camera; the study states carry no light-scene flag) |

## 11. Scores (1–5, 5 = best; implementation complexity: 5 = simplest)

| Criterion | A Precision | B Editorial cinematic | C Technical documentary |
|---|---|---|---|
| First-impression professionalism | 3 | **5** | 4 |
| Typography | 3 | **5** | 4 |
| Hierarchy | 3 | **5** | 4 |
| Projector readability | 3 | **5** | 4 |
| Cohesion with 3D | 4 | 4 | 4 |
| Technical credibility | 3 | 3 | **5** |
| Cinematic quality | 2 | **5** | 3 |
| Information clarity | 3 | 4 | **5** |
| Offline robustness | 2 | **5** | **5** |
| Implementation complexity | **5** | 4 | 3 |
| **Total (of 50)** | **31** | **45** | **41** |

Why not simply the highest score: B wins on finish, but C is genuinely better where the talk explains
machinery (chapters 7–10); A is cheapest but cannot guarantee its own font on the lecture PC.

## 12. Recommendation and the seven answers

1. **Recommended direction: B, Editorial cinematic, with C's anchored labels in the technical
   chapters.** B makes the opening, the facts and the closing look like a finished product film:
   heavier real weights read on a projector, asymmetric compositions use the dark space on purpose,
   and its labels are already role-1 anchored labels. From C take the process-coloured dots and the
   longer leader labels for chapters 7–10, where anchoring carries the explanation. A is the
   low-risk fallback only if the lecture PC is confirmed Windows 11.
2. **Font: Inter Variable**, bundled as the 104 KB subset (OFL, no rename needed), tabular figures
   only on counting numbers. Runner-up IBM Plex Sans (renamed subset or IBM's own WOFF2); Manrope
   rejected.
3. **Palette:** §6 tokens: charcoal `#0d0f12`, near-white `#f7f8f8`, secondary `#d1d5d9`, source
   `#b8bec4`, amber `#e8a33d` for the single current concept, cool `#78b4da`, steam `#e8edf0`, copper
   `#d38c5c`, steel `#8a939c`; panels 0.6–0.74 under small text on light scenes.
4. **Label system:** §7, four roles: anchored label (dot + fine leader, colour in the dot), claim
   text without cards, source directly under what it qualifies, metric = number + quiet unit + one
   line.
5. **Highest-impact composition changes:** (a) the safety eye path reactor → condenser → one right
   column; (b) 24–36 tied to a unit going up and a timeline; (c) the opening / closing hero 30–40 %
   larger with light presenter credits and a real-size QR, the closing on the same camera; (d) every
   source under its number; (e) the Lithuania metric on open sea instead of over the map.
6. **Highest-impact motion changes:** (a) text cued to the picture, not the press (removes the 0.3 s
   overlaps and the `~0 MW`); (b) the ground-becomes-map continuity on every plant ↔ map move;
   (c) the seamless fission reset; (d) one change per press with holds in the safety chapter, with
   camera paths through open space only.
7. **Portable size / performance trade-offs:** B adds ≈ 139 KB to the single-file package (1.66 →
   ≈ 1.80 MB) and one cached request in the normal build; no runtime cost. C costs ≈ 104 KB and more
   overlay elements per frame (leaders, panels). A costs nothing but gives up offline font robustness.
   The fission overlap adds one particle draw for ~0.8 s per loop (measured in §9).

## 13. Files

**Changed in the lecture (§3 fixes):** `src/presentation/chapters.ts` (anchors, power cue, scram
key, `lightScene` on five beats), `ui/TalkOverlay.tsx` (counter's last step, light-scene class),
`ui/talk.css` (halo, backing), `types.ts` (`lightScene`), `scene/Maps.tsx` (pins leave with the map,
instanced reveal).

**Study support in shared files (inert without `?study` / `?designStudy`, compiled out of the
portable build):** `talk.ts` (patched beats; `replaceTalkBeats`; `jump(…, instant)` for the review),
`types.ts` (`source` on stats, `leader` / `leaderTo` on labels, a `study` item), `overlayLayer.ts`
(leader geometry, `--p` progress), `ui/TalkOverlay.tsx` (study variables, `data-study` / `data-id`),
`scene/ChainFission.tsx` (prototype C), `app/App.tsx` (lazy review panel).

**Temporary, the whole study (`src/presentation/study/`):** `studyMode.ts`, `studyChapters.ts`
(compositions + motion patches), `tokens.ts`, `study.css`, `StudyBlocks.tsx`, `StudyReview.tsx`,
`review.ts`, `qrSample.ts`, `fonts/` (Inter and the renamed Plex subsets, OFL texts, provenance).
Stage 2 keeps the chosen pieces and deletes the rest of this folder.

**This folder:** `DESIGN-STUDY.md`, `contact-sheets/`, `stills/`, `typography/`, `motion/`,
`projector/`, `blocker-fixes/`, `review-mode/`, `validation/`.

## 14. Open questions for the owner / reviewer

- Is the lecture PC Windows 11? (Decides whether A is viable at all.)
- B with C's technical labels, or a pure direction?
- Is a second unit going up acceptable as the 24–36 months visual (it also reads as "modular")?
- The public URL for the real QR, Virgilijus Kiltinavičius's e-mail, presenter likeness (still TODO).
- Safety tempo: the prototype runs at ~2.5× the spoken tempo; the talk's holds are presenter-paced.
