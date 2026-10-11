/**
 * Stage 2 review views: a camera state paired with the presentation it needs. Camera
 * poses stay pure data in config/camera.ts; this list only says which ones need the
 * temporary section review. Available in dev builds and with `?debug` (key V, or the
 * diagnostics panel).
 */
import type { CameraStateId } from './camera';

export interface ReviewView {
  camera: CameraStateId;
  label: string;
  sectionReview: boolean;
}

export const REVIEW_VIEWS: readonly ReviewView[] = [
  { camera: 'plantExterior', label: 'Plant exterior', sectionReview: false },
  { camera: 'reactorBuildingExterior', label: 'Reactor building', sectionReview: false },
  { camera: 'belowGradeOverview', label: 'Below grade', sectionReview: true },
  { camera: 'turbineRelationship', label: 'Turbine relationship', sectionReview: true },
];
