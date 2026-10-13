# Stage 7: normal operating flow, review report

Status: **implemented, not committed** (awaiting visual review). Stage 8 not started.

- Checkpoint before this stage: navigation polish `42f66c91ab35ad36236ecff5516555641b14d78c`
  (on top of Stage 6 `68466c1`). The approved commits for Stages 1–6 are untouched.
- Build: `npm run check` (typecheck, lint, production build) passes. No new console errors and
  no external requests in any run. The only console line is three.js's existing `THREE.Clock`
  deprecation warning, present in Stage 6 too.
- Machine for every measurement: the Stage 6 laptop (Intel Iris Plus), production build,
  1920×1080, Chrome headless with D3D11. The Stage 6 baseline is the Stage 6 production build,
  served alongside the new one.

## Deliverables (this folder)

| File | What |
|---|---|
| `stage7-operating-flow-1080p.mp4` | The full master sequence, 48.0 s, 1441 frames, 30 fps, H.264, no audio. Fixed-step export (each frame advances exactly 1/30 s). |
| `stage7-flow-focus-20.5-36.5s-1080p.mp4` | The flow chapters only: frames 615–1095 (20.5–36.5 s), 16.0 s. |
| `01-core-water-flow-1080p.png` | 21.4 s: water rising through the core (blue comet streaks at the section faces). |
| `02-boiling-chimney-1080p.png` | 22.4 s: the upper core boiling; the mixture (pale streaks and bubbles) rising up the chimney. |
| `03-natural-circulation-both-directions-1080p.png` | 23.8 s: up in the chimney, down in the downcomer slots at both sides. |
| `04-separators-1080p.png` | 24.9 s: wet steam off the separator caps; separated water spilling outwards into the downcomer on both sides. |
| `05-dryer-steam-exit-1080p.png` | 27.9 s: steam rising between the dryer banks, then converging on the steam outlet. |
| `06-main-steam-line-1080p.png` | 30.6 s: steam pulses along the main steam line, behind the advancing front. |
| `07-turbine-operating-1080p.png` | 33.7 s: steam through the HP casing and each LP casing from its middle outwards; the HP–LP coupling. |
| `08-generator-electricity-1080p.png` | 35.7 s: the generator; electricity leaving it and heading out of the hall. |
| `09-low-flow-1080p.png` | 24.9 s on **Low** (same frame as 04): the same story with 36 % of the streamlines. |
| `explore/01`–`06` | Explore Flow: home view, reactor section, lower-plenum turn, selection over the flow, X-ray, Isolate. |

The turbine still is at 33.7 s instead of the planned 33.2 s: at 33.2 s only the HP band is lit.
It is the video's own frame 1011, and playback equals seek.

## 1. Scientific story and educational assumptions

Authority: GE Vernova Hitachi, *BWRX-300 General Description* 005N9751 **Rev J** (June 2026),
the newest official source in `references/technical/`, as in Stage 4. Sections re-read for this
stage:
- §3.1 Nuclear Boiler System;
- §3.1.1 RPV, and §3.1.1.1 internals: shroud, chimney, chimney head and separators, dryer;
- §3.1.2 and §5.1.1 Main Steam;
- §5.1.2 Turbine Generator;
- Table 2-1;
- Figure 3-1.

What is drawn, in order, and where the source says so:

