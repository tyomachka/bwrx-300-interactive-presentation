# Stage 8: reactor control, review report

Status: **implemented, not committed** (awaiting visual review). Stage 9 not started.

- **Checkpoint before this stage:** Stage 7 was committed as
  `a0f25622b679d027c31c390f56604a292cce7aa8` ("Stage 7: normal operating flow (approved)"),
  exactly the reviewed tree (verified: the files matched the Stage 7 report's list and none was
  newer than the report; `npm run check` passed). The approved commits for Stages 1–7 and the
  navigation polish are untouched.
- **Build:** `npm run check` (typecheck, lint, production build) passes. There are no new
  console errors and no external requests in any run. The only console line is three.js's
  existing `THREE.Clock` deprecation warning, present in Stage 7 too.
- **Measurement setup:** every measurement used the Stage 6/7 laptop (Intel Iris Plus), the
  production build, 1920×1080, and headless Chrome with D3D11. The baseline is the Stage 7
  production build, served alongside the new one; measurements were run one at a time, never
  in parallel.

**The story in one line:** the copper blades rise from below farther between the fuel
assemblies, and the sparks of nuclear activity on the fuel and the boiling in the upper core
thin out; the water keeps flowing.

## Deliverables (this folder)

| File | What |
|---|---|
| `stage8-control-1080p.mp4` | The full master sequence: 48.0 s, 1441 frames, 30 fps, H.264 High, yuv420p, no audio. Fixed-step export (each frame advances exactly 1/30 s). |
| `stage8-control-focus-36.5-41.5s-1080p.mp4` | The control chapter only: frames 1095–1245 (36.5–41.5 s), 5.0 s, no audio. |
| `01-control-before-1080p.png` | 38.9 s: the blade close-up just before the insertion; the base pattern, full activity. |
| `02-blades-moving-1080p.png` | 39.77 s (frame 1193): half-way through the insertion. |
| `03-control-after-1080p.png` | 41.2 s: the blades held deeper; few glints, few bubbles; the water still flowing. |
| `04-reaction-before-1080p.png` | 38.9 s, magnified (the same master frame rendered at device scale 2, cropped to the upper core): the activity cue at its base level. |
| `05-reaction-after-1080p.png` | 41.2 s, magnified the same way: the activity cue at its lower level, blades in front of the fuel. |
| `06-low-control-1080p.png` | 39.77 s on **Low**: the same story (fewer streamlines and glints). |
| `07-explore-control-1080p.png` | Explore Control at the blade view, with the panel and its Control slider (slider at 0.7). |
| `08-before-after-comparison-1080p.png` | Before / after, High and Low (38.9 s and 41.2 s). |
| `explore/01`–`06` | Explore Control: base pattern; inserted; with Flow at base and inserted; the blades selected; the blades isolated. |

Exported frames 1167, 1193 and 1236 are pixel-identical to stills `01`, `02` and `03`, which
were captured by seek.

## 1. Source and accuracy basis

Authority: GE Vernova Hitachi, *BWRX-300 General Description* 005N9751 **Rev J** (June 2026),
the newest official source in `references/technical/`. Re-read for this stage:

| Fact used | Source |
|---|---|
| 57 cruciform control blades, B4C or Hf absorber | Table 2-1 |
| 57 FMCRDs "mounted in housings welded into the RPV bottom head"; a hollow piston coupled at its upper end to the bottom of the control rod, moved "up or down, both in fine increments and continuously" by a motor-driven ball screw | §3.2 |
| The FMCRDs "are leveraged for power changes and shimming during the course of normal operations"; selected banks of rods can also be driven in rapidly (SCCRI, "Selected Control Rod Rapid Insertion") | §3.2 |
| The orificed fuel supports "guide the control rod blade as it raises or lowers to respectively decrease or increase reactor power", keeping it "aligned between the four bundles" | §3.1.1.1 |
| The guide tubes channel water to the control rods "as they move up and down within the core to change the reactor power levels" | §3.1.1.1 |
| "In all but 12 peripheral locations, fuel bundles are arranged in a four-bundle grouping around a control blade" | §4.2, Fig 4-1 |
| The CRD housing is stationary; only the hollow piston (and the blade on it) moves | Fig 3-7 |
| Normal power changes run at 0.5 %/min (50–90 %) to 2 %/min (90–100 %) | §3.2, §16.1 |

