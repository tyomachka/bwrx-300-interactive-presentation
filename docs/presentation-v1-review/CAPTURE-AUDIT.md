# Presentation V1: capture audit (current state)

**Status:** capture / audit pass only. **Nothing in the presentation was changed.** Not final, not
approved.
- **Branch / commit:** `presentation-v1` at `9a30489`.
- **Captured:** 2026-10-17.
- **Mode:** Lithuanian, **Low**, 1920×1080, clean presentation mode.
- **Purpose:** an honest visual record for external review before the next design stage. Facts
  first; opinions are kept to §11 OBSERVATIONS and are not fixed.

**Start here:**
1. `presentation-v1-contact-sheet.png`: the 12 chapters at a glance.
2. `presentation-v1-current-full-walkthrough-1080p.mp4`: the talk at 1×.
3. `presentation-v1-transitions-1080p.mp4`: every transition at 2×.
4. §11 OBSERVATIONS.

**Older files in this folder:**
- Files from the earlier polish pass are still here and were not touched:
  - `01-hook-1080p.png` … `12-close-1080p.png`;
  - `contact-sheet-*.png`, `presentation-v1-walkthrough-x2.5-1080p.mp4`;
  - `compat/`, `validation/`;
  - `VALIDATION-REPORT.md`, `VISUAL-POLISH-REPORT.md`, `PRESENTATION-STORY.md`.
- This pass's files are listed in §2.
- The code is unchanged since that pass. The older stills were captured with a different harness:
  at settle + 1.5 s, and without driving the CSS text animations.

## 1. How this was captured

