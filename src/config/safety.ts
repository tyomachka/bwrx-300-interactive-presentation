/**
 * Stage 9 passive safety: the isolation condenser system (ICS), plain data. PROJECT.md §3, §13
 * 43-48 s, §10 Safety Mode.
 *
 * What GD Rev J §3.3 says, and the only thing this chapter claims: three independent trains,
 * each a heat exchanger (the IC) submerged in its own pool and connected to the RPV by steam
 * supply and condensate return piping. Steam from the RPV condenses in the IC tubes, the heat
 * goes into the pool water (vented to the atmosphere), and the condensate returns to the RPV in
 * a closed loop. The ICs sit above the steam source, so the circulation is natural and driven by
 * gravity: no pumps, no AC power (§2). Two trains remove decay heat for seven days without
 * operator action. The condensate drains to the RPV inlet in the chimney region (§3.3).
 *
 * Not claimed: no electricity (the turbine path stays off), no accident sequence, no valve
 * logic, no temperatures, no boiling of the pool. Heat does not vanish when the blades are in:
 * the reaction cue stays low and the vessel stays warm while the ICS removes the heat.
 *
 * [APPROX] The layout is an educational approximation: one tube bank per IC (Fig 3-8 draws two
 * modules), the nozzle azimuths, the riser positions and the header heights are chosen to read
 * clearly in the cut building, not taken from a drawing.
 */
import type { FlowKeys } from './flow';
import { MASTER_EVENTS as E } from './masterSequence';

/** Channels drawn by the ICS flow (scene/safety): pulse slots, then the pool and vessel cues. */
export const SAFETY_CHANNELS = ['icsSteam', 'icsCondensing', 'icsCondensate', 'poolHeat', 'decayHeat'] as const;
export type SafetyChannel = (typeof SAFETY_CHANNELS)[number];

/**
 * The three trains: which ICS pool (dimensions.ts POOLS.ics index) and the nozzle azimuths on
 * the RPV (degrees, x = r cos a, z = r sin a). All behind the cut plane z = 0; the main steam
 * nozzles (15° / 195°) stay clear.
 */
export const ICS_LAYOUT = {
  trains: [
    { pool: 0, steamAzimuthDeg: 212, returnAzimuthDeg: 220 },
    { pool: 1, steamAzimuthDeg: 266, returnAzimuthDeg: 274 },
    { pool: 2, steamAzimuthDeg: 328, returnAzimuthDeg: 320 },
  ],
  /** Plan radius of the vertical risers: outside the containment (r 9.5), under each pool. */
  riserRadius: 10.8,
  /** [APPROX] Steam supply nozzles at the steam outlet level (h 24.2 m), as in Fig 3-8; the
   *  condensate return enters at the top of the chimney region (h 16.2 m, GD §3.3). */
  returnH: 16.2,
  /** The IC heat exchanger: headers along the pool's long axis, a bank of vertical tubes. */
  hx: { upperY: 12.2, lowerY: 7.2, headerLength: 3.4, headerRadius: 0.26, rows: 2, perRow: 9, rowGap: 0.3, tubeLength: 3.0, tubeRadius: 0.05 },
  pipe: { steamRadius: 0.17, returnRadius: 0.14, corner: 0.7, nozzleRadius: 0.27, nozzleLength: 0.45 },
} as const;

/**
 * Visual language, the Stage 7 one where it overlaps: steam pale and soft, condensate the cool
 * blue of the Stage 7 water; condensing steam in the tubes in between. Heat is a restrained warm
 * tint (vessel) and a slow warm plume rising from the tubes into the pool water. No red, no
 * flashing, no additive glow.
 */