| Step | Drawn as | Source |
|---|---|---|
| Water enters the core from below | blue streaks rising from the lower plenum through the fuel | §3.1.1 "flow through the core is by natural circulation; pumps are not required" |
| Part of it boils as it rises | the same streaks pale and turn into small vapour bubbles in the upper core | §3.1.1, Table 2-1 (natural circulation BWR) |
| The mixture rises through the tall chimney | pale streaks and bubbles filling the chimney | §3.1.1 "a tall chimney between the top of the core ... and the bottom of the steam separators" |
| It is mixed under the chimney head and enters the separators | the chimney streams converge on the standpipe inlets under the head plate | §3.1.1.1 chimney head "mixing chamber ... before it enters the steam separators" |
| Separators remove the water; steam continues up | wet steam rising off the separator caps; blue water leaving their lower portion, outwards and down | §3.1.1.1 "the separated water flows from the lower portion of the steam separator into the downcomer region"; no moving parts |
| Water returns down the downcomer | slower blue streaks in the annulus between the chimney / shroud and the vessel wall, round under the core plate and back up into the core | §3.1.1.1 shroud and chimney "partition to separate the upward flow ... from the downward recirculation flow" |
| The dryer removes the remaining moisture | droplets in the steam disappear between the chevron banks; the steam above is uniform | §3.1.1.1 dryer, < 0.1 % moisture leaving |
| Dry steam leaves through the main steam line | steam converging on the steam outlet, then pulses along the main steam line | §3.1.2, §5.1.1 |
| Steam expands through the turbine | a soft highlight travelling through the HP casing, then through each LP casing from its middle outwards | §5.1.2 "expanded axially ...", LP turbines "double flow" |
| The turbine drives the generator | the shaft couplings between the casings turn | §5.1.2 single shaft, generator "direct driven" |
| Electricity leaves the generator | a thin warm-neutral line with travelling pulses, from the generator out of the hall towards the grid | §5.1.2 |

Direct cycle throughout. There is no steam generator, no secondary loop, no pressurizer and no
recirculation pump, and the coolant does not glow.

**Educational simplifications** (each also listed in §14):
- **One steam line.** The plant model has one conceptual main steam line, to the east nozzle
  (Stage 2); the design has two. All the dry steam is shown converging on the modelled outlet.
- **Feedwater makeup** joins the downcomer flow in the real plant (§3.1.1.1). It is not shown:
  the feedwater cycle is outside Stage 7.
- **No free water surface.** The separator region is drawn without one; the GD gives no level.
  Separated water drains from the separators' lower ends (h ≈ 18.1 m) into the annulus.
- **Turbine.** The moisture separator reheater between the HP and LP turbines is not modelled;
  the LP highlights start after the HP one, as if through a crossover.
- **Shaft speed.** The shaft turns at 0.75 rev/s for the eye; the real 3000/3600 rpm (50/60 rev/s)
  would only alias at 30 fps. In the presentation it starts turning as the steam reaches the
  turbine, so the cause reads; in the real plant it never stops.
- **Electricity.** The path is abstract: up from the generator, east out of the hall, fading
  towards the grid. No transformer or switchyard.

## 2. Timing (on the Stage 6 events; master unchanged at 48.0 s)

Every value is keyed on `MASTER_EVENTS` in `config/flow.ts`, so moving a Stage 6 event moves its
flow. No Stage 6 event, camera key or beat was changed.

| Channel | In | Full | Held / eases to | Out | Event anchor |
|---|---|---|---|---|---|
| Core water | 20.5 | 21.4 | 1 → 0.7 by 24.7 | 29.0–30.6 | `flowCore` 20.5 |
| Boiling (upper core) | 21.0 | 22.4 | – | with the core water | `flowCore` → `flowChimney` |
| Chimney mixture | 21.7 | 22.9 | 0.8 by 26.0 | 29.0–30.6 | `flowChimney` 22.4 |
| Downcomer return | 22.6 | 23.6 | 0.9 by 26.0 | 29.0–30.6 | `flowChimney` 22.4 |
| Separator water / steam | 24.0 | 24.8 | 0.8 by 27.6 | 29.0–30.6 | `flowSeparators` 24.3 |
| Dryer steam | 25.8 | 26.6 | 0.85 by 29.0 | 29.4–31.0 | `flowDryer` 26.0 |
| Steam outlet | 27.4 | 28.2 | – | 30.0–30.8 | `steamExit` 27.6 |
| Main steam line | 28.2 | 28.7 | front from 28.4 at 16.5 m/s, reaches the HP inlet (~56 m) at ~31.8 | 36.5–37.4 | `steamExit`, `turbine` |
| Turbine casings | 32.0 | 32.7 | front from 32.0 at 9 m/s | 36.5–37.3 | `turbine` 32.2 |
| Shaft couplings | starts 32.2 | 0.75 rev/s by 33.4 | keeps turning | – | `turbine` 32.2 |
| Electricity | 35.3 | 35.8 | front from 35.4 at 40 m/s | 36.9–37.5 | `electricityOut` 35.4 |

