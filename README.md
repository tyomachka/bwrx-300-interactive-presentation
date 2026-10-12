# BWRX-300 Interactive 3D Module

Interactive WebGL 2 visualization of the GE Vernova Hitachi BWRX-300 SMR for a live
university presentation. `PROJECT.md` is the master specification. The official
references are `references/technical/005N9751-BWRX-300-General-Description.pdf` and
`references/technical/11.pdf` (UK GDA Chapter 1, NEDO-34163 Rev B). They are kept locally
and not committed; see `references/links.txt`.

**Current state: Stage 3 (first production-quality shot)**, awaiting review. Stage 1
(renderer foundation) and Stage 2 (plant massing) are committed checkpoints. Review
material is in `docs/stage1-review/`, `docs/stage2-review/` and `docs/stage3-review/`.

## Commands

```bash
npm install
npm run dev        # http://localhost:5173
npm run check      # typecheck + lint + production build
npm run preview    # serve dist/ locally
```

## URL parameters

| Parameter | Effect |
|---|---|
| `?quality=low` / `?quality=high` | Choose the rendering preset (otherwise: high, or low on a software renderer) |
| `?debug` | Show the diagnostics panel and enable the review keys (works in production builds too) |

## Keyboard

Keys are matched by physical position, so they also work on the Lithuanian layout.

| Key | Action |
|---|---|
| `R` | Reset: stop the shot, close the reveal, smooth transition to `plantExterior` |
| `1` / `2` | High / low quality |
| `` ` `` | Toggle diagnostics (dev build, or with `?debug`) |
| `P` | Review aid: play / restart the Stage 3 hero shot from its first frame (dev / `?debug`) |
| `K` | Review aid: pause / resume the hero shot (dev / `?debug`) |
| `V` | Review aid: cycle the four Stage 2 review views (dev / `?debug`) |
| `G` | Review aid: toggle the section review (dev / `?debug`) |

The `?debug` panel also has the shot buttons and a time scrubber that shows the exact frame
at any time. For automation, `window.__bwrx` (dev / `?debug` only) exposes
`shot.play() / seek(t) / togglePause()`, the reveal state, the camera pose and per-frame
renderer statistics.

Mouse in Explore mode: left-drag orbit, wheel zoom, right-drag pan (limited).

## Plant massing (Stage 2)

- `src/scene/plant/dimensions.ts` holds every number, each tagged with its provenance:
  `[GD]` official General Description, `[NEDO]` official UK GDA Chapter 1, `[BRIEF]`,
  `[PRESS]` or `[APPROX]` educational approximation.
- Layout: the reactor axis is at the origin and grade is at y = 0. The turbine hall is to
  the east (+x), support buildings to the north, and the open front faces south (+z).
- Hierarchy: `site-ground` → `reactor-building-shaft` → `containment-placeholder` →
  `reactor-pressure-vessel-placeholder`, plus `reactor-building-above-grade` (pools,
  refuelling floor, roof), `main-steam-path-placeholder`, `turbine-building`
  (`turbine-placeholder`, `generator-placeholder`), `support-buildings` and `scale-cues`.
  IDs live in `src/scene/plant/ids.ts`; each is the `name` of its root group.
- **Section review** (development aid, not the Stage 5 section system): a static cut at
  z = 0 through the whole site, drawn by the Stage 3 section system. Context objects in
  front of the cut (turbine hall front, truck) hide.
- **Interior**: content hidden inside opaque buildings or below grade is not drawn until
  something opens it up (by reveal level). It stays addressable, and its shaders and
  shadow variants are compiled at load so a reveal never stalls.
- The main steam route is plain data in `src/scene/plant/routes.ts`, for later flow
  animation.

## Hero shot and reveal (Stage 3)

- **Shot data:** `src/config/heroShot.ts` holds the timing (beats, camera keyframes by pose
  name, reveal tracks). The poses (`stage3Exterior` … `stage3RPVHero`) are data in
  `src/config/camera.ts`. Retiming never touches scene components.
- **Reveal state:** `src/animation/heroReveal.ts`, five numbers from 0 to 1 (`groundCut`,
  `exteriorDim`, `shaftReveal`, `containmentReveal`, `rpvEmphasis`). Only the shot timeline
  (GSAP) animates them.
- **One mapping:** `src/scene/section/sectionLayers.ts` (`applyReveal`) derives everything
  visual from that state every frame: section planes, per-layer dims, rims, fill light,
  the RPV backlight pool, and interior visibility. `RevealDriver.tsx` calls it.
- **Cut technique:** clipping planes plus a one-pass cut-surface shader
  (`sectionShader.ts`). Back faces seen through a cut are shaded as the cut surface at the
  exact cut plane: earth strata, concrete, containment steel, and the accent grade datum
  (on section planes only; it fades out once the shaft is established).
  There is no stencil and no transparency. Rules that keep it correct: section solids never
  share or overlap faces (`SECTION_INSET`, merged profiles in `geometry.ts`), and context
  geometry never touches or enters grade (`ON_GRADE`).
- **Layers:** ground (excavation box in front of the reactor building), building + shaft,
  containment; the RPV is never cut. All cuts end on the plane z = 0. The building and
  containment planes follow measured stations (`cutPath.ts`): equal reveal progress gives
  roughly equal visible change, so each opening reads continuously.
- **Camera:** `src/camera/cameraPath.ts` interpolates the timed poses as monotone cubics
  in orbit space (no overshoot, continuous velocity, eased start and end, no roll). The
  director's `cinematic` authority evaluates it each frame from the timeline time, so
  restart and seek are exact. After the shot, Explore takes over from the final pose; the
  camera is kept above grade while the plant is opened up.

## Architecture notes

- **Units:** 1 world unit = 1 metre.
- **Quality:** `src/config/quality.ts` is the only place presets are defined. Components
  read preset *fields* via `useQualityPreset()` and never branch on the level name.
  A quality change remounts the canvas (MSAA is fixed at context creation). The camera
  pose survives the remount.
- **Camera authority:** `src/camera/cameraDirector.ts`. Exactly one authority moves the
  camera at a time: `explore` (OrbitControls), `transition` (GSAP tween), or `cinematic`
  (a shot's pose source; the Stage 3 hero shot now, Stage 6 later). They write a plain
  pose object, and the director applies it once per frame. Handing back to OrbitControls
  syncs its target, so nothing jumps.
- **Deterministic time:** `src/animation/clock.ts`. GSAP is driven from the R3F frame
  loop rather than its own rAF. Setting `animationClock.fixedStep = 1/30` makes every
  frame advance exactly one video frame (for the Stage 12 H.264 export).
- **Camera states:** data in `src/config/camera.ts`, with the review pairings in
  `src/config/reviewViews.ts`. The `?debug` panel has a "Copy pose" button that produces
  a new entry.
- **Failure paths:** WebGL 2 probe before mount, an app error boundary (restart / restart
  low / reload), `SafeLayer` for optional visuals, and automatic rebuild on a lost GPU
  context (with a retry budget, then a manual overlay).
  `<html data-scene-status>` exposes `loading | ready | context-lost | error`.
- **Offline:** no CDN, web-font or HDR requests. The studio lighting environment is
  procedural. `dist/` uses relative asset paths. Note that browsers block ES modules
  over `file://`, so serve `dist/` (`npm run preview` or any static server) until the
  single-file offline build (Stage 11/12) exists.
