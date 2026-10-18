/**
 * Presentation v1, "how much ground the power block takes" (talk only), at the plant's own ground
 * scale (presentation/scene/footprintLayout.ts has the numbers and their sources):
 *  - q.block    a dashed outline of the ~148 x 78 m power block draws on around our plant;
 *  - q.stadium  an international-size 105 x 68 m pitch in a schematic stadium wipes on beside it.
 *
 * Restrained and schematic: a muted turf, white pitch lines (thicker than real so they read from
 * this height), the stands as a quiet band; the outline in the label colour. Fogged like the ground.
 */
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { BufferGeometry, CanvasTexture, Color, DoubleSide, Float32BufferAttribute, LinearMipmapLinearFilter, PlaneGeometry, ShaderMaterial, SRGBColorSpace, UniformsLib, UniformsUtils, type Group } from 'three';
import { world } from '../world';
import { FOOTPRINT as F } from './footprintLayout';

const FOG_VERTEX = /* glsl */ `
#include <fog_pars_vertex>
`;

/** Pixels per metre in the stadium texture. */
const PX = 8;

function stadiumTexture(): { texture: CanvasTexture; size: [number, number] } {
  const { length, width } = F.pitch;
  const margin = F.stadium.runoff + F.stadium.stands;
  const size: [number, number] = [length + 2 * margin, width + 2 * margin];
  const w = Math.round(size[0] * PX);
  const h = Math.round(size[1] * PX);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  const m = PX;
  // Stands: a quiet band with a rounded outer edge (schematic, no seats).
  const r = F.stadium.stands * m;
  ctx.fillStyle = '#2b2f34';
  ctx.beginPath();
  ctx.roundRect(0, 0, w, h, r);
  ctx.fill();
  ctx.strokeStyle = 'rgba(214, 220, 226, 0.35)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.roundRect(3, 3, w - 6, h - 6, r);
  ctx.stroke();
  // Run-off and the pitch.
  const sx = F.stadium.stands * m;
  ctx.fillStyle = '#26302a';
  ctx.fillRect(sx, sx, w - 2 * sx, h - 2 * sx);
  const px = margin * m;
  const pw = length * m;
  const ph = width * m;
  ctx.fillStyle = '#2b3a30';
  ctx.fillRect(px, px, pw, ph);
  for (let i = 0; i < 12; i += 2) {
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    ctx.fillRect(px + (i * pw) / 12, px, pw / 12, ph);
  }
  ctx.strokeStyle = '#eef1f3';
  ctx.lineWidth = 10;
  ctx.strokeRect(px, px, pw, ph);
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(px + pw / 2, px);
  ctx.lineTo(px + pw / 2, px + ph);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(px + pw / 2, px + ph / 2, 9.15 * m, 0, Math.PI * 2);
  ctx.stroke();
  for (const side of [0, 1]) {
    const x0 = side ? px + pw - 16.5 * m : px;
    ctx.strokeRect(x0, px + ph / 2 - 20.16 * m, 16.5 * m, 40.32 * m);
    const g0 = side ? px + pw - 5.5 * m : px;
    ctx.strokeRect(g0, px + ph / 2 - 9.16 * m, 5.5 * m, 18.32 * m);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.anisotropy = 4;
  return { texture, size };
}

/** A closed outline of thin quads on the ground, with each vertex's distance along it (m). */
function outlineGeometry(x: readonly [number, number], z: readonly [number, number], width: number): { geometry: BufferGeometry; perimeter: number } {
  const corners: [number, number][] = [
    [x[0], z[1]],
    [x[1], z[1]],
    [x[1], z[0]],
    [x[0], z[0]],
  ];
  const positions: number[] = [];
  const along: number[] = [];
  const index: number[] = [];
  let s = 0;
  const hw = width / 2;
  corners.forEach((a, i) => {
    const b = corners[(i + 1) % 4]!;
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const dx = (b[0] - a[0]) / len;
    const dz = (b[1] - a[1]) / len;
    // Extend each side by half the width so the corners close; normal in the ground plane.
    const ax = a[0] - dx * hw;
    const az = a[1] - dz * hw;
    const bx = b[0] + dx * hw;
    const bz = b[1] + dz * hw;
    const nx = -dz * hw;
    const nz = dx * hw;
    const base = positions.length / 3;
    positions.push(ax + nx, 0, az + nz, ax - nx, 0, az - nz, bx + nx, 0, bz + nz, bx - nx, 0, bz - nz);
    along.push(s - hw, s - hw, s + len + hw, s + len + hw);
    index.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
    s += len;
  });
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('aAlong', new Float32BufferAttribute(along, 1));
  geometry.setIndex(index);
  return { geometry, perimeter: s };
}

export function Footprint() {
  const assets = useMemo(() => {
    const stadium = stadiumTexture();
    const stadiumGeometry = new PlaneGeometry(stadium.size[0], stadium.size[1]).rotateX(-Math.PI / 2);
    const stadiumMaterial = new ShaderMaterial({
      name: 'talk-stadium',
      uniforms: UniformsUtils.merge([UniformsLib.fog, { uMap: { value: null }, uReveal: { value: 0 } }]),
      vertexShader: /* glsl */ `
varying vec2 vUv;
${FOG_VERTEX}
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
	vec4 t = texture2D( uMap, vUv );
	a *= t.a;
	if ( a < 0.004 ) discard;
	gl_FragColor = vec4( t.rgb, a * 0.96 );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,
      transparent: true,
      depthWrite: false,
      fog: true,
    });
    stadiumMaterial.uniforms.uMap!.value = stadium.texture;

    const outline = outlineGeometry(F.block.x, F.block.z, 1.4);
    const outlineMaterial = new ShaderMaterial({
      name: 'talk-block-outline',
      uniforms: UniformsUtils.merge([UniformsLib.fog, { uDrawn: { value: 0 }, uColor: { value: new Color('#e6eaee') } }]),
      vertexShader: /* glsl */ `
attribute float aAlong;
varying float vAlong;
${FOG_VERTEX}
void main() {
	vAlong = aAlong;
	vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
	gl_Position = projectionMatrix * mvPosition;
	#include <fog_vertex>
}`,
      fragmentShader: /* glsl */ `
uniform float uDrawn;
uniform vec3 uColor;
varying float vAlong;
#include <fog_pars_fragment>
void main() {
	// Drawn on along the perimeter; 6 m dashes with 3 m gaps.
	if ( vAlong > uDrawn ) discard;
	if ( mod( vAlong, 9.0 ) > 6.0 ) discard;
	gl_FragColor = vec4( uColor, 0.92 );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
      fog: true,
    });
    return { stadium, stadiumGeometry, stadiumMaterial, outline, outlineMaterial };
  }, []);
  const stadiumGroup = useRef<Group>(null);
  const blockGroup = useRef<Group>(null);

  useEffect(
    () => () => {
      assets.stadium.texture.dispose();
      assets.stadiumGeometry.dispose();
      assets.stadiumMaterial.dispose();
      assets.outline.geometry.dispose();
      assets.outlineMaterial.dispose();
    },
    [assets],
  );

  useFrame(() => {
    const block = world['q.block'];
    const stadium = world['q.stadium'];
    if (blockGroup.current) blockGroup.current.visible = block > 0.001;
    if (stadiumGroup.current) stadiumGroup.current.visible = stadium > 0.001;
    assets.outlineMaterial.uniforms.uDrawn!.value = block * (assets.outline.perimeter + 2);
    assets.stadiumMaterial.uniforms.uReveal!.value = stadium;
  }, -80);

  return (
    <>
      <group ref={blockGroup} name="talk-block-outline" visible={false}>
        <mesh geometry={assets.outline.geometry} material={assets.outlineMaterial} position-y={F.y.block} renderOrder={-1} />
      </group>
      <group ref={stadiumGroup} name="talk-stadium" visible={false}>
        <mesh geometry={assets.stadiumGeometry} material={assets.stadiumMaterial} position={[F.pitch.center[0], F.y.stadium, F.pitch.center[1]]} renderOrder={-1} />
      </group>
    </>
  );
}
