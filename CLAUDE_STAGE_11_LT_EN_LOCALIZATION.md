# Claude Code Prompt — Stage 11 Localization Polish: Lithuanian Default + English Toggle

Stage 11 is otherwise approved. This is a targeted localization/delivery polish to complete **before Stage 11 is committed**.

Read:
- `DEVELOPMENT_RULES.md`
- `docs/stage11-review/STAGE11-REPORT.md`

If the Low-at-Windows-scaling micro-polish has not yet been applied, finish that first and keep this localization work separate in the diff.

Do **not** start Stage 12.
Do **not** redesign the 3D story, cameras, timing, materials, geometry, or scientific animations.

---

## Goal

The university presentation will be delivered in **Lithuanian**.

Make **Lithuanian the default audience-facing language**, while preserving the ability to switch the application to **English**.

The application should feel intentionally localized, not mechanically translated.

---

# 1. Language model

Add a very small internal localization system. Do not add a large i18n dependency unless there is a compelling technical reason.

Use a central typed string dictionary, for example:

- `lt`
- `en`

Requirements:

- default language: **Lithuanian (`lt`)**
- visible language selector: **LT / EN**
- language can be changed only while the cinematic is not actively playing
- changing language must not reload/remount the 3D scene
- remember the user's selection with `localStorage` where available
- if storage is unavailable, simply fall back to Lithuanian
- English strings must remain the current approved English wording wherever possible

Keep source code, IDs, component keys, comments, developer documentation and debug-only developer diagnostics in English. The localization requirement applies to **audience-facing production text**.

---

# 2. Translate all production-facing text

Translate every production string the audience can encounter, including:

### Setup / presentation UI
- Start presentation
- Resume
- Quality
- High
- Low
- Reset view
- Full screen

### Explore controls
- X-ray
- Section
- Plant
- Reactor
- Flow
- Control
- Safety
- Isolate
- Labels
- Reset
- Focus
- close buttons/tooltips where text is present

### Component labels and descriptions
Translate every component title and every one-sentence description currently coming from the component registry / metadata.

Examples include:
- Containment
- Reactor vessel
- Reactor core
- Control blades
- Guide tubes
- Control rod drives
- Steam separators
- Steam dryer
- Downcomer
- and all remaining production-visible component labels

### Stage 10 fission text
Lithuanian default:
- `neutron` → **`neutronas`**
- `U-235` → **`U-235`**
- `energy → heat` → **`energija → šiluma`**

English mode must retain:
- `neutron`
- `U-235`
- `energy → heat`

### Status / failure / fallback UI
Translate:
- loading / ready wording if shown
- WebGL2 unavailable message
- render-crash message
- graphics-reset message
- Restart 3D
- Restart in low quality
- Reload page
- Play the backup video
- Close video
- missing-video message
- any other production error/recovery text

### Portable instructions
Create:
- `START-HERE-LT.txt`
- `START-HERE-EN.txt`

Lithuanian should be the primary/recommended instructions.

If retaining a single `START-HERE.txt` for convenience, make it Lithuanian-first and point to the English file.

---

# 3. Translation style

Audience: university students from mixed backgrounds, mostly with no nuclear-engineering knowledge.

Use **clear, natural Lithuanian**, not word-for-word translation.

Priorities:
1. scientifically correct,
2. understandable to a non-specialist,
3. short enough to work on a projector,
4. consistent terminology throughout.

Prefer established Lithuanian technical terms when they are familiar and concise.

Avoid unnecessarily bureaucratic or highly academic wording.

Where a literal technical translation would be confusing, use the clearest scientifically accurate Lithuanian wording.

Do not put Lithuanian and English on screen simultaneously; the language switch is enough.

---

# 4. Recommended terminology baseline

Use these as the starting vocabulary unless an existing Lithuanian technical source in the project clearly supports a better term:

| English | Lithuanian |
|---|---|
| Reactor | Reaktorius |
| Nuclear power plant / plant | Atominė elektrinė / Jėgainė (choose by context) |
| Reactor vessel | Reaktoriaus slėginis indas |
| Reactor core | Reaktoriaus aktyvioji zona |
| Containment | Apsauginis gaubtas |
| Control blades | Valdymo mentės |
| Guide tubes | Kreipiamieji vamzdžiai |
| Control rod drives | Valdymo strypų pavaros |
| Steam separators | Garo separatoriai |
| Steam dryer | Garo džiovintuvas |
| Downcomer | Žemyntekmės kanalas |
| Steam | Garai |
| Water | Vanduo |
| Heat | Šiluma |
| Neutron | Neutronas |
| Fission | Branduolio dalijimasis |
| Decay heat | Liekamoji skilimo šiluma |
| Natural circulation | Natūrali cirkuliacija |
| Isolation condenser | Izoliacinis kondensatorius |
| Turbine | Turbina |
| Generator | Generatorius |

