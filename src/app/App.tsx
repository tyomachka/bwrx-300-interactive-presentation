import { lazy, Suspense, useEffect } from 'react';
import { SceneCanvas } from '../scene/SceneCanvas';
import { useAppStore } from '../state/store';
import { LoadingOverlay } from '../ui/LoadingOverlay';
import { ExploreOverlay } from '../ui/ExploreOverlay';
import { ExplorePanel } from '../ui/ExplorePanel';
import { ExploreSheet } from '../ui/ExploreSheet';
import { SetupControls } from '../ui/SetupControls';
import { ContextLostOverlay, SceneCrashed, WebGLUnavailable } from '../ui/StatusScreens';
import { TalkOverlay } from '../presentation/ui/TalkOverlay';
import { boot } from './boot';
import { EXPLORE_ONLY } from './entry';
import { AppErrorBoundary, SafeLayer } from './ErrorBoundary';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';

const DiagnosticsOverlay = lazy(() => import('../debug/DiagnosticsOverlay'));
const TalkDebug = lazy(() => import('../presentation/ui/TalkDebug').then((m) => ({ default: m.TalkDebug })));

/** A failure before the scene was ever ready goes to the startup gate's fallback (app/boot.ts). */
const onSceneError = (error: Error) => {
  if (!boot.fail('scene-error', error.message)) useAppStore.getState().setStatus('error');
};

export function App() {
  const caps = useAppStore((s) => s.caps);
  const canvasKey = useAppStore((s) => s.canvasKey);
  const status = useAppStore((s) => s.status);
  const showDiagnostics = useAppStore((s) => s.debugAvailable && s.debugVisible);
  const showTalkDebug = useAppStore((s) => s.presentationDebug);

  useKeyboardShortcuts();

  // Machine-readable state for automation (e.g. a Stage 12 recorder waits for "ready").
  useEffect(() => {
    document.documentElement.dataset.sceneStatus = status;
    if (status === 'ready') boot.ready();
  }, [status]);

  // Review/capture hooks (`window.__bwrx`): dev builds and `?debug` only, loaded lazily.
  const debugAvailable = useAppStore((s) => s.debugAvailable);
  useEffect(() => {
    if (debugAvailable) void import('../debug/automation').then((m) => m.installAutomationApi());
  }, [debugAvailable]);

  if (!caps.webgl2) return <WebGLUnavailable reason={caps.failureReason} />;

  return (
    <div className={EXPLORE_ONLY ? 'app app--explore' : 'app'}>
      {/* The 16:9 presentation stage (config/render.ts STAGE_ASPECT): canvas and in-picture UI.
          Explore-only (app/entry.ts): the whole viewport, no talk, no film. */}
      <div className="stage">
        <AppErrorBoundary resetKey={canvasKey} onError={onSceneError} fallback={(error) => <SceneCrashed error={error} />}>
          <SceneCanvas />
        </AppErrorBoundary>
        <ExploreOverlay />
        {EXPLORE_ONLY ? (
          <ExploreSheet />
        ) : (
          <>
            <SafeLayer name="talk-overlay">
              <TalkOverlay />
            </SafeLayer>
            <ExplorePanel />
            <SetupControls />
          </>
        )}
      </div>
      <LoadingOverlay />
      <ContextLostOverlay />
      {showTalkDebug && (
        <SafeLayer name="talk-debug">
          <Suspense fallback={null}>
            <TalkDebug />
          </Suspense>
        </SafeLayer>
      )}
      {showDiagnostics && (
        <SafeLayer name="diagnostics-overlay">
          <Suspense fallback={null}>
            <DiagnosticsOverlay />
          </Suspense>
        </SafeLayer>
      )}
    </div>
  );
}
