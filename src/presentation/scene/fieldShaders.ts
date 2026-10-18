/**
 * Presentation v1 fission field (presentation/scene/fieldConfig.ts): the site table, the instance
 * data and the two programs (particles: nucleons and neutrons; sprites: heat along the fragments, the
 * split's energy, the gathering warmth, the warm spot left on the fuel). Same camera-space inset idea
 * as Stage 10 (no render target, no post-processing, drawn last), same nuclei, look and iris; the
 * Stage 10 shaders themselves are not touched (scene/fission/fissionShaders.ts).
 *
 * The site table is baked into the GLSL as constant arrays: per site its two alternating positions, its
 * cycle (phase, period, flight to the next site, the next site), the neutrons it seeds or loses, its split
 * axis and fragment centroids. Every position is an analytic function of τ.
 */
import { Color, InstancedBufferAttribute, NormalBlending, ShaderMaterial, type IUniform } from 'three';
import { FISSION_LAYOUT as L, FISSION_LOOK as K } from '../../config/fission';
import { fissionData, type NucleusData } from '../../scene/fission/fissionData';
import { seededRandom } from '../../scene/flow/flowPaths';
import type { InsetUniforms } from '../../scene/fission/fissionShaders';
import { COLOR } from '../design';
import { A_LOST_ANGLE, FIELD_CYCLE as C, FIELD_IDLE, FIELD_MOTION as M, FIELD_RINGS, FIELD_VIEW } from './fieldConfig';

const f = (x: number) => Number(x).toFixed(6);

/** The chain-carrying neutron's tint and trail (design.ts amber: the frame's one current concept). */
const CHAIN_TINT = COLOR.amber;
type V2 = readonly [number, number];

interface Site {
  posA: V2;
  posB: V2;
  posC: V2;
  phase: number;
  period: number;
  flight: number;
  next: number;
  seed: number;
  seedFlight: number;
  lost: [number, number];
  template: NucleusData;
  angle: number;
}

const NEVER = 1.0e4;

function buildSites(): Site[] {
  const rnd = seededRandom('talk-fission-field');
  const { a, b } = fissionData();
  const sites: Site[] = [];
  const firstOfRing: number[] = [];
  FIELD_RINGS.forEach((ring) => {
    const first = sites.length;
    firstOfRing.push(first);
    const n = ring.sites.length;
    const period = ring.steps.reduce((a, b) => a + b, 0);
    let offset = 0;
    ring.sites.forEach((p, k) => {
      // Three positions in turn for the nucleus that replaces a split one (a fresh U-235 near the spot).
      const ja = rnd() * Math.PI * 2;
      const jb = ja + 2.1 + 0.8 * rnd();
      const ra = 0.18 + 0.1 * rnd();
      const rb = 0.22 + 0.12 * rnd();
      sites.push({
        posA: p,
        posB: [p[0] + Math.cos(ja) * ra, p[1] + Math.sin(ja) * ra],
        posC: [p[0] + Math.cos(jb) * rb, p[1] + Math.sin(jb) * rb],
        phase: ring.start + offset,
        period,
        flight: ring.steps[k]! - C.excite,
        next: first + ((k + 1) % n),
        seed: -1,
        seedFlight: 0,
        lost: [rnd() * Math.PI * 2, 0],
        template: sites.length % 2 ? b : a,
        angle: rnd() * Math.PI * 2,
      });
      const s = sites[sites.length - 1]!;
      s.lost[1] = s.lost[0] + 2.1 + 0.6 * rnd();
      offset += ring.steps[k]!;
    });
  });
  // The growth: A (ring 0, first) seeds ring 1; B (ring 0, second) seeds ring 2.
  const [r0, r1, r2] = firstOfRing as [number, number, number];
  const A = sites[r0]!;
  const B = sites[r0 + 1]!;
  A.seed = r1;
  A.seedFlight = sites[r1]!.phase - (A.phase + C.excite);
  A.lost[1] = A_LOST_ANGLE;
  B.seed = r2;
  B.seedFlight = sites[r2]!.phase - (B.phase + C.excite);
  for (const p of FIELD_IDLE) {
    sites.push({ posA: p, posB: p, posC: p, phase: NEVER, period: NEVER, flight: 1, next: 0, seed: -1, seedFlight: 0, lost: [0, 0], template: sites.length % 2 ? b : a, angle: rnd() * Math.PI * 2 });
  }
  return sites;
}

export const FIELD_SITES = buildSites();
const NS = FIELD_SITES.length;

