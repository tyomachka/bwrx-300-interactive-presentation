/**
 * Procedural geometry for the plant massing.
 *
 * Structures the reveal cuts (site earth, reactor building, shaft, containment) are whole,
 * closed solids: clipping planes cut them and the section shader draws the cut surface
 * (scene/section/sectionShader.ts). For that to work, two solids must never share a face, so
 * section solids are inset by SECTION_INSET on every side that touches a neighbour.
 *
 * Context structures that only the Stage 2 section review opens (turbine hall) are still
 * built as halves split at z = 0, with the front half hidden in that review.
 */
import { BufferGeometry, CurvePath, ExtrudeGeometry, Float32BufferAttribute, LineCurve3, Path, QuadraticBezierCurve3, Shape, Vector3 } from 'three';

export type Half = 'back' | 'front';

export type Range = readonly [number, number];

/**
 * Gap kept between touching section solids (m). Invisible (well below a pixel at the closest
 * shot distance) yet far above depth-buffer precision there, so cut surfaces never z-fight.
 */
export const SECTION_INSET = 0.005;

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

/** Shrink a box by `inset` on every side (section solids). */
export function insetBox(box: BoxExtents, inset = SECTION_INSET): BoxExtents {
  return {
    x: [box.x[0] + inset, box.x[1] - inset],
    y: [box.y[0] + inset, box.y[1] - inset],
    z: [box.z[0] + inset, box.z[1] - inset],
  };
}

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
 * Angle convention shared with three's Cylinder geometry: x = r·sinθ, z = r·cosθ.
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

export type ProfilePoint = readonly [r: number, y: number];

/**
 * A closed solid of revolution from a closed (r, y) profile listed counter-clockwise (r to
 * the right, y up), with sharp, flat-shaded corners. Used where two rings would otherwise
 * touch along a face (e.g. a wall and its slab): one solid has no internal faces, so a cut
 * through it shows one clean surface and no hairline crack between parts.
 */
export function createRevolvedSolid(profile: readonly ProfilePoint[], segments: number): BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  const seg = Math.max(3, Math.round(segments));

  for (let e = 0; e < profile.length; e++) {
    const [r0, y0] = profile[e]!;
    const [r1, y1] = profile[(e + 1) % profile.length]!;
    // Outward normal of a counter-clockwise profile edge: its direction turned right.
    const length = Math.hypot(r1 - r0, y1 - y0);
    const nr = (y1 - y0) / length;
    const ny = -(r1 - r0) / length;
    const base = positions.length / 3;
    for (let i = 0; i <= seg; i++) {
      const theta = (i / seg) * Math.PI * 2;
      const s = Math.sin(theta);
      const c = Math.cos(theta);
      positions.push(r0 * s, y0, r0 * c, r1 * s, y1, r1 * c);
      normals.push(nr * s, ny, nr * c, nr * s, ny, nr * c);
    }
    for (let i = 0; i < seg; i++) {
      const a = base + 2 * i; // edge start, angle i
      const b = a + 1; // edge end, angle i
      const c = a + 2; // edge start, angle i + 1
      const d = a + 3; // edge end, angle i + 1
      indices.push(a, c, d, a, d, b);
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new Float32BufferAttribute(normals, 3));
  geometry.setIndex(indices);
  return geometry;
}

/** A whole ring/disc section solid, inset so it never shares a face with a neighbour. */
export function createSectionSolid(o: Omit<SectorOptions, 'thetaStart' | 'thetaLength'>): BufferGeometry {
  return createSectorGeometry({
    innerRadius: o.innerRadius > 0 ? o.innerRadius + SECTION_INSET : 0,
    outerRadius: o.outerRadius - SECTION_INSET,
    y0: o.y0 + SECTION_INSET,
    height: o.height - 2 * SECTION_INSET,
    thetaStart: 0,
    thetaLength: Math.PI * 2,
    segments: o.segments,
  });
}

/**
 * The site block (or one of its layers): a rectangle in plan, optionally with a circular
 * hole for the reactor shaft, extruded from y = -depth up to y = 0 before the mesh positions
 * it. Caps carry the ground-surface material (group 0), sides the earth material (group 1).
 *
 * Shape space (sx, sy) maps to world (x, -z) after the -90° X rotation applied by the mesh.
 */
export function createSiteGeometry(
  site: { x: Range; z: Range; depth: number },
  /** Radius of the shaft hole; 0 for a plain block (earth below the shaft). */
  holeRadius: number,
  curveSegments: number,
): ExtrudeGeometry {
  const [x0, x1] = site.x;
  const shape = new Shape();
  shape.moveTo(x0, -site.z[1]);
  shape.lineTo(x1, -site.z[1]);
  shape.lineTo(x1, -site.z[0]);
  shape.lineTo(x0, -site.z[0]);
  shape.closePath();
  if (holeRadius > 0) shape.holes.push(new Path().absarc(0, 0, holeRadius, 0, Math.PI * 2, true));
  return new ExtrudeGeometry(shape, { depth: site.depth, bevelEnabled: false, curveSegments });
}

/** Straight runs joined by rounded corners: the main steam line, and the Stage 7 flow paths along it. */
export function roundedPath(points: readonly (readonly [number, number, number])[], cornerRadius: number): CurvePath<Vector3> {
  const path = new CurvePath<Vector3>();
  const v = points.map((p) => new Vector3(...p));
  let start = v[0]!.clone();
  for (let i = 1; i < v.length - 1; i++) {
    const corner = v[i]!;
    const inDir = corner.clone().sub(v[i - 1]!).normalize();
    const outDir = v[i + 1]!.clone().sub(corner).normalize();
    const before = corner.clone().addScaledVector(inDir, -cornerRadius);
    const after = corner.clone().addScaledVector(outDir, cornerRadius);
    path.add(new LineCurve3(start, before));
    path.add(new QuadraticBezierCurve3(before, corner.clone(), after));
    start = after;
  }
  path.add(new LineCurve3(start, v[v.length - 1]!.clone()));
  return path;
}
