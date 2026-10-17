# Presentation v1: the story, chapter by chapter

**Status:** working draft for owner review. **Not final** and not approved. Branch `presentation-v1`.
The spoken text is not written yet. "Spoken idea" below is what each chapter has to get across, not
the speech.

**Central idea:** *SMR nekeičia branduolinės fizikos. Jis keičia tai, kaip branduolinę energetiką
galime statyti ir plėsti.* The talk never claims the whole reactor is built in a factory or
delivered complete. On screen the idea becomes "ta pati fizika – kitas mastelis" (Scale) and
"Ta pati fizika. Kitas mastelis." (closing).

**Format:** one continuous interactive WebGL scene, not slides. 12 chapters, 32 beats. The camera
never cuts away from the world. Maps lie on the ground at the plant, and the plant shrinks into its
point on them and grows back out. Only the very first beat fades in from black. Every beat waits for
the presenter's key. Target times are speaking guides, not timers.

**Speakers:** Virgilijus Kiltinavičius 0:00–3:15, Timofej Gaivoronskij 3:15–7:00. The handoff
(chapter 6) is the flexible point between them. Q&A is separate and starts on the closing frame,
which holds indefinitely.

## Presenter controls

| Key | Action |
|---|---|
| → / Space / PageDown | next beat (a second press during a transition is ignored) |
| ← / PageUp | previous beat (settles straight into it) |
| Home | back to the opening |
| R | safe reset of the current beat (short dip, the beat re-established) |
| Esc | leave to Explore (free camera). → re-enters where the talk was left |

- **Starting:** "Pradėti pristatymą" in the setup bar, or → in Explore.
- **48 s film:** still available separately as "48 s filmas".
- **Debug:** `?presentationDebug` opens a beat list for direct jumps, beat inspection and "copy
  camera pose". With `?debug` (or in dev), T toggles it. None of it appears in the audience view.
- **Audience view:** no Explore UI, X-ray, section, quality or debug controls, and no stage numbers.
  Only a tiny chapter label at the top left, hidden on the opening, the handoff and the closing.

## Timing overview

| # | Chapter (id) | Speaker | Target | Beats |
|---|---|---|---|---|
| 1 | Hook (`hook`) | Virgilijus | 0:00–0:30 | hero |
| 2 | Lithuania (`lithuania`) | Virgilijus | 0:30–1:05 | renewables · calm · assessment |
| 3 | Scale (`scale`) | Virgilijus | 1:05–1:45 | large · modules |
| 4 | Three facts (`facts`) | Virgilijus | 1:45–2:25 | power · pitches · months |
| 5 | Projects (`projects`) | Virgilijus | 2:25–3:00 | world · darlington |
| 6 | Handoff dive (`handoff`) | both | 3:00–3:30 | land · descend |
| 7 | Fission (`fission`) | Timofej | 3:30–4:05 | micro · inFuel |
| 8 | Control blades (`control`) | Timofej | 4:05–4:35 | blades · insert · withdraw |
| 9 | Atom to electricity (`energy`) | Timofej | 4:35–5:25 | boil · steam · turbine · condenser · grid |
| 10 | Passive safety (`safety`) | Timofej | 5:25–6:15 | normal · blackout · scram · decay · ics · days |
| 11 | Limits (`limits`) | Timofej | 6:15–6:35 | limits |
| 12 | Closing (`close`) | both | 6:35–7:00 | return · qa |

Source statuses (`src/presentation/sources.ts`):
- **OFFICIAL:** regulator, operator, government or design document.
- **VENDOR:** a GE Vernova claim or estimate, labelled as such on screen.
- **DERIVED:** our own arithmetic.
- **ILLUSTRATIVE:** a visual comparison, not a technical equivalence.

---

## 1. Hook (`hook`), Virgilijus, 0:00–0:30

- **Spoken idea:** what if a nuclear plant were not one giant project, but something we could grow
  module by module? Who we are.
