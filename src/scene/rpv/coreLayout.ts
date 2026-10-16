/**
 * The BWRX-300 core layout as data: 240 fuel bundles and 57 cruciform control blades.
 *
 * Source: GD Rev J Figure 3-6 (Core Map and Instrumentation Layout), read off a 300 dpi
 * render of the official PDF, and §4.2: "In all but 12 peripheral locations, fuel bundles are
 * arranged in a four-bundle grouping around a control blade." The figure gives:
 *  - 57 control cells (each: one blade, four bundles) on a 9 x 9 cell lattice, in rows of
 *    3, 5, 7, 9, 9, 9, 7, 5, 3 (an octagon);
 *  - 12 single peripheral bundles, one in each corner cell just outside the octagon's diagonal
 *    edges, in the quadrant facing the core centre.
 * 57 x 4 + 12 = 240, and 57 blades: both match GD Table 2-1. Only the physical pitch is an
 * approximation (rpvData.ts CORE.cellPitch).
 *
 * Plain data, no rendering: the core renderer instances it, and a later close-up can isolate a
 * single bundle by id without rebuilding the core.
 */
import { CONTROL_TARGET } from '../../config/control';
import { CORE } from './rpvData';

/** Figure 3-6, top row first. `C` = control cell (blade + four bundles). */
const CELL_MAP = [
  '...CCC...',
  '..CCCCC..',
  '.CCCCCCC.',
  'CCCCCCCCC',
  'CCCCCCCCC',
  'CCCCCCCCC',
  '.CCCCCCC.',
  '..CCCCC..',
  '...CCC...',
] as const;

/** Figure 3-6: cell (column, row) holding a single peripheral bundle, and its quadrant
 *  (qx, qz: 0 = the lower-index half, 1 = the higher-index half of the cell). */
const PERIPHERAL: readonly (readonly [col: number, row: number, qx: 0 | 1, qz: 0 | 1])[] = [
  [2, 0, 1, 1], [6, 0, 0, 1], [1, 1, 1, 1], [7, 1, 0, 1], [0, 2, 1, 1], [8, 2, 0, 1],
  [0, 6, 1, 0], [8, 6, 0, 0], [1, 7, 1, 0], [7, 7, 0, 0], [2, 8, 1, 0], [6, 8, 0, 0],
];

const CENTRE = (CELL_MAP.length - 1) / 2;

export interface FuelBundle {
  id: string;
  /** Plan position of the bundle axis (m, plant coordinates). */
  x: number;
  z: number;
  /** Control cell it belongs to, or null for the 12 peripheral bundles. */
  cell: string | null;
}

/** A control blade position and its insertion. */
export interface ControlBladeState {
  id: string;
  /** Blade axis in plan (m); the cruciform's wings lie along x and z. */
  position: readonly [x: number, z: number];
  /** 0 = fully withdrawn below the core, 1 = fully inserted: what is drawn. */
  insertion: number;
  /** The base pattern's insertion (setBladeInsertion); Stage 8 control moves the blade from it. */
  base: number;
}

const cellCentre = (col: number, row: number): [number, number] => [(col - CENTRE) * CORE.cellPitch, (row - CENTRE) * CORE.cellPitch];
const quarter = CORE.cellPitch / 4;
const cellId = (col: number, row: number) => `cell-${String.fromCharCode(65 + row)}${col + 1}`;

function buildLayout(): { bundles: FuelBundle[]; blades: ControlBladeState[] } {
  const bundles: FuelBundle[] = [];
  const blades: ControlBladeState[] = [];
  CELL_MAP.forEach((line, row) => {
    [...line].forEach((mark, col) => {
      if (mark !== 'C') return;
      const [cx, cz] = cellCentre(col, row);
      const id = cellId(col, row);
      blades.push({ id: `blade-${id.slice(5)}`, position: [cx, cz], insertion: 0, base: 0 });
      for (const [qx, qz] of [[0, 0], [1, 0], [0, 1], [1, 1]] as const) {
        bundles.push({ id: `bundle-${id.slice(5)}-${qx}${qz}`, x: cx + (qx ? quarter : -quarter), z: cz + (qz ? quarter : -quarter), cell: id });
      }
    });
  });
  for (const [col, row, qx, qz] of PERIPHERAL) {
    const [cx, cz] = cellCentre(col, row);
    bundles.push({ id: `bundle-${cellId(col, row).slice(5)}-p`, x: cx + (qx ? quarter : -quarter), z: cz + (qz ? quarter : -quarter), cell: null });
  }
  return { bundles, blades };
}

