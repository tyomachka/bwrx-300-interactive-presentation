/**
 * Presentation v1 map tables (talk only), lying on the ground at the plant (scene/mapLayout.ts):
 *
 *  - Lithuania (m.lt): the country raised above its neighbours, wind turbines turning in the west
 *    (lt.wind), solar fields catching light (lt.sun), the cities as the load, generation flowing to
 *    them, imports arriving over the interconnections (lt.imports), and one controllable node
 *    (lt.node) at the point the plant shrank into / grows out of. lt.highlight warms the country.
 *  - North Atlantic (m.world): land and the large lakes, BWRX-300 projects as pins whose style is
 *    the status (solid amber: under construction; solid light: construction permit; light outline: design
 *    and licensing in development; muted: planned or assessed).
 *
 * A table opens as a circle around the origin (its channel 0..1 -> the reveal radius), on opaque
 * materials with a dithered edge (no transparency sorting), while the plant scales down into the
 * centre (p.zoom, scene/TalkScene.tsx). Unlit / fog-free where it must read on a projector; the land
 * is lit by the studio rig. [ILLUSTRATIVE] generation and grid positions (mapLayout.ts).
 */
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import {
  BoxGeometry,
  CanvasTexture,
  CircleGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  ExtrudeGeometry,
  Float32BufferAttribute,
  InstancedMesh,
  MathUtils,
  Matrix4,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Quaternion,
  RingGeometry,
  Shape,
  ShapeGeometry,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
  type BufferGeometry,
  type Group,
  type IUniform,
  type Material,
  type Mesh,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { animationClock } from '../../animation/clock';
import { createPulseMaterial } from '../../scene/flow/flowMaterials';
import { useQualityPreset } from '../../state/store';
import { LT_RINGS, WORLD_LAKES, WORLD_RINGS } from '../data/geo';
import { cue, talkClock, world } from '../world';
import { LT_CITIES, LT_INTERCONNECTORS, LT_LINES, LT_SOLAR, LT_WIND, ltToWorld, PROJECT_PINS, worldToMap } from './mapLayout';
import { mergeTubes, pulseTube, route } from './pulse';

const BACKGROUND = new Color('#0b0c0e');
const ACCENT = new Color('#e8a33d');
/** Reveal radius at full (m): beyond everything the map cameras see. */
const REVEAL_FULL = 950;
const BASE_Y = 0.2;

// ---- The reveal (a circle around the origin, dithered edge) ----------------------------------------

interface RevealUniforms {
  uReveal: IUniform<number>;
}

const REVEAL_VERTEX_PARS = /* glsl */ `
varying vec2 vMapXZ;
`;
// Instanced glyphs (turbines, solar fields, cities) reveal where each instance stands, not at the origin.
const REVEAL_VERTEX = /* glsl */ `
#ifdef USE_INSTANCING
vMapXZ = ( modelMatrix * instanceMatrix * vec4( transformed, 1.0 ) ).xz;
#else
vMapXZ = ( modelMatrix * vec4( transformed, 1.0 ) ).xz;
#endif
`;
const REVEAL_FRAGMENT_PARS = /* glsl */ `
uniform float uReveal;
varying vec2 vMapXZ;
`;
const REVEAL_FRAGMENT = /* glsl */ `
{
	float k = ( uReveal - length( vMapXZ ) ) / 22.0;
	float n = fract( 52.9829189 * fract( dot( gl_FragCoord.xy, vec2( 0.06711056, 0.00583715 ) ) ) );
	if ( k < n ) discard;
}
`;

/** A lit or unlit built-in material that only exists inside the reveal circle. */
function revealed<M extends MeshStandardMaterial | MeshBasicMaterial>(material: M, uniforms: RevealUniforms): M {
  material.fog = false;
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uReveal = uniforms.uReveal;
    shader.vertexShader = shader.vertexShader.replace('#include <common>', `#include <common>\n${REVEAL_VERTEX_PARS}`).replace('#include <begin_vertex>', `#include <begin_vertex>\n${REVEAL_VERTEX}`);
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', `#include <common>\n${REVEAL_FRAGMENT_PARS}`).replace('void main() {', `void main() {\n${REVEAL_FRAGMENT}`);
  };
  material.customProgramCacheKey = () => 'talk-map-reveal';
  return material;
}

/** The sea under a table: unlit, fading into the studio background towards the edge. */
function oceanMaterial(color: string, uniforms: RevealUniforms): ShaderMaterial {
  return new ShaderMaterial({
    name: 'talk-map-ocean',
    uniforms: { uReveal: uniforms.uReveal, uColor: { value: new Color(color) }, uBackground: { value: BACKGROUND }, uFade: { value: new Float32Array([260, 820]) } },
    vertexShader: /* glsl */ `
${REVEAL_VERTEX_PARS}
void main() {
	vec3 transformed = position;
	${REVEAL_VERTEX}
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,
    fragmentShader: /* glsl */ `
${REVEAL_FRAGMENT_PARS}
uniform vec3 uColor;
uniform vec3 uBackground;
uniform float uFade[ 2 ];
void main() {
	${REVEAL_FRAGMENT}
	float r = length( vMapXZ );
	vec3 c = mix( uColor, uBackground, smoothstep( uFade[ 0 ], uFade[ 1 ], r ) );
	gl_FragColor = vec4( c, 1.0 );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,
  });
}

// ---- Geometry helpers ---------------------------------------------------------------------------------

/** Flat [x, z, ...] ring -> a THREE.Shape in (x, north) coordinates. */
function ringShape(ring: readonly number[]): Shape {
  const shape = new Shape();
  for (let i = 0; i < ring.length; i += 2) {
    const x = ring[i]!;
    const north = -ring[i + 1]!;
    if (i === 0) shape.moveTo(x, north);
    else shape.lineTo(x, north);
  }
  shape.closePath();
  return shape;
}

/** Extruded slabs standing on y = base, optionally with one vertex colour per ring set. */
function slabs(rings: readonly (readonly number[])[], depth: number, base: number, color?: Color): BufferGeometry | null {
  const parts: BufferGeometry[] = [];
  for (const ring of rings) {
    if (ring.length < 6) continue;
    const g = new ExtrudeGeometry(ringShape(ring), { depth, bevelEnabled: false, curveSegments: 1 });
    g.rotateX(-Math.PI / 2).translate(0, base, 0);
    const flat = g.index ? g.toNonIndexed() : g;
    if (flat !== g) g.dispose();
    flat.deleteAttribute('uv');
    if (color) {
      const n = flat.getAttribute('position').count;
      const c = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) c.set([color.r, color.g, color.b], i * 3);
      flat.setAttribute('color', new Float32BufferAttribute(c, 3));
    }
    parts.push(flat);
  }
  if (!parts.length) return null;
  const merged = mergeGeometries(parts, false);
  parts.forEach((p) => p.dispose());
  return merged;
}

function softDisc(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(32, 32, 2, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.75)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return new CanvasTexture(canvas);
}

const flatDisc = (radius: number, segments = 40) => new CircleGeometry(radius, segments).rotateX(-Math.PI / 2);
const flatRing = (inner: number, outer: number, segments = 48) => new RingGeometry(inner, outer, segments).rotateX(-Math.PI / 2);

// ---- Lithuania ------------------------------------------------------------------------------------------

const LT_TOP = BASE_Y + 2.6;
const NEIGHBOUR_TOP = BASE_Y + 1.2;
const POWER_LOOK = {
  domestic: { color: '#f4ead6', alpha: 0.95, base: 0.35, spacing: 9, pulse: 3.2, speed: 16 },
  imports: { color: '#cfd8df', alpha: 0.95, base: 0.3, spacing: 10, pulse: 3.6, speed: 18 },
};

function buildLithuania(uniforms: RevealUniforms) {
  const country = slabs(LT_RINGS.Lithuania ?? [], 2.6, BASE_Y)!;
  const neighbours = slabs(
    Object.entries(LT_RINGS)
      .filter(([name]) => name !== 'Lithuania')
      .flatMap(([, rings]) => rings),
    1.0,
    BASE_Y,
  )!;
  const countryMaterial = revealed(new MeshStandardMaterial({ color: '#4c535b', roughness: 0.88, metalness: 0.04, emissive: ACCENT, emissiveIntensity: 0 }), uniforms);
  const neighbourMaterial = revealed(new MeshStandardMaterial({ color: '#23282d', roughness: 0.95, metalness: 0 }), uniforms);

  // Flows: generation to the cities (slot 0), imports over the interconnections (slot 1).
  const lift = (lon: number, lat: number, top: number): [number, number, number] => ltToWorld(lon, lat, top + 0.6);
  const tubes = [
    ...LT_LINES.map((points) => pulseTube({ curve: route(points.map(([lon, lat]) => lift(lon, lat, LT_TOP)), 4), radius: 0.75, slot: 0, segments: 64, radial: 8 })),
    ...LT_INTERCONNECTORS.map(({ from, to }) =>
      pulseTube({ curve: route([lift(from[0], from[1], NEIGHBOUR_TOP), lift(to[0], to[1], LT_TOP)], 4), radius: 0.8, slot: 1, segments: 64, radial: 8 }),
    ),
  ];
  const flows = { geometry: mergeTubes(tubes), material: createPulseMaterial([POWER_LOOK.domestic, POWER_LOOK.imports]) };

  // Cities: soft warm lights (the load: always there).
  const cityTexture = softDisc();
  const cityMaterial = new MeshBasicMaterial({ color: '#ffd9a8', map: cityTexture, transparent: true, depthWrite: false, fog: false });
  const cities = new InstancedMesh(flatDisc(1, 24), cityMaterial, LT_CITIES.length);
  const m = new Matrix4();
  LT_CITIES.forEach((c, i) => {
    const [x, , z] = ltToWorld(c.lon, c.lat, 0);
    const r = 3 + 6 * c.weight;
    cities.setMatrixAt(i, m.makeScale(r, 1, r).setPosition(x, LT_TOP + 0.08, z));
  });

  // Wind turbines: towers (static) and rotors (spinning, per frame: a handful of matrices).
  const tower = mergeGeometries([new CylinderGeometry(0.16, 0.3, 6, 6).translate(0, 3, 0), new BoxGeometry(0.55, 0.42, 1.1).translate(0, 6.1, -0.25)], false)!;
  const rotor = mergeGeometries([0, 1, 2].map((k) => new BoxGeometry(0.2, 2.8, 0.06).translate(0, 1.4, 0).rotateZ((k * Math.PI * 2) / 3)), false)!;
  const turbineMaterial = revealed(new MeshStandardMaterial({ color: '#d6dade', roughness: 0.6, metalness: 0.1 }), uniforms);
  const towers = new InstancedMesh(tower, turbineMaterial, LT_WIND.length);
  const rotors = new InstancedMesh(rotor, turbineMaterial, LT_WIND.length);
  const hubs = LT_WIND.map(([lon, lat]) => new Vector3(...ltToWorld(lon, lat, LT_TOP + 6.1)).add(new Vector3(0, 0, 0.4)));
  LT_WIND.forEach(([lon, lat], i) => {
    const [x, , z] = ltToWorld(lon, lat, 0);
    towers.setMatrixAt(i, m.makeTranslation(x, LT_TOP, z));
  });

  // Solar fields: rows of dark panels catching the light.
  const field = mergeGeometries(
    [0, 1, 2, 3].map((row) => new BoxGeometry(7, 0.18, 1.1).rotateX(-0.45).translate(0, 0.6, row * 1.9 - 2.8)),
    false,
  )!;
  const solarMaterial = revealed(new MeshStandardMaterial({ color: '#1f3346', roughness: 0.25, metalness: 0.6, emissive: new Color('#bcd2e2'), emissiveIntensity: 0 }), uniforms);
  const solar = new InstancedMesh(field, solarMaterial, LT_SOLAR.length);
  LT_SOLAR.forEach(([lon, lat], i) => {
    const [x, , z] = ltToWorld(lon, lat, 0);
    solar.setMatrixAt(i, m.makeTranslation(x, LT_TOP, z));
  });

  // The controllable node (the plant's point): an amber disc and a slow expanding ring.
  const nodeMaterial = new MeshBasicMaterial({ color: ACCENT, transparent: true, fog: false, depthWrite: false });
  const node = flatDisc(3.2);
  const pulseMaterial = new MeshBasicMaterial({ color: ACCENT, transparent: true, fog: false, depthWrite: false, side: DoubleSide });
  const pulse = flatRing(0.86, 1, 64);

  return {
    country,
    neighbours,
    countryMaterial,
    neighbourMaterial,
    flows,
    cities,
    cityMaterial,
    cityTexture,
    towers,
    rotors,
    hubs,
    solar,
    solarMaterial,
    turbineMaterial,
    node,
    nodeMaterial,
    pulse,
    pulseMaterial,
    dispose() {
      for (const g of [country, neighbours, flows.geometry, tower, rotor, field, node, pulse, cities.geometry]) g.dispose();
      for (const mat of [countryMaterial, neighbourMaterial, flows.material, cityMaterial, turbineMaterial, solarMaterial, nodeMaterial, pulseMaterial] as Material[]) mat.dispose();
      cityTexture.dispose();
    },
  };
}

// ---- North Atlantic ------------------------------------------------------------------------------------

/** Countries with a BWRX-300 project or assessment: one step lighter (the talk names them). */
const EMPHASIS = new Set(['Canada', 'United States of America', 'Poland', 'Estonia', 'Lithuania']);
const WORLD_TOP = BASE_Y + 1.1;

// Amber only for the one under construction (the chapter's current concept); in progress = a ring.
const PIN_STYLE = {
  building: { color: '#e8a33d', solid: true, stem: 7 },
  permitted: { color: '#e9ecef', solid: true, stem: 5.5 },
  licensing: { color: '#e9ecef', solid: false, stem: 4.5 },
  planned: { color: '#8a939c', solid: true, stem: 0 },
  assessing: { color: '#8a939c', solid: false, stem: 0 },
} as const;

function buildWorld(uniforms: RevealUniforms) {
  const base = new Color('#3a3f45');
  const lit = new Color('#565d65');
  const land = mergeGeometries(
    Object.entries(WORLD_RINGS)
      .map(([name, rings]) => slabs(rings, 1.1, BASE_Y, EMPHASIS.has(name) ? lit : base))
      .filter((g): g is BufferGeometry => g !== null),
    false,
  )!;
  const landMaterial = revealed(new MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0.02 }), uniforms);
  const lakes = mergeGeometries(
    WORLD_LAKES.map((ring) => new ShapeGeometry(ringShape(ring)).rotateX(-Math.PI / 2).translate(0, WORLD_TOP + 0.04, 0)),
    false,
  )!;
  lakes.deleteAttribute('uv');
  const lakeMaterial = revealed(new MeshBasicMaterial({ color: '#13202b' }), uniforms);

  // Pins: one group each (flat marker, stem, head), scaled in by the `pins` cue.
  const pins = PROJECT_PINS.map((p) => {
    const style = PIN_STYLE[p.status];
    const material = new MeshBasicMaterial({ color: style.color, transparent: true, fog: false, side: DoubleSide });
    const marker = style.solid ? flatDisc(2.3) : flatRing(1.55, 2.3);
    const stem = style.stem ? new CylinderGeometry(0.28, 0.28, style.stem, 10).translate(0, style.stem / 2, 0) : null;
    const head = style.stem ? new SphereGeometry(style.solid ? 1.15 : 0.8, 16, 12).translate(0, style.stem, 0) : null;
    return { pin: p, at: worldToMap(p.lon, p.lat, WORLD_TOP + 0.08), material, marker, stem, head };
  });
  const ringMaterial = new MeshBasicMaterial({ color: ACCENT, transparent: true, fog: false, depthWrite: false, side: DoubleSide });
  const ring = flatRing(0.9, 1, 64);

  return {
    land,
    landMaterial,
    lakes,
    lakeMaterial,
    pins,
    ring,
    ringMaterial,
    dispose() {
      land.dispose();
      lakes.dispose();
      ring.dispose();
      landMaterial.dispose();
      lakeMaterial.dispose();
      ringMaterial.dispose();
      for (const p of pins) {
        p.material.dispose();
        p.marker.dispose();
        p.stem?.dispose();
        p.head?.dispose();
      }
    },
  };
}

