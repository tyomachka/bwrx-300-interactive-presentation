# BWRX-300 Interactive 3D Module

Interactive WebGL 2 visualization of the GE Vernova Hitachi BWRX-300 SMR for a live
university presentation. `PROJECT.md` is the master specification. The official
reference is `references/technical/005N9751-BWRX-300-General-Description.pdf`.

**Current state: Stage 1 (renderer foundation).** The scene contains placeholder
primitives only.

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
| `?debug` | Show the performance / camera diagnostics panel (works in production builds too) |

## Keyboard

Keys are matched by physical position, so they also work on the Lithuanian layout.

| Key | Action |
|---|---|
| `R` | Reset camera (smooth transition to the home view) |
| `1` / `2` | High / low quality |
| `` ` `` | Toggle diagnostics (dev build, or with `?debug`) |

Mouse in Explore mode: left-drag orbit, wheel zoom, right-drag pan (limited).

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
- **Camera states:** data in `src/config/camera.ts`. The `?debug` panel has a "Copy pose"
  button that produces a new entry.
- **Failure paths:** WebGL 2 probe before mount, an app error boundary (restart / restart
  low / reload), `SafeLayer` for optional visuals, and recovery from a lost GPU context.
  `<html data-scene-status>` exposes `loading | ready | context-lost | error`.
- **Offline:** no CDN, web-font or HDR requests. The studio lighting environment is
  procedural. `dist/` uses relative asset paths. Note that browsers block ES modules
  over `file://`, so serve `dist/` (`npm run preview` or any static server) until the
  single-file offline build (Stage 11/12) exists.
