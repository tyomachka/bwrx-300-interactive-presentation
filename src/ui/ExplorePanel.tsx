/**
 * The Explore panel (Stage 5): X-ray, Section (with Plant / Reactor and one cut slider),
 * Flow (Stage 7), Control (Stage 8: one blade slider, withdrawn on the left, inserted on the
 * right; no numbers, the scene shows the effect), Safety (Stage 9: the passive isolation-condenser
 * loop; no dashboard), Isolate, Labels, Reset; and, while something is selected, its name, where it sits ("in ...",
 * one click selects the parent) and Focus / Clear.
 *
 * Same visual language and auto-hide as the setup controls: it fades after a few seconds
 * without pointer movement so it never sits in the projected image, and it is hidden while a
 * cinematic plays. Every control calls an action in interaction/exploreActions.ts.
 */
import { useEffect, useRef, useState } from 'react';
import { resetPresentation } from '../animation/presentation';
import {
  clearSelection,
  focus,
  select,
  setControlAmount,
  setSection,
  setSectionContext,
  toggleControl,
  toggleFlow,
  toggleIsolate,
  toggleLabels,
  toggleSafety,
  toggleSection,
  toggleXray,
} from '../interaction/exploreActions';
import { useExploreStore } from '../interaction/exploreStore';
import { labelLayer } from '../interaction/labelLayer';
import { componentText, insideText } from '../i18n/components';
import { useLanguageStore } from '../i18n/language';
import { useStrings } from '../i18n/strings';
import { selectableParent } from '../scene/components';
import { useAppStore } from '../state/store';

const IDLE_HIDE_MS = 2500;

export function ExplorePanel() {
  const ready = useAppStore((s) => s.status === 'ready');
  const mode = useExploreStore((s) => s.mode);
  const selectedId = useExploreStore((s) => s.selectedId);
  const xray = useExploreStore((s) => s.xray);
  const isolate = useExploreStore((s) => s.isolate);
  const labels = useExploreStore((s) => s.labels);
  const flow = useExploreStore((s) => s.flow);
  const control = useExploreStore((s) => s.control);
  const controlAmount = useExploreStore((s) => s.controlAmount);
  const safety = useExploreStore((s) => s.safety);
  const section = useExploreStore((s) => s.section);
  const language = useLanguageStore((s) => s.language);
  const t = useStrings();
  const e = t.explore;
  const [awake, setAwake] = useState(false);
  const hovered = useRef(false);
  const bar = useRef<HTMLDivElement>(null);

  // Tell the label layer where the bar is, so the selection label never sits on it when it wraps.
  useEffect(() => {
    const el = bar.current;
    const stage = el?.closest('.stage');
    if (!el || !stage) return;
    const observer = new ResizeObserver(() => {
      const s = stage.getBoundingClientRect();
      const b = el.getBoundingClientRect();
      labelLayer.bar = { left: b.left - s.left, right: b.right - s.left, fromBottom: s.bottom - b.top };
    });
    observer.observe(el);
    return () => observer.disconnect();
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
    window.addEventListener('keydown', wake);
    return () => {
      window.removeEventListener('pointermove', wake);
      window.removeEventListener('pointerdown', wake);
      window.removeEventListener('keydown', wake);
      window.clearTimeout(timer);
    };
  }, []);

  const visible = ready && awake && mode === 'explore';
  const selected = selectedId ? { id: selectedId, ...componentText(selectedId, language) } : null;
  const parentId = selectedId ? selectableParent(selectedId) : null;

  return (
    <div
      className={`explore${visible ? '' : ' is-hidden'}`}
      onPointerEnter={() => (hovered.current = true)}
      onPointerLeave={() => (hovered.current = false)}
    >
      {selected && (
        <div className="explore__selection">
          <div className="explore__selection-text">
            <div className="explore__name">{selected.label}</div>
            {parentId && (
              <button type="button" className="explore__parent" onClick={() => select(parentId)}>
                {insideText(parentId, language)}
              </button>
            )}
            {!labels && <div className="explore__description">{selected.description}</div>}
          </div>
          <div className="explore__selection-actions">
            <button type="button" onClick={() => focus(selected.id)}>
              {e.focus}
            </button>
            <button type="button" title={t.shortcut('Esc')} aria-label={e.clearSelection} onClick={() => clearSelection()}>
              ✕
            </button>
          </div>
        </div>
      )}
      <div ref={bar} className="explore__bar" role="toolbar" aria-label={e.toolbar}>
        <button type="button" aria-pressed={xray} title={t.shortcut('X')} onClick={() => toggleXray()}>
          {e.xray}
        </button>
        <button type="button" aria-pressed={section.on} title={t.shortcut('C')} onClick={() => toggleSection()}>
          {e.section}
        </button>
        {section.on && (
          <div className="explore__section">
            <div className="segmented" role="group" aria-label={e.sectionContext}>
              {(['plant', 'reactor'] as const).map((context) => (
                <button key={context} type="button" aria-pressed={section.context === context} onClick={() => setSectionContext(context)}>
                  {context === 'plant' ? e.plant : e.reactor}
                </button>
              ))}
            </div>
            <input
              className="explore__slider"
              type="range"
              min={0}
              max={1}
              step={0.005}
              value={section.position}
              aria-label={e.cutPosition}
              onChange={(e) => setSection({ position: Number(e.currentTarget.value) }, { immediate: true })}
              // Hand keyboard focus back so the shortcuts keep working after dragging.
              onPointerUp={(e) => e.currentTarget.blur()}
            />
          </div>
        )}
        <button type="button" aria-pressed={flow} title={t.shortcut('F')} onClick={() => toggleFlow()}>
          {e.flow}
        </button>
        <button type="button" aria-pressed={control} title={t.shortcut('O')} onClick={() => toggleControl()}>
          {e.control}
        </button>
        {control && (
          <div className="explore__control">
            <input
              className="explore__slider"
              type="range"
              min={0}
              max={1}
              step={0.005}
              value={controlAmount}
              aria-label={e.controlSlider}
              title={e.controlSliderTitle}
              onChange={(e) => setControlAmount(Number(e.currentTarget.value))}
              onPointerUp={(e) => e.currentTarget.blur()}
            />
          </div>
        )}
        <button type="button" aria-pressed={safety} title={e.safetyTitle} onClick={() => toggleSafety()}>
          {e.safety}
        </button>
        <button type="button" aria-pressed={isolate} disabled={!selected} title={t.shortcut('I')} onClick={() => toggleIsolate()}>
          {e.isolate}
        </button>
        <button type="button" aria-pressed={labels} title={t.shortcut('L')} onClick={() => toggleLabels()}>
          {e.labels}
        </button>
        <button type="button" title={t.shortcut('R')} onClick={() => void resetPresentation()}>
          {e.reset}
        </button>
      </div>
    </div>
  );
}
