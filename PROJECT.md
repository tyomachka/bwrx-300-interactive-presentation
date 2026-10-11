# BWRX-300 Interactive 3D Presentation Module
## Master Project Specification

**Project type:** standalone interactive WebGL module for a future public-speaking presentation  
**Primary subject:** GE Vernova Hitachi BWRX-300 small modular reactor (SMR) power plant  
**Primary audience:** university students from mixed backgrounds with little or no nuclear-engineering knowledge  
**Presentation context:** approximately 7 minutes total, shared by two presenters; this module should occupy about **45–50 seconds** of the final talk  
**Primary runtime target:** unknown/low-powered Windows university PC in VILNIUS TECH S4 (Saulėtekio campus)  
**Primary development environment:** Claude Code / Codex  
**Design principle:** *an Apple-style interactive documentary about a real nuclear reactor*

---

# 1. Project goal

Create a visually polished, technically defensible, interactive 3D explanation of how a **BWRX-300 small modular reactor power plant** works.

This is **not** the complete presentation. It is a reusable hero module that will later be embedded in or linked from a larger HTML presentation.

The module must support two different uses:

1. **Cinematic Presentation Mode**  
   A controlled 45–50 second sequence with predefined camera movements and animations. It should work reliably during a live university presentation without requiring manual orbiting or explanation-heavy interaction.

2. **Explore Mode**  
   A manually controlled 3D viewer that allows the presenter to orbit around the plant, inspect the reactor, use X-ray/cutaway modes, highlight components, and demonstrate systems outside the strict 45–50 second sequence.

The project should prioritize:
- clarity,
- visual hierarchy,
- scientific accuracy at educational level,
- smooth camera movement,
- robustness on weak hardware,
- maintainable code,
- and graceful fallback behavior.

The project should **not** prioritize:
- engineering-grade CAD accuracy,
- photorealism at the expense of performance,
- exhaustive representation of every pipe or valve,
- microscopic reactor physics beyond what the public-speaking story needs,
- or heavy rendering effects that risk failure on university hardware.

---

# 2. Why the BWRX-300

The BWRX-300 is selected because it is unusually suitable for visual explanation.

It is a **direct-cycle boiling-water reactor**. This makes the energy story easy for a non-specialist audience to follow:

**nuclear fission → heat → boiling water → steam → turbine → generator → electricity**

The design also contains visually meaningful components:
- a tall reactor pressure vessel,
- reactor core,
- control blades,
- natural-circulation chimney,
- steam separators,
- steam dryer,
- main steam path,
- turbine-generator,
- isolation condenser system,
- containment.

Unlike an imaginary generic SMR, the BWRX-300 has public official design documentation that can be used to constrain proportions and component relationships.

---

# 3. Scientific/technical facts to preserve

The application is an educational visualization, but the following facts should be treated as authoritative unless newer official GE Vernova Hitachi documentation contradicts them.

## Reactor type
- Direct-cycle boiling-water reactor (BWR).
- Approx. **300 MWe net electrical output**.
- Approx. **870 MWth thermal output**.

## Reactor pressure vessel
- Approx. **4 m internal diameter**.
- Approx. **27 m internal height**.

## Core
- **240 GNF2 fuel bundles**.
- **57 cruciform control rods/blades**.
- Approx. **3.8 m active core height** in the official general description.

## Internal flow concept
- Coolant flows upward through the fuel/core.
- Steam-water mixture rises through the central chimney region.
- The chimney increases the natural-circulation driving head.
- Steam separators remove liquid water from the steam-water mixture.
- Separated water returns downward through the outer downcomer region.
- A steam dryer removes remaining moisture before steam exits toward the turbine.
- No fictional primary coolant recirculation pump should be added to the main conceptual flow.

## Control
- BWR control blades are located between fuel bundles.
- Movement of the control blades changes neutron absorption and therefore reactor power.
- For the public-facing animation, insertion should visually correspond to **lower reactor power**, and withdrawal to **higher reactor power**.

## Passive heat removal
- The Isolation Condenser System (ICS) is an important BWRX-300 safety feature.
- Official documentation describes three independent ICS trains.
- Each uses a heat exchanger submerged in a water pool.
- Steam from the reactor pressure vessel can condense in the heat exchanger and return to the vessel.
- The system can remove decay heat using passive natural circulation.
- Official material describes seven days of decay-heat removal without operator action when the credited trains are operating, with longer cooling possible if pool inventory is replenished.

