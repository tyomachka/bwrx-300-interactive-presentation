/**
 * BWRX-300 reactor pressure vessel and internals: the single source for every Stage 4 number.
 *
 * Units are metres. Heights `h` are measured from the inside bottom of the vessel, the datum
 * the General Description uses ("the bottom of the active fuel region is approximately
 * 5.12 m from the bottom of the vessel"); `worldY(h)` places them in the plant.
 *
 * Provenance tags (as in plant/dimensions.ts):
 *  [GD]      BWRX-300 General Description 005N9751 Rev J, June 2026: the newest official
 *            source in the project. Section / figure noted.
 *  [NEDO]    NEDO-34163 Rev B (2025), older: differences are recorded, not applied.
 *  [APPROX — proportion constrained by GD Figure X-X]  read off an official figure; no number
 *            is published.
 *  [APPROX — standard GE BWR]  a long-standing GE BWR hardware value; the GD says the fuel
 *            assembly and control rod mechanical designs "are the same as existing operating
 *            GE BWRs" [GD §4.1] but gives no dimension.
 *  [APPROX]  educational approximation, chosen to read correctly; no source number exists.
 *
 * Coordinates: reactor axis at x = z = 0 (plant origin). The two main steam nozzles point
 * roughly east/west (the turbine hall is to the east, +x).
 */
import { REACTOR_PRESSURE_VESSEL as RPV } from '../plant/dimensions';

export const worldY = (h: number) => RPV.insideBottomY + h;

// ---- Vessel --------------------------------------------------------------------------------

export const VESSEL = {
  /** [GD §3.1.1] */
  innerRadius: RPV.innerRadius,
  outerRadius: RPV.outerRadius,
  wall: RPV.wall,
  innerHeight: RPV.innerHeight,
  /** [APPROX — proportion constrained by GD Fig 3-1/3-3] Hemispherical bottom and top heads:
   *  the top head is the bolted, removable dome of Fig 3-3; the inner height includes both. */
  headInnerRadius: RPV.innerRadius,
  /** Height of the head/shell joint (the flange face), = inner height minus the top head. */
  flangeJointH: RPV.innerHeight - RPV.innerRadius,
  /** [APPROX — proportion constrained by GD Fig 3-3] Vessel and head flanges: a heavy ring
   *  standing well proud of the shell, carrying the head studs. */
  flange: { outerRadius: 2.56, vesselDepth: 0.6, headDepth: 0.52 },
  /** [APPROX — Fig 3-3: ~70 studs around the head flange] */
  studs: { count: 64, radius: 2.4, diameter: 0.11, protrusion: 0.42 },
} as const;

/** [APPROX — elevations/azimuths constrained by GD Fig 3-1, 3-3, 5-1] Nozzle cues only. */
export const NOZZLES = {
  /** Two main steam lines [GD §3.1.2], nozzles roughly opposite each other (Fig 3-3, 5-1),
   *  just below the head flange at the dryer. Rotated 15° off the x axis so the cutaway plane
   *  (z = 0) clears the west nozzle's hub entirely. */
  mainSteam: { h: RPV.steamNozzleY - RPV.insideBottomY, azimuthDeg: [15, 195], hubRadius: 0.44, pipeRadius: 0.33, boreRadius: 0.24, flangeRadius: 0.52, length: 0.95 },
  /** "Feedwater inlet nozzles" (Fig 3-1), below the separators. */
  feedwater: { h: 16.9, azimuthDeg: [37, 217], hubRadius: 0.27, pipeRadius: 0.2, boreRadius: 0.13, flangeRadius: 0.31, length: 0.7 },
} as const;

/** [APPROX — Fig 3-3] Rectangular support lugs on the upper shell. */
export const SHELL_LUGS = { count: 4, h: 22.4, height: 0.5, width: 0.42, depth: 0.32, azimuthOffsetDeg: 45 } as const;

/** [APPROX — Fig 3-1] FMCRD housings below the bottom head, ending in the drive motors. */
export const DRIVES = {
  housingRadius: 0.085,
  /** Bottom of the housings (h below the vessel bottom), then the motor unit. Kept above the
   *  containment floor inside the pedestal ring. */
  housingBottomH: -4.25,
  motor: { radius: 0.13, height: 0.95 },
} as const;

