# Navigation Polish Review Report (Explore mode)

**Project:** BWRX-300 interactive WebGL module (PROJECT.md is the master spec)
**Scope:** Explore-mode navigation and focus framing only. Stage 7 has not been started. The
Stage 6 master timeline, the Stage 3 opening shot, the presentation camera poses, beat timings,
reveal timings and the cinematic look are unchanged (§8).
**Git:** Stage 6 committed first as its own checkpoint:
**`68466c1f238f827740567e888c7236f7f00f388f`** ("Stage 6: master presentation timeline skeleton
(approved)"), from the reviewed tree after `npm run check` passed. The navigation polish is
**not committed**, pending visual review.

## Deliverables (`docs/navigation-polish-review/`, 1920×1080, production build, high preset)

| File | Content |
|---|---|
| `01-guide-tubes-focus-1080p.png` | Focus on the guide tubes (reached via steam dryer → guide tubes, as in the review flow) |
| `02-crd-lower-vessel-focus-1080p.png` | Focus on the control rod drives with the reactor cut open: bottom head in section, guide tubes inside it, drive housings and motors below |
| `02b-crd-lower-vessel-focus-plant-cut-1080p.png` | The same focus from the plant cut (vessel closed), which is what a click on the drives gives there |
| `03-cursor-zoom-lower-vessel-1080p.png` | After 24 wheel notches from the home view with the pointer on the lower vessel (drawn cursor = the pointer position): the camera arrived at the lower vessel, which is still under the pointer |
| `navigation-polish-1080p.mp4` | 20.4 s, 612 frames, 30 fps, H.264, no audio. In order: open the reactor cut; wheel over the lower vessel (cursor zoom); middle-drag pan; left-drag orbit; double-click a drive housing (pivot) and orbit around it from the side and below; wheel out; click the guide tubes (Focus) and orbit a little; click the drives (Focus); Reset. Real input, frame-stepped capture, with a drawn cursor and captions (harness overlays) |

## 1. Root cause

1. **Wheel zoom was centre-based.** Explore uses three r186 OrbitControls with its default wheel
   behaviour: a dolly towards `controls.target`. The target is wherever the last focus or reset
   left it (the vessel middle, the home target 36 m east of the reactor), so the wheel over the
   bottom head enlarged the middle of the vessel instead.
2. **The lower reactor was unreachable because of the camera floor, not the target box.** With
   the plant open, the target could already go down to y = −45. But outside a focus move Explore
   kept the *camera* above grade (y ≥ 0.5) by capping the orbit's polar angle from the target's
   depth and the orbit distance. With the target on the bottom head (y ≈ −26), every dolly step
   tightened that cap, until the camera stood almost straight above the vessel, looking down the
   cut. A side view of the lower head was impossible, the drives were out of reach, and the
   camera could never look up (the polar limit stopped at horizontal). Panning was right-drag
   only; the middle button dollied.
3. **Some focus poses never showed their subject.**
   - **Guide tubes, core plate, shroud support:** these sit below the core but shared the core
     close-up, taken from above the core. They were not on screen at all (0 % of a 48×27 pick
     grid).
   - **Control rod drives:** used the whole-vessel pose, 57 m away; they covered 0.6 % of the
     screen.
   - **Chimney:** used the steam-region pose, which shows only its top, at the bottom edge.
   - **Downcomer:** used the whole cutaway at 50 m, where it was a 17 px band.

## 2. Controls implemented

| Input (Explore only) | Behaviour |
|---|---|
| Wheel over a surface | Cursor-centred zoom: the camera moves along the line through the surface point under the pointer, so that point stays under the pointer; the view direction does not change. The orbit centre is re-seated on the view axis at that point's depth, so the next orbit or pan turns around what is being looked at. About 10 % of the distance per notch, eased over ~150 ms. |
| Wheel over the background | Conventional dolly towards the orbit centre (no target jump) |
| Wheel out | The same, reversed: the point under the pointer stays there |
| Middle-drag, right-drag, Shift + left-drag | Screen-space pan, damped (OrbitControls' own pan; middle was dolly before) |
| Left-drag | Orbit (unchanged) |
| Double-click a visible surface | Orbit around that point from now on. The camera stays where it is and turns to it in 0.35 s (`power2.out`); no marker. It moves only if a limit requires it, and only that far. Selection is not changed |
| Click | Selects and focuses, as before, but now applied 0.3 s after the click, once no second click followed (§5) |

**Implementation.** There is still one controller: the existing OrbitControls, driven by the
camera director.
- **Cursor zoom.** `ExploreOrbitControls` (`camera/ExploreOrbitControls.ts`) is the same
  OrbitControls with one change: its internal wheel step (`_handleMouseWheel`) is overridden to
  hand the step to Explore. The listener, its gating (controls disabled, a drag in progress),
  `preventDefault` and the delta normalisation all stay OrbitControls' own.
  - ExploreDriver picks once with the Stage 5 picking: cut-away parts and ghosted shells are
    skipped, as for clicks.
  - The director applies the zoom in its per-frame update (`cameraDirector.wheelZoom`), eased
    on the animation clock.
  - Wheel steps at the same pointer position within 300 ms reuse the first pick. This is exact,
    because the zoom moves along the line through that point; a fast burst costs one raycast.
- **Why not OrbitControls' `zoomToCursor`.**
  - Its step is a fraction of the orbit radius, so once the radius reaches `minDistance` the
    wheel stops, even with the surface under the pointer still far away.
  - It re-seats the target at that radius, in front of or behind what was pointed at.
  - It cannot tell a surface from the background.
- **Guards.** The zoom stops at the minimum orbit distance from the point and never backs away
  while zooming in. It also stops at the camera's floor. It never re-seats the orbit centre
  outside the allowed target volume: there the depth is shortened along the view axis instead,
  e.g. for far ground near the top edge, where the axis would enter the ground. Without that,
  the bounds clamp would shift the whole view.
- **Middle button.** A middle-button press no longer starts the browser's autoscroll.

## 3. Bounds logic (`camera/exploreBounds.ts`, `cameraDirector.applyExploreLimits`)

Context comes from what is physically cut open (the reveal state). Explore's section, the end of
the Stage 3 shot and the Stage 4 review are therefore treated alike.

| Context | Orbit centre (target) | Camera |
|---|---|---|
| Closed plant (home, after Reset) | `panBounds` (above grade), as before | above grade: polar cap from y 0.5, as before; never looks up; minimum distance 4 m |
| Plant partly cut, or the Stage 2 section review | `panBoundsSection`, as before | as before |
| **Plant fully cut** (excavation, building, containment open; Plant or Reactor context) | above grade (`panBounds`), **or anywhere in the opened reactor volume**: x −40..20, z −9.5..84 (excavation + containment interior), y down to −36. Nearest-box clamp, so it slides along the boundary | over or in the open excavation (x −39..19, z 0.5..83) it may go **below grade down to y −35**, **look up to ~29°** when below grade, and come to **2.5 m**. Below grade it is kept **in front of the section plane** (it slides along the cut instead of entering the uncut walls or earth behind it) |

- **Hard and relaxable limits.** Floors are hard. The limits that differ by context (look-up
  angle, minimum distance) never move the camera: one the current pose already exceeds is relaxed
  to that pose and only stops further motion. A context change therefore cannot snap the view
  (leaving the excavation, a partial close of the cut, a focus hand-back).
- **Partial close.** A camera that went below grade in the open cut is then treated like a
  below-grade focus, so a partial close of the cut does not snap or bury it. Turning the section
  off still flies it out (unchanged).
- **Reset** closes the reveal, which restores the closed-plant bounds. Verified: home pose
  exact, minimum distance 4, polar limit π/2 − 0.04, below-grade flag cleared.
- **Not affected.** None of this applies to the presentation or cinematic cameras.

## 4. Focus poses audited and changed

Each Tier-1/2 internal focus, plus the Tier-3 parts that share their poses, was captured from a
reset state through the real `select` → `focus` path. The coverage column is the share of a
48×27 pick grid that resolves to the subject.

| Component (tier) | Before | Verdict | After | Coverage before → after |
|---|---|---|---|---|
| Reactor vessel (1) | `rpvExterior` | pass | unchanged | 6.1 % |
| Reactor core (1) | `coreCloseup` | pass (its parts fill the frame) | unchanged | – |
| Fuel (1) | `coreCloseup` | pass | unchanged | 24.2 % |
| Control blades (1) | `controlBladesCloseup` | pass (approved Stage 4/5 composition) | unchanged | 8.3 % |
| Top guide (3) | `coreCloseup` | pass | unchanged | 5.8 % |
| Core shroud (2) | `coreCloseup` | pass (cut edges both sides) | unchanged | 1.2 % |
| Steam separators (1) | `steamRegionCloseup` | pass | unchanged | 3.6 % |
| Steam dryer (1) | `steamRegionCloseup` | pass | unchanged | 7.7 % |
| **Guide tubes (3)** | `coreCloseup` | **fail**: not in frame, view from above | **`guideTubesCloseup`** | 0 → 3.9 % |
| **Core plate (3)** | `coreCloseup` | **fail**: hidden under the fuel | `guideTubesCloseup` (the plate between the tubes and the fuel) | 0 → visible as a full ring, almost edge-on |
| **Shroud support (3)** | `coreCloseup` | **fail**: not in frame | `guideTubesCloseup` | 0 → 1.8 % |
| **Control rod drives (2)** | `rpvExterior` | **fail**: 57 m away | **`lowerVesselCloseup`** | 0.6 → 5.8 % |
| **Chimney (1)** | `steamRegionCloseup` | **fail**: only its top, at the bottom edge | `chimneyCutaway` | 2.2 → 5.4 % |
| **Chimney head (2)** | `steamRegionCloseup` | **fail**: a lid at the bottom edge | `chimneyHeadCloseup` (lower third, separators standing on it) | 0.3 → 0.5 % |
| **Downcomer (2)** | `rpvCutaway` | **fail**: a 17 px band at 50 m | `chimneyCutaway` (warm region bands both sides of the chimney, core below) | 0 → 4.2 % |
| Bottom head (2) | not selectable (selects the vessel) | – | shown by `lowerVesselCloseup`; no new public component | – |

The new compositions, as authored camera states in `config/camera.ts`, are referenced from the
registry's existing `focus` field. There is no separate focus registry and no automatic
bounding-box camera.

- **`guideTubesCloseup`**: from the side, 8° above level, 12.5 m into the vessel cut. The bottom
  head is in section, the guide-tube forest stands between it and the core plate, the bottom of
  the fuel is above, and the drive housings below.
  - The guide tubes take the existing selection highlight.
  - The blades visible inside the half-cut tubes on the cut planes are dark and not highlighted.
- **`lowerVesselCloseup`**: from the side and about 9° below, 18.5 m. The full drive housings and
  motors, the bottom head, and enough lower shell to show what they connect to; the cut pedestal
  ring frames them. With the reactor cut open (02) the head is in section and the guide tubes
  show inside it. From the plant cut (02b) the head is the closed dome.
- **`chimneyCutaway`**: the approved Stage 6 "architecture" framing (core, chimney and the
  downcomer gap in one frame), copied as its own Explore state rather than referenced, so later
  work on the master camera cannot move an Explore focus.
- **`chimneyHeadCloseup`**: the chimney head with the separators standing on it.

## 5. Interaction details

- **Wheel vs selection.** The wheel never changes hover or selection: selection and focus were
  identical before and after every wheel test. Hover re-picks only when the camera comes to rest
  (Stage 5 behaviour). With cursor zoom that is the same part under the pointer.
- **Double-click vs selection.** To keep a double-click from selecting, deselecting or starting
  a focus flight, a single click is applied 300 ms after it, once no second click followed.
  - A second press within 300 ms and 6 px is a double-click: pivot, no selection change.
  - Any other press cancels the waiting click.
  - The waiting click is dropped if a reset, focus or cinematic took the camera meanwhile.
  - Verified: selection is null 50 ms after a click and set at 500 ms. A double-click leaves the
    selection null and produces exactly one 0.35 s transition (pivot).
- **Camera authority.**
  - Wheel, pan and double-click act only under the `explore` authority; OrbitControls is
    disabled under `transition` and `cinematic`, and the director checks authority again.
  - During the Stage 3 shot and the Stage 6 master, all of it is ignored (§8, run with input).
  - A grab or wheel during a focus or reset transition interrupts it, as before (existing rule).
- **Hand-back.** After every focus the camera and target are exactly the authored pose; no limit
  snapped them (the new limits are relaxed to the hand-back pose). Over 30 idle frames the drift
  was 0. A 40 px orbit drag then ramps smoothly from the first frame (0.04, 0.08, 0.10, 0.13 m
  per frame), with no jump. Pending wheel zoom is dropped at every authority change.

## 6. Tests

All tests use the production build at 1920×1080 with real input (`page.mouse` wheel, middle,
right and left drags, clicks and double-clicks, keys). Both presets were run; High and Low give
the same results except where stated. Harness scripts are in the session scratchpad (`navtest`,
`focusaudit`, `s5interact-nav`, `s6compare`, `navperf`, `navprofile`, `navvideo`, `navstills`).

**Cursor zoom** (`navtest`). "Drift" is where the picked surface point projects after the zoom,
measured against the pointer.

| Case | Distance to the point | Drift | View turn | Selection |
|---|---|---|---|---|
| Lower vessel, 6 notches from the home view | 200.1 → 108.1 m | 0 px | 0° | unchanged |
| + 8 notches | 107.6 → 47.4 m | 0 px | 0° | unchanged |
| + burst of 16 notches, 8 ms apart | 47.4 → 9.2 m | 0 px | 0° | unchanged |
| + 10 notches (reaches the guide tubes, stops at 2.5 m + depth) | 8.8 → 3.1 m | 0 px | 0° | unchanged |
| 6 notches out over the same point | 3.1 → 5.8 m | 0 px | 0° | unchanged |
| Drives, with the camera pressed against the cut plane (keep-in-cut slides it) | 5.8 → 3.6 m | 1.8 px (Low 1.6) | 1.6° (1.4°) | unchanged |
| Background (sky), 5 notches | orbit centre unchanged; 213.6 → 127.9 m to it | – | 0° | unchanged |
| Left / right viewport edge (ground, building) | 78.6 → 42.5 / 30.6 → 16.6 m | 0 px | 0° | unchanged |
| With a selection active | 14.3 → 9.5 m | 0 px | 0° | unchanged |
| After a resize to 1280×720 | 181.2 → 97.9 m | 0 px | 0° | unchanged |

In every anchored case the orbit centre ends exactly at the point's depth on the view axis.
Repeated and burst steps leave no drift.

**Navigation** (`navtest`):
- **Pan.** A middle drag of 340 px with the orbit centre 5.8 m away moved camera and target
  together; the camera's offset to the target stayed the same, to 0 m.
- **Bounds.**
  - With the plant closed, panning down stopped the target at y 0.499.
  - With the cut open, the target goes down to the bottom head (y −26.4) and the drives.
- **Keep-in-cut.** A 60-step orbit below grade: minimum camera z 0.500 at every sample, never
  behind the cut plane; minimum camera y −29.4.
- **Drives from the side and below without a preset.** Camera at y −29.2 below a target at
  −27.4, looking up, with the drives at the screen centre.
- **Double-click.**
  - Target lands on the hit point (0 m off), camera moved 0 m, hit point centred on screen
    (960, 540).
  - The transition lasted ~0.32 s (sampled) and selection did not change.
  - A following orbit keeps the pivot (0 m) and its distance.
- **Click timing.** Single click: nothing selected at 50 ms, selected (chimney) at 500 ms.
  Double-click: no selection.
- **Reset after arbitrary panning.** Exactly the home pose (`[-95, 64, 150]` → `[36, 5, -8]`).
  Cut context closed, minimum distance 4, polar limit π/2 − 0.04, below-grade flag off, all
  Explore state initial.
- **Focus hand-back** (guide tubes; steam dryer → guide tubes → drives). Each ends exactly on its
  authored pose. Idle drift over 30 frames: 0. The first orbit frames ramp smoothly (table in §5).
- **Programs** 13 → 13 (High), 14 → 14 (Low). No errors, no external requests. The only warning
  is the known `THREE.Clock` deprecation from React Three Fiber.

**Stage 5 interaction regression** (`s5interact`, High and Low, all pass):
- real hover and click on the RPV; X, L, I, C and Esc;
- 40 random Explore operations + R give a frame byte-identical to the untouched default;
- presentation safety during the Stage 3 shot, whose final frame is byte-identical to a fresh
  page's;
- a quality switch keeps the selection; the label stays on screen at 1280×720.

The test now waits 400 ms after its real click before reading the selection, because of the
double-click window. Selection right after the click is null, as intended.

## 7. Manual UX validation

The requested tasks were run as scripted real-input sessions, not by a person's hand: `navtest`
and the review video, High and Low. A hands-on pass is still the reviewer's call.

| # | Task | Result |
|---|---|---|
| 1 | Open the reactor cut (C, then Reactor in the panel) | Cut context on |
| 2 | Pointer on the lower vessel, wheel in several times | Moves to the lower vessel, which stays under the pointer (0 px), not to the generic centre; ~10 % per notch |
| 3 | Pan down, orbit around the lower head | Middle drag moves target and camera; orbit pivots at the bottom head; the camera stays in front of the cut |
| 4 | Drives from the side and below, no preset | Camera below the drives looking up at them (y −29.2 vs target −27.4) |
| 5 | Double-click a lower-vessel point, orbit | Pivot onto the drive housing in 0.35 s; orbit keeps it |
| 6 | Reset | Exact home, closed limits |
| 7 | Focus guide tubes | `01`: lower plenum between bottom head and core plate, fuel above, drives below |
| 8 | Orbit a little after it | No jump (smooth ramp from the first frame) |
| 9 | Steam dryer → guide tubes → drives | Each move lands on a composition that shows where the part is: the vessel top with nozzles, the lower plenum, then under the vessel |
| 10 | Same in Low | Same numbers (§6) |
| – | Viewport edges, background, bursts, 1280×720, reset after panning | §6 |

## 8. Stage 6 regression

Method: the committed Stage 6 build (`68466c1`, built from that tree) and the navigation build,
production, High and Low. The animation clock was stepped exactly 1/30 s per frame and frames
were compared as PNG hashes (`s6compare`).

| Check | High | Low |
|---|---|---|
| Duration | 48.0 = 48.0 | 48.0 = 48.0 |
| Beat / event / camera-key / reveal / look timings (`master.timings()`) | identical | identical |
| Master camera function, 1,441 samples at 1/30 s | identical | identical |
| Look function, 97 samples | identical | identical |
| Isolated Stage 3 shot, 0–10 s by seek, 31 frames | **byte-identical** | **byte-identical** |
| Master by seek, every 0.5 s, 97 frames | **byte-identical** | **byte-identical** |
| Master gated playback, 97 samples | **byte-identical** (isolated run) | **byte-identical** |
| Playback = seek, within the new build | 97 / 97 | 97 / 97 |
| Playback with every Explore navigation input sent between samples (wheel, middle / right / Shift drags, clicks, double-clicks, X C I L Esc) vs without | equal except 48.0 s, both builds | same |
| Events | all 20, same order and times; same with input | same |
| Programs | 13 → 13 | 14 → 14 |
| Console | no errors, no external requests | same |

- **The 48.0 s difference** is the setup panel waking after the sequence has finished
  (x 1545–1900, y 998–1060, identical in both builds), as in the Stage 6 report. The final frames
  of the two builds are identical.
- **A contended High run.** The first High run was captured while the review video was being
  captured on the same GPU. Two playback samples (0 and 3.5 s) then differed from seek in *both*
  builds: a recurring alternate frame, not this change. The isolated rerun is fully identical.
- **No hand-back change.** The Stage 3 shot's final frame after its hand-back to Explore is
  byte-identical to a fresh page's (§6). The hand-back limits allow that pose without changing it.

No master, Stage 3, reveal or camera-pose data was touched (`git diff` adds lines only to
`config/camera.ts`).

## 9. Performance

Production, Iris Plus, 1920×1080, real time, two runs per state.

**Idle in the same states, Stage 6 build vs navigation build** (fps):

| State | High, Stage 6 | High, navigation | Low, Stage 6 | Low, navigation |
|---|---|---|---|---|
| Home, closed plant | 56.4 / 56.3 | 56.3 / 56.5 | 56.2 / 56.2 | 56.2 / 56.3 |
| Reactor cut, cutaway view | 40.8 / 41.2 | 40.7 / 41.8 | 56.2 / 56.1 | 56.3 / 56.2 |
| Guide-tube pose | 29.9 / 30.3 | 30.4 / 30.8 | 46.7 / 48.0 | 46.3 / 48.3 |

Idle cost is unchanged within run-to-run variation. Draw calls are the same.

**Machine state.** This machine measured lower than at Stage 6 throughout this session: home
56 fps instead of 60, the approved blade close-up 33–35 instead of 49. It is the same for both
builds, so it is not this change. Absolute numbers here are not comparable with the Stage 6
report.

**CPU cost of the navigation code** (CDP sampling profiler, production; class methods keep
their names):
- **Idle:** the director's per-frame limits are below the profiler's resolution (well under
  0.01 ms per frame).
- **Wheel zoom, a notch every 45 ms for 4 s:** about 7 ms of CPU in all, roughly 0.03 ms per
  frame. That covers the wheel handler, the zoom step, the limits and the pick.
- **Fewer raycasts.** Raycasting during that wheel burst fell from 33 ms (Stage 6 build: hover
  re-picked after every instant dolly step) to under 1 ms (one cached pick per gesture; hover
  re-picks when the eased camera comes to rest).
- **Unchanged:** no post-processing, no shader changes, no program added; no per-frame React
  state; no raycast without input.

**View cost of the new compositions** (High / Low fps, same session):

| Pose | High | Low |
|---|---|---|
| core close-up (existing) | 41.5–46.6 | 56 |
| blade close-up (existing) | 33.2–35.1 | 53–56 |
| steam-region close-up (existing) | 38.3–39.7 | 56 |
| **guide-tube close-up** | **29.6–30.9** | **47–49** |
| lower-vessel close-up | 32.8–33.6 | 54–55 |
| chimney cutaway | 38.2–39.1 | 56 |

**Heaviest view.** The guide-tube composition is the most expensive Explore view: about 10 %
below the blade close-up on High, and the only new pose under 50 fps on Low. Many tubes and
blades are in view with the fuel above them. This is scene rendering cost, not navigation code
(the Stage 6 build at the same camera pose measures the same). It is listed for review in §11.

**Interaction pacing in this session:**
- Wheel zoom in and out over the lower vessel: 31.9 fps High, 48.3 Low.
- Pan: 31.7 fps High, 48.7 Low.

Both are set by the views the camera flies through (the lower-vessel interior), not by the
input handling.

## 10. Files changed

**New:**
- `src/camera/ExploreOrbitControls.ts`: OrbitControls with the wheel step handed to Explore.
- `src/camera/exploreBounds.ts`: the cut context, target clamp and keep-in-cut.

**Changed:**
- `src/camera/cameraDirector.ts`:
  - `wheelZoom` (eased cursor zoom);
  - `pivotTo` plus a `linear` transition path;
  - context limits (`applyExploreLimits`, which replaces `keepCameraAboveGrade`);
  - keep-in-cut after each update;
  - pending zoom dropped on authority changes.
- `src/camera/CameraRig.tsx`: the subclass, middle and right pan, no middle-button autoscroll,
  and the target clamp from `exploreBounds`.
- `src/interaction/ExploreDriver.tsx`: the wheel pick, the deferred click and the double-click
  pivot.
- `src/config/camera.ts`: four Explore focus states; `ORBIT.wheel`, `ORBIT.pivot` and
  `ORBIT.openCut` (data only).
- `src/scene/components.ts`: focus references for seven internals.
- `src/debug/automation.ts`: `navigation()` (context and limits in force).
- `README.md`.

**Not changed:**
- animation code (`heroShot`, `masterSequence`, `revealTimeline`, `presentation`);
- master and Stage 3 data and any existing camera pose;
- shaders, materials, section layers, geometry, Explore visuals.

## 11. Decisions for review

1. **Single click waits 0.3 s.** This is what keeps a double-click from selecting, deselecting
   or starting a focus flight. A click is applied once the double-click window passes. A
   slower double-click than 0.3 s acts as two clicks on the same part. The alternative is a
   modifier gesture (e.g. Alt + click) with no click delay.
2. **Wheel speed.** About 10 % of the distance per notch, eased over ~150 ms; it was 4 %, instant.
   Pinch zoom keeps the old speed.
3. **Opened plant, below grade:**
   - the camera may look up to ~29° and come to 2.5 m (4 m elsewhere);
   - it stays in front of the section plane, so a close orbit around a point near the reactor
     axis is limited to the open front half and slides along the cut.

   The containment interior behind the cut was not opened to the camera. A union of the two
   volumes gives jumps where they meet, and the uncut walls there make poor views.
4. **Context comes from the reveal.** After the Stage 3 shot hands back with the plant cut open,
   Explore may now descend into the excavation too.
5. **Chimney and downcomer share one composition** (`chimneyCutaway`). Its values are copied from
   the approved Stage 6 architecture pose, not referenced, so master edits in later stages
   cannot move an Explore focus.
6. **Control rod drives keep `opens: 'plant'`.** From the plant cut the bottom head is closed
   (02b); with the reactor cut it is in section with the guide tubes inside (02). The bottom
   head itself stays non-selectable (it selects the vessel); no new public component.
7. **Guide-tube focus is the heaviest Explore view** (§9): ~30 fps High, ~48 Low on this machine
   today. Options: a closer, narrower framing; or leave it to the Stage 11 optimisation pass.
8. **Video timing.** The capture is frame-stepped (exact 1/30 s animation time), but the 0.3 s
   click window runs on wall-clock time. In the video each focus therefore starts about 0.1 s
   after its click instead of 0.3 s. The cursor and the captions are harness overlays, not app
   UI.
9. **On the guide tubes** the selection rim reads subtly on thin tubes. The blades visible
   inside the half-cut tubes on the cut planes are dark and are not highlighted.
