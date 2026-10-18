# Claude Code — FINAL presentation stage

## Read this first

This is intended to be the **last full development stage before the real-room rehearsal**. Treat the current published Stage 3 presentation as the baseline, not as something to redesign from scratch.

Current known state:
- Stage 3 implementation commit: `46c85b2` (`presentation: complete stage 3 cinematic choreography`).
- Deployment commit: `8802aa1` (`deploy: publish interactive presentation with GitHub Pages`).
- `main` and `presentation-v1` were aligned when Stage 3 was published.
- Live site: `https://tyomachka.github.io/bwrx-300-interactive-presentation/`
- Repo: `tyomachka/bwrx-300-interactive-presentation` (private; Pages public).
- Low quality is the delivery reference.

Do **not** reset or rewrite history if HEAD is newer. First verify that the Stage 3 commit is an ancestor of the current branch and work forward from the actual latest tree.

There is a separate Astra visual R&D experiment that may finish later. **Do not wait for it, do not modify it, do not delete its files, and do not depend on it.** This final stage must be complete without Astra. If a later city/exterior prototype is better, it can be integrated separately after this stage.

Read before editing:
1. `DEVELOPMENT_RULES.md`
2. `docs/presentation-stage3-review/STAGE3-REPORT.md`
3. `references/TECHNICAL_FACTS.md`
4. presentation architecture / talk runtime docs
5. `/mnt/data/FINAL_SPEECH_LT.md` if available; otherwise use the final narration pasted below or supplied beside this brief.

Do not touch the frozen legacy 48 s film unless a validation proves that the final talk changes require a separate fallback export. The interactive presentation is the main product.

---

# Objective

Finish the presentation as if no more structural development stages are planned.

The final result must be:
- visually polished enough for a university public-speaking assessment;
- factually current as of **18 October 2026**;
- approximately **7 minutes** with the supplied shortened Lithuanian narration;
- roughly 50/50 between Virgilijus and Timofej;
- easy to present from the keyboard with **far fewer presses** than Stage 3;
- stable on 16:9, 16:10 and 4:3 projectors;
- smooth on Low on the Iris-Plus-class machine;
- completely usable offline and on GitHub Pages;
- Lithuanian by default, English still available outside active playback;
- free of ground/section flicker, sinking exterior geometry, confusing scale claims, stale map statuses, placeholder QR text, and misleading numerical claims.

This is a **polish + truth + pacing + final validation** stage, not a new artistic direction. Keep Design B / Editorial Cinematic and C-style technical labels.

---

# 1. Replace 19 presenter stops with 12 chapter stops

The current 19-stop system is much better than the old 32-beat system, but for a 7-minute talk it still asks the presenter to manage too many state changes.

Make **one presenter stop per narrative chapter**. Internal animation beats continue automatically inside each chapter, then the scene holds indefinitely. The presenter advances only when the spoken idea changes.

Target structure:

1. Opening
2. Lithuania / energy context
3. SMR scale / ESBWR comparison
4. Three BWRX-300 facts
5. Real projects / deployment map
6. Handoff / descent to reactor
7. Fission / controlled chain reaction
8. Control blades
9. From heat to electricity
10. Passive safety / blackout / seven days
11. Limitations
12. Closing / Q&A

That means **11 presses from the opening to Q&A** after presentation start.

Map the existing Stage 3 stops like this:
- Chapter 1 = old stop 1
- Chapter 2 = old 2 + 3 + 4
- Chapter 3 = old 5
- Chapter 4 = old 6 + 7 + 8
- Chapter 5 = old 9
- Chapter 6 = old 10
- Chapter 7 = old 11
- Chapter 8 = old 12
- Chapter 9 = old 13 + 14 + 15
- Chapter 10 = old 16 + 17
- Chapter 11 = old 18
- Chapter 12 = old 19

Rules:
- A press enters the chapter; its internal cues play automatically.
- When the internal sequence ends, it holds forever.
- Processes that should visually live (fission steady state, subtle water flow, turbine idle/spin as appropriate, safety loop) keep looping analytically without visible restart.
- Back/Left goes to the **previous chapter settled at its meaningful final state**.
- Home returns to Chapter 1.
- R resets the current chapter to its settled state.
- Esc exits presentation as today.
- Keep a short accidental-double-press guard, but after the guard a press may advance immediately; do not force the presenter to wait for a 30–50 s automatic sequence.
- Debug mode should show `chapter k / 12`, not `stop k / 19`.

