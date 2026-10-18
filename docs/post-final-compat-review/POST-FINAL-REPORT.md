# Post-final compatibility polish — report

**Status: RELEASED** — validated, committed `e818a32`, deployed to Pages and checked live (§8).

| | |
|---|---|
| Starting point | release `92b0beb` (+ docs `8293426`, `18cd9e5`); `main` = `presentation-v1` = `18cd9e5` |
| Live URL | https://tyomachka.github.io/bwrx-300-interactive-presentation/ (repository stays private) |
| **QR payload (exact)** | `https://tyomachka.github.io/bwrx-300-interactive-presentation/?mode=explore` |
| Astra | reviewed read-only; **nothing adopted** (§5) |
| Desktop presentation | **36 / 36** settled chapter frames (12 chapters × 1920×1080, 1280×800, 1024×768) + Explore home pixel-identical to the release, except the QR modules on the opening and the closing (§6) |
| Validation | Chrome 155 headless, ANGLE D3D11, Intel Iris Plus, Low unless stated; phones = Chrome device emulation (touch, DPR, `isMobile`) on the same GPU; build `index-D5zpMWe9.js` |

## 1. Mobile audience mode

**Entry** (`src/app/entry.ts`; decided once at load from capabilities and the URL, not from the user agent):

| URL | Computer (mouse / trackpad) | Touch-only device (phone, tablet) |
|---|---|---|
| base URL | lecture set-up, **unchanged** | **model only** |
| `?mode=explore` (the QR) | model only | model only |
| `?mode=presentation` | lecture set-up | lecture set-up in the 16:9 stage (testing) |

Touch-only = `(pointer: coarse)` and not `(any-pointer: fine)`, so a touchscreen laptop (trackpad) stays a computer.

**No lecture UI on the explore-only page:** no setup bar, no "Pradėti pristatymą", no "48 s filmas", no talk overlay;
→ Space PageDown Home and T do nothing there (verified: talk inactive, film idle); `?presentationDebug` is ignored. The
talk's scene parts (city, maps, comparison, footprint, fission field, casks) and its font are not mounted, so a phone
never builds or compiles them. The model itself renders identically: Explore home 1920×1080, lecture set-up vs
`?mode=explore` (UI hidden) = **pixel-identical**.

**Layout** (`src/ui/ExploreSheet.tsx`, `styles.css` "Explore-only page", all scoped to `.app--explore` / `xs-*`): the
canvas fills the viewport (`100dvh`, no 16:9 stage, no letterbox, `touch-action: none`, `overscroll-behavior: none`),
safe areas via `viewport-fit=cover` + `env(safe-area-inset-*)`. Top strip: "BWRX-300 · Interaktyvus modelis" and
LT | EN. Bottom sheet, closed to one 48 px handle ("Įrankiai"), open: **Vaizdas** (Rentgenas, Pjūvis → Jėgainė |
Reaktorius + cut slider), **Sistemos** (Srautai, Valdymas → blade slider, Sauga), **Apžiūra** (Išskirti, Užrašai,
Atkurti), then Kokybė (Žema | Aukšta) and Visas ekranas (where the browser supports it), and one line on the
gestures. Every action of the desktop Explore panel is there. The selected part: a card above the sheet (name, the
"in …" parent link, its sentence, at most ~4 lines then it scrolls, Priartinti, ✕); the label anchored in the scene shows
the name only and is kept below the strip and above the sheet / card. Phone in landscape (height ≤ 520 px): a 320 px side
panel, the model keeps the height. On a computer (`?mode=explore`): a 540 px panel at the bottom centre.

**Portrait framing:** every pose is authored for 16:9 at 35°. On a portrait screen the camera's `zoom` (a projection
setting no pose, tween or director writes) widens the view to the horizontal angle of a 1.2-aspect screen
(`ViewportFit`, explore-only); picking and labels use the same projection. No pose, key or camera-director code changed.
The plant then spans the screen's width; it is a wide, low building, so above and below it there is sky and ground.

