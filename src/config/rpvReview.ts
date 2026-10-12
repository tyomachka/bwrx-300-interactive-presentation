/**
 * Stage 4 vessel review states (dev / `?debug` only, key B, or the diagnostics panel): a
 * camera pose plus the reveal it needs. Pure data; animation/rpvReview.ts applies it.
 *
 * Every state opens the plant as the end of the Stage 3 shot does (ground, building and
 * containment cut, site dimmed), so the camera can stand inside the excavation in front of
 * the vessel. Not presentation UI: Stage 5/6 build on the same data.
 */
import type { HeroRevealState } from '../animation/heroReveal';
import type { BladePattern } from '../scene/rpv/coreLayout';
import type { RpvReviewPoseId } from './camera';

export interface RpvReviewState {
  /** Also the camera state it uses (config/camera.ts). */
  id: RpvReviewPoseId;
  label: string;
  reveal: HeroRevealState;
  /** Control blade insertion pattern (static data; not animated in Stage 4). */
  blades: BladePattern;
}

const OPEN_PLANT = { groundCut: 1, exteriorDim: 1, shaftReveal: 1, containmentReveal: 1, coreSection: 0, poolsReveal: 0 } as const;

export const RPV_REVIEW_STATES: readonly RpvReviewState[] = [
  { id: 'rpvExterior', label: 'RPV exterior', reveal: { ...OPEN_PLANT, rpvEmphasis: 1, vesselCut: 0, bladeEmphasis: 0 }, blades: 'operating' },
  { id: 'rpvCutaway', label: 'RPV cutaway', reveal: { ...OPEN_PLANT, rpvEmphasis: 0.6, vesselCut: 1, bladeEmphasis: 0 }, blades: 'operating' },
  { id: 'coreCloseup', label: 'Core', reveal: { ...OPEN_PLANT, rpvEmphasis: 0.4, vesselCut: 1, bladeEmphasis: 0 }, blades: 'operating' },
  { id: 'controlBladesCloseup', label: 'Control blades', reveal: { ...OPEN_PLANT, rpvEmphasis: 0.4, vesselCut: 1, coreSection: 1, bladeEmphasis: 1 }, blades: 'partial' },
  { id: 'steamRegionCloseup', label: 'Steam region', reveal: { ...OPEN_PLANT, rpvEmphasis: 0.4, vesselCut: 1, bladeEmphasis: 0 }, blades: 'operating' },
];
