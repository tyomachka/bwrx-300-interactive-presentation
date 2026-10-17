/**
 * Design study patches (`?study=a|b|c` only; presentation/study/studyMode.ts). The lecture script
 * (presentation/chapters.ts) is never edited: these replace fields of a few beats when the study
 * runs, so the same controller, runtime and scene play them.
 *
 * Compositions (one per direction) for the five representative states:
 *   hook/hero, lithuania/renewables, facts/months, safety/days, close/qa
 * Motion prototypes (the same in every direction; captured in the recommended one):
 *   A metric reveal       facts/power, facts/months: the picture acts first, the number confirms it
 *   B shared object       hook -> lithuania/renewables: the ground becomes the map under the plant,
 *                         then the plant shrinks into its node on it (no plinth over a void)
 *   C fission reset       scene/ChainFission.tsx (study branch): overlapping loops, no dark seam
 *   D safety rhythm       blackout -> scram -> decay -> ics -> days: one change per press, then a
 *                         hold; the camera never flies through the containment
 */
import type { CameraPose, Vec3Tuple } from '../../config/camera';
import { ltToWorld } from '../scene/mapLayout';
import type { OverlayItem, TalkBeat, TalkChapter } from '../types';
import type { StudyDirection } from './studyMode';

type Patch = Partial<Omit<TalkBeat, 'id' | 'note'>>;
type PerDirection<T> = Record<StudyDirection, T>;

const pose = (position: CameraPose['position'], target: CameraPose['target'], fov = 35): CameraPose => ({ position, target, fov });

// ---- Compositions -------------------------------------------------------------------------------------

/** Opening (and closing: the same view, so the end visibly echoes the start). Plant ~30-40 % larger. */
const HERO: PerDirection<CameraPose> = {
  a: pose([-79, 49.7, 129.7], [30, 6, -6]),
  b: pose([-118, 28, 112], [2, 13, -4], 30),
  c: pose([-82, 64.5, 146.7], [25, 4, -6], 32),
};

/** Lithuania: the table moved right so the metric column sits on open sea. */
const LITHUANIA: PerDirection<CameraPose> = {
  a: pose([-124, 344, 251], [-90, 0, 12]),
  b: pose([-90, 230, 260], [-40, 0, 20]),
  c: pose([-124, 344, 251], [-90, 0, 12]),
};

/** Facts / months: our plant and a second, identical unit going up beside it (k.modules 0 -> 1). */
const MONTHS: PerDirection<CameraPose> = {
  a: pose([-222, 70, 38.3], [-7, 6, -77.7]),
  b: pose([-190, 34, 95], [-6, 14, -50], 30),
  c: pose([-227.8, 92, 28.2], [-5.8, 2, -81.8], 32),
};

/** Safety / days: reactor (left) -> condenser (centre) -> conclusion (right column), one eye path. */
const DAYS: PerDirection<CameraPose> = {
  a: pose([4, 8, 50], [12, 6, -5]),
  b: pose([2, 6.5, 47], [11.5, 6.2, -5]),
  c: pose([4, 9, 50], [12, 6.2, -5]),
};

/** The medium vessel view used for "reaction stops" and "heat remains" (reached without a fly-through). */
const VESSEL = pose([-15, -9.5, 34], [0.5, -15.5, 0]);

/** The east isolation-condenser train (scene/safety/icsLayout.ts): riser, condenser, return line. */
const ICS_EAST: Record<'riser' | 'condenser' | 'back', Vec3Tuple> = { riser: [8.35, 2.5, -6.5], condenser: [10.5, 10.2, -6.5], back: [12.65, 1.5, -6.5] };

/** Per-direction leaders (px at 1080p) for the three loop labels: [steam, pool, return]. */
const LOOP_LEADERS: PerDirection<readonly (readonly [number, number])[]> = {
  a: [
    [-34, 0],
    [0, -40],
    [34, 0],
  ],
  b: [
    [-30, 0],
    [0, -34],
    [30, 0],
  ],
  c: [
    [-70, -46],
    [-60, -86],
    [84, 52],
  ],
};

