import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import { diagnosticsSample as sample } from './diagnostics';

/** Averaging window for frame timing (ms). */
const WINDOW_MS = 500;

/**
 * Samples frame pacing and renderer statistics. `gl.info` is reset at the start of each
 * render, so reading it before this frame's render reports the previous, complete frame.
 */
export default function FrameProbe() {
  const gl = useThree((s) => s.gl);
  const timing = useRef({ last: 0, windowStart: 0, frames: 0, sum: 0, worst: 0 });

  useFrame(() => {
    const now = performance.now();
    const t = timing.current;
    if (t.last > 0) {
      const dt = now - t.last;
      t.frames += 1;
      t.sum += dt;
      t.worst = Math.max(t.worst, dt);
    } else {
      t.windowStart = now;
    }
    t.last = now;

    if (now - t.windowStart >= WINDOW_MS && t.frames > 0) {
      sample.fps = (t.frames * 1000) / (now - t.windowStart);
      sample.frameAvgMs = t.sum / t.frames;
      sample.frameWorstMs = t.worst;
      t.windowStart = now;
      t.frames = 0;
      t.sum = 0;
      t.worst = 0;
    }

    sample.renderer = gl;
    const { render, memory, programs } = gl.info;
    sample.drawCalls = render.calls;
    sample.triangles = render.triangles;
    sample.geometries = memory.geometries;
    sample.textures = memory.textures;
    sample.programs = programs?.length ?? 0;
    sample.pixelRatio = gl.getPixelRatio();
    sample.bufferWidth = gl.domElement.width;
    sample.bufferHeight = gl.domElement.height;
  }, -99);

  return null;
}
