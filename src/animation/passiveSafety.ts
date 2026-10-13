/**
 * Stage 9 passive-safety state: one function from time to everything the ICS loop draws.
 *
 *  - Presentation: `presentationSafetyAt(masterTime)`, a pure function of master time
 *    (config/safety.ts keys on the Stage 6 safety events), quantised as the Stage 7 flow. Playback,
 *    any seek and a fixed-step export show exactly the same frame; nothing keeps history.
 *  - Explore Safety: the same loop replayed from the moment the mode turns on, then steady, on
 *    the animation clock; it fades in and out.
 *  - Otherwise off.
 */
import { MathUtils } from 'three';
import { MASTER_EVENTS as E } from '../config/masterSequence';
import { SAFETY_CHANNELS, SAFETY_EXPLORE, SAFETY_PRESENTATION, type FrontWindow, type SafetyChannel } from '../config/safety';
import { exploreState } from '../interaction/exploreStore';
import { animationClock } from './clock';
import { keyed } from './keys';
import { masterSequence } from './masterSequence';

export type SafetySource = 'off' | 'presentation' | 'explore';

export interface SafetyState {
  source: SafetySource;
  /** Clock of the pulses and the plume (s): master time, or the wrapped animation clock. */
  time: number;
  intensity: Record<SafetyChannel, number>;
  /** 0..1: how far the steam has got from the vessel to the ICs. */
  steamFront: number;
  /** 0..1: how far the condensing steam has got down the IC tubes. */
  condensingFront: number;
  /** 0..1: how far the condensate has got back towards the vessel. */
  condensateFront: number;
}

export function createSafetyState(): SafetyState {
  return {
    source: 'off',
    time: 0,
    intensity: Object.fromEntries(SAFETY_CHANNELS.map((c) => [c, 0])) as Record<SafetyChannel, number>,
    steamFront: 0,
    condensingFront: 0,
    condensateFront: 0,
  };
}

/** Same quantisation as the Stage 7 flow: playback and seek give bit-identical inputs. */
const quantise = (t: number) => Math.round(t * 1e6) / 1e6;
const progress = (w: FrontWindow, t: number) => MathUtils.clamp((t - w.start) / (w.end - w.start), 0, 1);

/** Schedule time `t` (master seconds) -> the channels and fronts, scaled by `level`. */
function evaluate(t: number, level: number, out: SafetyState): void {
  const P = SAFETY_PRESENTATION;
  for (let i = 0; i < SAFETY_CHANNELS.length; i++) out.intensity[SAFETY_CHANNELS[i]!] = level * keyed(P.intensity[SAFETY_CHANNELS[i]!], t);
  // The shutdown handoff's early warmth (never lowers the main curve).
  out.intensity.decayHeat = level * Math.max(keyed(P.intensity.decayHeat, t), keyed(P.decayHeatEarly, t));
  out.steamFront = progress(P.fronts.steam, t);
  out.condensingFront = progress(P.fronts.condensing, t);
  out.condensateFront = progress(P.fronts.condensate, t);
}

/** The presentation's ICS loop at master time `t` (pure). */
export function presentationSafetyAt(masterTime: number, out: SafetyState = createSafetyState()): SafetyState {
  const t = quantise(masterTime);
  out.source = 'presentation';
  out.time = t;
  evaluate(t, 1, out);
  return out;
}

// ---- The frame's state (Explore eases; the presentation does not) ------------------------------------

const frame = createSafetyState();
const explore = { on: false, level: 0, startedAt: 0 };

const approach = (value: number, target: number, rate: number, dt: number) =>
  Math.abs(target - value) < 1e-4 ? target : value + (target - value) * (1 - Math.exp(-rate * dt));

/**
 * Advance the safety state for this frame (once, before anything reads it: SafetyDriver). The
 * master owns it while it owns the scene; Explore Safety replays the loop from its start.
 */
export function advanceSafety(dt: number): SafetyState {
  if (masterSequence.status !== 'idle') {
    explore.on = false;
    explore.level = 0;
    return presentationSafetyAt(masterSequence.time, frame);
  }
  const s = exploreState();
  const on = s.mode === 'explore' && s.safety;
  if (on && !explore.on) explore.startedAt = animationClock.time;
  explore.on = on;
  const level = SAFETY_EXPLORE.intensity * (s.isolate ? SAFETY_EXPLORE.withIsolation : s.selectedId ? SAFETY_EXPLORE.withSelection : 1);
  explore.level = approach(explore.level, on ? level : 0, SAFETY_EXPLORE.fadeRate, dt);
  frame.source = explore.level > 0 ? 'explore' : 'off';
  frame.time = animationClock.time % SAFETY_EXPLORE.clockWrap;
  // Replay the schedule from the steam leaving the vessel; it holds at full once the loop is
  // closed (never the presentation's quieter final pullback).
  const replay = Math.min(SAFETY_PRESENTATION.fronts.steam.start + (animationClock.time - explore.startedAt), E.safetyExit);
  evaluate(replay, explore.level, frame);
  return frame;
}

/** Reset: no ICS loop, at once. */
export function snapSafetyOff(): void {
  explore.on = false;
  explore.level = 0;
}

/** This frame's safety state (advanced by SafetyDriver before the scene reads it). */
export const safetyForFrame = (): Readonly<SafetyState> => frame;