## Accuracy rule
Whenever this file, a secondary website, a visual reference, or an agent assumption conflicts with an official current GE Vernova Hitachi source, **the official current source wins**.

Do not invent unknown dimensions merely to fill space. Use visually plausible proportions and mark them internally as `educational approximation`.

---

# 4. What the audience must understand

After watching the 45–50 second sequence, a person with no nuclear background should understand four ideas:

1. **The reactor does not directly produce electricity. It produces heat.**
2. **Heat boils water; steam drives a turbine; the turbine drives a generator.**
3. **The chain reaction is controlled by neutron-absorbing control blades.**
4. **The BWRX-300 uses natural circulation and passive heat-removal concepts to simplify important parts of the plant.**

Do not require the audience to understand:
- alpha/beta/gamma radiation,
- neutron energy spectra,
- enrichment details,
- thermal-hydraulic equations,
- reactor kinetics,
- boron chemistry,
- detailed emergency operating procedures,
- licensing terminology.

These can exist as optional technical annotations in Explore Mode, but they must never interrupt the main story.

---

# 5. Visual direction

The visual language should combine:

- **70% premium product cinematography**
- **20% realistic industrial/architectural visualization**
- **10% futuristic engineering overlay**

The target feeling is:

> **Apple made an interactive documentary explaining a real nuclear reactor.**

## Product-cinematography qualities
- dark or near-black neutral background,
- controlled pools of light,
- large amounts of visual breathing room,
- deliberate camera movement,
- minimal UI,
- strong silhouette and composition,
- no unnecessary HUD clutter.

## Architectural qualities
- believable industrial scale,
- materials that read as steel, concrete, water, insulation, glass, and painted equipment,
- realistic relative proportions,
- restrained reflections,
- physically believable lighting.

## Futuristic overlay qualities
Use sparingly for:
- component outlines,
- flow visualization,
- translucent X-ray shells,
- labels,
- energy paths,
- neutron/fission visualization,
- control-state indication.

Avoid:
- neon cyberpunk styling,
- holographic overload,
- sci-fi reactor cores,
- impossible glowing uranium,
- decorative particle effects that imply incorrect physics.

---

# 6. Runtime and delivery strategy

The university machine is unknown. Public VILNIUS TECH information confirms S4 is an auditorium building, but no reliable public hardware specification should be assumed.

Therefore design for **unknown integrated graphics**.

## Primary renderer
Use **WebGL 2**, not WebGPU as a requirement.

Recommended stack:
- Vite
- React
- TypeScript
- Three.js
- React Three Fiber
- Drei where useful
- GSAP for deterministic camera/sequence animation
- Zustand or a similarly small state layer if a state store becomes justified

Avoid adding large dependencies without a clear reason.

## Three delivery levels

### Level A — Full interactive
Hosted static web build, opened in current Chrome/Edge.

Includes:
- realtime camera movement,
- X-ray,
- clipping/cutaway,
- component highlighting,
- animated flow,
- presentation mode,
- explore mode.

### Level B — Low-quality interactive
Exactly the same scene/story, but with expensive visual features disabled.

Must be activatable manually with a visible setup control and query parameter, e.g.

`?quality=low`

Low mode should prefer reliability over beauty.

### Level C — Video fallback
A pre-rendered **1080p, 30 fps, H.264 MP4** of the final 45–50 second cinematic sequence.

The final presentation package must contain this video independently of the WebGL app.

The fallback video is not optional. It is part of the definition of done.

## Recommended physical delivery
Use:
1. **USB drive as the primary local backup**.
2. A hosted copy as the convenient primary launch path.
3. Google Drive or similar as a second backup.
4. The H.264 fallback video stored both on the USB and in cloud storage.

Do not make the live presentation depend on university Wi-Fi.

## Offline build
The project should eventually provide either:
- a single-file/portable static build that can be opened locally, or
- a clearly tested offline package that does not depend on CDN assets.

All libraries and critical assets must be bundled locally.

---

# 7. Performance budget

Optimize for a 1920×1080 projector/display on unknown integrated graphics.

## Full mode target
- 45–60 fps on a modern development machine.
- Prefer stable frame pacing over maximum image quality.

