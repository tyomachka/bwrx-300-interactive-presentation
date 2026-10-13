/**
 * Presentation-level actions shared by keyboard shortcuts, the setup controls and the debug
 * panel. Kept apart from the shot and the review states so neither has to import the other.
 */
import { cameraDirector } from '../camera/cameraDirector';
import { CAMERA_TRANSITION, ORBIT } from '../config/camera';
import { resetExplore } from '../interaction/exploreActions';
import { heroShot } from './heroShot';
import { masterSequence } from './masterSequence';
import { snapControlToBase } from './reactorControl';

/**
 * A reset from below grade first backs the camera out to this distance from what it was
 * looking at (m): outside the containment (r 9.5 m), in the opened excavation, clear of every
 * wall, before it turns and climbs towards the home view.
 */
const RESET_EXIT_RADIUS = 25;
import { endRpvReview } from './rpvReview';

/**
 * "Reset view": stop the shot or review, clear every Explore state (selection, hover, X-ray,
 * section, isolation, labels, flow, control), put the blades back to the base pattern at once,
 * close the reveal, fly home. Deterministic from any state.
 */
export function resetPresentation(): Promise<void> {
  // From below grade (an Explore focus inside the plant) the camera first leaves through the
  // open cut; the walls start closing once it is clear of them. From above grade (the Stage 3
  // end pose) the reveal closes in step with the camera, as before.
  const fromBelowGrade = cameraDirector.getPose().position[1] < ORBIT.minCameraY;
  masterSequence.stop();
  heroShot.stop();
  endRpvReview();
  resetExplore();
  snapControlToBase();
  heroShot.closeReveal(CAMERA_TRANSITION.duration, fromBelowGrade ? CAMERA_TRANSITION.duration * 0.55 : 0);
  return cameraDirector.reset(fromBelowGrade ? { exitRadius: RESET_EXIT_RADIUS } : {});
}
