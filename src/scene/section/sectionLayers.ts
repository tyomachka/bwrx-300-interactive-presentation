/**
 * Reveal layers: the nested structures the hero shot opens one at a time, and the single
 * function that turns HeroRevealState into what the renderer sees.
 *
 *   exterior     site context (turbine hall, support buildings, studio floor): dims only
 *   ground       site earth, apron, entrance figure: cut by the excavation box
 *   building     reactor building (above grade) + shaft + floors + pools: cut by a plane
 *   containment  containment vessel + RPV pedestal: cut by its own plane
 *   vessel       the RPV shell, heads, nozzles, drives: the hero shot only emphasises it; the
 *                Stage 4 vessel cutaway opens it
 *   internals    shroud, core support, chimney, separators, dryer  } inside the vessel, cut by
 *   fuel         the 240 fuel assemblies                            } the vessel's planes, each
 *   blades       the 57 control blades                              } with its own emphasis
 *
 * The plant cuts are parallel planes (normal +z, facing the south camera side) that all end on
 * the reactor axis plane z = 0, so the finished hero state is one coherent section. The vessel
 * cutaway removes the quadrant facing those cameras (x < 0, z > 0), keeping three quarters of
 * the shell around the internals. The Stage 2 section review (key G) is the same system in a
 * static configuration.
 */
import { Color, MathUtils, Plane, Vector3 } from 'three';
import type { Object3D } from 'three';
import type { HeroRevealState } from '../../animation/heroReveal';
import { KEY_LIGHT_POSITION, PALETTE } from '../../config/render';
import { REACTOR_PRESSURE_VESSEL as RPV } from '../plant/dimensions';
import { CORE_SECTION_H } from '../rpv/rpvData';
import { cutPlaneZ } from './cutPath';
import { createLayerUniforms, type LayerUniforms, type SectionUniformMap } from './sectionShader';

export type RevealLayerId = 'exterior' | 'ground' | 'building' | 'containment' | 'vessel' | 'internals' | 'fuel' | 'blades';
/** Layers with their own section box. */
export type SectionedLayerId = Extract<RevealLayerId, 'ground' | 'building' | 'containment' | 'vessel'>;

/** The section box each layer is clipped by (`exterior` is never clipped). */
export const LAYER_CLIP: Record<Exclude<RevealLayerId, 'exterior'>, SectionedLayerId> = {
  ground: 'ground',
  building: 'building',
  containment: 'containment',
  vessel: 'vessel',
  internals: 'vessel',
  fuel: 'vessel',
  blades: 'vessel',
};

/**
 * Vessel cutaway corner at `vesselCut` = 0: on the flange circle (r ≈ 2.56 m) in the
 * camera-facing quadrant, so the removed wedge bites into the vessel from the first frame and
 * grows to the full quadrant at 1.
 */
const VESSEL_CUT_START = 1.82;

/**
 * The excavation the reveal opens in front of the reactor building (world metres).
 * Its east wall stops short of the turbine hall (west wall at x = 20.6), so the hall is never
 * undermined; its floor is the top of the earth under the shaft basemat, so the shaft stands
 * on it. Camera sight lines into it must cross grade inside it.
 */
export const EXCAVATION = {
  xMin: -40,
  xMax: 20,
  zFront: 84,
  floorY: -36,
} as const;

/** Far enough to never bind (metres). */
const OPEN = 1e4;

interface SectionBox {
  cutZ: number;
  frontZ: number;
  xMin: number;
  xMax: number;
  floorY: number;
}

/**
 * Five planes per layer, used with clipIntersection: a fragment is removed only when it is
 * inside all of them (z > cut, z < front, xMin < x < xMax, y > floor). The plane count never
 * changes, so no shader is ever recompiled during the shot.
 */
function createBoxPlanes(): Plane[] {
  return [
    new Plane(new Vector3(0, 0, -1), 0), // removed where z > cutZ
    new Plane(new Vector3(0, 0, 1), 0), // removed where z < frontZ
    new Plane(new Vector3(-1, 0, 0), 0), // removed where x > xMin
    new Plane(new Vector3(1, 0, 0), 0), // removed where x < xMax
    new Plane(new Vector3(0, -1, 0), 0), // removed where y > floorY
  ];
}

function setBox(planes: Plane[], box: SectionBox): void {
  planes[0]!.constant = box.cutZ;
  planes[1]!.constant = -box.frontZ;
  planes[2]!.constant = box.xMin;
  planes[3]!.constant = -box.xMax;
  planes[4]!.constant = box.floorY;
}

/** An empty box: nothing is removed. */
const CLOSED: SectionBox = { cutZ: OPEN, frontZ: OPEN, xMin: -OPEN, xMax: OPEN, floorY: -OPEN };

