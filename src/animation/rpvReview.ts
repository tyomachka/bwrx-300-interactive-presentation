/**
 * Applies the Stage 4 vessel review states (config/rpvReview.ts): the reveal tweens to the
 * state's values while the camera moves to its pose, both over the standard transition, or
 * both jump at once (`immediate`, for deterministic review captures).
 *
 * Review cameras stand below grade inside the opened plant, so Explore may follow them there
 * while a review state is active (the hero shot, the Stage 2 views and reset restore the floor).
 */
import gsap from 'gsap';
// Side effect: GSAP must be ticked by our frame loop before any tween is created.
import './clock';
import { cameraDirector } from '../camera/cameraDirector';
import { CAMERA_TRANSITION } from '../config/camera';
import { RPV_REVIEW_STATES, type RpvReviewState } from '../config/rpvReview';
import { setBladeInsertion } from '../scene/rpv/coreLayout';
import { useAppStore } from '../state/store';
import { heroReveal } from './heroReveal';
import { heroShot } from './heroShot';

let current = -1;
let tween: gsap.core.Tween | null = null;

export function showRpvReview(state: RpvReviewState, options: { immediate?: boolean } = {}): Promise<void> {
  current = RPV_REVIEW_STATES.indexOf(state);
  heroShot.stop();
  heroShot.cancelClose();
  useAppStore.getState().setSectionReview(false);
  cameraDirector.allowBelowGrade = true;
  setBladeInsertion(state.blades);
  tween?.kill();
  tween = null;
  if (options.immediate) {
    Object.assign(heroReveal, state.reveal);
    cameraDirector.snapTo(state.id);
    return Promise.resolve();
  }
  tween = gsap.to(heroReveal, { ...state.reveal, duration: CAMERA_TRANSITION.duration, ease: CAMERA_TRANSITION.ease });
  return cameraDirector.transitionTo(state.id);
}

export function showRpvReviewById(id: RpvReviewState['id'], options?: { immediate?: boolean }): Promise<void> {
  const state = RPV_REVIEW_STATES.find((s) => s.id === id);
  return state ? showRpvReview(state, options) : Promise.resolve();
}

export function cycleRpvReview(): Promise<void> {
  const next = RPV_REVIEW_STATES[(current + 1) % RPV_REVIEW_STATES.length];
  return next ? showRpvReview(next) : Promise.resolve();
}

/** Leave review: stop its reveal tween and put the camera floor back (reset does this). */
export function endRpvReview(): void {
  tween?.kill();
  tween = null;
  current = -1;
  cameraDirector.allowBelowGrade = false;
}
