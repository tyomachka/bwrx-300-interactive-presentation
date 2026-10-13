/**
 * Stage 7: the natural circulation inside the vessel, every channel in one instanced draw call
 * (core water and boiling, chimney mixture, downcomer return, separator water and steam, dryer,
 * steam outlet). Particle positions are computed on the GPU from the flow time
 * (flowMaterials.ts); per frame the CPU writes a few uniforms.
 *
 * Drawn only with the vessel internals (interior level `reactor`: the vessel cut, or an X-rayed
 * vessel), so nothing is spent while the vessel is closed. It sits outside the plant hierarchy
 * on purpose: Explore picking and highlighting never see it.
 */
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { MathUtils, type Mesh, type PerspectiveCamera } from 'three';
import { heroReveal } from '../../animation/heroReveal';
import { flowForFrame } from '../../animation/operatingFlow';
import { VESSEL_FLOW_CHANNELS } from '../../config/flow';
import { useQualityPreset } from '../../state/store';
import { REACTOR_PRESSURE_VESSEL as RPV } from '../plant/dimensions';
import { Interior } from '../plant/section';
import { SECTION_PLANES } from '../section/sectionLayers';
import { buildVesselFlow } from './vesselFlowGeometry';

export function VesselFlow() {
  const density = useQualityPreset().particlesMultiplier;
  const { geometry, texture, material } = useMemo(() => buildVesselFlow(density), [density]);
  const gl = useThree((s) => s.gl);
  const mesh = useRef<Mesh>(null);

  useEffect(
    () => () => {
      geometry.dispose();
      texture.dispose();
      material.dispose();
    },
    [geometry, texture, material],
  );

  // After the reveal (RevealDriver, -90): this frame's vessel cut is in the section planes.
  useFrame(({ camera }) => {
    const flow = flowForFrame();
    const u = material.uniforms;
    let any = false;
    for (let i = 0; i < VESSEL_FLOW_CHANNELS.length; i++) {
      const v = flow.intensity[VESSEL_FLOW_CHANNELS[i]!];
      u.uIntensity.value[i] = v;
      any ||= v > 0.001;
    }
    if (mesh.current) mesh.current.visible = any;
    if (!any) return;
    u.uTime.value = flow.time;
    u.uBoil.value = flow.boil;
    u.uBoilShare.value = flow.boilShare;
    // The vessel's removed box: z > cutZ and x < xMax and y > floorY (sectionLayers.setBox).
    const planes = SECTION_PLANES.vessel;
    u.uCut.value.set(planes[0]!.constant, -planes[3]!.constant, planes[4]!.constant, 1);
    // Section-face streams only once the quarter is fully open (they stand at the cut planes).
    u.uFaceVisible.value = MathUtils.smoothstep(heroReveal.vesselCut, 0.97, 1);
    const fov = (camera as PerspectiveCamera).fov ?? 35;
    u.uPixelWorld.value = (2 * Math.tan((fov * Math.PI) / 360)) / Math.max(1, gl.domElement.height);
  }, -80);

  return (
    <Interior level="reactor">
      <group name="operating-flow.vessel" position-y={RPV.insideBottomY}>
        <mesh ref={mesh} geometry={geometry} material={material} frustumCulled={false} visible={false} />
      </group>
    </Interior>
  );
}
