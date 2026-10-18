import { Vector3 } from 'three';

/**
 * Who owns the ground under the plant this frame: its own earth block (full size) or the talk's
 * filler (scaled). One predicate, decided once per frame in one place, so there is never a frame
 * with both (depth conflict) or neither (the void and the shaft showing through the floor's hole:
 * Stage 3 hid the earth below scale 0.9999 but showed the filler only below log-scale -0.001, two
 * frames apart on every map move).
 */
export const groundOwner = {
  scaled: false,
  scale: 1,
  /** Diagnostics (validation): what is drawn this frame, and the highest |y| of the plant's grade markers. */
  earthVisible: true,
  fillerVisible: false,
  gradeError: 0,
};

/** Points on grade in the plant's own frame (reactor wall, turbine hall corners, site corner). */
export const GRADE_MARKERS = [new Vector3(18.5, 0, 0), new Vector3(104, 0, 23), new Vector3(20.6, 0, -23), new Vector3(-45, 0, 40)];

