import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { portableSingleFile } from './build-tools/portableSingleFile.ts';

/**
 * Stage 11 portable build (`npm run build:portable`): the same app as `vite.config.ts`, emitted as
 * one HTML file that opens from file:// with no server (build-tools/portableSingleFile.ts):
 *
 *   dist-portable/BWRX300/BWRX300.html, START-HERE.txt (Lithuanian), START-HERE-LT.txt,
 *   START-HERE-EN.txt and, if present, BWRX300-fallback-lt.mp4 / BWRX300-fallback-en.mp4
 *
 * The normal build (`npm run build`, dist/) is unchanged.
 */
export default defineConfig({
  // `import.meta.env.MODE === 'portable'`: the package opens in the Low preset (config/quality.ts).
  mode: 'portable',
  base: './',
  plugins: [
    react(),
    portableSingleFile({
      htmlName: 'BWRX300.html',
      extras: [
        ['portable/START-HERE-LT.txt', 'START-HERE.txt'],
        ['portable/START-HERE-LT.txt', 'START-HERE-LT.txt'],
        ['portable/START-HERE-EN.txt', 'START-HERE-EN.txt'],
        ['fallback/BWRX300-fallback-lt.mp4', 'BWRX300-fallback-lt.mp4'],
        ['fallback/BWRX300-fallback-en.mp4', 'BWRX300-fallback-en.mp4'],
      ],
    }),
  ],
  build: {
    target: 'es2022',
    outDir: 'dist-portable/BWRX300',
    emptyOutDir: true,
    sourcemap: false,
    cssCodeSplit: false,
    assetsInlineLimit: Number.MAX_SAFE_INTEGER,
    // No polyfill (one chunk, nothing to preload); keeping the option on lets Vite resolve its
    // preload helper in the inlined lazy imports.
    modulePreload: { polyfill: false },
    chunkSizeWarningLimit: 4000,
    // One JS chunk: the lazy imports (diagnostics, automation) are inlined, never fetched.
    rolldownOptions: { output: { codeSplitting: false } },
  },
});
