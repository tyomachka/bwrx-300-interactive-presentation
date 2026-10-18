# Presentation V1 / Stage 3: rhythm, scale, fission, section stability

**Status:** ready for owner / external review. Not final, not approved, **not committed** (Stage 3 is in the
working tree on `presentation-v1`). No narration written, no QR URL published, no presenter likenesses,
no final packaging.

- **Stage 2 checkpoint commit:** `fb00ce1` *presentation: apply editorial cinematic design system*
  (`fb00ce16ac9a140a5a752bf06360499cf9c11c73`; `npm run check` passed first; the 80 MB Stage 2 walkthrough
  follows the existing < 100 MB precedent; the two untracked briefs were left out).
- **Profile:** FULL (navigation, timing and the shared section rendering changed).
- **Captured:** 2026-10-18, production build `index-eKJbD0x3.js`, Chrome headless, ANGLE D3D11, Intel Iris Plus, Low, LT
  (EN checks), deterministic 1/30 s steps unless stated.

**Start here:** `stage3-navigation-before-after.png` → `stage3-chapters-contact-sheet.png` →
`stage3-scale-matched-1080p.png`, `stage3-footprint-stadium-1080p.png` → `stage3-fission-focus-1080p.mp4` →
`stage3-section-stability-1080p.mp4` + `stage3-section-before-after.png` → §12 the three weakest areas.

## 1. Package

| File | What |
|---|---|
| `presentation-stage3-full-walkthrough-1080p.mp4` | The whole talk at 1×: 19 real presses (1 to start + 18 to the questions), each stop played to its settle + 3.5 s (fission + 9 s of steady state; closing + 6 s). H.264 High, yuv420p, BT.709, CRF 20 |
| `stage3-transitions-focus-1080p.mp4` | 1×, one press each from the previous stop settled: map dive (2), scale (5), projects (9), handoff + descent (10), fission exit → control (12), grid (15), safety (16), closing (19) |
| `stage3-fission-focus-1080p.mp4` | 27 s of the fission stop (open → branching → steady state, held) + the next press (collapse into the fuel → control) |
| `stage3-section-stability-1080p.mp4` | Explore, Low: Section opens (animated) → orbit 24° → Plant → Reactor slider → Plant → Section closes (13 s) |
| `stage3-section-stability-stage2-1080p.mp4` | The same sequence on the Stage 2 build, for comparison |
| `stage3-navigation-before-after.png` | Stage 2's 32 presses against the 19 stops |
| `stage3-chapters-contact-sheet.png`, `stage3-stops-contact-sheet.png` | One settled still per chapter (12); all 19 stops |
| `stage3-scale-matched-1080p.png`, `stage3-footprint-stadium-1080p.png` | Full-resolution stills of the revised scale and footprint compositions |
| `stage3-fission-progression-sheet.png` | Generations 0 → 1 → 2 → widening → steady (20, 30, 45 s) |
| `stage3-transition-filmstrips.png` | Six frames per major transition |
| `stage3-projector-sheet.png`, `projector/` | Changed compositions at 1920×1080, 1280×800, 1024×768 |
| `stage3-section-before-after.png` | Far orbit, excavation crop, Stage 2 vs Stage 3, frames 0, 1, 2, 30, 60 |
| `stage3-luminance-*.png` | Mean luminance through fission → control → energy, grid → safety |
| `stops/`, `fission/`, `en/` | Full-resolution PNGs |
| `validation/` | Machine-readable: stops / presses, navigation, text audit, camera walls, luminance, section stability, Low perf, High targeted, determinism, legacy regression, console / network, build id (all UTF-8 JSON / text) |

## 2. Presenter stops: 32 beats → 19 stops (18 presses to the questions)

Model: **press → short automatic choreography → hold (processes keep running) → next press.** A stop is a beat
the presenter enters plus the beats that follow it by themselves (`after` seconds into the stop); their text,
world, reveal, look and camera continue without snapping (per-channel transition tracks).

