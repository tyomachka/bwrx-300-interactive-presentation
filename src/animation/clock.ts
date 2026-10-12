/**
 * The one animation clock for everything time-based in the scene.
 *
 * GSAP normally ticks itself from its own requestAnimationFrame. Here it is unhooked and
 * advanced from inside the R3F frame loop instead, which gives us:
 *  - no frame of lag between a GSAP-driven camera pose and the frame that renders it;
 *  - one time source for camera tweens, shader uniforms and flow animation;
 *  - deterministic stepping: with `fixedStep` set (e.g. 1/30 for H.264 export, Stage 12)
 *    every frame advances by exactly that amount regardless of real render speed.
 */
import gsap from 'gsap';

gsap.ticker.remove(gsap.updateRoot);
gsap.ticker.lagSmoothing(0);

/** Longest realtime step we accept, so a backgrounded tab does not jump tweens to the end. */
const MAX_REALTIME_STEP = 1 / 15;

export const animationClock = {
  /** Seconds of animation time since the page loaded. */
  time: 0,
  /** When set, each frame advances by exactly this many seconds (offline/video rendering). */
  fixedStep: null as number | null,
  /** The step of the current frame (seconds): per-frame easing uses it to stay deterministic. */
  lastStep: 0,

  /** Called once per rendered frame, before scene `useFrame` work. */
  advance(realDelta: number): number {
    const step = this.fixedStep ?? Math.min(Math.max(realDelta, 0), MAX_REALTIME_STEP);
    this.time += step;
    this.lastStep = step;
    gsap.updateRoot(this.time);
    return step;
  },
};
