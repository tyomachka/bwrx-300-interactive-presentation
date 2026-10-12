# Stage 4 Review Report: Reactor Pressure Vessel and Internals

**Project:** BWRX-300 interactive WebGL module (PROJECT.md is the master spec)
**Stage:** 4. Stage 5 has not been started.
**Git:** Stage 1 `280da5b`, Stage 2 `4fe2e54`, **Stage 3 `d8536a0`** (committed before Stage 4
began, after confirming the tree matched the approved polished state and `npm run check`
passed). Stage 4 changes are **not committed**, pending this review.

## Deliverables (`docs/stage4-review/`, all 1920×1080, production build)

| File | Content |
|---|---|
| `01-rpv-exterior-1080p.png` | The new closed vessel, drives included, standing in the pedestal |
| `02-rpv-cutaway-1080p.png` | The same vessel opened: drives → lower plenum → core → chimney → separators → dryer → head |
| `03-core-closeup-1080p.png` | Fuel, blades, top guide, shroud, downcomer gap and vessel wall in section |
| `04-control-blades-closeup-1080p.png` | Step section at mid-core: fuel squares and cruciform blades in plan, half-inserted blades rising behind |
| `05-chimney-separators-dryer-1080p.png` | Chimney top, chimney head, separators, dryer, steam and feedwater nozzles |
| `06-low-rpv-cutaway-1080p.png` | Cutaway in the low preset |
| `07-stage3-final-with-new-rpv-1080p.png` | The approved Stage 3 final frame (t = 10 s), now with the real vessel |
| `08-stage3-final-placeholder-vs-new.png` | Side by side: approved placeholder (left) vs the new vessel (right) |
| `stage4-rpv-review-1080p.mp4` | 12.0 s model-review video, 30 fps, H.264, no audio: closed → opening → full cutaway → steam region → core |
| `verification-report.json` | Raw measurements and the Stage 3 regression run |

Review live with `?debug`: key `B` (or the debug panel row) cycles the five review states.

## 1. Stage 3 commit

`d8536a00539b1866f6dd3b52756801ba11d162c0` ("Stage 3: hero reveal shot (approved)").

## 2. Official sources used

- **Primary:** GE Vernova Hitachi, *BWRX-300 General Description*, 005N9751 **Revision J,
  June 2026** (the only GD revision held locally, and the newest official document in the
  project): §3.1.1 RPV, §3.1.1.1 internals, §3.1.2, §3.2, §4, Table 2-1, Figures 3-1, 3-2,
  3-3, 3-6, 4-1, 4-2, 5-1.
- **Secondary (older):** NEDO-34163 Rev B, UK GDA Chapter 1 (July/Aug 2025). Where it differs
  from GD Rev J the GD is used and the difference recorded, not averaged:

| Value | GD Rev J (used) | NEDO-34163 Rev B |
|---|---|---|
| RPV inside diameter | min. ≈ 4.2 m (Table 2-1: 4 m) | ≈ 4 m |
| Wall incl. cladding | ≈ 13.54 cm | ≈ 14 cm |
| Inside height | ≈ 27.36 m (Table 2-1: 27 m) | ≈ 26 m |
| Bottom of active fuel above vessel bottom | ≈ 5.12 m | ≈ 5.2 m |
| Active core height | 3.8 m | 3.8 m |

- **Correction made:** Stage 2/3 notes in `dimensions.ts` called NEDO "the more recent official
  source". GD Rev J (June 2026) is newer; the header now says so. This changes nothing visible:
  the containment already used the GD's 19 m (NEDO's 18 m stays recorded, not applied).

## 3. What geometry was implemented

- **Vessel** (`scene/rpv/`): hemispherical bottom head; cylindrical shell with a heavy vessel
  flange; removable hemispherical top head on its own flange with 64 studs and nuts; two main
  steam nozzles just below the flange at the dryer (hub, pipe, flange, bore); two feedwater
  nozzles; four shell lugs; four dryer support brackets inside; 57 FMCRD housings below the
  bottom head with their motor units. All smooth-shaded solids of revolution (new
  `createLatheSolid` with smooth arc normals, so heads are not faceted).
- **Core:** 240 fuel assemblies (channel, lower tie-plate nose, handle); 57 cruciform blades
  (wings, bail handle, velocity limiter); core plate; orificed fuel supports on 57 guide tubes
  (bottom head to core plate); top guide (square grid, one opening per four-bundle cell, rim and
  flange ring).
- **Flow partition:** shroud around the core; shroud support ring on 12 legs welded to the
  bottom head (open between the legs, so the downcomer reaches the lower plenum); chimney (the
  long dark barrel); the downcomer is the open annulus between shroud/chimney and the vessel wall.