**Touch** (`ExploreDriver.tsx`; mouse paths unchanged): OrbitControls' one-finger orbit and two-finger pinch / pan; tap
selects, tap on empty space clears, double tap pivots (as double-click); 12 / 32 px tap / double-tap tolerances for a
finger; a gesture that ever had two fingers is never a tap; `pointercancel` handled; iOS `gesturestart` blocked.

**Performance defaults** (`config/quality.ts`): a touch-only device starts in **Low** unless its user picked a level
before (`localStorage` `bwrx300.handheldQuality`; `?quality=` still wins); its drawing buffer is capped at **1.5× /
~1 MP** on Low and 2× / 1.6 MP on High (desktop: 2× / 2.1 MP and 1.75× / 3.7 MP, unchanged).

| Viewport (CSS px @ DPR) | Buffer | Ratio | First frame / ready after bundle start | H-overflow | Letterbox | Lecture UI | Clipped / < 44 px | Tap selects |
|---|---|---|---|---|---|---|---|---|
| 360×800 @3 | 540×1200 (0.65 MP) | 1.5 | 3.8 / 4.0 s ¹ | 0 | no | none | 0 / 0 | yes |
| 390×844 @3 | 585×1266 (0.74 MP) | 1.5 | 1.4 / 1.5 s | 0 | no | none | 0 / 0 | yes |
| 390×844 @2 | 585×1266 (0.74 MP) | 1.5 | 1.3 / 1.4 s | 0 | no | none | 0 / 0 | yes |
| 412×915 @2.625 | 618×1372 (0.85 MP) | 1.5 | 1.3 / 1.5 s | 0 | no | none | 0 / 0 | yes |
| 430×932 @3 | 645×1398 (0.90 MP) | 1.5 | 1.3 / 1.5 s | 0 | no | none | 0 / 0 | yes |
| 844×390 @3 landscape | 1266×585 (0.74 MP) | 1.5 | 1.4 / 1.5 s | 0 | no | none | 0 / 0 ² | yes |

Measured with the sheet closed and fully open (Section and Control sub-rows open: the tallest it gets). ¹ first page
of the browser session (cold caches). ² with both sliders open, 3 of 18 controls sit below the panel's fold and are
reached by scrolling the panel. Quality on load: Žema everywhere. 0 page errors, 0 external requests; console: only the
release's known `THREE.Clock` deprecation warning. `validation/mobile.json`, `mobile-sizes-sheet.png`.

**Touch smoke test** (390×844 @3, raw CDP multi-touch; `validation/touch.json`): **9 / 9** — one finger orbits (−25.8°,
distance kept); pinch zooms (213.6 → 88.7 m); two fingers pan (target moves, distance kept); tap selects the part under
the finger; tap on empty space clears; double tap pivots (target moves 41 m) without selecting; a pinch never selects;
the page never scrolls or zooms (`scrollY` 0, visual-viewport scale 1); no errors.

**Phone performance** (390×844 @3; idle and during a continuous one-finger orbit; also with the CPU slowed 4× to stand
in for a mid-range phone's main thread; the GPU is this laptop's, so absolute phone numbers need a real phone, §7):

| Quality | Buffer | CPU | Idle fps (p95 ms) | Orbiting fps (p95 / worst ms) |
|---|---|---|---|---|
| Low (default) | 585×1266, 0.74 MP | 1× | 60.1 (16.8) | 60.1 (16.8 / 17.3) |
| Low | 585×1266 | 4× slower | 46.8 (33.4) | 47.0 (33.4 / 49.9) |
| High (user choice) | 780×1688, 1.32 MP | 1× | 60.1 (16.9) | 60.1 (16.8 / 17.2) |
| High | 780×1688 | 4× slower | 42.2 (33.5) | 42.7 (33.4 / 50.0) |

Short recording: `mobile-explore-390x844.mp4` (19 s: orbit, pinch, X-ray, Section → Reactor, Flow, Reset).

## 2. QR

