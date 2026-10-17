# CLAUDE — PRESENTATION V1 / STAGE 2: APPLY SELECTED DESIGN SYSTEM + COMPOSITION

## Decision

The owner has selected:

- **Base direction: B — Editorial cinematic**
- **Font: Inter Variable, bundled locally/offline**
- **Technical-label treatment for chapters 7–10: borrow C's anchored technical labels**
  - process-coloured dot
  - fine leader line
  - restrained backing only where needed
- **Palette: use the semantic palette from DESIGN-STUDY.md**
- **Motion prototypes are NOT yet globally adopted in this stage except where required to support the selected composition or remove an already-documented visible defect.**
- **Stage 3 will be the dedicated motion/transition/choreography pass.**

This stage is about:
1. applying the chosen design language consistently to all 12 chapters;
2. redesigning weak compositions;
3. making every chapter look like it belongs to the same premium presentation;
4. preserving the existing story, science, chapter architecture and performance.

Read first:
- `DEVELOPMENT_RULES.md`
- `ARCHITECTURE.md`
- `docs/presentation-v1-review/CAPTURE-AUDIT.md`
- `docs/presentation-design-study/DESIGN-STUDY.md`

Baseline:
- Presentation V1 audit baseline: `9a30489`
- Current working tree: Stage 1 design study + documented blocker fixes
- The legacy 48 s cinematic must remain unchanged.

Do not write the final spoken script.
Do not finalize QR/public hosting.
Do not finalize presenter likenesses.
Do not start Stage 3 motion polish.

---

# 0. FIRST: CREATE A SAFE CHECKPOINT

Before changing the selected design globally:

1. verify `npm run check`;
2. preserve the Stage 1 review package;
3. make a **checkpoint commit** for the completed Stage 1 design study + blocker fixes if the repo is clean enough to do so.

Suggested commit message:
`presentation: design study and visual blocker fixes`

Report the commit hash in the Stage 2 report.

Then work from that checkpoint.

---

# 1. REMOVE THE A/B/C EXPERIMENT AFTER MIGRATION

The `src/presentation/study/` code is temporary.

During Stage 2:
- migrate the chosen B production pieces into the real presentation;
- migrate the selected C technical-label parts needed for chapters 7–10;
- preserve review artifacts under `docs/presentation-design-study/`;
- remove unused A and C production/runtime candidates after the selected implementation is proven;
- remove unused study fonts;
- remove temporary review UI from production source once no longer needed.

Do not delete the Stage 1 screenshots/reports.

If useful during implementation, keep `?designStudy=1` temporarily until the selected production version has been captured and compared; then remove it before Stage 2 is considered complete.

---

# 2. GLOBAL DESIGN SYSTEM — APPLY B

## Font

Use the Stage 1 **Inter Variable** local subset.

Requirements:
- load locally/offline;
- wait for the font in the presentation ready gate (`document.fonts.load`) so the opening cannot flash a fallback;
- no runtime network request;
- portable single-file build embeds it;
- tabular figures only on counters/count-up numbers, NOT globally.

Use real weights.

Recommended production roles at 1080p:

- Display: 80 px / 600 / tracking about -0.03em
- Metric: 108 px / 500
- H1: 52 px / 600
- H2: 32 px / 500
- Body/support: 24 px / 400
- Label: 19 px / 500
- Source/qualifier: 17 px / 400
- Micro/kicker: 16 px / 600 / +0.12em

Keep the projector-safe floors proven in Stage 1.

Do not create new one-off font sizes unless a real layout problem requires them.

## Palette

Use:

- background/charcoal `#0d0f12`
- primary text `#f7f8f8`
- secondary text `#d1d5d9`
- source/qualifier `#b8bec4`
- amber/current concept `#e8a33d`
- water/cooling `#78b4da`
- steam `#e8edf0`
- heat/fission copper `#d38c5c`
- inactive/context steel `#8a939c`
- label panel `rgba(13,15,18,0.60–0.74)` when required on light 3D

Semantic rule:
**amber = the single current concept / current focus.**

Do not let amber simultaneously decorate every rule, unit, pin, border and label.

## Label roles

Production should have only these four visual roles:

1. **Anchored technical label**
   - dot + fine leader
   - technical chapters 7–10 should use C's process-coloured dots where meaningful
   - no amber border
   - short text
   - backing only if the background requires it

2. **Chapter / claim text**
   - editorial placement
   - no card by default
   - no decorative border

3. **Source / qualifier**
   - directly below what it qualifies
   - readable 17 px role
   - never treated as a legal footer at the extreme edge

4. **Metric**
   - number
   - quiet unit
   - one supporting line max
   - source directly below

---

# 3. CHAPTER-BY-CHAPTER COMPOSITION PASS

Do not mechanically paste the same layout everywhere.
Use the B editorial language while allowing each chapter to express a different visual idea.

## Chapter 1 — Opening

Adopt the B hero direction.

