/**
 * Stage 3 hero shot: plant exterior -> reactor building -> below grade -> containment -> RPV.
 *
 * Pure timing data (seconds). The camera keyframes name poses in config/camera.ts; the reveal
 * tracks animate fields of HeroRevealState (animation/heroReveal.ts). Everything the reveal
 * does visually is derived from those fields in one place (scene/section/sectionLayers.ts),
 * so retiming the shot never touches scene components.
 *
 * Story beats (the target the tracks below are tuned to):
 *   0.0-1.5  exterior hero: settle, barely perceptible push
 *   1.5-3.4  approach the reactor building; turbine hall stays readable on its right
 *   3.4-5.8  below-grade reveal: the ground in front sections away, the cylinder continues
 *            ~36 m below grade, site context recedes, the grade datum marks the cut
 *   5.8-7.6  containment reveal: building + shaft sectioned and subordinate; the containment
 *            stands inside as its own volume (brief emphasis); the datum steps back
 *   7.6-10   RPV hero: containment sectioned and subordinate; the RPV is the subject; the
 *            datum is gone; settle
 */
import type { HeroRevealState } from '../animation/heroReveal';
import type { Stage3ShotPoseId } from './camera';

export interface ShotCameraKey {
  time: number;
  pose: Stage3ShotPoseId;
}

export interface ShotRevealTrack {
  property: keyof HeroRevealState;
  from: number;
  to: number;
  start: number;
  duration: number;
  /** GSAP core ease name. */
  ease: string;
}

export const HERO_SHOT_DURATION = 10;

export const HERO_SHOT_BEATS = {
  exterior: [0, 1.5],
  approach: [1.5, 3.4],
  belowGrade: [3.4, 5.8],
  containment: [5.8, 7.6],
  rpvHero: [7.6, 10],
} as const;

/** The camera passes through every key without stopping; it starts and ends at rest. */
export const HERO_SHOT_CAMERA: readonly ShotCameraKey[] = [
  { time: 0, pose: 'stage3Exterior' },
  { time: 1.5, pose: 'stage3ExteriorPush' },
  { time: 3.4, pose: 'stage3Approach' },
  { time: 5.8, pose: 'stage3BelowGrade' },
  { time: 7.6, pose: 'stage3Containment' },
  { time: 10, pose: 'stage3RPVHero' },
];

export const HERO_SHOT_REVEAL: readonly ShotRevealTrack[] = [
  // The site starts to recede just before the ground opens, so the cut reads as the subject.
  { property: 'exteriorDim', from: 0, to: 1, start: 2.9, duration: 2.4, ease: 'sine.inOut' },
  // Fast over the empty foreground, decelerating as the cut reaches the shaft and the axis.
  { property: 'groundCut', from: 0, to: 1, start: 3.3, duration: 2.5, ease: 'power3.out' },
  // The two structural cuts: their planes follow measured stations (scene/section/cutPath.ts),
  // so these eases shape the visible opening itself (~1.1 s and ~1.0 s of clear change).
  // Their tails overlap: the containment starts opening as the building cut settles.
  { property: 'shaftReveal', from: 0, to: 1, start: 5.6, duration: 1.9, ease: 'sine.inOut' },
  { property: 'containmentReveal', from: 0, to: 1, start: 7.3, duration: 1.65, ease: 'sine.inOut' },
  { property: 'rpvEmphasis', from: 0, to: 1, start: 8.0, duration: 1.6, ease: 'sine.inOut' },
];
