/**
 * Creates the Explore-mode OrbitControls and hands camera + controls to the director.
 *
 * three's own OrbitControls (r186) is used directly instead of drei's wrapper:
 * drei's copy runs its own update loop and keeps damping state where we cannot
 * reach it. The director needs to be the only thing that calls `controls.update()`.
 */
import { useThree } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import { MathUtils, PerspectiveCamera, Vector3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ORBIT } from '../config/camera';
import { useAppStore } from '../state/store';
import { cameraDirector } from './cameraDirector';

const _clamped = new Vector3();

export function CameraRig() {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const domElement = useThree((s) => s.gl.domElement);
  const set = useThree((s) => s.set);

  // Connected inside the effect (not the constructor) so StrictMode's dev-only
  // mount -> cleanup -> mount cycle reconnects the same instance cleanly.
  const controls = useMemo(() => new OrbitControls(camera), [camera]);

  useEffect(() => {
    controls.connect(domElement);
    Object.assign(controls, {
      enableDamping: true,
      dampingFactor: ORBIT.dampingFactor,
      rotateSpeed: ORBIT.rotateSpeed,
      zoomSpeed: ORBIT.zoomSpeed,
      panSpeed: ORBIT.panSpeed,
      screenSpacePanning: true,
      minDistance: ORBIT.minDistance,
      maxDistance: ORBIT.maxDistance,
      minPolarAngle: ORBIT.minPolarAngle,
      maxPolarAngle: ORBIT.maxPolarAngle,
    });

    // Limited pan: keep the orbit target in a box (deeper while section review is on).
    // Camera and target shift together, so the view never swings when the clamp engages.
    const clampTarget = () => {
      const { min, max } = useAppStore.getState().sectionReview ? ORBIT.panBoundsSection : ORBIT.panBounds;
      const t = controls.target;
      _clamped.set(
        MathUtils.clamp(t.x, min[0], max[0]),
        MathUtils.clamp(t.y, min[1], max[1]),
        MathUtils.clamp(t.z, min[2], max[2]),
      );
      if (_clamped.equals(t)) return;
      camera.position.add(_clamped).sub(t);
      t.copy(_clamped);
    };
    controls.addEventListener('change', clampTarget);

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
      domElement.removeEventListener('pointerdown', interrupt, { capture: true });
      domElement.removeEventListener('wheel', interrupt, { capture: true });
      controls.dispose();
    };
  }, [camera, controls, domElement, set]);

  return null;
}
