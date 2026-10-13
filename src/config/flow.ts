/**
 * Stage 7 normal operating flow: plain data (PROJECT.md §13 20-38 s, §16 Flow visualization).
 *
 * Story, bottom to top and out to the grid, as GD Rev J describes it (§3.1.1, §3.1.1.1, §3.1.2,
 * §5.1.1, §5.1.2): water rises through the core by natural circulation (no pumps) and part of it
 * boils; the steam-water mixture rises through the tall chimney into the axial-flow separators
 * (no moving parts); separated water leaves their lower portion and returns down the downcomer
 * annulus, outside the shroud and chimney, to the core inlet; the chevron dryer takes out the
 * remaining moisture; dry steam leaves through the main steam line (the plant model has one
 * conceptual line, the design two) to the HP turbine, then the double-flow LP turbines, all on
 * one shaft with the generator, whose output leaves the plant.
 *
 * Everything that moves is a pure function of time: master time in the presentation, the
 * animation clock in Explore Flow (animation/operatingFlow.ts). Paths are data
 * (scene/flow/flowPaths.ts); scene components own no timing.
 */
import { MASTER_EVENTS as E } from './masterSequence';

/** Channels inside the reactor vessel (one particle system, scene/flow/VesselFlow.tsx). */
export const VESSEL_FLOW_CHANNELS = ['coreWater', 'chimneyMixture', 'downcomerWater', 'separatorWater', 'separatorSteam', 'drySteam', 'steamOutlet'] as const;
export type VesselFlowChannel = (typeof VESSEL_FLOW_CHANNELS)[number];

/** Channels outside the vessel (steam line, turbine-generator, electricity: scene/flow/PowerFlow.tsx). */
export const POWER_FLOW_CHANNELS = ['mainSteam', 'turbine', 'generator', 'electricity'] as const;
export type PowerFlowChannel = (typeof POWER_FLOW_CHANNELS)[number];

export type FlowChannel = VesselFlowChannel | PowerFlowChannel;
export const FLOW_CHANNELS: readonly FlowChannel[] = [...VESSEL_FLOW_CHANNELS, ...POWER_FLOW_CHANNELS];

/**
 * Phase along a vessel path (the `w` of each path sample): 0 liquid water, 1 steam-water mixture,
 * 2 wet steam (from the separators), 3 dry steam (after the dryer). The look follows the phase.
 */
export const PHASE = { water: 0, mixture: 1, wetSteam: 2, drySteam: 3 } as const;

/**
 * How a channel's particles relate to the vessel cut (the quadrant x < 0, z > 0):
 *  - volume: in the open volumes (chimney, separators, dryer, dome); removed with the cut quadrant;
 *  - face:   drawn at the section faces, just in front of the cut (the core, the downcomer slots):
 *            where the cut exposes them; shown only while the vessel is fully cut open.
 */
export type FlowClip = 'volume' | 'face';

export interface VesselChannelSpec {
  /** Streamlines (High); Low keeps the same story with fewer (quality `particlesMultiplier`). */
  paths: number;
  /** Particles following each other along one streamline. */
  perPath: number;
}

/** Streamline counts per channel (High). Particles = paths x perPath. */
export const VESSEL_FLOW_SPEC: Record<VesselFlowChannel, VesselChannelSpec> = {
  coreWater: { paths: 64, perPath: 5 },
  chimneyMixture: { paths: 80, perPath: 4 },
  downcomerWater: { paths: 72, perPath: 14 },
  separatorWater: { paths: 84, perPath: 3 },
  separatorSteam: { paths: 44, perPath: 3 },
  drySteam: { paths: 48, perPath: 4 },
  steamOutlet: { paths: 44, perPath: 4 },
};

/** Samples per path in the path texture (equal time steps, so the spacing encodes speed). */
export const FLOW_PATH_SAMPLES = 64;

/**
 * Visual language (sRGB colours, metres, alpha). Water: cool desaturated cyan-blue streaks,
 * denser and slower than steam. Mixture: the water streaks turn into small vapour bubbles as they
 * rise. Steam: pale, wider, softer, faster. Electricity: a thin warm-neutral pulse. The warm
 * accent stays the information / selection colour: no flow is orange.
 */
export const FLOW_LOOK = {
  water: { color: '#5c9cc3', alpha: 0.85, length: 0.3, width: 0.034 },
  /** Share of the rising water that turns into bubbles where the mixture forms; the mixture's
   *  remaining streaks pale towards the bubble colour (`mixturePale`), so rising mixture and
   *  returning water are told apart by colour as well as by direction. */
  bubble: { color: '#e2edf2', alpha: 0.8, size: 0.052, share: 0.32, mixturePale: 0.5 },
  steam: { color: '#eef2f4', alpha: 0.52, length: 0.6, width: 0.11 },
  droplet: { color: '#6aa6c9', alpha: 0.85, size: 0.034, share: 0.3 },
  /** Never thinner than this on screen (px), so a far streak does not shimmer away. */
  minPixels: 1.4,
  /** Steam along the main steam line: soft pulses over a faint steady glow where steam has arrived. */
  mainSteam: { color: '#e8edf0', alpha: 0.5, base: 0.22, spacing: 6, pulse: 2.6, speed: 16.5, radius: 0.5 },
  /** Steam through the turbine: one soft highlight at a time travelling along each casing. */
  turbine: { color: '#e8edf0', alpha: 0.3, base: 0, spacing: 4, pulse: 1.0, speed: 5.5, offset: 0.06 },
  electricity: { color: '#f4ead6', alpha: 1, base: 0.6, spacing: 5, pulse: 1.8, speed: 28, radius: 0.18, corner: 0.6 },
} as const;

