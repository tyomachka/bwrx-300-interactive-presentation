import { Component, type ErrorInfo, type ReactNode } from 'react';

interface AppErrorBoundaryProps {
  children: ReactNode;
  /** Changing this value clears a caught error (used together with a canvas remount). */
  resetKey: unknown;
  onError?: (error: Error) => void;
  fallback: (error: Error) => ReactNode;
}

interface AppErrorBoundaryState {
  error: Error | null;
}

/**
 * Catches anything thrown while rendering the 3D scene. R3F re-throws errors from
 * inside <Canvas> into the surrounding React tree, so this boundary sees them too.
 */
export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: unknown): AppErrorBoundaryState {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[BWRX-300] 3D scene crashed:', error, info.componentStack);
    this.props.onError?.(error);
  }

  componentDidUpdate(prev: AppErrorBoundaryProps): void {
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  render(): ReactNode {
    return this.state.error ? this.props.fallback(this.state.error) : this.props.children;
  }
}

interface SafeLayerProps {
  /** Shown in the console warning so a failed optional layer is easy to identify. */
  name: string;
  children: ReactNode;
}

/**
 * Boundary for optional visuals (environment lighting, flow effects, labels...).
 * If one fails, it disappears and the rest of the scene keeps running (PROJECT.md §20).
 * Works inside <Canvas> as well as in the DOM.
 */
export class SafeLayer extends Component<SafeLayerProps, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  componentDidCatch(error: Error): void {
    console.warn(`[BWRX-300] Optional layer "${this.props.name}" disabled after an error:`, error);
  }

  render(): ReactNode {
    return this.state.failed ? null : this.props.children;
  }
}
