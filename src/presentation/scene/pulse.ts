/**
 * Pulse-tube geometry for the talk's flows, on the Stage 7 pulse program (scene/flow/flowMaterials.ts
 * createPulseMaterial): pulses travel along a tube behind an advancing front, so a line lights up only
 * where the steam / water / power has got to. One geometry may hold tubes of up to three slots.
 */
import { BufferGeometry, Float32BufferAttribute, LineCurve3, TubeGeometry, Vector3, type Curve } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { roundedPath } from '../../scene/plant/geometry';

export interface TubeSpec {
  curve: Curve<Vector3>;
  radius: number;
  /** Metres the slot's front travels before this tube starts. */
  delay?: number;
  /** Fade over the last metres (a line that runs off into the distance). */
  tail?: number;
  slot: number;
  segments?: number;
  radial?: number;
}

export function pulseTube({ curve, radius, delay = 0, tail = 0, slot, segments = 48, radial = 12 }: TubeSpec): BufferGeometry {
  // `radius` is the polygon's inner radius, so its flat faces never dip into what it wraps.
  const geometry = new TubeGeometry(curve, segments, radius / Math.cos(Math.PI / radial), radial, false);
  const length = curve.getLength();
  const n = geometry.getAttribute('position').count;
  const tube = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) tube.set([length, delay, tail, slot], i * 4);
  geometry.setAttribute('aTube', new Float32BufferAttribute(tube, 4));
  return geometry;
}

export const line = (a: readonly number[], b: readonly number[]) => new LineCurve3(new Vector3(...a), new Vector3(...b));

export const route = (points: readonly (readonly [number, number, number])[], corner: number) => roundedPath(points, corner);

/** Merge tube geometries (they must all carry `aTube`), disposing the parts. */
export function mergeTubes(parts: BufferGeometry[]): BufferGeometry {
  const merged = mergeGeometries(parts, false);
  parts.forEach((p) => p.dispose());
  if (!merged) throw new Error('[talk] pulse tubes could not be merged');
  return merged;
}
