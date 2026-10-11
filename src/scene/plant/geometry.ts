/**
 * Procedural geometry for the plant massing.
 *
 * Every structure that the section review cuts is built as two halves split by the plane
 * z = 0 (the reactor -> turbine axis). `back` stays visible in section review; `front` hides.
 * That gives a clean architectural section model without clipping planes. Stage 5 may
 * replace it with a real clipping/section system without touching the massing data.
 */
import { BufferGeometry, ExtrudeGeometry, Float32BufferAttribute, Shape } from 'three';

export type Half = 'back' | 'front';

export type Range = readonly [number, number];

/** Axis-aligned box given by world extents (metres). */
export interface BoxExtents {
  x: Range;
  y: Range;
  z: Range;
}

/** Split an extents box at z = 0 into back (z ≤ 0) and front (z ≥ 0) parts. */
export function splitAtZ0(box: BoxExtents): Record<Half, BoxExtents> {
  return {
    back: { ...box, z: [box.z[0], Math.min(0, box.z[1])] },
    front: { ...box, z: [Math.max(0, box.z[0]), box.z[1]] },
  };
}
export const HALVES: readonly Half[] = ['back', 'front'];

/**
 * Angle convention shared with three's Cylinder/Cone geometry: x = r·sinθ, z = r·cosθ.
 * back (z ≤ 0): θ ∈ [π/2, 3π/2]   front (z ≥ 0): θ ∈ [-π/2, π/2]
 */
export const HALF_THETA: Record<Half, { thetaStart: number; thetaLength: number }> = {
  back: { thetaStart: Math.PI / 2, thetaLength: Math.PI },
  front: { thetaStart: -Math.PI / 2, thetaLength: Math.PI },
};

/** three's SphereGeometry uses z = r·sinφ·sinθ, so its halves are expressed in φ. */
export const HALF_PHI: Record<Half, { phiStart: number; phiLength: number }> = {
  back: { phiStart: Math.PI, phiLength: Math.PI },
  front: { phiStart: 0, phiLength: Math.PI },
};

export interface SectorOptions {
  innerRadius: number;
  outerRadius: number;
  y0: number;
  height: number;
  thetaStart: number;
  thetaLength: number;
  segments: number;
}

/**
 * A thick cylindrical sector: outer and inner curved walls with smooth normals, flat
 * top/bottom caps and, when partial, flat cut faces at both ends. `innerRadius = 0` gives
 * a solid sector (slab or disc). Indexed, position + normal only.
 */
