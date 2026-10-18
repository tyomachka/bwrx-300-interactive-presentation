/**
 * Screen-space label placement (Stage 5). The DOM elements are rendered by ui/ExploreOverlay.tsx
 * and registered here; the in-canvas driver positions them every frame with transforms only, so
 * a moving camera never re-renders React and never forces layout.
 *
 * One primary label (the selection) is anchored to its component's 3D anchor with a small dot,
 * placed beside it on the side away from the screen edge, clamped inside the viewport (above the
 * Explore panel) and hidden when the anchor is behind the camera. The hover tag follows the
 * pointer and shows only a name.
 */
import { Vector3, type Camera } from 'three';

export const labelLayer = {
  primary: null as HTMLElement | null,
  dot: null as HTMLElement | null,
  hover: null as HTMLElement | null,
  /**
   * The Explore bar in stage pixels (ui/ExplorePanel.tsx keeps it current): its left and right
   * edges and how far its top is above the stage's bottom edge. It grows when the bar wraps.
   */
  bar: { left: 0, right: 0, fromBottom: 0 },
  /**
   * Extra room kept free along the top and right edges (stage pixels): the explore-only page's top
   * strip and, on a phone in landscape, its side panel (ui/ExploreSheet.tsx). Zero on the desktop.
   */
  reserve: { top: 0, right: 0 },
};

const MARGIN = 20;
/** Keep labels clear of the Explore panel along the bottom edge. */
const BOTTOM_RESERVE = 132;
/** Space between a label and a wrapped (taller) Explore bar under it. */
const BAR_GAP = 12;
const GAP = 22;
const _v = new Vector3();

function hide(el: HTMLElement | null): void {
  if (el && el.style.visibility !== 'hidden') el.style.visibility = 'hidden';
}

function show(el: HTMLElement, x: number, y: number): void {
  el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  if (el.style.visibility !== 'visible') el.style.visibility = 'visible';
}

export function placePrimaryLabel(camera: Camera, width: number, height: number, anchor: Vector3 | null): void {
  const { primary, dot } = labelLayer;
  if (!primary) return;
  if (!anchor) {
    hide(primary);
    hide(dot);
    return;
  }
  // Behind the camera: no label (it would mirror onto the screen).
  _v.copy(anchor).applyMatrix4(camera.matrixWorldInverse);
  if (_v.z > -0.5) {
    hide(primary);
    hide(dot);
    return;
  }
  _v.copy(anchor).project(camera);
  const x = ((_v.x + 1) / 2) * width;
  const y = ((1 - _v.y) / 2) * height;
  const onScreen = x >= 0 && x <= width && y >= 0 && y <= height;
  if (dot) {
    if (onScreen) show(dot, x, y);
    else hide(dot);
  }
  const w = primary.offsetWidth;
  const h = primary.offsetHeight;
  const right = x < width * 0.6;
  const lx = Math.min(Math.max(right ? x + GAP : x - GAP - w, MARGIN), width - w - MARGIN - labelLayer.reserve.right);
  // Above the bar when it is taller than the usual reserve (wrapped sliders, longer words).
  const bar = labelLayer.bar;
  const overBar = lx < bar.right && lx + w > bar.left;
  const reserve = overBar ? Math.max(BOTTOM_RESERVE, bar.fromBottom + BAR_GAP) : BOTTOM_RESERVE;
  const ly = Math.min(Math.max(y - h / 2, MARGIN + labelLayer.reserve.top), height - h - reserve);
  show(primary, lx, ly);
}

export function placeHoverTag(clientX: number, clientY: number, visible: boolean): void {
  const { hover } = labelLayer;
  if (!hover) return;
  if (!visible) {
    hide(hover);
    return;
  }
  show(hover, clientX + 16, clientY + 18);
}

export function hideLabels(): void {
  hide(labelLayer.primary);
  hide(labelLayer.dot);
  hide(labelLayer.hover);
}
