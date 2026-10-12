# Stage 5 Review Report: Explore Mode Interaction Architecture

**Project:** BWRX-300 interactive WebGL module (PROJECT.md is the master spec)
**Stage:** 5. Stage 6 has not been started.
**Git:** Stage 1 `280da5b`, Stage 2 `4fe2e54`, Stage 3 `d8536a0`, **Stage 4 `37470cb`**
(committed before Stage 5 began, from the reviewed tree, after `npm run check` passed).
Stage 5 changes are **not committed**, pending this review.

## Deliverables (`docs/stage5-review/`, all 1920×1080, production build)

| File | Content |
|---|---|
| `01-default-explore-1080p.png` | Explore at the home view: nothing selected, the panel at rest |
| `02-rpv-selected-1080p.png` | The RPV selected in the opened plant (label, warm rim); the pointer hovers the containment (name-only hover tag) |
| `03-core-focused-1080p.png` | The core selected and focused: fuel and blades highlighted as its parts, blades **not** copper |
| `04-control-blades-selected-1080p.png` | The control blades selected: the copper emphasis appears because the blades are the subject |
| `05-xray-rpv-1080p.png` | Vessel X-ray: the shell is a dithered silhouette, the internals stay opaque and readable |
| `06-section-control-1080p.png` | The section slider in the Reactor context at 0.5: the vessel quadrant half open |
| `07-isolated-separators-1080p.png` | The steam separators isolated: the rest steps back to 30 %, context kept |
| `08-low-interactive-1080p.png` | Low preset, separators selected: same features, same label |
| `stage5-interaction-1080p.mp4` | 23.8 s interaction video, 30 fps, H.264, no audio (sequence below); re-recorded after the reset polish |
| `stage5-reset-polish-1080p.mp4` | 4.2 s, 30 fps, H.264, no audio: control-blade close-up → Reset → home (reset polish, below) |
| `stage5-reset-before-after.png` | The same reset frames before and after the reset polish |
| `verification-report.json` | Raw measurements: interaction tests, performance, Stage 3/4 regression, reset polish |

**Video sequence** (real pointer moves, clicks and a slider drag on the production build, every
action through the scene or the panel; the clock is stepped
exactly 1/30 s per captured frame, so it plays at true speed): hover the reactor building →
Section on (the plant opens) → hover and click the RPV (focus) → X-ray on, off → Reactor
context (the vessel opens) → click the separators (focus) → Isolate on, off → "in Reactor
vessel" (parent) → drag the section slider 1 → 0.3 → 1 → click the fuel (core focus) → "in
Reactor core" (parent) → click a control blade (copper emphasis, focus) → Reset (the camera
backs out through the open cut with the vessel centred, climbs, and the plant closes behind
it; the pointer stays still after the click). The arrow cursor and click ring are
drawn by the capture harness (headless Chrome renders no OS cursor); they are not app UI.

## 1. Stage 4 commit

