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
  | RpvReviewPoseId
  | MasterPoseId;

/**
 * Stage 6 master-sequence waypoints (timing: config/masterSequence.ts). The sequence also
 * passes through approved poses (Stage 3 RPV hero, Stage 4/5 core, blades, steam region,
 * turbine train); these are the in-between and chapter poses it adds.
 */
export type MasterPoseId =
  | 'masterVesselOpen'
  | 'masterCore'
  | 'masterCoreHold'
  | 'masterArchitecture'
  | 'masterSeparators'
  | 'masterSteamExit'
  | 'masterSteamLine'
  | 'masterTurbine'
  | 'masterGenerator'
  | 'masterReturn'
  | 'masterBlades'
  | 'masterBladesHold'
  | 'masterSafetyExit'
  | 'masterSafetyRise'
  | 'masterSafety'
  | 'masterSafetyHold'
  | 'masterFinal';

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

  // ---- Stage 6 master sequence (config/masterSequence.ts) ----
  // Plant layout: reactor axis at the origin, everything cut open towards the south-west
  // cameras (vessel quadrant x < 0, z > 0); main steam line east along z = 0 at y = -2.3 into
  // the turbine hall (x 20.6..104), up to the turbine shaft (y 14.6); ICS pools above the
  // containment behind the cut (y 4..15.5, z < 0).
  /** Closer than the RPV hero, the vessel cut opening: the whole internal stack. */
  masterVesselOpen: { position: [-13, -8, 23], target: [0, -14.5, 0], fov: 35 },
  /** The core in the open vessel: fuel, blades, shroud, top guide. */
  masterCore: { position: [-5.4, -15.2, 6.6], target: [-0.3, -19, 0.3], fov: 35 },
  /** End of the fission hold: the same composition, a barely perceptible push. */
  masterCoreHold: { position: [-4.9, -15.6, 6], target: [-0.3, -19.1, 0.3], fov: 35 },
  /** Pulled back: core, chimney and the downcomer gap in one frame. */
  masterArchitecture: { position: [-12.5, -10.5, 15], target: [0, -14, 0], fov: 35 },
  /** Craned up: chimney head and separators. */
  masterSeparators: { position: [-11.5, -4.5, 13.8], target: [0, -7.6, 0], fov: 35 },
  /** Dryer and the steam outlet: the camera turns towards the east nozzle. */
  masterSteamExit: { position: [-9.5, -0.5, 13.5], target: [1.2, -3, 0], fov: 35 },
  /** Out of the vessel, following the main steam line east through the cut walls. */
  masterSteamLine: { position: [6, 6, 38], target: [16, -1, 0], fov: 35 },
  /** The turbine train in the X-rayed hall: steam enters the HP turbine. */
  masterTurbine: { position: [30, 19, 38], target: [60, 12.5, 0], fov: 35 },
  /** The generator end of the train. */
  masterGenerator: { position: [42, 18.5, 37], target: [72, 12.5, 0], fov: 35 },
  /** High over the opened reactor building on the way back to the core. */
  masterReturn: { position: [-12, 16, 40], target: [0, -12, 0], fov: 35 },
  /** The approved control-blade close-up (Stage 4 / Stage 5). */
  masterBlades: { position: [-3.52, -16.37, 3.52], target: [-0.65, -19.78, 0.65], fov: 35 },
  /** End of the control hold: a barely perceptible push. */
  masterBladesHold: { position: [-3.3, -16.6, 3.3], target: [-0.65, -19.8, 0.65], fov: 35 },
  /** Backing out of the vessel along the sight line, before climbing. */
  masterSafetyExit: { position: [-12, -8.5, 12.5], target: [-0.4, -16, 0.4], fov: 35 },
  /** Rising out of the containment: the whole vessel with the pools above it. */
  masterSafetyRise: { position: [-20, 1, 34], target: [0, -1, -3], fov: 35 },
  /** Passive cooling: the pools above the containment in the cut reactor building. */
  masterSafety: { position: [-12, 9, 50], target: [0, 7, -5], fov: 35 },
  /** End of the safety hold. */
  masterSafetyHold: { position: [-12.5, 9.2, 52], target: [0, 6.8, -5], fov: 35 },
  /** Final: the opened plant, reactor and pools, turbine hall beside it; a stable end frame. */
  masterFinal: { position: [-42, 23, 86], target: [9, -2, 0], fov: 35 },
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
