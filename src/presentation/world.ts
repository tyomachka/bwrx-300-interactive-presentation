/**
 * Presentation v1 "world": every scalar the talk drives besides the camera, the reveal and the look.
 *
 * Each channel has a resting value (what the scene shows when no beat asks for anything) and a
 * default transition. A beat sets targets; the runtime eases every channel from its value at the
 * moment the beat was entered to the beat's target (presentation/runtime.ts). Scene components and
 * the effect hooks read `world` after the talk driver has written it for the frame (priority -97).
 *
 * Prefixes: f flow (Stage 7 channels), c control (Stage 8), s safety (Stage 9), y water cycle
 * (condenser and feedwater), g grid and city, p plant lights, x fission chain inset, m maps, lt
 * Lithuania map, w world map, k scale comparison, q football pitches, e environment.
 */

interface ChannelSpec {
  rest: number;
  /** Default transition (s). */
  duration?: number;
}

const flow = (duration = 1.0): ChannelSpec => ({ rest: 0, duration });

export const WORLD_CHANNELS = {
  // ---- Stage 7 flow (the legacy channels, driven by the talk) ----
  'f.coreWater': flow(),
  'f.chimneyMixture': flow(),
  'f.downcomerWater': flow(),
  'f.separatorWater': flow(),
  'f.separatorSteam': flow(),
  'f.drySteam': flow(),
  'f.steamOutlet': flow(),
  'f.mainSteam': flow(),
  'f.turbine': flow(),
  'f.generator': flow(),
  'f.electricity': flow(),
  /** Bubbles in the upper core (0..1) and the share of the boiling cue (decay heat keeps ~0.3). */
  'f.boil': flow(1.2),
  'f.boilShare': { rest: 1, duration: 1.2 },
  /** Turbine shaft speed, rev/s (the angle is integrated: it winds down, never jumps). */
  'f.shaft': { rest: 0, duration: 2.5 },

  // ---- Stage 8 control ----
  /** 0 base blade pattern .. 1 the representative deeper pattern. */
  'c.amount': { rest: 0, duration: 1.8 },
  /** Activity glints (reaction cue visibility). */
  'c.activity': { rest: 0, duration: 0.9 },
  /** Shutdown: every blade to full insertion (0..1); the reaction falls to almost nothing. */
  'c.scram': { rest: 0, duration: 1.4 },

  // ---- Stage 9 passive safety ----
  's.icsSteam': flow(0.6),
  's.icsCondensing': flow(0.6),
  's.icsCondensate': flow(0.6),
  's.poolHeat': flow(1.2),
  's.decayHeat': flow(1.4),

  // ---- Water cycle: condenser and feedwater (talk only) ----
  /** Condenser shells, pedestal and the feedwater line drawn (0 / 1). */
  'y.show': { rest: 0, duration: 0 },
  'y.exhaust': flow(),
  'y.feedwater': flow(),

  // ---- Grid and city (talk only) ----
  'g.show': { rest: 0, duration: 0 },
  /** Power along the transmission line. */
  'g.power': flow(0.8),
  /** City window lights (0 dark .. 1 lit). */
  'g.city': { rest: 0, duration: 2.2 },

  /** Plant lighting (turbine hall glazing): 1 normal, 0 dark (blackout). */
  'p.lights': { rest: 1, duration: 1.2 },
  /**
   * Plant size as log10 of its scale about the reactor axis: 0 = real size; about -2.5 = a point on
   * a map table. Interpolated in the exponent, so the shrink / growth reads as an even zoom.
   */
  'p.zoom': { rest: 0, duration: 3.2 },

  // ---- Fission chain inset (talk only) ----
  /** The micro view: 0 closed on the fuel spot .. 1 open. */
  'x.open': { rest: 0, duration: 1.0 },
  /** The warm spot left on the fuel once the view has closed (0..1). */
  'x.spot': { rest: 0, duration: 0.8 },

  // ---- Maps (talk only) ----
  /** Map tables: 0 hidden .. 1 fully open (a circle opening around the plant). */
  'm.lt': { rest: 0, duration: 3.2 },
  'm.world': { rest: 0, duration: 3.2 },
  'lt.wind': { rest: 0, duration: 2.0 },
  'lt.sun': { rest: 0, duration: 2.0 },
  'lt.imports': { rest: 0, duration: 1.6 },
  'lt.highlight': { rest: 0, duration: 1.2 },
  /** The controllable node on the Lithuanian grid (the plant's point). */
  'lt.node': { rest: 0, duration: 1.0 },
  'w.focus': { rest: 0, duration: 1.4 },

  // ---- Scale comparison (talk only) ----
  'k.show': { rest: 0, duration: 0 },
  /** The large ~1,500 MW unit rises (0..1). */
  'k.large': { rest: 0, duration: 3.0 },
  /** The large unit steps back once the modules stand (0..1). */
  'k.largeDim': { rest: 0, duration: 1.4 },
  /** BWRX-300 copies assembled beside ours (0..4, staggered). */
  'k.modules': { rest: 0, duration: 5.5 },

  // ---- Football pitches (talk only) ----
  'q.pitches': { rest: 0, duration: 1.6 },

  // ---- Environment ----
  /** Fog distances (m): pushed out for the wide comparison views. */
  'e.fogNear': { rest: 300, duration: 2.0 },
  'e.fogFar': { rest: 820, duration: 2.0 },
} satisfies Record<string, ChannelSpec>;

export type WorldChannel = keyof typeof WORLD_CHANNELS;
export const WORLD_CHANNEL_IDS = Object.keys(WORLD_CHANNELS) as WorldChannel[];

export type WorldState = Record<WorldChannel, number>;

export const restingWorld = (): WorldState => Object.fromEntries(WORLD_CHANNEL_IDS.map((id) => [id, WORLD_CHANNELS[id].rest])) as WorldState;

/** The live values for this frame (written by the talk driver, read by the scene). */
export const world: WorldState = restingWorld();

/** One-shot cue progress (0..1) for this frame, by cue name; absent = not running (0). */
export const cues = new Map<string, number>();

export const cue = (name: string) => cues.get(name) ?? 0;

/** The talk's effect clock (s): the animation clock while the talk runs, wrapped. */
export const talkClock = { time: 0, shaftAngle: 0 };
