/**
 * Stage 9: the isolation condenser system's layout and geometry (config/safety.ts ICS_LAYOUT).
 *
 * Each train, as GD Rev J §3.3 / Fig 3-8 describe it and simplified [APPROX]: a steam supply line
 * from the RPV's steam space (at the steam outlet level) out through the containment and up into
 * its pool, into the IC's upper header; a bank of vertical tubes down to the lower header, all
 * under water; a condensate return line from the lower header down to the RPV at the top of the
 * chimney region. The IC stands above the steam source, so gravity closes the loop.
 *
 * The headers run along x in every pool (broadside to the south cameras). The steam riser stands
 * at the IC's end nearer the reactor axis, the condensate riser at the far end: the loop goes up
 * one side, through the IC and down the other, which reads as a loop from the front.
 *
 * Plain functions of the layout: the plant draws the hardware (IcsEquipment), the safety layer
 * draws the flow along the same curves (PassiveSafety).
 */
import { CylinderGeometry, Float32BufferAttribute, LineCurve3, Quaternion, TubeGeometry, Vector3, type BufferGeometry, type Curve } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { ICS_LAYOUT as L, PLUME_SPEC, SAFETY_LOOK } from '../../config/safety';
import { FLOW_PATH_SAMPLES } from '../../config/flow';
import { seededRandom } from '../flow/flowPaths';
import { POOLS, REACTOR_PRESSURE_VESSEL as RPV } from '../plant/dimensions';
import { roundedPath } from '../plant/geometry';

type Point = readonly [number, number, number];

/** Counts of the last build (diagnostics, review report). */
export const safetyStats = { plumeParticles: 0, plumePaths: 0, flowVertices: 0 };

/** Scene name of the IC hardware mesh. */
export const ICS_EQUIPMENT_NAME = 'isolation-condensers';

export interface IcsTrain {
  index: number;
  /** Pool centre (x, z) and the header's extent along x (centre +- half length). */
  center: readonly [number, number];
  steamRoute: readonly Point[];
  returnRoute: readonly Point[];
  /** Where the steam enters the upper header and the condensate leaves the lower one (x). */
  inletX: number;
  outletX: number;
  /** +1 if the reactor axis is towards +x of the pool centre, -1 towards -x (north: +1). */
  inward: number;
  /** Tube positions (x, z) in plan. */
  tubes: readonly (readonly [number, number])[];
}

const STEAM_Y = RPV.steamNozzleY;
const RETURN_Y = RPV.insideBottomY + L.returnH;
/** Pipes start just inside the vessel wall; the nozzle stub covers the joint. */
const WALL_R = RPV.outerRadius - 0.02;
const HALF = L.hx.headerLength / 2;
/** Risers stand this far beyond the header ends (inside the pool, clear of its walls). */
const RISER_OFFSET = 0.45;
/** The lines reach this far into the headers (hidden inside them). */
const INTO_HEADER = 0.7;

const towardsVessel = (x: number, z: number, y: number): Point => {
  const r = Math.hypot(x, z);
  return [(x / r) * WALL_R, y, (z / r) * WALL_R];
};

export function icsTrains(): IcsTrain[] {
  return POOLS.ics.map(({ center: [cx, cz] }, index) => {
    const inward = cx > 0.5 ? -1 : 1; // east pool: the axis is towards -x; west and north: +x
    const steamX = cx + inward * (HALF + RISER_OFFSET);
    const returnX = cx - inward * (HALF + RISER_OFFSET);
    const inletX = cx + inward * (HALF - INTO_HEADER);
    const outletX = cx - inward * (HALF - INTO_HEADER);
    const steamRoute: Point[] = [towardsVessel(steamX, cz, STEAM_Y), [steamX, STEAM_Y, cz], [steamX, L.hx.upperY, cz], [inletX, L.hx.upperY, cz]];
    const returnRoute: Point[] = [[outletX, L.hx.lowerY, cz], [returnX, L.hx.lowerY, cz], [returnX, RETURN_Y, cz], towardsVessel(returnX, cz, RETURN_Y)];
    const tubes: [number, number][] = [];
    for (let row = 0; row < L.hx.rows; row++) {
      const z = cz + (row - (L.hx.rows - 1) / 2) * L.hx.rowGap;
      for (let i = 0; i < L.hx.perRow; i++) tubes.push([cx - L.hx.tubeLength / 2 + (i * L.hx.tubeLength) / (L.hx.perRow - 1), z]);
    }
    return { index, center: [cx, cz], steamRoute, returnRoute, inletX, outletX, inward, tubes };
  });
}

