/**
 * Automation hooks for review captures and measurements (dev builds and `?debug` only;
 * loaded lazily, never part of the main bundle). A headless browser drives the hero shot
 * deterministically with these, e.g. `__bwrx.shot.seek(5.8)` for a review still, or plays it
 * in real time while sampling `__bwrx.frame` for frame timing and draw calls.
 */
import { heroReveal } from '../animation/heroReveal';
import { heroShot } from '../animation/heroShot';
import { masterBeatAt, masterCameraAt, masterLookAt, masterSequence, masterTimings, type MasterSignal } from '../animation/masterSequence';
import type { PresentationBeatId } from '../config/masterSequence';
import { showRpvReviewById } from '../animation/rpvReview';
import * as explore from '../interaction/exploreActions';
import { exploreState } from '../interaction/exploreStore';
import { updateExploreVisuals } from '../interaction/exploreVisuals';
import { debugHitsAtClient, pickAtClient } from '../interaction/picking';
import type { ComponentId } from '../scene/components';
import { setBladeInsertion, type BladePattern } from '../scene/rpv/coreLayout';
import { RPV_REVIEW_STATES } from '../config/rpvReview';
import type { CameraPose, RpvReviewPoseId } from '../config/camera';
import { animationClock } from '../animation/clock';
import { cameraDirector } from '../camera/cameraDirector';
import { isPlantCutOpen } from '../camera/exploreBounds';
import { createFlowState, flowForFrame, presentationFlowAt } from '../animation/operatingFlow';
import { vesselFlowStats } from '../scene/flow/vesselFlowGeometry';
import { Vector3 } from 'three';
import { diagnosticsSample } from './diagnostics';

const api = {
  shot: {
    play: () => heroShot.play(),
    seek: (t: number) => heroShot.seek(t),
    togglePause: () => heroShot.togglePause(),
    stop: () => heroShot.stop(),
    get time() {
      return heroShot.time;
    },
    get status() {
      return heroShot.status;
    },
    duration: heroShot.duration,
  },
  /** Stage 6 master sequence. `signals` records events / seeks / status changes since load. */
  master: {
    play: () => masterSequence.play(),
    seek: (t: number) => masterSequence.seek(t),
    togglePause: () => masterSequence.togglePause(),
    stop: () => masterSequence.stop(),
    step: (frames: number) => masterSequence.step(frames),
    jumpToBeat: (id: PresentationBeatId) => masterSequence.jumpToBeat(id),
    get time() {
      return masterSequence.time;
    },
    get status() {
      return masterSequence.status;
    },
    get beat() {
      return masterSequence.beat.id;
    },
    duration: masterSequence.duration,
    timings: () => masterTimings(),
    beatAt: (t: number) => masterBeatAt(t).id,
    cameraAt: (t: number) => {
      const out = masterCameraAt(t, { position: new Vector3(), target: new Vector3(), fov: 0 });
      return { position: out.position.toArray(), target: out.target.toArray(), fov: out.fov };
    },
    lookAt: (t: number) => {
      const look = masterLookAt(t);
      return { subjects: Object.fromEntries(look.subjects), ghosts: Object.fromEntries(look.ghosts), contextDim: look.contextDim, interior: look.interior };
    },
    signals: [] as MasterSignal[],
  },
  reveal: heroReveal as Readonly<typeof heroReveal>,
  /** Stage 4 vessel review states; `immediate` jumps (deterministic captures). */
  rpvReview: {
    ids: RPV_REVIEW_STATES.map((s) => s.id),
    show: (id: RpvReviewPoseId, immediate = true) => showRpvReviewById(id, { immediate }),
    setBlades: (pattern: BladePattern) => setBladeInsertion(pattern),
  },
  camera: () => ({ ...cameraDirector.getPose(), authority: cameraDirector.authority, allowBelowGrade: cameraDirector.allowBelowGrade }),
  /** Explore navigation context and the OrbitControls limits currently applied (navigation polish). */
  navigation: () => {
    const controls = cameraDirector.controlsForDebug;
    return { cutOpen: isPlantCutOpen(), minDistance: controls?.minDistance ?? null, maxPolarAngle: controls?.maxPolarAngle ?? null, enabled: controls?.enabled ?? null };
  },
  /** Stage 5 Explore state, driven like the user would (deterministic captures pass immediate). */
  explore: {
    state: () => ({ ...exploreState(), section: { ...exploreState().section } }),
    select: (id: ComponentId | null, options?: { focus?: boolean; immediate?: boolean }) => explore.select(id, options),
    hover: (id: ComponentId | null) => explore.setHovered(id),
    clear: () => explore.clearSelection(),
    xray: (on: boolean) => explore.setXray(on),
    isolate: (on: boolean) => explore.setIsolate(on),
    labels: (on: boolean) => explore.setLabels(on),
    flow: (on: boolean) => explore.setFlow(on),
    section: (patch: Partial<{ on: boolean; context: 'plant' | 'reactor'; position: number }>, immediate = false) => explore.setSection(patch, { immediate }),
    /** Snap every explore visual to its target now. */
    settle: () => updateExploreVisuals(0, true),
    /** Every hit along the ray at a client position (diagnostics). */
    hitsAt: (x: number, y: number) => debugHitsAtClient(x, y),
    /** What a click at this client position would pick, and how long the raycast took (ms). */
    pickAt: (x: number, y: number) => {
      const t0 = performance.now();
      const hit = pickAtClient(x, y);
      return { componentId: hit?.componentId ?? null, selectableId: hit?.selectableId ?? null, instanceId: hit?.instanceId ?? null, point: hit?.point.toArray() ?? null, ms: performance.now() - t0 };
    },
  },
  /** Stage 7 operating flow: the live state, the presentation state at any master time, counts. */
  flow: {
    state: () => ({ ...flowForFrame(), intensity: { ...flowForFrame().intensity } }),
    stateAt: (t: number) => {
      const s = presentationFlowAt(t, createFlowState());
      return { ...s, intensity: { ...s.intensity } };
    },
    stats: () => ({ ...vesselFlowStats, perChannel: { ...vesselFlowStats.perChannel } }),
  },
  /** Jump the camera to an explicit pose (scripted review captures). */
  snapCamera: (pose: CameraPose) => cameraDirector.snapTo(pose),
  clock: animationClock,
  frame: diagnosticsSample as Readonly<typeof diagnosticsSample>,
};

declare global {
  interface Window {
    __bwrx?: typeof api;
  }
}

export function installAutomationApi(): void {
  window.__bwrx = api;
  masterSequence.subscribe((signal) => void api.master.signals.push(signal));
}