- **On screen:**
  - Title: kicker "MAŽIEJI MODULINIAI REAKTORIAI", title "BWRX-300".
  - Presenter placeholders with names and e-mails. Timofej's e-mail is real; Virgilijus's shows
    `VIRGILIJUS_EMAIL_TODO`.
  - QR placeholder "Interaktyvus modelis / QR kodas bus čia".
  - EN: "Small modular reactors", "Interactive model".
- **Beat:** `hero`. Fades in low on the reactor building, and the camera rises into a 3/4 hero
  view over 6.5 s. In order: the plant, then the presenters (2.6 s), the title (3.6 s), the QR
  (4.6 s).
- **Ambient loop:** a slow camera drift (≈1.6° over 41 s / 29 s periods), electricity pulses along
  the line to the grid, lit hall glazing.
- **Facts:** none.
- **Unresolved:** placeholder figures, Virgilijus's e-mail (`VIRGILIJUS_EMAIL_TODO`, not guessed)
  and the QR target (`PUBLIC_PRESENTATION_URL_TODO`, not invented).

## 2. Lithuania (`lithuania`), Virgilijus, 0:30–1:05

- **Spoken idea:** renewables already cover half of our electricity. A power system also needs
  generation it can control when the weather changes. Lithuania is officially assessing this
  reactor. The talk does not argue against renewables.
- **On screen:**
  - "50 %": "Lietuvos elektros poreikio 2025 m. patenkino atsinaujinanti energetika" (Šaltinis:
    „Litgrid“, 2026-01-28).
  - "O kai nėra vėjo ir saulės?" with "Sistemai reikia ir valdomos gamybos", and the label
    "importas".
  - "Lietuva vertina BWRX-300", "2026 m. vasario memorandumas" (Šaltinis: LR energetikos
    ministerija, 2026-02-25).
- **Beats:**
  - `renewables`: the camera rises from the hero view. The plant shrinks into a grid node while
    the Lithuania table opens around it (radial reveal from the plant, no cut). Wind turbines
    turn, solar fields shine, power flows to the cities, and "50 %" counts up once.
  - `calm`: a calm night. The turbines slow, the sun sets, local flows fade, imports grow along
    the interconnectors, and a controllable node lights up.
  - `assessment`: the country warms (highlight), with the memorandum line.
- **Ambient loop:** rotors turning, flow pulses on the lines and interconnectors, city glows, the
  node pulse.
- **Facts:**
  - `ltRenewables2025`: Litgrid annual review 2026-01-28. OFFICIAL.
  - `lithuaniaMou`: LR Ministry of Energy, 2026-02-25. OFFICIAL.
  - `loadFollowing`: GD Rev J Table 21-2. Speaker context only. OFFICIAL.
- **Unresolved:** wind and solar positions are illustrative. The node the plant shrinks into is a
  generic point, not a site. Vilnius is not marked exactly, as instructed.

## 3. Scale (`scale`), Virgilijus, 1:05–1:45

- **Spoken idea:** an SMR doesn't change the physics, it changes the unit size. One ~1,500 MW
  block versus five ~300 MW units built one after another.
- **On screen:**
  - Labels "~1 500 MW / didelis blokas" and "~300 MW / BWRX-300".
  - Stat "5 × 300 MW" with "ta pati fizika – kitas mastelis".
  - Caption "Vienodi blokai – statomi vienas po kito".
  - Note "Iliustracinis galios palyginimas, ne techninis atitikmuo".
- **Beats:**
  - `large`: down into the node. The plant grows back out as the map closes, and a generic
    ~1,500 MW unit rises beside it in a staggered build.
  - `modules`: four more BWRX-300 units assemble one after another behind ours, while the large
    unit steps back into an X-ray ghost.
- **Ambient loop:** camera drift only. The assembly runs once and then holds.
- **Facts:**
  - `largeUnit`: ABWR/ESBWR reference values from GD Table 2-1. ILLUSTRATIVE.
  - `outputNet`: OFFICIAL.
  - `smrDefinition`: IAEA. OFFICIAL.
- **Unresolved:** the large unit is generic massing, not a specific design. This is a capacity
  comparison only.

## 4. Three facts (`facts`), Virgilijus, 1:45–2:25