// ---- Core ----------------------------------------------------------------------------------

export const CORE = {
  /** [GD §3.1.1] Bottom of active fuel ≈ 5.12 m from the vessel bottom; active core 3.8 m.
   *  [NEDO §1.7.1] (older): BAF ≈ 5.2 m. */
  bottomOfActiveFuelH: 5.12,
  activeHeight: 3.8,
  /** [APPROX — standard GE BWR] 12 in (0.3048 m) control-cell pitch: four 6 in bundle
   *  positions around each cruciform blade. The layout itself is official (GD Fig 3-6). */
  cellPitch: 0.3048,
} as const;

export const TOP_OF_ACTIVE_FUEL_H = CORE.bottomOfActiveFuelH + CORE.activeHeight;

/** [APPROX] Height of the horizontal core section in the control-blade review: just below
 *  the tips of half-inserted blades, so the section shows bundles and blade crosses. */
export const CORE_SECTION_H = CORE.bottomOfActiveFuelH + 1.6;

/** [APPROX — standard GE BWR / GNF2] Fuel assembly envelope. N-lattice [GD §4]: equal water
 *  gaps on the control-rod and non-control-rod sides, so each bundle is centred in its half-cell. */
export const FUEL = {
  /** Channel outer width (Zircaloy box). */
  channelWidth: 0.1391,
  /** Channel from just below BAF to above TAF; lower tie plate nose below, handle above. */
  channelBottomH: CORE.bottomOfActiveFuelH - 0.16,
  channelTopH: TOP_OF_ACTIVE_FUEL_H + 0.2,
  nose: { width: 0.095, height: 0.24 },
  handle: { width: 0.11, thickness: 0.022, height: 0.13 },
  /** [GD §4.2] GNF2 10x10: 78 full-length rods, 14 part-length rods, two large water rods. */
  lattice: 10,
  rodDiameter: 0.0112,
  rodPitch: 0.0129,
} as const;

/** [APPROX — standard GE BWR] Cruciform control blade (B4C or Hf absorber [GD Table 2-1]). */
export const BLADE = {
  /** Centre to wing tip. */
  halfSpan: 0.124,
  thickness: 0.0079,
  /** Absorber section ≈ active core height. */
  length: CORE.activeHeight,
  /** Bail handle in the plane of one wing: as thin as the blade, so it fits between channels. */
  handle: { height: 0.2, width: 0.11, thickness: 0.0079 },
  /** Velocity limiter / coupling below the blade (connects to the FMCRD hollow piston); slim
   *  enough to pass between the four fuel-assembly noses when fully inserted. */
  limiter: { radius: 0.034, height: 0.3 },
} as const;

// ---- Core support structures -----------------------------------------------------------------

/** [APPROX] Shroud: the core is ≈ 1.45 m from the axis at its widest (Fig 3-6 layout at the
 *  pitch above); Fig 3-1 shows the shroud/chimney barrel ≈ 0.69 of the vessel OD. The gap to
 *  the vessel wall is the downcomer. */
export const SHROUD = {
  innerRadius: 1.52,
  outerRadius: 1.57,
  /** Bolted stack, bottom to top [GD §3.1.1.1]: shroud support -> core plate -> shroud ->
   *  top guide -> chimney. */
  bottomH: 4.555,
  topH: 9.395,
} as const;

/** [GD §3.1.1.1] "a circular assembly with vertical legs that are welded to the reactor bottom
 *  head" - the legs leave the downcomer open to the lower plenum. Sizes [APPROX]. */
export const SHROUD_SUPPORT = {
  ring: { innerRadius: 1.36, outerRadius: 1.66, bottomH: 4.25, topH: 4.43 },
  legs: { count: 12, radius: 1.5, width: 0.16, depth: 0.12 },
} as const;

/** [APPROX] Core plate: below the fuel, between shroud support and shroud [GD §3.1.1.1]. */
export const CORE_PLATE = { radius: SHROUD.outerRadius, bottomH: 4.435, topH: 4.55 } as const;

