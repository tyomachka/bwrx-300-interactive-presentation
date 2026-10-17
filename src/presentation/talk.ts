/**
 * Presentation v1 controller: the 7-minute talk as a manual sequence of beats (presenter keys).
 *
 *   next      Right Arrow / Space / Page Down   the next beat's choreography (ignored while the
 *                                              beat's important transition locks input)
 *   prev      Left Arrow / Page Up             the previous beat, settled (no one-shots replayed)
 *   home      Home                             back to the first beat
 *   reset     R                                safe reset: dip to dark, the current beat re-established
 *   exit      Esc                              hand the camera to Explore where it is
 *
 * There is no timer: after a transition the scene waits (loops keep running) until the next key.
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
import { clearRuntime, enterBeat, talkCameraSource, talkLook, type EntryOptions } from './runtime';
import type { EntryMode } from './types';
import { applyStudy } from './study/studyChapters';
import { studyDirection } from './study/studyMode';

const study = import.meta.env.MODE !== 'portable' ? studyDirection() : null;

/**
 * The script, resolved. With the design study (`?study=` / `?designStudy=1`, never in the portable
 * build) five states and four motion prototypes are patched in, and the review mode swaps the
 * direction in place (replaceTalkBeats): same length, same order, so every index stays valid.
 */
export const TALK_BEATS: ResolvedBeat[] = resolveTalk(study ? applyStudy(CHAPTERS, study) : CHAPTERS);

/** Design study review only: the beats of another direction (the current beat is re-entered by the caller). */
export function replaceTalkBeats(beats: readonly ResolvedBeat[]): void {
  if (beats.length !== TALK_BEATS.length) throw new Error('[study] a direction must keep the beat list');
  TALK_BEATS.splice(0, TALK_BEATS.length, ...beats);
}

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
}

export const useTalkStore = create<TalkUiState>()(() => ({ active: false, flat: 0, mode: 'settle', entry: 0, started: false }));

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
    this.enter(started ? flat : 0, started ? 'settle' : 'play', { live });
  }

  next(): void {
    if (!this.active) {
      this.start();
      return;
    }
    if (this.locked || this.flat >= TALK_BEATS.length - 1) return; // the closing composition holds
    this.enter(this.flat + 1, 'play');
  }

  prev(): void {
    if (!this.active || this.locked) return;
    this.enter(Math.max(0, this.flat - 1), 'settle');
  }

  home(): void {
    if (!sceneReady()) return;
    const live = this.activate();
    this.enter(0, 'play', { live });
  }

  /** Safe reset: everything the talk drives is re-established for the current beat, behind a dip. */
  reset(): void {
    if (!this.active) return;
    const live = this.activate();
    this.enter(this.flat, 'settle', { cut: true, live });
  }

  /**
   * Debug / automation: any beat, settled or with its own choreography (ignores the input lock).
   * `instant` (design-study review): the beat's resting state this frame, with no move and no dip.
   */
  jump(flat: number, mode: EntryMode = 'settle', instant = false): void {
    if (!sceneReady()) return;
    const target = Math.min(Math.max(0, Math.round(flat)), TALK_BEATS.length - 1);
    const live = this.activate();
    if (instant) {
      this.enter(target, 'settle', { instant: true, live: TALK_BEATS[target]!.finalPose });
      return;
    }
    if (mode === 'play' && target > 0) {
      // The beat's own entry, from the settled state of the beat before it.
      const before = TALK_BEATS[target - 1]!;
      this.enter(target - 1, 'settle', { instant: true, live: before.finalPose });
      this.enter(target, 'play', { live: before.finalPose });
      return;
    }
    this.enter(target, mode, mode === 'settle' ? { cut: true, live } : { live });
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
    this.lockUntil = animationClock.time + (mode === 'play' ? beat.lock : TALK.settle.lock);
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
    ...Object.values(spec.cues ?? {}).map((c) => (c.delay ?? 0) + c.duration),
    ...Object.values(spec.reveal?.tracks ?? {}).map((t) => (t?.delay ?? 0) + (t?.duration ?? 0)),
    spec.reveal?.timing ? (spec.reveal.timing.delay ?? 0) + (spec.reveal.timing.duration ?? 0) : 0,
  ];
  return cut + Math.max(1.6, ...ends);
}

/** Diagnostics: the beat list for the debug panel and the review document. */
export const talkOutline = () =>
  TALK_BEATS.map((b) => ({ flat: b.flat, chapter: b.chapter.id, chapterIndex: b.chapterIndex, beat: b.beat.id, beatIndex: b.beatIndex, note: b.beat.note, lock: b.lock, settle: +settleTime(b).toFixed(2) }));
