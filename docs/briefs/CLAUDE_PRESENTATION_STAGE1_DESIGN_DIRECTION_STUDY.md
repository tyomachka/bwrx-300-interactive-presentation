# CLAUDE — PRESENTATION V1 / STAGE 1: DESIGN DIRECTION STUDY

Read first:
- `DEVELOPMENT_RULES.md`
- `ARCHITECTURE.md`
- `docs/presentation-v1-review/CAPTURE-AUDIT.md`
- current presentation source/localization

Baseline: `presentation-v1` commit `9a30489`.

This is a DESIGN STUDY, not a global redesign. Preserve the continuous 3D world, manual chapter control, scientific content, Low-1080p performance, LT-first localization, projector-safe 16:9 stage, and the frozen legacy 48-second cinematic.

## Goal

The current build is a strong engineering prototype but does not yet look like a finished premium presentation. Find and prove a professional visual direction before applying it to all 12 chapters.

Target:
**Apple product film × Figma launch motion × premium technical documentary.**

Do not imitate brand UI. Do not turn it into PowerPoint, a dashboard or a sci-fi HUD.

## Problems established by the capture audit

- Segoe UI Variable system-font dependency.
- ~15 distinct type sizes.
- Large titles/metrics overuse Light weight.
- 14–15 px small text at 1080p; 11–12 px on small projector stages.
- `#e8a33d` carries too many semantic jobs.
- Many exterior frames are 70–84% empty/dark.
- Same exterior composition repeats.
- Most text defaults to one left gutter.
- Opening/closing still look like prototype title cards.
- Ch4 power/months and Ch11 are too text-driven.
- Four inconsistent label treatments are mixed.
- Text often arrives before the visual it describes.
- Incoming/outgoing text overlaps ~0.3 s.
- Some transitions are long relative to visible change.
- Camera fly-throughs occur.
- Fission has a near-black loop seam.

Principle: **first show/transform the idea, then let text confirm it.**

## 1. Typography A/B/C study

Do NOT pick a font blindly. Create three directions on identical content:

A — refined current:
Segoe UI Variable with normalized scale/hierarchy.

B — neutral premium:
Inter Variable (or technically equivalent locally bundled open-source variable sans).

C — technical editorial:
IBM Plex Sans Variable OR Manrope Variable; choose the stronger one after testing Lithuanian rendering.

Requirements:
- Lithuanian support;
- locally bundled/offline;
- redistribution-compatible;
- consistent on lecture PC;
- portable build compatible.

Do not keep all candidates in production later.

Use the same five samples:
1. opening title;
2. 300 MW / 24–36 metric;
3. deployment-map label;
4. safety headline + 7-day metric;
5. closing names/contact.

Normalize to ~6–8 roles, not 15. Starting point at 1080p:
- display 72–80
- metric 92–108
- H1 46–52
- H2 28–32
- body/support 22–24
- label 18–20
- source/qualifier 16–18
- micro >=16

Use real font weights. Do not request weight 200 if the chosen face has no real 200 instance.

## 2. Three visual directions

Build A/B/C visual-direction studies for the SAME five representative states:

1. Chapter 1 opening
2. Chapter 2 Lithuania / 50%
3. Chapter 4 facts / 24–36 months
4. Chapter 10 safety / 7 days
5. Chapter 12 closing

Direction A — PRECISION
- closest to current identity
- charcoal / off-white
- restrained amber
- crisp engineering labels
- minimal panels

Direction B — EDITORIAL CINEMATIC
- stronger asymmetry
- larger hero type
- fewer small labels
- intentional negative space
- subtle gradients/vignettes for legibility
- product-film title feel

Direction C — TECHNICAL DOCUMENTARY
- stronger information anchoring
- fine leader lines
- clearer cool/warm process semantics
- source-aware documentary feel
- still sparse

Do not add random per-chapter colours.

## 3. Colour study

Keep a disciplined palette. Do NOT solve flatness by adding many saturated colours.

Propose exact tokens for:
- dark charcoal background
- near-white primary text
- brighter secondary text
- amber = active attention/current concept
- cool blue = water/cooling/passive flow
- neutral white = steam
- muted copper = heat/fission
- steel gray = inactive/context

