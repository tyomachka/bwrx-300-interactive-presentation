# CLAUDE CODE — PRESENTATION STAGE 3
## Story rhythm, fewer presenter clicks, scale correctness, motion continuity, section stability, and meaningful fission

Read first:
- `DEVELOPMENT_RULES.md`
- `ARCHITECTURE.md`
- `docs/presentation-stage2-review/STAGE2-REPORT.md`
- `docs/presentation-design-study/DESIGN-STUDY.md`
- current chapter/beat/navigation code
- current technical fact sources

Stage 2 Editorial Cinematic is the visual baseline. Do not redesign it.

## 0. Checkpoint Stage 2 first

Stage 2 is finished but uncommitted.

1. Run `npm run check`.
2. Inspect `git status`.
3. Commit the Stage 2 production state before Stage 3. Follow existing repo policy for large video/review artifacts; do not force huge files into Git.
4. Record the checkpoint hash.

Suggested commit: `presentation: apply editorial cinematic design system`

## 1. Main Stage 3 goal

Make the talk behave like a presenter-controlled cinematic story, not 32 tiny slide states.

Desired control model:

**manual presenter stop → automatic short choreography → indefinite hold/subtle loop → next press**

Target about **17–20 meaningful presenter stops** instead of 32.

A key press should usually mean: “I finished this idea; move to the next idea.”

Do not add animation merely for decoration.

## 2. Scale correctness

Do not eyeball the large-reactor/BWRX comparison.

Primary BWRX source: current GE Vernova Hitachi BWRX-300 General Description (Rev. J in the repository).

Current source facts:
- ~300 MWe;
- BWRX-300 RPV minimum inside diameter ~4.2 m;
- nominal inner height ~27.36 m.

Important: a BWRX vessel is deliberately tall for natural circulation. A 5×-more-powerful reactor is NOT 5× taller.

Preferred large-reactor comparator: **GE Hitachi ESBWR**, because it is the same BWR technology family.
Use U.S. NRC / GE sources:
- gross electrical output ~1,594 MWe / marketed around 1.5 GWe;
- RPV roughly 7.1 m inside diameter and ~27.6 m tall.

Teaching point:
**the vessel heights are surprisingly similar, but the large reactor is much wider, has a much larger core/fuel inventory and output, and a substantially larger/more complex plant.**

Use one matched ground scale and matched camera/projection.
Do not scale the large plant 5× in all linear dimensions.

If the large exterior model remains simplified, label it:
`Mastelis suderintas; pastatų išdėstymas iliustracinis`

GE public material also says the BWRX-300 power block is about two international football-pitch areas. An earlier official General Description gave approximately 148 m × 78 m for the power block. Check current Rev. J before presenting those dimensions as current. If Rev. J does not state them, source-tag the older official revision / current GE public site honestly.

## 3. Replace the vague two-football-pitches visual

The owner wants a local, dimensioned reference.

Preferred concept: **Vilnius National Stadium / international-size pitch**.

The current National Stadium project is at Ozo g. 27 in Šeškinė beside Akropolis and is a UEFA Category IV stadium project.

Before implementation, check the latest current project documents for pitch dimensions. If they do not explicitly give them, use a clearly labelled **international-size 105 × 68 m football pitch** and associate it visually with the Vilnius National Stadium context without pretending the latest construction drawing explicitly published that exact size.

105 × 68 m = 7,140 m².

Visual:
- restrained top-down/schematic stadium or field outline;
- clear `105 m × 68 m`;
- BWRX power block shown at the same ground scale;
- if using ~148 × 78 m, show area equivalence honestly;
- do NOT claim the rectangular BWRX block literally nests inside two 105×68 rectangles unless the geometry demonstrates it;
- safer wording is approximately `1,6 tarptautinio dydžio futbolo aikštės ploto`, or GE's sourced “within two international football pitches” wording.

No detailed stadium modeling unless cheap.

## 4. Reduce presenter clicks

Current talk has 32 beats. Restructure the *manual stop* architecture.

Strong target sequence:

1. Opening — `hook/hero`

2–4. Lithuania — keep three genuinely distinct ideas:
- renewables / 50%;
- intermittency / calm;
- Lithuania/BWRX assessment.

5. Scale/modularity — MERGE `scale/large` + `scale/modules`.
One press starts: large reference → BWRX → repeated BWRX modules → final hold.

