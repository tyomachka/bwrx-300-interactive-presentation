/**
 * Plant materials: one instance per surface type, so dozens of meshes reuse a handful of
 * shader programs.
 *
 * Palette rule (PROJECT.md §17, Stage 1 approval): concrete, dark coated metal, matte steel,
 * restrained glazing. Materials are distinguished by value and roughness, not hue. The warm
 * accent stays reserved: here it appears only as dim "practical" glazing light, and as the
 * grade datum drawn on cut surfaces.
 *
 * Two sets:
 *  - `getPlantMaterials()`: shared context materials. Their only reveal behaviour is the
 *    exterior dim.
 *  - `getSectionMaterials()`: the structures the hero reveal opens, one set per reveal layer
 *    (scene/section/sectionLayers.ts). They are clipped by their layer's section box and shade
 *    their own cut surfaces. They look identical to the context materials until cut.
 *
 * Both are shared: later per-component variants (highlight, X-ray) should clone, not mutate.
 */
import {
  BackSide,
  CanvasTexture,
  Color,
  DoubleSide,
  MeshStandardMaterial,
  SRGBColorSpace,
  type Material,
  type MeshStandardMaterialParameters,
  type Texture,
} from 'three';
import { FLOOR_RADIUS, PALETTE } from '../../config/render';
import { LAYER_CLIP, LAYER_UNIFORMS, SECTION_GLOBAL_UNIFORMS, SECTION_PLANES, type RevealLayerId } from '../section/sectionLayers';
import { REVEAL_DRAW_RANK } from '../section/drawOrder';
import { createCapUniforms, installSectionShader, type CapStyle, type ExploreUniforms, type SectionUniformMap } from '../section/sectionShader';
import { SITE } from './dimensions';

function lightPoolTexture(): Texture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const scale = size / (FLOOR_RADIUS * 2);
    const cx = size / 2 + SITE.lightPoolCenter[0] * scale;
    // uv = (x, -z) and flipY maps v back to canvas rows, so canvas y grows with world +z.
    const cy = size / 2 + SITE.lightPoolCenter[1] * scale;
    const r = SITE.lightPoolRadius * scale;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, size, size);
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.5, '#9a9a9a');
    g.addColorStop(1, '#000000');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  // Ground UVs are world metres (shape coordinates); map [-R, R] onto [0, 1].
  const k = 1 / (FLOOR_RADIUS * 2);
  texture.repeat.set(k, k);
  texture.offset.set(0.5, 0.5);
  return texture;
}

let lightPool: Texture | null = null;
const getLightPool = () => (lightPool ??= lightPoolTexture());

// ---- Surface definitions (shared by both sets) ------------------------------------------

const SURFACES = {
  /** Ground surface at grade: studio floor and site block top share it (and its light pool). */
  groundSurface: { color: PALETTE.ground, roughness: 0.95, metalness: 0, envMapIntensity: 0.3 },
  earth: { color: '#47423e', roughness: 1, metalness: 0, envMapIntensity: 0.25 },
  /** Paved power-block apron: same light pool as the ground, a step lighter. */
  apron: { color: '#383b3e', roughness: 0.88, metalness: 0, envMapIntensity: 0.3 },
  /** Reactor building superstructure: pale architectural concrete. */
  rbCladding: { color: '#8b8f93', roughness: 0.78, metalness: 0.05 },
  rbBand: { color: '#666b70', roughness: 0.7, metalness: 0.15 },
  rbRoof: { color: '#6c7176', roughness: 0.55, metalness: 0.45, flatShading: true, side: DoubleSide },
  /** Below-grade concrete: shaft, basemat, floors. */
  concrete: { color: PALETTE.concrete, roughness: 0.9, metalness: 0 },
  concreteDark: { color: '#5a5d61', roughness: 0.92, metalness: 0 },
  /** Steel-plate composite containment: steel-faced, quieter than the RPV. */
  containment: { color: '#7a7f84', roughness: 0.58, metalness: 0.4 },
  containmentHead: { color: '#6e747a', roughness: 0.55, metalness: 0.45, side: DoubleSide },
  /** Matte industrial steel (approved Stage 1 look): RPV, piping, turbine casings. */
  steel: { color: PALETTE.steel, roughness: 0.48, metalness: 0.6 },
  doorPanel: { color: '#1b1e22', roughness: 0.7, metalness: 0.3 },
  /** RPV internals (Stage 4): one steel family, told apart by value, never by hue. The fuel is
   *  the lightest block (warm Zircaloy grey), the chimney a dark barrel, the blades dark steel. */
  stainless: { color: '#959ba1', roughness: 0.45, metalness: 0.55 },
  chimney: { color: '#5d6269', roughness: 0.55, metalness: 0.45 },
  supportSteel: { color: '#6b7076', roughness: 0.6, metalness: 0.4 },
  dryer: { color: '#96938b', roughness: 0.5, metalness: 0.45 },
  fuelChannel: { color: '#b9b4a7', roughness: 0.42, metalness: 0.35 },
  blade: { color: '#4b5158', roughness: 0.38, metalness: 0.65 },
  driveMotor: { color: '#3b4147', roughness: 0.65, metalness: 0.3 },
  water: { color: '#35505b', roughness: 0.22, metalness: 0, envMapIntensity: 1.1 },
  human: { color: '#c9ccd0', roughness: 0.7, metalness: 0 },
} satisfies Record<string, MeshStandardMaterialParameters>;