// ---- Component -----------------------------------------------------------------------------------------

const _q = new Quaternion();
const _spin = new Quaternion();
const _axis = new Vector3(0, 0, 1);
const _s = new Vector3(1, 1, 1);
const _m = new Matrix4();

export function Maps() {
  useQualityPreset(); // remount with the canvas like every scene component
  const ltUniforms = useMemo<RevealUniforms>(() => ({ uReveal: { value: 0 } }), []);
  const worldUniforms = useMemo<RevealUniforms>(() => ({ uReveal: { value: 0 } }), []);
  const lt = useMemo(() => buildLithuania(ltUniforms), [ltUniforms]);
  const atlantic = useMemo(() => buildWorld(worldUniforms), [worldUniforms]);
  const oceans = useMemo(() => ({ geometry: flatDisc(1150, 96), lt: oceanMaterial('#121a22', ltUniforms), world: oceanMaterial('#111a23', worldUniforms) }), [ltUniforms, worldUniforms]);

  const ltGroup = useRef<Group>(null);
  const worldGroup = useRef<Group>(null);
  const flowMesh = useRef<Mesh>(null);
  const nodeMesh = useRef<Mesh>(null);
  const nodePulse = useRef<Mesh>(null);
  const pinGroups = useRef<(Group | null)[]>([]);
  const focusRing = useRef<Mesh>(null);
  const spin = useRef(0);

  useEffect(() => () => lt.dispose(), [lt]);
  useEffect(() => () => atlantic.dispose(), [atlantic]);
  useEffect(
    () => () => {
      oceans.geometry.dispose();
      oceans.lt.dispose();
      oceans.world.dispose();
    },
    [oceans],
  );

  useFrame(() => {
    const ltOn = world['m.lt'];
    const worldOn = world['m.world'];
    ltUniforms.uReveal.value = MathUtils.smootherstep(ltOn, 0, 1) * REVEAL_FULL;
    worldUniforms.uReveal.value = MathUtils.smootherstep(worldOn, 0, 1) * REVEAL_FULL;
    if (ltGroup.current) ltGroup.current.visible = ltOn > 0.001;
    if (worldGroup.current) worldGroup.current.visible = worldOn > 0.001;
    const t = talkClock.time;

    if (ltOn > 0.001) {
      const wind = world['lt.wind'];
      const sun = world['lt.sun'];
      const imports = world['lt.imports'];
      // Generation follows the weather; the cities (the load) stay lit.
      const domestic = MathUtils.clamp(0.25 + 0.55 * wind + 0.35 * sun, 0, 1);
      const show = MathUtils.smoothstep(ltOn, 0.75, 1);
      const u = lt.flows.material.uniforms;
      u.uTime.value = t;
      u.uState.value[0]!.set(domestic * show, Infinity, POWER_LOOK.domestic.alpha * (0.35 + 0.65 * domestic), 0);
      u.uState.value[1]!.set(imports * show, Infinity, POWER_LOOK.imports.alpha, 0);
      if (flowMesh.current) flowMesh.current.visible = show > 0.001;
      lt.countryMaterial.emissiveIntensity = 0.075 * world['lt.highlight'];
      lt.solarMaterial.emissiveIntensity = 0.32 * sun;
      lt.cityMaterial.opacity = 0.9 * show;
      // Rotors: speed follows the wind (integrated, so a calm slows them down without a jump).
      spin.current += animationClock.lastStep * (0.4 + 2.6 * wind);
      lt.hubs.forEach((hub, i) => {
        _spin.setFromAxisAngle(_axis, spin.current + i * 1.7);
        _q.copy(_spin);
        _m.compose(hub, _q, _s);
        lt.rotors.setMatrixAt(i, _m);
      });
      lt.rotors.instanceMatrix.needsUpdate = true;
      const node = world['lt.node'];
      if (nodeMesh.current) nodeMesh.current.visible = node > 0.001;
      lt.nodeMaterial.opacity = node;
      const phase = (t % 2.6) / 2.6;
      if (nodePulse.current) {
        nodePulse.current.visible = node > 0.001;
        const r = 3.2 + 9 * phase;
        nodePulse.current.scale.set(r, 1, r);
      }
      lt.pulseMaterial.opacity = node * 0.7 * (1 - phase);
    }

    if (worldOn > 0.001) {
      const focus = world['w.focus'];
      // Pins leave with the map: they shrink away early in the close (the plant regrows at
      // Darlington), and are untouched while the map is open (they only appear once it is).
      const mapShown = MathUtils.smoothstep(worldOn, 0.5, 0.85);
      atlantic.pins.forEach((pin, i) => {
        const g = pinGroups.current[i];
        if (!g) return;
        // Each pin appears with its own cue (when the speaker names it), its label beside it.
        const local = cue(`pin.${pin.pin.id}`) * mapShown;
        const s = local <= 0 ? 0.001 : 1 - Math.pow(1 - local, 3);
        g.scale.setScalar(Math.max(s, 0.001));
        g.visible = local > 0;
        pin.material.opacity = pin.pin.id === 'darlington' ? 1 : 1 - 0.55 * focus;
      });
      const phase = (t % 2.4) / 2.4;
      if (focusRing.current) {
        const r = 2.4 + 8 * phase;
        focusRing.current.scale.set(r, 1, r);
        focusRing.current.visible = cue('pin.darlington') > 0.8 && mapShown > 0.01;
      }
      atlantic.ringMaterial.opacity = 0.75 * (1 - phase);
    }
  }, -80);

  const darlington = atlantic.pins[0]!;
  return (
    <>
      <group ref={ltGroup} name="talk-map-lithuania" visible={false}>
        <mesh geometry={oceans.geometry} material={oceans.lt} position-y={BASE_Y - 0.05} renderOrder={-2} />
        <mesh geometry={lt.neighbours} material={lt.neighbourMaterial} />
        <mesh geometry={lt.country} material={lt.countryMaterial} />
        <primitive object={lt.solar} />
        <primitive object={lt.towers} />
        <primitive object={lt.rotors} />
        <primitive object={lt.cities} />
        <mesh ref={flowMesh} geometry={lt.flows.geometry} material={lt.flows.material} />
        <mesh ref={nodeMesh} geometry={lt.node} material={lt.nodeMaterial} position-y={LT_TOP + 0.14} />
        <mesh ref={nodePulse} geometry={lt.pulse} material={lt.pulseMaterial} position-y={LT_TOP + 0.12} />
      </group>
      <group ref={worldGroup} name="talk-map-world" visible={false}>
        <mesh geometry={oceans.geometry} material={oceans.world} position-y={BASE_Y - 0.05} renderOrder={-2} />
        <mesh geometry={atlantic.land} material={atlantic.landMaterial} />
        <mesh geometry={atlantic.lakes} material={atlantic.lakeMaterial} />
        {atlantic.pins.map((pin, i) => (
          <group key={pin.pin.id} ref={(g) => void (pinGroups.current[i] = g)} position={pin.at}>
            <mesh geometry={pin.marker} material={pin.material} />
            {pin.stem && <mesh geometry={pin.stem} material={pin.material} />}
            {pin.head && <mesh geometry={pin.head} material={pin.material} />}
          </group>
        ))}
        <mesh ref={focusRing} geometry={atlantic.ring} material={atlantic.ringMaterial} position={[darlington.at[0], darlington.at[1] + 0.05, darlington.at[2]]} />
      </group>
    </>
  );
}

