/**
 * Stage 10 fission inset: plain data. PROJECT.md §13 12-20 s, §15 Fission visualization.
 *
 * What it explains (references/TECHNICAL_FACTS.md FIS-01..07): a neutron is absorbed by a U-235
 * nucleus; the excited compound nucleus oscillates, turns dumbbell-shaped and splits (the liquid
 * drop model, DOE-HDBK-1019/1-93 p. 49); two unequal fragments fly apart (most probable masses
 * about 95 and 140, p. 57) and a few neutrons are released (the handbook's typical reaction
 * releases three, p. 58); one of them can be absorbed by another U-235 nucleus (the chain
 * reaction). Most of the energy is the fragments' kinetic energy (167 of 187 MeV instantaneous,
 * Table 6 p. 61), given to the surrounding fuel as heat while they slow down.
 *
 * [SCHEMATIC — NOT TO SCALE / NOT EXACT NUCLEON COUNT] Each nucleus is a cluster of 96 spheres,
 * not 235; the two tones keep U-235's proportion (92 protons : 143 neutrons). No electrons, no
 * gamma rays, no glow on the nuclei; the moderation of the fast neutrons by the water is not drawn.
 *
 * Everything is a function of master time: τ = t − fissionEnter (0 .. 4.5 s). The inset is a
 * camera-space overlay in the normal render pass (no render target, no post-processing): an iris
 * opens from one spot on the fuel, the event plays in it, and the released energy closes back
 * onto that spot as warmth before the Stage 7 flow starts at `fissionExit` (20.5 s) unchanged.
 */
import { MASTER_EVENTS as E } from './masterSequence';

/** Seconds after `fissionEnter` (τ). The inset is entirely inside 16.0-20.5 s. */
export const FISSION_TIMING = {
  start: E.fissionEnter,
  end: E.fissionExit,
  /** A small ring marks the fuel spot; the micro view then grows out of it (iris + zoom). */
  marker: [0.0, 0.18, 0.5] as const,
  irisOpen: [0.15, 0.75] as const,
  /** The incoming neutron crosses the view and is absorbed by the U-235 nucleus. */
  neutronIn: [0.45, 1.2] as const,
  /** Excited compound nucleus: oscillates and stretches into a dumbbell, then splits. */
  excite: [1.2, 2.0] as const,
  split: 2.0,
  /** One of the released neutrons reaches a second U-235 nucleus, which starts to deform. */
  chainAbsorb: 2.95,
  chainExcite: [2.95, 3.9] as const,
  /** Heat along the fragments' paths, which outlasts the nuclei and closes onto the fuel spot. */
  heat: [2.1, 3.6] as const,
  /** The micro view zooms back into the fuel spot: the nuclei fade, the dark disk dissolves as it
   *  shrinks, and the heat shrinks into a small warm spot on the fuel, which then fades. */
  irisClose: [3.65, 4.15] as const,
  particlesOut: [3.75, 4.05] as const,
  backdropOut: [3.72, 4.02] as const,
  spotOut: [4.12, 4.42] as const,
} as const;

/**
 * Micro layout, in units of the screen half-height at the inset's depth (y −1..1, x ±aspect):
 * resolution- and aspect-independent, centred so it fits 16:9 and 4:3.
 */
export const FISSION_LAYOUT = {
  /** View-space depths (m): the content plane and the backdrop behind it (camera near 0.5 m). */
  depth: 2.0,
  backdropDepth: 3.0,
  nucleons: 96,
  /** U-235 proportion of the two tones (92 : 143). */
  protonShare: 92 / 235,
  /** First nucleus (the U-235 the neutron hits): centre, radius, split axis, light-fragment share. */
  a: { center: [-0.52, 0.06, 0], radius: 0.33, axis: [0.88, 0.48, 0], lightShare: 0.4 },
  /** Second nucleus (the chain): a different split axis and share (no two fissions are alike). */
  b: { center: [1.06, -0.46, 0], radius: 0.3, axis: [0.42, 0.91, 0], lightShare: 0.45 },
  /** Lobe separation before the split (micro units) and the light fragment's launch speed
   *  (units/s, decaying with `drag`); the heavy one is slower in proportion (equal momentum). */
  lobeSeparation: 0.07,
  fragmentSpeed: 2.3,
  drag: 3.0,
  /** Wobble of the excited nucleus (fraction of its length, Hz). */
  wobble: { amplitude: 0.09, frequency: 4.5 },
  neutronStart: [-2.3, 0.3, 0],
  /** Released neutrons: one towards the second nucleus, two leaving the view. */
  releasedDirections: [
    [-0.42, 0.91, 0],
    [0.12, -0.99, 0],
  ] as const,
  releasedSpeed: 2.6,
} as const;

/**
 * Look: dark neutral backdrop, matte nuclei, small cool neutrons, one restrained warm accent for
 * the energy that becomes heat. Normal blending everywhere; nothing additive; tone mapped.
 */
export const FISSION_LOOK = {
  backdrop: '#0e1114',
  backdropCenter: '#171b20',
  backdropAlpha: 0.94,
  /** Fuel-spot marker ring. */
  marker: '#c9ced3',
  proton: '#b9ae9f',
  neutron: '#8f9ba4',
  freeNeutron: '#cfdbe3',
  /** Energy pulse at the split and the heat along the fragment paths. */
  energy: '#f0c9a0',
  heat: '#d9925b',
  /** On-screen nucleon radius relative to the nucleus radius. */
  nucleonScale: 0.205,
  label: '#c9ced3',
} as const;

/**
 * Minimal labels (names only; no paragraphs), each with its τ window [in, out]. The words are per
 * language (i18n/strings.ts `fission`: U-235, neutron / neutronas, energy → heat / energija → šiluma).
 */
export const FISSION_LABELS = [
  { key: 'nucleus', window: [0.55, 1.75] },
  { key: 'neutron', window: [0.55, 1.2] },
  { key: 'heat', window: [2.75, 3.65] },
] as const;

export type FissionLabelKey = (typeof FISSION_LABELS)[number]['key'];
