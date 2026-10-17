/**
 * Presentation V1 / Stage 1 design study (docs/presentation-design-study/). NOT the presentation:
 * three candidate visual directions on five representative states plus four motion prototypes.
 *
 *   ?designStudy=1          the live review mode: a small temporary panel, 1/2/3 direction,
 *                           Left/Right state, T typography board (presentation/study/StudyReview.tsx)
 *   ?study=a|b|c            one direction, no panel (scripted captures)
 *
 * Without either parameter (the lecture) nothing here runs, and the portable build compiles the
 * whole study out (every call site is guarded by import.meta.env.MODE !== 'portable').
 *
 *   a  Precision              refined current identity: Segoe UI Variable, charcoal / off-white
 *   b  Editorial cinematic    Inter Variable, asymmetric, larger hero type, fewer labels
 *   c  Technical documentary  IBM Plex Sans Variable, anchored labels with leader lines
 *
 * Only one direction survives into Stage 2; the others (and this switch) are then removed.
 */
import { create } from 'zustand';

export type StudyDirection = 'a' | 'b' | 'c';

const params = typeof window === 'undefined' || import.meta.env.MODE === 'portable' ? null : new URLSearchParams(window.location.search);
const asDirection = (value: string | null | undefined): StudyDirection | null => (value === 'a' || value === 'b' || value === 'c' ? value : null);

/** The live review mode (`?designStudy=1`). */
export const STUDY_REVIEW = !!params && params.has('designStudy') && params.get('designStudy') !== '0';

const initial: StudyDirection | null = asDirection(params?.get('study')?.toLowerCase()) ?? (STUDY_REVIEW ? 'a' : null);

/** The study can run in this page at all (its stylesheet, fonts and patches are loaded). */
export const STUDY_ENABLED = initial !== null;

export interface StudyState {
  direction: StudyDirection | null;
  /** The typography A/B/C board is shown over the frame. */
  typography: boolean;
}

export const useStudyStore = create<StudyState>()(() => ({ direction: initial, typography: false }));

export const studyDirection = () => useStudyStore.getState().direction;
