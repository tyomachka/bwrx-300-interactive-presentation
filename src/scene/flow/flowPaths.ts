/**
 * Stage 7: the vessel's natural-circulation streamlines as data (pure, deterministic).
 *
 * Coordinates are the vessel datum of rpvData.ts: x, z plan (reactor axis at 0), y = h above the
 * inside bottom of the vessel. Each path is baked into one row of a float texture: 64 samples at
 * equal *time* steps (xyz position, w phase), so the spacing of the samples encodes the speed and
 * the shader moves a particle along it with nothing but `fract(seed + time / duration)`.
 *
 * Where the paths run follows what the quarter cut (x < 0, z > 0) lets the camera see:
 *  - the core and the two downcomer slots are drawn at the section faces, just in front of the
 *    cut (`face`): the fuel channels are opaque, and the downcomer is a 0.5 m annulus that the cut
 *    only exposes at its two cut edges;
 *  - the chimney, the separator tops, the dryer and the steam dome are open volumes seen through
 *    the cut (`volume`): their particles are removed with the cut quadrant like the internals;
 *  - a ring of downcomer paths around the whole annulus shows through an X-rayed vessel.
 * Upward (centre: core, chimney) and downward (outer slots) never share screen space.
 *
 * Seeds come from the channel name and path index: every build, quality and canvas is identical.
 */
import { CatmullRomCurve3, MathUtils, Vector3 } from 'three';
import { FLOW_PATH_SAMPLES as S, PHASE, VESSEL_FLOW_CHANNELS, VESSEL_FLOW_SPEC, type FlowClip, type VesselFlowChannel } from '../../config/flow';
import { CORE, DRYER, NOZZLES, SEPARATORS, SHROUD, VESSEL } from '../rpv/rpvData';
import { bottomHeadInnerH, separatorPositions } from '../rpv/rpvGeometry';

export interface FlowPath {
  channel: VesselFlowChannel;
  clip: FlowClip;
  /** Seconds for one traversal. */
  duration: number;
  /** Particles on this streamline. */
  particles: number;
}

export interface FlowPathSet {
  /** RGBA32F texels, `S` per row, one row per path. */
  data: Float32Array;
  paths: FlowPath[];
}

