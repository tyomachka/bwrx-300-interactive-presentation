/**
 * The camera director decides who is allowed to move the camera. It is the piece that
 * lets a deterministic GSAP cinematic (Stage 6) and free Explore-mode orbiting share a
 * single camera without fighting each other.
 *
 * Exactly one authority writes the camera at any time:
 *  - `explore`    OrbitControls owns the camera (user input + damping).
 *  - `transition` a GSAP tween owns `pose`; OrbitControls is disabled.
 *  - `cinematic`  a shot's pose source (a pure function of its timeline time) writes `pose`
 *                 every frame (Stage 3 hero shot; the Stage 6 presentation later). User
 *                 input does not interrupt it.
 *
 * In the non-explore authorities, animation code only writes the plain `pose` object.
 * `update()` copies it to the camera once per frame. Handing back to Explore syncs
 * OrbitControls' target to the pose, so it continues from exactly where the tween left
 * the camera: no jump, and no leftover inertia.
 *
 * Explore navigation (only under the `explore` authority): wheel zoom towards the surface under
 * the pointer (`wheelZoom`), and a short `transition` that turns the camera to a new orbit point
 * (`pivotTo`, double-click). Where the camera and target may go depends on what is cut open
 * (exploreBounds.ts, `applyExploreLimits`).
 */
import gsap from 'gsap';
// Side effect: GSAP must be ticked by our frame loop before any tween is created.
import { animationClock } from '../animation/clock';
import { MathUtils, PerspectiveCamera, Spherical, Vector3 } from 'three';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CAMERA_STATES, CAMERA_TRANSITION, HOME_CAMERA_STATE, ORBIT, type CameraPose, type CameraStateId } from '../config/camera';
import { clampExploreTarget, inCutFootprint, isExploreTargetAllowed, isPlantCutOpen, keepCameraInCut } from './exploreBounds';

export type CameraAuthority = 'explore' | 'transition' | 'cinematic';

export interface LivePose {
  position: Vector3;
  target: Vector3;
  fov: number;
}

const _offsetA = new Spherical();
const _offsetB = new Spherical();
const _v = new Vector3();
const _a = new Vector3();
const _b = new Vector3();
const _c = new Vector3();

/**
 * Pure, deterministic pose interpolation for progress `t` in [0, 1].
 * The target moves in a straight line. The camera orbits it on an arc (radius
 * interpolated logarithmically, so a dolly feels even), instead of cutting through
 * the subject the way a straight position lerp would. `targetT` (default `t`) lets the
 * target run on its own progress (see `TransitionOptions.exitRadius`).
 */
export function interpolatePose(from: CameraPose, to: CameraPose, t: number, out: LivePose, targetT = t): LivePose {
  const fromTarget = _a.fromArray(from.target);
  const toTarget = _b.fromArray(to.target);
  _offsetA.setFromVector3(_v.fromArray(from.position).sub(fromTarget));
  _offsetB.setFromVector3(_v.fromArray(to.position).sub(toTarget));

  // Shortest way round in azimuth.
  let dTheta = (_offsetB.theta - _offsetA.theta) % (Math.PI * 2);
  if (dTheta > Math.PI) dTheta -= Math.PI * 2;
  if (dTheta < -Math.PI) dTheta += Math.PI * 2;

  const radius = Math.exp(MathUtils.lerp(Math.log(_offsetA.radius), Math.log(_offsetB.radius), t));
  const phi = MathUtils.lerp(_offsetA.phi, _offsetB.phi, t);
  const theta = _offsetA.theta + dTheta * t;

  out.target.lerpVectors(fromTarget, toTarget, targetT);
  out.position.setFromSphericalCoords(radius, phi, theta).add(out.target);
  out.fov = MathUtils.lerp(from.fov, to.fov, t);
  return out;
}

export interface TransitionOptions {
  duration?: number;
  ease?: string;
  /**
   * Back out first (metres). The orbit target holds still until the camera has dollied out to
   * this distance from it, so the camera leaves along its own sight line, through the cut it was
   * looking into, before turning towards the destination; then the target eases across. Used by
   * a reset from inside the opened plant. A start already this far out moves as usual.
   */
  exitRadius?: number;
  /**
   * `orbit` (default): the camera arcs around the moving target (interpolatePose). `linear`: camera
   * and target each move in a straight line; used to turn a nearly stationary camera to a new
   * orbit point, where an arc would swing it around.
   */
  path?: 'orbit' | 'linear';
}

