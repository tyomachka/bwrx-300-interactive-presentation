/**
 * Deterministic multi-keyframe camera path for cinematic shots.
 *
 * Each keyframe is a named camera pose at a time. Between keyframes the camera moves the way
 * `interpolatePose` moves it for a single transition: the look-at target travels, and the
 * camera orbits it (log radius, polar angle, azimuth) instead of cutting straight through
 * the subject. Here every channel is a monotone cubic (Fritsch–Carlson / PCHIP) through all
 * keyframes in time, so:
 *  - velocity is continuous through intermediate keyframes (no stop-and-go, no snapping);
 *  - a channel never overshoots its keyframes (no wobble, no backwards drift);
 *  - the path starts and ends at rest (slow in, settle out);
 *  - the camera never rolls (the director uses lookAt with world up).
 * Evaluation is a pure function of time, so seeking and restarting are exact.
 */
import { Spherical, Vector3 } from 'three';
import type { CameraPose } from '../config/camera';
import type { LivePose } from './cameraDirector';

export interface TimedPose {
  time: number;
  pose: CameraPose;
}

interface Channel {
  values: number[];
  tangents: number[];
}

const _spherical = new Spherical();
const _offset = new Vector3();

/** PCHIP tangents (Fritsch–Butland weighted harmonic mean); zero at both ends. */
function monotoneTangents(times: readonly number[], values: readonly number[]): number[] {
  const n = values.length;
  const tangents = new Array<number>(n).fill(0);
  for (let k = 1; k < n - 1; k++) {
    const h0 = times[k]! - times[k - 1]!;
    const h1 = times[k + 1]! - times[k]!;
    const d0 = (values[k]! - values[k - 1]!) / h0;
    const d1 = (values[k + 1]! - values[k]!) / h1;
    if (d0 * d1 <= 0) continue; // local extremum or flat: hold still there
    const w0 = 2 * h1 + h0;
    const w1 = h1 + 2 * h0;
    tangents[k] = (w0 + w1) / (w0 / d0 + w1 / d1);
  }
  return tangents;
}

export class CameraPath {
  readonly startTime: number;
  readonly endTime: number;
  private readonly times: number[];
  private readonly channels: Channel[];

  constructor(keys: readonly TimedPose[]) {
    if (keys.length < 2) throw new Error('CameraPath needs at least two keyframes');
    this.times = keys.map((k) => k.time);
    for (let i = 1; i < this.times.length; i++) {
      if (!(this.times[i]! > this.times[i - 1]!)) throw new Error('CameraPath keyframe times must increase');
    }
    this.startTime = this.times[0]!;
    this.endTime = this.times[this.times.length - 1]!;

    // Channels: target xyz, log radius, polar angle, azimuth (unwrapped), fov.
    const rows: number[][] = [[], [], [], [], [], [], []];
    let previousTheta = 0;
    keys.forEach(({ pose }, i) => {
      _offset.fromArray(pose.position).sub(new Vector3().fromArray(pose.target));
      _spherical.setFromVector3(_offset);
      let theta = _spherical.theta;
      if (i > 0) {
        // Take the short way round between consecutive keyframes.
        while (theta - previousTheta > Math.PI) theta -= Math.PI * 2;
        while (theta - previousTheta < -Math.PI) theta += Math.PI * 2;
      }
      previousTheta = theta;
      rows[0]!.push(pose.target[0]);
      rows[1]!.push(pose.target[1]);
      rows[2]!.push(pose.target[2]);
      rows[3]!.push(Math.log(_spherical.radius));
      rows[4]!.push(_spherical.phi);
      rows[5]!.push(theta);
      rows[6]!.push(pose.fov);
    });
    this.channels = rows.map((values) => ({ values, tangents: monotoneTangents(this.times, values) }));
  }

  evaluate(time: number, out: LivePose): LivePose {
    const times = this.times;
    const t = Math.min(Math.max(time, this.startTime), this.endTime);
    let k = 0;
    while (k < times.length - 2 && t > times[k + 1]!) k++;
    const h = times[k + 1]! - times[k]!;
    const s = (t - times[k]!) / h;
    const s2 = s * s;
    const s3 = s2 * s;
    // Cubic Hermite basis; tangents are per second, so they scale with the segment length.
    const b00 = 2 * s3 - 3 * s2 + 1;
    const b10 = (s3 - 2 * s2 + s) * h;
    const b01 = -2 * s3 + 3 * s2;
    const b11 = (s3 - s2) * h;
    const [tx, ty, tz, logRadius, phi, theta, fov] = this.channels;
    const value = (c: Channel | undefined) =>
      b00 * c!.values[k]! + b10 * c!.tangents[k]! + b01 * c!.values[k + 1]! + b11 * c!.tangents[k + 1]!;

    out.target.set(value(tx), value(ty), value(tz));
    out.position.setFromSphericalCoords(Math.exp(value(logRadius)), value(phi), value(theta)).add(out.target);
    out.fov = value(fov);
    return out;
  }
}
