# BWRX-300 Interactive 3D Module

Interactive WebGL 2 visualization of the GE Vernova Hitachi BWRX-300 SMR for a live
university presentation. `PROJECT.md` is the master specification. The official
reference is `references/technical/005N9751-BWRX-300-General-Description.pdf`. It is kept
locally and not committed; see `references/links.txt`.

**Current state: Stage 2 (plant massing)**, awaiting review. Stage 1 (renderer foundation)
is the baseline commit. Review screenshots are in `docs/stage1-review/` and
`docs/stage2-review/`.

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
| `R` | Reset camera (smooth transition to `plantExterior`) |
| `1` / `2` | High / low quality |
| `` ` `` | Toggle diagnostics (dev build, or with `?debug`) |
| `V` | Review aid: cycle the four Stage 2 review views (dev / `?debug`) |
| `G` | Review aid: toggle the section review (dev / `?debug`) |

Mouse in Explore mode: left-drag orbit, wheel zoom, right-drag pan (limited).

## Plant massing (Stage 2)

- `src/scene/plant/dimensions.ts` holds every number, each tagged with its provenance:
  `[GD]` official General Description, `[BRIEF]`, `[PRESS]` or `[APPROX]` educational
  approximation.
- Layout: the reactor axis is at the origin and grade is at y = 0. The turbine hall is to
  the east (+x), support buildings to the north, and the open front faces south (+z).
- Hierarchy: `site-ground` → `reactor-building-shaft` → `containment-placeholder` →
  `reactor-pressure-vessel-placeholder`, plus `reactor-building-above-grade` (pools,
  refuelling floor, roof), `main-steam-path-placeholder`, `turbine-building`
  (`turbine-placeholder`, `generator-placeholder`), `support-buildings` and `scale-cues`.
  IDs live in `src/scene/plant/ids.ts`; each is the `name` of its root group.
- **Section review** (temporary, not the Stage 5 section system): structures are built
  as halves split at z = 0, and the front halves hide.
- **Interior**: content hidden inside opaque buildings or below grade is not drawn in
  exterior views. It stays addressable, and its shaders are precompiled at load so a
  reveal never stalls.
- The main steam route is plain data in `src/scene/plant/routes.ts`, for later flow
  animation.

## Architecture notes

- **Units:** 1 world unit = 1 metre.
- **Quality:** `src/config/quality.ts` is the only place presets are defined. Components
  read preset *fields* via `useQualityPreset()` and never branch on the level name.
  A quality change remounts the canvas (MSAA is fixed at context creation). The camera
  pose survives the remount.
- **Camera authority:** `src/camera/cameraDirector.ts`. Exactly one authority moves the
  camera at a time: `explore` (OrbitControls), `transition` (GSAP tween), or `cinematic`
  (reserved for Stage 6). Tweens write a plain pose object, and the director applies it
  once per frame. Handing back to OrbitControls syncs its target, so nothing jumps.
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
