/**
 * Explore-mode interaction state (Stage 5): one store, so no two flags can disagree.
 *
 * Invariants (enforced by the setters in exploreActions.ts, never by the views):
 *  - `isolate` and `focusId` only exist with a selection; clearing the selection clears both;
 *  - in `presentation` mode (a cinematic owns the camera) nothing is hovered or selected and
 *    no explore visual is applied; Explore resumes cleanly when the cinematic hands back;
 *  - the section state is the user's request; the cut itself lives in the reveal state (the same
 *    one the Stage 3 shot drives), so there is still exactly one section engine.
 *
 * Hover changes only when the hovered component changes (not on every pointer move), and the
 * animated visuals live outside React (exploreVisuals.ts), so the UI re-renders rarely.
 */
import { create } from 'zustand';
import type { ComponentId } from '../scene/components';

export type ExploreMode = 'explore' | 'presentation';

/** `plant`: the reactor building, shaft and containment open (the Stage 3 cut, scrubbed);
 *  `reactor`: the plant open and the vessel cutaway scrubbed. */
export type SectionContext = 'plant' | 'reactor';

export interface SectionState {
  on: boolean;
  context: SectionContext;
  /** 0 = closed .. 1 = fully open. */
  position: number;
}

export interface ExploreState {
  mode: ExploreMode;
  hoveredId: ComponentId | null;
  selectedId: ComponentId | null;
  /** The component the camera last moved to (cleared with the selection). */
  focusId: ComponentId | null;
  /** Isolate the selection: it stays, its enclosures ghost, everything else steps back. */
  isolate: boolean;
  /** X-ray: the shells around the subject become ghosts (dithered, no blending). */
  xray: boolean;
  section: SectionState;
  labels: boolean;
  /**
   * Flow (Stage 7): the normal-operation flow, looping. The turbine hall turns X-ray so the steam
   * line, turbine and generator show; the reactor's flow shows through the vessel cut (or X-ray).
   */
  flow: boolean;
  /**
   * Control (Stage 8): the blade slider and the reaction cue. Turning it on opens the reactor
   * section and frames the blades; off (or Reset) returns the blades to the base pattern.
   */
  control: boolean;
  /** 0 = the base blade pattern (more withdrawn) .. 1 = the deeper pattern (more inserted). */
  controlAmount: number;
}

export const EXPLORE_INITIAL: Readonly<ExploreState> = {
  mode: 'explore',
  hoveredId: null,
  selectedId: null,
  focusId: null,
  isolate: false,
  xray: false,
  section: { on: false, context: 'plant', position: 1 },
  labels: true,
  flow: false,
  control: false,
  controlAmount: 0,
};

export const useExploreStore = create<ExploreState>()(() => ({ ...EXPLORE_INITIAL }));

export const exploreState = () => useExploreStore.getState();
