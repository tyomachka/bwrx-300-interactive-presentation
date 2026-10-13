/**
 * Stage 10: the fission inset's four meshes (backdrop, particles, sprites, labels) with their
 * shared uniforms, for one geometry level of detail. Built once per quality; static geometry.
 */
import { BufferGeometry, Float32BufferAttribute, IcosahedronGeometry, InstancedBufferAttribute, InstancedBufferGeometry, Vector3 } from 'three';
import { FISSION_LABELS } from '../../config/fission';
import { REACTOR_PRESSURE_VESSEL as RPV } from '../plant/dimensions';
import { CORE } from '../rpv/rpvData';
import { fissionData } from './fissionData';
import { createBackdropMaterial, createInsetUniforms, createLabelMaterial, createParticleMaterial, createSpriteMaterial, SPRITE_KINDS } from './fissionShaders';

/**
 * The fuel spot the inset opens from and closes onto: mid-height of the active fuel, on the fuel
 * face exposed by the vessel cut at z = 0 (the left face in the Stage 6 core hold).
 */
export const FISSION_ANCHOR = new Vector3(-0.6, RPV.insideBottomY + CORE.bottomOfActiveFuelH + CORE.activeHeight / 2, 0.012);

const QUAD = [-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0];
const QUAD_INDEX = [0, 1, 2, 0, 2, 3];

function quad(): BufferGeometry {
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(QUAD, 3));
  g.setIndex(QUAD_INDEX);
  return g;
}

function instancedQuad(name: string, values: number[]): InstancedBufferGeometry {
  const g = new InstancedBufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(QUAD, 3));
  g.setIndex(QUAD_INDEX);
  g.setAttribute(name, new InstancedBufferAttribute(new Float32Array(values), 1));
  g.instanceCount = values.length;
  return g;
}

/** Diagnostics: inset parts hidden on purpose (debug/automation.ts). */
export const insetDebug = { hide: new Set<string>() };

/** The last built inset (diagnostics: debug/automation.ts reads its live uniforms). */
export let lastInset: ReturnType<typeof buildInset> | null = null;

export function buildInset(lod: 'high' | 'low') {
  const data = fissionData();
  const shared = createInsetUniforms(FISSION_ANCHOR.clone());

  const sphere = new IcosahedronGeometry(1, lod === 'high' ? 2 : 1);
  const particles = new InstancedBufferGeometry();
  particles.setAttribute('position', sphere.getAttribute('position'));
  particles.setAttribute('normal', sphere.getAttribute('normal'));
  const { home, cent, rest, meta, count } = data.instances;
  particles.setAttribute('aHome', new InstancedBufferAttribute(home, 3));
  particles.setAttribute('aCent', new InstancedBufferAttribute(cent, 3));
  particles.setAttribute('aRest', new InstancedBufferAttribute(rest, 3));
  particles.setAttribute('aMeta', new InstancedBufferAttribute(meta, 4));
  particles.instanceCount = count;

  const parts = {
    backdrop: { geometry: quad(), material: createBackdropMaterial(data, shared) },
    particles: { geometry: particles as BufferGeometry, material: createParticleMaterial(data, shared) },
    sprites: { geometry: instancedQuad('aKind', Array.from({ length: SPRITE_KINDS }, (_, i) => i)) as BufferGeometry, material: createSpriteMaterial(data, shared) },
    labels: { geometry: instancedQuad('aLabel', FISSION_LABELS.map((_, i) => i)) as BufferGeometry, material: createLabelMaterial(data, shared) },
  };
  const dispose = () => {
    sphere.dispose();
    for (const p of Object.values(parts)) {
      p.geometry.dispose();
      p.material.dispose();
    }
    parts.labels.material.uniforms.uAtlas.value.dispose();
  };
  const inset = { shared, parts, dispose, triangles: (sphere.getAttribute('position').count / 3) * count };
  lastInset = inset;
  return inset;
}
