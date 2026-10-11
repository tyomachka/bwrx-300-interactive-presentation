# Stage 2 Review Report: Plant Massing

**Project:** BWRX-300 interactive WebGL module (PROJECT.md is the master spec)
**Stage:** 2 (Plant massing). Stage 3 has not been started.
**Git:** Stage 1 approved baseline = commit `280da5b` on `main`. Stage 2 changes are **not
committed yet**, pending this review.

## Screenshots (all 1920×1080, production build)

| File | View | Mode |
|---|---|---|
| `01-plant-exterior-1080p.png` | `plantExterior`: hero three-quarter view of the whole power block from the south-west; the opening shot | High, exterior |
| `02-reactor-building-exterior-1080p.png` | `reactorBuildingExterior`: low, close view where the reactor building meets the ground | High, exterior |
| `03-below-grade-overview-1080p.png` | `belowGradeOverview`: frontal section from basemat (−36 m) to roof | High, section review |
| `04-turbine-relationship-1080p.png` | `turbineRelationship`: elevated three-quarter section, reactor → main steam → turbine → generator, left to right | High, section review |
| `05-low-quality-1080p.png` | `plantExterior` in the low preset | Low, exterior |
| `06-low-quality-below-grade-1080p.png` | (extra) `belowGradeOverview` in the low preset | Low, section review |

"Section review" is a temporary development aid (key `G` with `?debug`). It hides everything
in front of the plane z = 0, which runs along the reactor → turbine axis. It is **not** the
Stage 5 section/clipping system.

## 1. What was implemented

- **Site ground:** a 48 m deep earth block, so a cut can reveal the full embedded shaft. It is
  notched for the shaft down to the shaft bottom, with solid earth below. Its top sits flush
  with the studio floor at grade (y = 0), plus a paved power-block apron. It is not a thin
  floating board.
- **Reactor building:** one continuous vertical cylinder, as drawn in GE Vernova Hitachi
  General Description (GD) Fig 2-1.
  - *Below grade* (`reactor-building-shaft`): a 36 m deep shaft with basemat, annular floors
    and a slightly wider grade collar that hints the cylinder continues downward.
  - *Above grade* (`reactor-building-above-grade`): pools and refuelling floor, with a shallow
    radial-segment roof. No containment dome.
- **Nesting:** ground → reactor-building shaft → `containment-placeholder` (19 m OD × 38 m) →
  `reactor-pressure-vessel-placeholder` (4.47 m OD × 27.6 m). The RPV head sits at the
  containment top slab, with the reactor cavity pool above it (GD Fig 3-9).
- **Pools:** reactor cavity pool over the containment plus three ICS pools beside it
  (GD §10). These are placeholder water volumes only.
- **Turbine building:** a separate hall to the east, across a seismic gap. It holds
  placeholder casings for one HP turbine, two LP turbines and the generator on a concrete
  deck, aligned with the steam axis.
- **Main steam path:** one conceptual line from the RPV upper region, horizontally through the
  containment wall, shaft wall and turbine-building wall, then up to the HP turbine inlet.
  This follows GD Fig 5-1. The route is plain data (`routes.ts`), for later flow animation.
- **Supporting buildings:** control, radwaste and turbine-maintenance buildings, kept low and
  behind the reactor and turbine buildings. No cooling tower.
- **Scale cues:** 1.8 m people (at the RB entrance, by the truck, and on the refuelling floor,
  where they are visible in section) and a 16.5 m truck at the turbine-hall loading door.
- **Camera poses:** the four poses listed above, stored as data in `src/config/camera.ts`.
  `R` resets to `plantExterior`.
- **Stable semantic IDs** (`src/scene/plant/ids.ts`): `site-ground`,
  `reactor-building-above-grade`, `reactor-building-shaft`, `containment-placeholder`,
  `reactor-pressure-vessel-placeholder`, `turbine-building`, `turbine-placeholder`,
  `generator-placeholder`, `main-steam-path-placeholder`, plus `pools-placeholder`,
  `support-buildings` and `scale-cues`.
