/**
 * Stage 10 fission inset shaders. A camera-space overlay drawn in the normal pass, last
 * (renderOrder), so it needs no render target or post-processing:
 *
 *  - backdrop: one full-screen quad at a fixed view depth; dark inside an iris that opens from the
 *    fuel spot (its screen position is projected from world space in the vertex shader, so it
 *    follows the master camera exactly); it dissolves as the view zooms back out. It writes depth
 *    (and ignores the scene's), so the micro world behind it is self-contained;
 *  - particles: the nucleons and neutrons, one instanced sphere draw; positions are analytic
 *    functions of τ (wobble, dumbbell, split with drag, relaxation into round fragments, neutron
 *    paths): no physics, no history, so any seek shows the same frame;
 *  - sprites: the energy pulse at the split and the heat along the two fragment paths;
 *  - labels: up to three names from a canvas atlas.
 *
 * Micro units: the screen half-height at the content depth (aspect-independent). Normal
 * blending, tone mapped; nothing additive.
 */
import { CanvasTexture, Color, LinearFilter, LinearMipmapLinearFilter, NormalBlending, ShaderMaterial, Vector2, Vector3, type IUniform } from 'three';
import { FISSION_LABELS, FISSION_LAYOUT as L, FISSION_LOOK as K, FISSION_TIMING as T } from '../../config/fission';
import { glslVec3, type FissionData } from './fissionData';

const f = (x: number) => Number(x).toFixed(6);

