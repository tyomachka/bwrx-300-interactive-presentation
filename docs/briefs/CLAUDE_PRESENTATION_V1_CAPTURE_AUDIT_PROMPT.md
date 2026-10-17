# Claude Code Prompt — Presentation V1 Capture / Audit Package

Do **not** redesign or improve the presentation in this pass.

The purpose of this pass is to capture the current Presentation V1 **honestly**, exactly as it looks now, so an external reviewer can evaluate typography, colour, composition, visual hierarchy, transitions, pacing, motion continuity, empty/text-heavy scenes, and overall professionalism before we begin the next design stage.

Read first:
- `DEVELOPMENT_RULES.md`
- `ARCHITECTURE.md`
- `PRESENTATION_V1_VISUAL_ACCEPTANCE.md`
- current presentation-v1 implementation
- current `PRESENTATION-STORY.md` if it exists

Do not make visual fixes during capture unless something is actually broken and prevents capture.

---

## 1. Goal

Create a complete **visual review package** of the current ~7-minute Lithuanian presentation.

We need to see:
- what every chapter looks like in its stable state;
- how every transition looks in motion;
- how long important animations take;
- what the audience sees while the presenter is speaking;
- whether scenes feel empty, amateur, template-like, too dark, too text-heavy, or visually disconnected;
- whether font hierarchy, colours, spacing, contrast, and motion feel professional.

This is an evidence pass, not a polish pass.

---

## 2. Capture mode

Use:
- Lithuanian language;
- Low quality as the primary presentation reference;
- 1920×1080 output;
- clean presentation mode;
- no debug UI;
- no Explore controls;
- no browser chrome in captured frames/video if the existing capture path supports this.

Preserve the actual current presentation behavior.

Do not artificially improve framing only for screenshots.

---

## 3. Full presentation review video

Create:

`docs/presentation-v1-review/presentation-v1-current-full-walkthrough-1080p.mp4`

This is **not** the old 48-second cinematic.

It must show the current new chapter-based presentation from Chapter 1 through Chapter 12.

Because the real speech is not final yet, simulate a presenter with fixed review holds:

- after each major chapter transition settles, hold the stable scene for ~4 seconds;
- for chapters with multiple presenter-triggered beats, trigger each beat in order and hold ~2–3 seconds after it settles;
- for looping scenes, allow at least one useful loop portion to be visible;
- for one-shot animations, show them from start to settled state;
- do not skip awkward or weak states.

The purpose is to show what the audience would actually see, not to make a highlight reel.

Expected video length may be roughly 2–4 minutes depending on current beat count.

No audio is required.

Use H.264 / yuv420p if using the existing video export workflow.

---

## 4. Accelerated transition video

Also create:

`docs/presentation-v1-review/presentation-v1-transitions-1080p.mp4`

Target ~60–90 seconds.

Show:
- every chapter-to-chapter transition;
- every important intra-chapter presenter-triggered transition;
- minimal dwell time.

This is specifically for judging:
- continuity;
- camera movement;
- easing;
- cuts/fades;
- whether the presentation feels like one experience or twelve separate slides.

Do not hide bad transitions.

---

## 5. Chapter screenshots

Create one **primary stable-state screenshot** for every chapter:

- `chapter-01.png`
- `chapter-02.png`
- ...
- `chapter-12.png`

1920×1080, Lithuanian, Low.

The frame must represent what the audience is likely to see for the longest period while the presenter is speaking.

Do NOT choose only the prettiest transition frame.

For multi-state chapters, also create additional screenshots:

### Chapter 7 — Fission
- before first absorption;
- first split;
- second/chain reaction state;
- stable/loop state if different.

### Chapter 8 — Control
- before insertion;
- after insertion.

### Chapter 9 — Energy
- reactor/natural circulation;
- turbine/generator;
- condenser/feedwater return;
- final grid/electricity state.

### Chapter 10 — Safety
- normal operation;
- power loss;
- decay heat remains;
- passive cooling active;
- `7 paros` settled state.

Use clear filenames, for example:
`chapter-10-03-decay-heat.png`.

---

## 6. Contact sheets

Create:

### A. Main 12-chapter contact sheet
`presentation-v1-contact-sheet.png`

