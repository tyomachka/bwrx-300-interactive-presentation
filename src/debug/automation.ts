/**
 * Automation hooks for review captures and measurements (dev builds and `?debug` only;
 * loaded lazily, never part of the main bundle). A headless browser drives the hero shot
 * deterministically with these, e.g. `__bwrx.shot.seek(5.8)` for a review still, or plays it
 * in real time while sampling `__bwrx.frame` for frame timing and draw calls.
 */
import { heroReveal } from '../animation/heroReveal';
import { heroShot } from '../animation/heroShot';
import { showRpvReviewById } from '../animation/rpvReview';
import { setBladeInsertion, type BladePattern } from '../scene/rpv/coreLayout';
import { RPV_REVIEW_STATES } from '../config/rpvReview';
import type { CameraPose, RpvReviewPoseId } from '../config/camera';
import { animationClock } from '../animation/clock';
import { cameraDirector } from '../camera/cameraDirector';
import { diagnosticsSample } from './diagnostics';

const api = {
  shot: {
    play: () => heroShot.play(),
    seek: (t: number) => heroShot.seek(t),
    togglePause: () => heroShot.togglePause(),
    stop: () => heroShot.stop(),
    get time() {
      return heroShot.time;
    },
    get status() {
      return heroShot.status;
    },
    duration: heroShot.duration,
  },
  reveal: heroReveal as Readonly<typeof heroReveal>,
  /** Stage 4 vessel review states; `immediate` jumps (deterministic captures). */
  rpvReview: {
    ids: RPV_REVIEW_STATES.map((s) => s.id),
    show: (id: RpvReviewPoseId, immediate = true) => showRpvReviewById(id, { immediate }),
    setBlades: (pattern: BladePattern) => setBladeInsertion(pattern),
  },
  camera: () => ({ ...cameraDirector.getPose(), authority: cameraDirector.authority }),
  /** Jump the camera to an explicit pose (scripted review captures). */
  snapCamera: (pose: CameraPose) => cameraDirector.snapTo(pose),
  clock: animationClock,
  frame: diagnosticsSample as Readonly<typeof diagnosticsSample>,
};

declare global {
  interface Window {
    __bwrx?: typeof api;
  }
}

export function installAutomationApi(): void {
  window.__bwrx = api;
}