`37470cb0ab1d180a8f5a259485ad2f8c6583d70e` ("Stage 4: reactor pressure vessel and internals
(approved)"). 280da5b / 4fe2e54 / d8536a0 are unchanged beneath it.

## 2. State architecture

- **One store** (`src/interaction/exploreStore.ts`, zustand, outside the canvas): `mode`
  (`explore` | `presentation`), `hoveredId`, `selectedId`, `focusId`, `xray`, `isolate`,
  `section { on, context: plant | reactor, position }`, `labels`. Nothing else holds
  Explore state.
- **One set of actions** (`exploreActions.ts`): `select`, `clearSelection`, `focus`,
  `setXray`, `setIsolate`, `setSection`, `setSectionContext`, `setLabels`, `resetExplore`,
  `suspendForPresentation`, `resumeAfterPresentation`. The panel, the keys, canvas clicks and
  `window.__bwrx.explore` all call these; none writes the store directly.
- **Per-frame work stays out of React**: `ExploreDriver` (inside the canvas, `useFrame` at
  priority −95) does picking, eases the visuals and places labels by writing uniforms and DOM
  styles. Components re-render only on discrete changes (selection, toggles), never per frame.
- **Quality switching** remounts the canvas; the store survives, the driver re-binds the new
  meshes and re-applies the visuals immediately. Verified: the chimney selection and its label
  survive high → low.
- **Reset** (`R`, the panel's Reset, the setup panel's Reset view) clears every field
  to the initial state and closes the reveal, flying home.

## 3. Registry integration

The Stage 4 registry was **moved, not duplicated**: `src/scene/rpv/components.ts` →
`src/scene/components.ts` (`git mv`), its RPV entries and texts unchanged, and the plant
structures added (ground, reactor building, shaft, containment, main steam line, turbine hall,
turbine, generator, support buildings). Behaviour comes from data on each entry:

| Field | Meaning | Examples |
|---|---|---|
| `selectable` | can be the subject (else a click resolves to the nearest selectable ancestor) | vessel shell and heads → RPV |
| `partOfParent` | highlighted with its parent | fuel, blades, core plate, top guide with the core; nozzle and drives with the RPV |
| `enclosure` | what X-ray / isolation may ghost; interior levels drawn while ghosted; plan window; `openedBy` reveal field | building, shaft, containment, RPV, turbine hall |
| `opens` | the cut a focus needs (`plant` or `vessel`) | core and internals → vessel |
| `selectedCapTint` | warm cap tint when it is itself the subject | control blades (0.3) |
| `focus` | the camera state to focus | each entry |

Parent/child rules: selecting the RPV highlights its shell, heads, nozzles and drives, **not**
the internals; selecting the core highlights its fuel, blades, core plate and top guide; the
blades turn copper only when the blades themselves are selected (locked Stage 4 decision).
Hover / click on a non-selectable part resolves to its selectable ancestor. The panel's
"in {parent}" button walks up the tree.

The scene binds to the registry by object `name` (= ID), as Stage 4 established: no ID lists
in the interaction code.

## 4. Picking

- One `Raycaster.intersectObjects` against the meshes the registry owns (`picking.ts`), only
  when the pointer moved since the last frame, or when the camera has come to rest somewhere
  new under a still pointer (after an orbit, a wheel zoom, a focus move). At most once per
  frame; never while a button is held (orbiting) or during a cinematic.
- Skipped: hidden meshes, ghosted shells (X-ray lets you click through), and hits in the part
  a section plane cut away (the ray continues to what the viewer sees). Non-selectable parts
  still occlude (a click on the ground does not reach the shaft).
- Instanced meshes resolve to their group (`fuel-bundles`, `control-blades`); the instance
  index is returned for later stages, unused now (no per-bundle UI, as instructed).
- Click = press and release within 5 px and 600 ms; a drag is an orbit, not a click. A click
  on empty space or on the ground clears the selection.
- Binding data lives in WeakMaps, not in `userData` (R3F re-applies declarative `userData`
  props on re-render, which silently dropped it: found and fixed during testing).
- Cost (production, Iris Plus): a 54-point grid at the home view: mean 0.45 ms, p95 1.9 ms, max 3.8 ms
  (high); mean 0.2 ms, max 0.8 ms (low). Sweeping the pointer across the opened plant (one pick
  every frame) holds 60.1 fps in both presets.

## 5. Highlight

All through uniforms on the existing section shader; **no OutlinePass, no post-processing**.
Each component gets its own copy of its materials (`cloneForComponent`), with the same program
cache key, so binding and every toggle cost **zero shader compiles** (programs stay 13 high /
14 low through every test).

- **Hover:** a 12 % lift and a faint rim (0.08). No recolouring, no bloom, no pulsing.
- **Selection:** a 12 % lift and a warm rim (fresnel power 5), weighted by the surface's own
  luminance so dark undersides do not glow; plus the registry's cap tint (blades only).
- Easing is exponential per frame on the animation clock (hover 14/s, selection 10/s), and the
  pass goes idle once everything has settled (no per-frame uniform writes at rest).

## 6. Labels

One primary label (name + one sentence) in an HTML overlay, anchored to the centre of the
subject's highlight set and connected by a small dot; it flips sides past 60 % of the width,
is clamped 20 px inside the viewport (132 px above the bottom, clear of the panels), and hides
when the anchor is behind the camera. Hover shows a name-only tag at the pointer (not for the
selected part). `L` turns labels off; the description then moves into the panel card.
Checked at 1920×1080 and after a resize to 1280×720 (label stays fully on screen).

## 7. Camera focus

Focus goes through the camera director's `transition` authority (1.1 s, `power2.inOut`), so
OrbitControls is disabled for the move and re-synced at the hand-back: no fight, no jump (a
stale polar limit that snapped the camera after below-grade moves was found and fixed in
`cameraDirector.ts`). Focus poses are the registry's camera states (Stage 3/4 poses reused,
plus `turbineHallExterior` and `turbineTrain`). A focus that needs a cut opens it first (core
and internals → vessel cutaway; RPV and shaft → plant section). Below-grade focus poses are
allowed while focused; clearing the section or resetting returns the camera above grade.

