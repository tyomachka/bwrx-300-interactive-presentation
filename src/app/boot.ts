/**
 * Post-final compatibility: the app's side of the startup gate in index.html.
 *
 * The gate is a small ES5 script that runs before (and without) this bundle. The page shows a plain
 * HTML loading shell at once and switches to a plain HTML fallback (a poster, the QR code to the
 * explore page, the backup video where the package ships it, "open it on a phone or in Chrome /
 * Edge") whenever the 3D view cannot come up:
 *
 *   no ES modules · the bundle fails to load or evaluate · no start within 60 s of the page · no
 *   WebGL 2 · no WebGL renderer within 12 s of the start · no first frame within 45 s of the renderer
 *   (building the model is CPU work: 1.3-5.9 s on the review laptop, more on a busy one, all under
 *   the loading spinner) · not ready within 60 s of the first frame · the renderer or the scene
 *   fails before ready · a blank first ready frame · repeated context loss before ready ·
 *   `?forceFallback=1` (testing).
 *
 * After `ready` the gate stands down: a later failure is the presenter's business, handled by the
 * app's own status screens (restart buttons, ui/StatusScreens.tsx). `?bootWait=long` (the
 * fallback's "try again") gives a slow device five times longer.
 */

type BootState = 'loading' | 'started' | 'renderer' | 'framed' | 'ready' | 'failed';

interface BootGate {
  state: BootState;
  /** Milliseconds since navigation start at which each step happened. */
  at: Partial<Record<'start' | 'renderer' | 'frame' | 'ready' | 'failed', number>>;
  start(): void;
  renderer(): void;
  frame(): void;
  ready(): void;
  /** Shows the fallback and returns true, or returns false once the scene was ready. */
  fail(reason: string, detail?: string): boolean;
  hideShell(): void;
}

declare global {
  interface Window {
    __bwrxBoot?: BootGate;
  }
}

/** The event the gate dispatches when it shows the fallback: the app unmounts its canvas. */
export const BOOT_FALLBACK_EVENT = 'bwrx:fallback';

const gate = (): BootGate | undefined => window.__bwrxBoot;

export const boot = {
  /** The bundle runs: the renderer watchdog starts. */
  start: () => gate()?.start(),
  /** The WebGL renderer exists: the first-frame watchdog starts. */
  renderer: () => gate()?.renderer(),
  /** A frame was rendered: the ready watchdog starts. */
  frame: () => gate()?.frame(),
  ready: () => gate()?.ready(),
  fail: (reason: string, detail?: string): boolean => gate()?.fail(reason, detail) ?? false,
  hideShell: () => gate()?.hideShell(),
  get failed(): boolean {
    return gate()?.state === 'failed';
  },
  get isReady(): boolean {
    return gate()?.state === 'ready';
  },
};
