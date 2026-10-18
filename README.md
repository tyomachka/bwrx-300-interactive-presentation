# BWRX-300 Interactive 3D Module

Interactive WebGL 2 visualization of the GE Vernova Hitachi BWRX-300 SMR for a live
university presentation. `PROJECT.md` is the master specification. The official
references are `references/technical/005N9751-BWRX-300-General-Description.pdf` and
`references/technical/11.pdf` (UK GDA Chapter 1, NEDO-34163 Rev B). They are kept locally
and not committed; see `references/links.txt`.

**Current state: Presentation v1 (the ~7-minute talk), branch `presentation-v1`, a working draft
awaiting owner review: not final, not approved.** Stages 1-10 are approved checkpoints (the 48 s
film and its subsystems). Stage 11 (portable delivery, LT/EN) is preserved as WIP (`c672112`), not
approved. Review material is in `docs/stage1-review/` to `docs/stage11-review/` and
`docs/presentation-v1-review/`.

## Commands

```bash
npm install
npm run dev        # http://localhost:5173
npm run check      # typecheck + lint + production build
npm run preview    # serve dist/ locally
```

## URL parameters

| Parameter | Effect |
|---|---|
| `?mode=explore` | The interactive model only (what the opening / closing QR opens): the whole viewport, the touch-friendly Explore sheet, no talk, no 48 s film, on any device |
| `?mode=presentation` | The lecture set-up even on a phone (testing the talk at a phone-sized viewport) |
| (no `mode`) | A touch-only device (phone, tablet: coarse pointer and no mouse / trackpad) opens the model only; every other device opens the lecture set-up |
| `?quality=low` / `?quality=high` | Choose the rendering preset (otherwise: high; low on a software renderer, in the portable package, and on a touch-only device unless its user picked High before) |
| `?forceFallback=1` | Show the startup gate's HTML fallback (poster, QR, backup video in the portable package) instead of starting the 3D view (testing) |
| `?bootWait=long` | Give the startup gate five times longer before it falls back (the fallback's "try again") |
| `?debug` | Show the diagnostics panel and enable the review keys (works in production builds too) |
| `?presentationDebug` | Open the talk's debug panel: beat list with direct jumps, beat inspection, "copy camera pose". With `?debug` (or in dev) `T` toggles it. Never part of the audience view (ignored with `?mode=explore`) |

## Keyboard

Keys are matched by physical position, so they also work on the Lithuanian layout.

**The talk (Presentation v1).** While it runs it owns these keys and ignores every other key
except the operator's quality (`1` / `2`) and, in dev / `?debug` only, the diagnostics (`` ` ``) and
debug-panel (`T`) keys, so a stray press cannot toggle an Explore mode on the projector:

| Key | Action |
|---|---|
| `→` / `Space` / `Page Down` | Next chapter (12 chapters, 11 presses from the opening to the questions; each chapter plays its own cues and then holds). From Explore (film idle) the same keys start the talk, or resume it where it was left. A second press within the 1.2 s guard is ignored; after it a press goes straight to the next chapter |
| `←` / `Page Up` | Previous chapter, settled at its final state |
| `Home` | Back to the opening (from Explore too) |
| `R` | Safe reset: the current chapter re-established at its final state behind a short dip |
| `Esc` | Leave to Explore; `→` returns to the same chapter |

**The 48 s film** starts from the setup bar ("48 s filmas" / "48 s film"). While it plays or holds
its final frame, the keys below keep their film meaning:

| Key | Action |
|---|---|
| `Space` | Pause / resume the film; after the end, play it again |
| `Home` | Restart the film from its first frame |
| `R` | Reset: stop the film, clear every Explore state, close the reveal, smooth transition to `plantExterior` (the way back after any accidental key) |

**Explore and review keys:**

| Key | Action |
|---|---|
| `Esc` | Clear the selection |
| `X` | X-ray on / off |
| `C` | Section on / off (Reactor context when the selection is inside the vessel) |
| `I` | Isolate the selection on / off (needs a selection) |
| `L` | Labels on / off |
| `F` | Flow on / off: the normal-operation flow, looping (Stage 7) |
| `O` | Control on / off: the control-blade slider and the reaction cue; opens the Reactor section and frames the blades (Stage 8) |
| `S` | Safety on / off: the passive isolation-condenser loop; opens the building with the ICS pools, turns Flow off, leaves the camera alone (Stage 9) |
| `1` / `2` | High / low quality (ignored while the 48 s film plays) |
| `` ` `` | Toggle diagnostics (dev build, or with `?debug`) |
| `T` | Toggle the talk's debug panel (dev build, or with `?debug` / `?presentationDebug`; also during the talk) |
| `P` | Review aid: play / restart the Stage 3 hero shot from its first frame (dev / `?debug`) |
| `K` | Review aid: pause / resume the hero shot (dev / `?debug`) |
| `V` | Review aid: cycle the four Stage 2 review views (dev / `?debug`) |
| `G` | Review aid: toggle the section review (dev / `?debug`) |
| `B` | Review aid: cycle the Stage 4 vessel review states: exterior, cutaway, core, control blades, steam region (dev / `?debug`) |
| `,` / `.` | Master sequence: one frame back / forward, paused (dev / `?debug`) |
| `[` / `]` | Master sequence: previous / next beat (dev / `?debug`) |

The `?debug` panel also has the shot buttons and a time scrubber that shows the exact frame
at any time. For automation, `window.__bwrx` (dev / `?debug` only) exposes
`shot.play() / seek(t) / togglePause()`, `rpvReview.show(id)`, `snapCamera(pose)`, the
reveal state, the camera pose and per-frame renderer statistics.

Mouse in Explore mode:

| Input | Action |
|---|---|
| Hover | Names the part under the pointer |
| Click | Selects the part and focuses the camera on it; on empty space, clears. Applied 0.3 s after the click, once no second click followed |
| Double-click a surface | Orbit around that point from now on: the camera stays put and turns to it (0.35 s); no selection change, no marker |
| Wheel | Zoom towards the point under the pointer (it stays under the pointer); over the background, towards the orbit centre |
| Left-drag | Orbit |
| Middle-drag, right-drag, Shift + left-drag | Pan (screen space, damped) |

Where Explore may go depends on what is cut open (`src/camera/exploreBounds.ts`): with the
plant closed the camera and orbit centre stay above grade; with the plant cut open the orbit
centre can go down into the reactor (core, guide tubes, bottom head, drives) and the camera
can stand in the open excavation in front of the cut, down to its floor, looking up a little.
Below grade it never goes behind the section plane. Reset brings back the closed limits.
None of this applies while a shot or the master sequence plays, or during a focus or reset move.

`window.__bwrx.explore` exposes `state()`, `select(id)`, `xray()`, `isolate()`, `section()`,
`pickAt(x, y)` and `settle()` for automation; `window.__bwrx.navigation()` the navigation
context and the limits in force.

## Plant massing (Stage 2)

- `src/scene/plant/dimensions.ts` holds every number, each tagged with its provenance:
  `[GD]` official General Description, `[NEDO]` official UK GDA Chapter 1, `[BRIEF]`,
  `[PRESS]` or `[APPROX]` educational approximation.
- Layout: the reactor axis is at the origin and grade is at y = 0. The turbine hall is to
  the east (+x), support buildings to the north, and the open front faces south (+z).
- Hierarchy: `site-ground` → `reactor-building-shaft` → `containment-placeholder` →
  `reactor-pressure-vessel-placeholder`, plus `reactor-building-above-grade` (pools,
  refuelling floor, roof), `main-steam-path-placeholder`, `turbine-building`
  (`turbine-placeholder`, `generator-placeholder`), `support-buildings` and `scale-cues`.
  IDs live in `src/scene/plant/ids.ts`; each is the `name` of its root group.
- **Section review** (development aid, not the Stage 5 section system): a static cut at
  z = 0 through the whole site, drawn by the Stage 3 section system. Context objects in
  front of the cut (turbine hall front, truck) hide.
- **Interior**: content hidden inside opaque buildings or below grade is not drawn until
  something opens it up (by reveal level). It stays addressable, and its shaders and
  shadow variants are compiled at load so a reveal never stalls.
- The main steam route is plain data in `src/scene/plant/routes.ts`, for later flow
  animation.

## Hero shot and reveal (Stage 3)

- **Shot data:** `src/config/heroShot.ts` holds the timing (beats, camera keyframes by pose
  name, reveal tracks). The poses (`stage3Exterior` … `stage3RPVHero`) are data in
  `src/config/camera.ts`. Retiming never touches scene components.
- **Reveal state:** `src/animation/heroReveal.ts`, five numbers from 0 to 1 (`groundCut`,
  `exteriorDim`, `shaftReveal`, `containmentReveal`, `rpvEmphasis`). Only the shot timeline
  (GSAP) animates them.
- **One mapping:** `src/scene/section/sectionLayers.ts` (`applyReveal`) derives everything
  visual from that state every frame: section planes, per-layer dims, rims, fill light,
  the RPV backlight pool, and interior visibility. `RevealDriver.tsx` calls it.
- **Cut technique:** clipping planes plus a one-pass cut-surface shader
  (`sectionShader.ts`). Back faces seen through a cut are shaded as the cut surface at the
  exact cut plane: earth strata, concrete, containment steel, and the accent grade datum
  (on section planes only; it fades out once the shaft is established).
  There is no stencil and no transparency. Rules that keep it correct: section solids never
  share or overlap faces (`SECTION_INSET`, merged profiles in `geometry.ts`), and context
  geometry never touches or enters grade (`ON_GRADE`).
- **Layers:** ground (excavation box in front of the reactor building), building + shaft,
  containment; the RPV is never cut. All cuts end on the plane z = 0. The building and
  containment planes follow measured stations (`cutPath.ts`): equal reveal progress gives
  roughly equal visible change, so each opening reads continuously.
- **Camera:** `src/camera/cameraPath.ts` interpolates the timed poses as monotone cubics
  in orbit space (no overshoot, continuous velocity, eased start and end, no roll). The
  director's `cinematic` authority evaluates it each frame from the timeline time, so
  restart and seek are exact. After the shot, Explore takes over from the final pose; the
  camera is kept above grade while the plant is opened up.

## Reactor pressure vessel and internals (Stage 4)

- **Sources:** GD 005N9751 Rev J (June 2026) is the authority; NEDO-34163 Rev B (2025, older)
  differences are recorded, not applied. Every number is in `src/scene/rpv/rpvData.ts` (vessel
  basics in `plant/dimensions.ts`) with its provenance tag.
- **Core layout** (`src/scene/rpv/coreLayout.ts`): read off GD Figure 3-6: 57 four-bundle
  control cells (rows 3-5-7-9-9-9-7-5-3) plus 12 peripheral bundles = 240 bundles, 57
  blades. Blade insertion is plain data (`ControlBladeState.insertion`, not animated).
- **Geometry** (`rpvGeometry.ts`, `ReactorPressureVessel.tsx`): closed solids of revolution
  and merged parts, one draw call per material; bundles and blades are instanced. The
  internals (`Interior` level `reactor`) are drawn only when the vessel cutaway opens.
- **Cutaway:** the vessel is a reveal layer like the plant structures. `vesselCut` removes the
  quadrant facing the south-west cameras (x < 0, z > 0); `coreSection` adds a horizontal step at
  mid-core (the core in plan). The internals, fuel and blades layers use the vessel's planes,
  with their own emphasis uniforms. Cutaway planes run between repeated parts by design.
- **Review states** (`src/config/rpvReview.ts`, key `B`): data pairing a camera pose with a
  reveal and a blade pattern. They stand below grade inside the opened plant, so Explore may
  follow them there while a review state is active.
- **Semantic IDs**: one registry entry per component (label, description, parent, focus pose,
  tier, provenance); the scene object's `name` is the ID. Since Stage 5 the registry is
  `src/scene/components.ts` and covers the plant too (see below).

## Explore mode (Stage 5)

- **One registry** (`src/scene/components.ts`): the Stage 4 registry, extended to the plant
  structures. Behaviour is data on each entry: `selectable`, `partOfParent` (highlighted with
  its parent, e.g. the fuel and blades with the core), `enclosure` (what X-ray / isolation
  may ghost, which interior levels then draw, and which reveal field cuts it open), `opens`
  (the section a focus needs: `plant` or `vessel`), `selectedCapTint`. No hard-coded lists.
- **One state** (`src/interaction/exploreStore.ts`, zustand): mode, hovered, selected,
  focused, X-ray, section (on, Plant / Reactor context, position), isolation, labels. Actions
  in `exploreActions.ts`; the panel, the keys and automation all call those.
- **Picking** (`picking.ts`): one raycast against the registry's meshes, only after the
  pointer moved (or the camera came to rest under a still pointer), at most once a frame.
  Hits in cut-away parts and in ghosted shells are skipped; instanced meshes resolve to their
  group (`fuel-bundles`, `control-blades`).
- **Visuals** (`exploreVisuals.ts`): each component gets its own copy of its materials with
  the same shader program (no compile), so hover, selection, isolation and X-ray are uniform
  writes, eased per frame and idle once settled. Hover: a slight lift. Selection: lift, a warm
  luminance-weighted rim, and the cap tint where the registry asks for it. X-ray and isolation
  ghost enclosures with an ordered-dither discard (no blending, no sorting), keeping
  silhouettes. No post-processing.
- **Labels** (`labelLayer.ts`, `ui/ExploreOverlay.tsx`): one HTML label anchored to the
  selection's bounds, clamped on screen, hidden behind the camera; hover shows the name only.
- **Focus**: the camera director's `transition` authority (1.1 s), so OrbitControls never
  fights it. A focus that needs a cut opens it through the same section engine as the panel.
  Each component's focus is an authored camera state in the registry; the vessel internals
  that a view from above cannot show (guide tubes, core plate, shroud support, drives, chimney,
  chimney head, downcomer) have side or low three-quarter compositions (`config/camera.ts`).
- **Navigation** (`camera/ExploreOrbitControls.ts`, `camera/cameraDirector.ts`): the one
  OrbitControls, with its wheel step replaced by a cursor-centred zoom (one pick per wheel
  gesture, eased over a few frames, orbit centre re-seated at the depth of what is under the
  pointer) and a double-click retarget; limits by cut context (`camera/exploreBounds.ts`).
- **Presentation safety**: while a cinematic owns the camera, Explore clears its visuals and
  ignores input; it resumes, in sync with the reveal, when the shot hands back.

## Master sequence (Stage 6)

- **Data** (`src/config/masterSequence.ts`): beats, semantic events, camera keys, reveal tracks
  and look cues, all in seconds of master time; `docs/stage6-review/beat-timings.json` is
  exported from it (`window.__bwrx.master.timings()`). Scene components own no timing.
- **Stage 3 is the opening, reused, not copied:** 0-10 s run the hero shot's own camera keys
  (the same `CameraPath`) and reveal tracks (the same GSAP builder,
  `animation/revealTimeline.ts`). The master camera continues with a second path that starts
  at rest on the shot's final pose, so the first ten seconds are byte-identical to the shot.
- **Later reveal tracks** are a pure-function overlay over the shot's end state (a GSAP
  timeline cannot hold several tweens of one property safely under backward seeks).
- **Look** (`MASTER_LOOK`): subject emphasis, context dim, enclosure ghosts and extra interior
  levels, evaluated from master time and applied without easing through the Stage 5 visuals
  (`setCinematicLook`), quieter than an interactive selection.
- **Controller** (`animation/masterSequence.ts`): play, pause, seek, frame step, beat jumps,
  restart; status in `useMasterStore`. Seek resets the reveal and re-renders it at the time, so
  any seek (forwards, backwards) shows exactly the frame playback shows; with
  `animationClock.fixedStep` it exports frame-accurately.
- **Events for Stages 7-10** (`MASTER_EVENTS`): `masterSequence.subscribe` delivers events
  crossed during playback, seeks and status changes. Effects should derive their state from
  `masterSequence.time` (pull) and use events only for one-shot cues, so seeking stays exact.
- **Authority:** while it owns the camera, Explore is suspended (no hover, selection, labels,
  panel; clicks and Explore keys do nothing) and the setup panel stays hidden during playback.
  At the end it holds the final frame (`finished`, cinematic authority) until Reset, a restart
  or another shot. A quality switch or another shot stops it.

## Normal operating flow (Stage 7)

- **Story** (GD Rev J §3.1.1, §3.1.2, §5.1): water rises through the core by natural
  circulation and part of it boils; the steam-water mixture rises through the chimney into the
  separators; separated water returns down the downcomer annulus to the core inlet; the dryer
  takes out the remaining moisture; dry steam leaves through the main steam line to the HP and
  LP turbines on one shaft with the generator; electricity leaves the generator. Direct cycle:
  no steam generator, no recirculation pumps.
- **One flow state** (`animation/operatingFlow.ts`): a pure function of master time in the
  presentation (keys in `config/flow.ts`, anchored on the Stage 6 events `flowCore` ..
  `electricityOut`), the animation clock in Explore Flow, otherwise off (no draw calls). Seek,
  playback and fixed-step export show the same flow frame.
- **Vessel** (`scene/flow/VesselFlow.tsx`): every channel in one instanced draw call; particle
  positions are computed on the GPU from streamlines baked into a float texture
  (`flowPaths.ts`, `flowMaterials.ts`). Core and downcomer are drawn at the section faces of the
  quarter cut, the chimney, separators, dryer and dome in the open volumes behind it, so upward
  (centre) and downward (outer slots) flow never share screen space. Water: blue comet streaks;
  the mixture turns pale with bubbles; steam: pale, wide, soft; droplets are caught in the dryer.
- **Steam line, turbine, electricity** (`PowerFlow.tsx`): pulse tubes that light up behind an
  advancing front; turbine highlights run HP inlet to exhaust, then each double-flow LP from its
  middle outwards. **Shaft** (`ShaftCouplings.tsx`): the couplings turn (slowed for the eye), the
  casings never do.
- **Explore Flow** (`F`, panel): steady and looping. The turbine hall turns X-ray so the steam
  line, turbine and generator show; the reactor's flow shows through the Reactor section or
  X-ray (with Flow on, X-ray also ghosts the vessel). A selection keeps priority (the flow dims).
  Reset turns it off; a quality switch keeps it.
- **Quality:** `particlesMultiplier` (High 1, Low 0.35) sets the number of streamlines; the
  channels and story are the same.

## Reactor control (Stage 8)

- **Story** (GD Rev J §3.1.1.1, §3.2, §4.2): the cruciform blades rise from the bottom-mounted
  drives between the four fuel assemblies of their cell; more insertion absorbs more neutrons
  and the chain reaction becomes weaker. The drive housings stay still (Fig 3-7: only the hollow
  piston and the blade move).
- **[EDUCATIONAL REPRESENTATIVE MOTION]:** the GD publishes no rod sequence. From the approved
  Stage 4 base pattern every blade moves the same half stroke farther in
  (`insertion = base + amount * 0.5`, clamped below full insertion, `config/control.ts`): 48
  blades 0 -> 0.5, 9 blades 0.35 -> 0.85, none fully in. In the presentation it runs 38.9-40.6 s
  around the Stage 6 `controlAction` event and stays in for the safety chapter.
- **One control state** (`animation/reactorControl.ts`): `bladeControlAmount` (0..1) and
  `reactionIntensity` (an abstract educational cue: 1 -> 0.3, not power, not %), a pure
  function of master time in the presentation, the eased slider in Explore Control, otherwise
  the base pattern. The blades stay one instanced draw call; the move is one rigid translation
  of the batch (the 57 instance matrices only change with the base pattern).
- **Reaction cue** (`scene/control/`): sparse, short warm-white glints on the fuel faces the
  quarter cut exposes, behind the blade wings (one draw call, seeded, time-derived). Fewer flash
  as the blades go in, and almost none below a blade tip. With the Stage 7 flow the core's
  boiling follows the same cue; the core water keeps circulating.
- **Explore Control** (`O`, panel): one slider, withdrawn (left) to inserted (right), no numbers.
  The blades take the copper emphasis; a selection keeps priority (the cue steps back). With
  Flow on, the core's boiling follows the slider; the turbine-side flow does not. Off eases the
  blades back; Reset restores the base pattern at once; a quality switch keeps the state.

## Passive safety (Stage 9)

- **Story** (GD Rev J §2, §3.3, Fig 3-8, §10): even with the blades in, the reactor still makes
  heat. Three independent isolation-condenser trains, each a heat exchanger submerged in its own
  pool above the containment: steam from the RPV rises to the IC, condenses in its tubes, gives
  its heat to the pool water, and the condensate drains back to the RPV in the chimney region.
  The ICs stand above the steam source, so the loop is natural circulation driven by gravity:
  no pumps, no AC power. The turbine-generator plays no part; nothing here makes electricity.
- **[APPROX] Layout** (`config/safety.ts`, `scene/safety/icsLayout.ts`): one tube bank per IC
  (Fig 3-8 draws two modules), headers broadside to the south cameras, the steam riser at the
  IC's inner end and the condensate riser at its outer end, so each train reads as a loop.
- **Shutdown handoff** (41.5-42.4 s, `config/control.ts` CONTROL_SHUTDOWN, [EDUCATIONAL
  REPRESENTATIVE SHUTDOWN HANDOFF]): with the blades already in, the reaction cue falls from the
  Stage 8 level to near zero (glints vanish); the core keeps boiling on decay heat and the vessel's
  warmth comes up early. No further blade motion, no scram, no power figure.
- **One safety state** (`animation/passiveSafety.ts`): pure function of master time in the
  presentation (keyed on `safetyEnter` 41.5, `isolationCondenser` 44.6, `safetyExit` 46.0),
  the same schedule replayed from the toggle in Explore Safety, otherwise off.
- **Cues** (`scene/safety/`): steam (pale) up the supply lines and along the upper header,
  condensing steam down the tubes, condensate (the Stage 7 water blue) back to the vessel, all on
  the Stage 7 pulse-tube shader (one draw call); a slow warm plume from the tubes into the pool
  (the Stage 7 streak shader, one draw call); a faint warm tint on the vessel, strongest at the
  core (one draw call). The ICS pool water is see-through; the cavity pool is unchanged.
- **Explore Safety** (`S`, panel): the same loop; opens the building (plant section) with the
  pools; Flow and Safety exclude each other (the normal power path steps aside); the camera is
  not moved; a selection keeps priority; Reset turns it off.

## Fission inset (Stage 10)

- **Story** (TECHNICAL_FACTS.md FIS-01 to FIS-07; NRC glossary, DOE-HDBK-1019/1-93), 16.0–20.5 s:
  1. A ring marks one spot on the fuel, and the microscopic view grows out of it.
  2. A neutron is absorbed by a U-235 nucleus.
  3. The excited nucleus wobbles, stretches into a dumbbell and splits into two unequal fragments.
  4. Three neutrons are released; one, slowing, reaches a second nucleus, which starts to deform
     (the chain).
  5. The fragments fly apart fast and slow down, leaving heat in the fuel along their paths.
  6. The view zooms back into the fuel spot, leaving a brief warm spot.
  7. The Stage 7 flow starts at 20.5 s, unchanged.
- **[SCHEMATIC — NOT TO SCALE / NOT EXACT NUCLEON COUNT]:** 96 spheres per nucleus, with two tones in
  the U-235 proportion. No electrons, no glowing nuclei, no radiation drawn.
- **Labels:** three small ones (U-235, neutron, energy → heat; in Lithuanian U-235, neutronas,
  energija → šiluma).
- **Architecture:** a camera-space overlay in the normal pass (`scene/fission/`): no render target, no
  post-processing, 4 draw calls. Every particle position is an analytic function of master time on
  the GPU (seeded static data, no physics, no history), so playback, seek and export agree.
- **Explore:** no Fission replay (deferred).

## Presentation build (Stage 11)

- **Portable package** (`npm run build:portable`): `dist-portable/BWRX300/` contains
  `BWRX300.html` (the whole app in one file: JS and CSS inline, one chunk, no requests),
  `START-HERE.txt` (Lithuanian, a copy of `START-HERE-LT.txt`) and `START-HERE-EN.txt`. It also
  holds `BWRX300-fallback-lt.mp4` / `BWRX300-fallback-en.mp4` when they exist in `fallback/` (the
  48 s 1080p30 H.264 presentation in each language; not in git). It opens from file:// with no
  server, Node or network. The normal build (`npm run build`, `dist/`) is unchanged.
- **Language:** Lithuanian by default; LT | EN in the setup controls (and on the failure screens),
  not while the cinematic plays. The choice is kept across quality changes and Reset, and in
  `localStorage` across reloads when the browser allows it (otherwise Lithuanian). All audience
  text is in `src/i18n/` (`strings.ts` UI, `components.ts` component names and descriptions);
  English is the approved wording. Developer diagnostics stay in English.
- **16:9 stage:** the canvas and the in-picture UI are the largest centred 16:9 rectangle in the
  window, with black bars elsewhere. 16:10 and 4:3 projectors show the authored composition; a
  1920x1080 window is filled edge to edge, pixel for pixel as before.
- **Internal-resolution guard** (`config/quality.ts`): the drawing buffer is capped at 2560x1440
  pixels on High and 1920x1080 on Low. A 4K display or high Windows scaling lowers the pixel ratio
  and the browser upscales. `?scale=0.5..1` lowers the render resolution further on a slow PC.
- **Start:** "Pradėti pristatymą" in the setup controls (bottom right; top right on small stages),
  or `→` / Space, starts the talk once "Ready"; the 48 s film is the "48 s filmas" button. Full
  screen: F11, or the Full screen button (needs a click; a refusal is ignored).
- **Portable quality:** the portable package opens in Low (`import.meta.env.MODE === 'portable'`,
  quality reason `portable`); `?quality=high` still overrides it. The normal build keeps its High
  default.
- **Failure screens:** plain words, Restart / Low quality / Reload, and "Play the backup video",
  which plays the backup video in the current language from next to the page. Technical details
  are folded.

## Presentation v1: the ~7-minute talk (`src/presentation/`)

A chapter / beat controller for the live university talk, separate from the frozen 48 s master
sequence. The story, speakers and sources are in `docs/presentation-v1-review/PRESENTATION-STORY.md`.

- **Script:** `chapters.ts` holds 12 chapters and 32 beats: Hook, Lithuania, Scale, Three facts,
  Projects, Handoff dive, Fission, Control blades, Atom to electricity, Passive safety, Limits,
  Closing. Each beat declares its camera keys, reveal, look, world targets, timed cues, overlay
  items and input lock. Target times are speaking guides; every beat waits for a key. Camera
  poses are presentation-only, and the frozen Stage 3 / Stage 6 poses are referenced by name, never
  edited.
- **Determinism:** a beat's state is a function of (the snapshot taken when it was entered, the
  resolved beat, the time since entry) on the one `animationClock`. Forward steps play the beat's
  choreography. Backward steps, jumps and R settle into it. A move whose look-at point travels more
  than 600 m uses a short dip instead of a fly-through (`runtime.ts`, `config.ts`).
- **World channels** (`world.ts`): every scalar the talk drives besides camera, reveal and look:
  flows, control, safety, water cycle, grid, plant lights and zoom, maps, comparison, pitches, fog.
  Each has a resting value. With the talk inactive everything rests, and the existing scene is
  exactly as before: the 48 s film's WebGL frames are pixel-identical.
- **Hooks into the existing scene (additive):** `setFlowSource`, `setControlSource`,
  `setSafetySource` (consulted only while the master is idle), `setBladeScram`, the fission
  shader's optional `chain` variant (legacy GLSL generated byte-identical), and
  `releaseCinematicLook`. The plant root's scale (`p.zoom`) lets the plant shrink into a point on
  a map and grow back.
- **New scene parts** (`presentation/scene/`, talk only):
  - the branching, then steady, chain fission field;
  - the condenser, hotwells and feedwater return;
  - the transformer, power line and instanced city;
  - the generic large unit and the BWRX-300 row;
  - the Lithuania and North Atlantic map tables from Natural Earth (public domain): countries via
    world-atlas 2.0.2 (ISC), lakes from ne_50m_lakes, inlined in `data/geo.ts`;
  - the 9,800 m² area-equivalent rectangle and the 105 x 68 m pitch in a schematic stadium.
- **Copy and sources:** `copy.ts` holds the LT (default) and EN on-screen text; a key missing in
  either language fails the type check. `sources.ts` holds every public number with its
  organization, document, date, what it supports and its status (OFFICIAL / VENDOR / DERIVED /
  ILLUSTRATIVE).
- **Design system:** `design.ts` holds the type scale, colours and motion. The overlay gets them
  as CSS variables; sizes are stage-relative with pixel floors for small print.
- **People and link:** `config.ts` holds both presenters' names and e-mails and the public Pages URL;
  `qrCode.ts` encodes that URL (version 4-M, verified by decoding). No presenter likenesses.
- **Final stage:** the 12-chapter script is timed to `docs/final/FINAL_SPEECH_LT.md` (cue sheet
  `docs/final/PRESENTER_CUES_LT.md`, every on-screen claim in `docs/final/FACT_AUDIT.md`, report
  `docs/final/FINAL-REPORT.md`).
- **Automation** (`?debug`): `window.__bwrx.talk` exposes `outline()`, `state()`, `world()`,
  `cues()`, `start()`, `next()`, `prev()`, `home()`, `reset()`, `exit()`, `jump(flat, mode)`,
  `find(chapter, beat)`, `stops()`, `jumpStop(stop, mode)`, `probe()` (ground ownership and
  grade-marker error) and `previewPose(pose)`.

## Architecture notes

- **Units:** 1 world unit = 1 metre.
- **Quality:** `src/config/quality.ts` is the only place presets are defined. Components
  read preset *fields* via `useQualityPreset()` and never branch on the level name.
  A quality change remounts the canvas (MSAA is fixed at context creation). The camera
  pose survives the remount.
- **Camera authority:** `src/camera/cameraDirector.ts`. Exactly one authority moves the
  camera at a time: `explore` (OrbitControls), `transition` (GSAP tween), or `cinematic`
  (a shot's pose source; the Stage 3 hero shot now, Stage 6 later). They write a plain
  pose object, and the director applies it once per frame. Handing back to OrbitControls
  syncs its target, so nothing jumps.
- **Draw order and shadows:** `src/scene/section/drawOrder.ts` draws the nested reveal layers
  inside-out, front to back (the opened plant otherwise overdraws heavily); while the vessel is
  only partly open its shell draws before the internals it hides. The 240 fuel
  instances are kept sorted from the camera. The shadow map is re-rendered only on frames where
  a section plane moves (`RevealDriver`): the key light and casters are otherwise static.
- **Deterministic time:** `src/animation/clock.ts`. GSAP is driven from the R3F frame
  loop rather than its own rAF. Setting `animationClock.fixedStep = 1/30` makes every
  frame advance exactly one video frame (for the Stage 12 H.264 export).
- **Camera states:** data in `src/config/camera.ts`, with the review pairings in
  `src/config/reviewViews.ts`. The `?debug` panel has a "Copy pose" button that produces
  a new entry.
- **Failure paths:** WebGL 2 probe before mount, an app error boundary (restart / restart
  low / reload), `SafeLayer` for optional visuals, and automatic rebuild on a lost GPU
  context (with a retry budget, then a manual overlay).
  `<html data-scene-status>` exposes `loading | ready | context-lost | error`.
- **Offline:** no CDN, web-font or HDR requests. The studio lighting environment is
  procedural. `dist/` uses relative asset paths. Note that browsers block ES modules
  over `file://`, so serve `dist/` (`npm run preview` or any static server) until the
  single-file offline build (Stage 11/12) exists.