| Stop | Chapter | One press plays | Choreography (s) | Lock (s) |
|---|---|---|---|---|
| 1 | hook | fade in, rise into the low hero view; presenters, title, QR | 6.9 | 1.5 |
| 2 | lithuania | plant shrinks into a point on filled ground, Lithuania opens; wind, sun, flows; "50 %" counts | 5.8 | 2.2 |
| 3 | lithuania | calm night: turbines slow, imports grow, a controllable node lights | 3.6 | 1.8 |
| 4 | lithuania | Lithuania warms: assessing the BWRX-300 (memorandum) | 2.6 | 1.2 |
| 5 | scale | dive back; ESBWR-class plant rises at one scale; ≈ 1 500 / ≈ 300 MW; vessel diagram → (12.5 s) large unit steps back, four more units built: 5 × 300 MW | 20.2 | 3 |
| 6 | facts | one unit, line lit; "~300 MW" | 4.0 | 2 |
| 7 | facts | top-down: ~148 × 78 m outline, 105 × 68 m pitch; "≈ 1,6" | 5.1 | 2 |
| 8 | facts | second unit rises with the 0-36 timeline; "24-36 mėn.*" | 5.1 | 1.6 |
| 9 | projects | North Atlantic, pins by status → (8.4 s) glide to Darlington, its licence date | 11.8 | 2.4 |
| 10 | handoff | into the pin, plant grows on filled ground → (3.6 s) the approved descent at 1.45× to the core | 13.2 | 3 |
| 11 | fission | micro view opens; 1 → 2 → 3 fissions; widens into a steady chain; holds indefinitely | 12.0 | 2 |
| 12 | control | micro view collapses into the fuel → (2.8 s) out to the blades → (5 s) insert → (3.6 s) withdraw; both statements hold | 13.4 | 1.6 |
| 13 | energy | boiling, chimney, downcomer → (5.2 s) separators, dryer, dry steam out | 10.2 | 2.4 |
| 14 | energy | main steam line, turbine turns → (6.6 s) condenser, feedwater back | 14.2 | 3 |
| 15 | energy | generator → transformer → line → city lights; "≈ 300 000 namų ūkių*" | 8.2 | 3 |
| 16 | safety | running plant → (5.4 s) power lost → (3.2 s) scram → (5.2 s) decay heat ≠ 0 | 16.8 | 2.6 |
| 17 | safety | passive loop: steam up, heat to the pool, water back → (6.4 s) 0 h → 7 paros* | 12.3 | 3.6 |
| 18 | limits | wide, calm light; waste / licensing / first-of-a-kind risk | 5.2 | 2 |
| 19 | close | plant closes as the camera returns through open space → (5 s) thesis, "Jūsų klausimai", contacts, QR; holds | 7.6 | 3 |

Kept separate (distinct ideas): opening; Lithuania 50 % / calm / assessment; the three facts; grid → homes;
limitations. Merged: scale large + modules; world + Darlington; land + descent (no static exterior stop);
fission micro + in-fuel (the micro view stays open on a steady chain; the next press collapses it into the
fuel and continues to control); control blades + insert + withdraw (one illustrative cycle, then both
statements hold); boil + steam; turbine + condenser; normal + blackout + scram + decay; ICS + 7 days;
return + Q&A (**one press from the limitations to the questions**, no intermediate exterior stop).

**Navigation.** → / Space / PageDown: the next stop. ← / PageUp: the previous stop, settled at its final state
(never inside a choreography). Home: the opening, played; the press counter resets. R: stop and reset: dip, the
current stop re-established at its final state, nothing runs on. **Space during a choreography:** ignored for
the stop's lock (1.2–3.6 s, so a double press never skips an idea); after the lock it goes straight to the
next stop, which takes over from whatever is on screen (nothing snaps; the rest of the old choreography is
not played). Debug panel (`?debug`, T): stop k / 19, press counter, the beats of the current stop.

## 3. Scale (chapter 3): matched scale, sourced vessels

