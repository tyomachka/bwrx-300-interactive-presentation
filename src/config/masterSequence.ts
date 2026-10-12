/**
 * Stage 6 master presentation sequence: plain timing data (seconds). PROJECT.md §13.
 *
 *   0-10    the approved Stage 3 hero shot, unchanged: its own camera keys and reveal tracks
 *           (config/heroShot.ts) are the first ten seconds; nothing here repeats them
 *   10-16   RPV -> core: closer, the vessel cut opens, settle on the fuel
 *   16-20.5 fission slot (Stage 10 inset): a held core composition
 *   20.5-29 core -> chimney -> separators -> dryer -> steam outlet (Stage 7 flow)
 *   29-36.5 main steam line -> turbine -> generator (Stage 7 steam, electricity)
 *   36.5-41.5 back to the core: control blades (Stage 8 insertion)
 *   41.5-46 passive cooling: isolation-condenser pools (Stage 9 ICS flow)
 *   46-48   final pullback to a stable plant / reactor frame
 *
 * Everything is a function of master time: the camera keys (camera/cameraPath.ts), the reveal
 * tracks (animation/revealTimeline.ts), the look cues (subjects, context dim, ghosts, interior
 * levels) and the semantic events later stages attach to. Scene components own no timing.
 */
import { COMPONENT_IDS as C, type ComponentId } from '../scene/components';
import type { InteriorLevel } from '../scene/section/sectionLayers';
import type { CameraStateId } from './camera';
import { HERO_SHOT_BEATS, HERO_SHOT_DURATION, type ShotRevealTrack } from './heroShot';

export const MASTER_DURATION = 48;

/** Semantic events (seconds). Stages 7-10 attach effects here without touching the camera. */
export const MASTER_EVENTS = {
  /** The vessel cut has opened on the core: where the nuclear heat is produced. */
  coreReveal: 12.4,
  /** Stage 10 fission inset enters / has returned to the reactor scale. */
  fissionEnter: 16.0,
  fissionExit: 20.5,
  /** Stage 7 natural circulation, bottom to top, then the dry steam leaving. */
  flowCore: 20.5,
  flowChimney: 22.4,
  flowSeparators: 24.3,
  flowDryer: 26.0,
  steamExit: 27.6,
  /** Stage 7 steam along the main steam line; turbine and generator turning; power out. */
  steamToTurbine: 29.0,
  turbine: 32.2,
  generator: 34.0,
  electricityOut: 35.4,
  /** Stage 8: blades move farther in, power drops (controlAction .. controlExit). */
  controlEnter: 36.5,
  controlAction: 39.2,
  controlExit: 41.5,
  /** Stage 9: the normal power path fades; the isolation-condenser path is highlighted. */
  safetyEnter: 41.5,
  isolationCondenser: 44.6,
  safetyExit: 46.0,
  finalPullback: 46.0,
  sequenceComplete: 48.0,
} as const;

export type PresentationEventId = keyof typeof MASTER_EVENTS;

export type PresentationBeatId =
  | keyof typeof HERO_SHOT_BEATS
  | 'core'
  | 'fission'
  | 'flow'
  | 'turbine'
  | 'control'
  | 'safety'
  | 'finalPullback';

export interface PresentationBeat {
  id: PresentationBeatId;
  label: string;
  start: number;
  end: number;
  /** What the audience should take away (narration writing). */
  takeaway: string;
  events: readonly PresentationEventId[];
  /** The beat's subject(s), for reference (the look cues below are what is drawn). */
  subjects: readonly ComponentId[];
}

const HERO_BEAT_TEXT: Record<keyof typeof HERO_SHOT_BEATS, Pick<PresentationBeat, 'label' | 'takeaway' | 'subjects'>> = {
  exterior: { label: 'Plant exterior', takeaway: 'A complete power station.', subjects: [C.plant] },
  approach: { label: 'Reactor building', takeaway: 'The reactor building beside the turbine hall.', subjects: [C.reactorBuilding] },
  belowGrade: { label: 'Below grade', takeaway: 'The building continues deep underground.', subjects: [C.reactorShaft] },
  containment: { label: 'Containment', takeaway: 'A containment vessel inside the shaft.', subjects: [C.containment] },
  rpvHero: { label: 'Reactor vessel', takeaway: 'The reactor pressure vessel.', subjects: [C.rpv] },
};