/** Constants and motion functions shared by every inset shader (vertex side). */
function motionGlsl(d: FissionData): string {
  const { a, b } = d;
  const vHeavy = (n: typeof a) => (L.fragmentSpeed * n.lightShare) / (1 - n.lightShare);
  const n0Mid = d.n0.point.map((v, i) => v * 0.45 + L.neutronStart[i]! * 0.55);
  return /* glsl */ `
uniform float uTau;
uniform float uDepth;
uniform vec3 uAnchor;
uniform float uZoom;

const float LOBE = ${f(L.lobeSeparation)};
const float DRAG = ${f(L.drag)};
const float WOB_AMP = ${f(L.wobble.amplitude)};
const float WOB_FREQ = ${f(L.wobble.frequency)};
const float NUC_SCALE = ${f(K.nucleonScale)};

const vec3 A_C = ${glslVec3(a.center)};
const float A_R = ${f(a.radius)};
const vec3 A_D = ${glslVec3(a.axis)};
const float A_SPLIT = ${f(a.split)};
const vec3 A_CL = ${glslVec3(a.centLight)};
const vec3 A_CH = ${glslVec3(a.centHeavy)};
const float A_VL = ${f(L.fragmentSpeed)};
const float A_VH = ${f(vHeavy(a))};
const float A_TE = ${f(T.excite[0])};
const float A_TX = ${f(T.excite[1])};
const float A_TS = ${f(T.split)};

const vec3 B_C = ${glslVec3(b.center)};
const float B_R = ${f(b.radius)};
const vec3 B_D = ${glslVec3(b.axis)};
const float B_SPLIT = ${f(b.split)};
const float B_TE = ${f(T.chainExcite[0])};
const float B_TX = ${f(T.chainExcite[1])};

const vec3 N0_START = ${glslVec3(L.neutronStart)};
const vec3 N0_END = ${glslVec3(d.n0.point)};
const vec3 N0_LABEL = ${glslVec3(n0Mid)};
const float T_IN0 = ${f(T.neutronIn[0])};
const float T_IN1 = ${f(T.neutronIn[1])};
const vec3 SPLIT_P = ${glslVec3(d.splitPoint)};
const vec3 N1_END = ${glslVec3(d.n1.point)};
const float T_N1 = ${f(T.chainAbsorb)};
const vec3 N2_DIR = ${glslVec3(L.releasedDirections[0])};
const vec3 N3_DIR = ${glslVec3(L.releasedDirections[1])};
const float N_SPEED = ${f(L.releasedSpeed)};
const float HEAT0 = ${f(T.heat[0])};
const float HEAT1 = ${f(T.heat[1])};

float ease01( float x ) { x = clamp( x, 0.0, 1.0 ); return x * x * x * ( x * ( x * 6.0 - 15.0 ) + 10.0 ); }

/** The fuel spot the inset opens from, in NDC (it follows the master camera). */
vec2 irisCenter() {
	vec4 c = projectionMatrix * viewMatrix * vec4( uAnchor, 1.0 );
	return c.xy / c.w;
}

/**
 * Micro units (screen half-heights at uDepth, z towards the camera) -> view space, scaled by the
 * zoom about the fuel spot: the micro world grows out of the fuel and shrinks back into it.
 */
vec3 microToView( vec3 m ) {
	float s = uDepth / projectionMatrix[ 1 ][ 1 ];
	vec2 c = irisCenter();
	vec2 spot = vec2( c.x * projectionMatrix[ 1 ][ 1 ] / projectionMatrix[ 0 ][ 0 ], c.y );
	m = vec3( spot + ( m.xy - spot ) * uZoom, m.z * uZoom );
	return vec3( m.xy * s, -uDepth + m.z * s );
}

/** How far a fragment has travelled along the axis since the split (drag: fast, then slowing). */
float travel( float v, float dt ) { return v * ( 1.0 - exp( -DRAG * dt ) ) / DRAG; }

/**
 * A nucleon of a nucleus: excited (wobble), stretched into a dumbbell with a thinning neck, split
 * (each fragment along the axis, the light one faster), relaxing into a round fragment.
 */
vec3 nucleon( vec3 C, float R, vec3 D, float splitA, float tE, float tX, float tS, float vL, float vH, vec3 home, vec3 cent, vec3 rest, float side ) {
	float ex = ease01( ( uTau - tE ) / ( tX - tE ) );
	float ph = max( uTau - tE, 0.0 );
	float wob = step( tE, uTau ) * WOB_AMP * sin( 6.2831853 * WOB_FREQ * ph ) * ( 1.0 - ex ) * ease01( ph / 0.15 );
	float a = dot( home, D );
	vec3 q = home - a * D;
	float neck = exp( -pow( ( a - splitA ) / 0.3, 2.0 ) );
	vec3 p = home + D * ( a * wob ) - q * ( 0.4 * ex * neck );
	float dt = max( uTau - tS, 0.0 );
	vec3 local = mix( p, cent + rest, ease01( dt / 0.5 ) );
	return C + R * local + D * side * ( LOBE * ex + travel( side > 0.0 ? vL : vH, dt ) );
}

vec3 nucleonA( vec3 home, vec3 cent, vec3 rest, float side ) {
	return nucleon( A_C, A_R, A_D, A_SPLIT, A_TE, A_TX, A_TS, A_VL, A_VH, home, cent, rest, side );
}

vec3 nucleonB( vec3 home, vec3 cent, vec3 rest, float side ) {
	return nucleon( B_C, B_R, B_D, B_SPLIT, B_TE, B_TX, 1.0e4, 0.0, 0.0, home, cent, rest, side );
}

/** A first-nucleus fragment's centre (side +1 light, -1 heavy). */
vec3 fragmentA( float side ) {
	float dt = max( uTau - A_TS, 0.0 );
	return A_C + A_R * ( side > 0.0 ? A_CL : A_CH ) + A_D * side * ( LOBE * ease01( ( uTau - A_TE ) / ( A_TX - A_TE ) ) + travel( side > 0.0 ? A_VL : A_VH, dt ) );
}

/**
 * Neutron \`id\`: 0 arrives and joins the first nucleus; 1 is released at the split and, slowing,
 * joins the second; 2 and 3 are released and leave the view. xyz micro position, w visibility.
 */
vec4 neutron( float id, vec3 home, vec3 cent, vec3 rest, float side ) {
	if ( id < 0.5 ) {
		if ( uTau < T_IN1 ) return vec4( mix( N0_START, N0_END, clamp( ( uTau - T_IN0 ) / ( T_IN1 - T_IN0 ), 0.0, 1.0 ) ), step( T_IN0, uTau ) );
		return vec4( nucleonA( home, cent, rest, side ), 1.0 );
	}
	if ( uTau < A_TS ) return vec4( SPLIT_P, 0.0 );
	float dt = uTau - A_TS;
	if ( id < 1.5 ) {
		if ( uTau < T_N1 ) return vec4( mix( SPLIT_P, N1_END, 1.0 - pow( 1.0 - dt / ( T_N1 - A_TS ), 2.2 ) ), 1.0 );
		return vec4( nucleonB( home, cent, rest, side ), 1.0 );
	}
	vec3 dir = id < 2.5 ? N2_DIR : N3_DIR;
	return vec4( SPLIT_P + dir * N_SPEED * ( 1.0 - exp( -0.35 * dt ) ) / 0.35, 1.0 - smoothstep( 1.0, 1.5, dt ) );
}
`;
}