/** Progress at which a transition's log-interpolated radius reaches `radius` (0 if never needed). */
function progressAtRadius(from: CameraPose, to: CameraPose, radius: number): number {
  const r0 = _v.fromArray(from.position).sub(_a.fromArray(from.target)).length();
  const r1 = _v.fromArray(to.position).sub(_a.fromArray(to.target)).length();
  if (r0 >= radius || r1 <= r0) return 0;
  return MathUtils.clamp(Math.log(radius / r0) / Math.log(r1 / r0), 0, 0.9);
}

/** Writes the cinematic camera pose for the current frame. */
export type CinematicPoseSource = (out: LivePose) => void;

interface Cinematic {
  source: CinematicPoseSource;
  /** Called if another authority (reset, transition, canvas rebuild) takes the camera away. */
  onLost: () => void;
}

class CameraDirector {
  authority: CameraAuthority = 'explore';
  /**
   * Explore normally keeps the camera above grade (ORBIT.minCameraY). The Stage 4 vessel
   * review stands inside the opened excavation and lifts that floor while it is active.
   */
  allowBelowGrade = false;
  /** Live pose written by transitions and (later) the cinematic timeline. */
  readonly pose: LivePose = { position: new Vector3(), target: new Vector3(), fov: CAMERA_STATES[HOME_CAMERA_STATE].fov };

  private camera: PerspectiveCamera | null = null;
  private controls: OrbitControls | null = null;
  /** Read-only view of the controls for the debug automation API. */
  get controlsForDebug(): Readonly<OrbitControls> | null {
    return this.controls;
  }
  private tween: gsap.core.Tween | null = null;
  private settle: (() => void) | null = null;
  private cinematic: Cinematic | null = null;
  /** Pose saved when the canvas unmounts (e.g. quality change) and restored on remount. */
  private parkedPose: CameraPose | null = null;
  /**
   * Wheel zoom still to apply, as the log of its scale: each wheel step eases out over a few
   * frames. `anchor` is the surface point under the pointer, or none (dolly towards the target).
   */
  private readonly wheel = { remaining: 0, anchor: new Vector3(), toAnchor: false };

  attach(camera: PerspectiveCamera, controls: OrbitControls): void {
    this.camera = camera;
    this.controls = controls;
    const start = this.parkedPose ?? CAMERA_STATES[HOME_CAMERA_STATE];
    this.parkedPose = null;
    this.snapTo(start);
  }

  detach(): void {
    if (this.camera) this.parkedPose = this.getPose();
    this.stopTween();
    this.dropCinematic();
    this.camera = null;
    this.controls = null;
    this.authority = 'explore';
  }

  /** The pose currently on screen, as plain data (also used by the debug "copy pose" tool). */
  getPose(): CameraPose {
    if (!this.camera) return CAMERA_STATES[HOME_CAMERA_STATE];
    const target = this.authority === 'explore' && this.controls ? this.controls.target : this.pose.target;
    return {
      position: this.camera.position.toArray() as CameraPose['position'],
      target: target.toArray() as CameraPose['target'],
      fov: this.camera.fov,
    };
  }

  /** Instant, deterministic jump. Leaves the camera in Explore mode. */
  snapTo(pose: CameraPose | CameraStateId): void {
    this.stopTween();
    this.dropCinematic();
    const p = typeof pose === 'string' ? CAMERA_STATES[pose] : pose;
    this.pose.position.fromArray(p.position);
    this.pose.target.fromArray(p.target);
    this.pose.fov = p.fov;
    this.returnToExplore();
  }

