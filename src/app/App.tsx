import { lazy, Suspense, useEffect } from 'react';
import { SceneCanvas } from '../scene/SceneCanvas';
import { useAppStore } from '../state/store';
import { LoadingOverlay } from '../ui/LoadingOverlay';
import { SetupControls } from '../ui/SetupControls';
import { ContextLostOverlay, SceneCrashed, WebGLUnavailable } from '../ui/StatusScreens';
import { AppErrorBoundary, SafeLayer } from './ErrorBoundary';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';

const DiagnosticsOverlay = lazy(() => import('../debug/DiagnosticsOverlay'));

export function App() {
  const caps = useAppStore((s) => s.caps);
  const canvasKey = useAppStore((s) => s.canvasKey);
  const status = useAppStore((s) => s.status);
  const showDiagnostics = useAppStore((s) => s.debugAvailable && s.debugVisible);

  useKeyboardShortcuts();

  // Machine-readable state for automation (e.g. a Stage 12 recorder waits for "ready").
  useEffect(() => {
    document.documentElement.dataset.sceneStatus = status;
  }, [status]);

  if (!caps.webgl2) return <WebGLUnavailable reason={caps.failureReason} />;

  return (
    <div className="app">
      <AppErrorBoundary
        resetKey={canvasKey}
        onError={() => useAppStore.getState().setStatus('error')}
        fallback={(error) => <SceneCrashed error={error} />}
      >
        <SceneCanvas />
      </AppErrorBoundary>
      <LoadingOverlay />
      <ContextLostOverlay />
      <SetupControls />
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
