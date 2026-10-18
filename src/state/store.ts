/**
 * Small global app state (zustand). Justified because keyboard handlers, the camera
 * director and DOM overlays all need it outside React's render cycle.
 *
 * Scene components never read `quality` directly: they call `useQualityPreset()` and
 * read fields from the preset (see config/quality.ts).
 */
import { create } from 'zustand';
import { EXPLORE_ONLY, HANDHELD } from '../app/entry';
import {
  QUALITY_PRESETS,
  resolveInitialQuality,
  storeHandheldQuality,
  writeQualityToUrl,
  type InitialQuality,
  type QualityLevel,
  type QualityPreset,
} from '../config/quality';
import { detectGpuCapabilities, type GpuCapabilities } from '../utils/webgl';

/** `loading` until shaders are compiled and the first frames are on screen. */
export type SceneStatus = 'loading' | 'ready' | 'context-lost' | 'error';

interface AppState {
  caps: GpuCapabilities;
  quality: QualityLevel;
  qualityReason: InitialQuality['reason'] | 'user';
  status: SceneStatus;
  /** Bumping this remounts the whole <Canvas> with a fresh WebGL context. */
  canvasKey: number;
  /** Diagnostics are compiled in for dev builds and for `?debug` in production. */
  debugAvailable: boolean;
  debugVisible: boolean;
  /** Presentation v1 debug panel (`?presentationDebug`, or T in dev / `?debug`): beat list, jumps, pose copy. */
  presentationDebug: boolean;
  /**
   * Stage 2 review aid (dev / `?debug`): hide everything in front of the z = 0 plane so the
   * below-grade shaft, containment and RPV can be inspected. Not the Stage 5 section system.
   */
  sectionReview: boolean;

  setQuality: (level: QualityLevel) => void;
  setStatus: (status: SceneStatus) => void;
  remountCanvas: () => void;
  toggleDebug: () => void;
  togglePresentationDebug: () => void;
  setSectionReview: (on: boolean) => void;
}

const caps = detectGpuCapabilities();
const initialQuality = resolveInitialQuality(window.location.search, caps, HANDHELD);
const query = new URLSearchParams(window.location.search);
const debugParam = query.has('debug');
// The talk's debug panel jumps into the talk: never on the explore-only page.
const presentationDebugParam = query.has('presentationDebug') && !EXPLORE_ONLY;

export const useAppStore = create<AppState>()((set, get) => ({
  caps,
  quality: initialQuality.level,
  qualityReason: initialQuality.reason,
  status: 'loading',
  canvasKey: 0,
  debugAvailable: import.meta.env.DEV || debugParam || presentationDebugParam,
  debugVisible: debugParam,
  presentationDebug: presentationDebugParam,
  sectionReview: false,

  setQuality: (level) => {
    if (level === get().quality) return;
    writeQualityToUrl(level);
    if (HANDHELD) storeHandheldQuality(level);
    // A preset change may alter context attributes (MSAA), so the canvas is rebuilt.
    set((s) => ({ quality: level, qualityReason: 'user', status: 'loading', canvasKey: s.canvasKey + 1 }));
  },
  setStatus: (status) => set({ status }),
  remountCanvas: () => set((s) => ({ status: 'loading', canvasKey: s.canvasKey + 1 })),
  toggleDebug: () => {
    if (get().debugAvailable) set((s) => ({ debugVisible: !s.debugVisible }));
  },
  togglePresentationDebug: () => {
    if (get().debugAvailable && !EXPLORE_ONLY) set((s) => ({ presentationDebug: !s.presentationDebug }));
  },
  setSectionReview: (on) => set({ sectionReview: on }),
}));

export function useQualityPreset(): QualityPreset {
  return QUALITY_PRESETS[useAppStore((s) => s.quality)];
}
