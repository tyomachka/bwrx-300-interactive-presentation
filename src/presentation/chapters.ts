/**
 * Presentation v1: the ~7-minute talk, chapter by chapter (the script the controller plays).
 *
 * Stage 3 (rhythm): 19 presenter stops (18 presses from the opening to the questions). A press means
 * "this idea is done, next idea": it starts a short automatic choreography (the stop's first beat and
 * the beats that follow it by `after`), which then holds, physical processes still running (flow,
 * steam, turbine, the passive loop, the chain reaction), until the next press. Target times are
 * speaking guides, never timers. Information effects (count-ups, pins, the 0 h -> 7 days counter)
 * run once.
 *
 * Text follows the picture: a beat's new text fades in once its subject reads (`textAt`, or the
 * item's own cue), after the outgoing text has gone; text that stays across beats never re-enters.
 *
 * One continuous world: the plant never cuts away. The maps lie on the ground at the plant and the
 * plant shrinks into its point on them (p.zoom) as the camera rises (1 -> 2, 8 -> 9), and grows back
 * out of it as the camera dives (4 -> 5, 9 -> 10), on a filled ground (scene/GroundFiller.tsx). Only
 * the very first stop fades in. Camera paths run through open space.
 *
 * Camera poses here are presentation-only (the frozen Stage 3/6 poses in config/camera.ts are
 * referenced by name and never edited). World metres: grade y = 0, reactor axis at the origin,
 * turbine hall east (+x), the open south front +z, north -z.
 *
 * Stage 2 (design B, editorial cinematic): every settled frame is composed on the grid of
 * presentation/design.ts: editorial copy in the left or the right column, anchored labels (dot +
 * leader, process-coloured dots in chapters 7-10) on the things they name, every source directly
 * under the claim it qualifies.
 */
import { HERO_REVEAL_CLOSED, type HeroRevealState } from '../animation/heroReveal';
import type { CameraPose } from '../config/camera';
import { FOG } from '../config/render';
import { COMPONENT_IDS as C } from '../scene/components';
import { FISSION_ANCHOR } from '../scene/fission/buildInset';
import { REACTOR_PRESSURE_VESSEL as RPV } from '../scene/plant/dimensions';
import { masterRevealAt } from './legacy';
import { FIELD_TIMING } from './scene/fieldConfig';
import { FOOTPRINT } from './scene/footprintLayout';
import { LARGE_UNIT } from './scene/comparisonLayout';
import { LIMITS_PAD } from './scene/limitsLayout';
import { ltToWorld, pinPosition } from './scene/mapLayout';
import type { TalkChapter } from './types';

const pose = (position: CameraPose['position'], target: CameraPose['target'], fov = 35): CameraPose => ({ position, target, fov });

// ---- Presentation-only poses ------------------------------------------------------------------------

const P = {
  /** Opening: low and close on the reactor building, rising into the low hero view (the closing returns to it). */
  hookStart: pose([-58, 20, 112], [6, 13, -4]),
  hook: pose([-118, 28, 112], [2, 13, -4], 30),
  /** 1 -> 2: up and away, the plant shrinking into its node on the Lithuania table. */
  ltRise: pose([-110, 170, 210], [-20, 0, 0]),
  ltWide: pose([-96, 236, 268], [-48, 0, 21]),
  ltCalm: pose([-21, 344, 251], [-55, 0, 12]),
  ltMou: pose([-105, 318, 226], [-75, 0, 10]),
  /** 4 -> 5: down into the node; the plant grows back; the large unit rises beside it. */
  ltDive: pose([-26, 70, 74], [0, 2, 0]),
  /** Both units whole and side by side at one scale, their values in the dark sky above them. */
  scaleWide: pose([-130, 175, 440], [-125, -40, -30], 36),
  scaleModules: pose([-120, 300, 470], [-10, 0, -170]),
  /** Facts. */
  /** One unit, its transformer and the line leaving to the right: the power has somewhere to go. */
  factsPower: pose([-70, 55, 175], [85, 8, 0]),
  /** The power block's outline and the pitch, near top-down (an honest area comparison), at one ground scale. */
  footprint: pose([-20, 460, 130], [-24, 0, 25], 31),
  /** 24-36 months: our plant and a second, identical unit going up beside it. */
  factsMonths: pose([-190, 34, 95], [-6, 14, -50], 30),
  /** 8 -> 9: up into geography, the plant becoming the Darlington pin. */
  worldRise: pose([-60, 120, 180], [20, 0, 0]),
  worldWide: pose([40, 205, 135], [68, 0, -10]),
  worldDarlington: pose([-24, 66, 64], [0, 1, 2]),
  /** 9 -> 10: into the pin, the plant growing out of it, onto the start of the approved descent. */
  worldDive: pose([-44, 30, 70], [6, 4, 0]),
  /** Energy: condenser under the LP turbines, the feedwater line home, the grid. */
  condenser: pose([88, 7.5, 34], [60, 5.5, 0]),
  cycleWide: pose([-4, 30, 104], [30, -4, 0]),
  gridMid: pose([118, 46, 132], [170, 12, 34]),
  /** The end of the path: the plant small upstream, the line, the lit city large in the foreground. */
  grid: pose([620, 185, 680], [330, 0, 160]),
  /** Safety overview: the opened plant (reactor, pools, turbine hall). */
  overview: pose([0, 50, 165], [54, -3, -2]),
  /** Scram: in front of the cut vessel, on the way down to the blades (no fly-through). */
  scramApproach: pose([-15, -9.5, 34], [0.5, -15.5, 0]),
  decay: pose([-30, -2, 40], [0, -15.5, 0]),
  /** Passive loop: reactor (left) -> riser -> condenser in its pool, the right column free for the conclusion. */
  icsLoop: pose([2, 6.5, 47], [11.5, 6.2, -5]),
  /** Limits: wide, the opened plant. */
  limits: pose([-90, 60, 150], [20, 4, -6]),
} as const;

// ---- Reveal states ------------------------------------------------------------------------------------

const CLOSED: HeroRevealState = { ...HERO_REVEAL_CLOSED };
/** The master reveal with the vessel open on the core (15.4 s): ground, shaft, containment, vessel. */
const CORE_OPEN: HeroRevealState = masterRevealAt(15.4);

/** Fuel spot the fission view opens from and closes into: the Stage 10 inset anchor (mid active core). */
const FUEL_SPOT = FISSION_ANCHOR.toArray() as [number, number, number];

/** The plant as a point on a map table (log10 of its scale). */
const POINT = -2.6;

/** The east isolation-condenser train (scene/safety/icsLayout.ts): riser, condenser, return line. */
const ICS_EAST = { riser: [8.35, 2.5, -6.5], condenser: [10.5, 10.2, -6.5], back: [12.65, 1.5, -6.5] } as const satisfies Record<string, [number, number, number]>;

/** Chapter 11 anchors: the cask pad (presentation/scene/LimitsCues.tsx), the reactor building's roof edge, the site. */
const LIMITS = { casks: [LIMITS_PAD.center[0], 7, LIMITS_PAD.center[2]], reactor: [-6, 33, 6], site: [44, 0.5, 34] } as const satisfies Record<string, [number, number, number]>;

/** Chapter 8 anchor: a control blade in the cut core. */
const BLADE = [-0.65, RPV.insideBottomY + 4.8, 0.65] as [number, number, number];

// ---- World presets ------------------------------------------------------------------------------------

const VESSEL_FLOW = {
  'f.coreWater': 1,
  'f.chimneyMixture': 1,
  'f.downcomerWater': 1,
  'f.separatorWater': 1,
  'f.separatorSteam': 1,
  'f.drySteam': 1,
  'f.steamOutlet': 1,
  'f.boil': 1,
} as const;