Requirements:
- plant is clearly the hero;
- use B's lower cinematic camera unless a small refinement is visibly stronger;
- plant substantially larger than the old baseline;
- title in intentional negative space;
- no giant mannequin figures;
- keep only restrained temporary presenter marks/names until real likenesses are supplied;
- contacts must not compete with title;
- QR remains a size-test placeholder only;
- keep it visibly scannable;
- `VIRGILIJUS_EMAIL_TODO` remains a clearly documented TODO, not invented.

This scene must feel like a product-film opening, not a title slide.

## Chapter 2 — Lithuania

Use B as the base.

Keep:
- Lithuania/map dominant;
- large `50 %` editorial metric;
- subtle gradient/scrim supporting readability;
- source directly under the claim.

Refine:
- alignment between metric and map;
- avoid over-heavy left-side text;
- ensure the map remains the main visual;
- no unnecessary extra cards.

## Chapter 3 — Scale / modularity

Apply B typography and spacing.

The current spatial comparison remains valuable.

Improve composition so:
- large conventional unit and BWRX-300 are immediately comparable;
- `5 × 300 MW` is secondary confirmation, not the only idea;
- duplication/repetition reads as modularity;
- disclaimer remains readable but quiet.

Do not imply technical equivalence.

## Chapter 4 — Three facts

This needs the largest composition improvement in Stage 2.

### 300 MW
Do not leave it as a number over the repeated plant exterior.

Tie the metric visually to:
- one actual BWRX unit,
- electrical output path,
- or another physical representation already available.

### ≈ 2 football pitches
Keep the physical pitch comparison.
Apply the new typography/source system.

### 24–36 months
Adopt the Stage 1 selected visual:
- construction timeline;
- a second identical unit/module visually rising/assembling beside the first;
- 24–36 band;
- source/qualifier directly under the claim.

Important:
this is an **illustrative construction/modularity visual**.
Do not imply two plants are literally constructed together in the cited estimate.

The vendor-estimate qualifier must remain visible.

## Chapter 5 — Projects / deployment

Apply B type and source system.

Keep the map as the hero.

Improve:
- European label spacing;
- status legibility;
- map-tag consistency;
- source placement;
- one-current-concept use of amber.

Use technical-documentary anchored labels only where they improve map clarity; do not make this chapter visually busy.

## Chapter 6 — Handoff / dive

Do not perform the full motion redesign yet.

Composition goals:
- no unnecessary text card;
- map/plant/reactor remain visually dominant;
- chapter label quiet;
- settled end state should frame the reactor attractively for the speaker handoff.

Keep existing timeline/camera unless a tiny composition adjustment is required.

Full transition timing belongs to Stage 3.

## Chapter 7 — Fission

Apply B typography + C technical annotation logic.

Required label treatment:
- `neutronas`
- `U-235`
- `energija → šiluma`
- selected consistent Lithuanian wording for chain reaction

Use:
- subtle leader/anchoring where useful;
- copper only for heat/fission meaning;
- neutral/cool neutron styling.

Do not add interface-like cards.

Do not globally adopt the Stage 1 fission-loop motion prototype yet unless required to remove the already-known dark reset seam.
If you do adopt that specific seam fix, document it as an already-proven blocker fix, not a Stage 3 retime.

## Chapter 8 — Control

Use B typography + C anchored technical labels.

Make:
- control blades the dominant visual;
- technical label attached to the blades;
- copper material readable;
- explanatory copy secondary.

Avoid floating labels far from their objects.

Do not add dashboard gauges.

## Chapter 9 — Atom → electricity

Use B editorial composition for chapter/metric copy and C anchored labels on machinery.

The flow itself is the hero.

Improve each settled composition:
- reactor/natural circulation
- separators/dryer
- turbine/generator
- condenser/feedwater
- grid/city

The final `≈ 300 000 namų ūkių*` state currently spreads plant → wires → city across a lot of darkness.
Recompose it so the eye path is clear and the city does not feel detached.

Possible:
- slightly larger generator/grid path;
- city closer/stronger in frame;
- metric aligned to the energy path;
- reduce empty void.

Do not build detailed Vilnius geometry.

## Chapter 10 — Passive safety

Adopt the B safety composition as the production base.

Required eye path:

**reactor → passive loop / condenser → one right-hand conclusion column**

The right column contains:
- `Pasyvusis aušinimas`
- short supporting line
- `7 paros*`
- qualifier directly below

Use C technical labels inside the machinery:
- steam path
- pool heat transfer
- condensate return
- process-coloured dots where meaningful

The technical labels must support the physical loop without competing with the large 7-day conclusion.

Do not globally change safety timing in Stage 2.
Stage 3 will handle the press rhythm/holds.

## Chapter 11 — Limitations

This is currently one of the weakest compositions and must be redesigned now.

Do NOT keep only three giant floating words.

Keep the actual plant visible.

Create three restrained spatial ideas:

### ATLIEKOS
Use a small presentation-only physical cue near the reactor/fuel context.
Examples:
- simplified spent-fuel/cask silhouette,
- fuel-to-storage path abstraction,
- NOT a scary radiation icon.

### LICENCIJAVIMAS
Use a layered document/approval abstraction or restrained technical stamp/layer visual integrated spatially.

### PIRMŲJŲ PROJEKTŲ RIZIKA
Use a construction schedule / uncertainty / first-of-a-kind abstraction.
Do not invent numeric cost claims.

