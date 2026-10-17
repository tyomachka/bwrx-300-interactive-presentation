/**
 * Per-frame placement of the talk's on-screen copy. React renders the beat's elements when the
 * beat or the language changes (presentation/ui/TalkOverlay.tsx) and registers them here; the
 * in-canvas driver then positions anchored labels, counts numbers up, steps the time counter and
 * paints the dip with direct style writes only: a moving camera never re-renders React.
 */
import { Vector3, type Camera } from 'three';
import type { Language } from '../i18n/language';
import { dip } from './runtime';
import { microView } from './scene/chainConfig';
import { cue } from './world';

export interface AnchorEntry {
  el: HTMLElement;
  at: Vector3;
  side: 'left' | 'right' | 'up' | 'down';
  cue?: string;
  /** Design study: the element's origin sits on the anchor; the text is offset by this (px at 1080p) along a leader. */
  leader?: readonly [number, number];
  /** Design study: the leader runs from the anchor to this fixed stage point (px at 1080p). */
  leaderTo?: readonly [number, number];
  /** Last leader geometry written (dx, dy in stage px). */
  drawn?: [number, number];
}

export interface CountEntry {
  el: HTMLElement;
  cue: string;
  from: number;
  to: number;
  decimals: number;
  group: boolean;
  prefix: string;
  suffix: string;
  language: Language;
  shown: string;
}

export interface CounterEntry {
  el: HTMLElement;
  bar: HTMLElement | null;
  cue: string;
  steps: readonly string[];
  shown: number;
}

export interface MicroEntry {
  el: HTMLElement;
  at: readonly [number, number];
  window: readonly [number, number];
  side: 'left' | 'right' | 'up' | 'down';
}

export const overlayLayer = {
  anchors: new Map<string, AnchorEntry>(),
  /** Labels in the fission micro view (micro units, shown in a τ window of each loop). */
  micro: new Map<string, MicroEntry>(),
  counts: new Map<string, CountEntry>(),
  counters: new Map<string, CounterEntry>(),
  /** Elements whose opacity follows a cue (fade in once). */
  cued: new Map<string, { el: HTMLElement; cue: string }>(),
  /** Design study: elements that read a cue's progress as the CSS variable --p (timeline fills). */
  progress: new Map<string, { el: HTMLElement; cue: string; shown: string }>(),
  dip: null as HTMLElement | null,
};

const _v = new Vector3();
const GAP = 14;

/** Thousands grouping as each language writes it (LT: a narrow space; EN: a comma). */
export function formatNumber(value: number, decimals: number, group: boolean, language: Language): string {
  const fixed = value.toFixed(decimals);
  if (!group) return language === 'lt' ? fixed.replace('.', ',') : fixed;
  const [int, frac] = fixed.split('.');
  const grouped = int!.replace(/\B(?=(\d{3})+(?!\d))/g, language === 'lt' ? ' ' : ',');
  return frac ? `${grouped}${language === 'lt' ? ',' : '.'}${frac}` : grouped;
}

const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);

