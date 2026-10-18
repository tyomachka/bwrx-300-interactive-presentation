/**
 * Presentation v1: the ~7-minute talk, chapter by chapter (the script the controller plays).
 *
 * Final stage: ONE presenter stop per chapter, 12 chapters, 11 presses from the opening to the
 * questions. A press means "the spoken idea changes": it enters the chapter, whose internal beats
 * (`after`) then play by themselves, timed to the final Lithuanian narration
 * (docs/final/FINAL_SPEECH_LT.md, cue sheet docs/final/PRESENTER_CUES_LT.md), and the chapter holds on
 * its final state indefinitely, physical processes still running (flow, steam, turbine, the passive
 * loop, the chain reaction). The rhythm is change -> settle -> the presenter speaks over a living
 * hold -> the next change. Target times are speaking guides, never timers; a press after the short
 * guard goes straight to the next chapter. Information effects (count-ups, pins, the 0 h -> 7 days
 * counter) run once.
 *
 * Text follows the picture: a beat's new text fades in once its subject reads (`textAt`, or the
 * item's own cue), after the outgoing text has gone; text that stays across beats never re-enters.
 *
 * One continuous world: the plant never cuts away. The maps lie on the ground at the plant and the
 * plant shrinks into its point on them (p.zoom, about its own origin on grade) as the camera rises
 * (chapters 1 -> 2, 4 -> 5), and grows back out of it as the camera dives (2 -> 3, 5 -> 6), on a
 * filled ground (scene/TalkScene.tsx: the earth and the filler switch in the same frame). Comparison
 * buildings are built up from grade and leave by dissolving where they stand, never by sinking.
 * Only the very first stop fades in. Camera paths run through open space.
 *
 * Camera poses here are presentation-only (the frozen Stage 3/6 poses in config/camera.ts are
 * referenced by name and never edited). World metres: grade y = 0, reactor axis at the origin,
 * turbine hall east (+x), the open south front +z, north -z.
 *
 * Design B (editorial cinematic): every settled frame is composed on the grid of
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
import { GHOST_VESSELS, LARGE_UNIT } from './scene/comparisonLayout';
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
  /** 2 -> 3: down into the node; the plant grows back. */
  ltDive: pose([-26, 70, 74], [0, 2, 0]),
  /**
   * Matched scale: both plants side by side on one baseline (reactor buildings on z = 0), seen square
   * from the south from far away with a long lens, so neither is favoured by perspective.
   */
  scaleCompare: pose([-83, 108, 650], [-83, 16, 0], 24),
  scaleModules: pose([-120, 300, 470], [-10, 0, -170]),
  /** The two reactor buildings with their vessels in front of them, the right column free for the diagram. */
  scaleVessels: pose([-18, 54, 348], [-18, 14, 20], 27),
  /** Facts. */
  /** One unit, its transformer and the line leaving to the right: the power has somewhere to go. */
  factsPower: pose([-70, 55, 175], [85, 8, 0]),
  /** The power block's area and the pitch, near top-down (an honest area comparison), at one ground scale. */
  footprint: pose([-20, 460, 130], [-24, 0, 25], 31),
  /** 24-36 months: our plant and a second, identical unit going up beside it. */
  factsMonths: pose([-190, 34, 95], [-6, 14, -50], 30),
  /** 4 -> 5: up into geography, the plant becoming the Darlington pin. */
  worldRise: pose([-60, 120, 180], [20, 0, 0]),
  worldWide: pose([40, 205, 135], [68, 0, -10]),
  worldDarlington: pose([-24, 66, 64], [0, 1, 2]),
  /** 5 -> 6: into the pin, the plant growing out of it, onto the start of the approved descent. */
  worldDive: pose([-44, 30, 70], [6, 4, 0]),
  /** Energy: condenser under the LP turbines, the feedwater line home, the grid. */
  condenser: pose([88, 7.5, 34], [60, 5.5, 0]),
  cycleWide: pose([-4, 30, 104], [30, -4, 0]),
  gridMid: pose([118, 46, 132], [170, 12, 34]),
  /** The end of the path: the plant small upstream, the line, the whole lit city (a street grid with its skyline). */
  grid: pose([860, 230, 760], [420, 0, 190]),
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

/** Chapter 3 anchors: above each reactor building (the output), the top of the large vessel outline. */
const SCALE = {
  large: [LARGE_UNIT.center[0], LARGE_UNIT.labelY, LARGE_UNIT.center[2]],
  small: [0, 38, 0],
  vessel: [GHOST_VESSELS[0].x, GHOST_VESSELS[0].height + 0.5, GHOST_VESSELS[0].z],
} as const satisfies Record<string, [number, number, number]>;

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

/** The comparison back at rest, behind its dissolve (every channel switched while nothing is drawn). */
const COMPARISON_CLEARED = { 'k.show': 0, 'k.large': 0, 'k.largeDim': 0, 'k.modules': 0, 'k.modulesFade': 0, 'k.vessels': 0 } as const;
const clearedAfter = (delay: number) => Object.fromEntries(Object.keys(COMPARISON_CLEARED).map((k) => [k, { delay, duration: 0 }]));

const ZOOM_EASE = 'power2.inOut';

/** The guard against an accidental double press (s): after it, a press goes straight to the next chapter. */
const GUARD = 1.2;

// ---- Chapters ---------------------------------------------------------------------------------------------

