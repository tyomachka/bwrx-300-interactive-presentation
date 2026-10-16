/**
 * Presentation v1 debug panel (`?presentationDebug`, or `?debug` / dev with the T key): jump to any
 * chapter or beat (settled, or replaying its entry), step, inspect the current beat and copy the
 * camera pose. Never part of the audience view: it only exists with those flags.
 */
import { useEffect, useState } from 'react';
import { cameraDirector } from '../../camera/cameraDirector';
import { CHAPTERS } from '../chapters';
import { beatTime } from '../runtime';
import { talk, TALK_BEATS, useTalkStore } from '../talk';
import { cues, world } from '../world';

export function TalkDebug() {
  const active = useTalkStore((s) => s.active);
  const flat = useTalkStore((s) => s.flat);
  const mode = useTalkStore((s) => s.mode);
  const [, tick] = useState(0);
  const [open, setOpen] = useState(true);
  const beat = TALK_BEATS[flat]!;

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
        {beat.chapterIndex + 1}.{beat.beatIndex + 1} {beat.chapter.id} / {beat.beat.id} · {mode} · t {beatTime().toFixed(1)} s{talk.locked ? ' · locked' : ''}
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
          {CHAPTERS.map((chapter, ci) => (
            <div key={chapter.id} className="talk-debug__chapter">
              <span className="talk-debug__chapter-name">
                {ci + 1}. {chapter.id} <em>{chapter.speaker}</em>
              </span>
              {chapter.beats.map((b) => {
                const index = TALK_BEATS.findIndex((r) => r.beat === b);
                return (
                  <button
                    key={b.id}
                    type="button"
                    className={index === flat ? 'is-current' : ''}
                    title={`${b.note}\n(click: settle, shift-click: play its entry)`}
                    onClick={(e) => talk.jump(index, e.shiftKey ? 'play' : 'settle')}
                  >
                    {b.id}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