export function updateOverlay(camera: Camera, width: number, height: number): void {
  const layer = overlayLayer;
  if (layer.dip) {
    const o = dip.value.toFixed(3);
    if (layer.dip.style.opacity !== o) layer.dip.style.opacity = o;
  }

  camera.updateMatrixWorld();
  for (const a of layer.anchors.values()) {
    _v.copy(a.at).applyMatrix4(camera.matrixWorldInverse);
    const fade = a.cue ? cue(a.cue) : 1;
    if (_v.z > -0.5 || fade <= 0.001) {
      if (a.el.style.visibility !== 'hidden') a.el.style.visibility = 'hidden';
      continue;
    }
    _v.copy(a.at).project(camera);
    const x = ((_v.x + 1) / 2) * width;
    const y = ((1 - _v.y) / 2) * height;
    if (a.leader || a.leaderTo) {
      placeLeader(a, x, y, height, fade);
      continue;
    }
    const w = a.el.offsetWidth;
    const h = a.el.offsetHeight;
    let lx: number;
    let ly: number;
    if (a.side === 'right') {
      lx = x + GAP;
      ly = y - h / 2;
    } else if (a.side === 'left') {
      lx = x - GAP - w;
      ly = y - h / 2;
    } else if (a.side === 'up') {
      lx = x - w / 2;
      ly = y - GAP - h;
    } else {
      lx = x - w / 2;
      ly = y + GAP;
    }
    a.el.style.transform = `translate3d(${lx.toFixed(1)}px, ${ly.toFixed(1)}px, 0)`;
    a.el.style.opacity = fade.toFixed(3);
    if (a.el.style.visibility !== 'visible') a.el.style.visibility = 'visible';
  }

  // Fission micro labels: micro units -> NDC exactly as the inset shaders map them (zoom about the spot).
  const aspect = width / Math.max(1, height);
  for (const m of layer.micro.values()) {
    const [w0, w1] = m.window;
    const t = microView.tau;
    const env = Math.min(Math.max((t - w0) / 0.25, 0), 1) * Math.min(Math.max((w1 - t) / 0.25, 0), 1);
    const o = microView.active ? env * microView.alpha : 0;
    if (o <= 0.002) {
      if (m.el.style.visibility !== 'hidden') m.el.style.visibility = 'hidden';
      continue;
    }
    const sx = microView.spot[0] * aspect;
    const sy = microView.spot[1];
    const mx = sx + (m.at[0] - sx) * microView.zoom;
    const my = sy + (m.at[1] - sy) * microView.zoom;
    const x = ((mx / aspect + 1) / 2) * width;
    const y = ((1 - my) / 2) * height;
    const w = m.el.offsetWidth;
    const h = m.el.offsetHeight;
    const lx = m.side === 'left' ? x - w : m.side === 'right' ? x : x - w / 2;
    const ly = m.side === 'up' ? y - h : m.side === 'down' ? y : y - h / 2;
    m.el.style.transform = `translate3d(${lx.toFixed(1)}px, ${ly.toFixed(1)}px, 0)`;
    m.el.style.opacity = o.toFixed(3);
    if (m.el.style.visibility !== 'visible') m.el.style.visibility = 'visible';
  }

  for (const c of layer.counts.values()) {
    const p = easeOut(cue(c.cue));
    const text = `${c.prefix}${formatNumber(c.from + (c.to - c.from) * p, c.decimals, c.group, c.language)}${c.suffix}`;
    if (text !== c.shown) {
      c.el.textContent = text;
      c.shown = text;
    }
  }

  for (const c of layer.counters.values()) {
    const p = cue(c.cue);
    const index = Math.min(c.steps.length - 1, Math.floor(p * (c.steps.length - 1) + 1e-6));
    if (index !== c.shown) {
      c.el.textContent = c.steps[index]!;
      c.shown = index;
    }
    if (c.bar) c.bar.style.transform = `scaleX(${p.toFixed(4)})`;
  }

  for (const c of layer.progress.values()) {
    const p = cue(c.cue).toFixed(4);
    if (p !== c.shown) {
      c.el.style.setProperty('--p', p);
      c.shown = p;
    }
  }

  for (const c of layer.cued.values()) {
    const o = Math.min(1, cue(c.cue) * 1.5).toFixed(3);
    if (c.el.style.opacity !== o) c.el.style.opacity = o;
  }
}

/**
 * Design study: a label whose origin is the anchor point itself. CSS draws the dot at the origin, the
 * leader along (--dx, --dy) and the text beyond its end; only the geometry is written here.
 */
function placeLeader(a: AnchorEntry, x: number, y: number, height: number, fade: number): void {
  const k = height / 1080;
  const dx = a.leaderTo ? a.leaderTo[0] * k - x : a.leader![0] * k;
  const dy = a.leaderTo ? a.leaderTo[1] * k - y : a.leader![1] * k;
  if (!a.drawn || Math.abs(a.drawn[0] - dx) > 0.05 || Math.abs(a.drawn[1] - dy) > 0.05) {
    const style = a.el.style;
    style.setProperty('--dx', `${dx.toFixed(2)}px`);
    style.setProperty('--dy', `${dy.toFixed(2)}px`);
    style.setProperty('--len', `${Math.hypot(dx, dy).toFixed(2)}px`);
    style.setProperty('--angle', `${Math.atan2(dy, dx).toFixed(4)}rad`);
    // The text sits beyond the leader's end: beside it for a mostly horizontal leader, above / below otherwise.
    const horizontal = Math.abs(dx) >= Math.abs(dy) * 0.5;
    style.setProperty('--bx', horizontal ? (dx >= 0 ? '0%' : '-100%') : '-50%');
    style.setProperty('--by', horizontal ? '-50%' : dy < 0 ? '-100%' : '0%');
    a.drawn = [dx, dy];
  }
  a.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
  a.el.style.opacity = fade.toFixed(3);
  if (a.el.style.visibility !== 'visible') a.el.style.visibility = 'visible';
}
