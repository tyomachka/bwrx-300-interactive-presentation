/**
 * Explore-mode actions (Stage 5): the only code that writes the Explore store, so its invariants
 * hold whatever the input (pointer, keyboard, panel, automation).
 *
 * Nothing here runs while a cinematic owns the camera (`mode === 'presentation'`).
 *
 * Section: the Explore section is not a new cut engine. It sets the reveal state the Stage 3
 * shot animates (scene/section/sectionLayers.ts derives every plane from it):
 *   plant   - one slider scrubs the shot's cut sequence: ground, building + shaft, containment;
 *   reactor - the plant fully open, the slider scrubs the vessel cutaway.
 *
 * Focus: the component's registry focus pose, through the camera director's transition authority
 * (OrbitControls disabled while it runs, handed back at the exact final pose). If the pose is
 * below grade or inside the vessel, the section opens first so the camera stands in open space.
 */
import gsap from 'gsap';
// Side effect: GSAP must be ticked by our frame loop before any tween is created.
import '../animation/clock';
import { HERO_REVEAL_CLOSED, heroReveal, type HeroRevealState } from '../animation/heroReveal';
import { heroShot } from '../animation/heroShot';
import { stopRpvReviewTween } from '../animation/rpvReview';
import { cameraDirector } from '../camera/cameraDirector';
import { CAMERA_STATES, ORBIT } from '../config/camera';
import { COMPONENTS, selectableFor, type ComponentId } from '../scene/components';
import { EXPLORE_INITIAL, exploreState, useExploreStore, type SectionContext, type SectionState } from './exploreStore';

/** Focus moves are short: a click is not a cinematic. */
export const FOCUS_DURATION = 1.1;
const SECTION_DURATION = 0.7;

const set = useExploreStore.setState;
const canAct = () => exploreState().mode === 'explore';
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

// ---- Selection and focus ---------------------------------------------------------------------------

export function setHovered(id: ComponentId | null): void {
  if (!canAct() || exploreState().hoveredId === id) return;
  set({ hoveredId: id });
}

/** Select a component (or its nearest selectable ancestor) and, by default, focus it. */
export function select(id: ComponentId | null, options: { focus?: boolean; immediate?: boolean } = {}): void {
  if (!canAct()) return;
  const selectedId = id ? selectableFor(id) : null;
  if (!selectedId) {
    clearSelection();
    return;
  }
  set((s) => ({ selectedId, isolate: s.isolate, focusId: s.focusId === selectedId ? selectedId : null }));
  if (options.focus ?? true) focus(selectedId, options);
}

export function clearSelection(): void {
  if (!canAct()) return;
  set({ selectedId: null, isolate: false, focusId: null });
}

/** Move the camera to a component's focus pose, opening what it needs to be seen. */
export function focus(id: ComponentId, options: { immediate?: boolean } = {}): void {
  if (!canAct()) return;
  const info = COMPONENTS[id];
  const section = exploreState().section;
  if (info.opens === 'vessel' && !(section.on && section.context === 'reactor' && section.position >= 0.99)) {
    setSection({ on: true, context: 'reactor', position: 1 }, options);
  } else if (info.opens === 'plant' && !(section.on && (section.context === 'reactor' || section.position >= 0.99))) {
    setSection({ on: true, context: 'plant', position: 1 }, options);
  }
  // Below-grade focus poses stand inside the opened excavation: let Explore follow them there.
  if (CAMERA_STATES[info.focus].position[1] < ORBIT.minCameraY) cameraDirector.allowBelowGrade = true;
  set({ focusId: id });
  if (options.immediate) cameraDirector.snapTo(info.focus);
  else void cameraDirector.transitionTo(info.focus, { duration: FOCUS_DURATION });
}

// ---- Modes ---------------------------------------------------------------------------------------------

export function setXray(on: boolean): void {
  if (canAct()) set({ xray: on });
}

export const toggleXray = () => setXray(!exploreState().xray);

/** Isolate the selection (context kept: enclosures ghost, the rest steps back). */
export function setIsolate(on: boolean): void {
  if (!canAct()) return;
  set({ isolate: on && exploreState().selectedId !== null });
}