export const CHAPTERS: readonly TalkChapter[] = [
  {
    id: 'hook',
    speaker: 'virgilijus',
    target: [0, 25],
    label: 'chapter.hook',
    hideLabel: true,
    idea: 'Imagine a nuclear plant that is not one giant project but standard blocks repeated as needed. Who we are; what is inside the BWRX-300.',
    facts: [],
    beats: [
      {
        id: 'hero',
        note: 'Chapter 1. Fade in low on the reactor building; the camera rises into the low hero view, the plant right of centre. Then the presenters, the title in the dark sky, the QR (the public page).',
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
    target: [25, 55],
    label: 'chapter.lithuania',
    idea: "Renewables generated an amount equal to half of Lithuania's 2025 electricity demand (49.9 %; all local generation 73.3 % of demand). The system still has to be balanced when there is no wind or sun: the question is what reliably complements it. Lithuania is assessing the BWRX-300.",
    facts: ['ltRenewables2025', 'lithuaniaMou', 'loadFollowing'],
    unresolved: 'Wind-farm and solar positions are illustrative; the grid node the plant shrinks into is a generic point, not a site.',
    beats: [
      {
        id: 'renewables',
        note: 'Press 1. The camera rises; the plant shrinks into a point on the filled ground while Lithuania opens around it: wind turns, solar shines, power flows to the cities. "50 %" counts up (renewable generation = 49.9 % of total demand), then the local-generation line (73.3 % of demand).',
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
        cues: { stat: { delay: 4.0, duration: 1.8 }, statIn: { delay: 3.8, duration: 0.5 }, local: { delay: 9.5, duration: 0.6 } },
        overlay: [
          { kind: 'scrim', id: 'scrim-lt', side: 'left', cue: 'statIn' },
          { kind: 'stat', id: 'lt-stat', value: 'lt.stat', caption: 'lt.statCaption', detail: { text: 'lt.local', cue: 'local' }, source: 'lt.note', count: { cue: 'stat', to: 50 }, position: 'left', y: 330, cue: 'statIn' },
        ],
        lock: GUARD,
      },
      {
        id: 'calm',
        after: 14.0,
        note: 'A calm night: the turbines slow, the sun sets, local flows fade, imports grow; a controllable node lights up. "And when there is no wind or sun?"',
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
      },
      {
        id: 'assessment',
        after: 8.5,
        note: 'Lithuania warms up: the country is assessing the BWRX-300 (memorandum, 25 February 2026). Holds on a clean Lithuania view.',
        camera: { keys: [{ at: 2.6, pose: P.ltMou }] },
        world: { 'lt.highlight': 1, 'lt.wind': 0.5, 'lt.sun': 0.35, 'lt.imports': 0.4 },
        textAt: 1.2,
        overlay: [
          { kind: 'scrim', id: 'scrim-lt', side: 'left' },
          { kind: 'caption', id: 'lt-mou', text: 'lt.mou', sub: 'lt.mouSub', source: 'lt.mouNote', position: 'left', y: 356 },
        ],
      },
    ],
  },
  {
    id: 'scale',
    speaker: 'virgilijus',
    target: [55, 95],
    label: 'chapter.scale',
    idea: 'An SMR does not change the physics; it changes the scale and how a plant is built and grown. One BWRX-300 is ~300 MW; the ESBWR of the same family ~1,535 MW (net). Five BWRX-300 units are a similar total output (not a one-to-one substitute). The reactor vessels are about as tall (~27 m); width, fuel, output and the whole plant differ.',
    facts: ['largeUnit', 'esbwr', 'vessels', 'outputNet', 'smrDefinition'],
    unresolved: 'The large plant is a simplified BWR-family massing at matched scale (layout illustrative); the vessels are drawn to their sourced inside dimensions.',
    beats: [
      {
        id: 'units',
        note: 'Press 2. Down into the node: the plant grows back as the map closes, the camera settling square on, far away, one baseline. "≈ 300 MW" over our plant; then, at the same scale, the large ESBWR-class plant is built up beside it ("≈ 1 535 MW").',
        camera: { keys: [{ at: 1.6, pose: P.ltDive }, { at: 5.6, pose: P.scaleCompare }], drift: 0.5 },
        world: {
          'p.zoom': 0,
          'm.lt': 0,
          'lt.highlight': 0,
          'lt.node': 0,
          'lt.wind': 0,
          'lt.sun': 0,
          'lt.imports': 0,
          'k.show': 1,
          'k.fade': 0,
          'k.large': 1,
          'e.fogNear': 700,
          'e.fogFar': 1400,
        },
        worldTiming: {
          'p.zoom': { delay: 0.2, duration: 3.0, ease: ZOOM_EASE },
          'm.lt': { delay: 0.3, duration: 2.8, ease: 'sine.inOut' },
          'lt.node': { delay: 1.6, duration: 0.6 },
          'k.show': { delay: 3.0 },
          'k.fade': { duration: 0 },
          'k.large': { delay: 8.0, duration: 3.0 },
          'e.fogNear': { delay: 3.0, duration: 2.5 },
          'e.fogFar': { delay: 3.0, duration: 2.5 },
        },
        cues: { smallLabel: { delay: 6.6, duration: 0.6 }, largeLabel: { delay: 10.8, duration: 0.6 } },
        overlay: [
          { kind: 'label', id: 'scale-small', text: 'scale.small', sub: 'scale.smallSub', at: SCALE.small, leader: [0, -54], size: 'value', cue: 'smallLabel' },
          { kind: 'label', id: 'scale-large', text: 'scale.large', sub: 'scale.largeSub', at: SCALE.large, leader: [0, -30], size: 'value', tone: 'steel', cue: 'largeLabel' },
          { kind: 'note', id: 'scale-note', text: 'scale.note', cue: 'largeLabel' },
        ],
        lock: GUARD,
      },
      {
        id: 'modules',
        after: 17.0,
        note: 'The large unit steps back; four more BWRX-300 units are built one after another behind ours: 5 x 300 MW, a similar total output (not a one-to-one substitute).',
        camera: { keys: [{ at: 4, pose: P.scaleModules }], drift: 0.7 },
        world: { 'k.modules': 4, 'k.largeDim': 1 },
        worldTiming: { 'k.modules': { delay: 1.0, duration: 6.5, ease: 'none' }, 'k.largeDim': { duration: 1.6 } },
        cues: { assembly: { delay: 2.4, duration: 0.8 }, modulesLabel: { delay: 6.4, duration: 0.8 } },
        overlay: [
          { kind: 'scrim', id: 'scrim-scale', side: 'left', cue: 'assembly' },
          { kind: 'caption', id: 'scale-assembly', text: 'scale.assembly', sub: 'scale.modulesSub', position: 'top-left', cue: 'assembly' },
          { kind: 'label', id: 'scale-modules', text: 'scale.modules', at: [0, 32, -336], leader: [48, -40], size: 'value', cue: 'modulesLabel' },
          { kind: 'note', id: 'scale-note', text: 'scale.note' },
        ],
      },
      {
        id: 'vessels',
        after: 10.0,
        note: 'Back square on the two plants: the copies dissolve, the large unit returns solid; the two reactor vessels stand as amber outlines in front of their reactor buildings at the same scale (as tall, far wider), with the sourced vessel diagram: "Similar height. Width, fuel, output and system scale differ." Holds.',
        camera: { keys: [{ at: 3.4, pose: P.scaleVessels }], drift: 0.5 },
        world: { 'k.modulesFade': 1, 'k.largeDim': 0, 'k.vessels': 1 },
        worldTiming: { 'k.modulesFade': { duration: 1.2 }, 'k.largeDim': { delay: 0.6, duration: 1.4 }, 'k.vessels': { delay: 1.6, duration: 1.6 } },
        cues: { valueLabels: { delay: 2.4, duration: 0.6 }, vesselLabel: { delay: 2.8, duration: 0.6 }, vessels: { delay: 3.2, duration: 0.8 } },
        overlay: [
          { kind: 'note', id: 'scale-note', text: 'scale.note' },
          { kind: 'label', id: 'scale-small-v', text: 'scale.small', sub: 'scale.smallSub', at: SCALE.small, leader: [0, -124], size: 'value', cue: 'valueLabels' },
          { kind: 'label', id: 'scale-large-v', text: 'scale.large', sub: 'scale.largeSub', at: SCALE.large, leader: [56, -40], size: 'value', tone: 'steel', cue: 'valueLabels' },
          { kind: 'label', id: 'scale-vessel', text: 'scale.vesselLabel', sub: 'scale.vesselLabelSub', at: SCALE.vessel, leader: [44, -64], tone: 'amber', panel: true, cue: 'vesselLabel' },
          { kind: 'scrim', id: 'scrim-vessels', side: 'right', cue: 'vessels' },
          { kind: 'vessels', id: 'scale-vessels', position: 'bottom-right', cue: 'vessels' },
        ],
      },
    ],
  },
  {
    id: 'facts',
    speaker: 'virgilijus',
    target: [95, 135],
    label: 'chapter.facts',
    idea: 'Three numbers: ~300 MW of electricity; a power block of ~9,800 m2, about 1.4 football pitches of area (a 105 x 68 m pitch, the size UEFA requires of category 4 stadiums such as the National Stadium being built in Vilnius); 24-36 months, the vendor target for later units from first nuclear concrete to ready for fuel load.',
    facts: ['outputNet', 'footprint', 'pitch', 'constructionTime'],
    unresolved: "Rev J gives the 9,800 m2 power-block footprint without side lengths: the rectangle on screen is an area-equivalent schematic (the pitch's width), labelled as such. 24-36 months is GE Vernova's target (GD Rev J: 30-36 months; <30 nth-of-a-kind).",
    beats: [
      {
        id: 'power',
        note: 'Press 3. The comparison dissolves where it stands; one unit remains, its hall lit, its line carrying power out. "~300 MW" counts up beside the line it leaves by.',
        camera: { keys: [{ at: 3.4, pose: P.factsPower }], drift: 1 },
        world: { ...COMPARISON_CLEARED, 'k.fade': 1, 'g.show': 1, 'g.power': 1, 'g.city': 1, 'e.fogNear': FOG.near, 'e.fogFar': FOG.far },
        worldTiming: {
          ...clearedAfter(1.3),
          'k.fade': { duration: 1.1 },
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
        lock: GUARD,
      },
      {
        id: 'footprint',
        after: 7.0,
        note: 'From above, at one ground scale: the power block\'s 9,800 m2 as an area-equivalent rectangle with the pitch\'s width (dashed amber, then filled) around our plant; beside it a 105 x 68 m pitch in a schematic stadium (UEFA category 4: the Vilnius National Stadium is a category 4 project). "≈ 1.4 football pitches of area" with its source.',
        camera: { keys: [{ at: 3.4, pose: P.footprint }], drift: 0.6 },
        world: { 'q.block': 1, 'q.stadium': 1, 'g.show': 0, 'g.power': 0, 'g.city': 0 },
        worldTiming: { 'q.block': { delay: 1.4, duration: 2.2 }, 'q.stadium': { delay: 2.4, duration: 1.6 }, 'g.show': { delay: 1.0 }, 'g.power': { duration: 0.6 } },
        cues: { blockLabel: { delay: 3.0, duration: 0.6 }, stadiumLabel: { delay: 3.8, duration: 0.6 }, footprint: { delay: 4.4, duration: 0.7 } },
        overlay: [
          { kind: 'label', id: 'facts-block', text: 'facts.block', sub: 'facts.blockSub', at: [(FOOTPRINT.block.x[0] + FOOTPRINT.block.x[1]) / 2 - 20, 0.5, FOOTPRINT.block.z[0]], leader: [0, -96], tone: 'amber', cue: 'blockLabel' },
          { kind: 'label', id: 'facts-stadium', text: 'facts.stadium', sub: 'facts.stadiumSub', source: 'facts.stadiumNote', at: [FOOTPRINT.pitch.center[0] + 12, 0.5, FOOTPRINT.pitch.center[1] - FOOTPRINT.pitch.width / 2], leader: [0, -40], tone: 'neutral', panel: true, cue: 'stadiumLabel' },
          { kind: 'scrim', id: 'scrim-footprint', side: 'bottom-left', cue: 'footprint' },
          { kind: 'stat', id: 'facts-footprint', value: 'facts.footprint', unit: 'facts.footprintUnit', caption: 'facts.footprintCaption', source: 'facts.footprintNote', position: 'bottom-left', cue: 'footprint' },
        ],
      },
      {
        id: 'months',
        after: 18.0,
        note: 'A second, identical unit is built beside ours while a 0-36 month timeline fills; the 24-36 band lights and "24-36 months*" lands with its qualifier (vendor target for later units, first nuclear concrete to ready for fuel load, not the whole licensing and project time). Illustrative: one unit\'s construction window.',
        camera: { keys: [{ at: 3.2, pose: P.factsMonths }], drift: 1 },
        world: { 'q.block': 0, 'q.stadium': 0, 'k.show': 1, 'k.fade': 0, 'k.modules': 1, 'k.large': 0, 'k.largeDim': 0 },
        worldTiming: { 'q.block': { duration: 1.0 }, 'q.stadium': { duration: 1.0 }, 'k.show': { duration: 0 }, 'k.fade': { duration: 0 }, 'k.modules': { delay: 0.9, duration: 4.0, ease: 'none' } },
        cues: { buildIn: { delay: 1.0, duration: 0.4 }, build: { delay: 0.9, duration: 4.0 }, monthsIn: { delay: 3.8, duration: 0.6 } },
        overlay: [
          { kind: 'scrim', id: 'scrim-months', side: 'left', cue: 'buildIn' },
          { kind: 'stat', id: 'facts-months', value: 'facts.months', unit: 'facts.monthsUnit', caption: 'facts.monthsCaption', source: 'facts.monthsNote', position: 'top-left', y: 130, cue: 'monthsIn' },
          { kind: 'label', id: 'facts-series', text: 'facts.seriesUnit', at: [0, 32, -84], leader: [36, -44], tone: 'neutral', cue: 'buildIn' },
          { kind: 'timeline', id: 'facts-timeline', progress: 'build', position: 'bottom-left', cue: 'buildIn' },
        ],
      },
    ],
  },
  {
    id: 'projects',
    speaker: 'virgilijus',
    target: [135, 170],
    label: 'chapter.projects',
    idea: 'Not just drawings: the first unit is under construction at Darlington; Clinch River received its construction permit in September 2026; Poland is developing its national generic BWRX-300 design; Estonia selected it; Lithuania is assessing it. Real projects, but series construction still has to prove itself.',
    facts: ['darlington', 'clinchRiver', 'poland', 'estonia', 'lithuaniaMou'],
    unresolved: 'Estonia and Lithuania pins mark countries, not sites. Statuses as of 2026-10-18.',
    beats: [
      {
        id: 'world',
        note: 'Press 4. The second unit dissolves; up into geography: the plant becomes the Darlington pin as the North Atlantic opens. Each pin appears, styled by status, as it is named: Darlington (under construction), Clinch River (construction permit 2026-09-29), Poland (generic design), Estonia (selected, planned), Lithuania (assessing).',
        camera: { keys: [{ at: 1.7, pose: P.worldRise }, { at: 4.4, pose: P.worldWide }], drift: 1 },
        world: { ...COMPARISON_CLEARED, 'k.fade': 1, 'p.zoom': POINT, 'm.world': 1, 'g.show': 0, 'g.power': 0, 'g.city': 0 },
        worldTiming: {
          ...clearedAfter(1.0),
          'k.fade': { duration: 0.9 },
          'p.zoom': { delay: 0.6, duration: 3.0, ease: ZOOM_EASE },
          'm.world': { delay: 0.9, duration: 3.0, ease: 'sine.inOut' },
          'g.show': { delay: 1.2 },
          'g.power': { duration: 0.6 },
        },
        cues: {
          legend: { delay: 4.4, duration: 0.6 },
          'pin.darlington': { delay: 3.8, duration: 0.7 },
          pinLabelDarlington: { delay: 4.1, duration: 0.6 },
          'pin.clinch': { delay: 7.2, duration: 0.7 },
          pinLabelClinch: { delay: 7.5, duration: 0.6 },
          'pin.poland': { delay: 10.8, duration: 0.7 },
          pinLabelPoland: { delay: 11.1, duration: 0.6 },
          'pin.estonia': { delay: 13.0, duration: 0.7 },
          pinLabelEstonia: { delay: 13.3, duration: 0.6 },
          'pin.lithuania': { delay: 15.0, duration: 0.7 },
          pinLabelLithuania: { delay: 15.3, duration: 0.6 },
        },
        // Map tags: role-1 labels on a quiet backing (the land is light); the dot carries the status
        // as the pin does (amber solid = under construction, the one current concept; light solid =
        // construction permit; ring = in development / assessing; muted = planned or assessed).
        overlay: [
          { kind: 'legend', id: 'legend', source: 'projects.note', cue: 'legend' },
          { kind: 'pins', id: 'pins' },
          { kind: 'label', id: 'pin-darlington', text: 'projects.darlington', sub: 'projects.darlingtonSub', at: pinPosition('darlington', 9), leader: [-34, -46], tone: 'amber', panel: true, cue: 'pinLabelDarlington' },
          { kind: 'label', id: 'pin-clinch', text: 'projects.clinch', sub: 'projects.clinchSub', at: pinPosition('clinch', 6), leader: [44, 40], tone: 'neutral', panel: true, cue: 'pinLabelClinch' },
          { kind: 'label', id: 'pin-poland', text: 'projects.poland', sub: 'projects.polandSub', at: pinPosition('poland', 5), leader: [-40, 84], tone: 'neutral', ring: true, panel: true, cue: 'pinLabelPoland' },
          { kind: 'label', id: 'pin-estonia', text: 'projects.estonia', sub: 'projects.estoniaSub', at: pinPosition('estonia', 2), leader: [-34, -44], tone: 'steel', panel: true, cue: 'pinLabelEstonia' },
          { kind: 'label', id: 'pin-lithuania', text: 'projects.lithuania', sub: 'projects.lithuaniaSub', at: pinPosition('lithuania', 2), leader: [-92, 22], tone: 'steel', ring: true, panel: true, cue: 'pinLabelLithuania' },
        ],
        lock: GUARD,
      },
      {
        id: 'darlington',
        after: 21.5,
        note: '"Real projects, but series construction still has to prove itself": the camera glides to Canada: Darlington, under construction (CNSC licence 4 April 2025); the other pins step back. Holds.',
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
    target: [170, 195],
    label: 'chapter.handoff',
    hideLabel: true,
    idea: 'Handoff: why the project matters (Virgilijus) -> what happens inside (Timofej). Into the Darlington pin, the plant stands whole; "the reactor is deep underground: let us go down to it"; the approved descent to the core; Timofej takes over from one uranium nucleus.',
    facts: [],
    unresolved: 'The descent is the approved Stage 3 shot from 1.5 s, replayed 1.3x faster.',
    beats: [
      {
        id: 'land',
        note: 'Press 5. Into the Darlington pin: the plant grows out of it as the map closes, the camera arriving on the approved descent where it starts to push in; a short living hold on the exterior ("what happens inside?").',
        camera: { keys: [{ at: 1.4, pose: P.worldDive }, { at: 3.6, pose: 'stage3ExteriorPush' }], drift: 0.4 },
        reveal: { to: CLOSED },
        look: { subjects: {}, ghosts: {}, contextDim: 0, interior: [] },
        world: { 'p.zoom': 0, 'm.world': 0, 'w.focus': 0 },
        worldTiming: { 'p.zoom': { delay: 0.1, duration: 3.0, ease: ZOOM_EASE }, 'm.world': { delay: 0.3, duration: 2.6, ease: 'sine.inOut' } },
        overlay: [],
        lock: GUARD,
      },
      {
        id: 'descend',
        after: 8.0,
        note: '"The reactor is deep underground. Let us go down to it": the approved Stage 3 descent from its push-in (master 1.5-15.4 s at 1.3x): ground, shaft, containment; the vessel opens on the core, and holds there for the handover.',
        camera: { master: { from: 1.5, to: 15.4, speed: 1.3 } },
        reveal: { master: true },
        look: { master: true },
        overlay: [],
      },
    ],
  },
  {
    id: 'fission',
    speaker: 'timofej',
    target: [195, 235],
    label: 'chapter.fission',
    idea: 'Everything starts with one small event: a neutron is absorbed by U-235, the nucleus becomes unstable and splits into two fragments; their motion becomes heat in the fuel; a few more neutrons fly off. When one of them causes another fission the reaction branches. In a reactor it is not allowed to grow: on average one fission causes about one more.',
    facts: ['fissionNeutrons', 'coreCounts'],
    unresolved: 'Schematic: 96 spheres per nucleus, neutron moderation not drawn; three neutrons drawn per fission (the qualifier says 2-3); the steady state is a seeded, periodic field (k = 1 shown as one successful neutron per fission).',
    beats: [
      {
        id: 'chain',
        note: 'Press 6. From a spot on the fuel the micro view opens, paced to the narration: neutron -> U-235 (absorbed ~5 s) -> split (~7 s) -> heat, three neutrons (one absorbed) -> two fissions (~12 s) -> three (~17 s) -> the view widens into a steady field of fissions in the fuel, held indefinitely (no restart); "controlled chain reaction" at ~27 s.',
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
        lock: GUARD,
      },
    ],
  },
  {
    id: 'control',
    speaker: 'timofej',
    target: [235, 260],
    label: 'chapter.control',
    idea: 'Control blades between the fuel bundles absorb neutrons: further in, fewer neutrons continue the chain and the power falls; withdrawn, more reactions. Power is controlled through the neutron balance in the core, not by "turning up a fire".',
    facts: ['coreCounts'],
    unresolved: 'Representative blade pattern and time-compressed motion; the cue is not MW or %.',
    beats: [
      {
        id: 'inFuel',
        note: 'Press 7. The micro view collapses into the fuel spot as warmth (this happens in the fuel); then out to the control blades, one illustrative insert / withdraw cycle timed to the two sentences, and a hold with both statements.',
        world: { 'x.open': 0, 'x.spot': 1 },
        worldTiming: { 'x.open': { duration: 2.0, ease: 'none' }, 'x.spot': { delay: 1.0, duration: 0.7 } },
        cues: { inFuel: { delay: 1.5, duration: 0.5 } },
        overlay: [{ kind: 'label', id: 'fission-in-fuel', text: 'fission.inFuel', at: FUEL_SPOT, leader: [64, -40], tone: 'copper', panel: true, cue: 'inFuel' }],
        lock: GUARD,
      },
      {
        id: 'blades',
        after: 2.4,
        note: 'From the warm spot back out: the fuel, the bundles, then the control blades, copper; the reaction cue (glints) at full. The blades are the subject; the bright fuel stays a step back.',
        camera: { keys: [{ at: 1.6, pose: 'coreCloseup' }, { at: 3.8, pose: 'masterBlades' }], drift: 0.35 },
        reveal: { to: { bladeEmphasis: 1 }, timing: { delay: 2.0, duration: 1.0 } },
        look: { subjects: { [C.controlBlades]: 1 }, contextDim: 0.8, duration: 2.4 },
        world: { 'x.spot': 0, 'c.activity': 1, 'c.amount': 0, 'f.coreWater': 0.4, 'f.downcomerWater': 0.3, 'f.boil': 1 },
        worldTiming: { 'x.spot': { duration: 1.0 }, 'c.activity': { delay: 2.0, duration: 0.9 } },
        cues: { bladesLabel: { delay: 3.2, duration: 0.6 } },
        // The blades are the frame's one current concept: the label's dot sits on one (amber).
        overlay: [
          { kind: 'note', id: 'control-note', text: 'control.note', cue: 'bladesLabel' },
          { kind: 'label', id: 'control-blades', text: 'control.blades', sub: 'control.absorb', at: BLADE, leader: [70, -26], tone: 'amber', cue: 'bladesLabel' },
        ],
        lightScene: true,
      },
      {
        id: 'insert',
        after: 4.4,
        note: '"When we insert the blades deeper...": the blades move in; the glints thin out.',
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
        after: 5.6,
        note: '"When we withdraw them...": the blades move back out; the glints return. Both statements stay for the hold.',
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
    target: [260, 310],
    label: 'chapter.energy',
    idea: 'Fission made heat; it heats water in the core. Normal flow through the core needs no large recirculation pumps: natural circulation. Separators and the dryer remove the droplets; steam goes straight to the turbine, which turns the generator; after the turbine the steam is condensed and the water returns. The reaction makes heat, not electricity: the rest is a familiar steam plant.',
    facts: ['naturalCirculation', 'condenserLoop', 'homes'],
    unresolved: 'One main steam line drawn (the design has two); pumps and feedwater heaters simplified away.',
    beats: [
      {
        id: 'boil',
        note: 'Press 8. The control demo settles; water rises through the core and boils; the mixture rises through the chimney; cooler water returns down the sides: "Natural circulation" (no large recirculation pumps for normal flow).',
        camera: { keys: [{ at: 3.0, pose: 'masterArchitecture' }], drift: 0.5 },
        reveal: { to: { bladeEmphasis: 0 }, timing: { duration: 0.8 } },
        look: { subjects: { [C.core]: 1, [C.chimney]: 1 }, ghosts: {}, contextDim: 0.55, interior: [] },
        world: { 'c.activity': 0, 'c.amount': 0, 'f.coreWater': 1, 'f.chimneyMixture': 1, 'f.downcomerWater': 1, 'f.boil': 1 },
        worldTiming: { 'f.chimneyMixture': { delay: 0.8, duration: 1.2 }, 'f.downcomerWater': { delay: 1.4, duration: 1.2 } },
        cues: { boilLabels: { delay: 2.4, duration: 0.6 }, natural: { delay: 7.0, duration: 0.7 } },
        overlay: [
          { kind: 'label', id: 'energy-water', text: 'energy.water', at: [-0.8, RPV.insideBottomY + 7.5, 1.2], leader: [-70, 0], tone: 'cool', cue: 'boilLabels' },
          { kind: 'label', id: 'energy-boil', text: 'energy.boil', at: [-0.6, RPV.insideBottomY + 10, 0.8], leader: [-70, 0], tone: 'steam', cue: 'boilLabels' },
          { kind: 'scrim', id: 'scrim-energy', side: 'bottom-left', cue: 'natural' },
          { kind: 'caption', id: 'energy-natural', text: 'energy.natural', sub: 'energy.naturalSub', position: 'bottom-left', size: 'h2', cue: 'natural' },
        ],
        lock: GUARD,
      },
      {
        id: 'steam',
        after: 17.0,
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
        after: 5.5,
        note: 'Steam runs along the main steam line straight to the turbine; the shaft starts turning (it drives the generator).',
        camera: { keys: [{ at: 2.6, pose: 'masterSteamLine' }, { at: 5.2, pose: 'masterTurbine' }], drift: 0.6 },
        reveal: { to: { exteriorDim: 0.25 }, timing: { delay: 1.2, duration: 2.0 } },
        look: { subjects: { [C.mainSteamPath]: 1, [C.turbine]: 1 }, ghosts: { [C.turbineBuilding]: 1 }, contextDim: 0, interior: ['steamPath'] },
        world: { 'f.mainSteam': 1, 'f.turbine': 1, 'f.shaft': 0.75 },
        worldTiming: { 'f.mainSteam': { delay: 0.6, duration: 0.6 }, 'f.turbine': { delay: 3.4, duration: 0.8 }, 'f.shaft': { delay: 3.8, duration: 2.0 } },
        cues: { steam: { delay: 0.6, duration: 3.4 }, turbine: { delay: 3.6, duration: 3.0 }, turbineLabel: { delay: 3.8, duration: 0.6 } },
        overlay: [{ kind: 'label', id: 'energy-turbine', text: 'energy.turbine', at: [56, 19, 0], leader: [0, -64], tone: 'steam', cue: 'turbineLabel' }],
      },
      {
        id: 'condenser',
        after: 6.0,
        note: 'Under the turbine the condenser turns exhaust steam back into water; pumps send it back to the reactor. The water cycle closes.',
        camera: { keys: [{ at: 2.6, pose: P.condenser }, { at: 5.6, pose: P.cycleWide }], drift: 0.6 },
        look: { subjects: { [C.turbine]: 0.5 }, ghosts: { [C.turbineBuilding]: 1 }, contextDim: 0, interior: ['steamPath', 'turbineHall'] },
        world: { 'y.show': 1, 'y.exhaust': 1, 'y.feedwater': 1 },
        worldTiming: { 'y.exhaust': { delay: 1.2, duration: 1.0 }, 'y.feedwater': { delay: 2.4, duration: 1.0 } },
        cues: { cycle: { delay: 2.4, duration: 4.4 }, condLabel: { delay: 2.0, duration: 0.6 }, returnLabel: { delay: 5.4, duration: 0.6 } },
        overlay: [
          { kind: 'label', id: 'energy-condenser', text: 'energy.condenser', at: [61, 4.5, 6], leader: [56, 22], tone: 'cool', cue: 'condLabel' },
          { kind: 'label', id: 'energy-return', text: 'energy.return', at: [18, -9.6, 2.2], leader: [30, 46], tone: 'cool', cue: 'returnLabel' },
        ],
      },
      {
        id: 'grid',
        after: 7.0,
        note: '"The reaction makes heat, not electricity": the generator sends electricity out of the hall, through the transformer, along the line: the city lights up (scale illustration), "≈ 300,000 homes*" with the vendor qualifier. Holds on the city.',
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
      },
    ],
  },
  {
    id: 'safety',
    speaker: 'timofej',
    target: [310, 360],
    label: 'chapter.safety',
    idea: 'External power is lost; the reactor is shut down, but decay heat remains and the fuel must still be cooled. Three independent isolation-condenser trains: steam rises to the condensers, gives its heat to the pool water, condenses and returns. Per the design description two of three trains remove decay heat for seven days without external power or operator action: gravity and natural circulation do the work.',
    facts: ['icsTrains', 'icsSevenDays', 'decayHeat'],
    unresolved: 'All three trains are drawn running; the narration and the note say two are enough. Pool and IC layout approximate.',
    beats: [
      {
        id: 'normal',
        note: 'Press 9. Back from the city to the plant, still running ("normal operation"); then external power is lost, the reactor is shut down, the heat remains; the passive loop; 0 h -> 7 days*; holds.',
        camera: { keys: [{ at: 4.0, pose: P.overview }], drift: 0.6 },
        reveal: { to: { ...CORE_OPEN, exteriorDim: 0.6, poolsReveal: 1 }, timing: { delay: 0.5, duration: 2.0 } },
        look: { subjects: {}, ghosts: { [C.turbineBuilding]: 1 }, contextDim: 0, interior: ['steamPath', 'turbineHall'] },
        world: { ...POWER_ON, 'f.coreWater': 0.8, 'e.fogNear': FOG.near, 'e.fogFar': FOG.far },
        worldTiming: { 'e.fogNear': { duration: 3 }, 'e.fogFar': { duration: 3 } },
        textAt: 2.2,
        overlay: [{ kind: 'caption', id: 'safety-normal', text: 'safety.normal', position: 'top-right' }],
        lock: GUARD,
      },
      {
        id: 'blackout',
        after: 4.4,
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
        after: 1.6,
        note: 'The reactor is shut down: every blade goes in, the glints die out.',
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
        worldTiming: { 'c.activity': { delay: 2.2, duration: 0.6 }, 'c.scram': { delay: 3.0, duration: 1.3, ease: 'power2.in' }, 'g.show': { delay: 2 }, 'y.show': { delay: 2 } },
        textAt: 2.8,
        overlay: [
          { kind: 'scrim', id: 'scrim-safety', side: 'right' },
          { kind: 'caption', id: 'safety-scram', text: 'safety.scram', position: 'top-right' },
        ],
        lightScene: true,
      },
      {
        id: 'decay',
        after: 4.8,
        note: 'But the heat does not vanish at once: the vessel stays warm (decay heat). Fission ≈ 0, decay heat ≠ 0.',
        camera: { keys: [{ at: 3.0, pose: P.decay }], drift: 0.5 },
        reveal: { to: { bladeEmphasis: 0 }, timing: { duration: 1 } },
        look: { subjects: { [C.rpv]: 0.6 }, contextDim: 0.5 },
        world: { 's.decayHeat': 1, 'c.activity': 0 },
        worldTiming: { 's.decayHeat': { delay: 0.6, duration: 2.2 }, 'c.activity': { delay: 1.5, duration: 0.8 } },
        cues: { meters: { delay: 2.4, duration: 0.6 } },
        textAt: 1.4,
        overlay: [
          { kind: 'scrim', id: 'scrim-safety', side: 'right' },
          { kind: 'caption', id: 'safety-heat', text: 'safety.heat', position: 'top-right' },
          { kind: 'meters', id: 'safety-meters', cue: 'meters' },
        ],
      },
      {
        id: 'ics',
        after: 6.2,
        note: 'The isolation-condenser loop (three independent trains): steam rises to the submerged condensers, heat goes into the pool, water returns by gravity. No pump.',
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
      },
      {
        id: 'days',
        after: 14.0,
        note: '"Two of three trains suffice for seven days": time runs once, 0 h -> 1 day -> ... -> 7 days*, then stops; the passive loop keeps running; holds. One eye path: reactor -> loop -> the right column.',
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
    target: [360, 385],
    label: 'chapter.limits',
    idea: 'A smaller reactor is not a magic answer: nuclear waste does not disappear, licensing stays strict, and the first projects of a new design carry more financial and construction risk. The real test is building, costing and operating the first units.',
    facts: [],
    unresolved: 'The cask pad is a presentation-only cue (no storage design is shown or claimed); the document and schedule glyphs are abstractions. No numbers.',
    beats: [
      {
        id: 'limits',
        note: 'Press 10. The rhythm slows: wide over the plant, calmly lit again. Three honest limits, each tied to a place as it is named: spent fuel in casks beside the reactor; licensing, layered approvals on the reactor building; first-of-a-kind risk, a schedule with an uncertain end, on the site.',
        camera: { keys: [{ at: 4.2, pose: P.limits }], drift: 0.8 },
        reveal: { to: { exteriorDim: 0.15 }, timing: { delay: 0.6, duration: 2.4 } },
        world: { 's.icsSteam': 0.6, 's.icsCondensing': 0.6, 's.icsCondensate': 0.6, 's.poolHeat': 0.6, 'p.lights': 1, 'l.casks': 1 },
        worldTiming: { 'p.lights': { delay: 0.8, duration: 2.0 }, 'l.casks': { delay: 1.2, duration: 1.6 } },
        cues: { waste: { delay: 4.8, duration: 0.8 }, licensing: { delay: 7.0, duration: 0.8 }, cost: { delay: 9.4, duration: 0.8 } },
        overlay: [
          { kind: 'label', id: 'limits-waste', text: 'limits.waste', sub: 'limits.wasteSub', at: LIMITS.casks, leader: [70, -100], tone: 'steel', cue: 'waste' },
          { kind: 'label', id: 'limits-licensing', text: 'limits.licensing', sub: 'limits.licensingSub', at: LIMITS.reactor, leader: [-30, -110], tone: 'steel', glyph: 'layers', cue: 'licensing' },
          { kind: 'label', id: 'limits-cost', text: 'limits.cost', sub: 'limits.costSub', at: LIMITS.site, leader: [-20, 96], tone: 'steel', glyph: 'schedule', cue: 'cost' },
        ],
        lock: GUARD,
      },
    ],
  },
  {
    id: 'close',
    speaker: 'both',
    target: [385, 415],
    label: 'chapter.close',
    hideLabel: true,
    idea: 'One press from the limitations: the plant closes around its passive system and stands whole again, reconnected, as the camera returns through open space to the opening composition; the thesis, the presenters, the QR to the interactive model; "Your questions" as the speaker asks for them. Holds for the Q&A.',
    facts: [],
    beats: [
      {
        id: 'return',
        note: 'Press 11 (the last). The limits text clears; vessel, containment, shaft and ground close while the camera glides through open space back to the opening view; the grid reconnects; then the thesis, the presenters, the larger QR; "Your questions" in amber. Holds for Q&A.',
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
        lock: GUARD,
      },
      {
        id: 'qa',
        after: 5.0,
        note: 'The opening composition again (same low hero camera): the thesis at display size, the presenters, the larger QR ("scan it to explore the model"); "Your questions" in amber when they are asked for. Holds for Q&A.',
        cues: { closeTitle: { delay: 0.3, duration: 1.0 }, closeSpeakers: { delay: 1.0, duration: 1.0 }, closeQr: { delay: 1.6, duration: 1.0 }, questions: { delay: 17.0, duration: 1.0 } },
        overlay: [
          { kind: 'scrim', id: 'scrim-hero', side: 'hero', cue: 'closeTitle' },
          { kind: 'title', id: 'close-thesis', title: 'close.thesis', sub: 'close.questions', subCue: 'questions', position: 'top-left', measure: 760, cue: 'closeTitle' },
          { kind: 'speakers', id: 'speakers', layout: 'outro', cue: 'closeSpeakers' },
          { kind: 'qr', id: 'qr', layout: 'outro', cue: 'closeQr' },
        ],
      },
    ],
  },
];
