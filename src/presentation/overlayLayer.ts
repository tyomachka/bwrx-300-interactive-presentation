/**
 * Per-frame placement of the talk's on-screen copy. React renders the beat's elements when the
 * beat or the language changes (presentation/ui/TalkOverlay.tsx) and registers them here; the
 * in-canvas driver then positions anchored labels, counts numbers up, steps the time counter,
 * fills progress bars and paints the dip with direct style writes only: a moving camera never
 * re-renders React.
 *
 * Anchored labels (role 1) all share one geometry: the element's origin is the anchor itself; CSS
 * draws the dot there, the leader along (--dx, --dy) and the text beyond the leader's end.
 */
import { Vector3, type Camera } from 'three';
import type { Language } from '../i18n/language';
import { dip } from './runtime';
import { microView, type MicroPath } from './scene/chainConfig';
import { cue } from './world';

type Leader = readonly [number, number];

/** Last leader geometry written (dx, dy in stage px). */
interface LeaderState {
  drawn?: [number, number];
}

export interface AnchorEntry extends LeaderState {
  el: HTMLElement;
  at: Vector3;
  cue?: string;
  /** The text's offset from the anchor (px at 1080p). */
  leader?: Leader;
  /** Or: the leader runs from the anchor to this fixed stage point (px at 1080p). */
  leaderTo?: Leader;
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

export interface MicroEntry extends LeaderState {
  el: HTMLElement;
  /** A fixed point, or the offset from the particle on `path` (micro units). */
  at: readonly [number, number];
  path?: MicroPath;
  window: readonly [number, number];
  leader: Leader;
}

export const overlayLayer = {
  anchors: new Map<string, AnchorEntry>(),
  /** Labels in the fission micro view (micro units, shown in a τ window of each loop). */
  micro: new Map<string, MicroEntry>(),
  counts: new Map<string, CountEntry>(),
  counters: new Map<string, CounterEntry>(),
  /** Elements whose opacity follows a cue (fade in once). */
  cued: new Map<string, { el: HTMLElement; cue: string }>(),
  /** Elements that read a cue's progress as the CSS variable --p (the construction timeline). */
  progress: new Map<string, { el: HTMLElement; cue: string; shown: string }>(),
  dip: null as HTMLElement | null,
};

const _v = new Vector3();

/** Thousands grouping as each language writes it (LT: a narrow space; EN: a comma). */
export function formatNumber(value: number, decimals: number, group: boolean, language: Language): string {
  const fixed = value.toFixed(decimals);
  if (!group) return language === 'lt' ? fixed.replace('.', ',') : fixed;
  const [int, frac] = fixed.split('.');
  const grouped = int!.replace(/\B(?=(\d{3})+(?!\d))/g, language === 'lt' ? ' ' : ',');
  return frac ? `${grouped}${language === 'lt' ? ',' : '.'}${frac}` : grouped;
}

const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);

const hide = (el: HTMLElement) => {
  if (el.style.visibility !== 'hidden') el.style.visibility = 'hidden';
};

export function updateOverlay(camera: Camera, width: number, height: number): void {
  const layer = overlayLayer;
  if (layer.dip) {
    const o = dip.value.toFixed(3);
    if (layer.dip.style.opacity !== o) layer.dip.style.opacity = o;
  }
  const k = height / 1080;

  camera.updateMatrixWorld();
  for (const a of layer.anchors.values()) {
    _v.copy(a.at).applyMatrix4(camera.matrixWorldInverse);
    const fade = a.cue ? cue(a.cue) : 1;
    if (_v.z > -0.5 || fade <= 0.001) {
      hide(a.el);
      continue;
    }
    _v.copy(a.at).project(camera);
    const x = ((_v.x + 1) / 2) * width;
    const y = ((1 - _v.y) / 2) * height;
    const dx = a.leaderTo ? a.leaderTo[0] * k - x : (a.leader?.[0] ?? 28) * k;
    const dy = a.leaderTo ? a.leaderTo[1] * k - y : (a.leader?.[1] ?? 0) * k;
    placeLeader(a.el, a, x, y, dx, dy, Math.min(1, fade * 1.5));
  }

  // Fission micro labels: micro units -> NDC exactly as the inset shaders map them (zoom about the spot).
  const aspect = width / Math.max(1, height);
  for (const m of layer.micro.values()) {
    const [w0, w1] = m.window;
    const t = microView.tau;
    const env = Math.min(Math.max((t - w0) / 0.25, 0), 1) * Math.min(Math.max((w1 - t) / 0.25, 0), 1);
    const o = microView.active ? env * microView.alpha : 0;
    if (o <= 0.002) {
      hide(m.el);
      continue;
    }
    let ax = m.at[0];
    let ay = m.at[1];
    if (m.path) {
      // The particle's position exactly as the shader moves it.
      const { from, to, t: [t0, t1], power } = m.path;
      const x = Math.min(Math.max((t - t0) / (t1 - t0), 0), 1);
      const e = power === 1 ? x : 1 - Math.pow(1 - x, power);
      ax += from[0] + (to[0] - from[0]) * e;
      ay += from[1] + (to[1] - from[1]) * e;
    }
    const sx = microView.spot[0] * aspect;
    const sy = microView.spot[1];
    const mx = sx + (ax - sx) * microView.zoom;
    const my = sy + (ay - sy) * microView.zoom;
    const x = ((mx / aspect + 1) / 2) * width;
    const y = ((1 - my) / 2) * height;
    placeLeader(m.el, m, x, y, m.leader[0] * k, m.leader[1] * k, o);
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
 * A label whose origin is its anchor (stage px x, y). Only the geometry is written here: the dot at
 * the origin, the leader along (dx, dy), the text beside the leader's end for a mostly horizontal
 * leader, above / below it otherwise.
 */
function placeLeader(el: HTMLElement, state: LeaderState, x: number, y: number, dx: number, dy: number, opacity: number): void {
  if (!state.drawn || Math.abs(state.drawn[0] - dx) > 0.05 || Math.abs(state.drawn[1] - dy) > 0.05) {
    const style = el.style;
    style.setProperty('--dx', `${dx.toFixed(2)}px`);
    style.setProperty('--dy', `${dy.toFixed(2)}px`);
    style.setProperty('--len', `${Math.hypot(dx, dy).toFixed(2)}px`);
    style.setProperty('--angle', `${Math.atan2(dy, dx).toFixed(4)}rad`);
    const horizontal = Math.abs(dx) >= Math.abs(dy) * 0.5;
    style.setProperty('--bx', horizontal ? (dx >= 0 ? '0%' : '-100%') : '-50%');
    style.setProperty('--by', horizontal ? '-50%' : dy < 0 ? '-100%' : '0%');
    state.drawn = [dx, dy];
  }
  el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
  el.style.opacity = opacity.toFixed(3);
  if (el.style.visibility !== 'visible') el.style.visibility = 'visible';
}