- **Spoken idea:** three numbers. About 300 MW of electricity. The power block fits within two
  football pitches. 24–36 months of construction for a series unit, which is the vendor's
  estimate.
- **On screen:**
  - "~300 MW", "elektros galia, vienas blokas".
  - "≈ 2 futbolo aikštės", "jose telpa visas energetinis blokas", with the note "Gamintojo
    (GE Vernova) duomenys: blokas telpa dviejose tarptautinėse futbolo aikštėse".
  - "24–36 mėn.*", "statyba: nuo pirmojo betono reaktoriaus pastate iki kuro įkrovimo", with the
    note "*Gamintojo įvertis serijiniam blokui; be licencijavimo ir finansavimo".
- **Beats:**
  - `power`: the comparison falls away, our plant remains, and "~300" counts up once.
  - `pitches`: two FIFA-size pitches (105 × 68 m) wipe on beside the power block at true scale,
    seen from a steep angle.
  - `months`: close on the plant, with the number and its qualifier.
- **Ambient loop:** camera drift only.
- **Facts:**
  - `outputNet`: GD Table 21-2, "~300 MWe (net to grid)". OFFICIAL.
  - `footprint`: GE Vernova page. VENDOR.
  - `constructionTime`: GE Vernova page. VENDOR.
- **Unresolved:**
  - GE Vernova says 24–36 months. The newer GD Rev J says 30–36 months, and under 30 months for
    a series unit. Both are vendor estimates, and the qualifier says so.
  - The GD power-block envelope of 9,800 m² is about 1.4 pitches. "≈ 2" follows the brief and
    the vendor's "fits within two", so the caption says "jose telpa" (fits within), not "užima"
    (occupies).
  - The wording "pirmojo betono reaktoriaus pastate" for "first nuclear concrete" needs the
    owner's check.

## 5. Projects (`projects`), Virgilijus, 2:25–3:00

- **Spoken idea:** this isn't a concept. The first unit is being built in Canada, the US has a
  construction permit, Poland is licensing, and others are planning or assessing.
- **On screen:**
  - Legend: statoma / licencijavimas / planuojama / vertinama.
  - "Darlingtonas, Kanada – statoma".
  - "Clinch River, JAV – leidimas statyti, 2026 m.".
  - "Lenkija – licencijavimas", "Estija – planuojama", "Lietuva – vertinama".
  - Notes: sources CNSC, US NRC, GE Vernova Hitachi, LR energetikos ministerija (2025–2026), and
    "CNSC statybos licencija – 2025 m. balandžio 4 d.".
- **Beats:**
  - `world`: the camera rises again. The plant becomes the Darlington pin as the North Atlantic
    map opens, and the other pins appear one by one, styled by status:
    - solid warm: under construction;
    - outlined warm: licensing;
    - muted: planned;
    - outlined muted: assessing.
  - `darlington`: the camera glides to Canada, a focus ring marks Darlington, and the other pins
    step back.
- **Ambient loop:** the focus ring on Darlington, camera drift. The pins appear once.
- **Facts:**
  - `darlington`: CNSC. OFFICIAL.
  - `clinchRiver`: US NRC release 26-079, 2026-09-29. OFFICIAL.
  - `poland`: GD §1 and ORLEN. OFFICIAL.
  - `estonia`: GE Vernova page. VENDOR.
  - `lithuaniaMou`: OFFICIAL.
- **Unresolved:**
  - The Estonia and Lithuania pins mark countries, not sites. Statuses are as of 2026-10-17.
  - The US pin is a permit, not construction.
  - Sweden is deliberately left out, because Vattenfall chose another vendor.

## 6. Handoff dive (`handoff`), both, 3:00–3:30

- **Spoken idea:** Virgilijus has explained why this matters. Timofej now explains how the machine
  makes electricity: from the map into the plant and down to the core, in one move.
- **On screen:** nothing. No title card, by design.
- **Beats:**
  - `land`: into the Darlington pin. The plant grows out of it as the map closes, landing on the
    approved hero view. The two presenters change over here.
  - `descend`: the approved Stage 3 descent, replayed exactly from the frozen master timeline
    (0–15.4 s): ground, shaft, containment, and the vessel opening on the core.
