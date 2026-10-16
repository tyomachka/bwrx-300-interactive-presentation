/**
 * Presentation v1, "the power block fits within two football pitches" (talk only): two pitches at
 * true scale (FIFA standard 105 x 68 m) drawn on the ground beside our plant's power block, wiping
 * on once with `q.pitches`. presentation/sources.ts footprint: the vendor claim, with GD Rev J's
 * 9,800 m2 building envelope (about 1.4 pitches) behind it.
 *
 * A muted turf tint and white lines (thicker than real ones so they read at this distance).
 */
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { CanvasTexture, LinearMipmapLinearFilter, PlaneGeometry, ShaderMaterial, SRGBColorSpace, UniformsLib, UniformsUtils, type Group } from 'three';
import { world } from '../world';

const PITCH = { length: 105, width: 68 } as const;
/** Right beside the reactor building (west), clear of the excavation; long side along x. */
const CENTER = { x: -104, z: 2 } as const;

function pitchTexture(): CanvasTexture {
  const w = 1050;
  const h = 680;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  const m = 10; // pixels per metre
  ctx.fillStyle = '#25302a';
  ctx.fillRect(0, 0, w, h);
  // Mowing stripes, very quiet.
  for (let i = 0; i < 12; i++) {
    if (i % 2) continue;
    ctx.fillStyle = 'rgba(255,255,255,0.025)';
    ctx.fillRect((i * w) / 12, 0, w / 12, h);
  }
  ctx.strokeStyle = '#eef1f3';
  ctx.lineWidth = 14;
  ctx.strokeRect(7, 7, w - 14, h - 14);
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(w / 2, 0);
  ctx.lineTo(w / 2, h);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, 9.15 * m, 0, Math.PI * 2);
  ctx.stroke();
  // Penalty and goal areas, both ends.
  for (const side of [0, 1]) {
    const x0 = side ? w - 16.5 * m : 0;
    ctx.strokeRect(x0 + (side ? 0 : 0), h / 2 - 20.16 * m, 16.5 * m, 40.32 * m);
    const g0 = side ? w - 5.5 * m : 0;
    ctx.strokeRect(g0, h / 2 - 9.16 * m, 5.5 * m, 18.32 * m);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.anisotropy = 4;
  return texture;
}

export function Pitches() {
  const assets = useMemo(() => {
    const texture = pitchTexture();
    const geometry = new PlaneGeometry(PITCH.length, PITCH.width).rotateX(-Math.PI / 2);
    const material = new ShaderMaterial({
      name: 'talk-pitches',
      uniforms: UniformsUtils.merge([UniformsLib.fog, { uMap: { value: null }, uReveal: { value: 0 }, uIndex: { value: 0 } }]),
      vertexShader: /* glsl */ `
varying vec2 vUv;
#include <fog_pars_vertex>
void main() {
	vUv = uv;
	vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
	gl_Position = projectionMatrix * mvPosition;
	#include <fog_vertex>
}`,
      fragmentShader: /* glsl */ `
uniform sampler2D uMap;
uniform float uReveal;
varying vec2 vUv;
#include <fog_pars_fragment>
void main() {
	// Wipes on from the plant's side (+x) outwards.
	float edge = 1.0 - vUv.x;
	float a = smoothstep( edge - 0.06, edge, uReveal * 1.12 );
	if ( a < 0.004 ) discard;
	vec4 t = texture2D( uMap, vUv );
	gl_FragColor = vec4( t.rgb, a * 0.96 );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,
      transparent: true,
      depthWrite: false,
      fog: true,
    });
    material.uniforms.uMap!.value = texture;
    return { texture, geometry, material };
  }, []);
  const group = useRef<Group>(null);

  useEffect(
    () => () => {
      assets.texture.dispose();
      assets.geometry.dispose();
      assets.material.dispose();
    },
    [assets],
  );

  useFrame(() => {
    const v = world['q.pitches'];
    if (group.current) group.current.visible = v > 0.001;
    assets.material.uniforms.uReveal!.value = v;
  }, -80);

  return (
    <group ref={group} name="talk-pitches" visible={false}>
      <mesh geometry={assets.geometry} material={assets.material} position={[CENTER.x, 0.08, CENTER.z - PITCH.width / 2 - 1]} renderOrder={-1} />
      <mesh geometry={assets.geometry} material={assets.material} position={[CENTER.x, 0.08, CENTER.z + PITCH.width / 2 + 1]} renderOrder={-1} />
    </group>
  );
}