/** Fragment side: the iris mask (screen half-height units around the fuel spot). */
const IRIS_GLSL = /* glsl */ `
uniform vec2 uResolution;
uniform float uIris;
uniform float uFeather;
float irisMask( vec2 center ) {
	vec2 ndc = gl_FragCoord.xy / uResolution * 2.0 - 1.0;
	float aspect = uResolution.x / uResolution.y;
	float d = length( vec2( ( ndc.x - center.x ) * aspect, ndc.y - center.y ) );
	return 1.0 - smoothstep( uIris - uFeather, uIris, d );
}
`;

const OUTPUT = /* glsl */ `
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
`;

export interface InsetUniforms {
  uTau: IUniform<number>;
  uDepth: IUniform<number>;
  uAnchor: IUniform<Vector3>;
  uResolution: IUniform<Vector2>;
  uIris: IUniform<number>;
  uFeather: IUniform<number>;
  uZoom: IUniform<number>;
}

export function createInsetUniforms(anchor: Vector3): InsetUniforms {
  return {
    uTau: { value: 0 },
    uDepth: { value: L.depth },
    uAnchor: { value: anchor },
    uResolution: { value: new Vector2(1920, 1080) },
    uIris: { value: 0 },
    uFeather: { value: 0.035 },
    uZoom: { value: 1 },
  };
}

type Mat<U> = ShaderMaterial & { uniforms: InsetUniforms & U };

function material<U extends Record<string, IUniform>>(name: string, shared: InsetUniforms, own: U, vertexShader: string, fragmentShader: string, depth: { test: boolean; write: boolean }): Mat<U> {
  return new ShaderMaterial({
    name,
    uniforms: { ...shared, ...own },
    vertexShader,
    fragmentShader,
    transparent: true,
    depthTest: depth.test,
    depthWrite: depth.write,
    blending: NormalBlending,
  }) as Mat<U>;
}

// ---- Backdrop ---------------------------------------------------------------------------------------------------

export function createBackdropMaterial(d: FissionData, shared: InsetUniforms) {
  const own = {
    uBackDepth: { value: L.backdropDepth },
    uOpacity: { value: 0 },
    uMarker: { value: 0 },
    uBg: { value: new Color(K.backdrop) },
    uBgCenter: { value: new Color(K.backdropCenter) },
    uBgAlpha: { value: K.backdropAlpha },
    uMarkerColor: { value: new Color(K.marker) },
  };
  const vertex = /* glsl */ `
${motionGlsl(d)}
uniform float uBackDepth;
varying vec2 vIris;
varying vec2 vNdc;
void main() {
	vec4 c = projectionMatrix * vec4( 0.0, 0.0, -uBackDepth, 1.0 );
	gl_Position = vec4( position.xy * c.w, c.z, c.w );
	vNdc = position.xy;
	vIris = irisCenter();
}
`;
  const fragment = /* glsl */ `
${IRIS_GLSL}
uniform float uOpacity;
uniform float uMarker;
uniform vec3 uBg;
uniform vec3 uBgCenter;
uniform float uBgAlpha;
uniform vec3 uMarkerColor;
varying vec2 vIris;
varying vec2 vNdc;
void main() {
	float aspect = uResolution.x / uResolution.y;
	float mask = irisMask( vIris );
	float d = length( vec2( ( vNdc.x - vIris.x ) * aspect, vNdc.y - vIris.y ) );
	// A quiet vignette: a touch lighter in the middle of the frame.
	vec3 bg = mix( uBg, uBgCenter, 1.0 - smoothstep( 0.0, 1.7, length( vec2( vNdc.x * aspect, vNdc.y ) ) ) );
	vec3 col = bg;
	float a = uBgAlpha * mask * uOpacity;
	// The fuel-spot marker: a thin ring, before the iris opens over it.
	float ring = uMarker * ( 1.0 - smoothstep( 0.002, 0.008, abs( d - 0.05 ) ) );
	col = mix( col, uMarkerColor, ring * ( 1.0 - mask ) );
	a = max( a, ring * 0.8 * ( 1.0 - mask ) );
	if ( a < 0.003 ) discard;
	gl_FragColor = vec4( col, a );
	${OUTPUT}
}
`;
  return material('fission-backdrop', shared, own, vertex, fragment, { test: false, write: true });
}

