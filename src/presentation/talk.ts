/**
 * Presentation v1 controller: the 7-minute talk as presenter stops (keys), each a short automatic
 * choreography that then holds (loops keep running) until the next key.
 *
 *   next      Right Arrow / Space / Page Down   the next stop's choreography
 *   prev      Left Arrow / Page Up             the previous stop, settled at its final state
 *   home      Home                             back to the opening (its choreography)
 *   reset     R                                stop and reset: dip to dark, the current stop
 *                                              re-established at its final state (nothing runs on)
 *   exit      Esc                              hand the camera to Explore where it is
 *
 * A stop is a beat the presenter enters plus the beats that follow it automatically (`after`,
 * presentation/types.ts): one press = one idea. While a stop plays, a forward press is ignored for its
 * `lock` (a double press never skips an idea); after that a press goes straight to the next stop,
 * which takes over from whatever is on screen (nothing snaps, the rest of the old choreography is
 * simply not played). Back always lands on a stop's final state, never inside a choreography.
 *
 * The 48 s master sequence stays separate and untouched; starting one stops the other.
 */
import { create } from 'zustand';
import { animationClock } from '../animation/clock';
import { heroShot } from '../animation/heroShot';
import { masterSequence } from '../animation/masterSequence';
import { snapSafetyOff } from '../animation/passiveSafety';
import { snapControlToBase } from '../animation/reactorControl';
import { endRpvReview } from '../animation/rpvReview';
import { cameraDirector } from '../camera/cameraDirector';
import { ORBIT, type CameraPose } from '../config/camera';
import { releaseCinematicLook, setCinematicLook } from '../interaction/exploreVisuals';
import { suspendForPresentation } from '../interaction/exploreActions';
import { setBladeInsertion } from '../scene/rpv/coreLayout';
import { useAppStore } from '../state/store';
import { CHAPTERS } from './chapters';
import { TALK } from './config';
import { installTalkEffects, removeTalkEffects } from './effects';
import { resolveTalk, type ResolvedBeat } from './resolve';
import { beatTime, clearRuntime, currentEntry, enterBeat, talkCameraSource, talkLook, type EntryOptions } from './runtime';
import type { EntryMode } from './types';

export const TALK_BEATS: readonly ResolvedBeat[] = resolveTalk(CHAPTERS);

/** The presenter stops: the first beat of each (flat index). */
export const TALK_STOPS: readonly number[] = TALK_BEATS.filter((b) => !b.auto).map((b) => b.flat);

export interface TalkUiState {
  /** The talk owns the scene. */
  active: boolean;
  /** Current beat (flat index); remembered after Esc so the talk resumes there. */
  flat: number;
  mode: EntryMode;
  /** Bumped on every entry (the overlay restarts its one-shot animations). */
  entry: number;
  /** Ever started in this page (resume vs first start). */
  started: boolean;
  /** Forward presses that advanced a stop since the opening (debug / review). */
  presses: number;
}

export const useTalkStore = create<TalkUiState>()(() => ({ active: false, flat: 0, mode: 'settle', entry: 0, started: false, presses: 0 }));

/** The talk's look source (a stable function, so it can be withdrawn only if still installed). */
const lookSource = () => talkLook;

/** The view on screen: the director's pose under a cinematic, else Explore's camera. */
function livePose(): CameraPose {
  if (cameraDirector.authority === 'cinematic') {
    const p = cameraDirector.pose;
    return { position: p.position.toArray() as CameraPose['position'], target: p.target.toArray() as CameraPose['target'], fov: p.fov };
  }
  return cameraDirector.getPose();
}

class TalkController {
  private lockUntil = 0;
  private cameraOwned = false;
  /** The camera was taken by a canvas rebuild (quality change, lost context): resume when ready. */
  private awaitingCanvas = false;

  get active(): boolean {
    return useTalkStore.getState().active;
  }

  get flat(): number {
    return useTalkStore.getState().flat;
  }

  get beat(): ResolvedBeat {
    return TALK_BEATS[this.flat]!;
  }

  get locked(): boolean {
    return animationClock.time < this.lockUntil;
  }

  /** Enter the talk from Explore (or the start button): resume where it was left, or from the top. */
  start(): void {
    if (!sceneReady()) return;
    const { started, flat } = useTalkStore.getState();
    const live = this.activate();
    // The very first entry plays the opening; a resume settles where the talk was left.
    if (started) this.enter(TALK_BEATS[flat]!.stopLast, 'settle', { live });
    else this.enter(0, 'play', { live });
  }

