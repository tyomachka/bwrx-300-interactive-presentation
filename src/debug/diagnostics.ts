/**
 * Shared, mutable diagnostics sample. The in-canvas FrameProbe writes it every frame;
 * the DOM overlay reads it a few times per second. No React state, so measuring the
 * frame rate never costs a re-render.
 */
import type { Scene, WebGLRenderer } from 'three';

export const diagnosticsSample = {
  /** The live renderer, for automation checks (program info logs, info counters). */
  renderer: null as WebGLRenderer | null,
  /** The live scene, for automation checks (finding components by semantic ID). */
  scene: null as Scene | null,
  fps: 0,
  /** Mean and worst interval between presented frames over the last window (ms). */
  frameAvgMs: 0,
  frameWorstMs: 0,
  drawCalls: 0,
  triangles: 0,
  geometries: 0,
  textures: 0,
  programs: 0,
  pixelRatio: 1,
  bufferWidth: 0,
  bufferHeight: 0,
};