| Decision | Source |
|---|---|
| Comparator: **ESBWR** (same BWR family, the BWRX-300's licensed predecessor) | GD Rev J §1, Table 2-1 |
| "≈ 1 500 MW" (net) vs "≈ 300 MW" (net): 5.1× | NRC ESBWR page: 1,594 MWe gross, ~1,535 MWe net; GD Rev J Table 21-2 ~300 MWe net |
| Vessels, inside: ESBWR **⌀ 7.1 × 27.6 m**, 1,132 bundles; BWRX-300 **⌀ 4.2 × 27.4 m** (27.36), 240 bundles | GD Rev J Table 2-1 pp. 28-29; §3.1.2 p. 30 |
| Core bands in the diagram: equivalent circle of the bundles on the same 15.24 cm lattice: 5.78 m vs 2.66 m (DERIVED); band height schematic | `rpvData.ts` lattice |
| One ground scale, one camera; the large plant is **not** scaled 5× in every direction: a square reactor building about as tall as ours (38 + 6 m vs 30 + 4 m) but much wider (56 × 56 m vs ⌀ 37 m), a longer, taller turbine hall, control and radwaste buildings; no dome, no stack | `comparisonLayout.ts`; on screen "Mastelis suderintas; pastatų išdėstymas iliustracinis" |

The vessel diagram (overlay, one scale, 10 m bar) carries the teaching point: *aukštis panašus, skiriasi
plotis, kuro kiekis ir galia*. No public drawing gives the ESBWR building sides, so the exterior stays a
labelled massing (TECHNICAL_FACTS SCL-01..04). Then, automatically at 12.5 s, the large unit steps back and
four more BWRX-300 units are built one after another (5 × 300 MW).

## 4. Footprint (chapter 4): 148 × 78 m against a 105 × 68 m pitch

- **Rev J does not state the sides**: Table 21-2 gives "Plant Powerblock Footprint 9,800 m² (rectangular building
  envelope)". The **older official GD Rev F (Dec 2023, p. 63)** says "The footprint of the power block is
  approximately 148 m x 78 m" (the copy filed with the CNSC); it is used and source-tagged as Rev F.
- **Pitch: 105 × 68 m = 7,140 m²** — UEFA Stadium Infrastructure Regulations art. 5.01 (in force 1 June 2025)
  require exactly this field for categories 3 and 4. The National Stadium being built in Šeškinė is a UEFA
  category IV project (LRT, 2025-09-03). No current project drawing with the pitch size was found, so the
  screen shows an *international-size* pitch and names the stadium only as built to that category.
- 11,544 / 7,140 = **1.62 → "≈ 1,6 futbolo aikštės ploto"**. The 148 × 78 rectangle does not nest in two
  105 × 68 rectangles (78 > 68), so the screen says *area*, never "fits in".
- Near top-down camera, one ground scale: the dashed ~148 × 78 m outline around our modelled block (151 × 71 m)
  and a schematic stadium (pitch lines, quiet stands band). Replaces the "≈ 2 pitches" visual.

## 5. Section / ground flicker: root cause and fix

**Root cause.** The site earth is two closed solids 1 cm apart: above the shaft bottom (bottom at y = −35.995)
and below it (top at −36.005). Seen through any cut, the upper solid's bottom is a back face that the section
shader shades as the cut surface *at its own depth* (`sectionShader.ts` FRAGMENT_CAP), and the lower solid's
top is a lit front face 1 cm below it. With near = 0.5 m and a 24-bit depth buffer that is below the depth
resolution beyond ~200 m (≈ 5 mm at 200 m, 1 cm at 300 m, 2.4 cm at 450 m): the two z-fought, in streaks and
speckle that crawl whenever the cut, the slider or the camera moves. The basemat's bottom (also 1 cm above
that face) did the same through the shaft cut. `SECTION_INSET` was sized for the 48 s film's distances; the
talk and Explore look from 2–5× farther. Diagnosis: hiding the lower solid removed the streaks; nothing else did.

