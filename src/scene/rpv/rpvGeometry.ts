/**
 * Procedural geometry for the RPV and its internals (pure functions, no React).
 *
 * Every part is a closed solid, so the section shader can draw its cut surface when the
 * vessel cutaway clips it (scene/section/sectionShader.ts). As elsewhere in the plant, solids
 * that touch keep a SECTION_INSET gap and never share faces. Repeated parts are merged into
 * one geometry per material (one draw call); the fuel bundles and blades are instanced
 * instead, because later stages address them one by one.
 *
 * The cutaway planes run through the reactor axis (x = 0 and z = 0). Repeated parts are laid
 * out so those planes fall between them wherever possible (separators, legs, studs, nozzles):
 * the only things cut along their length are the parts that straddle the axis by design
 * (the central row of blades and guide tubes), whose cut is exactly their mid-plane.
 */
import { BoxGeometry, BufferGeometry, ExtrudeGeometry, Float32BufferAttribute, Matrix4, Shape, Vector3 } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { SECTION_INSET as E } from '../plant/geometry';
import { CONTROL_BLADES, FUEL_BUNDLES } from './coreLayout';
import {
  BLADE,
  DOWNCOMER,
  CHIMNEY,
  CHIMNEY_HEAD,
  CORE_PLATE,
  DRIVES,
  DRYER,
  FUEL,
  FUEL_SUPPORT,
  GUIDE_TUBE,
  NOZZLES,
  SEPARATORS,
  SHELL_LUGS,
  SHROUD,
  SHROUD_SUPPORT,
  TOP_GUIDE,
  VESSEL,
} from './rpvData';

/** Tessellation for one quality preset. */
export interface RpvDetail {
  /** Segments around large solids of revolution (vessel, shroud, chimney). */
  radial: number;
  /** Segments around small repeated cylinders (tubes, separators, nozzles). */
  small: number;
  /** Steps along a 90° head arc. */
  arc: number;
}

export const RPV_DETAIL: Record<'high' | 'low', RpvDetail> = {
  high: { radial: 96, small: 16, arc: 18 },
  low: { radial: 48, small: 10, arc: 10 },
};

/** (r, y) profile point; `smooth` vertices share the normal of their two edges (arcs). */
export type LathePoint = readonly [r: number, y: number, smooth?: boolean];

const _m = new Matrix4();
const _v = new Vector3();

/**
 * A closed solid of revolution about +y from a counter-clockwise (r right, y up) profile.
 * Corners are sharp; arc vertices flagged `smooth` get averaged normals, so heads and domes
 * shade as smooth surfaces instead of faceted bands.
 */
