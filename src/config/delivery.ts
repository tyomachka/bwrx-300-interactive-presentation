/**
 * Delivery constants (Stage 11). The portable package is one folder:
 *
 *   BWRX300/
 *     BWRX300.html               the whole app in one file (npm run build:portable)
 *     BWRX300-fallback-lt.mp4    the 48 s presentation in Lithuanian, 1080p30 H.264, no audio
 *     BWRX300-fallback-en.mp4    the same in English
 *     START-HERE.txt             the Lithuanian instructions (a copy of START-HERE-LT.txt)
 *     START-HERE-LT.txt
 *     START-HERE-EN.txt
 *
 * The failure screens play the backup video in the current language from next to the page (a
 * relative path, so it works from file:// on a USB drive and from any web folder alike).
 */
import type { Language } from '../i18n/language';

export const FALLBACK_VIDEO_FILES: Record<Language, string> = {
  lt: 'BWRX300-fallback-lt.mp4',
  en: 'BWRX300-fallback-en.mp4',
};