export function createSectorGeometry(o: SectorOptions): BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  const y1 = o.y0 + o.height;
  const seg = Math.max(2, Math.round(o.segments));
  const ri = o.innerRadius;
  const ro = o.outerRadius;
  const isFull = o.thetaLength >= Math.PI * 2 - 1e-6;
  const angle = (i: number) => o.thetaStart + (i / seg) * o.thetaLength;

  const vertex = (x: number, y: number, z: number, nx: number, ny: number, nz: number) => {
    positions.push(x, y, z);
    normals.push(nx, ny, nz);
    return positions.length / 3 - 1;
  };

  // Curved wall; outward when sign = 1, inward-facing (seen from inside) when sign = -1.
  const curved = (r: number, sign: 1 | -1) => {
    const base = positions.length / 3;
    for (let i = 0; i <= seg; i++) {
      const s = Math.sin(angle(i));
      const c = Math.cos(angle(i));
      vertex(r * s, o.y0, r * c, sign * s, 0, sign * c);
      vertex(r * s, y1, r * c, sign * s, 0, sign * c);
    }
    for (let i = 0; i < seg; i++) {
      const a = base + 2 * i; // bottom i
      const b = a + 1; // top i
      const c = a + 2; // bottom i+1
      const d = a + 3; // top i+1
      if (sign > 0) indices.push(a, c, d, a, d, b);
      else indices.push(a, d, c, a, b, d);
    }
  };

  const cap = (y: number, up: boolean) => {
    const ny = up ? 1 : -1;
    const base = positions.length / 3;
    for (let i = 0; i <= seg; i++) {
      const s = Math.sin(angle(i));
      const c = Math.cos(angle(i));
      vertex(ri * s, y, ri * c, 0, ny, 0);
      vertex(ro * s, y, ro * c, 0, ny, 0);
    }
    for (let i = 0; i < seg; i++) {
      const inI = base + 2 * i;
      const outI = inI + 1;
      const inN = inI + 2;
      const outN = inI + 3;
      if (up) indices.push(inI, outI, outN, inI, outN, inN);
      else indices.push(inI, outN, outI, inI, inN, outN);
    }
  };

  const cutFace = (theta: number, isStart: boolean) => {
    const s = Math.sin(theta);
    const c = Math.cos(theta);
    // Outward normal: towards decreasing θ at the start face, increasing θ at the end face.
    const [nx, nz] = isStart ? [-c, s] : [c, -s];
    const a = vertex(ri * s, o.y0, ri * c, nx, 0, nz);
    const b = vertex(ro * s, o.y0, ro * c, nx, 0, nz);
    const cc = vertex(ro * s, y1, ro * c, nx, 0, nz);
    const d = vertex(ri * s, y1, ri * c, nx, 0, nz);
    if (isStart) indices.push(a, b, cc, a, cc, d);
    else indices.push(a, cc, b, a, d, cc);
  };

  curved(ro, 1);
  if (ri > 0) curved(ri, -1);
  cap(y1, true);
  cap(o.y0, false);
  if (!isFull) {
    cutFace(o.thetaStart, true);
    cutFace(o.thetaStart + o.thetaLength, false);
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new Float32BufferAttribute(normals, 3));
  geometry.setIndex(indices);
  return geometry;
}

export function createHalfSector(half: Half, o: Omit<SectorOptions, 'thetaStart' | 'thetaLength'>): BufferGeometry {
  return createSectorGeometry({ ...o, ...HALF_THETA[half] });
}

/**
 * One half of the site block: a rectangle in plan with a semicircular notch around the
 * reactor shaft, extruded from y = -depth up to grade. Caps carry the ground-surface
 * material (group 0), sides and cut face the earth material (group 1).
 *
 * Shape space (sx, sy) maps to world (x, -z) after the -90° X rotation applied by the mesh.
 */
export function createSiteHalfGeometry(
  half: Half,
  site: { x: readonly [number, number]; z: readonly [number, number]; depth: number },
  /** Radius of the shaft notch; 0 for a plain block (earth below the shaft). */
  notchRadius: number,
  curveSegments: number,
  /** Added to side-wall v so a stacked layer continues the layer above's texture bands. */
  sideVOffset = 0,
): ExtrudeGeometry {
  const [x0, x1] = site.x;
  const shape = new Shape();
  if (half === 'back') {
    const depth = -site.z[0]; // world z from z[0] (< 0) to 0  ->  sy from 0 to -z[0]
    shape.moveTo(x0, 0);
    if (notchRadius > 0) {
      shape.lineTo(-notchRadius, 0);
      shape.absarc(0, 0, notchRadius, Math.PI, 0, true);
    }
    shape.lineTo(x1, 0);
    shape.lineTo(x1, depth);
    shape.lineTo(x0, depth);
  } else {
    const depth = site.z[1];
    shape.moveTo(x1, 0);
    if (notchRadius > 0) {
      shape.lineTo(notchRadius, 0);
      shape.absarc(0, 0, notchRadius, 0, Math.PI, true);
    }
    shape.lineTo(x0, 0);
    shape.lineTo(x0, -depth);
    shape.lineTo(x1, -depth);
  }
  shape.closePath();
  const geometry = new ExtrudeGeometry(shape, { depth: site.depth, bevelEnabled: false, curveSegments });
  if (sideVOffset !== 0) {
    // Group 1 = side walls; their v runs along the extrusion (1 - depth coordinate).
    const uv = geometry.getAttribute('uv');
    const sides = geometry.groups[1];
    if (sides) for (let i = sides.start; i < sides.start + sides.count; i++) uv.setY(i, uv.getY(i) + sideVOffset);
    uv.needsUpdate = true;
  }
  return geometry;
}