Do not preserve an intermediate static exterior frame just because it exists in the old choreography. In particular, **Limitations → Q&A must remain one press with no meaningless exterior stop**.

---

# 2. Sync automatic cues to the final Lithuanian speech

Use the supplied shortened narration as the canonical script. Do not keep old cue times just because they already exist.

Approximate chapter timing targets:
- 1 Opening: 25 s
- 2 Lithuania: 30 s
- 3 Scale: 40 s
- 4 Three facts: 40 s
- 5 Projects: 35 s
- 6 Handoff: 25 s
- 7 Fission: 40 s
- 8 Control: 25 s
- 9 Energy: 50 s
- 10 Safety: 50 s
- 11 Limitations: 25 s
- 12 Closing: 30 s

Do not animate continuously for the whole duration just to fill time. Use a premium rhythm:
**change → settle → presenter speaks over a living hold → next meaningful change**.

Recommended cue structure:

### Chapter 2 Lithuania
- enter map and show `50 %` first;
- then a calm/night variability cue;
- then the Lithuania BWRX-300 assessment cue;
- settle on a clean Lithuania view.

### Chapter 4 Three facts
- 300 MW first;
- footprint comparison second;
- 24–36 months third;
- each number gets its own visual moment and then remains contextually visible or cleanly yields to the next.

### Chapter 7 Fission
- initial neutron absorption;
- first split;
- branching generations;
- widen into controlled steady chain;
- **hold indefinitely** at the steady chain. No restart, no blank seam.

### Chapter 9 Energy
- boiling / natural circulation;
- separators + dryer / steam out;
- turbine + generator;
- condenser / feedwater;
- grid + city finale;
- hold on the city / grid result.

### Chapter 10 Safety
- normal state;
- external power loss;
- scram / chain reaction stops;
- decay heat remains;
- passive ICS loop;
- seven-day final state;
- hold there.

The narration should feel in control of the screen, not like it is chasing an autoplay video.

---

# 3. Factual audit — fix every visible LT and EN string

Audit **all strings that the audience can see**, not only the main titles:
- headings;
- metrics;
- map statuses;
- labels;
- footnotes;
- source lines;
- warnings / qualifiers;
- QR captions;
- Explore labels used before/after the talk;
- LT and EN translations.

Update `references/TECHNICAL_FACTS.md` and the presentation source map/copy so every numerical or status claim has an explicit authoritative source.

## 3.1 Lithuania 2025 — use the correct denominators

The current big `50 %` is valid, but make its denominator unambiguous.

Official Litgrid 2025 final balance:
- net domestic generation: **9.718 TWh**;
- total electricity demand: **13.261 TWh**;
- total consumption: **12.576 TWh**;
- RES share in local generation: **68.1 %**;
- RES generation as a share of total demand: **49.9 %**;
- all domestic generation relative to total demand: **73.3 %**.

Preferred main slide copy:
- large: `50 %`
- line: `AEI gamyba 2025 m. sudarė 49,9 % bendro Lietuvos elektros poreikio`
- optional secondary micro-stat: `Vietos gamyba: 73,3 % poreikio`

Do **not** say `73 % suvartojimo` if the underlying denominator is Litgrid's total demand. Use `poreikio`.

Do not put `68.1 %` beside the 50 % unless it is explicitly labelled `vietos gamyboje`; otherwise it creates a denominator trap.

Authoritative source: Litgrid annual generation/consumption balance.

## 3.2 ESBWR vs BWRX-300 scale

Keep ESBWR as the large comparator because it is a related large BWR design and gives a clean teaching comparison.

Use:
- ESBWR: approximately **1,535 MWe net** (NRC reference design; gross 1,594 MWe)
- BWRX-300: approximately **300 MWe net**
- ESBWR vessel: approximately **7.1 m diameter × 27.6 m height**
- BWRX-300 vessel: approximately **4.2 m diameter × 27.36/27.4 m height** from the current project technical reference

Teaching point:
`Aukštis panašus. Skiriasi plotis, kuro kiekis, galia ir sistemos mastelis.`

Do not visually imply the whole large plant is simply five times larger in every dimension.

## 3.3 Footprint — switch the main claim to the current official value

The Stage 3 visual currently uses the older Rev F `148 × 78 m` envelope and derives `≈1.6` pitches. For the final presentation prefer the newer official General Description value:
- **power-block footprint ≈ 9,800 m²**.

