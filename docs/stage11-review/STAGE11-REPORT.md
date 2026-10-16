# Stage 11: presentation build, review report

## 1. Status / checkpoint

- **Status:** implemented, **not committed** (awaiting review); Stage 12 not started. Profile **FULL**.
- **Stage 10 checkpoint:** commit `5244e10651f98c51045c08f985c6cbb53cd6dbc0` ("Stage 10: fission inset
  (approved)"), made before any Stage 11 change.
- **Build:** `npm run check` passes (bundle `index-dE70IHcZ.js`, verified on the server before every
  capture). `npm run build:portable` gives `dist-portable/BWRX300/`, and two consecutive builds are
  byte-identical (`BWRX300.html` md5 `af2054504d51…`).
- **Content:** none. No change to the story, the camera, the timeline, the science, the materials,
  the shaders, the geometry or the effects. Every master frame at 1920×1080 is identical to Stage 10
  (§7).
- **Console:** only the existing `THREE.Clock` deprecation warning. Firefox also prints three's
  `KHR_parallel_shader_compile not supported` notice. No external requests in any test.

**Deliverables (this folder):**
- `stage11-final-candidate-1080p.mp4`: the full 48 s at 1080p30, fixed step, H.264 High@4.0,
  yuv420p, CRF 18, no audio, 1441 frames, 20.9 MB. It is also the fallback video.
- Stills `01`–`07`: High at 1920×1080. They show the exterior / start (0 s), core / fission
  (18.2 s), natural circulation (24 s), turbine / generator (34 s), control (40 s), passive safety
  (45.3 s) and the final frame (48 s).
- Still `08`: 1024×768 (4:3, letterboxed), Low, 18.2 s.
- `compat-contact-sheet.png`: 16:9, 16:10 and 4:3 window sizes, Low, six times each.
- `compat/`: the Explore UI at 4:3, 16:10, Windows 125 % and 4K; one 16:10 master frame; the X-ray
  dither check; the fallback screen playing the video.
- `validation/`: JSON for every run named below.

## 2. Profile first (Stage 10 build, 1920×1080, Iris Plus / D3D11, before any change)

Frame times are production real-time playback. GPU time is timer queries around `render()`;
Intel clocks move it ±10–15 % from run to run.

| State | High fps (frames > 20 ms) | High GPU ms | Low fps (> 20 ms) | Low GPU ms |
|---|---|---|---|---|
| Control chapter | **44.3 (76)** | **20.8–22.3** | 60.1 (0) | 13.1–13.5 |
| Safety 41.5–46 s | 51.3 (39) | 13.7–18.1 | 60.1 (0) | 12.3–12.4 |
| Flow 20.5–29 s | 52.6 (63) | 14.9–17.3 | 60.1 (0) | 12.6–13.2 |
| Turbine / generator 29–36.5 s | 53.2 (52) | 17.4–18.0 | 60.1 (0) | 12.5–13.6 |
| Vessel / core 10–16 s | 55.6 (27) | 14.9–17.7 | 59.1 (6) (a) | 11.5–11.7 |
| Fission 16–20.5 s | 57.2 (13) | 16.2–16.7 | 60.1 (0) | 12.5–12.9 |
| Stage 3 reveal 0–10 s | 60.1 (0) | 10.8–11.6 | 60.1 (0) | 11.6–12.9 |
| Explore: guide-tube focus | **44.8 (77)** | **23.1** | 60.1 (0) | 13.1 |
| Explore: CRD / lower vessel | 57.1 (15) | 19.6 | 60.1 (0) | 13.0 |
| Explore: flow / turbine | 52.3 (39) | 17.6 | 60.1 (0) | 12.3 |
| Explore: safety pools | 59.9 (1) | 15.1 | 60.1 (0) | 12.0 |

- **Low is inside the target everywhere.** It runs at 60 fps with no slow frames in any state
  except (a), the known 11–12 s vessel-opening flake, which every build since Stage 8 shows.
- **The guide-tube Low view is fine.** The 47–49 fps reported earlier came from a degraded
  machine session; re-measured it gives 60.1 fps, 0 slow frames, 13.1 ms.
- **Both qualities are fill-bound.** At half pixel ratio the guide-tube Low view drops from
  12–13 ms to 3.4 ms. Hiding any single mesh saves at most 1.9 ms. Draw calls are 50–81 and
  triangles at most 70 k.
- **No visually equivalent shader saving exists.** The cheapest material term, the environment
  IBL, is about a fifth of Low's per-pixel cost, and removing it visibly changes every metal
  surface.

## 3. What changed

**Optimisations made (no visual change at 1920×1080):**
- **Internal render-resolution guard** (`config/quality.ts`). Pixel ratio =
  min(min(devicePixelRatio, preset max) × scale, √(pixel budget ÷ CSS pixels)).
  - **High:** device ratio up to 1.75, budget 2560×1440 (3.69 MP).
  - **Low:** device ratio up to 2, budget 1920×1080 (2.07 MP). The budget is what binds: Windows
    125–200 % on a 1080p screen renders native 1920×1080 (micro-polish, §11; it was capped at 1).
  - **1920×1080 at 100 %:** ratio 1 for both, pixel-for-pixel as before. The deterministic 1080p
    export is unchanged.
  - **4K at 100 %:** before, High and Low both rendered 3840×2160 (8.3 MP). Now High renders
    2560×1440 (−56 %) and Low 1920×1080 (−75 %); the browser upscales.
  - **1080p at Windows 200 %:** High drops from 3360×1890 to 2560×1440; Low stays 1920×1080.
- **`?scale=0.5…1`:** an opt-in render scale for a slow PC; the default is 1. It works because both
  presets are fill-bound.

**Optimisations rejected:**
- **Removing the IBL or simplifying materials:** a visible change.
- **Fewer segments / LOD:** not the bottleneck.
- **Any change for the High control, flow, turbine and guide-tube dips:** the brief allows High's
  dips, and the only effective lever is resolution, which would soften High's 1080p look.
- **A dither change:** no moiré (§8).

**Presentation reliability:**
- **The production build can now start the presentation.** In Stage 10, Space and Home worked only
  with `?debug`. Now:
  - **Space** starts the presentation, then pauses / resumes it, and replays it at the end;
  - **Home** restarts from the first frame;
  - **R** stops it and returns to the start view (the recovery key);
  - the setup bar has **Start presentation / Resume**.
- **Start gating:** all of these are ignored until the scene reports *ready*, so nothing plays on a
  half-built frame.
- **Quality keys 1 / 2 are ignored while the presentation plays.** A switch rebuilds the canvas.
- **UI:**
  - the setup bar never shows while the presentation plays, and hides 2.5 s after the mouse stops;
  - debug UI and review keys need `?debug`, and the backquote key does nothing in production;
  - no stage numbers appear in the UI.
- **Full screen:** a minimal *Full screen* button on an explicit click, shown only where the browser
  allows it; a refusal is ignored. F11 does the same, and correctness never depends on it.
- **Failure screens** (plain language, each offers **Play the backup video**):
  - *The 3D view cannot start on this computer* (no WebGL2);
  - *The 3D view stopped* (render crash: Restart 3D / Restart in low quality / Reload page);
  - *Graphics reset* (context lost; rebuilds by itself).
  - The video plays inline, muted, with native controls and *Close video*. A missing file gives a
    plain message.

**16:9 stage** (`config/render.ts`, `.stage` in `styles.css`):
- The canvas and the in-picture UI (Explore overlay and panel, setup bar) sit in a centred 16:9
  box, `min(100vw, 100vh·16/9)` wide, with black bars when the window is not 16:9.
- The loading and context-lost overlays cover the whole window.
- Pointer and hover-tag coordinates are relative to the stage.
- On stages up to 1760 CSS px wide, the setup bar moves to the top right, so it never meets the
  Explore bar, which wraps.

**Portable build** (§6).

## 4. Performance, before → after (1920×1080, production, serial)

| Run | Stage 10 (stored, before) | Stage 11 | Interleaved A/B, same session: S10 / S11 |
|---|---|---|---|
| **Low, full 48 s** | 60.0 fps, 6 / 2880 > 20 ms | 56.6 fps, 0 / 2718 (×2 runs) (b) | **56.4 / 56.4** fps; **1, 0 / 0, 0** > 20 ms (2 runs each) |
| Low, `file://` portable, Chrome / Edge | – | **60.1 fps, 0 / 2886** (earlier session); 56.5, 0 / 2711 (b) | – |
| High, full 48 s | 54.4 fps, 270 / 2611 | 54.0 / 53.9 fps, 104 / 115 | – |
| High, control chapter | 44.3 fps (76) | 46.1 / 45.6 fps (48 / 51) | – |
| Explore Low, 4 views | 60.1 fps, 0 > 20 ms | 56.1–56.3 fps, 0 > 20 ms (b) | – |
| Explore High, guide tubes | 44.8 fps (77) | 42.4 fps (61) | – |
| GPU ms, 22 states | High 10.8–23.1, Low 11.5–13.6 | High 11.6–21.0, Low 11.9–15.0 | same draw calls in every state |

- **(b) Pacing ceiling, not a regression.** Late in this session, every run paced at 17.7 ms
  (56.4 fps), even the empty exterior. In alternating back-to-back runs the Stage 10 build showed the
  same 56.4 fps. Earlier the same day, the Stage 11 portable build played Low at 60.1 fps with 0
  slow frames. The display is 60 Hz and the PC is on AC power; the cause is outside the app. (A
  Firefox window running the app stayed open throughout, and I left it alone.)
- **Low target met:** no frame over 20 ms in any changed window or full run.
- **No shader compile during playback:** programs at ready = after playback (High 22, Low 24), and
  constant through the 10-playback soak.
- **High** keeps the dips it had in the dense chapters, as the brief allows.

## 5. Aspect ratio and DPR (`validation/compat.json`, Low unless stated)

| Window (CSS px) @ DPR | Stage (CSS px) | Drawing buffer | Panels inside, no overlap | Label inside | Click = pick |
|---|---|---|---|---|---|
| 1920×1080 @1 (Low and High) | 1920×1080 | **1920×1080** (unchanged) | yes | yes | yes |
| 1366×768 @1 | 1365.3×768 | 1365×768 | yes | yes | yes |
| 1280×720 @1 | 1280×720 | 1280×720 | yes | yes | yes |
| 1280×800 @1 (16:10) | 1280×720, bars 40 px | 1280×720 | yes | yes | yes |
| 1024×768 @1 (4:3) | 1024×576, bars 96 px | 1024×576 | yes | yes | yes |
| 1536×864 @1.25 | 1536×864 | **1920×1080** (c) | yes | yes | yes |
| 1280×720 @1.5 | 1280×720 | **1920×1080** (c) | yes | yes | yes |
| 1920×1080 @1.5 / @2 | 1920×1080 | 1920×1080 | yes | yes | yes |
| 1920×1080 @2, High | 1920×1080 | 2560×1440 (ratio 1.33) | yes | yes | yes |
| 3840×2160 @1, Low / High | 3840×2160 | 1920×1080 / 2560×1440 | yes | yes | yes |

- **Composition:** identical at every size (contact sheet). Labels keep their CSS size (19.2 px)
  at every DPR.
- **At 1024×768,** Explore's controls take two rows of the 576 px stage. The cinematic is
  unaffected, because the UI hides while it plays.
- **Resize:** resizing during playback keeps it playing; the buffer follows the stage.
- **(c) Low under Windows scaling** (micro-polish, §11): on a 1080p screen at 125 % / 150 %, Low
  now renders the full 1920×1080 buffer, 1:1 with the screen's pixels, instead of 1536×864 /
  1280×720 upscaled. The frames are byte-identical to the 1920×1080 @1 master frames. The Panels,
  Label and Click columns are from the original run; the micro-polish changes only the drawing
  buffer, not the CSS layout.

## 6. Portable offline build

- **Layout:** `npm run build:portable` → `dist-portable/BWRX300/`:
  - `BWRX300.html` (1.44 MB): all JS and CSS inline;
  - `BWRX300-fallback.mp4` (20.9 MB);
  - `START-HERE.txt`: keys, recovery, Low / `?scale`, the backup video, the tested browsers.
  The normal `npm run build` is unchanged.
- **How:** `vite.portable.config.ts` gives one Rolldown chunk (`codeSplitting: false`; the lazy
  diagnostics chunk folds in), one CSS file, every asset inlined, no module-preload polyfill, and
  `base: './'`. `build-tools/portableSingleFile.ts` then:
  - inlines the chunk as `<script type="module">` (with `</script` escaped) and the CSS as
    `<style>`, after Vite has resolved its preload placeholders (`generateBundle`, order `post`);
  - fails the build if any external script, stylesheet or other emitted file remains;
  - renames the page to `BWRX300.html`;
  - copies `portable/START-HERE.txt` and `fallback/BWRX300-fallback.mp4` (git-ignored, a copy of
    the deliverable video).
- **Why it works from `file://`:** there is no module fetch, `import()`, `fetch`/XHR, worker, CDN or
  web font. The video is a relative `<video src>` (`config/delivery.ts`).

**Browser matrix (`file://`, Windows 11, Iris Plus; `validation/portable-*.json`):**

| | Chrome 155 | Edge 155 | Firefox 158 |
|---|---|---|---|
| Ready from `file://` | 3.3 s | 3.1 s | 5.0–5.4 s |
| WebGL2, 1920×1080 buffer, 0 requests, 0 errors | yes | yes | yes |
| No debug UI; Space starts; UI hidden while playing; R → ready + *Start presentation* | yes | yes | yes |
| Full screen button | works | works | works |
| Low, full 48 s | 60.1 fps, 0 > 20 ms (56.5 in the capped session) | 60.1, 0 (56.5) | **34–46 fps**, many slow frames |
| Quality High → Low remount | ready | ready | ready |
| WebGL off → fallback screen → backup video plays (muted, 48.03 s) | yes | yes | yes |

The recommended browser is **Chrome or Edge** (in START-HERE.txt). Firefox works but is not smooth
here: it was headless in the test, and Firefox lacks `KHR_parallel_shader_compile`.

## 7. FULL regression (Stage 10 build vs Stage 11 build, served side by side, serial)

| Check | High | Low |
|---|---|---|
| Dense seek, S11 = S10 (379 frames: every 15th over 0–48 s; every 3rd in 16–20.5 s and 43.5–48 s; every 4th in 20.5–36.5 s; every 2nd in 36.5–43.5 s) | **379 / 379** | **379 / 379** |
| Dense fixed-step playback, S11 = S10 | **379 / 379** | **379 / 379** |
| Playback = seek within S11 | 313 / 379 (d) | 315 / 379 (d) |
| Stage 3 shot (31 frames) | 31 / 31 | 31 / 31 |
| Timings and camera / look / control / flow functions | identical | identical |
| t = 25 / 40 s: forward, backward, random-order seeks | identical | identical |
| Explore input during playback = plain playback | 378 / 379 (frame 1440, known since Stage 7) | 378 / 379 |
| Events / end status / authority | 20 / `finished` / `cinematic` | same |
| Navigation suite (375 values) | 362 equal; 13 timing-sampled values within run noise (e) | – |
| Stage 5 interaction suite (110 values) | **110 / 110** | – |
| Focus audit (177 values) | **177 / 177** | – |
| Explore Flow / Control smoke | pass | – |
| Explore Safety smoke | pass | pass |
| Quality switches (Flow, Control, Stage 5, soak) | state kept, counters restored | same |
| Full 48 s export | 1441 frames; every sampled frame = exact-time seek (f) | – |

- **(d) Rounding, same set as Stage 10.** Every differing frame reads a master time 1e-7 s off (the
  known GSAP rounding). The Stage 10 build gives the same 313 / 315.
- **(e) Run noise.** Orbit-step sizes, pivot distances and the transition frame at the 3rd decimal
  differ. Two runs of the same navigation code (Stage 8 vs Stage 10) differ in the same 13 fields
  by similar amounts. Every pick, limit and outcome is equal.
- **(f) The export is the final build's own render.** All 379 sampled frames equal Stage 11's
  exact-time seek. Against the Stage 10 export, 1054 of 1441 frames are byte-identical. The other
  387 are all frames f ≡ 2 (mod 3), where f/30 is a recurring binary fraction, so the Stage 10
  export sat at the other rounding phase there. Those frames differ by at most 567 pixels (median
  71) at a median of 15 levels: invisible. I regenerated the video anyway, so the deliverable comes
  from the final build.

## 8. Resilience / soak (`validation/soak-low.json`, one page, Low)

| Test | Result |
|---|---|
| 10 full playbacks (Home, fixed step) | all `finished`; final frame identical ×10; seek to 25 s identical ×10 |
| Memory across the 10 | heap 18.1 → 18.5 MB (flat from the 6th run); geometries 65, textures 12, programs 24, 1 canvas: constant |
| 20 pause / resume toggles in real time | always paused, then resumed; master advances at 0.98–1.01× real time (no duplicate loop) |
| 10 High ↔ Low switches | each back to *ready*; counters return to each quality's levels (High 62 / 8 / 22, Low 64 / 10 / 24); heap 23–41 MB, ending at 27.8 MB (collected, not retained) |
| 2 forced context losses | rebuilt to *ready* each time; frame at 25 s identical |
| Resize while idle and while playing | buffer follows the stage; playback continues |
| DPR 1.25 / 1.5 / 2 / 1 | Low buffer stays 1920×1080 |
| Input authority | `cinematic` after each playback; `explore` at start, after each switch, after each context loss and at the end |

**X-ray dither:** Explore X-ray at 1920×1080, 1366×768 and 1024×768, plus 1920 renders downscaled
the way a projector would (`compat/xray-dither-…png`):
- **native:** the ordered dither is a uniform 1-pixel screen, with no beat bands;
- **downscaled:** it averages to a smooth tint.

No moiré, so the dither is unchanged.

## 9. Files

- **New:**
  - `build-tools/portableSingleFile.ts`
  - `vite.portable.config.ts`
  - `portable/START-HERE.txt`
  - `src/config/delivery.ts`
- **Changed:**
  - `src/config/quality.ts` (budget, scale; Low ratio cap 2 in the micro-polish)
  - `src/config/render.ts` (stage aspect)
  - `src/scene/SceneCanvas.tsx` (pixel-ratio watcher)
  - `src/app/App.tsx` (stage)
  - `src/app/useKeyboardShortcuts.ts`
  - `src/animation/presentation.ts` (gated start)
  - `src/ui/SetupControls.tsx`
  - `src/ui/StatusScreens.tsx`
  - `src/ui/styles.css`
  - `src/interaction/ExploreDriver.tsx` (stage-relative hover tag)
  - `index.html` (noscript text)
  - `package.json` (`build:portable`)
  - `tsconfig.node.json`
  - `eslint.config.js`
  - `.gitignore` (`dist-portable`, `fallback/`)
  - `README.md` (keys, presentation build)
  - `ARCHITECTURE.md` (delivery)

## 10. Remaining final-delivery risks / decisions for you

1. **The lectern PC itself is untested:** its GPU, driver, browser, Windows scaling and projector
   resolution. All numbers here are from the Iris Plus laptop. A rehearsal on the real PC belongs to
   Stage 12.
2. **Low under Windows scaling (c): resolved** by the micro-polish (§11). A 1080p projector at
   125 % or 150 % now gets native 1920×1080 in Low, at the validated 1080p cost.
3. **Quality choice for the talk.** On this machine, Low plays 60 fps with no slow frames. High
   averages 54 fps, dipping to about 45 in the control chapter.
4. **Firefox is functional but not smooth** (34–46 fps Low). START-HERE recommends Chrome or Edge.
5. **Outside the app:**
   - managed PCs can block local HTML files or turn off hardware acceleration (WebGL2 missing or
     very slow). The fallback screen and the video cover the first case; the second shows as
     stutter, and the remedy is Low or `?scale`.
   - the context-loss recovery was tested with a simulated loss, not a real driver reset.
6. **The pacing ceiling** seen late in this session (56.4 fps for every build) should be
   re-checked on the presentation PC with a 48 s Low run.

## 11. Micro-polish: Low under Windows 125–150 % scaling (`validation/low-scaling.json`)

- **Change:** one value. `config/quality.ts` Low `maxPixelRatio` 1 → 2. The Low budget stays
  1920×1080; High is untouched. Bundle `index-C6urVQq8.js` (approved: `index-dE70IHcZ.js`).
- **Drawing buffer, Low:**

| Window (CSS px) @ DPR | Before | Now |
|---|---|---|
| 1920×1080 @1 | 1920×1080 | 1920×1080 (ratio 1) |
| 1536×864 @1.25 | 1536×864 | **1920×1080** (ratio 1.25) |
| 1280×720 @1.5 | 1280×720 | **1920×1080** (ratio 1.5) |
| 1920×1080 @2 | 1920×1080 | 1920×1080 (budget, ratio 1) |
| 3840×2160 @1 | 1920×1080 | 1920×1080 (budget, ratio 0.5) |

- **1080p master identity:** at 1920×1080 @1, seek frames at 0, 9.5, 18.2, 25, 33, 40, 45 and
  48 s are byte-identical to the approved build and to the stored Stage 11 hashes (Low 8/8,
  High 8/8). One High frame (9.5 s) flipped 1 pixel by 1 level on the first seek of one fresh page
  and matched on re-seek and on two more pages: the known load-time flip, not this change.
- **Scaled = native:** at 1536×864 @1.25 and 1280×720 @1.5, all 8 Low frames are byte-identical
  to the 1920×1080 @1 frames.
- **`?scale` still works:** 0.75 → 1440×810 and 0.5 → 960×540, both at 1920×1080 @1 and
  1536×864 @1.25; each plays (master advanced 3.0 s in 3 s, 60 fps), no errors.
- **Low 48 s real time at 1536×864 @1.25 (buffer 1920×1080):** 60.1 fps, p95 16.8 ms, one frame
  of 33 ms at 38 s. A repeat run had none (worst 17.3 ms); a 1920×1080 @1 control run in the same
  session had three at 13 s (the known vessel-opening flake). Same cost as native 1080p.
- **Console / requests:** only the `THREE.Clock` warning; no external requests.
- `START-HERE.txt` is unchanged: it never mentioned Windows scaling, and `?scale` still applies.
