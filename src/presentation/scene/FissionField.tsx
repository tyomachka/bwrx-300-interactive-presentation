/**
 * Presentation v1 fission (Stage 3): the camera-space micro view of a chain reaction that branches and
 * then holds steady (presentation/scene/fieldConfig.ts). Driven by the talk's world channels:
 *   x.open  0 closed on the fuel spot .. 1 the micro view fills the frame
 *   x.spot  the warm spot left on the fuel once the view has closed ("this happens in the fuel")
 * The chain's own time starts when the view starts to open and keeps running while it is open (and
 * while it closes): the steady state holds as long as the presenter talks, never restarting.
 * The 48 s cinematic keeps its own inset (scene/fission/FissionInset.tsx), untouched.
 */
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { BufferGeometry, Float32BufferAttribute, IcosahedronGeometry, InstancedBufferGeometry, MathUtils, Vector3, type Group, type Mesh } from 'three';
import { animationClock } from '../../animation/clock';
import { FISSION_ANCHOR } from '../../scene/fission/buildInset';
import { fissionData } from '../../scene/fission/fissionData';
import { createBackdropMaterial, createInsetUniforms } from '../../scene/fission/fissionShaders';
import { useQualityPreset } from '../../state/store';
import { talk } from '../talk';
import { world } from '../world';
import { currentEntry } from '../runtime';
import { chainTime, fieldView, FIELD_TIMING, microView } from './fieldConfig';
import { createFieldParticles, createFieldSprites, particleInstances, spriteInstances } from './fieldShaders';

/** Drawn last, as the Stage 10 inset (the transparent pass sorts by renderOrder first). */
const ORDER = { backdrop: 900, particles: 901, sprites: 902 } as const;
const IRIS_FULL = 2.8;
const SPOT_ZOOM = 0.035;
const QUAD = [-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0];

function build(lod: 'high' | 'low') {
  const shared = createInsetUniforms(FISSION_ANCHOR.clone());
  const sphere = new IcosahedronGeometry(1, lod === 'high' ? 2 : 1);
  const particles = new InstancedBufferGeometry();
  particles.setAttribute('position', sphere.getAttribute('position'));
  particles.setAttribute('normal', sphere.getAttribute('normal'));
  const p = particleInstances();
  for (const [name, attribute] of Object.entries(p.attributes)) particles.setAttribute(name, attribute);
  particles.instanceCount = p.count;

  const quad = () => {
    const g = new InstancedBufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(QUAD, 3));
    g.setIndex([0, 1, 2, 0, 2, 3]);
    return g;
  };
  const backdrop = new BufferGeometry();
  backdrop.setAttribute('position', new Float32BufferAttribute(QUAD, 3));
  backdrop.setIndex([0, 1, 2, 0, 2, 3]);
  const sprites = quad();
  const s = spriteInstances();
  for (const [name, attribute] of Object.entries(s.attributes)) sprites.setAttribute(name, attribute);
  sprites.instanceCount = s.count;

  const parts = {
    backdrop: { geometry: backdrop as BufferGeometry, material: createBackdropMaterial(fissionData(), shared) },
    particles: { geometry: particles as BufferGeometry, material: createFieldParticles(shared) },
    sprites: { geometry: sprites as BufferGeometry, material: createFieldSprites(shared) },
  };
  const dispose = () => {
    sphere.dispose();
    for (const part of Object.values(parts)) {
      part.geometry.dispose();
      part.material.dispose();
    }
  };
  return { shared, parts, dispose };
}

const ease = (x: number) => MathUtils.smootherstep(x, 0, 1);
const _anchor = new Vector3();

export function FissionField() {
  const lod = useQualityPreset().geometryLod;
  const inset = useMemo(() => build(lod), [lod]);
  const gl = useThree((s) => s.gl);
  const group = useRef<Group>(null);
  const backdrop = useRef<Mesh>(null);
  const particles = useRef<Mesh>(null);
  const sprites = useRef<Mesh>(null);
  const openedAt = useRef<number | null>(null);

  useEffect(() => () => inset.dispose(), [inset]);

  useFrame(({ camera }) => {
    const open = world['x.open'];
    const spot = world['x.spot'];
    const active = talk.active && (open > 0.001 || spot > 0.001);
    if (group.current) group.current.visible = active;
    microView.active = active && open > 0.001;
    if (!active) {
      openedAt.current = null;
      return;
    }
    // The chain's clock: from the first frame the view is opening; it keeps running while it closes. A
    // settled entry (back, jump, reset) opens on the steady state, as the chapter's final state.
    if (open > 0.001 && openedAt.current === null) openedAt.current = animationClock.time - (currentEntry()?.mode === 'settle' ? FIELD_TIMING.settledAt : 0);
    if (open <= 0.001 && spot <= 0.001) openedAt.current = null;
    const tau = chainTime(openedAt.current === null ? 0 : animationClock.time - openedAt.current);
    const o = ease(open);
    const zoom = MathUtils.lerp(SPOT_ZOOM, 1, o);

    const { shared, parts } = inset;
    shared.uTau.value = tau;
    shared.uIris.value = IRIS_FULL * zoom;
    shared.uZoom.value = zoom;
    gl.getDrawingBufferSize(shared.uResolution.value);
    parts.backdrop.material.uniforms.uOpacity.value = o;
    parts.backdrop.material.uniforms.uMarker.value = 0;
    parts.particles.material.uniforms.uAlpha.value = o;
    parts.sprites.material.uniforms.uAlpha.value = o;
    parts.sprites.material.uniforms.uSpot.value = spot;
    if (backdrop.current) backdrop.current.visible = o > 0.002;
    if (particles.current) particles.current.visible = o > 0.002;
    if (sprites.current) sprites.current.visible = o > 0.002 || spot > 0.002;

    // Labels (HTML) follow the same field-to-screen mapping as the shaders.
    _anchor.copy(FISSION_ANCHOR).project(camera);
    microView.spot[0] = _anchor.x;
    microView.spot[1] = _anchor.y;
    microView.zoom = zoom;
    const v = fieldView(tau);
    microView.view[0] = v[0];
    microView.view[1] = v[1];
    microView.view[2] = v[2];
    microView.alpha = o;
    microView.tau = tau;
  }, -80);

  const { parts } = inset;
  return (
    <group ref={group} name="talk-fission-field" visible={false}>
      <mesh ref={backdrop} name="talk-fission-field.backdrop" geometry={parts.backdrop.geometry} material={parts.backdrop.material} renderOrder={ORDER.backdrop} frustumCulled={false} />
      <mesh ref={particles} name="talk-fission-field.particles" geometry={parts.particles.geometry} material={parts.particles.material} renderOrder={ORDER.particles} frustumCulled={false} />
      <mesh ref={sprites} name="talk-fission-field.sprites" geometry={parts.sprites.geometry} material={parts.sprites.material} renderOrder={ORDER.sprites} frustumCulled={false} />
    </group>
  );
}