// ---- Deterministic randomness -------------------------------------------------------------------------

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** mulberry32: a small, stable PRNG (same sequence on every machine). */
export function seededRandom(seed: string): () => number {
  let a = hash(seed);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---- Vessel heights (h, m above the inside bottom) -------------------------------------------------------

const H = {
  /** Lower plenum, just under the core plate: where the core face streams start. */
  coreInlet: 3.95,
  coreTop: 9.45,
  boilStart: CORE.bottomOfActiveFuelH + 0.5,
  boilFull: CORE.bottomOfActiveFuelH + CORE.activeHeight + 0.3,
  chimneyBottom: 9.5,
  /** Under the chimney-head plate: the discharge plenum where the mixture enters the standpipes. */
  headPlate: 16.93,
  downcomerTop: 17.3,
  separatorBottom: SEPARATORS.standpipe.topH + 0.15,
  capTop: SEPARATORS.cap.topH + 0.02,
  dryerBase: DRYER.banks.baseH,
  nozzle: NOZZLES.mainSteam.h,
} as const;

const CORE_EDGE = 1.4; // half-width of the fuel at the cut faces (m)
const ANNULUS = { inner: SHROUD.outerRadius + 0.08, outer: VESSEL.innerRadius - 0.06 };
const nozzleDir = (() => {
  const a = (NOZZLES.mainSteam.azimuthDeg[0] * Math.PI) / 180;
  return { x: Math.cos(a), z: Math.sin(a) };
})();

// ---- Baking ---------------------------------------------------------------------------------------------------

const _a = new Vector3();

/**
 * Write one path into row `row`: `points` dense along the curve, `phaseAt` / `speedAt` per point.
 * Returns the traversal time.
 */
function bake(points: Vector3[], phaseAt: (p: Vector3) => number, speedAt: (p: Vector3, phase: number) => number, out: Float32Array, row: number): number {
  const n = points.length;
  const times = new Float64Array(n);
  const phases = new Float64Array(n);
  for (let i = 0; i < n; i++) phases[i] = phaseAt(points[i]!);
  for (let i = 1; i < n; i++) {
    const ds = points[i]!.distanceTo(points[i - 1]!);
    const v = 0.5 * (speedAt(points[i]!, phases[i]!) + speedAt(points[i - 1]!, phases[i - 1]!));
    times[i] = times[i - 1]! + ds / Math.max(v, 0.05);
  }
  const total = times[n - 1]!;
  let j = 0;
  for (let k = 0; k < S; k++) {
    const t = (total * k) / (S - 1);
    while (j < n - 2 && times[j + 1]! < t) j++;
    const span = times[j + 1]! - times[j]!;
    const f = span > 0 ? MathUtils.clamp((t - times[j]!) / span, 0, 1) : 0;
    _a.lerpVectors(points[j]!, points[j + 1]!, f);
    const o = (row * S + k) * 4;
    out[o] = _a.x;
    out[o + 1] = _a.y;
    out[o + 2] = _a.z;
    out[o + 3] = MathUtils.lerp(phases[j]!, phases[j + 1]!, f);
  }
  return total;
}

const curve = (points: Vector3[], dense = 120) => new CatmullRomCurve3(points, false, 'centripetal').getPoints(dense);

function line(from: Vector3, to: Vector3, steps: number): Vector3[] {
  return Array.from({ length: steps + 1 }, (_, i) => new Vector3().lerpVectors(from, to, i / steps));
}

// ---- Channels -----------------------------------------------------------------------------------------------------

interface Builder {
  clip: (i: number, rnd: () => number) => FlowClip;
  points: (i: number, count: number, rnd: () => number) => Vector3[];
  phase: (p: Vector3) => number;
  speed: (p: Vector3, phase: number, rnd: number) => number;
}

const SEPARATOR_UNITS = separatorPositions();
const OUTER_UNITS = SEPARATOR_UNITS.filter(([x, z]) => Math.hypot(x, z) >= 0.85);

function nearestUnit(x: number, z: number): [number, number] {
  let best = SEPARATOR_UNITS[0]!;
  let d = Infinity;
  for (const u of SEPARATOR_UNITS) {
    const e = (u[0] - x) ** 2 + (u[1] - z) ** 2;
    if (e < d) {
      d = e;
      best = u;
    }
  }
  return best;
}

/** Dryer channels between the chevron banks (z centre, half width, height where steam leaves). */
const DRYER_GAPS = (() => {
  const { rows, thickness, baseH, footprintRadius } = DRYER.banks;
  const top = (z: number) => baseH + (rows.find((r) => Math.abs(r.z - z) < 1e-6)?.height ?? 0);
  const gaps = [{ z: 0, half: rows[0]!.z - thickness / 2 - 0.05, exit: top(rows[0]!.z) }];
  for (let i = 0; i < rows.length - 1; i++) {
    const a = rows[i]!;
    const b = rows[i + 1]!;
    gaps.push({ z: (a.z + b.z) / 2, half: (b.z - a.z - thickness) / 2 - 0.05, exit: Math.min(top(a.z), top(b.z)) });
  }
  const last = rows[rows.length - 1]!;
  const outer = last.z + thickness / 2;
  gaps.push({ z: (outer + footprintRadius) / 2, half: (footprintRadius - outer) / 2 - 0.05, exit: top(last.z) });
  return gaps.map((g) => ({ ...g, exit: g.exit + 0.12 }));
})();

function dryerStart(rnd: () => number): { x: number; z: number; exit: number } {
  const gap = DRYER_GAPS[Math.min(DRYER_GAPS.length - 1, Math.floor(rnd() * DRYER_GAPS.length))]!;
  const sign = gap.z === 0 || rnd() < 0.5 ? 1 : -1;
  const z = sign * gap.z + gap.half * (2 * rnd() - 1) * 0.8;
  const chord = Math.sqrt(Math.max(0, 1.72 ** 2 - z * z));
  return { x: -chord + 2 * chord * rnd(), z, exit: gap.exit };
}

const BUILDERS: Record<VesselFlowChannel, Builder> = {
  /** Up through the fuel, at the two cut faces: water at the inlet, a mixture by the top. */
  coreWater: {
    clip: () => 'face',
    points: (i, count, rnd) => {
      const face = i % 2;
      const k = Math.floor(i / 2);
      const s = 0.06 + (CORE_EDGE - 0.06) * ((k + 0.15 + 0.7 * rnd()) / Math.ceil(count / 2));
      const d = 0.03 + 0.17 * rnd();
      const [x, z] = face === 0 ? [-d, s] : [-s, d];
      return line(new Vector3(x, H.coreInlet, z), new Vector3(x, H.coreTop, z), 60);
    },
    phase: (p) => PHASE.mixture * MathUtils.smoothstep(p.y, H.boilStart, H.boilFull),
    speed: (_p, phase, r) => MathUtils.lerp(1.5, 2.8, phase) * (0.9 + 0.2 * r),
  },
  /** The mixture rising through the chimney, converging into the standpipes under the head. */
  chimneyMixture: {
    clip: () => 'volume',
    points: (_i, _count, rnd) => {
      const r = (SHROUD.innerRadius - 0.08) * Math.sqrt(rnd());
      const a = rnd() * Math.PI * 2;
      const x = r * Math.cos(a);
      const z = r * Math.sin(a);
      const [ux, uz] = nearestUnit(x * 0.92, z * 0.92);
      return curve([
        new Vector3(x, H.chimneyBottom, z),
        new Vector3(x, 12.5, z),
        new Vector3(x, 15.7, z),
        new Vector3((x + ux) / 2, 16.5, (z + uz) / 2),
        new Vector3(ux, H.headPlate, uz),
      ]);
    },
    phase: () => PHASE.mixture,
    speed: (p, _phase, r) => (2.6 + 0.7 * r) * (p.y > 16.2 ? 1.25 : 1),
  },
  /**
   * Down the annulus between the chimney / shroud and the vessel wall, at the two cut faces, then
   * round under the core plate and up into the core inlet. A third of the paths ring the whole
   * annulus (seen through an X-rayed vessel; hidden behind the chimney when cut).
   */
  downcomerWater: {
    clip: (i) => (i % 10 < 7 ? 'face' : 'volume'),
    points: (i, _count, rnd) => {
      const rho = ANNULUS.inner + (ANNULUS.outer - ANNULUS.inner) * rnd();
      if (i % 10 >= 7) {
        const a = rnd() * Math.PI * 2;
        return line(new Vector3(rho * Math.cos(a), H.downcomerTop, rho * Math.sin(a)), new Vector3(rho * Math.cos(a), 4.6, rho * Math.sin(a)), 40);
      }
      const across = -0.12 + 0.38 * rnd(); // < 0: just in front of the cut face; > 0: inside the slot
      const inner = 0.35 + 0.95 * rnd();
      const mid = (rho + inner) / 2;
      const bottom = Math.max(bottomHeadInnerH(mid) + 0.45, 1.7 + 0.5 * rnd());
      const slot = (r: number, h: number) => (i % 2 === 0 ? new Vector3(across, h, r) : new Vector3(-r, h, -across));
      return curve([slot(rho, H.downcomerTop), slot(rho, 12), slot(rho, 6), slot(rho, 4.4), slot(rho - 0.18, 3.1), slot(mid, bottom), slot(inner, 3.0), slot(inner, 4.05)], 160);
    },
    phase: () => PHASE.water,
    speed: (p, _phase, r) => (p.y > 4.3 ? 1.75 : 1.25) * (0.9 + 0.2 * r),
  },
  /**
   * Separated water leaving the lower portion of the outer separators, outwards and down into the
   * downcomer. Two in five are drawn at the cut faces, feeding the downcomer slots below them.
   */
  separatorWater: {
    clip: (i) => (i % 5 < 2 ? 'face' : 'volume'),
    points: (i, _count, rnd) => {
      if (i % 5 < 2) {
        const across = -0.12 + 0.32 * rnd();
        const r0 = 1.0 + 0.35 * rnd();
        const r1 = ANNULUS.inner + 0.1 + (ANNULUS.outer - ANNULUS.inner - 0.1) * rnd();
        const slot = (r: number, h: number) => (i % 2 === 0 ? new Vector3(across, h, r) : new Vector3(-r, h, -across));
        return curve([slot(r0, H.separatorBottom), slot(r0 + 0.15, 17.85), slot(r1 - 0.1, 17.35), slot(r1, 16.95), slot(r1, 16.3)]);
      }
      const [ux, uz] = OUTER_UNITS[(i * 7) % OUTER_UNITS.length]!;
      const base = Math.atan2(uz, ux) + (rnd() - 0.5) * 0.5;
      const nx = Math.cos(base);
      const nz = Math.sin(base);
      const ur = Math.hypot(ux, uz);
      const r2 = Math.max(ur + 0.45, ANNULUS.inner);
      const r3 = ANNULUS.inner + 0.08 + (ANNULUS.outer - ANNULUS.inner - 0.08) * rnd();
      return curve([
        new Vector3(ux + nx * 0.15, H.separatorBottom, uz + nz * 0.15),
        new Vector3(ux + nx * 0.3, 17.8, uz + nz * 0.3),
        new Vector3(nx * r2, 17.35, nz * r2),
        new Vector3(nx * r3, 16.95, nz * r3),
        new Vector3(nx * r3, 16.3, nz * r3),
      ]);
    },
    phase: () => PHASE.water,
    speed: (p, _phase, r) => (p.y > 17.2 ? 1.0 : 1.5) * (0.85 + 0.3 * r),
  },
  /** Wet steam leaving the separator caps, rising into the dryer. */
  separatorSteam: {
    clip: () => 'volume',
    points: (i, _count, rnd) => {
      const [ux, uz] = SEPARATOR_UNITS[(i * 5) % SEPARATOR_UNITS.length]!;
      const jx = (rnd() - 0.5) * 0.08;
      const jz = (rnd() - 0.5) * 0.08;
      return curve([new Vector3(ux + jx, H.capTop, uz + jz), new Vector3(ux + jx * 2, 21.0, uz + jz * 2), new Vector3(ux + jx * 3 + (rnd() - 0.5) * 0.15, 21.8, uz + jz * 3)], 40);
    },
    phase: () => PHASE.wetSteam,
    speed: (_p, _phase, r) => 2.0 + 0.6 * r,
  },
  /** Up between the chevron banks: droplets are caught, the steam leaves dry. */
  drySteam: {
    clip: () => 'volume',
    points: (_i, _count, rnd) => {
      const { x, z, exit } = dryerStart(rnd);
      return curve([new Vector3(x, H.dryerBase - 0.4, z), new Vector3(x + 0.04, 21.8, z), new Vector3(x + 0.12, 23.0, z), new Vector3(x + 0.25, exit - 0.2, z)], 60);
    },
    phase: (p) => PHASE.wetSteam + MathUtils.smoothstep(p.y, 21.3, 23.0),
    speed: (_p, phase, r) => (2.2 + 0.5 * (phase - 2)) * (0.9 + 0.2 * r),
  },
  /**
   * Dry steam leaving the top of the dryer, over it through the open steam dome and down into the
   * steam outlet (the modelled main steam line; the design has two).
   */
  steamOutlet: {
    clip: () => 'volume',
    points: (_i, _count, rnd) => {
      // In lanes: just over the bank it leaves, east in parallel, then converging into the outlet.
      const { x, z, exit } = dryerStart(rnd);
      const inlet = VESSEL.innerRadius - 0.06;
      const lane = Math.max(exit, H.nozzle + 0.4) + 0.12;
      const x0 = Math.max(x, -0.6) + 0.25;
      return curve([
        new Vector3(x0, exit - 0.2, z),
        new Vector3(x0 + 0.3, lane, z),
        new Vector3(1.4, lane - 0.05, z * 0.75 + 0.12),
        new Vector3(1.88, H.nozzle + 0.15, 0.5),
        new Vector3(nozzleDir.x * inlet, H.nozzle + 0.02, nozzleDir.z * inlet),
        new Vector3(nozzleDir.x * (VESSEL.outerRadius + 0.4), H.nozzle, nozzleDir.z * (VESSEL.outerRadius + 0.4)),
      ]);
    },
    phase: () => PHASE.drySteam,
    speed: (p, _phase, r) => (3.0 + 2.2 * MathUtils.smoothstep(Math.hypot(p.x, p.z), 1.6, 2.2)) * (0.9 + 0.2 * r),
  },
};

/** Build every vessel streamline for a quality density (`particlesMultiplier`). */
export function buildVesselFlowPaths(density: number): FlowPathSet {
  const plan = VESSEL_FLOW_CHANNELS.map((channel) => ({ channel, count: Math.max(4, Math.ceil(VESSEL_FLOW_SPEC[channel].paths * density)) }));
  const rows = plan.reduce((n, p) => n + p.count, 0);
  const data = new Float32Array(rows * S * 4);
  const paths: FlowPath[] = [];
  let row = 0;
  for (const { channel, count } of plan) {
    const builder = BUILDERS[channel];
    for (let i = 0; i < count; i++) {
      const rnd = seededRandom(`${channel}:${i}`);
      const clip = builder.clip(i, rnd);
      const points = builder.points(i, count, rnd);
      const r = rnd();
      const duration = bake(points, builder.phase, (p, phase) => builder.speed(p, phase, r), data, row++);
      paths.push({ channel, clip, duration, particles: VESSEL_FLOW_SPEC[channel].perPath });
    }
  }
  return { data, paths };
}
