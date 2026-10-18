# Final presentation stage — report

**Status: FINAL FOR REHEARSAL** (software). Remaining work is listed in §11 and needs the physical lecture-room
PC / projector only.

| | |
|---|---|
| Final commit | the commit that adds this report on `presentation-v1`, fast-forwarded to `main` (no force push); hash and deployment in §12 |
| Pages workflow | `.github/workflows/deploy-pages.yml` on the push to `main`; run and live check in §12 |
| Live URL | https://tyomachka.github.io/bwrx-300-interactive-presentation/ (repository stays private) |
| Chapters / presses | **12 chapters = 12 presenter stops; 11 presses from the opening to the Q&A** (+1 to start from Explore) |
| Narration | `docs/final/FINAL_SPEECH_LT.md`: **701 words**, ~6:55 (25+30+40+40+35+25+40+25+50+50+25+30 s); Virgilijus 335 / Timofej 366 words (48 / 52 %) |
| Cue sheet | `docs/final/PRESENTER_CUES_LT.md` (one page: presenter, first phrase, duration, what the screen does, when to press, a skippable sentence) |
| Fact audit | `docs/final/FACT_AUDIT.md` (every visible figure / status, LT + EN wording, source, status) |
| Review package | `docs/final/review/` (§10) |
| Validation | Chrome headless, ANGLE D3D11, Intel Iris Plus, Low, LT unless stated; build `index-Dw5MTYLh.js` (identical in `dist/` and the served preview) |

## 1. Navigation: 19 stops → 12 chapter stops

One presenter stop per narrative chapter (old stops merged exactly as the brief's mapping: 2+3+4 → 2, 6+7+8 → 4,
13+14+15 → 9, 16+17 → 10). A press enters a chapter; its internal beats (`after`) play by themselves, timed to the
speech; the chapter then holds indefinitely with its processes alive (flow, steam, turbine, the passive loop, the
steady chain reaction). Guard against a double press: **1.2 s** (opening 1.5 s); after it a press goes straight to
the next chapter, which takes over from whatever is on screen. ← = previous chapter settled at its final state;
Home = opening; R = current chapter re-established at its final state; Esc = Explore (→ resumes). Debug panel:
`chapter k / 12`. Limitations → Q&A is **one press** (no intermediate exterior stop).

`validation/navigation.txt`: **50 / 50 checks** (12 chapters in order, each plays its beats by itself, 11 presses to
the Q&A, the closing holds, a press inside the guard ignored and an early press after it advancing — scale and
safety —, Limitations → Q&A one press, back 12 → 1 each settled, R, Home resets the counter, Esc and resume).

## 2. Cues synced to the final speech

Change → settle → the presenter speaks over a living hold → the next change (times from the press; full table in
the cue sheet): Lithuania 50 % at 4 s, local generation 73,3 % at 10 s, calm night 14 s, assessment 22.5 s ·
Scale 300 MW 7 s, ESBWR built 8–11 s, five units 17–25 s, vessels 27–30 s · Facts 300 MW 2.4 s, 9 800 m² 7–11 s,
24–36 months 25–29 s · Projects pins as named (4 / 7.5 / 11 / 13 / 15 s), Darlington 21.5 s · Handoff exterior hold,
descent 8 s (1.3×) to the core by ~19 s · Fission paced 0.3× at first (absorbed ~5 s, split ~7 s, heat 8–13 s,
2 fissions ~12 s, 3 ~17 s, steady from ~21 s, "controlled" 27 s) · Control blades 5.6 s, in 7.8 s, out 13.4 s ·
Energy natural circulation 7 s, separators 17 s, turbine 22.5 s, condenser 28.5 s, grid → city 35.5–42 s ·
Safety normal, power lost 4.4 s, shutdown 6 s, decay heat 11 s, passive loop 17 s, 0 h → 7 days 31–37 s ·
Limits 5 / 7 / 9.5 s · Closing thesis 5.3 s, "Jūsų klausimai" 22 s.

## 3. Factual changes (all sourced: `src/presentation/sources.ts`, `references/TECHNICAL_FACTS.md` FIN-01..11)