const POWER_ON = {
  ...VESSEL_FLOW,
  'f.mainSteam': 1,
  'f.turbine': 1,
  'f.generator': 1,
  'f.electricity': 1,
  'f.shaft': 0.75,
  'y.show': 1,
  'y.exhaust': 1,
  'y.feedwater': 1,
  'g.show': 1,
  'g.power': 1,
  'g.city': 1,
} as const;

const ALL_FLOW_OFF = {
  'f.coreWater': 0,
  'f.chimneyMixture': 0,
  'f.downcomerWater': 0,
  'f.separatorWater': 0,
  'f.separatorSteam': 0,
  'f.drySteam': 0,
  'f.steamOutlet': 0,
  'f.mainSteam': 0,
  'f.turbine': 0,
  'f.generator': 0,
  'f.electricity': 0,
  'f.boil': 0,
  'f.shaft': 0,
  'y.exhaust': 0,
  'y.feedwater': 0,
  'g.power': 0,
} as const;

const ZOOM_EASE = 'power2.inOut';

// ---- Chapters ---------------------------------------------------------------------------------------------

export const CHAPTERS: readonly TalkChapter[] = [
  {
    id: 'hook',
    speaker: 'virgilijus',
    target: [0, 30],
    label: 'chapter.hook',
    hideLabel: true,
    idea: 'What if a nuclear plant were not one giant project, but something we could grow module by module? Who we are.',
    facts: [],
    unresolved: 'The QR is a scannable size test (presentation/qrCode.ts); the public URL and the presenter likenesses are TODO.',
    beats: [
      {
        id: 'hero',
        note: 'Stop 1. Fade in low on the reactor building; the camera rises into the low hero view, the plant right of centre. Then the presenters, the title in the dark sky, the QR.',
        camera: { cut: true, keys: [{ at: 0, pose: P.hookStart }, { at: 6.5, pose: P.hook }], drift: 0.7 },
        reveal: { to: CLOSED },
        look: { subjects: {}, ghosts: {}, contextDim: 0, interior: [] },
        // The plant's line to the grid is part of the picture (the closing returns to it, reconnected).
        world: { 'p.lights': 1, 'p.zoom': 0, 'g.show': 1, 'g.power': 1, 'g.city': 1 },
        cues: { speakers: { delay: 2.6, duration: 1.2 }, title: { delay: 3.6, duration: 1.2 }, qr: { delay: 4.6, duration: 1.0 }, grid: { delay: 1.0, duration: 3.0 } },
        overlay: [
          { kind: 'scrim', id: 'scrim-hero', side: 'hero', cue: 'speakers' },
          { kind: 'title', id: 'hook-title', kicker: 'hook.kicker', title: 'hook.title', position: 'top-left', cue: 'title' },
          { kind: 'speakers', id: 'speakers', layout: 'intro', cue: 'speakers' },
          { kind: 'qr', id: 'qr', layout: 'intro', cue: 'qr' },
        ],
        lock: 1.5,
      },
    ],
  },
  {
    id: 'lithuania',
    speaker: 'virgilijus',
    target: [30, 65],
    label: 'chapter.lithuania',
    idea: 'Renewables already make half of our electricity; a power system also needs controllable generation when the weather changes. Lithuania is officially assessing this reactor.',
    facts: ['ltRenewables2025', 'lithuaniaMou', 'loadFollowing'],
    unresolved: 'Wind-farm and solar positions are illustrative; the grid node the plant shrinks into is a generic point, not a site.',
    beats: [
      {
        id: 'renewables',
        note: 'Stop 2. The camera rises; the plant shrinks into a point on a filled ground while Lithuania opens around it: wind turns, solar shines, power flows to the cities. "50 %" counts up once.',
        camera: { keys: [{ at: 1.7, pose: P.ltRise }, { at: 4.4, pose: P.ltWide }], drift: 1 },
        world: { 'p.zoom': POINT, 'm.lt': 1, 'lt.wind': 1, 'lt.sun': 1, 'lt.imports': 0.2, 'g.show': 0, 'g.power': 0, 'g.city': 0 },
        worldTiming: {
          'g.show': { delay: 1.2 },
          'g.power': { duration: 0.8 },
          'p.zoom': { delay: 0.4, duration: 3.0, ease: ZOOM_EASE },
          'm.lt': { delay: 0.9, duration: 3.0, ease: 'sine.inOut' },
          'lt.wind': { delay: 2.6, duration: 1.4 },
          'lt.sun': { delay: 2.8, duration: 1.4 },
          'lt.imports': { delay: 3.2, duration: 1.4 },
        },
        cues: { stat: { delay: 4.0, duration: 1.8 }, statIn: { delay: 3.8, duration: 0.5 } },
        overlay: [
          { kind: 'scrim', id: 'scrim-lt', side: 'left', cue: 'statIn' },
          { kind: 'stat', id: 'lt-stat', value: 'lt.stat', caption: 'lt.statCaption', source: 'lt.note', count: { cue: 'stat', to: 50 }, position: 'left', y: 356, cue: 'statIn' },
        ],
        lock: 2.2,
      },
      {
        id: 'calm',
        note: 'Stop 3. A calm night: the turbines slow, the sun sets, local flows fade, imports grow; a controllable node lights up. "And when there is no wind or sun?"',
        camera: { keys: [{ at: 3.2, pose: P.ltCalm }] },
        world: { 'lt.wind': 0.06, 'lt.sun': 0, 'lt.imports': 1, 'lt.node': 1 },
        worldTiming: { 'lt.wind': { duration: 2.6 }, 'lt.sun': { duration: 2.2 }, 'lt.imports': { delay: 1.0, duration: 2.0 }, 'lt.node': { delay: 2.6, duration: 1.0 } },
        cues: { importsLabel: { delay: 2.4, duration: 0.6 } },
        textAt: 1.4,
        overlay: [
          { kind: 'scrim', id: 'scrim-lt', side: 'left' },
          { kind: 'caption', id: 'lt-calm', text: 'lt.calm', sub: 'lt.calmSub', position: 'left', y: 356 },
          { kind: 'label', id: 'lt-imports', text: 'lt.imports', at: ltToWorld(18.8, 56.13, 4), leader: [0, -44], tone: 'power', cue: 'importsLabel' },
        ],
        lock: 1.8,
      },
      {
        id: 'assessment',
        note: 'Stop 4. Lithuania warms up: the country is assessing the BWRX-300 (memorandum, February 2026).',
        camera: { keys: [{ at: 2.6, pose: P.ltMou }] },
        world: { 'lt.highlight': 1, 'lt.wind': 0.5, 'lt.sun': 0.35, 'lt.imports': 0.4 },
        textAt: 1.2,
        overlay: [
          { kind: 'scrim', id: 'scrim-lt', side: 'left' },
          { kind: 'caption', id: 'lt-mou', text: 'lt.mou', sub: 'lt.mouSub', source: 'lt.mouNote', position: 'left', y: 356 },
        ],
        lock: 1.2,
      },
    ],
  },
  {
    id: 'scale',
    speaker: 'virgilijus',
    target: [65, 105],
    label: 'chapter.scale',
    idea: 'An SMR does not change the physics; it changes the unit size. A large BWR of the same family (ESBWR, ~1,500 MW) beside the BWRX-300 at one scale: the vessels are about as tall, the large one far wider, with far more fuel and a much larger plant. Then five 300 MW units built one after another.',
    facts: ['largeUnit', 'esbwr', 'vessels', 'outputNet', 'smrDefinition'],
    unresolved: 'The large plant is a simplified BWR-family massing at matched scale (layout illustrative); the vessels are drawn to their sourced inside dimensions.',
    beats: [
      {
        id: 'large',
        note: 'Stop 5. Down into the node: the plant grows back as the map closes; beside it, at the same scale, a large ESBWR-class plant rises (~1,500 MW vs ~300 MW). The two reactor vessels appear side by side at one scale: as tall, much wider. Then (automatically) the large plant steps back and four more BWRX-300 units are built one after another: 5 x 300 MW.',
        camera: { keys: [{ at: 1.6, pose: P.ltDive }, { at: 4.8, pose: P.scaleWide }], drift: 0.6 },
        world: {
          'p.zoom': 0,
          'm.lt': 0,
          'lt.highlight': 0,
          'lt.node': 0,
          'lt.wind': 0,
          'lt.sun': 0,
          'lt.imports': 0,
          'k.show': 1,
          'k.large': 1,
          'e.fogNear': 650,
          'e.fogFar': 1250,
        },
        worldTiming: {
          'p.zoom': { delay: 0.2, duration: 3.0, ease: ZOOM_EASE },
          'm.lt': { delay: 0.3, duration: 2.8, ease: 'sine.inOut' },
          'lt.node': { delay: 1.6, duration: 0.6 },
          'k.show': { delay: 3.0 },
          'k.large': { delay: 3.2, duration: 2.8 },
          'e.fogNear': { delay: 3.0, duration: 2.5 },
          'e.fogFar': { delay: 3.0, duration: 2.5 },
        },
        cues: { smallLabel: { delay: 4.4, duration: 0.6 }, largeLabel: { delay: 5.8, duration: 0.6 }, vessels: { delay: 6.8, duration: 0.8 } },
        overlay: [
          { kind: 'label', id: 'scale-large', text: 'scale.large', sub: 'scale.largeSub', at: [LARGE_UNIT.center[0], LARGE_UNIT.labelY, LARGE_UNIT.center[2]], leader: [0, -30], size: 'value', tone: 'steel', cue: 'largeLabel' },
          { kind: 'label', id: 'scale-small', text: 'scale.small', sub: 'scale.smallSub', at: [0, 38, 0], leader: [0, -54], size: 'value', cue: 'smallLabel' },
          { kind: 'note', id: 'scale-note', text: 'scale.note', cue: 'largeLabel' },
          { kind: 'vessels', id: 'scale-vessels', position: 'bottom-right', cue: 'vessels' },
        ],
        lock: 3.0,
      },
      {
        id: 'modules',
        after: 12.5,
        note: 'Four more BWRX-300 units assemble one after another behind ours: 5 x 300 MW. The large unit steps back.',
        camera: { keys: [{ at: 4, pose: P.scaleModules }], drift: 0.7 },
        world: { 'k.modules': 4, 'k.largeDim': 1 },
        worldTiming: { 'k.modules': { delay: 1.2, duration: 6.5, ease: 'none' }, 'k.largeDim': { duration: 1.6 } },
        cues: { assembly: { delay: 2.8, duration: 0.8 }, modulesLabel: { delay: 6.9, duration: 0.8 } },
        overlay: [
          { kind: 'scrim', id: 'scrim-scale', side: 'left', cue: 'assembly' },
          { kind: 'caption', id: 'scale-assembly', text: 'scale.assembly', sub: 'scale.modulesSub', position: 'top-left', cue: 'assembly' },
          { kind: 'label', id: 'scale-modules', text: 'scale.modules', at: [0, 32, -336], leader: [48, -40], size: 'value', cue: 'modulesLabel' },
          { kind: 'note', id: 'scale-note', text: 'scale.note' },
        ],
      },
    ],
  },
  {
    id: 'facts',
    speaker: 'virgilijus',
    target: [105, 145],
    label: 'chapter.facts',
    idea: 'Three numbers: ~300 MW of electricity; the power block covers about 1.6 international football pitches (148 x 78 m against a 105 x 68 m pitch, the size of the National Stadium pitch being built in Vilnius); 24-36 months of construction for a series unit (vendor estimate).',
    facts: ['outputNet', 'footprint', 'pitch', 'constructionTime'],
    unresolved: "GE Vernova's 24-36 months differs from GD Rev J (30-36 months; <30 nth-of-a-kind). Both are vendor estimates. The 148 x 78 m power-block size is from GD Rev F (2023); Rev J gives 9,800 m2 (building envelope) without the sides.",
    beats: [
      {
        id: 'power',
        note: 'Stop 6. The comparison falls away; one unit remains, its hall lit, its line carrying power out. "~300 MW" counts up once it reads, beside the line it leaves by.',
        camera: { keys: [{ at: 3.4, pose: P.factsPower }], drift: 1 },
        // The large unit stays ghosted while it sinks away (it no longer turns solid on its way out).
        world: { 'k.show': 0, 'k.large': 0, 'k.largeDim': 1, 'k.modules': 0, 'g.show': 1, 'g.power': 1, 'g.city': 1, 'e.fogNear': FOG.near, 'e.fogFar': FOG.far },
        worldTiming: {
          'k.show': { delay: 2.2 },
          'k.large': { duration: 2.0 },
          'k.modules': { duration: 2.0 },
          'g.show': { delay: 0.6 },
          'g.power': { delay: 1.2, duration: 1.4 },
          'e.fogNear': { duration: 3 },
          'e.fogFar': { duration: 3 },
        },
        cues: { power: { delay: 2.4, duration: 1.6 } },
        overlay: [
          { kind: 'stat', id: 'facts-power', value: 'facts.power', unit: 'facts.powerUnit', caption: 'facts.powerCaption', count: { cue: 'power', to: 300 }, position: 'right', y: 160, cue: 'power' },
          { kind: 'label', id: 'facts-line', text: 'energy.grid', at: [136.5, 5.5, 14.5], leader: [24, 56], tone: 'power', cue: 'power' },
        ],
        lock: 2,
      },
      {
        id: 'footprint',
        note: 'Stop 7. From above, at one ground scale: the power block\'s ~148 x 78 m outline draws around our plant; beside it an international-size 105 x 68 m pitch in a schematic stadium (the National Stadium being built in Vilnius is a UEFA category 4 project: 105 x 68 m). "~1.6 football pitches of area" with its sources.',
        camera: { keys: [{ at: 3.4, pose: P.footprint }], drift: 0.6 },
        world: { 'q.block': 1, 'q.stadium': 1, 'g.show': 0, 'g.power': 0, 'g.city': 0 },
        worldTiming: { 'q.block': { delay: 1.4, duration: 1.6 }, 'q.stadium': { delay: 2.4, duration: 1.6 }, 'g.show': { delay: 1.0 }, 'g.power': { duration: 0.6 } },
        cues: { blockLabel: { delay: 2.8, duration: 0.6 }, stadiumLabel: { delay: 3.8, duration: 0.6 }, footprint: { delay: 4.4, duration: 0.7 } },
        overlay: [
          { kind: 'label', id: 'facts-block', text: 'facts.block', sub: 'facts.blockSub', at: [FOOTPRINT.block.x[1], 0.5, FOOTPRINT.block.z[0]], leader: [30, -46], tone: 'neutral', cue: 'blockLabel' },
          { kind: 'label', id: 'facts-stadium', text: 'facts.stadium', sub: 'facts.stadiumSub', at: [FOOTPRINT.pitch.center[0], 0.5, FOOTPRINT.pitch.center[1] - FOOTPRINT.pitch.width / 2], leader: [0, -58], tone: 'neutral', cue: 'stadiumLabel' },
          { kind: 'scrim', id: 'scrim-footprint', side: 'bottom-left', cue: 'footprint' },
          { kind: 'stat', id: 'facts-footprint', value: 'facts.footprint', unit: 'facts.footprintUnit', caption: 'facts.footprintCaption', source: 'facts.footprintNote', position: 'bottom-left', cue: 'footprint' },
        ],
        lock: 2,
      },
      {
        id: 'months',
        note: "Stop 8. A second, identical unit goes up beside ours while a 0-36 month timeline fills; the 24-36 band lights and \"24-36 months*\" lands with its qualifier (vendor estimate, series unit, first nuclear concrete to fuel load). Illustrative: one unit's construction window, not two plants built together.",
        camera: { keys: [{ at: 3.2, pose: P.factsMonths }], drift: 1 },
        world: { 'q.block': 0, 'q.stadium': 0, 'k.show': 1, 'k.modules': 1, 'k.large': 0, 'k.largeDim': 0 },
        worldTiming: { 'q.block': { duration: 1.0 }, 'q.stadium': { duration: 1.0 }, 'k.show': { duration: 0 }, 'k.modules': { delay: 0.9, duration: 4.0, ease: 'none' } },
        cues: { buildIn: { delay: 1.0, duration: 0.4 }, build: { delay: 0.9, duration: 4.0 }, monthsIn: { delay: 4.5, duration: 0.6 } },
        overlay: [
          { kind: 'scrim', id: 'scrim-months', side: 'left', cue: 'buildIn' },
          { kind: 'stat', id: 'facts-months', value: 'facts.months', unit: 'facts.monthsUnit', caption: 'facts.monthsCaption', source: 'facts.monthsNote', position: 'top-left', y: 130, cue: 'monthsIn' },
          { kind: 'label', id: 'facts-series', text: 'facts.seriesUnit', at: [0, 32, -84], leader: [36, -44], tone: 'neutral', cue: 'buildIn' },
          { kind: 'timeline', id: 'facts-timeline', progress: 'build', position: 'bottom-left', cue: 'buildIn' },
        ],
        lock: 1.6,
      },
    ],
  },
  {
    id: 'projects',
    speaker: 'virgilijus',
    target: [145, 180],
    label: 'chapter.projects',
    idea: 'This is not a concept: the first unit is being built in Canada; the US has a construction permit; Poland is licensing; others plan or assess.',
    facts: ['darlington', 'clinchRiver', 'poland', 'estonia', 'lithuaniaMou'],
    unresolved: 'Estonia and Lithuania pins mark countries, not sites. Statuses as of 2026-10-17.',
    beats: [
      {
        id: 'world',
        note: 'Stop 9. Up into geography: the plant becomes the Darlington pin as the North Atlantic opens; the other pins appear one by one, styled by status. Then (automatically) the camera glides to Canada: Darlington, under construction (CNSC licence April 2025); the other pins step back.',
        camera: { keys: [{ at: 1.7, pose: P.worldRise }, { at: 4.4, pose: P.worldWide }], drift: 1 },
        // The facts' second unit lowers away and the line goes dark before the plant shrinks into its pin.
        world: { 'p.zoom': POINT, 'm.world': 1, 'k.modules': 0, 'k.show': 0, 'g.show': 0, 'g.power': 0, 'g.city': 0 },
        worldTiming: {
          'p.zoom': { delay: 0.3, duration: 3.0, ease: ZOOM_EASE },
          'm.world': { delay: 0.8, duration: 3.0, ease: 'sine.inOut' },
          'k.modules': { duration: 1.2 },
          'k.show': { delay: 1.3 },
          'g.show': { delay: 1.2 },
          'g.power': { duration: 0.6 },
        },
        cues: {
          pins: { delay: 3.6, duration: 3.2 },
          legend: { delay: 4.2, duration: 0.6 },
          pinLabelDarlington: { delay: 3.9, duration: 0.6 },
          pinLabelClinch: { delay: 4.5, duration: 0.6 },
          pinLabelPoland: { delay: 5.1, duration: 0.6 },
          pinLabelEstonia: { delay: 5.7, duration: 0.6 },
          pinLabelLithuania: { delay: 6.3, duration: 0.6 },
        },
        // Map tags: role-1 labels on a quiet backing (the land is light); the dot carries the status
        // as the pin does (amber solid = under construction, the one current concept; ring = in progress).
        overlay: [
          { kind: 'legend', id: 'legend', source: 'projects.note', cue: 'legend' },
          { kind: 'pins', id: 'pins' },
          { kind: 'label', id: 'pin-darlington', text: 'projects.darlington', sub: 'projects.darlingtonSub', at: pinPosition('darlington', 9), leader: [-34, -46], tone: 'amber', panel: true, cue: 'pinLabelDarlington' },
          { kind: 'label', id: 'pin-clinch', text: 'projects.clinch', sub: 'projects.clinchSub', at: pinPosition('clinch', 2), leader: [-40, 40], tone: 'neutral', ring: true, panel: true, cue: 'pinLabelClinch' },
          { kind: 'label', id: 'pin-poland', text: 'projects.poland', sub: 'projects.polandSub', at: pinPosition('poland', 2), leader: [-30, 56], tone: 'neutral', ring: true, panel: true, cue: 'pinLabelPoland' },
          { kind: 'label', id: 'pin-estonia', text: 'projects.estonia', sub: 'projects.estoniaSub', at: pinPosition('estonia', 2), leader: [-34, -44], tone: 'steel', panel: true, cue: 'pinLabelEstonia' },
          { kind: 'label', id: 'pin-lithuania', text: 'projects.lithuania', sub: 'projects.lithuaniaSub', at: pinPosition('lithuania', 2), leader: [52, 6], tone: 'steel', ring: true, panel: true, cue: 'pinLabelLithuania' },
        ],
        lock: 2.4,
      },
      {
        id: 'darlington',
        after: 8.4,
        note: 'The camera glides to Canada: Darlington, under construction (CNSC licence April 2025); the other pins step back.',
        camera: { keys: [{ at: 3.4, pose: P.worldDarlington }], drift: 0.8 },
        world: { 'w.focus': 1 },
        // Darlington's tag fades and returns with its licence date once the camera has arrived (never swapped in place).
        cues: { darlingtonOut: { delay: 0.2, duration: 0.4 }, darlingtonIn: { delay: 2.8, duration: 0.6 } },
        overlay: [
          { kind: 'legend', id: 'legend', source: 'projects.note' },
          { kind: 'pins', id: 'pins' },
          { kind: 'label', id: 'pin-darlington', text: 'projects.darlington', sub: 'projects.darlingtonSub', at: pinPosition('darlington', 9), leader: [-34, -46], tone: 'amber', panel: true, out: 'darlingtonOut' },
          { kind: 'label', id: 'pin-darlington-licence', text: 'projects.darlington', sub: 'projects.darlingtonSub', source: 'projects.darlingtonNote', at: pinPosition('darlington', 9), leader: [-34, -46], tone: 'amber', panel: true, cue: 'darlingtonIn' },
        ],
        lightScene: true,
      },
    ],
  },
  {
    id: 'handoff',
    speaker: 'both',
    target: [180, 210],
    label: 'chapter.handoff',
    hideLabel: true,
    idea: 'Handoff: Virgilijus explained why this matters; Timofej now explains how the machine makes electricity. From the map into the plant, down to the core, in one move.',
    facts: [],
    unresolved: 'The descent is the approved Stage 3 shot from 1.5 s, replayed 1.45x faster.',
    beats: [
      {
        id: 'land',
        note: 'Stop 10. Into the Darlington pin: the plant grows out of it as the map closes, the camera arriving on the approved descent where it starts to push in; then (automatically, no exterior stop) the descent itself: ground, shaft, containment; the vessel opens on the core.',
        camera: { keys: [{ at: 1.4, pose: P.worldDive }, { at: 3.6, pose: 'stage3ExteriorPush' }], drift: 0 },
        reveal: { to: CLOSED },
        look: { subjects: {}, ghosts: {}, contextDim: 0, interior: [] },
        world: { 'p.zoom': 0, 'm.world': 0, 'w.focus': 0 },
        worldTiming: { 'p.zoom': { delay: 0.1, duration: 3.0, ease: ZOOM_EASE }, 'm.world': { delay: 0.3, duration: 2.6, ease: 'sine.inOut' } },
        overlay: [],
        lock: 3.0,
      },
      {
        id: 'descend',
        after: 3.6,
        note: 'The approved Stage 3 descent from its push-in (master 1.5-15.4 s at 1.45x): ground, shaft, containment; the vessel opens on the core.',
        camera: { master: { from: 1.5, to: 15.4, speed: 1.45 } },
        reveal: { master: true },
        look: { master: true },
        overlay: [],
      },
    ],
  },
  {
    id: 'fission',
    speaker: 'timofej',
    target: [210, 245],
    label: 'chapter.fission',
    idea: 'Where the heat starts: a neutron is absorbed by a U-235 nucleus, which splits; the fragments carry the energy that becomes heat; 2-3 neutrons fly off. Some are absorbed, some split further nuclei: the chain grows over a few generations, then holds steady. In a reactor it is controlled: on average each fission causes one more.',
    facts: ['fissionNeutrons', 'coreCounts'],
    unresolved: 'Schematic: 96 spheres per nucleus, neutron moderation not drawn; the steady state is a seeded, periodic field (k = 1 shown as one successful neutron per fission).',
    beats: [
      {
        id: 'chain',
        note: 'Stop 11. From a spot on the fuel the micro view opens: neutron -> U-235 -> split -> heat, three neutrons (one absorbed) -> two more splits -> a handful -> the view widens into a steady field of fissions in the fuel, held indefinitely (no restart).',
        camera: { keys: [{ at: 1.2, pose: 'masterCoreHold' }], drift: 0.25 },
        reveal: { to: CORE_OPEN },
        // The bright core recedes while the micro view opens (luminance ramps, it does not cut).
        look: { subjects: {}, ghosts: {}, contextDim: 0.9, interior: [], duration: 1.8 },
        world: { 'x.open': 1, 'x.spot': 0 },
        worldTiming: { 'x.open': { delay: 0.6, duration: 2.2, ease: 'none' } },
        cues: { controlled: { delay: 0.6 + FIELD_TIMING.steadyLabel, duration: 0.8 } },
        overlay: [
          { kind: 'microLabels', id: 'fission-micro' },
          { kind: 'note', id: 'fission-note', text: 'fission.note' },
          { kind: 'caption', id: 'fission-controlled', text: 'fission.controlled', sub: 'fission.controlledSub', position: 'bottom-left', size: 'h2', cue: 'controlled' },
        ],
        lock: 2,
      },
    ],
  },
  {
    id: 'control',
    speaker: 'timofej',
    target: [245, 275],
    label: 'chapter.control',
    idea: 'Control blades between the fuel bundles absorb neutrons: further in, fewer fissions, a weaker reaction; further out, a stronger one.',
    facts: ['coreCounts'],
    unresolved: 'Representative blade pattern and time-compressed motion; the cue is not MW or %.',
    beats: [
      {
        id: 'inFuel',
        note: 'Stop 12. The micro view collapses into the fuel spot as warmth (this happens in the fuel); then (automatically) out to the control blades, one illustrative insert / withdraw cycle, and a hold with both statements.',
        world: { 'x.open': 0, 'x.spot': 1 },
        worldTiming: { 'x.open': { duration: 2.0, ease: 'none' }, 'x.spot': { delay: 1.0, duration: 0.7 } },
        cues: { inFuel: { delay: 1.5, duration: 0.5 } },
        overlay: [{ kind: 'label', id: 'fission-in-fuel', text: 'fission.inFuel', at: FUEL_SPOT, leader: [64, -40], tone: 'copper', panel: true, cue: 'inFuel' }],
        lock: 1.6,
      },
      {
        id: 'blades',
        after: 2.8,
        note: 'From the warm spot back out: the fuel, the bundles, then the control blades, copper; the reaction cue (glints) at full. The blades are the subject; the bright fuel stays a step back.',
        camera: { keys: [{ at: 1.6, pose: 'coreCloseup' }, { at: 3.8, pose: 'masterBlades' }], drift: 0.35 },
        reveal: { to: { bladeEmphasis: 1 }, timing: { delay: 2.0, duration: 1.0 } },
        look: { subjects: { [C.controlBlades]: 1 }, contextDim: 0.8, duration: 2.4 },
        world: { 'x.spot': 0, 'c.activity': 1, 'c.amount': 0, 'f.coreWater': 0.4, 'f.downcomerWater': 0.3, 'f.boil': 1 },
        worldTiming: { 'x.spot': { duration: 1.0 }, 'c.activity': { delay: 2.0, duration: 0.9 } },
        cues: { bladesLabel: { delay: 3.4, duration: 0.6 } },
        // The blades are the frame's one current concept: the label's dot sits on one (amber).
        overlay: [
          { kind: 'note', id: 'control-note', text: 'control.note', cue: 'bladesLabel' },
          { kind: 'label', id: 'control-blades', text: 'control.blades', sub: 'control.absorb', at: BLADE, leader: [70, -26], tone: 'amber', cue: 'bladesLabel' },
        ],
        lightScene: true,
      },
      {
        id: 'insert',
        after: 5.0,
        note: 'The blades move in; the glints thin out.',
        world: { 'c.amount': 1 },
        worldTiming: { 'c.amount': { delay: 0.2, duration: 1.8 } },
        cues: { inserted: { delay: 1.0, duration: 0.5 } },
        overlay: [
          { kind: 'note', id: 'control-note', text: 'control.note' },
          { kind: 'label', id: 'control-blades', text: 'control.blades', sub: 'control.absorb', at: BLADE, leader: [70, -26], tone: 'amber' },
          { kind: 'scrim', id: 'scrim-control', side: 'bottom-left', cue: 'inserted' },
          { kind: 'caption', id: 'control-state', text: 'control.inserted', position: 'bottom-left', y: 868, size: 'h2', cue: 'inserted' },
        ],
        lightScene: true,
      },
      {
        id: 'withdraw',
        after: 3.6,
        note: 'The blades move back out; the glints return. Both statements stay for the hold.',
        world: { 'c.amount': 0 },
        worldTiming: { 'c.amount': { delay: 0.2, duration: 1.8 } },
        cues: { withdrawn: { delay: 1.0, duration: 0.5 } },
        overlay: [
          { kind: 'note', id: 'control-note', text: 'control.note' },
          { kind: 'label', id: 'control-blades', text: 'control.blades', sub: 'control.absorb', at: BLADE, leader: [70, -26], tone: 'amber' },
          { kind: 'scrim', id: 'scrim-control', side: 'bottom-left' },
          { kind: 'caption', id: 'control-state', text: 'control.inserted', position: 'bottom-left', y: 868, size: 'h2' },
          { kind: 'caption', id: 'control-state-out', text: 'control.withdrawn', position: 'bottom-left', y: 924, size: 'h2', cue: 'withdrawn' },
        ],
        lightScene: true,
      },
    ],
  },
  {
    id: 'energy',
    speaker: 'timofej',
    target: [275, 325],
    label: 'chapter.energy',
    idea: 'One continuous journey: heat in the fuel boils water; steam rises, is dried, drives the turbine and the generator; the condenser turns it back into water that returns to the reactor; electricity goes to the grid.',
    facts: ['naturalCirculation', 'condenserLoop', 'homes'],
    unresolved: 'One main steam line drawn (the design has two); pumps and feedwater heaters simplified away.',
    beats: [
      {
        id: 'boil',
        note: 'Stop 13. Reactor -> dry steam. The control demo settles; water rises through the core and boils; the mixture rises through the chimney; cooler water returns down the sides. Then (automatically) separators throw the water out, the dryer catches the last drops: dry steam leaves the vessel.',
        camera: { keys: [{ at: 3.0, pose: 'masterArchitecture' }], drift: 0.5 },
        reveal: { to: { bladeEmphasis: 0 }, timing: { duration: 0.8 } },
        look: { subjects: { [C.core]: 1, [C.chimney]: 1 }, ghosts: {}, contextDim: 0.55, interior: [] },
        world: { 'c.activity': 0, 'c.amount': 0, 'f.coreWater': 1, 'f.chimneyMixture': 1, 'f.downcomerWater': 1, 'f.boil': 1 },
        worldTiming: { 'f.chimneyMixture': { delay: 0.8, duration: 1.2 }, 'f.downcomerWater': { delay: 1.4, duration: 1.2 } },
        cues: { boilLabels: { delay: 2.4, duration: 0.6 } },
        overlay: [
          { kind: 'label', id: 'energy-water', text: 'energy.water', at: [-0.8, RPV.insideBottomY + 7.5, 1.2], leader: [-70, 0], tone: 'cool', cue: 'boilLabels' },
          { kind: 'label', id: 'energy-boil', text: 'energy.boil', at: [-0.6, RPV.insideBottomY + 10, 0.8], leader: [-70, 0], tone: 'steam', cue: 'boilLabels' },
        ],
        lock: 2.4,
      },
      {
        id: 'steam',
        after: 5.2,
        note: 'Separators throw the water out, the dryer catches the last drops: dry steam leaves the vessel.',
        camera: { keys: [{ at: 2.4, pose: 'masterSeparators' }, { at: 5.0, pose: 'masterSteamExit' }], drift: 0.5 },
        look: { subjects: { [C.steamSeparators]: 1, [C.steamDryer]: 1, [C.mainSteamNozzle]: 0.8 }, contextDim: 0.55, interior: ['steamPath'] },
        world: { 'f.separatorWater': 1, 'f.separatorSteam': 1, 'f.drySteam': 1, 'f.steamOutlet': 1, 'f.coreWater': 0.7 },
        worldTiming: { 'f.drySteam': { delay: 1.6, duration: 1 }, 'f.steamOutlet': { delay: 3.4, duration: 1 } },
        cues: { sepLabel: { delay: 1.8, duration: 0.6 }, dryLabel: { delay: 4.2, duration: 0.6 } },
        overlay: [
          { kind: 'label', id: 'energy-separators', text: 'energy.separators', at: [-1.2, -6.6, 1.2], leader: [-80, 0], tone: 'steam', cue: 'sepLabel' },
          { kind: 'label', id: 'energy-dryer', text: 'energy.dryer', at: [-0.9, -3.6, 0.9], leader: [-80, 0], tone: 'steam', cue: 'dryLabel' },
        ],
      },
      {
        id: 'turbine',
        note: 'Stop 14. Steam -> turbine -> condenser. Steam runs along the main steam line to the turbine; the shaft starts turning. Then (automatically) under the turbine the condenser turns exhaust steam back into water; pumps send it back to the reactor. The water cycle closes.',
        camera: { keys: [{ at: 2.6, pose: 'masterSteamLine' }, { at: 5.2, pose: 'masterTurbine' }], drift: 0.6 },
        reveal: { to: { exteriorDim: 0.25 }, timing: { delay: 1.2, duration: 2.0 } },
        look: { subjects: { [C.mainSteamPath]: 1, [C.turbine]: 1 }, ghosts: { [C.turbineBuilding]: 1 }, contextDim: 0, interior: ['steamPath'] },
        world: { 'f.mainSteam': 1, 'f.turbine': 1, 'f.shaft': 0.75 },
        worldTiming: { 'f.mainSteam': { delay: 0.6, duration: 0.6 }, 'f.turbine': { delay: 3.6, duration: 0.8 }, 'f.shaft': { delay: 4.0, duration: 2.0 } },
        cues: { steam: { delay: 0.6, duration: 3.6 }, turbine: { delay: 3.8, duration: 3.0 }, turbineLabel: { delay: 4.6, duration: 0.6 } },
        overlay: [{ kind: 'label', id: 'energy-turbine', text: 'energy.turbine', at: [56, 19, 0], leader: [0, -64], tone: 'steam', cue: 'turbineLabel' }],
        lock: 3.0,
      },
      {
        id: 'condenser',
        after: 6.6,
        note: 'Under the turbine the condenser turns exhaust steam back into water; pumps send it back to the reactor. The water cycle closes.',
        camera: { keys: [{ at: 2.6, pose: P.condenser }, { at: 6.4, pose: P.cycleWide }], drift: 0.6 },
        look: { subjects: { [C.turbine]: 0.5 }, ghosts: { [C.turbineBuilding]: 1 }, contextDim: 0, interior: ['steamPath', 'turbineHall'] },
        world: { 'y.show': 1, 'y.exhaust': 1, 'y.feedwater': 1 },
        worldTiming: { 'y.exhaust': { delay: 1.4, duration: 1.0 }, 'y.feedwater': { delay: 2.8, duration: 1.0 } },
        cues: { cycle: { delay: 2.6, duration: 5.0 }, condLabel: { delay: 2.4, duration: 0.6 }, returnLabel: { delay: 6.2, duration: 0.6 } },
        overlay: [
          { kind: 'label', id: 'energy-condenser', text: 'energy.condenser', at: [61, 4.5, 6], leader: [56, 22], tone: 'cool', cue: 'condLabel' },
          { kind: 'label', id: 'energy-return', text: 'energy.return', at: [18, -9.6, 2.2], leader: [30, 46], tone: 'cool', cue: 'returnLabel' },
        ],
      },
      {
        id: 'grid',
        note: 'Stop 15. Grid -> homes. The generator sends electricity out of the hall, through the transformer, along the line: the city lights up (scale illustration), "~300,000 homes*".',
        camera: { keys: [{ at: 2.0, pose: 'masterGenerator' }, { at: 4.0, pose: P.gridMid }, { at: 6.8, pose: P.grid }], drift: 0.8 },
        look: { subjects: { [C.generator]: 1 }, ghosts: { [C.turbineBuilding]: 1 }, contextDim: 0, interior: ['steamPath', 'turbineHall'] },
        world: { 'f.electricity': 1, 'f.generator': 1, 'g.show': 1, 'g.power': 1, 'g.city': 1, 'e.fogNear': 900, 'e.fogFar': 1500 },
        worldTiming: {
          'f.electricity': { delay: 1.0, duration: 0.6 },
          'g.power': { delay: 2.6, duration: 0.6 },
          'g.city': { delay: 5.0, duration: 2.2 },
          'e.fogNear': { delay: 2.4, duration: 3 },
          'e.fogFar': { delay: 2.4, duration: 3 },
        },
        cues: { power: { delay: 1.0, duration: 2.0 }, grid: { delay: 2.6, duration: 2.8 }, homes: { delay: 6.6, duration: 1.6 }, homesIn: { delay: 6.4, duration: 0.5 }, genLabel: { delay: 0.9, duration: 0.6 } },
        overlay: [
          { kind: 'label', id: 'energy-generator', text: 'energy.generator', at: [80, 17.2, 0], leader: [0, -56], tone: 'power', cue: 'genLabel', out: 'grid' },
          { kind: 'stat', id: 'energy-homes', value: 'energy.homes', unit: 'energy.homesCaption', source: 'energy.homesNote', count: { cue: 'homes', to: 300000, group: true }, position: 'top-right', y: 250, cue: 'homesIn' },
        ],
        lock: 3,
      },
    ],
  },
  {
    id: 'safety',
    speaker: 'timofej',
    target: [325, 375],
    label: 'chapter.safety',
    idea: 'External power is lost; the chain reaction stops, but decay heat remains. Isolation condensers in pools above the reactor remove it by natural circulation: no pumps, no external power, seven days without operator action.',
    facts: ['icsTrains', 'icsSevenDays', 'decayHeat'],
    unresolved: 'All three trains are drawn running; the narration says two are enough. Pool and IC layout approximate.',
    beats: [
      {
        id: 'normal',
        note: 'Stop 16. Normal -> power loss -> scram -> decay heat. Back from the city to the plant, still running; then (automatically) external power is lost, the reaction stops, but the heat remains; hold.',
        camera: { keys: [{ at: 4.0, pose: P.overview }], drift: 0.6 },
        reveal: { to: { ...CORE_OPEN, exteriorDim: 0.6, poolsReveal: 1 }, timing: { delay: 0.5, duration: 2.0 } },
        look: { subjects: {}, ghosts: { [C.turbineBuilding]: 1 }, contextDim: 0, interior: ['steamPath', 'turbineHall'] },
        world: { ...POWER_ON, 'f.coreWater': 0.8, 'e.fogNear': FOG.near, 'e.fogFar': FOG.far },
        worldTiming: { 'e.fogNear': { duration: 3 }, 'e.fogFar': { duration: 3 } },
        textAt: 2.8,
        overlay: [{ kind: 'caption', id: 'safety-normal', text: 'safety.normal', position: 'top-right' }],
        lock: 2.6,
      },
      {
        id: 'blackout',
        after: 5.4,
        note: 'External power is lost: the line goes dark, the hall lights go out, the site dims, steam stops, the turbine winds down.',
        reveal: { to: { exteriorDim: 1 }, timing: { delay: 0.2, duration: 0.8 } },
        world: { 'g.power': 0, 'p.lights': 0.08, 'f.electricity': 0, 'f.mainSteam': 0, 'f.turbine': 0, 'f.generator': 0, 'f.shaft': 0, 'y.exhaust': 0, 'y.feedwater': 0, 'f.steamOutlet': 0.2 },
        worldTiming: {
          'g.power': { duration: 0.25 },
          'p.lights': { delay: 0.15, duration: 0.5 },
          'f.electricity': { duration: 0.3 },
          'f.mainSteam': { delay: 0.6, duration: 1.2 },
          'f.turbine': { delay: 0.8, duration: 2.0 },
          'f.shaft': { delay: 0.3, duration: 7 },
          'y.exhaust': { delay: 1, duration: 2 },
          'y.feedwater': { delay: 0.4, duration: 1.4 },
        },
        textAt: 0.8,
        overlay: [{ kind: 'caption', id: 'safety-blackout', text: 'safety.blackout', position: 'top-right' }],
      },
      {
        id: 'scram',
        after: 3.2,
        note: 'The chain reaction stops: every blade goes in, the glints die out.',
        // Through the open front of the cut plant, not through the pools and the containment wall.
        camera: { keys: [{ at: 1.7, pose: P.scramApproach }, { at: 3.2, pose: 'masterBlades' }], drift: 0.3 },
        reveal: { to: { bladeEmphasis: 1, exteriorDim: 1 }, timing: { delay: 1.8, duration: 0.8 } },
        // The blades are the subject; the bright fuel stays a step back (no luminance jump from the dark site).
        look: { subjects: { [C.controlBlades]: 1 }, contextDim: 0.8, ghosts: {}, interior: [], duration: 2.4 },
        world: {
          'c.activity': 1,
          'c.scram': 1,
          'f.coreWater': 0.4,
          'f.downcomerWater': 0.3,
          'f.chimneyMixture': 0.3,
          'f.separatorWater': 0,
          'f.separatorSteam': 0,
          'f.drySteam': 0,
          'f.steamOutlet': 0,
          'g.show': 0,
          'y.show': 0,
        },
        worldTiming: { 'c.activity': { delay: 2.2, duration: 0.6 }, 'c.scram': { delay: 3.2, duration: 1.3, ease: 'power2.in' }, 'g.show': { delay: 2 }, 'y.show': { delay: 2 } },
        textAt: 3.0,
        overlay: [
          { kind: 'scrim', id: 'scrim-safety', side: 'right' },
          { kind: 'caption', id: 'safety-scram', text: 'safety.scram', position: 'top-right' },
        ],
        lightScene: true,
      },
      {
        id: 'decay',
        after: 5.2,
        note: 'But the heat does not go away: the vessel stays warm (decay heat). Fission ≈ 0, heat ≠ 0.',
        camera: { keys: [{ at: 3.0, pose: P.decay }], drift: 0.5 },
        reveal: { to: { bladeEmphasis: 0 }, timing: { duration: 1 } },
        look: { subjects: { [C.rpv]: 0.6 }, contextDim: 0.5 },
        world: { 's.decayHeat': 1, 'c.activity': 0 },
        worldTiming: { 's.decayHeat': { delay: 0.6, duration: 2.2 }, 'c.activity': { delay: 1.5, duration: 0.8 } },
        cues: { meters: { delay: 2.4, duration: 0.6 } },
        textAt: 1.6,
        overlay: [
          { kind: 'scrim', id: 'scrim-safety', side: 'right' },
          { kind: 'caption', id: 'safety-heat', text: 'safety.heat', position: 'top-right' },
          { kind: 'meters', id: 'safety-meters', cue: 'meters' },
        ],
      },
      {
        id: 'ics',
        note: 'Stop 17. The isolation condenser loop: steam rises to the submerged condensers, heat goes into the pool, water returns by gravity. No pump. Then (automatically) time runs once: 0 h -> 7 days*, and stops; the passive loop keeps running; hold.',
        camera: { keys: [{ at: 1.4, pose: 'masterSafetyRise' }, { at: 4.2, pose: P.icsLoop }], drift: 0.6 },
        reveal: { to: { vesselCut: 0, rpvEmphasis: 1, poolsReveal: 1 }, tracks: { vesselCut: { delay: 0.6, duration: 1.4 }, rpvEmphasis: { delay: 1.0, duration: 1.6 } } },
        look: { subjects: { [C.icsPools]: 1.6 }, contextDim: 0.5 },
        world: { 's.icsSteam': 1, 's.icsCondensing': 1, 's.icsCondensate': 1, 's.poolHeat': 1, 'f.coreWater': 0, 'f.downcomerWater': 0, 'f.chimneyMixture': 0 },
        worldTiming: { 's.icsSteam': { delay: 3.6, duration: 0.4 }, 's.icsCondensing': { delay: 4.6, duration: 0.4 }, 's.icsCondensate': { delay: 5.4, duration: 0.4 }, 's.poolHeat': { delay: 5.0, duration: 1.2 } },
        cues: { ics: { delay: 3.6, duration: 3.6 }, icsLabels: { delay: 5.0, duration: 0.6 } },
        textAt: 3.4,
        // The loop's three labels on the east train, in the order the water goes: steam up the riser,
        // heat into the pool at the condenser, condensate back down (process-coloured dots).
        overlay: [
          { kind: 'caption', id: 'safety-ics', text: 'safety.ics', sub: 'safety.icsSub', position: 'top-right' },
          { kind: 'label', id: 'loop-steam', text: 'safety.steamUp', at: ICS_EAST.riser, leader: [-62, -30], tone: 'steam', cue: 'icsLabels' },
          { kind: 'label', id: 'loop-pool', text: 'safety.pool', at: ICS_EAST.condenser, leader: [-60, -64], tone: 'copper', cue: 'icsLabels' },
          { kind: 'label', id: 'loop-back', text: 'safety.waterBack', at: ICS_EAST.back, leader: [70, 40], tone: 'cool', cue: 'icsLabels' },
        ],
        lock: 3.6,
      },
      {
        id: 'days',
        after: 6.4,
        note: 'Time runs once: 0 h -> 1 day -> ... -> 7 days, then stops; the passive loop keeps running. One eye path: reactor -> loop -> the right column.',
        cues: { days: { delay: 0.4, duration: 5.5 } },
        overlay: [
          { kind: 'caption', id: 'safety-ics', text: 'safety.ics', sub: 'safety.icsSub', position: 'top-right' },
          { kind: 'label', id: 'loop-steam', text: 'safety.steamUp', at: ICS_EAST.riser, leader: [-62, -30], tone: 'steam' },
          { kind: 'label', id: 'loop-pool', text: 'safety.pool', at: ICS_EAST.condenser, leader: [-60, -64], tone: 'copper' },
          { kind: 'label', id: 'loop-back', text: 'safety.waterBack', at: ICS_EAST.back, leader: [70, 40], tone: 'cool' },
          { kind: 'counter', id: 'safety-days', cue: 'days' },
        ],
      },
    ],
  },
  {
    id: 'limits',
    speaker: 'timofej',
    target: [375, 395],
    label: 'chapter.limits',
    idea: 'Smaller and simpler is not consequence-free: SMRs still produce radioactive waste, must be licensed, and the first projects carry cost and schedule risk.',
    facts: [],
    unresolved: 'The cask pad is a presentation-only cue (no storage design is shown or claimed); the document and schedule glyphs are abstractions. No numbers.',
    beats: [
      {
        id: 'limits',
        note: 'Stop 18. The rhythm slows: wide over the plant, calmly lit again. Three honest limits, each tied to a place: spent fuel in casks beside the reactor; licensing, layered approvals on the reactor building; first-of-a-kind risk, a schedule with an uncertain end, on the site.',
        camera: { keys: [{ at: 4.2, pose: P.limits }], drift: 0.8 },
        reveal: { to: { exteriorDim: 0.15 }, timing: { delay: 0.6, duration: 2.4 } },
        world: { 's.icsSteam': 0.6, 's.icsCondensing': 0.6, 's.icsCondensate': 0.6, 's.poolHeat': 0.6, 'p.lights': 1, 'l.casks': 1 },
        worldTiming: { 'p.lights': { delay: 0.8, duration: 2.0 }, 'l.casks': { delay: 1.2, duration: 1.6 } },
        cues: { waste: { delay: 2.4, duration: 0.8 }, licensing: { delay: 3.4, duration: 0.8 }, cost: { delay: 4.4, duration: 0.8 } },
        overlay: [
          { kind: 'label', id: 'limits-waste', text: 'limits.waste', sub: 'limits.wasteSub', at: LIMITS.casks, leader: [70, -100], tone: 'steel', cue: 'waste' },
          { kind: 'label', id: 'limits-licensing', text: 'limits.licensing', sub: 'limits.licensingSub', at: LIMITS.reactor, leader: [-30, -110], tone: 'steel', glyph: 'layers', cue: 'licensing' },
          { kind: 'label', id: 'limits-cost', text: 'limits.cost', sub: 'limits.costSub', at: LIMITS.site, leader: [-20, 96], tone: 'steel', glyph: 'schedule', cue: 'cost' },
        ],
        lock: 2,
      },
    ],
  },
  {
    id: 'close',
    speaker: 'both',
    target: [395, 420],
    label: 'chapter.close',
    hideLabel: true,
    idea: 'One press from the limitations: the plant closes around its passive system and stands whole again, reconnected, as the camera returns through open space to the opening composition; the thesis, "Your questions", the contacts and the QR; it holds for the Q&A.',
    facts: [],
    unresolved: 'The closing line on screen is a placeholder for the final wording.',
    beats: [
      {
        id: 'return',
        note: 'Stop 19 (the last press). The limits text clears; vessel, containment, shaft and ground close while the camera glides through open space back to the opening view; the grid reconnects; then (automatically) the thesis, "Your questions" in amber, the presenters, the larger QR. Holds for Q&A.',
        camera: { keys: [{ at: 5.6, pose: P.hook }], drift: 0.7 },
        reveal: {
          to: CLOSED,
          tracks: {
            vesselCut: { delay: 0.2, duration: 1.2 },
            poolsReveal: { delay: 1.6, duration: 0.1 },
            rpvEmphasis: { delay: 0.4, duration: 1.6 },
            bladeEmphasis: { duration: 0.6 },
            containmentReveal: { delay: 0.9, duration: 1.4 },
            shaftReveal: { delay: 1.7, duration: 1.6 },
            groundCut: { delay: 2.6, duration: 1.8 },
            exteriorDim: { delay: 2.8, duration: 2.0 },
          },
        },
        look: { subjects: {}, ghosts: {}, contextDim: 0, interior: [], duration: 2 },
        world: { ...ALL_FLOW_OFF, 's.icsSteam': 0, 's.icsCondensing': 0, 's.icsCondensate': 0, 's.poolHeat': 0, 's.decayHeat': 0, 'c.scram': 0, 'c.activity': 0, 'p.lights': 1, 'g.show': 1, 'g.power': 1, 'g.city': 1, 'l.casks': 0 },
        worldTiming: { 'p.lights': { delay: 3.6, duration: 1.2 }, 'g.power': { delay: 4.4, duration: 0.8 }, 'c.scram': { duration: 0.01 }, 'g.city': { delay: 4.6, duration: 1.4 }, 'l.casks': { duration: 1.2 } },
        overlay: [],
        lock: 3,
      },
      {
        id: 'qa',
        after: 5.0,
        note: 'The opening composition again (same low hero camera): the thesis at display size, "Your questions" in amber, the presenters, the larger QR. Holds for Q&A.',
        cues: { closeTitle: { delay: 0.3, duration: 1.0 }, closeSpeakers: { delay: 1.0, duration: 1.0 }, closeQr: { delay: 1.6, duration: 1.0 } },
        overlay: [
          { kind: 'scrim', id: 'scrim-hero', side: 'hero', cue: 'closeTitle' },
          { kind: 'title', id: 'close-thesis', title: 'close.thesis', sub: 'close.questions', position: 'top-left', measure: 760, cue: 'closeTitle' },
          { kind: 'speakers', id: 'speakers', layout: 'outro', cue: 'closeSpeakers' },
          { kind: 'qr', id: 'qr', layout: 'outro', cue: 'closeQr' },
        ],
      },
    ],
  },
];
