/**
 * Stage 8 reactor-control state: one function from time to the blades and the reaction cue.
 *
 *  - Presentation: `presentationControlAt(masterTime)`, a pure function of master time
 *    (config/control.ts keys on the Stage 6 control events). Playback, any seek and a fixed-step
 *    export show exactly the same blades and cue at a given time; nothing keeps history.
 *  - Explore Control: the panel slider, eased on the animation clock.
 *  - Otherwise: the base pattern, no cue.
 *
 * [EDUCATIONAL REPRESENTATIVE MOTION] The blade motion is representative, not a BWRX-300 rod
 * sequence; `reactionIntensity` is an educational visual mapping (more insertion, less
 * reaction), not reactor power, not a percentage, not kinetics. Stage 10 may drive the same
 * activity layer.
 */
import { MathUtils } from 'three';
import { CONTROL_EXPLORE, CONTROL_PRESENTATION, CONTROL_SHUTDOWN, REACTION } from '../config/control';
import { exploreState } from '../interaction/exploreStore';
import { animationClock } from './clock';
import { masterSequence } from './masterSequence';
import { keyed } from './keys';

export type ControlSource = 'off' | 'presentation' | 'explore';

export interface ReactorControlState {
  source: ControlSource;
  /** Clock of the activity cue (s): master time, or the animation clock in Explore. */
  time: number;
  /** 0 = the approved base pattern .. 1 = the representative deeper pattern. */
  bladeControlAmount: number;
  /** Abstract reaction / activity cue: 1 with the base pattern, falls as the blades go in. */
  reactionIntensity: number;
  /** 0..1: how much of the activity layer is shown (presentation fade or Explore hierarchy). */
  activity: number;
  /** 0..1: Explore Control's copper emphasis on the blades (the presentation uses its reveal track). */
  emphasis: number;
}

export function createControlState(): ReactorControlState {
  return { source: 'off', time: 0, bladeControlAmount: 0, reactionIntensity: 1, activity: 0, emphasis: 0 };
}

/** The educational mapping: linear from 1 (base pattern) to REACTION.low (target pattern). */
export const reactionFor = (amount: number) => 1 - (1 - REACTION.low) * MathUtils.clamp(amount, 0, 1);

/** Same quantisation as the Stage 7 flow: playback and seek give bit-identical inputs. */
const quantise = (t: number) => Math.round(t * 1e6) / 1e6;

/** The presentation control state at master time `t` (pure). */
export function presentationControlAt(masterTime: number, out: ReactorControlState = createControlState()): ReactorControlState {
  const { insertion, activity } = CONTROL_PRESENTATION;
  const t = quantise(masterTime);
  const amount = MathUtils.smootherstep(t, insertion.start, insertion.end);
  // Stage 9 shutdown handoff: exactly the Stage 8 value up to controlExit, then down to near zero.
  const reaction = reactionFor(amount);
  const shutdown = MathUtils.smootherstep(t, CONTROL_SHUTDOWN.start, CONTROL_SHUTDOWN.end);
  out.source = 'presentation';
  out.time = t;
  out.bladeControlAmount = amount;
  out.reactionIntensity = reaction + (CONTROL_SHUTDOWN.reaction - reaction) * shutdown;
  out.activity = keyed(activity, t);
  out.emphasis = 0;
  return out;
}

// ---- The frame's state (Explore eases; the presentation does not) ------------------------------------

const frame = createControlState();
const explore = { amount: 0, activity: 0, emphasis: 0 };

const approach = (value: number, target: number, rate: number, dt: number) =>
  Math.abs(target - value) < 1e-4 ? target : value + (target - value) * (1 - Math.exp(-rate * dt));

/** Presentation v1 (src/presentation) writes the control state while it runs; null: as before. */
let externalControl: ((dt: number, out: ReactorControlState) => void) | null = null;
export function setControlSource(source: ((dt: number, out: ReactorControlState) => void) | null): void {
  externalControl = source;
}

/**
 * Advance the control state for this frame (once, before anything reads it: ControlDriver).
 * The master owns it while it owns the scene, then the talk when it runs; Explore Control eases
 * towards the slider; with Control off the blades ease back to the base pattern.
 */
export function advanceControl(dt: number): ReactorControlState {
  if (masterSequence.status !== 'idle') {
    presentationControlAt(masterSequence.time, frame);
    // Handing back to Explore later continues from here (no jump), unless Reset snaps.
    explore.amount = frame.bladeControlAmount;
    explore.activity = 0;
    explore.emphasis = 0;
    return frame;
  }
  if (externalControl) {
    externalControl(dt, frame);
    explore.amount = frame.bladeControlAmount;
    explore.activity = 0;
    explore.emphasis = 0;
    return frame;
  }
  const s = exploreState();
  const on = s.mode === 'explore' && s.control;
  const level = s.isolate ? CONTROL_EXPLORE.withIsolation : s.selectedId ? CONTROL_EXPLORE.withSelection : 1;
  explore.amount = approach(explore.amount, on ? s.controlAmount : 0, CONTROL_EXPLORE.rate, dt);
  explore.activity = approach(explore.activity, on ? level : 0, CONTROL_EXPLORE.fadeRate, dt);
  explore.emphasis = approach(explore.emphasis, on ? 1 : 0, CONTROL_EXPLORE.fadeRate, dt);
  frame.source = on || explore.amount > 0 || explore.activity > 0 ? 'explore' : 'off';
  frame.time = animationClock.time;
  frame.bladeControlAmount = explore.amount;
  frame.reactionIntensity = reactionFor(explore.amount);
  frame.activity = explore.activity;
  frame.emphasis = explore.emphasis;
  return frame;
}

/** Reset: the base pattern and no cue, at once. */
export function snapControlToBase(): void {
  explore.amount = 0;
  explore.activity = 0;
  explore.emphasis = 0;
}

/** This frame's control state (advanced by ControlDriver before the flow and the blades read it). */
export const controlForFrame = (): Readonly<ReactorControlState> => frame;
