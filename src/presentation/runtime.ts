/**
 * Presentation v1 runtime: from the entered beat and the time since, everything a frame shows.
 *
 * On entering a beat the runtime snapshots the live state (camera pose, reveal, look, world) and
 * from then on every value is a function of (snapshot, the beat's resolved target, time since
 * entry): no history beyond that one snapshot, so forward steps, backward steps, jumps and a reset
 * all use the same code, and a fixed-step clock renders the same frames every time.
 *
 *  - play: the beat's own choreography (camera keys or a reused master segment, reveal tracks,
 *    world-channel timings, one-shot cues);
 *  - settle: a short, uniform move to the beat's resting state (backward steps, jumps, reset), with
 *    one-shot cues already complete.
 *
 * A cut dips to dark first; until the dip is complete the old view holds, then the new place is
 * established at once (only what a beat times explicitly animates after the dip).
 *
 * Frame order: the camera source runs inside FrameDriver (-100), `evaluateTalkFrame` in the talk
 * driver (-97), before the control / safety drivers (-95), the reveal (-90) and the effects (-80).
 */
import gsap from 'gsap';
import { MathUtils, Spherical, Vector3 } from 'three';
import { animationClock } from '../animation/clock';
import { HERO_REVEAL_CLOSED, heroReveal, type HeroRevealState } from '../animation/heroReveal';
import { masterCameraAt, masterLookAt } from '../animation/masterSequence';
import { interpolatePose, type LivePose } from '../camera/cameraDirector';
import { CameraPath } from '../camera/cameraPath';
import type { CameraPose } from '../config/camera';
import type { CinematicLook } from '../interaction/exploreVisuals';
import type { ComponentId } from '../scene/components';
import type { InteriorLevel } from '../scene/section/sectionLayers';
import { TALK } from './config';
import { masterRevealAt } from './legacy';
import { poseOf, type ResolvedBeat, type ResolvedLook } from './resolve';
import type { EntryMode, Timing } from './types';
import { cues, talkClock, world, WORLD_CHANNEL_IDS, WORLD_CHANNELS, restingWorld, type WorldState } from './world';

const REVEAL_KEYS = Object.keys(HERO_REVEAL_CLOSED) as (keyof HeroRevealState)[];

// ---- Easing -------------------------------------------------------------------------------------------

const easeCache = new Map<string, (x: number) => number>();
function easeFn(name = 'sine.inOut'): (x: number) => number {
  let fn = easeCache.get(name);
  if (!fn) {
    fn = gsap.parseEase(name) ?? ((x: number) => x);
    easeCache.set(name, fn);
  }
  return fn;
}

/** Progress (0..1) of a timed change at `tau` seconds into the beat. */
function progress(tau: number, timing: Timing): number {
  const delay = timing.delay ?? 0;
  if (tau < delay) return 0;
  const duration = timing.duration ?? 0;
  if (duration <= 0) return 1;
  return easeFn(timing.ease)(Math.min(1, (tau - delay) / duration));
}

const SNAP: Timing = { duration: 0 };

// ---- Camera -------------------------------------------------------------------------------------------

interface CameraPlan {
  t0: number;
  cut: boolean;
  /** With a cut: seconds of `pre` (a move from the live view) before the dip starts. */
  cutAt: number;
  pre: CameraPath | null;
  /** The view on screen when the plan started (held through a dip). */
  from: CameraPose;
  path: CameraPath | null;
  hold: CameraPose | null;
  master: { from: number; to: number; speed: number; delay: number; blendFrom: CameraPose | null } | null;
  /** Seconds after the dip when the move ends and the breathing starts. */
  end: number;
  drift: number;
}

const _a = new Vector3();
const _b = new Vector3();
const _s = new Spherical();
const _blend: LivePose = { position: new Vector3(), target: new Vector3(), fov: 35 };
const _blendPose = { position: [0, 0, 0], target: [0, 0, 0], fov: 35 } as CameraPose;

const close = (a: CameraPose, b: CameraPose, eps = 0.02) =>
  _a.fromArray(a.position).distanceTo(_b.fromArray(b.position)) < eps && _a.fromArray(a.target).distanceTo(_b.fromArray(b.target)) < eps && Math.abs(a.fov - b.fov) < 1e-3;

const targetDistance = (a: CameraPose, b: CameraPose) => _a.fromArray(a.target).distanceTo(_b.fromArray(b.target));

