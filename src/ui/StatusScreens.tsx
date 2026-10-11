/**
 * Full-screen messages for the three failure paths: no WebGL 2, a crashed scene and a
 * lost GPU context. Written for whoever is at the lectern: say what happened and give
 * one obvious next action, including the pre-rendered fallback video.
 */
import { useAppStore } from '../state/store';

const FALLBACK_VIDEO = 'fallback/bwrx300-cinematic-1080p.mp4';

function FallbackHint() {
  return (
    <p className="status__hint">
      Backup: play <code>{FALLBACK_VIDEO}</code> from the presentation USB drive.
    </p>
  );
}

export function WebGLUnavailable({ reason }: { reason?: string }) {
  return (
    <div className="overlay status" role="alert">
      <h1>3D view unavailable on this computer</h1>
      <p>{reason ?? 'WebGL 2 could not be started.'}</p>
      <p>Try the latest Chrome or Edge with hardware acceleration enabled.</p>
      <FallbackHint />
    </div>
  );
}

export function SceneCrashed({ error }: { error: Error }) {
  const quality = useAppStore((s) => s.quality);
  const { remountCanvas, setQuality } = useAppStore.getState();

  return (
    <div className="overlay status" role="alert">
      <h1>The 3D scene stopped</h1>
      <p className="status__detail">{error.message}</p>
      <div className="status__actions">
        <button type="button" onClick={remountCanvas}>
          Restart 3D
        </button>
        {quality !== 'low' && (
          <button type="button" onClick={() => setQuality('low')}>
            Restart in low quality
          </button>
        )}
        <button type="button" onClick={() => window.location.reload()}>
          Reload page
        </button>
      </div>
      <FallbackHint />
    </div>
  );
}

export function ContextLostOverlay() {
  const lost = useAppStore((s) => s.status === 'context-lost');
  if (!lost) return null;

  return (
    <div className="overlay status" role="alert">
      <h1>Graphics reset</h1>
      <p>The graphics driver interrupted the 3D view. It should come back by itself in a moment.</p>
      <div className="status__actions">
        <button type="button" onClick={useAppStore.getState().remountCanvas}>
          Restart 3D now
        </button>
        <button type="button" onClick={() => useAppStore.getState().setQuality('low')}>
          Restart in low quality
        </button>
      </div>
      <FallbackHint />
    </div>
  );
}