// ---- Particles (nucleons and neutrons) --------------------------------------------------------------------------

export function createParticleMaterial(d: FissionData, shared: InsetUniforms) {
  const own = {
    uAlpha: { value: 0 },
    uProton: { value: new Color(K.proton) },
    uNeutron: { value: new Color(K.neutron) },
    uFree: { value: new Color(K.freeNeutron) },
  };
  const vertex = /* glsl */ `
${motionGlsl(d)}
uniform float uAlpha;
uniform vec3 uProton;
uniform vec3 uNeutron;
uniform vec3 uFree;
attribute vec3 aHome;
attribute vec3 aCent;
attribute vec3 aRest;
attribute vec4 aMeta; // role (0 first nucleus, 1 second, 2 neutron), side or neutron id, tone, side of an absorbed neutron
varying vec3 vNormal;
varying vec3 vColor;
varying float vAlpha;
varying vec2 vIris;
void main() {
	float role = aMeta.x;
	vec3 m;
	float vis = 1.0;
	vec3 col = mix( uNeutron, uProton, aMeta.z );
	float r = A_R * NUC_SCALE;
	if ( role < 0.5 ) {
		m = nucleonA( aHome, aCent, aRest, aMeta.y );
	} else if ( role < 1.5 ) {
		m = nucleonB( aHome, aCent, aRest, aMeta.y );
		r = B_R * NUC_SCALE;
	} else {
		vec4 n = neutron( aMeta.y, aHome, aCent, aRest, aMeta.w );
		m = n.xyz;
		vis = n.w;
		// A free neutron is a lighter cool grey; once absorbed it settles to the nucleus' neutron tone.
		float joined = aMeta.y < 0.5 ? T_IN1 : ( aMeta.y < 1.5 ? T_N1 : 1.0e4 );
		col = mix( uFree, uNeutron, ease01( ( uTau - joined ) / 0.4 ) );
	}
	vAlpha = vis * uAlpha;
	if ( vAlpha < 0.002 ) {
		gl_Position = vec4( 2.0, 2.0, 2.0, 1.0 );
		return;
	}
	gl_Position = projectionMatrix * vec4( microToView( m + position * r ), 1.0 );
	vNormal = normal;
	vColor = col;
	vIris = irisCenter();
}
`;
  const fragment = /* glsl */ `
${IRIS_GLSL}
varying vec3 vNormal;
varying vec3 vColor;
varying float vAlpha;
varying vec2 vIris;
void main() {
	float a = vAlpha * irisMask( vIris );
	if ( a < 0.003 ) discard;
	vec3 n = normalize( vNormal );
	// Matte: one soft key from the upper left, a low fill, a faint edge.
	float key = max( dot( n, normalize( vec3( -0.45, 0.65, 0.62 ) ) ), 0.0 );
	float edge = pow( 1.0 - max( n.z, 0.0 ), 2.5 );
	vec3 c = vColor * ( 0.34 + 0.74 * key ) + vec3( 0.045 ) * edge;
	gl_FragColor = vec4( c, a );
	${OUTPUT}
}
`;
  return material('fission-particles', shared, own, vertex, fragment, { test: true, write: true });
}

// ---- Sprites (energy pulse, heat along the fragment paths) ------------------------------------------------------

export const SPRITE_KINDS = 5;

