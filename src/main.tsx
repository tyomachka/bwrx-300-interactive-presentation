import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { boot, BOOT_FALLBACK_EVENT } from './app/boot';
import { useAppStore } from './state/store';
import './ui/styles.css';

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

// The startup gate (index.html, app/boot.ts): the bundle is running.
boot.start();
const { caps } = useAppStore.getState();
if (!caps.webgl2) boot.fail('no-webgl2', caps.failureReason);

if (!boot.failed) {
  const app = createRoot(root);
  // The gate gave up on the 3D view (no first frame, renderer failure...): release the canvas.
  window.addEventListener(BOOT_FALLBACK_EVENT, () => app.unmount(), { once: true });
  app.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