  /** Smoothly move to a named state or pose, then hand control back to Explore mode. */
  transitionTo(pose: CameraPose | CameraStateId, options: TransitionOptions = {}): Promise<void> {
    if (!this.camera) return Promise.resolve();
    const to = typeof pose === 'string' ? CAMERA_STATES[pose] : pose;
    this.takeAuthority('transition');
    const from = this.getPose();
    const progress = { t: 0 };
    const hold = options.exitRadius ? progressAtRadius(from, to, options.exitRadius) : 0;
    const targetT = (t: number) => (hold > 0 ? MathUtils.smoothstep(t, hold, 1) : t);

    return new Promise<void>((resolve) => {
      this.settle = resolve;
      this.tween = gsap.to(progress, {
        t: 1,
        duration: options.duration ?? CAMERA_TRANSITION.duration,
        ease: options.ease ?? CAMERA_TRANSITION.ease,
        onUpdate: () => {
          if (options.path === 'linear') {
            this.pose.position.fromArray(from.position).lerp(_v.fromArray(to.position), progress.t);
            this.pose.target.fromArray(from.target).lerp(_v.fromArray(to.target), progress.t);
            this.pose.fov = MathUtils.lerp(from.fov, to.fov, progress.t);
          } else interpolatePose(from, to, progress.t, this.pose, targetT(progress.t));
        },
        onComplete: () => {
          this.tween = null;
          this.returnToExplore();
          this.resolveSettle();
        },
      });
    });
  }

  reset(options: TransitionOptions = {}): Promise<void> {
    return this.transitionTo(HOME_CAMERA_STATE, options);
  }

  /**
   * Explore wheel zoom by `scale` (< 1 in, > 1 out), eased over the next frames.
   * With an `anchor` (the visible surface point under the pointer) the camera moves along the
   * line through it, so that point stays under the pointer, and the orbit target is re-seated on
   * the view axis at the anchor's depth: the next orbit or pan turns around what is being looked
   * at, and repeated steps cannot make it drift. The view direction never changes. Without an
   * anchor (pointer over the background) it is the conventional dolly towards the orbit target.
   */
  wheelZoom(scale: number, anchor: Vector3 | null): void {
    if (this.authority !== 'explore' || !this.controls?.enabled) return;
    const step = Math.log(scale);
    // Reversing the wheel drops what is left of the other direction (no rubber band).
    if (step * this.wheel.remaining < 0) this.wheel.remaining = 0;
    this.wheel.remaining += step;
    this.wheel.toAnchor = anchor !== null;
    if (anchor) this.wheel.anchor.copy(anchor);
  }

  /**
   * Explore: orbit around `point` from now on (double-click). The camera stays where it is and
   * turns to it; it moves only if the new orbit would break a limit (closer than the minimum
   * distance, or past the polar limit), and then only that far. No selection change, no marker.
   */
  pivotTo(point: Vector3): Promise<void> {
    const camera = this.camera;
    const controls = this.controls;
    if (this.authority !== 'explore' || !camera || !controls) return Promise.resolve();
    const target = clampExploreTarget(point, _a);
    const offset = _b.subVectors(camera.position, target);
    const s = _offsetA.setFromVector3(offset);
    s.radius = MathUtils.clamp(s.radius, this.minDistanceFor(camera.position, Infinity), controls.maxDistance);
    s.phi = Math.min(Math.max(s.phi, ORBIT.minPolarAngle), this.polarLimitFor(camera.position, target, s.radius, null));
    const position = offset.setFromSpherical(s).add(target);
    const to: CameraPose = { position: position.toArray() as CameraPose['position'], target: target.toArray() as CameraPose['target'], fov: camera.fov };
    return this.transitionTo(to, { duration: ORBIT.pivot.duration, ease: ORBIT.pivot.ease, path: 'linear' });
  }

  /**
   * Give the camera to a cinematic pose source until `endCinematic()` (or until another
   * authority takes it, in which case `onLost` is called). The source runs every frame.
   */
  beginCinematic(source: CinematicPoseSource, onLost: () => void): void {
    if (!this.camera) {
      onLost();
      return;
    }
    this.takeAuthority('cinematic');
    this.cinematic = { source, onLost };
    source(this.pose);
  }

  /** The shot ended normally: hold its last pose and hand the camera to Explore from there. */
  endCinematic(): void {
    if (!this.cinematic) return;
    this.cinematic = null;
    this.returnToExplore();
  }

  /** User grabbed the view mid-transition: stop where we are and give them control. */
  interrupt(): void {
    if (this.authority !== 'transition') return;
    this.stopTween();
    this.returnToExplore();
  }

