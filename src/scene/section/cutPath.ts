/**
 * Where each section plane is (z, metres) along its reveal progress (0..1).
 *
 * A plane sweeping at constant speed spends much of its track in empty space and then opens
 * a cylinder almost at once: the opening of a cylindrical wall widens fastest just after the
 * plane touches it, and the floors right behind the wall add most of the rest. The stations
 * below were measured from the hero camera so that equal steps of progress make roughly
 * equal visible change; the shot's ease (config/heroShot.ts) then shapes that change in time.
 * The ground cut crosses open earth and stays linear (sectionLayers.ts).
 */
import { MathUtils } from 'three';
import type { SectionedLayerId } from './sectionLayers';

type Station = readonly [progress: number, z: number];
type StructureCut = Extract<SectionedLayerId, 'building' | 'containment'>;

const STATIONS: Record<StructureCut, readonly Station[]> = {
  // Canopy front at z = 20.9, shaft face at 19.1: slow through the wall and the upper floors
  // (z 18..14), quicker through the core.
  building: [
    [0, 21],
    [0.06, 18],
    [0.4, 14.3],
    [0.6, 10.9],
    [0.8, 5.9],
    [1, 0],
  ],
  // Wall face at z = 9.5: slow while the wall opens (9.5..7), quicker across the annulus,
  // slow again while the inner wall uncovers the RPV and the pedestal (3..1).
  containment: [
    [0, 9.6],
    [0.1, 9.4],
    [0.3, 8.3],
    [0.5, 6.9],
    [0.6, 5],
    [0.8, 2.7],
    [1, 0],
  ],
};

/**
 * Monotone cubic through the stations (Fritsch–Butland tangents, as camera/cameraPath.ts,
 * but with secant end tangents: the shot's ease already starts and ends each track at rest).
 */
function monotoneCurve(stations: readonly Station[]): (x: number) => number {
  const xs = stations.map((s) => s[0]);
  const ys = stations.map((s) => s[1]);
  const n = xs.length;
  const slopes = xs.slice(1).map((x, k) => (ys[k + 1]! - ys[k]!) / (x - xs[k]!));
  const tangents = xs.map((_, k) => (k === 0 ? slopes[0]! : k === n - 1 ? slopes[n - 2]! : 0));
  for (let k = 1; k < n - 1; k++) {
    const d0 = slopes[k - 1]!;
    const d1 = slopes[k]!;
    if (d0 * d1 <= 0) continue;
    const h0 = xs[k]! - xs[k - 1]!;
    const h1 = xs[k + 1]! - xs[k]!;
    const w0 = 2 * h1 + h0;
    const w1 = h1 + 2 * h0;
    tangents[k] = (w0 + w1) / (w0 / d0 + w1 / d1);
  }
  return (x) => {
    const t = MathUtils.clamp(x, xs[0]!, xs[n - 1]!);
    let k = 0;
    while (k < n - 2 && t > xs[k + 1]!) k++;
    const h = xs[k + 1]! - xs[k]!;
    const s = (t - xs[k]!) / h;
    const s2 = s * s;
    const s3 = s2 * s;
    return (
      (2 * s3 - 3 * s2 + 1) * ys[k]! + (s3 - 2 * s2 + s) * h * tangents[k]! + (-2 * s3 + 3 * s2) * ys[k + 1]! + (s3 - s2) * h * tangents[k + 1]!
    );
  };
}

const CURVES: Record<StructureCut, (progress: number) => number> = {
  building: monotoneCurve(STATIONS.building),
  containment: monotoneCurve(STATIONS.containment),
};

/** Section plane z at reveal progress `progress` (0 = in front of the structure, 1 = on the axis). */
export function cutPlaneZ(layer: StructureCut, progress: number): number {
  return CURVES[layer](progress);
}
