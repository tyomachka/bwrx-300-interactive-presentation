/**
 * Creates the Explore-mode OrbitControls and hands camera + controls to the director.
 *
 * three's own OrbitControls (r186) is used directly instead of drei's wrapper:
 * drei's copy runs its own update loop and keeps damping state where we cannot
 * reach it. The director needs to be the only thing that calls `controls.update()`.
 * The subclass only replaces the wheel step (cursor-centred zoom, ExploreOrbitControls.ts).
 */
import { useThree } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import { MOUSE, PerspectiveCamera, Vector3 } from 'three';
import { ORBIT } from '../config/camera';
import { cameraDirector } from './cameraDirector';
import { clampExploreTarget } from './exploreBounds';
import { ExploreOrbitControls } from './ExploreOrbitControls';

const _clamped = new Vector3();

export function CameraRig() {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const domElement = useThree((s) => s.gl.domElement);
  const set = useThree((s) => s.set);

  // Connected inside the effect (not the constructor) so StrictMode's dev-only
  // mount -> cleanup -> mount cycle reconnects the same instance cleanly.
  const controls = useMemo(() => new ExploreOrbitControls(camera), [camera]);

  useEffect(() => {
    controls.connect(domElement);
    Object.assign(controls, {
      enableDamping: true,
      dampingFactor: ORBIT.dampingFactor,
      rotateSpeed: ORBIT.rotateSpeed,
      zoomSpeed: ORBIT.zoomSpeed,
      wheelZoomSpeed: ORBIT.wheel.zoomSpeed,
      panSpeed: ORBIT.panSpeed,
      screenSpacePanning: true,
      minDistance: ORBIT.minDistance,
      maxDistance: ORBIT.maxDistance,
      minPolarAngle: ORBIT.minPolarAngle,
      maxPolarAngle: ORBIT.maxPolarAngle,
      // Left: orbit (Shift / Ctrl + left: pan, OrbitControls' own); middle and right: pan.
      mouseButtons: { LEFT: MOUSE.ROTATE, MIDDLE: MOUSE.PAN, RIGHT: MOUSE.PAN },
    });

    // Limited pan: keep the orbit target in the volume the current cut allows (exploreBounds.ts:
    // above grade when closed, down into the reactor when the plant is cut open). Camera and
    // target shift together, so the view never swings when the clamp engages.
    const clampTarget = () => {
      const t = controls.target;
      clampExploreTarget(t, _clamped);
      if (_clamped.equals(t)) return;
      camera.position.add(_clamped).sub(t);
      t.copy(_clamped);
    };
    controls.addEventListener('change', clampTarget);

    // A middle-button press would otherwise start the browser's autoscroll.
    const noAutoscroll = (e: MouseEvent) => {
      if (e.button === 1) e.preventDefault();
    };
    domElement.addEventListener('mousedown', noAutoscroll);

    // Grabbing the view (or scrolling) during a programmatic transition stops it.
    // Capture phase runs before OrbitControls' own listener on the same element.
    const interrupt = () => cameraDirector.interrupt();
    domElement.addEventListener('pointerdown', interrupt, { capture: true });
    domElement.addEventListener('wheel', interrupt, { capture: true, passive: true });

    cameraDirector.attach(camera, controls);
    set({ controls });

    return () => {
      set({ controls: null });
      cameraDirector.detach();
      controls.removeEventListener('change', clampTarget);
      domElement.removeEventListener('mousedown', noAutoscroll);
      domElement.removeEventListener('pointerdown', interrupt, { capture: true });
      domElement.removeEventListener('wheel', interrupt, { capture: true });
      controls.dispose();
    };
  }, [camera, controls, domElement, set]);

  return null;
}
