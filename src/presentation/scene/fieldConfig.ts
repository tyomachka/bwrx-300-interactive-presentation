/**
 * Presentation v1 fission (Stage 3): a chain reaction that branches and then holds steady, in the fuel.
 *
 *   generation 0  one neutron, one U-235 nucleus: absorbed, excited, split; fragments carry the energy
 *                 away as heat; three neutrons fly off
 *   generation 1  two of them split two more nuclei; the third is absorbed without a fission
 *   generation 2  three fissions at once, spread out
 *   steady state  the view widens into the fuel: three chains, each fission sending exactly one neutron
 *                 on (the others absorbed), so the number of fissions stays constant: the controlled
 *                 chain reaction. It runs indefinitely: no restart, no blank, no growth without bound.
 *
 * Built as 15 sites on three closed rings plus 7 nuclei that never split. Every site repeats one cycle
 * forever (absorb -> excite -> split -> fragments fade -> a fresh nucleus appears next to the old spot
 * -> the next neutron arrives); along a ring, each site's neutron reaches the next site exactly when
 * that site's cycle absorbs it. Two first fissions also seed the second and third rings: that is the
 * growth. Everything is a function of the chain time τ (no history): any seek shows the same frame.
 *
 * [SCHEMATIC — NOT TO SCALE / NOT EXACT NUCLEON COUNT] 96 spheres per nucleus (Stage 10 nuclei),
 * no electrons, no gamma rays, neutron moderation not drawn; not every neutron causes a fission, the
 * heat is drawn along the fragments' paths and as a slowly gathering warmth in the fuel, never as a
 * glow on the nuclei (references/TECHNICAL_FACTS.md FIS-01..07).
 *
 * Units: "field units", the screen half-height at the inset depth when the view scale is 1.
 */
import type { CopyKey } from '../copy';
import type { Tone } from '../design';

type V2 = readonly [number, number];

/** Seconds (chain time τ): one site's cycle and the generation-0 neutron. */
export const FIELD_CYCLE = {
  /** Absorption -> split (excited, wobbling, dumbbell). */
  excite: 0.7,
  /** After the split: fragments relax and fly apart, then fade out over `fade` (fission products). */
  fragmentsFadeAt: 2.6,
  fragmentsFade: 1.6,
  /** After the split: the next nucleus fades in next to the spot (another U-235 in the fuel). */
  nextAt: 4.6,
  nextFade: 0.8,
  /** The generation-0 neutron's crossing (τ) and where it starts. */
  incoming: [0.6, 1.5] as const,
  /** Just outside the opening view's left edge, so the neutron is seen for nearly its whole flight. */
  incomingStart: [-2.25, 0.42] as V2,
} as const;

/** Nucleus radius and fragment motion in the field (field units, units/s). */
export const FIELD_MOTION = {
  radius: 0.3,
  /** Light fragment launch speed (the heavy one keeps equal momentum), decaying with Stage 10's drag. */
  fragmentSpeed: 1.25,
  /** Absorbed neutrons fly decelerating; lost ones slow down and fade (absorbed without a fission). */
  lostSpeed: 1.1,
  lostFade: [0.55, 1.15] as const,
} as const;

interface Ring {
  /** Absorption time of the first site's first cycle (τ). */
  start: number;
  /** Time between consecutive sites' absorptions (τ); the flight is step − excite. */
  step: number;
  sites: readonly V2[];
}

/**
 * The three rings. Ring 0 starts with the generation-0 nucleus (A); A's first split also sends a
 * neutron to ring 1's first site (C), and B's (ring 0, second site) to ring 2's first site (E).
 */
export const FIELD_RINGS: readonly Ring[] = [
  // A, B, D, G, H
  { start: 1.5, step: 1.6, sites: [[-0.85, 0.1], [0.3, 0.6], [1.3, 1.1], [0.1, 1.85], [-1.25, 1.25]] },
  // C, F, I, J, K: C absorbs A's second neutron 1.1 s after A splits
  { start: 1.5 + 0.7 + 1.1, step: 1.75, sites: [[0.2, -0.7], [1.25, -1.15], [0.75, -2.2], [-0.65, -2.0], [-1.15, -1.05]] },
  // E, L, M, N, O: E absorbs B's second neutron 1.0 s after B splits
  { start: 1.5 + 1.6 + 0.7 + 1.0, step: 1.45, sites: [[1.55, 0.0], [2.55, 0.75], [3.45, -0.1], [2.95, -1.25], [2.1, -1.35]] },
];

/** Nuclei in the fuel that do not split while we watch. */
export const FIELD_IDLE: readonly V2[] = [
  [-2.4, -0.55],
  [-2.7, 0.95],
  [-3.2, -1.7],
  [-2.3, 2.05],
  [3.55, 1.55],
  [1.65, 2.1],
  [-1.95, -2.25],
];

