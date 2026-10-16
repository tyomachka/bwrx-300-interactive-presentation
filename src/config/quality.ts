/**
 * The single source of truth for rendering quality (PROJECT.md §19).
 *
 * Rule: components read *fields* of the active preset (`preset.shadows`,
 * `preset.envResolution`, ...). They never branch on the level name, so adding a
 * `medium` preset later means adding one object here and nothing else.
 */
import type { GpuCapabilities } from '../utils/webgl';

export type QualityLevel = 'high' | 'low';

export interface QualityPreset {
  level: QualityLevel;
  label: string;
  /** Upper bound for the canvas pixel ratio; the device ratio is used when lower. */
  maxPixelRatio: number;
  /**
   * Stage 11 internal-resolution guard: the most pixels the canvas may render (drawing-buffer
   * width x height). Above it the pixel ratio drops and the browser upscales, so a 4K monitor or
   * high Windows scaling never multiplies the cost. A 1920x1080 window is below both caps.
   */
  maxRenderPixels: number;
  /** MSAA. Fixed at context creation, so a quality change remounts the canvas. */
  antialias: boolean;
  /** Realtime shadow map from the key light. */
  shadows: boolean;
  shadowMapSize: number;
  /** PCF filter radius in shadow-map texels. */
  shadowRadius: number;
  /** One-off baked contact shadow: cheap grounding when realtime shadows are off. */
  contactShadows: boolean;
  contactShadowResolution: number;
  /** Cube-map resolution of the procedural studio environment (rendered once). */
  envResolution: number;
  /** Reserved for Stage 7 flow/particle systems. */
  particlesMultiplier: number;
  /** Reserved for Stage 3+: post-processing stack and bloom. Off in Stage 1. */
  postprocessing: boolean;
  bloom: boolean;
  /** Geometry detail requested from procedural builders (radial segments etc.). */
  geometryLod: 'low' | 'high';
  /**
   * Reveal cut surfaces: earth strata detail. Clip edges are antialiased (alpha-to-coverage)
   * only when `antialias` is on. Story, timing and camera never depend on the preset.
   */
  sectionCapDetail: boolean;
}

export const QUALITY_PRESETS: Record<QualityLevel, QualityPreset> = {
  high: {
    level: 'high',
    label: 'High',
    maxPixelRatio: 1.75,
    maxRenderPixels: 2560 * 1440,
    antialias: true,
    shadows: true,
    shadowMapSize: 2048,
    shadowRadius: 3,
    contactShadows: false,
    contactShadowResolution: 512,
    envResolution: 256,
    particlesMultiplier: 1,
    postprocessing: false,
    bloom: false,
    geometryLod: 'high',
    sectionCapDetail: true,
  },
  low: {
    level: 'low',
    label: 'Low',
    /**
     * Windows scaling may raise Low's ratio, but only up to its 1920x1080 budget: a 1080p screen
     * at 125-200 % renders native 1920x1080 (the validated cost), not 1536x864 / 1280x720.
     */
    maxPixelRatio: 2,
    maxRenderPixels: 1920 * 1080,
    antialias: false,
    shadows: false,
    shadowMapSize: 0,
    shadowRadius: 0,
    contactShadows: true,
    contactShadowResolution: 256,
    envResolution: 64,
    particlesMultiplier: 0.35,
    postprocessing: false,
    bloom: false,
    geometryLod: 'low',
    sectionCapDetail: false,
  },
};

/**
 * Radial segments for a full circle of large round structures (a half-section gets half).
 * Even the low count keeps a 37 m cylinder's silhouette smooth at presentation distance.
 */
export const RADIAL_SEGMENTS: Record<QualityPreset['geometryLod'], number> = { high: 96, low: 48 };

export const QUALITY_QUERY_PARAM = 'quality';

/**
 * Optional render scale for a slow presentation PC: `?scale=0.8` renders 80 % of the pixels in
 * each direction and lets the browser upscale (both presets are fill-bound on integrated GPUs).
 * Default 1; clamped to 0.5..1. Never used by the deterministic 1080p export.
 */
export const RENDER_SCALE_QUERY_PARAM = 'scale';

export function resolveRenderScale(search: string): number {
  const value = Number(new URLSearchParams(search).get(RENDER_SCALE_QUERY_PARAM));
  return Number.isFinite(value) && value > 0 ? Math.min(1, Math.max(0.5, value)) : 1;
}

/**
 * The canvas pixel ratio: the device ratio, capped by the preset, times the render scale, then
 * lowered further if the drawing buffer would exceed the preset's pixel budget.
 */
export function canvasPixelRatio(preset: QualityPreset, cssWidth: number, cssHeight: number, deviceRatio: number, renderScale: number): number {
  const ratio = Math.min(deviceRatio, preset.maxPixelRatio) * renderScale;
  const cssPixels = Math.max(1, cssWidth * cssHeight);
  return Math.min(ratio, Math.sqrt(preset.maxRenderPixels / cssPixels));
}

export function isQualityLevel(value: unknown): value is QualityLevel {
  return value === 'high' || value === 'low';
}

export interface InitialQuality {
  level: QualityLevel;
  reason: 'query' | 'software-renderer' | 'default';
}

/** `?quality=low|high` wins; otherwise a CPU rasteriser starts in low; otherwise high. */
export function resolveInitialQuality(search: string, caps: GpuCapabilities): InitialQuality {
  const requested = new URLSearchParams(search).get(QUALITY_QUERY_PARAM);
  if (isQualityLevel(requested)) return { level: requested, reason: 'query' };
  if (caps.softwareRenderer) return { level: 'low', reason: 'software-renderer' };
  return { level: 'high', reason: 'default' };
}

/** Keep the URL in sync so a reload (or a bookmarked link) preserves the choice. */
export function writeQualityToUrl(level: QualityLevel): void {
  const url = new URL(window.location.href);
  url.searchParams.set(QUALITY_QUERY_PARAM, level);
  window.history.replaceState(window.history.state, '', url);
}
