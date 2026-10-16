/**
 * Presentation v1 (the ~7-minute university talk): people, links and controller constants.
 *
 * Placeholders are deliberate. Nothing here is guessed: an unknown e-mail or URL stays a visible
 * TODO token until the owners provide it (see docs/presentation-v1-review/PRESENTATION-STORY.md).
 */

export interface Presenter {
  id: 'virgilijus' | 'timofej';
  name: string;
  /** Shown and linked (mailto:) once it is a real address; a TODO token is shown as plain text. */
  email: string;
  /** Photo-based illustration later; null = the built-in placeholder figure. */
  portrait: string | null;
}

export const PRESENTERS: readonly [Presenter, Presenter] = [
  { id: 'virgilijus', name: 'Virgilijus Kiltinavičius', email: 'VIRGILIJUS_EMAIL_TODO', portrait: null },
  { id: 'timofej', name: 'Timofej Gaivoronskij', email: 'timofej.gaivoronskij@stud.vilniustech.lt', portrait: null },
];

/** The public interactive page the QR code will open (likely GitHub Pages). Not published yet. */
export const PUBLIC_PRESENTATION_URL = 'PUBLIC_PRESENTATION_URL_TODO';

/** A value that is still a placeholder (never linked, never encoded into a QR code). */
export const isPlaceholder = (value: string) => /_TODO$/.test(value);

export const TALK = {
  /** Default input lock after a forward step (s): a second press inside it is ignored. */
  lock: 0.7,
  /** Backward and direct steps: a short settle move instead of the beat's choreography. */
  settle: { camera: 1.6, reveal: 1.2, world: 1.0, lock: 0.45 },
  /** Dip to dark between places too far apart to fly between (s). */
  cut: { out: 0.42, in: 0.65 },
  /** Distance between the live and the next view target above which a settle move cuts (m). */
  cutDistance: 600,
  /** Default look and world-channel transition (s). */
  lookDuration: 1.2,
  worldDuration: 1.1,
  /** Camera breathing on holds: azimuth amplitude (deg) for drift 1, periods (s). */
  breathing: { azimuthDeg: 1.6, polarDeg: 0.45, radius: 0.012, periods: [41, 29] as const, rampIn: 4 },
  /** The talk's effect clock wraps (s) so float precision never degrades in a long Q&A hold. */
  clockWrap: 3600,
} as const;
