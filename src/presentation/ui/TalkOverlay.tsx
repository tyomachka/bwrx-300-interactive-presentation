/**
 * Presentation v1 on-screen copy: the only UI the audience sees during the talk. A beat lists its
 * items (presentation/types.ts OverlayItem); items keep their element across beats when the id
 * stays (no re-animation), new ones enter, removed ones fade out. An item with a `cue` fades in
 * once on that cue instead. Everything that moves per frame (anchored labels, count-ups, the time
 * counter, micro labels, progress, the dip) is positioned by presentation/overlayLayer.ts.
 * Typography, colour, grid and motion come from presentation/design.ts (CSS variables on the root).
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Vector3 } from 'three';
import { useLanguageStore, type Language } from '../../i18n/language';
import { isPlaceholder, PRESENTERS, PUBLIC_PRESENTATION_URL } from '../config';
import { useTalkCopy, type TalkCopy } from '../copy';
import { designVariables, stageX, stageY, type Tone } from '../design';
import { overlayLayer } from '../overlayLayer';
import { QR_CODE } from '../qrCode';
import { CHAIN_LABELS } from '../scene/chainConfig';
import { TALK_BEATS, useTalkStore } from '../talk';
import type { OverlayItem } from '../types';
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
    <div className={`talk${active ? ' is-active' : ''}${active && beat.beat.lightScene ? ' talk--light-scene' : ''}`} lang={language} style={style}>
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

/** An item's top edge on the grid when the beat sets one (`y`, px at 1080p). */
const placedTop = (y?: number): CSSProperties | undefined => (y === undefined ? undefined : { top: stageY(y), bottom: 'auto', translate: 'none' });

function Item({ item, leaving, copy, language }: { item: OverlayItem; leaving: boolean; copy: TalkCopy; language: Language }) {
  const base = (cls: string, position?: string) => `talk-item ${cls}${position ? ` talk-pos--${position}` : ''}${leaving ? ' is-leaving' : ''}`;
  // Anchored items position themselves per frame; their cue drives their opacity there.
  if (item.kind === 'label') return <Anchored item={item} className={base('talk-label')} copy={copy} />;
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
  const wrap = (cls: string, position: string | undefined, children: ReactNode, style?: CSSProperties) => (
    <Cued id={item.id} cue={item.cue} className={base(cls, position)} style={style}>
      {children}
    </Cued>
  );
  switch (item.kind) {
    case 'title':
      return wrap(
        `talk-title talk-title--${item.size ?? 'display'}`,
        item.position ?? 'top-left',
        <>
          {item.kicker && <div className="talk-title__kicker">{copy[item.kicker]}</div>}
          <div className="talk-title__title" style={item.measure ? { maxWidth: stageX(item.measure) } : undefined}>
            {copy[item.title]}
          </div>
          {item.sub && <div className="talk-title__sub">{copy[item.sub]}</div>}
        </>,
        placedTop(item.y),
      );
    case 'stat':
      return wrap(`talk-stat talk-stat--${item.size ?? 'metric'}`, item.position ?? 'left', <Stat item={item} copy={copy} language={language} />, placedTop(item.y));
    case 'caption':
      return wrap(
        `talk-caption talk-caption--${item.size ?? 'h1'}`,
        item.position ?? 'top-left',
        <>
          <div className="talk-caption__text">{copy[item.text]}</div>
          {item.sub && <div className="talk-caption__sub">{copy[item.sub]}</div>}
          {item.source && <div className="talk-source">{copy[item.source]}</div>}
        </>,
        placedTop(item.y),
      );
    case 'note':
      return wrap('talk-note', undefined, copy[item.text]);
    case 'scrim':
      return wrap(`talk-scrim talk-scrim--${item.side}`, undefined, null);
    case 'timeline':
      return wrap('talk-timeline', item.position ?? 'bottom-left', <Timeline id={item.id} progress={item.progress} />, placedTop(item.y));
    case 'speakers':
      return wrap(`talk-credits talk-credits--${item.layout}`, undefined, <Credits />);
    case 'qr':
      return wrap(`talk-qr talk-qr--${item.layout}`, undefined, <Qr copy={copy} />);
    case 'counter':
      return wrap('talk-counter', 'right', <Counter id={item.id} cue={item.cue ?? ''} copy={copy} language={language} />);
    case 'meters':
      return wrap(
        'talk-meters',
        'right',
        <>
          <div className="talk-meters__row">
            <span className="talk-meters__name">{copy['safety.fission']}</span>
            <span className="talk-meters__value">{copy['safety.fissionValue']}</span>
          </div>
          <div className="talk-meters__row talk-meters__row--heat">
            <span className="talk-meters__name">{copy['safety.decay']}</span>
            <span className="talk-meters__value">{copy['safety.decayValue']}</span>
          </div>
        </>,
      );
    case 'legend':
      return wrap(
        'talk-legend',
        'bottom-right',
        <>
          {(['building', 'licensing', 'planned', 'assessing'] as const).map((status) => (
            <div key={status} className="talk-legend__row">
              <span className={`talk-pin talk-pin--${status}`} aria-hidden="true" />
              {copy[`projects.legend.${status}`]}
            </div>
          ))}
          {item.source && <div className="talk-source">{copy[item.source]}</div>}
        </>,
      );
  }
}

