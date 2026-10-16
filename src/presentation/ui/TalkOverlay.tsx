/**
 * Presentation v1 on-screen copy: the only UI the audience sees during the talk. A beat lists its
 * items (presentation/types.ts OverlayItem); items keep their element across beats when the id
 * stays (no re-animation), new ones enter, removed ones fade out. An item with a `cue` fades in
 * once on that cue instead. Everything that moves per frame (anchored labels, count-ups, the time
 * counter, micro labels, the dip) is positioned by presentation/overlayLayer.ts.
 * Typography, colour and motion come from presentation/design.ts (CSS variables on the root).
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Vector3 } from 'three';
import { useLanguageStore, type Language } from '../../i18n/language';
import { isPlaceholder, PRESENTERS, PUBLIC_PRESENTATION_URL, type Presenter } from '../config';
import { useTalkCopy, type TalkCopy } from '../copy';
import { designVariables } from '../design';
import { overlayLayer } from '../overlayLayer';
import { CHAIN_LABELS } from '../scene/chainConfig';
import { TALK_BEATS, useTalkStore } from '../talk';
import type { OverlayItem } from '../types';
import { PresenterFigure } from './PresenterFigure';
import './talk.css';

const LEAVE_MS = 400;

interface Shown {
  item: OverlayItem;
  leaving: boolean;
}

/** Keep removed items for a short fade-out (state derived from the item list as it changes). */
function useShownItems(items: readonly OverlayItem[]): Shown[] {
  const [state, setState] = useState<{ items: readonly OverlayItem[]; shown: Shown[] }>(() => ({ items, shown: items.map((item) => ({ item, leaving: false })) }));
  if (state.items !== items) {
    const ids = new Set(items.map((i) => i.id));
    setState({
      items,
      shown: [...items.map((item) => ({ item, leaving: false })), ...state.shown.filter((s) => !ids.has(s.item.id) && !s.leaving).map((s) => ({ item: s.item, leaving: true }))],
    });
  }
  useEffect(() => {
    if (!state.shown.some((s) => s.leaving)) return;
    const timer = window.setTimeout(() => setState((s) => ({ ...s, shown: s.shown.filter((x) => !x.leaving) })), LEAVE_MS);
    return () => window.clearTimeout(timer);
  }, [state]);
  return state.shown;
}

const EMPTY: readonly OverlayItem[] = [];

export function TalkOverlay() {
  const active = useTalkStore((s) => s.active);
  const flat = useTalkStore((s) => s.flat);
  const copy = useTalkCopy();
  const language = useLanguageStore((s) => s.language);
  const beat = TALK_BEATS[flat]!;
  const items = active ? beat.overlay : EMPTY;
  const shown = useShownItems(items);
  const dip = useRef<HTMLDivElement>(null);
  const style = useMemo(() => designVariables() as CSSProperties, []);

  useLayoutEffect(() => {
    overlayLayer.dip = dip.current;
    return () => void (overlayLayer.dip = null);
  }, []);

  const label = active && !beat.chapter.hideLabel ? copy[beat.chapter.label] : null;

  return (
    <div className={`talk${active ? ' is-active' : ''}`} lang={language} style={style}>
      <div ref={dip} className="talk__dip" style={{ opacity: 0 }} />
      {label && (
        <div key={beat.chapter.id} className="talk__chapter">
          {label}
        </div>
      )}
      {shown.map(({ item, leaving }) => (
        <Item key={item.id} item={item} leaving={leaving} copy={copy} language={language} />
      ))}
    </div>
  );
}

