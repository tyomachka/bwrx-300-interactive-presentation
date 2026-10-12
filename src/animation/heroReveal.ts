/**
 * The Stage 3 hero reveal as plain, continuous data.
 *
 * GSAP animates these numbers (animation/heroShot.ts). One scene component reads them every
 * frame and derives everything visual from them: section-plane positions, dims, rims and
 * what interior content is drawn (scene/section/RevealDriver.tsx). No other code tweens
 * materials or planes, so the reveal state is always one inspectable object.
 *
 * Every field runs 0 -> 1. The order is the visual hierarchy of the shot:
 * site dims -> reactor building becomes subordinate -> containment is the subject ->
 * containment becomes subordinate -> the RPV is the subject.
 */

export interface HeroRevealState {
  /** Earth in front of the reactor building sections away; the shaft exterior emerges below grade. */
  groundCut: number;
  /** Site, turbine hall and support buildings recede. */
  exteriorDim: number;
  /** Reactor building + shaft are sectioned; the containment stands inside, as its own volume. */
  shaftReveal: number;
  /** Containment is sectioned; the reactor pressure vessel stands inside it. */
  containmentReveal: number;
  /** The RPV becomes the subject: restrained warm rim, slightly stronger light. */
  rpvEmphasis: number;
}

export const HERO_REVEAL_CLOSED: Readonly<HeroRevealState> = {
  groundCut: 0,
  exteriorDim: 0,
  shaftReveal: 0,
  containmentReveal: 0,
  rpvEmphasis: 0,
};

/** The live reveal state. Mutated only by the shot timeline (and reset). */
export const heroReveal: HeroRevealState = { ...HERO_REVEAL_CLOSED };

export function resetHeroReveal(): void {
  Object.assign(heroReveal, HERO_REVEAL_CLOSED);
}

/** True once any part of the plant has been opened up (below-grade camera limits apply). */
export function isHeroRevealOpen(): boolean {
  return heroReveal.groundCut > 0 || heroReveal.shaftReveal > 0 || heroReveal.containmentReveal > 0;
}
