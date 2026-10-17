/**
 * Design study blocks (`?study=` only): the pieces the study compositions add to the overlay. The
 * wrapper (position, cue fade, entrance) is TalkOverlay's; study.css styles each per direction.
 *
 *   scrim     a soft gradient behind editorial type (legibility without a UI card)
 *   timeline  0-36 months, the 24-36 band; its fill follows a cue (--p, overlayLayer.progress)
 *   credits   presenters: light placeholder, name, e-mail (no full-height figures)
 *   qr        a real, scannable size-test code (qrSample.ts) with its label
 */
import { useLayoutEffect, useRef, type CSSProperties } from 'react';
import { isPlaceholder, PRESENTERS } from '../config';
import type { TalkCopy } from '../copy';
import { overlayLayer } from '../overlayLayer';
import type { OverlayItem } from '../types';
import { QR_SAMPLE } from './qrSample';

type StudyItem = Extract<OverlayItem, { kind: 'study' }>;

const MONTHS = [0, 12, 24, 36] as const;

function Timeline({ id, progress }: { id: string; progress?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!progress || !ref.current) return;
    overlayLayer.progress.set(id, { el: ref.current, cue: progress, shown: '' });
    return () => void overlayLayer.progress.delete(id);
  }, [id, progress]);
  return (
    <div ref={ref} className="study-tl" style={progress ? undefined : ({ '--p': 1 } as CSSProperties)}>
      <div className="study-tl__track">
        <div className="study-tl__fill" />
        <div className="study-tl__band" />
      </div>
      <div className="study-tl__ticks">
        {MONTHS.map((m) => (
          <span key={m} className={`study-tl__tick${m >= 24 ? ' is-band' : ''}`} style={{ left: `${(m / 36) * 100}%` }}>
            {m}
          </span>
        ))}
      </div>
    </div>
  );
}

function Avatar() {
  // A placeholder until the photo-based illustrations exist: head and shoulders, no likeness.
  return (
    <svg className="study-credit__avatar" viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="31" className="study-credit__avatar-bg" />
      <circle cx="32" cy="25" r="10.5" className="study-credit__avatar-fg" />
      <path d="M12 56c2.5-11 10.5-17 20-17s17.5 6 20 17" className="study-credit__avatar-fg" />
    </svg>
  );
}

function Credits() {
  return (
    <>
      {PRESENTERS.map((p) => (
        <div key={p.id} className="study-credit">
          <Avatar />
          <div className="study-credit__text">
            <div className="study-credit__name">{p.name}</div>
            <div className={`study-credit__email${isPlaceholder(p.email) ? ' is-todo' : ''}`}>{p.email}</div>
          </div>
        </div>
      ))}
    </>
  );
}

function Qr({ copy }: { copy: TalkCopy }) {
  const n = QR_SAMPLE.modules + 8; // 4-module quiet zone on each side
  return (
    <>
      <svg className="study-qr__code" viewBox={`-4 -4 ${n} ${n}`} shapeRendering="crispEdges" aria-label="QR">
        <rect x={-4} y={-4} width={n} height={n} className="study-qr__paper" />
        <path d={QR_SAMPLE.path} className="study-qr__ink" />
      </svg>
      <div className="study-qr__text">
        <div className="study-qr__label">{copy['hook.qr']}</div>
        <div className="study-qr__sub">{copy['close.explore']}</div>
      </div>
    </>
  );
}

export function StudyBlock({ item, copy }: { item: StudyItem; copy: TalkCopy }) {
  switch (item.block) {
    case 'scrim':
      return null;
    case 'timeline':
      return <Timeline id={item.id} progress={item.progress} />;
    case 'credits':
      return <Credits />;
    case 'qr':
      return <Qr copy={copy} />;
  }
}
