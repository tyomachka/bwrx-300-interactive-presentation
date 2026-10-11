import { useEffect, useRef, useState } from 'react';
import { cameraDirector } from '../camera/cameraDirector';
import { showReviewView } from '../camera/reviewViews';
import { REVIEW_VIEWS } from '../config/reviewViews';
import { useAppStore } from '../state/store';
import { diagnosticsSample as s } from './diagnostics';

const REFRESH_MS = 250;
const fmt = (v: number[]) => `[${v.map((n) => n.toFixed(2)).join(', ')}]`;

/**
 * Hidden performance panel: dev builds or `?debug`, toggled with the ` key.
 * It also prints the live camera pose. "Copy pose" gives the JSON for a new
 * entry in config/camera.ts, which is how Stage 6 camera states will be authored.
 */
export default function DiagnosticsOverlay() {
  const pre = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);
  const caps = useAppStore((st) => st.caps);
  const quality = useAppStore((st) => st.quality);
  const qualityReason = useAppStore((st) => st.qualityReason);
  const sectionReview = useAppStore((st) => st.sectionReview);

  useEffect(() => {
    const draw = () => {
      if (!pre.current) return;
      const pose = cameraDirector.getPose();
      pre.current.textContent = [
        `fps        ${s.fps.toFixed(1)}`,
        `frame ms   avg ${s.frameAvgMs.toFixed(2)}  worst ${s.frameWorstMs.toFixed(2)}`,
        `draw calls ${s.drawCalls}`,
        `triangles  ${s.triangles.toLocaleString('en-US')}`,
        `geo / tex  ${s.geometries} / ${s.textures}   programs ${s.programs}`,
        `buffer     ${s.bufferWidth}x${s.bufferHeight} @ dpr ${s.pixelRatio.toFixed(2)}`,
        `quality    ${quality} (${qualityReason})`,
        `gpu        ${caps.renderer}${caps.softwareRenderer ? '  [SOFTWARE]' : ''}`,
        `camera     ${cameraDirector.authority}`,
        `  pos      ${fmt(pose.position)}`,
        `  target   ${fmt(pose.target)}`,
        `  fov      ${pose.fov.toFixed(1)}`,
      ].join('\n');
    };
    draw();
    const id = window.setInterval(draw, REFRESH_MS);
    return () => window.clearInterval(id);
  }, [caps, quality, qualityReason]);

  const copyPose = () => {
    const pose = cameraDirector.getPose();
    const round = (v: number[]) => v.map((n) => Math.round(n * 100) / 100);
    const json = JSON.stringify({ position: round(pose.position), target: round(pose.target), fov: pose.fov });
    navigator.clipboard
      ?.writeText(json)
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1200);
      })
      .catch(() => console.info('[BWRX-300] camera pose:', json));
  };

  return (
    <div className="diagnostics" aria-hidden="true">
      <pre ref={pre} />
      <div className="diagnostics__row">
        <button type="button" onClick={copyPose}>
          {copied ? 'Copied' : 'Copy pose'}
        </button>
        <button type="button" aria-pressed={sectionReview} title="Shortcut: G" onClick={() => useAppStore.getState().setSectionReview(!sectionReview)}>
          Section review
        </button>
      </div>
      <div className="diagnostics__row" title="Shortcut: V cycles">
        {REVIEW_VIEWS.map((view) => (
          <button key={view.camera} type="button" onClick={() => void showReviewView(view)}>
            {view.label}
          </button>
        ))}
      </div>
    </div>
  );
}
