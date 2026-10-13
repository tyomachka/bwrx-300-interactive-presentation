/**
 * Stage 8 reactor control: plain data (PROJECT.md §3 Control, §10 Control Mode, §13 38-43 s).
 *
 * The story: the control blades move farther up between the fuel assemblies, absorb more
 * neutrons, and the chain reaction (reactor power) becomes weaker.
 *
 * Source, GD Rev J (the newest official source in references/technical/):
 *  - §3.2: 57 FMCRDs mounted in housings welded into the RPV bottom head; each moves a hollow
 *    piston coupled to the bottom of a control rod, up or down, in fine increments or
 *    continuously, by a motor-driven ball screw; FMCRDs are used for power changes in normal
 *    operation. The housing does not move (Fig 3-7): only the piston and the blade do.
 *  - §3.1.1.1: the orificed fuel supports "guide the control rod blade as it raises or lowers to
 *    respectively decrease or increase reactor power", keeping it "aligned between the four
 *    bundles".
 *  - §4.2: in all but 12 peripheral locations, four bundles surround one cruciform blade.
 *  - Table 2-1: 57 cruciform blades, B4C or Hf absorber.
 * The GD publishes no normal-operation rod sequence or rod pattern.
 *
 * [EDUCATIONAL REPRESENTATIVE MOTION] So nothing here is a BWRX-300 rod sequence. The blades
 * start from the approved Stage 4 base pattern (rpv/coreLayout.ts, itself [APPROX]) and every
 * blade moves the same fraction of its remaining travel farther in, which keeps the base
 * pattern's relative variation. The motion is also time-compressed: the GD's normal power
 * changes run at 0.5-2 %/min (§3.2, §16.1), far slower than this 1.7 s move.
 *
 * The reaction cue is an educational visual mapping, not a physical simulation: one abstract
 * number that falls as the blades go in. It is not MW, not a percentage of reactor power, and
 * implies no reactor kinetics.
 */
import type { FlowKeys } from './flow';
import { MASTER_EVENTS as E } from './masterSequence';

/**
 * Target pattern: insertion_i(target) = base_i + shift, every blade the same distance farther in
 * (half the stroke, 1.9 m), clamped so that no blade of the base pattern passes full insertion.
 * The base pattern's relative variation is kept exactly. With the Stage 4 operating pattern the
 * 48 withdrawn blades reach 0.5 and the 9 partly inserted ones 0.85: deeper everywhere, none
 * fully in (a power reduction, not a shutdown; Stage 9 decides any scram story). One shared
 * distance also makes the motion one rigid move of the instanced batch (no per-frame instance
 * upload; rpv/ReactorPressureVessel.tsx).
 */
export const CONTROL_TARGET = { shift: 0.5 } as const;

/** The reaction cue: 1 with the base pattern, `low` with the target pattern, linear between. */
export const REACTION = { low: 0.3 } as const;

/**
 * Presentation (master-time keys anchored on the Stage 6 control events; the control beat is
 * 36.5-41.5 s and no camera key moves):
 *  - 36.5-38.6: the camera returns to the core; the power-side flow is fading (Stage 7 keys);
 *    the core water and the activity cue come up while the core comes into view;
 *  - insertion: from just before `controlAction` (39.2, the camera reaches the blade pose at
 *    39.1) for 1.7 s, smootherstep (no snap at either end);
 *  - 40.6-41.5: the blades hold deeper in; the cue stays at its lower level;
 *  - handoff: the blades stay in (the base pattern is not restored before the safety chapter);
 *    the cue fades out as the camera backs out of the core, the reaction value itself stays low.
 */
export const CONTROL_PRESENTATION = {
  insertion: { start: E.controlAction - 0.3, end: E.controlAction + 1.4 },
  /** Activity-cue visibility (a presentation fade, not physics). */
  activity: [
    [E.controlEnter + 1.1, 0],
    [E.controlEnter + 2.0, 1],
    [E.controlExit + 0.4, 1],
    [E.controlExit + 1.2, 0],
  ] as FlowKeys,
} as const;

/**
 * What Stage 9 inherits at `controlExit` (41.5 s) and after: blades at the target pattern
 * (bladeControlAmount 1), reactionIntensity at REACTION.low, core water still circulating at its
 * control-beat level (config/flow.ts). Heat is still being made and still has to be removed.
 */
export const CONTROL_HANDOFF = { at: E.controlExit, bladeControlAmount: 1, reactionIntensity: REACTION.low } as const;

/** Explore Control: the slider eases the blades (1/s rate); a selection keeps priority. */
export const CONTROL_EXPLORE = {
  rate: 5,
  /** Activity-cue fade in / out (1/s rate). */
  fadeRate: 6,
  withSelection: 0.6,
  withIsolation: 0.35,
} as const;

/**
 * The activity cue: sparse, short-lived warm-white glints on the fuel faces the quarter cut
 * exposes, between the blade caps and the fuel (so a blade in front of the fuel hides them, as
 * it would). Each slot flashes for `life` seconds once per `period`, each time at a new seeded
 * place; the share of slots that flash is the reaction intensity. No trajectories, no glow on
 * the fuel, no additive blending.
 */
export const ACTIVITY_LOOK = {
  color: '#fff3dc',
  /** Darker rim (multiplier on the colour): keeps a glint readable on the light fuel faces. */
  rim: 0.4,
  alpha: 1,
  /** Diameter (m) and the on-screen minimum (px). */
  size: 0.055,
  minPixels: 4.5,
  /** Seconds a glint is visible; seconds between a slot's glints (seeded per slot). */
  life: 0.34,
  period: [0.8, 1.5] as const,
  /** Slots on High (Low: quality particlesMultiplier, with a floor so the story stays). */
  slots: 560,
  minDensity: 0.6,
  /** Behind the blade caps (blade half thickness 3.95 mm), in front of the channels (6.65 mm). */
  faceOffset: 0.0052,
  /** Half width of a glint strip on one channel face (the face is 0.139 m wide). */
  stripHalfWidth: 0.062,
  /** Local suppression below a blade's absorber tip: glints there are this fraction. */
  belowTip: 0.15,
} as const;