export function createLatheSolid(profile: readonly LathePoint[], segments: number): BufferGeometry {
  const n = profile.length;
  const edgeNormals = profile.map(([r0, y0], e) => {
    const [r1, y1] = profile[(e + 1) % n]!;
    const length = Math.hypot(r1 - r0, y1 - y0) || 1;
    return [(y1 - y0) / length, -(r1 - r0) / length] as const;
  });
  const vertexNormal = (i: number, edge: number): readonly [number, number] => {
    // A pole on the axis (dome apex): straight up or down, whichever way the surface faces.
    if (profile[i]![0] === 0) return [0, Math.sign(edgeNormals[edge]![1]) || 1];
    if (!profile[i]![2]) return edgeNormals[edge]!;
    const a = edgeNormals[(i - 1 + n) % n]!;
    const b = edgeNormals[i]!;
    const l = Math.hypot(a[0] + b[0], a[1] + b[1]) || 1;
    return [(a[0] + b[0]) / l, (a[1] + b[1]) / l];
  };

  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  const seg = Math.max(3, Math.round(segments));
  for (let e = 0; e < n; e++) {
    const j = (e + 1) % n;
    const [r0, y0] = profile[e]!;
    const [r1, y1] = profile[j]!;
    if (r0 === 0 && r1 === 0) continue; // on the axis: no surface
    const [nr0, ny0] = vertexNormal(e, e);
    const [nr1, ny1] = vertexNormal(j, e);
    const base = positions.length / 3;
    for (let i = 0; i <= seg; i++) {
      const theta = (i / seg) * Math.PI * 2;
      const s = Math.sin(theta);
      const c = Math.cos(theta);
      positions.push(r0 * s, y0, r0 * c, r1 * s, y1, r1 * c);
      normals.push(nr0 * s, ny0, nr0 * c, nr1 * s, ny1, nr1 * c);
    }
    for (let i = 0; i < seg; i++) {
      const a = base + 2 * i;
      indices.push(a, a + 2, a + 3, a, a + 3, a + 1);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new Float32BufferAttribute(normals, 3));
  geometry.setIndex(indices);
  return geometry;
}

/** Points along a circular arc (centre (0, cy), radius R) from angle a0 to a1 (radians from +y). */
function arc(cy: number, radius: number, a0: number, a1: number, steps: number, smooth = true): LathePoint[] {
  const points: LathePoint[] = [];
  for (let i = 0; i <= steps; i++) {
    const a = a0 + ((a1 - a0) * i) / steps;
    const interior = i > 0 && i < steps;
    points.push([Math.max(0, radius * Math.sin(a)), cy + radius * Math.cos(a), smooth && interior]);
  }
  return points;
}

/** Closed annulus (or disc when innerRadius = 0) between two heights. */
const ring = (innerRadius: number, outerRadius: number, y0: number, y1: number): LathePoint[] => [
  [innerRadius, y0],
  [outerRadius, y0],
  [outerRadius, y1],
  [innerRadius, y1],
];

/** Merge closed parts into one geometry (uv dropped, all non-indexed for compatibility). */
export function mergeParts(parts: BufferGeometry[]): BufferGeometry {
  const prepared = parts.map((g) => {
    g.deleteAttribute('uv');
    const flat = g.index ? g.toNonIndexed() : g;
    if (flat !== g) g.dispose();
    return flat;
  });
  const merged = mergeGeometries(prepared, false);
  prepared.forEach((g) => g.dispose());
  if (!merged) throw new Error('[BWRX-300] RPV geometry merge failed');
  return merged;
}

/** A box given by its centre and size. */
const box = (cx: number, cy: number, cz: number, sx: number, sy: number, sz: number) =>
  new BoxGeometry(sx, sy, sz).translate(cx, cy, cz);

/** Rotate a +y-axis part to point radially outward at azimuth `deg` (0 = +x, 90 = +z). */
function radial(geometry: BufferGeometry, deg: number, startRadius: number, h: number): BufferGeometry {
  const a = (deg * Math.PI) / 180;
  const dir = _v.set(Math.cos(a), 0, Math.sin(a));
  _m.makeRotationAxis(new Vector3(0, 1, 0).cross(dir).normalize(), Math.PI / 2);
  geometry.applyMatrix4(_m);
  return geometry.translate(dir.x * startRadius, h, dir.z * startRadius);
}

/** Inner / outer surface height of the hemispherical bottom head at plan radius r. */
export const bottomHeadInnerH = (r: number) => VESSEL.headInnerRadius - Math.sqrt(Math.max(0, VESSEL.headInnerRadius ** 2 - r * r));
export const bottomHeadOuterH = (r: number) => VESSEL.headInnerRadius - Math.sqrt(Math.max(0, VESSEL.outerRadius ** 2 - r * r));

// ---- Vessel ------------------------------------------------------------------------------------

/** Bottom head: hemisphere centred at h = inner radius, from the bottom apex to its equator. */
export function createLowerHead(d: RpvDetail): BufferGeometry {
  const c = VESSEL.headInnerRadius;
  const ro = VESSEL.outerRadius;
  const ri = VESSEL.innerRadius;
  return createLatheSolid([...arc(c, ro, Math.PI, Math.PI / 2, d.arc), ...arc(c, ri, Math.PI / 2, Math.PI, d.arc)], d.radial);
}

/** Cylindrical shell with the vessel flange at its top. */
export function createShell(d: RpvDetail): BufferGeometry {
  const { innerRadius: ri, outerRadius: ro, flangeJointH: j, flange } = VESSEL;
  const bottom = VESSEL.headInnerRadius + E;
  return createLatheSolid(
    [
      [ri, bottom],
      [ro, bottom],
      [ro, j - flange.vesselDepth],
      [flange.outerRadius, j - flange.vesselDepth],
      [flange.outerRadius, j - E],
      [ri, j - E],
    ],
    d.radial,
  );
}

/** Removable top head: head flange + hemispherical dome. */
export function createUpperHead(d: RpvDetail): BufferGeometry {
  const { innerRadius: ri, outerRadius: ro, flangeJointH: j, flange } = VESSEL;
  const top = j + flange.headDepth;
  const domeAtTop = Math.sqrt(ro * ro - flange.headDepth ** 2);
  return createLatheSolid(
    [
      [ri, j + E],
      [flange.outerRadius, j + E],
      [flange.outerRadius, top],
      [domeAtTop, top],
      // Outer dome up to the apex, then the inner dome back down to the flange face.
      ...arc(j, ro, Math.acos(flange.headDepth / ro), 0, d.arc).slice(1),
      ...arc(j, ri, 0, Math.PI / 2, d.arc).slice(0, -1),
    ],
    d.radial,
  );
}

/** Head studs with nuts on the flange: the bolted head of GD Fig 3-3. */
export function createStuds(d: RpvDetail): BufferGeometry {
  const { studs, flangeJointH: j, flange } = VESSEL;
  const top = j + flange.headDepth;
  const seg = Math.max(6, d.small / 2);
  const parts: BufferGeometry[] = [];
  for (let i = 0; i < studs.count; i++) {
    // Half a step off the axes, so the cutaway planes pass between studs.
    const a = ((i + 0.5) / studs.count) * Math.PI * 2;
    const x = Math.cos(a) * studs.radius;
    const z = Math.sin(a) * studs.radius;
    parts.push(createLatheSolid(ring(0, studs.diameter / 2, top + E, top + studs.protrusion), seg).translate(x, 0, z));
    parts.push(createLatheSolid(ring(0, studs.diameter * 0.85, top + E, top + 0.13), 6).translate(x, 0, z));
  }
  return mergeParts(parts);
}

/** One nozzle along +y: hub, pipe, flange and a recessed bore. */
function nozzle(spec: { hubRadius: number; pipeRadius: number; boreRadius: number; flangeRadius: number; length: number }, seg: number): BufferGeometry {
  const { hubRadius: hb, pipeRadius: p, boreRadius: b, flangeRadius: f, length: l } = spec;
  return createLatheSolid(
    [
      [0, -0.07],
      [hb, -0.07],
      [hb, 0.2],
      [p, 0.3],
      [p, l - 0.12],
      [f, l - 0.12],
      [f, l],
      [b, l],
      [b, l - 0.4],
      [0, l - 0.4],
    ],
    seg,
  );
}

/** Steam and feedwater nozzles, support lugs and the dryer support brackets (vessel steel). */
export function createVesselAppurtenances(d: RpvDetail): { steamNozzles: BufferGeometry; other: BufferGeometry } {
  const ro = VESSEL.outerRadius;
  const steam = NOZZLES.mainSteam.azimuthDeg.map((deg) => radial(nozzle(NOZZLES.mainSteam, d.small * 2), deg, ro, NOZZLES.mainSteam.h));
  const parts: BufferGeometry[] = NOZZLES.feedwater.azimuthDeg.map((deg) => radial(nozzle(NOZZLES.feedwater, d.small * 2), deg, ro, NOZZLES.feedwater.h));
  for (let i = 0; i < SHELL_LUGS.count; i++) {
    const a = ((SHELL_LUGS.azimuthOffsetDeg + (360 / SHELL_LUGS.count) * i) * Math.PI) / 180;
    const r = ro + SHELL_LUGS.depth / 2 - 0.03;
    parts.push(box(0, 0, 0, SHELL_LUGS.depth, SHELL_LUGS.height, SHELL_LUGS.width).rotateY(-a).translate(Math.cos(a) * r, SHELL_LUGS.h, Math.sin(a) * r));
  }
  const { brackets } = DRYER;
  for (let i = 0; i < brackets.count; i++) {
    const a = ((brackets.azimuthOffsetDeg + (360 / brackets.count) * i) * Math.PI) / 180;
    const r = VESSEL.innerRadius - E - brackets.depth / 2;
    parts.push(box(0, 0, 0, brackets.depth, brackets.height, brackets.width).rotateY(-a).translate(Math.cos(a) * r, brackets.h + brackets.height / 2, Math.sin(a) * r));
  }
  return { steamNozzles: mergeParts(steam), other: mergeParts(parts) };
}

/** Control rod drive housings below the bottom head (one per blade) and their motor units. */
export function createDrives(d: RpvDetail): { housings: BufferGeometry; motors: BufferGeometry } {
  const housings: BufferGeometry[] = [];
  const motors: BufferGeometry[] = [];
  const seg = Math.max(8, d.small - 4);
  for (const blade of CONTROL_BLADES) {
    const [x, z] = blade.position;
    const top = bottomHeadOuterH(Math.hypot(x, z)) + 0.04; // slightly into the head wall
    housings.push(createLatheSolid(ring(0, DRIVES.housingRadius, DRIVES.housingBottomH, top), seg).translate(x, 0, z));
    const m0 = DRIVES.housingBottomH - E - DRIVES.motor.height;
    motors.push(createLatheSolid(ring(0, DRIVES.motor.radius, m0, DRIVES.housingBottomH - E), seg).translate(x, 0, z));
  }
  return { housings: mergeParts(housings), motors: mergeParts(motors) };
}

// ---- Core support structures -------------------------------------------------------------------

export function createShroud(d: RpvDetail): BufferGeometry {
  return createLatheSolid(ring(SHROUD.innerRadius, SHROUD.outerRadius, SHROUD.bottomH, SHROUD.topH), d.radial);
}

export function createChimney(d: RpvDetail): BufferGeometry {
  return createLatheSolid(ring(CHIMNEY.innerRadius, CHIMNEY.outerRadius, CHIMNEY.bottomH, CHIMNEY.topH), d.radial);
}

/** Shroud support: ring under the core plate on vertical legs welded to the bottom head. */
export function createShroudSupport(d: RpvDetail): BufferGeometry {
  const { ring: rg, legs } = SHROUD_SUPPORT;
  const parts: BufferGeometry[] = [createLatheSolid(ring(rg.innerRadius, rg.outerRadius, rg.bottomH, rg.topH), d.radial)];
  for (let i = 0; i < legs.count; i++) {
    // Offset half a step: no leg sits on a cutaway plane.
    const a = ((i + 0.5) / legs.count) * Math.PI * 2;
    const bottom = bottomHeadInnerH(legs.radius - legs.depth / 2);
    const top = rg.bottomH - E;
    parts.push(box(0, 0, 0, legs.depth, top - bottom, legs.width).rotateY(-a).translate(Math.cos(a) * legs.radius, (top + bottom) / 2, Math.sin(a) * legs.radius));
  }
  return mergeParts(parts);
}

export function createCorePlate(d: RpvDetail): BufferGeometry {
  return createLatheSolid(ring(0, CORE_PLATE.radius, CORE_PLATE.bottomH, CORE_PLATE.topH), d.radial);
}

/** Control rod guide tubes (bottom head to core plate) and the orificed fuel supports on top. */
export function createGuideTubesAndSupports(d: RpvDetail): { guideTubes: BufferGeometry; supports: BufferGeometry } {
  const tubes: BufferGeometry[] = [];
  const supports: BufferGeometry[] = [];
  for (const blade of CONTROL_BLADES) {
    const [x, z] = blade.position;
    const bottom = bottomHeadInnerH(Math.hypot(x, z)) + E;
    tubes.push(createLatheSolid(ring(GUIDE_TUBE.innerRadius, GUIDE_TUBE.outerRadius, bottom, CORE_PLATE.bottomH - E), d.small).translate(x, 0, z));
    supports.push(createLatheSolid(ring(0, FUEL_SUPPORT.radius, CORE_PLATE.topH + E, FUEL_SUPPORT.topH - E), d.small).translate(x, 0, z));
  }
  for (const bundle of FUEL_BUNDLES) {
    if (bundle.cell) continue;
    supports.push(createLatheSolid(ring(0, FUEL_SUPPORT.peripheralRadius, CORE_PLATE.topH + E, FUEL_SUPPORT.topH - E), d.small).translate(bundle.x, 0, bundle.z));
  }
  return { guideTubes: mergeParts(tubes), supports: mergeParts(supports) };
}

/** Top guide: rim ring, flange ring and a square grid with one opening per control cell. */
export function createTopGuide(d: RpvDetail, cellPitch: number): BufferGeometry {
  const { gridBottomH: y0, gridTopH: y1, barThickness: t, rim, flange } = TOP_GUIDE;
  const parts: BufferGeometry[] = [
    createLatheSolid(ring(rim.innerRadius, rim.outerRadius, y0, y1), d.radial),
    createLatheSolid(ring(flange.innerRadius, flange.outerRadius, flange.bottomH, flange.topH), d.radial),
  ];
  const reach = rim.innerRadius - 0.01;
  const lines: number[] = [];
  for (let k = -5; k <= 4; k++) lines.push((k + 0.5) * cellPitch);
  const height = y1 - y0;
  const yc = (y0 + y1) / 2;
  // Beams along x run through; beams along z are split between them, so no two solids overlap.
  for (const z of lines) {
    const half = Math.sqrt(Math.max(0, reach * reach - (Math.abs(z) + t / 2) ** 2));
    if (half > 0.05) parts.push(box(0, yc, z, 2 * half, height, t));
  }
  for (const x of lines) {
    const half = Math.sqrt(Math.max(0, reach * reach - (Math.abs(x) + t / 2) ** 2));
    const stops = [-half, ...lines.filter((z) => Math.abs(z) < half), half];
    for (let i = 0; i < stops.length - 1; i++) {
      const a = stops[i]! + (i > 0 ? t / 2 + E : 0);
      const b = stops[i + 1]! - (i < stops.length - 2 ? t / 2 + E : 0);
      if (b - a > 0.02) parts.push(box(x, yc, (a + b) / 2, t, height, b - a));
    }
  }
  return mergeParts(parts);
}

// ---- Fuel and blades (instanced unit geometry) ---------------------------------------------------

/** One fuel assembly in local coordinates (axis at x = z = 0): nose, channel, handle. */
export function createBundleUnit(): BufferGeometry {
  const { channelWidth: w, channelBottomH: c0, channelTopH: c1, nose, handle } = FUEL;
  return mergeParts([
    box(0, c0 - E - nose.height / 2, 0, nose.width, nose.height, nose.width),
    box(0, (c0 + c1) / 2, 0, w, c1 - c0, w),
    box(0, c1 + E + handle.height / 2, 0, handle.width, handle.height, handle.thickness),
  ]);
}

/**
 * One cruciform control blade, local origin at the bottom of its absorber section: four wings
 * (one through-plate along x, two half-wings along z, so no solids overlap), the handle on top
 * and the velocity limiter below.
 */
export function createBladeUnit(d: RpvDetail): BufferGeometry {
  const { halfSpan: s, thickness: t, length: l, handle, limiter } = BLADE;
  const wing = s - t / 2 - E;
  return mergeParts([
    box(0, l / 2, 0, 2 * s, l, t),
    box(0, l / 2, t / 2 + E + wing / 2, t, l, wing),
    box(0, l / 2, -(t / 2 + E + wing / 2), t, l, wing),
    box(0, l + E + handle.height / 2, 0, handle.width, handle.height, handle.thickness),
    createLatheSolid(ring(0, limiter.radius, -E - limiter.height, -E), d.small),
  ]);
}

// ---- Steam region ---------------------------------------------------------------------------------

export function createChimneyHead(d: RpvDetail): BufferGeometry {
  const h = CHIMNEY_HEAD;
  return createLatheSolid(
    [
      [h.skirtInnerRadius, h.bottomH],
      [h.radius, h.bottomH],
      [h.radius, h.topH],
      [0, h.topH],
      [0, h.plateBottomH],
      [h.skirtInnerRadius, h.plateBottomH],
    ],
    d.radial,
  );
}

/** Separator grid positions: square pitch, offset half a pitch so none sits on x = 0 / z = 0. */
export function separatorPositions(): [number, number][] {
  const positions: [number, number][] = [];
  const n = Math.ceil(SEPARATORS.maxCentreRadius / SEPARATORS.pitch) + 1;
  for (let i = -n; i < n; i++) {
    for (let k = -n; k < n; k++) {
      const x = (i + 0.5) * SEPARATORS.pitch;
      const z = (k + 0.5) * SEPARATORS.pitch;
      if (Math.hypot(x, z) <= SEPARATORS.maxCentreRadius) positions.push([x, z]);
    }
  }
  return positions;
}

/** Standpipes and AS-2B-style separator bodies on the chimney head (merged, one draw call). */
export function createSeparators(d: RpvDetail): BufferGeometry {
  const { standpipe, body, cap } = SEPARATORS;
  const seg = d.small;
  const parts: BufferGeometry[] = [];
  for (const [x, z] of separatorPositions()) {
    parts.push(createLatheSolid(ring(0, standpipe.radius, CHIMNEY_HEAD.topH + E, standpipe.topH), seg).translate(x, 0, z));
    parts.push(createLatheSolid(ring(0, body.radius, standpipe.topH + E, body.topH), seg).translate(x, 0, z));
    parts.push(createLatheSolid(ring(0, cap.radius, body.topH + E, cap.topH), seg).translate(x, 0, z));
  }
  return mergeParts(parts);
}

/** Corrugated (chevron) vane bank in plan, centred on z = zc, extruded up from `y0`. */
function vaneBank(zc: number, halfLength: number, thickness: number, height: number, y0: number): BufferGeometry {
  const { amplitude: a, period: p } = DRYER.banks.corrugation;
  const steps = Math.max(2, Math.round((2 * halfLength) / (p / 2)));
  const wave = (i: number) => (i % 2 === 0 ? a / 2 : -a / 2);
  const xs = Array.from({ length: steps + 1 }, (_, i) => -halfLength + (2 * halfLength * i) / steps);
  // Shape in (x, -z): ExtrudeGeometry extrudes along +z; rotating by -90° about x turns that into +y.
  const shape = new Shape();
  xs.forEach((x, i) => (i === 0 ? shape.moveTo(x, -(zc + wave(i) + thickness / 2)) : shape.lineTo(x, -(zc + wave(i) + thickness / 2))));
  for (let i = steps; i >= 0; i--) shape.lineTo(xs[i]!, -(zc + wave(i) - thickness / 2));
  shape.closePath();
  const geometry = new ExtrudeGeometry(shape, { depth: height, bevelEnabled: false, steps: 1 });
  return geometry.rotateX(-Math.PI / 2).translate(0, y0, 0);
}

/** The downcomer annulus as a closed volume (a pick/highlight proxy, never a physical part). */
export function createDowncomerProxy(d: RpvDetail): BufferGeometry {
  return createLatheSolid(ring(DOWNCOMER.innerRadius + 0.02, DOWNCOMER.outerRadius - 0.02, DOWNCOMER.bottomH, DOWNCOMER.topH), d.radial);
}

/** Steam dryer: skirt, support ring, stepped chevron vane banks with cover plates. */
export function createDryer(d: RpvDetail): BufferGeometry {
  const { skirt, ring: rg, banks } = DRYER;
  const parts: BufferGeometry[] = [
    createLatheSolid(ring(skirt.innerRadius, skirt.outerRadius, skirt.bottomH, skirt.topH), d.radial),
    createLatheSolid(ring(rg.innerRadius, rg.outerRadius, rg.bottomH, rg.topH), d.radial),
  ];
  for (const row of banks.rows) {
    for (const zc of [row.z, -row.z]) {
      const half = Math.sqrt(Math.max(0, banks.footprintRadius ** 2 - (row.z + banks.thickness / 2) ** 2));
      parts.push(vaneBank(zc, half, banks.thickness, row.height, banks.baseH));
      parts.push(box(0, banks.baseH + row.height + E + 0.02, zc, 2 * half + 0.04, 0.04, banks.thickness + 0.06));
    }
  }
  return mergeParts(parts);
}