- **Ambient loop:** camera drift on `land`. `descend` holds on the open core.
- **Facts:** none.
- **Unresolved:** the pause sits on the plant exterior between the dive and the descent: two
  presses, no cut.

## 7. Fission (`fission`), Timofej, 3:30–4:05

- **Spoken idea:** where the heat starts. A neutron splits a U-235 nucleus into two fragments,
  releasing heat and 2–3 new neutrons, and one of them splits the next nucleus: a chain reaction.
- **On screen:**
  - Micro labels "neutronas", "U-235", "energija → šiluma", "nauji neutronai", "grandininė
    reakcija".
  - Note "Schema, ne mastelis".
  - "Tai vyksta kure".
- **Beats:**
  - `micro`: from a spot on the fuel the micro view opens. Neutron → U-235 → split → heat → new
    neutrons → a second complete split.
  - `inFuel`: the micro view closes into the fuel spot as warmth.
- **Ambient loop:** the complete chain loops calmly (8.6 s period, fading in and out at the loop
  seam). The fuel spot stays warm.
- **Facts:**
  - `fissionNeutrons`: NRC glossary and DOE handbook. OFFICIAL.
  - `coreCounts`: OFFICIAL.
- **Unresolved:** schematic, with 96 spheres per nucleus. Neutron moderation is not drawn.

## 8. Control blades (`control`), Timofej, 4:05–4:35

- **Spoken idea:** control blades between the fuel bundles absorb neutrons. Further in, fewer
  fissions and a weaker reaction. Further out, a stronger one.
- **On screen:**
  - Label "valdymo mentės / sugeria neutronus".
  - "Daugiau įstumta → mažiau reakcijų", "Mažiau įstumta → daugiau reakcijų".
  - Note "Iliustracinis judesys".
- **Beats:**
  - `blades`: from the warm spot back out to the bundles, then the blades in plan, in copper,
    with the reaction cue (glints) at full.
  - `insert`: the blades move in and the glints thin out.
  - `withdraw`: the blades move back out and the glints return.
- **Ambient loop:** the reaction glints keep twinkling at the current level. The blades hold their
  position.
- **Facts:** `coreCounts` (57 blades, 240 bundles). OFFICIAL.
- **Unresolved:**
  - A representative blade pattern with time-compressed motion. The glint cue is not MW or %.
  - Terminology: "valdymo mentės" (blades) versus the common "valdymo strypai" (rods), and
    "įstumta" (pushed in). The owner should choose; see the validation report.

## 9. Atom to electricity (`energy`), Timofej, 4:35–5:25

- **Spoken idea:** one continuous journey. Heat in the fuel boils water. Steam rises, is dried,
  and drives the turbine and the generator. The condenser turns it back into water, which returns
  to the reactor, and electricity goes to the grid.
- **On screen:**
  - Labels "vanduo kyla", "verda", "separatoriai", "džiovintuvas", "turbina", "kondensatorius",
    "vanduo grįžta į reaktorių", "generatorius".
  - "≈ 300 000 namų ūkių*", with the note "*Gamintojo iliustracinis įvertis; miestas – ne
    konkreti vieta".
- **Beats:**
  - `boil`: natural circulation. Water rises and boils in the core, the mixture rises through the
    chimney, and cooler water returns down the sides.
  - `steam`: the separators and the dryer; dry steam leaves the vessel.
  - `turbine`: steam runs along the main steam line, and the shaft starts turning.
  - `condenser`: the condenser under the low-pressure turbines turns the exhaust back into water,
    and the feedwater line runs back to the vessel nozzle. The water cycle visibly closes.
  - `grid`: electricity leaves the hall through the transformer and runs along six spans of line.
    The camera pulls out until the plant, the line and the city are all in frame, the city lights
    up, and "≈ 300 000" counts up once.
- **Ambient loop:** all flows keep running: water, mixture, steam, condensate, feedwater. The
  shaft spins, power pulses run along the line, and the city windows stay lit.