- **Lithuania 2025** (Litgrid annual balance, re-read 2026-10-18): "50 %" + "AEI gamyba 2025 m. sudarė 49,9 % bendro
  Lietuvos elektros poreikio" + "Vietos gamyba: 73,3 % poreikio". Denominator = demand (13,261 TWh), never
  consumption; 68,1 % not shown.
- **Scale:** ESBWR ≈ 1 535 MW net (NRC; 1 594 gross); vessels ⌀ 7,1 × 27,6 m vs ⌀ 4,2 × 27,4 m (27,36); teaching
  point "Aukštis panašus. Skiriasi plotis, kuro kiekis, galia ir sistemos mastelis."; "Pastatų išdėstymas
  iliustracinis; mastelis suderintas"; 5 × 300 MW "panaši bendra galia – ne vienas prie vieno pakaitalas".
- **Footprint:** GD Rev J 9 800 m² (was Rev F 148 × 78 m): "≈ 1,4 futbolo aikštės ploto" (9 800 / 7 140 = 1,37),
  drawn as an area-equivalent rectangle with the pitch's width, labelled "plotui lygiavertė schema"; 105 × 68 m =
  UEFA category 3-4 rule; "Vilniaus Nacionalinis stadionas — UEFA IV kategorijos projektas" (no drawing claimed).
- **24–36 mėn.*:** "*Gamintojo tikslas vėlesniems (nth-of-a-kind) blokams; ne visas licencijavimo ir projekto laikas".
- **≈ 300 000 namų ūkių*:** "*GE Vernova iliustracinis palyginimas; faktinis skaičius priklauso nuo vartojimo".
- **Map (2026-10-18):** Darlington statoma (CNSC 2025-04-04) · Clinch River **statybos leidimas išduotas 2026-09-29**
  (NRC; own status and solid pin) · Lenkija **kuriamas bendrasis BWRX-300 projektas** (Poland Generic Design
  Agreement, 2026-02-25) · Estija pasirinkta, planuojama · Lietuva vertinama (memorandumas, 2026-02-25).
- **Fission:** "Schema, ne mastelis; dalijimasis išlaisvina 2–3 neutronus"; k ≈ 1 in words and in the picture.
- **Natural circulation:** "normaliai cirkuliacijai per aktyviąją zoną nereikia didelių recirkuliacinių siurblių".
- **Passive safety:** "3 nepriklausomos grandys · be siurblių ir be išorinės elektros"; "Bet šiluma nedingsta iš
  karto"; "*Pakanka 2 iš 3 grandžių; be operatoriaus veiksmų ir be išorinės elektros".
- **QR:** the real public URL (version 4-M), the same code on the opening and the closing; caption "Interaktyvus
  modelis / Nuskenuokite ir tyrinėkite"; not a link (no navigation during the talk). Contacts: both e-mails
  (mailto) on the opening and the closing; no likenesses, no TODO text anywhere.
- Explore texts before / after the talk audited: nothing stale. Figures never break across lines (non-breaking spaces).

## 4. Visual bug fixes and polish

- **Ground hole / "sinking" plant (release blocker) — root cause:** on every map move the earth block was hidden
  below plant scale 0.9999 while the ground filler appeared only below log-scale −0.001: for 2–3 frames neither was
  drawn and the void, with the underground shaft, showed through the floor's hole (opening → Lithuania f14-16,
  Lithuania → scale f92-94, facts → projects f10-13, projects → handoff f89-91). **Fix:** one predicate decided once
  per frame switches both (`scene/groundOwner.ts`, `TalkScene.tsx`); the plant scales about its own origin on grade.
- **Comparison buildings sank into the ground** when leaving (y-scale to 0): they now dissolve where they stand
  (a screen-door dissolve on their own material copies, `k.fade`, `k.modulesFade`); building up from grade kept.
- **Large-plant comparison recomposed:** both reactor buildings on one baseline (z = 0), seen square-on from far with
  a long lens; the large plant gets an apron, roof lips and a turbine-hall roof monitor, mirrored (illustrative
  layout) so the reactor buildings stand side by side; **amber vessel outlines** at their sourced inside dimensions
  stand in front of each reactor building with the sourced diagram beside them.