function buildCameraPlan(beat: ResolvedBeat, mode: EntryMode, live: CameraPose, t0: number): CameraPlan {
  const base = { t0, from: live, cutAt: 0, pre: null, path: null, hold: null, master: null, end: 0, drift: beat.drift } as CameraPlan;
  if (mode === 'settle' || !beat.shot) {
    const final = beat.finalPose;
    if (close(live, final)) return { ...base, cut: false, hold: final };
    if (targetDistance(live, final) > TALK.cutDistance) return { ...base, cut: true, hold: final };
    return { ...base, cut: false, path: new CameraPath([{ time: 0, pose: live }, { time: TALK.settle.camera, pose: final }]), end: TALK.settle.camera };
  }
  const shot = beat.shot;
  const cut = shot.cut ?? false;
  if (cut && shot.dive?.length) {
    const dive = [{ time: 0, pose: live }, ...shot.dive.map((k) => ({ time: k.at, pose: poseOf(k.pose) }))];
    base.pre = new CameraPath(dive);
    base.cutAt = dive[dive.length - 1]!.time;
  }
  if (shot.master) {
    const { from, to, speed = 1, delay = 0 } = shot.master;
    return { ...base, cut, master: { from, to, speed, delay, blendFrom: cut ? null : live }, end: delay + (to - from) / speed };
  }
  const keys = (shot.keys ?? []).map((k) => ({ time: k.at, pose: poseOf(k.pose) }));
  if (!cut) keys.unshift({ time: 0, pose: live });
  if (keys.length === 1) return { ...base, cut, hold: keys[0]!.pose };
  if (keys.length === 0) return { ...base, cut: false, hold: live };
  return { ...base, cut, path: new CameraPath(keys), end: keys[keys.length - 1]!.time };
}

let plan: CameraPlan | null = null;

const masterTime = (m: NonNullable<CameraPlan['master']>, tau: number) => MathUtils.clamp(m.from + (tau - m.delay) * m.speed, m.from, m.to);

function writePose(out: LivePose, pose: CameraPose): void {
  out.position.fromArray(pose.position);
  out.target.fromArray(pose.target);
  out.fov = pose.fov;
}

/** Slow, bounded breathing on a hold: starts at rest (zero offset, zero velocity). */
function breathe(out: LivePose, hold: number, amount: number): void {
  if (amount <= 0 || hold <= 0) return;
  const B = TALK.breathing;
  const ramp = MathUtils.smoothstep(hold, 0, B.rampIn);
  const [p1, p2] = B.periods;
  const w1 = (Math.PI * 2 * hold) / p1;
  const w2 = (Math.PI * 2 * hold) / p2;
  const offset = _a.subVectors(out.position, out.target);
  _s.setFromVector3(offset);
  _s.theta += MathUtils.degToRad(B.azimuthDeg) * amount * ramp * (0.75 * Math.sin(w1) + 0.25 * Math.sin(w2));
  _s.phi += MathUtils.degToRad(B.polarDeg) * amount * ramp * Math.sin(w2);
  _s.radius *= 1 + B.radius * amount * ramp * Math.sin(w1 + 0.9) * Math.sin(w2 * 0.5);
  out.position.setFromSpherical(_s).add(out.target);
}

/** Debug only (composition previews): hold this pose instead of the beat's camera. */
let cameraOverride: CameraPose | null = null;
export function overrideTalkCamera(pose: CameraPose | null): void {
  cameraOverride = pose;
}

/** The camera director's pose source while the talk owns the camera. */
export function talkCameraSource(out: LivePose): void {
  if (cameraOverride) {
    writePose(out, cameraOverride);
    return;
  }
  const p = plan;
  if (!p) return;
  const local = animationClock.time - p.t0;
  const tau = local - (p.cut ? p.cutAt + TALK.cut.out : 0);
  if (p.cut && tau < 0) {
    if (p.pre) p.pre.evaluate(local, out);
    else writePose(out, p.from);
    return;
  }
  if (p.master) {
    masterCameraAt(masterTime(p.master, tau), out);
    // Entered without a dip: ease from the live view onto the master path over its first second.
    if (p.master.blendFrom && tau < 1) {
      _blendPose.position = out.position.toArray() as CameraPose['position'];
      _blendPose.target = out.target.toArray() as CameraPose['target'];
      _blendPose.fov = out.fov;
      interpolatePose(p.master.blendFrom, _blendPose, MathUtils.smootherstep(tau, 0, 1), _blend);
      out.position.copy(_blend.position);
      out.target.copy(_blend.target);
      out.fov = _blend.fov;
    }
  } else if (p.path) p.path.evaluate(tau, out);
  else if (p.hold) writePose(out, p.hold);
  breathe(out, tau - p.end, p.drift);
}

// ---- Look ---------------------------------------------------------------------------------------------

interface LookValues {
  subjects: Map<ComponentId, number>;
  ghosts: Map<ComponentId, number>;
  contextDim: number;
  interior: Set<InteriorLevel>;
}

