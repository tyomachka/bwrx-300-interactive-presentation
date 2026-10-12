/**
 * Shader additions for the reveal, injected into MeshStandardMaterial with onBeforeCompile.
 *
 * Three variants, selected by material defines (so each is its own cached program):
 *  - none          `outgoingLight *= uSectionSurface` only: the dim used for site context.
 *  - SECTION_LAYER + below-grade fill light and a fresnel rim, for revealed structures.
 *  - SECTION_CAP   + cut surfaces for closed solids clipped by the layer's section box.
 *
 * Cut surfaces (caps) in one pass, no stencil: a closed solid cut by the clipping box shows
 * its back faces through the cut. Those back-face fragments are shaded as the section
 * surface at the point where the view ray leaves the clipped box, i.e. on the cut plane
 * itself. Depth stays the back face's; that is correct as long as solids do not share faces,
 * which is why section geometry is inset by a few millimetres (scene/section/sectionGeometry).
 * Section materials are double-sided for this. Thin shells (roof, dome) opt out of caps.
 */
import { Color, Vector4, type IUniform, type MeshStandardMaterial, type WebGLProgramParametersWithUniforms } from 'three';

/** Uniforms shared by every material of one reveal layer (one object each, updated per frame). */
export interface LayerUniforms {
  /** Multiplier on lit surfaces: < 1 recedes, > 1 is a restrained emphasis. */
  uSectionSurface: IUniform<number>;
  /** Multiplier on cut surfaces. */
  uSectionCapMul: IUniform<number>;
  /** Strength of the below-grade fill light. */
  uSectionFill: IUniform<number>;
  /** Fresnel rim colour x strength (linear). */
  uSectionRim: IUniform<Color>;
  /** Soft backlight pool colour x strength (linear): a line light behind the subject. */
  uSectionGlow: IUniform<Color>;
  /** Added to this layer's cut surfaces (linear): marks a subject's sections with the accent. */
  uSectionCapTint: IUniform<Color>;
}

export function createLayerUniforms(): LayerUniforms {
  return {
    uSectionSurface: { value: 1 },
    uSectionCapMul: { value: 1 },
    uSectionFill: { value: 0 },
    uSectionRim: { value: new Color(0, 0, 0) },
    uSectionGlow: { value: new Color(0, 0, 0) },
    uSectionCapTint: { value: new Color(0, 0, 0) },
  };
}

/** How a material's cut surface looks. */
export interface CapStyle {
  /** sRGB colour of the cut. */
  color: string;
  /** Soft horizontal strata (earth). */
  strata?: number;
  /** Draw the accent grade datum where the cut crosses y = 0. */
  datum?: boolean;
  /** Darken with depth below grade (0..1), so the earth sinks into the background. */
  depthFade?: number;
  /** Darken with plan distance from the reactor axis (0..1): a pool of light on the subject. */
  radialFade?: number;
}

const VERTEX_PARS = /* glsl */ `
#ifdef SECTION_LAYER
varying vec3 vSectionWorld;
#endif
`;

const VERTEX_MAIN = /* glsl */ `
#ifdef SECTION_LAYER
	vec4 sectionWorld = vec4( transformed, 1.0 );
	#ifdef USE_INSTANCING
		sectionWorld = instanceMatrix * sectionWorld;
	#endif
	vSectionWorld = ( modelMatrix * sectionWorld ).xyz;
#endif
`;