## 8. X-ray

- Ordered-dither (4×4 Bayer) discard in the opaque pass: no blending, no sorting, no
  "transparent soup". Silhouette edges are kept denser than faces, ghosted surfaces are
  darkened by half, and back faces not seen through a cut are discarded.
- Driven by one normalized `xrayAmount` per component (eased), from the registry: in the plant,
  the building, shaft, containment, ground (inside a plan window around the reactor) and
  turbine hall ghost, so the RPV and the turbine train read through them; the RPV shell ghosts
  only when the subject is the RPV or something inside it, and the internals stay opaque.
- Enclosures that a section has already cut fully open are not ghosted (`openedBy`): there is
  nothing left to see through, and dithering them only adds clutter and fill cost.

## 9. Section

The panel's Section control reuses the Stage 3/4 section engine (`applyReveal`, clipping
planes, caps); no second system. On/off (`C`), a Plant / Reactor context and a slider:

- **Plant**: the slider opens the ground, then the shaft, then the containment, in sequence
  (0–0.45, 0.35–0.7, 0.7–1).
- **Reactor**: the plant stays open and the slider drives the vessel quadrant cut.
- Toggles tween in 0.7 s; the slider follows the pointer immediately. The shadow map is
  re-rendered only on frames where a plane moved (as in Stage 4).
- After the Stage 3 shot, the section state is synced to the open reveal, so the first
  section change starts from what is on screen.

## 10. Isolation

`I` (needs a selection): the selection's subtree stays at full brightness; everything else
steps back to 30 %; enclosures that hide it ghost (unless already cut open). Nothing is hidden,
so the context stays readable. Clearing the selection ends isolation.

## 11. Files

New:
- `src/interaction/exploreStore.ts` (57 lines): the state
- `src/interaction/exploreActions.ts` (173 lines): the actions
- `src/interaction/exploreVisuals.ts` (289 lines): binding, channels, easing
- `src/interaction/picking.ts` (86 lines): picking
- `src/interaction/labelLayer.ts` (79 lines): label placement
- `src/interaction/ExploreDriver.tsx` (124 lines): pointer input, the per-frame loop
- `src/ui/ExploreOverlay.tsx` (46 lines): label DOM
- `src/ui/ExplorePanel.tsx` (133 lines): the panel

Moved: `src/scene/rpv/components.ts` → `src/scene/components.ts` (+ plant entries, flags).

Changed:
- `sectionShader.ts`: Explore uniforms, ghost dither, rim, lift
- `materials.ts`: per-component clones, the downcomer region material
- `sectionLayers.ts`: interior overrides, `turbineHall` / `steamPath` levels, shadow refresh on visibility change
- `drawOrder.ts`: shell first while the vessel is only partly open
- `ReactorPressureVessel.tsx` / `rpvGeometry.ts`: the downcomer pick proxy, the fuel material variants
- `Plant.tsx` / `TurbineBuilding.tsx`: interior levels
- `presentation.ts` / `heroShot.ts`: reset clears Explore; delayed close from below grade
- `cameraDirector.ts`: hand-back limit fix; exit-first transitions (reset polish)
- `camera.ts`: two focus states
- `clock.ts`: `lastStep`
- `rpvReview.ts`: `stopRpvReviewTween`
- `useKeyboardShortcuts.ts`
- `automation.ts`
- `App.tsx`
- `SceneCanvas.tsx`
- `styles.css`
- `README.md`

