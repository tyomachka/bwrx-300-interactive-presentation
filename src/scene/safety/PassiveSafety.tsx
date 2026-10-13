/**
 * Stage 9 passive safety in the scene: the per-frame safety driver and the ICS loop's cues.
 *
 *  - SafetyDriver advances the safety state once per frame (animation/passiveSafety.ts: the
 *    master sequence while it owns the scene, else Explore Safety), after the clock and before
 *    the cues read it.
 *  - IcsFlow: steam up the supply lines and along the upper headers, condensing steam down the
 *    IC tubes, condensate back down to the vessel (the Stage 7 pulse-tube shader, one draw
 *    call), and the warm water rising from the tubes into the pool (the Stage 7 streak shader
 *    with its own streamlines, one draw call). Both reuse Stage 7's programs.
 *  - DecayHeat: the vessel's faint warm tint (decayHeatMaterial.ts), one draw call.
 *
 * Like the operating flow it sits outside the plant hierarchy, so picking and highlighting never
 * see it; it draws nothing while its channels are off. The ICS cues are drawn with the pools
 * (interior level `pools`) after the see-through pool water (renderOrder), so they stay crisp.
 */
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { Color, Float32BufferAttribute, InstancedBufferAttribute, InstancedBufferGeometry, type Mesh, type PerspectiveCamera } from 'three';
import { animationClock } from '../../animation/clock';
import { advanceSafety, safetyForFrame } from '../../animation/passiveSafety';
import { SAFETY_LOOK } from '../../config/safety';
import { useQualityPreset } from '../../state/store';
import { seededRandom } from '../flow/flowPaths';
import { createPathTexture, createPulseMaterial, createStreakMaterial } from '../flow/flowMaterials';
import { Interior } from '../plant/section';
import { SECTION_PLANES } from '../section/sectionLayers';
import { buildDecayHeat } from './decayHeatMaterial';
import { buildIcsFlow, buildPlumePaths, ICS_SLOT, safetyStats } from './icsLayout';

/** Drawn after the see-through pool water (transparent pass). */
const AFTER_WATER = 1;

function SafetyDriver() {
  useFrame(() => void advanceSafety(animationClock.lastStep), -95);
  return null;
}

function buildPlume(density: number) {
  const set = buildPlumePaths(density);
  const texture = createPathTexture(set.data, set.rows);
  const count = set.rows * set.perPath;
  const aPath = new Float32Array(count * 4);
  const aSeed = new Float32Array(count * 4);
  const rnd = seededRandom('ics-plume:particles');
  for (let row = 0, k = 0; row < set.rows; row++) {
    const offset = rnd();
    for (let j = 0; j < set.perPath; j++, k++) {
      aPath.set([row, set.durations[row]!, 0, 0], k * 4);
      // Kind 1: never a bubble (and the boil cue is 0 anyway).
      aSeed.set([(offset + (j + 0.6 * rnd()) / set.perPath) % 1, 1, 0.8 + 0.4 * rnd(), 0], k * 4);
    }
  }
  const geometry = new InstancedBufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
  geometry.setIndex([0, 1, 2, 0, 2, 3]);
  geometry.setAttribute('aPath', new InstancedBufferAttribute(aPath, 4));
  geometry.setAttribute('aSeed', new InstancedBufferAttribute(aSeed, 4));
  geometry.instanceCount = count;
  const material = createStreakMaterial(texture);
  const P = SAFETY_LOOK.plume;
  const u = material.uniforms;
  (u.uWaterColor!.value as Color).set(P.color);
  u.uWater!.value.set(P.alpha, P.length, P.width, 0);
  Object.assign(safetyStats, { plumeParticles: count, plumePaths: set.rows });
  return { geometry, texture, material };
}