type V3 = [number, number, number];
const rot = (v: readonly number[], c: number, s: number): V3 => [v[0]! * c - v[1]! * s, v[0]! * s + v[1]! * c, v[2]!];

/** Light-fragment speed and the heavy one's share of it (equal momentum). */
const heavyRatio = (n: NucleusData) => n.lightShare / (1 - n.lightShare);

function siteTable(): string {
  const P: string[] = [];
  const Q: string[] = [];
  const T: string[] = [];
  const N: string[] = [];
  const D: string[] = [];
  const F: string[] = [];
  for (const s of FIELD_SITES) {
    const c = Math.cos(s.angle);
    const sn = Math.sin(s.angle);
    const axis = rot(s.template.axis, c, sn);
    const cl = rot(s.template.centLight, c, sn);
    const ch = rot(s.template.centHeavy, c, sn);
    P.push(`vec4( ${f(s.posA[0])}, ${f(s.posA[1])}, ${f(s.posB[0])}, ${f(s.posB[1])} )`);
    Q.push(`vec2( ${f(s.posC[0])}, ${f(s.posC[1])} )`);
    T.push(`vec4( ${f(s.phase)}, ${f(s.period)}, ${f(s.flight)}, ${f(s.next)} )`);
    N.push(`vec4( ${f(s.seed)}, ${f(s.seedFlight)}, ${f(s.lost[0])}, ${f(s.lost[1])} )`);
    D.push(`vec4( ${f(axis[0])}, ${f(axis[1])}, ${f(s.template.split)}, ${f(heavyRatio(s.template))} )`);
    F.push(`vec4( ${f(cl[0])}, ${f(cl[1])}, ${f(ch[0])}, ${f(ch[1])} )`);
  }
  const arr = (name: string, rows: string[], type = 'vec4') => `const ${type} ${name}[ NS ] = ${type}[ NS ](\n\t${rows.join(',\n\t')}\n);`;
  return [arr('SITE_P', P), arr('SITE_Q', Q, 'vec2'), arr('SITE_T', T), arr('SITE_N', N), arr('SITE_D', D), arr('SITE_F', F)].join('\n');
}

const [vx0, vy0, vs0] = FIELD_VIEW.start;
const [vx1, vy1, vs1] = FIELD_VIEW.end;

