/**
 * Presentation v1 debug panel (`?presentationDebug`, or T in dev / with `?debug`): the presenter
 * stop list with the press counter (stop k / 23, chapter c / 12; click one to settle on it,
 * shift-click to play it), the beats inside the current stop, step, inspect, copy the camera pose. Never part of the
 * audience view: it only exists with those flags.
 */
import { useEffect, useState } from 'react';
import { cameraDirector } from '../../camera/cameraDirector';
import { CHAPTERS } from '../chapters';
import { beatTime } from '../runtime';
import { stopOutline, talk, TALK_BEATS, TALK_STOPS, useTalkStore } from '../talk';
import { cues, world } from '../world';

export function TalkDebug() {
  const active = useTalkStore((s) => s.active);
  const flat = useTalkStore((s) => s.flat);
  const mode = useTalkStore((s) => s.mode);
  const presses = useTalkStore((s) => s.presses);
  const [, tick] = useState(0);
  const [open, setOpen] = useState(true);
  const beat = TALK_BEATS[flat]!;
  const stops = stopOutline();

  useEffect(() => {
    const timer = window.setInterval(() => tick((n) => n + 1), 250);
    return () => window.clearInterval(timer);
  }, []);

  const copyPose = () => {
    const p = cameraDirector.getPose();
    const r = (v: number[]) => v.map((x) => +x.toFixed(2));
    const text = `{ position: [${r(p.position).join(', ')}], target: [${r(p.target).join(', ')}], fov: ${+p.fov.toFixed(1)} }`;
    void navigator.clipboard?.writeText(text).catch(() => undefined);
    console.info('[talk] camera pose', text);
  };

  const running = [...cues.entries()].filter(([, v]) => v > 0 && v < 1).map(([k, v]) => `${k} ${v.toFixed(2)}`);

  return (
    <div className="talk-debug">
      <div className="talk-debug__head">
        <strong>Presentation</strong>
        <span>{active ? 'active' : 'inactive'}</span>
        <button type="button" onClick={() => setOpen((o) => !o)}>
          {open ? '–' : '+'}
        </button>
      </div>
      <div className="talk-debug__state">
        stop {beat.stop + 1} / {TALK_STOPS.length} · chapter {beat.chapterIndex + 1} / {CHAPTERS.length} · presses {presses} · {beat.chapter.id} / {beat.beat.id}
        {beat.auto ? ' (auto)' : ''} · {mode} · t {beatTime().toFixed(1)} s{talk.locked ? ' · locked' : ''}
        <br />
        <span className="talk-debug__note">{beat.beat.note}</span>
        {running.length > 0 && <div className="talk-debug__cues">{running.join(' · ')}</div>}
        <div className="talk-debug__cues">shaft {world['f.shaft'].toFixed(2)} · scram {world['c.scram'].toFixed(2)} · lights {world['p.lights'].toFixed(2)}</div>
      </div>
      <div className="talk-debug__row">
        <button type="button" onClick={() => talk.prev()}>
          ◀ prev
        </button>
        <button type="button" onClick={() => talk.next()}>
          next ▶
        </button>
        <button type="button" onClick={() => talk.jump(flat, 'play')}>
          replay
        </button>
        <button type="button" onClick={() => talk.reset()}>
          reset
        </button>
        <button type="button" onClick={() => (active ? talk.exit() : talk.start())}>
          {active ? 'exit' : 'enter'}
        </button>
        <button type="button" onClick={copyPose}>
          copy pose
        </button>
      </div>
      {open && (
        <div className="talk-debug__list">
          {stops.map((st) => (
            <div key={st.stop} className="talk-debug__chapter">
              <button
                type="button"
                className={st.stop === beat.stop ? 'is-current' : ''}
                title={`${st.beats.join(' → ')}
settles ${st.settle} s (click: settle, shift-click: play)`}
                onClick={(e) => talk.jumpStop(st.stop, e.shiftKey ? 'play' : 'settle')}
              >
                {st.stop + 1}. {st.id}
              </button>
              {st.stop === beat.stop &&
                TALK_BEATS.filter((b) => b.stop === st.stop).map((b) => (
                  <span key={b.flat} className={b.flat === flat ? 'talk-debug__note is-current' : 'talk-debug__note'}>
                    {b.auto ? `+${b.beat.after}s ` : ''}
                    {b.beat.id}
                  </span>
                ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