- **Facts:**
  - `naturalCirculation`: OFFICIAL.
  - `condenserLoop`: GD §5.1. OFFICIAL.
  - `homes`: GE Vernova. VENDOR.
- **Unresolved:** one main steam line is drawn (the design has two). Pumps, feedwater heaters and
  the cooling-water system are simplified away.

## 10. Passive safety (`safety`), Timofej, 5:25–6:15

- **Spoken idea:** external power is lost. The chain reaction stops, but the heat doesn't
  (*elektra dingo ≠ šiluma dingo*). Isolation condensers in pools above the reactor remove the
  heat by natural circulation: no pumps, no external power, seven days without operator action.
- **On screen:**
  - Captions in order: "Įprastas darbas", "Dingo išorinis elektros tiekimas", "Grandininė
    reakcija sustabdoma", "Bet šiluma nedingsta".
  - Meters "DALIJIMASIS ≈ 0 / ŠILUMA ≠ 0".
  - "Pasyvusis aušinimas", "be siurblių, be išorinės elektros", and the label "šiluma – į
    baseiną".
  - Counter 0 h → 6 h → 12 h → 1 para → … → 7 paros, with the note "*Be operatorių veiksmų; tam
    pakanka 2 iš 3 kontūrų (GE Vernova Hitachi, GD Rev. J §3.3)".
- **Beats:**
  - `normal`: back from the city to the plant, still running. Nothing is reset (no cut since
    chapter 9).
  - `blackout`: the line goes dark, the hall lights go out, and the site dims. Steam stops and the
    turbine winds down over 7 s. There is no red flashing.
  - `scram`: every blade goes in, and the glints die out.
  - `decay`: the vessel stays warm, shown by the meters.
  - `ics`: the vessel cut closes and the pools open. Steam rises to the submerged condensers, heat
    goes into the pool, and water returns by gravity.
  - `days`: time runs once from 0 h to 7 paros, then stops.
- **Ambient loop:** the passive loop keeps running (steam up, condensate down, warm pool). The
  counter runs once and holds at 7 paros.
- **Facts:**
  - `icsTrains`: GD §3.3. OFFICIAL.
  - `icsSevenDays`: GD §3.3: "two trains… seven days without operator action", and "no AC
    power". OFFICIAL.
  - `decayHeat`: DOE handbook. OFFICIAL.
- **Unresolved:**
  - All three trains are drawn running, while the narration says two are enough. The pool and IC
    layout is approximate.
  - "be išorinės elektros" paraphrases the GD's "no AC power".

## 11. Limits (`limits`), Timofej, 6:15–6:35

- **Spoken idea:** smaller and simpler doesn't mean free of consequences. SMRs still produce
  radioactive waste, must be licensed, and the first projects carry cost and schedule risk.
- **On screen:** three words around the plant, one after another: "ATLIEKOS", "LICENCIJAVIMAS",
  "PIRMŲJŲ PROJEKTŲ RIZIKA".
- **Beat:** `limits`. The rhythm slows: a wide view over the opened plant.
- **Ambient loop:** the passive loop continues at reduced intensity, plus camera drift.
- **Facts:** none on screen. The spoken text should cite the waste and licensing points.
- **Unresolved:** the three words are placed around the plant, not tied to specific buildings.

## 12. Closing (`close`), both, 6:35–7:00

- **Spoken idea:** the reverse journey back to where we started, then questions.
- **On screen:** "Ta pati fizika. Kitas mastelis.", "Jūsų klausimai", the presenters with their
  e-mails, and the QR.
- **Beats:**
  - `return`: vessel, containment, shaft and ground close as the camera rises out. The hall lights
    come back, the grid reconnects, and the camera lands on the opening composition.
  - `qa`: the opening composition again. It holds forever for Q&A.
- **Ambient loop:** grid pulses and camera drift, the same as the opening.
- **Facts:** none.
- **Unresolved:** the closing line is a placeholder for the final wording. The e-mail and QR
  placeholders are the same as in chapter 1.