No Stage 3 camera or framing, RPV geometry or internals changed. The downcomer's physical
geometry is unchanged; the proxy is an invisible annulus inside it, drawn only while the
downcomer is selected.

## 12. Performance

Production build, 1920×1080, Intel Iris Plus (the review machine), 6 s per sample, two runs
each. The display is 60 Hz, so a missed frame is 33 ms: fps below 60 is the share of missed
frames.

**Stage 5 interactive states** (fps per run; frames over 20 ms in brackets):

| State | High | Low | Draw calls high / low |
|---|---|---|---|
| Idle, home, nothing selected | 60.1 (0) / 60.1 (0) | 60.1 / 60.1 | 62 / 63 (= Stage 4) |
| Idle, opened plant, RPV view | 60.1 (0) / 57.8 (14) | 60.1 / 60.1 | 63 / 64 |
| Selection active: RPV | 60.1 / 60.1 | 60.1 / 60.1 | 62 / 63 |
| Selection active: core close-up | 51.6 / 52.7 | 60.1 / 60.1 | 55 / 56 |
| X-ray active: vessel (RPV subject) | 53.8 / 55.6 | 60.1 / 60.1 | 77 / 78 |
| X-ray active: plant, home view | 60.1 / 60.1 | 60.1 / 60.1 | 89 / 90 |
| Section active: Reactor cut at 0.5 | 46.8 / 49.6 | 60.1 / 60.1 | 80 / 81 |
| Isolation active: separators | 49.5 / 52.3 | 60.1 / 60.1 | 64 / 65 |
| Pointer sweep, a pick every frame | 60.1 | 60.1 | 63 / 64 |

Programs: 13 (high) / 14 (low) at ready and after every state and transition: **no shader
compiles** from selection, hover, X-ray, isolation or section changes.

**Stage 4 cutaway views, committed Stage 4 build vs Stage 5 build** (same machine, back to back):

| View | High, Stage 4 | High, Stage 5 | Low, both |
|---|---|---|---|
| Stage 3 final frame | 60.1 / 60.1 | 60.1 / 60.1 | 60.1 |
| RPV exterior | 60.1 / 60.1 | 60.1 / 60.1 | 60.1 |
| RPV cutaway | 57.1 / 52.8 | 53.6 / 58.0 | 60.1 |
| Core close-up | 53.8 / 54.3 | 54.8 / 57.6 | 60.1 |
| Control blades close-up | 47.5 / 48.6 | 49.3 / 52.0 | 60.1 |
| Steam region close-up | 53.1 / 52.6 | 59.8 / 57.6 | 60.1 |

Draw calls and triangles are identical in every view; the worst frame during the review
transitions is the same (high 66 / 34 / 34 / 50 / 50 / 67 ms vs 67 / 33 / 34 / 50 / 50 / 66 ms;
low ≤ 17.3 ms). Stage 5 at rest therefore adds **no measurable cost** (the Explore pass is idle
once settled; Stage 5 is if anything slightly faster in partly-open vessel views, where the
shell now draws before the internals it hides). **Stage 3 cinematic**: 60.1 / 60.0 / 60.1 high,
60.1 / 59.9 / 60.1 low (section 13).

**Within the accepted envelope:** low is 60 everywhere; high stays in the 47–55 fps close-up
range accepted at Stage 4 when X-ray, isolation or a partial section is active in a close-up.
Two optimizations were made because their first measurements fell below that range:
- not ghosting enclosures already cut open: vessel X-ray 41 → 54–56 fps, isolation 35 → 50–52;
- shell-first drawing while the vessel is partly open.

No post-processing was added; further work is left to Stage 11.

## 13. Stage 3 / Stage 4 regression

**Stage 3 cinematic** (`stage3.mjs`, three runs per preset, production):

| | Stage 4 build (`37470cb`) | Stage 5 build |
|---|---|---|
| High fps (frames > 20 ms) | 60.1 (0) | 60.1 (0) / 60.0 (1) / 60.1 (0) |
| Low fps (frames > 20 ms) | 59.8 (1) | 60.1 (0) / 59.9 (1) / 60.1 (0) |
| Draw calls during the shot | high 62–133, low 63–73 | high 62–133, low 63–73 |
| Programs before / after | 13 / 13, 14 / 14 | 13 / 13, 14 / 14 |

