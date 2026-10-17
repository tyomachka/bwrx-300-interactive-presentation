/**
 * Chapter 11 layout (presentation/scene/LimitsCues.tsx draws it; chapters.ts anchors its label on it).
 */
/** [ILLUSTRATIVE] West of the reactor building, on the site slab, clear of the apron (world metres). */
export const LIMITS_PAD = {
  center: [-56, 0, 10] as const,
  size: [24, 0.5, 13] as const,
  cask: { radius: 1.7, height: 5.8 },
  /** Two rows of four, 5 m apart. */
  rows: 2,
  perRow: 4,
  pitch: 5,
} as const;