## Low mode target
- **minimum goal: stable 30 fps** on older integrated graphics.
- pixel ratio clamped to approximately 1.0.
- no expensive screen-space effects.
- no high-resolution dynamic reflections.
- minimal or disabled realtime shadows.
- reduced particle counts.
- reduced geometry detail where not visible.
- static baked-looking lighting where practical.

## Geometry guidance
Use instancing aggressively.

Do not model 240 fuel bundles × every fuel rod as thousands of independent React components.

Prefer:
- instanced meshes,
- merged geometry,
- LOD,
- simplified distant geometry.

Suggested scene budgets, not hard engineering limits:
- normal mode: roughly <= 250k visible triangles for the hero scene where possible,
- low mode: roughly <= 100–150k visible triangles where possible.

The most important metric is measured frame time on weak hardware, not the theoretical triangle count.

## Texture guidance
- Prefer procedural/basic PBR materials where possible.
- Avoid 4K textures.
- 1K–2K textures should be sufficient for hero materials.
- Use compressed textures only if they materially improve loading/runtime.
- Avoid giant HDR environments; use compact environment lighting or procedural studio lighting.

---

# 8. Scene hierarchy

A suggested logical hierarchy:

```text
SMRScene
├── Environment
│   ├── Ground
│   ├── MinimalSiteContext
│   └── LightingRig
│
├── Plant
│   ├── ReactorBuilding
│   │   ├── OuterStructure
│   │   ├── Containment
│   │   ├── IsolationCondenserPools
│   │   └── ReactorPressureVessel
│   │       ├── VesselShell
│   │       ├── CoreShroud
│   │       ├── Core
│   │       │   ├── FuelBundleRepresentation
│   │       │   └── ControlBlades
│   │       ├── Chimney
│   │       ├── SteamSeparators
│   │       ├── SteamDryer
│   │       └── VesselHead
│   │
│   ├── SteamPath
│   │   ├── MainSteamLine
│   │   └── Return/FeedwaterConceptPath
│   │
│   └── TurbineBuilding
│       ├── Turbine
│       ├── Generator
│       └── CondenserSimplified
│
├── VisualizationLayers
│   ├── CoolantFlow
│   ├── SteamFlow
│   ├── ElectricalFlow
│   ├── FissionVisualization
│   ├── SelectionOutline
│   └── Labels
│
└── CameraRig
    ├── PresentationCamera
    └── ExploreControls
```

This is a logical hierarchy. It does not require one file per node.

---

# 9. Component importance levels

## Tier 1 — essential to the spoken story
These must be modeled clearly enough to highlight independently.

1. Reactor building / containment context
2. Reactor pressure vessel
3. Reactor core / fuel region
4. Control blades
5. Natural-circulation chimney
6. Steam separator region
7. Steam dryer region
8. Main steam line
9. Turbine
10. Generator
11. Isolation condenser / passive heat-removal path

## Tier 2 — useful supporting elements
- condenser,
- feedwater return path,
- core shroud,
- downcomer region,
- vessel head,
- control-rod drive region,
- generator output / grid abstraction,
- simplified cooling-water context.

## Tier 3 — optional
Only add if they improve the story without adding noise.
- refueling equipment,
- spent-fuel systems,
- service systems,
- detailed instrumentation,
- auxiliary buildings,
- full cooling-tower/cooling-water infrastructure,
- switchyard detail.

---

# 10. Required visual modes

## Normal Mode
Architectural/product visualization.

## X-ray Mode
Outer building/containment/vessel shells become translucent while internals remain readable.

Requirements:
- avoid simple global opacity that makes the image visually muddy,
- maintain depth hierarchy,
- use selective transparency,
- consider dithered transparency or deliberate material swaps if conventional blending produces sorting artifacts.

## Section / Cutaway Mode
Use one or more animated clipping planes so the viewer can slice through the reactor/plant.

Requirements:
- clipping should be smooth,
- cut surfaces should remain visually understandable,
- avoid exposing ugly backfaces,
- if true cap geometry becomes too expensive, use a convincing educational approximation.

## Flow Mode
Show separate visual languages for:
- liquid water,
- steam,
- electricity.

Do not use identical particles for all three.

## Control Mode
Animate control blades and corresponding abstract fission intensity.