- **Fission:** paced to the narration; the chain-carrying neutron larger, amber-tinted, with a short trail, the
  absorbed ones quieter (k = 1 readable); visiting order hops across each ring, uneven steps, three positions per
  site (no visible procession or beat in a long hold); a settled entry (← into the chapter) opens on the steady
  chain instead of replaying generation 0 under the "controlled" caption.
- **City:** a street grid with a boulevard each way, a dense core with towers, mid-rise ring, low houses at the
  edges, lit streets, a substation where the line arrives; framed whole with the plant and the line (one instanced
  draw + one street mesh). Swap candidate for Astra: `presentation/scene/GridCity.tsx` (`buildCity`) and, for the
  exterior, `presentation/scene/Comparison.tsx` / the plant materials — no runtime dependency or placeholder left.
- Map labels re-aimed for the longer statuses; labels kept inside the 4 % safe zone at all three projector sizes.

## 5. Transition stability (`validation/transitions-*`)

| Check | Stage 3 | Final |
|---|---|---|
| Probe, every frame of the 11 chapter entries (2 471 frames, 30 fps): earth XOR filler, filler iff scaled, grade-marker error | — | **0 failures**; grade error 0 m; 4 ownership switches, each in one frame |
| Solid pops (> 200 px flashing for 1-3 frames AND a 64 px tile ≥ 50 % flashing) | **5** (tiles 68-100 %: the four holes) | **0** (densest tile ≤ 27 %: aliasing of fine moving detail) |
| Slow diagnostic strip of the four ground switches | holes visible | `review/final-ground-switch-filmstrip.png`: continuous |
| Section stability (Stage 3 depth fix) | — | untouched (no section / material / depth change) |

## 6. Performance (Low is the delivery reference; `validation/perf-*.json`)

Real time, real presses, each chapter from the press to its settle + 1.5 s, 1920×1080.

| Low, whole talk | fps | p95 ms | worst ms | > 34 ms |
|---|---|---|---|---|
| 1-6, 11-12 (opening … handoff, limits, closing) | 60.1 each | 16.8 | 17-33 | 0 |
| 7 fission | 54.5 | 33.3 | 34.1 | 1 |
| 8 control | 53.6 | 33.3 | 49.9 | 1 |
| 9 energy | 58.3 | 16.9 | 49.9 | 1 |
| 10 safety | 57.2 | 17.1 | 66.7 | 8 |

**Caveat, measured A/B:** during these runs the owner's Firefox was using ~17 % of the GPU's 3D engine (Windows GPU
counters) and another agent's session was active. The unmodified Stage 3 build, run right after under the same
conditions, measured fission 57.8, control 52.2, safety 54.9 fps (its own report: 60 on an idle machine); the final
build in that A/B: 56.1, 55.7, 58.4. The reactor chapters are therefore not slower than Stage 3; a clean absolute measurement needs an idle GPU (the lecture-room check, §11).
High (targeted, same contention): fission 35.3, control 38.1, safety 42.6 fps (Stage 3 idle: 45.5 / 45.0 / 51.2;
bright core interiors, as before). Not optimised further: Low is the delivery preset.

## 7. Projectors (`validation/projector.txt`, `review/final-projector-sheet.png`)

1920×1080 LT (24 text-heaviest moments, final build): **0 texts outside the stage, 0 overlaps, 0 outside the 4 % safe zone.** The first pass at 1280×800 and 1024×768 found two collisions (the stadium label against the "≈ 1,4" metric; the ESBWR value label at the left margin and against the "≈ 300 MW" label); both fixed and the affected moments re-captured clean at all three sizes. Full 96-still re-run on the final build (LT at three sizes + EN): **0 outside, 0 overlaps, 0 outside the safe zone** (§12).

## 8. Determinism (`validation/determinism-*.json`)

Targeted windows (Lithuania, scale / footprint, map, handoff, fission steady state, closing), two independent sessions, full frame and WebGL-only: recorded in §12 (running at the time of the release commit).