- **Interior hiding:** geometry hidden inside opaque buildings or below grade is not drawn in
  exterior views. It stays in the scene graph and stays addressable. Its shaders are
  precompiled at load, so a later reveal (X-ray or cutaway) never stalls on shader
  compilation. This was verified: the shader-program count is unchanged after the reveal.

### Fixes to the Stage 1 foundation exposed by Stage 2

1. **Context-loss recovery:** the canvas is now rebuilt immediately on loss, with a retry
   budget and then the manual overlay. The old approach, which rebuilt after the browser
   restored the context, produced about 250 WebGL warnings at Stage 2 scene size. It now
   produces 0.
2. **Low-preset contact shadow:** it rendered as a solid black rectangle, because the
   opaque canvas made three.js clear render targets with alpha 1. The bug already existed in
   Stage 1, hidden by the dark plinth. Fixed with `setClearAlpha(0)`, which is safe because
   the main framebuffer is opaque.

## 2. Files changed

- **New:** `src/scene/plant/`: `dimensions`, `ids`, `geometry`, `materials`, `hooks`,
  `section`, `primitives`, `SiteGround`, `ReactorBuilding`, `TurbineBuilding`,
  `MainSteamPath`, `routes`, `SupportBuildings`, `ScaleCues`, `Plant`. Also
  `src/config/reviewViews.ts`, `src/camera/reviewViews.ts` and `docs/stage2-review/`.
- **Modified:** camera config and rig, camera director (home state), app store (section
  review flag), keyboard shortcuts (`V`/`G` review keys, dev/debug only), diagnostics panel
  (review-view buttons), `SceneCanvas` (context loss, clear alpha, hidden-content
  precompile), `StudioEnvironment` (floor with a hole for the site block), `LightingRig`
  (site-scale shadow frustum), render and quality configs, styles, README.
- **Deleted:** the Stage 1 placeholder composition and its layout constants.

## 3. Sourced vs approximated geometry

Every number lives in `src/scene/plant/dimensions.ts`, tagged `[GD]`, `[BRIEF]`, `[PRESS]` or
`[APPROX]`.

**Official (GD 005N9751 Rev J):**
- RPV minimum ID ≈ 4.2 m, wall ≈ 13.54 cm (so OD ≈ 4.47 m), inner height ≈ 27.36 m.
- Containment ≈ 19 m OD × 38 m.
- "SCCV and RPV are situated at or below grade."
- The reactor building is "a vertical right cylinder shaft", with fuel handling and pools in
  the above-grade portion.
- A pool sits above the SCCV, with three ICS pools beside it.
- The turbine, control and radwaste buildings are on near-surface foundations adjacent to
  the reactor building, separated by seismic gaps.
- The main steam route runs RPV nozzle → containment penetration → turbine-building wall
  (Fig 5-1).
- Power block 148 × 78 m (Fig 10-2). The model is ≈151 × 71 m.

**Constrained, but not published in the local GD:**
- **Shaft depth 36 m:** from the Stage 2 brief, which cites a current official design
  document that is *not* in `references/`. Press coverage of Darlington reports ~35 m; a
  2025 preprint says ~34 m. *Please add the official source to `references/`.*
- **Reactor-building diameter ≈ 37 m:** derived from the ~121 ft basemat lowered into the
  Darlington shaft (press) and the proportions in GD Fig 2-1.
- **Above-grade height ≈ 30 m plus roof:** 36 m below plus ~33 m above is close to the ~67 m
  overall height in third-party estimates, and matches the H/D ≈ 1.8 seen in Fig 2-1.

**Educational approximation:** wall and slab thicknesses, floor levels, pool sizes and
positions, turbine-building size, turbine and generator casings, supporting-building masses,
and a **single** steam line (the official design has two).

## 4. Performance

Production build (`vite preview`), Chrome on an **Intel Iris Plus integrated GPU** (ANGLE
D3D11), 1920×1080, DPR 1.

**Steady state** (hero view, 5 s warm-up, then three 6 s windows):

| Preset | Draw calls | Triangles | fps | p95 | p99 | Frames > 20 ms |
|---|---|---|---|---|---|---|
| High | 130 | 9,985 | 60.1 | 16.9 ms | 17.3 ms | 0 |
| Low | 74 | 3,631 | 60.1 | 16.9 ms | 17.2 ms | 0 |