What follows from it:
- **Direction.** Insertion is upward, from the bottom-mounted drives into the active core.
  Raising a blade lowers the power; lowering it raises the power.
- **Path.** A blade only moves vertically, in the cruciform gap between the four channels of
  its cell. Nothing moves sideways through the fuel.
- **Drives.** The housings and motor units below the bottom head do not move, and no piston
  travel is drawn: the GD shows the piston inside the housing, out of sight.

**No published rod sequence.** The GD publishes no normal-operation rod sequence or rod
pattern, and neither does the older NEDO-34163 in the same folder (it describes "normal
insertion and withdrawal" in general terms only).

## 2. Representative-motion disclaimer

**[EDUCATIONAL REPRESENTATIVE MOTION]** The blade motion in the presentation and in Explore
Control is a representative educational motion. It is not the BWRX-300 rod pattern or rod
sequence and must not be presented as one. Its three representative choices:
- **The starting pattern** is the approved Stage 4 base pattern, itself marked `[APPROX]` in
  `coreLayout.ts`: 9 blades partly in (0.35), 48 withdrawn.
- **Every blade moves at once,** each the same distance farther in.
- **Time-compressed.** The move takes 1.7 s; the GD's normal power changes run at 0.5–2 % of
  power per minute.

The tag is in the code where the motion is defined (`config/control.ts`,
`animation/reactorControl.ts`, `rpv/coreLayout.ts`) and in the README.

## 3. Blade insertion mapping

```
insertion_i(t) = base_i + bladeControlAmount(t) * (target_i - base_i)
target_i       = base_i + shift,   shift = 0.5 of the stroke (1.9 m)   (config/control.ts CONTROL_TARGET)
                 shift clamped so that no blade of the base pattern passes full insertion
```

| Blades | Base (Stage 4 operating pattern) | Target | Absorber tip above the bottom of the fuel |
|---|---:|---:|---|
| 9 (the centre, the four (±3, 0)/(0, ±3) cells, the four (±2, ±2) cells) | 0.35 | 0.85 | 1.33 m → 3.23 m of 3.8 m |
| 48 (all others) | 0 | 0.5 | 0 (below the fuel) → 1.90 m |

- **Base pattern kept.** Every blade moves the same 1.9 m, so the base pattern's relative
  variation is kept exactly; it is not one identical height. No blade is fully in: this is a
  power reduction, not a shutdown.
- **Why a shared distance and not the brief's example `base + k (1 - base)`.** The first build
  used that example (k = 0.5, the 9 base blades ending at 0.675). It moves each blade a
  different distance, so the 57 instance matrices had to be re-uploaded every frame of the
  motion. On this machine that upload alone cost 3–4 fps on High: measured on a held frame,
  39 → 35 fps with nothing changed but the per-frame upload (§9). A shared distance is one
  rigid translation of the single instanced batch (its `position.y`): no instance data changes
  while the blades move, no extra draw call, and picking, culling and the section cut follow
  through the object matrix. The visible difference is that the 9 base blades end deeper (0.85
  instead of 0.675).
- **What the camera sees.** The blades on the two cut faces rise from just below the fuel to
  about half its height: most of the 48 come up out of their guide tubes into the core for the
  first time.
- **Layered on any base.** `setBladeInsertion(pattern)` still sets the base (the master sets
  `operating` on every start; the Stage 4 review states set `partial` / `withdrawn`).
  `setBladeControl(amount)` moves every blade from that base towards its target. With amount 0
  the batch is not moved at all (`position.y` = 0), so the base frames are unchanged.

**Presentation timing** (master time; keys on the Stage 6 control events):

| Time (s) | Blades | Reaction cue | Camera (unchanged Stage 6 keys) |
|---|---|---|---|
| 36.5–37.6 | base pattern | off | leaving the generator, back towards the vessel (`masterReturn` 37.3) |
| 37.6–38.5 | base pattern | fades in at its full (base) level | into the opened vessel, the core in view |
| 38.5–38.9 | base pattern | full: many glints, full boiling | arriving at the blade close-up |
| 38.9–40.6 | **insertion**, smootherstep 0 → 1 | falls with the insertion | `masterBlades` 39.1, then a slow drift |
| 40.6–41.5 | held at the target | held low (0.3) | `masterBladesHold` 41.2 |
| 41.5–42.7 | held | the cue layer fades as the camera backs out; the value stays 0.3 | to `masterSafetyExit` 42.4 |
| 42.7–48 | held (hidden once the vessel closes, 43.4–45.0) | off | safety chapter, final |

- **Why 38.9 s and not 38.0 s.** The recommended schedule started the insertion at 38.0 s. At
  38.0 s the camera is still outside the vessel, where the core is a narrow slot; it enters the
  core view at about 38.6 s and reaches the blade pose at 39.1 s. The Stage 6 `controlAction`
  event is 39.2 s. So the insertion starts 0.3 s before `controlAction`, while the camera is
  settling on the blades, and is complete by 40.6 s.
- **Timing rules.** The insertion, the hold and every timing shift stay inside 36.5–41.5 s, and
  no camera key moved. What continues after 41.5 s (blades held, the cue fading as the camera
  leaves, the water still circulating) is open decision 1 (§13).
- **No snapping.** Smootherstep has zero speed and zero acceleration at both ends.
- **Handoff to Stage 9.** The blades are not restored before the safety chapter.

## 4. Reaction / activity cue

**State** (`animation/reactorControl.ts`):

```ts
type ReactorControlState = {
  source: 'off' | 'presentation' | 'explore';
  time: number;               // cue clock: master time, or the animation clock in Explore
  bladeControlAmount: number; // 0 base pattern .. 1 deeper pattern
  reactionIntensity: number;  // abstract educational cue: 1 -> 0.3; not MW, not %
  activity: number;           // 0..1 visibility of the cue layer (presentation fade / Explore hierarchy)
  emphasis: number;           // Explore Control's copper blade emphasis
};
reactionIntensity = 1 - (1 - 0.3) * bladeControlAmount
```

- **What the mapping claims.** It is an educational visual mapping: more insertion, less
  reaction. It is not a physical simulation, there are no units, and no reactor kinetics is
  implied.
- **The low value.** 0.3 was chosen so that the "after" image still clearly shows a running,
  but weaker, reaction.
- **One mapping everywhere.** The cinematic and Explore use the same mapping and the same
  layer, so Stage 10 can drive the layer too.

**Visual language** (`scene/control/activityMaterial.ts`):
- **Glints.** Sparse, tiny, short-lived warm-white flashes (`#fff3dc`):
  - about 5.5 cm across, at least 4.5 px on screen;
  - a 0.05 s rise and a 0.34 s fade;
  - a thin darker rim, so a flash reads on the light channels without any halo.
- **Where.** On the fuel faces the vessel quarter cut exposes: the 2 × 9 channel faces just
  behind the cut planes x = 0 and z = 0, between the bottom and top of the active fuel.
- **Behind the blades.** The glints sit 5.2 mm behind the cut plane: behind the cut blade
  wings (3.95 mm half thickness) and in front of the channels (6.65 mm). A blade in front of the
  fuel therefore hides them, by the depth test alone.
- **Less reaction, fewer flashes.** A slot flashes when a seeded hash is below
  `reactionIntensity`, so the count follows the cue smoothly. Below a blade's absorber tip only
  15 % remain (the blade absorbs the neutrons there), fading back over 0.2 m above the tip.
- **What it is not.** No neutron paths, no atoms, no trajectories, no lightning, no flames.
  There is no glow on the fuel: the fuel material is untouched, nothing is additive, and
  everything goes through the normal tone mapping. The cue reads as more or less activity
  rather than glowing uranium: individual events, not a lit surface.
- **Determinism.** Every glint is a pure function of the cue clock. Slot = `gl_InstanceID`;
  cycle = `floor(time / period + phase)`; position, size and choice come from an integer
  PCG hash of (slot, cycle), so every GPU gives the same glints; periods are seeded on the CPU.
  Master time is quantised to 1 µs, as in Stage 7.
- **Cost.** One instanced quad per slot: High 560, Low 336 (`particlesMultiplier` with a 0.6
  floor, so Low still tells the story). One draw call, no texture. Nothing is drawn while the
  cue is off (mesh hidden). Per frame the CPU writes about 15 uniforms.

## 5. Relationship to the Stage 7 flow

| Channel | 36.5–37.6 | 37.6–38.5 | control beat | after 41.5 |
|---|---|---|---|---|
| Power side (steam line, turbine, generator, electricity) | Stage 7 fades, unchanged | off | off | off |
| Core water (rising, at the cut faces) | off | fades in to 0.4 | **0.4, steady** | 0.4 until the vessel starts closing (43.4), gone by 44.2 |
| Downcomer return (the two cut slots) | off | fades in to 0.3 | **0.3, steady** | as the core water |
| Boiling cue in the upper core (`boilShare`) | 1 | 1 | **follows `reactionIntensity`: 1 → 0.3** | 0.3 |
| Chimney, separators, dryer, steam outlet | off | off | off | off |

- **The distinction the brief asks for.** The blades reduce the heat made in the fuel; they do
  not stop the water already circulating:
  - fewer of the core's streaks turn into bubbles, and the mixture pales less;
  - the water's intensity and speed do not change.
- **The downcomer slots** are at the edges of the blade close-up. Their slow return streaks keep
  the circulation readable without competing with the blades in the centre.
- **No separator / turbine / electricity sequence** is reactivated.
- **The shader change is exact.** One uniform, `uBoilShare`, scales the bubble share and the
  mixture paling of the core channel only. At 1 it multiplies by exactly 1.0, so Stage 7's
  frames are unchanged (verified, §11).
- **The face streams leave with the cut.** They need the vessel fully open, so they disappear as
  the vessel closes at 43.4 s: the camera loses sight of them, not the water stopping.
- **Explore Flow + Control.** The core's boiling follows the slider; the turbine and generator
  flow does not. Measured: Flow on, slider 0 → 1 changes `boilShare` 1.0 → 0.30, while core
  water and turbine stay 0.9.

## 6. Handoff to Stage 9

`CONTROL_HANDOFF` (`config/control.ts`) is what Stage 9 inherits at `controlExit` (41.5 s) and
after; `presentationControlAt(t)` gives the same values at any later time:
- **Blades:** at the target pattern, `bladeControlAmount` 1. They are not restored.
- **Reaction cue:** `reactionIntensity` 0.3. It is reduced, not zero: no scram is shown. The
  cue layer is faded out with the camera at 41.9–42.7; the value itself stays.
- **Water:** the core water and downcomer return are still circulating until the vessel closes.

That is the state the passive-cooling chapter needs: the reaction is weaker but heat is still
being made, and it still has to be removed. No decay heat, temperature or cooling is shown.
Stage 9 can take the reaction to shutdown, show ICS flow, or leave it.

## 7. Explore Control

- **Control button** in the Explore panel (`aria-pressed`, tooltip "Shortcut: O"), after Flow,
  and the `O` key. `B` stays the Stage 4 review key. Like every Explore input it is ignored
  while a presentation owns the scene, and the live presentation never needs it.
- **On:**
  - it opens Section → Reactor (if not already open) and moves the camera to the control-blade
    view with the normal focus transition (1.1 s);
  - one slider appears, using the Section slider's style: withdrawn on the left (the base
    pattern), inserted on the right (the target pattern);
  - there are no numbers, no "power %", and no extra on-screen text: the tooltip reads
    "Control blades: left withdrawn, right inserted".
