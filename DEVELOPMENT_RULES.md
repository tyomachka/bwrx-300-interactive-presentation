# BWRX-300 Project — Development and Validation Policy

This file is the standing workflow policy for all remaining stages. Per-stage prompts should stay
short and reference this file instead of restating these rules.

## 1. Core principle

Optimize for presentation quality, technical accuracy, deterministic playback, and low-mode
reliability.

Do not spend time repeatedly proving that untouched subsystems still work.

Use targeted validation by default. Escalate to the full suite only when the changed subsystem can
plausibly affect the relevant behavior or when a targeted check fails.

## 2. Validation profiles

### FAST — default for ordinary effect/content stages

Use FAST unless a FULL trigger applies.

Required:

1. `npm run check` once at the end.
2. Production build.
3. No external runtime requests.
4. No new console errors.
5. Targeted visual review of the changed beat.
6. One Low-quality performance run covering the full sequence or the relevant presentation-safe path.
7. One High-quality performance run of the changed window.
8. Targeted deterministic playback-vs-seek checks around the changed window.
9. A small set of regression/golden checks outside the changed window.
10. Only subsystem-specific Explore/regression tests if that subsystem changed.
11. Short report, approximately 80–150 lines.

FAST deliverables:

- one focused review clip of the changed chapter,
- 4–6 review stills,
- machine-readable validation/performance output,
- short report.

A full 48-second MP4 is not required under FAST unless requested or a FULL trigger applies.

### FULL — milestone / architecture validation

Use FULL when any trigger below applies:

- master camera/timeline changes,
- reveal/section architecture changes,
- renderer/quality-preset changes,
- shader/material-injection architecture changes,
- new render target/post-processing/pass,
- determinism bug,
- measured unexplained performance regression,
- Stage 11 optimization,
- final Stage 12/delivery,
- explicit request.

FULL includes:

- full 48-second fixed-step review export,
- broader High/Low performance tests,
- 307-sample or equivalent dense determinism checks,
- Stage 3 regression samples,
- navigation/interaction/focus suites,
- stored-golden comparison,
- broader Explore checks.

Do not rebuild/re-run the previous stage as a baseline by default. Use stored approved
hashes/performance numbers unless a machine/browser change invalidates them.

## 3. Escalation rules

FAST becomes FULL only if:

- a targeted deterministic sample mismatches,
- a changed-window High result is >2 fps below the previous comparable value and cannot be
  explained by normal variance,
- Low presentation-safe mode falls below its expected behavior,
- an outside-window golden frame changes unexpectedly,
- a new console/shader/runtime error appears,
- camera/timeline state changes outside the intended beat.

First diagnose the failing subsystem. Do not immediately run the entire suite.

## 4. Cheap-first order

Always validate in this order:

1. implementation compiles,
2. visual still check,
3. short changed-window playback,
4. quick Low/High performance sanity,
5. targeted determinism,
6. only then more expensive capture/regression work.

Do not run a long determinism suite before checking whether the implementation will need rework.

## 5. Process management

- Reuse one preview server for the stage.
- Check and kill stale servers before starting.
- Verify the served bundle/build identity before capture.
- Long browser validation should run as one background chain where practical.
- Do not poll repeatedly with long blocking waits.
- Write the report while validation/capture runs.
- Keep performance runs serial.
- Avoid unnecessary rebuilds; use tsc while iterating and one final `npm run check`.

## 6. Determinism policy

For FAST:

High

- sample the changed window approximately every 3 frames or about 40–60 samples,
- add roughly 12–24 outside-window golden samples.

Low

- approximately 12–20 changed-window samples,
- approximately 8–12 outside-window samples.

Also perform:

- one forward seek,
- one backward seek,
- three random-order seeks inside the changed window.

If all match, stop.

Use dense/full determinism only under FULL.

All presentation effects must remain functions of master time and stable seeded data.

## 7. Performance policy

Low is the university presentation-safe reference.

FAST:

- Low: one full-sequence run.
- High: one run focused on the changed beat/window.
- Explore: only the new/changed mode, High + Low once.

Use previous approved report numbers as baseline.

Only run A/B old-build comparisons if:

- regression exceeds normal noise,
- or root cause is unclear.

Do not run three-round interleaved A/B unless resolving a small ambiguous regression.

## 8. Visual-review policy

Ordinary stage:

- focused chapter video only,
- 4–6 stills,
- one Low-quality still if visually different.

Full 48-second review video only for:

- FULL profile,
- complete-story milestones,
- explicit request.

Do not render 1,441 frames merely because a stage changed 5 seconds of the sequence.

## 9. Regression-by-diff policy

Run subsystem suites only when relevant files/architecture changed.

Examples:

- Camera/navigation suite: only if camera director, Explore driver, picking, bounds, focus poses,
  or controls changed.
- Stage 5 interaction suite: only if Explore state/actions/visuals/component registry changed.
- Focus audit: only if focus metadata/poses changed.
- Stage 3 comparison: only if shared material/shader/reveal/section/clock architecture changed.
  FAST sample count: 5 frames.
- Master timeline regression: required if beat timing/camera changes; otherwise outside-window
  golden samples are enough.

## 10. Source-reading policy

Avoid rereading large documents and source files without need.

Maintain `references/TECHNICAL_FACTS.md`. Each verified fact should include:

- fact ID,
- exact source document and revision,
- page/section/figure/table,
- short quote or exact supporting wording when practical,
- status: OFFICIAL / APPROX / DERIVED,
- project usage.

At stage start:

- read TECHNICAL_FACTS.md first,
- open the original PDF only for a new claim or unresolved ambiguity.

If the official PDF hash/revision changes, re-verify affected facts.

Maintain `ARCHITECTURE.md`, a compact map:

- major files,
- responsibility,
- key APIs/state,
- frozen/approved subsystems.

Read only files being changed plus their direct dependencies.

Do not reread all of PROJECT.md; read the relevant sections plus this policy.

## 11. Prompt policy

Per-stage prompts should be approximately 40–80 lines where possible. They should contain only:

- goal,
- stage-specific scientific/UX requirements,
- scope/non-goals,
- semantic events/timing,
- acceptance criteria,
- deliverables,
- FAST or FULL profile,
- any explicit exceptions.

Do not repeat standing rules from this file.

## 12. Report policy

Default report target: 80–150 lines. Use this structure:

1. Status / checkpoint.
2. What changed.
3. New scientific facts / assumptions.
4. Visual/UX decisions.
5. Performance table.
6. Determinism/regression table.
7. Files changed.
8. Open questions / approval items.

Do not reproduce long implementation narratives unless a bug or tradeoff materially affects future work.

## 13. Stage profile from here

- Stage 9 — FAST
- Stage 10 — FAST, escalate if new render pass/camera architecture is introduced
- Stage 11 — FULL
- Stage 12/final delivery — FULL

Stage 10 should produce the first new full 48-second review video after Stage 8/9 if the complete
explanatory story is then finished.

## 14. Quality rule

Time/token optimization must never remove:

- technical-source verification for new claims,
- final compile/lint/build,
- Low-mode reliability,
- targeted visual review,
- targeted determinism,
- changed-window performance check,
- runtime-error/network checks.

Reduce redundant proof, not product quality.