/** The master sequence beats, in order and without gaps; the first five are the Stage 3 shot. */
export const MASTER_BEATS: readonly PresentationBeat[] = [
  ...(Object.entries(HERO_SHOT_BEATS) as [keyof typeof HERO_SHOT_BEATS, readonly [number, number]][]).map(([id, [start, end]]) => ({
    id,
    start,
    end,
    events: [],
    ...HERO_BEAT_TEXT[id],
  })),
  { id: 'core', label: 'Core', start: 10, end: 16, takeaway: 'This is where the nuclear heat is produced.', events: ['coreReveal'], subjects: [C.core] },
  { id: 'fission', label: 'Fission', start: 16, end: 20.5, takeaway: 'Fission in the fuel releases heat (Stage 10 inset).', events: ['fissionEnter', 'fissionExit'], subjects: [C.core] },
  {
    id: 'flow',
    label: 'Natural circulation',
    start: 20.5,
    end: 29,
    takeaway: 'Water boils in the core; the mixture rises through the chimney; separators and dryer leave dry steam.',
    events: ['flowCore', 'flowChimney', 'flowSeparators', 'flowDryer', 'steamExit'],
    subjects: [C.core, C.chimney, C.steamSeparators, C.steamDryer, C.mainSteamNozzle],
  },
  {
    id: 'turbine',
    label: 'Turbine and generator',
    start: 29,
    end: 36.5,
    takeaway: 'Steam turns the turbine, which drives the generator: electricity.',
    events: ['steamToTurbine', 'turbine', 'generator', 'electricityOut'],
    subjects: [C.mainSteamPath, C.turbine, C.generator],
  },
  { id: 'control', label: 'Control', start: 36.5, end: 41.5, takeaway: 'Control blades between the fuel set the reactor power.', events: ['controlEnter', 'controlAction', 'controlExit'], subjects: [C.controlBlades] },
  {
    id: 'safety',
    label: 'Passive cooling',
    start: 41.5,
    end: 46,
    takeaway: 'Isolation condensers in pools above the reactor can cool it without pumps or operators.',
    events: ['safetyEnter', 'isolationCondenser', 'safetyExit'],
    subjects: [C.icsPools],
  },
  { id: 'finalPullback', label: 'Final', start: 46, end: 48, takeaway: 'The whole plant again: a stable end frame.', events: ['finalPullback', 'sequenceComplete'], subjects: [C.plant] },
];

export interface MasterCameraKey {
  time: number;
  pose: CameraStateId;
}

/**
 * Camera after the Stage 3 shot. It starts at rest on the shot's final pose, so the shot's own
 * path (which ends at rest there) runs unchanged for 0-10 s. Between keys the camera never
 * stops; a repeated or nearly repeated pose is a hold with a slow drift.
 */
export const MASTER_CAMERA: readonly MasterCameraKey[] = [
  { time: HERO_SHOT_DURATION, pose: 'stage3RPVHero' },
  { time: 12.8, pose: 'masterVesselOpen' },
  { time: 15.4, pose: 'masterCore' },
  { time: 20.5, pose: 'masterCoreHold' },
  { time: 22.6, pose: 'masterArchitecture' },
  { time: 24.8, pose: 'masterSeparators' },
  { time: 26.6, pose: 'steamRegionCloseup' },
  { time: 28.4, pose: 'masterSteamExit' },
  { time: 30.8, pose: 'masterSteamLine' },
  { time: 32.6, pose: 'masterTurbine' },
  { time: 35.0, pose: 'masterGenerator' },
  { time: 37.3, pose: 'masterReturn' },
  { time: 39.1, pose: 'masterBlades' },
  { time: 41.2, pose: 'masterBladesHold' },
  { time: 42.4, pose: 'masterSafetyExit' },
  { time: 43.5, pose: 'masterSafetyRise' },
  { time: 44.6, pose: 'masterSafety' },
  { time: 46.0, pose: 'masterSafetyHold' },
  { time: MASTER_DURATION, pose: 'masterFinal' },
];

