/**
 * Presentation v1 design system (Stage 2: "B, editorial cinematic"): the one source for the talk's
 * typography, colour, composition grid and motion. presentation/ui/TalkOverlay.tsx writes them onto
 * the overlay as CSS variables (talk.css only reads `var(--talk-...)`), so a change here restyles
 * every chapter consistently. Chosen in docs/presentation-design-study/DESIGN-STUDY.md.
 *
 * Sizes are pixels on a 1920 x 1080 stage and become stage-relative (cqh / cqw), so 1280 x 800 and
 * 1024 x 768 projectors show the same composition; small print keeps a pixel floor.
 */
import interUrl from './fonts/InterVariable.woff2';

/** Inter Variable, bundled (presentation/fonts/README.md): no font request ever leaves the machine. */
export const FONT_FAMILY = 'Inter Variable';
export const FONT_STACK = `"${FONT_FAMILY}", system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif`;

interface Role {
  /** px at 1080p */
  size: number;
  /** A real instance of the variable face. */
  weight: number;
  /** em */
  tracking: number;
  leading: number;
  /** Smallest rendered px on small stages (small print only). */
  floor?: number;
}

/**
 * Eight roles, no others: every text on screen is one of these.
 *  display  opening title, closing thesis        h1     claims, headlines
 *  metric   50 %, ~300, 24–36, 7 paros           h2     metric units, secondary lines, "Jūsų klausimai"
 *  body     supporting lines, names              label  anchored technical / map labels
 *  source   sources, qualifiers, e-mails         micro  chapter label, kicker (caps, tracked)
 */
export const TYPE = {
  display: { size: 80, weight: 600, tracking: -0.03, leading: 0.98 },
  metric: { size: 108, weight: 500, tracking: -0.035, leading: 0.95 },
  h1: { size: 52, weight: 600, tracking: -0.022, leading: 1.06 },
  h2: { size: 32, weight: 500, tracking: -0.012, leading: 1.15 },
  body: { size: 24, weight: 400, tracking: -0.006, leading: 1.38, floor: 13 },
  label: { size: 19, weight: 500, tracking: -0.004, leading: 1.2, floor: 12 },
  source: { size: 17, weight: 400, tracking: 0, leading: 1.4, floor: 12 },
  micro: { size: 16, weight: 600, tracking: 0.12, leading: 1.2, floor: 12 },
} as const satisfies Record<string, Role>;

export type TypeRole = keyof typeof TYPE;

/**
 * Semantic palette. Amber means one thing: the single current concept (at most one amber element
 * per frame). Process colours belong to the 3D processes and to the dots of the labels that name
 * them (cool water, steam, copper heat), never to decoration. Steel is context and inactive status.
 */
export const COLOR = {
  background: '#0d0f12',
  text: '#f7f8f8',
  text2: '#d1d5d9',
  source: '#b8bec4',
  amber: '#e8a33d',
  cool: '#78b4da',
  steam: '#e8edf0',
  copper: '#d38c5c',
  steel: '#8a939c',
  /** Electricity on the line (the scene's pulse colour). */
  power: '#f4ead6',
  /** Behind small text on light 3D only (0.60-0.74). */
  panel: 'rgba(13, 15, 18, 0.66)',
  /** Leader lines. */
  line: 'rgba(236, 239, 242, 0.62)',
} as const;

/** Colour a label's dot can take (its process or status); the text itself is always primary. */
export type Tone = 'neutral' | 'amber' | 'cool' | 'steam' | 'copper' | 'steel' | 'power';

/**
 * Composition grid of the 16:9 stage (px at 1080p; 1 cqw = 19.2 px, 1 cqh = 10.8 px).
 * Critical text stays inside the 4 % safe zone; nothing qualifies a claim from a screen corner.
 */
export const GRID = {
  /** Safe zone (critical text never closer to the edge). */
  safeX: 77,
  safeY: 43,
  /** Left editorial column: its left edge. */
  left: 120,
  /** Right editorial column: its left edge and width (ends 120 px from the right edge). */
  right: 1238,
  column: 562,
  /** Chapter kicker (top), headline top, lower contact line (bottom). */
  kicker: 50,
  top: 140,
  bottom: 76,
} as const;

/**
 * Motion grammar (unchanged in Stage 2; the motion pass is Stage 3). Major transitions are camera /
 * scale / reveal moves set per beat in chapters.ts; text and numbers enter in ~0.45 s with a short
 * rise, never bounce, rotate or scale.
 */
export const MOTION = {
  textIn: 450,
  textOut: 350,
  /** Rise of entering text (px at 1080p). */
  textRise: 12,
  ease: 'cubic-bezier(0.22, 0.8, 0.3, 1)',
} as const;

const cqh = (px: number) => `${(px / 10.8).toFixed(3)}cqh`;
const cqw = (px: number) => `${(px / 19.2).toFixed(3)}cqw`;
const size = (r: Role) => (r.floor ? `max(${r.floor}px, ${cqh(r.size)})` : cqh(r.size));

/** px at 1080p as a stage-relative length (vertical, horizontal). */
export const stageY = cqh;
export const stageX = cqw;

/** The CSS variables the overlay root carries. */
export function designVariables(): Record<string, string> {
  const vars: Record<string, string> = {
    '--talk-font': FONT_STACK,
    '--talk-in': `${MOTION.textIn}ms`,
    '--talk-out': `${MOTION.textOut}ms`,
    '--talk-rise': cqh(MOTION.textRise),
    '--talk-ease': MOTION.ease,
    '--talk-left': cqw(GRID.left),
    '--talk-right': cqw(GRID.right),
    '--talk-column': cqw(GRID.column),
    '--talk-safe-x': cqw(GRID.safeX),
    '--talk-safe-y': cqh(GRID.safeY),
    '--talk-kicker': cqh(GRID.kicker),
    '--talk-top': cqh(GRID.top),
    '--talk-bottom': cqh(GRID.bottom),
  };
  for (const [name, r] of Object.entries(TYPE) as [TypeRole, Role][]) {
    vars[`--talk-${name}`] = size(r);
    vars[`--talk-${name}-w`] = String(r.weight);
    vars[`--talk-${name}-ls`] = `${r.tracking}em`;
    vars[`--talk-${name}-lh`] = String(r.leading);
  }
  for (const [name, value] of Object.entries(COLOR)) vars[`--talk-c-${name}`] = value;
  return vars;
}

// ---- The face, loaded before the scene opens ------------------------------------------------------

let fontLoad: Promise<void> | null = null;

/**
 * Registers the bundled face and loads it (once). The ready gate (scene/SceneCanvas.tsx) waits for
 * this, so the opening never flashes a fallback; a failure or a slow disk never blocks the app
 * (`timeoutMs`), the stack then falls back to the system sans.
 */
export function loadTalkFont(timeoutMs = 5000): Promise<void> {
  if (fontLoad) return fontLoad;
  if (typeof document === 'undefined' || typeof FontFace === 'undefined') return (fontLoad = Promise.resolve());
  const face = new FontFace(FONT_FAMILY, `url("${interUrl}") format("woff2")`, { weight: '100 900', style: 'normal', display: 'block' });
  document.fonts.add(face);
  const loaded = face.load().then(
    () => undefined,
    (error: unknown) => console.warn('[BWRX-300] Presentation font failed to load; using the system sans.', error),
  );
  const timeout = new Promise<void>((resolve) => window.setTimeout(resolve, timeoutMs));
  return (fontLoad = Promise.race([loaded, timeout]));
}
