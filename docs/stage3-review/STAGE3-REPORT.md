# Stage 3 Review Report: First Production-Quality Shot

**Project:** BWRX-300 interactive WebGL module (PROJECT.md is the master spec)
**Stage:** 3 (one ~10 s cinematic benchmark shot). Stage 4 has not been started.
**Git:** Stage 1 = `280da5b`, Stage 2 = `4fe2e54` (committed before Stage 3 began, after
confirming the working tree matched the reviewed build byte for byte). Stage 3 changes are
**not committed yet**, pending final visual approval.

Stage 3 was functionally approved, then given a narrow visual polish pass. Its changes are
described in **[Stage 3 polish pass](#stage-3-polish-pass)** at the end. The sections below
describe the current state, including the polish.

## Deliverables (all 1920×1080, production build)

| File | Content |
|---|---|
| `01-shot-start-1080p.png` | t = 0.0 s: opening frame, exactly the approved `plantExterior` view |
| `02-approach-1080p.png` | t = 3.4 s: end of the approach; reactor building whole, turbine hall to its right |
| `03-below-grade-reveal-1080p.png` | t = 5.8 s: ground opened; the same cylinder runs from roof to basemat |
| `04-containment-reveal-1080p.png` | t = 7.6 s: building and shaft sectioned; containment is the subject |
| `05-rpv-hero-1080p.png` | t = 10.0 s: final settled composition, RPV is the subject |
| `06-low-rpv-hero-1080p.png` | t = 10.0 s, low preset: same story, timing and camera |
| `stage3-shot-1080p.mp4` | The whole shot: 301 frames, 30 fps, H.264, no audio, 10.03 s |
| `verification-report.json` | Raw measurements and regression checks (polish-pass run) |

Stills and video frames are captured by seeking the shot timeline to exact times, so they
match real-time playback exactly. Play it live with `?debug` and `P`. After the polish pass,
02–06, the video and the JSON were regenerated. 01 is pixel-identical to before.

## 1. What Stage 3 implemented

- **The shot:** plant exterior → approach → below-grade reveal → containment reveal → RPV
  hero, 10.0 s, deterministic, on the existing animation clock and camera director.
- **Reveal state** (`animation/heroReveal.ts`): five numbers from 0 to 1, animated only by
  GSAP. Everything visual is derived from them in one function (`applyReveal` in
  `scene/section/sectionLayers.ts`).
- **Section system** (`scene/section/`): clipping planes per reveal layer and a one-pass
  cut-surface shader. The Stage 2 section review (`G`) now runs on it as a static cut.
- **Camera path** (`camera/cameraPath.ts`): timed semantic poses, monotone cubic per
  channel in orbit space. The director's `cinematic` authority is implemented.
- **Dev controls:** `P` play/restart, `K` pause/resume, and buttons plus a time scrubber in
  the `?debug` panel. `R` (and the visible Reset button) now also closes the reveal.
  `window.__bwrx` (dev / `?debug` only, lazy chunk) is for automated capture.

## 2. Shot duration and timing beats

Total **10.0 s** (`config/heroShot.ts`).

| Time (s) | Camera keyframe | Reveal track |
|---|---|---|
| 0.0 | `stage3Exterior` (= `plantExterior`) | everything closed |
| 0.0–1.5 | hold, barely perceptible push to `stage3ExteriorPush` | none |
| 1.5–3.4 | dolly/orbit down to `stage3Approach` | none |
| 2.9–5.3 | | `exteriorDim` 0 → 1 (sine.inOut) |
| 3.3–5.8 | crane/tilt to `stage3BelowGrade` (5.8) | `groundCut` 0 → 1 (power3.out: fast over the empty foreground, decelerating onto the shaft) |
| 5.6–7.5 | descend to `stage3Containment` (7.6) | `shaftReveal` 0 → 1 (sine.inOut, plane on measured stations); visible opening ≈ 6.0–7.1; containment emphasis peaks as it completes |
| 7.3–8.95 | | `containmentReveal` 0 → 1 (sine.inOut, plane on measured stations); visible opening ≈ 7.7–8.6; containment emphasis fades |
| 8.0–9.6 | settle into `stage3RPVHero` (10.0, at rest) | `rpvEmphasis` 0 → 1 (sine.inOut) |

The grade datum is derived from the same state: full until the building cut is under way,
fading from ≈ 6.1 s to faint (30 %) by ≈ 7.0 s, and gone by ≈ 8.4 s.

The camera passes through every keyframe without stopping, starts and ends at rest, and
never rolls. Frame-to-frame image change across the video has no spikes (no snaps). The
per-second mean rises from 0.12 (opening hold) to a peak of 1.48 at 6–7 s (2.08 before the
polish pass, when the building cut was more abrupt) and settles to 0.20.

## 3. Reveal technique, and why

**Moving clipping planes with a designed cut surface**, one layer at a time:

1. **Ground:** an excavation box in front of the reactor building. Its back plane sweeps
   from the front of the site to the reactor axis. The earth sections away and the shaft's
   *exterior* emerges below the building, continuing to the basemat 36 m down. The shaft is
   not cut yet: the first surprise is "the same cylinder keeps going underground".
2. **Building + shaft:** one plane cuts the above-grade building and the shaft together.
   The walls read as continuous from roof to basemat, crossed by the grade datum. The
   containment stands inside as a closed volume.
3. **Containment:** its own plane opens it. The RPV is never cut.

All planes are parallel and end on z = 0, so the final state is one coherent section. The
two structural planes move along measured stations (`scene/section/cutPath.ts`), so that
equal reveal progress makes roughly equal visible change. The ground plane is linear.

Why this technique:
- **Robust on weak WebGL 2 GPUs.** Cut surfaces are drawn in the same pass: a back face
  seen through a cut is shaded as the cut surface at the exact ray–plane exit point. There
  is no stencil pass, no extra geometry and no post-processing.
- **No transparency at all,** so there are no sorting artifacts and no muddy alpha.
- **Fixed plane counts,** so no shader ever recompiles mid-shot. Verified: 13 programs
  before and 13 after a full play (high), 14 and 14 (low).
- **Correctness rules it relies on**, enforced in geometry:
  - Section solids never share or overlap faces. They are inset 5 mm, and the containment
    wall + slab and the pedestal + ledge are single revolved solids.
  - Context geometry never touches or enters grade (`ON_GRADE`).
- **Earth that doesn't read as a floating block.** The excavation is local: the ground
  continues around it, its floor is the basemat underside, and the earth cut shows soft
  strata and fades with depth and with distance from the reactor axis.

## 4. Camera implementation

- Poses are data in `config/camera.ts` (`stage3Exterior`, `stage3ExteriorPush`,
  `stage3Approach`, `stage3BelowGrade`, `stage3Containment`, `stage3RPVHero`). Timing is in
  `config/heroShot.ts`.
- `CameraPath` interpolates target xyz, log radius, polar angle, azimuth and fov as
  monotone cubics (PCHIP) in time. This gives no overshoot or wobble, continuous velocity
  through keyframes, and zero velocity at both ends.
- The director's `cinematic` authority evaluates the path from the timeline's time every
  frame. Restart and seek are therefore exact, and the camera can never desynchronise from
  the reveal.
- The camera stays above grade throughout. Its sight lines into the excavation cross grade
  inside it, and the final pose stands at the excavation's edge looking down at the RPV.
- On completion the camera lands exactly on `stage3RPVHero` and hands over to Explore.
  While the plant is opened up, pan limits allow a below-grade target, but the camera
  itself is held at y ≥ 0.5 m.

## 5. Lighting and material transitions

All of these are derived from the reveal state in `applyReveal`. There are no scattered
material tweens and no extra scene lights.

| Phase | Treatment |
|---|---|
| Start | Approved Stage 1/2 architectural lighting, untouched |
| Below grade | Site, turbine hall and support buildings dim to ~40 %. A soft below-grade fill lights the shaft exterior and earth cut, so underground stays dark but legible. Cut surfaces are flat-lit from the key-light direction |
| Containment | Building and shaft surfaces dim (subordinate). The containment gets a brief warm fresnel rim and slight lift, then dims as it is opened |
| RPV hero | The RPV gains slightly stronger light (×1.18), a thin warm rim, and a soft cool light pool on the containment wall behind it, so it separates like a product shot. It stays opaque steel, with no glow |

**Accent use (warm, information only):** a thin grade datum on section planes only (one
grade line, not an outline of the pit), which fades once the shaft is established and is
gone before the RPV hero; the brief containment rim; and the final RPV rim. No buildings are
recoloured.

## 6. Files changed

**New:**
- `src/animation/heroReveal.ts`, `src/animation/heroShot.ts`
- `src/camera/cameraPath.ts`
- `src/config/heroShot.ts`
- `src/debug/automation.ts`
- `src/scene/section/` (`sectionShader.ts`, `sectionLayers.ts`, `cutPath.ts`, `RevealDriver.tsx`)
- `docs/stage3-review/`

**Modified:**

| File(s) | Change |
|---|---|
| `plant/materials.ts` | Context + section material sets |
| `plant/geometry.ts`, `plant/section.tsx` | Whole inset solids, revolved solids, levelled interiors |
| `SiteGround.tsx`, `ReactorBuilding.tsx`, `ScaleCues.tsx` | Moved to section layers |
| `TurbineBuilding.tsx`, `SupportBuildings.tsx` | Bases lifted off grade |
| `dimensions.ts` | `[NEDO]` provenance |
| `cameraDirector.ts`, `CameraRig.tsx` | `cinematic` authority, below-grade limits |
| `config/camera.ts`, `config/quality.ts`, `config/render.ts` | Poses, `sectionCapDetail`, shared key-light position |
| `SceneCanvas.tsx` | Reveal driver, warm-up render of hidden content |
| `StudioEnvironment.tsx` | Contact-shadow plane clipped by the excavation |
| `LightingRig.tsx` | Shared key-light position |
| Keyboard shortcuts, `SetupControls`, diagnostics panel, styles | Shot controls |
| `README.md`, `references/links.txt` | Documentation, NEDO source link |

## 7. Animated performance

Production build, Chrome headless, **Intel Iris Plus Graphics (ANGLE D3D11)**, 1920×1080,
DPR 1. Real-time playback of the full shot, 3 runs per preset, every frame sampled.

| Preset | Avg fps | Avg frame | p95 | p99 | Worst | Frames > 20 ms | Draw calls | Triangles | Ready |
|---|---|---|---|---|---|---|---|---|---|
| High | 56.4 | 17.7 ms | 18.4–18.6 ms | 18.8–19.1 ms | 19.2–19.5 ms | 0 | 114–129 | 9,109–42,241 | 2.0 s |
| Low | 56.3–56.4 | 17.7 ms | 18.5–18.6 ms | 18.8–18.9 ms | 19.0–19.2 ms | 0 | 61–73 | 3,171–9,579 | 2.6 s |

- **56 fps is this session's display-pacing ceiling, not load.** The idle exterior view
  (no animation) paces at 56.7 fps. The Stage 2 commit, built and measured side by side in
  the same session, idles at 56.4–56.7 fps against Stage 3's 56.3–56.4. Stage 2's
  report measured 60.1 fps in a different session.
- **Stage 3 adds no measurable frame cost.** High and low run identical frame times.
- **Triangles** peak at 17 % of the 250k high-mode budget. Draw calls are at or below
  Stage 2's 130: whole solids replaced split halves.
- **One unexplained hitch:** a single 36.7 ms frame appeared once while idling on the
  final revealed pose in one 5 s sample. It did not recur during any playback run.

**Polish-pass re-run** (same machine and harness, a later session; `verification-report.json`):

| Preset | Avg fps | Avg frame | p95 | p99 | Worst | Frames > 20 ms | Draw calls | Triangles | Ready |
|---|---|---|---|---|---|---|---|---|---|
| High | 59.6–60.0 | 16.7 ms | 16.9 ms | 17.0–17.7 ms | 33.2–34.3 ms | 1–5 per run | 114–129 | 9,109–42,241 | 2.2 s |
| Low | 60.1 | 16.6 ms | 16.8 ms | 16.9–17.0 ms | 17.2–17.4 ms | 0 | 61–73 | 3,171–9,579 | 2.2 s |

- This session paced at 60 Hz, unlike the 56 fps session above. Draw calls, triangles and
  programs are unchanged, as expected: the polish changes only uniform values, plus one
  multiply in the cut-surface shader.
- **High shows occasional single missed vsyncs (~33 ms) in the final close-up seconds.**
  This is not caused by the polish. An alternating A/B in the same session (pre-polish build
  vs polish build, 9 plays each) gave 41 vs 40 slow frames in total, clustered at
  ≈ 8.5–10 s in both. In those frames high mode is near the 16.7 ms budget on the Iris Plus
  at 1080p. Low mode has none. Worth watching when Stage 4 adds vessel detail.

## 8. Validation

All re-checked after the polish pass on the production build.

| Check | Result |
|---|---|
| `npm run check` | typecheck, lint, production build: pass |
| External runtime requests | none (all chunks are local and modulepreloaded) |
| Repeated replay | final pose delta 0 across runs; final frames pixel-identical (high and low, 3 runs each) |
| Final pose | exactly `stage3RPVHero`, authority returns to `explore` |
| Explore after the shot | orbit works; dragging hard downward stops the camera at y = 0.500 |
| `R` after the shot | camera home; reveal back to 0. The camera climbs out first, and the ground refills only once it is above ~30 m |
| Quality switching | high → low → high after the shot works; pose preserved; switch ~0.3 s |
| Stage 2 section review (`G` / `V`) | works; now drawn by the section system (intentional) |
| Shader stalls | none: no programs compiled during playback (13/13 high, 14/14 low) |
| Low preset | same poses, timing and story frame for frame; datum fades identically |

## 9. Approximations and deviations

1. **Section review reimplemented.** The Stage 2 dev section view is now a static cut of the
   new section system instead of hidden geometry halves. The look is the same, with
   cut-surface shading.
2. **Pools hidden in the shot.** The cavity and ICS pools appear only in the section review,
   to keep attention below grade. They belong to the passive-cooling chapter.
3. **Main steam line hidden in the shot** (section review only), for the same reason.
4. **RPV is still the Stage 2 placeholder capsule.** Stage 4 replaces it with the vessel
   profile.
5. **NEDO-34163 differs from the General Description** on two figures the massing does not
   yet follow. Both are noted in `dimensions.ts`; the approved massing is unchanged:
   - containment OD ~18 m (massing uses 19 m from the GD);
   - RPV inside height ~26 m, ID ~4 m (massing uses 27.36 m).

   NEDO confirms the 36 m shaft depth, now cited as `[NEDO]`.
6. **Excavation is a designed educational device.** It is not a real construction feature.
   Its east wall stops 0.6 m short of the turbine hall so the hall is never undermined.
7. **Explore below grade.** In Explore with the plant opened, the camera is held above
   grade, which is a stricter limit than Stage 2's section review allowed.
8. **Tiny geometry offsets.** Structure bases rest 1 cm above grade, and touching section
   solids keep 1 cm gaps. Both are invisible at shot distances.

## 10. Console warnings and errors

- **Production:** only `THREE.Clock: This module has been deprecated` (from React Three
  Fiber, pre-existing, once per canvas). No errors, no failed or external requests.
- **Dev builds only:** a D3D compiler precision warning (`X4122`) from three.js's own
  `PMREMGGXConvolution` shader, the one-off environment-light prefilter. Confirmed
  pre-existing: the Stage 2 commit logs the identical warning in a fresh browser. It is
  not logged in production (shader diagnostics are off there).

## 11. What needs visual approval before Stage 4

Already approved: the excavation device, the camera language (above grade, ending at the
excavation edge), the cut-surface palette, hiding the pools and steam line, the dark
environment, the turbine hall as early context, no labels, no new post-processing.

For the final approval of the polish pass:

1. **Grade datum:** one line on the section plane, readable during the ground reveal
   (02, video 3.3–5.8 s), receding during the building cut, faint in 04, absent in 05/06.
   In 03 only the segment left of the shaft is unobscured; the pit's right edge reads from
   geometry alone.
2. **Cut pacing:** the building/shaft opening (video ≈ 6.0–7.1 s) and the containment
   opening (≈ 7.7–8.6 s). Each should read as a continuous opening, with no pause between them.
3. **RPV emphasis after the 8 % trim** (05/06): still the unmistakable subject, less of a
   luminous capsule.

## Stage 3 polish pass

A narrowly scoped visual pass after functional approval. The shot, architecture, camera
poses and path, reveal architecture, palette, quality behaviour and performance strategy are
unchanged. The duration stays 10.0 s.

**1. Grade datum simplified** (`sectionShader.ts`, `sectionLayers.ts`)
- The datum is drawn only on section planes (cut faces whose normal is along z). The
  excavation's side walls no longer carry it, so the pit is not outlined in orange. The
  ground's travelling cut face, the shaft cut and the earth beside it form one grade line.
  A faint side-wall echo (30 %, then 12 %) was tried first. Mixed in linear light, it still
  read as a second orange line against the shadowed wall, so it was removed. The pit edge
  reads from geometry.
- A new global uniform `uSectionDatum` fades it, derived in `applyReveal` from the existing
  state, with no new reveal field: `(1 − 0.7·smooth(shaftReveal, 0.15, 0.85)) ·
  (1 − smooth(containmentReveal, 0.1, 0.75))`. That gives full strength until ≈ 6.1 s, 30 %
  by ≈ 7.0 s, and 0 from ≈ 8.4 s. The final RPV frame has no orange line near the vessel.
- The Stage 2 section review keeps the datum at full strength.

**2. Structural cuts made readable** (`cutPath.ts` new, `sectionLayers.ts`, `config/heroShot.ts`)
- Cause: a linearly moving plane spent part of its track in empty space (in front of the
  canopy and the wall). It then opened each cylinder almost at once, because a cylinder's
  cut widens fastest just after the plane touches it, and the floors behind add the rest.
- Fix: the building and containment planes follow monotone-cubic stations (progress → z)
  measured from the hero camera, so equal progress gives roughly equal visible change.
  The ease now shapes the opening itself. The ground plane stays linear.
- Retimed by redistribution only, with no extra length: `shaftReveal` 5.7–7.4 power2.inOut
  → **5.6–7.5 sine.inOut**, and `containmentReveal` 7.45–8.9 power2.inOut → **7.3–8.95
  sine.inOut**. The two tracks overlap slightly, so the planes never stop between the cuts.
- Measured (camera held at two points of each cut, changed-pixel count per step):

  | Cut | 10–90 % of visible change, before → after | Middle 50 %, before → after | Peak change in one 30 fps frame, before → after |
  |---|---|---|---|
  | Building / shaft | 0.53 s → **1.10 s** (≈ 6.0–7.1 s) | 0.27 s → 0.67–0.70 s | 8.6–9.1 % → 3.3–3.5 % |
  | Containment | 0.70–0.73 s → **0.90–0.93 s** (≈ 7.7–8.6 s) | 0.40–0.43 s → 0.50–0.53 s | 6.3–8.5 % → 4.5 % |

  The remaining small peaks are the moments the plane breaks through an inner cylindrical
  wall (the containment's inner face, the pedestal), which is a physically sudden event.

**3. RPV micro-adjustment** (`sectionLayers.ts`). It still read as a luminous white capsule
after the datum change, so:
- vessel light lift ×1.28 → ×1.18 (−8 %);
- light pool behind it 1.25 → 1.15 (−8 %);
- warm rim (0.55) and fill unchanged; separation from the containment is kept.

**Deliverables regenerated:** 02 (its short side-wall datum segment is gone; otherwise the
same), 03, 04, 05, 06, the video and `verification-report.json`. 01 is unchanged.
