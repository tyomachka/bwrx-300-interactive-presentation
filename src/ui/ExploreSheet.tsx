/**
 * The explore-only page's controls (post-final compatibility: the phone / QR audience, app/entry.ts).
 * The same Explore actions as the desktop panel (ui/ExplorePanel.tsx), laid out for touch:
 *
 *  - a compact top strip: the model's name and LT | EN;
 *  - a collapsible bottom sheet: View (X-ray, Section with Plant / Reactor and the cut slider),
 *    Systems (Flow, Control with the blade slider, Safety), Inspect (Isolate, Labels, Reset), then
 *    quality and full screen, and one line on the gestures;
 *  - the selected component's card above it: name, "in ...", its sentence, Focus and clear. The label
 *    anchored in the scene shows the name only here (styles.css), so the two never repeat the text.
 *
 * Nothing here starts the talk or the 48 s film. Unlike the desktop bars it never fades by itself (a
 * finger cannot hover it back); it closes to one handle instead. On a phone in landscape it is a
 * side panel (styles.css), so the model keeps the height.
 */
import { useEffect, useRef, useState } from 'react';
import { resetPresentation } from '../animation/presentation';
import { HANDHELD } from '../app/entry';
import { QUALITY_PRESETS, type QualityLevel } from '../config/quality';
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
import { LanguageToggle } from './LanguageToggle';
import { toggleFullscreen } from './fullscreen';

const LEVELS = Object.keys(QUALITY_PRESETS) as QualityLevel[];

