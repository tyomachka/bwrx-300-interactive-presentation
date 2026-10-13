/**
 * Stage 8 reactor control in the scene: the per-frame control driver and the core-activity cue.
 *
 * ControlDriver advances the control state once per frame (animation/reactorControl.ts: the
 * master sequence while it owns the scene, else Explore Control), after the clock and before the
 * reveal (RevealDriver, -90), the flow (-80) and the blades read it. It moves the blades through
 * the blade data (coreLayout.setBladeControl: the instanced renderer rewrites its 57 matrices only
 * on frames where the insertion changed) and sets Explore Control's copper emphasis.
 *
 * CoreActivity draws the glints (activityMaterial.ts): one draw call, nothing while the cue is
 * off. Like the flow it sits outside the plant hierarchy, so picking and highlighting never see
 * it, and it is drawn only with the vessel internals (interior level `reactor`).
 */
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { MathUtils, type Mesh, type PerspectiveCamera } from 'three';
import { animationClock } from '../../animation/clock';
import { heroReveal } from '../../animation/heroReveal';
import { advanceControl, controlForFrame } from '../../animation/reactorControl';
import { useQualityPreset } from '../../state/store';
import { REACTOR_PRESSURE_VESSEL as RPV } from '../plant/dimensions';
import { Interior } from '../plant/section';
import { CONTROL_BLADES, setBladeControl } from '../rpv/coreLayout';
import { SECTION_PLANES, setControlBladeEmphasis } from '../section/sectionLayers';
import { bladeTipH, buildActivity, TIP_BLADES } from './activityMaterial';

/** Explore's cue clock wraps (the glints are random anyway) so float precision never degrades. */
const EXPLORE_CLOCK_WRAP = 1200;

function ControlDriver() {
  useFrame(() => {
    const control = advanceControl(animationClock.lastStep);
    setBladeControl(control.bladeControlAmount);
    setControlBladeEmphasis(control.emphasis);
  }, -95);
  return null;
}

function CoreActivity() {
  const density = useQualityPreset().particlesMultiplier;
  const { geometry, material } = useMemo(() => buildActivity(density), [density]);
  const gl = useThree((s) => s.gl);
  const mesh = useRef<Mesh>(null);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  // After the reveal (-90): this frame's vessel cut is in the section planes.
  useFrame(({ camera }) => {
    const control = controlForFrame();
    const u = material.uniforms;
    // The glints stand on the fuel faces the quarter cut exposes: only once it is fully open.
    const visible = control.activity * MathUtils.smoothstep(heroReveal.vesselCut, 0.97, 1);
    if (mesh.current) mesh.current.visible = visible > 0.001;
    if (visible <= 0.001) return;
    u.uVisible.value = visible;
    u.uReaction.value = control.reactionIntensity;
    u.uTime.value = control.source === 'presentation' ? control.time : control.time % EXPLORE_CLOCK_WRAP;
    // The vessel's removed box ends at its floor (the core section step): no glints below it.
    u.uFloor.value = SECTION_PLANES.vessel[4]!.constant - RPV.insideBottomY;
    for (let i = 0; i < TIP_BLADES.length; i++) u.uTip.value[i] = bladeTipH(CONTROL_BLADES[TIP_BLADES[i]!]!.insertion);
    const fov = (camera as PerspectiveCamera).fov ?? 35;
    u.uPixelWorld.value = (2 * Math.tan((fov * Math.PI) / 360)) / Math.max(1, gl.domElement.height);
  }, -80);

  return (
    <Interior level="reactor">
      <group name="core-activity" position-y={RPV.insideBottomY}>
        <mesh ref={mesh} geometry={geometry} material={material} frustumCulled={false} visible={false} />
      </group>
    </Interior>
  );
}

export function ReactorControl() {
  return (
    <>
      <ControlDriver />
      <CoreActivity />
    </>
  );
}
