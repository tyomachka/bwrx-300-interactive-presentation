/**
 * Presentation-level actions shared by keyboard shortcuts, the setup controls and the debug
 * panel. Kept apart from the shot and the review states so neither has to import the other.
 */
import { cameraDirector } from '../camera/cameraDirector';
import { CAMERA_TRANSITION } from '../config/camera';
import { heroShot } from './heroShot';
import { endRpvReview } from './rpvReview';

/** "Reset view": stop the shot or review, close the reveal, fly home. Deterministic from any state. */
export function resetPresentation(): Promise<void> {
  heroShot.stop();
  endRpvReview();
  heroShot.closeReveal(CAMERA_TRANSITION.duration);
  return cameraDirector.reset();
}
