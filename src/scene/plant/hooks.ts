import { useEffect } from 'react';
import type { BufferGeometry } from 'three';
import { RADIAL_SEGMENTS } from '../../config/quality';
import { useQualityPreset } from '../../state/store';

/** Radial segments for a half-circle at the current quality preset. */
export function useHalfSegments(): number {
  return RADIAL_SEGMENTS[useQualityPreset().geometryLod] / 2;
}

/** Dispose a memoised geometry when it is replaced or unmounted. */
export function useDisposeOnChange(...geometries: BufferGeometry[]): void {
  useEffect(() => () => geometries.forEach((g) => g.dispose()), geometries); // eslint-disable-line react-hooks/exhaustive-deps
}
