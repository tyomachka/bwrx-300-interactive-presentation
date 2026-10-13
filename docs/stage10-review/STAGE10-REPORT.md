# Stage 10: fission inset, review report

## 1. Status / checkpoint

- **Status:** implemented, **not committed** (awaiting review); Stage 11 not started. Profile **FAST**,
  plus the one full 48 s export you asked for. No FULL trigger fired (§6).
- **Stage 9 checkpoint:** commit `8315c2d6d65eee5d5e1c5264bb2bd82e2882896d` ("Stage 9: passive safety /
  isolation condenser (approved)"). It is the approved shutdown-handoff build: `npm run check` gave
  the validated bundle `index-BLD6NRZ3.js`, and no file was newer than the Stage 9 report.
- **Build:** `npm run check` passes (bundle `index-Bw0pkPxp.js`, verified before every capture). No
  external requests. No new console output (only the existing `THREE.Clock` deprecation warning).
- **Architecture:** no render target, no post-processing, no change to the camera, timeline,
  section or material-injection architecture. Four new standalone `ShaderMaterial`s.
- **Sources:** the new claims were verified and cached as FIS-01…07 in `references/TECHNICAL_FACTS.md`
  (§3). The GD has no microscopic physics.

**Deliverables (this folder):**
- `stage10-fission-focus-15.5-21s-1080p.mp4`: fixed-step playback, 166 frames.
- `stage10-complete-story-1080p.mp4`: the full 48 s, fixed-step playback, 1441 frames.
- Stills `01`–`06`: the view opens from the fuel; neutron and U-235; excited nucleus; split; chain and
  heat; heat back in the fuel.
- `validation/`: determinism, performance (including the Low A/B) and capture JSON, plus a Low still (18.3 s).

## 2. What changed

The 16.0–20.5 s placeholder is now a microscopic inset nested in the core hold. The camera keys and
the beat boundaries are untouched; times are master time.

| Time (s) | What the viewer sees |
|---|---|
| 16.0–16.3 | A thin ring marks one spot on the fuel face |
| 16.15–16.75 | The micro view grows out of that spot (iris + zoom); a dark field, the core faint behind it |
| 16.45–17.2 | A neutron crosses and is absorbed by the U-235 nucleus (labels: neutron, U-235) |
| 17.2–18.0 | The excited nucleus wobbles and stretches into a dumbbell with a thinning neck |
| 18.0 | Split: two unequal fragments fly apart, fast then slowing; three neutrons leave; a soft warm swell |
| 18.0–18.95 | One neutron, slowing, reaches a second nucleus and is absorbed (the chain) |
| 18.1–19.6 | Warm heat widens along the fragments' paths as they slow ("energy → heat") |
| 18.95–19.9 | The second nucleus starts to deform: the next fission begins; no cascade |
| 19.65–20.42 | The view zooms back into the fuel spot; the dark dissolves; the heat becomes a soft warm spot on the fuel and fades |
| 20.5 | The Stage 7 core flow starts, unchanged (frame identical to Stage 9) |

- **Rendering** (`scene/fission/`): a camera-space overlay in the normal pass, drawn last
  (renderOrder 900–903). Four draw calls while active, none outside 16.0–20.42 s:
  - a backdrop quad, which writes its own depth;
  - one instanced draw of 196 spheres (two nuclei of 96, plus 4 neutrons);
  - one draw of energy / heat sprites;
  - one draw of labels.
- **Motion:** every particle position is an analytic function of τ = t − 16.0 on the GPU (wobble,
  dumbbell, split with drag, relaxation into round fragments, neutron paths) over seeded static data.
  No physics, no history. The fuel spot is projected from world space in the vertex shader, so the
  inset follows the master camera exactly.
- **State:** `animation/fissionInset.ts` gives the frame values (zoom, iris, fades, labels) as a pure
  function of 1 µs-quantised master time.
- **Explore:** the Fission replay is deferred (it would add a store field, an action, a panel button
  and the Stage 5 suite). Explore never draws the inset.
- **Diagnostics:** `__bwrx.fission.state / stateAt / stats / uniforms / hide`.

## 3. Scientific facts / assumptions (`references/TECHNICAL_FACTS.md` FIS-01…07)

Sources: the NRC Glossary ("Fission"), and DOE-HDBK-1019/1-93, NP-01 pp. 49, 57, 58, 61–62 and NP-02
p. 29.

- **Shown (OFFICIAL):** a neutron is absorbed; the excited compound nucleus oscillates, distorts into
  a dumbbell and splits (liquid-drop model); the fragments have unequal masses (most probable pair
  about 95 and 140); two or more prompt neutrons are released (three in the handbook's typical
  reaction, DERIVED); most of the energy is the fragments' kinetic energy (167 of 187 MeV
  instantaneous), which becomes heat in the fuel as they slow.
