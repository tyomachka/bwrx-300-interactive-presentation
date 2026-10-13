/**
 * Where Explore lets the orbit target and the camera go, by what is cut open (navigation polish).
 *
 *  - Closed plant: target in ORBIT.panBounds (above grade); the director keeps the camera above
 *    grade with its polar cap.
 *  - Plant partly opened, or the Stage 2 section review: target may also go below grade
 *    (ORBIT.panBoundsSection), as before.
 *  - Plant fully cut (excavation, building and containment open): target above grade or anywhere
 *    in the opened reactor volume (ORBIT.openCut.targetBounds), so the lower core, guide tubes,
 *    bottom head and drives can become the orbit centre; the camera may stand anywhere in the open
 *    excavation in front of the cut, down to its floor, but never inside the uncut earth or walls.
 *
 * Reset closes the reveal, which brings back the closed-plant bounds.
 * Pure functions of the reveal state: nothing here runs unless the camera moves.
 */
import { MathUtils, Vector3 } from 'three';
import { heroReveal, isHeroRevealOpen } from '../animation/heroReveal';
import { ORBIT, type Vec3Tuple } from '../config/camera';
import { useAppStore } from '../state/store';

interface Box {
  readonly min: Vec3Tuple;
  readonly max: Vec3Tuple;
}

const OPEN = 0.999;
const _a = new Vector3();
const _b = new Vector3();

/** The excavation, building and containment cuts are complete (not the Stage 2 section review). */
export function isPlantCutOpen(): boolean {
  return heroReveal.groundCut >= OPEN && heroReveal.shaftReveal >= OPEN && heroReveal.containmentReveal >= OPEN && !useAppStore.getState().sectionReview;
}

/** Over or inside the open excavation in front of the cut plane (plan test, any height). */
export function inCutFootprint(p: Vector3): boolean {
  const f = ORBIT.openCut.footprint;
  return p.x >= f.xMin && p.x <= f.xMax && p.z >= f.zMin && p.z <= f.zMax;
}

function clampToBox(p: Vector3, box: Box, out: Vector3): Vector3 {
  return out.set(MathUtils.clamp(p.x, box.min[0], box.max[0]), MathUtils.clamp(p.y, box.min[1], box.max[1]), MathUtils.clamp(p.z, box.min[2], box.max[2]));
}

/**
 * The nearest allowed orbit target to `p` (written to `out`). With the plant cut open the allowed
 * volume is two boxes that meet at grade; taking the nearer clamp makes a target that leaves one
 * slide along its boundary instead of jumping to the other.
 */
export function clampExploreTarget(p: Vector3, out: Vector3): Vector3 {
  if (isPlantCutOpen()) {
    const above = clampToBox(p, ORBIT.panBounds, _a);
    const below = clampToBox(p, ORBIT.openCut.targetBounds, _b);
    return out.copy(p.distanceToSquared(above) <= p.distanceToSquared(below) ? above : below);
  }
  const opened = useAppStore.getState().sectionReview || isHeroRevealOpen();
  return clampToBox(p, opened ? ORBIT.panBoundsSection : ORBIT.panBounds, out);
}

const _clamped = new Vector3();

export const isExploreTargetAllowed = (p: Vector3) => clampExploreTarget(p, _clamped).distanceToSquared(p) < 1e-10;

/**
 * Plant cut open: below grade the camera must be in the open excavation. If it is not (an orbit
 * swung it behind the cut plane, a pan pushed it into the earth), it is moved the shortest way
 * back: sideways into the excavation, or up to grade. Returns true when it moved.
 */
export function keepCameraInCut(p: Vector3): boolean {
  if (p.y >= ORBIT.minCameraY || inCutFootprint(p)) return false;
  const f = ORBIT.openCut.footprint;
  const side = _a.set(MathUtils.clamp(p.x, f.xMin, f.xMax), p.y, MathUtils.clamp(p.z, f.zMin, f.zMax));
  if (p.distanceTo(side) <= ORBIT.minCameraY - p.y) p.copy(side);
  else p.y = ORBIT.minCameraY;
  return true;
}
