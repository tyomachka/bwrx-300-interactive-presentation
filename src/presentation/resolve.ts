/**
 * Turns the chapter script (presentation/chapters.ts) into a flat list of fully resolved beats:
 * whatever a beat leaves out is inherited from the beat before it, across chapters, so any beat
 * can be entered directly (backward steps, debug jumps, a reset) without replaying history.
 */
import { Vector3 } from 'three';
import { HERO_REVEAL_CLOSED, type HeroRevealState } from '../animation/heroReveal';
import { masterCameraAt, masterLookAt } from '../animation/masterSequence';
import { CAMERA_STATES, HOME_CAMERA_STATE, type CameraPose } from '../config/camera';
import type { ComponentId } from '../scene/components';
import type { InteriorLevel } from '../scene/section/sectionLayers';
import { TALK } from './config';
import { masterRevealAt } from './legacy';
import type { CameraShot, CueSpec, OverlayItem, PoseRef, TalkBeat, TalkChapter } from './types';
import { restingWorld, type WorldState } from './world';

export interface ResolvedLook {
  subjects: Partial<Record<ComponentId, number>>;
  ghosts: Partial<Record<ComponentId, number>>;
  contextDim: number;
  interior: readonly InteriorLevel[];
}

export interface ResolvedBeat {
  flat: number;
  chapterIndex: number;
  beatIndex: number;
  /** The presenter stop this beat belongs to (0-based), its first and last beat (flat). */
  stop: number;
  stopFirst: number;
  stopLast: number;
  /** An automatic continuation (entered `beat.after` s after the beat before it). */
  auto: boolean;
  chapter: TalkChapter;
  beat: TalkBeat;
  /** The beat's own shot (undefined: the camera holds where the previous beat left it). */
  shot: CameraShot | undefined;
  /** Where the camera rests once the beat has played. */
  finalPose: CameraPose;
  drift: number;
  reveal: HeroRevealState;
  look: ResolvedLook;
  world: WorldState;
  /** Cue name -> the beat that last (re)started it, at or before this one. */
  cueOwner: ReadonlyMap<string, { flat: number; spec: CueSpec }>;
  overlay: readonly OverlayItem[];
  lock: number;
}

export const poseOf = (ref: PoseRef): CameraPose => (typeof ref === 'string' ? CAMERA_STATES[ref] : ref);

function shotFinalPose(shot: CameraShot): CameraPose | null {
  if (shot.master) {
    const out = masterCameraAt(shot.master.to, { position: new Vector3(), target: new Vector3(), fov: 35 });
    return { position: out.position.toArray() as CameraPose['position'], target: out.target.toArray() as CameraPose['target'], fov: out.fov };
  }
  const last = shot.keys?.[shot.keys.length - 1];
  return last ? poseOf(last.pose) : null;
}

export function resolveTalk(chapters: readonly TalkChapter[]): ResolvedBeat[] {
  const out: ResolvedBeat[] = [];
  let finalPose: CameraPose = CAMERA_STATES[HOME_CAMERA_STATE];
  let drift = 1;
  let reveal: HeroRevealState = { ...HERO_REVEAL_CLOSED };
  let look: ResolvedLook = { subjects: {}, ghosts: {}, contextDim: 0, interior: [] };
  let world: WorldState = restingWorld();
  const cueOwner = new Map<string, { flat: number; spec: CueSpec }>();
  let overlay: OverlayItem[] = [];
  let stop = -1;

  chapters.forEach((chapter, chapterIndex) => {
    overlay = [];
    chapter.beats.forEach((beat, beatIndex) => {
      const flat = out.length;
      if (beat.camera) {
        finalPose = shotFinalPose(beat.camera) ?? finalPose;
        drift = beat.camera.drift ?? 1;
      }
      const master = beat.camera?.master;
      if (beat.reveal?.master && master) reveal = masterRevealAt(master.to);
      if (beat.reveal?.to) reveal = { ...reveal, ...beat.reveal.to };
      if (beat.look?.master && master) {
        const m = masterLookAt(master.to);
        look = {
          subjects: Object.fromEntries(m.subjects),
          ghosts: Object.fromEntries(m.ghosts),
          contextDim: m.contextDim,
          interior: (Object.keys(m.interior) as InteriorLevel[]).filter((level) => m.interior[level]),
        };
      } else if (beat.look) {
        look = {
          subjects: beat.look.subjects ?? look.subjects,
          ghosts: beat.look.ghosts ?? look.ghosts,
          contextDim: beat.look.contextDim ?? look.contextDim,
          interior: beat.look.interior ?? look.interior,
        };
      }
      if (beat.world) world = { ...world, ...beat.world };
      for (const [name, spec] of Object.entries(beat.cues ?? {})) cueOwner.set(name, { flat, spec });
      if (beat.overlay) {
        if (beat.overlayInherit) {
          const ids = new Set(beat.overlay.map((item) => item.id));
          overlay = [...overlay.filter((item) => !ids.has(item.id)), ...beat.overlay];
        } else overlay = [...beat.overlay];
      }
      // Text follows the picture: an item new in this beat fades in at `textAt` unless it has its own
      // cue; an item that stays from the beat before simply stays (no second entrance).
      const before = new Map((out[flat - 1]?.overlay ?? []).map((item) => [item.id, item]));
      const textAt = beat.textAt ?? TALK.textAt;
      overlay = overlay.map((item) => {
        const kept = before.get(item.id);
        if (kept) {
          if (import.meta.env.DEV && sameContent(kept, item) === false) console.warn(`[talk] ${chapter.id}/${beat.id}: "${item.id}" changes content in place; give it a new id`);
          return item;
        }
        if (item.cue) return item;
        const cue = `@in:${flat}:${item.id}`;
        cueOwner.set(cue, { flat, spec: { delay: textAt, duration: TALK.textIn } });
        return { ...item, cue };
      });
      if (beat.after === undefined) stop++;
      out.push({
        flat,
        chapterIndex,
        beatIndex,
        stop,
        stopFirst: flat,
        stopLast: flat,
        auto: beat.after !== undefined,
        chapter,
        beat,
        shot: beat.camera,
        finalPose,
        drift,
        reveal,
        look,
        world,
        cueOwner: new Map(cueOwner),
        overlay,
        lock: beat.after !== undefined ? 0 : (beat.lock ?? TALK.lock),
      });
    });
  });
  if (out[0]?.auto) throw new Error('[talk] the first beat must be a presenter stop');
  for (const b of out) {
    b.stopFirst = out.findIndex((x) => x.stop === b.stop);
    b.stopLast = b.stopFirst;
    while (out[b.stopLast + 1]?.stop === b.stop) b.stopLast++;
  }
  return out;
}

/** Two overlay items say the same thing (their cues aside). */
function sameContent(a: OverlayItem, b: OverlayItem): boolean {
  const strip = (item: OverlayItem) => JSON.stringify({ ...item, cue: undefined, out: undefined });
  return strip(a) === strip(b);
}
