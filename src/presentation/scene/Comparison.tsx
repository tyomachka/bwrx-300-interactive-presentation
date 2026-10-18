/**
 * Presentation v1, "what small modular changes" (talk only):
 *  - k.large       a large BWR-family unit (the ESBWR class, ~1,535 MW net) is built up from its apron
 *                  west of our BWRX-300, at the same scale and on the same baseline
 *                  (presentation/scene/comparisonLayout.ts);
 *  - k.modules     four more BWRX-300 power blocks are built one after another north of ours
 *                  (reactor building first, then the turbine hall): 5 x 300 MW;
 *  - k.largeDim    the large unit steps back into the X-ray dither while the copies are built;
 *  - k.vessels     the two reactor vessels as amber outlines on grade in front of their reactor
 *                  buildings, at their sourced inside dimensions: about as tall, far wider;
 *  - k.fade, k.modulesFade   leaving: the buildings dissolve where they stand (a screen-door dissolve
 *                  on their own material copies), never sink into the ground.
 *
 * [MATCHED SCALE · LAYOUT ILLUSTRATIVE] One ground scale and one camera for both. The large unit is a
 * simplified BWR plant massing (comparisonLayout.ts says how it is sized), not a drawing of a design;
 * the vessels themselves are compared exactly (here and in TalkOverlay.tsx VesselDiagram). The copies
 * are our plant's own reactor building and turbine hall massing, without the support buildings.
 * Construction-style growth from grade (the base never leaves the ground), not a claim that anything
 * arrives assembled.
 */
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import {
  BoxGeometry,
  CanvasTexture,
  Color,
  ConeGeometry,
  CylinderGeometry,
  LatheGeometry,
  MathUtils,
  MeshBasicMaterial,
  PlaneGeometry,
  ShaderMaterial,
  UniformsLib,
  UniformsUtils,
  Vector2,
  type BufferGeometry,
  type Group,
  type IUniform,
  type Mesh,
  type MeshStandardMaterial,
  type WebGLProgramParametersWithUniforms,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { RADIAL_SEGMENTS } from '../../config/quality';
import { REACTOR_BUILDING as RB, TURBINE_BUILDING as TB } from '../../scene/plant/dimensions';
import { cloneForComponent, getPlantMaterials } from '../../scene/plant/materials';
import { requestShadowUpdate } from '../../scene/section/sectionLayers';
import { createExploreUniforms } from '../../scene/section/sectionShader';
import { useQualityPreset } from '../../state/store';
import { COLOR } from '../design';
import { world } from '../world';
import { GHOST_VESSELS, LARGE_UNIT as LARGE, MODULE_OFFSETS } from './comparisonLayout';

const box = (size: readonly [number, number, number], at: readonly [number, number, number]) =>
  new BoxGeometry(size[0], size[1], size[2]).translate(at[0], at[1] + size[1] / 2, at[2]);

const merge = (parts: BufferGeometry[]) => {
  const g = mergeGeometries(parts.map((p) => (p.index ? p.toNonIndexed() : p)), false)!;
  parts.forEach((p) => p.dispose());
  return g;
};

/**
 * A talk-only screen-door dissolve on a section-shader material copy: fragments are kept while the
 * coverage is above the material's own 4 x 4 ordered-dither threshold (the X-ray ghost's pattern,
 * stable in screen space). Coverage 1 is the untouched material.
 */
function withDissolve(material: MeshStandardMaterial, coverage: IUniform<number>): MeshStandardMaterial {
  const install = material.onBeforeCompile;
  material.onBeforeCompile = (shader: WebGLProgramParametersWithUniforms, renderer) => {
    install.call(material, shader, renderer);
    shader.uniforms.uTalkCoverage = coverage;
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uTalkCoverage;')
      .replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\n\tif ( uTalkCoverage < 0.999 && uTalkCoverage < exploreBayer( gl_FragCoord.xy ) ) discard;');
  };
  material.customProgramCacheKey = () => 'bwrx-section-v1+talk-dissolve';
  return material;
}

function softShadow(opacity: number): MeshBasicMaterial {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(64, 64, 8, 64, 64, 64);
  g.addColorStop(0, 'rgba(0,0,0,0.55)');
  g.addColorStop(0.6, 'rgba(0,0,0,0.3)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return new MeshBasicMaterial({ map: new CanvasTexture(canvas), transparent: true, depthWrite: false, opacity });
}

function buildLarge() {
  const { reactor, reactorTop, turbine, control, radwaste, apron } = LARGE;
  // Reactor building (a roof lip and its refuelling-floor enclosure) and the auxiliary buildings: one
  // pale concrete draw.
  const lip = (s: readonly [number, number, number], o: readonly [number, number, number]) => box([s[0] + 0.8, 0.9, s[2] + 0.8], [o[0], s[1] - 0.9, o[2]]);
  const concrete = merge([
    box(reactor.size, reactor.offset),
    lip(reactor.size, reactor.offset),
    box(reactorTop.size, reactorTop.offset),
    box(control.size, control.offset),
    lip(control.size, control.offset),
    box(radwaste.size, radwaste.offset),
    lip(radwaste.size, radwaste.offset),
  ]);
  // Turbine hall with a roof monitor along its length.
  const hall = merge([box(turbine.size, turbine.offset), box([turbine.size[0] - 8, 3, turbine.size[2] * 0.42], [turbine.offset[0], turbine.size[1], turbine.offset[2]])]);
  const pad = box([apron.x[1] - apron.x[0], apron.top, apron.z[1] - apron.z[0]], [(apron.x[0] + apron.x[1]) / 2, 0, (apron.z[0] + apron.z[1]) / 2]);
  return { concrete, hall, pad };
}

function buildModule(segments: number) {
  const reactor = merge([
    new CylinderGeometry(RB.aboveGradeRadius, RB.aboveGradeRadius, RB.aboveGradeHeight, segments).translate(0, RB.aboveGradeHeight / 2, 0),
    new ConeGeometry(RB.aboveGradeRadius + RB.roofOverhang, RB.roofRise, segments).translate(0, RB.aboveGradeHeight + RB.roofRise / 2, 0),
  ]);
  const length = TB.x[1] - TB.x[0];
  const width = TB.z[1] - TB.z[0];
  const hall = box([length, TB.height, width], [(TB.x[0] + TB.x[1]) / 2, 0, (TB.z[0] + TB.z[1]) / 2]);
  return { reactor, hall };
}

/** A vessel's inside outline turned about its axis: a cylinder with rounded heads, standing on y = 0. */
function vesselGeometry(diameter: number, height: number, segments: number): LatheGeometry {
  const r = diameter / 2;
  const head = r * 0.75;
  const pts: Vector2[] = [];
  const steps = 8;
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * (Math.PI / 2);
    pts.push(new Vector2(Math.max(r * Math.sin(a), 0.001), head - head * Math.cos(a)));
  }
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * (Math.PI / 2);
    pts.push(new Vector2(Math.max(r * Math.cos(a), 0.001), height - head + head * Math.sin(a)));
  }
  return new LatheGeometry(pts, segments);
}

