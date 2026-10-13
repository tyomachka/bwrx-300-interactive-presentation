/**
 * Keyframe evaluation shared by the Stage 7 flow and the Stage 8 control state: [time, value]
 * keys, smoothed between keys (smootherstep, as the Stage 6 look keys). Pure.
 */
import { MathUtils } from 'three';

/** Keys [time s, value], in time order. */
export type Keys = readonly (readonly [number, number])[];

const smooth = (x: number) => MathUtils.smootherstep(x, 0, 1);

/** Keys -> value at `t`, smoothed between keys. */
export function keyed(keys: Keys, t: number): number {
  if (t <= keys[0]![0]) return keys[0]![1];
  for (let i = 1; i < keys.length; i++) {
    const k1 = keys[i]!;
    if (t <= k1[0]) {
      const k0 = keys[i - 1]!;
      return k0[1] + (k1[1] - k0[1]) * smooth((t - k0[0]) / (k1[0] - k0[0]));
    }
  }
  return keys[keys.length - 1]![1];
}
