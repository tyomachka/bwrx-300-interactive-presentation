/**
 * Presentation v1 fission: the Stage 10 inset's nuclei and motion, extended into a complete chain
 * (scene/fission/fissionShaders.ts ChainOptions) and looped while the presenter explains:
 *
 *   neutron -> U-235 -> excited, dumbbell -> split -> two fragments, heat, 3 neutrons
 *   -> one neutron -> a second U-235 -> it splits too -> heat, 3 more neutrons -> fade -> again
 *
 * Two fissions, then it stops and starts over: enough to show "chain", never an exponential burst.
 * [SCHEMATIC - NOT TO SCALE / NOT EXACT NUCLEON COUNT] as in Stage 10 (TECHNICAL_FACTS FIS-01..07).
 * Positions are micro units: screen half-heights at the inset depth (y -1..1, x +-aspect).
 */
import { FISSION_LAYOUT as L } from '../../config/fission';
import { fissionChainData } from '../../scene/fission/fissionData';
import type { ChainOptions } from '../../scene/fission/fissionShaders';
import type { CopyKey } from '../copy';

const data = fissionChainData();

export const CHAIN_OPTIONS: ChainOptions = {
  split: 3.9,
  fragmentSpeed: 1.25,
  neutrons: [
    [0.97, 0.24, 0],
    [0.6, -0.8, 0],
    [-0.08, -1, 0],
  ],
  heat: [4.0, 5.6],
  splitPoint: data.splitPointB,
};

/** The loop (τ seconds): played at `speed` τ per second, faded out at its end and in at its start. */
export const CHAIN_LOOP = { period: 8.6, speed: 0.78, fadeIn: [0, 0.35] as const, fadeOut: [7.7, 8.4] as const } as const;

const [ax, ay] = L.a.center;
const [bx, by] = L.b.center;
const [sx, sy] = data.splitPoint;

/** Labels in micro units, each with its τ window (shown once per loop). */
export const CHAIN_LABELS: readonly { key: CopyKey; at: readonly [number, number]; window: readonly [number, number]; side: 'up' | 'down' | 'left' | 'right' }[] = [
  { key: 'fission.neutron', at: [L.neutronStart[0] + 1.0, L.neutronStart[1] + 0.1], window: [0.45, 1.35], side: 'up' },
  { key: 'fission.nucleus', at: [ax, ay + L.a.radius + 0.06], window: [0.3, 2.05], side: 'up' },
  { key: 'fission.heat', at: [sx + 0.22, sy - 0.42], window: [2.6, 4.4], side: 'right' },
  { key: 'fission.newNeutrons', at: [sx - 0.3, sy + 0.5], window: [2.25, 3.6], side: 'left' },
  { key: 'fission.chain', at: [bx + 0.18, by + L.b.radius + 0.12], window: [3.4, 7.6], side: 'right' },
];

/** What the overlay needs to place the labels this frame (written by ChainFission). */
export const microView = {
  active: false,
  /** Iris centre (the fuel spot) in NDC. */
  spot: [0, 0] as [number, number],
  zoom: 1,
  /** Label visibility (open x loop fade). */
  alpha: 0,
  tau: 0,
};

export const chainData = data;
