# BWRX-300 Interactive 3D Module: full project context (for an external AI assistant)

Snapshot date: **2026-10-17**. Repository: `viesoji_komunikacija/` (local git, branch `main`).
Purpose of this file: give another model (GPT, Codex, …) enough context to discuss, review or extend the
project **without reading the code**: what exists, how every animation works, which functions own what,
what is unfinished, and where the weak spots are. File paths are relative to `src/` unless they start
with a top-level folder.

---

## 0. How to use this file

- Sections 1–4: what the project is, its status, the stack, the architecture rules.
- Section 5: the 48-second cinematic, second by second (the single most important table).
- Section 6: every animation subsystem with its functions, data and shaders.
- Sections 7–10: Explore mode, rendering, delivery, debug/validation.
- Section 11: scientific basis and what is official vs approximate.
- Sections 12–14: built / not built, strengths, flaws and improvement ideas (prioritised).
- Section 15: the rules any proposed change must respect, and the recipe for adding an effect.

---

## 1. The project in one paragraph

A standalone **interactive WebGL 2 visualization of the GE Vernova Hitachi BWRX-300 small modular
reactor** (a 300 MWe / 870 MWth direct-cycle boiling-water reactor), built for a **~7-minute
university public-speaking talk (VILNIUS TECH, two presenters, delivered in Lithuanian)**. The
module fills about 48 s of that talk. It has two uses:

1. **Presentation mode**: a deterministic 48 s cinematic (camera, cutaways, flow, control blades,
   passive cooling, a microscopic fission inset) started with Space; no interaction needed.
2. **Explore mode**: a mouse-driven 3D viewer (orbit, cursor zoom, pan, click-to-select-and-focus,
   X-ray, section slider, isolate, labels, Flow / Control / Safety modes).

Design target: "Apple made an interactive documentary about a real nuclear reactor" — dark studio
look, one warm accent colour (`#e8a33d`), minimal UI, no sci-fi glow, technically defensible.
Hardware target: an **unknown low-power Windows lectern PC** with integrated graphics; the **Low
quality preset is the presentation-safe reference**. Everything is procedural code geometry (no
Blender/GLB assets, no textures beyond generated ones, no network at runtime).

The audience (students with no nuclear background) must leave with four ideas:
1. The reactor makes **heat**, not electricity.
2. Heat boils water → steam spins a turbine → the turbine drives a generator.
3. The chain reaction is controlled by **neutron-absorbing control blades**.
4. The BWRX-300 uses **natural circulation** and **passive heat removal** (isolation condensers).

---

## 2. Status snapshot

Work is done in numbered **stages**; each ends with a review folder `docs/stageN-review/` (1080p
stills, a video, a `REPORT.md`, validation JSON) and is committed as "Stage N: … (approved)" only
after the owner approves it visually.

| Stage | Content | State |
|---|---|---|
| 1 | Renderer foundation (Vite/React/R3F, WebGL2 probe, quality presets, lighting, error handling) | committed `280da5b` |
| 2 | Plant massing (site, reactor building + 36 m shaft, containment, turbine hall, steam line) | committed `4fe2e54` |
| 3 | 10 s hero shot: exterior → ground cut → shaft → containment → RPV (the visual benchmark) | committed `d8536a0` — **frozen** |
| 4 | Reactor pressure vessel + internals (240 fuel bundles, 57 blades, shroud, chimney, separators, dryer) | committed `37470cb` |
| 5 | Explore interaction architecture (registry, picking, hover/select/focus, X-ray, section, isolate, labels) | committed `f6a35fc` |
| 6 | 48 s master timeline skeleton (beats, events, camera keys, reveal tracks, look cues) | committed `68466c1` — timing/camera **frozen** |
| – | Explore navigation polish (cursor zoom, pan, double-click pivot, below-grade bounds) | committed `42f66c9` |
| 7 | Normal operating flow (natural circulation, steam line, turbine, generator, electricity) | committed `a0f2562` |
| 8 | Reactor control (blade insertion + abstract reaction cue) | committed `ca087dc` |
| 9 | Passive safety: isolation condenser loop + shutdown handoff + decay-heat tint | committed `8315c2d` |
| 10 | Fission inset (camera-space microscopic view, 16.0–20.5 s) | committed `5244e10` |
| 11 | Presentation build: 16:9 letterbox stage, render-pixel budget, gated Space/Home start, failure screens + backup video, single-file portable offline build; micro-polish (Low under Windows scaling); **LT/EN localization** | **implemented, NOT committed** (see below) |
| 12 | Narration, deck integration, USB/Drive packaging, rehearsal on the real PC | **not started** (must not start until the owner asks) |

**Stage 11 detail (as of this snapshot):**
- Core Stage 11 and the Low-scaling micro-polish: done and reported (`docs/stage11-review/STAGE11-REPORT.md`).
- Localization code: done (`src/i18n/`, `ui/LanguageToggle.tsx`, per-language backup video names in
  `config/delivery.ts`, `portable/START-HERE-LT.txt` / `-EN.txt`, localized fission labels). Typecheck,
  lint and production build pass.
- Localization delivery: the Lithuanian 48 s backup video now exists (`fallback/BWRX300-fallback-lt.mp4`,
  rendered 2026-10-17) and `dist-portable/BWRX300/` was rebuilt with both videos and the LT/EN
  instructions, followed by a portable validation run. Still **not in `docs/stage11-review/`**: the
  Lithuanian review video, LT stills, the LT/EN comparison sheet and the localization section of the
  Stage 11 report. Owner review is pending.
- 26 tracked files modified + several new folders are uncommitted (no commit since Stage 10).

---

## 3. Stack, constraints, repository map

**Stack:** Vite 8 · React 19.3 · TypeScript 6 · three r186 · @react-three/fiber 9 · drei 10 (only
`ContactShadows`) · GSAP 3 (ticked manually) · zustand 5. No other runtime dependencies.
Scripts: `npm run dev` · `npm run check` (tsc + eslint + build) · `npm run build:portable`.

**Hard constraints:** WebGL 2 only (no WebGPU); no CDN, web fonts, HDR downloads or any runtime
network request; no post-processing pass (no bloom, no SSAO); no additive glow; Low preset must hold
~60 fps on Intel Iris Plus at 1920×1080; deterministic cinematic (seek = playback = video export).

