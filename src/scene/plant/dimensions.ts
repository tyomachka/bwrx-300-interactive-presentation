/**
 * Plant massing dimensions: the single source for every Stage 2 number (metres, grade = y 0).
 *
 * Provenance tags:
 *  [GD]     GE Vernova Hitachi, BWRX-300 General Description 005N9751 Rev J
 *           (references/technical/). Section/figure noted.
 *  [BRIEF]  Stage 2 brief, citing a current official design document not in references/.
 *  [PRESS]  Press coverage of the OPG Darlington build (approximate, not a design figure).
 *  [APPROX] Educational approximation: proportions chosen to agree with the official
 *           figures, but no published number exists for it.
 *
 * Plan layout (the axis the section review cuts along):
 *   +x east: reactor building -> main steam -> turbine building -> generator
 *   -z north: control and radwaste buildings, behind the cut plane z = 0
 *   +z south: the open front the hero cameras look from
 */

export const GRADE_Y = 0;

export const REACTOR_BUILDING = {
  center: [0, 0] as const, // plan position (x, z); the reactor axis is the world origin
  /** [APPROX] RB is "a vertical right cylinder shaft" [GD §10]. Ø ≈ 37 m agrees with the
   *  ~121 ft basemat lowered into the Darlington shaft [PRESS] and Figure 2-1 proportions. */
  aboveGradeRadius: 18.5,
  aboveGradeWall: 1.3,
  /** [APPROX] Above-grade height: pools and fuel handling sit here [GD §10]. 36 m below +
   *  ~33 m above ≈ the ~67 m overall height in third-party estimates; Fig 2-1 H/D ≈ 1.8. */
  aboveGradeHeight: 30,
  /** [APPROX] Shallow radial-segment roof sitting on the wall, as drawn in Fig 2-1 / Fig 18-5. */
  roofRise: 4.2,
  roofOverhang: 0.25,
  /** [BRIEF] Shaft embedded to ≈ 36 m below grade ([PRESS] reports ~35 m). */
  shaftDepth: 36,
  /** [APPROX] The shaft reads slightly wider than the superstructure: a grade collar that
   *  shows the cylinder continues into the ground. */
  shaftOuterRadius: 19.1,
  shaftWall: 2.4,
  /** [APPROX] Common steel-plate composite basemat [GD §3.4]; thickness not published. */
  basematThickness: 3,
  collarHeight: 0.35,
  /** [APPROX] Annular floors between containment and shaft wall, as drawn in Fig 2-1. */
  shaftFloorLevels: [-26, -19, -12, -5] as const,
  floorThickness: 0.6,
  /** [APPROX] Refuelling floor above the pools ([GD §10]: pools above the SCCV). */
  refuelFloorY: 15,
  refuelFloorThickness: 1,
} as const;

export const CONTAINMENT = {
  /** [GD §3.4] Vertical cylinder ≈ 19 m outside diameter and 38 m high, enclosed in the
   *  deeply embedded RB, on the common basemat. Bottom = basemat underside (-36), so the top
   *  is at +2: "SCCV and RPV are situated at or below grade" [GD §10]. */
  outerRadius: 9.5,
  height: 38,
  /** [APPROX] Wall and top-slab thicknesses. */
  wall: 1.2,
  topSlab: 1.5,
  /** [APPROX] Steel closure head over the RPV opening, under the reactor cavity pool (Fig 3-9). */
  closureHeadRadius: 3.6,
  closureHeadRise: 2.2,
  openingRadius: 3.2,
  /** [APPROX] RPV support pedestal / bioshield ring (Fig 3-9, "Pedestal"). */
  pedestal: { innerRadius: 3.1, outerRadius: 4.0, height: 10.5 },
} as const;

export const REACTOR_PRESSURE_VESSEL = {
  /** [GD §3.1] Minimum ID ≈ 4.2 m, wall ≈ 13.54 cm -> OD ≈ 4.47 m. Inner height ≈ 27.36 m. */
  outerRadius: 2.235,
  height: 27.6,
  /** [APPROX] Head at the containment top slab, as in Fig 3-9. */
  topY: 1.0,
  /** [APPROX] Main steam nozzle elevation (upper vessel, Fig 5-1). */
  steamNozzleY: -2.0,
} as const;

export const POOLS = {
  /** [GD §10] "A pool rests above the SCCV ... The three ICS pools sit next to the pool above
   *  the SCCV with one IC located in each pool." Sizes and positions are [APPROX]. */
  cavity: { halfSize: 6.5, bottomY: 2.0 },
  topY: 15.5,
  icsBottomY: 4,
  /** Plan centre (x, z) and size (x, z). All three sit behind the cut plane. */
  ics: [
    { center: [-10.5, -6.5], size: [5, 8] },
    { center: [0, -12], size: [8, 5] },
    { center: [10.5, -6.5], size: [5, 8] },
  ] as const,
} as const;

/** [APPROX] Turbine building: "The TB encloses the turbine generator, main condenser ..." [GD §10]
 *  on a near-surface basemat adjacent to the RB, separated by a seismic gap. Main steam crosses
 *  directly into it (Fig 5-1, "Outside Turbine Building Wall"). */
export const TURBINE_BUILDING = {
  x: [20.6, 104] as const,
  z: [-23, 23] as const,
  height: 28,
  wall: 0.6,
  roof: 0.8,
  floorTop: 0.1,
  finSpacing: 6,
  glazing: { bottom: 21, top: 25 },
  door: { x: 94, width: 7, height: 9 },
  /** Turbine deck (concrete pedestal) and the train on it, along the steam axis z = 0. */
  deck: { x: [36, 92] as const, halfWidth: 7, top: 12 },
  /** Turbine-generator shaft line: the LP casings sink into the deck (condenser below). */
  shaftY: 14.6,
} as const;

/** [APPROX] Single-shaft, tandem-compound turbine: one HP + two LP turbines driving the
 *  generator [GD §5]. Placeholder casings only; lengths chosen for a ~45 m train. */
export const TURBINE_TRAIN = {
  hp: { x: [42, 49] as const, radius: 2.2 },
  lp: [
    { x: [51, 60] as const, radius: 3.6 },
    { x: [62, 71] as const, radius: 3.6 },
  ],
  generator: { x: [74, 86] as const, radius: 2.6 },
} as const;

/** [APPROX] Supporting power-block masses (CB, RWB, Turbine Maintenance Building) [GD §10],
 *  kept low and behind the cut plane. Overall power block ≈ 151 x 71 m vs the official
 *  148 x 78 m (Fig 10-2). */
export const SUPPORT_BUILDINGS = [
  { id: 'control-building', x: [-30, 16], z: [-48, -23.6], height: 13 },
  { id: 'radwaste-building', x: [30, 80], z: [-46, -24.5], height: 16 },
  { id: 'turbine-maintenance-building', x: [105.5, 121], z: [-23, -1], height: 14 },
] as const;

/** Site block: thick enough that a section reveals the whole embedded shaft. */
export const SITE = {
  x: [-100, 150] as const,
  z: [-90, 90] as const,
  depth: 48,
  apron: { x: [-45, 135] as const, z: [-62, 40] as const, top: 0.12 },
  /** Centre of the soft light pool on the ground (x, z). */
  lightPoolCenter: [35, -5] as const,
  lightPoolRadius: 210,
} as const;