/**
 * A cue-driven fade (per frame, overlayLayer.ts), or the plain entrance animation without a cue. An
 * item that faded in on a cue and stays into the next beat without one (same id) simply stays: it
 * must not replay its entrance (a blink on the press).
 */
function Cued({ id, cue, className, children, style }: { id: string; cue?: string; className: string; children: ReactNode; style?: CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const [wasCued, setWasCued] = useState(!!cue);
  if (cue && !wasCued) setWasCued(true);
  useLayoutEffect(() => {
    if (!cue || !ref.current) return;
    overlayLayer.cued.set(id, { el: ref.current, cue });
    return () => void overlayLayer.cued.delete(id);
  }, [id, cue]);
  const cls = cue ? `${className} is-cued` : wasCued ? `${className} is-shown` : className;
  return (
    <div ref={ref} className={cls} style={cue ? { ...style, opacity: 0 } : style}>
      {children}
    </div>
  );
}

/** The copy's own text around its number ("50 %" / "50%", "≈ 300 000", "~300"), so a count-up ends on exactly the copy. */
function affixes(text: string): { prefix: string; suffix: string } {
  const m = /^(\D*)[\d\s.,]*\d(\D*)$/.exec(text);
  return { prefix: m?.[1] ?? '', suffix: m?.[2] ?? '' };
}

function Stat({ item, copy, language }: { item: Extract<OverlayItem, { kind: 'stat' }>; copy: TalkCopy; language: Language }) {
  const value = useRef<HTMLSpanElement>(null);
  const count = item.count;
  const text = copy[item.value];
  useLayoutEffect(() => {
    if (!count || !value.current) return;
    const { prefix, suffix } = affixes(text);
    overlayLayer.counts.set(item.id, {
      el: value.current,
      cue: count.cue,
      from: count.from ?? 0,
      to: count.to,
      decimals: count.decimals ?? 0,
      group: count.group ?? false,
      prefix,
      suffix,
      language,
      shown: '',
    });
    return () => void overlayLayer.counts.delete(item.id);
  }, [item.id, count, language, text]);
  return (
    <>
      <div className="talk-stat__value">
        <span ref={value} className={count ? 'talk-stat__number is-counting' : 'talk-stat__number'}>
          {count ? '' : copy[item.value]}
        </span>
        {item.unit && <span className="talk-stat__unit">{copy[item.unit]}</span>}
      </div>
      {item.caption && <div className="talk-stat__caption">{copy[item.caption]}</div>}
      {item.source && <div className="talk-source">{copy[item.source]}</div>}
    </>
  );
}

function Dot({ tone, ring }: { tone: Tone; ring?: boolean }) {
  return <span className={`talk-dot talk-dot--${tone}${ring ? ' is-ring' : ''}`} aria-hidden="true" />;
}

/** Small drawn cues for chapter 11 (stroke only, the label's colours). */
function Glyph({ glyph }: { glyph: 'layers' | 'schedule' }) {
  if (glyph === 'layers') {
    // Layered approvals: three offset sheets.
    return (
      <svg className="talk-glyph talk-glyph--layers" viewBox="0 0 44 40" aria-hidden="true">
        <rect x="13" y="1" width="26" height="30" rx="2" className="talk-glyph__back" />
        <rect x="8" y="5" width="26" height="30" rx="2" className="talk-glyph__mid" />
        <rect x="3" y="9" width="26" height="30" rx="2" className="talk-glyph__front" />
        <path d="M8 18h16M8 23h16M8 28h10" className="talk-glyph__ink" />
      </svg>
    );
  }
  // A schedule with an uncertain end: a solid bar, then dashes fading out.
  return (
    <svg className="talk-glyph talk-glyph--schedule" viewBox="0 0 120 40" aria-hidden="true">
      <path d="M2 30h116" className="talk-glyph__axis" />
      <path d="M2 26v8M40 26v8M78 26v8" className="talk-glyph__axis" />
      <rect x="2" y="9" width="52" height="9" rx="1.5" className="talk-glyph__plan" />
      <rect x="56" y="9" width="10" height="9" rx="1.5" className="talk-glyph__risk" opacity="0.7" />
      <rect x="69" y="9" width="10" height="9" rx="1.5" className="talk-glyph__risk" opacity="0.45" />
      <rect x="82" y="9" width="10" height="9" rx="1.5" className="talk-glyph__risk" opacity="0.25" />
      <rect x="95" y="9" width="10" height="9" rx="1.5" className="talk-glyph__risk" opacity="0.12" />
    </svg>
  );
}

function Anchored({ item, className, copy }: { item: Extract<OverlayItem, { kind: 'label' }>; className: string; copy: TalkCopy }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!ref.current) return;
    overlayLayer.anchors.set(item.id, { el: ref.current, at: new Vector3(...item.at), cue: item.cue, leader: item.leader, leaderTo: item.leaderTo });
    return () => void overlayLayer.anchors.delete(item.id);
  }, [item]);
  const cls = `${className} talk-label--${item.size ?? 'label'}${item.panel ? ' has-panel' : ''}${item.glyph ? ' has-glyph' : ''}`;
  return (
    <div ref={ref} className={cls} style={{ visibility: 'hidden' }}>
      <span className="talk-label__line" aria-hidden="true" />
      <Dot tone={item.tone ?? 'neutral'} ring={item.ring} />
      <span className="talk-label__body">
        {item.glyph && <Glyph glyph={item.glyph} />}
        <span className="talk-label__words">
          <span className="talk-label__text">{copy[item.text]}</span>
          {item.sub && <span className="talk-label__sub">{copy[item.sub]}</span>}
          {item.source && <span className="talk-label__source">{copy[item.source]}</span>}
        </span>
      </span>
    </div>
  );
}