```
PROJECT.md            master specification (goals, story, visual direction, stages)
DEVELOPMENT_RULES.md  validation policy: FAST vs FULL profiles, determinism/perf rules, report format
ARCHITECTURE.md       compact file → responsibility map, frozen subsystems
README.md             user-facing docs: keys, URL params, per-stage behaviour notes
references/TECHNICAL_FACTS.md  verified facts with page refs (GD Rev J, DOE handbook, NRC)
references/technical/*.pdf     official GE Vernova Hitachi documents (local only, git-ignored)
docs/stageN-review/   per-stage reports, stills, videos, validation JSON
portable/             START-HERE-LT.txt / START-HERE-EN.txt for the USB package
fallback/             backup MP4s (git-ignored build inputs)
build-tools/portableSingleFile.ts + vite.portable.config.ts   single-file offline build
src/
  animation/  time-based state: clock, master sequence, hero shot, reveal, flow, control, safety, fission
  camera/     camera director (authority), monotone camera paths, orbit controls, Explore bounds
  config/     ALL tunable data: timing, camera poses, quality presets, flow/control/safety/fission looks
  scene/      R3F scene: plant/, rpv/, section/ (cut engine), flow/, control/, safety/, fission/
  interaction/ Explore store, actions, visuals (uniform-driven highlight/X-ray), picking, labels
  i18n/       LT/EN strings + component names (typed contract)
  ui/         setup bar, Explore panel, overlays, status/failure screens, styles.css
  app/        App shell, error boundary, keyboard shortcuts
  debug/      `window.__bwrx` automation API, diagnostics overlay, frame probe (dev / ?debug only)
  state/store.ts  app store: quality, scene status, canvas key, debug flags
```

Size: ~13.1k lines of TS/TSX/CSS in `src/`. Production bundle: one ~907 kB main chunk (259 kB gzip)
plus lazy debug chunks; the portable `BWRX300.html` is ~1.44 MB with everything inlined.

---

## 4. Architecture principles (the "laws" of this codebase)

1. **Everything in the presentation is a pure function of master time `t` (0–48 s).** No effect
   keeps history or integrates per frame during the cinematic. Hence `seek(t)` shows exactly the frame
   playback shows, restart is exact, and a fixed-step (1/30 s) render produces a frame-accurate video.
2. **One animation clock** (`animation/clock.ts`). GSAP's own rAF ticker is removed; GSAP is advanced
   from the R3F frame loop. `animationClock.fixedStep = 1/30` makes every rendered frame advance exactly
   one video frame (used for the MP4 export).
3. **One camera authority at a time** (`camera/cameraDirector.ts`): `explore` (OrbitControls),
   `transition` (a GSAP tween of a plain pose object), or `cinematic` (a pose source function evaluated
   every frame). Handing back to Explore syncs OrbitControls' target, so nothing jumps.
4. **One reveal state** (`animation/heroReveal.ts`, 9 numbers 0..1) and **one section engine**
   (`scene/section/sectionLayers.ts → applyReveal`). The hero shot, the master sequence, Explore's
   section slider and the review states all write the same object; one function turns it into clip
   planes, layer uniforms and interior visibility.
5. **Data-driven everything**: timing, camera poses, reveal tracks, look cues, flow keys, colours and
   sizes live in `config/*.ts`. Scene components own no timing.
