/**
 * Presentation v1 data model: chapters made of presenter-triggered beats.
 *
 * A beat says what the scene should become (camera shot, reveal, look, world channels, overlay
 * copy); the runtime (presentation/runtime.ts) gets there from wherever the scene is, so forward,
 * backward and direct jumps all work from the same data. Everything a beat leaves out is
 * inherited from the beat before it (presentation/resolve.ts), so a chapter reads like a script.
 */
import type { HeroRevealState } from '../animation/heroReveal';
import type { CameraPose, CameraStateId, Vec3Tuple } from '../config/camera';
import type { ComponentId } from '../scene/components';
import type { InteriorLevel } from '../scene/section/sectionLayers';
import type { CopyKey } from './copy';
import type { FactId } from './sources';
import type { WorldChannel } from './world';

export type Speaker = 'virgilijus' | 'timofej' | 'both';
export type PoseRef = CameraPose | CameraStateId;

/** How a beat was entered: its choreography, or a short settle move (back, jump, reset). */
export type EntryMode = 'play' | 'settle';

export interface Timing {
  /** Seconds after the beat starts (after the dip, for a cut). */
  delay?: number;
  /** Seconds; 0 = at once. */
  duration?: number;
  /** A GSAP ease name (default sine.inOut). */
  ease?: string;
}

export interface CameraKey {
  /** Seconds after the beat starts (after the dip, for a cut). */
  at: number;
  pose: PoseRef;
}

export interface CameraShot {
  /** Path keys; the live pose is the implicit key at 0 (for a cut, the first key is). */
  keys?: readonly CameraKey[];
  /** A Stage 6 master-time segment, reused as it is: camera (and, if asked, reveal and look). */
  master?: { from: number; to: number; speed?: number; delay?: number };
  /** Dip to dark and start from the first key: between places too far apart to fly. */
  cut?: boolean;
  /** With `cut`: a move from the live view that plays before the dip (dive into a map pin). */
  dive?: readonly CameraKey[];
  /** Breathing on the hold after the path: 0 still .. 1 the default amount. */
  drift?: number;
}

export interface RevealSpec {
  /** Fields that change (the rest is inherited). */
  to?: Partial<HeroRevealState>;
  timing?: Timing;
  tracks?: Partial<Record<keyof HeroRevealState, Timing>>;
  /** Follow the master reveal during the camera's master segment (the Stage 3 shot). */
  master?: boolean;
}

export interface LookSpec {
  /** Replaces the subjects (weights 0..1.6). */
  subjects?: Partial<Record<ComponentId, number>>;
  ghosts?: Partial<Record<ComponentId, number>>;
  contextDim?: number;
  interior?: readonly InteriorLevel[];
  /** Follow the master look during the camera's master segment. */
  master?: boolean;
  duration?: number;
}

/** One-shot progress (0..1) that runs once on a forward step (count-ups, pins, fronts). */
export interface CueSpec {
  delay?: number;
  duration: number;
}

export type OverlayPosition = 'left' | 'right' | 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

/** Every overlay item may fade in on a cue (one-shot) instead of entering with the beat. */
interface ItemBase {
  id: string;
  cue?: string;
}

export type OverlayItem = ItemBase &
  (
    | { kind: 'title'; kicker?: CopyKey; title: CopyKey; sub?: CopyKey; position?: OverlayPosition; size?: 'hero' | 'large' }
    | {
        kind: 'stat';
        value: CopyKey;
        unit?: CopyKey;
        caption?: CopyKey;
        /** Count the number up once (driven by a cue); the text around the number comes from the copy. */
        count?: { cue: string; to: number; from?: number; decimals?: number; group?: boolean };
        position?: OverlayPosition;
        /** Design study only: the source / qualifier set directly under the metric (not a page footer). */
        source?: CopyKey;
      }
    | { kind: 'caption'; text: CopyKey; sub?: CopyKey; position?: OverlayPosition; tone?: 'plain' | 'alert'; size?: 'large' | 'small' }
    | { kind: 'note'; text: CopyKey }
    | {
        kind: 'label';
        text: CopyKey;
        sub?: CopyKey;
        /** World anchor (m). */
        at: Vec3Tuple;
        side?: 'left' | 'right' | 'up' | 'down';
        style?: 'tag' | 'word' | 'value' | 'anchor';
        /** Design study only: the text sits this far from the anchor (px at 1080p), joined by a fine leader line. */
        leader?: readonly [number, number];
        /** Design study only: a leader from the anchor to this fixed stage point (px at 1080p); no text box. */
        leaderTo?: readonly [number, number];
      }
    /** Design study only (`?study=`, presentation/study): blocks the study compositions add. */
    | { kind: 'study'; block: 'scrim' | 'timeline' | 'credits' | 'qr'; variant?: string; position?: OverlayPosition; progress?: string }
    | { kind: 'speakers'; layout: 'intro' | 'outro' }
    | { kind: 'qr' }
    | { kind: 'counter' }
    | { kind: 'meters' }
    | { kind: 'legend' }
    | { kind: 'pins'; focus?: 'darlington' | 'lithuania' }
    /** The fission chain's labels, placed in the micro view (presentation/scene/chainConfig.ts). */
    | { kind: 'microLabels' }
  );

export interface TalkBeat {
  id: string;
  /** What happens on this press (review document and debug panel; English). */
  note: string;
  camera?: CameraShot;
  reveal?: RevealSpec;
  look?: LookSpec;
  world?: Partial<Record<WorldChannel, number>>;
  worldTiming?: Partial<Record<WorldChannel, Timing>>;
  cues?: Record<string, CueSpec>;
  /** On-screen copy for this beat (replaces the previous beat's; `inherit` keeps it and adds these). */
  overlay?: readonly OverlayItem[];
  overlayInherit?: boolean;
  /** Seconds a second forward press is ignored (the important transition). */
  lock?: number;
  /** The scene behind the small print is light (map land, a lit vessel wall): give it a dark backing. */
  lightScene?: boolean;
}

export interface TalkChapter {
  id: string;
  speaker: Speaker;
  /** Target speaking window [start, end] (s): a pacing guide, never a timer. */
  target: readonly [number, number];
  label: CopyKey;
  /** Hide the tiny chapter label (title and closing compositions). */
  hideLabel?: boolean;
  /** The core spoken idea (review document; English). */
  idea: string;
  facts: readonly FactId[];
  unresolved?: string;
  beats: readonly TalkBeat[];
}
