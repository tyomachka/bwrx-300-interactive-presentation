# Technical facts cache

Verified facts the visualisation relies on, so later stages read this file instead of the PDFs.
Open the original only for a new claim or an unresolved ambiguity (DEVELOPMENT_RULES.md §10).

**Primary source:** GE Vernova Hitachi, *BWRX-300 General Description*, 005N9751 Revision J, June
2026 — `references/technical/005N9751-BWRX-300-General-Description.pdf`
(sha256 `d02f59aaae2e2061ebaf728b5a2ed13f2971775f0e6846fac5fbc05c7370ccff`). Page numbers are the
printed "Page N of 129". If the hash changes, re-verify every fact below.

**Older secondary source:** GE Hitachi, UK GDA Chapter 1, NEDO-34163 Rev B (2025),
`references/technical/11.pdf`. Used only where the GD is silent; differences are recorded, not applied.

Status: **OFFICIAL** = stated in the source; **APPROX** = educational approximation constrained
by the source; **DERIVED** = computed from official figures.

Facts from Stages 1–8 (vessel, core, containment, building, flow path, control blades) are
recorded with their provenance tags next to the numbers in `src/scene/plant/dimensions.ts`,
`src/scene/rpv/rpvData.ts`, `src/config/flow.ts` and `src/config/control.ts`; they are not repeated here.

## Isolation condenser system (Stage 9, verified 2026-10-13)

| ID | Fact | Source | Status | Project usage |
|---|---|---|---|---|
| ICS-01 | "The ICS consists of three independent trains, each containing a Heat Exchanger (HX) - or IC - that is submerged in a dedicated pool of water and is connected to the RPV by steam supply and condensate return piping." | GD Rev J §3.3, p. 40 | OFFICIAL | Three trains, one IC per pool, a supply and a return line each |
| ICS-02 | "Each IC has a capacity of approximately 33 MW (approximately 3.7% of rated thermal power)." | §3.3, p. 41 | OFFICIAL | Not shown (no numbers on screen); narration only |
| ICS-03 | "...condensing reactor coolant supplied as steam from the RPV on the tube side of the ICs and then returning the condensate back to the RPV in a closed loop. Heat removed from the steam is transferred by the IC to the water in the pool, and the pools are vented to the atmosphere." | §3.3, p. 41 | OFFICIAL | Loop direction; condensing in the tubes; warm plume into the pool water |
| ICS-04 | "The ICs are placed at an elevation above the steam source, causing natural circulation that is driven passively by gravitational force." | §3.3, p. 41 | OFFICIAL | ICs in the pools above the vessel; no pump anywhere in the loop |
| ICS-05 | "One ICS train is needed to mitigate AOOs. Two ICS trains are required for LOCA mitigation ... With two ICS trains in service, decay heat removal is sustained for seven days without operator action." Pool inventory can be replenished (e.g. fire truck); pools above ground, not pressurized. | §3.3, p. 41 | OFFICIAL | Narration context only; not drawn |
| ICS-06 | "The ICs also act as the ECCS, utilize natural circulation, and require no Alternating Current (AC) power to perform their functions." | §2, p. 25 | OFFICIAL | "Passive, no pumps": no motor, no pump, no power line in the ICS |
| ICS-07 | "To place a train of the ICS in service, one of the parallel condensate return valves is opened (or fails open), allowing the standing condensate to drain to the RPV inlet in the chimney region." | §3.3, p. 42 | OFFICIAL | Condensate return nozzle at the top of the chimney region (h 16.2 m: elevation APPROX) |
| ICS-08 | "A pool rests above the SCCV ... The three ICS pools sit next to the pool above the SCCV with one IC located in each pool (see Figure 10-1)." | §10, p. 78 | OFFICIAL | The Stage 2 pool layout (sizes / positions APPROX) |
| ICS-09 | Fig 3-8 labels each IC with a steam distribution header, an upper header (steam), tubes and a lower header (condensate); the IC steam feed line leaves the upper RPV, the IC condensate return line enters lower down. It draws two tube modules per IC and labels inner and outer pools ("IC Inner Pool A", "IC Outer Pool B+C"); §3.10 (p. 47) speaks of "three ICS Cubicle Pools and surrounding Outer Pools". | Fig 3-8, p. 41; §3.10, p. 47 | OFFICIAL (figure) / APPROX (our simplification) | One tube bank per IC; three separate pools without outer pools; steam nozzles at the steam-outlet level (h 24.2 m) |
| ICS-10 | ICS pool cooling and cleanup (ICC) keeps the pool water below Technical Specification limits in normal operation (frame-and-plate HX to plant cooling water). | §3.10, p. 47 | OFFICIAL | Not shown (normal-operation support system, not part of the passive loop) |