6. **One component registry** (`scene/components.ts`): every selectable part has an ID (= the scene
   object's `name`), label, one-sentence description, parent, focus camera pose, tier, provenance and
   behaviour flags. Adding a part is configuration, not new interaction code.
7. **Quality is centralized** (`config/quality.ts`). Components read preset *fields*
   (`particlesMultiplier`, `shadows`, `geometryLod`…), never the level name.
8. **Per-frame order is fixed by `useFrame` priorities** (lower runs first):
   `-100` FrameDriver (advance clock → GSAP → camera director) · `-99` FrameProbe (debug) ·
   `-95` ControlDriver, SafetyDriver, ExploreDriver (state for this frame) · `-90` RevealDriver
   (section planes, interior visibility, shadow-map dirty flag) · `-80` effect layers (vessel flow,
   power flow, shaft, core activity, ICS flow, decay heat, fission inset) · `0` blade/fuel instanced
   meshes and render.
9. **Effects never live inside the plant hierarchy.** Flow, glints, ICS cues and the fission inset are
   mounted beside the plant, so picking and highlighting never see them; each draws nothing (mesh
   `visible = false`) while its intensity is 0.
10. **Provenance on every number**: `[GD]` official General Description Rev J, `[NEDO]` older UK GDA
    doc, `[APPROX]` educational approximation, `[EDUCATIONAL REPRESENTATIVE MOTION]` etc.

---

## 5. The 48-second master timeline (config/masterSequence.ts, config/heroShot.ts)

### 5.1 Beats (what the audience should take away)

| Time (s) | Beat id | Takeaway (stored in code for narration writing) |
|---|---|---|
| 0–1.5 | exterior | A complete power station. |
| 1.5–3.4 | approach | The reactor building beside the turbine hall. |
| 3.4–5.8 | belowGrade | The building continues ~36 m underground (ground cuts away). |
| 5.8–7.6 | containment | A containment vessel inside the shaft. |
| 7.6–10 | rpvHero | The reactor pressure vessel. |
| 10–16 | core | The vessel cut opens; this is where the nuclear heat is produced. |
| 16–20.5 | fission | Fission in the fuel releases heat (microscopic inset). |
| 20.5–29 | flow | Water boils in the core; mixture rises through the chimney; separators and dryer leave dry steam. |
| 29–36.5 | turbine | Steam turns the turbine, which drives the generator: electricity. |
| 36.5–41.5 | control | Control blades between the fuel set the reactor power. |
| 41.5–46 | safety | Isolation condensers in pools above the reactor cool it without pumps or operators. |
| 46–48 | finalPullback | The whole plant again: a stable end frame (held until R / Space / Home). |

0–10 s **is** the approved Stage 3 hero shot (same camera keys, same GSAP reveal builder), byte-identical.

### 5.2 Semantic events (`MASTER_EVENTS`, seconds) — effects anchor here, never on camera keys

`coreReveal 12.4` · `fissionEnter 16.0` · `fissionExit 20.5` · `flowCore 20.5` · `flowChimney 22.4` ·
`flowSeparators 24.3` · `flowDryer 26.0` · `steamExit 27.6` · `steamToTurbine 29.0` · `turbine 32.2` ·
`generator 34.0` · `electricityOut 35.4` · `controlEnter 36.5` · `controlAction 39.2` ·
`controlExit 41.5` · `safetyEnter 41.5` · `isolationCondenser 44.6` · `safetyExit 46.0` ·
`finalPullback 46.0` · `sequenceComplete 48.0`.

### 5.3 Camera keys (poses are data in `config/camera.ts`; all fov 35°)

Hero shot: `0 stage3Exterior` → `1.5 stage3ExteriorPush` → `3.4 stage3Approach` → `5.8 stage3BelowGrade`
→ `7.6 stage3Containment` → `10 stage3RPVHero`.
Master continuation: `12.8 masterVesselOpen` → `15.4 masterCore` → `20.5 masterCoreHold` →
`22.6 masterArchitecture` → `24.8 masterSeparators` → `26.6 steamRegionCloseup` → `28.4 masterSteamExit`
→ `30.8 masterSteamLine` → `32.6 masterTurbine` → `35.0 masterGenerator` → `37.3 masterReturn` →
`39.1 masterBlades` → `41.2 masterBladesHold` → `42.4 masterSafetyExit` → `43.5 masterSafetyRise` →
`44.6 masterSafety` → `46.0 masterSafetyHold` → `48 masterFinal`.

### 5.4 Reveal tracks (fields of `HeroRevealState`, eases are GSAP names)

| Field | Hero shot (0–10 s) | Master (after 10 s) |
|---|---|---|
| exteriorDim | 0→1 @2.9 for 2.4 s | 1→0.25 @30.2 (turbine chapter context back), 0.25→1 @36.6 |
| groundCut | 0→1 @3.3 for 2.5 s (power3.out) | – |
| shaftReveal | 0→1 @5.6 for 1.9 s | – |
| containmentReveal | 0→1 @7.3 for 1.65 s | – |
| rpvEmphasis | 0→1 @8.0 for 1.6 s | 1→0.4 @11.0, 0.4→1 @44.0 |
| vesselCut | – | 0→1 @10.5 for 2.0 s; 1→0 @43.4 for 1.6 s |
| bladeEmphasis | – | 0→1 @38.3, 1→0 @41.6 (copper accent on blades) |
| poolsReveal | – | 0→1 @41.6 (instant, while off screen) |
| coreSection | – | (only used by review states / Explore) |

### 5.5 Look cues (`MASTER_LOOK`, applied without easing through Explore's uniform system)

- **Subjects** (lift + faint warm rim, weight fades in/out): core 12.0–22.6 · chimney 21.6–24.6 ·
  separators 23.6–26.4 · dryer 25.4–28.2 · steam nozzle 27.0–30.0 · main steam line 28.6–33.4 ·
  turbine 31.6–35.2 · generator 33.4–36.8 · ICS pools 42.6–47.2 (weight 1.6).
- **Context dim** (everything else steps back): 0 until 12 s, 0.55 during 13.4–28.6, 0 during the
  turbine chapter, 0.45–0.5 during control/safety, back to 0 by 47.4 s.
- **Ghosts**: turbine hall turns X-ray (ordered dither) 30.4–36.5 s.
- **Interior windows**: main steam line drawn 18.0–38.6 s (switched while off screen).

### 5.6 Effect windows inside the timeline (details in §6)

| Window | Effect |
|---|---|
| 16.0–20.5 | Fission inset (iris opens from a fuel spot, neutron → U-235 → split → heat → closes) |
| 20.5–36.5 | Stage 7 flow: core water → chimney mixture → separators → dryer → steam outlet → steam line → turbine → shaft turns → electricity |
| 37.6–43.4 | Core water + downcomer return come back at 0.4 / 0.3 (control beat); boiling follows the reaction cue |
| 37.6–42.7 | Activity glints on the cut fuel faces (reaction cue) |
| 38.9–40.6 | Blade insertion (smootherstep, every blade +0.5 of stroke) |
| 41.5–42.4 | Shutdown handoff: reaction cue 0.3 → 0.05; boiling stays at residual (decay heat) |
| 42.2–48 | Decay-heat tint on the vessel; ICS steam front 42.7–44.2; condensing 44.1–44.9; condensate return 44.8–45.9; pool plume from 44.3; loop at 70 % in the final pullback |

---

## 6. Animation subsystems: functions, data, shaders

### 6.1 Clock — `animation/clock.ts`
```ts
animationClock = { time, fixedStep: number|null, lastStep, advance(realDelta) }
```
`advance` clamps real steps to ≤ 1/15 s (a backgrounded tab does not jump tweens), or uses `fixedStep`,
then calls `gsap.updateRoot(time)`. Explore-only easing (`approach(value, target, rate, dt)`, exponential)
uses `lastStep`; the presentation never eases per frame.

### 6.2 Key evaluation — `animation/keys.ts`
`keyed(keys: [time, value][], t)` → smootherstep between keys, clamped at ends. Used by flow, control,
safety and (a private copy) the master look. Every presentation state also **quantises master time to
1 µs** (`Math.round(t*1e6)/1e6`) because GSAP stores timeline time to 1e-7 s and playback vs seek can
differ by one step.

### 6.3 Reveal — `animation/heroReveal.ts`, `animation/revealTimeline.ts`, `scene/section/sectionLayers.ts`
- `HeroRevealState`: `groundCut, exteriorDim, shaftReveal, containmentReveal, rpvEmphasis, vesselCut,
  coreSection, bladeEmphasis, poolsReveal` (all 0..1). `heroReveal` is the live object; `resetHeroReveal()`.
- `buildRevealTimeline(tracks, duration, onComplete, onUpdate?)`: a paused GSAP timeline, one `fromTo`
  per property, each starting from the closed state (throws otherwise).
- `createTrackOverlay(tracks, base)`: later tracks (several per property allowed) evaluated as a **pure
  function of time** and written over the timeline's values. Exists because a GSAP timeline holding
  several tweens of the same property breaks under backward seeks. Values rounded to 1e-6 like GSAP.
- `applyReveal(state | null)` (called every frame at −90 by `RevealDriver`): sets 4 section boxes ×
  5 clip planes (ground, building, containment, vessel; plane count never changes → no recompiles),
  per-layer uniforms (surface multiplier, cap multiplier, fill light, accent rim, back-glow, cap tint),
  the grade-datum line, and interior visibility levels (`belowGrade, building, vessel, reactor,
  turbineHall, steamPath, pools`). `null` = the Stage 2 static section review.
- Cut geometry: ground = excavation box x −40..20, z 0..84, floor −36; building/containment planes
  sweep along measured stations (`cutPath.ts`) to z = 0; vessel cutaway removes the quadrant x<0, z>0
  (growing from the flange edge); `coreSection` adds a horizontal step at mid-core.
- `sectionPlanesChanged()` → the shadow map re-renders only on frames where a plane moved.

### 6.4 Camera — `config/camera.ts`, `camera/cameraPath.ts`, `camera/cameraDirector.ts`
- `CameraPose = { position: [x,y,z], target: [x,y,z], fov }`; 38 named states (`CAMERA_STATES`).
  Home = `plantExterior` `[-95,64,150] → [36,5,-8]`.
- `new CameraPath(keys: {time, pose}[]).evaluate(t, out)`: 7 channels (target xyz, **log radius**,
  polar angle, unwrapped azimuth, fov), each a **monotone cubic (PCHIP / Fritsch–Butland)**: continuous
  velocity through keys, no overshoot, zero velocity at both ends, no roll. The camera orbits its moving
  target instead of cutting straight through the subject.
- `interpolatePose(from, to, t, out, targetT?)`: the same orbit-style interpolation for one transition.
- `cameraDirector`:
  - `snapTo(pose|id)`, `transitionTo(pose|id, {duration, ease, exitRadius, path:'orbit'|'linear'}) → Promise`,
    `reset()` (to home; `exitRadius` backs the camera out of the cut first), `interrupt()` (user grabs
    the view mid-transition),
  - `beginCinematic(source, onLost)`, `endCinematic()`, `update()` (once per frame),
  - Explore navigation: `wheelZoom(scale, anchor)` (cursor-anchored, eased over frames, re-seats the orbit
    target at the depth under the pointer), `pivotTo(point)` (double-click retarget, 0.35 s linear turn),
  - Limits by cut context (`exploreBounds.ts`): closed plant → camera above y 0.5, target in a box above
    grade; plant fully cut → camera may enter the excavation down to y −35, look up ~29°, come to 2.5 m,
    but never behind the cut plane (`keepCameraInCut`); limits that would snap the view are relaxed to the
    current pose.
  - Survives canvas remounts (quality change, context loss) by parking the pose.
- `CAMERA_TRANSITION = 1.4 s power2.inOut`; Explore focus moves are 1.1 s.

### 6.5 Hero shot (Stage 3, frozen) — `animation/heroShot.ts`, `config/heroShot.ts`
`heroShot.play() / seek(t) / togglePause() / stop() / closeReveal(duration, delay)`. Dev/`?debug` keys
P/K. `closeReveal` animates the reveal closed in step with a reset camera (ground refills last).

### 6.6 Master sequence controller (Stage 6) — `animation/masterSequence.ts`
```ts
masterSequence.play()            // restart from 0
masterSequence.seek(t)           // exact frame at t, paused
masterSequence.togglePause()     // Space: pause/resume; from idle or finished → play from 0
masterSequence.step(frames)      // ±1/30 s, paused (debug , .)
masterSequence.jumpBeat(±1) / jumpToBeat(id)   // debug [ ]
masterSequence.stop()            // hand camera to Explore (Reset does this)
masterSequence.subscribe(fn)     // signals: {event,id,time} | {seek,time} | {status}
masterSequence.time / status ('idle'|'playing'|'paused'|'finished') / beat
masterCameraAt(t, out), masterLookAt(t), masterBeatAt(t), masterTimings()   // all pure
```
`start(time, play)` stops every other camera/reveal owner (hero shot, review states, section review),
suspends Explore, resets the reveal, force-renders the GSAP timeline at `time`, applies the overlay,
installs the look and the camera source. At 48 s it **holds the final frame** under cinematic authority
(`finished`) until R / Space / Home. Effects must *pull* `masterSequence.time` and use events only for
one-shot cues.

Production entry points (`animation/presentation.ts`): `startPresentation()` (Home / Start button),
`startOrTogglePresentation()` (Space) — both ignored until `status === 'ready'`; `resetPresentation()`
(R) stops everything, clears Explore, snaps control/safety off, closes the reveal and flies home (from
below grade it exits through the cut first).

### 6.7 Cinematic look — `interaction/exploreVisuals.ts`
`setCinematicLook(() => CinematicLook | null)`, where `CinematicLook = { subjects: Map<id, w>,
ghosts: Map<id, w>, contextDim, interior }`. While a presentation owns the scene, the look is applied
**without easing** (seek-exact) through the same per-component uniforms Explore uses: subject lift 0.07,
rim 0.32, context dim up to 0.35 (vs. an interactive selection: lift 0.12, rim 0.95). Ghosts use the
X-ray ordered dither.

### 6.8 Normal operating flow (Stage 7) — `animation/operatingFlow.ts`, `config/flow.ts`, `scene/flow/*`
**State** (`FlowState`): `source ('off'|'presentation'|'explore'), time, intensity[11 channels], boil,
boilShare, mainSteamFront (m), turbineFront (m), electricityFront (m), shaftAngle (rad)`.
- `presentationFlowAt(t)` — pure: channel intensities from keys anchored on events (subject of the moment
  brightest, already-explained parts stay quieter), fronts `= max(0, (t − start) · speed)`, shaft angle
  integrated analytically with a 1.2 s ramp (0.75 rev/s, slowed: real 50–60 rev/s would alias at 30 fps).
- `exploreFlowAt(t, selection)` — steady loop at 0.9 (0.6 with a selection, 0.35 isolated), fronts ∞.
- `flowForFrame()` — master if it owns the scene, else Explore Flow if on, else off.
- `boilShare = max(reactionIntensity, residualBoil 0.3)`: boiling follows the Stage 8 reaction cue.

**Channels:** vessel `coreWater, chimneyMixture, downcomerWater, separatorWater, separatorSteam,
drySteam, steamOutlet`; power `mainSteam, turbine, generator (keyed but nothing reads it), electricity`.

**Rendering:**
- `VesselFlow.tsx` — **one instanced draw call** for every vessel particle (High: 436 streamlines,
  2,400 particles; Low: 35 % of the streamlines). Streamlines (`flowPaths.ts`, seeded mulberry32) are
  baked into a float texture, 64 samples per path at **equal time steps** (sample spacing encodes speed);
  the vertex shader places each particle at `fract(seed + time / duration)`, orients a camera-facing
  quad along the flow, sizes it by phase (`w`: 0 water, 1 mixture, 2 wet steam, 3 dry steam) and
  collapses it if it lies in the removed vessel quadrant. Water = cyan-blue comet streaks; mixture =
  streaks turning into pale bubbles; steam = pale, wide, soft, faster; droplets caught in the dryer.
  Core and downcomer streams are drawn **at the cut faces** (`face` clip), volumes behind the cut
  (`volume` clip), so upward (centre) and downward (outer) flow never overlap on screen.
- `PowerFlow.tsx` — **pulse tubes**: tube sleeves around the steam line, the turbine casings (HP inlet →
  exhaust, then each double-flow LP from its middle outwards) and the electricity path; soft pulses travel
  behind an advancing **front**, so a line lights up only where steam/power has reached. 2 draw calls.
- `ShaftCouplings.tsx` — only the shaft couplings rotate (`rotation.x = shaftAngle`), never casings.
- Blending is normal (never additive), depth-tested, tone-mapped.

### 6.9 Reactor control (Stage 8) — `animation/reactorControl.ts`, `config/control.ts`, `scene/control/*`, `scene/rpv/coreLayout.ts`
**State**: `bladeControlAmount (0 base pattern … 1 deeper), reactionIntensity, activity, emphasis`.
- `presentationControlAt(t)` — pure: `amount = smootherstep(t, 38.9, 40.6)`;
  `reaction = 1 − 0.7·amount` (1 → 0.3), then the **shutdown handoff** blends it to 0.05 over
  41.5–42.4 s; activity fades in at 37.6 and out at 41.9–42.7.
- `advanceControl(dt)` (ControlDriver, −95): master state while presenting; otherwise Explore Control
  eases toward the slider (rate 5/s); off → blades ease back to base.
- `reactionFor(amount)`, `snapControlToBase()`, `controlForFrame()`.
- **Blades**: base pattern = Stage 4 "operating" (48 blades withdrawn, 9 at 0.35). Target = every blade
  `base + 0.5` (half stroke, 1.9 m; 48 → 0.5, 9 → 0.85; none fully in). Because the shift is shared,
  the motion is **one rigid translation of the instanced batch** (`mesh.position.y = lift · BLADE.length`)
  — no per-frame instance-matrix upload (important on Intel iGPUs).
- **Reaction cue** (`activityMaterial.ts`, 1 draw call, 560 slots on High): short warm-white glints on the
  fuel faces exposed by the quarter cut, behind the blade wings; each slot flashes for 0.34 s once per
  seeded 0.8–1.5 s period at a hashed place; the share of slots that flash = reaction intensity; glints
  below a blade's absorber tip are suppressed to 15 %. Pure function of the cue clock.
- Labelled in code as `[EDUCATIONAL REPRESENTATIVE MOTION]`: the GD publishes no rod sequence; the move
  is time-compressed (real power changes run at 0.5–2 %/min); the cue is not MW, not %, not kinetics.

### 6.10 Passive safety (Stage 9) — `animation/passiveSafety.ts`, `config/safety.ts`, `scene/safety/*`
**State**: `intensity{icsSteam, icsCondensing, icsCondensate, poolHeat, decayHeat}, steamFront,
condensingFront, condensateFront` (fronts 0..1 along each route).
- `presentationSafetyAt(t)` — pure; fronts from windows (steam 42.7–44.2, condensing 44.1–44.9,
  condensate 44.8–45.9); intensities hold then drop to 70 % in the final pullback; `decayHeatEarly`
  raises the vessel tint during the shutdown handoff.
- `advanceSafety(dt)` (SafetyDriver, −95): Explore Safety **replays the same schedule** from the moment
  the toggle turns on, then holds at full; clock wrapped at 1200 s for float precision.
- Geometry (`icsLayout.ts`, `IcsEquipment.tsx`): 3 trains, each an IC heat exchanger (upper header, 2×9
  vertical tubes, lower header) in its own pool above the containment; steam riser from the RPV steam
  outlet level (h 24.2 m), condensate return into the chimney region (h 16.2 m); layout `[APPROX]`.
- Cues (`PassiveSafety.tsx`): ICS loop on the **Stage 7 pulse-tube shader** (1 draw call); warm plume
  rising from the tubes into the pool on the **Stage 7 streak shader** (1 draw call); faint warm
  decay-heat tint on a sleeve around the RPV, strongest at the core (1 draw call, `decayHeatMaterial.ts`).
  ICS pool water is see-through (opacity 0.5). The turbine path stays off: nothing here makes electricity.

### 6.11 Fission inset (Stage 10) — `animation/fissionInset.ts`, `config/fission.ts`, `scene/fission/*`
A **camera-space overlay in the normal render pass** (renderOrder 900–903, no render target, no
post-processing, 4 draw calls). τ = t − 16.0 s (0 … 4.5 s).

| τ (s) | What happens |
|---|---|
| 0–0.5 | A ring marks a spot on the cut fuel face (`FISSION_ANCHOR`, projected each frame so it follows the camera) |
| 0.15–0.75 | Iris opens from that spot; the micro view zooms out of it (zoom 0.035 → 1) over a 0.94-opacity dark backdrop |
| 0.45–1.2 | Incoming neutron crosses the view and is absorbed by the U-235 nucleus |
| 1.2–2.0 | Excited compound nucleus wobbles (4.5 Hz), stretches into a dumbbell with a thinning neck |
| 2.0 | Split into two unequal fragments (40 : 60 by sphere count, ≈ 95 : 140 mass) with equal momentum and drag; three neutrons released |
| 2.1–3.6 | Heat sprites along the fragment paths (energy → heat) |
| 2.95–3.9 | One released neutron reaches a second nucleus, which starts to deform (the chain) |
| 3.65–4.42 | View zooms back into the fuel spot; nuclei fade; heat shrinks to a small warm spot, then fades |

- `fissionAt(t)` gives frame-level values (`marker, zoom, iris, backdrop, particles, heat, labels[]`);
  **every particle position is an analytic GLSL function of τ** (`fissionShaders.ts`: `nucleon()`,
  `fragmentA()`, `neutron()`, `travel()` with exponential drag) — no physics, no history.
- Nuclei: 96 seeded packed spheres each (not 235), two tones in the U-235 proportion 92 : 143.
  Labelled `[SCHEMATIC — NOT TO SCALE / NOT EXACT NUCLEON COUNT]`. No electrons, no gamma, no glow.
- Three labels from a canvas atlas: `U-235`, `neutron`/`neutronas`, `energy → heat`/`energija → šiluma`;
  a language switch repaints the atlas without rebuilding.
- Not available in Explore (deferred).

---

## 7. Explore mode (Stage 5 + polish)

- **Store** (`interaction/exploreStore.ts`, zustand): `mode ('explore'|'presentation'), hoveredId,
  selectedId, focusId, isolate, xray, section {on, context 'plant'|'reactor', position}, labels, flow,
  control, controlAmount, safety`. Invariants enforced only in `exploreActions.ts` (isolate needs a
  selection; Flow and Safety exclude each other; nothing acts in `presentation` mode).
- **Actions**: `select(id, {focus, immediate})`, `focus(id)` (opens the cut a pose needs, then a 1.1 s
  transition), `setXray`, `setIsolate`, `setLabels`, `setFlow`, `setControl` (opens Reactor section and
  frames the blades), `setControlAmount`, `setSafety` (opens the plant section with pools, turns Flow off,
  leaves the camera), `setSection` / `toggleSection` / `setSectionContext`, `revealForSection(s)`
  (plant slider scrubs ground → shaft → containment; reactor slider scrubs the vessel cut),
  `suspendForPresentation()`, `resumeAfterPresentation()`, `resetExplore()`.
- **Picking** (`picking.ts`): one raycast per pointer move or camera rest; skips cut-away and ghosted
  hits; instanced fuel/blades resolve to their group; a 0.3 s single-click delay so a double-click
  (pivot) never selects.
- **Visuals** (`exploreVisuals.ts`): each component gets cloned materials with the same shader program
  (no recompiles); hover / selection / isolation / X-ray are eased uniform writes that go idle when
  settled. X-ray and isolation use an **ordered-dither discard** (no blending, no sorting artifacts).
- **Labels** (`labelLayer.ts`, `ui/ExploreOverlay.tsx`): one HTML label (name + one sentence) anchored to
  the selection's bounds, clamped on screen; hover shows the name only. Localized via `i18n/components.ts`.
- **Keys** (matched by `event.code`, so they work on the Lithuanian layout): Space start/pause, Home
  restart, R reset, Esc clear, X X-ray, C section, I isolate, L labels, F flow, O control, S safety,
  1/2 High/Low (ignored while playing). Debug-only: `` ` `` P K V G B , . [ ].
- 30 registry components: the plant root + 10 plant parts (site, reactor building, shaft, containment,
  steam line, turbine hall, turbine, generator, ICS pools, support buildings) and the RPV + 18 parts
  (upper head, shell, bottom head, steam nozzle, CRDs, core, fuel, blades, core plate, top guide, shroud,
  shroud support, guide tubes, chimney, chimney head, separators, dryer, downcomer).

---

## 8. Rendering details

- **Section engine** (`sectionShader.ts`): `MeshStandardMaterial` + `onBeforeCompile` injections, three
  cached variants (dim only / layer / cap). Cut surfaces in **one pass, no stencil**: back faces seen
  through a cut are shaded as the flat cut surface (earth strata, concrete, steel poché, accent grade
  datum). Works because section solids never share faces (`SECTION_INSET`, `ON_GRADE` rules).
- **Draw order** (`drawOrder.ts`): opaque sort inside-out then front-to-back by reveal layer (cuts
  overdraw a lot otherwise); 240 fuel instances re-sorted by camera distance when the camera moves.
- **Lighting**: hemisphere fill, warm-neutral key (the only shadow caster, PCF 2048 on High), rim;
  procedural studio IBL cube (rendered once; no HDR files); Khronos PBR Neutral tone mapping; fog hides
  the horizon. Low: no realtime shadows, one baked `ContactShadows`, 64 px environment.
- **Shadows** update only when a section plane moved or interior visibility changed.
- **ReadyGate**: compiles every shader, including hidden interior content (`compileAsync` with all
  objects made visible), renders one warm-up frame, waits 3 presented frames, then sets `ready`.
  Result: no shader compile during playback (programs constant through a 10-playback soak).
- **Budgets measured** (Iris Plus, 1920×1080): 50–81 draw calls, ≤ 70k triangles; **fill-bound**.
  Low ≈ 60 fps everywhere (GPU 11.5–15 ms); High averages ~54 fps, ~45 in the control chapter and
  the guide-tube Explore view.

---

## 9. Quality, delivery, localization, failure handling

- **Presets** (`config/quality.ts`): High = MSAA, PCF shadows 2048, env 256, particles ×1, 96 radial
  segments, cap strata, DPR ≤ 1.75, pixel budget 2560×1440. Low = no MSAA, no shadows (contact shadow),
  env 64, particles ×0.35, 48 segments, no strata, DPR ≤ 2 but budget 1920×1080.
  `canvasPixelRatio = min(min(dpr, max) × scale, √(budget / cssPixels))`. `?quality=low|high`,
  `?scale=0.5..1` (emergency fill-rate lever), software renderer → Low automatically; otherwise High.
  A quality change remounts the canvas (MSAA is fixed at context creation); camera pose and Explore
  Flow/Control/Safety state survive.
- **16:9 stage** (`config/render.ts stageSize`): canvas + in-picture UI are the largest centred 16:9 box;
  black bars on 16:10 / 4:3 projectors; 1920×1080 is pixel-identical to the authored frames.
- **UI**: setup bar (Start/Resume, quality, Reset view, Full screen, LT|EN) auto-hides after 2.5 s and
  never shows while playing; Explore panel (X-ray, Section + Plant/Reactor + slider, Flow, Control +
  slider, Safety, Isolate, Labels, Reset); no stage numbers or debug UI in production.
- **Failure paths**: WebGL2 probe before mount → "cannot start" screen; React error boundary → Restart
  3D / Restart in Low / Reload; context loss → automatic canvas rebuild (2 per 30 s, then a manual
  overlay); every failure screen offers **Play the backup video** (inline `<video>`, relative path,
  per language). `<html data-scene-status>` = `loading|ready|context-lost|error` for automation.
- **Portable offline build** (`npm run build:portable` → `dist-portable/BWRX300/`): one `BWRX300.html`
  (all JS/CSS inlined, one chunk, fails the build if any external script/stylesheet/emitted file
  remains), `START-HERE.txt` (LT) + `START-HERE-LT.txt` + `START-HERE-EN.txt`, and
  `BWRX300-fallback-lt.mp4` / `-en.mp4` copied from `fallback/` **if present (missing → only a warning)**.
  Opens from `file://` in Chrome/Edge/Firefox with zero network requests.
- **Localization** (`i18n/`): Lithuanian default, English toggle; typed contract (`UiStrings`,
  `Record<ComponentId, …>`) so a missing string fails the type check; stored in `localStorage` when
  allowed; refused while the cinematic plays; never touches timing, cameras or materials.
- **Backup video spec**: 48 s, 1920×1080, 30 fps fixed-step render, H.264 High@4.0, yuv420p, CRF 18,
  no audio, 1441 frames, ~20.9 MB.

---

## 10. Debug, automation and validation workflow

- `?debug` (or dev build): diagnostics panel (FPS, draw calls, shot buttons, time scrubber, "Copy pose"),
  review keys, and `window.__bwrx`: `shot.*`, `master.{play, seek, step, jumpToBeat, timings, beatAt,
  cameraAt, lookAt, signals}`, `reveal`, `rpvReview.show(id)`, `camera()`, `navigation()`,
  `explore.{select, xray, isolate, section, flow, control, controlAmount, safety, settle, pickAt, hitsAt}`,
  flow/control/safety/fission state probes, per-frame renderer stats.
- Validation is done with an **external Puppeteer harness** (real Chrome, `--use-angle=d3d11`) that
  lives in Claude session scratchpads, **not in the repo**: dense seek-vs-playback hash comparisons
  (379 frames), Stage 3 golden frames, perf runs, navigation / interaction / focus suites, soak tests,
  portable `file://` tests per browser.
- Policy (`DEVELOPMENT_RULES.md`): FAST profile by default (changed-window checks only), FULL for
  timeline/camera/renderer/architecture changes; reports 80–150 lines; Low is the perf reference; never
  run GPU captures in parallel.
- Known, accepted flakes: GSAP 1e-7 s rounding (playback ≠ seek on ~66 of 379 frames by a few pixels);
  load-time 1-pixel flips at 3.33 s / 4.0 s; Low 11–12 s vessel-opening 33 ms frames; a 56.4 fps pacing
  ceiling that is machine state, not the app.

---

## 11. Scientific basis

Authority: **GE Vernova Hitachi, BWRX-300 General Description 005N9751 Rev J (June 2026)**; older
NEDO-34163 Rev B used only where the GD is silent (e.g. the ~36 m shaft depth). Fission facts: NRC
glossary + DOE-HDBK-1019/1-93. `references/TECHNICAL_FACTS.md` holds verified quotes with page numbers.

**Official and shown:** direct cycle, no recirculation pumps, natural circulation through a tall
chimney; 240 GNF2 bundles, 57 cruciform blades rising from bottom-mounted fine-motion drives (the
housing stays still, only piston + blade move); four bundles per blade except 12 peripheral bundles
(core map read off GD Fig 3-6, rows 3-5-7-9-9-9-7-5-3); fixed axial separators and chevron dryer;
downcomer annulus; HP + double-flow LP turbines on one shaft with the generator; 3 independent ICS
trains, each an IC submerged in its own pool above the containment, steam in / condensate back to the
chimney region, gravity-driven, no pumps, no AC power; seven days of decay-heat removal with two trains
(narration only); fission = absorption → excited nucleus → dumbbell → unequal fragments + 2–3 neutrons;
most energy is fragment kinetic energy that becomes heat in the fuel; decay heat continues after
shutdown.

**Approximations (all labelled in code):** building/pool sizes and positions, nozzle azimuths, IC
header heights, one tube bank per IC (Fig 3-8 draws two), **one** main steam line (the design has two),
separator count 44, lattice pitch, blade motion pattern and speed, reaction cue, shaft speed, 96-sphere
nuclei, no neutron moderation shown, no condenser/feedwater loop drawn, no numbers on screen.

---

## 12. What is built, what is not, what is missing

### Built and approved (Stages 1–10)
Full plant massing; the 10 s hero reveal; detailed RPV with internals; the complete 48 s cinematic with
all four story chapters (heat, steam/electricity, control, passive cooling) plus the fission inset;
Explore mode with every interaction the spec asked for; deterministic export path.

### Built, awaiting review/commit (Stage 11)
Presentation build (gated start, 16:9 stage, pixel budget, failure screens, backup video playback),
single-file portable build, Low-under-Windows-scaling fix, Lithuanian/English localization code.

### Not done yet (known, planned)
1. The localization review set in `docs/stage11-review/` (LT 48 s candidate, LT stills at
   1920×1080 / 1280×800 / 1024×768, LT/EN comparison sheet, report section), owner approval, then the
   **Stage 11 commit**. (The LT backup video and the rebuilt portable package already exist.)
2. **Stage 12**: the 90–110-word narration (beat `takeaway` strings exist as raw material), integration
   into the larger HTML presentation / deck, USB + cloud packaging, a hosted copy (spec Level A), a
   rehearsal on the actual VILNIUS TECH S4 lectern PC and projector.

### Missing relative to PROJECT.md (not planned anywhere yet)
- **On-screen chapter labels in the cinematic** (§13/§14 suggested "BWRX-300 / 300 MW class SMR" at 0–6 s
  and 1–3-word labels such as "Natural circulation", "Passive cooling"). The approved Stage 3 decision was
  "no labels"; the only cinematic text is the fission inset. Understanding depends fully on narration.
- **Condenser and feedwater return**: the steam goes to the turbine and is never shown returning as water
  to the vessel, so the direct cycle is not visually closed (Tier 2 in the spec; the turbine-hall
  description even mentions a condenser that is not modelled).
- **A keyboard help panel** (§11 "documented in a hidden/help panel"): shortcuts live only in tooltips,
  README and START-HERE.
- **FPS-informed quality recommendation** (§24 Stage 11 "Add: FPS-informed recommendations") and
  **reduced-motion** handling.
- **An embedding contract** for the host presentation (no `?autoplay`, no `postMessage` API, no
  "presentation finished" signal to the parent page).
- **Explore Fission replay** (deferred in Stage 10).
- **Audience comprehension test**: the acceptance criterion "a non-engineer can explain the energy chain
  after one viewing" has never been tested with real viewers.

---

## 13. Strongest parts of the model (keep these)

1. **Determinism architecture**: pure functions of master time + a single manually-ticked clock +
   1 µs quantisation. Seek = playback = export is proven with dense frame-hash checks. This is rare in
   WebGL projects and makes the backup video exact.
2. **Camera system**: one authority at a time; PCHIP monotone paths in orbit space (log radius) give
   smooth, overshoot-free, roll-free cinematography; transitions and Explore never fight.
3. **One reveal state, one section engine**, stencil-free single-pass cut caps, fixed plane counts (no
   recompiles), and a dithered X-ray that avoids transparency sorting entirely.
4. **GPU-driven effects with almost no CPU cost**: baked streamline textures + `fract(seed + t/T)`,
   pulse tubes with advancing fronts, rigid-batch blade motion, analytic fission motion; each effect is
   1–2 draw calls and draws nothing when off.
5. **Data-driven, provenance-tagged content**: registry, camera states, timing and looks are plain data;
   every dimension says whether it is official or approximate.
6. **Presentation reliability engineering**: ready gate with full shader precompile, gated start,
   layout-independent keys (`event.code`), context-loss auto-rebuild, failure screens with a per-language
   backup video, a single offline HTML file, 16:9 letterboxing, a pixel budget that protects weak GPUs
   from 4K/scaling.
7. **Scientific restraint**: no fake glow, no pumps in the natural-circulation loop, no "magic" ICS, decay
   heat shown after shutdown, educational simplifications explicitly labelled.
8. **Process**: staged review gates, written reports, stored validation JSON, a written validation policy.

---

## 14. Flaws, risks and improvement opportunities (prioritised)

### A. Delivery-critical (before the talk)
1. **Stage 11 is uncommitted** (26 modified files + new folders since `5244e10`). A disk problem or a bad
   edit would lose it. Commit as soon as the owner approves.
2. **The portable build only *warns* when a backup video is absent.** Both videos exist now, but a
   rebuild on another machine (videos are git-ignored) would silently ship a package whose default
   (Lithuanian) "Play the backup video" shows "video missing". Make it a hard error for release builds.
3. **The portable HTML opens in High** (no query string on `file://`), while Low is the validated,
   smoother preset (High dips to ~45 fps). START-HERE only says to switch to Low "if the motion is not
   smooth". Consider defaulting the portable build to Low, or a first-run instruction "press 2".
4. **The real lectern PC is untested** (GPU, driver, browser version, managed-PC policies that block local
   HTML or disable hardware acceleration, Windows scaling, projector resolution). Context-loss recovery
   has only been tested with a simulated loss.
5. **No narration yet**, and the cinematic carries almost no text: the story only works if the speaker
   names each chapter at the right second. Narration must be timed against §5.1 / §5.2.
6. Firefox plays at 34–46 fps in Low: Chrome/Edge only (already stated in START-HERE).
7. `fallback/BWRX300-fallback.mp4` (the pre-localization English video) is now an unused orphan next to
   `-lt.mp4` / `-en.mp4`: a risk of copying the wrong file by hand.

### B. Educational / content weaknesses
1. **Open water cycle**: no condenser or feedwater return is shown, so a viewer can think the steam is
   used up. Even a 1–2 s faint return line (condenser → feedwater nozzles) during 34–36 s would close
   the loop.
2. **Electricity gets about 1 s on screen** (the camera leaves the generator at ~35 s, `electricityOut`
   is 35.4 s; flagged in Stage 7 and not changed because the Stage 6 timing is frozen).
3. **The safety chapter is dense**: shutdown handoff, camera climb, steam up, condensing, condensate back,
   pool plume, all within ~4.5 s (41.5–46). Narration will struggle to keep up; consider a longer hold
   (the spec allows up to ~55 s total with an explicit decision).
4. **The chain reaction is only implied**: the second nucleus starts to deform as the view closes; a full
   second split would need ~0.5 s more.
5. **No chapter labels / title card** in the cinematic (see §12). A 1–3-word lower-third per chapter
   would make the module robust to a nervous or fast speaker.
6. One main steam line instead of two; one IC tube module instead of two; time-compressed blade motion;
   no moderation of neutrons: all acceptable simplifications, but worth one sentence in Explore
   descriptions or the speaker notes if someone asks.
7. Explore Safety does not move the camera; from the home view the ICs are small. Explore has no fission
   replay.

### C. Code / technical debt
1. **Duplicated helpers**: `keyed` exists in both `animation/keys.ts` and `animation/masterSequence.ts`;
   `quantise` is copied in 4 files, `approach` in 2, `smooth` in several. Centralise them (e.g.
   `animation/time.ts`) so the determinism rules cannot drift.
2. **Master time is not quantised centrally.** Each effect quantises itself, but the camera, look and
   reveal read raw GSAP time, which is why ~66 of 379 frames differ by a few pixels between playback and
   seek. Quantising once in `masterSequence.time` would remove the known flake (it touches frozen Stage 6
   code, so it needs a FULL validation).
3. **Hidden ordering contract**: correctness depends on `useFrame` priorities (−100 / −95 / −90 / −80)
   and on module-level mutable singletons (`heroReveal`, `cameraDirector`, frame states,
   `interiorOverride`, `controlBladeEmphasis`). It is documented, but a new component with the wrong
   priority silently reads last frame's state. A tiny frame-phase registry or assertions in dev would help.
4. **No automated tests in the repo**, and the whole validation harness lives in temporary scratchpad
   folders that can be cleaned up. Move the harness into the repo (`tools/harness/`) and add unit tests
   (Vitest) for the pure functions: `presentationFlowAt`, `presentationControlAt`, `presentationSafetyAt`,
   `fissionAt`, `CameraPath.evaluate`, `createTrackOverlay`, `revealForSection`, `canvasPixelRatio`.
5. **Fragile three.js internals**: `ExploreOrbitControls` overrides OrbitControls' private
   `_handleMouseWheel` (r186). A three upgrade can silently fall back to the default dolly (there is a
   console warning). Pin three exactly or test on upgrade.
6. **Unused / dead config**: `QualityPreset.postprocessing` and `.bloom` (always false), the `generator`
   flow channel (keyed, never read). Remove or use.
7. **Stale docs**: README's header still says "Current state: Stage 6"; parts of README describe
   debug-only keys that are now production keys (Space/Home appear twice).
8. Upstream `THREE.Clock` deprecation warning from R3F on every load (harmless).
9. Minor: the 240 fuel instances are re-sorted and their matrices rewritten whenever the camera moves
   (i.e. every frame of the cinematic while the core is visible); cheap, but it is the one per-frame
   instance upload left.
10. Known small bug: the control-blade label anchor is cached at first selection, so after the blades move
    in Explore Control the label can sit slightly off (Stage 8 §14).

### D. Performance
- High preset dips to ~42–45 fps in the control chapter and the guide-tube Explore view on Iris Plus;
  both presets are **fill-bound**, so the effective levers are resolution (`?scale`) and overdraw, not
  triangles. Low is at 60 fps everywhere on the test laptop; the lectern PC may be weaker.
- An automatic "measure 2 s, suggest Low/scale" step on the ready screen would protect against an
  unknown GPU without the presenter having to judge smoothness.

### E. Process
- Stage 12 must not start until the owner asks; every pass is committed only after visual approval.
- The development docs (`CLAUDE_STAGE_11_*.md`) are prompt briefs in the repo root; consider moving
  them to `docs/briefs/` so the root stays clean.

---

## 15. Rules any proposal must respect, and how to add an effect

### Rules (from PROJECT.md, DEVELOPMENT_RULES.md and approved decisions)
- **Frozen**: Stage 3 hero shot (0–10 s byte-identical), Stage 6 master timing and camera keys, the
  camera director and navigation, the section engine architecture, Stage 7 flow programs, Stage 8
  control mapping and handoff. Changing them requires an explicit decision and a FULL validation.
- Presentation effects must be **pure functions of master time** plus stable seeded data.
- No post-processing, no additive blending, no glowing uranium, no neon/holographic styling; one warm
  accent colour for information/selection; water = cool blue, steam = pale white, electricity = thin
  warm-neutral pulse.
- Labels 1–3 words, descriptions one sentence, no paragraphs on screen, no numbers on screen.
- Official GE Vernova Hitachi documentation wins over any other source; unknown dimensions are marked
  `[APPROX]`, never invented as facts.
- Low must stay presentation-safe (no slow frames on Iris Plus at 1920×1080); no new runtime
  dependencies without a strong reason; no network requests.
- Animate repeated parts with object transforms or uniforms, never per-frame instance-matrix uploads.

### Recipe: adding a new time-based effect
1. Put timing and look in `config/<effect>.ts`, keyed on `MASTER_EVENTS` (not on camera keys).
2. Write `presentation<Effect>At(t, out)` in `animation/<effect>.ts`: quantise t to 1 µs, evaluate keys
   with `keyed`, no history, no allocation. Add an Explore variant if needed (easing with `lastStep`
   is allowed only outside the presentation) and a `<effect>ForFrame()` that picks master vs Explore.
3. If other systems read it, advance it in a driver at priority −95; render at −80.
4. Render it outside the plant hierarchy, inside the right `<Interior level=…>`, with 1–2 draw calls,
   motion computed in the shader from a time uniform; set `mesh.visible = false` when intensity is 0;
   respect the vessel cut (`SECTION_PLANES.vessel`) if it lives inside the RPV.
5. Scale counts with `preset.particlesMultiplier` (with a floor so the story survives on Low).
6. Expose it in `window.__bwrx` for validation; verify seek = playback around its window, Low full-run
   performance, High changed-window performance, and no new console errors.

---

## 16. Key numbers and glossary

| Item | Value |
|---|---|
| Cinematic length | 48 s (1441 frames at 30 fps) |
| World units | 1 unit = 1 m; grade y = 0; reactor axis x = z = 0; turbine hall to +x; cameras look from +z |
| RPV | 27.36 m inner height, 4.2 m inner diameter, 13.5 cm wall (GD Rev J); head apex at y ≈ +1 m, so the vessel hangs ~27 m below grade in the shaft |
| Shaft | ~36 m below grade (NEDO); reactor building Ø ≈ 37 m (APPROX) |
| Core | 240 fuel bundles, 57 cruciform blades, ~3.8 m active height |
| ICS | 3 trains, ~33 MW each (narration only), 7 days with 2 trains |
| Vessel flow particles | High 2,400 on 436 streamlines; Low 35 % of streamlines |
| Activity glints | 560 slots on High |
| Draw calls / triangles | 50–81 / ≤ 70k |
| Low / High fps (Iris Plus, 1080p) | ~60 / ~54 average (45 worst chapter) |

Glossary: **RPV** reactor pressure vessel · **ICS / IC** isolation condenser system / condenser ·
**FMCRD / CRD** (fine-motion) control rod drive · **GD** the official General Description Rev J ·
**downcomer** the annulus where separated water flows back down · **chimney** the tall open cylinder
above the core whose hot rising mixture drives natural circulation · **decay heat** heat from fission
products after the chain reaction stops · **reveal** the cutaway state · **beat** a chapter of the
cinematic · **authority** who currently moves the camera · **FAST / FULL** the two validation profiles.
