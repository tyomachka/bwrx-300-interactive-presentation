/**
 * The reveal over time, from track data (config/heroShot.ts ShotRevealTrack). Two pieces, so
 * the Stage 6 master sequence is the Stage 3 hero shot plus more, never a copy of it:
 *
 *  - buildRevealTimeline: the deterministic GSAP timeline the hero shot has always used, one
 *    track per property, each starting from the closed reveal. The master builds its first ten
 *    seconds from the very same tracks with this function.
 *  - createTrackOverlay: later tracks (several per property allowed) evaluated as a pure
 *    function of time and written over the timeline's values once a property's first later
 *    track has started. A GSAP timeline cannot hold several tweens of one property safely:
 *    seeking backwards reverts later tweens to their start values, and the last one rendered
 *    wins. A pure function has no history, so every seek and restart is exact.
 *
 * Values follow GSAP's own arithmetic (its eases, rounded to 1e-6), so a property reads the
 * same whichever piece computed it.
 */
import gsap from 'gsap';
// Side effect: GSAP must be ticked by our frame loop before any tween is created.
import './clock';
import type { ShotRevealTrack } from '../config/heroShot';
import { HERO_REVEAL_CLOSED, heroReveal, type HeroRevealState } from './heroReveal';

type Property = ShotRevealTrack['property'];
const EPS = 1e-9;

export function buildRevealTimeline(
  tracks: readonly ShotRevealTrack[],
  duration: number,
  onComplete: () => void,
  onUpdate?: () => void,
): gsap.core.Timeline {
  const timeline = gsap.timeline({ paused: true, onComplete, onUpdate });
  const started = new Set<Property>();
  for (const track of tracks) {
    if (started.has(track.property)) throw new Error(`[BWRX-300] "${track.property}": one timeline track per property (later ones go in an overlay)`);
    if (track.from !== HERO_REVEAL_CLOSED[track.property]) throw new Error(`[BWRX-300] the "${track.property}" track must start from the closed state`);
    started.add(track.property);
    timeline.fromTo(
      heroReveal,
      { [track.property]: track.from },
      { [track.property]: track.to, duration: track.duration, ease: track.ease, immediateRender: false },
      track.start,
    );
  }
  // Pin the timeline length to the shot length, whatever the last track is.
  timeline.set({}, {}, duration);
  return timeline;
}

/** The reveal a set of timeline tracks leaves once they have all finished. */
export function revealAfter(tracks: readonly ShotRevealTrack[]): HeroRevealState {
  const out = { ...HERO_REVEAL_CLOSED };
  for (const track of tracks) out[track.property] = track.to;
  return out;
}

interface CompiledTrack extends ShotRevealTrack {
  easeFn: (progress: number) => number;
}

export interface TrackOverlay {
  /** Write every overlaid property for time `t` (untouched before its first track starts). */
  apply(t: number, target: HeroRevealState): void;
}

/**
 * Later tracks over a base reveal (`base`: the values when they begin). Checked: a property's
 * first track starts from its base value; each next one starts where, and after, the previous
 * one ended.
 */
export function createTrackOverlay(tracks: readonly ShotRevealTrack[], base: Readonly<HeroRevealState>): TrackOverlay {
  const byProperty = new Map<Property, CompiledTrack[]>();
  for (const track of tracks) {
    const list = byProperty.get(track.property) ?? [];
    const previous = list[list.length - 1];
    const expected = previous ? previous.to : base[track.property];
    if (Math.abs(track.from - expected) > EPS || (previous && track.start < previous.start + previous.duration - EPS)) {
      throw new Error(`[BWRX-300] "${track.property}" track at ${track.start} s must start after, and from where, the previous value ended`);
    }
    list.push({ ...track, easeFn: gsap.parseEase(track.ease) ?? ((p: number) => p) });
    byProperty.set(track.property, list);
  }
  return {
    apply(t, target) {
      for (const [property, list] of byProperty) {
        if (t < list[0]!.start) continue;
        let track = list[0]!;
        for (const candidate of list) if (t >= candidate.start) track = candidate;
        const progress = track.duration > 0 ? Math.min(1, (t - track.start) / track.duration) : 1;
        const value = track.from + (track.to - track.from) * track.easeFn(progress);
        target[property] = Math.round(value * 1e6) / 1e6;
      }
    },
  };
}