## Safety Mode
Dim the ordinary turbine-power path and highlight the passive isolation-condenser heat-removal path.

---

# 11. Interaction model

The module must be usable with a mouse on a classroom PC.

## Explore Mode interactions
- orbit,
- zoom,
- limited pan,
- click component to select,
- hover highlight,
- focus camera on selected component,
- isolate selected component,
- toggle label,
- X-ray toggle,
- clipping toggle,
- flow toggle,
- reset camera.

## Keyboard shortcuts
Keep them simple and documented in a hidden/help panel.

Suggested:
- `Space` — play/pause cinematic
- `R` — reset
- `X` — X-ray
- `C` — cutaway
- `F` — flow
- `S` — safety mode
- `Esc` — exit focused component
- `1` — normal quality
- `2` — low quality

Do not require keyboard interaction during the main live sequence.

---

# 12. Camera philosophy

Camera movement is a core feature, not polish.

Avoid:
- abrupt OrbitControls jumps,
- excessive spinning,
- long dramatic moves that waste speaking time,
- camera paths that pass through opaque geometry accidentally.

Prefer:
- slow acceleration/deceleration,
- confident straight or gently curved paths,
- clear focus target changes,
- cinematic dolly movement,
- intentional object reveals.

The camera system should use named states/targets.

Example:

```ts
type CameraState =
  | "plantExterior"
  | "reactorBuilding"
  | "containment"
  | "pressureVessel"
  | "core"
  | "steamRegion"
  | "turbine"
  | "generator"
  | "controlBlades"
  | "isolationCondenser"
  | "finalPlant";
```

Camera transitions must be deterministic in Presentation Mode.

---

# 13. Main cinematic sequence

Target duration: **48 seconds**.

A few seconds of flexibility are allowed after narration testing, but do not exceed 55 seconds without an explicit decision.

## 0–6 s — Scale and context
**Visual:** full plant/power-block exterior.

Minimal overlay:
- `BWRX-300`
- `300 MW class SMR`

Purpose:
Establish that this is a complete power station, not a small box containing a reactor.

## 6–12 s — Reveal the reactor
Camera approaches the reactor building.

Outer architecture transitions into X-ray/cutaway mode.

Highlight the reactor pressure vessel.

Purpose:
Move from “power plant” to “where nuclear heat is made.”

## 12–20 s — Core and fission
Camera moves toward the lower core region.

Reveal:
- fuel-bundle region,
- control blades,
- restrained fission/neutron abstraction.

Purpose:
Show that fission releases heat in the fuel.

Do not attempt literal atomic-scale physics inside the same world scale. Use an abstract inset/transition if necessary.

## 20–30 s — Natural circulation and steam generation
Pull slightly back to show vessel internals.

Animate:
- water moving upward through the core,
- steam-water mixture rising,
- separator region,
- water returning downward,
- dry steam exiting.

Purpose:
This is the most important technical visualization.

## 30–38 s — Turbine and generator
Camera follows steam along the main steam path.

Show:
- turbine rotation,
- generator rotation/coupling,
- abstract electrical output leaving the generator.

Purpose:
Complete the chain from nuclear heat to electricity.

## 38–43 s — Control
Fast but clear transition back to the core.

Animate control blades moving farther into the core.

Reduce abstract fission intensity.

Purpose:
Show in one visual idea how reactor power is controlled.

## 43–48 s — Passive safety and final pullback
Normal power-flow visuals fade.

Highlight the isolation-condenser heat-removal path briefly.

Camera pulls back toward the reactor/plant.

Purpose:
End on the design idea of passive heat removal and transition naturally to the next presentation section.

---

# 14. Presentation narration constraint

The final 48-second sequence should support approximately **90–110 spoken words**, depending on speaker pace.

The visuals must carry information so narration does not need to describe every component name.

Do not put paragraph text on screen.

Labels should generally be one to three words:
- Reactor core
- Control blades
- Natural circulation
- Steam separator
- Turbine
- Generator
- Passive cooling

The final narration will be written only after the visual timing is stable.

---

# 15. Fission visualization

This is an explanatory layer, not an atomically accurate simulation.

A suitable visual:
1. one neutron approaches a stylized U-235 nucleus,
2. nucleus splits,
3. energy pulse/heat cue appears,
4. 2–3 new neutron paths leave,
5. the view quickly returns to the reactor scale.