const routeCurve = (route: readonly Point[]) => roundedPath(route, L.pipe.corner);
const line = (a: Point, b: Point) => new LineCurve3(new Vector3(...a), new Vector3(...b));

const UP = new Vector3(0, 1, 0);

/** A closed cylinder between two points. */
function cylinderBetween(a: Point, b: Point, radius: number, radial: number): BufferGeometry {
  const va = new Vector3(...a);
  const vb = new Vector3(...b);
  const geometry = new CylinderGeometry(radius, radius, va.distanceTo(vb), radial, 1, false);
  geometry.applyQuaternion(new Quaternion().setFromUnitVectors(UP, vb.clone().sub(va).normalize()));
  geometry.translate((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
  return geometry;
}

/** The hardware of all three trains as one geometry (one draw call). */
export function buildIcsHardware(radial: number): BufferGeometry {
  const { hx, pipe } = L;
  const parts: BufferGeometry[] = [];
  for (const train of icsTrains()) {
    const [cx, cz] = train.center;
    const steam = routeCurve(train.steamRoute);
    const ret = routeCurve(train.returnRoute);
    parts.push(new TubeGeometry(steam, 96, pipe.steamRadius, radial, false));
    parts.push(new TubeGeometry(ret, 96, pipe.returnRadius, radial, false));
    // Nozzle stubs on the vessel wall.
    for (const route of [train.steamRoute, train.returnRoute]) {
      const start = route === train.steamRoute ? route[0]! : route[route.length - 1]!;
      const r = Math.hypot(start[0], start[2]);
      const out = (d: number): Point => [(start[0] / r) * (RPV.outerRadius + d), start[1], (start[2] / r) * (RPV.outerRadius + d)];
      parts.push(cylinderBetween(out(-0.05), out(pipe.nozzleLength), pipe.nozzleRadius, radial));
    }
    // Headers and the tube bank.
    parts.push(cylinderBetween([cx - HALF, hx.upperY, cz], [cx + HALF, hx.upperY, cz], hx.headerRadius, radial));
    parts.push(cylinderBetween([cx - HALF, hx.lowerY, cz], [cx + HALF, hx.lowerY, cz], hx.headerRadius, radial));
    for (const [x, z] of train.tubes) parts.push(cylinderBetween([x, hx.lowerY, z], [x, hx.upperY, z], hx.tubeRadius, 8));
  }
  const merged = mergeGeometries(parts, false);
  parts.forEach((g) => g.dispose());
  return merged;
}

// ---- Flow sleeves (flowMaterials pulse tubes) -------------------------------------------------------

/** Pulse slots of the ICS flow mesh (createPulseMaterial order). */
export const ICS_SLOT = { steam: 0, condensing: 1, condensate: 2 } as const;

function pulseTube(curve: Curve<Vector3>, radius: number, channel: number, delay: number, segments: number, radial: number): BufferGeometry {
  const geometry = new TubeGeometry(curve, segments, radius / Math.cos(Math.PI / radial), radial, false);
  const length = curve.getLength();
  const n = geometry.getAttribute('position').count;
  const tube = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) tube.set([length, delay, 0, channel], i * 4);
  geometry.setAttribute('aTube', new Float32BufferAttribute(tube, 4));
  return geometry;
}

/** The ICS flow sleeves and each slot's longest run (m), for the fronts. */
export function buildIcsFlow(): { geometry: BufferGeometry; slotLength: Record<keyof typeof ICS_SLOT, number> } {
  const { hx, pipe } = L;
  const S = SAFETY_LOOK;
  const parts: BufferGeometry[] = [];
  const slotLength = { steam: 0, condensing: 0, condensate: 0 };
  for (const train of icsTrains()) {
    const [cx, cz] = train.center;
    const steam = routeCurve(train.steamRoute);
    const steamLength = steam.getLength();
    parts.push(pulseTube(steam, pipe.steamRadius + S.sleeve, ICS_SLOT.steam, 0, 160, 12));
    // The steam spreads along the upper header from its inlet to the far end.
    const farX = cx - train.inward * HALF;
    const header = line([train.inletX, hx.upperY, cz], [farX, hx.upperY, cz]);
    parts.push(pulseTube(header, hx.headerRadius + S.sleeve, ICS_SLOT.steam, steamLength, 8, 16));
    slotLength.steam = Math.max(slotLength.steam, steamLength + header.getLength());
    // Down every tube, condensing.
    for (const [x, z] of train.tubes) parts.push(pulseTube(line([x, hx.upperY, z], [x, hx.lowerY, z]), hx.tubeRadius + S.tubeSleeve, ICS_SLOT.condensing, 0, 6, 8));
    slotLength.condensing = Math.max(slotLength.condensing, hx.upperY - hx.lowerY);
    // Along the lower header to the outlet, then back down to the vessel.
    const nearX = cx + train.inward * HALF;
    const lower = line([nearX, hx.lowerY, cz], [train.outletX, hx.lowerY, cz]);
    parts.push(pulseTube(lower, hx.headerRadius + S.sleeve, ICS_SLOT.condensate, 0, 8, 16));
    const ret = routeCurve(train.returnRoute);
    parts.push(pulseTube(ret, pipe.returnRadius + S.sleeve, ICS_SLOT.condensate, lower.getLength(), 180, 12));
    slotLength.condensate = Math.max(slotLength.condensate, lower.getLength() + ret.getLength());
  }
  const geometry = mergeGeometries(parts, false);
  parts.forEach((g) => g.dispose());
  return { geometry, slotLength };
}

// ---- Pool heat plume (Stage 7 streak particles) --------------------------------------------------------

/**
 * Warm water rising from the tube bank to the pool surface: one streamline per particle group,
 * starting among the tubes, widening as it rises and slowing towards the surface. Same layout as
 * the Stage 7 path texture: FLOW_PATH_SAMPLES equal time steps per row (xyz, phase 0 = water).
 */
export function buildPlumePaths(density: number) {
  const { hx } = L;
  const { surfaceY, riseSpeed, spread } = SAFETY_LOOK.plume;
  const perTrain = Math.max(4, Math.round(PLUME_SPEC.paths * Math.max(PLUME_SPEC.minDensity, density)));
  const trains = icsTrains();
  const rows = trains.length * perTrain;
  const data = new Float32Array(rows * FLOW_PATH_SAMPLES * 4);
  const durations: number[] = [];
  let row = 0;
  for (const train of trains) {
    const [cx, cz] = train.center;
    const rnd = seededRandom(`ics-plume:${train.index}`);
    for (let p = 0; p < perTrain; p++, row++) {
      const x0 = cx + (rnd() - 0.5) * L.hx.tubeLength;
      const z0 = cz + (rnd() - 0.5) * (L.hx.rowGap + 0.5);
      const y0 = hx.lowerY + 0.4 + rnd() * (hx.upperY - hx.lowerY - 0.6);
      const x1 = cx + (x0 - cx) * 1.15 + (rnd() - 0.5) * spread;
      const z1 = z0 + (rnd() - 0.5) * spread;
      const rise = surfaceY - y0;
      for (let i = 0; i < FLOW_PATH_SAMPLES; i++) {
        const u = i / (FLOW_PATH_SAMPLES - 1);
        const e = 1 - Math.pow(1 - u, 1.6); // slows towards the surface
        data.set([x0 + (x1 - x0) * e, y0 + rise * e, z0 + (z1 - z0) * e, 0], (row * FLOW_PATH_SAMPLES + i) * 4);
      }
      durations.push((rise / riseSpeed) * (1.3 + 0.4 * rnd()));
    }
  }
  return { data, rows, durations, perPath: PLUME_SPEC.perPath };
}
