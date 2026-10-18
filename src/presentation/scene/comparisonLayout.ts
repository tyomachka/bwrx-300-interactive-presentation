/**
 * Chapter 3 layout (talk only): the large BWR-family unit west of our BWRX-300, at the same scale and
 * on the same baseline (both reactor buildings centred on z = 0, one apron height, one camera). Its
 * layout is mirrored (turbine hall to the west) so the two reactor buildings, and the vessels in front of
 * them, stand next to each other: the comparison that matters is read side by side.
 *
 * [MATCHED SCALE · LAYOUT ILLUSTRATIVE] The comparator is the ESBWR (same boiling-water family;
 * presentation/sources.ts esbwr, vessels): ~1,594 MWe gross / ~1,535 MWe net against ~300 MWe net.
 * Five times the power is not five times the size in every direction: the reactor vessels are about
 * as tall (27.6 m vs 27.4 m inside) and the large one far wider (7.1 m vs 4.2 m inside), with 1,132
 * fuel bundles against 240. No public drawing gives the ESBWR buildings' sides, so the massing here
 * is a simplified BWR plant (a square reactor building with its refuelling-floor enclosure, a longer,
 * taller turbine hall, control and radwaste buildings, all on one apron) sized like large BWR plants:
 * a reactor building about as tall as ours but much wider, and a power block several times larger.
 * The screen says so ("Mastelis suderintas; pastatų išdėstymas iliustracinis"). No dome, no stack:
 * not a PWR.
 *
 * The vessels are the precise comparison: drawn as amber outlines standing on grade in front of each
 * reactor building, at their sourced inside dimensions (TalkOverlay.tsx VesselDiagram has the numbers).
 */

type V3 = readonly [number, number, number];

export const LARGE_UNIT = {
  center: [-113, 0, 0] as V3,
  /** Height of the value label's dot above grade (m): just above the reactor building. */
  labelY: 50,
  /** Boxes: size [x, y, z] (m) and offset of the footprint centre from `center`. */
  reactor: { size: [56, 38, 56] as V3, offset: [0, 0, 0] as V3 },
  /** A smaller roof structure on the reactor building (refuelling floor enclosure). */
  reactorTop: { size: [36, 6, 36] as V3, offset: [0, 38, 0] as V3 },
  turbine: { size: [140, 42, 64] as V3, offset: [-106, 0, 0] as V3 },
  control: { size: [46, 20, 30] as V3, offset: [-4, 0, -46] as V3 },
  radwaste: { size: [52, 18, 34] as V3, offset: [-92, 0, -54] as V3 },
  /** The paved apron the whole block stands on (local x, z ranges; top as ours). */
  apron: { x: [-188, 40] as const, z: [-82, 44] as const, top: 0.12 },
  /** Soft contact shadow under the whole block. */
  shadow: { offset: [-62, 0.4, -14] as V3, scale: [270, 1, 160] as V3 },
} as const;

/** The four extra BWRX-300 blocks: our plant's footprint repeated northwards (m). */
export const MODULE_OFFSETS = [-84, -168, -252, -336] as const;

/**
 * The reactor vessels, inside dimensions (m): ESBWR 7.1 x 27.6, BWRX-300 4.2 x 27.36 (GD Rev J Table 2-1,
 * §3.1.2). Each stands on grade in front of its own reactor building, both on the line z = 36.
 */
export const GHOST_VESSELS = [
  { id: 'esbwr', x: LARGE_UNIT.center[0], z: 36, diameter: 7.1, height: 27.6 },
  { id: 'bwrx', x: 0, z: 36, diameter: 4.2, height: 27.36 },
] as const;