Between keys the values ease (smootherstep), like the Stage 6 look keys. The vessel flow is off
from 31.0 s, once the camera has left the vessel. The power-side flow fades as the control beat
starts (36.5 s).

## 3. Flow architecture

| Piece | File | Role |
|---|---|---|
| Data | `src/config/flow.ts` | channel list, streamline counts, visual language, presentation keys anchored on the Stage 6 events, Explore levels, shaft speed |
| Flow state | `src/animation/operatingFlow.ts` | `presentationFlowAt(masterTime)` (pure), `exploreFlowAt(clock)`, `currentFlowState()`: the master while it owns the scene, else Explore Flow, else off. Per channel: intensity; plus boiling, three fronts (steam line, turbine, electricity) and the shaft angle |
| Streamlines | `src/scene/flow/flowPaths.ts` | every vessel path as data in the vessel datum, baked to 64 samples at equal *time* steps (the spacing encodes speed) with a phase per sample (water, mixture, wet steam, dry steam). Seeded from channel name and index |
| Shaders | `src/scene/flow/flowMaterials.ts` | streak particles (GPU placement from the path texture, phase look, cut clipping) and pulse tubes |
| Vessel flow | `src/scene/flow/VesselFlow.tsx`, `vesselFlowGeometry.ts` | all seven vessel channels in one instanced mesh |
| Power flow | `src/scene/flow/PowerFlow.tsx` | steam-line sleeve; turbine highlights + electricity |
| Shaft | `src/scene/flow/ShaftCouplings.tsx`, `shaftGeometry.ts` | turning couplings in the turbine and generator components |

Channels:
- **vessel:** `coreWater` (with the boiling cue), `chimneyMixture`, `downcomerWater`,
  `separatorWater`, `separatorSteam`, `drySteam`, `steamOutlet`;
- **power:** `mainSteam`, `turbine`, `generator`, `electricity`.

The cinematic and Explore Flow drive the same channels through the same state object. No
effect logic is duplicated, and quality changes only the number of streamlines (preset field
`particlesMultiplier`).

**How a particle moves.**
- **Position.** `u = fract(seed + time / duration)` picks a point on its streamline; the vertex
  shader reads the two neighbouring samples from the texture and interpolates. Direction and
  speed come from the same two samples.
- **Look.** A comet quad is oriented along the flow and sized by phase and speed, never thinner
  than 1.4 px. Its alpha is the channel intensity times a soft birth and death.
- **Cost.** No spawning, no history and no per-particle CPU work. Per frame the CPU writes about
  20 uniforms.

**The quarter cut.**
- **Volume channels** (chimney, separators, dryer, dome): a particle inside the removed
  quadrant (x < 0, z > 0, from the live section planes) is collapsed before rasterisation, so
  nothing floats in front of the cut.
- **Face channels** (core, downcomer slots, a share of the separator water): drawn within about
  0.2 m of the two cut planes, where the cut exposes them. The fuel channels are opaque, and the
  0.5 m downcomer annulus is only visible at its cut edges. These show only while the vessel is
  fully cut open.
- **Closed vessel:** with the vessel closed nothing is drawn, because the flow lives in the
  vessel's interior level. Explore X-ray with Flow ghosts the vessel, and the volume channels
  show through it.
- **No z-fighting:** the downcomer streams stay 6–8 cm inside the annulus walls.

## 4. Visual language

| | Look | Colour (sRGB) |
|---|---|---|
| Liquid water | comet streaks: a wide bright head, a narrow fading tail (direction reads in a still), slower, denser | `#5c9cc3`, alpha 0.85 |
| Mixture | the water streaks pale towards the bubble colour; a third of them become small vapour bubbles (pale disc, darker rim: readable on light fuel and dark steel) | bubbles `#e2edf2` |
| Steam | pale, wider (11 cm), softer, longer, faster; droplets in it until the dryer | `#eef2f4`, alpha 0.52 |
| Main steam line | soft pulses travelling with the steam over a faint steady glow behind the front | `#e8edf0` |
| Turbine | one soft highlight at a time travelling along each casing | `#e8edf0`, alpha 0.3 |
| Electricity | a thin line with travelling pulses; no arcs, no lightning | warm neutral `#f4ead6` |

