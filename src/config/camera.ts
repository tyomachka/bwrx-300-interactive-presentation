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

export type CameraStateId =
  | 'plantExterior'
  | 'reactorBuildingExterior'
  | 'belowGradeOverview'
  | 'turbineRelationship'
  | 'turbineHallExterior'
  | 'turbineTrain'
  | Stage3ShotPoseId
  | RpvReviewPoseId;

/** Keyframe poses of the Stage 3 hero shot, in shot order (timing: config/heroShot.ts). */
export type Stage3ShotPoseId =
  | 'stage3Exterior'
  | 'stage3ExteriorPush'
  | 'stage3Approach'
  | 'stage3BelowGrade'
  | 'stage3Containment'
  | 'stage3RPVHero';

/** Stage 4 vessel review states (config/rpvReview.ts). Below grade, inside the opened plant. */
export type RpvReviewPoseId = 'rpvExterior' | 'rpvCutaway' | 'coreCloseup' | 'controlBladesCloseup' | 'steamRegionCloseup';

const PLANT_EXTERIOR: CameraPose = { position: [-95, 64, 150], target: [36, 5, -8], fov: 35 };

export const CAMERA_STATES: Record<CameraStateId, CameraPose> = {
  /** Hero three-quarter view of the whole power block from the south-west: the opening shot. */
  plantExterior: PLANT_EXTERIOR,
  /** Closer on the reactor building, low enough that its base meeting the ground is the subject. */
  reactorBuildingExterior: { position: [-68, 24, 72], target: [6, 10, -4], fov: 35 },
  /** Section review: the embedded shaft, containment and RPV against the earth cut face. */
  belowGradeOverview: { position: [-24, 6, 152], target: [12, -2, 0], fov: 35 },
  /** Section review: reactor -> main steam path -> turbine -> generator, reading left to right. */
  turbineRelationship: { position: [128, 82, 118], target: [34, 0, -4], fov: 35 },
  /** Explore focus: the turbine hall from the south-west. */
  turbineHallExterior: { position: [6, 30, 118], target: [62, 10, -2], fov: 35 },
  /** Explore focus: the turbine-generator train, seen through the hall's south wall (X-ray). */
  turbineTrain: { position: [44, 24, 58], target: [64, 13, 0], fov: 35 },

  // ---- Stage 3 hero shot: plant exterior -> reactor building -> below grade -> RPV ----
  // The camera stays above grade; its sight lines into the excavation the reveal opens
  // (scene/section/sectionLayers.ts EXCAVATION) cross grade inside it.
  /** The shot opens exactly on the approved exterior hero view. */
  stage3Exterior: PLANT_EXTERIOR,
  /** End of the opening hold: a barely perceptible push towards the reactor building. */
  stage3ExteriorPush: { position: [-92.5, 60.5, 143.5], target: [32, 4.5, -6.5], fov: 35 },
  /** The whole reactor building, ground in front of it; the turbine hall stays readable to its right. */
  stage3Approach: { position: [-68, 40, 128], target: [10, 6, 4], fov: 35 },
  /** Looking into the opened ground: roof to basemat, the same cylinder continues ~36 m below grade. */
  stage3BelowGrade: { position: [-64, 30, 122], target: [2, -2, 6], fov: 35 },
  /** Lower and closer over the sectioned shaft: the containment stands inside as its own volume. */
  stage3Containment: { position: [-34, 10, 92], target: [0, -12, 2], fov: 35 },
  /** Final, settled: at the edge of the excavation, grade high in frame, the RPV the subject below. */
  stage3RPVHero: { position: [-24, 2, 74], target: [0, -12, 0], fov: 35 },

  // ---- Stage 4 vessel review (dev / ?debug, key B) ----
  // Inside the opened excavation, in front of the sectioned containment; the vessel cutaway
  // removes the quadrant facing these cameras (x < 0, z > 0). Vessel heights: core -21.4..-17.6,
  // chimney -17..-10, separators -9.4..-6.1, dryer -6..-1.3, steam nozzles -2.3 (world y).
  /** The whole closed vessel, drives included, standing in the pedestal. */
  rpvExterior: { position: [-26.66, -10.43, 50.14], target: [0, -15.4, 0], fov: 35 },
  /** Opened along the bisector of the cut quadrant, slightly from above (as GD Fig 3-1): the
   *  full vertical hierarchy from the drives to the dryer. */
  rpvCutaway: { position: [-34.09, -0.59, 37.86], target: [0, -15.2, 0], fov: 35 },
  /** Fuel, blades, shroud and top guide, from above the core's cut corner. */
  coreCloseup: { position: [-4.14, -15.85, 4.86], target: [-0.35, -18.6, 0.35], fov: 35 },
  /** Looking down on the mid-core step section: fuel squares and cruciform blades in plan,
   *  the half-inserted blades rising behind. */
  controlBladesCloseup: { position: [-3.52, -16.37, 3.52], target: [-0.65, -19.78, 0.65], fov: 35 },
  /** Chimney top, chimney head, separators and dryer, with the steam outlets. */
  steamRegionCloseup: { position: [-11.2, -1.85, 13.4], target: [0, -6.2, 0], fov: 35 },
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
  /**
   * The camera itself never goes below this height (m), even when the orbit target is below
   * grade in an opened-up plant: outside the excavation, below grade is inside the earth.
   */
  minCameraY: 0.5,
  /** "Limited pan": the orbit target is kept inside this box (metres). */
  panBounds: { min: [-120, 0.5, -110] as Vec3Tuple, max: [170, 70, 110] as Vec3Tuple },
  /** In section review the target may go below grade, to inspect the shaft. */
  panBoundsSection: { min: [-120, -45, -110] as Vec3Tuple, max: [170, 70, 110] as Vec3Tuple },
} as const;

/** Default programmatic transition (e.g. reset): slow in, slow out. */
export const CAMERA_TRANSITION = { duration: 1.4, ease: 'power2.inOut' } as const;