6–8. Three facts — keep separately:
- 300 MW;
- footprint/stadium;
- 24–36 months.

9. Deployment — preferably MERGE `projects/world` + `projects/darlington`.
World map establishes; Darlington is automatically emphasized last; then hold.
If narration clearly needs separate Darlington control, this is an allowed exception.

10. Handoff/dive — MERGE `handoff/land` + `handoff/descend`.
One press returns from map context to plant and descends into the core.
No redundant static exterior stop. Shorten the current long descent materially.

11. Fission — MERGE `fission/micro` + `fission/inFuel`.
Enter micro view, run/hold meaningful chain reaction indefinitely.
Next press exits directly back into macro core/control.

12. Control — reduce `control/blades` + `control/insert` + `control/withdraw` to one presenter-controlled topic if clear.
Preferred: entry → one illustrative insert/withdraw cycle automatically → settle/subtle hold.
Maximum two stops if necessary, not three.

13–15. Atom to electricity — compress five beats to three:
13. reactor → dry steam (boil, separators/dryer, steam outlet)
14. steam → turbine → condenser/feedwater
15. grid → homes / city / `≈ 300 000 namų ūkių*`

16–17. Passive safety — compress six beats to two:
16. normal → power loss → scram → reaction falls → decay heat remains; hold
17. ICS steam path → condensation → gravity return → day counter → `7 paros*`; hold indefinitely

18. Limitations — hold.

19. Closing/Q&A — REMOVE the redundant intermediate stop.
One press from Limitations:
return through open space → closing hero camera → thesis → `Jūsų klausimai` → contacts/QR → hold indefinitely.

No exterior frame requiring a second press just to reveal closing text.

Navigation:
- Back goes to previous meaningful presenter stop, not an internal sub-animation.
- Home = Opening.
- R = stop/reset.
- Decide safe behavior for Space during automatic choreography: either finish/skip safely or briefly lock. Document it.
- Add a debug stop list / press counter.

Goal: about 18 next presses from opening to final Q&A, not ~31.

## 5. Fission must show growth then controlled steady state

Current loop is too weak: one event → a few neutrons → one second event → restart.

Redesign presentation-specific fission.

Audience should infer:
1. neutron absorbed;
2. U-235 becomes unstable and splits;
3. fragments carry kinetic energy and deposit it as heat;
4. several neutrons are released;
5. some neutrons are lost/absorbed; some trigger more fissions;
6. simultaneous events can grow;
7. in an operating reactor the chain is controlled and stabilizes rather than growing without bound.

Suggested progression:
- Generation 0: one incoming neutron, one nucleus.
- Generation 1: first split, 2–3 neutrons.
- Generation 2: about two successful child fissions; at least one neutron terminates/gets absorbed.
- Generation 3: a handful of distributed child events.
- Then transition to a **bounded steady-state fission field** in the fuel context.

Steady state:
- distributed fission/heat events;
- subtle neutrons moving between them;
- fuel heat cue accumulates;
- deterministic seeded system;
- fixed maximum event count;
- instanced/cheap;
- loops indefinitely while presenter speaks;
- NO reset to blank / one nucleus;
- NO dark seam;
- NO runaway exponential clutter.

Possible label progression:
`neutronas` → `U-235` → `energija → šiluma` → `grandininė reakcija` → `valdoma grandininė reakcija`

Keep `Schema, ne mastelis`.

Next press gracefully collapses micro view into actual fuel/core and continues to Control.

Do not imply all emitted neutrons cause fission, literal glow is the energy mechanism, or the schematic clusters have exact nucleon counts.

## 6. Fix section/ground flicker as a blocker

Owner reproduced visible flicker/speckling when Section removes/reveals the ground. Stage 2 also lists site-ground speckle.

Reproduce in:
- Explore;
- Section on/off;
- Plant ↔ Reactor slider;
- camera orbit while partly sectioned;
- High and Low;
- 1920×1080 plus a projector-size stage;
- presentation transitions using the same earth/ground/cut geometry.

Determine root cause first. Investigate:
- z-fighting / coplanar surfaces;
- ordered dithering on overlaps;
- depthWrite/depthTest/render order;
- clipping precision;
- duplicate ground/cut meshes;
- transparent fades crossing opaque ground.

