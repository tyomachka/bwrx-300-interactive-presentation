/**
 * Explore visuals (Stage 5): binds the registry to the scene once, then turns the Explore state
 * into per-component shader uniforms.
 *
 * Binding: every registered component found in the scene gets its own copies of the materials
 * of the meshes it owns (cloneForComponent: same program, its own explore uniforms). Clones are
 * made once per component and material, never per hover, and survive a canvas rebuild. A mesh
 * belongs to the nearest registered component above it.
 *
 * Per frame, only while something is changing: hover, selection, isolation and X-ray targets
 * are derived from the store and the registry hierarchy, eased, and written to uniforms. When
 * every value has settled the update returns immediately (idle cost: one comparison).
 *
 *  - hover / selection: the component and its physical parts (partOfParent) lift and take the
 *    accent rim; a selected component may tint its cut surfaces (selectedCapTint);
 *  - isolation: the component's whole subtree stays; enclosures around it ghost; everything
 *    else dims (one global uniform, so unbound context dims too);
 *  - X-ray: plant enclosures ghost (ground window, buildings, containment, turbine hall); the
 *    vessel ghosts only when the subject is the vessel or inside it. What a ghosted enclosure
 *    holds is drawn (interior override), and ghosted meshes stop casting shadows.
 */
import { Box3, Color, Vector3, type Material, type Mesh, type Object3D, type Scene } from 'three';
import { PALETTE } from '../config/render';
import { COMPONENT_IDS, COMPONENTS, isComponentId, isDescendantOf, type ComponentId, type ComponentInfo } from '../scene/components';
import { cloneForComponent, hasSectionShader, setBoundVariants } from '../scene/plant/materials';
import { interiorOverride, requestShadowUpdate, type InteriorLevel } from '../scene/section/sectionLayers';
import { createExploreUniforms, EXPLORE_GLOBAL_UNIFORMS, type ExploreUniforms } from '../scene/section/sectionShader';
import { heroReveal } from '../animation/heroReveal';
import { exploreState, useExploreStore } from './exploreStore';

interface Channel {
  value: number;
  target: number;
}

interface Binding {
  info: ComponentInfo;
  object: Object3D;
  meshes: Mesh[];
  /** Region proxies (drawn only while hovered or selected). */
  regions: Mesh[];
  uniforms: ExploreUniforms;
  hover: Channel;
  selected: Channel;
  /** Selected itself (not as a part of the selection): gates the cut-surface tint. */
  self: Channel;
  keep: Channel;
  ghost: Channel;
}

const ACCENT = new Color(PALETTE.accent);
const RATE = { hover: 14, selected: 10, keep: 8, ghost: 7, dim: 8 } as const;
const ISOLATION_DIM = 0.3;
const REGION_GHOST = 0.72;

const uniformsById = new Map<ComponentId, ExploreUniforms>();
const clones = new Map<string, Material>();
/**
 * Binding data per mesh. Kept here, not in `mesh.userData`: R3F re-applies declarative
 * `userData` props on re-render, which would silently drop anything written there.
 */
const ownerOfMesh = new WeakMap<Mesh, ComponentId>();
const baseCastOf = new WeakMap<Mesh, boolean>();

/** The component a mesh belongs to (picking). */
export const ownerOf = (mesh: Mesh) => ownerOfMesh.get(mesh);

let bindings = new Map<ComponentId, Binding>();
let boundRoot: Object3D | null = null;
const dim: Channel = { value: 1, target: 1 };
let dirty = true;

useExploreStore.subscribe(() => void (dirty = true));

const children = new Map<ComponentId, ComponentInfo[]>();
for (const info of Object.values(COMPONENTS)) {
  if (info.parent) children.set(info.parent, [...(children.get(info.parent) ?? []), info]);
}

/** The component and its physical parts, recursively: what a hover or selection lights up. */
export function highlightSet(id: ComponentId, out = new Set<ComponentId>()): Set<ComponentId> {
  out.add(id);
  for (const child of children.get(id) ?? []) if (child.partOfParent) highlightSet(child.id, out);
  return out;
}

function subtree(id: ComponentId, out = new Set<ComponentId>()): Set<ComponentId> {
  out.add(id);
  for (const child of children.get(id) ?? []) subtree(child.id, out);
  return out;
}

// ---- Binding --------------------------------------------------------------------------------------

function collectOwnMeshes(object: Object3D, root: Object3D, out: Mesh[]): void {
  if (object !== root && isComponentId(object.name)) return; // a sub-component owns its meshes
  if ((object as Mesh).isMesh) out.push(object as Mesh);
  for (const child of object.children) collectOwnMeshes(child, root, out);
}

