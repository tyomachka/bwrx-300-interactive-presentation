/**
 * Stage 7 operating-flow state: one function from time to everything the flow draws.
 *
 *  - Presentation: `presentationFlowAt(masterTime)`, a pure function of master time built from
 *    config/flow.ts (keys anchored on the Stage 6 semantic events). Playback, any seek and a
 *    fixed-step export therefore show exactly the same flow frame at a given time.
 *  - Explore Flow: the same channels, steady and looping on the shared animation clock.
 *  - Otherwise off.
 *
 * The flow pulls master time (the Stage 6 contract): nothing here subscribes or keeps history.
 *
 * Stage 8: the boiling cue follows the control state's reaction cue (`boilShare`): the blades
 * reduce the heat made in the fuel, so fewer bubbles form; the water keeps circulating.
 */
import { FLOW_CHANNELS, FLOW_EXPLORE, FLOW_PRESENTATION, SHAFT, type FlowChannel } from '../config/flow';
import { exploreState } from '../interaction/exploreStore';
import { animationClock } from './clock';
import { keyed } from './keys';
import { masterSequence } from './masterSequence';
import { controlForFrame, createControlState, presentationControlAt } from './reactorControl';

export type FlowSource = 'off' | 'presentation' | 'explore';

export interface FlowState {
  source: FlowSource;
  /** The flow clock (s): master time, or the animation clock in Explore. */
  time: number;
  intensity: Record<FlowChannel, number>;
  /** 0..1: vapour bubbles in the upper core. */
  boil: number;
  /** 0..1: share of the boiling cue left (Stage 8 reaction cue; 1 with the base blade pattern). */
  boilShare: number;
  /** How far the steam has got along the main steam line (m; Infinity = all of it). */
  mainSteamFront: number;
  /** How far the steam has got through the turbine casings (m). */
  turbineFront: number;
  /** How far the electricity has got along its path (m). */
  electricityFront: number;
  /** Shaft rotation (rad). */
  shaftAngle: number;
}

export function createFlowState(): FlowState {
  return {
    source: 'off',
    time: 0,
    intensity: Object.fromEntries(FLOW_CHANNELS.map((c) => [c, 0])) as Record<FlowChannel, number>,
    boil: 0,
    boilShare: 1,
    mainSteamFront: 0,
    turbineFront: 0,
    electricityFront: 0,
    shaftAngle: 0,
  };
}

const OMEGA = SHAFT.revPerSecond * Math.PI * 2;

/** Shaft angle when it starts at `start` and speeds up linearly over SHAFT.rampUp (integrated). */
function shaftAngle(t: number, start: number): number {
  const tau = t - start;
  if (tau <= 0) return 0;
  const ramp = SHAFT.rampUp;
  return OMEGA * (tau < ramp ? (tau * tau) / (2 * ramp) : tau - ramp / 2);
}

const front = (t: number, cue: { start: number; speed: number }) => Math.max(0, (t - cue.start) * cue.speed);

/**
 * Master time quantised to 1 µs. The master's time is a GSAP timeline time, kept to 1e-7 s, and
 * the timeline's start during playback is rounded too, so the same frame can read one 1e-7 step
 * apart by playback and by seek; as a 32-bit float on the GPU that is enough to move a few particle
 * edges. Frame times (n / 30 s) are at least 0.17 µs from a half-microsecond, so after this
 * playback, seek and export give the flow bit-identical inputs.
 */
const quantise = (t: number) => Math.round(t * 1e6) / 1e6;

const controlScratch = createControlState();

/** The presentation flow at master time `t` (pure). */
export function presentationFlowAt(masterTime: number, out: FlowState = createFlowState()): FlowState {
  const P = FLOW_PRESENTATION;
  const t = quantise(masterTime);
  out.source = 'presentation';
  out.time = t;
  // Indexed loops: evaluated every frame, so nothing here allocates.
  for (let i = 0; i < FLOW_CHANNELS.length; i++) out.intensity[FLOW_CHANNELS[i]!] = keyed(P.intensity[FLOW_CHANNELS[i]!], t);
  out.boil = keyed(P.boil, t);
  out.boilShare = presentationControlAt(t, controlScratch).reactionIntensity;
  out.mainSteamFront = front(t, P.mainSteamFront);
  out.turbineFront = front(t, P.turbineFront);
  out.electricityFront = front(t, P.electricityFront);
  out.shaftAngle = shaftAngle(t, P.shaftStart);
  return out;
}

/** Explore Flow at animation time `t`: steady, everything flowing (pure). */
export function exploreFlowAt(t: number, selection: 'none' | 'selected' | 'isolated', out: FlowState = createFlowState(), boilShare = 1): FlowState {
  const level = FLOW_EXPLORE.intensity * (selection === 'isolated' ? FLOW_EXPLORE.withIsolation : selection === 'selected' ? FLOW_EXPLORE.withSelection : 1);
  out.source = 'explore';
  out.time = t;
  for (let i = 0; i < FLOW_CHANNELS.length; i++) out.intensity[FLOW_CHANNELS[i]!] = level;
  out.boil = 1;
  out.boilShare = boilShare;
  out.mainSteamFront = Infinity;
  out.turbineFront = Infinity;
  out.electricityFront = Infinity;
  out.shaftAngle = OMEGA * t;
  return out;
}

function offFlow(out: FlowState): FlowState {
  out.source = 'off';
  out.time = 0;
  for (let i = 0; i < FLOW_CHANNELS.length; i++) out.intensity[FLOW_CHANNELS[i]!] = 0;
  out.boil = 0;
  out.boilShare = 1;
  out.mainSteamFront = 0;
  out.turbineFront = 0;
  out.electricityFront = 0;
  out.shaftAngle = 0;
  return out;
}

/**
 * The flow for the current frame: the master sequence while it owns the scene, else Explore Flow
 * when it is on, else off. Call after the animation clock has advanced (FrameDriver) and the
 * control state too (ControlDriver): Explore Control's reaction cue sets the boiling.
 */
export function currentFlowState(out: FlowState): FlowState {
  if (masterSequence.status !== 'idle') return presentationFlowAt(masterSequence.time, out);
  const s = exploreState();
  if (s.mode === 'explore' && s.flow) return exploreFlowAt(animationClock.time, s.isolate ? 'isolated' : s.selectedId ? 'selected' : 'none', out, controlForFrame().reactionIntensity);
  return offFlow(out);
}

/**
 * The current flow in a shared object (a handful of key lookups: each flow component simply
 * re-evaluates it in its own frame callback, after FrameDriver has advanced the clock).
 */
const frameState = createFlowState();
export const flowForFrame = (): FlowState => currentFlowState(frameState);