- **Deterministic:** pose delta across runs 0; all final frames identical across runs.
- **Same picture as Stage 4:** the final frame differs from the committed Stage 4 build in
  3 px (high) / 6 px (low), by 1 level of 255 (rounding in the shader's added neutral terms).
  An older scratch baseline differed at the steam nozzles; that baseline predated the Stage 4
  nozzle fix, so `37470cb` itself was rebuilt and used as the reference.
- **Reset after the shot:** same curve (camera height, ground refill) and same end pose and
  reveal as Stage 4; the new below-grade delay does not apply above grade.
- **Cinematic authority:** with the blades selected, isolated and X-rayed, `P` starts the shot:
  Explore suspends (mode `presentation`, selection cleared), the shot's final frame is
  byte-identical to a fresh page's, and a click during the shot changes nothing. Explore
  resumes afterwards with the section synced to the open reveal.
- **Stage 4 views** on both builds: same draw calls, triangles and programs; fps within
  run-to-run noise (table in section 12). Stage 2 review views (`V`), section review (`G`) and
  Stage 4 review states (`B`) still work; the only image differences there are the new panel.
- **Interaction tests** (`s5interact.mjs`, real pointer and keys, high and low):
  - real hover and click select the RPV;
  - Esc, X, L and C work, and I without a selection is a no-op;
  - 40 random select / hover / isolate / X-ray / section operations followed by `R` give a frame
    byte-identical to the untouched default (no stale state);
  - the quality switch keeps the selection and label;
  - a 1280×720 resize keeps the label on screen.
- **Hover with a still pointer:** a static pointer re-picks after the camera moves under it
  (three camera moves checked: hovered always equals what is under the pointer).

## 14. Console

Across every run (interaction tests, stills, video, performance, Stage 3 harness, both
presets): **no errors, no page errors, no failed requests, no external requests.** One
warning, unchanged from Stage 4: `THREE.Clock: This module has been deprecated. Please use
THREE.Timer instead.` (from React Three Fiber's internal clock; the app's own time source
is `animationClock`).

## 15. Decisions needing approval

1. **Hover look:** a 12 % lift plus a faint rim; no outline, no colour. Is this visible
   enough on the projector?
2. **Selection look:** a warm luminance-weighted rim and lift; copper cap tint only when the
   control blades are themselves selected (the locked rule holds for the core).
3. **Click on empty space or ground clears the selection** (Esc does too). The alternative is
   "only Esc / ✕ clears".
4. **X-ray skips enclosures that are already cut fully open** (`openedBy`). With the plant
   section fully open, X-ray therefore changes only the RPV shell (when the subject is the RPV
   or inside it). This also lifted vessel X-ray in high from about 41 to about 54 fps, and
   isolation from about 35 to about 51.
5. **Isolation keeps context:** the rest dims to 30 % rather than hiding.
6. **Reset from below grade:** the camera leaves through the open cut first, and the walls
   start closing 0.77 s later (2.2 s in all). From above grade (the Stage 3 end pose) the
   reset is unchanged. *The brief close pass by the vessel noted here at first review is
   removed by the reset polish below.*
7. **Downcomer selection:** a region proxy (an invisible annulus 2 cm inside the existing
   downcomer bounds) is pickable and is drawn only while selected, as a warm ghosted volume.
   The physical geometry is not enlarged (locked rule).
8. **Fuel click selects "Fuel"** (the group); the core is one click up via "in Reactor core".
   Clicking the vessel shell selects the RPV.
9. **Section slider in the Plant context** opens ground → shaft → containment in sequence.
   The Reactor context keeps the plant open and drives the vessel cut.
10. **Panel auto-hide:** the panel fades after 2.5 s without pointer movement and returns on
    movement. It is hidden during the cinematic.
11. **Two new focus camera states:** `turbineHallExterior` and `turbineTrain`. Stage 3
    framing is untouched.
12. **High-preset interactive close-ups** run at 47–55 fps (reactor section at 0.5 is about
    47, the lowest). This matches the accepted Stage 4 envelope; low is 60 everywhere.
    Further work is left to Stage 11.

## Stage 5 reset polish (after first review)

**Issue:** a reset from the control-blade close-up passed a few tenths of a second so close
to the vessel and the containment wall that a near surface filled the screen.

**Cause:** the reset transition moved its orbit target straight towards the home target (36 m
east, behind the vessel's uncut half) from the first frame. With the camera still about 5 m
from the vessel axis, its line of sight swept across the uncut shell and then the containment's
back wall at close range.

**Change** (`cameraDirector.ts`, `presentation.ts`; nothing else): a transition option
`exitRadius`. For a reset that starts below grade, the orbit target holds still until the
camera has dollied out to 25 m from it. That point is outside the containment (r 9.5 m), in the
opened excavation. So the camera backs out along its own sight line, through the cut it was
looking into, with the open vessel centred. Then the target eases across to the home target
(smoothstep, no jolt) while the camera climbs.

- **Same timing:** camera 1.4 s; the walls start closing at 0.77 s and are closed at 2.17 s.
- **Same end:** exactly the approved home pose.
- **No teleport, fade or hidden geometry;** the focus poses are unchanged.
- **Only where needed:** the hold length follows from the start distance, so the close-ups
  hold (blades 0.42, core 0.39, steam region 0.13 of the move). The vessel exterior and
  cutaway, already more than 25 m out, keep their path exactly. An above-grade reset (Stage 3
  end, any plant focus) never passes the option and is unchanged.

**Verification** (production build; real `R` key; clock stepped exactly 1/30 s per frame;
every frame a 16×9 grid of view rays with picking's visibility rules):

| Reset from | Before: enclosure wall < 10 m, worst share of screen / nearest surface | After |
|---|---|---|
| Control-blade close-up | 35 % (containment wall dominant at 56 %) / 2.47 m | 18 % / 4.23 m: never above the close-up's own frame, 0 % from 0.53 s |
| Core close-up | 24 % / 4.45 m | 13 % / 5.02 m: the close-up's own frame, 0 % from 0.47 s |
| Steam-region close-up | 0 % / 14.2 m | 0 % / 13.9 m |
| RPV exterior, RPV cutaway | 0 % | identical path, frame for frame |
| Above grade (Stage 3 end, containment focus) | 0 % | identical path, frame for frame |

- **Above-grade reset:** camera and reveal sequences are equal before and after over 87 frames
  each. Every scene pixel is identical; the only differing pixels (3 of 174 frames) are in
  the two UI panels' real-time CSS fades during capture.
- **High and low:** the camera and reveal sequences are equal in all seven scenarios. The
  same safe path is used in both.
- **End state:** the end pose is identical in every scenario and both presets
  (`[-95, 64, 150]` → `[36, 5, -8]`, fov 35). All Explore state is cleared (selection,
  focus, X-ray, isolation, section; labels back on) and the reveal is fully closed. No pose
  went below grade outside the opened excavation.
- **Stage 3 cinematic:** final frames byte-identical to the approved Stage 5 build (0 px),
  60.1 fps in all three runs per preset, pose delta 0 across runs, reset end pose unchanged.
- **Interaction suite** (high and low): all pass, including "40 random operations + R"
  giving a frame byte-identical to the untouched default, and the shot's final frame
  matching a fresh page.
- **Cost:** programs 13 / 14 constant (no shader compiles); idle 60.1 fps high and low
  (unchanged). The change runs only during a reset.
- **Clean run:** `npm run check` passes; no errors and no external requests.

**Note:** the exit follows the camera's own sight line, and from every Explore focus pose that
line runs through the open cut. A camera that the user has orbited into an uncut sector while
below grade already starts inside the walls; reset then backs out the same way. The review
capture keeps the pointer still after the click. As before, hover tags name what passes
under a pointer that moves during a reset (unchanged hover behaviour).

**Interaction video re-recorded** with the polished reset: same harness, same sequence and
timing (713 frames, 23.77 s). The 3D image is unchanged up to the Reset click at
21.07 s: 610 of 713 frames are byte-identical. The other pre-reset differences are UI fades
(real-time CSS during capture) or ±1–2 levels on a few pixels. From the click on it shows the
new path, with the pointer held still (as in the reset clip).

Not committed; awaiting final approval.