export function ExploreSheet() {
  const ready = useAppStore((s) => s.status === 'ready');
  const quality = useAppStore((s) => s.quality);
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
  const a = t.audience;
  const [open, setOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(() => document.fullscreenElement !== null);
  const canFullscreen = document.fullscreenEnabled === true && typeof document.documentElement.requestFullscreen === 'function';
  const strip = useRef<HTMLDivElement>(null);
  const sheet = useRef<HTMLDivElement>(null);

  // Keep the anchored label clear of the strip and the sheet: below the strip, above the sheet,
  // or left of it when it is a side panel (phone in landscape).
  useEffect(() => {
    const top = strip.current;
    const el = sheet.current;
    const stage = el?.closest('.stage');
    if (!top || !el || !stage) return;
    const update = () => {
      const s = stage.getBoundingClientRect();
      const b = el.getBoundingClientRect();
      const side = b.width < s.width * 0.6 && b.left > s.left + s.width * 0.4;
      labelLayer.reserve = { top: top.getBoundingClientRect().bottom - s.top, right: side ? s.right - b.left : 0 };
      labelLayer.bar = side ? { left: 0, right: 0, fromBottom: 0 } : { left: b.left - s.left, right: b.right - s.left, fromBottom: s.bottom - b.top };
    };
    const observer = new ResizeObserver(update);
    observer.observe(top);
    observer.observe(el);
    observer.observe(stage);
    return () => {
      observer.disconnect();
      labelLayer.reserve = { top: 0, right: 0 };
    };
  }, []);

  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement !== null);
    document.addEventListener('fullscreenchange', onChange);
    // iOS Safari ignores `user-scalable=no`: a pinch outside the canvas must not zoom the page.
    const noPageZoom = (event: Event) => event.preventDefault();
    document.addEventListener('gesturestart', noPageZoom);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      document.removeEventListener('gesturestart', noPageZoom);
    };
  }, []);

  const selected = selectedId ? { id: selectedId, ...componentText(selectedId, language) } : null;
  const parentId = selectedId ? selectableParent(selectedId) : null;
  const hidden = ready ? '' : ' is-hidden';

  return (
    <>
      <div ref={strip} className={`xs-top${hidden}`}>
        <div className="xs-top__title">
          <span className="xs-top__name">BWRX-300</span>
          <span className="xs-top__sub">{a.subtitle}</span>
        </div>
        <LanguageToggle className="xs-top__lang" />
      </div>
      <div ref={sheet} className={`xs${open ? ' is-open' : ''}${hidden}`}>
        {selected && (
          <div className="xs-card">
            <div className="xs-card__text">
              <div className="xs-card__name">{selected.label}</div>
              {parentId && (
                <button type="button" className="xs-card__parent" onClick={() => select(parentId)}>
                  {insideText(parentId, language)}
                </button>
              )}
              {!open && <div className="xs-card__description">{selected.description}</div>}
            </div>
            <div className="xs-card__actions">
              <button type="button" onClick={() => focus(selected.id)}>
                {e.focus}
              </button>
              <button type="button" aria-label={e.clearSelection} title={e.clearSelection} onClick={() => clearSelection()}>
                ✕
              </button>
            </div>
          </div>
        )}
        <div className="xs-panel">
          <button type="button" className="xs-handle" aria-expanded={open} aria-controls="xs-body" onClick={() => setOpen(!open)}>
            <span>{a.tools}</span>
            <span className="xs-handle__chevron" aria-hidden="true" />
          </button>
          {open && (
            <div id="xs-body" className="xs-body">
              <section className="xs-group" aria-label={a.view}>
                <h2 className="xs-group__title">{a.view}</h2>
                <div className="xs-group__row">
                  <button type="button" aria-pressed={xray} onClick={() => toggleXray()}>
                    {e.xray}
                  </button>
                  <button type="button" aria-pressed={section.on} onClick={() => toggleSection()}>
                    {e.section}
                  </button>
                </div>
                {section.on && (
                  <div className="xs-group__sub">
                    <div className="segmented" role="group" aria-label={e.sectionContext}>
                      {(['plant', 'reactor'] as const).map((context) => (
                        <button key={context} type="button" aria-pressed={section.context === context} onClick={() => setSectionContext(context)}>
                          {context === 'plant' ? e.plant : e.reactor}
                        </button>
                      ))}
                    </div>
                    <input
                      className="xs-slider"
                      type="range"
                      min={0}
                      max={1}
                      step={0.005}
                      value={section.position}
                      aria-label={e.cutPosition}
                      onChange={(ev) => setSection({ position: Number(ev.currentTarget.value) }, { immediate: true })}
                    />
                  </div>
                )}
              </section>
              <section className="xs-group" aria-label={a.systems}>
                <h2 className="xs-group__title">{a.systems}</h2>
                <div className="xs-group__row">
                  <button type="button" aria-pressed={flow} onClick={() => toggleFlow()}>
                    {e.flow}
                  </button>
                  <button type="button" aria-pressed={control} onClick={() => toggleControl()}>
                    {e.control}
                  </button>
                  <button type="button" aria-pressed={safety} title={e.safetyTitle} onClick={() => toggleSafety()}>
                    {e.safety}
                  </button>
                </div>
                {control && (
                  <div className="xs-group__sub">
                    <input
                      className="xs-slider"
                      type="range"
                      min={0}
                      max={1}
                      step={0.005}
                      value={controlAmount}
                      aria-label={e.controlSlider}
                      title={e.controlSliderTitle}
                      onChange={(ev) => setControlAmount(Number(ev.currentTarget.value))}
                    />
                  </div>
                )}
              </section>
              <section className="xs-group" aria-label={a.inspect}>
                <h2 className="xs-group__title">{a.inspect}</h2>
                <div className="xs-group__row">
                  <button type="button" aria-pressed={isolate} disabled={!selected} onClick={() => toggleIsolate()}>
                    {e.isolate}
                  </button>
                  <button type="button" aria-pressed={labels} onClick={() => toggleLabels()}>
                    {e.labels}
                  </button>
                  <button type="button" onClick={() => void resetPresentation()}>
                    {e.reset}
                  </button>
                </div>
              </section>
              <div className="xs-foot">
                <div className="segmented" role="group" aria-label={t.setup.qualityGroup}>
                  <span className="xs-foot__label">{t.setup.quality}</span>
                  {LEVELS.map((level) => (
                    <button key={level} type="button" aria-pressed={quality === level} onClick={() => useAppStore.getState().setQuality(level)}>
                      {t.setup.levels[level]}
                    </button>
                  ))}
                </div>
                {canFullscreen && (
                  <button type="button" onClick={() => void toggleFullscreen()}>
                    {fullscreen ? t.setup.exitFullScreen : t.setup.fullScreen}
                  </button>
                )}
              </div>
              <p className="xs-hint">{HANDHELD ? a.touchHint : a.mouseHint}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
