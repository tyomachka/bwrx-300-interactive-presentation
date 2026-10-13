# Stage 9: passive safety / isolation condenser, review report

## 1. Status / checkpoint

- **Status:** implemented, **not committed** (awaiting review); Stage 10 not started. Profile **FAST**;
  no escalation trigger fired (§6).
- **Stage 8 checkpoint:** commit `ca087dc4eb93e4cb3f5b360b436efd155f303318` ("Stage 8: reactor control
  (approved)"), exactly the reviewed tree: 16 files, +241/−47, plus 510 new lines, as the Stage 8 report
  lists, nothing newer than the report, and `npm run check` green before the commit.
- **Servers:** six stale `vite` servers from earlier sessions were stopped (4180–4182, 4190, 4192, 5173).
  One preview server (4200) served the stage. The bundle `index-D4LY6R3Q.js` was verified before every
  capture and is recorded in the capture logs.
- **Build:** `npm run check` passes. No external requests in any run. No new console output (only the
  existing `THREE.Clock` deprecation warning).
- **Baseline:** the stored Stage 8 goldens and performance numbers. A rebuild of the committed tree gave
  the stored bundle hash `index-BPp5F7wz.js`, so the previous stage was not re-run.
- **Policy files added:** `DEVELOPMENT_RULES.md` (the policy as given; it was not in the repo),
  `ARCHITECTURE.md` and `references/TECHNICAL_FACTS.md`.

**Deliverables (this folder):**
- `stage9-safety-focus-36.5-48s-1080p.mp4`: the real playback path, fixed step, 346 frames.
- Stills `01`–`06`: handoff 43.0 s; steam entering the ICs 44.2 s; pool heat transfer 45.4 s (2× crop);
  condensate return 45.8 s; final state 48.0 s; Low 45.6 s.
- `explore/`: Explore Safety at the home view and at a pools view.
- `validation/`: determinism, performance, Explore and Stage 5 JSON.

## 2. What changed

- **ICS hardware** (`scene/safety/icsLayout.ts`, `IcsEquipment.tsx`; one draw call, part of the plant,
  drawn with the pools). Three trains, each with:
  - a steam supply line from the RPV steam space, out through the containment and up into its pool;
  - an IC (upper header, 18 vertical tubes, lower header), under water;
  - a condensate return line down to the RPV at the top of the chimney region.
- **ICS pool water** is a transparent variant, so the submerged IC shows. The cavity pool is unchanged.
- **The loop** (`animation/passiveSafety.ts`, `config/safety.ts`) is a pure function of 1 µs-quantised
  master time, keyed on the existing events (`safetyEnter` 41.5, `isolationCondenser` 44.6,
  `safetyExit` 46.0):

  | Time (s) | What happens |
  |---|---|
  | 41.5–42.4 | Stage 8 handoff, untouched: blades in, the reaction cue fades with the camera, the core water still circulates |
  | 42.2–43.3 | The vessel warms |
  | 42.7–44.2 | Steam climbs to the ICs |
  | 44.1–44.9 | Condensing down the tubes, around `isolationCondenser` |
  | 44.3 on | Warm water rises into the pool |
  | 44.8–45.9 | Condensate drains back: the loop is closed before `safetyExit` |
  | 46–48 | The loop keeps running at 70 % through the pullback |

- **Cues** (`scene/safety/PassiveSafety.tsx`, one draw call each; nothing additive, no post-processing,
  no new pass): pulse sleeves on the Stage 7 pulse-tube shader (steam pale, condensing pale blue-grey,
  condensate the Stage 7 water blue); pool-heat wisps on the Stage 7 streak shader (own seeded
  streamlines; High 168 particles, Low 102); a decay-heat tint on the vessel, strongest at the core and
  at the silhouette, cut with the vessel.
- **Explore Safety** (`S`, Safety button): the same loop, replayed from the toggle.
  - It opens the plant section with the pools (a Reactor section stays as it is).
  - **The camera is not moved** (pose verified identical).
  - **Flow and Safety exclude each other:** turning one on turns the other off.
  - A selection steps the loop back to 0.6 (0.35 isolated). Reset turns it off at once.
  - Control stays independent. `S` was free (reserved for Stage 9).

## 3. Scientific facts / assumptions (`references/TECHNICAL_FACTS.md` ICS-01…10)

Only the new claims were checked, in GD 005N9751 Rev J (sha256 `d02f59aa…`): §2 p. 25, §3.3 pp. 40–42,
Fig 3-8 p. 41, §3.10 p. 47, §10 p. 78.

- **OFFICIAL, shown:** three independent trains, each IC submerged in its own pool; steam condenses on
  the tube side and returns to the RPV in a closed loop; the heat goes to the pool water (pools vented
  to the atmosphere); the ICs stand above the steam source, so circulation is natural, gravity-driven,
  with no AC power; the condensate drains to the RPV inlet in the chimney region.
- **OFFICIAL, narration only:** two trains remove decay heat for seven days without operator action;
  each IC is about 33 MW.
- **APPROX (educational):** one tube bank per IC (Fig 3-8 draws two modules); three separate pools
  without the inner / outer split; nozzle azimuths, riser positions and header heights; the steam
  nozzles at the steam-outlet level and the return at h 16.2 m.
- **Not implied:** no electricity (the turbine path has been off since 37.6 s); no instant end of heat
  and no cold reactor; no pumps, pool boiling, valves, alarms or accident sequence.

## 4. Visual / UX decisions

- **Colour:** pale steam and blue water, as in Stage 7. Heat is one muted warm (`#c98a5f` vessel,
  `#d9ad88` plume), quieter than the selection accent. No red, no flashing, no arrows.
- **Transparent pool water instead of the X-ray dither:** the dither writes depth, so it would stipple
  the flow cues inside the pool. ICS pools are drawn only from 41.6 s (Stage 6 `poolsReveal`), in the
  section review and in Explore Safety.
- **Pool-heat cue:** the first build's small warm streaks read as sparks. They are now large, faint,
  slow wisps.
- **Layout:** the headers run broadside to the cameras, with the steam riser at each IC's inner end and
  the return riser at its outer end, so each train reads as a loop.
- **Unchanged:** the Stage 6 look cues (pools subject from 42.6 s, context dim) and every camera key.

## 5. Performance (production, 1920×1080, Iris Plus / D3D11, serial; S8 = stored Stage 8 numbers)

| Run | fps | p95 | worst | > 20 ms | draw calls | programs |
|---|---|---|---|---|---|---|
| **Low, full 48 s** | 60.1 (S8 60.1) | 16.8 ms | 33.3 ms | 1 / 2885 | 51–81 | 20 → 20 (S8 17 → 17) |
| Low, safety 41.5–46 | 60.1 (S8 60.1) | 16.8 | 16.9 | 0 / 270 | 52–74 | |
| Low, final 46–48 | 60.1 | 16.8 | 17.1 | 0 / 122 | 67–81 | |
| **High, safety 41.5–46** | **52.4** (S8 49.9–51.1, 6 runs) | 33.3 (S8 33.3–33.4) | 49.9 (S8 ≈ 50) | 34 / 236 (S8 40–44) | 51–131 | 18 → 18 (S8 16 → 16) |
| High, loop 44.6–46 / final 46–48 | 60.2 / 60.1 | 16.8 | 17.9 / 17.0 | 0 / 0 | 66–131 | |
| Explore pools view, Safety off → on, High | 59.7 → 59.1 | 16.9 | 33.6 → 33.5 | 2 → 5 | 60 → 66 | 18 → 18 |
| Explore pools view, Safety off → on, Low | 60.1 → 60.1 | 16.8 | 17.4 → 17.0 | 0 → 0 | 61 → 67 | 20 → 20 |

- **Chapter cost:** +4 draw calls; about +52 k triangles (pipes and sleeves; this GPU is fill-bound
  here).
- **Programs:** +2 High, +3 Low, from the three new materials (transparent water, decay tint, IC steel).
  All compile in the ready gate; the count is constant through playback.
- **High comparison:** this High run was faster overall than the stored runs (54.3 vs 51.5–52.7 fps),
  so the beat's margin is variance. There is no regression.

## 6. Determinism / regression

Gated fixed-step playback (Home, 1/30 s per frame) against seek; frames are PNG hashes.
Outside-window goldens are the stored Stage 8 seek hashes (`validation/stage9compare-*.json`).

| Check | High | Low |
|---|---|---|
| Changed window 41.5–48 s: seek = playback | **56 / 56** | 15 / 16 (a) |
| t = 44.6 s: forward, backward (from 47.9), 3× random-order seek, playback | identical | identical |
| 7 other random-order seeks (2.5–47.1 s) = forward seek | identical | identical |
| Outside-window goldens 0–41.4 s, by seek | 23 / 24 (b) | **12 / 12** |
| Outside-window playback = stored Stage 8 playback | all but one (c) | all |
| Timings, camera (1441 poses), look, control and flow functions = Stage 8 | identical | identical |
| Events (20) / end status | all / `finished` | all / `finished` |
| Stage 5 interaction suite (`s5interact-nav`, High) | 110 values; only the 4 new `safety: false` differ | – |

Every difference was diagnosed (DEVELOPMENT_RULES §3); all are pre-existing:

- **(a) Frame 1327.** Playback read 44.2333334 s, not 44.2333333 (GSAP 1e-7 s rounding, Stage 7 decision
  9). A seek to 44.2333334 gives the playback hash.
- **(b) Frame 120 (4.0 s, Stage 3 shot):** 3 pixels by 1 level. A/B against the Stage 8 build: both
  give either hash on the first pass after page load and the golden afterwards; this run's playback
  frame equals the golden. A load-time flake like the known Low one at 3.33 s.
- **(c) Frame 1243.** Playback read 41.4333334 s. At that exact time the Stage 8 and Stage 9 builds give
  the same hash.
- **Not run:** the navigation suite, the focus audit and dense Stage 3. No camera, navigation, picking,
  focus or section-architecture file changed; the goldens cover 0–10 s.

## 7. Files

- **New:** `src/config/safety.ts`, `src/animation/passiveSafety.ts`, `src/scene/safety/` (`icsLayout.ts`,
  `IcsEquipment.tsx`, `PassiveSafety.tsx`, `decayHeatMaterial.ts`); `DEVELOPMENT_RULES.md`,
  `ARCHITECTURE.md`, `references/TECHNICAL_FACTS.md`.
- **Changed:** `plant/materials.ts` (`icsWater`, `icsSteel`), `plant/ReactorBuilding.tsx`, `SceneCanvas.tsx`,
  `exploreStore.ts` (`safety`), `exploreActions.ts` (`setSafety`, Flow ↔ Safety, `revealForSection(…,
  pools)`), `ExplorePanel.tsx`, `useKeyboardShortcuts.ts` (`S`), `presentation.ts` (Reset),
  `automation.ts` (`explore.safety`, `safety.*`), `README.md`.
- **Size:** the tracked diff is 10 files, +98/−13; the new source modules are 710 lines.

## 8. Open questions / approval items

1. ~~The reaction stays at Stage 8's 0.3.~~ **Resolved by the shutdown handoff (§9).**
2. **ICS pools are see-through wherever they are drawn,** including Explore after a presentation and the
   section review. The alternative is a material swap only during Safety.
3. **The loop keeps running at 70 % to 48 s,** so the end frame says "passive cooling". The alternative
   is fading it out.
4. **Explore Safety leaves the camera alone,** as asked. From the home view the ICs are small. A "frame
   the pools" step would be a camera move.
5. **Optional:** a capped building material for the IC steel would save one program on Low. It is not
   done, to keep the validated build.
6. **Pre-existing, unchanged:** GSAP 1e-7 s rounding; the Low 3.33 s and High 4.0 s load flakes; the
   label-anchor caching (Stage 8 §14).

## 9. Shutdown handoff polish (review follow-up, MICRO FAST)

Your review asked for the chain reaction to read as essentially shut down before the decay-heat
story. Nothing else in Stage 9 changed.

- **Reaction** [EDUCATIONAL REPRESENTATIVE SHUTDOWN HANDOFF] (`config/control.ts` `CONTROL_SHUTDOWN`):
  - over 41.5–42.4 s, the reaction cue falls smoothly from 0.3 to **0.05**;
  - the Stage 8 end state at 41.5 s is preserved exactly;
  - no extra blade motion (the inserted pattern already reads), no scram, no number on screen;
  - the glints thin out while the camera backs out of the core, and none remain by about 42.2 s.
- **Heat stays:**
  - the core keeps boiling at the Stage 8 level (`residualBoil` = 0.3; the decay heat), and the core
    water keeps circulating until the vessel closes, as before;
  - the vessel's decay-heat warmth comes up early (0 → 0.4 over 41.6–42.4 s, taking the larger of this
    and the existing curve), so by 42.4 s the core shows warmth and water, not activity.