## 9. Other gates

| Check | Result |
|---|---|
| `npm run check` | PASS (typecheck, lint, production build) |
| Text choreography (`text-settled.json`, `text-fast.json`) | **0** moments with two texts overlapping, settled presses and presses right after each guard |
| Legacy 48 s film (frozen) | Low **10 / 10 pixel-identical** to Stage 3; High paired run 10 / 10 (a first High session differed by 1 level in 3 px, and the same build reproduced that difference run to run: session noise) |
| Portable (`npm run build:portable`, opened from `file://`) | ready in 12 s; 12 chapters by 11 presses; **0 external requests**; 0 errors; QR decodes on the opening and the closing |
| QR | decodes to the live URL from 1920×1080 screenshots down to a quarter-size, blurred copy (~2 px / module) |
| Language | LT by default; EN from the setup bar outside the talk (the bar is hidden while the talk runs) |
| Console / network | 0 page errors, only the known `THREE.Clock` deprecation warning; 0 external requests in every run |
| Rehearsal simulation | the 6:55 capture with presses at the narration times is recorded in §12 and `review/` |

## 10. Review package (`docs/final/review/`)

- `final-presentation-rehearsal-1080p.mp4` — the talk as given: presses at the planned narration times (not when
  animations settle), 6:55 + 1 s pre-roll, 1×, H.264 1080p30.
- `chapters/` — 12 settled chapter stills (from the rehearsal); `final-contact-sheet.png`.
- `final-transition-filmstrips.png` — six frames of each of the 11 chapter entries.
- `final-ground-switch-filmstrip.png` — slow diagnostic: every frame around the four ground switches.
- `final-projector-sheet.png` — the 24 text-heaviest moments at 1920×1080, 1280×800 and 1024×768.
- `validation/` — machine-readable results (UTF-8 JSON + text).

## 11. Remaining items (physical room only)

1. Run the portable folder (or the live URL) on the lecture-room PC: confirm Low holds ~60 fps there (with no other
   GPU load, e.g. close other browsers), full screen, the projector's aspect (16:9 stage letterboxed on 4:3 / 16:10).
2. Clicker test: Page Down / Page Up; one press per chapter (11 to the questions).
3. Scan the QR from the back row on the real projector.
4. Rehearse with the cue sheet; adjust speaking pace, not the software (a late press only lengthens a hold).
5. Optional: Astra city / exterior if clearly better and passing the same gates; presenter photos if supplied.

## 12. Release record

| | |
|---|---|
| Release commit | `92b0beb` *presentation: final stage — 12 chapters, speech sync, facts, stability, real QR* (`presentation-v1`; `main` fast-forwarded from `8802aa1`, pushed without force) |
| Pages workflow | push events do not start the workflow in this repository (as for the first deploy), so it was dispatched on `main`: run **39141314851**, head `92b0beb`, **success** (build 43 s, deploy) — https://github.com/tyomachka/bwrx-300-interactive-presentation/actions/runs/39141314851 |
| Live site (Chrome, `validation/live/`) | https://tyomachka.github.io/bwrx-300-interactive-presentation/ serves **`index-Dw5MTYLh.js`** (the validated build); ready in 12.3 s; the audience build walked by real presses: start + 11 presses reach the Q&A composition (`live-closing.png`); **QR decodes to the live URL** on the opening and the closing; 0 external requests, 0 errors (only the known `THREE.Clock` warning) |
| Repository | stays **private** (Pages public) |
| Portable (`validation/portable/`) | rebuilt from the release source; opened from `file://`: ready in 12 s, 12 chapters by 11 presses, 0 external requests, 0 errors, QR decodes |
| Projectors (`validation/projector.txt`) | full re-run on the final build: **96 stills** (24 moments × LT 1920×1080, 1280×800, 1024×768 + EN 1920×1080): **0** texts outside the stage, **0** overlaps, **0** outside the 4 % safe zone; `review/final-projector-sheet.png` |
| Determinism, rehearsal video | added by the next commit (captures still running at this commit) |