Do not emphasize alpha/beta/gamma radiation in the main sequence.

The audience takeaway is:
**fission produces heat and more neutrons, creating a controlled chain reaction.**

Avoid making the uranium physically glow in the actual fuel assemblies.

---

# 16. Flow visualization

## Water
Use restrained cool-toned translucent ribbons/particles/arrows.

## Steam
Use lighter, faster, more diffuse flow cues.

## Electricity
Use a thin luminous path/pulse leaving the generator, not lightning bolts.

## Natural circulation
This must visually show two directions:
- upward flow through core/chimney region,
- downward return flow through the outer region.

This is more important than particle density.

---

# 17. Materials and lighting

## Reactor vessel
- brushed/matte industrial steel,
- not mirror chrome.

## Internals
- distinguish core, chimney, separators, and dryer through subtle material differences rather than rainbow coloring.

## Building
- dark concrete/steel palette,
- readable silhouette,
- simplify small architectural detail.

## Highlight state
Use one consistent accent treatment across the entire project.

Do not permanently assign a different bright color to every system. That will make the scene look like an engineering training diagram rather than premium cinematography.

## Lighting
Prefer a controllable studio/architectural rig:
- key light,
- soft fill,
- edge/rim light,
- limited practical lights.

The reactor should remain legible when projector contrast is poor.

---

# 18. UI design

UI should disappear during the main cinematic except for minimal labels.

Explore Mode UI can include a compact panel with:
- Presentation / Explore
- X-ray
- Section
- Flow
- Safety
- Quality
- Reset

Use large click targets appropriate for projector use.

No glassmorphism overload.

No scrolling sidebar full of technical specifications during the main experience.

---

# 19. Quality presets

Implement a single centralized quality configuration.

Example shape:

```ts
type QualityPreset = {
  pixelRatio: number;
  shadows: boolean;
  shadowMapSize: number;
  particlesMultiplier: number;
  postprocessing: boolean;
  bloom: boolean;
  geometryLod: "low" | "high";
};
```

At minimum:
- `high`
- `low`

The application must not scatter quality-condition logic throughout unrelated components.

---

# 20. Reliability requirements

The module is for live public speaking, so failure handling matters.

Required:
- loading screen,
- clear “ready” state,
- error boundary,
- fallback message if WebGL 2 is unavailable,
- keyboard reset,
- deterministic cinematic restart,
- no network requests for critical runtime assets after initial deployment package is loaded,
- no dependency on external fonts/CDNs,
- no autoplay audio requirement,
- no login/authentication.

If a non-critical optional visual fails to load, the rest of the module should continue.

---

# 21. Repository structure

A suggested structure:

```text
smr-bwrx300/
├── PROJECT.md
├── README.md
├── references/
│   ├── technical/
│   │   └── bwrx300-general-description.pdf
│   ├── images/
│   │   ├── reactor-vessel-reference/
│   │   ├── core-reference/
│   │   ├── plant-exterior-reference/
│   │   └── passive-safety-reference/
│   └── SOURCES.md
│
├── public/
│   └── assets/
│
├── src/
│   ├── app/
│   ├── scene/
│   ├── components/
│   ├── systems/
│   ├── animation/
│   ├── camera/
│   ├── state/
│   ├── ui/
│   ├── config/
│   └── utils/
│
├── fallback/
│   └── bwrx300-cinematic-1080p.mp4
│
└── package.json
```

Do not create directories merely to satisfy this example. Keep the real structure as small as practical.

---

# 22. Reference material to download

## Essential source 1 — Official BWRX-300 General Description
GE Vernova Hitachi, current public BWRX-300 General Description.

URL:
https://www.gevernova.com/content/dam/gevernova-nuclear/global/en_us/documents/carbon-free-power/005N9751_Rev_BWRX-300_General_Description.pdf

Place at:
`references/technical/bwrx300-general-description.pdf`

Priority figures/sections to inspect:
- key-features table containing RPV dimensions, fuel bundles, and control-rod count,
- Figure 3-1: BWRX-300 Reactor Pressure Vessel and Internals,
- Figure 3-2: Cutaway View of Reactor Core,
- Figure 3-7: Fine Motion Control Rod Drive,
- Figure 3-8: Isolation Condenser System,
- reactor internals description,
- core configuration,
- isolation condenser system.