function IcsFlow() {
  const density = useQualityPreset().particlesMultiplier;
  const flow = useMemo(() => {
    const { geometry, slotLength } = buildIcsFlow();
    const L = SAFETY_LOOK;
    safetyStats.flowVertices = geometry.getAttribute('position').count;
    return { geometry, slotLength, material: createPulseMaterial([L.steam, L.condensing, L.condensate]) };
  }, []);
  const plume = useMemo(() => buildPlume(density), [density]);
  const gl = useThree((s) => s.gl);
  const flowRef = useRef<Mesh>(null);
  const plumeRef = useRef<Mesh>(null);

  useEffect(
    () => () => {
      flow.geometry.dispose();
      flow.material.dispose();
    },
    [flow],
  );
  useEffect(
    () => () => {
      plume.geometry.dispose();
      plume.texture.dispose();
      plume.material.dispose();
    },
    [plume],
  );

  useFrame(({ camera }) => {
    const s = safetyForFrame();
    const { slotLength } = flow;
    const u = flow.material.uniforms;
    u.uTime.value = s.time;
    // Fronts in metres along each slot's longest run (+1.6: the soft edge is fully past the end).
    const front = (progress: number, length: number) => progress * (length + 1.6);
    u.uState.value[ICS_SLOT.steam]!.set(s.intensity.icsSteam, front(s.steamFront, slotLength.steam), SAFETY_LOOK.steam.alpha, 0);
    u.uState.value[ICS_SLOT.condensing]!.set(s.intensity.icsCondensing, front(s.condensingFront, slotLength.condensing), SAFETY_LOOK.condensing.alpha, 0);
    u.uState.value[ICS_SLOT.condensate]!.set(s.intensity.icsCondensate, front(s.condensateFront, slotLength.condensate), SAFETY_LOOK.condensate.alpha, 0);
    const flowOn = s.intensity.icsSteam > 0.001 || s.intensity.icsCondensing > 0.001 || s.intensity.icsCondensate > 0.001;
    if (flowRef.current) flowRef.current.visible = flowOn;

    const heat = s.intensity.poolHeat;
    if (plumeRef.current) plumeRef.current.visible = heat > 0.001;
    if (heat <= 0.001) return;
    const p = plume.material.uniforms;
    p.uTime.value = s.time;
    p.uIntensity.value[0] = heat;
    const fov = (camera as PerspectiveCamera).fov ?? 35;
    p.uPixelWorld.value = (2 * Math.tan((fov * Math.PI) / 360)) / Math.max(1, gl.domElement.height);
  }, -80);

  return (
    <Interior level="pools">
      <mesh ref={flowRef} name="ics-flow.lines" geometry={flow.geometry} material={flow.material} renderOrder={AFTER_WATER} visible={false} />
      <mesh ref={plumeRef} name="ics-flow.pool-heat" geometry={plume.geometry} material={plume.material} renderOrder={AFTER_WATER} frustumCulled={false} visible={false} />
    </Interior>
  );
}

function DecayHeat() {
  const { geometry, material } = useMemo(() => buildDecayHeat(), []);
  const mesh = useRef<Mesh>(null);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  // After the reveal (-90): this frame's vessel cut is in the section planes.
  useFrame(() => {
    const level = safetyForFrame().intensity.decayHeat;
    if (mesh.current) mesh.current.visible = level > 0.001;
    if (level <= 0.001) return;
    const u = material.uniforms;
    u.uLevel.value = level * SAFETY_LOOK.decayHeat.alpha;
    const planes = SECTION_PLANES.vessel;
    u.uCut.value.set(planes[0]!.constant, -planes[3]!.constant, planes[4]!.constant, 1);
  }, -80);

  return (
    <Interior level="vessel">
      <mesh ref={mesh} name="decay-heat" geometry={geometry} material={material} visible={false} />
    </Interior>
  );
}

export function PassiveSafety() {
  return (
    <group name="passive-safety">
      <SafetyDriver />
      <IcsFlow />
      <DecayHeat />
    </group>
  );
}
