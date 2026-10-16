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
      out.push({
        flat,
        chapterIndex,
        beatIndex,
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
        lock: beat.lock ?? TALK.lock,
      });
    });
  });
  return out;
}