If the coding agent cannot visually inspect the PDF well, save screenshots of these figures into `references/images/`.

## Essential source 2 — Official technology overview
https://www.gevernova.com/nuclear/uk-smr/smr-technology

Use for:
- 300 MWe / 870 MWth overview,
- natural circulation,
- 240 fuel bundles,
- passive safety overview.

## Essential source 3 — Official BWRX-300 product page
https://www.gevernova.com/nuclear/carbon-free-power/bwrx-300-small-modular-reactor

Use for:
- current project context,
- public-facing plant claims,
- exterior visual references,
- scale.

## Optional source 4 — OPG Darlington SMR project
https://www.opg.com/projects-services/projects/nuclear/smr/darlington-smr/

Use primarily for:
- real construction/site visual references,
- context that BWRX-300 deployment is not purely conceptual.

## Reference-use rule
Images from manufacturer/operator pages may be used as **visual reference material** for building an original educational 3D model. Do not automatically ship copied website imagery inside the final presentation.

---

# 23. Model-building strategy

Do **not** begin with Blender.

First create the system procedurally from code using:
- cylinders,
- lathed vessel profiles,
- instancing,
- simple pipes/curves,
- low-detail building masses,
- procedural materials.

Reasons:
- easier parameter adjustment,
- easier component isolation,
- easier animation,
- easier clipping,
- easier quality reduction,
- easier code review by another coding agent.

Only introduce Blender/GLB assets later if a specific component genuinely cannot reach the required visual quality procedurally.

The first goal is **correct hierarchy and cinematic readability**, not manufacturing geometry.

---

# 24. Development stages

Each stage must be considered a review gate.

Do not continue automatically into the next major stage unless the current stage is stable.

## Stage 0 — Reference lock and technical plan
Deliverables:
- project scaffold plan,
- source inventory,
- reactor component map,
- camera-state plan,
- performance plan,
- assumptions list.

No visual overbuilding.

Success condition:
Another developer can explain what will be built and which claims are sourced vs approximated.

## Stage 1 — Renderer foundation
Build:
- Vite + React + TypeScript,
- R3F canvas,
- WebGL2 capability check,
- camera,
- lighting rig,
- OrbitControls for Explore Mode,
- quality preset config,
- resize/fullscreen robustness,
- FPS/debug panel hidden behind dev flag.

Use placeholder geometry only.

Success condition:
A stable empty industrial/product scene works at 1080p.

## Stage 2 — Plant massing
Build simplified:
- ground/site,
- reactor building,
- turbine building,
- reactor vessel placeholder,
- turbine/generator placeholder,
- main steam path.

Focus on composition and scale.

Success condition:
Exterior hero shot and major spatial relationships are convincing.

## Stage 3 — First production-quality 10-second shot
Polish only:
**plant exterior → reactor building → X-ray → reactor vessel reveal**

This becomes the project's visual-quality benchmark.

Do not polish the whole plant yet.

Success condition:
User approves lighting, camera language, material language, X-ray effect, and perceived quality.

## Stage 4 — Reactor pressure vessel internals
Build:
- vessel profile,
- core region,
- fuel-bundle representation,
- control blades,
- shroud,
- chimney,
- steam separators,
- steam dryer,
- key nozzles only where useful.

Success condition:
A cutaway reads correctly to a non-engineer.

## Stage 5 — Interaction architecture
Implement generic:
- selectable component registry,
- hover,
- selection,
- focus camera,
- label binding,
- isolate,
- highlight,
- X-ray,
- section plane,
- reset.

Success condition:
Adding future components requires configuration rather than rewriting interaction logic.

## Stage 6 — Cinematic camera system
Implement named camera states and deterministic GSAP timeline.

Build the complete 48-second camera skeleton using simple animation cues.

Success condition:
The story can be watched end-to-end before detailed flow effects exist.

## Stage 7 — Normal operating flow
Animate:
- reactor heat cue,
- upward coolant flow,
- steam-water region,
- separator behavior abstraction,
- downward water return,
- steam to turbine,
- turbine/generator,
- electrical output.

Success condition:
A first-time viewer can correctly describe the energy path after watching once.

