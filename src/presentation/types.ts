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
import type { Tone } from './design';
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

/** One-shot progress (0..1) that runs once on a forward step (count-ups, pins, fronts, text fades). */
export interface CueSpec {
  delay?: number;
  duration: number;
}

/**
 * Where an editorial item sits on the composition grid (presentation/design.ts GRID): the left or
 * the right editorial column, top / middle / bottom; `y` (px at 1080p) sets the top edge instead of
 * the default, so a metric can line up with what it describes.
 */
export type OverlayPosition = 'left' | 'right' | 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

/**
 * Every overlay item fades in on a cue (one-shot). An item new in a beat without its own cue gets one
 * at the beat's `textAt` (presentation/resolve.ts), so text never arrives before its picture and never
 * crosses the outgoing text in place. `out` fades the item away on another cue inside the same stop.
 */
interface ItemBase {
  id: string;
  cue?: string;
  out?: string;
}

interface Placed {
  position?: OverlayPosition;
  /** Top edge (px at 1080p), overriding the position's default. */
  y?: number;
}

/**
 * The four label roles (docs/presentation-design-study/DESIGN-STUDY.md §7):
 *  1 anchored technical label  `label`: a dot on the thing, a fine leader, short text beyond it;
 *                              the dot carries the process / status colour (`tone`), never a border
 *  2 chapter / claim text      `caption`, `title`: editorial placement, no card, no rule
 *  3 source / qualifier        `source` on the item it qualifies (directly under it), or a `note`
 *                              under the chapter label when it qualifies the whole picture
 *  4 metric                    `stat`: number + quiet unit + one supporting line + its source
 */
export type OverlayItem = ItemBase &
  (
    | ({
        kind: 'title';
        kicker?: CopyKey;
        title: CopyKey;
        sub?: CopyKey;
        size?: 'display' | 'h1';
        /** Line length (px at 1080p): the closing thesis breaks into two balanced lines. */
        measure?: number;
      } & Placed)
    | ({
        kind: 'stat';
        value: CopyKey;
        unit?: CopyKey;
        caption?: CopyKey;
        source?: CopyKey;
        /** Count the number up once (driven by a cue); the text around the number comes from the copy. */
        count?: { cue: string; to: number; from?: number; decimals?: number; group?: boolean };
        /** `h1`: a secondary confirmation, not the frame's main idea. */
        size?: 'metric' | 'h1';
      } & Placed)
    | ({ kind: 'caption'; text: CopyKey; sub?: CopyKey; source?: CopyKey; size?: 'h1' | 'h2' } & Placed)
    /** A qualifier of the whole picture ("Schema, ne mastelis"), set under the chapter label. */
    | { kind: 'note'; text: CopyKey }
    | {
        kind: 'label';
        text: CopyKey;
        sub?: CopyKey;
        /** A source line under the label (map tags). */
        source?: CopyKey;
        /** World anchor (m): the dot sits on it. */
        at: Vec3Tuple;
        /** The text's offset from the anchor along a fine leader (px at 1080p). */
        leader?: readonly [number, number];
        /** Or: a leader from the anchor to this fixed stage point (px at 1080p), with the text there. */
        leaderTo?: readonly [number, number];
        /** The dot's colour (process / status). */
        tone?: Tone;
        /** A hollow dot (a status still in progress: licensing, assessing). */
        ring?: boolean;
        /** A quiet dark backing behind the text (light 3D behind it). Light-scene beats get one anyway. */
        panel?: boolean;
        /** `value`: a number-sized label (the scale comparison); default the label role. */
        size?: 'label' | 'value';
        /** A small drawn cue beside the text (chapter 11). */
        glyph?: 'layers' | 'schedule';
      }
    /** Legibility without a card: a soft gradient behind editorial type. */
    | { kind: 'scrim'; side: 'left' | 'right' | 'bottom-left' | 'hero' }
    /** 0-36 months with the 24-36 band; the fill follows a cue (`progress`). */
    | ({ kind: 'timeline'; progress?: string } & Placed)
    | { kind: 'speakers'; layout: 'intro' | 'outro' }
    | { kind: 'qr'; layout: 'intro' | 'outro' }
    | { kind: 'counter' }
    | { kind: 'meters' }
    | { kind: 'legend'; source?: CopyKey }
    | { kind: 'pins'; focus?: 'darlington' | 'lithuania' }
    /** The fission chain's labels, placed in the micro view (presentation/scene/fieldConfig.ts). */
    | { kind: 'microLabels' }
    /** Chapter 3: the two reactor vessels side by side at one scale (sourced inside dimensions). */
    | ({ kind: 'vessels' } & Placed)
  );

export interface TalkBeat {
  id: string;
  /** What happens on this press (review document and debug panel; English). */
  note: string;
  /**
   * An automatic continuation: entered this many seconds after the beat before it (no press). A beat
   * without `after` is a presenter stop; the stop's continuations play on from it, and the next press
   * goes to the next stop (presentation/talk.ts).
   */
  after?: number;
  /** When this beat's new text may appear (s after entry, default TALK.textAt): once its picture reads. */
  textAt?: number;
  camera?: CameraShot;
  reveal?: RevealSpec;
  look?: LookSpec;
  world?: Partial<Record<WorldChannel, number>>;
  worldTiming?: Partial<Record<WorldChannel, Timing>>;
  cues?: Record<string, CueSpec>;
  /** On-screen copy for this beat (replaces the previous beat's; `inherit` keeps it and adds these). */
  overlay?: readonly OverlayItem[];
  overlayInherit?: boolean;
  /** Seconds a second forward press is ignored (the important transition); a stop's first beat only. */
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