/** Shared vertex-side constants and motion (both programs). */
const MOTION = /* glsl */ `
uniform float uTau;
uniform float uDepth;
uniform vec3 uAnchor;
uniform float uZoom;

const int NS = ${NS};
${siteTable()}

const float R = ${f(M.radius)};
const float E = ${f(C.excite)};
const float FRAG_FADE_AT = ${f(C.fragmentsFadeAt)};
const float FRAG_FADE = ${f(C.fragmentsFade)};
const float NEXT_AT = ${f(C.nextAt)};
const float NEXT_FADE = ${f(C.nextFade)};
const float VL = ${f(M.fragmentSpeed)};
const float LOST_SPEED = ${f(M.lostSpeed)};
const vec2 LOST_FADE = vec2( ${f(M.lostFade[0])}, ${f(M.lostFade[1])} );
const float LOBE = ${f(L.lobeSeparation)};
const float DRAG = ${f(L.drag)};
const float WOB_AMP = ${f(L.wobble.amplitude)};
const float WOB_FREQ = ${f(L.wobble.frequency)};
const vec2 IN_T = vec2( ${f(C.incoming[0])}, ${f(C.incoming[1])} );
const vec2 IN_START = vec2( ${f(C.incomingStart[0])}, ${f(C.incomingStart[1])} );
const vec3 VIEW0 = vec3( ${f(vx0)}, ${f(vy0)}, ${f(vs0)} );
const vec3 VIEW1 = vec3( ${f(vx1)}, ${f(vy1)}, ${f(vs1)} );
const vec2 WIDEN = vec2( ${f(FIELD_VIEW.widen[0])}, ${f(FIELD_VIEW.widen[1])} );

float ease01( float x ) { x = clamp( x, 0.0, 1.0 ); return x * x * x * ( x * ( x * 6.0 - 15.0 ) + 10.0 ); }

vec2 irisCenter() {
	vec4 c = projectionMatrix * viewMatrix * vec4( uAnchor, 1.0 );
	return c.xy / c.w;
}

/** The view: generation 0 large, widening into the whole field (fieldConfig.ts fieldView). */
vec3 fieldView() {
	return mix( VIEW0, VIEW1, ease01( ( uTau - WIDEN.x ) / ( WIDEN.y - WIDEN.x ) ) );
}

/**
 * Field units -> view space: the view's centre and scale, then the iris zoom about the fuel spot (the
 * micro world grows out of the fuel and shrinks back into it, as Stage 10).
 */
vec3 microToView( vec3 m ) {
	float s = uDepth / projectionMatrix[ 1 ][ 1 ];
	vec2 c = irisCenter();
	vec2 spot = vec2( c.x * projectionMatrix[ 1 ][ 1 ] / projectionMatrix[ 0 ][ 0 ], c.y );
	vec3 v = fieldView();
	vec2 q = ( m.xy - v.xy ) * v.z;
	q = spot + ( q - spot ) * uZoom;
	return vec3( q * s, -uDepth + m.z * v.z * uZoom * s );
}

float travel( float v, float dt ) { return v * ( 1.0 - exp( -DRAG * dt ) ) / DRAG; }

/** A site's position in its cycle c (three spots in turn; before its first cycle, the first). */
vec2 sitePos( int i, int c ) {
	int k = max( c, 0 ) % 3;
	vec4 p = SITE_P[ i ];
	return k == 0 ? p.xy : ( k == 1 ? p.zw : SITE_Q[ i ] );
}

/** The cycle (floor) and the time into it, for site i at chain time tau (siteCycle: now). */
int siteCycleAt( int i, float tau, out float u ) {
	vec4 t = SITE_T[ i ];
	float rel = tau - t.x;
	int c = int( floor( rel / t.y ) );
	u = rel - float( c ) * t.y;
	return c;
}

int siteCycle( int i, out float u ) { return siteCycleAt( i, uTau, u ); }

/** The split point of site i in cycle c (between the two lobes; close enough to the centre at this scale). */
vec2 splitPoint( int i, int c ) {
	vec4 d = SITE_D[ i ];
	return sitePos( i, c ) + d.xy * ( R * d.z );
}

/**
 * Neutron k of site i: xy, z = 1 when it carries the chain on (it will be absorbed by the next site and
 * split it), w visibility. Absorbed-without-fission neutrons slow down and fade.
 */
vec4 neutronAt( int i, int k, float tau ) {
	if ( k == 3 ) {
		// Generation 0: crosses the view and is absorbed by A (site 0) at its first cycle.
		if ( i != 0 || tau < IN_T.x || tau > IN_T.y ) return vec4( 0.0 );
		vec2 a = sitePos( 0, 0 );
		vec2 dir = normalize( a - IN_START );
		return vec4( mix( IN_START, a - dir * R * 0.55, ( tau - IN_T.x ) / ( IN_T.y - IN_T.x ) ), 0.0, ease01( ( tau - IN_T.x ) / 0.12 ) );
	}
	float u;
	int c = siteCycleAt( i, tau, u );
	float dt = u - E;
	if ( c < 0 || dt < 0.0 ) return vec4( 0.0 );
	vec2 S = splitPoint( i, c );
	vec4 nn = SITE_N[ i ];
	bool seeding = k == 1 && c == 0 && nn.x >= 0.0;
	if ( k == 0 || seeding ) {
		int s = seeding ? int( nn.x ) : int( SITE_T[ i ].w );
		float F = seeding ? nn.y : SITE_T[ i ].z;
		if ( dt > F ) return vec4( 0.0 );
		// The target's cycle whose absorption this neutron makes.
		float arrive = SITE_T[ i ].x + float( c ) * SITE_T[ i ].y + E + F;
		int cs = int( floor( ( arrive - SITE_T[ s ].x ) / SITE_T[ s ].y + 0.5 ) );
		vec2 T = sitePos( s, cs );
		vec2 dir = normalize( T - S );
		vec2 end = T - dir * R * 0.55;
		float x = dt / F;
		return vec4( mix( S, end, 1.0 - pow( 1.0 - x, 1.6 ) ), 1.0, ease01( dt / 0.1 ) );
	}
	// Absorbed without a fission: slows down and fades.
	float ang = ( k == 1 ? nn.z : nn.w ) + ( c == 0 ? 0.0 : float( c & 1 ) * 0.7 );
	vec2 dir = vec2( cos( ang ), sin( ang ) );
	float r = LOST_SPEED * ( 1.0 - exp( -1.2 * dt ) ) / 1.2;
	return vec4( S + dir * r, 0.0, ease01( dt / 0.1 ) * ( 1.0 - smoothstep( LOST_FADE.x * 0.85, LOST_FADE.y * 0.85, dt ) ) );
}

vec4 neutron( int i, int k ) { return neutronAt( i, k, uTau ); }
`;

