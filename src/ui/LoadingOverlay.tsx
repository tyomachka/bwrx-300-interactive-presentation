import { useLayoutEffect } from 'react';
import { boot } from '../app/boot';
import { useStrings } from '../i18n/strings';
import { useAppStore } from '../state/store';

/** Covers the canvas until the scene is ready, then fades out. That fade is the "ready" signal. */
export function LoadingOverlay() {
  const loading = useAppStore((s) => s.status === 'loading');
  const t = useStrings().loading;

  // It takes over from index.html's identical loading shell (the startup gate, app/boot.ts).
  useLayoutEffect(() => boot.hideShell(), []);

  return (
    <div className={`overlay loading${loading ? '' : ' is-hidden'}`} role="status" aria-live="polite">
      <div className="loading__mark" aria-hidden="true" />
      <p className="loading__text">{loading ? t.preparing : t.ready}</p>
    </div>
  );
}
