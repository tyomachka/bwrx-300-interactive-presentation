/**
 * The Explore panel (Stage 5): X-ray, Section (with Plant / Reactor and one cut slider),
 * Isolate, Labels, Reset; and, while something is selected, its name, where it sits ("in ...",
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
  setSection,
  setSectionContext,
  toggleIsolate,
  toggleLabels,
  toggleSection,
  toggleXray,
} from '../interaction/exploreActions';
import { useExploreStore } from '../interaction/exploreStore';
import { COMPONENTS, selectableParent } from '../scene/components';
import { useAppStore } from '../state/store';

const IDLE_HIDE_MS = 2500;

export function ExplorePanel() {
  const ready = useAppStore((s) => s.status === 'ready');
  const mode = useExploreStore((s) => s.mode);
  const selectedId = useExploreStore((s) => s.selectedId);
  const xray = useExploreStore((s) => s.xray);
  const isolate = useExploreStore((s) => s.isolate);
  const labels = useExploreStore((s) => s.labels);
  const section = useExploreStore((s) => s.section);
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
    window.addEventListener('keydown', wake);
    return () => {
      window.removeEventListener('pointermove', wake);
      window.removeEventListener('pointerdown', wake);
      window.removeEventListener('keydown', wake);
      window.clearTimeout(timer);
    };
  }, []);

  const visible = ready && awake && mode === 'explore';
  const selected = selectedId ? COMPONENTS[selectedId] : null;
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
                in {COMPONENTS[parentId].label}
              </button>
            )}
            {!labels && <div className="explore__description">{selected.description}</div>}
          </div>
          <div className="explore__selection-actions">
            <button type="button" onClick={() => focus(selected.id)}>
              Focus
            </button>
            <button type="button" title="Shortcut: Esc" aria-label="Clear selection" onClick={() => clearSelection()}>
              ✕
            </button>
          </div>
        </div>
      )}
      <div className="explore__bar" role="toolbar" aria-label="Explore">
        <button type="button" aria-pressed={xray} title="Shortcut: X" onClick={() => toggleXray()}>
          X-ray
        </button>
        <button type="button" aria-pressed={section.on} title="Shortcut: C" onClick={() => toggleSection()}>
          Section
        </button>
        {section.on && (
          <div className="explore__section">
            <div className="explore__segmented" role="group" aria-label="Section context">
              {(['plant', 'reactor'] as const).map((context) => (
                <button key={context} type="button" aria-pressed={section.context === context} onClick={() => setSectionContext(context)}>
                  {context === 'plant' ? 'Plant' : 'Reactor'}
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
              aria-label="Cut position"
              onChange={(e) => setSection({ position: Number(e.currentTarget.value) }, { immediate: true })}
              // Hand keyboard focus back so the shortcuts keep working after dragging.
              onPointerUp={(e) => e.currentTarget.blur()}
            />
          </div>
        )}
        <button type="button" aria-pressed={isolate} disabled={!selected} title="Shortcut: I" onClick={() => toggleIsolate()}>
          Isolate
        </button>
        <button type="button" aria-pressed={labels} title="Shortcut: L" onClick={() => toggleLabels()}>
          Labels
        </button>
        <button type="button" title="Shortcut: R" onClick={() => void resetPresentation()}>
          Reset
        </button>
      </div>
    </div>
  );
}