  /** Called exactly once per frame, before rendering, by the frame driver. */
  update(): void {
    if (!this.camera || !this.controls) return;
    if (this.authority === 'explore') {
      this.applyWheelZoom(this.controls, animationClock.lastStep);
      this.applyExploreLimits(this.controls);
      this.controls.update();
      // Plant cut open: below grade the camera stays in the open excavation (slides along the cut).
      if (isPlantCutOpen() && keepCameraInCut(this.camera.position)) this.camera.lookAt(this.controls.target);
      return;
    }
    if (this.authority === 'cinematic') this.cinematic?.source(this.pose);
    this.applyPoseToCamera();
  }

  /**
   * Explore limits for this frame, set before `controls.update()`:
   *  - closed plant: the camera stays above ORBIT.minCameraY; with the target below grade the
   *    orbit's polar angle is capped so it does (as before);
   *  - after a below-grade focus (`allowBelowGrade`): no floor (as before);
   *  - plant cut open, camera over or in the open excavation: its floor is the excavation floor,
   *    below grade it may look up a little, and it may come closer (ORBIT.openCut).
   * Limits that differ by context (look-up angle, minimum distance) never move the camera: one the
   * current pose already exceeds is relaxed to that pose and only stops further motion, so a
   * context change (leaving the excavation, closing a cut) cannot snap the view. Floors stay hard.
   */
  private applyExploreLimits(controls: OrbitControls): void {
    const position = controls.object.position;
    const distance = position.distanceTo(controls.target);
    // Standing in the open cut below grade: a partial close of the cut later must not bury or
    // snap the camera, so from here on it is treated like a below-grade focus.
    if (position.y < ORBIT.minCameraY && isPlantCutOpen() && inCutFootprint(position)) this.allowBelowGrade = true;
    const phi = Math.acos(MathUtils.clamp((position.y - controls.target.y) / Math.max(distance, 1e-6), -1, 1));
    controls.maxPolarAngle = this.polarLimitFor(position, controls.target, distance, phi);
    controls.minDistance = this.minDistanceFor(position, distance);
  }

  /**
   * Polar limit for a camera at `position` orbiting `target` at `distance`. `currentPhi` relaxes the
   * look-up limit to the current pose (see applyExploreLimits); null gives the strict limit.
   */
  private polarLimitFor(position: Vector3, target: Vector3, distance: number, currentPhi: number | null): number {
    const inCut = isPlantCutOpen() && inCutFootprint(position);
    const lookUp = inCut && position.y < ORBIT.minCameraY ? ORBIT.openCut.maxPolarAngle : ORBIT.maxPolarAngle;
    const angular = currentPhi === null ? lookUp : Math.max(lookUp, Math.min(currentPhi, ORBIT.openCut.maxPolarAngle));
    const floorY = this.floorFor(position);
    if (floorY === null) return angular;
    const cos = MathUtils.clamp((floorY - target.y) / Math.max(distance, 1e-6), -1, 1);
    return Math.min(angular, Math.acos(cos));
  }

  /** Closest orbit distance at `position`: nearer in the open cut, never more than `distance` (no push-out). */
  private minDistanceFor(position: Vector3, distance: number): number {
    const min = isPlantCutOpen() && inCutFootprint(position) ? ORBIT.openCut.minDistance : ORBIT.minDistance;
    return Math.min(min, distance);
  }

  /** The camera's floor at `position` under the current limits (null: none). */
  private floorFor(position: Vector3): number | null {
    if (isPlantCutOpen() && inCutFootprint(position)) return ORBIT.openCut.floorY;
    return this.allowBelowGrade ? null : ORBIT.minCameraY;
  }

