/**
 * Stage 8 activity cue: the shader and instanced geometry for the core-activity glints.
 *
 * One instanced quad per glint slot, flat in the plane of a fuel face that the vessel quarter
 * cut exposes (the two cut planes x = 0 and z = 0 through the reactor axis), a few millimetres
 * in front of the channel and behind the cut blade wings, so a blade in front of the fuel hides
 * the glints there. Each slot flashes briefly once per period, every time at a new place on its
 * strip; which flashes happen is a hash of the slot index and the cycle number, so a frame is a
 * pure function of the cue clock (playback = seek = export). The share of slots that flash is
 * the reaction intensity; below a blade's absorber tip only a small share remains.
 *
 * Normal alpha blending, no depth writes, through the renderer's tone mapping (no glow).
 */
import { Color, DoubleSide, Float32BufferAttribute, InstancedBufferAttribute, InstancedBufferGeometry, NormalBlending, ShaderMaterial, Vector2, Vector4, type IUniform } from 'three';
import { ACTIVITY_LOOK } from '../../config/control';
import { seededRandom } from '../flow/flowPaths';
import { BLADE, CORE, TOP_OF_ACTIVE_FUEL_H } from '../rpv/rpvData';
import { CONTROL_BLADES, FUEL_BUNDLES } from '../rpv/coreLayout';

/** A fuel face exposed by the quarter cut: one channel side, the blade of its cell. */
interface Strip {
  /** 0: in the plane x = 0, at z = s (s > 0); 1: in the plane z = 0, at x = -s. */
  face: 0 | 1;
  /** Strip centre: distance from the reactor axis along the face (m). */
  s: number;
  /** Index into the tip uniform (TIP_BLADES). */
  tip: number;
}

const QUARTER = CORE.cellPitch / 4;
const near = (a: number, b: number) => Math.abs(a - b) < 1e-6;

/** The channel faces the cut exposes, and the blades whose tips gate their glints. */
export const { STRIPS, TIP_BLADES } = (() => {
  const strips: Strip[] = [];
  const tipBlades: number[] = [];
  const tipOf = (cell: string) => {
    const blade = CONTROL_BLADES.findIndex((b) => b.id === `blade-${cell.slice(5)}`);
    if (!tipBlades.includes(blade)) tipBlades.push(blade);
    return tipBlades.indexOf(blade);
  };
  for (const bundle of FUEL_BUNDLES) {
    if (!bundle.cell) continue;
    // Bundles just behind the plane x = 0 on the cut side z > 0, and behind z = 0 on the side x < 0.
    if (near(bundle.x, QUARTER) && bundle.z > 0) strips.push({ face: 0, s: bundle.z, tip: tipOf(bundle.cell) });
    if (near(bundle.z, -QUARTER) && bundle.x < 0) strips.push({ face: 1, s: -bundle.x, tip: tipOf(bundle.cell) });
  }
  return { STRIPS: strips, TIP_BLADES: tipBlades };
})();

/** Absorber tip height of a blade (h above the vessel bottom). */
export const bladeTipH = (insertion: number) => CORE.bottomOfActiveFuelH + insertion * BLADE.length;