/** Fragment side iris mask (Stage 10). */
const IRIS = /* glsl */ `
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

// ---- Instances -------------------------------------------------------------------------------------------

/** Neutrons per site: 0 to the next site, 1 seed or absorbed, 2 absorbed; 3 the generation-0 neutron (A only). */
const NEUTRONS = 4;

export function particleInstances() {
  const count = NS * (L.nucleons + NEUTRONS);
  const home = new Float32Array(count * 3);
  const cent = new Float32Array(count * 3);
  const rest = new Float32Array(count * 3);
  const meta = new Float32Array(count * 4);
  let k = 0;
  FIELD_SITES.forEach((s, i) => {
    const c = Math.cos(s.angle);
    const sn = Math.sin(s.angle);
    const n = s.template;
    n.home.forEach((h, j) => {
      home.set(rot(h, c, sn), k * 3);
      cent.set(rot(n.side[j]! > 0 ? n.centLight : n.centHeavy, c, sn), k * 3);
      rest.set(rot(n.rest[j]!, c, sn), k * 3);
      meta.set([i, n.side[j]!, n.tone[j]!, 0], k * 4);
      k++;
    });
    for (let id = 0; id < NEUTRONS; id++) {
      meta.set([i, id, 0, 1], k * 4);
      k++;
    }
  });
  return {
    count,
    attributes: {
      aHome: new InstancedBufferAttribute(home, 3),
      aCent: new InstancedBufferAttribute(cent, 3),
      aRest: new InstancedBufferAttribute(rest, 3),
      aMeta: new InstancedBufferAttribute(meta, 4),
    },
  };
}

/** Sprites: per splitting site the two heat trails and the energy swell; then the warmth and the warm spot. */
export function spriteInstances() {
  const kinds: number[] = [];
  const site: number[] = [];
  FIELD_SITES.forEach((s, i) => {
    if (s.phase >= NEVER) return;
    for (const kind of [0, 1, 2, 5]) {
      kinds.push(kind);
      site.push(i);
    }
  });
  kinds.push(3, 4);
  site.push(0, 0);
  return { count: kinds.length, attributes: { aKind: new InstancedBufferAttribute(new Float32Array(kinds), 1), aSite: new InstancedBufferAttribute(new Float32Array(site), 1) } };
}

// ---- Programs ----------------------------------------------------------------------------------------------

type Mat<U> = ShaderMaterial & { uniforms: InsetUniforms & U };

function material<U extends Record<string, IUniform>>(name: string, shared: InsetUniforms, own: U, vertexShader: string, fragmentShader: string, depthWrite: boolean): Mat<U> {
  return new ShaderMaterial({ name, uniforms: { ...shared, ...own }, vertexShader, fragmentShader, transparent: true, depthTest: true, depthWrite, blending: NormalBlending }) as Mat<U>;
}

export function createFieldParticles(shared: InsetUniforms) {
  const own = {
    uAlpha: { value: 0 },
    uProton: { value: new Color(K.proton) },
    uNeutron: { value: new Color(K.neutron) },
    uFree: { value: new Color(K.freeNeutron) },
    /** The chain-carrying neutron's tint (the talk's amber, the one current concept). */
    uChain: { value: new Color(CHAIN_TINT) },
  };
  const vertex = /* glsl */ `
${MOTION}
uniform float uAlpha;
uniform vec3 uProton;
uniform vec3 uNeutron;
uniform vec3 uFree;
uniform vec3 uChain;
attribute vec3 aHome;
attribute vec3 aCent;
attribute vec3 aRest;
attribute vec4 aMeta; // site, side (+1 light / -1 heavy) or neutron id, tone, role (0 nucleon, 1 neutron)
varying vec3 vNormal;
varying vec3 vColor;
varying float vAlpha;
varying vec2 vIris;