**Fix (depth state, no geometry change):** the lower earth has its own material with a constant polygon offset
(factor 1, units 4), so it always yields to the surfaces 1 cm above it (`materials.ts earthBelowShaft`). No
dithering, no new pass, X-ray unchanged. A first attempt (an excavation floor clipped to the open box) was
rejected: it exposed the 1 cm gap as dots along the floor/wall corner and changed 4 legacy frames.

**Results** (`validation/section-stability.json` / `.txt`; Explore, stepped 1/30 s; poses from the low hero view to
a far wide orbit; Section plant 0.5 / 1; Low and High at 1920×1080, Low at 1024×768):

| Test | Stage 2 (`fb00ce1`) | Stage 3 |
|---|---|---|
| Static: 60 consecutive frames per config (8 configs × 3 runs) | 1 distinct frame each, except one config that changes once (a one-time settle) | 1 distinct frame each (the same one-time settle at High, then 57 identical frames; never alternating) |
| Static Stage 2 vs Stage 3, same frame | — | pixels differ **only in the excavation** where the streaks were (far: ~1.7–1.9k px; high: ~0.5k px); wide and exterior views identical |
| Far orbit (0.12° / frame, 90 frames), same frame, Low 1080p | z-fight speckle in 80 / 90 frames, mean 2,555 px, max 15,091, crawling 3,511 px / frame | removed |
| Far orbit, High 1080p / Low 1024×768 | 50 / 90 frames (mean 552 px) / 75 / 90 frames (mean 732 px) | removed |
| Against a high-precision reference (a temporary log-depth build, never shipped): frame-to-frame crawl of the difference, far orbit | 3,642 px / frame | **45 px / frame** (views that never z-fought: 72–78) |

The diagnostic clip (`stage3-section-stability-1080p.mp4`, with the Stage 2 version beside it) runs Section open
→ orbit → Plant → Reactor → Plant → close: no checker, no shimmer, no grade-plane popping, no new seam. One
residual, unchanged from Stage 2: a thin floor edge inside the shaft aliases as a dashed line at far
distances (static, identical in every frame; edge aliasing at Low, not depth). The legacy film is unchanged (§9).

## 6. Fission: branching, then a controlled steady state

`presentation/scene/FissionField.tsx`, `fieldConfig.ts`, `fieldShaders.ts` (the Stage 10 nuclei, look, iris and
backdrop; Stage 10's own files are back to their approved state, the presentation-only chain variant is gone).

- **Generation 0:** a neutron crosses (label *neutronas*), is absorbed by U-235 (*U-235*), the nucleus wobbles,
  turns dumbbell-shaped and splits; fragments fly apart and leave heat along their paths (*energija → šiluma*);
  three neutrons: two go on, one slows and fades (*sugertas*).
- **Generation 1 → 2:** two fissions, then three at once, spread out (*grandininė reakcija*, amber).
- **Steady state** (from ~8 s): the view widens into the fuel (22 nuclei); three chains, each fission sending
  exactly one neutron on (the others absorbed), so the number of fissions stays constant; the fuel's warmth
  gathers to a bounded plateau; *Valdoma grandininė reakcija — kiekvienas dalijimasis vidutiniškai sukelia
  vieną naują* (k = 1 in words). It runs indefinitely: 15 sites on three closed rings, every position analytic
  in the chain time (no restart, no blank frame, no seam, at most ~4 concurrent splits). Fragments dissolve and
  fresh nuclei appear by size, not transparency.
- **Next press:** the micro view collapses into the fuel spot as warmth (*Tai vyksta kure*), the camera pulls
  out to the control blades (stop 12).
- Not implied: every neutron splitting a nucleus, glow as the energy mechanism, exact nucleon counts
  (*Schema, ne mastelis*; TECHNICAL_FACTS FIS-01..07).

## 7. Text follows the picture; plant ↔ map; long moves

- **Rule in code** (`resolve.ts`): any text new in a beat fades in at the beat's `textAt` (default 0.6 s, after
  the outgoing text's 0.35 s fade) or its own cue; text that stays never re-enters; `out` cues fade text away
  inside a stop. Every stop's cues re-timed so its text lands once the subject reads (e.g. 300 MW at 2.4 s,
  calm 1.4 s, normal 2.8 s, scram 3.0 s). Audit of the whole talk sampled 15×/s (`validation/text-settled.json`, `text-fast.json`, the latter pressing as soon as each lock ends): **0 moments** where two different texts overlap on screen; every new text appears ≥ 0.6 s after its beat starts, after the outgoing text has gone.
