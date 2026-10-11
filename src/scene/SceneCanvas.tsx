/**
 * The <Canvas> host: renderer configuration plus the small per-canvas services
 * (frame driver, DPR watcher, context-loss watcher, ready gate).
 *
 * The whole canvas is keyed by `canvasKey`. A quality change or a recovery from
 * a lost context remounts it with a fresh WebGL context. The camera director keeps
 * the pose across the remount.
 */
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { lazy, Suspense, useEffect, useRef } from 'react';
import { animationClock } from '../animation/clock';
import { cameraDirector } from '../camera/cameraDirector';
import { CameraRig } from '../camera/CameraRig';
import { CAMERA_LENS, CAMERA_STATES } from '../config/camera';
import { RENDER } from '../config/render';
import { SafeLayer } from '../app/ErrorBoundary';
import { useAppStore, useQualityPreset } from '../state/store';
import { LightingRig } from './LightingRig';
import { PlaceholderComposition } from './PlaceholderComposition';
import { StudioEnvironment } from './StudioEnvironment';

// Diagnostics are never part of the main bundle; loaded only for dev builds or `?debug`.
const FrameProbe = lazy(() => import('../debug/FrameProbe'));

export function SceneCanvas() {
  const preset = useQualityPreset();
  const canvasKey = useAppStore((s) => s.canvasKey);
  const debugAvailable = useAppStore((s) => s.debugAvailable);

  return (
    <Canvas
      key={canvasKey}
      className="scene-canvas"
      dpr={[1, preset.maxPixelRatio]}
      // 'percentage' = PCFShadowMap. R3F's default (PCFSoft) was removed in three r186.
      shadows={preset.shadows ? 'percentage' : false}
      camera={{ fov: CAMERA_LENS.fov, near: CAMERA_LENS.near, far: CAMERA_LENS.far, position: CAMERA_STATES.home.position }}
      gl={{
        antialias: preset.antialias,
        alpha: false,
        stencil: RENDER.stencil,
        powerPreference: RENDER.powerPreference,
        toneMapping: RENDER.toneMapping,
        toneMappingExposure: RENDER.toneMappingExposure,
        outputColorSpace: RENDER.outputColorSpace,
        localClippingEnabled: RENDER.localClippingEnabled,
      }}
      frameloop="always"
      onCreated={({ gl }) => {
        gl.debug.checkShaderErrors = RENDER.checkShaderErrors;
      }}
    >
      <FrameDriver />
      <DprWatcher maxPixelRatio={preset.maxPixelRatio} />
      <ContextLossWatcher />
      <CameraRig />
      <LightingRig />
      <Suspense fallback={null}>
        <StudioEnvironment />
        <PlaceholderComposition />
        <ReadyGate />
      </Suspense>
      {debugAvailable && (
        <SafeLayer name="frame-probe">
          <Suspense fallback={null}>
            <FrameProbe />
          </Suspense>
        </SafeLayer>
      )}
    </Canvas>
  );
}

/**
 * The first thing that runs every frame: advance the animation clock (which ticks
 * GSAP), then let the camera director apply whichever authority owns the camera.
 */
function FrameDriver() {
  useFrame((_, delta) => {
    animationClock.advance(delta);
    cameraDirector.update();
  }, -100);
  return null;
}

/**
 * R3F samples devicePixelRatio only when the canvas is configured. Dragging the
 * window from a laptop panel (e.g. 1.5x) to a projector (1x) changes it, so re-apply.
 */
function DprWatcher({ maxPixelRatio }: { maxPixelRatio: number }) {
  const setDpr = useThree((s) => s.setDpr);

  useEffect(() => {
    let query: MediaQueryList | null = null;
    const onChange = () => {
      setDpr([1, maxPixelRatio]);
      listen();
    };
    const listen = () => {
      query?.removeEventListener('change', onChange);
      query = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
      query.addEventListener('change', onChange);
    };
    listen();
    return () => query?.removeEventListener('change', onChange);
  }, [maxPixelRatio, setDpr]);

  return null;
}

/**
 * Weak or overloaded GPUs can drop the WebGL context (driver reset, GPU process crash).
 * Show an overlay, then rebuild the canvas when the browser restores the context.
 */
function ContextLossWatcher() {
  const canvas = useThree((s) => s.gl.domElement);

  useEffect(() => {
    const { setStatus, remountCanvas } = useAppStore.getState();
    const onLost = (event: Event) => {
      event.preventDefault(); // tells the browser we intend to restore
      console.warn('[BWRX-300] WebGL context lost.');
      setStatus('context-lost');
    };
    const onRestored = () => {
      console.info('[BWRX-300] WebGL context restored; rebuilding the scene.');
      remountCanvas();
    };
    canvas.addEventListener('webglcontextlost', onLost);
    canvas.addEventListener('webglcontextrestored', onRestored);
    return () => {
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('webglcontextrestored', onRestored);
    };
  }, [canvas]);

  return null;
}

/**
 * Declares the scene "ready" only after every shader is compiled and a few frames have
 * actually been presented, so the presenter never starts on a half-built frame.
 */
function ReadyGate() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  /** -1 while compiling, then counts presented frames. */
  const frames = useRef(-1);

  useEffect(() => {
    let cancelled = false;
    gl.compileAsync(scene, camera)
      .catch((error: unknown) => console.warn('[BWRX-300] Shader precompile failed; continuing.', error))
      .finally(() => {
        if (!cancelled) frames.current = 0;
      });
    return () => {
      cancelled = true;
    };
  }, [gl, scene, camera]);

  useFrame(() => {
    if (frames.current < 0 || frames.current > 3) return;
    frames.current += 1;
    if (frames.current === 3) useAppStore.getState().setStatus('ready');
  });

  return null;
}