export function createSpriteMaterial(d: FissionData, shared: InsetUniforms) {
  const own = {
    uAlpha: { value: 0 },
    uEnergy: { value: new Color(K.energy) },
    uHeat: { value: new Color(K.heat) },
  };
  const vertex = /* glsl */ `
${motionGlsl(d)}
uniform float uAlpha;
uniform vec3 uEnergy;
uniform vec3 uHeat;
attribute float aKind; // 0 energy swell, 1 energy core, 2 heat (light fragment), 3 heat (heavy fragment), 4 warm fuel spot
varying vec2 vLocal;
varying vec3 vShape; // half length, radius / half width, feather
varying vec4 vColor;
varying vec2 vIris;
void main() {
	float dt = uTau - A_TS;
	vec3 p0 = SPLIT_P;
	vec3 p1 = SPLIT_P;
	float w;
	float feather;
	float alpha;
	vec3 col = uEnergy;
	if ( aKind < 0.5 ) {
		// A soft, modest swell of energy at the split (no ring, no shockwave).
		float x = clamp( dt / 0.55, 0.0, 1.0 );
		w = 0.08 + 0.22 * ( 1.0 - pow( 1.0 - x, 2.0 ) );
		feather = 0.18;
		alpha = step( 0.0, dt ) * 0.16 * pow( 1.0 - x, 1.4 );
	} else if ( aKind < 1.5 ) {
		float x = clamp( dt / 0.35, 0.0, 1.0 );
		w = 0.06 + 0.1 * x;
		feather = 0.12;
		alpha = step( 0.0, dt ) * 0.3 * ( 1.0 - x );
	} else if ( aKind > 3.5 ) {
		// The heat, back at the macro scale: a soft warm spot on the fuel where the view opened. It
		// sits at the zoom centre and keeps its screen size while the micro view shrinks into it.
		vec2 c = irisCenter();
		p0 = vec3( c.x * projectionMatrix[ 1 ][ 1 ] / projectionMatrix[ 0 ][ 0 ], c.y, 0.0 );
		p1 = p0;
		float z = max( uZoom, 0.02 );
		w = 0.035 / z;
		feather = 0.07 / z;
		alpha = 0.34 * ease01( ( uTau - 3.85 ) / 0.3 );
		col = uHeat;
	} else {
		// Heat left in the fuel along each fragment's path as it slows: widening, warm, soft.
		p1 = fragmentA( aKind < 2.5 ? 1.0 : -1.0 );
		float h = ease01( ( uTau - HEAT0 ) / ( HEAT1 - HEAT0 ) );
		w = 0.05 + 0.16 * h;
		feather = 0.1 + 0.14 * h;
		alpha = 0.27 * ease01( ( dt - 0.08 ) / 0.4 ) * ( 1.0 - 0.15 * h );
		col = uHeat;
	}
	vec2 seg = p1.xy - p0.xy;
	float len = length( seg );
	vec2 u = len > 1.0e-5 ? seg / len : vec2( 1.0, 0.0 );
	vec2 v = vec2( -u.y, u.x );
	vec2 local = position.xy * vec2( len * 0.5 + w + feather, w + feather );
	vec3 m = vec3( 0.5 * ( p0.xy + p1.xy ) + u * local.x + v * local.y, -0.1 );
	gl_Position = projectionMatrix * vec4( microToView( m ), 1.0 );
	vLocal = local;
	vShape = vec3( len * 0.5, w, feather );
	vColor = vec4( col, alpha * uAlpha );
	vIris = irisCenter();
}
`;
  const fragment = /* glsl */ `
${IRIS_GLSL}
varying vec2 vLocal;
varying vec3 vShape;
varying vec4 vColor;
varying vec2 vIris;
void main() {
	float d = length( vec2( max( abs( vLocal.x ) - vShape.x, 0.0 ), vLocal.y ) );
	float a = ( 1.0 - smoothstep( vShape.y * 0.2, vShape.y + vShape.z, d ) ) * vColor.a * irisMask( vIris );
	if ( a < 0.003 ) discard;
	gl_FragColor = vec4( vColor.rgb, a );
	${OUTPUT}
}
`;
  return material('fission-sprites', shared, own, vertex, fragment, { test: true, write: false });
}

// ---- Labels --------------------------------------------------------------------------------------------------------