- **The slider** drives the same `bladeControlAmount`, eased (rate 5/s). The reaction cue, the
  glints and (with Flow) the boiling follow it.
- **While Control is on** the blades take the approved copper emphasis (the same uniforms as
  the presentation's `bladeEmphasis`). It is set from the control state, so a section change
  does not remove it.
- **Hierarchy:**
  - selection keeps priority: the cue steps back to 0.6, and to 0.35 when isolated, as Flow
    does;
  - a selected blade group takes the selection rim and the label card as before;
  - X-ray, Section and Isolate keep working, and the blades keep animating under all of them.
- **Off:** the blades ease back to the base pattern and the cue fades out.
- **Reset** (R or the panel):
  - Control off and the slider at 0;
  - the base pattern restored at once (`snapControlToBase`), with no easing;
  - no cue;
  - every other Explore state per the existing reset rules.
- **Quality switch** keeps Control and the slider. The blade data and the eased amount live
  outside React, so the remounted canvas comes back with the same insertion; the glint layer
  rebuilds at the new density. Verified: amount 0.7 before and after a High → Low switch.
- **Presentation authority.** `O` during playback does nothing. When a presentation stops
  without a reset, the blades ease back to the base pattern from wherever it left them.

## 8. Blade-motion architecture

| Piece | File | Role |
|---|---|---|
| Data | `src/config/control.ts` | target shift, reaction low level, presentation keys on the Stage 6 control events, handoff contract, Explore rates, activity look |
| Control state | `src/animation/reactorControl.ts` | `presentationControlAt(t)` (pure), `advanceControl(dt)` once per frame (master, else Explore Control eased, else base), `snapControlToBase()` for Reset |
| Blade data | `src/scene/rpv/coreLayout.ts` | `base` per blade (`setBladeInsertion`, the Stage 4 patterns), `setBladeControl(amount)`, `bladeControlLift()`; `insertion` = base + amount × shift (data for the cue and automation) |
| Blade batch | `src/scene/rpv/ReactorPressureVessel.tsx` `ControlBlades` | one instanced mesh as before; instance matrices = the base pattern (rewritten only when it changes); `position.y` = lift × blade length each frame |
| Driver + cue | `src/scene/control/ReactorControl.tsx`, `activityMaterial.ts` | ControlDriver (priority −95: after the clock, before the reveal −90, the flow −80 and the blades); the activity mesh |
| Keys | `src/animation/keys.ts` | the smoothed key evaluation shared by the flow and the control state (moved out of `operatingFlow.ts`, unchanged) |

- **Instancing.** The 57 blades remain one instanced draw call, and nothing is per blade in
  React. While the blades move:
  - no instance data is uploaded and nothing is allocated;
  - the CPU writes one number (`position.y`).
- **What follows the object matrix.**
  - Picking: three's instanced raycast uses `matrixWorld × instanceMatrix`; selecting the
    blades still resolves to `control-blades`.
  - Frustum culling: the bounding sphere is in local space.
  - The section cut and its caps: world-space clip planes.
- **Drives and housings do not move** (§1).
- **Why not rewrite the instance matrices per frame?** That was the first build. Re-uploading
  even unchanged matrices every frame cost 3–4 fps on High on this GPU (§9), an ANGLE/D3D11
  buffer-update stall; the CPU work itself was negligible.
- **Order inside a frame:**
  1. FrameDriver (−100) advances the clock and the camera.
  2. ControlDriver (−95) sets the control state, the blade data and Explore's blade emphasis.
  3. RevealDriver (−90) applies the reveal: `bladeEmphasis` = max(reveal, control).
  4. VesselFlow and CoreActivity (−80) read the state.
  5. ControlBlades (0) places the batch.

## 9. Performance

**Master sequence, High, interleaved A/B** (Stage 7 build, Stage 8 build, three rounds each,
one real-time run per page load; fps):

| Window | Stage 7 | Stage 8 |
|---|---|---|
| Whole 48 s | 51.7 / 52.4 / 52.4 | 52.3 / 52.1 / 52.7 |
| Reactor flow 20.5–29 (identical frames) | 49.4 / 50.9 / 51.0 | 50.4 / 51.2 / 51.7 |
| **Control chapter 36.5–41.5** | 42.5 / 43.1 / 43.1 (mean 42.9) | 41.7 / 40.6 / 41.8 (mean 41.4) |
| **Insertion 38.9–40.6** | 43.8 / 44.8 / 44.2 (mean 44.3) | 42.5 / 41.7 / 42.6 (mean 42.3) |
| Control chapter p95 | 33.5–33.6 ms | 33.5 ms |
| Control chapter worst | 66.4 / 66.7 / 66.4 ms | 66.6 / 116.2 / 50.0 ms |
| Control chapter frames > 20 ms | 82, 82, 81 (of ~214) | 87, 90, 89 (of ~207) |
| Draw calls, control chapter | 48–111 | 50–113 |
| Triangles, control chapter | 57,565–112,961 | 63,485–112,961 |
| Shader programs (ready → end of playback) | 15 → 15 | 16 → 16 |

**Master sequence, Low** (final build, two runs; baseline in brackets):

| Window | fps | p95 | worst | frames > 20 ms | draw calls | triangles |
|---|---|---|---|---|---|---|
| Whole 48 s | 60.1 / 60.1 (60.1 / 60.1) | 16.8 ms | 33.2 / 33.4 ms (33.2 / 17.3) | 1, 2 (1, 0) | 51–79 (49–79) | 3,171–74,827 |
| **Control 36.5–41.5** | 59.9 / 60.1 (59.9 / 60.1) | 16.8 ms | 33.2 / 17.0 ms (33.2 / 17.3) | 1, 0 (1, 0) | 51–76 (49–76) | 39,561–74,827 (37,167–74,827) |
| Insertion 38.9–40.6 | 60.1 / 60.1 | 16.8 ms | 18.2 / 16.9 ms | 0, 0 | 51–52 | 39,561–39,945 |
| Programs | 17 → 17 (16 → 16) | | | | | |

**Explore Control at the blade close-up** (5 s per state, two runs; the slider sweeps
0 → 1 → 0 every 2.5 s while Control is on, so the blades move every frame):

| State | High fps | High calls / tris | Low fps | Low calls |
|---|---|---|---|---|
| Control off, Flow off | 42.4 / 43.4 | 48 / 57,565 | 60.1 / 60.1, 0 > 20 ms | 49 |
| Control off, Flow on | 42.3 / 42.7 | 51 / 62,389 | 60.1 / 60.1, 0 > 20 ms | 52 |
| **Control on (sweeping), Flow off** | 42.9 / 42.9 | 49 / 58,685 | 60.1 / 60.1, 0 > 20 ms | 50 |
| **Control on (sweeping), Flow on** | 41.4 / 41.2 | 52 / 63,509 | 60.1 / 60.1, 0 > 20 ms | 53 |

**Where the High time goes** (diagnosis that led to the shared-shift motion):
- **Held master frames** (seek, real-time sampling, each layer removed from rendering in turn):
  - the activity layer and the vessel flow each cost nothing measurable (within ±2 fps run
    noise, both directions);
  - the deeper blades themselves (more copper cap area on screen) cost about 1.5 fps;
  - the Stage 7 baseline frame at 41.2 s is ~42 fps.
- **Per-frame instance upload** (first build). On a held frame at 40.0 s:
  - held: 38.1 / 39.7 / 39.1 fps;
  - setting only `instanceMatrix.needsUpdate` every frame (no value change): 34.9 / 35.9 /
    35.8 fps;
  - the full matrix-rewrite path: 33.3 / 33.7 / 36.4 fps.
  - In the first build's playback that was the insertion window's 38.7 / 38.3 fps against the
    baseline's 44.9 / 47.9, and Explore sweeping 35.9–37.9 fps against 41–42.5 static.
- **After the change:**
  - Explore sweeping equals static (43.9–46.2 vs 43.0–46.7 fps in the same probe);
  - the cinematic insertion window is 42.3 fps mean against the baseline's 44.3.

**How to read it:**
- **The activity cue causes no measurable overdraw** at its density, so it was not simplified
  further:
  - 560 tiny quads on High (336 on Low), of which most are collapsed in the vertex shader at
    any time;
  - one draw call;
  - no new post-processing, no new shadow casters, no full-screen transparent volume.
- **What remains on High** (about −1.5 fps in the control chapter) is the larger area of
  copper blade caps once the blades are in, which is the subject, plus the reintroduced core
  water. High is below 60 fps in this chapter in the baseline too: the reactor close-ups set
  the High frame rate on this GPU, and the frame time sits right at the 16.7 / 33.3 ms vsync
  boundary, so a little GPU time moves frames from one to the other.
- **Low stays presentation-safe at 60 fps:** 0 or 1 frame over 20 ms in the chapter, as in the
  baseline.
- **The 116–133 ms frames** occur in both builds, one per run at most: Stage 8 round 2's control
  window (116 ms), and the reactor windows of Stage 7 round 2 (117 ms) and Stage 8 round 1
  (133 ms). The reactor chapter's frames are byte-identical between the builds, so these are
  pre-existing hitches, not this stage.
- **Draw calls:** +2 at most (the vessel flow returns for the control beat; the activity
  layer). **Triangles:** +5,920 (the two instanced particle meshes: 2,400 + 560 quads).
- **Programs:** +1, the activity shader. Compiled by the ready gate at load and constant
  through playback on both qualities.

## 10. Determinism and seeking

- **The control state is a pure function of master time** (`presentationControlAt`),
  quantised to 1 µs as in Stage 7. The blades, the activity cue and the boiling share are
  derived from it; nothing keeps history; there is no tween that needs sequential playback. The
  glints are a hash of (slot, cycle) on the GPU; the slot periods are seeded on the CPU.
- **Playback = seek** (`stage8compare`: 307 samples per quality, i.e. every 0.5 s, plus every
  4 frames through 20.5–36.5 s, plus **every 2 frames through 36.5–43.5 s**; frames as PNG
  hashes; the animation clock steps exactly 1/30 s per granted frame):
  - **High:** all 307 identical, on the first and the final build.
  - **Low:** all 307 identical on the first build. On the final build's run, 64 dense samples
    differ: in every one the master time read by playback is one GSAP 1e-7 s step off the
    frame time (e.g. 20.6333334 vs 20.6333333). That is the pre-existing rounding of Stage 7
    decision 9.
  - **The rounding is not Stage 8.** Checked against the Stage 7 baseline run that drew the same
    rounded times: all 45 such frames outside the Stage 8 window are byte-identical to it, and
    all 165 frames at equal times are byte-identical to the baseline too.
- **t = 40.0 s (mid-insertion)** reached by forward seek, backward seek (from 47 s) and three
  times inside a random order of 10 seeks: identical to each other and to playback, on High
  and on Low.
- **t = 25.0 s:** playback, forward seek, backward seek and random seeks identical on both
  qualities.
- **Fixed-step export:** the review video is that path; its frames equal the seek stills
  (above).
- **Restart:** `Home` / `play()` starts from frame 0 each time. Every gated run starts with
  Home after load, and the playbacks agree.
- **Explore input during playback** (wheel, middle-drag pan, click, double-click, and X, C, I,
  L, F, Esc every 0.5 s):
  - the events (all 20), the end status (`finished`) and the authority (`cinematic`) are
    identical;
  - the frames that differ all read a GSAP-rounded master time, plus the final frame 1440, as
    in the baseline (Stage 7 §11);
  - the baseline build with the same input shows exactly the same 65 differing frames on Low
    (the same frame set).
- **O during playback** is ignored: Explore input has no authority over the presentation.

## 11. Regressions

- **Stage 7 / Stage 6 master.** Base vs new, by seek and by playback, on High and Low:
  - every sample outside **37.7–43.5 s** is byte-identical (210 samples per quality);
  - inside, 94 of 97 differ by design (core water and cue from 37.6 s; deeper blades until the
    vessel closes);
  - the timing table, the camera function (all 1441 frame poses), the look function and the
    20 events are identical;
  - **Stage 7 20.5–36.5 s** (every 4 frames): byte-identical. The new `uBoilShare` multiplies
    by exactly 1.0 there.
- **Stage 3, 0–10 s.**
  - High: the 31 seek samples are byte-identical on both builds.
  - Low: sample 10 (3.33 s) differed in one run. It flips between two hashes from page load to
    page load **in the Stage 7 baseline itself** (two fresh pages: run 0 vs run 1 differ there,
    3 pixels by 1 level), and the final build gave the common hash in two further fresh runs.
    It is a pre-existing flake, not this stage.
  - The master's first 10 s by seek are identical on both qualities.
- **Stage 6 camera and timing unchanged.** No camera key, beat, event or reveal track was moved
  or added; the control effects are keyed on the existing events and on the existing
  `vesselCut` close track.
- **Navigation.** No navigation or camera code was touched (`src/camera/*`, `ExploreDriver`, `picking.ts`
  unchanged; Explore Control calls the existing `cameraDirector.transitionTo`). Re-run on both
  builds (High), diffed leaf by leaf:
  - the navigation test (wheel zoom to cursor, pan, double-click pivot, limits, focus, Reset,
    resize): the same picks, limits and outcomes. Of 374 values, 7 differ: the two new store
    fields, four real-time-damped orbit step sizes and one transition frame count. Those last
    five vary between runs, as Stage 7 recorded;
  - the Stage 5 interaction tests: identical apart from the new `control: false`,
    `controlAmount: 0` fields;
  - the focus audit: 177 of 177 values identical.
- **Explore without Control:** unchanged. Control adds only:
  - the copper emphasis (max with the reveal);
  - the cue;
  - a boil share of exactly 1 while Control is off.

## 12. Files

New:
- `src/config/control.ts`: target, reaction, presentation keys, handoff, Explore, activity look;
- `src/animation/reactorControl.ts`: the control state, presentation and Explore;
- `src/animation/keys.ts`: the shared key evaluation (moved from `operatingFlow.ts`);
- `src/scene/control/`:
  - `ReactorControl.tsx`: the driver and the activity mesh;
  - `activityMaterial.ts`: the strips, the shader, the geometry.

Changed:

| File | Change |
|---|---|
| `src/scene/rpv/coreLayout.ts` | `base` per blade; `setBladeControl`, `bladeControlLift`, `bladeTargetInsertion`; `bladePatternVersion` (was `bladeStateVersion`) |
| `src/scene/rpv/ReactorPressureVessel.tsx` | blade matrices from the base pattern; the batch's `position.y` from the control lift; indexed loop |
| `src/config/flow.ts` | `CONTROL_FLOW`: core water 0.4 and downcomer 0.3 in the control beat, until the vessel closes |
| `src/animation/operatingFlow.ts` | `boilShare` (from the control state); `keyed` moved to `keys.ts` |
| `src/scene/flow/flowMaterials.ts`, `VesselFlow.tsx` | `uBoilShare`: the core's bubble share and mixture paling |
| `src/scene/section/sectionLayers.ts` | `setControlBladeEmphasis` (Explore Control's copper emphasis, max with the reveal) |
| `src/interaction/exploreStore.ts` | `control`, `controlAmount` |
| `src/interaction/exploreActions.ts` | `setControl` / `toggleControl` (opens the reactor section, frames the blades), `setControlAmount` |
| `src/animation/presentation.ts` | Reset snaps the blades to the base pattern |
| `src/ui/ExplorePanel.tsx`, `src/ui/styles.css` | the Control button and slider |
| `src/app/useKeyboardShortcuts.ts` | `O` |
| `src/scene/SceneCanvas.tsx` | mounts `<ReactorControl />` |
| `src/debug/automation.ts` | `explore.control` / `controlAmount`, `control.state` / `stateAt` / `blades` / `stats` |
| `README.md` | the O key, the Stage 8 section |

The diff to tracked files is 16 files, 241 insertions, 47 deletions; the new modules total 510 lines.

## 13. Open decisions before Stage 9

1. **The control effects outlast the control beat.**
   - What reaches past 41.5 s: the blades stay in (as asked); the activity cue fades over
     41.9–42.7 s while the camera backs out; the core water and downcomer return keep
     circulating until the vessel closes (43.4 s). So frames 41.5–43.5 s of the safety chapter
     differ from Stage 7.
   - Alternative: end the cue and the water at 41.5 s. That would read as "the reaction and the
     flow stopped", which the brief wants to avoid.
   - Stage 9 may restyle 41.5–43.5 s.
2. **Insertion starts at 38.9 s, not 38.0 s:** the camera only reaches the blade view at
   39.1 s, and `controlAction` is 39.2 s. If an earlier start is wanted, it means starting while
   the core is still a slot in a wide shot, or moving a Stage 6 camera key.
3. **The shared-shift target** (§3): every blade moves 1.9 m, and the 9 base blades end at 0.85.
   It was chosen over the brief's k-fraction example for performance. The first build used the
   k-fraction version and was measured (§9). It can return if the 0.85 is judged too deep, but
   it would need a second batch or a vertex-shader lift to stay cheap.
4. **Reaction low level 0.3, linear in the control amount.** Lower reads as "almost off",
   higher as "barely changed".
5. **Explore Control moves the camera** to the blade view when turned on (Flow never moves it).
   Without it the button does nothing visible from most views. The alternative is to open the
   section only.
6. **Copper emphasis in Explore Control:** on whenever Control is on, the same as the
   cinematic's.
7. **The activity cue is drawn only on the two cut faces** (where the fuel is visible). Through
   X-ray alone the core stays opaque, and no glints show.
8. **The shortcut `O`** (B is the Stage 4 review key, S is reserved for Stage 9).
9. **Pre-existing, not changed here:**
   - GSAP's 1e-7 s master-time rounding (Stage 7 decision 9);
   - the Low Stage 3 sample 10 flake (§11);
   - the 116 ms hitches seen in both builds.
   A fix for the first would quantise master time once in `masterSequence` (Stage 6 code).

## 14. Known limitations

- **Motion only reads in motion.** The stills show the before / after states; the copper blades
  rising and the glints thinning are clearest in the focus clip.
- **A closed vessel shows no blades and no cue,** by design (the blades are internals; the cue
  lives on the cut faces).
- **The label anchor** of the control blades is cached by Stage 5 at the first selection; after
  Control moves the batch the label sits at the anchor's first position (up to 1.9 m off).
  Pre-existing caching, unchanged here.
- **Time compression and pattern are representative** (§2).
- **The review harness** (Puppeteer scripts) lives outside the repository, as for earlier
  stages.