- **Blending:** normal alpha everywhere (no additive glow). Flow goes through the renderer's tone
  mapping like everything else.
- **The accent stays reserved.** The warm orange remains the selection and information colour;
  no flow is orange.
- **Subjects:** the Stage 6 subject emphasis is unchanged. The flow of the current chapter is
  the brightest; what has already been explained stays, quieter (presentation keys).

## 5. Natural circulation and the downcomer

- **Upward, in the centre:** core faces, then the chimney interior.
- **Downward, at the sides:** the two downcomer slots where the quarter cut opens the annulus,
  between the chimney / shroud cut faces and the vessel wall cut faces. They never share screen
  space.
- **Also told apart by colour:** rising mixture is pale with bubbles, returning water deeper
  blue with no bubbles. Comet tails show the direction even in a still (`03`).
- **Physical geometry unchanged:** the downcomer is not enlarged.
- **A closed loop at the cut faces:** water comes down the slots, turns under the core plate in
  front of the guide tubes, rises into the core, up the chimney, out of the separators, and back
  down. The lower turn shows best in Explore (the guide-tube pose).
- **Through X-ray:** a third of the downcomer streamlines ring the whole annulus. Through an
  X-rayed vessel the return flow shows all round; with the vessel cut they are hidden behind the
  chimney.

## 6. Separators and dryer

- **Separators.** They are not animated as machines; they have no moving parts. What is shown:
  - the mixture streams converging on the standpipe inlets under the chimney head;
  - wet steam rising off the separator caps;
  - blue water leaving the lower portion of the outer separators, outwards over the chimney head
    and down into the downcomer. Two in five of those streams are drawn at the cut faces, so the
    separated water visibly joins the downcomer slots on both sides.
- **Dryer.**
  - Steam rises in the channels between the chevron banks.
  - Its droplets are caught there and fade out, so the steam above is uniform and dry. Nothing
    implies heating.
  - The dry steam leaves the top of the dryer in lanes over the banks, then converges on the
    steam outlet.

## 7. Turbine and generator

- **Steam into the turbine.** The main-steam front reaches the HP inlet at about 31.8 s, just
  before the `turbine` event (32.2 s). Highlights then run through the HP casing, inlet to exhaust; after a crossover
  delay they run through each LP casing from its middle towards both ends (double flow).
- **Rotation.** The shaft couplings in the five gaps of the train turn: steel flanges with dark
  bolt heads and a rim lug. The casings never turn. The turbine couplings belong to the turbine
  component and the LP-generator and exciter couplings to the generator, so the Stage 6 subject
  emphasis on the generator (from 33.4 s) also lights its couplings.
- **Generator.** The coupling turning and the subject emphasis are the cue. Electricity then
  leaves it at `electricityOut` (35.4 s): the front runs at 40 m/s, so it is out of the hall
  while the generator is still in frame.

## 8. Explore Flow

- **Control.** A compact **Flow** button in the Explore panel (`aria-pressed`, tooltip
  "Shortcut: F") and the `F` key. It is off by default and inactive while the presentation owns
  the scene (Stage 5 authority rule).
- **Behaviour.** Steady and looping on the shared animation clock: every channel at 0.9, fronts
  fully along, the shaft turning. It never moves the camera.
- **Visibility rules.**
  - With Flow on, the turbine hall turns X-ray, as in the presentation's turbine chapter, so the
    steam line, turbine and generator show.
  - The reactor's flow shows through **Section → Reactor** (face and volume streams) or
    **X-ray**: with Flow on, X-ray also ghosts the vessel and the volume streams show through it.
  - **Isolate** keeps its Stage 5 rule: the vessel does not ghost for the flow there.
- **Hierarchy.** A selection keeps priority: the flow steps back to 0.54 (0.315 when isolated).
  The flow is never pickable or highlighted; its meshes sit outside the plant hierarchy. Only the
  couplings are part of the turbine and generator.
