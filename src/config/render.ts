/**
 * Renderer, colour and world constants shared by the scene.
 *
 * World units: 1 unit = 1 metre. Later procedural builders rely on this so official
 * dimensions (e.g. RPV ~4 m ID x ~27 m inside height) can be entered directly.
 */
import { NeutralToneMapping, SRGBColorSpace } from 'three';

export const RENDER = {
  /** Khronos PBR Neutral keeps base colours faithful: steel stays grey, the accent stays on-brand. */
  toneMapping: NeutralToneMapping,
  toneMappingExposure: 1.0,
  outputColorSpace: SRGBColorSpace,
  /** Needed later for X-ray / cutaway clipping planes (PROJECT.md §10). */
  localClippingEnabled: true,
  /** Kept in the context so clip-plane section caps can be drawn with stencil later. */
  stencil: true,
  powerPreference: 'high-performance' as WebGLPowerPreference,
  /**
   * three's synchronous shader diagnostics. On in dev (custom shaders arrive in Stage 3+);
   * off in production, where it only adds GPU stalls during shader compilation.
   */
  checkShaderErrors: import.meta.env.DEV,
} as const;

/** Dark neutral palette (PROJECT.md §5, §17). */
export const PALETTE = {
  background: '#0b0c0e',
  /** Ground colour at the centre of the light pool; it falls off to black (plant/materials). */
  ground: '#2c2f32',
  concrete: '#74777a',
  steel: '#a3a8ad',
  paintedEquipment: '#4a5866',
  /** The one project-wide highlight accent. Used sparingly. */
  accent: '#e8a33d',
} as const;

/**
 * Linear fog that dissolves the ground into the background, so no horizon edge shows.
 * Starts beyond the power block as seen from the hero camera (~250 m away).
 */
export const FOG = { near: 300, far: 820 } as const;

/** Radius of the studio floor disc around the site (m); its edge sits deep in the fog. */
export const FLOOR_RADIUS = 1000;

/**
 * Key light position (Stage 1 direction, pushed out to clear the site). Shared by the lighting rig
 * and the section shader, so cut surfaces are lit from the same direction as everything else.
 */
export const KEY_LIGHT_POSITION: [number, number, number] = [150, 235, 115];
