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

Per-frame order (R3F `useFrame` priorities): FrameDriver −100 (clock) → TalkDriver −97 (the talk's
world, reveal, look, fog; a no-op at rest) → PlantSwitches −96 (plant lights, zoom) → state drivers
at −95 (control, safety) → RevealDriver −90 (section planes) → effect layers −80 (flow, glints, ICS,
talk scene parts) → the talk overlay −70 (labels anchored to the scene).

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
| `animation/presentation.ts` `startPresentation`, `startOrTogglePresentation` | The 48 s film: the "48 s filmas" button; Space / Home while the film plays or holds |
| `config/quality.ts` `resolveInitialQuality` | Low in the portable build (`MODE === 'portable'`, reason `portable`); `?quality=` overrides |

## Presentation v1: the ~7-minute talk (`src/presentation/`)

A separate controller on top of the approved scene. It never edits frozen timing, keys or shaders;
it reads frozen poses and reveal states by name and drives the scene through additive hooks.

| File | Responsibility | Key API / state |
|---|---|---|
| `chapters.ts` | The script: 12 chapters, 32 beats (camera keys, reveal, look, world targets, cues, overlay, lock); presentation-only poses `P` | `CHAPTERS` |
| `types.ts`, `resolve.ts` | Beat types; inheritance across beats and chapters, resolved once (`masterRevealAt` / `masterLookAt` for frozen states) | `resolveTalk()` → `ResolvedBeat[]` |
| `talk.ts` | The controller: next / prev / home / reset / jump / exit, input lock (animation time), camera ownership, Explore suspend / resume | `talk`, `TALK_BEATS`, `useTalkStore`, `talkOutline()` |
| `runtime.ts` | Per-frame evaluation from (entry snapshot, beat, time since entry): camera plan (PCHIP path, settle, dip), reveal, look, world, cues | `enterBeat`, `evaluateTalkFrame`, `talkCameraSource`, `dip` |
| `world.ts` | Every scalar the talk drives, with resting values (rest = the existing scene unchanged) | `world`, `cues`, `WORLD_CHANNELS` |
| `effects.ts` | Installs the talk as the source for flow / control / safety (consulted only while the master is idle) | `installTalkEffects`, `removeTalkEffects`, through the additive hooks `setFlowSource`, `setControlSource`, `setSafetySource` (animation/*) and `setBladeScram` (rpv/coreLayout) |
| `legacy.ts` | The frozen reveal at any master time | `masterRevealAt(t)` |
| `config.ts` | Presenters, placeholders (`*_TODO`), timing constants | `PRESENTERS`, `PUBLIC_PRESENTATION_URL`, `TALK` |
| `copy.ts`, `sources.ts` | On-screen text LT / EN (typed); every public number with its source and status | `useTalkCopy()`, `FACTS` |
| `design.ts`, `ui/talk.css` | Type scale, colours, motion → CSS variables; the overlay only reads `var(--talk-…)` | `TYPE`, `COLOR`, `MOTION`, `designVariables()` |
| `overlayLayer.ts`, `ui/TalkOverlay.tsx` | The HTML overlay in the 16:9 stage: anchored labels, count-ups, the day counter, dip; per-frame DOM writes | `updateOverlay(camera, w, h)` |
| `ui/TalkDebug.tsx` | Debug panel (`?presentationDebug`, or T in dev / `?debug`) | — |
| `scene/TalkScene.tsx` | Mounts the talk's scene parts; TalkDriver (−97), PlantSwitches (−96: lights, `p.zoom` plant scale) | — |
| `scene/ChainFission.tsx`, `chainConfig.ts` | The looping chain fission (Stage 10 shaders with the optional `chain` variant) | `CHAIN_LOOP`, `CHAIN_LABELS` |
| `scene/WaterCycle.tsx`, `GridCity.tsx`, `Comparison.tsx`, `Pitches.tsx`, `Maps.tsx` | Condenser and feedwater; transformer, line, city; large unit and module row; pitches; LT and North Atlantic map tables (radial reveal at the plant) | — |
| `scene/mapLayout.ts`, `data/geo.ts` | Map projections (LT 0.75 m/km; North Atlantic LAEA, Darlington at the origin), pins; Natural Earth rings (inlined) | `ltToWorld`, `worldToMap`, `pinPosition` |

## Interaction

| File | Responsibility |
|---|---|
| `interaction/exploreStore.ts` | The single Explore state (selection, X-ray, section, labels, flow, control, safety) |
| `interaction/exploreActions.ts` | The only writers of that store; invariants; `revealForSection` |
| `interaction/exploreVisuals.ts` | Binds the registry to the scene; hover / select / isolate / X-ray / cinematic look uniforms |
| `camera/cameraDirector.ts` | One camera authority at a time (explore / transition / cinematic) — **frozen** |
| `ui/ExplorePanel.tsx`, `app/useKeyboardShortcuts.ts` | Panel buttons and keys (X C I L F O S R Esc 1 2). While the talk runs only its keys (→ Space PageDown ← PageUp Home R Esc) and the operator keys reach anything; from Explore → / Space / PageDown / Home enter the talk |
| `ui/SetupControls.tsx` | Setup bar: "Pradėti pristatymą" (the talk), "48 s filmas" (primary while the film is paused), quality, reset, full screen, LT / EN; hidden while the talk runs |
| `debug/automation.ts` | `window.__bwrx` (with `?debug`): master, explore, flow, control, safety, fission, talk, frame stats |

## Frozen / approved subsystems

Stage 3 hero shot (0–10 s, byte-identical frames); Stage 6 master timing, camera keys and look
cues; camera director and navigation (Explore polish); section engine; Stage 7 flow programs
(Stage 9 reuses them with its own uniforms); Stage 8 control mapping and handoff.

The talk (Presentation v1, not approved) depends on all of them and changes none: with the talk
inactive, the 48 s film's WebGL frames are pixel-identical to the pre-presentation build
(docs/presentation-v1-review/VALIDATION-REPORT.md).