const VERTEX = /* glsl */ `
uniform float uTime;
uniform float uReaction;
uniform float uVisible;
uniform float uFloor;
uniform float uTip[${TIP_BLADES.length}];
uniform vec4 uCore;   // bottom h, top h, strip half width, face offset
uniform vec4 uLook;   // size (m), min pixels, life (s), share below a blade tip
uniform float uPixelWorld;
attribute vec4 aSlot; // face, strip centre (m), tip index, period (s)
varying vec2 vUv;
varying float vAlpha;

// PCG hash: integer, so every GPU gives the same glints.
uint pcg( uint v ) {
	uint state = v * 747796405u + 2891336453u;
	uint word = ( ( state >> ( ( state >> 28u ) + 4u ) ) ^ state ) * 277803737u;
	return ( word >> 22u ) ^ word;
}
float unit( uint v ) { return float( pcg( v ) ) * ( 1.0 / 4294967296.0 ); }

void main() {
	uint slot = uint( gl_InstanceID );
	float period = aSlot.w;
	float cycles = uTime / period + unit( slot * 7u + 1u );
	float n = floor( cycles );
	float age = ( cycles - n ) * period;
	uint key = pcg( slot * 9781u + uint( n ) * 6271u + 17u );
	float y = mix( uCore.x, uCore.y, unit( key ) );
	float s = aSlot.y + ( 2.0 * unit( key + 1u ) - 1.0 ) * uCore.z;
	float pick = unit( key + 2u );

	// Which glints flash: the reaction share of them (soft, so a change thins them smoothly).
	float chosen = smoothstep( pick - 0.06, pick + 0.06, uReaction );
	float flash = smoothstep( 0.0, 0.05, age ) * ( 1.0 - smoothstep( 0.07, uLook.z, age ) );
	float tip = uTip[ int( aSlot.z + 0.5 ) ];
	float local = mix( uLook.w, 1.0, smoothstep( tip - 0.02, tip + 0.2, y ) );
	float alpha = uVisible * chosen * flash * local * step( uFloor, y );
	if ( alpha < 0.003 ) {
		gl_Position = vec4( 2.0, 2.0, 2.0, 1.0 ); // collapsed: outside the clip volume
		return;
	}

	bool faceX = aSlot.x < 0.5;
	vec3 centre = faceX ? vec3( uCore.w, y, s ) : vec3( -s, y, -uCore.w );
	vec3 across = faceX ? vec3( 0.0, 0.0, 1.0 ) : vec3( 1.0, 0.0, 0.0 );
	vec3 world = ( modelMatrix * vec4( centre, 1.0 ) ).xyz;
	float dist = length( cameraPosition - world );
	float size = max( uLook.x * ( 0.85 + 0.3 * unit( key + 3u ) ) * ( 0.85 + 0.3 * age / uLook.z ), uPixelWorld * dist * uLook.y );
	vec3 corner = centre + ( across * position.x + vec3( 0.0, 1.0, 0.0 ) * position.y ) * ( 0.5 * size );
	gl_Position = projectionMatrix * modelViewMatrix * vec4( corner, 1.0 );
	vUv = position.xy;
	vAlpha = alpha;
}
`;

const FRAGMENT = /* glsl */ `
uniform vec3 uColor;
uniform vec2 uShade; // rim multiplier, alpha
varying vec2 vUv;
varying float vAlpha;

void main() {
	// A small bright point with a thin darker rim: readable on the light channels, no halo glow.
	float d = length( vUv );
	if ( d > 1.0 ) discard;
	float core = 1.0 - smoothstep( 0.3, 0.62, d );
	float ring = smoothstep( 0.6, 0.74, d ) * ( 1.0 - smoothstep( 0.86, 1.0, d ) );
	float a = max( core, 0.45 * ring ) * vAlpha * uShade.y;
	if ( a < 0.004 ) discard;
	vec3 rgb = mix( uColor, uColor * uShade.x, ring * ( 1.0 - core ) );
	gl_FragColor = vec4( rgb, a );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}
`;

export interface ActivityUniforms {
  uTime: IUniform<number>;
  uReaction: IUniform<number>;
  uVisible: IUniform<number>;
  uFloor: IUniform<number>;
  uTip: IUniform<number[]>;
  uPixelWorld: IUniform<number>;
  [name: string]: IUniform;
}

/** Slots for a quality density (`particlesMultiplier`, with a floor so Low tells the same story). */
export const activitySlots = (density: number) => Math.round(ACTIVITY_LOOK.slots * Math.max(ACTIVITY_LOOK.minDensity, density));

export function buildActivity(density: number) {
  const L = ACTIVITY_LOOK;
  const count = activitySlots(density);
  const slot = new Float32Array(count * 4);
  const rnd = seededRandom('core-activity');
  for (let i = 0; i < count; i++) {
    const strip = STRIPS[i % STRIPS.length]!;
    slot.set([strip.face, strip.s, strip.tip, L.period[0] + (L.period[1] - L.period[0]) * rnd()], i * 4);
  }
  const geometry = new InstancedBufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
  geometry.setIndex([0, 1, 2, 0, 2, 3]);
  geometry.setAttribute('aSlot', new InstancedBufferAttribute(slot, 4));
  geometry.instanceCount = count;

  const uniforms: ActivityUniforms = {
    uTime: { value: 0 },
    uReaction: { value: 1 },
    uVisible: { value: 0 },
    uFloor: { value: -1e4 },
    uTip: { value: TIP_BLADES.map(() => 0) },
    uPixelWorld: { value: 0.001 },
    uCore: { value: new Vector4(CORE.bottomOfActiveFuelH + 0.05, TOP_OF_ACTIVE_FUEL_H - 0.05, L.stripHalfWidth, L.faceOffset) },
    uLook: { value: new Vector4(L.size, L.minPixels, L.life, L.belowTip) },
    uColor: { value: new Color(L.color) },
    uShade: { value: new Vector2(L.rim, L.alpha) },
  };
  const material = new ShaderMaterial({
    name: 'core-activity',
    uniforms,
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    transparent: true,
    depthWrite: false,
    blending: NormalBlending,
    side: DoubleSide,
  }) as ShaderMaterial & { uniforms: ActivityUniforms };
  return { geometry, material, count };
}
