# Presentation v1: validation report

**Status:** FAST validation. **Stopped for owner review.** Not final; not approved.
- **Branch:** `presentation-v1`, WIP safety commits only: `c672112` (Stage 11 WIP), `bb0bd30`
  (v1 skeleton), and the WIP commit that adds this package. None is labelled approved, nothing is
  pushed.
- **Final build:** every result below was re-run on the final build of this pass.
- **Machine:** Intel Iris Plus (D3D11), Chrome, Windows 11. Low is the presentation reference.
- **Raw results:** `validation/`.

## Deliverables (this folder)

- `PRESENTATION-STORY.md`: the 12 chapters with speaker, timing, spoken idea, on-screen copy,
  beats, camera, ambient loop, sources and open issues.
- `VISUAL-POLISH-REPORT.md`: the design system, chapter audit, continuity, performance, projector
  sizes, the completeness table and the weakest three.
- `01-hook-1080p.png` … `12-close-1080p.png`: one still per chapter (Low, 1920×1080).
- `contact-sheet-chapters-1080p.png` (the 12 stills) and `contact-sheet-all-beats-1080p.png` (all
  32 beats).
- `presentation-v1-walkthrough-x2.5-1080p.mp4`: the whole talk driven by real "next" presses, at
  2.5× speed.
  - 85 s, 1080p30, H.264, 25 MB, Lithuanian, Low, no sound.
  - Each beat runs to its settled state plus a short hold. Live, every beat waits for the
    presenter.
  - Chapter start times: Hook 0:00, Lithuania 0:03, Scale 0:10, Facts 0:17, Projects 0:22,
    Handoff 0:27, Fission 0:36, Control 0:39, Energy 0:43, Safety 1:00, Limits 1:16, Closing 1:18.
- `compat/`:
  - contact sheets of every beat at 1024×768 and 1280×800;
  - three full-size frames at those sizes;
  - the English smoke-test frame.
- `validation/`: the JSON for every run below.

## Results

| Check | Result |
|---|---|
| `npm run check` (typecheck, lint, build) | PASS |
| Presenter walkthrough, Low, 1920×1080: real key presses through all 32 beats and back | **19/19 PASS** (`talkcheck-low.json`) |
| The same at High | **19/19 PASS** (`talkcheck-high.json`) |
| 48 s film regression: 14 seek frames, current build vs the pre-presentation build `c672112`, deterministic clock | WebGL **identical** at High and Low (b) |
| Portable package from `file://`, no server, no quality parameter | **10/10 PASS** (`portablecheck.json`) |
| Projector sizes: 1920×1080, 1280×800, 1024×768, every beat | PASS; see `compat/` and VISUAL-POLISH-REPORT §5 |
| External network requests (preview build and portable package) | **none** |
| Page errors | **none** |

**What the walkthrough checks covered:**
- Lithuanian is the default.
- → enters at the first beat, and a second press inside the transition lock is ignored.
- → walks first to last, and the closing composition holds with no wrap to the start.
- ← walks back to the first beat.
- Ten random direct jumps land on their beats.
- R re-establishes the current beat behind a dip.
- Esc hands the camera to Explore, and the Explore UI returns.
- → re-enters where the talk was left, and Home goes back to the opening.
- There is no Explore UI, setup bar or debug UI while presenting.
- The English switch shows English chapter labels (screenshot `compat/en-smoke-lithuania.png`).
- Starting the 48 s film ends the talk cleanly, and R in the film resets to Explore as before.

**(b) The 48 s film regression in detail:**
- Animation time was frozen and pinned before every seek, and the old build was compared with
  itself as a noise control.
- Every WebGL frame matches exactly, except t = 2 s, where the old build also differs from
  itself.
- The only HTML difference is the setup bar shown while the film is paused. It now has the new
  "Pradėti pristatymą" button. "Tęsti" was briefly demoted from primary styling, and that was
  fixed tonight.
- No legacy timing, camera key or shader changed (the fission shader still compiles
  byte-identical, as verified earlier).

**Portable package** (`npm run build:portable` → `dist-portable/BWRX300/BWRX300.html`, 1.66 MB):
- It opens in **Low** ("low (portable)") in Lithuanian.
- → starts the talk without debug tooling.
- Every beat is reachable, and the maps and the fission view render from the inlined data.
- The only requests are `file:`, `data:` and `blob:`.