const emptyLook = (): LookValues => ({ subjects: new Map(), ghosts: new Map(), contextDim: 0, interior: new Set() });
const copyLook = (l: LookValues): LookValues => ({ subjects: new Map(l.subjects), ghosts: new Map(l.ghosts), contextDim: l.contextDim, interior: new Set(l.interior) });

function lookFromResolved(r: ResolvedLook): LookValues {
  return {
    subjects: new Map(Object.entries(r.subjects) as [ComponentId, number][]),
    ghosts: new Map(Object.entries(r.ghosts) as [ComponentId, number][]),
    contextDim: r.contextDim,
    interior: new Set(r.interior),
  };
}

/** The live look, as the Explore visuals read it (setCinematicLook). */
const liveLook: LookValues = emptyLook();
const interiorRecord: Partial<Record<InteriorLevel, boolean>> = {};
export const talkLook: CinematicLook = { subjects: liveLook.subjects, ghosts: liveLook.ghosts, contextDim: 0, interior: interiorRecord };

function blendMaps(out: Map<ComponentId, number>, from: Map<ComponentId, number>, to: Map<ComponentId, number>, p: number): void {
  out.clear();
  for (const [id, a] of from) out.set(id, a + ((to.get(id) ?? 0) - a) * p);
  for (const [id, b] of to) if (!from.has(id)) out.set(id, b * p);
}

function applyLook(from: LookValues, to: LookValues, p: number): void {
  blendMaps(liveLook.subjects, from.subjects, to.subjects, p);
  blendMaps(liveLook.ghosts, from.ghosts, to.ghosts, p);
  liveLook.contextDim = from.contextDim + (to.contextDim - from.contextDim) * p;
  liveLook.interior.clear();
  for (const level of to.interior) liveLook.interior.add(level);
  // What was drawn stays drawn until the change is complete (nothing pops while it fades).
  if (p < 1) for (const level of from.interior) liveLook.interior.add(level);
  talkLook.contextDim = liveLook.contextDim;
  for (const key of Object.keys(interiorRecord) as InteriorLevel[]) delete interiorRecord[key];
  for (const level of liveLook.interior) interiorRecord[level] = true;
}

function setLookFromMaster(m: number): void {
  const look = masterLookAt(m);
  liveLook.subjects.clear();
  for (const [id, w] of look.subjects) liveLook.subjects.set(id, w);
  liveLook.ghosts.clear();
  for (const [id, w] of look.ghosts) liveLook.ghosts.set(id, w);
  liveLook.contextDim = look.contextDim;
  liveLook.interior.clear();
  for (const [level, on] of Object.entries(look.interior) as [InteriorLevel, boolean][]) if (on) liveLook.interior.add(level);
  talkLook.contextDim = liveLook.contextDim;
  for (const key of Object.keys(interiorRecord) as InteriorLevel[]) delete interiorRecord[key];
  for (const level of liveLook.interior) interiorRecord[level] = true;
}

// ---- Entry and per-frame evaluation -----------------------------------------------------------------

interface Entry {
  beat: ResolvedBeat;
  mode: EntryMode;
  t0: number;
  cut: boolean;
  /** With a cut: when the dip starts (s after entry). */
  cutAt: number;
  fromReveal: HeroRevealState;
  fromLook: LookValues;
  toLook: LookValues;
  fromWorld: WorldState;
}

let entry: Entry | null = null;

/** The dip to dark (0..1) for this frame; the overlay paints it. */
export const dip = { value: 0 };

export const currentEntry = () => entry;

/** Seconds since the current beat was entered (after its dip). */
export function beatTime(): number {
  if (!entry) return 0;
  return animationClock.time - entry.t0 - (entry.cut ? entry.cutAt + TALK.cut.out : 0);
}

export interface EntryOptions {
  /** Dip to dark and re-establish the beat behind it (the safe reset). */
  cut?: boolean;
  /** Everything at the beat's resting state this frame (canvas rebuild, scripted jumps). */
  instant?: boolean;
}

/**
 * Enter `beat` now. `live` is the camera pose on screen. A beat without its own shot keeps the
 * running camera move on a forward step (the view simply continues).
 */