- 12 primary chapter screenshots;
- chapter number + short LT title only;
- large enough thumbnails to judge composition and typography.

### B. Motion-critical states sheet
`presentation-v1-key-states-contact-sheet.png`

Include:
- fission states;
- control before/after;
- energy path states;
- safety sequence states.

### C. Typography / UI sheet
`presentation-v1-typography-contact-sheet.png`

Include representative screens showing:
- opening title;
- Lithuania headline/supporting text;
- 300 MW metric;
- deployment map labels/legend;
- fission labels;
- safety text / 7-day indicator;
- limitations labels;
- closing names/contact/QR area.

The point is to compare font size, weight, spacing, colour, alignment, and hierarchy across the whole presentation.

---

## 7. Projector-size screenshots

For the three chapters that currently contain the most text / smallest labels, capture at:

- 1920×1080
- 1280×800
- 1024×768

At minimum include:
- Lithuania chapter;
- deployment/map chapter;
- opening or closing contact/QR chapter.

If another chapter is more typography-heavy, include it too.

Do not alter the layout between captures except through the real responsive/letterbox system.

---

## 8. Capture objective facts

Create:

`docs/presentation-v1-review/CAPTURE-AUDIT.md`

For every chapter record:

- chapter ID/title;
- stable screenshot filename;
- number of presenter-triggered beats;
- approximate enter-transition duration;
- approximate exit-transition duration;
- whether it contains a continuous ambient loop;
- whether it contains a one-shot animation;
- visible on-screen text copied exactly;
- dominant visual subject;
- approximate percentage of frame that is visually empty/dark;
- whether the chapter is currently mostly text (`yes/no`);
- any known placeholder/TODO visible to the audience;
- approximate Low FPS during the chapter.

Do not editorialize heavily yet. This is a factual audit.

---

## 9. Add a design-token snapshot

In `CAPTURE-AUDIT.md`, record the CURRENT presentation design values actually used now:

### Typography
- font-family stack;
- font weights;
- hero/title size;
- chapter headline size;
- supporting text size;
- metric size;
- small label/kicker size;
- line-height;
- letter-spacing.

### Colour
List the actual current hex/rgb values for:
- page/stage background;
- primary text;
- secondary text;
- warm accent;
- cool/water accent;
- panel/card background if any;
- borders/dividers;
- any status colours.

### Motion
Record the current standard durations/easing used for:
- chapter transition;
- text reveal;
- metric reveal;
- map/pin reveal;
- camera transition;
- one representative object transition.

Do not normalize these values. Report what exists.

---

## 10. Do not fix before review

Do NOT in this pass:
- change fonts;
- change palette;
- increase/decrease text size;
- move chapter layouts;
- redesign Lithuania;
- improve transitions;
- add decorative graphics;
- replace empty areas;
- tune easing;
- change wording;
- add new animation;
- rewrite the story.

If you notice flaws, list them under `OBSERVATIONS` in the audit, but do not fix them yet.

Only fix a bug if it prevents a truthful capture.

---

## 11. Validation

Run only what is needed for trustworthy capture:

- `npm run check`;
- chapter navigation forward/backward;
- direct chapter jumps if debug support exists;
- clean Lithuanian presentation mode;
- 1920×1080 Low;
- projector-size capture checks;
- no visible debug UI;
- no new console errors.

Do not run a huge FULL regression suite for a capture-only pass.

---

## 12. Deliverables

The final review folder should contain at minimum:

```text
docs/presentation-v1-review/
  presentation-v1-current-full-walkthrough-1080p.mp4
  presentation-v1-transitions-1080p.mp4
  presentation-v1-contact-sheet.png
  presentation-v1-key-states-contact-sheet.png
  presentation-v1-typography-contact-sheet.png
  chapter-01.png
  ...
  chapter-12.png
  chapter-07-*.png
  chapter-08-*.png
  chapter-09-*.png
  chapter-10-*.png
  projector-*/...
  CAPTURE-AUDIT.md
```

Stop when this package is complete.

Do NOT begin the design-improvement pass afterward.

Do NOT commit visual redesigns.

Report:
- exact files created;
- video durations;
- screenshot count;
- any chapter that could not be captured cleanly;
- any placeholder/TODO still visible;
- npm/check result.

Then wait for external review.
