/**
 * Shared plant materials: one instance per surface type, so dozens of meshes reuse a
 * handful of shader programs.
 *
 * Palette rule (PROJECT.md §17, Stage 1 approval): concrete, dark coated metal, matte steel,
 * restrained glazing. Materials are distinguished by value and roughness, not hue. The warm
 * accent stays reserved: here it appears only as dim "practical" glazing light and as the
 * grade datum line in section review.
 *
 * Later stages that need per-component variants (highlight, X-ray) should clone rather than
 * mutate these, because they are shared.
 */
import {
  CanvasTexture,
  Color,
  DoubleSide,
  MeshStandardMaterial,
  RepeatWrapping,
  SRGBColorSpace,
  type Texture,
} from 'three';
import { FLOOR_RADIUS, PALETTE } from '../../config/render';
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

/** Subtle horizontal strata for the earth cut face, so "below grade" reads at a glance. */
function strataTexture(): Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 4;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const bands = ['#484644', '#444240', '#4a4846', '#42403e', '#474543', '#41403e'];
    const h = canvas.height / bands.length;
    bands.forEach((color, i) => {
      ctx.fillStyle = color;
      ctx.fillRect(0, i * h, canvas.width, h + 1);
    });
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.repeat.set(1 / 50, 1 / 30); // one full strata cycle every 30 m of depth
  return texture;
}

function createPlantMaterials() {
  const std = (params: ConstructorParameters<typeof MeshStandardMaterial>[0]) => new MeshStandardMaterial(params);
  const lightPool = lightPoolTexture();
  return {
    /** Ground surface at grade: shared by the studio floor and the site block top. */
    groundSurface: std({ color: PALETTE.ground, map: lightPool, roughness: 0.95, metalness: 0, envMapIntensity: 0.3 }),
    earth: std({ color: '#ffffff', map: strataTexture(), roughness: 1, metalness: 0, envMapIntensity: 0.25 }),
    /** Paved power-block apron: same light pool as the ground, a step lighter. */
    apron: std({ color: '#383b3e', map: lightPool, roughness: 0.88, metalness: 0, envMapIntensity: 0.3 }),
    /** Reactor building superstructure: pale architectural concrete. */
    rbCladding: std({ color: '#8b8f93', roughness: 0.78, metalness: 0.05 }),
    rbBand: std({ color: '#666b70', roughness: 0.7, metalness: 0.15 }),
    rbRoof: std({ color: '#6c7176', roughness: 0.55, metalness: 0.45, flatShading: true, side: DoubleSide }),
    /** Below-grade concrete: shaft, basemat, floors. */
    concrete: std({ color: PALETTE.concrete, roughness: 0.9, metalness: 0 }),
    concreteDark: std({ color: '#5a5d61', roughness: 0.92, metalness: 0 }),
    /** Steel-plate composite containment: steel-faced, quieter than the RPV. */
    containment: std({ color: '#7a7f84', roughness: 0.58, metalness: 0.4 }),
    containmentHead: std({ color: '#8d9297', roughness: 0.5, metalness: 0.55, side: DoubleSide }),
    /** Matte industrial steel (approved Stage 1 look): RPV, piping, turbine casings. */
    steel: std({ color: PALETTE.steel, roughness: 0.48, metalness: 0.6 }),
    /** Dark coated metal cladding for the turbine hall. */
    darkMetal: std({ color: '#454c54', roughness: 0.55, metalness: 0.3 }),
    fin: std({ color: '#59616a', roughness: 0.5, metalness: 0.35 }),
    roofMembrane: std({ color: '#33363a', roughness: 0.85, metalness: 0.1 }),
    glass: std({ color: '#141a1f', roughness: 0.12, metalness: 0.85 }),
    /** Glazing with a barely-there warm interior glow: the only "practical light" in the scene. */
    glazingLit: std({ color: '#1d2126', roughness: 0.15, metalness: 0.7, emissive: new Color('#ffd2a0'), emissiveIntensity: 0.025 }),
    doorPanel: std({ color: '#1b1e22', roughness: 0.7, metalness: 0.3 }),
    supportCladding: std({ color: '#62676d', roughness: 0.82, metalness: 0.08 }),
    paintedEquipment: std({ color: PALETTE.paintedEquipment, roughness: 0.72, metalness: 0.1 }),
    water: std({ color: '#35505b', roughness: 0.22, metalness: 0, envMapIntensity: 1.1 }),
    vehicle: std({ color: '#8f9398', roughness: 0.55, metalness: 0.2 }),
    human: std({ color: '#c9ccd0', roughness: 0.7, metalness: 0 }),
    /** Grade datum line in section review: the project accent, used sparingly. */
    gradeLine: std({ color: PALETTE.accent, emissive: new Color(PALETTE.accent), emissiveIntensity: 0.7, roughness: 0.4 }),
  };
}

export type PlantMaterials = ReturnType<typeof createPlantMaterials>;

let cache: PlantMaterials | null = null;

/** Lazily created once per page; three re-uploads them automatically after a canvas remount. */
export function getPlantMaterials(): PlantMaterials {
  cache ??= createPlantMaterials();
  return cache;
}