/** A nucleon of site i: intact, excited (wobble, dumbbell), split (fragments fly, relax, fade), or the next nucleus. */
vec3 nucleon( int i, out float vis ) {
	float u;
	int c = siteCycle( i, u );
	vis = 1.0;
	if ( c < 0 ) return vec3( sitePos( i, 0 ), 0.0 ) + R * aHome;
	float dt = u - E;
	if ( dt >= NEXT_AT ) {
		vis = ease01( ( dt - NEXT_AT ) / NEXT_FADE );
		return vec3( sitePos( i, c + 1 ), 0.0 ) + R * aHome;
	}
	vec4 d = SITE_D[ i ];
	vec3 D = vec3( d.xy, 0.0 );
	float ex = ease01( u / E );
	float wob = WOB_AMP * sin( 6.2831853 * WOB_FREQ * u ) * ( 1.0 - ex ) * ease01( u / 0.15 );
	float a = dot( aHome, D );
	vec3 q = aHome - a * D;
	float neck = exp( -pow( ( a - d.z ) / 0.3, 2.0 ) );
	vec3 p = aHome + D * ( a * wob ) - q * ( 0.4 * ex * neck );
	float t = max( dt, 0.0 );
	vec3 local = mix( p, aCent + aRest, ease01( t / 0.5 ) );
	float side = aMeta.y;
	vis = 1.0 - ease01( ( t - FRAG_FADE_AT ) / FRAG_FADE );
	return vec3( sitePos( i, c ), 0.0 ) + R * local + D * side * ( LOBE * ex + travel( side > 0.0 ? VL : VL * d.w, t ) );
}

void main() {
	int i = int( aMeta.x + 0.5 );
	vec3 m;
	float vis;
	float neutronSize = 1.0;
	vec3 col = mix( uNeutron, uProton, aMeta.z );
	if ( aMeta.w < 0.5 ) {
		m = nucleon( i, vis );
	} else {
		int k = int( aMeta.y + 0.5 );
		vec4 n = neutron( i, k );
		m = vec3( n.xy, 0.0 );
		vis = n.w;
		// The neutron that carries the chain on reads a touch larger and warmer; the generation-0 one too.
		bool carries = n.z > 0.5 || k == 3;
		col = carries ? mix( uFree, uChain, 0.45 ) : uFree;
		vis *= carries ? 1.0 : 0.62;
		neutronSize = carries ? 1.22 : 0.85;
	}
	// Nuclei appear and dissolve by size (a half-transparent cluster would read as a dark silhouette);
	// free neutrons fade.
	float size = aMeta.w < 0.5 ? vis : neutronSize;
	vAlpha = ( aMeta.w < 0.5 ? min( vis * 4.0, 1.0 ) : vis ) * uAlpha;
	if ( vAlpha < 0.002 || size < 0.01 ) {
		gl_Position = vec4( 2.0, 2.0, 2.0, 1.0 );
		return;
	}
	gl_Position = projectionMatrix * vec4( microToView( m + position * ( R * ${f(K.nucleonScale)} * size ) ), 1.0 );
	vNormal = normal;
	vColor = col;
	vIris = irisCenter();
}
`;
  const fragment = /* glsl */ `
${IRIS}
varying vec3 vNormal;
varying vec3 vColor;
varying float vAlpha;
varying vec2 vIris;
void main() {
	float a = vAlpha * irisMask( vIris );
	if ( a < 0.003 ) discard;
	vec3 n = normalize( vNormal );
	// Matte (Stage 10): one soft key from the upper left, a low fill, a faint edge.
	float key = max( dot( n, normalize( vec3( -0.45, 0.65, 0.62 ) ) ), 0.0 );
	float edge = pow( 1.0 - max( n.z, 0.0 ), 2.5 );
	vec3 c = vColor * ( 0.34 + 0.74 * key ) + vec3( 0.045 ) * edge;
	gl_FragColor = vec4( c, a );
	${OUTPUT}
}
`;
  return material('talk-fission-field-particles', shared, own, vertex, fragment, true);
}

export function createFieldSprites(shared: InsetUniforms) {
  const own = {
    uAlpha: { value: 0 },
    uEnergy: { value: new Color(K.energy) },
    uHeat: { value: new Color(K.heat) },
    uChainTrail: { value: new Color(CHAIN_TINT) },
    uSpot: { value: 0 },
  };
  const vertex = /* glsl */ `