## Fission (Stage 10, verified 2026-10-13)

Sources: **NRC** Glossary, "Fission (fissioning)" (nrc.gov, last reviewed 2023-01-20).
**DOE-HDBK-1019/1-93**, *DOE Fundamentals Handbook: Nuclear Physics and Reactor Theory*, Vol. 1,
Module 1 (NP-01) and Module 2 (NP-02), Jan 1993; copy from ncsp.llnl.gov
(sha256 `7acb55d1…6796`).

| ID | Fact | Source | Status | Project usage |
|---|---|---|---|---|
| FIS-01 | "The splitting of an atom, which releases a considerable amount of energy (usually in the form of heat) ... usually caused by the nucleus of an atom becoming unstable ... after capturing or absorbing a neutron ... the heavy nucleus splits into roughly equal parts ... In addition to energy, this reaction usually releases gamma radiation and two or more daughter neutrons." | NRC Glossary | OFFICIAL | The whole causal chain; at least two released neutrons |
| FIS-02 | Liquid-drop model: the neutron is absorbed, a compound nucleus is formed "in an excited state"; the excitation "may cause it to oscillate and become distorted"; above the critical energy it becomes "dumbbell-shaped"; when the repulsive forces exceed the attractive ones, "nuclear fission occurs". | DOE-HDBK-1019/1-93, NP-01 p. 49, Fig 18 | OFFICIAL | Absorption → wobble → dumbbell with a thinning neck → split |
| FIS-03 | "The resultant fission fragments have masses that vary widely ... The most probable pair of fission fragments for the thermal fission of the fuel uranium-235 have masses of about 95 and 140." | NP-01 p. 57, Fig 21 | OFFICIAL | Unequal fragments (40 : 60 by sphere count); the second nucleus uses another share |
| FIS-04 | The handbook's typical fission: U-235 + n → Rb-93 + Cs-140 + 3 n (236 = 93 + 140 + 3). | NP-01 p. 58 | DERIVED | Three released neutrons |
| FIS-05 | Instantaneous energy: fragment kinetic energy 167 MeV of 187 MeV (fission neutrons 5, prompt γ 5, capture γ 10); about 200 MeV per fission in total. "All of the energy released, with the exception of the neutrino energy, is ultimately transformed into heat ... The fission fragments ... cause ionization ... kinetic energy is transferred to the surrounding atoms of the fuel material, resulting in an increase in temperature." | NP-01 p. 61, Table 6 | OFFICIAL | Heat drawn along the fragments' paths as they slow down; no glow on the nuclei; gamma radiation not drawn |
| FIS-06 | About 7 % of the 200 MeV is released after the fission (decay); "When a reactor is shut down, fissions essentially cease, but energy is still being released from the decay of fission products." | NP-01 p. 61–62 | OFFICIAL | Supports the Stage 9 shutdown handoff (decay heat) |
| FIS-07 | Over 99 % of fission neutrons are prompt (released within about 10⁻¹³ s); they are born fast (about 2 MeV on average). | NP-02 p. 29; NP-01 (neutron energies) | OFFICIAL | Neutrons released at the split; the moderation by water before the next fission is not drawn (simplification) |

[SCHEMATIC — NOT TO SCALE / NOT EXACT NUCLEON COUNT] Each nucleus is 96 spheres, not 235. The two
tones keep U-235's proportion (92 : 143). There are no electrons.

## Educational approximations used for the ICS (Stage 9)