/** Reveal tracks after the Stage 3 shot (same rules as the shot's: animation/revealTimeline.ts). */
export const MASTER_REVEAL: readonly ShotRevealTrack[] = [
  // The vessel opens as the camera comes in; its warm rim steps back to the Stage 4 level.
  { property: 'vesselCut', from: 0, to: 1, start: 10.5, duration: 2.0, ease: 'sine.inOut' },
  { property: 'rpvEmphasis', from: 1, to: 0.4, start: 11.0, duration: 1.8, ease: 'sine.inOut' },
  // Turbine chapter: the site context comes back up around the hall, then recedes again.
  { property: 'exteriorDim', from: 1, to: 0.25, start: 30.2, duration: 1.6, ease: 'sine.inOut' },
  { property: 'exteriorDim', from: 0.25, to: 1, start: 36.6, duration: 1.2, ease: 'sine.inOut' },
  // Control: the approved copper subject emphasis on the blades (Stage 4).
  { property: 'bladeEmphasis', from: 0, to: 1, start: 38.3, duration: 0.8, ease: 'sine.inOut' },
  { property: 'bladeEmphasis', from: 1, to: 0, start: 41.6, duration: 0.8, ease: 'sine.inOut' },
  // Safety: the pools appear while the camera is still deep in the core (off screen); the
  // vessel closes only once the camera has backed out of it; the RPV hero lighting returns.
  { property: 'poolsReveal', from: 0, to: 1, start: 41.6, duration: 0.05, ease: 'none' },
  { property: 'vesselCut', from: 1, to: 0, start: 43.4, duration: 1.6, ease: 'sine.inOut' },
  { property: 'rpvEmphasis', from: 0.4, to: 1, start: 44.0, duration: 1.8, ease: 'sine.inOut' },
];

/** A subject's emphasis: up over `fade` after `start`, down over `fade` before `end`. */
export interface SubjectCue {
  ids: readonly ComponentId[];
  start: number;
  end: number;
  fade: number;
  weight?: number;
}

/** Look cues (interaction/exploreVisuals.ts CinematicLook), all pure functions of time. */
export const MASTER_LOOK = {
  subjects: [
    { ids: [C.core], start: 12.0, end: 22.6, fade: 1.0 },
    { ids: [C.chimney], start: 21.6, end: 24.6, fade: 0.9 },
    { ids: [C.steamSeparators], start: 23.6, end: 26.4, fade: 0.9 },
    { ids: [C.steamDryer], start: 25.4, end: 28.2, fade: 0.9 },
    { ids: [C.mainSteamNozzle], start: 27.0, end: 30.0, fade: 0.8 },
    { ids: [C.mainSteamPath], start: 28.6, end: 33.4, fade: 0.9 },
    { ids: [C.turbine], start: 31.6, end: 35.2, fade: 0.9 },
    { ids: [C.generator], start: 33.4, end: 36.8, fade: 0.9 },
    { ids: [C.icsPools], start: 42.6, end: 47.2, fade: 1.0, weight: 1.6 },
  ] satisfies SubjectCue[] as readonly SubjectCue[],
  /** Context dim (0..1) as [time, value] keys, linear between keys (smoothed). */
  contextDim: [
    [0, 0],
    [HERO_SHOT_DURATION, 0],
    [12.0, 0],
    [13.4, 0.55],
    [28.6, 0.55],
    [30.4, 0],
    [36.6, 0],
    [38.4, 0.45],
    [41.4, 0.45],
    [43.0, 0.5],
    [46.0, 0.5],
    [47.4, 0],
  ] as readonly (readonly [number, number])[],
  /** Enclosure ghosts: the turbine hall turns to X-ray while the camera is on the train. */
  // It closes again as the camera pulls away from the generator, before the flight over the plant.
  ghosts: [{ ids: [C.turbineBuilding], start: 30.4, end: 36.5, fade: 1.0 }] satisfies SubjectCue[] as readonly SubjectCue[],
  /** Interior levels drawn in time windows (switched while off screen). */
  interior: [{ level: 'steamPath', start: 18.0, end: 38.6 }] as readonly { level: InteriorLevel; start: number; end: number }[],
} as const;
