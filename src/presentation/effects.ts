/**
 * The bridge from the talk's world channels to the approved Stage 7-9 effects.
 *
 * Each effect module keeps its own logic and asks an external source only when the 48 s master
 * sequence is idle and the talk has installed one (animation/operatingFlow.ts setFlowSource,
 * reactorControl.ts setControlSource, passiveSafety.ts setSafetySource). With nothing installed the
 * legacy behaviour is exactly as before.
 */
import { MathUtils } from 'three';
import { setFlowSource, type FlowState } from '../animation/operatingFlow';
import { reactionFor, setControlSource, type ReactorControlState } from '../animation/reactorControl';
import { setSafetySource, type SafetyState } from '../animation/passiveSafety';
import { CONTROL_SHUTDOWN } from '../config/control';
import { setBladeScram } from '../scene/rpv/coreLayout';
import { cue, talkClock, world } from './world';

/** Reaction cue after a full shutdown (the legacy handoff value is 0.05). */
const SHUTDOWN_REACTION = 0.03;

/** Fronts (m) of the pulse-tube paths: a cue at 1 means "steam / power everywhere". */
const FRONT = { mainSteam: 72, turbine: 34, electricity: 64 } as const;
const front = (name: string, length: number) => {
  const p = cue(name);
  return p >= 1 ? Infinity : p * length;
};

export function talkReaction(): number {
  return MathUtils.lerp(reactionFor(world['c.amount']), SHUTDOWN_REACTION, world['c.scram']);
}

function talkFlow(out: FlowState): FlowState {
  out.source = 'presentation';
  out.time = talkClock.time;
  out.intensity.coreWater = world['f.coreWater'];
  out.intensity.chimneyMixture = world['f.chimneyMixture'];
  out.intensity.downcomerWater = world['f.downcomerWater'];
  out.intensity.separatorWater = world['f.separatorWater'];
  out.intensity.separatorSteam = world['f.separatorSteam'];
  out.intensity.drySteam = world['f.drySteam'];
  out.intensity.steamOutlet = world['f.steamOutlet'];
  out.intensity.mainSteam = world['f.mainSteam'];
  out.intensity.turbine = world['f.turbine'];
  out.intensity.generator = world['f.generator'];
  out.intensity.electricity = world['f.electricity'];
  out.boil = world['f.boil'];
  // As in the legacy chapters: boiling follows the reaction down to the decay-heat level.
  out.boilShare = Math.max(talkReaction(), CONTROL_SHUTDOWN.residualBoil) * world['f.boilShare'];
  out.mainSteamFront = front('steam', FRONT.mainSteam);
  out.turbineFront = front('turbine', FRONT.turbine);
  out.electricityFront = front('power', FRONT.electricity);
  out.shaftAngle = talkClock.shaftAngle;
  return out;
}

function talkControl(_dt: number, out: ReactorControlState): void {
  setBladeScram(world['c.scram']);
  out.source = 'presentation';
  out.time = talkClock.time;
  out.bladeControlAmount = world['c.amount'];
  out.reactionIntensity = talkReaction();
  out.activity = world['c.activity'];
  out.emphasis = 0;
}

/** The ICS loop's fronts, from one cue: steam up, condensing, condensate back (legacy proportions). */
const ICS = { total: 3.4, steam: [0, 1.5], condensing: [1.4, 2.2], condensate: [2.1, 3.3] } as const;

function talkSafety(_dt: number, out: SafetyState): void {
  out.source = 'presentation';
  out.time = talkClock.time;
  out.intensity.icsSteam = world['s.icsSteam'];
  out.intensity.icsCondensing = world['s.icsCondensing'];
  out.intensity.icsCondensate = world['s.icsCondensate'];
  out.intensity.poolHeat = world['s.poolHeat'];
  out.intensity.decayHeat = world['s.decayHeat'];
  const t = cue('ics') * ICS.total;
  const span = ([a, b]: readonly [number, number]) => MathUtils.clamp((t - a) / (b - a), 0, 1);
  out.steamFront = span(ICS.steam);
  out.condensingFront = span(ICS.condensing);
  out.condensateFront = span(ICS.condensate);
}

export function installTalkEffects(): void {
  setFlowSource(talkFlow);
  setControlSource(talkControl);
  setSafetySource(talkSafety);
}

export function removeTalkEffects(): void {
  setFlowSource(null);
  setControlSource(null);
  setSafetySource(null);
  setBladeScram(0);
}
