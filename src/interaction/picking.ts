/**
 * Semantic picking: one raycast against the meshes the registry owns, resolved to a component.
 *
 * - Only drawn meshes count (every ancestor visible), and not ghosted shells (X-ray lets you click
 *   through them); region proxies (the downcomer) count although they are not drawn.
 * - A hit in a part cut away by a section is skipped: the ray continues to what the viewer sees.
 * - Non-selectable components still occlude (a click on the ground does not reach the shaft).
 * - Instanced repeats resolve to their group (any fuel assembly -> `fuel-bundles`); the instance
 *   index is returned too, for future per-instance selection.
 */
import { Raycaster, Vector2, type Camera, type Material, type Mesh, type Object3D, type Vector3 } from 'three';
import { selectableFor, type ComponentId } from '../scene/components';
import { allBindings, ghostOf, ownerOf } from './exploreVisuals';

export interface PickResult {
  /** The component whose mesh was hit. */
  componentId: ComponentId;
  /** What selecting it means (itself or its nearest selectable ancestor); null = not selectable. */
  selectableId: ComponentId | null;
  point: Vector3;
  instanceId?: number;
}

const raycaster = new Raycaster();
const candidates: Mesh[] = [];

function isShown(object: Object3D): boolean {
  for (let o: Object3D | null = object; o; o = o.parent) if (!o.visible) return false;
  return true;
}

function isCutAway(material: Material, point: Vector3): boolean {
  const planes = material.clippingPlanes;
  if (!planes || planes.length === 0) return false;
  return material.clipIntersection ? planes.every((p) => p.distanceToPoint(point) < 0) : planes.some((p) => p.distanceToPoint(point) < 0);
}

/** The live camera and canvas (set by ExploreDriver), for picking by screen position. */
const view = { camera: null as Camera | null, canvas: null as HTMLCanvasElement | null };
export function setPickingView(camera: Camera | null, canvas: HTMLCanvasElement | null): void {
  view.camera = camera;
  view.canvas = canvas;
}

const _ndc = new Vector2();

/** Pick at a client (CSS pixel) position: automation and tests. */
export function pickAtClient(clientX: number, clientY: number): PickResult | null {
  if (!view.camera || !view.canvas) return null;
  const r = view.canvas.getBoundingClientRect();
  _ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
  return pickComponent(_ndc, view.camera);
}

/** Diagnostics: every hit along the ray, nearest first (automation only). */
export function debugHitsAtClient(clientX: number, clientY: number): { name: string; owner: unknown; cut: boolean; distance: number }[] {
  if (!view.camera || !view.canvas) return [];
  const r = view.canvas.getBoundingClientRect();
  _ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
  candidates.length = 0;
  for (const b of allBindings()) for (const mesh of b.meshes) if (isShown(mesh)) candidates.push(mesh);
  raycaster.setFromCamera(_ndc, view.camera);
  return raycaster.intersectObjects(candidates, false).slice(0, 12).map((hit) => {
    const mesh = hit.object as Mesh;
    const material = Array.isArray(mesh.material) ? mesh.material[hit.face?.materialIndex ?? 0] : mesh.material;
    return { name: mesh.name, owner: ownerOf(mesh), cut: !!material && isCutAway(material, hit.point), distance: +hit.distance.toFixed(2) };
  });
}

export function pickComponent(ndc: Vector2, camera: Camera): PickResult | null {
  candidates.length = 0;
  for (const b of allBindings()) {
    if (ghostOf(b.info.id) > 0.5) continue;
    for (const mesh of b.meshes) if (isShown(mesh)) candidates.push(mesh);
  }
  raycaster.setFromCamera(ndc, camera);
  for (const hit of raycaster.intersectObjects(candidates, false)) {
    const mesh = hit.object as Mesh;
    const material = Array.isArray(mesh.material) ? mesh.material[hit.face?.materialIndex ?? 0] : mesh.material;
    if (!material || isCutAway(material, hit.point)) continue;
    const componentId = ownerOf(mesh);
    if (!componentId) continue;
    return { componentId, selectableId: selectableFor(componentId), point: hit.point, instanceId: hit.instanceId };
  }
  return null;
}
