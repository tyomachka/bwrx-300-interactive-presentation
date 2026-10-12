/**
 * Stage 3 hero shot playback (development / review control, not the Stage 6 presenter).
 *
 * One GSAP timeline, built once from config/heroShot.ts, animates `heroReveal`. The camera is
 * a pure function of the same timeline's time (camera/cameraPath.ts), handed to the camera
 * director as its cinematic pose source. GSAP is ticked by the shared animation clock, so:
 *  - restart is exact: state reset, timeline at 0, camera on the opening pose;
 *  - seek(t) shows exactly the frame playback shows at t (review stills, video export);
 *  - with `animationClock.fixedStep` the shot renders frame-accurately at any speed.
 */
import gsap from 'gsap';
// Side effect: GSAP must be ticked by our frame loop before any tween is created.
import './clock';
import { cameraDirector } from '../camera/cameraDirector';
import { CameraPath } from '../camera/cameraPath';
import { CAMERA_STATES } from '../config/camera';
import { HERO_SHOT_CAMERA, HERO_SHOT_DURATION, HERO_SHOT_REVEAL } from '../config/heroShot';
import { HERO_REVEAL_CLOSED, heroReveal, resetHeroReveal } from './heroReveal';
import { buildRevealTimeline } from './revealTimeline';

export type HeroShotStatus = 'idle' | 'playing' | 'paused' | 'finished';

class HeroShotController {
  readonly duration = HERO_SHOT_DURATION;
  status: HeroShotStatus = 'idle';

  private readonly path = new CameraPath(HERO_SHOT_CAMERA.map((key) => ({ time: key.time, pose: CAMERA_STATES[key.pose] })));
  private timeline: gsap.core.Timeline | null = null;
  /** Guards against a stale "camera lost" callback from an earlier run. */
  private session = 0;
  private closing: gsap.core.Timeline | null = null;

  get time(): number {
    return this.timeline?.time() ?? 0;
  }

  /** Play from the first frame. Every run is identical. */
  play(): void {
    this.start(0, true);
  }

  /** Show the exact frame at time `t` (seconds) and hold it. */
  seek(t: number): void {
    this.start(Math.min(Math.max(t, 0), this.duration), false);
  }

  togglePause(): void {
    const timeline = this.timeline;
    if (!timeline || (this.status !== 'playing' && this.status !== 'paused')) return;
    if (this.status === 'playing') {
      timeline.pause();
      this.status = 'paused';
    } else {
      timeline.play();
      this.status = 'playing';
    }
  }

  /** Stop where we are and hand the camera to Explore. The reveal stays as it is. */
  stop(): void {
    if (this.status === 'idle' || this.status === 'finished') return;
    this.session++;
    this.timeline?.pause();
    this.status = 'idle';
    cameraDirector.endCinematic();
  }

  /** Stop a running `closeReveal` (another owner is about to set the reveal). */
  cancelClose(): void {
    this.closing?.kill();
    this.closing = null;
  }

  /**
   * Close the reveal (e.g. on reset) in step with a camera transition of `duration` seconds.
   * `delay`: hold it open that long first, so a camera that starts deep inside (an Explore
   * focus below grade) leaves through the open cut before the walls close behind it.
   */
  closeReveal(duration: number, delay = 0): void {
    this.closing?.kill();
    // The ground refills last, after a reset camera has climbed out of the excavation.
    this.closing = gsap
      .timeline({ delay, onComplete: () => void (this.closing = null) })
      .to(heroReveal, { vesselCut: 0, coreSection: 0, bladeEmphasis: 0, shaftReveal: 0, containmentReveal: 0, rpvEmphasis: 0, poolsReveal: 0, duration: duration * 0.6, ease: 'power2.inOut' }, 0)
      .to(heroReveal, { exteriorDim: 0, duration, ease: 'sine.inOut' }, 0)
      .to(heroReveal, { groundCut: HERO_REVEAL_CLOSED.groundCut, duration: duration * 0.6, ease: 'power2.in' }, duration * 0.4);
  }

  private start(time: number, play: boolean): void {
    this.closing?.kill();
    this.closing = null;
    const timeline = this.ensureTimeline();
    const session = ++this.session;
    // The shot keeps its camera above grade; Explore inherits that after the shot.
    cameraDirector.allowBelowGrade = false;
    // Tracks start from the closed state, so: reset, then force-render the timeline at `time`
    // (a plain seek skips rendering when the playhead is already there).
    resetHeroReveal();
    timeline.pause().seek(time, true).render(time, true, true);
    cameraDirector.beginCinematic(
      (out) => void this.path.evaluate(timeline.time(), out),
      () => {
        // Another camera authority took over (reset, review view, canvas rebuild): just stop.
        if (session !== this.session) return;
        timeline.pause();
        this.status = 'idle';
      },
    );
    if (play && time < this.duration) {
      timeline.play();
      this.status = 'playing';
    } else {
      this.status = 'paused';
    }
  }

  private finish(): void {
    if (this.status !== 'playing') return;
    this.status = 'finished';
    // Land exactly on the final keyframe, then give the user the controls from there.
    this.path.evaluate(this.path.endTime, cameraDirector.pose);
    cameraDirector.endCinematic();
  }

  private ensureTimeline(): gsap.core.Timeline {
    this.timeline ??= buildRevealTimeline(HERO_SHOT_REVEAL, this.duration, () => this.finish());
    return this.timeline;
  }
}

export const heroShot = new HeroShotController();
