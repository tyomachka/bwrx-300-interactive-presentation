/**
 * Stage 7 flow shaders: two programs for the whole operating-flow system.
 *
 *  - Streaks (vessel): one instanced quad per particle. The vertex shader reads the particle's
 *    streamline from a float texture (flowPaths.ts), places it at `fract(seed + time / duration)`,
 *    orients it along the flow and sizes it by phase and speed: water streaks, vapour bubbles,
 *    pale steam, droplets. It also applies the vessel cut (a particle in the removed quadrant is
 *    collapsed before rasterisation) and the channel's intensity. No CPU work per particle.
 *  - Pulse tubes (main steam line, turbine casings, electricity): pulses travelling along a tube's
 *    length behind an advancing front, so a line lights up only where the steam / power has got to.
 *
 * Both blend normally (no additive glow: PROJECT.md "no fictional glowing coolant"), write no
 * depth, test against the scene's depth, and go through the renderer's tone mapping.
 */
import { Color, DataTexture, DoubleSide, FloatType, NearestFilter, NormalBlending, RGBAFormat, ShaderMaterial, Vector3, Vector4, type IUniform } from 'three';
import { FLOW_LOOK, FLOW_PATH_SAMPLES, VESSEL_FLOW_CHANNELS } from '../../config/flow';

const linear = (srgb: string) => new Color(srgb);

// ---- Streak particles ---------------------------------------------------------------------------------------------

const STREAK_VERTEX = /* glsl */ `
uniform sampler2D uPaths;
uniform float uTime;
uniform float uIntensity[${VESSEL_FLOW_CHANNELS.length}];
uniform float uBoil;
uniform vec4 uCut;        // removed box: z > x and x < y and y > z (world), w = 1 while cut
uniform float uFaceVisible;
uniform float uPixelWorld; // world size of a pixel at unit distance
uniform float uMinPixels;
uniform vec3 uWaterColor;
uniform vec3 uBubbleColor;
uniform vec3 uSteamColor;
uniform vec3 uDropletColor;
uniform vec4 uWater;   // alpha, length, width
uniform vec4 uSteam;   // alpha, length, width
uniform vec4 uBubble;  // alpha, size, share of the particles, mixture paling
uniform vec3 uDroplet; // alpha, size, share of the particles
attribute vec4 aPath;  // row, duration (s), channel, clip (0 volume, 1 face)
attribute vec4 aSeed;  // phase offset, kind, size jitter
varying vec2 vUv;
varying vec4 vColor;
varying float vRound;

const int SAMPLES = ${FLOW_PATH_SAMPLES};

void main() {
	int channel = int( aPath.z + 0.5 );
	float u = fract( aSeed.x + uTime / aPath.y );
	float f = u * float( SAMPLES - 1 );
	int i = min( int( f ), SAMPLES - 2 );
	int row = int( aPath.x + 0.5 );
	vec4 a = texelFetch( uPaths, ivec2( i, row ), 0 );
	vec4 b = texelFetch( uPaths, ivec2( i + 1, row ), 0 );
	vec4 s = mix( a, b, f - float( i ) );
	vec3 world = ( modelMatrix * vec4( s.xyz, 1.0 ) ).xyz;
	vec3 delta = mat3( modelMatrix ) * ( b.xyz - a.xyz );
	float speed = length( delta ) * float( SAMPLES - 1 ) / aPath.y;
	float phase = s.w;

	// Visibility: channel intensity, soft birth and death, the vessel cut.
	float visible = uIntensity[ channel ] * smoothstep( 0.0, 0.06, u ) * ( 1.0 - smoothstep( 0.92, 1.0, u ) );
	bool removed = uCut.w > 0.5 && world.z > uCut.x && world.x < uCut.y && world.y > uCut.z;
	visible *= aPath.w > 0.5 ? uFaceVisible : ( removed ? 0.0 : 1.0 );

	// Look by phase: water streaks turn into vapour bubbles as the mixture forms; steam is pale,
	// wide and soft, its droplets are caught in the dryer (wet -> dry).
	float kind = aSeed.y;
	vec3 color;
	float alpha;
	float len;
	float wid;
	float roundness;
	if ( phase < 1.5 ) {
		float boil = channel == 0 ? uBoil : 1.0;
		float bubble = step( kind, uBubble.z ) * smoothstep( 0.15, 0.85, phase ) * boil;
		float size = uBubble.y * ( 0.7 + 0.6 * aSeed.z );
		color = mix( mix( uWaterColor, uBubbleColor, uBubble.w * phase * boil ), uBubbleColor, bubble );
		alpha = mix( uWater.x, uBubble.x, bubble );
		len = mix( uWater.y + 0.12 * speed, size, bubble );
		wid = mix( uWater.z, size, bubble );
		roundness = bubble;
	} else if ( kind < uDroplet.z ) {
		color = uDropletColor;
		alpha = uDroplet.x * clamp( 3.0 - phase, 0.0, 1.0 );
		len = uDroplet.y;
		wid = uDroplet.y;
		roundness = 1.0;
	} else {
		color = uSteamColor;
		alpha = uSteam.x * ( 1.0 + 0.12 * clamp( phase - 2.0, 0.0, 1.0 ) );
		len = uSteam.y + 0.1 * speed;
		wid = uSteam.z;
		roundness = 0.0;
	}
	alpha *= visible;
	if ( alpha < 0.003 ) {
		gl_Position = vec4( 2.0, 2.0, 2.0, 1.0 ); // collapsed: outside the clip volume
		return;
	}

	vec3 toCamera = cameraPosition - world;
	float dist = length( toCamera );
	wid = max( wid * aSeed.z, uPixelWorld * dist * uMinPixels );
	len = max( len * aSeed.z, wid );
	vec3 axis = length( delta ) > 1e-6 ? normalize( delta ) : vec3( 0.0, 1.0, 0.0 );
	// Facing the camera (counter-clockwise from its side).
	vec3 side = cross( toCamera / dist, axis );
	float sideLength = length( side );
	side = sideLength > 1e-3 ? side / sideLength : vec3( viewMatrix[ 0 ][ 0 ], viewMatrix[ 1 ][ 0 ], viewMatrix[ 2 ][ 0 ] );
	vec3 corner = world + axis * ( position.x * len * 0.5 ) + side * ( position.y * wid * 0.5 );
	gl_Position = projectionMatrix * viewMatrix * vec4( corner, 1.0 );
	vUv = position.xy;
	vColor = vec4( color, alpha );
	vRound = roundness;
}
`;

