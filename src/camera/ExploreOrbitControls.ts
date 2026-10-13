/**
 * three's OrbitControls (r186) with one change: the wheel step is handed to `onWheelZoom` (Explore's
 * cursor-centred zoom, cameraDirector.wheelZoom) instead of OrbitControls' own dolly.
 *
 * Why not OrbitControls' `zoomToCursor`: its step is a fraction of the orbit radius, so once the
 * radius reaches `minDistance` the wheel stops moving the camera even when the surface under the
 * pointer is still far away, and it re-seats the orbit target at that radius, in front of or behind
 * what the user pointed at. It also cannot tell a surface from the background.
 *
 * Everything else about the wheel stays OrbitControls' own: the listener, its gating (controls
 * disabled under a transition or a cinematic, zoom off, a drag in progress), the preventDefault and
 * the delta normalisation. Only its internal `_handleMouseWheel` is overridden. three is pinned to
 * r186 (package.json ^0.186); if a later revision renames that method, the override is never called
 * and the default dolly runs (a warning says so at load).
 */
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface WheelEventLike {
  clientX: number;
  clientY: number;
  deltaY: number;
}

interface OrbitControlsInternals {
  _handleMouseWheel?: (event: WheelEventLike) => void;
}

if (typeof (OrbitControls.prototype as unknown as OrbitControlsInternals)._handleMouseWheel !== 'function') {
  console.warn('[BWRX-300] OrbitControls internals changed: Explore cursor zoom is off, default wheel dolly in use.');
}

export class ExploreOrbitControls extends OrbitControls {
  /** Receives the pointer position and the zoom scale (< 1 zooms in). Null: OrbitControls' dolly. */
  onWheelZoom: ((clientX: number, clientY: number, scale: number) => void) | null = null;
  /** Wheel zoom speed for `onWheelZoom` (OrbitControls' `zoomSpeed` keeps applying to pinch zoom). */
  wheelZoomSpeed = 1;

  _handleMouseWheel(event: WheelEventLike): void {
    if (!this.onWheelZoom) {
      (OrbitControls.prototype as unknown as Required<OrbitControlsInternals>)._handleMouseWheel.call(this, event);
      return;
    }
    if (event.deltaY === 0) return;
    // OrbitControls' own wheel scale (_getZoomScale): 0.95 per 100 px of wheel, to the speed's power.
    const scale = Math.pow(0.95, this.wheelZoomSpeed * Math.abs(event.deltaY * 0.01));
    this.onWheelZoom(event.clientX, event.clientY, event.deltaY < 0 ? scale : 1 / scale);
  }
}