- **Reset** turns Flow off; a **quality switch** keeps it on (Low 861 particles after a switch).
- **Verified by script on the final build, High and Low** (`exploreflow`, `isoflow`):
  - `F` → flow on, source `explore`, intensity 0.9;
  - selection → 0.54;
  - Reset → off, source `off`;
  - quality switch → still on;
  - Isolate (turbine) with Flow: the vessel stays opaque;
  - X-ray with Flow: the vessel ghosts;
  - no errors.

## 9. Particle counts and draw calls per channel

Streamlines and particles of the vessel flow (`window.__bwrx.flow.stats()`):

| Channel | High particles | Low particles | Drawn as |
|---|---:|---:|---|
| Core water (+ boiling) | 320 | 115 | at the section faces |
| Chimney mixture | 320 | 112 | volume |
| Downcomer return | 1008 | 364 | 70 % in the two cut slots, 30 % around the whole annulus (volume) |
| Separator water | 252 | 90 | 40 % at the faces, 60 % volume |
| Separator steam | 132 | 48 | volume |
| Dryer steam | 192 | 68 | volume |
| Steam outlet | 176 | 64 | volume |
| **Total** | **2400** on 436 streamlines | **861** on 156 | one instanced quad each |

- **Path texture.** 64 samples × 436 rows, RGBA32F: 446 KB on High, 160 KB on Low.
- **Construction cost.** Built once per quality, deterministically (seeded from channel and
  index). No CPU work per particle afterwards.

| Mesh | Channels | Draw calls | Triangles | Drawn when |
|---|---|---:|---:|---|
| `operating-flow.vessel` | all 7 vessel channels | 1 | 4800 High / 1722 Low (2 per particle) | the vessel's interior is shown (cut or X-ray) **and** a vessel channel is on |
| `operating-flow.main-steam` | main steam | 1 | 7,040 | the steam path's interior is shown and the channel is on |
| `operating-flow.turbine-electricity` | turbine + electricity | 1 | 13,312 | the turbine hall's interior is shown and either channel is on |
| `turbine.couplings` / `generator.couplings` | shaft (and the generator cue) | 2 + 2 | small (5 flanges, 40 bolts, 5 lugs) | always: part of the turbine-generator, static while the flow is off; no shadow casting |

- **No new shadow casters.** The shadow map is still only re-rendered when a cut moves.
- **Shader programs:** +2 (one streak material and one shared pulse material). The couplings
  reuse the plant's steel and dark-metal materials. Programs are compiled at load and stay
  constant during playback: High 13 → 15, Low 14 → 16.
- **Presentation peaks** (both within budget):
  - reactor view: 63 calls on High (baseline 62), 64 on Low (63); budget ≤ 180;
  - turbine view: 139 on High (136), 79 on Low (75); budget ≤ 160.

## 10. Performance

**Master sequence, real-time playback, two runs per build, measured back to back:**

| | Stage 6 baseline | Stage 7 |
|---|---|---|
| High, full 48 s | 53.5 / 51.8 fps | 54.4 / 56.1 fps |
| High, reactor chapter 20.5–29 s | 54.0 / 50.5 | 53.7 / 57.9 |
| High, turbine chapter 29–36.5 s | 51.7 / 50.5 | 52.5 / 54.3 |
| High, frames over 20 ms (whole run) | 299 / 390 | 265 / 185 |
| Low, full 48 s | 60.0 / 59.9 | 60.1 / 60.1 |
| Low, frames over 20 ms in the flow chapters | 0 / 0 | 0 / 0 |
| Low, frames over 20 ms (whole run) | 6 / 8 | 2 / 2 |
| Triangles, reactor chapter (max) High / Low | 66,961 / 46,731 | 71,761 / 48,453 |
| Triangles, turbine chapter (max) High / Low | 93,645 / 43,643 | 106,781 / 55,247 |

**How to read it:**
- **The flow costs less than this machine can resolve.** In the turbine chapter on High:
  - the first session (before the per-frame allocations were removed from the flow update) put
    Stage 7 1.8 fps below the baseline;
  - this final back-to-back session put it 2.3 fps above;
  - two runs of the same build differ by up to 4 fps.
- **High is below 60 fps in the baseline too.** The core, control and safety beats (Stages 4
  and 6) set the High frame rate on this GPU; the flow does not change that.
