/**
 * Design study review mode (`?designStudy=1`, dev / local only; never in the portable build): a
 * small temporary panel over the real presentation. Keys (matched by physical position):
 *
 *   1 / 2 / 3        direction A / B / C (same state, shown at once)
 *   Left / Right     previous / next representative state (entered with its real transition)
 *   P                replay the current state's transition
 *   6 / 7 / 8 / 9    motion prototypes A metric reveal, B shared object, C fission reset, D safety rhythm
 *   T                typography A/B/C board on / off
 *   H                hide / show this panel (the frame alone)
 *   Space / PageDown / PageUp   the talk's own next / previous beat, unchanged
 *
 * URL: &dir=a|b|c &state=1..5 &typography=1 &panel=0 (the URL follows the panel's choices).
 */
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { useTalkStore, TALK_BEATS } from '../talk';
import { DIRECTIONS, MOTIONS, playMotion, setDirection, showState, STATES } from './review';
import { useStudyStore, type StudyDirection } from './studyMode';
import { STUDY_TOKENS, studyVariables } from './tokens';
import { useAppStore } from '../../state/store';

const params = new URLSearchParams(window.location.search);
const dirParam = (params.get('dir') ?? params.get('study') ?? 'a').toLowerCase();
const startDirection: StudyDirection = dirParam === 'b' || dirParam === 'c' ? dirParam : 'a';
const startState = Math.min(5, Math.max(1, Number(params.get('state') ?? 1))) - 1;

function measureStage(): string {
  const r = document.querySelector('.stage')?.getBoundingClientRect();
  return r ? `${Math.round(r.width)}×${Math.round(r.height)}` : '';
}

/** Panel buttons never take focus: Space must stay the talk's key, not "click the last button". */
const noFocus = { tabIndex: -1, onMouseDown: (e: { preventDefault(): void }) => e.preventDefault() } as const;

function syncUrl(direction: StudyDirection, state: number, typography: boolean, panel: boolean) {
  const q = new URLSearchParams(window.location.search);
  q.set('designStudy', '1');
  q.delete('study');
  q.set('dir', direction);
  q.set('state', String(state + 1));
  if (typography) q.set('typography', '1');
  else q.delete('typography');
  if (!panel) q.set('panel', '0');
  else q.delete('panel');
  window.history.replaceState(null, '', `${window.location.pathname}?${q.toString()}`);
}

