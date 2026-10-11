import { REVIEW_VIEWS, type ReviewView } from '../config/reviewViews';
import { useAppStore } from '../state/store';
import { cameraDirector } from './cameraDirector';

let current = -1;

/** Apply a review view: its section-review presentation, then a smooth camera move. */
export function showReviewView(view: ReviewView): Promise<void> {
  current = REVIEW_VIEWS.indexOf(view);
  useAppStore.getState().setSectionReview(view.sectionReview);
  return cameraDirector.transitionTo(view.camera);
}

export function cycleReviewView(): Promise<void> {
  const next = REVIEW_VIEWS[(current + 1) % REVIEW_VIEWS.length];
  return next ? showReviewView(next) : Promise.resolve();
}