If a term such as `control blades` is more understandable in Lithuanian with a short explanatory description, keep the label short and put the clarification in its one-sentence description rather than lengthening the label.

---

# 5. Layout and projector constraints

Lithuanian text is often longer than English.

The language work must not break Stage 11's projector-safe layout.

Test Lithuanian at:

- 1920×1080
- 1280×800
- 1024×768

Check at minimum:
- setup bar
- LT / EN selector
- Explore bottom bar
- selected-component card
- floating label/description card
- Steam dryer / Steam separators view
- Reactor core
- Control blades
- Guide tubes
- Control rod drives
- failure/fallback screen
- Stage 10 fission labels

Requirements:
- no clipping,
- no overlap with the subject,
- no text extending outside the 16:9 stage,
- no unreadably tiny type,
- no accidental extra third row of controls at 1024×768 if avoidable.

The cinematic UI remains hidden while playing.

---

# 6. Language selector UX

Add a compact language selector in the setup bar when idle / Explore.

Preferred appearance:
`LT | EN`
or two small segmented buttons matching the existing visual system.

Rules:
- LT active by default
- hidden during cinematic playback with the rest of the setup UI
- selection survives a quality remount
- selection survives Reset
- selection should survive page reload through localStorage when possible
- no modal dialog
- no flag icons

Optional keyboard shortcut only if it is clean and does not conflict with existing controls. A visible selector is required regardless.

---

# 7. Fallback video language

The portable fallback must match the chosen presentation language.

For the **Lithuanian presentation package**:

- render a fresh full 48 s Lithuanian fixed-step H.264 fallback:
  `BWRX300-fallback-lt.mp4`

For English:
- the already-approved Stage 11 English 48 s candidate may be reused as
  `BWRX300-fallback-en.mp4`
  if sample verification confirms English mode is visually identical to the approved Stage 11 build.

Portable behavior:
- if current language is LT, **Play backup video** uses the Lithuanian fallback
- if current language is EN, it uses the English fallback

Portable folder target:

```text
BWRX300/
  BWRX300.html
  BWRX300-fallback-lt.mp4
  BWRX300-fallback-en.mp4
  START-HERE.txt
  START-HERE-LT.txt
  START-HERE-EN.txt
```

If keeping both fallback files complicates the build substantially, stop and report before simplifying. Do not silently ship English video for Lithuanian mode.

---

# 8. Determinism / content contract

Language must be presentation state only.

Do not change:
- master timing,
- camera poses,
- reveal timing,
- flow timing,
- control state,
- safety state,
- fission physics,
- materials,
- 3D geometry.

English mode at 1920×1080 should reproduce the approved Stage 11 image wherever no new language selector UI is visible.

Lithuanian mode is expected to differ only where production text is rendered.

---

# 9. Validation — targeted, not another complete Stage 11 FULL run

Run:

1. `npm run check`
2. `npm run build:portable`
3. English mode:
   - compare representative master frames to the approved Stage 11 build
   - especially 18.2 s fission and all non-text chapters
4. Lithuanian mode:
   - fixed-step checks at approximately:
     - 16.5
     - 17.3
     - 18.2
     - 19.0
     - 45.3 s
5. language switching:
   - LT → EN → LT
   - survives quality remount
   - survives Reset
   - persists after page reload where localStorage works
6. layout screenshots in Lithuanian:
   - 1920×1080
   - 1280×800
   - 1024×768
7. fallback screen in both languages
8. portable `file://` startup in Chrome or Edge
9. no external requests
10. no new console errors

Do not rerun:
- dense 379-frame Stage 10 regression,
- all navigation/focus suites,
- soak tests,
- full performance matrix,

unless localization unexpectedly touches those systems.

---

# 10. Review deliverables

Create a small localization section inside `docs/stage11-review/`.

Required:

- `stage11-lt-final-candidate-1080p.mp4` — full Lithuanian 48 s candidate
- 3 Lithuanian UI stills:
  - 1920×1080
  - 1280×800
  - 1024×768
- one LT/EN comparison sheet showing:
  - fission labels
  - one Explore component card
  - failure/fallback screen
- short `Stage 11 localization polish` section appended to `STAGE11-REPORT.md`

Report:
- exact files changed,
- translation architecture,
- whether any wording was shortened for layout,
- language persistence behavior,
- portable folder contents,
- validation result.

---

# 11. Stop point

Do not commit Stage 11 after this localization work.

Stop and wait for review.

Stage 12 will handle:
- final university-PC rehearsal,
- final USB/Drive packaging,
- presenter instructions,
- public-speaking narration and timing.
