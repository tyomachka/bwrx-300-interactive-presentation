import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { bootGate } from './build-tools/bootGate.ts';

// `base: './'` keeps every asset URL relative so the built `dist/` works from any
// hosting sub-path or a USB-drive copy served by a local static server. Nothing is
// loaded from a CDN: three, React and fonts are all bundled (PROJECT.md §6, §20).
export default defineConfig({
  base: './',
  // The startup gate's fallback (index.html): the public site ships no backup video.
  plugins: [react(), bootGate({ backupVideo: false })],
  build: {
    target: 'es2022',
    sourcemap: true,
    chunkSizeWarningLimit: 1500,
  },
  server: { port: 5173, strictPort: false },
});