  /** Apply this frame's share of the pending wheel zoom (see wheelZoom). */
  private applyWheelZoom(controls: OrbitControls, dt: number): void {
    const w = this.wheel;
    if (w.remaining === 0) return;
    let step = w.remaining * (1 - Math.exp(-ORBIT.wheel.smoothing * dt));
    if (Math.abs(w.remaining - step) < 1e-4) step = w.remaining;
    w.remaining -= step;
    if (step === 0) return;
    const scale = Math.exp(step);
    const camera = controls.object.position;
    const target = controls.target;
    const { minDistance, maxDistance } = controls;
    // New distance from the zoom centre: in, never past the minimum (and never backwards);
    // out, never past the maximum.
    const next = (d: number) => (scale < 1 ? Math.max(d * scale, Math.min(minDistance, d)) : Math.min(d * scale, Math.max(maxDistance, d)));

    if (!w.toAnchor) {
      const offset = _a.subVectors(camera, target);
      const r = offset.length();
      const r1 = next(r);
      if (r1 === r || r === 0) w.remaining = 0;
      else camera.copy(target).addScaledVector(offset, r1 / r);
      return;
    }

    const toAnchor = _a.subVectors(w.anchor, camera);
    const d = toAnchor.length();
    let d1 = d > 0 ? next(d) : d;
    // Moving down the line (in towards a point below, or out away from one above): stop at the
    // camera's floor.
    const floor = this.floorFor(camera);
    const drop = d > 0 ? toAnchor.y * (1 - d1 / d) : 0;
    if (floor !== null && drop < 0 && camera.y + drop < floor) d1 = camera.y <= floor ? d : d * (1 - (floor - camera.y) / toAnchor.y);
    if (!(d > 0) || Math.abs(d1 - d) < 1e-6) {
      w.remaining = 0;
      return;
    }
    const view = _b.subVectors(target, camera).normalize();
    camera.addScaledVector(toAnchor, 1 - d1 / d);
    // Re-seat the target on the (unchanged) view axis at the anchor's depth, but not beyond the
    // allowed target volume: there the axis would leave it (e.g. into the ground) and the bounds
    // clamp would shift the whole view.
    let depth = MathUtils.clamp(_a.subVectors(w.anchor, camera).dot(view), minDistance, maxDistance);
    const axisPoint = (t: number) => _c.copy(camera).addScaledVector(view, t);
    if (!isExploreTargetAllowed(axisPoint(depth)) && isExploreTargetAllowed(axisPoint(minDistance))) {
      let lo = minDistance;
      let hi = depth;
      for (let i = 0; i < 16; i++) {
        const mid = (lo + hi) / 2;
        if (isExploreTargetAllowed(axisPoint(mid))) lo = mid;
        else hi = mid;
      }
      depth = lo;
    }
    target.copy(camera).addScaledVector(view, depth);
  }

  private applyPoseToCamera(): void {
    const camera = this.camera;
    if (!camera) return;
    camera.position.copy(this.pose.position);
    camera.lookAt(this.pose.target);
    if (camera.fov !== this.pose.fov) {
      camera.fov = this.pose.fov;
      camera.updateProjectionMatrix();
    }
  }

  private takeAuthority(next: Exclude<CameraAuthority, 'explore'>): void {
    this.stopTween();
    this.dropCinematic();
    this.wheel.remaining = 0;
    const controls = this.controls;
    if (this.authority === 'explore' && controls) {
      // Flush damping inertia with one undamped update so it cannot resume later.
      const damping = controls.enableDamping;
      controls.enableDamping = false;
      controls.update();
      controls.enableDamping = damping;
      controls.enabled = false;
    }
    this.authority = next;
  }

  private returnToExplore(): void {
    const controls = this.controls;
    if (controls && this.camera) {
      // The final tween value may not have been rendered yet; OrbitControls reads the camera.
      this.applyPoseToCamera();
      controls.target.copy(this.pose.target);
      controls.enabled = true;
      // Limits for *this* pose before the hand-over update: a polar limit left over from the
      // previous view would otherwise snap the camera (e.g. after a below-grade focus move).
      this.applyExploreLimits(controls);
      controls.update();
    }
    this.wheel.remaining = 0;
    this.authority = 'explore';
  }

  private stopTween(): void {
    this.tween?.kill();
    this.tween = null;
    this.resolveSettle();
  }

  /** Someone else is taking the camera from a running cinematic: tell its owner. */
  private dropCinematic(): void {
    const cinematic = this.cinematic;
    this.cinematic = null;
    cinematic?.onLost();
  }

  private resolveSettle(): void {
    const settle = this.settle;
    this.settle = null;
    settle?.();
  }
}

/** One director per page. It outlives canvas remounts, so the camera pose survives them. */
export const cameraDirector = new CameraDirector();