- **Plant ↔ map (the plinth).** Cause: the studio floor has a hole where the site's 48 m earth block is; as the
  plant shrank into a map point the hole showed the void and the block floated in it, with its full-size
  contact shadow left behind. Fix (talk only): the hole is filled with the floor's own surface while the
  plant is scaled, the earth block is hidden, the contact shadow scales with the plant (`TalkScene.tsx`).
- **Long moves:** handoff map → core 20.0 s → 13.2 s (the descent from its push-in at 1.45×, no static exterior);
  grid 9.0 → 6.8 s; closing return 10 s → 5.6 s through open space (no fly-through), thesis at 5.3 s.
- **Walls:** 2,821 camera samples through all 19 stops: 0 inside a closed (uncut, un-X-rayed) building or uncut
  earth (`validation/camera-walls.json`).
- **Bright interiors:** the micro view now opens / closes linearly over 2.2 / 2.0 s while the core recedes
  (context dim), and the control and scram views make the blades the look's subject with the fuel a step back:
  the largest luminance step per 0.2 s fell from 35.7 to 13.6 (fission ↔ core) and the scram peak from 81 to
  75 (0–255, `validation/luminance-*.json`). No post-processing.

## 8. Performance (Low is the delivery reference)

Real time (no stepping), real presses, each stop from the press to its settle + 1.5 s, 1920×1080, Chrome
headless, ANGLE D3D11 on the Intel Iris Plus (`validation/perf-low-1080p.json`, `perf-high-targeted.json`).

**Low, the whole talk (19 presses):** **60.1 fps overall**; every stop 59.9–60.1 fps, p95 16.8–16.9 ms, worst frame
33.4 ms (one each in the Lithuania map moves), **0 frames > 34 ms**. The heaviest stops by content: fission 211 k
triangles / 60 draw calls, grid 117 calls / 113 k triangles, both 60.1 fps.

| High, targeted | fps | p95 ms | worst ms | > 34 ms |
|---|---|---|---|---|
| 2 Lithuania (map move, filled ground) | 60.1 | 16.8 | 17.6 | 0 |
| 5 Scale (large unit, vessels, modules) | 60.1 | 16.8 | 17.3 | 0 |
| 7 Footprint | 60.1 | 16.8 | 17.1 | 0 |
| 10 Handoff (map → core) | 58.8 | 16.9 | 33.6 | 0 |
| 11 Fission (field) | 45.5 | 33.4 | 33.8 | 0 |
| 12 Control (collapse, blades) | 45.0 | 33.5 | 34.0 | 0 |
| 16 Safety (normal → decay) | 51.2 | 33.3 | 83.2 | 8 |
| 19 Closing | 60.1 | 17.1 | 17.4 | 0 |

High is limited on the bright core interiors, as in Stage 2 (control 41–51, scram ≈ 43 there): the fission
stop draws the core under the micro view, and halving the field's triangles (detail-1 spheres at High) moved
it only from 45.5 to 47.5 fps, so the field is not the cost; the change was not kept. The safety stop's eight
slow frames at High (worst 83 ms) did not occur at Low. Low stays the delivery reference (§9 of the brief).

## 9. Determinism, regression, legacy film

**Legacy 48 s film (frozen):** the Stage 2 build and the Stage 3 build rendered under the same conditions are
**10 / 10 pixel-identical at Low and 10 / 10 at High** (0.5–47.9 s; `legacy-film-paired-*.txt`). Against the frames
stored this morning, one frame (5.8 s) now differs in 2 pixels by 1 level in blue; the **unmodified Stage 2 build
reproduces exactly that difference** (`legacy-film-stage2-build-vs-stored.txt`), as do the checkpoint with only the
depth fix and three Stage 3 builds each without one suspect: GPU / driver drift since the stored capture, not Stage 3. The section fix itself
was checked frame by frame before any other change (10 / 10 identical).

