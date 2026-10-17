/**
 * Design study review (`?designStudy=1`): what the temporary panel does. Directions swap the
 * resolved beats in place and show the same state at once; states and motion prototypes are
 * entered with their own choreography (the real transition from the beat before them).
 */
import { CHAPTERS } from '../chapters';
import { resolveTalk } from '../resolve';
import { replaceTalkBeats, talk, TALK_BEATS } from '../talk';
import { applyStudy } from './studyChapters';
import { useStudyStore, type StudyDirection } from './studyMode';
import { STUDY_TOKENS } from './tokens';

export const DIRECTIONS: readonly { id: StudyDirection; key: string; label: string; font: string }[] = [
  { id: 'a', key: '1', label: 'A · Precision', font: 'Segoe UI Variable (system)' },
  { id: 'b', key: '2', label: 'B · Editorial cinematic', font: 'Inter Variable (bundled)' },
  { id: 'c', key: '3', label: 'C · Technical documentary', font: 'IBM Plex Sans Variable (bundled)' },
];

export const STATES = [
  { beat: 'hook/hero', label: '1 Opening' },
  { beat: 'lithuania/renewables', label: '2 Lithuania / 50 %' },
  { beat: 'facts/months', label: '3 Facts / 24–36 months' },
  { beat: 'safety/days', label: '4 Safety / 7 days' },
  { beat: 'close/qa', label: '5 Closing' },
] as const;

/** Motion prototypes: the beat to enter, then forward presses at these seconds (the MP4 timings). */
export const MOTIONS = [
  { key: '6', label: 'A metric reveal', beat: 'facts/power', presses: [6.4] },
  { key: '7', label: 'B shared object', beat: 'lithuania/renewables', presses: [] },
  { key: '8', label: 'C fission reset', beat: 'fission/micro', presses: [] },
  { key: '9', label: 'D safety rhythm', beat: 'safety/blackout', presses: [2.3, 4.7, 7.0, 10.2] },
] as const;

export const beatIndex = (beat: string) => TALK_BEATS.findIndex((b) => `${b.chapter.id}/${b.beat.id}` === beat);

let timers: number[] = [];
const clearTimers = () => {
  timers.forEach((t) => window.clearTimeout(t));
  timers = [];
};

/** Another direction: re-resolve the script in place, then show the current beat in it at once. */
export function setDirection(direction: StudyDirection): void {
  if (useStudyStore.getState().direction === direction) return;
  clearTimers();
  replaceTalkBeats(resolveTalk(applyStudy(CHAPTERS, direction)));
  useStudyStore.setState({ direction });
  talk.jump(talk.flat, 'settle', true);
}

/** A representative state, entered with its own transition (or at once with `instant`). */
export function showState(index: number, instant = false): void {
  clearTimers();
  const flat = beatIndex(STATES[index]!.beat);
  talk.jump(flat, 'play', instant);
}

/** A motion prototype: its first beat's choreography, then the scripted presses. */
export function playMotion(index: number): void {
  clearTimers();
  const m = MOTIONS[index]!;
  talk.jump(beatIndex(m.beat), 'play');
  // Real forward presses: each continues from the live state, as the presenter's key would.
  for (const t of m.presses) timers.push(window.setTimeout(() => talk.next(), t * 1000));
}

export const directionName = (d: StudyDirection) => STUDY_TOKENS[d].name;