/**
 * Turbine-generator operating cue: the shaft couplings turn (the casings stay still). Shown slowed
 * down: the real 3000/3600 rpm (50/60 rev/s, GD §5.1.2) would only alias at 30 fps.
 */
export const SHAFT = { revPerSecond: 0.75, rampUp: 1.2 } as const;

/** Intensity keys [time s, 0..1], smoothed between keys. */
export type FlowKeys = readonly (readonly [number, number])[];

const fadeOut = (t: number, value: number, fade = 1.6): FlowKeys => [
  [t, value],
  [t + fade, 0],
];

/**
 * Presentation: master-time keys (the Stage 6 semantic events are the source of truth). The
 * reactor flow builds up chapter by chapter, 20.5-29 s, while the camera cranes up the vessel; the
 * steam then runs along the main steam line to the turbine and generator, 29-36.5 s. The subject
 * of the moment is the brightest; what was already explained stays, quieter.
 */
export const FLOW_PRESENTATION = {
  intensity: {
    coreWater: [[E.flowCore, 0], [E.flowCore + 0.9, 1], [E.flowChimney + 0.6, 1], [E.flowSeparators + 0.4, 0.7], ...fadeOut(E.steamToTurbine, 0.7)],
    chimneyMixture: [[E.flowChimney - 0.7, 0], [E.flowChimney + 0.5, 1], [E.flowDryer, 0.8], ...fadeOut(E.steamToTurbine, 0.7)],
    downcomerWater: [[E.flowChimney + 0.2, 0], [E.flowChimney + 1.2, 1], [E.flowDryer, 0.9], ...fadeOut(E.steamToTurbine, 0.8)],
    separatorWater: [[E.flowSeparators - 0.3, 0], [E.flowSeparators + 0.5, 1], [E.steamExit, 0.8], ...fadeOut(E.steamToTurbine, 0.8)],
    separatorSteam: [[E.flowSeparators - 0.3, 0], [E.flowSeparators + 0.5, 1], [E.steamExit, 0.8], ...fadeOut(E.steamToTurbine, 0.8)],
    drySteam: [[E.flowDryer - 0.2, 0], [E.flowDryer + 0.6, 1], [E.steamToTurbine, 0.85], ...fadeOut(E.steamToTurbine + 0.4, 0.85)],
    steamOutlet: [[E.steamExit - 0.2, 0], [E.steamExit + 0.6, 1], ...fadeOut(E.steamToTurbine + 1.0, 1, 0.8)],
    mainSteam: [[E.steamExit + 0.6, 0], [E.steamExit + 1.1, 1], ...fadeOut(E.controlEnter, 1, 0.9)],
    turbine: [[E.turbine - 0.2, 0], [E.turbine + 0.5, 1], ...fadeOut(E.controlEnter, 1, 0.8)],
    generator: [[E.generator - 0.2, 0], [E.generator + 0.5, 1], ...fadeOut(E.controlEnter, 1, 0.8)],
    electricity: [[E.electricityOut - 0.1, 0], [E.electricityOut + 0.4, 1], ...fadeOut(E.controlEnter + 0.4, 1, 0.6)],
  } satisfies Record<FlowChannel, FlowKeys>,
  /** Boiling cue in the core: the upper core turns to bubbles once the water flow is established. */
  boil: [[E.flowCore + 0.5, 0], [E.flowChimney, 1]] as FlowKeys,
  /** The steam front along the main steam line (m from the vessel nozzle); it reaches the HP
   *  turbine inlet (~56 m) at about the `turbine` event. */
  mainSteamFront: { start: E.steamExit + 0.8, speed: 16.5 },
  /** The electricity front leaving the generator (m along its path): fast, so it is out of the
   *  hall while the generator is still in frame. */
  electricityFront: { start: E.electricityOut, speed: 40 },
  /** The steam front through the turbine casings (s after the event, before full bands). */
  turbineFront: { start: E.turbine - 0.2, speed: 9 },
  /** The shaft starts turning as the steam reaches the turbine. */
  shaftStart: E.turbine,
} as const;

/** Explore Flow: a steady, looping normal-operation view of the same channels. */
export const FLOW_EXPLORE = {
  intensity: 0.9,
  /** With a selection the selection keeps priority: the flow steps back. */
  withSelection: 0.6,
  withIsolation: 0.35,
} as const;
