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
import type { Object3D } from 'three';
import { animationClock } from '../animation/clock';
import { cameraDirector } from '../camera/cameraDirector';
import { CameraRig } from '../camera/CameraRig';
import { CAMERA_LENS, CAMERA_STATES, HOME_CAMERA_STATE } from '../config/camera';
import { RENDER } from '../config/render';
import { SafeLayer } from '../app/ErrorBoundary';
import { useAppStore, useQualityPreset } from '../state/store';
import { LightingRig } from './LightingRig';
import { Plant } from './plant/Plant';
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
      camera={{ fov: CAMERA_LENS.fov, near: CAMERA_LENS.near, far: CAMERA_LENS.far, position: CAMERA_STATES[HOME_CAMERA_STATE].position }}
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
        // With an opaque canvas three defaults the clear alpha to 1, so render-target passes
        // that clear without a background (drei ContactShadows) came out solid black. The
        // opaque main framebuffer ignores clear alpha, so 0 is safe everywhere.
        gl.setClearAlpha(0);
      }}
    >
      <FrameDriver />
      <DprWatcher maxPixelRatio={preset.maxPixelRatio} />
      <ContextLossWatcher />
      <CameraRig />
      <LightingRig />
      <Suspense fallback={null}>
        <StudioEnvironment />
        <Plant />
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

/** Automatic rebuilds allowed per window before falling back to the manual overlay. */
const AUTO_RECOVERY = { maxAttempts: 2, windowMs: 30_000 };
const recentLosses: number[] = [];

/**
 * Weak or overloaded GPUs can drop the WebGL context (driver reset, GPU process crash).
 *
 * The canvas is rebuilt immediately on loss: while a context is lost every WebGL call is a
 * silent no-op, so disposing the old scene is clean, and the new canvas gets a fresh context.
 * (Rebuilding only after `webglcontextrestored` would delete every old GPU object on the
 * restored context, one console warning each.) If losses repeat, stop retrying and show the
 * overlay with manual restart buttons; a later restore event then rebuilds.
 */
function ContextLossWatcher() {
  const canvas = useThree((s) => s.gl.domElement);

  useEffect(() => {
    const { setStatus, remountCanvas } = useAppStore.getState();
    const onLost = (event: Event) => {
      event.preventDefault(); // allow the browser to restore this context if we keep it
      const now = performance.now();
      while (recentLosses.length && now - recentLosses[0]! > AUTO_RECOVERY.windowMs) recentLosses.shift();
      recentLosses.push(now);
      if (recentLosses.length <= AUTO_RECOVERY.maxAttempts) {
        console.warn('[BWRX-300] WebGL context lost; rebuilding the scene.');
        remountCanvas();
      } else {
        console.warn('[BWRX-300] WebGL context lost repeatedly; waiting for the browser or a manual restart.');
        setStatus('context-lost');
      }
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
 *
 * Hidden content (interior, section-only parts) is compiled too: three only compiles
 * visible objects, and a reveal during the live talk must never stall on a shader.
 * compileAsync collects materials synchronously, so visibility is restored right away.
 */
function ReadyGate() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  /** -1 while compiling, then counts presented frames. */
  const frames = useRef(-1);

  useEffect(() => {
    let cancelled = false;
    const hidden: Object3D[] = [];
    scene.traverse((o) => {
      if (!o.visible) {
        hidden.push(o);
        o.visible = true;
      }
    });
    let compiling: Promise<unknown>;
    try {
      compiling = gl.compileAsync(scene, camera);
    } finally {
      hidden.forEach((o) => (o.visible = false));
    }
    compiling
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