export const SECTION_PLANES: Record<SectionedLayerId, Plane[]> = {
  ground: createBoxPlanes(),
  building: createBoxPlanes(),
  containment: createBoxPlanes(),
  vessel: createBoxPlanes(),
};
for (const planes of Object.values(SECTION_PLANES)) setBox(planes, CLOSED);

export const LAYER_UNIFORMS: Record<RevealLayerId, LayerUniforms> = {
  exterior: createLayerUniforms(),
  ground: createLayerUniforms(),
  building: createLayerUniforms(),
  containment: createLayerUniforms(),
  vessel: createLayerUniforms(),
  internals: createLayerUniforms(),
  fuel: createLayerUniforms(),
  blades: createLayerUniforms(),
};

/** Shared by every section material. */
export const SECTION_GLOBAL_UNIFORMS = {
  /** Cut surfaces are lit by the key light's direction, flat (a section poché). */
  uSectionKeyDir: { value: new Vector3(...KEY_LIGHT_POSITION).normalize() },
  /** Below-grade fill: soft, from the camera side and slightly above. */
  uSectionFillDir: { value: new Vector3(-0.45, 0.4, 1).normalize() },
  uSectionFillColor: { value: new Color('#d4dbe3') },
  /** x ambient, y key, z detail (strata on/off; set from the quality preset). */
  uSectionCapLight: { value: new Vector3(0.3, 0.6, 1) },
  uSectionDatumColor: { value: new Color(PALETTE.accent) },
  /** Grade datum strength. It is drawn on section planes only: one grade line, not an outline. */
  uSectionDatum: { value: 1 },
  /**
   * RPV backlight pool: a line light just behind the vessel axis, so the containment wall
   * behind the RPV glows softly and the vessel's silhouette separates from it (product shot).
   */
  uSectionGlowA: { value: new Vector3(0, RPV.topY - RPV.height + 4, -(RPV.outerRadius + 1)) },
  uSectionGlowB: { value: new Vector3(0, RPV.topY - 4, -(RPV.outerRadius + 1)) },
  uSectionGlowRadius: { value: 3.6 },
} satisfies SectionUniformMap;

/** Cool and neutral: the warm accent stays reserved for the datum and the rim. */
const GLOW = new Color('#c7d3e1');

export function setSectionCapDetail(detailed: boolean): void {
  SECTION_GLOBAL_UNIFORMS.uSectionCapLight.value.z = detailed ? 1 : 0;
}

// -------------------------------------------------------------------------------------
// Interior content: drawn only once something has opened it.

/**
 * `vessel` = the RPV inside the opened containment; `reactor` = the vessel internals, drawn only
 * once the vessel cutaway opens; `review` = only the Stage 2 section review shows it (main steam
 * path, turbine hall interior).
 */
export type InteriorLevel = 'belowGrade' | 'building' | 'vessel' | 'reactor' | 'review';

const interiorGroups = new Map<Object3D, InteriorLevel>();
const interiorOpen: Record<InteriorLevel, boolean> = { belowGrade: false, building: false, vessel: false, reactor: false, review: false };

export function registerInterior(group: Object3D, level: InteriorLevel): () => void {
  interiorGroups.set(group, level);
  group.visible = interiorOpen[level];
  return () => void interiorGroups.delete(group);
}

// -------------------------------------------------------------------------------------

const ACCENT = new Color(PALETTE.accent);
const smooth = MathUtils.smoothstep;
const lerp = MathUtils.lerp;

/**
 * Apply the reveal to the renderer state: section planes, layer uniforms, interior visibility.
 * `state === null` is the Stage 2 section review: a static, full-width cut at z = 0 with no
 * grading, as a development aid. Called once per frame, before rendering.
 */