function MicroLabel({ id, label, copy }: { id: string; label: (typeof CHAIN_LABELS)[number]; copy: TalkCopy }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!ref.current) return;
    overlayLayer.micro.set(id, { el: ref.current, at: label.at, path: label.path, window: label.window, leader: label.leader });
    return () => void overlayLayer.micro.delete(id);
  }, [id, label]);
  return (
    <div ref={ref} className="talk-label talk-label--label talk-label--micro" style={{ visibility: 'hidden' }}>
      <span className="talk-label__line" aria-hidden="true" />
      <Dot tone={label.tone} />
      <span className="talk-label__body">
        <span className="talk-label__words">
          <span className="talk-label__text">{copy[label.key]}</span>
        </span>
      </span>
    </div>
  );
}

/** 0-36 months: the fill runs to 24 with its cue, then the 24-36 band (the claim) lights. */
const MONTHS = [0, 12, 24, 36] as const;

function Timeline({ id, progress }: { id: string; progress?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!progress || !ref.current) return;
    overlayLayer.progress.set(id, { el: ref.current, cue: progress, shown: '' });
    return () => void overlayLayer.progress.delete(id);
  }, [id, progress]);
  return (
    <div ref={ref} className="talk-timeline__body" style={progress ? undefined : ({ '--p': 1 } as CSSProperties)}>
      <div className="talk-timeline__track">
        <div className="talk-timeline__fill" />
        <div className="talk-timeline__band" />
      </div>
      <div className="talk-timeline__ticks">
        {MONTHS.map((m) => (
          <span key={m} className={`talk-timeline__tick${m >= 24 ? ' is-band' : ''}`} style={{ left: `${(m / 36) * 100}%` }}>
            {m}
          </span>
        ))}
      </div>
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
  // The last step is the copy's own "7 paros*": its footnote marker ties it to the note below.
  const final = copy['safety.days'];
  useLayoutEffect(() => {
    if (!value.current) return;
    const steps = [...COUNTER_STEPS[language].slice(0, -1), final];
    overlayLayer.counters.set(id, { el: value.current, bar: bar.current, cue, steps, shown: -1 });
    return () => void overlayLayer.counters.delete(id);
  }, [id, cue, language, final]);
  return (
    <>
      <div ref={value} className="talk-counter__value" />
      <div className="talk-counter__track">
        <div ref={bar} className="talk-counter__bar" />
      </div>
      <div className="talk-source">{copy['safety.daysNote']}</div>
    </>
  );
}

/**
 * The presenters: names and e-mails, divided by a hairline (no figures). A photo-based likeness
 * (presentation/config.ts `portrait`) appears as a small round mark once it exists.
 */
function Credits() {
  return (
    <>
      {PRESENTERS.map((p) => (
        <div key={p.id} className="talk-credit">
          {p.portrait && <img className="talk-credit__portrait" src={p.portrait} alt="" />}
          <div className="talk-credit__text">
            <div className="talk-credit__name">{p.name}</div>
            {isPlaceholder(p.email) ? (
              <div className="talk-credit__email is-todo">{p.email}</div>
            ) : (
              <a className="talk-credit__email" href={`mailto:${p.email}`}>
                {p.email}
              </a>
            )}
          </div>
        </div>
      ))}
    </>
  );
}

function Qr({ copy }: { copy: TalkCopy }) {
  const n = QR_CODE.modules + 8; // a 4-module quiet zone on each side
  const todo = QR_CODE.test || isPlaceholder(PUBLIC_PRESENTATION_URL);
  return (
    <>
      <svg className="talk-qr__code" viewBox={`-4 -4 ${n} ${n}`} shapeRendering="crispEdges" role="img" aria-label="QR">
        <rect x={-4} y={-4} width={n} height={n} className="talk-qr__paper" />
        <path d={QR_CODE.path} className="talk-qr__ink" />
      </svg>
      <div className="talk-qr__text">
        <div className="talk-qr__label">{copy['hook.qr']}</div>
        <div className={`talk-qr__sub${todo ? ' is-todo' : ''}`}>{todo ? copy['hook.qrTodo'] : copy['close.explore']}</div>
      </div>
    </>
  );
}