Do not assume the cause.

Preferred root fix:
- remove duplicate/coplanar surfaces;
- stable geometry separation;
- correct depth state;
- stable opaque cut cap if appropriate.

Avoid temporal dithering as a cover-up. Do not break X-ray.

Acceptance:
- no checker/speckle while static;
- no shimmer while orbiting;
- no grade-plane popping;
- no new section seam.

Create a 10–15 s diagnostic clip: open Section → orbit → Plant→Reactor→Plant → close Section.
Also capture a static 2 s sequence and verify no alternating ground pattern frame-to-frame.

## 7. Text/picture choreography

Global rule:

**picture changes first → incoming text appears when the subject is legible → text holds**

Fix Stage 2's ~0.3 s old/new text overlap.
Outgoing claim should clear before a new claim occupies the same position.
Sources follow the claim they qualify.
Do not animate every line independently.

## 8. Plant ↔ map and long camera moves

Fix:
- floating dark plinth over empty space;
- map/ground continuity around the shared plant;
- long sections with little visual progress;
- camera fly-throughs through walls.

Review especially:
- map ↔ plant;
- handoff descent;
- grid move;
- close/return;
- blackout.

Shorter is good only if still cinematic and readable.

## 9. Bright-interior continuity

Smooth the luminance jump in fuel → control → scram.
Keep the core readable.
No new post-processing.
Low is the delivery reference and should remain ~60 fps.
Do not over-invest in High optimization if Low is safe.

## 10. Freeze the approved legacy 48 s film

Presentation Stage 3 changes must not alter the approved legacy 48 s film.
Run stored regression frames afterward.

If the section-flicker root fix necessarily changes a legacy film frame, STOP and report before accepting it.

## 11. Fix validation evidence output

The Stage 2 attachment `regress-vs-9a30489.txt` contains a Python UnicodeEncodeError rather than a usable regression summary, although the report records regression validation separately.

For Stage 3:
- make regression output UTF-8 safe;
- save valid JSON or UTF-8 text;
- never treat a traceback as proof.

Do not redo all Stage 2 work solely for this.

## 12. Validation

Use FULL validation because Stage 3 changes navigation/timing/choreography and touches shared section rendering.

Required:
- `npm run check`
- all final presenter stops forward/back
- random stop seeks
- reset/Home
- realistic full LT walkthrough
- EN sanity check
- Low full-talk performance
- targeted High changed windows
- deterministic changed windows
- no external requests
- no errors beyond known warning
- section stability test
- projector checks for changed compositions
- valid UTF-8 regression evidence
- legacy 48 s stored-frame regression

## 13. Review package

Create `docs/presentation-stage3-review/`.

Required report:
- `STAGE3-REPORT.md`
- Stage 2 checkpoint hash
- old 32 beats vs new stop map
- exact final stop/press count
- scale source decisions
- stadium/field source decision
- section-flicker root cause + fix
- fission behavior
- performance/determinism/regression

Videos:
1. `presentation-stage3-full-walkthrough-1080p.mp4`
2. `stage3-transitions-focus-1080p.mp4`
3. `stage3-fission-focus-1080p.mp4` (20+ s, including steady state and next-press exit)
4. `stage3-section-stability-1080p.mp4`

Sheets:
- 12-chapter contact sheet
- revised scale/stadium full-res still
- fission progression sheet
- navigation before/after sheet
- major transition filmstrips
- projector key-state sheet

Machine-readable:
- stop list / press count
- Low perf
- targeted High
- determinism
- legacy regression
- section stability
- console/network/errors

## 14. Acceptance

Ready for review only when:
- manual navigation is about 17–20 meaningful stops;
- Limitations → final Q&A needs one press, not two;
- scale comparison uses matched physical scale and honest reference geometry;
- local field comparison has real dimensions and honest sourcing;
- fission visibly branches, then becomes controlled steady state and can remain indefinitely;
- section/ground no longer flickers;
- text follows the picture;
- plant↔map continuity improves;
- long moves are shorter and meaningful;
- changed camera paths do not cross walls;
- Low remains lecture-safe;
- legacy 48 s film remains frozen.

## 15. Stop

Do not write final narration.
Do not publish the QR URL.
Do not finalize presenter likenesses.
Do not call the presentation final.

Stop after the Stage 3 review package.
