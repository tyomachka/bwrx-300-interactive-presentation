/**
 * Post-final compatibility: which experience this page opens, decided once at load.
 *
 *  - `?mode=explore`       the interactive model only (the opening / closing QR points here), on any device;
 *  - `?mode=presentation`  the lecture set-up, also on a phone (testing the talk at a phone-sized viewport);
 *  - no `mode`             a touch-only device (a phone or a tablet: coarse pointer, no mouse or trackpad)
 *                          opens the model only; every other device opens the lecture set-up, unchanged.
 *
 * The explore-only page has no way into the talk or the 48 s film: no buttons, no keys.
 */

export type EntryMode = 'presentation' | 'explore';

export const ENTRY_QUERY_PARAM = 'mode';

/**
 * A device whose only pointer is a finger. A touchscreen laptop still has its trackpad
 * (`any-pointer: fine`), so the lecture PC is never taken for one.
 */
function detectHandheld(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(pointer: coarse)').matches && !window.matchMedia('(any-pointer: fine)').matches;
}

export function resolveEntryMode(search: string, handheld: boolean): { mode: EntryMode; reason: 'query' | 'device' | 'default' } {
  const requested = new URLSearchParams(search).get(ENTRY_QUERY_PARAM);
  if (requested === 'explore' || requested === 'presentation') return { mode: requested, reason: 'query' };
  return handheld ? { mode: 'explore', reason: 'device' } : { mode: 'presentation', reason: 'default' };
}

/** Touch-only device: Low by default, a capped render buffer (config/quality.ts), touch tolerances. */
export const HANDHELD = detectHandheld();

export const ENTRY = resolveEntryMode(window.location.search, HANDHELD);

/** The interactive model only: no talk, no film, the stage fills the viewport. */
export const EXPLORE_ONLY = ENTRY.mode === 'explore';