- **Values** (High; identical on Low):

  | t (s) | reaction (was) | activity fade | boiling share | decay warmth (was) |
  |---|---|---|---|---|
  | 41.5 | 0.30 (0.30) | 1 | 0.30 | 0 (0) |
  | 41.8 | 0.25 (0.30) | 1 | 0.30 | 0.04 (0) |
  | 42.1 | 0.10 (0.30) | 0.90 | 0.30 | 0.29 (0) |
  | 42.4 | 0.05 (0.30) | 0.28 | 0.30 | 0.40 (0.05) |
  | ≥ 42.7 | 0.05, cue already off | 0 | 0.30 | unchanged |

- **Validation** (`validation/handoff-{high,low}.json`; production build `index-BLD6NRZ3.js`; previous
  Stage 9 build served alongside):
  - `npm run check` passes; no errors, no external requests, no new console output.
  - Seek = fixed-step playback at 41.5, 41.8, 42.1, 42.4 and 43.0 s, High and Low; 42.1 s is also
    identical by forward and backward seek.
  - Stored Stage 9 frames unchanged: 41.43 s, 41.5 s, 42.7 s (High), 43.0 s and 44.6 s (High and Low).
  - Frames 41.8, 42.1 and 42.4 s change, by design.
  - Safety state from 42.7 s: identical to the previous build. Control state up to 41.5 s: identical.
  - Flow state: only the boiling share's text differs after 41.5 s (`0.30000000000000004` vs `0.3`).
    The two values are the same float32, so the GPU input is unchanged.
  - No performance run: the geometry and draw calls are unchanged.
- **Deliverables:**
  - `stage9-shutdown-handoff-41-43.2s-1080p.mp4`: fixed-step playback, 67 frames.
  - `stage9-shutdown-handoff-before-after.png`: top row before, bottom row after, at 41.5 / 41.8 /
    42.1 / 42.4 / 43.0 s.
  - The 36.5–48 s focus clip was not re-rendered. Its 41.5–42.7 s section shows the earlier handoff;
    the new clip supersedes it. All other stills are unaffected (01 at 43.0 s is identical).