## Stage 8 — Control sequence
Animate:
- control blade movement,
- corresponding abstract reaction-intensity change.

Success condition:
Viewer understands “more insertion = less reaction/power” without a paragraph of text.

## Stage 9 — Passive-safety sequence
Build a simplified isolation-condenser representation and flow path.

Success condition:
Viewer understands that decay heat can be transferred away without presenting the ICS as a magical emergency generator.

## Stage 10 — Fission inset
Create restrained educational fission visualization.

Success condition:
It supports the core explanation without making the project look like a science-fiction interface.

## Stage 11 — Optimization and compatibility
Test:
- Chrome,
- Edge,
- 1920×1080,
- low quality,
- reduced motion if needed,
- integrated-graphics target where available.

Add:
- quality selection,
- FPS-informed recommendations,
- graceful WebGL failure.

Success condition:
Low mode remains presentation-worthy at stable frame rate.

## Stage 12 — Fallback export
Record/export the exact 45–50 second cinematic as:
`fallback/bwrx300-cinematic-1080p.mp4`

H.264, 1080p, 30 fps.

Success condition:
The entire presentation sequence can be shown even if realtime 3D fails.

---

# 25. What NOT to do in early stages

Do not:
- build the entire reactor in Stage 1,
- use WebGPU-only features,
- download random reactor CAD models,
- use a generic PWR model while calling it BWRX-300,
- spend time on microscopic fuel-pin geometry before camera/story are approved,
- add dramatic bloom everywhere,
- add cooling towers by default,
- assume every nuclear plant visually requires a giant hyperboloid cooling tower,
- create hundreds of React mesh components for repeated geometry,
- use unverified AI-generated technical diagrams as authority,
- turn the UI into a game HUD,
- write the full public-speaking presentation yet.

---

# 26. Acceptance criteria for the finished module

The finished module is acceptable only if all are true:

### Story
- A non-engineer can explain the basic energy chain after one viewing.
- The sequence remains under roughly 50 seconds unless intentionally revised.
- The reactor itself is visually distinct from the entire power plant.

### Accuracy
- It is recognizably based on the BWRX-300 architecture.
- Major internal relationships are not knowingly incorrect.
- Control blades are not shown behaving opposite to their educational effect.
- Main direct-cycle steam path is not depicted like a pressurized-water-reactor secondary loop.

### Visual quality
- First frame looks presentation-ready.
- Cutaway/X-ray remains readable.
- Camera motion feels deliberate.
- Minimal UI.
- No obvious low-quality stock 3D assets.

### Performance
- Low-quality preset exists.
- Critical assets are bundled.
- Presentation sequence can restart deterministically.
- Fallback MP4 exists.

### Maintainability
- Major components have stable IDs.
- Camera states are data-driven.
- Quality settings are centralized.
- Sequence timing is editable without rewriting scene components.

---

# 27. Review protocol

After each stage, the coding agent should report:

1. What was implemented.
2. What files changed.
3. What assumptions were made.
4. What is still placeholder geometry.
5. Any performance measurements available.
6. Any deviations from `PROJECT.md`.
7. Screenshots or a short capture if visual review is necessary.
8. What should be reviewed before the next stage.

Do not silently reinterpret a technical requirement.

---

# 28. Multi-agent workflow

Recommended workflow:

## Primary builder
Claude Code with the strongest available coding/reasoning configuration.

Responsibilities:
- architecture,
- implementation,
- iteration,
- visual system.

## Reviewer
Codex / another strong coding agent.

Responsibilities:
- inspect repository,
- identify architectural issues,
- identify performance hazards,
- check whether visualization logic conflicts with official reference material,
- find duplicated or brittle code,
- verify presentation-safe fallback logic.

The reviewer should review the existing implementation, not independently rebuild the entire application unless specifically asked.

---

# 29. Immediate next action

Read this file and the available official references.

Then execute **only Stage 1 — Renderer foundation**.

Do not create detailed reactor geometry yet.

Before coding, write a concise implementation plan containing:
- packages to install,
- proposed file structure,
- renderer settings,
- camera/control setup,
- quality configuration,
- how WebGL2 failure will be handled,
- how the code will remain ready for deterministic cinematic camera control later.

Then implement Stage 1.

At the end, run the project, verify there are no console/runtime errors, and provide the Stage 1 review report described above.
