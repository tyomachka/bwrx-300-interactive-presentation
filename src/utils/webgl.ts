/**
 * WebGL 2 capability probe. Runs once, before React mounts the canvas, on a throwaway
 * canvas so a failure can never leave a half-initialised renderer behind.
 */

export interface GpuCapabilities {
  webgl2: boolean;
  /** Unmasked GPU string when the browser exposes it, otherwise the masked one. */
  renderer: string;
  vendor: string;
  maxTextureSize: number;
  maxSamples: number;
  /**
   * True for CPU rasterisers (SwiftShader, llvmpipe, Microsoft Basic Render Driver).
   * They pass the WebGL 2 check but cannot hold a usable frame rate at full quality.
   */
  softwareRenderer: boolean;
  /** Why WebGL 2 is unavailable, in plain words, when `webgl2` is false. */
  failureReason?: string;
}

const SOFTWARE_RENDERER_PATTERN = /swiftshader|llvmpipe|softpipe|basic render driver|software/i;

export function detectGpuCapabilities(): GpuCapabilities {
  const unavailable = (failureReason: string): GpuCapabilities => ({
    webgl2: false,
    renderer: 'unavailable',
    vendor: 'unavailable',
    maxTextureSize: 0,
    maxSamples: 0,
    softwareRenderer: false,
    failureReason,
  });

  if (typeof document === 'undefined') return unavailable('No browser document available.');
  if (typeof WebGL2RenderingContext === 'undefined') {
    return unavailable('This browser does not support WebGL 2.');
  }

  let gl: WebGL2RenderingContext | null;
  try {
    gl = document.createElement('canvas').getContext('webgl2');
  } catch {
    gl = null;
  }
  if (!gl) {
    return unavailable(
      'The browser supports WebGL 2, but it could not be started. Hardware acceleration may be turned off or the graphics driver may be blocked.',
    );
  }

  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  const renderer = String(
    debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
  );
  const vendor = String(
    debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR),
  );
  const caps: GpuCapabilities = {
    webgl2: true,
    renderer,
    vendor,
    maxTextureSize: Number(gl.getParameter(gl.MAX_TEXTURE_SIZE)),
    maxSamples: Number(gl.getParameter(gl.MAX_SAMPLES)),
    softwareRenderer: SOFTWARE_RENDERER_PATTERN.test(renderer),
  };

  // Release the probe context immediately; browsers cap the number of live contexts.
  gl.getExtension('WEBGL_lose_context')?.loseContext();
  return caps;
}
