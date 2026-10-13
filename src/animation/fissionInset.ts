/**
 * Stage 10 fission inset state: a pure function of master time (config/fission.ts). The motion of
 * every particle is computed on the GPU from the same τ (scene/fission/fissionShaders.ts); this
 * module gives the frame-level values: iris, backdrop, warmth, particle and label visibility.
 * Quantised to 1 µs like the Stage 7-9 states, so playback, seek and export agree bit for bit.
 */
import { MathUtils } from 'three';
import { FISSION_LABELS, FISSION_TIMING as T } from '../config/fission';
import { masterSequence } from './masterSequence';

export interface FissionState {
  /** Anything of the inset drawn this frame. */
  active: boolean;
  /** Seconds since `fissionEnter`. */
  tau: number;
  marker: number;
  /** Scale of the micro view about the fuel spot (it grows out of and shrinks back into it). */
  zoom: number;
  /** Iris radius in screen half-heights around the fuel spot (0 = closed). */
  iris: number;
  backdrop: number;
  particles: number;
  /** Visibility of the energy / heat sprites (they outlast the nuclei and become the warm spot). */
  heat: number;
  labels: number[];
}

export function createFissionState(): FissionState {
  return { active: false, tau: 0, marker: 0, zoom: 1, iris: 0, backdrop: 0, particles: 0, heat: 0, labels: FISSION_LABELS.map(() => 0) };
}

const quantise = (t: number) => Math.round(t * 1e6) / 1e6;
const ease = (x: number, a: number, b: number) => MathUtils.smootherstep(x, a, b);
/** Up over `fade` after `a`, down over `fade` before `b`. */
const window = (x: number, a: number, b: number, fade = 0.18) => Math.min(ease(x, a, a + fade), 1 - ease(x, b - fade, b));

/** Iris that covers the whole frame from any fuel spot on screen. */
const IRIS_FULL = 2.8;
/** Smallest zoom: the size of the warm spot left on the fuel as the view closes. */
const SPOT_ZOOM = 0.035;

export function fissionAt(masterTime: number, out: FissionState = createFissionState()): FissionState {
  const t = quantise(masterTime);
  const tau = t - T.start;
  out.tau = tau;
  out.active = tau > 0 && t < T.end;
  if (!out.active) {
    out.marker = 0;
    out.zoom = 1;
    out.iris = 0;
    out.backdrop = 0;
    out.particles = 0;
    out.heat = 0;
    for (let i = 0; i < out.labels.length; i++) out.labels[i] = 0;
    return out;
  }
  const [m0, m1, m2] = T.marker;
  out.marker = Math.min(ease(tau, m0, m1), 1 - ease(tau, m1 + 0.12, m2));
  const open = ease(tau, T.irisOpen[0], T.irisOpen[1]);
  const close = ease(tau, T.irisClose[0], T.irisClose[1]);
  out.zoom = MathUtils.lerp(SPOT_ZOOM, 1, open) * MathUtils.lerp(1, SPOT_ZOOM, close);
  out.iris = IRIS_FULL * out.zoom;
  const spot = 1 - ease(tau, T.spotOut[0], T.spotOut[1]);
  out.backdrop = open * (1 - ease(tau, T.backdropOut[0], T.backdropOut[1]));
  out.particles = open * (1 - ease(tau, T.particlesOut[0], T.particlesOut[1]));
  out.heat = open * spot;
  for (let i = 0; i < FISSION_LABELS.length; i++) out.labels[i] = window(tau, FISSION_LABELS[i]!.window[0], FISSION_LABELS[i]!.window[1]) * out.particles;
  return out;
}

const frame = createFissionState();

/** This frame's inset: the master sequence's while it owns the scene, else nothing. */
export function fissionForFrame(): Readonly<FissionState> {
  return masterSequence.status !== 'idle' ? fissionAt(masterSequence.time, frame) : fissionAt(-1, frame);
}
