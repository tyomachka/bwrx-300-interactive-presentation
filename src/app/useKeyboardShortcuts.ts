import { useEffect } from 'react';
import { heroShot } from '../animation/heroShot';
import { masterSequence } from '../animation/masterSequence';
import { resetPresentation, startOrTogglePresentation, startPresentation } from '../animation/presentation';
import { cycleRpvReview } from '../animation/rpvReview';
import { clearSelection, toggleControl, toggleFlow, toggleIsolate, toggleLabels, toggleSafety, toggleSection, toggleXray } from '../interaction/exploreActions';
import { cycleReviewView } from '../camera/reviewViews';
import { useAppStore } from '../state/store';

/**
 * Global shortcuts (PROJECT.md §11). Explore (Stage 5): Esc clears the selection, X X-ray,
 * C section, I isolate, L labels, R full reset; F flow (Stage 7); O control (Stage 8: the blade
 * slider; B stays the Stage 4 review key); S safety (Stage 9: the isolation-condenser loop). The
 * live presentation never needs any of them.
 * Master sequence: Space starts the presentation, then pauses / resumes it (and replays it once
 * finished); Home restarts it from the first frame; R stops it and returns to the home view.
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
      const action = BINDINGS[event.code];
      if (!action) return;
      event.preventDefault();
      action();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
