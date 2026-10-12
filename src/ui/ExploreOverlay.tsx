/**
 * Explore labels (Stage 5): one primary label for the selection (name + one sentence), an anchor
 * dot, and a name-only hover tag. React renders the text when the selection or hover changes;
 * interaction/labelLayer.ts positions the elements every frame without re-rendering.
 */
import { useLayoutEffect, useRef } from 'react';
import { useExploreStore } from '../interaction/exploreStore';
import { labelLayer } from '../interaction/labelLayer';
import { COMPONENTS } from '../scene/components';

export function ExploreOverlay() {
  const selectedId = useExploreStore((s) => (s.mode === 'explore' ? s.selectedId : null));
  const hoveredId = useExploreStore((s) => (s.mode === 'explore' ? s.hoveredId : null));
  const primary = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const hover = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    labelLayer.primary = primary.current;
    labelLayer.dot = dot.current;
    labelLayer.hover = hover.current;
    return () => {
      labelLayer.primary = labelLayer.dot = labelLayer.hover = null;
    };
  }, []);

  const selected = selectedId ? COMPONENTS[selectedId] : null;
  const hovered = hoveredId ? COMPONENTS[hoveredId] : null;

  return (
    <div className="explore-overlay" aria-live="polite">
      <div ref={dot} className="explore-dot" style={{ visibility: 'hidden' }} />
      <div ref={primary} className="explore-label" style={{ visibility: 'hidden' }}>
        {selected && (
          <>
            <div className="explore-label__name">{selected.label}</div>
            <div className="explore-label__text">{selected.description}</div>
          </>
        )}
      </div>
      <div ref={hover} className="explore-hover" style={{ visibility: 'hidden' }}>
        {hovered?.label}
      </div>
    </div>
  );
}