export const toggleIsolate = () => setIsolate(!exploreState().isolate);

/** Ignored while a presentation owns the scene, like every other Explore input. */
export function setLabels(on: boolean): void {
  if (canAct()) set({ labels: on });
}

export const toggleLabels = () => setLabels(!exploreState().labels);

/** Flow (Stage 7): the normal-operation flow. Off by default; Reset turns it off. */
export function setFlow(on: boolean): void {
  if (canAct()) set({ flow: on });
}

export const toggleFlow = () => setFlow(!exploreState().flow);

// ---- Section ---------------------------------------------------------------------------------------------

/** The reveal a section request means (the one section engine: sectionLayers.applyReveal). */
export function revealForSection(s: SectionState): HeroRevealState {
  const closed = { ...HERO_REVEAL_CLOSED };
  if (!s.on) return closed;
  const p = clamp01(s.position);
  if (s.context === 'plant') {
    const ground = clamp01(p / 0.45);
    return { ...closed, groundCut: ground, exteriorDim: ground, shaftReveal: clamp01((p - 0.35) / 0.35), containmentReveal: clamp01((p - 0.7) / 0.3) };
  }
  return { ...closed, groundCut: 1, exteriorDim: 1, shaftReveal: 1, containmentReveal: 1, vesselCut: p };
}

let sectionTween: gsap.core.Tween | null = null;

function applySection(section: SectionState, immediate: boolean): void {
  heroShot.cancelClose();
  stopRpvReviewTween();
  sectionTween?.kill();
  sectionTween = null;
  const target = revealForSection(section);
  if (immediate) Object.assign(heroReveal, target);
  else sectionTween = gsap.to(heroReveal, { ...target, duration: SECTION_DURATION, ease: 'power2.inOut', onComplete: () => void (sectionTween = null) });
}

/** Change the section (slider drags pass `immediate` so the cut follows the pointer). */
export function setSection(patch: Partial<SectionState>, options: { immediate?: boolean } = {}): void {
  if (!canAct()) return;
  const section = { ...exploreState().section, ...patch, position: clamp01(patch.position ?? exploreState().section.position) };
  set({ section });
  applySection(section, options.immediate ?? false);
  if (!section.on) leaveBelowGrade();
}

export function toggleSection(): void {
  const s = exploreState();
  if (s.section.on) {
    setSection({ on: false });
    return;
  }
  const inVessel = s.selectedId !== null && COMPONENTS[s.selectedId].opens === 'vessel';
  setSection({ on: true, context: inVessel ? 'reactor' : 'plant', position: 1 });
}

export function setSectionContext(context: SectionContext): void {
  setSection({ on: true, context, position: 1 });
}

/** Closing the ground with the camera below grade would bury it: climb out to the excavation edge. */
function leaveBelowGrade(): void {
  cameraDirector.allowBelowGrade = false;
  if (cameraDirector.getPose().position[1] < ORBIT.minCameraY) void cameraDirector.transitionTo('stage3RPVHero', { duration: FOCUS_DURATION });
}

// ---- Presentation hand-over and reset ------------------------------------------------------------------

/** A cinematic took the camera: drop every explore visual and stop listening. */
export function suspendForPresentation(): void {
  sectionTween?.kill();
  sectionTween = null;
  set({ mode: 'presentation', hoveredId: null, selectedId: null, focusId: null, isolate: false, xray: false });
}

/** The cinematic handed back: resume, with the section state matching the cut it left open. */
export function resumeAfterPresentation(revealOpen: boolean): void {
  set({ mode: 'explore', section: { on: revealOpen, context: 'plant', position: 1 } });
}

/**
 * Back to the initial Explore state (the reveal and camera are reset by resetPresentation, which
 * stops every cinematic first). Explore resumes at once: resuming from a cinematic later would
 * sync the section to a reveal that is just closing.
 */
export function resetExplore(): void {
  sectionTween?.kill();
  sectionTween = null;
  cameraDirector.allowBelowGrade = false;
  set({ ...EXPLORE_INITIAL, mode: 'explore' });
}
