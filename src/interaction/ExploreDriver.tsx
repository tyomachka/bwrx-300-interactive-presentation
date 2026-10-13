/**
 * The in-canvas half of Explore mode (Stage 5): pointer input, picking, the presentation
 * hand-over, explore visuals and label placement. Renders nothing.
 *
 * Cost when idle: no raycast (picking runs only after the pointer moved, at most once a frame,
 * and on clicks and wheel steps), no React update (hover writes the store only when the hovered
 * component changes), visuals settled (one comparison), label placement only while a label is shown.
 *
 * Navigation input (navigation polish), Explore mode only:
 *  - wheel: OrbitControls hands each step here (ExploreOrbitControls); one pick finds the surface
 *    under the pointer and the director zooms towards it (cameraDirector.wheelZoom);
 *  - double-click on a surface: the director turns the camera to orbit around that point
 *    (cameraDirector.pivotTo). A single click is therefore applied DOUBLE_CLICK_MS after it, once
 *    no second click followed, so a double-click never selects, deselects or starts a focus move.
 */
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { Matrix4, Vector2, Vector3 } from 'three';
import { animationClock } from '../animation/clock';
import { isHeroRevealOpen } from '../animation/heroReveal';
import { cameraDirector } from '../camera/cameraDirector';
import type { ExploreOrbitControls } from '../camera/ExploreOrbitControls';
import type { ComponentId } from '../scene/components';
import { resumeAfterPresentation, select, setHovered, suspendForPresentation } from './exploreActions';
import { exploreState } from './exploreStore';
import { anchorOf, bindComponents, updateExploreVisuals } from './exploreVisuals';
import { hideLabels, placeHoverTag, placePrimaryLabel } from './labelLayer';
import { pickAtClient, pickComponent, setPickingView } from './picking';

/** A press that moves less than this (px) and ends within this time (ms) is a click, not an orbit. */
const CLICK_SLOP = 5;
const CLICK_MS = 600;
/** A second click within this time (ms) and distance (px) of the first makes a double-click. */
const DOUBLE_CLICK_MS = 300;
const DOUBLE_CLICK_SLOP = 6;
/**
 * Wheel steps at the same pointer position within this time (ms) reuse the surface point picked
 * for the first: the zoom moves the camera along the line through it, so it stays under the
 * pointer, and a fast wheel or trackpad burst costs one raycast.
 */
const WHEEL_REPICK_MS = 300;

/** A single click waiting out the double-click window: what it hit, picked when it was made. */
interface PendingClick {
  x: number;
  y: number;
  t: number;
  selectableId: ComponentId | null;
  timer: number;
}

