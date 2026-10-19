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
| `scene/plant/*` | Plant massing (Stage 2): `dimensions.ts` (provenance-tagged numbers), `materials.ts` (section / context materials; `earthBelowShaft` yields in depth, see below), `ReactorBuilding.tsx` (shaft, containment, pools, IC hardware), `SiteGround.tsx` (earth above / below the shaft bottom, apron) |
| `scene/rpv/*` | RPV and internals (Stage 4): `rpvData.ts` (heights), `coreLayout.ts` (blades) |
| `scene/section/*` | The one section engine: `sectionLayers.ts` (planes, interior levels), `sectionShader.ts`, `drawOrder.ts` — **frozen architecture**. Cut surfaces are back faces shaded at the cut, with the back face's depth: two solids 1 cm apart z-fight through a cut beyond ~200 m (24-bit depth, near 0.5 m). Presentation Stage 3: the earth below the shaft bottom (whose top lay 1 cm under the earth above and the basemat) has its own material with a constant polygon offset, so it always yields (`materials.ts earthBelowShaft`); the 48 s film's frames are unchanged |
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

## Post-final compatibility (phones, weak browsers)

| File | Responsibility | Key API / state |
|---|---|---|
| `app/entry.ts` | Which experience the page opens, once at load: `?mode=explore` / `?mode=presentation`, else a touch-only device opens the model only | `ENTRY`, `EXPLORE_ONLY`, `HANDHELD` |
| `ui/ExploreSheet.tsx` (+ `styles.css` "Explore-only page") | The explore-only page's controls: top strip (name, LT \| EN), collapsible bottom sheet grouped View / Systems / Inspect + quality, full screen; selection card; side panel on a landscape phone. Same actions as `ExplorePanel`; nothing starts the talk or the film | `labelLayer.reserve` |
| `scene/SceneCanvas.tsx` explore-only parts | The whole viewport instead of the 16:9 stage; `ViewportFit` (camera `zoom`, portrait keeps a 1.2-aspect horizontal view; no pose changes); the talk's scene parts and font are not mounted | — |
| `config/quality.ts` `HANDHELD_RENDER_LIMITS`, `storeHandheldQuality` | Touch-only device: Low unless its user chose High before; drawing buffer capped (Low 1.5x / 1 MP, High 2x / 1.6 MP) | `renderLimits()` |
| `index.html` startup gate, `app/boot.ts`, `build-tools/bootGate.ts` | ES5 gate before the bundle: HTML loading shell, watchdogs (start 60 s, first frame 12 s, ready 60 s), script / load errors, `nomodule`, then a plain-HTML fallback (poster, QR, backup video in the portable package, retry). The app reports start / frame / ready / failures (no WebGL 2, scene error, blank first frame, repeated context loss) until it is ready; afterwards its own status screens apply | `window.__bwrxBoot`, `boot` |

## Presentation v1: the ~7-minute talk (`src/presentation/`)

A separate controller on top of the approved scene. It never edits frozen timing, keys or shaders;
it reads frozen poses and reveal states by name and drives the scene through additive hooks.