Current amber must stop meaning everything.

Provide contrast checks.

## 4. Label system

Reduce current label types to four coherent roles:

1. Anchored technical label:
   short leader/dot, optional subtle backing, 18–20 px.
2. Chapter/claim text:
   no UI card, editorial placement.
3. Source/qualifier:
   16–18 px, readable on variable backgrounds, subtle scrim if needed.
4. Metric:
   large number + quiet unit + one supporting line max.

Do not decorate every label with an amber border.

## 5. Composition study

Do not accept current framing by default.

Opening:
- plant 20–40% larger;
- stronger hero camera;
- presenter placeholders less visually heavy;
- more intentional names/contact alignment;
- QR secondary but actually scannable.

Lithuania:
- current map is promising;
- refine metric hierarchy and alignment;
- source readable but not legal-footer-looking.

Facts / 24–36:
- current number-over-repeated-exterior is weak;
- test tying the number to a construction timeline/modular assembly visual.

Safety / 7 days:
- current left headline + far-right counter split attention;
- create one eye path: reactor → passive condenser → conclusion/counter.

Closing:
- stronger thesis;
- larger QR;
- more deliberate contact treatment;
- plant remains hero;
- visibly echoes opening.

## 6. Motion prototypes only — do NOT globally retime yet

Create four short 5–12 s motion studies:

A. Metric reveal
- visual action begins first
- metric arrives at/after meaningful reveal
- no `~0 MW` pre-count state

B. Shared-object continuity
- plant → Lithuania OR plant → deployment map
- avoid floating-plinth feeling
- use common object continuity / match movement

C. Fission reset
- eliminate near-black seam
- test seamless reset OR one full chain followed by stable hold

D. Safety rhythm
- power loss → reaction stop → heat remains → passive cooling → 7 days
- intentional holds
- no camera collisions

Motion should guide attention; not decorate.

## 7. Fix only obvious blockers before study captures

Fix these low-risk visible defects because they obstruct comparison:
- off-screen `Tai vyksta kure`
- off-screen `vanduo kyla`
- clipped `separatoriai`
- 7-day orphan footnote marker
- low-contrast small labels on light backgrounds
- stale map pin after map closes
- `~0 MW` before count-up
- obvious fly-through in sampled study transitions if a small path adjustment solves it

Document every fix.

Do not start a broad refactor.

## 8. Do not globally apply yet

Do NOT:
- restyle all 12 chapters
- rewrite all presentation CSS
- change every transition
- alter all cameras
- modify 3D material architecture
- touch frozen legacy cinematic timing
- finalize QR/presenter likeness
- write final speech

We are choosing a direction first.

## 9. Deliverables

Create `docs/presentation-design-study/`

Required:

### `DESIGN-STUDY.md`
- diagnosis
- typography A/B/C
- exact type scales
- font licensing/offline notes
- package size impact
- palette proposals
- label proposal
- recommended direction and why

### Typography comparison sheet
One 1920×1080 sheet with all 3 typography directions on identical content.

### Visual-direction contact sheets
For A/B/C:
- five representative states each
- identical state/content for fair comparison

### Full-resolution stills
15 minimum: 5 states × 3 directions.

### Motion prototypes
4 short 1080p30 H.264 MP4s:
- metric reveal
- shared-object transition
- fission reset/hold
- safety rhythm

### Projector check
Recommended direction only:
- 1920×1080
- 1280×800
- 1024×768

### Contrast audit
For:
- source notes
- chapter labels
- map tags
- technical labels
- closing contacts

## 10. Score each direction 1–5

- first-impression professionalism
- typography
- hierarchy
- projector readability
- cohesion with 3D
- technical credibility
- cinematic quality
- information clarity
- offline robustness
- implementation complexity

Do not choose the most decorative one automatically.

## 11. STOP

Stop after the design study.

Do not globally apply the winner.

Do not commit as final.

Report:
1. recommended direction
2. recommended font
3. recommended palette
4. recommended label system
5. highest-impact composition changes
6. highest-impact motion changes
7. portable-size/performance tradeoffs

Owner + external reviewer will select the direction before Stage 2.