export function applyReveal(state: Readonly<HeroRevealState> | null): void {
  const u = LAYER_UNIFORMS;

  if (state === null) {
    const review: SectionBox = { cutZ: 0, frontZ: OPEN, xMin: -OPEN, xMax: OPEN, floorY: -OPEN };
    for (const planes of Object.values(SECTION_PLANES)) setBox(planes, review);
    for (const layer of Object.values(u)) {
      layer.uSectionSurface.value = 1;
      layer.uSectionCapMul.value = 1;
      layer.uSectionFill.value = 0.35;
      layer.uSectionRim.value.setRGB(0, 0, 0);
      layer.uSectionGlow.value.setRGB(0, 0, 0);
    }
    u.exterior.uSectionFill.value = 0;
    SECTION_GLOBAL_UNIFORMS.uSectionDatum.value = 1;
    setInterior({ belowGrade: true, building: true, vessel: true, reactor: true, review: true });
    return;
  }

  const { groundCut: g, exteriorDim: e, shaftReveal: s, containmentReveal: c, rpvEmphasis: r, vesselCut: v, coreSection: k, bladeEmphasis: b } = state;

  // Section planes sweep from in front of each structure to the reactor axis plane.
  setBox(
    SECTION_PLANES.ground,
    g > 0 ? { cutZ: lerp(EXCAVATION.zFront, 0, g), frontZ: EXCAVATION.zFront, xMin: EXCAVATION.xMin, xMax: EXCAVATION.xMax, floorY: EXCAVATION.floorY } : CLOSED,
  );
  setBox(SECTION_PLANES.building, s > 0 ? { ...CLOSED, cutZ: cutPlaneZ('building', s) } : CLOSED);
  setBox(SECTION_PLANES.containment, c > 0 ? { ...CLOSED, cutZ: cutPlaneZ('containment', c) } : CLOSED);
  // Vessel cutaway: the quadrant x < 0, z > 0 (facing the south-west cameras), growing from
  // the flange edge to the reactor axis.
  // With `coreSection`, the quadrant refills from below up to mid-core (a step cut).
  const corner = VESSEL_CUT_START * (1 - v);
  const floorY = k > 0 ? lerp(RPV.insideBottomY - 7, RPV.insideBottomY + CORE_SECTION_H, k) : -OPEN;
  setBox(SECTION_PLANES.vessel, v > 0 ? { ...CLOSED, cutZ: corner, xMax: -corner, floorY } : CLOSED);

  // Grade datum: full while the ground opens; once the shaft is established it steps back
  // (faint by the containment reveal) and is gone before the RPV becomes the subject.
  SECTION_GLOBAL_UNIFORMS.uSectionDatum.value = (1 - 0.7 * smooth(s, 0.15, 0.85)) * (1 - smooth(c, 0.1, 0.75));

  // Hierarchy: one subject at a time; everything already explained recedes.
  const groundOpen = smooth(g, 0, 0.45);
  const containmentFocus = smooth(s, 0.55, 1) * (1 - smooth(c, 0.1, 0.8));

  u.exterior.uSectionSurface.value = 1 - 0.62 * e;

  u.ground.uSectionSurface.value = 1 - 0.62 * e;
  u.ground.uSectionCapMul.value = 1 - 0.25 * s - 0.2 * c;
  u.ground.uSectionFill.value = 0.55 * groundOpen;

  u.building.uSectionSurface.value = 1 - 0.45 * s - 0.15 * c;
  u.building.uSectionCapMul.value = 1 - 0.3 * s - 0.2 * c;
  u.building.uSectionFill.value = 0.5 * groundOpen;

  u.containment.uSectionSurface.value = (1 + 0.12 * containmentFocus) * (1 - 0.42 * c);
  u.containment.uSectionCapMul.value = 1 - 0.3 * c;
  u.containment.uSectionFill.value = 0.5 * smooth(s, 0, 0.5);
  u.containment.uSectionRim.value.copy(ACCENT).multiplyScalar(0.28 * containmentFocus);
  u.containment.uSectionGlow.value.copy(GLOW).multiplyScalar(1.15 * r);

  // The subject: lifted, but lit rather than luminous (the warm rim does the separating).
  u.vessel.uSectionSurface.value = 1 + 0.18 * r;
  u.vessel.uSectionFill.value = 0.5 * smooth(s, 0, 0.5) + 0.3 * r;
  u.vessel.uSectionRim.value.copy(ACCENT).multiplyScalar(0.55 * r);

  // Inside the vessel: lit by the same below-grade fill, no rims by default. When the blades
  // are the subject they lift and take the accent rim, and the fuel steps back a little.
  const insideFill = 0.6 * smooth(v, 0, 0.6);
  u.internals.uSectionFill.value = insideFill;
  u.fuel.uSectionSurface.value = 1 - 0.3 * b;
  u.fuel.uSectionFill.value = insideFill;
  u.blades.uSectionSurface.value = 1 + 0.3 * b;
  u.blades.uSectionFill.value = insideFill + 0.25 * b;
  u.blades.uSectionRim.value.copy(ACCENT).multiplyScalar(0.6 * b);
  u.blades.uSectionCapTint.value.copy(ACCENT).multiplyScalar(0.3 * b);

  setInterior({ belowGrade: g > 0, building: s > 0, vessel: c > 0, reactor: v > 0, review: false });
}

const lastPlaneConstants = new Float64Array(Object.keys(SECTION_PLANES).length * 5).fill(Number.NaN);

/**
 * True when any section plane moved since the last call. The shadow map depends on the cuts
 * (clipped shadows) and on which interior content is drawn, and both follow the planes, so it
 * only needs re-rendering on these frames (RevealDriver).
 */
export function sectionPlanesChanged(): boolean {
  let changed = false;
  let i = 0;
  for (const planes of Object.values(SECTION_PLANES)) {
    for (const plane of planes) {
      if (lastPlaneConstants[i] !== plane.constant) changed = true;
      lastPlaneConstants[i++] = plane.constant;
    }
  }
  return changed;
}

function setInterior(open: Record<InteriorLevel, boolean>): void {
  Object.assign(interiorOpen, open);
  for (const [group, level] of interiorGroups) group.visible = interiorOpen[level];
}