function Item({ item, leaving, copy, language }: { item: OverlayItem; leaving: boolean; copy: TalkCopy; language: Language }) {
  const base = (cls: string, position?: string) => `talk-item ${cls}${position ? ` talk-pos--${position}` : ''}${leaving ? ' is-leaving' : ''}`;
  // Anchored items position themselves per frame; their cue drives their opacity there.
  if (item.kind === 'label') return <Anchored item={item} className={base(`talk-label talk-label--${item.style ?? 'tag'} talk-label--${item.side ?? 'right'}`)} copy={copy} />;
  if (item.kind === 'pins') return null; // the world map draws its pins in 3D; the names are labels
  if (item.kind === 'microLabels') {
    return (
      <div className={base('talk-micro')}>
        {CHAIN_LABELS.map((l, i) => (
          <MicroLabel key={l.key} id={`${item.id}:${i}`} label={l} copy={copy} />
        ))}
      </div>
    );
  }
  const wrap = (cls: string, position: string | undefined, children: ReactNode) => (
    <Cued id={item.id} cue={item.cue} className={base(cls, position)}>
      {children}
    </Cued>
  );
  switch (item.kind) {
    case 'title':
      return wrap(
        `talk-title talk-title--${item.size ?? 'hero'}`,
        item.position ?? 'top-left',
        <>
          {item.kicker && <div className="talk-title__kicker">{copy[item.kicker]}</div>}
          <div className="talk-title__title">{copy[item.title]}</div>
          {item.sub && <div className="talk-title__sub">{copy[item.sub]}</div>}
        </>,
      );
    case 'stat':
      return wrap('talk-stat', item.position ?? 'left', <Stat item={item} copy={copy} language={language} />);
    case 'caption':
      return wrap(
        `talk-caption talk-caption--${item.tone ?? 'plain'} talk-caption--${item.size ?? 'large'}`,
        item.position ?? 'bottom-left',
        <>
          <div className="talk-caption__text">{copy[item.text]}</div>
          {item.sub && <div className="talk-caption__sub">{copy[item.sub]}</div>}
        </>,
      );
    case 'note':
      return wrap('talk-note', undefined, copy[item.text]);
    case 'speakers':
      return wrap(`talk-speakers talk-speakers--${item.layout}`, undefined, <Speakers />);
    case 'qr':
      return wrap('talk-qr', undefined, <Qr copy={copy} />);
    case 'counter':
      return wrap('talk-counter', 'top-right', <Counter id={item.id} cue={item.cue ?? ''} copy={copy} language={language} />);
    case 'meters':
      return wrap(
        'talk-meters',
        'top-right',
        <>
          <div className="talk-meters__row">
            <span className="talk-meters__name">{copy['safety.fission']}</span>
            <span className="talk-meters__value">{copy['safety.fissionValue']}</span>
          </div>
          <div className="talk-meters__row talk-meters__row--warm">
            <span className="talk-meters__name">{copy['safety.decay']}</span>
            <span className="talk-meters__value">{copy['safety.decayValue']}</span>
          </div>
        </>,
      );
    case 'legend':
      return wrap(
        'talk-legend',
        'bottom-right',
        (['building', 'licensing', 'planned', 'assessing'] as const).map((status) => (
          <div key={status} className="talk-legend__row">
            <span className={`talk-pin talk-pin--${status}`} aria-hidden="true" />
            {copy[`projects.legend.${status}`]}
          </div>
        )),
      );
  }
}

/** A cue-driven fade (per frame, overlayLayer.ts), or the plain entrance animation without a cue. */
function Cued({ id, cue, className, children }: { id: string; cue?: string; className: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!cue || !ref.current) return;
    overlayLayer.cued.set(id, { el: ref.current, cue });
    return () => void overlayLayer.cued.delete(id);
  }, [id, cue]);
  return (
    <div ref={ref} className={cue ? `${className} is-cued` : className} style={cue ? { opacity: 0 } : undefined}>
      {children}
    </div>
  );
}

function Stat({ item, copy, language }: { item: Extract<OverlayItem, { kind: 'stat' }>; copy: TalkCopy; language: Language }) {
  const value = useRef<HTMLSpanElement>(null);
  const count = item.count;
  useLayoutEffect(() => {
    if (!count || !value.current) return;
    overlayLayer.counts.set(item.id, {
      el: value.current,
      cue: count.cue,
      from: count.from ?? 0,
      to: count.to,
      decimals: count.decimals ?? 0,
      group: count.group ?? false,
      prefix: count.prefix ?? '',
      suffix: count.suffix ?? '',
      language,
      shown: '',
    });
    return () => void overlayLayer.counts.delete(item.id);
  }, [item.id, count, language]);
  return (
    <>
      <div className="talk-stat__value">
        <span ref={value}>{count ? '' : copy[item.value]}</span>
        {item.unit && <span className="talk-stat__unit">{copy[item.unit]}</span>}
      </div>
      {item.caption && <div className="talk-stat__caption">{copy[item.caption]}</div>}
    </>
  );
}