${MOTION}
uniform float uAlpha;
uniform vec3 uEnergy;
uniform vec3 uHeat;
uniform vec3 uChainTrail;
uniform float uSpot;
attribute float aKind; // 0 heat (light fragment), 1 heat (heavy fragment), 2 energy swell, 3 the gathering warmth, 4 warm spot, 5 chain neutron's trail
attribute float aSite;
varying vec2 vLocal;
varying vec3 vShape; // half length, half width, feather
varying vec4 vColor;
varying vec2 vIris;
void main() {
	vec3 p0 = vec3( 0.0 );
	vec3 p1 = vec3( 0.0 );
	float w = 0.0;
	float feather = 0.1;
	float alpha = 0.0;
	vec3 col = uHeat;
	float view = 1.0;
	if ( aKind > 4.5 ) {
		// The chain-carrying neutron's short trail: where it was a quarter second ago -> where it is.
		int i = int( aSite + 0.5 );
		vec4 now = neutron( i, 0 );
		if ( now.w > 0.0 && now.z > 0.5 ) {
			vec4 before = neutronAt( i, 0, uTau - 0.22 );
			if ( before.w <= 0.0 ) before = now;
			p0 = vec3( before.xy, -0.05 );
			p1 = vec3( now.xy, -0.05 );
			w = 0.018;
			feather = 0.05;
			alpha = 0.42 * now.w;
			col = uChainTrail;
		}
	} else if ( aKind < 2.5 ) {
		int i = int( aSite + 0.5 );
		float u;
		int c = siteCycle( i, u );
		float dt = u - E;
		if ( c >= 0 && dt >= 0.0 ) {
			vec4 d = SITE_D[ i ];
			vec2 S = splitPoint( i, c );
			p0 = vec3( S, -0.1 );
			p1 = p0;
			if ( aKind < 1.5 ) {
				// Heat left in the fuel along a fragment's path as it slows: widening, warm, soft, lingering.
				float side = aKind < 0.5 ? 1.0 : -1.0;
				vec4 cf = SITE_F[ i ];
				vec2 cent = side > 0.0 ? cf.xy : cf.zw;
				float ex = 1.0;
				vec2 frag = sitePos( i, c ) + R * cent + d.xy * side * ( LOBE * ex + travel( side > 0.0 ? VL : VL * d.w, dt ) );
				p1 = vec3( frag, -0.1 );
				float h = ease01( ( dt - 0.1 ) / 1.5 );
				w = 0.05 + 0.15 * h;
				feather = 0.1 + 0.14 * h;
				alpha = 0.27 * ease01( ( dt - 0.08 ) / 0.4 ) * ( 1.0 - ease01( ( dt - 3.0 ) / 2.6 ) );
			} else {
				float x = clamp( dt / 0.55, 0.0, 1.0 );
				w = 0.08 + 0.22 * ( 1.0 - pow( 1.0 - x, 2.0 ) );
				feather = 0.18;
				alpha = 0.18 * pow( 1.0 - x, 1.4 );
				col = uEnergy;
			}
		}
	} else if ( aKind < 3.5 ) {
		// The fuel warming as the fissions go on: a broad, quiet warmth, bounded (it plateaus).
		p0 = vec3( VIEW1.xy, -0.2 );
		p1 = p0;
		w = 2.4;
		feather = 2.2;
		alpha = 0.11 * ease01( ( uTau - 3.0 ) / 8.0 );
	} else {
		// Back at the macro scale: a soft warm spot on the fuel where the view closed (Stage 10).
		vec2 c = irisCenter();
		vec3 v = fieldView();
		// Expressed in field units so microToView puts it on the spot at any zoom.
		vec2 spot = vec2( c.x * projectionMatrix[ 1 ][ 1 ] / projectionMatrix[ 0 ][ 0 ], c.y );
		p0 = vec3( spot / v.z + v.xy, 0.0 );
		p1 = p0;
		float z = max( uZoom, 0.02 );
		w = 0.035 / ( z * v.z );
		feather = 0.07 / ( z * v.z );
		alpha = 0.34 * uSpot;
		view = 0.0;
	}
	vec2 seg = p1.xy - p0.xy;
	float len = length( seg );
	vec2 u = len > 1.0e-5 ? seg / len : vec2( 1.0, 0.0 );
	vec2 nrm = vec2( -u.y, u.x );
	vec2 local = position.xy * vec2( len * 0.5 + w + feather, w + feather );
	vec3 m = vec3( 0.5 * ( p0.xy + p1.xy ) + u * local.x + nrm * local.y, p0.z );
	gl_Position = projectionMatrix * vec4( microToView( m ), 1.0 );
	vLocal = local;
	vShape = vec3( len * 0.5, w, feather );
	vColor = vec4( col, alpha * mix( 1.0, uAlpha, view ) );
	vIris = irisCenter();
}
`;
  const fragment = /* glsl */ `
${IRIS}
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
  return material('talk-fission-field-sprites', shared, own, vertex, fragment, false);
}