function bindMaterial(id: ComponentId, uniforms: ExploreUniforms, base: Material): Material {
  if (!hasSectionShader(base)) return base;
  const key = `${id}|${base.uuid}`;
  let clone = clones.get(key);
  if (!clone) {
    clone = cloneForComponent(base, uniforms);
    clones.set(key, clone);
  }
  // Per-canvas render state follows the base (alpha-to-coverage tracks MSAA): same program.
  if (clone.alphaToCoverage !== base.alphaToCoverage) {
    clone.alphaToCoverage = base.alphaToCoverage;
    clone.needsUpdate = true;
  }
  return clone;
}

/**
 * Bind the registry to the scene (idempotent; call every frame until it returns true, and again
 * after a canvas rebuild, which creates a new plant root).
 */
export function bindComponents(scene: Scene): boolean {
  const root = scene.getObjectByName(COMPONENT_IDS.plant);
  if (!root) return false;
  if (root === boundRoot) return true;
  boundRoot = root;
  bindings = new Map();
  anchors.clear();
  for (const info of Object.values(COMPONENTS)) {
    const object = root.name === info.id ? root : root.getObjectByName(info.id);
    if (!object) continue;
    const uniforms = uniformsById.get(info.id) ?? createExploreUniforms();
    uniformsById.set(info.id, uniforms);
    const meshes: Mesh[] = [];
    collectOwnMeshes(object, object, meshes);
    const regions: Mesh[] = [];
    for (const mesh of meshes) {
      const bind = (m: Material) => bindMaterial(info.id, uniforms, m);
      mesh.material = Array.isArray(mesh.material) ? mesh.material.map(bind) : bind(mesh.material);
      const variants = mesh.userData.materialVariants as Material[] | undefined;
      if (variants) setBoundVariants(mesh, new Map(variants.map((v) => [v, bind(v)])));
      ownerOfMesh.set(mesh, info.id);
      baseCastOf.set(mesh, mesh.castShadow);
      if (!Array.isArray(mesh.material) && !mesh.material.visible) regions.push(mesh);
    }
    const channel = (): Channel => ({ value: 0, target: 0 });
    bindings.set(info.id, { info, object, meshes, regions, uniforms, hover: channel(), selected: channel(), self: channel(), keep: channel(), ghost: channel() });
  }
  dirty = true;
  return true;
}

export const bindingOf = (id: ComponentId) => bindings.get(id);
export const allBindings = () => bindings.values();

// ---- Targets ---------------------------------------------------------------------------------------

const EMPTY = new Set<ComponentId>();

function computeTargets(): void {
  const s = exploreState();
  const active = s.mode === 'explore';
  const hoverSet = active && s.hoveredId ? highlightSet(s.hoveredId) : EMPTY;
  const selected = active ? s.selectedId : null;
  const selectedSet = selected ? highlightSet(selected) : EMPTY;
  const isolate = active && s.isolate && selected !== null;
  const keepSet = isolate && selected ? subtree(selected) : EMPTY;
  const subjectInVessel = selected !== null && isDescendantOf(selected, COMPONENT_IDS.rpv);
  const xray = active && s.xray;

  const ownGhost = (info: ComponentInfo): number => {
    if (!info.enclosure) return 0;
    const openedBy = info.enclosure.openedBy;
    if (openedBy && heroReveal[openedBy] >= 0.99) return 0; // already cut open: nothing to see through
    if (info.id === COMPONENT_IDS.rpv && !subjectInVessel) return 0; // the vessel ghosts only for its own subject
    if (xray) return 1;
    if (isolate && !keepSet.has(info.id)) return 1;
    return 0;
  };
  const ghostOf = (info: ComponentInfo): number => (info.partOfParent && info.parent ? ghostOf(COMPONENTS[info.parent]) : ownGhost(info));

  for (const b of bindings.values()) {
    b.hover.target = hoverSet.has(b.info.id) ? 1 : 0;
    b.selected.target = selectedSet.has(b.info.id) ? 1 : 0;
    b.self.target = selected === b.info.id ? 1 : 0;
    b.keep.target = keepSet.has(b.info.id) ? 1 : 0;
    b.ghost.target = b.regions.length ? 0 : ghostOf(b.info);
  }
  dim.target = isolate ? ISOLATION_DIM : 1;
}

// ---- Per-frame update --------------------------------------------------------------------------------