function Anchored({ item, className, copy }: { item: Extract<OverlayItem, { kind: 'label' }>; className: string; copy: TalkCopy }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!ref.current) return;
    overlayLayer.anchors.set(item.id, { el: ref.current, at: new Vector3(...item.at), side: item.side ?? 'right', cue: item.cue });
    return () => void overlayLayer.anchors.delete(item.id);
  }, [item]);
  return (
    <div ref={ref} className={className} style={{ visibility: 'hidden' }}>
      <span className="talk-label__dot" aria-hidden="true" />
      <span className="talk-label__body">
        <span className="talk-label__text">{copy[item.text]}</span>
        {item.sub && <span className="talk-label__sub">{copy[item.sub]}</span>}
      </span>
    </div>
  );
}

function MicroLabel({ id, label, copy }: { id: string; label: (typeof CHAIN_LABELS)[number]; copy: TalkCopy }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!ref.current) return;
    overlayLayer.micro.set(id, { el: ref.current, at: label.at, window: label.window, side: label.side });
    return () => void overlayLayer.micro.delete(id);
  }, [id, label]);
  return (
    <div ref={ref} className={`talk-micro__label talk-micro__label--${label.side}`} style={{ visibility: 'hidden' }}>
      {copy[label.key]}
    </div>
  );
}

/** 0 h ... 7 days: stepped, accelerated, once. */
const COUNTER_STEPS: Record<Language, readonly string[]> = {
  lt: ['0 h', '6 h', '12 h', '1 para', '2 paros', '3 paros', '4 paros', '5 paros', '6 paros', '7 paros'],
  en: ['0 h', '6 h', '12 h', '1 day', '2 days', '3 days', '4 days', '5 days', '6 days', '7 days'],
};

function Counter({ id, cue, copy, language }: { id: string; cue: string; copy: TalkCopy; language: Language }) {
  const value = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!value.current) return;
    overlayLayer.counters.set(id, { el: value.current, bar: bar.current, cue, steps: COUNTER_STEPS[language], shown: -1 });
    return () => void overlayLayer.counters.delete(id);
  }, [id, cue, language]);
  return (
    <>
      <div ref={value} className="talk-counter__value" />
      <div className="talk-counter__track">
        <div ref={bar} className="talk-counter__bar" />
      </div>
      <div className="talk-counter__note">{copy['safety.daysNote']}</div>
    </>
  );
}

function Speakers() {
  const [focused, setFocused] = useState<Presenter['id'] | null>(null);
  return (
    <>
      {PRESENTERS.map((p, i) => (
        <button key={p.id} type="button" className={`talk-speaker${focused === p.id ? ' is-focused' : ''}`} style={{ '--i': i } as CSSProperties} onClick={() => setFocused((f) => (f === p.id ? null : p.id))}>
          <PresenterFigure presenter={p} variant={i} />
          <span className="talk-speaker__text">
            <span className="talk-speaker__name">{p.name}</span>
            {isPlaceholder(p.email) ? (
              <span className="talk-speaker__email is-todo">{p.email}</span>
            ) : (
              <a className="talk-speaker__email" href={`mailto:${p.email}`} onClick={(e) => e.stopPropagation()}>
                {p.email}
              </a>
            )}
          </span>
        </button>
      ))}
    </>
  );
}

function Qr({ copy }: { copy: TalkCopy }) {
  const todo = isPlaceholder(PUBLIC_PRESENTATION_URL);
  return (
    <>
      <div className="talk-qr__code" aria-hidden="true">
        {todo ? <span className="talk-qr__todo">QR</span> : null}
      </div>
      <div className="talk-qr__text">
        <div className="talk-qr__label">{copy['hook.qr']}</div>
        <div className="talk-qr__url">{todo ? copy['hook.qrTodo'] : PUBLIC_PRESENTATION_URL}</div>
      </div>
    </>
  );
}