- **Low holds 60 fps.** The flow chapters drop no frames on Low. The single 33 ms frames
  elsewhere also occur in the baseline:
  - replaying 9.5–14.5 s five times: 10 dropped frames on the baseline, 12 on Stage 7;
  - replaying 36–39.5 s five times: 0 on the baseline, 1 on Stage 7.

**Explore Flow, Flow off → on** (5 s per view, two runs; fps / draw calls / triangles):

| View | High | Low |
|---|---|---|
| Reactor section, RPV cutaway | 55.7, 54.5 → 54.5, 53.7 / 80 → 87 / 100k → 131k | 60 → 60 / 81 → 88 |
| Chimney and downcomer close-up | 52.7, 53.7 → 51.6, 58.7 / 59 → 66 | 60 → 60 / 60 → 67 |
| Home (closed plant) | 60.1 → 60.1 / 62 → 78 / 5k → 35k | 60 → 60 / 63 → 79 |
| Turbine train | 60.1 → 58.5, 52.7 / 51 → 67 / 1.6k → 31k | 60 → 60 / 52 → 68 |

- **Where the extra draw calls come from.** Mostly the turbine hall's interior, which Flow
  reveals on purpose by ghosting the hall. The flow itself adds at most 3 calls.
- **The one measurable cost** is that interior in the turbine-train view on High (§14, decision
  10).
- **Unrelated view.** The Explore guide-tube close-up was not optimized, as instructed; with Flow
  off the flow draws nothing there.

## 11. Determinism and seeking

The flow state is a pure function of master time (`presentationFlowAt`); nothing keeps history.

**Results:**
- **Playback = seek.** Compared at 209 samples per quality: every 0.5 s, plus every 4 frames
  through 20.5–36.5 s (`stage7compare`; frames as PNG hashes).
  - **High:** all 209 identical.
  - **Low:** 38 dense samples differ, in Stage 7 **and in the Stage 6 baseline**, and at the same
    frames. The cause is upstream of the flow:
    - the master time is a GSAP timeline time, which GSAP keeps to 1e-7 s, and the playback
      timeline's start is rounded too, so a frame can read 20.6333334 s by playback and
      20.6333333 s by seek;
    - the camera evaluated at that time is under a micrometre away, which flips a few edge pixels
      (baseline frame 619: 13 pixels);
    - where the two times agree, the frames are pixel-identical, on the same page or fresh pages
      (checked on Stage 7 at frames 619, 623, 631 and 643: 0 pixels differ).
  - **The flow is immune.** It quantises master time to 1 µs before use (frame times are at least
    0.17 µs from a rounding boundary), so its inputs are bit-identical however the frame was
    reached.
- **t = 25.0 s** reached by playback, forward seek, backward seek (from 40 s) and a random seek
  order (10 seeks, 25 s twice): identical, on High and on Low.
- **Fixed-step export.** The review video is exactly that path: the animation clock advances
  exactly 1/30 s per rendered frame.
- **Presentation unaffected by Explore input.** With Explore input sent during playback (wheel,
  middle-drag pan, click, double-click, and X, C, I, L, F, Esc every 0.5 s), every sampled frame
  equals the plain playback except the final frame 1440, which differs the same way in the
  baseline. The events, end status (`finished`) and authority (`cinematic`) are identical.

## 12. Regressions

- **Stage 6 master.**
  - The timings, the camera function (all 1441 frame poses), the look function and the 20 events
    are identical to the baseline.
  - Every sampled frame outside the flow chapters is byte-identical to the baseline, by seek and
    by playback, on both qualities. Inside the chapters 145 of 146 samples differ: that is the
    flow.
  - **Stage 6 camera timing was not changed.**
- **Stage 3 shot, 0–10 s:** 31 samples byte-identical to the baseline, on High and on Low.
- **Navigation.**
  - No navigation camera code was touched (`src/camera/*` and `ExploreDriver` unchanged).
  - The navigation test gives the same picks, limits and outcomes as the approved run. Its
    real-time-damped distances vary between runs as much as they did between the two approved
    runs (lower-vessel zoom 3.77 m now, 3.59 m and 3.75 m then).
  - The focus audit is identical (177 of 177 values).
  - The Stage 5 interaction tests on High and Low are identical, apart from the new `flow: false`
    field.