function hookOverlay(d: StudyDirection, closing: boolean): OverlayItem[] {
  const title: OverlayItem = closing
    ? { kind: 'title', id: 'close-thesis', title: 'close.thesis', sub: 'close.questions', size: 'large', cue: 'closeTitle' }
    : { kind: 'title', id: 'hook-title', kicker: 'hook.kicker', title: 'hook.title', size: 'hero', cue: 'title' };
  return [
    { kind: 'study', id: closing ? 'scrim-close' : 'scrim-hook', block: 'scrim', variant: d, cue: closing ? 'closeTitle' : 'title' },
    title,
    { kind: 'study', id: 'credits', block: 'credits', variant: closing ? 'outro' : 'intro', cue: closing ? 'closeSpeakers' : 'speakers' },
    { kind: 'study', id: 'qr', block: 'qr', variant: closing ? 'outro' : 'intro', cue: closing ? 'closeQr' : 'qr' },
  ];
}

function compositions(d: StudyDirection): Record<string, Patch> {
  const [steamLeader, poolLeader, backLeader] = LOOP_LEADERS[d];
  return {
    'hook/hero': {
      camera: { cut: true, keys: [{ at: 0, pose: pose([-58, 20, 112], [6, 13, -4]) }, { at: 6.5, pose: HERO[d] }], drift: 0.7 },
      overlay: hookOverlay(d, false),
    },
    'lithuania/renewables': {
      camera: { keys: [{ at: 1.7, pose: pose([-110, 170, 210], [-20, 0, 0]) }, { at: 4.4, pose: LITHUANIA[d] }], drift: 1 },
      overlay: [
        { kind: 'study', id: 'scrim-lt', block: 'scrim', variant: d, cue: 'stat' },
        { kind: 'stat', id: 'lt-stat', value: 'lt.stat', caption: 'lt.statCaption', source: 'lt.note', count: { cue: 'stat', to: 50 }, cue: 'stat' },
        // C anchors the number to the country it describes (a leader to the metric's edge; no text box).
        ...(d === 'c' ? [{ kind: 'label', id: 'lt-link', text: 'projects.lithuania', at: ltToWorld(23.9, 55.35, 4), leaderTo: [356, 438], style: 'anchor', cue: 'stat' } satisfies OverlayItem] : []),
      ],
    },
    'facts/months': {
      camera: { keys: [{ at: 3.0, pose: MONTHS[d] }], drift: 0.8 },
      overlay: [
        { kind: 'study', id: 'scrim-months', block: 'scrim', variant: d, cue: 'monthsIn' },
        { kind: 'stat', id: 'facts-months', value: 'facts.months', unit: 'facts.monthsUnit', caption: 'facts.monthsCaption', source: 'facts.monthsNote', cue: 'monthsIn' },
        { kind: 'study', id: 'timeline', block: 'timeline', variant: d, progress: 'build', cue: 'buildIn' },
      ],
    },
    'safety/ics': {
      camera: { keys: [{ at: 2.2, pose: DAYS[d] }], drift: 0.6 },
      overlay: [
        { kind: 'caption', id: 'safety-state', text: 'safety.ics', sub: 'safety.icsSub', cue: 'icsText' },
        { kind: 'label', id: 'loop-steam', text: 'safety.steamUp', at: ICS_EAST.riser, leader: steamLeader, style: 'anchor', cue: 'steamLabel' },
        { kind: 'label', id: 'loop-pool', text: 'safety.pool', at: ICS_EAST.condenser, leader: poolLeader, style: 'anchor', cue: 'poolLabel' },
        { kind: 'label', id: 'loop-back', text: 'safety.waterBack', at: ICS_EAST.back, leader: backLeader, style: 'anchor', cue: 'backLabel' },
      ],
    },
    'safety/days': {
      // No camera move of its own: the counter runs on the composition the condenser beat arrived at.
      camera: undefined,
      overlay: [
        { kind: 'caption', id: 'safety-state', text: 'safety.ics', sub: 'safety.icsSub' },
        { kind: 'label', id: 'loop-steam', text: 'safety.steamUp', at: ICS_EAST.riser, leader: steamLeader, style: 'anchor' },
        { kind: 'label', id: 'loop-pool', text: 'safety.pool', at: ICS_EAST.condenser, leader: poolLeader, style: 'anchor' },
        { kind: 'label', id: 'loop-back', text: 'safety.waterBack', at: ICS_EAST.back, leader: backLeader, style: 'anchor' },
        { kind: 'counter', id: 'safety-days', cue: 'days' },
      ],
    },
    'close/return': {
      camera: { keys: [{ at: 3.0, pose: 'masterSafetyRise' }, { at: 6.5, pose: 'stage3Approach' }, { at: 10, pose: HERO[d] }], drift: 0.7 },
    },
    'close/qa': { overlay: hookOverlay(d, true) },
  };
}

