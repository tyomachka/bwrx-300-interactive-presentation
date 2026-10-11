import { useAppStore } from '../state/store';

/** Covers the canvas until the scene is ready, then fades out. That fade is the "ready" signal. */
export function LoadingOverlay() {
  const loading = useAppStore((s) => s.status === 'loading');

  return (
    <div className={`overlay loading${loading ? '' : ' is-hidden'}`} role="status" aria-live="polite">
      <div className="loading__mark" aria-hidden="true" />
      <p className="loading__text">{loading ? 'Preparing 3D scene' : 'Ready'}</p>
    </div>
  );
}
