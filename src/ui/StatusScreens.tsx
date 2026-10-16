/**
 * Full-screen messages for the three failure paths: no WebGL 2, a crashed scene and a
 * lost GPU context. Written for whoever is at the lectern: say what happened in plain words and
 * give one obvious next action, including the pre-rendered backup video, which plays here in the
 * page (it sits next to the HTML file; see config/delivery.ts). Technical details stay folded.
 *
 * Stage 11 localization: the words and the backup video follow the current language, and each
 * screen carries the LT | EN switch (the setup bar is not there to offer it).
 */
import { useState } from 'react';
import { FALLBACK_VIDEO_FILES } from '../config/delivery';
import { useLanguageStore } from '../i18n/language';
import { useStrings } from '../i18n/strings';
import { useAppStore } from '../state/store';
import { LanguageToggle } from './LanguageToggle';

/** The backup video in the current language. */
const useFallbackFile = () => FALLBACK_VIDEO_FILES[useLanguageStore((s) => s.language)];

/** The backup video, full window, muted (it has no sound), with the browser's own controls. */
function FallbackPlayer({ onClose }: { onClose: () => void }) {
  const t = useStrings().status;
  const file = useFallbackFile();
  const [missing, setMissing] = useState(false);
  return (
    <div className="fallback" role="dialog" aria-label={t.backupDialog}>
      {missing ? (
        <div className="fallback__missing">
          <p>{t.missingVideo}</p>
          <p>
            {t.openVideo[0]} <code>{file}</code> {t.openVideo[1]}
          </p>
        </div>
      ) : (
        <video className="fallback__video" src={file} controls autoPlay muted playsInline onError={() => setMissing(true)} />
      )}
      <button type="button" className="fallback__close" onClick={onClose}>
        {t.closeVideo}
      </button>
    </div>
  );
}

/** The backup offer on every failure screen. */
function FallbackOffer() {
  const t = useStrings().status;
  const file = useFallbackFile();
  const [playing, setPlaying] = useState(false);
  return (
    <>
      <div className="status__actions">
        <button type="button" onClick={() => setPlaying(true)}>
          {t.playBackup}
        </button>
      </div>
      <p className="status__hint">
        {t.backupHint} <code>{file}</code>
      </p>
      <LanguageToggle className="status__lang" />
      {playing && <FallbackPlayer onClose={() => setPlaying(false)} />}
    </>
  );
}

export function WebGLUnavailable({ reason }: { reason?: string }) {
  const t = useStrings().status;
  return (
    <div className="overlay status" role="alert">
      <h1>{t.webglTitle}</h1>
      <p>{t.webglText}</p>
      <FallbackOffer />
      {reason && <TechnicalDetails text={reason} />}
    </div>
  );
}

export function SceneCrashed({ error }: { error: Error }) {
  const t = useStrings().status;
  const quality = useAppStore((s) => s.quality);
  const { remountCanvas, setQuality } = useAppStore.getState();

  return (
    <div className="overlay status" role="alert">
      <h1>{t.crashTitle}</h1>
      <p>{t.crashText}</p>
      <div className="status__actions">
        <button type="button" onClick={remountCanvas}>
          {t.restart3d}
        </button>
        {quality !== 'low' && (
          <button type="button" onClick={() => setQuality('low')}>
            {t.restartLow}
          </button>
        )}
        <button type="button" onClick={() => window.location.reload()}>
          {t.reload}
        </button>
      </div>
      <FallbackOffer />
      <TechnicalDetails text={error.message} />
    </div>
  );
}

export function ContextLostOverlay() {
  const t = useStrings().status;
  const lost = useAppStore((s) => s.status === 'context-lost');
  if (!lost) return null;

  return (
    <div className="overlay status" role="alert">
      <h1>{t.lostTitle}</h1>
      <p>{t.lostText}</p>
      <div className="status__actions">
        <button type="button" onClick={useAppStore.getState().remountCanvas}>
          {t.restart3dNow}
        </button>
        <button type="button" onClick={() => useAppStore.getState().setQuality('low')}>
          {t.restartLow}
        </button>
      </div>
      <FallbackOffer />
    </div>
  );
}

/** For whoever fixes it later: folded, so the audience never sees an error wall. */
function TechnicalDetails({ text }: { text: string }) {
  const t = useStrings().status;
  return (
    <details className="status__details">
      <summary>{t.technicalDetails}</summary>
      <p className="status__detail">{text}</p>
    </details>
  );
}