export function ExploreDriver() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const controls = useThree((s) => s.controls) as ExploreOrbitControls | null;
  const pointer = useRef({ ndc: new Vector2(), clientX: 0, clientY: 0, pending: false, inside: false, held: false, down: null as { x: number; y: number; t: number } | null });
  const clicks = useRef({ pending: null as PendingClick | null, secondPress: false });
  // The camera when the hover was last picked, and last frame: a stationary pointer re-picks
  // once the camera comes to rest somewhere new (after an orbit, a wheel zoom, a focus move).
  const camAtPick = useRef(new Matrix4());
  const camLastFrame = useRef(new Matrix4());

  useEffect(() => {
    const canvas = gl.domElement;
    const p = pointer.current;
    const toNdc = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      p.ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      p.clientX = e.clientX;
      p.clientY = e.clientY;
    };
    const onMove = (e: PointerEvent) => {
      toNdc(e);
      p.inside = true;
      // While a button is held the user is orbiting: no hover picking, no hover tag.
      p.pending = e.buttons === 0;
    };
    const c = clicks.current;
    const cancelPendingClick = () => {
      if (c.pending) window.clearTimeout(c.pending.timer);
      c.pending = null;
    };
    const onDown = (e: PointerEvent) => {
      if (e.button === 0) {
        p.down = { x: e.clientX, y: e.clientY, t: performance.now() };
        // A second press close to a waiting click may become a double-click. Any other press
        // supersedes the waiting click (a new click or a drag follows).
        const first = c.pending;
        c.secondPress = !!first && p.down.t - first.t < DOUBLE_CLICK_MS && Math.hypot(e.clientX - first.x, e.clientY - first.y) <= DOUBLE_CLICK_SLOP;
        cancelPendingClick();
      }
      p.held = true;
      p.pending = false;
      setHovered(null);
      placeHoverTag(0, 0, false);
    };
    const onUp = (e: PointerEvent) => {
      const d = p.down;
      p.down = null;
      p.held = false;
      toNdc(e);
      p.pending = true;
      const second = c.secondPress;
      if (e.button === 0) c.secondPress = false;
      if (e.button !== 0 || !d || exploreState().mode !== 'explore') return;
      if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > CLICK_SLOP || performance.now() - d.t > CLICK_MS) return;
      const hit = pickComponent(p.ndc, camera);
      if (second) {
        // Double-click: orbit around the point under the pointer (any visible surface).
        if (hit) void cameraDirector.pivotTo(hit.point);
        return;
      }
      const selectableId = hit?.selectableId ?? null;
      const timer = window.setTimeout(() => {
        c.pending = null;
        // Not if a reset, focus move or cinematic took the camera in the meantime.
        if (exploreState().mode === 'explore' && cameraDirector.authority === 'explore') select(selectableId);
      }, DOUBLE_CLICK_MS);
      c.pending = { x: e.clientX, y: e.clientY, t: d.t, selectableId, timer };
    };
    const onLeave = () => {
      p.inside = false;
      p.held = false;
      p.pending = false;
      setHovered(null);
      placeHoverTag(0, 0, false);
    };
    setPickingView(camera, canvas);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointerleave', onLeave);
    return () => {
      cancelPendingClick();
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.style.cursor = '';
      setPickingView(null, null);
    };
  }, [gl, camera]);

  // Wheel zoom towards the surface under the pointer (background: towards the orbit target).
  // OrbitControls only calls this while it is enabled, i.e. under the explore authority.
  useEffect(() => {
    if (!controls) return;
    const last = { x: NaN, y: NaN, t: -Infinity, anchor: new Vector3(), hit: false };
    controls.onWheelZoom = (x, y, scale) => {
      if (exploreState().mode !== 'explore') return;
      const now = performance.now();
      if (Math.abs(x - last.x) > 2 || Math.abs(y - last.y) > 2 || now - last.t > WHEEL_REPICK_MS) {
        const hit = pickAtClient(x, y);
        last.hit = hit !== null;
        if (hit) last.anchor.copy(hit.point);
        last.x = x;
        last.y = y;
      }
      last.t = now;
      cameraDirector.wheelZoom(scale, last.hit ? last.anchor : null);
    };
    return () => void (controls.onWheelZoom = null);
  }, [controls]);

  // Before RevealDriver (-90): the interior override it merges is current for this frame.
  useFrame(() => {
    if (!bindComponents(scene)) return;

    // A cinematic owns the camera: explore visuals clear and input pauses until it hands back.
    const cinematic = cameraDirector.authority === 'cinematic';
    const mode = exploreState().mode;
    if (cinematic && mode === 'explore') suspendForPresentation();
    else if (!cinematic && mode === 'presentation') resumeAfterPresentation(isHeroRevealOpen());

    const s = exploreState();
    const p = pointer.current;
    const cam = camera.matrixWorld;
    if (p.inside && !p.held && cam.equals(camLastFrame.current) && !cam.equals(camAtPick.current)) p.pending = true;
    camLastFrame.current.copy(cam);
    if (s.mode === 'explore' && p.pending) {
      p.pending = false;
      camAtPick.current.copy(cam);
      const hoveredId = p.inside ? (pickComponent(p.ndc, camera)?.selectableId ?? null) : null;
      setHovered(hoveredId);
      gl.domElement.style.cursor = hoveredId ? 'pointer' : '';
      placeHoverTag(p.clientX, p.clientY, hoveredId !== null && hoveredId !== s.selectedId);
    }

    updateExploreVisuals(animationClock.lastStep);

    const showLabel = s.mode === 'explore' && s.labels && s.selectedId !== null;
    if (showLabel) placePrimaryLabel(camera, size.width, size.height, anchorOf(s.selectedId!));
    else if (s.mode !== 'explore') hideLabels();
    else placePrimaryLabel(camera, size.width, size.height, null);
  }, -95);

  return null;
}
