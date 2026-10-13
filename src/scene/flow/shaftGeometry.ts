/**
 * Stage 7 turbine-generator operating cue: shaft couplings in the gaps of the train, the part of
 * the single shaft (GD §5.1.2) the casings leave visible. A flange pair, a ring of bolts and one
 * lug, so the rotation reads even though the flange itself is round. Built around the x axis at
 * the shaft line's origin: the owner rotates the mesh about x.
 */
import { BoxGeometry, CylinderGeometry, type BufferGeometry } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { TURBINE_TRAIN as TRAIN } from '../plant/dimensions';

export type CouplingPart = 'turbine' | 'generator';

/** Gaps along the shaft between casings (x from, x to) and which component owns the coupling. */
export function shaftGaps(): { x: [number, number]; part: CouplingPart }[] {
  const { hp, lp, generator } = TRAIN;
  return [
    { x: [hp.x[0] - 0.5, hp.x[0]], part: 'turbine' },
    { x: [hp.x[1], lp[0]!.x[0]], part: 'turbine' },
    { x: [lp[0]!.x[1], lp[1]!.x[0]], part: 'turbine' },
    { x: [lp[1]!.x[1], generator.x[0]], part: 'generator' },
    { x: [generator.x[1], generator.x[1] + 0.5], part: 'generator' },
  ];
}

const FLANGE_RADIUS = 1.0;
const BOLT_CIRCLE = 0.74;
const BOLTS = 8;

/** Cylinder along x centred at (x, 0, 0). */
function alongX(radius: number, length: number, x: number, y: number, z: number, segments: number): BufferGeometry {
  return new CylinderGeometry(radius, radius, length, segments).rotateZ(-Math.PI / 2).translate(x, y, z);
}

function merge(parts: BufferGeometry[]): BufferGeometry {
  const merged = mergeGeometries(
    parts.map((g) => (g.index ? g.toNonIndexed() : g)),
    false,
  );
  parts.forEach((g) => g.dispose());
  return merged;
}

/** The flanges (steel) and their marks (darker: bolt heads and one rim lug, so the turning reads). */
export function buildCouplings(part: CouplingPart, segments: number): { flanges: BufferGeometry; marks: BufferGeometry } {
  const flanges: BufferGeometry[] = [];
  const marks: BufferGeometry[] = [];
  for (const gap of shaftGaps()) {
    if (gap.part !== part) continue;
    const width = gap.x[1] - gap.x[0];
    const x = (gap.x[0] + gap.x[1]) / 2;
    const thickness = Math.min(0.55, width * 0.4);
    flanges.push(alongX(FLANGE_RADIUS, thickness, x, 0, 0, segments));
    for (let i = 0; i < BOLTS; i++) {
      const a = (i / BOLTS) * Math.PI * 2;
      marks.push(alongX(0.085, thickness + 0.18, x, BOLT_CIRCLE * Math.cos(a), BOLT_CIRCLE * Math.sin(a), 8));
    }
    marks.push(new BoxGeometry(thickness * 0.9, 0.26, 0.34).translate(x, FLANGE_RADIUS + 0.1, 0));
  }
  return { flanges: merge(flanges), marks: merge(marks) };
}