/** Amber outline shell: nearly clear face-on, a soft bright rim at the silhouette (reads as a drawn outline). */
function ghostVesselMaterial(): ShaderMaterial {
  return new ShaderMaterial({
    name: 'talk-ghost-vessel',
    uniforms: UniformsUtils.merge([UniformsLib.fog, { uAlpha: { value: 0 }, uColor: { value: new Color(COLOR.amber) } }]),
    vertexShader: /* glsl */ `
varying vec3 vNormal;
varying vec3 vView;
#include <fog_pars_vertex>
void main() {
	vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
	vNormal = normalize( normalMatrix * normal );
	vView = -mvPosition.xyz;
	gl_Position = projectionMatrix * mvPosition;
	#include <fog_vertex>
}`,
    fragmentShader: /* glsl */ `
uniform float uAlpha;
uniform vec3 uColor;
varying vec3 vNormal;
varying vec3 vView;
#include <fog_pars_fragment>
void main() {
	float facing = abs( dot( normalize( vNormal ), normalize( vView ) ) );
	float rim = pow( 1.0 - facing, 2.2 );
	float a = uAlpha * ( 0.12 + 0.85 * rim );
	if ( a < 0.004 ) discard;
	gl_FragColor = vec4( uColor * ( 0.75 + 0.5 * rim ), a );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,
    transparent: true,
    depthWrite: false,
    fog: true,
  });
}

const ease = (x: number) => MathUtils.smootherstep(x, 0, 1);

export function Comparison() {
  const segments = RADIAL_SEGMENTS[useQualityPreset().geometryLod];
  const large = useMemo(() => buildLarge(), []);
  const unit = useMemo(() => buildModule(segments), [segments]);
  const vessels = useMemo(() => GHOST_VESSELS.map((v) => vesselGeometry(v.diameter, v.height, Math.max(24, segments))), [segments]);
  const m = getPlantMaterials();
  // Own copies (same programs, plus the dissolve) so the large unit can ghost alone and both can
  // leave without touching the plant's shared materials.
  const mats = useMemo(() => {
    const largeCoverage: IUniform<number> = { value: 1 };
    const moduleCoverage: IUniform<number> = { value: 1 };
    const ghostUniforms = createExploreUniforms();
    const concrete = withDissolve(cloneForComponent(m.supportCladding, ghostUniforms), largeCoverage);
    concrete.color.set('#8b8f93');
    const hall = withDissolve(cloneForComponent(m.darkMetal, ghostUniforms), largeCoverage);
    const pad = withDissolve(cloneForComponent(m.concreteDark, ghostUniforms), largeCoverage);
    pad.color.set('#3d4044');
    const pale = withDissolve(cloneForComponent(m.supportCladding, createExploreUniforms()), moduleCoverage);
    pale.color.set('#8b8f93');
    const moduleHall = withDissolve(cloneForComponent(m.darkMetal, createExploreUniforms()), moduleCoverage);
    return { concrete, hall, pad, pale, moduleHall, ghostUniforms, largeCoverage, moduleCoverage, shadow: softShadow(0), moduleShadow: softShadow(0.7), vessel: ghostVesselMaterial() };
  }, [m]);
  const shadowGeometry = useMemo(() => new PlaneGeometry(1, 1).rotateX(-Math.PI / 2), []);

  const root = useRef<Group>(null);
  const largeRoot = useRef<Group>(null);
  const largeParts = useRef<(Group | null)[]>([]);
  const largeShadow = useRef<Mesh>(null);
  const moduleReactors = useRef<(Group | null)[]>([]);
  const moduleHalls = useRef<(Group | null)[]>([]);
  const moduleShadows = useRef<(Mesh | null)[]>([]);
  const vesselGroup = useRef<Group>(null);

  useEffect(
    () => () => {
      for (const g of [large.concrete, large.hall, large.pad, unit.reactor, unit.hall, shadowGeometry, ...vessels]) g.dispose();
    },
    [large, unit, shadowGeometry, vessels],
  );
  useEffect(
    () => () => {
      for (const mat of [mats.concrete, mats.hall, mats.pad, mats.pale, mats.moduleHall] as MeshStandardMaterial[]) mat.dispose();
      for (const shadow of [mats.shadow, mats.moduleShadow]) {
        shadow.map?.dispose();
        shadow.dispose();
      }
      mats.vessel.dispose();
    },
    [mats],
  );

  useFrame(() => {
    const show = world['k.show'] > 0.5;
    if (root.current && root.current.visible !== show) {
      root.current.visible = show;
      requestShadowUpdate();
    }
    if (!show) return;
    const keep = 1 - world['k.fade'];
    const moduleKeep = keep * (1 - world['k.modulesFade']);
    mats.largeCoverage.value = keep;
    mats.moduleCoverage.value = moduleKeep;

    // Large unit: its apron is there from the start; the reactor and auxiliary buildings, then the
    // turbine hall, are built up from grade (staggered).
    const p = world['k.large'];
    if (largeRoot.current) largeRoot.current.visible = p > 0.002 && keep > 0.002;
    const stagger = [
      [0, 0.7],
      [0.3, 1],
    ] as const;
    largeParts.current.forEach((g, i) => {
      if (!g) return;
      const [a, b] = stagger[i]!;
      const s = ease(MathUtils.clamp((p - a) / (b - a), 0, 1));
      g.scale.y = Math.max(s, 1e-3);
      g.visible = s > 0.002;
    });
    if (largeShadow.current) {
      largeShadow.current.visible = p > 0.002;
      mats.shadow.opacity = ease(p) * (1 - 0.6 * world['k.largeDim']) * keep;
    }
    mats.ghostUniforms.uExploreGhost.value = 0.82 * world['k.largeDim'];

    // Modules: each is built over one unit of k.modules, reactor building first.
    const k = world['k.modules'];
    mats.moduleShadow.opacity = 0.7 * moduleKeep;
    MODULE_OFFSETS.forEach((_, i) => {
      const local = MathUtils.clamp(k - i, 0, 1);
      const r = ease(MathUtils.clamp(local / 0.6, 0, 1));
      const h = ease(MathUtils.clamp((local - 0.35) / 0.65, 0, 1));
      const reactor = moduleReactors.current[i];
      const hall = moduleHalls.current[i];
      const shadow = moduleShadows.current[i];
      if (reactor) {
        reactor.scale.y = Math.max(r, 1e-3);
        reactor.visible = r > 0.002 && moduleKeep > 0.002;
      }
      if (hall) {
        hall.scale.y = Math.max(h, 1e-3);
        hall.visible = h > 0.002 && moduleKeep > 0.002;
      }
      if (shadow) shadow.visible = local > 0.002 && moduleKeep > 0.002;
    });

    const v = world['k.vessels'] * keep;
    mats.vessel.uniforms.uAlpha!.value = v;
    if (vesselGroup.current) vesselGroup.current.visible = v > 0.002;
  }, -80);

  const [cx, , cz] = LARGE.center;
  return (
    <group ref={root} name="talk-comparison" visible={false}>
      <group ref={largeRoot} position={[cx, 0, cz]}>
        <mesh geometry={large.pad} material={mats.pad} receiveShadow />
        <group ref={(g) => void (largeParts.current[0] = g)}>
          <mesh geometry={large.concrete} material={mats.concrete} castShadow receiveShadow />
        </group>
        <group ref={(g) => void (largeParts.current[1] = g)}>
          <mesh geometry={large.hall} material={mats.hall} castShadow receiveShadow />
        </group>
        <mesh ref={largeShadow} geometry={shadowGeometry} material={mats.shadow} position={LARGE.shadow.offset} scale={LARGE.shadow.scale} renderOrder={-1} />
      </group>
      {MODULE_OFFSETS.map((dz, i) => (
        <group key={dz} position={[0, 0, dz]}>
          <group ref={(g) => void (moduleReactors.current[i] = g)}>
            <mesh geometry={unit.reactor} material={mats.pale} castShadow receiveShadow />
          </group>
          <group ref={(g) => void (moduleHalls.current[i] = g)}>
            <mesh geometry={unit.hall} material={mats.moduleHall} castShadow receiveShadow />
          </group>
          <mesh
            ref={(s) => void (moduleShadows.current[i] = s)}
            geometry={shadowGeometry}
            material={mats.moduleShadow}
            position={[42, 0.2, 0]}
            scale={[170, 1, 80]}
            renderOrder={-1}
          />
        </group>
      ))}
      <group ref={vesselGroup} name="talk-ghost-vessels" visible={false}>
        {GHOST_VESSELS.map((v, i) => (
          <mesh key={v.id} geometry={vessels[i]} material={mats.vessel} position={[v.x, 0.14, v.z]} renderOrder={2} />
        ))}
      </group>
    </group>
  );
}