- **Explore without Flow.** Unchanged: Flow only adds the vessel exception under X-ray and the
  hall ghost, both while Flow is on.

## 13. Files

New:
- `src/config/flow.ts`: channels, counts, look, presentation keys, Explore levels, shaft;
- `src/animation/operatingFlow.ts`: the flow state, presentation and Explore;
- `src/scene/flow/`:
  - `OperatingFlow.tsx`;
  - `VesselFlow.tsx`, `vesselFlowGeometry.ts`;
  - `flowPaths.ts`;
  - `flowMaterials.ts`;
  - `PowerFlow.tsx`;
  - `ShaftCouplings.tsx`, `shaftGeometry.ts`.

Changed:

| File | Change |
|---|---|
| `src/scene/SceneCanvas.tsx` | mounts `<OperatingFlow />` |
| `src/scene/plant/TurbineBuilding.tsx` | couplings in the turbine and generator groups |
| `src/scene/plant/geometry.ts` | `roundedPath` shared |
| `src/scene/plant/MainSteamPath.tsx` | uses the shared `roundedPath`; same geometry |
| `src/scene/plant/routes.ts` | `MAIN_STEAM_CORNER`, `ELECTRICITY_ROUTE` |
| `src/interaction/exploreStore.ts` | `flow` |
| `src/interaction/exploreActions.ts` | `setFlow` / `toggleFlow` |
| `src/interaction/exploreVisuals.ts` | hall ghost; vessel under X-ray with Flow |
| `src/ui/ExplorePanel.tsx` | Flow button |
| `src/app/useKeyboardShortcuts.ts` | `F` |
| `src/debug/automation.ts` | `explore.flow`, `flow.state` / `stateAt` / `stats` |
| `README.md` | Flow key, Stage 7 section |

The diff to tracked files is 121 insertions and 30 deletions; the new modules total 1,236 lines.

## 14. Decisions for approval

1. **Electricity screen time.** The Stage 6 camera starts leaving the turbine train at about
   35 s and `electricityOut` is 35.4 s, so the electricity leaving the generator gets about one
   second on screen (still 08). I kept the Stage 6 timing. Two options:
   - an earlier `electricityOut` (e.g. 34.8 s), which changes a Stage 6 event;
   - a longer hold on the generator, which changes Stage 6 camera timing.
2. **One main steam line** is modelled (the design has two, §3.1.2). All the dry steam converges
   on the modelled east outlet.
3. **The cutaway convention.** Core and downcomer flow are drawn at the section faces, where the
   cut exposes them; the open volumes carry the rest. Nothing floats in front of the cut.
4. **Explore Flow ghosts the turbine hall,** and with Flow on, X-ray also ghosts the vessel.
5. **The shaft speed is slowed** (0.75 rev/s). In the presentation it starts as the steam
   arrives, so the cause reads; in reality it never stops.
6. **The LP double-flow abstraction** (highlights from the middle outwards); the moisture
   separator reheater is not modelled.
7. **The vessel flow ends at about 31 s.** Whether it returns under the control beat
   (36.5–41.5 s) is left to Stage 8.
8. **The `generator` channel** is keyed in the state but nothing reads it: the generator's cue is
   its couplings turning (one shaft) plus the Stage 6 emphasis. Keep it for a later cue, or drop
   it.
9. **Pre-existing Stage 6 time rounding** (§11). Playback and seek can differ by one 1e-7 s GSAP
   step, which moves a few edge pixels in some frames; the baseline does it too. A fix would be
   to quantise master time once in `masterSequence` (Stage 6 code), so I did not make it.
10. **Explore Flow on High in the turbine-train view** costs up to about 7 fps, because it reveals
    the hall's interior. The alternative is not ghosting the hall, but then the steam line,
    turbine and electricity are hidden.

## 15. Known limitations

- **Rotation only reads in motion.** The stills show the couplings, not their turning.
- **A closed vessel shows no flow inside,** by design (no cut, no X-ray).
- **Low is sparser.** It has 36 % of the streamlines; every channel and every direction cue is
  still there (still 09).
- **The review harness** (Puppeteer scripts) lives outside the repository, as for earlier stages.
