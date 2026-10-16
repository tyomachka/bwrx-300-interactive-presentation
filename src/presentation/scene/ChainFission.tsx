/**
 * Presentation v1 fission inset: the Stage 10 camera-space inset (same backdrop, nuclei, motion and
 * look) in its chain variant, looping while open. Driven by the talk's world channels:
 *   x.open  0 closed on the fuel spot .. 1 the micro view fills the frame
 *   x.spot  the warm spot left on the fuel once the view has closed ("this happens in the fuel")
 * The 48 s cinematic keeps its own inset (scene/fission/FissionInset.tsx), untouched.
 */
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { BufferGeometry, Float32BufferAttribute, IcosahedronGeometry, InstancedBufferAttribute, InstancedBufferGeometry, MathUtils, Vector3, type Group, type Mesh } from 'three';
import { animationClock } from '../../animation/clock';
import { FISSION_ANCHOR } from '../../scene/fission/buildInset';
import { createBackdropMaterial, createInsetUniforms, createParticleMaterial, createSpriteMaterial } from '../../scene/fission/fissionShaders';
import { useQualityPreset } from '../../state/store';
import { talk } from '../talk';
import { world } from '../world';
import { CHAIN_LOOP, CHAIN_OPTIONS, chainData, microView } from './chainConfig';

/** Drawn last, as the Stage 10 inset (the transparent pass sorts by renderOrder first). */
const ORDER = { backdrop: 900, particles: 901, sprites: 902 } as const;
const SPRITE_KINDS = 9;
const IRIS_FULL = 2.8;
const SPOT_ZOOM = 0.035;

const QUAD = [-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0];

function build(lod: 'high' | 'low') {
  const shared = createInsetUniforms(FISSION_ANCHOR.clone());
  const sphere = new IcosahedronGeometry(1, lod === 'high' ? 2 : 1);
  const particles = new InstancedBufferGeometry();
  particles.setAttribute('position', sphere.getAttribute('position'));
  particles.setAttribute('normal', sphere.getAttribute('normal'));
  const { home, cent, rest, meta, count } = chainData.instances;
  particles.setAttribute('aHome', new InstancedBufferAttribute(home, 3));
  particles.setAttribute('aCent', new InstancedBufferAttribute(cent, 3));
  particles.setAttribute('aRest', new InstancedBufferAttribute(rest, 3));
  particles.setAttribute('aMeta', new InstancedBufferAttribute(meta, 4));
  particles.instanceCount = count;

  const backdrop = new BufferGeometry();
  backdrop.setAttribute('position', new Float32BufferAttribute(QUAD, 3));
  backdrop.setIndex([0, 1, 2, 0, 2, 3]);
  const sprites = new InstancedBufferGeometry();
  sprites.setAttribute('position', new Float32BufferAttribute(QUAD, 3));
  sprites.setIndex([0, 1, 2, 0, 2, 3]);
  sprites.setAttribute('aKind', new InstancedBufferAttribute(new Float32Array(Array.from({ length: SPRITE_KINDS }, (_, i) => i)), 1));
  sprites.instanceCount = SPRITE_KINDS;

  const parts = {
    backdrop: { geometry: backdrop as BufferGeometry, material: createBackdropMaterial(chainData, shared) },
    particles: { geometry: particles as BufferGeometry, material: createParticleMaterial(chainData, shared, CHAIN_OPTIONS) },
    sprites: { geometry: sprites as BufferGeometry, material: createSpriteMaterial(chainData, shared, CHAIN_OPTIONS) },
  };
  const dispose = () => {
    sphere.dispose();
    for (const p of Object.values(parts)) {
      p.geometry.dispose();
      p.material.dispose();
    }
  };
  return { shared, parts, dispose };
}

const ease = (x: number) => MathUtils.smootherstep(x, 0, 1);
const _anchor = new Vector3();

export function ChainFission() {
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
    if (open > 0.001 && openedAt.current === null) openedAt.current = animationClock.time;
    if (open <= 0.001) openedAt.current = null;
    const elapsed = openedAt.current === null ? 0 : (animationClock.time - openedAt.current) * CHAIN_LOOP.speed;
    const tau = elapsed % CHAIN_LOOP.period;
    const loopFade = MathUtils.smoothstep(tau, CHAIN_LOOP.fadeIn[0], CHAIN_LOOP.fadeIn[1]) * (1 - MathUtils.smoothstep(tau, CHAIN_LOOP.fadeOut[0], CHAIN_LOOP.fadeOut[1]));
    // The very first loop starts with the iris opening: no extra fade-in.
    const fade = elapsed < CHAIN_LOOP.period ? 1 - MathUtils.smoothstep(tau, CHAIN_LOOP.fadeOut[0], CHAIN_LOOP.fadeOut[1]) : loopFade;
    const o = ease(open);
    const zoom = MathUtils.lerp(SPOT_ZOOM, 1, o);

    const { shared, parts } = inset;
    shared.uTau.value = tau;
    shared.uIris.value = IRIS_FULL * zoom;
    shared.uZoom.value = zoom;
    gl.getDrawingBufferSize(shared.uResolution.value);
    parts.backdrop.material.uniforms.uOpacity.value = o;
    parts.backdrop.material.uniforms.uMarker.value = 0;
    parts.particles.material.uniforms.uAlpha.value = o * fade;
    parts.sprites.material.uniforms.uAlpha.value = o * fade;
    parts.sprites.material.uniforms.uSpot.value = spot;

    if (backdrop.current) backdrop.current.visible = o > 0.002;
    if (particles.current) particles.current.visible = o * fade > 0.002;
    if (sprites.current) sprites.current.visible = o * fade > 0.002 || spot > 0.002;

    // Labels (HTML) follow the same micro-to-screen mapping as the shaders.
    _anchor.copy(FISSION_ANCHOR).project(camera);
    microView.spot[0] = _anchor.x;
    microView.spot[1] = _anchor.y;
    microView.zoom = zoom;
    microView.alpha = o * fade;
    microView.tau = tau;
  }, -80);

  const { parts } = inset;
  return (
    <group ref={group} name="talk-fission-chain" visible={false}>
      <mesh ref={backdrop} name="talk-fission-chain.backdrop" geometry={parts.backdrop.geometry} material={parts.backdrop.material} renderOrder={ORDER.backdrop} frustumCulled={false} />
      <mesh ref={particles} name="talk-fission-chain.particles" geometry={parts.particles.geometry} material={parts.particles.material} renderOrder={ORDER.particles} frustumCulled={false} />
      <mesh ref={sprites} name="talk-fission-chain.sprites" geometry={parts.sprites.geometry} material={parts.sprites.material} renderOrder={ORDER.sprites} frustumCulled={false} />
    </group>
  );
}
