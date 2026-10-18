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
  MeshBasicMaterial,
  PlaneGeometry,
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

/**
 * [ILLUSTRATIVE] A coherent urban load, not a scatter: an orthogonal street grid with a wider boulevard
 * each way, buildings set along their block edges, a dense core of a few towers, a mid-rise ring and
 * low houses at the edges; the streets light up with the windows. Not a real city (no Vilnius claim).
 */
const CITY = { block: [44, 38] as const, street: 10, boulevard: 20 } as const;

function buildCity() {
  const rnd = seededRandom('talk-city-final');
  const { center, size } = GRID.city;
  const items: { x: number; z: number; w: number; d: number; h: number }[] = [];
  // Column / row edges: blocks separated by streets, the middle street each way a boulevard.
  const lanes = (extent: number, block: number) => {
    const n = Math.max(3, Math.floor((extent + CITY.street) / (block + CITY.street)));
    const mid = Math.floor(n / 2);
    const widths = Array.from({ length: n - 1 }, (_, i) => (i === mid - 1 ? CITY.boulevard : CITY.street));
    const total = n * block + widths.reduce((a, b) => a + b, 0);
    const starts: number[] = [];
    let at = -total / 2;
    for (let i = 0; i < n; i++) {
      starts.push(at);
      at += block + (widths[i] ?? 0);
    }
    return { starts, total, widths };
  };
  const cols = lanes(size[0], CITY.block[0]);
  const rows = lanes(size[1], CITY.block[1]);
  const half = [cols.total / 2, rows.total / 2] as const;
  cols.starts.forEach((bx0) => {
    rows.starts.forEach((bz0) => {
      const cx = bx0 + CITY.block[0] / 2;
      const cz = bz0 + CITY.block[1] / 2;
      // 0 in the core .. 1 at the edge (an ellipse fitted to the grid).
      const dist = Math.min(1, Math.hypot(cx / half[0], cz / half[1]));
      const core = dist < 0.38;
      const edge = dist > 0.78;
      // Parcels: towers on big lots in the core, mid-rise in a 2 x 2, houses in a 3 x 3 at the edge.
      const n = core ? 2 : edge ? 3 : 2;
      const pw = CITY.block[0] / n;
      const pd = CITY.block[1] / n;
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          if (edge && rnd() < 0.22) continue; // gardens between the houses
          const inset = edge ? 2.2 : 1.6;
          const w = pw - 2 * inset - rnd() * (edge ? 2 : 4);
          const d = pd - 2 * inset - rnd() * (edge ? 2 : 4);
          let h: number;
          if (core) h = rnd() < 0.35 ? 46 + rnd() * 30 : 24 + rnd() * 14;
          else if (edge) h = 6 + rnd() * 6;
          else h = 13 + rnd() * 13 * (1 - dist);
          // Set to the block edge on the outer side of the parcel (street frontage), not floating inside.
          const x = bx0 + i * pw + (i === 0 ? inset + w / 2 : i === n - 1 ? pw - inset - w / 2 : pw / 2);
          const z = bz0 + j * pd + (j === 0 ? inset + d / 2 : j === n - 1 ? pd - inset - d / 2 : pd / 2);
          items.push({ x: center[0] + x, z: center[2] + z, w, d, h });
        }
      }
    });
  });
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

  // Street lights: a thin warm strip down every street and boulevard, lit with the windows.
  const strips: BufferGeometry[] = [];
  const along = (x0: number, z0: number, x1: number, z1: number, width: number) =>
    strips.push(new PlaneGeometry(Math.abs(x1 - x0) || width, Math.abs(z1 - z0) || width).rotateX(-Math.PI / 2).translate(center[0] + (x0 + x1) / 2, 0.35, center[2] + (z0 + z1) / 2));
  cols.starts.slice(1).forEach((bx, i) => {
    const x = bx - cols.widths[i]! / 2;
    along(x, -half[1], x, half[1], cols.widths[i]! > CITY.street ? 1.6 : 1.0);
  });
  rows.starts.slice(1).forEach((bz, i) => {
    const z = bz - rows.widths[i]! / 2;
    along(-half[0], z, half[0], z, rows.widths[i]! > CITY.street ? 1.6 : 1.0);
  });
  const streets = mergeGeometries(strips.map((g) => g.toNonIndexed()), false)!;
  strips.forEach((g) => g.dispose());
  const streetMaterial = new MeshBasicMaterial({ color: new Color('#ffcf8a'), transparent: true, opacity: 0, depthWrite: false, fog: true });

  // The line arrives at a substation on the city's edge.
  const [lx, , lz] = GRID.lineEnd;
  const substation = mergeGeometries(
    [new BoxGeometry(16, 0.4, 12).translate(lx + 6, 0.2, lz + 4), new BoxGeometry(4, 4.2, 3).translate(lx + 2, 2.1, lz + 2), new BoxGeometry(4, 4.2, 3).translate(lx + 9, 2.1, lz + 2), new BoxGeometry(9, 3.2, 3).translate(lx + 6, 1.6, lz + 8)].map((g) => g.toNonIndexed()),
    false,
  )!;
  return { mesh, geometry, material, count: items.length, streets, streetMaterial, substation };
}

export function GridCity() {
  const grid = useMemo(() => buildLine(), []);
  const power = useMemo(() => createPulseMaterial([ELECTRICITY]), []);
  const city = useMemo(() => buildCity(), []);
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
      city.streets.dispose();
      city.streetMaterial.dispose();
      city.substation.dispose();
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
    city.streetMaterial.opacity = 0.5 * world['g.city'];
  }, -80);

  return (
    <group ref={group} name="talk-grid" visible={false}>
      <mesh name="talk-grid.pylons" geometry={grid.steel} material={m.fin} />
      <mesh name="talk-grid.wires" geometry={grid.wires} material={m.steel} />
      <mesh name="talk-grid.transformer" geometry={grid.transformer} material={m.paintedEquipment} />
      <mesh ref={powerMesh} name="talk-grid.power" geometry={grid.power} material={power} visible={false} />
      <primitive object={city.mesh} name="talk-grid.city" />
      <mesh name="talk-grid.streets" geometry={city.streets} material={city.streetMaterial} renderOrder={-1} />
      <mesh name="talk-grid.substation" geometry={city.substation} material={m.paintedEquipment} />
    </group>
  );
}
