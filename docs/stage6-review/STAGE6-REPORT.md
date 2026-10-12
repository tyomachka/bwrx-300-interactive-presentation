# Stage 6 Review Report: Master Presentation Timeline (48 s skeleton)

**Project:** BWRX-300 interactive WebGL module (PROJECT.md is the master spec)
**Stage:** 6. Stage 7 has not been started; no flow, fission, blade motion, ICS flow, narration
or labels were built.
**Git:** Stage 1 `280da5b`, Stage 2 `4fe2e54`, Stage 3 `d8536a0`, Stage 4 `37470cb`,
**Stage 5 `f6a35fc`** (committed before Stage 6 began, from the approved tree including the safe
below-grade Reset and the re-recorded interaction video, after `npm run check` passed).
Stage 6 changes are **not committed**, pending this review.

## Deliverables (`docs/stage6-review/`, 1920×1080, production build, high preset)

| File | Content |
|---|---|
| `stage6-skeleton-1080p.mp4` | The full sequence: 1,441 frames, t = 0 to 48.0 s, 30 fps, H.264, no audio, 14.8 MB (rendered frame-exactly, see §12) |
| `01-start-1080p.png` | 0.0 s: the approved Stage 3 opening frame |
| `02-rpv-hero-1080p.png` | 10.0 s: the Stage 3 RPV hero frame, where the master continues |
| `03-core-1080p.png` | 17.5 s: the held core composition (fission slot) |
| `04-flow-architecture-1080p.png` | 23.4 s: core, chimney and separators in one vertical frame |
| `05-turbine-generator-1080p.png` | 34.2 s: HP and LP turbines and the generator in the X-rayed hall |
| `06-control-blades-1080p.png` | 40.2 s: the approved control-blade composition, copper subject emphasis |
| `07-passive-safety-1080p.png` | 45.2 s: the isolation-condenser pools above the containment, RPV below |
| `08-final-1080p.png` | 48.0 s: the stable final frame |
| `stage6-milestones.png` | Contact sheet, one frame per second |
| `beat-timings.json` | Beats, events, camera keys, reveal tracks and look cues, exported from the app |
| `verification-report.json` | Raw measurements |

Review live with `?debug`. Space plays or pauses, Home restarts, `,` / `.` step frames,
`[` / `]` jump between beats. The diagnostics panel has the same controls plus a scrubber,
the beat selector, and the current time and beat.

## 1. Stage 5 commit

