/**
 * Presentation v1 design tokens: the one source for the talk's typography, colour and motion.
 * presentation/ui/TalkOverlay.tsx writes them onto the overlay as CSS variables (talk.css only
 * reads `var(--talk-...)`), so a change here restyles every chapter consistently.
 *
 * Sizes are pixels on a 1920 x 1080 stage and become stage-relative (cqh), so 1280 x 800 and
 * 1024 x 768 projectors show the same composition; small print keeps a pixel floor.
 */

/** System fonts only (no web-font request): Windows first, graceful elsewhere. */
export const FONT_STACK = '"Segoe UI Variable Display", "Segoe UI Variable Text", "Segoe UI", system-ui, -apple-system, Roboto, "Helvetica Neue", Arial, sans-serif';

/** Type scale at 1080p (px). */
export const TYPE = {
  hero: 68,
  headline: 44,
  metric: 96,
  metricUnit: 40,
  support: 23,
  kicker: 15,
  qualifier: 15,
  label: 21,
  labelSub: 16,
  word: 26,
  value: 52,
  speakerName: 24,
  speakerEmail: 17,
  legend: 16,
  chapter: 14,
} as const;

/** Smallest rendered size (px) for small print, whatever the projector resolution. */
export const TYPE_FLOOR = { qualifier: 12, kicker: 12, labelSub: 12, legend: 12, support: 14, label: 13, speakerEmail: 12, chapter: 11 } as const;

/**
 * Colour roles. The warm accent means "look here" (current idea, the main metric unit, the one pin
 * under construction); everything else is neutral. Water, steam and electricity keep the 3D
 * scene's own colours (config/flow.ts).
 */
export const COLOR = {
  text: '#f2f4f6',
  text2: '#c5cacf',
  qualifier: '#a7adb3',
  accent: '#e8a33d',
  muted: '#9aa1a8',
  panel: 'rgba(10, 12, 15, 0.78)',
  background: '#0b0c0e',
  water: '#5c9cc3',
  steam: '#e8edf0',
  electricity: '#f4ead6',
} as const;

/**
 * Motion grammar. Major transitions are camera / scale / reveal moves of 0.8-1.6 s (set per beat in
 * chapters.ts); text and numbers enter in ~0.45 s with a short rise, never bounce, rotate or scale.
 */
export const MOTION = {
  textIn: 450,
  textOut: 350,
  /** Rise of entering text (px at 1080p). */
  textRise: 12,
  ease: 'cubic-bezier(0.22, 0.8, 0.3, 1)',
  /** Count-ups run once (cues in chapters.ts); 1.6-1.8 s. */
  countUp: [1.6, 1.8],
  major: [0.8, 1.6],
} as const;

const cqh = (px: number) => `${(px / 10.8).toFixed(3)}cqh`;
const floor = (px: number, min: number) => `max(${min}px, ${cqh(px)})`;

/** The CSS variables the overlay root carries. */
export function designVariables(): Record<string, string> {
  return {
    '--talk-font': FONT_STACK,
    '--talk-size-hero': cqh(TYPE.hero),
    '--talk-size-headline': cqh(TYPE.headline),
    '--talk-size-metric': cqh(TYPE.metric),
    '--talk-size-metric-unit': cqh(TYPE.metricUnit),
    '--talk-size-support': floor(TYPE.support, TYPE_FLOOR.support),
    '--talk-size-kicker': floor(TYPE.kicker, TYPE_FLOOR.kicker),
    '--talk-size-qualifier': floor(TYPE.qualifier, TYPE_FLOOR.qualifier),
    '--talk-size-label': floor(TYPE.label, TYPE_FLOOR.label),
    '--talk-size-label-sub': floor(TYPE.labelSub, TYPE_FLOOR.labelSub),
    '--talk-size-word': floor(TYPE.word, TYPE_FLOOR.label),
    '--talk-size-value': cqh(TYPE.value),
    '--talk-size-speaker-name': floor(TYPE.speakerName, TYPE_FLOOR.label),
    '--talk-size-speaker-email': floor(TYPE.speakerEmail, TYPE_FLOOR.speakerEmail),
    '--talk-size-legend': floor(TYPE.legend, TYPE_FLOOR.legend),
    '--talk-size-chapter': floor(TYPE.chapter, TYPE_FLOOR.chapter),
    '--talk-text': COLOR.text,
    '--talk-text-2': COLOR.text2,
    '--talk-qualifier': COLOR.qualifier,
    '--talk-accent': COLOR.accent,
    '--talk-muted': COLOR.muted,
    '--talk-panel': COLOR.panel,
    '--talk-in': `${MOTION.textIn}ms`,
    '--talk-out': `${MOTION.textOut}ms`,
    '--talk-rise': cqh(MOTION.textRise),
    '--talk-ease': MOTION.ease,
  };
}