export const SAFETY_LOOK = {
  /** Pulse sleeves (flowMaterials pulse tubes): offset over the pipe radius (m). */
  sleeve: 0.05,
  tubeSleeve: 0.03,
  steam: { color: '#e8edf0', alpha: 0.75, base: 0.35, spacing: 3.2, pulse: 1.3, speed: 4.5 },
  condensing: { color: '#b4ccd9', alpha: 0.7, base: 0.3, spacing: 1.4, pulse: 0.55, speed: 1.4 },
  condensate: { color: '#5c9cc3', alpha: 0.9, base: 0.32, spacing: 2.6, pulse: 1.0, speed: 2.6 },
  /** Warm water rising from the tubes to the pool surface (Stage 7 streak particles). */
  plume: { color: '#d9ad88', alpha: 0.2, length: 1.1, width: 0.34, riseSpeed: 0.85, surfaceY: 15.2, spread: 1.5 },
  /** The ICS pool water: see-through, so the submerged IC shows. */
  water: { opacity: 0.5 },
  /** Residual (decay) heat in the vessel: a faint warm tint, strongest at the core. */
  decayHeat: { color: '#c98a5f', alpha: 0.8, face: 0.16, top: 0.6 },
} as const;

/** Plume streamlines per IC on High (Low: quality particlesMultiplier, floored). */
export const PLUME_SPEC = { paths: 28, perPath: 2, minDensity: 0.6 } as const;

/** Front progress keys: [start, end] in seconds; 0 at start, the whole route lit at end. */
export interface FrontWindow {
  start: number;
  end: number;
}

/**
 * Presentation, keyed on the Stage 6 safety events (41.5 / 44.6 / 46.0; no camera key moves).
 *  - 41.5-42.4: the camera backs out of the core; Stage 8's blades stay in, its reaction cue
 *    fades with the camera and the core water still circulates (the residual heat cue);
 *  - 42.2-43.3: the vessel's warm tint comes up while the camera rises out of the containment;
 *  - steam leaves the vessel and climbs to the ICs (42.7-44.2), condenses in the tubes around
 *    `isolationCondenser` (44.1-44.9) and drains back towards the vessel (44.8-45.9), so the loop
 *    is closed before `safetyExit`; the pool takes the heat (warm plume from 44.3);
 *  - the final pullback keeps the loop running, quieter: the closing idea is passive cooling.
 */
const QUIET = 0.7;
const holdThenQuiet = (start: number, rise: number): FlowKeys => [
  [start, 0],
  [start + rise, 1],
  [E.safetyExit, 1],
  [E.finalPullback + 1.4, QUIET],
];

export const SAFETY_PRESENTATION = {
  intensity: {
    icsSteam: holdThenQuiet(E.safetyEnter + 1.1, 0.3),
    icsCondensing: holdThenQuiet(E.safetyEnter + 2.5, 0.3),
    icsCondensate: holdThenQuiet(E.safetyEnter + 3.2, 0.3),
    poolHeat: holdThenQuiet(E.isolationCondenser - 0.3, 0.8),
    decayHeat: holdThenQuiet(E.safetyEnter + 0.7, 1.1),
  } satisfies Record<SafetyChannel, FlowKeys>,
  /**
   * Shutdown handoff (config/control.ts CONTROL_SHUTDOWN): while the reaction cue falls, the
   * vessel's warmth comes up early, so by 42.4 s the residual heat is what the core shows. Applied
   * as max(decayHeat, this): the main curve passes 0.4 just before 42.7 s, so from 42.7 s on the
   * safety chapter is exactly as before.
   */
  decayHeatEarly: [
    [E.safetyEnter + 0.1, 0],
    [E.safetyEnter + 0.9, 0.4],
  ] as FlowKeys,
  fronts: {
    steam: { start: E.safetyEnter + 1.2, end: E.isolationCondenser - 0.4 },
    condensing: { start: E.isolationCondenser - 0.5, end: E.isolationCondenser + 0.3 },
    condensate: { start: E.isolationCondenser + 0.2, end: E.safetyExit - 0.1 },
  } satisfies Record<'steam' | 'condensing' | 'condensate', FrontWindow>,
} as const;

/**
 * Explore Safety: the same loop, started when the mode turns on (the fronts replay on the
 * animation clock, offset so the steam leaves at once), then steady. A selection keeps priority.
 */
export const SAFETY_EXPLORE = {
  intensity: 0.9,
  withSelection: 0.6,
  withIsolation: 0.35,
  /** Fade in / out (1/s rate). */
  fadeRate: 5,
  /** Explore clock wrap (s): the pulses and the plume loop, so float precision never degrades. */
  clockWrap: 1200,
} as const;
