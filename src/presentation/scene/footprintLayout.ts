/**
 * Chapter 4 "footprint" layout (talk only), world metres at the plant's own ground scale.
 *
 *  - block: the BWRX-300 power block, approximately 148 m x 78 m (GE Hitachi, BWRX-300 General
 *    Description 005N9751 Rev F, Dec 2023, p. 63: "The footprint of the power block is approximately
 *    148 m x 78 m"; Rev J, June 2026, Table 21-2 gives the footprint as 9,800 m2, rectangular building
 *    envelope, without the sides). Centred on our modelled power block (reactor, turbine, control,
 *    radwaste and turbine maintenance buildings: x -30..121, z -48..23, i.e. 151 x 71 m).
 *  - pitch: an international-size pitch, 105 m x 68 m = 7,140 m2: the field UEFA requires of category 3
 *    and 4 stadiums (Stadium Infrastructure Regulations, in force 1 June 2025, art. 5.01). The National
 *    Stadium being built in Šeškinė, Vilnius, is a UEFA category IV project (LRT, 2025-09-03). The
 *    stands around it are schematic.
 *
 * 148 x 78 = 11,544 m2 = 1.62 pitches of area. The rectangle does not nest in two pitch rectangles
 * (78 > 68, 148 > 105), so the screen says area, not "fits in".
 */
export const FOOTPRINT = {
  block: { x: [-28.5, 119.5] as const, z: [-51.5, 26.5] as const },
  pitch: { center: [-133, -12.5] as const, length: 105, width: 68 },
  /** Run-off and stands around the pitch (schematic), m. */
  stadium: { runoff: 7, stands: 22 },
  /** Ground offsets above grade (m): clear of the apron (0.12 m) and of each other. */
  y: { block: 0.26, stadium: 0.2 },
} as const;
