# Presentation v1: visual direction and polish report

**Status:** overnight polish pass done. **Stopped for owner review**: not final and not approved.
All stills are at 1920×1080 on Low, the presentation reference, unless a section says otherwise.

## 1. Design system (`src/presentation/design.ts`)

One file holds every typographic, colour and motion token. The overlay receives them as CSS
variables, and `talk.css` reads nothing else.

**Typography.** The font stack is "Segoe UI Variable Display", "Segoe UI Variable Text", "Segoe UI",
system-ui and fallbacks. These are system fonts only, so no web-font request is made.

| Role | Size at 1080p (brief range) | Pixel floor on small projectors |
|---|---|---|
| Hero title | 68 (52–72) | stage-relative |
| Headline / claim | 44 (38–52) | stage-relative |
| Metric | 96 (64–110), unit 40 | stage-relative |
| Supporting line | 23 (20–26) | 14 px |
| Kicker / chapter label | 15 / 14 (14–17) | 12 / 11 px |
| Qualifier / source note | 15 (14–16) | 12 px |
| Scene labels | 21, sub 16; limit words 26 | 13 / 12 px |

- Sizes are stage-relative (`cqh` of the 16:9 stage), so every projector shows the same
  composition. Small print never drops below its pixel floor.
- Line breaks are balanced (`text-wrap: balance` on titles, claims, captions and the counter note,
  `pretty` on notes). No caption leaves a one-word widow, and two-line captions stay clear of the
  scene beside them. This was added tonight after the 1080p and 1024×768 checks.

**Colour.**

| Token | Value | Use |
|---|---|---|
| text | `#f2f4f6` | main text |
| text-2 | `#c5cacf` | supporting lines |
| qualifier | `#a7adb3` | sources and qualifiers |
| accent | `#e8a33d` | "look here": the current idea, metric units, the pin under construction |
| muted | `#9aa1a8` | secondary pins and labels |
| background | `#0b0c0e` | near-black |
| water / steam / electricity | `#5c9cc3` / `#e8edf0` / `#f4ead6` | the 3D scene's own flow colours |

- There is no nuclear green, neon cyan, purple, large gradient or glow. The football pitches use a
  muted turf tone, because they are pitches.
- **Contrast** (WCAG ratio) was measured against what is really behind the text in the final
  stills:

  | Text | Background behind it | Ratio |
  |---|---|---|
  | Supporting caption | lit floor `#34373a` (months fact) | 7.2:1 |
  | Supporting caption | the sea `#010e1a` (Lithuania) | 11.8:1 |
  | Qualifier, worst case | the Lithuania map `#22292f` | 6.5:1 |
  | Qualifier, typical | dark floor | 8.4–8.6:1 |

  Against the near-black background, text is 17.7:1, text-2 11.9:1, qualifier 8.6:1 and accent
  9.1:1. Everything is above 4.5:1, which leaves headroom for a washed-out projector.
- No important line is 1 px. Leader lines and rules are at least 2 px at 1080p, and the
  counter bar is 3 px.

**Motion.**
- Major moves (camera, scale, reveal) take 0.8–1.6 s, and up to 3 s for the plant ↔ map zooms,
  which are a single continuous move. Text enters in 0.45 s with a 12 px rise and leaves in
  0.35 s.
- Count-ups run once, over 1.6–1.8 s.
- There is no fade to black between chapters, and no wipe, bounce, whip pan or roll. Only the very
  first beat fades in. R, and backward steps or jumps where the camera's look-at point moves more
  than 600 m, use a short dip (0.42 s out, 0.65 s back) instead of a long fly-through.
- A slow camera drift (±1.6° azimuth, 41 s / 29 s periods) keeps every hold alive without
  pulling attention.

## 2. Chapter audit