const STREAK_FRAGMENT = /* glsl */ `
varying vec2 vUv;
varying vec4 vColor;
varying float vRound;

void main() {
	// Streak: a comet, so the direction reads even in a still: a wide bright head (+x, the way it
	// moves) and a narrow tail fading behind it. Round: a disc with a brighter rim (a bubble).
	float along = 0.5 + 0.5 * vUv.x;
	float halfWidth = mix( 0.3, 1.0, along );
	float across = 1.0 - min( 1.0, abs( vUv.y ) / halfWidth );
	float streak = across * pow( along, 1.6 ) * ( 1.0 - smoothstep( 0.8, 1.0, vUv.x ) );
	// Round: a pale bubble with a darker rim, so it reads on light fuel and on dark steel alike.
	float d = length( vUv );
	float ring = smoothstep( 0.5, 0.75, d ) * ( 1.0 - smoothstep( 0.85, 1.0, d ) );
	float disc = max( 0.45 * ( 1.0 - smoothstep( 0.6, 0.8, d ) ), ring );
	float a = mix( streak, disc, vRound ) * vColor.a;
	if ( a < 0.004 ) discard;
	vec3 rgb = mix( vColor.rgb, vColor.rgb * vec3( 0.32, 0.42, 0.5 ), ring * vRound );
	gl_FragColor = vec4( rgb, a );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}
`;

export interface StreakUniforms {
  uPaths: IUniform<DataTexture>;
  uTime: IUniform<number>;
  uIntensity: IUniform<number[]>;
  uBoil: IUniform<number>;
  uCut: IUniform<Vector4>;
  uFaceVisible: IUniform<number>;
  uPixelWorld: IUniform<number>;
  [name: string]: IUniform;
}

export function createPathTexture(data: Float32Array, rows: number): DataTexture {
  const texture = new DataTexture(data, FLOW_PATH_SAMPLES, rows, RGBAFormat, FloatType);
  texture.minFilter = NearestFilter;
  texture.magFilter = NearestFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}

