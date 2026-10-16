/**
 * Stage 10: the fission inset's static data, built once (deterministic, seeded): the two nuclei
 * as packed sphere clusters, which spheres form which fragment, the fragments' rest arrangement,
 * the neutrons, and the derived points (split point, absorption points). Everything that moves is
 * computed on the GPU from τ (fissionShaders.ts); nothing here changes per frame.
 *
 * [SCHEMATIC — NOT TO SCALE / NOT EXACT NUCLEON COUNT] 96 spheres per nucleus; two tones in the
 * U-235 proportion (92 : 143); fragments split by the given share along a fixed axis.
 */
import { Vector3 } from 'three';
import { FISSION_LAYOUT as L } from '../../config/fission';
import { seededRandom } from '../flow/flowPaths';

type V3 = [number, number, number];

/** Sphere centres of the outer layer sit here (unit nucleus radius) so the cluster's edge is at ~1. */
const PACK = 0.8;

/**
 * A dense, even ball of `n` points (radius `r`): seeded random points uniform in the ball, each
 * at least a spacing apart (relaxed slowly if the ball fills up). Round and lumpy, no pattern.
 */
function packBall(n: number, r: number, seed: string): V3[] {
  const rnd = seededRandom(seed);
  const out: V3[] = [];
  let spacing = 0.92 * Math.cbrt(((4 / 3) * Math.PI * r ** 3) / n);
  let misses = 0;
  while (out.length < n) {
    const p: V3 = [rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1];
    if (p[0] ** 2 + p[1] ** 2 + p[2] ** 2 > 1) continue;
    const q = scale(p, r);
    if (out.every((o) => Math.hypot(...sub(o, q)) >= spacing)) {
      out.push(q);
      misses = 0;
    } else if (++misses > 400) {
      spacing *= 0.98;
      misses = 0;
    }
  }
  return out;
}

const dot = (a: V3, b: readonly number[]) => a[0] * b[0]! + a[1] * b[1]! + a[2] * b[2]!;
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const scale = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s];
const norm = (a: V3): V3 => scale(a, 1 / Math.hypot(...a));
const mean = (ps: V3[]): V3 => scale(ps.reduce(add, [0, 0, 0]), 1 / ps.length);

export interface NucleusData {
  center: V3;
  radius: number;
  axis: V3;
  /** Axis projection of the plane between the two fragments (unit coordinates). */
  split: number;
  /** Fragment centroids (unit coordinates): light (+1) and heavy (−1). */
  centLight: V3;
  centHeavy: V3;
  lightShare: number;
  home: V3[];
  side: number[];
  rest: V3[];
  tone: number[];
}

/** Assign each fragment sphere a slot of a round fragment ball, nearest first (few crossings). */
function restSlots(offsets: V3[], share: number, seed: string): V3[] {
  const slots = packBall(offsets.length, PACK * Math.cbrt(share), seed);
  const used = new Array<boolean>(slots.length).fill(false);
  const order = offsets.map((o, i) => [Math.hypot(...o), i] as const).sort((a, b) => b[0] - a[0]);
  const out: V3[] = new Array(offsets.length);
  for (const [, i] of order) {
    let best = -1;
    let bestD = Infinity;
    for (let s = 0; s < slots.length; s++) {
      if (used[s]) continue;
      const d = Math.hypot(...sub(slots[s]!, offsets[i]!));
      if (d < bestD) {
        bestD = d;
        best = s;
      }
    }
    used[best] = true;
    out[i] = slots[best]!;
  }
  return out;
}

function buildNucleus(spec: { center: readonly number[]; radius: number; axis: readonly number[]; lightShare: number }, seed: string): NucleusData {
  const n = L.nucleons;
  const home = packBall(n, PACK, `${seed}:home`);
  const axis = norm(spec.axis as unknown as V3);
  const proj = home.map((h) => dot(h, axis));
  const order = proj.map((p, i) => [p, i] as const).sort((a, b) => a[0] - b[0]);
  const nLight = Math.round(n * spec.lightShare);
  const nHeavy = n - nLight;
  const side = new Array<number>(n).fill(-1);
  for (let k = nHeavy; k < n; k++) side[order[k]![1]] = 1;
  const split = (order[nHeavy - 1]![0] + order[nHeavy]![0]) / 2;
  const light = home.filter((_, i) => side[i] === 1);
  const heavy = home.filter((_, i) => side[i] === -1);
  const centLight = mean(light);
  const centHeavy = mean(heavy);
  const rest: V3[] = new Array(n);
  const lightIdx = home.map((_, i) => i).filter((i) => side[i] === 1);
  const heavyIdx = home.map((_, i) => i).filter((i) => side[i] === -1);
  const lightRest = restSlots(lightIdx.map((i) => sub(home[i]!, centLight)), spec.lightShare, `${seed}:light`);
  const heavyRest = restSlots(heavyIdx.map((i) => sub(home[i]!, centHeavy)), 1 - spec.lightShare, `${seed}:heavy`);
  lightIdx.forEach((i, k) => (rest[i] = lightRest[k]!));
  heavyIdx.forEach((i, k) => (rest[i] = heavyRest[k]!));
  // Exactly the U-235 share of "proton" tones, seeded.
  const rnd = seededRandom(`${seed}:tone`);
  const shuffled = home.map((_, i) => [rnd(), i] as const).sort((a, b) => a[0] - b[0]);
  const tone = new Array<number>(n).fill(0);
  const nProton = Math.round(n * L.protonShare);
  for (let k = 0; k < nProton; k++) tone[shuffled[k]![1]] = 1;
  return { center: [...spec.center] as V3, radius: spec.radius, axis, split, centLight, centHeavy, lightShare: spec.lightShare, home, side, rest, tone };
}

