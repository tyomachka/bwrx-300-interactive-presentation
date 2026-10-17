/**
 * Presentation v1 fission: the Stage 10 inset's nuclei and motion, extended into a complete chain
 * (scene/fission/fissionShaders.ts ChainOptions) and looped while the presenter explains:
 *
 *   neutron -> U-235 -> excited, dumbbell -> split -> two fragments, heat, 3 neutrons
 *   -> one neutron -> a second U-235 -> it splits too -> heat, 3 more neutrons -> the next chain fades in over it
 *
 * Two fissions, then it stops and starts over: enough to show "chain", never an exponential burst.
 * [SCHEMATIC - NOT TO SCALE / NOT EXACT NUCLEON COUNT] as in Stage 10 (TECHNICAL_FACTS FIS-01..07).
 * Positions are micro units: screen half-heights at the inset depth (y -1..1, x +-aspect).
 */
import { FISSION_LAYOUT as L, FISSION_TIMING } from '../../config/fission';
import { fissionChainData } from '../../scene/fission/fissionData';
import type { ChainOptions } from '../../scene/fission/fissionShaders';
import type { CopyKey } from '../copy';
import type { Tone } from '../design';

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

/**
 * The loop (τ seconds): one chain lasts `period` τ, played at `speed` τ per second. The next chain
 * starts before this one has faded (ChainFission.tsx OVERLAP): a cross-dissolve, never a dark seam.
 */
export const CHAIN_LOOP = { period: 8.6, speed: 0.78 } as const;

const [ax, ay] = L.a.center;
const [bx, by] = L.b.center;
const [sx, sy] = data.splitPoint;

/** A label that rides on a moving particle: the shader's own path (fissionShaders.ts neutron()). */
export interface MicroPath {
  from: readonly [number, number];
  to: readonly [number, number];
  /** τ window of the move; before / after it the dot rests at `from` / `to`. */
  t: readonly [number, number];
  /** 1 linear; > 1 the shader's ease-out 1 - (1 - x)^power. */
  power: number;
}

export interface MicroLabel {
  key: CopyKey;
  /** The dot (micro units): a fixed point, or offset from a moving particle (`path`). */
  at: readonly [number, number];
  path?: MicroPath;
  window: readonly [number, number];
  leader: readonly [number, number];
  tone: Tone;
}

const T = FISSION_TIMING;
const xy = (v: readonly number[]) => [v[0]!, v[1]!] as const;
/** Just above a free neutron's sphere (micro units). */
const ABOVE_NEUTRON = [0, 0.09] as const;

/**
 * Labels in micro units, each with its τ window (shown once per loop): role-1 anchored labels, the
 * dot on the thing, the text along a fine leader (px at 1080p). A neutron's label rides with it.
 * Neutrons and nuclei neutral, heat copper (heat / fission meaning), the chain itself the one
 * current concept (amber).
 */
export const CHAIN_LABELS: readonly MicroLabel[] = [
  // The incoming neutron, while it crosses the view (absorbed at the end of T.neutronIn).
  { key: 'fission.neutron', at: ABOVE_NEUTRON, path: { from: xy(L.neutronStart), to: xy(data.n0.point), t: T.neutronIn, power: 1 }, window: [0.45, 1.12], leader: [-12, -44], tone: 'neutral' },
  { key: 'fission.nucleus', at: [ax, ay + L.a.radius + 0.03], window: [0.3, 2.05], leader: [0, -40], tone: 'neutral' },
  // In the heat that the first split leaves along its fragments' paths.
  { key: 'fission.heat', at: [sx + 0.06, sy + 0.01], window: [2.4, 4.2], leader: [70, 64], tone: 'copper' },
  // The released neutron that goes on to the second U-235 (the chain).
  { key: 'fission.newNeutrons', at: ABOVE_NEUTRON, path: { from: xy(data.splitPoint), to: xy(data.n1.point), t: [T.split, T.chainAbsorb], power: 2.2 }, window: [2.1, 2.85], leader: [-24, -44], tone: 'neutral' },
  { key: 'fission.chain', at: [bx + 0.1, by + L.b.radius + 0.04], window: [3.4, 7.6], leader: [40, -34], tone: 'amber' },
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