export function createStreakMaterial(paths: DataTexture): ShaderMaterial & { uniforms: StreakUniforms } {
  const L = FLOW_LOOK;
  const uniforms: StreakUniforms = {
    uPaths: { value: paths },
    uTime: { value: 0 },
    uIntensity: { value: VESSEL_FLOW_CHANNELS.map(() => 0) },
    uBoil: { value: 0 },
    uCut: { value: new Vector4(0, 0, 0, 0) },
    uFaceVisible: { value: 0 },
    uPixelWorld: { value: 0.001 },
    uMinPixels: { value: L.minPixels },
    uWaterColor: { value: linear(L.water.color) },
    uBubbleColor: { value: linear(L.bubble.color) },
    uSteamColor: { value: linear(L.steam.color) },
    uDropletColor: { value: linear(L.droplet.color) },
    uWater: { value: new Vector4(L.water.alpha, L.water.length, L.water.width, 0) },
    uSteam: { value: new Vector4(L.steam.alpha, L.steam.length, L.steam.width, 0) },
    uBubble: { value: new Vector4(L.bubble.alpha, L.bubble.size, L.bubble.share, L.bubble.mixturePale) },
    uDroplet: { value: new Vector3(L.droplet.alpha, L.droplet.size, L.droplet.share) },
  };
  const material = new ShaderMaterial({
    name: 'flow-streaks',
    uniforms,
    vertexShader: STREAK_VERTEX,
    fragmentShader: STREAK_FRAGMENT,
    transparent: true,
    depthWrite: false,
    blending: NormalBlending,
    // Quads face the camera by construction; double-sided costs nothing and covers degenerate turns.
    side: DoubleSide,
  });
  return material as ShaderMaterial & { uniforms: StreakUniforms };
}

// ---- Pulse tubes ---------------------------------------------------------------------------------------------------

/** Channels of a pulse-tube mesh: each tube's `aTube.w` selects one of these slots. */
export const PULSE_SLOTS = 3;

const PULSE_VERTEX = /* glsl */ `
attribute vec4 aTube; // length (m) at uv.x = 1, delay (m of front before it starts), end fade (m), channel
varying float vS;
varying vec4 vTube;

void main() {
	vS = uv.x * aTube.x;
	vTube = aTube;
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`;

const PULSE_FRAGMENT = /* glsl */ `
uniform float uTime;
uniform vec4 uMotion[ ${PULSE_SLOTS} ]; // speed (m/s), spacing (m), pulse length (m), base level
uniform vec4 uState[ ${PULSE_SLOTS} ];  // intensity, front (m), alpha
uniform vec3 uColor[ ${PULSE_SLOTS} ];
varying float vS;
varying vec4 vTube;

void main() {
	int c = int( vTube.w + 0.5 );
	vec4 motion = uMotion[ c ];
	vec4 state = uState[ c ];
	float front = state.y - vTube.y;
	float reached = 1.0 - smoothstep( front - 1.5, front, vS );
	float tail = vTube.z > 0.0 ? 1.0 - smoothstep( vTube.x - vTube.z, vTube.x, vS ) : 1.0;
	float level = state.x * reached * tail;
	if ( level < 0.002 ) discard;
	// Pulses travel with the flow: a soft tail and a crisp head.
	float behind = fract( ( vS - uTime * motion.x ) / motion.y ) * motion.y;
	float pulse = smoothstep( 0.0, 0.8 * motion.z, behind ) * ( 1.0 - smoothstep( 0.8 * motion.z, motion.z, behind ) );
	float a = level * state.z * ( motion.w + ( 1.0 - motion.w ) * pulse );
	if ( a < 0.003 ) discard;
	gl_FragColor = vec4( uColor[ c ], a );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}
`;

export interface PulseUniforms {
  uTime: IUniform<number>;
  uMotion: IUniform<Vector4[]>;
  uState: IUniform<Vector4[]>;
  uColor: IUniform<Color[]>;
  [name: string]: IUniform;
}

export interface PulseLook {
  color: string;
  alpha: number;
  base: number;
  spacing: number;
  pulse: number;
  speed: number;
}

export function createPulseMaterial(slots: readonly PulseLook[]): ShaderMaterial & { uniforms: PulseUniforms } {
  const pad = <T,>(make: (look: PulseLook | undefined) => T) => Array.from({ length: PULSE_SLOTS }, (_, i) => make(slots[i]));
  const uniforms: PulseUniforms = {
    uTime: { value: 0 },
    uMotion: { value: pad((l) => new Vector4(l?.speed ?? 1, l?.spacing ?? 1, l?.pulse ?? 0.5, l?.base ?? 0)) },
    uState: { value: pad((l) => new Vector4(0, 0, l?.alpha ?? 0, 0)) },
    uColor: { value: pad((l) => linear(l?.color ?? '#ffffff')) },
  };
  const material = new ShaderMaterial({
    name: 'flow-pulses',
    uniforms,
    vertexShader: PULSE_VERTEX,
    fragmentShader: PULSE_FRAGMENT,
    transparent: true,
    depthWrite: false,
    blending: NormalBlending,
  });
  return material as ShaderMaterial & { uniforms: PulseUniforms };
}
