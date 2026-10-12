/**
 * Stage 6 master presentation sequence (~48 s): one deterministic timeline for the camera, the
 * reveal, the presentation look and the semantic events Stages 7-10 attach to.
 *
 * Built like the Stage 3 hero shot, and on top of it rather than beside it:
 *  - reveal: a GSAP timeline built from the hero shot's own tracks by the hero shot's own
 *    builder, ticked by the shared animation clock, plus the master's later tracks as a
 *    pure-function overlay on top (animation/revealTimeline.ts explains why);
 *  - camera: for 0-10 s the hero shot's own keyframe path, after that a second path that starts
 *    at rest on the shot's final pose (camera/cameraPath.ts); both are pure functions of time;
 *  - look: subjects, context dim, ghosts and interior levels evaluated from master time and
 *    applied without easing (interaction/exploreVisuals.ts CinematicLook);
 *  - events: timeline callbacks while playing; a seek announces itself instead, so an effect
 *    always derives its state from `time` (pull), and uses events only for one-shot cues.
 * Hence restart is exact, seek(t) shows exactly the frame playback shows at t (forwards or
 * backwards), and with `animationClock.fixedStep` it renders frame-accurately at any speed.
 *
 * While it owns the camera, Explore is suspended (no hover, selection, labels or panel; clicks
 * do nothing). At the end it holds the final frame under its own authority ("finished") until
 * Reset, a restart, or another shot: a stable frame, with nothing handed over mid-image.
 */
// Side effect: GSAP must be ticked by our frame loop before any tween is created.
import './clock';
import { create } from 'zustand';
import { MathUtils } from 'three';
import { cameraDirector, type LivePose } from '../camera/cameraDirector';
import { CameraPath } from '../camera/cameraPath';
import { CAMERA_STATES, ORBIT } from '../config/camera';
import { HERO_SHOT_CAMERA, HERO_SHOT_DURATION, HERO_SHOT_REVEAL } from '../config/heroShot';
import {
  MASTER_BEATS,
  MASTER_CAMERA,
  MASTER_DURATION,
  MASTER_EVENTS,
  MASTER_LOOK,
  MASTER_REVEAL,
  type PresentationBeat,
  type PresentationEventId,
  type SubjectCue,
} from '../config/masterSequence';
import { suspendForPresentation } from '../interaction/exploreActions';
import { setCinematicLook, type CinematicLook } from '../interaction/exploreVisuals';
import type { ComponentId } from '../scene/components';
import { setBladeInsertion } from '../scene/rpv/coreLayout';
import type { InteriorLevel } from '../scene/section/sectionLayers';
import { useAppStore } from '../state/store';
import { heroReveal, resetHeroReveal } from './heroReveal';
import { heroShot } from './heroShot';
import { buildRevealTimeline, createTrackOverlay, revealAfter } from './revealTimeline';
import { endRpvReview } from './rpvReview';

export type MasterStatus = 'idle' | 'playing' | 'paused' | 'finished';

/** What the master announces: events crossed while playing, seeks, and status changes. */
export type MasterSignal =
  | { type: 'event'; id: PresentationEventId; time: number }
  | { type: 'seek'; time: number }
  | { type: 'status'; status: MasterStatus };

/** Frame step for review controls (the video export rate). */
export const MASTER_FRAME = 1 / 30;

// ---- Camera: the hero shot's path, then the master's -------------------------------------------------

if (MASTER_CAMERA[0]?.time !== HERO_SHOT_DURATION || MASTER_CAMERA[0].pose !== HERO_SHOT_CAMERA[HERO_SHOT_CAMERA.length - 1]?.pose) {
  throw new Error('[BWRX-300] the master camera must continue from the hero shot final pose');
}
const openingPath = new CameraPath(HERO_SHOT_CAMERA.map((key) => ({ time: key.time, pose: CAMERA_STATES[key.pose] })));
const continuationPath = new CameraPath(MASTER_CAMERA.map((key) => ({ time: key.time, pose: CAMERA_STATES[key.pose] })));

/** The master camera at time `t` (pure). */
export function masterCameraAt(t: number, out: LivePose): LivePose {
  return t <= HERO_SHOT_DURATION ? openingPath.evaluate(t, out) : continuationPath.evaluate(t, out);
}

// ---- Reveal after the Stage 3 shot: a pure function of time over the shot's end state -------------------