/** The view (field units): centred on generation 0, then widening to the whole field. */
export const FIELD_VIEW = {
  start: [0.05, 0.05, 0.86] as const,
  /** The whole field, right of centre: the left column keeps the chapter label and the claim clear. */
  end: [-0.35, -0.07, 0.31] as const,
  /** τ window of the widening (smootherstep). */
  widen: [3.4, 7.8] as const,
};

/**
 * Real seconds after the view opens -> chain time τ: generation 0 plays at 3/4 speed so it can be
 * followed, easing to full speed by the steady state (τ = 8.0 at 10 s, then 1:1).
 */
export function chainTime(t: number): number {
  if (t <= 6) return 0.75 * Math.max(t, 0);
  if (t <= 10) return 4.5 + 0.75 * (t - 6) + 0.03125 * (t - 6) ** 2;
  return 8 + (t - 10);
}

/** Seconds after the view opens when the steady state reads (the "controlled" claim fades in). */
export const FIELD_TIMING = { steadyLabel: 10.6 } as const;

const smoother = (x: number) => {
  const t = Math.min(Math.max(x, 0), 1);
  return t * t * t * (t * (t * 6 - 15) + 10);
};

/** The view centre and scale at τ (the shaders compute the same). */
export function fieldView(tau: number): [number, number, number] {
  const k = smoother((tau - FIELD_VIEW.widen[0]) / (FIELD_VIEW.widen[1] - FIELD_VIEW.widen[0]));
  const [a, b] = [FIELD_VIEW.start, FIELD_VIEW.end];
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
}

// ---- Labels (role-1 anchored labels in the micro view; the overlay places them) ---------------------

export interface FieldLabel {
  key: CopyKey;
  /** The dot at τ (field units). */
  anchor: (tau: number) => V2;
  /** τ window (shown once). */
  window: V2;
  /** Text offset along the leader (px at 1080p). */
  leader: V2;
  tone: Tone;
}

const A = FIELD_RINGS[0]!.sites[0]!;
const R = FIELD_MOTION.radius;
const C = FIELD_CYCLE;
/** Above a free neutron's sphere. */
const ABOVE = 0.09;

/** The generation-0 neutron (the shader's straight crossing to A's absorption point). */
function incomingAt(tau: number): V2 {
  const [t0, t1] = C.incoming;
  const x = Math.min(Math.max((tau - t0) / (t1 - t0), 0), 1);
  const s = C.incomingStart;
  const dx = A[0] - s[0];
  const dy = A[1] - s[1];
  const d = Math.hypot(dx, dy);
  const end: V2 = [A[0] - (dx / d) * R * 0.55, A[1] - (dy / d) * R * 0.55];
  return [s[0] + (end[0] - s[0]) * x, s[1] + (end[1] - s[1]) * x];
}

/** The angle of A's absorbed-without-fission neutron in its first cycle (shader: lost angle 2). */
export const A_LOST_ANGLE = 2.35;

function lostAt(tau: number): V2 {
  const split = FIELD_RINGS[0]!.start + C.excite;
  const dt = Math.max(tau - split, 0);
  const k = 1.2;
  const r = (FIELD_MOTION.lostSpeed * (1 - Math.exp(-k * dt))) / k;
  return [A[0] + Math.cos(A_LOST_ANGLE) * r, A[1] + Math.sin(A_LOST_ANGLE) * r];
}

const split0 = FIELD_RINGS[0]!.start + C.excite;

export const FIELD_LABELS: readonly FieldLabel[] = [
  { key: 'fission.neutron', anchor: (t) => { const p = incomingAt(t); return [p[0], p[1] + ABOVE]; }, window: [C.incoming[0] - 0.1, C.incoming[1] - 0.05], leader: [-12, -44], tone: 'neutral' },
  { key: 'fission.nucleus', anchor: () => [A[0], A[1] + R + 0.04], window: [0.3, split0], leader: [0, -40], tone: 'neutral' },
  { key: 'fission.heat', anchor: () => [A[0] + 0.12, A[1] - 0.04], window: [split0 + 0.4, split0 + 2.3], leader: [70, 64], tone: 'copper' },
  { key: 'fission.lost', anchor: (t) => { const p = lostAt(t); return [p[0], p[1] + ABOVE]; }, window: [split0 + 0.15, split0 + 1.05], leader: [-30, -40], tone: 'neutral' },
  { key: 'fission.chain', anchor: () => [0.95, 0.3], window: [FIELD_RINGS[2]!.start - 0.2, 8.4], leader: [44, -40], tone: 'amber' },
];

/** What the overlay needs to place the labels this frame (written by FissionField). */
export const microView = {
  active: false,
  /** Iris centre (the fuel spot) in NDC. */
  spot: [0, 0] as [number, number],
  zoom: 1,
  /** The view: centre x, y and scale (field units -> screen half-heights at zoom 1). */
  view: [0, 0, 1] as [number, number, number],
  /** Label visibility (the view's opening). */
  alpha: 0,
  tau: 0,
};
