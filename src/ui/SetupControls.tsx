/**
 * The minimal visible setup control required for Level B (PROJECT.md §6): quality and
 * view reset. It is not the Stage 5 Explore panel. It fades out after a few seconds
 * without mouse movement so it never sits in the projected image.
 */
import { useEffect, useRef, useState } from 'react';
import { useMasterStore } from '../animation/masterSequence';
import { resetPresentation } from '../animation/presentation';
import { QUALITY_PRESETS, type QualityLevel } from '../config/quality';
import { useAppStore } from '../state/store';

const IDLE_HIDE_MS = 2500;
const LEVELS = Object.keys(QUALITY_PRESETS) as QualityLevel[];

export function SetupControls() {
  const quality = useAppStore((s) => s.quality);
  const ready = useAppStore((s) => s.status === 'ready');
  // Nothing in the projected image while the master sequence plays (and no accidental quality
  // switch, which would rebuild the canvas mid-sequence).
  const presenting = useMasterStore((s) => s.status === 'playing');
  const [awake, setAwake] = useState(false);
  const hovered = useRef(false);

  useEffect(() => {
    let timer = 0;
    const wake = () => {
      setAwake(true);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (!hovered.current) setAwake(false);
      }, IDLE_HIDE_MS);
    };
    window.addEventListener('pointermove', wake, { passive: true });
    window.addEventListener('pointerdown', wake, { passive: true });
    return () => {
      window.removeEventListener('pointermove', wake);
      window.removeEventListener('pointerdown', wake);
      window.clearTimeout(timer);
    };
  }, []);

  const visible = ready && awake && !presenting;

  return (
    <div
      className={`setup${visible ? '' : ' is-hidden'}`}
      onPointerEnter={() => (hovered.current = true)}
      onPointerLeave={() => (hovered.current = false)}
    >
      <div className="setup__group" role="group" aria-label="Rendering quality">
        <span className="setup__label">Quality</span>
        {LEVELS.map((level, i) => (
          <button
            key={level}
            type="button"
            aria-pressed={quality === level}
            title={`Shortcut: ${i + 1}`}
            onClick={() => useAppStore.getState().setQuality(level)}
          >
            {QUALITY_PRESETS[level].label}
          </button>
        ))}
      </div>
      <button type="button" title="Shortcut: R" onClick={() => void resetPresentation()}>
        Reset view
      </button>
    </div>
  );
}