const revealOverlay = createTrackOverlay(MASTER_REVEAL, revealAfter(HERO_SHOT_REVEAL));

// ---- Look: pure functions of time --------------------------------------------------------------------

const smooth = (x: number) => MathUtils.smootherstep(x, 0, 1);

/** A cue's weight at `t`: up over `fade` after start, down over `fade` before end. */
function cueWeight(cue: SubjectCue, t: number): number {
  if (t <= cue.start || t >= cue.end) return 0;
  const up = smooth(Math.min(1, (t - cue.start) / cue.fade));
  const down = smooth(Math.min(1, (cue.end - t) / cue.fade));
  return Math.min(up, down) * (cue.weight ?? 1);
}

function keyed(keys: readonly (readonly [number, number])[], t: number): number {
  if (t <= keys[0]![0]) return keys[0]![1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1] = keys[i]!;
    if (t <= t1) {
      const [t0, v0] = keys[i - 1]!;
      return v0 + (v1 - v0) * smooth((t - t0) / (t1 - t0));
    }
  }
  return keys[keys.length - 1]![1];
}

function weights(cues: readonly SubjectCue[], t: number): Map<ComponentId, number> {
  const out = new Map<ComponentId, number>();
  for (const cue of cues) {
    const w = cueWeight(cue, t);
    if (w > 0) for (const id of cue.ids) out.set(id, Math.max(out.get(id) ?? 0, w));
  }
  return out;
}

/** The presentation look at master time `t` (pure). */
export function masterLookAt(t: number): CinematicLook {
  const interior: Partial<Record<InteriorLevel, boolean>> = {};
  for (const window of MASTER_LOOK.interior) if (t >= window.start && t < window.end) interior[window.level] = true;
  return {
    subjects: weights(MASTER_LOOK.subjects, t),
    ghosts: weights(MASTER_LOOK.ghosts, t),
    contextDim: keyed(MASTER_LOOK.contextDim, t),
    interior,
  };
}

/** The beat at time `t` (the last one for t >= duration). */
export function masterBeatAt(t: number): PresentationBeat {
  return MASTER_BEATS.find((beat) => t >= beat.start && t < beat.end) ?? MASTER_BEATS[MASTER_BEATS.length - 1]!;
}

// ---- Controller --------------------------------------------------------------------------------------

/** Discrete status for UI (never the per-frame time). */
export const useMasterStore = create<{ status: MasterStatus }>()(() => ({ status: 'idle' }));

class MasterSequence {
  readonly duration = MASTER_DURATION;

  private timeline: gsap.core.Timeline | null = null;
  private session = 0;
  private readonly listeners = new Set<(signal: MasterSignal) => void>();
  private readonly look = () => masterLookAt(this.time);

  get time(): number {
    return this.timeline?.time() ?? 0;
  }

  get status(): MasterStatus {
    return useMasterStore.getState().status;
  }

  get beat(): PresentationBeat {
    return masterBeatAt(this.time);
  }

  /** Later stages: follow events and seeks. Returns the unsubscribe function. */
  subscribe(listener: (signal: MasterSignal) => void): () => void {
    this.listeners.add(listener);
    return () => void this.listeners.delete(listener);
  }

  /** Play from the first frame (restart). Every run is identical. */
  play(): void {
    this.start(0, true);
  }

  /** Show the exact frame at `t` and hold it (paused). */
  seek(t: number): void {
    this.start(MathUtils.clamp(t, 0, this.duration), false);
  }

  /** Space: pause / resume; from idle or the held final frame, play from the start. */
  togglePause(): void {
    const timeline = this.timeline;
    if (this.status === 'playing' && timeline) {
      timeline.pause();
      this.setStatus('paused');
    } else if (this.status === 'paused' && timeline && this.time < this.duration) {
      timeline.play();
      this.setStatus('playing');
    } else {
      this.play();
    }
  }

  /** Step whole frames from the current time (pauses). */
  step(frames: number): void {
    this.seek(Math.round(this.time / MASTER_FRAME + frames) * MASTER_FRAME);
  }

  /** Jump to a beat's start, keeping play / pause. */
  jumpToBeat(id: PresentationBeat['id']): void {
    const beat = MASTER_BEATS.find((b) => b.id === id);
    if (beat) this.start(beat.start, this.status === 'playing');
  }

