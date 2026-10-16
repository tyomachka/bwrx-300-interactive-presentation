/**
 * The minimal visible setup control required for Level B (PROJECT.md §6): start the presentation,
 * quality, view reset, full screen and (Stage 11) the LT | EN language. It is not the Stage 5 Explore panel. It fades out after a
 * few seconds without mouse movement, and stays hidden while the presentation plays, so it never
 * sits in the projected image.
 *
 * Full screen is a convenience: it needs a click (a browser rule), a refusal is ignored, and F11
 * does the same in every browser.
 */
import { useEffect, useRef, useState } from 'react';
import { useMasterStore } from '../animation/masterSequence';
import { resetPresentation, startOrTogglePresentation } from '../animation/presentation';
import { talk, useTalkStore } from '../presentation/talk';
import { QUALITY_PRESETS, type QualityLevel } from '../config/quality';
import { useStrings } from '../i18n/strings';
import { useAppStore } from '../state/store';
import { LanguageToggle } from './LanguageToggle';

const IDLE_HIDE_MS = 2500;
const LEVELS = Object.keys(QUALITY_PRESETS) as QualityLevel[];

export function SetupControls() {
  const quality = useAppStore((s) => s.quality);
  const t = useStrings();
  const ready = useAppStore((s) => s.status === 'ready');
  // Nothing in the projected image while the master sequence plays (and no accidental quality
  // switch, which would rebuild the canvas mid-sequence).
  const masterStatus = useMasterStore((s) => s.status);
  // Nothing in the projected image while the talk runs either (it has no on-screen controls).
  const talkActive = useTalkStore((s) => s.active);
  const talkStarted = useTalkStore((s) => s.started);
  const presenting = masterStatus === 'playing' || talkActive;
  const [awake, setAwake] = useState(false);
  const hovered = useRef(false);
  const bar = useRef<HTMLDivElement>(null);
  const [fullscreen, setFullscreen] = useState(() => document.fullscreenElement !== null);
  const canFullscreen = document.fullscreenEnabled === true && typeof document.documentElement.requestFullscreen === 'function';

  // On a wide stage the Explore bar shares the bottom edge with this one: styles.css wraps it
  // before it gets here (`--setup-width`), whatever the language and the open sliders.
  useEffect(() => {
    const el = bar.current;
    const stage = el?.parentElement;
    if (!el || !stage) return;
    const observer = new ResizeObserver(() => stage.style.setProperty('--setup-width', `${el.offsetWidth}px`));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement !== null);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

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
      ref={bar}
      className={`setup${visible ? '' : ' is-hidden'}`}
      onPointerEnter={() => (hovered.current = true)}
      onPointerLeave={() => (hovered.current = false)}
    >
      <button type="button" className="setup__start" title={t.setup.startTitle} onClick={() => talk.start()}>
        {talkStarted ? t.setup.resumeTalk : t.setup.start}
      </button>
      <button type="button" title={t.setup.cinematicTitle} onClick={() => startOrTogglePresentation()}>
        {masterStatus === 'paused' ? t.setup.resume : t.setup.cinematic}
      </button>
      <div className="setup__group" role="group" aria-label={t.setup.qualityGroup}>
        <span className="setup__label">{t.setup.quality}</span>
        {LEVELS.map((level, i) => (
          <button
            key={level}
            type="button"
            aria-pressed={quality === level}
            title={t.shortcut(String(i + 1))}
            onClick={() => useAppStore.getState().setQuality(level)}
          >
            {t.setup.levels[level]}
          </button>
        ))}
      </div>
      <button type="button" title={t.shortcut('R')} onClick={() => void resetPresentation()}>
        {t.setup.resetView}
      </button>
      {canFullscreen && (
        <button type="button" title={t.setup.fullScreenTitle} onClick={() => void toggleFullscreen()}>
          {fullscreen ? t.setup.exitFullScreen : t.setup.fullScreen}
        </button>
      )}
      <LanguageToggle />
    </div>
  );
}

/** Browser full screen on an explicit click; a refusal (or a browser without it) changes nothing. */
async function toggleFullscreen(): Promise<void> {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch {
    // Permission denied or unsupported: F11 remains available.
  }
}
