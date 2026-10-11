/**
 * Data-driven camera configuration (PROJECT.md §12).
 *
 * Camera states are plain data: a position, a look-at target and a vertical FOV. They are
 * authoring viewpoints for Explore/review now and keyframes for the Stage 6 timeline later.
 * New poses are captured with the `?debug` panel's "Copy pose" button.
 *
 * Plant layout reminder (scene/plant/dimensions.ts): reactor axis at the origin, turbine
 * hall to the east (+x), open front to the south (+z), grade at y = 0.
 */

export type Vec3Tuple = [number, number, number];

export interface CameraPose {
  position: Vec3Tuple;
  target: Vec3Tuple;
  /** Vertical field of view in degrees. */
  fov: number;
}

export type CameraStateId = 'plantExterior' | 'reactorBuildingExterior' | 'belowGradeOverview' | 'turbineRelationship';

export const CAMERA_STATES: Record<CameraStateId, CameraPose> = {
  /** Hero three-quarter view of the whole power block from the south-west: the opening shot. */
  plantExterior: { position: [-95, 64, 150], target: [36, 5, -8], fov: 35 },
  /** Closer on the reactor building, low enough that its base meeting the ground is the subject. */
  reactorBuildingExterior: { position: [-68, 24, 72], target: [6, 10, -4], fov: 35 },
  /** Section review: the embedded shaft, containment and RPV against the earth cut face. */
  belowGradeOverview: { position: [-24, 6, 152], target: [12, -2, 0], fov: 35 },
  /** Section review: reactor -> main steam path -> turbine -> generator, reading left to right. */
  turbineRelationship: { position: [128, 82, 118], target: [34, 0, -4], fov: 35 },
};

/** Where Explore mode starts and where `R` returns. */
export const HOME_CAMERA_STATE: CameraStateId = 'plantExterior';

export const CAMERA_LENS = {
  /** A longer product lens (35 degrees vertical) keeps industrial verticals from distorting. */
  fov: CAMERA_STATES[HOME_CAMERA_STATE].fov,
  near: 0.5,
  far: 1600,
} as const;

/** Explore-mode OrbitControls limits. Tuned for a mouse on a classroom PC and a projector. */
export const ORBIT = {
  dampingFactor: 0.08,
  rotateSpeed: 0.55,
  zoomSpeed: 0.8,
  panSpeed: 0.7,
  minDistance: 4,
  maxDistance: 480,
  /** Never look straight down (gimbal-like flips) or up from under the ground. */
  minPolarAngle: 0.12,
  maxPolarAngle: Math.PI / 2 - 0.04,
  /** "Limited pan": the orbit target is kept inside this box (metres). */
  panBounds: { min: [-120, 0.5, -110] as Vec3Tuple, max: [170, 70, 110] as Vec3Tuple },
  /** In section review the target may go below grade, to inspect the shaft. */
  panBoundsSection: { min: [-120, -45, -110] as Vec3Tuple, max: [170, 70, 110] as Vec3Tuple },
} as const;

/** Default programmatic transition (e.g. reset): slow in, slow out. */
export const CAMERA_TRANSITION = { duration: 1.4, ease: 'power2.inOut' } as const;