  /** Neighbouring beat (-1 previous, +1 next), keeping play / pause. */
  jumpBeat(direction: -1 | 1): void {
    const index = MASTER_BEATS.indexOf(this.beat);
    // "Previous" from inside a beat goes to its start first, as media players do.
    const target = direction < 0 && this.time - this.beat.start > 0.5 ? this.beat : MASTER_BEATS[MathUtils.clamp(index + direction, 0, MASTER_BEATS.length - 1)]!;
    this.start(target.start, this.status === 'playing');
  }

  /** Stop where we are and hand the camera to Explore (Reset does this first). */
  stop(): void {
    if (this.status === 'idle') return;
    this.session++;
    this.timeline?.pause();
    this.release();
    // Explore may start below grade, inside the opened plant; Reset climbs out.
    cameraDirector.allowBelowGrade = cameraDirector.pose.position.y < ORBIT.minCameraY;
    cameraDirector.endCinematic();
  }

  private start(time: number, play: boolean): void {
    // One owner of the camera and the reveal: stop the other shots and tweens.
    heroShot.stop();
    heroShot.cancelClose();
    endRpvReview();
    useAppStore.getState().setSectionReview(false);
    suspendForPresentation();
    setBladeInsertion('operating');

    const timeline = this.ensureTimeline();
    const session = ++this.session;
    // Tracks start from the closed state, so: reset, then force-render the timeline at `time`
    // (a plain seek skips rendering when the playhead is already there).
    resetHeroReveal();
    timeline.pause().seek(time, true).render(time, true, true);
    revealOverlay.apply(time, heroReveal);
    setCinematicLook(this.look);
    cameraDirector.beginCinematic(
      (out) => void masterCameraAt(timeline.time(), out),
      () => {
        // Another authority took the camera (reset, a review view, a canvas rebuild).
        if (session !== this.session) return;
        timeline.pause();
        this.release();
      },
    );
    this.emit({ type: 'seek', time });
    if (play && time < this.duration) {
      timeline.play();
      this.setStatus('playing');
    } else {
      this.setStatus(time >= this.duration ? 'finished' : 'paused');
    }
  }

  private release(): void {
    setCinematicLook(null);
    this.setStatus('idle');
  }

  private finish(): void {
    if (this.status !== 'playing') return;
    // Hold the final frame: the camera source keeps evaluating the end of the path.
    this.setStatus('finished');
    this.emit({ type: 'event', id: 'sequenceComplete', time: this.duration });
  }

  private setStatus(status: MasterStatus): void {
    if (useMasterStore.getState().status === status) return;
    useMasterStore.setState({ status });
    this.emit({ type: 'status', status });
  }

  private emit(signal: MasterSignal): void {
    for (const listener of this.listeners) listener(signal);
  }

  private ensureTimeline(): gsap.core.Timeline {
    if (this.timeline) return this.timeline;
    // The overlay runs after the timeline's own tweens on every render (playback ticks).
    const timeline = buildRevealTimeline(HERO_SHOT_REVEAL, this.duration, () => this.finish(), () => revealOverlay.apply(timeline.time(), heroReveal));
    for (const [id, time] of Object.entries(MASTER_EVENTS) as [PresentationEventId, number][]) {
      if (id === 'sequenceComplete') continue; // announced by finish(), after the last frame
      timeline.call(() => this.emit({ type: 'event', id, time }), [], time);
    }
    this.timeline = timeline;
    return timeline;
  }
}

export const masterSequence = new MasterSequence();

/** The timing table (docs/stage6-review/beat-timings.json, narration, Stages 7-10). */
export function masterTimings() {
  return {
    duration: MASTER_DURATION,
    stage3: { start: 0, end: HERO_SHOT_DURATION, note: 'The approved Stage 3 hero shot, its own camera keys and reveal tracks.' },
    beats: MASTER_BEATS.map((b) => ({ id: b.id, label: b.label, start: b.start, end: b.end, takeaway: b.takeaway, events: b.events.map((id) => ({ id, time: MASTER_EVENTS[id] })), subjects: b.subjects })),
    events: Object.entries(MASTER_EVENTS).map(([id, time]) => ({ id, time })),
    camera: [...HERO_SHOT_CAMERA, ...MASTER_CAMERA.slice(1)].map((key) => ({ time: key.time, state: key.pose, ...CAMERA_STATES[key.pose] })),
    reveal: [...HERO_SHOT_REVEAL, ...MASTER_REVEAL],
    look: MASTER_LOOK,
  };
}