export function enterBeat(beat: ResolvedBeat, mode: EntryMode, live: CameraPose, options: EntryOptions = {}): void {
  const t0 = animationClock.time;
  if (options.instant) {
    plan = { t0, cut: false, cutAt: 0, pre: null, from: beat.finalPose, path: null, hold: beat.finalPose, master: null, end: 0, drift: beat.drift };
    Object.assign(heroReveal, beat.reveal);
    Object.assign(world, beat.world);
    const look = lookFromResolved(beat.look);
    applyLook(look, look, 1);
    entry = { beat, mode: 'settle', t0, cut: false, cutAt: 0, fromReveal: { ...beat.reveal }, fromLook: look, toLook: look, fromWorld: { ...beat.world } };
    return;
  }
  const keepCamera = mode === 'play' && !beat.shot && plan !== null && !options.cut;
  if (options.cut) plan = { t0, cut: true, cutAt: 0, pre: null, from: live, path: null, hold: beat.finalPose, master: null, end: 0, drift: beat.drift };
  else if (!keepCamera) plan = buildCameraPlan(beat, mode, live, t0);
  entry = {
    beat,
    mode,
    t0,
    cut: !keepCamera && (plan?.cut ?? false),
    cutAt: !keepCamera ? (plan?.cutAt ?? 0) : 0,
    fromReveal: { ...heroReveal },
    fromLook: copyLook(liveLook),
    toLook: lookFromResolved(beat.look),
    fromWorld: { ...world },
  };
}

/** Leave the talk: drop the plan and put the world back at rest. */
export function clearRuntime(): void {
  plan = null;
  entry = null;
  dip.value = 0;
  Object.assign(world, restingWorld());
  cues.clear();
  Object.assign(liveLook, emptyLook());
  talkLook.subjects = liveLook.subjects;
  talkLook.ghosts = liveLook.ghosts;
  talkLook.contextDim = 0;
  for (const key of Object.keys(interiorRecord) as InteriorLevel[]) delete interiorRecord[key];
  talkClock.shaftAngle = 0;
}

/** Evaluate the reveal, look, world, cues and dip for this frame (talk driver, -97). */
export function evaluateTalkFrame(): void {
  const e = entry;
  talkClock.time = animationClock.time % TALK.clockWrap;
  if (!e) return;
  const local = animationClock.time - e.t0;
  const tau = local - (e.cut ? e.cutAt + TALK.cut.out : 0);
  const play = e.mode === 'play';
  const spec = e.beat.beat;

  // Dip to dark: out, then in (after a dive, if the shot has one).
  if (e.cut) {
    const out = TALK.cut.out;
    const d = local - e.cutAt;
    dip.value = d < 0 ? 0 : d < out ? MathUtils.smootherstep(d, 0, out) : 1 - MathUtils.smootherstep(d - out, 0, TALK.cut.in);
  } else dip.value = 0;

  const masterSegment = play && plan?.master && plan.t0 === e.t0 ? plan.master : null;

  // Reveal.
  if (masterSegment && spec.reveal?.master) masterRevealAt(masterTime(masterSegment, tau), heroReveal);
  else {
    for (const key of REVEAL_KEYS) {
      const from = e.fromReveal[key];
      const to = e.beat.reveal[key];
      if (from === to) {
        heroReveal[key] = to;
        continue;
      }
      const timing = play ? (spec.reveal?.tracks?.[key] ?? spec.reveal?.timing ?? (e.cut ? SNAP : { duration: 1.6 })) : e.cut ? SNAP : { duration: TALK.settle.reveal };
      heroReveal[key] = from + (to - from) * progress(tau, timing);
    }
  }

  // Look.
  if (masterSegment && spec.look?.master) setLookFromMaster(masterTime(masterSegment, tau));
  else {
    const duration = play ? (spec.look?.duration ?? (e.cut ? 0 : TALK.lookDuration)) : e.cut ? 0 : TALK.settle.reveal;
    applyLook(e.fromLook, e.toLook, progress(tau, { duration }));
  }

  // World channels.
  for (let i = 0; i < WORLD_CHANNEL_IDS.length; i++) {
    const id = WORLD_CHANNEL_IDS[i]!;
    const from = e.fromWorld[id];
    const to = e.beat.world[id];
    if (from === to) {
      world[id] = to;
      continue;
    }
    const channelDuration = WORLD_CHANNELS[id].duration ?? 0;
    const timing = play ? (spec.worldTiming?.[id] ?? (e.cut ? SNAP : { duration: channelDuration })) : e.cut ? SNAP : { duration: channelDuration > 0 ? TALK.settle.world : 0 };
    world[id] = from + (to - from) * progress(tau, timing);
  }

  // One-shot cues: running in the beat that starts them, complete after it.
  cues.clear();
  for (const [name, owner] of e.beat.cueOwner) {
    if (owner.flat !== e.beat.flat || !play) cues.set(name, 1);
    else cues.set(name, MathUtils.clamp((tau - (owner.spec.delay ?? 0)) / owner.spec.duration, 0, 1));
  }

  // The turbine shaft integrates its speed (it winds down; it never jumps).
  talkClock.shaftAngle = (talkClock.shaftAngle + Math.PI * 2 * world['f.shaft'] * animationClock.lastStep) % (Math.PI * 2 * 1000);
}
