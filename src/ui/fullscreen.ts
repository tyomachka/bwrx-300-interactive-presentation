/** Browser full screen on an explicit click; a refusal (or a browser without it) changes nothing. */
export async function toggleFullscreen(): Promise<void> {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch {
    // Permission denied or unsupported: F11 remains available.
  }
}