The chapter should feel:
calm,
honest,
credible,
not alarmist.

Use B typography.
No pros/cons card grid.

## Chapter 12 — Closing

Use B closing composition and echo Chapter 1.

Requirements:
- same or intentionally related camera as opening;
- plant remains hero;
- closing thesis large enough to feel intentional;
- `Jūsų klausimai` in amber as the single focus;
- contacts readable but secondary;
- larger QR;
- QR still points only to the placeholder test destination until public URL is approved;
- hold indefinitely.

Do not finalize presenter likeness.

---

# 4. SPACING / GRID SYSTEM

Define a real composition grid for the 16:9 stage.

Use safe zones:
- ~4% left/right for critical text;
- ~4% top/bottom;
- no source notes hugging the extreme screen edge.

Create reusable alignment anchors:
- left editorial column;
- right editorial column;
- metric baseline;
- lower contact line;
- source under metric;
- chapter kicker position.

Do not force all chapters to use the same anchor.
The purpose is coherence, not sameness.

---

# 5. SOURCE / QUALIFIER CLEANUP

Apply the Stage 1 rule everywhere:

**a source should visually belong to the claim it qualifies.**

Do not scatter sources into arbitrary screen corners.

Examples:
- `50 %` source directly under the 50% supporting copy;
- 24–36 vendor qualifier directly under the metric;
- 7 days note directly under `7 paros*`;
- home-count qualifier directly under that metric.

Sources must be:
- visible;
- projector readable;
- clearly secondary.

---

# 6. KEEP MOTION MOSTLY AS-IS IN THIS STAGE

This is a composition/design-system stage.

Allowed:
- tiny fade/reveal adjustments required by the new layout;
- preserving already-proven blocker fixes;
- moving text appearance enough to avoid a layout bug;
- applying the already-proven fission seam fix if it is isolated and does not change chapter timing.

Do NOT yet:
- globally retime all beats;
- shorten every transition;
- redesign every camera;
- adopt all Stage 1 motion prototypes globally;
- change presenter timing architecture;
- collapse the 32-beat system.

Those are Stage 3.

---

# 7. PERFORMANCE

Low remains the delivery reference.

Requirements:
- no runtime web requests;
- font local;
- presentation Low stays ~60 fps on current machine except known external contention/first-press stall;
- new Chapter 11 cues should be cheap;
- no new post-processing;
- avoid large transparent DOM overlays.

---

# 8. VALIDATION

Use FAST validation for this stage unless architecture/performance/determinism changes trigger FULL.

Required:

1. `npm run check`
2. normal LT presentation route
3. English switch sanity check
4. 1920×1080 full chapter stills
5. 1280×800 key states
6. 1024×768 key states
7. Low full-talk performance
8. targeted High check on opening, safety, control
9. no external requests
10. no console/page errors beyond known warning
11. portable build test
12. legacy 48 s regression sample remains identical
13. all 32 beats still reachable

---

# 9. REVIEW PACKAGE

Create:

`docs/presentation-stage2-review/`

Required:

## A. `STAGE2-REPORT.md`

Include:
- Stage 1 checkpoint commit hash;
- selected design decisions;
- files changed;
- font integration;
- package-size change;
- performance;
- known weaknesses;
- deferred Stage 3 motion work.

## B. 12-chapter production contact sheet

One settled production still for every chapter.

## C. Key-state sheet

Include:
- all three facts states;
- fission;
- control insertion/withdraw;
- all energy stages;
- safety normal/blackout/decay/passive/7days;
- limitations;
- closing.

## D. Before/after sheet

Compare old audit baseline versus Stage 2 for:
- Opening
- Lithuania
- Facts 24–36
- Energy final/grid
- Safety 7 days
- Limitations
- Closing

## E. Full walkthrough

Produce a current 1080p H.264 walkthrough of the entire presentation.

Do not speed it up.
Use realistic chapter/beat holds sufficient to judge the design.

## F. Projector sheet

Recommended production look at:
- 1920×1080
- 1280×800
- 1024×768

## G. Contrast audit

Repeat the key text-role checks.

---

# 10. STAGE 2 ACCEPTANCE BAR

Stage 2 is ready for review when:

- all 12 chapters use Inter consistently;
- all text roles come from the normalized scale;
- amber has one semantic job;
- sources visually belong to their claims;
- chapters 7–10 use the selected C-style technical labels where appropriate;
- Opening no longer feels like a prototype title card;
- Facts no longer feel like three unrelated number slides;
- Safety has one clear eye path;
- Chapter 11 is a real visual composition, not three floating words;
- Closing intentionally echoes Opening;
- projector readability holds;
- Low performance remains delivery-safe;
- normal presentation contains no A/B/C study UI;
- review package exists.

---

# 11. STOP

Do NOT begin the dedicated motion/transition pass.
Do NOT write final narration.
Do NOT publish QR/public URL.
Do NOT finalize presenter likenesses.
Do NOT call the presentation final.

Stop for owner/external review.

At the end, report the three weakest remaining visual areas that should become Stage 3 priorities.