const ATLAS = { width: 1024, row: 64, font: '500 40px system-ui, "Segoe UI", Roboto, Arial, sans-serif' } as const;
/** Label height in micro units (a ~43 px quad at 1080p; the text cap height is about half). */
const LABEL_HEIGHT = 0.08;

/**
 * Paints the label atlas: one row per label (FISSION_LABELS order), white text. Returns each
 * label's width share of the atlas.
 */
function paintLabelAtlas(canvas: HTMLCanvasElement, texts: readonly string[]): number[] {
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = ATLAS.font;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  return texts.map((text, i) => {
    ctx.fillText(text, 8, ATLAS.row * (i + 0.5));
    return (ctx.measureText(text).width + 16) / ATLAS.width;
  });
}

function labelAtlas(texts: readonly string[]): { texture: CanvasTexture; widths: number[] } {
  const canvas = document.createElement('canvas');
  canvas.width = ATLAS.width;
  canvas.height = ATLAS.row * 4;
  const widths = paintLabelAtlas(canvas, texts);
  const texture = new CanvasTexture(canvas);
  texture.minFilter = LinearMipmapLinearFilter;
  texture.magFilter = LinearFilter;
  return { texture, widths };
}

/**
 * A language switch: repaint the atlas in place and re-upload it (one small texture; no new
 * material, program or remount). Widths are updated in the same uniform array.
 */
export function setLabelTexts(material: ReturnType<typeof createLabelMaterial>, texts: readonly string[]): void {
  const { uAtlas, uWidth } = material.uniforms;
  const widths = paintLabelAtlas(uAtlas.value.image as HTMLCanvasElement, texts);
  widths.forEach((w, i) => (uWidth.value[i] = w));
  uAtlas.value.needsUpdate = true;
}

export function createLabelMaterial(d: FissionData, shared: InsetUniforms, texts: readonly string[]) {
  const { texture, widths } = labelAtlas(texts);
  const own = {
    uAtlas: { value: texture },
    uLabelAlpha: { value: FISSION_LABELS.map(() => 0) },
    uWidth: { value: widths },
    uColor: { value: new Color(K.label) },
  };
  const n = FISSION_LABELS.length;
  const vertex = /* glsl */ `
${motionGlsl(d)}
uniform float uLabelAlpha[ ${n} ];
uniform float uWidth[ ${n} ];
attribute float aLabel;
varying vec2 vUv;
varying float vAlpha;
varying vec2 vIris;
void main() {
	int i = int( aLabel + 0.5 );
	vAlpha = uLabelAlpha[ i ];
	if ( vAlpha < 0.002 ) {
		gl_Position = vec4( 2.0, 2.0, 2.0, 1.0 );
		return;
	}
	// Anchors: above the first nucleus; above the incoming neutron's path; beside the heat.
	vec3 anchor = i == 0 ? A_C + vec3( -A_R * 0.55, A_R + 0.1, 0.0 )
		: i == 1 ? N0_LABEL + vec3( -0.08, 0.1, 0.0 )
		: SPLIT_P + vec3( 0.3, -0.32, 0.0 );
	float h = ${f(LABEL_HEIGHT)};
	float aspect = uWidth[ i ] * ${f(ATLAS.width / ATLAS.row)};
	vec2 corner = position.xy * 0.5 + 0.5; // 0..1
	vec3 m = anchor + vec3( corner.x * h * aspect, ( corner.y - 0.5 ) * h, 0.0 );
	gl_Position = projectionMatrix * vec4( microToView( m ), 1.0 );
	vUv = vec2( corner.x * uWidth[ i ], 1.0 - ( float( i ) + 1.0 - corner.y ) * ${f(ATLAS.row / (ATLAS.row * 4))} );
	vIris = irisCenter();
}
`;
  const fragment = /* glsl */ `
${IRIS_GLSL}
uniform sampler2D uAtlas;
uniform vec3 uColor;
varying vec2 vUv;
varying float vAlpha;
varying vec2 vIris;
void main() {
	float a = texture2D( uAtlas, vUv ).a * vAlpha * 0.9 * irisMask( vIris );
	if ( a < 0.003 ) discard;
	gl_FragColor = vec4( uColor, a );
	${OUTPUT}
}
`;
  return material('fission-labels', shared, own, vertex, fragment, { test: false, write: false });
}
