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
 */
import gsap from 'gsap';
// Side effect: GSAP must be ticked by our frame loop before any tween is created.
import '../animation/clock';
import { MathUtils, PerspectiveCamera, Spherical, Vector3 } from 'three';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CAMERA_STATES, CAMERA_TRANSITION, HOME_CAMERA_STATE, ORBIT, type CameraPose, type CameraStateId } from '../config/camera';

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

/**
 * Pure, deterministic pose interpolation for progress `t` in [0, 1].
 * The target moves in a straight line. The camera orbits it on an arc (radius
 * interpolated logarithmically, so a dolly feels even), instead of cutting through
 * the subject the way a straight position lerp would.
 */
export function interpolatePose(from: CameraPose, to: CameraPose, t: number, out: LivePose): LivePose {
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

  out.target.lerpVectors(fromTarget, toTarget, t);
  out.position.setFromSphericalCoords(radius, phi, theta).add(out.target);
  out.fov = MathUtils.lerp(from.fov, to.fov, t);
  return out;
}

export interface TransitionOptions {
  duration?: number;
  ease?: string;
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
  /** Live pose written by transitions and (later) the cinematic timeline. */
  readonly pose: LivePose = { position: new Vector3(), target: new Vector3(), fov: CAMERA_STATES[HOME_CAMERA_STATE].fov };

  private camera: PerspectiveCamera | null = null;
  private controls: OrbitControls | null = null;
  private tween: gsap.core.Tween | null = null;
  private settle: (() => void) | null = null;
  private cinematic: Cinematic | null = null;
  /** Pose saved when the canvas unmounts (e.g. quality change) and restored on remount. */
  private parkedPose: CameraPose | null = null;

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

    return new Promise<void>((resolve) => {
      this.settle = resolve;
      this.tween = gsap.to(progress, {
        t: 1,
        duration: options.duration ?? CAMERA_TRANSITION.duration,
        ease: options.ease ?? CAMERA_TRANSITION.ease,
        onUpdate: () => void interpolatePose(from, to, progress.t, this.pose),
        onComplete: () => {
          this.tween = null;
          this.returnToExplore();
          this.resolveSettle();
        },
      });
    });
  }

  reset(): Promise<void> {
    return this.transitionTo(HOME_CAMERA_STATE);
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
      this.keepCameraAboveGrade(this.controls);
      this.controls.update();
      return;
    }
    if (this.authority === 'cinematic') this.cinematic?.source(this.pose);
    this.applyPoseToCamera();
  }

  /**
   * With the target below grade (plant opened up), cap the orbit's polar angle so the camera
   * stays above ORBIT.minCameraY. With the target above grade this is the normal limit.
   */
  private keepCameraAboveGrade(controls: OrbitControls): void {
    const distance = controls.object.position.distanceTo(controls.target);
    const cos = MathUtils.clamp((ORBIT.minCameraY - controls.target.y) / Math.max(distance, 1e-6), -1, 1);
    controls.maxPolarAngle = Math.min(ORBIT.maxPolarAngle, Math.acos(cos));
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
      controls.update();
    }
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