- **[SCHEMATIC — NOT TO SCALE / NOT EXACT NUCLEON COUNT]:** 96 spheres per nucleus, not 235; two
  tones in the U-235 proportion (92 : 143, i.e. 38 of 96); fragments 38 : 58 spheres (a 40 : 60
  share), the second nucleus set to split differently (43 : 53); the light fragment moves faster
  (equal momentum).
- **Simplified:** the released neutron slows on its way (a hint of moderation by water, not drawn as
  collisions).
- **Not implied:** no electrons or orbit rings; no glowing nuclei; no gamma, alpha or beta shown as
  the driver; no single fixed fragment pair; the water is not heated by neutrons; no explosion,
  flame, shockwave or lightning.

## 4. Visual / UX decisions

- **Look:**
  - The colours follow the film: a dark neutral field (alpha 0.94, the core faint behind), matte
    warm-grey and cool-grey nucleons, free neutrons a lighter cool grey.
  - A free neutron is the same size as a nucleon (a neutron is one).
  - One restrained warm accent marks energy and heat; normal blending, tone mapped.
- **Iteration notes:** the first packing put the nucleons on a helix (two correlated golden-ratio
  sequences), so the nuclei looked twisted; they now use seeded Poisson packing. A thin ring at the
  split read as a shockwave and is now a soft swell. Warming the closing view looked like a muddy
  brown lens; the view now dissolves, and the heat alone shrinks into the warm fuel spot.
- **Labels:** three small labels from a canvas atlas in the UI font family. They are optional: each
  label's time window in `config/fission.ts` switches it on or off.
- **Close:** the inset's last trace (the warm spot) fades by 20.42 s, so 20.5 s is the exact Stage 7
  frame.

## 5. Performance (production, 1920×1080, Iris Plus / D3D11, serial; S9/S8 = stored numbers)

| Run | fps | p95 | worst | > 20 ms | draw calls | programs |
|---|---|---|---|---|---|---|
| **Low, full 48 s** | 60.0 (S9 60.1) | 16.8 ms | 33.3 ms | 6 / 2880 (S9 1) (a) | 51–81 | 24 → 24 (S9 20 → 20) |
| **Low, fission 16–20.5** | **60.1** (S9 60.1) | 16.8 | 17.2 | **0 / 270** (S9 0) | 57–61 (S9 57) | |
| Low, micro 16.7–19.8 | 60.1 | 16.8 | 17.2 | 0 / 186 | 59–61 | |
| **High, fission 16–20.5** | **57.2** (S9 53.3; S8 53.0–55.7, 6 runs) | 32.9 (S8/S9 33.2–33.4) | 33.7 (S9 66.4) | 13 / 257 (S8/S9 20–31) | 56–121 (S9 56–118) | 22 → 22 (S9 18 → 18) |
| High, micro 16.7–19.8 | 57.2 | 33.2 | 33.7 | 9 / 176 | 58–121 | |
| High, flow 20.5–29 / safety 41.5–46 (outside) | 52.6 / 51.3 (S9 52–53 / 49.9–51.1) | 33.3 / 33.4 | 49.8 / 49.9 | | | |