UEFA category 3/4 field: **105 × 68 m = 7,140 m²**.

Therefore by area:
`9,800 / 7,140 ≈ 1.37` → show **`≈ 1,4 futbolo aikštės ploto`**.

Do not invent exact side dimensions for the 9,800 m² value. If an outline is required visually, make it explicitly an **area-equivalent schematic** and label it as such.

Name the local reference on screen:
`Vilniaus Nacionalinis stadionas — UEFA IV kategorijos projektas`

But do **not** claim that a current public stadium drawing proves its pitch dimensions. The 105 × 68 m field size comes from UEFA's category 3/4 rule; the Vilnius municipality confirms the National Stadium is UEFA IV category.

## 3.4 24–36 months

Keep the claim only with its qualifier:
`24–36 mėn.*`

Footnote / source meaning:
`Gamintojo tikslas vėlesniems (nth-of-a-kind) blokams: nuo pirmojo branduolinio betono iki pasirengimo pakrauti kurą; ne visas licencijavimo ir projekto laikas.`

Do not present 24–36 months as a demonstrated industry average.

## 3.5 300,000 homes

This is a **manufacturer illustrative comparison**, not a universal physical conversion.

If shown:
`≈300 000 namų ūkių*`
with a concise qualifier such as:
`*GE Vernova iliustracinis palyginimas; faktinis skaičius priklauso nuo vartojimo.`

Do not repeat it in the spoken script unless needed.

## 3.6 Project map — update statuses to October 2026

At minimum:
- **Darlington, Canada** — `statoma`; construction licence issued in 2025, construction underway.
- **Clinch River, JAV** — update from application/review wording to **`statybos leidimas išduotas 2026-09-29`**.
- **Lietuva** — `vertinama`; 2026-02-25 MoU for technical/economic assessment of BWRX-300 deployment potential.
- **Lenkija** — do not simply say `statoma`; use something like `kuriamas bendrasis projektas` / `PGDA` / `projektavimas ir licencijavimo pasirengimas`, matching the exact source.
- **Estija** — `pasirinkta potencialiam diegimui / planuojama`; do not imply construction has started.

If the current map contains any other pins, verify them too.

## 3.7 Fission

The animation may show three emitted neutrons for clarity, but do not teach that every U-235 fission always produces exactly three.

Spoken wording stays `dar keli neutronai`.

On-screen small qualifier should remain equivalent to:
`Schema, ne mastelis` / `schematic`.

The controlled steady field must visually mean approximately `k = 1`: one successful continuation per fission on average, with the others absorbed/lost.

## 3.8 Natural circulation

Never say `reaktoriuje nėra siurblių` as a blanket claim.

Use the accurate teaching statement:
`Normaliai cirkuliacijai per aktyviąją zoną nereikia didelių recirkuliacinių siurblių; srautą palaiko natūrali cirkuliacija.`

BWRX-300 is a direct-cycle, natural-circulation boiling-water reactor.

## 3.9 Passive safety

Keep the strong seven-day moment, but make it precise:
- three independent ICS trains;
- two trains are sufficient for the stated decay-heat-removal case;
- decay heat removal can be sustained for seven days without operator action;
- passive safety after station blackout does not require external electrical power for the safety function.

Do not say the reactor instantly becomes cold, or that every system in the plant uses zero electricity.

---

# 4. Recompose the large-reactor comparison without fabricating architecture

The Stage 3 report itself identifies the large-plant exterior as one of the weakest remaining visuals.

Improve it, but remain honest:
- keep both plants on one matched ground scale;
- same perspective / baseline;
- align the reactor-building bases so the audience can compare actual footprint and height instead of perspective tricks;
- make the large plant massing cleaner and more plausible, but **do not invent detailed ESBWR building dimensions**;
- retain a visible qualifier such as `Pastatų išdėstymas iliustracinis; mastelis suderintas`;
- use the sourced vessel silhouettes/diagram as the precise comparison;
- consider ghosted/outline vessel silhouettes aligned beside or within the two plants so the surprising `similar height, much larger diameter` point reads immediately;
- keep one 10 m scale reference if it helps.

The audience should leave with this idea:
**small modular reactor ≠ tiny reactor vessel; it is a smaller-output, simplified, repeatable plant architecture.**

Do not rebuild the BWRX-300 model.

---

# 5. Fix the remaining ground / sinking / transition artifact