export default function StudyReview() {
  const direction = useStudyStore((s) => s.direction) ?? 'a';
  const typography = useStudyStore((s) => s.typography);
  const flat = useTalkStore((s) => s.flat);
  const active = useTalkStore((s) => s.active);
  const ready = useAppStore((s) => s.status === 'ready');
  const [state, setState] = useState(startState);
  const [panel, setPanel] = useState(params.get('panel') !== '0');
  const [stageSize, setStageSize] = useState(measureStage);

  // First entry once the scene is ready: the URL's direction and state.
  useEffect(() => {
    if (!ready) return;
    setDirection(startDirection);
    if (params.get('typography') === '1') useStudyStore.setState({ typography: true });
    showState(startState);
  }, [ready]);

  useEffect(() => syncUrl(direction, state, typography, panel), [direction, state, typography, panel]);

  useEffect(() => {
    const measure = () => setStageSize(measureStage());
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  useEffect(() => {
    const go = (i: number) => {
      const next = (i + STATES.length) % STATES.length;
      setState(next);
      showState(next);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const code = e.code;
      const digit = /^(Digit|Numpad)(\d)$/.exec(code)?.[2];
      let handled = true;
      if (digit === '1' || digit === '2' || digit === '3') setDirection((['a', 'b', 'c'] as const)[Number(digit) - 1]!);
      else if (digit && Number(digit) >= 6) playMotion(Number(digit) - 6);
      else if (code === 'ArrowRight') go(state + 1);
      else if (code === 'ArrowLeft') go(state - 1);
      else if (code === 'KeyP') showState(state);
      else if (code === 'KeyT') useStudyStore.setState((s) => ({ typography: !s.typography }));
      else if (code === 'KeyH') setPanel((p) => !p);
      else handled = false;
      if (handled) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    };
    // Capture phase on window: the review keys never reach the talk's or Explore's handlers.
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [state]);

  const beat = TALK_BEATS[flat];
  const beatId = beat ? `${beat.chapter.id}/${beat.beat.id}` : '';
  const stage = document.querySelector('.stage');

  return (
    <>
      {panel &&
        createPortal(
          <div className="study-review" role="region" aria-label="Design study review">
            <div className="study-review__title">
              DESIGN STUDY · temporary review (Stage 1) <span>not the presentation · H hides this panel</span>
            </div>
            <div className="study-review__row">
              <span className="study-review__head">Direction</span>
              {DIRECTIONS.map((d) => (
                <button key={d.id} type="button" {...noFocus} className={d.id === direction ? 'is-on' : ''} onClick={() => setDirection(d.id)} title={d.font}>
                  <kbd>{d.key}</kbd> {d.label}
                </button>
              ))}
            </div>
            <div className="study-review__row">
              <span className="study-review__head">State</span>
              {STATES.map((s, i) => (
                <button
                  key={s.beat}
                  type="button"
                  {...noFocus}
                  className={i === state ? 'is-on' : ''}
                  onClick={() => {
                    setState(i);
                    showState(i);
                  }}
                >
                  {s.label}
                </button>
              ))}
              <span className="study-review__hint">
                <kbd>←</kbd>
                <kbd>→</kbd> <kbd>P</kbd> replay
              </span>
            </div>
            <div className="study-review__row">
              <span className="study-review__head">Motion</span>
              {MOTIONS.map((m, i) => (
                <button key={m.key} type="button" {...noFocus} onClick={() => playMotion(i)}>
                  <kbd>{m.key}</kbd> {m.label}
                </button>
              ))}
              <button type="button" {...noFocus} className={typography ? 'is-on' : ''} onClick={() => useStudyStore.setState((s) => ({ typography: !s.typography }))}>
                <kbd>T</kbd> Typography A/B/C
              </button>
            </div>
            <div className="study-review__now">
              Now: <b>{DIRECTIONS.find((d) => d.id === direction)?.label}</b> · {STATES[state]!.label} · beat <code>{beatId}</code>
              {!active && ' (talk not active: press → or P)'} · stage {stageSize} (16:9, composition = 1920×1080) · Space = the talk's next beat
            </div>
          </div>,
          document.body,
        )}
      {typography && stage && createPortal(<TypographyBoard />, stage)}
    </>
  );
}

// ---- Typography A/B/C on identical content ------------------------------------------------------------

const SAMPLE = {
  kicker: 'Mažieji moduliniai reaktoriai',
  title: 'BWRX-300',
  power: ['~300', 'MW'],
  months: ['24–36', 'mėn.*'],
  pin: ['Darlingtonas, Kanada', 'statoma'],
  pinSource: 'Šaltiniai: CNSC, US NRC, GE Vernova Hitachi (2025–2026)',
  safety: ['Pasyvusis aušinimas', 'be siurblių, be išorinės elektros', '7 paros*', '*Be operatorių veiksmų; tam pakanka 2 iš 3 kontūrų (GE Vernova Hitachi, GD Rev. J §3.3)'],
  names: [
    ['Virgilijus Kiltinavičius', 'VIRGILIJUS_EMAIL_TODO'],
    ['Timofej Gaivoronskij', 'timofej.gaivoronskij@stud.vilniustech.lt'],
  ],
} as const;

const LICENCE: Record<StudyDirection, string> = {
  a: 'system font · Microsoft licence, not redistributable · Windows 11 only (Win 10: Segoe UI)',
  b: 'bundled WOFF2 104 KB · SIL OFL 1.1 · offline',
  c: 'bundled WOFF2 78 KB · SIL OFL 1.1 (RFN "Plex": subset renamed) · offline',
};

export function TypographyBoard() {
  const columns = useMemo(() => DIRECTIONS.map((d) => ({ ...d, style: studyVariables(d.id) as CSSProperties, roles: STUDY_TOKENS[d.id].roles })), []);
  const r = (role: { size: number; weight: number }) => `${role.size} px · ${role.weight}`;
  return (
    <div className="study-board" aria-label="Typography A/B/C">
      {columns.map((c) => (
        <section key={c.id} className="study-board__col" style={c.style}>
          <header className="study-board__head">
            <div className="study-board__dir">{c.label}</div>
            <div className="study-board__font">{c.font}</div>
            <div className="study-board__lic">{LICENCE[c.id]}</div>
          </header>
          <div className="study-board__cell">
            <div className="study-board__note">1 opening · micro {r(c.roles.micro)} / display {r(c.roles.display)}</div>
            <div className="sb-kicker">{SAMPLE.kicker}</div>
            <div className="sb-display">{SAMPLE.title}</div>
          </div>
          <div className="study-board__cell">
            <div className="study-board__note">2 metric {r(c.roles.metric)} · unit h2 {r(c.roles.h2)}</div>
            <div className="sb-metric">
              {SAMPLE.power[0]}
              <span className="sb-unit">{SAMPLE.power[1]}</span>
            </div>
            <div className="sb-metric">
              {SAMPLE.months[0]}
              <span className="sb-unit">{SAMPLE.months[1]}</span>
            </div>
          </div>
          <div className="study-board__cell">
            <div className="study-board__note">3 map label · label {r(c.roles.label)} · source {r(c.roles.source)}</div>
            <div className="sb-pin">
              <span className="sb-pin__dot" />
              <span className="sb-pin__line" />
              <span className="sb-pin__body">
                <span className="sb-label">{SAMPLE.pin[0]}</span>
                <span className="sb-pin__sub">{SAMPLE.pin[1]}</span>
              </span>
            </div>
            <div className="sb-source">{SAMPLE.pinSource}</div>
          </div>
          <div className="study-board__cell">
            <div className="study-board__note">4 safety · h1 {r(c.roles.h1)} · body {r(c.roles.body)} · metric</div>
            <div className="sb-h1">{SAMPLE.safety[0]}</div>
            <div className="sb-body">{SAMPLE.safety[1]}</div>
            <div className="sb-metric sb-metric--days">{SAMPLE.safety[2]}</div>
            <div className="sb-source">{SAMPLE.safety[3]}</div>
          </div>
          <div className="study-board__cell">
            <div className="study-board__note">5 closing contacts · body 600 · source</div>
            {SAMPLE.names.map(([name, email]) => (
              <div key={name} className="sb-credit">
                <div className="sb-name">{name}</div>
                <div className={`sb-email${email.endsWith('_TODO') ? ' is-todo' : ''}`}>{email}</div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
