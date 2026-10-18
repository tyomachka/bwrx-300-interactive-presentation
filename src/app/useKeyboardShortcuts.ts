import { useEffect } from 'react';
import { heroShot } from '../animation/heroShot';
import { masterSequence } from '../animation/masterSequence';
import { resetPresentation, startOrTogglePresentation, startPresentation } from '../animation/presentation';
import { cycleRpvReview } from '../animation/rpvReview';
import { clearSelection, toggleControl, toggleFlow, toggleIsolate, toggleLabels, toggleSafety, toggleSection, toggleXray } from '../interaction/exploreActions';
import { cycleReviewView } from '../camera/reviewViews';
import { talk } from '../presentation/talk';
import { useAppStore } from '../state/store';
import { EXPLORE_ONLY } from './entry';

/**
 * Presentation v1 (the 7-minute talk, src/presentation): while it runs it owns the keys below and
 * every other key is ignored, so a stray press cannot toggle an Explore mode on the projector.
 * Page Down / Page Up are what most presenter clickers send. From Explore, the same "next" keys
 * (and Home) enter the talk; the 48 s cinematic keeps its own keys while it plays or holds.
 */
const TALK_KEYS: Record<string, () => void> = {
  ArrowRight: () => talk.next(),
  Space: () => talk.next(),
  PageDown: () => talk.next(),
  ArrowLeft: () => talk.prev(),
  PageUp: () => talk.prev(),
  Home: () => talk.home(),
  KeyR: () => talk.reset(),
  Escape: () => talk.exit(),
};

const ENTER_TALK: Record<string, () => void> = {
  ArrowRight: () => talk.start(),
  Space: () => talk.start(),
  PageDown: () => talk.start(),
  Home: () => talk.home(),
};

/**
 * Global shortcuts (PROJECT.md §11). Explore (Stage 5): Esc clears the selection, X X-ray,
 * C section, I isolate, L labels, R full reset; F flow (Stage 7); O control (Stage 8: the blade
 * slider; B stays the Stage 4 review key); S safety (Stage 9: the isolation-condenser loop). The
 * live presentation never needs any of them.
 * Master sequence (the 48 s film, started from the setup bar; from idle these keys enter the talk):
 * Space pauses / resumes it (and replays it once finished); Home restarts it from the first frame;
 * R stops it and returns to the home view.
 * Review aids, active only in dev builds or with `?debug`: , / . frame step, [ / ] previous /
 * next beat, V, G, P, K and B.
 *
 * Keys are matched by `event.code` (physical position), not `event.key`. On the
 * Lithuanian layout the number row types ą č ę ė ... without Shift, so `key === '1'`
 * would silently fail on a VILNIUS TECH lectern PC.
 */
/** A quality change rebuilds the canvas: never in the middle of the playing presentation. */
const setQualityUnlessPlaying = (level: 'high' | 'low') => {
  if (masterSequence.status !== 'playing') useAppStore.getState().setQuality(level);
};

const debugOnly = (action: () => void) => () => {
  if (useAppStore.getState().debugAvailable) action();
};

const BINDINGS: Record<string, () => void> = {
  KeyR: () => void resetPresentation(),
  Escape: () => clearSelection(),
  KeyX: () => toggleXray(),
  KeyC: () => toggleSection(),
  KeyI: () => toggleIsolate(),
  KeyL: () => toggleLabels(),
  KeyF: () => toggleFlow(),
  KeyO: () => toggleControl(),
  KeyS: () => toggleSafety(),
  Digit1: () => setQualityUnlessPlaying('high'),
  Numpad1: () => setQualityUnlessPlaying('high'),
  Digit2: () => setQualityUnlessPlaying('low'),
  Numpad2: () => setQualityUnlessPlaying('low'),
  Backquote: () => useAppStore.getState().toggleDebug(),
  // Presentation v1 debug panel (dev / `?debug`; `?presentationDebug` opens it from the start).
  KeyT: () => useAppStore.getState().togglePresentationDebug(),
  KeyV: debugOnly(() => void cycleReviewView()),
  KeyG: debugOnly(() => {
    const { sectionReview, setSectionReview } = useAppStore.getState();
    heroShot.stop();
    setSectionReview(!sectionReview);
  }),
  // Stage 3 hero shot: play / restart from the first frame, and pause / resume.
  KeyP: debugOnly(() => {
    useAppStore.getState().setSectionReview(false);
    heroShot.play();
  }),
  KeyK: debugOnly(() => heroShot.togglePause()),
  // Stage 4 vessel review states: exterior, cutaway, core, control blades, steam region.
  KeyB: debugOnly(() => void cycleRpvReview()),
  // Stage 6 master sequence.
  Space: () => {
    // A focused button would also take the key as a click.
    if (document.activeElement instanceof HTMLButtonElement) document.activeElement.blur();
    startOrTogglePresentation();
  },
  Home: () => startPresentation(),
  Comma: debugOnly(() => masterSequence.step(-1)),
  Period: debugOnly(() => masterSequence.step(1)),
  BracketLeft: debugOnly(() => masterSequence.jumpBeat(-1)),
  BracketRight: debugOnly(() => masterSequence.jumpBeat(1)),
};

/**
 * The explore-only page (app/entry.ts) keeps the Explore keys and quality only: nothing there may
 * start the talk or the 48 s film, nor open the talk's debug panel.
 */
const PRESENTATION_ONLY = new Set(['Space', 'Home', 'KeyT']);
if (EXPLORE_ONLY) for (const code of PRESENTATION_ONLY) delete BINDINGS[code];

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

export function useKeyboardShortcuts(): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      // Never swallow browser shortcuts such as Ctrl+R (reload) or Ctrl+1 (tab switch).
      if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
      if (isTypingTarget(event.target)) return;
      // A focused button would also take Space / Enter as a click.
      const blurButton = () => document.activeElement instanceof HTMLButtonElement && document.activeElement.blur();
      if (talk.active) {
        // Operator keys outside the story: quality, and (dev / `?debug` only) diagnostics and the talk's debug panel.
        const operator = event.code.startsWith('Digit') || event.code.startsWith('Numpad') || event.code === 'Backquote' || event.code === 'KeyT';
        const action = TALK_KEYS[event.code] ?? (operator ? BINDINGS[event.code] : undefined);
        if (!action) return;
        event.preventDefault();
        blurButton();
        action();
        return;
      }
      if (!EXPLORE_ONLY && masterSequence.status === 'idle' && ENTER_TALK[event.code]) {
        event.preventDefault();
        blurButton();
        ENTER_TALK[event.code]!();
        return;
      }
      const action = BINDINGS[event.code];
      if (!action) return;
      event.preventDefault();
      action();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
