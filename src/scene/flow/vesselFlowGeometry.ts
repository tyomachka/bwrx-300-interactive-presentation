/**
 * Stage 7: the vessel flow's instanced geometry and material for one quality density. One quad
 * per particle; the per-instance attributes only say which streamline it follows and where on it
 * it starts (flowMaterials.ts computes the rest on the GPU).
 */
import { Float32BufferAttribute, InstancedBufferAttribute, InstancedBufferGeometry } from 'three';
import { VESSEL_FLOW_CHANNELS } from '../../config/flow';
import { buildVesselFlowPaths, seededRandom } from './flowPaths';
import { createPathTexture, createStreakMaterial } from './flowMaterials';

/** Counts of the last build (diagnostics, review report). */
export const vesselFlowStats = { paths: 0, particles: 0, perChannel: {} as Record<string, number> };

export function buildVesselFlow(density: number) {
  const set = buildVesselFlowPaths(density);
  const texture = createPathTexture(set.data, set.paths.length);
  const count = set.paths.reduce((n, p) => n + p.particles, 0);
  const aPath = new Float32Array(count * 4);
  const aSeed = new Float32Array(count * 4);
  const perChannel: Record<string, number> = {};
  const index = new Map<string, number>();
  let k = 0;
  set.paths.forEach((path, row) => {
    const n = (index.get(path.channel) ?? 0) + 1;
    index.set(path.channel, n);
    const rnd = seededRandom(`${path.channel}:${n}:particles`);
    const offset = rnd();
    for (let j = 0; j < path.particles; j++, k++) {
      aPath.set([row, path.duration, VESSEL_FLOW_CHANNELS.indexOf(path.channel), path.clip === 'face' ? 1 : 0], k * 4);
      aSeed.set([(offset + (j + 0.6 * rnd()) / path.particles) % 1, rnd(), 0.8 + 0.4 * rnd(), 0], k * 4);
    }
    perChannel[path.channel] = (perChannel[path.channel] ?? 0) + path.particles;
  });
  const geometry = new InstancedBufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
  geometry.setIndex([0, 1, 2, 0, 2, 3]);
  geometry.setAttribute('aPath', new InstancedBufferAttribute(aPath, 4));
  geometry.setAttribute('aSeed', new InstancedBufferAttribute(aSeed, 4));
  geometry.instanceCount = count;
  Object.assign(vesselFlowStats, { paths: set.paths.length, particles: count, perChannel });
  return { geometry, texture, material: createStreakMaterial(texture) };
}