| File | Responsibility | Key API / state |
|---|---|---|
| `chapters.ts` | The script: 12 chapters, 23 presenter stops (22 presses to the Q&A), 33 beats; chapters 2-5, 9 and 10 hold on each of their pictures in turn (a stop per picture), the others are one stop each; a stop's beats after the first continue by themselves (`after`), timed to the final LT narration (`docs/final/FINAL_SPEECH_LT.md`, cue sheet `docs/final/PRESENTER_CUES_LT.md`); guard 1.2 s; presentation-only poses `P` | `CHAPTERS` |
| `types.ts` | Beat types (`after`, `textAt`, item `cue` / `out`); resolved once (`masterRevealAt` / `masterLookAt` for frozen states) | `ResolvedBeat[]` |
| `talk.ts` | The controller: next / prev (stop to stop; back lands on a stop's final beat, settled) / home / reset (settles the current stop) / jump / jumpStop / exit; `update()` enters a stop's continuations at their exact scheduled clock times; input lock per stop (a press after it goes to the next stop); press counter; camera ownership, Explore suspend / resume | `talk`, `TALK_BEATS`, `TALK_STOPS`, `useTalkStore` (`presses`), `talkOutline()`, `stopOutline()` |
| `runtime.ts` | Per-frame evaluation from per-channel transition tracks (from, to, start, timing): a continuation keeps every track whose target it does not change and starts its camera move from the exact pose at its start; cues run across the stop's beats; camera plan (PCHIP path, settle, dip, master segment) | `enterBeat` (`continueAt`), `evaluateTalkFrame`, `talkCameraSource`, `beatTime`, `dip` |
| `resolve.ts` | Inheritance across beats; stop indices; text follows the picture: an item new in a beat gets an implicit fade-in cue at the beat's `textAt` (default `TALK.textAt` 0.6 s, after the outgoing text's 0.35 s fade); `out` cues fade items within a stop | `resolveTalk()` |
| `world.ts` | Every scalar the talk drives, with resting values (rest = the existing scene unchanged) | `world`, `cues`, `WORLD_CHANNELS` |
| `effects.ts` | Installs the talk as the source for flow / control / safety (consulted only while the master is idle) | `installTalkEffects`, `removeTalkEffects`, through the additive hooks `setFlowSource`, `setControlSource`, `setSafetySource` (animation/*) and `setBladeScram` (rpv/coreLayout) |
| `legacy.ts` | The frozen reveal at any master time | `masterRevealAt(t)` |
| `config.ts` | Presenters (names, e-mails; no likenesses), the public URL, timing constants | `PRESENTERS`, `PUBLIC_PRESENTATION_URL`, `TALK` |
| `qrCode.ts` | The opening / closing QR: the explore-only page (`EXPLORE_PAGE_URL`, `?mode=explore`), version 5-M (segno), verified by decoding the rendered code; not a link (no navigation during the talk); the startup gate's fallback shows the same matrix | `QR_CODE` |
| `copy.ts`, `sources.ts` | On-screen text LT / EN (typed); every public number with its source and status | `useTalkCopy()`, `FACTS` |
| `design.ts`, `ui/talk.css`, `fonts/` | Stage 2 design system (B, editorial cinematic): 8 type roles, the semantic palette (amber = the one current concept), the composition grid, motion → CSS variables; the overlay only reads `var(--talk-…)`. Inter Variable bundled (`fonts/README.md`), registered and loaded by `loadTalkFont()`, which the scene's ready gate awaits | `TYPE`, `COLOR`, `GRID`, `MOTION`, `designVariables()`, `loadTalkFont()` |
| `overlayLayer.ts`, `ui/TalkOverlay.tsx` | The HTML overlay in the 16:9 stage, four label roles: anchored labels (dot + leader, tone = process / status colour), claims, sources under what they qualify, metrics; count-ups, the day counter, the construction timeline, the vessel diagram (chapter 3), credits, QR, scrims, dip; per-frame DOM writes (cue in / out opacity) | `updateOverlay(camera, w, h)` |
| `ui/TalkDebug.tsx` | Debug panel (`?presentationDebug`, or T in dev / `?debug`): chapter list (chapter k / 12), press counter, the beats of the current chapter | — |
| `scene/TalkScene.tsx` | Mounts the talk's scene parts; TalkDriver (−97), PlantSwitches (−96: lights, `p.zoom` plant scale) | — |
| Design study (Stage 1) | Removed from the source in Stage 2; its record stays in `docs/presentation-design-study/` | — |
| `scene/FissionField.tsx`, `fieldConfig.ts`, `fieldShaders.ts` | Fission: a chain that branches (1 -> 2 -> 3 fissions) and then holds steady in a widening view of the fuel: 15 sites on three closed rings (each fission sends one neutron on, the others are absorbed) + 7 idle nuclei, every position analytic in the chain time τ (no restart, no seam, bounded). Final stage: paced to the narration (`chainTime`), visiting order hops across each ring, uneven steps, three positions per site (no visible procession or beat); the chain-carrying neutron larger and amber-tinted with a short trail, absorbed ones quieter; a settled entry opens on the steady state (`FIELD_TIMING.settledAt`) | `FIELD_RINGS`, `FIELD_LABELS`, `chainTime`, `microView` |
| `scene/LimitsCues.tsx`, `limitsLayout.ts` | Chapter 11: a generic spent-fuel cask pad beside the reactor building (`l.casks`), one instanced draw | `LIMITS_PAD` |
| `scene/WaterCycle.tsx`, `GridCity.tsx`, `Comparison.tsx` + `comparisonLayout.ts`, `Footprint.tsx` + `footprintLayout.ts`, `Maps.tsx` | Condenser and feedwater; transformer, line, a street-grid city with lit streets and a substation; the large BWR-family unit at matched scale on one baseline (layout illustrative, mirrored so the reactor buildings stand side by side), amber vessel outlines at sourced inside dimensions, the module row; buildings are built up from grade and leave by a screen-door dissolve on their own material copies (`k.fade`, `k.modulesFade`), never by sinking; the 9,800 m2 area-equivalent rectangle (the pitch's width) and a 105 x 68 m pitch in a schematic stadium; LT and North Atlantic map tables, one cue per pin (`pin.<id>`) | `LARGE_UNIT`, `GHOST_VESSELS`, `FOOTPRINT` |
| `scene/TalkScene.tsx` `GroundFiller`, `PlantSwitches`; `scene/groundOwner.ts` | While the plant is scaled into a map point (about its own origin on grade): the floor's site hole is filled with the floor's own surface, the earth block is hidden and the contact shadow scales with the plant. Final stage: earth and filler switch on ONE predicate in the same frame (Stage 3 left a 2-3 frame hole showing the shaft on every map move); `groundOwner` exposes ownership and grade-marker error to `__bwrx.talk.probe()` | `groundOwner` |
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