**Build and environment**
- **Build:** production build of commit `9a30489` (branch `presentation-v1`), from `npm run check`.
- **Served:** by `vite preview`. The served bundle `index-CvfCB61Z.js` was checked against `dist/`.
- **Browser:** Chrome 155 headless, ANGLE D3D11 on Intel Iris Plus (the earlier passes' machine),
  Windows 11, on AC power.
- **Language and quality:** Lithuanian (the default) and **Low**.

**Clean presentation mode**
- `?debug` was used only to reach the automation hooks (`window.__bwrx`). It adds no UI once the
  diagnostics panel is toggled off, which was done before capture.
- No `?presentationDebug`, so the talk's debug panel is not mounted.
- The Explore panel and setup bar auto-hide after 2.5 s without pointer movement and were hidden
  before the first press. Every still records `explore/setup/diagnostics/talkDebug = false`.
- There is no browser chrome: these are page screenshots.
- The pointer is parked at the right edge.
- **Viewport:** 1920×1080, DPR 1. The canvas is 1920×1080 with a 1:1 pixel ratio.

**Real presses**
- The walkthrough videos are driven by real `ArrowRight` key presses, one per beat, in order.
- They use no jumps and no edits, and each is one continuous take.
- The pre-talk view (Explore at rest) is shown for 1 s before the first press, because that is what
  the projector shows when the presenter starts.

**Deterministic time, at real speed**
- Animation time advances 1/30 s per rendered frame, so every frame shows exactly what real-time
  playback shows at that moment, even though capture runs slower than real time.
- The overlay's CSS animations and transitions (text in 450 ms, text out 350 ms, chapter label) and
  its 400 ms removal timer are driven from that same animation time by the harness. Without this,
  stepped capture would show text fades as one-frame pops.
- The harness only paused and seeked existing animations and timers. No application code, timing,
  styling or content was changed in this pass.
- Verified: an incoming caption's opacity advances 33 ms of animation per frame, and an outgoing
  stat fades over 350 ms and is removed at 400 ms (§10).

**Hold policy (full walkthrough, 1×)**
- Every beat runs from its press to its settled state (all timed changes finished, the "settle"
  column in §4), then holds:
  - 4 s after a chapter's first beat;
  - 2.5 s after every other beat;
  - the fission micro beat until 14.5 s after its press, so one complete 11 s chain loop,
    including its fade and restart, is visible;
  - 6 s on the closing frame.
- The camera's breathing drift is live on every hold.

**Stills**
- Lossless PNG frames taken from the full walkthrough itself, the same frame as the video at that
  moment.
- Default moment: 2.0 s after the beat settled, which is mid-hold.
- The fission states are at fixed times in the micro beat. They were chosen from a 0.27 s time
  series (`series-fission`, scratch only).
- Each still also has a DOM snapshot: every visible overlay string, its box, its effective opacity
  and its computed font, size, weight, line-height, letter-spacing and colour. The rendered font face
  comes from Chrome's `CSS.getPlatformFontsForNode`.

**Projector sizes**
- Window sizes 1920×1080, 1280×800 and 1024×768, at DPR 1, through the app's real 16:9 stage and
  letterbox. Nothing else differs.
- Each state is entered with its own choreography, a direct `jump(beat, 'play')` from the settled
  previous beat, and captured at settle + 2 s.

**Transitions video**
- The same real-press walk, with 0.2 s of dwell after each beat settles.
- Animation time advances 1/15 s per frame, encoded at 30 fps, so it plays at **2×**. Easing is
  therefore twice as fast as live.

**Encoding**
- From JPEG frames (q 95) to H.264 High, yuv420p, BT.709 limited range (tagged), 30 fps, no audio.
- CRF 20 for the full walkthrough, which keeps it under 100 MB; CRF 18 for the transitions video.
- Colour conversion uses zscale. The mean error against the source frames is about 1.3/255.
- yuv420p halves the colour resolution, which softens small coloured text such as the amber kicker and units. In the title area, 4:2:0 alone accounts for most of the difference from the PNG (34.0 dB). The H.264 step costs about 1 dB more, and CRF 20 and CRF 18 differ by 0.1 dB.
- For typography, use the PNG stills; the videos are for motion and pacing.

**Frame metrics** (`analyze.py`)
- **dark %:** pixels with luma Y < 24/255.
- **empty/dark %:** 24×24 px blocks that are both flat (σ(Y) < 3) and dark (mean Y < 48). They
  carry no detail at all, and this column is the "visually empty/dark" figure.
- **text area %:** the union of the visible text boxes over the stage.
- **min contrast:** WCAG ratio of each text colour against the actual pixels under its box (the
  darker 60 %, i.e. without the glyphs). The lowest value in the frame is reported.

**Not read:** `PRESENTATION_V1_VISUAL_ACCEPTANCE.md` does not exist in the repository or its
history.

## 2. Files from this pass

| File | What |
|---|---|
| `presentation-v1-current-full-walkthrough-1080p.mp4` | 4:43.0 (283.03 s), 1920×1080, 30 fps, H.264 High, yuv420p (BT.709), no audio, 80.9 MB. The whole talk, Chapter 1 to 12, at **1×**. 32 real presses, the holds of §1, one take. It starts with 1 s of the pre-talk view. |
| `presentation-v1-transitions-1080p.mp4` | 1:29.9 (89.93 s), the same format, 49.8 MB. Every chapter and intra-chapter transition (all 32 presses) at **2×** with 0.2 s of dwell, one continuous take (no edits). |
| `presentation-v1-contact-sheet.png` | The 12 primary stills, chapter number + LT title, 960 px thumbnails. |
| `presentation-v1-key-states-contact-sheet.png` | Fission (6), control (3), energy path (5), safety sequence (6). |
| `presentation-v1-typography-contact-sheet.png` | 1:1 crops of the real frames, each with its computed size / weight / colour. |
| `chapter-01.png` … `chapter-12.png` | Primary stable state per chapter: 1920×1080 lossless PNG frames from the full walkthrough (§3 says why each frame). |
| `chapter-07-01…06`, `chapter-08-01…03`, `chapter-09-01…04` (+ `01b`), `chapter-10-01…05` (+ `02b`) | Multi-state chapters (the brief's list, plus the intermediate beats as `b` files). |
| `beats/` | All 32 beat stills (settle + 2 s; fission micro at 8.53 s) and `all-beats-contact-sheet.png`. Supplementary. |
| `projector-1920x1080/`, `projector-1280x800/`, `projector-1024x768/` | 9 text-heavy states at each window size (§7). |
| `transitions-filmstrips/` | Six frames across each beat's transition (from the transitions take), 8 beats per sheet. Supplementary, for reading motion without scrubbing. |
| `CAPTURE-AUDIT.md` | This file. |
| `capture-validation/` | Machine-readable results: stills with DOM snapshots, frame metrics, FPS runs, GPU samples, projector checks, navigation checks. |

- **Counts:** 99 PNG files: 32 chapter stills, 32 beat stills + 1 sheet, 27 projector frames, 4 filmstrips and 3 contact sheets.
- **Size:** the full walkthrough was encoded at CRF 20 so it stays under GitHub's 100 MB file limit (CRF 18 would be 110.7 MB). The transitions video is CRF 18.
- **Frames:** the full-resolution JPEG frames behind both videos stay in the capture scratchpad.
- **Harness:** the capture harness (Puppeteer scripts) is outside the repository, as in earlier stages.

## 3. Chapter summary

| # | Chapter | Stable screenshot | Beats | Enter (camera / all settled) | Exit | Ambient loop | One-shot | Empty/dark (primary frame) | Mostly text | Placeholder visible | Low fps (avg, real time) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `hook` · BWRX-300 | `chapter-01.png` | 1 | 6.9 s / 6.9 s | → ch2: 4.4 s camera, 5.8 s all | yes (drift, grid pulses) | yes | 72 % | no | yes: e-mail, QR, figures | 58 (lowest beat 58) |
| 2 | `lithuania` · Lietuva | `chapter-02.png` | 3 | 4.4 s / 5.8 s | → ch3: 4.6 s camera, 7.0 s all | yes (rotors, pulses) | yes | 69 % | no | no | 60 (lowest beat 60) |
| 3 | `scale` · Mastelis | `chapter-03.png` | 2 | 4.6 s / 7.0 s | → ch4: 3.6 s | drift only | yes | 81 % | no | no | 60 (lowest beat 60) |
| 4 | `facts` · Trys faktai | `chapter-04.png` | 3 | 3.6 s / 3.6 s | → ch5: 4.4 s camera, 6.9 s all | drift only | yes | 61 % | yes | no | 60 (lowest beat 60) |
| 5 | `projects` · Projektai | `chapter-05.png` | 2 | 4.4 s / 6.9 s | → ch6: 4.4 s | yes (ping ring) | yes | 47 % | no | no | 60 (lowest beat 60) |
| 6 | `handoff` · Į vidų | `chapter-06.png` | 2 | 4.4 s / 4.4 s | → ch7: 1.2 s camera, 1.9 s iris | none on land; drift on descend | yes (descent) | 75 % | no | no | 60 (lowest beat 60) |
| 7 | `fission` · Dalijimasis | `chapter-07.png` | 2 | 1.2 s / 1.9 s | → ch8: 4.2 s camera, 4.8 s all | yes (chain loop) | yes | 82 % | no | no | 60 (lowest beat 60) |
| 8 | `control` · Valdymas | `chapter-08.png` | 3 | 4.2 s / 4.8 s | → ch9: 3.0 s camera, 3.2 s all | yes (glints) | yes | 8 % | no | no | 60 (lowest beat 60) |
| 9 | `energy` · Nuo atomo iki elektros | `chapter-09.png` | 5 | 3.0 s / 3.2 s | → ch10: 4.2 s | yes (all flows) | yes | 84 % | no | no | 60 (lowest beat 60) |
| 10 | `safety` · Pasyvioji sauga | `chapter-10.png` | 6 | 4.2 s / 4.2 s | → ch11: 4.2 s camera, 5.3 s all | yes (passive loop) | yes | 63 % | no | no | 60 (lowest beat 60) |
| 11 | `limits` · Iššūkiai | `chapter-11.png` | 1 | 4.2 s / 5.3 s | → ch12: 10.0 s | yes (passive loop 0.6) | yes | 75 % | yes | no | 60 (lowest beat 60) |
| 12 | `close` · Klausimai | `chapter-12.png` | 2 | 10.0 s / 10.0 s | none (holds) | yes (drift, grid pulses) | yes | 72 % | yes | yes: e-mail, QR, figures | 60 (lowest beat 60) |

- **Enter:** time from the press that starts the chapter until its camera move ends, then until
  every timed change and one-shot has finished.
- **Exit:** there is no exit animation. The next press fades the overlay out in 0.35 s and starts the
  next chapter's entry at once; that entry's duration is shown.
- **Empty/dark:** measured on the primary frame (§6).
- **Low fps:** the uncontended real-time run (§8).

## 4. Beat timing and video timestamps

| # | Beat | Lock (s) | Camera move ends (s) | All timed changes done (s) | Full video at | Transitions video at | Low fps (avg / worst frame ms) |
|---|---|---|---|---|---|---|---|
| 0 | `hook/hero` | 1.5 | 6.9 | 6.9 | 0:01.0 | 0:00.3 | 58 / 282.5 |
| 1 | `lithuania/renewables` | 2.2 | 4.4 | 5.8 | 0:11.9 | 0:03.8 | 60.1 / 17.3 |
| 2 | `lithuania/calm` | 1.8 | 3.2 | 3.6 | 0:21.7 | 0:06.8 | 59.9 / 33.3 |
| 3 | `lithuania/assessment` | 1.2 | 2.6 | 2.6 | 0:27.8 | 0:08.7 | 60.1 / 17.2 |
| 4 | `scale/large` | 3 | 4.6 | 7.0 | 0:32.9 | 0:10.1 | 60.1 / 17.4 |
| 5 | `scale/modules` | 2.5 | 4.0 | 7.7 | 0:43.9 | 0:13.7 | 60.1 / 17.3 |
| 6 | `facts/power` | 2 | 3.6 | 3.6 | 0:54.1 | 0:17.7 | 60.1 / 17.3 |
| 7 | `facts/pitches` | 2 | 3.4 | 3.4 | 1:01.7 | 0:19.6 | 60.1 / 17.2 |
| 8 | `facts/months` | 1.6 | 3.2 | 3.2 | 1:07.6 | 0:21.4 | 60.1 / 16.9 |
| 9 | `projects/world` | 2.4 | 4.4 | 6.9 | 1:13.3 | 0:23.1 | 60.1 / 17.2 |
| 10 | `projects/darlington` | 1.8 | 3.4 | 3.4 | 1:24.2 | 0:26.7 | 60.1 / 17.4 |
| 11 | `handoff/land` | 3 | 4.4 | 4.4 | 1:30.1 | 0:28.5 | 60.1 / 17.3 |
| 12 | `handoff/descend` | 5 | 15.7 | 15.7 | 1:38.5 | 0:30.8 | 59.9 / 33.4 |
| 13 | `fission/micro` | 2 | 1.2 | 1.9 | 1:56.7 | 0:38.7 | 60.1 / 17 |
| 14 | `fission/inFuel` | 1.2 | — | 1.8 | 2:11.2 | 0:39.8 | 60.1 / 16.9 |
| 15 | `control/blades` | 2.4 | 4.2 | 4.8 | 2:15.5 | 0:40.8 | 60.1 / 17.2 |
| 16 | `control/insert` | 1.8 | — | 2.0 | 2:24.3 | 0:43.3 | 60.1 / 17.3 |
| 17 | `control/withdraw` | 1.8 | — | 2.0 | 2:28.8 | 0:44.4 | 60.1 / 17 |
| 18 | `energy/boil` | 2.4 | 3.0 | 3.2 | 2:33.3 | 0:45.5 | 60.1 / 17.2 |
| 19 | `energy/steam` | 3 | 5.2 | 5.2 | 2:40.5 | 0:47.2 | 60.1 / 17.4 |
| 20 | `energy/turbine` | 3.4 | 6.0 | 7.4 | 2:48.2 | 0:49.9 | 60.1 / 17 |
| 21 | `energy/condenser` | 3 | 7.5 | 8.8 | 2:58.1 | 0:53.7 | 60.1 / 17.1 |
| 22 | `energy/grid` | 3 | 9.0 | 10.0 | 3:09.4 | 0:58.2 | 60.1 / 17.3 |
| 23 | `safety/normal` | 2.6 | 4.2 | 4.2 | 3:21.9 | 1:03.3 | 60.1 / 17 |
| 24 | `safety/blackout` | 1.6 | — | 7.3 | 3:30.1 | 1:05.5 | 60.1 / 17.3 |
| 25 | `safety/scram` | 3 | 3.2 | 4.7 | 3:39.9 | 1:09.2 | 60.1 / 17.6 |
| 26 | `safety/decay` | 2 | 3.0 | 3.0 | 3:47.1 | 1:11.7 | 60.1 / 17.5 |
| 27 | `safety/ics` | 3.6 | 4.2 | 7.2 | 3:52.6 | 1:13.3 | 60.1 / 17 |
| 28 | `safety/days` | 2 | 3.0 | 6.3 | 4:02.3 | 1:17.0 | 60.1 / 16.9 |
| 29 | `limits/limits` | 2 | 4.2 | 5.3 | 4:11.1 | 1:20.3 | 60.1 / 17.3 |
| 30 | `close/return` | 4 | 10.0 | 10.0 | 4:20.4 | 1:23.0 | 60.1 / 17.2 |
| 31 | `close/qa` | 1 | — | 2.6 | 4:34.4 | 1:28.1 | 60.1 / 17.1 |

Frames: full walkthrough 8,491 (4:43.0); transitions take 2,698 (1:29.9, 2×).

- **Lock:** a second forward press is ignored for this long.
- **Camera move ends:** the last camera key ("—" means the beat has no camera move).
- **All timed changes done:** the settle time, with every world channel, reveal track and cue
  finished.
- **Video timestamps:** where each press happens in the two videos.
- **Low fps:** per beat, from the press to settle + 1.5 s, on the uncontended run.
- **Totals:** 171.9 s of choreography in 32 presses.

## 5. Chapters in detail

### 1. BWRX-300 (`hook`)

- **Stable screenshot:** `chapter-01.png`, from the `hook/hero` beat at 8.93 s after its press (video 0:09.9). The only beat; it holds while the speakers introduce themselves.
- **Beats:** 1 (hero).
- **Enter:** From the pre-talk Explore view: dip to black (0.42 s), fade in (0.65 s), and a 6.5 s camera rise from low on the reactor building to the 3/4 hero view. It settles 6.9 s after the press. The presenters fade in at 3.0–4.2 s, the title at 4.0–5.2 s and the QR at 5.0–6.0 s.
- **Exit:** No exit animation of its own. On the next press the title, presenters and QR fade out (0.35 s) while chapter 2's move starts: the camera rises (4.4 s) and the plant shrinks to a point while the Lithuania map opens around it.
- **Ambient loop:** yes. Slow camera breathing (drift 0.7), electricity pulses along the line to the city off the right edge, lit hall glazing.
- **One-shot:** yes. The fade-in and rise, then the three overlay groups fade in one after another.
- **Dominant visual subject:** The BWRX-300 plant (reactor-building cylinder, turbine hall, annex) in a 3/4 view on its site slab, centred; two grey presenter silhouettes bottom-left; the QR placeholder box bottom-right.
- **Primary frame metrics:** 72 % empty/dark (flat dark blocks), 30 % dark pixels, mean luma 36/255; text covers 3.4 % of the frame (9 text elements, sizes 15, 17, 21, 24, 25.9, 68 px). Lowest text contrast 5.47:1 (“VIRGILIJUS_EMAIL_TODO”, 17 px on #1c1d1d).
- **Mostly text:** no. A title card over the plant: the plant is the subject; the text is title + names + QR.
- **Placeholder / TODO visible to the audience:** yes. `VIRGILIJUS_EMAIL_TODO` (amber monospace); the dashed QR box with “QR” and “QR kodas bus čia” (monospace); neutral silhouettes instead of portraits.
- **Low fps (1920×1080, real time):** 58.0 avg, lowest beat 58 (`hook/hero`), worst frame 282.5 ms. In the earlier run with GPU sharing: 57.9 avg, lowest 57.9.
- **Visible on-screen text (exact, as rendered; per beat):**
  - `00-hook-hero` (8.93 s): “MAŽIEJI MODULINIAI REAKTORIAI” · “BWRX-300” · “Virgilijus Kiltinavičius” · “VIRGILIJUS_EMAIL_TODO” · “Timofej Gaivoronskij” · “timofej.gaivoronskij@stud.vilniustech.lt” · “QR” · “Interaktyvus modelis” · “QR kodas bus čia”

### 2. Lietuva (`lithuania`)

- **Stable screenshot:** `chapter-02.png`, from the `lithuania/renewables` beat at 7.80 s after its press (video 0:19.7). The chapter's main fact (50 %), entered with the map reveal; calm and assessment are short follow-ups (their frames: `beats/02-…`, `beats/03-…`).
- **Beats:** 3 (renewables · calm · assessment).
- **Enter:** The camera rises (keys 1.7 s, 4.4 s). The plant shrinks to a map point (0.4–3.4 s, power2.inOut) while the Lithuania table opens radially from it (0.9–3.9 s). Wind starts at 2.6 s and solar at 2.8 s. “50 %” fades in at 3.8–4.3 s and counts up at 4.0–5.8 s. Inside the chapter: calm settles in 3.6 s (camera pan; turbines slow; sun sets; imports grow; node lights up; “importas” tag) and assessment in 2.6 s (camera; the country warms).
- **Exit:** On the next press the caption and note fade out (0.35 s). Chapter 3 dives into the node: the plant grows back as the map closes (0.2–3.2 s), and the large unit rises beside it (3.8–6.8 s).
- **Ambient loop:** yes. Wind rotors turning, light pulses along lines and interconnectors, city glows, the node's expanding ring (calm / assessment), camera breathing.
- **One-shot:** yes. The radial map reveal and the 50 % count-up (once).
- **Dominant visual subject:** Lithuania as a lit grey table seen from above at an angle (right ~60 % of the frame): wind-turbine glyphs, solar fields, warm city glows, power lines with moving pulses; the dark sea and neighbours fill the rest.
- **Primary frame metrics:** 69 % empty/dark (flat dark blocks), 23 % dark pixels, mean luma 48/255; text covers 3.0 % of the frame (4 text elements, sizes 14, 15, 23, 96 px). Lowest text contrast 6.48:1 (“Šaltinis: „Litgrid“, 2026-01-28”, 15 px on #23292f).
- **Mostly text:** no. The map carries the claim; the left column carries one number + one line + source.
- **Placeholder / TODO visible to the audience:** none.
- **Low fps (1920×1080, real time):** 60.0 avg, lowest beat 59.9 (`lithuania/calm`), worst frame 33.3 ms. In the earlier run with GPU sharing: 56.6 avg, lowest 56.
- **Visible on-screen text (exact, as rendered; per beat):**
  - `01-lithuania-renewables` (7.80 s): “LIETUVA” · “50 %” · “Lietuvos elektros poreikio 2025 m. patenkino atsinaujinanti energetika” · “Šaltinis: „Litgrid“, 2026-01-28”
  - `02-lithuania-calm` (5.60 s): “LIETUVA” · “O kai nėra vėjo ir saulės?” · “Sistemai reikia ir valdomos gamybos” · “importas”
  - `03-lithuania-assessment` (4.60 s): “LIETUVA” · “Lietuva vertina BWRX-300” · “2026 m. vasario memorandumas” · “Šaltinis: LR energetikos ministerija, 2026-02-25”

### 3. Mastelis (`scale`)

- **Stable screenshot:** `chapter-03.png`, from the `scale/modules` beat at 9.70 s after its press (video 0:53.6). The chapter's conclusion (5 × 300 MW). It holds while modular build-out is explained. The ~1 500 MW comparison frame is `beats/04-scale-large.png`.
- **Beats:** 2 (large · modules).
- **Enter:** Down into the node: the plant grows back out (0.2–3.2 s) as the map closes (0.3–3.1 s). The camera reaches the wide view at 4.6 s, and the generic large unit rises at 3.8–6.8 s. Labels: “~300 MW” at 4.0–4.8 s and “~1 500 MW” at 6.2–7.0 s. Inside the chapter, modules takes 7.7 s: four units assemble one after another (1.2–7.7 s, linear), the large unit turns into an X-ray ghost (0–1.6 s), and the caption appears at 3.2–4.0 s.
- **Exit:** On the next press the stat, caption and note fade out. Chapter 4's camera move (3.6 s) starts while the modules and the large unit lower away (0–2.0 s).
- **Ambient loop:** camera breathing only (drift 0.7). Nothing in the scene moves once assembled.
- **One-shot:** yes. The large unit's rise and the staggered assembly of four units (once).
- **Dominant visual subject:** large: our plant (right, cut by the right edge) beside a generic dome-and-box ~1 500 MW unit (left). modules: a diagonal row of five BWRX-300 units (ours detailed, four plain), with the large unit as a dithered ghost behind the left text column.
- **Primary frame metrics:** 81 % empty/dark (flat dark blocks), 63 % dark pixels, mean luma 25/255; text covers 4.4 % of the frame (5 text elements, sizes 14, 15, 23, 31.7, 96 px). Lowest text contrast 8.18:1 (“Iliustracinis galios palyginimas, ne techninis a”, 15 px on #131313).
- **Mostly text:** no.
- **Placeholder / TODO visible to the audience:** none. The large unit is a generic massing by design, not a placeholder.
- **Low fps (1920×1080, real time):** 60.1 avg, lowest beat 60.1 (`scale/large`), worst frame 17.4 ms. In the earlier run with GPU sharing: 59.3 avg, lowest 58.5.
- **Visible on-screen text (exact, as rendered; per beat):**
  - `04-scale-large` (9.00 s): “MASTELIS” · “~1 500 MW” · “DIDELIS BLOKAS” · “~300 MW” · “BWRX-300” · “Iliustracinis galios palyginimas, ne techninis atitikmuo”
  - `05-scale-modules` (9.70 s): “MASTELIS” · “5 × 300 MW” · “ta pati fizika – kitas mastelis” · “Vienodi blokai – statomi vienas po kito” · “Iliustracinis galios palyginimas, ne techninis atitikmuo”

### 4. Trys faktai (`facts`)

- **Stable screenshot:** `chapter-04.png`, from the `facts/months` beat at 5.20 s after its press (video 1:12.8). Of the three equal-weight facts, the one that needs the longest spoken qualifier (vendor estimate, excludes licensing/financing). Power and pitches are in `beats/`.
- **Beats:** 3 (power · pitches · months).
- **Enter:** The camera moves to the close plant view (3.6 s). The comparison lowers away (0–2.0 s), the fog returns (0–3 s), and “~300” counts up at 1.4–3.0 s. Inside the chapter: pitches 3.4 s (steep camera; the two pitches wipe on at 1.2–3.0 s) and months 3.2 s (camera; the pitches fade).
- **Exit:** On the next press the stat and note fade out. Chapter 5 rises: the plant shrinks into the Darlington pin (0.3–3.3 s) while the North Atlantic map opens (0.8–3.8 s). The pins and labels then follow until 6.9 s.
- **Ambient loop:** camera breathing only.
- **One-shot:** yes. The “~300” count-up and the pitch wipe.
- **Dominant visual subject:** power / months: the plant exterior close up (cylinder + turbine hall), with the stat set over its annex and site slab. pitches: two football pitches beside the site slab, seen steeply from above.
- **Primary frame metrics:** 61 % empty/dark (flat dark blocks), 30 % dark pixels, mean luma 39/255; text covers 3.7 % of the frame (5 text elements, sizes 14, 15, 23, 40, 96 px). Lowest text contrast 5.38:1 (“mėn.*”, 40 px on #34393f).
- **Mostly text:** yes. 2 of 3 beats (power, months) are a number and a caption over a plant view the audience has already seen; only pitches is a visual statement.
- **Placeholder / TODO visible to the audience:** none.
- **Low fps (1920×1080, real time):** 60.1 avg, lowest beat 60.1 (`facts/power`), worst frame 17.3 ms. In the earlier run with GPU sharing: 60.1 avg, lowest 60.1.
- **Visible on-screen text (exact, as rendered; per beat):**
  - `06-facts-power` (5.60 s): “TRYS FAKTAI” · “~300” · “MW” · “elektros galia, vienas blokas”
  - `07-facts-pitches` (5.40 s): “TRYS FAKTAI” · “≈ 2” · “futbolo aikštės” · “jose telpa visas energetinis blokas” · “Gamintojo (GE Vernova) duomenys: blokas telpa dviejose tarptautinėse futbolo aikštėse”
  - `08-facts-months` (5.20 s): “TRYS FAKTAI” · “24–36” · “mėn.*” · “statyba: nuo pirmojo betono reaktoriaus pastate iki kuro įkrovimo” · “*Gamintojo įvertis serijiniam blokui; be licencijavimo ir finansavimo”

### 5. Projektai (`projects`)

- **Stable screenshot:** `chapter-05.png`, from the `projects/world` beat at 8.90 s after its press (video 1:22.2). All five projects and the legend are on screen while the presenter lists them; Darlington is a short follow-up (`beats/10-…`).
- **Beats:** 2 (world · darlington).
- **Enter:** The camera rises (keys 1.7 s, 4.4 s). The plant becomes the Darlington pin (0.3–3.3 s) and the map opens (0.8–3.8 s). Pins grow in one after another (cue 3.6–6.8 s), with labels at 3.9 / 4.5 / 5.1 / 5.7 / 6.3 s (0.6 s each), and the legend and note at 4.2–4.8 s. Inside the chapter, darlington takes 3.4 s: the camera glides close and the other pins dim.
- **Exit:** On the next press the legend, label and note fade out. Chapter 6 dives into the pin (1.6 s), and the plant grows out of it onto the hero view (4.4 s).
- **Ambient loop:** yes. An expanding ring 'ping' around Darlington every 2.4 s, plus camera breathing.
- **One-shot:** yes. The map reveal and the staggered pins / labels (once).
- **Dominant visual subject:** world: the North Atlantic (LAEA) in light-grey land on navy ocean, with five status pins and tag labels (three clustered in the top-right corner). darlington: a close tilted map of the Great Lakes with a large amber 3D pushpin.
- **Primary frame metrics:** 47 % empty/dark (flat dark blocks), 58 % dark pixels, mean luma 44/255; text covers 2.8 % of the frame (16 text elements, sizes 14, 15, 16, 21 px). Lowest text contrast 8.53:1 (“PROJEKTAI”, 14 px on #010f1c).
- **Mostly text:** no.
- **Placeholder / TODO visible to the audience:** none. Estonia / Lithuania pins mark countries, not sites, by design.
- **Low fps (1920×1080, real time):** 60.1 avg, lowest beat 60.1 (`projects/world`), worst frame 17.4 ms. In the earlier run with GPU sharing: 60.1 avg, lowest 60.1.
- **Visible on-screen text (exact, as rendered; per beat):**
  - `09-projects-world` (8.90 s): “PROJEKTAI” · “statoma” · “licencijavimas” · “planuojama” · “vertinama” · “Darlingtonas, Kanada” · “Clinch River, JAV” · “leidimas statyti, 2026 m.” · “Lenkija” · “Estija” · “Lietuva” · “Šaltiniai: CNSC, US NRC, GE Vernova Hitachi, LR energetikos ministerija (2025–2026)”
  - `10-projects-darlington` (5.40 s): “PROJEKTAI” · “statoma” · “licencijavimas” · “planuojama” · “vertinama” · “Darlingtonas, Kanada” · “CNSC statybos licencija – 2025 m. balandžio 4 d.”
  - Contrast: on `darlington` the chapter label “PROJEKTAI” measures 2.17:1 and the note “CNSC statybos licencija…” 2.55:1 against the light-grey land behind them.

### 6. Į vidų (`handoff`)

- **Stable screenshot:** `chapter-06.png`, from the `handoff/land` beat at 6.40 s after its press (video 1:36.5). The pause where the presenters change over (the descent is a 15.7 s move; its settled open-core frame is `beats/12-handoff-descend.png`).
- **Beats:** 2 (land · descend; no chapter label on screen).
- **Enter:** land: the camera dives into the Darlington pin (1.6 s) and the plant grows out of it (0.2–3.4 s) as the map closes (0.4–3.2 s). It lands on the approved hero view at 4.4 s. Inside the chapter, descend takes 15.7 s: the frozen Stage 3 film segment (0–15.4 s) after a 0.3 s delay, going down through ground, shaft and containment until the vessel opens on the core.
- **Exit:** No overlay to remove. Chapter 7 opens the micro view out of a fuel spot: camera 1.2 s, iris 1.0–1.9 s.
- **Ambient loop:** land: none at all (drift 0), a completely still frame. descend: camera breathing on the open-core hold.
- **One-shot:** yes. The 15.7 s descent.
- **Dominant visual subject:** land: the plant exterior, centred and identical in composition to facts/power. descend (settled): the cut-open vessel and core (cream fuel bundles, dark blade structures) filling the frame.
- **Primary frame metrics:** 75 % empty/dark (flat dark blocks), 26 % dark pixels, mean luma 37/255; no text in the frame.
- **Mostly text:** no. No text at all, by design.
- **Placeholder / TODO visible to the audience:** none.
- **Low fps (1920×1080, real time):** 60.0 avg, lowest beat 59.9 (`handoff/descend`), worst frame 33.4 ms. In the earlier run with GPU sharing: 59.9 avg, lowest 59.8.
- **Visible on-screen text (exact, as rendered; per beat):**
  - `11-handoff-land` (6.40 s): (no text)
  - `12-handoff-descend` (17.70 s): (no text)

### 7. Dalijimasis (`fission`)

- **Stable screenshot:** `chapter-07.png`, from the `fission/micro` beat at 8.53 s after its press (video 2:05.2). The longest-lasting part of each 11 s loop: both fissions done, fragments and heat glows, before the loop fades (≈ 6.5–10.9 s of every loop).
- **Beats:** 2 (micro · inFuel).
- **Enter:** From the open core the camera settles (1.2 s) and the micro view opens out of a fuel spot (iris 1.0–1.9 s). The chain then plays with an 11.0 s period (8.6 τ at 0.78 τ/s): absorption ≈ 2–3 s, first split ≈ 3.5–4 s, second split ≈ 5.6–6.2 s, fade out 10.9–11.8 s, restart 12.0 s. The labels appear in windows within each loop. Inside the chapter, inFuel takes 1.8 s: the micro view closes into the warm spot (0–1.1 s) and the spot appears (0.5–1.1 s).
- **Exit:** On the next press the warm spot fades (0.8 s). The camera pulls back to a core close-up (1.8 s) and then the blades in plan (4.2 s).
- **Ambient loop:** yes. The complete chain loops every 11.0 s with a near-black seam at ≈ 11.5–12.3 s (`chapter-07-05-loop-seam.png`). The warm spot stays on inFuel.
- **One-shot:** yes. The iris opening and closing.
- **Dominant visual subject:** Sphere-cluster nuclei (grey and beige) and white neutrons on a dark navy backdrop with the core faintly visible behind. Brown heat glows between the fragments.
- **Primary frame metrics:** 82 % empty/dark (flat dark blocks), 73 % dark pixels, mean luma 27/255; text covers 0.7 % of the frame (3 text elements, sizes 14, 15, 21 px). Lowest text contrast 8.92:1 (“DALIJIMASIS”, 14 px on #03070c).
- **Mostly text:** no.
- **Placeholder / TODO visible to the audience:** none.
- **Low fps (1920×1080, real time):** 60.1 avg, lowest beat 60.1 (`fission/micro`), worst frame 17 ms. In the earlier run with GPU sharing: 60.1 avg, lowest 60.1.
- **Visible on-screen text (exact, as rendered; per beat):**
  - `13-fission-micro-a-before-absorption` (2.13 s): “DALIJIMASIS” · “neutronas” · “U-235” · “Schema, ne mastelis”
  - `13-fission-micro-b-first-split` (4.27 s): “DALIJIMASIS” · “nauji neutronai” · “Schema, ne mastelis”
  - `13-fission-micro-c-chain-reaction` (6.40 s): “DALIJIMASIS” · “energija → šiluma” · “grandininė reakcija” · “Schema, ne mastelis”
  - `13-fission-micro` (8.53 s): “DALIJIMASIS” · “grandininė reakcija” · “Schema, ne mastelis”
  - `13-fission-micro-e-loop-seam` (11.73 s): “DALIJIMASIS” · “Schema, ne mastelis”
  - `14-fission-inFuel` (3.80 s): “DALIJIMASIS” — **laid out off-screen (not visible):** Tai vyksta kure
  - **Defect, not fixed:** on `inFuel` the label “Tai vyksta kure” is rendered at full opacity but laid out at y = 1269–1304 px, below the 1080 px stage, so it is never seen. The beat shows no text. This was reproduced in real time without the harness.

### 8. Valdymas (`control`)

- **Stable screenshot:** `chapter-08.png`, from the `control/blades` beat at 6.80 s after its press (video 2:22.3). The blades are introduced here, the longest explanation. Insert and withdraw are quick demonstrations (`chapter-08-02/03`).
- **Beats:** 3 (blades · insert · withdraw).
- **Enter:** The camera moves from the warm spot to a core close-up (1.8 s) and then to the blades view (4.2 s). Copper emphasis at 2.4–3.4 s, glints at 2.4–3.3 s, label at 4.0–4.8 s. Inside the chapter, insert and withdraw take 2.0 s each, with the blades moving at 0.2–2.0 s and no camera move.
- **Exit:** On the next press the caption and note fade out. Chapter 9 moves to the vessel architecture view (3.0 s) while the copper emphasis fades (0.8 s) and the flows build.
- **Ambient loop:** yes. Reaction glints twinkle at the current level, blue flow streaks, camera breathing.
- **One-shot:** yes. Blade insertion and withdrawal (1.8 s each).
- **Dominant visual subject:** The cut core seen steeply from above with copper control blades between the bundles, semi-transparent vessel walls with blue streaks and white glints.
- **Primary frame metrics:** 8 % empty/dark (flat dark blocks), 0 % dark pixels, mean luma 83/255; text covers 0.7 % of the frame (4 text elements, sizes 14, 15, 16, 21 px). Lowest text contrast 3.72:1 (“VALDYMAS”, 14 px on #4c4d50).
- **Mostly text:** no.
- **Placeholder / TODO visible to the audience:** none.
- **Low fps (1920×1080, real time):** 60.1 avg, lowest beat 60.1 (`control/blades`), worst frame 17.3 ms. In the earlier run with GPU sharing: 55.2 avg, lowest 45.6.
- **Visible on-screen text (exact, as rendered; per beat):**
  - `15-control-blades` (6.80 s): “VALDYMAS” · “valdymo mentės” · “sugeria neutronus” · “Iliustracinis judesys”
  - `16-control-insert` (4.00 s): “VALDYMAS” · “Daugiau įstumta → mažiau reakcijų” · “Iliustracinis judesys”
  - `17-control-withdraw` (4.00 s): “VALDYMAS” · “Mažiau įstumta → daugiau reakcijų” · “Iliustracinis judesys”
  - Contrast: the chapter label “VALDYMAS” measures 3.7–3.8:1 and the note “Iliustracinis judesys” 4.15:1 against the mid-grey vessel and floor.

### 9. Nuo atomo iki elektros (`energy`)

- **Stable screenshot:** `chapter-09.png`, from the `energy/grid` beat at 12.00 s after its press (video 3:21.4). The chapter's landing: plant, line and city with the homes figure, the longest choreography (10 s). Each step of the journey has its own still (`chapter-09-*`).
- **Beats:** 5 (boil · steam · turbine · condenser · grid).
- **Enter:** boil: the camera moves to the vessel view (3.0 s), the mixture rises at 0.8–2.0 s, the downcomer at 1.4–2.6 s, labels at 2.4–3.2 s. Inside the chapter: steam 5.2 s, turbine 7.4 s, condenser 8.8 s and grid 10.0 s. The grid beat's camera goes generator 2.6 s → mid 5.4 s → wide 9.0 s; the city lights at 6.8–9.4 s; “≈ 300 000” counts up at 8.4–10.0 s.
- **Exit:** On the next press the homes stat and note fade out. Chapter 10 returns from the city to the opened plant (4.2 s), and nothing in the plant resets.
- **Ambient loop:** yes. Every flow keeps running (water, mixture, steam, condensate, feedwater), the turbine shaft spins, power pulses run along the line, and the city windows stay lit.
- **One-shot:** yes. Flow fronts, the shaft spin-up and the “≈ 300 000” count-up.
- **Dominant visual subject:** A journey through five views: the vessel's natural circulation; separators / dryer; the turbine train through the X-rayed hall; the whole water cycle in section; the plant, line and city at a distance.
- **Primary frame metrics:** 84 % empty/dark (flat dark blocks), 78 % dark pixels, mean luma 22/255; text covers 3.0 % of the frame (5 text elements, sizes 14, 15, 21, 40, 96 px). Lowest text contrast 8.44:1 (“*Gamintojo iliustracinis įvertis; miestas – ne k”, 15 px on #0f0f0f).
- **Mostly text:** no.
- **Placeholder / TODO visible to the audience:** none. The city is a generic illustration, labelled as such.
- **Low fps (1920×1080, real time):** 60.1 avg, lowest beat 60.1 (`energy/boil`), worst frame 17.4 ms. In the earlier run with GPU sharing: 56.3 avg, lowest 55.1.
- **Visible on-screen text (exact, as rendered; per beat):**
  - `18-energy-boil` (5.20 s): “NUO ATOMO IKI ELEKTROS” · “verda” — **laid out off-screen (not visible):** vanduo kyla
  - `19-energy-steam` (7.20 s): “NUO ATOMO IKI ELEKTROS” · “separatoriai” · “džiovintuvas”
  - `20-energy-turbine` (9.40 s): “NUO ATOMO IKI ELEKTROS” · “turbina”
  - `21-energy-condenser` (10.80 s): “NUO ATOMO IKI ELEKTROS” · “kondensatorius” · “vanduo grįžta į reaktorių”
  - `22-energy-grid` (12.00 s): “NUO ATOMO IKI ELEKTROS” · “generatorius” · “≈ 300 000” · “namų ūkių*” · “*Gamintojo iliustracinis įvertis; miestas – ne konkreti vieta”
  - **Defects, not fixed:** on `boil` the label “vanduo kyla” is rendered but laid out at y = 1107 px, below the 1080 px stage, so it is never seen; only “verda” shows. On `steam` the tag “separatoriai” is cut by the bottom edge, so only its upper part is visible.

### 10. Pasyvioji sauga (`safety`)

- **Stable screenshot:** `chapter-10.png`, from the `safety/days` beat at 8.30 s after its press (video 4:10.6). The settled end of the safety argument (“7 paros” reached, the passive loop running). It holds while the presenter concludes. Every step is in `chapter-10-*`.
- **Beats:** 6 (normal · blackout · scram · decay · ics · days).
- **Enter:** normal: from the city back to the opened plant (camera 4.2 s), reveal 0.5–2.5 s, fog 0–3 s; nothing resets. Inside the chapter: blackout 7.3 s (no camera move; the line goes dark 0–0.25 s, hall lights 0.15–0.65 s, the site dims 0.2–1.0 s, steam stops 0.6–1.8 s, the turbine winds down 0.3–7.3 s); scram 4.7 s (camera to the blades 3.2 s, every blade in 3.4–4.7 s); decay 3.0 s (camera 3.0 s, warmth 0.6–2.8 s, meters 1.8–2.4 s); ics 7.2 s (camera 1.4 s → 4.2 s, vessel cut closes 0.6–2.0 s, steam / condensing / condensate fronts 3.6–5.8 s, pool warms 5.0–6.2 s); days 6.3 s (camera 3.0 s, counter 0.8–6.3 s).
- **Exit:** On the next press the caption and counter fade out. Chapter 11 widens to the opened plant (4.2 s), and the passive loop eases to 0.6.
- **Ambient loop:** yes. The passive loop keeps running (steam up, condensate down, warm pool), plus camera breathing. The counter runs once and holds.
- **One-shot:** yes. Blackout, wind-down, scram, decay warmth, ICS fronts, the 0 h → 7 paros counter.
- **Dominant visual subject:** The same opened plant through six states: running; dark; the blades in; the warm vessel; the isolation condensers in the pools with the passive loop; a wide view of the loop with the day counter.
- **Primary frame metrics:** 63 % empty/dark (flat dark blocks), 35 % dark pixels, mean luma 34/255; text covers 5.2 % of the frame (5 text elements, sizes 14, 15, 23, 44, 96 px). Lowest text contrast 8.17:1 (“*Be operatorių veiksmų; tam pakanka 2 iš 3 kontū”, 15 px on #0a141d).
- **Mostly text:** no.
- **Placeholder / TODO visible to the audience:** none.
- **Low fps (1920×1080, real time):** 60.1 avg, lowest beat 60.1 (`safety/normal`), worst frame 17.6 ms. In the earlier run with GPU sharing: 44.0 avg, lowest 28.1.
- **Visible on-screen text (exact, as rendered; per beat):**
  - `23-safety-normal` (6.20 s): “PASYVIOJI SAUGA” · “Įprastas darbas”
  - `24-safety-blackout` (9.30 s): “PASYVIOJI SAUGA” · “Dingo išorinis elektros tiekimas”
  - `25-safety-scram` (6.70 s): “PASYVIOJI SAUGA” · “Grandininė reakcija sustabdoma”
  - `26-safety-decay` (5.00 s): “PASYVIOJI SAUGA” · “Bet šiluma nedingsta” · “DALIJIMASIS” · “≈ 0” · “ŠILUMA” · “≠ 0”
  - `27-safety-ics` (9.20 s): “PASYVIOJI SAUGA” · “Pasyvusis aušinimas” · “be siurblių, be išorinės elektros” · “šiluma – į baseiną”
  - `28-safety-days` (8.30 s): “PASYVIOJI SAUGA” · “Pasyvusis aušinimas” · “be siurblių, be išorinės elektros” · “7 paros” · “*Be operatorių veiksmų; tam pakanka 2 iš 3 kontūrų (GE Vernova Hitachi, GD Rev. J §3.3)”
  - Contrast: on `scram` the chapter label “PASYVIOJI SAUGA” measures 2.88:1 against the light vessel wall. On `days` the note starts with “*”, but the counter shows “7 paros” without one.

### 11. Iššūkiai (`limits`)

- **Stable screenshot:** `chapter-11.png`, from the `limits/limits` beat at 7.30 s after its press (video 4:18.4). The only beat.
- **Beats:** 1 (limits).
- **Enter:** The camera widens over the opened plant (4.2 s). The three words fade in one after another: 2.0–2.9 s, 3.2–4.1 s and 4.4–5.3 s.
- **Exit:** On the next press the words fade out. Chapter 12's 10 s reverse journey starts at once.
- **Ambient loop:** yes. The passive loop at reduced intensity (0.6) and camera breathing.
- **One-shot:** yes. The three words, staggered.
- **Dominant visual subject:** A wide view of the opened plant (as in ch10) with three uppercase words placed around it.
- **Primary frame metrics:** 75 % empty/dark (flat dark blocks), 78 % dark pixels, mean luma 18/255; text covers 1.6 % of the frame (4 text elements, sizes 14, 26 px). Lowest text contrast 8.64:1 (“IŠŠŪKIAI”, 14 px on #0b0c0e).
- **Mostly text:** yes. The three claims are words only; the plant view behind them was already seen in chapter 10.
- **Placeholder / TODO visible to the audience:** none.
- **Low fps (1920×1080, real time):** 60.1 avg, lowest beat 60.1 (`limits/limits`), worst frame 17.3 ms. In the earlier run with GPU sharing: 50.3 avg, lowest 50.3.
- **Visible on-screen text (exact, as rendered; per beat):**
  - `29-limits-limits` (7.30 s): “IŠŠŪKIAI” · “ATLIEKOS” · “LICENCIJAVIMAS” · “PIRMŲJŲ PROJEKTŲ RIZIKA”

### 12. Klausimai (`close`)

- **Stable screenshot:** `chapter-12.png`, from the `close/qa` beat at 4.60 s after its press (video 4:39.0). Holds indefinitely for Q&A, the longest on screen of all.
- **Beats:** 2 (return · qa; no chapter label on screen).
- **Enter:** return: the camera goes masterSafetyRise 3.0 s → stage3Approach 6.5 s → the hook pose 10.0 s while the layers close (vessel 0.4–2.0 s, pools 3.0–3.1 s, containment 2.4–4.2 s, shaft 3.4–5.4 s, ground 4.8–7.0 s). The site brightens at 5.0–7.6 s, hall lights at 7.5–8.7 s, grid at 7.6–8.4 s, city at 8.0–9.5 s. Inside the chapter, qa takes 2.6 s with no camera move: title 0.3–1.3 s, presenters 1.0–2.0 s, QR 1.6–2.6 s.
- **Exit:** None. A further press does nothing (no wrap to the start).
- **Ambient loop:** yes. The same as the opening: camera breathing, grid pulses, lit hall.
- **One-shot:** yes. The reverse journey and the staggered fade-in of title, presenters and QR.
- **Dominant visual subject:** The opening composition again: the plant in 3/4 view, title top-left, presenters bottom-left, QR bottom-right.
- **Primary frame metrics:** 72 % empty/dark (flat dark blocks), 31 % dark pixels, mean luma 35/255; text covers 4.3 % of the frame (9 text elements, sizes 15, 17, 21, 24, 25.9, 44 px). Lowest text contrast 5.47:1 (“VIRGILIJUS_EMAIL_TODO”, 17 px on #1c1d1d).
- **Mostly text:** yes. A closing card: thesis, “Jūsų klausimai”, names, e-mails and QR over the already-seen plant view.
- **Placeholder / TODO visible to the audience:** yes. The same as chapter 1 (`VIRGILIJUS_EMAIL_TODO`, QR placeholder, silhouettes). The closing line is itself a placeholder for the final wording (not marked on screen).
- **Low fps (1920×1080, real time):** 60.1 avg, lowest beat 60.1 (`close/return`), worst frame 17.2 ms. In the earlier run with GPU sharing: 52.6 avg, lowest 51.3.
- **Visible on-screen text (exact, as rendered; per beat):**
  - `30-close-return` (12.00 s): (no text)
  - `31-close-qa` (4.60 s): “Ta pati fizika. Kitas mastelis.” · “Jūsų klausimai” · “Virgilijus Kiltinavičius” · “VIRGILIJUS_EMAIL_TODO” · “Timofej Gaivoronskij” · “timofej.gaivoronskij@stud.vilniustech.lt” · “QR” · “Interaktyvus modelis” · “QR kodas bus čia”

## 6. Frame metrics (every still)

| Still | Video at | dark % | empty/dark % | mean luma | text area % | items | sizes px |
|---|---|---|---|---|---|---|---|
| 00-hook-hero | 0:09.9 | 30.4 | 71.8 | 35.5 | 3.4 | 9 | 15.0, 17.0, 21.0, 24.0, 25.9, 68.0 |
| 01-lithuania-renewables | 0:19.7 | 22.6 | 68.8 | 47.9 | 3.0 | 4 | 14.0, 15.0, 23.0, 96.0 |
| 02-lithuania-calm | 0:27.3 | 19.8 | 66.6 | 49.4 | 2.0 | 4 | 14.0, 21.0, 23.0, 44.0 |
| 03-lithuania-assessment | 0:32.4 | 24.1 | 63.6 | 52.8 | 2.3 | 4 | 14.0, 15.0, 23.0, 44.0 |
| 04-scale-large | 0:41.9 | 38.3 | 81.6 | 31.6 | 1.9 | 6 | 14.0, 15.0, 16.0, 52.0 |
| 05-scale-modules | 0:53.6 | 62.6 | 81.1 | 25.2 | 4.4 | 5 | 14.0, 15.0, 23.0, 31.7, 96.0 |
| 06-facts-power | 0:59.7 | 25.9 | 73.5 | 37.1 | 1.7 | 4 | 14.0, 23.0, 40.0, 96.0 |
| 07-facts-pitches | 1:07.1 | 73.3 | 79.3 | 24.8 | 2.4 | 5 | 14.0, 15.0, 23.0, 40.0, 96.0 |
| 08-facts-months | 1:12.8 | 30.2 | 61.4 | 39.2 | 3.7 | 5 | 14.0, 15.0, 23.0, 40.0, 96.0 |
| 09-projects-world | 1:22.2 | 58.2 | 47.4 | 43.6 | 2.8 | 16 | 14.0, 15.0, 16.0, 21.0 |
| 10-projects-darlington | 1:29.6 | 37.3 | 31.2 | 71.8 | 1.5 | 8 | 14.0, 15.0, 16.0, 21.0 |
| 11-handoff-land | 1:36.5 | 25.7 | 74.8 | 36.8 | 0.0 | 0 |  |
| 12-handoff-descend | 1:56.2 | 0.0 | 20.4 | 75.3 | 0.0 | 0 |  |
| 13-fission-micro-a-before-absorption | 1:58.8 | 91.9 | 89.3 | 19.2 | 0.6 | 4 | 14.0, 15.0, 21.0 |
| 13-fission-micro-b-first-split | 2:01.0 | 87.4 | 84.6 | 21.7 | 0.6 | 3 | 14.0, 15.0, 21.0 |
| 13-fission-micro-c-chain-reaction | 2:03.1 | 77.9 | 82.4 | 25.6 | 1.0 | 4 | 14.0, 15.0, 21.0 |
| 13-fission-micro | 2:05.2 | 73.1 | 81.9 | 27.2 | 0.7 | 3 | 14.0, 15.0, 21.0 |
| 13-fission-micro-e-loop-seam | 2:08.4 | 99.9 | 99.4 | 10.2 | 0.3 | 2 | 14.0, 15.0 |
| 14-fission-inFuel | 2:15.0 | 0.0 | 18.3 | 80.3 | 0.2 | 1 | 14.0 |
| 15-control-blades | 2:22.3 | 0.4 | 7.8 | 83.2 | 0.7 | 4 | 14.0, 15.0, 16.0, 21.0 |
| 16-control-insert | 2:28.3 | 0.3 | 7.6 | 83.5 | 1.2 | 3 | 14.0, 15.0, 31.7 |
| 17-control-withdraw | 2:32.8 | 0.3 | 7.6 | 83.8 | 1.1 | 3 | 14.0, 15.0, 31.7 |
| 18-energy-boil | 2:38.5 | 8.6 | 27.8 | 55.5 | 0.3 | 2 | 14.0, 21.0 |
| 19-energy-steam | 2:47.7 | 9.7 | 30.9 | 57.5 | 0.5 | 3 | 14.0, 21.0 |
| 20-energy-turbine | 2:57.6 | 41.8 | 19.8 | 42.5 | 0.4 | 2 | 14.0, 21.0 |
| 21-energy-condenser | 3:08.9 | 17.7 | 33.6 | 45.1 | 0.8 | 3 | 14.0, 21.0 |
| 22-energy-grid | 3:21.4 | 78.2 | 84.3 | 21.8 | 3.0 | 5 | 14.0, 15.0, 21.0, 40.0, 96.0 |
| 23-safety-normal | 3:28.1 | 47.0 | 62.6 | 30.4 | 0.9 | 2 | 14.0, 44.0 |
| 24-safety-blackout | 3:39.4 | 74.0 | 68.7 | 21.3 | 1.5 | 2 | 14.0, 44.0 |
| 25-safety-scram | 3:46.6 | 0.4 | 7.7 | 82.5 | 1.6 | 2 | 14.0, 44.0 |
| 26-safety-decay | 3:52.1 | 30.5 | 53.4 | 38.2 | 2.1 | 6 | 14.0, 21.0, 44.0 |
| 27-safety-ics | 4:01.8 | 30.5 | 63.8 | 34.7 | 1.8 | 4 | 14.0, 21.0, 23.0, 44.0 |
| 28-safety-days | 4:10.6 | 35.2 | 63.0 | 33.9 | 5.2 | 5 | 14.0, 15.0, 23.0, 44.0, 96.0 |
| 29-limits-limits | 4:18.4 | 78.5 | 74.7 | 18.1 | 1.6 | 4 | 14.0, 26.0 |
| 30-close-return | 4:32.4 | 29.7 | 78.7 | 34.2 | 0.0 | 0 |  |
| 31-close-qa | 4:39.0 | 30.9 | 71.5 | 35.3 | 4.3 | 9 | 15.0, 17.0, 21.0, 24.0, 25.9, 44.0 |

- **Definitions:** see §1 (frame metrics).
- **Video at:** the time of this still inside the full walkthrough video.
- **Off-screen and partly visible text** is listed in §11 A.1–A.2, and low contrast in §11 A.3.

## 7. Projector sizes

| Window | State | Stage (px) | Canvas buffer | Smallest text | Text outside the stage | Overlapping text boxes |
|---|---|---|---|---|---|---|
| 1920x1080 | `hook/hero` | 1920×1080 at y 0 | 1920×1080 | 15.0 px (“Mažieji moduliniai reakt”) | none | none |
| 1920x1080 | `lithuania/renewables` | 1920×1080 at y 0 | 1920×1080 | 14.0 px (“Lietuva”) | none | none |
| 1920x1080 | `lithuania/calm` | 1920×1080 at y 0 | 1920×1080 | 14.0 px (“Lietuva”) | none | none |
| 1920x1080 | `lithuania/assessment` | 1920×1080 at y 0 | 1920×1080 | 14.0 px (“Lietuva”) | none | none |
| 1920x1080 | `facts/months` | 1920×1080 at y 0 | 1920×1080 | 14.0 px (“Trys faktai”) | none | none |
| 1920x1080 | `projects/world` | 1920×1080 at y 0 | 1920×1080 | 14.0 px (“Projektai”) | none | none |
| 1920x1080 | `projects/darlington` | 1920×1080 at y 0 | 1920×1080 | 14.0 px (“Projektai”) | none | none |
| 1920x1080 | `safety/days` | 1920×1080 at y 0 | 1920×1080 | 14.0 px (“Pasyvioji sauga”) | none | none |
| 1920x1080 | `close/qa` | 1920×1080 at y 0 | 1920×1080 | 15.0 px (“QR kodas bus čia”) | none | none |
| 1280x800 | `hook/hero` | 1280×720 at y 40 | 1280×720 | 12.0 px (“Mažieji moduliniai reakt”) | none | none |
| 1280x800 | `lithuania/renewables` | 1280×720 at y 40 | 1280×720 | 11.0 px (“Lietuva”) | none | none |
| 1280x800 | `lithuania/calm` | 1280×720 at y 40 | 1280×720 | 11.0 px (“Lietuva”) | none | none |
| 1280x800 | `lithuania/assessment` | 1280×720 at y 40 | 1280×720 | 11.0 px (“Lietuva”) | none | none |
| 1280x800 | `facts/months` | 1280×720 at y 40 | 1280×720 | 11.0 px (“Trys faktai”) | none | none |
| 1280x800 | `projects/world` | 1280×720 at y 40 | 1280×720 | 11.0 px (“Projektai”) | none | none |
| 1280x800 | `projects/darlington` | 1280×720 at y 40 | 1280×720 | 11.0 px (“Projektai”) | none | none |
| 1280x800 | `safety/days` | 1280×720 at y 40 | 1280×720 | 11.0 px (“Pasyvioji sauga”) | none | none |
| 1280x800 | `close/qa` | 1280×720 at y 40 | 1280×720 | 12.0 px (“VIRGILIJUS_EMAIL_TODO”) | none | none |
| 1024x768 | `hook/hero` | 1024×576 at y 96 | 1024×576 | 12.0 px (“Mažieji moduliniai reakt”) | none | none |
| 1024x768 | `lithuania/renewables` | 1024×576 at y 96 | 1024×576 | 11.0 px (“Lietuva”) | none | none |
| 1024x768 | `lithuania/calm` | 1024×576 at y 96 | 1024×576 | 11.0 px (“Lietuva”) | none | none |
| 1024x768 | `lithuania/assessment` | 1024×576 at y 96 | 1024×576 | 11.0 px (“Lietuva”) | none | none |
| 1024x768 | `facts/months` | 1024×576 at y 96 | 1024×576 | 11.0 px (“Trys faktai”) | none | none |
| 1024x768 | `projects/world` | 1024×576 at y 96 | 1024×576 | 11.0 px (“Projektai”) | none | none |
| 1024x768 | `projects/darlington` | 1024×576 at y 96 | 1024×576 | 11.0 px (“Projektai”) | none | none |
| 1024x768 | `safety/days` | 1024×576 at y 96 | 1024×576 | 11.0 px (“Pasyvioji sauga”) | none | none |
| 1024x768 | `close/qa` | 1024×576 at y 96 | 1024×576 | 12.0 px (“VIRGILIJUS_EMAIL_TODO”) | none | none |

- **Text clipping and overlap:** none at any size. No text box leaves the stage, and no two text
  boxes overlap.
- **Composition:** the same at every size, because sizes are stage-relative; only the letterbox
  bars change.
- **Small print floors:**
  - At 1280×800 (stage 1280×720) and 1024×768 (stage 1024×576), small print sits at its pixel floors.
  - The chapter label (rendered uppercase) drops to 11 px; qualifiers, kicker and the TODO e-mail to
    12 px.
  - At 1080p the smallest text is 14 px (the chapter label).
- **Legend markers:** at 1024×768 the outlined legend markers (licensing, assessing) hit their
  10 px minimum with a 3 px border, so they read almost as solid dots
  (`projector-1024x768/05-projects-world-1024x768.png`).
- **Canvas pixel ratio:** 1:1 at every size (DPR 1).
- **Frames:** `projector-1920x1080/`, `projector-1280x800/`, `projector-1024x768/`, nine states
  each:
  - the opening;
  - Lithuania ×3;
  - facts / months;
  - world map;
  - Darlington;
  - safety / days;
  - the closing.

## 8. Performance (Low, 1920×1080, real time)

**Method**
- Real `ArrowRight` presses, each beat sampled from its press until 1.5 s after it settles.
- Machine: Intel Iris Plus (ANGLE D3D11), Chrome 155 headless, on AC power, Balanced plan.
- Same machine as the earlier passes.

**Run 2, used in this audit, uncontended**
- `capture-validation/fps-low-1080p-run2.json`.
- A per-process GPU sampler ran alongside it (`gpu-usage-run2.csv`):
  - the measured Chrome used up to 89 % of the 3D engine;
  - the next-highest process was Firefox, at ≤ 6.4 % (mean 3.6 %).

| Chapter | frames | avg fps (time-weighted) | lowest beat avg | worst frame ms | frames > 20 ms | frames > 34 ms |
|---|---|---|---|---|---|---|
| hook | 488 | 58.0 | 58 (hero) | 282.5 | 2 | 2 |
| lithuania | 993 | 60.0 | 59.9 (calm) | 33.3 | 1 | 0 |
| scale | 1065 | 60.1 | 60.1 (large) | 17.4 | 0 | 0 |
| facts | 884 | 60.1 | 60.1 (power) | 17.3 | 0 | 0 |
| projects | 800 | 60.1 | 60.1 (world) | 17.4 | 0 | 0 |
| handoff | 1386 | 60.0 | 59.9 (descend) | 33.4 | 4 | 0 |
| fission | 403 | 60.1 | 60.1 (micro) | 17 | 0 | 0 |
| control | 801 | 60.1 | 60.1 (blades) | 17.3 | 0 | 0 |
| energy | 2532 | 60.1 | 60.1 (boil) | 17.4 | 0 | 0 |
| safety | 2507 | 60.1 | 60.1 (normal) | 17.6 | 0 | 0 |
| limits | 409 | 60.1 | 60.1 (limits) | 17.3 | 0 | 0 |
| close | 938 | 60.1 | 60.1 (return) | 17.2 | 0 | 0 |

**Run 1, GPU shared with another application**
- `capture-validation/fps-low-1080p-run1-gpu-shared.json`.
- It ran before the captures. Right after it, another application (Firefox, the user's browser,
  untouched) was measured using 62 % of the GPU's 3D engine.
- Its drops (safety 44 fps avg, decay 28 fps) are GPU contention: they did not reproduce in run 2.
- It is kept as a data point for "what happens when something else uses the GPU during the talk".

| Chapter | frames | avg fps (time-weighted) | lowest beat avg | worst frame ms | frames > 20 ms | frames > 34 ms |
|---|---|---|---|---|---|---|
| hook | 488 | 57.9 | 57.9 (hero) | 282.8 | 2 | 2 |
| lithuania | 934 | 56.6 | 56 (calm) | 49.9 | 54 | 7 |
| scale | 1051 | 59.3 | 58.5 (large) | 33.5 | 14 | 0 |
| facts | 884 | 60.1 | 60.1 (power) | 17.2 | 0 | 0 |
| projects | 801 | 60.1 | 60.1 (world) | 17.4 | 0 | 0 |
| handoff | 1383 | 59.9 | 59.8 (descend) | 33.2 | 6 | 0 |
| fission | 403 | 60.1 | 60.1 (micro) | 17.2 | 0 | 0 |
| control | 735 | 55.2 | 45.6 (withdraw) | 49.9 | 62 | 3 |
| energy | 2373 | 56.3 | 55.1 (condenser) | 66.7 | 157 | 3 |
| safety | 1836 | 44.0 | 28.1 (decay) | 116.5 | 477 | 135 |
| limits | 342 | 50.3 | 50.3 (limits) | 132.7 | 42 | 12 |
| close | 821 | 52.6 | 51.3 (return) | 99.8 | 90 | 16 |

**Reading**
- On an otherwise idle machine, Low holds about 60 fps on every chapter.
- The exception is **one ~283 ms frame in the opening beat, present in both runs**. It is the only
  stall above 34 ms, and the earlier validation never sampled the opening beat.
- Otherwise there are isolated single 33 ms frames: one in `lithuania/calm` and four above 20 ms in
  the descent.
- Heaviest scenes on Low:
  - safety overview: 119 draw calls, 126 k triangles;
  - grid: 117 draw calls, 113 k triangles;
  - condenser: 110 draw calls, 104 k triangles.

## 9. Design-token snapshot (current values, not normalized)

Sources: `src/presentation/design.ts` (tokens → CSS variables), `src/presentation/ui/talk.css`,
`src/ui/styles.css`, `src/config/render.ts`, `src/config/flow.ts`, `src/config/safety.ts`,
`src/config/fission.ts`, `src/presentation/scene/*.tsx`. "Rendered" values are what Chrome computed
in the 1920×1080 captures (`getComputedStyle`, and `CSS.getPlatformFontsForNode` for the face).

### Typography

**Font-family stack (overlay):** `"Segoe UI Variable Display", "Segoe UI Variable Text", "Segoe UI",
system-ui, -apple-system, Roboto, "Helvetica Neue", Arial, sans-serif`. Placeholders (TODO e-mail,
QR box, QR text) use `--mono`: `ui-monospace, 'Cascadia Mono', Consolas, 'Courier New', monospace`.
System fonts only, so the result depends on the presenting machine.

**Rendered on the capture machine (Windows 11):**
- Segoe UI Variable (Display optical size), in the faces Light, Regular and Semibold.
- Cascadia Mono for the placeholders.

**Weights in use:**

| CSS weight | Used for | Rendered face |
|---|---|---|
| 200 | metric values ("50 %", "~300", "≈ 2", "24–36", "5 × 300 MW", "≈ 300 000"), the day counter | Light. Segoe UI Variable has no 200, so it renders as 300. |
| 300 | hero title, headline captions, closing title and its sub, metric units, value labels ("~1 500 MW"), meter values | Light |
| 400 | supporting lines, notes, e-mails, the small caption, legend | Regular |
| 500 | tag labels, speaker names, QR label, fission micro labels | Chrome reports the Semibold instance (there is no 500 named instance) |
| 600 | kicker, chapter label, limit words, value-label subs | Semibold |

**Sizes**: 1080p px from `TYPE`, stage-relative (`cqh`); in brackets, the pixel floor on small
projectors (`TYPE_FLOOR`).

| Role | Size | Weight | Line-height | Letter-spacing | Case |
|---|---|---|---|---|---|
| Hero title ("BWRX-300") | 68 | 300 | 1.04 | −0.005em (−0.34 px) | as written |
| Chapter headline / caption (`talk-caption`, closing title "large") | 44 | 300 | 1.14 | normal | as written |
| Closing sub ("Jūsų klausimai") | 44 | 300 | normal | normal | as written, accent colour |
| Small caption (control states, scale assembly) | 31.7 (44 × 0.72) | 400 | 1.14 | normal | as written |
| Metric value | 96 | 200 → Light | 1.0 | −0.02em (−1.92 px) | as written |
| Metric unit ("MW", "futbolo aikštės", "mėn.*", "namų ūkių*") | 40 | 300 | 1.0 | 0 | as written, accent colour |
| Value label ("~1 500 MW", "~300 MW") | 52 | 300 | 1.0 | normal | as written |
| Value-label sub ("DIDELIS BLOKAS") | 16 [12] | 600 | normal | 0.16em | uppercase, accent |
| Supporting text (stat caption, caption sub) | 23 [14] | 400 | 1.38 (stat caption), normal (caption sub) | normal | as written |
| Kicker ("MAŽIEJI MODULINIAI REAKTORIAI") | 15 [12] | 600 | normal | 0.2em (3 px) | uppercase, accent |
| Chapter label (top left) | 14 [11] | 600 | normal | 0.18em (2.5 px) | uppercase, qualifier colour, 2.4em × 2 px accent rule |
| Qualifier / source note | 15 [12] | 400 | 1.4 | normal | as written |
| Tag label / sub (map pins, process labels) | 21 [13] / 16 [12] | 500 / 400 | normal | normal | as written |
| Limit words ("ATLIEKOS"…) | 26 [13] | 600 | normal | 0.2em (5.2 px) | uppercase in the copy |
| Meter name / value ("DALIJIMASIS" / "≈ 0") | 21 [13] / 44 | 400 / 300 | normal | 0.14em / normal | uppercase / as written |
| Day counter value / note | 96 / 15 [12] | 200 → Light / 400 | 1.0 / 1.4 | normal | as written |
| Speaker name / e-mail | 24 [13] / 17 [12] | 500 / 400 (mono for the TODO) | normal | normal | as written |
| QR label / QR text | 21 [13] / 15 [12] (mono) | 500 / 400 | normal | normal | as written |
| Legend rows | 16 [12] | 400 | normal | normal | as written |
| Fission micro labels | 21 [13] | 500 | normal | normal | as written, text-shadow |

- **Numerals:** `font-variant-numeric: tabular-nums` on the whole overlay.
- **Balanced wrapping:** `text-wrap: balance` on titles, captions and stat captions; `pretty` on
  notes.
- **Gutter:** 4.8cqw, which is 92 px at 1920.
- **Vertical positions:**
  - top-left items at 9.4cqh (102 px);
  - the chapter label at 4.4cqh (48 px);
  - notes at bottom 4.6cqh (50 px);
  - bottom-left captions at bottom 12.5cqh (135 px).

### Colour

| Role | Value(s) |
|---|---|
| Page / stage background | `#0b0c0e` (body, `.stage`, scene `PALETTE.background`); letterbox bars `#000` (`.app`); the dip `#050607` |
| Primary text | `#f2f4f6` |
| Secondary text | `#c5cacf` (text-2) |
| Qualifier / small print | `#a7adb3`; muted `#9aa1a8` |
| Warm accent | `#e8a33d` (kicker, units, value-label subs, closing sub, rules, label dots, counter bar, alert rule, pins). TODO e-mail `rgba(232,163,61,0.8)`; meter "≠ 0" `#eab27a`; label-dot halo `rgba(232,163,61,0.22)` |
| Cool / water accent | `#5c9cc3` (water, condensate, feedwater); `#86b6d3` (condenser condensate); `#6aa6c9` (droplets); `#b4ccd9` (ICS condensing); pool water `#2f5a73` (emissive `#16303f`) |
| Steam / electricity | steam `#e8edf0` / `#eef2f4`; electricity pulses `#f4ead6`; imports on the LT map `#cfd8df` |
| Warm heat (scene) | decay-heat tint `#c98a5f`; pool plume `#d9ad88`; fission heat `#d9925b`, energy `#f0c9a0`; control glints `#fff3dc` |
| Panel / card | `rgba(10,12,15,0.78)` (tag labels, legend; radius 0 6 6 0 / 10 px); QR box `rgba(10,12,15,0.55)` with a 2 px dashed border `rgba(233,236,239,0.4)`, radius 10 px |
| Borders / dividers | tag label left rule 2 px `#e8a33d`; alert caption left rule 3 px `#e8a33d`; chapter-label rule 2 px `#e8a33d`; counter track 3 px `rgba(233,236,239,0.18)` |
| Status colours (pins) | under construction: solid `#e8a33d` with a 3 px halo; licensing: 3 px `#e8a33d` ring; planned: solid `#9aa1a8`; assessing: 3 px `#9aa1a8` ring. The alert tone is an accent rule, with no red anywhere |
| Maps | LT country `#4c535b` (emissive accent on highlight); neighbours `#23282d`; LT sea `#121a22`; world land `#3a3f45` → lit `#565d65`; lakes `#13202b`; ocean `#111a23`; wind turbines `#d6dade`; solar `#1f3346` (emissive `#bcd2e2`); city glows `#ffd9a8` |
| Plant / site | ground `#2c2f32`; concrete `#74777a`; steel `#a3a8ad`; painted equipment `#4a5866`; comparison massing `#8b8f93`; pitch turf `#25302a`, lines `#eef1f3`; city façades `#20252b`, windows `#ffd9a8` / `#dfe8f0` |
| Fission view | backdrop `#0e1114` → centre `#171b20`; protons `#b9ae9f`; neutrons `#8f9ba4`; free neutron `#cfdbe3` |
| Presenter placeholders | gradient `#59616b` → `#363c43` → `#22262b`; rim `rgba(232,163,61,0.35)` |
| Fog | linear, near 300 m / far 820 m at rest (pushed to 650/1250 m on Scale, 900/1500 m on the grid beat) |

### Motion

| Element | Current value |
|---|---|
| Chapter transition (camera) | Per beat, in `chapters.ts`. Camera keys at 2.6–4.4 s for most beats. The plant ↔ map moves are one continuous zoom: plant scale `p.zoom` over 3.0–3.2 s, `power2.inOut`; map reveal 2.8–3.0 s, `sine.inOut`. Longest: the descent (15.7 s, the frozen Stage 3 film segment) and the grid / return beats (9–10 s). Only the opening uses a dip: 0.42 s out, 0.65 s in, smootherstep |
| Camera path | Multi-key monotone cubic (PCHIP) per channel, orbiting the target. It starts and ends at rest with continuous velocity through intermediate keys, and no roll |
| Camera hold | Breathing on every hold: azimuth ±1.6° × drift (0–1 per beat), polar ±0.45°, radius ±1.2 %, periods 41 s / 29 s, 4 s ramp-in |
| Back / jump / reset | Settle move: camera 1.6 s, reveal 1.2 s, world 1.0 s; input lock 0.45 s. A dip instead when the look-at point moves more than 600 m |
| Text reveal | CSS `talk-in`: 450 ms, `cubic-bezier(0.22, 0.8, 0.3, 1)`, opacity 0 → 1 plus a 12 px rise. Out: `talk-out` 350 ms `ease`, opacity only; removed at 400 ms. Cue-driven items: opacity = min(1, 1.5 × cue), linear over the cue (0.5–1.2 s) |
| Metric reveal | The stat fades in on a 0.5 s cue, then counts up once over 1.6–1.8 s with ease-out cubic ("50 %" 1.8 s, "~300" 1.6 s, "≈ 300 000" 1.6 s). "≈ 2", "24–36" and "5 × 300 MW" enter as plain text (450 ms) |
| Map / pin reveal | Radial reveal from the plant: `m.lt` / `m.world` 3.0 s `sine.inOut`. Pins: one cue over 3.2 s. Pin labels: 0.6 s each, staggered 0.6 s (3.9 → 6.3 s). Legend 0.6 s |
| Representative object | Control-blade insertion `c.amount` 1.8 s `sine.inOut` after 0.2 s. Plant shrink to a map point `p.zoom` 10⁰ → 10⁻²·⁶ in 3.0 s `power2.inOut`. Turbine wind-down `f.shaft` 7 s (an integrated angle) |
| Defaults | World channels ease `sine.inOut` with per-channel defaults (`world.ts`, 0–5.5 s). Reveal default 1.6 s; look 1.2 s |
| Input lock after a forward press | 1.0–5.0 s per beat (the "Lock" column in §4) |

## 10. Validation (capture-only scope)

| Check | Result |
|---|---|
| `npm run check` (typecheck, lint, production build) | PASS (exit 0). Main chunk 1,103.42 kB, the same as the previous pass |
| Served build identity | `vite preview` (port 4420) serves `index-CvfCB61Z.js` / `index-Cs6zyIrg.css`, the same as `dist/` |
| Clean LT presentation mode, 1920×1080 Low | `lang=lt`. Quality button "Žema" (Low) pressed. Every still: Explore UI, setup bar, diagnostics and talk debug all absent or hidden |
| Chapter navigation forward / backward, direct jumps, R, Esc, Home | **19/19 PASS** (`capture-validation/navigation-low-1080p.json`). LT is the default language; Right arrow enters the talk at the first beat; No Explore UI, setup bar or debug UI while presenting; The talk owns the camera (cinematic authority, Explore suspended); A second press inside the transition lock is ignored; Right arrow walks first -> last; The closing composition holds (no wrap to the start); Left arrow walks last -> first; Random jumps land on their beats; R re-establishes the current beat (dip, same beat); Esc hands the camera to Explore; Explore UI comes back after Esc; Right arrow re-enters where the talk was left; Home returns to the first beat. |
| Every beat reachable by real presses | 32/32 in the full walkthrough, the transitions walk and the FPS walks (each press landed on the expected beat; the run aborts otherwise) |
| Projector sizes | 1920×1080, 1280×800, 1024×768: §7 |
| CSS-animation driver sanity | Incoming caption: opacity 0 → 1 over 450 ms in 33 ms steps. Outgoing stat: 350 ms fade, removed at 400 ms (`shimtest.mjs`) |
| Console / page errors | Page errors: none. Console warnings/errors: `[warn] THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.`. That one warning is the three.js / R3F `THREE.Clock` deprecation, already present before this pass. Nothing new. |
| External requests | none in any run |

## 11. OBSERVATIONS (recorded, not fixed)

These are the capturer's notes for the external reviewer, ordered from "the audience sees something
wrong" to matters of taste. None of them was changed in this pass. Frame references are files in this
folder.

### A. Visible defects and measured problems

1. **Two labels are laid out off-screen and never seen.**
   - **"Tai vyksta kure"** (ch7 `inFuel`, `chapter-07-06-in-fuel.png`):
     - Laid out at y = 1269–1304 px, below the 1080 px stage. The stage is always 16:9 and the
       camera fixed, so this is the same at every projector size.
     - Cause: it anchors to `FUEL_SPOT` (vessel bottom + 2.4 m, `chapters.ts`), while the warm spot
       it names is drawn at `FISSION_ANCHOR` (mid active core, `scene/fission/buildInset.ts`).
     - The beat therefore shows no text at all.
     - Reproduced in real time without the capture harness: y 1269.1 real time vs 1269.2 stepped.
   - **"vanduo kyla"** (ch9 `boil`, `chapter-09-01-natural-circulation.png`):
     - Laid out at y = 1107 px, just below the stage. Only "verda" is visible.
2. **"separatoriai" is cut by the bottom edge** (ch9 `steam`, `chapter-09-01b-steam-separators-dryer.png`).
3. **Low-contrast small print**: WCAG ratio of the text colour against the pixels actually behind it.
   - Chapter label "PROJEKTAI": 2.17:1 on Darlington's light-grey land.
   - Source note "CNSC statybos licencija – 2025 m. balandžio 4 d.": 2.55:1 on Darlington's land
     (`beats/10-projects-darlington.png`).
   - Chapter label "PASYVIOJI SAUGA": 2.88:1 on the scram view's light vessel wall (`chapter-10-02b-scram.png`).
   - Chapter label "VALDYMAS": about 3.7:1, and the note "Iliustracinis judesys" 4.15:1, on all
     three control beats (`chapter-08-*`).
   - All other measured text is at or above 5.06:1.
   - The pattern: the 14–15 px `#a7adb3` small print is tuned for dark backgrounds and has no panel
     or shadow, so it fails wherever the scene behind it is light.
4. **Orphan footnote marker** (ch10 `days`, `chapter-10-05-seven-days.png`):
   - The note starts with "*", but the counter shows "7 paros" without an asterisk. The copy key
     `safety.days` ("7 paros*") is unused.
5. **Site-ground speckle.**
   - Single-pixel amber/grey dots along arcs on the ground.
   - Most visible in the steep pitches view (`beats/07-facts-pitches.png`, upper half), and around the
     plant in `chapter-03.png` and `chapter-01.png`.
   - Already known from the previous pass (the shared `site-ground` surface).
6. **Subjects and text cut by the frame edge.**
   - The BWRX-300 against the right edge in `beats/04-scale-large.png`.
   - The city off the right edge in `chapter-09.png`.
   - Fragments and neutrons off the bottom and right in `chapter-07-03/04`.
   - The transformer line in the safety overview.
7. **Text set directly over busy or structured scene areas, with no panel.**
   - "5 × 300 MW" and its caption over the dithered X-ray ghost of the large unit (`chapter-03.png`).
   - "~300 MW" and "24–36 mėn.*" over the annex building and site slab (`beats/06-…`, `chapter-04.png`).
   - "grandininė reakcija" on top of a fission fragment (`chapter-07.png`).
   - The scram caption running from a dark wall onto a light one.
8. **The requested metric weight does not exist.** Metrics ask for weight 200. Segoe UI Variable
   has no 200, so they render at 300 (Light), the same as the titles.

### B. Placeholders visible to the audience

- `VIRGILIJUS_EMAIL_TODO`, in amber monospace (ch1, ch12).
- The dashed QR box with "QR" and "QR kodas bus čia", in monospace (ch1, ch12).
- Grey neutral silhouettes standing in for the presenters (ch1, ch12). They take about 31 % of the
  frame height in the opening and the closing; the closing holds through Q&A.
- The closing line "Ta pati fizika. Kitas mastelis." is a wording placeholder, not marked on screen.

### C. Composition and continuity (factual notes from the frames)

- **One exterior view, many times.** The same plant exterior composition (centred plant on its
  slab, dark top band) is the main frame of ch1, ch4 power / months, ch6 land and ch12.
  `chapter-01.png`, `beats/06-facts-power.png`, `beats/08-facts-months.png`, `chapter-06.png` and
  `chapter-12.png` are near-identical crops of each other.
- **Empty/dark share is high outside the interiors.**
  - Flat, dark, detail-free blocks cover:
    - 72 % of the opening and closing frames;
    - 75 % of the handoff;
    - 81 % of scale;
    - 82 % of the fission loop (99 % at its seam);
    - 84 % of the grid frame;
    - 75 % of limits.
  - The interiors are the opposite: control 8 %, descend 20 %, inFuel 18 %.
  - These two families also differ sharply in brightness (mean luma about 20–35 vs 75–84).
- **Titles, captions, stats and notes all sit in the left gutter** (92 px). Only the safety
  meters / counter, the QR and the legend use the right side; labels are anchored in the scene.
  The scene subject is centred or right, so in several frames the left third holds only text over
  empty background: hook, Lithuania, scale, facts, grid.
- **The handoff `land` frame is completely static** (drift 0, no text). It is the only hold in the
  talk with nothing moving.
- **The safety-to-limits continuity carries the emergency look into limits.** After the blackout the
  site stays dimmed and unlit through scram, decay, ICS, days and limits. The limits words therefore
  sit on one of the darkest frames of the talk (mean luma 18; only the fission loop seam, 10, is
  darker). Only the closing return re-lights the plant.
- **Interior vs exterior lighting.** Right after the blackout (exterior dark), the scram interior
  view is as bright as during normal operation.
- **The fission loop seam** (`chapter-07-05-loop-seam.png`):
  - Each 11 s loop ends in about 0.8 s of an almost black frame, with only the chapter label and
    "Schema, ne mastelis".
  - During a 30 s explanation the audience sees it two or three times.
- **Label systems.** Four different label treatments are in use:
  - tag: dark panel, amber left rule and dot;
  - value: 52 px Light with an amber caps sub;
  - word: 26 px Semibold caps with tracking and a shadow;
  - micro: 21 px with a shadow, no panel, no leader.
  - Micro labels float up to about 130 px from what they name, with no dot or line.
- **Captions and indicators in opposite corners.** The safety beats put the caption top-left and the
  meters or counter top-right (`chapter-10-03`, `chapter-10-05`), about 1,400–1,500 px apart.
- **Pitches beside, not around, the block.** The two pitches lie beside the site slab, while the
  caption says the block fits within them ("jose telpa").
- **Darlington pin styles.**
  - Clinch River is coded `licensing` (amber ring, `mapLayout.ts`), while its label says
    "leidimas statyti, 2026 m.". The legend has no permit category.
  - The three European tags cluster in the top-right corner of the world map, where the Poland ring
    touches the "Lietuva" tag.

### D. Typography and colour (taste, for the reviewer)

- One sans family for everything (Segoe UI Variable, Display optical size).
- At least 15 distinct sizes are in use at 1080p: 96, 68, 52, 44, 40, 31.7, 26, 25.9, 24, 23, 21, 17,
  16, 15, 14 px.
- Very light weights (300) carry the largest type: titles, headlines, metrics, the counter.
- The smallest print is 14–15 px in a mid-grey (`#a7adb3`).
- The warm accent `#e8a33d` is the only colour in the overlay, and it does many jobs:
  - kicker, chapter rule, metric units, value subs and closing sub;
  - tag rules and dots, pins, the counter bar, the alert rule;
  - the TODO e-mail.
- The 3D scene is mostly flat-shaded greys and navy with little texture. Saturated colour appears only
  in the copper blades, the blue water and condensers, the brown heat glows and the turbine-hall
  glazing.
- The X-ray ghosts (turbine hall, large unit) are drawn with a screen-door dither, visible as a fine
  dot pattern at 1080p (`chapter-09-02`, `chapter-09-03`, `chapter-03.png`).

### E. Motion, transitions and pacing

All of these are visible in `presentation-v1-transitions-1080p.mp4` (timestamps in §4) and in
`transitions-filmstrips/`.

1. **One continuous world, no cuts.**
   - Only the very first press dips to black, from the pre-talk view.
   - Every other change is a continuous camera move or an in-place change; both videos are single
     takes with no edits.
   - Consecutive chapters are joined by continuous camera moves.
2. **Text arrives at the press, before the picture it describes.**
   - Uncued captions and stats enter within 450 ms of the press, while the camera and scene take
     3–10 s.
   - "≈ 2 futbolo aikštės" is on screen about 1.2 s before the pitches start to draw.
   - "5 × 300 MW" sits over the still-opaque large unit until it ghosts (1.6 s), and the modules
     assemble behind the finished statement for 7 s.
   - "Lietuva vertina BWRX-300" and the safety captions appear before the camera arrives.
3. **Text crossfades in place.**
   - At nearly every press the outgoing text (0.35 s fade) and the incoming text (0.45 s
     rise-and-fade) occupy the same spot, so two texts are superimposed for about 0.3 s.
   - Examples: "50 %" over "O kai nėra vėjo ir saulės?"; "~300 MW" over "≈ 2"; "≈ 300 000" over
     "Įprastas darbas".
4. **"~0 MW" is shown.** The power stat appears at once, reading "~0 MW", and only starts counting
   at 1.4 s (`facts/power`, transitions video ≈ 0:18).
5. **The large unit un-ghosts while it leaves.** In `facts/power` the ghosted ~1 500 MW unit turns
   solid again (1.4 s) while it sinks away (2.0 s), right behind the new stat.
6. **A map pin outlives the map.** In `handoff/land` the Clinch River pin is still drawn, large, in
   front of the regrown plant for about 1 s (≈ 2.3–3.2 s after the press, transitions video
   ≈ 0:29.6). The plant is back before the map has closed.
7. **The plant on a plinth.** Mid-zoom in the plant ↔ map moves (1→2, 2→3, 4→5), the plant stands
   on a dark rectangular block with brown sides (its site block) floating over the black floor.
   This lasts about 1 s each time.
8. **Camera fly-throughs.**
   - `safety/scram` (≈ 1–2.5 s) and `close/return` (≈ 2–4.5 s) take the camera through the
     containment interior, past walls and a pipe at very close range.
   - The turbine and condenser moves also pass close to structures.
9. **Long one-shots with little visible change.**
   - `blackout` settles in 7.3 s, but the visible change happens in its first ~1.5 s; the remaining
     6 s are a turbine wind-down that is hard to see at overview scale.
   - The other long beats: the descent (15.7 s), the grid move (10 s) and the return (10 s).
10. **Choreography share of the talk.**
    - The 32 presses carry 171.9 s of choreography: the time from each press until everything has
      settled.
    - Against the 7-minute target (420 s), the picture is still changing after a press for about
      41 % of the talk. Speech overlaps this time; it is not dead time.
    - The shortest settle is 1.8 s (`inFuel`), the longest 15.7 s (`descend`).
11. **Loops on the holds.**
    - The fission chain resets every 11 s through a near-black seam.
    - The Darlington ping repeats every 2.4 s.
    - Everything else on a hold is the camera's slow breathing, plus the flows and pulses in the
      energy / safety chapters.
    - `handoff/land` is fully static.
12. **First-press stall.** One frame of about 283 ms occurs in the opening beat on Low in both FPS
    runs. It is the only stall above 34 ms in the uncontended run. The earlier validation never
    sampled the opening beat.