  next(): void {
    if (!this.active) {
      this.start();
      return;
    }
    const following = this.beat.stopLast + 1;
    if (this.locked || following >= TALK_BEATS.length) return; // the closing composition holds
    this.enter(following, 'play');
    useTalkStore.setState((s) => ({ presses: s.presses + 1 }));
  }

  prev(): void {
    if (!this.active || this.locked) return;
    const stop = this.beat.stop;
    this.enter(stop === 0 ? this.beat.stopLast : TALK_BEATS[this.beat.stopFirst - 1]!.stopLast, 'settle');
  }

  home(): void {
    if (!sceneReady()) return;
    const live = this.activate();
    this.enter(0, 'play', { live });
    useTalkStore.setState({ presses: 0 });
  }

  /** Stop and reset: everything the talk drives re-established at the current stop's final state, behind a dip. */
  reset(): void {
    if (!this.active) return;
    const live = this.activate();
    this.enter(this.beat.stopLast, 'settle', { cut: true, live });
  }

  /** Debug / automation: any beat, settled or with its own choreography (ignores the input lock). */
  jump(flat: number, mode: EntryMode = 'settle'): void {
    if (!sceneReady()) return;
    const target = Math.min(Math.max(0, Math.round(flat)), TALK_BEATS.length - 1);
    const live = this.activate();
    if (mode === 'play' && target > 0) {
      // The beat's own entry, from the settled state of the beat before it.
      const before = TALK_BEATS[target - 1]!;
      this.enter(target - 1, 'settle', { instant: true, live: before.finalPose });
      this.enter(target, 'play', { live: before.finalPose });
      return;
    }
    this.enter(target, mode, mode === 'settle' ? { cut: true, live } : { live });
  }

  /** Debug / automation: a presenter stop (0-based) with its choreography, from the previous stop settled. */
  jumpStop(stop: number, mode: EntryMode = 'play'): void {
    const first = TALK_STOPS[Math.min(Math.max(0, Math.round(stop)), TALK_STOPS.length - 1)]!;
    if (mode === 'play') {
      if (first === 0) {
        this.jump(0, 'play');
        return;
      }
      if (!sceneReady()) return;
      const before = TALK_BEATS[first - 1]!; // the previous stop's final beat
      const live = this.activate();
      this.enter(before.flat, 'settle', { instant: true, live });
      this.enter(first, 'play', { live: before.finalPose });
      return;
    }
    this.jump(TALK_BEATS[first]!.stopLast, 'settle');
  }

  /**
   * Per frame, before the talk's evaluation (talk driver): enter the stop's automatic continuations at
   * their scheduled moments (exact clock times, so a fixed-step capture plays the same every time).
   */
  update(): void {
    if (!this.active) return;
    for (let guard = 0; guard < 8; guard++) {
      const e = currentEntry();
      const following = TALK_BEATS[this.flat + 1];
      if (!e || e.mode !== 'play' || !following?.auto || following.stop !== this.beat.stop) return;
      const after = following.beat.after!;
      if (beatTime() < after) return;
      this.enter(following.flat, 'play', { continueAt: e.start + after });
    }
  }

  /** Esc: leave the talk; Explore takes over at the current view. The position is remembered. */
  exit(): void {
    if (!this.active) return;
    useTalkStore.setState({ active: false });
    this.cameraOwned = false;
    this.releaseScene();
    cameraDirector.allowBelowGrade = cameraDirector.pose.position.y < ORBIT.minCameraY;
    cameraDirector.endCinematic();
  }

  private enter(flat: number, mode: EntryMode, options: EntryOptions & { live?: CameraPose } = {}): void {
    const beat = TALK_BEATS[flat]!;
    enterBeat(beat, mode, options.live ?? livePose(), options);
    // A continuation keeps its stop's lock; a stop entered with its choreography locks for its own.
    if (options.continueAt === undefined) this.lockUntil = animationClock.time + (mode === 'play' ? beat.lock : TALK.settle.lock);
    useTalkStore.setState((s) => ({ flat, mode, entry: s.entry + 1 }));
  }

  /** Take the scene and the camera; returns the view on screen before taking it. Idempotent. */
  private activate(): CameraPose {
    const live = livePose();
    if (masterSequence.status !== 'idle') masterSequence.stop();
    heroShot.stop();
    heroShot.cancelClose();
    endRpvReview();
    useAppStore.getState().setSectionReview(false);
    suspendForPresentation();
    if (!this.active) setBladeInsertion('operating');
    installTalkEffects();
    setCinematicLook(lookSource);
    useTalkStore.setState({ active: true, started: true });
    if (!(this.cameraOwned && cameraDirector.authority === 'cinematic')) {
      this.cameraOwned = true;
      cameraDirector.beginCinematic(talkCameraSource, () => this.onCameraLost());
    }
    return live;
  }