- **Steam region:** chimney head (lid with skirt); 44 standpipes with AS-2B-style separator
  bodies; steam dryer with skirt down around the separators, support ring, and six stepped
  chevron (corrugated) vane banks with cover plates; steam outlets at the dryer level.
- **Stage 3:** the capsule is gone; the shot plays with the closed vessel (internals not drawn).

## 4. Official vs approximate

| Item | Status |
|---|---|
| ID, wall, inner height, BAF height, active core height | **Official** (GD §3.1.1) |
| 240 bundles, 57 blades, cruciform B4C/Hf, FMCRD, AS-2B separators, chevron dryer, natural circulation | **Official** (GD Table 2-1, §4) |
| Core layout: 57 four-bundle cells + 12 peripheral bundles | **Official** (GD Fig 3-6, §4.2 text) |
| GNF2 10×10, 78 + 14 rods, 2 water rods, N-lattice equal gaps | **Official** (GD §4, Fig 4-1); rods not modelled |
| Component order: shroud support → core plate → shroud → top guide → chimney → chimney head/separators → dryer on four brackets | **Official** (GD §3.1.1.1) |
| Two main steam lines, nozzles roughly opposite, below the flange | **Official** relationship (GD §3.1.2, Fig 3-1, 3-3, 5-1); exact azimuth [APPROX] |
| Bundle pitch 6 in / cell 12 in, channel 139 mm, blade span 248 mm × 7.9 mm | [APPROX — standard GE BWR]; GD says the hardware is the same as operating GE BWRs but gives no dimension |
| Chimney top ≈ 16.5 m, separators ≈ 17–20.4 m, dryer ≈ 19.2–25.2 m, nozzle elevations | [APPROX — proportion constrained by GD Fig 3-1/3-3] |
| Shroud/chimney Ø ≈ 3.14 m (≈ 0.69 of vessel OD), downcomer ≈ 0.5 m | [APPROX — Fig 3-1, and the core's 1.45 m radius] |
| Hemispherical heads, flange size, 64 studs | [APPROX — Fig 3-1/3-3] |
| 44 separators on a 0.36 m grid | [APPROX — Fig 3-1 shows ~8 across]; no published count |
| Dryer bank layout (6 stepped banks), skirt | [APPROX — Fig 3-1] |
| Shroud support legs (12), guide tube/fuel support sizes, core plate | [APPROX], function from GD text |
| Blade patterns `operating` / `partial` | [APPROX]: review states, not official rod patterns |

## 5. The 240-bundle representation

- **Layout from the figure, not invented.** GD Figure 3-6 was rendered at 300 dpi and
  analysed (connected components of the blade crosses, then the hatched single bundles): 57
  crosses on a 9 × 9 cell lattice in rows of 3-5-7-9-9-9-7-5-3, and 12 hatched single bundles,
  one in each corner cell outside the octagon's diagonal edges, in the quadrant facing the core
  centre. 57 × 4 + 12 = 240, matching the GD text ("in all but 12 peripheral locations...").
  `coreLayout.ts` stores this as a cell map plus the 12 positions; a dev assertion checks 240/57.
- **Rendering:** one `InstancedMesh` (1 draw call) of a merged assembly unit. Each bundle has a
  stable id (`bundle-E5-01`, `bundle-C3-p`, ...). Instances are kept sorted front to back from
  the camera (the depth test then skips the hidden channels); `userData.instanceToBundle` maps an
  instance back to its bundle, so Stage 5/10 can pick or isolate one bundle without rebuilding.
- The cutaway planes run between assemblies (the lattice is centred on a blade), so no
  assembly is ever sliced by the vertical cut; the fuel draws front faces only, and switches to
  a capped variant (precompiled) only for the horizontal core section.
- No individual fuel rods in Stage 4 (optional hero subset not built; the data supports it).

## 6. The 57 control blades

- One per control cell, at the cell centre, wings along x and z, between the four bundles
  (N-lattice gaps). `ControlBladeState { id, position, insertion }` (0 = withdrawn below the
  core, 1 = fully in). Insertion is static data: `setBladeInsertion('withdrawn' | 'operating' |
  'partial')`; the instanced renderer rebuilds its matrices only when the data version changes.
- Withdrawn blades sit in their guide tubes below the core plate; inserted blades occupy the
  core between bundles from the bottom of active fuel up.
- Default cutaways use `operating` (9 blades part-in, the rest out): visible, not dominant.
  The control-blade review state uses `partial`, a step section through the core at mid-height
  (the core in plan, as GD Fig 3-6/4-1) and `bladeEmphasis` (accent rim plus a restrained warm
  tint on the blades' cut surfaces; the fuel steps back 30 %).

## 7. Vessel / cutaway architecture

- **Same section system as Stage 3, no second engine.** The vessel is now a sectioned reveal
  layer; new layers `internals`, `fuel`, `blades` share its clipping planes but have their own
  emphasis uniforms. Every part is a closed solid; touching parts keep the 5 mm inset; repeated
  parts are laid out so the planes fall between them (separators, legs, studs, nozzles).
- **Reveal state** gains three fields (all closed in the hero shot, closed again by `R`):
  `vesselCut` (the camera-facing quadrant x < 0, z > 0 opens from the flange edge to the axis,
  three quarters of the shell stay), `coreSection` (a horizontal step at mid-core) and
  `bladeEmphasis`. `applyReveal` derives everything from them.
- **Visibility:** the internals are `Interior` level `reactor`: not drawn (no draw calls, no
  shadow pass) until the vessel opens; compiled and uploaded at load like all hidden content.
- **Review states:** `config/rpvReview.ts` (data) + `animation/rpvReview.ts` (applies them:
  reveal tween + camera transition, or an immediate jump for captures). The plant is opened as
  at the end of the Stage 3 shot. Review cameras stand below grade inside the excavation, so
  the Explore floor is lifted while a review state is active (restored by the hero shot, the
  Stage 2 views and reset). `resetPresentation` moved to `animation/presentation.ts`.
- **Lighting/material:** one steel family by value: vessel matte steel (approved), stainless
  internals, a dark chimney barrel, dark-steel blades, warm-grey Zircaloy fuel (the lightest
  internal block), the dryer a step darker than the fuel. Internals neither cast nor receive
  shadows (lit like an illustration); the vessel keeps the Stage 3 rim and light pool.

## 8. Semantic IDs and metadata

`scene/rpv/components.ts`: `reactor-pressure-vessel`, `rpv-upper-head`, `rpv-shell`,
`rpv-lower-head`, `main-steam-nozzle`, `control-rod-drives`, `reactor-core`, `fuel-bundles`,
`control-blades`, `core-plate`, `top-guide`, `core-shroud`, `shroud-support`,
`control-rod-guide-tubes`, `chimney`, `chimney-head`, `steam-separators`, `steam-dryer`,
`downcomer-region`. Each entry: label (1–3 words), one-sentence description, parent, focus
camera state, PROJECT.md tier, source class and GD reference. The scene object's `name` is
the id and `userData.componentId` points back; instanced parts carry `userData.instanceIds`;
the downcomer (a region, not a part) carries its annulus bounds for Stage 5/7. The plant id
`reactor-pressure-vessel-placeholder` became `reactor-pressure-vessel`.

## 9. Files changed

**New:** `src/scene/rpv/` (`rpvData.ts`, `coreLayout.ts`, `rpvGeometry.ts`,
`ReactorPressureVessel.tsx`, `components.ts`), `src/scene/section/drawOrder.ts`,
`src/config/rpvReview.ts`, `src/animation/rpvReview.ts`, `src/animation/presentation.ts`,
`docs/stage4-review/`.

**Modified:**

| File(s) | Change |
|---|---|
| `plant/dimensions.ts` | GD Rev J as authority; RPV values (inner radius, wall, inner height, datum) |
| `plant/ReactorBuilding.tsx`, `plant/ids.ts` | Placeholder capsule replaced; RPV id |
| `plant/materials.ts` | Vessel now clipped with caps; internals/fuel/blades materials; draw rank |
| `plant/routes.ts` | Main steam route starts at the new nozzle flange |
| `section/sectionLayers.ts`, `sectionShader.ts`, `cutPath.ts`, `RevealDriver.tsx` | Vessel layers, cutaway box, cap tint, `reactor` interior level, shadow updates on plane change |
| `animation/heroReveal.ts`, `heroShot.ts` | Three new reveal fields; `cancelClose`; camera floor restored on play |
| `camera/cameraDirector.ts`, `camera/reviewViews.ts`, `config/camera.ts` | `allowBelowGrade`; five review poses |
| `SceneCanvas.tsx` | Opaque sort; shadow refresh after warm-up |
| Keyboard, setup controls, debug panel, automation, frame probe | Key `B`, review buttons, hooks |
| `README.md` | Stage 4 section |

## 10. Performance

Production build, Chrome headless, **Intel Iris Plus (ANGLE D3D11)**, 1920×1080, DPR 1, held
views sampled 6 s × 2 runs, every frame. Draw calls: held view / while a cut is moving (the
shadow pass now runs only then).

| View | Preset | Avg fps | p95 | Worst | Draw calls | Triangles |
|---|---|---|---|---|---|---|
| Stage 3 final (closed vessel) | High | 60.1 | 16.8 ms | 17.5 ms | 63 / 124 | 46k / 79k |
| | Low | 60.1 | 16.8 ms | 17.2 ms | 64 | 24k |
| RPV cutaway | High | 52.8–54.5 | 33.3 ms | 34.3 ms | 80 / 141 | 100k / 133k |
| | Low | 60.1 | 16.8 ms | 17.4 ms | 81 | 63k |
| Core close-up | High | 54.5–54.8 | 33.3 ms | 34.1 ms | 55 / 116 | 48k / 81k |
| | Low | 60.1 | 16.8 ms | 17.7 ms | 56 | 33k |
| Control-blade close-up | High | 48.3–49.0 | 33.6 ms | 34.6 ms | 48 / 109 | 58k / 91k |
| | Low | 60.1 | 16.8 ms | 17.3 ms | 49 | 37k |
| Steam region close-up | High | 50.3–52.6 | 33.4 ms | 34.9 ms | 60 / 121 | 48k / 81k |
| | Low | 60.1 | 16.8 ms | 17.7 ms | 61 | 28k |
| RPV exterior | High / Low | 60.1 / 60.1 | 16.8 ms | 17.2 ms | 62 / 63 | 45k / 23k |

- Budgets: high ≤ 141 draw calls (target ≤ ~170), low ≤ 81 (≤ ~100); triangles ≤ 133k high
  (budget 250k), ≤ 63k low.
- **First measurement was not acceptable** (core close-up 16 fps high / 29 low). Isolation
  showed overdraw, not geometry: three's default sort groups by material, so the far shaft,
  containment and earth were shaded and then painted over, and the 240 unsorted, double-sided
  channels shaded up to ~18 deep. Fixes, all image-neutral: inside-out/front-to-back draw order
  by reveal layer; front-to-back fuel instances; single-sided fuel except in the core section;
  shadow map re-rendered only when a section plane moves.
- **Open item:** in the high preset the four cutaway views sit just over the 16.7 ms budget
  on this GPU (MSAA + shadow-sampled, image-lit shading of near-full-screen geometry), so frames
  alternate 17/33 ms (avg 48–55 fps). Low is a steady 60. The Stage 3 shot is unaffected.
- **Review transitions:** program count constant through all transitions (13 high, 14 low;
  the capped fuel variant is precompiled at load); no shader compiles. High shows single
  ~67 ms frames at the start of some transitions (the first frames that re-render shadows and
  reveal the internals); low none.

## 11. Stage 3 regression

Production build, 3 runs per preset (`verification-report.json`, `stage3Regression`):

| Check | Result |
|---|---|
| Playback | high 60.1 fps, p95 16.8 ms, worst 17.4 ms, 0 frames > 20 ms (better than Stage 3's measurement: the shadow pass is skipped while nothing moves); low identical |
| Determinism | final pose delta 0; final frames byte-identical across 3 runs (high and low) |
| Programs during the shot | 13/13 high, 14/14 low |
| Explore after the shot / reset (R) / quality round-trip | working; reset returns home with every reveal field 0; switch 0.31 s, pose kept |
| Stage 2 section review (G/V) | working; now also cuts the RPV in half at z = 0 and shows its internals (intentional) |
| Stage 3 story, timing, camera, lighting, grade datum | unchanged; no camera adjustment was needed: the real vessel has the placeholder's height and diameter and fits the approved final framing (07, 08) |

## 12. Console

Production: only `THREE.Clock: This module has been deprecated` (React Three Fiber,
pre-existing). No errors, no failed or external requests (all review states, high and low).
Dev only: the pre-existing D3D `X4122` precision warning from three's PMREM shader.

## 13. Decisions needing approval before Stage 5

1. **Cutaway shape:** the camera-facing quadrant removed (three quarters of the shell kept),
   viewed along its bisector from slightly above (as GD Fig 3-1). Alternative: a half section.
2. **Control-blade view:** the step section at mid-core (core in plan) with the `partial`
   pattern and a restrained copper tint on blade sections. Is the tint level right?
3. **Hierarchy/values:** fuel lightest, chimney dark barrel, dryer a step darker than fuel,
   blades dark steel. Does the core read as the subject, and the chimney as "the central
   upward route"?
4. **Downcomer legibility:** a 0.5 m annulus (true to proportion) reads clearly in the
   close-ups, thinly in the full cutaway. Acceptable, or should Stage 7 carry it with flow?
5. **Approximated relationships:** separator count (44), dryer bank layout, nozzle azimuths,
   hemispherical heads, 6 in lattice pitch (see §4).
6. **High-preset close-ups at 48–55 fps on Iris Plus** (low steady 60). Accept for review
   states, or should the high preset drop MSAA/shadow receivers inside the vessel for close-ups?
7. **Optional hero fuel bundle** (rods visible) deferred; the data supports adding it later.
8. **Review cameras below grade** (inside the opened excavation, review states only).