const FRAGMENT_PARS = /* glsl */ `
uniform float uSectionSurface;
#ifdef SECTION_LAYER
varying vec3 vSectionWorld;
uniform float uSectionFill;
uniform vec3 uSectionRim;
uniform vec3 uSectionFillDir;
uniform vec3 uSectionFillColor;
uniform vec3 uSectionGlow;
uniform vec3 uSectionGlowA;
uniform vec3 uSectionGlowB;
uniform float uSectionGlowRadius;
#endif
#ifdef SECTION_CAP
uniform float uSectionCapMul;
uniform vec3 uSectionCapTint;
uniform vec3 uSectionCapColor;
uniform vec4 uSectionCapStyle; // x strata, y datum, z depth fade, w radial fade
uniform vec3 uSectionKeyDir;
uniform vec3 uSectionCapLight; // x ambient, y key, z detail (0 = low preset)
uniform vec3 uSectionDatumColor;
uniform float uSectionDatum;

vec3 sectionCapShade( vec3 p, vec3 n ) {
	vec3 base = uSectionCapColor;
	float depth = max( - p.y, 0.0 );
	// Soft strata: each ~4 m layer has its own slight tone, blended into the next.
	float layerPos = depth / 4.2;
	float layer = floor( layerPos );
	float toneA = fract( sin( layer * 91.3458 + 17.17 ) * 4745.5453 );
	float toneB = fract( sin( ( layer + 1.0 ) * 91.3458 + 17.17 ) * 4745.5453 );
	float tone = mix( toneA, toneB, smoothstep( 0.7, 1.0, fract( layerPos ) ) );
	base *= 1.0 + uSectionCapStyle.x * uSectionCapLight.z * ( tone - 0.5 ) * 0.14;
	vec3 color = base * ( uSectionCapLight.x + uSectionCapLight.y * max( dot( n, uSectionKeyDir ), 0.0 ) );
	color += base * uSectionFillColor * ( uSectionFill * max( dot( n, uSectionFillDir ), 0.0 ) );
	color *= 1.0 - uSectionCapStyle.z * smoothstep( 6.0, 44.0, depth );
	color *= 1.0 - uSectionCapStyle.w * smoothstep( 24.0, 64.0, length( p.xz ) );
	return color * uSectionCapMul + uSectionCapTint;
}
#endif
`;

/** Runs right after three's clipping discard: back faces seen through a cut become the cut. */
const FRAGMENT_CAP = /* glsl */ `
#if defined( SECTION_CAP ) && NUM_CLIPPING_PLANES > 0
	// View space: the camera is the origin and the ray is t * p (t = 1 at this fragment).
	// A plane removes the points where t * dot( n, p ) + w < 0; the box is their intersection.
	vec3 sectionRay = - vClipPosition;
	float sectionEnter = 0.0;
	float sectionExit = 1.0e9;
	vec3 sectionCapNormal = vec3( 0.0, 0.0, 1.0 );
	for ( int i = 0; i < NUM_CLIPPING_PLANES; i ++ ) {
		vec4 sectionPlane = clippingPlanes[ i ];
		float a = dot( sectionPlane.xyz, sectionRay );
		float t = - sectionPlane.w / a;
		if ( a > 1.0e-7 ) {
			if ( t < sectionExit ) { sectionExit = t; sectionCapNormal = - sectionPlane.xyz; }
		} else if ( a < - 1.0e-7 ) {
			sectionEnter = max( sectionEnter, t );
		} else if ( sectionPlane.w >= 0.0 ) {
			sectionExit = - 1.0; // parallel and on the kept side: the ray never enters the box
		}
	}
	bool sectionThroughCut = sectionEnter < sectionExit && sectionExit > 0.0 && sectionExit < 1.0;
	vec3 sectionCapWorld = cameraPosition + ( vSectionWorld - cameraPosition ) * ( sectionThroughCut ? sectionExit : 1.0 );
	float sectionPx = max( fwidth( sectionCapWorld.y ), 1.0e-6 );
	if ( ! gl_FrontFacing ) {
		vec3 sectionN = inverseTransformDirection( sectionCapNormal, viewMatrix );
		vec3 sectionColor = sectionCapShade( sectionCapWorld, sectionN );
		// Grade datum: a ~2 px accent line just under y = 0, constant width on screen. Only on
		// section planes (facing along z), so the excavation's side walls do not outline the pit.
		float sectionDatum = uSectionCapStyle.y * uSectionDatum * abs( sectionN.z ) * ( 1.0 - smoothstep( 1.0, 1.7, abs( sectionCapWorld.y + sectionPx ) / sectionPx ) );
		sectionColor = mix( sectionColor, uSectionDatumColor, sectionDatum );
		gl_FragColor = vec4( sectionColor, diffuseColor.a );
		#include <tonemapping_fragment>
		#include <colorspace_fragment>
		#include <fog_fragment>
		return;
	}
#endif
`;

