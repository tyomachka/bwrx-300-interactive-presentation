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
}

export const QUALITY_PRESETS: Record<QualityLevel, QualityPreset> = {
  high: {
    level: 'high',
    label: 'High',
    maxPixelRatio: 1.75,
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
  },
  low: {
    level: 'low',
    label: 'Low',
    maxPixelRatio: 1,
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
  },
};

/**
 * Radial segments for a full circle of large round structures (a half-section gets half).
 * Even the low count keeps a 37 m cylinder's silhouette smooth at presentation distance.
 */
export const RADIAL_SEGMENTS: Record<QualityPreset['geometryLod'], number> = { high: 96, low: 48 };

export const QUALITY_QUERY_PARAM = 'quality';

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
