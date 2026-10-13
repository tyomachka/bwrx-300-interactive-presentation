/**
 * Stage 9: the vessel's residual (decay) heat cue. A faint warm tint on a thin sleeve around the
 * RPV shell, strongest at the core and fading up the vessel, stronger towards the silhouette (a
 * soft thermal edge rather than paint). It respects the vessel cut. Normal blending, no depth
 * write, tone mapped: no glow, no bloom, nothing additive.
 */
import { Color, CylinderGeometry, NormalBlending, ShaderMaterial, Vector4, type IUniform } from 'three';
import { SAFETY_LOOK } from '../../config/safety';
import { REACTOR_PRESSURE_VESSEL as RPV } from '../plant/dimensions';
import { CORE, VESSEL } from '../rpv/rpvData';

const VERTEX = /* glsl */ `
varying vec3 vWorld;
varying vec3 vNormal;

void main() {
	vec4 world = modelMatrix * vec4( position, 1.0 );
	vWorld = world.xyz;
	vNormal = normalize( mat3( modelMatrix ) * normal );
	gl_Position = projectionMatrix * viewMatrix * world;
}
`;

const FRAGMENT = /* glsl */ `
uniform vec3 uColor;
uniform float uLevel;
uniform float uFace;
uniform vec4 uCut;  // removed box: z > x and x < y and y > z (world), w = 1 while cut
uniform vec4 uBand; // fade-in bottom, core top, fade end, level at the top
varying vec3 vWorld;
varying vec3 vNormal;

void main() {
	if ( uCut.w > 0.5 && vWorld.z > uCut.x && vWorld.x < uCut.y && vWorld.y > uCut.z ) discard;
	float facing = abs( dot( normalize( vNormal ), normalize( cameraPosition - vWorld ) ) );
	float edge = pow( 1.0 - facing, 1.5 );
	float height = smoothstep( uBand.x - 1.5, uBand.x, vWorld.y ) * mix( 1.0, uBand.w, smoothstep( uBand.y, uBand.z, vWorld.y ) );
	float a = uLevel * height * ( uFace + ( 1.0 - uFace ) * edge );
	if ( a < 0.003 ) discard;
	gl_FragColor = vec4( uColor, a );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}
`;

export interface DecayHeatUniforms {
  uColor: IUniform<Color>;
  uLevel: IUniform<number>;
  uFace: IUniform<number>;
  uCut: IUniform<Vector4>;
  uBand: IUniform<Vector4>;
  [name: string]: IUniform;
}

/** From the bottom head joint to just under the vessel flange (h above the inside bottom). */
const BOTTOM_H = RPV.innerRadius;
const TOP_H = VESSEL.flangeJointH - VESSEL.flange.vesselDepth - 0.05;

export function buildDecayHeat() {
  const L = SAFETY_LOOK.decayHeat;
  const height = TOP_H - BOTTOM_H;
  const geometry = new CylinderGeometry(RPV.outerRadius + 0.035, RPV.outerRadius + 0.035, height, 64, 1, true);
  geometry.translate(0, RPV.insideBottomY + BOTTOM_H + height / 2, 0);
  const y = (h: number) => RPV.insideBottomY + h;
  const uniforms: DecayHeatUniforms = {
    uColor: { value: new Color(L.color) },
    uLevel: { value: 0 },
    uFace: { value: L.face },
    uCut: { value: new Vector4(0, 0, 0, 0) },
    uBand: { value: new Vector4(y(CORE.bottomOfActiveFuelH), y(CORE.bottomOfActiveFuelH + CORE.activeHeight), y(TOP_H), L.top) },
  };
  const material = new ShaderMaterial({
    name: 'decay-heat',
    uniforms,
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    transparent: true,
    depthWrite: false,
    blending: NormalBlending,
  });
  return { geometry, material: material as ShaderMaterial & { uniforms: DecayHeatUniforms } };
}
