/**
 * Audience language (Stage 11 localization): Lithuanian by default, English on request.
 *
 * Presentation state only. The setup and Explore UI, the component texts, the status screens, the
 * fission inset's labels and the backup video follow it; the story, timing, cameras and materials
 * never read it. It lives outside the canvas and the Explore store, so a quality remount or a
 * Reset keeps it, and where browser storage works a reload keeps it too.
 */
import { create } from 'zustand';
import { useMasterStore } from '../animation/masterSequence';

export type Language = 'lt' | 'en';

export const LANGUAGES: readonly Language[] = ['lt', 'en'];
export const DEFAULT_LANGUAGE: Language = 'lt';

const STORAGE_KEY = 'bwrx300.language';

export const isLanguage = (value: unknown): value is Language => value === 'lt' || value === 'en';

/** The remembered choice, or Lithuanian (also when storage is blocked, e.g. by a file:// policy). */
function readStoredLanguage(): Language {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return isLanguage(value) ? value : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

function storeLanguage(language: Language): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, language);
  } catch {
    // Not remembered across a reload; the switch itself still applies.
  }
}

interface LanguageState {
  language: Language;
  setLanguage: (language: Language) => void;
}

export const useLanguageStore = create<LanguageState>()((set, get) => ({
  language: readStoredLanguage(),
  setLanguage: (language) => {
    // Never while the cinematic plays: the selector is hidden then, and this guards any other caller.
    if (language === get().language || useMasterStore.getState().status === 'playing') return;
    storeLanguage(language);
    set({ language });
  },
}));