  private releaseScene(): void {
    removeTalkEffects();
    releaseCinematicLook(lookSource);
    clearRuntime();
    snapControlToBase();
    snapSafetyOff();
    setBladeInsertion('operating');
  }

  private onCameraLost(): void {
    this.cameraOwned = false;
    if (!this.active) return;
    // A canvas rebuild detaches the camera; anything else taking it (the 48 s cinematic, a
    // review tool) ends the talk cleanly, without touching what the newcomer set up.
    if (!sceneReady()) {
      this.awaitingCanvas = true;
      return;
    }
    useTalkStore.setState({ active: false });
    this.releaseScene();
  }

  /** The canvas is back after a rebuild: re-establish the current beat at once. */
  canvasReady(): void {
    if (!this.awaitingCanvas || !this.active) return;
    this.awaitingCanvas = false;
    this.activate();
    this.enter(this.flat, 'settle', { instant: true, live: this.beat.finalPose });
  }
}

const sceneReady = () => useAppStore.getState().status === 'ready';

export const talk = new TalkController();

useAppStore.subscribe((s, prev) => {
  if (s.status === 'ready' && prev.status !== 'ready') talk.canvasReady();
});

/** Seconds after entry when a beat's own choreography has finished (camera, timed changes, cues). */
export function settleTime(b: ResolvedBeat): number {
  const spec = b.beat;
  const cut = spec.camera?.cut ? (spec.camera.dive?.at(-1)?.at ?? 0) + TALK.cut.out : 0;
  const ends = [
    ...(spec.camera?.keys ?? []).map((k) => k.at),
    spec.camera?.master ? (spec.camera.master.delay ?? 0) + (spec.camera.master.to - spec.camera.master.from) / (spec.camera.master.speed ?? 1) : 0,
    ...Object.values(spec.worldTiming ?? {}).map((t) => (t?.delay ?? 0) + (t?.duration ?? 0)),
    ...[...b.cueOwner.values()].filter((c) => c.flat === b.flat).map((c) => (c.spec.delay ?? 0) + c.spec.duration),
    ...Object.values(spec.reveal?.tracks ?? {}).map((t) => (t?.delay ?? 0) + (t?.duration ?? 0)),
    spec.reveal?.timing ? (spec.reveal.timing.delay ?? 0) + (spec.reveal.timing.duration ?? 0) : 0,
  ];
  return cut + Math.max(1.6, ...ends);
}

/** Seconds after `b` is entered at which its continuation starts (auto beats only). */
const offsetInStop = (b: ResolvedBeat) => {
  let t = 0;
  for (let f = b.stopFirst + 1; f <= b.flat; f++) t += TALK_BEATS[f]!.beat.after ?? 0;
  return t;
};

/** Seconds after a stop is entered (its first beat, after any dip) when its whole choreography has settled. */
export function stopSettleTime(stop: number): number {
  const beats = TALK_BEATS.filter((b) => b.stop === stop);
  return Math.max(...beats.map((b) => offsetInStop(b) + settleTime(b)));
}

/** Diagnostics: the beat list for the debug panel and the review document. */
export const talkOutline = () =>
  TALK_BEATS.map((b) => ({
    flat: b.flat,
    chapter: b.chapter.id,
    chapterIndex: b.chapterIndex,
    beat: b.beat.id,
    beatIndex: b.beatIndex,
    stop: b.stop,
    auto: b.auto,
    after: b.beat.after ?? null,
    note: b.beat.note,
    lock: b.lock,
    settle: +settleTime(b).toFixed(2),
  }));

/** Diagnostics: the presenter stops (what one press plays), for the debug panel and the review. */
export const stopOutline = () =>
  TALK_STOPS.map((first, stop) => {
    const b = TALK_BEATS[first]!;
    const beats = TALK_BEATS.filter((x) => x.stop === stop);
    return {
      stop,
      first,
      last: b.stopLast,
      chapter: b.chapter.id,
      chapterIndex: b.chapterIndex,
      id: `${b.chapter.id}/${b.beat.id}`,
      beats: beats.map((x) => `${x.chapter.id}/${x.beat.id}${x.auto ? `@${x.beat.after}` : ''}`),
      lock: b.lock,
      settle: +stopSettleTime(stop).toFixed(2),
    };
  });