const ease = (c: Channel, rate: number, dt: number, immediate: boolean): boolean => {
  if (immediate || Math.abs(c.target - c.value) < 1e-3) {
    const changed = c.value !== c.target;
    c.value = c.target;
    return changed;
  }
  c.value += (c.target - c.value) * (1 - Math.exp(-rate * dt));
  return true;
};

/** Advance every explore visual by `dt` seconds (or straight to its target). Cheap when idle. */
export function updateExploreVisuals(dt: number, immediate = false): void {
  if (!dirty && !immediate) return;
  computeTargets();
  let moving = ease(dim, RATE.dim, dt, immediate);
  let castChanged = false;
  const open: Partial<Record<InteriorLevel, boolean>> = {};

  for (const b of bindings.values()) {
    moving = ease(b.hover, RATE.hover, dt, immediate) || moving;
    moving = ease(b.selected, RATE.selected, dt, immediate) || moving;
    moving = ease(b.self, RATE.selected, dt, immediate) || moving;
    moving = ease(b.keep, RATE.keep, dt, immediate) || moving;
    moving = ease(b.ghost, RATE.ghost, dt, immediate) || moving;

    const u = b.uniforms;
    const h = b.hover.value;
    const sel = b.selected.value;
    // Hover is a hint (a lift, a trace of rim); selection is the information colour.
    u.uExploreLift.value = 1 + 0.12 * h * (1 - sel) + 0.12 * sel;
    u.uExploreRim.value.copy(ACCENT).multiplyScalar(Math.max(0.08 * h, 0.95 * sel));
    // Only when it is the subject itself (selecting the core does not turn its blades copper).
    u.uExploreCapTint.value.copy(ACCENT).multiplyScalar((b.info.selectedCapTint ?? 0) * b.self.value);
    u.uExploreKeep.value = b.keep.value;

    if (b.regions.length) {
      // A region is drawn only while it is the subject, as a ghosted warm volume.
      const shown = Math.max(h, sel);
      for (const r of b.regions) (r.material as Material).visible = shown > 0.01;
      u.uExploreGhost.value = REGION_GHOST + (1 - REGION_GHOST) * (1 - shown);
      continue;
    }

    const g = b.ghost.value;
    u.uExploreGhost.value = g;
    if (b.info.enclosure?.window) u.uExploreGhostWindow.value.set(...b.info.enclosure.window);
    if (g > 0.02) for (const level of b.info.enclosure?.interior ?? []) open[level] = true;
    // Ghosted shells stop casting shadows, or the subject inside stays in their shade.
    const cast = g < 0.5;
    for (const mesh of b.meshes) {
      const want = cast && (baseCastOf.get(mesh) ?? mesh.castShadow);
      if (mesh.castShadow !== want) {
        mesh.castShadow = want;
        castChanged = true;
      }
    }
  }

  EXPLORE_GLOBAL_UNIFORMS.uExploreDim.value = dim.value;
  for (const level of Object.keys(interiorOverride) as InteriorLevel[]) interiorOverride[level] = open[level] ?? false;
  if (castChanged) requestShadowUpdate();
  dirty = moving;
}

/** Current (eased) ghost of a component: picking ignores ghosted shells. */
export const ghostOf = (id: ComponentId) => bindings.get(id)?.ghost.value ?? 0;

// ---- Label anchors -------------------------------------------------------------------------------------

const anchors = new Map<ComponentId, Vector3>();
const _box = new Box3();
const _meshBox = new Box3();

/** World-space anchor for a component's label: the centre of it and its parts (cached). */
export function anchorOf(id: ComponentId): Vector3 | null {
  const cached = anchors.get(id);
  if (cached) return cached;
  _box.makeEmpty();
  for (const part of highlightSet(id)) {
    for (const mesh of bindings.get(part)?.meshes ?? []) {
      const instanced = mesh as Mesh & { isInstancedMesh?: boolean; computeBoundingBox(): void; boundingBox: Box3 | null };
      if (instanced.isInstancedMesh) {
        if (!instanced.boundingBox) instanced.computeBoundingBox();
        _meshBox.copy(instanced.boundingBox!);
      } else {
        if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
        _meshBox.copy(mesh.geometry.boundingBox!);
      }
      mesh.updateWorldMatrix(true, false);
      _box.union(_meshBox.applyMatrix4(mesh.matrixWorld));
    }
  }
  if (_box.isEmpty()) return null;
  const anchor = _box.getCenter(new Vector3());
  anchors.set(id, anchor);
  return anchor;
}