**Per view** (3 s window after each camera move, final build):

| View | High: fps / p95 / calls / tris | Low: fps / p95 / calls / tris |
|---|---|---|
| plantExterior | 47.8 / 33.6 ms / 130 / 9,985 * | 60.1 / 16.9 ms / 74 / 3,631 |
| reactorBuildingExterior | 60.1 / 17.0 ms / 128 / 9,793 | 60.1 / 16.9 ms / 72 / 3,439 |
| belowGradeOverview (section) | 60.1 / 16.9 ms / 126 / 45,824 | 60.1 / 16.9 ms / 73 / 12,428 |
| turbineRelationship (section) | 60.1 / 17.1 ms / 126 / 45,824 | 60.1 / 16.9 ms / 73 / 12,428 |

\* The first view measured right after page load. Dips like this appeared intermittently,
only in high quality and only in the first seconds after load. The dedicated steady-state
measurement of the same view (table above) shows 60 fps with zero slow frames. On weak
hardware, the first seconds after load deserve attention.

- About 4% of the PROJECT.md triangle budget (250k) is used in exterior views, and 18% in
  section views.
- Draw calls (130 in high) are the metric to watch on the university PC. Static
  geometry merging is a Stage 11 option; it is not done now because it would reduce
  per-component addressability.

**Stage 1 regression checks, all passing on the Stage 2 build:**
- Ready in ~2.8 s.
- Reset returns exactly to `plantExterior`.
- Quality switch keeps the camera pose. It now takes ~4.0 s, up from 1.7 s, because hidden
  content is precompiled.
- Resize and the DPR cap (1.75 at DPR 2) work.
- Context loss auto-recovers in ~0.5 s with 0 warnings.
- The no-WebGL2 and crash fallback screens work.
- 0 external network requests.

## 5. Assumptions and deviations

1. **Turbine building to the east (+x):** section views then read left to right as
   reactor → steam → turbine → generator.
2. **Separate building masses:** the official site render (GD Fig 10-2) wraps the turbine,
   radwaste and service buildings in one shared rounded facade. The model keeps them as
   separate masses so the separation from the reactor building reads clearly.
3. **Supporting buildings north:** they sit behind the cut plane, so the hero view sees the
   reactor building's base meeting the ground without obstruction.
4. **Single conceptual main steam line** instead of two.
5. **Accent colour:** the warm accent appears only as a thin grade-datum line in section
   review. Turbine-hall glazing has only a barely visible warm tint; the accent is reserved
   for highlight states (PROJECT.md §17).
6. **Section review is temporary:** it is geometry halves, not clipping planes. Stage 5 can
   replace it without touching the massing data.
7. **Reference PDF not in git:** the GE Vernova Hitachi PDF is excluded from version control
   as third-party copyrighted material; it stays in `references/technical/`.

## 6. Console warnings (production build)

- `THREE.Clock: This module has been deprecated`: emitted by React Three Fiber's own code,
  once per canvas creation. Not fixable without patching R3F.
- `THREE.WebGLRenderer: WEBGL_lose_context extension not supported`: once, only during
  context-loss recovery (R3F calls `forceContextLoss()` on the already-lost context).
- No errors, no failed requests, no external requests.

## 7. What needs visual approval before Stage 3

1. **The exterior alone cannot show that the reactor is underground.** From outside, the
   reactor building reads as a smooth, silo-like cylinder. The plan is that the Stage 3 X-ray
   or cutaway reveal makes "mostly below grade" immediately readable. Confirm, or request an
   exterior hint now.
2. **Section-model presentation** (03, 04): floating earth block, subtle strata, accent
   grade line, dark turbine-hall interior.
3. **Layout:** separate building masses with the turbine hall to the east, vs. the single
   wrapped facade of the official render.
4. **Turbine-hall look:** dark coated metal with vertical fins and quiet glazing.
5. **Shaft depth source:** please supply the official document for the 36 m figure.
6. **Low-preset grounding** (05): reliable but faint contact shadows. Acceptable, or should
   they be stronger?