/** A neutron absorbed into a nucleus: where it ends up inside, and which fragment it joins. */
function absorbed(nucleus: NucleusData, from: V3) {
  const dir = norm(sub(from, nucleus.center));
  const home = scale(dir, 0.62);
  const side = dot(home, nucleus.axis) > nucleus.split ? 1 : -1;
  const cent = side > 0 ? nucleus.centLight : nucleus.centHeavy;
  const share = side > 0 ? nucleus.lightShare : 1 - nucleus.lightShare;
  const rest = scale(norm(sub(home, cent)), PACK * Math.cbrt(share) * 0.85);
  return { home, side, cent, rest, point: add(nucleus.center, scale(home, nucleus.radius)) };
}

export interface FissionData {
  a: NucleusData;
  b: NucleusData;
  /** Micro-space point where the first nucleus splits (the neck). */
  splitPoint: V3;
  n0: ReturnType<typeof absorbed>;
  n1: ReturnType<typeof absorbed>;
  /** Instance attributes: home, centroid, rest (vec3 each) and meta (role, side/id, tone, side). */
  instances: { home: Float32Array; cent: Float32Array; rest: Float32Array; meta: Float32Array; count: number };
}

export const ROLE = { a: 0, b: 1, neutron: 2 } as const;

let cache: FissionData | null = null;

export function fissionData(): FissionData {
  if (cache) return cache;
  const a = buildNucleus(L.a, 'fission-a');
  const b = buildNucleus(L.b, 'fission-b');
  const splitPoint = add(a.center, scale(a.axis, a.radius * a.split));
  const n0 = absorbed(a, [...L.neutronStart] as V3);
  const n1 = absorbed(b, splitPoint);
  const count = a.home.length + b.home.length + 4;
  const home = new Float32Array(count * 3);
  const cent = new Float32Array(count * 3);
  const rest = new Float32Array(count * 3);
  const meta = new Float32Array(count * 4);
  let k = 0;
  for (const [role, nuc] of [[ROLE.a, a], [ROLE.b, b]] as const) {
    nuc.home.forEach((h, i) => {
      home.set(h, k * 3);
      cent.set(nuc.side[i]! > 0 ? nuc.centLight : nuc.centHeavy, k * 3);
      rest.set(nuc.rest[i]!, k * 3);
      meta.set([role, nuc.side[i]!, nuc.tone[i]!, 0], k * 4);
      k++;
    });
  }
  // Neutrons: 0 incoming (joins A), 1 released towards B (joins B), 2-3 released and leaving.
  for (let id = 0; id < 4; id++) {
    const join = id === 0 ? n0 : id === 1 ? n1 : null;
    home.set(join ? join.home : [0, 0, 0], k * 3);
    cent.set(join ? join.cent : [0, 0, 0], k * 3);
    rest.set(join ? join.rest : [0, 0, 0], k * 3);
    meta.set([ROLE.neutron, id, 0, join ? join.side : 0], k * 4);
    k++;
  }
  cache = { a, b, splitPoint, n0, n1, instances: { home, cent, rest, meta, count } };
  return cache;
}

/**
 * Presentation v1 chain variant (src/presentation): the same two nuclei and neutrons, plus three
 * neutrons released by the second split (ids 4-6), and the point where it splits. The Stage 10
 * data above is not touched.
 */
export function fissionChainData(): FissionData & { splitPointB: V3 } {
  const d = fissionData();
  const extra = 3;
  const count = d.instances.count + extra;
  const grow = (src: Float32Array, size: number) => {
    const out = new Float32Array(count * size);
    out.set(src);
    return out;
  };
  const home = grow(d.instances.home, 3);
  const cent = grow(d.instances.cent, 3);
  const rest = grow(d.instances.rest, 3);
  const meta = grow(d.instances.meta, 4);
  for (let i = 0; i < extra; i++) meta.set([ROLE.neutron, 4 + i, 0, 0], (d.instances.count + i) * 4);
  const splitPointB = add(d.b.center, scale(d.b.axis, d.b.radius * d.b.split));
  return { ...d, splitPointB, instances: { home, cent, rest, meta, count } };
}

/** Diagnostics: the counts and derived points (automation, review report). */
export function fissionStats() {
  const d = fissionData();
  const light = (n: NucleusData) => n.side.filter((s) => s > 0).length;
  return {
    instances: d.instances.count,
    nucleonsPerNucleus: L.nucleons,
    protonTones: d.a.tone.reduce((s, t) => s + t, 0),
    lightFragment: light(d.a),
    heavyFragment: L.nucleons - light(d.a),
    secondNucleusLight: light(d.b),
    splitPoint: d.splitPoint.map((v) => +v.toFixed(3)),
  };
}

/** For the vertex shader: a GLSL vec3 literal. */
export const glslVec3 = (v: readonly number[] | Vector3) => {
  const a = v instanceof Vector3 ? v.toArray() : v;
  return `vec3( ${a.map((x) => Number(x).toFixed(6)).join(', ')} )`;
};
