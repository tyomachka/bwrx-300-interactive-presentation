# Presentation V1 / Stage 2: editorial cinematic, applied

**Status:** ready for owner / external review. Not final, not approved, not committed (the Stage 2
work is in the working tree on `presentation-v1`). The motion / transition pass (Stage 3) has not started.

- **Stage 1 checkpoint commit:** `43ad04c` *presentation: design study and visual blocker fixes*
  (design study, the eight blocker fixes, the capture-audit package, the briefs). `npm run check` passed first.
- **Captured:** 2026-10-17, production build, Chrome 155 headless, ANGLE D3D11 on Intel Iris Plus, Low,
  LT (EN spot checks), deterministic 1/30 s steps, stills at settle + 2 s (fission at fixed loop times).
- **Final build:** `index-Df2ygvcJ.js` (`validation/build-id.txt`).

**Start here:** `stage2-chapters-contact-sheet.png` → `stage2-before-after.png` →
`presentation-stage2-full-walkthrough-1080p.mp4` → §8 the three weakest areas.

## 1. Package

| File | What |
|---|---|
| `stage2-chapters-contact-sheet.png` | B. One settled production still per chapter (12) |
| `stage2-key-states-contact-sheet.png` | C. Facts ×3, fission ×6, control ×3, energy ×5, safety ×6, limits, return, closing |
| `stage2-before-after.png` | D. Audit baseline `9a30489` vs Stage 2: opening, Lithuania, 24–36, grid, 7 days, limits, closing |
| `presentation-stage2-full-walkthrough-1080p.mp4` | E. The whole talk at 1×, 32 real presses, one take, audit hold policy (4 s after a chapter's first beat, 2.5 s otherwise, fission 14.5 s, closing 6 s). H.264 High, yuv420p, BT.709, CRF 20 |
| `stage2-projector-sheet.png`, `projector/` | F. Nine states at 1920×1080, 1280×800, 1024×768 |
| `validation/contrast-summary.txt`, `contrast.json` | G. Contrast audit by text role (§6) |
| `chapters/`, `beats/` | Full-resolution PNGs: the 12 primary stills; all 32 beats + the fission series |
| `en/`, `portable/` | English spot checks; the portable single file's opening and closing |
| `validation/` | Performance, determinism, regression, projector, portable, build identity (machine-readable) |

## 2. Decisions applied (final for this stage)

| Decision | Applied as |
|---|---|
| Base direction B, editorial cinematic | Every chapter recomposed on one grid; claims without cards or rules; gradient scrims only where the scene is busy or light |
| Inter Variable, bundled | `src/presentation/fonts/InterVariable.woff2` (the Stage 1 104,260 B subset, OFL); registered with `FontFace` in `design.ts`; the scene's ready gate awaits it |
| C's anchored technical labels in ch. 7–10 | One role-1 label for the whole talk: a dot on the thing, a 1 px leader, short text beyond it. Process-coloured dots (water cool, steam white, heat copper, electricity warm white, status steel / amber); a backing panel only over light 3D |
| Semantic palette (DESIGN-STUDY §6) | `COLOR` tokens. Amber only for the current concept: the 24–36 band, Darlington (under construction), the control blades' dot, the chain-reaction dot, "Jūsų klausimai" |
| 24–36-month construction / unit visual | Kept: a second identical unit rises while a 0–36 timeline fills; the 24–36 band lights; the vendor qualifier sits under the number; a "serijinis blokas" label on the rising unit |
| No global motion pass | Beat timing, locks and transitions unchanged except where a composition needs it (§4) |

**Type scale** (px at 1080p · weight): display 80 · 600 (−0.03em); metric 108 · 500; h1 52 · 600; h2 32 · 500;
body 24 · 400; label 19 · 500; source 17 · 400; micro 16 · 600 (+0.12em). Floors on small stages: body
13, label / source / micro 12 px. No other sizes. Tabular figures only on count-ups and the day counter.

**Grid** (`design.ts GRID`): 4 % safe zone (77 / 43 px); left column at 120 px; right column 1238–1800 px;
chapter kicker 50 px from the top; headlines from 140 px; lower contact line 76 px from the bottom.

**Four label roles:** 1 anchored label (`label`, also the fission micro labels and the map tags);
2 claim (`caption`, `title`); 3 source / qualifier (`source` on the item it qualifies, or a `note` under the
chapter label when it qualifies the whole picture); 4 metric (`stat`: number + quiet h2 unit + one line + its source).

## 3. Chapter by chapter

| # | Chapter | Stage 2 composition |
|---|---|---|
| 1 | Opening | B's low hero camera (fov 30): the plant right of centre and ~50 % taller on screen; the title in the dark sky; names + e-mails divided by a hairline (no figures); the QR as a real size test (173 px); hero scrims top and bottom |
| 2 | Lithuania | The table moved right and lower: "50 %" on open sea with its caption and the Litgrid source directly under it; a left scrim; calm / assessment on the same column, the "importas" dot on the interconnector, the memorandum source under its claim |
| 3 | Scale | Both units whole and side by side (the BWRX-300 no longer cut by the edge); values as number-sized labels on the units; the modules beat leads with "Vienodi blokai – statomi vienas po kito", "5 × 300 MW" a secondary label on the row; the disclaimer under the chapter label |
| 4 | Facts | **300 MW** on one unit with its transformer and line lit, the metric in the right column above the line, "į tinklą" on the transformer. **≈ 2 pitches** unchanged scene, source under the claim. **24–36** the selected construction visual (§2) |
| 5 | Projects | Map tags as role-1 labels on quiet backings, dots carry the status (amber solid = under construction, white ring = licensing, steel = planned / assessed); the European tags spread by leaders; the sources under the legend; the CNSC note inside the Darlington label |
| 6 | Handoff | Unchanged (no text; lands on the approved hero view, then the Stage 3 descent) |
| 7 | Fission | Anchored micro labels; "neutronas" and "nauji neutronai" ride on their neutrons (the shader's own paths); "energija → šiluma" copper in the heat; "grandininė reakcija" amber on the second nucleus; "Schema, ne mastelis" under the chapter label. **Seam fix adopted** (§4). "Tai vyksta kure" anchored on the warm spot |
| 8 | Control | The blades dominant; their label anchored on a blade (amber dot); "Iliustracinis judesys" under the chapter label; insert / withdraw as h2 claims over a corner scrim |
| 9 | Atom → electricity | Machinery labels with process dots (cool water, white steam, warm-white generator); turbine / generator labels on the machines; **finale recomposed**: the plant upstream, the line, the lit city large in the foreground, "≈ 300 000 namų ūkių*" above the city with its qualifier under it |
| 10 | Passive safety | One eye path: reactor → riser → condenser in its pool → one right-hand column (claim, short line, "7 paros*", the GD Rev. J note under it); C labels on the east train: "garai kyla" (steam), "šiluma – į baseiną" (copper), "vanduo grįžta" (cool). Earlier states use the same column (scram over a right scrim) |
| 11 | Limitations | Redesigned: the plant calmly re-lit; three anchored ideas: **ATLIEKOS** on a small generic cask pad beside the reactor building (new, one instanced draw), **LICENCIJAVIMAS** with a layered-documents glyph on the reactor building, **PIRMŲJŲ PROJEKTŲ RIZIKA** with a schedule-with-uncertain-end glyph on the site; one calm line each, no numbers |
| 12 | Closing | The opening camera again; the thesis at display size in two balanced lines; "Jūsų klausimai" the only amber; the contacts; the QR at 270 px; holds indefinitely |

New copy (LT / EN): `facts.seriesUnit`, `limits.*Sub` (three calm lines), `hook.qrTodo` → "QR dydžio bandymas – nuoroda bus vėliau".
No new numeric claim. **Virgilijus Kiltinavičius's e-mail** is now `virgilijus.kiltinavicius@stud.vilniustech.lt`
(supplied by the owner during this stage; it replaces `VIRGILIJUS_EMAIL_TODO` and is a `mailto:` link).

## 4. Timing and motion changes (kept to what the compositions need)

| Change | Why |
|---|---|
| `facts/months`: the second unit rises over 0.9–4.9 s, the metric lands at 4.5 s (settle 3.2 → 5.1 s) | The selected 24–36 visual |
| `facts/power`: the line lights at 0.6–2.6 s; the large unit stays ghosted while it sinks | Composition (output path); audit defect E.5 |
| `projects/world`: the second unit lowers and the line goes dark before the plant shrinks | Cleans up the two additions above |
| `limits`: exterior dim 1 → 0.15, hall lights on, casks rise 1.2–2.8 s | Calm, honest light; the cask cue |
| Fission chain loops overlap by 1.6 τ (second particle / sprite pair, same programs) | The documented dark-seam blocker (Stage 1 prototype C, proven there); beats and timing unchanged |
| An item faded in on a cue and kept into the next beat no longer replays its entrance | Removes a blink on the press (scrims; the legend on Darlington, which predates Stage 2) |

Camera end poses changed (same key times): hook / close (B hero), `ltWide`, `scaleWide`, `factsPower`,
`factsMonths`, `grid`, `ics` / `days` (`icsLoop`), `limits`.

## 5. Font, package size, performance

**Font.** `loadTalkFont()` adds the face with `FontFace` (`display: block`) and loads it in parallel with
the shader precompile; the ready gate opens only after both (5 s timeout fallback to the system sans).
Normal build: one cached same-origin asset (`InterVariable-*.woff2`, 104,260 B). Portable build: embedded as
one `data:font/woff2` URI; `Inter Variable 100 900 loaded` at ready, from `file://`. Every overlay text in the
walk rendered in Inter (`CSS.getPlatformFontsForNode`: Inter 16pt–28pt instances only).

| Portable `BWRX300.html` | Bytes | Δ |
|---|---|---|
| `9a30489` (audit baseline) | 1,660,936 | — |
| `43ad04c` (Stage 1, study compiled out) | 1,664,230 | +3,294 |
| Stage 2 | 1,815,784 | +151,554 vs Stage 1 (the font as base64 + the overlay; the study code is gone) |

Normal build: main chunk 1,020.0 kB (Stage 1: 1,022.4 kB), talk chunk 96.6 kB (100.0 kB); the study chunk,
its stylesheet and the two study fonts (182 KB) are gone.

**Low, 1920×1080, the whole talk by real presses** (`validation/perf-low-1080p.json`):

| Chapter | avg fps | lowest beat | worst frame ms | > 34 ms |
|---|---|---|---|---|
| hook | 60.1 | 60.1 | 17.3 | 0 |
| lithuania, scale, facts, projects, handoff | 60.1 | 60.1 | ≤ 17.6 | 0 |
| fission, control, energy | 60.1 | 60.1 | ≤ 17.4 | 0 |
| safety | 59.8 | 58.9 (blackout) | 166.3 (one frame) | 1 |
| limits, close | 60.1 | 60.1 | ≤ 17.3 | 0 |
| **all** | **60.0** | | | |

The single 166 ms frame in `safety/blackout` did not reproduce (repeat: 60.1 fps, worst 17.3 ms,
`perf-low-safety-repeat.json`). The audit's 283 ms first-press stall did not occur in this run.

**High, targeted** (`perf-high-targeted.json`): opening 60.1, safety normal / blackout / days 60.1, ICS 56.1;
control 41–51 and scram / decay ≈ 43 fps. **Not caused by Stage 2:** the same beats with the overlay removed
(`display: none`) give the same fps within noise (blades 53.1 vs 49.7, insert 47.8 vs 42.9, scram 40.9 vs
41.6, decay 43.9 vs 46.3; `perf-high-ab-*.json`); Chrome held the GPU at 89 % mean, Firefox (the owner's,
untouched) up to 26 % (`gpu-high-ab.csv`). These are the fill-heavy bright interiors on the Iris Plus at High.

## 6. Validation

| Check | Result |
|---|---|
| `npm run check` | PASS (typecheck, lint, production build) |
| LT presentation route, real presses | 32 / 32 beats reachable in the walk, the Low run and the portable run |
| English switch | `en/`: opening, 24–36, 7 days, limits, closing: no overflow, all roles in Inter |
| External requests | 0 in every run (normal and portable) |
| Console / page errors | none; only the known `THREE.Clock` deprecation warning |
| Legacy 48 s film | 10 / 10 sampled frames (0.5–47.9 s) **pixel-identical** to `9a30489` |
| Determinism (two independent sessions, pinned clock) | 155 / 155 frames identical: fission (incl. loop overlap) 42, 24–36 build 30, limits 30, grid 33, 300 MW 20 |
| Regression vs `9a30489` (`regress-vs-9a30489.txt`) | camera changes only on the recomposed beats; world-channel changes only on facts (`g.*`, `k.*`) and limits (hall lights; `l.casks` is a new channel); `lithuania/assessment`, `handoff/*` WebGL-identical |
| Projector sizes (`projector-check.txt`) | 27 / 27 states (9 states × 3 sizes): 0 text outside the stage, 0 overlapping text boxes; smallest 16 px at 1080p (chapter labels), the 12 px floor at 1280×800 and 1024×768 (`projector/`, `stage2-projector-sheet.png`) |
| Contrast (`contrast-summary.txt`) | every audited text role passes WCAG AA at every size; lowest 5.54:1 (§6 table). The first pass found "Tai vyksta kure" at 4.42:1 over the bright fuel; it now has a backing panel |
| Portable single file (`portable-check.json`) | 1,815,784 B; Inter embedded once as a data URI and loaded at ready (3.8 s to ready from `file://`); 32 / 32 beats by real presses; 0 external requests; 0 errors; 0 study markers |
| Normal presentation contains study UI | no: `src/presentation/study/`, `?designStudy`, `?study`, both study fonts and the review panel removed; 0 study markers in the portable file |

**Contrast by role** (WCAG ratio of the text colour against the darker 60 % of the pixels under each
text box, halos, scrims and panels included; lowest per role; `contrast-summary.txt`):

| Role | 1920×1080 (all 36 walk stills) | 1280×800 (9 states) | 1024×768 (9 states) |
|---|---|---|---|
| Chapter label | 6.84 | 7.97 | 7.94 |
| Headline / metric / caption | 7.18 | 9.10 | 9.10 |
| Source / qualifier | 7.45 | 8.01 | 7.93 |
| Technical label (role 1) | 5.54 | 9.88 | 9.79 |
| Map tag | 9.69 | 9.67 | 9.55 |
| Opening / closing contacts | 9.67 | 9.65 | 9.64 |
| Map legend | 13.09 | 13.19 | 13.19 |

Stage 1 / audit comparison: the audit's lowest values were 2.17 (chapter label on Darlington), 2.55 (a note),
2.88 (scram label).

Perf, determinism and regression ran on `index-CrOi6Jbq.js`; the final build adds two overlay-only fixes
found by the audits (a backing panel on "Tai vyksta kure", a pixel floor on the note spacing at small
stages). Walkthrough, stills, projector, contrast and portable are from the final build.

## 7. Files changed (vs `43ad04c`)

- **Design system:** `presentation/design.ts` (roles, palette, grid, `loadTalkFont`), `ui/talk.css` (rewritten),
  `fonts/` (Inter moved from the study, README, OFL).
- **Overlay:** `ui/TalkOverlay.tsx` (roles, credits, QR, timeline, scrims, kept-item fix), `overlayLayer.ts`
  (one leader geometry for all labels, moving micro anchors), `types.ts` (item model), `qrCode.ts` (size test, new).
- **Script / copy:** `chapters.ts` (all chapters), `copy.ts`, `config.ts` (Virgilijus's e-mail), `world.ts` (`l.casks`).
- **Scene:** `scene/ChainFission.tsx` + `chainConfig.ts` (seam fix, label anchors), `scene/LimitsCues.tsx` +
  `limitsLayout.ts` (new), `scene/TalkScene.tsx`, `scene/Maps.tsx` (pin colours), `src/scene/SceneCanvas.tsx` (ready gate awaits the font).
- **Removed:** `presentation/study/` (all), `ui/PresenterFigure.tsx`; study hooks in `app/App.tsx`, `talk.ts`.
- **Docs:** `ARCHITECTURE.md`; a Stage 2 note at the top of `docs/presentation-design-study/DESIGN-STUDY.md`.

## 8. Known weaknesses, deferred work, the three weakest areas

**Known weaknesses (not fixed here):** text still enters at the press and old / new text cross in place
for ~0.3 s (audit E.2–E.3); the plant on a dark plinth mid-zoom on plant ↔ map moves (E.7); the
`close/return` fly-through (E.8); site-ground speckle; Clinch River's status coding (licensing ring while its
label says construction permit); the fission labels each show for ~1 s per loop; the handoff hold is still
fully static; High on bright interiors (§5).

**Deferred to Stage 3 (motion / transition / choreography):** text cued to the picture instead of the
press; the shared-object plant ↔ map transition; one change per press with holds in the safety chapter;
shorter long one-shots (descent 15.7 s, grid 10 s, return 10 s, blackout 7.3 s); camera paths through open
space only; the presenter-paced rhythm.

**Three weakest remaining visual areas (Stage 3 priorities):**
1. **Text timing and in-place crossfades, everywhere.** The compositions are now right when settled, but on
   every press the new claim arrives before its picture and overlaps the outgoing text; this is now the most
   visible thing that still reads as "slides".
2. **The plant ↔ map moves and the long one-shots.** Chapters 1→2, 2→3, 4→5, 5→6 still pass through the
   plinth-over-void moment, and the descent, the grid move and the return run 10–16 s with little change.
3. **The bright interior run (in-fuel → control → scram).** A large luminance jump from the dark exteriors,
   the only frames that need backing panels for small text, and the heaviest frames at High (41–53 fps):
   grading / lighting continuity there should be part of the motion pass.
