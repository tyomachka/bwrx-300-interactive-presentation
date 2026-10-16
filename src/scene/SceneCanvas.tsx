/**
 * The <Canvas> host: renderer configuration plus the small per-canvas services
 * (frame driver, DPR watcher, context-loss watcher, ready gate).
 *
 * The whole canvas is keyed by `canvasKey`. A quality change or a recovery from
 * a lost context remounts it with a fresh WebGL context. The camera director keeps
 * the pose across the remount.
 */
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import type { Object3D } from 'three';
import { animationClock } from '../animation/clock';
import { cameraDirector } from '../camera/cameraDirector';
import { CameraRig } from '../camera/CameraRig';
import { CAMERA_LENS, CAMERA_STATES, HOME_CAMERA_STATE } from '../config/camera';
import { canvasPixelRatio, resolveRenderScale, type QualityPreset } from '../config/quality';
import { RENDER, stageSize } from '../config/render';
import { SafeLayer } from '../app/ErrorBoundary';
import { useAppStore, useQualityPreset } from '../state/store';
import { LightingRig } from './LightingRig';
import { Plant } from './plant/Plant';
import { ExploreDriver } from '../interaction/ExploreDriver';
import { ReactorControl } from './control/ReactorControl';
import { PassiveSafety } from './safety/PassiveSafety';
import { FissionInset } from './fission/FissionInset';
import { TalkScene } from '../presentation/scene/TalkScene';
import { OperatingFlow } from './flow/OperatingFlow';
import { RevealDriver } from './section/RevealDriver';
import { revealOpaqueSort } from './section/drawOrder';
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
      dpr={initialPixelRatio(preset)}
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
        // Opened plant: draw nested reveal layers inside-out, front to back (no overdraw).
        gl.setOpaqueSort(revealOpaqueSort);
        // With an opaque canvas three defaults the clear alpha to 1, so render-target passes
        // that clear without a background (drei ContactShadows) came out solid black. The
        // opaque main framebuffer ignores clear alpha, so 0 is safe everywhere.
        gl.setClearAlpha(0);
      }}
    >
      <FrameDriver />
      <DprWatcher preset={preset} />
      <ContextLossWatcher />
      <CameraRig />
      <LightingRig />
      <RevealDriver />
      <Suspense fallback={null}>
        <StudioEnvironment />
        <Plant />
        <OperatingFlow />
        <ReactorControl />
        <PassiveSafety />
        <FissionInset />
        <TalkScene />
        <ExploreDriver />
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

/** Optional `?scale=` render scale (config/quality.ts), read once. */
const RENDER_SCALE = resolveRenderScale(window.location.search);

/** The pixel ratio for the canvas before it has measured itself (the 16:9 stage in this window). */
function initialPixelRatio(preset: QualityPreset): number {
  const { width, height } = stageSize(window.innerWidth, window.innerHeight);
  return canvasPixelRatio(preset, width, height, window.devicePixelRatio, RENDER_SCALE);
}

/**
 * Keeps the canvas pixel ratio right (config/quality.ts canvasPixelRatio): when the canvas is
 * resized (a projector, a window change) and when devicePixelRatio changes (dragging the window
 * from a 1.5x laptop panel to a 1x projector), which R3F does not watch by itself. The preset's
 * pixel budget caps the drawing buffer, so a 4K display never multiplies the cost; a 1920x1080
 * window keeps exactly 1:1.
 */
function DprWatcher({ preset }: { preset: QualityPreset }) {
  const setDpr = useThree((s) => s.setDpr);
  const size = useThree((s) => s.size);
  const [deviceRatio, setDeviceRatio] = useState(window.devicePixelRatio);

  useEffect(() => {
    let query: MediaQueryList | null = null;
    const onChange = () => {
      setDeviceRatio(window.devicePixelRatio);
      listen();
    };
    const listen = () => {
      query?.removeEventListener('change', onChange);
      query = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
      query.addEventListener('change', onChange);
    };
    listen();
    return () => query?.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    setDpr(canvasPixelRatio(preset, size.width, size.height, deviceRatio, RENDER_SCALE));
  }, [preset, size.width, size.height, deviceRatio, setDpr]);

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
 * After compiling, one warm-up frame is rendered (under the loading overlay) with that
 * content visible: it uploads its geometry and compiles the shadow-pass variants that
 * compileAsync does not cover.
 */
function ReadyGate() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  /** -1 while compiling, then counts presented frames. */
  const frames = useRef(-1);

  useEffect(() => {
    let cancelled = false;
    let compiling: Promise<unknown>;
    try {
      compiling = withHiddenContentVisible(scene, () => gl.compileAsync(scene, camera));
    } catch (error) {
      compiling = Promise.reject(error);
    }
    compiling
      .catch((error: unknown) => console.warn('[BWRX-300] Shader precompile failed; continuing.', error))
      .finally(() => {
        if (cancelled) return;
        try {
          withHiddenContentVisible(scene, () => gl.render(scene, camera));
        } catch (error) {
          console.warn('[BWRX-300] Warm-up render failed; continuing.', error);
        }
        // The warm-up drew hidden content into the shadow map: draw it again for real.
        gl.shadowMap.needsUpdate = true;
        frames.current = 0;
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

/** Run `action` with every hidden object made visible, then restore visibility. */
function withHiddenContentVisible<T>(scene: Object3D, action: () => T): T {
  const hidden: Object3D[] = [];
  scene.traverse((o) => {
    if (!o.visible) {
      hidden.push(o);
      o.visible = true;
    }
  });
  try {
    return action();
  } finally {
    hidden.forEach((o) => (o.visible = false));
  }
}
