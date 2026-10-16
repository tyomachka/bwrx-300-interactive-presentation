/**
 * Presentation v1: from the generator to the grid (talk only). The 48 s model's electricity fades
 * out a few metres past the turbine hall; here it reaches a transformer, runs along a transmission
 * line and lights a city.
 *
 * [ILLUSTRATIVE] The transformer, the line and the city are scale cues, not a design: no real
 * switchyard, no real city (presentation/sources.ts homes: "~300,000 homes" is a vendor scale
 * figure, said as such on screen). The city is one instanced draw: dark blocks whose windows light
 * up with `g.city` (a procedural window pattern, no textures); the line's power is a pulse tube on
 * the Stage 7 program behind a front (`grid` cue).
 */
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import {
  BoxGeometry,
  CatmullRomCurve3,
  Color,
  CurvePath,
  CylinderGeometry,
  InstancedBufferAttribute,
  InstancedMesh,
  Matrix4,
  ShaderMaterial,
  TubeGeometry,
  UniformsLib,
  UniformsUtils,
  Vector3,
  type BufferGeometry,
  type Group,
  type Mesh,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { seededRandom } from '../../scene/flow/flowPaths';
import { createPulseMaterial } from '../../scene/flow/flowMaterials';
import { ELECTRICITY_ROUTE } from '../../scene/plant/routes';
import { getPlantMaterials } from '../../scene/plant/materials';
import { requestShadowUpdate } from '../../scene/section/sectionLayers';
import { useQualityPreset } from '../../state/store';
import { cue, talkClock, world } from '../world';
import { line, mergeTubes, pulseTube } from './pulse';

type V3 = [number, number, number];

/** [ILLUSTRATIVE] Layout (world metres): transformer east of the turbine hall, line to the south-east. */
const GRID = {
  transformer: { x: [132, 141] as const, z: [11, 18] as const, height: 5.2 },
  lineStart: [150, 0, 24] as V3,
  lineEnd: [470, 0, 214] as V3,
  spans: 6,
  pylonHeight: 32,
  city: { center: [610, 0, 300] as V3, size: [300, 230] as const },
} as const;

const ELECTRICITY = { color: '#f4ead6', alpha: 1, base: 0.55, spacing: 9, pulse: 3, speed: 34 };

function pylons() {
  const [x0, , z0] = GRID.lineStart;
  const [x1, , z1] = GRID.lineEnd;
  return Array.from({ length: GRID.spans + 1 }, (_, i) => {
    const t = i / GRID.spans;
    return new Vector3(x0 + (x1 - x0) * t, 0, z0 + (z1 - z0) * t);
  });
}

/** Conductor attachment points on a pylon (left, middle, right), across the line. */
function attachments(p: Vector3, across: Vector3): Vector3[] {
  const y = GRID.pylonHeight - 4;
  return [-7, 0, 7].map((o) => new Vector3(p.x + across.x * o, y + (o === 0 ? 3.2 : 0), p.z + across.z * o));
}

function sagCurve(a: Vector3, b: Vector3, sag: number): CatmullRomCurve3 {
  const points = Array.from({ length: 9 }, (_, i) => {
    const t = i / 8;
    return new Vector3().lerpVectors(a, b, t).setY(a.y + (b.y - a.y) * t - sag * 4 * t * (1 - t));
  });
  return new CatmullRomCurve3(points);
}

function buildLine() {
  const ps = pylons();
  const dir = new Vector3().subVectors(ps[ps.length - 1]!, ps[0]!).normalize();
  const across = new Vector3(-dir.z, 0, dir.x);
  const steel: BufferGeometry[] = [];
  for (const p of ps) {
    const h = GRID.pylonHeight;
    // A slim tapered tower and two cross-arms: reads as a lattice pylon at this distance.
    steel.push(new CylinderGeometry(0.5, 2.6, h, 4, 1).rotateY(Math.PI / 4).translate(p.x, h / 2, p.z));
    const arm = new BoxGeometry(16, 0.7, 0.8);
    const arm2 = new BoxGeometry(5, 0.7, 0.8);
    const angle = Math.atan2(across.z, across.x);
    steel.push(arm.rotateY(-angle).translate(p.x, h - 4.4, p.z));
    steel.push(arm2.rotateY(-angle).translate(p.x, h - 1.0, p.z));
  }
  const wires: BufferGeometry[] = [];
  const middle = new CurvePath<Vector3>();
  for (let i = 0; i < ps.length - 1; i++) {
    const a = attachments(ps[i]!, across);
    const b = attachments(ps[i + 1]!, across);
    for (let k = 0; k < 3; k++) {
      const curve = sagCurve(a[k]!, b[k]!, 4.5);
      wires.push(new TubeGeometry(curve, 16, 0.14, 5, false));
      if (k === 1) middle.add(curve);
    }
  }
  // Transformer to the first pylon.
  const t = GRID.transformer;
  const bushing = new Vector3((t.x[0] + t.x[1]) / 2, t.height + 2.2, (t.z[0] + t.z[1]) / 2);
  const first = attachments(ps[0]!, across);
  for (let k = 0; k < 3; k++) wires.push(new TubeGeometry(sagCurve(bushing.clone().add(new Vector3(0, 0, (k - 1) * 1.4)), first[k]!, 2), 12, 0.12, 5, false));
  const lead = sagCurve(bushing, first[1]!, 2);

  // Power: generator lead-out (Stage 7 route end) -> transformer -> line, one front.
  const end = ELECTRICITY_ROUTE[ELECTRICITY_ROUTE.length - 1]!;
  const intoTransformer = line(end, [bushing.x, bushing.y, bushing.z]);
  const tubes = [
    pulseTube({ curve: intoTransformer, radius: 0.22, slot: 0, segments: 16, radial: 8 }),
    pulseTube({ curve: lead, radius: 0.24, delay: intoTransformer.getLength(), slot: 0, segments: 24, radial: 8 }),
    pulseTube({ curve: middle, radius: 0.26, delay: intoTransformer.getLength() + lead.getLength(), tail: 60, slot: 0, segments: 240, radial: 8 }),
  ];
  const total = intoTransformer.getLength() + lead.getLength() + middle.getLength();

  const transformer: BufferGeometry[] = [new BoxGeometry(t.x[1] - t.x[0], t.height, t.z[1] - t.z[0]).translate((t.x[0] + t.x[1]) / 2, t.height / 2, (t.z[0] + t.z[1]) / 2)];
  for (let i = 0; i < 6; i++) transformer.push(new BoxGeometry(0.25, t.height * 0.8, 2.2).translate(t.x[0] - 0.4, t.height * 0.45, t.z[0] + 0.8 + i * 1.1));
  for (let k = 0; k < 3; k++) transformer.push(new CylinderGeometry(0.22, 0.32, 2.2, 10).translate(bushing.x, t.height + 1.1, bushing.z + (k - 1) * 1.4));

  const merge = (parts: BufferGeometry[]) => {
    const g = mergeGeometries(parts.map((p) => (p.index ? p.toNonIndexed() : p)), false)!;
    parts.forEach((p) => p.dispose());
    return g;
  };
  return { steel: merge(steel), wires: merge(wires), transformer: merge(transformer), power: mergeTubes(tubes), total };
}

// ---- City ------------------------------------------------------------------------------------------

const CITY_VERTEX = /* glsl */ `
attribute float aSeed;
varying vec3 vWorld;
varying vec3 vNormal;
varying float vSeed;
#include <fog_pars_vertex>
void main() {
	vec4 world = modelMatrix * instanceMatrix * vec4( position, 1.0 );
	vWorld = world.xyz;
	vNormal = normalize( mat3( modelMatrix * instanceMatrix ) * normal );
	vSeed = aSeed;
	vec4 mvPosition = viewMatrix * world;
	gl_Position = projectionMatrix * mvPosition;
	#include <fog_vertex>
}
`;

const CITY_FRAGMENT = /* glsl */ `
uniform float uLights;
uniform vec3 uFacade;
uniform vec3 uWindow;
uniform vec3 uWindowCool;
varying vec3 vWorld;
varying vec3 vNormal;
varying float vSeed;
#include <fog_pars_fragment>
float hash( vec3 p ) { return fract( sin( dot( p, vec3( 12.9898, 78.233, 37.719 ) ) ) * 43758.5453 ); }
void main() {
	vec3 n = normalize( vNormal );
	float shade = 0.5 + 0.5 * max( dot( n, normalize( vec3( 0.35, 0.8, 0.45 ) ) ), 0.0 );
	vec3 col = uFacade * shade;
	float glow = 0.0;
	if ( abs( n.y ) < 0.5 ) {
		float along = abs( n.x ) > 0.5 ? vWorld.z : vWorld.x;
		vec2 cell = vec2( along / 2.6, vWorld.y / 3.4 );
		vec2 f = fract( cell );
		vec2 aa = fwidth( cell ) * 1.2;
		float win = smoothstep( 0.2 - aa.x, 0.2 + aa.x, f.x ) * ( 1.0 - smoothstep( 0.78 - aa.x, 0.78 + aa.x, f.x ) )
			* smoothstep( 0.3 - aa.y, 0.3 + aa.y, f.y ) * ( 1.0 - smoothstep( 0.82 - aa.y, 0.82 + aa.y, f.y ) );
		// Far away a window is smaller than a pixel: blend to its average instead of shimmering.
		float far = smoothstep( 0.35, 0.9, max( aa.x, aa.y ) );
		win = mix( win, 0.33, far );
		vec3 id = vec3( floor( cell ), vSeed );
		float lit = step( hash( id ), 0.6 ) * step( 1.0, floor( cell.y ) + 0.5 ) * uLights;
		vec3 light = mix( uWindow, uWindowCool, step( 0.82, hash( id + 7.1 ) ) ) * ( 0.75 + 0.5 * hash( id + 3.3 ) );
		glow = win * lit;
		col = mix( col, light, glow );
	}
	gl_FragColor = vec4( col, 1.0 );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#ifdef USE_FOG
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
		gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor * ( 1.0 - 0.55 * glow ) );
	#endif
}
`;

function buildCity(lod: 'high' | 'low') {
  const rnd = seededRandom('talk-city');
  const { center, size } = GRID.city;
  const items: { x: number; z: number; w: number; d: number; h: number }[] = [];
  const blockW = 46;
  const blockD = 40;
  const street = 12;
  const nx = Math.floor(size[0] / (blockW + street));
  const nz = Math.floor(size[1] / (blockD + street));
  for (let i = 0; i < nx; i++) {
    for (let j = 0; j < nz; j++) {
      const bx = center[0] - size[0] / 2 + i * (blockW + street);
      const bz = center[2] - size[1] / 2 + j * (blockD + street);
      // Taller towards the centre (a skyline), lower at the edges.
      const dist = Math.hypot(i - (nx - 1) / 2, j - (nz - 1) / 2) / Math.hypot(nx / 2, nz / 2);
      const per = lod === 'high' ? 4 : 3;
      for (let k = 0; k < per; k++) {
        const w = 12 + rnd() * 14;
        const d = 10 + rnd() * 12;
        const x = bx + (k % 2) * (blockW / 2) + rnd() * (blockW / 2 - w) + w / 2;
        const z = bz + Math.floor(k / 2) * (blockD / 2) + rnd() * (blockD / 2 - d) + d / 2;
        const tall = rnd() < 0.12 * (1 - dist) ? 2.4 : 1;
        const h = (9 + rnd() * 26 * (1.2 - dist)) * tall;
        items.push({ x, z, w, d, h });
      }
    }
  }
  const geometry = new BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
  const material = new ShaderMaterial({
    name: 'talk-city',
    uniforms: UniformsUtils.merge([UniformsLib.fog, { uLights: { value: 0 }, uFacade: { value: new Color('#20252b') }, uWindow: { value: new Color('#ffd9a8') }, uWindowCool: { value: new Color('#dfe8f0') } }]),
    vertexShader: CITY_VERTEX,
    fragmentShader: CITY_FRAGMENT,
    fog: true,
  });
  const mesh = new InstancedMesh(geometry, material, items.length);
  const m = new Matrix4();
  const seeds = new Float32Array(items.length);
  items.forEach((b, i) => {
    mesh.setMatrixAt(i, m.makeScale(b.w, b.h, b.d).setPosition(b.x, 0, b.z));
    seeds[i] = rnd() * 100;
  });
  geometry.setAttribute('aSeed', new InstancedBufferAttribute(seeds, 1));
  mesh.computeBoundingSphere();
  return { mesh, geometry, material, count: items.length };
}

export function GridCity() {
  const lod = useQualityPreset().geometryLod;
  const grid = useMemo(() => buildLine(), []);
  const power = useMemo(() => createPulseMaterial([ELECTRICITY]), []);
  const city = useMemo(() => buildCity(lod), [lod]);
  const group = useRef<Group>(null);
  const powerMesh = useRef<Mesh>(null);
  const m = getPlantMaterials();

  useEffect(
    () => () => {
      grid.steel.dispose();
      grid.wires.dispose();
      grid.transformer.dispose();
      grid.power.dispose();
    },
    [grid],
  );
  useEffect(() => () => power.dispose(), [power]);
  useEffect(
    () => () => {
      city.geometry.dispose();
      city.material.dispose();
    },
    [city],
  );

  useFrame(() => {
    const show = world['g.show'] > 0.5;
    if (group.current && group.current.visible !== show) {
      group.current.visible = show;
      requestShadowUpdate();
    }
    if (!show) return;
    const p = cue('grid');
    const front = p >= 1 ? Infinity : p * grid.total;
    const u = power.uniforms;
    u.uTime.value = talkClock.time;
    u.uState.value[0]!.set(world['g.power'], front, ELECTRICITY.alpha, 0);
    if (powerMesh.current) powerMesh.current.visible = world['g.power'] > 0.001;
    city.material.uniforms.uLights!.value = world['g.city'];
  }, -80);

  return (
    <group ref={group} name="talk-grid" visible={false}>
      <mesh name="talk-grid.pylons" geometry={grid.steel} material={m.fin} />
      <mesh name="talk-grid.wires" geometry={grid.wires} material={m.steel} />
      <mesh name="talk-grid.transformer" geometry={grid.transformer} material={m.paintedEquipment} />
      <mesh ref={powerMesh} name="talk-grid.power" geometry={grid.power} material={power} visible={false} />
      <primitive object={city.mesh} name="talk-grid.city" />
    </group>
  );
}