The Stage 3 depth fix solved the documented section z-fighting, but the owner still sees a separate artifact during roughly 3–4 transitions: the exterior BWRX-300 appears to sink below the ground or the ground briefly flickers around it.

Treat this as a release blocker.

Reproduce it from normal keyboard presentation playback, not only debug seeks.

Inspect at least:
- opening → Lithuania;
- Lithuania → scale;
- scale / facts transitions;
- projects map → handoff;
- exterior → section descent;
- limitations → closing.

Likely class of bug to check:
- scaling a plant about a pivot below/above the grade plane;
- interpolating `position.y` and `scale` on the same root;
- swapping `earth`, `floor filler`, `site ground`, or contact shadow one frame too early;
- depth conflict between the filler and the real surface;
- section clip opening before the camera/earth state is ready.

Preferred structural fix if applicable:
- create/use a dedicated **grade-plane pivot** for any exterior plant scale animation;
- scale around the ground-contact plane, not the model origin;
- keep above-grade exterior geometry clamped to grade until the intentional section/descent chapter begins;
- separate exterior scaling transforms from the underground reveal transform;
- crossfade or hand off ground/filler ownership deterministically, with no one-frame overlap or gap;
- never move the whole plant vertically just to make it shrink into a map point.

Add automated validation:
- sample every frame of the changed transitions at 30 fps;
- assert exterior building ground-contact markers remain within a small tolerance of grade whenever the section is closed;
- compare consecutive frames for large unexpected ground-only pixel changes;
- capture a slow-motion diagnostic filmstrip.

Do not regress the Stage 3 section stability fix.

---

# 6. Fission final polish

The new branching concept is correct and much better than the old one-shot loop. Final polish only:

- make the early growth unmistakable: 1 → 2 → 3 simultaneous fissions should read as a **chain spreading through fuel**, not disconnected decorative nuclei;
- in the steady state, subtly emphasize the one neutron that successfully continues each chain; the others can fade/absorb more quietly;
- disguise the visible three-ring repetition in a long hold. Change deterministic phase offsets / site ordering / camera-space distribution, not the physics contract;
- no exponential runaway visual;
- no restart seam;
- no literal glow-as-energy implication;
- keep Low performance safe.

The steady field must remain indefinitely watchable while Timofej speaks.

---

# 7. City / grid scene — polish without waiting for Astra

Do not depend on the Astra city prototype, but make the existing city chapter presentation-safe now:
- city should read as a coherent urban load, not a random block scatter;
- keep the generator → transformer → transmission line → city causal path visually clear;
- the city does not need to be a literal Vilnius model unless the geometry is already available and cheap;
- if there is a `≈300 000 namų ūkių*` metric, keep the manufacturer qualifier;
- avoid adding costly geometry or lighting that threatens Low 60 fps.

Create a short note in the final report identifying which city/exterior component could be swapped later if Astra's version is clearly superior. Do not leave any runtime dependency or placeholder for it.

---

# 8. QR, contacts, and closing

The public URL is now known. Replace the size-test QR with a real QR code pointing to:
`https://tyomachka.github.io/bwrx-300-interactive-presentation/`

Requirements:
- actual scannable QR, tested from a 1920×1080 screenshot displayed at realistic lecture-room size;
- enough quiet zone and contrast;
- same QR on opening and closing;
- caption in Lithuanian, e.g. `Interaktyvus modelis` / `Nuskenuokite ir tyrinėkite`;
- clicking the QR/caption in Explore/setup mode may open the same URL, but presentation mode should not accidentally navigate away.

Contacts:
- Virgilijus Kiltinavičius — `virgilijus.kiltinavicius@stud.vilniustech.lt`
- Timofej Gaivoronskij — `timofej.gaivoronskij@stud.vilniustech.lt`

Keep both visible and clickable outside active playback.

No real presenter photos have been supplied. **Do not invent likenesses.** Keep tasteful abstract figures/initials or the current neutral silhouettes; remove any obvious TODO label.

Closing copy should remain concise:
`Ta pati fizika. Kitas mastelis.`
`Jūsų klausimai`

Do not add a long thank-you paragraph.

---

# 9. Typography / colour / editorial consistency

Keep Design B / Editorial Cinematic:
- bundled Inter Variable;
- charcoal / near-white base;
- amber only for the active concept;
- cool blue for water/cooling;
- copper/warm tone for heat;
- steel grey for inactive structure;
- C-style anchored technical labels in the reactor chapters.

Do not introduce a new visual language now.