/** [APPROX] Orificed fuel supports: seat four bundles on each guide tube [GD §3.1.1.1]. */
export const FUEL_SUPPORT = { radius: 0.135, peripheralRadius: 0.07, topH: FUEL.channelBottomH - FUEL.nose.height } as const;

/** [APPROX] Control rod guide tubes, bottom head to core plate [GD §3.1.1.1]. */
export const GUIDE_TUBE = { outerRadius: 0.137, innerRadius: 0.127 } as const;

/** [APPROX] Top guide: a square grid, one opening per four-bundle cell [GD §3.1.1.1, Fig 3-2],
 *  over the upper ends of the fuel, with the flange ring bolted between shroud and chimney. */
export const TOP_GUIDE = {
  /** Just above the channel tops: the beams sit on the cell boundaries, between channels. */
  gridBottomH: FUEL.channelTopH + 0.005,
  /** Openings stop short of the rim ring. */
  rim: { innerRadius: 1.45, outerRadius: 1.515 },
  gridTopH: SHROUD.topH - 0.005,
  barThickness: 0.026,
  flange: { innerRadius: 1.32, outerRadius: 1.64, bottomH: SHROUD.topH + 0.005, topH: 9.5 },
} as const;

// ---- Steam region ------------------------------------------------------------------------------

/** [GD §3.1.1] "a tall chimney between the top of the core at the top guide to the bottom of the
 *  steam separators". Top ≈ 16.5 m [APPROX — proportion constrained by GD Fig 3-1]. */
export const CHIMNEY = {
  innerRadius: SHROUD.innerRadius,
  outerRadius: SHROUD.outerRadius,
  bottomH: 9.505,
  topH: 16.5,
} as const;

/** [APPROX — Fig 3-1] Chimney head: the lid of the core discharge plenum, carrying the
 *  separator standpipes [GD §3.1.1.1]. */
export const CHIMNEY_HEAD = { radius: 1.62, skirtInnerRadius: 1.52, bottomH: 16.505, plateBottomH: 16.95, topH: 17.1 } as const;

/** [GD Table 2-1] AS-2B axial-flow separators on standpipes, no moving parts. Count and grid
 *  [APPROX — Fig 3-1 shows ~8 across]: square pitch 0.36 m, offset so no unit sits on a
 *  cutaway plane. */
export const SEPARATORS = {
  pitch: 0.36,
  maxCentreRadius: 1.32,
  standpipe: { radius: 0.085, topH: 18.0 },
  body: { radius: 0.15, topH: 20.2 },
  cap: { radius: 0.115, topH: 20.42 },
} as const;

/** [GD §3.1.1.1] Chevron steam dryer on a support ring resting on four wall brackets, with a
 *  skirt reaching down around the separators (Fig 3-1). Bank layout [APPROX — Fig 3-1]. */
export const DRYER = {
  skirt: { innerRadius: 1.93, outerRadius: 1.96, bottomH: 19.2, topH: 20.84 },
  ring: { innerRadius: 1.6, outerRadius: 2.04, bottomH: 20.845, topH: 21.0 },
  brackets: { count: 4, h: 20.64, height: 0.2, width: 0.3, depth: 0.08, azimuthOffsetDeg: 45 },
  /** Parallel vane banks along x, tallest in the middle (the stepped hood of Fig 3-1). */
  banks: {
    baseH: 21.005,
    footprintRadius: 1.82,
    thickness: 0.2,
    corrugation: { amplitude: 0.028, period: 0.085 },
    rows: [
      { z: 0.28, height: 4.15 },
      { z: 0.84, height: 3.65 },
      { z: 1.4, height: 2.9 },
    ],
  },
} as const;

/** The downcomer: the annulus between the shroud/chimney and the vessel wall. A region, not a
 *  part; Stage 5/7 use it for focus, highlight and the return-flow path. */
export const DOWNCOMER = {
  innerRadius: SHROUD.outerRadius,
  outerRadius: VESSEL.innerRadius,
  bottomH: SHROUD_SUPPORT.ring.topH,
  topH: DRYER.skirt.bottomH,
} as const;