## Performance (frames per second over each beat's settle and hold)

- **Low, 1920×1080:** 60 fps on every beat, p95 16.8 ms, worst single frame 17.6 ms. An earlier
  run, on the build before the last fixes, had one 49.9 ms frame on entering the turbine beat,
  most likely first-time shader compilation; it did not recur.
- **High, 1920×1080:** 60 fps outside. The interior close-ups dip:

  | Beats | fps |
  |---|---|
  | control | 43.4–49.3 |
  | safety scram / decay | 43.0–47.2 |
  | energy | 51.5–57.8 |
  | fission | 54.8–57.0 |

  The approved 48 s film shows the same at High on this machine: 41.6 fps for control and
  45.5–54 fps for flow and turbine (`film-high.json`). The talk adds no cost.
- **Heaviest new scenes (Low):**
  - safety overview: 119 draw calls, 126 k triangles
  - grid and city: 117 draw calls, 113 k triangles
  - condenser and water cycle: 110 draw calls, 104 k triangles

## WHAT STILL LOOKS WEAK

Ranked; the details and next steps are in VISUAL-POLISH-REPORT §7.

1. **Limits (chapter 11):** three words around a view of the plant we've already seen. It has no
   dedicated image.
2. **Scale (chapter 3):** the large unit is generic massing, the five-unit row reads small, and
   the large unit's ghost is faint.
3. **Grid and city (chapter 9, last beat):** now framed correctly, but the plant is small and dark
   at 920 m, and the city is generic.

Runner-up: the blackout (chapter 10) reads in motion but not in a still.

## For the owner to decide

**Placeholders, kept on purpose:**
- `VIRGILIJUS_EMAIL_TODO` and `PUBLIC_PRESENTATION_URL_TODO` (the QR). Nothing was guessed.
- The presenter figures are neutral placeholders; no likenesses.
- The closing line "Ta pati fizika. Kitas mastelis." stands in for the final wording.

**Lithuanian terminology to confirm:**

| On screen | Question |
|---|---|
| "valdymo mentės" | "Control blades" is literal; the established term is "valdymo strypai" (rods). The BWR's cruciform blades are physically blades. |
| "Daugiau įstumta → mažiau reakcijų" / "Mažiau įstumta → daugiau reakcijų" | "Įstumta" (pushed in) is physically right, since BWR blades are pushed up from below, but it's telegraphic. An alternative is "Mentės giliau → mažiau reakcijų". |
| "statyba: nuo pirmojo betono reaktoriaus pastate iki kuro įkrovimo" | Renders "first nuclear concrete … to fuel load". Confirm the established Lithuanian term. |
| "be išorinės elektros" | Paraphrases the GD's "no AC power". |

**Factual compromises, all shown with qualifiers:**
- **Construction time:** GE Vernova says 24–36 months. The newer GD Rev J says 30–36 months, and
  under 30 for a series unit. On screen: "24–36 mėn.*", with "*Gamintojo įvertis serijiniam
  blokui; be licencijavimo ir finansavimo".
- **Football pitches:** "≈ 2 pitches" follows the brief and the vendor's "fits within two". GD's
  9,800 m² power-block envelope is about 1.4 pitches, so the caption says "telpa" (fits within).
- **Clinch River:** a construction permit (NRC, 2026-09-29), not construction.
- **Pins:** Estonia and Lithuania pins mark countries, not sites.
- **Sweden:** left out, because Vattenfall chose another vendor.
- **Lithuania:** the memorandum of 2026-02-25 is an assessment, not a decision.
- **"≈ 300 000 namų ūkių":** a vendor figure, labelled as an illustration.
- **Passive cooling:** all three passive-cooling trains are drawn running, while the note says two
  are enough.
- **Steam lines:** one main steam line is drawn; the design has two.

## Not done, by instruction

- The final speech.
- Human likenesses.
- The final QR or public URL.
- Publishing (GitHub Pages).
- An exact Vilnius location.
- A detailed transformer.
- Deep shader optimization.
- Changes to the frozen 48 s timeline.
- A FULL regression run. The targeted 48 s frame comparison above replaces it for this pass.
