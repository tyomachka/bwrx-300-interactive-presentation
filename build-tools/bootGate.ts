/**
 * Post-final startup gate (index.html, src/app/boot.ts): fills in the build-time parts of the plain
 * HTML fallback, so the fallback never depends on the app bundle (which is exactly what may not run):
 *
 *   <!--bwrx:qr-->     the QR code to the explore-only page as inline SVG: the same matrix the talk
 *                      shows (src/presentation/qrCode.ts), so the two can never disagree;
 *   <!--bwrx:url-->    the address it encodes, printed under it;
 *   <!--bwrx:video-->  the backup-video button, only where the package ships the video (the portable
 *                      build: BWRX300-fallback-lt.mp4 / -en.mp4 next to the page). The public site
 *                      does not carry the 2 x 21 MB videos; its fallback is the poster and the QR.
 */
import type { Plugin } from 'vite';
import { QR_CODE } from '../src/presentation/qrCode.ts';

export interface BootGateOptions {
  /** The backup videos sit next to the page. */
  backupVideo: boolean;
}

const QR_TAG = '<!--bwrx:qr-->';
const URL_TAG = '<!--bwrx:url-->';
const VIDEO_TAG = '<!--bwrx:video-->';

export function bootGate({ backupVideo }: BootGateOptions): Plugin {
  const n = QR_CODE.modules + 8; // a 4-module quiet zone on each side, as in the talk
  const qr =
    `<svg class="boot-fb__code" viewBox="-4 -4 ${n} ${n}" shape-rendering="crispEdges" role="img" aria-label="QR: ${QR_CODE.content}">` +
    `<rect x="-4" y="-4" width="${n}" height="${n}" fill="#f4f4f1"/><path d="${QR_CODE.path}" fill="#101215"/></svg>`;
  const video = backupVideo ? '<button type="button" id="boot-play" data-en="Play the video">Rodyti vaizdo įrašą</button>' : '';
  return {
    name: 'bwrx300-boot-gate',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        for (const tag of [QR_TAG, URL_TAG, VIDEO_TAG]) {
          if (!html.includes(tag)) throw new Error(`[boot-gate] ${tag} missing from index.html`);
        }
        return html.replace(QR_TAG, qr).replace(URL_TAG, QR_CODE.content).replace(VIDEO_TAG, video);
      },
    },
  };
}