| # | Chapter | Dominant visual | Ambient state on a hold |
|---|---|---|---|
| 1 | Hook | the whole plant in a 3/4 hero view; presenters and QR | drift, grid pulses, lit hall |
| 2 | Lithuania | the country as a lit table: wind farms, solar fields, cities, lines, interconnectors | rotors turning, flow pulses, node pulse |
| 3 | Scale | our plant beside a generic ~1,500 MW unit, then five BWRX-300 units in a row | drift (assembly runs once) |
| 4 | Three facts | our plant up close; two true-scale pitches beside the power block | drift |
| 5 | Projects | the North Atlantic with status-styled pins, then Darlington | focus ring, drift |
| 6 | Handoff | map → pin → plant → the approved descent into the core | drift; hold on the open core |
| 7 | Fission | a complete second fission in the micro view from a fuel spot | the chain loops (8.6 s period) |
| 8 | Control | the blades in plan, in copper, against the bundles | reaction glints at the current level |
| 9 | Energy | the vessel flows, steam path, turbine, condenser loop and grid line, then the city | every flow runs, shaft spins, city lit |
| 10 | Safety | the same running plant goes dark; the passive loop over the pools; 0 h → 7 paros | passive loop runs (counter runs once) |
| 11 | Limits | the opened plant, wide, with three words around it | passive loop at reduced intensity, drift |
| 12 | Closing | the reverse journey out, onto the opening composition | grid pulses, drift; holds for Q&A |

**Fixed in this pass:**
- **Grid beat** (`P.grid`, chapter 9): the plant, the source of the power, was cut by the left
  edge and the city was clipped on the right. The camera now frames the whole plant, the line and
  the city along a diagonal (stat → plant → line → city). This beat's fog moves out to 900–1500 m,
  so the plant (about 920 m from the camera) is no longer greyed out. The studio floor's edge
  still sinks into the fog.
- **Captions**: the months caption ran into the reactor building with a widowed "įkrovimo". It is
  now balanced over two lines and clear of the building at 1080p and 1024×768 (see §1).
