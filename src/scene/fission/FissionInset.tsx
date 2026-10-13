/**
 * Stage 10: the microscopic fission inset over the core hold (16.0-20.5 s). A camera-space
 * overlay in the normal render pass (fissionShaders.ts): an iris opens from one spot on the fuel,
 * a neutron is absorbed by a U-235 nucleus, which splits into two fragments and releases three
 * neutrons; one reaches a second nucleus (the chain); the fragments' energy becomes heat, and the
 * view closes back onto the fuel as warmth before the Stage 7 flow begins.
 *
 * State is a pure function of master time (animation/fissionInset.ts); the particles' motion is
 * computed on the GPU from it. Outside the window, and in Explore, nothing is drawn. It sits
 * outside the plant hierarchy, so picking and highlighting never see it; nothing casts shadows.
 */
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import type { Group, Mesh } from 'three';
import { fissionForFrame } from '../../animation/fissionInset';
import { FISSION_TIMING as T } from '../../config/fission';
import { useQualityPreset } from '../../state/store';
import { buildInset, insetDebug } from './buildInset';

/** Drawn last, in this order, over everything (the transparent pass sorts by renderOrder first). */
const ORDER = { backdrop: 900, particles: 901, sprites: 902, labels: 903 } as const;

export function FissionInset() {
  const lod = useQualityPreset().geometryLod;
  const inset = useMemo(() => buildInset(lod), [lod]);
  const gl = useThree((s) => s.gl);
  const group = useRef<Group>(null);
  const backdrop = useRef<Mesh>(null);
  const particles = useRef<Mesh>(null);
  const sprites = useRef<Mesh>(null);
  const labels = useRef<Mesh>(null);

  useEffect(() => () => inset.dispose(), [inset]);

  useFrame(() => {
    const s = fissionForFrame();
    if (group.current) group.current.visible = s.active;
    if (!s.active) return;
    const { shared, parts } = inset;
    shared.uTau.value = s.tau;
    shared.uIris.value = s.iris;
    shared.uZoom.value = s.zoom;
    gl.getDrawingBufferSize(shared.uResolution.value);
    const b = parts.backdrop.material.uniforms;
    b.uOpacity.value = s.backdrop;
    b.uMarker.value = s.marker;
    parts.particles.material.uniforms.uAlpha.value = s.particles;
    parts.sprites.material.uniforms.uAlpha.value = s.heat;
    const labelAlpha = parts.labels.material.uniforms.uLabelAlpha.value;
    let anyLabel = false;
    for (let i = 0; i < s.labels.length; i++) {
      labelAlpha[i] = s.labels[i]!;
      anyLabel ||= s.labels[i]! > 0.002;
    }
    // Draw only what can show this frame.
    if (backdrop.current) backdrop.current.visible = s.backdrop > 0.002 || s.marker > 0.002;
    if (particles.current) particles.current.visible = s.particles > 0.002;
    if (sprites.current) sprites.current.visible = s.heat > 0.002 && s.tau >= T.split;
    if (labels.current) labels.current.visible = anyLabel;
    for (const [name, ref] of [['backdrop', backdrop], ['particles', particles], ['sprites', sprites], ['labels', labels]] as const) if (ref.current && insetDebug.hide.has(name)) ref.current.visible = false;
  }, -80);

  const { parts } = inset;
  return (
    <group ref={group} name="fission-inset" visible={false}>
      <mesh ref={backdrop} name="fission-inset.backdrop" geometry={parts.backdrop.geometry} material={parts.backdrop.material} renderOrder={ORDER.backdrop} frustumCulled={false} />
      <mesh ref={particles} name="fission-inset.particles" geometry={parts.particles.geometry} material={parts.particles.material} renderOrder={ORDER.particles} frustumCulled={false} />
      <mesh ref={sprites} name="fission-inset.sprites" geometry={parts.sprites.geometry} material={parts.sprites.material} renderOrder={ORDER.sprites} frustumCulled={false} />
      <mesh ref={labels} name="fission-inset.labels" geometry={parts.labels.geometry} material={parts.labels.material} renderOrder={ORDER.labels} frustumCulled={false} />
    </group>
  );
}
