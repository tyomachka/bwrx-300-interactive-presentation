/**
 * The in-canvas half of Explore mode (Stage 5): pointer input, picking, the presentation
 * hand-over, explore visuals and label placement. Renders nothing.
 *
 * Cost when idle: no raycast (picking runs only after the pointer moved, at most once a frame,
 * and on clicks), no React update (hover writes the store only when the hovered component
 * changes), visuals settled (one comparison), label placement only while a label is shown.
 */
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { Matrix4, Vector2 } from 'three';
import { animationClock } from '../animation/clock';
import { isHeroRevealOpen } from '../animation/heroReveal';
import { cameraDirector } from '../camera/cameraDirector';
import { resumeAfterPresentation, select, setHovered, suspendForPresentation } from './exploreActions';
import { exploreState } from './exploreStore';
import { anchorOf, bindComponents, updateExploreVisuals } from './exploreVisuals';
import { hideLabels, placeHoverTag, placePrimaryLabel } from './labelLayer';
import { pickComponent, setPickingView } from './picking';

/** A press that moves less than this (px) and ends within this time (ms) is a click, not an orbit. */
const CLICK_SLOP = 5;
const CLICK_MS = 600;

export function ExploreDriver() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const pointer = useRef({ ndc: new Vector2(), clientX: 0, clientY: 0, pending: false, inside: false, held: false, down: null as { x: number; y: number; t: number } | null });
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
    const onDown = (e: PointerEvent) => {
      if (e.button === 0) p.down = { x: e.clientX, y: e.clientY, t: performance.now() };
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
      if (e.button !== 0 || !d || exploreState().mode !== 'explore') return;
      if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > CLICK_SLOP || performance.now() - d.t > CLICK_MS) return;
      const hit = pickComponent(p.ndc, camera);
      select(hit?.selectableId ?? null);
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
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.style.cursor = '';
      setPickingView(null, null);
    };
  }, [gl, camera]);

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
