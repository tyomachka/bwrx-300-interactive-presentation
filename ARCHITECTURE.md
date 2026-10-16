# Architecture map

A compact map for later stages: which file owns what, the key APIs, and what is frozen. Read the
files being changed and their direct dependencies, not the whole tree (DEVELOPMENT_RULES.md §10).
Units: 1 world unit = 1 m; grade is y = 0; the reactor axis is x = z = 0; +z faces the cameras.

## Time and state (all presentation effects are pure functions of master time)

| File | Responsibility | Key API / state |
|---|---|---|
| `animation/clock.ts` | The one animation clock; drives GSAP from the R3F loop | `animationClock.fixedStep` (1/30 for exports), `.time`, `.lastStep` |
| `animation/masterSequence.ts` + `config/masterSequence.ts` | Stage 6 master timeline: 48 s, beats, semantic events, camera keys, reveal tracks, look cues | `MASTER_EVENTS`, `masterSequence.seek/play/status/time` — **frozen camera keys and timing** |
| `animation/keys.ts` | Smoothed `[time, value]` key evaluation | `keyed(keys, t)` |
| `animation/operatingFlow.ts` + `config/flow.ts` | Stage 7 normal operating flow state | `presentationFlowAt(t)`, `flowForFrame()` |
| `animation/reactorControl.ts` + `config/control.ts` | Stage 8 blade insertion and reaction cue | `presentationControlAt(t)`, `advanceControl(dt)`, `CONTROL_HANDOFF`, `CONTROL_SHUTDOWN` (Stage 9 handoff) |
| `animation/passiveSafety.ts` + `config/safety.ts` | Stage 9 ICS loop state (fronts, channel intensities) | `presentationSafetyAt(t)`, `advanceSafety(dt)`, `safetyForFrame()` |
| `animation/fissionInset.ts` + `config/fission.ts` | Stage 10 fission inset frame state (zoom, iris, backdrop, fades, labels); particle motion is in the shaders | `fissionAt(t)`, `fissionForFrame()` |
| `animation/heroShot.ts`, `heroReveal.ts`, `revealTimeline.ts` | Stage 3 hero shot (0–10 s) and the reveal state | `heroReveal` (groundCut … poolsReveal) — **frozen (Stage 3)** |
| `animation/presentation.ts` | Reset: stops cinematics, clears Explore, snaps control / safety | `resetPresentation()` |

Per-frame order (R3F `useFrame` priorities): FrameDriver (clock) → state drivers at −95
(control, safety) → RevealDriver −90 (section planes) → effect layers −80 (flow, glints, ICS).

## Scene

| File | Responsibility |
|---|---|
| `scene/SceneCanvas.tsx` | Canvas, ready gate (compiles hidden content too), mounts Plant + effect layers |
| `scene/plant/*` | Plant massing (Stage 2): `dimensions.ts` (provenance-tagged numbers), `materials.ts` (section / context materials), `ReactorBuilding.tsx` (shaft, containment, pools, IC hardware) |
| `scene/rpv/*` | RPV and internals (Stage 4): `rpvData.ts` (heights), `coreLayout.ts` (blades) |
| `scene/section/*` | The one section engine: `sectionLayers.ts` (planes, interior levels), `sectionShader.ts`, `drawOrder.ts` — **frozen architecture** |
| `scene/components.ts` | The component registry (labels, focus poses, enclosures) — Stage 5 |
| `scene/flow/*` | Stage 7: `flowMaterials.ts` (two programs: streak particles, pulse tubes), `VesselFlow`, `PowerFlow` |
| `scene/control/*` | Stage 8: driver + activity glints |
| `scene/safety/*` | Stage 9: `icsLayout.ts` (routes, IC geometry, plume paths), `IcsEquipment` (in the plant), `PassiveSafety` (driver, ICS flow on the Stage 7 programs, decay-heat tint) |
| `scene/fission/*` | Stage 10: camera-space inset in the normal pass (renderOrder 900-903): `fissionData.ts` (seeded nuclei, fragments, neutrons), `fissionShaders.ts` (analytic motion from τ, iris, zoom), `buildInset.ts`, `FissionInset.tsx` |

Interior levels (`Interior level=…`): content drawn only when a cut or X-ray opens it
(`belowGrade`, `building`, `vessel`, `reactor`, `turbineHall`, `steamPath`, `pools`).

## Delivery (Stage 11)

| File | Responsibility |
|---|---|
| `config/render.ts` `STAGE_ASPECT`, `stageSize` | The 16:9 presentation stage (CSS `.stage` mirrors it) |
| `config/quality.ts` `canvasPixelRatio`, `maxRenderPixels`, `?scale` | Pixel ratio: device ratio, capped per preset, scaled, pixel budget |
| `config/delivery.ts` | The backup-video file name per language, used by the failure screens |
| `vite.portable.config.ts`, `build-tools/portableSingleFile.ts` | `npm run build:portable`: single-file `BWRX300.html` + START-HERE (LT, EN) + fallback videos (LT, EN) |
| `i18n/language.ts` | The audience language (LT default, EN): presentation state only, remembered in `localStorage`, refused during playback |
| `i18n/strings.ts`, `i18n/components.ts` | Every audience-facing string in both languages (typed: a missing one fails the build); English = the registry / approved wording |
| `ui/LanguageToggle.tsx` | LT \| EN in the setup bar and on the failure screens |
| `animation/presentation.ts` `startPresentation`, `startOrTogglePresentation` | Space / Home / Start button (only when ready) |

## Interaction

| File | Responsibility |
|---|---|
| `interaction/exploreStore.ts` | The single Explore state (selection, X-ray, section, labels, flow, control, safety) |
| `interaction/exploreActions.ts` | The only writers of that store; invariants; `revealForSection` |
| `interaction/exploreVisuals.ts` | Binds the registry to the scene; hover / select / isolate / X-ray / cinematic look uniforms |
| `camera/cameraDirector.ts` | One camera authority at a time (explore / transition / cinematic) — **frozen** |
| `ui/ExplorePanel.tsx`, `app/useKeyboardShortcuts.ts` | Panel buttons and keys (X C I L F O S R Esc 1 2) |
| `debug/automation.ts` | `window.__bwrx` (with `?debug`): master, explore, flow, control, safety, fission, frame stats |

## Frozen / approved subsystems

Stage 3 hero shot (0–10 s, byte-identical frames); Stage 6 master timing, camera keys and look
cues; camera director and navigation (Explore polish); section engine; Stage 7 flow programs
(Stage 9 reuses them with its own uniforms); Stage 8 control mapping and handoff.
