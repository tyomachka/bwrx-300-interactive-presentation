/**
 * Chapter 4 "footprint" layout (talk only), world metres at the plant's own ground scale.
 *
 *  - area: the BWRX-300 power block's footprint, 9,800 m2 (GE Vernova Hitachi, BWRX-300 General
 *    Description 005N9751 Rev J, June 2026, Table 21-2: "Plant Powerblock Footprint 9,800 m2
 *    (rectangular building envelope)"). Rev J gives no side lengths, so none are invented: the
 *    rectangle drawn is an AREA-EQUIVALENT SCHEMATIC with the pitch's width (68 m x 144.1 m =
 *    9,800 m2), centred on our modelled power block (x -30..121, z -48..23) and labelled as such.
 *  - pitch: 105 m x 68 m = 7,140 m2, the field UEFA requires of category 3 and 4 stadiums (Stadium
 *    Infrastructure Regulations, in force 1 June 2025, art. 5.01). The National Stadium being built in
 *    Šeškinė, Vilnius, is a UEFA category IV project (LRT, 2025-09-03). The stands are schematic.
 *
 * 9,800 / 7,140 = 1.37 -> "≈ 1,4 futbolo aikštės ploto". Same width, so the ratio reads as length.
 */
const AREA = 9800;
const PITCH = { length: 105, width: 68 } as const;
const BLOCK_CENTRE = [45.5, -12.5] as const;
const blockLength = AREA / PITCH.width;

export const FOOTPRINT = {
  area: AREA,
  /** The area-equivalent rectangle (x along the power block, z across it). */
  block: {
    x: [BLOCK_CENTRE[0] - blockLength / 2, BLOCK_CENTRE[0] + blockLength / 2] as const,
    z: [BLOCK_CENTRE[1] - PITCH.width / 2, BLOCK_CENTRE[1] + PITCH.width / 2] as const,
  },
  /** The pitch, on the same z band as the block (same width, side by side). */
  pitch: { center: [-133, BLOCK_CENTRE[1]] as const, length: PITCH.length, width: PITCH.width },
  /** Run-off and stands around the pitch (schematic), m. */
  stadium: { runoff: 7, stands: 22 },
  /** Ground offsets above grade (m): clear of the apron (0.12 m) and of each other. */
  y: { fill: 0.22, block: 0.3, stadium: 0.2 },
} as const;