- **Pitches wording**: the caption said the power block *occupies* about two pitches ("tiek ploto
  užima"). It now says *fits within* them ("jose telpa visas energetinis blokas"), which is what
  the vendor says. GD's 9,800 m² is about 1.4 pitches.
- **Paused 48 s film**: "Tęsti" is the primary button again, as it was before the talk existed.
  "Pradėti pristatymą" sits beside it as secondary.
- **English count-ups**: the numbers now end on each language's own copy: "50%" and "≈ 300,000"
  in English, "50 %" and "≈ 300 000" in Lithuanian. Before, the Lithuanian "50 %" was
  hard-coded for both.

**Checked, already in place:** the blackout dims the whole site (`exteriorDim` 1, hall lights
0.08). The Lithuania assessment view warms the country with no text over the map.

## 3. Continuity between chapters

No transition uses a black cut. Each row is one key press, except 5→6, which takes two (land,
then descend).

| | Brief | Implemented |
|---|---|---|
| 1→2 | the electrical path pulls up to Lithuania | The camera rises. The plant and its line shrink into a node (scale 10⁰ → 10⁻²·⁶ over 3 s), while the Lithuania table reveals radially from that node. Flows start from it. |
| 2→3 | a stable node becomes the BWRX-300; a large plant appears | Down into the node: the plant grows back out as the map closes, and the large unit rises beside it. |
| 3→4 | the comparison falls away | The large unit and the modules lower away; the fog returns to normal; our plant stays. |
| 4→5 | the plant becomes a point on the map | Up again: the plant shrinks into the Darlington pin as the North Atlantic opens around it. |
| 5→6 | map → site → plant → building → underground → vessel, no title card | Into the pin: the plant grows out of it onto the approved hero view. Then the approved Stage 3 descent, replayed from the frozen master (0–15.4 s). |
| 6→7 | dive into the fuel | From the open core, the micro view opens out of a spot on the fuel. |
| 7→8 | reverse scale back to the blades | The micro view closes back into the fuel spot as warmth. The camera pulls back to the bundles, then the blades. |
| 8→9 | settle; flow begins | Blade emphasis fades and the glints settle. Water starts rising and boiling. |
| 9→10 | do not reset the plant | From the city back to the same running plant: flows, turbine and grid stay on. Nothing reloads. |
| 10→11 | widen | From the pools out to a wide view of the opened plant. The passive loop keeps running. |
| 11→12 | return to the opening | The reveal closes layer by layer as the camera rises out. The lights and the grid come back, and the camera lands on the opening composition. |

## 4. Performance

Measured on this laptop: Intel Iris Plus with the D3D11 backend, Chrome. That is a weaker GPU
than a typical presentation PC. The test is a full presenter walkthrough with real key presses,
at 1920×1080.

- **Low** (presentation reference, portable default): **60 fps on every beat**, p95 16.8 ms,
  worst single frame 17.6 ms on the final build. An earlier run had one 49.9 ms frame on entering
  the turbine beat (most likely first-time shader compilation); it did not recur.
- **High** (smoke test): all functional checks pass. The exterior and map beats stay at 60 fps.
  The interior close-ups dip:

  | Beat | fps |
  |---|---|
  | control / insert / withdraw | 43.4–49.3 |
  | safety scram / decay | 43.0–47.2 |
  | energy | 51.5–57.8 |
  | fission | 54.8–57.0 |

  This is the same cost the approved 48 s film has at High on this machine, measured tonight: the
  film's control segment runs at 41.6 fps and its flow and turbine segments at 45.5–54 fps. The
  talk adds no cost to these views. High remains an option for a stronger GPU.
- **Worst new scenes on Low:**
  - safety overview: 119 draw calls, 126 k triangles
  - grid and city: 117 draw calls, 113 k triangles
  - condenser and water cycle: 110 draw calls, 104 k triangles

  All three hold 60 fps.
- **Bundle:** the main chunk grows 907 → 1103 kB (+72 kB gzip), with the same chunk structure.
  That includes 95 kB of map data, inlined so nothing is fetched at runtime. The portable single
  file is 1.66 MB.

## 5. Projector sizes

Every beat was rendered at three sizes; see `compat/`.

| Size | Stage | Result |
|---|---|---|
| 1920×1080 | full frame | reference |
| 1280×800 (16:10) | 1280×720, thin bars | composition identical; all text legible |
| 1024×768 (4:3) | 1024×576, bars top and bottom | composition identical; small print sits at its floor (qualifier 12 px, supporting 14 px); legible |

Lithuanian diacritics (ą č ę ė į š ų ū ž) render correctly at every size in the system font. No
line overflows, and no label collides with another label after the balancing fix.

## 6. Visual completeness

| # | Chapter | Dominant visual | Meaningful transition in | Stable ambient state | No text-only placeholder |
|---|---|---|---|---|---|
| 1 | Hook | YES | YES (fade-in, rise) | YES | YES (a) |
| 2 | Lithuania | YES | YES | YES | YES |
| 3 | Scale | YES | YES | YES | YES |
| 4 | Three facts | YES | YES | YES | YES |
| 5 | Projects | YES | YES | YES | YES |
| 6 | Handoff | YES | YES | YES | YES |
| 7 | Fission | YES | YES | YES | YES |
| 8 | Control | YES | YES | YES | YES |
| 9 | Energy | YES | YES | YES | YES |
| 10 | Safety | YES | YES | YES | YES |
| 11 | Limits | YES (b) | YES | YES | YES |
| 12 | Closing | YES | YES | YES | YES (a) |

- (a) The presenter figures, Virgilijus's e-mail and the QR are deliberate placeholders: no
  likenesses, no final QR, nothing guessed.
- (b) The weakest dominant visual; see §7.

## 7. The weakest three

1. **Limits (chapter 11).** Three restrained words around a view of the plant the audience has
   already seen. It is calm and honest, but it is the only chapter whose words have no dedicated
   image.
   - *Next step:* give each word a small, factual visual cue. For example, the spent-fuel pool
     region for ATLIEKOS, a stack of review documents beside the plant for LICENCIJAVIMAS, and
     the first unit highlighted alone for PIRMŲJŲ PROJEKTŲ RIZIKA.
2. **Scale (chapter 3).** The comparison reads, but the ~1,500 MW unit is generic massing. The
   five-unit row is seen from far away, so the units are small, and the large unit's X-ray ghost
   is faint.
   - *Next step:* a lower, closer camera for `modules`, so the row has presence, and keep the
     large unit at half opacity rather than a ghost.
3. **Grid and city (chapter 9, last beat).** It is now framed correctly, but the plant is small
   and dark at 920 m, and the city is generic boxes.
   - *Next step:* lift the plant's light pool for this beat only, and add a light trail along the
     line in time with the count-up.

**Runner-up: the blackout (chapter 10).** It reads clearly in motion, as lights go out and the
turbine winds down. In a still it is just a darker frame. The caption carries it.

**Known minor artifact (existing scene, not new):** in steep top-down views such as the pitches
beat, the site ground shows faint single-pixel dots along arcs.
- Hiding the `site-ground` mesh removes them, and they are also present in Explore at the same
  camera pose with the talk released.
- Disabling shadow receiving does not remove them, so this is not shadow acne.
- Not fixed tonight, because that surface is shared with the frozen 48 s film.
