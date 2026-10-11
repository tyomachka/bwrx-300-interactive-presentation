/**
 * Data-driven camera configuration (PROJECT.md §12).
 *
 * Camera states are plain data: a position, a look-at target and a vertical FOV.
 * Stage 1 only defines `home` (the Explore-mode reset view of the placeholder scene).
 * The named story states (`plantExterior`, `reactorBuilding`, `core`, ...) are added in
 * Stage 6, once real geometry exists to frame. Placeholder coordinates would be fiction.
 */

export type Vec3Tuple = [number, number, number];

export interface CameraPose {
  position: Vec3Tuple;
  target: Vec3Tuple;
  /** Vertical field of view in degrees. */
  fov: number;
}

export type CameraStateId = 'home';

export const CAMERA_STATES: Record<CameraStateId, CameraPose> = {
  home: { position: [40, 26, 66], target: [-7, 12, -2], fov: 35 },
};

export const CAMERA_LENS = {
  /** A longer product lens (35 degrees vertical) keeps industrial verticals from distorting. */
  fov: CAMERA_STATES.home.fov,
  near: 0.2,
  far: 1200,
} as const;

/** Explore-mode OrbitControls limits. Tuned for a mouse on a classroom PC and a projector. */
export const ORBIT = {
  dampingFactor: 0.08,
  rotateSpeed: 0.55,
  zoomSpeed: 0.8,
  panSpeed: 0.7,
  minDistance: 6,
  maxDistance: 260,
  /** Never look straight down (gimbal-like flips) or up from under the ground. */
  minPolarAngle: 0.12,
  maxPolarAngle: Math.PI / 2 - 0.04,
  /** "Limited pan": the orbit target is kept inside this box (metres). */
  panBounds: { min: [-120, 0.5, -120] as Vec3Tuple, max: [120, 60, 120] as Vec3Tuple },
} as const;

/** Default programmatic transition (e.g. reset): slow in, slow out. */
export const CAMERA_TRANSITION = { duration: 1.4, ease: 'power2.inOut' } as const;