The existing pipeline, unchanged in kind: segno 1.6.6 (offline, error correction M, segno's mask), the matrix stored as
one SVG path in `src/presentation/qrCode.ts`, drawn by the app; no network, no third-party image. segno reproduces the
released code byte-for-byte from the old URL, so the same method made the new one. The new payload is 75 bytes, beyond
version 4-M (62), so the code is **version 5-M, 37×37 modules**, drawn at the **same on-screen size** (18 / 30 % of
the stage height, 4-module quiet zone): modules are 9 % smaller (1080p opening 4.3 px / module, closing 7.2). Version
4-L would keep 33 modules with half the error correction; in a blur / noise / resolution sweep the two decode equally at
the 1024×768 opening size (12 / 18 each at 104 px), so M (better against glare or a partly blocked code) was kept.

| Screenshot | Full size | ½ size | ¼ size + blur |
|---|---|---|---|
| opening 1920×1080 / 1280×800 / 1024×768 | ✓ / ✓ / ✓ | ✓ / – / – | – |
| closing 1920×1080 / 1280×800 / 1024×768 | ✓ / ✓ / ✓ | ✓ / ✓ / ✓ | ✓ / – / – |
| fallback 1920×1080, 960×540 @2, 390×844 @3, EN | ✓ all | ✓ all | ✓ at 960×540 and phone |
| portable (`file://`) opening / closing 1920×1080 | ✓ / ✓ | ✓ / ✓ | – / ✓ |

Every ✓ decodes (zxing-cpp) to exactly `…/?mode=explore`. For comparison the released code at the same sizes: the same
pattern, and its closing at 1024×768 failed at ½ size where the new one decodes. `validation/qr-decode*.json`.
Owner copy: **`docs/final/qr/bwrx300-explore-qr.png`** (720×720, 16 px / module, quiet zone, black on white), built from
the stored path and checked equal to segno's matrix; it decodes to the same URL. The startup-gate fallback shows the
same matrix (`build-tools/bootGate.ts` reads `qrCode.ts`).

## 3. Samsung TV / unsupported browsers: startup gate and fallback

A black page means the app never drew and nothing said so. Now (`index.html`, `src/app/boot.ts`):

1. **Loading shell**: an HTML/CSS spinner and "Ruošiama 3D scena" (LT / EN from the stored choice) painted before any
   script; React's identical overlay takes over when it mounts.
2. **Startup gate**: an inline ES5 script (no dependencies; runs where the bundle cannot), with staged watchdogs:
   bundle start ≤ 60 s after the page is parsed · **WebGL renderer ≤ 12 s after the bundle starts** · first frame ≤ 45 s
   after the renderer · ready (shaders compiled) ≤ 60 s after the first frame (`?bootWait=long` ×5). Immediate fallback
   on: no ES modules (`nomodule`), a script or stylesheet that fails to load or a script error before start, no WebGL 2,
   a renderer or scene error before ready (R3F context creation included), **a blank first frame** (13 pixels read
   right after the render all within 4 levels: WebGL "works" but draws nothing), repeated `webglcontextlost` before
   ready. On fallback the app unmounts (GPU released). After `ready` the gate stands down: a single context loss still
   rebuilds the canvas by itself, repeated ones show the existing restart screen (the presenter's tools).
   *Why the first-frame limit is staged:* building the model is CPU work before its first frame, counted from the bundle
   start: 1.3 s on the phone page, 3.5 s for the lecture build on this laptop, 5.9 s on a cold portable start
   (`boot.at` in `validation/fallback.json`, `mobile.json`). The release itself measured "ready in 12 s" here under GPU load, so one 12 s limit from start could have
   sent the lecture PC to the fallback. The 12 s limit now applies to getting a WebGL renderer (0.4–0.8 s measured);
   the model's first frame then has 45 s, under the spinner, so a weak machine shows "Ruošiama 3D scena", never black.
3. **Fallback** (plain DOM, no WebGL, independent of the bundle): "Šiame įrenginyje 3D modelis nepasileido.", a poster
   of the plant (28 KB JPEG, `loading=lazy`: never fetched on a normal start), the **same QR** to `?mode=explore` with
   its address printed, "Atverkite interaktyvų modelį telefone arba kompiuteryje naujausia „Chrome“ ar „Edge“
   naršykle.", "Bandyti dar kartą" (reload with `bootWait=long`), the reason code, LT | EN. Laid out for a 1920×1080 or
   960×540 TV and for a phone; no grid / gap / custom properties (old TV engines); safe areas respected.
4. **Backup video**: 2 × 20.9 MB H.264; the Pages site does not ship it (`fallback/` is git-ignored, the Pages build is a
   sparse checkout). 42 MB on the public site for a rare TV path is not justified: on Pages the guaranteed fallback is
   poster + QR. The **portable package**, which has the videos next to `BWRX300.html`, shows "Rodyti vaizdo įrašą" and
   plays the video in the current language (build-time switch).
5. `?forceFallback=1` shows the fallback (testing). No Smart-TV user-agent rule was added: capability and first-frame
   failure decide, so a TV that can run the model is not refused.

| Scenario (`validation/fallback.json`) | Result |
|---|---|
| normal desktop start | ready (start 0.75 s, renderer 1.5 s, first frame 4.3 s, ready 4.7 s), no fallback, poster not requested |
| `?forceFallback=1` (1920×1080, 960×540 @2, 390×844 @3, EN switch) | fallback in 26 ms, poster loaded, EN text switches |
| WebGL 2 unavailable | fallback `no-webgl2` at once (`tv-fallback.png`) |
| renderer creation fails (probe passes, renderer's context refused) | fallback `scene-error` 0.1 s after start |
| renderer never created (canvas never sized) | fallback `no-renderer` at 12.0 s |
| renderer up, no frame ever drawn | fallback `no-first-frame` 45 s after the renderer |
| app bundle fails to load | fallback `load-script` |
| WebGL draws nothing (draw calls disabled) | fallback `blank-frame` at the first ready check (1.1 s) |
| every renderer context lost right after creation | fallback `context-lost` (4.3 s) |
| context lost once after ready, then three times | rebuilds itself and is ready again; then the existing restart screen, **not** the fallback |
| portable `file://`, `?forceFallback=1`, "Rodyti vaizdo įrašą" | `BWRX300-fallback-lt.mp4` plays (1920×1080, t = 2.3 s after 2.5 s), closes cleanly |

## 4. Files

| File | Change |
|---|---|
| `src/app/entry.ts` (new) | `?mode=explore` / `?mode=presentation` / touch-only default: `ENTRY`, `EXPLORE_ONLY`, `HANDHELD` |
| `src/ui/ExploreSheet.tsx` (new), `src/ui/styles.css` | explore-only top strip, grouped sheet / landscape side panel, selection card |
| `src/app/App.tsx` | explore-only branch (sheet instead of talk overlay + Explore panel + setup bar); gate signals |
| `src/scene/SceneCanvas.tsx` | handheld render limits; explore-only: full-viewport pixel ratio, `ViewportFit`, no `TalkScene`, no talk font; renderer / first-frame / blank-frame signals; repeated context loss before ready → gate |
| `src/config/quality.ts`, `src/state/store.ts` | handheld Low default, stored explicit choice, `HANDHELD_RENDER_LIMITS`; no `?presentationDebug` on the explore-only page |
| `src/app/useKeyboardShortcuts.ts` | explore-only: no talk, film or talk-debug keys |
| `src/interaction/ExploreDriver.tsx`, `labelLayer.ts` | touch tolerances, multi-touch guard, `pointercancel`; label `reserve` (0 on the desktop) |
| `index.html`, `src/app/boot.ts` (new), `src/main.tsx`, `src/ui/LoadingOverlay.tsx` | startup gate, loading shell, fallback, `nomodule`, `viewport-fit=cover` |
| `build-tools/bootGate.ts` (new), `vite.config.ts`, `vite.portable.config.ts` | fills the fallback's QR, address and (portable only) video button at build time |
| `src/app/fallback-poster.jpg` (new) | 1280×720 poster (the opening composition without text) |
| `src/presentation/qrCode.ts`, `config.ts`, `ui/TalkOverlay.tsx` | QR payload `?mode=explore` (5-M), `EXPLORE_PAGE_URL`, its aria-label |
| `src/i18n/strings.ts` | LT / EN strings of the sheet (typed contract) |
| `src/ui/fullscreen.ts` (new), `src/ui/SetupControls.tsx` | full-screen helper moved out to be shared (no behaviour change) |
| `README.md`, `ARCHITECTURE.md`, `docs/final/FACT_AUDIT.md` | URL parameters; post-final map; the QR row |

Not touched: narration, on-screen wording and facts, chapters and their order, timing, cameras and the director, the
section engine, shaders, the talk overlay layout, the frozen 48 s film, the Pages workflow. Payload: +9.0 KB gzip
(index.html 1.9 → 19.4 KB with the gate and the inline QR).

## 5. Astra experiment (read-only)

Found at `C:\Users\user\Desktop\bwrx-astra-lab` (no `astra\bwrx`): a copy of this project with a lab-only entry
(`astra.html`, `src/astra/exterior.ts`, `city.ts`, `maps.ts`), no `node_modules`, its own stills and metrics in
`docs/astra-parallel-rnd/`. Nothing there was moved, modified, installed, built or git-initialised; its stills and sources
were only read. Its "snapshot baseline" is commit **`43ad04c`** (the design study), older than the final city,
comparison and ground fixes, so its "current" frames are not the release's.

| Candidate | Astra variant | Evaluation | Decision |
|---|---|---|---|
| Exterior materials / lighting | 02 "cinematic hierarchy" (warm beige cladding, new key light, cladding grain shader); 01 lighter grey; 03 paving marks | same camera pose as the opening; different rather than better, the warm cladding changes the approved palette; it edits the **shared** plant / section materials, so it would also change the frozen 48 s film and every Explore frame | not adopted |
| City | A "compact urban district" (Astra's pick); B modular; C apartments + houses | a uniform grid of near-identical blocks with thin road lines, no towers or density gradient, its own camera; the final city (boulevards, dense core, lit streets, substation) reads better at projector distance | not adopted |
| Maps | 02 "bevel and value" (Astra's pick); 01; 03 outlined | light grey land lowers the contrast of the amber / white grid, pins and glows that the map exists to show | not adopted |
| Line / substation / site dressing | contact-shadow sheet, roof edges, paving joints, steel rack (exterior 02 / 03) | small details tied to the material variant, not clearly better on their own | not adopted |

Evidence: `astra-current-vs-candidate.png` (final approved still left, Astra's best candidate right; exterior at the same
pose, city and map at Astra's closest framings; reproducing them at the release cameras would mean building the lab
inside its folder, and none of the verdicts depends on the camera). No desktop frame changed for Astra.

## 6. Desktop regression

| Check | Result |
|---|---|
| Golden frames vs release `92b0beb`, clock pinned (`validation/golden-compare.txt`) | Explore home + 12 chapters × 3 sizes: **31 / 37 byte-identical**; the 6 others (opening, closing × 3 sizes) differ only inside one square exactly the size of the QR's module area (1080p: 160 and 266 px = 194.4 and 324 px × 37/45). `desktop-opening-after-qr.png`, `desktop-closing-after-qr.png`, `desktop-qr-before-after.png` |
| Release vs itself (the method's noise) | 37 / 37 identical (two sessions, `validation/golden-release-vs-release.txt`) |
| Navigation (`validation/navigation.json`) | **29 / 29**: 12 chapters in order, each plays its beats by itself to the last, **11 presses** opening → Q&A, the closing holds; web and portable |
| Routing (`validation/routing.json`) | 11 / 11: desktop base URL → set-up with Start / 48 s film, → enters the talk; desktop `?mode=explore` → model only, talk / film keys inert, Explore keys work; phone `?mode=presentation` → set-up in the 16:9 stage (390×219); phone `?mode=explore` → model only |
| Legacy 48 s film (9 seeks, `validation/legacy-film.txt`) | 9 / 9 identical to a release session; the release differs from itself by 3 px, 1 level, at 6 s (session noise, as in the final report) |
| Projectors | text layout unchanged (all 36 settled frames identical; the QR box keeps its size and place), so the release's 96-still result (0 outside, 0 overlaps, 0 outside the 4 % safe zone) stands |
| Low performance, whole talk, 1920×1080, real presses (`validation/perf-low-1080p-*.json`) | release: 60.1 fps in every chapter, 0 frames > 34 ms. This build, run 1 (first, cold): 59.1–60.1, 3 frames > 34 ms (control, energy); **run 2: 60.1 in every chapter, 0 frames > 34 ms**. No regression (final report: 53.6–60.1 under GPU contention) |
| Portable (`npm run build:portable`, `file://`) | ready 4.4 s; frames identical to the web build (37 / 37); 29 / 29 navigation; QR decodes; 0 errors, 0 external requests |
| Console / network | 0 page errors and 0 external requests in every run; only the known `THREE.Clock` warning |
| `npm run check` | PASS (typecheck, lint, production build) |

## 7. Remaining physical-device limitations

1. Phones were emulated in desktop Chrome (touch, DPR, viewport, 4× CPU throttle) on this laptop's GPU; no real phone
   GPU was measured. Check on one Android (Chrome) and one iPhone (Safari): frame rate on Low, the safe areas (notch,
   home bar) and the address bar showing / hiding.
2. iOS Safari: `100dvh`, `env(safe-area-inset-*)`, `gesturestart` and full screen (not offered there for pages) were
   written for it but not run on one. iPhones before iOS 15 have no WebGL 2 and get the fallback.
3. The Samsung TV itself was not available: the fallback paths were forced in Chrome (no WebGL 2, no renderer, no frame,
   blank frame, context loss, bundle load failure). `nomodule` (very old engines) cannot be exercised in current
   Chrome. Re-open the live URL on the TV: it should now show the spinner and then either the model or the fallback.
4. Scan the 5-M QR on the real projector from the back row (it is 9 % denser than the approved 4-M one).
5. The lecture-room PC items of the final report (§11) are unchanged.

## 8. Release record

| | |
|---|---|
| Change commit | **`e818a32`** *post-final: phone explore mode, startup gate and fallback, QR to ?mode=explore* on `presentation-v1`; `main` fast-forwarded from `18cd9e5`, both pushed without force |
| Pages workflow | the push did not start it (as for every earlier deploy), so it was dispatched on `main`: run **39164162294**, head `e818a32`, **success** (build 24 s, deploy 11 s) — https://github.com/tyomachka/bwrx-300-interactive-presentation/actions/runs/39164162294 |
| Live site | https://tyomachka.github.io/bwrx-300-interactive-presentation/ serves **`index-D5zpMWe9.js`**, the validated build (`npm run check` rebuilt it byte-identical) |
| Repository | stays **private** (Pages public) |

Live checks (Chrome, `validation/live/`): **12 / 12**

| Check | Result |
|---|---|
| base URL on a computer | lecture set-up ("Pradėti pristatymą", "48 s filmas"), ready 3.5 s; start + 11 presses reach the Q&A |
| opening / closing QR (`live-opening.png`, `live-closing.png`) | both decode to exactly `https://tyomachka.github.io/bwrx-300-interactive-presentation/?mode=explore` |
| `?mode=explore` on a computer | the interactive model directly, no set-up bar (`live-explore-desktop.png`) |
| `?forceFallback=1` | the HTML fallback, no canvas, poster loaded, no video button on Pages (`live-fallback.png`) |
| phone portrait 390×844 @3, base URL and `?mode=explore` | model only, no lecture UI, no overflow, canvas 390×844 CSS / 585×1266 buffer (`live-phone-portrait.png`) |
| every page | 0 page errors, 0 requests outside the site; console: only the known `THREE.Clock` warning |