// ---- Motion prototypes (every direction) ----------------------------------------------------------------

const MOTION: Record<string, Patch> = {
  // B: the map spreads out from under the plant (the ground turns into the table at grade), then the
  // plant shrinks into its node on it; "50 %" arrives once the country is alive (wind, sun, flows).
  'lithuania/renewables': {
    worldTiming: {
      'g.show': { delay: 1.2 },
      'g.power': { duration: 0.8 },
      'm.lt': { delay: 0, duration: 2.6, ease: 'sine.inOut' },
      'p.zoom': { delay: 1.1, duration: 2.9, ease: 'power2.inOut' },
      'lt.wind': { delay: 2.4, duration: 1.4 },
      'lt.sun': { delay: 2.6, duration: 1.4 },
      'lt.imports': { delay: 3.0, duration: 1.4 },
    },
    cues: { stat: { delay: 4.1, duration: 1.4 } },
  },
  // A: the comparison falls away, the hall lights and the line carries power out; the number
  // arrives as it does, counting from the moment it is visible (never a static "~0 MW").
  'facts/power': {
    // The large unit stays ghosted while it sinks away (it no longer turns solid on its way out).
    world: { 'k.show': 0, 'k.large': 0, 'k.largeDim': 1, 'k.modules': 0, 'g.show': 1, 'g.power': 1, 'g.city': 1, 'e.fogNear': 300, 'e.fogFar': 820 },
    worldTiming: { 'k.show': { delay: 2.2 }, 'k.large': { duration: 2.0 }, 'k.modules': { duration: 2.0 }, 'g.show': { delay: 0.6 }, 'g.power': { delay: 1.2, duration: 1.4 }, 'e.fogNear': { duration: 3 }, 'e.fogFar': { duration: 3 } },
    cues: { power: { delay: 2.3, duration: 1.3 } },
    overlay: [{ kind: 'stat', id: 'facts-power', value: 'facts.power', unit: 'facts.powerUnit', caption: 'facts.powerCaption', count: { cue: 'power', to: 300 }, cue: 'power' }],
  },
  // A (second half): a second unit goes up beside ours while the months fill; the range lands with it.
  'facts/months': {
    world: { 'q.pitches': 0, 'k.show': 1, 'k.modules': 1, 'k.large': 0, 'k.largeDim': 0 },
    worldTiming: { 'k.show': { duration: 0 }, 'k.modules': { delay: 0.9, duration: 4.0, ease: 'none' } },
    cues: { buildIn: { delay: 0.6, duration: 0.4 }, build: { delay: 0.9, duration: 4.0 }, monthsIn: { delay: 4.5, duration: 0.6 } },
    lock: 1.6,
  },
  // The study's power beat lights the line; the map chapter puts it away again (as Lithuania does).
  'projects/world': {
    world: { 'p.zoom': -2.6, 'm.world': 1, 'q.pitches': 0, 'k.show': 0, 'k.modules': 0, 'g.show': 0, 'g.power': 0 },
    worldTiming: { 'p.zoom': { delay: 0.3, duration: 3.0, ease: 'power2.inOut' }, 'm.world': { delay: 0.8, duration: 3.0, ease: 'sine.inOut' }, 'g.show': { delay: 1.2 }, 'g.power': { duration: 0.6 } },
  },
  // D: one change per press, the text after the picture, then a hold.
  'safety/blackout': {
    cues: { blackoutText: { delay: 0.9, duration: 0.5 } },
    overlay: [{ kind: 'caption', id: 'safety-state', text: 'safety.blackout', tone: 'alert', cue: 'blackoutText' }],
    lock: 1.2,
  },
  'safety/scram': {
    // No dive through the containment: a short, open-front move to a medium view of the cut vessel.
    camera: { keys: [{ at: 1.9, pose: VESSEL }], drift: 0.3 },
    reveal: { to: { bladeEmphasis: 1, exteriorDim: 1 }, timing: { delay: 0.6, duration: 0.6 } },
    worldTiming: { 'c.activity': { delay: 0.3, duration: 0.4 }, 'c.scram': { delay: 1.0, duration: 1.0, ease: 'power2.in' }, 'g.show': { delay: 1.2 }, 'y.show': { delay: 1.2 } },
    cues: { scramText: { delay: 1.6, duration: 0.5 } },
    overlay: [{ kind: 'caption', id: 'safety-state', text: 'safety.scram', cue: 'scramText' }],
    lock: 1.2,
  },
  'safety/decay': {
    camera: { keys: [{ at: 0.1, pose: VESSEL }], drift: 0.4 },
    worldTiming: { 's.decayHeat': { delay: 0.1, duration: 1.4 }, 'c.activity': { delay: 0.6, duration: 0.6 } },
    cues: { decayText: { delay: 1.0, duration: 0.5 } },
    overlay: [
      { kind: 'caption', id: 'safety-state', text: 'safety.heat', cue: 'decayText' },
      { kind: 'meters', id: 'safety-meters', cue: 'decayText' },
    ],
    lock: 1.2,
  },
  'safety/ics': {
    reveal: { to: { vesselCut: 0, rpvEmphasis: 1, poolsReveal: 1 }, tracks: { vesselCut: { delay: 0.3, duration: 1.2 }, rpvEmphasis: { delay: 0.5, duration: 1.2 } } },
    worldTiming: { 's.icsSteam': { delay: 1.5, duration: 0.4 }, 's.icsCondensing': { delay: 2.1, duration: 0.4 }, 's.icsCondensate': { delay: 2.7, duration: 0.4 }, 's.poolHeat': { delay: 2.3, duration: 1.0 } },
    cues: { steamLabel: { delay: 1.7, duration: 0.5 }, poolLabel: { delay: 2.3, duration: 0.5 }, backLabel: { delay: 2.9, duration: 0.5 }, icsText: { delay: 3.2, duration: 0.5 } },
    lock: 1.2,
  },
  'safety/days': {
    cues: { days: { delay: 0.3, duration: 2.6 } },
    lock: 1.2,
  },
};

/** The chapters with the study's beats patched in (composition fields override motion fields). */
export function applyStudy(chapters: readonly TalkChapter[], direction: StudyDirection): readonly TalkChapter[] {
  const comp = compositions(direction);
  return chapters.map((chapter) => ({
    ...chapter,
    beats: chapter.beats.map((beat) => {
      const key = `${chapter.id}/${beat.id}`;
      const motion = MOTION[key];
      const own = comp[key];
      if (!motion && !own) return beat;
      return { ...beat, ...motion, ...own, cues: { ...beat.cues, ...motion?.cues, ...own?.cues }, worldTiming: { ...beat.worldTiming, ...motion?.worldTiming, ...own?.worldTiming } };
    }),
  }));
}