const layout = buildLayout();

if (import.meta.env.DEV && (layout.bundles.length !== 240 || layout.blades.length !== 57)) {
  throw new Error(`[BWRX-300] core layout: ${layout.bundles.length} bundles, ${layout.blades.length} blades (expected 240, 57)`);
}

export const FUEL_BUNDLES: readonly FuelBundle[] = layout.bundles;

/**
 * The live blade states (mutable insertion). `setBladeInsertion` sets the base pattern and bumps
 * `bladePatternVersion`, so the instanced renderer rewrites its matrices once; `setBladeControl`
 * (Stage 8) moves every blade by the same distance, which the renderer draws as one rigid
 * translation of the batch (`bladeControlLift`): no instance data changes while blades move.
 */
export const CONTROL_BLADES: readonly ControlBladeState[] = layout.blades;

let version = 0;
export const bladePatternVersion = () => version;

/** Named base insertion patterns (review states, the presentation's starting state). */
export type BladePattern = 'withdrawn' | 'operating' | 'partial';

/**
 * Stage 8 control amount, 0..1 [EDUCATIONAL REPRESENTATIVE MOTION]: every blade moves from its
 * base insertion towards base + shift (config/control.ts), the same distance for all, so the
 * base pattern's relative variation is kept exactly. The shift is clamped so that no blade of the
 * current base pattern passes full insertion.
 */
let controlAmount = 0;
let shift: number = CONTROL_TARGET.shift;

/**
 * Presentation v1 shutdown, 0..1: every blade from its pattern position to full insertion (the
 * talk's "the chain reaction stops"). The control shift fades out with it, so no blade passes full
 * insertion. 0 (the default, and after any pattern change) leaves everything exactly as before.
 * While it moves, the 57 matrices are rewritten (a ~1.5 s move, then idle again).
 */
let scram = 0;
const patternBase: number[] = layout.blades.map(() => 0);

function applyControl(): void {
  const lift = controlAmount * shift * (1 - scram);
  for (let i = 0; i < layout.blades.length; i++) {
    const blade = layout.blades[i]!;
    blade.insertion = blade.base + lift;
  }
}

export function setBladeScram(amount: number): void {
  const s = Math.min(1, Math.max(0, amount));
  if (s === scram) return;
  scram = s;
  layout.blades.forEach((blade, i) => (blade.base = patternBase[i]! + (1 - patternBase[i]!) * s));
  applyControl();
  version++;
}

/** Stage 8: move every blade from its base towards its target (no-op when unchanged). */
export function setBladeControl(amount: number): void {
  const a = Math.min(1, Math.max(0, amount));
  if (a === controlAmount) return;
  controlAmount = a;
  applyControl();
}

export const bladeControlAmount = () => controlAmount;

/** The deeper target of a blade (control amount 1) in the current base pattern. */
export const bladeTargetInsertion = (base: number) => base + shift;

/** How far every blade has moved from its base (insertion units: x BLADE.length metres). */
export const bladeControlLift = () => controlAmount * shift * (1 - scram);

/**
 * - withdrawn: every blade below the core (fuel fully exposed).
 * - operating: [APPROX] a sparse symmetric group partly inserted, the rest withdrawn - the kind
 *   of pattern used at power. Not an official rod pattern.
 * - partial: every blade half-way in, to show where the blades travel.
 */
export function setBladeInsertion(pattern: BladePattern): void {
  scram = 0;
  layout.blades.forEach((blade, i) => {
    const [x, z] = blade.position;
    const col = Math.round(x / CORE.cellPitch);
    const row = Math.round(z / CORE.cellPitch);
    const controlGroup = (Math.abs(col) === 2 && Math.abs(row) === 2) || (col === 0 && row === 0) || (Math.abs(col) + Math.abs(row) === 3 && (col === 0 || row === 0));
    blade.base = pattern === 'withdrawn' ? 0 : pattern === 'partial' ? 0.55 : controlGroup ? 0.35 : 0;
    patternBase[i] = blade.base;
  });
  shift = Math.min(CONTROL_TARGET.shift, 1 - Math.max(...layout.blades.map((b) => b.base)));
  applyControl();
  version++;
}

setBladeInsertion('operating');