`f6a35fc92c05a559afe93440450a275629705015` ("Stage 5: Explore mode interaction architecture
(approved)"). The four earlier commits are unchanged beneath it.

## 2. Final master duration

**48.0 s exactly** (the target; no deviation). Every beat boundary is the one in the brief.

## 3. Beat timing table

| Beat | Start | End | What the camera does | Reveal / look | Events |
|---|---|---|---|---|---|
| exterior | 0.0 | 1.5 | Stage 3 | Stage 3 | – |
| approach | 1.5 | 3.4 | Stage 3 | Stage 3 | – |
| belowGrade | 3.4 | 5.8 | Stage 3 | Stage 3 | – |
| containment | 5.8 | 7.6 | Stage 3 | Stage 3 | – |
| rpvHero | 7.6 | 10.0 | Stage 3, settles at rest on the RPV hero | Stage 3 | – |
| core | 10.0 | 16.0 | Closer, through a vessel-cutaway key (12.8), settles on the core (15.4) | Vessel cut opens 10.5–12.5; RPV rim 1 → 0.4; core subject from 12.0; context steps back from 12.0 | coreReveal 12.4 |
| fission | 16.0 | 20.5 | Held core composition, barely perceptible push | Core subject held; steam line drawn from 18.0, while off screen | fissionEnter 16.0, fissionExit 20.5 |
| flow | 20.5 | 29.0 | Pulls back to core + chimney (22.6), cranes up to the separators (24.8), dryer (26.6, the approved steam-region pose), turns to the steam outlet (28.4) | Subject climbs: core → chimney → separators → dryer → steam nozzle | flowCore 20.5, flowChimney 22.4, flowSeparators 24.3, flowDryer 26.0, steamExit 27.6 |
| turbine | 29.0 | 36.5 | Out of the vessel along the main steam line (30.8), HP turbine (32.6), pans along the train to the generator (35.0), pulls away | Steam line → turbine → generator subjects; turbine hall X-ray 30.4–36.5; site context comes back up 30.2–31.8 | steamToTurbine 29.0, turbine 32.2, generator 34.0, electricityOut 35.4 |
| control | 36.5 | 41.5 | Over the opened plant (37.3) into the vessel cut, onto the approved blade close-up (39.1), hold to 41.2 | Context recedes again 36.6–37.8; copper blade emphasis 38.3–39.1 (Stage 4); steam line hidden at 38.6, while off screen | controlEnter 36.5, controlAction 39.2, controlExit 41.5 |
| safety | 41.5 | 46.0 | Backs out of the vessel looking down (42.4), rises with the vessel and the pools in view (43.5), settles frontally on the pools (44.6), hold | Pools drawn from 41.6, while off screen; blade emphasis off; vessel closes 43.4–45.0, after the camera has left it; RPV hero light returns 44–45.8; ICS pools are the subject; the rest steps back | safetyEnter 41.5, isolationCondenser 44.6, safetyExit 46.0 |
| finalPullback | 46.0 | 48.0 | Restrained pull back to the final frame, coming to rest | Emphasis and context dim fade to neutral by 47.4 | finalPullback 46.0, sequenceComplete 48.0 |

`beat-timings.json` has the same data with the camera keys and every cue.

## 4. Master timeline architecture

- **Data** (`src/config/masterSequence.ts`) holds everything, in seconds of master time:
  - `MASTER_BEATS`: id, label, start, end, takeaway, events, subjects;
  - `MASTER_EVENTS`;
  - `MASTER_CAMERA`: named poses in `config/camera.ts`;
  - `MASTER_REVEAL`: reveal tracks;
  - `MASTER_LOOK`: subject cues, context dim keys, enclosure ghosts, interior windows.

  Scene components own no timing.
- **One evaluation of time, four layers.** The reveal, the camera and the look are pure
  functions of master time; the events are timeline callbacks.
  1. **Reveal:** the Stage 3 tracks run through the hero shot's own GSAP builder, ticked by the
     shared animation clock. Later tracks are a pure-function overlay applied after it on every
     render (`animation/revealTimeline.ts`). This is a deliberate design point. Validation found
     that a GSAP timeline cannot safely hold several tweens of the same property: a backward
     seek reverts later tweens to their start values, and the last one rendered wins, which
     showed up as copper blades at 15 s after a restart. The overlay has no history.
  2. **Camera:** two monotone keyframe paths (`camera/cameraPath.ts`), see §5.
  3. **Look:** at each time, the subjects, context dim, ghosts and extra interior levels are
     evaluated and applied by the Stage 5 visuals without easing (`setCinematicLook`).
  4. **Events:** GSAP timeline callbacks while playing; a seek announces itself instead.
- **Controller** (`animation/masterSequence.ts`):
  - controls: `play`, `seek`, `togglePause`, `step(frames)`, `jumpToBeat`, `jumpBeat(±1)`, `stop`;
  - subscription: `subscribe(listener)` for events, seeks and status changes;
  - status: in `useMasterStore`, for UI; the time is never put in React state;
  - seek: resets the reveal, re-renders the timeline at that time and applies the overlay,
    so any seek, forwards or backwards, shows exactly the frame that playback shows.
- **Determinism:** the same as Stage 3. Fixed-step frame export works through
  `animationClock.fixedStep`, and restart is exact (§12).

## 5. How Stage 3 is reused

- **Camera.** For 0–10 s the master evaluates a `CameraPath` built from the hero shot's own
  key data (`HERO_SHOT_CAMERA`), so the evaluation is identical to the shot's. The master path
  then starts at 10.0 s on the shot's final pose, at rest, which is exactly how the shot's path
  ends. One combined path would have changed the curve's tangent at 10 s, and with it the
  motion from 7.6 to 10 s.
- **Reveal.** The master builds its GSAP timeline from `HERO_SHOT_REVEAL` with the same builder
  the shot uses.
- **Look.** It is neutral for 0–10 s: no emphasis, no dim, no extra interior.
- **Result.** At 16 checked times from 0 to 10 s, master frames are byte-identical to the
  isolated shot's (high and low). The isolated shot itself is byte-identical to the approved
  Stage 5 build (§11).
- **Untouched:** the camera language, excavation reveal, grade treatment, containment reveal
  and RPV hero lighting.

## 6. Important camera transitions and waypoints

Motion was measured from the pure camera function at 30 fps. Peak camera speed and peak
turn rate of the view direction, for reference: the Stage 3 opening peaks at 33 m/s and 6.4°/s.

| Transition | How | Peak speed / turn |
|---|---|---|
| RPV hero → vessel cutaway | Leaves the hero frame from rest; the vessel cut opens during the first half of the move; a cutaway key at 12.8 shows the internal stack before settling on the core | 26 m/s, 7.5°/s |
| Fission slot → architecture | Pulls back from the core to core + chimney, then cranes up the vessel; the subject moves up with it | 9.5 m/s, 11°/s |
| Steam outlet → turbine hall | Turns toward the east nozzle, follows the main steam line out through the cut walls, arrives at the HP turbine as the hall turns to X-ray | 35 m/s, 21°/s |
| Turbine → control blades | Leaves the generator from 35.0 s (≈4 s for the move), over the opened reactor building (37.3), down into the vessel cut onto the approved blade pose | 53 m/s, 20°/s |
| Blades → passive safety | Backs out along its own sight line, still looking down (42.4); rises with the vessel and pools in view (43.5); levels onto the pools (44.6) | 25 m/s, 30°/s |
| Final pullback | 2 s, ×1.7 in distance, settles at rest | 36 m/s, 16°/s |

- **Clearance:** checked over the whole sequence at 15 Hz with a 16×9 ray grid (picking's
  visibility rules). No frame comes closer to an enclosure wall than the approved close-ups
  themselves: worst 18 % of the screen within 10 m, nearest surface 3.9 m, both inside the
  control-blade hold. The opening and the final frames keep ≥ 27 m.
- **Stable framing:** no roll, no stops except the deliberate rest at 10 s (Stage 3's end)
  and at 48 s.
- **Instant visibility switches:** the steam line on at 18.0 and off at 38.6, and the pools on
  at 41.6, are verified off screen. The switched geometry is outside the exact view frustum at
  the switch frame and one frame either side.

## 7. Presentation vs Explore authority

- **Start (play, seek or restart):** stops the hero shot, review states, closing tweens and the
  section review. Explore is suspended (no hover, selection, isolation, X-ray, labels or
  panel), the blade pattern is set to operating, the look is installed, and the camera
  becomes cinematic.
- **During playback:**
  - **Inputs ignored:** clicks, drags, the wheel and Explore keys (X C I L Esc) change nothing.
    Run C of the validation sent all of them throughout a full playback; frames are identical
    to an untouched run (§12). `L` used to flip the hidden labels preference; it is now ignored
    like the other Explore keys.
  - **Setup panel:** stays hidden, so there is no UI in the image and no accidental quality
    switch.
- **End (documented state):** `finished`.
  - **Held frame:** the final frame is held under cinematic authority, with Explore still
    suspended.
  - **Leaving it:** R (Reset) returns to the Explore home, with the reveal closing and the
    camera flying home. Space or Home restarts from frame 0, exactly. P plays the isolated
    Stage 3 shot.
  - **Why no automatic handoff:** handing back to Explore would hide the presentation-only
    content (pools, emphasis) mid-image.
- **Interruption:** a quality switch rebuilds the canvas and stops the master. Selecting
  quality before playback works; the low run of the validation is a full playback on `low`.
- **Reset from any time:** returns to the exact Explore opening state: section off, the
  closed reveal including the pools, the home pose.
- **Isolated Stage 3 shot (P):** unchanged.

## 8. Events exposed for Stages 7–10

`MASTER_EVENTS` (times in §3): `coreReveal`, `fissionEnter`, `fissionExit`, `flowCore`,
`flowChimney`, `flowSeparators`, `flowDryer`, `steamExit`, `steamToTurbine`, `turbine`,
`generator`, `electricityOut`, `controlEnter`, `controlAction`, `controlExit`, `safetyEnter`,
`isolationCondenser`, `safetyExit`, `finalPullback`, `sequenceComplete`.

**Contract:**
- **Reading time:** an effect reads `masterSequence.time`, or a span between two events, and
  derives its state from it (pull). Seeking and restarting therefore stay exact.
- **One-shot cues:** `subscribe` delivers events crossed during playback, in order (all 20
  verified), plus `seek` and `status` signals.
- **Adding effects:** effects add cues to the timeline data; they do not touch the camera.

## 9. Files changed

**New:**
- `src/config/masterSequence.ts` (221 lines): all master data.
- `src/animation/masterSequence.ts` (298 lines): controller, camera composition, look and
  events.
- `src/animation/revealTimeline.ts` (95 lines): the shared timeline builder (moved out of the
  hero shot) plus the track overlay.

**Changed:**
- `src/config/camera.ts`: 17 named master poses.
- `src/interaction/exploreVisuals.ts`: cinematic look.
- `src/animation/heroShot.ts`: uses the shared builder; `poolsReveal` added to the reset close.
- `src/animation/heroReveal.ts`: the `poolsReveal` field.
- `src/scene/section/sectionLayers.ts` and `src/scene/plant/section.tsx`: a `pools` interior
  level replaces the review-only level; pools are drawn when `poolsReveal` shows them in the
  cut building, or in the section review.
- `src/scene/plant/ReactorBuilding.tsx` and `src/scene/plant/ids.ts`: the ICS pools as their
  own object.
- `src/scene/components.ts`: the `isolation-condenser-pools` entry, non-selectable.
- `src/config/rpvReview.ts`: the new reveal field.
- `src/animation/presentation.ts`: Reset stops the master.
- `src/interaction/exploreActions.ts`:
  - Reset resumes Explore in its initial state. A Reset after the Stage 3 shot used to leave
    the section flag on while the reveal closed.
  - Labels are ignored during a presentation.
- `src/app/useKeyboardShortcuts.ts`: the master keys.
- `src/debug/DiagnosticsOverlay.tsx` and `src/debug/automation.ts`: master controls and API.
- `src/ui/SetupControls.tsx`: hidden while the master plays.
- `src/ui/styles.css`.
- `README.md`.

**Not changed:** Stage 3 camera, poses or reveal data; RPV geometry and internals; section
shader; Stage 5 visuals in Explore mode.

## 10. Full-sequence performance

Production build, 1920×1080, Intel Iris Plus, real-time playback of all 48 s, every frame
sampled, two runs per preset.

| | High run 1 | High run 2 | Low run 1 | Low run 2 |
|---|---|---|---|---|
| Average fps | 55.3 | 55.8 | 60.0 | 60.0 |
| p95 frame | 33.2 ms | 33.2 ms | 16.8 ms | 16.8 ms |
| Worst frame | 66.6 ms | 66.6 ms | 33.4 ms | 33.3 ms |
| Frames > 20 ms | 221 / 2656 | 205 / 2677 | 5 / 2881 | 8 / 2878 |
| Draw calls | 48–136 | 48–136 | 49–77 | 49–77 |
| Triangles | 3,865–134,157 | same | 2,331–67,787 | same |
| Programs before → after | 13 → 13 | 13 → 13 | 14 → 14 | 14 → 14 |

Per beat, high, run 1 (run 2 within ±2 fps):

| Beats | fps |
|---|---|
| Stage 3 beats | 60.1 |
| core | 56 |
| fission | 59.7 |
| flow | 54.2 |
| turbine | 53.3 |
| control | 45.6 |
| safety | 53.7 |
| finalPullback | 60.1 |

Low: 59–60 everywhere.

The control beat is the outlier.
- **Flight back to the core (36.5–38 s):** dips to about 40 fps for roughly a second. The
  camera sees the whole opened plant and the open vessel internals at once. Ending the
  turbine-hall X-ray before this flight cut peak draw calls from 147 to 136.
- **Blade close-up:** held still, it runs at 49 fps. That equals the approved Stage 4
  control-blade state measured in the same session (49.0), and beats Stage 5's Explore blade
  focus (45.5).

Stage 6 itself adds:
- no post-processing, particles or new shaders;
- no shader compiles during playback, scrubbing or seeking (programs constant);
- per frame, only a CPU-side uniform update (about 40 components) and two path evaluations;
- when the master is idle: nothing.

## 11. Stage 3 regression

- **Isolated Stage 3 shot** (`stage3.mjs`, three runs per preset):
  - 60.0 / 60.1 / 60.1 fps high; 60.1 ×3 low;
  - pose delta 0 across runs; programs constant;
  - final frames **byte-identical** to the approved Stage 5 build in all six runs;
  - the reset end pose unchanged; no errors and no external requests.
- **Master 0–10 s:** byte-identical to the isolated shot at all 16 checked times, high and low.
- **Stage 5 Explore with the master idle** (`s5interact.mjs`, high and low): all pass.
  - Real hover and click on the RPV.
  - Esc, X, L and C.
  - 40 random operations + R give a frame byte-identical to the default.
  - Presentation safety during the Stage 3 shot.
  - Quality switch keeps the selection.
  - Resize.

## 12. Seeking and determinism

Production build, high and low, animation clock stepped exactly 1/30 s per frame, frames
compared as PNG hashes every 0.5 s (97 samples over 48 s).

- **Two full playbacks:** identical at all 97 samples.
- **Playback with Explore input** (run C): identical to run A at all 96 samples before the end.
  - The last sample (48 s) differs only in the setup-panel area, x 1545–1899, y 998–1059.
  - The panel woke after the sequence had finished, which is allowed.
- **Playback vs backward seeks** (48 → 0, every 0.5 s): identical at all 97.
- **Random-order seeks** (33.5, 2, 47.5, 12, 40, 20.5, 0.5, 29): all identical to playback.
- **Restart** (Space from the held final frame): exact frame 0.
- **Reset from mid-sequence:** Explore at home with everything cleared.
- **Events:** all 20, in order, at their configured times; also in the run with input.
- **Video:** the review video is rendered with the same 1/30 s stepping, so it is the
  deterministic playback.

## 13. Console warnings / errors

Production, every run (validation, regression, performance, capture, both presets):
- no errors;
- no page errors;
- no external requests.

One warning, unchanged since Stage 3: `THREE.Clock: This module has been deprecated`, from
React Three Fiber's internal clock. Development builds also print a D3D shader-compiler note
(X4122, constant folding in a built-in three.js shader). It was recorded at Stage 2 and does
not appear in the production build.

## 14. Decisions needing approval before Stage 7

1. **End state:** the final frame is held under presentation authority, with no automatic
   Explore handoff. R, Space/Home or P leave it. The alternative is an automatic handoff like
   the Stage 3 shot, which would hide the pools and emphasis at that moment.
2. **Master controls are debug-only for now.** That covers Space, Home, `,` `.` and `[` `]`.
   Space is PROJECT.md's planned presenter key; a production entry point belongs to the
   presentation-UI stage.
3. **Passive safety uses only existing, GD-sourced geometry:** the cavity pool and three ICS
   pools (now their own non-selectable registry entry), with the ICS pools emphasised. There
   are no heat exchangers or piping; that is Stage 9. The cavity pool sits in the centre of the
   frame, and the ICS pools flank it.
4. **Control beat:** the Stage 5 elevation composition with the Stage 4 copper emphasis,
   blades left at the operating pattern throughout, which is what Stage 8 will animate from.
   The Stage 4 step-section plan view was rejected because, with operating insertion, its
   mid-core step shows no blades.
5. **Steam line drawn only from 18.0 to 38.6 s**, switched while off screen, so the Explore
   state at the start and the end is unchanged.
6. **Turbine chapter uses the approved Stage 5 X-ray** (dither) on the turbine hall, and
   brings the site context back up for those seconds.
7. **The vessel cut closes during the safety beat** (once the camera has left it), and the RPV
   hero lighting returns. The final frame is the opened plant with the closed, hero-lit RPV,
   the pools above it, and the turbine hall to the right.
8. **Presentation emphasis strength:**

   | | Lift | Rim |
   |---|---|---|
   | Presentation subject | 0.07 | 0.32 |
   | Selection, for comparison | 0.12 | 0.95 |

   - Context dim peaks at 16–19 %.
   - The ICS pools take a 1.6× subject weight in the safety beat.
9. **High preset:**
   - **Control beat:** averages ~46 fps, with the return flight dipping to ~40 fps for about a
     second.
   - **Blade close-up:** holds at the approved Stage 4 level (49 fps).
   - **Low:** 60.

   Optimisation is left to Stage 11.
10. **Two Stage 5 behaviour fixes** found by Stage 6 validation: Reset after a cinematic leaves
    Explore with the section off, and `L` is ignored during a presentation.
11. **Reveal and registry additions:** a `poolsReveal` reveal field and a `pools` interior
    level, used by the safety chapter and closed by Reset.