**Determinism** (`validation/determinism.txt`; independent sessions, clock pinned, 1/30 s steps; changed windows:
stops 5, 7, 9, 10, 11, 12, 16, 19):

| Check | Result |
|---|---|
| Real presses, Low, full frame (WebGL + overlay) | 634 / 642 identical; the misses only in stop 19, moving between reruns: 1-level differences inside HTML text while it fades (DOM compositing) |
| Real presses, Low, WebGL only (overlay hidden), stops 19 + 12 | 155 / 155 |
| Real presses, High, full frame, stops 5, 11, 16 | 174 / 174 |
| Seeks (jumpStop) in random vs given order, clock pinned per seek, WebGL only | 450 / 455: stops 5, 12, 16 identical; stop 11 differs in its first sample (0.2 s), stop 19 in 0.1–0.3 s and one sample at 2.0 s (a short history effect after a debug seek; presses never reach it) |

Without pinning, seeks taken at different clock times differ by design: flow particles, line pulses, glints and
the turbine shaft run on the animation clock and never restart on a press.

## 10. Validation

| Check | Result |
|---|---|
| `npm run check` | PASS (typecheck, lint, production build `index-eKJbD0x3.js`), final tree |
| Stops / presses | 19 stops, 32 beats; **18 presses from the opening to the questions** (+1 to start from Explore); Limitations → Q&A **1 press** |
| Navigation (`navigation.json`) | **75 / 75 checks**: forward by real presses (each stop plays its continuations by itself, in order), a press at the end does nothing, a second press inside a lock is ignored, a press after the lock goes to the next stop, back from 19 to 1 (each lands on the previous stop's final beat, settled), 12 random-order seeks (play / settle), R settles the current stop and nothing runs on, Home plays the opening and resets the counter |
| Full LT walkthrough | 19 real presses, 7,612 frames (253.7 s), 0 errors, 82 CSS animations driven by the stepped clock; every overlay text in Inter |
| Text (`text-settled.json`, `text-fast.json`) | 0 moments with two texts overlapping on screen, with settled and with immediate presses |
| EN (`en/`) | opening, scale (+ vessels), footprint, 24–36, fission steady, control, safety, ICS, closing: no overflow, no overlap |
| Projector (`projector/`, sheet) | 10 changed stops + the scale moment at 1920×1080, 1280×800, 1024×768: 0 texts outside the stage, 0 overlapping texts (one 5 px touch at 1024×768 in the scale stop was found and fixed) |
| Camera walls (`camera-walls.json`) | 2,821 samples, 0 inside a closed building or uncut earth |
| Luminance (`luminance-*.json`) | largest step per 0.2 s 35.7 → 13.6 (fission ↔ core), scram peak 81 → 75 |
| Section stability (`section-stability.*`, `sec-orbit-*`) | §5: speckle removed (far orbit 2,555 px / frame mean → 0 vs Stage 2), static frames identical, crawl vs a high-precision reference 3,642 → 45 px / frame |
| Legacy 48 s film | 10 / 10 identical (Low and High, paired) |
| External requests (`console-network-errors.json`) | 0 in 60 runs |
| Console / page errors | 0 page errors; only the known `THREE.Clock` deprecation warning |
| Portable single file | not rebuilt in this stage (final packaging is out of scope) |

**Validation evidence output (§11 of the brief):** every comparison tool now writes UTF-8 JSON and a UTF-8 text
summary (`tools/pixdiff.py`, `secmetric.py`, `orbitdiff.py`, `lum.py`, `walls.py`); none prints through the
console code page, so a traceback can no longer stand in for a result. The Stage 2 attachment
`regress-vs-9a30489.txt` was left as it is (not redone).

## 11. Files changed (vs `fb00ce1`)

- **Navigation / runtime:** `presentation/talk.ts` (stops, continuations, presses, jumpStop), `runtime.ts`
  (transition tracks, exact continuation entry, cues across a stop), `resolve.ts` (stops, text cues), `types.ts`,
  `config.ts` (`textAt`, `textIn`), `ui/TalkDebug.tsx`, `debug/automation.ts` (`stops`, `jumpStop`).
- **Script / copy / sources:** `chapters.ts` (19 stops), `copy.ts` (LT / EN), `sources.ts` (`footprint`, `pitch`,
  `esbwr`, `vessels`, `largeUnit`).
- **Scene:** `scene/FissionField.tsx`, `fieldConfig.ts`, `fieldShaders.ts` (new; `ChainFission.tsx`,
  `chainConfig.ts` removed), `Comparison.tsx` + `comparisonLayout.ts`, `Footprint.tsx` + `footprintLayout.ts`
  (new; `Pitches.tsx` removed), `TalkScene.tsx` (ground filler, earth / shadow while scaled), `world.ts`.
- **Overlay:** `ui/TalkOverlay.tsx` (vessel diagram, `out` cues, field labels), `overlayLayer.ts`, `ui/talk.css`.
- **Shared scene (minimal):** `scene/plant/materials.ts` + `SiteGround.tsx` (the depth fix),
  `scene/StudioEnvironment.tsx` (a name on the contact shadow), `scene/fission/fissionData.ts` +
  `fissionShaders.ts` (restored to the approved Stage 10 state).
- **Docs:** `ARCHITECTURE.md`, `references/TECHNICAL_FACTS.md` (SCL-01..08).

## 12. Known weaknesses, open questions, the three weakest areas

**Known weaknesses (not fixed here):**
- The automatic continuations run on fixed timings (e.g. the modules at 12.5 s into the scale stop, the safety
  chain over 17 s). A presenter who talks slower than the picture will see it move on before they finish; the
  stops are long where several ideas were merged (scale 20 s, safety 17 s, ICS 12 s). Narration timing
  (not this stage) should confirm or adjust them.
- A press during a choreography (after the lock) skips the rest of it by design; there is no "finish this stop
  first" mode.
- The large plant is a plain massing next to the detailed BWRX-300 model (sourced: vessels and output; not:
  the ESBWR building sides). The label says so, but it looks schematic.
- The fission field repeats its three rings every 7.25–8.75 s; in a very long hold an attentive viewer may see
  the pattern. Fragments dissolve (shrink) rather than stay in the fuel as fission products.
- Debug seeks (not presses) carry a 0.1–0.3 s history effect in two stops (§9); the DOM overlay can differ by
  one colour level between sessions while text fades (WebGL frames identical).
- A thin floor edge inside the shaft aliases as a dashed line at far Explore distances (static, unchanged).
- Carried over from Stage 2: Clinch River's status ring vs its "construction permit" label; High on the bright
  interiors (§8).

**Open questions for the owner:**
1. Scale comparator: is the ESBWR (≈ 1 500 MW net, 1,594 MWe gross) the right "large reactor", and is a
   matched-scale massing with "pastatų išdėstymas iliustracinis" acceptable, or should the large plant be
   reduced to the vessel comparison alone?
2. Footprint source: keep GD Rev F's 148 × 78 m (older official revision, area 1.6 pitches) or switch to
   Rev J's 9,800 m² building envelope (1.37 pitches, no sides, so no outline)?
3. The National Stadium is named only in the source line (category IV → 105 × 68 m). Name it on screen?
4. Control and safety now play as one press each. Keep, or split control back into two stops?

**The three weakest remaining areas (next-stage priorities):**
1. **Pacing of the merged stops against real speech.** The structure is right (19 ideas, 18 presses); the
   fixed continuation timings have not been tried with the presenters' words.
2. **The large-plant exterior.** The comparison is now honest and to scale, but the large plant is the least
   crafted object in the talk.
3. **Fission field polish.** It branches and holds steady as required; the steady state could read more
   clearly as "one neutron on per fission" (a subtler highlight of the successful neutron) and the repeating
   ring pattern could be disguised.