- Nozzle azimuths, riser positions (the steam riser at the IC's inner end, the return riser at its
  outer end), header heights (upper 12.2 m, lower 7.2 m above grade), pipe and tube sizes: chosen
  to read clearly in the cut building; no drawing gives them (`src/config/safety.ts`).
- The decay-heat tint on the vessel and the warm plume in the pool are visual cues, not
  temperatures; no pool boiling, valve logic or accident sequence is shown.

## Scale and footprint (Presentation Stage 3, verified 2026-10-17)

Sources: **GD Rev J** (above). **GD Rev F**: GE-Hitachi, *BWRX-300 General Description*, 005N9751
Revision F, December 2023 ("Released for Information"; the copy filed with the CNSC as CMD 24-H3
Ref R1-9, sha256 `dd6b9dd0…c11f`, not kept in the repository). **NRC**: "ESBWR" design certification
page (nrc.gov, accessed 2026-10-17). **UEFA**: Stadium Infrastructure Regulations, in force 1 June 2025.
**LRT**: "Nacionalinis stadionas pamažu kyla", 2025-09-03.

| ID | Fact | Source | Status | Project usage |
|---|---|---|---|---|
| SCL-01 | "The RPV has a minimum inside diameter of approximately 4.2 m ... and a nominal inner height of approximately 27.36 m." | GD Rev J §3.1.2, p. 30 | OFFICIAL | Vessel diagram (chapter 3); the model's RPV (`dimensions.ts`) |
| SCL-02 | Table 2-1 compares ABWR / ESBWR / BWRX-300: gross output ~1,350 / ~1,600 / ~316 MWe; 3,926 / 4,500 / 870 MWth; RPV ID 7.1 / 7.1 / 4 m; RPV height (inside) 21.0 / 27.6 / 27 m; bundles 872 / 1,132 / 240; control rods 205 / 269 / 57; ESBWR and BWRX-300 natural circulation. | GD Rev J Table 2-1, pp. 28-29 | OFFICIAL | ESBWR as the large comparator; its vessel 7.1 x 27.6 m, 1,132 bundles |
| SCL-03 | ESBWR "rated gross electrical power output of 1,594 megawatts electric (MWe)", "net ... approximately 1,535 MWe" (varies by up to 50 MWe with the turbine island and site), 4,500 MWt; certified 2014-10-15. | NRC ESBWR page | OFFICIAL | "≈ 1 500 MW" on the large unit (net, like the BWRX-300's ~300 MW) |
| SCL-04 | Core width drawn as the equivalent circle of the bundles on the same 15.24 cm lattice: BWRX-300 240 -> 2.66 m; ESBWR 1,132 -> 5.78 m (inside 4.2 / 7.1 m). Core band height schematic (3.8 m for both). | Derived from SCL-01/02 and `rpvData.ts` | DERIVED | Vessel diagram core bands |
| SCL-05 | "The power block is comprised of the RB, TB, CB, RWB, and the Turbine Maintenance Building. The footprint of the power block is approximately 148 m x 78 m." | GD Rev F §9, p. 63 of 95 | OFFICIAL (older revision) | The power-block outline (chapter 4); 11,544 m2 = 1.62 pitches |
| SCL-06 | "Plant Powerblock Footprint 9,800 m2 (rectangular building envelope)"; "Site Footprint 27,100 m2 (fenced area)"; Rev J no longer states the 148 x 78 m sides. | GD Rev J Table 21-2, p. 123 | OFFICIAL | Report only (9,800 m2 = 1.37 pitches) |
| SCL-07 | Field of play for UEFA categories 3 and 4: length 105 m, width 68 m (= 7,140 m2). | UEFA SIR art. 5.01 | OFFICIAL | The pitch (chapter 4) |
| SCL-08 | The National Stadium being built in Šeškinė, Vilnius, is a "UEFA IV kategorijos" stadium, 18,000 seats, football only, completion planned end of 2027. No published drawing with the pitch size was found. | LRT 2025-09-03 | OFFICIAL (press) | Named only as the category it is built to; the pitch is labelled international-size |

[MATCHED SCALE · LAYOUT ILLUSTRATIVE] The large plant's buildings are a simplified BWR massing (no
public drawing gives the ESBWR building sides); the vessels are compared exactly in the overlay.