// ---- Shader uniform bookkeeping ---------------------------------------------------------------

/** The section-shader uniforms each material was built with (userData would be JSON-copied). */
const SHADER_UNIFORMS = new WeakMap<MeshStandardMaterial, SectionUniformMap>();

/** Built by this module with the section shader (so it can be cloned per component). */
export function hasSectionShader(material: Material): material is MeshStandardMaterial {
  return SHADER_UNIFORMS.has(material as MeshStandardMaterial);
}

function install(material: MeshStandardMaterial, uniforms: SectionUniformMap): void {
  SHADER_UNIFORMS.set(material, uniforms);
  installSectionShader(material, uniforms);
}

/**
 * A per-component copy of a shared material (Explore mode, Stage 5): same parameters, same
 * shader source and so the same compiled program, but its own explore uniforms. The layer,
 * global and cut-surface uniforms stay shared, and so do the live section planes.
 */
export function cloneForComponent(base: MeshStandardMaterial, explore: ExploreUniforms): MeshStandardMaterial {
  const clone = base.clone();
  clone.name = base.name;
  clone.defines = { ...base.defines }; // MeshStandardMaterial.copy resets the defines
  clone.clippingPlanes = base.clippingPlanes; // Material.copy clones the planes: share the live ones
  clone.userData = { ...base.userData };
  install(clone, { ...SHADER_UNIFORMS.get(base), ...explore });
  return clone;
}

/**
 * Per-mesh bound copies of material variants a component swaps between at runtime (the fuel's
 * plain / capped pair). Explore registers them when it binds; the owner looks its variant up.
 */
const boundVariants = new WeakMap<object, Map<Material, Material>>();

export function setBoundVariants(mesh: object, variants: Map<Material, Material>): void {
  boundVariants.set(mesh, variants);
}

export function boundVariant(mesh: object, base: Material): Material {
  return boundVariants.get(mesh)?.get(base) ?? base;
}

// ---- Context materials --------------------------------------------------------------------

/** A context material: standard PBR plus the exterior dim. */
function context(params: MeshStandardMaterialParameters): MeshStandardMaterial {
  const material = new MeshStandardMaterial(params);
  material.userData.revealRank = REVEAL_DRAW_RANK.exterior;
  install(material, { ...LAYER_UNIFORMS.exterior });
  return material;
}

function createPlantMaterials() {
  return {
    groundSurface: context({ ...SURFACES.groundSurface, map: getLightPool() }),
    concreteDark: context(SURFACES.concreteDark),
    steel: context(SURFACES.steel),
    /** Dark coated metal cladding for the turbine hall. */
    darkMetal: context({ color: '#454c54', roughness: 0.55, metalness: 0.3 }),
    fin: context({ color: '#59616a', roughness: 0.5, metalness: 0.35 }),
    roofMembrane: context({ color: '#33363a', roughness: 0.85, metalness: 0.1 }),
    glass: context({ color: '#141a1f', roughness: 0.12, metalness: 0.85 }),
    /** Glazing with a barely-there warm interior glow: the only "practical light" in the scene. */
    glazingLit: context({ color: '#1d2126', roughness: 0.15, metalness: 0.7, emissive: new Color('#ffd2a0'), emissiveIntensity: 0.025 }),
    doorPanel: context(SURFACES.doorPanel),
    supportCladding: context({ color: '#62676d', roughness: 0.82, metalness: 0.08 }),
    paintedEquipment: context({ color: PALETTE.paintedEquipment, roughness: 0.72, metalness: 0.1 }),
    vehicle: context({ color: '#8f9398', roughness: 0.55, metalness: 0.2 }),
    human: context(SURFACES.human),
  };
}

export type PlantMaterials = ReturnType<typeof createPlantMaterials>;

let plantCache: PlantMaterials | null = null;

/** Lazily created once per page; three re-uploads them automatically after a canvas remount. */
export function getPlantMaterials(): PlantMaterials {
  plantCache ??= createPlantMaterials();
  return plantCache;
}

// ---- Section materials -----------------------------------------------------------------

