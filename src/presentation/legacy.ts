/**
 * The approved 48 s cinematic, reused read-only: its camera, reveal and look as pure functions of
 * master time, so a presentation beat can replay a stretch of it (the Stage 3 descent into the
 * plant) without touching the frozen master sequence or its timeline.
 */
import { HERO_REVEAL_CLOSED, type HeroRevealState } from '../animation/heroReveal';
import { createTrackOverlay, revealAfter } from '../animation/revealTimeline';
import { HERO_SHOT_REVEAL } from '../config/heroShot';
import { MASTER_REVEAL } from '../config/masterSequence';

const heroTracks = createTrackOverlay(HERO_SHOT_REVEAL, HERO_REVEAL_CLOSED);
const masterTracks = createTrackOverlay(MASTER_REVEAL, revealAfter(HERO_SHOT_REVEAL));

/** The master reveal at master time `m` (the Stage 3 tracks, then the Stage 6 ones). Pure. */
export function masterRevealAt(m: number, out: HeroRevealState = { ...HERO_REVEAL_CLOSED }): HeroRevealState {
  Object.assign(out, HERO_REVEAL_CLOSED);
  heroTracks.apply(m, out);
  masterTracks.apply(m, out);
  return out;
}