- **(a) Low A/B (cause unclear, so I ran one).** The extra slow frames are in 11–12 s, while the
  vessel cut opens and the shadow map re-renders, outside the changed window. One Low run each,
  back to back:

  | Window | Stage 9 build | Stage 10 build |
  |---|---|---|
  | Core 10–16 s | 5 / 356 frames over 20 ms, worst 33.4 ms | 5 / 356, worst 33.2 ms |
  | Fission 16–20.5 s | 1 / 269 | 0 / 270 |

  It is present on this machine regardless of Stage 10 (a stored Stage 8 run also had 2 there).
  Low stays presentation-safe at 60 fps.
- **The inset's cost:** +3 draw calls at the peak, and 35,280 sphere triangles on High (196 ×
  180, a detail-2 icosphere) or 15,680 on Low (detail 1). The rest are quads. No shadows; one
  full-screen layer (the backdrop). High is not slower: the window measured 57.2 fps against the
  stored 53–55.7.
- **Programs:** +4, the four inset materials. They compile in the ready gate, and the count is
  constant through playback.

## 6. Determinism / regression

Gated fixed-step playback (Home, 1/30 s per frame) against seek; frames are PNG hashes.
Outside-window goldens are the stored Stage 9 seek hashes, plus the shutdown-handoff hashes for
41.4–44.6 s (`validation/stage10compare-*.json`).

| Check | High | Low |
|---|---|---|
| Changed window 16.0–20.5 s: seek = playback | **46 / 46** (every 3 frames) | **16 / 16** (every 9 frames) |
| Window edges 16.0 s and 20.5 s = Stage 9 frames | identical | identical |
| t = 18.0 s: forward, backward (from 47.9), 3× random-order seek, playback | identical | identical |
| 7 other random-order seeks (3.5, 16.5, 17.3, 19.4, 20.2, 30, 44 s) = forward seek | identical | identical |
| Outside-window goldens (0–48 s, incl. the Stage 3 shot) | **22 / 22** | 13 / 14 (b) |
| Outside-window playback = seek | all but 4.0 s (b) | all but 4.0 s (b) |
| Timings, camera function (1441 poses), look function = Stage 9 | identical | identical |
| Shader programs, ready → after playback | 22 → 22 | 24 → 24 |
| Events / end status (full export) | all 20 / `finished` at 48.0 s | – |

- **(b) Frame 120 (4.0 s, in the Stage 3 shot, the inset not drawn): a known load-time flake.**
  - On High, seek and playback gave the same two hashes this frame has flipped between since
    Stage 8 (`9006280e` / `3753e6b3`, 3 pixels by 1 level).
  - On Low, the first-pass seek gave an alternate once. Re-probed on both builds served side by side
    (2 fresh pages × 3 seek orders each): the Stage 9 and Stage 10 builds both render the golden
    `47a5c12a` every time, and this run's playback equals it.
  - Not a regression. No other outside-window frame changed.
- **Not run:** the navigation suite, the focus audit, the Stage 5 suite and dense Stage 3. No file of
  theirs changed; the goldens cover 0–10 s.

## 7. Files

- **New:** `src/config/fission.ts`, `src/animation/fissionInset.ts`, `src/scene/fission/`
  (`fissionData.ts`, `fissionShaders.ts`, `buildInset.ts`, `FissionInset.tsx`).
- **Changed:** `src/scene/SceneCanvas.tsx` (mounts the inset), `src/debug/automation.ts`
  (`fission.*`), `README.md`, `ARCHITECTURE.md`, `references/TECHNICAL_FACTS.md`.
- No Explore, camera, navigation, picking, focus or section file changed, so their suites were not
  run.

## 8. Open questions / approval items

1. **Labels:** keep the three small labels (U-235, neutron, energy → heat), or go label-free?
2. **The chain:** the second nucleus only starts to deform as the view closes. A full second split
   would need about 0.5 s more inside the window.
3. **Explore Fission replay** is deferred; it can be added later as a small Explore-mode change.
4. **Backdrop opacity 0.94** keeps the core faintly visible. Fully opaque would hide it.
5. **Pre-existing, unchanged:** the 4.0 s load-time flake (§6); GSAP 1e-7 s rounding.