/** Cut-surface looks. The earth reads as earth; concrete as a light section poché. */
const CAPS = {
  earth: { color: '#615b55', strata: 1, datum: true, depthFade: 0.6, radialFade: 0.42 },
  concrete: { color: '#857f78', datum: true, depthFade: 0.22 },
  containment: { color: '#6b747c', depthFade: 0.15 },
  water: { color: '#2d4852' },
  door: { color: '#3a3d41' },
  human: { color: '#c9ccd0' },
  /** Vessel and internals: cut steel reads as a slightly darker, flat-lit section. */
  vesselSteel: { color: '#8b9095' },
  stainless: { color: '#7f858b' },
  chimney: { color: '#686d73' },
  supportSteel: { color: '#62676d' },
  dryer: { color: '#847f77' },
  fuel: { color: '#a29d91' },
  blade: { color: '#5a6067' },
  driveMotor: { color: '#3b4147' },
} satisfies Record<string, CapStyle>;

/**
 * A material of a reveal layer. Sectioned layers clip with their layer's box; closed solids
 * (`cap`) shade their own cut, thin shells (`cap: null`) just show their inside.
 */
function section(layer: RevealLayerId, params: MeshStandardMaterialParameters, cap: CapStyle | null): MeshStandardMaterial {
  const material = new MeshStandardMaterial(params);
  const uniforms: SectionUniformMap = { ...LAYER_UNIFORMS[layer], ...SECTION_GLOBAL_UNIFORMS };
  material.userData.revealRank = REVEAL_DRAW_RANK[layer];
  material.defines = { SECTION_LAYER: '' };
  if (layer !== 'exterior') {
    material.clippingPlanes = SECTION_PLANES[LAYER_CLIP[layer]];
    material.clipIntersection = true;
    material.clipShadows = true;
    if (cap) {
      material.side = DoubleSide;
      material.shadowSide = BackSide; // cast like an ordinary closed solid
      material.defines.SECTION_CAP = '';
      Object.assign(uniforms, createCapUniforms(cap));
    }
  }
  install(material, uniforms);
  return material;
}

/** A region proxy: picked like a part, drawn only while its component is selected. */
function regionHighlight(material: MeshStandardMaterial): MeshStandardMaterial {
  material.visible = false;
  return material;
}

function createSectionMaterials() {
  return {
    ground: {
      surface: section('ground', { ...SURFACES.groundSurface, map: getLightPool() }, CAPS.earth),
      earth: section('ground', SURFACES.earth, CAPS.earth),
      apron: section('ground', { ...SURFACES.apron, map: getLightPool() }, CAPS.earth),
      human: section('ground', SURFACES.human, CAPS.human),
    },
    building: {
      cladding: section('building', SURFACES.rbCladding, CAPS.concrete),
      band: section('building', SURFACES.rbBand, CAPS.concrete),
      roof: section('building', SURFACES.rbRoof, null),
      concrete: section('building', SURFACES.concrete, CAPS.concrete),
      concreteDark: section('building', SURFACES.concreteDark, CAPS.concrete),
      doorPanel: section('building', SURFACES.doorPanel, CAPS.door),
      water: section('building', SURFACES.water, CAPS.water),
    },
    containment: {
      wall: section('containment', SURFACES.containment, CAPS.containment),
      head: section('containment', SURFACES.containmentHead, null),
      concrete: section('containment', SURFACES.concreteDark, CAPS.concrete),
    },
    vessel: {
      steel: section('vessel', SURFACES.steel, CAPS.vesselSteel),
      driveMotor: section('vessel', SURFACES.driveMotor, CAPS.driveMotor),
    },
    internals: {
      stainless: section('internals', SURFACES.stainless, CAPS.stainless),
      chimney: section('internals', SURFACES.chimney, CAPS.chimney),
      supportSteel: section('internals', SURFACES.supportSteel, CAPS.supportSteel),
      dryer: section('internals', SURFACES.dryer, CAPS.dryer),
      /** The downcomer region (Stage 5): drawn only while selected, as a ghosted warm volume. */
      downcomerRegion: regionHighlight(section('internals', { color: '#5a4422', emissive: new Color(PALETTE.accent), emissiveIntensity: 0.32, roughness: 1, metalness: 0, side: DoubleSide }, null)),
    },
    fuel: {
      /** The vertical cutaway planes run between assemblies, never through one: no cut surface,
       *  front faces only (half the fill cost of the 240-assembly field). */
      channel: section('fuel', SURFACES.fuelChannel, null),
      /** For the horizontal core section, which does cut through every assembly. */
      channelCapped: section('fuel', SURFACES.fuelChannel, CAPS.fuel),
    },
    blades: {
      blade: section('blades', SURFACES.blade, CAPS.blade),
    },
  };
}

export type SectionMaterials = ReturnType<typeof createSectionMaterials>;

let sectionCache: SectionMaterials | null = null;

export function getSectionMaterials(): SectionMaterials {
  sectionCache ??= createSectionMaterials();
  return sectionCache;
}

/** Every material that clips (for per-canvas settings such as alpha-to-coverage). */
export function sectionedMaterials(): MeshStandardMaterial[] {
  const m = getSectionMaterials();
  return [m.ground, m.building, m.containment, m.vessel, m.internals, m.fuel, m.blades].flatMap((set) => Object.values(set));
}