const FRAGMENT_SURFACE = /* glsl */ `
#ifdef SECTION_LAYER
	{
		vec3 sectionNormalWorld = inverseTransformDirection( normal, viewMatrix );
		float sectionBelowGrade = 1.0 - smoothstep( - 1.0, 1.5, vSectionWorld.y );
		outgoingLight += diffuseColor.rgb * uSectionFillColor * ( uSectionFill * sectionBelowGrade * max( dot( sectionNormalWorld, uSectionFillDir ), 0.0 ) );
		outgoingLight += uSectionRim * pow( 1.0 - saturate( dot( normal, geometryViewDir ) ), 3.0 );
		// Backlight pool: a soft line light (segment A-B) behind the subject, lighting what is behind it.
		vec3 sectionGlowAxis = uSectionGlowB - uSectionGlowA;
		float sectionGlowT = saturate( dot( vSectionWorld - uSectionGlowA, sectionGlowAxis ) / dot( sectionGlowAxis, sectionGlowAxis ) );
		vec3 sectionToGlow = uSectionGlowA + sectionGlowAxis * sectionGlowT - vSectionWorld;
		float sectionGlowFall = 1.0 / ( 1.0 + dot( sectionToGlow, sectionToGlow ) / ( uSectionGlowRadius * uSectionGlowRadius ) );
		outgoingLight += diffuseColor.rgb * uSectionGlow * ( sectionGlowFall * max( dot( sectionNormalWorld, normalize( sectionToGlow ) ), 0.0 ) );
	}
#endif
	outgoingLight *= uSectionSurface;
`;

function inject(source: string, anchor: string, code: string, position: 'before' | 'after'): string {
  if (!source.includes(anchor)) {
    // A three.js upgrade renamed a chunk: fail loudly in development, degrade quietly in production.
    if (import.meta.env.DEV) throw new Error(`[BWRX-300] section shader anchor not found: ${anchor}`);
    return source;
  }
  return source.replace(anchor, position === 'after' ? `${anchor}\n${code}` : `${code}\n${anchor}`);
}

export type SectionUniformMap = Record<string, IUniform>;

/**
 * Install the reveal additions on a MeshStandardMaterial. `uniforms` are shared objects
 * (layer + global + per-material cap), so updating one value updates every material using it.
 */
export function installSectionShader(material: MeshStandardMaterial, uniforms: SectionUniformMap): void {
  material.onBeforeCompile = (shader: WebGLProgramParametersWithUniforms) => {
    Object.assign(shader.uniforms, uniforms);
    let vs = inject(shader.vertexShader, '#include <common>', VERTEX_PARS, 'after');
    vs = inject(vs, '#include <project_vertex>', VERTEX_MAIN, 'after');
    let fs = inject(shader.fragmentShader, '#include <common>', FRAGMENT_PARS, 'after');
    fs = inject(fs, '#include <clipping_planes_fragment>', FRAGMENT_CAP, 'after');
    fs = inject(fs, '#include <opaque_fragment>', FRAGMENT_SURFACE, 'before');
    shader.vertexShader = vs;
    shader.fragmentShader = fs;
  };
  // The injected source is identical for every material; defines select the variant.
  material.customProgramCacheKey = () => 'bwrx-section-v1';
}

/** Per-material uniforms describing its cut surface. */
export function createCapUniforms(style: CapStyle): SectionUniformMap {
  return {
    uSectionCapColor: { value: new Color(style.color) },
    uSectionCapStyle: {
      value: new Vector4(style.strata ?? 0, style.datum ? 1 : 0, style.depthFade ?? 0, style.radialFade ?? 0),
    },
  };
}
