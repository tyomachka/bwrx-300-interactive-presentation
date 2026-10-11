import { useEffect } from 'react';
import { cameraDirector } from '../camera/cameraDirector';
import { cycleReviewView } from '../camera/reviewViews';
import { useAppStore } from '../state/store';

/**
 * Global shortcuts (PROJECT.md §11). Space, X, C, F, S and Esc are reserved for later
 * stages. V and G are review aids, active only in dev builds or with `?debug`.
 *
 * Keys are matched by `event.code` (physical position), not `event.key`. On the
 * Lithuanian layout the number row types ą č ę ė ... without Shift, so `key === '1'`
 * would silently fail on a VILNIUS TECH lectern PC.
 */
const BINDINGS: Record<string, () => void> = {
  KeyR: () => void cameraDirector.reset(),
  Digit1: () => useAppStore.getState().setQuality('high'),
  Numpad1: () => useAppStore.getState().setQuality('high'),
  Digit2: () => useAppStore.getState().setQuality('low'),
  Numpad2: () => useAppStore.getState().setQuality('low'),
  Backquote: () => useAppStore.getState().toggleDebug(),
  KeyV: () => {
    if (useAppStore.getState().debugAvailable) void cycleReviewView();
  },
  KeyG: () => {
    const { debugAvailable, sectionReview, setSectionReview } = useAppStore.getState();
    if (debugAvailable) setSectionReview(!sectionReview);
  },
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