Final polish checks:
- all small text readable against bright reactor views;
- source notes directly under the claim they qualify where possible;
- no full-width floating cards unless necessary for contrast;
- no text appearing before the visual subject;
- no two narrative texts overlapping during fast presenter presses;
- metrics use tabular figures only where counters animate;
- LT diacritics, en dashes, `≈`, `%`, `m²`, `MW`, `MWe`, and spacing are consistent.

---

# 10. Final narration file and cue sheet

Add the shortened final Lithuanian speech to the repo, e.g.:
`docs/final/FINAL_SPEECH_LT.md`

Also create a one-page cue sheet:
`docs/final/PRESENTER_CUES_LT.md`

For each of the 12 chapters, include:
- presenter;
- first spoken phrase;
- target duration;
- what the screen does automatically;
- when to press next;
- one fallback sentence that can be skipped if running late.

Do not write a separate long alternative speech.

Target total spoken text: about **700–730 Lithuanian words**, excluding notes and sources.

---

# 11. Real final validation

This is a final-stage validation, so use FULL where it matters, but do not waste hours re-proving frozen components that were not touched.

Minimum gates:

### Build / correctness
- `npm run check`
- production build
- portable build
- no external runtime requests
- no errors; known THREE.Clock warning only if still unavoidable
- LT default; EN switch works outside playback

### Navigation
- 12 chapters exactly
- opening → Q&A in 11 forward presses after start
- forward, back, Home, R, Esc
- early press after guard skips safely to next chapter
- no dead/intermediate stop
- Limitations → Q&A = one press

### Factual text audit
Produce `docs/final/FACT_AUDIT.md` listing every visible numeric/status claim, its exact screen wording, and its source.

At minimum audit:
- 50 / 49.9 / 73.3 Lithuania values and denominators;
- 300 MW;
- ESBWR 1,535 MWe comparator;
- vessel dimensions;
- 9,800 m² and pitch ratio;
- UEFA 105 × 68 m;
- 24–36 months qualifier;
- map statuses including Clinch River permit on 2026-09-29;
- Lithuania 2026 assessment MoU;
- 300,000 homes qualifier;
- ICS seven-day wording.

### Visual stability
Capture all 11 chapter transitions at 1× and a slow diagnostic pass.
No:
- building sinking through ground;
- one-frame earth/filler flash;
- z-fighting speckle;
- section opening before intended;
- camera inside closed walls;
- text pop before picture;
- stale map pins.

### Projectors
Check at least:
- 1920×1080
- 1280×800
- 1024×768

No clipped text, no broken QR, no unsafe edge placement.

### Performance
- Low: whole presentation, real time, full 12 chapters: target ~60 fps and no sustained stutter.
- High: targeted only at fission/control/safety; report, do not over-optimize if Low is clean.

### Determinism
Target changed windows only:
- Lithuania chapter;
- scale / footprint;
- project map;
- handoff / ground transitions;
- fission steady state;
- final closing.

### Real 7-minute rehearsal simulation
Create a scripted 6:50–7:05 walkthrough using the target chapter durations from the final speech. It should press next at the planned narration times, not immediately after animations settle.

Export:
- `final-presentation-rehearsal-1080p.mp4`
- 12 settled chapter stills
- one transition filmstrip sheet
- one projector sheet
- one final contact sheet

The rehearsal video is the most important review artifact.

---

# 12. Git / Pages / release

Only after all gates pass:
1. commit the final stage with a clear message;
2. push `main` normally (no force push);
3. ensure the Pages workflow runs;
4. verify the live URL in Chrome after deployment;
5. verify the real QR decodes to the live Pages URL;
6. run a quick live-site navigation check on the deployed build;
7. build the portable offline folder again and test it by opening from `file://` in Chrome or Edge.

Do not make the repository public.

Create `docs/final/FINAL-REPORT.md` containing:
- final commit hash;
- Pages workflow run and result;
- exact live URL;
- exact chapter count / press count;
- final word count and target duration;
- all factual changes;
- all visual bug fixes;
- Low/High performance;
- projector checks;
- portable test;
- remaining items that require the physical lecture-room PC only.

If everything above passes, mark the software presentation **FINAL FOR REHEARSAL**. The only expected work after this should be:
- physical classroom PC/projector rehearsal;
- optional replacement of the city/exterior with Astra output if it is clearly better and passes the same regression gates;
- presenter photos only if the owner later supplies real photos.

Stop there. Do not begin another redesign stage.
