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
import { STUDY_ENABLED } from '../study/studyMode';

/**
 * Design study, motion prototype C (`?study=` / `?designStudy=1` only): no dark seam. Each loop
 * starts `overlap` tau before the previous one ends; the new nuclei fade in while the old fragments
 * fade out, drawn by a second particle / sprite pair on its own tau (same programs, no new compile).
 */
const SEAMLESS = import.meta.env.MODE !== 'portable' && STUDY_ENABLED;
const SEAMLESS_OVERLAP = 1.6;

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
  // Study only: the overlapping loop's own tau (the geometry is shared).
  const shared2 = SEAMLESS ? createInsetUniforms(FISSION_ANCHOR.clone()) : null;
  const second = shared2 ? { particles: createParticleMaterial(chainData, shared2, CHAIN_OPTIONS), sprites: createSpriteMaterial(chainData, shared2, CHAIN_OPTIONS) } : null;
  const dispose = () => {
    sphere.dispose();
    for (const p of Object.values(parts)) {
      p.geometry.dispose();
      p.material.dispose();
    }
    second?.particles.dispose();
    second?.sprites.dispose();
  };
  return { shared, parts, shared2, second, dispose };
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
  const particles2 = useRef<Mesh>(null);
  const sprites2 = useRef<Mesh>(null);
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
    let tau = elapsed % CHAIN_LOOP.period;
    const loopFade = MathUtils.smoothstep(tau, CHAIN_LOOP.fadeIn[0], CHAIN_LOOP.fadeIn[1]) * (1 - MathUtils.smoothstep(tau, CHAIN_LOOP.fadeOut[0], CHAIN_LOOP.fadeOut[1]));
    // The very first loop starts with the iris opening: no extra fade-in.
    let fade = elapsed < CHAIN_LOOP.period ? 1 - MathUtils.smoothstep(tau, CHAIN_LOOP.fadeOut[0], CHAIN_LOOP.fadeOut[1]) : loopFade;
    // Study (motion C): loop k starts every period - overlap; while it fades in, loop k - 1 fades out.
    let tauOld = 0;
    let fadeOld = 0;
    let newerIsSecond = false;
    if (SEAMLESS) {
      const start = CHAIN_LOOP.period - SEAMLESS_OVERLAP;
      const k = Math.floor(elapsed / start);
      tau = elapsed - k * start;
      // A short cross-dissolve (both half-transparent for ~0.8 s), never an empty frame.
      fade = k === 0 ? 1 : MathUtils.smoothstep(tau, 0.25, 0.85);
      if (k > 0 && tau < SEAMLESS_OVERLAP) {
        tauOld = tau + start;
        fadeOld = 1 - MathUtils.smoothstep(tau, 0.35, 1.0);
      }
      newerIsSecond = k % 2 === 1;
    }
    const o = ease(open);
    const zoom = MathUtils.lerp(SPOT_ZOOM, 1, o);

    const { shared, parts } = inset;
    // Study: the two pairs alternate between the newer and the older loop (no state is swapped).
    const [tau1, fade1, tau2, fade2] = newerIsSecond ? [tauOld, fadeOld, tau, fade] : [tau, fade, tauOld, fadeOld];
    shared.uTau.value = tau1;
    shared.uIris.value = IRIS_FULL * zoom;
    shared.uZoom.value = zoom;
    gl.getDrawingBufferSize(shared.uResolution.value);
    parts.backdrop.material.uniforms.uOpacity.value = o;
    parts.backdrop.material.uniforms.uMarker.value = 0;
    parts.particles.material.uniforms.uAlpha.value = o * fade1;
    parts.sprites.material.uniforms.uAlpha.value = o * fade1;
    parts.sprites.material.uniforms.uSpot.value = spot;

    if (backdrop.current) backdrop.current.visible = o > 0.002;
    if (particles.current) particles.current.visible = o * fade1 > 0.002;
    if (sprites.current) sprites.current.visible = o * fade1 > 0.002 || spot > 0.002;
    if (inset.shared2 && inset.second) {
      inset.shared2.uTau.value = tau2;
      inset.shared2.uIris.value = IRIS_FULL * zoom;
      inset.shared2.uZoom.value = zoom;
      inset.shared2.uResolution.value.copy(shared.uResolution.value);
      inset.second.particles.uniforms.uAlpha.value = o * fade2;
      inset.second.sprites.uniforms.uAlpha.value = o * fade2;
      inset.second.sprites.uniforms.uSpot.value = 0;
      if (particles2.current) particles2.current.visible = o * fade2 > 0.002;
      if (sprites2.current) sprites2.current.visible = o * fade2 > 0.002;
    }

    // Labels (HTML) follow the same micro-to-screen mapping as the shaders.
    _anchor.copy(FISSION_ANCHOR).project(camera);
    microView.spot[0] = _anchor.x;
    microView.spot[1] = _anchor.y;
    microView.zoom = zoom;
    // Labels follow the dominant loop (during a study overlap, the old one until the new one is stronger).
    const labelsOld = fadeOld > fade;
    microView.alpha = o * (labelsOld ? fadeOld : fade);
    microView.tau = labelsOld ? tauOld : tau;
  }, -80);

  const { parts } = inset;
  return (
    <group ref={group} name="talk-fission-chain" visible={false}>
      <mesh ref={backdrop} name="talk-fission-chain.backdrop" geometry={parts.backdrop.geometry} material={parts.backdrop.material} renderOrder={ORDER.backdrop} frustumCulled={false} />
      <mesh ref={particles} name="talk-fission-chain.particles" geometry={parts.particles.geometry} material={parts.particles.material} renderOrder={ORDER.particles} frustumCulled={false} />
      <mesh ref={sprites} name="talk-fission-chain.sprites" geometry={parts.sprites.geometry} material={parts.sprites.material} renderOrder={ORDER.sprites} frustumCulled={false} />
      {SEAMLESS && inset.second && (
        <>
          <mesh ref={particles2} name="talk-fission-chain.particles-study" geometry={parts.particles.geometry} material={inset.second.particles} renderOrder={ORDER.particles} frustumCulled={false} visible={false} />
          <mesh ref={sprites2} name="talk-fission-chain.sprites-study" geometry={parts.sprites.geometry} material={inset.second.sprites} renderOrder={ORDER.sprites} frustumCulled={false} visible={false} />
        </>
      )}
    </group>
  );
}
