/**
 * Opaque draw order for the opened-up plant.
 *
 * three's default opaque sort groups items by material before depth, which for this scene
 * means the far half of the shaft, the containment and the earth are often shaded in full and
 * then painted over by the reactor in front of them. In every view where those layers are
 * visible at all, the reveal nesting is also the depth order: the front halves are cut away,
 * so inner layers (vessel internals) stand in front of outer ones (vessel, containment,
 * building, earth, site). Drawing inside-out, then front to back, lets the depth test reject
 * what is hidden before it is shaded. The image is unchanged; only the wasted work goes.
 */
import type { Object3D } from 'three';
import type { RevealLayerId } from './sectionLayers';

/** Drawing rank per reveal layer: lower draws first. */
export const REVEAL_DRAW_RANK: Record<RevealLayerId, number> = {
  internals: 0,
  fuel: 0,
  blades: 0,
  vessel: 1,
  containment: 2,
  building: 3,
  ground: 4,
  exterior: 5,
};

/** Rank for materials that belong to no reveal layer (studio floor, helpers). */
const UNRANKED = 6;

/**
 * While the vessel is only partly open, its remaining shell stands in front of most of the
 * internals: then the shell draws first. Fully open (the review and Explore cutaways), the
 * internals stand in front of the far shell and draw first (sectionLayers.applyReveal sets it).
 */
let vesselFirst = false;
export function setVesselDrawnFirst(first: boolean): void {
  vesselFirst = first;
}

interface OpaqueItem {
  id: number;
  object: Object3D;
  groupOrder: number;
  renderOrder: number;
  /** The render item's material (three's RenderItem; `id` is set by three at creation). */
  material: { id: number; userData: Record<string, unknown> };
  z: number;
}

const rank = (material: OpaqueItem['material']) => {
  const r = (material.userData.revealRank as number | undefined) ?? UNRANKED;
  return vesselFirst && r === REVEAL_DRAW_RANK.vessel ? -1 : r;
};

/** For `WebGLRenderer.setOpaqueSort`. */
export function revealOpaqueSort(a: OpaqueItem, b: OpaqueItem): number {
  if (a.groupOrder !== b.groupOrder) return a.groupOrder - b.groupOrder;
  if (a.renderOrder !== b.renderOrder) return a.renderOrder - b.renderOrder;
  const ra = rank(a.material);
  const rb = rank(b.material);
  if (ra !== rb) return ra - rb;
  if (a.z !== b.z) return a.z - b.z;
  if (a.material.id !== b.material.id) return a.material.id - b.material.id;
  return a.id - b.id;
}
